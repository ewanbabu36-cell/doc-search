import pg from 'pg';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function compareEvents() {
  const matchRes = await pool.query(`SELECT * FROM core.audit_events WHERE id::text LIKE '374505a9%'`);
  const matchEv = matchRes.rows[0];

  const nomatchRes = await pool.query(`SELECT * FROM core.audit_events WHERE id::text LIKE '037bd46f%'`);
  const nomatchEv = nomatchRes.rows[0];

  console.log('--- MATCHING EVENT (374505a9) ---');
  console.log(matchEv);
  const matchPayload = {
    tenantId: matchEv.tenant_id || undefined,
    branchId: matchEv.branch_id || undefined,
    actorId: matchEv.actor_id || undefined,
    eventType: matchEv.event_type,
    resourceType: matchEv.resource_type,
    resourceId: matchEv.resource_id || undefined,
    correlationId: matchEv.correlation_id || undefined,
    ipAddress: matchEv.ip_address || undefined,
    userAgent: matchEv.user_agent || undefined,
    metadata: matchEv.metadata || {},
    previousHash: matchEv.previous_hash || undefined,
    timestamp: new Date(matchEv.timestamp)
  };
  const compMatch = computeAuditHash(matchPayload, matchEv.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000');
  console.log('Stored:   ', matchEv.integrity_hash);
  console.log('Computed: ', compMatch);

  console.log('\n--- NON-MATCHING EVENT (037bd46f) ---');
  console.log(nomatchEv);
  const nomatchPayload = {
    tenantId: nomatchEv.tenant_id || undefined,
    branchId: nomatchEv.branch_id || undefined,
    actorId: nomatchEv.actor_id || undefined,
    eventType: nomatchEv.event_type,
    resourceType: nomatchEv.resource_type,
    resourceId: nomatchEv.resource_id || undefined,
    correlationId: nomatchEv.correlation_id || undefined,
    ipAddress: nomatchEv.ip_address || undefined,
    userAgent: nomatchEv.user_agent || undefined,
    metadata: nomatchEv.metadata || {},
    previousHash: nomatchEv.previous_hash || undefined,
    timestamp: new Date(nomatchEv.timestamp)
  };
  const compNomatch = computeAuditHash(nomatchPayload, nomatchEv.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000');
  console.log('Stored:   ', nomatchEv.integrity_hash);
  console.log('Computed: ', compNomatch);

  await pool.end();
}

compareEvents().catch(err => {
  console.error(err);
  process.exit(1);
});
