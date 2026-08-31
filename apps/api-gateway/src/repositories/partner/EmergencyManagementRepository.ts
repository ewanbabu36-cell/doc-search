import {
  getDatabase,
  emergencyEncounters,
  emergencyTriageAssessments,
  emergencyDispositionRecords,
  encounters,
  eq,
  and,
  desc
} from '@docsearch/database';

export interface EmergencyRegistrationInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientId: string;
  doctorId?: string;
  arrivalMode?: string;
  broughtBy?: string;
  chiefComplaint: string;
  initialPriority?: string; // CRITICAL, URGENT, NON_URGENT
}

export interface EmergencyTriageInput {
  tenantId: string;
  encounterId: string;
  patientId: string;
  triageNurseId: string;
  triageCategory: string; // RED, YELLOW, GREEN, CRITICAL, URGENT, NON_URGENT
  chiefComplaint?: string;
  temperature?: string;
  bloodPressure?: string;
  pulseRate?: string;
  spO2?: string;
  respiratoryRate?: string;
  painScore?: number;
  glasgowComaScale?: number;
  arrivalCondition?: string;
  triageNotes?: string;
}

export interface EmergencyTreatmentInput {
  tenantId: string;
  encounterId: string;
  patientId: string;
  clinicianId: string;
  treatmentNotes: string;
  orders?: Array<{
    orderType: string; // LAB, RADIOLOGY, MEDICATION
    description: string;
    priority: string;
  }>;
  reassessmentVitals?: {
    bloodPressure?: string;
    pulseRate?: string;
    spO2?: string;
  };
}

export interface EmergencyDispositionInput {
  tenantId: string;
  encounterId: string;
  patientId: string;
  clinicianId: string;
  dispositionType: 'DISCHARGED' | 'ADMITTED' | 'TRANSFERRED' | 'REFERRED' | 'LEFT_AGAINST_MEDICAL_ADVICE' | 'DECEASED';
  dispositionNotes: string;
  destinationFacility?: string;
  linkedAdmissionId?: string;
}

export interface StoredEmergencyEncounter {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  emergencyNumber: string;
  patientId: string;
  canonicalEncounterId: string;
  assignedClinicianId: string | null;
  arrivalMode: string;
  chiefComplaint: string;
  priority: string;
  status: 'REGISTERED' | 'TRIAGED' | 'IN_TREATMENT' | 'UNDER_OBSERVATION' | 'DISPOSITION_COMPLETED';
  triage: {
    triageCategory: string;
    triageNurseId: string;
    vitals: {
      temperature?: string | undefined;
      bloodPressure?: string | undefined;
      pulseRate?: string | undefined;
      spO2?: string | undefined;
      respiratoryRate?: string | undefined;
    };
    painScore?: number | undefined;
    glasgowComaScale?: number | undefined;
    triageNotes?: string | undefined;
    triagedAt: Date;
  } | null;
  treatments: Array<{
    clinicianId: string;
    treatmentNotes: string;
    orders: Array<{ orderType: string; description: string; priority: string }>;
    reassessmentVitals?: { bloodPressure?: string | undefined; pulseRate?: string | undefined; spO2?: string | undefined } | undefined;
    recordedAt: Date;
  }>;
  disposition: {
    dispositionType: string;
    dispositionNotes: string;
    destinationFacility?: string | undefined;
    linkedAdmissionId?: string | undefined;
    dispositionedBy: string;
    dispositionedAt: Date;
  } | null;
  arrivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class EmergencyManagementRepository {
  private memEncounters = new Map<string, StoredEmergencyEncounter[]>();

  async getQueue(tenantId: string, status?: string, priority?: string, dbClient = getDatabase()): Promise<StoredEmergencyEncounter[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(emergencyEncounters)
          .where(eq(emergencyEncounters.tenantId, tenantId))
          .orderBy(desc(emergencyEncounters.createdAt));
        if (rows.length > 0) {
          let list = rows as unknown as StoredEmergencyEncounter[];
          if (status) list = list.filter(e => e.status === status);
          if (priority) list = list.filter(e => e.priority === priority);
          return list;
        }
      } catch {
        // Fallback
      }
    }
    let list = this.memEncounters.get(tenantId) || [];
    if (status) list = list.filter(e => e.status === status);
    if (priority) list = list.filter(e => e.priority === priority);
    return list;
  }

  async getEncounterById(tenantId: string, id: string, dbClient = getDatabase()): Promise<StoredEmergencyEncounter | null> {
    if (dbClient) {
      try {
        const [found] = await dbClient
          .select()
          .from(emergencyEncounters)
          .where(and(eq(emergencyEncounters.tenantId, tenantId), eq(emergencyEncounters.id, id)));
        if (found) return found as unknown as StoredEmergencyEncounter;
      } catch {
        // Fallback
      }
    }
    const list = this.memEncounters.get(tenantId) || [];
    return list.find(e => e.id === id) || null;
  }

  async registerEmergencyPatient(input: EmergencyRegistrationInput, dbClient = getDatabase()): Promise<StoredEmergencyEncounter> {
    const id = crypto.randomUUID();
    const canonicalEncounterId = crypto.randomUUID();
    const emergencyNumber = `EMG-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    const record: StoredEmergencyEncounter = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      emergencyNumber,
      patientId: input.patientId,
      canonicalEncounterId,
      assignedClinicianId: input.doctorId || null,
      arrivalMode: input.arrivalMode || 'WALK_IN',
      chiefComplaint: input.chiefComplaint,
      priority: input.initialPriority || 'URGENT',
      status: 'REGISTERED',
      triage: null,
      treatments: [],
      disposition: null,
      arrivedAt: now,
      createdAt: now,
      updatedAt: now
    };

    if (dbClient) {
      try {
        // Create canonical encounter
        await dbClient.insert(encounters).values({
          id: canonicalEncounterId,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          patientId: record.patientId,
          doctorId: record.assignedClinicianId || '00000000-0000-0000-0000-000000000000',
          encounterType: 'EMERGENCY',
          status: 'IN_PROGRESS',
          chiefComplaint: record.chiefComplaint,
          checkedInAt: now
        } as unknown as typeof encounters.$inferInsert);

        // Create Emergency Encounter
        const [created] = await dbClient.insert(emergencyEncounters).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          emergencyNumber: record.emergencyNumber,
          patientId: record.patientId,
          encounterId: record.canonicalEncounterId,
          chiefComplaint: record.chiefComplaint,
          arrivalMode: record.arrivalMode,
          status: record.status
        } as unknown as typeof emergencyEncounters.$inferInsert).returning();
        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const current = this.memEncounters.get(input.tenantId) || [];
    current.unshift(record);
    this.memEncounters.set(input.tenantId, current);
    return record;
  }

  async recordTriage(input: EmergencyTriageInput, dbClient = getDatabase()): Promise<StoredEmergencyEncounter | null> {
    const item = await this.getEncounterById(input.tenantId, input.encounterId, dbClient);
    if (!item) return null;

    const now = new Date();
    const triageData = {
      triageCategory: input.triageCategory,
      triageNurseId: input.triageNurseId,
      vitals: {
        temperature: input.temperature,
        bloodPressure: input.bloodPressure,
        pulseRate: input.pulseRate,
        spO2: input.spO2,
        respiratoryRate: input.respiratoryRate
      },
      painScore: input.painScore,
      glasgowComaScale: input.glasgowComaScale,
      triageNotes: input.triageNotes,
      triagedAt: now
    };

    item.triage = triageData;
    item.priority = input.triageCategory.includes('RED') || input.triageCategory.includes('CRITICAL') ? 'CRITICAL' : 'URGENT';
    item.status = 'TRIAGED';
    item.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient.insert(emergencyTriageAssessments).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: item.partnerId,
          organizationId: item.organizationId,
          branchId: item.branchId,
          emergencyEncounterId: item.id,
          triageLevel: item.priority,
          chiefComplaint: input.chiefComplaint || item.chiefComplaint,
          systolicBP: input.bloodPressure ? parseInt(input.bloodPressure.split('/')[0] || '120') : 120,
          heartRate: input.pulseRate ? parseInt(input.pulseRate) : 80,
          spO2: input.spO2 ? parseInt(input.spO2) : 98,
          painScore: input.painScore || 0,
          gcsScore: input.glasgowComaScale || 15,
          triageNurseId: input.triageNurseId,
          triagedAt: now
        } as unknown as typeof emergencyTriageAssessments.$inferInsert);

        await dbClient
          .update(emergencyEncounters)
          .set({ updatedAt: now })
          .where(and(eq(emergencyEncounters.tenantId, input.tenantId), eq(emergencyEncounters.id, input.encounterId)));
      } catch {
        // Fallback
      }
    }

    return item;
  }

  async recordTreatment(input: EmergencyTreatmentInput, dbClient = getDatabase()): Promise<StoredEmergencyEncounter | null> {
    const item = await this.getEncounterById(input.tenantId, input.encounterId, dbClient);
    if (!item) return null;

    const now = new Date();
    const treatmentRecord = {
      clinicianId: input.clinicianId,
      treatmentNotes: input.treatmentNotes,
      orders: input.orders || [],
      reassessmentVitals: input.reassessmentVitals,
      recordedAt: now
    };

    item.treatments.push(treatmentRecord);
    item.assignedClinicianId = input.clinicianId;
    item.status = 'IN_TREATMENT';
    item.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient
          .update(emergencyEncounters)
          .set({ updatedAt: now })
          .where(and(eq(emergencyEncounters.tenantId, input.tenantId), eq(emergencyEncounters.id, input.encounterId)));
      } catch {
        // Fallback
      }
    }

    return item;
  }

  async recordDisposition(input: EmergencyDispositionInput, dbClient = getDatabase()): Promise<StoredEmergencyEncounter | null> {
    const item = await this.getEncounterById(input.tenantId, input.encounterId, dbClient);
    if (!item) return null;

    const now = new Date();
    const dispositionRecord = {
      dispositionType: input.dispositionType,
      dispositionNotes: input.dispositionNotes,
      destinationFacility: input.destinationFacility,
      linkedAdmissionId: input.linkedAdmissionId,
      dispositionedBy: input.clinicianId,
      dispositionedAt: now
    };

    item.disposition = dispositionRecord;
    item.status = 'DISPOSITION_COMPLETED';
    item.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient.insert(emergencyDispositionRecords).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: item.partnerId,
          organizationId: item.organizationId,
          branchId: item.branchId,
          emergencyEncounterId: item.id,
          dispositionType: input.dispositionType,
          dispositionNotes: input.dispositionNotes,
          decidedByDoctorId: input.clinicianId,
          dispositionedAt: now
        } as unknown as typeof emergencyDispositionRecords.$inferInsert);

        await dbClient
          .update(emergencyEncounters)
          .set({ dispositionOutcome: input.dispositionType, updatedAt: now })
          .where(and(eq(emergencyEncounters.tenantId, input.tenantId), eq(emergencyEncounters.id, input.encounterId)));
      } catch {
        // Fallback
      }
    }

    return item;
  }

  async getPatientEmergencyHistory(tenantId: string, patientId: string): Promise<StoredEmergencyEncounter[]> {
    const list = this.memEncounters.get(tenantId) || [];
    return list.filter(e => e.patientId === patientId);
  }
}

export const emergencyManagementRepository = new EmergencyManagementRepository();
