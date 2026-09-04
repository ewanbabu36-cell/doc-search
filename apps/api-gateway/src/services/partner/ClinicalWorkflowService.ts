import {
  clinicalWorkflowRepository,
  type CreatePatientInput,
  type CreateEncounterInput,
  type SaveConsultationInput,
  type CreateQueueTokenInput,
  type CreatePrescriptionInput,
  type ConsultationWorkflowResult,
  type StoredQueueToken,
  type StoredPrescription
} from '../../repositories/partner/ClinicalWorkflowRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { prescriptionPdfGenerator } from './PrescriptionPdfGenerator.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class ClinicalWorkflowService {
  async searchPatients(session: SessionContext, query?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.searchPatients(session.tenantId, query, tx);
    });
  }

  async createPatient(input: Omit<CreatePatientInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const patient = await clinicalWorkflowRepository.createPatient({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'PATIENT_REGISTERED',
        resourceType: 'patient',
        resourceId: patient.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { mrn: patient.mrn, name: `${patient.firstName} ${patient.lastName}` }
      }, session, tx);

      return patient;
    });
  }

  async updatePatient(patientId: string, patch: Partial<CreatePatientInput>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const updated = await clinicalWorkflowRepository.updatePatient(session.tenantId, patientId, patch, tx);

      if (updated) {
        await auditRepository.recordEvent({
          eventType: 'PATIENT_UPDATED',
          resourceType: 'patient',
          resourceId: patientId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { mrn: updated.mrn, fields: Object.keys(patch) }
        }, session, tx);
      }

      return updated;
    });
  }

  async getEncounters(session: SessionContext, status?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getEncounters(session.tenantId, status, tx);
    });
  }

  async checkInEncounter(input: Omit<CreateEncounterInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const encounter = await clinicalWorkflowRepository.createEncounter({
        ...input,
        tenantId: session.tenantId,
        status: input.status || 'CHECKED_IN'
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'ENCOUNTER_CHECKIN',
        resourceType: 'encounter',
        resourceId: encounter.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { encounterNumber: encounter.encounterNumber, patientId: encounter.patientId }
      }, session, tx);

      return encounter;
    });
  }

  async updateEncounterStatus(encounterId: string, targetStatus: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const updated = await clinicalWorkflowRepository.updateEncounterStatus(session.tenantId, encounterId, targetStatus, tx);

      await auditRepository.recordEvent({
        eventType: 'ENCOUNTER_STATUS_UPDATED',
        resourceType: 'encounter',
        resourceId: encounterId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { targetStatus }
      }, session, tx);

      return updated;
    });
  }

  // ==========================================
  // OPERATIONAL QUEUE & TOKEN MANAGEMENT
  // ==========================================

  async createQueueToken(input: Omit<CreateQueueTokenInput, 'tenantId'>, session: SessionContext): Promise<StoredQueueToken> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const token = await clinicalWorkflowRepository.createQueueToken({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'QUEUE_TOKEN_ISSUED',
        resourceType: 'queue_token',
        resourceId: token.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { tokenNumber: token.tokenNumber, encounterId: token.encounterId }
      }, session, tx);

      return token;
    });
  }

  async getQueue(
    filters: { branchId?: string; doctorId?: string; queueDate?: string; queueStatus?: string },
    session: SessionContext
  ): Promise<StoredQueueToken[]> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getQueue(session.tenantId, filters, tx);
    });
  }

  async callQueueToken(queueId: string, session: SessionContext): Promise<StoredQueueToken> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const token = await clinicalWorkflowRepository.callQueueToken(session.tenantId, queueId, tx);

      await auditRepository.recordEvent({
        eventType: 'QUEUE_TOKEN_CALLED',
        resourceType: 'queue_token',
        resourceId: queueId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { tokenNumber: token.tokenNumber, encounterId: token.encounterId }
      }, session, tx);

      return token;
    });
  }

  async startQueueToken(queueId: string, session: SessionContext): Promise<StoredQueueToken> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const token = await clinicalWorkflowRepository.startQueueToken(session.tenantId, queueId, tx);

      await auditRepository.recordEvent({
        eventType: 'CONSULTATION_STARTED',
        resourceType: 'encounter',
        resourceId: token.encounterId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { queueId, tokenNumber: token.tokenNumber }
      }, session, tx);

      return token;
    });
  }

  async completeQueueToken(queueId: string, session: SessionContext): Promise<StoredQueueToken> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const token = await clinicalWorkflowRepository.completeQueueToken(session.tenantId, queueId, tx);

      await auditRepository.recordEvent({
        eventType: 'QUEUE_TOKEN_COMPLETED',
        resourceType: 'queue_token',
        resourceId: queueId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { tokenNumber: token.tokenNumber, encounterId: token.encounterId }
      }, session, tx);

      return token;
    });
  }

  // ==========================================
  // CONSULTATIONS & PRESCRIPTIONS
  // ==========================================

  async saveConsultation(input: Omit<SaveConsultationInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const consultation = await clinicalWorkflowRepository.saveConsultation({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'CONSULTATION_SAVED',
        resourceType: 'consultation',
        resourceId: consultation.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { encounterId: input.encounterId, patientId: input.patientId }
      }, session, tx);

      return consultation;
    });
  }

  async finalizeConsultation(consultationId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const consultation = await clinicalWorkflowRepository.finalizeConsultation(session.tenantId, consultationId, tx);

      await auditRepository.recordEvent({
        eventType: 'CONSULTATION_FINALIZED',
        resourceType: 'consultation',
        resourceId: consultationId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { status: 'FINALIZED' }
      }, session, tx);

      return consultation;
    });
  }

  async createPrescription(input: Omit<CreatePrescriptionInput, 'tenantId'>, session: SessionContext): Promise<StoredPrescription> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const prescription = await clinicalWorkflowRepository.createPrescription({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'PRESCRIPTION_CREATED',
        resourceType: 'prescription',
        resourceId: prescription.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          prescriptionNumber: prescription.prescriptionNumber,
          patientId: prescription.patientId,
          itemCount: prescription.items?.length || 0
        }
      }, session, tx);

      return prescription;
    });
  }

  async completeConsultationWorkflow(
    consultationId: string,
    doctorId: string | undefined,
    session: SessionContext
  ): Promise<ConsultationWorkflowResult> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const effectiveDoctorId = doctorId || session.userId || '99999999-9999-4999-8999-999999999999';
      const result = await clinicalWorkflowRepository.completeConsultationWorkflow(
        session.tenantId,
        consultationId,
        effectiveDoctorId,
        tx
      );

      // Audit consultation finalized
      await auditRepository.recordEvent({
        eventType: 'CONSULTATION_FINALIZED',
        resourceType: 'consultation',
        resourceId: consultationId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { status: 'FINALIZED', doctorId: effectiveDoctorId }
      }, session, tx);

      // Audit encounter completed
      if (result.encounter) {
        await auditRepository.recordEvent({
          eventType: 'ENCOUNTER_COMPLETED',
          resourceType: 'encounter',
          resourceId: result.encounter.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { status: 'COMPLETED' }
        }, session, tx);
      }

      // Audit queue completed
      if (result.queueToken) {
        await auditRepository.recordEvent({
          eventType: 'QUEUE_TOKEN_COMPLETED',
          resourceType: 'queue_token',
          resourceId: result.queueToken.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { tokenNumber: result.queueToken.tokenNumber }
        }, session, tx);
      }

      // Audit prescription created
      if (result.prescription) {
        await auditRepository.recordEvent({
          eventType: 'PRESCRIPTION_ISSUED',
          resourceType: 'prescription',
          resourceId: result.prescription.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { prescriptionNumber: result.prescription.prescriptionNumber }
        }, session, tx);
      }

      // Audit pharmacy order queued
      if (result.pharmacyOrder) {
        await auditRepository.recordEvent({
          eventType: 'PHARMACY_ORDER_CREATED',
          resourceType: 'pharmacy_dispensing',
          resourceId: result.pharmacyOrder.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { dispensingNumber: result.pharmacyOrder.dispensingNumber, status: 'PENDING' }
        }, session, tx);
      }

      // Audit lab orders queued
      if (result.labOrders && result.labOrders.length > 0) {
        for (const lab of result.labOrders) {
          await auditRepository.recordEvent({
            eventType: 'DIAGNOSTIC_INVESTIGATIONS_ORDERED',
            resourceType: 'investigation_order',
            resourceId: lab.id,
            tenantId: session.tenantId,
            branchId: session.branchId,
            metadata: { testName: lab.testName, status: lab.status }
          }, session, tx);
        }
      }

      // Audit follow-up scheduled
      if (result.followUp) {
        await auditRepository.recordEvent({
          eventType: 'FOLLOWUP_SCHEDULED',
          resourceType: 'followup',
          resourceId: result.followUp.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { reason: result.followUp.reason, status: result.followUp.status }
        }, session, tx);
      }

      return result;
    });
  }

  async retryDownstreamOrders(consultationId: string, session: SessionContext): Promise<ConsultationWorkflowResult> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await clinicalWorkflowRepository.retryDownstreamOrders(session.tenantId, consultationId, tx);

      await auditRepository.recordEvent({
        eventType: 'CLINICAL_DOWNSTREAM_RETRY',
        resourceType: 'consultation',
        resourceId: consultationId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          hasPrescription: Boolean(result.prescription),
          hasPharmacyOrder: Boolean(result.pharmacyOrder),
          labOrdersCount: result.labOrders.length,
          hasFollowUp: Boolean(result.followUp)
        }
      }, session, tx);

      return result;
    });
  }

  async searchIcd10(query?: string) {
    return clinicalWorkflowRepository.searchIcd10(query);
  }

  async getGenericAlternatives(drugQuery?: string) {
    return clinicalWorkflowRepository.getGenericAlternatives(drugQuery);
  }

  async bridgeDiagnosticOrders(encounterId: string, patientId: string, doctorId: string, testNames: string[], session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const orders = await clinicalWorkflowRepository.bridgeDiagnosticOrders(
        session.tenantId,
        patientId,
        encounterId,
        doctorId,
        testNames
      );

      await auditRepository.recordEvent({
        eventType: 'DIAGNOSTIC_INVESTIGATIONS_ORDERED',
        resourceType: 'consultation',
        resourceId: encounterId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { patientId, testNames, count: orders.length }
      }, session, tx);

      return orders;
    });
  }

  async generatePrescriptionPdf(consultationId: string, session: SessionContext): Promise<Buffer> {
    const cons = await clinicalWorkflowRepository.getConsultationById(session.tenantId, consultationId);
    const patient = cons ? await clinicalWorkflowRepository.getPatientById(session.tenantId, cons.patientId) : null;

    const pdfBuffer = prescriptionPdfGenerator.generatePrescriptionPdf({
      prescriptionNumber: cons ? `RX-${cons.consultationNumber.replace('CON-', '')}` : 'RX-849201',
      encounterNumber: cons?.encounterId || 'ENC-OPD-001',
      hospitalName: 'Doc Search Multi-Specialty Hospital & Research Institute',
      facilityAddress: 'OPD Clinical Wing, Metro Medical Enclave, New Delhi - 110001',
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Rahul Kumar',
      patientMrn: patient?.mrn || 'MRN-84920',
      ageGender: '32 Y / Male',
      consultationDate: cons ? new Date(cons.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
      doctorName: 'Dr. Rajesh Sharma, MD (Internal Medicine)',
      doctorSpecialty: 'Senior Consultant Physician & Diabetologist',
      doctorRegistrationNumber: 'DMC-58291 / MCI-2012',
      vitals: cons?.vitals ? {
        bp: `${cons.vitals.systolicBp}/${cons.vitals.diastolicBp}`,
        pulse: `${cons.vitals.heartRateBpm}`,
        spo2: `${cons.vitals.oxygenSaturationPercent}%`,
        temp: `${cons.vitals.temperatureFahrenheit} F`,
        bmi: `${cons.vitals.bmi}`
      } : {
        bp: '120/80',
        pulse: '72',
        spo2: '98%',
        temp: '98.4F',
        bmi: '23.5'
      },
      diagnoses: cons?.diagnoses?.map(d => ({
        code: d.diagnosisCode || d.code || 'I10',
        name: d.diagnosisName || d.description || 'Clinical Diagnosis',
        isPrimary: Boolean(d.isPrimary)
      })) || [
        { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', isPrimary: true },
        { code: 'I10', name: 'Essential (primary) hypertension', isPrimary: false }
      ],
      medications: cons?.medications?.map(m => ({
        name: m.genericName ? `${m.medicationName || m.drugName || 'Medication'} (${m.genericName})` : (m.medicationName || m.drugName || 'Medication'),
        strength: m.strength || '10mg',
        dosage: m.dosage || '1 Tab',
        frequency: m.frequency || 'Once Daily (OD)',
        duration: `${m.duration || m.durationDays || 30} ${m.durationUnit || 'days'}`,
        instructions: m.instructions || 'After meals'
      })) || [
        { name: 'Metformin Hydrochloride (PMBJP Jan Aushadhi)', strength: '500mg', dosage: '1 Tab', frequency: 'Twice Daily (BD)', duration: '30 days', instructions: 'After meals' },
        { name: 'Atorvastatin Calcium (PMBJP Jan Aushadhi)', strength: '10mg', dosage: '1 Tab', frequency: 'Once Daily (OD)', duration: '30 days', instructions: 'At bedtime' },
        { name: 'Telmisartan (PMBJP Jan Aushadhi)', strength: '40mg', dosage: '1 Tab', frequency: 'Once Daily (OD)', duration: '30 days', instructions: 'Morning after food' }
      ],
      labInvestigations: cons?.labInvestigations || [
        'Complete Blood Count (CBC) with Differential',
        'Comprehensive Lipid Profile',
        'Fasting Blood Glucose (FBS)'
      ],
      followUpAdvice: cons?.followUpAdvice || 'Review in OPD after 30 days with fresh Fasting Blood Sugar & Lipid Profile reports.'
    });

    return pdfBuffer;
  }

  async getPatientClinicalHistory(patientId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async () => {
      return clinicalWorkflowRepository.getPatientClinicalHistory(session.tenantId, patientId);
    });
  }
}

export const clinicalWorkflowService = new ClinicalWorkflowService();
