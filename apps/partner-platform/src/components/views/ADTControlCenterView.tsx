import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { InpatientOverviewMetricsDto } from '@docsearch/api-contracts';

export interface ADTControlCenterViewProps {
  metrics: InpatientOverviewMetricsDto;
  onOpenCreateRequest: () => void;
  onOpenBedBoard: () => void;
}

export const ADTControlCenterView: React.FC<ADTControlCenterViewProps> = ({
  metrics,
  onOpenCreateRequest,
  onOpenBedBoard
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Hospital ADT Operational Health & Capacity
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Real-time surveillance across admission pressure, bed turnaround bottlenecks, and transfer pipelines.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" onClick={onOpenBedBoard}>View Bed Board</Button>
          <Button variant="primary" onClick={onOpenCreateRequest}>+ New Admission</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>Bed Capacity Matrix</strong>
            <Badge variant="success">NORMAL</Badge>
          </div>
          <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div>Total Hospital Beds: <strong>{metrics.totalBeds}</strong></div>
            <div>Occupied Beds: <strong style={{ color: '#2563eb' }}>{metrics.occupiedBeds}</strong></div>
            <div>Available Beds: <strong style={{ color: '#16a34a' }}>{metrics.availableBeds}</strong></div>
            <div>Blocked / Inactive: <strong style={{ color: '#dc2626' }}>{metrics.blockedBeds}</strong></div>
            <div>Under Terminal Cleaning: <strong style={{ color: '#ca8a04' }}>{metrics.cleaningBeds}</strong></div>
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>Patient Flow & Throughput</strong>
            <Badge variant="warning">MODERATE</Badge>
          </div>
          <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div>Admissions Today: <strong>{metrics.admissionsToday}</strong></div>
            <div>Discharges Today: <strong>{metrics.dischargesToday}</strong></div>
            <div>Pending Admission Triage: <strong style={{ color: '#ca8a04' }}>{metrics.pendingAdmissions}</strong></div>
            <div>Pending Bedside Transfers: <strong>{metrics.transferBacklog}</strong></div>
            <div>Pending Discharge Clearances: <strong>{metrics.dischargeBacklog}</strong></div>
          </div>
        </Card>
      </div>
    </div>
  );
};