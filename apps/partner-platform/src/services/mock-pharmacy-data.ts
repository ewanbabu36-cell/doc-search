/**
 * Operational Live Telemetry
 * Phase 2.8: Pharmacy, Medication Dispensing & Inventory Management Clean State
 */

import type {
  MedicationCatalogDto,
  PharmacyInventoryDto,
  PharmacyBatchDto,
  PharmacyPrescriptionDto,
  PharmacyDispensingDto,
  PharmacyStockMovementDto,
  PharmacyReturnDto,
  PharmacyStockAdjustmentDto,
  PharmacySubstitutionRequestDto,
  PharmacyAuditTraceDto,
  PharmacyOverviewDto
} from '@docsearch/api-contracts';

export const MOCK_PARTNER_ID = '22222222-2222-4222-8222-222222222201';
export const MOCK_ORGANIZATION_ID = '44444444-4444-4444-8444-444444444401';
export const MOCK_BRANCH_ID = '88888888-1111-4888-8888-111111111101';

export const MOCK_PHARMACY_OVERVIEW: PharmacyOverviewDto = {
  prescriptionsToday: 0,
  pendingVerificationCount: 0,
  readyForDispensingCount: 0,
  dispensedTodayCount: 0,
  partiallyDispensedCount: 0,
  lowStockAlertsCount: 0,
  nearExpiryBatchesCount: 0,
  criticalExceptionsCount: 0
};

export const MOCK_MEDICATION_CATALOG: MedicationCatalogDto[] = [];
export const MOCK_PHARMACY_BATCHES: PharmacyBatchDto[] = [];
export const MOCK_PHARMACY_INVENTORY: PharmacyInventoryDto[] = [];
export const MOCK_PHARMACY_PRESCRIPTIONS: PharmacyPrescriptionDto[] = [];
export const MOCK_PHARMACY_DISPENSING: PharmacyDispensingDto[] = [];
export const MOCK_PHARMACY_STOCK_MOVEMENTS: PharmacyStockMovementDto[] = [];
export const MOCK_PHARMACY_SUBSTITUTIONS: PharmacySubstitutionRequestDto[] = [];
export const MOCK_PHARMACY_RETURNS: PharmacyReturnDto[] = [];
export const MOCK_PHARMACY_ADJUSTMENTS: PharmacyStockAdjustmentDto[] = [];
export const MOCK_PHARMACY_AUDIT_TRACES: PharmacyAuditTraceDto[] = [];
