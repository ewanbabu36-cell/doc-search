import crypto from 'node:crypto';
import { signJwt } from '@docsearch/auth';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

function createToken(payload = {}) {
  const claims = {
    sub: payload.sub || crypto.randomUUID(),
    email: payload.email || 'founder@docsearch.health',
    tenantId: 'docsearch-hq-global',
    roles: payload.roles || ['SUPER_ADMIN'],
    permissions: payload.permissions || ['*'],
    isSuperAdmin: payload.isSuperAdmin ?? true,
    dataScope: 'global',
    iss: ISSUER,
    aud: AUDIENCE,
    jti: crypto.randomUUID()
  };
  return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
}

const token = createToken();

async function run() {
  const res = await fetch('http://localhost:4000/api/v1/company/partners/directory?pageSize=100', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const d = await res.json();
  console.log('Total partners:', d.total, 'Items count:', d.data?.length);
  const kycMap = {};
  d.data?.forEach(p => {
    kycMap[p.kycStatus] = (kycMap[p.kycStatus] || 0) + 1;
  });
  console.log('KYC Breakdown:', kycMap);

  // Now test querying specifically with kycStatus=PENDING
  const resPending = await fetch('http://localhost:4000/api/v1/company/partners/directory?kycStatus=PENDING&pageSize=100', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const dPending = await resPending.json();
  console.log('PENDING filtered query count:', dPending.total, 'items:', dPending.data?.length);
  if (dPending.data) {
    console.log('Pending partner names:', dPending.data.map(p => ({ name: p.tradeName, kycStatus: p.kycStatus })));
  }
}

run().catch(console.error);
