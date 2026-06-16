const criteria = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7'];
const n = criteria.length;

// Matrix with exact reciprocals
const matrixExact = [
  [1, 2, 3, 4, 2, 5, 0.5],
  [0.5, 1, 2, 3, 2, 4, 1/3],
  [1/3, 0.5, 1, 2, 0.5, 3, 0.25],
  [0.25, 1/3, 0.5, 1, 0.5, 2, 0.2],
  [0.5, 0.5, 2, 2, 1, 3, 1/3],
  [0.2, 0.25, 1/3, 0.5, 1/3, 1, 1/7],
  [2, 3, 4, 5, 3, 7, 1]
];

// Matrix with typed 2-decimal reciprocals
const matrixTyped = [
  [1, 2, 3, 4, 2, 5, 0.5],
  [0.5, 1, 2, 3, 2, 4, 0.33],
  [0.33, 0.5, 1, 2, 0.5, 3, 0.25],
  [0.25, 0.33, 0.5, 1, 0.5, 2, 0.2],
  [0.5, 0.5, 2, 2, 1, 3, 0.33],
  [0.2, 0.25, 0.33, 0.5, 0.33, 1, 0.14],
  [2, 3, 4, 5, 3, 7, 1]
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
const wTyped = calculateAHP(matrixTyped);

console.log("Kriteria | Exact Matrix | Typed 2-Dec Reciprocals | Selisih (Diff)");
console.log("------------------------------------------------------------------");
for (let i = 0; i < n; i++) {
  const diff = Math.abs(wExact[i] - wTyped[i]);
  console.log(`   ${criteria[i]}    |   ${wExact[i].toFixed(6)}   |        ${wTyped[i].toFixed(6)}         |  ${diff.toFixed(6)}`);
}
