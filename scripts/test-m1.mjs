import { buildApp } from '../apps/api-gateway/dist/app.js';
import { signJwt } from '../packages/auth/dist/index.js';

async function run() {
  const app = await buildApp();
  const token = signJwt({
    sub: 'usr-test',
    email: 'test@test.com',
    tenantId: '11111111-1111-4111-8111-111111111111',
    roles: ['GUEST_USER'],
    permissions: ['clinical:patients:read']
  }, {
    secret: 'docsearch_master_jwt_secret_dev_32char_key_only',
    issuer: 'docsearch-api',
    audience: 'docsearch-platform',
    expiresInSeconds: 3600
  });
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/patients',
    headers: { Authorization: 'Bearer ' + token },
    payload: { firstName: 'Unauthorized', lastName: 'Patient', gender: 'MALE' }
  });
  console.log('STATUS:', res.statusCode);
  console.log('BODY:', res.body);
  await app.close();
  process.exit(0);
}

run().catch(console.error);
