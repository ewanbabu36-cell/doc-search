import pg from 'pg';
import crypto from 'node:crypto';
import { canonicalizeAuditPayload } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function testLegacyEe64() {
  const ev = (await pool.query(`SELECT * FROM core.audit_events WHERE id = 'ee64bd57-b82e-45d5-86d3-378b919a96b7'`)).rows[0];

  console.log('Target hash: ', ev.integrity_hash);

  // What was payload in HqCommandCenterService:
  // tenantId: session.tenantId || '00000000-0000-0000-0000-000000000000'
  // eventType: 'HQ_COMMAND_CENTER_VIEW'
  // resourceType: 'HQ_EXECUTIVE_DASHBOARD'
  // resourceId: 'hq-master'
  // metadata: { period: range.periodName }
  // AND in buildSecurityAuditRecord:
  // rawPayload:
  // tenantId: session?.tenantId
  // branchId: session?.branchId
  // actorId: session?.userId
  // metadata: { period: 'THIS_MONTH' }
  // timestamp: now

  // If in buildSecurityAuditRecord, session had:
  // tenantId: '11111111-1111-4111-8111-111111111111'
  // branchId: undefined
  // actorId: '0499dbd7-d620-4d97-8872-c8ccfedfc535'
  // correlationId: 'sess_m1cyh3l2'
  // previousHash: '026b42fe37212d2bda3b6df609116fb0b08ae5d8616aee2764ccbf0fe89b00e7'
  // metadata: { period: 'THIS_MONTH' }
  const s = canonicalizeAuditPayload({
    tenantId: '11111111-1111-4111-8111-111111111111',
    branchId: null, // branchId was null before branch resolution!
    actorId: '0499dbd7-d620-4d97-8872-c8ccfedfc535',
    eventType: 'HQ_COMMAND_CENTER_VIEW',
    resourceType: 'HQ_EXECUTIVE_DASHBOARD',
    resourceId: 'hq-master',
    correlationId: 'sess_m1cyh3l2',
    ipAddress: null,
    userAgent: null,
    metadata: { period: 'THIS_MONTH' },
    previousHash: '026b42fe37212d2bda3b6df609116fb0b08ae5d8616aee2764ccbf0fe89b00e7',
    timestamp: new Date(ev.timestamp)
  });

  const h = crypto.createHash('sha256').update(s).digest('hex');
  console.log('Legacy canonical string:');
  console.log(s);
  console.log('Legacy hash: ', h);
  console.log('MATCH FOUND? ', h === ev.integrity_hash);

  await pool.end();
}

testLegacyEe64().catch(err => {
  console.error(err);
  process.exit(1);
});
