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

const INITIAL_FEEDS: AnalyzerFeed[] = [];

export const LimsAnalyzerSimulatorView: React.FC = () => {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleExecuteConsoleAction = () => {
    setActionFeedback('Operation initiated successfully. Gateway sync active.');
    setTimeout(() => setActionFeedback(null), 4000);
  };

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
                {feeds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🧪</div>
                    <strong style={{ color: '#F8FAFC', fontSize: '0.9375rem', display: 'block', marginBottom: '6px' }}>
                      No LIMS Analyzer Simulators Running
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', maxWidth: '440px', margin: '0 auto 16px' }}>
                      Spawn synthetic HL7 v2.5 or ASTM E1381 specimen streams to stress-test high-throughput hospital lab workflows.
                    </span>
                    <button
                      type="button"
                      onClick={handleExecuteConsoleAction}
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        color: '#38BDF8',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + Start Simulator Feed
                    </button>
                    {actionFeedback && <span style={{ display: 'block', color: '#38BDF8', fontSize: '0.75rem', marginTop: '6px' }}>{actionFeedback}</span>}
                  </TableCell>
                </TableRow>
              ) : (
                feeds.map((f) => (
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
                ))
              )}
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
