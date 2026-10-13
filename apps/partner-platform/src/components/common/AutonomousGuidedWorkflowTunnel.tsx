import React, { useState, useEffect } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface WorkflowStepPrerequisite {
  id: string;
  label: string;
  description: string;
  isResolved: boolean;
  fieldComponentType: 'TEXT' | 'SELECT_ICD10' | 'DOCTOR_SIGN' | 'PHARMACY_RETURN' | 'PAYMENT_UPI';
  suggestedValue?: string | undefined;
  resolvedValue?: string | undefined;
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
  patientUhid?: string;
  patientName?: string;
  bedNumber?: string;
  ipdNumber?: string;
  onWorkflowCompleted?: (summary: any) => void;
}

export const AutonomousGuidedWorkflowTunnel: React.FC<AutonomousGuidedWorkflowTunnelProps> = ({
  isOpen,
  onClose,
  patientUhid = 'UHID-2026-901',
  patientName = 'Ramesh Patel (58M)',
  bedNumber = 'ICU-Bed 04',
  ipdNumber = 'IPD-2026-8812',
  onWorkflowCompleted
}) => {
  // Steps definition for 3-Minute Inpatient Discharge Express Tunnel
  const [steps, setSteps] = useState<TunnelStepDefinition[]>([
    {
      id: 'step-1-clinical',
      title: '1. Consultant Clinical Discharge Certification',
      subtitle: 'ICD-10 Primary Codification & Attending Doctor Digital Signature',
      badge: 'CLINICAL',
      isCompleted: false,
      prerequisites: [
        {
          id: 'pre-icd10',
          label: 'Primary ICD-10 Codification',
          description: 'Required by ABDM & TPA claims',
          isResolved: false,
          fieldComponentType: 'SELECT_ICD10',
          suggestedValue: 'K80.20 (Calculus of Gallbladder with Cholecystitis)'
        },
        {
          id: 'pre-doc-sign',
          label: 'Attending Consultant Digital Sign-Off',
          description: 'RMP certified signature on clinical summary',
          isResolved: false,
          fieldComponentType: 'DOCTOR_SIGN',
          suggestedValue: 'Dr. Rajesh Sharma, MD, DM'
        }
      ]
    },
    {
      id: 'step-2-pharmacy',
      title: '2. Ward Sub-Stock & Pharmacy Returns',
      subtitle: 'Unused IV ampoules credit note & reconciliation',
      badge: 'PHARMACY',
      isCompleted: false,
      prerequisites: [
        {
          id: 'pre-pharma-return',
          label: 'Bedside Unused Medication Reconciliation',
          description: '2x Inj Meropenem 1g unused in ward sub-stock',
          isResolved: false,
          fieldComponentType: 'PHARMACY_RETURN',
          suggestedValue: '₹840.00 Credit to Inpatient Ledger'
        }
      ]
    },
    {
      id: 'step-3-billing',
      title: '3. Final IPD Ledger Net Settlement',
      subtitle: 'Running bill balance clearance & GST tax invoice generation',
      badge: 'BILLING',
      isCompleted: false,
      prerequisites: [
        {
          id: 'pre-bill-settle',
          label: 'Net Balance Settlement',
          description: 'Total Bill: ₹44,500 • Advance Paid: ₹40,000 • Net Due: ₹4,500',
          isResolved: false,
          fieldComponentType: 'PAYMENT_UPI',
          suggestedValue: '₹4,500.00'
        }
      ]
    },
    {
      id: 'step-4-exit',
      title: '4. Bed Sanitization & WhatsApp Gate Pass',
      subtitle: 'Digital exit permit & WhatsApp discharge card dispatch',
      badge: 'LOGISTICS',
      isCompleted: false,
      prerequisites: [
        {
          id: 'pre-whatsapp-gatepass',
          label: 'Automated WhatsApp Delivery & Bed Release',
          description: 'Dispatches signed PDF + clearance QR to attendant',
          isResolved: false,
          fieldComponentType: 'TEXT',
          suggestedValue: 'Auto-Send to +91 98765 43210'
        }
      ]
    }
  ]);

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activePrereqId, setActivePrereqId] = useState<string | null>(null);
  const [autoSaveNotification, setAutoSaveNotification] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

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
        uhid: patientUhid,
        stepIndex: stepIdx,
        prereqId,
        resolvedVal
      },
      `⚡ Zero-Friction Auto-Progression: Resolved ${prereqId} for ${patientName}`
    );
  };

  const handleCompleteEntireTunnel = () => {
    setIsFinishing(true);

    hospitalEventBus.publish(
      'DISCHARGE_ORDERED_INPATIENT',
      'AutonomousGuidedWorkflowTunnel',
      {
        uhid: patientUhid,
        patientName,
        bedNumber,
        ipdNumber,
        status: 'DISCHARGED_CLEARED',
        whatsappDispatched: true
      },
      `🎉 3-Minute Inpatient Discharge Express Tunnel completed for ${patientName} (${bedNumber}). Bed sanitized and WhatsApp gate pass dispatched.`
    );

    setTimeout(() => {
      setIsFinishing(false);
      if (onWorkflowCompleted) {
        onWorkflowCompleted({ uhid: patientUhid, patientName, completedAt: new Date().toISOString() });
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
          maxWidth: '820px',
          maxHeight: '94vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 30px rgba(56, 189, 248, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
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
                  Zero-Friction Inpatient Discharge Express Tunnel
                </h3>
                <Badge variant="success">Auto-Advancing Engine</Badge>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Patient: <strong style={{ color: '#F8FAFC' }}>{patientName}</strong> • {bedNumber} • IPD #{ipdNumber}
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
                  {step.title.split('. ')[1]}
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

                        {/* Custom Micro Field Component depending on type */}
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

                        {p.fieldComponentType === 'PAYMENT_UPI' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: '#34D399' }}>
                              Dynamic UPI QR generated for <strong>₹4,500.00</strong>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, 'UPI Paid: ₹4,500 Ref #UPI-9912')}
                            >
                              ✓ Confirm Cashless / UPI Received
                            </Button>
                          </div>
                        )}

                        {p.fieldComponentType === 'TEXT' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                              Target WhatsApp: <strong>+91 98765 43210 (Attendant)</strong>
                            </span>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolvePrerequisite(activeStepIndex, p.id, 'Dispatched to +91 98765 43210')}
                            >
                              🚀 Dispatch WhatsApp PDF & Free Bed
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
                {isFinishing ? 'Finishing Discharge...' : '🎉 Finalize Discharge & Release Bed'}
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
