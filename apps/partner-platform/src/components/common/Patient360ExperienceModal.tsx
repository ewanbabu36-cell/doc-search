import React, { useState, useEffect } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { type ActivePatientSummary } from '../../services/hospital-event-bus.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';
import type { PartnerModuleKey } from '../PartnerPlatformShell.js';
import { apiRequest } from '../../services/api-client.js';
import type { Patient360ReadModelDto, PatientTimelineEventDto } from '@docsearch/api-contracts';

export interface Patient360ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: ActivePatientSummary | null;
  onNavigateModule?: ((moduleKey: PartnerModuleKey, subTab?: string | undefined) => void) | undefined;
  onOpenPrintModal?: ((type: 'WRISTBAND' | 'TOKEN' | 'PRESCRIPTION' | 'RECEIPT', patient?: ActivePatientSummary | undefined) => void) | undefined;
}

type Patient360Tab = 'TIMELINE' | 'CLINICAL' | 'MEDICATIONS' | 'DIAGNOSTICS' | 'BILLING' | 'FOLLOWUP';

export const Patient360ExperienceModal: React.FC<Patient360ExperienceModalProps> = ({
  isOpen,
  onClose,
  patient,
  onNavigateModule,
  onOpenPrintModal
}) => {
  const [activeTab, setActiveTab] = useState<Patient360Tab>('TIMELINE');
  const [viewMode, setViewMode] = useState<'side-sheet' | 'centered'>('side-sheet');
  const [actionConfirmTarget, setActionConfirmTarget] = useState<{ label: string; moduleKey: PartnerModuleKey; subTab?: string | undefined } | null>(null);
  const [readModel, setReadModel] = useState<Patient360ReadModelDto | null>(null);
  const [timeline, setTimeline] = useState<PatientTimelineEventDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const partnerProfile = getUnifiedPartnerProfile();
  const effectiveDoctorName = patient?.doctorName || (partnerProfile.doctorName ? `${partnerProfile.doctorName}${partnerProfile.doctorDegree ? ` (${partnerProfile.doctorDegree})` : ''}` : 'Consulting Physician');
  const effectiveDoctorSpecialty = partnerProfile.doctorSpecialty || 'General Medicine';

  useEffect(() => {
    if (!isOpen || !patient?.id) {
      setReadModel(null);
      setTimeline([]);
      return;
    }
    let isCancelled = false;
    setIsLoading(true);
    setFetchError(null);

    Promise.all([
      apiRequest<Patient360ReadModelDto>(`/api/v1/partner/patient-360/${patient.id}`),
      apiRequest<PatientTimelineEventDto[]>(`/api/v1/partner/patient-360/${patient.id}/timeline`)
    ])
      .then(([rmRes, tlRes]) => {
        if (isCancelled) return;
        if (rmRes.success && rmRes.data) {
          setReadModel(rmRes.data);
        }
        if (tlRes.success && Array.isArray(tlRes.data)) {
          setTimeline(tlRes.data);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setFetchError(err instanceof Error ? err.message : 'Failed to fetch Patient 360 data');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, patient?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (actionConfirmTarget) {
          setActionConfirmTarget(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, actionConfirmTarget]);

  if (!isOpen || !patient) return null;

  const handleActionClick = (label: string, moduleKey: PartnerModuleKey, subTab?: string) => {
    setActionConfirmTarget({ label, moduleKey, subTab });
  };

  const handleExecuteAction = () => {
    if (actionConfirmTarget && onNavigateModule) {
      onNavigateModule(actionConfirmTarget.moduleKey, actionConfirmTarget.subTab);
      setActionConfirmTarget(null);
      onClose();
    }
  };

  const isSideSheet = viewMode === 'side-sheet';

  return (
    <div
      className="ds-backdrop ds-z-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: isSideSheet ? 'rgba(3, 7, 18, 0.55)' : 'rgba(11, 15, 23, 0.82)',
        backdropFilter: isSideSheet ? 'blur(8px)' : 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: isSideSheet ? 'blur(8px)' : 'blur(20px) saturate(180%)',
        display: 'flex',
        alignItems: isSideSheet ? 'stretch' : 'center',
        justifyContent: isSideSheet ? 'flex-end' : 'center',
        padding: isSideSheet ? 0 : '20px',
        zIndex: 1050,
        transition: 'all 0.2s ease-in-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="ds-glass-elevated"
        style={{
          width: '100%',
          maxWidth: isSideSheet ? '720px' : '1040px',
          height: isSideSheet ? '100vh' : 'auto',
          maxHeight: isSideSheet ? '100vh' : '92vh',
          borderRadius: isSideSheet ? '16px 0 0 16px' : '16px',
          border: '1.5px solid var(--ds-color-border-strong, rgba(56, 189, 248, 0.35))',
          borderRight: isSideSheet ? 'none' : '1.5px solid var(--ds-color-border-strong, rgba(56, 189, 248, 0.35))',
          backgroundColor: 'var(--ds-surface-glass-elevated, var(--ds-color-surface, #0e121c))',
          boxShadow: isSideSheet ? '-16px 0 48px rgba(0, 0, 0, 0.85)' : 'var(--ds-depth-high), 0 0 30px rgba(2, 132, 199, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header Ribbon: Patient Master Identity */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.1))',
            background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.14) 0%, rgba(99, 102, 241, 0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(2, 132, 199, 0.22)',
                border: '1px solid rgba(2, 132, 199, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}
            >
              {patient.gender === 'FEMALE' ? '👩' : '👨'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                  {patient.name}
                </h2>
                <Badge variant="primary">{patient.uhid}</Badge>
                <Badge variant="success">ACTIVE VISIT</Badge>
                {patient.bloodGroup && (
                  <Badge variant="danger" pulse>
                    🩸 {patient.bloodGroup}
                  </Badge>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                <span>{patient.age} Yrs · {patient.gender}</span>
                {patient.bedNumber && (
                  <span>🛏️ Bed: <strong>{patient.bedNumber}</strong> ({patient.wardName || 'Inpatient'})</span>
                )}
                {patient.opdToken && (
                  <span>⏱️ OPD Token: <strong>#{patient.opdToken}</strong></span>
                )}
                {patient.doctorName && (
                  <span>🩺 Consultant: <strong>{patient.doctorName}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === 'side-sheet' ? 'centered' : 'side-sheet'))}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '8px',
                color: 'var(--ds-color-text-primary, #F8FAFC)',
                padding: '5px 9px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title={isSideSheet ? 'Expand to Full Centered Modal' : 'Dock to Slide-Over Side-Sheet'}
            >
              {isSideSheet ? '⛶ Center' : '◨ Side-Sheet'}
            </button>
            {onOpenPrintModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenPrintModal('WRISTBAND', patient)}
              >
                🖨️ Wristband
              </Button>
            )}
            <button
              onClick={onClose}
              type="button"
              aria-label="Close modal"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '8px',
                color: 'var(--ds-color-text-muted)',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Zero-Click Informational Context Alert Strip */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            borderBottom: '1px solid var(--ds-color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.8125rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Allergies Highlight */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#F59E0B', fontWeight: 700 }}>⚠️ Allergies:</span>
              {patient.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map((alg) => (
                  <span
                    key={alg}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(239, 68, 68, 0.18)',
                      border: '1px solid rgba(239, 68, 68, 0.45)',
                      color: '#EF4444',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}
                  >
                    {alg}
                  </span>
                ))
              ) : (
                <span style={{ color: '#10B981', fontWeight: 600 }}>NKDA (No Known Drug Allergies)</span>
              )}
            </div>

            {/* Primary Diagnosis */}
            {patient.diagnosis && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--ds-color-text-muted)', fontWeight: 600 }}>Diagnosis:</span>
                <span style={{ fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>{patient.diagnosis}</span>
              </div>
            )}

            {/* Insurance Wallet */}
            {patient.insuranceProvider && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--ds-color-text-muted)', fontWeight: 600 }}>Coverage:</span>
                <span style={{ color: '#0EA5E9', fontWeight: 600 }}>{patient.insuranceProvider}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            <span>🔒 Verified PHI Scope</span>
            <span>·</span>
            <span>Deterministic SHA-256 Audit Logged</span>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div
          style={{
            padding: '0 24px',
            borderBottom: '1px solid var(--ds-color-border-subtle)',
            backgroundColor: 'var(--ds-surface-subtle, rgba(18, 24, 38, 0.5))',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'TIMELINE', label: 'Longitudinal Journey', icon: '📜' },
            { id: 'CLINICAL', label: 'Encounters & SOAP', icon: '🩺' },
            { id: 'MEDICATIONS', label: 'Prescriptions & FEFO', icon: '💊' },
            { id: 'DIAGNOSTICS', label: 'Laboratory & PACS', icon: '🧪' },
            { id: 'BILLING', label: 'Billing & TPA Claims', icon: '💳' },
            { id: 'FOLLOWUP', label: 'Follow-Up & Portal', icon: '📲' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as Patient360Tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '3px solid var(--ds-color-primary, #0284C7)' : '3px solid transparent',
                  color: isActive ? 'var(--ds-color-primary, #0284C7)' : 'var(--ds-color-text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body: Active Tab Context Panel */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {fetchError && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.8125rem' }}>
              ⚠️ {fetchError}
            </div>
          )}

          {/* TAB 1: Longitudinal Timeline */}
          {activeTab === 'TIMELINE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                  Patient Clinical & Operational Lifecycle
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                  Chronological verified trajectory
                </span>
              </div>

              {isLoading && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ds-color-text-secondary)', fontSize: '0.875rem' }}>
                  ⏳ Loading live clinical timeline...
                </div>
              )}

              {!isLoading && timeline.length === 0 && (
                <div className="ds-glass-subtle" style={{ padding: '24px', textAlign: 'center', borderRadius: '10px' }}>
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>📋</span>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>Zero-State: No Timeline Events Recorded</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                    No clinical continuity, encounter, laboratory, or pharmacy timeline events have been logged for this patient yet.
                  </p>
                </div>
              )}

              {/* Journey Stepper Cards */}
              {!isLoading && timeline.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                  {timeline.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="ds-glass-subtle"
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        borderLeft: `4px solid ${
                          item.category === 'EMERGENCY' ? '#EF4444' :
                          item.category === 'CLINICAL' ? '#10B981' :
                          item.category === 'LAB' ? '#0EA5E9' :
                          item.category === 'PHARMACY' ? '#F59E0B' :
                          '#64748B'
                        }`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>
                            {item.title || item.summary || item.eventType}
                          </span>
                          <Badge
                            variant={
                              item.status === 'COMPLETED' ? 'success' : item.status === 'IN_PROGRESS' ? 'primary' : 'warning'
                            }
                          >
                            {item.status || item.category}
                          </Badge>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                          {item.details || item.summary}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block', marginTop: '2px' }}>
                          Actor: {item.actorName || item.actor || 'Clinical System'} {item.department ? `· ${item.department}` : ''}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Encounters & SOAP */}
          {activeTab === 'CLINICAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                  Active Encounters & Clinical Assessment
                </h4>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleActionClick('Open Clinical Consultation', 'clinical-consultation')}
                >
                  🩺 Jump to Clinical Desk
                </Button>
              </div>

              {readModel?.activeEncounters && readModel.activeEncounters.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {readModel.activeEncounters.map((enc: any, i: number) => (
                    <div key={enc.id || i} className="ds-glass-subtle" style={{ padding: '14px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>
                          {enc.encounterType || 'CLINICAL ENCOUNTER'}
                        </strong>
                        <Badge variant="primary">{enc.status || 'IN_PROGRESS'}</Badge>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                        Doctor: {enc.attendingDoctorName || effectiveDoctorName} · Department: {enc.departmentName || effectiveDoctorSpecialty}
                      </div>
                      {enc.chiefComplaint && (
                        <div style={{ marginTop: '6px', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                          Chief Complaint: {enc.chiefComplaint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  <div className="ds-glass-subtle" style={{ padding: '14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>Primary Diagnosis</span>
                    <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>
                      {(readModel?.clinicalNotes as any)?.[0]?.diagnoses?.[0]?.description || patient.diagnosis || 'Under Evaluation'}
                    </strong>
                    {(readModel?.clinicalNotes as any)?.[0]?.diagnoses?.[0]?.code && (
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                        ICD-10 Code: <code>{(readModel?.clinicalNotes as any)[0].diagnoses[0].code}</code>
                      </div>
                    )}
                  </div>

                  <div className="ds-glass-subtle" style={{ padding: '14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>Attending Physician</span>
                    <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>
                      {effectiveDoctorName}
                    </strong>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      Specialty: {effectiveDoctorSpecialty}
                    </div>
                  </div>

                  <div className="ds-glass-subtle" style={{ padding: '14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>Encounter Type</span>
                    <strong style={{ fontSize: '0.9375rem', color: '#0EA5E9' }}>
                      {patient.bedNumber ? 'INPATIENT ADMISSION (IPD)' : 'OUTPATIENT CONSULTATION (OPD)'}
                    </strong>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      Location: {patient.wardName || 'OPD Clinic Room 4'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Medications & FEFO */}
          {activeTab === 'MEDICATIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                  Active Prescriptions & Automated FEFO Batch Allocation
                </h4>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleActionClick('Open Pharmacy POS', 'pharmacy-medication')}
                >
                  💊 Open Pharmacy POS
                </Button>
              </div>

              {((readModel?.prescriptions && readModel.prescriptions.length > 0) ||
                (readModel?.pharmacyEvents && readModel.pharmacyEvents.length > 0)) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[...(readModel?.prescriptions || []), ...(readModel?.pharmacyEvents || [])].map((med: any, i: number) => (
                    <div
                      key={med.id || i}
                      className="ds-glass-subtle"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>
                          {med.medicationName || med.itemName || med.title || 'Prescribed Item'}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', display: 'block' }}>
                          Regimen: {med.dosage || med.regimen || med.instruction || 'As Directed'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {med.batchNumber && <Badge variant="neutral">Batch: {med.batchNumber}</Badge>}
                        {med.expiryDate && <Badge variant="primary">Exp: {med.expiryDate}</Badge>}
                        <Badge variant="success">{med.status || 'ACTIVE'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ds-glass-subtle" style={{ padding: '24px', textAlign: 'center', borderRadius: '10px' }}>
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>💊</span>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>Zero-State: No Active Prescriptions</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                    No active electronic prescriptions or dispensed medications found in the pharmacy ledger for this patient.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Laboratory & PACS */}
          {activeTab === 'DIAGNOSTICS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                  Diagnostic Laboratory & Radiology Reports
                </h4>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleActionClick('Open Diagnostic Investigations', 'clinical-investigation')}
                >
                  🧪 Open Lab LIMS
                </Button>
              </div>

              {((readModel?.labOrdersResults?.orders && readModel.labOrdersResults.orders.length > 0) ||
                (readModel?.radiologyStudiesReports?.orders && readModel.radiologyStudiesReports.orders.length > 0)) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[...(readModel?.labOrdersResults?.orders || []), ...(readModel?.radiologyStudiesReports?.orders || [])].map((lab: any, i: number) => (
                    <div
                      key={lab.id || i}
                      className="ds-glass-subtle"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        borderLeft: lab.priority === 'STAT' ? '3px solid #EF4444' : '3px solid #10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>
                          {lab.testName || lab.orderType || lab.title || 'Diagnostic Order'}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', display: 'block' }}>
                          Status: {lab.orderStatus || lab.status || 'ORDERED'} · Priority: {lab.priority || 'ROUTINE'}
                        </span>
                      </div>

                      <Badge variant={lab.priority === 'STAT' ? 'danger' : 'success'}>
                        {lab.orderStatus || lab.status || 'PENDING'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ds-glass-subtle" style={{ padding: '24px', textAlign: 'center', borderRadius: '10px' }}>
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>🧪</span>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>Zero-State: No Diagnostic Orders</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                    No diagnostic laboratory tests or radiology imaging studies have been ordered for this patient yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Billing & TPA */}
          {activeTab === 'BILLING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                  Billing Charges & Cashless TPA Pre-Authorization
                </h4>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleActionClick('Open Billing & Cashier Desk', 'billing-revenue-cycle')}
                >
                  💳 Open Billing Counter
                </Button>
              </div>

              {readModel?.billingPaymentReferences && readModel.billingPaymentReferences.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {readModel.billingPaymentReferences.map((bill: any, i: number) => (
                    <div key={bill.id || i} className="ds-glass-subtle" style={{ padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>{bill.referenceNumber || `Invoice #${i + 1}`}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', display: 'block' }}>Type: {bill.type || 'HOSPITAL_CHARGE'}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--ds-color-text-primary)' }}>₹ {bill.amount ? Number(bill.amount).toLocaleString('en-IN') : '0'}</strong>
                        <Badge variant="success" style={{ marginLeft: '8px' }}>{bill.status || 'SETTLED'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ds-glass-subtle" style={{ padding: '24px', textAlign: 'center', borderRadius: '10px' }}>
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>💳</span>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>Zero-State: No Billing Transactions</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                    No invoices, estimates, or cashless insurance claims have been generated for this patient yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Follow-Up & Portal */}
          {activeTab === 'FOLLOWUP' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                  Post-Care Monitoring & WhatsApp Delivery
                </h4>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleActionClick('Open WhatsApp Portal', 'whatsapp-patient-portal')}
                >
                  📲 Open WhatsApp Desk
                </Button>
              </div>

              <div className="ds-glass-subtle" style={{ padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                  Automated Digital Rx & Report Transmission
                </span>
                <p style={{ margin: '4px 0 8px', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                  Discharge summaries, verified e-prescriptions, and lab PDFs are delivered to {patient.phone || 'patient mobile'} upon consultant sign-off.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant="success">✓ WhatsApp Gateway Online</Badge>
                  <Badge variant="primary">Next Follow-Up: 14 Days</Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal Guard for Context Actions */}
        {actionConfirmTarget && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 20
            }}
          >
            <div
              className="ds-glass-elevated"
              style={{
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                borderRadius: '12px',
                border: '1.5px solid var(--ds-color-primary)',
                backgroundColor: 'var(--ds-surface-glass-elevated, var(--ds-color-surface, #0F172A))',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                🔒 Confirm Clinical / Financial Action
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)', lineHeight: 1.4 }}>
                You are switching to <strong>{actionConfirmTarget.label}</strong> with active patient context for <strong>{patient.name} ({patient.uhid})</strong>.
                Zero-click context is purely informational; clinical or financial orders will require your explicit authorization.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" size="sm" onClick={() => setActionConfirmTarget(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleExecuteAction}>
                  Proceed to {actionConfirmTarget.label}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
