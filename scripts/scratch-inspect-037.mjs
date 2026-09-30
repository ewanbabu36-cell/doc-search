import pg from 'pg';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function inspectEvent037() {
  const res = await pool.query(`SELECT * FROM core.audit_events WHERE id::text LIKE '037bd46f%'`);
  const ev = res.rows[0];

  const cleanMeta = { ...ev.metadata };
  delete cleanMeta.preservedActorId;
  delete cleanMeta.preservedBranchId;
  delete cleanMeta.preservedTenantId;

  const payloadClean = {
    tenantId: ev.tenant_id || undefined,
    branchId: ev.branch_id || undefined,
    actorId: ev.actor_id || undefined,
    eventType: ev.event_type,
    resourceType: ev.resource_type,
    resourceId: ev.resource_id || undefined,
    correlationId: ev.correlation_id || undefined,
    ipAddress: ev.ip_address || undefined,
    userAgent: ev.user_agent || undefined,
    metadata: cleanMeta,
    previousHash: ev.previous_hash || undefined,
    timestamp: new Date(ev.timestamp)
  };

  const computedClean = computeAuditHash(payloadClean, ev.previous_hash);
  console.log('Stored hash:       ', ev.integrity_hash);
  console.log('Computed clean:    ', computedClean);
  console.log('Does clean match stored hash?', computedClean === ev.integrity_hash);

  await pool.end();
}

inspectEvent037().catch(err => {
  console.error(err);
  process.exit(1);
});
