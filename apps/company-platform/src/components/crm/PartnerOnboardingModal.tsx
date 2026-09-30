import React from 'react';
import type { PartnerType, PartnerProfileDto } from '@docsearch/api-contracts';
import { partnerService } from '../../services/partner-service.js';
import {
  UniversalPartnerOnboardingWizard,
  type ActivationResult,
  type HealthcareCategoryType
} from './PathologyPartnerOnboardingWizard.js';

export type DocumentCategory =
  | 'REGULATORY_DRUG_LICENSE'
  | 'NABH_HOSPITAL_ACCREDITATION'
  | 'CLINICAL_ESTABLISHMENT_LICENSE'
  | 'NABL_PATHOLOGY_ACCREDITATION'
  | 'GST_PAN_CERTIFICATE'
  | 'NON_DOCUMENT_PHOTO_REJECTED';

export interface DocumentClassificationResult {
  isDocument: boolean;
  confidence: number;
  docCategory: DocumentCategory;
  categoryLabel: string;
  badgeVariant: 'success' | 'warning' | 'danger' | 'primary';
  title: string;
  description: string;
  reasons: string[];
  extractedEntity?: {
    legalName?: string;
    tradeName?: string;
    partnerType?: PartnerType;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    branchCount?: number;
    city?: string;
    state?: string;
    gstin?: string;
    panNumber?: string;
  };
}

export interface PartnerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPartner: PartnerProfileDto) => void;
}

const mapCategoryToPartnerType = (cat: HealthcareCategoryType | string): PartnerType => {
  switch (cat) {
    case 'PHARMACY':
      return 'PHARMACY';
    case 'PATHOLOGY':
    case 'DIAGNOSTIC_CENTRE':
      return 'DIAGNOSTIC_LAB';
    case 'CLINIC':
    case 'DENTAL_CLINIC':
    case 'AYUSH_WELLNESS':
    case 'EYE_CARE':
    case 'PHYSIOTHERAPY':
      return 'CLINIC_GROUP';
    case 'DIALYSIS_CENTRE':
    case 'BLOOD_BANK':
    case 'HOSPITAL':
    default:
      return 'HOSPITAL_NETWORK';
  }
};

export const PartnerOnboardingModal: React.FC<PartnerOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  const handleComplete = (res: ActivationResult) => {
    const partnerDto: PartnerProfileDto = {
      id: res.partnerId,
      tenantId: res.partnerId,
      tenantSlug: res.partnerName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      legalName: res.partnerName,
      tradeName: res.partnerName,
      partnerType: mapCategoryToPartnerType(res.classification),
      lifecycleStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      onboardingStep: 'COMPLETED',
      onboardingProgressPercent: 100,
      primaryContact: {
        name: res.contactPerson,
        email: res.credentials?.userId || 'admin@docsearch.health',
        phone: res.phone,
        roleTitle: res.credentials?.role || 'Administrator'
      },
      branchCount: 1,
      userCount: 5,
      metadata: {
        city: res.city,
        planTier: res.subscriptionPlan?.tier,
        monthlyFee: res.subscriptionPlan?.monthlyFee,
        activeFeatures: res.subscriptionPlan?.activeFeatures,
        temporaryPassword: res.credentials?.temporaryPassword,
        loginUrl: res.credentials?.loginUrl,
        activationVoucher: res.partnerId
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Cache in in-memory partnerService
    partnerService.addPartner(partnerDto);

    // Save to docsearch_registered_partners for offline & multi-view synchronization
    try {
      const existing = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
      const newEntry = {
        id: res.partnerId,
        facilityName: res.partnerName,
        tradeName: res.partnerName,
        name: res.contactPerson,
        contactPerson: res.contactPerson,
        email: res.credentials?.userId,
        phone: res.phone,
        organizationType: res.classification,
        planTier: res.subscriptionPlan?.tier,
        monthlyFee: res.subscriptionPlan?.monthlyFee,
        features: res.subscriptionPlan?.activeFeatures,
        status: 'APPROVED',
        lifecycleStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        city: res.city,
        credentials: res.credentials
      };
      const updated = [newEntry, ...existing.filter((p: any) => p.email !== res.credentials?.userId && p.id !== res.partnerId)];
      localStorage.setItem('docsearch_registered_partners', JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not sync to local storage:', err);
    }

    onSuccess(partnerDto);
  };

  return (
    <div style={{ width: '100%', minHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
      <UniversalPartnerOnboardingWizard
        onComplete={handleComplete}
        onClose={onClose}
        isModal={false}
      />
    </div>
  );
};
