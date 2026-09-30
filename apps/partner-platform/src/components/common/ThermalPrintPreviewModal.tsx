import React, { useState } from 'react';
import type { ActivePatientSummary } from '../../services/hospital-event-bus.js';
import { uniqueIdentifierService } from '../../services/unique-identifier-service.js';
import { ProfileUpdateRequiredAlertModal } from './ProfileUpdateRequiredAlertModal.js';
import { checkPartnerProfileStatus, type MissingProfileField } from '../../utils/partnerProfileGuard.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export type ThermalPrintType = 'TOKEN' | 'RECEIPT' | 'WRISTBAND' | 'PRESCRIPTION';

export interface ThermalPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: ThermalPrintType;
  patient?: ActivePatientSummary | null;
  hospitalName?: string;
}

export const ThermalPrintPreviewModal: React.FC<ThermalPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  initialType = 'TOKEN',
  patient,
  hospitalName
}) => {
  const partnerProfile = getUnifiedPartnerProfile();
  const effectiveHospitalName = (hospitalName && hospitalName !== 'METROPOLITAN MULTISPECIALTY HOSPITAL')
    ? hospitalName
    : (partnerProfile.entityLegalName || 'DocSearch Healthcare Partner');

  const [printType, setPrintType] = useState<ThermalPrintType>(initialType);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm' | 'A4'>('80mm');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isProfileGuardAlertOpen, setIsProfileGuardAlertOpen] = useState(false);
  const [profileMissingFields, setProfileMissingFields] = useState<MissingProfileField[]>([]);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <aside
        role="button"
        tabIndex={0}
        aria-label="Restore Print Station"
        onClick={() => setIsMinimized(false)}
        className="ds-minimized-dock-pill ds-spring-press"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1.5px solid #0284C7',
          borderRadius: '9999px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(2, 132, 199, 0.4)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backdropFilter: 'blur(20px)',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>🖨️</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
          Thermal Print Station — Click to Restore
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0 4px'
          }}
        >
          ✕
        </button>
      </aside>
    );
  }

  const currentPatient = patient || {
    id: 'pat-default',
    uhid: 'UHID-2026-0812',
    name: 'Rahul Verma',
    age: 42,
    gender: 'MALE',
    bloodGroup: 'B+',
    bedNumber: 'ICU-04',
    wardName: 'Critical Care Unit',
    opdToken: 14,
    doctorName: partnerProfile.doctorName || 'Attending Physician',
    diagnosis: 'Routine Clinical Evaluation',
    allergies: ['None Reported']
  };

  const handleTriggerPrint = () => {
    const status = checkPartnerProfileStatus();
    if (!status.isUpdated) {
      setProfileMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return;
    }
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: isMaximized ? 'stretch' : 'center',
        justifyContent: isMaximized ? 'stretch' : 'center',
        padding: isMaximized ? 0 : '16px'
      }}
    >
      <div
        style={{
          width: isMaximized ? '100vw' : '740px',
          maxWidth: '100%',
          height: isMaximized ? '100vh' : 'auto',
          maxHeight: isMaximized ? '100vh' : '92vh',
          backgroundColor: '#0F172A',
          border: isMaximized ? 'none' : '1.5px solid #0284C7',
          borderRadius: isMaximized ? 0 : '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Modal Top Bar */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          title="Double click to toggle Maximize / Restore"
          style={{
            padding: '14px 20px',
            backgroundColor: '#1E293B',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>🖨️</span>
            <div>
              <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>
                Thermal Slip & Hardware Print Station
              </strong>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                ESC/POS Thermal Format • A4 Laser Document • Zero Driver Setup
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              aria-label="Minimize to dock pill"
              title="Minimize to dock pill (—)"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              —
            </button>
            <button
              type="button"
              aria-label={isMaximized ? "Restore down" : "Maximize full screen"}
              title={isMaximized ? "Restore down (🗗)" : "Maximize full screen (⛶)"}
              onClick={(e) => {
                e.stopPropagation();
                setIsMaximized(!isMaximized);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              {isMaximized ? '🗗' : '⛶'}
            </button>
            <button
              type="button"
              aria-label="Close"
              title="Close (Esc)"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0 6px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Format Selector Tab Ribbon */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#0B1120',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setPrintType('TOKEN');
                setPaperWidth('80mm');
              }}
              style={{
                backgroundColor: printType === 'TOKEN' ? '#0284C7' : 'rgba(255,255,255,0.06)',
                color: printType === 'TOKEN' ? '#FFF' : '#94A3B8',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⏱️ OPD Token (80mm)
            </button>

            <button
              type="button"
              onClick={() => {
                setPrintType('RECEIPT');
                setPaperWidth('80mm');
              }}
              style={{
                backgroundColor: printType === 'RECEIPT' ? '#0284C7' : 'rgba(255,255,255,0.06)',
                color: printType === 'RECEIPT' ? '#FFF' : '#94A3B8',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🧾 Pharmacy POS Bill
            </button>

            <button
              type="button"
              onClick={() => {
                setPrintType('WRISTBAND');
                setPaperWidth('58mm');
              }}
              style={{
                backgroundColor: printType === 'WRISTBAND' ? '#0284C7' : 'rgba(255,255,255,0.06)',
                color: printType === 'WRISTBAND' ? '#FFF' : '#94A3B8',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🪪 IPD Wristband
            </button>

            <button
              type="button"
              onClick={() => {
                setPrintType('PRESCRIPTION');
                setPaperWidth('A4');
              }}
              style={{
                backgroundColor: printType === 'PRESCRIPTION' ? '#0284C7' : 'rgba(255,255,255,0.06)',
                color: printType === 'PRESCRIPTION' ? '#FFF' : '#94A3B8',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🩺 Doctor e-Rx (A4)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Paper:</span>
            <select
              value={paperWidth}
              onChange={(e) => setPaperWidth(e.target.value as any)}
              style={{
                backgroundColor: '#1E293B',
                color: '#CBD5E1',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '0.75rem'
              }}
            >
              <option value="80mm">80mm Thermal Slip (Epson/TVS)</option>
              <option value="58mm">58mm Thermal Mini</option>
              <option value="A4">A4 / Letter Standard</option>
            </select>
          </div>
        </div>

        {/* Printable Viewport Container (Simulated White Thermal Paper) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: '#020617',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            id="thermal-print-area"
            style={{
              width: paperWidth === 'A4' ? '540px' : paperWidth === '80mm' ? '320px' : '240px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              fontFamily: 'monospace, Courier New, sans-serif',
              padding: '16px',
              borderRadius: '4px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              fontSize: '11px',
              lineHeight: 1.4
            }}
          >
            {/* Common Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 900, fontSize: '13px' }}>{effectiveHospitalName}</div>
              <div style={{ fontSize: '9px', marginTop: '2px' }}>{partnerProfile.facilityTagline || 'ABDM & STATUTORY COMPLIANT HEALTHCARE'}</div>
              <div style={{ fontSize: '9px' }}>
                {partnerProfile.officialAddress ? `${partnerProfile.officialAddress} • ` : ''}PH: {partnerProfile.contactPhone || 'Reception Desk'}
              </div>
              <div style={{ fontSize: '9px' }}>{new Date().toLocaleString()}</div>
            </div>

            {/* TOKEN VIEW */}
            {printType === 'TOKEN' && (
              <div>
                <div style={{ textAlign: 'center', margin: '12px 0' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>OPD CONSULTATION TOKEN</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '2px', margin: '4px 0' }}>
                    #{currentPatient.opdToken || 14}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>
                    ROOM 104 • CARDIOLOGY OPD
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0' }}>
                  <div><strong>UHID:</strong> {currentPatient.uhid}</div>
                  <div><strong>Patient:</strong> {currentPatient.name}</div>
                  <div><strong>Age/Sex:</strong> {currentPatient.age} Yrs / {currentPatient.gender}</div>
                  <div><strong>Doctor:</strong> {currentPatient.doctorName}</div>
                  <div><strong>Queue Status:</strong> 2 Patients Ahead</div>
                </div>

                <div style={{ textAlign: 'center', margin: '12px 0' }}>
                  <div style={{ fontSize: '8px', marginBottom: '6px' }}>[ Scan QR to Track Live OPD Queue on WhatsApp ]</div>
                  <div
                    style={{ display: 'inline-block' }}
                    dangerouslySetInnerHTML={{
                      __html: uniqueIdentifierService.generateQrCodeSvg(currentPatient.uhid, 3)
                    }}
                  />
                  <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '4px', letterSpacing: '0.5px' }}>
                    {currentPatient.uhid}
                  </div>
                </div>
              </div>
            )}

            {/* PHARMACY RECEIPT VIEW */}
            {printType === 'RECEIPT' && (
              <div>
                <div style={{ textAlign: 'center', margin: '6px 0', fontWeight: 800 }}>
                  TAX INVOICE / RETAIL PHARMACY CASH MEMO
                </div>
                <div style={{ fontSize: '9px', textAlign: 'center' }}>
                  DL No: {partnerProfile.pharmacyDrugLicense20B || 'FORM 20B/21B'}{partnerProfile.gstin ? ` • GSTIN: ${partnerProfile.gstin}` : ''}
                </div>

                <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', margin: '6px 0' }}>
                  <div><strong>Inv No:</strong> POS-2026-9821</div>
                  <div><strong>UHID:</strong> {currentPatient.uhid} ({currentPatient.name})</div>
                  <div><strong>Prescriber:</strong> {currentPatient.doctorName}</div>
                </div>

                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th>Item</th>
                      <th>Batch</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Telmisartan 40mg</td>
                      <td>B2409</td>
                      <td>30</td>
                      <td style={{ textAlign: 'right' }}>₹144.00</td>
                    </tr>
                    <tr>
                      <td>Atorvastatin 10mg</td>
                      <td>AT881</td>
                      <td>30</td>
                      <td style={{ textAlign: 'right' }}>₹210.00</td>
                    </tr>
                    <tr>
                      <td>Aspirin 75mg</td>
                      <td>AS102</td>
                      <td>30</td>
                      <td style={{ textAlign: 'right' }}>₹45.00</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ borderTop: '1px dashed #000', marginTop: '8px', paddingTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>₹399.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                    <span>CGST (6%) + SGST (6%):</span>
                    <span>₹47.88</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '12px', marginTop: '4px' }}>
                    <span>NET PAYABLE:</span>
                    <span>₹446.88</span>
                  </div>
                  <div style={{ fontSize: '9px', textAlign: 'right', marginTop: '2px' }}>PAID VIA DYNAMIC UPI</div>
                </div>

                <div style={{ fontSize: '8px', textAlign: 'center', marginTop: '10px', borderTop: '1px dashed #000', paddingTop: '4px' }}>
                  Schedule H Drugs dispensed against valid Rx only.<br />
                  Medicines once sold will not be returned without bill.
                </div>
              </div>
            )}

            {/* WRISTBAND VIEW */}
            {printType === 'WRISTBAND' && (
              <div style={{ border: '2px solid #000', padding: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 900 }}>{currentPatient.name}</div>
                <div style={{ fontSize: '11px', fontWeight: 700 }}>UHID: {currentPatient.uhid}</div>
                <div>{currentPatient.age}Y / {currentPatient.gender} • BLOOD: <strong>{currentPatient.bloodGroup}</strong></div>
                <div>WARD: <strong>{currentPatient.wardName}</strong> • BED: <strong>{currentPatient.bedNumber}</strong></div>
                <div>ADM DATE: {new Date().toLocaleDateString()}</div>
                {currentPatient.allergies && currentPatient.allergies.length > 0 && currentPatient.allergies[0] !== 'None Reported' && (
                  <div style={{ backgroundColor: '#000', color: '#FFF', padding: '2px 4px', fontWeight: 900, marginTop: '4px' }}>
                    ALLERGY: {currentPatient.allergies.join(', ')}
                  </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: uniqueIdentifierService.generateCode128Svg(currentPatient.uhid, {
                        height: 36,
                        barWidth: 1.4,
                        showText: true
                      })
                    }}
                  />
                </div>
              </div>
            )}

            {/* DOCTOR PRESCRIPTION VIEW */}
            {printType === 'PRESCRIPTION' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '6px' }}>
                  <div>
                    <strong style={{ fontSize: '12px' }}>{currentPatient.doctorName}</strong>
                    <div style={{ fontSize: '9px' }}>
                      {partnerProfile.doctorDegree || 'Registered Medical Practitioner'} • Reg No: {partnerProfile.doctorRegNo || 'Verified'}
                    </div>
                    <div style={{ fontSize: '9px' }}>{partnerProfile.doctorSpecialty || 'General OPD & Clinical Care'}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '9px' }}>
                    <div>Date: {new Date().toLocaleDateString()}</div>
                    <div>UHID: <strong>{currentPatient.uhid}</strong></div>
                  </div>
                </div>

                <div style={{ margin: '8px 0', fontSize: '10px' }}>
                  <div><strong>Patient:</strong> {currentPatient.name}, {currentPatient.age}y/{currentPatient.gender} | Blood Group: {currentPatient.bloodGroup}</div>
                  <div><strong>Clinical Diagnosis:</strong> {currentPatient.diagnosis}</div>
                  {currentPatient.allergies && <div><strong>Known Allergies:</strong> {currentPatient.allergies.join(', ')}</div>}
                </div>

                <div style={{ fontSize: '16px', fontWeight: 900, margin: '8px 0' }}>℞</div>

                <ol style={{ paddingLeft: '18px', margin: '4px 0', fontSize: '10px' }}>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>Tab. Telmisartan 40 mg</strong> — 1 tablet once daily (Morning after breakfast) for 30 days.
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>Tab. Rosuvastatin 10 mg</strong> — 1 tablet at bedtime for 30 days.
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>Tab. Ecospirin 75 mg</strong> — 1 tablet post-lunch for 30 days.
                  </li>
                </ol>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #000', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: uniqueIdentifierService.generateQrCodeSvg(currentPatient.uhid, 2)
                      }}
                    />
                    <div style={{ fontSize: '8px' }}>
                      ABDM Consent Mode: Patient ABHA Linked<br />
                      Digitally Signed EMR • UHID: {currentPatient.uhid}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #000', width: '120px', marginBottom: '2px' }} />
                    <div style={{ fontSize: '9px', fontWeight: 700 }}>Authorized Medical Signature</div>
                  </div>
                </div>
              </div>
            )}

            {/* Common Footer */}
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '8px', borderTop: '1px dashed #000', paddingTop: '4px' }}>
              POWERED BY DOCSEARCH ADVANCED AGENTIC HEALTHCARE OS
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#1E293B',
            borderTop: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Ready to print on default system printer or ESC/POS hardware spooler.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #64748B',
                color: '#CBD5E1',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleTriggerPrint}
              style={{
                backgroundColor: '#0284C7',
                border: 'none',
                color: '#FFFFFF',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <span>🖨️</span>
              <span>Print Slip Now</span>
            </button>
          </div>
        </div>
      </div>
      <ProfileUpdateRequiredAlertModal
        isOpen={isProfileGuardAlertOpen}
        onClose={() => setIsProfileGuardAlertOpen(false)}
        blockedActionName={`Thermal ${printType} Slip`}
        missingFields={profileMissingFields}
      />
    </div>
  );
};
