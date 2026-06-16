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

// Method 1: Row Averages of Normalized Columns
function calcMethod1(m) {
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

// Method 2: Geometric Mean
function calcMethod2(m) {
  const geomMeans = [];
  let sumGeomMeans = 0;
  for (let i = 0; i < n; i++) {
    let product = 1;
    for (let j = 0; j < n; j++) {
      product *= m[i][j];
    }
    const gm = Math.pow(product, 1 / n);
    geomMeans[i] = gm;
    sumGeomMeans += gm;
  }
  return geomMeans.map(gm => gm / sumGeomMeans);
}

const w1 = calcMethod1(matrix);
const w2 = calcMethod2(matrix);

console.log("Kriteria | Method 1 (System) | Method 2 (Geom Mean) | Selisih (Diff)");
console.log("---------------------------------------------------------------------");
for (let i = 0; i < n; i++) {
  const diff = Math.abs(w1[i] - w2[i]);
  console.log(`   ${criteria[i]}    |      ${w1[i].toFixed(6)}      |       ${w2[i].toFixed(6)}       |  ${diff.toFixed(6)}`);
}
