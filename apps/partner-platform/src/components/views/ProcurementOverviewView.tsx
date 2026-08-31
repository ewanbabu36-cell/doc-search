import React from 'react';
import {
  Card,
  Button,
  Badge
} from '@docsearch/ui-kit';
import type {
  ProcurementOverviewMetricsDto,
  PurchaseOrderDto,
  PurchaseRequisitionDto
} from '@docsearch/api-contracts';

export interface ProcurementOverviewViewProps {
  metrics: ProcurementOverviewMetricsDto;
  purchaseOrders: PurchaseOrderDto[];
  requisitions: PurchaseRequisitionDto[];
  onOpenCreateRequisition: () => void;
  onOpenCreatePO: () => void;
  onOpenEmergencyPurchase: () => void;
  onSelectPO: (poId: string) => void;
}

export const ProcurementOverviewView: React.FC<ProcurementOverviewViewProps> = ({
  metrics,
  purchaseOrders,
  requisitions,
  onOpenCreateRequisition,
  onOpenCreatePO,
  onOpenEmergencyPurchase,
  onSelectPO
}) => {
  const pendingApprovals = requisitions.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW');
  const recentPOs = purchaseOrders.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner with Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            Procurement & Supply Chain Command Center
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Healthcare supplier logistics, electronic 3-way invoice matching, incoming QC gate, and inventory replenishment.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onOpenCreateRequisition}>
            + Raise Requisition
          </Button>
          <Button variant="primary" onClick={onOpenCreatePO}>
            + Issue Purchase Order
          </Button>
          <Button variant="danger" onClick={onOpenEmergencyPurchase}>
            🚨 Emergency Purchase
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Procurement Spend (YTD)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: '0.4rem 0' }}>
            ${metrics.totalSpendYtd.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>
            Across {metrics.activeVendorCount} accredited vendors
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Pending PR Approvals
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563eb', margin: '0.4rem 0' }}>
            {metrics.pendingApprovalsCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {metrics.openRequisitionsCount} open requisitions total
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Active Purchase Orders
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', margin: '0.4rem 0' }}>
            {metrics.activePurchaseOrdersCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {metrics.pendingGrnCount} awaiting dock receipt
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Open Variance Exceptions
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: metrics.openExceptionsCount > 0 ? '#dc2626' : '#16a34a', margin: '0.4rem 0' }}>
            {metrics.openExceptionsCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            ${metrics.outstandingInvoicesAmount.toFixed(2)} AP balance
          </div>
        </Card>
      </div>

      {/* Two Column Operational Queues */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: Requisitions Awaiting Approval */}
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Requisitions Awaiting Authorization ({pendingApprovals.length})
            </h3>
          </div>
          {pendingApprovals.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>All departmental requisitions have been approved or processed.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingApprovals.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {req.requisitionNumber} — {req.departmentName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      By: {req.requestedBy} • Est: ${req.totalEstimatedAmount.toFixed(2)}
                    </div>
                  </div>
                  <Badge variant={req.priority === 'EMERGENCY' ? 'danger' : req.priority === 'URGENT' ? 'warning' : 'neutral'}>
                    {req.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right: Active Purchase Orders */}
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Recent Purchase Order Activity
            </h3>
          </div>
          {recentPOs.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No purchase orders recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentPOs.map((po) => (
                <div
                  key={po.id}
                  onClick={() => onSelectPO(po.id)}
                  style={{
                    padding: '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#2563eb' }}>
                      {po.poNumber} — {po.vendorName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Net: ${po.totalNetAmount.toFixed(2)} • Due: {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge
                    variant={
                      po.status === 'FULLY_RECEIVED' || po.status === 'CLOSED'
                        ? 'success'
                        : po.status === 'SENT_TO_VENDOR'
                        ? 'primary'
                        : po.status === 'CANCELLED'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {po.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
