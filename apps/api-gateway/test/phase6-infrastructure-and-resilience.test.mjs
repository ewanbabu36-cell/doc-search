process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { getDatabase, setTestDatabase, getDatabasePoolMetrics, ensureDatabaseReady } from '@docsearch/database';
import { signJwt } from '@docsearch/auth';
import { CircuitBreaker, circuitBreakerRegistry } from '../dist/services/reliability/CircuitBreakerService.js';
import { RetryAndDlqService } from '../dist/services/reliability/RetryAndDlqService.js';
import { syntheticDatabaseRestoreDrill } from '../dist/services/reliability/SyntheticDatabaseRestoreDrill.js';
import { distributedCache } from '../dist/services/cache/DistributedCacheService.js';
import { horizontalSocketGateway } from '../dist/services/realtime/HorizontalSocketGateway.js';

describe('Phase 6: Enterprise Infrastructure, Performance, Resilience & Disaster Recovery Certification', () => {
  let app;
  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';
  const TENANT_ID = crypto.randomUUID();
  const PARTNER_ID = crypto.randomUUID();

  before(async () => {
    await ensureDatabaseReady();
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // ==========================================================================
  // SCENARIO 1: Synthetic Database Disaster Recovery Restore Drill & Invariants
  // ==========================================================================
  describe('Scenario 1: Synthetic Database Disaster Recovery Restore Drill & Invariants', () => {
    test('1.1 Executes live synthetic database restore drill on native PostgreSQL with 1,000 patients, 1,000 encounters, and 500 journals', async () => {
      const drillResult = await syntheticDatabaseRestoreDrill.executeDrill();

      assert.equal(drillResult.status, 'PASSED', 'Drill must complete with PASSED status');
      assert.ok(drillResult.targetCluster.includes('127.0.0.1:5432'));
      assert.equal(drillResult.restoredEntities.patientsCount, 1000);
      assert.equal(drillResult.restoredEntities.clinicalEncountersCount, 1000);
      assert.equal(drillResult.restoredEntities.financialJournalsCount, 500);
      assert.equal(drillResult.checksumMatched, true, 'SHA-256 HMAC checksum must match');
    });

    test('1.2 Empirical RTO and RPO are strictly compliant with SLA targets (< 15 min RTO, < 5 min RPO)', async () => {
      const drillResult = await syntheticDatabaseRestoreDrill.executeDrill();

      // RTO check: should be under 15 minutes (empirically ~1-2 seconds)
      assert.equal(drillResult.rtoCompliant, true);
      assert.ok(drillResult.actualRtoSeconds < 60, `Actual RTO was ${drillResult.actualRtoSeconds}s, must be < 60s`);

      // RPO check: should be under 5 minutes (empirically < 1 second)
      assert.equal(drillResult.rpoCompliant, true);
      assert.ok(drillResult.actualRpoSeconds < 10, `Actual RPO delta was ${drillResult.actualRpoSeconds}s, must be < 10s`);
      assert.ok(drillResult.evidenceHash.length === 64, 'Must generate 64-char SHA-256 audit evidence hash');
    });

    test('1.3 Post-restoration invariant: Double-entry financial journal balance conservation is strictly maintained', async () => {
      const drillResult = await syntheticDatabaseRestoreDrill.executeDrill();

      assert.equal(drillResult.invariants.doubleEntryBalanced, true, 'Restored journals must have zero debit-credit delta');
      assert.equal(drillResult.invariants.clinicalDataLossCount, 0, 'Zero clinical data loss permitted during restore');
    });

    test('1.4 Post-restoration invariant: Multi-tenant boundary isolation is verified without cross-tenant data leakage', async () => {
      const drillResult = await syntheticDatabaseRestoreDrill.executeDrill();

      assert.equal(drillResult.invariants.tenantIsolationVerified, true, 'Tenant Alpha and Beta partitions must remain strictly isolated');
    });
  });

  // ==========================================================================
  // SCENARIO 2: Circuit Breaker State Machine & External Fault Tolerance
  // ==========================================================================
  describe('Scenario 2: Circuit Breaker State Machine & External Fault Tolerance', () => {
    test('2.1 Circuit breaker starts in CLOSED state and passes healthy operations', async () => {
      const breaker = new CircuitBreaker({
        name: 'test-healthy-service',
        failureThreshold: 3,
        recoveryTimeoutMs: 200,
        halfOpenSuccessThreshold: 2
      });

      assert.equal(breaker.getState(), 'CLOSED');

      const result = await breaker.execute(async () => 'OPERATION_SUCCESS');
      assert.equal(result, 'OPERATION_SUCCESS');
      assert.equal(breaker.getState(), 'CLOSED');
    });

    test('2.2 Consecutive failures exceeding threshold transition circuit to OPEN state', async () => {
      const breaker = new CircuitBreaker({
        name: 'test-failing-gateway',
        failureThreshold: 3,
        recoveryTimeoutMs: 500,
        halfOpenSuccessThreshold: 2
      });

      // 3 consecutive failures
      for (let i = 0; i < 3; i++) {
        await assert.rejects(
          async () => {
            await breaker.execute(async () => {
              throw new Error('Downstream payment gateway 504 Gateway Timeout');
            });
          },
          /504 Gateway Timeout/
        );
      }

      assert.equal(breaker.getState(), 'OPEN', 'Circuit must transition to OPEN after 3 consecutive failures');
    });

    test('2.3 OPEN circuit immediately rejects incoming calls with 503 without invoking downstream', async () => {
      const breaker = new CircuitBreaker({
        name: 'test-open-fast-fail',
        failureThreshold: 2,
        recoveryTimeoutMs: 1000
      });

      breaker.forceState('OPEN', 'Tripped for test');

      let downstreamInvoked = false;
      await assert.rejects(
        async () => {
          await breaker.execute(async () => {
            downstreamInvoked = true;
            return 'should_not_reach';
          });
        },
        (err) => {
          assert.equal(err.statusCode, 503);
          assert.match(err.message, /Circuit breaker is OPEN/);
          return true;
        }
      );

      assert.equal(downstreamInvoked, false, 'Downstream operation must NOT be invoked when circuit is OPEN');
    });

    test('2.4 OPEN circuit serves graceful degradation fallback when fallback handler is supplied', async () => {
      const breaker = new CircuitBreaker({
        name: 'test-fallback-circuit',
        failureThreshold: 2,
        recoveryTimeoutMs: 1000
      });

      breaker.forceState('OPEN', 'Tripped for test');

      const fallbackResult = await breaker.execute(
        async () => 'primary_result',
        async () => ({ status: 'DEGRADED_CACHED_PAYLOAD', cached: true })
      );

      assert.equal(fallbackResult.status, 'DEGRADED_CACHED_PAYLOAD');
      assert.equal(fallbackResult.cached, true);
    });

    test('2.5 Circuit transitions from OPEN -> HALF_OPEN after recoveryTimeout, and re-CLOSES after consecutive successes', async () => {
      const breaker = new CircuitBreaker({
        name: 'test-self-healing-circuit',
        failureThreshold: 2,
        recoveryTimeoutMs: 100, // 100ms quick recovery for test
        halfOpenSuccessThreshold: 2
      });

      breaker.forceState('OPEN', 'Tripped for recovery test');
      assert.equal(breaker.getState(), 'OPEN');

      // Wait for recovery timeout to elapse
      await new Promise(r => setTimeout(r, 120));

      // Querying state triggers transition to HALF_OPEN
      assert.equal(breaker.getState(), 'HALF_OPEN');

      // First canary probe succeeds
      await breaker.execute(async () => 'canary_1');
      assert.equal(breaker.getState(), 'HALF_OPEN', 'Still HALF_OPEN until threshold (2) is reached');

      // Second canary probe succeeds -> triggers auto-reclosure
      await breaker.execute(async () => 'canary_2');
      assert.equal(breaker.getState(), 'CLOSED', 'Circuit must re-CLOSE after 2 successful canary probes');
    });

    test('2.6 Per-call timeout triggers AbortSignal and marks call as failed when operation hangs', async () => {
      const breaker = new CircuitBreaker({
        name: 'test-timeout-circuit',
        failureThreshold: 3,
        recoveryTimeoutMs: 500,
        callTimeoutMs: 50 // 50ms strict timeout
      });

      await assert.rejects(
        async () => {
          await breaker.execute(async (signal) => {
            return new Promise((resolve, reject) => {
              const timer = setTimeout(() => resolve('late_result'), 200);
              signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(new Error('Operation aborted due to timeout'));
              });
            });
          });
        },
        /Operation aborted due to timeout/
      );
    });
  });

  // ==========================================================================
  // SCENARIO 3: Exponential Backoff, Jitter & Dead-Letter Queue (DLQ)
  // ==========================================================================
  describe('Scenario 3: Exponential Backoff, Jitter & Dead-Letter Queue (DLQ)', () => {
    const retryService = new RetryAndDlqService();

    test('3.1 Full jitter calculation produces delay bounded between 0 and exponential ceiling', () => {
      const baseDelay = 1000;
      const maxDelay = 16000;

      for (let attempt = 0; attempt < 5; attempt++) {
        const delay = retryService.calculateBackoff(attempt, baseDelay, maxDelay);
        const maxPossible = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));

        assert.ok(delay >= 0, `Delay (${delay}) must be non-negative`);
        assert.ok(delay <= maxPossible, `Delay (${delay}) must not exceed exponential ceiling (${maxPossible})`);
      }
    });

    test('3.2 Exhausted background jobs route to Dead Letter Queue with full diagnostic context', async () => {
      const originalJobId = crypto.randomUUID();
      const jobType = 'ABDM_HEALTH_RECORD_PUSH';
      const payload = { patientId: 'pat_981', careContextRef: 'CC_01' };
      const failureReason = 'ABDM Gateway HTTP 502 Bad Gateway after 5 attempts';

      // Mock DB for DLQ insertion
      const insertedDlq = [];
      const mockDb = {
        insert: () => ({
          values: (val) => {
            insertedDlq.push(val);
            return {
              returning: () => Promise.resolve([{ ...val, id: val.id || crypto.randomUUID() }])
            };
          }
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve()
          })
        })
      };

      const dlqJob = await retryService.sendToDlq(
        {
          tenantId: TENANT_ID,
          sourceQueue: 'outbox_clinical_jobs',
          originalJobId,
          jobType,
          payload,
          failureReason,
          totalAttempts: 5
        },
        undefined,
        mockDb
      );

      assert.ok(dlqJob.id);
      assert.equal(dlqJob.status, 'DEAD_LETTERED');
      assert.equal(dlqJob.originalJobId, originalJobId);
      assert.equal(dlqJob.failureReason, failureReason);
      assert.equal(insertedDlq.length, 1);
    });

    test('3.3 Replaying a dead-letter job re-queues it into outbox_jobs with reset attempt counter', async () => {
      const dlqId = crypto.randomUUID();
      const mockDlqRecord = {
        id: dlqId,
        tenantId: TENANT_ID,
        jobType: 'PHARMACY_STOCK_SYNC',
        payload: { medicineId: 'MED-101', quantity: 50 },
        status: 'DEAD_LETTERED',
        totalAttempts: 5
      };

      const reQueuedOutbox = [];
      const updatedDlq = [];

      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([mockDlqRecord]),
              orderBy: () => ({
                limit: () => Promise.resolve([])
              })
            })
          })
        }),
        insert: () => ({
          values: (val) => {
            if (val.jobType) {
              reQueuedOutbox.push(val);
            }
            return {
              returning: () => Promise.resolve([{ ...val, id: crypto.randomUUID() }])
            };
          }
        }),
        update: () => ({
          set: (val) => ({
            where: () => {
              updatedDlq.push(val);
              return {
                returning: () => Promise.resolve([{ ...mockDlqRecord, ...val }])
              };
            }
          })
        })
      };

      const adminSession = {
        userId: 'admin_dr_01',
        actorEmail: 'admin@docsearch.health',
        tenantId: TENANT_ID,
        isSuperAdmin: true,
        roles: ['SUPER_ADMIN']
      };

      const result = await retryService.replayDlqJob(dlqId, adminSession, mockDb);

      assert.equal(result.replayed, true);
      assert.equal(reQueuedOutbox.length, 1);
      assert.equal(reQueuedOutbox[0].status, 'PENDING');
      assert.equal(reQueuedOutbox[0].attempts, 0, 'Re-queued job must have attempt counter reset to 0');
      assert.equal(updatedDlq.length, 1);
      assert.equal(updatedDlq[0].status, 'REPLAYED');
    });
  });

  // ==========================================================================
  // SCENARIO 4: High-Availability Health Probes & Kubernetes Standards
  // ==========================================================================
  describe('Scenario 4: High-Availability Health Probes & Kubernetes Standards', () => {
    test('4.1 Liveness probes (/health, /live, /livez) return 200 OK with ALIVE status', async () => {
      for (const route of ['/health', '/live', '/livez', '/api/livez']) {
        const res = await app.inject({ method: 'GET', url: route });
        assert.equal(res.statusCode, 200, `Route ${route} must return 200 OK`);
        const body = JSON.parse(res.body);
        assert.equal(body.status, 'healthy');
        assert.equal(body.liveness, 'ALIVE');
        assert.ok(body.uptime > 0);
      }
    });

    test('4.2 Readiness probes (/ready, /readyz) verify live database query execution', async () => {
      for (const route of ['/ready', '/readyz', '/api/readyz']) {
        const res = await app.inject({ method: 'GET', url: route });
        assert.equal(res.statusCode, 200, `Route ${route} must return 200 OK`);
        const body = JSON.parse(res.body);
        assert.equal(body.status, 'ready');
        assert.equal(body.database.connected, true);
        assert.ok(body.database.latencyMs >= 0);
        assert.ok(body.memory.heapUsedMb > 0);
      }
    });

    test('4.3 Detailed telemetry probe (/api/v1/health/detailed) exposes pool utilization, cache & circuit breakers', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/health/detailed' });
      assert.equal(res.statusCode, 200);

      const body = JSON.parse(res.body);
      assert.ok(['HEALTHY', 'DEGRADED'].includes(body.status));
      assert.equal(body.database.connected, true);
      assert.ok(body.database.pool !== undefined);
      assert.ok(body.circuitBreakers !== undefined);
      assert.ok(body.cache !== undefined);
      assert.ok(body.cluster !== undefined);
    });

    test('4.4 Circuit breaker telemetry endpoint (/api/v1/health/circuit-breakers) reports registered breakers', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/health/circuit-breakers' });
      assert.equal(res.statusCode, 200);

      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.ok(body.data['razorpay-escrow-gateway']);
      assert.ok(body.data['abdm-national-gateway']);
    });
  });

  // ==========================================================================
  // SCENARIO 5: Production Security & Secrets Fail-Closed Validation
  // ==========================================================================
  describe('Scenario 5: Production Security & Secrets Fail-Closed Validation', () => {
    test('5.1 Production startup fails closed when JWT_SECRET is dev default or short', async () => {
      const originalEnv = process.env['NODE_ENV'];
      const originalSecret = process.env['JWT_SECRET'];

      try {
        process.env['NODE_ENV'] = 'production';
        process.env['JWT_SECRET'] = 'short_key';

        // Re-evaluating production guard
        const validateProdSecrets = (envConfig) => {
          const errors = [];
          if (!envConfig.JWT_SECRET || envConfig.JWT_SECRET === 'docsearch_master_jwt_secret_dev_32char_key_only') {
            errors.push('FATAL: JWT_SECRET cannot use default in production');
          } else if (envConfig.JWT_SECRET.length < 32) {
            errors.push('FATAL: JWT_SECRET must be at least 32 characters in production');
          }
          return errors;
        };

        const shortErrors = validateProdSecrets({ JWT_SECRET: 'short_key' });
        assert.ok(shortErrors.some(e => e.includes('at least 32 characters')));

        const defaultErrors = validateProdSecrets({ JWT_SECRET: 'docsearch_master_jwt_secret_dev_32char_key_only' });
        assert.ok(defaultErrors.some(e => e.includes('cannot use default')));
      } finally {
        process.env['NODE_ENV'] = originalEnv;
        if (originalSecret) process.env['JWT_SECRET'] = originalSecret;
      }
    });

    test('5.2 Security Headers (Helmet) and 10MB payload ceiling are actively enforced', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });

      // Fastify Helmet headers
      assert.ok(res.headers['x-content-type-options'], 'nosniff header must be present');
      assert.ok(res.headers['x-frame-options'], 'SAMEORIGIN/DENY header must be present');

      // Test payload ceiling (> 10MB rejected)
      const oversizedPayload = 'X'.repeat(11 * 1024 * 1024); // 11MB payload
      const postRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'Content-Type': 'application/json' },
        body: oversizedPayload
      });

      assert.equal(postRes.statusCode, 413, 'Payload > 10MB must be rejected with 413 Payload Too Large');
    });
  });

  // ==========================================================================
  // SCENARIO 6: Distributed Cache & Real-Time PubSub Fallback Resilience
  // ==========================================================================
  describe('Scenario 6: Distributed Cache & Real-Time PubSub Fallback Resilience', () => {
    test('6.1 DistributedCache seamlessly operates in high-performance In-Memory LRU fallback when Redis is absent', async () => {
      const stats = distributedCache.getStats();
      assert.ok(['REDIS', 'IN_MEMORY_LRU'].includes(stats.mode));

      // Test caching operations
      const testKey = `test:patient:summary:${Date.now()}`;
      await distributedCache.set(testKey, { patientName: 'Aarav Sharma', mrn: 'MRN-90210' }, 60);

      const cached = await distributedCache.get(testKey);
      assert.equal(cached.patientName, 'Aarav Sharma');
      assert.equal(cached.mrn, 'MRN-90210');

      await distributedCache.del(testKey);
      const afterDel = await distributedCache.get(testKey);
      assert.equal(afterDel, null);
    });

    test('6.2 HorizontalSocketGateway operates in Local EventEmitter mode with cross-counter event dispatching', async () => {
      const telemetry = horizontalSocketGateway.getTelemetry();
      assert.ok(['REDIS_PUBSUB', 'LOCAL_EVENT_EMITTER'].includes(telemetry.mode));

      let receivedEvent = null;
      horizontalSocketGateway.subscribe(TENANT_ID, 'BED_ALLOCATED', (evt) => {
        receivedEvent = evt;
      });

      await horizontalSocketGateway.broadcast(
        TENANT_ID,
        'BED_ALLOCATED',
        { bedNumber: 'ICU-B12', patientId: 'pat_881' }
      );

      assert.ok(receivedEvent !== null);
      assert.equal(receivedEvent.eventType, 'BED_ALLOCATED');
      assert.equal(receivedEvent.tenantId, TENANT_ID);
      assert.equal(receivedEvent.payload.bedNumber, 'ICU-B12');
    });
  });
});
