async function testTokens() {
  console.log('=== VERIFYING TOKEN ROBUSTNESS & MISMATCH MITIGATION ===');
  // 1. Test standard login to get valid token
  const loginRes = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@docsearch.health', password: 'DoctorPass123!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  console.log('1. Authentication token obtained:', !!token);

  // 2. Test standard Bearer header
  const r1 = await fetch('http://localhost:4000/api/v1/partner/account/plan-and-features', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('2. Standard Authorization Bearer status:', r1.status);

  // 3. Test lowercase 'bearer ' header
  const r2 = await fetch('http://localhost:4000/api/v1/partner/account/plan-and-features', {
    headers: { 'Authorization': `bearer ${token}` }
  });
  console.log('3. Lowercase bearer header status:', r2.status);

  // 4. Test x-auth-token header
  const r3 = await fetch('http://localhost:4000/api/v1/partner/account/plan-and-features', {
    headers: { 'x-auth-token': token }
  });
  console.log('4. x-auth-token header status:', r3.status);

  // 5. Test x-access-token header
  const r4 = await fetch('http://localhost:4000/api/v1/partner/account/plan-and-features', {
    headers: { 'x-access-token': token }
  });
  console.log('5. x-access-token header status:', r4.status);

  // 6. Test query parameter token
  const r5 = await fetch(`http://localhost:4000/api/v1/partner/account/plan-and-features?token=${encodeURIComponent(token)}`);
  console.log('6. Query parameter token status:', r5.status);

  // 7. Test rejected 'Bearer null' string literal (must gracefully return 401 instead of 500 crash)
  const r6 = await fetch('http://localhost:4000/api/v1/partner/account/plan-and-features', {
    headers: { 'Authorization': 'Bearer null' }
  });
  const d6 = await r6.json();
  console.log('7. Bearer null status:', r6.status, 'Error code:', d6.error?.code);

  const allPassed = r1.status === 200 && r2.status === 200 && r3.status === 200 && r4.status === 200 && r5.status === 200 && r6.status === 401;
  console.log('\nToken Verification Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
}

testTokens().catch(console.error);
