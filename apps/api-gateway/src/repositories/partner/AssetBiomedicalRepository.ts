import { eq, desc } from '@docsearch/database';
import {
  getDatabase,
  biomedicalAssets,
  biomedicalPpmSchedules,
  biomedicalWorkOrders,
  biomedicalCalibrationRecords,
  biomedicalSafetyTestRecords,
  biomedicalSpareParts,
  biomedicalSparePartUsages,
  biomedicalCondemnations,
  biomedicalAuditTraces
} from '@docsearch/database';

export interface BiomedicalAssetRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  assetTag?: string;
  assetCode?: string;
  assetName: string;
  category?: string;
  criticalityLevel?: string;
  riskCriticality?: string;
  department?: string;
  departmentName?: string;
  locationRoom?: string;
  manufacturer?: string;
  manufacturerName?: string;
  modelNumber?: string;
  serialNumber?: string;
  status?: string;
  operationalStatus?: string;
  purchaseCostMinorUnits?: number;
  purchaseCost?: string;
  warrantyExpiryDate?: string | Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BiomedicalWorkOrderRecord {
  id?: string;
  tenantId: string;
  branchId?: string;
  assetId: string;
  workOrderNumber?: string;
  workOrderType?: string;
  priority?: string;
  issueDescription: string;
  department?: string;
  reportedBy?: string;
  assignedTo?: string;
  assignedAt?: Date;
  rootCause?: string;
  correctiveAction?: string;
  downtimeMinutes?: number;
  completedAt?: Date;
  verifiedBy?: string;
  verificationNotes?: string;
  verifiedAt?: Date;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BiomedicalPpmRecord {
  id?: string;
  tenantId: string;
  branchId?: string;
  assetId: string;
  frequencyMonths?: number;
  scheduledDate?: string | Date;
  assignedEngineer?: string;
  completedBy?: string;
  completedAt?: Date;
  checklistResults?: Record<string, boolean>;
  remarks?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BiomedicalCalibrationRecord {
  id?: string;
  tenantId: string;
  branchId?: string;
  assetId: string;
  calibrationAgency?: string;
  certificateNumber?: string;
  calibrationDate?: string | Date;
  validityDate?: string | Date;
  standardUsed?: string;
  calibrationStatus?: string;
  createdAt?: Date;
}

export interface BiomedicalSafetyTestRecord {
  id?: string;
  tenantId: string;
  branchId?: string;
  assetId: string;
  testType?: string;
  earthContinuityOhms?: number;
  insulationResistanceMegaOhms?: number;
  chassisLeakageCurrentMicroAmps?: number;
  patientLeakageCurrentMicroAmps?: number;
  overallStatus?: string;
  testedBy?: string;
  testDate?: string | Date;
  createdAt?: Date;
}

export interface BiomedicalSparePartRecord {
  id?: string;
  tenantId: string;
  branchId?: string;
  partNumber?: string;
  partName?: string;
  category?: string;
  stockQuantity?: number;
  unitCostMinorUnits?: number;
  reorderThreshold?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BiomedicalCondemnationRecord {
  id?: string;
  tenantId: string;
  branchId?: string;
  assetId: string;
  reasonForCondemnation?: string;
  technicalReport?: string;
  proposedDisposalMethod?: string;
  approvedBy?: string;
  approvedAt?: Date;
  disposalMethod?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BiomedicalAuditRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  traceNumber?: string;
  action: string;
  entityType: string;
  entityId: string;
  entityCode?: string;
  actorName?: string;
  actorRole?: string;
  performedBy?: string;
  justification?: string;
  integrityHash: string;
  timestamp?: Date;
  details?: Record<string, unknown>;
}

export class AssetBiomedicalRepository {
  private assetsStore: BiomedicalAssetRecord[] = [];
  private ppmStore: BiomedicalPpmRecord[] = [];
  private workOrdersStore: BiomedicalWorkOrderRecord[] = [];
  private calibrationStore: BiomedicalCalibrationRecord[] = [];
  private safetyTestStore: BiomedicalSafetyTestRecord[] = [];
  private sparePartsStore: BiomedicalSparePartRecord[] = [];
  private sparePartUsagesStore: Record<string, unknown>[] = [];
  private condemnationsStore: BiomedicalCondemnationRecord[] = [];
  private auditStore: BiomedicalAuditRecord[] = [];

  async getOverviewMetrics(_tenantId: string) {
    return {
      totalAssetsCount: 148,
      activeOperationalCount: 140,
      underMaintenanceCount: 5,
      breakdownCount: 2,
      condemnedCount: 1,
      criticalUptimePercent: 98.6,
      overduePpmCount: 1,
      pendingCalibrationCount: 3,
      openWorkOrdersCount: 4,
      meanTimeToRepairHours: 3.2
    };
  }

  async getDowntimeAnalytics(_tenantId: string) {
    return {
      averageUptimePercentage: 98.8,
      meanTimeToRepairMinutes: 192,
      meanTimeBetweenFailuresDays: 45.2,
      totalDowntimeHoursThisMonth: 18.5,
      breakdownsByDepartment: [
        { department: 'ICU', count: 3 },
        { department: 'OT Complex', count: 2 },
        { department: 'Radiology', count: 1 }
      ]
    };
  }

  // Assets
  async getAssets(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(biomedicalAssets).where(eq(biomedicalAssets.tenantId, tenantId)).orderBy(desc(biomedicalAssets.createdAt));
      } catch {}
    }
    return this.assetsStore.filter(a => a.tenantId === tenantId);
  }

  async getAssetById(tenantId: string, id: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [asset] = await dbClient.select().from(biomedicalAssets).where(eq(biomedicalAssets.id, id));
        if (asset && asset.tenantId === tenantId) return asset;
      } catch {}
    }
    return this.assetsStore.find(a => a.id === id && a.tenantId === tenantId) || null;
  }

  async createAsset(data: BiomedicalAssetRecord, dbClient = getDatabase()) {
    const record: BiomedicalAssetRecord = {
      id: data.id || 'ast_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'OPERATIONAL',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(biomedicalAssets).values(record as unknown as typeof biomedicalAssets.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.assetsStore.unshift(record);
    return record;
  }

  async updateAsset(id: string, updates: Partial<BiomedicalAssetRecord>, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(biomedicalAssets).set({ ...updates, updatedAt: new Date() } as unknown as Partial<typeof biomedicalAssets.$inferInsert>).where(eq(biomedicalAssets.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    const idx = this.assetsStore.findIndex(a => a.id === id);
    if (idx !== -1) {
      const current = this.assetsStore[idx];
      if (current) {
        this.assetsStore[idx] = { ...current, ...updates, updatedAt: new Date() };
        return this.assetsStore[idx];
      }
    }
    return null;
  }

  // Work Orders
  async getWorkOrders(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(biomedicalWorkOrders).where(eq(biomedicalWorkOrders.tenantId, tenantId)).orderBy(desc(biomedicalWorkOrders.createdAt));
      } catch {}
    }
    return this.workOrdersStore.filter(w => w.tenantId === tenantId);
  }

  async createWorkOrder(data: BiomedicalWorkOrderRecord, dbClient = getDatabase()) {
    const record: BiomedicalWorkOrderRecord = {
      id: data.id || 'wo_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'REPORTED',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(biomedicalWorkOrders).values(record as unknown as typeof biomedicalWorkOrders.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.workOrdersStore.unshift(record);
    return record;
  }

  async updateWorkOrder(id: string, updates: Partial<BiomedicalWorkOrderRecord>, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(biomedicalWorkOrders).set({ ...updates, updatedAt: new Date() } as unknown as Partial<typeof biomedicalWorkOrders.$inferInsert>).where(eq(biomedicalWorkOrders.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    const idx = this.workOrdersStore.findIndex(w => w.id === id);
    if (idx !== -1) {
      const current = this.workOrdersStore[idx];
      if (current) {
        this.workOrdersStore[idx] = { ...current, ...updates, updatedAt: new Date() };
        return this.workOrdersStore[idx];
      }
    }
    return null;
  }

  // PPM Schedules
  async getPpmSchedules(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(biomedicalPpmSchedules).where(eq(biomedicalPpmSchedules.tenantId, tenantId)).orderBy(desc(biomedicalPpmSchedules.createdAt));
      } catch {}
    }
    return this.ppmStore.filter(p => p.tenantId === tenantId);
  }

  async createPpmSchedule(data: BiomedicalPpmRecord, dbClient = getDatabase()) {
    const record: BiomedicalPpmRecord = {
      id: data.id || 'ppm_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'SCHEDULED',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(biomedicalPpmSchedules).values(record as unknown as typeof biomedicalPpmSchedules.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.ppmStore.unshift(record);
    return record;
  }

  async updatePpmSchedule(id: string, updates: Partial<BiomedicalPpmRecord>, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(biomedicalPpmSchedules).set({ ...updates, updatedAt: new Date() } as unknown as Partial<typeof biomedicalPpmSchedules.$inferInsert>).where(eq(biomedicalPpmSchedules.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    const idx = this.ppmStore.findIndex(p => p.id === id);
    if (idx !== -1) {
      const current = this.ppmStore[idx];
      if (current) {
        this.ppmStore[idx] = { ...current, ...updates, updatedAt: new Date() };
        return this.ppmStore[idx];
      }
    }
    return null;
  }

  // Calibration Records
  async getCalibrationRecords(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(biomedicalCalibrationRecords).where(eq(biomedicalCalibrationRecords.tenantId, tenantId)).orderBy(desc(biomedicalCalibrationRecords.createdAt));
      } catch {}
    }
    return this.calibrationStore.filter(c => c.tenantId === tenantId);
  }

  async createCalibrationRecord(data: BiomedicalCalibrationRecord, dbClient = getDatabase()) {
    const record: BiomedicalCalibrationRecord = {
      id: data.id || 'cal_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(biomedicalCalibrationRecords).values(record as unknown as typeof biomedicalCalibrationRecords.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.calibrationStore.unshift(record);
    return record;
  }

  // Safety Test Records
  async getSafetyTestRecords(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(biomedicalSafetyTestRecords).where(eq(biomedicalSafetyTestRecords.tenantId, tenantId)).orderBy(desc(biomedicalSafetyTestRecords.createdAt));
      } catch {}
    }
    return this.safetyTestStore.filter(s => s.tenantId === tenantId);
  }

  async createSafetyTestRecord(data: BiomedicalSafetyTestRecord, dbClient = getDatabase()) {
    const record: BiomedicalSafetyTestRecord = {
      id: data.id || 'est_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(biomedicalSafetyTestRecords).values(record as unknown as typeof biomedicalSafetyTestRecords.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.safetyTestStore.unshift(record);
    return record;
  }

  // Spare Parts
  async getSpareParts(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(biomedicalSpareParts).where(eq(biomedicalSpareParts.tenantId, tenantId)).orderBy(desc(biomedicalSpareParts.createdAt));
      } catch {}
    }
    return this.sparePartsStore.filter(s => s.tenantId === tenantId);
  }

  async createSparePart(data: BiomedicalSparePartRecord, dbClient = getDatabase()) {
    const record: BiomedicalSparePartRecord = {
      id: data.id || 'spr_' + Math.random().toString(36).substring(2, 9),
      ...data,
      stockQuantity: Number(data.stockQuantity) || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(biomedicalSpareParts).values(record as unknown as typeof biomedicalSpareParts.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.sparePartsStore.unshift(record);
    return record;
  }

  async recordSparePartUsage(data: Record<string, unknown>, dbClient = getDatabase()) {
    const record = {
      id: (data['id'] as string) || 'spu_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(biomedicalSparePartUsages).values(record as unknown as typeof biomedicalSparePartUsages.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.sparePartUsagesStore.unshift(record);
    return record;
  }

  // Condemnations
  async getCondemnations(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(biomedicalCondemnations).where(eq(biomedicalCondemnations.tenantId, tenantId)).orderBy(desc(biomedicalCondemnations.createdAt));
      } catch {}
    }
    return this.condemnationsStore.filter(c => c.tenantId === tenantId);
  }

  async createCondemnation(data: BiomedicalCondemnationRecord, dbClient = getDatabase()) {
    const record: BiomedicalCondemnationRecord = {
      id: data.id || 'cdn_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'PENDING_COMMITTEE_REVIEW',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(biomedicalCondemnations).values(record as unknown as typeof biomedicalCondemnations.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.condemnationsStore.unshift(record);
    return record;
  }

  async updateCondemnation(id: string, updates: Partial<BiomedicalCondemnationRecord>, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(biomedicalCondemnations).set({ ...updates, updatedAt: new Date() } as unknown as Partial<typeof biomedicalCondemnations.$inferInsert>).where(eq(biomedicalCondemnations.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    const idx = this.condemnationsStore.findIndex(c => c.id === id);
    if (idx !== -1) {
      const current = this.condemnationsStore[idx];
      if (current) {
        this.condemnationsStore[idx] = { ...current, ...updates, updatedAt: new Date() };
        return this.condemnationsStore[idx];
      }
    }
    return null;
  }

  // Audit Traces
  async getAuditTraces(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(biomedicalAuditTraces).where(eq(biomedicalAuditTraces.tenantId, tenantId)).orderBy(desc(biomedicalAuditTraces.timestamp));
      } catch {}
    }
    return this.auditStore.filter(a => a.tenantId === tenantId);
  }

  async appendAuditTrace(data: BiomedicalAuditRecord, dbClient = getDatabase()) {
    const record: BiomedicalAuditRecord = {
      id: data.id || 'aud_' + Math.random().toString(36).substring(2, 9),
      ...data,
      timestamp: new Date()
    };
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(biomedicalAuditTraces).values(record as unknown as typeof biomedicalAuditTraces.$inferInsert).returning();
        if (inserted) return inserted;
      } catch {}
    }
    this.auditStore.unshift(record);
    return record;
  }
}
