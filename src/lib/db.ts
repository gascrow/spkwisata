// ================================================================
// PERSISTENT DATA LAYER WITH SUPABASE & LOCAL JSON FALLBACK
// ================================================================

import fs from "fs";
import path from "path";
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
import {
  INITIAL_CLUSTERS,
  INITIAL_CRITERIA,
  INITIAL_SUB_CRITERIA,
  INITIAL_ALTERNATIVES,
  INITIAL_SCORES_MAP,
  INITIAL_REFERENCES,
  INITIAL_SETTINGS,
  INITIAL_AHP_MATRICES_LIST,
} from "./initialData";

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && !url.includes("[your-project]") && key && !key.includes("[your-service-role-key]");
};

// Local JSON File Database path
const LOCAL_DB_PATH = path.join(process.cwd(), "src", "lib", "local_db.json");

interface LocalDbSchema {
  clusters: Cluster[];
  criteria: Criteria[];
  sub_criteria: SubCriteria[];
  alternatives: Omit<Alternative, "cluster" | "scores">[];
  scores: Score[];
  ahp_matrices: AhpMatrix[];
  ahp_results: AhpResult[];
  topsis_results: TopsisResult[];
  topsis_normalized: TopsisNormalized[];
  references_docs: ReferenceDoc[];
  app_settings: AppSetting[];
}

// Ensure the local database file exists and is populated
function initLocalDb(): LocalDbSchema {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
    } catch (e) {
      console.error("Failed to parse local DB, reinitializing", e);
    }
  }

  // Populate initial scores list from map
  const scores: Score[] = [];
  INITIAL_ALTERNATIVES.forEach((alt) => {
    const scoreMapping = INITIAL_SCORES_MAP[alt.code] || {};
    INITIAL_CRITERIA.forEach((crit) => {
      const val = scoreMapping[crit.code] || 3.0; // default 3
      scores.push({
        id: `score-${alt.id}-${crit.id}`,
        alternative_id: alt.id,
        criteria_id: crit.id,
        score_value: val,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  });

  // Populate AHP Matrices lists
  const ahp_matrices: AhpMatrix[] = INITIAL_AHP_MATRICES_LIST.map((m, idx) => ({
    id: `ahp-mat-${idx}`,
    session_name: m.session_name,
    criteria_i_id: m.criteria_i_id,
    criteria_j_id: m.criteria_j_id,
    value: m.value,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const data: LocalDbSchema = {
    clusters: INITIAL_CLUSTERS,
    criteria: INITIAL_CRITERIA,
    sub_criteria: INITIAL_SUB_CRITERIA,
    alternatives: INITIAL_ALTERNATIVES,
    scores,
    ahp_matrices,
    ahp_results: [],
    topsis_results: [],
    topsis_normalized: [],
    references_docs: INITIAL_REFERENCES,
    app_settings: INITIAL_SETTINGS,
  };

  saveLocalDb(data);
  return data;
}

function saveLocalDb(data: LocalDbSchema) {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Get schema
const getDb = (): LocalDbSchema => {
  return initLocalDb();
};

// ================================================================
// DATABASE METHODS (REAL OR FALLBACK)
// ================================================================

export const db = {
  // --- CLUSTERS ---
  async getClusters(): Promise<Cluster[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from("clusters").select("*").order("name");
      if (!error) return data as Cluster[];
    }
    return getDb().clusters;
  },

  // --- ALTERNATIVES (WITH CLUSTERS & SCORES) ---
  async getAlternatives(): Promise<Alternative[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("alternatives")
        .select(`
          *,
          cluster:clusters(*),
          scores:scores(
            *,
            criteria:criteria(*)
          )
        `)
        .order("code");
      if (!error) return data as unknown as Alternative[];
    }

    const localDb = getDb();
    return localDb.alternatives.map((alt) => {
      const cluster = localDb.clusters.find((c) => c.id === alt.cluster_id) || null;
      const scores = localDb.scores
        .filter((s) => s.alternative_id === alt.id)
        .map((s) => ({
          ...s,
          criteria: localDb.criteria.find((c) => c.id === s.criteria_id) || undefined,
        }));

      return {
        ...alt,
        cluster: cluster || undefined,
        scores,
      };
    });
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
    if (isSupabaseConfigured()) {
      // Create/Update Alternative
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
        await supabaseAdmin.from("alternatives").update(payload).eq("id", alternativeId);
      } else {
        const { data, error } = await supabaseAdmin.from("alternatives").insert(payload).select().single();
        if (error) throw new Error(error.message);
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

      const freshAlt = await supabaseAdmin
        .from("alternatives")
        .select("*, cluster:clusters(*), scores:scores(*)")
        .eq("id", alternativeId)
        .single();
      return freshAlt.data as unknown as Alternative;
    }

    // Local DB Fallback
    const localDb = getDb();
    const id = altData.id || `alt-${Date.now()}`;
    const altObj: Omit<Alternative, "cluster" | "scores"> = {
      id,
      code: altData.code,
      name: altData.name,
      cluster_id: altData.cluster_id,
      description: altData.description || null,
      address: altData.address || null,
      latitude: altData.latitude || null,
      longitude: altData.longitude || null,
      image_url: altData.image_url || null,
      is_active: altData.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (altData.id) {
      localDb.alternatives = localDb.alternatives.map((a) => (a.id === id ? altObj : a));
    } else {
      localDb.alternatives.push(altObj);
    }

    // Update scores
    localDb.scores = localDb.scores.filter((s) => s.alternative_id !== id);
    Object.entries(altData.scores).forEach(([critId, val]) => {
      localDb.scores.push({
        id: `score-${id}-${critId}`,
        alternative_id: id,
        criteria_id: critId,
        score_value: val,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    saveLocalDb(localDb);

    const cluster = localDb.clusters.find((c) => c.id === altObj.cluster_id) || undefined;
    const scores = localDb.scores
      .filter((s) => s.alternative_id === id)
      .map((s) => ({
        ...s,
        criteria: localDb.criteria.find((c) => c.id === s.criteria_id) || undefined,
      }));

    return {
      ...altObj,
      cluster,
      scores,
    };
  },

  async deleteAlternative(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from("alternatives").delete().eq("id", id);
      return !error;
    }

    const localDb = getDb();
    localDb.alternatives = localDb.alternatives.filter((a) => a.id !== id);
    localDb.scores = localDb.scores.filter((s) => s.alternative_id !== id);
    localDb.topsis_results = localDb.topsis_results.filter((tr) => tr.alternative_id !== id);
    localDb.topsis_normalized = localDb.topsis_normalized.filter((tn) => tn.alternative_id !== id);
    saveLocalDb(localDb);
    return true;
  },

  // --- CRITERIA & SUB_CRITERIA ---
  async getCriteria(): Promise<Criteria[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("criteria")
        .select(`
          *,
          sub_criteria(*)
        `)
        .order("sort_order");
      if (!error) return data as unknown as Criteria[];
    }

    const localDb = getDb();
    return localDb.criteria
      .map((c) => ({
        ...c,
        sub_criteria: localDb.sub_criteria
          .filter((s) => s.criteria_id === c.id)
          .sort((a, b) => a.score_value - b.score_value),
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  async saveCriteria(crit: {
    id?: string;
    code: string;
    name: string;
    type: "benefit" | "cost";
    description?: string;
    sort_order: number;
  }): Promise<Criteria> {
    const payload = {
      code: crit.code,
      name: crit.name,
      type: crit.type,
      description: crit.description || null,
      sort_order: crit.sort_order,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      let critId = crit.id;
      if (critId) {
        await supabaseAdmin.from("criteria").update(payload).eq("id", critId);
      } else {
        const { data, error } = await supabaseAdmin.from("criteria").insert(payload).select().single();
        if (error) throw new Error(error.message);
        critId = data.id;
      }
      const fresh = await supabaseAdmin.from("criteria").select("*, sub_criteria(*)").eq("id", critId).single();
      return fresh.data as unknown as Criteria;
    }

    const localDb = getDb();
    const id = crit.id || `crit-${Date.now()}`;
    const obj: Criteria = {
      id,
      code: crit.code,
      name: crit.name,
      type: crit.type,
      description: crit.description || null,
      weight: crit.id ? localDb.criteria.find((c) => c.id === crit.id)?.weight || 0 : 0,
      sort_order: crit.sort_order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (crit.id) {
      localDb.criteria = localDb.criteria.map((c) => (c.id === id ? obj : c));
    } else {
      localDb.criteria.push(obj);
      // Automatically add default subcriteria 1-4
      const labels = ["Tidak Baik", "Kurang Baik", "Baik", "Sangat Baik"];
      labels.forEach((lbl, idx) => {
        localDb.sub_criteria.push({
          id: `sub-${id}-${idx + 1}`,
          criteria_id: id,
          score_value: idx + 1,
          label: lbl,
          description: `Deskripsi sub kriteria ${lbl} untuk ${crit.name}`,
          created_at: new Date().toISOString(),
        });
      });
    }

    saveLocalDb(localDb);
    return {
      ...obj,
      sub_criteria: localDb.sub_criteria.filter((s) => s.criteria_id === id),
    };
  },

  async saveSubCriteria(sub: {
    id?: string;
    criteria_id: string;
    score_value: number;
    label: string;
    description: string;
  }): Promise<SubCriteria> {
    const payload = {
      criteria_id: sub.criteria_id,
      score_value: sub.score_value,
      label: sub.label,
      description: sub.description,
    };

    if (isSupabaseConfigured()) {
      let res;
      if (sub.id) {
        res = await supabaseAdmin.from("sub_criteria").update(payload).eq("id", sub.id).select().single();
      } else {
        res = await supabaseAdmin.from("sub_criteria").insert(payload).select().single();
      }
      if (res.error) throw new Error(res.error.message);
      return res.data as SubCriteria;
    }

    const localDb = getDb();
    const id = sub.id || `sub-${Date.now()}`;
    const obj: SubCriteria = {
      id,
      criteria_id: sub.criteria_id,
      score_value: sub.score_value,
      label: sub.label,
      description: sub.description,
      created_at: new Date().toISOString(),
    };

    if (sub.id) {
      localDb.sub_criteria = localDb.sub_criteria.map((s) => (s.id === id ? obj : s));
    } else {
      localDb.sub_criteria.push(obj);
    }
    saveLocalDb(localDb);
    return obj;
  },

  // --- AHP MATRICES ---
  async getAhpMatrices(sessionName: string = "Default"): Promise<AhpMatrix[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from("ahp_matrices").select("*").eq("session_name", sessionName);
      if (!error) return data as AhpMatrix[];
    }
    return getDb().ahp_matrices.filter((m) => m.session_name === sessionName);
  },

  async saveAhpMatrices(sessionName: string = "Default", matrices: { criteria_i_id: string; criteria_j_id: string; value: number }[]): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const rows = matrices.map((m) => ({
        session_name: sessionName,
        criteria_i_id: m.criteria_i_id,
        criteria_j_id: m.criteria_j_id,
        value: m.value,
        updated_at: new Date().toISOString(),
      }));

      for (const row of rows) {
        await supabaseAdmin.from("ahp_matrices").upsert(row, { onConflict: "session_name,criteria_i_id,criteria_j_id" });
      }
      return true;
    }

    const localDb = getDb();
    // Delete existing session entries
    localDb.ahp_matrices = localDb.ahp_matrices.filter((m) => m.session_name !== sessionName);

    matrices.forEach((m, idx) => {
      localDb.ahp_matrices.push({
        id: `ahp-mat-${sessionName}-${idx}-${Date.now()}`,
        session_name: sessionName,
        criteria_i_id: m.criteria_i_id,
        criteria_j_id: m.criteria_j_id,
        value: m.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    saveLocalDb(localDb);
    return true;
  },

  // --- AHP RESULTS ---
  async getAhpResults(sessionName: string = "Default"): Promise<AhpResult[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("ahp_results")
        .select("*, criteria:criteria(*)")
        .eq("session_name", sessionName);
      if (!error) return data as unknown as AhpResult[];
    }

    const localDb = getDb();
    return localDb.ahp_results
      .filter((r) => r.session_name === sessionName)
      .map((r) => ({
        ...r,
        criteria: localDb.criteria.find((c) => c.id === r.criteria_id) || undefined,
      }));
  },

  async saveAhpResults(
    sessionName: string = "Default",
    weightsMap: Record<string, number>, // criteria_id -> weight
    lambdaMax: number,
    ci: number,
    cr: number,
    isConsistent: boolean
  ): Promise<boolean> {
    if (isSupabaseConfigured()) {
      // Delete old results
      await supabaseAdmin.from("ahp_results").delete().eq("session_name", sessionName);

      // Insert new
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
      if (error) return false;

      // Update weights in main criteria table too
      for (const [criteriaId, w] of Object.entries(weightsMap)) {
        await supabaseAdmin.from("criteria").update({ weight: w }).eq("id", criteriaId);
      }

      return true;
    }

    const localDb = getDb();
    // Delete existing
    localDb.ahp_results = localDb.ahp_results.filter((r) => r.session_name !== sessionName);

    Object.entries(weightsMap).forEach(([criteriaId, w], idx) => {
      localDb.ahp_results.push({
        id: `ahp-res-${sessionName}-${idx}-${Date.now()}`,
        session_name: sessionName,
        criteria_id: criteriaId,
        weight: w,
        lambda_max: lambdaMax,
        ci,
        cr,
        is_consistent: isConsistent,
        calculated_at: new Date().toISOString(),
      });

      // Update main criteria weight
      localDb.criteria = localDb.criteria.map((c) => (c.id === criteriaId ? { ...c, weight: w } : c));
    });

    saveLocalDb(localDb);
    return true;
  },

  // --- TOPSIS RESULTS ---
  async getTopsisResults(sessionName: string = "Default"): Promise<TopsisResult[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("topsis_results")
        .select(`
          *,
          alternative:alternatives(
            *,
            cluster:clusters(*)
          )
        `)
        .eq("session_name", sessionName)
        .order("rank");
      if (!error) return data as unknown as TopsisResult[];
    }

    const localDb = getDb();
    return localDb.topsis_results
      .filter((r) => r.session_name === sessionName)
      .map((r) => {
        const alt = localDb.alternatives.find((a) => a.id === r.alternative_id) || null;
        const cluster = alt ? localDb.clusters.find((c) => c.id === alt.cluster_id) || null : null;

        return {
          ...r,
          alternative: alt
            ? {
                ...alt,
                cluster: cluster || undefined,
              }
            : undefined,
        };
      })
      .sort((a, b) => (a.rank || 999) - (b.rank || 999));
  },

  async saveTopsisResults(
    sessionName: string = "Default",
    results: { alternative_id: string; d_positive: number; d_negative: number; preference_score: number; rank: number }[],
    normalized: { alternative_id: string; criteria_id: string; r_value: number; v_value: number }[]
  ): Promise<boolean> {
    if (isSupabaseConfigured()) {
      // Delete old topsis results & normalized matrix for this session
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
      await supabaseAdmin.from("topsis_results").insert(resultRows);

      // Insert normalized values
      const normalizedRows = normalized.map((n) => ({
        session_name: sessionName,
        alternative_id: n.alternative_id,
        criteria_id: n.criteria_id,
        r_value: n.r_value,
        v_value: n.v_value,
      }));
      await supabaseAdmin.from("topsis_normalized").insert(normalizedRows);

      return true;
    }

    const localDb = getDb();
    // Delete existing
    localDb.topsis_results = localDb.topsis_results.filter((r) => r.session_name !== sessionName);
    localDb.topsis_normalized = localDb.topsis_normalized.filter((n) => n.session_name !== sessionName);

    results.forEach((r, idx) => {
      localDb.topsis_results.push({
        id: `topsis-res-${sessionName}-${idx}-${Date.now()}`,
        session_name: sessionName,
        alternative_id: r.alternative_id,
        d_positive: r.d_positive,
        d_negative: r.d_negative,
        preference_score: r.preference_score,
        rank: r.rank,
        calculated_at: new Date().toISOString(),
      });
    });

    normalized.forEach((n, idx) => {
      localDb.topsis_normalized.push({
        id: `topsis-norm-${sessionName}-${idx}-${Date.now()}`,
        session_name: sessionName,
        alternative_id: n.alternative_id,
        criteria_id: n.criteria_id,
        r_value: n.r_value,
        v_value: n.v_value,
        calculated_at: new Date().toISOString(),
      });
    });

    saveLocalDb(localDb);
    return true;
  },

  // --- REFERENCES ---
  async getReferences(): Promise<ReferenceDoc[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from("references_docs").select("*").order("sort_order");
      if (!error) return data as ReferenceDoc[];
    }
    return getDb().references_docs.sort((a, b) => a.sort_order - b.sort_order);
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

    if (isSupabaseConfigured()) {
      let res;
      if (doc.id) {
        res = await supabaseAdmin.from("references_docs").update(payload).eq("id", doc.id).select().single();
      } else {
        res = await supabaseAdmin.from("references_docs").insert(payload).select().single();
      }
      if (res.error) throw new Error(res.error.message);
      return res.data as ReferenceDoc;
    }

    const localDb = getDb();
    const id = doc.id || `ref-${Date.now()}`;
    const obj: ReferenceDoc = {
      id,
      category: doc.category,
      title: doc.title,
      number: doc.number || null,
      year: doc.year || null,
      publisher: doc.publisher || null,
      description: doc.description || null,
      url: doc.url || null,
      sort_order: doc.sort_order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (doc.id) {
      localDb.references_docs = localDb.references_docs.map((r) => (r.id === id ? obj : r));
    } else {
      localDb.references_docs.push(obj);
    }
    saveLocalDb(localDb);
    return obj;
  },

  async deleteReference(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from("references_docs").delete().eq("id", id);
      return !error;
    }

    const localDb = getDb();
    localDb.references_docs = localDb.references_docs.filter((r) => r.id !== id);
    saveLocalDb(localDb);
    return true;
  },

  // --- APP SETTINGS ---
  async getSettings(): Promise<AppSetting[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from("app_settings").select("*");
      if (!error) return data as AppSetting[];
    }
    return getDb().app_settings;
  },

  async saveSetting(key: string, value: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      return !error;
    }

    const localDb = getDb();
    const existing = localDb.app_settings.find((s) => s.key === key);
    if (existing) {
      existing.value = value;
      existing.updated_at = new Date().toISOString();
    } else {
      localDb.app_settings.push({
        id: `setting-${Date.now()}`,
        key,
        value,
        updated_at: new Date().toISOString(),
      });
    }
    saveLocalDb(localDb);
    return true;
  },

  // --- RESET CALCULATIONS ---
  async resetCalculation(sessionName: string = "Default"): Promise<boolean> {
    if (isSupabaseConfigured()) {
      await supabaseAdmin.from("ahp_results").delete().eq("session_name", sessionName);
      await supabaseAdmin.from("topsis_results").delete().eq("session_name", sessionName);
      await supabaseAdmin.from("topsis_normalized").delete().eq("session_name", sessionName);

      // Reset criteria weights in main table to 0
      await supabaseAdmin.from("criteria").update({ weight: 0 });
      return true;
    }

    const localDb = getDb();
    localDb.ahp_results = localDb.ahp_results.filter((r) => r.session_name !== sessionName);
    localDb.topsis_results = localDb.topsis_results.filter((r) => r.session_name !== sessionName);
    localDb.topsis_normalized = localDb.topsis_normalized.filter((n) => n.session_name !== sessionName);
    localDb.criteria = localDb.criteria.map((c) => ({ ...c, weight: 0 }));

    saveLocalDb(localDb);
    return true;
  },

  // --- DELETE CRITERIA ---
  async deleteCriteria(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      // Delete the criterion (dependent tables will delete on cascade)
      await supabaseAdmin.from("criteria").delete().eq("id", id);
      
      // Clear all AHP and TOPSIS results across all sessions
      await supabaseAdmin.from("ahp_results").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("topsis_results").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("topsis_normalized").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // Reset all criteria weights to 0
      await supabaseAdmin.from("criteria").update({ weight: 0 });
      return true;
    }

    const localDb = getDb();
    // Filter out the criterion and its sub-criteria/scores
    localDb.criteria = localDb.criteria.filter((c) => c.id !== id);
    localDb.sub_criteria = localDb.sub_criteria.filter((s) => s.criteria_id !== id);
    localDb.scores = localDb.scores.filter((s) => s.criteria_id !== id);
    localDb.ahp_matrices = localDb.ahp_matrices.filter((m) => m.criteria_i_id !== id && m.criteria_j_id !== id);
    
    // Reset weights of remaining criteria to 0
    localDb.criteria = localDb.criteria.map((c) => ({ ...c, weight: 0 }));
    
    // Clear all calculations results
    localDb.ahp_results = [];
    localDb.topsis_results = [];
    localDb.topsis_normalized = [];

    saveLocalDb(localDb);
    return true;
  },
};

