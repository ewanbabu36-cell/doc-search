import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

export type LegacySourceSystem = 'PRACTO_RAY' | 'MARG_ERP' | 'VYAPAR_TALLY' | 'LIVEHEALTH_CRELIO';

export interface MigrationFieldMapping {
  sourceColumn: string;
  targetField: string;
  transformation?: 'PHONE_E164' | 'DATE_ISO' | 'UPPERCASE' | 'NUMBER_CLEAN' | 'NONE';
}

export interface MigrationDryRunResult {
  detectedSystem: LegacySourceSystem;
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  detectedMappings: MigrationFieldMapping[];
  previewRows: Array<Record<string, unknown>>;
  validationWarnings: Array<{ rowNumber: number; field: string; message: string; originalValue: unknown }>;
  estimatedIngestionSeconds: number;
}

export interface MigrationExecutionResult {
  migrationId: string;
  sourceSystem: LegacySourceSystem;
  tenantId: string;
  executedAt: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsFailed: number;
  targetEntities: {
    patients?: number;
    appointments?: number;
    inventoryBatches?: number;
    labTests?: number;
  };
  auditHash: string;
  status: 'COMPLETED' | 'COMPLETED_WITH_WARNINGS' | 'FAILED';
  summaryMessage: string;
}

export interface LegacyDataMigrationWizardViewProps {
  tenantId?: string;
  onNavigateToModule?: (moduleKey: string) => void;
}

export const LegacyDataMigrationWizardView: React.FC<LegacyDataMigrationWizardViewProps> = ({
  tenantId: _tenantId = 'default-tenant',
  onNavigateToModule
}) => {
  const [selectedSystem, setSelectedSystem] = useState<LegacySourceSystem>('PRACTO_RAY');
  const [csvContent, setCsvContent] = useState<string>('');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dryRunResult, setDryRunResult] = useState<MigrationDryRunResult | null>(null);
  const [executionResult, setExecutionResult] = useState<MigrationExecutionResult | null>(null);
  const [history, setHistory] = useState<MigrationExecutionResult[]>([]);

  // Load migration history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiRequest<MigrationExecutionResult[]>(
        '/api/v1/partner/migration/history',
        { method: 'GET' }
      );
      if (res && res.data) {
        setHistory(res.data);
      }
    } catch {
      // Fallback mock history for standalone testing
      setHistory([]);
    }
  };

  const handleDownloadTemplate = async (sys: LegacySourceSystem) => {
    try {
      const res = await fetch(`/api/v1/partner/migration/sample-template/${sys}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sys.toLowerCase()}-sample-template.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
    } catch {
      // Fallback mock CSV in browser
    }

    let defaultCsv = '';
    if (sys === 'PRACTO_RAY') {
      defaultCsv = 'Patient Name,Mobile Number,Gender,Age,City,UHID,Last Visit Date,Allergies\nRajesh Kumar,+919876543210,MALE,42,Delhi,PR-10021,2026-08-10,Penicillin\nPooja Sharma,9823456789,FEMALE,31,Mumbai,PR-10022,2026-09-12,None';
    } else if (sys === 'MARG_ERP') {
      defaultCsv = 'Item Name,Batch No,Expiry Date,MRP,Purchase Rate,Current Stock,Mfg Company,HSN Code\nAmoxicillin 500mg,AMX-8821,12/28,120.00,85.50,500,Cipla,3004\nParacetamol 650mg,PCM-4412,06/27,30.00,18.20,1200,Micro Labs,3004';
    } else if (sys === 'LIVEHEALTH_CRELIO') {
      defaultCsv = 'Test Name,Test Code,Department,Sample Type,Normal Low,Normal High,Units,Panic Low,Panic High,MRP\nComplete Blood Count,CBC,HEMATOLOGY,Whole Blood EDTA,0,0,,0,0,350.00\nHbA1c,HBA1C,BIOCHEMISTRY,Whole Blood,4.0,5.6,%,3.0,14.0,600.00';
    } else {
      defaultCsv = 'Party Name,Phone Number,GSTIN,Opening Balance,Credit Limit,Address\nSharma Medical Agency,9876500000,07AAAAA0000A1Z5,45000.00,100000.00,New Delhi';
    }

    const blob = new Blob([defaultCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sys.toLowerCase()}-sample-template.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      setErrorMessage(null);
    };
    reader.readAsText(file);
  };

  const handleRunDryRun = async () => {
    if (!csvContent.trim()) {
      setErrorMessage('Please paste or upload CSV data first.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiRequest<MigrationDryRunResult>(
        '/api/v1/partner/migration/dry-run',
        {
          method: 'POST',
          body: JSON.stringify({
            csvContent,
            forcedSystem: selectedSystem
          })
        }
      );

      if (res && res.data) {
        setDryRunResult(res.data);
        setStep(3);
      } else {
        throw new Error('Dry run simulation returned empty payload');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to simulate migration dry run.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteMigration = async () => {
    if (!csvContent.trim() || !dryRunResult) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiRequest<MigrationExecutionResult>(
        '/api/v1/partner/migration/execute',
        {
          method: 'POST',
          body: JSON.stringify({
            csvContent,
            system: dryRunResult.detectedSystem || selectedSystem
          })
        }
      );

      if (res && res.data) {
        setExecutionResult(res.data);
        setStep(4);
        fetchHistory();
      } else {
        throw new Error('Migration execution failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Migration execution encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetWizard = () => {
    setCsvContent('');
    setDryRunResult(null);
    setExecutionResult(null);
    setErrorMessage(null);
    setStep(1);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>⚡</span>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                1-Click Legacy Data Migrator Engine
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                Zero-downtime, automated intake of patients, inventory batches, and lab registries from Practo Ray, Marg ERP, Vyapar & LiveHealth.
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="success" style={{ border: '1px solid #a7f3d0' }}>
            100% Free Lifetime ERP
          </Badge>
          <Badge variant="info" style={{ border: '1px solid #bfdbfe' }}>
            Atomic Ingestion
          </Badge>
        </div>
      </div>

      {/* Wizard Step Progress Tracker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { num: 1, title: 'Select Legacy Software', desc: 'Practo, Marg, Vyapar, LiveHealth' },
          { num: 2, title: 'Import & Field Mapping', desc: 'CSV Intake & Auto-Detection' },
          { num: 3, title: 'AI Dry-Run Simulation', desc: 'Pre-flight Validation & Warnings' },
          { num: 4, title: 'Atomic Execution', desc: 'Native Ingest & Cryptographic Hash' }
        ].map((s) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div
              key={s.num}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: isActive ? '2px solid #2563eb' : isDone ? '1px solid #10b981' : '1px solid #e2e8f0',
                background: isActive ? '#eff6ff' : isDone ? '#f0fdf4' : '#f8fafc',
                cursor: isDone ? 'pointer' : 'default',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                if (isDone) setStep(s.num as any);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: isActive ? '#2563eb' : isDone ? '#10b981' : '#cbd5e1',
                    color: '#ffffff'
                  }}
                >
                  {isDone ? '✓' : s.num}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: isActive ? '#1d4ed8' : '#1e293b' }}>
                  {s.title}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', paddingLeft: '32px' }}>{s.desc}</div>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Select Legacy Software */}
      {step === 1 && (
        <Card style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
            Choose the Legacy Software you are switching from:
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {[
              {
                id: 'PRACTO_RAY' as LegacySourceSystem,
                name: 'Practo Ray EMR',
                icon: '🏥',
                tag: 'Clinical OPD & EHR',
                desc: 'Imports Patients, UHID numbers, Mobile numbers, Gender, Medical history, and Past consultation visits.'
              },
              {
                id: 'MARG_ERP' as LegacySourceSystem,
                name: 'Marg ERP 9+ Pharma',
                icon: '💊',
                tag: 'Pharmacy & Stock',
                desc: 'Imports Wholesale & Retail Medicines, Batch Numbers, Expiry Dates, MRP, Purchase Rates, Salt/Generics & Stock.'
              },
              {
                id: 'VYAPAR_TALLY' as LegacySourceSystem,
                name: 'Vyapar / Tally Prime',
                icon: '📊',
                tag: 'Billing & Accounting',
                desc: 'Imports Suppliers, Vendors, GSTINs, Ledger accounts, Outstanding balances, and Financial customer records.'
              },
              {
                id: 'LIVEHEALTH_CRELIO' as LegacySourceSystem,
                name: 'LiveHealth / CrelioDocs',
                icon: '🔬',
                tag: 'Pathology & LIMS',
                desc: 'Imports Pathology Test Directory, Biological reference ranges, Normal/Panic cutoffs, Specimen types, and Prices.'
              }
            ].map((sys) => {
              const isSelected = selectedSystem === sys.id;
              return (
                <div
                  key={sys.id}
                  style={{
                    padding: '18px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: isSelected ? '#f8faff' : '#ffffff',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSelectedSystem(sys.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px' }}>{sys.icon}</span>
                    <Badge variant="primary" style={{ fontSize: '11px' }}>
                      {sys.tag}
                    </Badge>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#1e293b' }}>{sys.name}</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>{sys.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadTemplate(sys.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      📥 Download CSV Template
                    </button>
                    {isSelected && (
                      <span style={{ color: '#2563eb', fontWeight: 800, fontSize: '13px' }}>Selected ✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              style={{ background: '#2563eb', color: '#ffffff', padding: '10px 24px', fontWeight: 600 }}
              onClick={() => setStep(2)}
            >
              Continue to Data Intake →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: CSV Data Dropzone & Auto-Detector */}
      {step === 2 && (
        <Card style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Upload or Paste CSV Data ({selectedSystem.replace('_', ' ')})
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                DocSearch intelligent normalization engine automatically cleans up phone numbers (+91 E.164), dates, and currencies.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadTemplate(selectedSystem)}
              style={{ fontSize: '12px' }}
            >
              📥 Download Sample CSV
            </Button>
          </div>

          {/* File Upload Trigger */}
          <div
            style={{
              border: '2px dashed #93c5fd',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              background: '#f8faff',
              marginBottom: '16px'
            }}
          >
            <input
              type="file"
              accept=".csv,.txt,.tsv"
              id="csv-file-upload"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label htmlFor="csv-file-upload" style={{ cursor: 'pointer' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📂</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#2563eb' }}>
                Click to browse CSV file from your computer
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Supports standard export files from Practo, Marg, Vyapar, or LiveHealth (Max 50MB)
              </span>
            </label>
          </div>

          {/* Or Paste CSV text */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Or Paste CSV Raw Text directly:
            </label>
            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste comma-separated data with headers here..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                background: '#fafafa',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Back to Software Selection
            </Button>
            <Button
              variant="primary"
              disabled={isLoading || !csvContent.trim()}
              onClick={handleRunDryRun}
              style={{ background: '#2563eb', color: '#ffffff', fontWeight: 600, padding: '10px 24px' }}
            >
              {isLoading ? 'Analyzing Signatures...' : 'Run AI Dry-Run Simulation →'}
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: AI Dry-Run Simulation & Pre-Flight Validation */}
      {step === 3 && dryRunResult && (
        <Card style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Pre-Flight Ingestion Simulation & Field Mapping
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Detected System Format:{' '}
                <strong style={{ color: '#2563eb' }}>{dryRunResult.detectedSystem.replace('_', ' ')}</strong> (AI Signature Match)
              </p>
            </div>
            <Badge variant="success" style={{ fontSize: '12px' }}>
              ⚡ Est. Processing Time: ~{dryRunResult.estimatedIngestionSeconds}s
            </Badge>
          </div>

          {/* KPI Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL ROWS</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {dryRunResult.totalRows.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>READY TO INGEST</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                {dryRunResult.validRows.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef08a' }}>
              <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: 600 }}>WARNINGS DETECTED</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                {dryRunResult.warningRows.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600 }}>INVALID ROWS</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
                {dryRunResult.invalidRows.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Field Mapping Matrix */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>
              Active Field Transformation Signatures:
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {dryRunResult.detectedMappings.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ color: '#475569', fontWeight: 500 }}>{m.sourceColumn}</span>
                  <span style={{ color: '#94a3b8' }}>→</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{m.targetField}</span>
                  {m.transformation && m.transformation !== 'NONE' && (
                    <Badge variant="info" style={{ fontSize: '10px', padding: '1px 4px' }}>
                      {m.transformation}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Validation Warnings (if any) */}
          {dryRunResult.validationWarnings.length > 0 && (
            <div style={{ marginBottom: '20px', maxHeight: '140px', overflowY: 'auto' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 6px 0', color: '#b45309' }}>
                Sample Warnings (Auto-handled during ingestion):
              </h4>
              {dryRunResult.validationWarnings.slice(0, 5).map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    background: '#fffbeb',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    color: '#92400e'
                  }}
                >
                  Row {w.rowNumber}: <strong>{w.field}</strong> - {w.message} (value: {String(w.originalValue)})
                </div>
              ))}
            </div>
          )}

          {/* Sample Normalized Rows Preview */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>
              Preview of Ingested Records (First 5):
            </h3>
            <TableContainer style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(dryRunResult.previewRows[0] || {}).map((k) => (
                      <TableHead key={k} style={{ fontSize: '11px', padding: '8px' }}>
                        {k}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dryRunResult.previewRows.slice(0, 5).map((row, rIdx) => (
                    <TableRow key={rIdx}>
                      {Object.values(row).map((val, cIdx) => (
                        <TableCell key={cIdx} style={{ fontSize: '11px', padding: '6px 8px' }}>
                          {String(val ?? '-')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outline" onClick={() => setStep(2)}>
              ← Edit CSV Data
            </Button>
            <Button
              variant="primary"
              disabled={isLoading || dryRunResult.validRows === 0}
              onClick={handleExecuteMigration}
              style={{
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                padding: '10px 28px',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
              }}
            >
              {isLoading ? 'Executing Atomic Ingest...' : `Execute Atomic Ingest (${dryRunResult.validRows} Records) →`}
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: Success & Immutable Cryptographic Audit Receipt */}
      {step === 4 && executionResult && (
        <Card style={{ padding: '32px', background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>🎉</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#065f46' }}>
              Migration Completed Successfully!
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#047857' }}>
              {executionResult.summaryMessage}
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>MIGRATION REFERENCE ID</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                  {executionResult.migrationId}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>SOURCE SYSTEM</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb' }}>
                  {executionResult.sourceSystem.replace('_', ' ')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL INGESTED RECORDS</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>
                  {executionResult.recordsInserted} records
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>EXECUTION TIMESTAMP</div>
                <div style={{ fontSize: '13px', color: '#475569' }}>
                  {new Date(executionResult.executedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                SHA-256 IMMUTABLE AUDIT CERTIFICATE
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#334155',
                  wordBreak: 'break-all',
                  marginTop: '4px',
                  padding: '6px 8px',
                  background: '#ffffff',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1'
                }}
              >
                {executionResult.auditHash}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Button variant="outline" onClick={resetWizard}>
              Migrate Another File
            </Button>
            {executionResult.sourceSystem === 'PRACTO_RAY' && onNavigateToModule && (
              <Button
                variant="primary"
                style={{ background: '#2563eb', color: '#ffffff', fontWeight: 600 }}
                onClick={() => onNavigateToModule('patient-registration')}
              >
                View Migrated Patients in OPD Desk →
              </Button>
            )}
            {executionResult.sourceSystem === 'MARG_ERP' && onNavigateToModule && (
              <Button
                variant="primary"
                style={{ background: '#2563eb', color: '#ffffff', fontWeight: 600 }}
                onClick={() => onNavigateToModule('pharmacy-medication')}
              >
                View Migrated Batches in Pharmacy POS →
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Migration Audit History */}
      {history.length > 0 && (
        <div style={{ marginTop: '36px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#0f172a' }}>
            Previous Migration Audit History ({history.length})
          </h3>
          <TableContainer style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Migration ID</TableHead>
                  <TableHead>Source System</TableHead>
                  <TableHead>Processed</TableHead>
                  <TableHead>Inserted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executed At</TableHead>
                  <TableHead>SHA-256 Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.migrationId}>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>{h.migrationId}</TableCell>
                    <TableCell>{h.sourceSystem.replace('_', ' ')}</TableCell>
                    <TableCell>{h.recordsProcessed}</TableCell>
                    <TableCell style={{ color: '#16a34a', fontWeight: 700 }}>{h.recordsInserted}</TableCell>
                    <TableCell>
                      <Badge
                        variant={h.status === 'COMPLETED' ? 'success' : 'warning'}
                        style={{ fontSize: '11px' }}
                      >
                        {h.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '12px' }}>{new Date(h.executedAt).toLocaleString()}</TableCell>
                    <TableCell style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                      {h.auditHash.slice(0, 16)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </div>
  );
};
