process.env['RATE_LIMIT_MAX'] = '1000000';
process.env['NODE_ENV'] = 'test';

import { performance } from 'node:perf_hooks';
import { EventEmitter } from 'node:events';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { setSessionStore } from '../../apps/api-gateway/dist/routes/auth.routes.js';
import { RedisSessionStore } from '../../packages/auth/dist/redis-session-store.js';

console.log('\n======================================================================');
console.log('🔄 TEST SUITE 1 — MULTI-INSTANCE API GATEWAY & LOAD BALANCING AUDIT');
console.log('======================================================================\n');

// Mock Redis cluster implementation shared across Gateway Node A and Node B
class SharedMockRedis extends EventEmitter {
  constructor() {
    super();
    this.store = new Map();
    this.sets = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, val, ex, ttl) {
    this.store.set(key, val);
    if (ex === 'EX' && ttl) {
      this.ttls.set(key, Date.now() + ttl * 1000);
    }
    return 'OK';
  }

  async sadd(key, member) {
    let s = this.sets.get(key);
    if (!s) {
      s = new Set();
      this.sets.set(key, s);
    }
    s.add(member);
    return 1;
  }

  async smembers(key) {
    const s = this.sets.get(key);
    return s ? Array.from(s) : [];
  }

  async expire(key, ttl) {
    this.ttls.set(key, Date.now() + ttl * 1000);
    return 1;
  }

  pipeline() {
    const ops = [];
    const client = this;
    return {
      set(key, val, ex, ttl) {
        ops.push(() => client.set(key, val, ex, ttl));
        return this;
      },
      sadd(key, member) {
        ops.push(() => client.sadd(key, member));
        return this;
      },
      expire(key, ttl) {
        ops.push(() => client.expire(key, ttl));
        return this;
      },
      async exec() {
        const results = [];
        for (const op of ops) {
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

async function runMultiInstanceTest() {
  // Configure shared Redis session store for both instances
  const sharedRedis = new SharedMockRedis();
  const sharedSessionStore = new RedisSessionStore(sharedRedis);
  setSessionStore(sharedSessionStore);

  console.log('[+] Initializing Gateway Instance 1 (Node A)...');
  const instance1 = await buildApp();
  await instance1.ready();

  console.log('[+] Initializing Gateway Instance 2 (Node B)...');
  const instance2 = await buildApp();
  await instance2.ready();

  const instances = [instance1, instance2];
  let roundRobinIndex = 0;

  // Round-robin proxy dispatcher simulating a Layer 7 Load Balancer (e.g. AWS ALB / NGINX)
  const proxyDispatch = async (opts) => {
    const target = instances[roundRobinIndex % instances.length];
    roundRobinIndex++;
    return await target.inject(opts);
  };

  const results = [];

  // Test 1: Stateless JWT Authentication Across Instances
  console.log('[+] Test 1: Stateless JWT Verification (Login Node A -> Query Node B)...');
  const loginRes = await instance1.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'doctor.rajesh@docsearch.health', password: 'DoctorPass123!' }
  });
  const token = JSON.parse(loginRes.payload).data?.accessToken;
  const refreshToken = JSON.parse(loginRes.payload).data?.refreshToken;
  const authHeaders = { authorization: `Bearer ${token}` };

  // Dispatch authenticated request to Node B
  const queryNodeBRes = await instance2.inject({
    method: 'POST',
    url: '/api/v1/workflow/pricing/calculate',
    headers: authHeaders,
    payload: { planCode: 'HOSPITAL_ENTERPRISE', durationMonths: 12, doctorSeats: 15 }
  });

  const statelessAuthPassed = queryNodeBRes.statusCode === 200;
  results.push({
    test: 'Stateless JWT Verification Across Nodes',
    nodeFlow: 'Login (Node A) -> Query (Node B)',
    status: statelessAuthPassed ? 'PASS' : 'FAIL',
    details: statelessAuthPassed
      ? 'JWT cryptographically verified on Node B without shared memory'
      : `HTTP ${queryNodeBRes.statusCode}`
  });

  // Test 2: Refresh Token & Session Sharing Across Instances
  console.log('[+] Test 2: Refresh Token Rotation Across Nodes (Login Node A -> Refresh Node B)...');
  const refreshNodeBRes = await instance2.inject({
    method: 'POST',
    url: '/api/v1/auth/refresh',
    payload: { refreshToken }
  });

  const refreshSuccess = refreshNodeBRes.statusCode === 200;
  results.push({
    test: 'Stateful Session Sharing Across Nodes',
    nodeFlow: 'Login (Node A) -> Refresh Token (Node B)',
    status: refreshSuccess ? 'PASS' : 'FAIL (ARCHITECTURAL DEFECT)',
    details: refreshSuccess
      ? 'Shared Redis session store synchronized across Node A & Node B'
      : `HTTP ${refreshNodeBRes.statusCode}: In-memory session store is isolated to Node A process memory`
  });

  // Test 3: Concurrent Round-Robin Workload (1,000 requests distributed across Node A & B)
  console.log('[+] Test 3: 1,000 Concurrent Requests Distributed Across Nodes via Proxy...');
  const t0 = performance.now();
  const reqPromises = [];
  let successfulDispatches = 0;
  let failedDispatches = 0;

  for (let i = 0; i < 1000; i++) {
    const p = proxyDispatch({
      method: i % 2 === 0 ? 'GET' : 'POST',
      url: i % 2 === 0 ? '/health' : '/api/v1/workflow/pricing/calculate',
      headers: i % 2 === 0 ? {} : authHeaders,
      payload: i % 2 === 0 ? undefined : { planCode: 'PATHOLOGY_PRO', durationMonths: 6, doctorSeats: 5 }
    }).then((res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) successfulDispatches++;
      else failedDispatches++;
    });
    reqPromises.push(p);
  }

  await Promise.all(reqPromises);
  const totalSec = (performance.now() - t0) / 1000;
  const throughputRps = (1000 / totalSec).toFixed(1);

  results.push({
    test: '1,000 Round-Robin Load Balancer Throughput',
    nodeFlow: '500 Node A / 500 Node B',
    status: failedDispatches === 0 ? 'PASS' : 'FAIL',
    details: `Throughput: ${throughputRps} RPS | Success: ${successfulDispatches}/1000 | Errors: ${failedDispatches}`
  });

  // Test 4: Graceful Shutdown of Node A while Node B serves traffic
  console.log('[+] Test 4: Single-Node Failover / Graceful Shutdown of Node A...');
  await instance1.close();
  const survivingRes = await instance2.inject({
    method: 'GET',
    url: '/health'
  });
  results.push({
    test: 'Single Node Crash / Graceful Shutdown',
    nodeFlow: 'Kill Node A -> Query Surviving Node B',
    status: survivingRes.statusCode === 200 ? 'PASS' : 'FAIL',
    details: 'Node B continued serving health checks and traffic seamlessly'
  });

  await instance2.close();

  console.log('\n----------------------------------------------------------------------');
  console.log('📊 MULTI-INSTANCE LOAD BALANCING AUDIT TABLE');
  console.log('----------------------------------------------------------------------');
  console.table(results);
  console.log('======================================================================\n');

  const allPassed = results.every(r => r.status === 'PASS');
  if (!allPassed) {
    process.exit(1);
  }
}

runMultiInstanceTest().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
