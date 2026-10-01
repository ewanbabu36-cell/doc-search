import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import {
  getDatabase,
  tenants,
  partnerProfiles,
  partnerOnboardingStagedRegistrations,
  products,
  plans,
  features,
  planEntitlements,
  subscriptions,
  licenses,
  users,
  eq,
  or
} from '@docsearch/database';
import { partnerOnboardingRepository, toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';
import { realAuthService } from '../core/RealAuthService.js';
import { resolvePartnerLocation } from '../../repositories/company/PartnerRepository.js';
import { partnerTombstoneService } from './PartnerTombstoneService.js';
import { entitlementService } from './EntitlementService.js';
import { licenseService } from './LicenseService.js';

const logger = createLogger('partner-sync-service');

const DEFAULT_PRODUCT_ID = '77777777-7777-4777-8777-777777777777';

export function resolveVerticalPlan(
  assignedPlan: any,
  requestedPlan: any,
  partnerType: string,
  planTier?: string
): { planId: string; productId: string; maxConcurrentUsers: number; maxDoctors: number; maxBranches: number } {
  const candidatePlan = assignedPlan || requestedPlan || {};
  const normType = String(partnerType || '').toUpperCase().trim();
  const rawId = String(candidatePlan.id || '').trim();
  const tier = String(candidatePlan.tier || planTier || '').toUpperCase();
  const isPaidOrAnnual = tier === 'ANNUAL' || (candidatePlan.price && Number(candidatePlan.price) > 0);

  // If explicit ID given, resolve strictly against canonical plan catalog
  if (rawId) {
    if (rawId.includes('plan-hosp-annual') || rawId === toDeterministicUuid('plan-hosp-annual-yr2')) {
      return { planId: toDeterministicUuid('plan-hosp-annual-yr2'), productId: toDeterministicUuid('prod-hospital'), maxConcurrentUsers: 150, maxDoctors: 100, maxBranches: 5 };
    }
    if (rawId.includes('plan-hosp-free') || rawId === toDeterministicUuid('plan-hosp-free-yr1')) {
      return { planId: toDeterministicUuid('plan-hosp-free-yr1'), productId: toDeterministicUuid('prod-hospital'), maxConcurrentUsers: 100, maxDoctors: 50, maxBranches: 3 };
    }
    if (rawId.includes('plan-clinic-annual') || rawId === toDeterministicUuid('plan-clinic-annual-yr2')) {
      return { planId: toDeterministicUuid('plan-clinic-annual-yr2'), productId: toDeterministicUuid('prod-clinic'), maxConcurrentUsers: 30, maxDoctors: 10, maxBranches: 2 };
    }
    if (rawId.includes('plan-clinic-free') || rawId === toDeterministicUuid('plan-clinic-free-yr1')) {
      return { planId: toDeterministicUuid('plan-clinic-free-yr1'), productId: toDeterministicUuid('prod-clinic'), maxConcurrentUsers: 15, maxDoctors: 5, maxBranches: 1 };
    }
    if (rawId.includes('plan-pharma-wholesale-annual') || rawId === toDeterministicUuid('plan-pharma-wholesale-annual-yr2')) {
      return { planId: toDeterministicUuid('plan-pharma-wholesale-annual-yr2'), productId: toDeterministicUuid('prod-pharma-wholesale'), maxConcurrentUsers: 50, maxDoctors: 15, maxBranches: 5 };
    }
    if (rawId.includes('plan-pharma-wholesale-free') || rawId === toDeterministicUuid('plan-pharma-wholesale-free-yr1')) {
      return { planId: toDeterministicUuid('plan-pharma-wholesale-free-yr1'), productId: toDeterministicUuid('prod-pharma-wholesale'), maxConcurrentUsers: 25, maxDoctors: 5, maxBranches: 1 };
    }
    if (rawId.includes('plan-pharma-annual') || rawId === toDeterministicUuid('plan-pharma-annual-yr2')) {
      return { planId: toDeterministicUuid('plan-pharma-annual-yr2'), productId: toDeterministicUuid('prod-pharmacy'), maxConcurrentUsers: 30, maxDoctors: 10, maxBranches: 3 };
    }
    if (rawId.includes('plan-pharma-free') || rawId === toDeterministicUuid('plan-pharma-free-yr1')) {
      return { planId: toDeterministicUuid('plan-pharma-free-yr1'), productId: toDeterministicUuid('prod-pharmacy'), maxConcurrentUsers: 15, maxDoctors: 3, maxBranches: 1 };
    }
    if (rawId.includes('plan-path-annual') || rawId === toDeterministicUuid('plan-path-annual-yr2')) {
      return { planId: toDeterministicUuid('plan-path-annual-yr2'), productId: toDeterministicUuid('prod-pathology'), maxConcurrentUsers: 50, maxDoctors: 20, maxBranches: 5 };
    }
    if (rawId.includes('plan-path-free') || rawId === toDeterministicUuid('plan-path-free-yr1')) {
      return { planId: toDeterministicUuid('plan-path-free-yr1'), productId: toDeterministicUuid('prod-pathology'), maxConcurrentUsers: 20, maxDoctors: 5, maxBranches: 1 };
    }
    if (rawId.includes('plan-radio-annual') || rawId === toDeterministicUuid('plan-radio-annual-yr2')) {
      return { planId: toDeterministicUuid('plan-radio-annual-yr2'), productId: toDeterministicUuid('prod-pathology'), maxConcurrentUsers: 45, maxDoctors: 15, maxBranches: 3 };
    }
    if (rawId.includes('plan-radio-free') || rawId === toDeterministicUuid('plan-radio-free-yr1')) {
      return { planId: toDeterministicUuid('plan-radio-free-yr1'), productId: toDeterministicUuid('prod-pathology'), maxConcurrentUsers: 20, maxDoctors: 5, maxBranches: 1 };
    }
    if (rawId.includes('plan-combo-cp-annual') || rawId === toDeterministicUuid('plan-combo-cp-annual-yr2')) {
      return { planId: toDeterministicUuid('plan-combo-cp-annual-yr2'), productId: toDeterministicUuid('prod-combo-clinic-pathology'), maxConcurrentUsers: 50, maxDoctors: 25, maxBranches: 3 };
    }
    if (rawId.includes('plan-combo-cp-free') || rawId === toDeterministicUuid('plan-combo-cp-free-yr1')) {
      return { planId: toDeterministicUuid('plan-combo-cp-free-yr1'), productId: toDeterministicUuid('prod-combo-clinic-pathology'), maxConcurrentUsers: 20, maxDoctors: 6, maxBranches: 1 };
    }
    if (rawId.includes('plan-combo-crx-annual') || rawId === toDeterministicUuid('plan-combo-crx-annual-yr2')) {
      return { planId: toDeterministicUuid('plan-combo-crx-annual-yr2'), productId: toDeterministicUuid('prod-combo-clinic-pharmacy'), maxConcurrentUsers: 50, maxDoctors: 20, maxBranches: 3 };
    }
    if (rawId.includes('plan-combo-crx-free') || rawId === toDeterministicUuid('plan-combo-crx-free-yr1')) {
      return { planId: toDeterministicUuid('plan-combo-crx-free-yr1'), productId: toDeterministicUuid('prod-combo-clinic-pharmacy'), maxConcurrentUsers: 20, maxDoctors: 6, maxBranches: 1 };
    }
    if (rawId.includes('plan-blood-annual') || rawId === toDeterministicUuid('plan-blood-annual-yr2')) {
      return { planId: toDeterministicUuid('plan-blood-annual-yr2'), productId: DEFAULT_PRODUCT_ID, maxConcurrentUsers: 45, maxDoctors: 15, maxBranches: 3 };
    }
    if (rawId.includes('plan-blood-free') || rawId === toDeterministicUuid('plan-blood-free-yr1')) {
      return { planId: toDeterministicUuid('plan-blood-free-yr1'), productId: DEFAULT_PRODUCT_ID, maxConcurrentUsers: 20, maxDoctors: 5, maxBranches: 1 };
    }
    throw new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: `Unsupported or unmapped commercial plan ID '${rawId}' for partner vertical '${partnerType}'.`,
      statusCode: 400
    });
  }

  // Canonical resolution by vertical (fail closed on unknown/unsupported verticals)
  if (normType === 'HOSPITAL' || normType === 'HOSPITAL_NETWORK' || normType === 'MULTI_SPECIALITY_HOSPITAL') {
    const planSlug = isPaidOrAnnual ? 'plan-hosp-annual-yr2' : 'plan-hosp-free-yr1';
    return {
      planId: toDeterministicUuid(planSlug),
      productId: toDeterministicUuid('prod-hospital'),
      maxConcurrentUsers: isPaidOrAnnual ? 150 : 100,
      maxDoctors: isPaidOrAnnual ? 100 : 50,
      maxBranches: isPaidOrAnnual ? 5 : 3
    };
  }

  if (normType === 'CLINIC' || normType === 'DAY_CARE' || normType === 'SOLO_CLINIC' || normType === 'SOLO_DOCTOR_CLINIC' || normType === 'MULTI_DOCTOR_CLINIC') {
    const planSlug = isPaidOrAnnual ? 'plan-clinic-annual-yr2' : 'plan-clinic-free-yr1';
    return {
      planId: toDeterministicUuid(planSlug),
      productId: toDeterministicUuid('prod-clinic'),
      maxConcurrentUsers: isPaidOrAnnual ? 30 : 15,
      maxDoctors: isPaidOrAnnual ? 10 : 5,
      maxBranches: isPaidOrAnnual ? 2 : 1
    };
  }

  if (normType === 'PHARMACY_WHOLESALE' || normType === 'WHOLESALE_PHARMACY' || normType === 'PHARMA_WHOLESALE') {
    const planSlug = isPaidOrAnnual ? 'plan-pharma-wholesale-annual-yr2' : 'plan-pharma-wholesale-free-yr1';
    return {
      planId: toDeterministicUuid(planSlug),
      productId: toDeterministicUuid('prod-pharma-wholesale'),
      maxConcurrentUsers: isPaidOrAnnual ? 50 : 25,
      maxDoctors: isPaidOrAnnual ? 15 : 5,
      maxBranches: isPaidOrAnnual ? 5 : 1
    };
  }

  if (normType === 'PHARMACY' || normType === 'PHARMACY_RETAIL' || normType === 'RETAIL_PHARMACY') {
    const planSlug = isPaidOrAnnual ? 'plan-pharma-annual-yr2' : 'plan-pharma-free-yr1';
    return {
      planId: toDeterministicUuid(planSlug),
      productId: toDeterministicUuid('prod-pharmacy'),
      maxConcurrentUsers: isPaidOrAnnual ? 30 : 15,
      maxDoctors: isPaidOrAnnual ? 10 : 3,
      maxBranches: isPaidOrAnnual ? 3 : 1
    };
  }

  if (normType === 'PATHOLOGY' || normType === 'PATHOLOGY_LAB') {
    const planSlug = isPaidOrAnnual ? 'plan-path-annual-yr2' : 'plan-path-free-yr1';
    return {
      planId: toDeterministicUuid(planSlug),
      productId: toDeterministicUuid('prod-pathology'),
      maxConcurrentUsers: isPaidOrAnnual ? 50 : 20,
      maxDoctors: isPaidOrAnnual ? 20 : 5,
      maxBranches: isPaidOrAnnual ? 5 : 1
    };
  }

  if (normType === 'DIAGNOSTIC_CENTRE' || normType === 'RADIOLOGY') {
    const planSlug = isPaidOrAnnual ? 'plan-radio-annual-yr2' : 'plan-radio-free-yr1';
    return {
      planId: toDeterministicUuid(planSlug),
      productId: toDeterministicUuid('prod-pathology'),
      maxConcurrentUsers: isPaidOrAnnual ? 45 : 20,
      maxDoctors: isPaidOrAnnual ? 15 : 5,
      maxBranches: isPaidOrAnnual ? 3 : 1
    };
  }

  if (normType === 'COMBO_CLINIC_PATHOLOGY' || normType === 'HYBRID') {
    const planSlug = isPaidOrAnnual ? 'plan-combo-cp-annual-yr2' : 'plan-combo-cp-free-yr1';
    return {
      planId: toDeterministicUuid(planSlug),
      productId: toDeterministicUuid('prod-combo-clinic-pathology'),
      maxConcurrentUsers: isPaidOrAnnual ? 50 : 20,
      maxDoctors: isPaidOrAnnual ? 25 : 6,
      maxBranches: isPaidOrAnnual ? 3 : 1
    };
  }

  if (normType === 'COMBO_CLINIC_PHARMACY') {
    const planSlug = isPaidOrAnnual ? 'plan-combo-crx-annual-yr2' : 'plan-combo-crx-free-yr1';
    return {
      planId: toDeterministicUuid(planSlug),
      productId: toDeterministicUuid('prod-combo-clinic-pharmacy'),
      maxConcurrentUsers: isPaidOrAnnual ? 50 : 20,
      maxDoctors: isPaidOrAnnual ? 20 : 6,
      maxBranches: isPaidOrAnnual ? 3 : 1
    };
  }

  if (normType === 'BLOOD_BANK') {
    const planSlug = isPaidOrAnnual ? 'plan-blood-annual-yr2' : 'plan-blood-free-yr1';
    return {
      planId: toDeterministicUuid(planSlug),
      productId: DEFAULT_PRODUCT_ID,
      maxConcurrentUsers: isPaidOrAnnual ? 45 : 20,
      maxDoctors: isPaidOrAnnual ? 15 : 5,
      maxBranches: isPaidOrAnnual ? 3 : 1
    };
  }

  throw new AppError({
    code: ErrorCode.VALIDATION_ERROR,
    message: `Unsupported or unknown partner vertical '${partnerType}' for commercial plan resolution. Silent fallback to Clinic Starter is prohibited.`,
    statusCode: 400
  });
}

export class PartnerSyncService {
  private isSyncing = false;
  private lastSyncTimestamp = 0;
  private syncThrottleMs = 60000; // Throttle redundant directory syncs within 60s

  public invalidateCache(): void {
    this.lastSyncTimestamp = 0;
  }

  private async getApprovedPartnersFromDisk(): Promise<any[]> {
    try {
      const queue = await partnerOnboardingRepository.getVerificationQueue();
      return queue
        .filter((item: any) => item.status === 'APPROVED' || item.status === 'ACTIVE')
        .map((item: any) => ({
          id: item.id,
          email: item.details?.['Registered Email'] || item.details?.['Applicant Email'] || (item as any).contactEmail || '',
          facilityName: item.organizationName || item.facilityName || item.details?.['Hospital Name'] || item.details?.['Clinic Name'] || item.details?.['Lab Name'] || item.details?.['Facility Name'] || 'Healthcare Partner',
          status: item.status,
          kycStatus: 'KYC_VERIFIED',
          organizationType: item.type || 'HOSPITAL',
          assignedPlan: item.assignedPlan || null,
          planTier: item.planTier,
          monthlyFee: item.monthlyFee,
          finalAmount: item.finalAmount,
          invoiceNumber: item.invoiceNumber,
          paymentStatus: item.paymentStatus
        }));
    } catch {
      return [];
    }
  }

  private async getPartnerCredentialsFromDisk(): Promise<any[]> {
    try {
      return realAuthService.getAllLivePartnerUsers();
    } catch {
      return [];
    }
  }

  /**
   * Auto-hydrates all disk-persisted approved partners into PostgreSQL tables.
   * Guarantees that once approved, partners are never lost across restarts.
   */
  async syncApprovedPartnersToDatabase(force = false): Promise<{ syncedCount: number; errors: any[] }> {
    const now = Date.now();
    if (!force && (this.isSyncing || now - this.lastSyncTimestamp < this.syncThrottleMs)) {
      return { syncedCount: 0, errors: [] };
    }
    if (force) {
      this.invalidateCache();
    }

    this.isSyncing = true;
    this.lastSyncTimestamp = now;

    let syncedCount = 0;
    const errors: any[] = [];

    try {
      const db = getDatabase();
      const approvedList = await this.getApprovedPartnersFromDisk();
      const credentialsList = await this.getPartnerCredentialsFromDisk();

      // Index credentials by email for fast matching
      const credsByEmail = new Map<string, any>();
      for (const c of credentialsList) {
        if (c?.email) {
          credsByEmail.set(c.email.toLowerCase().trim(), c);
        }
      }

      // Also merge credentials from PostgreSQL core.users so database-registered partners are recognized
      if (db) {
        try {
          const dbUsers = await db.select().from(users);
          for (const u of dbUsers) {
            const uEmail = (u.email || '').toLowerCase().trim();
            if (uEmail && !credsByEmail.has(uEmail)) {
              const meta = (u.metadata || {}) as Record<string, any>;
              credsByEmail.set(uEmail, {
                email: uEmail,
                tenantId: meta['tenantId'] || undefined,
                tenantName: meta['tenantName'] || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                firstName: u.firstName,
                lastName: u.lastName,
                roles: meta['roles'] || [],
                organizationType: meta['organizationType'],
                planTier: meta['planTier']
              });
            }
          }
        } catch (dbUserErr) {
          logger.warn('Could not query core.users during partner sync: ' + String(dbUserErr));
        }

        // Also merge active/verified profiles from company.partner_profiles into approvedList
        try {
          const dbProfiles = await db
            .select()
            .from(partnerProfiles)
            .where(
              or(
                eq(partnerProfiles.lifecycleStatus, 'ACTIVE'),
                eq(partnerProfiles.verificationStatus, 'VERIFIED')
              )
            );

          for (const prof of dbProfiles) {
            const pEmail = (prof.primaryContactEmail || '').toLowerCase().trim();
            if (pEmail && !approvedList.some((ap) => (ap.email || '').toLowerCase().trim() === pEmail)) {
              approvedList.push({
                id: prof.id,
                email: pEmail,
                facilityName: prof.legalName || prof.tradeName || 'Healthcare Facility',
                status: 'APPROVED',
                kycStatus: 'KYC_VERIFIED',
                organizationType: prof.partnerType || 'HOSPITAL',
                assignedPlan: (prof.metadata as any)?.assignedPlan || null,
                planTier: (prof.metadata as any)?.planTier,
                monthlyFee: (prof.metadata as any)?.monthlyFee,
                finalAmount: (prof.metadata as any)?.finalAmount,
                invoiceNumber: (prof.metadata as any)?.invoiceNumber,
                tenantDraftId: prof.tenantId
              });
            }
          }
        } catch (dbProfErr) {
          logger.warn('Could not query company.partner_profiles during partner sync: ' + String(dbProfErr));
        }
      }

      // 1. Ensure Catalog Baseline (Products & Plans) exists in DB for licensing
      try {
        // A. Seed Product Verticals (4 Core + 2 Combos)
        const VERTICAL_PRODUCTS = [
          {
            id: DEFAULT_PRODUCT_ID,
            code: 'PROD_HEALTHCARE_SUITE',
            name: 'DOC SEARCH Healthcare Platform',
            description: 'Complete Hospital, Clinic, Pharmacy and Diagnostic Suite',
            category: 'CORE_PLATFORM'
          },
          {
            id: toDeterministicUuid('prod-hospital'),
            code: 'PROD_HOSPITAL',
            name: 'Multi-Specialty Hospital HIS Suite',
            description: 'Inpatient ADT, OT, ICU, TPA Cashless & Enterprise Operations',
            category: 'HOSPITAL'
          },
          {
            id: toDeterministicUuid('prod-clinic'),
            code: 'PROD_CLINIC',
            name: 'Doctor OPD Clinic Practice Suite',
            description: 'OPD Token Queue, Digital Rx Pad, EMR & Consultation Billing',
            category: 'CLINIC'
          },
          {
            id: toDeterministicUuid('prod-pharmacy'),
            code: 'PROD_PHARMACY',
            name: 'Retail Pharmacy & Chemist POS Suite',
            description: 'Counter POS Billing, Batch/Expiry Radar, Generic Switcher & Inventory',
            category: 'PHARMACY'
          },
          {
            id: toDeterministicUuid('prod-pharma-wholesale'),
            code: 'PROD_PHARMA_WHOLESALE',
            name: 'Wholesale Pharmacy & B2B Distribution Suite',
            description: 'Wholesale B2B GST Distribution, Form 20B/21B Verification, Cold-Chain Batch Radar & Supplier GRN',
            category: 'PHARMACY_WHOLESALE'
          },
          {
            id: toDeterministicUuid('prod-pathology'),
            code: 'PROD_PATHOLOGY',
            name: 'Pathology & Diagnostic LIMS Suite',
            description: 'Phlebotomy Barcoding, Analyzer Interfacing, NABL Reports & Doctor E-sign',
            category: 'PATHOLOGY'
          },
          {
            id: toDeterministicUuid('prod-combo-clinic-pathology'),
            code: 'PROD_COMBO_CLINIC_PATHOLOGY',
            name: 'Combo Suite: Clinic OPD & Pathology Lab',
            description: 'Integrated Practice: Doctor orders test -> Lab sample queue -> Auto EMR report sync',
            category: 'COMBO_PRACTICE'
          },
          {
            id: toDeterministicUuid('prod-combo-clinic-pharmacy'),
            code: 'PROD_COMBO_CLINIC_PHARMACY',
            name: 'Combo Suite: Clinic OPD & Retail Chemist',
            description: 'Integrated Practice: Doctor writes Rx -> Pharmacy counter auto-dispense queue',
            category: 'COMBO_PRACTICE'
          }
        ];

        for (const prod of VERTICAL_PRODUCTS) {
          await db
            .insert(products)
            .values({
              id: prod.id,
              code: prod.code,
              name: prod.name,
              description: prod.description,
              category: prod.category,
              status: 'ACTIVE',
              version: '1.0.0'
            })
            .onConflictDoNothing();
        }

        // B. Seed Exactly 2 Plans per Healthcare Profile (1st Year Free + Profile-Specific Year 2 Renewal)
        const VERTICAL_PLANS: Array<{
          id: string;
          productId: string;
          code: string;
          name: string;
          tier: 'FOUNDING' | 'ANNUAL' | 'SILVER' | 'GOLD' | 'PLATINUM';
          vertical: string;
          priceMonthly: number;
          billingInterval?: string;
          maxDoctors: number;
          maxBranches: number;
          storageGb: number;
          whatsAppCredits: number;
          badge: string;
          features: string[];
        }> = [
          // 1. HOSPITAL: 1st Year Free + Year 2 Renewal ₹30,000/yr (All Departments & Modules Pre-Selected)
          {
            id: toDeterministicUuid('plan-hosp-free-yr1'),
            productId: toDeterministicUuid('prod-hospital'),
            code: 'PLAN_HOSP_FREE_YR1',
            name: 'Hospital Founding Partner (1st Year Free)',
            tier: 'FOUNDING',
            vertical: 'HOSPITAL',
            priceMonthly: 0,
            billingInterval: 'ANNUAL',
            maxDoctors: 50,
            maxBranches: 3,
            storageGb: 200,
            whatsAppCredits: 10000,
            badge: '🎁 1st Year Free',
            features: [
              'Universal Staff Directory & RBAC',
              'Inpatient ADT Bed Matrix (All Wards)',
              'OT Surgical Rostering & PAC Clearance',
              'ICU 24-Hour Digital Flowsheet',
              'TPA Cashless Pre-Auth & IRDAI NHCX Bridge',
              'Emergency & Code Blue Broadcast',
              'ABDM 2.0 Fast OPD Kiosk',
              'MRD ICD-10 Medical Coding',
              'Blood Bank Component Cross-Matching'
            ]
          },
          {
            id: toDeterministicUuid('plan-hosp-annual-yr2'),
            productId: toDeterministicUuid('prod-hospital'),
            code: 'PLAN_HOSP_ANNUAL_YR2',
            name: 'Multi-Specialty Hospital Annual Plan',
            tier: 'ANNUAL',
            vertical: 'HOSPITAL',
            priceMonthly: 30000,
            billingInterval: 'ANNUAL',
            maxDoctors: 100,
            maxBranches: 5,
            storageGb: 500,
            whatsAppCredits: 25000,
            badge: '⭐ Year 2: ₹30,000/yr',
            features: [
              'Universal Staff Directory & RBAC',
              'Inpatient ADT Bed Matrix (All Wards)',
              'OT Surgical Rostering & PAC Clearance',
              'ICU 24-Hour Digital Flowsheet',
              'TPA Cashless Pre-Auth & IRDAI NHCX Bridge',
              'Emergency & Code Blue Broadcast',
              'ABDM 2.0 Fast OPD Kiosk',
              'MRD ICD-10 Medical Coding',
              'Blood Bank Component Cross-Matching'
            ]
          },

          // 2. CLINIC: 1st Year Free + Year 2 Renewal ₹20,000/yr
          {
            id: toDeterministicUuid('plan-clinic-free-yr1'),
            productId: toDeterministicUuid('prod-clinic'),
            code: 'PLAN_CLINIC_FREE_YR1',
            name: 'Clinic Founding Partner (1st Year Free)',
            tier: 'FOUNDING',
            vertical: 'CLINIC',
            priceMonthly: 0,
            billingInterval: 'ANNUAL',
            maxDoctors: 5,
            maxBranches: 1,
            storageGb: 25,
            whatsAppCredits: 2500,
            badge: '🎁 1st Year Free',
            features: [
              'Universal Staff Directory & RBAC',
              'Ambient AI Voice Scribe',
              'Digital Prescription Pad (Rx)',
              'WhatsApp High-Res PDF Rx Dispatch',
              'ABHA 2.0 QR Scan Fast OPD Check-in',
              'Real-Time Drug-Drug Interaction Shield'
            ]
          },
          {
            id: toDeterministicUuid('plan-clinic-annual-yr2'),
            productId: toDeterministicUuid('prod-clinic'),
            code: 'PLAN_CLINIC_ANNUAL_YR2',
            name: 'Doctor OPD Clinic Annual Plan',
            tier: 'ANNUAL',
            vertical: 'CLINIC',
            priceMonthly: 20000,
            billingInterval: 'ANNUAL',
            maxDoctors: 10,
            maxBranches: 2,
            storageGb: 100,
            whatsAppCredits: 10000,
            badge: '⭐ Year 2: ₹20,000/yr',
            features: [
              'Universal Staff Directory & RBAC',
              'Ambient AI Voice Scribe',
              'Digital Prescription Pad (Rx)',
              'WhatsApp High-Res PDF Rx Dispatch',
              'ABHA 2.0 QR Scan Fast OPD Check-in',
              'Real-Time Drug-Drug Interaction Shield',
              'Multi-Doctor Room Rostering & Central Cashier'
            ]
          },

          // 3. PHARMACY: 1st Year Free + Year 2 Renewal ₹10,000/yr
          {
            id: toDeterministicUuid('plan-pharma-free-yr1'),
            productId: toDeterministicUuid('prod-pharmacy'),
            code: 'PLAN_PHARMA_FREE_YR1',
            name: 'Pharmacy Founding Partner (1st Year Free)',
            tier: 'FOUNDING',
            vertical: 'PHARMACY',
            priceMonthly: 0,
            billingInterval: 'ANNUAL',
            maxDoctors: 3,
            maxBranches: 1,
            storageGb: 20,
            whatsAppCredits: 2000,
            badge: '🎁 1st Year Free',
            features: [
              'Universal Staff Directory & RBAC',
              'High-Speed Barcode POS & Thermal Print',
              'Automated Batch & Expiry Radar',
              'Jan Aushadhi Generic Alternate Recommender',
              'Schedule H & H1 Narcotics Digital Register',
              'WhatsApp Invoice PDF & Auto-Refills'
            ]
          },
          {
            id: toDeterministicUuid('plan-pharma-annual-yr2'),
            productId: toDeterministicUuid('prod-pharmacy'),
            code: 'PLAN_PHARMA_ANNUAL_YR2',
            name: 'Pharmacy & Chemist Annual Plan',
            tier: 'ANNUAL',
            vertical: 'PHARMACY',
            priceMonthly: 10000,
            billingInterval: 'ANNUAL',
            maxDoctors: 10,
            maxBranches: 3,
            storageGb: 75,
            whatsAppCredits: 7500,
            badge: '⭐ Year 2: ₹10,000/yr',
            features: [
              'Universal Staff Directory & RBAC',
              'High-Speed Barcode POS & Thermal Print',
              'Automated Batch & Expiry Radar',
              'Jan Aushadhi Generic Alternate Recommender',
              'Schedule H & H1 Narcotics Digital Register',
              'WhatsApp Invoice PDF & Auto-Refills',
              'Central Multi-Store Warehouse & Stock Transfer',
              'Supplier Purchase Orders & Automated GST Inwarding'
            ]
          },

          // 4. PATHOLOGY: 1st Year Free + Year 2 Renewal ₹10,000/yr
          {
            id: toDeterministicUuid('plan-path-free-yr1'),
            productId: toDeterministicUuid('prod-pathology'),
            code: 'PLAN_PATH_FREE_YR1',
            name: 'Pathology Founding Partner (1st Year Free)',
            tier: 'FOUNDING',
            vertical: 'PATHOLOGY',
            priceMonthly: 0,
            billingInterval: 'ANNUAL',
            maxDoctors: 5,
            maxBranches: 1,
            storageGb: 35,
            whatsAppCredits: 3500,
            badge: '🎁 1st Year Free',
            features: [
              'Universal Staff Directory & RBAC',
              'Phlebotomy Sample Barcode Intake & Tracking',
              'Bi-Directional Lab Machine Analyzer Interface',
              'WhatsApp NABL Lab Report Auto-Dispatch',
              'Doctor Digital Signature on Lab Reports'
            ]
          },
          {
            id: toDeterministicUuid('plan-path-annual-yr2'),
            productId: toDeterministicUuid('prod-pathology'),
            code: 'PLAN_PATH_ANNUAL_YR2',
            name: 'Pathology Lab LIMS Annual Plan',
            tier: 'ANNUAL',
            vertical: 'PATHOLOGY',
            priceMonthly: 10000,
            billingInterval: 'ANNUAL',
            maxDoctors: 20,
            maxBranches: 5,
            storageGb: 150,
            whatsAppCredits: 15000,
            badge: '⭐ Year 2: ₹10,000/yr',
            features: [
              'Universal Staff Directory & RBAC',
              'Phlebotomy Sample Barcode Intake & Tracking',
              'Bi-Directional Lab Machine Analyzer Interface',
              'WhatsApp NABL Lab Report Auto-Dispatch',
              'Doctor Digital Signature on Lab Reports',
              'Multi-Collection Center Branches',
              'Doctor Referral B2B Commission Split & Ledger'
            ]
          },

          // 5. COMBO: CLINIC + PATHOLOGY (OPD + Lab Bundle)
          {
            id: toDeterministicUuid('plan-combo-cp-free-yr1'),
            productId: toDeterministicUuid('prod-combo-clinic-pathology'),
            code: 'PLAN_COMBO_CP_FREE_YR1',
            name: 'Clinic + Lab Founding Partner (1st Year Free)',
            tier: 'FOUNDING',
            vertical: 'COMBO_CLINIC_PATHOLOGY',
            priceMonthly: 0,
            billingInterval: 'ANNUAL',
            maxDoctors: 6,
            maxBranches: 1,
            storageGb: 50,
            whatsAppCredits: 5000,
            badge: '🎁 1st Year Free',
            features: [
              'Universal Staff Directory & RBAC',
              'Doctor OPD Rx + Lab Order Queue',
              'Direct EMR Lab Report Attachment',
              'Single / Split Cashier Billing',
              'Phlebotomy Sample Barcoding & Analyzer Sync'
            ]
          },
          {
            id: toDeterministicUuid('plan-combo-cp-annual-yr2'),
            productId: toDeterministicUuid('prod-combo-clinic-pathology'),
            code: 'PLAN_COMBO_CP_ANNUAL_YR2',
            name: 'Clinic + Lab Combo Annual Plan',
            tier: 'ANNUAL',
            vertical: 'COMBO_CLINIC_PATHOLOGY',
            priceMonthly: 25000,
            billingInterval: 'ANNUAL',
            maxDoctors: 25,
            maxBranches: 3,
            storageGb: 200,
            whatsAppCredits: 20000,
            badge: '⭐ Year 2: ₹25,000/yr',
            features: [
              'Universal Staff Directory & RBAC',
              'Doctor OPD Rx + Lab Order Queue',
              'Phlebotomy Sample Barcode Intake',
              'Bi-Directional Analyzer Sync',
              'WhatsApp NABL Report Auto-Dispatch',
              'Doctor-Lab Referral Splits & Multi-Collection Centers'
            ]
          },

          // 6. COMBO: CLINIC + PHARMACY (OPD + Chemist Bundle)
          {
            id: toDeterministicUuid('plan-combo-crx-free-yr1'),
            productId: toDeterministicUuid('prod-combo-clinic-pharmacy'),
            code: 'PLAN_COMBO_CRX_FREE_YR1',
            name: 'Clinic + Pharmacy Founding Partner (1st Year Free)',
            tier: 'FOUNDING',
            vertical: 'COMBO_CLINIC_PHARMACY',
            priceMonthly: 0,
            billingInterval: 'ANNUAL',
            maxDoctors: 6,
            maxBranches: 1,
            storageGb: 40,
            whatsAppCredits: 4000,
            badge: '🎁 1st Year Free',
            features: [
              'Universal Staff Directory & RBAC',
              'Doctor Rx Direct Push to Pharmacy POS',
              '1-Click Dispensing & Stock Deduction',
              'Combined Consultation & Medicine Bill'
            ]
          },
          {
            id: toDeterministicUuid('plan-combo-crx-annual-yr2'),
            productId: toDeterministicUuid('prod-combo-clinic-pharmacy'),
            code: 'PLAN_COMBO_CRX_ANNUAL_YR2',
            name: 'Clinic + Pharmacy Combo Annual Plan',
            tier: 'ANNUAL',
            vertical: 'COMBO_CLINIC_PHARMACY',
            priceMonthly: 25000,
            billingInterval: 'ANNUAL',
            maxDoctors: 20,
            maxBranches: 3,
            storageGb: 150,
            whatsAppCredits: 15000,
            badge: '⭐ Year 2: ₹25,000/yr',
            features: [
              'Universal Staff Directory & RBAC',
              'Doctor Rx Direct Push to Pharmacy POS',
              'High-Speed Barcode Billing & Thermal Print',
              'Automated Batch/Expiry Radar & Generic Finder',
              'Multi-Store Inventory Balancing & Supplier Orders'
            ]
          },

          // 7. DIAGNOSTIC CENTRE (Radiology & Imaging)
          {
            id: toDeterministicUuid('plan-radio-free-yr1'),
            productId: toDeterministicUuid('prod-pathology'),
            code: 'PLAN_RADIO_FREE_YR1',
            name: 'Radiology Founding Partner (1st Year Free)',
            tier: 'FOUNDING',
            vertical: 'DIAGNOSTIC_CENTRE',
            priceMonthly: 0,
            billingInterval: 'ANNUAL',
            maxDoctors: 5,
            maxBranches: 1,
            storageGb: 50,
            whatsAppCredits: 2500,
            badge: '🎁 1st Year Free',
            features: [
              'Universal Staff Directory & RBAC',
              'Zero-Footprint Web DICOM Viewer',
              'Radiologist Speech-to-Text Reporting',
              'WhatsApp Diagnostic Scan & DICOM Links'
            ]
          },
          {
            id: toDeterministicUuid('plan-radio-annual-yr2'),
            productId: toDeterministicUuid('prod-pathology'),
            code: 'PLAN_RADIO_ANNUAL_YR2',
            name: 'Radiology & PACS Annual Plan',
            tier: 'ANNUAL',
            vertical: 'DIAGNOSTIC_CENTRE',
            priceMonthly: 20000,
            billingInterval: 'ANNUAL',
            maxDoctors: 15,
            maxBranches: 3,
            storageGb: 250,
            whatsAppCredits: 10000,
            badge: '⭐ Year 2: ₹20,000/yr',
            features: [
              'Universal Staff Directory & RBAC',
              'Zero-Footprint Web DICOM Viewer',
              'Radiologist Speech-to-Text Reporting',
              'WhatsApp Diagnostic Scan & DICOM Links',
              'Cloud PACS & DICOM CT/MRI Machine Sync',
              'AERB & PNDT Automated Regulatory Registers'
            ]
          },

          // 8. BLOOD BANK & TRANSFUSION
          {
            id: toDeterministicUuid('plan-blood-free-yr1'),
            productId: DEFAULT_PRODUCT_ID,
            code: 'PLAN_BLOOD_FREE_YR1',
            name: 'Blood Bank Founding Partner (1st Year Free)',
            tier: 'FOUNDING',
            vertical: 'BLOOD_BANK',
            priceMonthly: 0,
            billingInterval: 'ANNUAL',
            maxDoctors: 5,
            maxBranches: 1,
            storageGb: 25,
            whatsAppCredits: 2500,
            badge: '🎁 1st Year Free',
            features: [
              'Universal Staff Directory & RBAC',
              'Voluntary Donor Registry & Blood Donation Camp Scheduler',
              'Blood Component Fractionation (PRBC, FFP, Platelets)',
              'Cross-Matching & Coombs Compatibility Test Matrix'
            ]
          },
          {
            id: toDeterministicUuid('plan-blood-annual-yr2'),
            productId: DEFAULT_PRODUCT_ID,
            code: 'PLAN_BLOOD_ANNUAL_YR2',
            name: 'Blood Bank & Transfusion Annual Plan',
            tier: 'ANNUAL',
            vertical: 'BLOOD_BANK',
            priceMonthly: 20000,
            billingInterval: 'ANNUAL',
            maxDoctors: 15,
            maxBranches: 3,
            storageGb: 100,
            whatsAppCredits: 10000,
            badge: '⭐ Year 2: ₹20,000/yr',
            features: [
              'Universal Staff Directory & RBAC',
              'Voluntary Donor Registry & Blood Donation Camp Scheduler',
              'Blood Component Fractionation (PRBC, FFP, Platelets)',
              'Cross-Matching & Coombs Compatibility Test Matrix',
              'Real-Time Cold Chain IoT Temperature Alert System',
              'e-RaktKosh Central Government Live Inventory Sync'
            ]
          },

          // 9. PHARMACY WHOLESALE / B2B DISTRIBUTION
          {
            id: toDeterministicUuid('plan-pharma-wholesale-free-yr1'),
            productId: toDeterministicUuid('prod-pharma-wholesale'),
            code: 'PLAN_PHARMA_WHOLESALE_FREE_YR1',
            name: 'Wholesale Distributor Founding Partner (1st Year Free)',
            tier: 'FOUNDING',
            vertical: 'PHARMACY_WHOLESALE',
            priceMonthly: 0,
            billingInterval: 'ANNUAL',
            maxDoctors: 5,
            maxBranches: 1,
            storageGb: 35,
            whatsAppCredits: 3500,
            badge: '🎁 1st Year Free',
            features: [
              'Universal Staff Directory & RBAC',
              'Wholesale B2B GST Distribution & Buyer Drug License Verification',
              'Form 20B / 21B Regulatory Compliance Register',
              'Multi-Batch Cold-Chain & Expiry Radar',
              'Automated Supplier GRN & Credit Note Settlement'
            ]
          },
          {
            id: toDeterministicUuid('plan-pharma-wholesale-annual-yr2'),
            productId: toDeterministicUuid('prod-pharma-wholesale'),
            code: 'PLAN_PHARMA_WHOLESALE_ANNUAL_YR2',
            name: 'Wholesale Pharma Distributor Annual Plan',
            tier: 'ANNUAL',
            vertical: 'PHARMACY_WHOLESALE',
            priceMonthly: 25000,
            billingInterval: 'ANNUAL',
            maxDoctors: 15,
            maxBranches: 5,
            storageGb: 150,
            whatsAppCredits: 15000,
            badge: '⭐ Year 2: ₹25,000/yr',
            features: [
              'Universal Staff Directory & RBAC',
              'Wholesale B2B GST Distribution & Buyer Drug License Verification',
              'Form 20B / 21B Regulatory Compliance Register',
              'Multi-Batch Cold-Chain & Expiry Radar',
              'Automated Supplier GRN & Credit Note Settlement',
              'Multi-Warehouse Stock Transfer & Credit Limit Governance'
            ]
          }
        ];

        // Authoritative 2-Plan Template Inserts
        const allPlanInserts = VERTICAL_PLANS.map((vp) => ({
          id: vp.id,
          productId: vp.productId,
          code: vp.code,
          name: vp.name,
          description: vp.priceMonthly === 0
            ? `Founding Partner: 1st Year 100% Free for ${vp.name}. Renews from Year 2.`
            : `Standard Annual License for ${vp.name} starting from Year 2.`,
          status: 'ACTIVE',
          version: '1.0.0',
          basePrice: vp.priceMonthly,
          maxDoctors: vp.maxDoctors,
          maxBranches: vp.maxBranches,
          storageQuotaGb: vp.storageGb,
          monthlyWhatsAppCredits: vp.whatsAppCredits,
          metadata: {
            billingCadence: vp.billingInterval || 'ANNUAL',
            basePrice: vp.priceMonthly,
            currency: 'INR',
            tier: vp.tier,
            vertical: vp.vertical,
            maxDoctors: vp.maxDoctors,
            maxBranches: vp.maxBranches,
            storageGb: vp.storageGb,
            whatsAppQuota: vp.whatsAppCredits,
            badge: vp.badge,
            isFirstYearFreeEligible: vp.priceMonthly === 0,
            features: vp.features
          }
        }));

        // Clean up obsolete legacy plans so only the official plans exist per vertical
        const allowedPlanIds = new Set(allPlanInserts.map((p) => p.id));
        const currentDbPlans = await db.select({ id: plans.id }).from(plans);
        for (const dp of currentDbPlans) {
          if (!allowedPlanIds.has(dp.id)) {
            await db.delete(planEntitlements).where(eq(planEntitlements.planId, dp.id));
            await db.delete(plans).where(eq(plans.id, dp.id));
          }
        }

        for (const p of allPlanInserts) {
          await db.insert(plans).values(p).onConflictDoNothing();
        }

        // 1C. Seed Core Features & Plan Entitlements
        const CORE_FEATURES = [
          { code: 'STAFF_DIRECTORY', name: 'Universal Staff Directory & RBAC', category: 'CORE_MANAGEMENT' },
          { code: 'OPERATIONS', name: 'Hospital Operations & Staff', category: 'MODULE_ACCESS' },
          { code: 'CLINICAL_EMR', name: 'Clinical EMR & Consultations', category: 'MODULE_ACCESS' },
          { code: 'OPD', name: 'Outpatient Management', category: 'MODULE_ACCESS' },
          { code: 'BILLING', name: 'Billing & Invoicing', category: 'MODULE_ACCESS' },
          { code: 'INPATIENT', name: 'Inpatient & Bed Management', category: 'MODULE_ACCESS' },
          { code: 'PHARMACY_POS', name: 'Pharmacy POS & Inventory', category: 'MODULE_ACCESS' },
          { code: 'PHARMACY_WHOLESALE', name: 'Wholesale B2B Pharmacy & Stockist ERP', category: 'MODULE_ACCESS' },
          { code: 'PATHOLOGY_LIMS', name: 'Pathology & LIMS', category: 'MODULE_ACCESS' },
          { code: 'RADIOLOGY_PACS', name: 'Radiology & PACS', category: 'MODULE_ACCESS' },
          { code: 'EMERGENCY', name: 'Emergency Care', category: 'MODULE_ACCESS' },
          { code: 'ABDM', name: 'ABDM Integration', category: 'MODULE_ACCESS' },
          { code: 'AI_CLINICAL_ASSIST', name: 'AI Voice Scribe & Analytics', category: 'AI_FEATURES' }
        ];

        for (const feat of CORE_FEATURES) {
          const featId = toDeterministicUuid(`feat-${feat.code}`);
          await db
            .insert(features)
            .values({
              id: featId,
              code: feat.code,
              name: feat.name,
              description: feat.name,
              category: feat.category,
              status: 'ACTIVE'
            })
            .onConflictDoNothing();

          const [existingFeat] = await db
            .select({ id: features.id })
            .from(features)
            .where(eq(features.code, feat.code))
            .limit(1);
          const targetFeatId = existingFeat?.id || featId;

          // Only attach feature to vertical plans that explicitly own this module (never auto-entitle HOSPITAL or cross-vertical plans)
          const verticalFeatureAllowMap: Record<string, string[]> = {
            PATHOLOGY: ['STAFF_DIRECTORY', 'OPERATIONS', 'PATHOLOGY_LIMS', 'BILLING'],
            PHARMACY: ['STAFF_DIRECTORY', 'OPERATIONS', 'PHARMACY_POS', 'BILLING'],
            PHARMACY_WHOLESALE: ['STAFF_DIRECTORY', 'OPERATIONS', 'PHARMACY_WHOLESALE', 'BILLING'],
            CLINIC: ['STAFF_DIRECTORY', 'OPERATIONS', 'CLINICAL_EMR', 'OPD', 'BILLING', 'ABDM'],
            DIAGNOSTIC_CENTRE: ['STAFF_DIRECTORY', 'OPERATIONS', 'RADIOLOGY_PACS', 'PATHOLOGY_LIMS', 'BILLING'],
            COMBO_CLINIC_PATHOLOGY: ['STAFF_DIRECTORY', 'OPERATIONS', 'CLINICAL_EMR', 'OPD', 'PATHOLOGY_LIMS', 'BILLING', 'ABDM'],
            COMBO_CLINIC_PHARMACY: ['STAFF_DIRECTORY', 'OPERATIONS', 'CLINICAL_EMR', 'OPD', 'PHARMACY_POS', 'BILLING', 'ABDM']
          };

          const planIdsToEntitle = VERTICAL_PLANS.filter((vp) => {
            const allowedCodes = verticalFeatureAllowMap[vp.vertical];
            return Array.isArray(allowedCodes) && allowedCodes.includes(feat.code);
          }).map((vp) => vp.id);

          for (const planId of planIdsToEntitle) {
            await db
              .insert(planEntitlements)
              .values({
                id: toDeterministicUuid(`pe-${planId}-${feat.code}`),
                planId,
                featureId: targetFeatId,
                entitlementType: 'FEATURE_ACCESS',
                value: { enabled: true },
                status: 'ACTIVE'
              })
              .onConflictDoNothing();
          }
        }
      } catch (catErr) {
        logger.warn('Catalog baseline seed notice during sync: ' + String(catErr));
      }

      // 2. Iterate approved partners and synchronize
      for (const partner of approvedList) {
        if (!partner || !partner.email) continue;

        // Skip rejected / offboarded partners
        const status = String(partner.status || '').toUpperCase();
        const kycStatus = String(partner.kycStatus || '').toUpperCase();
        if (status === 'REJECTED' || kycStatus === 'REJECTED' || status === 'OFFBOARDED') {
          continue;
        }

        const email = partner.email.toLowerCase().trim();
        const cred = credsByEmail.get(email);
        const facilityName = partner.facilityName || cred?.tenantName || cred?.firstName || 'Healthcare Partner';
        const partnerId = toDeterministicUuid(partner.id || email);

        // Pre-query existing profile in company.partner_profiles to preserve genuine authoritative IDs
        let existingProfile: any = null;
        if (db) {
          try {
            const matchedProfiles = await db
              .select({
                id: partnerProfiles.id,
                tenantId: partnerProfiles.tenantId,
                metadata: partnerProfiles.metadata,
                lifecycleStatus: partnerProfiles.lifecycleStatus,
                verificationStatus: partnerProfiles.verificationStatus
              })
              .from(partnerProfiles)
              .where(
                or(
                  eq(partnerProfiles.id, partner.id),
                  eq(partnerProfiles.id, partnerId),
                  eq(partnerProfiles.primaryContactEmail, email),
                  ...(partner.tenantDraftId ? [eq(partnerProfiles.tenantId, partner.tenantDraftId)] : [])
                )
              )
              .limit(1);
            existingProfile = matchedProfiles[0] || null;
          } catch {
            // Non-fatal
          }
        }

        const targetProfileId = existingProfile?.id || partnerId;
        const tenantId = existingProfile?.tenantId || cred?.tenantId || partner.tenantDraftId || toDeterministicUuid(`tenant-${email}`);

        // STRICT RESURRECTION GUARD: Never re-insert or activate permanently purged/deleted partners
        if (
          partnerTombstoneService.isPurged(partner.id) ||
          partnerTombstoneService.isPurged(partnerId) ||
          partnerTombstoneService.isPurged(targetProfileId) ||
          partnerTombstoneService.isPurged(email) ||
          partnerTombstoneService.isPurged(tenantId)
        ) {
          continue;
        }

        const rawOperatingMode = String(
          (partner as any).operatingMode ||
          (partner as any).metadata?.operatingMode ||
          (cred as any)?.operatingMode ||
          ''
        ).toUpperCase().trim();
        const rawSubType = String(
          (partner as any).industrySubType ||
          (partner as any).metadata?.industrySubType ||
          (cred as any)?.industrySubType ||
          ''
        ).toUpperCase().trim();
        let partnerType = partner.organizationType || cred?.organizationType || 'CLINIC';
        if (
          String(partnerType).toUpperCase() === 'PHARMACY' &&
          (rawOperatingMode === 'WHOLESALE_ONLY' ||
            rawSubType.includes('WHOLESALE') ||
            String(partner.assignedPlan?.id || partner.requestedPlan?.id || '').toLowerCase().includes('wholesale'))
        ) {
          partnerType = 'PHARMACY_WHOLESALE';
        }
        const effectiveOperatingMode =
          rawOperatingMode ||
          (partnerType === 'PHARMACY_WHOLESALE' ? 'WHOLESALE_ONLY' : partnerType === 'PHARMACY' ? 'RETAIL_ONLY' : 'SINGLE_BRANCH');

        const phone = cred?.phone || partner.phone || '+91 88091 49036';
        const contactName = cred
          ? `${cred.firstName || ''} ${cred.lastName || ''}`.trim() || facilityName
          : facilityName;
        const planTier = partner.planTier || cred?.planTier || (partnerType === 'CLINIC' ? 'Clinic Starter Plan' : 'Hospital Professional Plan');

        try {
          // A. Ensure Tenant in core.tenants
          const [existingTenant] = await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

          if (!existingTenant) {
            const slug =
              facilityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
              '-' +
              tenantId.substring(0, 4);

            await db
              .insert(tenants)
              .values({
                id: tenantId,
                name: facilityName,
                slug,
                type: partnerType,
                status: 'ACTIVE',
                metadata: {
                  autoHydrated: true,
                  email,
                  partnerType,
                  operatingMode: effectiveOperatingMode,
                  industrySubType: rawSubType || partnerType
                }
              })
              .onConflictDoNothing();
          }

          // B. Ensure Partner Profile in company.partner_profiles
          const loc = resolvePartnerLocation(facilityName, partner, partner);

          if (!existingProfile) {
            await db
              .insert(partnerProfiles)
              .values({
                id: targetProfileId,
                tenantId,
                partnerType: partnerType as any,
                operatingModel: effectiveOperatingMode,
                lifecycleStatus: 'ACTIVE',
                verificationStatus: 'VERIFIED',
                onboardingStep: 'COMPLETED',
                onboardingProgressPercent: 100,
                legalName: facilityName,
                tradeName: facilityName,
                primaryContactName: contactName,
                primaryContactEmail: email,
                primaryContactPhone: phone,
                primaryContactRole: 'Partner Director',
                metadata: {
                  planTier,
                  partnerType,
                  operatingMode: effectiveOperatingMode,
                  operatingModel: effectiveOperatingMode,
                  industrySubType: rawSubType || partnerType,
                  assignedPlan: partner.assignedPlan || null,
                  invoiceNumber: partner.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
                  licenseNumber: `LIC-REG-${tenantId.substring(0, 8).toUpperCase()}`,
                  city: loc.city,
                  state: loc.state,
                  autoHydrated: true
                }
              })
              .onConflictDoNothing();
          } else if (existingProfile.lifecycleStatus !== 'ACTIVE' || existingProfile.verificationStatus !== 'VERIFIED') {
            // Update to guarantee ACTIVE / VERIFIED and proper city/state only when status was pending
            const currentMeta = (existingProfile.metadata as Record<string, any>) || {};
            await db
              .update(partnerProfiles)
              .set({
                operatingModel: effectiveOperatingMode,
                lifecycleStatus: 'ACTIVE',
                verificationStatus: 'VERIFIED',
                onboardingStep: 'COMPLETED',
                onboardingProgressPercent: 100,
                metadata: {
                  ...currentMeta,
                  partnerType,
                  operatingMode: effectiveOperatingMode,
                  operatingModel: effectiveOperatingMode,
                  industrySubType: rawSubType || partnerType,
                  city: loc.city,
                  state: loc.state
                },
                updatedAt: new Date()
              })
              .where(eq(partnerProfiles.id, targetProfileId));
          }

          // C. Ensure Staged Registration in company.partner_onboarding_staged_registrations
          const [existingStaged] = await db
            .select({
              id: partnerOnboardingStagedRegistrations.id,
              status: partnerOnboardingStagedRegistrations.status,
              registrationPayload: partnerOnboardingStagedRegistrations.registrationPayload
            })
            .from(partnerOnboardingStagedRegistrations)
            .where(
              or(
                eq(partnerOnboardingStagedRegistrations.id, partnerId),
                eq(partnerOnboardingStagedRegistrations.tenantDraftId, tenantId),
                eq(partnerOnboardingStagedRegistrations.contactEmail, email)
              )
            )
            .limit(1);

          if (!existingStaged) {
            await db
              .insert(partnerOnboardingStagedRegistrations)
              .values({
                id: partnerId,
                tenantDraftId: tenantId,
                organizationName: facilityName,
                organizationType: partnerType,
                contactEmail: email,
                contactPhone: phone,
                status: 'APPROVED',
                createdAt: new Date(),
                approvedAt: new Date(),
                registrationPayload: {
                  planTier,
                  partnerType,
                  operatingMode: effectiveOperatingMode,
                  facilityName,
                  contactName,
                  email,
                  city: loc.city,
                  state: loc.state,
                  autoHydrated: true
                },
                kycDocuments: [
                  {
                    documentId: toDeterministicUuid(`doc-med-${partnerId}`),
                    documentName: 'Medical_Registration_Council.pdf',
                    documentType: 'CLINICAL_ESTABLISHMENT_LICENSE',
                    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                    uploadedAt: new Date().toISOString()
                  }
                ]
              })
              .onConflictDoNothing();
          } else if (existingStaged.id === partnerId || existingStaged.status === 'APPROVED') {
            const currentPayload = (existingStaged.registrationPayload as Record<string, any>) || {};
            await db
              .update(partnerOnboardingStagedRegistrations)
              .set({
                status: 'APPROVED',
                registrationPayload: {
                  ...currentPayload,
                  partnerType,
                  operatingMode: effectiveOperatingMode,
                  city: loc.city,
                  state: loc.state
                },
                approvedAt: new Date(),
                updatedAt: new Date()
              })
              .where(eq(partnerOnboardingStagedRegistrations.id, existingStaged.id));
          }

          // D. Ensure Subscription & Commercial Software License in company.licenses
          const { planId, productId, maxConcurrentUsers, maxDoctors, maxBranches } = resolveVerticalPlan(
            partner.assignedPlan,
            partner.requestedPlan,
            partnerType,
            planTier
          );

          const subscriptionId = toDeterministicUuid(`sub-${tenantId}`);
          const licenseKey = `LIC-2026-${partnerType.substring(0, 4).toUpperCase()}-${tenantId.substring(0, 8).toUpperCase()}`;
          const startDate = new Date();
          const expiryDate = new Date(Date.now() + 365 * 24 * 3600 * 1000);
          const gracePeriodEnd = new Date(Date.now() + 380 * 24 * 3600 * 1000);

          // Check if subscription exists
          const [existingSub] = await db
            .select({ id: subscriptions.id })
            .from(subscriptions)
            .where(or(eq(subscriptions.id, subscriptionId), eq(subscriptions.partnerId, targetProfileId)))
            .limit(1);

          const effectiveSubscriptionId = existingSub?.id || subscriptionId;
          const signature = licenseService.signLicensePayload({
            licenseKey,
            partnerId: targetProfileId,
            tenantId,
            subscriptionId: effectiveSubscriptionId,
            planId,
            expiryDate: expiryDate.toISOString()
          });

          if (!existingSub) {
            await db
              .insert(subscriptions)
              .values({
                id: subscriptionId,
                partnerId: targetProfileId,
                productId,
                planId,
                planVersion: '1.0.0',
                status: 'ACTIVE',
                billingCycle: 'ANNUAL',
                startDate,
                renewalDate: expiryDate,
                endDate: expiryDate,
                metadata: { autoHydrated: true, planTier, partnerType, operatingMode: effectiveOperatingMode, assignedPlan: partner.assignedPlan || null }
              })
              .onConflictDoNothing();
          } else {
            await db
              .update(subscriptions)
              .set({
                productId,
                planId,
                status: 'ACTIVE',
                endDate: expiryDate,
                renewalDate: expiryDate,
                metadata: { autoHydrated: true, planTier, partnerType, operatingMode: effectiveOperatingMode, assignedPlan: partner.assignedPlan || null },
                updatedAt: new Date()
              })
              .where(eq(subscriptions.id, existingSub.id));
          }

          // Check if license exists
          const [existingLicense] = await db
            .select({ id: licenses.id })
            .from(licenses)
            .where(or(eq(licenses.tenantId, tenantId), eq(licenses.partnerId, targetProfileId)))
            .limit(1);

          if (!existingLicense) {
            await db
              .insert(licenses)
              .values({
                id: toDeterministicUuid(`lic-${tenantId}`),
                licenseKey,
                partnerId: targetProfileId,
                tenantId,
                subscriptionId: effectiveSubscriptionId,
                planId,
                licenseType: 'COMMERCIAL',
                status: 'ACTIVE',
                activationStatus: 'ACTIVATED',
                maxConcurrentUsers,
                maxDoctors,
                maxBranches,
                issuedAt: startDate,
                startDate,
                expiryDate,
                gracePeriodEnd,
                signature,
                metadata: { autoHydrated: true, planTier, partnerType, operatingMode: effectiveOperatingMode, assignedPlan: partner.assignedPlan || null }
              })
              .onConflictDoNothing();
          } else {
            await db
              .update(licenses)
              .set({
                licenseKey,
                partnerId: targetProfileId,
                tenantId,
                subscriptionId: effectiveSubscriptionId,
                planId,
                status: 'ACTIVE',
                activationStatus: 'ACTIVATED',
                maxConcurrentUsers,
                maxDoctors,
                maxBranches,
                expiryDate,
                gracePeriodEnd,
                signature,
                metadata: { autoHydrated: true, planTier, partnerType, operatingMode: effectiveOperatingMode, assignedPlan: partner.assignedPlan || null },
                updatedAt: new Date()
              })
              .where(eq(licenses.id, existingLicense.id));
          }

          // Invalidate cache so live entitlements take effect immediately
          entitlementService.invalidateTenantCache(tenantId);

          // Automatically execute deterministic idempotent Partner Configuration Initialization (Phase 2)
          try {
            const { partnerConfigurationEngineService } = await import('../partner/PartnerConfigurationEngineService.js');
            await partnerConfigurationEngineService.initializePartnerConfiguration(
              {
                userId: targetProfileId,
                tenantId,
                roles: ['PARTNER_ADMIN'] as any,
                permissions: [] as any,
                actorEmail: email || `admin@${tenantId.substring(0, 8)}.partner.local`
              } as any,
              {
                source: 'HQ_APPROVAL',
                reason: 'Automatic idempotent partner configuration initialization on HQ approval'
              }
            );
          } catch (cfgInitErr) {
            logger.warn(`Non-fatal partner configuration auto-init notice for ${email}: ${String(cfgInitErr)}`);
          }

          syncedCount++;
        } catch (partnerErr) {
          logger.warn(`Failed to synchronize partner ${email} to DB: ${String(partnerErr)}`);
          errors.push({ email, error: String(partnerErr) });
        }
      }

      logger.info(`Synchronized ${syncedCount} approved partner(s) to PostgreSQL database.`);
    } catch (err) {
      logger.error('Error during partner auto-hydration sync: ' + String(err));
      errors.push({ general: String(err) });
    } finally {
      this.isSyncing = false;
    }

    return { syncedCount, errors };
  }
}

export const partnerSyncService = new PartnerSyncService();
