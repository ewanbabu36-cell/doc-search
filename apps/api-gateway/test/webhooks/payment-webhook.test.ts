import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../../dist/app.js';
import { generateRazorpaySignature } from '@docsearch/auth';
import { setTestTransactionRunner } from '@docsearch/database';

/**
 * Razorpay Webhook Settlement & Payment Reconciliation Test Suite
 * 
 * Verifies:
 * 1. Webhook HMAC-SHA256 signature verification (rejects missing or tampered signatures with 401).
 * 2. Event 'payment.captured' full settlement:
 *    - Parses invoice reference and order ID.
 *    - Updates clinical.billing_invoices status to 'PAID' and balance to 0.
 *    - Inserts clinical.billing_payments record with method 'UPI' or 'CARD' and gateway transaction reference.
 *    - Updates clinical.investigation_orders billing_status to 'BILLED' for lab items.
 * 3. Idempotency:
 *    - Multiple webhook calls with the same gateway payment ID return HTTP 200 without creating duplicate payments.
 * 4. Partial payments set status to 'PARTIALLY_PAID' and maintain correct balance.
 * 5. Order ID lookup resolves target invoice when notes.invoiceId is omitted.
 */

describe('Razorpay Payment Webhook Settlement Integration Suite', () => {
  let app: any;

  const WEBHOOK_SECRET = 'rzp_test_secret_key_integration_123';
  const TENANT_ID = '11111111-1111-4111-8111-111111111111';
  const ENCOUNTER_ID = 'enc-' + crypto.randomUUID();
  const PATIENT_ID = 'pat-' + crypto.randomUUID();

  // In-memory mock database state
  interface MockInvoice {
    id: string;
    tenantId: string;
    partnerId: string;
    organizationId: string;
    branchId: string;
    invoiceNumber: string;
    patientId: string;
    encounterId: string;
    totalAmount: number;
    patientPayableAmount: number;
    paidAmount: number;
    balanceDue: number;
    dueAmount: number;
    status: string;
    items: any[];
    receiptNumber?: string;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
  }

  interface MockPayment {
    id: string;
    tenantId: string;
    partnerId: string;
    organizationId: string;
    branchId: string;
    invoiceId: string;
    patientId: string;
    paymentNumber: string;
    paymentMethod: string;
    amount: number;
    currency: string;
    referenceNumber: string;
    status: string;
    receivedBy: string;
    receivedAt: Date;
  }

  interface MockInvestigationOrder {
    id: string;
    tenantId: string;
    encounterId: string;
    orderNumber: string;
    status: string;
    metadata: {
      billing_status?: string;
      billingStatus?: string;
      [key: string]: any;
    };
    updatedAt: Date;
  }

  const inMemoryInvoices = new Map<string, MockInvoice>();
  const inMemoryPayments = new Map<string, MockPayment>();
  const inMemoryInvestigationOrders = new Map<string, MockInvestigationOrder>();
  const inMemoryReceipts: any[] = [];

  const invoice1Id = 'inv-test-lab-001';
  const invoice2PartialId = 'inv-test-partial-002';
  const invoice3OrderId = 'inv-test-order-003';
  const rzpOrderId3 = 'order_rzp_linked_999';

  const labOrderId = 'lab-order-cbc-001';

  before(async () => {
    process.env['RAZORPAY_WEBHOOK_SECRET'] = WEBHOOK_SECRET;
    process.env['NODE_ENV'] = 'test';

    // Seed test data
    const now = new Date();

    // 1. Invoice with Lab Tests
    inMemoryInvoices.set(invoice1Id, {
      id: invoice1Id,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: '00000000-0000-4000-8000-000000000003',
      invoiceNumber: 'INV-HOSP-100001',
      patientId: PATIENT_ID,
      encounterId: ENCOUNTER_ID,
      totalAmount: 3500,
      patientPayableAmount: 3500,
      paidAmount: 0,
      balanceDue: 3500,
      dueAmount: 3500,
      status: 'ISSUED',
      items: [
        {
          id: 'item-1',
          invoiceId: invoice1Id,
          serviceName: 'Comprehensive Metabolic Panel',
          category: 'LAB_TEST',
          quantity: 1,
          unitPrice: 2000,
          totalPrice: 2000,
          metadata: { orderId: labOrderId }
        },
        {
          id: 'item-2',
          invoiceId: invoice1Id,
          serviceName: 'General Consultation',
          category: 'CONSULTATION',
          quantity: 1,
          unitPrice: 1500,
          totalPrice: 1500
        }
      ],
      createdAt: now,
      updatedAt: now
    });

    // 2. Invoice for partial payment test
    inMemoryInvoices.set(invoice2PartialId, {
      id: invoice2PartialId,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: '00000000-0000-4000-8000-000000000003',
      invoiceNumber: 'INV-HOSP-100002',
      patientId: PATIENT_ID,
      encounterId: 'enc-partial-002',
      totalAmount: 4000,
      patientPayableAmount: 4000,
      paidAmount: 0,
      balanceDue: 4000,
      dueAmount: 4000,
      status: 'ISSUED',
      items: [
        {
          id: 'item-3',
          invoiceId: invoice2PartialId,
          serviceName: 'Cardiology Consultation',
          category: 'CONSULTATION',
          quantity: 1,
          unitPrice: 4000,
          totalPrice: 4000
        }
      ],
      createdAt: now,
      updatedAt: now
    });

    // 3. Invoice for Razorpay Order ID reference lookup
    inMemoryInvoices.set(invoice3OrderId, {
      id: invoice3OrderId,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: '00000000-0000-4000-8000-000000000003',
      invoiceNumber: 'INV-HOSP-100003',
      patientId: PATIENT_ID,
      encounterId: 'enc-order-003',
      totalAmount: 1800,
      patientPayableAmount: 1800,
      paidAmount: 0,
      balanceDue: 1800,
      dueAmount: 1800,
      status: 'ISSUED',
      metadata: {
        razorpayOrderId: rzpOrderId3
      },
      items: [
        {
          id: 'item-4',
          invoiceId: invoice3OrderId,
          serviceName: 'Dermatology Follow-up',
          category: 'CONSULTATION',
          quantity: 1,
          unitPrice: 1800,
          totalPrice: 1800
        }
      ],
      createdAt: now,
      updatedAt: now
    });

    // 4. Lab Investigation Order with billing_status = 'PENDING'
    inMemoryInvestigationOrders.set(labOrderId, {
      id: labOrderId,
      tenantId: TENANT_ID,
      encounterId: ENCOUNTER_ID,
      orderNumber: 'ORD-LAB-7701',
      status: 'SAMPLE_COLLECTED',
      metadata: {
        billing_status: 'PENDING',
        billingStatus: 'PENDING',
        testName: 'Comprehensive Metabolic Panel'
      },
      updatedAt: now
    });

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

    // Setup Test Transaction Runner
    setTestTransactionRunner(async (_context, cb) => {
      const mockTx = {
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
            for: () => queryChain,
            then: async (resolve: any) => {
              const tableName =
                selectedTable?.[Symbol.for('drizzle:Name')] ||
                selectedTable?.[Symbol.for('drizzle:OriginalName')] ||
                selectedTable?.name ||
                '';
              const params = getQueryParams(currentWhere);

              if (tableName === 'billing_payments') {
                if (params.length >= 2) {
                  const refOrId = params[params.length - 1];
                  const matched = Array.from(inMemoryPayments.values()).filter(
                    (p) => p.referenceNumber === refOrId || p.id === refOrId
                  );
                  return resolve(matched);
                }
                return resolve(Array.from(inMemoryPayments.values()));
              }

              if (tableName === 'billing_invoices') {
                if (params.length >= 2) {
                  const idOrNum = params[params.length - 1];
                  const matched = Array.from(inMemoryInvoices.values()).filter(
                    (inv) => inv.id === idOrNum || inv.invoiceNumber === idOrNum
                  );
                  return resolve(matched);
                }
                // Return all invoices for tenant
                return resolve(Array.from(inMemoryInvoices.values()));
              }

              if (tableName === 'billing_invoice_items') {
                if (params.length >= 2) {
                  const invId = params[params.length - 1];
                  const invoice = inMemoryInvoices.get(invId);
                  return resolve(invoice?.items || []);
                }
                const allItems = Array.from(inMemoryInvoices.values()).flatMap((inv) => inv.items || []);
                return resolve(allItems);
              }

              if (tableName === 'investigation_orders') {
                if (params.length >= 2) {
                  const encOrOrdId = params[params.length - 1];
                  const matched = Array.from(inMemoryInvestigationOrders.values()).filter(
                    (o) => o.encounterId === encOrOrdId || o.id === encOrOrdId
                  );
                  return resolve(matched);
                }
                return resolve(Array.from(inMemoryInvestigationOrders.values()));
              }

              return resolve([]);
            }
          };
          return queryChain;
        },
        update: (tbl: any) => ({
          set: (updateData: any) => ({
            where: async (whereClause: any) => {
              const tableName =
                tbl?.[Symbol.for('drizzle:Name')] ||
                tbl?.[Symbol.for('drizzle:OriginalName')] ||
                tbl?.name ||
                '';
              const params = getQueryParams(whereClause);

              if (tableName === 'billing_invoices') {
                const targetId = params[params.length - 1];
                for (const inv of inMemoryInvoices.values()) {
                  if (!targetId || inv.id === targetId) {
                    if ('paidAmount' in updateData) inv.paidAmount = updateData.paidAmount;
                    if ('balanceDue' in updateData) inv.balanceDue = updateData.balanceDue;
                    if ('dueAmount' in updateData) inv.dueAmount = updateData.dueAmount;
                    if ('outstandingBalance' in updateData) inv.balanceDue = updateData.outstandingBalance;
                    if ('status' in updateData) inv.status = updateData.status;
                    inv.updatedAt = updateData.updatedAt || new Date();
                  }
                }
              } else if (tableName === 'investigation_orders') {
                const targetId = params[params.length - 1];
                for (const ord of inMemoryInvestigationOrders.values()) {
                  if (!targetId || ord.id === targetId || ord.encounterId === targetId) {
                    if (updateData.metadata) {
                      ord.metadata = { ...ord.metadata, ...updateData.metadata };
                    }
                    ord.updatedAt = updateData.updatedAt || new Date();
                  }
                }
              }
              return [];
            }
          })
        }),
        insert: (tbl: any) => ({
          values: async (data: any) => {
            const tableName =
              tbl?.[Symbol.for('drizzle:Name')] ||
              tbl?.[Symbol.for('drizzle:OriginalName')] ||
              tbl?.name ||
              '';
            if (tableName === 'billing_payments') {
              inMemoryPayments.set(data.id, { ...data });
            } else if (tableName === 'billing_receipts') {
              inMemoryReceipts.push({ ...data });
            }
            return [{ id: data.id || crypto.randomUUID(), ...data }];
          }
        }),
        execute: async () => ({ rows: [] })
      };

      return cb(mockTx as any);
    });

    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  it('REQUIREMENT 1: Reject request with missing x-razorpay-signature header with HTTP 401', async () => {
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_unauth_001',
            amount: 350000,
            currency: 'INR',
            method: 'upi'
          }
        }
      }
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay',
      headers: {
        'content-type': 'application/json'
        // No signature
      },
      body: payload
    });

    assert.strictEqual(res.statusCode, 401, 'Missing signature must return 401');
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error?.code, 'UNAUTHORIZED');
  });

  it('REQUIREMENT 1: Reject request with invalid x-razorpay-signature with HTTP 401', async () => {
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_tampered_002',
            amount: 350000,
            currency: 'INR',
            method: 'upi'
          }
        }
      }
    });

    const invalidSignature = 'invalidsignaturehex0123456789abcdef0123456789abcdef0123456789abcdef';

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': invalidSignature
      },
      body: payload
    });

    assert.strictEqual(res.statusCode, 401, 'Invalid signature must return 401');
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error?.code, 'UNAUTHORIZED');
  });

  it('REQUIREMENT 2: Successfully settle invoice and update investigation orders on payment.captured (mode UPI)', async () => {
    const paymentId = 'pay_rzp_capture_001';
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: 'order_rzp_001',
            amount: 350000, // ₹3,500.00
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            notes: {
              tenantId: TENANT_ID,
              invoiceId: invoice1Id,
              invoiceNumber: 'INV-HOSP-100001'
            },
            created_at: Math.floor(Date.now() / 1000)
          }
        }
      }
    };

    const rawBody = JSON.stringify(payloadObj);
    const validSignature = generateRazorpaySignature(rawBody, WEBHOOK_SECRET);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': validSignature
      },
      body: rawBody
    });

    assert.strictEqual(res.statusCode, 200, `Expected 200, got: ${res.statusCode} ${res.body}`);
    const resBody = JSON.parse(res.body);
    assert.strictEqual(resBody.status, 'ok');
    assert.strictEqual(resBody.event, 'payment.captured');
    assert.strictEqual(resBody.isDuplicate, false);

    // Verify invoice state
    const settledInvoice = inMemoryInvoices.get(invoice1Id);
    assert.ok(settledInvoice, 'Invoice 1 must exist');
    assert.strictEqual(settledInvoice.status, 'PAID', 'Invoice status must be PAID');
    assert.strictEqual(settledInvoice.balanceDue, 0, 'Invoice balanceDue must be 0');
    assert.strictEqual(settledInvoice.paidAmount, 3500, 'Invoice paidAmount must be 3500');

    // Verify clinical.billing_payments record
    const paymentRows = Array.from(inMemoryPayments.values()).filter((p) => p.referenceNumber === paymentId);
    assert.strictEqual(paymentRows.length, 1, 'Exactly one payment record must be created');
    const paymentRecord = paymentRows[0];
    assert.strictEqual(paymentRecord?.paymentMethod, 'UPI', 'Payment mode must be UPI');
    assert.strictEqual(paymentRecord?.amount, 3500, 'Payment amount must be 3500');
    assert.strictEqual(paymentRecord?.status, 'SUCCESS');

    // Verify clinical.investigation_orders updated to 'BILLED'
    const labOrder = inMemoryInvestigationOrders.get(labOrderId);
    assert.ok(labOrder, 'Lab order must exist');
    assert.strictEqual(
      labOrder.metadata.billing_status,
      'BILLED',
      `Expected investigation order billing_status to be 'BILLED', got: ${labOrder.metadata.billing_status}`
    );
  });

  it('REQUIREMENT 3: Idempotency - Duplicate webhook calls return HTTP 200 without creating duplicate payments', async () => {
    const paymentId = 'pay_rzp_capture_001'; // Same payment ID as above test
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: 'order_rzp_001',
            amount: 350000,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            notes: {
              tenantId: TENANT_ID,
              invoiceId: invoice1Id,
              invoiceNumber: 'INV-HOSP-100001'
            }
          }
        }
      }
    };

    const rawBody = JSON.stringify(payloadObj);
    const validSignature = generateRazorpaySignature(rawBody, WEBHOOK_SECRET);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': validSignature
      },
      body: rawBody
    });

    assert.strictEqual(res.statusCode, 200, `Expected 200 for duplicate webhook, got: ${res.statusCode}`);
    const resBody = JSON.parse(res.body);
    assert.strictEqual(resBody.status, 'ok');
    assert.strictEqual(resBody.event, 'payment.captured');
    assert.strictEqual(resBody.isDuplicate, true, 'isDuplicate flag must be true');

    // Verify payment count for this transaction ID did not increment
    const paymentRows = Array.from(inMemoryPayments.values()).filter((p) => p.referenceNumber === paymentId);
    assert.strictEqual(paymentRows.length, 1, 'Duplicate webhook must NOT insert another payment row');
  });

  it('REQUIREMENT 2: Settle invoice via CARD payment method and map mode to CARD', async () => {
    const paymentId = 'pay_rzp_card_002';
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: 'order_rzp_card_002',
            amount: 180000, // ₹1,800.00
            currency: 'INR',
            status: 'captured',
            method: 'card',
            notes: {
              tenantId: TENANT_ID,
              invoiceId: invoice3OrderId
            }
          }
        }
      }
    };

    const rawBody = JSON.stringify(payloadObj);
    const validSignature = generateRazorpaySignature(rawBody, WEBHOOK_SECRET);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': validSignature
      },
      body: rawBody
    });

    assert.strictEqual(res.statusCode, 200);
    const paymentRecord = Array.from(inMemoryPayments.values()).find((p) => p.referenceNumber === paymentId);
    assert.ok(paymentRecord, 'Card payment record must be created');
    assert.strictEqual(paymentRecord.paymentMethod, 'CARD', 'Payment mode must be CARD');
  });

  it('REQUIREMENT 2: Settle invoice via Order ID lookup when notes.invoiceId is omitted', async () => {
    // Re-seed invoice with unique order ID
    const rzpOrderLookupId = 'order_rzp_lookup_test_777';
    const orderInvoiceId = 'inv-order-lookup-777';
    inMemoryInvoices.set(orderInvoiceId, {
      id: orderInvoiceId,
      tenantId: TENANT_ID,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: '00000000-0000-4000-8000-000000000003',
      invoiceNumber: 'INV-HOSP-777001',
      patientId: PATIENT_ID,
      encounterId: 'enc-777',
      totalAmount: 2500,
      patientPayableAmount: 2500,
      paidAmount: 0,
      balanceDue: 2500,
      dueAmount: 2500,
      status: 'ISSUED',
      metadata: {
        razorpayOrderId: rzpOrderLookupId
      },
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const paymentId = 'pay_rzp_order_match_777';
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: rzpOrderLookupId,
            amount: 250000, // ₹2,500.00
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            notes: {
              tenantId: TENANT_ID
              // invoiceId intentionally omitted
            }
          }
        }
      }
    };

    const rawBody = JSON.stringify(payloadObj);
    const validSignature = generateRazorpaySignature(rawBody, WEBHOOK_SECRET);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': validSignature
      },
      body: rawBody
    });

    assert.strictEqual(res.statusCode, 200);
    const invoice = inMemoryInvoices.get(orderInvoiceId);
    assert.ok(invoice);
    assert.strictEqual(invoice.status, 'PAID');
    assert.strictEqual(invoice.balanceDue, 0);
  });

  it('Handles partial payment by setting status to PARTIALLY_PAID and maintaining balance', async () => {
    const paymentId = 'pay_rzp_partial_555';
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: 'order_rzp_part_555',
            amount: 150000, // ₹1,500.00 out of ₹4,000.00
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            notes: {
              tenantId: TENANT_ID,
              invoiceId: invoice2PartialId
            }
          }
        }
      }
    };

    const rawBody = JSON.stringify(payloadObj);
    const validSignature = generateRazorpaySignature(rawBody, WEBHOOK_SECRET);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': validSignature
      },
      body: rawBody
    });

    assert.strictEqual(res.statusCode, 200);
    const invoice = inMemoryInvoices.get(invoice2PartialId);
    assert.ok(invoice);
    assert.strictEqual(invoice.status, 'PARTIALLY_PAID');
    assert.strictEqual(invoice.paidAmount, 1500);
    assert.strictEqual(invoice.balanceDue, 2500);
  });
});
