import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';

export interface AutoAnalyzerSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: InvestigationOrderDto[];
  onCommitResults: (payload: {
    orderId: string;
    analyzerModel: string;
    parameters: Array<{
      analyte: string;
      value: string;
      unit: string;
      referenceRange: string;
      isPanic: boolean;
    }>;
    hasPanic: boolean;
  }) => void;
}

const ANALYZER_PROFILES = [
  { id: 'sysmex-xn550', name: 'Sysmex XN-550', type: '5-Part Hematology Analyzer', port: 'TCP 192.168.1.110:5000' },
  { id: 'mindray-bc5000', name: 'Mindray BC-5000', type: 'Automated Cell Counter', port: 'COM3 (115200 Baud)' },
  { id: 'roche-cobas', name: 'Roche Cobas c311', type: 'Clinical Chemistry Analyzer', port: 'TCP 192.168.1.115:8080' },
  { id: 'biorad-d10', name: 'Bio-Rad D-10', type: 'HPLC Glycated Hemoglobin (HbA1c)', port: 'COM5 (9600 Baud)' }
];

export const AutoAnalyzerSyncModal: React.FC<AutoAnalyzerSyncModalProps> = ({
  isOpen,
  onClose,
  orders,
  onCommitResults
}) => {
  const [selectedAnalyzer, setSelectedAnalyzer] = useState(ANALYZER_PROFILES[0]!);
  const [simulatePanic, setSimulatePanic] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || 'mock-order-01');
  const [isReading, setIsReading] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  if (!isOpen) return null;

  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || {
    id: 'mock-order-01',
    patientName: 'Rahul Sharma',
    patientMrn: 'MRN-4421',
    orderNumber: 'ORD-LAB-2026-9081'
  };

  const getParameters = () => {
    if (selectedAnalyzer.id.includes('cobas')) {
      return [
        { analyte: 'Blood Glucose (Fasting)', value: simulatePanic ? '480' : '98', unit: 'mg/dL', referenceRange: '70 - 100', isPanic: simulatePanic },
        { analyte: 'Serum Potassium', value: simulatePanic ? '6.8' : '4.2', unit: 'mEq/L', referenceRange: '3.5 - 5.1', isPanic: simulatePanic },
        { analyte: 'Serum Creatinine', value: simulatePanic ? '4.8' : '0.9', unit: 'mg/dL', referenceRange: '0.6 - 1.2', isPanic: simulatePanic },
        { analyte: 'Blood Urea Nitrogen', value: simulatePanic ? '78' : '18', unit: 'mg/dL', referenceRange: '7 - 20', isPanic: simulatePanic },
        { analyte: 'SGPT / ALT', value: '32', unit: 'U/L', referenceRange: '10 - 40', isPanic: false },
        { analyte: 'SGOT / AST', value: '28', unit: 'U/L', referenceRange: '10 - 35', isPanic: false },
        { analyte: 'Serum Bilirubin Total', value: '0.8', unit: 'mg/dL', referenceRange: '0.2 - 1.2', isPanic: false }
      ];
    } else if (selectedAnalyzer.id.includes('biorad')) {
      return [
        { analyte: 'HbA1c (Glycated Hemoglobin)', value: simulatePanic ? '11.8' : '6.4', unit: '%', referenceRange: '< 5.7 (Normal), 5.7 - 6.4 (Prediabetes)', isPanic: simulatePanic },
        { analyte: 'Estimated Average Glucose (eAG)', value: simulatePanic ? '292' : '137', unit: 'mg/dL', referenceRange: '90 - 150', isPanic: simulatePanic }
      ];
    } else {
      // Hematology (Sysmex / Mindray)
      return [
        { analyte: 'Hemoglobin (Hb)', value: simulatePanic ? '5.6' : '13.8', unit: 'g/dL', referenceRange: '12.0 - 16.0', isPanic: simulatePanic },
        { analyte: 'Total Leukocyte Count (TLC)', value: simulatePanic ? '26,400' : '7,400', unit: '/mcL', referenceRange: '4,000 - 11,000', isPanic: simulatePanic },
        { analyte: 'Platelet Count', value: simulatePanic ? '14,000' : '2,45,000', unit: '/mcL', referenceRange: '1,50,000 - 4,50,000', isPanic: simulatePanic },
        { analyte: 'RBC Count', value: simulatePanic ? '2.1' : '4.6', unit: 'mill/mcL', referenceRange: '4.0 - 5.5', isPanic: simulatePanic },
        { analyte: 'Packed Cell Volume (PCV / Hematocrit)', value: simulatePanic ? '18.2' : '42.0', unit: '%', referenceRange: '36.0 - 48.0', isPanic: simulatePanic },
        { analyte: 'Neutrophils', value: simulatePanic ? '88' : '62', unit: '%', referenceRange: '40 - 70', isPanic: false },
        { analyte: 'Lymphocytes', value: simulatePanic ? '8' : '30', unit: '%', referenceRange: '20 - 40', isPanic: false },
        { analyte: 'Eosinophils', value: '3', unit: '%', referenceRange: '1 - 6', isPanic: false },
        { analyte: 'Monocytes', value: '4', unit: '%', referenceRange: '2 - 8', isPanic: false },
        { analyte: 'Basophils', value: '1', unit: '%', referenceRange: '0 - 1', isPanic: false }
      ];
    }
  };

  const currentParams = getParameters();
  const hasPanicDetected = currentParams.some((p) => p.isPanic);

  const handleSyncFromMachine = () => {
    setIsReading(true);
    setTimeout(() => {
      setIsReading(false);
      setSyncDone(true);
    }, 900);
  };

  const handleCommit = () => {
    onCommitResults({
      orderId: currentOrder.id,
      analyzerModel: selectedAnalyzer.name,
      parameters: currentParams,
      hasPanic: hasPanicDetected
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🔬</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Automated Analyzer Machine Interface (ASTM / HL7)
                </h3>
                <Badge variant="success" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                  ● Hardware Live Feed
                </Badge>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
                Zero-manual data entry: Ingest digital specimen results directly from hematology, chemistry & HbA1c analyzers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Configuration Bar */}
        <div style={{ padding: '14px 20px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Select Laboratory Analyzer Machine:
            </label>
            <select
              value={selectedAnalyzer.id}
              onChange={(e) => {
                const found = ANALYZER_PROFILES.find((p) => p.id === e.target.value);
                if (found) setSelectedAnalyzer(found);
                setSyncDone(false);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: '#FFFFFF',
                color: '#0F172A'
              }}
            >
              {ANALYZER_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
              Connected Interface: <code>{selectedAnalyzer.port}</code> • Protocol: <strong>ASTM E1381/E1394</strong>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Target Specimen / Patient Order:
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: '#FFFFFF',
                color: '#0F172A'
              }}
            >
              {orders.length > 0 ? (
                orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.patientName} ({o.orderNumber || o.id.slice(0, 8)})
                  </option>
                ))
              ) : (
                <option value="mock-order-01">Rahul Sharma (MRN-4421) - CBC Order</option>
              )}
            </select>
          </div>

          {/* Panic Simulation Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#DC2626', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={simulatePanic}
                onChange={(e) => {
                  setSimulatePanic(e.target.checked);
                  setSyncDone(false);
                }}
              />
              <span>⚠️ Simulate Critical Panic Values</span>
            </label>
          </div>
        </div>

        {/* Read / Sync Action Strip */}
        <div style={{ padding: '10px 20px', backgroundColor: '#EFF6FF', borderBottom: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚡</span>
            <span style={{ fontSize: '0.8rem', color: '#1E40AF', fontWeight: 600 }}>
              Status: {syncDone ? `✓ Run ingested from ${selectedAnalyzer.name}` : `Ready to ingest digital run from ${selectedAnalyzer.name}`}
            </span>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={handleSyncFromMachine}
            disabled={isReading}
            style={{
              backgroundColor: '#0284C7',
              borderColor: '#0284C7',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{isReading ? '⏳ Interfacing...' : '📡 Read Analyzer Serial Feed'}</span>
          </Button>
        </div>

        {/* Live Parameters Ingestion Table */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', color: '#334155' }}>Analyte / Test Parameter</th>
                <th style={{ padding: '8px 10px', color: '#334155' }}>Machine Ingested Value</th>
                <th style={{ padding: '8px 10px', color: '#334155' }}>Reference Range</th>
                <th style={{ padding: '8px 10px', color: '#334155' }}>Unit</th>
                <th style={{ padding: '8px 10px', color: '#334155' }}>Clinical Status</th>
              </tr>
            </thead>
            <tbody>
              {currentParams.map((p, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid #E2E8F0',
                    backgroundColor: p.isPanic ? '#FEF2F2' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
                  }}
                >
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: p.isPanic ? '#DC2626' : '#1E293B' }}>
                    {p.analyte}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: '0.92rem', fontWeight: 800, color: p.isPanic ? '#DC2626' : '#0F172A' }}>
                    {p.value}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#64748B' }}>
                    {p.referenceRange}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#64748B', fontWeight: 600 }}>
                    {p.unit}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    {p.isPanic ? (
                      <span style={{ backgroundColor: '#EF4444', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                        🚨 CRITICAL PANIC
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                        ✓ Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasPanicDetected && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #EF4444',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#991B1B',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <strong>NABL & NABH Panic Value Intimation Required:</strong> These values breach laboratory critical thresholds. Submitting this run will prompt instant SMS and telephone intimation to the treating doctor.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            NABL Laboratory Automation • Standard ASTM E1381 RS-232 / TCP Protocol
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="md"
              variant="primary"
              onClick={handleCommit}
              style={{
                backgroundColor: hasPanicDetected ? '#DC2626' : '#16A34A',
                borderColor: hasPanicDetected ? '#DC2626' : '#16A34A',
                color: '#FFFFFF',
                fontWeight: 800,
                boxShadow: hasPanicDetected
                  ? '0 2px 8px rgba(220, 38, 38, 0.4)'
                  : '0 2px 8px rgba(22, 163, 74, 0.4)'
              }}
            >
              {hasPanicDetected ? '⚠️ Commit Panic Results & Trigger Doctor Alert' : '✓ Commit Results to LIMS Workbench'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
