// ================================================================
// TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
// Calculation Engine. Pure TypeScript — no side effects.
// ================================================================

import { TopsisCalculationResult } from "@/types";

/**
 * Main TOPSIS calculation function
 * @param decisionMatrix - Matrix representing alternatives and their criteria scores (MxN where M = alternatives, N = criteria)
 * @param weights - Criteria weights from AHP (must sum to ~1.0)
 * @param criteriaTypes - Array of 'benefit' or 'cost' for each criterion
 */
export function calculateTOPSIS(
  decisionMatrix: number[][],
  weights: number[],
  criteriaTypes: ("benefit" | "cost")[]
): TopsisCalculationResult {
  const m = decisionMatrix.length; // number of alternatives
  const n = decisionMatrix[0]?.length || 0; // number of criteria

  if (m === 0 || n === 0) {
    return {
      normalizedMatrix: [],
      weightedMatrix: [],
      idealPositive: [],
      idealNegative: [],
      dPlus: [],
      dMinus: [],
      preferences: [],
      rankings: [],
    };
  }

  // Step 1: Normalize decision matrix
  const normalizedMatrix = normalizeDecisionMatrix(decisionMatrix);

  // Step 2: Calculate weighted normalized decision matrix
  const weightedMatrix = applyWeights(normalizedMatrix, weights);

  // Step 3: Determine positive and negative ideal solutions
  const { idealPositive, idealNegative } = calculateIdealSolutions(
    weightedMatrix,
    criteriaTypes
  );

  // Step 4: Calculate separation measures (Euclidean distances)
  const { dPlus, dMinus } = calculateDistances(
    weightedMatrix,
    idealPositive,
    idealNegative
  );

  // Step 5: Calculate relative closeness to ideal solution (Preference Score Ci)
  const preferences = calculatePreferences(dPlus, dMinus);

  // Step 6: Rank the alternatives
  const rankings = calculateRankings(preferences);

  return {
    normalizedMatrix,
    weightedMatrix,
    idealPositive,
    idealNegative,
    dPlus,
    dMinus,
    preferences,
    rankings,
  };
}

/**
 * Step 1: Normalize decision matrix
 * r_ij = x_ij / sqrt(Σ(x_kj²)) for each column j
 */
function normalizeDecisionMatrix(matrix: number[][]): number[][] {
  const m = matrix.length;
  const n = matrix[0].length;
  const normalized: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));

  // Compute quadratic sum for each column
  for (let j = 0; j < n; j++) {
    let sumSq = 0;
    for (let i = 0; i < m; i++) {
      sumSq += matrix[i][j] * matrix[i][j];
    }
    const sqrtSumSq = Math.sqrt(sumSq);

    for (let i = 0; i < m; i++) {
      normalized[i][j] = sqrtSumSq === 0 ? 0 : matrix[i][j] / sqrtSumSq;
    }
  }

  return normalized;
}

/**
 * Step 2: Apply criteria weights to normalized matrix
 * v_ij = w_j * r_ij
 */
function applyWeights(normalizedMatrix: number[][], weights: number[]): number[][] {
  const m = normalizedMatrix.length;
  const n = normalizedMatrix[0].length;
  const weighted: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      weighted[i][j] = normalizedMatrix[i][j] * weights[j];
    }
  }

  return weighted;
}

/**
 * Step 3: Determine positive and negative ideal solutions
 * Benefit: A+ = max(v_ij), A- = min(v_ij)
 * Cost: A+ = min(v_ij), A- = max(v_ij)
 */
function calculateIdealSolutions(
  weightedMatrix: number[][],
  criteriaTypes: ("benefit" | "cost")[]
): { idealPositive: number[]; idealNegative: number[] } {
  const m = weightedMatrix.length;
  const n = weightedMatrix[0].length;
  const idealPositive: number[] = new Array(n).fill(0);
  const idealNegative: number[] = new Array(n).fill(0);

  for (let j = 0; j < n; j++) {
    const colValues = [];
    for (let i = 0; i < m; i++) {
      colValues.push(weightedMatrix[i][j]);
    }

    const type = criteriaTypes[j];
    if (type === "benefit") {
      idealPositive[j] = Math.max(...colValues);
      idealNegative[j] = Math.min(...colValues);
    } else {
      // cost
      idealPositive[j] = Math.min(...colValues);
      idealNegative[j] = Math.max(...colValues);
    }
  }

  return { idealPositive, idealNegative };
}

/**
 * Step 4: Calculate separation measures (Euclidean distances)
 * D+_i = sqrt(Σ(v_ij - A+_j)²)
 * D-_i = sqrt(Σ(v_ij - A-_j)²)
 */
function calculateDistances(
  weightedMatrix: number[][],
  idealPositive: number[],
  idealNegative: number[]
): { dPlus: number[]; dMinus: number[] } {
  const m = weightedMatrix.length;
  const n = weightedMatrix[0].length;
  const dPlus: number[] = new Array(m).fill(0);
  const dMinus: number[] = new Array(m).fill(0);

  for (let i = 0; i < m; i++) {
    let sumSqPlus = 0;
    let sumSqMinus = 0;
    for (let j = 0; j < n; j++) {
      const diffPlus = weightedMatrix[i][j] - idealPositive[j];
      const diffMinus = weightedMatrix[i][j] - idealNegative[j];
      sumSqPlus += diffPlus * diffPlus;
      sumSqMinus += diffMinus * diffMinus;
    }
    dPlus[i] = Math.sqrt(sumSqPlus);
    dMinus[i] = Math.sqrt(sumSqMinus);
  }

  return { dPlus, dMinus };
}

/**
 * Step 5: Calculate relative closeness to ideal solution (Preference Score Ci)
 * Ci = D- / (D+ + D-)
 */
function calculatePreferences(dPlus: number[], dMinus: number[]): number[] {
  const m = dPlus.length;
  const preferences: number[] = new Array(m).fill(0);

  for (let i = 0; i < m; i++) {
    const denom = dPlus[i] + dMinus[i];
    preferences[i] = denom === 0 ? 0 : dMinus[i] / denom;
  }

  return preferences;
}

/**
 * Step 6: Rank the alternatives
 * Sort descending by Ci. The rank array will contain the rank (1-indexed)
 * for each alternative matching the index in preferences array.
 */
function calculateRankings(preferences: number[]): number[] {
  const m = preferences.length;
  const indexedPrefs = preferences.map((value, index) => ({ index, value }));

  // Sort descending by value
  indexedPrefs.sort((a, b) => b.value - a.value);

  const rankings: number[] = new Array(m).fill(0);
  for (let rankIndex = 0; rankIndex < m; rankIndex++) {
    const originalIndex = indexedPrefs[rankIndex].index;
    rankings[originalIndex] = rankIndex + 1;
  }

  return rankings;
}
