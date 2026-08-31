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
  PatientDto,
  PatientDuplicateCandidateDto,
  PatientMergeEventDto,
  PatientRegistrationAuditTraceDto,
  PatientRegistrationOverviewDto,
  PatientDuplicateCheckResultDto,
  PatientIdentifierDto,
  EmergencyContactDto,
  PatientConsentDto,
  PatientInsurancePolicyDto,
  CreatePatientRequest,
  UpdatePatientRequest,
  AddPatientIdentifierRequest,
  UpdatePatientContactRequest,
  UpdatePatientAddressRequest,
  AddEmergencyContactRequest,
  AddPatientConsentRequest,
  AddPatientInsuranceRequest,
  SearchPatientRequest,
  CheckDuplicatePatientRequest,
  ReviewDuplicatePatientRequest,
  MergePatientRequest,
  QueryPatientAuditRequest
} from '@docsearch/api-contracts';
import { MOCK_TENANT_ID } from './mock-partner-foundation-data.js';
import {
  MOCK_PATIENTS,
  MOCK_PATIENT_DUPLICATE_CANDIDATES,
  MOCK_PATIENT_MERGE_EVENTS,
  MOCK_PATIENT_REGISTRATION_AUDIT_TRACES,
  MOCK_PATIENT_REGISTRATION_OVERVIEW
} from './mock-patient-registration-data.js';

export interface IPatientRegistrationService {
  getOverview(tenantId: string, partnerId?: string, organizationId?: string, branchId?: string): Promise<PatientRegistrationOverviewDto>;
  searchPatients(req: SearchPatientRequest): Promise<PatientDto[]>;
  getPatientById(tenantId: string, patientId: string): Promise<PatientDto | null>;
  checkDuplicate(req: CheckDuplicatePatientRequest): Promise<PatientDuplicateCheckResultDto>;
  createPatient(req: CreatePatientRequest): Promise<PatientDto>;
  updatePatient(req: UpdatePatientRequest): Promise<PatientDto>;
  addIdentifier(req: AddPatientIdentifierRequest): Promise<PatientIdentifierDto>;
  updateContact(req: UpdatePatientContactRequest): Promise<PatientDto>;
  updateAddress(req: UpdatePatientAddressRequest): Promise<PatientDto>;
  addEmergencyContact(req: AddEmergencyContactRequest): Promise<EmergencyContactDto>;
  addConsent(req: AddPatientConsentRequest): Promise<PatientConsentDto>;
  addInsurance(req: AddPatientInsuranceRequest): Promise<PatientInsurancePolicyDto>;
  getDuplicateCandidates(tenantId: string, organizationId?: string): Promise<PatientDuplicateCandidateDto[]>;
  reviewDuplicateCandidate(req: ReviewDuplicatePatientRequest): Promise<PatientDuplicateCandidateDto>;
  mergePatients(req: MergePatientRequest): Promise<PatientMergeEventDto>;
  getMergeHistory(tenantId: string, organizationId?: string): Promise<PatientMergeEventDto[]>;
  getAuditTraces(req: QueryPatientAuditRequest): Promise<PatientRegistrationAuditTraceDto[]>;
}

export class PatientRegistrationService implements IPatientRegistrationService {
  private patients: PatientDto[] = loadStored("docsearch_patients", MOCK_PATIENTS);
  private duplicateCandidates: PatientDuplicateCandidateDto[] = [...MOCK_PATIENT_DUPLICATE_CANDIDATES];
  private mergeEvents: PatientMergeEventDto[] = [...MOCK_PATIENT_MERGE_EVENTS];
  private auditTraces: PatientRegistrationAuditTraceDto[] = [...MOCK_PATIENT_REGISTRATION_AUDIT_TRACES];
  private nextMrnCounter = 5;

  private generateMrn(_organizationId: string): string {
    const padded = String(this.nextMrnCounter++).padStart(6, '0');
    return `DS-ORG001-${padded}`;
  }

  private addAudit(
    tenantId: string,
    partnerId: string,
    organizationId: string | undefined,
    branchId: string | undefined,
    patientId: string | undefined,
    actorId: string,
    actorRole: string,
    action: string,
    targetEntity: string,
    targetEntityId: string,
    justification: string,
    operationStatus: 'SUCCESS' | 'FAILURE' | 'DENIED' = 'SUCCESS'
  ) {
    const trace: PatientRegistrationAuditTraceDto = {
      id: crypto.randomUUID(),
      traceId: `pat-tr-${Math.floor(3000 + Math.random() * 7000)}`,
      tenantId,
      partnerId,
      organizationId,
      branchId,
      patientId,
      actorId,
      actorRole,
      action,
      targetEntity,
      targetEntityId,
      justification,
      operationStatus,
      correlationId: `corr-pat-${Date.now()}`,
      metadata: {},
      occurredAt: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverview(
    tenantId: string,
    partnerId?: string,
    organizationId?: string,
    branchId?: string
  ): Promise<PatientRegistrationOverviewDto> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }

    const filteredPatients = this.patients.filter((p) => {
      if (partnerId && p.partnerId !== partnerId) return false;
      if (organizationId && p.organizationId !== organizationId) return false;
      if (branchId && p.branchId !== branchId) return false;
      return true;
    });

    return {
      ...MOCK_PATIENT_REGISTRATION_OVERVIEW,
      totalPatientsCount: filteredPatients.length,
      activePatientsCount: filteredPatients.filter((p) => p.status === 'ACTIVE').length,
      pendingDuplicateReviewsCount: this.duplicateCandidates.filter((c) => c.reviewStatus === 'PENDING_REVIEW').length,
      mergedRecordsCount: this.mergeEvents.length,
      insuredPatientsCount: filteredPatients.filter((p) => p.insurancePolicies.length > 0).length,
      activeConsentsCount: filteredPatients.reduce(
        (sum, p) => sum + p.consents.filter((c) => c.consentStatus === 'GRANTED').length,
        0
      )
    };
  }

  async searchPatients(req: SearchPatientRequest): Promise<PatientDto[]> {
    try {
      const q = req.query ? `?q=${encodeURIComponent(req.query)}` : '';
      const res = await apiRequest<PatientDto[]>(`/api/v1/partner/patients${q}`);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback to local
    }
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${req.tenantId}`);
    }

    return this.patients.filter((p) => {
      if (p.tenantId !== req.tenantId) return false;
      if (req.partnerId && p.partnerId !== req.partnerId) return false;
      if (req.organizationId && p.organizationId !== req.organizationId) return false;
      if (req.branchId && p.branchId !== req.branchId) return false;
      if (req.status && p.status !== req.status) return false;
      if (req.dateOfBirth && p.dateOfBirth !== req.dateOfBirth) return false;

      if (req.query) {
        const q = req.query.toLowerCase().trim();
        const match =
          p.mrn.toLowerCase().includes(q) ||
          p.patientCode.toLowerCase().includes(q) ||
          p.fullName.toLowerCase().includes(q) ||
          (p.primaryContact?.primaryMobile && p.primaryContact.primaryMobile.includes(q)) ||
          (p.primaryContact?.email && p.primaryContact.email.toLowerCase().includes(q)) ||
          p.identifiers.some((i) => i.identifierValue.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (req.mrn && !p.mrn.toLowerCase().includes(req.mrn.toLowerCase())) return false;
      if (req.name && !p.fullName.toLowerCase().includes(req.name.toLowerCase())) return false;
      if (req.mobile && (!p.primaryContact || !p.primaryContact.primaryMobile.includes(req.mobile))) return false;
      if (req.email && (!p.primaryContact || !p.primaryContact.email?.toLowerCase().includes(req.email.toLowerCase()))) return false;

      return true;
    });
  }

  async getPatientById(tenantId: string, patientId: string): Promise<PatientDto | null> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return this.patients.find((p) => p.id === patientId) ?? null;
  }

  async checkDuplicate(req: CheckDuplicatePatientRequest): Promise<PatientDuplicateCheckResultDto> {
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${req.tenantId}`);
    }

    const matchedPatients: PatientDto[] = [];
    const signals: string[] = [];
    let score = 0;

    for (const p of this.patients) {
      if (p.organizationId !== req.organizationId) continue;

      const sameDob = p.dateOfBirth === req.dateOfBirth;
      const sameMobile = p.primaryContact?.primaryMobile.replace(/\D/g, '') === req.mobile.replace(/\D/g, '');
      const sameLastName = p.lastName.toLowerCase() === req.lastName.toLowerCase().trim();
      const sameFirstName = p.firstName.toLowerCase() === req.firstName.toLowerCase().trim();

      if (sameDob && sameMobile) {
        score = 98;
        signals.push('Exact Date of Birth & Primary Mobile Match');
        matchedPatients.push(p);
      } else if (sameDob && sameLastName) {
        score = 88;
        signals.push('Exact Date of Birth & Family Name Match');
        matchedPatients.push(p);
      } else if (sameMobile && sameFirstName) {
        score = 80;
        signals.push('Exact Mobile & First Name Match');
        matchedPatients.push(p);
      } else if (sameMobile) {
        score = 65;
        signals.push('Matching Primary Mobile Contact');
        matchedPatients.push(p);
      }
    }

    let matchCategory: 'EXACT_MATCH' | 'HIGH_CONFIDENCE' | 'POSSIBLE_MATCH' | 'NO_MATCH' = 'NO_MATCH';
    if (score >= 95) matchCategory = 'EXACT_MATCH';
    else if (score >= 80) matchCategory = 'HIGH_CONFIDENCE';
    else if (score >= 60) matchCategory = 'POSSIBLE_MATCH';

    return {
      matchCategory,
      confidenceScore: score,
      matchingSignals: signals,
      matchedPatients
    };
  }

  async createPatient(req: CreatePatientRequest): Promise<PatientDto> {
    try {
      const res = await apiRequest<PatientDto>('/api/v1/partner/patients', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.patients.unshift(res.data);
        return res.data;
      }
    } catch {
      // Fallback to local
    }
    saveStored('docsearch_patients', this.patients);
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Cannot create patient in foreign tenant ${req.tenantId}`);
    }

    // Duplicate Check
    const dupCheck = await this.checkDuplicate({
      tenantId: req.tenantId,
      organizationId: req.organizationId,
      firstName: req.firstName,
      lastName: req.lastName,
      dateOfBirth: req.dateOfBirth,
      mobile: req.primaryMobile
    });

    const isDuplicateReview = dupCheck.matchCategory === 'EXACT_MATCH' || dupCheck.matchCategory === 'HIGH_CONFIDENCE';
    const patientId = crypto.randomUUID();
    const mrn = this.generateMrn(req.organizationId);
    const patientCode = `PAT-${String(this.nextMrnCounter).padStart(3, '0')}`;

    const newPatient: PatientDto = {
      id: patientId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      mrn,
      patientCode,
      firstName: req.firstName,
      middleName: req.middleName,
      lastName: req.lastName,
      preferredName: req.preferredName,
      fullName: `${req.firstName} ${req.lastName} — Sample Patient`,
      dateOfBirth: req.dateOfBirth,
      gender: req.gender,
      bloodGroup: req.bloodGroup,
      maritalStatus: req.maritalStatus,
      nationality: req.nationality,
      preferredLanguage: req.preferredLanguage,
      occupation: req.occupation,
      status: isDuplicateReview ? 'DUPLICATE_REVIEW' : 'ACTIVE',
      registrationSource: req.registrationSource,
      primaryContact: {
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId: req.partnerId,
        patientId,
        primaryMobile: req.primaryMobile,
        alternateMobile: req.alternateMobile,
        email: req.email,
        preferredContactMethod: 'MOBILE',
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      primaryAddress: {
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId: req.partnerId,
        patientId,
        addressType: 'RESIDENTIAL',
        addressLine1: req.addressLine1,
        addressLine2: req.addressLine2,
        city: req.city,
        state: req.state,
        country: req.country,
        postalCode: req.postalCode,
        isPrimary: true,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      emergencyContacts: req.emergencyContactName
        ? [
            {
              id: crypto.randomUUID(),
              tenantId: req.tenantId,
              partnerId: req.partnerId,
              patientId,
              contactName: req.emergencyContactName,
              relationship: req.emergencyRelationship ?? 'OTHER',
              primaryPhone: req.emergencyPrimaryPhone ?? req.primaryMobile,
              isPrimary: true,
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        : [],
      identifiers: [
        {
          id: crypto.randomUUID(),
          tenantId: req.tenantId,
          partnerId: req.partnerId,
          organizationId: req.organizationId,
          patientId,
          identifierType: 'MRN',
          identifierValue: mrn,
          issuingAuthority: 'Doc Search Clinic Platform',
          status: 'ACTIVE',
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      consents: req.generalConsentGranted
        ? [
            {
              id: crypto.randomUUID(),
              tenantId: req.tenantId,
              partnerId: req.partnerId,
              organizationId: req.organizationId,
              patientId,
              consentType: 'GENERAL_REGISTRATION',
              consentStatus: 'GRANTED',
              effectiveDate: new Date().toISOString(),
              recordedBy: req.actorId,
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        : [],
      insurancePolicies: req.insurancePayerName && req.insurancePolicyNumber
        ? [
            {
              id: crypto.randomUUID(),
              tenantId: req.tenantId,
              partnerId: req.partnerId,
              organizationId: req.organizationId,
              patientId,
              payerName: req.insurancePayerName,
              policyNumber: req.insurancePolicyNumber,
              memberId: req.insuranceMemberId ?? 'MEM-DEFAULT',
              planName: req.insurancePlanName ?? 'Standard Health Coverage',
              coverageType: 'PRIMARY',
              eligibilityStatus: 'ACTIVE',
              coverageStartDate: new Date().toISOString(),
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        : [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.patients.unshift(newPatient);

    // If duplicate candidate, record candidate review item
    if (isDuplicateReview && dupCheck.matchedPatients[0]) {
      const candidate: PatientDuplicateCandidateDto = {
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId: req.partnerId,
        organizationId: req.organizationId,
        sourcePatientId: newPatient.id,
        sourcePatientName: `${newPatient.fullName} (${newPatient.patientCode})`,
        sourceMrn: newPatient.mrn,
        matchedPatientId: dupCheck.matchedPatients[0].id,
        matchedPatientName: `${dupCheck.matchedPatients[0].fullName} (${dupCheck.matchedPatients[0].patientCode})`,
        matchedMrn: dupCheck.matchedPatients[0].mrn,
        confidenceScore: dupCheck.confidenceScore,
        matchCategory: dupCheck.matchCategory,
        matchingSignals: dupCheck.matchingSignals,
        reviewStatus: 'PENDING_REVIEW',
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.duplicateCandidates.unshift(candidate);
    }

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      newPatient.id,
      req.actorId,
      req.actorRole,
      'PATIENT_REGISTERED',
      'patients',
      newPatient.mrn,
      req.reason
    );

    return newPatient;
  }

  async updatePatient(req: UpdatePatientRequest): Promise<PatientDto> {
    const p = this.patients.find((item) => item.id === req.patientId && item.tenantId === req.tenantId);
    if (!p) {
      throw new Error(`Patient record ${req.patientId} not found.`);
    }

    if (req.firstName) p.firstName = req.firstName;
    if (req.middleName !== undefined) p.middleName = req.middleName;
    if (req.lastName) p.lastName = req.lastName;
    if (req.preferredName !== undefined) p.preferredName = req.preferredName;
    p.fullName = `${p.firstName} ${p.lastName} — Sample Patient`;
    if (req.dateOfBirth) p.dateOfBirth = req.dateOfBirth;
    if (req.gender) p.gender = req.gender;
    if (req.bloodGroup) p.bloodGroup = req.bloodGroup;
    if (req.maritalStatus) p.maritalStatus = req.maritalStatus;
    if (req.nationality !== undefined) p.nationality = req.nationality;
    if (req.preferredLanguage) p.preferredLanguage = req.preferredLanguage;
    if (req.occupation !== undefined) p.occupation = req.occupation;
    if (req.status) p.status = req.status;
    p.updatedAt = new Date().toISOString();

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      p.branchId,
      p.id,
      req.actorId,
      req.actorRole,
      'PATIENT_DEMOGRAPHICS_UPDATED',
      'patients',
      p.mrn,
      req.reason
    );

    return { ...p };
  }

  async addIdentifier(req: AddPatientIdentifierRequest): Promise<PatientIdentifierDto> {
    const p = this.patients.find((item) => item.id === req.patientId && item.tenantId === req.tenantId);
    if (!p) {
      throw new Error(`Patient ${req.patientId} not found.`);
    }

    const ident: PatientIdentifierDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      patientId: req.patientId,
      identifierType: req.identifierType,
      identifierValue: req.identifierValue,
      issuingAuthority: req.issuingAuthority,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    p.identifiers.push(ident);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      p.branchId,
      p.id,
      req.actorId,
      req.actorRole,
      'IDENTIFIER_RECORDED',
      'patient_identifiers',
      `${req.identifierType}:${req.identifierValue.substring(0, 4)}***`,
      req.reason
    );

    return ident;
  }

  async updateContact(req: UpdatePatientContactRequest): Promise<PatientDto> {
    const p = this.patients.find((item) => item.id === req.patientId && item.tenantId === req.tenantId);
    if (!p) {
      throw new Error(`Patient ${req.patientId} not found.`);
    }

    p.primaryContact = {
      id: p.primaryContact?.id ?? crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      patientId: req.patientId,
      primaryMobile: req.primaryMobile,
      alternateMobile: req.alternateMobile,
      email: req.email,
      preferredContactMethod: req.preferredContactMethod,
      metadata: {},
      createdAt: p.primaryContact?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.addAudit(
      req.tenantId,
      req.partnerId,
      p.organizationId,
      p.branchId,
      p.id,
      req.actorId,
      req.actorRole,
      'CONTACT_INFO_UPDATED',
      'patient_contacts',
      p.mrn,
      req.reason
    );

    return { ...p };
  }

  async updateAddress(req: UpdatePatientAddressRequest): Promise<PatientDto> {
    const p = this.patients.find((item) => item.id === req.patientId && item.tenantId === req.tenantId);
    if (!p) {
      throw new Error(`Patient ${req.patientId} not found.`);
    }

    p.primaryAddress = {
      id: p.primaryAddress?.id ?? crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      patientId: req.patientId,
      addressType: req.addressType,
      addressLine1: req.addressLine1,
      addressLine2: req.addressLine2,
      city: req.city,
      state: req.state,
      country: req.country,
      postalCode: req.postalCode,
      isPrimary: true,
      metadata: {},
      createdAt: p.primaryAddress?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.addAudit(
      req.tenantId,
      req.partnerId,
      p.organizationId,
      p.branchId,
      p.id,
      req.actorId,
      req.actorRole,
      'ADDRESS_UPDATED',
      'patient_addresses',
      `${req.city}, ${req.state}`,
      req.reason
    );

    return { ...p };
  }

  async addEmergencyContact(req: AddEmergencyContactRequest): Promise<EmergencyContactDto> {
    const p = this.patients.find((item) => item.id === req.patientId && item.tenantId === req.tenantId);
    if (!p) {
      throw new Error(`Patient ${req.patientId} not found.`);
    }

    const ec: EmergencyContactDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      patientId: req.patientId,
      contactName: req.contactName,
      relationship: req.relationship,
      primaryPhone: req.primaryPhone,
      alternatePhone: req.alternatePhone,
      address: req.address,
      isPrimary: req.isPrimary,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    p.emergencyContacts.push(ec);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      p.organizationId,
      p.branchId,
      p.id,
      req.actorId,
      req.actorRole,
      'EMERGENCY_CONTACT_ADDED',
      'patient_emergency_contacts',
      req.relationship,
      req.reason
    );

    return ec;
  }

  async addConsent(req: AddPatientConsentRequest): Promise<PatientConsentDto> {
    const p = this.patients.find((item) => item.id === req.patientId && item.tenantId === req.tenantId);
    if (!p) {
      throw new Error(`Patient ${req.patientId} not found.`);
    }

    const c: PatientConsentDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      patientId: req.patientId,
      consentType: req.consentType,
      consentStatus: req.consentStatus,
      effectiveDate: new Date().toISOString(),
      expiryDate: req.expiryDate,
      recordedBy: req.actorId,
      auditReference: req.auditReference,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    p.consents.push(c);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      p.branchId,
      p.id,
      req.actorId,
      req.actorRole,
      'CONSENT_DIRECTIVE_RECORDED',
      'patient_consents',
      req.consentType,
      req.reason
    );

    return c;
  }

  async addInsurance(req: AddPatientInsuranceRequest): Promise<PatientInsurancePolicyDto> {
    const p = this.patients.find((item) => item.id === req.patientId && item.tenantId === req.tenantId);
    if (!p) {
      throw new Error(`Patient ${req.patientId} not found.`);
    }

    const ins: PatientInsurancePolicyDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      patientId: req.patientId,
      payerName: req.payerName,
      policyNumber: req.policyNumber,
      memberId: req.memberId,
      planName: req.planName,
      tpaName: req.tpaName,
      coverageType: req.coverageType,
      eligibilityStatus: 'ACTIVE',
      coverageStartDate: req.coverageStartDate,
      coverageEndDate: req.coverageEndDate,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    p.insurancePolicies.push(ins);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      p.branchId,
      p.id,
      req.actorId,
      req.actorRole,
      'INSURANCE_POLICY_ATTACHED',
      'patient_insurance_policies',
      req.payerName,
      req.reason
    );

    return ins;
  }

  async getDuplicateCandidates(tenantId: string, organizationId?: string): Promise<PatientDuplicateCandidateDto[]> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return this.duplicateCandidates.filter((c) => {
      if (organizationId && c.organizationId !== organizationId) return false;
      return true;
    });
  }

  async reviewDuplicateCandidate(req: ReviewDuplicatePatientRequest): Promise<PatientDuplicateCandidateDto> {
    const c = this.duplicateCandidates.find((item) => item.id === req.candidateId && item.tenantId === req.tenantId);
    if (!c) {
      throw new Error(`Duplicate review candidate ${req.candidateId} not found.`);
    }

    c.reviewStatus = req.reviewStatus;
    c.reviewedBy = req.actorId;
    c.reviewNotes = req.reviewNotes;
    c.reviewedAt = new Date().toISOString();
    c.updatedAt = new Date().toISOString();

    const sourcePatient = this.patients.find((p) => p.id === c.sourcePatientId);
    if (sourcePatient && req.reviewStatus === 'RESOLVED_DISTINCT') {
      sourcePatient.status = 'ACTIVE';
    }

    this.addAudit(
      req.tenantId,
      c.partnerId,
      c.organizationId,
      undefined,
      c.sourcePatientId,
      req.actorId,
      req.actorRole,
      `DUPLICATE_REVIEW_${req.reviewStatus}`,
      'patient_duplicate_candidates',
      c.id,
      req.reason
    );

    return { ...c };
  }

  async mergePatients(req: MergePatientRequest): Promise<PatientMergeEventDto> {
    const canonical = this.patients.find((p) => p.id === req.canonicalPatientId && p.tenantId === req.tenantId);
    const merged = this.patients.find((p) => p.id === req.mergedPatientId && p.tenantId === req.tenantId);

    if (!canonical || !merged) {
      throw new Error('Both canonical and target duplicate patient records must exist for merge.');
    }

    if (canonical.id === merged.id) {
      throw new Error('Cannot merge a patient into itself.');
    }

    // Merge non-null attributes, identifiers, insurance, and emergency contacts
    merged.identifiers.forEach((ident) => {
      if (!canonical.identifiers.some((ci) => ci.identifierType === ident.identifierType && ci.identifierValue === ident.identifierValue)) {
        canonical.identifiers.push({ ...ident, patientId: canonical.id });
      }
    });

    merged.insurancePolicies.forEach((ins) => {
      if (!canonical.insurancePolicies.some((ci) => ci.policyNumber === ins.policyNumber)) {
        canonical.insurancePolicies.push({ ...ins, patientId: canonical.id });
      }
    });

    merged.emergencyContacts.forEach((ec) => {
      canonical.emergencyContacts.push({ ...ec, patientId: canonical.id });
    });

    // Mark merged record as MERGED
    merged.status = 'MERGED';
    merged.mergedIntoPatientId = canonical.id;
    merged.updatedAt = new Date().toISOString();
    canonical.updatedAt = new Date().toISOString();

    const event: PatientMergeEventDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      canonicalPatientId: canonical.id,
      canonicalMrn: canonical.mrn,
      mergedPatientId: merged.id,
      mergedMrn: merged.mrn,
      actorId: req.actorId,
      actorRole: req.actorRole,
      mergeReason: req.mergeReason,
      mergedSnapshot: {
        mergedPatientCode: merged.patientCode,
        mergedName: merged.fullName,
        mergedDob: merged.dateOfBirth
      },
      correlationId: `corr-merge-${Date.now()}`,
      mergedAt: new Date().toISOString()
    };
    this.mergeEvents.unshift(event);

    // If there was a candidate review record, mark it RESOLVED_MERGED
    if (req.candidateId) {
      const c = this.duplicateCandidates.find((item) => item.id === req.candidateId);
      if (c) {
        c.reviewStatus = 'RESOLVED_MERGED';
        c.reviewedBy = req.actorId;
        c.reviewNotes = `Merged into canonical patient ${canonical.mrn}`;
        c.reviewedAt = new Date().toISOString();
      }
    }

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      canonical.branchId,
      canonical.id,
      req.actorId,
      req.actorRole,
      'PATIENT_MERGE_COMPLETED',
      'patient_merge_events',
      `${merged.mrn} -> ${canonical.mrn}`,
      req.mergeReason
    );

    return event;
  }

  async getMergeHistory(tenantId: string, organizationId?: string): Promise<PatientMergeEventDto[]> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return this.mergeEvents.filter((m) => {
      if (organizationId && m.organizationId !== organizationId) return false;
      return true;
    });
  }

  async getAuditTraces(req: QueryPatientAuditRequest): Promise<PatientRegistrationAuditTraceDto[]> {
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${req.tenantId}`);
    }
    return this.auditTraces.filter((t) => {
      if (t.tenantId !== req.tenantId) return false;
      if (req.partnerId && t.partnerId !== req.partnerId) return false;
      if (req.organizationId && t.organizationId !== req.organizationId) return false;
      if (req.patientId && t.patientId !== req.patientId) return false;
      return true;
    });
  }
}

export const patientRegistrationService = new PatientRegistrationService();
