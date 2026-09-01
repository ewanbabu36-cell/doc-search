import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface ModelTelemetry {
  modelName: string;
  provider: string;
  latencyMs: number;
  costPer1kTokens: string;
  uptimePct: number;
  status: 'ACTIVE_PRIMARY' | 'HOT_STANDBY' | 'DEGRADED';
  priorityOrder: number;
}

const MODELS_TELEMETRY: ModelTelemetry[] = [
  {
    modelName: 'Google Med-PaLM 2 Clinical',
    provider: 'Google Cloud Vertex AI',
    latencyMs: 142,
    costPer1kTokens: '₹0.12',
    uptimePct: 99.98,
    status: 'ACTIVE_PRIMARY',
    priorityOrder: 1
  },
  {
    modelName: 'Anthropic Claude 3.5 Sonnet Medical',
    provider: 'AWS Bedrock Healthcare',
    latencyMs: 168,
    costPer1kTokens: '₹0.24',
    uptimePct: 99.95,
    status: 'HOT_STANDBY',
    priorityOrder: 2
  },
  {
    modelName: 'OpenAI GPT-4o-Healthcare (Zero Retention)',
    provider: 'Azure OpenAI Confidential',
    latencyMs: 195,
    costPer1kTokens: '₹0.38',
    uptimePct: 99.91,
    status: 'HOT_STANDBY',
    priorityOrder: 3
  },
  {
    modelName: 'BioBERT Local On-Premise GPU Node',
    provider: 'On-Premise NVIDIA H100 Cluster',
    latencyMs: 48,
    costPer1kTokens: '₹0.00 (CapEx)',
    uptimePct: 100.0,
    status: 'HOT_STANDBY',
    priorityOrder: 4
  }
];

export const AiModelRouterLatencyView: React.FC = () => {
  const [models] = useState<ModelTelemetry[]>(MODELS_TELEMETRY);
  const [maxLatencyThreshold] = useState(400);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            ⚡ Multi-LLM Dynamic Failover & Cost-Performance Router
          </h2>
          <Badge variant="success">Auto-Failover Active (&lt;10ms Switch)</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Intelligent latency-based query routing across Google Vertex AI, AWS Bedrock, and On-Premise NVIDIA GPU Nodes with zero downtime
        </p>
      </div>

      {/* Real-time Failover Policy Banner */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8' }}>
              🛡️ ACTIVE ROUTING DIRECTIVE:
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#CBD5E1', marginLeft: '6px' }}>
              Route 100% of clinical prompts to <strong>Google Med-PaLM 2</strong>. If latency exceeds <strong>{maxLatencyThreshold}ms</strong>, failover to <strong>Claude 3.5 Sonnet</strong>.
            </span>
          </div>

          <Badge variant="primary">Latency Circuit Breaker: ARMED</Badge>
        </div>
      </Card>

      {/* Model Fleet Table */}
      <Card title="🤖 LLM Model Fleet Latency & Telemetry Benchmarks" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>AI Model Name</TableHead>
                <TableHead>Cloud Infrastructure Provider</TableHead>
                <TableHead>Inference Latency</TableHead>
                <TableHead>Token Cost</TableHead>
                <TableHead>SLA Uptime</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Routing Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((m) => (
                <TableRow key={m.modelName}>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: '700', color: '#06B6D4' }}>
                    #{m.priorityOrder}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{m.modelName}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {m.provider}
                  </TableCell>
                  <TableCell>
                    <span style={{ color: m.latencyMs < 100 ? '#10B981' : m.latencyMs < 250 ? '#38BDF8' : '#EF4444', fontWeight: 800 }}>
                      {m.latencyMs} ms
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                    {m.costPer1kTokens}
                  </TableCell>
                  <TableCell style={{ color: '#10B981', fontWeight: 700 }}>
                    {m.uptimePct}%
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant={m.status === 'ACTIVE_PRIMARY' ? 'success' : 'neutral'}>
                      ● {m.status.replace(/_/g, ' ')}
                    </Badge>
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
