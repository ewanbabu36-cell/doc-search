async function verify() {
  const res = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'labtech@metropolis.com', password: '123456' })
  });
  console.log('Status with 123456:', res.status);
  const json = await res.json();
  console.log('Response with 123456:', JSON.stringify(json, null, 2));
}
verify().catch(console.error);
