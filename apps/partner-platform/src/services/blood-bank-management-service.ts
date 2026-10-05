import { apiRequest, isMockFallbackAllowed } from './api-client.js';
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

export class MockBloodBankManagementService implements IBloodBankManagementService {
  private facility: BloodBankFacilityDto = { ...mockBloodBankFacility };
  private donors: BloodDonorDto[] = loadStored('docsearch_blood_donors', mockBloodDonors);
  private screenings: BloodDonorScreeningDto[] = loadStored('docsearch_blood_donor_screenings', mockDonorScreenings);
  private donations: BloodDonationDto[] = loadStored('docsearch_blood_donations', mockBloodDonations);
  private tests: BloodTestRecordDto[] = loadStored('docsearch_blood_tests', mockBloodTests);
  private components: BloodComponentDto[] = loadStored('docsearch_blood_components', mockBloodComponents);
  private requests: BloodRequestDto[] = loadStored('docsearch_blood_requests', mockBloodRequests);
  private crossmatches: BloodCrossmatchDto[] = loadStored('docsearch_blood_crossmatches', mockCrossmatches);
  private issues: BloodIssueDto[] = loadStored('docsearch_blood_issues', mockBloodIssues);
  private transfusions: TransfusionRecordDto[] = loadStored('docsearch_blood_transfusions', mockTransfusions);
  private reactions: TransfusionReactionDto[] = loadStored('docsearch_blood_reactions', mockReactions);
  private qualityChecks: BloodQualityCheckDto[] = loadStored('docsearch_blood_quality_checks', mockQualityChecks);
  private temperatureLogs: BloodStorageTemperatureLogDto[] = loadStored('docsearch_blood_temperature_logs', mockTemperatureLogs);
  private discards: BloodDiscardRecordDto[] = loadStored('docsearch_blood_discards', mockDiscards);
  private auditTraces: BloodBankAuditTraceDto[] = [...mockBloodBankAuditTraces];

  private addTrace(actorName: string, actorRole: string, action: string, entityType: string, entityCode: string, justification: string, tenantId = '11111111-1111-4111-8111-111111111111') {
    const trace: BloodBankAuditTraceDto = {
      id: 'bba-' + Math.random().toString(36).substring(2, 9),
      tenantId,
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
    try {
      const res = await apiRequest<BloodBankOverviewMetricsDto>('/api/v1/partner/blood-bank/overview');
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
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
    try {
      const res = await apiRequest<BloodDonorDto[]>('/api/v1/partner/blood-bank/donors');
      if (res.success && Array.isArray(res.data)) {
        this.donors = res.data;
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.donors.filter((d) => d.tenantId === tenantId);
  }

  async getScreenings(tenantId: string): Promise<BloodDonorScreeningDto[]> {
    return this.screenings.filter((s) => s.tenantId === tenantId);
  }

  async getDonations(tenantId: string): Promise<BloodDonationDto[]> {
    try {
      const res = await apiRequest<BloodDonationDto[]>('/api/v1/partner/blood-bank/donations');
      if (res.success && Array.isArray(res.data)) {
        this.donations = res.data;
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.donations.filter((d) => d.tenantId === tenantId);
  }

  async getTests(tenantId: string): Promise<BloodTestRecordDto[]> {
    return this.tests.filter((t) => t.tenantId === tenantId);
  }

  async getComponents(tenantId: string): Promise<BloodComponentDto[]> {
    try {
      const res = await apiRequest<BloodComponentDto[]>('/api/v1/partner/blood-bank/inventory');
      if (res.success && Array.isArray(res.data)) {
        this.components = res.data;
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.components.filter((c) => c.tenantId === tenantId);
  }

  async getRequests(tenantId: string): Promise<BloodRequestDto[]> {
    try {
      const res = await apiRequest<BloodRequestDto[]>('/api/v1/partner/blood-bank/requests');
      if (res.success && Array.isArray(res.data)) {
        this.requests = res.data;
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.requests.filter((r) => r.tenantId === tenantId);
  }

  async getCrossmatches(tenantId: string): Promise<BloodCrossmatchDto[]> {
    try {
      const res = await apiRequest<BloodCrossmatchDto[]>('/api/v1/partner/blood-bank/crossmatches');
      if (res.success && Array.isArray(res.data)) {
        this.crossmatches = res.data;
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.crossmatches.filter((c) => c.tenantId === tenantId);
  }

  async getIssues(tenantId: string): Promise<BloodIssueDto[]> {
    try {
      const res = await apiRequest<BloodIssueDto[]>('/api/v1/partner/blood-bank/issues');
      if (res.success && Array.isArray(res.data)) {
        this.issues = res.data;
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.issues.filter((i) => i.tenantId === tenantId);
  }

  async getTransfusions(tenantId: string): Promise<TransfusionRecordDto[]> {
    try {
      const res = await apiRequest<TransfusionRecordDto[]>('/api/v1/partner/blood-bank/transfusions');
      if (res.success && Array.isArray(res.data)) {
        this.transfusions = res.data;
        return res.data;
      }
    } catch {
      // Fallback
    }
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
        this.donors.unshift(res.data);
        saveStored('docsearch_blood_donors', this.donors);
        return res.data;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Failed to register blood donor on server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Blood donor registration network error');
      }
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
    saveStored('docsearch_blood_donors', this.donors);
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
    saveStored('docsearch_blood_donor_screenings', this.screenings);

    const d = this.donors.find((donor) => donor.id === req.donorId);
    if (d) {
      d.eligibilityStatus = req.eligibilityDecision;
      saveStored('docsearch_blood_donors', this.donors);
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
        this.donations.unshift(res.data);
        saveStored('docsearch_blood_donations', this.donations);
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
    saveStored('docsearch_blood_donations', this.donations);

    const d = this.donors.find((donor) => donor.id === req.donorId);
    if (d) {
      d.totalDonationsCount += 1;
      d.lastDonationDate = new Date().toISOString();
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 90);
      d.nextEligibleDate = nextDate.toISOString();
      saveStored('docsearch_blood_donors', this.donors);
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
        this.tests.unshift(res.data);
        saveStored('docsearch_blood_tests', this.tests);
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
    saveStored('docsearch_blood_tests', this.tests);

    const don = this.donations.find((d) => d.id === req.donationId);
    if (don) {
      don.unitStatus = req.isPassedForRelease ? 'RELEASED_USABLE' : 'DISCARDED_BIOHAZARD';
      saveStored('docsearch_blood_donations', this.donations);
    }
    this.addTrace(req.pathologistSignOffName, 'PATHOLOGIST', 'SIGN_OFF_BLOOD_TEST', 'BLOOD_TEST', newTest.testCode, `Release Passed: ${req.isPassedForRelease}`);
    return newTest;
  }

  async releaseBloodUnit(req: ReleaseBloodUnitRequest): Promise<BloodComponentDto> {
    const comp = this.components.find((c) => c.id === req.unitId);
    if (!comp) throw new Error('Blood component unit not found');

    comp.status = 'RELEASED_USABLE';
    comp.releasedByPathologist = req.releasedByPathologist;
    saveStored('docsearch_blood_components', this.components);

    this.addTrace(req.releasedByPathologist, 'PATHOLOGIST', 'RELEASE_BLOOD_UNIT', 'BLOOD_COMPONENT', comp.componentCode, req.verificationNotes);
    return comp;
  }

  async createComponent(req: CreateComponentRequest): Promise<BloodComponentDto> {
    try {
      const res = await apiRequest<BloodComponentDto>('/api/v1/partner/blood-bank/components/separate', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.components.unshift(res.data);
        saveStored('docsearch_blood_components', this.components);
        return res.data;
      }
    } catch {
      // Fallback
    }

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
    saveStored('docsearch_blood_components', this.components);
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
        this.requests.unshift(res.data);
        saveStored('docsearch_blood_requests', this.requests);
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
    saveStored('docsearch_blood_requests', this.requests);
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
        this.crossmatches.unshift(res.data);
        saveStored('docsearch_blood_crossmatches', this.crossmatches);
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
    saveStored('docsearch_blood_crossmatches', this.crossmatches);

    if (req.overallResult === 'COMPATIBLE') {
      const comp = this.components.find((c) => c.id === req.componentId);
      if (comp) {
        comp.status = 'RESERVED_FOR_PATIENT';
        saveStored('docsearch_blood_components', this.components);
      }
      const r = this.requests.find((reqItem) => reqItem.id === req.requestId);
      if (r) {
        r.status = 'RESERVED';
        saveStored('docsearch_blood_requests', this.requests);
      }
    }
    this.addTrace(req.verifiedByPathologist, 'PATHOLOGIST', 'VERIFY_CROSSMATCH', 'CROSSMATCH', newXm.crossmatchCode, `Result: ${req.overallResult}`);
    return newXm;
  }

  async reserveBloodUnit(req: ReserveBloodUnitRequest): Promise<BloodRequestDto> {
    const r = this.requests.find((reqItem) => reqItem.id === req.requestId);
    if (!r) throw new Error('Blood request not found');

    const comp = this.components.find((c) => c.id === req.componentId);
    if (comp) {
      comp.status = 'RESERVED_FOR_PATIENT';
      saveStored('docsearch_blood_components', this.components);
    }

    r.status = 'RESERVED';
    saveStored('docsearch_blood_requests', this.requests);
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
        this.issues.unshift(res.data);
        saveStored('docsearch_blood_issues', this.issues);
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
    saveStored('docsearch_blood_issues', this.issues);

    const comp = this.components.find((c) => c.id === req.componentId);
    if (comp) {
      comp.status = 'ISSUED_TO_DEPARTMENT';
      saveStored('docsearch_blood_components', this.components);
    }

    const r = this.requests.find((reqItem) => reqItem.id === req.requestId);
    if (r) {
      r.status = 'COMPLETED';
      saveStored('docsearch_blood_requests', this.requests);
    }

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
        this.transfusions.unshift(res.data);
        saveStored('docsearch_blood_transfusions', this.transfusions);
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
    saveStored('docsearch_blood_transfusions', this.transfusions);
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
    saveStored('docsearch_blood_transfusions', this.transfusions);

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
    saveStored('docsearch_blood_reactions', this.reactions);

    const tx = this.transfusions.find((t) => t.id === req.transfusionId);
    if (tx) {
      tx.adverseReactionNoted = true;
      tx.status = 'HALTED_DUE_TO_REACTION';
      saveStored('docsearch_blood_transfusions', this.transfusions);
    }
    this.addTrace(req.notifiedPhysicianName, 'ATTENDING_PHYSICIAN', 'REPORT_TRANSFUSION_REACTION', 'TRANSFUSION_REACTION', newRxn.reactionReportCode, req.symptomsObserved);
    return newRxn;
  }

  async returnBloodUnit(req: ReturnBloodUnitRequest): Promise<void> {
    const comp = this.components.find((c) => c.id === req.componentId);
    if (comp) {
      comp.status = req.reEntryApproved ? 'RELEASED_USABLE' : 'DISCARDED_BIOHAZARD';
      saveStored('docsearch_blood_components', this.components);
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
    saveStored('docsearch_blood_discards', this.discards);

    const comp = this.components.find((c) => c.componentCode === req.componentCode);
    if (comp) {
      comp.status = 'DISCARDED_BIOHAZARD';
      saveStored('docsearch_blood_components', this.components);
    }

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
    saveStored('docsearch_blood_quality_checks', this.qualityChecks);
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
    saveStored('docsearch_blood_temperature_logs', this.temperatureLogs);
    if (isExcursion) {
      this.addTrace('SYSTEM_TEMPERATURE_PROBE', 'AUTOMATED_PROBE', 'TEMPERATURE_EXCURSION_ALERT', 'STORAGE_MONITOR', req.unitLocation, `Temperature ${req.recordedTemperatureC}°C outside range [${req.targetMinC}°C, ${req.targetMaxC}°C]`);
    }
    return newLog;
  }

  async resolveStorageExcursion(req: ResolveStorageExcursionRequest): Promise<void> {
    const log = this.temperatureLogs.find((l) => l.id === req.logId);
    if (log) {
      log.isExcursion = false;
      saveStored('docsearch_blood_temperature_logs', this.temperatureLogs);
    }
    this.addTrace(req.resolvedByOfficer, 'STORAGE_OFFICER', 'RESOLVE_STORAGE_EXCURSION', 'STORAGE_LOG', req.logId, req.correctiveActionTaken);
  }
}

function mapToBloodComponentDto(c: any): BloodComponentDto {
  const componentTypeMap: Record<string, any> = {
    PRBC: 'PACKED_RED_BLOOD_CELLS_PRBC',
    FFP: 'FRESH_FROZEN_PLASMA_FFP',
    PLATELETS: 'PLATELET_CONCENTRATE_RDP',
    WHOLE_BLOOD: 'WHOLE_BLOOD',
    CRYOPRECIPITATE: 'CRYOPRECIPITATE'
  };
  return {
    id: String(c.id || ''),
    tenantId: String(c.tenantId || ''),
    partnerId: String(c.partnerId || ''),
    organizationId: String(c.organizationId || ''),
    branchId: String(c.branchId || ''),
    componentCode: String(c.componentCode || `BC-${String(c.id || '').slice(0, 6)}`),
    donationId: String(c.donationId || ''),
    componentType: (componentTypeMap[c.componentType] || c.componentType || 'PACKED_RED_BLOOD_CELLS_PRBC') as any,
    bloodGroup: (c.bloodGroup || 'O_POSITIVE') as any,
    volumeMl: Number(c.volumeMl || 350),
    storageLocation: c.storageLocation || 'Blood Refrigerator #1',
    storageTemperatureTargetC: c.storageTemperatureTargetC || '2°C to 6°C',
    expiryDate: typeof c.expiryDate === 'string' ? c.expiryDate : (c.expiryDate ? new Date(c.expiryDate).toISOString() : new Date(Date.now() + 35 * 86400000).toISOString()),
    status: (c.status === 'AVAILABLE' ? 'TESTED_SAFE_AVAILABLE' : c.status === 'ISSUED' ? 'ISSUED_TO_DEPARTMENT' : c.status === 'RESERVED' ? 'RESERVED_FOR_PATIENT' : (c.status || 'AVAILABLE')) as any,
    preparedByTechnician: c.preparedByTechnician || 'Blood Bank Technologist',
    releasedByPathologist: c.releasedByPathologist || 'Medical Officer',
    createdAt: typeof c.createdAt === 'string' ? c.createdAt : (c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString())
  };
}

function mapToBloodDonorDto(d: any): BloodDonorDto {
  return {
    id: String(d.id || ''),
    tenantId: String(d.tenantId || ''),
    partnerId: String(d.partnerId || ''),
    organizationId: String(d.organizationId || ''),
    branchId: String(d.branchId || ''),
    donorCode: String(d.donorCode || `DNR-${String(d.id || '').slice(0, 6)}`),
    fullName: String(d.fullName || 'Blood Donor'),
    gender: String(d.gender || 'OTHER'),
    dateOfBirth: typeof d.dateOfBirth === 'string' ? d.dateOfBirth : '1990-01-01',
    bloodGroup: (d.bloodGroup || 'O_POSITIVE') as any,
    contactNumber: String(d.contactNumber || '9999999999'),
    donorType: (d.donorType || 'VOLUNTARY_NON_REMUNERATED') as any,
    eligibilityStatus: (d.eligibilityStatus || 'ELIGIBLE_FOR_DONATION') as any,
    totalDonationsCount: Number(d.totalDonationsCount || 1),
    lastDonationDate: d.lastDonationDate || undefined,
    nextEligibleDate: typeof d.nextEligibleDate === 'string' ? d.nextEligibleDate : new Date(Date.now() + 90 * 86400000).toISOString(),
    createdAt: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString()
  };
}

function mapToBloodDonationDto(d: any): BloodDonationDto {
  return {
    id: String(d.id || ''),
    tenantId: String(d.tenantId || ''),
    partnerId: String(d.partnerId || ''),
    organizationId: String(d.organizationId || ''),
    branchId: String(d.branchId || ''),
    donationNumber: String(d.donationNumber || `DON-${String(d.id || '').slice(0, 6)}`),
    donorId: String(d.donorId || ''),
    donorName: String(d.donorName || 'Donor'),
    bloodGroup: (d.bloodGroup || 'O_POSITIVE') as any,
    donationType: (d.donationType || 'VOLUNTARY_NON_REMUNERATED') as any,
    collectedVolumeMl: Number(d.collectedVolumeMl || 450),
    anticoagulantType: String(d.anticoagulantType || 'CPDA-1'),
    bagBarcode: String(d.bagBarcode || `BAG-${String(d.id || '').slice(0, 6)}`),
    phlebotomistName: String(d.phlebotomistName || 'Phlebotomist'),
    collectionLocation: String(d.collectionLocation || 'Main Blood Bank'),
    unitStatus: (d.unitStatus || d.status || 'COLLECTED') as any,
    collectedAt: typeof d.collectedAt === 'string' ? d.collectedAt : (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString())
  };
}

export class BloodBankManagementService extends MockBloodBankManagementService implements IBloodBankManagementService {
  override async getComponents(tenantId: string): Promise<BloodComponentDto[]> {
    try {
      const res = await apiRequest<any[]>('/api/v1/partner/blood-bank/inventory');
      if (res.success && Array.isArray(res.data)) {
        return res.data.map(mapToBloodComponentDto);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.getComponents(tenantId);
  }

  override async createDonor(req: CreateDonorRequest): Promise<BloodDonorDto> {
    try {
      const res = await apiRequest<any>('/api/v1/partner/blood-bank/donors', {
        method: 'POST',
        body: JSON.stringify({
          fullName: req.fullName,
          dateOfBirth: req.dateOfBirth,
          gender: req.gender,
          bloodGroup: req.bloodGroup,
          contactNumber: req.contactNumber,
          address: 'Registered donor facility'
        })
      });
      if (res.success && res.data) {
        return mapToBloodDonorDto(res.data);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.createDonor(req);
  }

  override async createDonation(req: CreateDonationRequest): Promise<BloodDonationDto> {
    try {
      const res = await apiRequest<any>('/api/v1/partner/blood-bank/donations', {
        method: 'POST',
        body: JSON.stringify({
          donorId: req.donorId,
          bloodGroup: req.bloodGroup,
          donationType: req.donationType,
          volumeMl: req.collectedVolumeMl,
          bagBarcode: `BAG-${Date.now().toString().slice(-6)}`
        })
      });
      if (res.success && res.data) {
        return mapToBloodDonationDto(res.data);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.createDonation(req);
  }

  override async createComponent(req: CreateComponentRequest): Promise<BloodComponentDto> {
    try {
      const compTypeShort = req.componentType === 'PACKED_RED_BLOOD_CELLS_PRBC' ? 'PRBC' : req.componentType === 'FRESH_FROZEN_PLASMA_FFP' ? 'FFP' : req.componentType === 'RANDOM_DONOR_PLATELETS_RDP' || req.componentType === 'SINGLE_DONOR_PLATELETS_SDP' ? 'PLATELETS' : 'PRBC';
      const res = await apiRequest<any>('/api/v1/partner/blood-bank/components/separate', {
        method: 'POST',
        body: JSON.stringify({
          donationId: req.donationId,
          componentType: compTypeShort,
          bloodGroup: req.bloodGroup,
          volumeMl: req.volumeMl,
          storageLocation: req.storageLocation,
          expiryDays: 35
        })
      });
      if (res.success && res.data) {
        return mapToBloodComponentDto(res.data);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.createComponent(req);
  }

  override async recordBloodTest(req: RecordBloodTestRequest): Promise<BloodTestRecordDto> {
    try {
      await apiRequest<any>('/api/v1/partner/blood-bank/tests', {
        method: 'POST',
        body: JSON.stringify({
          donationId: req.donationId,
          testType: 'SEROLOGY_ELISA',
          result: req.isPassedForRelease ? 'NEGATIVE' : 'POSITIVE',
          isReactive: !req.isPassedForRelease
        })
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.recordBloodTest(req);
  }

  override async createBloodRequest(req: CreateBloodRequestRequest): Promise<BloodRequestDto> {
    try {
      const compTypeShort = req.requestedComponentType === 'PACKED_RED_BLOOD_CELLS_PRBC' ? 'PRBC' : req.requestedComponentType === 'FRESH_FROZEN_PLASMA_FFP' ? 'FFP' : req.requestedComponentType === 'RANDOM_DONOR_PLATELETS_RDP' || req.requestedComponentType === 'SINGLE_DONOR_PLATELETS_SDP' ? 'PLATELETS' : 'PRBC';
      const res = await apiRequest<any>('/api/v1/partner/blood-bank/requests', {
        method: 'POST',
        body: JSON.stringify({
          patientId: req.patientId,
          componentType: compTypeShort,
          bloodGroup: req.patientBloodGroup,
          unitsRequested: req.quantityUnits,
          urgency: req.urgency,
          indication: req.clinicalIndication
        })
      });
      if (res.success && res.data) {
        return {
          id: res.data.id || String(Math.random()),
          tenantId: req.tenantId,
          partnerId: req.partnerId,
          organizationId: req.organizationId,
          branchId: req.branchId,
          requestCode: res.data.requestNumber || res.data.requestCode || `REQ-${Date.now().toString().slice(-6)}`,
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
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.createBloodRequest(req);
  }

  override async createCrossmatch(req: CreateCrossmatchRequest): Promise<BloodCrossmatchDto> {
    try {
      await apiRequest<any>('/api/v1/partner/blood-bank/crossmatch', {
        method: 'POST',
        body: JSON.stringify({
          bloodRequestId: req.requestId,
          componentId: req.componentId,
          compatibilityResult: req.overallResult === 'COMPATIBLE' ? 'COMPATIBLE' : 'INCOMPATIBLE',
          method: 'COOMBS_GEL_CARD'
        })
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.createCrossmatch(req);
  }

  override async issueBloodUnit(req: IssueBloodUnitRequest): Promise<BloodIssueDto> {
    try {
      await apiRequest<any>('/api/v1/partner/blood-bank/issue', {
        method: 'POST',
        body: JSON.stringify({
          bloodRequestId: req.requestId,
          componentId: req.componentId,
          recipientPatientId: req.patientMrn,
          destinationWard: req.destinationDepartment
        })
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.issueBloodUnit(req);
  }

  override async recordTransfusion(req: RecordTransfusionRequest): Promise<TransfusionRecordDto> {
    try {
      await apiRequest<any>('/api/v1/partner/blood-bank/transfusions', {
        method: 'POST',
        body: JSON.stringify({
          bloodRequestId: req.encounterId,
          componentId: req.componentCode,
          vitalSignsBefore: {
            pulse: req.preTransfusionPulse,
            bp: req.preTransfusionBp,
            tempF: req.preTransfusionTempF
          }
        })
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.recordTransfusion(req);
  }
}

export const bloodBankManagementService = new BloodBankManagementService();

