import pg from 'pg';
import crypto from 'node:crypto';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

function legacyCanonicalize(payload, previousHash) {
  const normalized = {
    tenantId: payload.tenantId || null,
    branchId: payload.branchId || null,
    actorId: payload.actorId || null,
    eventType: payload.eventType,
    resourceType: payload.resourceType,
    resourceId: payload.resourceId || null,
    correlationId: payload.correlationId || null,
    ipAddress: payload.ipAddress || null,
    userAgent: payload.userAgent || null,
    metadata: payload.metadata || {},
    previousHash: previousHash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: payload.timestamp instanceof Date ? payload.timestamp.toISOString() : new Date(payload.timestamp).toISOString()
  };
  return JSON.stringify(normalized, Object.keys(normalized).sort());
}

function computeLegacyHash(payload, prevHash) {
  const s = legacyCanonicalize(payload, prevHash);
  return crypto.createHash('sha256').update(s).digest('hex');
}

async function findEe64() {
  const ev = (await pool.query(`SELECT * FROM core.audit_events WHERE id = 'ee64bd57-b82e-45d5-86d3-378b919a96b7'`)).rows[0];

  const branches = [ev.branch_id, null, undefined, '00000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'];
  const tenants = [ev.tenant_id, null, undefined, '00000000-0000-0000-0000-000000000000'];
  const actors = [ev.actor_id, '0499dbd7-d620-4d97-8872-c8ccfedfc535', 'admin@apollo.hospital', 'admin'];

  for (const b of branches) {
    for (const t of tenants) {
      for (const a of actors) {
        const p = {
          tenantId: t,
          branchId: b,
          actorId: a,
          eventType: ev.event_type,
          resourceType: ev.resource_type,
          resourceId: ev.resource_id,
          correlationId: ev.correlation_id,
          ipAddress: ev.ip_address,
          userAgent: ev.user_agent,
          metadata: { period: 'THIS_MONTH' },
          timestamp: new Date(ev.timestamp)
        };
        const h = computeLegacyHash(p, ev.previous_hash);
        if (h === ev.integrity_hash) {
          console.log('MATCH FOUND FOR EE64BD57!');
          console.log({ b, t, a });
          await pool.end();
          return;
        }
      }
    }
  }

  console.log('Not found in direct permutations.');
  await pool.end();
}

findEe64().catch(err => {
  console.error(err);
  process.exit(1);
});
