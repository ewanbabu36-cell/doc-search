import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setTestTransactionRunner } from '@docsearch/database';

/**
 * High-Concurrency Integration Test: Pharmacy FEFO & Stock Integrity
 * 
 * Verifies:
 * 1. Test medication and batch seeded with initial_quantity = 10 and current_quantity = 10.
 * 2. 15 concurrent dispensing API calls (quantity = 1 each) fired via Promise.all.
 * 3. Exactly 10 requests succeed (HTTP 200/201) and exactly 5 fail with HTTP 409 (INSUFFICIENT_PHARMACY_STOCK).
 * 4. Database state validation:
 *    - pharmacy_batches.current_quantity equals 0 (never negative).
 *    - Total rows created in pharmacy_dispensing equals exactly 10.
 * 5. Transaction isolation and FOR UPDATE row locks validated under parallel load.
 */

describe('High-Concurrency Pharmacy FEFO & Stock Integrity Integration Suite', () => {
  let app: any;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_ID = '11111111-1111-4111-8111-111111111111';
  const BRANCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const PHARMACIST_ID = '77777777-7777-4777-8777-777777777777';

  function createPharmacistToken() {
    const claims = {
      sub: PHARMACIST_ID,
      email: 'chief.pharmacist@apex-hospital.org',
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      roles: ['PHARMACIST', 'HOSPITAL_ADMIN'],
      permissions: [
        'pharmacy:dispense:create',
        'pharmacy:dispense',
        'pharmacy:inventory:read',
        'pharmacy:medications:read',
        'clinical:consultations:read',
        'clinical:consultations:create',
        'clinical:consultations:update',
        'clinical:patients:read',
        'clinical:patients:create'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  // In-Memory Transactional Store with Real Mutex Locking for Row-Level Isolation (FOR UPDATE)
  interface BatchState {
    id: string;
    tenantId: string;
    partnerId: string;
    organizationId: string;
    branchId: string;
    medicationId: string;
    batchNumber: string;
    manufacturer: string;
    manufacturingDate: Date;
    expiryDate: Date;
    receivedQuantity: number;
    availableQuantity: number;
    reservedQuantity: number;
    initial_quantity: number;
    current_quantity: number;
    unitCost: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }

  const inMemoryBatches = new Map<string, BatchState>();
  const inMemoryDispensations: any[] = [];
  const inMemoryMovements: any[] = [];
  const rowLocks = new Map<string, Promise<void>>();
  let lockAcquisitionCount = 0;
  let lockReleaseCount = 0;

  // Mutex lock simulating PostgreSQL row-level FOR UPDATE lock
  async function acquireRowLock(rowId: string): Promise<() => void> {
    while (rowLocks.has(rowId)) {
      await rowLocks.get(rowId);
    }
    let release!: () => void;
    const p = new Promise<void>((resolve) => {
      release = resolve;
    });
    rowLocks.set(rowId, p);
    lockAcquisitionCount++;

    return () => {
      lockReleaseCount++;
      rowLocks.delete(rowId);
      release();
    };
  }

  const testMedicationId = 'med-' + crypto.randomUUID();
  const testBatchId = 'batch-' + crypto.randomUUID();
  const testPatientId = 'pat-' + crypto.randomUUID();

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'test';

    // REQUIREMENT 1: Seed a test medication and a batch with initial_quantity = 10 and current_quantity = 10
    const now = new Date();
    const seededBatch: BatchState = {
      id: testBatchId,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: BRANCH_ID,
      medicationId: testMedicationId,
      batchNumber: 'BATCH-CONCUR-001',
      manufacturer: 'DocSearch Pharma Labs',
      manufacturingDate: new Date('2026-01-01T00:00:00Z'),
      expiryDate: new Date('2027-01-01T00:00:00Z'),
      receivedQuantity: 10,
      availableQuantity: 10,
      reservedQuantity: 0,
      initial_quantity: 10,
      current_quantity: 10,
      unitCost: 25.0,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };
    inMemoryBatches.set(testBatchId, seededBatch);

    // Setup high-concurrency transactional runner enforcing true FOR UPDATE row lock semantics
    setTestTransactionRunner(async (context, cb) => {
      let activeRowLockRelease: (() => void) | null = null;

      const mockTx = {
        select: () => {
          let isForUpdate = false;

          const queryChain: any = {
            from: () => queryChain,
            where: () => queryChain,
            orderBy: () => queryChain,
            limit: () => queryChain,
            for: (lockMode: string) => {
              if (lockMode === 'update') isForUpdate = true;
              return queryChain;
            },
            then: async (resolve: any, reject: any) => {
              try {
                // If FOR UPDATE was specified, acquire exclusive row lock on the batch
                if (isForUpdate) {
                  activeRowLockRelease = await acquireRowLock(testBatchId);
                }
                const b = inMemoryBatches.get(testBatchId);
                const result = b ? [{ ...b }] : [];
                return resolve(result);
              } catch (e) {
                return reject ? reject(e) : Promise.reject(e);
              }
            }
          };
          return queryChain;
        },
        update: () => ({
          set: (updateData: any) => ({
            where: async () => {
              const b = inMemoryBatches.get(testBatchId);
              if (b) {
                if ('availableQuantity' in updateData) {
                  b.availableQuantity = updateData.availableQuantity;
                  b.current_quantity = updateData.availableQuantity;
                }
                if ('status' in updateData) {
                  b.status = updateData.status;
                }
                b.updatedAt = updateData.updatedAt || new Date();
              }
              return [b];
            }
          })
        }),
        insert: (_table: any) => ({
          values: (data: any) => {
            if (data.dispensingNumber) {
              inMemoryDispensations.push({ ...data, createdAt: new Date() });
            } else if (data.movementType) {
              inMemoryMovements.push({ ...data, occurredAt: new Date() });
            }
            const row = [{ id: data.id || crypto.randomUUID(), ...data }];
            return {
              returning: async () => row,
              then: (resolve: any, reject: any) => Promise.resolve(row).then(resolve, reject)
            };
          }
        }),
        execute: async () => ({ rows: [] })
      };

      try {
        const result = await cb(mockTx as any);
        return result;
      } finally {
        if (activeRowLockRelease) {
          activeRowLockRelease();
        }
      }
    });

    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    setTestTransactionRunner(null);
    if (app) await app.close();
  });

  it('REQUIREMENT 1: Seeded inventory state is valid (initial_quantity = 10, current_quantity = 10)', async () => {
    const seeded = inMemoryBatches.get(testBatchId);
    assert.ok(seeded, 'Batch must exist');
    assert.strictEqual(seeded.initial_quantity, 10, 'initial_quantity must equal 10');
    assert.strictEqual(seeded.current_quantity, 10, 'current_quantity must equal 10');
    assert.strictEqual(seeded.status, 'ACTIVE');
  });

  it('REQUIREMENTS 2 & 3: 15 concurrent dispensing calls -> exactly 10 succeed (200/201) and exactly 5 fail with HTTP 409 (INSUFFICIENT_PHARMACY_STOCK)', async () => {
    const token = createPharmacistToken();

    // REQUIREMENT 2: Fire 15 concurrent dispensing API calls (quantity = 1 each) simultaneously using Promise.all
    const concurrentRequests = Array.from({ length: 15 }, () => {
      return app.inject({
        method: 'POST',
        url: '/api/v1/partner/pharmacy/dispense',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json'
        },
        payload: {
          patientId: testPatientId,
          items: [
            {
              medicationId: testMedicationId,
              batchId: testBatchId,
              quantity: 1,
              unit: 'CAPSULE',
              dosageInstructions: 'Take 1 capsule post meals'
            }
          ]
        }
      });
    });

    const responses = await Promise.all(concurrentRequests);

    // REQUIREMENT 3: Assert that exactly 10 requests succeed (HTTP 200/201) and exactly 5 fail with HTTP 409
    const successfulResponses = responses.filter((res: any) => res.statusCode === 200 || res.statusCode === 201);
    const failedResponses = responses.filter((res: any) => res.statusCode === 409);
    const unexpectedResponses = responses.filter((res: any) => res.statusCode !== 200 && res.statusCode !== 201 && res.statusCode !== 409);

    assert.strictEqual(
      unexpectedResponses.length,
      0,
      `Found unexpected HTTP status codes: ${unexpectedResponses.map((r: any) => r.statusCode).join(', ')}`
    );

    assert.strictEqual(
      successfulResponses.length,
      10,
      `Expected exactly 10 successful dispensations (HTTP 200/201), got ${successfulResponses.length}`
    );

    assert.strictEqual(
      failedResponses.length,
      5,
      `Expected exactly 5 failed dispensations (HTTP 409), got ${failedResponses.length}`
    );

    // Verify all 5 rejected requests return standard INSUFFICIENT_PHARMACY_STOCK error payload
    for (const failedRes of failedResponses) {
      const body = JSON.parse(failedRes.body);
      assert.strictEqual(
        body.error?.code,
        'INSUFFICIENT_PHARMACY_STOCK',
        `Expected error.code to be 'INSUFFICIENT_PHARMACY_STOCK', got: ${JSON.stringify(body)}`
      );
      assert.ok(
        body.error?.message?.includes('Insufficient pharmacy stock'),
        `Expected descriptive message, got: ${body.error?.message}`
      );
    }
  });

  it('REQUIREMENT 4: Verify database state (current_quantity === 0, never negative; exactly 10 pharmacy_dispensing rows)', async () => {
    const finalBatch = inMemoryBatches.get(testBatchId);
    assert.ok(finalBatch, 'Batch must exist in database');

    // pharmacy_batches.current_quantity must equal 0 (never negative)
    assert.strictEqual(
      finalBatch.current_quantity,
      0,
      `Expected current_quantity to be 0, got ${finalBatch.current_quantity}`
    );
    assert.strictEqual(
      finalBatch.availableQuantity,
      0,
      `Expected availableQuantity to be 0, got ${finalBatch.availableQuantity}`
    );
    assert.ok(
      finalBatch.current_quantity >= 0,
      'Batch stock must NEVER be negative under any concurrent race conditions'
    );
    assert.strictEqual(
      finalBatch.status,
      'DEPLETED',
      'Batch status must transition to DEPLETED when stock reaches 0'
    );

    // Total rows created in pharmacy_dispensing must be exactly 10
    assert.strictEqual(
      inMemoryDispensations.length,
      10,
      `Expected exactly 10 rows in pharmacy_dispensing, got ${inMemoryDispensations.length}`
    );

    // Total stock movements recorded must also be 10 deductions
    assert.strictEqual(
      inMemoryMovements.length,
      10,
      `Expected exactly 10 stock movement ledger entries, got ${inMemoryMovements.length}`
    );
  });

  it('REQUIREMENT 5: Ensure transaction isolation and FOR UPDATE row locks were validated properly', async () => {
    // Under 15 concurrent calls, each transaction must acquire and release the row lock
    assert.strictEqual(
      lockAcquisitionCount,
      15,
      `Expected 15 row lock acquisitions, got ${lockAcquisitionCount}`
    );
    assert.strictEqual(
      lockReleaseCount,
      15,
      `Expected 15 row lock releases, got ${lockReleaseCount}`
    );
    assert.strictEqual(
      rowLocks.size,
      0,
      'All row locks must be released cleanly after all transactions finish (no dangling locks)'
    );
  });
});
