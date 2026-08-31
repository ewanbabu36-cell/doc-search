import { apiRequest } from './api-client.js';
import type {
  BloodBankFacilityDto,
  BloodDonorDto,
  BloodDonorScreeningDto,
  BloodDonationDto,
  BloodTestRecordDto,
  BloodComponentDto,
  BloodRequestDto,
  BloodCrossmatchDto,
  BloodIssueDto,
  TransfusionRecordDto,
  TransfusionReactionDto,
  BloodQualityCheckDto,
  BloodStorageTemperatureLogDto,
  BloodDiscardRecordDto,
  BloodBankAuditTraceDto,
  BloodBankOverviewMetricsDto,
  BloodBankAnalyticsDto,
  CreateDonorRequest,
  ScreenDonorRequest,
  CreateDonationRequest,
  RecordBloodTestRequest,
  ReleaseBloodUnitRequest,
  CreateComponentRequest,
  CreateBloodRequestRequest,
  CreateCrossmatchRequest,
  ReserveBloodUnitRequest,
  IssueBloodUnitRequest,
  RecordTransfusionRequest,
  RecordTransfusionObservationRequest,
  ReportTransfusionReactionRequest,
  ReturnBloodUnitRequest,
  DiscardBloodUnitRequest,
  CreateQualityCheckRequest,
  RecordTemperatureRequest,
  ResolveStorageExcursionRequest
} from '@docsearch/api-contracts';

import {
  mockBloodBankFacility,
  mockBloodDonors,
  mockDonorScreenings,
  mockBloodDonations,
  mockBloodTests,
  mockBloodComponents,
  mockBloodRequests,
  mockCrossmatches,
  mockBloodIssues,
  mockTransfusions,
  mockReactions,
  mockQualityChecks,
  mockTemperatureLogs,
  mockDiscards,
  mockBloodBankAuditTraces,
  mockBloodBankOverviewMetrics,
  mockBloodBankAnalytics
} from './mock-blood-bank-data.js';

export interface IBloodBankManagementService {
  getOverviewMetrics(tenantId: string): Promise<BloodBankOverviewMetricsDto>;
  getAnalytics(tenantId: string): Promise<BloodBankAnalyticsDto>;
  getFacility(tenantId: string): Promise<BloodBankFacilityDto>;
  getDonors(tenantId: string): Promise<BloodDonorDto[]>;
  getScreenings(tenantId: string): Promise<BloodDonorScreeningDto[]>;
  getDonations(tenantId: string): Promise<BloodDonationDto[]>;
  getTests(tenantId: string): Promise<BloodTestRecordDto[]>;
  getComponents(tenantId: string): Promise<BloodComponentDto[]>;
  getRequests(tenantId: string): Promise<BloodRequestDto[]>;
  getCrossmatches(tenantId: string): Promise<BloodCrossmatchDto[]>;
  getIssues(tenantId: string): Promise<BloodIssueDto[]>;
  getTransfusions(tenantId: string): Promise<TransfusionRecordDto[]>;
  getReactions(tenantId: string): Promise<TransfusionReactionDto[]>;
  getQualityChecks(tenantId: string): Promise<BloodQualityCheckDto[]>;
  getTemperatureLogs(tenantId: string): Promise<BloodStorageTemperatureLogDto[]>;
  getDiscards(tenantId: string): Promise<BloodDiscardRecordDto[]>;
  getAuditTraces(tenantId: string): Promise<BloodBankAuditTraceDto[]>;

  createDonor(req: CreateDonorRequest): Promise<BloodDonorDto>;
  screenDonor(req: ScreenDonorRequest): Promise<BloodDonorScreeningDto>;
  createDonation(req: CreateDonationRequest): Promise<BloodDonationDto>;
  recordBloodTest(req: RecordBloodTestRequest): Promise<BloodTestRecordDto>;
  releaseBloodUnit(req: ReleaseBloodUnitRequest): Promise<BloodComponentDto>;
  createComponent(req: CreateComponentRequest): Promise<BloodComponentDto>;
  createBloodRequest(req: CreateBloodRequestRequest): Promise<BloodRequestDto>;
  createCrossmatch(req: CreateCrossmatchRequest): Promise<BloodCrossmatchDto>;
  reserveBloodUnit(req: ReserveBloodUnitRequest): Promise<BloodRequestDto>;
  issueBloodUnit(req: IssueBloodUnitRequest): Promise<BloodIssueDto>;
  recordTransfusion(req: RecordTransfusionRequest): Promise<TransfusionRecordDto>;
  recordTransfusionObservation(req: RecordTransfusionObservationRequest): Promise<TransfusionRecordDto>;
  reportTransfusionReaction(req: ReportTransfusionReactionRequest): Promise<TransfusionReactionDto>;
  returnBloodUnit(req: ReturnBloodUnitRequest): Promise<void>;
  discardBloodUnit(req: DiscardBloodUnitRequest): Promise<BloodDiscardRecordDto>;
  createQualityCheck(req: CreateQualityCheckRequest): Promise<BloodQualityCheckDto>;
  recordTemperature(req: RecordTemperatureRequest): Promise<BloodStorageTemperatureLogDto>;
  resolveStorageExcursion(req: ResolveStorageExcursionRequest): Promise<void>;
}

export class MockBloodBankManagementService implements IBloodBankManagementService {
  private facility: BloodBankFacilityDto = { ...mockBloodBankFacility };
  private donors: BloodDonorDto[] = [...mockBloodDonors];
  private screenings: BloodDonorScreeningDto[] = [...mockDonorScreenings];
  private donations: BloodDonationDto[] = [...mockBloodDonations];
  private tests: BloodTestRecordDto[] = [...mockBloodTests];
  private components: BloodComponentDto[] = [...mockBloodComponents];
  private requests: BloodRequestDto[] = [...mockBloodRequests];
  private crossmatches: BloodCrossmatchDto[] = [...mockCrossmatches];
  private issues: BloodIssueDto[] = [...mockBloodIssues];
  private transfusions: TransfusionRecordDto[] = [...mockTransfusions];
  private reactions: TransfusionReactionDto[] = [...mockReactions];
  private qualityChecks: BloodQualityCheckDto[] = [...mockQualityChecks];
  private temperatureLogs: BloodStorageTemperatureLogDto[] = [...mockTemperatureLogs];
  private discards: BloodDiscardRecordDto[] = [...mockDiscards];
  private auditTraces: BloodBankAuditTraceDto[] = [...mockBloodBankAuditTraces];

  private addTrace(actorName: string, actorRole: string, action: string, entityType: string, entityCode: string, justification: string) {
    const trace: BloodBankAuditTraceDto = {
      id: 'bba-' + Math.random().toString(36).substring(2, 9),
      tenantId: '11111111-1111-4111-8111-111111111111',
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      traceNumber: `TRACE-BB-${Date.now().toString().slice(-8)}`,
      actorId: 'usr-bb-staff',
      actorName,
      actorRole,
      action,
      entityType,
      entityId: entityCode,
      entityCode,
      justification,
      ipAddress: '127.0.0.1',
      integrityHash: 'sha256-' + Math.random().toString(36).substring(2, 18),
      previousHash: 'sha256-genesis',
      newState: { status: action, entityCode },
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(tenantId: string): Promise<BloodBankOverviewMetricsDto> {
    const available = this.components.filter((c) => c.tenantId === tenantId && c.status === 'RELEASED_USABLE');
    const quarantine = this.components.filter((c) => c.tenantId === tenantId && c.status === 'QUARANTINED');
    const prbc = available.filter((c) => c.componentType === 'PACKED_RED_BLOOD_CELLS_PRBC').length;
    const plt = available.filter((c) => c.componentType === 'RANDOM_DONOR_PLATELETS_RDP' || c.componentType === 'SINGLE_DONOR_PLATELETS_SDP').length;
    const ffp = available.filter((c) => c.componentType === 'FRESH_FROZEN_PLASMA_FFP').length;
    const pendingReqs = this.requests.filter((r) => r.tenantId === tenantId && (r.status === 'PENDING_CROSSMATCH' || r.status === 'RESERVED')).length;
    const activeXM = this.crossmatches.filter((x) => x.tenantId === tenantId && x.overallResult === 'COMPATIBLE').length;
    const rxnCount = this.reactions.filter((rx) => rx.tenantId === tenantId && (rx.status === 'REPORTED' || rx.status === 'UNDER_INVESTIGATION')).length;

    return {
      ...mockBloodBankOverviewMetrics,
      totalAvailableUnits: available.length,
      quarantineUnitsCount: quarantine.length,
      prbcStockCount: prbc,
      plateletStockCount: plt,
      ffpStockCount: ffp,
      pendingRequestsCount: pendingReqs,
      activeCrossmatchesCount: activeXM,
      reactionCasesUnderReview: rxnCount
    };
  }

  async getAnalytics(_tenantId: string): Promise<BloodBankAnalyticsDto> {
    return { ...mockBloodBankAnalytics };
  }

  async getFacility(tenantId: string): Promise<BloodBankFacilityDto> {
    return { ...this.facility, tenantId };
  }

  async getDonors(tenantId: string): Promise<BloodDonorDto[]> {
    return this.donors.filter((d) => d.tenantId === tenantId);
  }

  async getScreenings(tenantId: string): Promise<BloodDonorScreeningDto[]> {
    return this.screenings.filter((s) => s.tenantId === tenantId);
  }

  async getDonations(tenantId: string): Promise<BloodDonationDto[]> {
    return this.donations.filter((d) => d.tenantId === tenantId);
  }

  async getTests(tenantId: string): Promise<BloodTestRecordDto[]> {
    return this.tests.filter((t) => t.tenantId === tenantId);
  }

  async getComponents(tenantId: string): Promise<BloodComponentDto[]> {
    try {
      const res = await apiRequest<BloodComponentDto[]>('/api/v1/partner/blood-bank/inventory');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.components.filter((c) => c.tenantId === tenantId);
  }

  async getRequests(tenantId: string): Promise<BloodRequestDto[]> {
    return this.requests.filter((r) => r.tenantId === tenantId);
  }

  async getCrossmatches(tenantId: string): Promise<BloodCrossmatchDto[]> {
    return this.crossmatches.filter((c) => c.tenantId === tenantId);
  }

  async getIssues(tenantId: string): Promise<BloodIssueDto[]> {
    return this.issues.filter((i) => i.tenantId === tenantId);
  }

  async getTransfusions(tenantId: string): Promise<TransfusionRecordDto[]> {
    return this.transfusions.filter((t) => t.tenantId === tenantId);
  }

  async getReactions(tenantId: string): Promise<TransfusionReactionDto[]> {
    return this.reactions.filter((r) => r.tenantId === tenantId);
  }

  async getQualityChecks(tenantId: string): Promise<BloodQualityCheckDto[]> {
    return this.qualityChecks.filter((q) => q.tenantId === tenantId);
  }

  async getTemperatureLogs(tenantId: string): Promise<BloodStorageTemperatureLogDto[]> {
    return this.temperatureLogs.filter((t) => t.tenantId === tenantId);
  }

  async getDiscards(tenantId: string): Promise<BloodDiscardRecordDto[]> {
    return this.discards.filter((d) => d.tenantId === tenantId);
  }

  async getAuditTraces(tenantId: string): Promise<BloodBankAuditTraceDto[]> {
    return this.auditTraces.filter((a) => a.tenantId === tenantId);
  }

  async createDonor(req: CreateDonorRequest): Promise<BloodDonorDto> {
    try {
      const res = await apiRequest<BloodDonorDto>('/api/v1/partner/blood-bank/donors', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newDonor: BloodDonorDto = {
      id: 'bd-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      donorCode: `DNR-${Date.now().toString().slice(-6)}`,
      fullName: req.fullName,
      gender: req.gender,
      dateOfBirth: req.dateOfBirth,
      bloodGroup: req.bloodGroup,
      contactNumber: req.contactNumber,
      email: req.email,
      donorType: req.donorType,
      eligibilityStatus: 'ELIGIBLE_FOR_DONATION',
      totalDonationsCount: 0,
      nextEligibleDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    this.donors.unshift(newDonor);
    this.addTrace(req.fullName, 'DONOR_REGISTRAR', 'REGISTER_DONOR', 'BLOOD_DONOR', newDonor.donorCode, 'New blood donor registered');
    return newDonor;
  }

  async screenDonor(req: ScreenDonorRequest): Promise<BloodDonorScreeningDto> {
    const newScreening: BloodDonorScreeningDto = {
      id: 'bds-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      screeningCode: `SCR-${Date.now().toString().slice(-6)}`,
      donorId: req.donorId,
      donorName: req.donorName,
      weightKg: req.weightKg,
      hemoglobinGdl: req.hemoglobinGdl,
      systolicBp: req.systolicBp,
      diastolicBp: req.diastolicBp,
      pulseBpm: req.pulseBpm,
      temperatureF: req.temperatureF,
      medicalHistoryCleared: req.medicalHistoryCleared,
      screeningNurseName: req.screeningNurseName,
      eligibilityDecision: req.eligibilityDecision,
      remarks: req.remarks,
      screenedAt: new Date().toISOString()
    };
    this.screenings.unshift(newScreening);

    const d = this.donors.find((donor) => donor.id === req.donorId);
    if (d) {
      d.eligibilityStatus = req.eligibilityDecision;
    }
    this.addTrace(req.screeningNurseName, 'SCREENING_NURSE', 'SCREEN_DONOR', 'DONOR_SCREENING', newScreening.screeningCode, `Decision: ${req.eligibilityDecision}`);
    return newScreening;
  }

  async createDonation(req: CreateDonationRequest): Promise<BloodDonationDto> {
    try {
      const res = await apiRequest<BloodDonationDto>('/api/v1/partner/blood-bank/donations', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newDonation: BloodDonationDto = {
      id: 'bdn-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      donationNumber: `DON-${Date.now().toString().slice(-6)}`,
      donorId: req.donorId,
      donorName: req.donorName,
      bloodGroup: req.bloodGroup,
      donationType: req.donationType,
      collectedVolumeMl: req.collectedVolumeMl,
      anticoagulantType: req.anticoagulantType,
      phlebotomistName: req.phlebotomistName,
      collectionLocation: req.collectionLocation,
      unitStatus: 'QUARANTINED',
      bagBarcode: `BAG-${Date.now().toString().slice(-8)}`,
      collectedAt: new Date().toISOString()
    };
    this.donations.unshift(newDonation);

    const d = this.donors.find((donor) => donor.id === req.donorId);
    if (d) {
      d.totalDonationsCount += 1;
      d.lastDonationDate = new Date().toISOString();
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 90);
      d.nextEligibleDate = nextDate.toISOString();
    }
    this.addTrace(req.phlebotomistName, 'PHLEBOTOMIST', 'COLLECT_BLOOD', 'BLOOD_DONATION', newDonation.donationNumber, `Collected ${req.collectedVolumeMl}ml from ${req.donorName}`);
    return newDonation;
  }

  async recordBloodTest(req: RecordBloodTestRequest): Promise<BloodTestRecordDto> {
    try {
      const res = await apiRequest<BloodTestRecordDto>('/api/v1/partner/blood-bank/tests', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newTest: BloodTestRecordDto = {
      id: 'bt-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      testCode: `TST-${Date.now().toString().slice(-6)}`,
      donationId: req.donationId,
      unitBarcode: req.unitBarcode,
      aboGroupingResult: req.aboGroupingResult,
      rhFactorResult: req.rhFactorResult,
      antibodyScreen: req.antibodyScreen,
      hivResult: req.hivResult,
      hBsAgResult: req.hBsAgResult,
      hcvResult: req.hcvResult,
      syphilisVDRLResult: req.syphilisVDRLResult,
      malariaResult: req.malariaResult,
      testingTechnicianName: req.testingTechnicianName,
      pathologistSignOffName: req.pathologistSignOffName,
      isPassedForRelease: req.isPassedForRelease,
      testedAt: new Date().toISOString()
    };
    this.tests.unshift(newTest);

    const don = this.donations.find((d) => d.id === req.donationId);
    if (don) {
      don.unitStatus = req.isPassedForRelease ? 'RELEASED_USABLE' : 'DISCARDED_BIOHAZARD';
    }
    this.addTrace(req.pathologistSignOffName, 'PATHOLOGIST', 'SIGN_OFF_BLOOD_TEST', 'BLOOD_TEST', newTest.testCode, `Release Passed: ${req.isPassedForRelease}`);
    return newTest;
  }

  async releaseBloodUnit(req: ReleaseBloodUnitRequest): Promise<BloodComponentDto> {
    const comp = this.components.find((c) => c.id === req.unitId);
    if (!comp) throw new Error('Blood component unit not found');

    comp.status = 'RELEASED_USABLE';
    comp.releasedByPathologist = req.releasedByPathologist;

    this.addTrace(req.releasedByPathologist, 'PATHOLOGIST', 'RELEASE_BLOOD_UNIT', 'BLOOD_COMPONENT', comp.componentCode, req.verificationNotes);
    return comp;
  }

  async createComponent(req: CreateComponentRequest): Promise<BloodComponentDto> {
    const exp = new Date();
    if (req.componentType === 'PACKED_RED_BLOOD_CELLS_PRBC' || req.componentType === 'LEUKOREDUCED_PRBC') exp.setDate(exp.getDate() + 42);
    else if (req.componentType === 'RANDOM_DONOR_PLATELETS_RDP' || req.componentType === 'SINGLE_DONOR_PLATELETS_SDP') exp.setDate(exp.getDate() + 5);
    else if (req.componentType === 'FRESH_FROZEN_PLASMA_FFP' || req.componentType === 'CRYOPRECIPITATE') exp.setFullYear(exp.getFullYear() + 1);
    else exp.setDate(exp.getDate() + 35);

    const newComp: BloodComponentDto = {
      id: 'bc-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      componentCode: `${req.componentType.slice(0, 4)}-${Date.now().toString().slice(-6)}`,
      donationId: req.donationId,
      componentType: req.componentType,
      bloodGroup: req.bloodGroup,
      volumeMl: req.volumeMl,
      storageLocation: req.storageLocation,
      storageTemperatureTargetC: req.componentType.includes('PLATELET') ? '20°C to 24°C' : req.componentType.includes('PLASMA') ? '-30°C to -40°C' : '2°C to 6°C',
      expiryDate: exp.toISOString(),
      status: 'RELEASED_USABLE',
      preparedByTechnician: req.preparedByTechnician,
      createdAt: new Date().toISOString()
    };
    this.components.unshift(newComp);
    this.addTrace(req.preparedByTechnician, 'BLOOD_BANK_TECHNOLOGIST', 'SEPARATE_COMPONENT', 'BLOOD_COMPONENT', newComp.componentCode, `Prepared ${req.componentType} (${req.volumeMl}ml)`);
    return newComp;
  }

  async createBloodRequest(req: CreateBloodRequestRequest): Promise<BloodRequestDto> {
    try {
      const res = await apiRequest<BloodRequestDto>('/api/v1/partner/blood-bank/requests', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newReq: BloodRequestDto = {
      id: 'breq-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      requestCode: `REQ-${Date.now().toString().slice(-6)}`,
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      encounterId: req.encounterId,
      requestingDepartment: req.requestingDepartment,
      orderingPhysicianName: req.orderingPhysicianName,
      requestedComponentType: req.requestedComponentType,
      patientBloodGroup: req.patientBloodGroup,
      quantityUnits: req.quantityUnits,
      urgency: req.urgency,
      clinicalIndication: req.clinicalIndication,
      requiredByTimestamp: req.requiredByTimestamp,
      status: 'PENDING_CROSSMATCH',
      requestedAt: new Date().toISOString()
    };
    this.requests.unshift(newReq);
    this.addTrace(req.orderingPhysicianName, 'ORDERING_PHYSICIAN', 'ORDER_BLOOD', 'BLOOD_REQUEST', newReq.requestCode, req.clinicalIndication);
    return newReq;
  }

  async createCrossmatch(req: CreateCrossmatchRequest): Promise<BloodCrossmatchDto> {
    try {
      const res = await apiRequest<BloodCrossmatchDto>('/api/v1/partner/blood-bank/crossmatch', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const exp = new Date();
    exp.setDate(exp.getDate() + 3);

    const newXm: BloodCrossmatchDto = {
      id: 'bxm-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      crossmatchCode: `XM-${Date.now().toString().slice(-6)}`,
      requestId: req.requestId,
      componentId: req.componentId,
      componentCode: req.componentCode,
      patientName: req.patientName,
      patientBloodGroup: req.patientBloodGroup,
      donorBloodGroup: req.donorBloodGroup,
      majorCrossmatchResult: req.majorCrossmatchResult,
      minorCrossmatchResult: req.minorCrossmatchResult,
      coombsTestResult: req.coombsTestResult,
      overallResult: req.overallResult,
      testingTechnicianName: req.testingTechnicianName,
      verifiedByPathologist: req.verifiedByPathologist,
      crossmatchedAt: new Date().toISOString(),
      expiresAt: exp.toISOString()
    };
    this.crossmatches.unshift(newXm);

    if (req.overallResult === 'COMPATIBLE') {
      const comp = this.components.find((c) => c.id === req.componentId);
      if (comp) comp.status = 'RESERVED_FOR_PATIENT';
      const r = this.requests.find((reqItem) => reqItem.id === req.requestId);
      if (r) r.status = 'RESERVED';
    }
    this.addTrace(req.verifiedByPathologist, 'PATHOLOGIST', 'VERIFY_CROSSMATCH', 'CROSSMATCH', newXm.crossmatchCode, `Result: ${req.overallResult}`);
    return newXm;
  }

  async reserveBloodUnit(req: ReserveBloodUnitRequest): Promise<BloodRequestDto> {
    const r = this.requests.find((reqItem) => reqItem.id === req.requestId);
    if (!r) throw new Error('Blood request not found');

    const comp = this.components.find((c) => c.id === req.componentId);
    if (comp) comp.status = 'RESERVED_FOR_PATIENT';

    r.status = 'RESERVED';
    this.addTrace(req.reservedByStaff, 'BLOOD_BANK_TECHNOLOGIST', 'RESERVE_BLOOD_UNIT', 'BLOOD_RESERVATION', r.requestCode, `Reserved unit for ${r.patientName}`);
    return r;
  }

  async issueBloodUnit(req: IssueBloodUnitRequest): Promise<BloodIssueDto> {
    try {
      const res = await apiRequest<BloodIssueDto>('/api/v1/partner/blood-bank/issue', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newIssue: BloodIssueDto = {
      id: 'bi-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      issueCode: `ISS-${Date.now().toString().slice(-6)}`,
      requestId: req.requestId,
      componentId: req.componentId,
      componentCode: req.componentCode,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      destinationDepartment: req.destinationDepartment,
      issuingTechnicianName: req.issuingTechnicianName,
      receivingNurseName: req.receivingNurseName,
      transportBoxTemperatureC: req.transportBoxTemperatureC,
      issuedAt: new Date().toISOString()
    };
    this.issues.unshift(newIssue);

    const comp = this.components.find((c) => c.id === req.componentId);
    if (comp) comp.status = 'ISSUED_TO_DEPARTMENT';

    const r = this.requests.find((reqItem) => reqItem.id === req.requestId);
    if (r) r.status = 'COMPLETED';

    this.addTrace(req.issuingTechnicianName, 'BLOOD_BANK_TECHNOLOGIST', 'ISSUE_BLOOD_UNIT', 'BLOOD_ISSUE', newIssue.issueCode, `Issued to ${req.destinationDepartment} received by ${req.receivingNurseName}`);
    return newIssue;
  }

  async recordTransfusion(req: RecordTransfusionRequest): Promise<TransfusionRecordDto> {
    try {
      const res = await apiRequest<TransfusionRecordDto>('/api/v1/partner/blood-bank/transfusions', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newTx: TransfusionRecordDto = {
      id: 'tr-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      transfusionCode: `TXF-${Date.now().toString().slice(-6)}`,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      encounterId: req.encounterId,
      componentCode: req.componentCode,
      componentType: req.componentType,
      bloodGroup: req.bloodGroup,
      administeredByNurse: req.administeredByNurse,
      supervisingDoctorName: req.supervisingDoctorName,
      startTime: req.startTime,
      preTransfusionPulse: req.preTransfusionPulse,
      preTransfusionBp: req.preTransfusionBp,
      preTransfusionTempF: req.preTransfusionTempF,
      adverseReactionNoted: false,
      status: 'IN_PROGRESS'
    };
    this.transfusions.unshift(newTx);
    this.addTrace(req.administeredByNurse, 'TRANSFUSION_NURSE', 'START_TRANSFUSION', 'TRANSFUSION_RECORD', newTx.transfusionCode, `Administering ${req.componentType} to ${req.patientName}`);
    return newTx;
  }

  async recordTransfusionObservation(req: RecordTransfusionObservationRequest): Promise<TransfusionRecordDto> {
    const tx = this.transfusions.find((t) => t.id === req.transfusionId);
    if (!tx) throw new Error('Transfusion record not found');

    tx.endTime = req.endTime;
    tx.postTransfusionPulse = req.postTransfusionPulse;
    tx.postTransfusionBp = req.postTransfusionBp;
    tx.postTransfusionTempF = req.postTransfusionTempF;
    tx.adverseReactionNoted = req.adverseReactionNoted;
    tx.status = req.status;
    tx.outcomeNotes = req.outcomeNotes;

    this.addTrace(tx.administeredByNurse, 'TRANSFUSION_NURSE', 'COMPLETE_TRANSFUSION_OBSERVATION', 'TRANSFUSION_RECORD', tx.transfusionCode, req.outcomeNotes || 'Transfusion completed');
    return tx;
  }

  async reportTransfusionReaction(req: ReportTransfusionReactionRequest): Promise<TransfusionReactionDto> {
    const newRxn: TransfusionReactionDto = {
      id: 'trx-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      reactionReportCode: `RXN-${Date.now().toString().slice(-6)}`,
      transfusionId: req.transfusionId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      componentCode: req.componentCode,
      severity: req.severity,
      symptomsObserved: req.symptomsObserved,
      immediateInterventions: req.immediateInterventions,
      notifiedPhysicianName: req.notifiedPhysicianName,
      clericalCheckConfirmedMatching: req.clericalCheckConfirmedMatching,
      status: 'REPORTED',
      reportedAt: new Date().toISOString()
    };
    this.reactions.unshift(newRxn);

    const tx = this.transfusions.find((t) => t.id === req.transfusionId);
    if (tx) {
      tx.adverseReactionNoted = true;
      tx.status = 'HALTED_DUE_TO_REACTION';
    }
    this.addTrace(req.notifiedPhysicianName, 'ATTENDING_PHYSICIAN', 'REPORT_TRANSFUSION_REACTION', 'TRANSFUSION_REACTION', newRxn.reactionReportCode, req.symptomsObserved);
    return newRxn;
  }

  async returnBloodUnit(req: ReturnBloodUnitRequest): Promise<void> {
    const comp = this.components.find((c) => c.id === req.componentId);
    if (comp) {
      comp.status = req.reEntryApproved ? 'RELEASED_USABLE' : 'DISCARDED_BIOHAZARD';
    }
    this.addTrace(req.evaluatingOfficer, 'BLOOD_BANK_OFFICER', 'PROCESS_BLOOD_RETURN', 'BLOOD_COMPONENT', req.componentId, `Re-entry Approved: ${req.reEntryApproved}`);
  }

  async discardBloodUnit(req: DiscardBloodUnitRequest): Promise<BloodDiscardRecordDto> {
    const newDiscard: BloodDiscardRecordDto = {
      id: 'bdr-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      discardCode: `DISC-${Date.now().toString().slice(-6)}`,
      componentCode: req.componentCode,
      componentType: req.componentType,
      bloodGroup: req.bloodGroup,
      reason: req.reason,
      authorizedByPathologist: req.authorizedByPathologist,
      disposalMethod: req.disposalMethod,
      discardedAt: new Date().toISOString()
    };
    this.discards.unshift(newDiscard);

    const comp = this.components.find((c) => c.componentCode === req.componentCode);
    if (comp) comp.status = 'DISCARDED_BIOHAZARD';

    this.addTrace(req.authorizedByPathologist, 'PATHOLOGIST', 'DISCARD_BLOOD_UNIT', 'BLOOD_DISCARD', newDiscard.discardCode, `Reason: ${req.reason}`);
    return newDiscard;
  }

  async createQualityCheck(req: CreateQualityCheckRequest): Promise<BloodQualityCheckDto> {
    const newQC: BloodQualityCheckDto = {
      id: 'bqc-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      qcCode: `QC-${Date.now().toString().slice(-6)}`,
      equipmentName: req.equipmentName,
      checkType: req.checkType,
      parameterMeasured: req.parameterMeasured,
      expectedStandard: req.expectedStandard,
      actualReading: req.actualReading,
      isPassed: req.isPassed,
      technicianName: req.technicianName,
      checkedAt: new Date().toISOString()
    };
    this.qualityChecks.unshift(newQC);
    this.addTrace(req.technicianName, 'QC_TECHNOLOGIST', 'PERFORM_QC_CHECK', 'QUALITY_CHECK', newQC.qcCode, `Passed: ${req.isPassed}`);
    return newQC;
  }

  async recordTemperature(req: RecordTemperatureRequest): Promise<BloodStorageTemperatureLogDto> {
    const isExcursion = req.recordedTemperatureC < req.targetMinC || req.recordedTemperatureC > req.targetMaxC;
    const newLog: BloodStorageTemperatureLogDto = {
      id: 'btl-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      unitLocation: req.unitLocation,
      storageUnitType: req.storageUnitType,
      recordedTemperatureC: req.recordedTemperatureC,
      targetMinC: req.targetMinC,
      targetMaxC: req.targetMaxC,
      isExcursion,
      recordedAt: new Date().toISOString()
    };
    this.temperatureLogs.unshift(newLog);
    if (isExcursion) {
      this.addTrace('SYSTEM_TEMPERATURE_PROBE', 'AUTOMATED_PROBE', 'TEMPERATURE_EXCURSION_ALERT', 'STORAGE_MONITOR', req.unitLocation, `Temperature ${req.recordedTemperatureC}°C outside range [${req.targetMinC}°C, ${req.targetMaxC}°C]`);
    }
    return newLog;
  }

  async resolveStorageExcursion(req: ResolveStorageExcursionRequest): Promise<void> {
    const log = this.temperatureLogs.find((l) => l.id === req.logId);
    if (log) log.isExcursion = false;
    this.addTrace(req.resolvedByOfficer, 'STORAGE_OFFICER', 'RESOLVE_STORAGE_EXCURSION', 'STORAGE_LOG', req.logId, req.correctiveActionTaken);
  }
}

export const bloodBankManagementService = new MockBloodBankManagementService();
