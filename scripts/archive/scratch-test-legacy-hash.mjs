import pg from 'pg';
import crypto from 'node:crypto';
import { computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

function computeLegacyAuditHash(payload, previousHash) {
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
  const canonical = JSON.stringify(normalized, Object.keys(normalized).sort());
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

async function testWithLegacyHash() {
  const tenantEvents = (await pool.query(`SELECT * FROM core.audit_events WHERE tenant_id = '11111111-1111-4111-8111-111111111111' ORDER BY timestamp ASC`)).rows;

  let modern = 0;
  let legacy = 0;
  let failed = 0;
  const failedList = [];

  for (const ev of tenantEvents) {
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

    const prevHash = ev.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000';

    const c1 = computeAuditHash(rawPayload, prevHash);
    if (c1 === ev.integrity_hash) {
      modern++;
      continue;
    }

    const c2 = computeLegacyAuditHash(rawPayload, prevHash);
    if (c2 === ev.integrity_hash) {
      legacy++;
      continue;
    }

    failed++;
    failedList.push(ev);
  }

  console.log(`Tenant 11111111 events: ${tenantEvents.length} total -> ${modern} modern, ${legacy} legacy, ${failed} failed.`);
  if (failedList.length > 0) {
    console.log('Sample failed:', failedList.slice(0, 3).map(e => ({ id: e.id, type: e.event_type, time: e.timestamp })));
  }

  await pool.end();
}

testWithLegacyHash().catch(err => {
  console.error(err);
  process.exit(1);
});
