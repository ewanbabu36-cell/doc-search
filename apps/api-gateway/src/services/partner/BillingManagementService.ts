import {
  billingManagementRepository,
  type CreateInvoiceInput,
  type RecordInsurancePreAuthInput,
  type CollectPaymentInput
} from '../../repositories/partner/BillingManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class BillingManagementService {
  async getInvoices(session: SessionContext, patientId?: string, status?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return billingManagementRepository.getInvoices(session.tenantId, patientId, status, tx);
    });
  }

  async createInvoice(input: Omit<CreateInvoiceInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const invoice = await billingManagementRepository.createInvoice({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'INVOICE_GENERATED',
        resourceType: 'billing_invoice',
        resourceId: invoice.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { invoiceNumber: invoice.invoiceNumber, patientId: invoice.patientId, totalAmount: invoice.totalAmount }
      }, session, tx);

      return invoice;
    });
  }

  async recordInsurancePreAuth(input: Omit<RecordInsurancePreAuthInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const invoice = await billingManagementRepository.recordInsurancePreAuth({
        ...input,
        tenantId: session.tenantId
      }, tx);

      if (invoice) {
        await auditRepository.recordEvent({
          eventType: 'PREAUTH_APPROVED',
          resourceType: 'insurance_authorization',
          resourceId: invoice.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { invoiceNumber: invoice.invoiceNumber, preAuthNumber: input.preAuthNumber, approvedAmount: input.approvedAmount }
        }, session, tx);
      }

      return invoice;
    });
  }

  async collectPayment(input: Omit<CollectPaymentInput, 'tenantId' | 'collectedBy'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await billingManagementRepository.collectPayment({
        ...input,
        tenantId: session.tenantId,
        collectedBy: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'PAYMENT_COLLECTED',
        resourceType: 'billing_payment',
        resourceId: result.invoice.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          invoiceNumber: result.invoice.invoiceNumber,
          receiptNumber: result.receiptNumber,
          amountPaid: input.amount,
          balanceRemaining: result.invoice.balanceDue
        }
      }, session, tx);

      return result;
    });
  }

  async getPatientBillingHistory(session: SessionContext, patientId: string) {
    return withSecurityContext(getDatabase(), session, async () => {
      return billingManagementRepository.getPatientBillingHistory(session.tenantId, patientId);
    });
  }
}

export const billingManagementService = new BillingManagementService();
