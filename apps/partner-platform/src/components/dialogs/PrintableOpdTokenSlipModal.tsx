import React, { useState } from 'react';
import { Button } from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface PrintableOpdTokenSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenNumber: string;
  patientName: string;
  patientMrn?: string | undefined;
  patientMobile?: string | undefined;
  doctorName?: string | undefined;
  departmentName?: string | undefined;
  roomNumber?: string | undefined;
  facilityName?: string | undefined;
  estimatedWaitMinutes?: number | undefined;
  currentTokenServing?: number | string | undefined;
  onPrintThermal?: () => void;
}

export const PrintableOpdTokenSlipModal: React.FC<PrintableOpdTokenSlipModalProps> = ({
  isOpen,
  onClose,
  tokenNumber,
  patientName,
  patientMrn = 'UHID-2026-8812',
  patientMobile = '+91 98765 43210',
  doctorName = 'Dr. Rajesh Sharma, MD (Med)',
  departmentName = 'General Medicine & Diabetology',
  roomNumber = 'Room 104',
  facilityName = 'Apex Medicity Multi-Speciality Hospital & Trauma Centre',
  estimatedWaitMinutes = 12,
  currentTokenServing = 11,
  onPrintThermal
}) => {
  const [activeTab, setActiveTab] = useState<'thermal_slip' | 'whatsapp_preview'>('thermal_slip');
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTokenServingNum = typeof currentTokenServing === 'number'
    ? currentTokenServing
    : parseInt(String(currentTokenServing).replace(/\D/g, ''), 10) || 11;
  const parsedMyToken = parseInt(tokenNumber.replace(/\D/g, ''), 10) || 14;
  const patientsAhead = Math.max(0, parsedMyToken - currentTokenServingNum);
  const trackerUrl = `https://docsearch.health/?view=track-token&token=${encodeURIComponent(tokenNumber)}&name=${encodeURIComponent(patientName)}&doc=${encodeURIComponent(doctorName)}&room=${encodeURIComponent(roomNumber)}`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(trackerUrl)}&color=000000&bgcolor=FFFFFF`;

  const handlePrint = () => {
    if (onPrintThermal) {
      onPrintThermal();
    }
    setPrintSuccess(true);
    window.print();
    setTimeout(() => setPrintSuccess(false), 2500);
  };

  const handleSendWhatsApp = () => {
    setWhatsappSent(true);
    hospitalEventBus.publish(
      'OPTIMISTIC_ACTION_DISPATCHED',
      'OpdTokenSlipModal',
      {
        tokenNumber,
        patientName,
        patientMobile,
        trackerUrl,
        sentAt: new Date().toISOString()
      },
      `📲 WhatsApp Token Dispatch: Token #${tokenNumber} sent to ${patientName} (${patientMobile}) with live queue tracking link.`
    );

    const cleanPhone = patientMobile.replace(/\D/g, '').slice(-10);
    const text = encodeURIComponent(
      `*Namaste ${patientName}*,\n\n` +
      `Your OPD Token is confirmed at *${facilityName}*.\n\n` +
      `🎫 *Token Number: #${tokenNumber}*\n` +
      `🩺 *Doctor:* ${doctorName}\n` +
      `🏥 *Department:* ${departmentName}\n` +
      `📍 *Chamber:* ${roomNumber}\n` +
      `⏳ *Currently Serving:* #${currentTokenServing} (${patientsAhead} patients ahead)\n` +
      `⏱️ *Est. Wait Time:* ~${estimatedWaitMinutes} mins\n\n` +
      `👉 *Track Your Live Queue Position (No App Needed):*\n${trackerUrl}\n\n` +
      `_Please proceed to ${roomNumber} when your token is called._`
    );

    window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
    setTimeout(() => setWhatsappSent(false), 3500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-thermal-token, #printable-thermal-token * {
            visibility: visible !important;
          }
          #printable-thermal-token {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: #FFF !important;
            color: #000 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
          color: '#F8FAFC',
          maxHeight: '94vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🎫</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC' }}>
                OPD Fast-Track Token Slip &amp; Live Radar
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Zero-App WhatsApp Journey • 80mm Thermal Receipt • Dynamic QR
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.3rem',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* View Toggle Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('thermal_slip')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'thermal_slip' ? '#0284C7' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'thermal_slip' ? '#FFF' : '#94A3B8'
            }}
          >
            🖨️ 80mm Thermal Slip Print
          </button>
          <button
            onClick={() => setActiveTab('whatsapp_preview')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'whatsapp_preview' ? '#10B981' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'whatsapp_preview' ? '#FFF' : '#94A3B8'
            }}
          >
            📱 Patient WhatsApp Radar Preview
          </button>
        </div>

        {/* TAB 1: Thermal Slip */}
        {activeTab === 'thermal_slip' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
            <div
              id="printable-thermal-token"
              style={{
                width: '100%',
                maxWidth: '340px',
                backgroundColor: '#FFFFFF',
                color: '#111827',
                padding: '18px 16px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                border: '1px dashed #CBD5E1',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textAlign: 'center'
              }}
            >
              {/* Slip Header */}
              <div style={{ borderBottom: '1px dashed #94A3B8', paddingBottom: '8px' }}>
                <div style={{ fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  {facilityName}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                  NABH Accredited • ABDM Integrated Facility
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                  {new Date().toLocaleDateString('en-IN')} • {new Date().toLocaleTimeString('en-IN')}
                </div>
              </div>

              {/* Big Token Number */}
              <div style={{ padding: '6px 0', borderBottom: '1px dashed #94A3B8' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>
                  OPD QUEUE TOKEN
                </div>
                <div style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1.1, color: '#0F172A' }}>
                  #{tokenNumber}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>
                  {patientsAhead} Patients Ahead • Est: ~{estimatedWaitMinutes} Mins
                </div>
              </div>

              {/* Patient & Doctor Metadata */}
              <div style={{ textAlign: 'left', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed #94A3B8', paddingBottom: '8px' }}>
                <div><strong>Patient:</strong> {patientName}</div>
                <div><strong>MRN/UHID:</strong> {patientMrn}</div>
                <div><strong>Doctor:</strong> {doctorName}</div>
                <div><strong>Dept:</strong> {departmentName}</div>
                <div><strong>Room:</strong> <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>{roomNumber}</span></div>
              </div>

              {/* QR Code Container */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '6px 0' }}>
                <img
                  src={qrSvgUrl}
                  alt="OPD Live Queue QR"
                  style={{ width: '130px', height: '130px', border: '1px solid #E2E8F0', padding: '4px', borderRadius: '6px' }}
                />
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#047857' }}>
                  📱 Scan QR for Live Queue Radar
                </div>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>
                  Track wait time on your phone without waiting in lobby
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px dashed #94A3B8', paddingTop: '6px', fontSize: '0.62rem', color: '#94A3B8' }}>
                DocSearch Healthcare OS • www.docsearch.health
              </div>
            </div>

            {/* Print & Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
              <Button
                variant="primary"
                onClick={handlePrint}
                style={{
                  backgroundColor: '#0284C7',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🖨️</span>
                <span>{printSuccess ? 'Printing...' : 'Print 80mm Slip (Silent / Thermal)'}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleSendWhatsApp}
                style={{
                  borderColor: '#10B981',
                  color: '#34D399',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📲</span>
                <span>{whatsappSent ? 'Opening WhatsApp...' : 'Send on WhatsApp'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: WhatsApp Live Radar Preview */}
        {activeTab === 'whatsapp_preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>📲</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#6EE7B7' }}>
                  Zero-App WhatsApp Automation
                </div>
                <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                  Patient receives instant interactive token link. No app download required.
                </div>
              </div>
            </div>

            {/* WhatsApp Message Bubble Simulation */}
            <div
              style={{
                backgroundColor: '#075E54',
                color: '#FFF',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: '6px' }}>
                🏥 {facilityName}
              </div>
              <p style={{ margin: '0 0 8px' }}>
                Namaste <strong>{patientName}</strong>, your OPD appointment is confirmed.
              </p>
              <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                <div>🎫 <strong>Token:</strong> #{tokenNumber}</div>
                <div>🩺 <strong>Doctor:</strong> {doctorName}</div>
                <div>📍 <strong>Chamber:</strong> {roomNumber}</div>
                <div>⏳ <strong>Status:</strong> {patientsAhead} patients ahead (Now Serving: #{currentTokenServing})</div>
              </div>
              <div style={{ backgroundColor: '#128C7E', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'pointer' }}>
                <a
                  href={trackerUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#FFFFFF', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <span>📡 Open Live Queue Radar</span>
                  <span>➔</span>
                </a>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleSendWhatsApp}
              style={{
                backgroundColor: '#10B981',
                borderColor: '#10B981',
                fontWeight: 800,
                padding: '12px'
              }}
            >
              📲 Dispatch WhatsApp Message Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
