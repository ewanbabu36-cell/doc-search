import React from 'react';
import { Card, Button } from '@docsearch/ui-kit';

export const IPDReportsView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Inpatient Regulatory & Clinical Reports</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Download daily census, death registries, and bed utilization audits.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <strong style={{ fontSize: '1rem' }}>Daily Midnight Census Report</strong>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0' }}>Official hospital midnight count of admissions, transfers, and discharges.</p>
          <Button variant="outline" size="sm">Export PDF</Button>
        </Card>
        <Card style={{ padding: '1.25rem' }}>
          <strong style={{ fontSize: '1rem' }}>Bed Turnover & Downtime Audit</strong>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0' }}>Average cleaning duration and housekeeping efficiency analytics.</p>
          <Button variant="outline" size="sm">Export CSV</Button>
        </Card>
      </div>
    </div>
  );
};