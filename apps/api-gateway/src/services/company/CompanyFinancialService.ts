import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import {
  getDatabase,
  companyAuditTraces,
  partnerProfiles,
  eq
} from '@docsearch/database';
import { type SessionContext } from '@docsearch/auth';
import { AppError } from '@docsearch/shared-core';
import { commercialFinanceService } from './CommercialFinanceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, '../../../data/company_financial_config.json');
const PAYMENTS_FILE = path.resolve(__dirname, '../../../data/partner_subscription_payments.json');

export interface CompanyCorporateFinancialConfig {
  legalEntityName: string;
  tradeName: string;
  bankName: string;
  branchName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'CURRENT' | 'ESCROW';
  businessUpiId: string;
  secondaryUpiId?: string | undefined;
  gstin: string;
  pan: string;
  cinNumber?: string | undefined;
  billingEmail: string;
  billingPhone: string;
  registeredAddress: {
    line1: string;
    line2?: string | undefined;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  supportedCurrencies: string[];
  paymentModes: {
    upiInstantQr: boolean;
    neftRtgsImps: boolean;
    cardNetbanking: boolean;
  };
  saasPaymentInstructions: string;
  autoReconciliation: boolean;
  lastUpdatedAt: string;
  updatedBy: string;
}

export interface PartnerSubscriptionPaymentProof {
  id: string;
  partnerId: string;
  tenantId?: string | undefined;
  partnerName: string;
  planId: string;
  planName: string;
  planCode: string;
  durationYears: number;
  payableAmountInr: number;
  paymentMethod: 'UPI' | 'NEFT_RTGS_IMPS' | 'CARD_ONLINE';
  utrNumber: string;
  payerUpiOrAccount?: string | undefined;
  partnerRemarks?: string | undefined;
  paymentDate: string;
  submittedAt: string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  verifiedAt?: string | undefined;
  verifiedBy?: string | undefined;
  rejectionReason?: string | undefined;
  invoiceId?: string | undefined;
}

export interface SubmitPaymentProofInput {
  partnerId: string;
  planId: string;
  planName?: string | undefined;
  planCode?: string | undefined;
  durationYears?: number | undefined;
  payableAmountInr: number;
  paymentMethod: 'UPI' | 'NEFT_RTGS_IMPS' | 'CARD_ONLINE';
  utrNumber: string;
  payerUpiOrAccount?: string | undefined;
  partnerRemarks?: string | undefined;
  invoiceId?: string | undefined;
}

const DEFAULT_CONFIG: CompanyCorporateFinancialConfig = {
  legalEntityName: 'DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED',
  tradeName: 'DocSearch Platform HQ',
  bankName: 'HDFC Bank Ltd',
  branchName: 'Bandra Kurla Complex, Mumbai',
  accountHolderName: 'DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED',
  accountNumber: '50200084920192',
  ifscCode: 'HDFC0000240',
  accountType: 'CURRENT',
  businessUpiId: 'docsearch.billing@hdfcbank',
  secondaryUpiId: 'docsearch.saas@icici',
  gstin: '27AABCD1234E1Z5',
  pan: 'AABCD1234E',
  cinNumber: 'U72900MH2024PTC123456',
  billingEmail: 'billing@docsearch.health',
  billingPhone: '+91 1800 200 4000',
  registeredAddress: {
    line1: 'Unit 802, One International Center, Tower 2',
    line2: 'Senapati Bapat Marg, Prabhadevi',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    country: 'India'
  },
  supportedCurrencies: ['INR'],
  paymentModes: {
    upiInstantQr: true,
    neftRtgsImps: true,
    cardNetbanking: true
  },
  saasPaymentInstructions: 'Authoritative Corporate Account for DocSearch SaaS Subscriptions & Plan Upgrades only. All patient OPD consultation, lab testing, and pharmacy collections remain isolated in each partner hospital/clinic account.',
  autoReconciliation: true,
  lastUpdatedAt: new Date().toISOString(),
  updatedBy: 'SYSTEM_DEFAULT'
};

export class CompanyFinancialService {
  private configCache: CompanyCorporateFinancialConfig | null = null;
  private paymentsCache: PartnerSubscriptionPaymentProof[] | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    try {
      const dataDir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
        this.configCache = { ...DEFAULT_CONFIG };
      } else {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        this.configCache = JSON.parse(raw);
      }

      if (!fs.existsSync(PAYMENTS_FILE)) {
        fs.writeFileSync(PAYMENTS_FILE, JSON.stringify([], null, 2), 'utf-8');
        this.paymentsCache = [];
      } else {
        const raw = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
        this.paymentsCache = JSON.parse(raw);
      }
    } catch (err) {
      console.error('[CompanyFinancialService] Failed to initialize storage:', err);
      this.configCache = { ...DEFAULT_CONFIG };
      this.paymentsCache = [];
    }
  }

  public getConfig(): CompanyCorporateFinancialConfig {
    if (!this.configCache) {
      this.ensureInitialized();
    }
    return { ...this.configCache! };
  }

  public getPublicPaymentDetails(amount?: number | undefined, invoiceRef?: string | undefined) {
    const config = this.getConfig();
    const cleanRef = (invoiceRef || 'DOCSEARCH-SUB').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanAmount = amount && amount > 0 ? Math.round(amount) : '';

    // Standard NPCI UPI URI Scheme: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(config.businessUpiId)}&pn=${encodeURIComponent(
      config.legalEntityName
    )}${cleanAmount ? `&am=${cleanAmount}` : ''}&cu=INR&tn=${encodeURIComponent(cleanRef)}`;

    return {
      beneficiaryName: config.accountHolderName,
      legalEntityName: config.legalEntityName,
      bankName: config.bankName,
      branchName: config.branchName,
      accountNumber: config.accountNumber,
      ifscCode: config.ifscCode,
      accountType: config.accountType,
      businessUpiId: config.businessUpiId,
      secondaryUpiId: config.secondaryUpiId || null,
      gstin: config.gstin,
      pan: config.pan,
      billingEmail: config.billingEmail,
      billingPhone: config.billingPhone,
      upiIntentUrl,
      paymentModes: config.paymentModes,
      instructions: config.saasPaymentInstructions,
      isolationNotice:
        'DocSearch SaaS Subscription & License Separation Notice: This corporate account strictly collects software subscription and tier upgrade fees. All transactional patient revenues (OPD consultation, pharmacy sales, pathology diagnostics) are routed exclusively to your own registered hospital/clinic account.'
    };
  }

  public async updateConfig(
    updates: Partial<CompanyCorporateFinancialConfig>,
    session: SessionContext
  ): Promise<CompanyCorporateFinancialConfig> {
    const isSuperAdmin =
      session.isSuperAdmin ||
      Boolean(session.roles?.includes('SUPER_ADMIN' as any)) ||
      Boolean(session.roles?.includes('COMPANY_ADMIN' as any));

    if (!isSuperAdmin) {
      throw AppError.forbidden('Only DocSearch HQ Administrators can manage corporate bank & UPI settings.');
    }

    // Validation: IFSC Code
    if (updates.ifscCode) {
      const cleanIfsc = updates.ifscCode.toUpperCase().trim();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        throw new AppError({
          message: 'Invalid IFSC code format (must be 11 alphanumeric characters, 5th character must be 0, e.g. HDFC0000240)',
          statusCode: 400
        });
      }
      updates.ifscCode = cleanIfsc;
    }

    // Validation: Account Number
    if (updates.accountNumber) {
      const cleanAcc = updates.accountNumber.trim().replace(/\s+/g, '');
      if (!/^\d{9,18}$/.test(cleanAcc)) {
        throw new AppError({
          message: 'Invalid Bank Account Number (must be between 9 and 18 numeric digits)',
          statusCode: 400
        });
      }
      updates.accountNumber = cleanAcc;
    }

    // Validation: Business UPI ID
    if (updates.businessUpiId) {
      const cleanUpi = updates.businessUpiId.toLowerCase().trim();
      if (!/^[\w.-]+@[\w.-]+$/.test(cleanUpi)) {
        throw new AppError({
          message: 'Invalid UPI ID / VPA format (e.g. docsearch.billing@hdfcbank)',
          statusCode: 400
        });
      }
      updates.businessUpiId = cleanUpi;
    }

    const current = this.getConfig();
    const merged: CompanyCorporateFinancialConfig = {
      ...current,
      ...updates,
      lastUpdatedAt: new Date().toISOString(),
      updatedBy: session.actorEmail || session.userId || 'HQ_ADMIN'
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    this.configCache = merged;

    // Audit log in database
    try {
      const db = getDatabase();
      await db.insert(companyAuditTraces).values({
        id: crypto.randomUUID(),
        traceId: `trace_fin_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        actorEmail: session.actorEmail || 'admin@docsearch.internal',
        action: 'COMPANY_CORPORATE_FINANCIAL_UPDATED',
        entityReference: `company_financial:${merged.bankName}:${merged.accountNumber.slice(-4)}`,
        operationStatus: 'SUCCESS',
        occurredAt: new Date(),
        reason: `Updated corporate bank account (${merged.bankName} ${merged.accountNumber.slice(-4)}) and UPI ID (${merged.businessUpiId})`,
        metadata: {
          bankName: merged.bankName,
          ifscCode: merged.ifscCode,
          accountNumberMasked: `****${merged.accountNumber.slice(-4)}`,
          businessUpiId: merged.businessUpiId,
          gstin: merged.gstin
        }
      });
    } catch (err) {
      console.warn('[CompanyFinancialService] Failed to record audit log:', err);
    }

    return { ...merged };
  }

  public async submitPartnerPaymentProof(
    input: SubmitPaymentProofInput,
    session: SessionContext
  ): Promise<PartnerSubscriptionPaymentProof> {
    const cleanUtr = input.utrNumber.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 4) {
      throw new AppError({
        message: 'Valid 12-digit UTR or transaction reference number is required.',
        statusCode: 400
      });
    }

    const db = getDatabase();
    const [partner] = await db
      .select()
      .from(partnerProfiles)
      .where(eq(partnerProfiles.id, input.partnerId))
      .limit(1);

    const partnerName =
      (partner?.metadata as any)?.general?.partnerTradeName ||
      (partner?.metadata as any)?.facilityName ||
      'Partner Facility';

    const proof: PartnerSubscriptionPaymentProof = {
      id: `proof_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      partnerId: input.partnerId,
      tenantId: partner?.tenantId || session.tenantId || undefined,
      partnerName,
      planId: input.planId,
      planName: input.planName || 'DocSearch Hospital SaaS Plan',
      planCode: input.planCode || 'PLAN_HOSPITAL_ANNUAL',
      durationYears: input.durationYears || 1,
      payableAmountInr: input.payableAmountInr,
      paymentMethod: input.paymentMethod,
      utrNumber: cleanUtr,
      payerUpiOrAccount: input.payerUpiOrAccount || undefined,
      partnerRemarks: input.partnerRemarks || undefined,
      paymentDate: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      status: 'PENDING_VERIFICATION',
      invoiceId: input.invoiceId || undefined
    };

    if (!this.paymentsCache) {
      this.ensureInitialized();
    }

    this.paymentsCache!.unshift(proof);
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(this.paymentsCache, null, 2), 'utf-8');

    return proof;
  }

  public async getPendingPaymentProofs(
    session: SessionContext
  ): Promise<PartnerSubscriptionPaymentProof[]> {
    const isSuperAdmin =
      session.isSuperAdmin ||
      Boolean(session.roles?.includes('SUPER_ADMIN' as any)) ||
      Boolean(session.roles?.includes('COMPANY_ADMIN' as any));

    if (!isSuperAdmin) {
      throw AppError.forbidden('Only DocSearch HQ Administrators can view pending partner payments.');
    }

    if (!this.paymentsCache) {
      this.ensureInitialized();
    }

    return [...this.paymentsCache!];
  }

  public async verifyPaymentProof(
    proofId: string,
    decision: 'APPROVED' | 'REJECTED',
    rejectionReason: string | undefined,
    session: SessionContext
  ): Promise<PartnerSubscriptionPaymentProof> {
    const isSuperAdmin =
      session.isSuperAdmin ||
      Boolean(session.roles?.includes('SUPER_ADMIN' as any)) ||
      Boolean(session.roles?.includes('COMPANY_ADMIN' as any));

    if (!isSuperAdmin) {
      throw AppError.forbidden('Only DocSearch HQ Administrators can verify partner payment proofs.');
    }

    if (!this.paymentsCache) {
      this.ensureInitialized();
    }

    const proofIndex = this.paymentsCache!.findIndex((p) => p.id === proofId);
    if (proofIndex === -1) {
      throw AppError.notFound(`Payment submission ${proofId} not found.`);
    }

    const proof = this.paymentsCache![proofIndex];
    if (!proof) {
      throw AppError.notFound(`Payment submission ${proofId} not found.`);
    }

    if (proof.status !== 'PENDING_VERIFICATION') {
      throw new AppError({
        message: `Payment proof is already ${proof.status}. Cannot re-verify.`,
        statusCode: 400
      });
    }

    const updatedProof: PartnerSubscriptionPaymentProof = {
      ...proof,
      status: decision,
      verifiedAt: new Date().toISOString(),
      verifiedBy: session.actorEmail || session.userId || 'HQ_ADMIN',
      rejectionReason: decision === 'REJECTED' ? (rejectionReason || 'Payment could not be verified in corporate bank statement.') : undefined
    };

    if (decision === 'APPROVED') {
      // If invoice exists, record payment in commercial finance service
      try {
        if (updatedProof.invoiceId) {
          await commercialFinanceService.recordCommercialPayment(
            updatedProof.invoiceId,
            {
              amount: updatedProof.payableAmountInr,
              provider: updatedProof.paymentMethod,
              providerReference: updatedProof.utrNumber,
              paymentMethod: updatedProof.paymentMethod,
              notes: `Verified via HQ Corporate Bank Reconciliation. UTR: ${updatedProof.utrNumber}`
            },
            session
          );
        } else {
          // Find or create an invoice for this partner & plan
          const invResult = await commercialFinanceService.generatePartnerInvoice(
            updatedProof.partnerId,
            updatedProof.planId,
            updatedProof.durationYears,
            session
          );
          if (invResult?.invoice?.id) {
            await commercialFinanceService.recordCommercialPayment(
              invResult.invoice.id,
              {
                amount: updatedProof.payableAmountInr,
                provider: updatedProof.paymentMethod,
                providerReference: updatedProof.utrNumber,
                paymentMethod: updatedProof.paymentMethod,
                notes: `Verified via HQ Corporate Bank Reconciliation. UTR: ${updatedProof.utrNumber}`
              },
              session
            );
            updatedProof.invoiceId = invResult.invoice.id;
          }
        }
      } catch (err) {
        console.error('[CompanyFinancialService] Error auto-extending subscription upon approval:', err);
      }
    }

    this.paymentsCache![proofIndex] = updatedProof;
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(this.paymentsCache, null, 2), 'utf-8');

    return updatedProof;
  }
}

export const companyFinancialService = new CompanyFinancialService();
