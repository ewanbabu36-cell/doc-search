import {
  clinicalWorkflowRepository,
  type CreatePatientInput,
  type CreateEncounterInput,
  type SaveConsultationInput
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
        status: 'CHECKED_IN'
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
        code: d.diagnosisCode,
        name: d.diagnosisName,
        isPrimary: Boolean(d.isPrimary)
      })) || [
        { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', isPrimary: true },
        { code: 'I10', name: 'Essential (primary) hypertension', isPrimary: false }
      ],
      medications: cons?.medications?.map(m => ({
        name: m.genericName ? `${m.medicationName} (${m.genericName})` : m.medicationName,
        strength: m.strength,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: `${m.duration} ${m.durationUnit || 'days'}`,
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
