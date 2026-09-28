import React, { useState, useEffect, useCallback } from 'react';
import type {
  ConsultationDto,
  ConsultationOverviewDto,
  ConsultationAuditTraceDto,
  ConsultationMedicationDto,
  DoctorProfileDto,
  EncounterDto,
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  CreateConsultationRequest,
  SaveConsultationDraftRequest,
  AddDiagnosisRequest,
  AddMedicationRequest,
  CompleteConsultationRequest,
  InvestigationOrderDto
} from '@docsearch/api-contracts';
import { clinicalConsultationService } from '../services/clinical-consultation-service.js';
import { clinicalInvestigationService } from '../services/clinical-investigation-service.js';
import { encounterService } from '../services/encounter-service.js';
import { doctorRosterService } from '../services/doctor-roster-service.js';
import { partnerFoundationService } from '../services/partner-foundation-service.js';
import { hospitalEventBus, type HospitalEventPayload } from '../services/hospital-event-bus.js';
import { patientSessionTabService } from '../services/patient-session-tab-service.js';
import { getUnifiedPartnerProfile } from '../utils/roleProfileResolver.js';

import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { ConsultationOverviewView } from './views/ConsultationOverviewView.js';
import { ConsultationDoctorWorklistView } from './views/ConsultationDoctorWorklistView.js';
import { PatientClinicalTimelineView } from './views/PatientClinicalTimelineView.js';
import { ConsultationAuditVaultView } from './views/ConsultationAuditVaultView.js';
import { AmbientAiScribeView } from './views/AmbientAiScribeView.js';
import { VirtualConsultationRoomView } from './views/VirtualConsultationRoomView.js';
import { DoctorExpressConsultationDesk } from './views/DoctorExpressConsultationDesk.js';
import { SoloDoctorOpdCockpitView } from './views/SoloDoctorOpdCockpitView.js';

import { Tabs, Badge, ErrorState, Button, SkeletonPage } from '@docsearch/ui-kit';

export type ActiveConsultationTab =
  | 'cockpit'
  | 'overview'
  | 'worklist'
  | 'consultation'
  | 'timeline'
  | 'voice-scribe'
  | 'video-teleconsult'
  | 'audit';

export const ClinicalConsultationDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveConsultationTab>('worklist');
  const [context, setContext] = useState<PanelContextDto | null>(null);
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [facilities, setFacilities] = useState<OperationalFacilityDto[]>([]);

  const [overview, setOverview] = useState<ConsultationOverviewDto | null>(null);
  const [consultations, setConsultations] = useState<ConsultationDto[]>([]);
  const [encounters, setEncounters] = useState<EncounterDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfileDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<ConsultationAuditTraceDto[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationOrderDto[]>([]);

  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ctx = await partnerFoundationService.getPanelContext();
      setContext(ctx);

      const [partnersRes, orgsRes, facsRes] = await Promise.all([
        partnerFoundationService.getPartners(ctx.activeTenantId),
        partnerFoundationService.getOrganizations(ctx.activeTenantId),
        partnerFoundationService.getFacilities(ctx.activeTenantId)
      ]);
      setPartners(partnersRes);
      setOrganizations(orgsRes);
      setFacilities(facsRes);

      const [
        ov,
        consList,
        encs,
        docsList,
        audits,
        invs
      ] = await Promise.all([
        clinicalConsultationService.getOverview(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
        clinicalConsultationService.searchConsultations({ tenantId: ctx.activeTenantId, organizationId: ctx.activeOrganizationId }),
        encounterService.searchEncounters({ tenantId: ctx.activeTenantId, organizationId: ctx.activeOrganizationId }),
        doctorRosterService.getDoctors(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
        clinicalConsultationService.getAuditTraces({ tenantId: ctx.activeTenantId, pageIndex: 0, pageSize: 50 }),
        clinicalInvestigationService.searchOrders({ tenantId: ctx.activeTenantId, pageIndex: 0, pageSize: 200 })
      ]);

      setOverview(ov);
      setConsultations(consList);
      setEncounters(encs);
      setDoctors(docsList);
      setAuditTraces(audits);
      setInvestigations(invs);

      if (!selectedConsultationId && consList.length > 0 && consList[0]) {
        setSelectedConsultationId(consList[0].id);
      }
    } catch (err) {
      console.error('Failed to load Clinical Consultation & EMR data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load consultation data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedConsultationId]);

  useEffect(() => {
    void loadData();
    const handleEncounterSync = () => {
      void loadData();
    };
    const handleSwitchToCockpit = () => {
      setActiveTab('cockpit');
    };
    const handleSessionTabSwitched = (e: any) => {
      const tab = e.detail;
      if (tab && tab.module === 'clinical-consultation') {
        if (tab.consultationId) {
          setSelectedConsultationId(tab.consultationId);
          setActiveTab(tab.subTab === 'cockpit' ? 'cockpit' : 'consultation');
        } else if (tab.patientId) {
          const match = consultations.find((c) => c.patientId === tab.patientId);
          if (match) {
            setSelectedConsultationId(match.id);
            setActiveTab(tab.subTab === 'cockpit' ? 'cockpit' : 'consultation');
          }
        }
      }
    };
    window.addEventListener('docsearch:encounters-updated', handleEncounterSync);
    window.addEventListener('docsearch:patient-registered', handleEncounterSync);
    window.addEventListener('docsearch:switch_to_cockpit', handleSwitchToCockpit);
    window.addEventListener('docsearch:session_tab_switched' as any, handleSessionTabSwitched);
    return () => {
      window.removeEventListener('docsearch:encounters-updated', handleEncounterSync);
      window.removeEventListener('docsearch:patient-registered', handleEncounterSync);
      window.removeEventListener('docsearch:switch_to_cockpit', handleSwitchToCockpit);
      window.removeEventListener('docsearch:session_tab_switched' as any, handleSessionTabSwitched);
    };
  }, [loadData, consultations]);

  // Synchronize with global Active Patient selection
  useEffect(() => {
    const unsubscribe = hospitalEventBus.subscribe('PATIENT_SELECTED', (payload: HospitalEventPayload) => {
      if (payload.data) {
        const pId = payload.data.patientId;
        const pName = (payload.data.name || '').toLowerCase();
        const pUhid = (payload.data.uhid || '').toLowerCase();

        const match = consultations.find(
          (c) =>
            (pId && c.patientId === pId) ||
            (pName && c.patientName?.toLowerCase().includes(pName)) ||
            (pUhid && c.patientMrn?.toLowerCase().includes(pUhid))
        );

        if (match) {
          setSelectedConsultationId(match.id);
          setActiveTab('consultation');
        } else {
          // If no consultation yet, check if encounter exists to auto-create
          const encMatch = encounters.find(
            (e) =>
              (pId && e.patientId === pId) ||
              (pName && e.patientName?.toLowerCase().includes(pName)) ||
              (pUhid && e.patientMrn?.toLowerCase().includes(pUhid))
          );
          if (encMatch && context) {
            void clinicalConsultationService
              .createConsultation({
                tenantId: encMatch.tenantId || context.activeTenantId,
                partnerId: encMatch.partnerId || context.activePartnerId,
                organizationId: encMatch.organizationId || context.activeOrganizationId || '33333333-3333-4333-8333-333333333301',
                branchId: encMatch.branchId || context.activeFacilityId || '44444444-4444-4444-8444-444444444401',
                patientId: encMatch.patientId,
                encounterId: encMatch.id,
                doctorId: encMatch.doctorId || doctors[0]?.id || 'aaaa1111-1111-4aaa-8aaa-111111111101',
                consultationType: 'OPD_CONSULTATION',
                chiefComplaint: encMatch.chiefComplaint || 'Clinical consultation & prescription',
                actorId: context.userEmail,
                actorRole: context.userRole,
                justification: `Auto-started consultation on patient call: ${encMatch.patientName}`
              })
              .then((created) => {
                setSelectedConsultationId(created.id);
                setActiveTab('consultation');
                void loadData();
              });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [consultations, encounters, context, doctors, loadData]);

  const handleContextChange = async (newContext: Partial<PanelContextDto>) => {
    try {
      const updated = await partnerFoundationService.setPanelContext(newContext);
      setContext(updated);
      await loadData();
    } catch (err) {
      console.error('Failed to update panel context:', err);
    }
  };

  const handleSelectConsultation = (id: string) => {
    setSelectedConsultationId(id);
    setActiveTab(activeTab === 'cockpit' ? 'cockpit' : 'consultation');

    const selected = consultations.find((c) => c.id === id);
    if (selected) {
      hospitalEventBus.publish('PATIENT_SELECTED', 'ClinicalConsultationDomainManager', {
        patientId: selected.patientId,
        name: selected.patientName,
        uhid: selected.patientMrn,
        attendingDoctor: selected.doctorName,
        allergies: ['NKDA'],
        encounterType: 'OPD'
      });
      const enc = encounters.find((e) => e.id === selected.encounterId);
      patientSessionTabService.openTab({
        id: `opd-${selected.id}`,
        title: selected.patientName,
        subtitle: enc?.tokenNumber ? `Token #${enc.tokenNumber}` : selected.patientMrn || 'OPD',
        type: 'OPD',
        patientId: selected.patientId,
        patientName: selected.patientName,
        consultationId: selected.id,
        module: 'clinical-consultation',
        subTab: activeTab === 'cockpit' ? 'cockpit' : 'consultation'
      });
    }
  };

  const handleStartNewConsultation = async (req: CreateConsultationRequest) => {
    const created = await clinicalConsultationService.createConsultation(req);
    await loadData();
    handleSelectConsultation(created.id);
  };

  const handleSaveDraft = async (req: SaveConsultationDraftRequest) => {
    await clinicalConsultationService.saveDraft(req);
    patientSessionTabService.setTabDirty(`opd-${req.consultationId}`, false);
    await loadData();
  };

  const handleAddDiagnosis = async (req: AddDiagnosisRequest) => {
    await clinicalConsultationService.addDiagnosis(req);
    await loadData();
  };

  const handleRemoveDiagnosis = async (cons: ConsultationDto, diagnosisId: string) => {
    if (!context) return;
    await clinicalConsultationService.removeDiagnosis({
      tenantId: cons.tenantId,
      consultationId: cons.id,
      diagnosisId,
      actorId: context.userEmail,
      actorRole: context.userRole,
      justification: 'Removed clinical diagnosis from consultation dossier'
    });
    await loadData();
  };

  const handleAddMedication = async (req: AddMedicationRequest) => {
    await clinicalConsultationService.addMedication(req);
    await loadData();
  };

  const handleDiscontinueMedication = async (cons: ConsultationDto, med: ConsultationMedicationDto) => {
    if (!context) return;
    await clinicalConsultationService.discontinueMedication({
      tenantId: cons.tenantId,
      consultationId: cons.id,
      medicationId: med.id,
      discontinueReason: 'Discontinued by physician',
      actorId: context.userEmail,
      actorRole: context.userRole,
      justification: `Discontinued ${med.medicationName} prescription order`
    });
    await loadData();
  };

  const handleCompleteConsultation = async (req: CompleteConsultationRequest) => {
    await clinicalConsultationService.completeConsultation(req);
    patientSessionTabService.closeTab(`opd-${req.consultationId}`);
    await loadData();
  };

  const handleCallNextPatient = async () => {
    const currentEncId = selectedConsultation?.encounterId;
    const nextEnc = encounters.find(
      (e) => e.id !== currentEncId && e.status !== 'COMPLETED' && e.status !== 'CANCELLED'
    );
    if (nextEnc) {
      const existing = consultations.find(
        (c) => c.encounterId === nextEnc.id || (c.patientMrn && c.patientMrn === nextEnc.patientMrn)
      );
      if (existing) {
        handleSelectConsultation(existing.id);
      } else {
        await handleStartNewConsultation({
          tenantId: nextEnc.tenantId || 'default',
          partnerId: nextEnc.partnerId || 'default',
          organizationId: nextEnc.organizationId || '33333333-3333-4333-8333-333333333301',
          branchId: nextEnc.branchId || '44444444-4444-4444-8444-444444444401',
          patientId: nextEnc.patientId,
          encounterId: nextEnc.id,
          doctorId: nextEnc.doctorId || 'aaaa1111-1111-4aaa-8aaa-111111111101',
          consultationType: 'OPD_CONSULTATION',
          chiefComplaint: nextEnc.chiefComplaint || 'Outpatient Consultation',
          actorId: context?.userEmail || 'doctor@docsearch.internal',
          actorRole: context?.userRole || 'DOCTOR',
          justification: `Called next patient ${nextEnc.patientName} (${nextEnc.tokenNumber || ''})`
        });
      }
    } else {
      setActiveTab('worklist');
    }
  };

  const selectedConsultation = consultations.find((c) => c.id === selectedConsultationId) ?? consultations[0] ?? null;

  if (isLoading && !context) {
    return <SkeletonPage layout="table" metricCount={4} />;
  }

  if (error && !context) {
    return <ErrorState title="Failed to load Clinical Consultation Domain" message={error} onRetry={loadData} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Module Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Clinical Consultation & Medical Documentation (EMR)
          </h1>
          
          <Badge variant="success">● Live Dynamic EMR Engine</Badge>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Structured physician consultation workflows, ICD-10 diagnostics, prescription orders, patient care instructions, and immutable signed EMR records
        </p>
      </div>

      {/* Panel Context Switcher */}
      {context && (
        <PanelContextSwitcher
          context={context}
          partners={partners}
          organizations={organizations}
          facilities={facilities}
          onContextChange={handleContextChange}
        />
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'cockpit',
            label: '🩺 Solo OPD Cockpit (30/70)',
            badge: <Badge variant="success">Next-Gen</Badge>
          },
          { id: 'worklist', label: '👨‍⚕️ Live Token Queue & Appointments' },
          {
            id: 'consultation',
            label: '🩺 Express Consultation & Rx Desk',
            badge: selectedConsultation ? (
              <Badge variant="primary">
                Token {selectedConsultation.queueToken || selectedConsultation.patientName.split(' ')[0]}
              </Badge>
            ) : undefined
          },
          { id: 'timeline', label: '📅 Patient EMR Timeline' },
          { id: 'voice-scribe', label: '🎙️ Hinglish Voice Scribe', badge: <Badge variant="primary">AI Live</Badge> },
          { id: 'video-teleconsult', label: '📹 WebRTC Teleconsult' },
          { id: 'overview', label: '📊 Clinical Overview' },
          { id: 'audit', label: '🔒 Clinical Audit Vault' }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId: string) => setActiveTab(tabId as ActiveConsultationTab)}
      />

      {activeTab === 'cockpit' && context && (
        selectedConsultation ? (
          <SoloDoctorOpdCockpitView
            consultation={selectedConsultation}
            consultations={consultations}
            encounters={encounters}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onSelectConsultation={handleSelectConsultation}
            onBackToStandardDesk={() => setActiveTab('consultation')}
            onSaveDraft={async (_c, data) => {
              await handleSaveDraft({
                tenantId: _c.tenantId,
                consultationId: _c.id,
                chiefComplaint: data.chiefComplaint,
                clinicalAssessment: data.clinicalAssessment,
                treatmentPlan: data.treatmentPlan,
                actorId: context.userEmail,
                actorRole: context.userRole,
                justification: 'Auto-saved draft from Solo Doctor Cockpit'
              });
            }}
            onCompleteConsultation={async (_c, asmt, plan) => {
              await handleCompleteConsultation({
                tenantId: _c.tenantId,
                consultationId: _c.id,
                clinicalAssessment: asmt,
                treatmentPlan: plan,
                actorId: context.userEmail,
                actorRole: context.userRole,
                justification: 'Completed from Solo Doctor Cockpit'
              });
            }}
            onCallNextPatient={handleCallNextPatient}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed var(--ds-color-border)', borderRadius: '12px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🩺</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>No Patient Selected for Solo Cockpit</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--ds-color-text-muted)', fontSize: '0.875rem' }}>
              Please select an arriving patient from the Live Token Queue to launch the 30/70 Solo Doctor Cockpit.
            </p>
            <Button size="sm" variant="primary" onClick={() => setActiveTab('worklist')}>
              ← Go to Live Token Queue
            </Button>
          </div>
        )
      )}

      {activeTab === 'overview' && overview && (
        <ConsultationOverviewView
          overview={overview}
          consultations={consultations}
          onSelectConsultation={handleSelectConsultation}
          onOpenWorklist={() => setActiveTab('worklist')}
        />
      )}

      {activeTab === 'worklist' && context && (
        <ConsultationDoctorWorklistView
          doctors={doctors}
          consultations={consultations}
          encounters={encounters}
          actorId={context.userEmail}
          actorRole={context.userRole}
          onOpenConsultation={handleSelectConsultation}
          onStartNewConsultation={handleStartNewConsultation}
        />
      )}

      {activeTab === 'consultation' && context && (
        selectedConsultation ? (
          <DoctorExpressConsultationDesk
            consultation={selectedConsultation}
            consultations={consultations}
            encounters={encounters}
            onSelectConsultation={handleSelectConsultation}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onBackToQueue={() => setActiveTab('worklist')}
            onSaveDraft={async (_c, data) => {
              await handleSaveDraft({
                tenantId: _c.tenantId,
                consultationId: _c.id,
                chiefComplaint: data.chiefComplaint,
                clinicalAssessment: data.clinicalAssessment,
                treatmentPlan: data.treatmentPlan,
                actorId: context.userEmail,
                actorRole: context.userRole,
                justification: 'Auto-saved draft from Doctor Express Desk'
              });
            }}
            onCompleteConsultation={async (_c, asmt, plan) => {
              await handleCompleteConsultation({
                tenantId: _c.tenantId,
                consultationId: _c.id,
                clinicalAssessment: asmt,
                treatmentPlan: plan,
                actorId: context.userEmail,
                actorRole: context.userRole,
                justification: 'Completed & signed consultation from Doctor Express Desk'
              });
            }}
            onCallNextPatient={handleCallNextPatient}
            onAddMedication={handleAddMedication}
            onRemoveMedication={async (medId) => {
              const med = selectedConsultation.medications.find((m) => m.id === medId);
              if (med) {
                await handleDiscontinueMedication(selectedConsultation, med);
              }
            }}
            onAddDiagnosis={handleAddDiagnosis}
            onRemoveDiagnosis={(diagId) => handleRemoveDiagnosis(selectedConsultation, diagId)}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed var(--ds-color-border)', borderRadius: '12px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🩺</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>No Patient Consultation Selected</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--ds-color-text-muted)', fontSize: '0.875rem' }}>
              Please select an arriving patient from the Live Token Queue to open the consultation desk.
            </p>
            <Button size="sm" variant="primary" onClick={() => setActiveTab('worklist')}>
              ← Go to Live Token Queue
            </Button>
          </div>
        )
      )}

      {activeTab === 'voice-scribe' && (
        <AmbientAiScribeView
          patientName={selectedConsultation?.patientName || 'Patient'}
          doctorName={selectedConsultation?.doctorName || getUnifiedPartnerProfile().doctorName || 'Consulting Physician'}
          patientPhone={selectedConsultation?.patientMobile || ''}
          transcripts={[]}
          onGenerateSoap={async (extractedData?: any) => {
            if (selectedConsultation) {
              const complaint = extractedData?.chiefComplaint || extractedData?.subjective || 'Acute viral upper respiratory symptoms with fever and throat congestion';
              const assessment = extractedData?.assessment || extractedData?.clinicalAssessment || 'Acute Viral Bronchitis & Pharyngitis (Renally Safe Protocol Applied)';
              const plan = extractedData?.plan || extractedData?.treatmentPlan || '• Tab. Paracetamol 650mg TDS (Renally Safe Antipyretic)\n• Tab. Levocetirizine 5mg OD\n• High Hydration Protocol\n• NSAIDs Strictly Avoided';

              // Map medications if provided
              const newMeds = Array.isArray(extractedData?.rx)
                ? extractedData.rx.map((r: any, idx: number) => ({
                    id: `med-${Date.now()}-${idx}`,
                    medicationName: r.name,
                    strength: '500mg',
                    dosage: r.dose || '1 Tab',
                    frequency: r.freq || '1 - 0 - 1',
                    duration: 5,
                    durationUnit: 'DAYS',
                    beforeAfterFood: 'AFTER_FOOD',
                    instructions: r.notes || 'After meals with water'
                  }))
                : selectedConsultation.medications;

              // Map diagnoses if provided
              const newDiagnoses = Array.isArray(extractedData?.icd10)
                ? extractedData.icd10.map((d: any, idx: number) => ({
                    id: `diag-${Date.now()}-${idx}`,
                    diagnosisCode: d.code,
                    diagnosisName: d.description,
                    diagnosisType: 'PRIMARY',
                    confidence: d.confidence
                  }))
                : selectedConsultation.diagnoses;

              await handleSaveDraft({
                tenantId: selectedConsultation.tenantId,
                consultationId: selectedConsultation.id,
                chiefComplaint: complaint,
                clinicalAssessment: assessment,
                treatmentPlan: plan,
                actorId: context?.userEmail || getUnifiedPartnerProfile().supportEmail || 'attending.doctor@docsearch.health',
                actorRole: context?.userRole || 'CLINIC_DOCTOR',
                justification: 'Auto-applied Ambient Voice Scribe dynamic LLM SOAP notes & verified medications to EMR'
              });

              // Update active consultation in memory
              setConsultations((prev) =>
                prev.map((c) =>
                  c.id === selectedConsultation.id
                    ? {
                        ...c,
                        chiefComplaint: complaint,
                        clinicalAssessment: assessment,
                        treatmentPlan: plan,
                        medications: newMeds,
                        diagnoses: newDiagnoses
                      }
                    : c
                )
              );

              setActiveTab('consultation');
            }
          }}
        />
      )}

      {activeTab === 'video-teleconsult' && (
        <VirtualConsultationRoomView
          session={{
            id: selectedConsultation?.id || '11111111-1111-4111-8111-111111111111',
            tenantId: selectedConsultation?.tenantId || '22222222-2222-4222-8222-222222222222',
            appointmentNumber: selectedConsultation?.consultationNumber || 'APT-2026-9041',
            patientMrn: selectedConsultation?.patientMrn || 'MRN-2026-9041',
            patientName: selectedConsultation?.patientName || 'Patient',
            doctorName: selectedConsultation?.doctorName || getUnifiedPartnerProfile().doctorName || 'Consulting Physician',
            specialtyName: selectedConsultation?.doctorSpecialty || getUnifiedPartnerProfile().doctorSpecialty || 'General Medicine & Telehealth',
            scheduledStartTime: new Date().toISOString(),
            callDurationSeconds: 148,
            webrtcRoomId: `ROOM-TELE-${selectedConsultation?.patientMrn || '2026-9041'}`,
            status: 'CALL_IN_PROGRESS',
            consultationFeeInr: 500,
            paymentStatus: 'PAID',
            clinicalSoapSummary: selectedConsultation?.chiefComplaint || 'Follow-up for Seasonal Allergic Rhinitis & Sinusitis',
            ePrescriptionGenerated: selectedConsultation?.medications ? selectedConsultation.medications.length > 0 : false,
            createdAt: new Date().toISOString()
          }}
        />
      )}

      {activeTab === 'timeline' && (
        <PatientClinicalTimelineView
          consultations={consultations}
          investigations={investigations}
          onSelectConsultation={handleSelectConsultation}
        />
      )}


      {activeTab === 'audit' && (
        <ConsultationAuditVaultView
          auditTraces={auditTraces}
        />
      )}

    </div>
  );
};
