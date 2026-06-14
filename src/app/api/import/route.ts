import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { db } from "@/lib/db";

// ─── CSV PARSER (handles quoted fields) ──────────────────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current.trim());
        current = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(current.trim());
        current = "";
        if (row.some((v) => v !== "")) rows.push(row);
        row = [];
      } else {
        current += ch;
      }
    }
  }
  // last cell
  row.push(current.trim());
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

function csvToObjects(text: string): Record<string, string>[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.toLowerCase().trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] ?? "";
    });
    return obj;
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────
async function lookupMap(
  table: string,
  keyCol: string,
  valCol: string
): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin.from(table).select(`${keyCol},${valCol}`);
  const map: Record<string, string> = {};
  (data || []).forEach((r: any) => {
    map[r[keyCol]] = r[valCol];
  });
  return map;
}

// ─── IMPORT HANDLERS ─────────────────────────────────────────────
async function importClusters(rows: Record<string, string>[]) {
  let count = 0;
  for (const r of rows) {
    if (!r.name) continue;
    // Check if cluster with this name already exists
    const { data: existing } = await supabaseAdmin
      .from("clusters")
      .select("id")
      .eq("name", r.name)
      .single();

    if (existing) {
      await supabaseAdmin.from("clusters").update({
        description: r.description || null,
        color: r.color || "#3b82f6",
      }).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("clusters").insert({
        name: r.name,
        description: r.description || null,
        color: r.color || "#3b82f6",
      });
    }
    count++;
  }
  return count;
}

async function importCriteria(rows: Record<string, string>[]) {
  let count = 0;
  for (const r of rows) {
    if (!r.code || !r.name) continue;
    await supabaseAdmin.from("criteria").upsert(
      {
        code: r.code,
        name: r.name,
        type: r.type === "cost" ? "cost" : "benefit",
        description: r.description || null,
        sort_order: parseInt(r.sort_order) || 0,
      },
      { onConflict: "code" }
    );
    count++;
  }
  return count;
}

async function importSubCriteria(rows: Record<string, string>[]) {
  const critMap = await lookupMap("criteria", "code", "id");
  let count = 0;
  for (const r of rows) {
    const cid = critMap[r.criteria_code];
    if (!cid) continue;
    try {
      await supabaseAdmin.from("sub_criteria").insert({
        criteria_id: cid,
        score_value: parseFloat(r.score_value) || 1,
        label: r.label || "",
        description: r.description || null,
      });
      count++;
    } catch {
      // Skip duplicate or constraint errors gracefully
    }
  }
  return count;
}

async function importAlternatives(rows: Record<string, string>[]) {
  const clusterMap = await lookupMap("clusters", "name", "id");
  let count = 0;
  for (const r of rows) {
    if (!r.code || !r.name) continue;
    const clusterId = clusterMap[r.cluster_name] || null;
    await supabaseAdmin.from("alternatives").upsert(
      {
        code: r.code,
        name: r.name,
        cluster_id: clusterId,
        description: r.description || null,
        address: r.address || null,
        latitude: r.latitude ? parseFloat(r.latitude) : null,
        longitude: r.longitude ? parseFloat(r.longitude) : null,
        image_url: r.image_url || null,
        is_active: r.is_active !== "false",
      },
      { onConflict: "code" }
    );
    count++;
  }
  return count;
}

async function importScores(rows: Record<string, string>[]) {
  const altMap = await lookupMap("alternatives", "code", "id");
  const critMap = await lookupMap("criteria", "code", "id");
  let count = 0;
  for (const r of rows) {
    const altId = altMap[r.alternative_code];
    if (!altId) continue;
    for (const [key, val] of Object.entries(r)) {
      if (key === "alternative_code") continue;
      const critId = critMap[key.toUpperCase()];
      if (!critId || val === "") continue;
      await supabaseAdmin.from("scores").upsert(
        {
          alternative_id: altId,
          criteria_id: critId,
          score_value: parseFloat(val) || 0,
        },
        { onConflict: "alternative_id,criteria_id" }
      );
      count++;
    }
  }
  return count;
}

async function importAhpMatrices(rows: Record<string, string>[]) {
  const critMap = await lookupMap("criteria", "code", "id");
  let count = 0;
  for (const r of rows) {
    const ci = critMap[r.criteria_i_code];
    const cj = critMap[r.criteria_j_code];
    if (!ci || !cj) continue;
    await supabaseAdmin.from("ahp_matrices").upsert(
      {
        session_name: r.session_name || "Skenario A",
        criteria_i_id: ci,
        criteria_j_id: cj,
        value: parseFloat(r.value) || 1,
      },
      { onConflict: "session_name,criteria_i_id,criteria_j_id" }
    );
    count++;
  }
  return count;
}

async function importReferences(rows: Record<string, string>[]) {
  let count = 0;
  for (const r of rows) {
    if (!r.title) continue;
    try {
      await supabaseAdmin.from("references_docs").insert({
        category: r.category || "Lainnya",
        title: r.title,
        number: r.number || null,
        year: r.year ? parseInt(r.year) : null,
        publisher: r.publisher || null,
        description: r.description || null,
        url: r.url || null,
        sort_order: parseInt(r.sort_order) || 0,
      });
      count++;
    } catch {
      // Skip duplicate or constraint errors gracefully
    }
  }
  return count;
}

async function importAll(jsonData: any) {
  const results: Record<string, number | string> = {};
  if (jsonData.clusters) {
    try { results.clusters = await importClusters(jsonData.clusters); } catch (e: any) { results.clusters = `error: ${e.message}`; }
  }
  if (jsonData.criteria) {
    try { results.criteria = await importCriteria(jsonData.criteria); } catch (e: any) { results.criteria = `error: ${e.message}`; }
  }
  if (jsonData.sub_criteria) {
    try { results.sub_criteria = await importSubCriteria(jsonData.sub_criteria); } catch (e: any) { results.sub_criteria = `error: ${e.message}`; }
  }
  if (jsonData.alternatives) {
    try { results.alternatives = await importAlternatives(jsonData.alternatives); } catch (e: any) { results.alternatives = `error: ${e.message}`; }
  }
  if (jsonData.scores) {
    try { results.scores = await importScores(jsonData.scores); } catch (e: any) { results.scores = `error: ${e.message}`; }
  }
  if (jsonData.ahp_matrices) {
    try { results.ahp_matrices = await importAhpMatrices(jsonData.ahp_matrices); } catch (e: any) { results.ahp_matrices = `error: ${e.message}`; }
  }
  if (jsonData.references) {
    try { results.references = await importReferences(jsonData.references); } catch (e: any) { results.references = `error: ${e.message}`; }
  }
  return results;
}

// ─── MAIN POST HANDLER ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = formData.get("type") as string;
    const file = formData.get("file") as File | null;

    if (!type || !file) {
      return NextResponse.json(
        { success: false, error: "Missing 'type' or 'file' field" },
        { status: 400 }
      );
    }

    const text = await file.text();

    if (type === "all") {
      // Expect JSON format
      const jsonData = JSON.parse(text);
      const results = await importAll(jsonData);
      return NextResponse.json({ success: true, data: { imported: results } });
    }

    const rows = csvToObjects(text);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "CSV file is empty or invalid" }, { status: 400 });
    }

    let count = 0;
    switch (type) {
      case "clusters":
        count = await importClusters(rows);
        break;
      case "criteria":
        count = await importCriteria(rows);
        break;
      case "sub_criteria":
        count = await importSubCriteria(rows);
        break;
      case "alternatives":
        count = await importAlternatives(rows);
        break;
      case "scores":
        count = await importScores(rows);
        break;
      case "ahp_matrices":
        count = await importAhpMatrices(rows);
        break;
      case "references":
        count = await importReferences(rows);
        break;
      default:
        return NextResponse.json({ success: false, error: `Unknown import type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { type, imported: count } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}

// ─── DELETE: Reset all data ─────────────────────────────────────
export async function DELETE() {
  try {
    const result = await db.resetAllData();
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Reset failed" },
      { status: 500 }
    );
  }
}
