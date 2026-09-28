import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Pharmacy Profit & Net Margin Mathematical Engine', () => {
  // Mock Formulary Catalog PTR lookup
  const mockFormulary = [
    { brandName: 'Dolo 650', costPrice: 24.00, mrp: 34.34 },
    { brandName: 'Augmentin 625 Duo', costPrice: 145.00, mrp: 204.00 },
    { brandName: 'Pan 40', costPrice: 110.00, mrp: 155.00 },
    { brandName: 'Telma 40', costPrice: 154.00, mrp: 220.00 },
    { brandName: 'Ascoril-LS Syrup', costPrice: 82.50, mrp: 118.00 }
  ];

  function calculateProfit(items) {
    let totalRev = 0;
    let totalCost = 0;

    for (const it of items) {
      const match = mockFormulary.find(
        (f) => f.brandName.toLowerCase() === it.name.toLowerCase()
      );
      const ptr = match?.costPrice ?? Math.round(it.rate * 0.70 * 100) / 100;
      const lineRev = it.qty * it.rate;
      const lineCost = it.qty * ptr;

      totalRev += lineRev;
      totalCost += lineCost;
    }

    const profit = Math.max(0, totalRev - totalCost);
    const marginPct = totalRev > 0 ? (profit / totalRev) * 100 : 0;

    return {
      revenue: Math.round(totalRev * 100) / 100,
      cost: Math.round(totalCost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      marginPercent: Math.round(marginPct * 10) / 10
    };
  }

  it('1. correctly computes today profit = sale revenue - wholesale PTR cost', () => {
    // Ramesh Sharma sale: 2x Dolo 650 (@34.34, PTR 24.00) + 1x Augmentin 625 (@204, PTR 145.00)
    // Rev = (2 * 34.34) + 204 = 68.68 + 204 = 272.68
    // Cost = (2 * 24.00) + 145 = 48.00 + 145 = 193.00
    // Profit = 272.68 - 193.00 = 79.68
    const items = [
      { name: 'Dolo 650', qty: 2, rate: 34.34 },
      { name: 'Augmentin 625 Duo', qty: 1, rate: 204.00 }
    ];

    const res = calculateProfit(items);
    assert.strictEqual(res.revenue, 272.68);
    assert.strictEqual(res.cost, 193.00);
    assert.strictEqual(res.profit, 79.68);
    assert.ok(res.marginPercent > 29 && res.marginPercent < 30);
  });

  it('2. handles multi-interval filtering (Today, 7D, 30D, All, Custom Range)', () => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const testInvoices = [
      { id: '1', createdAt: new Date(now - 1 * 3600000).toISOString(), grandTotal: 272.68, cost: 193.00 }, // 1h ago (Today)
      { id: '2', createdAt: new Date(now - 4 * 3600000).toISOString(), grandTotal: 441.00, cost: 310.00 }, // 4h ago (Today)
      { id: '3', createdAt: new Date(now - 2 * dayMs).toISOString(), grandTotal: 500.00, cost: 350.00 },    // 2d ago (7D)
      { id: '4', createdAt: new Date(now - 15 * dayMs).toISOString(), grandTotal: 1200.00, cost: 840.00 },  // 15d ago (30D)
      { id: '5', createdAt: new Date(now - 45 * dayMs).toISOString(), grandTotal: 2000.00, cost: 1400.00 }  // 45d ago (All Time only)
    ];

    const filterByInterval = (interval, fromDate, toDate) => {
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
      const sevenDaysStart = todayStart - 6 * dayMs;
      const thirtyDaysStart = todayStart - 29 * dayMs;

      let start = 0;
      let end = Number.MAX_SAFE_INTEGER;

      if (interval === 'TODAY') {
        start = todayStart;
        end = todayStart + dayMs - 1;
      } else if (interval === '7D') {
        start = sevenDaysStart;
        end = now;
      } else if (interval === '30D') {
        start = thirtyDaysStart;
        end = now;
      } else if (interval === 'CUSTOM') {
        if (fromDate) start = new Date(`${fromDate}T00:00:00`).getTime();
        if (toDate) end = new Date(`${toDate}T23:59:59.999`).getTime();
      }

      return testInvoices.filter((inv) => {
        const t = new Date(inv.createdAt).getTime();
        return t >= start && t <= end;
      });
    };

    const todayInvs = filterByInterval('TODAY');
    assert.strictEqual(todayInvs.length, 2);

    const sevenDayInvs = filterByInterval('7D');
    assert.strictEqual(sevenDayInvs.length, 3);

    const thirtyDayInvs = filterByInterval('30D');
    assert.strictEqual(thirtyDayInvs.length, 4);

    const allInvs = filterByInterval('ALL');
    assert.strictEqual(allInvs.length, 5);

    // Custom date range spanning 10 days ago to 20 days ago
    const d10 = new Date(now - 20 * dayMs).toISOString().slice(0, 10);
    const d20 = new Date(now - 10 * dayMs).toISOString().slice(0, 10);
    const customInvs = filterByInterval('CUSTOM', d10, d20);
    assert.strictEqual(customInvs.length, 1);
    assert.strictEqual(customInvs[0].id, '4');
  });

  it('3. safely handles empty sales state without NaN or division by zero', () => {
    const res = calculateProfit([]);
    assert.strictEqual(res.revenue, 0);
    assert.strictEqual(res.cost, 0);
    assert.strictEqual(res.profit, 0);
    assert.strictEqual(res.marginPercent, 0);
    assert.ok(!Number.isNaN(res.marginPercent));
  });
});
