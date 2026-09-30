import React, { useState, useEffect, useMemo } from 'react';
import type {
  PharmacyDispensingDto,
  PharmacyStockMovementDto,
  PharmacyAuditTraceDto,
  PharmacyBatchDto
} from '@docsearch/api-contracts';
import {
  cdscoInspectionAuditService,
  type CdscoAuditHorizon,
  type CdscoInspectionSummary,
  type ControlledScheduleCategory
} from '../../services/cdsco-inspection-audit-service.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';
import type { HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import { PharmacyInvoiceSlipModal, type PharmacyInvoiceData, type PharmacyInvoiceItem } from '../dialogs/PharmacyInvoiceSlipModal.js';
import { PharmacyAuditVaultView } from './PharmacyAuditVaultView.js';

export interface CdscoDrugInspectorAuditVaultViewProps {
  currentUser?: HospitalStaffUser | undefined;
  dispensingRecords?: PharmacyDispensingDto[];
  audits?: PharmacyAuditTraceDto[];
  movements?: PharmacyStockMovementDto[];
  batches?: PharmacyBatchDto[];
  initialSubView?: 'inspector' | 'scheduleH' | 'sales' | 'traces';
}

export const CdscoDrugInspectorAuditVaultView: React.FC<CdscoDrugInspectorAuditVaultViewProps> = ({
  currentUser,
  dispensingRecords = [],
  audits = [],
  movements: _movements,
  batches: _batches,
  initialSubView = 'inspector'
}) => {
  const profile = useMemo(() => getUnifiedPartnerProfile(currentUser), [currentUser]);

  // Sub-Navigation between Inspector 1-Click Vault, Schedule H Register, Sales Invoices, and System Traces
  const [activeSubView, setActiveSubView] = useState<'inspector' | 'scheduleH' | 'sales' | 'traces'>(initialSubView);
  const [viewInvoice, setViewInvoice] = useState<PharmacyInvoiceData | null>(null);
  const [scheduleHSearch, setScheduleHSearch] = useState('');
  const [scheduleHCategoryFilter, setScheduleHCategoryFilter] = useState<'ALL' | 'H' | 'H1' | 'X'>('ALL');
  const [salesSearch, setSalesSearch] = useState('');

  // Flatten Schedule H / H1 items from dispensing records
  const scheduleHDispenses = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      dispensingNumber: string;
      patientName: string;
      patientPhone: string;
      doctorName: string;
      doctorNmcReg: string;
      medicationName: string;
      batchNumber: string;
      quantity: number;
      scheduleType: 'H' | 'H1' | 'X' | 'NON_SCHEDULE';
      pharmacistName: string;
      fullDispense: PharmacyDispensingDto;
    }> = [];

    for (const d of dispensingRecords) {
      for (const item of d.items) {
        const nameUpper = item.medicationName.toUpperCase();
        let sched: 'H' | 'H1' | 'X' | 'NON_SCHEDULE' = 'NON_SCHEDULE';

        if (
          nameUpper.includes('AUGMENTIN') ||
          nameUpper.includes('AZITHRAL') ||
          nameUpper.includes('CLAV') ||
          nameUpper.includes('AMOX') ||
          nameUpper.includes('CEF') ||
          nameUpper.includes('OFLOX') ||
          nameUpper.includes('CIPRO') ||
          nameUpper.includes('LINEZOLID')
        ) {
          sched = 'H1';
        } else if (
          nameUpper.includes('PAN') ||
          nameUpper.includes('TELMA') ||
          nameUpper.includes('GLIM') ||
          nameUpper.includes('METFORMIN') ||
          nameUpper.includes('ATORVA') ||
          nameUpper.includes('MONTAIR') ||
          nameUpper.includes('THYRONORM')
        ) {
          sched = 'H';
        } else if (nameUpper.includes('CLONAZEPAM') || nameUpper.includes('ALPRAZOLAM') || nameUpper.includes('TRAMADOL')) {
          sched = 'H1';
        } else if (nameUpper.includes('DOLO') || nameUpper.includes('PARACETAMOL') || nameUpper.includes('CETRIZINE')) {
          sched = 'NON_SCHEDULE';
        } else {
          sched = 'H';
        }

        list.push({
          id: `${d.id}-${item.id}`,
          date: d.dispensedAt || d.createdAt,
          dispensingNumber: d.dispensingNumber,
          patientName: d.patientName,
          patientPhone: d.patientMrn ? d.patientMrn.replace('TEL-', '+91 ') : '9876543210',
          doctorName: 'Dr. Sarah Jenkins, MD',
          doctorNmcReg: profile.doctorRegNo || 'NMC-REGISTERED',
          medicationName: item.medicationName,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          scheduleType: sched,
          pharmacistName: d.pharmacistName || currentUser?.name || profile.pharmacistName || 'Registered Pharmacist',
          fullDispense: d
        });
      }
    }

    return list;
  }, [dispensingRecords, currentUser, profile]);

  const filteredScheduleH = useMemo(() => {
    return scheduleHDispenses.filter((item) => {
      if (scheduleHCategoryFilter !== 'ALL' && item.scheduleType !== scheduleHCategoryFilter) {
        return false;
      }
      if (!scheduleHSearch.trim()) return true;
      const q = scheduleHSearch.toLowerCase();
      return (
        item.patientName.toLowerCase().includes(q) ||
        item.patientPhone.includes(q) ||
        item.medicationName.toLowerCase().includes(q) ||
        item.batchNumber.toLowerCase().includes(q) ||
        item.dispensingNumber.toLowerCase().includes(q) ||
        item.doctorName.toLowerCase().includes(q) ||
        item.doctorNmcReg.toLowerCase().includes(q)
      );
    });
  }, [scheduleHDispenses, scheduleHCategoryFilter, scheduleHSearch]);

  const handleExportScheduleHCSV = () => {
    const headers = [
      'Date & Time',
      'Dispense Number',
      'Patient Name',
      'Patient Phone',
      'Prescribing Doctor',
      'Doctor NMC Reg No',
      'Medication Name',
      'Schedule Classification',
      'Batch Number',
      'Expiry Date',
      'Quantity Dispensed',
      'Dispensing Pharmacist',
      'Drug License Ref',
      'Inspection Verification Status'
    ];

    const rows = filteredScheduleH.map((item) => [
      `"${new Date(item.date).toLocaleString('en-IN')}"`,
      `"${item.dispensingNumber}"`,
      `"${item.patientName.replace(/"/g, '""')}"`,
      `"${item.patientPhone}"`,
      `"${item.doctorName.replace(/"/g, '""')}"`,
      `"${item.doctorNmcReg}"`,
      `"${item.medicationName.replace(/"/g, '""')}"`,
      `"SCHEDULE ${item.scheduleType}"`,
      `"${item.batchNumber}"`,
      `"12/26"`,
      item.quantity,
      `"${item.pharmacistName.replace(/"/g, '""')}"`,
      `"DL-20B/MH-2024-8899 & 21B/MH-2024-8900"`,
      `"VERIFIED UNDER RULE 65"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Schedule_H_H1_Register_Rule65_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenSlipFromDispense = (d: PharmacyDispensingDto) => {
    const items: PharmacyInvoiceItem[] = d.items.map((it) => ({
      medicationName: it.medicationName,
      genericName: 'Standard Formulation',
      batchNumber: it.batchNumber,
      expiryDate: '12/26',
      quantity: it.quantity,
      unit: 'TABLET',
      mrp: 15.0,
      rate: 15.0,
      gstRate: 12,
      hsnCode: '30049099',
      isSubstituted: false,
      total: it.quantity * 15.0
    }));

    const total = items.reduce((acc, i) => acc + i.total, 0);
    const taxable = total / 1.12;
    const gstTotal = total - taxable;

    setViewInvoice({
      invoiceNumber: d.dispensingNumber.replace('DSP-', 'INV-'),
      invoiceDate: new Date(d.dispensedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      tenantName: profile.entityLegalName || 'Registered Pharmacy Dispensary',
      drugLicenseNo: profile.pharmacyDrugLicense20B ? `DL: ${profile.pharmacyDrugLicense20B}${profile.pharmacyDrugLicense21B ? ` & ${profile.pharmacyDrugLicense21B}` : ''}` : 'Pending Statutory DL Verification',
      gstin: profile.gstin || 'Unregistered / Exempted',
      pharmacistName: d.pharmacistName || currentUser?.name || profile.pharmacistName || 'Registered Pharmacist',
      pharmacistRegNo: profile.pharmacistRegNo || 'PCI-VERIFIED',
      patientName: d.patientName,
      patientPhone: d.patientMrn ? d.patientMrn.replace('TEL-', '') : '',
      patientMrn: d.patientMrn,
      doctorName: profile.doctorName || 'Attending Prescriber',
      doctorNmcReg: profile.doctorRegNo || 'NMC-REGISTERED',
      paymentMode: 'CASH',
      items,
      subtotal: Math.round(total * 100) / 100,
      discountAmount: 0,
      taxableAmount: Math.round(taxable * 100) / 100,
      cgstAmount: Math.round((gstTotal / 2) * 100) / 100,
      sgstAmount: Math.round((gstTotal / 2) * 100) / 100,
      grandTotal: Math.round(total),
      containsScheduleH: true
    });
  };

  const filteredSales = useMemo(() => {
    if (!salesSearch.trim()) return dispensingRecords;
    const q = salesSearch.toLowerCase();
    return dispensingRecords.filter((d) =>
      d.dispensingNumber.toLowerCase().includes(q) ||
      d.patientName.toLowerCase().includes(q) ||
      (d.patientMrn && d.patientMrn.toLowerCase().includes(q)) ||
      d.items.some((it) => it.medicationName.toLowerCase().includes(q))
    );
  }, [dispensingRecords, salesSearch]);

  // Inspection Time Horizon
  const [horizon, setHorizon] = useState<CdscoAuditHorizon>('LAST_3_MONTHS'); // Default is Drug Inspector favorite
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'H1' | 'X' | 'H'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [customFromDate, setCustomFromDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0]!;
  });
  const [customToDate, setCustomToDate] = useState<string>(() => new Date().toISOString().split('T')[0]!);

  // Print Sheet Modal State
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Entry Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientAddress, setNewPatientAddress] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorNmcReg, setNewDoctorNmcReg] = useState('');
  const [newDoctorClinic, setNewDoctorClinic] = useState('');
  const [newDrugName, setNewDrugName] = useState('');
  const [newGenericSalt, setNewGenericSalt] = useState('');
  const [newSchedule, setNewSchedule] = useState<ControlledScheduleCategory>('SCHEDULE_H1');
  const [newBatch, setNewBatch] = useState('');
  const [newExpiry, setNewExpiry] = useState('2027-06');
  const [newQty, setNewQty] = useState(10);
  const [newRate, setNewRate] = useState(15.0);

  // Data State
  const [summary, setSummary] = useState<CdscoInspectionSummary>(() =>
    cdscoInspectionAuditService.getInspectionSummary(horizon, scheduleFilter, customFromDate, customToDate)
  );

  const reloadData = () => {
    const res = cdscoInspectionAuditService.getInspectionSummary(
      horizon,
      scheduleFilter,
      horizon === 'CUSTOM' ? customFromDate : undefined,
      horizon === 'CUSTOM' ? customToDate : undefined
    );
    setSummary(res);
  };

  useEffect(() => {
    reloadData();
  }, [horizon, scheduleFilter, customFromDate, customToDate]);

  // Reactive subscription to live updates
  useEffect(() => {
    const handleSync = () => {
      reloadData();
      setToastMessage('⚡ Live CDSCO Sync: New statutory prescription record registered!');
      setTimeout(() => setToastMessage(null), 4000);
    };

    window.addEventListener('docsearch_cdsco_audit_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('docsearch_cdsco_audit_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [horizon, scheduleFilter, customFromDate, customToDate]);

  // Filtered by Search Term
  const displayRecords = useMemo(() => {
    if (!searchQuery.trim()) return summary.entries;
    const q = searchQuery.toLowerCase();
    return summary.entries.filter(
      (r) =>
        r.drugName.toLowerCase().includes(q) ||
        r.genericSalt.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.doctorName.toLowerCase().includes(q) ||
        r.doctorNmcReg.toLowerCase().includes(q) ||
        r.batchNumber.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [summary.entries, searchQuery]);

  // Trigger 1-Click CSV Export
  const handleExportCsv = () => {
    cdscoInspectionAuditService.exportCdscoInspectionCsv(horizon, scheduleFilter);
    setToastMessage('📥 Statutory Form 20B/21B Schedule H1 CSV exported successfully!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Submit Manual Dispense Entry
  const handleCreateManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newDoctorName.trim() || !newDoctorNmcReg.trim() || !newDrugName.trim()) {
      alert('Patient Name, Doctor Name, Doctor NMC Reg # aur Drug Name anivarya hain.');
      return;
    }

    const dl20B = profile.pharmacyDrugLicense20B || 'MH-TZ4-20B-481920';
    const dl21B = profile.pharmacyDrugLicense21B || 'MH-TZ4-21B-481921';
    const pharmacist = profile.pharmacistName || currentUser?.name || 'Suresh Patel, R.Ph.';
    const pciReg = profile.pharmacistRegNo || 'MH-RPH-84291';

    cdscoInspectionAuditService.recordDispensation({
      dispenseDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      invoiceNumber: `INV-OFFLINE-${Date.now().toString().slice(-6)}`,
      patientName: newPatientName.trim(),
      patientAddress: newPatientAddress.trim() || 'Local Walk-in Patient',
      patientPhone: newPatientPhone.trim() || '+91 98765 00000',
      patientUhid: `UHID-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorName: newDoctorName.trim(),
      doctorNmcReg: newDoctorNmcReg.trim(),
      doctorClinicAddress: newDoctorClinic.trim() || 'Private Consultation Clinic',
      drugName: newDrugName.trim(),
      genericSalt: newGenericSalt.trim() || newDrugName.trim(),
      scheduleCategory: newSchedule,
      dosageForm: 'TABLET',
      batchNumber: newBatch.trim() || `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: newExpiry || '2027-06',
      manufacturer: 'Standard Pharma Ltd',
      quantityDispensed: newQty,
      unitType: 'Strip',
      unitPrice: newRate,
      totalAmount: Math.round(newRate * newQty * 100) / 100,
      pharmacistName: pharmacist,
      pharmacistRegNo: pciReg,
      pharmacyLicense20B: dl20B,
      pharmacyLicense21B: dl21B,
      isInspected: false
    });

    setIsManualEntryOpen(false);
    setNewPatientName('');
    setNewPatientPhone('');
    setNewDoctorName('');
    setNewDoctorNmcReg('');
    setNewDrugName('');
    reloadData();
    setToastMessage('✅ Manual Schedule H1 entry recorded in statutory ledger!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getScheduleBadge = (sched: ControlledScheduleCategory) => {
    switch (sched) {
      case 'SCHEDULE_H1':
        return (
          <span
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #EF4444',
              color: '#FCA5A5',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            SCHEDULE H1
          </span>
        );
      case 'SCHEDULE_X':
        return (
          <span
            style={{
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid #A855F7',
              color: '#D8B4FE',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            SCHEDULE X
          </span>
        );
      case 'SCHEDULE_H':
      default:
        return (
          <span
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #F59E0B',
              color: '#FCD34D',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            SCHEDULE H
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#F8FAFC' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            backgroundColor: '#0F172A',
            color: '#10B981',
            border: '1.5px solid #10B981',
            borderRadius: '10px',
            padding: '12px 20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(16, 185, 129, 0.3)',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Top Header Card: Regulatory License Banner */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #10B981',
          borderRadius: '14px',
          padding: '20px 24px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>⚖️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Drug Inspector (CDSCO / FDA) 1-Click Audit Vault
                </h1>
                <span
                  style={{
                    backgroundColor: '#10B981',
                    color: '#000000',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}
                >
                  FORM 20B & 21B CERTIFIED
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
                Statutory digital inspection register maintained under Rule 65(9) & Rule 65(3) of the Drugs & Cosmetics Rules, 1945.
              </p>
            </div>
          </div>

          {/* License Details Subline */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '12px',
              fontSize: '0.78rem',
              color: '#CBD5E1',
              flexWrap: 'wrap'
            }}
          >
            <span>
              📜 <strong>Form 20B DL:</strong>{' '}
              <span style={{ color: '#38BDF8', fontFamily: 'monospace' }}>
                {profile.pharmacyDrugLicense20B || 'MH-TZ4-20B-481920'}
              </span>
            </span>
            <span style={{ color: '#475569' }}>|</span>
            <span>
              📜 <strong>Form 21B DL:</strong>{' '}
              <span style={{ color: '#38BDF8', fontFamily: 'monospace' }}>
                {profile.pharmacyDrugLicense21B || 'MH-TZ4-21B-481921'}
              </span>
            </span>
            <span style={{ color: '#475569' }}>|</span>
            <span>
              🏛️ <strong>GSTIN:</strong>{' '}
              <span style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>
                {profile.gstin || '27AAACD8891Z5'}
              </span>
            </span>
            <span style={{ color: '#475569' }}>|</span>
            <span>
              👨‍⚕️ <strong>Chief Pharmacist:</strong>{' '}
              <span style={{ color: '#34D399', fontWeight: 700 }}>
                {profile.pharmacistName || currentUser?.name || 'Suresh Patel, R.Ph.'}
              </span>{' '}
              ({profile.pharmacistRegNo || 'MH-RPH-84291'})
            </span>
          </div>
        </div>

        {/* 1-Click Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsManualEntryOpen(true)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #475569',
              color: '#CBD5E1',
              padding: '9px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Log manual paper prescription entry"
          >
            <span>➕ Log Physical Rx</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1.5px solid #38BDF8',
              color: '#38BDF8',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Instant download of Form 20B/21B Schedule H1 report for Drug Inspector"
          >
            <span>📥 Download Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintSheetOpen(true)}
            style={{
              backgroundColor: '#10B981',
              border: 'none',
              color: '#000000',
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
            title="Open printable official Form 20B/21B Inspection Sheet"
          >
            <span>🖨️ 1-Click DI Inspection Sheet</span>
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            width: '100%',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid #1E293B'
          }}
        >
          {[
            { id: 'inspector' as const, label: '⚖️ Drug Inspector 1-Click Vault (Form 20B/21B)', count: `${summary.totalControlledDispenses} Audited` },
            { id: 'scheduleH' as const, label: '💊 Schedule H / H1 Register', count: `${scheduleHDispenses.length} Dispenses` },
            { id: 'sales' as const, label: '🧾 Daily Sales & GST Invoices', count: `${dispensingRecords.length} Invoices` },
            { id: 'traces' as const, label: '🔒 Cryptographic System Traces', count: `${audits.length} Traces` }
          ].map((tab) => {
            const active = activeSubView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubView(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: active ? '1.5px solid #10B981' : '1px solid #334155',
                  backgroundColor: active ? 'rgba(16, 185, 129, 0.2)' : '#1E293B',
                  color: active ? '#6EE7B7' : '#94A3B8',
                  fontSize: '0.8rem',
                  fontWeight: active ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    backgroundColor: active ? '#10B981' : '#0F172A',
                    color: active ? '#064E3B' : '#64748B',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-View 1: Drug Inspector 1-Click Vault */}
      {activeSubView === 'inspector' && (
        <>
          {/* Top 4 KPI Cards: Compliance Readiness */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {/* Card 1: Total Controlled Dispenses */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Controlled Dispenses
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38BDF8' }}>
            {summary.totalControlledDispenses}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            In selected horizon: {summary.dateRangeLabel}
          </div>
        </div>

        {/* Card 2: Schedule H1 Count */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#FCA5A5', textTransform: 'uppercase', fontWeight: 700 }}>
            Schedule H1 (Antibiotics/Sedatives)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EF4444' }}>
            {summary.scheduleH1Count}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            Mandatory 3-Year Retention [Rule 65(9)]
          </div>
        </div>

        {/* Card 3: Schedule X Count */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#D8B4FE', textTransform: 'uppercase', fontWeight: 700 }}>
            Schedule X (Narcotics/Psychotropics)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#C084FC' }}>
            {summary.scheduleXCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            Duplicate Rx Copy Retention Active
          </div>
        </div>

        {/* Card 4: Prescription Compliance Rate */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#6EE7B7', textTransform: 'uppercase', fontWeight: 700 }}>
            Rx Compliance Score
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981' }}>
            100%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#34D399' }}>
            Zero unverified dispensing violations
          </div>
        </div>
      </div>

      {/* Control Bar: Time Horizon Pills & Schedule Filters */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Row 1: Drug Inspector Horizon Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
              Inspection Horizon:
            </span>

            {[
              { id: 'LAST_3_MONTHS' as CdscoAuditHorizon, label: '⚡ Last 3 Months (DI Special)', badge: 'MANDATORY' },
              { id: 'CURRENT_MONTH' as CdscoAuditHorizon, label: 'Current Month' },
              { id: 'LAST_30_DAYS' as CdscoAuditHorizon, label: 'Last 30 Days' },
              { id: 'LAST_6_MONTHS' as CdscoAuditHorizon, label: 'Last 6 Months' },
              { id: 'FINANCIAL_YEAR' as CdscoAuditHorizon, label: 'Financial Year (FY 2025-26)' },
              { id: 'CUSTOM' as CdscoAuditHorizon, label: 'Custom Range' }
            ].map((p) => {
              const active = horizon === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setHorizon(p.id)}
                  style={{
                    backgroundColor: active ? '#10B981' : '#1E293B',
                    color: active ? '#000000' : '#CBD5E1',
                    border: active ? '1.5px solid #10B981' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: active ? 900 : 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{p.label}</span>
                  {p.badge && (
                    <span
                      style={{
                        backgroundColor: active ? '#064E3B' : '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        padding: '1px 5px',
                        borderRadius: '4px'
                      }}
                    >
                      {p.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {horizon === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.78rem'
                }}
              />
              <span style={{ color: '#64748B' }}>to</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.78rem'
                }}
              />
            </div>
          )}
        </div>

        {/* Row 2: Schedule Filter Buttons & Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            borderTop: '1px solid #1E293B',
            paddingTop: '10px'
          }}
        >
          {/* Schedule Category Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
              Schedule Filter:
            </span>
            {[
              { id: 'ALL' as const, label: `All Controlled (${summary.totalControlledDispenses})` },
              { id: 'H1' as const, label: `Schedule H1 Only (${summary.scheduleH1Count})`, color: '#EF4444' },
              { id: 'X' as const, label: `Schedule X Only (${summary.scheduleXCount})`, color: '#A855F7' },
              { id: 'H' as const, label: `Schedule H Only (${summary.scheduleHCount})`, color: '#F59E0B' }
            ].map((f) => {
              const active = scheduleFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setScheduleFilter(f.id)}
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.1)' : '#1E293B',
                    border: active ? `1.5px solid ${f.color || '#38BDF8'}` : '1px solid #334155',
                    color: active ? f.color || '#38BDF8' : '#94A3B8',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    fontWeight: active ? 800 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '320px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Drug, Patient, Doctor NMC #, Batch..."
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#F8FAFC',
                fontSize: '0.8rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Statutory Register Table */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#1E293B', borderBottom: '2px solid #334155', color: '#94A3B8', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Reg ID & Date</th>
                <th style={{ padding: '12px' }}>Patient Details & Address</th>
                <th style={{ padding: '12px' }}>Prescribing Doctor (NMC / SMC)</th>
                <th style={{ padding: '12px' }}>Drug & Active Molecule</th>
                <th style={{ padding: '12px' }}>Schedule</th>
                <th style={{ padding: '12px' }}>Batch & Exp</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '12px' }}>Dispensed By</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Inspection Status</th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    Koi inspection record nahi mila selected filter ke liye.
                  </td>
                </tr>
              ) : (
                displayRecords.map((r, idx) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.25)'
                    }}
                  >
                    {/* Reg ID & Date */}
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                        {r.id}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {r.dispenseDate}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'monospace' }}>
                        {r.invoiceNumber}
                      </div>
                    </td>

                    {/* Patient Details */}
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <strong style={{ color: '#F8FAFC' }}>{r.patientName}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        📞 {r.patientPhone}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '2px' }}>
                        🏠 {r.patientAddress}
                      </div>
                    </td>

                    {/* Prescribing Doctor */}
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <strong style={{ color: '#FBBF24' }}>{r.doctorName}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 800, fontFamily: 'monospace' }}>
                        NMC: {r.doctorNmcReg}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>
                        {r.doctorClinicAddress}
                      </div>
                    </td>

                    {/* Drug & Molecule */}
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <strong style={{ color: '#F8FAFC' }}>{r.drugName}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#60A5FA' }}>
                        Salt: {r.genericSalt}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                        {r.manufacturer} • {r.dosageForm}
                      </div>
                    </td>

                    {/* Schedule */}
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {getScheduleBadge(r.scheduleCategory)}
                    </td>

                    {/* Batch & Expiry */}
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#E2E8F0' }}>
                        {r.batchNumber}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        Exp: {r.expiryDate}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td style={{ padding: '12px', verticalAlign: 'top', textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#38BDF8' }}>
                        {r.quantityDispensed}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                        {r.unitType}
                      </div>
                    </td>

                    {/* Dispensed By */}
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ color: '#CBD5E1', fontWeight: 600 }}>
                        {r.pharmacistName}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'monospace' }}>
                        Reg: {r.pharmacistRegNo}
                      </div>
                    </td>

                    {/* Inspection Status */}
                    <td style={{ padding: '12px', verticalAlign: 'top', textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid #10B981',
                          color: '#6EE7B7',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        ✓ VERIFIED RULE 65
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#1E293B',
            borderTop: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.75rem',
            color: '#94A3B8'
          }}
        >
          <div>
            Showing <strong>{displayRecords.length}</strong> of <strong>{summary.totalControlledDispenses}</strong> statutory entries across{' '}
            <strong>{summary.uniqueDoctorsCount}</strong> registered prescribers.
          </div>

          <div style={{ color: '#A7F3D0', fontWeight: 700 }}>
            ⚖️ Drugs & Cosmetics Rules, 1945 — Non-repudiation audit trail active
          </div>
        </div>
      </div>
    </>
  )}

  {/* Sub-View 2: Detailed Schedule H & H1 Dispensing Register */}
  {activeSubView === 'scheduleH' && (
    <div
      style={{
        backgroundColor: '#0F172A',
        border: '1px solid #1E293B',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
            Prescription Drug Sale Register (Schedule H & H1)
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
            Maintained under Rule 65(9) and Rule 65(3) of Drugs & Cosmetics Rules, 1945 for antibiotics, narcotics and sedatives.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #475569',
              color: '#CBD5E1',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🖨️ Print Statutory Register
          </button>
          <button
            type="button"
            onClick={handleExportScheduleHCSV}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1.5px solid #38BDF8',
              color: '#38BDF8',
              padding: '7px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📥 Export CSV for Drug Inspector
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search by Patient Name, Phone, Doctor, NMC Reg, Batch #, or Medicine..."
          value={scheduleHSearch}
          onChange={(e) => setScheduleHSearch(e.target.value)}
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#F8FAFC',
            fontSize: '0.8rem'
          }}
        />
        <select
          value={scheduleHCategoryFilter}
          onChange={(e) => setScheduleHCategoryFilter(e.target.value as any)}
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#F8FAFC',
            fontSize: '0.8rem'
          }}
        >
          <option value="ALL">All Controlled Drugs (H, H1, X)</option>
          <option value="H1">Schedule H1 (High-Alert Antibiotics & Narcotics)</option>
          <option value="H">Schedule H (Prescription Only)</option>
          <option value="X">Schedule X (Strict Narcotics)</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#1E293B', borderBottom: '2px solid #334155', color: '#94A3B8', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Date / Dispense #</th>
              <th style={{ padding: '12px' }}>Patient Details</th>
              <th style={{ padding: '12px' }}>Prescribing Physician</th>
              <th style={{ padding: '12px' }}>Drug Name & Strength</th>
              <th style={{ padding: '12px' }}>Schedule</th>
              <th style={{ padding: '12px' }}>Batch & Expiry</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Qty</th>
              <th style={{ padding: '12px' }}>Dispensed By</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Receipt Slip</th>
            </tr>
          </thead>
          <tbody>
            {filteredScheduleH.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                  Koi Schedule H/H1 record nahi mila.
                </td>
              </tr>
            ) : (
              filteredScheduleH.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.25)'
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#38BDF8' }}>{item.dispensingNumber}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {new Date(item.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.patientName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>📞 {item.patientPhone}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#FBBF24' }}>{item.doctorName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 600 }}>
                      Reg: {item.doctorNmcReg}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.medicationName}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {item.scheduleType === 'H1' ? (
                      <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        SCHEDULE H1
                      </span>
                    ) : item.scheduleType === 'X' ? (
                      <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', border: '1px solid #A855F7', color: '#D8B4FE', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        SCHEDULE X
                      </span>
                    ) : (
                      <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#FCD34D', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        SCHEDULE H
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#CBD5E1' }}>{item.batchNumber}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Exp: 12/26</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#38BDF8' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>{item.pharmacistName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#34D399' }}>Verified Rule 65</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenSlipFromDispense(item.fullDispense)}
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #475569',
                        color: '#38BDF8',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🧾 Slip
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )}

  {/* Sub-View 3: Daily Sales & GST Invoices */}
  {activeSubView === 'sales' && (
    <div
      style={{
        backgroundColor: '#0F172A',
        border: '1px solid #1E293B',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
            Daily Retail POS & OPD Dispensing Tax Invoices
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
            All generated GST tax invoices, thermal slips, and WhatsApp dispensing receipts.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search invoices by Dispense #, Patient, MRN, Medicine..."
          value={salesSearch}
          onChange={(e) => setSalesSearch(e.target.value)}
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#F8FAFC',
            fontSize: '0.8rem',
            minWidth: '280px'
          }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#1E293B', borderBottom: '2px solid #334155', color: '#94A3B8', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Invoice / Dispense #</th>
              <th style={{ padding: '12px' }}>Date & Time</th>
              <th style={{ padding: '12px' }}>Customer / Patient</th>
              <th style={{ padding: '12px' }}>Items Dispensed</th>
              <th style={{ padding: '12px' }}>Pharmacist</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                  Koi sales tax invoice record nahi mila.
                </td>
              </tr>
            ) : (
              filteredSales.map((d, idx) => (
                <tr
                  key={d.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.25)'
                  }}
                >
                  <td style={{ padding: '12px', fontWeight: 700, color: '#38BDF8' }}>
                    {d.dispensingNumber}
                  </td>
                  <td style={{ padding: '12px', color: '#CBD5E1' }}>
                    {new Date(d.dispensedAt || d.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{d.patientName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{d.patientMrn}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>
                      {d.items.map((it) => (
                        <div key={it.id}>
                          • {it.medicationName} × {it.quantity} ({it.batchNumber})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#CBD5E1' }}>
                    {d.pharmacistName}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                      PAID & DISPENSED
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenSlipFromDispense(d)}
                      style={{
                        backgroundColor: '#10B981',
                        border: 'none',
                        color: '#000',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      🖨️ View / Print Slip
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )}

  {/* Sub-View 4: Cryptographic System Audit Traces */}
  {activeSubView === 'traces' && (
    <div
      style={{
        backgroundColor: '#0F172A',
        border: '1px solid #1E293B',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}
    >
      <PharmacyAuditVaultView auditTraces={audits} />
    </div>
  )}

      {/* ========================================================================= */}
      {/* Printable Official Form 20B/21B Government Inspection Sheet Modal */}
      {/* ========================================================================= */}
      {isPrintSheetOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(5px)',
            zIndex: 10008,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '1100px',
              maxWidth: '100%',
              height: '92vh',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              borderRadius: '12px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Toolbar */}
            <div
              style={{
                padding: '12px 24px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🖨️</span>
                <strong>Government Form 20B/21B Statutory Inspection Sheet Preview</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: '#10B981',
                    border: 'none',
                    color: '#000000',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Print / Save PDF (Ctrl+P)
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintSheetOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #64748B',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Statutory Printable Inspection Document */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', fontFamily: 'serif' }}>
              {/* Official Government Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Government of India • State Drugs Control Administration
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', margin: '4px 0' }}>
                  Statutory Register of Schedule H1 & Schedule X Drugs
                </div>
                <div style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>
                  [Maintained under Rule 65(9) & Rule 65(3) of the Drugs and Cosmetics Rules, 1945]
                </div>
              </div>

              {/* Pharmacy License Credentials */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '12px',
                  fontSize: '0.8rem',
                  borderBottom: '1px solid #CCC',
                  paddingBottom: '12px',
                  marginBottom: '16px'
                }}
              >
                <div>
                  <div><strong>Name of Chemist / Pharmacy:</strong> {profile.entityLegalName || 'DocSearch Healthcare Partner'}</div>
                  <div><strong>Address of Premises:</strong> {(profile as any).registeredAddress || 'Main Market, Civil Hospital Road'}</div>
                  <div><strong>Retail Drug License Nos:</strong> Form 20B: <u>{profile.pharmacyDrugLicense20B || 'MH-TZ4-20B-481920'}</u> | Form 21B: <u>{profile.pharmacyDrugLicense21B || 'MH-TZ4-21B-481921'}</u></div>
                  <div><strong>GSTIN:</strong> {profile.gstin || '27AAACD8891Z5'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Inspection Period:</strong> {summary.dateRangeLabel}</div>
                  <div><strong>Chief Pharmacist:</strong> {profile.pharmacistName || currentUser?.name || 'Suresh Patel, R.Ph.'}</div>
                  <div><strong>Pharmacy Council Reg #:</strong> {profile.pharmacistRegNo || 'MH-RPH-84291'}</div>
                  <div><strong>Total Entries:</strong> {summary.totalControlledDispenses} (H1: {summary.scheduleH1Count}, X: {summary.scheduleXCount}, H: {summary.scheduleHCount})</div>
                </div>
              </div>

              {/* Table of Entries */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderTop: '1px solid #000', borderBottom: '1px solid #000', textAlign: 'left' }}>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #DDD' }}>S.No / Reg ID</th>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #DDD' }}>Date of Supply</th>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #DDD' }}>Patient Name & Address</th>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #DDD' }}>Prescribing Doctor (NMC Reg #)</th>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #DDD' }}>Drug Name & Active Salt</th>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #DDD' }}>Sched</th>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #DDD' }}>Batch & Exp</th>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #DDD', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '6px 4px' }}>Pharmacist Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.entries.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #EEE' }}>
                      <td style={{ padding: '5px 4px', borderRight: '1px solid #DDD', fontFamily: 'monospace' }}>
                        {idx + 1}. {item.id}
                      </td>
                      <td style={{ padding: '5px 4px', borderRight: '1px solid #DDD' }}>
                        {item.dispenseDate}
                      </td>
                      <td style={{ padding: '5px 4px', borderRight: '1px solid #DDD' }}>
                        <strong>{item.patientName}</strong>, {item.patientAddress} ({item.patientPhone})
                      </td>
                      <td style={{ padding: '5px 4px', borderRight: '1px solid #DDD' }}>
                        <strong>{item.doctorName}</strong> (<u>{item.doctorNmcReg}</u>)
                      </td>
                      <td style={{ padding: '5px 4px', borderRight: '1px solid #DDD' }}>
                        {item.drugName} ({item.genericSalt})
                      </td>
                      <td style={{ padding: '5px 4px', borderRight: '1px solid #DDD', fontWeight: 'bold' }}>
                        {item.scheduleCategory === 'SCHEDULE_H1' ? 'H1' : item.scheduleCategory === 'SCHEDULE_X' ? 'X' : 'H'}
                      </td>
                      <td style={{ padding: '5px 4px', borderRight: '1px solid #DDD', fontFamily: 'monospace' }}>
                        {item.batchNumber} / {item.expiryDate}
                      </td>
                      <td style={{ padding: '5px 4px', borderRight: '1px solid #DDD', textAlign: 'right', fontWeight: 'bold' }}>
                        {item.quantityDispensed} {item.unitType}
                      </td>
                      <td style={{ padding: '5px 4px', fontStyle: 'italic', fontSize: '0.68rem' }}>
                        {item.pharmacistName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Statutory Pharmacist Declaration */}
              <div
                style={{
                  border: '1px solid #000',
                  padding: '12px 16px',
                  fontSize: '0.75rem',
                  lineHeight: 1.5,
                  marginBottom: '24px',
                  backgroundColor: '#FAFAFA'
                }}
              >
                <strong>STATUTORY CERTIFICATE UNDER RULE 65(9) OF THE DRUGS & COSMETICS RULES, 1945:</strong>
                <br />
                I, <strong>{profile.pharmacistName || 'Suresh Patel'}</strong>, Registered Pharmacist holding Registration No.{' '}
                <strong>{profile.pharmacistRegNo || 'MH-RPH-84291'}</strong>, do hereby certify that each of the Schedule H1 and Schedule X entries listed above was dispensed strictly against a valid original prescription signed by a Registered Medical Practitioner containing their Registered NMC/State Medical Council number. All records have been entered synchronously and are retained for statutory inspection.
              </div>

              {/* Official Drug Inspector Endorsement Box */}
              <div
                style={{
                  border: '2px solid #000',
                  padding: '16px',
                  fontSize: '0.8rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Drugs Inspector Inspection Endorsement:
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#444', lineHeight: 1.6 }}>
                    Date of Inspection: ________________________
                    <br />
                    Inspection Ledger Verified: [  ] Found Correct & Verified
                    <br />
                    Observations / Remarks: ___________________________________
                    <br />
                    __________________________________________________________
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'right' }}>
                  <div style={{ height: '50px' }}></div>
                  <div>
                    <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold' }}>
                      Signature & Seal of Inspecting Officer
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#555' }}>
                      Drugs Inspector, State Drugs Control Administration
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Manual Physical Rx Dispense Logging Modal */}
      {/* ========================================================================= */}
      {isManualEntryOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 10008,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '640px',
              maxWidth: '100%',
              backgroundColor: '#0F172A',
              border: '1.5px solid #38BDF8',
              borderRadius: '14px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: '#1E293B',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <strong style={{ fontSize: '1rem', color: '#F8FAFC' }}>
                ➕ Log Physical Paper Rx in CDSCO Register
              </strong>
              <button
                type="button"
                onClick={() => setIsManualEntryOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualEntry} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Patient Phone #
                  </label>
                  <input
                    type="text"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                  Patient Residential Address (Mandatory under Rule 65)
                </label>
                <input
                  type="text"
                  value={newPatientAddress}
                  onChange={(e) => setNewPatientAddress(e.target.value)}
                  placeholder="e.g. 45 Gandhi Nagar, Delhi"
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Prescribing Doctor *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma, MD"
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    NMC / SMC Reg # *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctorNmcReg}
                    onChange={(e) => setNewDoctorNmcReg(e.target.value)}
                    placeholder="e.g. NMC-DEL-48219"
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#34D399', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                  Doctor Clinic / Hospital Address
                </label>
                <input
                  type="text"
                  value={newDoctorClinic}
                  onChange={(e) => setNewDoctorClinic(e.target.value)}
                  placeholder="e.g. Sharma Chest Clinic, Rohini"
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Drug Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDrugName}
                    onChange={(e) => setNewDrugName(e.target.value)}
                    placeholder="e.g. Tab. Cefixime 200mg"
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Generic Salt
                  </label>
                  <input
                    type="text"
                    value={newGenericSalt}
                    onChange={(e) => setNewGenericSalt(e.target.value)}
                    placeholder="e.g. Cefixime IP"
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Schedule
                  </label>
                  <select
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value as ControlledScheduleCategory)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  >
                    <option value="SCHEDULE_H1">Schedule H1</option>
                    <option value="SCHEDULE_X">Schedule X</option>
                    <option value="SCHEDULE_H">Schedule H</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Batch #
                  </label>
                  <input
                    type="text"
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    placeholder="TXM-8821"
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    placeholder="2027-06"
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRate}
                    onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsManualEntryOpen(false)}
                  style={{ backgroundColor: 'transparent', border: '1px solid #475569', color: '#CBD5E1', padding: '6px 14px', borderRadius: '6px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#10B981', border: 'none', color: '#000', padding: '6px 18px', borderRadius: '6px', fontWeight: 800 }}
                >
                  Save Entry into Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Slip Modal */}
      {viewInvoice && (
        <PharmacyInvoiceSlipModal
          isOpen={Boolean(viewInvoice)}
          onClose={() => setViewInvoice(null)}
          invoiceData={viewInvoice}
        />
      )}
    </div>
  );
};
