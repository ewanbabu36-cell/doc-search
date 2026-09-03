import {
  billingManagementRepository,
  type CreateInvoiceInput,
  type RecordInsurancePreAuthInput,
  type CollectPaymentInput,
  type VoidInvoiceInput,
  type ApplyDiscountInput
} from '../../repositories/partner/BillingManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext, verifyRazorpaySignature, verifyPayUSignature } from '@docsearch/auth';
import type { RoleType } from '@docsearch/api-contracts';
import { withSecurityContext, getDatabase } from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('billing-management-service');

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

  async voidInvoice(
    input: Omit<VoidInvoiceInput, 'tenantId' | 'actorId' | 'actorRole'>,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await billingManagementRepository.voidInvoice(
        {
          ...input,
          tenantId: session.tenantId,
          actorId: session.userId,
          actorRole: session.roles?.[0] || 'STAFF'
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'INVOICE_VOIDED',
          resourceType: 'billing_invoice',
          resourceId: result.invoice.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: {
            invoiceNumber: result.invoice.invoiceNumber,
            voidReason: input.voidReason,
            supervisorUserId: input.supervisorUserId,
            hasSupervisorOverride: Boolean(input.supervisorOverrideToken),
            quarantinedPharmacyItems: result.quarantinedItemsCount,
            totalAmount: result.invoice.totalAmount,
            paidAmount: result.invoice.paidAmount
          }
        },
        session,
        tx
      );

      return result;
    });
  }

  async applyDiscount(
    input: Omit<ApplyDiscountInput, 'tenantId' | 'actorId'>,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await billingManagementRepository.applyDiscount(
        {
          ...input,
          tenantId: session.tenantId,
          actorId: session.userId
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'INVOICE_DISCOUNT_APPLIED',
          resourceType: 'billing_discount',
          resourceId: result.discountId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: {
            invoiceId: result.invoice.id,
            invoiceNumber: result.invoice.invoiceNumber,
            discountType: input.discountType,
            discountValue: input.discountValue,
            discountAmount: result.discountAmount,
            reason: input.reason,
            approvedBy: input.approvedBy,
            hasSupervisorOverride: Boolean(input.supervisorOverrideToken)
          }
        },
        session,
        tx
      );

      return result;
    });
  }

  async processRazorpayWebhook(
    rawBody: string | Buffer,
    signature: string,
    eventPayload: any,
    webhookSecret = process.env['RAZORPAY_WEBHOOK_SECRET'] || 'rzp_test_secret_key_123'
  ) {
    const isValid = verifyRazorpaySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      logger.warn('Razorpay webhook signature mismatch');
      throw new AppError({
        message: 'Invalid Razorpay webhook signature.',
        code: ErrorCode.UNAUTHORIZED,
        statusCode: 401
      });
    }

    const event = eventPayload?.event;
    logger.info('Received Razorpay webhook event', { event });

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = eventPayload?.payload?.payment?.entity;
      if (!paymentEntity) {
        throw new AppError({
          message: 'Malformed Razorpay webhook payload: missing payment entity.',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      const notes = paymentEntity.notes || {};
      const resolvedTenantId = notes.tenantId || '00000000-0000-4000-8000-000000000001';
      const systemSession: SessionContext = {
        sessionId: `session_webhook_rzp_${Date.now()}`,
        userId: 'usr_sys_webhook_razorpay',
        actorEmail: 'system.webhook@docsearch.internal',
        roles: ['SUPER_ADMIN'] as RoleType[],
        permissions: ['*'],
        dataScope: 'tenant',
        isSuperAdmin: true,
        tenantId: resolvedTenantId,
        organizationId: '00000000-0000-4000-8000-000000000002',
        branchId: '00000000-0000-4000-8000-000000000003'
      };

      return withSecurityContext(getDatabase(), systemSession, async (tx) => {
        const amountInRupees = (paymentEntity.amount || 0) / 100;
        const methodMap: Record<string, 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'ONLINE'> = {
          upi: 'UPI',
          card: 'CARD',
          credit_card: 'CARD',
          debit_card: 'CARD',
          netbanking: 'NET_BANKING',
          wallet: 'WALLET'
        };

        const result = await billingManagementRepository.reconcileWebhookPayment({
          tenantId: resolvedTenantId,
          invoiceId: notes.invoiceId || notes.invoice_id || paymentEntity.invoice_id,
          invoiceNumber: notes.invoiceNumber || notes.invoice_number,
          orderId: paymentEntity.order_id,
          gateway: 'RAZORPAY',
          gatewayPaymentId: paymentEntity.id,
          amount: amountInRupees,
          currency: paymentEntity.currency || 'INR',
          paymentMethod: methodMap[paymentEntity.method?.toLowerCase()] || 'UPI',
          status: 'SUCCESS',
          capturedAt: new Date((paymentEntity.created_at || Math.floor(Date.now() / 1000)) * 1000),
          metadata: {
            razorpayPaymentId: paymentEntity.id,
            razorpayOrderId: paymentEntity.order_id,
            email: paymentEntity.email,
            contact: paymentEntity.contact
          }
        }, tx);

        if (!result.isDuplicate) {
          await auditRepository.recordEvent({
            eventType: 'PAYMENT_RECONCILED_VIA_WEBHOOK',
            resourceType: 'billing_payment',
            resourceId: result.invoice.id,
            tenantId: resolvedTenantId,
            branchId: systemSession.branchId,
            metadata: {
              gateway: 'RAZORPAY',
              paymentId: paymentEntity.id,
              invoiceNumber: result.invoice.invoiceNumber,
              amount: amountInRupees,
              receiptNumber: result.receiptNumber
            }
          }, systemSession, tx);
        }

        return result;
      });
    }

    if (event === 'payment.failed') {
      const paymentEntity = eventPayload?.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const resolvedTenantId = notes.tenantId || '00000000-0000-4000-8000-000000000001';
      return billingManagementRepository.handleWebhookPaymentFailure({
        tenantId: resolvedTenantId,
        invoiceId: notes.invoiceId,
        invoiceNumber: notes.invoiceNumber,
        gateway: 'RAZORPAY',
        gatewayPaymentId: paymentEntity?.id,
        errorCode: paymentEntity?.error_code,
        errorDescription: paymentEntity?.error_description
      });
    }

    if (event === 'refund.processed') {
      const refundEntity = eventPayload?.payload?.refund?.entity;
      const notes = refundEntity?.notes || {};
      const resolvedTenantId = notes.tenantId || '00000000-0000-4000-8000-000000000001';
      return billingManagementRepository.handleWebhookRefund({
        tenantId: resolvedTenantId,
        invoiceId: notes.invoiceId,
        invoiceNumber: notes.invoiceNumber,
        gateway: 'RAZORPAY',
        gatewayPaymentId: refundEntity?.payment_id,
        gatewayRefundId: refundEntity?.id,
        amount: (refundEntity?.amount || 0) / 100,
        reason: refundEntity?.notes?.reason || 'Customer refund'
      });
    }

    return { success: true, message: `Event ${event} acknowledged.` };
  }

  async processPayUWebhook(
    payload: Record<string, unknown>,
    merchantSalt = process.env['PAYU_MERCHANT_SALT'] || 'payu_test_salt_key_123'
  ) {
    const isValid = verifyPayUSignature(payload, merchantSalt);
    if (!isValid) {
      logger.warn('PayU webhook signature mismatch');
      throw new AppError({
        message: 'Invalid PayU webhook signature.',
        code: ErrorCode.UNAUTHORIZED,
        statusCode: 401
      });
    }

    const status = ((payload['status'] as string) || '').toLowerCase();
    const resolvedTenantId = (payload['udf3'] as string) || '00000000-0000-4000-8000-000000000001';
    const systemSession: SessionContext = {
      sessionId: `session_webhook_payu_${Date.now()}`,
      userId: 'usr_sys_webhook_payu',
      actorEmail: 'system.webhook@docsearch.internal',
      roles: ['SUPER_ADMIN'] as RoleType[],
      permissions: ['*'],
      dataScope: 'tenant',
      isSuperAdmin: true,
      tenantId: resolvedTenantId,
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: '00000000-0000-4000-8000-000000000003'
    };

    if (status === 'success') {
      return withSecurityContext(getDatabase(), systemSession, async (tx) => {
        const amount = parseFloat((payload['amount'] as string) || '0');
        const gatewayPaymentId = (payload['mihpayid'] as string) || (payload['txnid'] as string);

        const result = await billingManagementRepository.reconcileWebhookPayment({
          tenantId: resolvedTenantId,
          invoiceId: payload['udf1'] as string,
          invoiceNumber: payload['udf2'] as string,
          gateway: 'PAYU',
          gatewayPaymentId,
          amount,
          currency: 'INR',
          paymentMethod: 'ONLINE',
          status: 'SUCCESS',
          metadata: payload
        }, tx);

        if (!result.isDuplicate) {
          await auditRepository.recordEvent({
            eventType: 'PAYMENT_RECONCILED_VIA_WEBHOOK',
            resourceType: 'billing_payment',
            resourceId: result.invoice.id,
            tenantId: resolvedTenantId,
            branchId: systemSession.branchId,
            metadata: {
              gateway: 'PAYU',
              paymentId: gatewayPaymentId,
              invoiceNumber: result.invoice.invoiceNumber,
              amount,
              receiptNumber: result.receiptNumber
            }
          }, systemSession, tx);
        }

        return result;
      });
    } else {
      return billingManagementRepository.handleWebhookPaymentFailure({
        tenantId: resolvedTenantId,
        invoiceId: payload['udf1'] as string,
        invoiceNumber: payload['udf2'] as string,
        gateway: 'PAYU',
        gatewayPaymentId: (payload['mihpayid'] as string) || (payload['txnid'] as string),
        errorCode: (payload['error_Message'] as string) || 'FAILED',
        errorDescription: payload['unmappedstatus'] as string
      });
    }
  }
}

export const billingManagementService = new BillingManagementService();
