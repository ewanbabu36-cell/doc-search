import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface AnalyzerDevice {
  id: string;
  analyzerName: string;
  manufacturer: string;
  protocol: 'HL7_V2_5' | 'ASTM_E1381';
  hospitalLabLocation: string;
  testsProcessedToday: number;
  connectionStatus: 'ONLINE_STREAMING' | 'MAINTENANCE';
  panicAlertsTriggered: number;
  lastPacketTimestamp: string;
}

const INITIAL_ANALYZERS: AnalyzerDevice[] = [
  {
    id: 'DEV-ROCHE-01',
    analyzerName: 'Roche Cobas 8000 Modular',
    manufacturer: 'Roche Diagnostics',
    protocol: 'HL7_V2_5',
    hospitalLabLocation: 'AIIMS Delhi Central Pathology',
    testsProcessedToday: 3840,
    connectionStatus: 'ONLINE_STREAMING',
    panicAlertsTriggered: 14,
    lastPacketTimestamp: '3 seconds ago'
  },
  {
    id: 'DEV-BECK-02',
    analyzerName: 'Beckman Coulter AU5800',
    manufacturer: 'Beckman Coulter',
    protocol: 'ASTM_E1381',
    hospitalLabLocation: 'Apollo Main Lab Chennai',
    testsProcessedToday: 4120,
    connectionStatus: 'ONLINE_STREAMING',
    panicAlertsTriggered: 9,
    lastPacketTimestamp: '1 second ago'
  },
  {
    id: 'DEV-MIND-03',
    analyzerName: 'Mindray BC-6800 Plus',
    manufacturer: 'Mindray Medical',
    protocol: 'HL7_V2_5',
    hospitalLabLocation: 'Max Hospital Saket Lab',
    testsProcessedToday: 2190,
    connectionStatus: 'ONLINE_STREAMING',
    panicAlertsTriggered: 6,
    lastPacketTimestamp: '5 seconds ago'
  }
];

export const LimsHl7AstmIotDeviceHubView: React.FC = () => {
  const [analyzers] = useState<AnalyzerDevice[]>(INITIAL_ANALYZERS);
  const [panicNotice, setPanicNotice] = useState<string | null>(null);

  const handleSimulatePanicValue = () => {
    setPanicNotice('🚨 CRITICAL VALUE DETECTED: Sample #SAM-8891 (AIIMS Lab) reported Troponin-I = 1.84 ng/mL (>0.04 normal)! Automated WhatsApp Siren & Doctor ER pre-arrival alert triggered.');
    setTimeout(() => setPanicNotice(null), 8000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🧪</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              Automated LIMS Pathology Analyzer HL7 / ASTM IoT Device Hub
            </h2>
            <Badge variant="success">● Bi-Directional IoT Stream Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Direct real-time hardware telemetry from Roche Cobas, Beckman Coulter, and Mindray auto-analyzers with automated panic value sirens.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={handleSimulatePanicValue}
          style={{
            backgroundColor: '#EF4444',
            color: '#FFF',
            fontWeight: 900,
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
          }}
        >
          🚨 Simulate Panic Value Trigger (Troponin / Platelets)
        </Button>
      </div>

      {panicNotice && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '2px solid #EF4444', borderRadius: '12px', padding: '14px 18px', color: '#FCA5A5', fontSize: '0.875rem', fontWeight: 800 }}>
          {panicNotice}
        </div>
      )}

      {/* Top 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            TOTAL SAMPLES INGESTED TODAY
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'monospace' }}>
            10,150 Samples
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Zero manual data-entry error
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            AVERAGE REPORT TURNAROUND (TAT)
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>
            18.4 Minutes
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Automated doctor digital sign-off
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            CRITICAL PANIC SIRENS SENT
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#EF4444', margin: '4px 0', fontFamily: 'monospace' }}>
            29 Alerts Today
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Direct WhatsApp & SMS to Cardiologists
          </span>
        </div>
      </div>

      {/* Connected Analyzers Table */}
      <Card title="📜 Connected Hardware Analyzers & Telemetry Stream" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analyzer Model & Manufacturer</TableHead>
                <TableHead>Protocol Type</TableHead>
                <TableHead>Hospital Lab Location</TableHead>
                <TableHead>Processed Today</TableHead>
                <TableHead>Panic Sirens</TableHead>
                <TableHead style={{ textAlign: 'right' }}>IoT Connection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyzers.map((dev) => (
                <TableRow key={dev.id}>
                  <TableCell>
                    <div>
                      <strong style={{ color: '#F8FAFC' }}>{dev.analyzerName}</strong>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>{dev.manufacturer}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="primary">{dev.protocol.replace(/_/g, ' ')}</Badge>
                  </TableCell>

                  <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                    {dev.hospitalLabLocation}
                  </TableCell>

                  <TableCell style={{ fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>
                    {dev.testsProcessedToday.toLocaleString('en-IN')} tests
                  </TableCell>

                  <TableCell style={{ fontWeight: 800, color: '#EF4444' }}>
                    {dev.panicAlertsTriggered} Sirens
                  </TableCell>

                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="success">● {dev.connectionStatus.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
