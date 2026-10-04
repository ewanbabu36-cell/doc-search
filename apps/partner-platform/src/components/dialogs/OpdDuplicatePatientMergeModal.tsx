import React, { useState } from 'react';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface DuplicateCandidate {
  uhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  totalVisits: number;
  lastVisitDate: string;
  knownDiagnoses: string[];
  matchConfidence: number; // e.g. 92%
}

export interface FamilyTreeMember {
  relation: string;
  name: string;
  age: number;
  uhid: string;
  primaryHolder: boolean;
}

export interface OpdDuplicatePatientMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePatient: {
    name: string;
    uhid: string;
    age: number;
    gender: string;
    phone?: string;
  };
  onMergeSuccess?: (targetUhid: string) => void;
}

export const OpdDuplicatePatientMergeModal: React.FC<OpdDuplicatePatientMergeModalProps> = ({
  isOpen,
  onClose,
  activePatient,
  onMergeSuccess
}) => {
  const [duplicateCandidate] = useState<DuplicateCandidate>({
    uhid: 'UHID-2024-819',
    name: `${activePatient.name.split(' ')[0]} (Previous File)`,
    age: activePatient.age,
    gender: activePatient.gender,
    phone: activePatient.phone || '+91 98765 01234',
    totalVisits: 3,
    lastVisitDate: '28-Jul-2026',
    knownDiagnoses: ['Essential Hypertension', 'Dyslipidemia'],
    matchConfidence: 94
  });

  const [familyMembers] = useState<FamilyTreeMember[]>([
    { relation: 'Self (Active)', name: activePatient.name, age: activePatient.age, uhid: activePatient.uhid, primaryHolder: true },
    { relation: 'Spouse', name: 'Sunita Sharma', age: activePatient.age - 2, uhid: 'UHID-2025-412', primaryHolder: false },
    { relation: 'Son (Child)', name: 'Aarav Sharma', age: 7, uhid: 'UHID-2026-901', primaryHolder: false }
  ]);

  const [isMerging, setIsMerging] = useState(false);
  const [mergeComplete, setMergeComplete] = useState(false);

  if (!isOpen) return null;

  const handleMergeRecords = () => {
    setIsMerging(true);

    hospitalEventBus.publish(
      'PATIENT_RECORDS_MERGED',
      'OpdDuplicatePatientMergeModal',
      {
        primaryUhid: activePatient.uhid,
        mergedUhid: duplicateCandidate.uhid,
        patientName: activePatient.name,
        transferredVisitsCount: duplicateCandidate.totalVisits
      },
      `Merged duplicate record ${duplicateCandidate.uhid} into primary ${activePatient.uhid} (${activePatient.name})`
    );

    setTimeout(() => {
      setIsMerging(false);
      setMergeComplete(true);
      if (onMergeSuccess) {
        onMergeSuccess(activePatient.uhid);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 700);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
          border: '1.5px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.85)',
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
            backgroundColor: 'rgba(139, 92, 246, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🆔</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#C084FC' }}>
                  Patient Identity & Duplicate Record Merge Engine
                </h3>
                <span style={{ fontSize: '0.65rem', backgroundColor: '#6D28D9', color: '#EDE9FE', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  {duplicateCandidate.matchConfidence}% Match
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#CBD5E1' }}>
                Fuzzy matching detected potential duplicate registration on phone: <strong>{duplicateCandidate.phone}</strong>
              </p>
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

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mergeComplete && (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22C55E', color: '#86EFAC', padding: '10px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
              ✓ Duplicate record ({duplicateCandidate.uhid}) successfully merged into Master UHID {activePatient.uhid}. All historical visits linked!
            </div>
          )}

          {/* Comparison Side-by-Side Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Left: Active Consultation Record */}
            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38BDF8', marginBottom: '6px' }}>
                CURRENT ENCOUNTER RECORD (Master)
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>{activePatient.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                UHID: <strong>{activePatient.uhid}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Age / Gender: {activePatient.age} yrs • {activePatient.gender}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Phone: {activePatient.phone || duplicateCandidate.phone}
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#34D399', fontWeight: 700 }}>
                ● Active in Consultation Chamber
              </div>
            </div>

            {/* Right: Detected Duplicate Candidate */}
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#F87171' }}>
                  DETECTED DUPLICATE (Past File)
                </span>
                <span style={{ fontSize: '0.65rem', backgroundColor: '#EF4444', color: '#FFFFFF', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>
                  Merge Recommended
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>{duplicateCandidate.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Old UHID: <strong>{duplicateCandidate.uhid}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Visits on File: <strong>{duplicateCandidate.totalVisits} previous visits</strong> (Last: {duplicateCandidate.lastVisitDate})
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Recorded Conditions: {duplicateCandidate.knownDiagnoses.join(', ')}
              </div>
            </div>
          </div>

          {/* Family Tree Grouping Box */}
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E2E8F0', marginBottom: '8px' }}>
              👨‍👩‍👧 Family Tree Grouping (Linked via Mobile {duplicateCandidate.phone}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {familyMembers.map((m) => (
                <div
                  key={m.uhid}
                  style={{
                    backgroundColor: m.primaryHolder ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: m.primaryHolder ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.72rem'
                  }}
                >
                  <span style={{ color: '#C084FC', fontWeight: 700 }}>{m.relation}: </span>
                  <span style={{ color: '#F8FAFC' }}>{m.name} ({m.age}y)</span>
                  <span style={{ color: '#64748B', marginLeft: '6px' }}>[{m.uhid}]</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#070C16'
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Transfers all past prescriptions, lab reports and visit logs to Master UHID
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Keep Separate
            </button>
            <button
              type="button"
              disabled={isMerging || mergeComplete}
              onClick={handleMergeRecords}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                backgroundColor: mergeComplete ? '#10B981' : '#8B5CF6',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: isMerging || mergeComplete ? 'not-allowed' : 'pointer'
              }}
            >
              {isMerging ? 'Merging Records...' : mergeComplete ? '✓ Records Merged' : 'Merge Records & Link History'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
