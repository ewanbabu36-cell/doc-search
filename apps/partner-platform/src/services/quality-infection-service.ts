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

import {
  mockQualityStandards,
  mockHospitalIncidents,
  mockIncidentRcas,
  mockQualityCapas,
  mockHaiSurveillances,
  mockHaiDeviceDays,
  mockPatientIsolations,
  mockHandHygieneAudits,
  mockEnvironmentalSwabs,
  mockNeedleStickLogs,
  mockBmwLogs,
  mockQualityOverviewMetrics,
  mockQualityAuditTraces
} from './mock-quality-infection-data.js';

export interface IQualityInfectionService {
  getOverviewMetrics(tenantId: string): Promise<QualityOverviewMetricsDto>;
  
  getStandards(tenantId: string): Promise<QualityStandardDto[]>;

  getIncidents(tenantId: string): Promise<HospitalIncidentDto[]>;
  reportIncident(tenantId: string, payload: ReportHospitalIncidentRequest): Promise<HospitalIncidentDto>;
  triageIncident(tenantId: string, incidentId: string, payload: TriageIncidentRequest): Promise<HospitalIncidentDto>;
  closeIncident(tenantId: string, incidentId: string): Promise<HospitalIncidentDto>;

  getRcas(tenantId: string): Promise<IncidentRcaDto[]>;
  createRca(tenantId: string, payload: CreateIncidentRcaRequest): Promise<IncidentRcaDto>;

  getCapas(tenantId: string): Promise<QualityCapaDto[]>;
  createCapa(tenantId: string, payload: CreateQualityCapaRequest): Promise<QualityCapaDto>;
  verifyCapa(tenantId: string, capaId: string, payload: VerifyQualityCapaRequest): Promise<QualityCapaDto>;

  getHaiSurveillances(tenantId: string): Promise<HaiSurveillanceDto[]>;
  logHaiCase(tenantId: string, payload: LogHaiCaseRequest): Promise<HaiSurveillanceDto>;

  getHaiDeviceDays(tenantId: string): Promise<HaiDeviceDaysDto>;

  getPatientIsolations(tenantId: string): Promise<PatientIsolationDto[]>;
  assignIsolation(tenantId: string, payload: AssignPatientIsolationRequest): Promise<PatientIsolationDto>;
  dischargeIsolation(tenantId: string, isolationId: string): Promise<PatientIsolationDto>;

  getHandHygieneAudits(tenantId: string): Promise<HandHygieneAuditDto[]>;
  recordHandHygieneAudit(tenantId: string, payload: RecordHandHygieneAuditRequest): Promise<HandHygieneAuditDto>;

  getEnvironmentalSwabs(tenantId: string): Promise<EnvironmentalMicroSwabDto[]>;
  recordEnvironmentalSwab(tenantId: string, payload: RecordEnvironmentalSwabRequest): Promise<EnvironmentalMicroSwabDto>;

  getNeedleStickLogs(tenantId: string): Promise<NeedleStickOccupationalLogDto[]>;
  recordNeedleStickLog(tenantId: string, payload: RecordNeedleStickLogRequest): Promise<NeedleStickOccupationalLogDto>;

  getBmwLogs(tenantId: string): Promise<BiomedicalWasteLogDto[]>;
  recordBmwLog(tenantId: string, payload: RecordBmwLogRequest): Promise<BiomedicalWasteLogDto>;

  getAuditTraces(tenantId: string): Promise<QualityAuditTraceDto[]>;
}

export class QualityInfectionService implements IQualityInfectionService {
  private standards: QualityStandardDto[] = [...mockQualityStandards];
  private incidents: HospitalIncidentDto[] = [...mockHospitalIncidents];
  private rcas: IncidentRcaDto[] = [...mockIncidentRcas];
  private capas: QualityCapaDto[] = [...mockQualityCapas];
  private haiSurveillances: HaiSurveillanceDto[] = [...mockHaiSurveillances];
  private isolations: PatientIsolationDto[] = [...mockPatientIsolations];
  private handHygieneAudits: HandHygieneAuditDto[] = [...mockHandHygieneAudits];
  private swabs: EnvironmentalMicroSwabDto[] = [...mockEnvironmentalSwabs];
  private needleStickLogs: NeedleStickOccupationalLogDto[] = [...mockNeedleStickLogs];
  private bmwLogs: BiomedicalWasteLogDto[] = [...mockBmwLogs];
  private auditTraces: QualityAuditTraceDto[] = [...mockQualityAuditTraces];

  private appendAudit(
    action: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    justification: string,
    actorName = 'Dr. Radhika Sharma',
    actorRole = 'QUALITY_OFFICER'
  ) {
    const traceNumber = `TRACE-QUAL-${Math.floor(10000 + Math.random() * 90000)}`;
    const trace: QualityAuditTraceDto = {
      id: crypto.randomUUID(),
      tenantId: '11111111-1111-4111-8111-111111111111',
      traceNumber,
      action,
      entityType,
      entityId,
      entityCode,
      actorName,
      actorRole,
      justification,
      integrityHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(_tenantId: string): Promise<QualityOverviewMetricsDto> {
    const openInc = this.incidents.filter((i) => i.status !== 'CLOSED').length;
    const sentinel = this.incidents.filter((i) => i.isSentinelEvent).length;
    const openCapa = this.capas.filter((c) => c.status !== 'VERIFIED_EFFECTIVE').length;
    const activeIso = this.isolations.filter((iso) => iso.isActive).length;

    return {
      ...mockQualityOverviewMetrics,
      openIncidentsCount: openInc,
      sentinelEventsCount: sentinel,
      openCapaActionsCount: openCapa,
      activeIsolatedPatientsCount: activeIso
    };
  }

  async getStandards(_tenantId: string): Promise<QualityStandardDto[]> {
    return [...this.standards];
  }

  async getIncidents(_tenantId: string): Promise<HospitalIncidentDto[]> {
    return [...this.incidents];
  }

  async reportIncident(tenantId: string, payload: ReportHospitalIncidentRequest): Promise<HospitalIncidentDto> {
    const inc: HospitalIncidentDto = {
      id: crypto.randomUUID(),
      tenantId,
      incidentNumber: `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: payload.category,
      sacScore: payload.sacScore,
      status: 'REPORTED',
      patientInvolved: payload.patientInvolved,
      patientMrn: payload.patientMrn,
      patientName: payload.patientName,
      departmentName: payload.departmentName,
      locationDetail: payload.locationDetail,
      incidentDateTime: payload.incidentDateTime,
      reportedByStaff: payload.reportedByStaff,
      reportedByRole: payload.reportedByRole,
      briefSummary: payload.briefSummary,
      detailedDescription: payload.detailedDescription,
      immediateActionTaken: payload.immediateActionTaken,
      patientHarmLevel: payload.patientHarmLevel,
      isSentinelEvent: payload.isSentinelEvent,
      investigatingQualityOfficer: undefined,
      rcaRequired: payload.sacScore === 'SAC_1_EXTREME_SENTINEL' || payload.sacScore === 'SAC_2_MAJOR' || payload.isSentinelEvent,
      createdAt: new Date().toISOString()
    };
    this.incidents.unshift(inc);
    this.appendAudit('REPORT_INCIDENT', 'HOSPITAL_INCIDENT', inc.id, inc.incidentNumber, `Incident logged: ${payload.briefSummary}`, payload.reportedByStaff, payload.reportedByRole);
    return inc;
  }

  async triageIncident(_tenantId: string, incidentId: string, payload: TriageIncidentRequest): Promise<HospitalIncidentDto> {
    const idx = this.incidents.findIndex((i) => i.id === incidentId);
    if (idx === -1) throw new Error('Incident not found');
    const existing = this.incidents[idx];
    if (!existing) throw new Error('Incident not found');

    const updated: HospitalIncidentDto = {
      ...existing,
      sacScore: payload.sacScore,
      investigatingQualityOfficer: payload.investigatingQualityOfficer,
      rcaRequired: payload.rcaRequired,
      status: payload.rcaRequired ? 'RCA_IN_PROGRESS' : 'CAPA_FORMULATED'
    };
    this.incidents[idx] = updated;
    this.appendAudit('TRIAGE_INCIDENT', 'HOSPITAL_INCIDENT', updated.id, updated.incidentNumber, `Triaged as ${payload.sacScore}; RCA required: ${payload.rcaRequired}`);
    return updated;
  }

  async closeIncident(_tenantId: string, incidentId: string): Promise<HospitalIncidentDto> {
    const idx = this.incidents.findIndex((i) => i.id === incidentId);
    if (idx === -1) throw new Error('Incident not found');
    const existing = this.incidents[idx];
    if (!existing) throw new Error('Incident not found');

    const updated: HospitalIncidentDto = {
      ...existing,
      status: 'CLOSED',
      closedAt: new Date().toISOString()
    };
    this.incidents[idx] = updated;
    this.appendAudit('CLOSE_INCIDENT', 'HOSPITAL_INCIDENT', updated.id, updated.incidentNumber, 'Incident closed after CAPA verification');
    return updated;
  }

  async getRcas(_tenantId: string): Promise<IncidentRcaDto[]> {
    return [...this.rcas];
  }

  async createRca(tenantId: string, payload: CreateIncidentRcaRequest): Promise<IncidentRcaDto> {
    const inc = this.incidents.find((i) => i.id === payload.incidentId);
    if (!inc) throw new Error('Incident not found');

    const rca: IncidentRcaDto = {
      id: crypto.randomUUID(),
      tenantId,
      rcaCode: `RCA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      incidentId: inc.id,
      incidentNumber: inc.incidentNumber,
      leadInvestigator: payload.leadInvestigator,
      investigationTeam: payload.investigationTeam,
      fiveWhysAnalysis: payload.fiveWhysAnalysis,
      fishboneCategories: payload.fishboneCategories,
      rootCauseStatement: payload.rootCauseStatement,
      contributingFactors: payload.contributingFactors,
      status: 'APPROVED_BY_COMMITTEE',
      completedDate: new Date().toISOString().split('T')[0] || '2026-08-30',
      createdAt: new Date().toISOString()
    };
    this.rcas.unshift(rca);

    // Advance incident status
    inc.status = 'CAPA_FORMULATED';

    this.appendAudit('APPROVE_RCA', 'INCIDENT_RCA', rca.id, rca.rcaCode, `RCA completed for ${inc.incidentNumber}`);
    return rca;
  }

  async getCapas(_tenantId: string): Promise<QualityCapaDto[]> {
    return [...this.capas];
  }

  async createCapa(tenantId: string, payload: CreateQualityCapaRequest): Promise<QualityCapaDto> {
    let incNumber: string | undefined;
    if (payload.incidentId) {
      const inc = this.incidents.find((i) => i.id === payload.incidentId);
      if (inc) incNumber = inc.incidentNumber;
    }

    const capa: QualityCapaDto = {
      id: crypto.randomUUID(),
      tenantId,
      capaCode: `CAPA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      incidentId: payload.incidentId,
      incidentNumber: incNumber,
      title: payload.title,
      actionDescription: payload.actionDescription,
      actionType: payload.actionType,
      assignedOwner: payload.assignedOwner,
      targetCompletionDate: payload.targetCompletionDate,
      verificationMetric: payload.verificationMetric,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    this.capas.unshift(capa);
    this.appendAudit('CREATE_CAPA', 'QUALITY_CAPA', capa.id, capa.capaCode, `CAPA plan formulated: ${payload.title}`);
    return capa;
  }

  async verifyCapa(_tenantId: string, capaId: string, payload: VerifyQualityCapaRequest): Promise<QualityCapaDto> {
    const idx = this.capas.findIndex((c) => c.id === capaId);
    if (idx === -1) throw new Error('CAPA not found');
    const existing = this.capas[idx];
    if (!existing) throw new Error('CAPA not found');

    const updated: QualityCapaDto = {
      ...existing,
      status: payload.isEffective ? 'VERIFIED_EFFECTIVE' : 'IN_PROGRESS',
      completedDate: new Date().toISOString().split('T')[0] || '2026-08-30',
      verifiedBy: payload.verifiedBy,
      verifiedDate: new Date().toISOString().split('T')[0] || '2026-08-30'
    };
    this.capas[idx] = updated;
    this.appendAudit('VERIFY_CAPA', 'QUALITY_CAPA', updated.id, updated.capaCode, `CAPA verified by ${payload.verifiedBy}; effective: ${payload.isEffective}`);
    return updated;
  }

  async getHaiSurveillances(_tenantId: string): Promise<HaiSurveillanceDto[]> {
    return [...this.haiSurveillances];
  }

  async logHaiCase(tenantId: string, payload: LogHaiCaseRequest): Promise<HaiSurveillanceDto> {
    const hai: HaiSurveillanceDto = {
      id: crypto.randomUUID(),
      tenantId,
      surveillanceCode: `HAI-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      patientId: payload.patientId,
      patientMrn: payload.patientMrn,
      patientName: payload.patientName,
      departmentName: payload.departmentName,
      haiType: payload.haiType,
      diagnosisDate: payload.diagnosisDate,
      pathogenIsolated: payload.pathogenIsolated,
      antibioticSensitivity: payload.antibioticSensitivity,
      invasiveDeviceName: payload.invasiveDeviceName,
      deviceInsertionDate: payload.deviceInsertionDate,
      deviceDaysAtInfection: payload.deviceDaysAtInfection,
      hicInterventionTaken: payload.hicInterventionTaken,
      outcomeStatus: 'ONGOING_TREATMENT',
      reportedToInfectionControlCommittee: true,
      createdAt: new Date().toISOString()
    };
    this.haiSurveillances.unshift(hai);
    this.appendAudit('LOG_HAI_CASE', 'HAI_SURVEILLANCE', hai.id, hai.surveillanceCode, `HAI logged: ${payload.haiType} (${payload.pathogenIsolated})`);
    return hai;
  }

  async getHaiDeviceDays(_tenantId: string): Promise<HaiDeviceDaysDto> {
    return { ...mockHaiDeviceDays };
  }

  async getPatientIsolations(_tenantId: string): Promise<PatientIsolationDto[]> {
    return [...this.isolations];
  }

  async assignIsolation(tenantId: string, payload: AssignPatientIsolationRequest): Promise<PatientIsolationDto> {
    const iso: PatientIsolationDto = {
      id: crypto.randomUUID(),
      tenantId,
      isolationCode: `ISO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      patientMrn: payload.patientMrn,
      patientName: payload.patientName,
      departmentName: payload.departmentName,
      roomBedNumber: payload.roomBedNumber,
      precautionType: payload.precautionType,
      indicatedReasonOrPathogen: payload.indicatedReasonOrPathogen,
      startDate: new Date().toISOString().split('T')[0] || '2026-08-30',
      assignedNurseLead: payload.assignedNurseLead,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.isolations.unshift(iso);
    this.appendAudit('ASSIGN_ISOLATION', 'PATIENT_ISOLATION', iso.id, iso.isolationCode, `Patient isolation: ${payload.precautionType} precautions`);
    return iso;
  }

  async dischargeIsolation(_tenantId: string, isolationId: string): Promise<PatientIsolationDto> {
    const idx = this.isolations.findIndex((i) => i.id === isolationId);
    if (idx === -1) throw new Error('Isolation record not found');
    const existing = this.isolations[idx];
    if (!existing) throw new Error('Isolation record not found');

    const updated: PatientIsolationDto = {
      ...existing,
      isActive: false,
      endDate: new Date().toISOString().split('T')[0] || '2026-08-30'
    };
    this.isolations[idx] = updated;
    this.appendAudit('DISCHARGE_ISOLATION', 'PATIENT_ISOLATION', updated.id, updated.isolationCode, 'Isolation discontinued after repeat clearance cultures');
    return updated;
  }

  async getHandHygieneAudits(_tenantId: string): Promise<HandHygieneAuditDto[]> {
    return [...this.handHygieneAudits];
  }

  async recordHandHygieneAudit(tenantId: string, payload: RecordHandHygieneAuditRequest): Promise<HandHygieneAuditDto> {
    const audit: HandHygieneAuditDto = {
      id: crypto.randomUUID(),
      tenantId,
      auditCode: `HHA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      auditDate: new Date().toISOString().split('T')[0] || '2026-08-30',
      departmentName: payload.departmentName,
      staffCategory: payload.staffCategory,
      whoMoment: payload.whoMoment,
      actionTaken: payload.actionTaken,
      isCompliant: payload.actionTaken !== 'MISSED_OPPORTUNITY',
      auditedByOfficer: payload.auditedByOfficer,
      notes: payload.notes
    };
    this.handHygieneAudits.unshift(audit);
    this.appendAudit('RECORD_HAND_HYGIENE_AUDIT', 'HAND_HYGIENE_AUDIT', audit.id, audit.auditCode, `WHO moment audit: ${payload.whoMoment} (${audit.isCompliant ? 'Compliant' : 'Missed'})`);
    return audit;
  }

  async getEnvironmentalSwabs(_tenantId: string): Promise<EnvironmentalMicroSwabDto[]> {
    return [...this.swabs];
  }

  async recordEnvironmentalSwab(tenantId: string, payload: RecordEnvironmentalSwabRequest): Promise<EnvironmentalMicroSwabDto> {
    const swab: EnvironmentalMicroSwabDto = {
      id: crypto.randomUUID(),
      tenantId,
      sampleNumber: `SWAB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      sampleType: payload.sampleType,
      locationDescription: payload.locationDescription,
      collectionDate: payload.collectionDate,
      collectedBy: payload.collectedBy,
      cfuCountPerPlateOrMl: payload.cfuCountPerPlateOrMl,
      pathogensFound: payload.pathogensFound,
      permissibleThreshold: payload.permissibleThreshold,
      resultStatus: payload.resultStatus,
      correctiveFoggingDone: payload.correctiveFoggingDone,
      microbiologistSignOff: payload.microbiologistSignOff,
      createdAt: new Date().toISOString()
    };
    this.swabs.unshift(swab);
    this.appendAudit('RECORD_SWAB', 'ENVIRONMENTAL_SWAB', swab.id, swab.sampleNumber, `Microbiology swab result: ${payload.resultStatus}`);
    return swab;
  }

  async getNeedleStickLogs(_tenantId: string): Promise<NeedleStickOccupationalLogDto[]> {
    return [...this.needleStickLogs];
  }

  async recordNeedleStickLog(tenantId: string, payload: RecordNeedleStickLogRequest): Promise<NeedleStickOccupationalLogDto> {
    const log: NeedleStickOccupationalLogDto = {
      id: crypto.randomUUID(),
      tenantId,
      incidentCode: `PEP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      exposedStaffName: payload.exposedStaffName,
      staffRole: payload.staffRole,
      departmentName: payload.departmentName,
      exposureDateTime: payload.exposureDateTime,
      sourcePatientKnown: payload.sourcePatientKnown,
      sourcePatientHivStatus: payload.sourcePatientHivStatus,
      sourcePatientHbsAgStatus: payload.sourcePatientHbsAgStatus,
      sourcePatientHcvStatus: payload.sourcePatientHcvStatus,
      pepInitiatedWithinGoldenHour: payload.pepInitiatedWithinGoldenHour,
      pepRegimenDetails: payload.pepRegimenDetails,
      followUpSerologyDue: payload.followUpSerologyDue,
      counselorName: payload.counselorName,
      createdAt: new Date().toISOString()
    };
    this.needleStickLogs.unshift(log);
    this.appendAudit('RECORD_NEEDLE_STICK', 'NEEDLE_STICK_LOG', log.id, log.incidentCode, `Occupational exposure logged for ${payload.exposedStaffName}`);
    return log;
  }

  async getBmwLogs(_tenantId: string): Promise<BiomedicalWasteLogDto[]> {
    return [...this.bmwLogs];
  }

  async recordBmwLog(tenantId: string, payload: RecordBmwLogRequest): Promise<BiomedicalWasteLogDto> {
    const totalWeight = payload.yellowBagWeightKg + payload.redBagWeightKg + payload.whiteTranslucentWeightKg + payload.blueBagWeightKg;
    const bmw: BiomedicalWasteLogDto = {
      id: crypto.randomUUID(),
      tenantId,
      logDate: payload.logDate,
      departmentName: payload.departmentName,
      yellowBagWeightKg: payload.yellowBagWeightKg,
      redBagWeightKg: payload.redBagWeightKg,
      whiteTranslucentWeightKg: payload.whiteTranslucentWeightKg,
      blueBagWeightKg: payload.blueBagWeightKg,
      totalDailyWeightKg: Number(totalWeight.toFixed(2)),
      pcbManifestBarcode: payload.pcbManifestBarcode,
      handedOverToVendorName: payload.handedOverToVendorName,
      hospitalSupervisorName: payload.hospitalSupervisorName
    };
    this.bmwLogs.unshift(bmw);
    this.appendAudit('RECORD_BMW_LOG', 'BIOMEDICAL_WASTE', bmw.id, bmw.pcbManifestBarcode, `BMW logged: ${totalWeight}kg total manifested`);
    return bmw;
  }

  async getAuditTraces(_tenantId: string): Promise<QualityAuditTraceDto[]> {
    return [...this.auditTraces];
  }
}

export const qualityInfectionService = new QualityInfectionService();
