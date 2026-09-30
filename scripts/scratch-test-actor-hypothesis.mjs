import pg from 'pg';
import crypto from 'node:crypto';
import { canonicalizeAuditPayload } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function testActorHypothesis() {
  const f = (await pool.query(`SELECT * FROM core.audit_events WHERE id = '3b65791b-b03c-45b7-b7d2-30ee7730d145'`)).rows[0];

  console.log('Target hash: ', f.integrity_hash);
  console.log('actor_id in DB: ', f.actor_id);

  // In verify-multitenant-lifecycle.mjs:
  // How was sub generated? usr_${Math.random().toString(36).slice(2, 10)}
  // Wait! Did session have another property? Or in rawPayload, what if actorId was rawActorId?
  // Let's test if any of the other 71 mismatched events had actor_id mapped from a non-uuid!
  const mismatches = (await pool.query(`
    SELECT * FROM core.audit_events 
    ORDER BY timestamp ASC
  `)).rows;

  let actorMismatchCount = 0;
  for (const ev of mismatches) {
    // If actor_id was generated via hash of audit-actor:...
    // Let's check how actor_id was derived
  }

  // Also, look at AuditRepository.ts:
  // Why did AuditRepository compute auditRecord BEFORE resolving actorUuid, tenantUuid, branchUuid, enrichedMetadata?
  console.log('AuditRepository.ts has the following structure:');
  console.log('Line 78: const auditRecord = buildSecurityAuditRecord(payload, session, previousHash || undefined);');
  console.log('Line 88: const actorUuid = UUID_REGEX.test(rawActorId) ? rawActorId : ...');
  console.log('Line 103: const tenantUuid = rawTenantId && UUID_REGEX.test(rawTenantId) ? rawTenantId : null;');
  console.log('Line 113: let branchUuid = ...');
  console.log('Line 223: const enrichedMetadata = { ... };');
  console.log('Line 230: const newRecord = { ... integrityHash: auditRecord.integrityHash };');

  await pool.end();
}

testActorHypothesis().catch(err => {
  console.error(err);
  process.exit(1);
});
