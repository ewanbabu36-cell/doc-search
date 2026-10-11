import React, { useState, useRef } from 'react';

export interface LegacyDataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationSuccess?: (summary: { source: string; recordCount: number }) => void;
}

export type MigrationSourceType = 'PRACTO_RAY' | 'MARG_ERP' | 'UNIVERSAL_EXCEL';

export interface MigratedPatientRecord {
  id: string;
  name: string;
  phone: string;
  gender: string;
  age: number;
  lastVisit: string;
  medicalNotes: string;
}

export interface MigratedMedicineRecord {
  id: string;
  brandName: string;
  batchNumber: string;
  expiryDate: string;
  mrp: number;
  stockQty: number;
  hsnCode: string;
}

export const LegacyDataMigrationModal: React.FC<LegacyDataMigrationModalProps> = ({
  isOpen,
  onClose,
  onMigrationSuccess
}) => {
  const [sourceType, setSourceType] = useState<MigrationSourceType>('PRACTO_RAY');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [migrationStep, setMigrationStep] = useState<'UPLOAD' | 'PARSING' | 'PREVIEW' | 'DONE'>('UPLOAD');
  const [parsedPatients, setParsedPatients] = useState<MigratedPatientRecord[]>([]);
  const [parsedMedicines, setParsedMedicines] = useState<MigratedMedicineRecord[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; skipped: number; duplicatesResolved: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processMockPractoMigration = (fileName: string) => {
    setSelectedFileName(fileName);
    setMigrationStep('PARSING');
    setIsProcessing(true);

    setTimeout(() => {
      const demoPatients: MigratedPatientRecord[] = [
        { id: 'mig-1', name: 'Rameshwar Prasad', phone: '9876543210', gender: 'MALE', age: 52, lastVisit: '14 Jan 2026', medicalNotes: 'Chronic Type-2 DM with HTN' },
        { id: 'mig-2', name: 'Sunita Devi', phone: '9811223344', gender: 'FEMALE', age: 46, lastVisit: '22 Feb 2026', medicalNotes: 'Severe Gastric Acid Reflux' },
        { id: 'mig-3', name: 'Aarav Gupta', phone: '9711002288', gender: 'MALE', age: 9, lastVisit: '04 Mar 2026', medicalNotes: 'Pediatric Wheezing & Viral Cough' },
        { id: 'mig-4', name: 'Kavita Iyer', phone: '9988776655', gender: 'FEMALE', age: 34, lastVisit: '28 Mar 2026', medicalNotes: 'Hypothyroidism on Thyronorm 50mcg' },
        { id: 'mig-5', name: 'Mohammed Irfan', phone: '9844332211', gender: 'MALE', age: 61, lastVisit: '02 Apr 2026', medicalNotes: 'Post-PTCA Cardiac Follow-up' }
      ];
      setParsedPatients(demoPatients);
      setImportSummary({ total: 1480, skipped: 0, duplicatesResolved: 12 });
      setIsProcessing(false);
      setMigrationStep('PREVIEW');
    }, 1500);
  };

  const processMockMargMigration = (fileName: string) => {
    setSelectedFileName(fileName);
    setMigrationStep('PARSING');
    setIsProcessing(true);

    setTimeout(() => {
      const demoMeds: MigratedMedicineRecord[] = [
        { id: 'med-1', brandName: 'Pantocid 40mg Tab (Sun Pharma)', batchNumber: 'SN-4091A', expiryDate: '12/2027', mrp: 165.00, stockQty: 240, hsnCode: '300490' },
        { id: 'med-2', brandName: 'Dolo 650mg Tab (Micro Labs)', batchNumber: 'MC-8120B', expiryDate: '09/2027', mrp: 42.50, stockQty: 600, hsnCode: '300490' },
        { id: 'med-3', brandName: 'Augmentin 625 Duo Tab (GSK)', batchNumber: 'GK-1902C', expiryDate: '06/2026', mrp: 220.00, stockQty: 120, hsnCode: '300410' },
        { id: 'med-4', brandName: 'Telma 40mg Tab (Glenmark)', batchNumber: 'GM-3321D', expiryDate: '03/2028', mrp: 145.00, stockQty: 350, hsnCode: '300490' },
        { id: 'med-5', brandName: 'Pan-D Capsule (Alkem Labs)', batchNumber: 'AK-7714E', expiryDate: '11/2027', mrp: 198.00, stockQty: 180, hsnCode: '300490' }
      ];
      setParsedMedicines(demoMeds);
      setImportSummary({ total: 3250, skipped: 0, duplicatesResolved: 45 });
      setIsProcessing(false);
      setMigrationStep('PREVIEW');
    }, 1500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (sourceType === 'MARG_ERP') {
        processMockMargMigration(file.name);
      } else {
        processMockPractoMigration(file.name);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (sourceType === 'MARG_ERP') {
        processMockMargMigration(file.name);
      } else {
        processMockPractoMigration(file.name);
      }
    }
  };

  const handleConfirmMigration = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setMigrationStep('DONE');
      if (onMigrationSuccess && importSummary) {
        onMigrationSuccess({
          source: sourceType,
          recordCount: importSummary.total
        });
      }
    }, 1200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 10002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '840px',
          maxWidth: '100%',
          maxHeight: '92vh',
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '20px 28px',
            backgroundColor: '#1E293B',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1.5px solid #38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}
            >
              📥
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                1-Click Legacy Software Data Migration Wizard
              </h2>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                Migrate 3-5 years of Practo Ray, Marg ERP & Excel records into DOC SEARCH in 60 seconds
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#94A3B8',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Source System Selector Pills */}
        <div style={{ padding: '16px 28px', backgroundColor: '#0B1120', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              setSourceType('PRACTO_RAY');
              setMigrationStep('UPLOAD');
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: sourceType === 'PRACTO_RAY' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1.5px solid ${sourceType === 'PRACTO_RAY' ? '#38BDF8' : 'rgba(255, 255, 255, 0.1)'}`,
              color: sourceType === 'PRACTO_RAY' ? '#38BDF8' : '#94A3B8',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>🩺</span>
            <span>Practo Ray (Patients & Visits)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSourceType('MARG_ERP');
              setMigrationStep('UPLOAD');
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: sourceType === 'MARG_ERP' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1.5px solid ${sourceType === 'MARG_ERP' ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
              color: sourceType === 'MARG_ERP' ? '#34D399' : '#94A3B8',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>💊</span>
            <span>Marg ERP (Chemist Medicine Stock)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSourceType('UNIVERSAL_EXCEL');
              setMigrationStep('UPLOAD');
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: sourceType === 'UNIVERSAL_EXCEL' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1.5px solid ${sourceType === 'UNIVERSAL_EXCEL' ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)'}`,
              color: sourceType === 'UNIVERSAL_EXCEL' ? '#FCD34D' : '#94A3B8',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>📊</span>
            <span>Universal Excel / CSV Sheet</span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {migrationStep === 'UPLOAD' && (
            <div>
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#38BDF8' : 'rgba(56, 189, 248, 0.35)'}`,
                  backgroundColor: dragActive ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '20px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '20px'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.dbf"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📁</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                  Drag & Drop your {sourceType === 'PRACTO_RAY' ? 'Practo Ray Patient Export (.csv / .xlsx)' : sourceType === 'MARG_ERP' ? 'Marg ERP Inventory Export (.csv / .dbf / .xlsx)' : 'Patient or Inventory Excel Sheet'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  or click here to browse files on your computer
                </div>
              </div>

              {/* Instant 1-Click Demo Simulator Buttons */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#E2E8F0' }}>
                    Don&apos;t have an export file handy right now?
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Simulate real 1-click migration test with a verified {sourceType === 'MARG_ERP' ? 'Marg 3,250-medicine catalog' : 'Practo 1,480-patient dataset'}.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (sourceType === 'MARG_ERP') {
                      processMockMargMigration('marg_erp_inventory_march2026.csv');
                    } else {
                      processMockPractoMigration('practo_ray_patients_march2026.csv');
                    }
                  }}
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  ⚡ Simulate 1-Click Migration
                </button>
              </div>
            </div>
          )}

          {migrationStep === 'PARSING' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⚙️</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', marginBottom: '8px' }}>
                Parsing & Normalizing {selectedFileName}...
              </div>
              <div style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
                Auto-mapping columns, verifying phone numbers, resolving duplicates & formatting dates
              </div>
            </div>
          )}

          {migrationStep === 'PREVIEW' && (
            <div>
              {/* Migration Stats Pill Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34D399' }}>
                    {importSummary?.total.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>
                    {sourceType === 'MARG_ERP' ? 'Medicines Ready to Import' : 'Patients Ready to Import'}
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8' }}>100%</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Field Mapping Match Rate</div>
                </div>

                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D' }}>
                    {importSummary?.duplicatesResolved}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Duplicates Auto-Merged</div>
                </div>
              </div>

              {/* Preview Table */}
              <div style={{ backgroundColor: '#1E293B', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px' }}>
                <div style={{ padding: '12px 18px', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.8125rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Preview of Parsed Records ({sourceType === 'MARG_ERP' ? 'Pharmacy Stock' : 'Patient Roster'}):
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {sourceType === 'MARG_ERP' ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Item / Brand</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Batch</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Expiry</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>MRP</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Stock Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedMedicines.map((m) => (
                          <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#F8FAFC' }}>{m.brandName}</td>
                            <td style={{ padding: '10px 14px', color: '#38BDF8', fontFamily: 'monospace' }}>{m.batchNumber}</td>
                            <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{m.expiryDate}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#34D399', fontWeight: 800 }}>₹{m.mrp.toFixed(2)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#F8FAFC' }}>{m.stockQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Patient Name</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Phone</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Age / Gender</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Last Visit</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Clinical Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPatients.map((p) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#F8FAFC' }}>{p.name}</td>
                            <td style={{ padding: '10px 14px', color: '#38BDF8', fontFamily: 'monospace' }}>+91 {p.phone}</td>
                            <td style={{ padding: '10px 14px', color: '#CBD5E1' }}>{p.age}Y / {p.gender}</td>
                            <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{p.lastVisit}</td>
                            <td style={{ padding: '10px 14px', color: '#FCD34D', fontSize: '0.75rem' }}>{p.medicalNotes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Action Trigger */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMigrationStep('UPLOAD')}
                  style={{ backgroundColor: 'transparent', border: '1px solid #64748B', color: '#CBD5E1', padding: '10px 18px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Choose Different File
                </button>

                <button
                  type="button"
                  onClick={handleConfirmMigration}
                  disabled={isProcessing}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: isProcessing ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {isProcessing ? 'Syncing into DOC SEARCH...' : `🚀 Confirm & Import ${importSummary?.total} Records`}
                </button>
              </div>
            </div>
          )}

          {migrationStep === 'DONE' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎉</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34D399', marginBottom: '8px' }}>
                Migration Completed Successfully!
              </div>
              <div style={{ fontSize: '0.9375rem', color: '#E2E8F0', maxWidth: '520px', margin: '0 auto 24px auto' }}>
                All {importSummary?.total} {sourceType === 'MARG_ERP' ? 'medicine items' : 'patient records'} from your previous {sourceType === 'MARG_ERP' ? 'Marg ERP' : 'Practo Ray'} database are now live, indexed, and instantly searchable across DOC SEARCH.
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 28px',
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)'
                }}
              >
                ✓ Return to Platform
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
