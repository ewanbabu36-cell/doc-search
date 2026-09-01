import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface AnalyzerFeed {
  id: string;
  timestamp: string;
  analyzerModel: string;
  sampleBarcode: string;
  patientName: string;
  testPanel: string;
  rawHl7Segment: string;
  accessionStatus: 'AUTO_ACCESSIONED' | 'PROCESSING' | 'FLAGGED_ANOMALY';
}

const INITIAL_FEEDS: AnalyzerFeed[] = [
  {
    id: 'LIMS-PKT-401',
    timestamp: 'Just now',
    analyzerModel: 'Mindray BC-5150 (5-Part Hematology)',
    sampleBarcode: 'LAB-BAR-89214',
    patientName: 'Rahul Sharma (42M)',
    testPanel: 'Complete Blood Count (CBC + Platelets)',
    rawHl7Segment: 'OBR|1|LAB89214|CBC^Mindray|202608311142\nOBX|1|NM|WBC^White Blood Count||7.8|10^3/uL|4.0-11.0|N\nOBX|2|NM|PLT^Platelets||245|10^3/uL|150-450|N',
    accessionStatus: 'AUTO_ACCESSIONED'
  },
  {
    id: 'LIMS-PKT-402',
    timestamp: '4 sec ago',
    analyzerModel: 'Roche Cobas 6000 (Clinical Chemistry)',
    sampleBarcode: 'LAB-BAR-89215',
    patientName: 'Pooja Verma (36F)',
    testPanel: 'Lipid Profile & Liver Function (LFT)',
    rawHl7Segment: 'OBR|2|LAB89215|LIPID^Roche|202608311141\nOBX|1|NM|CHOL^Total Cholesterol||192|mg/dL|<200|N\nOBX|2|NM|SGPT^Alanine Transaminase||32|U/L|7-56|N',
    accessionStatus: 'AUTO_ACCESSIONED'
  },
  {
    id: 'LIMS-PKT-403',
    timestamp: '9 sec ago',
    analyzerModel: 'Sysmex XN-1000 (Automated Hematology)',
    sampleBarcode: 'LAB-BAR-89216',
    patientName: 'Amit Saxena (58M)',
    testPanel: 'HbA1c & Fasting Plasma Glucose',
    rawHl7Segment: 'OBR|3|LAB89216|DIAB^Sysmex|202608311140\nOBX|1|NM|HBA1C^Glycated Hemoglobin||7.4|%|<5.7|H\nOBX|2|NM|GLU^Fasting Blood Sugar||148|mg/dL|70-100|H',
    accessionStatus: 'AUTO_ACCESSIONED'
  }
];

export const LimsAnalyzerSimulatorView: React.FC = () => {
  const [feeds] = useState<AnalyzerFeed[]>(INITIAL_FEEDS);
  const [selectedFeed, setSelectedFeed] = useState<AnalyzerFeed | null>(feeds[0] || null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🧪 Pathology Automated LIMS Analyzer Real-Time Streamer
          </h2>
          <Badge variant="success">● RS232 / TCP Socket Active (Port 2575 MLLP)</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Direct bidirectional MLLP/HL7 socket integration with Beckman Coulter, Roche Cobas, Mindray, and Sysmex automated laboratory analyzers
        </p>
      </div>

      {/* Analyzer Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ONLINE ANALYZER NODES</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>64 Lab Analyzers</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Zero data loss across 18 labs</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>AUTO-ACCESSION SPEED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>340 ms / Sample</div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>From analyzer probe to EMR</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>DAILY PROCESSED SAMPLES</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>14,820 Tests</div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px', display: 'block' }}>100% Zero-Typing automated</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
        {/* Stream Table */}
        <Card title="📡 Real-Time MLLP Socket Packet Feed" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Analyzer Model</TableHead>
                  <TableHead>Sample Barcode</TableHead>
                  <TableHead>Test Panel</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeds.map((f) => (
                  <TableRow
                    key={f.id}
                    onClick={() => setSelectedFeed(f)}
                    style={{ cursor: 'pointer', backgroundColor: selectedFeed?.id === f.id ? 'rgba(6, 182, 212, 0.1)' : 'transparent' }}
                  >
                    <TableCell>
                      <div>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{f.analyzerModel}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{f.timestamp}</span>
                      </div>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'monospace', color: '#38BDF8', fontWeight: 700 }}>
                      {f.sampleBarcode}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {f.testPanel}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">● AUTO-ACCESSIONED</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Packet Inspector */}
        <Card title="🔬 Raw HL7 OBR / OBX Packet Inspector" padding="lg">
          {selectedFeed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Sample Target Patient:</span>
                <strong style={{ color: '#F8FAFC' }}>{selectedFeed.patientName}</strong>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                  Raw HL7 v2.5.1 MSH/OBR/OBX Data Stream:
                </span>
                <pre style={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '12px', color: '#A5F3FC', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.45', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedFeed.rawHl7Segment}
                </pre>
              </div>

              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: '#A7F3D0' }}>
                ✓ <strong>AUTOMATION PIPELINE:</strong> Analyzers automatically populate patient's Electronic Medical Record (EMR) without requiring lab technicians to manually retype numbers.
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94A3B8' }}>
              Select a packet from the feed to inspect raw HL7 segments.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
