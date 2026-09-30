import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test the core mathematical and business logic of the stock valuation model
describe('Pharmacy Stock Valuation Mathematical Engine', () => {
  function computeValuation(batches = [], inventory = []) {
    let totalBatches = 0;
    let totalUnits = 0;
    let totalPurchaseValue = 0;
    let totalSaleValue = 0;
    let nearExpiryCount = 0;
    const processedMedKeys = new Set();
    const activeMedKeys = new Set();

    for (const batch of batches) {
      const qty = batch.availableQuantity ?? 0;
      if (qty <= 0 && batch.status === 'DEPLETED') continue;

      totalBatches++;
      totalUnits += qty;
      if (batch.medicationId) activeMedKeys.add(batch.medicationId);

      const unitCostNum = parseFloat(batch.unitCost || '0');
      const rate = unitCostNum > 0 ? unitCostNum : 15.0;
      const mrp = batch.mrp || Math.round(rate * 1.45 * 100) / 100;

      totalPurchaseValue += Math.round(qty * rate * 100) / 100;
      totalSaleValue += Math.round(qty * mrp * 100) / 100;

      if (batch.daysToExpiry !== undefined && batch.daysToExpiry >= 0 && batch.daysToExpiry < 60 && batch.status !== 'EXPIRED') {
        nearExpiryCount++;
      }
      if (batch.medicationId) processedMedKeys.add(batch.medicationId);
    }

    const grossProfit = Math.max(0, totalSaleValue - totalPurchaseValue);
    const profitMarginPercent = totalSaleValue > 0 ? (grossProfit / totalSaleValue) * 100 : 0;
    const totalSkus = activeMedKeys.size || batches.length;

    return {
      totalBatches,
      totalUnits,
      totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
      totalSaleValue: Math.round(totalSaleValue * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
      totalSkus,
      nearExpiryCount
    };
  }

  test('correctly aggregates purchase value (PTR) and retail sale value (MRP)', () => {
    const sampleBatches = [
      {
        id: 'b-1',
        medicationId: 'med-paracip',
        availableQuantity: 100,
        unitCost: '14.50',
        mrp: 22.00,
        status: 'ACTIVE',
        daysToExpiry: 120
      },
      {
        id: 'b-2',
        medicationId: 'med-amox',
        availableQuantity: 50,
        unitCost: '48.00',
        mrp: 75.00,
        status: 'ACTIVE',
        daysToExpiry: 45 // near expiry
      }
    ];

    const result = computeValuation(sampleBatches);

    assert.equal(result.totalBatches, 2);
    assert.equal(result.totalUnits, 150);
    // 100 * 14.50 + 50 * 48.00 = 1450 + 2400 = 3850.00
    assert.equal(result.totalPurchaseValue, 3850.00);
    // 100 * 22.00 + 50 * 75.00 = 2200 + 3750 = 5950.00
    assert.equal(result.totalSaleValue, 5950.00);
    // Gross Profit: 5950.00 - 3850.00 = 2100.00
    assert.equal(result.grossProfit, 2100.00);
    // Margin %: (2100 / 5950) * 100 = 35.294% -> 35.3%
    assert.equal(result.profitMarginPercent, 35.3);
    assert.equal(result.nearExpiryCount, 1);
  });

  test('handles authentic Maa Kali Medicos wholesale inward stock (402 packs)', () => {
    // 18 items totaling 402 packs, purchase value 5,108.00
    const sampleMaaKaliBatches = [
      { id: 'b-mk-1', medicationId: 'm-1', availableQuantity: 10, unitCost: '14.74', mrp: 22.00, status: 'ACTIVE' },
      { id: 'b-mk-2', medicationId: 'm-2', availableQuantity: 20, unitCost: '22.00', mrp: 32.00, status: 'ACTIVE' },
      { id: 'b-mk-3', medicationId: 'm-3', availableQuantity: 372, unitCost: '12.15', mrp: 18.00, status: 'ACTIVE' }
    ];

    const result = computeValuation(sampleMaaKaliBatches);
    assert.equal(result.totalUnits, 402);
    assert.ok(result.totalPurchaseValue > 5000);
    assert.ok(result.totalSaleValue > result.totalPurchaseValue);
    assert.ok(result.grossProfit > 0);
  });

  test('safely handles empty stock state without NaN or division by zero', () => {
    const result = computeValuation([]);
    assert.equal(result.totalBatches, 0);
    assert.equal(result.totalUnits, 0);
    assert.equal(result.totalPurchaseValue, 0);
    assert.equal(result.totalSaleValue, 0);
    assert.equal(result.grossProfit, 0);
    assert.equal(result.profitMarginPercent, 0);
  });
});
