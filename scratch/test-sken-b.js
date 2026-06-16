const criteria = [
  "a1111111-1111-1111-1111-111111111111", // K1
  "a2222222-2222-2222-2222-222222222222", // K2
  "a3333333-3333-3333-3333-333333333333", // K3
  "a4444444-4444-4444-4444-444444444444", // K4
  "a5555555-5555-5555-5555-555555555555", // K5
  "a6666666-6666-6666-6666-666666666666", // K6
  "a7777777-7777-7777-7777-777777777777"  // K7
];

const INITIAL_AHP_MATRICES_LIST = [
  // === SKENARIO B (prioritas ekonomi & kelembagaan: Dampak Ekonomi > Kelembagaan > Amenitas) ===
  // K1 vs others
  { session_name: "Skenario B", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a2222222-2222-2222-2222-222222222222", value: 0.5 },
  { session_name: "Skenario B", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a3333333-3333-3333-3333-333333333333", value: 0.333333 },
  { session_name: "Skenario B", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a4444444-4444-4444-4444-444444444444", value: 0.5 },
  { session_name: "Skenario B", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a5555555-5555-5555-5555-555555555555", value: 0.25 },
  { session_name: "Skenario B", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a6666666-6666-6666-6666-666666666666", value: 2 },
  { session_name: "Skenario B", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 3 },

  // K2 vs others
  { session_name: "Skenario B", criteria_i_id: "a2222222-2222-2222-2222-222222222222", criteria_j_id: "a3333333-3333-3333-3333-333333333333", value: 0.5 },
  { session_name: "Skenario B", criteria_i_id: "a2222222-2222-2222-2222-222222222222", criteria_j_id: "a4444444-4444-4444-4444-444444444444", value: 0.5 },
  { session_name: "Skenario B", criteria_i_id: "a2222222-2222-2222-2222-222222222222", criteria_j_id: "a5555555-5555-5555-5555-555555555555", value: 0.333333 },
  { session_name: "Skenario B", criteria_i_id: "a2222222-2222-2222-2222-222222222222", criteria_j_id: "a6666666-6666-6666-6666-666666666666", value: 3 },
  { session_name: "Skenario B", criteria_i_id: "a2222222-2222-2222-2222-222222222222", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 4 },

  // K3 vs others
  { session_name: "Skenario B", criteria_i_id: "a3333333-3333-3333-3333-333333333333", criteria_j_id: "a4444444-4444-4444-4444-444444444444", value: 0.5 },
  { session_name: "Skenario B", criteria_i_id: "a3333333-3333-3333-3333-333333333333", criteria_j_id: "a5555555-5555-5555-5555-555555555555", value: 0.25 },
  { session_name: "Skenario B", criteria_i_id: "a3333333-3333-3333-3333-333333333333", criteria_j_id: "a6666666-6666-6666-6666-666666666666", value: 3 },
  { session_name: "Skenario B", criteria_i_id: "a3333333-3333-3333-3333-333333333333", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 4 },

  // K4 vs others
  { session_name: "Skenario B", criteria_i_id: "a4444444-4444-4444-4444-444444444444", criteria_j_id: "a5555555-5555-5555-5555-555555555555", value: 0.333333 },
  { session_name: "Skenario B", criteria_i_id: "a4444444-4444-4444-4444-444444444444", criteria_j_id: "a6666666-6666-6666-6666-666666666666", value: 3 },
  { session_name: "Skenario B", criteria_i_id: "a4444444-4444-4444-4444-444444444444", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 4 },

  // K5 vs others
  { session_name: "Skenario B", criteria_i_id: "a5555555-5555-5555-5555-555555555555", criteria_j_id: "a6666666-6666-6666-6666-666666666666", value: 5 },
  { session_name: "Skenario B", criteria_i_id: "a5555555-5555-5555-5555-555555555555", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 6 },

  // K6 vs others
  { session_name: "Skenario B", criteria_i_id: "a6666666-6666-6666-6666-666666666666", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 2 }
];

const n = criteria.length;
const comparisons = {};
INITIAL_AHP_MATRICES_LIST.forEach(m => {
  comparisons[`${m.criteria_i_id}-${m.criteria_j_id}`] = m.value;
});

const matrix = Array.from({ length: n }, () => new Array(n).fill(1));
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    if (i === j) matrix[i][j] = 1;
    else if (i < j) {
      matrix[i][j] = comparisons[`${criteria[i]}-${criteria[j]}`] || 1;
    } else {
      matrix[i][j] = 1 / (comparisons[`${criteria[j]}-${criteria[i]}`] || 1);
    }
  }
}

// Method 1: Normalized Column Sums (Approximate)
function calcMethod1(matrix) {
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }
  const weights = [];
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += matrix[i][j] / colSums[j];
    }
    weights[i] = rowSum / n;
  }
  return weights;
}

// Method 2: Geometric Mean
function calcMethod2(matrix) {
  const geomMeans = [];
  let sumGeomMeans = 0;
  for (let i = 0; i < n; i++) {
    let product = 1;
    for (let j = 0; j < n; j++) {
      product *= matrix[i][j];
    }
    const gm = Math.pow(product, 1 / n);
    geomMeans[i] = gm;
    sumGeomMeans += gm;
  }
  return geomMeans.map(gm => gm / sumGeomMeans);
}

const w1 = calcMethod1(matrix);
const w2 = calcMethod2(matrix);

console.log("Kriteria | Skenario B Method 1 | Skenario B Method 2 | Selisih (Diff)");
console.log("---------------------------------------------------------------------");
for (let i = 0; i < n; i++) {
  const diff = Math.abs(w1[i] - w2[i]);
  console.log(`   K${i+1}   |      ${w1[i].toFixed(6)}       |       ${w2[i].toFixed(6)}        |  ${diff.toFixed(6)}`);
}
