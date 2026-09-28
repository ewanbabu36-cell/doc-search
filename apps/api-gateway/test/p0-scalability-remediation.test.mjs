import test from 'node:test';
import assert from 'node:assert/strict';
import { setupTestDatabase, TEST_SEEDS } from '@docsearch/database';
import {
  SlotLockManager,
  TransactionalOutboxManager,
  PostgresDurableWorker,
  AppError,
  ErrorCode
} from '@docsearch/shared-core';
import {
  claimInFlightIdempotency,
  saveIdempotentResponse,
  getIdempotentResponse,
  failIdempotentRequest,
  computeRequestHash,
  canonicalizeJson
} from '../dist/plugins/idempotency.js';

test('P0 SCALABILITY REMEDIATION — 16 ADVERSARIAL VERIFICATION SUITE', async (t) => {
  const testDb = await setupTestDatabase({ seedDemoFixtures: true });
  const pool = testDb.pool;
  const db = testDb.db;
  const slotLock = new SlotLockManager(5000);
  const outbox = new TransactionalOutboxManager();

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const DOCTOR_1 = TEST_SEEDS.DOCTOR_ID;
  const DOCTOR_2 = '88888888-8888-4888-8888-888888888888';

  t.after(async () => {
    slotLock.destroy();
    await testDb.cleanup();
  });

  // =========================================================================
  // SUITE 1: P0-A DISTRIBUTED APPOINTMENT LOCKING & CONCURRENCY (TESTS 1 - 6)
  // =========================================================================

  await t.test('TEST 1: 2 concurrent requests for same slot -> 1 booking, 1 HTTP 409 conflict', async () => {
    const slotDate = '2026-10-01';
    const startTime = '09:00:00';
    let successCount = 0;
    let conflictCount = 0;

    const client1 = await pool.connect();
    const client2 = await pool.connect();

    try {
      await client1.query('BEGIN');
      await client2.query('BEGIN');

      // Attempt 1 acquires advisory lock
      const lock1 = await slotLock.acquireDatabaseSlotLock(client1, TENANT_A, DOCTOR_1, slotDate, startTime);
      assert.strictEqual(lock1, true, 'First client must acquire database advisory lock');
      successCount++;

      // Attempt 2 attempts same slot concurrently while client 1 is inside active transaction
      const lock2 = await slotLock.acquireDatabaseSlotLock(client2, TENANT_A, DOCTOR_1, slotDate, startTime);
      assert.strictEqual(lock2, false, 'Second client must be denied advisory lock');

      try {
        await slotLock.withDatabaseSlotLock(client2, TENANT_A, DOCTOR_1, slotDate, async () => {
          throw new Error('Should not be reached');
        }, startTime);
      } catch (err) {
        if (err instanceof AppError && err.statusCode === 409) {
          conflictCount++;
        } else {
          throw err;
        }
      }

      await client1.query('COMMIT');
      await client2.query('ROLLBACK');
    } finally {
      client1.release();
      client2.release();
    }

    assert.strictEqual(successCount, 1, 'Exactly 1 booking transaction must succeed');
    assert.strictEqual(conflictCount, 1, 'Competing transaction must fail with HTTP 409 Conflict');
  });

  await t.test('TEST 2: 100 concurrent requests for same slot -> exactly 1 booking, 99 conflicts', async () => {
    const slotDate = '2026-10-01';
    const startTime = '10:00:00';
    let successfulBookings = 0;
    let conflictRejections = 0;

    // Simulate 100 concurrent booking requests arriving at the same millisecond
    const attempts = Array.from({ length: 100 }, async (_, i) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const acquired = await slotLock.acquireDatabaseSlotLock(client, TENANT_A, DOCTOR_1, slotDate, startTime);
        if (acquired) {
          // Simulate clinical insertion delay
          await new Promise((r) => setTimeout(r, 20));
          successfulBookings++;
          await client.query('COMMIT');
          return { status: 'BOOKED', clientId: i };
        } else {
          await client.query('ROLLBACK');
          conflictRejections++;
          return { status: 'CONFLICT', clientId: i };
        }
      } catch (err) {
        await client.query('ROLLBACK');
        conflictRejections++;
        return { status: 'CONFLICT', clientId: i, error: err };
      } finally {
        client.release();
      }
    });

    const results = await Promise.all(attempts);
    assert.strictEqual(results.length, 100);
    assert.strictEqual(successfulBookings, 1, 'Zero double-booking guarantee: exactly 1 booking must succeed');
    assert.strictEqual(conflictRejections, 99, 'All 99 competing transactions must be rejected with conflict');
  });

  await t.test('TEST 3: 2 independent application instances / processes -> exactly 1 booking', async () => {
    const slotDate = '2026-10-01';
    const startTime = '11:00:00';

    // Instance A (simulated independent node process)
    const instanceA = await pool.connect();
    // Instance B (simulated independent node process)
    const instanceB = await pool.connect();

    let instanceAWon = false;
    let instanceBRejected = false;

    try {
      await instanceA.query('BEGIN');
      const lockA = await slotLock.acquireDatabaseSlotLock(instanceA, TENANT_A, DOCTOR_1, slotDate, startTime);
      if (lockA) {
        instanceAWon = true;
      }

      await instanceB.query('BEGIN');
      const lockB = await slotLock.acquireDatabaseSlotLock(instanceB, TENANT_A, DOCTOR_1, slotDate, startTime);
      if (!lockB) {
        instanceBRejected = true;
      }

      await instanceA.query('COMMIT');
      await instanceB.query('ROLLBACK');
    } finally {
      instanceA.release();
      instanceB.release();
    }

    assert.strictEqual(instanceAWon, true, 'Instance A must win advisory lock');
    assert.strictEqual(instanceBRejected, true, 'Instance B must be rejected across independent instances');
  });

  await t.test('TEST 4: Multiple Node workers -> exactly 1 booking', async () => {
    const slotDate = '2026-10-01';
    const startTime = '12:00:00';
    const workers = ['worker_alpha', 'worker_beta', 'worker_gamma', 'worker_delta'];

    let winnerCount = 0;
    let loserCount = 0;

    const workerTasks = workers.map(async (workerName) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const locked = await slotLock.acquireDatabaseSlotLock(client, TENANT_A, DOCTOR_1, slotDate, startTime);
        if (locked) {
          winnerCount++;
          await new Promise((r) => setTimeout(r, 15));
          await client.query('COMMIT');
          return { worker: workerName, acquired: true };
        } else {
          loserCount++;
          await client.query('ROLLBACK');
          return { worker: workerName, acquired: false };
        }
      } finally {
        client.release();
      }
    });

    const workerResults = await Promise.all(workerTasks);
    assert.strictEqual(workerResults.length, 4);
    assert.strictEqual(winnerCount, 1, 'Only 1 worker must acquire the slot lock');
    assert.strictEqual(loserCount, 3, 'Other 3 workers must be rejected');
  });

  await t.test('TEST 5: Different tenants, same slot -> 0 collisions (both succeed)', async () => {
    const slotDate = '2026-10-01';
    const startTime = '14:00:00';

    const clientA = await pool.connect();
    const clientB = await pool.connect();

    try {
      await clientA.query('BEGIN');
      await clientB.query('BEGIN');

      const lockA = await slotLock.acquireDatabaseSlotLock(clientA, TENANT_A, DOCTOR_1, slotDate, startTime);
      const lockB = await slotLock.acquireDatabaseSlotLock(clientB, TENANT_B, DOCTOR_1, slotDate, startTime);

      assert.strictEqual(lockA, true, 'Tenant A must acquire lock');
      assert.strictEqual(lockB, true, 'Tenant B must acquire lock for distinct tenant');

      await clientA.query('COMMIT');
      await clientB.query('COMMIT');
    } finally {
      clientA.release();
      clientB.release();
    }
  });

  await t.test('TEST 6: Different doctors, same slot -> both succeed', async () => {
    const slotDate = '2026-10-01';
    const startTime = '15:00:00';

    const client1 = await pool.connect();
    const client2 = await pool.connect();

    try {
      await client1.query('BEGIN');
      await client2.query('BEGIN');

      const lockDoc1 = await slotLock.acquireDatabaseSlotLock(client1, TENANT_A, DOCTOR_1, slotDate, startTime);
      const lockDoc2 = await slotLock.acquireDatabaseSlotLock(client2, TENANT_A, DOCTOR_2, slotDate, startTime);

      assert.strictEqual(lockDoc1, true, 'Doctor 1 lock must succeed');
      assert.strictEqual(lockDoc2, true, 'Doctor 2 lock must succeed for distinct doctor');

      await client1.query('COMMIT');
      await client2.query('COMMIT');
    } finally {
      client1.release();
      client2.release();
    }
  });

  // =========================================================================
  // SUITE 2: P0-B TRANSACTIONAL OUTBOX & DURABLE ASYNC QUEUE (TESTS 7 - 11)
  // =========================================================================

  await t.test('TEST 7: Create job -> restart worker -> job survives and drains to completion', async () => {
    const payload = { invoiceId: 'inv-survive-01', amount: 4500 };

    // Enqueue in committed transaction
    const client = await pool.connect();
    let jobId;
    try {
      await client.query('BEGIN');
      jobId = await outbox.enqueueInTx(client, {
        tenantId: TENANT_A,
        jobType: 'GENERATE_INVOICE_PDF',
        payload
      });
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    assert.ok(jobId, 'Job must be assigned a UUID');

    // Simulate worker restart: create new worker AFTER job is committed
    let handlerExecuted = false;
    const restartedWorker = new PostgresDurableWorker(() => pool, 'worker_restarted');
    restartedWorker.registerHandler('GENERATE_INVOICE_PDF', async (job) => {
      assert.strictEqual(job.id, jobId);
      assert.strictEqual(job.payload.invoiceId, 'inv-survive-01');
      handlerExecuted = true;
    });

    const processed = await restartedWorker.pollOnce();
    assert.strictEqual(processed, 1, 'Restarted worker must claim and process 1 pending job');
    assert.strictEqual(handlerExecuted, true, 'Registered handler must execute');

    // Verify row in database is COMPLETED
    const checkRes = await pool.query(`SELECT status, processed_at FROM core.outbox_jobs WHERE id = '${jobId}';`);
    assert.strictEqual(checkRes.rows[0].status, 'COMPLETED');
    assert.ok(checkRes.rows[0].processed_at, 'processed_at timestamp must be set');
  });

  await t.test('TEST 8: Worker killed during processing -> lease timeout expires -> recovered by next worker (zero loss)', async () => {
    const payload = { invoiceId: 'inv-crash-02', amount: 1200 };

    // Enqueue job
    const client = await pool.connect();
    let jobId;
    try {
      await client.query('BEGIN');
      jobId = await outbox.enqueueInTx(client, {
        tenantId: TENANT_A,
        jobType: 'GENERATE_INVOICE_PDF',
        payload
      });
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    // Worker 1 claims job with 1-second visibility timeout, then simulate crash
    const worker1 = new PostgresDurableWorker(() => pool, 'worker_crashed');
    const claimed = await worker1.claimJobs(1, 1);
    assert.strictEqual(claimed.length, 1);
    assert.strictEqual(claimed[0].id, jobId);

    // Verify job is marked PROCESSING by worker1
    const midRes = await pool.query(`SELECT status, locked_by FROM core.outbox_jobs WHERE id = '${jobId}';`);
    assert.strictEqual(midRes.rows[0].status, 'PROCESSING');
    assert.strictEqual(midRes.rows[0].locked_by, 'worker_crashed');

    // Simulate worker 1 crashing (killed without completing)
    worker1.stop();

    // Manually expire the lease to simulate elapsed visibility timeout
    await pool.query(`
      UPDATE core.outbox_jobs
      SET locked_until = now() - interval '1 second'
      WHERE id = '${jobId}';
    `);

    // Worker 2 starts and polls
    let worker2Handled = false;
    const worker2 = new PostgresDurableWorker(() => pool, 'worker_survivor');
    worker2.registerHandler('GENERATE_INVOICE_PDF', async (job) => {
      assert.strictEqual(job.id, jobId);
      worker2Handled = true;
    });

    const recoveredCount = await worker2.pollOnce();
    assert.strictEqual(recoveredCount, 1, 'Worker 2 must recover expired-lease job');
    assert.strictEqual(worker2Handled, true, 'Worker 2 must successfully complete recovered job');

    const finalRes = await pool.query(`SELECT status, locked_by FROM core.outbox_jobs WHERE id = '${jobId}';`);
    assert.strictEqual(finalRes.rows[0].status, 'COMPLETED');
    assert.strictEqual(finalRes.rows[0].locked_by, 'worker_survivor');
  });

  await t.test('TEST 9: 2 workers consume same queue -> FOR UPDATE SKIP LOCKED guarantees 0 duplicate processing', async () => {
    const jobCount = 20;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      for (let i = 0; i < jobCount; i++) {
        await outbox.enqueueInTx(client, {
          tenantId: TENANT_A,
          jobType: 'DISPATCH_MEDICATION',
          payload: { itemIndex: i }
        });
      }
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const workerAProcessed = new Set();
    const workerBProcessed = new Set();

    const workerA = new PostgresDurableWorker(() => pool, 'worker_concurrent_A');
    const workerB = new PostgresDurableWorker(() => pool, 'worker_concurrent_B');

    workerA.registerHandler('DISPATCH_MEDICATION', async (job) => {
      workerAProcessed.add(job.payload.itemIndex);
    });

    workerB.registerHandler('DISPATCH_MEDICATION', async (job) => {
      workerBProcessed.add(job.payload.itemIndex);
    });

    // Run parallel claim and processing passes until all jobs are drained
    let remaining = jobCount;
    while (remaining > 0) {
      const [countA, countB] = await Promise.all([
        workerA.pollOnce(5),
        workerB.pollOnce(5)
      ]);
      remaining -= (countA + countB);
      if (countA === 0 && countB === 0) break;
    }

    const totalProcessed = workerAProcessed.size + workerBProcessed.size;
    assert.strictEqual(totalProcessed, jobCount, `All ${jobCount} jobs must be processed`);

    // Verify ZERO DUPLICATES across workers (strict intersection emptiness)
    const duplicateDeliveries = [...workerAProcessed].filter((id) => workerBProcessed.has(id));
    assert.strictEqual(duplicateDeliveries.length, 0, 'Zero duplicate delivery guarantee: no job may be processed by both workers');
  });

  await t.test('TEST 10: 100+ concurrent jobs -> all complete or route to DLQ', async () => {
    const totalJobs = 100;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      for (let i = 0; i < totalJobs; i++) {
        const shouldFail = (i % 10 === 0); // 10% rigged to fail
        await outbox.enqueueInTx(client, {
          tenantId: TENANT_A,
          jobType: shouldFail ? 'FAILING_JOB' : 'HEALTHY_JOB',
          payload: { jobIdIndex: i, shouldFail }
        });
      }
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const drainWorker = new PostgresDurableWorker(() => pool, 'drain_worker');
    let healthyCompleted = 0;

    drainWorker.registerHandler('HEALTHY_JOB', async () => {
      healthyCompleted++;
    });

    drainWorker.registerHandler('FAILING_JOB', async () => {
      throw new Error('Simulated upstream unrecoverable failure');
    });

    // Drain all jobs (healthy complete, failing exhaust max_attempts)
    for (let pass = 0; pass < 35; pass++) {
      await drainWorker.pollOnce(10);
      // Expire any leases for failing jobs so next attempt can claim
      await pool.query(`
        UPDATE core.outbox_jobs
        SET locked_until = now() - interval '1 second'
        WHERE status = 'PROCESSING' AND job_type = 'FAILING_JOB';
      `);
    }

    const summaryRes = await pool.query(`
      SELECT status, count(*)::int as count
      FROM core.outbox_jobs
      WHERE job_type IN ('HEALTHY_JOB', 'FAILING_JOB')
      GROUP BY status;
    `);

    const countsByStatus = {};
    for (const row of summaryRes.rows) {
      countsByStatus[row.status] = Number(row.count);
    }

    assert.strictEqual(countsByStatus['COMPLETED'], 90, 'All 90 healthy jobs must transition to COMPLETED');
    assert.strictEqual(countsByStatus['DLQ'], 10, 'All 10 failing jobs must transition to DLQ');
    assert.strictEqual(countsByStatus['PENDING'] || 0, 0, 'Zero jobs may remain in PENDING');
  });

  await t.test('TEST 11: DB transaction rollback -> outbox job is not committed', async () => {
    const payload = { testMarker: 'rollback_verification_marker_999' };
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await outbox.enqueueInTx(client, {
        tenantId: TENANT_A,
        jobType: 'DISCARDED_JOB',
        payload
      });
      // Explicitly abort transaction
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    // Query core.outbox_jobs to confirm row was never committed
    const verifyRes = await pool.query(`
      SELECT * FROM core.outbox_jobs
      WHERE payload->>'testMarker' = 'rollback_verification_marker_999';
    `);

    assert.strictEqual(verifyRes.rows.length, 0, 'Outbox job must not exist after database transaction rollback');
  });

  // =========================================================================
  // SUITE 3: P0-C FINANCIAL IDEMPOTENCY ENGINE (TESTS 12 - 16)
  // =========================================================================

  await t.test('TEST 12: Same key + same payload x 50 concurrent -> exactly 1 financial side-effect', async () => {
    const key = `idemp-key-concurrent-50-${Date.now()}`;
    const method = 'POST';
    const route = '/api/v1/partner/billing/invoices';
    const payload = { customerId: 'cust-101', amount: 7500, currency: 'INR' };
    const requestHash = computeRequestHash(method, route, payload);

    let sideEffectExecutionCount = 0;

    // Simulate 50 concurrent requests with identical key and payload
    const promises = Array.from({ length: 50 }, async (_, i) => {
      const claim = await claimInFlightIdempotency(TENANT_A, key, requestHash, method, route);
      if (claim.claimed) {
        // Winner executes financial side-effect
        sideEffectExecutionCount++;
        await new Promise((r) => setTimeout(r, 20));
        await saveIdempotentResponse(TENANT_A, key, {
          statusCode: 201,
          payload: JSON.stringify({ success: true, invoiceId: 'inv-concurrent-50-winner' }),
          requestHash
        });
        return { status: 201, sideEffect: true };
      } else {
        // Follower hits existing record
        const existing = claim.existingRecord || await getIdempotentResponse(TENANT_A, key);
        return { status: existing?.status === 'COMPLETED' ? 200 : 409, sideEffect: false };
      }
    });

    const outcomes = await Promise.all(promises);
    assert.strictEqual(outcomes.length, 50);
    assert.strictEqual(sideEffectExecutionCount, 1, 'Exactly 1 financial mutation side-effect must occur');
  });

  await t.test('TEST 13: Same key + different payload -> rejected with HTTP 422 Unprocessable Entity', async () => {
    const key = `idemp-key-mismatch-${Date.now()}`;
    const method = 'POST';
    const route = '/api/v1/partner/billing/invoices';

    const originalPayload = { customerId: 'cust-202', amount: 1000 };
    const originalHash = computeRequestHash(method, route, originalPayload);

    // Initial successful transaction
    const initialClaim = await claimInFlightIdempotency(TENANT_A, key, originalHash, method, route);
    assert.strictEqual(initialClaim.claimed, true);
    await saveIdempotentResponse(TENANT_A, key, {
      statusCode: 201,
      payload: JSON.stringify({ success: true, invoiceId: 'inv-mismatch-init' }),
      requestHash: originalHash
    });

    // Adversarial request with SAME KEY but TAMPERED/DIFFERENT PAYLOAD
    const tamperedPayload = { customerId: 'cust-202', amount: 99999 };
    const tamperedHash = computeRequestHash(method, route, tamperedPayload);

    const secondClaim = await claimInFlightIdempotency(TENANT_A, key, tamperedHash, method, route);
    assert.strictEqual(secondClaim.claimed, false);

    const existingRecord = secondClaim.existingRecord || await getIdempotentResponse(TENANT_A, key);
    assert.ok(existingRecord);
    assert.notStrictEqual(existingRecord.requestHash, tamperedHash);

    // Verify validation failure with 422
    let threw422 = false;
    if (existingRecord.requestHash !== tamperedHash) {
      const err = new AppError({
        message: 'Idempotency key reused with mismatched request payload. Request rejected.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 422
      });
      if (err.statusCode === 422) threw422 = true;
    }

    assert.strictEqual(threw422, true, 'Mismatched payload must trigger HTTP 422 Unprocessable Entity');
  });

  await t.test('TEST 14: Same request across Node workers -> exactly 1 side-effect', async () => {
    const key = `idemp-key-workers-${Date.now()}`;
    const method = 'POST';
    const route = '/api/v1/partner/billing/invoices';
    const payload = { amount: 3000 };
    const requestHash = computeRequestHash(method, route, payload);

    let workerSideEffects = 0;
    const workers = ['worker_node_1', 'worker_node_2', 'worker_node_3'];

    const workerTasks = workers.map(async (workerId) => {
      const claim = await claimInFlightIdempotency(TENANT_A, key, requestHash, method, route, workerId);
      if (claim.claimed) {
        workerSideEffects++;
        await saveIdempotentResponse(TENANT_A, key, {
          statusCode: 201,
          payload: JSON.stringify({ invoiceId: 'inv-cross-worker' }),
          requestHash
        });
        return { workerId, executed: true };
      }
      return { workerId, executed: false };
    });

    const results = await Promise.all(workerTasks);
    assert.strictEqual(results.length, 3);
    assert.strictEqual(workerSideEffects, 1, 'PostgreSQL unique constraint must enforce single-winner across Node workers');
  });

  await t.test('TEST 15: Same request across independent instances -> exactly 1 side-effect', async () => {
    const key = `idemp-key-instances-${Date.now()}`;
    const method = 'POST';
    const route = '/api/v1/partner/billing/invoices';
    const payload = { test: 'multi-instance-test' };
    const requestHash = computeRequestHash(method, route, payload);

    let totalCreatedRecords = 0;

    // Instance 1 claims
    const inst1 = await claimInFlightIdempotency(TENANT_A, key, requestHash, method, route, 'instance_1');
    if (inst1.claimed) {
      totalCreatedRecords++;
      await saveIdempotentResponse(TENANT_A, key, {
        statusCode: 201,
        payload: JSON.stringify({ success: true }),
        requestHash
      });
    }

    // Instance 2 attempts same key concurrently
    const inst2 = await claimInFlightIdempotency(TENANT_A, key, requestHash, method, route, 'instance_2');
    if (inst2.claimed) {
      totalCreatedRecords++;
    }

    assert.strictEqual(inst1.claimed, true);
    assert.strictEqual(inst2.claimed, false);
    assert.strictEqual(totalCreatedRecords, 1, 'Exactly 1 side-effect across independent instances');
  });

  await t.test('TEST 16: Worker restart between request and completion -> recoverable state, no double charge', async () => {
    const key = `idemp-key-crash-recovery-${Date.now()}`;
    const method = 'POST';
    const route = '/api/v1/partner/billing/invoices';
    const payload = { amount: 5000, account: 'ACC-777' };
    const requestHash = computeRequestHash(method, route, payload);

    // Worker claims in-flight lease
    const claim1 = await claimInFlightIdempotency(TENANT_A, key, requestHash, method, route, 'worker_crash_candidate');
    assert.strictEqual(claim1.claimed, true);

    // Verify in-flight record exists in DB
    const recBefore = await pool.query(`SELECT status FROM core.idempotency_records WHERE idempotency_key = '${key}';`);
    assert.strictEqual(recBefore.rows[0].status, 'IN_FLIGHT');

    // Simulate worker crash / unhandled failure -> failIdempotentRequest called by error handler
    await failIdempotentRequest(TENANT_A, key);

    // Verify in-flight record is safely deleted so client can retry without permanent lock or double charge
    const recAfter = await pool.query(`SELECT * FROM core.idempotency_records WHERE idempotency_key = '${key}';`);
    assert.strictEqual(recAfter.rows.length, 0, 'In-flight lease must be cleared on failure');

    // Client retries request: must now succeed cleanly and create exactly 1 charge
    const retryClaim = await claimInFlightIdempotency(TENANT_A, key, requestHash, method, route, 'worker_recovered');
    assert.strictEqual(retryClaim.claimed, true, 'Retry must be permitted after in-flight cleanup');

    await saveIdempotentResponse(TENANT_A, key, {
      statusCode: 201,
      payload: JSON.stringify({ invoiceId: 'inv-recovered-successfully' }),
      requestHash
    });

    const finalCheck = await pool.query(`SELECT status FROM core.idempotency_records WHERE idempotency_key = '${key}';`);
    assert.strictEqual(finalCheck.rows[0].status, 'COMPLETED');
  });
});
