import React, { useState } from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';

export type AsaPacScore = 'ASA_I' | 'ASA_II' | 'ASA_III' | 'ASA_IV' | 'ASA_V' | 'ASA_VI' | 'ASA_E';
export type SurgeryStatus = 'PRE_OP' | 'SIGN_IN' | 'ANESTHESIA' | 'TIME_OUT' | 'INTRA_OP' | 'SIGN_OUT' | 'RECOVERY' | 'COMPLETED';

export interface SurgicalCase {
  id: string;
  otRoom: string;
  patientName: string;
  uhid: string;
  ageGender: string;
  procedureName: string;
  leadSurgeon: string;
  anesthesiologist: string;
  scrubNurse: string;
  pacScore: AsaPacScore;
  scheduledTime: string;
  status: SurgeryStatus;
  checklistState: {
    signInCompleted: boolean;
    timeOutCompleted: boolean;
    signOutCompleted: boolean;
  };
  bloodUnitsCrossMatched: number;
  anesthesiaType: 'GENERAL' | 'SPINAL' | 'EPIDURAL' | 'LOCAL' | 'MAC';
}

const DEFAULT_CASES: SurgicalCase[] = [
  {
    id: 'SURG-2026-001',
    otRoom: 'OT-1 (Super-Speciality)',
    patientName: 'Kishore Kumar',
    uhid: 'UHID-2026-102',
    ageGender: '52Y / M',
    procedureName: 'Laparoscopic Cholecystectomy',
    leadSurgeon: 'Dr. Amitabh Verma (GI Surgery)',
    anesthesiologist: 'Dr. Meenakshi Sundaram',
    scrubNurse: 'Sister Reena Mathew',
    pacScore: 'ASA_II',
    scheduledTime: '10:00 AM - 12:00 PM',
    status: 'INTRA_OP',
    checklistState: {
      signInCompleted: true,
      timeOutCompleted: true,
      signOutCompleted: false
    },
    bloodUnitsCrossMatched: 2,
    anesthesiaType: 'GENERAL'
  },
  {
    id: 'SURG-2026-002',
    otRoom: 'OT-2 (Orthopedic & Trauma)',
    patientName: 'Sunita Deshmukh',
    uhid: 'UHID-2026-108',
    ageGender: '64Y / F',
    procedureName: 'Total Knee Replacement (Right)',
    leadSurgeon: 'Dr. Rajesh Khanna (Ortho)',
    anesthesiologist: 'Dr. Vivek Bhatnagar',
    scrubNurse: 'Brother Manoj Kumar',
    pacScore: 'ASA_III',
    scheduledTime: '12:30 PM - 02:30 PM',
    status: 'PRE_OP',
    checklistState: {
      signInCompleted: false,
      timeOutCompleted: false,
      signOutCompleted: false
    },
    bloodUnitsCrossMatched: 1,
    anesthesiaType: 'SPINAL'
  },
  {
    id: 'SURG-2026-003',
    otRoom: 'OT-3 (Emergency & Maternity)',
    patientName: 'Priya Rathore',
    uhid: 'UHID-2026-115',
    ageGender: '28Y / F',
    procedureName: 'Emergency Lower Segment Caesarean Section',
    leadSurgeon: 'Dr. Kavita Joshi (Obstetrics)',
    anesthesiologist: 'Dr. Meenakshi Sundaram',
    scrubNurse: 'Sister Anita Paul',
    pacScore: 'ASA_E',
    scheduledTime: 'STAT / Emergency',
    status: 'SIGN_IN',
    checklistState: {
      signInCompleted: false,
      timeOutCompleted: false,
      signOutCompleted: false
    },
    bloodUnitsCrossMatched: 2,
    anesthesiaType: 'SPINAL'
  }
];

export const OperationTheatreManagerView: React.FC = () => {
  const [surgicalCases, setSurgicalCases] = useState<SurgicalCase[]>(DEFAULT_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(DEFAULT_CASES[0]?.id || '');

  const activeCase = surgicalCases.find((c) => c.id === selectedCaseId) || surgicalCases[0];

  const handleToggleChecklistStep = (phase: 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT') => {
    if (!activeCase) return;

    setSurgicalCases((prev) =>
      prev.map((c) => {
        if (c.id !== activeCase.id) return c;
        const nextState = { ...c.checklistState };
        let nextStatus = c.status;

        if (phase === 'SIGN_IN') {
          nextState.signInCompleted = true;
          nextStatus = 'TIME_OUT';
        } else if (phase === 'TIME_OUT') {
          nextState.timeOutCompleted = true;
          nextStatus = 'INTRA_OP';
        } else if (phase === 'SIGN_OUT') {
          nextState.signOutCompleted = true;
          nextStatus = 'RECOVERY';
        }

        return {
          ...c,
          checklistState: nextState,
          status: nextStatus
        };
      })
    );
  };

  const getStatusColor = (status: SurgeryStatus) => {
    switch (status) {
      case 'INTRA_OP':
        return '#ef4444';
      case 'SIGN_IN':
      case 'TIME_OUT':
        return '#f59e0b';
      case 'RECOVERY':
        return '#8b5cf6';
      case 'COMPLETED':
        return '#10b981';
      default:
        return '#38bdf8';
    }
  };

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#090d16', minHeight: '100%', color: '#f8fafc' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
              Operation Theatre Suite & Surgical Cockpit
            </h1>
            <Badge variant="primary">WHO Safe Surgery Standard</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Intraoperative Safety Checklists, Surgeon Rosters, PAC Scoring & Surgical Safety Gateways
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>1 Active</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Intra-Op Underway</div>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>2 Scheduled</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>In Pre-Op / Holding</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Cases List on Left, Active Cockpit on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>
        {/* Left: OT Cases Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            TODAY'S SURGICAL SLATE
          </div>
          {surgicalCases.map((c) => {
            const isSelected = c.id === activeCase?.id;
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCaseId(c.id)}
                style={{
                  backgroundColor: isSelected ? '#1e293b' : '#111827',
                  border: isSelected ? '1.5px solid #0284c7' : '1px solid #1f2937',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: '#38bdf8', fontSize: '0.85rem' }}>{c.otRoom}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${getStatusColor(c.status)}20`,
                      color: getStatusColor(c.status),
                      border: `1px solid ${getStatusColor(c.status)}50`
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1rem' }}>{c.procedureName}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  Patient: {c.patientName} ({c.ageGender}) • {c.uhid}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Surgeon: {c.leadSurgeon}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Surgical Cockpit & WHO Checklist */}
        {activeCase && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Surgery Details Card */}
            <Card style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.25rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#f8fafc' }}>
                    {activeCase.procedureName}
                  </h2>
                  <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    {activeCase.otRoom} • {activeCase.scheduledTime} • Anesthesia: {activeCase.anesthesiaType}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Badge variant={activeCase.pacScore === 'ASA_E' ? 'danger' : 'neutral'}>
                    PAC: {activeCase.pacScore}
                  </Badge>
                  <span
                    style={{
                      backgroundColor: '#dc262620',
                      color: '#f87171',
                      border: '1px solid #dc262650',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    🩸 {activeCase.bloodUnitsCrossMatched} Units PRBC Cross-Matched
                  </span>
                </div>
              </div>

              {/* Team Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginTop: '1rem',
                  backgroundColor: '#1e293b',
                  padding: '1rem',
                  borderRadius: '6px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>LEAD SURGEON</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{activeCase.leadSurgeon}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>ANESTHESIOLOGIST</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{activeCase.anesthesiologist}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>SCRUB NURSE</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{activeCase.scrubNurse}</div>
                </div>
              </div>
            </Card>

            {/* WHO Surgical Safety Checklist Cockpit */}
            <Card style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.25rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                  WHO Safe Surgery Triple-Check Gateway
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  Mandatory NABH Criterion COP.10
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {/* 1. SIGN-IN */}
                <div
                  style={{
                    backgroundColor: activeCase.checklistState.signInCompleted ? 'rgba(16, 185, 129, 0.1)' : '#1e293b',
                    border: activeCase.checklistState.signInCompleted ? '1px solid #10b981' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#38bdf8' }}>PHASE 1: SIGN IN</span>
                      {activeCase.checklistState.signInCompleted ? (
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ DONE</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>PENDING</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 12px' }}>
                      Before Anesthesia Induction
                    </div>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.75rem', color: '#cbd5e1' }}>
                      <li>Patient identity, site & consent confirmed</li>
                      <li>Surgical site marked by surgeon</li>
                      <li>Anesthesia machine & medications checked</li>
                      <li>Pulse oximeter functioning</li>
                      <li>Difficult airway / aspiration risk evaluated</li>
                    </ul>
                  </div>

                  {!activeCase.checklistState.signInCompleted && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleToggleChecklistStep('SIGN_IN')}
                      style={{ marginTop: '1rem', width: '100%' }}
                    >
                      Sign Off: Sign-In
                    </Button>
                  )}
                </div>

                {/* 2. TIME-OUT */}
                <div
                  style={{
                    backgroundColor: activeCase.checklistState.timeOutCompleted ? 'rgba(16, 185, 129, 0.1)' : '#1e293b',
                    border: activeCase.checklistState.timeOutCompleted ? '1px solid #10b981' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#38bdf8' }}>PHASE 2: TIME OUT</span>
                      {activeCase.checklistState.timeOutCompleted ? (
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ DONE</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>PENDING</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 12px' }}>
                      Before Skin Incision
                    </div>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.75rem', color: '#cbd5e1' }}>
                      <li>All team members introduced by name & role</li>
                      <li>Surgeon & anesthesia verify patient & site</li>
                      <li>Anticipated critical steps reviewed</li>
                      <li>Antibiotic prophylaxis given &lt;60 min</li>
                      <li>Essential imaging displayed</li>
                    </ul>
                  </div>

                  {activeCase.checklistState.signInCompleted && !activeCase.checklistState.timeOutCompleted && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleToggleChecklistStep('TIME_OUT')}
                      style={{ marginTop: '1rem', width: '100%', backgroundColor: '#f59e0b' }}
                    >
                      Sign Off: Time-Out
                    </Button>
                  )}
                </div>

                {/* 3. SIGN-OUT */}
                <div
                  style={{
                    backgroundColor: activeCase.checklistState.signOutCompleted ? 'rgba(16, 185, 129, 0.1)' : '#1e293b',
                    border: activeCase.checklistState.signOutCompleted ? '1px solid #10b981' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#38bdf8' }}>PHASE 3: SIGN OUT</span>
                      {activeCase.checklistState.signOutCompleted ? (
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ DONE</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>PENDING</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 12px' }}>
                      Before Leaving Operating Room
                    </div>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.75rem', color: '#cbd5e1' }}>
                      <li>Nurse confirms instrument, sponge & needle count</li>
                      <li>Specimens labeled correctly (UHID + Site)</li>
                      <li>Equipment problems addressed</li>
                      <li>Surgeon & anesthesia review recovery plan</li>
                      <li>Post-op analgesia prescription signed</li>
                    </ul>
                  </div>

                  {activeCase.checklistState.timeOutCompleted && !activeCase.checklistState.signOutCompleted && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleToggleChecklistStep('SIGN_OUT')}
                      style={{ marginTop: '1rem', width: '100%', backgroundColor: '#10b981' }}
                    >
                      Sign Off: Sign-Out
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
