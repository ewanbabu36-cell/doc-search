import pg from 'pg';
import crypto from 'node:crypto';
import { canonicalizeAuditPayload } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function searchVariations() {
  const f = (await pool.query(`SELECT * FROM core.audit_events WHERE id = '3b65791b-b03c-45b7-b7d2-30ee7730d145'`)).rows[0];
  const target = f.integrity_hash;

  const base = {
    tenantId: f.tenant_id,
    branchId: f.branch_id,
    actorId: f.actor_id,
    eventType: f.event_type,
    resourceType: f.resource_type,
    resourceId: f.resource_id,
    correlationId: f.correlation_id,
    ipAddress: f.ip_address,
    userAgent: f.user_agent,
    metadata: f.metadata,
    previousHash: f.previous_hash,
    timestamp: new Date(f.timestamp)
  };

  function testPayload(p, label) {
    const s = canonicalizeAuditPayload(p);
    const h = crypto.createHash('sha256').update(s).digest('hex');
    if (h === target) {
      console.log(`MATCH FOUND (${label})!`);
      console.log(s);
      return true;
    }
    return false;
  }

  // Variations of branchId
  const branches = [null, undefined, '00000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444401', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-4000-8000-000000000002'];
  for (const b of branches) {
    if (testPayload({ ...base, branchId: b }, `branchId: ${b}`)) return;
  }

  // Variations of tenantId
  const tenants = [null, undefined, '11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000'];
  for (const t of tenants) {
    if (testPayload({ ...base, tenantId: t }, `tenantId: ${t}`)) return;
  }

  // Variations of actorId
  const actors = [null, undefined, '00000000-0000-4000-8000-000000000001', 'user-1', 'admin'];
  for (const a of actors) {
    if (testPayload({ ...base, actorId: a }, `actorId: ${a}`)) return;
  }

  // Variations of previousHash
  const prevs = ['GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000', null, undefined];
  for (const pr of prevs) {
    if (testPayload({ ...base, previousHash: pr }, `prevHash: ${pr}`)) return;
  }

  // Variations of correlationId
  const corrs = [null, undefined, 'sess_cemf9xwt'];
  for (const c of corrs) {
    if (testPayload({ ...base, correlationId: c }, `corrId: ${c}`)) return;
  }

  // Combinations: branchId null AND prevHash GENESIS
  for (const b of branches) {
    for (const pr of prevs) {
      if (testPayload({ ...base, branchId: b, previousHash: pr }, `branchId: ${b}, prevHash: ${pr}`)) return;
    }
  }

  console.log('No single-field variation matched.');
  await pool.end();
}

searchVariations().catch(err => {
  console.error(err);
  process.exit(1);
});
