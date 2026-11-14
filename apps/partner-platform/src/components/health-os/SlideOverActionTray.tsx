import React, { useState } from 'react';
import { type ActivePatientTab, type SlideOverTrayType } from './health-os-types.js';
import './health-os.css';

export interface SlideOverActionTrayProps {
  trayType: SlideOverTrayType;
  patient: ActivePatientTab | null;
  onClose: () => void;
  onSuccessAction?: (message: string) => void;
}

const COMMON_RX_PRESETS = [
  {
    name: 'Viral Fever & Bodyache Protocol',
    drugs: [
      { name: 'Paracetamol 650mg', generic: 'Paracetamol', dosage: '1 tablet TID (after meals)', duration: '3 days', costBrand: 45, costGeneric: 8 },
      { name: 'Pantoprazole 40mg', generic: 'Pantoprazole', dosage: '1 tablet OD (empty stomach)', duration: '5 days', costBrand: 95, costGeneric: 18 },
      { name: 'Cetirizine 10mg', generic: 'Cetirizine HCl', dosage: '1 tablet at bedtime', duration: '3 days', costBrand: 35, costGeneric: 6 },
    ],
  },
  {
    name: 'Essential Hypertension Starter',
    drugs: [
      { name: 'Telmisartan 40mg', generic: 'Telmisartan', dosage: '1 tablet OD morning', duration: '30 days', costBrand: 220, costGeneric: 45 },
      { name: 'Amlodipine 5mg', generic: 'Amlodipine Besylate', dosage: '1 tablet OD morning', duration: '30 days', costBrand: 80, costGeneric: 15 },
    ],
  },
  {
    name: 'Upper Respiratory Infection Protocol',
    drugs: [
      { name: 'Azithromycin 500mg', generic: 'Azithromycin', dosage: '1 tablet OD (post lunch)', duration: '3 days', costBrand: 160, costGeneric: 42 },
      { name: 'Levocetirizine + Montelukast', generic: 'Levocetirizine 5mg + Montelukast 10mg', dosage: '1 tablet HS', duration: '5 days', costBrand: 180, costGeneric: 38 },
    ],
  },
];

const LAB_INVESTIGATION_PANELS = [
  { code: 'LAB-CBC', name: 'Complete Blood Count (CBC) with Automated Differential', sample: 'Whole Blood EDTA (Lavender)', price: 350, turnaround: '2 hours' },
  { code: 'LAB-LFT', name: 'Comprehensive Liver Function Profile (LFT)', sample: 'Serum (Gold SST)', price: 650, turnaround: '4 hours' },
  { code: 'LAB-KFT', name: 'Kidney Function Test & Electrolytes (KFT)', sample: 'Serum (Gold SST)', price: 550, turnaround: '4 hours' },
  { code: 'LAB-LIPID', name: 'Lipid Profile Extended (Cholesterol, Triglycerides, HDL, LDL)', sample: 'Fasting Serum (Gold SST)', price: 600, turnaround: '6 hours' },
  { code: 'LAB-HBA1C', name: 'Glycated Hemoglobin (HbA1c) HPLC Gold Standard', sample: 'Whole Blood EDTA (Lavender)', price: 500, turnaround: '3 hours' },
  { code: 'LAB-TROP-I', name: 'Cardiac Troponin-I Quantitative (High Sensitivity STAT)', sample: 'Plasma Heparin (Green)', price: 1200, turnaround: '45 mins' },
];

export const SlideOverActionTray: React.FC<SlideOverActionTrayProps> = ({
  trayType,
  patient,
  onClose,
  onSuccessAction,
}) => {
  // Quick Rx state
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [useJanAushadhi, setUseJanAushadhi] = useState<boolean>(true);
  const [rxNotes, setRxNotes] = useState<string>('Drink plenty of boiled water. Avoid oily food.');

  // Quick Lab state
  const [selectedLabCodes, setSelectedLabCodes] = useState<string[]>(['LAB-CBC', 'LAB-KFT']);
  const [isStatPriority, setIsStatPriority] = useState<boolean>(patient?.acuity === 'EMERGENCY');

  // Quick Vitals state
  const [vitalsSys, setVitalsSys] = useState<string>(patient?.vitals?.bp ? patient.vitals.bp.split('/')[0] || '120' : '120');
  const [vitalsDia, setVitalsDia] = useState<string>(patient?.vitals?.bp ? patient.vitals.bp.split('/')[1] || '80' : '80');
  const [vitalsPulse, setVitalsPulse] = useState<string>(String(patient?.vitals?.pulse || 72));
  const [vitalsSpo2, setVitalsSpo2] = useState<string>(String(patient?.vitals?.spo2 || 98));
  const [vitalsTemp, setVitalsTemp] = useState<string>(String(patient?.vitals?.temp || 98.6));

  // Instant Settle state
  const [paymentMode, setPaymentMode] = useState<'UPI_QR' | 'CASH' | 'CARD'>('UPI_QR');
  const [amountReceived, setAmountReceived] = useState<string>('650');
  const billTotal = 650;

  if (!trayType) return null;

  const handleSignRx = () => {
    onSuccessAction?.(
      `Prescription signed and added to ${patient?.patientName || 'patient'}'s chart with digital signature.`
    );
    onClose();
  };

  const handleDispatchLab = () => {
    onSuccessAction?.(
      `Dispatched ${selectedLabCodes.length} diagnostic investigations for ${patient?.patientName || 'patient'} to Pathology LIMS.`
    );
    onClose();
  };

  const handleSaveVitals = () => {
    onSuccessAction?.(
      `Live vitals (BP ${vitalsSys}/${vitalsDia}, HR ${vitalsPulse}, SpO2 ${vitalsSpo2}%) recorded for ${patient?.patientName || 'patient'}.`
    );
    onClose();
  };

  const handleCompleteSettle = () => {
    onSuccessAction?.(
      `Settled bill ₹${billTotal} via ${paymentMode}. Thermal receipt slip generated.`
    );
    onClose();
  };

  return (
    <div className="hos-tray-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="hos-tray-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Tray Header */}
        <div className="hos-tray-header">
          <div className="hos-tray-title-group">
            <span className="hos-tray-icon">
              {trayType === 'QUICK_RX'
                ? '💊'
                : trayType === 'QUICK_LAB'
                ? '🧪'
                : trayType === 'QUICK_VITALS'
                ? '❤️'
                : '💳'}
            </span>
            <div>
              <h3 className="hos-tray-title">
                {trayType === 'QUICK_RX' && 'Quick Prescribe (Smart Rx)'}
                {trayType === 'QUICK_LAB' && 'Order Diagnostic Lab Panels'}
                {trayType === 'QUICK_VITALS' && 'Record Clinical Vitals (NEWS2)'}
                {trayType === 'INSTANT_SETTLE' && 'Instant Counter Settlement POS'}
              </h3>
              <span className="hos-tray-sub">
                Target: <strong>{patient?.patientName || 'Selected Patient'}</strong> ({patient?.mrn || 'OPD'})
              </span>
            </div>
          </div>
          <button type="button" className="hos-tray-close-btn" onClick={onClose} title="Close Tray (ESC)">
            ✕
          </button>
        </div>

        {/* Tray Body */}
        <div className="hos-tray-body">
          {/* ========================================================
              1. QUICK RX PRESCRIPTION TRAY
              ======================================================== */}
          {trayType === 'QUICK_RX' && (
            <div className="hos-tray-content">
              {/* Allergy Warning Pill if patient has allergies */}
              {patient?.allergies && patient.allergies.length > 0 && (
                <div className="hos-tray-warning-banner">
                  <span>⚠️</span>
                  <span>
                    <strong>Allergy Alert:</strong> Patient allergic to {patient.allergies.join(', ')}.
                    Automatic CDSS safety check active.
                  </span>
                </div>
              )}

              {/* Protocol Combos Tabs */}
              <div className="hos-tray-field-group">
                <label className="hos-tray-label">1-CLICK CLINICAL PROTOCOL COMBOS</label>
                <div className="hos-tray-preset-chips">
                  {COMMON_RX_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`hos-tray-preset-chip ${selectedPresetIndex === idx ? 'hos-tray-preset-chip-active' : ''}`}
                      onClick={() => setSelectedPresetIndex(idx)}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jan Aushadhi Generic Savings Switcher */}
              <div className="hos-tray-generic-toggle">
                <div>
                  <span className="hos-generic-toggle-title">Jan Aushadhi (PMBJP) Generic Equivalent</span>
                  <span className="hos-generic-toggle-sub">75% cost reduction for patient under National Health Mission</span>
                </div>
                <input
                  type="checkbox"
                  checked={useJanAushadhi}
                  onChange={(e) => setUseJanAushadhi(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>

              {/* Medication Line Items */}
              <div className="hos-tray-field-group">
                <label className="hos-tray-label">PRESCRIBED MEDICATIONS</label>
                <div className="hos-tray-rx-list">
                  {COMMON_RX_PRESETS[selectedPresetIndex]?.drugs.map((drug, i) => (
                    <div key={i} className="hos-tray-rx-item">
                      <div className="hos-tray-rx-main">
                        <span className="hos-tray-rx-name">
                          {useJanAushadhi ? drug.generic : drug.name}
                        </span>
                        <span className="hos-tray-rx-dosage">{drug.dosage} • {drug.duration}</span>
                      </div>
                      <div className="hos-tray-rx-price">
                        {useJanAushadhi ? (
                          <>
                            <span className="hos-tray-price-discounted">₹{drug.costGeneric}</span>
                            <span className="hos-tray-price-mrp">₹{drug.costBrand}</span>
                          </>
                        ) : (
                          <span className="hos-tray-price-discounted">₹{drug.costBrand}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinician Advice */}
              <div className="hos-tray-field-group">
                <label className="hos-tray-label">DIETARY & CLINICAL ADVICE</label>
                <input
                  type="text"
                  className="hos-tray-input"
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                />
              </div>

              {/* Action Trigger */}
              <div className="hos-tray-actions">
                <button type="button" className="hos-tray-primary-btn" onClick={handleSignRx}>
                  <span>✍️</span>
                  <span>Sign & Add to Prescription</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              2. QUICK LAB REQUISITION TRAY
              ======================================================== */}
          {trayType === 'QUICK_LAB' && (
            <div className="hos-tray-content">
              {/* Urgency Priority Selector */}
              <div className="hos-tray-priority-wrap">
                <span className="hos-tray-label">PRIORITY / STAT URGENCY</span>
                <div className="hos-tray-priority-buttons">
                  <button
                    type="button"
                    className={`hos-tray-prio-btn ${!isStatPriority ? 'hos-tray-prio-routine' : ''}`}
                    onClick={() => setIsStatPriority(false)}
                  >
                    ROUTINE (Standard Turnaround)
                  </button>
                  <button
                    type="button"
                    className={`hos-tray-prio-btn ${isStatPriority ? 'hos-tray-prio-stat' : ''}`}
                    onClick={() => setIsStatPriority(true)}
                  >
                    🚨 STAT CRITICAL (Immediate Lab Escalation)
                  </button>
                </div>
              </div>

              {/* Investigation Panels Grid */}
              <div className="hos-tray-field-group">
                <label className="hos-tray-label">SELECT DIAGNOSTIC PANELS</label>
                <div className="hos-tray-panels-grid">
                  {LAB_INVESTIGATION_PANELS.map((panel) => {
                    const isChecked = selectedLabCodes.includes(panel.code);
                    return (
                      <div
                        key={panel.code}
                        className={`hos-tray-panel-card ${isChecked ? 'hos-tray-panel-selected' : ''}`}
                        onClick={() => {
                          setSelectedLabCodes((prev) =>
                            isChecked ? prev.filter((c) => c !== panel.code) : [...prev, panel.code]
                          );
                        }}
                      >
                        <div className="hos-panel-checkbox">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                        <div className="hos-panel-details">
                          <span className="hos-panel-name">{panel.name}</span>
                          <span className="hos-panel-sample">Sample: {panel.sample}</span>
                        </div>
                        <div className="hos-panel-meta">
                          <span className="hos-panel-price">₹{panel.price}</span>
                          <span className="hos-panel-tat">TAT: {panel.turnaround}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Barcode Dispatch */}
              <div className="hos-tray-actions">
                <button
                  type="button"
                  className="hos-tray-primary-btn"
                  onClick={handleDispatchLab}
                  disabled={selectedLabCodes.length === 0}
                >
                  <span>🧪</span>
                  <span>Dispatch Requisition ({selectedLabCodes.length} Tests)</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              3. QUICK VITALS & NEWS2 ACUITY
              ======================================================== */}
          {trayType === 'QUICK_VITALS' && (
            <div className="hos-tray-content">
              <div className="hos-tray-field-group">
                <label className="hos-tray-label">TRIAGE OBSERVATION ENTRY</label>
                <div className="hos-vitals-entry-grid">
                  <div className="hos-vitals-field">
                    <span>Systolic BP (mmHg)</span>
                    <input
                      type="number"
                      value={vitalsSys}
                      onChange={(e) => setVitalsSys(e.target.value)}
                      className="hos-tray-input"
                    />
                  </div>

                  <div className="hos-vitals-field">
                    <span>Diastolic BP (mmHg)</span>
                    <input
                      type="number"
                      value={vitalsDia}
                      onChange={(e) => setVitalsDia(e.target.value)}
                      className="hos-tray-input"
                    />
                  </div>

                  <div className="hos-vitals-field">
                    <span>Pulse / Heart Rate (bpm)</span>
                    <input
                      type="number"
                      value={vitalsPulse}
                      onChange={(e) => setVitalsPulse(e.target.value)}
                      className="hos-tray-input"
                    />
                  </div>

                  <div className="hos-vitals-field">
                    <span>SpO2 Oxygen (%)</span>
                    <input
                      type="number"
                      value={vitalsSpo2}
                      onChange={(e) => setVitalsSpo2(e.target.value)}
                      className="hos-tray-input"
                    />
                  </div>

                  <div className="hos-vitals-field">
                    <span>Body Temp (°F)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalsTemp}
                      onChange={(e) => setVitalsTemp(e.target.value)}
                      className="hos-tray-input"
                    />
                  </div>
                </div>
              </div>

              {/* NEWS2 Real-Time Acuity Preview */}
              <div className="hos-vitals-news2-calc">
                <div className="hos-calc-row">
                  <span className="hos-calc-title">Calculated NEWS2 Score:</span>
                  <span className="hos-calc-score">
                    {Number(vitalsSys) > 160 || Number(vitalsSpo2) < 94 ? '6 (HIGH ACUITY)' : '1 (STABLE)'}
                  </span>
                </div>
                <span className="hos-calc-desc">
                  Adheres to National Early Warning Score (Royal College of Physicians standard).
                </span>
              </div>

              <div className="hos-tray-actions">
                <button type="button" className="hos-tray-primary-btn" onClick={handleSaveVitals}>
                  <span>💾</span>
                  <span>Commit Vitals to Patient Chart</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              4. INSTANT COUNTER SETTLEMENT (POS)
              ======================================================== */}
          {trayType === 'INSTANT_SETTLE' && (
            <div className="hos-tray-content">
              {/* Invoice Breakdown */}
              <div className="hos-tray-bill-summary">
                <div className="hos-bill-row">
                  <span>OPD Specialist Consultation Fee:</span>
                  <span>₹500.00</span>
                </div>
                <div className="hos-bill-row">
                  <span>Pharmacy Medications (Generic PMBJP):</span>
                  <span>₹120.00</span>
                </div>
                <div className="hos-bill-row">
                  <span>CGST / SGST (5% on Consumables):</span>
                  <span>₹30.00</span>
                </div>
                <div className="hos-bill-row hos-bill-total">
                  <span>Total Payable Amount:</span>
                  <span className="hos-bill-total-inr">₹{billTotal}.00</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="hos-tray-field-group">
                <label className="hos-tray-label">SETTLEMENT METHOD</label>
                <div className="hos-tray-mode-selector">
                  <button
                    type="button"
                    className={`hos-mode-btn ${paymentMode === 'UPI_QR' ? 'hos-mode-btn-active' : ''}`}
                    onClick={() => setPaymentMode('UPI_QR')}
                  >
                    <span>📱</span>
                    <span>Dynamic UPI QR</span>
                  </button>
                  <button
                    type="button"
                    className={`hos-mode-btn ${paymentMode === 'CASH' ? 'hos-mode-btn-active' : ''}`}
                    onClick={() => setPaymentMode('CASH')}
                  >
                    <span>💵</span>
                    <span>Cash Counter</span>
                  </button>
                  <button
                    type="button"
                    className={`hos-mode-btn ${paymentMode === 'CARD' ? 'hos-mode-btn-active' : ''}`}
                    onClick={() => setPaymentMode('CARD')}
                  >
                    <span>💳</span>
                    <span>Card / POS</span>
                  </button>
                </div>
              </div>

              {/* Dynamic QR Code Display */}
              {paymentMode === 'UPI_QR' && (
                <div className="hos-upi-qr-card">
                  <div className="hos-qr-code-box">
                    {/* High-Contrast SVG QR Mock */}
                    <div style={{ width: 140, height: 140, backgroundColor: '#ffffff', borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '3.5rem' }}>🏁</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#000000', marginTop: 2 }}>BHIM UPI • DOCSEARCH</span>
                    </div>
                  </div>
                  <span className="hos-qr-hint">Scan with Google Pay, PhonePe, or Paytm</span>
                  <span className="hos-qr-sub">Instant Webhook Auto-Settlement Active</span>
                </div>
              )}

              {/* Cash Change Calculator */}
              {paymentMode === 'CASH' && (
                <div className="hos-cash-calc-card">
                  <div className="hos-cash-field">
                    <span>Cash Handed Over (INR):</span>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="hos-tray-input"
                    />
                  </div>
                  <div className="hos-cash-change">
                    <span>Change Returnable:</span>
                    <span className="hos-change-val">
                      ₹{Math.max(0, Number(amountReceived) - billTotal)}.00
                    </span>
                  </div>
                </div>
              )}

              {/* Settle Action */}
              <div className="hos-tray-actions">
                <button type="button" className="hos-tray-primary-btn" onClick={handleCompleteSettle}>
                  <span>🖨️</span>
                  <span>Settle Bill & Print Thermal Slip</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
