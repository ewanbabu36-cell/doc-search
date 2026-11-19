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
    this.seedTenant('11111111-1111-4111-8111-111111111111');
  }

  private ensureTenantInitialized(tenantId: string): void {
    if (tenantId === '11111111-1111-4111-8111-111111111111' && !this.runtimeDeptBilling.has(tenantId)) {
      this.seedTenant(tenantId);
    }
  }

  private seedTenant(tenantId: string): void {
    // 1. Executive Situational Snapshot
    this.runtimeSnapshots.set(tenantId, {
      tenantId,
      hospitalName: 'Apex Multi-Specialty Hospital & Research Institute (Main Campus)',
      snapshotTimestamp: new Date().toISOString(),
      surgeLevel: 'BUSY_YELLOW',
      activeEmergencyCodes: [
        {
          codeType: 'CODE_BLUE_CARDIAC_ARREST',
          location: 'Inpatient Medical Ward 3 — Bed 304',
          declaredAt: '2026-08-30T06:15:00.000Z',
          status: 'STANDBY'
        }
      ],
      totalBeds: 450,
      occupiedBeds: 402,
      bedOccupancyPct: 89.33,
      availableBedsCount: 48,
      icuBedsTotal: 60,
      icuBedsOccupied: 56,
      icuOccupancyPct: 93.33,
      ventilatorsTotal: 35,
      ventilatorsInUse: 31,
      ventilatorUtilizationPct: 88.57,
      edTriageWaitingCount: 14,
      edHoldForAdmissionCount: 6,
      edNedocsScore: 118,
      edNedocsStatus: 'Busy & Approaching Overcrowding',
      otSuitesActive: 9,
      otSuitesTotal: 10,
      otUtilizationPct: 90.0,
      surgeriesInProgressCount: 8,
      surgeriesDelayedCount: 1,
      dailyRevenueVelocityInr: 4825000.0,
      unbilledChargesRiskInr: 345000.0,
      claimsDenialRiskCount: 4,
      statLabOrdersPending: 7,
      statRadiologyOrdersPending: 3,
      criticalBloodUnitsAlertCount: 1,
      criticalConsumablesStockoutRiskCount: 2
    });

    // 2. Department-Wise Billing Breakdown
    this.runtimeDeptBilling.set(tenantId, [
      { department: 'OPD', grossBilledInr: 850000, discountsInr: 42500, netBilledInr: 807500, cashCollectedInr: 650000, insurancePendingInr: 157500, encounterCount: 340, averageTicketSizeInr: 2375 },
      { department: 'IPD', grossBilledInr: 2150000, discountsInr: 107500, netBilledInr: 2042500, cashCollectedInr: 720000, insurancePendingInr: 1322500, encounterCount: 58, averageTicketSizeInr: 35215 },
      { department: 'EMERGENCY', grossBilledInr: 420000, discountsInr: 12000, netBilledInr: 408000, cashCollectedInr: 310000, insurancePendingInr: 98000, encounterCount: 64, averageTicketSizeInr: 6375 },
      { department: 'ICU', grossBilledInr: 980000, discountsInr: 29000, netBilledInr: 951000, cashCollectedInr: 190000, insurancePendingInr: 761000, encounterCount: 22, averageTicketSizeInr: 43227 },
      { department: 'OPERATION_THEATRE', grossBilledInr: 1450000, discountsInr: 72500, netBilledInr: 1377500, cashCollectedInr: 280000, insurancePendingInr: 1097500, encounterCount: 12, averageTicketSizeInr: 114791 },
      { department: 'PHARMACY', grossBilledInr: 680000, discountsInr: 34000, netBilledInr: 646000, cashCollectedInr: 510000, insurancePendingInr: 136000, encounterCount: 410, averageTicketSizeInr: 1575 },
      { department: 'LABORATORY', grossBilledInr: 520000, discountsInr: 26000, netBilledInr: 494000, cashCollectedInr: 380000, insurancePendingInr: 114000, encounterCount: 280, averageTicketSizeInr: 1764 },
      { department: 'RADIOLOGY', grossBilledInr: 390000, discountsInr: 19500, netBilledInr: 370500, cashCollectedInr: 260000, insurancePendingInr: 110500, encounterCount: 95, averageTicketSizeInr: 3900 }
    ]);

    // 3. Outstanding Unbilled Encounters
    this.runtimeUnbilledEncounters.set(tenantId, [
      {
        encounterId: 'enc-unb-001',
        patientMrn: 'MRN-2026-9041',
        patientName: 'Kavita Joshi',
        department: 'Cardiology & CCU',
        encounterType: 'IPD',
        admissionDischargeDate: '2026-09-02T10:00:00.000Z',
        completedServices: ['Bedside 2D Echocardiogram', 'Continuous Telemetry Monitoring', 'Troponin-T STAT'],
        unbilledAmountEstimateInr: 45000,
        unbilledReason: 'PENDING_LAB_VERIFICATION',
        agingHours: 28,
        status: 'ACTION_REQUIRED'
      },
      {
        encounterId: 'enc-unb-002',
        patientMrn: 'MRN-2026-7782',
        patientName: 'Ramanathan Iyer',
        department: 'Cath Lab & OT',
        encounterType: 'IPD',
        admissionDischargeDate: '2026-09-01T14:30:00.000Z',
        completedServices: ['Coronary Angioplasty (PTCA)', 'Drug Eluting Stent Implantation', 'Post-Op ICU Recovery'],
        unbilledAmountEstimateInr: 185000,
        unbilledReason: 'UNPOSTED_WARD_CONSUMABLES',
        agingHours: 48,
        status: 'ESCALATED_TO_BILLING_LEAD'
      },
      {
        encounterId: 'enc-unb-003',
        patientMrn: 'MRN-2026-3391',
        patientName: 'Harish Chandra',
        department: 'Intensive Care Unit (ICU-A)',
        encounterType: 'IPD',
        admissionDischargeDate: '2026-08-31T09:15:00.000Z',
        completedServices: ['Mechanical Ventilation 48h', 'Arterial Blood Gas Serial x6', 'Central Line Placement'],
        unbilledAmountEstimateInr: 115000,
        unbilledReason: 'TPA_PRE_AUTH_QUERY',
        agingHours: 72,
        status: 'IN_REVIEW'
      }
    ]);

    // 4. Insurance Claim Aging Buckets
    this.runtimeClaimAging.set(tenantId, [
      {
        bucket: '0_30_DAYS',
        totalClaimCount: 42,
        totalClaimAmountInr: 3450000,
        preAuthPendingCount: 14,
        queryRaisedCount: 8,
        approvedSettledCount: 18,
        deniedCount: 2,
        tpaBreakdown: [
          { tpaName: 'Star Health & Allied Insurance', amountInr: 1420000, claimCount: 18 },
          { tpaName: 'ICICI Lombard Health Care', amountInr: 980000, claimCount: 12 },
          { tpaName: 'PMJAY (Ayushman Bharat)', amountInr: 650000, claimCount: 8 },
          { tpaName: 'Niva Bupa Health Insurance', amountInr: 400000, claimCount: 4 }
        ]
      },
      {
        bucket: '31_60_DAYS',
        totalClaimCount: 24,
        totalClaimAmountInr: 2150000,
        preAuthPendingCount: 4,
        queryRaisedCount: 11,
        approvedSettledCount: 7,
        deniedCount: 2,
        tpaBreakdown: [
          { tpaName: 'Star Health & Allied Insurance', amountInr: 850000, claimCount: 9 },
          { tpaName: 'Max Bupa / Niva Bupa', amountInr: 620000, claimCount: 7 },
          { tpaName: 'CGHS Central Govt Health', amountInr: 480000, claimCount: 5 },
          { tpaName: 'HDFC ERGO Health', amountInr: 200000, claimCount: 3 }
        ]
      },
      {
        bucket: '61_90_DAYS',
        totalClaimCount: 11,
        totalClaimAmountInr: 980000,
        preAuthPendingCount: 1,
        queryRaisedCount: 6,
        approvedSettledCount: 2,
        deniedCount: 2,
        tpaBreakdown: [
          { tpaName: 'Star Health & Allied Insurance', amountInr: 450000, claimCount: 5 },
          { tpaName: 'PMJAY (Ayushman Bharat)', amountInr: 330000, claimCount: 4 },
          { tpaName: 'United India Insurance', amountInr: 200000, claimCount: 2 }
        ]
      },
      {
        bucket: 'OVER_90_DAYS',
        totalClaimCount: 6,
        totalClaimAmountInr: 540000,
        preAuthPendingCount: 0,
        queryRaisedCount: 2,
        approvedSettledCount: 1,
        deniedCount: 3,
        tpaBreakdown: [
          { tpaName: 'Oriental Insurance TPA', amountInr: 310000, claimCount: 3 },
          { tpaName: 'Star Health & Allied Insurance', amountInr: 230000, claimCount: 3 }
        ]
      }
    ]);

    // 5. Inventory Shrinkage & Reconciliation Discrepancies
    this.runtimeInventoryShrinkage.set(tenantId, [
      {
        itemSku: 'MED-MEROP-1G',
        itemName: 'Meropenem 1g IV Injection (Reserve Antibiotic)',
        department: 'CENTRAL_PHARMACY',
        physicalCount: 42,
        systemRecordedCount: 48,
        discrepancyUnits: 6,
        shrinkageRatePct: 12.5,
        unitCostInr: 1250,
        totalShrinkageLossInr: 7500,
        reason: 'PILFERAGE_UNACCOUNTED',
        investigationStatus: 'UNDER_AUDIT'
      },
      {
        itemSku: 'SURG-STENT-DES-01',
        itemName: 'Resolute Onyx Drug-Eluting Coronary Stent',
        department: 'CATH_LAB',
        physicalCount: 14,
        systemRecordedCount: 15,
        discrepancyUnits: 1,
        shrinkageRatePct: 6.67,
        unitCostInr: 45000,
        totalShrinkageLossInr: 45000,
        reason: 'DATA_ENTRY_LAG',
        investigationStatus: 'FLAGGED'
      },
      {
        itemSku: 'BB-PRBC-B-POS',
        itemName: 'Packed Red Blood Cells (B-Positive)',
        department: 'ICU_SATELLITE',
        physicalCount: 18,
        systemRecordedCount: 20,
        discrepancyUnits: 2,
        shrinkageRatePct: 10.0,
        unitCostInr: 2800,
        totalShrinkageLossInr: 5600,
        reason: 'EXPIRED_UNRECORDED',
        investigationStatus: 'RESOLVED_WRITTEN_OFF'
      }
    ]);

    // 6. Doctor Payout Calculations & Settlement
    this.runtimeDoctorPayouts.set(tenantId, [
      {
        doctorId: 'doc-001',
        doctorName: 'Dr. Sanjay Gupta',
        specialty: 'Interventional Cardiology',
        remunerationModel: 'SURGICAL_PROCEDURE_SPLIT',
        totalPatientsAttended: 45,
        grossBilledRevenueInr: 1250000,
        hospitalShareInr: 500000, // 40%
        doctorGrossPayoutInr: 750000, // 60%
        tdsDeductionInr: 75000, // 10% TDS Section 194J
        netPayableInr: 675000,
        settlementStatus: 'APPROVED_BY_CFO',
        payoutPeriod: 'AUGUST_2026'
      },
      {
        doctorId: 'doc-002',
        doctorName: 'Dr. Priya Sharma',
        specialty: 'Internal Medicine & Critical Care',
        remunerationModel: 'IPD_PER_DIEM_ROUNDS',
        totalPatientsAttended: 120,
        grossBilledRevenueInr: 480000,
        hospitalShareInr: 144000, // 30%
        doctorGrossPayoutInr: 336000, // 70%
        tdsDeductionInr: 33600, // 10% TDS
        netPayableInr: 302400,
        settlementStatus: 'CALCULATED_PENDING_APPROVAL',
        payoutPeriod: 'AUGUST_2026'
      },
      {
        doctorId: 'doc-003',
        doctorName: 'Dr. Rajesh Iyer',
        specialty: 'Orthopedics & Joint Reconstruction',
        remunerationModel: 'SURGICAL_PROCEDURE_SPLIT',
        totalPatientsAttended: 32,
        grossBilledRevenueInr: 920000,
        hospitalShareInr: 368000, // 40%
        doctorGrossPayoutInr: 552000, // 60%
        tdsDeductionInr: 55200, // 10% TDS
        netPayableInr: 496800,
        settlementStatus: 'DISBURSED',
        payoutPeriod: 'AUGUST_2026'
      },
      {
        doctorId: 'doc-004',
        doctorName: 'Dr. Sunita Mehra',
        specialty: 'General Pediatrics & Neonatology',
        remunerationModel: 'FEE_FOR_SERVICE_OPD',
        totalPatientsAttended: 180,
        grossBilledRevenueInr: 270000,
        hospitalShareInr: 81000, // 30%
        doctorGrossPayoutInr: 189000, // 70%
        tdsDeductionInr: 18900, // 10% TDS
        netPayableInr: 170100,
        settlementStatus: 'CALCULATED_PENDING_APPROVAL',
        payoutPeriod: 'AUGUST_2026'
      }
    ]);

    // 7. Predictive Bed Forecasts
    this.runtimeBedForecasts.set(tenantId, [
      {
        id: 'pbf-001',
        tenantId,
        forecastWindow: 'NEXT_24_HOURS',
        specialtyName: 'Critical Care & ICUs (MICU / SICU)',
        currentOccupied: 56,
        capacityLimit: 60,
        predictedAdmissions: 9,
        predictedDischarges: 4,
        netProjectedDemand: 61,
        projectedOccupancyPct: 101.67,
        predictedBottleneckLevel: 'CRITICAL_BLOCKER',
        aiConfidencePct: 94.8,
        recommendedAction: 'Expedite step-down of 3 stable post-op CABG patients to High Dependency Unit (HDU 2).'
      },
      {
        id: 'pbf-002',
        tenantId,
        forecastWindow: 'NEXT_24_HOURS',
        specialtyName: 'Cardiology & CCU',
        currentOccupied: 42,
        capacityLimit: 48,
        predictedAdmissions: 6,
        predictedDischarges: 5,
        netProjectedDemand: 43,
        projectedOccupancyPct: 89.58,
        predictedBottleneckLevel: 'MODERATE',
        aiConfidencePct: 91.2,
        recommendedAction: 'Maintain fast-track discharge round at 11:00 AM to free 3 beds ahead of scheduled cath lab admissions.'
      },
      {
        id: 'pbf-003',
        tenantId,
        forecastWindow: 'NEXT_24_HOURS',
        specialtyName: 'General Surgery & Orthopedics',
        currentOccupied: 88,
        capacityLimit: 100,
        predictedAdmissions: 14,
        predictedDischarges: 12,
        netProjectedDemand: 90,
        projectedOccupancyPct: 90.0,
        predictedBottleneckLevel: 'LOW',
        aiConfidencePct: 93.5,
        recommendedAction: 'Adequate ward capacity available for elective orthopedic joint replacement cohort.'
      }
    ]);

    // 8. ED NEDOCS Overcrowding History
    this.runtimeEdHistory.set(tenantId, [
      { hourTimestamp: '02:00', totalPatientsInEd: 12, admittedPatientsWaitingBed: 2, resuscitationBedsOccupied: 1, longestWaitTimeMins: 22, nedocsScore: 65, surgeCategory: 'NORMAL_GREEN', predictedArrivalsNext4Hours: 10 },
      { hourTimestamp: '04:00', totalPatientsInEd: 10, admittedPatientsWaitingBed: 3, resuscitationBedsOccupied: 1, longestWaitTimeMins: 28, nedocsScore: 72, surgeCategory: 'NORMAL_GREEN', predictedArrivalsNext4Hours: 14 },
      { hourTimestamp: '06:00', totalPatientsInEd: 16, admittedPatientsWaitingBed: 4, resuscitationBedsOccupied: 2, longestWaitTimeMins: 45, nedocsScore: 102, surgeCategory: 'BUSY_YELLOW', predictedArrivalsNext4Hours: 24 },
      { hourTimestamp: '08:00', totalPatientsInEd: 26, admittedPatientsWaitingBed: 6, resuscitationBedsOccupied: 3, longestWaitTimeMins: 68, nedocsScore: 118, surgeCategory: 'BUSY_YELLOW', predictedArrivalsNext4Hours: 32 }
    ]);

    // 9. OT Suite Efficiencies
    this.runtimeOtEfficiencies.set(tenantId, [
      { otRoomId: 'ot-1', otRoomName: 'Modular OT 1 (Cardiac Hybrid)', suiteType: 'CARDIAC_HYBRID', casesScheduledToday: 3, casesCompletedToday: 1, casesInProgress: 1, averageTurnaroundTimeMins: 24, utilizationRatePct: 94.5, onTimeStartRatePct: 100.0, scheduleStatus: 'ON_SCHEDULE', nextScheduledSpecialty: 'Cardiothoracic (Off-Pump CABG)' },
      { otRoomId: 'ot-2', otRoomName: 'Modular OT 2 (Neuro Navigation)', suiteType: 'NEURO_STEALTH', casesScheduledToday: 2, casesCompletedToday: 0, casesInProgress: 1, averageTurnaroundTimeMins: 35, utilizationRatePct: 91.0, onTimeStartRatePct: 100.0, scheduleStatus: 'ON_SCHEDULE', nextScheduledSpecialty: 'Neurosurgery (Craniotomy)' },
      { otRoomId: 'ot-3', otRoomName: 'Modular OT 3 (Orthopedic Laminar)', suiteType: 'ORTHO_LAMINAR', casesScheduledToday: 4, casesCompletedToday: 2, casesInProgress: 1, averageTurnaroundTimeMins: 18, utilizationRatePct: 96.0, onTimeStartRatePct: 95.0, scheduleStatus: 'ON_SCHEDULE', nextScheduledSpecialty: 'Joint Replacement (Bilateral TKR)' },
      { otRoomId: 'ot-4', otRoomName: 'OT 4 (Dedicated Emergency / Trauma)', suiteType: 'EMERGENCY_DEDICATED', casesScheduledToday: 4, casesCompletedToday: 1, casesInProgress: 1, averageTurnaroundTimeMins: 15, utilizationRatePct: 88.0, onTimeStartRatePct: 100.0, scheduleStatus: 'ON_SCHEDULE', nextScheduledSpecialty: 'Emergency Laparotomy' }
    ]);

    // 10. Patient Acuity Heatmap
    this.runtimePatientAcuity.set(tenantId, [
      { bedId: 'b-301', bedNumber: 'Bed 301', wardName: 'Medical ICU', patientName: 'Deepak Varma', patientMrn: 'MRN-2026-1049', deteriorationScore: 8, acuityLevel: 'CRITICAL_DETERIORATING_RED', primaryRiskTrigger: 'Severe Sepsis + Vasopressor Dependent', icuTransferProbabilityPct: 95.0, attendingPhysician: 'Dr. Priya Sharma', lastVitalsSync: '2 mins ago' },
      { bedId: 'b-304', bedNumber: 'Bed 304', wardName: 'CCU Stepdown', patientName: 'Kavita Joshi', patientMrn: 'MRN-2026-9041', deteriorationScore: 5, acuityLevel: 'HIGH_RISK_AMBER', primaryRiskTrigger: 'Intermittent PVCs on Telemetry', icuTransferProbabilityPct: 18.0, attendingPhysician: 'Dr. Sanjay Gupta', lastVitalsSync: '20 mins ago' },
      { bedId: 'b-102', bedNumber: 'Bed 102', wardName: 'Orthopedic Ward', patientName: 'Pooja Hegde', patientMrn: 'MRN-2026-4412', deteriorationScore: 1, acuityLevel: 'STABLE_GREEN', primaryRiskTrigger: 'Normal Baseline Vitals', icuTransferProbabilityPct: 2.0, attendingPhysician: 'Dr. Arvind Saxena', lastVitalsSync: '25 mins ago' }
    ]);

    // 11. RCM Leakage Risks
    this.runtimeRcmRisks.set(tenantId, [
      { id: 'rcm-1', patientMrn: 'MRN-2026-7782', patientName: 'Ramanathan Iyer', departmentName: 'Cath Lab & OT', potentialLeakageType: 'UNAPPROVED_HIGH_COST_IMPLANT', estimatedRiskAmountInr: 185000.0, riskProbabilityPct: 92.0, suggestedCorrection: 'Upload drug-eluting stent lot sticker and obtain retroactive TPA pre-auth addendum before discharge.', detectedAt: '2026-08-30T05:30:00.000Z' },
      { id: 'rcm-2', patientMrn: 'MRN-2026-3391', patientName: 'Harish Chandra', departmentName: 'Intensive Care Unit (ICU-A)', potentialLeakageType: 'INCOMPLETE_PRE_AUTH_EXTENSION', estimatedRiskAmountInr: 120000.0, riskProbabilityPct: 85.0, suggestedCorrection: 'Submit 48-hour ventilator continuation clinical justification letter to Star Health Insurance.', detectedAt: '2026-08-30T04:15:00.000Z' },
      { id: 'rcm-3', patientMrn: 'MRN-2026-5512', patientName: 'Sunita Mehra', departmentName: 'Surgical ICU', potentialLeakageType: 'UNBILLED_DIAGNOSTIC_ORDER', estimatedRiskAmountInr: 40000.0, riskProbabilityPct: 95.0, suggestedCorrection: 'Post-op Bedside 2D Echocardiogram performed at 22:00 not posted to billing ledger.', detectedAt: '2026-08-30T03:00:00.000Z' }
    ]);

    // 12. Critical Consumable Burn-Rates
    this.runtimeCriticalConsumables.set(tenantId, [
      { skuCode: 'BB-PRBC-O-NEG', itemName: 'Packed Red Blood Cells (O-Negative Universal Donor)', category: 'BLOOD_UNIT', currentStockUnits: 4, dailyBurnRateUnits: 3, projectedRunoutDays: 1.3, urgencyLevel: 'CRITICAL_RUNOUT_24H', vendorLeadTimeDays: 1, autoReplenishmentStatus: 'Emergency Donor Drive Alert Sent' },
      { skuCode: 'MED-NORAD-4MG', itemName: 'Noradrenaline 4mg/2ml Inotropes', category: 'LIFE_SAVING_DRUG', currentStockUnits: 42, dailyBurnRateUnits: 18, projectedRunoutDays: 2.3, urgencyLevel: 'WARNING_RUNOUT_72H', vendorLeadTimeDays: 1, autoReplenishmentStatus: 'PO-2026-8819 Dispatched' },
      { skuCode: 'O2-CYL-D-TYPE', itemName: 'High-Pressure Medical Oxygen Cylinders (D-Type Backup)', category: 'OXYGEN_CYLINDER', currentStockUnits: 28, dailyBurnRateUnits: 5, projectedRunoutDays: 5.6, urgencyLevel: 'ADEQUATE_BUFFER', vendorLeadTimeDays: 1, autoReplenishmentStatus: 'Manifold Bulk Supply Active' }
    ]);

    // 13. What-If Simulation Results
    this.runtimeSimulations.set(tenantId, [
      {
        scenarioId: 'scen-001',
        scenarioName: 'Simulation: Mass Casualty Multi-Vehicle Collision (45 Trauma Patients)',
        simulatedOccupancyPeakPct: 98.4,
        simulatedIcuDeficitBeds: 5,
        simulatedVentilatorShortageCount: 3,
        simulatedEdWaitTimePeakMins: 110,
        simulatedDailyFinancialImpactInr: 2200000.0,
        aiRecommendations: [
          'Activate Disaster Code Black surge protocol.',
          'Divert non-urgent elective surgeries in OT 3 and OT 5 for 24 hours.',
          'Convert 8 recovery PACU beds into emergency trauma overflow resuscitation bays.',
          'Recall off-duty orthopedic and neurotrauma surgical teams.'
        ],
        generatedAt: '2026-08-30T06:00:00.000Z'
      }
    ]);

    // 14. Executive Cryptographic Audit Vault
    const initialTrace: ExecutiveAuditTraceDto = {
      id: crypto.randomUUID(),
      tenantId,
      traceNumber: 'TRACE-EXEC-10001',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'EXECUTIVE_MIS_PLATFORM',
      entityId: tenantId,
      entityCode: 'BOOTSTRAP',
      actorName: 'System Administrator',
      actorRole: 'SUPER_ADMIN',
      justification: 'Hospital MIS & Revenue Cycle Management System Initialization',
      integrityHash: crypto.createHash('sha256').update(`${tenantId}:SYSTEM_BOOTSTRAP:BOOTSTRAP:${Date.now()}`).digest('hex'),
      timestamp: new Date().toISOString()
    };
    this.runtimeAuditTraces.set(tenantId, [initialTrace]);
  }

  // --- Department-Wise Billing ---
  async getDepartmentWiseBilling(tenantId: string): Promise<DepartmentWiseBillingSummaryDto[]> {
    this.ensureTenantInitialized(tenantId);
    const cached = this.runtimeDeptBilling.get(tenantId);
    if (cached) return cached;
    return [];
  }

  // --- Outstanding Unbilled Encounters ---
  async getUnbilledEncounters(tenantId: string): Promise<UnbilledEncounterItemDto[]> {
    this.ensureTenantInitialized(tenantId);
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
    this.ensureTenantInitialized(tenantId);
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
    this.ensureTenantInitialized(tenantId);
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
    this.ensureTenantInitialized(tenantId);
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
    this.ensureTenantInitialized(tenantId);
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
    this.ensureTenantInitialized(tenantId);
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
    this.ensureTenantInitialized(tenantId);
    const cached = this.runtimeEdHistory.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async getOtEfficiencies(tenantId: string): Promise<OtSuiteEfficiencyDto[]> {
    this.ensureTenantInitialized(tenantId);
    const cached = this.runtimeOtEfficiencies.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async getPatientAcuityHeatmap(tenantId: string): Promise<PatientAcuityHeatmapItemDto[]> {
    this.ensureTenantInitialized(tenantId);
    const cached = this.runtimePatientAcuity.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async getRcmLeakageRisks(tenantId: string): Promise<RcmLeakageRiskItemDto[]> {
    this.ensureTenantInitialized(tenantId);
    const cached = this.runtimeRcmRisks.get(tenantId);
    if (cached) return cached;
    return [];
  }

  async getCriticalConsumables(tenantId: string): Promise<CriticalConsumableRunoutDto[]> {
    this.ensureTenantInitialized(tenantId);
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
