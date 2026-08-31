import React from 'react';
import {
  Card,
  Button
} from '@docsearch/ui-kit';
import type {
  ProcurementOverviewMetricsDto
} from '@docsearch/api-contracts';

export interface ProcurementControlCenterViewProps {
  metrics: ProcurementOverviewMetricsDto;
  onOpenEmergencyPurchase: () => void;
  onOpenCreateRequisition: () => void;
}

export const ProcurementControlCenterView: React.FC<ProcurementControlCenterViewProps> = ({
  metrics,
  onOpenEmergencyPurchase,
  onOpenCreateRequisition
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Executive Procurement Control Cockpit
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            High-level supply chain risk monitoring, inspection velocity, and emergency protocols.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onOpenCreateRequisition}>+ Bulk Requisition</Button>
          <Button variant="danger" onClick={onOpenEmergencyPurchase}>🚨 Trigger Emergency Purchase</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#16a34a' }}>SUPPLY CHAIN HEALTH</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
            Supplier compliance rate: {metrics.vendorComplianceRate}% across all product categories.
          </p>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>OPTIMAL</div>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #dc2626' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#dc2626' }}>CRITICAL STOCKOUT RISK</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
            {metrics.criticalStockAlertsCount} critical lines below safety threshold.
          </p>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>ACTION REQUIRED</div>
        </Card>

        <Card style={{ padding: '1.25rem', borderLeft: '4px solid #d97706' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#d97706' }}>ACCOUNTS PAYABLE MATCH</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
            {metrics.openExceptionsCount} price/quantity variances pending resolution.
          </p>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>${metrics.outstandingInvoicesAmount.toFixed(2)}</div>
        </Card>
      </div>
    </div>
  );
};
