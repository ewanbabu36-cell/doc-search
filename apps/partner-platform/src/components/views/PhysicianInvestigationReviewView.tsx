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

export interface PhysicianInvestigationReviewViewProps {
  orders: InvestigationOrderDto[];
  onReviewResults: (order: InvestigationOrderDto) => void;
  onSelectOrder: (orderId: string) => void;
  onOpenPrint?: (order: InvestigationOrderDto) => void;
}

export const PhysicianInvestigationReviewView: React.FC<PhysicianInvestigationReviewViewProps> = ({
  orders,
  onReviewResults,
  onSelectOrder,
  onOpenPrint
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'PENDING_REVIEW' | 'CRITICAL' | 'ALL'>('PENDING_REVIEW');

  const verifiedOrders = orders.filter((o) => o.status === 'VERIFIED' || o.status === 'REVIEWED');

  const filtered = verifiedOrders.filter((ord) => {
    if (filterMode === 'PENDING_REVIEW' && ord.status !== 'VERIFIED') return false;
    if (filterMode === 'CRITICAL' && !ord.isCritical) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.patientName.toLowerCase().includes(q) ||
        ord.patientMrn.toLowerCase().includes(q) ||
        ord.investigationName.toLowerCase().includes(q) ||
        ord.orderingDoctorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
            👨‍⚕️ Attending Physician Investigation Review Queue
          </h3>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Doctor-facing inbox for verified lab results requiring clinical evaluation, treatment modifications, and patient notification sign-off.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter review queue by patient, doctor, MRN, or test..."
        />
        <Select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value as 'PENDING_REVIEW' | 'CRITICAL' | 'ALL')}
          options={[
            { label: 'Pending Doctor Review (Active Action Items)', value: 'PENDING_REVIEW' },
            { label: '🚨 Critical Abnormalities Requiring Action', value: 'CRITICAL' },
            { label: 'All Verified & Historical Results', value: 'ALL' }
          ]}
        />
      </div>

      <Card title={`Review Queue (${filtered.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Investigation / Test</TableHead>
                <TableHead>Pathologist Findings & Summary</TableHead>
                <TableHead>Severity / Flags</TableHead>
                <TableHead>Doctor Review Status</TableHead>
                <TableHead>Clinical Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ds-color-text-muted)' }}>
                    No investigation findings currently awaiting physician review.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ord.orderNumber}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{ord.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                        MRN: {ord.patientMrn} · Enc: {ord.encounterNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{ord.investigationName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                        {ord.orderingDoctorName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ maxWidth: '280px', fontSize: '0.8125rem' }}>
                        {ord.report?.impression || ord.results.map((r) => `${r.parameterName}: ${r.resultValue}`).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ord.isCritical ? (
                        <Badge variant="danger">🚨 CRITICAL</Badge>
                      ) : ord.isAbnormal ? (
                        <Badge variant="warning">⚠️ Abnormal</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {ord.status === 'VERIFIED' ? (
                        <Badge variant="warning">Pending Review</Badge>
                      ) : (
                        <div>
                          <Badge variant="success">Reviewed</Badge>
                          {ord.report?.reviewingDoctor && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)', marginTop: '2px' }}>
                              by {ord.report.reviewingDoctor}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {ord.status === 'VERIFIED' && (
                          <Button size="sm" variant="primary" onClick={() => onReviewResults(ord)}>
                            👨‍⚕️ Review & Sign
                          </Button>
                        )}
                        {onOpenPrint && (ord.results?.length > 0 || ord.status === 'VERIFIED' || ord.status === 'REVIEWED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenPrint(ord)}
                            style={{ borderColor: '#06B6D4', color: '#06B6D4', fontWeight: 600 }}
                          >
                            🖨️ Print Result
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => onSelectOrder(ord.id)}>
                          View Dossier
                        </Button>
                      </div>
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
