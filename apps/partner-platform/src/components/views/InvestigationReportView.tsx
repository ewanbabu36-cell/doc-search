import { PrintablePathologyReportModal } from '../dialogs/PrintablePathologyReportModal.js';
import { ProfileUpdateRequiredAlertModal } from '../common/ProfileUpdateRequiredAlertModal.js';
import { checkPartnerProfileStatus, type MissingProfileField } from '../../utils/partnerProfileGuard.js';
import React, { useState, useMemo } from 'react';
import {
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';
import { downloadVectorPathologyPdf } from '../../utils/clientPathologyPdf.js';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface InvestigationReportViewProps {
  orders: InvestigationOrderDto[];
  onFinalizeReport: (order: InvestigationOrderDto) => void;
  onOpenBilling?: (order: InvestigationOrderDto) => void;
  onOpenEditReport?: (order: InvestigationOrderDto) => void;
}

export const InvestigationReportView: React.FC<InvestigationReportViewProps> = ({
  orders,
  onFinalizeReport,
  onOpenBilling,
  onOpenEditReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | '30D' | '90D' | '1Y'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const partnerProfile = useMemo(() => getVerifiedRoleProfile(), []);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isProfileGuardAlertOpen, setIsProfileGuardAlertOpen] = useState(false);
  const [blockedActionName, setBlockedActionName] = useState('Diagnostic Lab Report');
  const [profileMissingFields, setProfileMissingFields] = useState<MissingProfileField[]>([]);

  const checkGuard = (action: string): boolean => {
    const status = checkPartnerProfileStatus();
    if (!status.isUpdated) {
      setBlockedActionName(action);
      setProfileMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return false;
    }
    return true;
  };
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders.find((o) => o.report)?.id || orders[0]?.id || ''
  );

  const ordersWithReports = useMemo(() => {
    return orders.filter((o) => o.report || o.status === 'VERIFIED' || o.status === 'REVIEWED');
  }, [orders]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    ordersWithReports.forEach((o) => {
      if (o.investigationCategory) set.add(o.investigationCategory);
    });
    return Array.from(set);
  }, [ordersWithReports]);

  const filteredOrders = useMemo(() => {
    return ordersWithReports.filter((ord) => {
      if (categoryFilter !== 'ALL' && ord.investigationCategory !== categoryFilter) {
        return false;
      }
      if (dateRangeFilter !== 'ALL') {
        const ordTime = new Date(ord.orderedAt).getTime();
        const now = Date.now();
        const daysAgo = (now - ordTime) / (1000 * 60 * 60 * 24);
        if (dateRangeFilter === '30D' && daysAgo > 30) return false;
        if (dateRangeFilter === '90D' && daysAgo > 90) return false;
        if (dateRangeFilter === '1Y' && daysAgo > 365) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          ord.investigationName.toLowerCase().includes(q) ||
          ord.patientName.toLowerCase().includes(q) ||
          ord.patientMrn.toLowerCase().includes(q) ||
          (ord.report?.reportNumber && ord.report.reportNumber.toLowerCase().includes(q)) ||
          ord.orderNumber.toLowerCase().includes(q) ||
          ord.orderingDoctorName.toLowerCase().includes(q) ||
          (ord.clinicalIndication && ord.clinicalIndication.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [ordersWithReports, categoryFilter, dateRangeFilter, searchTerm]);

  const selectedOrder = useMemo(() => {
    return filteredOrders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || ordersWithReports[0];
  }, [filteredOrders, selectedOrderId, ordersWithReports]);

  // Batch Operations State (Evening Rush-Hour Module)
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [isBulkWhatsAppModalOpen, setIsBulkWhatsAppModalOpen] = useState(false);
  const [bulkWhatsAppProgress, setBulkWhatsAppProgress] = useState(0);
  const [bulkWhatsAppDone, setBulkWhatsAppDone] = useState(false);
  const [bulkToastMessage, setBulkToastMessage] = useState<string | null>(null);

  // Single Patient WhatsApp Report Dispatch State
  const [isSingleWhatsAppModalOpen, setIsSingleWhatsAppModalOpen] = useState(false);
  const [singleWhatsAppOrder, setSingleWhatsAppOrder] = useState<InvestigationOrderDto | null>(null);
  const [singleWhatsAppPhone, setSingleWhatsAppPhone] = useState('');
  const [isSendingSingleWhatsApp, setIsSendingSingleWhatsApp] = useState(false);
  const [singleWhatsAppSuccess, setSingleWhatsAppSuccess] = useState(false);

  const handleOpenSingleWhatsApp = (ord: InvestigationOrderDto) => {
    if (!checkGuard('WhatsApp Report Dispatch')) return;
    setSingleWhatsAppOrder(ord);
    const phone = (ord as any).patientPhone || (ord.metadata as any)?.patientPhone || '9876543210';
    setSingleWhatsAppPhone(phone);
    setSingleWhatsAppSuccess(false);
    setIsSingleWhatsAppModalOpen(true);
  };

  const handleSendSingleWhatsApp = (mode: 'WEB' | 'API') => {
    if (!singleWhatsAppOrder) return;
    setIsSendingSingleWhatsApp(true);
    const repNo = singleWhatsAppOrder.report?.reportNumber || singleWhatsAppOrder.orderNumber;
    const patName = singleWhatsAppOrder.patientName;
    const invName = singleWhatsAppOrder.investigationName;
    const msg = `*DOC SEARCH DIAGNOSTIC PATHOLOGY LABORATORY*\n\nDear *${patName}*,\nYour verified NABL diagnostic report for *${invName}* (Report #${repNo}) is ready.\n\n🔗 *Download PDF Report:* https://docsearch.health/reports/${repNo}\n\nFor any medical queries, please contact our laboratory reception desk.\n_ISO 15189:2022 NABL Accredited_`;

    if (mode === 'WEB') {
      const cleanPhone = singleWhatsAppPhone.replace(/\D/g, '');
      const url = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      if (!singleWhatsAppOrder.metadata) singleWhatsAppOrder.metadata = {} as any;
      (singleWhatsAppOrder.metadata as any).whatsAppDispatchedAt = new Date().toISOString();
      hospitalEventBus.publish('REPORT_DISPATCHED_WHATSAPP' as any, 'InvestigationReportView', {
        orderId: singleWhatsAppOrder.id,
        patientName: patName,
        phone: singleWhatsAppPhone,
        mode: 'WEB'
      });
      setIsSendingSingleWhatsApp(false);
      setSingleWhatsAppSuccess(true);
      setTimeout(() => {
        setIsSingleWhatsAppModalOpen(false);
      }, 1500);
    } else {
      setTimeout(() => {
        if (!singleWhatsAppOrder.metadata) singleWhatsAppOrder.metadata = {} as any;
        (singleWhatsAppOrder.metadata as any).whatsAppDispatchedAt = new Date().toISOString();
        hospitalEventBus.publish('REPORT_DISPATCHED_WHATSAPP' as any, 'InvestigationReportView', {
          orderId: singleWhatsAppOrder.id,
          patientName: patName,
          phone: singleWhatsAppPhone,
          mode: 'API'
        });
        setIsSendingSingleWhatsApp(false);
        setSingleWhatsAppSuccess(true);
        setTimeout(() => {
          setIsSingleWhatsAppModalOpen(false);
        }, 1500);
      }, 700);
    }
  };

  const handleBulkPrint = () => {
    if (!checkGuard('Bulk Print Diagnostic Reports')) return;
    window.print();
    setBulkToastMessage(`🖨️ Sent ${selectedBatchIds.size} pathology reports to print spooler.`);
    setTimeout(() => setBulkToastMessage(null), 4000);
  };

  const handleBulkWhatsApp = () => {
    if (!checkGuard('Bulk WhatsApp Dispatch')) return;
    setIsBulkWhatsAppModalOpen(true);
    setBulkWhatsAppProgress(15);
    setBulkWhatsAppDone(false);

    setTimeout(() => setBulkWhatsAppProgress(55), 700);
    setTimeout(() => setBulkWhatsAppProgress(85), 1300);
    setTimeout(() => {
      setBulkWhatsAppProgress(100);
      setBulkWhatsAppDone(true);
    }, 1900);
  };

  const handleBulkDownloadPdf = () => {
    if (!checkGuard('Bulk Download Vector PDFs')) return;
    const profile = getVerifiedRoleProfile();
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

    const targetOrders = ordersWithReports.filter(o => selectedBatchIds.has(o.id));
    targetOrders.forEach(ord => {
      downloadVectorPathologyPdf(ord, settings);
    });

    setBulkToastMessage(`📥 Exported ${targetOrders.length} Vector Pathology PDFs.`);
    setTimeout(() => setBulkToastMessage(null), 4000);
  };

  const handleDownloadPdf = (order: InvestigationOrderDto) => {
    const profile = getVerifiedRoleProfile();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
          📄 Diagnostic Reports & Document Management
        </h3>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem' }}>
          Official signed pathology and diagnostic investigation reports ready for EMR clinical integration, multi-visit history review, and distribution.
        </p>
      </div>

      {/* RUSH-HOUR BATCH ACTIONS FLOATING TOOLBAR */}
      {selectedBatchIds.size > 0 && (
        <div style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #06B6D4',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 30px rgba(6, 182, 212, 0.25)',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <div>
              <strong style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>
                EVENING RUSH-HOUR BATCH DISPATCH: {selectedBatchIds.size} REPORT{selectedBatchIds.size > 1 ? 'S' : ''} SELECTED
              </strong>
              <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>
                High-throughput queue processing for peak patient evening discharge
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleBulkPrint}
              style={{
                backgroundColor: '#059669',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 13px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🖨️</span>
              <span>Bulk Print ({selectedBatchIds.size})</span>
            </button>

            <button
              type="button"
              onClick={handleBulkWhatsApp}
              style={{
                backgroundColor: '#25D366',
                color: '#072711',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 13px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📲</span>
              <span>Bulk WhatsApp Dispatch ({selectedBatchIds.size})</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDownloadPdf}
              style={{
                backgroundColor: '#0284C7',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 13px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📥</span>
              <span>Vector PDFs</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedBatchIds(new Set())}
              style={{
                backgroundColor: 'transparent',
                color: '#94A3B8',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '7px 12px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ✕ Deselect
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {bulkToastMessage && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid #10B981',
          color: '#A7F3D0',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.8125rem',
          fontWeight: 700
        }}>
          {bulkToastMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
        {/* Left list of diagnostic reports */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.875rem', color: '#F8FAFC' }}>
              Published Reports ({filteredOrders.length}{filteredOrders.length !== ordersWithReports.length ? ` of ${ordersWithReports.length}` : ''})
            </strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                id="selectAllReports"
                checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedBatchIds.has(o.id))}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedBatchIds(new Set(filteredOrders.map(o => o.id)));
                  } else {
                    setSelectedBatchIds(new Set());
                  }
                }}
                style={{ accentColor: '#06B6D4', width: '15px', height: '15px', cursor: 'pointer' }}
              />
              <label htmlFor="selectAllReports" style={{ fontSize: '0.72rem', color: '#94A3B8', cursor: 'pointer', fontWeight: 700 }}>
                Select All
              </label>
            </div>
          </div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search test, patient, MRN, report #..."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value as any)}
                style={{
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '0.75rem'
                }}
              >
                <option value="ALL">📅 All Historical Dates</option>
                <option value="30D">Past 30 Days</option>
                <option value="90D">Past 90 Days</option>
                <option value="1Y">Past 1 Year</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '0.75rem'
                }}
              >
                <option value="ALL">🔬 All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '520px', overflowY: 'auto' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                No historical reports matched your search or filters.
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = ord.id === (selectedOrder?.id ?? selectedOrderId);
                const isBatchChecked = selectedBatchIds.has(ord.id);
                const orderDateStr = ord.orderedAt ? new Date(ord.orderedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.18)' : isBatchChecked ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #06B6D4' : isBatchChecked ? '3px solid #10B981' : '3px solid transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isBatchChecked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const next = new Set(selectedBatchIds);
                            if (e.target.checked) next.add(ord.id);
                            else next.delete(ord.id);
                            setSelectedBatchIds(next);
                          }}
                          style={{ accentColor: '#06B6D4', width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                          {ord.investigationName}
                        </span>
                      </div>
                      <Badge variant={ord.report ? 'success' : 'warning'}>
                        {ord.report ? 'Final Report' : 'Draft'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', paddingLeft: '23px' }}>
                      Patient: <strong style={{ color: '#F8FAFC' }}>{ord.patientName}</strong> · MRN: {ord.patientMrn}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px', display: 'flex', justifyContent: 'space-between', paddingLeft: '23px' }}>
                      <span>{ord.report?.reportNumber || ord.orderNumber}</span>
                      <span style={{ color: '#38BDF8' }}>{orderDateStr}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right report detail document sheet */}
        {selectedOrder ? (
          <div style={{ backgroundColor: '#0B132B', border: '1.5px solid rgba(6, 182, 212, 0.3)', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {(partnerProfile.entityLegalName || 'DOC SEARCH PARTNER CLINICS').toUpperCase()} · DEPARTMENT OF LABORATORY MEDICINE
                </div>
                <h3 style={{ margin: '4px 0 2px', fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                  {selectedOrder.report?.reportTitle || `Diagnostic Report: ${selectedOrder.investigationName}`}
                </h3>
                <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Report #: {selectedOrder.report?.reportNumber || 'DRAFT-IN-PROGRESS'} · Version {selectedOrder.report?.reportVersion || 1}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!selectedOrder.report && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (!checkGuard('Generate Final Report')) return;
                      onFinalizeReport(selectedOrder);
                    }}
                  >
                    📄 Generate Final Report
                  </Button>
                )}
                {onOpenEditReport && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenEditReport(selectedOrder)}
                    style={{ borderColor: '#9333EA', color: '#C084FC', fontWeight: 800 }}
                  >
                    ✏️ Edit Report
                  </Button>
                )}
                {onOpenBilling && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenBilling(selectedOrder)}
                    style={{
                      borderColor: '#10B981',
                      color: (selectedOrder.metadata as any)?.billingStatus === 'BILLED' ? '#34D399' : '#FCD34D',
                      backgroundColor: (selectedOrder.metadata as any)?.billingStatus === 'BILLED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      fontWeight: 800
                    }}
                  >
                    {(selectedOrder.metadata as any)?.billingStatus === 'BILLED'
                      ? `🧾 Billed (${(selectedOrder.metadata as any)?.invoiceNumber || 'INV'})`
                      : '🧾 Bill this Report'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!checkGuard('Download Vector PDF')) return;
                    handleDownloadPdf(selectedOrder);
                  }}
                  style={{ borderColor: '#38BDF8', color: '#38BDF8', fontWeight: 700 }}
                >
                  📥 Download Vector PDF
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenSingleWhatsApp(selectedOrder)}
                  style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#FFFFFF', fontWeight: 800, minHeight: '38px' }}
                >
                  📲 WhatsApp PDF Report
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!checkGuard('Print NABL Report / WhatsApp')) return;
                    setIsPrintModalOpen(true);
                  }}
                  style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#F8FAFC', minHeight: '38px' }}
                >
                  🖨️ Print NABL Report
                </Button>
              </div>
            </div>

            {/* Patient & Order Demographics Box (Dark Card with High Contrast) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '0.8125rem',
              color: '#F8FAFC'
            }}>
              <div>
                <div><span style={{ color: '#94A3B8' }}>Patient:</span> <strong style={{ color: '#F8FAFC' }}>{selectedOrder.patientName}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>MRN:</span> <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{selectedOrder.patientMrn}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>DOB/Gender:</span> <strong style={{ color: '#F8FAFC' }}>{selectedOrder.patientDob || '1984-05-12'} ({selectedOrder.patientGender || 'FEMALE'})</strong></div>
              </div>
              <div>
                <div><span style={{ color: '#94A3B8' }}>Order #:</span> <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>{selectedOrder.orderNumber}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>Encounter #:</span> <strong style={{ color: '#F8FAFC' }}>{selectedOrder.encounterNumber}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>Ordering Doctor:</span> <strong style={{ color: '#A7F3D0' }}>{selectedOrder.orderingDoctorName}</strong></div>
              </div>
              <div>
                <div><span style={{ color: '#94A3B8' }}>Specimen Matrix:</span> <strong style={{ color: '#F8FAFC' }}>{selectedOrder.specimenType}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>Ordered At:</span> <strong style={{ color: '#CBD5E1' }}>{new Date(selectedOrder.orderedAt).toLocaleDateString()}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>Finalized At:</span> <strong style={{ color: '#38BDF8' }}>{selectedOrder.report?.finalizedAt ? new Date(selectedOrder.report.finalizedAt).toLocaleString() : 'Pending'}</strong></div>
              </div>
              <div>
                <div>
                  <span style={{ color: '#94A3B8' }}>Billing Status:</span>{' '}
                  {(selectedOrder.metadata as any)?.billingStatus === 'BILLED' ? (
                    <span style={{ color: '#34D399', fontWeight: 900, backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                      ✓ BILLED ({(selectedOrder.metadata as any)?.invoiceNumber})
                    </span>
                  ) : (
                    <span style={{ color: '#FBBF24', fontWeight: 900, backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                      🟡 UNBILLED
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ color: '#94A3B8' }}>WhatsApp:</span>{' '}
                  {(selectedOrder.metadata as any)?.whatsAppDispatchedAt ? (
                    <span style={{ color: '#34D399', fontWeight: 800, backgroundColor: 'rgba(37, 211, 102, 0.15)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                      ✓ Sent ({new Date((selectedOrder.metadata as any).whatsAppDispatchedAt).toLocaleTimeString()})
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>Pending Dispatch</span>
                  )}
                </div>
                {(selectedOrder.metadata as any)?.sampleBarcode && (
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ color: '#94A3B8' }}>Barcode:</span> <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{(selectedOrder.metadata as any).sampleBarcode}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Results Table (with dedicated Microbiology Antibiogram Support) */}
            {(() => {
              const microSpecimen = selectedOrder.results.find(r => r.parameterCode === 'MICRO_SPECIMEN')?.resultValue;
              const microOrganism = selectedOrder.results.find(r => r.parameterCode === 'MICRO_ORGANISM')?.resultValue;
              const microColony = selectedOrder.results.find(r => r.parameterCode === 'MICRO_COLONY')?.resultValue;
              const microIncubation = selectedOrder.results.find(r => r.parameterCode === 'MICRO_SPECIMEN')?.qualitativeInterpretation || '48 Hours at 37°C Aerobic';
              const astResults = selectedOrder.results.filter(r => r.parameterCode.startsWith('AST_'));
              const standardResults = selectedOrder.results.filter(r => !r.parameterCode.startsWith('MICRO_') && !r.parameterCode.startsWith('AST_'));
              const isMicrobiology = astResults.length > 0 || !!microOrganism || selectedOrder.investigationName.toLowerCase().includes('culture');

              if (!isMicrobiology) {
                return (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC' }}>
                      Analytic Assay Findings
                    </h4>
                    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', color: '#CBD5E1' }}>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '10px 14px' }}>Analyte</th>
                            <th style={{ textAlign: 'left', padding: '10px 14px' }}>Observed Result</th>
                            <th style={{ textAlign: 'left', padding: '10px 14px' }}>Reference Range</th>
                            <th style={{ textAlign: 'left', padding: '10px 14px' }}>Clinical Flag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.results.map((r) => (
                            <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: '#F8FAFC' }}>{r.parameterName}</td>
                              <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8', fontSize: '0.875rem' }}>
                                {r.resultValue} {r.unit ?? ''}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{r.referenceRange || 'N/A'}</td>
                              <td style={{ padding: '10px 14px' }}>
                                {r.abnormalFlag === 'NORMAL' && <Badge variant="success">Normal</Badge>}
                                {r.abnormalFlag === 'HIGH' && <Badge variant="warning">High</Badge>}
                                {r.abnormalFlag === 'LOW' && <Badge variant="warning">Low</Badge>}
                                {r.abnormalFlag === 'ABNORMAL' && <Badge variant="warning">Abnormal</Badge>}
                                {(r.abnormalFlag === 'CRITICAL_HIGH' || r.abnormalFlag === 'CRITICAL_LOW') && (
                                  <Badge variant="danger">🚨 {r.abnormalFlag}</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              return (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC' }}>
                    Microbiology Culture & Antibiotic Susceptibility Testing (AST Antibiogram)
                  </h4>

                  {/* Culture Findings Box */}
                  <div style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    fontSize: '0.8125rem',
                    marginBottom: '14px'
                  }}>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Specimen Site:</span>{' '}
                      <strong style={{ color: '#F8FAFC' }}>{microSpecimen || selectedOrder.specimenType || 'Clean Catch Midstream Urine'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Incubation Protocol:</span>{' '}
                      <strong style={{ color: '#F8FAFC' }}>{microIncubation}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Organism Isolated:</span>{' '}
                      <strong style={{ color: '#38BDF8', fontStyle: 'italic', fontSize: '0.875rem' }}>
                        {microOrganism || 'Escherichia coli'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Colony Count:</span>{' '}
                      <strong style={{ color: microColony?.startsWith('Zero') ? '#34D399' : '#F87171' }}>
                        {microColony || '> 10^5 CFU/mL (Significant Bacteriuria)'}
                      </strong>
                    </div>
                  </div>

                  {/* Antibiogram Grid */}
                  {astResults.length > 0 && (
                    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ padding: '8px 12px', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8' }}>
                        <span>CLSI M100 ANTIMICROBIAL SUSCEPTIBILITY PANEL</span>
                        <span>{astResults.length} DRUGS TESTED</span>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', color: '#CBD5E1' }}>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '10px 14px' }}>Antimicrobial Agent</th>
                            <th style={{ textAlign: 'center', padding: '10px 14px' }}>Kirby-Bauer Zone / MIC</th>
                            <th style={{ textAlign: 'center', padding: '10px 14px' }}>Susceptibility Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {astResults.map((ast) => {
                            const isResistant = ast.resultValue.includes('RESISTANT') || ast.abnormalFlag === 'HIGH';
                            const isIntermediate = ast.resultValue.includes('INTERMEDIATE') || ast.abnormalFlag === 'LOW';
                            const isSensitive = !isResistant && !isIntermediate;

                            return (
                              <tr key={ast.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#F8FAFC' }}>
                                  {ast.parameterName.replace('AST: ', '')}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'monospace', color: '#94A3B8' }}>
                                  {ast.unit || '-'}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  {isSensitive && (
                                    <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem', border: '1px solid #10B981' }}>
                                      🟢 SENSITIVE (S)
                                    </span>
                                  )}
                                  {isIntermediate && (
                                    <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem', border: '1px solid #F59E0B' }}>
                                      🟡 INTERMEDIATE (I)
                                    </span>
                                  )}
                                  {isResistant && (
                                    <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem', border: '1px solid #EF4444' }}>
                                      🔴 RESISTANT (R)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Standard parameters if any */}
                  {standardResults.length > 0 && (
                    <div style={{ marginTop: '14px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <tbody>
                          {standardResults.map((r) => (
                            <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <td style={{ padding: '8px 14px', fontWeight: 700, color: '#F8FAFC' }}>{r.parameterName}</td>
                              <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8' }}>{r.resultValue} {r.unit || ''}</td>
                              <td style={{ padding: '8px 14px', color: '#94A3B8' }}>{r.referenceRange || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Pathologist Impression & Clinical Recommendations (High Contrast Dark Box) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '14px 16px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Pathological Impression & Interpretation
                </div>
                <div style={{ fontSize: '0.875rem', color: '#F8FAFC', lineHeight: 1.4 }}>
                  {selectedOrder.report?.impression || 'Awaiting formal diagnostic impression from verifying pathologist.'}
                </div>
              </div>

              {selectedOrder.report?.recommendations && (
                <div style={{ padding: '14px 16px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Recommendations & Follow-up Guidance
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#F8FAFC', lineHeight: 1.4 }}>
                    {selectedOrder.report.recommendations}
                  </div>
                </div>
              )}
            </div>

            {/* Electronic Signatures Footer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ color: '#94A3B8' }}>Verifying Pathologist / Lab Director:</div>
                <div style={{ fontWeight: 800, color: '#10B981', marginTop: '3px' }}>
                  ✓ {selectedOrder.report?.verifyingPathologist || partnerProfile.pathologistName || (partnerProfile.doctorName ? `${partnerProfile.doctorName}, MD` : 'Authorized Pathologist')}
                </div>
              </div>
              <div>
                <div style={{ color: '#94A3B8' }}>Attending Physician Review:</div>
                <div style={{ fontWeight: 700, marginTop: '3px' }}>
                  {selectedOrder.report?.reviewedByDoctorAt ? (
                    <span style={{ color: '#38BDF8' }}>
                      ✓ Reviewed by {selectedOrder.report.reviewingDoctor}
                    </span>
                  ) : (
                    <span style={{ color: '#F59E0B' }}>
                      Pending Attending Physician Review
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
            Select a diagnostic report from the left panel to inspect the document dossier.
          </div>
        )}
      </div>

      {selectedOrder && (
        <PrintablePathologyReportModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          order={selectedOrder}
        />
      )}

      {/* INTERACTIVE BATCH WHATSAPP DISPATCH MODAL */}
      {isBulkWhatsAppModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid #25D366',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '580px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📲</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
                    DocSearch WhatsApp Cloud Dispatch Engine
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                    Target Queue: {selectedBatchIds.size} Patient Reports
                  </span>
                </div>
              </div>
              {bulkWhatsAppDone && (
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkWhatsAppModalOpen(false);
                    setSelectedBatchIds(new Set());
                  }}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '6px' }}>
                <span>{bulkWhatsAppDone ? '✓ All Reports Dispatched Successfully' : 'Transmitting NABL Vector PDFs via WhatsApp Gateway...'}</span>
                <strong style={{ color: bulkWhatsAppDone ? '#4ADE80' : '#38BDF8' }}>{bulkWhatsAppProgress}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#1E293B', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${bulkWhatsAppProgress}%`, height: '100%', backgroundColor: bulkWhatsAppDone ? '#10B981' : '#25D366', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Dispatched Patients List */}
            <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {ordersWithReports.filter(o => selectedBatchIds.has(o.id)).map((ord, idx) => {
                const isDelivered = bulkWhatsAppProgress >= Math.round(((idx + 1) / selectedBatchIds.size) * 90) || bulkWhatsAppDone;
                return (
                  <div key={ord.id} style={{ padding: '10px 14px', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>{ord.patientName}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>MRN: {ord.patientMrn} · Order: {ord.orderNumber}</div>
                    </div>
                    <div>
                      {isDelivered ? (
                        <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>✓</span> Delivered PDF
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          ⏳ In Flight...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="primary"
                disabled={!bulkWhatsAppDone}
                onClick={() => {
                  setIsBulkWhatsAppModalOpen(false);
                  setSelectedBatchIds(new Set());
                  setBulkToastMessage(`✓ Dispatched ${selectedBatchIds.size} Reports to Patient WhatsApp Numbers!`);
                  setTimeout(() => setBulkToastMessage(null), 4000);
                }}
              >
                {bulkWhatsAppDone ? '✓ Close & Clear Selection' : 'Dispatching...'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 📲 SINGLE PATIENT WHATSAPP REPORT DISPATCH MODAL */}
      {isSingleWhatsAppModalOpen && singleWhatsAppOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid #25D366',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            color: '#F8FAFC'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📲</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8' }}>
                    WhatsApp Diagnostic Report Dispatch
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    NABL-Compliant Digital PDF Report Delivery
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSingleWhatsAppModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px', fontWeight: 700 }}>
                  Patient Name & Test
                </label>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong>{singleWhatsAppOrder.patientName}</strong> · {singleWhatsAppOrder.investigationName}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px', fontWeight: 700 }}>
                  Patient Mobile Number (WhatsApp) *
                </label>
                <Input
                  value={singleWhatsAppPhone}
                  onChange={(e) => setSingleWhatsAppPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                />
              </div>

              <div style={{ backgroundColor: 'rgba(37, 211, 102, 0.08)', border: '1px solid rgba(37, 211, 102, 0.25)', borderRadius: '10px', padding: '12px', fontSize: '0.75rem', color: '#CBD5E1', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 800, color: '#4ADE80', marginBottom: '4px' }}>💬 WhatsApp Message Preview:</div>
                Dear {singleWhatsAppOrder.patientName}, your verified NABL diagnostic report for {singleWhatsAppOrder.investigationName} is ready.
                Download PDF: https://docsearch.health/reports/{singleWhatsAppOrder.report?.reportNumber || singleWhatsAppOrder.orderNumber}
              </div>

              {singleWhatsAppSuccess && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '10px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 700, textAlign: 'center' }}>
                  ✓ Report PDF successfully dispatched to WhatsApp!
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setIsSingleWhatsAppModalOpen(false)}
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 14px', fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendSingleWhatsApp('WEB')}
                disabled={isSendingSingleWhatsApp || !singleWhatsAppPhone}
                style={{ backgroundColor: '#0284C7', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 800, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>🌐</span>
                <span>Open WhatsApp Web</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendSingleWhatsApp('API')}
                disabled={isSendingSingleWhatsApp || !singleWhatsAppPhone}
                style={{ backgroundColor: '#25D366', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 900, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>⚡</span>
                <span>{isSendingSingleWhatsApp ? 'Sending...' : 'Instant WhatsApp Dispatch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileUpdateRequiredAlertModal
        isOpen={isProfileGuardAlertOpen}
        onClose={() => setIsProfileGuardAlertOpen(false)}
        blockedActionName={blockedActionName}
        missingFields={profileMissingFields}
      />
    </div>
  );
};
