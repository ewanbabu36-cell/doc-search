import pg from 'pg';
import crypto from 'node:crypto';
import { canonicalizeAuditPayload, computeAuditHash } from '../packages/auth/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

// Let's test different legacy reconstruction variants on the 72 events
async function testLegacyVariants() {
  const allEvents = (await pool.query(`SELECT * FROM core.audit_events ORDER BY timestamp ASC`)).rows;

  let modernMatch = 0;
  let legacyMatch = 0;
  let stillUnmatched = 0;
  const stillUnmatchedEvents = [];

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

    const computed = computeAuditHash(rawPayload, ev.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000');
    if (computed === ev.integrity_hash) {
      modernMatch++;
      continue;
    }

    // Test variant 1: raw metadata without preserved fields
    const rawMeta = { ...(ev.metadata || {}) };
    delete rawMeta.preservedActorId;
    delete rawMeta.preservedBranchId;
    delete rawMeta.preservedTenantId;

    const payloadNoPreserved = {
      ...rawPayload,
      metadata: rawMeta
    };
    const c2 = computeAuditHash(payloadNoPreserved, ev.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000');
    if (c2 === ev.integrity_hash) {
      legacyMatch++;
      continue;
    }

    // Test variant 2: empty metadata {}
    const payloadEmptyMeta = {
      ...rawPayload,
      metadata: {}
    };
    const c3 = computeAuditHash(payloadEmptyMeta, ev.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000');
    if (c3 === ev.integrity_hash) {
      legacyMatch++;
      continue;
    }

    // Test variant 3: branchId undefined/null
    const payloadNullBranch = {
      ...rawPayload,
      branchId: undefined
    };
    const c4 = computeAuditHash(payloadNullBranch, ev.previous_hash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000');
    if (c4 === ev.integrity_hash) {
      legacyMatch++;
      continue;
    }

    stillUnmatched++;
    stillUnmatchedEvents.push({ id: ev.id, type: ev.event_type, time: ev.timestamp });
  }

  console.log(`Summary across all ${allEvents.length} events:`);
  console.log(`- Modern match:   ${modernMatch}`);
  console.log(`- Legacy match:   ${legacyMatch}`);
  console.log(`- Still unmatch:  ${stillUnmatched}`);
  if (stillUnmatched > 0) {
    console.log('Sample still unmatched:', stillUnmatchedEvents.slice(0, 10));
  }

  await pool.end();
}

testLegacyVariants().catch(err => {
  console.error(err);
  process.exit(1);
});
