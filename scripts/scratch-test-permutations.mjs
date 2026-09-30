import pg from 'pg';
import { createHash } from 'node:crypto';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

function canonicalize(payload, previousHash) {
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
    timestamp: payload.timestamp.toISOString()
  };
  return JSON.stringify(normalized, Object.keys(normalized).sort());
}

function hashPayload(payload, prevHash) {
  const str = canonicalize(payload, prevHash);
  return createHash('sha256').update(str, 'utf8').digest('hex');
}

// Function to generate all permutations of an array
function permute(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permute(remaining)) {
      result.push([current, ...p]);
    }
  }
  return result;
}

async function testPermutations() {
  const res = await pool.query(`SELECT * FROM core.audit_events WHERE id = 'ee64bd57-b82e-45d5-86d3-378b919a96b7'`);
  const ev = res.rows[0];

  const keys = Object.keys(ev.metadata);
  console.log('Testing all key permutations of metadata for ee64bd57:', keys);

  const perms = permute(keys);
  console.log(`Total permutations: ${perms.length}`);

  let found = false;
  for (const p of perms) {
    const reorderedMeta = {};
    for (const k of p) {
      reorderedMeta[k] = ev.metadata[k];
    }
    const h = hashPayload({
      tenantId: ev.tenant_id,
      branchId: ev.branch_id,
      actorId: ev.actor_id,
      eventType: ev.event_type,
      resourceType: ev.resource_type,
      resourceId: ev.resource_id,
      correlationId: ev.correlation_id,
      ipAddress: ev.ip_address,
      userAgent: ev.user_agent,
      metadata: reorderedMeta,
      timestamp: new Date(ev.timestamp)
    }, ev.previous_hash);

    if (h === ev.integrity_hash) {
      console.log('MATCH FOUND WITH KEY ORDER:', p);
      found = true;
      break;
    }
  }

  if (!found) {
    console.log('Not a key permutation issue on full metadata. Checking if hash was computed on original metadata (before enrichment) with permutations...');
    const originalKeys = Object.keys(ev.metadata).filter(k => !k.startsWith('preserved'));
    const origPerms = permute(originalKeys);
    for (const p of origPerms) {
      const origMeta = {};
      for (const k of p) {
        origMeta[k] = ev.metadata[k];
      }
      const h = hashPayload({
        tenantId: ev.tenant_id,
        branchId: ev.branch_id,
        actorId: ev.actor_id,
        eventType: ev.event_type,
        resourceType: ev.resource_type,
        resourceId: ev.resource_id,
        correlationId: ev.correlation_id,
        ipAddress: ev.ip_address,
        userAgent: ev.user_agent,
        metadata: origMeta,
        timestamp: new Date(ev.timestamp)
      }, ev.previous_hash);

      if (h === ev.integrity_hash) {
        console.log('MATCH FOUND ON ORIGINAL METADATA WITH KEY ORDER:', p);
        found = true;
        break;
      }
    }
  }

  await pool.end();
}

testPermutations().catch(err => {
  console.error(err);
  process.exit(1);
});
