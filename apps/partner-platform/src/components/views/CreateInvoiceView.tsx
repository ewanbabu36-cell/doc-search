import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  CreateInvoiceRequest,
  BillingChargeDto,
  BillingServiceCatalogDto
} from '@docsearch/api-contracts';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface FullPageLineItem {
  id: string;
  chargeId?: string | undefined;
  chargeItemId?: string | undefined;
  serviceCatalogId?: string | undefined;
  serviceCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRatePercent: number;
  taxAmount: number;
}

export interface CreateInvoiceViewProps {
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  pendingCharges?: BillingChargeDto[];
  services?: BillingServiceCatalogDto[];
  onBack: () => void;
  onSubmit: (request: CreateInvoiceRequest) => Promise<void>;
}

export const CreateInvoiceView: React.FC<CreateInvoiceViewProps> = ({
  tenantId,
  partnerId,
  organizationId,
  branchId,
  pendingCharges = [],
  services: _services = [],
  onBack,
  onSubmit
}) => {
  const safePendingCharges = Array.isArray(pendingCharges) ? pendingCharges : [];
  const partnerProfile = getUnifiedPartnerProfile();

  // Patient & Clinical Attributes
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorName, setDoctorName] = useState(() => partnerProfile.doctorName ? `${partnerProfile.doctorName}${partnerProfile.doctorDegree ? ` (${partnerProfile.doctorDegree})` : ''}` : 'Consulting Clinician');
  const [department, setDepartment] = useState(() => partnerProfile.doctorSpecialty || 'General OPD & Clinical Care');
  const [invoiceType, setInvoiceType] = useState<'OPD' | 'IPD' | 'DIAGNOSTICS' | 'PHARMACY' | 'EMERGENCY'>('OPD');
  const [selectedChargeId, setSelectedChargeId] = useState<string>('');
  const [dueDays, setDueDays] = useState('30');

  // Settlement & Payment Mode
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'DRAFT'>('PAID');
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [paymentReference, setPaymentReference] = useState<string>(() => `UPI-${Date.now().toString().slice(-6)}`);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [justification, setJustification] = useState('Commercial tax invoice generated at outpatient billing counter.');

  // Submitting / Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Line Items List
  const [items, setItems] = useState<FullPageLineItem[]>([
    {
      id: 'item-init-1',
      serviceCode: 'SRV-CONS-OPD',
      description: 'Consultation & Clinical Care',
      quantity: 1,
      unitPrice: 0.00,
      discountAmount: 0.00,
      taxRatePercent: 0,
      taxAmount: 0.00
    }
  ]);

  // Real API Query: Fetch live unbilled charges from API Gateway
  React.useEffect(() => {
    let isMounted = true;
    async function loadUnbilledCharges() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_auth_token') : null;
        const url = patientId
          ? `/api/v1/partner/billing/unbilled-charges?patientId=${encodeURIComponent(patientId)}`
          : '/api/v1/partner/billing/unbilled-charges';
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            const data = json.data;
            if (data.patientName && !patientName) setPatientName(data.patientName);
            if (data.patientMrn && !patientMrn) setPatientMrn(data.patientMrn);
            if (data.patientPhone && !patientPhone) setPatientPhone(data.patientPhone);
            if (Array.isArray(data.unbilledCharges) && data.unbilledCharges.length > 0) {
              const mapped: FullPageLineItem[] = data.unbilledCharges.map((ch: any, idx: number) => ({
                id: `charge-live-${idx}-${Date.now()}`,
                chargeId: ch.id,
                chargeItemId: ch.id,
                serviceCode: ch.serviceCode || 'SRV-01',
                description: ch.serviceName,
                quantity: ch.quantity || 1,
                unitPrice: ch.unitPrice || 0,
                discountAmount: 0,
                taxRatePercent: 0,
                taxAmount: 0
              }));
              setItems(mapped);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load unbilled charges from backend:', err);
      }
    }
    void loadUnbilledCharges();
    return () => { isMounted = false; };
  }, [patientId]);

  // Handle Charge Import
  const handleSelectCharge = (chargeId: string) => {
    setSelectedChargeId(chargeId);
    if (!chargeId) return;

    const ch = safePendingCharges.find((c) => c.id === chargeId);
    if (ch) {
      setPatientName(ch.patientName || '');
      setPatientMrn(ch.patientMrn || '');
      setPatientId(ch.patientId || '');
      if (ch.sourceDomain === 'PHARMACY') setInvoiceType('PHARMACY');
      else if ((ch.sourceDomain as string) === 'DIAGNOSTICS' || (ch.sourceDomain as string) === 'CLINICAL_INVESTIGATION') setInvoiceType('DIAGNOSTICS');

      const chItems = Array.isArray(ch.items) ? ch.items : [];
      if (chItems.length > 0) {
        setItems(
          chItems.map((it, idx) => ({
            id: it.id || `imported-${idx + 1}`,
            chargeId: ch.id,
            chargeItemId: it.id,
            serviceCatalogId: it.serviceCatalogId || undefined,
            serviceCode: it.serviceCode || 'SRV-GEN',
            description: it.description || 'Clinical Service',
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            discountAmount: Number(it.discountAmount) || 0,
            taxRatePercent: Number(it.taxAmount || 0) > 0 && Number(it.grossAmount || 0) > 0 ? Math.round((Number(it.taxAmount) / Number(it.grossAmount)) * 100) : 0,
            taxAmount: Number(it.taxAmount) || 0
          }))
        );
      }
    }
  };

  // Line item actions
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `custom-it-${Date.now()}`,
        serviceCode: 'SRV-CUSTOM',
        description: 'New Clinical Service / Procedure / Medicine',
        quantity: 1,
        unitPrice: 250.00,
        discountAmount: 0.00,
        taxRatePercent: 0,
        taxAmount: 0.00
      }
    ]);
  };

  const handleQuickAddService = (desc: string, code: string, price: number, taxPercent: number = 0) => {
    setItems((prev) => [
      ...prev,
      {
        id: `quick-${Date.now()}`,
        serviceCode: code,
        description: desc,
        quantity: 1,
        unitPrice: price,
        discountAmount: 0,
        taxRatePercent: taxPercent,
        taxAmount: (price * taxPercent) / 100
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setError('Invoice must contain at least one billable item.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof FullPageLineItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === 'unitPrice' || field === 'quantity' || field === 'taxRatePercent' || field === 'discountAmount') {
          const gross = (Number(updated.quantity || 1) * Number(updated.unitPrice || 0)) - Number(updated.discountAmount || 0);
          updated.taxAmount = gross > 0 ? parseFloat(((gross * Number(updated.taxRatePercent || 0)) / 100).toFixed(2)) : 0;
        }
        return updated;
      })
    );
  };

  // Financial calculations
  const grossSubtotal = items.reduce((s, it) => s + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
  const totalDiscount = items.reduce((s, it) => s + Number(it.discountAmount || 0), 0);
  const taxableAmount = Math.max(0, grossSubtotal - totalDiscount);
  const totalTax = items.reduce((s, it) => s + Number(it.taxAmount || 0), 0);
  const totalNetPayable = Math.max(0, taxableAmount + totalTax);

  // Cash change calculator
  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashNum - totalNetPayable);

  const handleSubmitInvoice = async () => {
    if (!patientName.trim() || !patientMrn.trim()) {
      setError('Patient Full Name and MRN are mandatory.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one line item before creating the invoice.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formattedItems = items.map((it) => ({
        chargeId: it.chargeId || (selectedChargeId ? selectedChargeId : undefined),
        chargeItemId: it.chargeItemId,
        serviceCatalogId: it.serviceCatalogId,
        serviceCode: it.serviceCode || '999311',
        description: it.description.trim() || 'Medical Healthcare Service',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discountAmount: Number(it.discountAmount) || 0,
        taxAmount: Number(it.taxAmount) || 0
      }));

      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId: patientId || '55555555-5555-4555-8555-555555555501',
        patientName: patientName.trim(),
        patientMrn: patientMrn.trim(),
        invoiceType,
        chargeIds: selectedChargeId ? [selectedChargeId] : [],
        items: formattedItems,
        dueDays: parseInt(dueDays, 10) || 30,
        paymentStatus,
        paymentMode: paymentStatus === 'PAID' ? paymentMode : undefined,
        paymentReference: paymentStatus === 'PAID' ? paymentReference.trim() : undefined,
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      } as any);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Navigation & Action Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: '#0f172a',
        padding: '1.25rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            ← Back to Invoices
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              🏥 Full-Page Commercial Tax Invoice Generator (POS Desk)
            </h1>
            <p style={{ margin: '3px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
              Fast Line Item Entry • GST Compliant • Dynamic Kitna Pay Karna Hai & Cash Tendered Counter
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Total Payable</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38bdf8' }}>
              ₹{totalNetPayable.toFixed(2)}
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleSubmitInvoice}
            disabled={isSubmitting}
            style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: 700 }}
          >
            {isSubmitting ? 'Creating Invoice...' : `✓ Settle & Issue Invoice (₹${totalNetPayable.toFixed(2)})`}
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Grid: Patient & Clinical Meta Information */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
            1. Patient & Clinical Consultation Details
          </h2>
          {safePendingCharges.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Import Charge:</span>
              <Select
                value={selectedChargeId}
                onChange={(e) => handleSelectCharge(e.target.value)}
                options={[
                  { value: '', label: '— Manual New Patient Bill —' },
                  ...safePendingCharges.map((ch) => ({
                    value: ch.id,
                    label: `${ch.chargeNumber} — ${ch.patientName} (₹${(Number(ch.grandTotal) || 0).toFixed(2)} [${ch.sourceDomain || 'CLINICAL'}])`
                  }))
                ]}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Patient Full Name *
            </label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Patient MRN # *
            </label>
            <Input
              value={patientMrn}
              onChange={(e) => setPatientMrn(e.target.value)}
              placeholder="e.g. MRN-2026-00891"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Contact Mobile (10-Digit Mobile)
            </label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={patientPhone}
              onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, '');
                if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                setPatientPhone(digits.slice(0, 10));
              }}
              placeholder="98765 43210"
              leftElement={<span style={{ fontWeight: 800, color: 'var(--ds-color-primary, #38BDF8)', fontSize: '0.75rem' }}>+91</span>}
              style={{ paddingLeft: '44px', fontFamily: 'monospace' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Attending Consultant
            </label>
            <Input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Sharma, MD"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Department
            </label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="General Medicine"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Invoice Classification *
            </label>
            <Select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as any)}
              options={[
                { value: 'OPD', label: 'Outpatient (OPD)' },
                { value: 'IPD', label: 'Inpatient (IPD)' },
                { value: 'DIAGNOSTICS', label: 'Diagnostics & Pathology' },
                { value: 'PHARMACY', label: 'Pharmacy & Dispensing' },
                { value: 'EMERGENCY', label: 'Emergency / Trauma' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Due Days (Payment Terms)
            </label>
            <Input
              type="number"
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              placeholder="30"
              required
            />
          </div>
        </div>
      </Card>

      {/* Quick Service / Procedure Catalog Bar */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
              ⚡ 1-Click Common Hospital Services & Diagnostic Tests Quick Add
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px' }}>
              Click any chip to add immediately to the invoice table below
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { label: '🩺 OPD Consultation', code: '999311', price: 500.00, tax: 0 },
            { label: '👨‍⚕️ Specialist Review', code: '999311', price: 800.00, tax: 0 },
            { label: '🩸 CBC Blood Test', code: '999312', price: 450.00, tax: 0 },
            { label: '🫀 12-Lead ECG', code: '999312', price: 350.00, tax: 0 },
            { label: '🩻 Digital Chest X-Ray', code: '999313', price: 650.00, tax: 0 },
            { label: '🔊 Ultrasound Abdomen', code: '999313', price: 1250.00, tax: 0 },
            { label: '🩹 Wound Dressing', code: '999314', price: 250.00, tax: 0 },
            { label: '💉 IV Infusion & Nursing', code: '999314', price: 400.00, tax: 0 },
            { label: '🛌 Daycare Bed Charge', code: '999319', price: 1500.00, tax: 0 },
            { label: '💊 Paracetamol 650 Strip (15)', code: '30049060', price: 35.00, tax: 12 }
          ].map((srv, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickAddService(srv.label.replace(/^[^\s]+\s/, ''), srv.code, srv.price, srv.tax)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#1e293b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e0f2fe';
                e.currentTarget.style.borderColor = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              <span>{srv.label}</span>
              <strong style={{ color: '#0284c7', marginLeft: '4px' }}>₹{srv.price}</strong>
            </button>
          ))}
        </div>
      </Card>

      {/* Main Full-Width Line Items Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              2. Billed Line Items & Clinical Tariff Schedule ({items.length})
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Cashier can directly edit description, quantity, rates, discounts or tax rates for any item
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Add Line Item
          </button>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '40px' }}>#</TableHead>
                <TableHead style={{ minWidth: '280px' }}>Service / Item Description *</TableHead>
                <TableHead style={{ width: '110px' }}>SAC/Code</TableHead>
                <TableHead style={{ width: '90px' }}>Qty</TableHead>
                <TableHead style={{ width: '130px' }}>Unit Rate (₹)</TableHead>
                <TableHead style={{ width: '110px' }}>Gross (₹)</TableHead>
                <TableHead style={{ width: '120px' }}>Disc (₹)</TableHead>
                <TableHead style={{ width: '110px' }}>GST %</TableHead>
                <TableHead style={{ width: '110px' }}>Tax (₹)</TableHead>
                <TableHead style={{ width: '130px', textAlign: 'right' }}>Net Amount (₹)</TableHead>
                <TableHead style={{ width: '60px', textAlign: 'center' }}>Del</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it, idx) => {
                const gross = Number(it.quantity || 1) * Number(it.unitPrice || 0);
                const net = gross - Number(it.discountAmount || 0) + Number(it.taxAmount || 0);

                return (
                  <TableRow key={it.id}>
                    <TableCell style={{ fontWeight: 700, color: '#64748b' }}>
                      {idx + 1}
                    </TableCell>

                    <TableCell>
                      <input
                        type="text"
                        value={it.description}
                        onChange={(e) => handleUpdateItem(it.id, 'description', e.target.value)}
                        placeholder="e.g. Doctor Consultation, Blood Test"
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          color: '#0f172a',
                          fontWeight: 500
                        }}
                        required
                      />
                    </TableCell>

                    <TableCell>
                      <input
                        type="text"
                        value={it.serviceCode}
                        onChange={(e) => handleUpdateItem(it.id, 'serviceCode', e.target.value)}
                        placeholder="999311"
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleUpdateItem(it.id, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.unitPrice}
                        onChange={(e) => handleUpdateItem(it.id, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && idx === items.length - 1) {
                            e.preventDefault();
                            handleAddItem();
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#0f172a'
                        }}
                      />
                    </TableCell>

                    <TableCell style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                      ₹{gross.toFixed(2)}
                    </TableCell>

                    <TableCell>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.discountAmount}
                        onChange={(e) => handleUpdateItem(it.id, 'discountAmount', Math.max(0, parseFloat(e.target.value) || 0))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && idx === items.length - 1) {
                            e.preventDefault();
                            handleAddItem();
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          color: '#16a34a',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <select
                        value={it.taxRatePercent}
                        onChange={(e) => handleUpdateItem(it.id, 'taxRatePercent', parseInt(e.target.value, 10) || 0)}
                        style={{
                          width: '100%',
                          padding: '7px 6px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.8rem'
                        }}
                      >
                        <option value={0}>0% (Exempt)</option>
                        <option value={5}>5% GST</option>
                        <option value={12}>12% GST</option>
                        <option value={18}>18% GST</option>
                      </select>
                    </TableCell>

                    <TableCell style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      ₹{Number(it.taxAmount || 0).toFixed(2)}
                    </TableCell>

                    <TableCell style={{ textAlign: 'right', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{net.toFixed(2)}
                    </TableCell>

                    <TableCell style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        disabled={items.length <= 1}
                        title="Delete Item"
                        style={{
                          backgroundColor: items.length <= 1 ? '#f1f5f9' : '#fee2e2',
                          border: '1px solid',
                          borderColor: items.length <= 1 ? '#e2e8f0' : '#fca5a5',
                          color: items.length <= 1 ? '#94a3b8' : '#dc2626',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        🗑
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={handleAddItem}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#0284c7',
              cursor: 'pointer'
            }}
          >
            + Add Another Row
          </button>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: '#64748b' }}>
            <div>Total Items: <strong style={{ color: '#0f172a' }}>{items.length}</strong></div>
            <div>Gross Subtotal: <strong style={{ color: '#0f172a' }}>₹{grossSubtotal.toFixed(2)}</strong></div>
            <div>Discount: <strong style={{ color: '#16a34a' }}>-₹{totalDiscount.toFixed(2)}</strong></div>
            <div>GST Tax: <strong style={{ color: '#0f172a' }}>+₹{totalTax.toFixed(2)}</strong></div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0284c7' }}>
              Net Bill: ₹{totalNetPayable.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Bottom 2-Column Grid: Settlement vs Financial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Settlement & Payment Collection */}
        <Card>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#166534' }}>
            3. Settlement & Payment Collection Desk
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Payment Status Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#166534' }}>Settlement Timing</span>
                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                  Immediate desk settlement vs outstanding receivable
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAID')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: paymentStatus === 'PAID' ? '#16a34a' : '#cbd5e1',
                    backgroundColor: paymentStatus === 'PAID' ? '#16a34a' : '#ffffff',
                    color: paymentStatus === 'PAID' ? '#ffffff' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Settle Now (PAID)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('DRAFT')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: paymentStatus === 'DRAFT' ? '#64748b' : '#cbd5e1',
                    backgroundColor: paymentStatus === 'DRAFT' ? '#64748b' : '#ffffff',
                    color: paymentStatus === 'DRAFT' ? '#ffffff' : '#475569',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  ⏱ Due Later (UNPAID)
                </button>
              </div>
            </div>

            {paymentStatus === 'PAID' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Payment Mode *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'UPI', label: '📱 UPI / QR Scan' },
                      { id: 'CASH', label: '💵 Cash Currency' },
                      { id: 'CARD', label: '💳 Credit / Debit Card' },
                      { id: 'NET_BANKING', label: '🌐 Online NetBanking' },
                      { id: 'INSURANCE', label: '🩻 TPA Cashless' },
                      { id: 'CHEQUE', label: '🏦 Cheque / DD' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: paymentMode === mode.id ? '#0284c7' : '#cbd5e1',
                          backgroundColor: paymentMode === mode.id ? '#0284c7' : '#ffffff',
                          color: paymentMode === mode.id ? '#ffffff' : '#334155',
                          fontWeight: paymentMode === mode.id ? 700 : 500,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Transaction / Reference ID
                    </label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. UPI-TXN-94021"
                    />
                  </div>

                  {paymentMode === 'CASH' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
                        Cash Tendered (Jama Kiya) (₹)
                      </label>
                      <Input
                        type="number"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        placeholder={`e.g. ${Math.ceil(totalNetPayable / 500) * 500}`}
                      />
                      {cashNum > 0 && (
                        <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>
                          Change Due (Wapas Dena Hai): ₹{changeDue.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Audit Justification / Cashier Remarks *
              </label>
              <Input
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Reason for invoice creation"
                required
              />
            </div>
          </div>
        </Card>

        {/* Right Column: Financial Settlement & Kitna Pay Karna Hai Banner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Kitna Pay Karna Hai Banner Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            color: '#ffffff',
            border: '1px solid #334155',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: 700 }}>
              Kitna Pay Karna Hai (Total Net Payable)
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.03em', margin: '4px 0' }}>
              ₹{totalNetPayable.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              {items.length} billed items • All taxes and discounts computed
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Counter Action:</span>
              <span style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 800,
                backgroundColor: paymentStatus === 'PAID' ? '#166534' : '#991b1b',
                color: '#ffffff'
              }}>
                {paymentStatus === 'PAID' ? `✓ COLLECT ₹${totalNetPayable.toFixed(2)} NOW` : `⏱ MARK ₹${totalNetPayable.toFixed(2)} AS DUE`}
              </span>
            </div>
          </div>

          {/* Tax Invoice Breakdown Card */}
          <Card>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Official Financial Settlement Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Gross Subtotal:</span>
                <span>₹{grossSubtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>Discounts Authorized (-):</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Taxable Value:</span>
                <span>₹{taxableAmount.toFixed(2)}</span>
              </div>
              {totalTax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>GST Taxes (+):</span>
                  <span>+₹{totalTax.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', borderTop: '2px solid #e2e8f0', paddingTop: '0.5rem', color: '#0f172a' }}>
                <span>Total Net Bill:</span>
                <span>₹{totalNetPayable.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                <span>Amount Paid:</span>
                <span>₹{paymentStatus === 'PAID' ? totalNetPayable.toFixed(2) : '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: paymentStatus === 'PAID' ? '#16a34a' : '#dc2626', fontWeight: 800 }}>
                <span>Balance Due:</span>
                <span>₹{paymentStatus === 'PAID' ? '0.00' : totalNetPayable.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button
                variant="primary"
                onClick={handleSubmitInvoice}
                disabled={isSubmitting}
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 800 }}
              >
                {isSubmitting ? 'Creating Invoice...' : `✓ Settle & Issue Invoice (₹${totalNetPayable.toFixed(2)})`}
              </Button>
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
                style={{ width: '100%' }}
              >
                Cancel & Return
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
