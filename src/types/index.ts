// ================================================================
// TypeScript Types for SPK Pariwisata Balikpapan
// ================================================================

export interface Cluster {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alternative {
  id: string;
  code: string;
  name: string;
  cluster_id: string | null;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  cluster?: Cluster;
  scores?: Score[];
}

export interface Criteria {
  id: string;
  code: string;
  name: string;
  type: "benefit" | "cost";
  description: string | null;
  weight: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined
  sub_criteria?: SubCriteria[];
}

export interface SubCriteria {
  id: string;
  criteria_id: string;
  score_value: number;
  label: string;
  description: string | null;
  created_at?: string;
}

export interface Score {
  id: string;
  alternative_id: string;
  criteria_id: string;
  score_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  criteria?: Criteria;
}

export interface AhpMatrix {
  id: string;
  session_name: string;
  criteria_i_id: string;
  criteria_j_id: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export interface AhpResult {
  id: string;
  session_name: string;
  criteria_id: string;
  weight: number;
  lambda_max: number | null;
  ci: number | null;
  cr: number | null;
  is_consistent: boolean | null;
  calculated_at: string;
  // Joined
  criteria?: Criteria;
}

export interface TopsisResult {
  id: string;
  session_name: string;
  alternative_id: string;
  d_positive: number | null;
  d_negative: number | null;
  preference_score: number | null;
  rank: number | null;
  calculated_at: string;
  // Joined
  alternative?: Alternative;
}

export interface TopsisNormalized {
  id: string;
  session_name: string;
  alternative_id: string;
  criteria_id: string;
  r_value: number | null;
  v_value: number | null;
  calculated_at: string;
}

export interface ReferenceDoc {
  id: string;
  category: string;
  title: string;
  number: string | null;
  year: number | null;
  publisher: string | null;
  description: string | null;
  url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

// ================================================================
// Calculation Result Types
// ================================================================

export interface AhpCalculationResult {
  normalizedMatrix: number[][];
  weights: number[];
  lambdaMax: number;
  ci: number;
  cr: number;
  isConsistent: boolean;
}

export interface TopsisCalculationResult {
  normalizedMatrix: number[][];
  weightedMatrix: number[][];
  idealPositive: number[];
  idealNegative: number[];
  dPlus: number[];
  dMinus: number[];
  preferences: number[];
  rankings: number[];
}

// ================================================================
// Form Types
// ================================================================

export interface AlternativeFormData {
  code: string;
  name: string;
  cluster_id: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  is_active: boolean;
  scores: Record<string, number>; // criteria_id -> score_value
}

export interface CriteriaFormData {
  code: string;
  name: string;
  type: "benefit" | "cost";
  description?: string;
  sort_order: number;
}

export interface ReferenceFormData {
  category: string;
  title: string;
  number?: string;
  year?: number;
  publisher?: string;
  description?: string;
  url?: string;
  sort_order: number;
}

// ================================================================
// API Response Types
// ================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface DashboardStats {
  totalAlternatives: number;
  totalCriteria: number;
  ahpCR: number | null;
  isConsistent: boolean | null;
  topAlternative: {
    name: string;
    code: string;
    score: number;
  } | null;
}
