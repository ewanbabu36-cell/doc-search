import pg from 'pg';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function comparePatientEvents() {
  const events = (await pool.query(`SELECT * FROM core.audit_events WHERE event_type = 'PATIENT_REGISTERED' ORDER BY timestamp ASC`)).rows;

  let passing = null;
  let failing = null;

  for (const ev of events) {
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
    if (c === ev.integrity_hash && !passing) {
      passing = ev;
    } else if (c !== ev.integrity_hash && !failing) {
      failing = ev;
    }
  }

  console.log('--- PASSING PATIENT_REGISTERED ---');
  console.log(passing);

  console.log('\n--- FAILING PATIENT_REGISTERED ---');
  console.log(failing);

  await pool.end();
}

comparePatientEvents().catch(err => {
  console.error(err);
  process.exit(1);
});
