import { auditIntegrityService } from '../apps/api-gateway/dist/services/reliability/AuditIntegrityService.js';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function testVerification() {
  const tenantSession = {
    userId: '00000000-0000-4000-8000-000000000001',
    actorEmail: 'admin@apollo.hospital',
    tenantId: '11111111-1111-4111-8111-111111111111',
    roles: ['TENANT_ADMIN']
  };

  console.log('Testing AuditIntegrityService.verifyAuditLedger for tenant 11111111-1111-4111-8111-111111111111...');
  const res = await auditIntegrityService.verifyAuditLedger(tenantSession);
  console.log('Tenant verification result:');
  console.log(res);

  const superAdminWithExplicitTenant = {
    userId: '00000000-0000-4000-8000-000000000001',
    actorEmail: 'superadmin@docsearch.internal',
    roles: ['SUPER_ADMIN'],
    isSuperAdmin: true
  };
  const res2 = await auditIntegrityService.verifyAuditLedger(superAdminWithExplicitTenant, { tenantId: '11111111-1111-4111-8111-111111111111' });
  console.log('\nSuperAdmin explicit tenant verification result:');
  console.log(res2);
}

testVerification().catch(err => {
  console.error('Error during audit verification:', err);
  process.exit(1);
});
