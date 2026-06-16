const criteria = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7'];
const n = criteria.length;

const matrix = [
  [1, 2, 3, 4, 2, 5, 0.5],
  [0.5, 1, 2, 3, 2, 4, 1/3],
  [1/3, 0.5, 1, 2, 0.5, 3, 0.25],
  [0.25, 1/3, 0.5, 1, 0.5, 2, 0.2],
  [0.5, 0.5, 2, 2, 1, 3, 1/3],
  [0.2, 0.25, 1/3, 0.5, 1/3, 1, 1/7],
  [2, 3, 4, 5, 3, 7, 1]
];

// 1. System: Full precision normalization
function calcSystem(m) {
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

// 2. Rounded: Normalized elements rounded to 2 decimals, then averaged
function calcExcelRounded(m) {
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
      // Excel ROUND(val / colSum, 2)
      const normVal = m[i][j] / colSums[j];
      const roundedNormVal = Math.round(normVal * 100) / 100;
      rowSum += roundedNormVal;
    }
    weights[i] = rowSum / n;
  }
  return weights;
}

const wSystem = calcSystem(matrix);
const wRounded = calcExcelRounded(matrix);

console.log("Kriteria | System (No Rounding) | Excel (Rounded 2 Decimals) | Selisih (Diff)");
console.log("-----------------------------------------------------------------------------");
for (let i = 0; i < n; i++) {
  const diff = Math.abs(wSystem[i] - wRounded[i]);
  console.log(`   ${criteria[i]}    |       ${wSystem[i].toFixed(6)}       |          ${wRounded[i].toFixed(6)}          |  ${diff.toFixed(6)}`);
}
