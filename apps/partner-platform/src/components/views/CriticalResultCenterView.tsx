import React from 'react';
import {
  Card,
  Button,
  Badge,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';

export interface CriticalResultCenterViewProps {
  orders: InvestigationOrderDto[];
  onReviewOrder: (order: InvestigationOrderDto) => void;
  onSelectOrder: (orderId: string) => void;
}

export const CriticalResultCenterView: React.FC<CriticalResultCenterViewProps> = ({
  orders,
  onReviewOrder,
  onSelectOrder
}) => {
  const criticalOrders = orders.filter((o) => o.isCritical);
  const abnormalOrders = orders.filter((o) => o.isAbnormal && !o.isCritical);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
          🚨 Critical Diagnostic Results & Panic Value Monitor
        </h3>
        <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
          Life-safety urgent alerting board for critical laboratory panic values and severe pathological abnormalities.
        </p>
      </div>

      <Alert type="error" title="CLINICAL SAFETY DIRECTIVE — CRITICAL PANIC VALUES">
        Critical laboratory values represent potentially life-threatening physiological states. Laboratory staff must immediately give verbal telephonic notification to the attending clinician, and clinicians must document immediate intervention or emergency admission below.
      </Alert>

      {/* Critical Panic Value Queue */}
      <Card title={`🚨 Critical Panic Value Alerts (${criticalOrders.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Investigation / Test</TableHead>
                <TableHead>Critical Analyte Findings</TableHead>
                <TableHead>Doctor / Location</TableHead>
                <TableHead>Review Status</TableHead>
                <TableHead>Emergency Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {criticalOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ds-color-text-muted)' }}>
                    ✓ No active critical panic value alerts in system.
                  </TableCell>
                </TableRow>
              ) : (
                criticalOrders.map((ord) => {
                  const criticalResults = ord.results.filter((r) => r.isCritical);
                  return (
                    <TableRow key={ord.id} style={{ backgroundColor: '#fff5f5' }}>
                      <TableCell style={{ fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>
                        {ord.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 700, color: '#991b1b' }}>{ord.patientName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                          MRN: {ord.patientMrn} · Enc: {ord.encounterNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600 }}>{ord.investigationName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                          {ord.investigationCategory}
                        </div>
                      </TableCell>
                      <TableCell>
                        {criticalResults.map((r) => (
                          <div key={r.id} style={{ marginBottom: '4px' }}>
                            <strong style={{ color: '#dc2626' }}>{r.parameterName}:</strong>{' '}
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9375rem' }}>
                              {r.resultValue} {r.unit ?? ''}
                            </span>{' '}
                            <Badge variant="danger">🚨 {r.abnormalFlag}</Badge>
                            {r.qualitativeInterpretation && (
                              <div style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>
                                {r.qualitativeInterpretation}
                              </div>
                            )}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600 }}>{ord.orderingDoctorName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                          {ord.branchName || 'Apex Downtown Care Center'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ord.status === 'REVIEWED' ? (
                          <Badge variant="success">Action Documented</Badge>
                        ) : (
                          <Badge variant="danger">⚠️ Action Required</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button size="sm" variant="danger" onClick={() => onReviewOrder(ord)}>
                            🚨 Review Critical
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onSelectOrder(ord.id)}>
                            Inspect
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Non-Critical Abnormal Results */}
      <Card title={`⚠️ Non-Critical Abnormal Investigations (${abnormalOrders.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Investigation / Test</TableHead>
                <TableHead>Abnormal Parameters</TableHead>
                <TableHead>Ordering Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abnormalOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--ds-color-text-muted)' }}>
                    No abnormal investigation orders.
                  </TableCell>
                </TableRow>
              ) : (
                abnormalOrders.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ord.orderNumber}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{ord.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                        MRN: {ord.patientMrn}
                      </div>
                    </TableCell>
                    <TableCell>{ord.investigationName}</TableCell>
                    <TableCell>
                      <div style={{ fontSize: '0.8125rem' }}>
                        {ord.results
                          .filter((r) => r.abnormalFlag !== 'NORMAL')
                          .map((r) => `${r.parameterName}: ${r.resultValue} [${r.abnormalFlag}]`)
                          .join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>{ord.orderingDoctorName}</TableCell>
                    <TableCell>
                      <Badge variant="warning">{ord.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => onSelectOrder(ord.id)}>
                        View Record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
