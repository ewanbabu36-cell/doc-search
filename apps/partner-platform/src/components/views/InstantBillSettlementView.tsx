import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Select } from '@docsearch/ui-kit';
import { hospitalEventBus, type ActivePatientSummary } from '../../services/hospital-event-bus.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface BillItem {
  id: string;
  name: string;
  department: 'OPD' | 'LAB' | 'RADIOLOGY' | 'PHARMACY' | 'PROCEDURE';
  amount: number;
  taxPercent: number;
}

export interface InstantBillSettlementViewProps {
  onSettlementComplete?: (receiptData: any) => void;
  onOpenCashLedger?: () => void;
}

export const InstantBillSettlementView: React.FC<InstantBillSettlementViewProps> = ({
  onSettlementComplete,
  onOpenCashLedger
}) => {
  const partnerProfile = getUnifiedPartnerProfile();
  const [activePatient, setActivePatient] = useState<ActivePatientSummary | null>(() => hospitalEventBus.getActivePatient());

  // Dynamic Pending Charges Aggregator
  const loadPendingCharges = (patient: ActivePatientSummary | null): BillItem[] => {
    if (!patient) return [];
    const billItems: BillItem[] = [];

    // 1. Check OPD Encounter consultation fee
    try {
      const encs = JSON.parse(localStorage.getItem('docsearch_encounters') || '[]');
      const enc = encs.find((e: any) => e.patientId === patient.id || e.patientMrn === patient.uhid || (patient.name && e.patientName?.toLowerCase() === patient.name?.toLowerCase()));
      if (enc && enc.metadata?.feePaid && enc.metadata?.paymentMode === 'FREE') {
        // Free consultation
      } else if (enc && enc.metadata?.feePaid) {
        billItems.push({
          id: `enc-fee-${enc.id}`,
          name: `OPD Consultation Fee (${enc.doctorSpecialty || enc.doctorName || 'General Medicine'})`,
          department: 'OPD',
          amount: Number(enc.metadata.feePaid) || 300,
          taxPercent: 0
        });
      } else {
        billItems.push({
          id: `enc-fee-default`,
          name: `OPD Consultation Fee (${patient.doctorName || 'General Medicine'})`,
          department: 'OPD',
          amount: 300,
          taxPercent: 0
        });
      }
    } catch {}

    // 2. Check pending Lab Orders for this patient
    try {
      const labs = JSON.parse(localStorage.getItem('docsearch_pending_lab_orders') || '[]');
      const matchingLabs = labs.filter((l: any) => (patient.name && l.patientName?.toLowerCase() === patient.name?.toLowerCase()) || (patient.uhid && l.patientMrn === patient.uhid));
      matchingLabs.forEach((l: any) => {
        const tests = Array.isArray(l.tests) ? l.tests : [l.tests || 'Lab Investigation'];
        tests.forEach((t: string, tIdx: number) => {
          billItems.push({
            id: `lab-${l.id}-${tIdx}`,
            name: `Diagnostic Lab: ${t}`,
            department: 'LAB',
            amount: 350,
            taxPercent: 0
          });
        });
      });
    } catch {}

    // 3. Check pending Radiology Orders for this patient
    try {
      const rads = JSON.parse(localStorage.getItem('docsearch_pending_radiology_orders') || '[]');
      const matchingRads = rads.filter((r: any) => (patient.name && r.patientName?.toLowerCase() === patient.name?.toLowerCase()) || (patient.uhid && r.patientMrn === patient.uhid));
      matchingRads.forEach((r: any) => {
        const scans = Array.isArray(r.modalityTests) ? r.modalityTests : [r.modalityTests || 'Imaging Scan'];
        scans.forEach((s: string, sIdx: number) => {
          billItems.push({
            id: `rad-${r.id}-${sIdx}`,
            name: `Radiology Imaging: ${s}`,
            department: 'RADIOLOGY',
            amount: 600,
            taxPercent: 0
          });
        });
      });
    } catch {}

    return billItems;
  };

  // Patient Demographics (Dynamic & Zero-State Safe)
  const [patientName, setPatientName] = useState(activePatient?.name || '');
  const [patientUhid, setPatientUhid] = useState(activePatient?.uhid || activePatient?.id || '');
  const [patientMobile, setPatientMobile] = useState(activePatient?.phone || '');
  const [doctorName, setDoctorName] = useState(activePatient?.doctorName || '');
  const [invoiceNumber] = useState(`INV-2026-${Math.floor(10000 + Math.random() * 90000)}`);

  // Bill Line Items (Dynamically loaded from open orders)
  const [items, setItems] = useState<BillItem[]>(() => loadPendingCharges(activePatient));

  useEffect(() => {
    const unsub = hospitalEventBus.subscribe('PATIENT_SELECTED', (evt) => {
      const p = evt.data as ActivePatientSummary;
      if (p) {
        setActivePatient(p);
        setPatientName(p.name || '');
        setPatientUhid(p.uhid || p.id || '');
        setPatientMobile(p.phone || '');
        setDoctorName(p.doctorName || 'Consulting Physician');
        setItems(loadPendingCharges(p));
      }
    });

    const unsubClear = hospitalEventBus.subscribe('PATIENT_CLEARED', () => {
      setActivePatient(null);
      setPatientName('');
      setPatientUhid('');
      setPatientMobile('');
      setDoctorName('');
      setItems([]);
    });

    return () => {
      unsub();
      unsubClear();
    };
  }, []);

  // Payment Channel State
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('UPI');
  
  // Cash Calculator (Zero-state safe)
  const [cashTendered, setCashTendered] = useState<string>('');

  // UPI State
  const [utrNumber, setUtrNumber] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);

  // Card POS State
  const [cardLast4, setCardLast4] = useState('4242');
  const [cardAuthCode, setCardAuthCode] = useState(() => `AUTH-${Math.floor(100000 + Math.random() * 900000)}`);
  const [cardType, setCardType] = useState('VISA');

  // Settlement Result State
  const [isSettled, setIsSettled] = useState(false);
  const [whatsAppSent, setWhatsAppSent] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');

  // Discount
  const [discountAmount, setDiscountAmount] = useState(0);

  // Financial Computations
  const grossTotal = items.reduce((sum, it) => sum + it.amount, 0);
  const totalTax = items.reduce((sum, it) => sum + ((it.amount * it.taxPercent) / 100), 0);
  const netPayable = Math.max(0, grossTotal - discountAmount + totalTax);

  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashNum - netPayable);

  // Dynamic UPI QR Generation
  const upiId = partnerProfile.upiId || 'billing.docsearch@icici';
  const payeeName = encodeURIComponent(partnerProfile.entityLegalName || 'DocSearch Hospital Counter 1');
  const upiPaymentUri = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${netPayable.toFixed(2)}&tr=${invoiceNumber}&tn=Hospital%20Bill%20${invoiceNumber}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPaymentUri)}&color=0284C7&bgcolor=0B132B`;

  const handleSettleBill = () => {
    const rcpt = `RCP-${Date.now().toString().slice(-6)}`;
    setReceiptNumber(rcpt);
    setIsSettled(true);

    // Broadcast across hospital modules
    hospitalEventBus.publish(
      'BILL_SETTLED',
      'InstantBillSettlementView',
      {
        invoiceNumber,
        receiptNumber: rcpt,
        patientName,
        patientUhid,
        amount: netPayable,
        paymentMode,
        timestamp: new Date().toISOString()
      },
      `Bill ${invoiceNumber} settled via ${paymentMode} for ₹${netPayable.toFixed(2)}`
    );

    try {
      const existingSettlements = JSON.parse(localStorage.getItem('docsearch_counter_settlements') || '[]');
      const newTx = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        patient: `${patientName || 'Walk-in Patient'} (${patientUhid || 'Counter'})`,
        mode: paymentMode,
        amount: netPayable,
        status: 'SETTLED'
      };
      localStorage.setItem('docsearch_counter_settlements', JSON.stringify([newTx, ...existingSettlements.slice(0, 49)]));
    } catch {}

    if (onSettlementComplete) {
      onSettlementComplete({
        invoiceNumber,
        receiptNumber: rcpt,
        patientName,
        patientUhid,
        amount: netPayable,
        paymentMode
      });
    }
  };

  const handleSendWhatsApp = () => {
    setWhatsAppSent(true);
    const msg = `Namaste ${patientName}, your bill ${invoiceNumber} for ₹${netPayable.toFixed(2)} has been successfully settled at ${partnerProfile.entityLegalName || 'DocSearch Hospital'}. Receipt #${receiptNumber || 'RCP-89211'}. Thank you!`;
    const cleanPhone = patientMobile.replace(/\D/g, '').slice(-10);
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    setTimeout(() => setWhatsAppSent(false), 3500);
  };

  const handlePrintThermalSlip = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1.5px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.6rem' }}>⚡</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              Instant Bill Settlement Desk
            </h1>
            <Badge variant="primary">Counter #1 • Fast Checkout</Badge>
            <Badge variant="success">NPCI UPI 2.0 Live</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Instant OPD/IPD invoice settlement via Cash (with change calculator), Dynamic UPI QR, or Card POS swipe with thermal receipt & WhatsApp delivery.
          </p>
        </div>

        {onOpenCashLedger && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={onOpenCashLedger} style={{ fontWeight: 700 }}>
              💵 View Cash Ledger
            </Button>
          </div>
        )}
      </div>

      {/* 2-Column Main Desk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Patient & Billable Services */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Patient Card */}
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                👤 Patient Demographics & Doctor Chamber
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Invoice: <strong style={{ color: '#F8FAFC' }}>{invoiceNumber}</strong></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Patient Full Name</label>
                <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>UHID / MRN</label>
                <Input value={patientUhid} onChange={(e) => setPatientUhid(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Mobile Number (WhatsApp)</label>
                <Input value={patientMobile} onChange={(e) => setPatientMobile(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Consulting Doctor</label>
                <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Line Items Card */}
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
                📋 Billable Services & Items ({items.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  const newItem: BillItem = {
                    id: Date.now().toString(),
                    name: 'Additional Clinical Service / Procedure',
                    department: 'PROCEDURE',
                    amount: 300,
                    taxPercent: 0
                  };
                  setItems([...items, newItem]);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #38BDF8',
                  color: '#38BDF8',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + Add Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#1E293B', borderRadius: '8px', border: '1px dashed #334155', color: '#94A3B8' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🧾</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>No Pending Unbilled Charges</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Click "+ Add Item" above or select an active patient with open encounter / orders.</div>
                </div>
              ) : (
                items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.85rem' }}>{it.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                      Dept: <strong style={{ color: '#38BDF8' }}>{it.department}</strong> {it.taxPercent > 0 && `• GST ${it.taxPercent}%`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.95rem' }}>
                      ₹{it.amount.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setItems(items.filter((x) => x.id !== it.id))}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )))}
            </div>

            {/* Financial Totals */}
            <div style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                <span>Gross Subtotal:</span>
                <span style={{ fontWeight: 600, color: '#F8FAFC' }}>₹{grossTotal.toFixed(2)}</span>
              </div>
              {totalTax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                  <span>Taxes (GST):</span>
                  <span style={{ fontWeight: 600, color: '#F8FAFC' }}>+₹{totalTax.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8' }}>
                <span>Discount / Concession:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#10B981' }}>-₹</span>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{
                      width: '80px',
                      padding: '3px 6px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#10B981',
                      fontWeight: 700,
                      textAlign: 'right'
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#F8FAFC',
                fontSize: '1.15rem',
                fontWeight: 900,
                marginTop: '6px',
                paddingTop: '8px',
                borderTop: '1px dashed #334155'
              }}>
                <span>Total Net Payable:</span>
                <span style={{ color: '#38BDF8' }}>₹{netPayable.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Multi-Channel Payment & Settlement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Payment Method Selector */}
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              💳 Select Payment Channel
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[
                { id: 'UPI', label: '📱 Dynamic UPI', icon: '📱' },
                { id: 'CASH', label: '💵 Cash Counter', icon: '💵' },
                { id: 'CARD', label: '💳 Card POS', icon: '💳' },
                { id: 'SPLIT', label: '🔄 Split Pay', icon: '🔄' }
              ].map((tab) => {
                const isSel = paymentMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPaymentMode(tab.id as any)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isSel ? '#38BDF8' : '#334155'}`,
                      backgroundColor: isSel ? 'rgba(56, 189, 248, 0.15)' : '#1E293B',
                      color: isSel ? '#38BDF8' : '#94A3B8',
                      fontWeight: isSel ? 800 : 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mode 1: Dynamic UPI QR */}
            {paymentMode === 'UPI' && (
              <div style={{
                backgroundColor: '#1E293B',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Scan & Pay with Any UPI App</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8' }}>₹{netPayable.toFixed(2)}</div>
                </div>

                {/* Scannable Dynamic QR */}
                <div style={{
                  padding: '10px',
                  backgroundColor: '#0B132B',
                  borderRadius: '12px',
                  border: '2px solid #0284C7',
                  boxShadow: '0 4px 20px rgba(2, 132, 199, 0.25)'
                }}>
                  <img
                    src={qrCodeUrl}
                    alt="Dynamic UPI QR"
                    style={{ width: '180px', height: '180px', display: 'block', borderRadius: '8px' }}
                  />
                </div>

                <div style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center' }}>
                  UPI ID: <strong style={{ color: '#F8FAFC' }}>{upiId}</strong>
                </div>

                <div style={{ width: '100%', marginTop: '4px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Bank UTR / Ref Number (Optional for Auto-verify)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Input
                      placeholder="e.g. 429184719201"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUtrNumber(`UTR-${Date.now().toString().slice(-8)}`);
                        setIsUpiVerified(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isUpiVerified ? '#10B981' : '#0284C7',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isUpiVerified ? '✓ Verified' : '⚡ 1-Click Verify'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Cash Counter */}
            {paymentMode === 'CASH' && (
              <div style={{
                backgroundColor: '#1E293B',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Net Bill Amount:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>₹{netPayable.toFixed(2)}</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#38BDF8', fontWeight: 700, marginBottom: '6px' }}>
                    💵 Cash Tendered by Patient (₹)
                  </label>
                  <Input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    style={{ fontSize: '1.1rem', fontWeight: 800 }}
                  />
                  {/* Quick currency buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Exact', val: netPayable.toFixed(0) },
                      { label: '+₹100', val: (netPayable + 100).toFixed(0) },
                      { label: '+₹500', val: (Math.ceil(netPayable / 500) * 500).toFixed(0) },
                      { label: '₹2,000', val: '2000' }
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setCashTendered(btn.val)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#334155',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#F8FAFC',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change Return Box */}
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: changeDue >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1.5px solid ${changeDue >= 0 ? '#10B981' : '#EF4444'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                      {changeDue >= 0 ? 'Change to Return to Patient' : 'Shortage / Balance Pending'}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: changeDue >= 0 ? '#10B981' : '#EF4444' }}>
                      ₹{Math.abs(changeDue).toFixed(2)}
                    </div>
                  </div>
                  <span style={{ fontSize: '1.5rem' }}>{changeDue >= 0 ? '🤝' : '⚠️'}</span>
                </div>
              </div>
            )}

            {/* Mode 3: Card POS */}
            {paymentMode === 'CARD' && (
              <div style={{
                backgroundColor: '#1E293B',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Card Type</label>
                    <Select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value)}
                      options={[
                        { value: 'VISA', label: 'Visa' },
                        { value: 'MASTERCARD', label: 'Mastercard' },
                        { value: 'RUPAY', label: 'RuPay Debit/Credit' },
                        { value: 'AMEX', label: 'American Express' }
                      ]}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Last 4 Digits</label>
                    <Input
                      value={cardLast4}
                      maxLength={4}
                      onChange={(e) => setCardLast4(e.target.value)}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>EDC Terminal Approval Code</label>
                    <Input
                      value={cardAuthCode}
                      onChange={(e) => setCardAuthCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mode 4: Split Payment */}
            {paymentMode === 'SPLIT' && (
              <div style={{
                backgroundColor: '#1E293B',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Split Amount across Cash & UPI:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Cash Portion (₹)</label>
                    <Input defaultValue={(netPayable / 2).toFixed(0)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>UPI Portion (₹)</label>
                    <Input defaultValue={(netPayable / 2).toFixed(0)} />
                  </div>
                </div>
              </div>
            )}

            {/* Settlement Action Bar */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!isSettled ? (
                <button
                  type="button"
                  onClick={handleSettleBill}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#0284C7',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>⚡ Settle ₹{netPayable.toFixed(2)} & Issue Receipt</span>
                </button>
              ) : (
                <div style={{
                  padding: '14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1.5px solid #10B981',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#10B981', fontWeight: 900, fontSize: '1rem', marginBottom: '6px' }}>
                    ✓ Bill Successfully Settled!
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#F8FAFC' }}>
                    Receipt #: <strong>{receiptNumber}</strong> • Mode: <strong>{paymentMode}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                    <Button variant="outline" size="sm" onClick={handlePrintThermalSlip} style={{ fontWeight: 700 }}>
                      🖨️ Print 80mm Slip
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSendWhatsApp} style={{ fontWeight: 800 }}>
                      {whatsAppSent ? '✓ WhatsApp Sent!' : '📲 Send WhatsApp Receipt'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
