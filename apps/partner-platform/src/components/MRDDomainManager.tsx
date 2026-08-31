import React, { useState, useEffect, useCallback } from 'react';
import type {
  MRDepartmentDto,
  MedicalRecordIndexDto,
  MedicalRecordCompletionTaskDto,
  ICDCodeItemDto,
  MedicalDiagnosisCodeDto,
  CodingReviewDto,
  ClinicalDocumentationQueryDto,
  ReleaseOfInformationRequestDto,
  LegalRecordRequestDto,
  MedicalRecordLegalHoldDto,
  BirthRegistryRecordDto,
  DeathRegistryRecordDto,
  MedicalRecordAuditTraceDto,
  MRDOverviewMetricsDto,
  MRDAnalyticsDto
} from '@docsearch/api-contracts';

import { mrdManagementService } from '../services/mrd-management-service.js';

import { MRDCommandCenterView } from './views/MRDCommandCenterView.js';
import { MedicalRecordDirectoryView } from './views/MedicalRecordDirectoryView.js';
import { MedicalRecordDetailView } from './views/MedicalRecordDetailView.js';
import { RecordCompletionWorkbenchView } from './views/RecordCompletionWorkbenchView.js';
import { ICD10CodingWorkbenchView } from './views/ICD10CodingWorkbenchView.js';
import { CodingReviewView } from './views/CodingReviewView.js';
import { ClinicalQueryWorkbenchView } from './views/ClinicalQueryWorkbenchView.js';
import { MedicalRecordArchiveView } from './views/MedicalRecordArchiveView.js';
import { RecordRetrievalView } from './views/RecordRetrievalView.js';
import { ROIWorkbenchView } from './views/ROIWorkbenchView.js';
import { LegalRequestView } from './views/LegalRequestView.js';
import { BirthRegistryView } from './views/BirthRegistryView.js';
import { DeathRegistryView } from './views/DeathRegistryView.js';
import { MRDAnalyticsView } from './views/MRDAnalyticsView.js';
import { MRDAuditVaultView } from './views/MRDAuditVaultView.js';
import { MRDControlCenterView } from './views/MRDControlCenterView.js';
import { AiDischargeSummaryClaimView } from './views/AiDischargeSummaryClaimView.js';

import { CreateRecordCompletionDialog } from './dialogs/CreateRecordCompletionDialog.js';
import { AssignDiagnosisCodeDialog } from './dialogs/AssignDiagnosisCodeDialog.js';
import { EditDiagnosisCodeDialog } from './dialogs/EditDiagnosisCodeDialog.js';
import { SubmitCodingReviewDialog } from './dialogs/SubmitCodingReviewDialog.js';
import { CreateClinicalQueryDialog } from './dialogs/CreateClinicalQueryDialog.js';
import { ResolveClinicalQueryDialog } from './dialogs/ResolveClinicalQueryDialog.js';
import { RetrieveMedicalRecordDialog } from './dialogs/RetrieveMedicalRecordDialog.js';
import { CreateROIRequestDialog } from './dialogs/CreateROIRequestDialog.js';
import { ApproveROIRequestDialog } from './dialogs/ApproveROIRequestDialog.js';
import { ReleaseMedicalRecordDialog } from './dialogs/ReleaseMedicalRecordDialog.js';
import { CreateLegalRequestDialog } from './dialogs/CreateLegalRequestDialog.js';
import { CreateLegalHoldDialog } from './dialogs/CreateLegalHoldDialog.js';
import { RegisterBirthRecordDialog } from './dialogs/RegisterBirthRecordDialog.js';
import { RegisterDeathRecordDialog } from './dialogs/RegisterDeathRecordDialog.js';

interface Props {
  tenantId?: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
}

export const MRDDomainManager: React.FC<Props> = ({
  tenantId = '11111111-1111-4111-8111-111111111111',
  partnerId = '22222222-2222-4222-8222-222222222222',
  organizationId = '33333333-3333-4333-8333-333333333333',
  branchId = '44444444-4444-4444-8444-444444444444'
}) => {
  const [activeTab, setActiveTab] = useState('command-center');
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState<MRDOverviewMetricsDto | null>(null);
  const [analytics, setAnalytics] = useState<MRDAnalyticsDto | null>(null);
  const [department, setDepartment] = useState<MRDepartmentDto | null>(null);
  const [records, setRecords] = useState<MedicalRecordIndexDto[]>([]);
  const [completionTasks, setCompletionTasks] = useState<MedicalRecordCompletionTaskDto[]>([]);
  const [catalog, setCatalog] = useState<ICDCodeItemDto[]>([]);
  const [diagnoses, setDiagnoses] = useState<MedicalDiagnosisCodeDto[]>([]);
  const [codingReviews, setCodingReviews] = useState<CodingReviewDto[]>([]);
  const [clinicalQueries, setClinicalQueries] = useState<ClinicalDocumentationQueryDto[]>([]);
  const [roiRequests, setRoiRequests] = useState<ReleaseOfInformationRequestDto[]>([]);
  const [legalRequests, setLegalRequests] = useState<LegalRecordRequestDto[]>([]);
  const [legalHolds, setLegalHolds] = useState<MedicalRecordLegalHoldDto[]>([]);
  const [birthRecords, setBirthRecords] = useState<BirthRegistryRecordDto[]>([]);
  const [deathRecords, setDeathRecords] = useState<DeathRegistryRecordDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<MedicalRecordAuditTraceDto[]>([]);

  const [selectedRecord, setSelectedRecord] = useState<MedicalRecordIndexDto | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<MedicalDiagnosisCodeDto | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<ClinicalDocumentationQueryDto | null>(null);
  const [selectedROI, setSelectedROI] = useState<ReleaseOfInformationRequestDto | null>(null);

  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isAssignDiagnosisDialogOpen, setIsAssignDiagnosisDialogOpen] = useState(false);
  const [isEditDiagnosisDialogOpen, setIsEditDiagnosisDialogOpen] = useState(false);
  const [isCodingReviewDialogOpen, setIsCodingReviewDialogOpen] = useState(false);
  const [isClinicalQueryDialogOpen, setIsClinicalQueryDialogOpen] = useState(false);
  const [isResolveQueryDialogOpen, setIsResolveQueryDialogOpen] = useState(false);
  const [isRetrieveDialogOpen, setIsRetrieveDialogOpen] = useState(false);
  const [isCreateROIDialogOpen, setIsCreateROIDialogOpen] = useState(false);
  const [isApproveROIDialogOpen, setIsApproveROIDialogOpen] = useState(false);
  const [isReleaseRecordDialogOpen, setIsReleaseRecordDialogOpen] = useState(false);
  const [isLegalRequestDialogOpen, setIsLegalRequestDialogOpen] = useState(false);
  const [isLegalHoldDialogOpen, setIsLegalHoldDialogOpen] = useState(false);
  const [isBirthDialogOpen, setIsBirthDialogOpen] = useState(false);
  const [isDeathDialogOpen, setIsDeathDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, a, dept, recs, tasks, cat, diag, revs, queries, rois, legReqs, holds, births, deaths, audits] =
        await Promise.all([
          mrdManagementService.getOverviewMetrics(tenantId),
          mrdManagementService.getAnalytics(tenantId),
          mrdManagementService.getDepartment(tenantId),
          mrdManagementService.getRecords(tenantId),
          mrdManagementService.getCompletionTasks(tenantId),
          mrdManagementService.getICD10Catalog(),
          mrdManagementService.getDiagnosisCodes(tenantId),
          mrdManagementService.getCodingReviews(tenantId),
          mrdManagementService.getClinicalQueries(tenantId),
          mrdManagementService.getROIRequests(tenantId),
          mrdManagementService.getLegalRequests(tenantId),
          mrdManagementService.getLegalHolds(tenantId),
          mrdManagementService.getBirthRecords(tenantId),
          mrdManagementService.getDeathRecords(tenantId),
          mrdManagementService.getAuditTraces(tenantId)
        ]);

      setMetrics(m);
      setAnalytics(a);
      setDepartment(dept);
      setRecords(recs);
      setCompletionTasks(tasks);
      setCatalog(cat);
      setDiagnoses(diag);
      setCodingReviews(revs);
      setClinicalQueries(queries);
      setRoiRequests(rois);
      setLegalRequests(legReqs);
      setLegalHolds(holds);
      setBirthRecords(births);
      setDeathRecords(deaths);
      setAuditTraces(audits);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2 pb-2 text-xs font-bold">
        {[
          { id: 'command-center', label: 'Command Center', icon: '📁' },
          { id: 'records', label: 'Medical Records Index', icon: '📑' },
          { id: 'completion', label: 'Record Deficiencies', icon: '📝' },
          { id: 'coding', label: 'ICD-10 Coding', icon: '🏷' },
          { id: 'coding-review', label: 'Coding Audit & Review', icon: '🔍' },
          { id: 'cdi-queries', label: 'Clinical Queries (CDI)', icon: '💬' },
          { id: 'archive', label: 'Archive & Vault', icon: '🏛' },
          { id: 'retrieval', label: 'Chart Movement', icon: '📦' },
          { id: 'roi', label: 'Release of Information', icon: '📤' },
          { id: 'legal', label: 'Legal Holds & Subpoenas', icon: '⚖' },
          { id: 'birth-registry', label: 'Birth Registry', icon: '👶' },
          { id: 'death-registry', label: 'Death Registry', icon: '⚰' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
          { id: 'audit-vault', label: 'Audit Vault', icon: '🔒' },
          { id: 'control-center', label: 'Control Center', icon: '⚙' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'records') setSelectedRecord(null);
            }}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm">Loading Medical Records & HIM Workspace...</div>
      ) : (
        <>
          {activeTab === 'command-center' && (
            <MRDCommandCenterView
              metrics={metrics}
              department={department}
              onNavigateTab={setActiveTab}
              onOpenBirthDialog={() => setIsBirthDialogOpen(true)}
              onOpenDeathDialog={() => setIsDeathDialogOpen(true)}
            />
          )}

          {activeTab === 'records' && !selectedRecord && (
            <MedicalRecordDirectoryView
              records={records}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onOpenDeficiencyDialog={(rec) => {
                setSelectedRecord(rec);
                setIsCompletionDialogOpen(true);
              }}
              onOpenCodingDialog={(rec) => {
                setSelectedRecord(rec);
                setIsAssignDiagnosisDialogOpen(true);
              }}
              onOpenROIDialog={(rec) => {
                setSelectedRecord(rec);
                setIsCreateROIDialogOpen(true);
              }}
              onOpenLegalDialog={(rec) => {
                setSelectedRecord(rec);
                setIsLegalRequestDialogOpen(true);
              }}
            />
          )}

          {activeTab === 'records' && selectedRecord && (
            <MedicalRecordDetailView
              record={selectedRecord}
              diagnoses={diagnoses}
              tasks={completionTasks}
              onBack={() => setSelectedRecord(null)}
              onOpenCodingDialog={() => setIsAssignDiagnosisDialogOpen(true)}
              onOpenTaskDialog={() => setIsCompletionDialogOpen(true)}
            />
          )}

          {activeTab === 'ai-discharge-claim' && (
        <AiDischargeSummaryClaimView />
      )}

      {activeTab === 'completion' && (
            <RecordCompletionWorkbenchView
              tasks={completionTasks}
              onCompleteTask={async (task) => {
                await mrdManagementService.completeRecordTask({
                  tenantId,
                  taskId: task.id,
                  resolvedByStaff: 'Dr. Evelyn Reed, MD',
                  notes: 'Completed and electronically signed'
                });
                await loadData();
              }}
            />
          )}

          {activeTab === 'coding' && (
            <ICD10CodingWorkbenchView
              records={records}
              diagnoses={diagnoses}
              catalog={catalog}
              onOpenAssignDialog={(rec) => {
                setSelectedRecord(rec);
                setIsAssignDiagnosisDialogOpen(true);
              }}
              onOpenEditDialog={(diag) => {
                setSelectedDiagnosis(diag);
                setIsEditDiagnosisDialogOpen(true);
              }}
              onOpenQueryDialog={(rec) => {
                setSelectedRecord(rec);
                setIsClinicalQueryDialogOpen(true);
              }}
            />
          )}

          {activeTab === 'coding-review' && (
            <CodingReviewView
              reviews={codingReviews}
              records={records}
              onOpenSubmitReview={(rec) => {
                setSelectedRecord(rec);
                setIsCodingReviewDialogOpen(true);
              }}
            />
          )}

          {activeTab === 'cdi-queries' && (
            <ClinicalQueryWorkbenchView
              queries={clinicalQueries}
              onOpenResolveDialog={(q) => {
                setSelectedQuery(q);
                setIsResolveQueryDialogOpen(true);
              }}
            />
          )}

          {activeTab === 'archive' && (
            <MedicalRecordArchiveView
              records={records}
              department={department}
              onOpenRetrieveDialog={(rec) => {
                setSelectedRecord(rec);
                setIsRetrieveDialogOpen(true);
              }}
            />
          )}

          {activeTab === 'retrieval' && <RecordRetrievalView records={records} />}

          {activeTab === 'roi' && (
            <ROIWorkbenchView
              requests={roiRequests}
              onApprove={(r) => {
                setSelectedROI(r);
                setIsApproveROIDialogOpen(true);
              }}
              onRelease={(r) => {
                setSelectedROI(r);
                setIsReleaseRecordDialogOpen(true);
              }}
            />
          )}

          {activeTab === 'legal' && (
            <LegalRequestView legalRequests={legalRequests} legalHolds={legalHolds} />
          )}

          {activeTab === 'birth-registry' && (
            <BirthRegistryView
              birthRecords={birthRecords}
              onOpenRegisterBirth={() => setIsBirthDialogOpen(true)}
            />
          )}

          {activeTab === 'death-registry' && (
            <DeathRegistryView
              deathRecords={deathRecords}
              onOpenRegisterDeath={() => setIsDeathDialogOpen(true)}
            />
          )}

          {activeTab === 'analytics' && <MRDAnalyticsView analytics={analytics} />}

          {activeTab === 'audit-vault' && <MRDAuditVaultView traces={auditTraces} />}

          {activeTab === 'control-center' && <MRDControlCenterView department={department} />}
        </>
      )}

      {/* DIALOGS */}
      <CreateRecordCompletionDialog
        isOpen={isCompletionDialogOpen}
        onClose={() => setIsCompletionDialogOpen(false)}
        record={selectedRecord}
        onSubmit={async (req) => {
          await mrdManagementService.createCompletionTask(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <AssignDiagnosisCodeDialog
        isOpen={isAssignDiagnosisDialogOpen}
        onClose={() => setIsAssignDiagnosisDialogOpen(false)}
        record={selectedRecord}
        catalog={catalog}
        onSubmit={async (req) => {
          await mrdManagementService.assignDiagnosisCode(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <EditDiagnosisCodeDialog
        isOpen={isEditDiagnosisDialogOpen}
        onClose={() => setIsEditDiagnosisDialogOpen(false)}
        diagnosis={selectedDiagnosis}
        onSubmit={async (req) => {
          await mrdManagementService.updateDiagnosisCode(req);
          await loadData();
        }}
        tenantId={tenantId}
      />

      <SubmitCodingReviewDialog
        isOpen={isCodingReviewDialogOpen}
        onClose={() => setIsCodingReviewDialogOpen(false)}
        record={selectedRecord}
        onSubmit={async (req) => {
          await mrdManagementService.submitCodingReview(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateClinicalQueryDialog
        isOpen={isClinicalQueryDialogOpen}
        onClose={() => setIsClinicalQueryDialogOpen(false)}
        record={selectedRecord}
        onSubmit={async (req) => {
          await mrdManagementService.createClinicalQuery(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <ResolveClinicalQueryDialog
        isOpen={isResolveQueryDialogOpen}
        onClose={() => setIsResolveQueryDialogOpen(false)}
        query={selectedQuery}
        onSubmit={async (req) => {
          await mrdManagementService.resolveClinicalQuery(req);
          await loadData();
        }}
        tenantId={tenantId}
      />

      <RetrieveMedicalRecordDialog
        isOpen={isRetrieveDialogOpen}
        onClose={() => setIsRetrieveDialogOpen(false)}
        record={selectedRecord}
        onSubmit={async (req) => {
          await mrdManagementService.createRecordRetrieval(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateROIRequestDialog
        isOpen={isCreateROIDialogOpen}
        onClose={() => setIsCreateROIDialogOpen(false)}
        record={selectedRecord}
        onSubmit={async (req) => {
          await mrdManagementService.createROIRequest(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <ApproveROIRequestDialog
        isOpen={isApproveROIDialogOpen}
        onClose={() => setIsApproveROIDialogOpen(false)}
        request={selectedROI}
        onSubmit={async (req) => {
          await mrdManagementService.approveROIRequest(req);
          await loadData();
        }}
        tenantId={tenantId}
      />

      <ReleaseMedicalRecordDialog
        isOpen={isReleaseRecordDialogOpen}
        onClose={() => setIsReleaseRecordDialogOpen(false)}
        request={selectedROI}
        onSubmit={async (req) => {
          await mrdManagementService.releaseMedicalRecord(req);
          await loadData();
        }}
        tenantId={tenantId}
      />

      <CreateLegalRequestDialog
        isOpen={isLegalRequestDialogOpen}
        onClose={() => setIsLegalRequestDialogOpen(false)}
        record={selectedRecord}
        onSubmit={async (req) => {
          await mrdManagementService.createLegalRequest(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateLegalHoldDialog
        isOpen={isLegalHoldDialogOpen}
        onClose={() => setIsLegalHoldDialogOpen(false)}
        record={selectedRecord}
        onSubmit={async (req) => {
          await mrdManagementService.createLegalHold(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <RegisterBirthRecordDialog
        isOpen={isBirthDialogOpen}
        onClose={() => setIsBirthDialogOpen(false)}
        onSubmit={async (req) => {
          await mrdManagementService.registerBirthRecord(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <RegisterDeathRecordDialog
        isOpen={isDeathDialogOpen}
        onClose={() => setIsDeathDialogOpen(false)}
        onSubmit={async (req) => {
          await mrdManagementService.registerDeathRecord(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />
    </div>
  );
};
