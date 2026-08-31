import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  PurchaseRequisitionDto
} from '@docsearch/api-contracts';

export interface PurchaseRequisitionViewProps {
  requisitions: PurchaseRequisitionDto[];
  onOpenCreateRequisition: () => void;
  onOpenApproveRequisition: (req: PurchaseRequisitionDto) => void;
  onOpenRejectRequisition: (req: PurchaseRequisitionDto) => void;
  onOpenCreatePOFromReq: (req: PurchaseRequisitionDto) => void;
}

export const PurchaseRequisitionView: React.FC<PurchaseRequisitionViewProps> = ({
  requisitions,
  onOpenCreateRequisition,
  onOpenApproveRequisition,
  onOpenRejectRequisition,
  onOpenCreatePOFromReq
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = requisitions.filter((r) =>
    r.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Departmental Purchase Requisitions (PR)
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Clinical department indent requests, required-by schedules, and authorization workflow.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateRequisition}>
          + Raise Purchase Requisition
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search requisitions by PR number, department, requested by..."
        />
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>PR #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Department & Store</th>
                <th style={{ padding: '0.75rem 1rem' }}>Required By</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Priority</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Est. Total</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {req.requisitionNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{req.departmentName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Vault: {req.storeName}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {new Date(req.requiredByDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge variant={req.priority === 'EMERGENCY' ? 'danger' : req.priority === 'URGENT' ? 'warning' : 'neutral'}>
                      {req.priority}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                    ${req.totalEstimatedAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge
                      variant={
                        req.status === 'APPROVED' || req.status === 'CONVERTED_TO_PO'
                          ? 'success'
                          : req.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {req.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {req.status === 'SUBMITTED' && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => onOpenApproveRequisition(req)}>
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onOpenRejectRequisition(req)}>
                            Reject
                          </Button>
                        </>
                      )}
                      {req.status === 'APPROVED' && (
                        <Button variant="primary" size="sm" onClick={() => onOpenCreatePOFromReq(req)}>
                          Create PO
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
