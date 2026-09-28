import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, Button, Input, Badge, Select } from '@docsearch/ui-kit';
import {
  pharmacyRevenueGallaService,
  type PharmacyProfitReportSummary
} from '../../services/pharmacy-revenue-galla-service.js';

export interface PharmacyProfitAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInterval?: 'TODAY' | '7D' | '30D' | 'ALL' | 'CUSTOM';
}

export const PharmacyProfitAnalyticsModal: React.FC<PharmacyProfitAnalyticsModalProps> = ({
  isOpen,
  onClose,
  initialInterval = 'TODAY'
}) => {
  // Interval selection: TODAY, 7D, 30D, ALL (Total Profit), CUSTOM
  const [interval, setInterval] = useState<'TODAY' | '7D' | '30D' | 'ALL' | 'CUSTOM'>(initialInterval);

  // Custom date range
  const [customFromDate, setCustomFromDate] = useState<string>(() => {
    const d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0]!;
  });
  const [customToDate, setCustomToDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]!;
  });

  // Table Search and Payment Mode filter
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('ALL');

  // Expanded invoice detail drawer/row
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Profit Report Data
  const [report, setReport] = useState<PharmacyProfitReportSummary>(() =>
    pharmacyRevenueGallaService.getProfitSummary(initialInterval)
  );

  const reloadProfitData = () => {
    const fresh = pharmacyRevenueGallaService.getProfitSummary(
      interval,
      interval === 'CUSTOM' ? customFromDate : undefined,
      interval === 'CUSTOM' ? customToDate : undefined
    );
    setReport(fresh);
  };

  useEffect(() => {
    reloadProfitData();
  }, [interval, customFromDate, customToDate]);

  // Reactive listener for live sales coming from POS counter
  useEffect(() => {
    const handleSync = () => {
      reloadProfitData();
    };
    window.addEventListener('docsearch_billing_updated', handleSync);
    window.addEventListener('docsearch_galla_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('docsearch_billing_updated', handleSync);
      window.removeEventListener('docsearch_galla_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [interval, customFromDate, customToDate]);

  // Filtered invoices according to Search and Mode filter
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return report.invoices.filter((inv) => {
      if (paymentModeFilter !== 'ALL' && inv.paymentMode !== paymentModeFilter) {
        return false;
      }
      if (!q) return true;
      const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
      const matchPatient = inv.patientName.toLowerCase().includes(q);
      const matchDoctor = (inv.doctorName || '').toLowerCase().includes(q);
      const matchMeds = inv.items.some(
        (it) =>
          it.medicationName.toLowerCase().includes(q) ||
          (it.genericName && it.genericName.toLowerCase().includes(q)) ||
          it.batchNumber.toLowerCase().includes(q)
      );
      return matchInv || matchPatient || matchDoctor || matchMeds;
    });
  }, [report.invoices, searchQuery, paymentModeFilter]);

  // Recomputed metrics if user filtered the table
  const displayMetrics = useMemo(() => {
    let rev = 0;
    let cost = 0;
    let profit = 0;
    let units = 0;
    for (const inv of filteredInvoices) {
      rev += inv.revenue;
      cost += inv.cost;
      profit += inv.profit;
      units += inv.totalUnits;
    }
    const margin = rev > 0 ? (profit / rev) * 100 : 0;
    const count = filteredInvoices.length;
    const avgProfit = count > 0 ? profit / count : 0;
    return {
      revenue: Math.round(rev * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin: Math.round(margin * 10) / 10,
      count,
      units,
      avgProfit: Math.round(avgProfit * 100) / 100
    };
  }, [filteredInvoices]);

  const handleExportCsv = () => {
    const filename = `pharmacy_profit_statement_${interval.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    pharmacyRevenueGallaService.exportProfitReportCsv(
      {
        ...report,
        invoices: filteredInvoices,
        totalRevenue: displayMetrics.revenue,
        totalCost: displayMetrics.cost,
        totalProfit: displayMetrics.profit,
        overallMarginPercent: displayMetrics.margin,
        invoiceCount: displayMetrics.count,
        totalUnitsSold: displayMetrics.units,
        avgProfitPerBill: displayMetrics.avgProfit
      },
      filename
    );
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'CASH':
        return <Badge variant="success">💵 Cash</Badge>;
      case 'UPI_QR':
        return <Badge variant="primary">📱 UPI / QR</Badge>;
      case 'CARD':
        return <Badge variant="info">💳 Card</Badge>;
      case 'CREDIT_KHATA':
        return <Badge variant="warning">📒 Khata / Udhaar</Badge>;
      default:
        return <Badge variant="neutral">{mode}</Badge>;
    }
  };

  const getIntervalTitle = () => {
    switch (interval) {
      case 'TODAY':
        return "Today's Profit (आज का शुद्ध मुनाफा)";
      case '7D':
        return 'Last 7 Days Profit (पिछले 7 दिनों का मुनाफा)';
      case '30D':
        return 'Last 30 Days Profit (पिछले 30 दिनों का मुनाफा)';
      case 'ALL':
        return 'Total Cumulative Profit (कुल संचयी मुनाफा - All Time)';
      case 'CUSTOM':
        return `Custom Range Profit (${customFromDate} to ${customToDate})`;
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="📈 Pharmacy Profit & Net Margin Analytics (फार्मेसी शुद्ध मुनाफा रिपोर्ट)"
      isFullPage={true}
      maxWidth="full"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              Showing <strong>{filteredInvoices.length}</strong> of {report.invoices.length} billed sales
            </span>
            <span style={{ color: '#475569' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 700 }}>
              Gross Margin: {displayMetrics.margin.toFixed(1)}%
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              style={{ borderColor: '#10B981', color: '#34D399', fontWeight: 700 }}
            >
              📥 Export Profit CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              style={{ borderColor: '#38BDF8', color: '#38BDF8', fontWeight: 700 }}
            >
              🖨️ Print Report
            </Button>
            <Button variant="primary" size="sm" onClick={onClose} style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700 }}>
              ✕ Close
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '4px' }}>
        {/* 1. Filter Command Bar (Today, 7D, 30D, Total Profit, Custom Date) */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid #1E293B',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}
        >
          {/* Quick Date Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginRight: '4px' }}>
              FILTER PERIOD:
            </span>

            <button
              type="button"
              onClick={() => setInterval('TODAY')}
              style={{
                backgroundColor: interval === 'TODAY' ? '#10B981' : '#1E293B',
                color: interval === 'TODAY' ? '#064E3B' : '#E2E8F0',
                fontWeight: interval === 'TODAY' ? 900 : 700,
                border: interval === 'TODAY' ? '1.5px solid #34D399' : '1px solid #334155',
                borderRadius: '8px',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>⚡</span>
              <span>Today (आज)</span>
            </button>

            <button
              type="button"
              onClick={() => setInterval('7D')}
              style={{
                backgroundColor: interval === '7D' ? '#10B981' : '#1E293B',
                color: interval === '7D' ? '#064E3B' : '#E2E8F0',
                fontWeight: interval === '7D' ? 900 : 700,
                border: interval === '7D' ? '1.5px solid #34D399' : '1px solid #334155',
                borderRadius: '8px',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📅</span>
              <span>7 Days (7 दिन)</span>
            </button>

            <button
              type="button"
              onClick={() => setInterval('30D')}
              style={{
                backgroundColor: interval === '30D' ? '#10B981' : '#1E293B',
                color: interval === '30D' ? '#064E3B' : '#E2E8F0',
                fontWeight: interval === '30D' ? 900 : 700,
                border: interval === '30D' ? '1.5px solid #34D399' : '1px solid #334155',
                borderRadius: '8px',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📆</span>
              <span>30 Days (30 दिन)</span>
            </button>

            <button
              type="button"
              onClick={() => setInterval('ALL')}
              style={{
                backgroundColor: interval === 'ALL' ? '#10B981' : '#1E293B',
                color: interval === 'ALL' ? '#064E3B' : '#E2E8F0',
                fontWeight: interval === 'ALL' ? 900 : 700,
                border: interval === 'ALL' ? '1.5px solid #34D399' : '1px solid #334155',
                borderRadius: '8px',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📊</span>
              <span>Total Profit (कुल मुनाफा)</span>
            </button>

            <button
              type="button"
              onClick={() => setInterval('CUSTOM')}
              style={{
                backgroundColor: interval === 'CUSTOM' ? '#0284C7' : '#1E293B',
                color: interval === 'CUSTOM' ? '#F0F9FF' : '#E2E8F0',
                fontWeight: interval === 'CUSTOM' ? 900 : 700,
                border: interval === 'CUSTOM' ? '1.5px solid #38BDF8' : '1px solid #334155',
                borderRadius: '8px',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🎯</span>
              <span>Custom Date (कस्टम तारीख)</span>
            </button>
          </div>

          {/* Custom Date Pickers when CUSTOM is active */}
          {interval === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(2, 132, 199, 0.15)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #0284C7' }}>
              <span style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: 700 }}>From:</span>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                style={{
                  backgroundColor: '#0B1329',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.8rem'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: 700 }}>To:</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                style={{
                  backgroundColor: '#0B1329',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.8rem'
                }}
              />
              <Button size="sm" variant="primary" onClick={reloadProfitData} style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                Apply
              </Button>
            </div>
          )}

          {/* Heading Label */}
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block' }}>
              ACTIVE VIEW
            </span>
            <strong style={{ fontSize: '0.92rem', color: '#34D399' }}>
              {getIntervalTitle()}
            </strong>
          </div>
        </div>

        {/* 2. Executive Profit KPI Showcase Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          {/* Card 1: Net Profit */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '2px solid #10B981',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                💰 Total Net Profit (शुद्ध लाभ)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#064E3B', backgroundColor: '#34D399', padding: '2px 8px', borderRadius: '4px', fontWeight: 900 }}>
                {displayMetrics.margin.toFixed(1)}% Margin
              </span>
            </div>
            <div style={{ fontSize: '1.95rem', fontWeight: 900, color: '#34D399', fontFamily: 'monospace', marginTop: '6px' }}>
              +₹{displayMetrics.profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#A7F3D0', marginTop: '4px', fontWeight: 600 }}>
              Counter Sale (MRP) minus Wholesale Cost (PTR)
            </div>
          </div>

          {/* Card 2: Sales Revenue */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #1E293B',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🏷️ Total Sales Revenue (कुल बिक्री)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', fontFamily: 'monospace', marginTop: '6px' }}>
              ₹{displayMetrics.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px', fontWeight: 600 }}>
              Gross Inflow across {displayMetrics.count} Invoices
            </div>
          </div>

          {/* Card 3: Wholesale Acquisition Cost */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #1E293B',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              📦 Cost of Goods Sold (PTR खरीद लागत)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace', marginTop: '6px' }}>
              ₹{displayMetrics.cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#7DD3FC', marginTop: '4px', fontWeight: 600 }}>
              Wholesale Stockist Purchase Price
            </div>
          </div>

          {/* Card 4: Bills Dispensed */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #1E293B',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🧾 Invoices & Average Profit
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FBBF24', fontFamily: 'monospace', marginTop: '6px' }}>
              {displayMetrics.count} <span style={{ fontSize: '0.9rem', color: '#FCD34D' }}>Bills</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#FDE68A', marginTop: '4px', fontWeight: 600 }}>
              Avg Profit per Bill: ₹{displayMetrics.avgProfit.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Card 5: Total Units Sold */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #1E293B',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              💊 Volume Sold
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#C084FC', fontFamily: 'monospace', marginTop: '6px' }}>
              {displayMetrics.units.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#D8B4FE' }}>Units</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#E9D5FF', marginTop: '4px', fontWeight: 600 }}>
              Strips, Vials & Bottles Handed Over
            </div>
          </div>
        </div>

        {/* 3. Mid Section: Payment Mode Profits & Top Profitable Medicines Leaderboard */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* 3A: Payment Mode Profit Breakdown */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💳</span>
              <span>Profit Contribution by Payment Method</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {/* Cash */}
              <div style={{ backgroundColor: '#0B1329', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1E293B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399' }}>💵 CASH</span>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{report.paymentModeProfits.CASH.count} Bills</span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px', fontFamily: 'monospace' }}>
                  +₹{report.paymentModeProfits.CASH.profit.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>
                  Revenue: ₹{report.paymentModeProfits.CASH.revenue.toLocaleString('en-IN')}
                </div>
              </div>

              {/* UPI */}
              <div style={{ backgroundColor: '#0B1329', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1E293B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8' }}>📱 UPI / QR</span>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{report.paymentModeProfits.UPI_QR.count} Bills</span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px', fontFamily: 'monospace' }}>
                  +₹{report.paymentModeProfits.UPI_QR.profit.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>
                  Revenue: ₹{report.paymentModeProfits.UPI_QR.revenue.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Card */}
              <div style={{ backgroundColor: '#0B1329', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1E293B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A5B4FC' }}>💳 CARD / POS</span>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{report.paymentModeProfits.CARD.count} Bills</span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px', fontFamily: 'monospace' }}>
                  +₹{report.paymentModeProfits.CARD.profit.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>
                  Revenue: ₹{report.paymentModeProfits.CARD.revenue.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Khata */}
              <div style={{ backgroundColor: '#0B1329', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1E293B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FBBF24' }}>📒 KHATA (Udhaar)</span>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{report.paymentModeProfits.CREDIT_KHATA.count} Bills</span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px', fontFamily: 'monospace' }}>
                  +₹{report.paymentModeProfits.CREDIT_KHATA.profit.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>
                  Revenue: ₹{report.paymentModeProfits.CREDIT_KHATA.revenue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* 3B: Top Profitable Medicines Leaderboard */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏆</span>
              <span>Top Profitable Medicines ({report.topProfitableMeds.length} Products)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              {report.topProfitableMeds.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>
                  No item sales in this interval.
                </div>
              ) : (
                report.topProfitableMeds.map((med, idx) => (
                  <div
                    key={med.medicationName}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#0B1329',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #1E293B'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800, width: '18px' }}>
                        #{idx + 1}
                      </span>
                      <div>
                        <strong style={{ fontSize: '0.8rem', color: '#F8FAFC' }}>{med.medicationName}</strong>
                        <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                          {med.quantity} Units Sold • Rev: ₹{med.revenue.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#34D399', fontFamily: 'monospace' }}>
                        +₹{med.profit.toLocaleString('en-IN')}
                      </strong>
                      <div style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700 }}>
                        {med.marginPercent.toFixed(1)}% margin
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 4. Search & Filter Bar for Invoices Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Patient Name, Invoice Number (INV-1001), Doctor, or Medicine..."
          />

          <Select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Payment Modes' },
              { value: 'CASH', label: '💵 Cash Only' },
              { value: 'UPI_QR', label: '📱 UPI / QR Only' },
              { value: 'CARD', label: '💳 Card Only' },
              { value: 'CREDIT_KHATA', label: '📒 Credit / Khata (Udhaar)' }
            ]}
          />
        </div>

        {/* 5. Detailed Invoices & Line Items Profit Table */}
        <div
          style={{
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 470px)',
            border: '1px solid #1E293B',
            borderRadius: '10px',
            backgroundColor: '#0A0F1D'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#0F172A', borderBottom: '1.5px solid #334155' }}>
              <tr style={{ color: '#94A3B8', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', width: '35px' }}>#</th>
                <th style={{ padding: '10px 12px', width: '130px' }}>Bill & Time</th>
                <th style={{ padding: '10px 12px', minWidth: '150px' }}>Patient & Doctor</th>
                <th style={{ padding: '10px 12px', minWidth: '180px' }}>Medicines Dispensed</th>
                <th style={{ padding: '10px 12px', width: '110px' }}>Mode</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', width: '95px' }}>Sale (MRP)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', width: '95px' }}>Cost (PTR)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', width: '105px' }}>Net Profit</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '85px' }}>Margin %</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>View</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No sales invoices found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  return (
                    <React.Fragment key={inv.id}>
                      <tr
                        style={{
                          borderBottom: '1px solid #1E293B',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.45)',
                          transition: 'background 0.1s ease'
                        }}
                      >
                        <td style={{ padding: '8px 12px', color: '#64748B', fontWeight: 700 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <strong style={{ color: '#38BDF8', fontFamily: 'monospace', display: 'block' }}>
                            {inv.invoiceNumber}
                          </strong>
                          <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            {inv.invoiceDate.split(',')[0]}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <strong style={{ color: '#F8FAFC', display: 'block' }}>{inv.patientName}</strong>
                          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{inv.doctorName || 'Counter Sale'}</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>
                            {inv.items.map((it) => `${it.medicationName} (${it.quantity}x)`).join(', ')}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                            {inv.totalUnits} Total Units
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {getModeBadge(inv.paymentMode)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
                          ₹{inv.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>
                          ₹{inv.cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, color: '#34D399', fontFamily: 'monospace' }}>
                          +₹{inv.profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 800
                            }}
                          >
                            {inv.marginPercent.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#38BDF8',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              padding: '2px 4px'
                            }}
                            title="Toggle Line-Item Profit Details"
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Line-Item Profit Audit Sub-Table */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)' }}>
                          <td colSpan={10} style={{ padding: '12px 16px' }}>
                            <div style={{ backgroundColor: '#0B1329', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px' }}>
                              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#38BDF8', marginBottom: '8px', textTransform: 'uppercase' }}>
                                🔍 Line-Item Medicine Profit Breakdown for {inv.invoiceNumber}
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                                <thead>
                                  <tr style={{ color: '#94A3B8', borderBottom: '1px solid #1E293B', textAlign: 'left' }}>
                                    <th style={{ padding: '4px 6px' }}>Medicine Name</th>
                                    <th style={{ padding: '4px 6px' }}>Batch No</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>Qty</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Sale Price (MRP)</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Cost Price (PTR)</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Total Sale</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Total Cost</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Line Profit</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>Margin %</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inv.items.map((it, itemIdx) => (
                                    <tr key={`${inv.id}-item-${itemIdx}`} style={{ borderBottom: '1px solid #1E293B' }}>
                                      <td style={{ padding: '6px' }}>
                                        <strong style={{ color: '#F8FAFC' }}>{it.medicationName}</strong>
                                        {it.genericName && (
                                          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{it.genericName}</div>
                                        )}
                                      </td>
                                      <td style={{ padding: '6px', fontFamily: 'monospace', color: '#94A3B8' }}>
                                        {it.batchNumber}
                                      </td>
                                      <td style={{ padding: '6px', textAlign: 'center', fontWeight: 800, color: '#F8FAFC' }}>
                                        {it.quantity}
                                      </td>
                                      <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'monospace' }}>
                                        ₹{it.salePrice.toFixed(2)}
                                      </td>
                                      <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'monospace', color: '#38BDF8' }}>
                                        ₹{it.purchaseCostPtr.toFixed(2)}
                                      </td>
                                      <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                                        ₹{it.totalSale.toFixed(2)}
                                      </td>
                                      <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'monospace', color: '#38BDF8' }}>
                                        ₹{it.totalCost.toFixed(2)}
                                      </td>
                                      <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: '#34D399' }}>
                                        +₹{it.profit.toFixed(2)}
                                      </td>
                                      <td style={{ padding: '6px', textAlign: 'center', fontWeight: 700, color: '#10B981' }}>
                                        {it.marginPercent.toFixed(1)}%
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Dialog>
  );
};
