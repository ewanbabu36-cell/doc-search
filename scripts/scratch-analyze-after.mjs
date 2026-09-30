import pg from 'pg';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function analyze() {
  const res = await pool.query(`
    SELECT count(1)::int as count 
    FROM core.audit_events 
    WHERE timestamp > '2026-09-29T05:06:25.306Z';
  `);
  console.log('Events after 05:06:', res.rows[0].count);

  const sampleAfter = await pool.query(`
    SELECT id, event_type, timestamp, integrity_hash, previous_hash 
    FROM core.audit_events 
    WHERE timestamp > '2026-09-29T05:06:25.306Z'
    ORDER BY timestamp ASC
    LIMIT 5;
  `);
  console.log('Sample events after 05:06:', sampleAfter.rows);

  // Check matching on events after 05:06
  const afterEvents = (await pool.query(`SELECT * FROM core.audit_events WHERE timestamp > '2026-09-29T05:06:25.306Z' ORDER BY timestamp ASC`)).rows;
  let matches = 0;
  for (const ev of afterEvents) {
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
    if (c === ev.integrity_hash) matches++;
  }
  console.log(`Events after 05:06 matching: ${matches} / ${afterEvents.length} (${(matches / afterEvents.length * 100).toFixed(1)}%)`);

  await pool.end();
}

analyze().catch(err => {
  console.error(err);
  process.exit(1);
});
