import pg from 'pg';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function checkAllEvents() {
  const allEvents = await pool.query(`SELECT * FROM core.audit_events ORDER BY timestamp ASC`);
  console.log(`Checking all ${allEvents.rows.length} audit events...`);

  let matchCount = 0;
  let mismatchCount = 0;
  const mismatchByType = {};

  for (const ev of allEvents.rows) {
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
    if (computed === ev.integrity_hash) {
      matchCount++;
    } else {
      mismatchCount++;
      mismatchByType[ev.event_type] = (mismatchByType[ev.event_type] || 0) + 1;
    }
  }

  console.log(`Results: ${matchCount} matches (${(matchCount / allEvents.rows.length * 100).toFixed(1)}%), ${mismatchCount} mismatches`);
  console.log('Mismatches by event type:', mismatchByType);

  await pool.end();
}

checkAllEvents().catch(err => {
  console.error(err);
  process.exit(1);
});
