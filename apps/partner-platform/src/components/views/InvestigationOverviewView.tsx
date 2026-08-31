import React from 'react';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  InvestigationOverviewDto,
  InvestigationOrderDto
} from '@docsearch/api-contracts';

export interface InvestigationOverviewViewProps {
  overview: InvestigationOverviewDto;
  orders: InvestigationOrderDto[];
  onOpenNewOrder: () => void;
  onSelectOrder: (id: string) => void;
  onOpenTab: (tabKey: string) => void;
  onOpenPrint?: (order: InvestigationOrderDto) => void;
}

export const InvestigationOverviewView: React.FC<InvestigationOverviewViewProps> = ({
  overview,
  orders,
  onOpenNewOrder,
  onSelectOrder,
  onOpenTab,
  onOpenPrint
}) => {
  const recentOrders = orders.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
            🔬 Clinical Investigations & Diagnostic Laboratory Operations
          </h2>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Multi-facility diagnostic order processing, phlebotomy tracking, pathology verification, and critical result alerts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onOpenPrint && orders.some((o) => o.results.length > 0 || o.status === 'VERIFIED' || o.status === 'REVIEWED') && (
            <Button
              variant="outline"
              onClick={() => {
                const verified = orders.find((o) => o.status === 'VERIFIED' || o.status === 'REVIEWED' || o.results.length > 0) || orders[0];
                if (verified) onOpenPrint(verified);
              }}
              style={{ borderColor: '#06B6D4', color: '#06B6D4', fontWeight: 700 }}
            >
              🖨️ Direct Print Result
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenTab('catalog')}>
            📚 Catalog & Panels
          </Button>
          <Button variant="primary" onClick={onOpenNewOrder}>
            ➕ Place Diagnostic Order
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding="md">
          <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #64748b)', fontWeight: 600 }}>
            TODAY'S ORDERS
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '6px 0 2px' }}>
            {overview.todayOrdersCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
            Active diagnostic requests
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #64748b)', fontWeight: 600 }}>
            PENDING COLLECTIONS
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ds-color-warning-text, #d97706)', margin: '6px 0 2px' }}>
            {overview.pendingCollectionsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
            Phlebotomy queue
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #64748b)', fontWeight: 600 }}>
            LAB PROCESSING
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ds-color-primary, #2563eb)', margin: '6px 0 2px' }}>
            {overview.processingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
            In-analyzer tests
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #64748b)', fontWeight: 600 }}>
            🚨 CRITICAL RESULTS
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', margin: '6px 0 2px' }}>
            {overview.criticalResultsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
            Immediate panic value alerts
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #64748b)', fontWeight: 600 }}>
            DOCTOR REVIEW QUEUE
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ds-color-primary-text, #1d4ed8)', margin: '6px 0 2px' }}>
            {overview.awaitingDoctorReviewCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
            Verified results pending review
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #64748b)', fontWeight: 600 }}>
            COMPLETED & SIGNED
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ds-color-success-text, #16a34a)', margin: '6px 0 2px' }}>
            {overview.completedInvestigationsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
            Physician signed-off EMR records
          </div>
        </Card>
      </div>

      {/* Quick Action Navigation Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <Card padding="md">
          <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>
            🩸 Specimen Collection Station
          </h4>
          <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
            Manage phlebotomy accessioning, tube barcode labeling, and pre-analytical rejection protocols.
          </p>
          <Button size="sm" variant="outline" onClick={() => onOpenTab('specimens')}>
            Open Phlebotomy Queue →
          </Button>
        </Card>

        <Card padding="md">
          <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>
            🔬 Laboratory Processing & Result Entry
          </h4>
          <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
            Bench technician results entry, automated panic value flagging, and pathologist verification.
          </p>
          <Button size="sm" variant="outline" onClick={() => onOpenTab('results')}>
            Open Result Entry Workspace →
          </Button>
        </Card>

        <Card padding="md">
          <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>
            👨‍⚕️ Attending Physician Review Queue
          </h4>
          <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
            Review verified diagnostic findings, sign off reports, and document medication/treatment revisions.
          </p>
          <Button size="sm" variant="outline" onClick={() => onOpenTab('doctorReview')}>
            Open Review Board →
          </Button>
        </Card>
      </div>

      {/* Recent Investigation Orders Table */}
      <Card title={`Recent Diagnostic Orders (${recentOrders.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Investigation / Test</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((ord) => (
                <TableRow key={ord.id}>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {ord.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 600 }}>{ord.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                      MRN: {ord.patientMrn} · Encounter: {ord.encounterNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 600 }}>{ord.investigationName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                      {ord.orderingDoctorName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{ord.investigationCategory}</Badge>
                  </TableCell>
                  <TableCell>
                    {ord.priority === 'ROUTINE' && <Badge variant="neutral">Routine</Badge>}
                    {ord.priority === 'URGENT' && <Badge variant="warning">Urgent</Badge>}
                    {ord.priority === 'STAT' && <Badge variant="danger">STAT</Badge>}
                    {ord.priority === 'EMERGENCY' && <Badge variant="danger">Emergency</Badge>}
                  </TableCell>
                  <TableCell>
                    {ord.status === 'SAMPLE_REQUIRED' && <Badge variant="warning">Sample Required</Badge>}
                    {ord.status === 'PROCESSING' && <Badge variant="primary">In Processing</Badge>}
                    {ord.status === 'RESULT_READY' && <Badge variant="warning">Result Ready</Badge>}
                    {ord.status === 'VERIFIED' && <Badge variant="primary">Verified</Badge>}
                    {ord.status === 'REVIEWED' && <Badge variant="success">Completed & Reviewed</Badge>}
                    {ord.status === 'CANCELLED' && <Badge variant="danger">Cancelled</Badge>}
                    {ord.isCritical && <Badge variant="danger" style={{ marginLeft: '4px' }}>🚨 CRITICAL</Badge>}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Button size="sm" variant="outline" onClick={() => onSelectOrder(ord.id)}>
                        View Record
                      </Button>
                      {onOpenPrint && (ord.results?.length > 0 || ord.status === 'VERIFIED' || ord.status === 'REVIEWED' || ord.status === 'RESULT_READY') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenPrint(ord)}
                          style={{ borderColor: '#06B6D4', color: '#06B6D4', fontWeight: 600 }}
                        >
                          🖨️ Print Result
                        </Button>
                      )}
                    </div>
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
