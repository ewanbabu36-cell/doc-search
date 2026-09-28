import React, { useState, useEffect, useMemo } from 'react';
import {
  pharmacyRevenueGallaService,
  type PharmacySalesInvoiceRecord,
  type GallaShiftHandoverRecord,
  type PharmacyRevenueSummaryResult,
  type ShiftType,
  type GallaDenominationBreakup
} from '../../services/pharmacy-revenue-galla-service.js';
import {
  pharmacyCreditKhataService,
  type KhataAgingSummary,
  type PharmacyKhataAccount
} from '../../services/pharmacy-credit-khata-service.js';
import { KhataPaymentCollectionModal } from '../dialogs/KhataPaymentCollectionModal.js';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

export const PharmacyRevenueGallaDeskView: React.FC = () => {
  const profile = useMemo(() => getVerifiedRoleProfile(), []);

  // Main Tab within Revenue Desk: 'GALLA' (Shift Handover) | 'INVOICES' (Sales Register) | 'HISTORY' (Past Handovers)
  const [activeDeskTab, setActiveDeskTab] = useState<'GALLA' | 'INVOICES' | 'HISTORY'>('GALLA');

  // Filter State: TODAY | 7D | 30D | ALL | CUSTOM
  const [activeDateFilter, setActiveDateFilter] = useState<'TODAY' | '7D' | '30D' | 'ALL' | 'CUSTOM'>('TODAY');

  // Custom Date Range State
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

  // Active Receipt Modal for 80mm Print Preview
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<PharmacySalesInvoiceRecord | null>(null);
  const [activeHandoverSlip, setActiveHandoverSlip] = useState<GallaShiftHandoverRecord | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Revenue Summary Telemetry
  const [summary, setSummary] = useState<PharmacyRevenueSummaryResult>(() =>
    pharmacyRevenueGallaService.getRevenueSummary('TODAY')
  );

  // Past Shift Handovers
  const [handoversList, setHandoversList] = useState<GallaShiftHandoverRecord[]>(() =>
    pharmacyRevenueGallaService.getHandovers()
  );

  // ==========================================
  // Galla Reconciliation Form State (Shift Handover)
  // ==========================================
  const [shiftType, setShiftType] = useState<ShiftType>('MORNING');
  const [handoverDate, setHandoverDate] = useState<string>(() => new Date().toISOString().split('T')[0]!);
  const [outgoingPharmacist, setOutgoingPharmacist] = useState<string>(profile.pharmacistName || '');
  const [outgoingRegNo, setOutgoingRegNo] = useState<string>(profile.pharmacistRegNo || '');
  const [incomingPharmacist, setIncomingPharmacist] = useState<string>('');
  const [incomingRegNo, setIncomingRegNo] = useState<string>('');

  // Financial Inputs
  const [openingDrawerFloat, setOpeningDrawerFloat] = useState<number>(0); // Morning float
  const [pettyCashOutflow, setPettyCashOutflow] = useState<number>(0);
  const [pettyCashRemarks, setPettyCashRemarks] = useState<string>('');
  const [handoverNotes, setHandoverNotes] = useState<string>('');

  // Physical Note Denomination Counter
  const [denominations, setDenominations] = useState<GallaDenominationBreakup>({
    n500: 0,
    n200: 0,
    n100: 0,
    n50: 0,
    n20: 0,
    n10: 0,
    coins: 0
  });

  const [khataAging, setKhataAging] = useState<KhataAgingSummary>(() =>
    pharmacyCreditKhataService.getAgingSummary()
  );

  // Credit Khata Drilldown State
  const [isCreditDrilldownOpen, setIsCreditDrilldownOpen] = useState(false);
  const [drilldownTab, setDrilldownTab] = useState<'CUSTOMERS' | 'INVOICES'>('CUSTOMERS');
  const [drilldownSearch, setDrilldownSearch] = useState('');
  const [selectedCustomerForBills, setSelectedCustomerForBills] = useState<PharmacyKhataAccount | null>(null);
  const [activeKhataPaymentAccount, setActiveKhataPaymentAccount] = useState<PharmacyKhataAccount | null>(null);

  // Dynamic credit calculations for the active Time Horizon
  const horizonCreditSales = useMemo(() => {
    return summary.filtered.paymentModes.CREDIT_KHATA || 0;
  }, [summary.filtered.paymentModes.CREDIT_KHATA]);

  const horizonCreditInvoices = useMemo(() => {
    return summary.filtered.invoices.filter((inv) => inv.paymentMode === 'CREDIT_KHATA');
  }, [summary.filtered.invoices]);

  const allTimeMarketDue = useMemo(() => {
    return khataAging.totalOutstanding > 0 ? khataAging.totalOutstanding : summary.allTime.khataAmount;
  }, [khataAging.totalOutstanding, summary.allTime.khataAmount]);

  const allKhataAccounts = useMemo(() => {
    return pharmacyCreditKhataService.getAccounts();
  }, [khataAging]);

  const filteredCustomersList = useMemo(() => {
    let list = allKhataAccounts;
    if (drilldownSearch.trim()) {
      const q = drilldownSearch.trim().toLowerCase();
      const cleanDigits = q.replace(/\D/g, '');
      list = list.filter(
        (a) =>
          a.customerName.toLowerCase().includes(q) ||
          (cleanDigits && a.customerPhone.includes(cleanDigits)) ||
          (a.uhid && a.uhid.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allKhataAccounts, drilldownSearch]);

  const reloadData = () => {
    const fresh = pharmacyRevenueGallaService.getRevenueSummary(
      activeDateFilter,
      activeDateFilter === 'CUSTOM' ? customFromDate : undefined,
      activeDateFilter === 'CUSTOM' ? customToDate : undefined
    );
    setSummary(fresh);
    setHandoversList(pharmacyRevenueGallaService.getHandovers());
    setKhataAging(pharmacyCreditKhataService.getAgingSummary());
  };

  useEffect(() => {
    reloadData();
  }, [activeDateFilter, customFromDate, customToDate]);

  // Reactive subscription to live billing or POS invoices
  useEffect(() => {
    const handleSync = () => {
      reloadData();
      setToastMessage('⚡ Live Pharmacy Revenue Sync: New POS bill synchronized!');
      setTimeout(() => setToastMessage(null), 4000);
    };

    const handleKhataSync = () => {
      reloadData();
      setToastMessage('⚡ Live Khata Repayment: Customer credit collection synchronized!');
      setTimeout(() => setToastMessage(null), 4000);
    };

    window.addEventListener('docsearch_billing_updated', handleSync);
    window.addEventListener('docsearch_galla_updated', handleSync);
    window.addEventListener('docsearch_khata_updated', handleKhataSync);
    window.addEventListener('docsearch_khata_payment_recorded', handleKhataSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('docsearch_billing_updated', handleSync);
      window.removeEventListener('docsearch_galla_updated', handleSync);
      window.removeEventListener('docsearch_khata_updated', handleKhataSync);
      window.removeEventListener('docsearch_khata_payment_recorded', handleKhataSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [activeDateFilter, customFromDate, customToDate]);

  // Real-time Cash Sales Inflow for the active shift date
  const shiftCashInflow = useMemo(() => {
    return summary.today.cashAmount || 0;
  }, [summary.today.cashAmount]);

  const shiftUpiInflow = useMemo(() => {
    return summary.today.upiAmount || 0;
  }, [summary.today.upiAmount]);

  const shiftCardInflow = useMemo(() => {
    return summary.today.cardAmount || 0;
  }, [summary.today.cardAmount]);

  const shiftKhataInflow = useMemo(() => {
    return summary.today.khataAmount || 0;
  }, [summary.today.khataAmount]);

  // Expected Physical Cash in drawer
  const expectedDrawerCash = useMemo(() => {
    const total = openingDrawerFloat + shiftCashInflow - pettyCashOutflow;
    return Math.max(0, Math.round(total * 100) / 100);
  }, [openingDrawerFloat, shiftCashInflow, pettyCashOutflow]);

  // Actual Physical Cash Counted from Denomination Inputs
  const actualCountedCash = useMemo(() => {
    const total =
      denominations.n500 * 500 +
      denominations.n200 * 200 +
      denominations.n100 * 100 +
      denominations.n50 * 50 +
      denominations.n20 * 20 +
      denominations.n10 * 10 +
      denominations.coins;
    return Math.round(total * 100) / 100;
  }, [denominations]);

  // Discrepancy between Actual and Expected
  const discrepancy = useMemo(() => {
    return Math.round((actualCountedCash - expectedDrawerCash) * 100) / 100;
  }, [actualCountedCash, expectedDrawerCash]);

  const discrepancyStatus: 'BALANCED' | 'SHORTAGE' | 'SURPLUS' = useMemo(() => {
    if (discrepancy === 0) return 'BALANCED';
    if (discrepancy < 0) return 'SHORTAGE';
    return 'SURPLUS';
  }, [discrepancy]);

  // Quick action to auto-fill denomination matching expected (for one-click balancing in demo)
  const handleAutoFillBalancedDenominations = () => {
    let remaining = expectedDrawerCash;
    const n500 = Math.floor(remaining / 500);
    remaining %= 500;
    const n200 = Math.floor(remaining / 200);
    remaining %= 200;
    const n100 = Math.floor(remaining / 100);
    remaining %= 100;
    const n50 = Math.floor(remaining / 50);
    remaining %= 50;
    const n20 = Math.floor(remaining / 20);
    remaining %= 20;
    const n10 = Math.floor(remaining / 10);
    remaining %= 10;
    const coins = remaining;

    setDenominations({ n500, n200, n100, n50, n20, n10, coins });
    setToastMessage('🎯 Auto-balanced note counts to match expected drawer cash!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Submit Shift Handover
  const handleSubmitShiftHandover = (e: React.FormEvent) => {
    e.preventDefault();

    const shiftLabels: Record<ShiftType, string> = {
      MORNING: 'Morning Shift (08:00 AM - 03:30 PM)',
      EVENING: 'Evening Shift (03:30 PM - 10:30 PM)',
      NIGHT: 'Night Emergency Shift (10:30 PM - 08:00 AM)',
      FULL_DAY: 'Full Day Counter Closing (All Shifts)'
    };

    const saved = pharmacyRevenueGallaService.saveGallaHandover({
      shiftType,
      shiftLabel: shiftLabels[shiftType],
      handoverDate,
      outgoingPharmacistName: outgoingPharmacist,
      outgoingPharmacistRegNo: outgoingRegNo,
      incomingPharmacistName: incomingPharmacist,
      incomingPharmacistRegNo: incomingRegNo,
      openingDrawerFloat,
      cashSalesInflow: shiftCashInflow,
      upiSalesInflow: shiftUpiInflow,
      cardSalesInflow: shiftCardInflow,
      khataSalesInflow: shiftKhataInflow,
      grossShiftRevenue: summary.today.amount,
      shiftInvoiceCount: summary.today.invoiceCount,
      pettyCashOutflow,
      pettyCashRemarks,
      expectedDrawerCash,
      actualCountedCash,
      denominationBreakup: denominations,
      discrepancy,
      discrepancyStatus,
      notes: handoverNotes
    });

    setHandoversList(pharmacyRevenueGallaService.getHandovers());
    setActiveHandoverSlip(saved);
    setToastMessage(`✓ Shift Handover ${saved.handoverNumber} recorded successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered invoices for the table
  const displayedInvoices = useMemo(() => {
    return summary.filtered.invoices.filter((inv) => {
      if (modeFilter !== 'ALL' && inv.paymentMode !== modeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.patientName.toLowerCase().includes(q) ||
          inv.patientPhone.toLowerCase().includes(q) ||
          (inv.doctorName && inv.doctorName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [summary.filtered.invoices, modeFilter, searchQuery]);

  const handleExportInvoicesCsv = () => {
    pharmacyRevenueGallaService.exportInvoicesCsv(
      displayedInvoices,
      `Pharmacy_Sales_Register_${activeDateFilter}_${new Date().toISOString().split('T')[0]}.csv`
    );
    setToastMessage(`✓ Exported ${displayedInvoices.length} invoices to CSV for Tally / Accounting.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportHandoversCsv = () => {
    pharmacyRevenueGallaService.exportHandoversCsv(
      handoversList,
      `Pharmacy_Galla_Handovers_${new Date().toISOString().split('T')[0]}.csv`
    );
    setToastMessage(`✓ Exported ${handoversList.length} shift handovers to CSV.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePrintSummary = () => {
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
              PHARMACY REVENUE & GALLA HANDOVER DESK
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
              CASH DRAWER RECONCILIATION
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94A3B8', fontSize: '0.8125rem' }}>
            Shift handover cash balancing ("Galla Milana"), real-time counter sales telemetry, payment breakups (Cash / UPI / Card / Khata), and tax invoice registers.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Consolidated Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              style={{
                backgroundColor: '#1E293B',
                color: '#38BDF8',
                border: '1px solid #0284C7',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Export accounting ledgers to CSV"
            >
              <span>📥</span>
              <span>Export CSV ▾</span>
            </button>
            {isExportMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  zIndex: 100,
                  backgroundColor: '#0F172A',
                  border: '1.5px solid #0284C7',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.7), 0 0 12px rgba(2, 132, 199, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '220px',
                  overflow: 'hidden'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handleExportInvoicesCsv();
                  }}
                  style={{
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    color: '#38BDF8',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>📊</span>
                  <div>
                    <div style={{ fontWeight: 800 }}>Sales Ledger CSV</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Tally / CA Accounting Format</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handleExportHandoversCsv();
                  }}
                  style={{
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    borderTop: '1px solid #1E293B',
                    color: '#FCD34D',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>💼</span>
                  <div>
                    <div style={{ fontWeight: 800 }}>Galla Shift Handover Log CSV</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Shift Drawer Reconciliation Log</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handlePrintSummary}
            style={{
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#C084FC',
              border: '1px solid #A855F7',
              borderRadius: '8px',
              padding: '8px 14px',
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
              padding: '8px 14px',
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
            <span>Live Sync</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS GRID: Dynamic Collection Revenue & Credit Khata */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '14px',
          width: '100%'
        }}
      >
        {/* UNIFIED DYNAMIC REVENUE & COLLECTION CARD */}
        <div
          style={{
            backgroundColor: activeDateFilter === 'TODAY'
              ? 'rgba(16, 185, 129, 0.12)'
              : activeDateFilter === '7D'
              ? 'rgba(2, 132, 199, 0.12)'
              : activeDateFilter === '30D'
              ? 'rgba(168, 85, 247, 0.12)'
              : activeDateFilter === 'ALL'
              ? 'rgba(100, 116, 139, 0.12)'
              : 'rgba(245, 158, 11, 0.12)',
            border: activeDateFilter === 'TODAY'
              ? '2px solid #10B981'
              : activeDateFilter === '7D'
              ? '2px solid #0284C7'
              : activeDateFilter === '30D'
              ? '2px solid #A855F7'
              : activeDateFilter === 'ALL'
              ? '2px solid #64748B'
              : '2px solid #F59E0B',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease',
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                {activeDateFilter === 'TODAY' ? '⚡' : activeDateFilter === '7D' ? '🗓️' : activeDateFilter === '30D' ? '📊' : activeDateFilter === 'ALL' ? '🌐' : '📅'}
              </span>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: activeDateFilter === 'TODAY' ? '#34D399' : activeDateFilter === '7D' ? '#38BDF8' : activeDateFilter === '30D' ? '#C084FC' : activeDateFilter === 'ALL' ? '#CBD5E1' : '#FCD34D',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {activeDateFilter === 'TODAY'
                  ? 'आज का कलेक्शन (TODAY\'S REVENUE)'
                  : activeDateFilter === '7D'
                  ? 'पिछले 7 दिन का कलेक्शन (LAST 7 DAYS)'
                  : activeDateFilter === '30D'
                  ? 'पिछले 30 दिन का कलेक्शन (LAST 30 DAYS)'
                  : activeDateFilter === 'ALL'
                  ? 'ऑल-टाइम कुल कलेक्शन (ALL TIME SALES)'
                  : 'कस्टम रेंज कलेक्शन (CUSTOM WINDOW)'}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                backgroundColor: activeDateFilter === 'TODAY'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : activeDateFilter === '7D'
                  ? 'rgba(56, 189, 248, 0.2)'
                  : activeDateFilter === '30D'
                  ? 'rgba(168, 85, 247, 0.2)'
                  : activeDateFilter === 'ALL'
                  ? 'rgba(148, 163, 184, 0.2)'
                  : 'rgba(245, 158, 11, 0.2)',
                color: activeDateFilter === 'TODAY'
                  ? '#34D399'
                  : activeDateFilter === '7D'
                  ? '#38BDF8'
                  : activeDateFilter === '30D'
                  ? '#C084FC'
                  : activeDateFilter === 'ALL'
                  ? '#CBD5E1'
                  : '#FCD34D',
                padding: '3px 8px',
                borderRadius: '6px',
                border: `1px solid ${activeDateFilter === 'TODAY' ? 'rgba(16, 185, 129, 0.4)' : activeDateFilter === '7D' ? 'rgba(56, 189, 248, 0.4)' : activeDateFilter === '30D' ? 'rgba(168, 85, 247, 0.4)' : activeDateFilter === 'ALL' ? 'rgba(148, 163, 184, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                flexShrink: 0,
                letterSpacing: '0.04em'
              }}
            >
              {activeDateFilter === 'TODAY' ? 'LIVE' : activeDateFilter === '7D' ? '7 DAYS' : activeDateFilter === '30D' ? '30 DAYS' : activeDateFilter === 'ALL' ? 'ALL TIME' : 'CUSTOM'}
            </span>
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: 'clamp(1.6rem, 2.4vw, 2.15rem)',
              fontWeight: 900,
              color: '#F8FAFC',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            ₹{summary.filtered.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <strong>{summary.filtered.invoiceCount}</strong> {summary.filtered.invoiceCount === 1 ? 'Invoice' : 'Invoices'} {activeDateFilter === 'TODAY' ? 'Generated Today' : activeDateFilter === '7D' ? `(Avg ₹${Math.round(summary.filtered.amount / 7).toLocaleString('en-IN')}/day)` : activeDateFilter === '30D' ? 'in past 30 days' : 'in selected horizon'}
          </div>

          {/* Mini Split Tags */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.72rem' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '5px', color: '#CBD5E1', whiteSpace: 'nowrap' }}>
              💵 Cash: ₹{summary.filtered.paymentModes.CASH.toLocaleString('en-IN')}
            </span>
            <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', padding: '3px 10px', borderRadius: '5px', color: '#38BDF8', whiteSpace: 'nowrap' }}>
              📱 UPI: ₹{summary.filtered.paymentModes.UPI_QR.toLocaleString('en-IN')}
            </span>
            {summary.filtered.paymentModes.CARD > 0 && (
              <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '3px 10px', borderRadius: '5px', color: '#C084FC', whiteSpace: 'nowrap' }}>
                💳 Card: ₹{summary.filtered.paymentModes.CARD.toLocaleString('en-IN')}
              </span>
            )}
            {summary.filtered.paymentModes.CREDIT_KHATA > 0 && (
              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '3px 10px', borderRadius: '5px', color: '#FCD34D', whiteSpace: 'nowrap' }}>
                📒 Khata: ₹{summary.filtered.paymentModes.CREDIT_KHATA.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* CARD 2: कुल उधार / खाता (CREDIT KHATA) */}
        <div
          onClick={() => {
            setSelectedCustomerForBills(null);
            setIsCreditDrilldownOpen(true);
          }}
          style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            minWidth: 0,
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Click to view customer-wise pending balances & bills"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>📒</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                कुल उधार (CREDIT KHATA)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  color: '#FBBF24',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  flexShrink: 0,
                  letterSpacing: '0.04em'
                }}
              >
                KHATA
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(56, 189, 248, 0.18)',
                  color: '#38BDF8',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  flexShrink: 0
                }}
              >
                🔍 बही देखें ➔
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: 'clamp(1.6rem, 2.4vw, 2.15rem)',
              fontWeight: 900,
              color: '#F59E0B',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            ₹{allTimeMarketDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <strong>{khataAging.activeAccountsCount}</strong> active customer credit {khataAging.activeAccountsCount === 1 ? 'account' : 'accounts'} with outstanding balance
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.72rem' }}>
            <span
              style={{
                backgroundColor: horizonCreditSales > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: horizonCreditSales > 0 ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '3px 10px',
                borderRadius: '5px',
                color: horizonCreditSales > 0 ? '#FCD34D' : '#94A3B8',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}
            >
              {activeDateFilter === 'TODAY'
                ? `⚡ आज का उधार: ₹${horizonCreditSales.toLocaleString('en-IN')} (${horizonCreditInvoices.length} बिल)`
                : activeDateFilter === '7D'
                ? `🗓️ 7 दिन का उधार: ₹${horizonCreditSales.toLocaleString('en-IN')} (${horizonCreditInvoices.length} बिल)`
                : activeDateFilter === '30D'
                ? `📊 30 दिन का उधार: ₹${horizonCreditSales.toLocaleString('en-IN')} (${horizonCreditInvoices.length} बिल)`
                : activeDateFilter === 'ALL'
                ? `🌐 कुल उधार बिक्री: ₹${horizonCreditSales.toLocaleString('en-IN')} (${horizonCreditInvoices.length} बिल)`
                : `📅 इस विंडो का उधार: ₹${horizonCreditSales.toLocaleString('en-IN')} (${horizonCreditInvoices.length} बिल)`}
            </span>

            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '3px 10px', borderRadius: '5px', color: '#34D399', whiteSpace: 'nowrap' }}>
              Recovered: ₹{khataAging.totalCollectedThisMonth.toLocaleString('en-IN')}
            </span>

            {khataAging.overdueAccountsCount > 0 ? (
              <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '3px 10px', borderRadius: '5px', color: '#FCA5A5', whiteSpace: 'nowrap' }}>
                ⚠️ {khataAging.overdueAccountsCount} Overdue
              </span>
            ) : (
              <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '3px 10px', borderRadius: '5px', color: '#38BDF8', whiteSpace: 'nowrap' }}>
                ✓ Clean Ledger • No Overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TIME HORIZON SELECTION & REAL-TIME PAYMENT BREAKUP BAR */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Quick Interval Pills */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', marginRight: '4px' }}>
              Time Horizon:
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
              🗓️ पिछले 7 दिन (7D)
            </button>

            <button
              type="button"
              onClick={() => setActiveDateFilter('30D')}
              style={{
                backgroundColor: activeDateFilter === '30D' ? '#A855F7' : '#0F172A',
                color: activeDateFilter === '30D' ? '#FFFFFF' : '#CBD5E1',
                border: activeDateFilter === '30D' ? '1px solid #A855F7' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              📊 पिछले 30 दिन (30D)
            </button>

            <button
              type="button"
              onClick={() => setActiveDateFilter('ALL')}
              style={{
                backgroundColor: activeDateFilter === 'ALL' ? '#475569' : '#0F172A',
                color: activeDateFilter === 'ALL' ? '#FFFFFF' : '#CBD5E1',
                border: activeDateFilter === 'ALL' ? '1px solid #64748B' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🌐 All Time
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
              📅 Custom Date Range
            </button>
          </div>

          {/* Real-time Payment Breakup Chips */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Breakup:</div>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              💵 Cash: ₹{summary.filtered.paymentModes.CASH.toLocaleString('en-IN')}
            </span>
            <span style={{ backgroundColor: 'rgba(2, 132, 199, 0.2)', border: '1px solid #0284C7', color: '#38BDF8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              📱 UPI/QR: ₹{summary.filtered.paymentModes.UPI_QR.toLocaleString('en-IN')}
            </span>
            <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', border: '1px solid #A855F7', color: '#C084FC', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              💳 Card: ₹{summary.filtered.paymentModes.CARD.toLocaleString('en-IN')}
            </span>
            <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#FCD34D', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              📒 Khata: ₹{summary.filtered.paymentModes.CREDIT_KHATA.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Custom Date Pickers (Shown if CUSTOM selected) */}
        {activeDateFilter === 'CUSTOM' && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              backgroundColor: '#0F172A',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: '#FCD34D', fontWeight: 800 }}>
              Select Custom Window:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>From:</label>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.78rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>To:</label>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.78rem'
                }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: 'auto' }}>
              Found {summary.filtered.invoiceCount} invoices • Total ₹{summary.filtered.amount.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* DESK VIEW MODE SELECTOR (GALLA MILANA DESK vs SALES INVOICE REGISTER vs HANDOVER HISTORY) */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveDeskTab('GALLA')}
          style={{
            backgroundColor: activeDeskTab === 'GALLA' ? '#10B981' : '#1E293B',
            color: activeDeskTab === 'GALLA' ? '#064E3B' : '#CBD5E1',
            border: activeDeskTab === 'GALLA' ? '1px solid #10B981' : '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>💼</span>
          <span>Galla Milana (Shift Handover Console)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDeskTab('INVOICES')}
          style={{
            backgroundColor: activeDeskTab === 'INVOICES' ? '#0284C7' : '#1E293B',
            color: activeDeskTab === 'INVOICES' ? '#FFFFFF' : '#CBD5E1',
            border: activeDeskTab === 'INVOICES' ? '1px solid #0284C7' : '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>🧾</span>
          <span>Sales Invoices Register ({displayedInvoices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDeskTab('HISTORY')}
          style={{
            backgroundColor: activeDeskTab === 'HISTORY' ? '#A855F7' : '#1E293B',
            color: activeDeskTab === 'HISTORY' ? '#FFFFFF' : '#CBD5E1',
            border: activeDeskTab === 'HISTORY' ? '1px solid #A855F7' : '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>📋</span>
          <span>Shift Handover Logs ({handoversList.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: GALLA MILANA & SHIFT HANDOVER DESK (CASH DRAWER RECONCILIATION) */}
      {/* ========================================================================= */}
      {activeDeskTab === 'GALLA' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Left: Expected Cash Calculation & Shift Parameters */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #334155',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>🧮</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#38BDF8' }}>
                  1. Shift Parameters & System Cash Inflow
                </h3>
              </div>
              <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                REAL-TIME TELEMETRY
              </span>
            </div>

            {/* Shift & Date Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                  Shift Type *
                </label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as ShiftType)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1E293B',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                >
                  <option value="MORNING">☀️ Subah Ki Shift (08:00 AM - 03:30 PM)</option>
                  <option value="EVENING">🌆 Shaam Ki Shift (03:30 PM - 10:30 PM)</option>
                  <option value="NIGHT">🌙 Night Emergency Shift (10:30 PM - 08:00 AM)</option>
                  <option value="FULL_DAY">🔒 Dukaan Closing (Full Day Reconciled)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                  Handover Date *
                </label>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1E293B',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                />
              </div>
            </div>

            {/* Pharmacists Names & Registration Numbers (Compact 2-Column Subgrid) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                  Outgoing Pharmacist (Shift Khatam) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    value={outgoingPharmacist}
                    onChange={(e) => setOutgoingPharmacist(e.target.value)}
                    placeholder="Pharmacist Name"
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      color: '#F8FAFC',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '0.78rem'
                    }}
                  />
                  <input
                    type="text"
                    value={outgoingRegNo}
                    onChange={(e) => setOutgoingRegNo(e.target.value)}
                    placeholder="Reg # (MH-RPH-...)"
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      color: '#94A3B8',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '0.74rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                  Incoming Pharmacist (Naya Charge) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    value={incomingPharmacist}
                    onChange={(e) => setIncomingPharmacist(e.target.value)}
                    placeholder="Pharmacist Name"
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      color: '#F8FAFC',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '0.78rem'
                    }}
                  />
                  <input
                    type="text"
                    value={incomingRegNo}
                    onChange={(e) => setIncomingRegNo(e.target.value)}
                    placeholder="Reg # (MH-RPH-...)"
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      color: '#94A3B8',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '0.74rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Cash Drawer Reconciliation Equation Box */}
            <div
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                System Expected Drawer Cash Equation:
              </div>

              {/* 1. Opening Float */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>
                  (A) Subah Ka Opening Cash (Drawer Float):
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>₹</span>
                  <input
                    type="number"
                    value={openingDrawerFloat}
                    onChange={(e) => setOpeningDrawerFloat(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{
                      width: '110px',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      border: '1px solid #38BDF8',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      textAlign: 'right'
                    }}
                  />
                </div>
              </div>

              {/* 2. Cash Inflow from POS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#34D399', fontWeight: 700 }}>
                  (+) Din Ka Cash Sales Inflow (POS Bills):
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#34D399' }}>
                  + ₹{shiftCashInflow.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 3. Petty Cash Outflow */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#F87171' }}>
                    (-) Petty Cash Expenses (Dukaan Ke Kharche):
                  </span>
                  <input
                    type="text"
                    value={pettyCashRemarks}
                    onChange={(e) => setPettyCashRemarks(e.target.value)}
                    placeholder="e.g. Chai, Courier, Snacks"
                    style={{
                      display: 'block',
                      width: '200px',
                      marginTop: '3px',
                      backgroundColor: '#0F172A',
                      color: '#94A3B8',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '0.7rem'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#F87171' }}>- ₹</span>
                  <input
                    type="number"
                    value={pettyCashOutflow}
                    onChange={(e) => setPettyCashOutflow(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{
                      width: '110px',
                      backgroundColor: '#0F172A',
                      color: '#F87171',
                      border: '1px solid #EF4444',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      textAlign: 'right'
                    }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1.5px dashed #475569', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Expected Physical Cash In Drawer:
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8' }}>
                  ₹{expectedDrawerCash.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Handover Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                Handover / Galla Audit Notes
              </label>
              <textarea
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="e.g. All narcotic / Schedule H1 registers signed. Night locker locked with double keys."
                rows={2}
                style={{
                  width: '100%',
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '0.78rem',
                  resize: 'none'
                }}
              />
            </div>
          </div>

          {/* Right: Currency Note Denomination Counter & Discrepancy Auditor */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #334155',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>💵</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#10B981' }}>
                  2. Physical Note Counter ("Galla Gin-na")
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAutoFillBalancedDenominations}
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid #10B981',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                title="Automatically calculate notes matching expected drawer cash for quick demo balancing"
              >
                ⚡ Match Expected Cash
              </button>
            </div>

            {/* Denomination Table */}
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Note / Coin</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Count (Ginti)</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'n500', val: 500, label: '₹500 Note' },
                    { key: 'n200', val: 200, label: '₹200 Note' },
                    { key: 'n100', val: 100, label: '₹100 Note' },
                    { key: 'n50', val: 50, label: '₹50 Note' },
                    { key: 'n20', val: 20, label: '₹20 Note' },
                    { key: 'n10', val: 10, label: '₹10 Note' },
                    { key: 'coins', val: 1, label: 'Coins (Sikke)' }
                  ].map((row) => {
                    const count = (denominations as any)[row.key] || 0;
                    const subtotal = count * row.val;
                    return (
                      <tr key={row.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 12px', fontWeight: 700, color: '#CBD5E1' }}>
                          {row.label}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            value={count || ''}
                            onChange={(e) => {
                              const v = Math.max(0, parseInt(e.target.value) || 0);
                              setDenominations((prev) => ({ ...prev, [row.key]: v }));
                            }}
                            placeholder="0"
                            style={{
                              width: '70px',
                              backgroundColor: '#0F172A',
                              color: '#F8FAFC',
                              border: '1px solid #475569',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              textAlign: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 800
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 800, color: '#38BDF8' }}>
                          ₹{subtotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Comparison Audit Banner */}
            <div
              style={{
                backgroundColor:
                  discrepancyStatus === 'BALANCED'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : discrepancyStatus === 'SHORTAGE'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                border: `1.5px solid ${
                  discrepancyStatus === 'BALANCED'
                    ? '#10B981'
                    : discrepancyStatus === 'SHORTAGE'
                    ? '#EF4444'
                    : '#F59E0B'
                }`,
                borderRadius: '10px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#94A3B8' }}>
                  PHYSICAL CASH COUNTED:
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                  ₹{actualCountedCash.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#94A3B8' }}>
                  DISCREPANCY (FARAK):
                </span>
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color:
                      discrepancyStatus === 'BALANCED'
                        ? '#34D399'
                        : discrepancyStatus === 'SHORTAGE'
                        ? '#F87171'
                        : '#FCD34D'
                  }}
                >
                  {discrepancy === 0
                    ? '🎯 ₹0.00 (PERFECT MATCH)'
                    : discrepancy < 0
                    ? `⚠️ ₹${Math.abs(discrepancy).toLocaleString('en-IN')} SHORTAGE (KAM HAI)`
                    : `➕ ₹${discrepancy.toLocaleString('en-IN')} SURPLUS (ZYADA HAI)`}
                </span>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
                {discrepancyStatus === 'BALANCED'
                  ? '✓ Cash drawer is 100% balanced. Outgoing and incoming pharmacists can sign the handover.'
                  : discrepancyStatus === 'SHORTAGE'
                  ? '⚠️ Physical cash is less than system bills. Verify if any cash sale or refund was unrecorded.'
                  : 'ℹ️ Physical cash is higher than expected. Check if customer returned change or extra float was added.'}
              </div>
            </div>

            {/* Submit Shift Handover Button */}
            <button
              type="button"
              onClick={handleSubmitShiftHandover}
              style={{
                backgroundColor: '#10B981',
                color: '#064E3B',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '0.9rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                marginTop: 'auto'
              }}
            >
              <span>💾</span>
              <span>Submit Shift Handover & Print 80mm Galla Slip</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: SALES INVOICES REGISTER (DETAILED BILLING LEDGER)              */}
      {/* ========================================================================= */}
      {activeDeskTab === 'INVOICES' && (
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Table Search & Mode Filter Ribbon */}
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <span style={{ fontSize: '1.1rem' }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Patient Name, Phone, Doctor, or Inv #..."
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  width: '100%',
                  maxWidth: '380px'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Payment Mode Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Mode:</span>
              {['ALL', 'CASH', 'UPI_QR', 'CARD', 'CREDIT_KHATA'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModeFilter(m)}
                  style={{
                    backgroundColor: modeFilter === m ? '#38BDF8' : '#0F172A',
                    color: modeFilter === m ? '#0F172A' : '#94A3B8',
                    border: modeFilter === m ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {m === 'ALL' ? 'All Modes' : m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Invoice #</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Date & Time</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Patient / Phone</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Doctor & NMC Reg</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Items</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Payment Mode</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Taxable Base</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total GST</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Grand Total</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedInvoices.length > 0 ? (
                  displayedInvoices.map((inv) => {
                    const totalGst = (inv.cgstAmount || 0) + (inv.sgstAmount || 0);
                    const itemsCount = (inv.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
                    const isScheduleH = inv.containsScheduleH;

                    return (
                      <tr
                        key={inv.id || inv.invoiceNumber}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                          {inv.invoiceNumber}
                          {isScheduleH && (
                            <span style={{ display: 'block', fontSize: '0.625rem', color: '#F87171', fontWeight: 900 }}>
                              ⚠️ SCH-H
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#CBD5E1' }}>
                          {inv.invoiceDate}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <strong style={{ color: '#F8FAFC' }}>{inv.patientName}</strong>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#94A3B8' }}>
                            {inv.patientPhone}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#CBD5E1' }}>
                          <div>{inv.doctorName || 'General OTC'}</div>
                          {inv.doctorNmcReg && (
                            <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontFamily: 'monospace' }}>
                              {inv.doctorNmcReg}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                            {itemsCount} units
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.6875rem',
                              backgroundColor:
                                inv.paymentMode === 'CASH'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : inv.paymentMode === 'UPI_QR'
                                  ? 'rgba(2, 132, 199, 0.15)'
                                  : inv.paymentMode === 'CARD'
                                  ? 'rgba(168, 85, 247, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              color:
                                inv.paymentMode === 'CASH'
                                  ? '#34D399'
                                  : inv.paymentMode === 'UPI_QR'
                                  ? '#38BDF8'
                                  : inv.paymentMode === 'CARD'
                                  ? '#C084FC'
                                  : '#FCD34D'
                            }}
                          >
                            {inv.paymentMode === 'CASH'
                              ? '💵 Cash'
                              : inv.paymentMode === 'UPI_QR'
                              ? '📱 UPI'
                              : inv.paymentMode === 'CARD'
                              ? '💳 Card'
                              : '📒 Khata'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94A3B8' }}>
                          ₹{inv.taxableAmount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#CBD5E1' }}>
                          ₹{totalGst.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#34D399', fontSize: '0.85rem' }}>
                          ₹{inv.grandTotal.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
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
                            title="Print 80mm thermal receipt"
                          >
                            🖨️ Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No pharmacy sales invoices found matching the selected horizon or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SHIFT HANDOVER AUDIT LOGS (HISTORY OF RECONCILED GALLA SLIPS)  */}
      {/* ========================================================================= */}
      {activeDeskTab === 'HISTORY' && (
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📜</span>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#F8FAFC' }}>
                Shift Handover Logs & Drawer Reconciliation Vault
              </h3>
            </div>
            <button
              type="button"
              onClick={handleExportHandoversCsv}
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#FCD34D',
                border: '1px solid #F59E0B',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              📥 Export Handover History (CSV)
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Handover #</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Date & Shift</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Pharmacists</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Opening Float</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Cash Sales</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Petty Expenses</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Expected Cash</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Counted Cash</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Discrepancy</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {handoversList.length > 0 ? (
                  handoversList.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                        {h.handoverNumber}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{h.handoverDate}</div>
                        <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{h.shiftLabel}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div><strong style={{ color: '#F87171' }}>Out:</strong> {h.outgoingPharmacistName}</div>
                        <div><strong style={{ color: '#34D399' }}>In:</strong> {h.incomingPharmacistName}</div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94A3B8' }}>
                        ₹{h.openingDrawerFloat.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#34D399', fontWeight: 700 }}>
                        +₹{h.cashSalesInflow.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#F87171' }}>
                        {h.pettyCashOutflow > 0 ? `-₹${h.pettyCashOutflow.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#38BDF8' }}>
                        ₹{h.expectedDrawerCash.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#F8FAFC' }}>
                        ₹{h.actualCountedCash.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.6875rem',
                            backgroundColor:
                              h.discrepancyStatus === 'BALANCED'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)',
                            color: h.discrepancyStatus === 'BALANCED' ? '#34D399' : '#F87171'
                          }}
                        >
                          {h.discrepancyStatus === 'BALANCED'
                            ? '🎯 Balanced'
                            : `⚠️ ₹${Math.abs(h.discrepancy)} ${h.discrepancyStatus}`}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setActiveHandoverSlip(h)}
                          style={{
                            backgroundColor: 'rgba(168, 85, 247, 0.15)',
                            color: '#C084FC',
                            border: '1px solid #A855F7',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Print 80mm Shift Handover Slip"
                        >
                          🖨️ 80mm Slip
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No past shift handovers recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOMER CREDIT KHATA DRILLDOWN MODAL (CUSTOMER-WISE DEBT & INVOICE BILLS)*/}
      {/* ========================================================================= */}
      {isCreditDrilldownOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #F59E0B',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(245, 158, 11, 0.2)',
              overflow: 'hidden',
              color: '#F8FAFC'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 22px',
                backgroundColor: '#1E293B',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>📒</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#FBBF24' }}>
                    ग्राहक उधार खाता विवरण (Customer Credit Ledger & Bills)
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                    कुल ऑल-टाइम मार्केट बकाया:{' '}
                    <strong style={{ color: '#F59E0B' }}>
                      ₹{allTimeMarketDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                    {' • '}
                    इस समयावधि ({activeDateFilter}) का नया उधार:{' '}
                    <strong style={{ color: '#38BDF8' }}>
                      ₹{horizonCreditSales.toLocaleString('en-IN')}
                    </strong>{' '}
                    ({horizonCreditInvoices.length} बिल)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreditDrilldownOpen(false);
                    setSelectedCustomerForBills(null);
                  }}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    color: '#CBD5E1',
                    borderRadius: '8px',
                    width: '34px',
                    height: '34px',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-Header Bar */}
            <div
              style={{
                padding: '12px 22px',
                backgroundColor: '#0B1329',
                borderBottom: '1px solid #1E293B',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              {selectedCustomerForBills ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerForBills(null)}
                    style={{
                      backgroundColor: '#1E293B',
                      color: '#38BDF8',
                      border: '1px solid #0284C7',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>←</span>
                    <span>सभी ग्राहकों की सूची पर वापस जाएं</span>
                  </button>

                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {selectedCustomerForBills.customerName} ({selectedCustomerForBills.customerPhone})
                  </span>

                  <span style={{ fontSize: '0.82rem', color: '#F59E0B', fontWeight: 800 }}>
                    बकाया: ₹{selectedCustomerForBills.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <>
                  {/* View Tabs */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setDrilldownTab('CUSTOMERS')}
                      style={{
                        backgroundColor: drilldownTab === 'CUSTOMERS' ? '#F59E0B' : '#1E293B',
                        color: drilldownTab === 'CUSTOMERS' ? '#78350F' : '#CBD5E1',
                        border: drilldownTab === 'CUSTOMERS' ? '1px solid #F59E0B' : '1px solid #334155',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      👥 सभी बकायेदार ग्राहक ({filteredCustomersList.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setDrilldownTab('INVOICES')}
                      style={{
                        backgroundColor: drilldownTab === 'INVOICES' ? '#38BDF8' : '#1E293B',
                        color: drilldownTab === 'INVOICES' ? '#0C4A6E' : '#CBD5E1',
                        border: drilldownTab === 'INVOICES' ? '1px solid #38BDF8' : '1px solid #334155',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      📄 इस समयावधि ({activeDateFilter}) के उधार बिल ({horizonCreditInvoices.length})
                    </button>
                  </div>

                  {/* Search Box */}
                  <div style={{ minWidth: '220px', flex: 1, maxWidth: '340px' }}>
                    <input
                      type="text"
                      placeholder="ग्राहक नाम, मोबाइल नंबर से खोजें..."
                      value={drilldownSearch}
                      onChange={(e) => setDrilldownSearch(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: '#F8FAFC',
                        fontSize: '0.78rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
              {selectedCustomerForBills ? (
                /* ============================================================ */
                /* VIEW SPECIFIC CUSTOMER'S BILLS AND LINE ITEMS               */
                /* ============================================================ */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Customer Header Card */}
                  <div
                    style={{
                      backgroundColor: '#1E293B',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                          {selectedCustomerForBills.customerName}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                          📞 {selectedCustomerForBills.customerPhone}
                        </span>
                        {selectedCustomerForBills.uhid && (
                          <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 6px', borderRadius: '4px' }}>
                            UHID: {selectedCustomerForBills.uhid}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#CBD5E1', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>कुल बिलिंग: <strong>₹{selectedCustomerForBills.totalBilled.toLocaleString('en-IN')}</strong></span>
                        <span>कुल जमा: <strong style={{ color: '#34D399' }}>₹{selectedCustomerForBills.totalPaid.toLocaleString('en-IN')}</strong></span>
                        <span>उधार लिमिट: <strong>{selectedCustomerForBills.creditLimit > 0 ? `₹${selectedCustomerForBills.creditLimit.toLocaleString('en-IN')}` : 'Unlimited'}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setActiveKhataPaymentAccount(selectedCustomerForBills)}
                        style={{
                          backgroundColor: '#10B981',
                          color: '#064E3B',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '0.82rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>💵</span>
                        <span>जमा लें (Collect Payment)</span>
                      </button>

                      <a
                        href={`https://wa.me/91${selectedCustomerForBills.customerPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                          `नमस्ते ${selectedCustomerForBills.customerName} जी,\n` +
                          `आपके मेडिकल स्टोर (${profile.entityLegalName || 'Pharmacy Counter'}) पर कुल ₹${selectedCustomerForBills.currentBalance.toLocaleString('en-IN')} का बकाया है।\n` +
                          `कृपया काउंटर पर जमा कराएं या UPI से भुगतान करें।\n` +
                          `धन्यवाद!\n${profile.entityLegalName || 'Pharmacy'} (${profile.contactPhone || ''})`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: '#25D366',
                          color: '#064E3B',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '0.82rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>📱</span>
                        <span>WhatsApp तगादा</span>
                      </a>
                    </div>
                  </div>

                  {/* Customer Invoices List */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 800, color: '#38BDF8' }}>
                      📄 ग्राहक के उधार बिल व दवाइयों का विवरण:
                    </h4>

                    {(() => {
                      const phone = selectedCustomerForBills.customerPhone.replace(/\D/g, '').slice(-10);
                      const name = selectedCustomerForBills.customerName.toLowerCase().trim();
                      const allInvoices = pharmacyRevenueGallaService.getInvoices();
                      const invoices = allInvoices.filter((inv: PharmacySalesInvoiceRecord) => {
                        const invPhone = (inv.patientPhone || '').replace(/\D/g, '').slice(-10);
                        const invName = (inv.patientName || '').toLowerCase().trim();
                        return (
                          inv.paymentMode === 'CREDIT_KHATA' &&
                          ((phone && invPhone === phone) || (name && invName === name))
                        );
                      });

                      if (invoices.length === 0) {
                        // Check if ledger entries exist
                        const ledgerEntries = pharmacyCreditKhataService.getLedgerEntries(selectedCustomerForBills.id);
                        return (
                          <div
                            style={{
                              backgroundColor: '#1E293B',
                              borderRadius: '10px',
                              padding: '20px',
                              border: '1px solid rgba(255,255,255,0.06)'
                            }}
                          >
                            <p style={{ margin: '0 0 12px 0', color: '#94A3B8', fontSize: '0.82rem' }}>
                              इस ग्राहक का खाता लेज़र में दर्ज है। नीचे लेन-देन का विवरण दिया गया है:
                            </p>
                            {ledgerEntries.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {ledgerEntries.map((l) => (
                                  <div
                                    key={l.id}
                                    style={{
                                      backgroundColor: '#0F172A',
                                      padding: '10px 14px',
                                      borderRadius: '8px',
                                      borderLeft: `4px solid ${l.entryType === 'DEBIT_INVOICE' ? '#F59E0B' : '#10B981'}`,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      fontSize: '0.78rem'
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: 800, color: l.entryType === 'DEBIT_INVOICE' ? '#FBBF24' : '#34D399' }}>
                                        {l.entryType === 'DEBIT_INVOICE' ? `➕ उधार बिल (${l.referenceId || 'Debit'})` : `➖ जमा भुगतान (${l.referenceId || 'Payment'})`}
                                      </div>
                                      <div style={{ color: '#94A3B8', fontSize: '0.72rem', marginTop: '2px' }}>
                                        {new Date(l.timestamp).toLocaleString('en-IN')} {l.takenBy ? `• दवा ली: ${l.takenBy}` : ''}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontWeight: 900, fontSize: '0.9rem', color: l.entryType === 'DEBIT_INVOICE' ? '#F59E0B' : '#10B981' }}>
                                        {l.entryType === 'DEBIT_INVOICE' ? '+' : '-'}₹{l.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </div>
                                      <div style={{ color: '#64748B', fontSize: '0.7rem' }}>
                                        शेष: ₹{l.newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                लेज़र में कोई पिछला रिकॉर्ड उपलब्ध नहीं है।
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {invoices.map((inv: PharmacySalesInvoiceRecord) => (
                            <div
                              key={inv.id || inv.invoiceNumber}
                              style={{
                                backgroundColor: '#1E293B',
                                borderRadius: '12px',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}
                            >
                              {/* Invoice Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#FBBF24' }}>
                                      📄 बिल #{inv.invoiceNumber}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                      उधार (CREDIT KHATA)
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                                    📅 तारीख: {inv.invoiceDate} {inv.doctorName ? `• डॉक्टर: ${inv.doctorName}` : ''}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F59E0B' }}>
                                      ₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                                      {inv.items.length} आइटम
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setActiveReceiptInvoice(inv)}
                                    style={{
                                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                      color: '#38BDF8',
                                      border: '1px solid #0284C7',
                                      borderRadius: '6px',
                                      padding: '6px 12px',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="View and print 80mm thermal receipt slip"
                                  >
                                    <span>🖨️</span>
                                    <span>80mm पर्चा प्रिंट</span>
                                  </button>
                                </div>
                              </div>

                              {/* Medicine Items Table */}
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', color: '#CBD5E1' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #334155' }}>
                                      <th style={{ textAlign: 'left', padding: '6px 10px', color: '#94A3B8' }}>दवा का नाम (Item)</th>
                                      <th style={{ textAlign: 'center', padding: '6px 10px', color: '#94A3B8' }}>मात्रा (Qty)</th>
                                      <th style={{ textAlign: 'right', padding: '6px 10px', color: '#94A3B8' }}>रेट (Rate)</th>
                                      <th style={{ textAlign: 'right', padding: '6px 10px', color: '#94A3B8' }}>कुल (Total)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                     {inv.items.map((item: any, idx: number) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '6px 10px', fontWeight: 700, color: '#F8FAFC' }}>
                                          {item.medicationName}
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                                          {item.quantity}
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '6px 10px' }}>
                                          ₹{item.rate.toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 800, color: '#FCD34D' }}>
                                          ₹{item.total.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : drilldownTab === 'CUSTOMERS' ? (
                /* ============================================================ */
                /* TAB 1: ALL CUSTOMERS LIST WITH OUTSTANDING BALANCES          */
                /* ============================================================ */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredCustomersList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                      <div style={{ fontSize: '2rem' }}>📒</div>
                      <div style={{ marginTop: '8px', fontWeight: 700 }}>कोई उधार खाता नहीं मिला</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                        पीओएस काउंटर पर जब भी कोई बिल "CREDIT KHATA" पर कटेगा, वह ग्राहक यहाँ अपने आप दिखने लगेगा।
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#1E293B', borderBottom: '1.5px solid #334155' }}>
                            <th style={{ textAlign: 'left', padding: '10px 14px', color: '#94A3B8' }}>ग्राहक (Customer)</th>
                            <th style={{ textAlign: 'right', padding: '10px 14px', color: '#94A3B8' }}>कुल बकाया (Due)</th>
                            <th style={{ textAlign: 'right', padding: '10px 14px', color: '#94A3B8' }}>कुल बिलिंग</th>
                            <th style={{ textAlign: 'right', padding: '10px 14px', color: '#94A3B8' }}>जमा (Paid)</th>
                            <th style={{ textAlign: 'center', padding: '10px 14px', color: '#94A3B8' }}>स्थिति (Status)</th>
                            <th style={{ textAlign: 'right', padding: '10px 14px', color: '#94A3B8' }}>कार्य (Actions)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCustomersList.map((acc) => (
                            <tr
                              key={acc.id}
                              style={{
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                backgroundColor: acc.currentBalance > 0 ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontWeight: 800, color: '#F8FAFC' }}>
                                  {acc.customerName}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                                  📞 {acc.customerPhone} {acc.uhid ? `• UHID: ${acc.uhid}` : ''}
                                </div>
                              </td>

                              <td style={{ textAlign: 'right', padding: '10px 14px' }}>
                                <div style={{ fontWeight: 900, fontSize: '0.95rem', color: acc.currentBalance > 0 ? '#F59E0B' : '#10B981' }}>
                                  ₹{acc.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                              </td>

                              <td style={{ textAlign: 'right', padding: '10px 14px', color: '#CBD5E1' }}>
                                ₹{acc.totalBilled.toLocaleString('en-IN')}
                              </td>

                              <td style={{ textAlign: 'right', padding: '10px 14px', color: '#34D399', fontWeight: 700 }}>
                                ₹{acc.totalPaid.toLocaleString('en-IN')}
                              </td>

                              <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                                {acc.status === 'OVERDUE' ? (
                                  <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', border: '1px solid #EF4444', padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                                    ⚠️ Overdue &gt;30D
                                  </span>
                                ) : acc.currentBalance > 0 ? (
                                  <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: '1px solid #F59E0B', padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                                    बकाया उधार (Due)
                                  </span>
                                ) : (
                                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid #10B981', padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                                    ✓ चुकता (Settled)
                                  </span>
                                )}
                              </td>

                              <td style={{ textAlign: 'right', padding: '10px 14px' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCustomerForBills(acc)}
                                    style={{
                                      backgroundColor: '#1E293B',
                                      color: '#38BDF8',
                                      border: '1px solid #0284C7',
                                      borderRadius: '6px',
                                      padding: '4px 10px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                    title="View customer invoices and medicines taken"
                                  >
                                    📄 बिल देखें
                                  </button>

                                  {acc.currentBalance > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveKhataPaymentAccount(acc)}
                                      style={{
                                        backgroundColor: '#10B981',
                                        color: '#064E3B',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '4px 10px',
                                        fontSize: '0.72rem',
                                        fontWeight: 900,
                                        cursor: 'pointer'
                                      }}
                                      title="Record repayment from customer"
                                    >
                                      💵 जमा लें
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* ============================================================ */
                /* TAB 2: INVOICES SPECIFIC TO ACTIVE TIME HORIZON              */
                /* ============================================================ */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    इस समयावधि ({activeDateFilter}) में काटे गए कुल{' '}
                    <strong style={{ color: '#FBBF24' }}>{horizonCreditInvoices.length} उधार बिल</strong>{' '}
                    (कुल राशि: <strong style={{ color: '#F59E0B' }}>₹{horizonCreditSales.toLocaleString('en-IN')}</strong>):
                  </div>

                  {horizonCreditInvoices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                      <div style={{ fontSize: '2rem' }}>📄</div>
                      <div style={{ marginTop: '8px', fontWeight: 700 }}>
                        इस समयावधि ({activeDateFilter}) में कोई नया उधार बिल नहीं काटा गया
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                        समय सीमा बदलकर 'All Time' या 'Custom Date Range' चुनकर पुराने उधार बिल देखे जा सकते हैं।
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {horizonCreditInvoices.map((inv: PharmacySalesInvoiceRecord) => (
                        <div
                          key={inv.id || inv.invoiceNumber}
                          style={{
                            backgroundColor: '#1E293B',
                            borderRadius: '12px',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#FBBF24' }}>
                                  📄 बिल #{inv.invoiceNumber}
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                                  {inv.patientName}
                                </span>
                                {inv.patientPhone && (
                                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                    (📞 {inv.patientPhone})
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                                📅 तारीख: {inv.invoiceDate} {inv.doctorName ? `• डॉक्टर: ${inv.doctorName}` : ''}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F59E0B' }}>
                                  ₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                                  {inv.items.length} आइटम
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setActiveReceiptInvoice(inv)}
                                style={{
                                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                  color: '#38BDF8',
                                  border: '1px solid #0284C7',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>🖨️</span>
                                <span>80mm पर्चा देखें</span>
                              </button>
                            </div>
                          </div>

                          {/* Items Table */}
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', color: '#CBD5E1' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #334155' }}>
                                  <th style={{ textAlign: 'left', padding: '6px 10px', color: '#94A3B8' }}>दवा का नाम (Item)</th>
                                  <th style={{ textAlign: 'center', padding: '6px 10px', color: '#94A3B8' }}>मात्रा (Qty)</th>
                                  <th style={{ textAlign: 'right', padding: '6px 10px', color: '#94A3B8' }}>रेट (Rate)</th>
                                  <th style={{ textAlign: 'right', padding: '6px 10px', color: '#94A3B8' }}>कुल (Total)</th>
                                </tr>
                              </thead>
                              <tbody>
                                 {inv.items.map((item: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#F8FAFC' }}>
                                      {item.medicationName}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                                      {item.quantity}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '6px 10px' }}>
                                      ₹{item.rate.toFixed(2)}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 800, color: '#FCD34D' }}>
                                      ₹{item.total.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KHATA REPAYMENT / CASH COLLECTION MODAL                                    */}
      {/* ========================================================================= */}
      {activeKhataPaymentAccount && (
        <KhataPaymentCollectionModal
          isOpen={!!activeKhataPaymentAccount}
          onClose={() => {
            setActiveKhataPaymentAccount(null);
            reloadData();
          }}
          account={activeKhataPaymentAccount}
          onPaymentSuccess={(receiptNum) => {
            reloadData();
            setActiveKhataPaymentAccount(null);
            setToastMessage(`✓ जमा रसीद #${receiptNum} सफलतापूर्वक दर्ज हुई!`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 80MM THERMAL SALES INVOICE MODAL                                          */}
      {/* ========================================================================= */}
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
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                {profile.entityLegalName.toUpperCase()}
              </div>
              <div style={{ fontSize: '9px', color: '#555' }}>
                {profile.officialAddress}
              </div>
              <div style={{ fontSize: '9px', color: '#555' }}>
                Phone: {profile.contactPhone} | DL: {profile.pharmacyDrugLicense20B}
              </div>
              <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                RETAIL TAX INVOICE
              </div>
            </div>

            <div style={{ margin: '8px 0', borderBottom: '1px dashed #000', paddingBottom: '6px' }}>
              <div><strong>Inv #:</strong> {activeReceiptInvoice.invoiceNumber}</div>
              <div><strong>Date:</strong> {activeReceiptInvoice.invoiceDate}</div>
              <div><strong>Patient:</strong> {activeReceiptInvoice.patientName}</div>
              <div><strong>Phone:</strong> {activeReceiptInvoice.patientPhone}</div>
              <div><strong>Doctor:</strong> {activeReceiptInvoice.doctorName || 'General OTC'}</div>
              {activeReceiptInvoice.doctorNmcReg && (
                <div><strong>Doctor NMC:</strong> {activeReceiptInvoice.doctorNmcReg}</div>
              )}
              <div><strong>Payment:</strong> {activeReceiptInvoice.paymentMode}</div>
            </div>

            {/* Items */}
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                <span>Item</span>
                <span>Qty x Rate</span>
                <span>Total</span>
              </div>
              {activeReceiptInvoice.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {it.medicationName}
                  </span>
                  <span>{it.quantity} x ₹{it.rate}</span>
                  <span style={{ fontWeight: 'bold' }}>₹{it.total}</span>
                </div>
              ))}
            </div>

            {/* Total Math */}
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>₹{activeReceiptInvoice.subtotal.toFixed(2)}</span>
              </div>
              {activeReceiptInvoice.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                  <span>Discount:</span>
                  <span>-₹{activeReceiptInvoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555' }}>
                <span>Taxable Base:</span>
                <span>₹{activeReceiptInvoice.taxableAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555' }}>
                <span>GST (CGST+SGST):</span>
                <span>₹{((activeReceiptInvoice.cgstAmount || 0) + (activeReceiptInvoice.sgstAmount || 0)).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>
                <span>GRAND TOTAL:</span>
                <span>₹{activeReceiptInvoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '9px', color: '#555' }}>
              <div>Pharmacist: {activeReceiptInvoice.pharmacistName}</div>
              <div>Reg #: {activeReceiptInvoice.pharmacistRegNo}</div>
              <div style={{ marginTop: '4px' }}>*** Get Well Soon ***</div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  backgroundColor: '#0F172A',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🖨️ Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setActiveReceiptInvoice(null)}
                style={{
                  backgroundColor: '#E2E8F0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 80MM SHIFT GALLA HANDOVER SLIP MODAL                                      */}
      {/* ========================================================================= */}
      {activeHandoverSlip && (
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
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                {profile.entityLegalName.toUpperCase()}
              </div>
              <div style={{ fontSize: '9px', color: '#555' }}>
                {profile.officialAddress}
              </div>
              <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                GALLA / SHIFT HANDOVER SLIP
              </div>
              <div style={{ fontSize: '10px', color: '#0284C7', fontWeight: 'bold' }}>
                #{activeHandoverSlip.handoverNumber}
              </div>
            </div>

            <div style={{ margin: '8px 0', borderBottom: '1px dashed #000', paddingBottom: '6px' }}>
              <div><strong>Date:</strong> {activeHandoverSlip.handoverDate}</div>
              <div><strong>Shift:</strong> {activeHandoverSlip.shiftLabel}</div>
              <div><strong>Outgoing:</strong> {activeHandoverSlip.outgoingPharmacistName}</div>
              <div><strong>Incoming:</strong> {activeHandoverSlip.incomingPharmacistName}</div>
            </div>

            {/* Reconciliation Math */}
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>(A) Opening Float:</span>
                <span>₹{activeHandoverSlip.openingDrawerFloat.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#16A34A' }}>
                <span>(+) Cash Sales:</span>
                <span>+₹{activeHandoverSlip.cashSalesInflow.toFixed(2)}</span>
              </div>
              {activeHandoverSlip.pettyCashOutflow > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                  <span>(-) Petty Expenses:</span>
                  <span>-₹{activeHandoverSlip.pettyCashOutflow.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dotted #888', marginTop: '3px', paddingTop: '3px' }}>
                <span>Expected Drawer Cash:</span>
                <span>₹{activeHandoverSlip.expectedDrawerCash.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', marginTop: '3px' }}>
                <span>Actual Counted Cash:</span>
                <span>₹{activeHandoverSlip.actualCountedCash.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '3px', color: activeHandoverSlip.discrepancy === 0 ? '#16A34A' : '#DC2626' }}>
                <span>Discrepancy:</span>
                <span>
                  {activeHandoverSlip.discrepancy === 0
                    ? '🎯 ₹0.00 (EXACT MATCH)'
                    : `₹${activeHandoverSlip.discrepancy.toFixed(2)} (${activeHandoverSlip.discrepancyStatus})`}
                </span>
              </div>
            </div>

            {/* Denomination Breakup */}
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px', fontSize: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Note Denominations:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>500 x {activeHandoverSlip.denominationBreakup.n500} = ₹{activeHandoverSlip.denominationBreakup.n500 * 500}</span>
                <span>200 x {activeHandoverSlip.denominationBreakup.n200} = ₹{activeHandoverSlip.denominationBreakup.n200 * 200}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>100 x {activeHandoverSlip.denominationBreakup.n100} = ₹{activeHandoverSlip.denominationBreakup.n100 * 100}</span>
                <span>50 x {activeHandoverSlip.denominationBreakup.n50} = ₹{activeHandoverSlip.denominationBreakup.n50 * 50}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>20 x {activeHandoverSlip.denominationBreakup.n20} = ₹{activeHandoverSlip.denominationBreakup.n20 * 20}</span>
                <span>10 x {activeHandoverSlip.denominationBreakup.n10} = ₹{activeHandoverSlip.denominationBreakup.n10 * 10}</span>
              </div>
              {activeHandoverSlip.denominationBreakup.coins > 0 && (
                <div>Coins = ₹{activeHandoverSlip.denominationBreakup.coins}</div>
              )}
            </div>

            {/* Other Payment Inflows for the Shift */}
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px', fontSize: '9px', color: '#555' }}>
              <div>UPI Sales: ₹{activeHandoverSlip.upiSalesInflow.toFixed(2)} | Card: ₹{activeHandoverSlip.cardSalesInflow.toFixed(2)}</div>
              <div>Khata Sales: ₹{activeHandoverSlip.khataSalesInflow.toFixed(2)} | Total Shift Rev: ₹{activeHandoverSlip.grossShiftRevenue.toFixed(2)}</div>
            </div>

            {/* Signatures */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', borderTop: '1px dotted #888', paddingTop: '6px' }}>
              <div style={{ textAlign: 'center' }}>
                <div>____________________</div>
                <div>Outgoing Pharmacist</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div>____________________</div>
                <div>Incoming Pharmacist</div>
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  backgroundColor: '#0F172A',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🖨️ Print 80mm Galla Slip
              </button>
              <button
                type="button"
                onClick={() => setActiveHandoverSlip(null)}
                style={{
                  backgroundColor: '#E2E8F0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
