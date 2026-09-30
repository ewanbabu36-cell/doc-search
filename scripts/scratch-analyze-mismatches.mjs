import pg from 'pg';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function analyzeMismatches() {
  const allEvents = (await pool.query(`SELECT * FROM core.audit_events ORDER BY timestamp ASC`)).rows;

  const mismatches = [];
  for (const ev of allEvents) {
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
    const c = computeAuditHash(rawPayload, ev.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000');
    if (c !== ev.integrity_hash) {
      mismatches.push(ev);
    }
  }

  console.log(`Total mismatches: ${mismatches.length}`);
  console.log('Earliest mismatch:', mismatches[0].timestamp, mismatches[0].event_type);
  console.log('Latest mismatch:', mismatches[mismatches.length - 1].timestamp, mismatches[mismatches.length - 1].event_type);

  // Group by time windows
  const windows = {};
  for (const m of mismatches) {
    const dateHour = m.timestamp.toISOString().slice(0, 13);
    windows[dateHour] = (windows[dateHour] || 0) + 1;
  }
  console.log('Mismatches by hour:', windows);

  await pool.end();
}

analyzeMismatches().catch(err => {
  console.error(err);
  process.exit(1);
});
