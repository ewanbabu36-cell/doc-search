import {
  billingManagementRepository,
  type CreateInvoiceInput,
  type RecordInsurancePreAuthInput,
  type CollectPaymentInput,
  type VoidInvoiceInput,
  type ApplyDiscountInput,
  type ProcessRefundInput
} from '../../repositories/partner/BillingManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext, ScopeGuard, RBACEvaluator, verifyRazorpaySignature, verifyPayUSignature } from '@docsearch/auth';
import type { RoleType } from '@docsearch/api-contracts';
import {
  withSecurityContext,
  getDatabase,
  commercialOrderSnapshots,
  partnerProfiles,
  subscriptions,
  licenses,
  billingAccounts,
  invoices as companyInvoices,
  payments as companyPayments,
  companyAuditTraces,
  eq
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { licenseService } from '../company/LicenseService.js';
import { cashierShiftService } from './CashierShiftService.js';

const logger = createLogger('billing-management-service');

export class BillingManagementService {
  async getFinancialOverview(
    session: SessionContext,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return billingManagementRepository.getFinancialOverview(scope.tenantId, scope.branchId, tx);
    });
  }

  async getInvoices(
    session: SessionContext,
    patientId?: string,
    status?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return billingManagementRepository.getInvoices(
        scope.tenantId,
        patientId,
        status,
        tx,
        { branchId: scope.branchId, departmentId: scope.departmentId }
      );
    });
  }

  async getInvoiceById(
    session: SessionContext,
    id: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return billingManagementRepository.getInvoiceById(
        scope.tenantId,
        id,
        tx,
        { branchId: scope.branchId, departmentId: scope.departmentId }
      );
    });
  }

  async createInvoice(input: Omit<CreateInvoiceInput, 'tenantId'> & { tenantId?: string; departmentId?: string }, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const invoice = await billingManagementRepository.createInvoice({
        ...input,
        tenantId: scope.tenantId,
        ...(scope.branchId ? { branchId: scope.branchId } : {})
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'INVOICE_GENERATED',
        resourceType: 'billing_invoice',
        resourceId: invoice.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
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

      if (input.paymentMode === 'CASH') {
        try {
          await cashierShiftService.recordShiftMovement({ cashReceived: input.amount }, session, tx);
        } catch {}
      }

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

  async processRefund(
    input: Omit<ProcessRefundInput, 'tenantId' | 'actorId'>,
    session: SessionContext
  ) {
    // 1. Separation of duties: Check refund permission or supervisor override token
    if (!session.isSuperAdmin) {
      const canRefund = RBACEvaluator.hasPermission(session, 'billing:invoices', 'refund') ||
                        RBACEvaluator.hasPermission(session, 'billing:refund', 'approve') ||
                        RBACEvaluator.hasPermission(session, 'billing:invoices', 'update') ||
                        Boolean(input.supervisorOverrideToken);
      if (!canRefund) {
        throw new AppError({
          message: 'Access denied: Insufficient permissions to issue refunds on invoices. billing:invoices:refund or supervisorOverrideToken required.',
          code: ErrorCode.INSUFFICIENT_PERMISSIONS,
          statusCode: 403
        });
      }

      // 2. Separation of duties: Cashier cannot be the approving supervisor for their own refund
      if (input.supervisorUserId && input.supervisorUserId === session.userId) {
        throw new AppError({
          message: 'Separation of duties violation: Cashier cannot self-approve their own refund as supervisor.',
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
    }

    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await billingManagementRepository.processRefund(
        {
          ...input,
          tenantId: session.tenantId,
          actorId: session.userId
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'REFUND_PROCESSED',
          resourceType: 'billing_refund',
          resourceId: result.refundId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: {
            refundNumber: result.refundNumber,
            invoiceId: result.invoice.id,
            invoiceNumber: result.invoice.invoiceNumber,
            amount: result.amount,
            reason: input.reason,
            supervisorUserId: input.supervisorUserId,
            hasSupervisorOverride: Boolean(input.supervisorOverrideToken),
            newPaidAmount: result.invoice.paidAmount,
            newDueAmount: result.invoice.balanceDue
          }
        },
        session,
        tx
      );

      try {
        await cashierShiftService.recordShiftMovement({ cashRefunded: input.amount }, session, tx);
      } catch {}

      return result;
    });
  }

  async processRazorpayWebhook(
    rawBody: string | Buffer,
    signature: string,
    eventPayload: any,
    webhookSecret = process.env['RAZORPAY_WEBHOOK_SECRET']
  ) {
    if (!webhookSecret) {
      throw new AppError({
        message: 'Server missing RAZORPAY_WEBHOOK_SECRET configuration.',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500
      });
    }
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
      const snapshotId = notes.orderSnapshotId || notes.snapshotId;
      if (snapshotId) {
        return this.processB2BCommercialWebhookPayment(paymentEntity, snapshotId);
      }

      const resolvedTenantId = notes.tenantId || notes.tenant_id;
      if (!resolvedTenantId || typeof resolvedTenantId !== 'string' || !resolvedTenantId.trim()) {
        throw new AppError({
          message: 'Payment webhook rejected: Missing mandatory tenantId in payment notes.',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
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
      const resolvedTenantId = notes.tenantId || notes.tenant_id;
      if (!resolvedTenantId || typeof resolvedTenantId !== 'string' || !resolvedTenantId.trim()) {
        throw new AppError({
          message: 'Payment webhook rejected: Missing mandatory tenantId in payment notes.',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
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
      const resolvedTenantId = notes.tenantId || notes.tenant_id;
      if (!resolvedTenantId || typeof resolvedTenantId !== 'string' || !resolvedTenantId.trim()) {
        throw new AppError({
          message: 'Payment webhook rejected: Missing mandatory tenantId in refund notes.',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
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
    merchantSalt = process.env['PAYU_MERCHANT_SALT']
  ) {
    if (!merchantSalt) {
      throw new AppError({
        message: 'Server missing PAYU_MERCHANT_SALT configuration.',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500
      });
    }
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
    const resolvedTenantId = (payload['udf3'] as string) || (payload['tenantId'] as string) || (payload['tenant_id'] as string);
    if (!resolvedTenantId || typeof resolvedTenantId !== 'string' || !resolvedTenantId.trim()) {
      throw new AppError({
        message: 'Payment webhook rejected: Missing mandatory tenantId in PayU payload (udf3).',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }
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

  async processB2BCommercialWebhookPayment(paymentEntity: any, snapshotId: string) {
    const db = getDatabase();
    const existingSnapshots = await db
      .select()
      .from(commercialOrderSnapshots)
      .where(eq(commercialOrderSnapshots.id, snapshotId))
      .limit(1);

    if (!existingSnapshots[0]) {
      logger.warn(`B2B Webhook: Snapshot ${snapshotId} not found`);
      throw AppError.notFound(`Commercial order snapshot ${snapshotId} not found`);
    }

    const snapshot = existingSnapshots[0];
    if (snapshot.status === 'PAID') {
      logger.info(`B2B Webhook: Snapshot ${snapshotId} already processed (idempotent duplicate acknowledged)`);
      return {
        isDuplicate: true,
        status: 'ALREADY_PROCESSED',
        snapshotId: snapshot.id
      };
    }

    // 1. Expected Amount Verification (Paise)
    const expectedAmountPaise = Math.round(snapshot.finalAmountInr * 100);
    if (paymentEntity.amount != null && paymentEntity.amount !== expectedAmountPaise) {
      logger.warn(`B2B Webhook: Amount mismatch for snapshot ${snapshotId}: expected ${expectedAmountPaise}, got ${paymentEntity.amount}`);
      throw AppError.badRequest(`Payment amount mismatch: expected ₹${snapshot.finalAmountInr} (${expectedAmountPaise} paise), received ${paymentEntity.amount} paise`);
    }

    // 2. Expected Currency Verification
    if (paymentEntity.currency && paymentEntity.currency.toUpperCase() !== snapshot.currency.toUpperCase()) {
      logger.warn(`B2B Webhook: Currency mismatch for snapshot ${snapshotId}: expected ${snapshot.currency}, got ${paymentEntity.currency}`);
      throw AppError.badRequest(`Payment currency mismatch: expected ${snapshot.currency}, received ${paymentEntity.currency}`);
    }

    // 3. Lookup partner profile & verify ownership
    const partners = await db
      .select()
      .from(partnerProfiles)
      .where(eq(partnerProfiles.id, snapshot.partnerId))
      .limit(1);

    const partner = partners[0];
    if (!partner || partner.id !== snapshot.partnerId) {
      throw AppError.notFound(`Partner ${snapshot.partnerId} not found or ownership mismatch`);
    }

    // 4. Order ID verification if snapshot has razorpayOrderId
    const expectedOrderId = (snapshot.metadata as any)?.razorpayOrderId;
    if (expectedOrderId && paymentEntity.order_id && paymentEntity.order_id !== expectedOrderId) {
      logger.warn(`B2B Webhook: Order ID mismatch: expected ${expectedOrderId}, got ${paymentEntity.order_id}`);
      throw AppError.badRequest(`Payment order ID mismatch with snapshot`);
    }

    // 5. System Session for Transaction-Safe Atomic Settlement
    const systemSession: SessionContext = {
      sessionId: `session_webhook_b2b_${Date.now()}`,
      userId: 'usr_sys_webhook_commercial',
      actorEmail: 'system.webhook@docsearch.internal',
      roles: ['SUPER_ADMIN'] as RoleType[],
      permissions: ['*'],
      dataScope: 'tenant',
      isSuperAdmin: true,
      tenantId: partner.tenantId,
      organizationId: partner.tenantId,
      branchId: '00000000-0000-4000-8000-000000000003'
    };

    return withSecurityContext(db, systemSession, async (tx) => {
      // 1. Mark snapshot as PAID
      await tx
        .update(commercialOrderSnapshots)
        .set({
          status: 'PAID',
          metadata: {
            ...((snapshot.metadata as any) || {}),
            paidAt: new Date().toISOString(),
            gatewayPaymentId: paymentEntity.id,
            gatewayOrderId: paymentEntity.order_id
          },
          updatedAt: new Date()
        })
        .where(eq(commercialOrderSnapshots.id, snapshot.id));

      // 2. Ensure Billing Account exists
      let billingAcc = (
        await tx
          .select()
          .from(billingAccounts)
          .where(eq(billingAccounts.partnerId, snapshot.partnerId))
          .limit(1)
      )[0];

      if (!billingAcc) {
        const newBillingAccId = crypto.randomUUID();
        await tx.insert(billingAccounts).values({
          id: newBillingAccId,
          partnerId: snapshot.partnerId,
          billingContactName: partner?.primaryContactName || 'Finance Officer',
          billingEmail: partner?.primaryContactEmail || paymentEntity.email || 'billing@docsearch.internal',
          currency: 'INR',
          billingCycle: 'ANNUAL',
          status: 'ACTIVE'
        });
        billingAcc = (
          await tx
            .select()
            .from(billingAccounts)
            .where(eq(billingAccounts.id, newBillingAccId))
            .limit(1)
        )[0];
      }

      // 3. Lookup Partner Subscription
      const existingSubs = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.partnerId, snapshot.partnerId))
        .limit(1);

      // 4. Create B2B Invoice
      const invId = crypto.randomUUID();
      const invNumber = `INV-DOC-${Date.now()}`;
      await tx.insert(companyInvoices).values({
        id: invId,
        billingAccountId: billingAcc ? billingAcc.id : crypto.randomUUID(),
        subscriptionId: existingSubs[0]?.id || null,
        invoiceNumber: invNumber,
        issueDate: new Date(),
        dueDate: new Date(),
        currency: 'INR',
        subtotal: String(snapshot.taxableAmountInr),
        taxAmount: String(snapshot.cgstAmountInr + snapshot.sgstAmountInr + snapshot.igstAmountInr),
        totalAmount: String(snapshot.finalAmountInr),
        status: 'PAID',
        notes: `Subscription Renewal (${snapshot.billingDurationYears} Year) - SAC 998313`,
        metadata: {
          snapshotId: snapshot.id,
          partnerId: snapshot.partnerId,
          durationYears: snapshot.billingDurationYears,
          cgst: snapshot.cgstAmountInr,
          sgst: snapshot.sgstAmountInr,
          igst: snapshot.igstAmountInr,
          customerGstin: snapshot.customerGstin
        }
      });

      // 5. Create B2B Payment Record
      const payId = crypto.randomUUID();
      await tx.insert(companyPayments).values({
        id: payId,
        invoiceId: invId,
        amount: String(snapshot.finalAmountInr),
        currency: 'INR',
        paymentStatus: 'SUCCEEDED',
        provider: 'RAZORPAY',
        providerReference: paymentEntity.id,
        paymentDate: new Date(),
        metadata: {
          razorpayPaymentId: paymentEntity.id,
          razorpayOrderId: paymentEntity.order_id,
          method: paymentEntity.method
        }
      });

      // 6. Extend or Activate Subscription (Active Extension Invariant)
      const now = new Date();
      const durationDays = snapshot.billingDurationYears * 365;
      let newEndDate: Date;

      if (existingSubs[0] && existingSubs[0].endDate && new Date(existingSubs[0].endDate) > now) {
        newEndDate = new Date(new Date(existingSubs[0].endDate).getTime() + durationDays * 24 * 60 * 60 * 1000);
      } else {
        newEndDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }

      if (existingSubs[0]) {
        await tx
          .update(subscriptions)
          .set({
            planId: snapshot.planId,
            status: 'ACTIVE',
            endDate: newEndDate,
            renewalDate: newEndDate,
            updatedAt: now,
            metadata: {
              ...((existingSubs[0].metadata as any) || {}),
              lastRenewedAt: now.toISOString(),
              lastPaymentId: paymentEntity.id,
              durationYears: snapshot.billingDurationYears
            }
          })
          .where(eq(subscriptions.id, existingSubs[0].id));
      }

      // 7. Extend License
      const existingLics = await tx
        .select()
        .from(licenses)
        .where(eq(licenses.partnerId, snapshot.partnerId))
        .limit(1);

      if (existingLics[0]) {
        const newSignature = licenseService.signLicensePayload({
          licenseKey: existingLics[0].licenseKey,
          partnerId: existingLics[0].partnerId,
          tenantId: existingLics[0].tenantId,
          subscriptionId: existingLics[0].subscriptionId,
          planId: snapshot.planId || existingLics[0].planId,
          expiryDate: newEndDate.toISOString()
        });

        await tx
          .update(licenses)
          .set({
            status: 'ACTIVE',
            expiryDate: newEndDate,
            gracePeriodEnd: new Date(newEndDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            signature: newSignature,
            updatedAt: now,
            metadata: {
              ...((existingLics[0].metadata as any) || {}),
              lastRenewedAt: now.toISOString(),
              lastPaymentId: paymentEntity.id
            }
          })
          .where(eq(licenses.id, existingLics[0].id));
      }

      // 8. Audit Record
      await tx.insert(companyAuditTraces).values({
        id: crypto.randomUUID(),
        traceId: `trace_b2b_wh_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        actorEmail: 'system.webhook@docsearch.internal',
        action: 'COMMERCIAL_ORDER_SETTLED',
        entityReference: `SNAPSHOT:${snapshot.id}`,
        operationStatus: 'SUCCESS',
        occurredAt: new Date(),
        reason: `B2B Webhook payment settled: ₹${snapshot.finalAmountInr} for ${snapshot.billingDurationYears} Year renewal`,
        metadata: {
          snapshotId: snapshot.id,
          partnerId: snapshot.partnerId,
          paymentId: paymentEntity.id,
          orderId: paymentEntity.order_id,
          newExpiryDate: newEndDate.toISOString()
        }
      });

      logger.info(`B2B Webhook successfully extended subscription & license for partner ${snapshot.partnerId}`);
      return {
        success: true,
        partnerId: snapshot.partnerId,
        invoiceNumber: invNumber,
        newExpiryDate: newEndDate.toISOString(),
        durationYears: snapshot.billingDurationYears
      };
    });
  }

  // =========================================================================
  // Dynamic UPI Soundbox & Instant Reconciliation Engine
  // =========================================================================
  private readonly upiTransactions = new Map<
    string,
    {
      txnRef: string;
      invoiceId: string;
      invoiceNumber: string;
      patientId?: string | undefined;
      patientName?: string | undefined;
      amount: number;
      currency: 'INR';
      vpa: string;
      merchantName: string;
      upiUri: string;
      qrPayloadBase64: string;
      status: 'PENDING' | 'PAID_CONFIRMED' | 'FAILED';
      tenantId: string;
      branchId?: string | undefined;
      createdAt: string;
      expiresAt: string;
      settledAt?: string | undefined;
    }
  >();

  async generateDynamicUpiQr(
    session: SessionContext,
    input: { invoiceId: string; amount?: number; note?: string }
  ) {
    const invoice = await this.getInvoiceById(session, input.invoiceId);
    if (!invoice) {
      throw AppError.notFound(`Invoice ${input.invoiceId} not found`);
    }

    const payAmount = input.amount ?? Number(invoice.balanceDue || invoice.totalAmount);
    if (payAmount <= 0) {
      throw AppError.badRequest('Invoice has zero balance due');
    }

    const txnRef = `UPI-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const vpa = env.UPI_VPA || 'docsearch.hospital@icici';
    const merchantName = env.UPI_MERCHANT_NAME || 'DocSearch Multispeciality Hospital';
    const invoiceNumber = invoice.invoiceNumber || 'INV-001';
    const note = input.note || `Bill ${invoiceNumber}`;

    // NPCI Compliant UPI Deep Link
    const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchantName)}&am=${payAmount.toFixed(2)}&cu=INR&tr=${txnRef}&tn=${encodeURIComponent(note)}`;
    const qrPayloadBase64 = Buffer.from(upiUri).toString('base64');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    const record = {
      txnRef,
      invoiceId: input.invoiceId,
      invoiceNumber,
      patientId: (invoice as any).patientId,
      patientName: (invoice as any).patientName,
      amount: payAmount,
      currency: 'INR' as const,
      vpa,
      merchantName,
      upiUri,
      qrPayloadBase64,
      status: 'PENDING' as const,
      tenantId: session.tenantId,
      branchId: session.branchId,
      createdAt: now.toISOString(),
      expiresAt
    };

    this.upiTransactions.set(txnRef, record);

    logger.info(`Generated Dynamic UPI QR for Invoice ${invoiceNumber} (₹${payAmount}, Ref: ${txnRef})`);

    return record;
  }

  getUpiPaymentStatus(txnRef: string) {
    const txn = this.upiTransactions.get(txnRef);
    if (!txn) {
      return {
        txnRef,
        status: 'UNKNOWN_OR_EXPIRED',
        message: 'No active UPI transaction found for reference'
      };
    }
    return txn;
  }

  async processSoundboxWebhook(payload: {
    txnRef: string;
    amount: number;
    payerVpa?: string | undefined;
    status: 'SUCCESS' | 'FAILURE';
    soundboxDeviceId?: string | undefined;
  }) {
    const txn = this.upiTransactions.get(payload.txnRef);
    if (!txn) {
      logger.warn(`Soundbox Webhook: Unknown transaction reference ${payload.txnRef}`);
      return {
        status: 'IGNORED',
        message: 'Transaction reference not found in active UPI cache'
      };
    }

    if (payload.status !== 'SUCCESS') {
      txn.status = 'FAILED';
      return {
        status: 'FAILED',
        txnRef: payload.txnRef,
        message: 'Payment notification indicated non-success status'
      };
    }

    if (txn.status === 'PAID_CONFIRMED') {
      return {
        status: 'ALREADY_SETTLED',
        txnRef: payload.txnRef,
        settledAt: txn.settledAt
      };
    }

    // Auto-reconcile and settle the invoice atomically
    const systemSession: SessionContext = {
      sessionId: `session_soundbox_${Date.now()}`,
      userId: 'usr_sys_upi_soundbox',
      actorEmail: 'soundbox.webhook@docsearch.internal',
      roles: ['SUPER_ADMIN'] as RoleType[],
      permissions: ['*'],
      dataScope: 'tenant',
      isSuperAdmin: true,
      tenantId: txn.tenantId,
      organizationId: txn.tenantId,
      branchId: txn.branchId || '00000000-0000-4000-8000-000000000003'
    };

    try {
      await this.collectPayment(
        {
          invoiceId: txn.invoiceId,
          patientId: txn.patientId || 'pat_upi_direct',
          amount: payload.amount || txn.amount,
          paymentMode: 'UPI',
          transactionReference: payload.txnRef
        },
        systemSession
      );

      txn.status = 'PAID_CONFIRMED';
      txn.settledAt = new Date().toISOString();

      const announcement = `Rupees ${payload.amount || txn.amount} received successfully for invoice ${txn.invoiceNumber} on DocSearch UPI`;
      logger.info(`🔊 SOUNDBOX AUDIO BROADCAST: "${announcement}"`);

      return {
        status: 'PAID_CONFIRMED',
        txnRef: payload.txnRef,
        invoiceId: txn.invoiceId,
        invoiceNumber: txn.invoiceNumber,
        amount: payload.amount || txn.amount,
        soundboxVoicePrompt: announcement,
        settledAt: txn.settledAt
      };
    } catch (err: any) {
      logger.error(`Soundbox instant settlement failed for ${payload.txnRef}`, err);
      throw AppError.internal(`Soundbox settlement error: ${err?.message || err}`);
    }
  }
}

export const billingManagementService = new BillingManagementService();
