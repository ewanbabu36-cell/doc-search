import {
  clinicalWorkflowRepository,
  type CreatePatientInput,
  type CreateEncounterInput,
  type SaveConsultationInput,
  type CreateQueueTokenInput,
  type CreatePrescriptionInput,
  type ConsultationWorkflowResult,
  type StoredQueueToken,
  type StoredPrescription,
  type CreateAppointmentInput,
  type RecordEncounterVitalsInput,
  type CreateReferralInput,
  type CreateClinicalAlertInput,
  type CreateFollowUpInput
} from '../../repositories/partner/ClinicalWorkflowRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { prescriptionPdfGenerator } from './PrescriptionPdfGenerator.js';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { clinicalSafetyService } from './ClinicalSafetyService.js';

export class ClinicalWorkflowService {
  async searchPatients(
    session: SessionContext,
    query?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.searchPatients(
        scope.tenantId,
        query,
        tx,
        { branchId: scope.branchId, departmentId: scope.departmentId }
      );
    });
  }

  async createPatient(input: Omit<CreatePatientInput, 'tenantId'> & { tenantId?: string | undefined; departmentId?: string | undefined }, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const patient = await clinicalWorkflowRepository.createPatient({
        ...input,
        tenantId: scope.tenantId,
        ...(scope.branchId ? { branchId: scope.branchId } : {})
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'PATIENT_REGISTERED',
        resourceType: 'patient',
        resourceId: patient.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { mrn: patient.mrn, name: `${patient.firstName} ${patient.lastName}` }
      }, session, tx);

      return patient;
    });
  }

  async updatePatient(patientId: string, patch: Partial<CreatePatientInput>, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      branchId: patch.branchId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const updated = await clinicalWorkflowRepository.updatePatient(scope.tenantId, patientId, patch, tx);

      if (updated) {
        await auditRepository.recordEvent({
          eventType: 'PATIENT_UPDATED',
          resourceType: 'patient',
          resourceId: patientId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { mrn: updated.mrn, fields: Object.keys(patch) }
        }, session, tx);
      }

      return updated;
    });
  }

  async getEncounters(
    session: SessionContext,
    status?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getEncounters(
        scope.tenantId,
        status,
        tx,
        { branchId: scope.branchId, departmentId: scope.departmentId }
      );
    });
  }

  async checkInEncounter(input: Omit<CreateEncounterInput, 'tenantId'> & { tenantId?: string }, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const encounter = await clinicalWorkflowRepository.createEncounter({
        ...input,
        tenantId: scope.tenantId,
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {}),
        status: input.status || 'CHECKED_IN'
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'ENCOUNTER_CHECKIN',
        resourceType: 'encounter',
        resourceId: encounter.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
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

  async createQueueToken(input: Omit<CreateQueueTokenInput, 'tenantId'> & { tenantId?: string }, session: SessionContext): Promise<StoredQueueToken> {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const token = await clinicalWorkflowRepository.createQueueToken({
        ...input,
        tenantId: scope.tenantId,
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'QUEUE_TOKEN_ISSUED',
        resourceType: 'queue_token',
        resourceId: token.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { tokenNumber: token.tokenNumber, encounterId: token.encounterId }
      }, session, tx);

      return token;
    });
  }

  async getQueue(
    filters: { branchId?: string; departmentId?: string; tenantId?: string; doctorId?: string; queueDate?: string; queueStatus?: string },
    session: SessionContext
  ): Promise<StoredQueueToken[]> {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: filters?.tenantId,
      branchId: filters?.branchId,
      departmentId: filters?.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getQueue(
        scope.tenantId,
        {
          ...filters,
          ...(scope.branchId ? { branchId: scope.branchId } : {}),
          ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
        } as any,
        tx
      );
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

  async getConsultationById(consultationId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getConsultationById(session.tenantId, consultationId, tx);
    });
  }

  async getConsultationByEncounter(encounterId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getConsultationByEncounter(session.tenantId, encounterId, tx);
    });
  }

  async searchConsultations(
    filters: { doctorId?: string; patientId?: string; encounterId?: string; status?: string; searchTerm?: string },
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.searchConsultations(session.tenantId, filters, tx);
    });
  }

  async getConsultationOverview(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getConsultationOverview(session.tenantId, tx);
    });
  }

  async createPrescription(input: Omit<CreatePrescriptionInput, 'tenantId'>, session: SessionContext): Promise<StoredPrescription> {
    // 0. CDSS Prescribing Safety Verification & DDI Save Enforcement
    const items = input.items || [];
    if (items.length > 0) {
      const cdssInputMeds = items.map((item) => ({
        medicationName: item.medicationName || (item as any).medicineName || (item as any).brandName || 'Medication',
        dosage: item.dosage,
        frequency: item.frequency,
        duration: typeof item.duration === 'number' ? item.duration : undefined,
        durationUnit: item.durationUnit,
        strength: (item as any).strength
      }));

      const safetyEval = await clinicalSafetyService.evaluatePrescriptionSafety(session, {
        patientId: input.patientId,
        encounterId: input.encounterId,
        medications: cdssInputMeds,
        overrides: (input as any).overrides || (input as any).cdssOverrides
      });

      if (safetyEval.hasBlockingContraindication) {
        const blocking = safetyEval.alerts.find(
          (a) => a.severity === 'CONTRAINDICATED' || (!a.wasOverridden && a.severity === 'CRITICAL')
        );
        throw new AppError({
          message: `Clinical Safety Contraindication Alert: ${blocking?.title || 'Severe Contraindication'}. ${blocking?.clinicalConsequence || ''} Action required: ${blocking?.recommendedAction || ''}`,
          code: ErrorCode.BAD_REQUEST,
          statusCode: 422
        });
      }
    }

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

  async bridgeRadiologyOrders(encounterId: string, patientId: string, doctorId: string, imagingItems: any[], session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const orders = await clinicalWorkflowRepository.bridgeRadiologyOrders(
        session.tenantId,
        patientId,
        encounterId,
        doctorId,
        imagingItems,
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'RADIOLOGY_INVESTIGATIONS_ORDERED',
        resourceType: 'consultation',
        resourceId: encounterId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { patientId, count: orders.length }
      }, session, tx);

      return orders;
    });
  }

  async generateConsultationPdf(consultationId: string, session: SessionContext): Promise<Buffer> {
    const cons = await clinicalWorkflowRepository.getConsultationById(session.tenantId, consultationId);
    if (!cons) {
      throw AppError.notFound('Consultation not found or not accessible within tenant', ErrorCode.NOT_FOUND);
    }
    const patient = await clinicalWorkflowRepository.getPatientById(session.tenantId, cons.patientId);
    if (!patient) {
      throw AppError.notFound('Patient record not found or not accessible within tenant', ErrorCode.NOT_FOUND);
    }

    const pdfBuffer = prescriptionPdfGenerator.generatePrescriptionPdf({
      prescriptionNumber: `RX-${cons.consultationNumber.replace('CON-', '')}`,
      encounterNumber: cons.encounterId || 'ENC-OPD-001',
      hospitalName: 'Doc Search Multi-Specialty Hospital & Research Institute',
      facilityAddress: 'OPD Clinical Wing, Metro Medical Enclave, New Delhi - 110001',
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.mrn || 'MRN-RECORD',
      ageGender: patient.gender ? `${patient.gender}` : 'Not Specified',
      consultationDate: cons.createdAt ? new Date(cons.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
      doctorName: 'Dr. Rajesh Sharma, MD (Internal Medicine)',
      doctorSpecialty: 'Senior Consultant Physician & Diabetologist',
      doctorRegistrationNumber: 'DMC-58291 / MCI-2012',
      vitals: cons.vitals ? {
        bp: cons.vitals.systolicBp && cons.vitals.diastolicBp ? `${cons.vitals.systolicBp}/${cons.vitals.diastolicBp}` : undefined,
        pulse: cons.vitals.heartRateBpm ? `${cons.vitals.heartRateBpm}` : undefined,
        spo2: cons.vitals.oxygenSaturationPercent ? `${cons.vitals.oxygenSaturationPercent}%` : undefined,
        temp: cons.vitals.temperatureFahrenheit ? `${cons.vitals.temperatureFahrenheit} F` : undefined,
        bmi: cons.vitals.bmi ? `${cons.vitals.bmi}` : undefined
      } : undefined,
      diagnoses: cons.diagnoses && cons.diagnoses.length > 0 ? cons.diagnoses.map(d => ({
        code: d.diagnosisCode || d.code || '',
        name: d.diagnosisName || d.description || 'Diagnosis',
        isPrimary: Boolean(d.isPrimary)
      })) : [],
      medications: cons.medications && cons.medications.length > 0 ? cons.medications.map(m => ({
        name: m.genericName ? `${m.medicationName || m.drugName || 'Medication'} (${m.genericName})` : (m.medicationName || m.drugName || 'Medication'),
        strength: m.strength || '',
        dosage: m.dosage || 'As directed',
        frequency: m.frequency || 'As directed',
        duration: m.duration || m.durationDays ? `${m.duration || m.durationDays} ${m.durationUnit || 'days'}` : 'As directed',
        instructions: m.instructions || 'Follow physician directions'
      })) : [],
      labInvestigations: cons.labInvestigations || [],
      followUpAdvice: cons.followUpAdvice || undefined
    });

    await auditRepository.recordEvent({
      eventType: 'CONSULTATION_PRINTED',
      resourceType: 'consultation',
      resourceId: consultationId,
      tenantId: session.tenantId,
      branchId: session.branchId,
      metadata: {
        action: 'print',
        consultationNumber: cons.consultationNumber,
        patientId: cons.patientId
      }
    }, session);

    return pdfBuffer;
  }

  async generatePrescriptionPdf(prescriptionIdOrConsultationId: string, session: SessionContext): Promise<Buffer> {
    // 1. Try resolving as pharmacy prescription record
    const rx = await clinicalWorkflowRepository.getPrescriptionById(session.tenantId, prescriptionIdOrConsultationId);
    if (rx) {
      const patient = await clinicalWorkflowRepository.getPatientById(session.tenantId, rx.patientId);
      if (!patient) {
        throw AppError.notFound('Patient record not found for prescription', ErrorCode.NOT_FOUND);
      }
      const cons = rx.consultationId ? await clinicalWorkflowRepository.getConsultationById(session.tenantId, rx.consultationId) : null;

      const rxItemsList = (rx.items || []) as Array<Record<string, unknown>>;
      const consMedsList = (cons?.medications || []) as Array<Record<string, unknown>>;
      const hasRxMeds = rxItemsList.some(m => Boolean(m['medicationName'] || (m['metadata'] as Record<string, unknown> | undefined)?.['medicationName']));
      const sourceItems = (rxItemsList.length > 0 && hasRxMeds)
        ? rxItemsList
        : (consMedsList.length > 0 ? consMedsList : rxItemsList);

      const pdfBuffer = prescriptionPdfGenerator.generatePrescriptionPdf({
        prescriptionNumber: rx.prescriptionNumber || `RX-${rx.id.substring(0, 8)}`,
        encounterNumber: rx.encounterId || 'ENC-OPD-001',
        hospitalName: 'Doc Search Multi-Specialty Hospital & Research Institute',
        facilityAddress: 'OPD Clinical Wing, Metro Medical Enclave, New Delhi - 110001',
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientMrn: patient.mrn || 'MRN-RECORD',
        ageGender: patient.gender ? `${patient.gender}` : 'Not Specified',
        consultationDate: rx.createdAt ? new Date(rx.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
        doctorName: 'Dr. Rajesh Sharma, MD (Internal Medicine)',
        doctorSpecialty: 'Senior Consultant Physician & Diabetologist',
        doctorRegistrationNumber: 'DMC-58291 / MCI-2012',
        vitals: cons?.vitals ? {
          bp: cons.vitals.systolicBp && cons.vitals.diastolicBp ? `${cons.vitals.systolicBp}/${cons.vitals.diastolicBp}` : undefined,
          pulse: cons.vitals.heartRateBpm ? `${cons.vitals.heartRateBpm}` : undefined,
          spo2: cons.vitals.oxygenSaturationPercent ? `${cons.vitals.oxygenSaturationPercent}%` : undefined,
          temp: cons.vitals.temperatureFahrenheit ? `${cons.vitals.temperatureFahrenheit} F` : undefined,
          bmi: cons.vitals.bmi ? `${cons.vitals.bmi}` : undefined
        } : undefined,
        diagnoses: cons?.diagnoses && cons.diagnoses.length > 0 ? cons.diagnoses.map(d => ({
          code: d.diagnosisCode || d.code || '',
          name: d.diagnosisName || d.description || 'Diagnosis',
          isPrimary: Boolean(d.isPrimary)
        })) : [],
        medications: sourceItems.map(m => {
          const meta = m['metadata'] as Record<string, unknown> | undefined;
          const rawName = (m['medicationName'] as string | undefined) || (m['drugName'] as string | undefined) || (meta?.['medicationName'] as string | undefined) || 'Medication';
          const generic = (m['genericName'] as string | undefined) || (meta?.['genericName'] as string | undefined);
          const durationVal = m['duration'] || m['durationDays'];
          const durationUnitVal = (m['durationUnit'] as string | undefined) || 'days';
          return {
            name: generic && generic !== rawName ? `${rawName} (${generic})` : rawName,
            strength: (m['strength'] as string | undefined) || (meta?.['strength'] as string | undefined) || '',
            dosage: (m['dosage'] as string | undefined) || 'As directed',
            frequency: (m['frequency'] as string | undefined) || 'As directed',
            duration: durationVal ? `${durationVal} ${durationUnitVal}` : 'As directed',
            instructions: (m['instructions'] as string | undefined) || 'Follow physician directions'
          };
        }),
        labInvestigations: cons?.labInvestigations || [],
        followUpAdvice: cons?.followUpAdvice || rx.notes || undefined
      });

      await auditRepository.recordEvent({
        eventType: 'PRESCRIPTION_PRINTED',
        resourceType: 'prescription',
        resourceId: rx.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          action: 'print',
          prescriptionNumber: rx.prescriptionNumber,
          patientId: rx.patientId
        }
      }, session);

      return pdfBuffer;
    }

    // 2. Fallback: try resolving as consultation ID
    return this.generateConsultationPdf(prescriptionIdOrConsultationId, session);
  }

  async getPatientClinicalHistory(patientId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async () => {
      return clinicalWorkflowRepository.getPatientClinicalHistory(session.tenantId, patientId);
    });
  }

  async getExitHubPatients(session: SessionContext, search?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getExitHubPatients(session.tenantId, search, tx);
    });
  }

  async checkoutEncounter(
    encounterId: string,
    options: { forceDischarge?: boolean | undefined; overrideReason?: string | undefined; notes?: string | undefined },
    session: SessionContext
  ) {
    if (options.forceDischarge) {
      const allowedRoles = ['HOSPITAL_ADMIN', 'SUPERVISOR', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'MEDICAL_DIRECTOR'];
      const userRoles = session.roles || [];
      const hasRole = userRoles.some((r) => allowedRoles.includes(r));
      if (!hasRole && !session.isSuperAdmin) {
        throw new AppError({
          message: 'Administrative override (forceDischarge) requires HOSPITAL_ADMIN, SUPERVISOR, or MEDICAL_DIRECTOR privileges.',
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
    }

    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await clinicalWorkflowRepository.checkoutEncounter(session.tenantId, encounterId, options, tx);

      await auditRepository.recordEvent({
        eventType: 'PATIENT_DISCHARGED',
        resourceType: 'encounter',
        resourceId: encounterId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          encounterId,
          status: 'DISCHARGED',
          forceDischarge: options.forceDischarge,
          overrideReason: options.overrideReason
        }
      }, session, tx);

      return result;
    });
  }

  // =========================================================================
  // OPD CORE METHODS: APPOINTMENT, VITALS, PAYMENT, REFERRAL, CDSS, WORKSPACE
  // =========================================================================

  async createAppointment(
    input: Omit<CreateAppointmentInput, 'tenantId'> & { tenantId?: string; branchId?: string; departmentId?: string },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      ...(input.branchId ? { branchId: input.branchId } : {}),
      ...(input.departmentId ? { departmentId: input.departmentId } : {})
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const apt = await clinicalWorkflowRepository.createAppointment(
        {
          ...input,
          tenantId: scope.tenantId,
          ...(scope.branchId ? { branchId: scope.branchId } : {}),
          ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
        },
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'APPOINTMENT_SCHEDULED',
        resourceType: 'appointment',
        resourceId: apt.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: {
          patientId: apt.patientId,
          doctorId: apt.doctorId,
          slotTime: apt.slotTime,
          appointmentType: apt.appointmentType
        }
      }, session, tx);

      return apt;
    });
  }

  async getAppointments(
    session: SessionContext,
    filters: { doctorId?: string; patientId?: string; startDate?: string; endDate?: string; status?: string; branchId?: string; departmentId?: string }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {})
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getAppointments(
        scope.tenantId,
        {
          ...filters,
          ...(scope.branchId ? { branchId: scope.branchId } : {}),
          ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
        },
        tx
      );
    });
  }

  async getAppointmentById(appointmentId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const apt = await clinicalWorkflowRepository.getAppointmentById(session.tenantId, appointmentId, tx);
      if (!apt) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Appointment '${appointmentId}' not found in tenant scope.`,
          statusCode: 404
        });
      }
      return apt;
    });
  }

  async rescheduleAppointment(appointmentId: string, newSlotTime: string | Date, session: SessionContext, reason?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const apt = await clinicalWorkflowRepository.rescheduleAppointment(session.tenantId, appointmentId, newSlotTime, reason, tx);
      await auditRepository.recordEvent({
        eventType: 'APPOINTMENT_RESCHEDULED',
        resourceType: 'appointment',
        resourceId: apt.id,
        tenantId: session.tenantId,
        branchId: apt.branchId || session.branchId,
        metadata: {
          appointmentId: apt.id,
          newSlotTime: apt.slotTime,
          reason
        }
      }, session, tx);
      return apt;
    });
  }

  async cancelAppointment(appointmentId: string, reason: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const apt = await clinicalWorkflowRepository.cancelAppointment(session.tenantId, appointmentId, reason, tx);
      await auditRepository.recordEvent({
        eventType: 'APPOINTMENT_CANCELLED',
        resourceType: 'appointment',
        resourceId: apt.id,
        tenantId: session.tenantId,
        branchId: apt.branchId || session.branchId,
        metadata: { appointmentId: apt.id, cancellationReason: reason }
      }, session, tx);
      return apt;
    });
  }

  async checkInAppointment(appointmentId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await clinicalWorkflowRepository.checkInAppointment(session.tenantId, appointmentId, tx);
      await auditRepository.recordEvent({
        eventType: 'APPOINTMENT_CHECKED_IN',
        resourceType: 'appointment',
        resourceId: appointmentId,
        tenantId: session.tenantId,
        branchId: result.encounter.branchId || session.branchId,
        metadata: {
          appointmentId,
          encounterId: result.encounter.id,
          encounterNumber: result.encounter.encounterNumber
        }
      }, session, tx);
      return result;
    });
  }

  async recordEncounterVitals(
    encounterId: string,
    input: Omit<RecordEncounterVitalsInput, 'encounterId'>,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await clinicalWorkflowRepository.recordEncounterVitals(
        session.tenantId,
        encounterId,
        {
          ...input,
          recordedBy: input.recordedBy || session.userId || 'Nurse Station'
        },
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'VITALS_RECORDED',
        resourceType: 'encounter',
        resourceId: encounterId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          encounterId,
          vitalsId: result.vitals.id,
          alertCreated: result.alertCreated
        }
      }, session, tx);

      return result;
    });
  }

  async getEncounterVitals(encounterId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getEncounterVitals(session.tenantId, encounterId, tx);
    });
  }

  async createOpdPayment(
    encounterId: string,
    input: { amount: number; paymentMethod?: string; notes?: string; collectedBy?: string },
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await clinicalWorkflowRepository.createOpdPayment(
        session.tenantId,
        encounterId,
        {
          ...input,
          collectedBy: input.collectedBy || session.userId || 'OPD Cashier'
        },
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'OPD_PAYMENT_COLLECTED',
        resourceType: 'invoice',
        resourceId: result.invoiceId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          encounterId,
          invoiceNumber: result.invoiceNumber,
          paymentNumber: result.paymentNumber,
          amount: result.amount
        }
      }, session, tx);

      return result;
    });
  }

  async getOpdInvoice(invoiceId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getOpdInvoice(session.tenantId, invoiceId, tx);
    });
  }

  async createReferral(
    input: Omit<CreateReferralInput, 'tenantId'>,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const referral = await clinicalWorkflowRepository.createReferral(
        {
          ...input,
          tenantId: session.tenantId
        },
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'REFERRAL_CREATED',
        resourceType: 'referral',
        resourceId: referral.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          patientId: referral.patientId,
          referralType: referral.referralType,
          destinationDepartmentId: referral.destinationDepartmentId
        }
      }, session, tx);

      return referral;
    });
  }

  async getReferrals(
    session: SessionContext,
    filters: { patientId?: string; encounterId?: string; status?: string }
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getReferrals(session.tenantId, filters, tx);
    });
  }

  async updateReferralStatus(
    referralId: string,
    status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED',
    session: SessionContext,
    notes?: string
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const referral = await clinicalWorkflowRepository.updateReferralStatus(session.tenantId, referralId, status, notes, tx);
      await auditRepository.recordEvent({
        eventType: 'REFERRAL_STATUS_UPDATED',
        resourceType: 'referral',
        resourceId: referralId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { referralId, status, notes }
      }, session, tx);
      return referral;
    });
  }

  async createClinicalAlert(
    input: CreateClinicalAlertInput,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const effectiveBranchId = input.branchId || session.branchId;
      const { branchId: _unusedBranchId, ...cleanInput } = input;
      const alert = await clinicalWorkflowRepository.createClinicalAlert(
        session.tenantId,
        {
          ...cleanInput,
          tenantId: session.tenantId,
          ...(effectiveBranchId ? { branchId: effectiveBranchId } : {})
        },
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'CLINICAL_ALERT_CREATED',
        resourceType: 'clinical_alert',
        resourceId: alert.id,
        tenantId: session.tenantId,
        branchId: alert.branchId || session.branchId,
        metadata: {
          patientMrn: alert.patientMrn,
          urgencyLevel: alert.urgencyLevel,
          category: alert.category
        }
      }, session, tx);

      return alert;
    });
  }

  async getPatientClinicalAlerts(patientMrn: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getPatientClinicalAlerts(session.tenantId, patientMrn, tx);
    });
  }

  async acknowledgeClinicalAlert(alertId: string, doctorName: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const alert = await clinicalWorkflowRepository.acknowledgeClinicalAlert(session.tenantId, alertId, doctorName, tx);
      await auditRepository.recordEvent({
        eventType: 'CLINICAL_ALERT_ACKNOWLEDGED',
        resourceType: 'clinical_alert',
        resourceId: alertId,
        tenantId: session.tenantId,
        branchId: alert.branchId || session.branchId,
        metadata: { alertId, doctorName }
      }, session, tx);
      return alert;
    });
  }

  async getPatientAllergies(patientId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getPatientAllergies(session.tenantId, patientId, tx);
    });
  }

  async recordPatientAllergy(
    patientId: string,
    input: {
      allergen: string;
      allergenType?: string;
      severity?: string;
      reaction?: string;
      recordedBy?: string;
      notes?: string;
    },
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const allergy = await clinicalWorkflowRepository.recordPatientAllergy(
        session.tenantId,
        patientId,
        {
          ...input,
          recordedBy: input.recordedBy || (session as any).userName || session.userId || 'Attending Staff'
        },
        tx
      );
      await auditRepository.recordEvent({
        eventType: 'PATIENT_ALLERGY_RECORDED',
        resourceType: 'patient_allergy',
        resourceId: allergy.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          patientId,
          allergen: allergy.allergen,
          severity: allergy.severity
        }
      }, session, tx);
      return allergy;
    });
  }

  async updatePatientAllergyStatus(
    patientId: string,
    allergyId: string,
    status: 'ACTIVE' | 'RESOLVED' | 'INACTIVE',
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const updated = await clinicalWorkflowRepository.updatePatientAllergyStatus(
        session.tenantId,
        patientId,
        allergyId,
        status,
        tx
      );
      await auditRepository.recordEvent({
        eventType: 'PATIENT_ALLERGY_STATUS_UPDATED',
        resourceType: 'patient_allergy',
        resourceId: allergyId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { patientId, allergyId, status }
      }, session, tx);
      return updated;
    });
  }

  async createFollowUp(
    input: Omit<CreateFollowUpInput, 'tenantId'>,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const followUp = await clinicalWorkflowRepository.createFollowUp(
        {
          ...input,
          tenantId: session.tenantId
        },
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'FOLLOW_UP_RECOMMENDED',
        resourceType: 'follow_up',
        resourceId: followUp.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          patientId: followUp.patientId,
          recommendedDate: followUp.recommendedDate,
          reason: followUp.reason
        }
      }, session, tx);

      return followUp;
    });
  }

  async getFollowUps(session: SessionContext, filters: { patientId?: string; doctorId?: string }) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getFollowUps(session.tenantId, filters, tx);
    });
  }

  async convertFollowUpToAppointment(
    followUpId: string,
    slotDetails: { doctorId?: string; slotTime: string | Date; departmentId?: string },
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await clinicalWorkflowRepository.convertFollowUpToAppointment(
        session.tenantId,
        followUpId,
        slotDetails,
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'FOLLOW_UP_CONVERTED_TO_APPOINTMENT',
        resourceType: 'appointment',
        resourceId: result.appointment.id,
        tenantId: session.tenantId,
        branchId: result.appointment.branchId || session.branchId,
        metadata: {
          followUpId,
          appointmentId: result.appointment.id,
          slotTime: result.appointment.slotTime
        }
      }, session, tx);

      return result;
    });
  }

  async finalizePrescription(prescriptionId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const rx = await clinicalWorkflowRepository.finalizePrescription(session.tenantId, prescriptionId, tx);
      await auditRepository.recordEvent({
        eventType: 'PRESCRIPTION_FINALIZED',
        resourceType: 'prescription',
        resourceId: prescriptionId,
        tenantId: session.tenantId,
        branchId: rx.branchId || session.branchId,
        metadata: {
          prescriptionId,
          prescriptionNumber: rx.prescriptionNumber
        }
      }, session, tx);
      return rx;
    });
  }

  async getDoctorOpdWorkspace(doctorId: string, session: SessionContext, branchId?: string) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      ...(branchId || session.branchId ? { branchId: branchId || session.branchId } : {})
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return clinicalWorkflowRepository.getDoctorOpdWorkspace(
        scope.tenantId,
        doctorId,
        scope.branchId,
        tx
      );
    });
  }
}

export const clinicalWorkflowService = new ClinicalWorkflowService();
