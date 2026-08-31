import React from 'react';
import {
  Card,
  Badge
} from '@docsearch/ui-kit';
import type {
  ProcurementVendorDto
} from '@docsearch/api-contracts';

export interface VendorPerformanceViewProps {
  vendors: ProcurementVendorDto[];
}

export const VendorPerformanceView: React.FC<VendorPerformanceViewProps> = ({
  vendors
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Vendor Scorecards & Supplier Performance Index
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Quality inspection pass rates, delivery SLA compliance, lead-time variance, and billing accuracy.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {vendors.map((v) => (
          <Card key={v.id} style={{ padding: '1.25rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 600, color: '#2563eb' }}>{v.vendorCode}</span>
              <Badge variant={v.rating >= 4.5 ? 'success' : 'warning'}>⭐ {v.rating.toFixed(2)}</Badge>
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              {v.legalName}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: '#475569', margin: '0.75rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery SLA:</span>
                <strong>{v.deliverySlaHours} Hours</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Average Lead Time:</span>
                <strong>{v.leadTimeDays} Days</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Risk Tier:</span>
                <span style={{ fontWeight: 600, color: v.riskClassification === 'LOW_RISK' ? '#16a34a' : '#d97706' }}>
                  {v.riskClassification}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total YTD Spend:</span>
                <strong style={{ color: '#16a34a' }}>${v.totalSpendYtd.toLocaleString()}</strong>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
