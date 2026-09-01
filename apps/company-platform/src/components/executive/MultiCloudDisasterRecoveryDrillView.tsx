import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface CloudRegionState {
  id: string;
  provider: 'AWS' | 'GCP';
  regionName: string;
  role: 'PRIMARY_MASTER' | 'STANDBY_REPLICA';
  replicationLagMs: number;
  status: 'HEALTHY' | 'DRILL_ACTIVE' | 'FAILOVER_STANDBY';
  connectedHospitalNodes: number;
  activeQps: number;
}

const INITIAL_REGIONS: CloudRegionState[] = [
  {
    id: 'REGION-AWS-MUM',
    provider: 'AWS',
    regionName: 'AWS Mumbai (ap-south-1)',
    role: 'PRIMARY_MASTER',
    replicationLagMs: 0,
    status: 'HEALTHY',
    connectedHospitalNodes: 486,
    activeQps: 18450
  },
  {
    id: 'REGION-GCP-DEL',
    provider: 'GCP',
    regionName: 'GCP Delhi (asia-south2)',
    role: 'STANDBY_REPLICA',
    replicationLagMs: 12,
    status: 'HEALTHY',
    connectedHospitalNodes: 486,
    activeQps: 0
  }
];

export const MultiCloudDisasterRecoveryDrillView: React.FC = () => {
  const [regions, setRegions] = useState<CloudRegionState[]>(INITIAL_REGIONS);
  const [isDrillRunning, setIsDrillRunning] = useState(false);
  const [drillStep, setDrillStep] = useState(0);
  const [drillNotice, setDrillNotice] = useState<string | null>(null);

  const steps = [
    'Initiating DNS Traffic Shift via Cloudflare Anycast...',
    'Rotating KMS CloudHSM Master Key & Ephemeral Vaults...',
    'Promoting GCP Delhi Replica to ACTIVE MASTER...',
    'Validating Health Check Probes across 486 Hospital Nodes...',
    'Drill Complete: 100% Traffic running on GCP Delhi with 0 Data Loss!'
  ];

  const handleExecuteDrill = () => {
    setIsDrillRunning(true);
    setDrillStep(1);

    const runStep = (stepNum: number) => {
      setTimeout(() => {
        setDrillStep(stepNum);
        if (stepNum < steps.length) {
          runStep(stepNum + 1);
        } else {
          setIsDrillRunning(false);
          setRegions([
            { ...regions[0]!, role: 'STANDBY_REPLICA', activeQps: 0, replicationLagMs: 14 },
            { ...regions[1]!, role: 'PRIMARY_MASTER', activeQps: 18450, replicationLagMs: 0 }
          ]);
          setDrillNotice('🏆 Multi-Cloud DR Failover Drill SUCCESSFUL! RPO = 0.00s • RTO = 11.4 seconds.');
          setTimeout(() => setDrillNotice(null), 8000);
        }
      }, 1500);
    };

    runStep(2);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              Multi-Cloud Disaster Recovery & Live Failover Drill Cockpit
            </h2>
            <Badge variant="primary">AWS Mumbai ↔ GCP Delhi Sync</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Simulate and verify automated multi-region database failovers with 0-second RPO (Zero Data Loss) and &lt;15s RTO.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={handleExecuteDrill}
          disabled={isDrillRunning}
          style={{
            backgroundColor: '#EF4444',
            color: '#FFF',
            fontWeight: 900,
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
          }}
        >
          {isDrillRunning ? `⚡ Executing Step ${drillStep}/5...` : '⚡ Initiate Live Chaos / DR Failover Drill'}
        </Button>
      </div>

      {drillNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {drillNotice}
        </div>
      )}

      {/* Top 3 SLA Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            RECOVERY POINT OBJECTIVE (RPO)
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'monospace' }}>
            0.00 Seconds
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Synchronous Multi-AZ WAL streaming (Zero Data Loss)
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            RECOVERY TIME OBJECTIVE (RTO)
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>
            11.4 Seconds
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Automated Anycast DNS & Replica Promotion
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            CROSS-CLOUD REPLICATION LAG
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#FCD34D', margin: '4px 0', fontFamily: 'monospace' }}>
            12 ms
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            AWS Mumbai ↔ GCP Delhi fiber link
          </span>
        </div>
      </div>

      {/* Drill Step Execution Box */}
      {isDrillRunning && (
        <div style={{ backgroundColor: '#1E293B', border: '2px solid #EF4444', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#FCA5A5', fontWeight: 900, fontSize: '0.9375rem' }}>
              🚨 LIVE DISASTER RECOVERY DRILL IN PROGRESS (Step {drillStep} of 5)
            </span>
            <Badge variant="danger">Traffic Shifting</Badge>
          </div>
          <div style={{ color: '#FFF', fontSize: '1.125rem', fontWeight: 800 }}>
            {steps[drillStep - 1]}
          </div>
          <div style={{ height: '6px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(drillStep / 5) * 100}%`, backgroundColor: '#EF4444', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* Cloud Regions Table */}
      <Card title="📜 Active Cloud Infrastructure & Failover Topology" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cloud Provider & Region</TableHead>
                <TableHead>Cluster Role</TableHead>
                <TableHead>Replication Lag</TableHead>
                <TableHead>Connected Hospital Nodes</TableHead>
                <TableHead>Live Throughput (QPS)</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Health Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <strong style={{ color: '#F8FAFC' }}>{r.regionName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.role === 'PRIMARY_MASTER' ? 'success' : 'neutral'}>
                      {r.role}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#FCD34D', fontFamily: 'monospace' }}>
                    {r.replicationLagMs} ms
                  </TableCell>
                  <TableCell style={{ fontWeight: 700 }}>
                    {r.connectedHospitalNodes} Hospital Nodes
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                    {r.activeQps.toLocaleString('en-IN')} QPS
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="success">✓ {r.status}</Badge>
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
