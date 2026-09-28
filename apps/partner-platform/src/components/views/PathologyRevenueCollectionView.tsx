import React, { useState, useEffect, useMemo } from 'react';
import {
  pathologyRevenueService,
  type LabInvoiceRecord,
  type RevenueSummaryResult
} from '../../services/pathology-revenue-service.js';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

export const PathologyRevenueCollectionView: React.FC = () => {
  const profile = useMemo(() => getVerifiedRoleProfile(), []);

  // Filter State: TODAY | 7D | 30D | ALL | CUSTOM
  const [activeDateFilter, setActiveDateFilter] = useState<'TODAY' | '7D' | '30D' | 'ALL' | 'CUSTOM'>('TODAY');

  // Custom Date Range State (default to last 14 days)
  const defaultFromDate = useMemo(() => {
    const d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0]!;
  }, []);
  const defaultToDate = useMemo(() => {
    return new Date().toISOString().split('T')[0]!;
  }, []);

  const [customFromDate, setCustomFromDate] = useState<string>(defaultFromDate);
  const [customToDate, setCustomToDate] = useState<string>(defaultToDate);

  // Table Search & Mode Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Active Receipt Modal for 80mm Print Preview
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<LabInvoiceRecord | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Revenue Summary Telemetry
  const [summary, setSummary] = useState<RevenueSummaryResult>(() =>
    pathologyRevenueService.getRevenueSummary('TODAY')
  );

  const reloadData = () => {
    const fresh = pathologyRevenueService.getRevenueSummary(
      activeDateFilter,
      activeDateFilter === 'CUSTOM' ? customFromDate : undefined,
      activeDateFilter === 'CUSTOM' ? customToDate : undefined
    );
    setSummary(fresh);
  };

  useEffect(() => {
    reloadData();
  }, [activeDateFilter, customFromDate, customToDate]);

  // Reactive subscription to new bills or orders
  useEffect(() => {
    const handleBillUpdate = () => {
      reloadData();
      setToastMessage('⚡ Live Revenue Telemetry Updated: New POS bill synchronized!');
      setTimeout(() => setToastMessage(null), 4000);
    };

    window.addEventListener('docsearch_billing_updated', handleBillUpdate);
    window.addEventListener('docsearch_orders_updated', handleBillUpdate);

    return () => {
      window.removeEventListener('docsearch_billing_updated', handleBillUpdate);
      window.removeEventListener('docsearch_orders_updated', handleBillUpdate);
    };
  }, [activeDateFilter, customFromDate, customToDate]);

  // Filtered invoices for the table
  const displayedInvoices = useMemo(() => {
    return summary.filtered.invoices.filter((inv) => {
      if (modeFilter !== 'ALL' && inv.paymentMode !== modeFilter) return false;
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.patientName.toLowerCase().includes(q) ||
          inv.patientMrn.toLowerCase().includes(q) ||
          inv.referringDoctor.toLowerCase().includes(q) ||
          inv.investigationName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [summary.filtered.invoices, modeFilter, statusFilter, searchQuery]);

  const handleExportCsv = () => {
    pathologyRevenueService.exportInvoicesCsv(
      displayedInvoices,
      `Pathology_Collection_${activeDateFilter}_${new Date().toISOString().split('T')[0]}.csv`
    );
    setToastMessage(`✓ Exported ${displayedInvoices.length} invoices to CSV successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePrintDayEnd = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#F8FAFC' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#064E3B',
            color: '#34D399',
            border: '1px solid #059669',
            borderRadius: '8px',
            padding: '12px 18px',
            fontSize: '0.85rem',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
              PATHOLOGY REVENUE & DAILY CASH COLLECTION DESK
            </h2>
            <span
              style={{
                fontSize: '0.6875rem',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                border: '1px solid #10B981',
                padding: '3px 10px',
                borderRadius: '12px',
                fontWeight: 800
              }}
            >
              FINANCIAL AUDIT LEDGER
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94A3B8', fontSize: '0.8125rem' }}>
            Real-time cash counter collection, NABL diagnostic billing audit, daily closing reconciliation, and custom-period tax invoice registers.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #0284C7',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Export filtered collection ledger to CSV for Tally / Accounting"
          >
            <span>📊</span>
            <span>Export Register (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintDayEnd}
            style={{
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#C084FC',
              border: '1px solid #A855F7',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Print full collection summary page"
          >
            <span>🖨️</span>
            <span>Print Summary</span>
          </button>

          <button
            type="button"
            onClick={reloadData}
            style={{
              backgroundColor: '#10B981',
              color: '#064E3B',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.8125rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Refresh revenue metrics from live local storage"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* TOP 4 KPI CARDS GRID (AAJ KA COLLECTION, LAST 7 DAYS, LAST 30 DAYS, OUTSTANDING DUE) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        {/* CARD 1: आज का कलेक्शन (TODAY'S COLLECTION) */}
        <div
          onClick={() => setActiveDateFilter('TODAY')}
          style={{
            backgroundColor: activeDateFilter === 'TODAY' ? 'rgba(16, 185, 129, 0.15)' : '#0F172A',
            border: activeDateFilter === 'TODAY' ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase' }}>
              ⚡ आज का कलेक्शन (TODAY)
            </span>
            <span style={{ fontSize: '1.2rem' }}>🟢</span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '1.85rem', fontWeight: 900, color: '#F8FAFC' }}>
            ₹{summary.today.amount.toLocaleString('en-IN')}
          </div>

          <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#94A3B8' }}>
            <strong>{summary.today.invoiceCount}</strong> Invoices Generated Today
          </div>

          {/* Mini Split Tags */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.6875rem' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: '#CBD5E1' }}>
              💵 Cash: ₹{summary.today.cashAmount.toLocaleString('en-IN')}
            </span>
            <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '4px', color: '#38BDF8' }}>
              📱 UPI: ₹{summary.today.upiAmount.toLocaleString('en-IN')}
            </span>
            {summary.today.cardAmount > 0 && (
              <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '2px 8px', borderRadius: '4px', color: '#C084FC' }}>
                💳 Card: ₹{summary.today.cardAmount.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* CARD 2: पिछले 7 दिनों का कलेक्शन (LAST 7 DAYS COLLECTION) */}
        <div
          onClick={() => setActiveDateFilter('7D')}
          style={{
            backgroundColor: activeDateFilter === '7D' ? 'rgba(2, 132, 199, 0.15)' : '#0F172A',
            border: activeDateFilter === '7D' ? '2px solid #0284C7' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
              🗓️ पिछले 7 दिन (LAST 7 DAYS)
            </span>
            <span style={{ fontSize: '1.2rem' }}>🔵</span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '1.85rem', fontWeight: 900, color: '#F8FAFC' }}>
            ₹{summary.last7Days.amount.toLocaleString('en-IN')}
          </div>

          <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#94A3B8' }}>
            <strong>{summary.last7Days.invoiceCount}</strong> Invoices (Avg: ₹{Math.round(summary.last7Days.amount / 7).toLocaleString('en-IN')}/day)
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.6875rem' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: '#CBD5E1' }}>
              💵 Cash: ₹{summary.last7Days.cashAmount.toLocaleString('en-IN')}
            </span>
            <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '4px', color: '#38BDF8' }}>
              📱 UPI: ₹{summary.last7Days.upiAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* CARD 3: पिछले 30 दिनों का कलेक्शन (LAST 30 DAYS COLLECTION) */}
        <div
          onClick={() => setActiveDateFilter('30D')}
          style={{
            backgroundColor: activeDateFilter === '30D' ? 'rgba(168, 85, 247, 0.15)' : '#0F172A',
            border: activeDateFilter === '30D' ? '2px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C084FC', textTransform: 'uppercase' }}>
              📊 पिछले 30 दिन (LAST 30 DAYS)
            </span>
            <span style={{ fontSize: '1.2rem' }}>🟣</span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '1.85rem', fontWeight: 900, color: '#F8FAFC' }}>
            ₹{summary.last30Days.amount.toLocaleString('en-IN')}
          </div>

          <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#94A3B8' }}>
            <strong>{summary.last30Days.invoiceCount}</strong> Patients Served in Past Month
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.6875rem' }}>
            <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '2px 8px', borderRadius: '4px', color: '#C084FC' }}>
              Monthly Revenue Trajectory
            </span>
          </div>
        </div>

        {/* CARD 4: कुल आउटस्टैंडिंग ड्यू (OUTSTANDING DUE / BALANCE) */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase' }}>
              ⚠️ कुल आउटस्टैंडिंग (BALANCE DUE)
            </span>
            <span style={{ fontSize: '1.2rem' }}>🟡</span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '1.85rem', fontWeight: 900, color: summary.filtered.balanceDueTotal > 0 ? '#F59E0B' : '#34D399' }}>
            ₹{summary.filtered.balanceDueTotal.toLocaleString('en-IN')}
          </div>

          <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#94A3B8' }}>
            Pending Patient Dues in Selected Interval
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.6875rem' }}>
            <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '4px', color: '#FCD34D' }}>
              Discounts Given: ₹{summary.filtered.discountTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE DATE RANGE FILTER CONTROLS & CUSTOM DATE SELECTOR */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Quick Interval Pills */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', marginRight: '6px' }}>
              Select Time Horizon:
            </span>

            <button
              type="button"
              onClick={() => setActiveDateFilter('TODAY')}
              style={{
                backgroundColor: activeDateFilter === 'TODAY' ? '#10B981' : '#0F172A',
                color: activeDateFilter === 'TODAY' ? '#064E3B' : '#CBD5E1',
                border: activeDateFilter === 'TODAY' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ⚡ आज (Today)
            </button>

            <button
              type="button"
              onClick={() => setActiveDateFilter('7D')}
              style={{
                backgroundColor: activeDateFilter === '7D' ? '#0284C7' : '#0F172A',
                color: activeDateFilter === '7D' ? '#FFFFFF' : '#CBD5E1',
                border: activeDateFilter === '7D' ? '1px solid #0284C7' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🗓️ पिछले 7 दिन (Last 7 Days)
            </button>

            <button
              type="button"
              onClick={() => setActiveDateFilter('30D')}
              style={{
                backgroundColor: activeDateFilter === '30D' ? '#8B5CF6' : '#0F172A',
                color: activeDateFilter === '30D' ? '#FFFFFF' : '#CBD5E1',
                border: activeDateFilter === '30D' ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              📊 पिछले 30 दिन (Last 30 Days)
            </button>

            <button
              type="button"
              onClick={() => setActiveDateFilter('ALL')}
              style={{
                backgroundColor: activeDateFilter === 'ALL' ? '#475569' : '#0F172A',
                color: '#FFFFFF',
                border: activeDateFilter === 'ALL' ? '1px solid #64748B' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🗂️ ऑल टाइम (All Records)
            </button>

            <button
              type="button"
              onClick={() => setActiveDateFilter('CUSTOM')}
              style={{
                backgroundColor: activeDateFilter === 'CUSTOM' ? '#F59E0B' : '#0F172A',
                color: activeDateFilter === 'CUSTOM' ? '#78350F' : '#CBD5E1',
                border: activeDateFilter === 'CUSTOM' ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ⚙️ कस्टम डेट रेंज (Custom Date)
            </button>
          </div>

          {/* Active Filter Metrics Banner */}
          <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>
            Filtered Total: <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>₹{summary.filtered.amount.toLocaleString('en-IN')}</strong> ({summary.filtered.invoiceCount} invoices)
          </div>
        </div>

        {/* CUSTOM DATE RANGE PICKER (Expanded when activeDateFilter === 'CUSTOM') */}
        {activeDateFilter === 'CUSTOM' && (
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #F59E0B',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#FCD34D' }}>
              📅 Select Custom Date Period:
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>From Date:</label>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#FFF',
                  fontSize: '0.78rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>To Date:</label>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#FFF',
                  fontSize: '0.78rem'
                }}
              />
            </div>

            <button
              type="button"
              onClick={reloadData}
              style={{
                backgroundColor: '#F59E0B',
                color: '#78350F',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 16px',
                fontSize: '0.78rem',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              Apply Date Filter
            </button>

            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Showing receipts from <strong>{customFromDate}</strong> to <strong>{customToDate}</strong>
            </span>
          </div>
        )}
      </div>

      {/* MIDSECTION: PAYMENT CHANNELS & DEPARTMENTAL CONTRIBUTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        {/* Payment Channels Card */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px 20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
              💳 Payment Channel Distribution
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Current Interval</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* UPI */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>📱 UPI / QR (PhonePe / GPay / Paytm)</span>
                <span style={{ fontWeight: 800 }}>₹{summary.filtered.paymentModes.UPI.toLocaleString('en-IN')} ({summary.filtered.amount > 0 ? Math.round((summary.filtered.paymentModes.UPI / summary.filtered.amount) * 100) : 0}%)</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${summary.filtered.amount > 0 ? (summary.filtered.paymentModes.UPI / summary.filtered.amount) * 100 : 0}%`, backgroundColor: '#0284C7', height: '100%' }} />
              </div>
            </div>

            {/* Cash */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span style={{ color: '#34D399', fontWeight: 700 }}>💵 Cash at Counter</span>
                <span style={{ fontWeight: 800 }}>₹{summary.filtered.paymentModes.CASH.toLocaleString('en-IN')} ({summary.filtered.amount > 0 ? Math.round((summary.filtered.paymentModes.CASH / summary.filtered.amount) * 100) : 0}%)</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${summary.filtered.amount > 0 ? (summary.filtered.paymentModes.CASH / summary.filtered.amount) * 100 : 0}%`, backgroundColor: '#10B981', height: '100%' }} />
              </div>
            </div>

            {/* Cards */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span style={{ color: '#C084FC', fontWeight: 700 }}>💳 POS Credit / Debit Cards</span>
                <span style={{ fontWeight: 800 }}>₹{summary.filtered.paymentModes.CARD.toLocaleString('en-IN')} ({summary.filtered.amount > 0 ? Math.round((summary.filtered.paymentModes.CARD / summary.filtered.amount) * 100) : 0}%)</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${summary.filtered.amount > 0 ? (summary.filtered.paymentModes.CARD / summary.filtered.amount) * 100 : 0}%`, backgroundColor: '#8B5CF6', height: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Departmental Contribution Card */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px 20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
              🔬 Revenue Share by Clinical Department
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Pathology Units</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(summary.filtered.departments).map(([dept, amount]) => {
              const pct = summary.filtered.amount > 0 ? Math.round((amount / summary.filtered.amount) * 100) : 0;
              return (
                <div key={dept}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                    <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{dept}</span>
                    <span style={{ fontWeight: 800, color: '#38BDF8' }}>₹{amount.toLocaleString('en-IN')} ({pct}%)</span>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, backgroundColor: '#06B6D4', height: '100%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAILED INVOICES & RECEIPTS REGISTER TABLE */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Table Search & Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC' }}>
              🧾 Patient Invoices & Receipts Audit Register
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Showing {displayedInvoices.length} matching tax invoices
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by Patient, UHID, Invoice #, Doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#FFF',
                fontSize: '0.78rem',
                minWidth: '240px'
              }}
            />

            {/* Mode Filter */}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#FFF',
                fontSize: '0.78rem'
              }}
            >
              <option value="ALL">All Payment Modes</option>
              <option value="CASH">Cash Only</option>
              <option value="UPI">UPI Only</option>
              <option value="CARD">Card Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#FFF',
                fontSize: '0.78rem'
              }}
            >
              <option value="ALL">All Payment Status</option>
              <option value="PAID">Fully Paid</option>
              <option value="PARTIAL_DUE">Partial Due</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1E293B', color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '10px 12px' }}>Invoice # & Date</th>
                <th style={{ padding: '10px 12px' }}>Patient Details</th>
                <th style={{ padding: '10px 12px' }}>Tests / Package Billed</th>
                <th style={{ padding: '10px 12px' }}>Referring Doctor</th>
                <th style={{ padding: '10px 12px' }}>Payment Mode</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Net Payable</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Paid (₹)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Due (₹)</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.length > 0 ? (
                displayedInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background-color 0.1s ease'
                    }}
                  >
                    {/* Invoice # & Date */}
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#38BDF8' }}>{inv.invoiceNumber}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {new Date(inv.billedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                        {new Date(inv.billedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Patient */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{inv.patientName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {inv.patientAge}y · {inv.patientGender} · UHID: {inv.patientMrn}
                      </div>
                    </td>

                    {/* Tests */}
                    <td style={{ padding: '10px 12px', maxWidth: '240px' }}>
                      <div style={{ color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inv.packageName || inv.investigationName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        {inv.department}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td style={{ padding: '10px 12px', color: '#CBD5E1' }}>
                      {inv.referringDoctor || 'Self / Walk-in'}
                    </td>

                    {/* Payment Mode */}
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          backgroundColor:
                            inv.paymentMode === 'UPI'
                              ? 'rgba(6, 182, 212, 0.15)'
                              : inv.paymentMode === 'CASH'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(168, 85, 247, 0.15)',
                          color:
                            inv.paymentMode === 'UPI'
                              ? '#38BDF8'
                              : inv.paymentMode === 'CASH'
                              ? '#34D399'
                              : '#C084FC',
                          border: `1px solid ${
                            inv.paymentMode === 'UPI'
                              ? '#0284C7'
                              : inv.paymentMode === 'CASH'
                              ? '#10B981'
                              : '#A855F7'
                          }`,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontSize: '0.6875rem'
                        }}
                      >
                        {inv.paymentMode === 'UPI' ? '📱 UPI' : inv.paymentMode === 'CASH' ? '💵 CASH' : '💳 CARD'}
                      </span>
                    </td>

                    {/* Net Payable */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94A3B8' }}>
                      ₹{inv.netPayable.toLocaleString('en-IN')}
                    </td>

                    {/* Paid */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#34D399' }}>
                      ₹{inv.paidAmount.toLocaleString('en-IN')}
                    </td>

                    {/* Due */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: inv.balanceDue > 0 ? '#F87171' : '#64748B' }}>
                      {inv.balanceDue > 0 ? `₹${inv.balanceDue.toLocaleString('en-IN')}` : '₹0'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setActiveReceiptInvoice(inv)}
                        style={{
                          backgroundColor: 'rgba(2, 132, 199, 0.15)',
                          color: '#38BDF8',
                          border: '1px solid #0284C7',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Print 80mm POS thermal receipt"
                      >
                        🖨️ Receipt
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No billing invoices found matching the selected filter or date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 80MM THERMAL RECEIPT POPUP MODAL */}
      {activeReceiptInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFF',
              color: '#000',
              width: '80mm',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              fontSize: '11px',
              fontFamily: 'monospace'
            }}
          >
            {/* Printable Receipt Content */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                {profile.entityLegalName.toUpperCase()}
              </div>
              <div style={{ fontSize: '9px', color: '#555' }}>
                {profile.officialAddress}
              </div>
              <div style={{ fontSize: '9px', color: '#555' }}>
                Phone: {profile.contactPhone} | NABL Cert: {profile.nablCertificateNo}
              </div>
              <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                TAX INVOICE & CASH RECEIPT
              </div>
            </div>

            <div style={{ margin: '8px 0', borderBottom: '1px dashed #000', paddingBottom: '6px' }}>
              <div><strong>Inv #:</strong> {activeReceiptInvoice.invoiceNumber}</div>
              <div><strong>Date:</strong> {new Date(activeReceiptInvoice.billedAt).toLocaleString('en-IN')}</div>
              <div><strong>Patient:</strong> {activeReceiptInvoice.patientName} ({activeReceiptInvoice.patientAge}y/{activeReceiptInvoice.patientGender})</div>
              <div><strong>UHID:</strong> {activeReceiptInvoice.patientMrn}</div>
              <div><strong>Doctor:</strong> {activeReceiptInvoice.referringDoctor}</div>
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>TESTS BILLED:</div>
              <div>{activeReceiptInvoice.packageName || activeReceiptInvoice.investigationName}</div>
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>₹{activeReceiptInvoice.subtotal}</span>
              </div>
              {activeReceiptInvoice.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C00' }}>
                  <span>Discount:</span>
                  <span>-₹{activeReceiptInvoice.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px' }}>
                <span>Net Payable:</span>
                <span>₹{activeReceiptInvoice.netPayable}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#080' }}>
                <span>Amount Paid ({activeReceiptInvoice.paymentMode}):</span>
                <span>₹{activeReceiptInvoice.paidAmount}</span>
              </div>
              {activeReceiptInvoice.balanceDue > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C00' }}>
                  <span>Balance Due:</span>
                  <span>₹{activeReceiptInvoice.balanceDue}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '6px' }}>
              *** Thank You for Choosing Our Laboratory ***
              <br />
              Generated by DocSearch Clinical ERP
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  backgroundColor: '#000',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🖨️ Print
              </button>
              <button
                type="button"
                onClick={() => setActiveReceiptInvoice(null)}
                style={{
                  flex: 1,
                  backgroundColor: '#E5E7EB',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
