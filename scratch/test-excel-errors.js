const criteria = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7'];
const n = criteria.length;

const matrix = [
  [1, 3, 5, 4, 3, 2, 6],
  [1/3, 1, 3, 2, 1, 1/2, 4],
  [1/5, 1/3, 1, 1/2, 1/3, 1/4, 2],
  [1/4, 1/2, 2, 1, 1/2, 1/3, 3],
  [1/3, 1, 3, 2, 1, 1/2, 4],
  [1/2, 2, 4, 3, 2, 1, 5],
  [1/6, 1/4, 1/2, 1/3, 1/4, 1/5, 1]
];

// Helper to normalize
const colSums = new Array(n).fill(0);
for (let j = 0; j < n; j++) {
  for (let i = 0; i < n; i++) {
    colSums[j] += matrix[i][j];
  }
}

const normalized = [];
for (let i = 0; i < n; i++) {
  normalized[i] = [];
  for (let j = 0; j < n; j++) {
    normalized[i][j] = matrix[i][j] / colSums[j];
  }
}

// System weights
const wSystem = [];
for (let i = 0; i < n; i++) {
  wSystem[i] = normalized[i].reduce((a, b) => a + b, 0) / n;
}

// Excel weights with typo in K5: e.g. AVERAGE over 6 columns instead of 7
const wExcelTypo = [];
for (let i = 0; i < n; i++) {
  if (i === 4) { // K5
    // Typo: misses the last column (col 6)
    wExcelTypo[i] = normalized[i].slice(0, 6).reduce((a, b) => a + b, 0) / 6;
  } else {
    wExcelTypo[i] = normalized[i].reduce((a, b) => a + b, 0) / n;
  }
}

console.log("Kriteria | System | Excel Typo | Selisih (Diff)");
console.log("-----------------------------------------------");
for (let i = 0; i < n; i++) {
  const diff = Math.abs(wSystem[i] - wExcelTypo[i]);
  console.log(`   ${criteria[i]}    | ${wSystem[i].toFixed(4)} |   ${wExcelTypo[i].toFixed(4)}   |  ${diff.toFixed(4)}`);
}
