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
  private memDonors = new Map<string, StoredDonor[]>();
  private memDonations = new Map<string, StoredDonation[]>();
  private memComponents = new Map<string, StoredBloodComponent[]>();
  private memRequests = new Map<string, StoredBloodRequest[]>();

  async getInventory(tenantId: string, bloodGroup?: string, componentType?: string, status?: string, dbClient = getDatabase()): Promise<StoredBloodComponent[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(bloodComponents)
          .where(eq(bloodComponents.tenantId, tenantId))
          .orderBy(desc(bloodComponents.createdAt));
        if (rows.length > 0) {
          let list = rows as unknown as StoredBloodComponent[];
          if (bloodGroup) list = list.filter(c => c.bloodGroup === bloodGroup);
          if (componentType) list = list.filter(c => c.componentType === componentType);
          if (status) list = list.filter(c => c.status === status);
          return list;
        }
      } catch {
        // Fallback
      }
    }
    let list = this.memComponents.get(tenantId) || [];
    if (bloodGroup) list = list.filter(c => c.bloodGroup === bloodGroup);
    if (componentType) list = list.filter(c => c.componentType === componentType);
    if (status) list = list.filter(c => c.status === status);
    return list;
  }

  async registerDonor(input: RegisterDonorInput, dbClient = getDatabase()): Promise<StoredDonor> {
    const id = crypto.randomUUID();
    const now = new Date();
    const donorNumber = `DNR-${Math.floor(100000 + Math.random() * 900000)}`;

    const record: StoredDonor = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      donorNumber,
      fullName: input.fullName,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      mobileNumber: input.mobileNumber,
      bloodGroup: input.bloodGroup,
      donorType: input.donorType || 'VOLUNTARY',
      screeningPassed: input.screeningPassed,
      hemoglobinGdl: input.hemoglobinGdl || 14.2,
      createdAt: now,
      updatedAt: now
    };

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(bloodDonors).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          donorNumber: record.donorNumber,
          fullName: record.fullName,
          gender: record.gender,
          dateOfBirth: record.dateOfBirth,
          contactNumber: record.mobileNumber,
          bloodGroup: record.bloodGroup,
          status: 'ACTIVE'
        } as unknown as typeof bloodDonors.$inferInsert).returning();
        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const current = this.memDonors.get(input.tenantId) || [];
    current.unshift(record);
    this.memDonors.set(input.tenantId, current);
    return record;
  }

  async collectDonation(input: CollectDonationInput, dbClient = getDatabase()): Promise<StoredDonation> {
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
      anticoagulant: input.anticoagulant || 'CPDA_1',
      status: 'COLLECTED',
      collectedAt: now,
      createdAt: now,
      updatedAt: now
    };

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(bloodDonations).values({
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
          unitStatus: record.status,
          bagBarcode: record.bagBarcode
        } as unknown as typeof bloodDonations.$inferInsert).returning();
        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const current = this.memDonations.get(input.tenantId) || [];
    current.unshift(record);
    this.memDonations.set(input.tenantId, current);
    return record;
  }

  async separateComponents(input: SeparateComponentsInput, dbClient = getDatabase()): Promise<StoredBloodComponent[]> {
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

    if (dbClient) {
      try {
        for (const item of createdComponents) {
          await dbClient.insert(bloodComponents).values({
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
            preparedByTechnician: 'Blood Bank Technician'
          } as unknown as typeof bloodComponents.$inferInsert);
        }

        await dbClient
          .update(bloodDonations)
          .set({ unitStatus: 'SEPARATED' })
          .where(and(eq(bloodDonations.tenantId, input.tenantId), eq(bloodDonations.id, input.donationId)));
      } catch {
        // Fallback
      }
    }

    const current = this.memComponents.get(input.tenantId) || [];
    current.unshift(...createdComponents);
    this.memComponents.set(input.tenantId, current);

    return createdComponents;
  }

  async recordBloodTest(input: RecordBloodTestInput, dbClient = getDatabase()): Promise<{ testId: string; status: string }> {
    const now = new Date();
    const testId = crypto.randomUUID();

    const isSafe = input.overallStatus === 'TESTED_SAFE' &&
      input.hivResult === 'NON_REACTIVE' &&
      input.hbsagResult === 'NON_REACTIVE' &&
      input.hcvResult === 'NON_REACTIVE' &&
      input.syphilisResult === 'NON_REACTIVE' &&
      input.malariaResult === 'NEGATIVE';

    const newComponentStatus = isSafe ? 'AVAILABLE' : 'DISCARDED';

    // Update all child components of this donation
    const components = this.memComponents.get(input.tenantId) || [];
    components.forEach(c => {
      if (c.donationId === input.donationId) {
        c.status = newComponentStatus;
        c.updatedAt = now;
      }
    });

    if (dbClient) {
      try {
        await dbClient.insert(bloodTests).values({
          id: testId,
          tenantId: input.tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: '00000000-0000-4000-8000-000000000003',
          donationId: input.donationId,
          testName: 'TTI_PANEL',
          result: input.overallStatus,
          status: 'COMPLETED',
          testedAt: now
        } as unknown as typeof bloodTests.$inferInsert);

        await dbClient
          .update(bloodComponents)
          .set({ status: newComponentStatus })
          .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.donationId, input.donationId)));
      } catch {
        // Fallback
      }
    }

    return { testId, status: newComponentStatus };
  }

  async createBloodRequest(input: CreateBloodRequestInput, dbClient = getDatabase()): Promise<StoredBloodRequest> {
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

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(bloodRequests).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          requestCode: record.requestNumber,
          patientId: record.patientId,
          patientName: 'Patient',
          patientMrn: 'MRN-001',
          encounterId: record.encounterId,
          requestingDepartment: 'Clinical Department',
          orderingPhysicianName: 'Attending Physician',
          requestedComponentType: record.componentType,
          patientBloodGroup: record.bloodGroup,
          quantityUnits: record.unitsRequested,
          urgency: record.urgency,
          clinicalIndication: record.clinicalIndication,
          requiredByTimestamp: new Date(),
          status: record.status
        } as unknown as typeof bloodRequests.$inferInsert).returning();
        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const current = this.memRequests.get(input.tenantId) || [];
    current.unshift(record);
    this.memRequests.set(input.tenantId, current);
    return record;
  }

  async performCrossmatch(input: PerformCrossmatchInput, dbClient = getDatabase()): Promise<StoredBloodRequest | null> {
    const list = this.memRequests.get(input.tenantId) || [];
    const request = list.find(r => r.id === input.requestId);
    if (!request) return null;

    const components = this.memComponents.get(input.tenantId) || [];
    const comp = components.find(c => c.id === input.componentId);
    if (!comp) throw new Error('Blood component not found in inventory');
    if (comp.status !== 'AVAILABLE') throw new Error(`Component is not available for crossmatching (Status: ${comp.status})`);

    const now = new Date();
    request.crossmatch = {
      componentId: input.componentId,
      technicianId: input.technicianId,
      compatibilityResult: input.compatibilityResult,
      crossmatchNotes: input.crossmatchNotes,
      performedAt: now
    };

    if (input.compatibilityResult === 'COMPATIBLE') {
      request.status = 'CROSSMATCHED';
      comp.status = 'RESERVED';
      comp.updatedAt = now;
    }

    request.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient.insert(bloodCrossmatches).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: '00000000-0000-4000-8000-000000000003',
          requestId: input.requestId,
          componentId: input.componentId,
          patientId: input.patientId,
          compatibilityResult: input.compatibilityResult,
          testedByUserId: input.technicianId,
          status: 'COMPLETED',
          testedAt: now
        } as unknown as typeof bloodCrossmatches.$inferInsert);

        await dbClient
          .update(bloodRequests)
          .set({ status: request.status })
          .where(and(eq(bloodRequests.tenantId, input.tenantId), eq(bloodRequests.id, input.requestId)));

        if (input.compatibilityResult === 'COMPATIBLE') {
          await dbClient
            .update(bloodComponents)
            .set({ status: 'RESERVED' })
            .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.id, input.componentId)));
        }
      } catch {
        // Fallback
      }
    }

    return request;
  }

  async issueBloodUnit(input: IssueBloodUnitInput, dbClient = getDatabase()): Promise<StoredBloodRequest | null> {
    const list = this.memRequests.get(input.tenantId) || [];
    const request = list.find(r => r.id === input.requestId);
    if (!request) return null;

    const components = this.memComponents.get(input.tenantId) || [];
    const comp = components.find(c => c.id === input.componentId);
    if (!comp) throw new Error('Blood component not found in inventory');

    const now = new Date();
    request.issue = {
      componentId: input.componentId,
      issuedToStaff: input.issuedToStaff,
      issuedBy: input.issuedBy,
      issuedAt: now
    };
    request.status = 'ISSUED';
    request.updatedAt = now;

    comp.status = 'ISSUED';
    comp.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient.insert(bloodIssues).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: '00000000-0000-4000-8000-000000000003',
          requestId: input.requestId,
          componentId: input.componentId,
          issuedToUserId: input.issuedToStaff,
          issuedByUserId: input.issuedBy,
          status: 'ISSUED',
          issuedAt: now
        } as unknown as typeof bloodIssues.$inferInsert);

        await dbClient
          .update(bloodRequests)
          .set({ status: 'ISSUED' })
          .where(and(eq(bloodRequests.tenantId, input.tenantId), eq(bloodRequests.id, input.requestId)));

        await dbClient
          .update(bloodComponents)
          .set({ status: 'ISSUED' })
          .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.id, input.componentId)));
      } catch {
        // Fallback
      }
    }

    return request;
  }

  async recordTransfusion(input: RecordTransfusionInput, dbClient = getDatabase()): Promise<StoredBloodRequest | null> {
    const list = this.memRequests.get(input.tenantId) || [];
    const request = list.find(r => r.id === input.requestId);
    if (!request) return null;

    const now = new Date();
    request.transfusion = {
      componentId: input.componentId,
      transfusedByNurse: input.transfusedByNurse,
      preTransfusionVitals: input.preTransfusionVitals,
      postTransfusionVitals: input.postTransfusionVitals,
      transfusionReactionObserved: input.transfusionReactionObserved,
      reactionDetails: input.reactionDetails,
      completedAt: now
    };
    request.status = 'TRANSFUSED';
    request.updatedAt = now;

    const components = this.memComponents.get(input.tenantId) || [];
    const comp = components.find(c => c.id === input.componentId);
    if (comp) {
      comp.status = 'TRANSFUSED';
      comp.updatedAt = now;
    }

    if (dbClient) {
      try {
        await dbClient.insert(transfusionRecords).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: '00000000-0000-4000-8000-000000000003',
          patientId: input.patientId,
          componentId: input.componentId,
          transfusedByStaffId: input.transfusedByNurse,
          reactionObserved: input.transfusionReactionObserved,
          status: 'COMPLETED',
          completedAt: now
        } as unknown as typeof transfusionRecords.$inferInsert);

        await dbClient
          .update(bloodRequests)
          .set({ status: 'TRANSFUSED' })
          .where(and(eq(bloodRequests.tenantId, input.tenantId), eq(bloodRequests.id, input.requestId)));

        if (comp) {
          await dbClient
            .update(bloodComponents)
            .set({ status: 'TRANSFUSED' })
            .where(and(eq(bloodComponents.tenantId, input.tenantId), eq(bloodComponents.id, input.componentId)));
        }
      } catch {
        // Fallback
      }
    }

    return request;
  }

  async getPatientTransfusionHistory(tenantId: string, patientId: string): Promise<StoredBloodRequest[]> {
    const list = this.memRequests.get(tenantId) || [];
    return list.filter(r => r.patientId === patientId);
  }
}

export const bloodBankManagementRepository = new BloodBankManagementRepository();
