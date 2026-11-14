const loginRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'director@docsearch.health', password: 'Hospital@2026!' })
});
const loginData = await loginRes.json();
const token = loginData?.data?.accessToken;

if (!token) {
  console.error('Failed to get director token:', loginData);
  process.exit(1);
}

const endpoints = [
  '/api/v1/partner/patients',
  '/api/v1/partner/encounters',
  '/api/v1/partner/consultations',
  '/api/v1/partner/clinical/doctor-workspace',
  '/api/v1/partner/clinical/icd10?q=dia',
  '/api/v1/partner/clinical/medications?q=para',
  '/api/v1/partner/inpatient/census',
  '/api/v1/partner/inpatient/admissions',
  '/api/v1/partner/billing/invoices',
  '/api/v1/partner/billing/service-catalog',
  '/api/v1/partner/pharmacy/inventory',
  '/api/v1/partner/pharmacy/prescriptions',
  '/api/v1/partner/lab/orders',
  '/api/v1/partner/lab/catalog',
  '/api/v1/partner/radiology/orders',
  '/api/v1/partner/emergency/command-center',
  '/api/v1/partner/blood-bank/inventory',
  '/api/v1/partner/ot/schedules',
  '/api/v1/partner/telemedicine/sessions',
  '/api/v1/partner/abdm/care-contexts'
];

console.log('Testing Endpoints with HOSPITAL_DIRECTOR (* permissions):');
for (const ep of endpoints) {
  const r = await fetch(`http://127.0.0.1:4000${ep}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  console.log(`${ep.padEnd(45)} => Status: ${r.status}`);
  if (r.status !== 200 && r.status !== 201) {
    const errSummary = typeof json === 'object' ? (json?.message || json?.error?.message || JSON.stringify(json)) : json;
    console.log(`   ❌ Issue: ${String(errSummary).slice(0, 160)}`);
  } else {
    const dataLen = Array.isArray(json?.data) ? `${json.data.length} items` : (json?.data ? 'object' : 'ok');
    console.log(`   ✅ Success: ${dataLen}`);
  }
}
