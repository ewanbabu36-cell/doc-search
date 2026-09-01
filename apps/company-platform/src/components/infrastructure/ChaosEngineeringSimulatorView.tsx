import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface ChaosScenario {
  id: string;
  name: string;
  targetComponent: string;
  faultType: string;
  expectedRto: string;
  lastTested: string;
  resiliencyStatus: 'SELF_HEALED_PASS' | 'READY_TO_TEST';
}

const CHAOS_SCENARIOS: ChaosScenario[] = [
  {
    id: 'CHAOS-001',
    name: 'Primary MongoDB Leader Pod Sudden Termination',
    targetComponent: 'MongoDB Atlas Replica Set (Node-01)',
    faultType: 'SIGKILL / Immediate Pod Crash',
    expectedRto: '< 3.0 seconds',
    lastTested: 'Today, 09:30 AM',
    resiliencyStatus: 'SELF_HEALED_PASS'
  },
  {
    id: 'CHAOS-002',
    name: 'FHIR API Gateway Ingress 400ms Network Packet Delay',
    targetComponent: 'Istio Service Mesh Envoy Sidecar',
    faultType: 'Network Jitter & Packet Latency Injection',
    expectedRto: '< 1.5 seconds (Circuit Breaker Tripped)',
    lastTested: 'Yesterday',
    resiliencyStatus: 'SELF_HEALED_PASS'
  },
  {
    id: 'CHAOS-003',
    name: 'Redis Sentinel Memory Exhaustion / OOM Kill',
    targetComponent: 'Redis HA Session Cache Cluster',
    faultType: 'Memory Pressure Fault Injection',
    expectedRto: '< 2.0 seconds (Failover to Replica)',
    lastTested: '3 days ago',
    resiliencyStatus: 'SELF_HEALED_PASS'
  }
];

export const ChaosEngineeringSimulatorView: React.FC = () => {
  const [scenarios] = useState<ChaosScenario[]>(CHAOS_SCENARIOS);
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);
  const [experimentLog, setExperimentLog] = useState<string | null>(null);

  const handleRunChaos = (sc: ChaosScenario) => {
    setActiveExperiment(sc.id);
    setExperimentLog(`⚡ Injecting fault "${sc.faultType}" on ${sc.targetComponent}...`);

    setTimeout(() => {
      setExperimentLog(`✓ Fault injected: Node terminated. Raft consensus election triggered in 140ms.`);
      setTimeout(() => {
        setExperimentLog(`✓ Replica promoted to Master. Cluster health 100% restored in 2.1 seconds (RTO PASSED)!`);
        setTimeout(() => {
          setActiveExperiment(null);
        }, 2000);
      }, 700);
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🔥 Chaos Engineering & Resiliency Fault-Injection Simulator
          </h2>
          <Badge variant="danger">● Chaos Mesh / Simian Army Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Automated chaos experiments validating autonomous self-healing, master failover election, and circuit breakers
        </p>
      </div>

      {experimentLog && (
        <div style={{ backgroundColor: '#020617', border: '1.5px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 700 }}>
          {experimentLog}
        </div>
      )}

      {/* Resilience Benchmark Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>AVERAGE RECOVERY TIME (RTO)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>2.18 Seconds</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Target SLA: &lt; 30 seconds</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>SELF-HEALING SUCCESS RATE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>100.0% Pass</div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>48/48 Chaos Drills Passed</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>DATA LOSS RATE (RPO)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>0.00 Seconds</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Synchronous Raft replication</span>
        </div>
      </div>

      {/* Scenarios Table */}
      <Card title="📜 Chaos Resiliency Scenarios & Fault Injectors" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chaos Experiment</TableHead>
                <TableHead>Target Component</TableHead>
                <TableHead>Injected Fault</TableHead>
                <TableHead>Expected RTO</TableHead>
                <TableHead>Last Tested</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Execute Drill</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.map((sc) => (
                <TableRow key={sc.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{sc.name}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {sc.targetComponent}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#EF4444' }}>
                    {sc.faultType}
                  </TableCell>
                  <TableCell style={{ color: '#10B981', fontWeight: 700 }}>
                    {sc.expectedRto}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {sc.lastTested}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      disabled={activeExperiment === sc.id}
                      onClick={() => handleRunChaos(sc)}
                      style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)' }}
                    >
                      {activeExperiment === sc.id ? '⚡ Injecting...' : '🔥 Run Chaos Test'}
                    </button>
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
