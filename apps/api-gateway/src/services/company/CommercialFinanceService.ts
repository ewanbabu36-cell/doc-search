import {
  getDatabase,
  plans,
  priceVersions,
  subscriptions,
  licenses,
  partnerProfiles,
  invoices as companyInvoices,
  payments as companyPayments,
  companyAuditTraces,
  billingAccounts,
  eq,
  and,
  or,
  desc
} from '@docsearch/database';
import { type SessionContext } from '@docsearch/auth';
import { AppError } from '@docsearch/shared-core';
import crypto from 'node:crypto';

export interface CreatePriceVersionInput {
  planId: string;
  versionNumber: string;
  annualBasePriceInr: number;
  gstRatePercent?: number | undefined;
  sacCode?: string | undefined;
  taxInclusive?: boolean | undefined;
}

export interface RecordCommercialPaymentInput {
  amount: number;
  provider?: string | undefined;
  providerReference?: string | undefined;
  paymentMethod?: string | undefined;
  notes?: string | undefined;
}

export class CommercialFinanceService {
  async getPlanPricing(_session?: SessionContext, tx: any = getDatabase()) {
    const allPlans = await tx.select().from(plans).where(eq(plans.status, 'ACTIVE'));
    const allVersions = await tx.select().from(priceVersions).orderBy(desc(priceVersions.effectiveFrom));

    return allPlans.map((p: any) => {
      const versions = allVersions.filter((v: any) => v.planId === p.id);
      const activeVersion = versions.find((v: any) => v.isActive) || versions[0] || null;
      return {
        ...p,
        activePricing: activeVersion,
        priceHistory: versions
      };
    });
  }

  async createPriceVersion(input: CreatePriceVersionInput, session: SessionContext, tx: any = getDatabase()) {
    if (!session.isSuperAdmin && !(session.roles || []).includes('SUPER_ADMIN') && !(session.roles || []).includes('COMPANY_ADMIN')) {
      throw AppError.forbidden('Only DOC SEARCH HQ Super Admins can configure plan price versions');
    }

    const [plan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.id, input.planId))
      .limit(1);

    if (!plan) {
      throw AppError.notFound(`Plan ${input.planId} not found`);
    }

    // Deactivate previous active price versions for this plan
    await tx
      .update(priceVersions)
      .set({ isActive: false, status: 'ARCHIVED' })
      .where(and(eq(priceVersions.planId, input.planId), eq(priceVersions.isActive, true)));

    const [created] = await tx
      .insert(priceVersions)
      .values({
        planId: input.planId,
        productId: plan.productId,
        versionNumber: input.versionNumber.trim(),
        annualBasePriceInr: Math.round(input.annualBasePriceInr),
        currency: 'INR',
        gstRatePercent: input.gstRatePercent !== undefined ? input.gstRatePercent : 18,
        taxInclusive: input.taxInclusive !== undefined ? input.taxInclusive : true,
        sacCode: input.sacCode || '998313',
        isActive: true,
        status: 'ACTIVE',
        createdBy: session.userId || session.actorEmail || 'HQ_ADMIN'
      })
      .returning();

    await tx.insert(companyAuditTraces).values({
      id: crypto.randomUUID(),
      traceId: `trace_pv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      actorEmail: session.actorEmail || 'admin@docsearch.internal',
      action: 'PRICE_VERSION_CREATED',
      entityReference: `plan:${input.planId}:pv:${created.id}`,
      operationStatus: 'SUCCESS',
      occurredAt: new Date(),
      reason: `New price version ${created.versionNumber} for plan ${plan.name} at ₹${created.annualBasePriceInr}/yr`,
      metadata: { planId: input.planId, version: created.versionNumber, annualPrice: created.annualBasePriceInr }
    });

    return { ...created, basePrice: created.annualBasePriceInr };
  }

  async getCommercialInvoices(partnerId?: string, _session?: SessionContext, tx: any = getDatabase()) {
    const query = tx.select().from(companyInvoices);
    if (partnerId) {
      // Find billing account for partner
      const [acc] = await tx
        .select()
        .from(billingAccounts)
        .where(eq(billingAccounts.partnerId, partnerId))
        .limit(1);
      if (!acc) return [];
      return tx
        .select()
        .from(companyInvoices)
        .where(eq(companyInvoices.billingAccountId, acc.id))
        .orderBy(desc(companyInvoices.issueDate));
    }
    return query.orderBy(desc(companyInvoices.issueDate));
  }

  async generatePartnerInvoice(
    partnerId: string,
    planId: string,
    durationYears: number = 1,
    session: SessionContext,
    tx: any = getDatabase()
  ) {
    if (!session.isSuperAdmin && !(session.roles || []).includes('SUPER_ADMIN') && !(session.roles || []).includes('COMPANY_ADMIN')) {
      throw AppError.forbidden('Only DOC SEARCH HQ Super Admins can generate commercial partner invoices');
    }

    const [partner] = await tx
      .select()
      .from(partnerProfiles)
      .where(or(eq(partnerProfiles.id, partnerId), eq(partnerProfiles.tenantId, partnerId)))
      .limit(1);

    if (!partner) {
      throw AppError.notFound(`Partner profile ${partnerId} not found`);
    }

    const [plan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!plan) {
      throw AppError.notFound(`Plan ${planId} not found`);
    }

    // Lookup active price version
    const [priceVersion] = await tx
      .select()
      .from(priceVersions)
      .where(and(eq(priceVersions.planId, planId), eq(priceVersions.isActive, true)))
      .limit(1);

    const annualPrice = priceVersion ? parseFloat(priceVersion.annualBasePriceInr || '0') : 50000;
    const gstRate = priceVersion ? parseFloat(priceVersion.gstRatePercent || '18') : 18;
    const subtotal = Math.round(annualPrice * durationYears * 100) / 100;
    const taxAmount = Math.round((subtotal * (gstRate / 100)) * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    // Ensure Billing Account
    let billingAcc = (
      await tx
        .select()
        .from(billingAccounts)
        .where(eq(billingAccounts.partnerId, partner.id))
        .limit(1)
    )[0];

    if (!billingAcc) {
      const newAccId = crypto.randomUUID();
      await tx.insert(billingAccounts).values({
        id: newAccId,
        partnerId: partner.id,
        billingContactName: partner.primaryContactName || 'Commercial Partner',
        billingEmail: partner.primaryContactEmail || 'billing@partner.com',
        currency: 'INR',
        billingCycle: 'ANNUAL',
        status: 'ACTIVE'
      });
      billingAcc = (
        await tx
          .select()
          .from(billingAccounts)
          .where(eq(billingAccounts.id, newAccId))
          .limit(1)
      )[0];
    }

    const [existingSub] = await tx
      .select()
      .from(subscriptions)
      .where(or(eq(subscriptions.partnerId, partner.id), eq(subscriptions.partnerId, partnerId)))
      .limit(1);

    const invId = crypto.randomUUID();
    const invoiceNumber = `B2B-INV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const now = new Date();
    const dueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const [created] = await tx
      .insert(companyInvoices)
      .values({
        id: invId,
        billingAccountId: billingAcc?.id || crypto.randomUUID(),
        subscriptionId: existingSub?.id || null,
        invoiceNumber,
        issueDate: now,
        dueDate,
        currency: 'INR',
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        totalAmount: String(totalAmount),
        status: 'ISSUED',
        notes: `Subscription for ${plan.name} (${durationYears} Year) - SAC ${priceVersion?.sacCode || '998313'}`,
        metadata: {
          partnerId,
          planId,
          priceVersionId: priceVersion?.id,
          durationYears,
          gstRate
        }
      })
      .returning();

    await tx.insert(companyAuditTraces).values({
      id: crypto.randomUUID(),
      traceId: `trace_inv_gen_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      actorEmail: session.actorEmail || 'admin@docsearch.internal',
      action: 'COMMERCIAL_INVOICE_GENERATED',
      entityReference: `invoice:${created.id}`,
      operationStatus: 'SUCCESS',
      occurredAt: now,
      reason: `Commercial invoice ${invoiceNumber} generated for partner ${partnerId} (₹${totalAmount})`,
      metadata: { invoiceNumber, partnerId, totalAmount, durationYears }
    });

    return created;
  }

  async recordCommercialPayment(
    invoiceId: string,
    input: RecordCommercialPaymentInput,
    session: SessionContext,
    tx: any = getDatabase()
  ) {
    return this.recordCommercialPaymentAndExtendLicense(invoiceId, input, session, tx);
  }

  async recordCommercialPaymentAndExtendLicense(
    invoiceId: string,
    input: RecordCommercialPaymentInput,
    session: SessionContext,
    tx: any = getDatabase()
  ) {
    if (!session.isSuperAdmin && !(session.roles || []).includes('SUPER_ADMIN') && !(session.roles || []).includes('COMPANY_ADMIN')) {
      throw AppError.forbidden('Only DOC SEARCH HQ Super Admins can record commercial subscription payments');
    }

    const [invoice] = await tx
      .select()
      .from(companyInvoices)
      .where(eq(companyInvoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      throw AppError.notFound(`Commercial invoice ${invoiceId} not found`);
    }

    if (invoice.status === 'PAID') {
      throw AppError.badRequest('Invoice is already marked as PAID');
    }

    const paymentAmount = Math.round(input.amount * 100) / 100;
    if (paymentAmount <= 0) {
      throw AppError.badRequest('Payment amount must be greater than zero');
    }

    // 1. Insert Payment
    const paymentId = crypto.randomUUID();
    const [paymentRecord] = await tx
      .insert(companyPayments)
      .values({
        id: paymentId,
        invoiceId: invoice.id,
        amount: String(paymentAmount),
        currency: invoice.currency || 'INR',
        paymentStatus: 'SUCCEEDED',
        provider: input.provider || 'MANUAL_WIRE',
        providerReference: input.providerReference || `TXN-${Date.now()}`,
        paymentDate: new Date(),
        metadata: {
          receivedBy: session.userId || session.actorEmail,
          paymentMethod: input.paymentMethod || 'BANK_TRANSFER',
          notes: input.notes
        }
      })
      .returning();

    // 2. Mark Invoice as PAID
    const [updatedInvoice] = await tx
      .update(companyInvoices)
      .set({
        status: 'PAID',
        updatedAt: new Date()
      })
      .where(eq(companyInvoices.id, invoice.id))
      .returning();

    // 3. Atomically Extend Subscription & License if linked
    let extendedSubscription = null;
    let extendedLicense = null;

    if (invoice.subscriptionId) {
      const [sub] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, invoice.subscriptionId))
        .limit(1);

      if (sub) {
        const now = new Date();
        const invDurationYears = Number((invoice.metadata as any)?.durationYears) || 1;
        const durationDays = invDurationYears * 365;
        const currentEnd = sub.endDate && new Date(sub.endDate) > now ? new Date(sub.endDate) : now;
        const newEndDate = new Date(currentEnd.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const [upSub] = await tx
          .update(subscriptions)
          .set({
            status: 'ACTIVE',
            endDate: newEndDate,
            renewalDate: newEndDate,
            updatedAt: now
          })
          .where(eq(subscriptions.id, sub.id))
          .returning();
        extendedSubscription = upSub;

        // Extend License
        let [lic] = await tx
          .select()
          .from(licenses)
          .where(eq(licenses.subscriptionId, sub.id))
          .limit(1);

        if (!lic) {
          [lic] = await tx
            .select()
            .from(licenses)
            .where(or(eq(licenses.partnerId, sub.partnerId), eq(licenses.tenantId, sub.partnerId)))
            .limit(1);
        }

        if (lic) {
          const newGrace = new Date(newEndDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          const { licenseService } = await import('./LicenseService.js');
          const { entitlementService } = await import('./EntitlementService.js');
          const newSignature = licenseService.signLicensePayload({
            licenseKey: lic.licenseKey,
            partnerId: lic.partnerId,
            tenantId: lic.tenantId,
            subscriptionId: lic.subscriptionId,
            planId: lic.planId,
            expiryDate: newEndDate.toISOString()
          });
          const [upLic] = await tx
            .update(licenses)
            .set({
              status: 'ACTIVE',
              activationStatus: 'ACTIVATED',
              expiryDate: newEndDate,
              gracePeriodEnd: newGrace,
              signature: newSignature
            })
            .where(eq(licenses.id, lic.id))
            .returning();
          extendedLicense = upLic;
          if (lic.tenantId) {
            entitlementService.invalidateTenantCache(lic.tenantId);
          }
        }
      }
    }

    // 4. Audit
    await tx.insert(companyAuditTraces).values({
      id: crypto.randomUUID(),
      traceId: `trace_com_pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      actorEmail: session.actorEmail || 'admin@docsearch.internal',
      action: 'COMMERCIAL_PAYMENT_AND_LICENSE_EXTENDED',
      entityReference: `invoice:${invoice.id}:payment:${paymentRecord.id}`,
      operationStatus: 'SUCCESS',
      occurredAt: new Date(),
      reason: `Commercial payment ₹${paymentAmount} verified. License and subscription extended to ${extendedSubscription?.endDate || 'N/A'}.`,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        paymentAmount,
        subscriptionId: invoice.subscriptionId,
        newExpiryDate: extendedSubscription?.endDate
      }
    });

    return {
      invoice: updatedInvoice,
      payment: paymentRecord,
      subscription: extendedSubscription,
      license: extendedLicense
    };
  }

  async getCommercialRevenueDashboard(_session?: SessionContext, tx: any = getDatabase()) {
    const allPartners = await tx.select().from(partnerProfiles);
    const allSubs = await tx.select().from(subscriptions);
    const allPayments = await tx.select().from(companyPayments).where(eq(companyPayments.paymentStatus, 'SUCCEEDED'));
    const allInvoices = await tx.select().from(companyInvoices);

    const now = new Date();
    let totalRevenue = 0;
    for (const p of allPayments) {
      totalRevenue += parseFloat(p.amount || '0');
    }

    let activeSubsCount = 0;
    let pendingRenewalCount = 0;
    let expiredSubsCount = 0;
    let arr = 0;

    for (const s of allSubs) {
      if (s.status === 'ACTIVE') {
        activeSubsCount++;
        // Check if within 30 days of renewal
        if (s.renewalDate) {
          const daysToRenewal = Math.floor((new Date(s.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysToRenewal <= 30 && daysToRenewal >= 0) {
            pendingRenewalCount++;
          }
        }
      } else if (s.status === 'EXPIRED') {
        expiredSubsCount++;
      }
    }

    // Calculate ARR from active commercial subscriptions
    for (const inv of allInvoices) {
      if (inv.status === 'PAID') {
        arr += parseFloat(inv.totalAmount || '0');
      }
    }

    return {
      totalPartnersCount: allPartners.length,
      activeSubscriptionsCount: activeSubsCount,
      pendingRenewalsCount: pendingRenewalCount,
      expiredSubscriptionsCount: expiredSubsCount,
      annualRecurringRevenueInr: Math.round(arr * 100) / 100,
      grossCommercialRevenue: Math.round(arr * 100) / 100,
      totalB2BCollectionsInr: Math.round(totalRevenue * 100) / 100,
      totalCollectedRevenue: Math.round(totalRevenue * 100) / 100,
      invoicesTotalCount: allInvoices.length,
      paymentsTotalCount: allPayments.length
    };
  }
}

export const commercialFinanceService = new CommercialFinanceService();
