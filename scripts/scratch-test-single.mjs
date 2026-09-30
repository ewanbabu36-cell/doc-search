import pg from 'pg';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function testSingle() {
  const ev = (await pool.query(`SELECT * FROM core.audit_events WHERE id = 'b4b099b4-cda0-4fc4-ba1e-e1737b81e416'`)).rows[0];

  const rawPayload = {
    tenantId: ev.tenant_id || undefined,
    branchId: ev.branch_id || undefined,
    actorId: ev.actor_id || undefined,
    eventType: ev.event_type,
    resourceType: ev.resource_type,
    resourceId: ev.resource_id || undefined,
    correlationId: ev.correlation_id || undefined,
    ipAddress: ev.ip_address || undefined,
    userAgent: ev.user_agent || undefined,
    metadata: ev.metadata || {},
    previousHash: ev.previous_hash || undefined,
    timestamp: new Date(ev.timestamp)
  };

  const c = computeAuditHash(rawPayload, ev.previous_hash);
  console.log('Stored:   ', ev.integrity_hash);
  console.log('Computed: ', c);
  console.log('Matches?  ', c === ev.integrity_hash);

  await pool.end();
}

testSingle().catch(err => {
  console.error(err);
  process.exit(1);
});
