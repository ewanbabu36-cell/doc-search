import React, { useState, useEffect, useCallback } from 'react';
import type {
  QualityStandardDto,
  HospitalIncidentDto,
  IncidentRcaDto,
  QualityCapaDto,
  HaiSurveillanceDto,
  HaiDeviceDaysDto,
  PatientIsolationDto,
  HandHygieneAuditDto,
  EnvironmentalMicroSwabDto,
  NeedleStickOccupationalLogDto,
  BiomedicalWasteLogDto,
  QualityOverviewMetricsDto,
  QualityAuditTraceDto,
  ReportHospitalIncidentRequest,
  TriageIncidentRequest,
  CreateIncidentRcaRequest,
  CreateQualityCapaRequest,
  VerifyQualityCapaRequest,
  LogHaiCaseRequest,
  AssignPatientIsolationRequest,
  RecordHandHygieneAuditRequest,
  RecordEnvironmentalSwabRequest,
  RecordNeedleStickLogRequest,
  RecordBmwLogRequest
} from '@docsearch/api-contracts';

import { qualityInfectionService } from '../services/quality-infection-service.js';

// Views
import { QualityOverviewView } from './views/QualityOverviewView.js';
import { QualityCommandCenterView } from './views/QualityCommandCenterView.js';
import { IncidentManagementView } from './views/IncidentManagementView.js';
import { IncidentDetailView } from './views/IncidentDetailView.js';
import { RcaFishboneView } from './views/RcaFishboneView.js';
import { CapaEngineView } from './views/CapaEngineView.js';
import { HaiSurveillanceView } from './views/HaiSurveillanceView.js';
import { PatientIsolationView } from './views/PatientIsolationView.js';
import { HandHygieneComplianceView } from './views/HandHygieneComplianceView.js';
import { EnvironmentalMicrobiologyView } from './views/EnvironmentalMicrobiologyView.js';
import { NeedleStickPepView } from './views/NeedleStickPepView.js';
import { NabhCoreIndicatorsView } from './views/NabhCoreIndicatorsView.js';
import { InternalAuditsView } from './views/InternalAuditsView.js';
import { ClinicalPathwaysView } from './views/ClinicalPathwaysView.js';
import { QualityCommitteeView } from './views/QualityCommitteeView.js';
import { BiomedicalWasteView } from './views/BiomedicalWasteView.js';
import { NabhChapterComplianceView } from './views/NabhChapterComplianceView.js';
import { QualityAuditVaultView } from './views/QualityAuditVaultView.js';

// Dialogs
import { ReportIncidentDialog } from './dialogs/ReportIncidentDialog.js';
import { TriageIncidentDialog } from './dialogs/TriageIncidentDialog.js';
import { CreateRcaInvestigationDialog } from './dialogs/CreateRcaInvestigationDialog.js';
import { CreateCapaActionDialog } from './dialogs/CreateCapaActionDialog.js';
import { VerifyCapaActionDialog } from './dialogs/VerifyCapaActionDialog.js';
import { LogHaiCaseDialog } from './dialogs/LogHaiCaseDialog.js';
import { AssignPatientIsolationDialog } from './dialogs/AssignPatientIsolationDialog.js';
import { RecordHandHygieneAuditDialog } from './dialogs/RecordHandHygieneAuditDialog.js';
import { RecordEnvironmentalSwabDialog } from './dialogs/RecordEnvironmentalSwabDialog.js';
import { RecordNeedleStickLogDialog } from './dialogs/RecordNeedleStickLogDialog.js';
import { RecordBmwLogDialog } from './dialogs/RecordBmwLogDialog.js';

type QualityTab =
  | 'OVERVIEW'
  | 'NABH_STANDARDS'
  | 'INCIDENTS'
  | 'INCIDENT_DETAIL'
  | 'RCA_FISHBONE'
  | 'CAPA_ENGINE'
  | 'HAI_SURVEILLANCE'
  | 'PATIENT_ISOLATION'
  | 'HAND_HYGIENE'
  | 'ENVIRONMENTAL_MICRO'
  | 'NEEDLE_STICK_PEP'
  | 'CORE_INDICATORS'
  | 'INTERNAL_AUDITS'
  | 'CLINICAL_PATHWAYS'
  | 'COMMITTEE'
  | 'BIOMEDICAL_WASTE'
  | 'CHAPTER_RADAR'
  | 'AUDIT_VAULT';

interface Props {
  tenantId: string;
}

export const QualityInfectionDomainManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<QualityTab>('OVERVIEW');
  const [selectedIncident, setSelectedIncident] = useState<HospitalIncidentDto | null>(null);
  const [triagingIncident, setTriagingIncident] = useState<HospitalIncidentDto | null>(null);
  const [rcaTargetIncident, setRcaTargetIncident] = useState<HospitalIncidentDto | null>(null);
  const [verifyingCapa, setVerifyingCapa] = useState<QualityCapaDto | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<QualityOverviewMetricsDto | null>(null);
  const [standards, setStandards] = useState<QualityStandardDto[]>([]);
  const [incidents, setIncidents] = useState<HospitalIncidentDto[]>([]);
  const [rcas, setRcas] = useState<IncidentRcaDto[]>([]);
  const [capas, setCapas] = useState<QualityCapaDto[]>([]);
  const [hais, setHais] = useState<HaiSurveillanceDto[]>([]);
  const [deviceDays, setDeviceDays] = useState<HaiDeviceDaysDto | null>(null);
  const [isolations, setIsolations] = useState<PatientIsolationDto[]>([]);
  const [handHygieneAudits, setHandHygieneAudits] = useState<HandHygieneAuditDto[]>([]);
  const [swabs, setSwabs] = useState<EnvironmentalMicroSwabDto[]>([]);
  const [needleStickLogs, setNeedleStickLogs] = useState<NeedleStickOccupationalLogDto[]>([]);
  const [bmwLogs, setBmwLogs] = useState<BiomedicalWasteLogDto[]>([]);
  const [traces, setTraces] = useState<QualityAuditTraceDto[]>([]);

  // Dialog toggles
  const [showReportIncident, setShowReportIncident] = useState(false);
  const [showCreateCapa, setShowCreateCapa] = useState(false);
  const [showLogHai, setShowLogHai] = useState(false);
  const [showAssignIsolation, setShowAssignIsolation] = useState(false);
  const [showRecordHha, setShowRecordHha] = useState(false);
  const [showRecordSwab, setShowRecordSwab] = useState(false);
  const [showRecordNeedleStick, setShowRecordNeedleStick] = useState(false);
  const [showRecordBmw, setShowRecordBmw] = useState(false);

  const loadData = useCallback(async () => {
    const [
      m,
      std,
      inc,
      rcaList,
      capaList,
      haiList,
      dd,
      isoList,
      hhaList,
      swabList,
      nsList,
      bmwList,
      tr
    ] = await Promise.all([
      qualityInfectionService.getOverviewMetrics(tenantId),
      qualityInfectionService.getStandards(tenantId),
      qualityInfectionService.getIncidents(tenantId),
      qualityInfectionService.getRcas(tenantId),
      qualityInfectionService.getCapas(tenantId),
      qualityInfectionService.getHaiSurveillances(tenantId),
      qualityInfectionService.getHaiDeviceDays(tenantId),
      qualityInfectionService.getPatientIsolations(tenantId),
      qualityInfectionService.getHandHygieneAudits(tenantId),
      qualityInfectionService.getEnvironmentalSwabs(tenantId),
      qualityInfectionService.getNeedleStickLogs(tenantId),
      qualityInfectionService.getBmwLogs(tenantId),
      qualityInfectionService.getAuditTraces(tenantId)
    ]);

    setMetrics(m);
    setStandards(std);
    setIncidents(inc);
    setRcas(rcaList);
    setCapas(capaList);
    setHais(haiList);
    setDeviceDays(dd);
    setIsolations(isoList);
    setHandHygieneAudits(hhaList);
    setSwabs(swabList);
    setNeedleStickLogs(nsList);
    setBmwLogs(bmwList);
    setTraces(tr);

    if (selectedIncident) {
      const updated = inc.find((i) => i.id === selectedIncident.id);
      if (updated) setSelectedIncident(updated);
    }
  }, [tenantId, selectedIncident]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!metrics || !deviceDays) {
    return <div className="p-8 text-center text-xs text-gray-500">Loading Quality & Infection Control Platform...</div>;
  }

  // Handlers
  const handleReportIncident = async (data: ReportHospitalIncidentRequest) => {
    await qualityInfectionService.reportIncident(tenantId, data);
    await loadData();
  };

  const handleTriageIncident = async (incidentId: string, data: TriageIncidentRequest) => {
    await qualityInfectionService.triageIncident(tenantId, incidentId, data);
    await loadData();
  };

  const handleCloseIncident = async (incidentId: string) => {
    await qualityInfectionService.closeIncident(tenantId, incidentId);
    await loadData();
  };

  const handleCreateRca = async (data: CreateIncidentRcaRequest) => {
    await qualityInfectionService.createRca(tenantId, data);
    await loadData();
  };

  const handleCreateCapa = async (data: CreateQualityCapaRequest) => {
    await qualityInfectionService.createCapa(tenantId, data);
    await loadData();
  };

  const handleVerifyCapa = async (capaId: string, data: VerifyQualityCapaRequest) => {
    await qualityInfectionService.verifyCapa(tenantId, capaId, data);
    await loadData();
  };

  const handleLogHai = async (data: LogHaiCaseRequest) => {
    await qualityInfectionService.logHaiCase(tenantId, data);
    await loadData();
  };

  const handleAssignIsolation = async (data: AssignPatientIsolationRequest) => {
    await qualityInfectionService.assignIsolation(tenantId, data);
    await loadData();
  };

  const handleDischargeIsolation = async (iso: PatientIsolationDto) => {
    await qualityInfectionService.dischargeIsolation(tenantId, iso.id);
    await loadData();
  };

  const handleRecordHha = async (data: RecordHandHygieneAuditRequest) => {
    await qualityInfectionService.recordHandHygieneAudit(tenantId, data);
    await loadData();
  };

  const handleRecordSwab = async (data: RecordEnvironmentalSwabRequest) => {
    await qualityInfectionService.recordEnvironmentalSwab(tenantId, data);
    await loadData();
  };

  const handleRecordNeedleStick = async (data: RecordNeedleStickLogRequest) => {
    await qualityInfectionService.recordNeedleStickLog(tenantId, data);
    await loadData();
  };

  const handleRecordBmw = async (data: RecordBmwLogRequest) => {
    await qualityInfectionService.recordBmwLog(tenantId, data);
    await loadData();
  };

  return (
    <div className="space-y-4">
      {/* Domain Navigation Tabs */}
      <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📊 Quality Overview
        </button>
        <button
          onClick={() => setActiveTab('NABH_STANDARDS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'NABH_STANDARDS' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📘 Standards Master
        </button>
        <button
          onClick={() => setActiveTab('INCIDENTS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'INCIDENTS' || activeTab === 'INCIDENT_DETAIL' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🚨 Incident Register ({incidents.filter((i) => i.status !== 'CLOSED').length})
        </button>
        <button
          onClick={() => setActiveTab('RCA_FISHBONE')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'RCA_FISHBONE' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🔍 RCA & 5-Whys ({rcas.length})
        </button>
        <button
          onClick={() => setActiveTab('CAPA_ENGINE')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'CAPA_ENGINE' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🎯 CAPA Engine ({capas.filter((c) => c.status !== 'VERIFIED_EFFECTIVE').length})
        </button>
        <button
          onClick={() => setActiveTab('HAI_SURVEILLANCE')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'HAI_SURVEILLANCE' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🦠 HAI Surveillance ({hais.length})
        </button>
        <button
          onClick={() => setActiveTab('PATIENT_ISOLATION')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'PATIENT_ISOLATION' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🛡️ Isolation ({isolations.filter((iso) => iso.isActive).length})
        </button>
        <button
          onClick={() => setActiveTab('HAND_HYGIENE')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'HAND_HYGIENE' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🧼 Hand Hygiene ({metrics.handHygieneCompliancePct}%)
        </button>
        <button
          onClick={() => setActiveTab('ENVIRONMENTAL_MICRO')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'ENVIRONMENTAL_MICRO' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🧫 Micro Swabs ({swabs.length})
        </button>
        <button
          onClick={() => setActiveTab('NEEDLE_STICK_PEP')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'NEEDLE_STICK_PEP' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          💉 Needle Stick PEP
        </button>
        <button
          onClick={() => setActiveTab('CORE_INDICATORS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'CORE_INDICATORS' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📈 KPIs & Indicators
        </button>
        <button
          onClick={() => setActiveTab('INTERNAL_AUDITS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'INTERNAL_AUDITS' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📋 Mock Audits
        </button>
        <button
          onClick={() => setActiveTab('CLINICAL_PATHWAYS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'CLINICAL_PATHWAYS' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          ⏱️ Clinical Pathways
        </button>
        <button
          onClick={() => setActiveTab('COMMITTEE')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'COMMITTEE' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          👥 Quality Committee
        </button>
        <button
          onClick={() => setActiveTab('BIOMEDICAL_WASTE')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'BIOMEDICAL_WASTE' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          ☣️ BMW Manifests
        </button>
        <button
          onClick={() => setActiveTab('CHAPTER_RADAR')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'CHAPTER_RADAR' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🏆 NABH 10 Chapters
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_VAULT')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'AUDIT_VAULT' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🔐 Cryptographic Vault
        </button>
      </div>

      {/* Tab Renderers */}
      {activeTab === 'OVERVIEW' && (
        <QualityOverviewView
          metrics={metrics}
          incidents={incidents}
          capas={capas}
          hais={hais}
          onReportIncident={() => setShowReportIncident(true)}
          onLogHai={() => setShowLogHai(true)}
          onSelectIncident={(inc) => {
            setSelectedIncident(inc);
            setActiveTab('INCIDENT_DETAIL');
          }}
        />
      )}

      {activeTab === 'NABH_STANDARDS' && (
        <QualityCommandCenterView
          standards={standards}
          onAuditStandard={(std) => {
            alert(`Auditing criteria for chapter ${std.chapter} (${std.standardCode})`);
          }}
        />
      )}

      {activeTab === 'INCIDENTS' && (
        <IncidentManagementView
          incidents={incidents}
          onReport={() => setShowReportIncident(true)}
          onTriage={(inc) => setTriagingIncident(inc)}
          onRca={(inc) => setRcaTargetIncident(inc)}
          onSelect={(inc) => {
            setSelectedIncident(inc);
            setActiveTab('INCIDENT_DETAIL');
          }}
        />
      )}

      {activeTab === 'INCIDENT_DETAIL' && selectedIncident && (
        <IncidentDetailView
          incident={selectedIncident}
          rcas={rcas}
          capas={capas}
          onBack={() => setActiveTab('INCIDENTS')}
          onTriage={() => setTriagingIncident(selectedIncident)}
          onConductRca={() => setRcaTargetIncident(selectedIncident)}
          onCreateCapa={() => setShowCreateCapa(true)}
          onCloseIncident={() => handleCloseIncident(selectedIncident.id)}
        />
      )}

      {activeTab === 'RCA_FISHBONE' && <RcaFishboneView rcas={rcas} />}

      {activeTab === 'CAPA_ENGINE' && (
        <CapaEngineView
          capas={capas}
          onCreateCapa={() => setShowCreateCapa(true)}
          onVerifyCapa={(capa) => setVerifyingCapa(capa)}
        />
      )}

      {activeTab === 'HAI_SURVEILLANCE' && (
        <HaiSurveillanceView
          surveillances={hais}
          deviceDays={deviceDays}
          onLogHai={() => setShowLogHai(true)}
        />
      )}

      {activeTab === 'PATIENT_ISOLATION' && (
        <PatientIsolationView
          isolations={isolations}
          onAssignIsolation={() => setShowAssignIsolation(true)}
          onDischargeIsolation={handleDischargeIsolation}
        />
      )}

      {activeTab === 'HAND_HYGIENE' && (
        <HandHygieneComplianceView
          audits={handHygieneAudits}
          onRecordAudit={() => setShowRecordHha(true)}
        />
      )}

      {activeTab === 'ENVIRONMENTAL_MICRO' && (
        <EnvironmentalMicrobiologyView
          swabs={swabs}
          onRecordSwab={() => setShowRecordSwab(true)}
        />
      )}

      {activeTab === 'NEEDLE_STICK_PEP' && (
        <NeedleStickPepView
          logs={needleStickLogs}
          onRecordLog={() => setShowRecordNeedleStick(true)}
        />
      )}

      {activeTab === 'CORE_INDICATORS' && <NabhCoreIndicatorsView />}
      {activeTab === 'INTERNAL_AUDITS' && <InternalAuditsView />}
      {activeTab === 'CLINICAL_PATHWAYS' && <ClinicalPathwaysView />}
      {activeTab === 'COMMITTEE' && <QualityCommitteeView />}

      {activeTab === 'BIOMEDICAL_WASTE' && (
        <BiomedicalWasteView
          logs={bmwLogs}
          onRecordBmw={() => setShowRecordBmw(true)}
        />
      )}

      {activeTab === 'CHAPTER_RADAR' && <NabhChapterComplianceView />}
      {activeTab === 'AUDIT_VAULT' && <QualityAuditVaultView traces={traces} />}

      {/* Dialog Modals */}
      <ReportIncidentDialog
        isOpen={showReportIncident}
        onClose={() => setShowReportIncident(false)}
        onSubmit={handleReportIncident}
      />

      {triagingIncident && (
        <TriageIncidentDialog
          isOpen={!!triagingIncident}
          incident={triagingIncident}
          onClose={() => setTriagingIncident(null)}
          onSubmit={handleTriageIncident}
        />
      )}

      {rcaTargetIncident && (
        <CreateRcaInvestigationDialog
          isOpen={!!rcaTargetIncident}
          incident={rcaTargetIncident}
          onClose={() => setRcaTargetIncident(null)}
          onSubmit={handleCreateRca}
        />
      )}

      <CreateCapaActionDialog
        isOpen={showCreateCapa}
        incidentId={selectedIncident ? selectedIncident.id : undefined}
        onClose={() => setShowCreateCapa(false)}
        onSubmit={handleCreateCapa}
      />

      {verifyingCapa && (
        <VerifyCapaActionDialog
          isOpen={!!verifyingCapa}
          capa={verifyingCapa}
          onClose={() => setVerifyingCapa(null)}
          onSubmit={handleVerifyCapa}
        />
      )}

      <LogHaiCaseDialog
        isOpen={showLogHai}
        onClose={() => setShowLogHai(false)}
        onSubmit={handleLogHai}
      />

      <AssignPatientIsolationDialog
        isOpen={showAssignIsolation}
        onClose={() => setShowAssignIsolation(false)}
        onSubmit={handleAssignIsolation}
      />

      <RecordHandHygieneAuditDialog
        isOpen={showRecordHha}
        onClose={() => setShowRecordHha(false)}
        onSubmit={handleRecordHha}
      />

      <RecordEnvironmentalSwabDialog
        isOpen={showRecordSwab}
        onClose={() => setShowRecordSwab(false)}
        onSubmit={handleRecordSwab}
      />

      <RecordNeedleStickLogDialog
        isOpen={showRecordNeedleStick}
        onClose={() => setShowRecordNeedleStick(false)}
        onSubmit={handleRecordNeedleStick}
      />

      <RecordBmwLogDialog
        isOpen={showRecordBmw}
        onClose={() => setShowRecordBmw(false)}
        onSubmit={handleRecordBmw}
      />
    </div>
  );
};
