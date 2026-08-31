import {
  getDatabase,
  billingInvoices,
  billingInvoiceItems,
  billingPayments,
  billingReceipts,
  insuranceAuthorizations,
  eq,
  desc
} from '@docsearch/database';

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
  items: InvoiceLineItemInput[];
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

export interface StoredInvoiceItem {
  id: string;
  invoiceId: string;
  serviceName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  status: 'PENDING_PAYMENT' | 'PARTIALLY_PAID' | 'PAID' | 'DISCHARGE_SETTLED';
  items: StoredInvoiceItem[];
  preAuth: {
    preAuthNumber: string;
    payerName: string;
    policyNumber: string;
    requestedAmount: number;
    approvedAmount: number;
    coPayAmount: number;
    status: string;
    approvedAt: Date;
  } | null;
  payments: StoredPayment[];
  receiptNumber?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export class BillingManagementRepository {
  private memInvoices = new Map<string, StoredInvoice[]>();

  async getInvoices(tenantId: string, patientId?: string, status?: string, dbClient = getDatabase()): Promise<StoredInvoice[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(billingInvoices)
          .where(eq(billingInvoices.tenantId, tenantId))
          .orderBy(desc(billingInvoices.createdAt));
        if (rows.length > 0) {
          let list = rows as unknown as StoredInvoice[];
          if (patientId) list = list.filter(i => i.patientId === patientId);
          if (status) list = list.filter(i => i.status === status);
          return list;
        }
      } catch {
        // Fallback
      }
    }
    let list = this.memInvoices.get(tenantId) || [];
    if (patientId) list = list.filter(i => i.patientId === patientId);
    if (status) list = list.filter(i => i.status === status);
    return list;
  }

  async getInvoiceById(tenantId: string, invoiceId: string): Promise<StoredInvoice | null> {
    const list = this.memInvoices.get(tenantId) || [];
    return list.find(i => i.id === invoiceId) || null;
  }

  async createInvoice(input: CreateInvoiceInput, dbClient = getDatabase()): Promise<StoredInvoice> {
    const id = crypto.randomUUID();
    const now = new Date();
    const invoiceNumber = `INV-HOSP-${Math.floor(100000 + Math.random() * 900000)}`;

    const totalAmount = input.items.reduce((sum, item) => sum + item.totalPrice, 0);

    const items: StoredInvoiceItem[] = input.items.map(item => ({
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
      encounterType: input.encounterType || 'IPD',
      billingType: input.billingType,
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

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(billingInvoices).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          invoiceNumber: record.invoiceNumber,
          patientId: record.patientId,
          encounterId: record.encounterId,
          totalAmount: record.totalAmount,
          patientPayable: record.patientPayableAmount,
          insurancePayable: record.insuranceCoveredAmount,
          outstandingBalance: record.balanceDue,
          status: record.status,
          currency: 'INR'
        } as unknown as typeof billingInvoices.$inferInsert).returning();

        for (const item of items) {
          await dbClient.insert(billingInvoiceItems).values({
            id: item.id,
            tenantId: record.tenantId,
            partnerId: record.partnerId,
            organizationId: record.organizationId,
            branchId: record.branchId,
            invoiceId: record.id,
            description: item.serviceName,
            category: item.category,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          } as unknown as typeof billingInvoiceItems.$inferInsert);
        }

        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const current = this.memInvoices.get(input.tenantId) || [];
    current.unshift(record);
    this.memInvoices.set(input.tenantId, current);
    return record;
  }

  async recordInsurancePreAuth(input: RecordInsurancePreAuthInput, dbClient = getDatabase()): Promise<StoredInvoice | null> {
    const invoice = await this.getInvoiceById(input.tenantId, input.invoiceId);
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

    if (dbClient) {
      try {
        await dbClient.insert(insuranceAuthorizations).values({
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

        await dbClient
          .update(billingInvoices)
          .set({
            insurancePayable: invoice.insuranceCoveredAmount,
            patientPayable: invoice.patientPayableAmount,
            outstandingBalance: invoice.balanceDue
          } as unknown as typeof billingInvoices.$inferInsert)
          .where(eq(billingInvoices.id, invoice.id));
      } catch {
        // Fallback
      }
    }

    return invoice;
  }

  async collectPayment(input: CollectPaymentInput, dbClient = getDatabase()): Promise<{ invoice: StoredInvoice; receiptNumber: string }> {
    const invoice = await this.getInvoiceById(input.tenantId, input.invoiceId);
    if (!invoice) throw new Error('Invoice not found');

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
    invoice.paidAmount += input.amount;
    invoice.balanceDue = Math.max(0, invoice.patientPayableAmount - invoice.paidAmount);
    invoice.receiptNumber = receiptNumber;

    if (invoice.balanceDue === 0) {
      invoice.status = 'DISCHARGE_SETTLED';
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }
    invoice.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient.insert(billingPayments).values({
          id: paymentId,
          tenantId: input.tenantId,
          partnerId: invoice.partnerId,
          organizationId: invoice.organizationId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          amount: input.amount,
          paymentMethod: input.paymentMode,
          status: 'SUCCESS',
          paidAt: now
        } as unknown as typeof billingPayments.$inferInsert);

        await dbClient.insert(billingReceipts).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: invoice.partnerId,
          organizationId: invoice.organizationId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          receiptNumber,
          amount: input.amount,
          issuedAt: now
        } as unknown as typeof billingReceipts.$inferInsert);

        await dbClient
          .update(billingInvoices)
          .set({
            paidAmount: invoice.paidAmount,
            outstandingBalance: invoice.balanceDue,
            status: invoice.status
          } as unknown as typeof billingInvoices.$inferInsert)
          .where(eq(billingInvoices.id, invoice.id));
      } catch {
        // Fallback
      }
    }

    return { invoice, receiptNumber };
  }

  async getPatientBillingHistory(tenantId: string, patientId: string): Promise<StoredInvoice[]> {
    const list = this.memInvoices.get(tenantId) || [];
    return list.filter(i => i.patientId === patientId);
  }
}

export const billingManagementRepository = new BillingManagementRepository();
