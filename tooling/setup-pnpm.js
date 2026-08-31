const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function fetchFollow(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'NodeJS' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        return resolve(fetchFollow(redirectUrl, dest));
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP Status ' + res.statusCode));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(dest));
      });
    }).on('error', reject);
  });
}

async function main() {
  const pnpmDest = path.join(__dirname, 'pnpm.cjs');
  const workerDest = path.join(__dirname, 'worker.js');

  console.log('Fetching bundled pnpm.cjs...');
  await fetchFollow('https://unpkg.com/pnpm@9.15.4/dist/pnpm.cjs', pnpmDest);
  console.log('Fetching bundled worker.js...');
  await fetchFollow('https://unpkg.com/pnpm@9.15.4/dist/worker.js', workerDest);

  console.log('pnpm.cjs size:', fs.statSync(pnpmDest).size);
  console.log('worker.js size:', fs.statSync(workerDest).size);
  console.log('pnpm standalone files downloaded successfully.');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
