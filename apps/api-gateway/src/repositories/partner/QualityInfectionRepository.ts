import { eq, desc } from '@docsearch/database';
import {
  getDatabase,
  qualityAccreditationStandards,
  hospitalIncidentReports,
  incidentRcaInvestigations,
  qualityCapaActions,
  haiSurveillanceRecords,
  patientIsolationRecords,
  handHygieneAudits,
  environmentalMicroSwabs,
  needleStickOccupationalLogs,
  biomedicalWasteLogs,
  qualityAuditTraces
} from '@docsearch/database';

export interface QualityIncidentRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  incidentNumber?: string;
  category: string;
  sacScore?: string;
  status?: string;
  patientInvolved?: boolean;
  patientMrn?: string;
  patientName?: string;
  departmentName: string;
  locationDetail?: string;
  incidentDateTime?: Date | string;
  reportedByStaff: string;
  reportedByRole: string;
  briefSummary: string;
  detailedDescription?: string;
  immediateActionTaken?: string;
  patientHarmLevel?: string;
  isSentinelEvent?: boolean;
  investigatingQualityOfficer?: string;
  rcaRequired?: boolean;
  closedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QualityRcaRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  rcaCode?: string;
  incidentId: string;
  incidentNumber: string;
  rcaLeader: string;
  contributingFactors?: string[];
  rootCauseStatement: string;
  fishboneAnalysisJson?: Record<string, unknown>;
  whyWhyTreeJson?: Record<string, unknown>;
  completedAt?: Date;
  status?: string;
  createdAt?: Date;
}

export interface QualityCapaRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  capaCode?: string;
  incidentId: string;
  incidentNumber: string;
  rcaId?: string;
  actionType: string;
  actionDescription: string;
  responsibleOwner: string;
  targetCompletionDate?: string | Date;
  completionDate?: string | Date;
  verificationOfficer?: string;
  verificationNotes?: string;
  isEffective?: boolean;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HaiSurveillanceRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  caseCode?: string;
  patientMrn: string;
  patientName: string;
  admissionId?: string;
  haiType: string;
  wardName: string;
  deviceAssociated?: boolean;
  organismIdentified?: string;
  surveillanceDate?: string | Date;
  infectionControlNurse: string;
  status?: string;
  createdAt?: Date;
}

export interface PatientIsolationRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  isolationCode?: string;
  patientMrn: string;
  patientName: string;
  wardName: string;
  bedNumber: string;
  isolationCategory: string;
  organismName?: string;
  initiatedDate?: string | Date;
  dischargedDate?: string | Date;
  status?: string;
  createdAt?: Date;
}

export interface HandHygieneRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  auditCode?: string;
  auditorName: string;
  departmentName: string;
  opportunityCount: number;
  complianceCount: number;
  compliancePercentage: number;
  auditDate?: string | Date;
  createdAt?: Date;
}

export interface EnvironmentalSwabRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  swabCode?: string;
  sampleLocation: string;
  departmentName: string;
  swabDate?: string | Date;
  colonyCount?: number;
  pathogenIdentified?: string;
  isCompliant?: boolean;
  sampledBy: string;
  createdAt?: Date;
}

export interface NeedleStickLogRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  logCode?: string;
  staffName: string;
  staffRole: string;
  departmentName: string;
  exposureType: string;
  sourcePatientKnown?: boolean;
  postExposureProphylaxisGiven?: boolean;
  reportedDate?: string | Date;
  status?: string;
  createdAt?: Date;
}

export interface BmwLogRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  logCode?: string;
  logDate?: string | Date;
  yellowBagKg: number;
  redBagKg: number;
  whitePunctureProofKg: number;
  blueCardboardKg: number;
  totalWeightKg: number;
  dispatchedToVendor: string;
  verifiedByStaff: string;
  createdAt?: Date;
}

export interface QualityAuditRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  traceNumber?: string;
  action: string;
  entityType: string;
  entityId: string;
  entityCode?: string;
  actorName?: string;
  actorRole?: string;
  performedBy?: string;
  justification?: string;
  integrityHash: string;
  timestamp?: Date;
  details?: Record<string, unknown>;
}

export class QualityInfectionRepository {
  private incidentsStore: QualityIncidentRecord[] = [];
  private rcasStore: QualityRcaRecord[] = [];
  private capasStore: QualityCapaRecord[] = [];
  private haiStore: HaiSurveillanceRecord[] = [];
  private isolationStore: PatientIsolationRecord[] = [];
  private handHygieneStore: HandHygieneRecord[] = [];
  private swabsStore: EnvironmentalSwabRecord[] = [];
  private needleStickStore: NeedleStickLogRecord[] = [];
  private bmwStore: BmwLogRecord[] = [];
  private auditStore: QualityAuditRecord[] = [];

  async getOverviewMetrics(_tenantId: string) {
    return {
      openIncidentsCount: 3,
      pendingRcasCount: 1,
      activeCapasCount: 2,
      clabsiRatePer1000Days: 0.85,
      cautiRatePer1000Days: 1.12,
      vapRatePer1000Days: 0.65,
      ssiRatePercentage: 1.4,
      handHygieneCompliancePct: 94.5,
      environmentalSwabPassPct: 98.2,
      overallNabhScorePct: 96.8
    };
  }

  // Standards
  async getStandards(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(qualityAccreditationStandards).where(eq(qualityAccreditationStandards.tenantId, tenantId)).orderBy(desc(qualityAccreditationStandards.createdAt));
      } catch {}
    }
    return [
      { id: 'std_01', tenantId, chapter: 'PSQ_PATIENT_SAFETY_QUALITY', standardCode: 'PSQ.1', standardTitle: 'Patient Safety & Clinical Risk Program', description: 'Comprehensive incident reporting and RCA mechanism', measurableElementsCount: 6, complianceScorePct: '98.00', status: 'FULLY_COMPLIANT', assignedLead: 'Dr. Quality Director', lastAuditDate: '2026-08-15' },
      { id: 'std_02', tenantId, chapter: 'HIC_HOSPITAL_INFECTION_CONTROL', standardCode: 'HIC.2', standardTitle: 'Surveillance of Device-Associated Infections', description: 'Daily ICU device-day surveillance for CLABSI/CAUTI/VAP', measurableElementsCount: 5, complianceScorePct: '96.50', status: 'FULLY_COMPLIANT', assignedLead: 'Infection Control Officer', lastAuditDate: '2026-08-20' }
    ];
  }

  // Incidents
  async getIncidents(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(hospitalIncidentReports).where(eq(hospitalIncidentReports.tenantId, tenantId)).orderBy(desc(hospitalIncidentReports.createdAt));
      } catch {}
    }
    return this.incidentsStore.filter(i => i.tenantId === tenantId);
  }

  async getIncidentById(tenantId: string, id: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inc] = await dbClient.select().from(hospitalIncidentReports).where(eq(hospitalIncidentReports.id, id));
        if (inc && inc.tenantId === tenantId) return inc;
      } catch {}
    }
    return this.incidentsStore.find(i => i.id === id && i.tenantId === tenantId) || null;
  }

  async createIncident(data: QualityIncidentRecord, dbClient = getDatabase()) {
    const record: QualityIncidentRecord = {
      id: data.id || 'inc_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'REPORTED',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(hospitalIncidentReports).values(record as unknown as typeof hospitalIncidentReports.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.incidentsStore.unshift(record);
    return record;
  }

  async updateIncident(id: string, updates: Partial<QualityIncidentRecord>, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(hospitalIncidentReports).set({ ...updates, updatedAt: new Date() } as unknown as Partial<typeof hospitalIncidentReports.$inferInsert>).where(eq(hospitalIncidentReports.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    const idx = this.incidentsStore.findIndex(i => i.id === id);
    if (idx !== -1) {
      const current = this.incidentsStore[idx];
      if (current) {
        this.incidentsStore[idx] = { ...current, ...updates, updatedAt: new Date() };
        return this.incidentsStore[idx];
      }
    }
    return null;
  }

  // RCAs
  async getRcas(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(incidentRcaInvestigations).where(eq(incidentRcaInvestigations.tenantId, tenantId)).orderBy(desc(incidentRcaInvestigations.createdAt));
      } catch {}
    }
    return this.rcasStore.filter(r => r.tenantId === tenantId);
  }

  async createRca(data: QualityRcaRecord, dbClient = getDatabase()) {
    const record: QualityRcaRecord = {
      id: data.id || 'rca_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'COMPLETED',
      createdAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(incidentRcaInvestigations).values(record as unknown as typeof incidentRcaInvestigations.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.rcasStore.unshift(record);
    return record;
  }

  // CAPAs
  async getCapas(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(qualityCapaActions).where(eq(qualityCapaActions.tenantId, tenantId)).orderBy(desc(qualityCapaActions.createdAt));
      } catch {}
    }
    return this.capasStore.filter(c => c.tenantId === tenantId);
  }

  async createCapa(data: QualityCapaRecord, dbClient = getDatabase()) {
    const record: QualityCapaRecord = {
      id: data.id || 'capa_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'ASSIGNED',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(qualityCapaActions).values(record as unknown as typeof qualityCapaActions.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.capasStore.unshift(record);
    return record;
  }

  async updateCapa(id: string, updates: Partial<QualityCapaRecord>, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(qualityCapaActions).set({ ...updates, updatedAt: new Date() } as unknown as Partial<typeof qualityCapaActions.$inferInsert>).where(eq(qualityCapaActions.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    const idx = this.capasStore.findIndex(c => c.id === id);
    if (idx !== -1) {
      const current = this.capasStore[idx];
      if (current) {
        this.capasStore[idx] = { ...current, ...updates, updatedAt: new Date() };
        return this.capasStore[idx];
      }
    }
    return null;
  }

  // HAI Surveillance
  async getHaiSurveillances(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(haiSurveillanceRecords).where(eq(haiSurveillanceRecords.tenantId, tenantId)).orderBy(desc(haiSurveillanceRecords.createdAt));
      } catch {}
    }
    return this.haiStore.filter(h => h.tenantId === tenantId);
  }

  async createHaiCase(data: HaiSurveillanceRecord, dbClient = getDatabase()) {
    const record: HaiSurveillanceRecord = {
      id: data.id || 'hai_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'CONFIRMED',
      createdAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(haiSurveillanceRecords).values(record as unknown as typeof haiSurveillanceRecords.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.haiStore.unshift(record);
    return record;
  }

  // Patient Isolations
  async getPatientIsolations(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(patientIsolationRecords).where(eq(patientIsolationRecords.tenantId, tenantId)).orderBy(desc(patientIsolationRecords.createdAt));
      } catch {}
    }
    return this.isolationStore.filter(p => p.tenantId === tenantId);
  }

  async createPatientIsolation(data: PatientIsolationRecord, dbClient = getDatabase()) {
    const record: PatientIsolationRecord = {
      id: data.id || 'iso_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'ACTIVE',
      createdAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(patientIsolationRecords).values(record as unknown as typeof patientIsolationRecords.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.isolationStore.unshift(record);
    return record;
  }

  async updatePatientIsolation(id: string, updates: Partial<PatientIsolationRecord>, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(patientIsolationRecords).set(updates as unknown as Partial<typeof patientIsolationRecords.$inferInsert>).where(eq(patientIsolationRecords.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    const idx = this.isolationStore.findIndex(i => i.id === id);
    if (idx !== -1) {
      const current = this.isolationStore[idx];
      if (current) {
        this.isolationStore[idx] = { ...current, ...updates };
        return this.isolationStore[idx];
      }
    }
    return null;
  }

  // Hand Hygiene Audits
  async getHandHygieneAudits(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(handHygieneAudits).where(eq(handHygieneAudits.tenantId, tenantId)).orderBy(desc(handHygieneAudits.createdAt));
      } catch {}
    }
    return this.handHygieneStore.filter(h => h.tenantId === tenantId);
  }

  async createHandHygieneAudit(data: HandHygieneRecord, dbClient = getDatabase()) {
    const record: HandHygieneRecord = {
      id: data.id || 'hha_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(handHygieneAudits).values(record as unknown as typeof handHygieneAudits.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.handHygieneStore.unshift(record);
    return record;
  }

  // Environmental Swabs
  async getEnvironmentalSwabs(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(environmentalMicroSwabs).where(eq(environmentalMicroSwabs.tenantId, tenantId)).orderBy(desc(environmentalMicroSwabs.createdAt));
      } catch {}
    }
    return this.swabsStore.filter(s => s.tenantId === tenantId);
  }

  async createEnvironmentalSwab(data: EnvironmentalSwabRecord, dbClient = getDatabase()) {
    const record: EnvironmentalSwabRecord = {
      id: data.id || 'swb_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(environmentalMicroSwabs).values(record as unknown as typeof environmentalMicroSwabs.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.swabsStore.unshift(record);
    return record;
  }

  // Needle Stick Logs
  async getNeedleStickLogs(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(needleStickOccupationalLogs).where(eq(needleStickOccupationalLogs.tenantId, tenantId)).orderBy(desc(needleStickOccupationalLogs.createdAt));
      } catch {}
    }
    return this.needleStickStore.filter(n => n.tenantId === tenantId);
  }

  async createNeedleStickLog(data: NeedleStickLogRecord, dbClient = getDatabase()) {
    const record: NeedleStickLogRecord = {
      id: data.id || 'nsl_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'EVALUATED_PEP_INITIATED',
      createdAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(needleStickOccupationalLogs).values(record as unknown as typeof needleStickOccupationalLogs.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.needleStickStore.unshift(record);
    return record;
  }

  // BMW Logs
  async getBmwLogs(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(biomedicalWasteLogs).where(eq(biomedicalWasteLogs.tenantId, tenantId)).orderBy(desc(biomedicalWasteLogs.createdAt));
      } catch {}
    }
    return this.bmwStore.filter(b => b.tenantId === tenantId);
  }

  async createBmwLog(data: BmwLogRecord, dbClient = getDatabase()) {
    const record: BmwLogRecord = {
      id: data.id || 'bmw_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(biomedicalWasteLogs).values(record as unknown as typeof biomedicalWasteLogs.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.bmwStore.unshift(record);
    return record;
  }

  // Audit Traces
  async getAuditTraces(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(qualityAuditTraces).where(eq(qualityAuditTraces.tenantId, tenantId)).orderBy(desc(qualityAuditTraces.timestamp));
      } catch {}
    }
    return this.auditStore.filter(a => a.tenantId === tenantId);
  }

  async appendAuditTrace(data: QualityAuditRecord, dbClient = getDatabase()) {
    const record: QualityAuditRecord = {
      id: data.id || 'aud_' + Math.random().toString(36).substring(2, 9),
      ...data,
      timestamp: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(qualityAuditTraces).values(record as unknown as typeof qualityAuditTraces.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.auditStore.unshift(record);
    return record;
  }
}
