const PORT = 3001;
const TOPSIS_URL = `http://localhost:${PORT}/api/topsis`;

async function calculateTopsis() {
  console.log('Triggering TOPSIS calculation for Skenario A...');
  
  const response = await fetch(TOPSIS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sessionName: 'Skenario A' })
  });

  const result = await response.json();
  if (result.success) {
    console.log('TOPSIS calculation successful!');
    
    // Fetch the calculated results to show the rankings
    const getResponse = await fetch(`${TOPSIS_URL}?session=Skenario%20A`);
    const getResult = await getResponse.json();
    
    if (getResult.success) {
      console.log('\nTop 3 Tourist Destinations:');
      getResult.data.slice(0, 3).forEach((r, idx) => {
        console.log(`${r.rank}. ${r.alternative.code} - ${r.alternative.name} (Preference Score Ci: ${Number(r.preference_score).toFixed(6)})`);
      });
    }
  } else {
    console.error('TOPSIS calculation failed:', result.error);
  }
}

calculateTopsis();
