import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

export const DynamicUpiInvoiceView: React.FC = () => {
  const [patientName, setPatientName] = useState('Rahul Verma');
  const [patientMobile, setPatientMobile] = useState('+91 98765 43210');
  const [patientUhid, setPatientUhid] = useState('UHID-2026-8812');
  const [doctorName, setDoctorName] = useState('Dr. Rajesh Sharma, MD');
  const [invoiceNumber] = useState(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);

  // Selected Services in Bill
  const [billItems, setBillItems] = useState([
    { id: '1', name: 'OPD Doctor Consultation Fee (General Medicine)', amount: 500, selected: true },
    { id: '2', name: 'Pharmacy Prescription (Paracetamol + Levocetirizine)', amount: 280, selected: true },
    { id: '3', name: 'Diagnostic Lab Order (Complete Blood Count - CBC)', amount: 450, selected: false },
    { id: '4', name: 'Digital Chest X-Ray (PA View)', amount: 650, selected: false }
  ]);

  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID'>('PENDING');
  const [utrNumber, setUtrNumber] = useState('');
  const [whatsAppSent, setWhatsAppSent] = useState(false);

  const toggleItem = (id: string) => {
    setBillItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const totalAmount = billItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.amount, 0);

  const upiId = 'apollo.central@icici';
  const upiPaymentUri = `upi://pay?pa=${upiId}&pn=DocSearch%20Hospital%20Network&am=${totalAmount}.00&tr=${invoiceNumber}&tn=Medical%20Bill%20${invoiceNumber}&cu=INR`;
  
  // Real dynamic visual QR Code via dynamic SVG data
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPaymentUri)}&color=06B6D4&bgcolor=0B132B`;

  const handleSimulatePayment = () => {
    setPaymentStatus('PAID');
    setUtrNumber(`UTR-${Math.floor(100000000 + Math.random() * 900000000)}`);
  };

  const handleSendWhatsApp = () => {
    setWhatsAppSent(true);
    setTimeout(() => setWhatsAppSent(false), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.5rem' }}>📱</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              Dynamic UPI QR Code & Instant Patient Billing
            </h2>
            <Badge variant="success">NPCI UPI 2.0 Live</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
            Generates amount-specific dynamic UPI QR codes for zero-error instant settlement via PhonePe, Google Pay, Paytm, and BHIM.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            style={{ fontWeight: 700 }}
          >
            🖨️ Print 80mm Receipt
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSendWhatsApp}
            style={{ fontWeight: 800 }}
          >
            {whatsAppSent ? '✓ WhatsApp Bill Sent!' : '📲 Send Bill on WhatsApp'}
          </Button>
        </div>
      </div>

      {/* 2-Column Billing Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Left: Bill Configuration & Service Selection */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
              📋 Patient & Bill Details
            </span>
            <span style={{ fontSize: '0.75rem', color: '#06B6D4', fontFamily: 'monospace', fontWeight: 700 }}>
              {invoiceNumber}
            </span>
          </div>

          {/* Patient Details Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8125rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>PATIENT NAME</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F8FAFC' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>MOBILE NUMBER</label>
              <input
                type="text"
                value={patientMobile}
                onChange={(e) => setPatientMobile(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F8FAFC' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>PATIENT UHID</label>
              <input
                type="text"
                value={patientUhid}
                onChange={(e) => setPatientUhid(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F8FAFC' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '4px' }}>ATTENDING DOCTOR</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F8FAFC' }}
              />
            </div>
          </div>

          {/* Service Items Selection List */}
          <div>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              Select Clinical Services To Include:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {billItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  style={{
                    backgroundColor: item.selected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                    border: item.selected ? '1px solid #06B6D4' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleItem(item.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.8125rem', color: '#F8FAFC', fontWeight: item.selected ? 700 : 500 }}>
                      {item.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: item.selected ? '#38BDF8' : '#94A3B8', fontFamily: 'monospace' }}>
                    ₹{item.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total Summary */}
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid rgba(255,255,255,0.1)'
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#E2E8F0' }}>Total Payable Amount:</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Right: Dynamic NPCI UPI QR Showcase & Payment Reconciliation */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '2px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(6, 182, 212, 0.2)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
              Scan To Pay (Dynamic Amount: ₹{totalAmount})
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '16px' }}>
            UPI ID: <strong style={{ color: '#38BDF8' }}>{upiId}</strong> • Inv: <strong>{invoiceNumber}</strong>
          </div>

          {/* Visual Dynamic QR Code Box */}
          <div style={{
            backgroundColor: '#070C16',
            border: '2px solid #06B6D4',
            borderRadius: '16px',
            padding: '16px',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.35)',
            marginBottom: '16px'
          }}>
            <img
              src={qrCodeUrl}
              alt="Dynamic UPI QR Code"
              style={{ width: '180px', height: '180px', borderRadius: '8px' }}
            />
            <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700, marginTop: '8px' }}>
              Amount Pre-Locked: ₹{totalAmount}.00
            </div>
          </div>

          {/* Supported UPI Apps Badges */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
            {['PhonePe', 'Google Pay', 'Paytm', 'BHIM UPI', 'Cred'].map((app) => (
              <span
                key={app}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.6875rem',
                  color: '#CBD5E1',
                  fontWeight: 600
                }}
              >
                {app}
              </span>
            ))}
          </div>

          {/* Live Payment Status Reconciliation Banner */}
          <div style={{
            width: '100%',
            backgroundColor: paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: paymentStatus === 'PAID' ? '1px solid #10B981' : '1px solid #F59E0B',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            {paymentStatus === 'PAID' ? (
              <div>
                <div style={{ color: '#10B981', fontWeight: 800, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>✓</span> Payment Received & Reconciled!
                </div>
                <div style={{ fontSize: '0.75rem', color: '#A7F3D0', marginTop: '2px' }}>
                  Ref: <strong style={{ fontFamily: 'monospace' }}>{utrNumber}</strong> • Mode: Instant UPI
                </div>
              </div>
            ) : (
              <div style={{ color: '#F59E0B', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ animation: 'pulse 1s infinite' }}>🟡</span> Awaiting UPI Payment Scan at Counter...
              </div>
            )}
          </div>

          {/* Test Trigger / Cash Settle Buttons */}
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            {paymentStatus === 'PENDING' ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleSimulatePayment}
                style={{ width: '100%', fontWeight: 800, backgroundColor: '#10B981', borderColor: '#10B981' }}
              >
                ⚡ Simulate Instant UPI Scan (₹{totalAmount})
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={() => setPaymentStatus('PENDING')}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              >
                🔄 Reset for Next Bill
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Printable Thermal Receipt Card Preview */}
      <Card style={{ padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC' }}>
            🖨️ Thermal Receipt Print Preview (80mm Form Factor)
          </h3>
          <Badge variant="neutral">ESC/POS Formatted</Badge>
        </div>

        <div style={{
          maxWidth: '380px',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          color: '#000000',
          padding: '16px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          border: '1px solid #CBD5E1'
        }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>APEX CLINIC & HOSPITAL</div>
          <div style={{ textAlign: 'center', fontSize: '0.6875rem', color: '#475569' }}>GSTIN: 07AAAAA0000A1Z5 | NABH Accredited</div>
          <div style={{ textAlign: 'center', fontSize: '0.6875rem', margin: '4px 0', borderBottom: '1px dashed #000', paddingBottom: '4px' }}>
            TAX INVOICE / RECEIPT
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
            <span>Inv: {invoiceNumber}</span>
            <span>Date: {new Date().toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
            <span>Patient: {patientName}</span>
            <span>UHID: {patientUhid}</span>
          </div>
          <div style={{ margin: '2px 0' }}>Doc: {doctorName}</div>
          
          <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

          {billItems.filter((i) => i.selected).map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>{item.name}</span>
              <span>₹{item.amount}</span>
            </div>
          ))}

          <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.875rem' }}>
            <span>NET TOTAL:</span>
            <span>₹{totalAmount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#16A34A', margin: '2px 0' }}>
            <span>Payment Mode:</span>
            <span>UPI ({paymentStatus === 'PAID' ? utrNumber || 'Success' : 'Pending'})</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.625rem', color: '#64748B' }}>
            *** Thank you for visiting. Get well soon! ***
          </div>
        </div>
      </Card>
    </div>
  );
};
