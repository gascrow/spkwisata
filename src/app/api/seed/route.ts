import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  INITIAL_CLUSTERS,
  INITIAL_CRITERIA,
  INITIAL_SUB_CRITERIA,
  INITIAL_ALTERNATIVES,
  INITIAL_SCORES_MAP,
  INITIAL_REFERENCES,
  INITIAL_SETTINGS,
  INITIAL_AHP_MATRICES_LIST,
} from "@/lib/initialData";

export async function POST() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (
      !url ||
      url.includes("[your-project]") ||
      url.includes("placeholder") ||
      !key ||
      key.includes("[your-service-role-key]") ||
      key.includes("placeholder")
    ) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const results: string[] = [];

    // 1. Seed clusters
    for (const c of INITIAL_CLUSTERS) {
      await supabaseAdmin.from("clusters").upsert(
        { id: c.id, name: c.name, description: c.description, color: c.color },
        { onConflict: "id" }
      );
    }
    results.push(`clusters: ${INITIAL_CLUSTERS.length}`);

    // 2. Seed criteria
    for (const c of INITIAL_CRITERIA) {
      await supabaseAdmin.from("criteria").upsert(
        {
          id: c.id,
          code: c.code,
          name: c.name,
          type: c.type,
          description: c.description,
          weight: c.weight,
          sort_order: c.sort_order,
        },
        { onConflict: "id" }
      );
    }
    results.push(`criteria: ${INITIAL_CRITERIA.length}`);

    // 3. Seed sub_criteria
    // Delete existing first to avoid duplicates
    await supabaseAdmin.from("sub_criteria").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const subRows = INITIAL_SUB_CRITERIA.map((s) => ({
      criteria_id: s.criteria_id,
      score_value: s.score_value,
      label: s.label,
      description: s.description,
    }));
    if (subRows.length > 0) {
      await supabaseAdmin.from("sub_criteria").insert(subRows);
    }
    results.push(`sub_criteria: ${subRows.length}`);

    // 4. Seed alternatives
    for (const a of INITIAL_ALTERNATIVES) {
      await supabaseAdmin.from("alternatives").upsert(
        {
          id: a.id,
          code: a.code,
          name: a.name,
          cluster_id: a.cluster_id,
          description: a.description,
          address: a.address,
          latitude: a.latitude,
          longitude: a.longitude,
          image_url: a.image_url,
          is_active: a.is_active,
        },
        { onConflict: "id" }
      );
    }
    results.push(`alternatives: ${INITIAL_ALTERNATIVES.length}`);

    // 5. Seed scores
    await supabaseAdmin.from("scores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const scoreRows: { alternative_id: string; criteria_id: string; score_value: number }[] = [];
    INITIAL_ALTERNATIVES.forEach((alt) => {
      const scoreMapping = INITIAL_SCORES_MAP[alt.code] || {};
      INITIAL_CRITERIA.forEach((crit) => {
        const val = scoreMapping[crit.code] || 3.0;
        scoreRows.push({
          alternative_id: alt.id,
          criteria_id: crit.id,
          score_value: val,
        });
      });
    });
    // Insert in batches to avoid payload too large
    const BATCH_SIZE = 50;
    for (let i = 0; i < scoreRows.length; i += BATCH_SIZE) {
      await supabaseAdmin.from("scores").insert(scoreRows.slice(i, i + BATCH_SIZE));
    }
    results.push(`scores: ${scoreRows.length}`);

    // 6. Seed AHP matrices
    await supabaseAdmin.from("ahp_matrices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const ahpRows = INITIAL_AHP_MATRICES_LIST.map((m) => ({
      session_name: m.session_name,
      criteria_i_id: m.criteria_i_id,
      criteria_j_id: m.criteria_j_id,
      value: m.value,
    }));
    if (ahpRows.length > 0) {
      await supabaseAdmin.from("ahp_matrices").insert(ahpRows);
    }
    results.push(`ahp_matrices: ${ahpRows.length}`);

    // 7. Seed references
    await supabaseAdmin.from("references_docs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const refRows = INITIAL_REFERENCES.map((r) => ({
      category: r.category,
      title: r.title,
      number: r.number,
      year: r.year,
      publisher: r.publisher,
      description: r.description,
      url: r.url,
      sort_order: r.sort_order,
    }));
    if (refRows.length > 0) {
      await supabaseAdmin.from("references_docs").insert(refRows);
    }
    results.push(`references_docs: ${refRows.length}`);

    // 8. Seed app_settings
    for (const s of INITIAL_SETTINGS) {
      await supabaseAdmin.from("app_settings").upsert(
        { key: s.key, value: s.value },
        { onConflict: "key" }
      );
    }
    results.push(`app_settings: ${INITIAL_SETTINGS.length}`);

    return NextResponse.json({
      success: true,
      data: { seeded: results },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Seed failed" },
      { status: 500 }
    );
  }
}
