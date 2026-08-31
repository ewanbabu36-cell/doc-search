import React from 'react';
import {
  Card,
  Button,
  Badge
} from '@docsearch/ui-kit';
import type {
  ProcurementItemDto
} from '@docsearch/api-contracts';

export interface ProcurementPlanningViewProps {
  items: ProcurementItemDto[];
  onOpenCreateRequisition: () => void;
}

export const ProcurementPlanningView: React.FC<ProcurementPlanningViewProps> = ({
  items,
  onOpenCreateRequisition
}) => {
  const criticalItems = items.filter((i) => i.currentStock <= i.reorderLevel);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Stock Reorder & Procurement Planning Intelligence
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Automated stockout risk calculation, buffer thresholds, lead-time forecasting, and suggested replenishment PRs.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateRequisition}>
          + Raise Bulk Indent PR
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>
            Critical Stockout Risk
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', margin: '0.4rem 0' }}>
            {criticalItems.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
            Items at or below safety reorder threshold
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Catalog Coverage
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: '0.4rem 0' }}>
            {items.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>
            Standardized hospital supply lines
          </div>
        </Card>
      </div>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
          Items Requiring Stock Replenishment
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Item Code</th>
                <th style={{ padding: '0.75rem 1rem' }}>Product Name</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Current Stock</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Reorder Level</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Lead Time</th>
                <th style={{ padding: '0.75rem 1rem' }}>Suggested Action</th>
              </tr>
            </thead>
            <tbody>
              {criticalItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>{item.itemCode}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{item.itemName}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>
                    {item.currentStock} {item.unit}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    {item.reorderLevel} {item.unit}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {item.leadTimeDays} days
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant="danger">Requisition Recommended</Badge>
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
