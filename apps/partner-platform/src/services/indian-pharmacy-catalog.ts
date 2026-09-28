/**
 * Master All-India Clinical Pharmacy Formulary & Generic Drug Library
 * 
 * Complete National Compendium covering:
 * - 🏛️ Ethical Branded Medicines across top Indian Pharma Houses:
 *   Sun Pharma, Cipla, Mankind, Abbott, Alkem, GSK, Torrent, Lupin, Dr. Reddy's,
 *   Intas, Macleods, Ipca, Aristo, Pfizer, Glenmark, Micro Labs, Blue Cross,
 *   Alembic, FDC, USV, Zydus, Sanofi, Wockhardt, Meyer Organics, Entod, Allergan, etc.
 * - 🌿 Generic Medicines & Affordable Alternatives:
 *   PMBJP Jan Aushadhi, Generic Aadhaar, Zeelab Pharmacy, Davaindia Generic Pharmacy,
 *   StayHappi Generic Pharmacy, Leeford Healthcare, etc.
 * - All Dosage Forms: Tablets, Capsules, Injections, Drops, Syrups, Ointments, Inhalers, IV Parenterals.
 */

import type { PharmacyBatchDto } from '@docsearch/api-contracts';

export type ScheduleDrugType = 'OTC' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X' | 'GENERAL';

export interface IndianMedicationFormularyItem {
  id: string;
  medicationCode: string;
  brandName: string;
  brandType?: 'ETHICAL' | 'GENERIC';
  genericName: string;
  strength: string;
  dosageForm: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'OINTMENT' | 'DROPS' | 'INHALER' | 'IV_FLUID';
  category: 'ANALGESIC' | 'ANTIBIOTIC' | 'GASTROINTESTINAL' | 'CARDIOVASCULAR' | 'ANTIDIABETIC' | 'RESPIRATORY' | 'DERMATOLOGICAL' | 'VITAMINS_MINERALS' | 'IV_EMERGENCY' | 'GENERAL';
  scheduleType: ScheduleDrugType;
  packConfiguration: string;
  packUnits: number;
  unitOfMeasure: string;
  mrp: number;
  unitPrice: number;
  costPrice: number;
  gstRate: number;
  hsnCode: string;
  manufacturer: string;
  barcode: string;
  janAushadhiEquivalent?: {
    genericCode: string;
    genericTitle: string;
    mrp: number;
    unitPrice: number;
    savingsPercent: number;
  };
  ddiWarnings?: string[];
}

import formularyJson from './indian-pharmacy-formulary.json' with { type: 'json' };

export const INDIAN_PHARMACY_FORMULARY: IndianMedicationFormularyItem[] = formularyJson as IndianMedicationFormularyItem[];

/**
 * Generate synthetic realistic batches with FEFO expiry dates for all Indian formulary medicines
 */
export function generateFormularyBatches(tenantId: string): PharmacyBatchDto[] {
  const batches: PharmacyBatchDto[] = [];
  const now = new Date();
  const nowIso = now.toISOString();

  for (let i = 0; i < INDIAN_PHARMACY_FORMULARY.length; i++) {
    const med = INDIAN_PHARMACY_FORMULARY[i]!;
    
    // Batch 1: Primary FEFO batch expiring in 18-24 months
    const exp1 = new Date(now.getFullYear() + 2, (now.getMonth() + i) % 12, 15);
    const mfg1 = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const days1 = Math.round((exp1.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    batches.push({
      id: `batch-${med.medicationCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-01`,
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222201',
      organizationId: '44444444-4444-4444-8444-444444444401',
      branchId: '88888888-1111-4888-8888-111111111101',
      medicationId: med.id,
      medicationCode: med.medicationCode,
      medicationName: med.brandName,
      batchNumber: `BTH-${med.medicationCode.split('-')[1] || 'IND'}-26A`,
      manufacturer: med.manufacturer,
      manufacturingDate: mfg1.toISOString().split('T')[0]!,
      expiryDate: exp1.toISOString().split('T')[0]!,
      receivedQuantity: 300,
      availableQuantity: 240,
      reservedQuantity: 0,
      unitCost: med.costPrice.toFixed(2),
      status: 'ACTIVE',
      daysToExpiry: days1,
      createdAt: nowIso,
      updatedAt: nowIso
    });

    // Batch 2: Near expiry for select items
    if (i % 8 === 0) {
      const exp2 = new Date(now.getFullYear(), now.getMonth() + 1, 28);
      const mfg2 = new Date(now.getFullYear() - 2, now.getMonth() - 3, 1);
      const days2 = Math.round((exp2.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      batches.push({
        id: `batch-${med.medicationCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-02-near`,
        tenantId,
        partnerId: '22222222-2222-4222-8222-222222222201',
        organizationId: '44444444-4444-4444-8444-444444444401',
        branchId: '88888888-1111-4888-8888-111111111101',
        medicationId: med.id,
        medicationCode: med.medicationCode,
        medicationName: med.brandName,
        batchNumber: `BTH-${med.medicationCode.split('-')[1] || 'IND'}-24Z`,
        manufacturer: med.manufacturer,
        manufacturingDate: mfg2.toISOString().split('T')[0]!,
        expiryDate: exp2.toISOString().split('T')[0]!,
        receivedQuantity: 100,
        availableQuantity: 18,
        reservedQuantity: 0,
        unitCost: (med.costPrice * 0.9).toFixed(2),
        status: 'NEAR_EXPIRY',
        daysToExpiry: days2,
        createdAt: nowIso,
        updatedAt: nowIso
      });
    }
  }

  return batches;
}
