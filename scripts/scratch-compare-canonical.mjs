import pg from 'pg';
import crypto from 'node:crypto';
import { canonicalizeAuditPayload } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function compareCanonical() {
  const p = (await pool.query(`SELECT * FROM core.audit_events WHERE id = 'b4b099b4-cda0-4fc4-ba1e-e1737b81e416'`)).rows[0];
  const f = (await pool.query(`SELECT * FROM core.audit_events WHERE id = '3b65791b-b03c-45b7-b7d2-30ee7730d145'`)).rows[0];

  const pStr = canonicalizeAuditPayload({
    tenantId: p.tenant_id,
    branchId: p.branch_id,
    actorId: p.actor_id,
    eventType: p.event_type,
    resourceType: p.resource_type,
    resourceId: p.resource_id,
    correlationId: p.correlation_id,
    ipAddress: p.ip_address,
    userAgent: p.user_agent,
    metadata: p.metadata,
    previousHash: p.previous_hash,
    timestamp: new Date(p.timestamp)
  });

  const fStr = canonicalizeAuditPayload({
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
  });

  const pHash = crypto.createHash('sha256').update(pStr).digest('hex');
  const fHash = crypto.createHash('sha256').update(fStr).digest('hex');

  console.log('Passing: stored=', p.integrity_hash, 'computed=', pHash, 'match=', p.integrity_hash === pHash);
  console.log('Failing: stored=', f.integrity_hash, 'computed=', fHash, 'match=', f.integrity_hash === fHash);

  // If f failed, what was stored in f.integrity_hash?
  // Let's test what could have produced f.integrity_hash:
  // Was f.timestamp different? In PostgreSQL, timestamp with time zone might have microsecond precision!
  console.log('\nExact ISO string of p.timestamp:', new Date(p.timestamp).toISOString());
  console.log('Exact ISO string of f.timestamp:', new Date(f.timestamp).toISOString());

  // Let's query raw text of timestamp from PostgreSQL!
  const rawTimestamps = await pool.query(`SELECT id, timestamp::text FROM core.audit_events WHERE id IN ($1, $2)`, [p.id, f.id]);
  console.log('Raw PG timestamp text:', rawTimestamps.rows);

  await pool.end();
}

compareCanonical().catch(err => {
  console.error(err);
  process.exit(1);
});
