import {
  getDatabase,
  bloodDonors,
  bloodDonations,
  bloodComponents,
  bloodTests,
  bloodRequests,
  bloodCrossmatches,
  bloodIssues,
  transfusionRecords,
  eq,
  and,
  desc
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('partner-blood-bank-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for blood bank transaction');
    throw new AppError({
      message: 'Database service is unavailable. Blood bank transactions are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

export interface RegisterDonorInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  bloodGroup: string; // A_POSITIVE, O_POSITIVE, B_NEGATIVE, etc.
  donorType?: string; // VOLUNTARY, REPLACEMENT
  screeningPassed: boolean;
  hemoglobinGdl?: number;
}

export interface CollectDonationInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  donorId: string;
  bagBarcode: string;
  bloodGroup: string;
  donationType?: string;
  volumeMl?: number;
  anticoagulant?: string;
}

export interface SeparateComponentsInput {
  tenantId: string;
  donationId: string;
  donorId: string;
  parentBagBarcode: string;
  bloodGroup: string;
}

export interface RecordBloodTestInput {
  tenantId: string;
  donationId: string;
  testedBy: string;
  hivResult: 'NON_REACTIVE' | 'REACTIVE';
  hbsagResult: 'NON_REACTIVE' | 'REACTIVE';
  hcvResult: 'NON_REACTIVE' | 'REACTIVE';
  syphilisResult: 'NON_REACTIVE' | 'REACTIVE';
  malariaResult: 'NEGATIVE' | 'POSITIVE';
  aboRhConfirmation: string;
  overallStatus: 'TESTED_SAFE' | 'REACTIVE_DISCARD';
}

export interface CreateBloodRequestInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientId: string;
  doctorId: string;
  encounterId?: string;
  bloodGroup: string;
  componentType: 'PRBC' | 'FFP' | 'PLATELETS' | 'WHOLE_BLOOD' | 'CRYOPRECIPITATE';
  unitsRequested: number;
  urgency: 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY';
  clinicalIndication: string;
}

export interface PerformCrossmatchInput {
  tenantId: string;
  requestId: string;
  componentId: string;
  patientId: string;
  technicianId: string;
  crossmatchMethod?: string;
  compatibilityResult: 'COMPATIBLE' | 'INCOMPATIBLE';
  crossmatchNotes: string;
}

export interface IssueBloodUnitInput {
  tenantId: string;
  requestId: string;
  componentId: string;
  patientId: string;
  issuedToStaff: string;
  issuedBy: string;
  storageTempCelsius?: number;
}

export interface RecordTransfusionInput {
  tenantId: string;
  requestId: string;
  componentId: string;
  patientId: string;
  transfusedByNurse: string;
  preTransfusionVitals: {
    bloodPressure?: string | undefined;
    heartRate?: string | undefined;
    temperature?: string | undefined;
  };
  postTransfusionVitals: {
    bloodPressure?: string | undefined;
    heartRate?: string | undefined;
    temperature?: string | undefined;
  };
  transfusionReactionObserved: boolean;
  reactionDetails?: string | undefined;
}

export interface StoredDonor {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  donorNumber: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  bloodGroup: string;
  donorType: string;
  screeningPassed: boolean;
  hemoglobinGdl: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredDonation {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  donationNumber: string;
  donorId: string;
  bagBarcode: string;
  bloodGroup: string;
  donationType: string;
  volumeMl: number;
  anticoagulant: string;
  status: 'COLLECTED' | 'SEPARATED' | 'TESTED_SAFE' | 'DISCARDED';
  collectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredBloodComponent {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  componentCode: string;
  donationId: string;
  donorId: string;
  componentType: 'PRBC' | 'FFP' | 'PLATELETS' | 'WHOLE_BLOOD' | 'CRYOPRECIPITATE';
  bloodGroup: string;
  volumeMl: number;
  status: 'TESTING_PENDING' | 'AVAILABLE' | 'RESERVED' | 'ISSUED' | 'TRANSFUSED' | 'DISCARDED';
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredBloodRequest {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  requestNumber: string;
  patientId: string;
  doctorId: string;
  encounterId: string;
  bloodGroup: string;
  componentType: string;
  unitsRequested: number;
  urgency: string;
  clinicalIndication: string;
  status: 'REQUESTED' | 'CROSSMATCHED' | 'ISSUED' | 'TRANSFUSED' | 'CANCELLED';
  crossmatch: {
    componentId: string;
    technicianId: string;
    compatibilityResult: string;
    crossmatchNotes: string;
    performedAt: Date;
  } | null;
  issue: {
    componentId: string;
    issuedToStaff: string;
    issuedBy: string;
    issuedAt: Date;
  } | null;
  transfusion: {
    componentId: string;
    transfusedByNurse: string;
    preTransfusionVitals: { bloodPressure?: string | undefined; heartRate?: string | undefined; temperature?: string | undefined };
    postTransfusionVitals: { bloodPressure?: string | undefined; heartRate?: string | undefined; temperature?: string | undefined };
    transfusionReactionObserved: boolean;
    reactionDetails?: string | undefined;
    completedAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BloodBankManagementRepository {
  async getInventory(
    tenantId: string,
    bloodGroup?: string,
    componentType?: string,
    status?: string,
    dbClient = getDatabase()
  ): Promise<StoredBloodComponent[]> {
    const db = requireDb(dbClient);
    try {
      const conditions = [eq(bloodComponents.tenantId, tenantId)];
      if (bloodGroup) conditions.push(eq(bloodComponents.bloodGroup, bloodGroup));
      if (componentType) conditions.push(eq(bloodComponents.componentType, componentType));
      if (status) conditions.push(eq(bloodComponents.status, status));

      const rows = await db
        .select()
        .from(bloodComponents)
        .where(and(...conditions))
        .orderBy(desc(bloodComponents.createdAt));

      return rows.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        partnerId: r.partnerId,
        organizationId: r.organizationId,
        branchId: r.branchId,
        componentCode: r.componentCode,
        donationId: r.donationId,
        donorId: r.donationId, // mapped to donation / donor
        componentType: r.componentType as StoredBloodComponent['componentType'],
        bloodGroup: r.bloodGroup,
        volumeMl: r.volumeMl,
        status: r.status as StoredBloodComponent['status'],
        expiryDate: r.expiryDate,
        createdAt: r.createdAt,
        updatedAt: r.createdAt
      }));
    } catch (err) {
      logger.error('Failed to query blood inventory from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Blood bank inventory lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async registerDonor(input: RegisterDonorInput, dbClient = getDatabase()): Promise<StoredDonor> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const now = new Date();
    const donorNumber = `DNR-${Math.floor(100000 + Math.random() * 900000)}`;

    const record: StoredDonor = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      donorNumber,
      fullName: input.fullName,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      mobileNumber: input.mobileNumber || (input as any).contactNumber || '+91-9999999999',
      bloodGroup: input.bloodGroup,
      donorType: input.donorType || 'VOLUNTARY',
      screeningPassed: input.screeningPassed,
      hemoglobinGdl: input.hemoglobinGdl || 14.2,
      createdAt: now,
      updatedAt: now
    };

    try {
      const [created] = await db
        .insert(bloodDonors)
        .values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          donorCode: record.donorNumber,
          fullName: record.fullName,
          gender: record.gender,
          dateOfBirth: new Date(record.dateOfBirth),
          contactNumber: record.mobileNumber || (input as any).contactNumber || '+91-9999999999',
          bloodGroup: record.bloodGroup,
          donorType: record.donorType,
          eligibilityStatus: record.screeningPassed ? 'ELIGIBLE_FOR_DONATION' : 'TEMPORARILY_DEFERRED',
          totalDonationsCount: 0,
          nextEligibleDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          createdAt: now
        } as unknown as typeof bloodDonors.$inferInsert)
        .returning();

      if (!created) {
        throw new Error('Insert returned empty result');
      }

      return {
        ...record,
        id: created.id
      };
    } catch (err) {
      logger.error('Failed to register blood donor in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Blood donor registration aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async collectDonation(input: CollectDonationInput, dbClient = getDatabase()): Promise<StoredDonation> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const now = new Date();
    const donationNumber = `DON-${Math.floor(100000 + Math.random() * 900000)}`;

    const record: StoredDonation = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      donationNumber,
      donorId: input.donorId,
      bagBarcode: input.bagBarcode,
      bloodGroup: input.bloodGroup,
      donationType: input.donationType || 'WHOLE_BLOOD',
      volumeMl: input.volumeMl || 450,
      anticoagulant: input.anticoagulant || 'CPDA-1',
      status: 'COLLECTED',
      collectedAt: now,
      createdAt: now,
      updatedAt: now
    };

    try {
      const [created] = await db
        .insert(bloodDonations)
        .values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          donationNumber: record.donationNumber,
          donorId: record.donorId,
          donorName: 'Blood Donor',
          bloodGroup: record.bloodGroup,
          donationType: record.donationType,
          collectedVolumeMl: record.volumeMl,
          anticoagulantType: record.anticoagulant,
          phlebotomistName: 'Staff Phlebotomist',
          collectionLocation: 'Main Blood Bank',
          unitStatus: 'QUARANTINED',
          bagBarcode: record.bagBarcode,
          collectedAt: now
        } as unknown as typeof bloodDonations.$inferInsert)
        .returning();

      if (!created) {
        throw new Error('Insert returned empty result');
      }

      return {
        ...record,
        id: created.id
      };
    } catch (err) {
      logger.error('Failed to collect blood donation in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Blood donation collection aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async separateComponents(input: SeparateComponentsInput, dbClient = getDatabase()): Promise<StoredBloodComponent[]> {
    const db = requireDb(dbClient);
    const now = new Date();
    const createdComponents: StoredBloodComponent[] = [];

    // PRBC (Expiry: 42 days)
    const prbcExpiry = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);
    const prbc: StoredBloodComponent = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: '00000000-0000-4000-8000-000000000003',
      componentCode: `${input.parentBagBarcode}-PRBC`,
      donationId: input.donationId,
      donorId: input.donorId,
      componentType: 'PRBC',
      bloodGroup: input.bloodGroup,
      volumeMl: 250,
      status: 'TESTING_PENDING',
      expiryDate: prbcExpiry,
      createdAt: now,
      updatedAt: now
    };
    createdComponents.push(prbc);

    // FFP (Expiry: 365 days)
    const ffpExpiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const ffp: StoredBloodComponent = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: '00000000-0000-4000-8000-000000000003',
      componentCode: `${input.parentBagBarcode}-FFP`,
      donationId: input.donationId,
      donorId: input.donorId,
      componentType: 'FFP',
      bloodGroup: input.bloodGroup,
      volumeMl: 180,
      status: 'TESTING_PENDING',
      expiryDate: ffpExpiry,
      createdAt: now,
      updatedAt: now
    };
    createdComponents.push(ffp);

    // Platelets (Expiry: 5 days)
    const pltExpiry = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const plt: StoredBloodComponent = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      partnerId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: '00000000-0000-4000-8000-000000000003',
      componentCode: `${input.parentBagBarcode}-PLT`,
      donationId: input.donationId,
      donorId: input.donorId,
      componentType: 'PLATELETS',
      bloodGroup: input.bloodGroup,
      volumeMl: 50,
      status: 'TESTING_PENDING',
      expiryDate: pltExpiry,
      createdAt: now,
      updatedAt: now
    };
    createdComponents.push(plt);

    const executeSeparation = async (targetTx: any) => {
      for (const item of createdComponents) {
        await targetTx.insert(bloodComponents).values({
          id: item.id,
          tenantId: item.tenantId,
          partnerId: item.partnerId,
          organizationId: item.organizationId,
          branchId: item.branchId,
          componentCode: item.componentCode,
          donationId: item.donationId,
          componentType: item.componentType,
          bloodGroup: item.bloodGroup,
          volumeMl: item.volumeMl,
          storageLocation: 'Blood Bank Cold Room',
          storageTemperatureTargetC: '4 C',
          expiryDate: item.expiryDate,
          status: item.status,
          preparedByTechnician: 'Blood Bank Technician',
          createdAt: now
        } as unknown as typeof bloodComponents.$inferInsert);
      }

      await targetTx
        .update(bloodDonations)
        .set({ unitStatus: 'SEPARATED' })
        .where(and(eq(bloodDonations.tenantId, input.tenantId), eq(bloodDonations.id, input.donationId)));
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeSeparation);
      } else {
        await executeSeparation(db);
      }
      return createdComponents;
    } catch (err) {
      logger.error('Failed to separate blood components in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Blood component separation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordBloodTest(
    input: RecordBloodTestInput,
    dbClient = getDatabase()
  ): Promise<{ testId: string; status: string }> {
    const db = requireDb(dbClient);
    const now = new Date();
    const testId = crypto.randomUUID();

    const isSafe =
      input.overallStatus === 'TESTED_SAFE' &&
      input.hivResult === 'NON_REACTIVE' &&
      input.hbsagResult === 'NON_REACTIVE' &&
      input.hcvResult === 'NON_REACTIVE' &&
      input.syphilisResult === 'NON_REACTIVE' &&
      input.malariaResult === 'NEGATIVE';

    const newComponentStatus = isSafe ? 'AVAILABLE' : 'DISCARDED';

    const executeTest = async (targetTx: any) => {
      await targetTx.insert(bloodTests).values({
        id: testId,
        tenantId: input.tenantId,
        partnerId: '00000000-0000-4000-8000-000000000001',
        organizationId: '00000000-0000-4000-8000-000000000002',
        branchId: '00000000-0000-4000-8000-000000000003',
        testCode: `TEST-${testId.substring(0, 8).toUpperCase()}`,
        donationId: input.donationId,
        unitBarcode: `BAR-${input.donationId.substring(0, 8)}`,
        aboGroupingResult: input.aboRhConfirmation,
        rhFactorResult: 'POSITIVE',
        antibodyScreen: 'NEGATIVE',
        hivResult: input.hivResult,
        hBsAgResult: input.hbsagResult,
        hcvResult: input.hcvResult,
        syphilisVDRLResult: input.syphilisResult,
        malariaResult: input.malariaResult,
        testingTechnicianName: input.testedBy,
        pathologistSignOffName: 'Consultant Pathologist',
        isPassedForRelease: isSafe,
        testedAt: now
      } as unknown as typeof bloodTests.$inferInsert);

      await targetTx
        .update(bloodComponents)
        .set({ status: newComponentStatus })
        .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.donationId, input.donationId)));

      await targetTx
        .update(bloodDonations)
        .set({ unitStatus: isSafe ? 'TESTED_SAFE' : 'DISCARDED' })
        .where(and(eq(bloodDonations.tenantId, input.tenantId), eq(bloodDonations.id, input.donationId)));
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeTest);
      } else {
        await executeTest(db);
      }
      return { testId, status: newComponentStatus };
    } catch (err) {
      logger.error('Failed to record blood test in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Blood testing aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createBloodRequest(
    input: CreateBloodRequestInput,
    dbClient = getDatabase()
  ): Promise<StoredBloodRequest> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const now = new Date();
    const requestNumber = `BLD-REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const record: StoredBloodRequest = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      requestNumber,
      patientId: input.patientId,
      doctorId: input.doctorId,
      encounterId: input.encounterId || crypto.randomUUID(),
      bloodGroup: input.bloodGroup,
      componentType: input.componentType,
      unitsRequested: input.unitsRequested || 1,
      urgency: input.urgency || 'ROUTINE',
      clinicalIndication: input.clinicalIndication,
      status: 'REQUESTED',
      crossmatch: null,
      issue: null,
      transfusion: null,
      createdAt: now,
      updatedAt: now
    };

    try {
      const [created] = await db
        .insert(bloodRequests)
        .values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          requestCode: record.requestNumber,
          patientId: record.patientId,
          patientName: 'Recipient Patient',
          patientMrn: 'MRN-RECIPIENT',
          encounterId: record.encounterId,
          requestingDepartment: 'Clinical Department',
          orderingPhysicianName: 'Attending Physician',
          requestedComponentType: record.componentType,
          patientBloodGroup: record.bloodGroup,
          quantityUnits: record.unitsRequested,
          urgency: record.urgency,
          clinicalIndication: record.clinicalIndication,
          requiredByTimestamp: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          status: record.status,
          requestedAt: now
        } as unknown as typeof bloodRequests.$inferInsert)
        .returning();

      if (!created) {
        throw new Error('Insert returned empty result');
      }

      return {
        ...record,
        id: created.id
      };
    } catch (err) {
      logger.error('Failed to create blood request in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Blood request requisition aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async performCrossmatch(
    input: PerformCrossmatchInput,
    dbClient = getDatabase()
  ): Promise<StoredBloodRequest | null> {
    const db = requireDb(dbClient);
    const now = new Date();

    try {
      const [request] = await db
        .select()
        .from(bloodRequests)
        .where(and(eq(bloodRequests.tenantId, input.tenantId), eq(bloodRequests.id, input.requestId)));

      if (!request) return null;

      const [comp] = await db
        .select()
        .from(bloodComponents)
        .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.id, input.componentId)));

      if (!comp) {
        throw new AppError({
          message: 'Blood component not found in inventory',
          code: ErrorCode.NOT_FOUND,
          statusCode: 404
        });
      }

      if (comp.status !== 'AVAILABLE') {
        throw new AppError({
          message: `Component is not available for crossmatching (Status: ${comp.status})`,
          code: ErrorCode.BAD_REQUEST,
          statusCode: 400
        });
      }

      const crossmatchId = crypto.randomUUID();
      const crossmatchCode = `XM-${crossmatchId.substring(0, 8).toUpperCase()}`;
      const nextRequestStatus = input.compatibilityResult === 'COMPATIBLE' ? 'CROSSMATCHED' : 'REQUESTED';
      const nextComponentStatus = input.compatibilityResult === 'COMPATIBLE' ? 'RESERVED' : 'AVAILABLE';

      const executeCrossmatch = async (targetTx: any) => {
        await targetTx.insert(bloodCrossmatches).values({
          id: crossmatchId,
          tenantId: input.tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: '00000000-0000-4000-8000-000000000003',
          crossmatchCode,
          requestId: input.requestId,
          componentId: input.componentId,
          componentCode: comp.componentCode,
          patientName: request.patientName,
          patientBloodGroup: request.patientBloodGroup,
          donorBloodGroup: comp.bloodGroup,
          majorCrossmatchResult: input.compatibilityResult,
          minorCrossmatchResult: 'COMPATIBLE',
          coombsTestResult: 'NEGATIVE',
          overallResult: input.compatibilityResult,
          testingTechnicianName: input.technicianId,
          verifiedByPathologist: 'Consultant Pathologist',
          crossmatchedAt: now,
          expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000)
        } as unknown as typeof bloodCrossmatches.$inferInsert);

        await targetTx
          .update(bloodRequests)
          .set({ status: nextRequestStatus })
          .where(and(eq(bloodRequests.tenantId, input.tenantId), eq(bloodRequests.id, input.requestId)));

        if (input.compatibilityResult === 'COMPATIBLE') {
          await targetTx
            .update(bloodComponents)
            .set({ status: nextComponentStatus })
            .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.id, input.componentId)));
        }
      };

      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeCrossmatch);
      } else {
        await executeCrossmatch(db);
      }

      return {
        id: request.id,
        tenantId: request.tenantId,
        partnerId: request.partnerId,
        organizationId: request.organizationId,
        branchId: request.branchId,
        requestNumber: request.requestCode,
        patientId: request.patientId,
        doctorId: request.orderingPhysicianName,
        encounterId: request.encounterId,
        bloodGroup: request.patientBloodGroup,
        componentType: request.requestedComponentType,
        unitsRequested: request.quantityUnits,
        urgency: request.urgency,
        clinicalIndication: request.clinicalIndication,
        status: nextRequestStatus as StoredBloodRequest['status'],
        crossmatch: {
          componentId: input.componentId,
          technicianId: input.technicianId,
          compatibilityResult: input.compatibilityResult,
          crossmatchNotes: input.crossmatchNotes,
          performedAt: now
        },
        issue: null,
        transfusion: null,
        createdAt: request.requestedAt,
        updatedAt: now
      };
    } catch (err) {
      logger.error('Failed to perform crossmatch in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Crossmatch operation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async issueBloodUnit(
    input: IssueBloodUnitInput,
    dbClient = getDatabase()
  ): Promise<StoredBloodRequest | null> {
    const db = requireDb(dbClient);
    const now = new Date();

    try {
      const [request] = await db
        .select()
        .from(bloodRequests)
        .where(and(eq(bloodRequests.tenantId, input.tenantId), eq(bloodRequests.id, input.requestId)));

      if (!request) return null;

      const [comp] = await db
        .select()
        .from(bloodComponents)
        .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.id, input.componentId)));

      if (!comp) {
        throw new AppError({
          message: 'Blood component not found in inventory',
          code: ErrorCode.NOT_FOUND,
          statusCode: 404
        });
      }

      const issueId = crypto.randomUUID();
      const issueCode = `ISSUE-${issueId.substring(0, 8).toUpperCase()}`;

      const executeIssue = async (targetTx: any) => {
        await targetTx.insert(bloodIssues).values({
          id: issueId,
          tenantId: input.tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: '00000000-0000-4000-8000-000000000003',
          issueCode,
          requestId: input.requestId,
          componentId: input.componentId,
          componentCode: comp.componentCode,
          patientName: request.patientName,
          patientMrn: request.patientMrn,
          destinationDepartment: 'ICU / Ward',
          issuingTechnicianName: input.issuedBy,
          receivingNurseName: input.issuedToStaff,
          transportBoxTemperatureC: '4 C',
          issuedAt: now
        } as unknown as typeof bloodIssues.$inferInsert);

        await targetTx
          .update(bloodRequests)
          .set({ status: 'ISSUED' })
          .where(and(eq(bloodRequests.tenantId, input.tenantId), eq(bloodRequests.id, input.requestId)));

        await targetTx
          .update(bloodComponents)
          .set({ status: 'ISSUED' })
          .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.id, input.componentId)));
      };

      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeIssue);
      } else {
        await executeIssue(db);
      }

      return {
        id: request.id,
        tenantId: request.tenantId,
        partnerId: request.partnerId,
        organizationId: request.organizationId,
        branchId: request.branchId,
        requestNumber: request.requestCode,
        patientId: request.patientId,
        doctorId: request.orderingPhysicianName,
        encounterId: request.encounterId,
        bloodGroup: request.patientBloodGroup,
        componentType: request.requestedComponentType,
        unitsRequested: request.quantityUnits,
        urgency: request.urgency,
        clinicalIndication: request.clinicalIndication,
        status: 'ISSUED',
        crossmatch: null,
        issue: {
          componentId: input.componentId,
          issuedToStaff: input.issuedToStaff,
          issuedBy: input.issuedBy,
          issuedAt: now
        },
        transfusion: null,
        createdAt: request.requestedAt,
        updatedAt: now
      };
    } catch (err) {
      logger.error('Failed to issue blood unit in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Blood unit dispensing aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordTransfusion(
    input: RecordTransfusionInput,
    dbClient = getDatabase()
  ): Promise<StoredBloodRequest | null> {
    const db = requireDb(dbClient);
    const now = new Date();

    try {
      const [request] = await db
        .select()
        .from(bloodRequests)
        .where(and(eq(bloodRequests.tenantId, input.tenantId), eq(bloodRequests.id, input.requestId)));

      if (!request) return null;

      const [comp] = await db
        .select()
        .from(bloodComponents)
        .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.id, input.componentId)));

      const transfusionId = crypto.randomUUID();
      const transfusionCode = `TXN-${transfusionId.substring(0, 8).toUpperCase()}`;

      const executeTransfusion = async (targetTx: any) => {
        await targetTx.insert(transfusionRecords).values({
          id: transfusionId,
          tenantId: input.tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: '00000000-0000-4000-8000-000000000003',
          transfusionCode,
          patientName: request.patientName,
          patientMrn: request.patientMrn,
          encounterId: request.encounterId,
          componentCode: comp ? comp.componentCode : `CMP-${input.componentId.substring(0, 8)}`,
          componentType: request.requestedComponentType,
          bloodGroup: request.patientBloodGroup,
          administeredByNurse: input.transfusedByNurse,
          supervisingDoctorName: 'Attending Physician',
          startTime: now,
          endTime: now,
          preTransfusionPulse: parseInt(input.preTransfusionVitals?.heartRate || '75', 10),
          preTransfusionBp: input.preTransfusionVitals?.bloodPressure || '120/80',
          preTransfusionTempF: '98.6',
          adverseReactionNoted: input.transfusionReactionObserved,
          status: 'COMPLETED',
          outcomeNotes: input.reactionDetails || 'Transfusion completed uneventfully.'
        } as unknown as typeof transfusionRecords.$inferInsert);

        await targetTx
          .update(bloodRequests)
          .set({ status: 'TRANSFUSED' })
          .where(and(eq(bloodRequests.tenantId, input.tenantId), eq(bloodRequests.id, input.requestId)));

        if (comp) {
          await targetTx
            .update(bloodComponents)
            .set({ status: 'TRANSFUSED' })
            .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.id, input.componentId)));
        }
      };

      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeTransfusion);
      } else {
        await executeTransfusion(db);
      }

      return {
        id: request.id,
        tenantId: request.tenantId,
        partnerId: request.partnerId,
        organizationId: request.organizationId,
        branchId: request.branchId,
        requestNumber: request.requestCode,
        patientId: request.patientId,
        doctorId: request.orderingPhysicianName,
        encounterId: request.encounterId,
        bloodGroup: request.patientBloodGroup,
        componentType: request.requestedComponentType,
        unitsRequested: request.quantityUnits,
        urgency: request.urgency,
        clinicalIndication: request.clinicalIndication,
        status: 'TRANSFUSED',
        crossmatch: null,
        issue: null,
        transfusion: {
          componentId: input.componentId,
          transfusedByNurse: input.transfusedByNurse,
          preTransfusionVitals: input.preTransfusionVitals,
          postTransfusionVitals: input.postTransfusionVitals,
          transfusionReactionObserved: input.transfusionReactionObserved,
          reactionDetails: input.reactionDetails,
          completedAt: now
        },
        createdAt: request.requestedAt,
        updatedAt: now
      };
    } catch (err) {
      logger.error('Failed to record transfusion in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Blood transfusion recording aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getPatientTransfusionHistory(
    tenantId: string,
    patientId: string,
    dbClient = getDatabase()
  ): Promise<StoredBloodRequest[]> {
    const db = requireDb(dbClient);
    try {
      const requests = await db
        .select()
        .from(bloodRequests)
        .where(and(eq(bloodRequests.tenantId, tenantId), eq(bloodRequests.patientId, patientId)))
        .orderBy(desc(bloodRequests.requestedAt));

      const results: StoredBloodRequest[] = [];

      for (const req of requests) {
        const [xm] = await db
          .select()
          .from(bloodCrossmatches)
          .where(and(eq(bloodCrossmatches.tenantId, tenantId), eq(bloodCrossmatches.requestId, req.id)))
          .limit(1);

        const [iss] = await db
          .select()
          .from(bloodIssues)
          .where(and(eq(bloodIssues.tenantId, tenantId), eq(bloodIssues.requestId, req.id)))
          .limit(1);

        const [txn] = await db
          .select()
          .from(transfusionRecords)
          .where(and(eq(transfusionRecords.tenantId, tenantId), eq(transfusionRecords.encounterId, req.encounterId)))
          .limit(1);

        results.push({
          id: req.id,
          tenantId: req.tenantId,
          partnerId: req.partnerId,
          organizationId: req.organizationId,
          branchId: req.branchId,
          requestNumber: req.requestCode,
          patientId: req.patientId,
          doctorId: req.orderingPhysicianName,
          encounterId: req.encounterId,
          bloodGroup: req.patientBloodGroup,
          componentType: req.requestedComponentType,
          unitsRequested: req.quantityUnits,
          urgency: req.urgency,
          clinicalIndication: req.clinicalIndication,
          status: req.status as StoredBloodRequest['status'],
          crossmatch: xm
            ? {
                componentId: xm.componentId,
                technicianId: xm.testingTechnicianName,
                compatibilityResult: xm.overallResult,
                crossmatchNotes: xm.majorCrossmatchResult,
                performedAt: xm.crossmatchedAt
              }
            : null,
          issue: iss
            ? {
                componentId: iss.componentId,
                issuedToStaff: iss.receivingNurseName,
                issuedBy: iss.issuingTechnicianName,
                issuedAt: iss.issuedAt
              }
            : null,
          transfusion: txn
            ? {
                componentId: txn.componentCode,
                transfusedByNurse: txn.administeredByNurse,
                preTransfusionVitals: {
                  bloodPressure: txn.preTransfusionBp,
                  heartRate: String(txn.preTransfusionPulse)
                },
                postTransfusionVitals: {
                  bloodPressure: txn.postTransfusionBp || undefined,
                  heartRate: txn.postTransfusionPulse ? String(txn.postTransfusionPulse) : undefined
                },
                transfusionReactionObserved: txn.adverseReactionNoted,
                reactionDetails: txn.outcomeNotes || undefined,
                completedAt: txn.startTime
              }
            : null,
          createdAt: req.requestedAt,
          updatedAt: req.requestedAt
        });
      }

      return results;
    } catch (err) {
      logger.error('Failed to query patient transfusion history from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Patient transfusion history lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }
}

export const bloodBankManagementRepository = new BloodBankManagementRepository();
