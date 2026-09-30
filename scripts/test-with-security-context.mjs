import { withSecurityContext, getDatabase, ensureDatabaseReady, operationalFacilities } from '../packages/database/dist/index.js';

async function test() {
  console.log('Testing withSecurityContext with parameterized set_config...');
  const db = await ensureDatabaseReady();
  const res = await withSecurityContext(
    db,
    {
      tenantId: '11111111-1111-4111-8111-111111111111',
      branchId: '22222222-2222-4222-8222-222222222222',
      userId: '33333333-3333-4333-8333-333333333333',
      isSuperAdmin: false
    },
    async (tx) => {
      const rows = await tx.select().from(operationalFacilities).limit(1);
      return { success: true, count: rows.length };
    }
  );
  console.log('withSecurityContext result:', res);
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
