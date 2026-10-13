import React, { useState, useEffect } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export type AutonomousTunnelMode =
  | 'INPATIENT_DISCHARGE_EXPRESS'
  | 'INPATIENT_ADMISSION_BED_EXPRESS'
  | 'BEDSIDE_BCMA_MEDICATION_EXPRESS'
  | 'TPA_CASHLESS_CLAIM_EXPRESS';

export interface WorkflowStepPrerequisite {
  id: string;
  label: string;
  description: string;
  isResolved: boolean;
  fieldComponentType:
    | 'TEXT'
    | 'SELECT_ICD10'
    | 'DOCTOR_SIGN'
    | 'PHARMACY_RETURN'
    | 'PAYMENT_UPI'
    | 'BED_SELECTOR'
    | 'VITAL_INPUT'
    | 'BARCODE_SCAN'
    | 'CLAIM_SCRUBBER_FIX';
  suggestedValue?: string | undefined;
  resolvedValue?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface TunnelStepDefinition {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  prerequisites: WorkflowStepPrerequisite[];
  isCompleted: boolean;
}

export interface AutonomousGuidedWorkflowTunnelProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AutonomousTunnelMode;
  patientUhid?: string;
  patientName?: string;
  bedNumber?: string;
  ipdNumber?: string;
  onWorkflowCompleted?: (summary: any) => void;
}

export const AutonomousGuidedWorkflowTunnel: React.FC<AutonomousGuidedWorkflowTunnelProps> = ({
  isOpen,
  onClose,
  initialMode = 'INPATIENT_DISCHARGE_EXPRESS',
  patientUhid = 'UHID-2026-901',
  patientName = 'Ramesh Patel (58M)',
  bedNumber = 'ICU-Bed 04',
  ipdNumber = 'IPD-2026-8812',
  onWorkflowCompleted
}) => {
  const [activeTunnelMode, setActiveTunnelMode] = useState<AutonomousTunnelMode>(initialMode);

  // Helper to generate mode steps
  const getStepsForMode = (mode: AutonomousTunnelMode): TunnelStepDefinition[] => {
    switch (mode) {
      case 'INPATIENT_ADMISSION_BED_EXPRESS':
        return [
          {
            id: 'adm-step-1',
            title: '1. Admission Order & Clinical Specialty',
            subtitle: 'Doctor admission intent, acuity classification, and attending department',
            badge: 'TRIAGE',
            isCompleted: false,
            prerequisites: [
              {
                id: 'adm-pre-specialty',
                label: 'Admitting Clinical Department',
                description: 'Department responsible for primary care',
                isResolved: false,
                fieldComponentType: 'TEXT',
                suggestedValue: 'Department of Cardiology & CCU'
              },
              {
                id: 'adm-pre-acuity',
                label: 'Clinical Acuity Tier',
                description: 'Acuity determines nurse-to-patient ratio',
                isResolved: false,
                fieldComponentType: 'TEXT',
                suggestedValue: 'Acuity Level 2 (High Dependency / Cardiac Step-Down)'
              }
            ]
          },
          {
            id: 'adm-step-2',
            title: '2. 1-Click Ward & Bed Allocation',
            subtitle: 'Autonomous vacant bed matching without leaving screen',
            badge: 'BED MESH',
            isCompleted: false,
            prerequisites: [
              {
                id: 'adm-pre-bed-select',
                label: 'Select Target Bed Slot',
                description: 'Automatically filtered by available sanitized beds',
                isResolved: false,
                fieldComponentType: 'BED_SELECTOR',
                suggestedValue: 'ICU-Bed 04 (Telemetry Enabled)'
              }
            ]
          },
          {
            id: 'adm-step-3',
            title: '3. Emergency Admission Deposit & Cashless',
            subtitle: 'Advance deposit collection or Ayushman / TPA Pre-Auth linking',
            badge: 'ACCOUNTS',
            isCompleted: false,
            prerequisites: [
              {
                id: 'adm-pre-deposit',
                label: 'Admission Advance Deposit / Pre-Auth',
                description: 'Standard emergency deposit ₹15,000 or TPA Cashless',
                isResolved: false,
                fieldComponentType: 'PAYMENT_UPI',
                suggestedValue: '₹15,000.00 Advance Deposit'
              }
            ]
          },
          {
            id: 'adm-step-4',
            title: '4. Bedside Wristband Barcode & eMAR Roster',
            subtitle: 'Thermal barcode wristband print and nursing medication schedule initialization',
            badge: 'EXECUTION',
            isCompleted: false,
            prerequisites: [
              {
                id: 'adm-pre-wristband',
                label: 'Initialize Wristband QR & eMAR',
                description: 'Binds UHID, Bed Number, and initial Doctor round orders',
                isResolved: false,
                fieldComponentType: 'TEXT',
                suggestedValue: 'Thermal Wristband QR Dispatched'
              }
            ]
          }
        ];

      case 'BEDSIDE_BCMA_MEDICATION_EXPRESS':
        return [
          {
            id: 'bcma-step-1',
            title: '1. Patient Wristband 2D Barcode Scan',
            subtitle: 'Point-of-care positive patient identification (Five Rights: Right Patient)',
            badge: 'PATIENT ID',
            isCompleted: false,
            prerequisites: [
              {
                id: 'bcma-pre-wristband',
                label: 'Patient Wristband Verification',
                description: `Scan wristband for ${patientName} (${patientUhid})`,
                isResolved: false,
                fieldComponentType: 'BARCODE_SCAN',
                suggestedValue: `${patientUhid}-${bedNumber.replace(/\s+/g, '')}`
              }
            ]
          },
          {
            id: 'bcma-step-2',
            title: '2. Pre-Administration Vital Signs Check',
            subtitle: 'Hemodynamic safety gate (Heart rate & Blood pressure verification)',
            badge: 'VITALS',
            isCompleted: false,
            prerequisites: [
              {
                id: 'bcma-pre-vitals',
                label: 'Verify Bedside Blood Pressure & Heart Rate',
                description: 'SBP must be >= 100 mmHg; Pulse must be >= 60 bpm',
                isResolved: false,
                fieldComponentType: 'VITAL_INPUT',
                suggestedValue: 'BP: 124/82 mmHg • Pulse: 78 bpm'
              }
            ]
          },
          {
            id: 'bcma-step-3',
            title: '3. Medication GS1 Barcode & High-Alert Witness',
            subtitle: 'Drug chemical, dosage, route, expiry & dual-nurse verification',
            badge: 'SAFETY',
            isCompleted: false,
            prerequisites: [
              {
                id: 'bcma-pre-drug-scan',
                label: 'Scan Inj Ceftriaxone 1g IV Vial GS1 DataMatrix',
                description: 'GTIN 08901112233445 • Batch CTX-2026-88 • Exp: 12/27',
                isResolved: false,
                fieldComponentType: 'BARCODE_SCAN',
                suggestedValue: 'GS1-MED-CTX-88-EXP27'
              }
            ]
          },
          {
            id: 'bcma-step-4',
            title: '4. Closed-Loop Auto-Billing & Sub-Stock Depletion',
            subtitle: 'Zero revenue leakage posting to IPD bill + real-time sub-stock decrement',
            badge: 'REVENUE',
            isCompleted: false,
            prerequisites: [
              {
                id: 'bcma-pre-auto-bill',
                label: 'Post ₹420.00 to IPD Ledger & Deduct 1 Vial',
                description: 'Synchronizes with Inpatient bill and Ward Sub-Stock inventory',
                isResolved: false,
                fieldComponentType: 'TEXT',
                suggestedValue: 'Auto-Posted ₹420 to IPD Ledger'
              }
            ]
          }
        ];

      case 'TPA_CASHLESS_CLAIM_EXPRESS':
        return [
          {
            id: 'tpa-step-1',
            title: '1. Automated 12-Gate IRDAI Scrubber Audit',
            subtitle: 'Pre-flight rules scanning discharge summary, OT notes, and test reports',
            badge: 'AUDIT',
            isCompleted: false,
            prerequisites: [
              {
                id: 'tpa-pre-scrubber-run',
                label: 'Run Pre-Submission Scrubber Check',
                description: 'Checks 12 IRDAI/ABDM/NHCX compliance rules',
                isResolved: false,
                fieldComponentType: 'CLAIM_SCRUBBER_FIX',
                suggestedValue: '96% Clean Claim Score (1 Warning)'
              }
            ]
          },
          {
            id: 'tpa-step-2',
            title: '2. Non-Medical Consumables Capping Auto-Repair',
            subtitle: 'Auto-formats gloves, cotton, and drapes into IRDAI List I/II/III',
            badge: 'COMPLIANCE',
            isCompleted: false,
            prerequisites: [
              {
                id: 'tpa-pre-capping-fix',
                label: 'Auto-Categorize Non-Medical Consumables',
                description: 'Separates ₹4,200 into standard IRDAI non-payable schedule',
                isResolved: false,
                fieldComponentType: 'CLAIM_SCRUBBER_FIX',
                suggestedValue: 'IRDAI Schedule Capped & Reconciled'
              }
            ]
          },
          {
            id: 'tpa-step-3',
            title: '3. Pre-Auth Ceiling vs Running Bill Reconciliation',
            subtitle: 'Verifies running bill against pre-authorized approved amount',
            badge: 'UTILIZATION',
            isCompleted: false,
            prerequisites: [
              {
                id: 'tpa-pre-ceiling',
                label: 'Reconcile Buffer (Approved ₹50,000 vs Bill ₹44,500)',
                description: 'Within safe 89% utilization buffer (Zero enhancement required)',
                isResolved: false,
                fieldComponentType: 'TEXT',
                suggestedValue: 'Buffer Reconciled: ₹5,500 Headroom'
              }
            ]
          },
          {
            id: 'tpa-step-4',
            title: '4. NHCX FHIR Bundle Seal & Gateway Dispatch',
            subtitle: 'Embeds SHA-256 digital signature and transmits to Insurance Clearinghouse',
            badge: 'DISPATCH',
            isCompleted: false,
            prerequisites: [
              {
                id: 'tpa-pre-dispatch',
                label: 'Seal NHCX FHIR Bundle & Transmit',
                description: 'Dispatches electronic claim package to Star Health / Medi Assist',
                isResolved: false,
                fieldComponentType: 'TEXT',
                suggestedValue: 'Dispatched to NHCX Gateway'
              }
            ]
          }
        ];

      case 'INPATIENT_DISCHARGE_EXPRESS':
      default:
        return [
          {
            id: 'dis-step-1',
            title: '1. Consultant Clinical Discharge Certification',
            subtitle: 'ICD-10 Primary Codification & Attending Doctor Digital Signature',
            badge: 'CLINICAL',
            isCompleted: false,
            prerequisites: [
              {
                id: 'dis-pre-icd10',
                label: 'Primary ICD-10 Codification',
                description: 'Required by ABDM & TPA claims',
                isResolved: false,
                fieldComponentType: 'SELECT_ICD10',
                suggestedValue: 'K80.20 (Calculus of Gallbladder with Cholecystitis)'
              },
              {
                id: 'dis-pre-doc-sign',
                label: 'Attending Consultant Digital Sign-Off',
                description: 'RMP certified signature on clinical summary',
                isResolved: false,
                fieldComponentType: 'DOCTOR_SIGN',
                suggestedValue: 'Dr. Rajesh Sharma, MD, DM'
              }
            ]
          },
          {
            id: 'dis-step-2',
            title: '2. Ward Sub-Stock & Pharmacy Returns',
            subtitle: 'Unused IV ampoules credit note & reconciliation',
            badge: 'PHARMACY',
            isCompleted: false,
            prerequisites: [
              {
                id: 'dis-pre-pharma-return',
                label: 'Bedside Unused Medication Reconciliation',
                description: '2x Inj Meropenem 1g unused in ward sub-stock',
                isResolved: false,
                fieldComponentType: 'PHARMACY_RETURN',
                suggestedValue: '₹840.00 Credit to Inpatient Ledger'
              }
            ]
          },
          {
            id: 'dis-step-3',
            title: '3. Final IPD Ledger Net Settlement',
            subtitle: 'Running bill balance clearance & GST tax invoice generation',
            badge: 'BILLING',
            isCompleted: false,
            prerequisites: [
              {
                id: 'dis-pre-bill-settle',
                label: 'Net Balance Settlement',
                description: 'Total Bill: ₹44,500 • Advance Paid: ₹40,000 • Net Due: ₹4,500',
                isResolved: false,
                fieldComponentType: 'PAYMENT_UPI',
                suggestedValue: '₹4,500.00'
              }
            ]
          },
          {
            id: 'dis-step-4',
            title: '4. Bed Sanitization & WhatsApp Gate Pass',
            subtitle: 'Digital exit permit & WhatsApp discharge card dispatch',
            badge: 'LOGISTICS',
            isCompleted: false,
            prerequisites: [
              {
                id: 'dis-pre-whatsapp-gatepass',
                label: 'Automated WhatsApp Delivery & Bed Release',
                description: 'Dispatches signed PDF + clearance QR to attendant',
                isResolved: false,
                fieldComponentType: 'TEXT',
                suggestedValue: 'Auto-Send to +91 98765 43210'
              }
            ]
          }
        ];
    }
  };

  const [steps, setSteps] = useState<TunnelStepDefinition[]>(() => getStepsForMode(initialMode));
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activePrereqId, setActivePrereqId] = useState<string | null>(null);
  const [autoSaveNotification, setAutoSaveNotification] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Switch mode handler
  const handleSwitchMode = (mode: AutonomousTunnelMode) => {
    setActiveTunnelMode(mode);
    setSteps(getStepsForMode(mode));
    setActiveStepIndex(0);
    setActivePrereqId(null);
  };

  // Auto-detect next missing prerequisite in the active step
  useEffect(() => {
    const currentStep = steps[activeStepIndex];
    if (!currentStep) return;

    const firstUnresolved = currentStep.prerequisites.find((p) => !p.isResolved);
    if (firstUnresolved) {
      setActivePrereqId(firstUnresolved.id);
    } else {
      setActivePrereqId(null);
      // Mark step completed
      if (!currentStep.isCompleted) {
        setSteps((prev) =>
          prev.map((s, idx) => (idx === activeStepIndex ? { ...s, isCompleted: true } : s))
        );
        // Auto-advance to next step if available!
        if (activeStepIndex < steps.length - 1) {
          setAutoSaveNotification(`✓ Step ${activeStepIndex + 1} Complete! Auto-advancing...`);
          setTimeout(() => {
            setActiveStepIndex((prevIdx) => prevIdx + 1);
            setAutoSaveNotification(null);
          }, 800);
        }
      }
    }
  }, [steps, activeStepIndex]);

  if (!isOpen) return null;

  // Resolve a prerequisite with 0ms optimistic auto-save and auto-progression
  const handleResolvePrerequisite = (stepIdx: number, prereqId: string, resolvedVal: string) => {
    setSteps((prev) =>
      prev.map((step, sIdx) => {
        if (sIdx !== stepIdx) return step;
        return {
          ...step,
          prerequisites: step.prerequisites.map((p) =>
            p.id === prereqId
              ? {
                  ...p,
                  isResolved: true,
                  resolvedValue: resolvedVal
                }
              : p
          )
        };
      })
    );

    setAutoSaveNotification(`💾 Auto-saved: "${resolvedVal}"`);
    setTimeout(() => setAutoSaveNotification(null), 2500);

    // Event bus synchronization for zero friction cross-module reflection
    hospitalEventBus.publish(
      'OPTIMISTIC_ACTION_DISPATCHED',
      'AutonomousGuidedWorkflowTunnel',
      {
        mode: activeTunnelMode,
        uhid: patientUhid,
        stepIndex: stepIdx,
        prereqId,
        resolvedVal
      },
      `⚡ Zero-Friction Auto-Progression (${activeTunnelMode}): Resolved ${prereqId} for ${patientName}`
    );
  };

  const handleCompleteEntireTunnel = () => {
    setIsFinishing(true);

    hospitalEventBus.publish(
      'OPTIMISTIC_ACTION_DISPATCHED',
      'AutonomousGuidedWorkflowTunnel',
      {
        mode: activeTunnelMode,
        uhid: patientUhid,
        patientName,
        bedNumber,
        ipdNumber,
        status: 'TUNNEL_COMPLETED'
      },
      `🎉 Express Tunnel (${activeTunnelMode}) successfully executed for ${patientName} (${bedNumber}) without screen switching.`
    );

    setTimeout(() => {
      setIsFinishing(false);
      if (onWorkflowCompleted) {
        onWorkflowCompleted({
          mode: activeTunnelMode,
          uhid: patientUhid,
          patientName,
          completedAt: new Date().toISOString()
        });
      }
      onClose();
    }, 1200);
  };

  const currentStep = steps[activeStepIndex];
  const allStepsCompleted = steps.every((s) => s.isCompleted);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #38BDF8',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '94vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 30px rgba(56, 189, 248, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header & Mode Selector */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0B111E'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem'
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#38BDF8' }}>
                  Zero-Friction Autonomous Workflow OS
                </h3>
                <Badge variant="success">Auto-Advancing</Badge>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Active Patient: <strong style={{ color: '#F8FAFC' }}>{patientName}</strong> • {bedNumber} • IPD #{ipdNumber}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* 4 Core Tunnel Mode Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#070C16',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 16px',
            gap: '6px',
            overflowX: 'auto'
          }}
        >
          {[
            { mode: 'INPATIENT_DISCHARGE_EXPRESS', label: '⚡ 3-Min Discharge Tunnel' },
            { mode: 'INPATIENT_ADMISSION_BED_EXPRESS', label: '🏥 1-Screen Admission Tunnel' },
            { mode: 'BEDSIDE_BCMA_MEDICATION_EXPRESS', label: '💊 Bedside BCMA Tunnel' },
            { mode: 'TPA_CASHLESS_CLAIM_EXPRESS', label: '🛡️ TPA Claim Scrubber Tunnel' }
          ].map((t) => (
            <button
              key={t.mode}
              type="button"
              onClick={() => handleSwitchMode(t.mode as AutonomousTunnelMode)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTunnelMode === t.mode ? '2px solid #38BDF8' : '2px solid transparent',
                backgroundColor: activeTunnelMode === t.mode ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: activeTunnelMode === t.mode ? '#38BDF8' : '#94A3B8',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Floating Auto-Save Notification Badge */}
        {autoSaveNotification && (
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid #10B981',
              padding: '8px 24px',
              color: '#6EE7B7',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.2s ease-in'
            }}
          >
            <span>⚡</span>
            <span>{autoSaveNotification}</span>
          </div>
        )}

        {/* Step Progress Tracker */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#0B111E',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}
        >
          {steps.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const isDone = step.isCompleted;

            return (
              <div
                key={step.id}
                onClick={() => setActiveStepIndex(idx)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: isActive
                    ? 'rgba(56, 189, 248, 0.15)'
                    : isDone
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isActive
                    ? '1.5px solid #38BDF8'
                    : isDone
                    ? '1px solid #10B981'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isActive ? '#38BDF8' : isDone ? '#34D399' : '#64748B' }}>
                    STEP {idx + 1}
                  </span>
                  <Badge variant={isDone ? 'success' : isActive ? 'primary' : 'neutral'}>
                    {isDone ? 'DONE ✓' : isActive ? 'ACTIVE' : 'QUEUED'}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F8FAFC', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {step.title.split('. ')[1] || step.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Step Workspace */}
        {currentStep && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
                  {currentStep.title}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                  {currentStep.subtitle}
                </p>
              </div>
              <Badge variant="primary">{currentStep.badge}</Badge>
            </div>

            {/* In-Line Prerequisites Checklist & Micro-Action Resolvers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {currentStep.prerequisites.map((p) => {
                const isSelectedForAction = p.id === activePrereqId || !p.isResolved;

                return (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: p.isResolved
                        ? 'rgba(16, 185, 129, 0.08)'
                        : isSelectedForAction
                        ? 'rgba(56, 189, 248, 0.08)'
                        : '#0B111E',
                      border: p.isResolved
                        ? '1px solid #10B981'
                        : isSelectedForAction
                        ? '1.5px solid #38BDF8'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {p.isResolved ? '✅' : '⚡'}
                        </span>
                        <div>
                          <strong style={{ fontSize: '0.88rem', color: '#F8FAFC' }}>{p.label}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{p.description}</div>
                        </div>
                      </div>

                      <Badge variant={p.isResolved ? 'success' : 'warning'}>
                        {p.isResolved ? 'RESOLVED & SAVED' : 'REQUIRES INPUT'}
                      </Badge>
                    </div>

                    {/* Auto-Surfaced Micro-Action Input Area */}
                    {!p.isResolved && (
                      <div
                        style={{
                          backgroundColor: '#070C16',
                          borderRadius: '10px',
                          padding: '14px',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>
                          👉 1-Click Auto-Resolve & Advance:
                        </div>

                        {/* Bed Selector Component */}
                        {p.fieldComponentType === 'BED_SELECTOR' && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                              { bed: 'ICU-Bed 04', type: 'Intensive Care (Telemetry)' },
                              { bed: 'Deluxe-204', type: 'Private AC Room' },
                              { bed: 'Ward-Bed 12', type: 'General Medical Ward' }
                            ].map((b) => (
                              <button
                                key={b.bed}
                                type="button"
                                onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, `${b.bed} (${b.type})`)}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                                  border: '1px solid #06B6D4',
                                  color: '#38BDF8',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                🛏️ Allocate {b.bed}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Vital Input Component */}
                        {p.fieldComponentType === 'VITAL_INPUT' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#A7F3D0' }}>
                              Suggested Bedside Reading: <strong>BP 124/82 • HR 78 bpm</strong>
                            </span>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, 'BP: 124/82 mmHg • HR: 78 bpm (Normal)')}
                            >
                              ✓ Confirm Vitals & Proceed
                            </Button>
                          </div>
                        )}

                        {/* Barcode Scan Component */}
                        {p.fieldComponentType === 'BARCODE_SCAN' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                              Auto-Decode Barcode: <strong>{p.suggestedValue}</strong>
                            </span>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, `Scanned & Verified: ${p.suggestedValue}`)}
                            >
                              📲 Scan & Match
                            </Button>
                          </div>
                        )}

                        {/* Claim Scrubber Fix Component */}
                        {p.fieldComponentType === 'CLAIM_SCRUBBER_FIX' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#FCD34D' }}>
                              Auto-Apply IRDAI Schedule Capping Rules (Non-Medical List I/II/III)
                            </span>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, 'Applied IRDAI Schedule Capping (Score: 98%)')}
                            >
                              ⚡ Auto-Repair Claim
                            </Button>
                          </div>
                        )}

                        {/* ICD-10 Component */}
                        {p.fieldComponentType === 'SELECT_ICD10' && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                              'K80.20 (Cholecystitis)',
                              'I25.10 (CAD Post-PTCA)',
                              'J18.0 (Bronchopneumonia)'
                            ].map((code) => (
                              <button
                                key={code}
                                type="button"
                                onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, code)}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                  border: '1px solid #38BDF8',
                                  color: '#38BDF8',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                + Bind {code}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Doctor Sign Component */}
                        {p.fieldComponentType === 'DOCTOR_SIGN' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#E2E8F0' }}>
                              Sign as: <strong>Dr. Rajesh Sharma, MD, DM (Reg #MCI-2018-9941)</strong>
                            </span>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, 'Dr. Rajesh Sharma (Digitally Signed)')}
                            >
                              ✍️ 1-Click Digital Sign & Save
                            </Button>
                          </div>
                        )}

                        {/* Pharmacy Return Component */}
                        {p.fieldComponentType === 'PHARMACY_RETURN' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#FCD34D' }}>
                              Reconcile 2x Inj Meropenem ➔ Credit ₹840 to final bill
                            </span>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, 'Credited ₹840 to IPD Ledger')}
                            >
                              ✓ Accept Return & Deduct
                            </Button>
                          </div>
                        )}

                        {/* Payment UPI Component */}
                        {p.fieldComponentType === 'PAYMENT_UPI' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: '#34D399' }}>
                              Dynamic UPI QR generated for <strong>{p.suggestedValue}</strong>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, `Confirmed Receipt: ${p.suggestedValue}`)}
                            >
                              ✓ Confirm Cashless / UPI Received
                            </Button>
                          </div>
                        )}

                        {/* Text Default Component */}
                        {p.fieldComponentType === 'TEXT' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                              Action Target: <strong>{p.suggestedValue}</strong>
                            </span>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, p.suggestedValue || 'Confirmed')}
                            >
                              🚀 Complete & Advance
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {p.isResolved && p.resolvedValue && (
                      <div style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 600 }}>
                        Resolved: {p.resolvedValue}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0B111E'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            ⚡ Zero Context Switching • 0ms Optimistic Auto-Save Active
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            {allStepsCompleted ? (
              <Button
                variant="primary"
                onClick={handleCompleteEntireTunnel}
                disabled={isFinishing}
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  padding: '8px 24px'
                }}
              >
                {isFinishing ? 'Finalizing Tunnel Execution...' : '🎉 Finalize Express Tunnel Execution'}
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={activeStepIndex >= steps.length - 1}
                onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
              >
                Next Step ➔
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
