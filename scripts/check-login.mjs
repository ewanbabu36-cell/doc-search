const res = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'founder@docsearch.health', password: 'FounderPass123!' })
});
console.log('Status:', res.status);
const data = await res.json();
console.log('Response:', data);
