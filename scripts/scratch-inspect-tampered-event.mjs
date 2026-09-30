import pg from 'pg';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function inspectTamperedEvent() {
  const res = await pool.query(`SELECT * FROM core.audit_events WHERE id = 'ee64bd57-b82e-45d5-86d3-378b919a96b7'`);
  const ev = res.rows[0];
  console.log('Event details:');
  console.log(ev);

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
    metadata: (ev.metadata) || {},
    previousHash: ev.previous_hash || undefined,
    timestamp: new Date(ev.timestamp)
  };

  const computed = computeAuditHash(rawPayload, ev.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000');
  console.log('\nStored integrity hash:  ', ev.integrity_hash);
  console.log('Computed integrity hash:', computed);

  await pool.end();
}

inspectTamperedEvent().catch(err => {
  console.error(err);
  process.exit(1);
});
