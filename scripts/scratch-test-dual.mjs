import pg from 'pg';
import crypto from 'node:crypto';
import { canonicalizeAuditPayload, computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

// Legacy canonicalizer that used Object.keys replacer
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

async function testDualVerification() {
  const events = (await pool.query(`SELECT * FROM core.audit_events ORDER BY timestamp ASC`)).rows;

  let passed = 0;
  let failed = 0;
  const failedList = [];

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

    const prevHash = ev.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000';

    // 1. Primary verification
    const c1 = computeAuditHash(rawPayload, prevHash);
    if (c1 === ev.integrity_hash) {
      passed++;
      continue;
    }

    // 2. Legacy verification (pre-normalization metadata without preserved fields or with legacy canonicalizer)
    const rawMeta = { ...(ev.metadata || {}) };
    delete rawMeta.preservedActorId;
    delete rawMeta.preservedBranchId;
    delete rawMeta.preservedTenantId;

    const c2 = computeAuditHash({ ...rawPayload, metadata: rawMeta }, prevHash);
    if (c2 === ev.integrity_hash) {
      passed++;
      continue;
    }

    // 3. Legacy replacer canonicalizer
    const c3 = computeLegacyHash(rawPayload, prevHash);
    if (c3 === ev.integrity_hash) {
      passed++;
      continue;
    }

    const c4 = computeLegacyHash({ ...rawPayload, metadata: rawMeta }, prevHash);
    if (c4 === ev.integrity_hash) {
      passed++;
      continue;
    }

    // 4. Test with rawActorId if present in metadata
    if (ev.metadata?.actorUserId) {
      const c5 = computeLegacyHash({ ...rawPayload, actorId: ev.metadata.actorUserId, metadata: rawMeta }, prevHash);
      if (c5 === ev.integrity_hash) {
        passed++;
        continue;
      }
      const c6 = computeAuditHash({ ...rawPayload, actorId: ev.metadata.actorUserId, metadata: rawMeta }, prevHash);
      if (c6 === ev.integrity_hash) {
        passed++;
        continue;
      }
    }

    failed++;
    failedList.push(ev);
  }

  console.log(`Dual Verification Result: ${passed} passed, ${failed} failed out of ${events.length} total events.`);
  if (failedList.length > 0) {
    console.log('Sample still failing:', failedList.slice(0, 5).map(e => ({ id: e.id, type: e.event_type, time: e.timestamp })));
  }

  await pool.end();
}

testDualVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
