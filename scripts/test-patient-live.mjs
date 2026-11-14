
async function testPatient() {
  const loginRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'director@docsearch.health', password: 'Hospital@2026!' })
  });
  const loginData = await loginRes.json();
  const token = loginData?.data?.accessToken;

  const patListRes = await fetch('http://127.0.0.1:4000/api/v1/partner/patients', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const patData = await patListRes.json();
  console.log('patData:', patData);
  const samplePatId = (patData.data && patData.data[0] ? patData.data[0].id : null) || '55555555-5555-4555-8555-555555555501';
  console.log('Sample Patient ID:', samplePatId);

  const p1 = await fetch(`http://127.0.0.1:4000/api/v1/patient-mobile/profile/${samplePatId}`);
  console.log('GET /api/v1/patient-mobile/profile/:id => Status:', p1.status, await p1.json());

  const p2 = await fetch(`http://127.0.0.1:4000/api/v1/patient-mobile/prescriptions/${samplePatId}`);
  console.log('GET /api/v1/patient-mobile/prescriptions/:id => Status:', p2.status);

  const p3 = await fetch(`http://127.0.0.1:4000/api/v1/patient-mobile/lab-reports/${samplePatId}`);
  console.log('GET /api/v1/patient-mobile/lab-reports/:id => Status:', p3.status);

  const p4 = await fetch('http://127.0.0.1:4000/api/v1/patient-mobile/prescriptions/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceType: 'CAMERA_SCAN', doctorName: 'Dr. Alok Sharma' })
  });
  console.log('POST /api/v1/patient-mobile/prescriptions/upload => Status:', p4.status, await p4.json());
}

testPatient().catch(console.error);
