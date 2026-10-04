import React, { useState } from 'react';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface MlcDetails {
  isMlc: boolean;
  incidentType: 'RTA' | 'PHYSICAL_ASSAULT' | 'BURNS' | 'POISONING' | 'FALL_HEIGHT' | 'WORK_INJURY' | 'OTHER';
  broughtBy: 'POLICE' | 'RELATIVE' | 'BYSTANDER';
  policeStation: string;
  constableName: string;
  constableBeltNumber: string;
  incidentTime: string;
  identificationMarks: string;
  alcoholSmellPresent: boolean;
  clinicalSummary: string;
}

export interface OpdMlcRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientMrn: string;
  encounterId: string;
  initialMlc?: MlcDetails | null;
  onSaveMlc: (details: MlcDetails) => void;
}

export const OpdMlcRecordModal: React.FC<OpdMlcRecordModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientMrn,
  encounterId,
  initialMlc,
  onSaveMlc
}) => {
  const [incidentType, setIncidentType] = useState<MlcDetails['incidentType']>(initialMlc?.incidentType || 'RTA');
  const [broughtBy, setBroughtBy] = useState<MlcDetails['broughtBy']>(initialMlc?.broughtBy || 'POLICE');
  const [policeStation, setPoliceStation] = useState(initialMlc?.policeStation || 'Kotwali Police Station');
  const [constableName, setConstableName] = useState(initialMlc?.constableName || 'Const. R. S. Verma');
  const [constableBeltNumber, setConstableBeltNumber] = useState(initialMlc?.constableBeltNumber || 'Belt #1142');
  const [incidentTime, setIncidentTime] = useState(initialMlc?.incidentTime || 'Approx. 1 Hour Prior to Admission');
  const [identificationMarks, setIdentificationMarks] = useState(
    initialMlc?.identificationMarks || '1. Linear scar (2cm) over lateral aspect of right eyebrow. 2. Dark mole on left clavicle.'
  );
  const [alcoholSmellPresent, setAlcoholSmellPresent] = useState(initialMlc?.alcoholSmellPresent || false);
  const [clinicalSummary, setClinicalSummary] = useState(
    initialMlc?.clinicalSummary || 'Patient brought following vehicular collision with active lacerations and blunt trauma.'
  );

  if (!isOpen) return null;

  const handleSave = () => {
    const details: MlcDetails = {
      isMlc: true,
      incidentType,
      broughtBy,
      policeStation,
      constableName,
      constableBeltNumber,
      incidentTime,
      identificationMarks,
      alcoholSmellPresent,
      clinicalSummary
    };

    hospitalEventBus.publish(
      'MLC_CASE_RECORDED',
      'OpdMlcRecordModal',
      {
        encounterId,
        patientName,
        patientMrn,
        details
      },
      `MEDICO-LEGAL CASE REGISTERED: ${patientName} (${incidentType} - ${policeStation})`
    );

    onSaveMlc(details);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
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
          border: '2px solid #EF4444',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(239, 68, 68, 0.4)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(239, 68, 68, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#F87171' }}>
                  MEDICO-LEGAL CASE (MLC) REGISTRATION DESK
                </h3>
                <span
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  LEGAL GUARDRAIL
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#CBD5E1' }}>
                Patient: <strong>{patientName}</strong> • UHID: <strong>{patientMrn}</strong>
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

        {/* Form Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Statutory Warning Box */}
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px dashed #EF4444',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.75rem',
              color: '#FCA5A5',
              lineHeight: 1.4
            }}
          >
            <strong>⚠️ CRITICAL STATUTORY REQUIREMENT (NABH / BNS COMPLIANCE):</strong> All physical injuries, vehicular trauma, burns, poisoning, or suspected assault must be legally documented with identification marks and police intimation. Prescription slip will bear mandatory legal watermark.
          </div>

          {/* Incident Type & Brought By Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Nature of Incident:
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#070C16',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#F8FAFC',
                  fontSize: '0.78rem'
                }}
              >
                <option value="RTA">Road Traffic Accident (RTA / Vehicular)</option>
                <option value="PHYSICAL_ASSAULT">Physical Assault / Blunt Force Trauma</option>
                <option value="BURNS">Thermal / Chemical Burns</option>
                <option value="POISONING">Accidental / Intentional Ingestion / Poisoning</option>
                <option value="FALL_HEIGHT">Fall from Height</option>
                <option value="WORK_INJURY">Industrial / Machinery Injury</option>
                <option value="OTHER">Other Suspicious Trauma</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Brought To Hospital By:
              </label>
              <select
                value={broughtBy}
                onChange={(e) => setBroughtBy(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#070C16',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#F8FAFC',
                  fontSize: '0.78rem'
                }}
              >
                <option value="POLICE">Police Officer / PCR Van</option>
                <option value="RELATIVE">Relative / Family Member</option>
                <option value="BYSTANDER">Good Samaritan / Bystander</option>
              </select>
            </div>
          </div>

          {/* Police Intimation Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '2px' }}>
                Police Station Jurisdiction:
              </label>
              <input
                type="text"
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.75rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '2px' }}>
                Constable Name:
              </label>
              <input
                type="text"
                value={constableName}
                onChange={(e) => setConstableName(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.75rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '2px' }}>
                Constable Belt No / ID:
              </label>
              <input
                type="text"
                value={constableBeltNumber}
                onChange={(e) => setConstableBeltNumber(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.75rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '2px' }}>
                Incident Time / Duration:
              </label>
              <input
                type="text"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.75rem' }}
              />
            </div>
          </div>

          {/* Identification Marks (Two Mandatory Marks) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#F87171', marginBottom: '4px' }}>
              Identification Marks (Minimum 2 Anatomical Scars / Moles):
            </label>
            <textarea
              rows={2}
              value={identificationMarks}
              onChange={(e) => setIdentificationMarks(e.target.value)}
              placeholder="1. Old scar on right forehead. 2. Black mole on left collarbone."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#070C16',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#F8FAFC',
                fontSize: '0.78rem',
                fontFamily: 'monospace'
              }}
            />
          </div>

          {/* Alcohol Smell / Substance Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F8FAFC' }}>
                Clinical Breath Odor of Alcohol / Inebriation:
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                Mandatory clinical observation noted on initial physical survey
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAlcoholSmellPresent(!alcoholSmellPresent)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: alcoholSmellPresent ? '1.5px solid #EF4444' : '1px solid #10B981',
                backgroundColor: alcoholSmellPresent ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                color: alcoholSmellPresent ? '#FCA5A5' : '#6EE7B7'
              }}
            >
              {alcoholSmellPresent ? '⚠️ Alcohol Smell PRESENT' : '✓ No Alcohol Odor'}
            </button>
          </div>

          {/* Injury & Clinical Assessment */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              Trauma / Injury Details:
            </label>
            <input
              type="text"
              value={clinicalSummary}
              onChange={(e) => setClinicalSummary(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#070C16',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F8FAFC',
                fontSize: '0.8rem'
              }}
            />
          </div>
        </div>

        {/* Footer */}
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
          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            Stamps official MLC Certificate & activates forensic evidence guardrail
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
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                backgroundColor: '#EF4444',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
              }}
            >
              Confirm MLC & Apply Legal Watermark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
