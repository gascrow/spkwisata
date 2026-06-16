// ================================================================
// DATABASE LAYER — SUPABASE ONLY (Vercel-compatible)
// ================================================================
// All filesystem operations removed. Data is stored exclusively in Supabase.
// Run the seed endpoint (/api/seed) once after initial Supabase setup.

import { supabaseAdmin } from "./supabase/server";
import {
  Cluster,
  Criteria,
  SubCriteria,
  Alternative,
  Score,
  AhpMatrix,
  AhpResult,
  TopsisResult,
  TopsisNormalized,
  ReferenceDoc,
  AppSetting,
} from "@/types";

function assertSupabaseConfigured() {
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
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables."
    );
  }
}

function handleSupabaseError(error: { message: string }, context: string) {
  throw new Error(`[Supabase ${context}] ${error.message}`);
}

// ================================================================
// DATABASE METHODS
// ================================================================

export const db = {
  // --- CLUSTERS ---
  async getClusters(): Promise<Cluster[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabaseAdmin.from("clusters").select("*").order("name");
    if (error) handleSupabaseError(error, "getClusters");
    return (data as Cluster[]) || [];
  },

  // --- ALTERNATIVES (WITH CLUSTERS & SCORES) ---
  async getAlternatives(): Promise<Alternative[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabaseAdmin
      .from("alternatives")
      .select(
        `
        *,
        cluster:clusters(*),
        scores:scores(
          *,
          criteria:criteria(*)
        )
      `
      )
      .order("code");
    if (error) handleSupabaseError(error, "getAlternatives");
    return (data as unknown as Alternative[]) || [];
  },

  async saveAlternative(altData: {
    id?: string;
    code: string;
    name: string;
    cluster_id: string;
    description?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    image_url?: string;
    is_active: boolean;
    scores: Record<string, number>;
  }): Promise<Alternative> {
    assertSupabaseConfigured();

    const payload = {
      code: altData.code,
      name: altData.name,
      cluster_id: altData.cluster_id,
      description: altData.description || null,
      address: altData.address || null,
      latitude: altData.latitude || null,
      longitude: altData.longitude || null,
      image_url: altData.image_url || null,
      is_active: altData.is_active,
      updated_at: new Date().toISOString(),
    };

    let alternativeId = altData.id;

    if (alternativeId) {
      const { error } = await supabaseAdmin.from("alternatives").update(payload).eq("id", alternativeId);
      if (error) handleSupabaseError(error, "saveAlternative:update");
    } else {
      const { data, error } = await supabaseAdmin.from("alternatives").insert(payload).select().single();
      if (error) handleSupabaseError(error, "saveAlternative:insert");
      alternativeId = data.id;
    }

    // Upsert scores
    const scoreRows = Object.entries(altData.scores).map(([criteriaId, scoreVal]) => ({
      alternative_id: alternativeId!,
      criteria_id: criteriaId,
      score_value: scoreVal,
      updated_at: new Date().toISOString(),
    }));

    for (const row of scoreRows) {
      await supabaseAdmin.from("scores").upsert(row, { onConflict: "alternative_id,criteria_id" });
    }

    const { data: freshAlt, error: fetchErr } = await supabaseAdmin
      .from("alternatives")
      .select("*, cluster:clusters(*), scores:scores(*)")
      .eq("id", alternativeId)
      .single();
    if (fetchErr) handleSupabaseError(fetchErr, "saveAlternative:fetch");
    return freshAlt as unknown as Alternative;
  },

  async deleteAlternative(id: string): Promise<boolean> {
    assertSupabaseConfigured();
    const { error } = await supabaseAdmin.from("alternatives").delete().eq("id", id);
    if (error) handleSupabaseError(error, "deleteAlternative");
    return true;
  },

  // --- CRITERIA & SUB_CRITERIA ---
  async getCriteria(): Promise<Criteria[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabaseAdmin
      .from("criteria")
      .select(`*, sub_criteria(*)`)
      .order("sort_order");
    if (error) handleSupabaseError(error, "getCriteria");
    return ((data as unknown as Criteria[]) || []).map((c) => ({
      ...c,
      sub_criteria: (c.sub_criteria || []).sort((a, b) => a.score_value - b.score_value),
    }));
  },

  async saveCriteria(crit: {
    id?: string;
    code: string;
    name: string;
    type: "benefit" | "cost";
    description?: string;
    sort_order: number;
  }): Promise<Criteria> {
    assertSupabaseConfigured();

    const payload = {
      code: crit.code,
      name: crit.name,
      type: crit.type,
      description: crit.description || null,
      sort_order: crit.sort_order,
      updated_at: new Date().toISOString(),
    };

    let critId = crit.id;
    if (critId) {
      const { error } = await supabaseAdmin.from("criteria").update(payload).eq("id", critId);
      if (error) handleSupabaseError(error, "saveCriteria:update");
    } else {
      const { data, error } = await supabaseAdmin.from("criteria").insert(payload).select().single();
      if (error) handleSupabaseError(error, "saveCriteria:insert");
      critId = data.id;

      // Auto-create default sub-criteria for new criteria
      const labels = ["Tidak Baik", "Kurang Baik", "Baik", "Sangat Baik"];
      const subRows = labels.map((lbl, idx) => ({
        criteria_id: critId!,
        score_value: idx + 1,
        label: lbl,
        description: `Deskripsi sub kriteria ${lbl} untuk ${crit.name}`,
      }));
      const { error: subErr } = await supabaseAdmin.from("sub_criteria").insert(subRows);
      if (subErr) handleSupabaseError(subErr, "saveCriteria:insertSub");
    }

    const { data: fresh, error: fetchErr } = await supabaseAdmin
      .from("criteria")
      .select("*, sub_criteria(*)")
      .eq("id", critId)
      .single();
    if (fetchErr) handleSupabaseError(fetchErr, "saveCriteria:fetch");
    return fresh as unknown as Criteria;
  },

  async saveSubCriteria(sub: {
    id?: string;
    criteria_id: string;
    score_value: number;
    label: string;
    description: string;
  }): Promise<SubCriteria> {
    assertSupabaseConfigured();

    const payload = {
      criteria_id: sub.criteria_id,
      score_value: sub.score_value,
      label: sub.label,
      description: sub.description,
    };

    let res;
    if (sub.id) {
      res = await supabaseAdmin.from("sub_criteria").update(payload).eq("id", sub.id).select().single();
    } else {
      res = await supabaseAdmin.from("sub_criteria").insert(payload).select().single();
    }
    if (res.error) handleSupabaseError(res.error, "saveSubCriteria");
    return res.data as SubCriteria;
  },

  // --- AHP MATRICES ---
  async getAhpMatrices(sessionName: string = "Skenario A"): Promise<AhpMatrix[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabaseAdmin.from("ahp_matrices").select("*").eq("session_name", sessionName);
    if (error) handleSupabaseError(error, "getAhpMatrices");
    return (data as AhpMatrix[]) || [];
  },

  async saveAhpMatrices(
    sessionName: string = "Skenario A",
    matrices: { criteria_i_id: string; criteria_j_id: string; value: number }[]
  ): Promise<boolean> {
    assertSupabaseConfigured();

    const rows = matrices.map((m) => ({
      session_name: sessionName,
      criteria_i_id: m.criteria_i_id,
      criteria_j_id: m.criteria_j_id,
      value: m.value,
      updated_at: new Date().toISOString(),
    }));

    for (const row of rows) {
      const { error } = await supabaseAdmin.from("ahp_matrices").upsert(row, {
        onConflict: "session_name,criteria_i_id,criteria_j_id",
      });
      if (error) handleSupabaseError(error, "saveAhpMatrices");
    }
    return true;
  },

  // --- AHP RESULTS ---
  async getAhpResults(sessionName: string = "Skenario A"): Promise<AhpResult[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabaseAdmin
      .from("ahp_results")
      .select("*, criteria:criteria(*)")
      .eq("session_name", sessionName);
    if (error) handleSupabaseError(error, "getAhpResults");
    return (data as unknown as AhpResult[]) || [];
  },

  async saveAhpResults(
    sessionName: string = "Skenario A",
    weightsMap: Record<string, number>,
    lambdaMax: number,
    ci: number,
    cr: number,
    isConsistent: boolean
  ): Promise<boolean> {
    assertSupabaseConfigured();

    // Delete old results
    await supabaseAdmin.from("ahp_results").delete().eq("session_name", sessionName);

    const rows = Object.entries(weightsMap).map(([criteriaId, w]) => ({
      session_name: sessionName,
      criteria_id: criteriaId,
      weight: w,
      lambda_max: lambdaMax,
      ci,
      cr,
      is_consistent: isConsistent,
    }));

    const { error } = await supabaseAdmin.from("ahp_results").insert(rows);
    if (error) handleSupabaseError(error, "saveAhpResults");

    // Update weights in main criteria table
    for (const [criteriaId, w] of Object.entries(weightsMap)) {
      await supabaseAdmin.from("criteria").update({ weight: w }).eq("id", criteriaId);
    }

    return true;
  },

  // --- TOPSIS RESULTS ---
  async getTopsisResults(sessionName: string = "Skenario A"): Promise<TopsisResult[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabaseAdmin
      .from("topsis_results")
      .select(
        `
        *,
        alternative:alternatives(
          *,
          cluster:clusters(*),
          scores:scores(
            *,
            criteria:criteria(*)
          )
        )
      `
      )
      .eq("session_name", sessionName)
      .order("rank");
    if (error) handleSupabaseError(error, "getTopsisResults");
    return (data as unknown as TopsisResult[]) || [];
  },

  async saveTopsisResults(
    sessionName: string = "Skenario A",
    results: { alternative_id: string; d_positive: number; d_negative: number; preference_score: number; rank: number }[],
    normalized: { alternative_id: string; criteria_id: string; r_value: number; v_value: number }[]
  ): Promise<boolean> {
    assertSupabaseConfigured();

    // Delete old results for this session
    await supabaseAdmin.from("topsis_results").delete().eq("session_name", sessionName);
    await supabaseAdmin.from("topsis_normalized").delete().eq("session_name", sessionName);

    // Insert new results
    const resultRows = results.map((r) => ({
      session_name: sessionName,
      alternative_id: r.alternative_id,
      d_positive: r.d_positive,
      d_negative: r.d_negative,
      preference_score: r.preference_score,
      rank: r.rank,
    }));
    const { error: rErr } = await supabaseAdmin.from("topsis_results").insert(resultRows);
    if (rErr) handleSupabaseError(rErr, "saveTopsisResults:results");

    // Insert normalized values
    const normalizedRows = normalized.map((n) => ({
      session_name: sessionName,
      alternative_id: n.alternative_id,
      criteria_id: n.criteria_id,
      r_value: n.r_value,
      v_value: n.v_value,
    }));
    const { error: nErr } = await supabaseAdmin.from("topsis_normalized").insert(normalizedRows);
    if (nErr) handleSupabaseError(nErr, "saveTopsisResults:normalized");

    return true;
  },

  // --- REFERENCES ---
  async getReferences(): Promise<ReferenceDoc[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabaseAdmin.from("references_docs").select("*").order("sort_order");
    if (error) handleSupabaseError(error, "getReferences");
    return (data as ReferenceDoc[]) || [];
  },

  async saveReference(doc: {
    id?: string;
    category: string;
    title: string;
    number?: string;
    year?: number;
    publisher?: string;
    description?: string;
    url?: string;
    sort_order: number;
  }): Promise<ReferenceDoc> {
    assertSupabaseConfigured();

    const payload = {
      category: doc.category,
      title: doc.title,
      number: doc.number || null,
      year: doc.year || null,
      publisher: doc.publisher || null,
      description: doc.description || null,
      url: doc.url || null,
      sort_order: doc.sort_order,
      updated_at: new Date().toISOString(),
    };

    let res;
    if (doc.id) {
      res = await supabaseAdmin.from("references_docs").update(payload).eq("id", doc.id).select().single();
    } else {
      res = await supabaseAdmin.from("references_docs").insert(payload).select().single();
    }
    if (res.error) handleSupabaseError(res.error, "saveReference");
    return res.data as ReferenceDoc;
  },

  async deleteReference(id: string): Promise<boolean> {
    assertSupabaseConfigured();
    const { error } = await supabaseAdmin.from("references_docs").delete().eq("id", id);
    if (error) handleSupabaseError(error, "deleteReference");
    return true;
  },

  // --- APP SETTINGS ---
  async getSettings(): Promise<AppSetting[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabaseAdmin.from("app_settings").select("*");
    if (error) handleSupabaseError(error, "getSettings");
    return (data as AppSetting[]) || [];
  },

  async saveSetting(key: string, value: string): Promise<boolean> {
    assertSupabaseConfigured();
    const { error } = await supabaseAdmin.from("app_settings").upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    if (error) handleSupabaseError(error, "saveSetting");
    return true;
  },

  // --- RESET CALCULATIONS ---
  async resetCalculation(sessionName: string = "Skenario A"): Promise<boolean> {
    assertSupabaseConfigured();

    // Delete all calculation data for this specific session
    await supabaseAdmin.from("ahp_matrices").delete().eq("session_name", sessionName);
    await supabaseAdmin.from("ahp_results").delete().eq("session_name", sessionName);
    await supabaseAdmin.from("topsis_results").delete().eq("session_name", sessionName);
    await supabaseAdmin.from("topsis_normalized").delete().eq("session_name", sessionName);

    // Only reset criteria weights if BOTH sessions have no AHP results
    const { data: remainingAhp } = await supabaseAdmin.from("ahp_results").select("id").limit(1);
    if (!remainingAhp || remainingAhp.length === 0) {
      await supabaseAdmin.from("criteria").update({ weight: 0 });
    }

    return true;
  },

  // --- DELETE CRITERIA ---
  async deleteCriteria(id: string): Promise<boolean> {
    assertSupabaseConfigured();

    // Delete the criterion (dependent tables will cascade)
    const { error } = await supabaseAdmin.from("criteria").delete().eq("id", id);
    if (error) handleSupabaseError(error, "deleteCriteria");

    // Clear all AHP and TOPSIS results across all sessions
    await supabaseAdmin.from("ahp_results").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("topsis_results").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("topsis_normalized").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Reset all criteria weights to 0
    await supabaseAdmin.from("criteria").update({ weight: 0 });

    return true;
  },

  // --- RESET ALL DATA ---
  // Deletes EVERYTHING: calculations, scores, alternatives, sub_criteria, criteria, clusters, references
  async resetAllData(): Promise<{ deleted: Record<string, number> }> {
    assertSupabaseConfigured();
    const allId = "00000000-0000-0000-0000-000000000000";
    const deleted: Record<string, number> = {};

    // Order matters due to foreign keys (children before parents)
    const tables = [
      "topsis_normalized",
      "topsis_results",
      "ahp_results",
      "ahp_matrices",
      "scores",
      "sub_criteria",
      "criteria",
      "alternatives",
      "clusters",
      "references",
    ];

    for (const table of tables) {
      const { count } = await supabaseAdmin.from(table).select("*", { count: "exact", head: true });
      deleted[table] = count || 0;
      await supabaseAdmin.from(table).delete().neq("id", allId);
    }

    return { deleted };
  },
};

