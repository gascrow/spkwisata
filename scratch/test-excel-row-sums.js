const fs = require('fs');
const path = require('path');

const csvContent = fs.readFileSync(path.join(__dirname, '../import-examples/06_ahp_matrices.csv'), 'utf8');
const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const rows = lines.slice(1).map(line => {
  const parts = line.split(',');
  return {
    session_name: parts[0],
    criteria_i_code: parts[1],
    criteria_j_code: parts[2],
    value: parseFloat(parts[3])
  };
});

const skenA = rows.filter(r => r.session_name === 'Skenario A');
const criteria = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7'];
const n = criteria.length;

const matrix = Array.from({ length: n }, () => new Array(n).fill(1));
skenA.forEach(r => {
  const i = criteria.indexOf(r.criteria_i_code);
  const j = criteria.indexOf(r.criteria_j_code);
  if (i !== -1 && j !== -1) {
    matrix[i][j] = r.value;
  }
});

// Method 1: Row Averages of Normalized Columns (System)
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

// Method 3: Row Sums / Total Sum of all elements (Excel possible interpretation)
function calcRowSums(m) {
  const rowSums = [];
  let totalSum = 0;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += m[i][j];
    }
    rowSums[i] = sum;
    totalSum += sum;
  }
  return rowSums.map(s => s / totalSum);
}

const wSystem = calcSystem(matrix);
const wRowSums = calcRowSums(matrix);

console.log("Kriteria | System (Col Norm) | Row Sum / Total Sum | Selisih (Diff)");
console.log("---------------------------------------------------------------------");
for (let i = 0; i < n; i++) {
  const diff = Math.abs(wSystem[i] - wRowSums[i]);
  console.log(`   ${criteria[i]}    |      ${wSystem[i].toFixed(6)}      |       ${wRowSums[i].toFixed(6)}       |  ${diff.toFixed(6)}`);
}
