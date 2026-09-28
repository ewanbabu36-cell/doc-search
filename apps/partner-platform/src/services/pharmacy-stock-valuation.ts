/**
 * Pharmacy Live Stock Valuation Service
 * 
 * Computes consolidated inventory financial metrics:
 * 1. Purchase Value (Kharid Mulya / Taxable PTR Cost)
 * 2. Sale Value (Bikri Mulya / Retail MRP Valuation)
 * 3. Gross Profit Margin / Expected Profit Potential
 * 4. Total Stock Volume (Units, Batches, SKUs)
 */

import type { PharmacyBatchDto, PharmacyInventoryDto } from '@docsearch/api-contracts';
import { INDIAN_PHARMACY_FORMULARY, type IndianMedicationFormularyItem } from './indian-pharmacy-catalog.js';

export interface StockValuationSummary {
  totalBatches: number;
  totalUnits: number;
  totalPurchaseValue: number; // Kharid Mulya (Taxable PTR Cost)
  totalSaleValue: number;     // Bikri Mulya (Retail MRP Valuation)
  grossProfit: number;        // Expected Profit Potential (totalSaleValue - totalPurchaseValue)
  profitMarginPercent: number;// Profit Margin % ((grossProfit / totalSaleValue) * 100)
  totalSkus: number;          // Total Distinct Medications
  lowStockCount: number;      // Items below reorder level
  nearExpiryCount: number;    // Batches expiring within 60 days
}

// Pre-indexed lookup maps for instant calculation
const formularyById = new Map<string, IndianMedicationFormularyItem>();
const formularyByCode = new Map<string, IndianMedicationFormularyItem>();
const formularyByName = new Map<string, IndianMedicationFormularyItem>();

for (const item of INDIAN_PHARMACY_FORMULARY) {
  formularyById.set(item.id, item);
  formularyByCode.set(item.medicationCode, item);
  formularyByName.set(item.brandName.toLowerCase(), item);
}

function matchFormularyItem(
  medId?: string,
  medCode?: string,
  brandName?: string,
  genericName?: string
): IndianMedicationFormularyItem | undefined {
  if (medId && formularyById.has(medId)) return formularyById.get(medId);
  if (medCode && formularyByCode.has(medCode)) return formularyByCode.get(medCode);
  if (brandName) {
    const lower = brandName.toLowerCase().trim();
    if (formularyByName.has(lower)) return formularyByName.get(lower);
    const match = INDIAN_PHARMACY_FORMULARY.find(
      (f) => lower.includes(f.brandName.toLowerCase()) || f.brandName.toLowerCase().includes(lower)
    );
    if (match) return match;
  }
  if (genericName) {
    const lower = genericName.toLowerCase().trim();
    const match = INDIAN_PHARMACY_FORMULARY.find(
      (f) => lower.includes(f.genericName.toLowerCase()) || f.genericName.toLowerCase().includes(lower)
    );
    if (match) return match;
  }
  return undefined;
}

/**
 * Calculates complete live stock valuation across batches and inventory items.
 */
export function calculateStockValuation(
  batches: PharmacyBatchDto[] = [],
  inventory: PharmacyInventoryDto[] = []
): StockValuationSummary {
  const invMap = new Map<string, PharmacyInventoryDto>();
  for (const inv of inventory) {
    if (inv.medicationId) invMap.set(inv.medicationId, inv);
    if (inv.medicationCode) invMap.set(inv.medicationCode, inv);
  }

  const processedMedKeys = new Set<string>();
  const activeMedKeys = new Set<string>();
  let totalBatches = 0;
  let totalUnits = 0;
  let totalPurchaseValue = 0;
  let totalSaleValue = 0;
  let nearExpiryCount = 0;

  for (const batch of batches) {
    const qty = batch.availableQuantity ?? 0;
    if (qty <= 0 && batch.status === 'DEPLETED') continue;

    totalBatches++;
    totalUnits += qty;
    if (batch.medicationId) activeMedKeys.add(batch.medicationId);
    if (batch.medicationCode) activeMedKeys.add(batch.medicationCode);

    const inv =
      (batch.medicationId ? invMap.get(batch.medicationId) : undefined) ||
      (batch.medicationCode ? invMap.get(batch.medicationCode) : undefined);

    const rawName = batch.medicationName || inv?.brandName || 'Medicine';
    const brand = inv?.brandName || (rawName.includes('(') ? rawName.split('(')[0]?.trim() : rawName) || 'Medicine';
    const generic = inv?.genericName || (rawName.includes('(') ? rawName.split('(')[1]?.replace(')', '').trim() : '') || '';
    const formItem = matchFormularyItem(batch.medicationId, batch.medicationCode, brand, generic);

    const unitCostNum = parseFloat(batch.unitCost || '0');
    const rate = unitCostNum > 0 ? unitCostNum : (formItem?.costPrice || (formItem?.unitPrice ? formItem.unitPrice * 0.75 : 15.0));
    const mrp = formItem?.mrp || Math.round(rate * 1.45 * 100) / 100;

    totalPurchaseValue += Math.round(qty * rate * 100) / 100;
    totalSaleValue += Math.round(qty * mrp * 100) / 100;

    if (batch.daysToExpiry !== undefined && batch.daysToExpiry >= 0 && batch.daysToExpiry < 60 && batch.status !== 'EXPIRED') {
      nearExpiryCount++;
    }

    if (batch.medicationId) processedMedKeys.add(batch.medicationId);
    if (batch.medicationCode) processedMedKeys.add(batch.medicationCode);
  }

  // Also include inventory items that haven't been accounted for by batches
  let lowStockCount = 0;
  for (const inv of inventory) {
    const qty = inv.availableQuantity ?? 0;
    if (!processedMedKeys.has(inv.medicationId) && !processedMedKeys.has(inv.medicationCode)) {
      if (qty > 0) {
        totalUnits += qty;
        if (inv.medicationId) activeMedKeys.add(inv.medicationId);
        if (inv.medicationCode) activeMedKeys.add(inv.medicationCode);

        const formItem = matchFormularyItem(inv.medicationId, inv.medicationCode, inv.brandName, inv.genericName);
        const rate = formItem?.costPrice || (formItem?.unitPrice ? formItem.unitPrice * 0.75 : 20.0);
        const mrp = formItem?.mrp || Math.round(rate * 1.45 * 100) / 100;

        totalPurchaseValue += Math.round(qty * rate * 100) / 100;
        totalSaleValue += Math.round(qty * mrp * 100) / 100;
      }
    }
    if (qty <= (inv.reorderLevel ?? 20)) {
      lowStockCount++;
    }
  }

  const grossProfit = Math.max(0, totalSaleValue - totalPurchaseValue);
  const profitMarginPercent = totalSaleValue > 0 ? (grossProfit / totalSaleValue) * 100 : 0;
  const totalSkus = activeMedKeys.size || (inventory.length > 0 ? inventory.length : totalBatches);

  return {
    totalBatches,
    totalUnits,
    totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
    totalSaleValue: Math.round(totalSaleValue * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
    totalSkus,
    lowStockCount,
    nearExpiryCount
  };
}
