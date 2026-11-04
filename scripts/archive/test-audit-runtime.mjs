import http from 'http';

function checkHttp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data.slice(0, 300) });
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ error: 'timeout' });
    });
  });
}

async function run() {
  console.log('--- RUNTIME HEALTH & ZERO STATE CHECKS ---');
  const gwHealth = await checkHttp('http://127.0.0.1:4000/health');
  console.log('API Gateway /health:', gwHealth.status);

  const regConfig = await checkHttp('http://127.0.0.1:4000/api/v1/auth/registration-form-config');
  console.log('API Gateway /registration-form-config:', regConfig.status);

  const partnerUi = await checkHttp('http://127.0.0.1:5173');
  console.log('Partner Platform (Vite):', partnerUi.status);

  const companyUi = await checkHttp('http://127.0.0.1:5174');
  console.log('Company Platform (Vite):', companyUi.status);

  const landingUi = await checkHttp('http://127.0.0.1:5175');
  console.log('Landing Page (Vite):', landingUi.status);
}

run();
