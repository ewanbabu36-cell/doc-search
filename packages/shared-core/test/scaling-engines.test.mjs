import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DistributedCache,
  SlotLockManager,
  HighThroughputAsyncQueue,
  AppError,
  ErrorCode
} from '../dist/server.js';

test('DistributedCache: get, set, getOrSet, and prefix/tag invalidation', async () => {
  const cache = new DistributedCache(100, 1000);
  cache.clear();

  // 1. Basic set and get
  await cache.set('doctor:DOC-1:profile', { name: 'Dr. Sharma', opdFee: 500 }, { ttlSeconds: 10, tags: ['doctor:DOC-1'] });
  const hit = await cache.get('doctor:DOC-1:profile');
  assert.ok(hit);
  assert.equal(hit.name, 'Dr. Sharma');

  // 2. getOrSet pattern
  let generatorCalled = 0;
  const res1 = await cache.getOrSet('doctor:DOC-1:slots', async () => {
    generatorCalled++;
    return ['09:00', '09:30', '10:00'];
  }, { ttlSeconds: 10, tags: ['doctor:DOC-1'] });
  assert.equal(generatorCalled, 1);
  assert.equal(res1.length, 3);

  // Second call must hit cache, not generator
  const res2 = await cache.getOrSet('doctor:DOC-1:slots', async () => {
    generatorCalled++;
    return [];
  });
  assert.equal(generatorCalled, 1);
  assert.equal(res2.length, 3);

  // 3. Tag invalidation
  const invalidated = await cache.invalidateTag('doctor:DOC-1');
  assert.equal(invalidated, 2);

  const afterInvalidate = await cache.get('doctor:DOC-1:profile');
  assert.equal(afterInvalidate, null);

  const metrics = cache.getMetrics();
  assert.ok(metrics.hits >= 2);
  assert.ok(metrics.misses >= 1);

  cache.destroy();
});

test('SlotLockManager: 50 concurrent requests competing for same slot (Zero Double-Booking)', async () => {
  const slotLock = new SlotLockManager(5000);
  const tenantId = 'tenant-hosp-101';
  const doctorId = 'doc-sharma-99';
  const slotTime = '2026-09-15T09:30:00.000Z';

  let successCount = 0;
  let conflictCount = 0;

  // 50 parallel booking transactions arriving at the exact same millisecond
  const attempts = Array.from({ length: 50 }, async (_, idx) => {
    try {
      await slotLock.withSlotLock(
        tenantId,
        doctorId,
        slotTime,
        async (lockInfo) => {
          assert.ok(lockInfo.acquired);
          // Simulate DB insertion delay (50ms)
          await new Promise((r) => setTimeout(r, 50));
          successCount++;
          return { appointmentId: `apt_${idx}`, status: 'CONFIRMED' };
        },
        60,
        `patient_req_${idx}`
      );
    } catch (err) {
      if (err instanceof AppError && err.code === ErrorCode.CONFLICT) {
        conflictCount++;
      } else {
        throw err;
      }
    }
  });

  await Promise.all(attempts);

  // Strict invariant: Exactly 1 succeeds, 49 rejected with CONFLICT
  assert.equal(successCount, 1, 'Only 1 transaction must acquire the slot lock');
  assert.equal(conflictCount, 49, 'All competing transactions must be rejected with 409 Conflict');

  slotLock.destroy();
});

test('HighThroughputAsyncQueue: concurrent worker dispatch and metrics', async () => {
  const queue = new HighThroughputAsyncQueue(5);
  let processedJobs = 0;

  queue.registerHandler('GENERATE_INVOICE_PDF', async (job) => {
    await new Promise((r) => setTimeout(r, 10));
    processedJobs++;
  });

  // Enqueue 25 asynchronous jobs
  const jobIds = [];
  for (let i = 0; i < 25; i++) {
    const id = await queue.enqueue('GENERATE_INVOICE_PDF', { invoiceId: `inv_${i}`, amount: 1500 });
    jobIds.push(id);
  }

  assert.equal(jobIds.length, 25);
  await queue.drain(5000);

  const metrics = queue.getMetrics();
  assert.equal(metrics.enqueuedTotal, 25);
  assert.equal(metrics.completedTotal, 25);
  assert.equal(metrics.failedTotal, 0);
  assert.equal(processedJobs, 25);
});
