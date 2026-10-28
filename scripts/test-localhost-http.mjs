import http from 'http';

function checkHttp(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      resolve({ status: res.statusCode, ok: true });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ ok: false, error: 'TIMEOUT' });
    });
  });
}

console.log('--- TESTING LOCALHOST HTTP SERVICES ---');
for (const port of [4000, 5173, 5174, 5177]) {
  const res = await checkHttp(port);
  console.log(`http://localhost:${port} -> ${res.ok ? 'HTTP ' + res.status + ' OK' : 'FAILED: ' + res.error}`);
}
