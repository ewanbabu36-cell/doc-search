import { apiRequest } from './api-client.js';

function loadStored<T>(key: string, fallback: T[]): T[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const item = window.localStorage.getItem(key);
      if (item) return JSON.parse(item);
    } catch {
      // Fallback
    }
  }
  return [...fallback];
}

function saveStored<T>(key: string, data: T[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }
}

import type {
  ConsultationDto,
  ConsultationVitalsDto,
  ConsultationExaminationDto,
  ConsultationDiagnosisDto,
  ConsultationMedicationDto,
  ConsultationInstructionDto,
  ConsultationFollowUpDto,
  ConsultationAuditTraceDto,
  ConsultationOverviewDto,
  CreateConsultationRequest,
  StartConsultationRequest,
  SaveConsultationDraftRequest,
  AddConsultationVitalsRequest,
  AddExaminationRequest,
  AddDiagnosisRequest,
  UpdateDiagnosisRequest,
  RemoveDiagnosisRequest,
  AddMedicationRequest,
  UpdateMedicationRequest,
  DiscontinueMedicationRequest,
  AddInstructionRequest,
  CreateFollowUpPlanRequest,
  CompleteConsultationRequest,
  AmendConsultationRequest,
  QueryConsultationRequest,
  QueryConsultationAuditRequest
} from '@docsearch/api-contracts';
import {
  MOCK_CONSULTATIONS,
  MOCK_CONSULTATION_AUDIT_TRACES
} from './mock-clinical-consultation-data.js';

export interface IClinicalConsultationService {
  getOverview(
    tenantId: string,
    partnerId?: string,
    organizationId?: string,
    branchId?: string
  ): Promise<ConsultationOverviewDto>;
  searchConsultations(req: QueryConsultationRequest): Promise<ConsultationDto[]>;
  getConsultationById(tenantId: string, consultationId: string): Promise<ConsultationDto | null>;
  getConsultationByEncounterId(tenantId: string, encounterId: string): Promise<ConsultationDto | null>;
  createConsultation(req: CreateConsultationRequest): Promise<ConsultationDto>;
  startConsultation(req: StartConsultationRequest): Promise<ConsultationDto>;
  saveDraft(req: SaveConsultationDraftRequest): Promise<ConsultationDto>;
  addVitals(req: AddConsultationVitalsRequest): Promise<ConsultationDto>;
  addExamination(req: AddExaminationRequest): Promise<ConsultationDto>;
  addDiagnosis(req: AddDiagnosisRequest): Promise<ConsultationDto>;
  updateDiagnosis(req: UpdateDiagnosisRequest): Promise<ConsultationDto>;
  removeDiagnosis(req: RemoveDiagnosisRequest): Promise<ConsultationDto>;
  addMedication(req: AddMedicationRequest): Promise<ConsultationDto>;
  updateMedication(req: UpdateMedicationRequest): Promise<ConsultationDto>;
  discontinueMedication(req: DiscontinueMedicationRequest): Promise<ConsultationDto>;
  addInstruction(req: AddInstructionRequest): Promise<ConsultationDto>;
  createFollowUpPlan(req: CreateFollowUpPlanRequest): Promise<ConsultationDto>;
  completeConsultation(req: CompleteConsultationRequest): Promise<ConsultationDto>;
  amendConsultation(req: AmendConsultationRequest): Promise<ConsultationDto>;
  getAuditTraces(req: QueryConsultationAuditRequest): Promise<ConsultationAuditTraceDto[]>;
}

class ClinicalConsultationService implements IClinicalConsultationService {
  private consultations: ConsultationDto[] = loadStored("docsearch_consultations", MOCK_CONSULTATIONS);
  private auditTraces: ConsultationAuditTraceDto[] = [...MOCK_CONSULTATION_AUDIT_TRACES];

  private generateConsultationNumber(): string {
    const seq = this.consultations.length + 1;
    return `CON-ORG001-${seq.toString().padStart(6, '0')}`;
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private recordAudit(
    tenantId: string,
    partnerId: string,
    organizationId: string,
    branchId: string | undefined,
    patientId: string | undefined,
    encounterId: string | undefined,
    consultationId: string | undefined,
    actorId: string,
    actorRole: string,
    action: string,
    targetEntity: string,
    targetEntityId: string,
    justification: string,
    previousSnapshot?: Record<string, unknown>,
    newSnapshot?: Record<string, unknown>
  ): void {
    const trace: ConsultationAuditTraceDto = {
      id: this.generateId(),
      traceId: `TRC-CONS-${(this.auditTraces.length + 1).toString().padStart(4, '0')}`,
      tenantId,
      partnerId,
      organizationId,
      branchId,
      patientId,
      encounterId,
      consultationId,
      actorId,
      actorRole,
      action,
      targetEntity,
      targetEntityId,
      previousSnapshot,
      newSnapshot,
      justification,
      operationStatus: 'SUCCESS',
      correlationId: `CORR-EMR-${Date.now()}`,
      metadata: {},
      occurredAt: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  public async getOverview(
    tenantId: string,
    _partnerId?: string,
    _organizationId?: string,
    _branchId?: string
  ): Promise<ConsultationOverviewDto> {
    const filtered = this.consultations.filter((c) => c.tenantId === tenantId);
    return {
      totalConsultationsCount: filtered.length,
      activeConsultationsCount: filtered.filter(
        (c) => c.consultationStatus === 'STARTED' || c.consultationStatus === 'IN_PROGRESS'
      ).length,
      draftConsultationsCount: filtered.filter((c) => c.consultationStatus === 'DRAFT').length,
      inProgressConsultationsCount: filtered.filter((c) => c.consultationStatus === 'IN_PROGRESS').length,
      completedTodayCount: filtered.filter((c) => c.consultationStatus === 'COMPLETED').length,
      followUpsRequiredCount: filtered.filter((c) => c.followUpRequired).length,
      uncompletedNotesCount: filtered.filter((c) => c.consultationStatus !== 'COMPLETED' && c.consultationStatus !== 'CANCELLED').length,
      amendedCount: filtered.filter((c) => c.isAmended).length
    };
  }

  public async searchConsultations(req: QueryConsultationRequest): Promise<ConsultationDto[]> {
    return this.consultations.filter((c) => {
      if (c.tenantId !== req.tenantId) return false;
      if (req.organizationId && c.organizationId !== req.organizationId) return false;
      if (req.branchId && c.branchId !== req.branchId) return false;
      if (req.patientId && c.patientId !== req.patientId) return false;
      if (req.encounterId && c.encounterId !== req.encounterId) return false;
      if (req.doctorId && c.doctorId !== req.doctorId) return false;
      if (req.consultationStatus && c.consultationStatus !== req.consultationStatus) return false;
      if (req.consultationType && c.consultationType !== req.consultationType) return false;
      if (req.searchTerm) {
        const q = req.searchTerm.toLowerCase();
        const matchesNumber = c.consultationNumber.toLowerCase().includes(q);
        const matchesPatient = c.patientName.toLowerCase().includes(q) || c.patientMrn.toLowerCase().includes(q);
        const matchesDoctor = c.doctorName.toLowerCase().includes(q);
        const matchesComplaint = c.chiefComplaint.toLowerCase().includes(q);
        if (!matchesNumber && !matchesPatient && !matchesDoctor && !matchesComplaint) return false;
      }
      return true;
    });
  }

  public async getConsultationById(tenantId: string, consultationId: string): Promise<ConsultationDto | null> {
    const found = this.consultations.find((c) => c.tenantId === tenantId && c.id === consultationId);
    return found ? { ...found } : null;
  }

  public async getConsultationByEncounterId(tenantId: string, encounterId: string): Promise<ConsultationDto | null> {
    const found = this.consultations.find((c) => c.tenantId === tenantId && c.encounterId === encounterId);
    return found ? { ...found } : null;
  }

  public async createConsultation(req: CreateConsultationRequest): Promise<ConsultationDto> {
    try {
      const res = await apiRequest<ConsultationDto>('/api/v1/partner/consultations', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.consultations.unshift(res.data);
        return res.data;
      }
    } catch {
      // Fallback
    }
    saveStored('docsearch_consultations', this.consultations);
    const existing = this.consultations.find(
      (c) => c.tenantId === req.tenantId && c.encounterId === req.encounterId && c.consultationStatus !== 'CANCELLED'
    );
    if (existing) {
      return { ...existing };
    }

    const newId = this.generateId();
    const newConsultation: ConsultationDto = {
      id: newId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      organizationName: 'Apex Multi-Specialty Clinics',
      branchId: req.branchId,
      branchName: 'Apex Downtown Care Center',
      patientId: req.patientId,
      patientName: 'Eleanor Vance',
      patientMrn: 'DS-ORG001-000001',
      patientDob: '1984-05-12',
      patientGender: 'FEMALE',
      patientMobile: '+1 555-019-2831',
      patientAllergies: ['Penicillin (Anaphylaxis)'],
      encounterId: req.encounterId,
      encounterNumber: 'ENC-ORG001-000001',
      encounterType: 'OPD_CONSULTATION',
      doctorId: req.doctorId,
      doctorName: 'Dr. Sarah Jenkins, MD',
      doctorSpecialty: 'Cardiology',
      consultationNumber: this.generateConsultationNumber(),
      consultationStatus: 'DRAFT',
      consultationType: req.consultationType,
      chiefComplaint: req.chiefComplaint,
      historyOfPresentIllness: req.historyOfPresentIllness,
      medicalHistory: req.medicalHistory,
      surgicalHistory: req.surgicalHistory,
      familyHistory: req.familyHistory,
      socialHistory: req.socialHistory,
      allergySummary: req.allergySummary,
      medicationHistory: req.medicationHistory,
      version: 1,
      isAmended: false,
      followUpRequired: false,
      diagnoses: [],
      medications: [],
      createdBy: req.actorId,
      updatedBy: req.actorId,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.consultations.unshift(newConsultation);

    this.recordAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      req.patientId,
      req.encounterId,
      newId,
      req.actorId,
      req.actorRole,
      'CONSULTATION_CREATED',
      'consultations',
      newId,
      req.justification,
      undefined,
      newConsultation as unknown as Record<string, unknown>
    );

    return { ...newConsultation };
  }

  public async startConsultation(req: StartConsultationRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot start an already completed consultation');
    }

    const previousSnapshot = { ...consultation };
    consultation.consultationStatus = 'IN_PROGRESS';
    consultation.startedAt = consultation.startedAt ?? new Date().toISOString();
    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'CONSULTATION_STARTED',
      'consultations',
      consultation.id,
      req.justification,
      previousSnapshot as unknown as Record<string, unknown>,
      consultation as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async saveDraft(req: SaveConsultationDraftRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot edit completed consultation draft. Use audited amendment instead.');
    }

    const previousSnapshot = { ...consultation };
    if (req.chiefComplaint !== undefined) consultation.chiefComplaint = req.chiefComplaint;
    if (req.historyOfPresentIllness !== undefined) consultation.historyOfPresentIllness = req.historyOfPresentIllness;
    if (req.medicalHistory !== undefined) consultation.medicalHistory = req.medicalHistory;
    if (req.surgicalHistory !== undefined) consultation.surgicalHistory = req.surgicalHistory;
    if (req.familyHistory !== undefined) consultation.familyHistory = req.familyHistory;
    if (req.socialHistory !== undefined) consultation.socialHistory = req.socialHistory;
    if (req.allergySummary !== undefined) consultation.allergySummary = req.allergySummary;
    if (req.medicationHistory !== undefined) consultation.medicationHistory = req.medicationHistory;
    if (req.examinationSummary !== undefined) consultation.examinationSummary = req.examinationSummary;
    if (req.clinicalAssessment !== undefined) consultation.clinicalAssessment = req.clinicalAssessment;
    if (req.treatmentPlan !== undefined) consultation.treatmentPlan = req.treatmentPlan;
    if (req.patientInstructions !== undefined) consultation.patientInstructions = req.patientInstructions;
    if (req.followUpRequired !== undefined) consultation.followUpRequired = req.followUpRequired;
    if (req.followUpNotes !== undefined) consultation.followUpNotes = req.followUpNotes;

    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'CONSULTATION_DRAFT_SAVED',
      'consultations',
      consultation.id,
      req.justification,
      previousSnapshot as unknown as Record<string, unknown>,
      consultation as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async addVitals(req: AddConsultationVitalsRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot modify vitals on a completed consultation');
    }

    const vitalsId = this.generateId();
    const vitals: ConsultationVitalsDto = {
      id: vitalsId,
      tenantId: req.tenantId,
      partnerId: consultation.partnerId,
      organizationId: consultation.organizationId,
      consultationId: consultation.id,
      patientId: consultation.patientId,
      temperatureCelsius: req.temperatureCelsius,
      pulseBpm: req.pulseBpm,
      respiratoryRateBpm: req.respiratoryRateBpm,
      systolicBp: req.systolicBp,
      diastolicBp: req.diastolicBp,
      oxygenSaturationPercent: req.oxygenSaturationPercent,
      weightKg: req.weightKg,
      heightCm: req.heightCm,
      bmi: req.bmi,
      painScore: req.painScore,
      clinicalNotes: req.clinicalNotes,
      recordedBy: req.actorId,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    consultation.vitals = vitals;
    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'VITALS_ADDED',
      'consultation_vitals',
      vitalsId,
      req.justification,
      undefined,
      vitals as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async addExamination(req: AddExaminationRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot modify examination on a completed consultation');
    }

    const examId = this.generateId();
    const exam: ConsultationExaminationDto = {
      id: examId,
      tenantId: req.tenantId,
      partnerId: consultation.partnerId,
      organizationId: consultation.organizationId,
      consultationId: consultation.id,
      generalAppearance: req.generalAppearance,
      cardiovascular: req.cardiovascular,
      respiratory: req.respiratory,
      abdomen: req.abdomen,
      neurological: req.neurological,
      musculoskeletal: req.musculoskeletal,
      skin: req.skin,
      ent: req.ent,
      eyes: req.eyes,
      otherFindings: req.otherFindings,
      freeTextFindings: req.freeTextFindings,
      examinedBy: req.actorId,
      examinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    consultation.examination = exam;
    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'EXAMINATION_ADDED',
      'consultation_examinations',
      examId,
      req.justification,
      undefined,
      exam as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async addDiagnosis(req: AddDiagnosisRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot add diagnosis to a completed consultation');
    }

    const diagId = this.generateId();
    if (req.isPrimary) {
      consultation.diagnoses.forEach((d) => {
        d.isPrimary = false;
      });
    }

    const diag: ConsultationDiagnosisDto = {
      id: diagId,
      tenantId: req.tenantId,
      partnerId: consultation.partnerId,
      organizationId: consultation.organizationId,
      consultationId: consultation.id,
      patientId: consultation.patientId,
      diagnosisCode: req.diagnosisCode,
      diagnosisName: req.diagnosisName,
      diagnosisType: req.diagnosisType,
      clinicalStatus: req.clinicalStatus,
      certainty: req.certainty,
      isPrimary: req.isPrimary,
      notes: req.notes,
      recordedBy: req.actorId,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    consultation.diagnoses.push(diag);
    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'DIAGNOSIS_ADDED',
      'consultation_diagnoses',
      diagId,
      req.justification,
      undefined,
      diag as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async updateDiagnosis(req: UpdateDiagnosisRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot modify diagnosis on a completed consultation');
    }

    const target = consultation.diagnoses.find((d) => d.id === req.diagnosisId);
    if (!target) {
      throw new Error('Diagnosis entry not found in consultation');
    }

    const previousSnapshot = { ...target };
    if (req.isPrimary) {
      consultation.diagnoses.forEach((d) => {
        d.isPrimary = false;
      });
    }

    if (req.diagnosisCode !== undefined) target.diagnosisCode = req.diagnosisCode;
    if (req.diagnosisName !== undefined) target.diagnosisName = req.diagnosisName;
    if (req.diagnosisType !== undefined) target.diagnosisType = req.diagnosisType;
    if (req.clinicalStatus !== undefined) target.clinicalStatus = req.clinicalStatus;
    if (req.certainty !== undefined) target.certainty = req.certainty;
    if (req.isPrimary !== undefined) target.isPrimary = req.isPrimary;
    if (req.notes !== undefined) target.notes = req.notes;
    target.updatedAt = new Date().toISOString();

    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'DIAGNOSIS_UPDATED',
      'consultation_diagnoses',
      target.id,
      req.justification,
      previousSnapshot as unknown as Record<string, unknown>,
      target as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async removeDiagnosis(req: RemoveDiagnosisRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot delete diagnosis from a completed consultation');
    }

    const target = consultation.diagnoses.find((d) => d.id === req.diagnosisId);
    if (!target) {
      throw new Error('Diagnosis entry not found');
    }

    const previousSnapshot = { ...target };
    consultation.diagnoses = consultation.diagnoses.filter((d) => d.id !== req.diagnosisId);
    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'DIAGNOSIS_REMOVED',
      'consultation_diagnoses',
      req.diagnosisId,
      req.justification,
      previousSnapshot as unknown as Record<string, unknown>,
      undefined
    );

    return { ...consultation };
  }

  public async addMedication(req: AddMedicationRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot add medication to a completed consultation');
    }

    const medId = this.generateId();
    const med: ConsultationMedicationDto = {
      id: medId,
      tenantId: req.tenantId,
      partnerId: consultation.partnerId,
      organizationId: consultation.organizationId,
      consultationId: consultation.id,
      patientId: consultation.patientId,
      medicationName: req.medicationName,
      genericName: req.genericName,
      strength: req.strength,
      dosage: req.dosage,
      route: req.route,
      frequency: req.frequency,
      duration: req.duration,
      durationUnit: req.durationUnit,
      quantity: req.quantity,
      instructions: req.instructions,
      beforeAfterFood: req.beforeAfterFood,
      asNeeded: req.asNeeded,
      indication: req.indication,
      status: 'ACTIVE',
      prescribedBy: req.actorId,
      prescribedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    consultation.medications.push(med);
    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'MEDICATION_ADDED',
      'consultation_medications',
      medId,
      req.justification,
      undefined,
      med as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async updateMedication(req: UpdateMedicationRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot modify medication on a completed consultation');
    }

    const target = consultation.medications.find((m) => m.id === req.medicationId);
    if (!target) {
      throw new Error('Medication order not found');
    }

    const previousSnapshot = { ...target };
    if (req.medicationName !== undefined) target.medicationName = req.medicationName;
    if (req.genericName !== undefined) target.genericName = req.genericName;
    if (req.strength !== undefined) target.strength = req.strength;
    if (req.dosage !== undefined) target.dosage = req.dosage;
    if (req.route !== undefined) target.route = req.route;
    if (req.frequency !== undefined) target.frequency = req.frequency;
    if (req.duration !== undefined) target.duration = req.duration;
    if (req.durationUnit !== undefined) target.durationUnit = req.durationUnit;
    if (req.quantity !== undefined) target.quantity = req.quantity;
    if (req.instructions !== undefined) target.instructions = req.instructions;
    if (req.beforeAfterFood !== undefined) target.beforeAfterFood = req.beforeAfterFood;
    if (req.asNeeded !== undefined) target.asNeeded = req.asNeeded;
    if (req.indication !== undefined) target.indication = req.indication;
    if (req.status !== undefined) target.status = req.status;
    target.updatedAt = new Date().toISOString();

    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'MEDICATION_UPDATED',
      'consultation_medications',
      target.id,
      req.justification,
      previousSnapshot as unknown as Record<string, unknown>,
      target as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async discontinueMedication(req: DiscontinueMedicationRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }

    const target = consultation.medications.find((m) => m.id === req.medicationId);
    if (!target) {
      throw new Error('Medication order not found');
    }

    const previousSnapshot = { ...target };
    target.status = 'DISCONTINUED';
    target.instructions = target.instructions
      ? `${target.instructions} [Discontinued: ${req.discontinueReason}]`
      : `[Discontinued: ${req.discontinueReason}]`;
    target.updatedAt = new Date().toISOString();

    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'MEDICATION_DISCONTINUED',
      'consultation_medications',
      target.id,
      req.justification,
      previousSnapshot as unknown as Record<string, unknown>,
      target as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async addInstruction(req: AddInstructionRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot modify instructions on a completed consultation');
    }

    const instId = this.generateId();
    const inst: ConsultationInstructionDto = {
      id: instId,
      tenantId: req.tenantId,
      partnerId: consultation.partnerId,
      organizationId: consultation.organizationId,
      consultationId: consultation.id,
      patientInstruction: req.patientInstruction,
      dietInstruction: req.dietInstruction,
      activityInstruction: req.activityInstruction,
      warningSignInstruction: req.warningSignInstruction,
      homeCareInstruction: req.homeCareInstruction,
      followUpInstruction: req.followUpInstruction,
      instructionPriority: req.instructionPriority,
      recordedBy: req.actorId,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    consultation.instructions = inst;
    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'INSTRUCTION_ADDED',
      'consultation_instructions',
      instId,
      req.justification,
      undefined,
      inst as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async createFollowUpPlan(req: CreateFollowUpPlanRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Cannot modify follow-up plan on a completed consultation');
    }

    const folId = this.generateId();
    const fol: ConsultationFollowUpDto = {
      id: folId,
      tenantId: req.tenantId,
      partnerId: consultation.partnerId,
      organizationId: consultation.organizationId,
      consultationId: consultation.id,
      patientId: consultation.patientId,
      followUpRequired: req.followUpRequired,
      recommendedDate: req.recommendedDate,
      recommendedWindow: req.recommendedWindow,
      reason: req.reason,
      notes: req.notes,
      status: 'PENDING',
      recordedBy: req.actorId,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    consultation.followUp = fol;
    consultation.followUpRequired = req.followUpRequired;
    consultation.followUpNotes = req.notes ?? req.reason;
    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'FOLLOWUP_CREATED',
      'consultation_followups',
      folId,
      req.justification,
      undefined,
      fol as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async completeConsultation(req: CompleteConsultationRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus === 'COMPLETED') {
      throw new Error('Consultation is already completed and protected');
    }

    const previousSnapshot = { ...consultation };
    consultation.clinicalAssessment = req.clinicalAssessment;
    consultation.treatmentPlan = req.treatmentPlan;
    consultation.consultationStatus = 'COMPLETED';
    consultation.completedAt = new Date().toISOString();
    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'CONSULTATION_COMPLETED',
      'consultations',
      consultation.id,
      req.justification,
      previousSnapshot as unknown as Record<string, unknown>,
      consultation as unknown as Record<string, unknown>
    );

    // AUTO-SYNC DOCTOR E-PRESCRIPTION TO PHARMACY QUEUE
    if (consultation.medications && consultation.medications.length > 0 && typeof window !== 'undefined') {
      try {
        const existingRxList: any[] = JSON.parse(localStorage.getItem('docsearch_pharmacy_prescriptions') || '[]');
        const newRxNumber = `RX-OPD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        const newRx = {
          id: crypto.randomUUID(),
          tenantId: req.tenantId,
          branchId: consultation.branchId || '00000000-0000-4000-8000-000000000003',
          prescriptionNumber: newRxNumber,
          patientId: consultation.patientId,
          patientName: consultation.patientName || 'Rahul Kumar',
          patientMrn: consultation.patientMrn || 'MRN-84920',
          doctorId: consultation.doctorId,
          doctorName: consultation.doctorName || 'Dr. Rajesh Sharma, MD',
          doctorSpecialty: 'Internal Medicine',
          departmentName: 'OPD Clinical Care',
          status: 'READY_FOR_DISPENSING',
          prescribedAt: new Date().toISOString(),
          items: consultation.medications.map((m) => ({
            id: m.id || crypto.randomUUID(),
            medicationId: 'med-01',
            medicationName: m.medicationName,
            genericName: m.genericName,
            brandName: m.medicationName,
            dosageForm: 'TABLET',
            strength: m.strength || '500mg',
            dose: m.dosage || '1 Tablet',
            route: m.route || 'ORAL',
            frequency: m.frequency || 'BID (Twice Daily)',
            durationDays: m.duration || 5,
            quantityPrescribed: (m.duration || 5) * 2,
            quantityDispensed: 0,
            unitPrice: 4.5,
            totalPrice: ((m.duration || 5) * 2) * 4.5,
            instructions: m.instructions || m.beforeAfterFood || 'After meals',
            substitutionAllowed: true,
            isGenericAccepted: true,
            status: 'PENDING_DISPENSE'
          })),
          totalAmount: 180.0,
          notes: consultation.treatmentPlan || 'Auto-generated from finalized Doctor OPD Consultation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        existingRxList.unshift(newRx);
        localStorage.setItem('docsearch_pharmacy_prescriptions', JSON.stringify(existingRxList));
      } catch {}
    }

    return { ...consultation };
  }

  public async amendConsultation(req: AmendConsultationRequest): Promise<ConsultationDto> {
    const consultation = this.consultations.find((c) => c.tenantId === req.tenantId && c.id === req.consultationId);
    if (!consultation) {
      throw new Error('Clinical consultation record not found');
    }
    if (consultation.consultationStatus !== 'COMPLETED') {
      throw new Error('Only completed consultations can be amended');
    }

    const previousSnapshot = { ...consultation };
    consultation.version += 1;
    consultation.isAmended = true;
    consultation.amendmentReason = req.amendmentReason;
    if (req.amendedAssessment) consultation.clinicalAssessment = req.amendedAssessment;
    if (req.amendedPlan) consultation.treatmentPlan = req.amendedPlan;
    if (req.additionalNotes) {
      consultation.patientInstructions = consultation.patientInstructions
        ? `${consultation.patientInstructions}\n[Amendment v${consultation.version} Notes: ${req.additionalNotes}]`
        : `[Amendment v${consultation.version} Notes: ${req.additionalNotes}]`;
    }
    consultation.updatedBy = req.actorId;
    consultation.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      consultation.partnerId,
      consultation.organizationId,
      consultation.branchId,
      consultation.patientId,
      consultation.encounterId,
      consultation.id,
      req.actorId,
      req.actorRole,
      'CONSULTATION_AMENDED',
      'consultations',
      consultation.id,
      `Amended consultation v${consultation.version}: ${req.amendmentReason} - Justification: ${req.justification}`,
      previousSnapshot as unknown as Record<string, unknown>,
      consultation as unknown as Record<string, unknown>
    );

    return { ...consultation };
  }

  public async getAuditTraces(req: QueryConsultationAuditRequest): Promise<ConsultationAuditTraceDto[]> {
    return this.auditTraces.filter((a) => {
      if (a.tenantId !== req.tenantId) return false;
      if (req.consultationId && a.consultationId !== req.consultationId) return false;
      if (req.patientId && a.patientId !== req.patientId) return false;
      if (req.actorId && a.actorId !== req.actorId) return false;
      return true;
    });
  }
}

export const clinicalConsultationService = new ClinicalConsultationService();
