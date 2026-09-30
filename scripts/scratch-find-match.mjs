import pg from 'pg';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function findMatch() {
  const res = await pool.query(`SELECT * FROM core.audit_events WHERE id = 'ee64bd57-b82e-45d5-86d3-378b919a96b7'`);
  const ev = res.rows[0];

  console.log('Target hash:', ev.integrity_hash);

  // Let's test different combinations of fields to see what produced 7796f8a4ade06b559bf03c7ea4b1fcb3ec8fe81876eafadbd02b306244066a18
  const base = {
    eventType: ev.event_type,
    resourceType: ev.resource_type,
    resourceId: ev.resource_id,
    correlationId: ev.correlation_id,
    ipAddress: ev.ip_address,
    userAgent: ev.user_agent,
    previousHash: ev.previous_hash,
    timestamp: new Date(ev.timestamp)
  };

  const actorOptions = [ev.actor_id, '00000000-0000-4000-8000-000000000001', 'admin@docsearch.internal'];
  const branchOptions = [ev.branch_id, '44444444-4444-4444-8444-444444444401', undefined, null];
  const metadataOptions = [
    ev.metadata,
    { period: 'THIS_MONTH' },
    {},
    { period: 'THIS_MONTH', preservedActorId: ev.actor_id }
  ];

  for (const act of actorOptions) {
    for (const br of branchOptions) {
      for (const meta of metadataOptions) {
        const hash = computeAuditHash({
          ...base,
          tenantId: ev.tenant_id,
          actorId: act,
          branchId: br,
          metadata: meta
        }, ev.previous_hash);

        if (hash === ev.integrity_hash) {
          console.log('MATCH FOUND!');
          console.log({ act, br, meta });
          await pool.end();
          return;
        }
      }
    }
  }

  console.log('No direct combination matched. Let us check other events.');
  const allEvents = await pool.query(`SELECT id, event_type, integrity_hash FROM core.audit_events ORDER BY timestamp ASC LIMIT 20`);
  for (const row of allEvents.rows) {
    const full = (await pool.query(`SELECT * FROM core.audit_events WHERE id = $1`, [row.id])).rows[0];
    const computed = computeAuditHash({
      tenantId: full.tenant_id || undefined,
      branchId: full.branch_id || undefined,
      actorId: full.actor_id || undefined,
      eventType: full.event_type,
      resourceType: full.resource_type,
      resourceId: full.resource_id || undefined,
      correlationId: full.correlation_id || undefined,
      ipAddress: full.ip_address || undefined,
      userAgent: full.user_agent || undefined,
      metadata: full.metadata || {},
      previousHash: full.previous_hash || undefined,
      timestamp: new Date(full.timestamp)
    }, full.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000');
    console.log(`Event ${full.event_type} (${full.id.slice(0, 8)}): match = ${computed === full.integrity_hash}`);
  }

  await pool.end();
}

findMatch().catch(err => {
  console.error(err);
  process.exit(1);
});
