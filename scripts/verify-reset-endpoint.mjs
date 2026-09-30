async function test() {
  const loginRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'founder@docsearch.health', password: 'FounderPass123!' })
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data?.accessToken;
  console.log('Super Admin Login success:', !!token);

  // Test 1: Reset password with only email (the exact payload that previously crashed with PostgreSQL 22P02)
  console.log('\n--- Test 1: Reset password with email only (exact bug scenario) ---');
  const resetRes1 = await fetch('http://127.0.0.1:4000/api/v1/company/partners/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ email: 'labtech@metropolis.com', newPassword: 'DocSearch@9999!' })
  });
  console.log('Status:', resetRes1.status);
  const json1 = await resetRes1.json();
  console.log('Response:', JSON.stringify(json1, null, 2));

  // Test 2: Login as partner using the newly set password
  console.log('\n--- Test 2: Partner login with new credentials ---');
  const partnerLogin = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'labtech@metropolis.com', password: 'DocSearch@9999!' })
  });
  console.log('Status:', partnerLogin.status);
  const partnerJson = await partnerLogin.json();
  console.log('Partner Email:', partnerJson.data?.user?.email);
  console.log('Partner Role:', partnerJson.data?.user?.roles || partnerJson.data?.user?.role);
  console.log('Partner Login Success:', partnerJson.success);

  // Test 3: Reset password with BOTH email AND valid partnerId
  console.log('\n--- Test 3: Reset password with email AND partnerId ---');
  const resetRes2 = await fetch('http://127.0.0.1:4000/api/v1/company/partners/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      email: 'labtech@metropolis.com',
      partnerId: '0e549ed3-133a-3825-7f0f-09512727e3f3',
      newPassword: 'DocSearch@8888!'
    })
  });
  console.log('Status:', resetRes2.status);
  const json2 = await resetRes2.json();
  console.log('Response:', JSON.stringify(json2, null, 2));

  // Test 4: Partner login with second new password
  console.log('\n--- Test 4: Partner login with second new credentials ---');
  const partnerLogin2 = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'labtech@metropolis.com', password: 'DocSearch@8888!' })
  });
  console.log('Status:', partnerLogin2.status);
  const partnerJson2 = await partnerLogin2.json();
  console.log('Partner Email:', partnerJson2.data?.user?.email);
  console.log('Partner Login Success:', partnerJson2.success);
}

test().catch(console.error);
