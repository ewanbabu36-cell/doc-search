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
import type {
  BillingRefundDto,
  RefundStatus
} from '@docsearch/api-contracts';

export interface RefundManagementViewProps {
  refunds: BillingRefundDto[];
  onApproveRefund: (refund: BillingRefundDto) => void;
  onProcessRefund: (refund: BillingRefundDto) => void;
}

export const RefundManagementView: React.FC<RefundManagementViewProps> = ({
  refunds,
  onApproveRefund,
  onProcessRefund
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredRefunds = refunds.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const matchNumber = r.refundNumber.toLowerCase().includes(lower);
      const matchPatient = r.patientName.toLowerCase().includes(lower) || r.patientMrn.toLowerCase().includes(lower);
      const matchReason = r.reason.toLowerCase().includes(lower);
      if (!matchNumber && !matchPatient && !matchReason) return false;
    }
    return true;
  });

  const getStatusBadge = (status: RefundStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'APPROVED':
        return <Badge variant="primary">APPROVED</Badge>;
      case 'REQUESTED':
        return <Badge variant="warning">PENDING APPROVAL</Badge>;
      case 'PROCESSING':
        return <Badge variant="neutral">PROCESSING</Badge>;
      case 'REJECTED':
      case 'CANCELLED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          Refund Governance & Disbursement Queue
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Authorized refund workflow connecting Clinical Cancellations → Finance Approval → Gateway Settlement
        </p>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Refunds
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by refund #, patient name, MRN, or reason..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Refund Statuses' },
                { value: 'REQUESTED', label: 'Pending Approval' },
                { value: 'APPROVED', label: 'Approved (Ready to Disburse)' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'REJECTED', label: 'Rejected' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Refund Queue Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Refund #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval / Officer</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No refund requests match the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRefunds.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell style={{ fontWeight: 600 }}>{r.refundNumber}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{r.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.patientMrn}</div>
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: '#dc2626' }}>
                      ${r.amount.toFixed(2)}
                    </TableCell>
                    <TableCell style={{ maxWidth: '280px', fontSize: '0.85rem' }}>
                      {r.reason}
                    </TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {r.approvedBy ? <div>Approved: {r.approvedBy}</div> : <div>Pending Approval</div>}
                      {r.processedBy && <div>Processed: {r.processedBy}</div>}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {r.status === 'REQUESTED' && (
                          <Button variant="primary" onClick={() => onApproveRefund(r)}>
                            Approve
                          </Button>
                        )}
                        {r.status === 'APPROVED' && (
                          <Button variant="primary" onClick={() => onProcessRefund(r)}>
                            Disburse
                          </Button>
                        )}
                        {r.status === 'COMPLETED' && (
                          <Badge variant="success">SETTLED</Badge>
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
