import { signJwt } from '../packages/auth/dist/index.js';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const token = signJwt({
  sub: 'e0000000-0000-4000-8000-000000000001',
  userId: 'e0000000-0000-4000-8000-000000000001',
  email: 'founder@docsearch.health',
  tenantId: '11111111-1111-4111-8111-111111111111',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['SUPER_ADMIN', 'DOCTOR'],
  permissions: ['*'],
  isSuperAdmin: true
}, {
  secret: MASTER_SECRET,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

async function main() {
  const r = await fetch('http://localhost:4000/api/v1/partner/clinical/encounters', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('Encounter status:', r.status);
  const json = await r.json();
  console.log('Encounter response:', json);
}

main().catch(console.error);
