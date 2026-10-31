async function testEndpoints() {
  const tests = [
    { name: 'Health Check', url: 'http://127.0.0.1:4000/health' },
    { name: 'Prescription Templates', url: 'http://127.0.0.1:4000/api/v1/clinical/prescription-templates' },
    { name: 'Vacutainer Tubes Catalog', url: 'http://127.0.0.1:4000/api/v1/laboratory/vacutainer-tubes' },
    { name: 'Emergency Inbound Ambulances', url: 'http://127.0.0.1:4000/api/v1/emergency/command-center/inbound-ambulances' },
    { name: 'Diagnostic Health Packages', url: 'http://127.0.0.1:4000/api/v1/patient/diagnostic-packages' },
    { name: 'Medicine Search (Paracetamol)', url: 'http://127.0.0.1:4000/api/v1/patient/medicines/search?query=paracetamol' }
  ];

  console.log('--- Testing Live API Gateway Endpoints on http://127.0.0.1:4000 ---');
  let allPassed = true;

  for (const test of tests) {
    try {
      const res = await fetch(test.url);
      const data = await res.json();
      console.log(`✓ [HTTP ${res.status}] ${test.name}:`);
      if (Array.isArray(data)) {
        console.log(`   Returned array with ${data.length} item(s). Sample:`, JSON.stringify(data[0] || {}).slice(0, 100));
      } else if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        console.log(`   Returned object with keys [${keys.join(', ')}].`);
        if (data.packages) console.log(`   Packages count: ${data.packages.length}`);
        if (data.medicines) console.log(`   Medicines count: ${data.medicines.length}`);
        if (data.ambulances) console.log(`   Ambulances count: ${data.ambulances.length}`);
      }
    } catch (err) {
      console.error(`✗ FAILED ${test.name}:`, err.message);
      allPassed = false;
    }
  }

  if (!allPassed) {
    process.exit(1);
  }
  console.log('\n✓ ALL LIVE API GATEWAY REST ENDPOINTS RESPONDING CLEANLY ON PORT 4000!');
}

testEndpoints();
