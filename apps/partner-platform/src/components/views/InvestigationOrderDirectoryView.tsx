import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';

export interface InvestigationOrderDirectoryViewProps {
  orders: InvestigationOrderDto[];
  onSelectOrder: (orderId: string) => void;
  onOpenCreateOrder: () => void;
  onCancelOrder: (order: InvestigationOrderDto) => void;
  onOpenPrint?: (order: InvestigationOrderDto) => void;
}

export const InvestigationOrderDirectoryView: React.FC<InvestigationOrderDirectoryViewProps> = ({
  orders,
  onSelectOrder,
  onOpenCreateOrder,
  onCancelOrder,
  onOpenPrint
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter !== 'ALL' && ord.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && ord.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && ord.investigationCategory !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.patientName.toLowerCase().includes(q) ||
        ord.patientMrn.toLowerCase().includes(q) ||
        ord.investigationCode.toLowerCase().includes(q) ||
        ord.investigationName.toLowerCase().includes(q) ||
        ord.orderingDoctorName.toLowerCase().includes(q) ||
        ord.encounterNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
            📋 Investigation Orders Directory & Status Tracking
          </h3>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Comprehensive directory of laboratory and diagnostic orders across all encounters and specialties.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateOrder}>
          ➕ Place Diagnostic Order
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by order #, patient name, MRN, doctor, or test..."
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'All Statuses', value: 'ALL' },
            { label: 'Sample Required', value: 'SAMPLE_REQUIRED' },
            { label: 'In Processing', value: 'PROCESSING' },
            { label: 'Result Ready', value: 'RESULT_READY' },
            { label: 'Verified', value: 'VERIFIED' },
            { label: 'Completed & Reviewed', value: 'REVIEWED' },
            { label: 'Cancelled', value: 'CANCELLED' }
          ]}
        />
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          options={[
            { label: 'All Priorities', value: 'ALL' },
            { label: 'Routine', value: 'ROUTINE' },
            { label: 'Urgent', value: 'URGENT' },
            { label: 'STAT', value: 'STAT' },
            { label: 'Emergency', value: 'EMERGENCY' }
          ]}
        />
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { label: 'All Categories', value: 'ALL' },
            { label: 'Hematology', value: 'HEMATOLOGY' },
            { label: 'Biochemistry', value: 'BIOCHEMISTRY' },
            { label: 'Endocrinology', value: 'ENDOCRINOLOGY' },
            { label: 'Microbiology', value: 'MICROBIOLOGY' },
            { label: 'Radiology', value: 'RADIOLOGY' },
            { label: 'Cardiology', value: 'CARDIOLOGY' }
          ]}
        />
      </div>

      {/* Orders Directory Table */}
      <Card title={`Orders List (${filteredOrders.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Details</TableHead>
                <TableHead>Patient Context</TableHead>
                <TableHead>Diagnostic Test</TableHead>
                <TableHead>Ordering Doctor</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Lifecycle Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ds-color-text-muted)' }}>
                    No investigation orders found matching current filter parameters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{ord.orderNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                        {new Date(ord.orderedAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{ord.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                        MRN: {ord.patientMrn} · Enc: {ord.encounterNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{ord.investigationName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                        {ord.investigationCode} · {ord.investigationCategory}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{ord.orderingDoctorName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                        {ord.orderingDoctorSpecialty || 'Clinical Staff'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ord.priority === 'ROUTINE' && <Badge variant="neutral">Routine</Badge>}
                      {ord.priority === 'URGENT' && <Badge variant="warning">Urgent</Badge>}
                      {ord.priority === 'STAT' && <Badge variant="danger">STAT</Badge>}
                      {ord.priority === 'EMERGENCY' && <Badge variant="danger">Emergency</Badge>}
                    </TableCell>
                    <TableCell>
                      {ord.status === 'SAMPLE_REQUIRED' && <Badge variant="warning">Sample Required</Badge>}
                      {ord.status === 'PROCESSING' && <Badge variant="primary">Processing</Badge>}
                      {ord.status === 'RESULT_READY' && <Badge variant="warning">Result Ready</Badge>}
                      {ord.status === 'VERIFIED' && <Badge variant="primary">Verified</Badge>}
                      {ord.status === 'REVIEWED' && <Badge variant="success">Completed</Badge>}
                      {ord.status === 'CANCELLED' && <Badge variant="danger">Cancelled</Badge>}
                      {ord.isCritical && <Badge variant="danger" style={{ marginLeft: '4px' }}>🚨 CRITICAL</Badge>}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <Button size="sm" variant="primary" onClick={() => onSelectOrder(ord.id)}>
                          View
                        </Button>
                        {onOpenPrint && (ord.results?.length > 0 || ord.status === 'VERIFIED' || ord.status === 'REVIEWED' || ord.status === 'RESULT_READY') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenPrint(ord)}
                            style={{ borderColor: '#06B6D4', color: '#06B6D4', fontWeight: 600 }}
                          >
                            🖨️ Direct Print
                          </Button>
                        )}
                        {ord.status !== 'REVIEWED' && ord.status !== 'CANCELLED' && ord.status !== 'VERIFIED' && (
                          <Button size="sm" variant="outline" onClick={() => onCancelOrder(ord)}>
                            Cancel
                          </Button>
                        )}
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
