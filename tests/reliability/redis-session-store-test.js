import { RedisSessionStore } from '../../packages/auth/dist/redis-session-store.js';
import { EventEmitter } from 'node:events';

console.log('\n======================================================================');
console.log('🔴 TEST SUITE: DISTRIBUTED REDIS SESSION STORE (P0-2 VERIFICATION)');
console.log('======================================================================\n');

// In-process Mock Redis instance supporting pipeline, sadd, smembers, expire, get, set
class MockRedisClient extends EventEmitter {
  constructor() {
    super();
    this.store = new Map();
    this.sets = new Map();
    this.ttls = new Map();
    this.isHealthy = true;
  }

  async get(key) {
    if (!this.isHealthy) throw new Error('ECONNREFUSED: Redis cluster unreachable');
    return this.store.get(key) || null;
  }

  async set(key, val, ex, ttl) {
    if (!this.isHealthy) throw new Error('ECONNREFUSED: Redis cluster unreachable');
    this.store.set(key, val);
    if (ex === 'EX' && ttl) {
      this.ttls.set(key, Date.now() + ttl * 1000);
    }
    return 'OK';
  }

  async sadd(key, member) {
    if (!this.isHealthy) throw new Error('ECONNREFUSED: Redis cluster unreachable');
    let s = this.sets.get(key);
    if (!s) {
      s = new Set();
      this.sets.set(key, s);
    }
    s.add(member);
    return 1;
  }

  async smembers(key) {
    if (!this.isHealthy) throw new Error('ECONNREFUSED: Redis cluster unreachable');
    const s = this.sets.get(key);
    return s ? Array.from(s) : [];
  }

  async expire(key, ttl) {
    if (!this.isHealthy) throw new Error('ECONNREFUSED: Redis cluster unreachable');
    this.ttls.set(key, Date.now() + ttl * 1000);
    return 1;
  }

  pipeline() {
    const operations = [];
    const client = this;
    return {
      set(key, val, ex, ttl) {
        operations.push(() => client.set(key, val, ex, ttl));
        return this;
      },
      sadd(key, member) {
        operations.push(() => client.sadd(key, member));
        return this;
      },
      expire(key, ttl) {
        operations.push(() => client.expire(key, ttl));
        return this;
      },
      async exec() {
        const results = [];
        for (const op of operations) {
          try {
            const res = await op();
            results.push([null, res]);
          } catch (err) {
            results.push([err, null]);
          }
        }
        return results;
      }
    };
  }

  async quit() {
    return 'OK';
  }
}

async function runRedisSessionStoreTests() {
  const sharedRedis = new MockRedisClient();

  // Node A and Node B both connected to the same shared Redis instance
  const nodeAStore = new RedisSessionStore(sharedRedis, { keyPrefix: 'test:session:' });
  const nodeBStore = new RedisSessionStore(sharedRedis, { keyPrefix: 'test:session:' });

  const testResults = [];

  // Test 1: Node A writes session, Node B reads session
  console.log('[+] Test 1: Multi-node session sharing (Node A writes -> Node B reads)...');
  const now = new Date();
  const session1 = {
    id: 'sess-test-001',
    userId: 'usr-doctor-01',
    tenantId: 'tenant-apollo-01',
    branchId: 'branch-south-01',
    roles: ['DOCTOR'],
    permissions: ['VIEW_PATIENTS', 'WRITE_PRESCRIPTIONS'],
    tokenFamilyId: 'fam-token-001',
    refreshTokenHash: 'hash-tok-alpha-001',
    expiresAt: new Date(Date.now() + 3600000),
    revokedAt: null,
    lastUsedAt: now,
    createdAt: now
  };

  await nodeAStore.saveSession(session1);
  const retrievedOnNodeB = await nodeBStore.findSessionById('sess-test-001');
  const retrievedByHashOnNodeB = await nodeBStore.findSessionByTokenHash('hash-tok-alpha-001');

  const test1Passed = retrievedOnNodeB?.id === session1.id && retrievedByHashOnNodeB?.id === session1.id;
  testResults.push({
    test: 'Multi-Node Session Sharing',
    status: test1Passed ? 'PASS' : 'FAIL',
    details: test1Passed ? 'Node B successfully retrieved session created by Node A via Redis' : 'Lookup failed'
  });

  // Test 2: Token Rotation across nodes
  console.log('[+] Test 2: Token Rotation (Node A creates initial -> Node B rotates)...');
  const session2 = {
    ...session1,
    id: 'sess-test-002',
    refreshTokenHash: 'hash-tok-alpha-002',
    lastUsedAt: new Date()
  };
  await nodeBStore.saveSession(session2);

  const foundSess2 = await nodeAStore.findSessionByTokenHash('hash-tok-alpha-002');
  const test2Passed = foundSess2?.id === 'sess-test-002';
  testResults.push({
    test: 'Token Rotation Synchronization',
    status: test2Passed ? 'PASS' : 'FAIL',
    details: test2Passed ? 'Node A immediately sees rotated session saved on Node B' : 'Lookup failed'
  });

  // Test 3: Token Family Revocation (compromise detection)
  console.log('[+] Test 3: Family-wide Revocation (Node A revokes family -> Node B verifies all revoked)...');
  await nodeAStore.revokeSessionFamily('fam-token-001', 'Compromised refresh token reuse detected');

  const check1 = await nodeBStore.findSessionById('sess-test-001');
  const check2 = await nodeBStore.findSessionById('sess-test-002');

  const test3Passed = check1?.revokedAt !== null && check2?.revokedAt !== null;
  testResults.push({
    test: 'Distributed Family Revocation',
    status: test3Passed ? 'PASS' : 'FAIL',
    details: test3Passed ? 'Both sessions in family revoked across Node A & B immediately' : 'Revocation failed'
  });

  // Test 4: Individual Session Revocation
  console.log('[+] Test 4: Individual Session Revocation (Node B logs out user)...');
  const session3 = {
    id: 'sess-test-003',
    userId: 'usr-nurse-02',
    tenantId: 'tenant-apollo-01',
    branchId: 'branch-south-01',
    roles: ['NURSE'],
    permissions: ['VIEW_VITALS'],
    tokenFamilyId: 'fam-token-002',
    refreshTokenHash: 'hash-tok-beta-001',
    expiresAt: new Date(Date.now() + 3600000),
    revokedAt: null,
    lastUsedAt: now,
    createdAt: now
  };
  await nodeAStore.saveSession(session3);
  await nodeBStore.revokeSession('sess-test-003', 'User clicked logout on Node B');

  const checkSess3 = await nodeAStore.findSessionById('sess-test-003');
  const test4Passed = checkSess3?.revokedAt !== null;
  testResults.push({
    test: 'Cross-Node Logout Revocation',
    status: test4Passed ? 'PASS' : 'FAIL',
    details: test4Passed ? 'Node A sees session revoked by Node B logout' : 'Revocation check failed'
  });

  // Test 5: Infrastructure Failure Resilience (No silent in-memory fallback)
  console.log('[+] Test 5: Infrastructure Failure Behavior (Redis offline -> 503 error, NO silent fallback)...');
  sharedRedis.isHealthy = false; // Simulate network partition or Redis crash
  let failedSafely = false;
  let errorCode = '';
  let statusCode = 0;

  try {
    await nodeAStore.saveSession(session3);
  } catch (err) {
    failedSafely = true;
    errorCode = err.code;
    statusCode = err.statusCode;
  }

  const test5Passed = failedSafely && statusCode === 503 && errorCode === 'SERVICE_UNAVAILABLE';
  testResults.push({
    test: 'Redis Failure Safe Defense (No In-Memory Fallback)',
    status: test5Passed ? 'PASS' : 'FAIL',
    details: test5Passed
      ? `Controlled 503 SERVICE_UNAVAILABLE thrown: ${errorCode} (${statusCode})`
      : `Unexpected behavior: failedSafely=${failedSafely}, statusCode=${statusCode}`
  });

  console.log('\n----------------------------------------------------------------------');
  console.log('📊 REDIS SESSION STORE AUDIT SUMMARY TABLE');
  console.log('----------------------------------------------------------------------');
  console.table(testResults);
  console.log('======================================================================\n');

  const allPassed = testResults.every(r => r.status === 'PASS');
  if (!allPassed) {
    process.exit(1);
  }
}

runRedisSessionStoreTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
