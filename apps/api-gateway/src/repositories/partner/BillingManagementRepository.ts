import {
  getDatabase,
  billingInvoices,
  billingInvoiceItems,
  billingDiscounts,
  billingPayments,
  billingReceipts,
  insuranceAuthorizations,
  investigationOrders,
  pharmacyDispensing,
  pharmacyDispensingItems,
  pharmacyBatches,
  pharmacyStockMovements,
  eq,
  and,
  desc
} from '@docsearch/database';
import { verifyJwt } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('billing-management-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for billing transaction');
    throw new AppError({
      message: 'Database service is unavailable. Billing transactions are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

function runInTx<T>(db: any, fn: (tx: any) => Promise<T>): Promise<T> {
  return typeof db.transaction === 'function' ? db.transaction(fn) : fn(db);
}

export interface InvoiceLineItemInput {
  serviceName: string;
  category: 'CONSULTATION' | 'BED_CHARGES' | 'PHARMACY' | 'LAB_TEST' | 'SURGERY_OT' | 'BLOOD_BANK' | 'NURSING';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateInvoiceInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientId: string;
  patientName?: string;
  encounterId: string;
  encounterType?: string; // OPD, IPD, EMERGENCY, SURGERY
  billingType: 'SELF_PAY' | 'INSURANCE_TPA' | 'AYUSHMAN_BHARAT_PMJAY' | 'CORPORATE';
  insurancePayerName?: string;
  policyNumber?: string;
  items?: InvoiceLineItemInput[];
  lineItems?: Array<{
    description?: string;
    sacCode?: string;
    amount?: number;
    gstRate?: number;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    serviceName?: string;
    category?: string;
  }>;
}

export interface RecordInsurancePreAuthInput {
  tenantId: string;
  invoiceId: string;
  patientId: string;
  payerName: string;
  policyNumber: string;
  preAuthNumber: string;
  requestedAmount: number;
  approvedAmount: number;
  coPayAmount: number;
  status: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
  remarks?: string;
}

export interface CollectPaymentInput {
  tenantId: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  paymentMode: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'INSURANCE_SETTLEMENT';
  transactionReference?: string;
  collectedBy: string;
}

export interface WebhookPaymentReconciliationInput {
  tenantId: string;
  invoiceId?: string;
  invoiceNumber?: string;
  orderId?: string;
  gateway: 'RAZORPAY' | 'PAYU';
  gatewayPaymentId: string;
  amount: number;
  currency?: string;
  paymentMethod: 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET' | 'ONLINE' | 'CARD';
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  metadata?: Record<string, unknown>;
  capturedAt?: Date;
}

export interface WebhookPaymentFailureInput {
  tenantId: string;
  invoiceId?: string;
  invoiceNumber?: string;
  orderId?: string;
  gateway: 'RAZORPAY' | 'PAYU';
  gatewayPaymentId?: string;
  errorCode?: string;
  errorDescription?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookRefundInput {
  tenantId: string;
  invoiceId?: string;
  invoiceNumber?: string;
  gateway: 'RAZORPAY' | 'PAYU';
  gatewayPaymentId: string;
  gatewayRefundId: string;
  amount: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface StoredInvoiceItem {
  id: string;
  invoiceId: string;
  serviceName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StoredPreAuth {
  preAuthNumber: string;
  payerName: string;
  policyNumber: string;
  requestedAmount: number;
  approvedAmount: number;
  coPayAmount: number;
  status: string;
  approvedAt: Date;
}

export interface StoredPayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMode: string;
  transactionReference?: string | undefined;
  collectedBy: string;
  collectedAt: Date;
}

export interface StoredInvoice {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  encounterId: string;
  encounterType: string;
  billingType: string;
  insurancePayerName?: string | undefined;
  policyNumber?: string | undefined;
  totalAmount: number;
  insuranceCoveredAmount: number;
  patientPayableAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'PENDING_PAYMENT' | 'PARTIALLY_PAID' | 'PAID' | 'DISCHARGE_SETTLED' | 'CANCELLED' | 'VOIDED';
  discountTotal?: number;
  metadata?: Record<string, unknown>;
  items: StoredInvoiceItem[];
  preAuth?: StoredPreAuth | null | undefined;
  payments: StoredPayment[];
  receiptNumber?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoidInvoiceInput {
  tenantId: string;
  invoiceId: string;
  voidReason: string;
  supervisorUserId: string;
  supervisorOverrideToken?: string | undefined;
  actorId?: string | undefined;
  actorRole?: string | undefined;
}

export interface VoidInvoiceResult {
  success: boolean;
  invoice: StoredInvoice;
  quarantinedItemsCount: number;
  message: string;
}

export interface ApplyDiscountInput {
  tenantId: string;
  invoiceId: string;
  invoiceItemId?: string | undefined;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  reason: string;
  approvedBy: string;
  supervisorOverrideToken?: string | undefined;
  actorId?: string | undefined;
}

export interface ApplyDiscountResult {
  success: boolean;
  invoice: StoredInvoice;
  discountId: string;
  discountAmount: number;
}

const ALLOWED_SUPERVISOR_ROLES = new Set([
  'SUPERVISOR',
  'SUPER_ADMIN',
  'HOSPITAL_ADMIN',
  'BILLING_SUPERVISOR',
  'MEDICAL_DIRECTOR',
  'ADMIN'
]);

export function validateSupervisorOverrideToken(
  token: string | undefined,
  expectedSupervisorId?: string
): { supervisorId: string; role: string } {
  if (!token || typeof token !== 'string' || !token.trim()) {
    throw new AppError({
      message: "Modifying or voiding an invoice in 'PAID' status requires a validated supervisor override token.",
      code: ErrorCode.FORBIDDEN,
      statusCode: 403
    });
  }

  const jwtSecret = process.env['JWT_SECRET'] || 'docsearch_master_jwt_secret_dev_32char_key_only';
  let claims: any;
  try {
    claims = verifyJwt(token.trim(), jwtSecret);
  } catch (err: any) {
    logger.warn('Supervisor override token cryptographic verification failed', { error: err?.message });
    throw new AppError({
      message: 'Invalid or expired supervisor override token.',
      code: ErrorCode.FORBIDDEN,
      statusCode: 403
    });
  }

  const tokenUserId = claims.sub || claims.userId;
  const roles: string[] = Array.isArray(claims.roles)
    ? claims.roles
    : typeof claims.role === 'string'
    ? [claims.role]
    : [];

  const hasSupervisorRole = roles.some((r) => ALLOWED_SUPERVISOR_ROLES.has(r.toUpperCase()));
  const isExplicitOverride = claims.override === true || claims.purpose === 'INVOICE_VOID_OVERRIDE';

  if (!hasSupervisorRole && !isExplicitOverride) {
    throw new AppError({
      message: 'Supervisor override token lacks required supervisory privileges.',
      code: ErrorCode.FORBIDDEN,
      statusCode: 403
    });
  }

  if (expectedSupervisorId && tokenUserId && tokenUserId !== expectedSupervisorId) {
    throw new AppError({
      message: `Supervisor override token subject (${tokenUserId}) does not match the provided supervisor user ID (${expectedSupervisorId}).`,
      code: ErrorCode.FORBIDDEN,
      statusCode: 403
    });
  }

  return {
    supervisorId: tokenUserId || expectedSupervisorId || 'SUPERVISOR',
    role: roles[0] || 'SUPERVISOR'
  };
}

export class BillingManagementRepository {
  async getInvoices(tenantId: string, patientId?: string, status?: string, dbClient = getDatabase()): Promise<StoredInvoice[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(billingInvoices)
        .where(eq(billingInvoices.tenantId, tenantId))
        .orderBy(desc(billingInvoices.createdAt));

      let list = rows as unknown as StoredInvoice[];
      if (patientId) list = list.filter(i => i.patientId === patientId);
      if (status) list = list.filter(i => i.status === status);
      return list;
    } catch (err) {
      logger.error('Failed to query invoices from database', err);
      throw new AppError({
        message: 'Database query failed. Invoices unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getInvoiceById(tenantId: string, invoiceId: string, dbClient = getDatabase()): Promise<StoredInvoice | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(billingInvoices)
        .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, invoiceId)));

      if (!found) return null;

      const items = await db
        .select()
        .from(billingInvoiceItems)
        .where(and(eq(billingInvoiceItems.tenantId, tenantId), eq(billingInvoiceItems.invoiceId, invoiceId)));

      const payments = await db
        .select()
        .from(billingPayments)
        .where(and(eq(billingPayments.tenantId, tenantId), eq(billingPayments.invoiceId, invoiceId)));

      return {
        ...(found as unknown as StoredInvoice),
        totalAmount: Number(found.totalAmount || 0),
        patientPayableAmount: Number(found.totalAmount || 0),
        paidAmount: Number(found.paidAmount || 0),
        balanceDue: Number(found.dueAmount || 0),
        items: (items as unknown as StoredInvoiceItem[]) || [],
        payments: (payments as unknown as StoredPayment[]) || []
      };
    } catch (err) {
      logger.error('Failed to query invoice by ID from database', err);
      throw new AppError({
        message: 'Database query failed. Invoice lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createInvoice(input: CreateInvoiceInput, dbClient = getDatabase()): Promise<StoredInvoice> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const now = new Date();
    const invoiceNumber = `INV-HOSP-${Math.floor(100000 + Math.random() * 900000)}`;

    const rawItems = input.items || (input.lineItems?.map((li) => ({
      serviceName: li.description || li.serviceName || 'Clinical Service',
      category: (li.category || 'CONSULTATION') as any,
      quantity: li.quantity || 1,
      unitPrice: li.unitPrice || li.amount || 0,
      totalPrice: li.totalPrice || ((li.amount || li.unitPrice || 0) * (li.quantity || 1))
    }))) || [];

    const totalAmount = rawItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const items: StoredInvoiceItem[] = rawItems.map(item => ({
      id: crypto.randomUUID(),
      invoiceId: id,
      serviceName: item.serviceName,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }));

    const record: StoredInvoice = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      invoiceNumber,
      patientId: input.patientId,
      patientName: input.patientName || 'Patient',
      encounterId: input.encounterId,
      encounterType: input.encounterType || 'OPD',
      billingType: input.billingType || 'SELF_PAY',
      insurancePayerName: input.insurancePayerName,
      policyNumber: input.policyNumber,
      totalAmount,
      insuranceCoveredAmount: 0,
      patientPayableAmount: totalAmount,
      paidAmount: 0,
      balanceDue: totalAmount,
      status: 'PENDING_PAYMENT',
      items,
      preAuth: null,
      payments: [],
      createdAt: now,
      updatedAt: now
    };

    try {
      return await runInTx(db, async (tx: any) => {
        const [created] = await tx.insert(billingInvoices).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          patientId: record.patientId,
          encounterId: record.encounterId,
          invoiceNumber: record.invoiceNumber,
          invoiceType: record.encounterType || 'OPD',
          status: record.status,
          subtotal: record.totalAmount.toFixed(2),
          discountTotal: '0.00',
          taxTotal: '0.00',
          roundingAdjustment: '0.00',
          totalAmount: record.totalAmount.toFixed(2),
          paidAmount: '0.00',
          dueAmount: record.totalAmount.toFixed(2),
          currency: 'INR'
        } as unknown as typeof billingInvoices.$inferInsert).returning();

        for (const item of items) {
          await tx.insert(billingInvoiceItems).values({
            id: item.id,
            tenantId: record.tenantId,
            invoiceId: record.id,
            serviceCode: item.category || 'CONSULTATION',
            description: item.serviceName,
            quantity: item.quantity.toFixed(2),
            unitPrice: item.unitPrice.toFixed(2),
            grossAmount: item.totalPrice.toFixed(2),
            discountAmount: '0.00',
            taxAmount: '0.00',
            netAmount: item.totalPrice.toFixed(2)
          } as unknown as typeof billingInvoiceItems.$inferInsert);
        }

        return { ...record, id: created ? created.id : record.id };
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to create invoice in database', err);
      throw new AppError({
        message: 'Database persistence failed. Invoice generation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordInsurancePreAuth(input: RecordInsurancePreAuthInput, dbClient = getDatabase()): Promise<StoredInvoice | null> {
    const db = requireDb(dbClient);
    const invoice = await this.getInvoiceById(input.tenantId, input.invoiceId, db);
    if (!invoice) return null;

    const now = new Date();
    invoice.preAuth = {
      preAuthNumber: input.preAuthNumber,
      payerName: input.payerName,
      policyNumber: input.policyNumber,
      requestedAmount: input.requestedAmount,
      approvedAmount: input.approvedAmount,
      coPayAmount: input.coPayAmount,
      status: input.status,
      approvedAt: now
    };

    if (input.status === 'APPROVED' || input.status === 'PARTIALLY_APPROVED') {
      invoice.insuranceCoveredAmount = input.approvedAmount;
      invoice.patientPayableAmount = Math.max(0, invoice.totalAmount - input.approvedAmount);
      invoice.balanceDue = Math.max(0, invoice.patientPayableAmount - invoice.paidAmount);
    }
    invoice.updatedAt = now;

    try {
      return await runInTx(db, async (tx: any) => {
        await tx.insert(insuranceAuthorizations).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: invoice.partnerId,
          organizationId: invoice.organizationId,
          branchId: invoice.branchId,
          patientId: input.patientId,
          authorizationNumber: input.preAuthNumber,
          approvedAmount: input.approvedAmount,
          status: input.status,
          approvedAt: now
        } as unknown as typeof insuranceAuthorizations.$inferInsert);

        await tx
          .update(billingInvoices)
          .set({
            dueAmount: invoice.balanceDue.toFixed(2),
            updatedAt: now
          } as unknown as typeof billingInvoices.$inferInsert)
          .where(eq(billingInvoices.id, invoice.id));

        return invoice;
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to record insurance pre-auth in database', err);
      throw new AppError({
        message: 'Database update failed. Pre-authorization recording aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async collectPayment(input: CollectPaymentInput, dbClient = getDatabase()): Promise<{ invoice: StoredInvoice; receiptNumber: string }> {
    const db = requireDb(dbClient);
    const invoice = await this.getInvoiceById(input.tenantId, input.invoiceId, db);
    if (!invoice) {
      throw new AppError({
        message: 'Invoice not found for payment collection',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const now = new Date();
    const paymentId = crypto.randomUUID();
    const receiptNumber = `REC-${Math.floor(100000 + Math.random() * 900000)}`;

    const payment: StoredPayment = {
      id: paymentId,
      invoiceId: invoice.id,
      amount: input.amount,
      paymentMode: input.paymentMode,
      transactionReference: input.transactionReference,
      collectedBy: input.collectedBy,
      collectedAt: now
    };

    invoice.payments.push(payment);
    invoice.paidAmount = (invoice.paidAmount || 0) + input.amount;
    const payable = Number(invoice.patientPayableAmount ?? invoice.totalAmount ?? 0);
    invoice.balanceDue = Math.max(0, payable - invoice.paidAmount);
    invoice.receiptNumber = receiptNumber;

    if (invoice.balanceDue === 0) {
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }
    invoice.updatedAt = now;

    try {
      return await runInTx(db, async (tx: any) => {
        const paymentNumber = `PMT-${Math.floor(100000 + Math.random() * 900000)}`;
        await tx.insert(billingPayments).values({
          id: paymentId,
          tenantId: input.tenantId,
          partnerId: invoice.partnerId,
          organizationId: invoice.organizationId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          paymentNumber,
          amount: input.amount.toFixed(2),
          paymentMethod: input.paymentMode,
          currency: 'INR',
          status: 'SUCCESS',
          receivedBy: input.collectedBy || 'STAFF',
          receivedAt: now
        } as unknown as typeof billingPayments.$inferInsert);

        await tx.insert(billingReceipts).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: invoice.partnerId,
          organizationId: invoice.organizationId,
          branchId: invoice.branchId,
          paymentId,
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          receiptNumber,
          amount: input.amount.toFixed(2),
          paymentMethod: input.paymentMode,
          issuedBy: input.collectedBy || 'STAFF',
          issuedAt: now,
          status: 'ISSUED'
        } as unknown as typeof billingReceipts.$inferInsert);

        await tx
          .update(billingInvoices)
          .set({
            paidAmount: invoice.paidAmount.toFixed(2),
            dueAmount: invoice.balanceDue.toFixed(2),
            status: invoice.status
          } as unknown as typeof billingInvoices.$inferInsert)
          .where(eq(billingInvoices.id, invoice.id));

        return { invoice, receiptNumber };
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to collect payment in database', err);
      throw new AppError({
        message: 'Database persistence failed. Payment processing aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getPatientBillingHistory(tenantId: string, patientId: string, dbClient = getDatabase()): Promise<StoredInvoice[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(billingInvoices)
        .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.patientId, patientId)))
        .orderBy(desc(billingInvoices.createdAt));

      return rows as unknown as StoredInvoice[];
    } catch (err) {
      logger.error('Failed to query patient billing history from database', err);
      throw new AppError({
        message: 'Database query failed. Billing history unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async reconcileWebhookPayment(
    input: WebhookPaymentReconciliationInput,
    dbClient = getDatabase()
  ): Promise<{ isDuplicate: boolean; invoice: StoredInvoice; receiptNumber?: string; paymentId?: string }> {
    const db = requireDb(dbClient);

    // 1. Idempotency Check: check if payment reference already recorded
    const existingPayments = await db
      .select()
      .from(billingPayments)
      .where(
        and(
          eq(billingPayments.tenantId, input.tenantId),
          eq(billingPayments.referenceNumber, input.gatewayPaymentId)
        )
      );

    if (existingPayments.length > 0) {
      const existingPayment = existingPayments[0];
      if (existingPayment && existingPayment.invoiceId) {
        const invoice = await this.getInvoiceById(input.tenantId, existingPayment.invoiceId, db);
        return {
          isDuplicate: true,
          invoice: invoice!,
          paymentId: existingPayment.id
        };
      }
    }

    // 2. Find target invoice by ID, invoiceNumber, or orderId reference
    let invoice: StoredInvoice | null = null;
    if (input.invoiceId) {
      invoice = await this.getInvoiceById(input.tenantId, input.invoiceId, db);
    }
    if (!invoice && input.invoiceNumber) {
      const [found] = await db
        .select()
        .from(billingInvoices)
        .where(
          and(
            eq(billingInvoices.tenantId, input.tenantId),
            eq(billingInvoices.invoiceNumber, input.invoiceNumber)
          )
        );
      if (found) {
        invoice = await this.getInvoiceById(input.tenantId, found.id, db);
      }
    }
    if (!invoice && input.orderId) {
      const allInvoices = await db
        .select()
        .from(billingInvoices)
        .where(eq(billingInvoices.tenantId, input.tenantId));

      const foundByOrder = allInvoices.find((inv: any) => {
        const meta = (inv.metadata && typeof inv.metadata === 'object') ? inv.metadata : {};
        return (
          meta.razorpayOrderId === input.orderId ||
          meta.orderId === input.orderId ||
          inv.invoiceNumber === input.orderId ||
          inv.id === input.orderId
        );
      });
      if (foundByOrder) {
        invoice = await this.getInvoiceById(input.tenantId, foundByOrder.id, db);
      }
    }

    if (!invoice) {
      throw new AppError({
        message: `Invoice not found for webhook reconciliation (ID: ${input.invoiceId || 'N/A'}, Number: ${input.invoiceNumber || 'N/A'}, Order: ${input.orderId || 'N/A'})`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    // 3. Atomically record payment and update invoice
    const now = input.capturedAt || new Date();
    const paymentId = crypto.randomUUID();
    const receiptNumber = `REC-PG-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPaidAmount = (invoice.paidAmount || 0) + input.amount;
    const newBalanceDue = Math.max(0, (invoice.patientPayableAmount || invoice.totalAmount) - newPaidAmount);
    // When balance reaches 0, update clinical.billing_invoices status strictly to 'PAID'
    const newStatus = newBalanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID';

    // Normalize payment mode to 'UPI' or 'CARD' (or valid clinical billing method)
    let paymentMethod = (input.paymentMethod || 'UPI').toUpperCase();
    if (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CARD') {
      paymentMethod = 'CARD';
    } else if (paymentMethod === 'UPI') {
      paymentMethod = 'UPI';
    } else if (!['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'CHEQUE', 'ONLINE'].includes(paymentMethod)) {
      paymentMethod = 'UPI';
    }

    try {
      return await runInTx(db, async (tx: any) => {
        await tx.insert(billingPayments).values({
          id: paymentId,
          tenantId: input.tenantId,
          partnerId: invoice.partnerId,
          organizationId: invoice.organizationId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          paymentNumber: `PAY-${input.gateway.substring(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`,
          paymentMethod,
          amount: input.amount,
          currency: input.currency || 'INR',
          referenceNumber: input.gatewayPaymentId,
          status: 'SUCCESS',
          receivedBy: `SYSTEM_WEBHOOK_${input.gateway}`,
          receivedAt: now,
          notes: `Automated PG Webhook Reconciliation (${input.gateway})`,
          metadata: input.metadata || {}
        } as unknown as typeof billingPayments.$inferInsert);

        await tx.insert(billingReceipts).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: invoice.partnerId,
          organizationId: invoice.organizationId,
          branchId: invoice.branchId,
          paymentId,
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          receiptNumber,
          amount: input.amount.toFixed(2),
          paymentMethod,
          issuedBy: `SYSTEM_WEBHOOK_${input.gateway}`,
          issuedAt: now,
          status: 'ISSUED'
        } as unknown as typeof billingReceipts.$inferInsert);

        await tx
          .update(billingInvoices)
          .set({
            paidAmount: newPaidAmount.toFixed(2),
            dueAmount: newBalanceDue.toFixed(2),
            status: newStatus,
            updatedAt: now
          } as unknown as typeof billingInvoices.$inferInsert)
          .where(eq(billingInvoices.id, invoice.id));

        // 4. If invoice contains lab investigation items, update clinical.investigation_orders.billing_status to 'BILLED'
        const hasLabItems = (invoice.items || []).some((item: any) => {
          const cat = (item.category || '').toUpperCase();
          const desc = (item.serviceName || item.description || '').toUpperCase();
          return (
            cat === 'LAB_TEST' ||
            cat === 'DIAGNOSTICS' ||
            cat === 'LAB' ||
            desc.includes('LAB') ||
            desc.includes('TEST') ||
            desc.includes('PROFILE') ||
            desc.includes('PANEL') ||
            desc.includes('INVESTIGATION')
          );
        });

        if (hasLabItems || invoice.encounterId) {
          const labOrderIds: string[] = [];
          for (const item of invoice.items || []) {
            const meta = (item as any).metadata;
            if (meta?.orderId) labOrderIds.push(meta.orderId);
            if ((item as any).orderId) labOrderIds.push((item as any).orderId);
          }

          if (invoice.encounterId) {
            try {
              const orders = await tx
                .select()
                .from(investigationOrders)
                .where(
                  and(
                    eq(investigationOrders.tenantId, input.tenantId),
                    eq(investigationOrders.encounterId, invoice.encounterId)
                  )
                );
              for (const order of orders) {
                const existingMeta = (order.metadata && typeof order.metadata === 'object') ? order.metadata : {};
                await tx
                  .update(investigationOrders)
                  .set({
                    metadata: {
                      ...existingMeta,
                      billing_status: 'BILLED',
                      billingStatus: 'BILLED'
                    },
                    updatedAt: now
                  } as any)
                  .where(eq(investigationOrders.id, order.id));
              }
            } catch (labErr) {
              logger.warn('Could not update lab investigation orders by encounterId', { error: String(labErr) });
            }
          }

          for (const ordId of labOrderIds) {
            try {
              const [order] = await tx
                .select()
                .from(investigationOrders)
                .where(
                  and(
                    eq(investigationOrders.tenantId, input.tenantId),
                    eq(investigationOrders.id, ordId)
                  )
                );
              if (order) {
                const existingMeta = (order.metadata && typeof order.metadata === 'object') ? order.metadata : {};
                await tx
                  .update(investigationOrders)
                  .set({
                    metadata: {
                      ...existingMeta,
                      billing_status: 'BILLED',
                      billingStatus: 'BILLED'
                    },
                    updatedAt: now
                  } as any)
                  .where(eq(investigationOrders.id, order.id));
              }
            } catch (labErr) {
              logger.warn('Could not update lab investigation order by orderId', { error: String(labErr) });
            }
          }
        }

        invoice.paidAmount = newPaidAmount;
        invoice.balanceDue = newBalanceDue;
        invoice.status = newStatus as any;
        invoice.receiptNumber = receiptNumber;

        return {
          isDuplicate: false,
          invoice,
          receiptNumber,
          paymentId
        };
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to reconcile webhook payment in database', err);
      throw new AppError({
        message: 'Database persistence failed during webhook reconciliation.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async handleWebhookPaymentFailure(
    input: WebhookPaymentFailureInput,
    dbClient = getDatabase()
  ): Promise<{ success: boolean; message: string }> {
    requireDb(dbClient);
    logger.warn('Payment failed via webhook', {
      gateway: input.gateway,
      paymentId: input.gatewayPaymentId,
      code: input.errorCode,
      desc: input.errorDescription
    });
    return { success: true, message: 'Payment failure recorded' };
  }

  async handleWebhookRefund(
    input: WebhookRefundInput,
    dbClient = getDatabase()
  ): Promise<{ success: boolean; refundPaymentId: string }> {
    const db = requireDb(dbClient);
    let invoice: StoredInvoice | null = null;
    if (input.invoiceId) {
      invoice = await this.getInvoiceById(input.tenantId, input.invoiceId, db);
    }
    if (!invoice && input.invoiceNumber) {
      const [found] = await db
        .select()
        .from(billingInvoices)
        .where(and(eq(billingInvoices.tenantId, input.tenantId), eq(billingInvoices.invoiceNumber, input.invoiceNumber)));
      if (found) invoice = await this.getInvoiceById(input.tenantId, found.id, db);
    }

    if (!invoice) {
      throw new AppError({
        message: 'Invoice not found for refund processing',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const refundPaymentId = crypto.randomUUID();
    const now = new Date();
    const newPaidAmount = Math.max(0, (invoice.paidAmount || 0) - input.amount);
    const newBalanceDue = (invoice.patientPayableAmount || invoice.totalAmount) - newPaidAmount;

    try {
      await db.insert(billingPayments).values({
        id: refundPaymentId,
        tenantId: input.tenantId,
        partnerId: invoice.partnerId,
        organizationId: invoice.organizationId,
        branchId: invoice.branchId,
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        paymentNumber: `REF-${input.gateway.substring(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`,
        paymentMethod: 'ONLINE',
        amount: -input.amount,
        currency: 'INR',
        referenceNumber: input.gatewayRefundId,
        status: 'REFUNDED',
        receivedBy: `SYSTEM_WEBHOOK_${input.gateway}`,
        receivedAt: now,
        notes: `Refund processed: ${input.reason || 'Requested by user/gateway'}`,
        metadata: input.metadata || {}
      } as unknown as typeof billingPayments.$inferInsert);

      await db
        .update(billingInvoices)
        .set({
          paidAmount: newPaidAmount,
          outstandingBalance: newBalanceDue,
          status: newPaidAmount === 0 ? 'PENDING_PAYMENT' : 'PARTIALLY_PAID',
          updatedAt: now
        } as unknown as typeof billingInvoices.$inferInsert)
        .where(eq(billingInvoices.id, invoice.id));

      return { success: true, refundPaymentId };
    } catch (err) {
      logger.error('Failed to record refund in database', err);
      throw new AppError({
        message: 'Database persistence failed during refund processing.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async voidInvoice(
    input: VoidInvoiceInput,
    dbClient = getDatabase()
  ): Promise<VoidInvoiceResult> {
    const db = requireDb(dbClient);

    if (!input.voidReason || typeof input.voidReason !== 'string' || !input.voidReason.trim()) {
      throw new AppError({
        message: 'void_reason is mandatory and cannot be empty.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    if (!input.supervisorUserId || typeof input.supervisorUserId !== 'string' || !input.supervisorUserId.trim()) {
      throw new AppError({
        message: 'supervisor_user_id is mandatory and cannot be empty.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const invoice = await this.getInvoiceById(input.tenantId, input.invoiceId, db);
    if (!invoice) {
      throw new AppError({
        message: `Invoice ${input.invoiceId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (invoice.status === 'VOIDED' || invoice.status === 'CANCELLED') {
      throw new AppError({
        message: `Invoice ${invoice.invoiceNumber} is already voided.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    const isPaidOrSettled = invoice.status === 'PAID' || invoice.status === 'DISCHARGE_SETTLED';
    if (isPaidOrSettled) {
      validateSupervisorOverrideToken(input.supervisorOverrideToken, input.supervisorUserId.trim());
    }

    const now = new Date();
    const cleanReason = input.voidReason.trim();
    const cleanSupervisorId = input.supervisorUserId.trim();

    const existingMetadata = (invoice.metadata && typeof invoice.metadata === 'object') ? invoice.metadata : {};
    const updatedMetadata = {
      ...existingMetadata,
      voidReason: cleanReason,
      supervisorUserId: cleanSupervisorId,
      voidedAt: now.toISOString(),
      requiresSupervisorOverride: isPaidOrSettled,
      voidedBySupervisor: isPaidOrSettled ? cleanSupervisorId : (input.actorId || cleanSupervisorId)
    };

    let quarantinedCount = 0;

    // Update invoice status to VOIDED atomically
    await runInTx(db, async (tx: any) => {
      await tx
        .update(billingInvoices)
        .set({
          status: 'VOIDED',
          dueAmount: '0.00',
          metadata: updatedMetadata,
          updatedAt: now
        } as any)
        .where(and(eq(billingInvoices.tenantId, input.tenantId), eq(billingInvoices.id, invoice.id)));

      // Check if tied to pharmacy dispensing & mark items for physical quarantine/audit
      try {
        let matchedDispensings: any[] = [];
        if (invoice.encounterId) {
          const found = await tx
            .select()
            .from(pharmacyDispensing)
            .where(
              and(
                eq(pharmacyDispensing.tenantId, input.tenantId),
                eq(pharmacyDispensing.prescriptionId, invoice.encounterId)
              )
            );
          if (found && found.length > 0) matchedDispensings.push(...found);
        }

        const hasPharmacyItems = invoice.items.some(
          (it) => it.category === 'PHARMACY' || (it.serviceName && it.serviceName.toUpperCase().includes('PHARM'))
        );
        if (matchedDispensings.length === 0 && hasPharmacyItems && invoice.patientId) {
          const found = await tx
            .select()
            .from(pharmacyDispensing)
            .where(
              and(
                eq(pharmacyDispensing.tenantId, input.tenantId),
                eq(pharmacyDispensing.patientId, invoice.patientId)
              )
            );
          if (found && found.length > 0) matchedDispensings.push(...found);
        }

        for (const disp of matchedDispensings) {
          // Mark pharmacy dispensing status as REVERSED
          await tx
            .update(pharmacyDispensing)
            .set({
              dispensingStatus: 'REVERSED',
              reversalReason: `Invoice ${invoice.invoiceNumber} voided: ${cleanReason} - Marked for physical quarantine/audit`,
              reversedBy: cleanSupervisorId,
              reversedAt: now,
              updatedAt: now
            } as any)
            .where(and(eq(pharmacyDispensing.tenantId, input.tenantId), eq(pharmacyDispensing.id, disp.id)));

          // Find dispensing items to mark batch inventory for physical quarantine
          let items: any[] = [];
          try {
            const fetchedItems = await tx
              .select()
              .from(pharmacyDispensingItems)
              .where(
                and(
                  eq(pharmacyDispensingItems.tenantId, input.tenantId),
                  eq(pharmacyDispensingItems.dispensingId, disp.id)
                )
              );
            if (fetchedItems && fetchedItems.length > 0) items = fetchedItems;
          } catch {
            // fallback
          }

          if (items.length > 0) {
            for (const item of items) {
              quarantinedCount++;
              // Insert physical quarantine movement ledger entry (no silent deletion)
              await tx.insert(pharmacyStockMovements).values({
                id: crypto.randomUUID(),
                tenantId: input.tenantId,
                partnerId: disp.partnerId || invoice.partnerId,
                organizationId: disp.organizationId || invoice.organizationId,
                branchId: disp.branchId || invoice.branchId,
                medicationId: item.medicationId,
                batchId: item.batchId,
                movementType: 'QUARANTINE',
                quantity: item.quantity,
                beforeQuantity: 0,
                afterQuantity: 0,
                actorId: cleanSupervisorId,
                actorRole: 'SUPERVISOR',
                reason: `Invoice ${invoice.invoiceNumber} voided: ${cleanReason} - Physically quarantined for audit`,
                correlationId: `quarantine-${invoice.id}-${Date.now()}`,
                referenceType: 'DISPENSING',
                referenceId: disp.dispensingNumber,
                metadata: {
                  quarantineType: 'VOID_INVENTORY_AUDIT',
                  dispensingId: disp.id,
                  invoiceId: invoice.id,
                  invoiceNumber: invoice.invoiceNumber,
                  quarantinedAt: now.toISOString()
                },
                occurredAt: now
              } as any);

              // Mark batch metadata for physical quarantine/audit rather than silent deletion
              await tx
                .update(pharmacyBatches)
                .set({
                  blockReason: `Quarantined for audit following void of invoice ${invoice.invoiceNumber}: ${cleanReason}`,
                  blockedBy: cleanSupervisorId,
                  blockedAt: now,
                  metadata: {
                    quarantineStatus: 'PHYSICAL_QUARANTINE_AUDIT',
                    quarantineReason: cleanReason,
                    quarantinedAt: now.toISOString(),
                    associatedInvoiceNumber: invoice.invoiceNumber
                  },
                  updatedAt: now
                } as any)
                .where(and(eq(pharmacyBatches.tenantId, input.tenantId), eq(pharmacyBatches.id, item.batchId)));
            }
          } else {
            // If no granular dispensing items row, record a quarantine movement for the dispensing record itself
            quarantinedCount++;
            await tx.insert(pharmacyStockMovements).values({
              id: crypto.randomUUID(),
              tenantId: input.tenantId,
              partnerId: disp.partnerId || invoice.partnerId,
              organizationId: disp.organizationId || invoice.organizationId,
              branchId: disp.branchId || invoice.branchId,
              medicationId: disp.medicationId || '00000000-0000-4000-8000-000000000000',
              batchId: disp.batchId || '00000000-0000-4000-8000-000000000000',
              movementType: 'QUARANTINE',
              quantity: 1,
              beforeQuantity: 0,
              afterQuantity: 0,
              actorId: cleanSupervisorId,
              actorRole: 'SUPERVISOR',
              reason: `Invoice ${invoice.invoiceNumber} voided: ${cleanReason} - Dispensing physically quarantined for audit`,
              correlationId: `quarantine-${invoice.id}-${Date.now()}`,
              referenceType: 'DISPENSING',
              referenceId: disp.dispensingNumber,
              metadata: {
                quarantineType: 'VOID_DISPENSING_AUDIT',
                dispensingId: disp.id,
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber
              },
              occurredAt: now
            } as any);
          }
        }
      } catch (dispErr) {
        logger.warn('Pharmacy quarantine check completed with note', { error: String(dispErr) });
      }
    });

    invoice.status = 'VOIDED';
    invoice.balanceDue = 0;
    invoice.updatedAt = now;
    invoice.metadata = updatedMetadata;

    return {
      success: true,
      invoice,
      quarantinedItemsCount: quarantinedCount,
      message: `Invoice ${invoice.invoiceNumber} voided successfully.${quarantinedCount > 0 ? ` ${quarantinedCount} pharmacy item(s) physically quarantined for audit.` : ''}`
    };
  }

  async applyDiscount(
    input: ApplyDiscountInput,
    dbClient = getDatabase()
  ): Promise<ApplyDiscountResult> {
    const db = requireDb(dbClient);

    if (!input.reason || typeof input.reason !== 'string' || !input.reason.trim()) {
      throw new AppError({
        message: 'reason is mandatory and cannot be empty.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    if (!input.approvedBy || typeof input.approvedBy !== 'string' || !input.approvedBy.trim()) {
      throw new AppError({
        message: 'approved_by is mandatory and cannot be empty.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    if (typeof input.discountValue !== 'number' || input.discountValue <= 0) {
      throw new AppError({
        message: 'discount_value must be a positive number.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const invoice = await this.getInvoiceById(input.tenantId, input.invoiceId, db);
    if (!invoice) {
      throw new AppError({
        message: `Invoice ${input.invoiceId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (invoice.status === 'VOIDED' || invoice.status === 'CANCELLED') {
      throw new AppError({
        message: `Cannot apply discount to voided invoice ${invoice.invoiceNumber}.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    const isPaidOrSettled = invoice.status === 'PAID' || invoice.status === 'DISCHARGE_SETTLED';
    if (isPaidOrSettled) {
      validateSupervisorOverrideToken(input.supervisorOverrideToken, input.approvedBy.trim());
    }

    let discountAmount = 0;
    if (input.discountType === 'PERCENTAGE') {
      if (input.discountValue > 100) {
        throw new AppError({
          message: 'Percentage discount cannot exceed 100%.',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      discountAmount = Math.round(((invoice.totalAmount * input.discountValue) / 100) * 100) / 100;
    } else {
      discountAmount = input.discountValue;
    }

    const maxAllowedDiscount = invoice.patientPayableAmount > 0 ? invoice.patientPayableAmount : invoice.totalAmount;
    if (discountAmount > maxAllowedDiscount) {
      throw new AppError({
        message: `Discount amount (${discountAmount}) cannot exceed allowable invoice total (${maxAllowedDiscount}).`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const discountId = crypto.randomUUID();
    const now = new Date();
    const cleanReason = input.reason.trim();
    const cleanApprovedBy = input.approvedBy.trim();

    await runInTx(db, async (tx: any) => {
      await tx.insert(billingDiscounts).values({
        id: discountId,
        tenantId: input.tenantId,
        partnerId: invoice.partnerId,
        organizationId: invoice.organizationId,
        branchId: invoice.branchId,
        invoiceId: invoice.id,
        invoiceItemId: input.invoiceItemId || null,
        discountType: input.discountType,
        discountValue: input.discountValue.toString(),
        discountAmount: discountAmount.toString(),
        reason: cleanReason,
        approvedBy: cleanApprovedBy,
        createdBy: input.actorId || cleanApprovedBy,
        metadata: {
          appliedAt: now.toISOString(),
          hasSupervisorOverride: Boolean(input.supervisorOverrideToken)
        },
        createdAt: now
      } as any);

      const newDiscountTotal = (Number(invoice.discountTotal) || 0) + discountAmount;
      const newPatientPayable = Math.max(0, invoice.totalAmount - newDiscountTotal - (invoice.insuranceCoveredAmount || 0));
      const newBalanceDue = Math.max(0, newPatientPayable - (invoice.paidAmount || 0));

      await tx
        .update(billingInvoices)
        .set({
          discountTotal: newDiscountTotal.toFixed(2),
          dueAmount: newBalanceDue.toFixed(2),
          updatedAt: now
        } as any)
        .where(and(eq(billingInvoices.tenantId, input.tenantId), eq(billingInvoices.id, invoice.id)));

      invoice.discountTotal = newDiscountTotal;
      invoice.patientPayableAmount = newPatientPayable;
      invoice.balanceDue = newBalanceDue;
      invoice.updatedAt = now;
    });

    return {
      success: true,
      invoice,
      discountId,
      discountAmount
    };
  }
}

export const billingManagementRepository = new BillingManagementRepository();
