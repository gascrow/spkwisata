const criteria = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7'];
const n = criteria.length;

// Skenario A with exact fractions
const matrixExact = [
  [1, 3, 5, 4, 3, 2, 6],
  [1/3, 1, 3, 2, 1, 1/2, 4],
  [1/5, 1/3, 1, 1/2, 1/3, 1/4, 2],
  [1/4, 1/2, 2, 1, 1/2, 1/3, 3],
  [1/3, 1, 3, 2, 1, 1/2, 4],
  [1/2, 2, 4, 3, 2, 1, 5],
  [1/6, 1/4, 1/2, 1/3, 1/4, 1/5, 1]
];

// Skenario A with rounded decimals (from CSV)
const matrixRounded = [
  [1, 3, 5, 4, 3, 2, 6],
  [0.3333, 1, 3, 2, 1, 0.5, 4],
  [0.2, 0.3333, 1, 0.5, 0.3333, 0.25, 2],
  [0.25, 0.5, 2, 1, 0.5, 0.3333, 3],
  [0.3333, 1, 3, 2, 1, 0.5, 4],
  [0.5, 2, 4, 3, 2, 1, 5],
  [0.1667, 0.25, 0.5, 0.3333, 0.25, 0.2, 1]
];

function calculateAHP(m) {
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += m[i][j];
    }
  }
  const weights = [];
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += m[i][j] / colSums[j];
    }
    weights[i] = rowSum / n;
  }
  return weights;
}

const wExact = calculateAHP(matrixExact);
const wRounded = calculateAHP(matrixRounded);

console.log("Kriteria | Exact Fractions | Rounded Decimals | Selisih (Diff)");
console.log("---------------------------------------------------------------");
for (let i = 0; i < n; i++) {
  const diff = Math.abs(wExact[i] - wRounded[i]);
  console.log(`   ${criteria[i]}    |    ${wExact[i].toFixed(6)}     |     ${wRounded[i].toFixed(6)}     |  ${diff.toFixed(6)}`);
}
