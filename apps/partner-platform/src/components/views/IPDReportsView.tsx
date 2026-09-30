import React from 'react';
import { Card, Button } from '@docsearch/ui-kit';

export const IPDReportsView: React.FC = () => {
  const handleExportCensus = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Date,Ward,Admitted,Discharged,Transfers,OccupancyPct\n' +
      `${new Date().toISOString().split('T')[0]},ICU,14,2,1,92%\n` +
      `${new Date().toISOString().split('T')[0]},General Ward,45,6,3,84%\n` +
      `${new Date().toISOString().split('T')[0]},Post-Op,18,4,2,78%`;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `IPD_Midnight_Census_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTurnover = () => {
    const csvContent = 'data:text/csv;charset=utf-8,BedNumber,Ward,AvgCleanMinutes,TurnoverRate,DowntimeHours\n' +
      'B-101,ICU,24,1.4,1.8\nB-102,ICU,18,1.8,0.9\nB-201,General,32,0.9,3.2';
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Bed_Turnover_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>Inpatient Regulatory & Clinical Reports</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Download daily census, death registries, and bed utilization audits.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <strong style={{ fontSize: '1rem' }}>Daily Midnight Census Report</strong>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0' }}>Official hospital midnight count of admissions, transfers, and discharges.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={() => window.print()}>🖨️ Print PDF</Button>
            <Button variant="outline" size="sm" onClick={handleExportCensus}>📥 Export Census CSV</Button>
          </div>
        </Card>
        <Card style={{ padding: '1.25rem' }}>
          <strong style={{ fontSize: '1rem' }}>Bed Turnover & Downtime Audit</strong>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0' }}>Average cleaning duration and housekeeping efficiency analytics.</p>
          <Button variant="outline" size="sm" onClick={handleExportTurnover}>📥 Export Turnover CSV</Button>
        </Card>
      </div>
    </div>
  );
};