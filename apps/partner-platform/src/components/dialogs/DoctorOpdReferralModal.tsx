import React, { useState } from 'react';

export interface DoctorOpdReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientMrn: string;
  token: string;
  provisionalDiagnosis: string;
  onDispatchReferral: (referralData: {
    department: string;
    specialistDoctor: string;
    urgency: 'STAT' | 'URGENT' | 'ROUTINE';
    indication: string;
    clinicalSummary: string;
  }) => void;
}

const SPECIALTY_DEPARTMENTS: { name: string; icon: string; doctors: string[] }[] = [
  {
    name: 'Cardiology',
    icon: '🫀',
    doctors: ['Dr. Vikram Singhania (DM Cardiology)', 'Dr. Neha Malhotra (Senior Interventional Cardiologist)']
  },
  {
    name: 'Neurology',
    icon: '🧠',
    doctors: ['Dr. Rajeshwar Iyer (DM Neurology)', 'Dr. Amit Deshmukh (Consultant Neurologist)']
  },
  {
    name: 'Nephrology',
    icon: '🫘',
    doctors: ['Dr. S. K. Narang (DM Nephrology)', 'Dr. Pradeep Goyal (Renal Physician)']
  },
  {
    name: 'Orthopedics & Spine',
    icon: '🦴',
    doctors: ['Dr. Harsh Vardhan (MS Ortho, Joint Replacement)', 'Dr. Ankit Mehta (Spine & Arthroscopy Specialist)']
  },
  {
    name: 'Pulmonology',
    icon: '🫁',
    doctors: ['Dr. Meenakshi Sunder (MD Pulmonology, Chest Specialist)', 'Dr. Tariq Khan (Respiratory Medicine)']
  },
  {
    name: 'Gastroenterology',
    icon: '🔬',
    doctors: ['Dr. Alok Verma (DM Gastroenterology)', 'Dr. Priya Nambiar (Hepatologist & GI Endoscopist)']
  },
  {
    name: 'Endocrinology',
    icon: '🩸',
    doctors: ['Dr. Arvind Joshi (DM Endocrinology, Diabetologist)', 'Dr. Sunita Bansal (Endocrine Specialist)']
  },
  {
    name: 'General & Laparoscopic Surgery',
    icon: '🩺',
    doctors: ['Dr. Ramesh Chandra (MS General Surgery)', 'Dr. Kavita Pillai (Surgical Specialist)']
  },
  {
    name: 'Dermatology & Cosmetology',
    icon: '🧴',
    doctors: ['Dr. Pooja Rathore (MD Dermatology)', 'Dr. Sameer Alvi (Skin Specialist)']
  }
];

const COMMON_REFERRAL_INDICATIONS = [
  'Abnormal ECG / T-wave inversion / Troponin evaluation',
  'Rising Serum Creatinine & severe proteinuria',
  'Uncontrolled Blood Sugar despite dual OHA therapy',
  'Persistent severe headache with visual disturbances',
  'Suspected Acute Appendicitis / Surgical abdomen evaluation',
  'Chronic dry cough >4 weeks / Suspected Interstitial Lung Disease',
  'Severe lumbar radiculopathy / MRI Spine correlation',
  'Suspected Deep Vein Thrombosis (DVT) / Venous Doppler review'
];

export const DoctorOpdReferralModal: React.FC<DoctorOpdReferralModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientMrn,
  token,
  provisionalDiagnosis,
  onDispatchReferral
}) => {
  const defaultDept = SPECIALTY_DEPARTMENTS[0] || { name: 'Cardiology', icon: '🫀', doctors: ['Dr. Vikram Singhania (DM Cardiology)'] };
  const [selectedDept, setSelectedDept] = useState<string>(defaultDept.name);
  const [selectedDoctor, setSelectedDoctor] = useState<string>(defaultDept.doctors[0] || 'Consultant Specialist');
  const [urgency, setUrgency] = useState<'STAT' | 'URGENT' | 'ROUTINE'>('URGENT');
  const [indication, setIndication] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState(
    `Patient presenting with ${provisionalDiagnosis || 'symptomatic progression'}. Evaluated in Primary OPD. Seeking expert super-specialty opinion and further workup.`
  );

  if (!isOpen) return null;

  const currentDeptObj = SPECIALTY_DEPARTMENTS.find((d) => d.name === selectedDept) || defaultDept;

  const handleSelectDept = (deptName: string) => {
    setSelectedDept(deptName);
    const dObj = SPECIALTY_DEPARTMENTS.find((d) => d.name === deptName);
    if (dObj && dObj.doctors && dObj.doctors.length > 0 && dObj.doctors[0]) {
      setSelectedDoctor(dObj.doctors[0]);
    }
  };

  const handleDispatch = () => {
    onDispatchReferral({
      department: selectedDept,
      specialistDoctor: selectedDoctor || 'Consultant Specialist',
      urgency,
      indication: indication || 'Expert Specialist Opinion Required',
      clinicalSummary
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #06B6D4',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.85), 0 0 25px rgba(6, 182, 212, 0.2)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1E293B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>👨‍⚕️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#38BDF8' }}>
                Cross-Specialty OPD Referral & Clinical Handoff
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {token} • {patientName} ({patientMrn}) • Instant OPD Token Booking
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Target Specialty Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', marginBottom: '6px' }}>
              TARGET SUPER-SPECIALTY DEPARTMENT:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px' }}>
              {SPECIALTY_DEPARTMENTS.map((dept) => {
                const isSelected = selectedDept === dept.name;
                return (
                  <button
                    key={dept.name}
                    type="button"
                    onClick={() => handleSelectDept(dept.name)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: isSelected ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#38BDF8' : '#CBD5E1',
                      fontSize: '0.68rem',
                      fontWeight: isSelected ? 800 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      textAlign: 'left'
                    }}
                  >
                    <span>{dept.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specialist Doctor & Urgency Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                REFERRING TO CONSULTANT:
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#0B111E',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {currentDeptObj.doctors.map((doc) => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                REFERRAL URGENCY:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { key: 'STAT', label: '🚨 STAT (Immediate)', color: '#EF4444' },
                  { key: 'URGENT', label: '⚡ Urgent (Same Day)', color: '#F59E0B' },
                  { key: 'ROUTINE', label: '📅 Routine OPD', color: '#10B981' }
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setUrgency(p.key as any)}
                    style={{
                      flex: 1,
                      padding: '7px 4px',
                      borderRadius: '6px',
                      border: urgency === p.key ? `1.5px solid ${p.color}` : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: urgency === p.key ? `${p.color}22` : 'rgba(255,255,255,0.03)',
                      color: urgency === p.key ? p.color : '#94A3B8',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Clickable Indications */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
              CLINICAL INDICATION FOR REFERRAL:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
              {COMMON_REFERRAL_INDICATIONS.map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setIndication(ind)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: indication === ind ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: indication === ind ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: indication === ind ? '#38BDF8' : '#94A3B8'
                  }}
                >
                  {ind}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
              placeholder="e.g. For Holter monitoring & 2D Echocardiography evaluation..."
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                backgroundColor: '#0B111E',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F8FAFC',
                fontSize: '0.75rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Clinical Handover Summary */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
              CLINICAL SUMMARY & HANDOVER NOTE:
            </label>
            <textarea
              value={clinicalSummary}
              onChange={(e) => setClinicalSummary(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#0B111E',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F8FAFC',
                fontSize: '0.75rem',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            backgroundColor: '#1E293B'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#94A3B8',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor: '#06B6D4',
              border: 'none',
              color: '#070C16',
              fontWeight: 900,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(6, 182, 212, 0.4)'
            }}
          >
            <span>🚀</span>
            <span>Dispatch Referral to {selectedDept}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
