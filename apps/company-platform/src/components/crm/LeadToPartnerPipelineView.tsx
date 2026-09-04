import React, { useState } from 'react';
import { Badge, Button, Card } from '@docsearch/ui-kit';

export interface PipelineStageInfo {
  stageNumber: number;
  stageKey: 'LEAD_CAPTURE' | 'ENTITY_PROFILE' | 'REGULATORY_KYC' | 'BANK_AND_PLAN' | 'MSA_AND_LIVE';
  stageTitle: string;
  stageHindi: string;
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
    stageHindi: 'स्टेज 1: लीड कैप्चर व प्राथमिक जानकारी',
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
    stageHindi: 'स्टेज 2: संस्था प्रोफ़ाइल व वर्गीकरण',
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
    stageHindi: 'स्टेज 3: दस्तावेज़ व लाइसेंस सत्यापन (KYC)',
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
    stageHindi: 'स्टेज 4: कमर्शियल प्लान व बैंक खाता',
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
    stageHindi: 'स्टेज 5: डिजिटल अनुबंध व 100% लाइव एक्टिवेशन',
    formName: 'Form 5: Master Service Agreement & ABDM Activation',
    badgeColor: 'success',
    requiredFields: ['Signatory Aadhaar / PAN for e-Sign', 'ABDM Health Facility Registry (HFR) ID', 'Admin Portal Access Email', 'Go-Live Date'],
    documentsRequired: ['Digitally e-Signed MSA Agreement (SHA-256 Hash Attached)'],
    automationRole: 'Aadhaar OTP e-Sign & National ABDM 2.0 Gateway Token Generation'
  }
];

const INITIAL_ENTITIES: PipelineEntity[] = [
  {
    id: 'PIPE-001',
    name: 'Dr. Verma Heart Clinic',
    classification: 'Independent Clinic',
    icon: '🩺',
    contactPerson: 'Dr. A.K. Verma',
    phone: '+91 98765 43210',
    currentStage: 1,
    progressPercent: 20,
    activeForm: 'Form 1: Lead Intake Form',
    city: 'Lucknow',
    lastUpdated: '10 mins ago'
  },
  {
    id: 'PIPE-002',
    name: 'City Diagnostic & Pathology Lab',
    classification: 'Diagnostic Lab',
    icon: '🔬',
    contactPerson: 'Dr. Neha Kapoor',
    phone: '+91 98990 01122',
    currentStage: 2,
    progressPercent: 40,
    activeForm: 'Form 2: Organization Profile Form',
    city: 'Kanpur',
    lastUpdated: '1 hour ago'
  },
  {
    id: 'PIPE-003',
    name: 'Haji Medical Agency',
    classification: 'Independent Pharmacy Store',
    icon: '💊',
    contactPerson: 'Haji Mohammad',
    phone: '+91 98123 45678',
    currentStage: 3,
    progressPercent: 60,
    activeForm: 'Form 3: Regulatory KYC & License Form',
    city: 'Lucknow',
    lastUpdated: 'Just now'
  },
  {
    id: 'PIPE-004',
    name: 'Apollo Clinic Group',
    classification: 'Clinic Group',
    icon: '⚕️',
    contactPerson: 'Dr. Priya Sen',
    phone: '+91 98111 44556',
    currentStage: 4,
    progressPercent: 80,
    activeForm: 'Form 4: Commercial Subscription & Payout Form',
    city: 'Varanasi',
    lastUpdated: 'Yesterday'
  },
  {
    id: 'PIPE-005',
    name: 'Max Super Speciality Hospital (Saket)',
    classification: 'Hospital Network',
    icon: '🏥',
    contactPerson: 'Dr. S. Mukherjee',
    phone: '+91 98111 22334',
    currentStage: 5,
    progressPercent: 100,
    activeForm: 'Form 5: Master Service Agreement (Completed & Live)',
    city: 'New Delhi',
    lastUpdated: 'Live Active'
  }
];

export const LeadToPartnerPipelineView: React.FC = () => {
  const [entities, setEntities] = useState<PipelineEntity[]>(INITIAL_ENTITIES);
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(1);
  const [stageActionNotice, setStageActionNotice] = useState<string | null>(null);

  const selectedStage = (PIPELINE_STAGES.find((s) => s.stageNumber === selectedStageNumber) || PIPELINE_STAGES[0]) as PipelineStageInfo;

  const handleAdvanceEntity = (entityId: string) => {
    setEntities((prev) =>
      prev.map((e) => {
        if (e.id === entityId) {
          const nextStage = Math.min(e.currentStage + 1, 5);
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
    setStageActionNotice(`✓ "${ent?.name}" को अगले स्टेज (${Math.min((ent?.currentStage || 1) + 1, 5)}) में सफलतापूर्वक आगे बढ़ाया गया!`);
    setTimeout(() => setStageActionNotice(null), 4000);
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
                लीड ऐड करने से लेकर पार्टनर के 100% लाइव होने तक का पूरा स्टेज-बाय-स्टेज ट्रैकर व फॉर्म गाइड।
              </p>
            </div>
          </div>
        </div>

        {/* Global Pipeline Metrics */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
        </div>
      </div>

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
                📋 {selectedStage.formName}: {selectedStage.stageHindi}
              </h3>
              <Badge variant="primary">Stage {selectedStage.stageNumber}</Badge>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              इस स्टेज में पार्टनर या सेल्स टीम को निम्नलिखित जानकारी और दस्तावेज़ भरने होते हैं:
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
              📝 फॉर्म में भरने वाली मुख्य फ़ील्ड्स (Required Form Inputs):
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
              📑 आवश्यक दस्तावेज़ (Mandatory Documents for this Stage):
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
              {entities.map((e) => {
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
                        <span style={{ color: '#10B981', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ✓ 100% Live
                        </span>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAdvanceEntity(e.id)}
                          style={{
                            backgroundColor: '#06B6D4',
                            color: '#070C16',
                            fontWeight: 800,
                            fontSize: '0.75rem'
                          }}
                        >
                          Fill Next Form ➔
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
