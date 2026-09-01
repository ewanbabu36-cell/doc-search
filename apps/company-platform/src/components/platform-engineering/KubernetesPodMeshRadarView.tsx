import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface MicroservicePodNode {
  serviceName: string;
  namespace: string;
  replicasRunning: string;
  cpuUsagePct: number;
  memoryUsage: string;
  restartsCount: number;
  uptime: string;
  status: 'RUNNING_HEALTHY' | 'SCALING' | 'DEGRADED';
}

const INITIAL_SERVICES: MicroservicePodNode[] = [
  {
    serviceName: 'api-gateway-service',
    namespace: 'docsearch-prod',
    replicasRunning: '6/6',
    cpuUsagePct: 28,
    memoryUsage: '340 MB / 1 GB',
    restartsCount: 0,
    uptime: '18d 6h',
    status: 'RUNNING_HEALTHY'
  },
  {
    serviceName: 'company-platform-spa',
    namespace: 'docsearch-prod',
    replicasRunning: '4/4',
    cpuUsagePct: 18,
    memoryUsage: '180 MB / 512 MB',
    restartsCount: 0,
    uptime: '18d 6h',
    status: 'RUNNING_HEALTHY'
  },
  {
    serviceName: 'partner-platform-spa',
    namespace: 'docsearch-prod',
    replicasRunning: '4/4',
    cpuUsagePct: 22,
    memoryUsage: '195 MB / 512 MB',
    restartsCount: 0,
    uptime: '18d 6h',
    status: 'RUNNING_HEALTHY'
  },
  {
    serviceName: 'fhir-abdm-gateway-daemon',
    namespace: 'docsearch-prod',
    replicasRunning: '8/8',
    cpuUsagePct: 42,
    memoryUsage: '780 MB / 2 GB',
    restartsCount: 0,
    uptime: '12d 3h',
    status: 'RUNNING_HEALTHY'
  },
  {
    serviceName: 'lims-mllp-socket-engine',
    namespace: 'docsearch-prod',
    replicasRunning: '4/4',
    cpuUsagePct: 31,
    memoryUsage: '420 MB / 1 GB',
    restartsCount: 0,
    uptime: '24d 1h',
    status: 'RUNNING_HEALTHY'
  },
  {
    serviceName: 'ai-clinical-inference-worker',
    namespace: 'docsearch-prod',
    replicasRunning: '12/12',
    cpuUsagePct: 68,
    memoryUsage: '3.4 GB / 8 GB',
    restartsCount: 0,
    uptime: '8d 14h',
    status: 'RUNNING_HEALTHY'
  }
];

export const KubernetesPodMeshRadarView: React.FC = () => {
  const [services, setServices] = useState<MicroservicePodNode[]>(INITIAL_SERVICES);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleRollingRestart = (svcName: string) => {
    setActionSuccess(`⚡ Rolling restart initiated for "${svcName}" with zero downtime!`);
    setServices((prev) =>
      prev.map((s) =>
        s.serviceName === svcName
          ? { ...s, uptime: 'Just now', restartsCount: s.restartsCount + 1 }
          : s
      )
    );
    setTimeout(() => setActionSuccess(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            ☸️ Kubernetes Microservices Mesh & Pod Health Radar
          </h2>
          <Badge variant="success">● 38/38 Pods Healthy (AWS EKS Cluster: docsearch-prod-ap-south-1)</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Real-time resource telemetry, Horizontal Pod Autoscaling (HPA), and live container restarts across the cluster
        </p>
      </div>

      {actionSuccess && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {actionSuccess}
        </div>
      )}

      {/* Cluster Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>RUNNING REPLICAS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>38 / 38 Pods</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>100% Target Availability</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>CLUSTER CPU LOAD</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>34.2% Avg</div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>Autoscale threshold: 75%</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL POD RESTARTS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>0 CrashLoops</div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px', display: 'block' }}>Zero OOM Kills in 30 days</span>
        </div>
      </div>

      {/* Services Table */}
      <Card title="☸️ Microservices Pod Fleet Table" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Microservice Name</TableHead>
                <TableHead>K8s Namespace</TableHead>
                <TableHead>Pod Replicas</TableHead>
                <TableHead>CPU Utilization</TableHead>
                <TableHead>Memory Saturation</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.serviceName}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.serviceName}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94A3B8' }}>
                    {s.namespace}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">● {s.replicasRunning}</Badge>
                  </TableCell>
                  <TableCell>
                    <span style={{ color: s.cpuUsagePct > 60 ? '#F59E0B' : '#10B981', fontWeight: 700 }}>
                      {s.cpuUsagePct}%
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                    {s.memoryUsage}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {s.uptime}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleRollingRestart(s.serviceName)}
                      style={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#38BDF8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🔄 Rolling Restart
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
