const loginRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'doctor@docsearch.health', password: 'DoctorPass123!' })
});
const loginData = await loginRes.json();
console.log('Doctor Login Status:', loginRes.status);
const token = loginData?.data?.accessToken;
if (!token) {
  console.error('Login failed:', loginData);
  process.exit(1);
}

const doctorEndpoints = [
  '/api/v1/partner/consultations',
  '/api/v1/partner/clinical/doctor-workspace',
  '/api/v1/partner/clinical/icd10?q=dia',
  '/api/v1/partner/clinical/medications?q=para'
];

console.log('\n--- Checking Doctor Endpoints (Step 1 Requirement) ---');
for (const ep of doctorEndpoints) {
  const r = await fetch(`http://127.0.0.1:4000${ep}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await r.json().catch(() => ({}));
  console.log(`${ep.padEnd(45)} => Status: ${r.status}`);
  if (r.status === 200) {
    console.log(`   ✅ PASSED: HTTP 200 OK`);
  } else {
    console.log(`   ❌ FAILED: Status ${r.status}`, data);
  }
}
