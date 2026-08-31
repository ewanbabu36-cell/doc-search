import crypto from 'crypto';
import { QualityInfectionRepository } from '../../repositories/partner/QualityInfectionRepository.js';
import { AppError } from '@docsearch/shared-core';

export class QualityInfectionService {
  constructor(private readonly repo = new QualityInfectionRepository()) {}

  private computeHash(payload: Record<string, unknown>, previousHash?: string): string {
    const serialized = JSON.stringify(payload);
    return crypto.createHash('sha256').update(`${previousHash || 'GENESIS'}::${serialized}`).digest('hex');
  }

  async getOverviewMetrics(tenantId: string) {
    return await this.repo.getOverviewMetrics(tenantId);
  }

  async getStandards(tenantId: string) {
    return await this.repo.getStandards(tenantId);
  }

  // Incidents
  async getIncidents(tenantId: string) {
    return await this.repo.getIncidents(tenantId);
  }

  async reportIncident(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const category = String(payload['category'] || '');
    const briefSummary = String(payload['briefSummary'] || '');
    const departmentName = String(payload['departmentName'] || '');

    if (!category || !briefSummary || !departmentName) {
      throw new AppError({ message: 'Category, summary, and department are required', statusCode: 400 });
    }

    const incidentNumber = 'INC-Q-' + Date.now().toString().slice(-6);
    const sacScore = String(payload['sacScore'] || 'SAC_3_MODERATE');
    const isSentinelEvent = sacScore === 'SAC_1_EXTREME_SENTINEL';
    const rcaRequired = isSentinelEvent || sacScore === 'SAC_2_MAJOR';

    const incident = await this.repo.createIncident({
      ...payload,
      tenantId,
      branchId,
      incidentNumber,
      category,
      briefSummary,
      departmentName,
      sacScore,
      isSentinelEvent,
      rcaRequired,
      reportedByStaff: String(payload['reportedByStaff'] || actorId),
      reportedByRole: String(payload['reportedByRole'] || 'STAFF_NURSE'),
      status: 'REPORTED'
    });

    const hash = this.computeHash({ event: 'INCIDENT_REPORTED', incidentNumber, category });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'HOSPITAL_INCIDENT',
      entityId: incident.id as string,
      action: 'REPORT_INCIDENT',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Incident reported by staff',
      details: { incidentNumber, category, sacScore }
    });

    return incident;
  }

  async triageIncident(tenantId: string, incidentId: string, actorId: string, payload: { sacScore: string; investigatingOfficer: string; rcaRequired: boolean }) {
    const updated = await this.repo.updateIncident(incidentId, {
      sacScore: payload.sacScore,
      investigatingQualityOfficer: payload.investigatingOfficer,
      rcaRequired: payload.rcaRequired,
      status: 'UNDER_TRIAGE'
    });

    if (!updated) throw new AppError({ message: 'Incident not found', statusCode: 404 });

    const hash = this.computeHash({ event: 'INCIDENT_TRIAGED', incidentId, sacScore: payload.sacScore });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'HOSPITAL_INCIDENT',
      entityId: incidentId,
      action: 'TRIAGE_INCIDENT',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Incident triaged by quality officer',
      details: payload
    });

    return updated;
  }

  async closeIncident(tenantId: string, incidentId: string, actorId: string) {
    const updated = await this.repo.updateIncident(incidentId, {
      status: 'CLOSED',
      closedAt: new Date()
    });

    if (!updated) throw new AppError({ message: 'Incident not found', statusCode: 404 });

    const hash = this.computeHash({ event: 'INCIDENT_CLOSED', incidentId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'HOSPITAL_INCIDENT',
      entityId: incidentId,
      action: 'CLOSE_INCIDENT',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Incident closed after CAPA verification',
      details: { closedAt: new Date() }
    });

    return updated;
  }

  // RCAs
  async getRcas(tenantId: string) {
    return await this.repo.getRcas(tenantId);
  }

  async createRca(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const incidentId = String(payload['incidentId'] || '');
    const rootCauseStatement = String(payload['rootCauseStatement'] || '');

    if (!incidentId || !rootCauseStatement) {
      throw new AppError({ message: 'Incident ID and Root Cause Statement are required', statusCode: 400 });
    }

    const rcaCode = 'RCA-' + Date.now().toString().slice(-6);
    const rca = await this.repo.createRca({
      ...payload,
      tenantId,
      branchId,
      incidentId,
      incidentNumber: String(payload['incidentNumber'] || 'INC-001'),
      rcaCode,
      rcaLeader: String(payload['rcaLeader'] || actorId),
      rootCauseStatement,
      status: 'COMPLETED'
    });

    // Update incident status to RCA_IN_PROGRESS
    await this.repo.updateIncident(incidentId, { status: 'RCA_IN_PROGRESS' });

    const hash = this.computeHash({ event: 'RCA_COMPLETED', rcaCode, incidentId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'INCIDENT_RCA',
      entityId: rca.id as string,
      action: 'COMPLETE_RCA',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Root cause analysis submitted',
      details: { rcaCode, incidentId }
    });

    return rca;
  }

  // CAPAs
  async getCapas(tenantId: string) {
    return await this.repo.getCapas(tenantId);
  }

  async createCapa(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const incidentId = String(payload['incidentId'] || '');
    const actionDescription = String(payload['actionDescription'] || '');

    if (!incidentId || !actionDescription) {
      throw new AppError({ message: 'Incident ID and Action Description are required', statusCode: 400 });
    }

    const capaCode = 'CAPA-' + Date.now().toString().slice(-6);
    const capa = await this.repo.createCapa({
      ...payload,
      tenantId,
      branchId,
      incidentId,
      incidentNumber: String(payload['incidentNumber'] || 'INC-001'),
      capaCode,
      actionType: String(payload['actionType'] || 'CORRECTIVE'),
      actionDescription,
      responsibleOwner: String(payload['responsibleOwner'] || actorId),
      status: 'ASSIGNED'
    });

    // Update incident status to CAPA_FORMULATED
    await this.repo.updateIncident(incidentId, { status: 'CAPA_FORMULATED' });

    const hash = this.computeHash({ event: 'CAPA_CREATED', capaCode, incidentId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'QUALITY_CAPA',
      entityId: capa.id as string,
      action: 'CREATE_CAPA',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Corrective/Preventive Action formulated',
      details: { capaCode, incidentId }
    });

    return capa;
  }

  async verifyCapa(tenantId: string, capaId: string, actorId: string, payload: { verificationNotes: string; isEffective: boolean }) {
    const updated = await this.repo.updateCapa(capaId, {
      verificationOfficer: actorId,
      verificationNotes: payload.verificationNotes,
      isEffective: payload.isEffective,
      status: payload.isEffective ? 'VERIFIED_EFFECTIVE' : 'INEFFECTIVE_REOPENED'
    });

    if (!updated) throw new AppError({ message: 'CAPA record not found', statusCode: 404 });

    const hash = this.computeHash({ event: 'CAPA_VERIFIED', capaId, isEffective: payload.isEffective });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'QUALITY_CAPA',
      entityId: capaId,
      action: 'VERIFY_CAPA',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'CAPA effectiveness verified',
      details: payload
    });

    return updated;
  }

  // HAI Cases
  async getHaiSurveillances(tenantId: string) {
    return await this.repo.getHaiSurveillances(tenantId);
  }

  async logHaiCase(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const patientMrn = String(payload['patientMrn'] || '');
    const haiType = String(payload['haiType'] || '');

    if (!patientMrn || !haiType) {
      throw new AppError({ message: 'Patient MRN and HAI Type are required', statusCode: 400 });
    }

    const caseCode = 'HAI-' + Date.now().toString().slice(-6);
    const haiCase = await this.repo.createHaiCase({
      ...payload,
      tenantId,
      branchId,
      caseCode,
      patientMrn,
      patientName: String(payload['patientName'] || 'Patient Record'),
      haiType,
      wardName: String(payload['wardName'] || 'ICU'),
      infectionControlNurse: String(payload['infectionControlNurse'] || actorId)
    });

    const hash = this.computeHash({ event: 'HAI_CASE_LOGGED', caseCode, haiType });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'HAI_SURVEILLANCE',
      entityId: haiCase.id as string,
      action: 'LOG_HAI_CASE',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Healthcare-Associated Infection logged',
      details: { caseCode, haiType, patientMrn }
    });

    return haiCase;
  }

  // Patient Isolations
  async getPatientIsolations(tenantId: string) {
    return await this.repo.getPatientIsolations(tenantId);
  }

  async assignIsolation(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const patientMrn = String(payload['patientMrn'] || '');
    const isolationCategory = String(payload['isolationCategory'] || 'CONTACT_ISOLATION');

    if (!patientMrn) {
      throw new AppError({ message: 'Patient MRN is required', statusCode: 400 });
    }

    const isolationCode = 'ISO-' + Date.now().toString().slice(-6);
    const isolation = await this.repo.createPatientIsolation({
      ...payload,
      tenantId,
      branchId,
      isolationCode,
      patientMrn,
      patientName: String(payload['patientName'] || 'Patient Record'),
      wardName: String(payload['wardName'] || 'Isolation Ward'),
      bedNumber: String(payload['bedNumber'] || 'ISO-01'),
      isolationCategory,
      status: 'ACTIVE'
    });

    const hash = this.computeHash({ event: 'ISOLATION_ASSIGNED', isolationCode, patientMrn });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'PATIENT_ISOLATION',
      entityId: isolation.id as string,
      action: 'ASSIGN_ISOLATION',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Infection barrier isolation assigned',
      details: { isolationCode, patientMrn, isolationCategory }
    });

    return isolation;
  }

  async dischargeIsolation(tenantId: string, isolationId: string, actorId: string) {
    const updated = await this.repo.updatePatientIsolation(isolationId, {
      status: 'DISCHARGED',
      dischargedDate: new Date()
    });

    if (!updated) throw new AppError({ message: 'Isolation record not found', statusCode: 404 });

    const hash = this.computeHash({ event: 'ISOLATION_DISCHARGED', isolationId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'PATIENT_ISOLATION',
      entityId: isolationId,
      action: 'DISCHARGE_ISOLATION',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Isolation protocol ceased following negative swabs',
      details: { dischargedDate: new Date() }
    });

    return updated;
  }

  // Hand Hygiene
  async getHandHygieneAudits(tenantId: string) {
    return await this.repo.getHandHygieneAudits(tenantId);
  }

  async recordHandHygieneAudit(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const opportunities = Number(payload['opportunityCount']) || 10;
    const compliances = Number(payload['complianceCount']) || 9;
    const pct = Number(((compliances / opportunities) * 100).toFixed(2));

    const auditCode = 'HHA-' + Date.now().toString().slice(-6);
    const audit = await this.repo.createHandHygieneAudit({
      ...payload,
      tenantId,
      branchId,
      auditCode,
      auditorName: String(payload['auditorName'] || actorId),
      departmentName: String(payload['departmentName'] || 'ICU'),
      opportunityCount: opportunities,
      complianceCount: compliances,
      compliancePercentage: pct
    });

    const hash = this.computeHash({ event: 'HAND_HYGIENE_LOGGED', auditCode, compliancePercentage: pct });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'HAND_HYGIENE_AUDIT',
      entityId: audit.id as string,
      action: 'LOG_HAND_HYGIENE',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'WHO 5 Moments hand hygiene audit',
      details: { auditCode, compliancePercentage: pct }
    });

    return audit;
  }

  // Environmental Swabs
  async getEnvironmentalSwabs(tenantId: string) {
    return await this.repo.getEnvironmentalSwabs(tenantId);
  }

  async recordEnvironmentalSwab(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const swabCode = 'SWB-' + Date.now().toString().slice(-6);
    const swab = await this.repo.createEnvironmentalSwab({
      ...payload,
      tenantId,
      branchId,
      swabCode,
      sampleLocation: String(payload['sampleLocation'] || 'OT-1 Table Surface'),
      departmentName: String(payload['departmentName'] || 'OT Complex'),
      isCompliant: payload['isCompliant'] !== undefined ? Boolean(payload['isCompliant']) : true,
      sampledBy: String(payload['sampledBy'] || actorId)
    });

    const hash = this.computeHash({ event: 'SWAB_LOGGED', swabCode });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'ENVIRONMENTAL_SWAB',
      entityId: swab.id as string,
      action: 'LOG_SWAB',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Microbiological air/surface surveillance',
      details: { swabCode, sampleLocation: payload['sampleLocation'] }
    });

    return swab;
  }

  // Needle Stick Logs
  async getNeedleStickLogs(tenantId: string) {
    return await this.repo.getNeedleStickLogs(tenantId);
  }

  async recordNeedleStickLog(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const logCode = 'NSL-' + Date.now().toString().slice(-6);
    const log = await this.repo.createNeedleStickLog({
      ...payload,
      tenantId,
      branchId,
      logCode,
      staffName: String(payload['staffName'] || 'Staff Nurse'),
      staffRole: String(payload['staffRole'] || 'NURSE'),
      departmentName: String(payload['departmentName'] || 'Emergency'),
      exposureType: String(payload['exposureType'] || 'HOLLOW_BORE_NEEDLE'),
      status: 'EVALUATED_PEP_INITIATED'
    });

    const hash = this.computeHash({ event: 'NEEDLE_STICK_LOGGED', logCode });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'NEEDLE_STICK_LOG',
      entityId: log.id as string,
      action: 'LOG_NEEDLE_STICK',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Occupational exposure logged & PEP protocol triggered',
      details: { logCode, staffName: payload['staffName'] }
    });

    return log;
  }

  // BMW Logs
  async getBmwLogs(tenantId: string) {
    return await this.repo.getBmwLogs(tenantId);
  }

  async recordBmwLog(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const yellow = Number(payload['yellowBagKg']) || 0;
    const red = Number(payload['redBagKg']) || 0;
    const white = Number(payload['whitePunctureProofKg']) || 0;
    const blue = Number(payload['blueCardboardKg']) || 0;
    const total = Number((yellow + red + white + blue).toFixed(2));

    const logCode = 'BMW-' + Date.now().toString().slice(-6);
    const log = await this.repo.createBmwLog({
      ...payload,
      tenantId,
      branchId,
      logCode,
      yellowBagKg: yellow,
      redBagKg: red,
      whitePunctureProofKg: white,
      blueCardboardKg: blue,
      totalWeightKg: total,
      dispatchedToVendor: String(payload['dispatchedToVendor'] || 'Certified Common Bio-medical Waste Facility (CBWTF)'),
      verifiedByStaff: String(payload['verifiedByStaff'] || actorId)
    });

    const hash = this.computeHash({ event: 'BMW_LOGGED', logCode, totalWeightKg: total });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'BMW_LOG',
      entityId: log.id as string,
      action: 'LOG_BMW',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Bio-Medical Waste Barcode Dispatch logged',
      details: { logCode, totalWeightKg: total }
    });

    return log;
  }

  // Audit Traces
  async getAuditTraces(tenantId: string) {
    return await this.repo.getAuditTraces(tenantId);
  }
}
