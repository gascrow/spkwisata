const fs = require('fs');
const path = require('path');

const csvContent = fs.readFileSync(path.join(__dirname, '../import-examples/test/matriks_ahp_test.csv'), 'utf8');
const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const rows = lines.slice(1).map(line => {
  const parts = line.split(',');
  return {
    session_name: parts[0],
    criteria_i_code: parts[1],
    criteria_j_code: parts[2],
    value: parts[3]
  };
});

const criteria = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7'];
const n = criteria.length;

function parseFraction(valueStr) {
  if (valueStr.includes('/')) {
    const [num, den] = valueStr.split('/');
    return parseFloat(num) / parseFloat(den);
  }
  return parseFloat(valueStr);
}

// 1. Matrix with exact fractions (Correct)
const matrixExact = Array.from({ length: n }, () => new Array(n).fill(1));
rows.forEach(r => {
  const i = criteria.indexOf(r.criteria_i_code);
  const j = criteria.indexOf(r.criteria_j_code);
  if (i !== -1 && j !== -1) {
    matrixExact[i][j] = parseFraction(r.value);
  }
});

// 2. Matrix with parseFloat (System before fix)
const matrixParseFloat = Array.from({ length: n }, () => new Array(n).fill(1));
rows.forEach(r => {
  const i = criteria.indexOf(r.criteria_i_code);
  const j = criteria.indexOf(r.criteria_j_code);
  if (i !== -1 && j !== -1) {
    matrixParseFloat[i][j] = parseFloat(r.value) || 1;
  }
});

function calculateAHP_ColNorm(m) {
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

function calculateAHP_GeomMean(m) {
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

const wExactColNorm = calculateAHP_ColNorm(matrixExact);
const wExactGeomMean = calculateAHP_GeomMean(matrixExact);
const wParseFloatColNorm = calculateAHP_ColNorm(matrixParseFloat);

console.log("Kriteria | ColNorm (Exact) | GeomMean (Exact) | ParseFloat (System Before Fix)");
console.log("--------------------------------------------------------------------------------");
for (let i = 0; i < n; i++) {
  console.log(`   ${criteria[i]}    |    ${wExactColNorm[i].toFixed(6)}    |     ${wExactGeomMean[i].toFixed(6)}     |            ${wParseFloatColNorm[i].toFixed(6)}`);
}

console.log("\nSelisih antara ColNorm (Exact) vs GeomMean (Exact):");
for (let i = 0; i < n; i++) {
  const diff = Math.abs(wExactColNorm[i] - wExactGeomMean[i]);
  console.log(`   ${criteria[i]}: ${diff.toFixed(6)}`);
}

console.log("\nSelisih antara ColNorm (Exact) vs ParseFloat (System Before Fix):");
for (let i = 0; i < n; i++) {
  const diff = Math.abs(wExactColNorm[i] - wParseFloatColNorm[i]);
  console.log(`   ${criteria[i]}: ${diff.toFixed(6)}`);
}
