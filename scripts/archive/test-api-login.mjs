async function test() {
  try {
    const res = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'founder@docsearch.health', password: 'FounderPass2026#Secure' })
    });
    console.log('Status:', res.status);
    const body = await res.json();
    console.log('Data:', JSON.stringify(body, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
