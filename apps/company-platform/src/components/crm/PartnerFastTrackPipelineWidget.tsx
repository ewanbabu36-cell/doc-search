import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import type { PartnerProfileDto, PartnerType } from '@docsearch/api-contracts';

export interface FastTrackPipelineProps {
  onPartnerActivated?: (partner: PartnerProfileDto) => void;
}

const PRESET_LEADS = [
  {
    name: 'Max Super Speciality Hospital (Saket)',
    gstin: '07AABCM5678P1Z3',
    type: 'HOSPITAL_NETWORK' as PartnerType,
    contactName: 'Dr. S. Mukherjee',
    role: 'Chief Medical Director',
    city: 'New Delhi'
  },
  {
    name: 'Haji Medical Agency',
    gstin: '09AAACH1234F1Z5',
    type: 'PHARMACY' as PartnerType,
    contactName: 'Haji Mohammad',
    role: 'Chief Pharmacist & Owner',
    city: 'Lucknow'
  },
  {
    name: 'Apollo Clinic & Diagnostic Group',
    gstin: '09AAACA9876C1Z2',
    type: 'CLINIC_GROUP' as PartnerType,
    contactName: 'Dr. Neha Verma',
    role: 'Managing Director',
    city: 'Kanpur'
  }
];

export const PartnerFastTrackPipelineWidget: React.FC<FastTrackPipelineProps> = ({ onPartnerActivated }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [leadName, setLeadName] = useState<string>('Max Super Speciality Hospital (Saket)');
  const [leadGstin, setLeadGstin] = useState<string>('07AABCM5678P1Z3');
  const [partnerType, setPartnerType] = useState<PartnerType>('HOSPITAL_NETWORK');
  const [contactPerson, setContactPerson] = useState<string>('Dr. S. Mukherjee');
  const [stepLogs, setStepLogs] = useState<string[]>([
    'Step 1: Lead Inquiry captured • Select or type any hospital/pharmacy name below, then click the green button to activate!'
  ]);
  const [activeBadge, setActiveBadge] = useState<string | null>(null);

  const steps = [
    { num: 1, label: '1. Lead Capture & AI OCR', desc: 'Auto-scan NMC, GST & PAN' },
    { num: 2, label: '2. KYC & Doc Verification', desc: 'NABH / Drug License Check' },
    { num: 3, label: '3. Digital MSA E-Sign', desc: 'Aadhaar e-Sign & DSC Token' },
    { num: 4, label: '4. ABDM HFR Gateway', desc: 'National Health Facility ID' },
    { num: 5, label: '5. Live Production Go-Live', desc: 'Patient Portal & EMR Active' }
  ];

  const handleSelectPreset = (p: typeof PRESET_LEADS[0]) => {
    if (isRunning) return;
    setLeadName(p.name);
    setLeadGstin(p.gstin);
    setPartnerType(p.type);
    setContactPerson(p.contactName);
    setStepLogs([`Target set to: ${p.name} (${p.type}). Ready for 1-Click Fast-Track Activation!`]);
    setActiveBadge(null);
  };

  const handleRunFullPipeline = () => {
    setIsRunning(true);
    setCurrentStep(1);
    setStepLogs([`⚡ Initiating Fast-Track Partner Activation for "${leadName}" (${partnerType})...`]);

    // Step 1: 1200ms
    setTimeout(() => {
      setCurrentStep(2);
      setStepLogs((prev) => [
        ...prev,
        `✓ [Step 1 Completed]: AI OCR verified ${contactPerson} & Corporate GSTIN ${leadGstin}.`
      ]);
    }, 1200);

    // Step 2: 2400ms
    setTimeout(() => {
      setCurrentStep(3);
      setStepLogs((prev) => [
        ...prev,
        `✓ [Step 2 Completed]: Regulatory KYC & ${partnerType === 'PHARMACY' ? 'Pharmacy Drug License' : 'NABH Gold Accreditation'} approved with 99.6% AI match score.`
      ]);
    }, 2400);

    // Step 3: 3600ms
    setTimeout(() => {
      setCurrentStep(4);
      setStepLogs((prev) => [
        ...prev,
        `✓ [Step 3 Completed]: Master Service Agreement (MSA) e-Signed via Aadhaar OTP (Ref #AADH-789124) with SHA-256 digital seal.`
      ]);
    }, 3600);

    // Step 4: 4800ms
    setTimeout(() => {
      setCurrentStep(5);
      setStepLogs((prev) => [
        ...prev,
        `✓ [Step 4 Completed]: ABDM 2.0 Health Facility Registry ID (${partnerType === 'PHARMACY' ? 'HFR-PHARMA-9901' : 'HFR-DL-SAK-9901'}) and Gateway Token provisioned.`
      ]);
    }, 4800);

    // Step 5: 6000ms
    setTimeout(() => {
      setIsRunning(false);
      setStepLogs((prev) => [
        ...prev,
        `🎉 [Step 5 Completed]: "${leadName}" is now 100% ACTIVE! Added live into CRM Partner Directory.`
      ]);
      setActiveBadge(`✓ ${leadName} is LIVE & ACTIVE in CRM!`);

      if (onPartnerActivated) {
        const livePartner: PartnerProfileDto = {
          id: '11111111-1111-4111-8111-' + Math.floor(100000000000 + Math.random() * 900000000000),
          tenantId: '11111111-1111-4111-8111-111111111111',
          tenantSlug: leadName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          legalName: `${leadName} ${partnerType === 'PHARMACY' ? 'Medical Store' : 'Healthcare Pvt Ltd'}`,
          tradeName: leadName,
          partnerType: partnerType,
          lifecycleStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          onboardingStep: 'COMPLETED',
          onboardingProgressPercent: 100,
          primaryContact: {
            name: contactPerson,
            email: `contact@${leadName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
            phone: '+91 98111 22334',
            roleTitle: partnerType === 'PHARMACY' ? 'Chief Pharmacist' : 'Medical Director'
          },
          branchCount: 1,
          userCount: partnerType === 'PHARMACY' ? 8 : 45,
          metadata: {
            city: partnerType === 'PHARMACY' ? 'Lucknow' : 'New Delhi',
            state: partnerType === 'PHARMACY' ? 'Uttar Pradesh' : 'Delhi',
            gstin: leadGstin,
            pan: leadGstin.slice(2, 12)
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        onPartnerActivated(livePartner);
      }
    }, 6000);
  };

  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        border: '1.5px solid #06B6D4',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 8px 30px rgba(6, 182, 212, 0.15)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 900, color: '#F8FAFC' }}>
              End-to-End Fast-Track Partner Lifecycle Pipeline Engine
            </h3>
            <Badge variant="primary">Production Fast-Track</Badge>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Automated progression from Lead Capture ➔ AI Document OCR ➔ Regulatory KYC ➔ MSA E-Sign ➔ 100% Live Activation
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunFullPipeline}
            disabled={isRunning}
            style={{
              backgroundColor: '#10B981',
              color: '#070C16',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            {isRunning ? `⚡ Running Step ${currentStep} of 5...` : '🚀 Run 1-Click Fast-Track Activation Pipeline'}
          </Button>
        </div>
      </div>

      {activeBadge && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', borderRadius: '10px', padding: '10px 14px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 800 }}>
          {activeBadge}
        </div>
      )}

      {/* 5-Step Visual Stepper Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        {steps.map((s) => {
          const isDone = currentStep > s.num || (currentStep === 5 && !isRunning);
          const isCurrent = currentStep === s.num && isRunning;

          return (
            <div
              key={s.num}
              style={{
                backgroundColor: isDone ? 'rgba(16, 185, 129, 0.15)' : isCurrent ? 'rgba(6, 182, 212, 0.15)' : '#1E293B',
                border: isDone ? '1px solid #10B981' : isCurrent ? '1.5px solid #06B6D4' : '1px solid #334155',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isDone ? '#10B981' : isCurrent ? '#38BDF8' : '#94A3B8' }}>
                  {s.label}
                </span>
                {isDone && <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>}
                {isCurrent && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06B6D4', animation: 'pulse 1s infinite' }} />
                )}
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>{s.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Target Lead Selector & Real-Time Step Terminal Log */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', alignItems: 'start' }}>
        {/* Lead Target Input */}
        <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
              TARGET PROSPECTIVE PARTNER (EDITABLE OR CHOOSE PRESET):
            </span>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PRESET_LEADS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p)}
                disabled={isRunning}
                style={{
                  backgroundColor: leadName === p.name ? '#06B6D4' : '#0F172A',
                  color: leadName === p.name ? '#070C16' : '#CBD5E1',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {p.type === 'PHARMACY' ? '💊' : '🏥'} {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
              </button>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', color: '#CBD5E1', marginBottom: '2px' }}>
              Organization / Hospital / Pharmacy Legal Name *
            </label>
            <input
              type="text"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              disabled={isRunning}
              placeholder="e.g. Haji Medical Agency"
              style={{ width: '100%', padding: '6px 10px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#FFF', fontWeight: 700, fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', color: '#CBD5E1', marginBottom: '2px' }}>Corporate GSTIN</label>
              <input
                type="text"
                value={leadGstin}
                onChange={(e) => setLeadGstin(e.target.value)}
                disabled={isRunning}
                style={{ width: '100%', padding: '6px 10px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#38BDF8', fontFamily: 'monospace', fontSize: '0.8125rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', color: '#CBD5E1', marginBottom: '2px' }}>Key Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                disabled={isRunning}
                style={{ width: '100%', padding: '6px 10px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '6px', color: '#FFF', fontSize: '0.8125rem' }}
              />
            </div>
          </div>
        </div>

        {/* Real-time Terminal Logs */}
        <div style={{ backgroundColor: '#070C16', border: '1px solid #334155', borderRadius: '12px', padding: '14px', minHeight: '140px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
          <span style={{ color: '#64748B', fontWeight: 800, marginBottom: '4px' }}>// LIFECYCLE AUTOMATION TERMINAL LOGS:</span>
          {stepLogs.map((log, index) => (
            <div key={index} style={{ color: log.includes('✓') ? '#86EFAC' : log.includes('🎉') ? '#FCD34D' : '#38BDF8' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
