import http from 'node:http';

const BASE_URL = 'http://127.0.0.1:4000';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('Testing founder login:');
  const res = await post('/api/v1/auth/login', {
    email: 'founder@docsearch.health',
    password: 'FounderPass123!'
  });
  console.log('Status:', res.status);
  console.log('Data:', JSON.stringify(res.data, null, 2));

  console.log('\nTesting founder.alok login:');
  const res2 = await post('/api/v1/auth/login', {
    email: 'founder.alok@docsearch.health',
    password: 'FounderPass123!'
  });
  console.log('Status:', res2.status);
  console.log('Data:', JSON.stringify(res2.data, null, 2));
}

main().catch(console.error);
