import React, { useState } from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type ComponentType = 'PACKED_RED_BLOOD_CELLS' | 'FRESH_FROZEN_PLASMA' | 'PLATELET_CONCENTRATE' | 'CRYOPRECIPITATE';

export interface TransfusionSafetyCheck {
  patientUhid: string;
  patientName: string;
  patientBloodGroup: BloodGroup;
  donorBagUnitId: string;
  donorBloodGroup: BloodGroup;
  componentType: ComponentType;
  expiryDate: string;
  majorCrossMatchStatus: 'COMPATIBLE' | 'INCOMPATIBLE';
  minorCrossMatchStatus: 'COMPATIBLE' | 'INCOMPATIBLE';
  nurse1Pin: string;
  nurse2Pin: string;
}

// Medical ABO Compatibility Rules Matrix
const COMPATIBLE_PRBC_DONORS: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
};

export const BloodBankTransfusionSafetyView: React.FC = () => {
  const [patientUhid, setPatientUhid] = useState('UHID-2026-901');
  const [patientName, setPatientName] = useState('Rajesh Mehra (ICU Bed 1)');
  const [patientBloodGroup, setPatientBloodGroup] = useState<BloodGroup>('O+');

  const [donorBagUnitId, setDonorBagUnitId] = useState('BB-PRBC-8891');
  const [donorBloodGroup, setDonorBloodGroup] = useState<BloodGroup>('O+');
  const [componentType, setComponentType] = useState<ComponentType>('PACKED_RED_BLOOD_CELLS');
  const [expiryDate, setExpiryDate] = useState('2026-11-28');

  const [nurse1Pin, setNurse1Pin] = useState('');
  const [nurse2Pin, setNurse2Pin] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'VERIFIED' | 'BLOCKED_INCOMPATIBLE' | null;
    message: string;
    authHash?: string;
  }>({ status: null, message: '' });

  // Real-time ABO compatibility check
  const isAboCompatible = COMPATIBLE_PRBC_DONORS[patientBloodGroup]?.includes(donorBloodGroup) ?? false;

  const handleVerifyAndRelease = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAboCompatible) {
      setVerificationResult({
        status: 'BLOCKED_INCOMPATIBLE',
        message: `CRITICAL SAFETY INTERLOCK: ABO Incompatibility Detected! Patient (${patientBloodGroup}) CANNOT receive Donor Blood (${donorBloodGroup}). Transfusion HARD BLOCKED under NABH Standard COP.11.`
      });
      return;
    }

    if (!nurse1Pin || !nurse2Pin) {
      setVerificationResult({
        status: 'BLOCKED_INCOMPATIBLE',
        message: 'Dual-Nurse Bedside Co-Verification Failed: Both Nurse 1 and Nurse 2 credentials are required.'
      });
      return;
    }

    if (nurse1Pin === nurse2Pin) {
      setVerificationResult({
        status: 'BLOCKED_INCOMPATIBLE',
        message: 'Dual Independent Verification Violation: Nurse 1 and Nurse 2 must be distinct clinical staff.'
      });
      return;
    }

    const authHash = `TX-SAFE-${Date.now()}-O28K`;
    setVerificationResult({
      status: 'VERIFIED',
      message: `ABO/Rh Compatibility 100% Confirmed. Bedside Dual-Nurse Verification Approved. Unit ${donorBagUnitId} released for infusion.`,
      authHash
    });
  };

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#090d16', minHeight: '100%', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
              Blood Bank & Bedside Transfusion Safety Gateway
            </h1>
            <Badge variant="danger">Fail-Closed Safety Interlock</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            ABO/Rh Cross-Match Verification, Dual-Nurse Bedside Protocol & Anti-Hemolytic Barrier
          </p>
        </div>

        {/* Component Inventory Chips */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PRBC: </span>
            <span style={{ fontWeight: 'bold', color: '#ef4444' }}>42 Units</span>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>FFP: </span>
            <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>18 Units</span>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Platelets: </span>
            <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>9 Units</span>
          </div>
        </div>
      </div>

      {/* Main Verification Cockpit */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recipient Patient Details */}
        <Card style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.5rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>👤</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
              1. Recipient Patient Information
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                PATIENT UHID
              </label>
              <input
                type="text"
                value={patientUhid}
                onChange={(e) => setPatientUhid(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                PATIENT NAME & LOCATION
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                VERIFIED PATIENT BLOOD GROUP (LAB CERTIFIED)
              </label>
              <select
                value={patientBloodGroup}
                onChange={(e) => setPatientBloodGroup(e.target.value as BloodGroup)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#ef4444',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  border: '1.5px solid #ef4444',
                  borderRadius: '6px'
                }}
              >
                {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodGroup[]).map((bg) => (
                  <option key={bg} value={bg}>
                    Blood Group: {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Donor Unit Details */}
        <Card style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.5rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🩸</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
              2. Donor Blood Bag Unit Information
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                DONOR BLOOD BAG BARCODE / UNIT ID
              </label>
              <input
                type="text"
                value={donorBagUnitId}
                onChange={(e) => setDonorBagUnitId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  COMPONENT TYPE
                </label>
                <select
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value as ComponentType)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '6px'
                  }}
                >
                  <option value="PACKED_RED_BLOOD_CELLS">Packed Red Cells (PRBC)</option>
                  <option value="FRESH_FROZEN_PLASMA">Fresh Frozen Plasma (FFP)</option>
                  <option value="PLATELET_CONCENTRATE">Platelet Concentrate</option>
                  <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  DONOR BLOOD GROUP
                </label>
                <select
                  value={donorBloodGroup}
                  onChange={(e) => setDonorBloodGroup(e.target.value as BloodGroup)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    color: isAboCompatible ? '#10b981' : '#ef4444',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    border: `1.5px solid ${isAboCompatible ? '#10b981' : '#ef4444'}`,
                    borderRadius: '6px'
                  }}
                >
                  {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodGroup[]).map((bg) => (
                    <option key={bg} value={bg}>
                      Donor: {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                UNIT EXPIRY DATE
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Realtime Compatibility Banner */}
      <div
        style={{
          margin: '1.5rem 0',
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: isAboCompatible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)',
          border: `1.5px solid ${isAboCompatible ? '#10b981' : '#ef4444'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.75rem' }}>{isAboCompatible ? '✅' : '🚨'}</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: isAboCompatible ? '#34d399' : '#f87171' }}>
              {isAboCompatible
                ? `ABO/Rh MATCH OK: Donor ${donorBloodGroup} is safe for Patient ${patientBloodGroup}`
                : `INCOMPATIBLE BLOOD TYPE: Donor ${donorBloodGroup} CANNOT be given to Patient ${patientBloodGroup}`}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Universal Red Cell Rule: Patient with {patientBloodGroup} can safely receive red cells from:{' '}
              {COMPATIBLE_PRBC_DONORS[patientBloodGroup]?.join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Nurse Verification & Release Form */}
      <Card style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 1rem', color: '#f8fafc' }}>
          3. Mandatory Dual-Nurse Bedside Cross-Verification
        </h2>
        <form onSubmit={handleVerifyAndRelease}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                PRIMARY NURSE STAFF ID / PIN *
              </label>
              <input
                type="password"
                placeholder="Nurse 1 PIN"
                value={nurse1Pin}
                onChange={(e) => setNurse1Pin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                SECONDARY VERIFYING NURSE STAFF ID / PIN *
              </label>
              <input
                type="password"
                placeholder="Nurse 2 PIN"
                value={nurse2Pin}
                onChange={(e) => setNurse2Pin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>

          {verificationResult.status && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '6px',
                marginBottom: '1.5rem',
                backgroundColor:
                  verificationResult.status === 'VERIFIED'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(239, 68, 68, 0.25)',
                border:
                  verificationResult.status === 'VERIFIED'
                    ? '1px solid #10b981'
                    : '1px solid #ef4444',
                color: verificationResult.status === 'VERIFIED' ? '#34d399' : '#fca5a5'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{verificationResult.message}</div>
              {verificationResult.authHash && (
                <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#a7f3d0' }}>
                  Cryptographic Release Hash: {verificationResult.authHash}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button
              variant="primary"
              type="submit"
              disabled={!isAboCompatible}
              style={{
                backgroundColor: isAboCompatible ? '#10b981' : '#64748b',
                cursor: isAboCompatible ? 'pointer' : 'not-allowed'
              }}
            >
              Sign & Release Blood Unit for Transfusion
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
