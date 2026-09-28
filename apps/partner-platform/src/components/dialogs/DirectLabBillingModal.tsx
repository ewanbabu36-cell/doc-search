import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@docsearch/ui-kit';
import { clinicalInvestigationService } from '../../services/clinical-investigation-service.js';
import { pathologyRevenueService } from '../../services/pathology-revenue-service.js';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';

export interface LabBillingItem {
  code: string;
  name: string;
  department: string;
  mrp: number;
  sampleType: string;
}

const AVAILABLE_BILLING_TESTS: LabBillingItem[] = [
  { code: 'CBC', name: 'Complete Blood Count (CBC with 5-Diff)', department: 'Hematology', mrp: 350, sampleType: 'EDTA Whole Blood' },
  { code: 'LIPID', name: 'Lipid Profile Comprehensive', department: 'Biochemistry', mrp: 650, sampleType: 'Serum Fasting' },
  { code: 'LFT', name: 'Liver Function Test (LFT)', department: 'Biochemistry', mrp: 750, sampleType: 'Serum' },
  { code: 'KFT', name: 'Kidney / Renal Function Test (KFT)', department: 'Biochemistry', mrp: 650, sampleType: 'Serum' },
  { code: 'THYROID', name: 'Thyroid Profile Total (T3, T4, TSH)', department: 'Immunology', mrp: 450, sampleType: 'Serum' },
  { code: 'GLUCOSE_FBS', name: 'Fasting Blood Sugar (FBS)', department: 'Biochemistry', mrp: 100, sampleType: 'Fluoride Plasma' },
  { code: 'GLUCOSE_PP', name: 'Post-Prandial Blood Sugar (PPBS)', department: 'Biochemistry', mrp: 100, sampleType: 'Fluoride Plasma' },
  { code: 'HBA1C', name: 'HbA1c (Glycated Hemoglobin)', department: 'Biochemistry', mrp: 450, sampleType: 'EDTA Whole Blood' },
  { code: 'URINE_RM', name: 'Urine Routine & Microscopic (R/M)', department: 'Clinical Pathology', mrp: 150, sampleType: 'Urine Mid-Stream' },
  { code: 'VIT_D', name: 'Vitamin D (25-OH) Total', department: 'Endocrinology', mrp: 1200, sampleType: 'Serum' },
  { code: 'VIT_B12', name: 'Vitamin B12 (Cyanocobalamin)', department: 'Endocrinology', mrp: 850, sampleType: 'Serum' },
  { code: 'CRP', name: 'C-Reactive Protein (Quantitative)', department: 'Serology', mrp: 400, sampleType: 'Serum' },
  { code: 'DENGUE_DUO', name: 'Dengue NS1 Antigen + IgG/IgM', department: 'Serology', mrp: 900, sampleType: 'Serum' },
  { code: 'WIDAL', name: 'Widal Slide Agglutination (Typhoid)', department: 'Microbiology', mrp: 200, sampleType: 'Serum' },
  { code: 'URINE_CULTURE', name: 'Urine Culture & Sensitivity (AST Antibiogram)', department: 'Microbiology', mrp: 600, sampleType: 'Mid-stream Urine' },
  { code: 'BLOOD_CULTURE', name: 'Blood Culture & Sensitivity (Aerobic/Anaerobic)', department: 'Microbiology', mrp: 1100, sampleType: 'Whole Blood (Culture Bottle)' }
];

export interface HealthPackage {
  id: string;
  name: string;
  badge: string;
  testCodes: string[];
  packageMrp: number;
  description: string;
}

export const PREVENTIVE_HEALTH_PACKAGES: HealthPackage[] = [
  {
    id: 'PKG_FULL_BODY',
    name: '🌟 Full Body Health Checkup (64 Tests)',
    badge: 'POPULAR (SAVE 68%)',
    testCodes: ['CBC', 'LIPID', 'LFT', 'KFT', 'THYROID', 'GLUCOSE_FBS', 'URINE_RM'],
    packageMrp: 999,
    description: 'Complete hemogram, liver, kidney, lipid, thyroid, blood sugar & urine'
  },
  {
    id: 'PKG_DIABETES',
    name: '🩸 Comprehensive Diabetic Care Profile',
    badge: 'DIABETES CARE',
    testCodes: ['HBA1C', 'GLUCOSE_FBS', 'GLUCOSE_PP', 'LIPID', 'KFT', 'URINE_RM'],
    packageMrp: 699,
    description: 'HbA1c, FBS, PPBS, renal panel, lipid & microalbuminuria risk'
  },
  {
    id: 'PKG_FEVER',
    name: '🤒 Acute Monsoon Fever Profile',
    badge: 'FEVER / DENGUE',
    testCodes: ['CBC', 'DENGUE_DUO', 'WIDAL', 'CRP', 'URINE_RM'],
    packageMrp: 899,
    description: 'Dengue NS1/IgG/IgM, Typhoid Widal, CBC Differential & CRP'
  },
  {
    id: 'PKG_CARDIAC',
    name: '🫀 Advanced Cardiac Health Profile',
    badge: 'HEART WELLNESS',
    testCodes: ['LIPID', 'CRP', 'KFT', 'GLUCOSE_FBS', 'HBA1C'],
    packageMrp: 1099,
    description: 'High-sensitivity CRP, Lipids, Diabetes & Renal clearance'
  },
  {
    id: 'PKG_BONE',
    name: '🦴 Bone & Joint Vitality Package',
    badge: 'VITAMINS & BONE',
    testCodes: ['VIT_D', 'VIT_B12', 'KFT', 'CBC'],
    packageMrp: 1499,
    description: 'Vitamin D3 (25-OH), Vitamin B12, Renal Panel & CBC'
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (orderData: any) => void;
  initialReportOrder?: InvestigationOrderDto | null;
}

export const DirectLabBillingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOrderCreated,
  initialReportOrder
}) => {
  const [step, setStep] = useState<'BILLING' | 'RECEIPT'>('BILLING');

  // Available completed reports in the system
  const availableReports = useMemo<InvestigationOrderDto[]>(() => {
    try {
      const orders = clinicalInvestigationService.getOrdersSync();
      return orders.filter((o: InvestigationOrderDto) => Boolean(o.report || o.status === 'VERIFIED' || o.status === 'REVIEWED'));
    } catch {
      return [];
    }
  }, [isOpen]);

  const [linkedReport, setLinkedReport] = useState<InvestigationOrderDto | null>(initialReportOrder || null);

  // Patient Info
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientMrn, setPatientMrn] = useState(() => `MRN-${Math.floor(10000 + Math.random() * 90000)}`);
  const [referringDoctor, setReferringDoctor] = useState('Self / Direct Walk-In');

  // Package & Selected Tests
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'DUE'>('UPI');
  const [amountPaid, setAmountPaid] = useState<string>('');

  const [billNumber] = useState(() => `INV-${Date.now().toString().slice(-6)}`);
  const [accessionNumber] = useState(() => `ACC-${Math.floor(100000 + Math.random() * 900000)}`);

  const applyReport = (ord: InvestigationOrderDto) => {
    setLinkedReport(ord);
    setPatientName(ord.patientName || '');
    setPatientAge(String((ord as any).patientAge || 38));
    setPatientGender(ord.patientGender === 'FEMALE' ? 'Female' : 'Male');
    const meta = (ord.metadata as any) || {};
    if (meta.patientPhone) setPatientPhone(meta.patientPhone);
    if (ord.patientMrn) setPatientMrn(ord.patientMrn);
    if (ord.orderingDoctorName) setReferringDoctor(ord.orderingDoctorName);

    // Auto-match test codes from report
    const testCode = ord.investigationCode?.toUpperCase() || '';
    const matched = AVAILABLE_BILLING_TESTS.find(
      (t) => t.code === testCode || ord.investigationName.toLowerCase().includes(t.code.toLowerCase()) || ord.investigationName.toLowerCase().includes(t.name.slice(0, 5).toLowerCase())
    );
    if (matched) {
      setSelectedCodes([matched.code]);
      setActivePackageId(null);
    } else {
      setSelectedCodes(['CBC']);
      setActivePackageId(null);
    }
  };

  useEffect(() => {
    if (initialReportOrder) {
      applyReport(initialReportOrder);
    } else if (availableReports.length > 0 && !linkedReport) {
      applyReport(availableReports[0]!);
    }
  }, [initialReportOrder, availableReports]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activePackage = PREVENTIVE_HEALTH_PACKAGES.find((p) => p.id === activePackageId);
  const isPackageApplicable = Boolean(activePackage && activePackage.testCodes.every((c) => selectedCodes.includes(c)));

  const selectedTests = AVAILABLE_BILLING_TESTS.filter((t) => selectedCodes.includes(t.code));

  let subtotal = 0;
  if (isPackageApplicable && activePackage) {
    const nonPackageTests = selectedTests.filter((t) => !activePackage.testCodes.includes(t.code));
    const nonPackageTotal = nonPackageTests.reduce((acc, t) => acc + t.mrp, 0);
    subtotal = activePackage.packageMrp + nonPackageTotal;
  } else {
    subtotal = selectedTests.reduce((acc, t) => acc + t.mrp, 0);
  }

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const netPayable = subtotal - discountAmount;
  const effectivePaid = amountPaid ? parseFloat(amountPaid) : netPayable;
  const balanceDue = Math.max(0, netPayable - effectivePaid);

  const toggleTest = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectPackage = (pkg: HealthPackage) => {
    if (activePackageId === pkg.id && isPackageApplicable) {
      setActivePackageId(null);
    } else {
      setActivePackageId(pkg.id);
      setSelectedCodes(Array.from(new Set([...pkg.testCodes])));
    }
  };

  const handleGenerateBill = () => {
    if (!linkedReport || selectedCodes.length === 0) return;
    setStep('RECEIPT');

    // Update order in clinicalInvestigationService to mark as BILLED!
    clinicalInvestigationService.updateOrderBilling(linkedReport.id, {
      invoiceNumber: billNumber,
      billedAmount: netPayable,
      paidAmount: effectivePaid,
      paymentMode,
      balanceDue
    });

    // Record invoice in Pathology Revenue & Daily Collection Ledger!
    pathologyRevenueService.recordInvoice({
      invoiceNumber: billNumber,
      orderId: linkedReport.id,
      orderNumber: linkedReport.orderNumber || billNumber,
      patientName,
      patientAge: parseInt(patientAge, 10) || 38,
      patientGender: patientGender === 'Female' ? 'Female' : 'Male',
      patientMrn,
      patientPhone,
      referringDoctor,
      tests: selectedTests.map((t) => t.name),
      packageName: (isPackageApplicable && activePackage) ? activePackage.name : undefined,
      investigationName: (isPackageApplicable && activePackage)
        ? `${activePackage.name} [${selectedTests.length} Tests]`
        : selectedTests.map((t) => t.name).join(' + '),
      department: linkedReport.investigationCategory || (selectedTests[0]?.department) || 'Clinical Pathology',
      subtotal,
      discount: discountAmount,
      tax: 0,
      netPayable,
      paidAmount: effectivePaid,
      balanceDue,
      paymentMode: (paymentMode as any) || 'CASH',
      status: balanceDue === 0 ? 'PAID' : 'PARTIAL_DUE',
      billedAt: new Date().toISOString(),
      cashierName: 'Front Desk Cashier'
    });

    if (onOrderCreated) {
      onOrderCreated({
        id: linkedReport.id || `ord-${Date.now()}`,
        orderNumber: billNumber,
        patientName,
        patientAge: parseInt(patientAge, 10) || 38,
        patientGender,
        patientMrn,
        patientPhone,
        referringDoctor,
        packageName: (isPackageApplicable && activePackage) ? activePackage.name : undefined,
        tests: selectedTests.map((t) => t.name),
        investigationName: (isPackageApplicable && activePackage)
          ? `${activePackage.name} [${selectedTests.length} Tests]`
          : selectedTests.map((t) => t.name).join(' + '),
        totalAmount: netPayable,
        paymentStatus: balanceDue === 0 ? 'PAID' : 'PARTIAL_DUE',
        accessionNumber: (linkedReport.metadata as any)?.sampleBarcode || accessionNumber,
        orderedAt: new Date().toISOString()
      });
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const nowFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 15, 23, 0.45)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch'
      }}
    >
      {/* Print stylesheet for 80mm thermal receipt */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-lab-receipt, #printable-lab-receipt * {
            visibility: visible !important;
          }
          #printable-lab-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 8px !important;
            width: 80mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #FFF !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Right-Docked Slide-Over Drawer Window */}
      <div style={{
        backgroundColor: 'var(--ds-color-surface, #121826)',
        color: 'var(--ds-color-text-primary, #F8FAFC)',
        borderLeft: '1px solid var(--ds-color-border-strong, rgba(255, 255, 255, 0.16))',
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        borderRadius: 0,
        borderTopLeftRadius: '16px',
        borderBottomLeftRadius: '16px',
        boxShadow: 'var(--ds-shadow-xl, -16px 0 48px rgba(0, 0, 0, 0.6))',
        width: '100%',
        maxWidth: '820px',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        animation: 'dsDrawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Top Header */}
        <div className="no-print" style={{
          backgroundColor: 'var(--ds-color-surface-subtle, #182234)',
          padding: '14px 20px',
          borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>🧾</span>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--ds-color-primary, #0284C7)' }}>
                Walk-In Front Desk Lab Billing & POS Counter
              </strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
                Instant test order booking • Auto phlebotomy queue push • 80mm Thermal Receipt
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close billing drawer"
            title="Close (Esc)"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ds-color-text-muted, #94A3B8)',
              cursor: 'pointer',
              fontSize: '1.25rem',
              fontWeight: 800,
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* STEP 1: BILLING FORM */}
        {step === 'BILLING' && (
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* MANDATORY REPORT LINKAGE BANNER (Strict Rule: Billing only for completed reports) */}
            <div style={{
              backgroundColor: linkedReport ? 'var(--ds-color-success-subtle, rgba(16, 185, 129, 0.12))' : 'var(--ds-color-danger-subtle, rgba(239, 68, 68, 0.15))',
              border: `1.5px solid ${linkedReport ? 'var(--ds-color-success, #10B981)' : 'var(--ds-color-danger, #EF4444)'}`,
              borderRadius: '10px',
              padding: '12px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{linkedReport ? '🔒✓' : '⚠️'}</span>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 900, color: linkedReport ? 'var(--ds-color-success, #10B981)' : 'var(--ds-color-danger, #EF4444)' }}>
                      {linkedReport
                        ? 'REPORT-LINKED BILLING ACTIVE (Verified Patient & Test Locked)'
                        : 'STRICT BILLING ENFORCEMENT: COMPLETED REPORT REQUIRED'}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-secondary, #CBD5E1)' }}>
                      {linkedReport
                        ? `Linked Report: ${linkedReport.report?.reportNumber || linkedReport.orderNumber} · Investigation: ${linkedReport.investigationName}`
                        : 'Billing can ONLY be generated for patients whose diagnostic reports have been generated (BILL USKI HI BANEGI JISKI REPORT NIKLI H).'}
                    </div>
                  </div>
                </div>

                {linkedReport && (
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    backgroundColor: (linkedReport.metadata as any)?.billingStatus === 'BILLED' ? 'var(--ds-color-success-subtle, rgba(16, 185, 129, 0.3))' : 'var(--ds-color-warning-subtle, rgba(245, 158, 11, 0.25))',
                    color: (linkedReport.metadata as any)?.billingStatus === 'BILLED' ? 'var(--ds-color-success, #10B981)' : 'var(--ds-color-warning, #F59E0B)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {(linkedReport.metadata as any)?.billingStatus === 'BILLED' ? '✓ ALREADY BILLED' : '🟡 UNBILLED'}
                  </span>
                )}
              </div>

              {/* Selector Dropdown */}
              {availableReports.length > 0 ? (
                <div>
                  <label style={{ display: 'block', color: 'var(--ds-color-text-muted, #94A3B8)', fontSize: '0.72rem', marginBottom: '4px', fontWeight: 700 }}>
                    Select Patient With Completed / Released Diagnostic Report:
                  </label>
                  <select
                    value={linkedReport?.id || ''}
                    onChange={(e) => {
                      const found = availableReports.find((r: InvestigationOrderDto) => r.id === e.target.value);
                      if (found) applyReport(found);
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--ds-color-bg, #0b0f17)',
                      border: '1.5px solid var(--ds-color-primary, #0284c7)',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      color: 'var(--ds-color-text-primary, #38BDF8)',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}
                  >
                    <option value="" disabled>-- Choose Patient With Completed Report --</option>
                    {availableReports.map((r: InvestigationOrderDto) => (
                      <option key={r.id} value={r.id}>
                        {r.patientName} (UHID: {r.patientMrn}) · {r.investigationName} [Report #{r.report?.reportNumber || r.orderNumber}] · {(r.metadata as any)?.billingStatus === 'BILLED' ? 'BILLED' : 'UNBILLED'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-danger, #EF4444)', marginTop: '4px' }}>
                  No finalized reports currently exist in the lab register. Please generate the test report first using <strong>+ Walk-In Test & Print</strong> before billing.
                </div>
              )}
            </div>

            {/* Patient & Referring Doctor Demographics */}
            <div style={{ backgroundColor: 'var(--ds-color-surface-subtle, #182234)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--ds-color-primary, #0284c7)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
                👤 Patient Demographics & Referral
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--ds-color-text-muted, #94A3B8)', marginBottom: '3px' }}>Patient Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', backgroundColor: 'var(--ds-color-bg, #0b0f17)', border: '1px solid var(--ds-color-border-strong, #334155)', borderRadius: '6px', color: 'var(--ds-color-text-primary, #FFF)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--ds-color-text-muted, #94A3B8)', marginBottom: '3px' }}>Age & Gender *</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      style={{ width: '40%', padding: '6px 8px', backgroundColor: 'var(--ds-color-bg, #0b0f17)', border: '1px solid var(--ds-color-border-strong, #334155)', borderRadius: '6px', color: 'var(--ds-color-text-primary, #FFF)' }}
                    />
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      style={{ width: '60%', padding: '6px 8px', backgroundColor: 'var(--ds-color-bg, #0b0f17)', border: '1px solid var(--ds-color-border-strong, #334155)', borderRadius: '6px', color: 'var(--ds-color-text-primary, #FFF)' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--ds-color-text-muted, #94A3B8)', marginBottom: '3px' }}>Mobile / WhatsApp *</label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', backgroundColor: 'var(--ds-color-bg, #0b0f17)', border: '1px solid var(--ds-color-border-strong, #334155)', borderRadius: '6px', color: 'var(--ds-color-text-primary, #FFF)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--ds-color-text-muted, #94A3B8)', marginBottom: '3px' }}>Referring Doctor</label>
                  <input
                    type="text"
                    list="referring-doctors-datalist"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    placeholder="Enter or select referring doctor"
                    style={{ width: '100%', padding: '6px 10px', backgroundColor: 'var(--ds-color-bg, #0b0f17)', border: '1px solid var(--ds-color-border-strong, #334155)', borderRadius: '6px', color: 'var(--ds-color-text-primary, #FFF)' }}
                  />
                  <datalist id="referring-doctors-datalist">
                    <option value="Self / Direct Walk-In" />
                    <option value="Attending OPD Physician" />
                    <option value="Consulting Specialist" />
                  </datalist>
                </div>
              </div>
            </div>

            {/* 1-Click Preventive Health Checkup Packages */}
            <div style={{ backgroundColor: 'var(--ds-color-surface-subtle, #182234)', padding: '12px 18px', borderRadius: '10px', border: '1.5px solid var(--ds-color-warning-subtle, rgba(245, 158, 11, 0.35))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--ds-color-warning, #F59E0B)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⭐</span> 1-Click Preventive Health Packages ({PREVENTIVE_HEALTH_PACKAGES.length})
                </span>
                {isPackageApplicable && activePackage && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--ds-color-success, #10B981)', fontWeight: 800, backgroundColor: 'var(--ds-color-success-subtle, rgba(16, 185, 129, 0.2))', border: '1px solid var(--ds-color-success, #10B981)', padding: '2px 8px', borderRadius: '6px' }}>
                    ✓ Package Applied: ₹{activePackage.packageMrp}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {PREVENTIVE_HEALTH_PACKAGES.map((pkg) => {
                  const isActive = activePackageId === pkg.id && isPackageApplicable;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      style={{
                        backgroundColor: isActive ? 'var(--ds-color-warning-subtle, rgba(245, 158, 11, 0.18))' : 'var(--ds-color-bg, #0b0f17)',
                        border: `1.5px solid ${isActive ? 'var(--ds-color-warning, #F59E0B)' : 'var(--ds-color-border, rgba(255, 255, 255, 0.1))'}`,
                        borderRadius: '8px',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.62rem', backgroundColor: isActive ? 'var(--ds-color-warning, #F59E0B)' : 'var(--ds-color-surface-hover, rgba(255, 255, 255, 0.08))', color: isActive ? '#000000' : 'var(--ds-color-text-secondary, #CBD5E1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                            {pkg.badge}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--ds-color-success, #10B981)' }}>
                            ₹{pkg.packageMrp}
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: isActive ? 'var(--ds-color-text-primary, #FFF)' : 'var(--ds-color-text-primary, #E2E8F0)' }}>
                          {pkg.name}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--ds-color-text-muted, #94A3B8)', marginTop: '2px', lineHeight: 1.3 }}>
                          {pkg.description}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: isActive ? 'var(--ds-color-warning, #FCD34D)' : 'var(--ds-color-text-muted, #64748B)', fontWeight: 700, marginTop: '4px' }}>
                        {isActive ? '✓ Bundle Applied' : '+ Tap to Select'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test Selection Grid */}
            <div style={{ backgroundColor: 'var(--ds-color-surface-subtle, #182234)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--ds-color-primary, #0284c7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🧪 Diagnostic Investigations ({selectedCodes.length} selected)
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--ds-color-success, #10B981)', fontWeight: 700 }}>
                  Subtotal: ₹{subtotal}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {AVAILABLE_BILLING_TESTS.map((t) => {
                  const isChecked = selectedCodes.includes(t.code);
                  return (
                    <div
                      key={t.code}
                      onClick={() => toggleTest(t.code)}
                      style={{
                        backgroundColor: isChecked ? 'var(--ds-color-primary-subtle, rgba(2, 132, 199, 0.2))' : 'var(--ds-color-bg, #0b0f17)',
                        border: `1.5px solid ${isChecked ? 'var(--ds-color-primary, #0284c7)' : 'var(--ds-color-border, rgba(255, 255, 255, 0.1))'}`,
                        borderRadius: '8px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.75rem', color: isChecked ? 'var(--ds-color-text-primary, #FFF)' : 'var(--ds-color-text-secondary, #CBD5E1)', display: 'block' }}>
                          {t.name}
                        </strong>
                        <span style={{ fontSize: '0.65rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>{t.sampleType}</span>
                      </div>
                      <div style={{ fontWeight: 900, color: isChecked ? 'var(--ds-color-primary, #0284c7)' : 'var(--ds-color-text-muted, #64748B)', fontSize: '0.8rem' }}>
                        ₹{t.mrp}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment & Calculation Box */}
            <div style={{ backgroundColor: 'var(--ds-color-surface-subtle, #0B1120)', padding: '16px 20px', borderRadius: '10px', border: '1.5px solid var(--ds-color-primary-subtle, rgba(2, 132, 199, 0.3))', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--ds-color-text-muted, #94A3B8)', marginBottom: '4px' }}>Discount (%):</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[0, 5, 10, 15, 20].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscountPercent(d)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: discountPercent === d ? 'var(--ds-color-primary, #0284C7)' : 'var(--ds-color-surface-hover, rgba(255, 255, 255, 0.06))',
                        border: `1px solid ${discountPercent === d ? 'var(--ds-color-primary, #0284C7)' : 'var(--ds-color-border, rgba(255, 255, 255, 0.1))'}`,
                        color: discountPercent === d ? '#FFFFFF' : 'var(--ds-color-text-muted, #94A3B8)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--ds-color-text-muted, #94A3B8)', marginBottom: '4px' }}>Payment Mode:</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  style={{ width: '100%', padding: '6px 10px', backgroundColor: 'var(--ds-color-bg, #0b0f17)', border: '1px solid var(--ds-color-border-strong, #334155)', borderRadius: '6px', color: 'var(--ds-color-text-primary, #FFF)', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  <option value="UPI">⚡ UPI / Dynamic QR</option>
                  <option value="CASH">💵 Cash at Desk</option>
                  <option value="CARD">💳 POS Card Swipe</option>
                  <option value="DUE">⏳ Balance Due / Credit</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--ds-color-text-muted, #94A3B8)', marginBottom: '4px' }}>Amount Collected (₹):</label>
                <input
                  type="number"
                  placeholder={`Full: ₹${netPayable}`}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', backgroundColor: 'var(--ds-color-bg, #0b0f17)', border: '1px solid var(--ds-color-primary, #0284c7)', borderRadius: '6px', color: 'var(--ds-color-text-primary, #38BDF8)', fontSize: '0.85rem', fontWeight: 900 }}
                />
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>Net Bill Amount:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ds-color-success, #10B981)' }}>₹{netPayable}</div>
                {balanceDue > 0 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-danger, #EF4444)', fontWeight: 800 }}>Due: ₹{balanceDue}</div>
                )}
              </div>
            </div>

            {/* Bottom Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateBill}
                disabled={!linkedReport || selectedCodes.length === 0}
                style={{
                  backgroundColor: (!linkedReport || selectedCodes.length === 0) ? 'var(--ds-color-secondary, #475569)' : 'var(--ds-color-success, #10B981)',
                  color: '#FFFFFF',
                  borderColor: (!linkedReport || selectedCodes.length === 0) ? 'var(--ds-color-secondary, #475569)' : 'var(--ds-color-success, #10B981)',
                  fontWeight: 900,
                  padding: '8px 24px',
                  cursor: (!linkedReport || selectedCodes.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {!linkedReport ? '🔒 Select Completed Report to Bill' : '🧾 Generate Invoice for Finalized Report →'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PRINTABLE 80MM THERMAL RECEIPT */}
        {step === 'RECEIPT' && (
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--ds-color-bg, #020617)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <div
              id="printable-lab-receipt"
              style={{
                width: '320px',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                padding: '16px 18px',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                lineHeight: 1.35,
                borderRadius: '6px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)'
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>APEX PATHOLOGY LABORATORY</div>
                <div style={{ fontSize: '0.65rem' }}>ISO 15189 / NABL ACCREDITED</div>
                <div style={{ fontSize: '0.65rem' }}>📞 +91 98222 33445 | Civil Lines, Nagpur</div>
                <div style={{ fontWeight: 900, marginTop: '4px' }}>CASH / POS BILL RECEIPT</div>
              </div>

              <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
                <div>Bill No: <strong>{billNumber}</strong></div>
                <div>Date: {nowFormatted}</div>
                <div>Patient: <strong>{patientName}</strong> ({patientAge}Y/{patientGender[0]})</div>
                <div>UHID: <strong>{patientMrn}</strong></div>
                <div>Ref Doctor: {referringDoctor}</div>
                <div>Accession: <strong>{accessionNumber}</strong></div>
                {isPackageApplicable && activePackage && (
                  <div style={{ backgroundColor: '#F1F5F9', padding: '3px 6px', marginTop: '4px', border: '1px solid #CBD5E1' }}>
                    Bundle: <strong>{activePackage.name}</strong>
                  </div>
                )}
              </div>

              <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>
                  <span>INVESTIGATION</span>
                  <span>PRICE</span>
                </div>
                {selectedTests.map((t) => (
                  <div key={t.code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', margin: '2px 0' }}>
                    <span style={{ maxWidth: '210px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    <span>₹{t.mrp}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discount ({discountPercent}%):</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '0.85rem', marginTop: '4px' }}>
                  <span>NET TOTAL:</span>
                  <span>₹{netPayable}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mode ({paymentMode}):</span>
                  <span>₹{effectivePaid}</span>
                </div>
                {balanceDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                    <span>BALANCE DUE:</span>
                    <span>₹{balanceDue}</span>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.65rem' }}>
                <div>Report Delivery via WhatsApp on: {patientPhone}</div>
                <div style={{ marginTop: '4px', fontWeight: 700 }}>*** PLEASE PROCEED TO PHLEBOTOMY CHAIR ***</div>
                <div style={{ marginTop: '2px' }}>Thank You for Choosing Apex Lab!</div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setStep('BILLING')}
                style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.2))', color: 'var(--ds-color-text-secondary, #CBD5E1)', cursor: 'pointer', fontWeight: 700 }}
              >
                ← Back to Billing
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                style={{ padding: '8px 24px', borderRadius: '8px', backgroundColor: 'var(--ds-color-primary, #0284C7)', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)' }}
              >
                <span>🖨️</span>
                <span>Print 80mm Thermal Receipt</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: 'var(--ds-color-success, #10B981)', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: 900 }}
              >
                ✓ Done (Go to Phlebotomy)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
