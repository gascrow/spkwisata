function parseFraction(valueStr) {
  if (valueStr.includes('/')) {
    const [num, den] = valueStr.split('/');
    return parseFloat(num) / parseFloat(den);
  }
  return parseFloat(valueStr);
}

// Let's test JS parseFloat behavior:
console.log('parseFloat("1/2"):', parseFloat("1/2"));
console.log('parseFraction("1/2"):', parseFraction("1/2"));

const csvValues = [
  "1", "2", "3", "4", "2", "5", "1/2",
  "1/2", "1", "2", "3", "2", "4", "1/3",
  "1/3", "1/2", "1", "2", "1/2", "3", "1/4",
  "1/4", "1/3", "1/2", "1", "1/2", "2", "1/5",
  "1/2", "1/2", "2", "2", "1", "3", "1/3",
  "1/5", "1/4", "1/3", "1/2", "1/3", "1", "1/7",
  "2", "3", "4", "5", "3", "7", "1"
];

// Let's build the two matrices:
// 1. How the system currently imports it (using parseFloat):
const matrixSystem = [];
for (let i = 0; i < 7; i++) {
  matrixSystem[i] = [];
  for (let j = 0; j < 7; j++) {
    const strVal = csvValues[i * 7 + j];
    matrixSystem[i][j] = parseFloat(strVal) || 1;
  }
}

// 2. Correct evaluation of fractions:
const matrixCorrect = [];
for (let i = 0; i < 7; i++) {
  matrixCorrect[i] = [];
  for (let j = 0; j < 7; j++) {
    const strVal = csvValues[i * 7 + j];
    matrixCorrect[i][j] = parseFraction(strVal) || 1;
  }
}

function calculateAHP(m) {
  const colSums = new Array(7).fill(0);
  for (let j = 0; j < 7; j++) {
    for (let i = 0; i < 7; i++) {
      colSums[j] += m[i][j];
    }
  }
  const weights = [];
  for (let i = 0; i < 7; i++) {
    let rowSum = 0;
    for (let j = 0; j < 7; j++) {
      rowSum += m[i][j] / colSums[j];
    }
    weights[i] = rowSum / 7;
  }
  return weights;
}

const wSystem = calculateAHP(matrixSystem);
const wCorrect = calculateAHP(matrixCorrect);

console.log("\nComparison:");
console.log("Kriteria | System (parseFloat) | Correct (with fraction support) | Selisih (Diff)");
console.log("---------------------------------------------------------------------------------");
for (let i = 0; i < 7; i++) {
  const diff = Math.abs(wSystem[i] - wCorrect[i]);
  console.log(`   K${i+1}    |       ${wSystem[i].toFixed(6)}      |            ${wCorrect[i].toFixed(6)}             |  ${diff.toFixed(6)}`);
}
