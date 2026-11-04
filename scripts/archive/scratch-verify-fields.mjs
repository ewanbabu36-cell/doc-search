import pg from 'pg';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function verifyFieldMismatch() {
  const res = await pool.query(`SELECT * FROM core.audit_events WHERE id = 'ee64bd57-b82e-45d5-86d3-378b919a96b7'`);
  const ev = res.rows[0];

  console.log('Event details:');
  console.log('tenant_id: ', ev.tenant_id);
  console.log('branch_id: ', ev.branch_id);
  console.log('actor_id:  ', ev.actor_id);
  console.log('metadata:  ', ev.metadata);
  console.log('timestamp: ', ev.timestamp);
  console.log('stored integrity_hash: ', ev.integrity_hash);

  // In HqCommandCenterService:
  // session was probably an HQ admin session!
  // What was in session?
  // Let's test if rawPayload with tenantId=null/undefined or actorId='admin@docsearch.internal' matches!
  const possibleSessions = [
    { tenantId: undefined, branchId: undefined, actorId: 'admin@docsearch.internal' },
    { tenantId: null, branchId: null, actorId: '0499dbd7-d620-4d97-8872-c8ccfedfc535' },
    { tenantId: '00000000-0000-0000-0000-000000000000', branchId: undefined, actorId: 'admin' },
    { tenantId: undefined, branchId: undefined, actorId: 'superadmin' }
  ];

  for (const s of possibleSessions) {
    const rawPayload = {
      tenantId: s.tenantId,
      branchId: s.branchId,
      actorId: s.actorId,
      eventType: ev.event_type,
      resourceType: ev.resource_type,
      resourceId: ev.resource_id,
      correlationId: ev.correlation_id,
      ipAddress: ev.ip_address,
      userAgent: ev.user_agent,
      metadata: { period: 'THIS_MONTH' }, // payload.metadata passed into recordEvent!
      previousHash: ev.previous_hash,
      timestamp: new Date(ev.timestamp)
    };
    const h = computeAuditHash(rawPayload, ev.previous_hash);
    console.log(`Testing session ${JSON.stringify(s)}: hash=${h}, match=${h === ev.integrity_hash}`);
  }

  await pool.end();
}

verifyFieldMismatch().catch(err => {
  console.error(err);
  process.exit(1);
});
