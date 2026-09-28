import React, { useState, useMemo, useEffect } from 'react';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';
import { clinicalInvestigationService } from '../../services/clinical-investigation-service.js';
import { downloadVectorPathologyPdf } from '../../utils/clientPathologyPdf.js';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrint: (order: InvestigationOrderDto) => void;
  onOpenBilling: (order: InvestigationOrderDto) => void;
  onOpenEditReport: (order: InvestigationOrderDto) => void;
  orders?: InvestigationOrderDto[];
}

export const PathologyReportHistoryBookModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenPrint,
  onOpenBilling,
  onOpenEditReport,
  orders: propOrders
}) => {
  const [liveOrders, setLiveOrders] = useState<InvestigationOrderDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [billingFilter, setBillingFilter] = useState<'ALL' | 'UNBILLED' | 'BILLED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7D' | '30D'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<InvestigationOrderDto | null>(null);

  const profile = getVerifiedRoleProfile();

  const handleDownloadPdf = (order: InvestigationOrderDto) => {
    const settings = {
      labName: profile.entityLegalName.toUpperCase(),
      labTagline: profile.facilityTagline,
      labAddress: `📍 ${profile.officialAddress} | 📞 ${profile.contactPhone} | 🌐 ${profile.website}`,
      certificateNo: profile.nablCertificateNo,
      technicianName: profile.technicianName || 'Medical Lab Technologist',
      technicianTitle: 'Senior Medical Lab Technologist',
      pathologistName: profile.pathologistName,
      pathologistTitle: 'Consultant Pathologist & Lab Director',
      pathologistRegNo: profile.pathologistRegNo
    };
    downloadVectorPathologyPdf(order, settings);
  };

  const loadOrders = () => {
    try {
      const all = clinicalInvestigationService.getOrdersSync();
      setLiveOrders([...all]);
    } catch {
      if (propOrders) setLiveOrders([...propOrders]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, propOrders]);

  useEffect(() => {
    const handleUpdate = () => loadOrders();
    window.addEventListener('docsearch_orders_updated', handleUpdate);
    return () => window.removeEventListener('docsearch_orders_updated', handleUpdate);
  }, []);

  // Filter only orders that have a generated/released report
  const ordersWithReports = useMemo(() => {
    return liveOrders.filter((o) => o.report || o.status === 'VERIFIED' || o.status === 'REVIEWED');
  }, [liveOrders]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    ordersWithReports.forEach((o) => {
      if (o.investigationCategory) set.add(o.investigationCategory);
    });
    return Array.from(set);
  }, [ordersWithReports]);

  const filteredOrders = useMemo(() => {
    return ordersWithReports.filter((ord) => {
      const meta = (ord.metadata as any) || {};
      const isBilled = meta.billingStatus === 'BILLED';

      if (billingFilter === 'UNBILLED' && isBilled) return false;
      if (billingFilter === 'BILLED' && !isBilled) return false;

      if (categoryFilter !== 'ALL' && ord.investigationCategory !== categoryFilter) return false;

      if (dateFilter !== 'ALL') {
        const ordTime = new Date(ord.orderedAt || Date.now()).getTime();
        const now = Date.now();
        const diffHours = (now - ordTime) / (1000 * 60 * 60);
        if (dateFilter === 'TODAY' && diffHours > 24) return false;
        if (dateFilter === '7D' && diffHours > 24 * 7) return false;
        if (dateFilter === '30D' && diffHours > 24 * 30) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          ord.patientName?.toLowerCase().includes(q) ||
          ord.patientMrn?.toLowerCase().includes(q) ||
          ord.orderNumber?.toLowerCase().includes(q) ||
          ord.investigationName?.toLowerCase().includes(q) ||
          ord.report?.reportNumber?.toLowerCase().includes(q) ||
          ord.orderingDoctorName?.toLowerCase().includes(q) ||
          meta.invoiceNumber?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [ordersWithReports, billingFilter, categoryFilter, dateFilter, searchTerm]);

  // Statistics
  const totalReports = ordersWithReports.length;
  const billedCount = ordersWithReports.filter((o) => (o.metadata as any)?.billingStatus === 'BILLED').length;
  const unbilledCount = totalReports - billedCount;
  const criticalCount = ordersWithReports.filter((o) => o.isCritical || o.results?.some((r) => r.isCritical)).length;

  if (!isOpen) return null;

  const handleWhatsAppAlert = (ord: InvestigationOrderDto) => {
    const meta = (ord.metadata as any) || {};
    const rawPhone = (meta.patientPhone || '9876543210').replace(/[^0-9]/g, '');
    const phoneWithCode = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const reportNo = ord.report?.reportNumber || ord.orderNumber;
    const labName = profile.entityLegalName || 'DOC SEARCH CENTRAL PATHOLOGY LABORATORY';
    const message = encodeURIComponent(
      `*${labName} - OFFICIAL DIAGNOSTIC REPORT*\n\n` +
      `Dear *${ord.patientName}*,\n` +
      `Your verified diagnostic report for *${ord.investigationName}* is ready.\n\n` +
      `📋 *Report ID:* ${reportNo}\n` +
      `👤 *Patient UHID:* ${ord.patientMrn}\n` +
      `👨‍⚕️ *Consultant Pathologist:* ${ord.report?.verifyingPathologist || 'Chief Pathologist'}\n` +
      `💳 *Billing Status:* ${meta.billingStatus === 'BILLED' ? `Paid (Invoice #${meta.invoiceNumber})` : 'Pending Front-Desk Billing'}\n\n` +
      `🔒 *NABL ISO 15189:2022 Digital Report Verification:*\n` +
      `${window.location.origin}/api/v1/partner/lab/verify-report/${reportNo}\n\n` +
      `_Authentic NABL Accredited Laboratory Release._`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${message}`, '_blank');
  };

  const activeOrder = selectedOrder || filteredOrders[0] || null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 12000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          borderRadius: '16px',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          width: '98vw',
          maxWidth: '1560px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1.5px solid rgba(255,255,255,0.1)',
            backgroundColor: '#0B1120',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(2, 132, 199, 0.2)',
                border: '1px solid #0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}
            >
              📖
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                  PATHOLOGY REPORT HISTORY BOOK (रजिस्टर)
                </h2>
                <span style={{ fontSize: '0.6875rem', backgroundColor: '#0284C7', color: '#FFF', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                  FINALIZED DIAGNOSTIC ARCHIVE
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Permanent audit register of all generated test reports with strict billing linkage and dynamic re-editing.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Close History Book
            </button>
          </div>
        </div>

        {/* KPI Stats Radar Bar */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: '#070C16',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}
        >
          <div style={{ backgroundColor: '#1E293B', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>TOTAL REPORTS RELEASED</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38BDF8' }}>{totalReports} Reports</div>
          </div>
          <div
            onClick={() => setBillingFilter('UNBILLED')}
            style={{
              backgroundColor: billingFilter === 'UNBILLED' ? 'rgba(245, 158, 11, 0.2)' : '#1E293B',
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${billingFilter === 'UNBILLED' ? '#F59E0B' : 'rgba(245, 158, 11, 0.3)'}`,
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 700 }}>🟡 PENDING BILLING (UNBILLED)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FBBF24' }}>{unbilledCount} Pending Bills</div>
          </div>
          <div
            onClick={() => setBillingFilter('BILLED')}
            style={{
              backgroundColor: billingFilter === 'BILLED' ? 'rgba(16, 185, 129, 0.2)' : '#1E293B',
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${billingFilter === 'BILLED' ? '#10B981' : 'rgba(16, 185, 129, 0.3)'}`,
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '0.6875rem', color: '#6EE7B7', fontWeight: 700 }}>🟢 BILLED & INVOICED</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#34D399' }}>{billedCount} Completed</div>
          </div>
          <div style={{ backgroundColor: '#1E293B', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: '0.6875rem', color: '#FCA5A5', fontWeight: 700 }}>🚨 CRITICAL / PANIC REPORTS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EF4444' }}>{criticalCount} Critical</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#0F172A',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 320px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search patient name, MRN, report #, invoice #, doctor..."
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '7px 12px',
                color: '#FFF',
                fontSize: '0.8125rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Billing Filter Pills */}
            <div style={{ display: 'flex', backgroundColor: '#1E293B', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {(['ALL', 'UNBILLED', 'BILLED'] as const).map((bf) => (
                <button
                  key={bf}
                  type="button"
                  onClick={() => setBillingFilter(bf)}
                  style={{
                    backgroundColor: billingFilter === bf ? (bf === 'UNBILLED' ? '#D97706' : bf === 'BILLED' ? '#059669' : '#0284C7') : 'transparent',
                    color: billingFilter === bf ? '#FFF' : '#94A3B8',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {bf === 'ALL' ? 'All Reports' : bf === 'UNBILLED' ? '🟡 Unbilled Only' : '🟢 Billed Only'}
                </button>
              ))}
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              style={{
                backgroundColor: '#1E293B',
                color: '#FFF',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem'
              }}
            >
              <option value="ALL">📅 All Dates</option>
              <option value="TODAY">Today (24h)</option>
              <option value="7D">Past 7 Days</option>
              <option value="30D">Past 30 Days</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                backgroundColor: '#1E293B',
                color: '#FFF',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem'
              }}
            >
              <option value="ALL">🔬 All Departments</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content Split: Left History Ledger Table + Right Live Report Summary */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Table Register */}
          <div style={{ flex: '1 1 60%', borderRight: '1.5px solid rgba(255,255,255,0.1)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0B1120', color: '#94A3B8', borderBottom: '1.5px solid #334155', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '10px 14px' }}>#</th>
                  <th style={{ padding: '10px 14px' }}>REPORT ID / RELEASED</th>
                  <th style={{ padding: '10px 14px' }}>PATIENT DEMOGRAPHICS</th>
                  <th style={{ padding: '10px 14px' }}>TEST INVESTIGATION</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>FINDINGS</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>BILLING STATUS</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>QUICK ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                      <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>📂</div>
                      <strong style={{ color: '#94A3B8', fontSize: '0.94rem' }}>No finalized reports matched your filter criteria</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>
                        To generate reports, use the <strong>+ Walk-In Test & Print</strong> workstation.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord, idx) => {
                    const isCurrent = activeOrder?.id === ord.id;
                    const meta = (ord.metadata as any) || {};
                    const isBilled = meta.billingStatus === 'BILLED';
                    const reportNo = ord.report?.reportNumber || ord.orderNumber;
                    const releasedDate = ord.report?.finalizedAt || ord.orderedAt;
                    const abnormalCount = ord.results?.filter((r) => r.abnormalFlag !== 'NORMAL').length || 0;
                    const isCrit = ord.isCritical || ord.results?.some((r) => r.isCritical);

                    return (
                      <tr
                        key={ord.id || idx}
                        onClick={() => setSelectedOrder(ord)}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          backgroundColor: isCurrent ? 'rgba(2, 132, 199, 0.18)' : 'transparent',
                          borderLeft: isCurrent ? '3px solid #38BDF8' : isCrit ? '3px solid #EF4444' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '10px 14px', color: '#64748B' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                            {reportNo}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                            {releasedDate ? new Date(releasedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Today'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#F8FAFC' }}>
                            {ord.patientName}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                            {(ord as any).patientAge || '38'}Y / {ord.patientGender || 'Male'} · MRN: <span style={{ fontFamily: 'monospace' }}>{ord.patientMrn}</span>
                          </div>
                          {meta.patientPhone && (
                            <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                              📞 {meta.patientPhone}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#E2E8F0' }}>
                            {ord.investigationName}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#0284C7' }}>
                            {ord.investigationCategory || 'Clinical Pathology'}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                            👨‍⚕️ {ord.orderingDoctorName || 'Self / Walk-In'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {isCrit ? (
                            <span style={{ backgroundColor: '#7F1D1D', color: '#FCA5A5', padding: '2px 8px', borderRadius: '12px', fontWeight: 900, fontSize: '0.6875rem' }}>
                              🚨 CRITICAL
                            </span>
                          ) : abnormalCount > 0 ? (
                            <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', padding: '2px 8px', borderRadius: '12px', fontWeight: 800, fontSize: '0.6875rem' }}>
                              ⚠️ {abnormalCount} Abnormal
                            </span>
                          ) : (
                            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.6875rem' }}>
                              ✓ All Normal
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {isBilled ? (
                            <div>
                              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid #10B981', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.6875rem' }}>
                                🟢 BILLED
                              </span>
                              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '3px', fontFamily: 'monospace' }}>
                                {meta.invoiceNumber || 'INV-PAID'} (₹{meta.billedAmount || meta.paidAmount || '999'})
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', border: '1px solid #F59E0B', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.6875rem' }}>
                                🟡 UNBILLED
                              </span>
                              <div style={{ marginTop: '4px' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenBilling(ord);
                                  }}
                                  style={{
                                    backgroundColor: '#10B981',
                                    color: '#064E3B',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '3px 8px',
                                    fontSize: '0.6875rem',
                                    fontWeight: 900,
                                    cursor: 'pointer'
                                  }}
                                  title="Create official bill for this completed report"
                                >
                                  🧾 Bill Now
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPrint(ord);
                              }}
                              style={{
                                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                color: '#38BDF8',
                                border: '1px solid #0284C7',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Print NABL Pathology Report"
                            >
                              🖨️ Print
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditReport(ord);
                              }}
                              style={{
                                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                                color: '#C084FC',
                                border: '1px solid #9333EA',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Edit observed values, ranges, parameters or impression"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsAppAlert(ord);
                              }}
                              style={{
                                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                                color: '#4ADE80',
                                border: '1px solid #16A34A',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Send report alert to patient's WhatsApp"
                            >
                              📲
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Right Detail Inspection & Action Sheet */}
          <div style={{ flex: '1 1 40%', backgroundColor: '#0B132B', padding: '20px', overflowY: 'auto' }}>
            {activeOrder ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>
                      REPORT AUDIT INSPECTION
                    </span>
                    <h3 style={{ margin: '2px 0', fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                      {activeOrder.investigationName}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Report #{activeOrder.report?.reportNumber || activeOrder.orderNumber} · Specimen: {activeOrder.specimenType}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => onOpenPrint(activeOrder)}
                      style={{
                        backgroundColor: '#0284C7',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      🖨️ Open Print Sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEditReport(activeOrder)}
                      style={{
                        backgroundColor: '#9333EA',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit Report
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(activeOrder)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: '#38BDF8',
                        border: '1px solid #38BDF8',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      📥 Vector PDF
                    </button>
                  </div>
                </div>

                {/* Patient Summary Card */}
                <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <div><span style={{ color: '#94A3B8' }}>Patient:</span> <strong style={{ color: '#FFF' }}>{activeOrder.patientName}</strong></div>
                    <div><span style={{ color: '#94A3B8' }}>Age/Gender:</span> <strong>{(activeOrder as any).patientAge || '38'}Y / {activeOrder.patientGender || 'Male'}</strong></div>
                    <div><span style={{ color: '#94A3B8' }}>UHID / MRN:</span> <strong style={{ fontFamily: 'monospace' }}>{activeOrder.patientMrn}</strong></div>
                    <div><span style={{ color: '#94A3B8' }}>Doctor:</span> <strong>{activeOrder.orderingDoctorName || 'Self / Direct'}</strong></div>
                    <div><span style={{ color: '#94A3B8' }}>Barcode:</span> <strong style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{(activeOrder.metadata as any)?.sampleBarcode || activeOrder.orderNumber}</strong></div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Billing:</span>{' '}
                      {(activeOrder.metadata as any)?.billingStatus === 'BILLED' ? (
                        <span style={{ color: '#34D399', fontWeight: 800 }}>✓ Billed ({(activeOrder.metadata as any)?.invoiceNumber})</span>
                      ) : (
                        <span style={{ color: '#FBBF24', fontWeight: 800 }}>⚠️ Unbilled</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Billing Action Box */}
                {(activeOrder.metadata as any)?.billingStatus !== 'BILLED' && (
                  <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1.5px solid #F59E0B', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#FCD34D', fontSize: '0.8125rem' }}>
                        💳 Patient Has Not Been Billed For This Report
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#CBD5E1', marginTop: '2px' }}>
                        Generate front-desk POS bill linked to this verified investigation.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenBilling(activeOrder)}
                      style={{
                        backgroundColor: '#10B981',
                        color: '#064E3B',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        cursor: 'pointer'
                      }}
                    >
                      🧾 Generate Bill →
                    </button>
                  </div>
                )}

                {/* Parameter Findings Table */}
                <h4 style={{ margin: '0 0 8px', fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8' }}>
                  🧪 Verified Analytes & Reference Intervals ({activeOrder.results?.length || 0} Parameters):
                </h4>
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#070C16', color: '#94A3B8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                        <th style={{ padding: '6px 10px' }}>PARAMETER</th>
                        <th style={{ padding: '6px 10px', textAlign: 'center' }}>VALUE</th>
                        <th style={{ padding: '6px 10px', textAlign: 'center' }}>UNITS</th>
                        <th style={{ padding: '6px 10px', textAlign: 'center' }}>REFERENCE INTERVAL</th>
                        <th style={{ padding: '6px 10px', textAlign: 'center' }}>FLAG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrder.results?.map((res, i) => {
                        const isAbn = res.abnormalFlag !== 'NORMAL';
                        const isCr = res.isCritical || res.abnormalFlag === 'CRITICAL_HIGH' || res.abnormalFlag === 'CRITICAL_LOW';
                        return (
                          <tr key={res.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: isCr ? '#7F1D1D25' : isAbn ? '#FEF2F215' : 'transparent' }}>
                            <td style={{ padding: '6px 10px', color: '#F8FAFC', fontWeight: 600 }}>{res.parameterName}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800, color: isCr ? '#F87171' : isAbn ? '#FBBF24' : '#38BDF8' }}>{res.resultValue}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', color: '#94A3B8' }}>{res.unit || '-'}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', color: '#CBD5E1' }}>{res.referenceRange || '-'}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                              {isCr ? (
                                <span style={{ color: '#F87171', fontWeight: 900 }}>🚨 CRIT</span>
                              ) : isAbn ? (
                                <span style={{ color: '#FBBF24', fontWeight: 800 }}>▲ {res.abnormalFlag}</span>
                              ) : (
                                <span style={{ color: '#34D399', fontWeight: 700 }}>Normal</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Impression / Remarks */}
                {activeOrder.report?.impression && (
                  <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '10px 12px', fontSize: '0.75rem', borderLeft: '3px solid #0284C7' }}>
                    <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '2px' }}>Pathologist Impression / Clinical Notes:</strong>
                    <span style={{ color: '#CBD5E1' }}>{activeOrder.report.impression}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                Select a report from the register to view its audit details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
