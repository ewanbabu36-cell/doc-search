import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface RegionData {
  id: string;
  regionName: string;
  state: string;
  hospitalCount: number;
  topDisease: string;
  caseCount: number;
  weekOnWeekChange: string;
  alertLevel: 'HIGH_ALERT' | 'MODERATE' | 'NORMAL';
  dominantAgeGroup: string;
}

const REGIONAL_DISEASE_DATA: RegionData[] = [
  {
    id: 'REG-01',
    regionName: 'East Delhi & Noida NCR',
    state: 'Delhi / UP',
    hospitalCount: 28,
    topDisease: 'Dengue & Thrombocytopenia',
    caseCount: 1420,
    weekOnWeekChange: '+42.8% (Surge)',
    alertLevel: 'HIGH_ALERT',
    dominantAgeGroup: '20-45 Yrs'
  },
  {
    id: 'REG-02',
    regionName: 'South Delhi & Gurugram',
    state: 'Delhi / Haryana',
    hospitalCount: 34,
    topDisease: 'Viral Upper Respiratory Infection (URI)',
    caseCount: 2180,
    weekOnWeekChange: '+18.4%',
    alertLevel: 'MODERATE',
    dominantAgeGroup: 'Pediatric (0-12 Yrs)'
  },
  {
    id: 'REG-03',
    regionName: 'Mumbai Metropolitan Region (MMR)',
    state: 'Maharashtra',
    hospitalCount: 42,
    topDisease: 'Monsoon Gastroenteritis & Typhoid',
    caseCount: 1890,
    weekOnWeekChange: '+8.2%',
    alertLevel: 'MODERATE',
    dominantAgeGroup: 'All Age Groups'
  },
  {
    id: 'REG-04',
    regionName: 'Bengaluru Urban & Whitefield',
    state: 'Karnataka',
    hospitalCount: 31,
    topDisease: 'Type-2 Diabetes & Hypertension',
    caseCount: 3450,
    weekOnWeekChange: '+2.1% (Stable)',
    alertLevel: 'NORMAL',
    dominantAgeGroup: '35-65 Yrs'
  },
  {
    id: 'REG-05',
    regionName: 'Hyderabad Cyberabad Cluster',
    state: 'Telangana',
    hospitalCount: 24,
    topDisease: 'Chikungunya & Joint Arthralgia',
    caseCount: 860,
    weekOnWeekChange: '+24.5% (Watch)',
    alertLevel: 'HIGH_ALERT',
    dominantAgeGroup: '40+ Yrs'
  }
];

export const GeospatialDiseaseHeatmapView: React.FC = () => {
  const [selectedDisease, setSelectedDisease] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState('ALL');

  const filtered = REGIONAL_DISEASE_DATA.filter((r) => {
    if (selectedAlert !== 'ALL' && r.alertLevel !== selectedAlert) return false;
    if (selectedDisease !== 'ALL' && !r.topDisease.toLowerCase().includes(selectedDisease.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🗺️ Geospatial Disease Heatmap & Outbreak Intelligence
          </h2>
          <Badge variant="danger">● Live GIS Surveillance</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Real-time epidemiological cluster mapping, disease vector density, and AI early outbreak prediction across hospital networks
        </p>
      </div>

      {/* Disease Outbreak Radar Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1.5px solid #EF4444', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase' }}>HIGH ALERT OUTBREAKS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>2 Clusters (NCR & Hyd)</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Dengue (+42%) & Chikungunya (+24%)</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL SURVEILLED POPULATION</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>4.8 Million</div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px', display: 'block' }}>159 Connected Hospital Nodes</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>DIAGNOSTIC POSITIVITY RATE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>14.2% Positivity</div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>Based on 48,200 NABL Blood Tests</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>AI EPIDEMIC PREDICTION</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>Peak in 11 Days</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Monsoon vector subsidence model</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card padding="md">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>Filter Cluster Radar:</span>
          
          <select
            value={selectedDisease}
            onChange={(e) => setSelectedDisease(e.target.value)}
            style={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '6px 12px', color: '#FFF', fontSize: '0.8125rem' }}
          >
            <option value="ALL">All Monitored Disease Categories</option>
            <option value="Dengue">Dengue & Vector Fevers</option>
            <option value="Respiratory">Respiratory / Viral URI</option>
            <option value="Typhoid">Typhoid & Waterborne</option>
            <option value="Diabetes">Diabetes & Chronic Met</option>
          </select>

          <select
            value={selectedAlert}
            onChange={(e) => setSelectedAlert(e.target.value)}
            style={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '6px 12px', color: '#FFF', fontSize: '0.8125rem' }}
          >
            <option value="ALL">All Alert Levels</option>
            <option value="HIGH_ALERT">🚨 High Alert Outbreaks Only</option>
            <option value="MODERATE">⚠️ Moderate Watch</option>
            <option value="NORMAL">🟢 Normal Baseline</option>
          </select>
        </div>
      </Card>

      {/* Geospatial Surveillance Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cluster Region & State</TableHead>
                <TableHead>Active Facilities</TableHead>
                <TableHead>Dominant Clinical Vector / Disease</TableHead>
                <TableHead>Reported Cases (7D)</TableHead>
                <TableHead>Week-on-Week Velocity</TableHead>
                <TableHead>Primary Age Group</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Surveillance Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.regionName}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{r.state}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontWeight: 600 }}>{r.hospitalCount} Hospitals</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.alertLevel === 'HIGH_ALERT' ? 'danger' : r.alertLevel === 'MODERATE' ? 'warning' : 'primary'}>
                      {r.topDisease}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: '#F8FAFC' }}>{r.caseCount.toLocaleString()}</strong>
                  </TableCell>
                  <TableCell>
                    <span style={{ color: r.weekOnWeekChange.includes('+4') || r.weekOnWeekChange.includes('+2') ? '#EF4444' : '#38BDF8', fontWeight: 800 }}>
                      {r.weekOnWeekChange}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {r.dominantAgeGroup}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant={r.alertLevel === 'HIGH_ALERT' ? 'danger' : r.alertLevel === 'MODERATE' ? 'warning' : 'success'}>
                      {r.alertLevel === 'HIGH_ALERT' ? '🚨 OUTBREAK ALERT' : r.alertLevel === 'MODERATE' ? '⚠️ ACTIVE SURVEILLANCE' : '🟢 NORMAL'}
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
