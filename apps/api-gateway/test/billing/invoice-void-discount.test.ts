import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setTestTransactionRunner } from '@docsearch/database';

describe('Strict Invoice Void & Discount Policy Enforcement Test Suite', () => {
  let app: any;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_ID = '11111111-1111-4111-8111-111111111111';
  const BRANCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const BILLING_OFFICER_ID = 'usr-billing-officer-01';
  const SUPERVISOR_ID = 'usr-supervisor-99';
  const UNAUTHORIZED_USER_ID = 'usr-junior-clerk-02';

  function createAuthToken(userId = BILLING_OFFICER_ID, roles = ['BILLING_OFFICER', 'HOSPITAL_ADMIN']) {
    return signJwt(
      {
        sub: userId,
        email: 'billing@docsearch.health',
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        roles,
        permissions: [
          'clinical:encounters:read',
          'clinical:encounters:create',
          'clinical:encounters:update',
          'billing:invoices:read',
          'billing:invoices:create',
          'billing:invoices:update'
        ],
        iss: ISSUER,
        aud: AUDIENCE
      },
      { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 }
    );
  }

  function createSupervisorOverrideToken(supervisorUserId = SUPERVISOR_ID, roles = ['SUPERVISOR', 'HOSPITAL_ADMIN']) {
    return signJwt(
      {
        sub: supervisorUserId,
        userId: supervisorUserId,
        role: roles[0],
        roles,
        override: true,
        purpose: 'INVOICE_VOID_OVERRIDE',
        tenantId: TENANT_ID,
        branchId: BRANCH_ID
      },
      { secret: MASTER_SECRET, expiresInSeconds: 900 }
    );
  }

  function createInvalidOverrideToken() {
    return signJwt(
      {
        sub: UNAUTHORIZED_USER_ID,
        userId: UNAUTHORIZED_USER_ID,
        role: 'STAFF_NURSE',
        roles: ['STAFF_NURSE'],
        override: false,
        tenantId: TENANT_ID
      },
      { secret: MASTER_SECRET, expiresInSeconds: 900 }
    );
  }

  // In-memory mock database state
  interface MockInvoice {
    id: string;
    tenantId: string;
    partnerId: string;
    organizationId: string;
    branchId: string;
    invoiceNumber: string;
    patientId: string;
    patientName: string;
    encounterId: string;
    totalAmount: number;
    patientPayableAmount: number;
    paidAmount: number;
    balanceDue: number;
    discountTotal?: number;
    status: string;
    metadata?: any;
    items: any[];
    createdAt: Date;
    updatedAt: Date;
  }

  const inMemoryInvoices = new Map<string, MockInvoice>();
  const inMemoryInvoiceItems = new Map<string, any[]>();
  const inMemoryDiscounts: any[] = [];
  const inMemoryDispensings = new Map<string, any>();
  const inMemoryDispensingItems = new Map<string, any[]>();
  const inMemoryBatches = new Map<string, any>();
  const inMemoryStockMovements: any[] = [];
  const inMemoryAuditEvents: any[] = [];

  const invoicePaidId = 'inv-paid-001';
  const invoiceSettledPharmId = 'inv-settled-pharm-002';
  const invoicePendingId = 'inv-pending-003';
  const invoiceDiscountPaidId = 'inv-disc-paid-004';
  const invoiceDiscountPendingId = 'inv-disc-pending-005';

  const encounterPharmId = 'enc-pharm-rx-100';

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'test';

    const now = new Date();

    // 1. Paid Invoice
    inMemoryInvoices.set(invoicePaidId, {
      id: invoicePaidId,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: BRANCH_ID,
      invoiceNumber: 'INV-HOSP-500001',
      patientId: 'pat-001',
      patientName: 'Ramesh Patel',
      encounterId: 'enc-001',
      totalAmount: 5000,
      patientPayableAmount: 5000,
      paidAmount: 5000,
      balanceDue: 0,
      status: 'PAID',
      items: [
        {
          id: 'it-1',
          invoiceId: invoicePaidId,
          serviceName: 'Consultation Fee',
          category: 'CONSULTATION',
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000
        }
      ],
      createdAt: now,
      updatedAt: now
    });
    inMemoryInvoiceItems.set(invoicePaidId, inMemoryInvoices.get(invoicePaidId)!.items);

    // 2. Discharge Settled Invoice Tied to Pharmacy Dispensing
    inMemoryInvoices.set(invoiceSettledPharmId, {
      id: invoiceSettledPharmId,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: BRANCH_ID,
      invoiceNumber: 'INV-HOSP-500002',
      patientId: 'pat-pharm-002',
      patientName: 'Ananya Sharma',
      encounterId: encounterPharmId,
      totalAmount: 12000,
      patientPayableAmount: 12000,
      paidAmount: 12000,
      balanceDue: 0,
      status: 'DISCHARGE_SETTLED',
      items: [
        {
          id: 'it-2',
          invoiceId: invoiceSettledPharmId,
          serviceName: 'Cefixime 200mg Dispensed',
          category: 'PHARMACY',
          quantity: 10,
          unitPrice: 1200,
          totalPrice: 12000
        }
      ],
      createdAt: now,
      updatedAt: now
    });
    inMemoryInvoiceItems.set(invoiceSettledPharmId, inMemoryInvoices.get(invoiceSettledPharmId)!.items);

    // Associated Pharmacy Dispensing for invoiceSettledPharmId
    const dispId = 'disp-test-001';
    inMemoryDispensings.set(dispId, {
      id: dispId,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: BRANCH_ID,
      dispensingNumber: 'DISP-2026-999',
      prescriptionId: encounterPharmId,
      patientId: 'pat-pharm-002',
      pharmacistId: 'usr-pharmacist-01',
      pharmacistName: 'Duty Pharmacist',
      dispensingStatus: 'DISPENSED',
      createdAt: now,
      updatedAt: now
    });

    const batchId = 'batch-cefixime-01';
    inMemoryBatches.set(batchId, {
      id: batchId,
      tenantId: TENANT_ID,
      batchNumber: 'BATCH-CFX-2026',
      medicationId: 'med-cfx-01',
      availableQuantity: 90,
      status: 'ACTIVE',
      metadata: {}
    });

    inMemoryDispensingItems.set(dispId, [
      {
        id: 'disp-item-01',
        dispensingId: dispId,
        batchId: batchId,
        medicationId: 'med-cfx-01',
        quantity: 10,
        unit: 'TABLET',
        dosageInstructions: '1 tablet BID'
      }
    ]);

    // 3. Pending Payment Invoice
    inMemoryInvoices.set(invoicePendingId, {
      id: invoicePendingId,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: BRANCH_ID,
      invoiceNumber: 'INV-HOSP-500003',
      patientId: 'pat-003',
      patientName: 'Sunita Rao',
      encounterId: 'enc-003',
      totalAmount: 3000,
      patientPayableAmount: 3000,
      paidAmount: 0,
      balanceDue: 3000,
      status: 'PENDING_PAYMENT',
      items: [
        {
          id: 'it-3',
          invoiceId: invoicePendingId,
          serviceName: 'General Checkup',
          category: 'CONSULTATION',
          quantity: 1,
          unitPrice: 3000,
          totalPrice: 3000
        }
      ],
      createdAt: now,
      updatedAt: now
    });
    inMemoryInvoiceItems.set(invoicePendingId, inMemoryInvoices.get(invoicePendingId)!.items);

    // 4. Paid Invoice for Discount Test
    inMemoryInvoices.set(invoiceDiscountPaidId, {
      id: invoiceDiscountPaidId,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: BRANCH_ID,
      invoiceNumber: 'INV-HOSP-500004',
      patientId: 'pat-004',
      patientName: 'Vikram Singh',
      encounterId: 'enc-004',
      totalAmount: 8000,
      patientPayableAmount: 8000,
      paidAmount: 8000,
      balanceDue: 0,
      status: 'PAID',
      items: [
        {
          id: 'it-4',
          invoiceId: invoiceDiscountPaidId,
          serviceName: 'Surgical Consult',
          category: 'CONSULTATION',
          quantity: 1,
          unitPrice: 8000,
          totalPrice: 8000
        }
      ],
      createdAt: now,
      updatedAt: now
    });
    inMemoryInvoiceItems.set(invoiceDiscountPaidId, inMemoryInvoices.get(invoiceDiscountPaidId)!.items);

    // 5. Pending Invoice for Discount Test
    inMemoryInvoices.set(invoiceDiscountPendingId, {
      id: invoiceDiscountPendingId,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: BRANCH_ID,
      invoiceNumber: 'INV-HOSP-500005',
      patientId: 'pat-005',
      patientName: 'Deepak Joshi',
      encounterId: 'enc-005',
      totalAmount: 10000,
      patientPayableAmount: 10000,
      paidAmount: 0,
      balanceDue: 10000,
      status: 'PENDING_PAYMENT',
      items: [
        {
          id: 'it-5',
          invoiceId: invoiceDiscountPendingId,
          serviceName: 'Endoscopy Procedure',
          category: 'SURGERY_OT',
          quantity: 1,
          unitPrice: 10000,
          totalPrice: 10000
        }
      ],
      createdAt: now,
      updatedAt: now
    });
    inMemoryInvoiceItems.set(invoiceDiscountPendingId, inMemoryInvoices.get(invoiceDiscountPendingId)!.items);

    function getQueryParams(whereClause: any): string[] {
      const params: string[] = [];
      if (!whereClause || !whereClause.queryChunks) return params;
      function walk(chunks: any[]) {
        for (const c of chunks) {
          if (c && c.queryChunks) walk(c.queryChunks);
          else if (c && typeof c === 'object' && 'value' in c && typeof c.value === 'string') {
            params.push(c.value);
          }
        }
      }
      walk(whereClause.queryChunks);
      return params;
    }

    // Set up in-memory transaction interceptor
    setTestTransactionRunner(async (_context, cb) => {
      const mockTx: any = {
        select: () => {
          let selectedTable: any = null;
          let currentWhere: any = null;

          const queryChain: any = {
            from: (tbl: any) => {
              selectedTable = tbl;
              return queryChain;
            },
            where: (whereClause: any) => {
              currentWhere = whereClause;
              return queryChain;
            },
            orderBy: () => queryChain,
            limit: () => queryChain,
            for: () => queryChain,
            then: async (resolve: any) => {
              const tableName =
                selectedTable?.[Symbol.for('drizzle:Name')] ||
                selectedTable?.[Symbol.for('drizzle:OriginalName')] ||
                selectedTable?.name ||
                '';
              const params = getQueryParams(currentWhere);

              if (tableName === 'billing_invoices') {
                if (params.length >= 2) {
                  const idOrNum = params[params.length - 1];
                  const matched = Array.from(inMemoryInvoices.values()).filter(
                    (inv) => inv.id === idOrNum || inv.invoiceNumber === idOrNum
                  );
                  return resolve(matched);
                }
                return resolve(Array.from(inMemoryInvoices.values()));
              }

              if (tableName === 'billing_invoice_items') {
                if (params.length >= 2) {
                  const invId = params[params.length - 1];
                  const items = inMemoryInvoiceItems.get(invId) || [];
                  return resolve(items);
                }
                return resolve(Array.from(inMemoryInvoiceItems.values()).flat());
              }

              if (tableName === 'pharmacy_dispensing') {
                if (params.length >= 2) {
                  const targetId = params[params.length - 1];
                  const matched = Array.from(inMemoryDispensings.values()).filter(
                    (d) => d.id === targetId || d.prescriptionId === targetId || d.patientId === targetId
                  );
                  return resolve(matched);
                }
                return resolve(Array.from(inMemoryDispensings.values()));
              }

              if (tableName === 'pharmacy_dispensing_items') {
                if (params.length >= 2) {
                  const dispId = params[params.length - 1];
                  const items = inMemoryDispensingItems.get(dispId) || [];
                  return resolve(items);
                }
                return resolve(Array.from(inMemoryDispensingItems.values()).flat());
              }

              if (tableName === 'pharmacy_batches') {
                if (params.length >= 2) {
                  const batchId = params[params.length - 1];
                  const batch = inMemoryBatches.get(batchId);
                  return resolve(batch ? [batch] : []);
                }
                return resolve(Array.from(inMemoryBatches.values()));
              }

              if (tableName === 'audit_events') {
                return resolve(inMemoryAuditEvents);
              }

              return resolve([]);
            }
          };
          return queryChain;
        },
        insert: (tbl: any) => ({
          values: (vals: any) => {
            const tableName =
              tbl?.[Symbol.for('drizzle:Name')] ||
              tbl?.[Symbol.for('drizzle:OriginalName')] ||
              tbl?.name ||
              '';

            if (tableName === 'billing_discounts') {
              inMemoryDiscounts.push(vals);
            } else if (tableName === 'pharmacy_stock_movements') {
              inMemoryStockMovements.push(vals);
            } else if (tableName === 'audit_events') {
              inMemoryAuditEvents.push(vals);
            }

            const returningObj = {
              returning: async () => [vals],
              then: async (resolve: any) => resolve([vals])
            };
            return returningObj;
          }
        }),
        update: (tbl: any) => ({
          set: (vals: any) => ({
            where: (whereClause: any) => ({
              then: async (resolve: any) => {
                const tableName =
                  tbl?.[Symbol.for('drizzle:Name')] ||
                  tbl?.[Symbol.for('drizzle:OriginalName')] ||
                  tbl?.name ||
                  '';
                const params = getQueryParams(whereClause);
                const targetId = params[params.length - 1];

                if (tableName === 'billing_invoices') {
                  const inv = inMemoryInvoices.get(targetId);
                  if (inv) {
                    Object.assign(inv, vals);
                  }
                } else if (tableName === 'pharmacy_dispensing') {
                  const disp = inMemoryDispensings.get(targetId);
                  if (disp) {
                    Object.assign(disp, vals);
                  }
                } else if (tableName === 'pharmacy_batches') {
                  const batch = inMemoryBatches.get(targetId);
                  if (batch) {
                    Object.assign(batch, vals);
                  }
                }

                return resolve([{ success: true }]);
              }
            })
          })
        })
      };

      return cb(mockTx);
    });

    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // REQUIREMENT 2 & 4: Mandatory non-empty void_reason and supervisor user ID via Zod schema
  it('REQUIREMENT 2 & 4: Rejects void request with missing or empty void_reason with HTTP 400', async () => {
    const token = createAuthToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoicePaidId}/void`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        void_reason: '   ', // whitespace only
        supervisor_user_id: SUPERVISOR_ID
      }
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    assert.match(body.error.message, /void_reason/i);
  });

  it('REQUIREMENT 2 & 4: Rejects void request with missing or empty supervisor_user_id with HTTP 400', async () => {
    const token = createAuthToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoicePaidId}/void`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        void_reason: 'Incorrect diagnostic billing code attached',
        supervisor_user_id: '   ' // whitespace only
      }
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    assert.match(body.error.message, /supervisor_user_id/i);
  });

  // REQUIREMENT 1: Block voiding of invoice in 'PAID' status without supervisor override token
  it('REQUIREMENT 1: Blocks voiding an invoice in PAID status when supervisor override token is missing (HTTP 403)', async () => {
    const token = createAuthToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoicePaidId}/void`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        void_reason: 'Patient disputed diagnostic billing charge after payment',
        supervisor_user_id: SUPERVISOR_ID
        // No supervisor_override_token provided
      }
    });

    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
    assert.match(body.error.message, /supervisor override token/i);
  });

  it('REQUIREMENT 1: Blocks voiding an invoice in PAID status when supervisor override token is invalid or lacks supervisor privileges (HTTP 403)', async () => {
    const token = createAuthToken();
    const invalidOverride = createInvalidOverrideToken();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoicePaidId}/void`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-supervisor-override-token': invalidOverride
      },
      payload: {
        void_reason: 'Charge cancellation requested',
        supervisor_user_id: SUPERVISOR_ID
      }
    });

    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
    assert.match(body.error.message, /supervisor/i);
  });

  it('REQUIREMENT 1: Blocks voiding when supervisor token subject does not match supervisor_user_id (HTTP 403)', async () => {
    const token = createAuthToken();
    const validOverride = createSupervisorOverrideToken(SUPERVISOR_ID);

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoicePaidId}/void`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        void_reason: 'Charge cancellation requested',
        supervisor_user_id: 'usr-different-supervisor-02', // mismatch
        supervisor_override_token: validOverride
      }
    });

    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
    assert.match(body.error.message, /does not match/i);
  });

  // REQUIREMENT 1, 2, 3: Successful void with supervisor override token
  it('REQUIREMENT 1 & 3: Allows voiding a PAID invoice when valid supervisor override token is supplied (HTTP 200) and marks status VOIDED', async () => {
    const token = createAuthToken();
    const overrideToken = createSupervisorOverrideToken(SUPERVISOR_ID);

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoicePaidId}/void`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        void_reason: 'Senior billing auditor approved complete void of incorrectly charged consultation',
        supervisor_user_id: SUPERVISOR_ID,
        supervisor_override_token: overrideToken
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.invoice.status, 'VOIDED');
    assert.strictEqual(body.data.invoice.balanceDue, 0);

    // Verify stored invoice
    const inv = inMemoryInvoices.get(invoicePaidId);
    assert.strictEqual(inv?.status, 'VOIDED');
    assert.strictEqual(inv?.metadata?.voidReason, 'Senior billing auditor approved complete void of incorrectly charged consultation');
    assert.strictEqual(inv?.metadata?.supervisorUserId, SUPERVISOR_ID);
  });

  // REQUIREMENT 3: SHA-256 Audit Chaining in core.audit_events
  it('REQUIREMENT 3: Inserts SHA-256 hash-chained audit record in core.audit_events on invoice void', async () => {
    const voidAudits = inMemoryAuditEvents.filter(
      (e) => e.eventType === 'INVOICE_VOIDED' && e.resourceId === invoicePaidId
    );

    assert.ok(voidAudits.length >= 1, 'Expected at least one INVOICE_VOIDED audit event');
    const auditRecord = voidAudits[0];

    assert.strictEqual(auditRecord.eventType, 'INVOICE_VOIDED');
    assert.strictEqual(auditRecord.resourceType, 'billing_invoice');
    assert.strictEqual(auditRecord.resourceId, invoicePaidId);
    assert.ok(auditRecord.integrityHash, 'Audit record must have an SHA-256 integrity hash');
    assert.strictEqual(typeof auditRecord.integrityHash, 'string');
    assert.strictEqual(auditRecord.integrityHash.length, 64, 'SHA-256 integrity hash must be 64 hex characters');
  });

  // REQUIREMENT 3: Pharmacy physical quarantine / audit rather than silent deletion
  it('REQUIREMENT 3: When invoice tied to pharmacy dispensing is voided, marks items for physical quarantine/audit with ZERO silent deletion', async () => {
    const token = createAuthToken();
    const overrideToken = createSupervisorOverrideToken(SUPERVISOR_ID);

    const initialBatchesCount = inMemoryBatches.size;
    const initialDispensingsCount = inMemoryDispensings.size;

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceSettledPharmId}/cancel`, // Test alias /cancel
      headers: {
        Authorization: `Bearer ${token}`,
        'x-supervisor-override-token': overrideToken
      },
      payload: {
        void_reason: 'Medication returned by patient unopened; physical quarantine and audit required',
        supervisor_user_id: SUPERVISOR_ID
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.invoice.status, 'VOIDED');
    assert.ok(body.data.quarantinedItemsCount >= 1, 'Expected quarantined items count >= 1');

    // 1. Verify NO silent deletion
    assert.strictEqual(inMemoryBatches.size, initialBatchesCount, 'No batch records should be deleted');
    assert.strictEqual(inMemoryDispensings.size, initialDispensingsCount, 'No dispensing records should be deleted');

    // 2. Verify pharmacy dispensing status transitioned to REVERSED
    const disp = inMemoryDispensings.get('disp-test-001');
    assert.strictEqual(disp.dispensingStatus, 'REVERSED');
    assert.match(disp.reversalReason, /physical quarantine\/audit/i);
    assert.strictEqual(disp.reversedBy, SUPERVISOR_ID);

    // 3. Verify pharmacy stock movement recorded with movementType 'QUARANTINE'
    const quarantineMovements = inMemoryStockMovements.filter(
      (m) => m.movementType === 'QUARANTINE' && m.actorId === SUPERVISOR_ID
    );
    assert.ok(quarantineMovements.length >= 1, 'Expected at least one QUARANTINE stock movement');
    const qMov = quarantineMovements[0];
    assert.strictEqual(qMov.actorRole, 'SUPERVISOR');
    assert.match(qMov.reason, /quarantined for audit/i);

    // 4. Verify batch metadata updated with physical quarantine status
    const batch = inMemoryBatches.get('batch-cefixime-01');
    assert.strictEqual(batch.blockedBy, SUPERVISOR_ID);
    assert.strictEqual(batch.metadata?.quarantineStatus, 'PHYSICAL_QUARANTINE_AUDIT');
  });

  // Voiding a PENDING_PAYMENT invoice does not require supervisor override
  it('Allows voiding an unpaid (PENDING_PAYMENT) invoice without supervisor override token', async () => {
    const token = createAuthToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoicePendingId}/void`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        void_reason: 'Draft invoice cancelled before patient payment',
        supervisor_user_id: SUPERVISOR_ID
        // No override token required for unpaid invoice
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.invoice.status, 'VOIDED');
  });

  // DISCOUNT POLICIES:
  it('REQUIREMENT 1 & DISCOUNT: Blocks applying discount to PAID invoice without supervisor override token (HTTP 403)', async () => {
    const token = createAuthToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceDiscountPaidId}/discounts`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        discount_type: 'PERCENTAGE',
        discount_value: 15,
        reason: 'Post-payment senior citizen discount request',
        approved_by: SUPERVISOR_ID
        // No supervisor_override_token provided
      }
    });

    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
    assert.match(body.error.message, /supervisor override token/i);
  });

  it('REQUIREMENT 1 & DISCOUNT: Allows applying discount to PAID invoice with valid supervisor override token (HTTP 200)', async () => {
    const token = createAuthToken();
    const overrideToken = createSupervisorOverrideToken(SUPERVISOR_ID);

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceDiscountPaidId}/discounts`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-supervisor-override-token': overrideToken
      },
      payload: {
        discount_type: 'FIXED_AMOUNT',
        discount_value: 1000,
        reason: 'Authorized goodwill concession by medical director',
        approved_by: SUPERVISOR_ID
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.discountAmount, 1000);
    assert.strictEqual(body.data.invoice.discountTotal, 1000);

    // Verify audit event for discount
    const discountAudits = inMemoryAuditEvents.filter(
      (e) => e.eventType === 'INVOICE_DISCOUNT_APPLIED' && e.resourceId === body.data.discountId
    );
    assert.ok(discountAudits.length >= 1, 'Expected INVOICE_DISCOUNT_APPLIED audit event');
    assert.ok(discountAudits[0].integrityHash, 'Discount audit event must have integrityHash');
  });

  it('DISCOUNT: Allows applying discount to PENDING_PAYMENT invoice and recalculates balance due', async () => {
    const token = createAuthToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceDiscountPendingId}/discounts`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        discount_type: 'PERCENTAGE',
        discount_value: 20, // 20% of 10,000 = 2,000
        reason: 'Hospital employee family concession',
        approved_by: 'usr-hospital-admin-01'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.discountAmount, 2000);
    assert.strictEqual(body.data.invoice.patientPayableAmount, 8000);
    assert.strictEqual(body.data.invoice.balanceDue, 8000);
  });
});
