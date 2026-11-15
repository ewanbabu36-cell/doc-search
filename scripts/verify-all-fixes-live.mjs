console.log('============================================================');
console.log('🧪 LIVE PROBE TEST FOR RECENT FIXES & HARMONIZATION');
console.log('============================================================\n');

// 1. Patient OTP with "phone" field (Testing backward compatibility)
console.log('1. Testing Patient OTP Request with { phone: "+91 98765 43210" }...');
const otpRes1 = await fetch('http://127.0.0.1:4000/api/v1/patient/auth/request-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+91 98765 43210' })
});
console.log(`   Status: ${otpRes1.status} | Response:`, await otpRes1.json());

// 2. Patient OTP Verify with { phone, otp: '1234' }
console.log('\n2. Testing Patient OTP Verify with { phone, otp: "1234" }...');
const verifyRes1 = await fetch('http://127.0.0.1:4000/api/v1/patient/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+91 98765 43210', otp: '1234' })
});
console.log(`   Status: ${verifyRes1.status} | Response:`, await verifyRes1.json());

// 3. Director Login
console.log('\n3. Logging in as Director...');
const loginRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'director@docsearch.health', password: 'Hospital@2026!' })
});
const loginJson = await loginRes.json();
const token = loginJson.data?.accessToken;
console.log(`   Status: ${loginRes.status} | Token Acquired: ${!!token}`);

// 4. POS Batches Search
console.log('\n4. Testing GET /api/v1/partner/pharmacy/pos/batches/search?q=para...');
const posBatchRes = await fetch('http://127.0.0.1:4000/api/v1/partner/pharmacy/pos/batches/search?q=para', {
  headers: { Authorization: `Bearer ${token}` }
});
const posBatchJson = await posBatchRes.json();
console.log(`   Status: ${posBatchRes.status} | Matches: ${posBatchJson.data?.length || 0}`);

// 5. Khata Customers Alias
console.log('\n5. Testing GET /api/v1/partner/pharmacy/khata/customers...');
const khataRes = await fetch('http://127.0.0.1:4000/api/v1/partner/pharmacy/khata/customers', {
  headers: { Authorization: `Bearer ${token}` }
});
const khataJson = await khataRes.json();
console.log(`   Status: ${khataRes.status} | Accounts: ${khataJson.data?.length || 0}`);

// 6. Emergency Triage Queue Alias
console.log('\n6. Testing GET /api/v1/partner/emergency/triage-queue...');
const emTriageRes = await fetch('http://127.0.0.1:4000/api/v1/partner/emergency/triage-queue', {
  headers: { Authorization: `Bearer ${token}` }
});
const emTriageJson = await emTriageRes.json();
console.log(`   Status: ${emTriageRes.status} | Queue Length: ${emTriageJson.data?.length || 0}`);
