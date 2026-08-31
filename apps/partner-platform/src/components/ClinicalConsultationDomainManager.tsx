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
  StartConsultationRequest,
  SaveConsultationDraftRequest,
  AddConsultationVitalsRequest,
  AddDiagnosisRequest,
  UpdateMedicationRequest,
  AddMedicationRequest,
  AddInstructionRequest,
  CreateFollowUpPlanRequest,
  CompleteConsultationRequest,
  AmendConsultationRequest
} from '@docsearch/api-contracts';
import { clinicalConsultationService } from '../services/clinical-consultation-service.js';
import { encounterService } from '../services/encounter-service.js';
import { doctorRosterService } from '../services/doctor-roster-service.js';
import { partnerFoundationService } from '../services/partner-foundation-service.js';

import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { ConsultationOverviewView } from './views/ConsultationOverviewView.js';
import { ConsultationDoctorWorklistView } from './views/ConsultationDoctorWorklistView.js';
import { ClinicalConsultationView } from './views/ClinicalConsultationView.js';
import { PatientClinicalTimelineView } from './views/PatientClinicalTimelineView.js';
import { DiagnosisCenterView } from './views/DiagnosisCenterView.js';
import { PrescriptionCenterView } from './views/PrescriptionCenterView.js';
import { FollowUpPlanView } from './views/FollowUpPlanView.js';
import { ConsultationAuditVaultView } from './views/ConsultationAuditVaultView.js';
import { AmbientAiScribeView } from './views/AmbientAiScribeView.js';
import { VirtualConsultationRoomView } from './views/VirtualConsultationRoomView.js';

// Dialogs
import { StartConsultationDialog } from './dialogs/StartConsultationDialog.js';
import { SaveConsultationDraftDialog } from './dialogs/SaveConsultationDraftDialog.js';
import { AddVitalsDialog } from './dialogs/AddVitalsDialog.js';
import { AddDiagnosisDialog } from './dialogs/AddDiagnosisDialog.js';
import { AddMedicationDialog } from './dialogs/AddMedicationDialog.js';
import { EditMedicationDialog } from './dialogs/EditMedicationDialog.js';
import { AddInstructionDialog } from './dialogs/AddInstructionDialog.js';
import { CreateFollowUpPlanDialog } from './dialogs/CreateFollowUpPlanDialog.js';
import { CompleteConsultationDialog } from './dialogs/CompleteConsultationDialog.js';
import { AmendConsultationDialog } from './dialogs/AmendConsultationDialog.js';

import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

export type ActiveConsultationTab =
  | 'overview'
  | 'worklist'
  | 'consultation'
  | 'voice-scribe'
  | 'video-teleconsult'
  | 'timeline'
  | 'diagnoses'
  | 'prescriptions'
  | 'followups'
  | 'audit';

export const ClinicalConsultationDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveConsultationTab>('overview');
  const [context, setContext] = useState<PanelContextDto | null>(null);
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [facilities, setFacilities] = useState<OperationalFacilityDto[]>([]);

  const [overview, setOverview] = useState<ConsultationOverviewDto | null>(null);
  const [consultations, setConsultations] = useState<ConsultationDto[]>([]);
  const [encounters, setEncounters] = useState<EncounterDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfileDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<ConsultationAuditTraceDto[]>([]);

  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isSaveDraftOpen, setIsSaveDraftOpen] = useState(false);
  const [isAddVitalsOpen, setIsAddVitalsOpen] = useState(false);
  const [isAddDiagnosisOpen, setIsAddDiagnosisOpen] = useState(false);
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const [isEditMedicationOpen, setIsEditMedicationOpen] = useState(false);
  const [isAddInstructionOpen, setIsAddInstructionOpen] = useState(false);
  const [isCreateFollowUpOpen, setIsCreateFollowUpOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isAmendOpen, setIsAmendOpen] = useState(false);

  const [draftPayload, setDraftPayload] = useState<Partial<ConsultationDto>>({});
  const [selectedMedication, setSelectedMedication] = useState<ConsultationMedicationDto | null>(null);
  const [completionAssessment, setCompletionAssessment] = useState('');
  const [completionPlan, setCompletionPlan] = useState('');

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
        audits
      ] = await Promise.all([
        clinicalConsultationService.getOverview(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
        clinicalConsultationService.searchConsultations({ tenantId: ctx.activeTenantId, organizationId: ctx.activeOrganizationId }),
        encounterService.searchEncounters({ tenantId: ctx.activeTenantId, organizationId: ctx.activeOrganizationId }),
        doctorRosterService.getDoctors(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
        clinicalConsultationService.getAuditTraces({ tenantId: ctx.activeTenantId, pageIndex: 0, pageSize: 50 })
      ]);

      setOverview(ov);
      setConsultations(consList);
      setEncounters(encs);
      setDoctors(docsList);
      setAuditTraces(audits);

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
  }, [loadData]);

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
    setActiveTab('consultation');
  };

  const handleStartNewConsultation = async (req: CreateConsultationRequest) => {
    const created = await clinicalConsultationService.createConsultation(req);
    setSelectedConsultationId(created.id);
    setActiveTab('consultation');
    await loadData();
  };

  const handleStartConsultationSession = async (req: StartConsultationRequest) => {
    await clinicalConsultationService.startConsultation(req);
    await loadData();
  };

  const handleSaveDraft = async (req: SaveConsultationDraftRequest) => {
    await clinicalConsultationService.saveDraft(req);
    await loadData();
  };

  const handleAddVitals = async (req: AddConsultationVitalsRequest) => {
    await clinicalConsultationService.addVitals(req);
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

  const handleUpdateMedication = async (req: UpdateMedicationRequest) => {
    await clinicalConsultationService.updateMedication(req);
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

  const handleAddInstruction = async (req: AddInstructionRequest) => {
    await clinicalConsultationService.addInstruction(req);
    await loadData();
  };

  const handleCreateFollowUp = async (req: CreateFollowUpPlanRequest) => {
    await clinicalConsultationService.createFollowUpPlan(req);
    await loadData();
  };

  const handleCompleteConsultation = async (req: CompleteConsultationRequest) => {
    await clinicalConsultationService.completeConsultation(req);
    await loadData();
  };

  const handleAmendConsultation = async (req: AmendConsultationRequest) => {
    await clinicalConsultationService.amendConsultation(req);
    await loadData();
  };

  const selectedConsultation = consultations.find((c) => c.id === selectedConsultationId) ?? consultations[0] ?? null;

  if (isLoading && !context) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !context) {
    return <ErrorState title="Failed to load Clinical Consultation Domain" message={error} onRetry={loadData} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Module Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Clinical Consultation & Medical Documentation (EMR)
          </h1>
          
          <Badge variant="warning">Development Preview (Sample Data)</Badge>
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
          { id: 'overview', label: '📊 Overview' },
          { id: 'worklist', label: '👨‍⚕️ Doctor Worklist' },
          { id: 'consultation', label: '🩺 EMR Dossier' },
          { id: 'voice-scribe', label: '🎙️ Hinglish Voice Scribe', badge: <Badge variant="primary">AI Live</Badge> },
          { id: 'video-teleconsult', label: '📹 WebRTC Video Teleconsult', badge: <Badge variant="success">HD Encrypted</Badge> },
          { id: 'timeline', label: '📜 Patient Timeline' },
          { id: 'diagnoses', label: '🔬 Diagnosis Center' },
          { id: 'prescriptions', label: '💊 Prescription Center' },
          { id: 'followups', label: '📅 Follow-Up Board' },
          { id: 'audit', label: '🛡️ Audit Vault', badge: <Badge variant="neutral">{auditTraces.length}</Badge> }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId: string) => setActiveTab(tabId as ActiveConsultationTab)}
      />

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
        <ClinicalConsultationView
          consultation={selectedConsultation}
          actorId={context.userEmail}
          actorRole={context.userRole}
          onStartConsultation={() => setIsStartOpen(true)}
          onSaveDraft={(_c, data) => {
            setDraftPayload(data);
            setIsSaveDraftOpen(true);
          }}
          onOpenAddVitals={() => setIsAddVitalsOpen(true)}
          onOpenAddDiagnosis={() => setIsAddDiagnosisOpen(true)}
          onRemoveDiagnosis={handleRemoveDiagnosis}
          onOpenAddMedication={() => setIsAddMedicationOpen(true)}
          onOpenEditMedication={(_c, m) => {
            setSelectedMedication(m);
            setIsEditMedicationOpen(true);
          }}
          onDiscontinueMedication={handleDiscontinueMedication}
          onOpenAddInstruction={() => setIsAddInstructionOpen(true)}
          onOpenCreateFollowUp={() => setIsCreateFollowUpOpen(true)}
          onOpenCompleteConsultation={(_c, asmt, plan) => {
            setCompletionAssessment(asmt);
            setCompletionPlan(plan);
            setIsCompleteOpen(true);
          }}
          onOpenAmendConsultation={() => setIsAmendOpen(true)}
        />
      )}

      {activeTab === 'voice-scribe' && (
        <AmbientAiScribeView transcripts={[]} onGenerateSoap={() => {}} />
      )}

      {activeTab === 'video-teleconsult' && (
        <VirtualConsultationRoomView
          session={{
            id: '11111111-1111-4111-8111-111111111111',
            tenantId: '22222222-2222-4222-8222-222222222222',
            appointmentNumber: 'APT-2026-9041',
            patientMrn: 'MRN-2026-9041',
            patientName: 'Anjali Gupta',
            doctorName: 'Dr. Rajesh Sharma, MD',
            specialtyName: 'General Medicine & Telehealth',
            scheduledStartTime: new Date().toISOString(),
            callDurationSeconds: 148,
            webrtcRoomId: 'ROOM-TELE-2026-9041',
            status: 'CALL_IN_PROGRESS',
            consultationFeeInr: 500,
            paymentStatus: 'PAID',
            clinicalSoapSummary: 'Follow-up for Seasonal Allergic Rhinitis & Sinusitis',
            ePrescriptionGenerated: true,
            createdAt: new Date().toISOString()
          }}
        />
      )}

      {activeTab === 'timeline' && (
        <PatientClinicalTimelineView
          consultations={consultations}
          onSelectConsultation={handleSelectConsultation}
        />
      )}

      {activeTab === 'diagnoses' && (
        <DiagnosisCenterView
          consultations={consultations}
          onSelectConsultation={handleSelectConsultation}
        />
      )}

      {activeTab === 'prescriptions' && (
        <PrescriptionCenterView
          consultations={consultations}
          onSelectConsultation={handleSelectConsultation}
        />
      )}

      {activeTab === 'followups' && (
        <FollowUpPlanView
          consultations={consultations}
          onSelectConsultation={handleSelectConsultation}
        />
      )}

      {activeTab === 'audit' && (
        <ConsultationAuditVaultView
          auditTraces={auditTraces}
        />
      )}

      {/* Audited Dialogs */}
      {selectedConsultation && context && (
        <>
          <StartConsultationDialog
            isOpen={isStartOpen}
            onClose={() => setIsStartOpen(false)}
            consultation={selectedConsultation}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onStart={handleStartConsultationSession}
          />

          <SaveConsultationDraftDialog
            isOpen={isSaveDraftOpen}
            onClose={() => setIsSaveDraftOpen(false)}
            consultation={selectedConsultation}
            draftData={draftPayload}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onSaveDraft={handleSaveDraft}
          />

          <AddVitalsDialog
            isOpen={isAddVitalsOpen}
            onClose={() => setIsAddVitalsOpen(false)}
            consultation={selectedConsultation}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onAddVitals={handleAddVitals}
          />

          <AddDiagnosisDialog
            isOpen={isAddDiagnosisOpen}
            onClose={() => setIsAddDiagnosisOpen(false)}
            consultation={selectedConsultation}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onAddDiagnosis={handleAddDiagnosis}
          />

          <AddMedicationDialog
            isOpen={isAddMedicationOpen}
            onClose={() => setIsAddMedicationOpen(false)}
            consultation={selectedConsultation}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onAddMedication={handleAddMedication}
          />

          {selectedMedication && (
            <EditMedicationDialog
              isOpen={isEditMedicationOpen}
              onClose={() => {
                setIsEditMedicationOpen(false);
                setSelectedMedication(null);
              }}
              consultation={selectedConsultation}
              medication={selectedMedication}
              actorId={context.userEmail}
              actorRole={context.userRole}
              onUpdateMedication={handleUpdateMedication}
            />
          )}

          <AddInstructionDialog
            isOpen={isAddInstructionOpen}
            onClose={() => setIsAddInstructionOpen(false)}
            consultation={selectedConsultation}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onAddInstruction={handleAddInstruction}
          />

          <CreateFollowUpPlanDialog
            isOpen={isCreateFollowUpOpen}
            onClose={() => setIsCreateFollowUpOpen(false)}
            consultation={selectedConsultation}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onCreateFollowUp={handleCreateFollowUp}
          />

          <CompleteConsultationDialog
            isOpen={isCompleteOpen}
            onClose={() => setIsCompleteOpen(false)}
            consultation={selectedConsultation}
            assessment={completionAssessment}
            treatmentPlan={completionPlan}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onComplete={handleCompleteConsultation}
          />

          <AmendConsultationDialog
            isOpen={isAmendOpen}
            onClose={() => setIsAmendOpen(false)}
            consultation={selectedConsultation}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onAmend={handleAmendConsultation}
          />
        </>
      )}
    </div>
  );
};
