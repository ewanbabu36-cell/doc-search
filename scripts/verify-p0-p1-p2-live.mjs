async function verifyLive() {
  console.log('============================================================');
  console.log('🧪 LIVE PROBE: P0 (URL ALIASES), P1 (PATIENT APP), P2 (SEEDS)');
  console.log('============================================================\n');

  // 1. Login as Director to test partner endpoints
  const loginRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'director@docsearch.health', password: 'Hospital@2026!' })
  });
  const { data: directorData } = await loginRes.json();
  const token = directorData?.accessToken;
  console.log(`1. Director Auth: ${!!token ? 'SUCCESS' : 'FAILED'}`);

  // 2. Biomedical Assets via /asset-biomedical/assets
  const bioRes = await fetch('http://127.0.0.1:4000/api/v1/partner/asset-biomedical/assets', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const bioJson = await bioRes.json();
  console.log(`2. GET /asset-biomedical/assets: Status ${bioRes.status} | Assets Count: ${bioJson.data?.length || 0}`);
  if (bioJson.data?.length > 0) {
    console.log(`   Sample Asset: ${bioJson.data[0].assetName} (${bioJson.data[0].assetCode})`);
  }

  // 3. Quality Environmental Swabs via /quality/environmental-swabs
  const swabRes = await fetch('http://127.0.0.1:4000/api/v1/partner/quality/environmental-swabs', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const swabJson = await swabRes.json();
  console.log(`3. GET /quality/environmental-swabs: Status ${swabRes.status} | Swabs: ${swabJson.data?.length || 0}`);

  // 4. HAI Device Days via /quality/hai-device-days
  const haiRes = await fetch('http://127.0.0.1:4000/api/v1/partner/quality/hai-device-days', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const haiJson = await haiRes.json();
  console.log(`4. GET /quality/hai-device-days: Status ${haiRes.status} | Central Line Days: ${haiJson.data?.centralLineDays}`);

  // 5. Procurement Orders via /procurement/orders
  const poRes = await fetch('http://127.0.0.1:4000/api/v1/partner/procurement/orders', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const poJson = await poRes.json();
  console.log(`5. GET /procurement/orders: Status ${poRes.status} | Orders: ${poJson.data?.length || 0}`);

  // 6. Patient App: Request OTP & Login
  const otpRes = await fetch('http://127.0.0.1:4000/api/v1/patient/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+91 98765 43210' })
  });
  const verifyRes = await fetch('http://127.0.0.1:4000/api/v1/patient/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+91 98765 43210', otp: '1234' })
  });
  const verifyJson = await verifyRes.json();
  const patToken = verifyJson.token;
  console.log(`6. Patient Mobile Auth: Status ${verifyRes.status} | Patient: ${verifyJson.patient?.fullName}`);

  // 7. Patient App: Pre-Arrival Digital Intake Submission
  const intakeRes = await fetch('http://127.0.0.1:4000/api/v1/patient/intake/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patToken}` },
    body: JSON.stringify({
      patientName: 'Rameshwar Prasad',
      mobile: '+91 98765 43210',
      insurerName: 'HDFC ERGO Health (Optima Secure)',
      policyNumber: 'HDFC-SEC-2026-88410',
      memberId: 'HDFC-MEM-40912',
      abhaId: '91-8822-4411-9012@abdm',
      chiefComplaints: 'Severe lower back pain and stiffness since 3 days',
      allergies: ['Penicillin'],
      chronicConditions: ['Type 2 Diabetes', 'Mild HTN'],
      currentMedications: 'Tab. Metformin 500mg'
    })
  });
  const intakeJson = await intakeRes.json();
  console.log(`7. POST /patient/intake/submit: Status ${intakeRes.status} | FastPass: ${intakeJson.fastPassQrCode} | Token: #${intakeJson.tokenNumber}`);

  // 8. Patient App: Live Family Members Fetch
  const famRes = await fetch('http://127.0.0.1:4000/api/v1/patient/family-members?phone=9876543210', {
    headers: { Authorization: `Bearer ${patToken}` }
  });
  const famJson = await famRes.json();
  console.log(`8. GET /patient/family-members: Status ${famRes.status} | Members Count: ${famJson.familyMembers?.length || 0}`);
}

verifyLive().catch(console.error);
