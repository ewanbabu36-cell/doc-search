import React, { useState, useEffect } from 'react';
import { Badge, Button, Card } from '@docsearch/ui-kit';
import { partnerService } from '../../services/partner-service.js';
import { salesMarketingService } from '../../services/sales-marketing-service.js';

export interface PipelineStageInfo {
  stageNumber: number;
  stageKey: 'LEAD_CAPTURE' | 'ENTITY_PROFILE' | 'REGULATORY_KYC' | 'BANK_AND_PLAN' | 'MSA_AND_LIVE';
  stageTitle: string;
  stageSubtitle: string;
  formName: string;
  badgeColor: 'neutral' | 'primary' | 'warning' | 'success';
  requiredFields: string[];
  documentsRequired: string[];
  automationRole: string;
}

export interface PipelineEntity {
  id: string;
  name: string;
  classification: string;
  icon: string;
  contactPerson: string;
  phone: string;
  currentStage: number; // 1 to 5
  progressPercent: number;
  activeForm: string;
  city: string;
  lastUpdated: string;
}

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    stageNumber: 1,
    stageKey: 'LEAD_CAPTURE',
    stageTitle: 'Lead Capture & Inquiry',
    stageSubtitle: 'Stage 1: Lead capture and preliminary facility inquiry',
    formName: 'Form 1: Lead Intake Form',
    badgeColor: 'neutral',
    requiredFields: ['Facility / Clinic Name', 'Key Doctor / Contact Person', 'Phone Number', 'Email Address', 'Lead Source'],
    documentsRequired: ['None (Visiting card / WhatsApp text optional)'],
    automationRole: 'AI Voice Direct Speech / Natural Language Autofill'
  },
  {
    stageNumber: 2,
    stageKey: 'ENTITY_PROFILE',
    stageTitle: 'Organization & Branch Setup',
    stageSubtitle: 'Stage 2: Entity profile, branch count, and facility categorization',
    formName: 'Form 2: Organization Profile Form',
    badgeColor: 'primary',
    requiredFields: ['Legal Entity Name', 'Brand / Trade Name', 'Partner Classification (Hospital/Pharmacy/Clinic)', 'Branch Count', 'City, State, PIN'],
    documentsRequired: ['Address Proof (Electricity Bill / Rent Agreement)'],
    automationRole: 'Auto-categorization & MCA Company Name Match'
  },
  {
    stageNumber: 3,
    stageKey: 'REGULATORY_KYC',
    stageTitle: 'Regulatory KYC & Compliance',
    stageSubtitle: 'Stage 3: Legal credentials, clinical establishment license & KYC verification',
    formName: 'Form 3: Regulatory KYC & License Form',
    badgeColor: 'warning',
    requiredFields: ['GSTIN Number', 'Entity PAN Number', 'Medical Superintendent NMC Registration', 'Drug License Form 20/21 No.'],
    documentsRequired: ['Drug License Form 20/21 (for Pharmacy)', 'Clinical Establishment License', 'GST Certificate PDF', 'NABH / NABL Accreditation'],
    automationRole: 'AI OCR Document Scanner & State Medical Council Reg Verification'
  },
  {
    stageNumber: 4,
    stageKey: 'BANK_AND_PLAN',
    stageTitle: 'Commercial Plan & Banking',
    stageSubtitle: 'Stage 4: Commercial subscription plan selection & penny-drop banking',
    formName: 'Form 4: Commercial Subscription & Payout Form',
    badgeColor: 'primary',
    requiredFields: ['Bank Name', 'Account Number', 'IFSC Code', 'Beneficiary Legal Name', 'Selected Subscription Plan (Silver/Gold/Custom)'],
    documentsRequired: ['Bank Cancelled Cheque / Bank Passbook Copy'],
    automationRole: 'Instant Penny-Drop Bank Account Verification & Automated Payout Split'
  },
  {
    stageNumber: 5,
    stageKey: 'MSA_AND_LIVE',
    stageTitle: 'Digital MSA & Production Go-Live',
    stageSubtitle: 'Stage 5: Digital Master Service Agreement e-sign & live production activation',
    formName: 'Form 5: Master Service Agreement & ABDM Activation',
    badgeColor: 'success',
    requiredFields: ['Signatory Aadhaar / PAN for e-Sign', 'ABDM Health Facility Registry (HFR) ID', 'Admin Portal Access Email', 'Go-Live Date'],
    documentsRequired: ['Digitally e-Signed MSA Agreement (SHA-256 Hash Attached)'],
    automationRole: 'Aadhaar OTP e-Sign & National ABDM 2.0 Gateway Token Generation'
  }
];

const loadDynamicPipelineEntities = (): PipelineEntity[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('docsearch_pipeline_leads');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Inbound VIP Demo requests from Landing Page
    const demoLeads = JSON.parse(localStorage.getItem('docsearch_demo_requests') || '[]');
    const demoEntities: PipelineEntity[] = Array.isArray(demoLeads) ? demoLeads.map((d: any, idx: number) => ({
      id: d.id || `DEMO-${idx + 1}`,
      name: d.hospitalName || 'Prospective Hospital',
      classification: 'Hospital Network',
      icon: '🏥',
      contactPerson: d.contactName || 'Medical Director',
      phone: d.phone || '+91 98000 00000',
      currentStage: 1,
      progressPercent: 20,
      activeForm: `Form 1: Lead Intake (VIP Token: ${d.demoToken || 'VIP-INBOUND'})`,
      city: d.bedCapacity || 'India',
      lastUpdated: 'Inbound Web Demo'
    })) : [];

    // Automatically derive from live registered partners
    const regPartners = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
    const partnerEntities: PipelineEntity[] = Array.isArray(regPartners) ? regPartners.map((p: any, idx: number) => {
      const isVerified = p.kycStatus === 'KYC_VERIFIED';
      return {
        id: p.id || `PIPE-${idx + 1}`,
        name: p.facilityName || 'Healthcare Facility',
        classification: p.facilityType === 'PATHOLOGY' ? 'Diagnostic Lab' : p.facilityType === 'CLINIC' ? 'Independent Clinic' : p.facilityType === 'PHARMACY' ? 'Pharmacy' : 'Hospital Network',
        icon: p.facilityType === 'PATHOLOGY' ? '🧪' : p.facilityType === 'CLINIC' ? '🩺' : p.facilityType === 'PHARMACY' ? '💊' : '🏥',
        contactPerson: p.name || 'Owner Doctor',
        phone: p.phone || '+91 98000 00000',
        currentStage: isVerified ? 5 : 3,
        progressPercent: isVerified ? 100 : 60,
        activeForm: isVerified ? 'Form 5: Master Service Agreement (Completed & Live)' : 'Form 3: Regulatory KYC & License Form',
        city: p.city || 'India',
        lastUpdated: 'Just now'
      };
    }) : [];

    return [...demoEntities, ...partnerEntities];
  } catch {
    return [];
  }
};

export const LeadToPartnerPipelineView: React.FC = () => {
  const [entities, setEntities] = useState<PipelineEntity[]>(loadDynamicPipelineEntities);
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(1);
  const [stageActionNotice, setStageActionNotice] = useState<string | null>(null);

  // Load real PostgreSQL entities and map to 5-stage pipeline
  useEffect(() => {
    const fetchLiveEntities = async () => {
      try {
        const [dir, rawLeads] = await Promise.all([
          partnerService.getDirectory({ pageSize: 100 }).catch(() => null),
          salesMarketingService.getLeads().catch(() => [])
        ]);

        const liveEntities: PipelineEntity[] = (dir && Array.isArray(dir.items))
          ? dir.items.map((item) => {
              const isApproved = item.kycStatus === 'APPROVED' || item.lifecycleStatus === 'ACTIVE';
              const isResubmitted = item.kycStatus === 'RESUBMITTED';
              const isActionReq = item.kycStatus === 'ADDITIONAL_INFORMATION_REQUIRED';
              const isUnderReview = item.kycStatus === 'UNDER_REVIEW';

              let stage = 1;
              let percent = 20;
              let formName = 'Form 1: Lead Intake & Ingestion';

              if (isApproved) {
                stage = 5;
                percent = 100;
                formName = 'Form 5: Master Service Agreement (Completed & Live)';
              } else if (isResubmitted) {
                stage = 4;
                percent = 80;
                formName = 'Form 4: Commercial Subscription & Payout Form';
              } else if (isActionReq) {
                stage = 3;
                percent = 60;
                formName = 'Form 3: Regulatory KYC & Clarification';
              } else if (isUnderReview) {
                stage = 2;
                percent = 40;
                formName = 'Form 2: Organization Profile & Review';
              }

              const cls = String(item.partnerType || '').toUpperCase();
              const icon = cls.includes('LAB') || cls.includes('PATHOLOGY') ? '🧪' : cls.includes('CLINIC') ? '🩺' : cls.includes('PHARMACY') ? '💊' : '🏥';

              return {
                id: item.id,
                name: item.tradeName || item.legalName,
                classification: item.partnerType,
                icon,
                contactPerson: item.primaryContact?.name || 'Authorized Contact',
                phone: item.primaryContact?.phone || '+91 98000 00000',
                currentStage: stage,
                progressPercent: percent,
                activeForm: formName,
                city: item.city || 'India',
                lastUpdated: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'Live'
              };
            })
          : [];

        const dbLeads: PipelineEntity[] = (rawLeads || []).map((ld) => {
          let stage = 1;
          let percent = 20;
          let formName = 'Form 1: Lead Intake Form';
          if (ld.status === 'CONVERTED') {
            stage = 5;
            percent = 100;
            formName = 'Form 5: Master Service Agreement (Live)';
          } else if (ld.status === 'DISCOVERY' || ld.status === 'QUALIFIED') {
            stage = 2;
            percent = 40;
            formName = 'Form 2: Organization Profile & Discovery';
          } else if (ld.status === 'CONTACTED') {
            stage = 3;
            percent = 60;
            formName = 'Form 3: Regulatory KYC & Clarification';
          }
          return {
            id: ld.id,
            name: ld.organizationName,
            classification: 'Independent Clinic',
            icon: '🩺',
            contactPerson: ld.contactName,
            phone: ld.contactPhone || '+91 98000 00000',
            currentStage: stage,
            progressPercent: percent,
            activeForm: formName,
            city: 'India',
            lastUpdated: ld.createdAt ? new Date(ld.createdAt).toLocaleDateString('en-IN') : 'Live Lead'
          };
        });

        // Merge with any manual scratch demo leads
        let saved: PipelineEntity[] = [];
        if (typeof window !== 'undefined') {
          try {
            saved = JSON.parse(localStorage.getItem('docsearch_pipeline_leads') || '[]');
          } catch {}
        }
        const seen = new Set<string>();
        const combined = [...dbLeads, ...liveEntities, ...saved].filter((e) => {
          if (seen.has(e.id)) return false;
          seen.add(e.id);
          return true;
        });
        if (combined.length > 0) {
          setEntities(combined);
        }
      } catch (err) {
        console.warn('Could not load live pipeline entities:', err);
      }
    };
    void fetchLiveEntities();
  }, []);

  // New Lead Quick Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadClassification, setNewLeadClassification] = useState('Independent Clinic');
  const [newLeadContact, setNewLeadContact] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCity, setNewLeadCity] = useState('');

  // Persist entities whenever they change
  const saveEntities = (updated: PipelineEntity[]) => {
    setEntities(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_pipeline_leads', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) return;

    try {
      const created = await salesMarketingService.createLead({
        organizationName: newLeadName.trim(),
        contactName: newLeadContact.trim() || 'Lead Contact',
        contactEmail: `${newLeadName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')}@prospect.in`,
        contactPhone: newLeadPhone.trim() || '+91 98000 00000',
        source: 'INBOUND_WEB',
        status: 'NEW',
        assignedOwnerEmail: 'sales.lead@docsearch.internal'
      });

      const newLead: PipelineEntity = {
        id: created.id,
        name: created.organizationName,
        classification: newLeadClassification,
        icon: newLeadClassification.includes('Lab') ? '🧪' : newLeadClassification.includes('Clinic') ? '🩺' : newLeadClassification.includes('Pharmacy') ? '💊' : '🏥',
        contactPerson: created.contactName,
        phone: created.contactPhone || '+91 98000 00000',
        currentStage: 1,
        progressPercent: 20,
        activeForm: 'Form 1: Lead Intake Form',
        city: newLeadCity.trim() || 'India',
        lastUpdated: 'Just added'
      };

      // Also register into docsearch_registered_partners & partnerService for immediate CRM directory sync
      const orgType =
        newLeadClassification.includes('Hospital') ? 'HOSPITAL' :
        newLeadClassification.includes('Lab') ? 'PATHOLOGY' :
        newLeadClassification.includes('Pharmacy') ? 'PHARMACY' : 'CLINIC';

      const partnerType =
        orgType === 'HOSPITAL' ? 'HOSPITAL_NETWORK' :
        orgType === 'PATHOLOGY' ? 'DIAGNOSTIC_LAB' :
        orgType === 'PHARMACY' ? 'PHARMACY' : 'CLINIC_GROUP';

      try {
        const reg = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
        const newReg = {
          id: created.id,
          facilityName: created.organizationName,
          tradeName: created.organizationName,
          legalName: created.organizationName,
          name: created.contactName,
          contactPerson: created.contactName,
          email: created.contactEmail,
          phone: created.contactPhone,
          organizationType: orgType,
          partnerType,
          planTier: 'Enterprise Healthcare Partner',
          monthlyFee: 0,
          status: 'APPROVED',
          lifecycleStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          kycStatus: 'KYC_VERIFIED',
          onboardingStep: 'COMPLETED',
          onboardingProgressPercent: 100,
          city: newLeadCity.trim() || 'India',
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('docsearch_registered_partners', JSON.stringify([newReg, ...reg.filter((p: any) => p.id !== created.id)]));

        partnerService.addPartner({
          id: created.id,
          tenantId: created.id,
          tenantSlug: created.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          legalName: created.organizationName,
          tradeName: created.organizationName,
          partnerType: partnerType as any,
          lifecycleStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          onboardingStep: 'COMPLETED',
          onboardingProgressPercent: 100,
          primaryContact: {
            name: created.contactName,
            email: created.contactEmail,
            phone: created.contactPhone,
            roleTitle: 'Partner Director'
          },
          branchCount: 1,
          userCount: 5,
          metadata: {
            classification: orgType,
            city: newLeadCity.trim() || 'India',
            planTier: 'Enterprise Healthcare Partner',
            monthlyFee: 0,
            loginUrl: `http://localhost:5173/${orgType === 'HOSPITAL' ? 'hospital' : orgType === 'PHARMACY' ? 'pharmacy' : orgType === 'PATHOLOGY' ? 'pathology' : 'clinic'}`
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('docsearch:partner_registered', { detail: newReg }));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (syncErr) {
        console.warn('Pipeline lead partner sync note:', syncErr);
      }

      saveEntities([newLead, ...entities]);
      setIsAddModalOpen(false);
      setNewLeadName('');
      setNewLeadContact('');
      setNewLeadPhone('');
      setNewLeadCity('');
      setStageActionNotice(`✓ Lead "${newLead.name}" added & synced to CRM Partner Directory!`);
      setTimeout(() => setStageActionNotice(null), 4000);
    } catch (err) {
      console.error('Failed to create lead in pipeline:', err);
    }
  };

  const handleQuickOnboardToDirectory = (ent: PipelineEntity) => {
    const orgType =
      ent.classification.includes('Hospital') ? 'HOSPITAL' :
      ent.classification.includes('Lab') ? 'PATHOLOGY' :
      ent.classification.includes('Pharmacy') ? 'PHARMACY' : 'CLINIC';

    const partnerType =
      orgType === 'HOSPITAL' ? 'HOSPITAL_NETWORK' :
      orgType === 'PATHOLOGY' ? 'DIAGNOSTIC_LAB' :
      orgType === 'PHARMACY' ? 'PHARMACY' : 'CLINIC_GROUP';

    const cleanEmail = `${ent.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')}@partner.in`;

    const partnerDto = {
      id: ent.id,
      tenantId: ent.id,
      tenantSlug: ent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      legalName: ent.name,
      tradeName: ent.name,
      partnerType: partnerType as any,
      lifecycleStatus: 'ACTIVE' as any,
      verificationStatus: 'VERIFIED' as any,
      onboardingStep: 'COMPLETED' as any,
      onboardingProgressPercent: 100,
      primaryContact: {
        name: ent.contactPerson,
        email: cleanEmail,
        phone: ent.phone,
        roleTitle: 'Partner Director'
      },
      branchCount: 1,
      userCount: 5,
      metadata: {
        classification: orgType,
        city: ent.city,
        planTier: 'Enterprise 1st Year Free',
        monthlyFee: 0,
        loginUrl: `http://localhost:5173/${orgType === 'HOSPITAL' ? 'hospital' : orgType === 'PHARMACY' ? 'pharmacy' : orgType === 'PATHOLOGY' ? 'pathology' : 'clinic'}`
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    partnerService.addPartner(partnerDto);

    try {
      const reg = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
      const newReg = {
        id: ent.id,
        facilityName: ent.name,
        tradeName: ent.name,
        legalName: ent.name,
        name: ent.contactPerson,
        contactPerson: ent.contactPerson,
        email: cleanEmail,
        phone: ent.phone,
        organizationType: orgType,
        partnerType,
        planTier: 'Enterprise 1st Year Free',
        monthlyFee: 0,
        status: 'APPROVED',
        lifecycleStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        kycStatus: 'KYC_VERIFIED',
        onboardingStep: 'COMPLETED',
        onboardingProgressPercent: 100,
        city: ent.city,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('docsearch_registered_partners', JSON.stringify([newReg, ...reg.filter((p: any) => p.id !== ent.id)]));
    } catch {}

    // Advance entity to stage 5
    setEntities((prev) =>
      prev.map((e) =>
        e.id === ent.id
          ? { ...e, currentStage: 5, progressPercent: 100, activeForm: 'Form 5: Master Service Agreement (Completed & Live)' }
          : e
      )
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('docsearch:partner_registered', { detail: partnerDto }));
      window.dispatchEvent(new Event('storage'));
    }

    setStageActionNotice(`✓ "${ent.name}" is now 100% LIVE and synced to CRM Partner Directory!`);
    setTimeout(() => setStageActionNotice(null), 5000);
  };

  const selectedStage = (PIPELINE_STAGES.find((s) => s.stageNumber === selectedStageNumber) || PIPELINE_STAGES[0]) as PipelineStageInfo;

  const handleAdvanceEntity = (entityId: string) => {
    let advancedToFive = false;
    setEntities((prev) =>
      prev.map((e) => {
        if (e.id === entityId) {
          const nextStage = Math.min(e.currentStage + 1, 5);
          if (nextStage === 5) advancedToFive = true;
          const nextStageInfo = PIPELINE_STAGES.find((s) => s.stageNumber === nextStage);
          return {
            ...e,
            currentStage: nextStage,
            progressPercent: nextStage * 20,
            activeForm: nextStageInfo ? nextStageInfo.formName : e.activeForm,
            lastUpdated: 'Just updated'
          };
        }
        return e;
      })
    );
    const ent = entities.find((e) => e.id === entityId);
    if (advancedToFive && ent) {
      handleQuickOnboardToDirectory(ent);
    } else {
      setStageActionNotice(`✓ "${ent?.name}" successfully advanced to Stage ${Math.min((ent?.currentStage || 1) + 1, 5)}!`);
      setTimeout(() => setStageActionNotice(null), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #06B6D4',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 30px rgba(6, 182, 212, 0.15)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>🔄</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Lead-to-Partner Live Onboarding Pipeline
                </h2>
                <Badge variant="primary">5 Total Forms & Stages</Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                Comprehensive stage-by-stage onboarding tracker and form workflow from initial lead intake to 100% live partner activation.
              </p>
            </div>
          </div>
        </div>

        {/* Global Pipeline Metrics & Add Lead Action */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>TOTAL IN PIPELINE</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8' }}>{entities.length} Partners</div>
          </div>
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #10B981', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 700 }}>100% LIVE & ACTIVE</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
              {entities.filter((e) => e.currentStage === 5).length} Live
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Quick Add Lead
          </Button>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #06B6D4',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                ➕ Add New Facility to Onboarding Pipeline
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                  FACILITY / CLINIC / LAB NAME *
                </label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Metro Care Clinic, LifeLine Diagnostics"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    backgroundColor: '#1E293B',
                    color: '#F8FAFC',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    FACILITY TYPE
                  </label>
                  <select
                    value={newLeadClassification}
                    onChange={(e) => setNewLeadClassification(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      backgroundColor: '#1E293B',
                      color: '#F8FAFC',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="Independent Clinic">Independent Clinic</option>
                    <option value="Diagnostic Lab">Diagnostic Lab</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Hospital Network">Hospital Network</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    CITY
                  </label>
                  <input
                    type="text"
                    value={newLeadCity}
                    onChange={(e) => setNewLeadCity(e.target.value)}
                    placeholder="e.g. Mumbai, Delhi"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      backgroundColor: '#1E293B',
                      color: '#F8FAFC',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    CONTACT DOCTOR / REP
                  </label>
                  <input
                    type="text"
                    value={newLeadContact}
                    onChange={(e) => setNewLeadContact(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      backgroundColor: '#1E293B',
                      color: '#F8FAFC',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    PHONE NUMBER (10-DIGIT MOBILE)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '10px', color: '#38BDF8', fontWeight: 800, fontSize: '0.8125rem' }}>+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={newLeadPhone}
                      onChange={(e) => {
                        let digits = e.target.value.replace(/\D/g, '');
                        if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                        else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                        setNewLeadPhone(digits.slice(0, 10));
                      }}
                      placeholder="98765 43210"
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 44px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        backgroundColor: '#1E293B',
                        color: '#F8FAFC',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" >
                  Add to Stage 1
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stageActionNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '10px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {stageActionNotice}
        </div>
      )}

      {/* 5-Stage Stepper Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        {PIPELINE_STAGES.map((s) => {
          const isSelected = selectedStageNumber === s.stageNumber;
          const countAtStage = entities.filter((e) => e.currentStage === s.stageNumber).length;

          return (
            <div
              key={s.stageNumber}
              onClick={() => setSelectedStageNumber(s.stageNumber)}
              style={{
                backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : '#1E293B',
                border: isSelected ? '2px solid #06B6D4' : '1px solid #334155',
                borderRadius: '12px',
                padding: '12px 14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 15px rgba(6, 182, 212, 0.3)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: isSelected ? '#38BDF8' : '#94A3B8' }}>
                  STAGE {s.stageNumber} OF 5
                </span>
                <span
                  style={{
                    backgroundColor: countAtStage > 0 ? (s.stageNumber === 5 ? '#10B981' : '#06B6D4') : '#334155',
                    color: '#070C16',
                    fontSize: '0.6875rem',
                    fontWeight: 900,
                    padding: '1px 7px',
                    borderRadius: '10px'
                  }}
                >
                  {countAtStage} Leads
                </span>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                {s.stageTitle}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>
                {s.formName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Deep-Dive Form & Requirements Inspector */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '14px',
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#38BDF8' }}>
                📋 {selectedStage.formName}: {selectedStage.stageSubtitle}
              </h3>
              <Badge variant="primary">Stage {selectedStage.stageNumber}</Badge>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              The onboarding provider or sales representative must fulfill the following fields and verifications:
            </p>
          </div>
          <Badge variant={selectedStage.stageNumber === 5 ? 'success' : 'warning'}>
            ⚡ AI Role: {selectedStage.automationRole}
          </Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Form Fields Required */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
              📝 Required Form Inputs:
            </span>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px', color: '#E2E8F0', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {selectedStage.requiredFields.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          {/* Documents Required */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FCD34D', textTransform: 'uppercase' }}>
              📑 Mandatory Documents for this Stage:
            </span>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px', color: '#E2E8F0', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {selectedStage.documentsRequired.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Live Partners Across Pipeline Kanban / List */}
      <Card title="🚀 All Active Leads & Partners Moving Through Pipeline" padding="none">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                <th style={{ padding: '12px 16px' }}>PARTNER / LEAD ENTITY</th>
                <th style={{ padding: '12px 16px' }}>CURRENT STAGE & PROGRESS</th>
                <th style={{ padding: '12px 16px' }}>ACTIVE REQUIRED FORM</th>
                <th style={{ padding: '12px 16px' }}>CONTACT PERSON</th>
                <th style={{ padding: '12px 16px' }}>CITY</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>STAGE ACTION</th>
              </tr>
            </thead>
            <tbody>
              {entities.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '2.5rem' }}>📭</span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                        No Active Leads or Pipeline Partners Yet
                      </span>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8', maxWidth: '400px' }}>
                        When a doctor or facility self-registers on the Landing Page, or when you click "+ Quick Add Lead" above, they will show up here dynamically.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                entities.map((e) => {
                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#0F172A' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.25rem' }}>{e.icon}</span>
                        <div>
                          <span style={{ fontWeight: 800, color: '#F8FAFC', display: 'block' }}>{e.name}</span>
                          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{e.classification}</span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 800, color: e.currentStage === 5 ? '#10B981' : '#38BDF8' }}>
                            Stage {e.currentStage} of 5
                          </span>
                          <span style={{ color: '#94A3B8' }}>{e.progressPercent}%</span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: '6px', backgroundColor: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${e.progressPercent}%`,
                              height: '100%',
                              backgroundColor: e.currentStage === 5 ? '#10B981' : '#06B6D4',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <Badge variant={e.currentStage === 5 ? 'success' : e.currentStage >= 3 ? 'warning' : 'primary'}>
                        {e.activeForm}
                      </Badge>
                    </td>

                    <td style={{ padding: '14px 16px', color: '#CBD5E1' }}>
                      <div>{e.contactPerson}</div>
                      <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>{e.phone}</span>
                    </td>

                    <td style={{ padding: '14px 16px', color: '#94A3B8' }}>
                      {e.city}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {e.currentStage === 5 ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#10B981', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ 100% Live
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('docsearch:navigate_directory'));
                              }
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              backgroundColor: '#0284C7',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Open CRM Partner Master Directory"
                          >
                            <span>🏢</span> View in Directory ➔
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAdvanceEntity(e.id)}
                          >
                            Fill Next Form ➔
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleQuickOnboardToDirectory(e)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              backgroundColor: '#10B981',
                              color: '#022C22',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Instantly onboard to CRM Partner Directory"
                          >
                            <span>⚡</span> Onboard Live
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
