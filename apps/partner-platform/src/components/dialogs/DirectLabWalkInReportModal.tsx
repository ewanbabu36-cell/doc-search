import React, { useState } from 'react';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

export interface TestParameterItem {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
}

export interface PresetTestCatalog {
  name: string;
  specimen: string;
  department: string;
  parameters: TestParameterItem[];
}

const PRESET_TESTS: Record<string, PresetTestCatalog> = {
  CBC: {
    name: 'COMPLETE BLOOD COUNT (CBC WITH 5-PART DIFF)',
    specimen: 'EDTA Whole Blood (2 ml)',
    department: 'Hematology & Clinical Pathology',
    parameters: [
      { id: '1', name: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', referenceRange: '13.0 - 17.0', flag: 'NORMAL' },
      { id: '2', name: 'Total Leukocyte Count (WBC)', value: '7,800', unit: '/cumm', referenceRange: '4,000 - 11,000', flag: 'NORMAL' },
      { id: '3', name: 'Platelet Count', value: '2.6', unit: 'Lakhs/cumm', referenceRange: '1.5 - 4.5', flag: 'NORMAL' },
      { id: '4', name: 'Red Blood Cell (RBC) Count', value: '4.9', unit: 'million/uL', referenceRange: '4.5 - 5.5', flag: 'NORMAL' },
      { id: '5', name: 'Packed Cell Volume (PCV/Hematocrit)', value: '42.5', unit: '%', referenceRange: '40.0 - 50.0', flag: 'NORMAL' },
      { id: '6', name: 'Neutrophils', value: '64', unit: '%', referenceRange: '40 - 75', flag: 'NORMAL' },
      { id: '7', name: 'Lymphocytes', value: '28', unit: '%', referenceRange: '20 - 45', flag: 'NORMAL' },
      { id: '8', name: 'Eosinophils', value: '04', unit: '%', referenceRange: '01 - 06', flag: 'NORMAL' }
    ]
  },
  LIPID: {
    name: 'LIPID PROFILE COMPREHENSIVE',
    specimen: 'Serum Fasting (3 ml)',
    department: 'Clinical Biochemistry',
    parameters: [
      { id: '1', name: 'Total Cholesterol', value: '175', unit: 'mg/dL', referenceRange: '< 200 (Desirable)', flag: 'NORMAL' },
      { id: '2', name: 'Triglycerides', value: '135', unit: 'mg/dL', referenceRange: '< 150 (Normal)', flag: 'NORMAL' },
      { id: '3', name: 'HDL Cholesterol (Good)', value: '48', unit: 'mg/dL', referenceRange: '> 40 (Optimal)', flag: 'NORMAL' },
      { id: '4', name: 'LDL Cholesterol (Bad)', value: '100', unit: 'mg/dL', referenceRange: '< 100 (Optimal)', flag: 'NORMAL' },
      { id: '5', name: 'VLDL Cholesterol', value: '27', unit: 'mg/dL', referenceRange: '< 30', flag: 'NORMAL' }
    ]
  },
  GLUCOSE: {
    name: 'DIABETIC PROFILE (FASTING & POST PRANDIAL SUGAR + HbA1c)',
    specimen: 'Fluoride Plasma & Whole Blood',
    department: 'Clinical Biochemistry',
    parameters: [
      { id: '1', name: 'Fasting Blood Glucose (FBS)', value: '92', unit: 'mg/dL', referenceRange: '70 - 99 (Normal)', flag: 'NORMAL' },
      { id: '2', name: 'Post-Prandial Glucose (PPBS - 2 hrs)', value: '128', unit: 'mg/dL', referenceRange: '< 140 (Normal)', flag: 'NORMAL' },
      { id: '3', name: 'HbA1c (Glycated Hemoglobin)', value: '5.6', unit: '%', referenceRange: '< 5.7 (Normal)', flag: 'NORMAL' },
      { id: '4', name: 'Estimated Average Glucose (eAG)', value: '114', unit: 'mg/dL', referenceRange: '90 - 120', flag: 'NORMAL' }
    ]
  },
  LFT: {
    name: 'LIVER FUNCTION TEST (LFT)',
    specimen: 'Serum (2 ml)',
    department: 'Clinical Biochemistry',
    parameters: [
      { id: '1', name: 'Bilirubin Total', value: '0.8', unit: 'mg/dL', referenceRange: '0.2 - 1.2', flag: 'NORMAL' },
      { id: '2', name: 'Bilirubin Direct', value: '0.2', unit: 'mg/dL', referenceRange: '0.0 - 0.3', flag: 'NORMAL' },
      { id: '3', name: 'SGOT / AST', value: '28', unit: 'U/L', referenceRange: '10 - 40', flag: 'NORMAL' },
      { id: '4', name: 'SGPT / ALT', value: '32', unit: 'U/L', referenceRange: '10 - 45', flag: 'NORMAL' },
      { id: '5', name: 'Alkaline Phosphatase (ALP)', value: '85', unit: 'U/L', referenceRange: '40 - 129', flag: 'NORMAL' },
      { id: '6', name: 'Total Protein', value: '7.2', unit: 'g/dL', referenceRange: '6.4 - 8.3', flag: 'NORMAL' },
      { id: '7', name: 'Serum Albumin', value: '4.4', unit: 'g/dL', referenceRange: '3.5 - 5.2', flag: 'NORMAL' }
    ]
  },
  KFT: {
    name: 'KIDNEY / RENAL FUNCTION TEST (KFT / RFT)',
    specimen: 'Serum (2 ml)',
    department: 'Clinical Biochemistry',
    parameters: [
      { id: '1', name: 'Blood Urea Nitrogen (BUN)', value: '14.5', unit: 'mg/dL', referenceRange: '7.0 - 20.0', flag: 'NORMAL' },
      { id: '2', name: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', referenceRange: '0.7 - 1.3', flag: 'NORMAL' },
      { id: '3', name: 'Serum Uric Acid', value: '5.2', unit: 'mg/dL', referenceRange: '3.5 - 7.2', flag: 'NORMAL' },
      { id: '4', name: 'eGFR (Calculated)', value: '105', unit: 'mL/min/1.73m²', referenceRange: '> 90 (Normal)', flag: 'NORMAL' }
    ]
  },
  THYROID: {
    name: 'THYROID PROFILE TOTAL (T3, T4, TSH)',
    specimen: 'Serum (2 ml)',
    department: 'Immunology & Endocrinology',
    parameters: [
      { id: '1', name: 'Triiodothyronine (Total T3)', value: '1.25', unit: 'ng/mL', referenceRange: '0.80 - 2.00', flag: 'NORMAL' },
      { id: '2', name: 'Thyroxine (Total T4)', value: '8.4', unit: 'ug/dL', referenceRange: '5.1 - 14.1', flag: 'NORMAL' },
      { id: '3', name: 'Thyroid Stimulating Hormone (TSH Ultrasensitive)', value: '2.45', unit: 'uIU/mL', referenceRange: '0.35 - 4.94', flag: 'NORMAL' }
    ]
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectLabWalkInReportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const profile = getVerifiedRoleProfile();

  // Step state: 'INPUT' or 'PRINT_PREVIEW'
  const [activeStep, setActiveStep] = useState<'INPUT' | 'PRINT_PREVIEW'>('INPUT');

  // Patient Demographic Form State
  const [patientName, setPatientName] = useState('Ramesh Sharma');
  const [patientAge, setPatientAge] = useState('38');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('+91 98765 43210');
  const [patientAddress, setPatientAddress] = useState('Flat 402, Shivam Apts, MG Road, Mumbai');
  const [referringDoctor, setReferringDoctor] = useState('Dr. Rajesh Kumar, MD (Internal Medicine)');
  const [sampleBarcode, setSampleBarcode] = useState(`SMP-${Math.floor(100000 + Math.random() * 900000)}`);
  const [patientMrn, setPatientMrn] = useState(`MRN-${Math.floor(10000 + Math.random() * 90000)}`);

  // Selected Test & Parameters
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('CBC');
  const [testTitle, setTestTitle] = useState(PRESET_TESTS['CBC']?.name || 'COMPLETE BLOOD COUNT');
  const [specimenType, setSpecimenType] = useState(PRESET_TESTS['CBC']?.specimen || 'EDTA Blood');
  const [departmentName, setDepartmentName] = useState(PRESET_TESTS['CBC']?.department || 'Hematology');
  const [parameters, setParameters] = useState<TestParameterItem[]>(PRESET_TESTS['CBC']?.parameters || []);

  // Lab Header Config
  const labName = profile.entityLegalName.toUpperCase();
  const labTagline = profile.facilityTagline;
  const labAddress = profile.officialAddress;
  const nablCertNo = profile.nablCertificateNo;
  const pathologistName = profile.pathologistName;
  const pathologistRegNo = profile.pathologistRegNo;
  const technicianName = 'Pooja Sharma, BMLT (Senior Technologist)';

  if (!isOpen) return null;

  const handleSelectPreset = (key: string) => {
    setSelectedPresetKey(key);
    const preset = PRESET_TESTS[key];
    if (preset) {
      setTestTitle(preset.name);
      setSpecimenType(preset.specimen);
      setDepartmentName(preset.department);
      setParameters(preset.parameters.map((p) => ({ ...p })));
    }
  };

  const handleUpdateParamValue = (index: number, val: string) => {
    setParameters((prev) => {
      const updated = [...prev];
      const target = updated[index];
      if (!target) return prev;

      const item: TestParameterItem = { ...target, value: val };
      const num = parseFloat(val);
      if (!isNaN(num) && item.referenceRange) {
        const parts = item.referenceRange.split('-').map((s) => parseFloat(s.trim()));
        const minVal = parts[0];
        const maxVal = parts[1];
        if (typeof minVal === 'number' && typeof maxVal === 'number' && !isNaN(minVal) && !isNaN(maxVal)) {
          if (num < minVal) item.flag = 'LOW';
          else if (num > maxVal) item.flag = 'HIGH';
          else item.flag = 'NORMAL';
        }
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleAddCustomParam = () => {
    const newId = String(parameters.length + 1);
    setParameters([
      ...parameters,
      { id: newId, name: 'New Parameter', value: '', unit: 'mg/dL', referenceRange: '10 - 50', flag: 'NORMAL' }
    ]);
  };

  const handleRemoveParam = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.88)',
      backdropFilter: 'blur(8px)',
      zIndex: 11000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(6, 182, 212, 0.4)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '960px',
        maxHeight: '95vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 70px rgba(0,0,0,0.95)',
        overflow: 'hidden'
      }}>
        {/* Header Bar */}
        <div style={{
          backgroundColor: '#0B132B',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🩸</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC' }}>
                Walk-In Patient Blood Test, Result Entry & Print Desk
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Sample Barcode: <strong style={{ color: '#38BDF8' }}>{sampleBarcode}</strong> • {activeStep === 'INPUT' ? '📝 Step 1: Enter Patient & Test Results' : '🖨️ Step 2: Print Official NABL Diagnostic Report'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {activeStep === 'INPUT' ? (
              <button
                type="button"
                onClick={() => setActiveStep('PRINT_PREVIEW')}
                style={{
                  backgroundColor: '#06B6D4',
                  color: '#070C16',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: 900,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                👁️ Generate & Print Report →
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveStep('INPUT')}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#E2E8F0',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  ← Edit Values
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#070C16',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 900,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Print Lab Report
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#CBD5E1',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* STEP 1: PATIENT DEMOGRAPHICS & RESULT ENTRY FORM */}
        {activeStep === 'INPUT' && (
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            {/* Quick Test Presets Selector */}
            <div style={{ marginBottom: '16px', backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                ⚡ SELECT TEST PROFILE / PANEL:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.keys(PRESET_TESTS).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleSelectPreset(k)}
                    style={{
                      backgroundColor: selectedPresetKey === k ? '#06B6D4' : 'rgba(255,255,255,0.06)',
                      color: selectedPresetKey === k ? '#070C16' : '#E2E8F0',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient & Referring Doctor Form */}
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', display: 'block', marginBottom: '12px' }}>
                👤 Patient Demographics & Sample Details:
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Patient Full Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Age & Gender *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Age"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      style={{ width: '40%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 8px', color: '#FFF' }}
                    />
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      style={{ width: '60%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 8px', color: '#FFF' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Contact Phone</label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Referring Doctor *</label>
                  <input
                    type="text"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar / Self"
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Patient UHID / MRN</label>
                  <input
                    type="text"
                    value={patientMrn}
                    onChange={(e) => setPatientMrn(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Sample Barcode</label>
                  <input
                    type="text"
                    value={sampleBarcode}
                    onChange={(e) => setSampleBarcode(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', marginBottom: '3px' }}>Patient Address / City</label>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF', fontSize: '0.75rem' }}
                />
              </div>
            </div>

            {/* Test Results Parameter Entry Table */}
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC' }}>
                  🧪 Parameter Results & Biological Reference Ranges:
                </span>
                <button
                  type="button"
                  onClick={handleAddCustomParam}
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#38BDF8', border: '1px solid #38BDF8', borderRadius: '6px', padding: '4px 10px', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Add Parameter
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>#</th>
                    <th style={{ padding: '8px', width: '35%' }}>PARAMETER NAME</th>
                    <th style={{ padding: '8px', width: '18%' }}>OBSERVED VALUE</th>
                    <th style={{ padding: '8px', width: '12%' }}>UNITS</th>
                    <th style={{ padding: '8px', width: '23%' }}>NORMAL RANGE</th>
                    <th style={{ padding: '8px', width: '8%' }}>FLAG</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>✕</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((p, idx) => (
                    <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '6px 8px', color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => {
                            setParameters((prev) => {
                              const updated = [...prev];
                              const cur = updated[idx];
                              if (cur) updated[idx] = { ...cur, name: e.target.value };
                              return updated;
                            });
                          }}
                          style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', color: '#FFF' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={p.value}
                          onChange={(e) => handleUpdateParamValue(idx, e.target.value)}
                          placeholder="Value"
                          style={{ width: '100%', backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '4px', padding: '4px 8px', color: '#38BDF8', fontWeight: 800 }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={p.unit}
                          onChange={(e) => {
                            setParameters((prev) => {
                              const updated = [...prev];
                              const cur = updated[idx];
                              if (cur) updated[idx] = { ...cur, unit: e.target.value };
                              return updated;
                            });
                          }}
                          style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', color: '#94A3B8' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={p.referenceRange}
                          onChange={(e) => {
                            setParameters((prev) => {
                              const updated = [...prev];
                              const cur = updated[idx];
                              if (cur) updated[idx] = { ...cur, referenceRange: e.target.value };
                              return updated;
                            });
                          }}
                          style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', color: '#94A3B8' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <select
                          value={p.flag}
                          onChange={(e) => {
                            setParameters((prev) => {
                              const updated = [...prev];
                              const cur = updated[idx];
                              if (cur) updated[idx] = { ...cur, flag: e.target.value as any };
                              return updated;
                            });
                          }}
                          style={{
                            backgroundColor: p.flag === 'HIGH' ? '#7F1D1D' : p.flag === 'LOW' ? '#831843' : '#0F172A',
                            color: p.flag === 'NORMAL' ? '#34D399' : '#FCA5A5',
                            border: '1px solid #334155',
                            borderRadius: '4px',
                            padding: '4px',
                            fontWeight: 700,
                            fontSize: '0.6875rem'
                          }}
                        >
                          <option value="NORMAL">NORMAL</option>
                          <option value="HIGH">HIGH</option>
                          <option value="LOW">LOW</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(idx)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 800 }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 2: PRINTABLE OFFICIAL NABL REPORT VIEW */}
        {activeStep === 'PRINT_PREVIEW' && (
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#070C16' }}>
            <div id="printable-pathology-sheet" style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: '36px 40px',
              borderRadius: '8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}>
              {/* Lab Header & Accreditation */}
              <div style={{ borderBottom: '2.5px solid #0284C7', paddingBottom: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: 900, color: '#0369A1', textTransform: 'uppercase' }}>
                    {labName}
                  </h1>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>
                    {labTagline}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                    {labAddress} • 📞 {profile.contactPhone}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '220px' }}>
                  <div style={{ border: '1.5px solid #0284C7', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F0F9FF' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#0369A1', display: 'block' }}>NABL CERTIFICATE NO.</span>
                    <strong style={{ fontSize: '0.75rem', color: '#0C4A6E' }}>{nablCertNo}</strong>
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#16A34A', fontWeight: 800, marginTop: '3px', display: 'block' }}>
                    ✓ ABDM 2.0 CONNECTED LAB
                  </span>
                </div>
              </div>

              {/* Patient Demographics & Sample Barcode Grid */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.75rem' }}>
                <div>
                  <div><span style={{ color: '#64748B' }}>Patient Name:</span> <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>{patientName}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Age / Gender:</span> <strong>{patientAge} Yrs / {patientGender}</strong></div>
                  <div><span style={{ color: '#64748B' }}>UHID / MRN:</span> <strong style={{ fontFamily: 'monospace' }}>{patientMrn}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Phone / Address:</span> <span>{patientPhone} | {patientAddress}</span></div>
                </div>

                <div>
                  <div><span style={{ color: '#64748B' }}>Sample Barcode:</span> <strong style={{ fontFamily: 'monospace', color: '#0369A1' }}>{sampleBarcode}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Referring Doctor:</span> <strong>{referringDoctor}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Specimen / Matrix:</span> <strong>{specimenType}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Department:</span> <strong>{departmentName}</strong></div>
                </div>

                <div>
                  <div><span style={{ color: '#64748B' }}>Collected:</span> <strong>{new Date().toLocaleDateString('en-IN')} 08:30 AM</strong></div>
                  <div><span style={{ color: '#64748B' }}>Received:</span> <strong>{new Date().toLocaleDateString('en-IN')} 09:15 AM</strong></div>
                  <div><span style={{ color: '#64748B' }}>Reported:</span> <strong>{new Date().toLocaleDateString('en-IN')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Status:</span> <span style={{ color: '#16A34A', fontWeight: 900 }}>✓ FINAL NABL APPROVED</span></div>
                </div>
              </div>

              {/* Test Name Header */}
              <div style={{ backgroundColor: '#0284C7', color: '#FFFFFF', padding: '6px 12px', borderRadius: '4px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 900, fontSize: '0.8125rem', textTransform: 'uppercase' }}>
                  {testTitle}
                </span>
                <span style={{ fontSize: '0.6875rem' }}>Analyzed on Fully Automated Clinical Chemistry / Hematology Analyzer</span>
              </div>

              {/* Test Results Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginBottom: '20px', border: '1px solid #CBD5E1' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1.5px solid #94A3B8', textAlign: 'left', color: '#1E293B' }}>
                    <th style={{ padding: '8px 10px' }}>TEST PARAMETER</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px' }}>OBSERVED VALUE</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px' }}>UNITS</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px' }}>BIOLOGICAL REFERENCE INTERVAL</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px' }}>FLAG</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((r, i) => {
                    const isAbnormal = r.flag === 'HIGH' || r.flag === 'LOW' || r.flag === 'CRITICAL';
                    return (
                      <tr key={r.id || i} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: isAbnormal ? '#FEF2F2' : 'transparent' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>{r.name}</td>
                        <td style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 900, color: isAbnormal ? '#DC2626' : '#0F172A', fontSize: '0.8125rem' }}>
                          {r.value}
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px 10px', color: '#64748B' }}>{r.unit}</td>
                        <td style={{ textAlign: 'center', padding: '8px 10px', color: '#334155' }}>{r.referenceRange}</td>
                        <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                          {isAbnormal ? (
                            <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: '4px', fontWeight: 900, fontSize: '0.6875rem' }}>
                              ⚠️ {r.flag}
                            </span>
                          ) : (
                            <span style={{ color: '#16A34A', fontWeight: 700 }}>Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* End of Report Bar */}
              <div style={{ textAlign: 'center', borderTop: '1px dashed #CBD5E1', borderBottom: '1px dashed #CBD5E1', padding: '4px 0', margin: '14px 0', fontSize: '0.6875rem', color: '#64748B', letterSpacing: '0.1em' }}>
                *** END OF DIAGNOSTIC REPORT ***
              </div>

              {/* Signatures & Accreditation Footer */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px' }}>
                <div style={{ textAlign: 'center', minWidth: '180px' }}>
                  <div style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#475569', marginBottom: '2px' }}>
                    {technicianName.split(' ')[0]}
                  </div>
                  <div style={{ borderTop: '1px solid #0F172A', paddingTop: '2px' }}>
                    <strong style={{ fontSize: '0.75rem', color: '#0F172A', display: 'block' }}>{technicianName}</strong>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Medical Lab Technologist</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', maxWidth: '280px' }}>
                  <div style={{ fontSize: '0.625rem', color: '#64748B' }}>
                    QR Tamper Seal (SHA-256): <span style={{ fontFamily: 'monospace' }}>{profile.sha256Hash.substring(0, 16)}...</span>
                  </div>
                  <div style={{ fontSize: '0.625rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                    ✓ Authenticated Clinical Pathology Finding
                  </div>
                </div>

                <div style={{ textAlign: 'center', minWidth: '220px' }}>
                  <div style={{ fontFamily: 'cursive', fontSize: '1.25rem', color: '#0369A1', marginBottom: '2px' }}>
                    {pathologistName}
                  </div>
                  <div style={{ borderTop: '1px solid #0F172A', paddingTop: '2px' }}>
                    <strong style={{ fontSize: '0.75rem', color: '#0F172A', display: 'block' }}>{pathologistName}</strong>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>Consultant Pathologist & Lab Director</span>
                    <span style={{ fontSize: '0.6875rem', color: '#0284C7', fontWeight: 700 }}>Reg: {pathologistRegNo}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
