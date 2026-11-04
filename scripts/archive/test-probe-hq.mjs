import { signJwt } from '../packages/auth/dist/index.js';

const secret = 'supersecret-docsearch-jwt-key-2026-production-grade';
const hqToken = signJwt({
  sub: 'c0000000-0000-4000-8000-000000000001',
  userId: 'c0000000-0000-4000-8000-000000000001',
  email: 'hq.admin@docsearch.health',
  tenantId: '00000000-0000-4000-8000-000000000000',
  roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  permissions: ['*'],
  isSuperAdmin: true
}, {
  secret,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

async function run() {
  const r = await fetch('http://127.0.0.1:4000/api/v1/company/partner-access/verification-queue', {
    headers: { 'Authorization': 'Bearer ' + hqToken }
  });
  console.log('HQ verification queue status:', r.status);
  const json = await r.json();
  console.log('HQ verification queue json:', json);
}

run().catch(console.error);
