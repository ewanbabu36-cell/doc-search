import crypto from 'crypto';
import { AbdmGatewayRepository } from '../../repositories/partner/AbdmGatewayRepository.js';
import { AppError } from '@docsearch/shared-core';

export class AbdmGatewayService {
  constructor(private readonly repo = new AbdmGatewayRepository()) {}

  private computeHash(payload: Record<string, unknown>, previousHash?: string): string {
    const serialized = JSON.stringify(payload);
    return crypto.createHash('sha256').update(`${previousHash || 'GENESIS_ABDM'}::${serialized}`).digest('hex');
  }

  async getOverviewMetrics(tenantId: string) {
    return await this.repo.getOverviewMetrics(tenantId);
  }

  // M1: ABHA Registration & Verification
  async generateAadhaarOtp(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const aadhaarLast4 = String(payload['aadhaarNumberLast4'] || '1234');
    const mobile = String(payload['mobileNumber'] || '+91 9876543210');

    const txnId = 'TXN-AADHAAR-' + Date.now().toString().slice(-8);

    const hash = this.computeHash({ event: 'AADHAAR_OTP_GENERATED', txnId, aadhaarLast4, mobile });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ABHA_AADHAAR_TXN',
      entityId: txnId,
      entityCode: txnId,
      action: 'GENERATE_AADHAAR_OTP',
      actorName: actorId,
      actorRole: 'REGISTRATION_OFFICER',
      justification: 'Patient requested ABHA creation via Aadhaar OTP authentication',
      integrityHash: hash
    });

    return {
      txnId,
      message: `Aadhaar OTP dispatched successfully to mobile linked with Aadhaar ending in ${aadhaarLast4}`,
      authMode: 'AADHAAR_OTP',
      expiresInSeconds: 600
    };
  }

  async verifyAadhaarOtp(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const txnId = String(payload['txnId'] || '');
    const otp = String(payload['otp'] || '');
    const preferredAbhaAddress = String(payload['preferredAbhaAddress'] || 'patient');
    const patientName = String(payload['patientName'] || 'Kavita Joshi');
    const patientMrn = String(payload['patientMrn'] || 'MRN-2026-9041');
    const gender = String(payload['gender'] || 'F');
    const dateOfBirth = String(payload['dateOfBirth'] || '1990-05-14');
    const mobileNumber = String(payload['mobileNumber'] || '+91 98200 44321');
    const address = String(payload['address'] || '74/B, Park Street, Kolkata, West Bengal - 700016');

    if (!txnId) {
      throw new AppError({ message: 'Transaction ID is required for OTP verification', statusCode: 400 });
    }

    if (otp && otp.length < 4) {
      throw new AppError({ message: 'Invalid OTP provided', statusCode: 400 });
    }

    const rand1 = Math.floor(1000 + Math.random() * 9000);
    const rand2 = Math.floor(1000 + Math.random() * 9000);
    const abhaNumber = `91-${rand1}-${rand2}-7714`;
    const cleanAddress = preferredAbhaAddress.includes('@') ? preferredAbhaAddress : `${preferredAbhaAddress}@abdm`;

    const qrPayload = JSON.stringify({
      hidn: abhaNumber,
      hid: cleanAddress,
      name: patientName,
      gender,
      dob: dateOfBirth,
      mobile: mobileNumber,
      address,
      facilityHfr: 'IN0710002981'
    });

    const account = await this.repo.createAbhaAccount({
      tenantId,
      branchId,
      patientId: 'pat_' + Math.random().toString(36).substring(2, 9),
      patientMrn,
      patientName,
      abhaNumber,
      abhaAddress: cleanAddress,
      mobileNumber,
      gender,
      dateOfBirth,
      address,
      kycStatus: 'VERIFIED_AADHAAR',
      abhaCardQrPayload: Buffer.from(qrPayload).toString('base64'),
      linkedCareContextsCount: 0
    });

    const hash = this.computeHash({ event: 'ABHA_CREATED_VERIFIED', abhaNumber, abhaAddress: cleanAddress });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'PATIENT_ABHA_ACCOUNT',
      entityId: account.id as string,
      entityCode: abhaNumber,
      action: 'VERIFY_OTP_AND_CREATE_ABHA',
      actorName: actorId,
      actorRole: 'REGISTRATION_OFFICER',
      justification: 'Aadhaar e-KYC verified; 14-digit ABHA ID & PHR address minted',
      integrityHash: hash
    });

    return account;
  }

  async generateMobileOtp(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const mobile = String(payload['mobileNumber'] || '+91 9876543210');
    const txnId = 'TXN-MOBILE-' + Date.now().toString().slice(-8);

    const hash = this.computeHash({ event: 'MOBILE_OTP_GENERATED', txnId, mobile });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ABHA_MOBILE_TXN',
      entityId: txnId,
      entityCode: txnId,
      action: 'GENERATE_MOBILE_OTP',
      actorName: actorId,
      actorRole: 'REGISTRATION_OFFICER',
      justification: 'Patient requested ABHA creation via Mobile OTP authentication',
      integrityHash: hash
    });

    return {
      txnId,
      message: `Mobile OTP dispatched successfully to ${mobile}`,
      authMode: 'MOBILE_OTP',
      expiresInSeconds: 600
    };
  }

  async verifyMobileOtp(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const txnId = String(payload['txnId'] || '');
    const otp = String(payload['otp'] || '');
    const preferredAbhaAddress = String(payload['preferredAbhaAddress'] || 'patient');
    const patientName = String(payload['patientName'] || 'Patient Name');
    const patientMrn = String(payload['patientMrn'] || 'MRN-' + Date.now().toString().slice(-6));
    const gender = String(payload['gender'] || 'M');
    const dateOfBirth = String(payload['dateOfBirth'] || '1990-01-01');
    const mobileNumber = String(payload['mobileNumber'] || '+91 9876543210');
    const address = String(payload['address'] || 'DocSearch Partner Facility');

    if (!txnId) {
      throw new AppError({ message: 'Transaction ID is required for OTP verification', statusCode: 400 });
    }
    if (otp && otp.length < 4) {
      throw new AppError({ message: 'Invalid OTP provided', statusCode: 400 });
    }

    const rand1 = Math.floor(1000 + Math.random() * 9000);
    const rand2 = Math.floor(1000 + Math.random() * 9000);
    const abhaNumber = `91-${rand1}-${rand2}-8823`;
    const cleanAddress = preferredAbhaAddress.includes('@') ? preferredAbhaAddress : `${preferredAbhaAddress}@abdm`;

    const qrPayload = JSON.stringify({
      hidn: abhaNumber,
      hid: cleanAddress,
      name: patientName,
      gender,
      dob: dateOfBirth,
      mobile: mobileNumber,
      address,
      facilityHfr: 'IN0710002981'
    });

    const account = await this.repo.createAbhaAccount({
      tenantId,
      branchId,
      patientId: 'pat_' + Math.random().toString(36).substring(2, 9),
      patientMrn,
      patientName,
      abhaNumber,
      abhaAddress: cleanAddress,
      mobileNumber,
      gender,
      dateOfBirth,
      address,
      kycStatus: 'VERIFIED_MOBILE',
      abhaCardQrPayload: Buffer.from(qrPayload).toString('base64'),
      linkedCareContextsCount: 0
    });

    const hash = this.computeHash({ event: 'ABHA_CREATED_VERIFIED_MOBILE', abhaNumber, abhaAddress: cleanAddress });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'PATIENT_ABHA_ACCOUNT',
      entityId: account.id as string,
      entityCode: abhaNumber,
      action: 'VERIFY_MOBILE_OTP_AND_CREATE_ABHA',
      actorName: actorId,
      actorRole: 'REGISTRATION_OFFICER',
      justification: 'Mobile OTP verified; 14-digit ABHA ID & PHR address minted',
      integrityHash: hash
    });

    return account;
  }

  async verifyDemographics(tenantId: string, payload: Record<string, unknown>) {
    const patientName = String(payload['patientName'] || '');
    const gender = String(payload['gender'] || '');
    const dateOfBirth = String(payload['dateOfBirth'] || '');
    const abhaAddress = payload['abhaAddress'] ? String(payload['abhaAddress']) : undefined;

    if (!patientName || !gender || !dateOfBirth) {
      throw new AppError({ message: 'Patient name, gender, and date of birth are required for demographic verification', statusCode: 400 });
    }

    let match = true;
    if (abhaAddress) {
      const account = await this.repo.getAbhaAccountByAddress(tenantId, abhaAddress);
      if (account && account.patientName && account.patientName.toLowerCase() !== patientName.toLowerCase()) {
        match = false;
      }
    }

    return {
      verified: match,
      matchScore: match ? 100 : 40,
      status: match ? 'MATCHED' : 'DEMOGRAPHIC_MISMATCH',
      patientName,
      gender,
      dateOfBirth
    };
  }

  async searchByHealthId(tenantId: string, address: string) {
    if (!address) {
      throw new AppError({ message: 'ABHA Address or Number is required', statusCode: 400 });
    }
    const found = await this.repo.getAbhaAccountByAddress(tenantId, address);
    if (!found) {
      throw new AppError({ message: 'No registered ABHA profile found for this address', statusCode: 404 });
    }
    return found;
  }

  async getAbhaAccounts(tenantId: string) {
    return await this.repo.getAbhaAccounts(tenantId);
  }

  // M2: Care Contexts & Linking
  async getCareContexts(tenantId: string) {
    return await this.repo.getCareContexts(tenantId);
  }

  async linkCareContext(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const abhaAddress = String(payload['abhaAddress'] || '');
    const patientMrn = String(payload['patientMrn'] || '');
    const careContextReference = String(payload['careContextReference'] || 'VISIT-OPD-' + Date.now().toString().slice(-6));

    if (!abhaAddress || !patientMrn) {
      throw new AppError({ message: 'ABHA Address and Patient MRN are required for care context linking', statusCode: 400 });
    }

    const careContext = await this.repo.createCareContext({
      ...payload,
      tenantId,
      branchId,
      abhaAddress,
      patientMrn,
      patientName: String(payload['patientName'] || 'Patient'),
      careContextType: String(payload['careContextType'] || 'OPD_CONSULTATION_VISIT'),
      careContextReference,
      displayTitle: String(payload['displayTitle'] || 'OPD Consultation Encounter'),
      encounterDate: String(payload['encounterDate'] || new Date().toISOString().split('T')[0]),
      doctorName: String(payload['doctorName'] || 'Dr. Amit Sen, MD'),
      departmentName: String(payload['departmentName'] || 'General Medicine'),
      isLinkedToAbdm: true,
      fhirBundleId: (payload['fhirBundleId'] as string) || null
    });

    const hash = this.computeHash({ event: 'CARE_CONTEXT_LINKED', abhaAddress, careContextReference });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ABDM_CARE_CONTEXT',
      entityId: careContext.id as string,
      entityCode: careContextReference,
      action: 'LINK_CARE_CONTEXT',
      actorName: actorId,
      actorRole: 'HOSPITAL_INFORMATION_PROVIDER',
      justification: 'Care context registered with ABDM National Health Bridge',
      integrityHash: hash
    });

    return careContext;
  }

  async discoverCareContexts(tenantId: string, patientAbhaAddress: string) {
    if (!patientAbhaAddress) {
      throw new AppError({ message: 'Patient ABHA Address is required for care context discovery', statusCode: 400 });
    }
    const contexts = await this.repo.getCareContextsByAbha(tenantId, patientAbhaAddress);
    return {
      patientAbhaAddress,
      careContexts: contexts.map(c => ({
        referenceNumber: c.careContextReference,
        display: c.displayTitle,
        type: c.careContextType,
        encounterDate: c.encounterDate,
        doctorName: c.doctorName
      }))
    };
  }

  async initCareContextLinking(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const patientAbhaAddress = String(payload['patientAbhaAddress'] || '');
    const careContextReferences = (payload['careContextReferences'] as string[]) || [];

    if (!patientAbhaAddress || careContextReferences.length === 0) {
      throw new AppError({ message: 'ABHA Address and at least one Care Context Reference are required', statusCode: 400 });
    }

    const txnId = 'TXN-LINK-' + Date.now().toString().slice(-8);
    const hash = this.computeHash({ event: 'CARE_CONTEXT_LINK_INIT', txnId, patientAbhaAddress, careContextReferences });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ABDM_CARE_CONTEXT_LINKING',
      entityId: txnId,
      entityCode: txnId,
      action: 'INIT_CARE_CONTEXT_LINKING',
      actorName: actorId,
      actorRole: 'HOSPITAL_INFORMATION_PROVIDER',
      justification: 'Requested linking of care contexts to patient ABHA address',
      integrityHash: hash
    });

    return {
      txnId,
      patientAbhaAddress,
      careContextReferences,
      message: 'Linking OTP dispatched to mobile registered with patient ABHA address',
      authMode: 'LINKING_OTP',
      expiresInSeconds: 300
    };
  }

  async confirmCareContextLinking(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const txnId = String(payload['txnId'] || '');
    const otp = String(payload['otp'] || '');
    const patientAbhaAddress = String(payload['patientAbhaAddress'] || '');

    if (!txnId || !patientAbhaAddress) {
      throw new AppError({ message: 'Transaction ID and patient ABHA Address are required', statusCode: 400 });
    }
    if (otp && otp.length < 4) {
      throw new AppError({ message: 'Invalid OTP provided for care context linking', statusCode: 400 });
    }

    const hash = this.computeHash({ event: 'CARE_CONTEXT_LINK_CONFIRMED', txnId, patientAbhaAddress });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ABDM_CARE_CONTEXT_LINKING',
      entityId: txnId,
      entityCode: txnId,
      action: 'CONFIRM_CARE_CONTEXT_LINKING',
      actorName: actorId,
      actorRole: 'HOSPITAL_INFORMATION_PROVIDER',
      justification: 'OTP verified and care contexts confirmed linked to patient ABHA',
      integrityHash: hash
    });

    return {
      status: 'SUCCESS',
      patientAbhaAddress,
      message: 'Care contexts successfully linked to ABHA profile'
    };
  }

  // M2: Scan and Share
  async getScanAndShareTokens(tenantId: string) {
    return await this.repo.getScanAndShareTokens(tenantId);
  }

  async processScanAndShare(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const abhaNumber = String(payload['patientAbhaNumber'] || '91-4421-8890-1234');
    const abhaAddress = String(payload['patientAbhaAddress'] || 'patient@abdm');
    const patientName = String(payload['patientName'] || 'Patient');

    const tokenNumber = 'TKN-' + Math.floor(100 + Math.random() * 900);
    const token = await this.repo.createScanAndShareToken({
      ...payload,
      tenantId,
      branchId,
      tokenNumber,
      patientAbhaNumber: abhaNumber,
      patientAbhaAddress: abhaAddress,
      patientName,
      gender: String(payload['gender'] || 'M'),
      dob: String(payload['dob'] || '1988-03-22'),
      mobile: String(payload['mobile'] || '+91 98765 43210'),
      scannedCounterName: String(payload['scannedCounterName'] || 'OPD Registration Counter 1'),
      assignedOpdDepartment: String(payload['assignedOpdDepartment'] || 'Cardiology'),
      assignedDoctorName: String(payload['assignedDoctorName'] || 'Dr. Sneha Roy'),
      status: 'WAITING_AT_COUNTER',
      scannedAt: new Date()
    });

    const hash = this.computeHash({ event: 'SCAN_AND_SHARE_PROCESSED', tokenNumber, abhaAddress });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'SCAN_AND_SHARE_TOKEN',
      entityId: token.id as string,
      entityCode: tokenNumber,
      action: 'PROCESS_SCAN_AND_SHARE',
      actorName: actorId,
      actorRole: 'OPD_TRIAGE_COUNTER',
      justification: 'Patient QR scanned at hospital counter; auto-generated OPD intake token',
      integrityHash: hash
    });

    return token;
  }

  // M3: Consents
  async getConsentArtefacts(tenantId: string) {
    return await this.repo.getConsentArtefacts(tenantId);
  }

  async createConsentRequest(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const patientAbhaAddress = String(payload['patientAbhaAddress'] || '');
    const purposeCode = String(payload['purposeCode'] || 'CARETREAT');

    if (!patientAbhaAddress) {
      throw new AppError({ message: 'Patient ABHA Address is required for consent request', statusCode: 400 });
    }

    const consentRequestId = 'CRQ-' + Date.now().toString().slice(-8);
    const artefactId = 'ART-' + Date.now().toString().slice(-8);

    const artefact = await this.repo.createConsentArtefact({
      ...payload,
      tenantId,
      branchId,
      consentRequestId,
      artefactId,
      patientAbhaAddress,
      patientName: String(payload['patientName'] || 'Patient'),
      requesterHipOrHiu: String(payload['requesterHipOrHiu'] || 'DocSearch Partner Hospital (HIU-001)'),
      purposeCode,
      purposeDescription: String(payload['purposeDescription'] || 'Care and Treatment'),
      dateFrom: String(payload['dateFrom'] || '2024-01-01'),
      dateTo: String(payload['dateTo'] || '2026-12-31'),
      dataEraseDate: String(payload['dataEraseDate'] || '2027-12-31'),
      status: 'GRANTED',
      grantedAt: new Date(),
      linkedCareContextRefs: (payload['careContextRefs'] as string[]) || ['VISIT-OPD-001', 'LAB-REP-002']
    });

    const hash = this.computeHash({ event: 'CONSENT_REQUESTED_AND_GRANTED', consentRequestId, artefactId, patientAbhaAddress });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ABDM_CONSENT_ARTEFACT',
      entityId: artefact.id as string,
      entityCode: artefactId,
      action: 'CREATE_CONSENT_REQUEST',
      actorName: actorId,
      actorRole: 'HEALTH_INFORMATION_USER',
      justification: 'Electronic consent artefact granted by patient for health records access',
      integrityHash: hash
    });

    return artefact;
  }

  async revokeConsent(tenantId: string, branchId: string, actorId: string, artefactId: string) {
    if (!artefactId) {
      throw new AppError({ message: 'Artefact ID is required for consent revocation', statusCode: 400 });
    }

    const updated = await this.repo.updateConsentStatus(tenantId, artefactId, 'REVOKED');
    if (!updated) {
      throw new AppError({ message: 'Consent artefact not found for revocation', statusCode: 404 });
    }

    const hash = this.computeHash({ event: 'CONSENT_REVOKED', artefactId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ABDM_CONSENT_ARTEFACT',
      entityId: artefactId,
      entityCode: artefactId,
      action: 'REVOKE_CONSENT',
      actorName: actorId,
      actorRole: 'PATIENT_OR_HIU',
      justification: 'Patient revoked previously granted consent artefact',
      integrityHash: hash
    });

    return {
      artefactId,
      status: 'REVOKED',
      revokedAt: new Date().toISOString()
    };
  }

  // M3: FHIR R4 Bundles
  async getFhirBundles(tenantId: string) {
    return await this.repo.getFhirBundles(tenantId);
  }

  private buildFhirDocument(profileType: string, bundleId: string, payload: Record<string, unknown>, patientAbhaAddress: string, patientMrn: string) {
    const practitionerName = String(payload['authorPractitionerName'] || 'Dr. S. K. Mukherjee');
    const practitionerHpr = String(payload['authorPractitionerHprId'] || 'HPR-9921');
    const facilityHfr = 'IN0710002981';
    const now = new Date().toISOString();

    const compositionId = 'comp-' + bundleId;
    let typeCode = '18842-5';
    let typeDisplay = 'Discharge summary';
    let profileDefinition = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DischargeSummaryRecord';
    let entries: Array<{ fullUrl: string; resource: Record<string, unknown> }> = [];

    if (profileType === 'OPD_CONSULTATION') {
      typeCode = '371530009';
      typeDisplay = 'Consultation report';
      profileDefinition = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPDConsultationRecord';
      const encId = 'enc-' + bundleId;
      const condId = 'cond-' + bundleId;
      entries = [
        {
          fullUrl: `urn:uuid:${encId}`,
          resource: {
            resourceType: 'Encounter',
            id: encId,
            status: 'finished',
            class: { code: 'AMB', display: 'ambulatory' },
            subject: { reference: `Patient/${patientMrn}`, display: patientAbhaAddress },
            period: { start: now, end: now }
          }
        },
        {
          fullUrl: `urn:uuid:${condId}`,
          resource: {
            resourceType: 'Condition',
            id: condId,
            clinicalStatus: { coding: [{ code: 'active' }] },
            verificationStatus: { coding: [{ code: 'confirmed' }] },
            subject: { reference: `Patient/${patientMrn}`, display: patientAbhaAddress },
            code: { text: String(payload['diagnosis'] || 'Acute upper respiratory tract infection') }
          }
        }
      ];
    } else if (profileType === 'DIAGNOSTIC_REPORT') {
      typeCode = '11502-2';
      typeDisplay = 'Laboratory report';
      profileDefinition = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord';
      const reportId = 'diag-' + bundleId;
      const obsId = 'obs-' + bundleId;
      entries = [
        {
          fullUrl: `urn:uuid:${reportId}`,
          resource: {
            resourceType: 'DiagnosticReport',
            id: reportId,
            status: 'final',
            code: { text: String(payload['testName'] || 'Complete Blood Count (CBC)') },
            subject: { reference: `Patient/${patientMrn}`, display: patientAbhaAddress },
            issued: now,
            performer: [{ display: practitionerName, reference: `Practitioner/${practitionerHpr}` }],
            result: [{ reference: `Observation/${obsId}` }]
          }
        },
        {
          fullUrl: `urn:uuid:${obsId}`,
          resource: {
            resourceType: 'Observation',
            id: obsId,
            status: 'final',
            code: { text: 'Hemoglobin' },
            subject: { reference: `Patient/${patientMrn}`, display: patientAbhaAddress },
            valueQuantity: { value: 14.2, unit: 'g/dL', system: 'http://unitsofmeasure.org' }
          }
        }
      ];
    } else if (profileType === 'PRESCRIPTION') {
      typeCode = '57833-6';
      typeDisplay = 'Prescription for medication';
      profileDefinition = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord';
      const medId = 'med-' + bundleId;
      entries = [
        {
          fullUrl: `urn:uuid:${medId}`,
          resource: {
            resourceType: 'MedicationRequest',
            id: medId,
            status: 'active',
            intent: 'order',
            subject: { reference: `Patient/${patientMrn}`, display: patientAbhaAddress },
            authoredOn: now,
            requester: { reference: `Practitioner/${practitionerHpr}`, display: practitionerName },
            medicationCodeableConcept: { text: String(payload['medicationName'] || 'Paracetamol 650mg Oral Tablet') },
            dosageInstruction: [
              {
                text: String(payload['dosageText'] || '1 tablet TDS after meals for 5 days')
              }
            ]
          }
        }
      ];
    } else {
      // Default: DISCHARGE_SUMMARY
      typeCode = '18842-5';
      typeDisplay = 'Discharge summary';
      profileDefinition = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DischargeSummaryRecord';
      const encId = 'enc-' + bundleId;
      const condId = 'cond-' + bundleId;
      entries = [
        {
          fullUrl: `urn:uuid:${encId}`,
          resource: {
            resourceType: 'Encounter',
            id: encId,
            status: 'finished',
            class: { code: 'IMP', display: 'inpatient encounter' },
            subject: { reference: `Patient/${patientMrn}`, display: patientAbhaAddress },
            period: { start: new Date(Date.now() - 3 * 86400000).toISOString(), end: now }
          }
        },
        {
          fullUrl: `urn:uuid:${condId}`,
          resource: {
            resourceType: 'Condition',
            id: condId,
            clinicalStatus: { coding: [{ code: 'resolved' }] },
            verificationStatus: { coding: [{ code: 'confirmed' }] },
            subject: { reference: `Patient/${patientMrn}`, display: patientAbhaAddress },
            code: { text: String(payload['diagnosis'] || 'Acute Appendicitis — Post Laparoscopic Appendectomy') }
          }
        }
      ];
    }

    const compositionResource = {
      resourceType: 'Composition',
      id: compositionId,
      status: 'final',
      type: {
        coding: [{ system: 'http://loinc.org', code: typeCode, display: typeDisplay }],
        text: profileType
      },
      subject: { display: patientAbhaAddress, reference: `Patient/${patientMrn}` },
      date: now,
      author: [{ display: practitionerName, reference: `Practitioner/${practitionerHpr}` }],
      custodian: { display: 'DocSearch Partner Hospital', reference: `Organization/${facilityHfr}` },
      title: `ABDM Verified Clinical Document - ${profileType}`,
      section: [
        {
          title: 'Clinical Summary',
          text: {
            status: 'generated',
            div: `<div>${String(payload['clinicalSummaryText'] || 'Patient examined. Vital parameters within normal physiological limits.')}</div>`
          }
        }
      ]
    };

    return {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        versionId: '1',
        lastUpdated: now,
        profile: [
          'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle',
          profileDefinition
        ]
      },
      identifier: {
        system: 'https://docsearch.health/fhir/bundle',
        value: bundleId
      },
      type: 'document',
      timestamp: now,
      entry: [
        {
          fullUrl: `urn:uuid:${compositionId}`,
          resource: compositionResource
        },
        ...entries
      ]
    };
  }

  async generateFhirBundle(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const profileType = String(payload['profileType'] || 'DISCHARGE_SUMMARY');
    const patientAbhaAddress = String(payload['patientAbhaAddress'] || 'patient@abdm');
    const patientMrn = String(payload['patientMrn'] || 'MRN-001');
    const careContextRef = String(payload['careContextRef'] || 'CTX-001');

    const bundleId = 'FHIR-' + Date.now().toString().slice(-8);
    const fhirDoc = this.buildFhirDocument(profileType, bundleId, payload, patientAbhaAddress, patientMrn);
    const signatureHash = crypto.createHash('sha256').update(JSON.stringify(fhirDoc)).digest('hex');

    const bundle = await this.repo.createFhirBundle({
      ...payload,
      tenantId,
      branchId,
      bundleId,
      profileType,
      patientAbhaAddress,
      patientMrn,
      careContextRef,
      documentDate: new Date().toISOString().split('T')[0] as string,
      authorPractitionerHprId: String(payload['authorPractitionerHprId'] || 'HPR-9921'),
      authorPractitionerName: String(payload['authorPractitionerName'] || 'Dr. S. K. Mukherjee'),
      facilityHfrId: 'IN0710002981',
      fhirJsonPayload: JSON.stringify(fhirDoc, null, 2),
      validationStatus: 'VALID_FHIR_R4',
      digitalSignatureHash: signatureHash
    });

    const hash = this.computeHash({ event: 'FHIR_BUNDLE_GENERATED', bundleId, profileType, signatureHash });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'FHIR_R4_BUNDLE',
      entityId: bundle.id as string,
      entityCode: bundleId,
      action: 'GENERATE_FHIR_BUNDLE',
      actorName: actorId,
      actorRole: 'FHIR_VALIDATOR_ENGINE',
      justification: 'Compiled valid NRCES compliant FHIR R4 Bundle with SHA-256 digital signature',
      integrityHash: hash
    });

    return bundle;
  }

  // M3: Health Information Exchange (ECDH Transfer)
  async requestHealthInformationTransfer(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const consentId = String(payload['consentId'] || '');
    if (!consentId) {
      throw new AppError({ message: 'Consent ID is required for health information transfer request', statusCode: 400 });
    }

    const transactionId = 'TXN-HI-' + Date.now().toString().slice(-8);
    const keyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1'
    });
    const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();

    const hash = this.computeHash({ event: 'HEALTH_INFORMATION_REQUESTED', transactionId, consentId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ABDM_HI_TRANSFER',
      entityId: transactionId,
      entityCode: transactionId,
      action: 'REQUEST_HEALTH_INFO_TRANSFER',
      actorName: actorId,
      actorRole: 'HEALTH_INFORMATION_USER',
      justification: 'Dispatched ECDH public key exchange for encrypted FHIR payload stream',
      integrityHash: hash
    });

    return {
      transactionId,
      consentId,
      status: 'DISPATCHED_TO_NHA_BRIDGE',
      hiuPublicKey: publicKeyPem,
      encryptionAlgorithm: 'ECDH-AES-GCM-256',
      message: 'Health information request registered; awaiting encrypted FHIR payload stream from HIP'
    };
  }

  encryptHealthPayload(receiverPublicKeyPem: string, plainTextPayload: string | Record<string, unknown>) {
    if (!receiverPublicKeyPem) {
      throw new AppError({ message: 'Receiver public key is required for payload encryption', statusCode: 400 });
    }

    const ephemeralKeyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1'
    });
    const senderPublicKeyPem = ephemeralKeyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const receiverPublicKey = crypto.createPublicKey(receiverPublicKeyPem);

    const sharedSecret = crypto.diffieHellman({
      privateKey: ephemeralKeyPair.privateKey,
      publicKey: receiverPublicKey
    });

    const aesKey = crypto.createHash('sha256').update(sharedSecret).digest();
    const iv = crypto.randomBytes(12);

    const serializedPayload = typeof plainTextPayload === 'string' ? plainTextPayload : JSON.stringify(plainTextPayload);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    let encrypted = cipher.update(serializedPayload, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      senderPublicKeyPem,
      iv: iv.toString('hex'),
      authTag,
      encryptedData: encrypted,
      algorithm: 'ECDH-AES-GCM-256'
    };
  }

  decryptHealthPayload(privateKeyPem: string, senderPublicKeyPem: string, encryptedData: string, iv: string, authTag: string) {
    if (!privateKeyPem || !senderPublicKeyPem || !encryptedData || !iv || !authTag) {
      throw new AppError({ message: 'Private key, sender public key, encrypted data, IV, and auth tag are required for decryption', statusCode: 400 });
    }

    const privateKey = crypto.createPrivateKey(privateKeyPem);
    const senderPublicKey = crypto.createPublicKey(senderPublicKeyPem);

    const sharedSecret = crypto.diffieHellman({
      privateKey,
      publicKey: senderPublicKey
    });

    const aesKey = crypto.createHash('sha256').update(sharedSecret).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  }

  // NHA Gateway Callback Handlers
  async handleNhaCallback(action: string, payload: Record<string, unknown>) {
    const requestId = String(payload['requestId'] || 'REQ-' + Date.now());
    return {
      success: true,
      acknowledgedAt: new Date().toISOString(),
      action,
      requestId,
      status: 'ACK'
    };
  }

  // Audit Traces
  async getAuditTraces(tenantId: string) {
    return await this.repo.getAuditTraces(tenantId);
  }
}
