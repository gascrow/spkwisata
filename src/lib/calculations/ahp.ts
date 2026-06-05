// ================================================================
// AHP (Analytic Hierarchy Process) Calculation Engine
// Pure TypeScript — no side effects
// ================================================================

import { RI_VALUES } from "@/lib/utils";
import { AhpCalculationResult } from "@/types";

/**
 * Main AHP calculation function
 * @param matrix - Square pairwise comparison matrix (NxN)
 * @returns Normalized matrix, weights, lambda_max, CI, CR, consistency status
 */
export function calculateAHP(matrix: number[][]): AhpCalculationResult {
  const n = matrix.length;

  // Step 1: Normalize the matrix
  const normalizedMatrix = normalizeMatrix(matrix);

  // Step 2: Calculate priority weights
  const weights = calculateWeights(normalizedMatrix);

  // Step 3: Calculate Lambda Max
  const lambdaMax = calculateLambdaMax(matrix, weights);

  // Step 4: Calculate Consistency Index and Ratio
  const { ci, cr, isConsistent } = calculateConsistency(lambdaMax, n);

  return {
    normalizedMatrix,
    weights,
    lambdaMax,
    ci,
    cr,
    isConsistent,
  };
}

/**
 * Step 1: Normalize the pairwise comparison matrix
 * Each element is divided by its column sum
 */
function normalizeMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const colSums = new Array(n).fill(0);

  // Calculate column sums
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  // Normalize: divide each element by its column sum
  const normalized: number[][] = [];
  for (let i = 0; i < n; i++) {
    normalized[i] = [];
    for (let j = 0; j < n; j++) {
      normalized[i][j] = matrix[i][j] / colSums[j];
    }
  }

  return normalized;
}

/**
 * Step 2: Calculate priority vector (weights)
 * Average of each row in the normalized matrix
 */
function calculateWeights(normalizedMatrix: number[][]): number[] {
  const n = normalizedMatrix.length;
  const weights: number[] = [];

  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += normalizedMatrix[i][j];
    }
    weights[i] = rowSum / n;
  }

  return weights;
}

/**
 * Step 3: Calculate Lambda Max (λmax)
 * λmax = Σ (column_sum × weight)
 */
function calculateLambdaMax(matrix: number[][], weights: number[]): number {
  const n = matrix.length;
  const colSums = new Array(n).fill(0);

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  let lambdaMax = 0;
  for (let j = 0; j < n; j++) {
    lambdaMax += colSums[j] * weights[j];
  }

  return lambdaMax;
}

/**
 * Step 4: Calculate Consistency Index (CI) and Consistency Ratio (CR)
 * CI = (λmax - n) / (n - 1)
 * CR = CI / RI[n]
 */
function calculateConsistency(
  lambdaMax: number,
  n: number
): { ci: number; cr: number; isConsistent: boolean } {
  if (n <= 2) {
    return { ci: 0, cr: 0, isConsistent: true };
  }

  const ci = (lambdaMax - n) / (n - 1);
  const ri = RI_VALUES[n] || 1.49;
  const cr = ri === 0 ? 0 : ci / ri;

  return {
    ci,
    cr,
    isConsistent: cr < 0.1,
  };
}

/**
 * Build a full NxN pairwise comparison matrix from upper triangle values
 * @param upperTriangle - Map of "i-j" -> value (where i < j)
 * @param n - Matrix size
 */
export function buildMatrixFromUpperTriangle(
  upperTriangle: Record<string, number>,
  n: number
): number[][] {
  const matrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else if (i < j) {
        const key = `${i}-${j}`;
        matrix[i][j] = upperTriangle[key] || 1;
      } else {
        const key = `${j}-${i}`;
        matrix[i][j] = 1 / (upperTriangle[key] || 1);
      }
    }
  }

  return matrix;
}

/** Get column sums from matrix (useful for display) */
export function getColumnSums(matrix: number[][]): number[] {
  const n = matrix.length;
  const sums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      sums[j] += matrix[i][j];
    }
  }
  return sums;
}
