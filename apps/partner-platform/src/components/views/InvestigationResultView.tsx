import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';

export interface InvestigationResultViewProps {
  orders: InvestigationOrderDto[];
  onVerifyResults: (order: InvestigationOrderDto) => void;
  onAmendResult: (order: InvestigationOrderDto) => void;
  onEnterResults: (order: InvestigationOrderDto) => void;
  onOpenPrint?: (order: InvestigationOrderDto) => void;
}

export const InvestigationResultView: React.FC<InvestigationResultViewProps> = ({
  orders,
  onVerifyResults,
  onAmendResult,
  onEnterResults,
  onOpenPrint
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const ordersWithResults = orders.filter((o) => o.results.length > 0 || o.status === 'RESULT_READY' || o.status === 'PROCESSING');

  const filtered = ordersWithResults.filter((ord) => {
    if (filterType === 'CRITICAL' && !ord.isCritical) return false;
    if (filterType === 'ABNORMAL' && !ord.isAbnormal) return false;
    if (filterType === 'AWAITING_VERIFICATION' && (ord.status !== 'RESULT_READY' || ord.verifiedAt)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.patientName.toLowerCase().includes(q) ||
        ord.patientMrn.toLowerCase().includes(q) ||
        ord.investigationName.toLowerCase().includes(q) ||
        ord.results.some((r) => r.parameterName.toLowerCase().includes(q) || r.resultValue.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
            📊 Diagnostic Results Entry & Pathologist Verification Center
          </h3>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Structured assay parameter inspection, automated critical value flagging, verification signatures, and audited amendments.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter results by patient, test, parameter, or value..."
        />
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          options={[
            { label: 'All Investigation Results', value: 'ALL' },
            { label: '🚨 Critical Value Alerts Only', value: 'CRITICAL' },
            { label: '⚠️ Abnormal Findings Only', value: 'ABNORMAL' },
            { label: '⏳ Awaiting Pathologist Verification', value: 'AWAITING_VERIFICATION' }
          ]}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.length === 0 ? (
          <Card padding="lg">
            <div style={{ textAlign: 'center', color: 'var(--ds-color-text-muted, #64748b)', padding: '24px' }}>
              No diagnostic result records match the filter criteria.
            </div>
          </Card>
        ) : (
          filtered.map((ord) => (
            <Card
              key={ord.id}
              padding="none"
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{ord.orderNumber}</span>
                    <span>—</span>
                    <span style={{ fontWeight: 700 }}>{ord.investigationName}</span>
                    <Badge variant="neutral">{ord.investigationCategory}</Badge>
                    {ord.isCritical && <Badge variant="danger">🚨 CRITICAL</Badge>}
                    {ord.isAbnormal && !ord.isCritical && <Badge variant="warning">⚠️ ABNORMAL</Badge>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {onOpenPrint && (ord.results.length > 0 || ord.status === 'VERIFIED' || ord.status === 'REVIEWED') && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onOpenPrint(ord)}
                        style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}
                      >
                        🖨️ Direct Print Result
                      </Button>
                    )}
                    {ord.status === 'PROCESSING' && (
                      <Button size="sm" variant="primary" onClick={() => onEnterResults(ord)}>
                        📊 Enter Results
                      </Button>
                    )}
                    {ord.status === 'RESULT_READY' && (
                      <Button size="sm" variant="primary" onClick={() => onVerifyResults(ord)}>
                        ✅ Verify & Sign
                      </Button>
                    )}
                    {(ord.status === 'VERIFIED' || ord.status === 'REVIEWED') && (
                      <Button size="sm" variant="outline" onClick={() => onAmendResult(ord)}>
                        📝 Amend Result
                      </Button>
                    )}
                  </div>
                </div>
              }
            >
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--ds-color-bg-subtle, #f8fafc)', borderBottom: '1px solid var(--ds-color-border-subtle, #e2e8f0)', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <div>
                  <strong>Patient:</strong> {ord.patientName} (MRN: {ord.patientMrn}) · <strong>Doctor:</strong> {ord.orderingDoctorName}
                </div>
                <div>
                  <strong>Status:</strong> {ord.status} · <strong>Ordered:</strong> {new Date(ord.orderedAt).toLocaleString()}
                </div>
              </div>

              {ord.results.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted, #64748b)' }}>
                  Awaiting analytical bench result entry.
                </div>
              ) : (
                <TableContainer style={{ border: 'none', borderRadius: '0' }}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter Code</TableHead>
                        <TableHead>Analyte / Test Parameter</TableHead>
                        <TableHead>Observed Value</TableHead>
                        <TableHead>Reference Interval</TableHead>
                        <TableHead>Flag / Severity</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Verification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ord.results.map((res) => (
                        <TableRow key={res.id}>
                          <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>{res.parameterCode}</TableCell>
                          <TableCell style={{ fontWeight: 600 }}>{res.parameterName}</TableCell>
                          <TableCell style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: 700 }}>
                            {res.resultValue} {res.unit ?? ''}
                          </TableCell>
                          <TableCell style={{ color: 'var(--ds-color-text-muted, #64748b)' }}>
                            {res.referenceRange || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {res.abnormalFlag === 'NORMAL' && <Badge variant="success">Normal</Badge>}
                            {res.abnormalFlag === 'HIGH' && <Badge variant="warning">High</Badge>}
                            {res.abnormalFlag === 'LOW' && <Badge variant="warning">Low</Badge>}
                            {res.abnormalFlag === 'ABNORMAL' && <Badge variant="warning">Abnormal</Badge>}
                            {(res.abnormalFlag === 'CRITICAL_HIGH' || res.abnormalFlag === 'CRITICAL_LOW') && (
                              <Badge variant="danger">🚨 {res.abnormalFlag}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="neutral">v{res.version}</Badge>
                          </TableCell>
                          <TableCell>
                            {res.verifiedBy ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-success-text, #16a34a)' }}>
                                ✓ {res.verifiedBy}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-warning-text, #d97706)' }}>
                                Pending
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
