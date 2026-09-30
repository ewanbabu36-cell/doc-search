import crypto from 'crypto';
import type {
  ExecutiveCommandSnapshotDto,
  DepartmentWiseBillingSummaryDto,
  UnbilledEncounterItemDto,
  InsuranceClaimAgingBucketDto,
  InventoryShrinkageItemDto,
  DoctorPayoutCalculationDto,
  PredictiveBedForecastDto,
  EdNedocsHourlyDto,
  OtSuiteEfficiencyDto,
  PatientAcuityHeatmapItemDto,
  RcmLeakageRiskItemDto,
  CriticalConsumableRunoutDto,
  WhatIfScenarioRequest,
  WhatIfScenarioResultDto,
  ExecutiveAuditTraceDto,
  DeclareSurgeEventRequest,
  ResolveSurgeEventRequest,
  OverrideBedAllocationRequest
} from '@docsearch/api-contracts';
import {
  getDatabase,
  executiveCommandSnapshots,
  hospitalSurgeEvents,
  predictiveBedForecasts,
  whatIfSimulationRuns,
  executiveAuditTraces,
  eq,
  desc,
  and
} from '@docsearch/database';

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export class ExecutiveMisRepository {
  // Runtime tenant stores for state mutations & non-UUID execution
  private runtimeSnapshots = new Map<string, ExecutiveCommandSnapshotDto>();
  private runtimeDeptBilling = new Map<string, DepartmentWiseBillingSummaryDto[]>();
  private runtimeUnbilledEncounters = new Map<string, UnbilledEncounterItemDto[]>();
  private runtimeClaimAging = new Map<string, InsuranceClaimAgingBucketDto[]>();
  private runtimeInventoryShrinkage = new Map<string, InventoryShrinkageItemDto[]>();
  private runtimeDoctorPayouts = new Map<string, DoctorPayoutCalculationDto[]>();
  private runtimeBedForecasts = new Map<string, PredictiveBedForecastDto[]>();
  private runtimeEdHistory = new Map<string, EdNedocsHourlyDto[]>();
  private runtimeOtEfficiencies = new Map<string, OtSuiteEfficiencyDto[]>();
  private runtimePatientAcuity = new Map<string, PatientAcuityHeatmapItemDto[]>();
  private runtimeRcmRisks = new Map<string, RcmLeakageRiskItemDto[]>();
  private runtimeCriticalConsumables = new Map<string, CriticalConsumableRunoutDto[]>();
  private runtimeSimulations = new Map<string, WhatIfScenarioResultDto[]>();
  private runtimeAuditTraces = new Map<string, ExecutiveAuditTraceDto[]>();

  constructor() {
    // Pure dynamic lifecycle: no constructor seed execution
  }

  // --- Department-Wise Billing ---
  async getDepartmentWiseBilling(tenantId: string): Promise<DepartmentWiseBillingSummaryDto[]> {
    const cached = this.runtimeDeptBilling.get(tenantId);
    if (cached) return cached;
    return [];
  }

  // --- Outstanding Unbilled Encounters ---
  async getUnbilledEncounters(tenantId: string): Promise<UnbilledEncounterItemDto[]> {
    const cached = this.runtimeUnbilledEncounters.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async resolveUnbilledEncounter(
    tenantId: string,
    encounterId: string,
    resolutionNotes: string,
    resolvedBy: string
  ): Promise<UnbilledEncounterItemDto | null> {
    const list = await this.getUnbilledEncounters(tenantId);
    const item = list.find((e) => e.encounterId === encounterId);
    if (!item) return null;
    item.status = 'RESOLVED';
    await this.appendAuditTrace(tenantId, {
      action: 'RESOLVE_UNBILLED_ENCOUNTER',
      entityType: 'UNBILLED_ENCOUNTER',
      entityId: encounterId,
      entityCode: item.patientMrn,
      actorName: resolvedBy,
      actorRole: 'BILLING_LEAD',
      justification: resolutionNotes
    });
    return item;
  }

  // --- Insurance Claim Aging ---
  async getInsuranceClaimAging(tenantId: string): Promise<InsuranceClaimAgingBucketDto[]> {
    const cached = this.runtimeClaimAging.get(tenantId);
    if (cached) return cached;

    const emptyBuckets: InsuranceClaimAgingBucketDto[] = [
      { bucket: '0_30_DAYS', totalClaimCount: 0, totalClaimAmountInr: 0, preAuthPendingCount: 0, queryRaisedCount: 0, approvedSettledCount: 0, deniedCount: 0, tpaBreakdown: [] },
      { bucket: '31_60_DAYS', totalClaimCount: 0, totalClaimAmountInr: 0, preAuthPendingCount: 0, queryRaisedCount: 0, approvedSettledCount: 0, deniedCount: 0, tpaBreakdown: [] },
      { bucket: '61_90_DAYS', totalClaimCount: 0, totalClaimAmountInr: 0, preAuthPendingCount: 0, queryRaisedCount: 0, approvedSettledCount: 0, deniedCount: 0, tpaBreakdown: [] },
      { bucket: 'OVER_90_DAYS', totalClaimCount: 0, totalClaimAmountInr: 0, preAuthPendingCount: 0, queryRaisedCount: 0, approvedSettledCount: 0, deniedCount: 0, tpaBreakdown: [] }
    ];
    return emptyBuckets;
  }

  // --- Inventory Shrinkage ---
  async getInventoryShrinkage(tenantId: string): Promise<InventoryShrinkageItemDto[]> {
    const cached = this.runtimeInventoryShrinkage.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async recordShrinkageAudit(
    tenantId: string,
    item: InventoryShrinkageItemDto,
    auditor: string
  ): Promise<InventoryShrinkageItemDto> {
    const list = await this.getInventoryShrinkage(tenantId);
    const idx = list.findIndex((s) => s.itemSku === item.itemSku && s.department === item.department);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.runtimeInventoryShrinkage.set(tenantId, list);
    await this.appendAuditTrace(tenantId, {
      action: 'RECORD_INVENTORY_SHRINKAGE',
      entityType: 'INVENTORY_STOCK',
      entityId: item.itemSku,
      entityCode: item.itemName,
      actorName: auditor,
      actorRole: 'PHARMACY_AUDITOR',
      justification: `Shrinkage discrepancy recorded: ${item.discrepancyUnits} units (${item.reason})`
    });
    return item;
  }

  // --- Doctor Payout Calculations ---
  async getDoctorPayouts(tenantId: string, period?: string): Promise<DoctorPayoutCalculationDto[]> {
    const cached = this.runtimeDoctorPayouts.get(tenantId);
    if (cached) {
      if (period) {
        return cached.filter((p) => p.payoutPeriod.toLowerCase() === period.toLowerCase());
      }
      return cached;
    }
    return [];
  }

  async approveDoctorPayout(tenantId: string, doctorId: string, approvedBy: string): Promise<DoctorPayoutCalculationDto | null> {
    const list = await this.getDoctorPayouts(tenantId);
    const item = list.find((p) => p.doctorId === doctorId);
    if (!item) return null;
    item.settlementStatus = 'APPROVED_BY_CFO';
    await this.appendAuditTrace(tenantId, {
      action: 'APPROVE_DOCTOR_PAYOUT',
      entityType: 'DOCTOR_COMPENSATION',
      entityId: doctorId,
      entityCode: item.doctorName,
      actorName: approvedBy,
      actorRole: 'CFO',
      justification: `Approved doctor payout ₹${item.netPayableInr.toLocaleString('en-IN')} (TDS ₹${item.tdsDeductionInr.toLocaleString('en-IN')})`
    });
    return item;
  }

  // --- Executive Command Situational Metrics ---
  async getCommandSnapshot(tenantId: string, dbClient = getDatabase()): Promise<ExecutiveCommandSnapshotDto> {
    if (dbClient && isUuid(tenantId)) {
      try {
        const [row] = await dbClient
          .select()
          .from(executiveCommandSnapshots)
          .where(eq(executiveCommandSnapshots.tenantId, tenantId))
          .orderBy(desc(executiveCommandSnapshots.snapshotTimestamp))
          .limit(1);

        if (row) {
          return {
            tenantId: row.tenantId,
            hospitalName: row.hospitalName,
            snapshotTimestamp: row.snapshotTimestamp ? new Date(row.snapshotTimestamp).toISOString() : new Date().toISOString(),
            surgeLevel: row.surgeLevel as ExecutiveCommandSnapshotDto['surgeLevel'],
            activeEmergencyCodes: (row.activeEmergencyCodes as ExecutiveCommandSnapshotDto['activeEmergencyCodes']) || [],
            totalBeds: row.totalBeds,
            occupiedBeds: row.occupiedBeds,
            bedOccupancyPct: Number(row.bedOccupancyPct),
            availableBedsCount: row.availableBedsCount,
            icuBedsTotal: row.icuBedsTotal,
            icuBedsOccupied: row.icuBedsOccupied,
            icuOccupancyPct: Number(row.icuOccupancyPct),
            ventilatorsTotal: row.ventilatorsTotal,
            ventilatorsInUse: row.ventilatorsInUse,
            ventilatorUtilizationPct: Number(row.ventilatorUtilizationPct),
            edTriageWaitingCount: row.edTriageWaitingCount,
            edHoldForAdmissionCount: row.edHoldForAdmissionCount,
            edNedocsScore: row.edNedocsScore,
            edNedocsStatus: row.edNedocsStatus,
            otSuitesActive: row.otSuitesActive,
            otSuitesTotal: row.otSuitesTotal,
            otUtilizationPct: Number(row.otUtilizationPct),
            surgeriesInProgressCount: row.surgeriesInProgressCount,
            surgeriesDelayedCount: row.surgeriesDelayedCount,
            dailyRevenueVelocityInr: Number(row.dailyRevenueVelocityInr),
            unbilledChargesRiskInr: Number(row.unbilledChargesRiskInr),
            claimsDenialRiskCount: row.claimsDenialRiskCount,
            statLabOrdersPending: row.statLabOrdersPending,
            statRadiologyOrdersPending: row.statRadiologyOrdersPending,
            criticalBloodUnitsAlertCount: row.criticalBloodUnitsAlertCount,
            criticalConsumablesStockoutRiskCount: row.criticalConsumablesStockoutRiskCount
          };
        }
      } catch {}
    }

    const cached = this.runtimeSnapshots.get(tenantId);
    if (cached) {
      return { ...cached, snapshotTimestamp: new Date().toISOString() };
    }

    const dynamicBaseline: ExecutiveCommandSnapshotDto = {
      tenantId,
      hospitalName: 'Healthcare Facility',
      snapshotTimestamp: new Date().toISOString(),
      surgeLevel: 'NORMAL_GREEN',
      activeEmergencyCodes: [],
      totalBeds: 0,
      occupiedBeds: 0,
      bedOccupancyPct: 0,
      availableBedsCount: 0,
      icuBedsTotal: 0,
      icuBedsOccupied: 0,
      icuOccupancyPct: 0,
      ventilatorsTotal: 0,
      ventilatorsInUse: 0,
      ventilatorUtilizationPct: 0,
      edTriageWaitingCount: 0,
      edHoldForAdmissionCount: 0,
      edNedocsScore: 0,
      edNedocsStatus: 'NORMAL',
      otSuitesActive: 0,
      otSuitesTotal: 0,
      otUtilizationPct: 0,
      surgeriesInProgressCount: 0,
      surgeriesDelayedCount: 0,
      dailyRevenueVelocityInr: 0,
      unbilledChargesRiskInr: 0,
      claimsDenialRiskCount: 0,
      statLabOrdersPending: 0,
      statRadiologyOrdersPending: 0,
      criticalBloodUnitsAlertCount: 0,
      criticalConsumablesStockoutRiskCount: 0
    };

    if (dbClient && isUuid(tenantId)) {
      try {
        await dbClient.insert(executiveCommandSnapshots).values({
          id: crypto.randomUUID(),
          tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: tenantId,
          hospitalName: dynamicBaseline.hospitalName,
          snapshotTimestamp: new Date(),
          surgeLevel: dynamicBaseline.surgeLevel,
          activeEmergencyCodes: dynamicBaseline.activeEmergencyCodes as any,
          totalBeds: dynamicBaseline.totalBeds,
          occupiedBeds: dynamicBaseline.occupiedBeds,
          bedOccupancyPct: dynamicBaseline.bedOccupancyPct.toString(),
          availableBedsCount: dynamicBaseline.availableBedsCount,
          icuBedsTotal: dynamicBaseline.icuBedsTotal,
          icuBedsOccupied: dynamicBaseline.icuBedsOccupied,
          icuOccupancyPct: dynamicBaseline.icuOccupancyPct.toString(),
          ventilatorsTotal: dynamicBaseline.ventilatorsTotal,
          ventilatorsInUse: dynamicBaseline.ventilatorsInUse,
          ventilatorUtilizationPct: dynamicBaseline.ventilatorUtilizationPct.toString(),
          edTriageWaitingCount: dynamicBaseline.edTriageWaitingCount,
          edHoldForAdmissionCount: dynamicBaseline.edHoldForAdmissionCount,
          edNedocsScore: dynamicBaseline.edNedocsScore,
          edNedocsStatus: dynamicBaseline.edNedocsStatus,
          otSuitesActive: dynamicBaseline.otSuitesActive,
          otSuitesTotal: dynamicBaseline.otSuitesTotal,
          otUtilizationPct: dynamicBaseline.otUtilizationPct.toString(),
          surgeriesInProgressCount: dynamicBaseline.surgeriesInProgressCount,
          surgeriesDelayedCount: dynamicBaseline.surgeriesDelayedCount,
          dailyRevenueVelocityInr: dynamicBaseline.dailyRevenueVelocityInr.toString(),
          unbilledChargesRiskInr: dynamicBaseline.unbilledChargesRiskInr.toString(),
          claimsDenialRiskCount: dynamicBaseline.claimsDenialRiskCount,
          statLabOrdersPending: dynamicBaseline.statLabOrdersPending,
          statRadiologyOrdersPending: dynamicBaseline.statRadiologyOrdersPending,
          criticalBloodUnitsAlertCount: dynamicBaseline.criticalBloodUnitsAlertCount,
          criticalConsumablesStockoutRiskCount: dynamicBaseline.criticalConsumablesStockoutRiskCount
        }).onConflictDoNothing();
      } catch {}
    }

    this.runtimeSnapshots.set(tenantId, dynamicBaseline);
    return dynamicBaseline;
  }

  async declareSurgeEvent(
    tenantId: string,
    payload: DeclareSurgeEventRequest,
    dbClient = getDatabase()
  ): Promise<ExecutiveCommandSnapshotDto> {
    const snap = await this.getCommandSnapshot(tenantId, dbClient);
    snap.surgeLevel = payload.surgeLevel;
    if (payload.codeType) {
      snap.activeEmergencyCodes.unshift({
        codeType: payload.codeType,
        location: payload.location,
        declaredAt: new Date().toISOString(),
        status: 'ACTIVE'
      });
    }
    this.runtimeSnapshots.set(tenantId, snap);

    if (dbClient && isUuid(tenantId)) {
      try {
        const surgeEventCode = `SURGE-${Date.now()}`;
        await dbClient.insert(hospitalSurgeEvents).values({
          id: crypto.randomUUID(),
          tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: tenantId,
          surgeEventCode,
          surgeLevel: payload.surgeLevel,
          emergencyCodeType: payload.codeType || 'CODE_BLUE_CARDIAC_ARREST',
          location: payload.location,
          justification: payload.justification,
          declaredBy: payload.declaredBy,
          declaredAt: new Date(),
          status: 'ACTIVE'
        }).onConflictDoNothing();

        await dbClient
          .update(executiveCommandSnapshots)
          .set({
            surgeLevel: payload.surgeLevel,
            activeEmergencyCodes: snap.activeEmergencyCodes as any
          })
          .where(eq(executiveCommandSnapshots.tenantId, tenantId));
      } catch {}
    }

    await this.appendAuditTrace(tenantId, {
      action: 'DECLARE_SURGE_EVENT',
      entityType: 'HOSPITAL_SURGE',
      entityId: crypto.randomUUID(),
      entityCode: payload.surgeLevel,
      actorName: payload.declaredBy,
      actorRole: 'CHIEF_MEDICAL_OFFICER',
      justification: payload.justification
    });
    return snap;
  }

  async resolveSurgeEvent(
    tenantId: string,
    payload: ResolveSurgeEventRequest,
    dbClient = getDatabase()
  ): Promise<ExecutiveCommandSnapshotDto> {
    const snap = await this.getCommandSnapshot(tenantId, dbClient);
    snap.surgeLevel = 'NORMAL_GREEN';
    for (const code of snap.activeEmergencyCodes) {
      if (code.status === 'ACTIVE' || code.status === 'STANDBY') {
        code.status = 'RESOLVED';
      }
    }
    this.runtimeSnapshots.set(tenantId, snap);

    if (dbClient && isUuid(tenantId)) {
      try {
        await dbClient
          .update(hospitalSurgeEvents)
          .set({
            status: 'RESOLVED',
            resolvedBy: payload.resolvedBy,
            resolvedAt: new Date(),
            outcomeNotes: payload.outcomeNotes
          })
          .where(and(eq(hospitalSurgeEvents.tenantId, tenantId), eq(hospitalSurgeEvents.status, 'ACTIVE')));

        await dbClient
          .update(executiveCommandSnapshots)
          .set({
            surgeLevel: 'NORMAL_GREEN',
            activeEmergencyCodes: snap.activeEmergencyCodes as any
          })
          .where(eq(executiveCommandSnapshots.tenantId, tenantId));
      } catch {}
    }

    await this.appendAuditTrace(tenantId, {
      action: 'RESOLVE_SURGE_EVENT',
      entityType: 'HOSPITAL_SURGE',
      entityId: crypto.randomUUID(),
      entityCode: 'NORMAL_GREEN',
      actorName: payload.resolvedBy,
      actorRole: 'CHIEF_MEDICAL_OFFICER',
      justification: payload.outcomeNotes
    });
    return snap;
  }

  async getBedForecasts(tenantId: string, dbClient = getDatabase()): Promise<PredictiveBedForecastDto[]> {
    if (dbClient && isUuid(tenantId)) {
      try {
        const rows = await dbClient
          .select()
          .from(predictiveBedForecasts)
          .where(eq(predictiveBedForecasts.tenantId, tenantId));

        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            tenantId: r.tenantId,
            forecastWindow: r.forecastWindow as PredictiveBedForecastDto['forecastWindow'],
            specialtyName: r.specialtyName,
            currentOccupied: r.currentOccupied,
            capacityLimit: r.capacityLimit,
            predictedAdmissions: r.predictedAdmissions,
            predictedDischarges: r.predictedDischarges,
            netProjectedDemand: r.netProjectedDemand,
            projectedOccupancyPct: Number(r.projectedOccupancyPct),
            predictedBottleneckLevel: r.predictedBottleneckLevel as PredictiveBedForecastDto['predictedBottleneckLevel'],
            aiConfidencePct: Number(r.aiConfidencePct),
            recommendedAction: r.recommendedAction
          }));
        }
      } catch {}
    }

    const cached = this.runtimeBedForecasts.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async getEdNedocsHistory(tenantId: string): Promise<EdNedocsHourlyDto[]> {
    const cached = this.runtimeEdHistory.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async getOtEfficiencies(tenantId: string): Promise<OtSuiteEfficiencyDto[]> {
    const cached = this.runtimeOtEfficiencies.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async getPatientAcuityHeatmap(tenantId: string): Promise<PatientAcuityHeatmapItemDto[]> {
    const cached = this.runtimePatientAcuity.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async getRcmLeakageRisks(tenantId: string): Promise<RcmLeakageRiskItemDto[]> {
    const cached = this.runtimeRcmRisks.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async getCriticalConsumables(tenantId: string): Promise<CriticalConsumableRunoutDto[]> {
    const cached = this.runtimeCriticalConsumables.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async runWhatIfSimulation(
    tenantId: string,
    payload: WhatIfScenarioRequest,
    dbClient = getDatabase()
  ): Promise<WhatIfScenarioResultDto> {
    const scenarioId = crypto.randomUUID();
    const isMass = payload.surgeType === 'MASS_CASUALTY_SURGE_50_PTS';
    const simResult: WhatIfScenarioResultDto = {
      scenarioId,
      scenarioName: payload.scenarioName,
      simulatedOccupancyPeakPct: isMass ? 104.2 : 95.6,
      simulatedIcuDeficitBeds: isMass ? 8 : 2,
      simulatedVentilatorShortageCount: isMass ? 5 : 1,
      simulatedEdWaitTimePeakMins: isMass ? 135 : 75,
      simulatedDailyFinancialImpactInr: isMass ? 3400000.0 : 1200000.0,
      aiRecommendations: [
        `Activate protocol for ${payload.surgeType}.`,
        payload.divertElectiveSurgeries ? 'Elective OT schedules suspended.' : 'Elective OT buffer active.',
        payload.fastTrackDischargeBonus ? 'Fast-track discharge incentives applied (+12 beds freed).' : 'Standard discharge turnaround.',
        'Mobilize reserve medical supplies and off-duty surgical backup.'
      ],
      generatedAt: new Date().toISOString()
    };

    if (dbClient && isUuid(tenantId)) {
      try {
        await dbClient.insert(whatIfSimulationRuns).values({
          id: scenarioId,
          tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: tenantId,
          scenarioName: payload.scenarioName,
          surgeType: payload.surgeType,
          durationHours: 48,
          divertElectiveSurgeries: Boolean(payload.divertElectiveSurgeries),
          fastTrackDischargeBonus: Boolean(payload.fastTrackDischargeBonus),
          simulatedOccupancyPeakPct: simResult.simulatedOccupancyPeakPct.toString(),
          simulatedIcuDeficitBeds: simResult.simulatedIcuDeficitBeds,
          simulatedVentilatorShortageCount: simResult.simulatedVentilatorShortageCount,
          simulatedEdWaitTimePeakMins: simResult.simulatedEdWaitTimePeakMins,
          simulatedDailyFinancialImpactInr: simResult.simulatedDailyFinancialImpactInr.toString(),
          aiRecommendations: simResult.aiRecommendations,
          runBy: 'Chief Medical Officer'
        }).onConflictDoNothing();
      } catch {}
    }

    const list = this.runtimeSimulations.get(tenantId) || [];
    list.unshift(simResult);
    this.runtimeSimulations.set(tenantId, list);

    await this.appendAuditTrace(tenantId, {
      action: 'RUN_WHAT_IF_SIMULATION',
      entityType: 'WHAT_IF_SCENARIO',
      entityId: simResult.scenarioId,
      entityCode: payload.surgeType,
      actorName: 'Dr. Alok Verma (CMO)',
      actorRole: 'EXECUTIVE_ADMIN',
      justification: `What-If simulation executed for ${payload.scenarioName}`
    });
    return simResult;
  }

  async getSimulationHistory(tenantId: string, dbClient = getDatabase()): Promise<WhatIfScenarioResultDto[]> {
    if (dbClient && isUuid(tenantId)) {
      try {
        const rows = await dbClient
          .select()
          .from(whatIfSimulationRuns)
          .where(eq(whatIfSimulationRuns.tenantId, tenantId))
          .orderBy(desc(whatIfSimulationRuns.createdAt));

        if (rows.length > 0) {
          return rows.map((r) => ({
            scenarioId: r.id,
            scenarioName: r.scenarioName,
            simulatedOccupancyPeakPct: Number(r.simulatedOccupancyPeakPct),
            simulatedIcuDeficitBeds: r.simulatedIcuDeficitBeds,
            simulatedVentilatorShortageCount: r.simulatedVentilatorShortageCount,
            simulatedEdWaitTimePeakMins: r.simulatedEdWaitTimePeakMins,
            simulatedDailyFinancialImpactInr: Number(r.simulatedDailyFinancialImpactInr),
            aiRecommendations: (r.aiRecommendations as string[]) || [],
            generatedAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
          }));
        }
      } catch {}
    }

    return this.runtimeSimulations.get(tenantId) || [];
  }

  async overrideBedAllocation(tenantId: string, payload: OverrideBedAllocationRequest): Promise<void> {
    const list = await this.getPatientAcuityHeatmap(tenantId);
    const item = list.find((p) => p.bedId === payload.bedId);
    if (item) {
      item.patientMrn = payload.targetPatientMrn;
      item.primaryRiskTrigger = `Executive Override: ${payload.overrideReason}`;
    }
    await this.appendAuditTrace(tenantId, {
      action: 'OVERRIDE_BED_ALLOCATION',
      entityType: 'BED_INVENTORY',
      entityId: payload.bedId,
      entityCode: payload.targetPatientMrn,
      actorName: payload.authorizedBy,
      actorRole: 'CHIEF_MEDICAL_OFFICER',
      justification: payload.overrideReason
    });
  }

  // --- Executive Audit Vault ---
  async appendAuditTrace(
    tenantId: string,
    params: {
      action: string;
      entityType: string;
      entityId: string;
      entityCode: string;
      actorName: string;
      actorRole: string;
      justification: string;
    },
    dbClient = getDatabase()
  ): Promise<ExecutiveAuditTraceDto> {
    const id = crypto.randomUUID();
    const traces = this.runtimeAuditTraces.get(tenantId) || [];
    const prevHash = traces[0]?.integrityHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();
    const traceNumber = `TRACE-EXEC-${Math.floor(10000 + Math.random() * 90000)}`;

    const hashPayload = `${prevHash}:${tenantId}:${traceNumber}:${params.action}:${params.entityType}:${params.entityId}:${timestamp}`;
    const integrityHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const trace: ExecutiveAuditTraceDto = {
      id,
      tenantId,
      traceNumber,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityCode: params.entityCode,
      actorName: params.actorName,
      actorRole: params.actorRole,
      justification: params.justification,
      integrityHash,
      timestamp
    };

    if (dbClient && isUuid(tenantId)) {
      try {
        const entityIdUuid = isUuid(params.entityId) ? params.entityId : crypto.randomUUID();
        await dbClient.insert(executiveAuditTraces).values({
          id,
          tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: tenantId,
          traceNumber,
          action: params.action,
          entityType: params.entityType,
          entityId: entityIdUuid,
          entityCode: params.entityCode,
          actorName: params.actorName,
          actorRole: params.actorRole,
          justification: params.justification,
          integrityHash,
          timestamp: new Date(timestamp)
        }).onConflictDoNothing();
      } catch {}
    }

    traces.unshift(trace);
    this.runtimeAuditTraces.set(tenantId, traces);
    return trace;
  }

  async getAuditTraces(tenantId: string, dbClient = getDatabase()): Promise<ExecutiveAuditTraceDto[]> {
    if (dbClient && isUuid(tenantId)) {
      try {
        const rows = await dbClient
          .select()
          .from(executiveAuditTraces)
          .where(eq(executiveAuditTraces.tenantId, tenantId))
          .orderBy(desc(executiveAuditTraces.timestamp));

        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            tenantId: r.tenantId,
            traceNumber: r.traceNumber,
            action: r.action,
            entityType: r.entityType,
            entityId: r.entityId,
            entityCode: r.entityCode,
            actorName: r.actorName,
            actorRole: r.actorRole,
            justification: r.justification,
            integrityHash: r.integrityHash,
            timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString()
          }));
        }
      } catch {}
    }

    return this.runtimeAuditTraces.get(tenantId) || [];
  }
}

export const executiveMisRepository = new ExecutiveMisRepository();
