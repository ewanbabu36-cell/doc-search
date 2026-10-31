async function test() {
  const pRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pharmacist@docsearch.health', password: 'PharmaPass123!' })
  });
  const pData = await pRes.json();
  console.log('Pharmacy login status:', pRes.status, 'success:', pData.success);

  const dRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@docsearch.health', password: 'DoctorPass123!' })
  });
  const dData = await dRes.json();
  console.log('Doctor login status:', dRes.status, 'success:', dData.success);
}
test();
