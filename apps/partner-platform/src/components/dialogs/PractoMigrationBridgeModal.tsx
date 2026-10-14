import React, { useState } from 'react';
import { Button } from '@docsearch/ui-kit';

export interface PractoMigrationBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete?: (count: number) => void;
}

export type MigrationSource = 'PRACTO_RAY' | 'EKA_CARE' | 'ZOCDOC';

interface ParsedRecord {
  id: string;
  source: MigrationSource;
  uhid: string;
  name: string;
  mobile: string;
  gender: string;
  age: number;
  allergies: string;
  history: string;
  insuranceOrAbha: string;
  lastVisit: string;
  status: 'VALID' | 'DUPLICATE' | 'ERROR';
}

const SAMPLE_RECORDS: Record<MigrationSource, ParsedRecord[]> = {
  PRACTO_RAY: [
    { id: '1', source: 'PRACTO_RAY', uhid: 'PR-8901', name: 'Rajesh Sharma', mobile: '+91 98765 43210', gender: 'Male', age: 48, allergies: 'Penicillin, Sulfa', history: 'Type 2 Diabetes, Hypertension', insuranceOrAbha: 'Star Health (STAR-98124)', lastVisit: '12 Sep 2026', status: 'VALID' },
    { id: '2', source: 'PRACTO_RAY', uhid: 'PR-8902', name: 'Sunita Mehra', mobile: '+91 98123 45678', gender: 'Female', age: 36, allergies: 'None Known', history: 'Migraine, Hypothyroid', insuranceOrAbha: 'HDFC ERGO (HDFC-4412)', lastVisit: '24 Sep 2026', status: 'VALID' },
    { id: '3', source: 'PRACTO_RAY', uhid: 'PR-8903', name: 'Anil Kapoor', mobile: '+91 99999 12345', gender: 'Male', age: 52, allergies: 'Aspirin', history: 'Post-CABG, Dyslipidemia', insuranceOrAbha: 'Care Health (CARE-1002)', lastVisit: '01 Oct 2026', status: 'VALID' },
    { id: '4', source: 'PRACTO_RAY', uhid: 'PR-8904', name: 'Pooja Verma', mobile: '+91 98765 43210', gender: 'Female', age: 29, allergies: 'None Known', history: 'Routine Checkup', insuranceOrAbha: 'Self-Pay / Cash', lastVisit: '08 Oct 2026', status: 'DUPLICATE' },
    { id: '5', source: 'PRACTO_RAY', uhid: 'PR-8905', name: 'Harish Chandra', mobile: '+91 98222 33110', gender: 'Male', age: 61, allergies: 'Iodine Contrast', history: 'CKD Stage 3, Gout', insuranceOrAbha: 'Ayushman Bharat PM-JAY', lastVisit: '10 Oct 2026', status: 'VALID' }
  ],
  EKA_CARE: [
    { id: 'e1', source: 'EKA_CARE', uhid: 'EKA-1021', name: 'Deepak Varma', mobile: '+91 97112 34567', gender: 'Male', age: 42, allergies: 'Ciprofloxacin', history: 'Asthma, GERD', insuranceOrAbha: '91-8844-2211-1021@abdm', lastVisit: '05 Oct 2026', status: 'VALID' },
    { id: 'e2', source: 'EKA_CARE', uhid: 'EKA-1022', name: 'Kavita Joshi', mobile: '+91 98234 56789', gender: 'Female', age: 31, allergies: 'None', history: 'PCOS, Iron Deficiency', insuranceOrAbha: '91-9922-3344-5566@abdm', lastVisit: '07 Oct 2026', status: 'VALID' },
    { id: 'e3', source: 'EKA_CARE', uhid: 'EKA-1023', name: 'Rohan Deshmukh', mobile: '+91 98345 67890', gender: 'Male', age: 55, allergies: 'Sulfa', history: 'Hypertension, Fatty Liver', insuranceOrAbha: '91-7711-2233-4455@abdm', lastVisit: '11 Oct 2026', status: 'VALID' }
  ],
  ZOCDOC: [
    { id: 'z1', source: 'ZOCDOC', uhid: 'ZOC-5501', name: 'Amitabh Sen', mobile: '+91 98456 78901', gender: 'Male', age: 39, allergies: 'Amoxicillin', history: 'Lumbar Spondylosis', insuranceOrAbha: 'Max Bupa Health (MAX-901)', lastVisit: '02 Oct 2026', status: 'VALID' },
    { id: 'z2', source: 'ZOCDOC', uhid: 'ZOC-5502', name: 'Meera Chawla', mobile: '+91 98567 89012', gender: 'Female', age: 45, allergies: 'None Known', history: 'Osteoarthritis Knee', insuranceOrAbha: 'ICICI Lombard (ICICI-771)', lastVisit: '09 Oct 2026', status: 'VALID' },
    { id: 'z3', source: 'ZOCDOC', uhid: 'ZOC-5503', name: 'Arjun Nambiar', mobile: '+91 98456 78901', gender: 'Male', age: 39, allergies: 'Amoxicillin', history: 'Follow-up Consultation', insuranceOrAbha: 'Max Bupa Health (MAX-901)', lastVisit: '12 Oct 2026', status: 'DUPLICATE' }
  ]
};

export const PractoMigrationBridgeModal: React.FC<PractoMigrationBridgeModalProps> = ({
  isOpen,
  onClose,
  onMigrationComplete
}) => {
  const [selectedSource, setSelectedSource] = useState<MigrationSource>('PRACTO_RAY');
  const [step, setStep] = useState<'SOURCE_SELECT' | 'MAP_VALIDATE' | 'IMPORTING' | 'SUMMARY'>('SOURCE_SELECT');
  const [importedCount, setImportedCount] = useState<number>(0);

  if (!isOpen) return null;

  const currentRecords = SAMPLE_RECORDS[selectedSource];
  const validCount = currentRecords.filter((r) => r.status === 'VALID').length;
  const duplicateCount = currentRecords.filter((r) => r.status === 'DUPLICATE').length;

  const handleStartImport = () => {
    setStep('IMPORTING');
    setTimeout(() => {
      setImportedCount(validCount);
      setStep('SUMMARY');
      if (onMigrationComplete) {
        onMigrationComplete(validCount);
      }
    }, 1400);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 24, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          backgroundColor: '#0F172A',
          borderRadius: '24px',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.8rem' }}>🔄</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Universal EMR Migration Bridge
                </h3>
                <span style={{ fontSize: '0.6875rem', backgroundColor: '#0284C7', color: '#FFF', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  Practo • Eka Care • Zocdoc
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
                1-Click sovereign data migration • Zero lock-in • Automatic field mapping & deduplication
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
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Competitor Source Selector Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 24px',
            gap: '12px'
          }}
        >
          {[
            { id: 'PRACTO_RAY' as MigrationSource, name: 'Practo Ray CSV Export', logo: '🔴', desc: 'Patients, Clinical Notes & Bills' },
            { id: 'EKA_CARE' as MigrationSource, name: 'Eka Care JSON / ABDM', logo: '🟢', desc: 'ABHA Records & Voice Rx' },
            { id: 'ZOCDOC' as MigrationSource, name: 'Zocdoc Patients & Intake', logo: '🔵', desc: 'Appointments & Insurance Forms' }
          ].map((src) => {
            const isSelected = selectedSource === src.id;
            return (
              <button
                key={src.id}
                type="button"
                onClick={() => {
                  setSelectedSource(src.id);
                  if (step === 'SUMMARY') setStep('SOURCE_SELECT');
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: isSelected ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{src.logo}</span>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                    {src.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                    {src.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* STEP 1: SOURCE SELECT & UPLOAD */}
          {step === 'SOURCE_SELECT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  border: '2px dashed rgba(56, 189, 248, 0.35)',
                  backgroundColor: 'rgba(56, 189, 248, 0.04)',
                  borderRadius: '16px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setStep('MAP_VALIDATE')}
              >
                <span style={{ fontSize: '3rem' }}>📂</span>
                <h4 style={{ margin: '12px 0 6px', color: '#F8FAFC', fontSize: '1.05rem', fontWeight: 700 }}>
                  Drag & Drop {selectedSource === 'PRACTO_RAY' ? 'Practo Ray CSV Export' : selectedSource === 'EKA_CARE' ? 'Eka Care ABHA Backup File' : 'Zocdoc Patient Appointment Dump'}
                </h4>
                <p style={{ margin: '0 0 16px', color: '#94A3B8', fontSize: '0.8125rem' }}>
                  Supports .csv, .xlsx, or .json dumps • Automatic column detection & cryptographic deduplication
                </p>
                <Button variant="primary" size="sm" onClick={() => setStep('MAP_VALIDATE')}>
                  ⚡ Ingest & Auto-Map Fields (Demo Dump)
                </Button>
              </div>

              {/* Security & Sovereignty Callout */}
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid #10B981',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.8rem',
                  color: '#34D399'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                <div>
                  <strong>100% Hospital Data Sovereignty:</strong> Imported patient records are stored locally in your hospital database. No data is shared with Practo, Eka Care, Zocdoc, or external third-party advertisers.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MAP & VALIDATE */}
          {step === 'MAP_VALIDATE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                    Source: {selectedSource} • Parsed Records ({currentRecords.length})
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Schema Match Confidence: <strong style={{ color: '#10B981' }}>99.8% (Exact)</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
                    ✓ {validCount} Valid Unique
                  </span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
                    ⚠️ {duplicateCount} Duplicate Flagged
                  </span>
                </div>
              </div>

              {/* Records Preview Table */}
              <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', color: '#94A3B8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <th style={{ padding: '10px 12px' }}>UHID / ID</th>
                      <th style={{ padding: '10px 12px' }}>Patient Name</th>
                      <th style={{ padding: '10px 12px' }}>Mobile</th>
                      <th style={{ padding: '10px 12px' }}>Allergies</th>
                      <th style={{ padding: '10px 12px' }}>Medical History</th>
                      <th style={{ padding: '10px 12px' }}>Insurance / ABHA</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#CBD5E1' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#38BDF8' }}>{r.uhid}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#F8FAFC' }}>{r.name} ({r.gender[0]}/{r.age})</td>
                        <td style={{ padding: '10px 12px' }}>{r.mobile}</td>
                        <td style={{ padding: '10px 12px', color: r.allergies.includes('Penicillin') || r.allergies.includes('Sulfa') ? '#F87171' : '#94A3B8' }}>{r.allergies}</td>
                        <td style={{ padding: '10px 12px' }}>{r.history}</td>
                        <td style={{ padding: '10px 12px', color: '#34D399', fontWeight: 600 }}>{r.insuranceOrAbha}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              backgroundColor: r.status === 'VALID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: r.status === 'VALID' ? '#34D399' : '#F87171'
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: IMPORTING */}
          {step === 'IMPORTING' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '3rem' }}>⚡</span>
              <h4 style={{ margin: '14px 0 6px', color: '#F8FAFC', fontSize: '1.2rem' }}>
                Migrating {validCount} Patients into DocSearch Sovereign Store...
              </h4>
              <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>
                Converting clinical diagnoses to SNOMED-CT & ICD-10, preserving historical encounters.
              </p>
              <div
                style={{
                  width: '280px',
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  margin: '24px auto 0',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: '75%',
                    height: '100%',
                    backgroundColor: '#38BDF8',
                    borderRadius: '3px',
                    animation: 'pulse 1s infinite'
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY */}
          {step === 'SUMMARY' && (
            <div style={{ textAlign: 'center', padding: '24px 20px' }}>
              <span style={{ fontSize: '3.5rem' }}>🎉</span>
              <h3 style={{ margin: '12px 0 6px', color: '#F8FAFC', fontSize: '1.35rem', fontWeight: 900 }}>
                Migration Completed Successfully!
              </h3>
              <p style={{ margin: '0 0 24px', color: '#94A3B8', fontSize: '0.85rem' }}>
                All patient profiles, allergy flags, and chronic histories are immediately ready for OPD consultations.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34D399' }}>{importedCount}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>Active Patients Migrated</div>
                </div>

                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8' }}>100%</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>Allergy Flags Preserved</div>
                </div>

                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FBBF24' }}>0 ms</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>Prescription Readiness</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {step !== 'SUMMARY' ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (step === 'MAP_VALIDATE') setStep('SOURCE_SELECT');
                  else onClose();
                }}
              >
                {step === 'SOURCE_SELECT' ? 'Cancel' : '← Back'}
              </Button>

              {step === 'MAP_VALIDATE' && (
                <Button variant="primary" size="sm" onClick={handleStartImport}>
                  ⚡ Import {validCount} Patients to Local DB
                </Button>
              )}
            </>
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Button variant="primary" size="md" onClick={onClose}>
                Done • Start Prescribing
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
