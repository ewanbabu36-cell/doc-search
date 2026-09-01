import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface RegionalWarRoomState {
  stateZone: string;
  activeHospitals: number;
  liveConsultationsHr: string;
  erAmbulanceDispatches: number;
  avgOpdWaitMinutes: number;
  systemLoadStatus: 'OPTIMAL' | 'HIGH_DEMAND_SURGE';
}

const REGIONS: RegionalWarRoomState[] = [
  {
    stateZone: 'Delhi-NCR (AIIMS, Safdarjung, Apollo, Max)',
    activeHospitals: 142,
    liveConsultationsHr: '4,280 consults / hr',
    erAmbulanceDispatches: 28,
    avgOpdWaitMinutes: 12,
    systemLoadStatus: 'OPTIMAL'
  },
  {
    stateZone: 'Maharashtra (Mumbai MMR, Pune, Nagpur)',
    activeHospitals: 118,
    liveConsultationsHr: '3,840 consults / hr',
    erAmbulanceDispatches: 19,
    avgOpdWaitMinutes: 14,
    systemLoadStatus: 'OPTIMAL'
  },
  {
    stateZone: 'Karnataka & South (Bengaluru, Hyderabad, Chennai)',
    activeHospitals: 164,
    liveConsultationsHr: '5,120 consults / hr',
    erAmbulanceDispatches: 34,
    avgOpdWaitMinutes: 9,
    systemLoadStatus: 'OPTIMAL'
  },
  {
    stateZone: 'East Zone (Kolkata, Bhubaneswar, Guwahati)',
    activeHospitals: 62,
    liveConsultationsHr: '1,920 consults / hr',
    erAmbulanceDispatches: 8,
    avgOpdWaitMinutes: 18,
    systemLoadStatus: 'HIGH_DEMAND_SURGE'
  }
];

export const NationalHealthcareWarRoomView: React.FC = () => {
  const [regions] = useState<RegionalWarRoomState[]>(REGIONS);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            ⚡ National Healthcare War-Room & Live Consultation Heatmap
          </h2>
          <Badge variant="success">● Pan-India Live Health Grid Active (15,160 Consults/Hr)</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Real-time executive war room monitoring national OPD doctor traffic, emergency ER siren dispatches, and regional server grid capacity
        </p>
      </div>

      {/* War Room KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>PAN-INDIA LIVE TRAFFIC</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>15,160 / hr</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Real-time doctor consultations</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>EMERGENCY 108 DISPATCHES</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>89 Today</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>100% Hospital ER pre-arrival triage</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>NATIONAL AVG OPD WAIT TIME</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>11.8 Minutes</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Reduced from 75 mins industry average</span>
        </div>
      </div>

      {/* War Room Grid */}
      <Card title="📜 Regional Healthcare Traffic & Hospital Network Grid" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State / Regional Zone</TableHead>
                <TableHead>Connected Hospitals</TableHead>
                <TableHead>Live Consultation Rate</TableHead>
                <TableHead>ER Dispatches (24H)</TableHead>
                <TableHead>Avg OPD Wait</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Grid Load State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((r) => (
                <TableRow key={r.stateZone}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.stateZone}</strong>
                  </TableCell>
                  <TableCell style={{ fontWeight: 700 }}>
                    {r.activeHospitals} Hospital Nodes
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#10B981' }}>
                    {r.liveConsultationsHr}
                  </TableCell>
                  <TableCell style={{ color: '#FCD34D', fontWeight: 700 }}>
                    {r.erAmbulanceDispatches} Dispatches
                  </TableCell>
                  <TableCell style={{ color: '#38BDF8' }}>
                    ~ {r.avgOpdWaitMinutes} mins
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant={r.systemLoadStatus === 'OPTIMAL' ? 'success' : 'warning'}>
                      {r.systemLoadStatus.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
