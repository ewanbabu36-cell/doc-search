import { AppError } from '@docsearch/shared-core';
import type {
  ExecutiveCommandSnapshotDto,
  DepartmentWiseBillingSummaryDto,
  UnbilledEncounterItemDto,
  InsuranceClaimAgingBucketDto,
  InventoryShrinkageItemDto,
  DoctorPayoutCalculationDto,
  ExecutiveMisDashboardDto,
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
import { ExecutiveMisRepository, executiveMisRepository } from '../../repositories/partner/ExecutiveMisRepository.js';

export class ExecutiveMisService {
  constructor(private readonly repo: ExecutiveMisRepository = executiveMisRepository) {}

  async getExecutiveDashboard(tenantId: string): Promise<ExecutiveMisDashboardDto> {
    const executiveSnapshot = await this.repo.getCommandSnapshot(tenantId);
    const departmentWiseBilling = await this.repo.getDepartmentWiseBilling(tenantId);
    const unbilledEncounters = await this.repo.getUnbilledEncounters(tenantId);
    const insuranceClaimAging = await this.repo.getInsuranceClaimAging(tenantId);
    const inventoryShrinkage = await this.repo.getInventoryShrinkage(tenantId);
    const doctorPayouts = await this.repo.getDoctorPayouts(tenantId);
    const rcmLeakageRisks = await this.repo.getRcmLeakageRisks(tenantId);
    const consumables = await this.repo.getCriticalConsumables(tenantId);

    const totalGrossBilledInr = departmentWiseBilling.reduce((acc, d) => acc + d.grossBilledInr, 0);
    const totalNetBilledInr = departmentWiseBilling.reduce((acc, d) => acc + d.netBilledInr, 0);
    const totalCashCollectedInr = departmentWiseBilling.reduce((acc, d) => acc + d.cashCollectedInr, 0);
    const totalInsuranceArInr = insuranceClaimAging.reduce((acc, b) => acc + b.totalClaimAmountInr, 0);
    const totalUnbilledRiskInr = unbilledEncounters
      .filter((e) => e.status !== 'RESOLVED')
      .reduce((acc, e) => acc + e.unbilledAmountEstimateInr, 0);
    const totalInventoryShrinkageLossInr = inventoryShrinkage.reduce((acc, s) => acc + s.totalShrinkageLossInr, 0);
    const totalDoctorNetPayoutInr = doctorPayouts.reduce((acc, p) => acc + p.netPayableInr, 0);
    const unbilledEncountersCount = unbilledEncounters.filter((e) => e.status !== 'RESOLVED').length;
    const criticalConsumablesStockoutRiskCount = consumables.filter(
      (c) => c.urgencyLevel === 'CRITICAL_RUNOUT_24H' || c.urgencyLevel === 'WARNING_RUNOUT_72H'
    ).length;

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      executiveSnapshot,
      departmentWiseBilling,
      unbilledEncounters,
      insuranceClaimAging,
      inventoryShrinkage,
      doctorPayouts,
      rcmLeakageRisks,
      summaryKpis: {
        totalGrossBilledInr,
        totalNetBilledInr,
        totalCashCollectedInr,
        totalInsuranceArInr,
        totalUnbilledRiskInr,
        totalInventoryShrinkageLossInr,
        totalDoctorNetPayoutInr,
        unbilledEncountersCount,
        criticalConsumablesStockoutRiskCount
      }
    };
  }

  // --- Department-Wise Billing ---
  async getDepartmentWiseBilling(tenantId: string): Promise<DepartmentWiseBillingSummaryDto[]> {
    return await this.repo.getDepartmentWiseBilling(tenantId);
  }

  // --- Outstanding Unbilled Encounters ---
  async getUnbilledEncounters(tenantId: string): Promise<UnbilledEncounterItemDto[]> {
    return await this.repo.getUnbilledEncounters(tenantId);
  }

  async resolveUnbilledEncounter(
    tenantId: string,
    encounterId: string,
    resolutionNotes: string,
    resolvedBy: string
  ): Promise<UnbilledEncounterItemDto> {
    const resolved = await this.repo.resolveUnbilledEncounter(tenantId, encounterId, resolutionNotes, resolvedBy);
    if (!resolved) {
      throw new AppError({ message: `Unbilled encounter ${encounterId} not found.`, statusCode: 404 });
    }
    return resolved;
  }

  // --- Insurance Claim Aging ---
  async getInsuranceClaimAging(tenantId: string): Promise<InsuranceClaimAgingBucketDto[]> {
    return await this.repo.getInsuranceClaimAging(tenantId);
  }

  // --- Inventory Shrinkage ---
  async getInventoryShrinkage(tenantId: string): Promise<InventoryShrinkageItemDto[]> {
    return await this.repo.getInventoryShrinkage(tenantId);
  }

  async recordShrinkageAudit(
    tenantId: string,
    item: InventoryShrinkageItemDto,
    auditor: string
  ): Promise<InventoryShrinkageItemDto> {
    return await this.repo.recordShrinkageAudit(tenantId, item, auditor);
  }

  // --- Doctor Payouts ---
  async getDoctorPayouts(tenantId: string, period?: string): Promise<DoctorPayoutCalculationDto[]> {
    return await this.repo.getDoctorPayouts(tenantId, period);
  }

  async approveDoctorPayout(tenantId: string, doctorId: string, approvedBy: string): Promise<DoctorPayoutCalculationDto> {
    const approved = await this.repo.approveDoctorPayout(tenantId, doctorId, approvedBy);
    if (!approved) {
      throw new AppError({ message: `Doctor payout record for ${doctorId} not found.`, statusCode: 404 });
    }
    return approved;
  }

  // --- Executive Situational Command ---
  async getCommandSnapshot(tenantId: string): Promise<ExecutiveCommandSnapshotDto> {
    return await this.repo.getCommandSnapshot(tenantId);
  }

  async declareSurgeEvent(tenantId: string, payload: DeclareSurgeEventRequest): Promise<ExecutiveCommandSnapshotDto> {
    return await this.repo.declareSurgeEvent(tenantId, payload);
  }

  async resolveSurgeEvent(tenantId: string, payload: ResolveSurgeEventRequest): Promise<ExecutiveCommandSnapshotDto> {
    return await this.repo.resolveSurgeEvent(tenantId, payload);
  }

  async getBedForecasts(tenantId: string): Promise<PredictiveBedForecastDto[]> {
    return await this.repo.getBedForecasts(tenantId);
  }

  async getEdNedocsHistory(tenantId: string): Promise<EdNedocsHourlyDto[]> {
    return await this.repo.getEdNedocsHistory(tenantId);
  }

  async getOtEfficiencies(tenantId: string): Promise<OtSuiteEfficiencyDto[]> {
    return await this.repo.getOtEfficiencies(tenantId);
  }

  async getPatientAcuityHeatmap(tenantId: string): Promise<PatientAcuityHeatmapItemDto[]> {
    return await this.repo.getPatientAcuityHeatmap(tenantId);
  }

  async getRcmLeakageRisks(tenantId: string): Promise<RcmLeakageRiskItemDto[]> {
    return await this.repo.getRcmLeakageRisks(tenantId);
  }

  async getCriticalConsumables(tenantId: string): Promise<CriticalConsumableRunoutDto[]> {
    return await this.repo.getCriticalConsumables(tenantId);
  }

  async runWhatIfSimulation(tenantId: string, payload: WhatIfScenarioRequest): Promise<WhatIfScenarioResultDto> {
    return await this.repo.runWhatIfSimulation(tenantId, payload);
  }

  async getSimulationHistory(tenantId: string): Promise<WhatIfScenarioResultDto[]> {
    return await this.repo.getSimulationHistory(tenantId);
  }

  async overrideBedAllocation(tenantId: string, payload: OverrideBedAllocationRequest): Promise<void> {
    await this.repo.overrideBedAllocation(tenantId, payload);
  }

  async getAuditTraces(tenantId: string): Promise<ExecutiveAuditTraceDto[]> {
    return await this.repo.getAuditTraces(tenantId);
  }
}

export const executiveMisService = new ExecutiveMisService();
