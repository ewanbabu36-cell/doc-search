async function testPasswords() {
  const candidates = [
    'DocSearch@8888!',
    'DocSearch@9999!',
    'PartnerPass123!',
    'LabtechPass123!',
    'MetropolisPass123!',
    'Password123!',
    '123456',
    'DocSearch@123!'
  ];

  for (const pw of candidates) {
    const res = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'labtech@metropolis.com', password: pw })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      console.log('>>> SUCCESSFUL PASSWORD FOUND! <<<');
      console.log('Password:', pw);
      console.log('User:', json.data?.user?.email);
      console.log('Token:', json.data?.accessToken?.slice(0, 30) + '...');
      return;
    }
  }

  console.log('None of the candidates matched the newly reset password.');
}

testPasswords().catch(console.error);
