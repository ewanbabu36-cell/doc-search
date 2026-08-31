import React from 'react';
import {
  Card,
  Button,
  Badge
} from '@docsearch/ui-kit';
import type {
  PurchaseRequisitionDto,
  PurchaseOrderDto
} from '@docsearch/api-contracts';

export interface ProcurementApprovalWorkbenchViewProps {
  requisitions: PurchaseRequisitionDto[];
  purchaseOrders: PurchaseOrderDto[];
  onOpenApproveRequisition: (req: PurchaseRequisitionDto) => void;
  onOpenRejectRequisition: (req: PurchaseRequisitionDto) => void;
  onOpenApprovePO: (po: PurchaseOrderDto) => void;
}

export const ProcurementApprovalWorkbenchView: React.FC<ProcurementApprovalWorkbenchViewProps> = ({
  requisitions,
  purchaseOrders,
  onOpenApproveRequisition,
  onOpenRejectRequisition,
  onOpenApprovePO
}) => {
  const pendingPRs = requisitions.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW');
  const pendingPOs = purchaseOrders.filter((po) => po.status === 'PENDING_APPROVAL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Procurement Multi-Tier Approval Workbench
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Hierarchical delegation matrix (Department Head → Purchase Manager → Medical Director / Financial Controller).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Requisitions Awaiting Decision ({pendingPRs.length})
          </h3>
          {pendingPRs.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Zero pending purchase requisitions.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingPRs.map((req) => (
                <div key={req.id} style={{ padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>{req.requisitionNumber}</span>
                    <Badge variant={req.priority === 'EMERGENCY' ? 'danger' : 'warning'}>{req.priority}</Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#0f172a', marginTop: '0.25rem' }}>
                    {req.departmentName} — ${req.totalEstimatedAmount.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    {req.reason}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <Button variant="primary" size="sm" onClick={() => onOpenApproveRequisition(req)}>Authorize</Button>
                    <Button variant="outline" size="sm" onClick={() => onOpenRejectRequisition(req)}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Purchase Orders Awaiting Controller Sign-off ({pendingPOs.length})
          </h3>
          {pendingPOs.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>All purchase orders have been signed off.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingPOs.map((po) => (
                <div key={po.id} style={{ padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>{po.poNumber}</span>
                    <Badge variant="warning">{po.status}</Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#0f172a', marginTop: '0.25rem' }}>
                    {po.vendorName} — ${po.totalNetAmount.toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <Button variant="primary" size="sm" onClick={() => onOpenApprovePO(po)}>Approve PO</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
