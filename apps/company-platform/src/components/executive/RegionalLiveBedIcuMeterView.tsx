import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

interface RegionalBedData {
  id: string;
  zoneName: string;
  hospitalsCount: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantIcuBeds: number;
  ventilatorsReady: number;
  anchorHospital: string;
  status: 'OPTIMAL' | 'MODERATE' | 'SURGE_ALERT';
}

const REGIONAL_BED_DATA: RegionalBedData[] = [
  {
    id: 'ZONE-DEL',
    zoneName: 'Delhi-NCR Zone (AIIMS, Safdarjung, Max, Fortis)',
    hospitalsCount: 142,
    totalBeds: 1480,
    occupiedBeds: 1240,
    vacantIcuBeds: 42,
    ventilatorsReady: 28,
    anchorHospital: 'AIIMS New Delhi & Apollo Indraprastha',
    status: 'OPTIMAL'
  },
  {
    id: 'ZONE-SOUTH',
    zoneName: 'South Zone (Bengaluru, Hyderabad, Chennai)',
    hospitalsCount: 164,
    totalBeds: 2750,
    occupiedBeds: 2100,
    vacantIcuBeds: 88,
    ventilatorsReady: 54,
    anchorHospital: 'Manipal Hospital & Apollo Health City',
    status: 'OPTIMAL'
  },
  {
    id: 'ZONE-MAHA',
    zoneName: 'Maharashtra (Mumbai MMR, Pune, Nagpur)',
    hospitalsCount: 118,
    totalBeds: 2300,
    occupiedBeds: 1820,
    vacantIcuBeds: 48,
    ventilatorsReady: 26,
    anchorHospital: 'Lilavati Hospital & Kokilaben Ambani',
    status: 'OPTIMAL'
  },
  {
    id: 'ZONE-EAST',
    zoneName: 'East Zone (Kolkata, Bhubaneswar, Guwahati)',
    hospitalsCount: 62,
    totalBeds: 1470,
    occupiedBeds: 1380,
    vacantIcuBeds: 12,
    ventilatorsReady: 6,
    anchorHospital: 'AMRI Hospitals & Apollo Gleneagles',
    status: 'SURGE_ALERT'
  }
];

export const RegionalLiveBedIcuMeterView: React.FC = () => {
  const [bedsData] = useState<RegionalBedData[]>(REGIONAL_BED_DATA);
  const [routeNotice, setRouteNotice] = useState<string | null>(null);

  const totalBedsFleet = bedsData.reduce((a, b) => a + b.totalBeds, 0);
  const totalOccupiedFleet = bedsData.reduce((a, b) => a + b.occupiedBeds, 0);
  const totalIcuVacant = bedsData.reduce((a, b) => a + b.vacantIcuBeds, 0);
  const totalVentilators = bedsData.reduce((a, b) => a + b.ventilatorsReady, 0);

  const handleRoutePatient = (zone: RegionalBedData) => {
    setRouteNotice(`✓ Emergency Routing Triggered: Critical Patient routed to ${zone.anchorHospital} (${zone.vacantIcuBeds} ICU Beds Vacant)!`);
    setTimeout(() => setRouteNotice(null), 4500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🛏️ Regional Live ICU & Ventilator Bed Availability Meter
            </h3>
            <Badge variant="primary">{totalIcuVacant} Total ICU Beds Ready</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Real-time multi-zone bed occupancy bars for instantaneous emergency ICU routing across Pan-India hospital networks
          </p>
        </div>

        {/* Global Summary Badge */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#0F172A', padding: '6px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase' }}>PAN-INDIA OCCUPANCY</span>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10B981' }}>
              {Math.round((totalOccupiedFleet / totalBedsFleet) * 100)}% ({totalOccupiedFleet.toLocaleString()} / {totalBedsFleet.toLocaleString()} Beds)
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #334155', paddingLeft: '10px' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase' }}>VENTILATORS READY</span>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#38BDF8' }}>
              {totalVentilators} Units
            </div>
          </div>
        </div>
      </div>

      {routeNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {routeNotice}
        </div>
      )}

      {/* Regional Bed Bars Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {bedsData.map((zone) => {
          const occupancyRate = Math.round((zone.occupiedBeds / zone.totalBeds) * 100);
          const isSurge = zone.status === 'SURGE_ALERT' || occupancyRate > 90;
          const barColor = isSurge ? '#EF4444' : occupancyRate > 80 ? '#F59E0B' : '#10B981';

          return (
            <div
              key={zone.id}
              style={{
                backgroundColor: '#0F172A',
                border: isSurge ? '1.5px solid #EF4444' : '1px solid #334155',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: isSurge ? '0 4px 20px rgba(239, 68, 68, 0.2)' : 'none'
              }}
            >
              {/* Zone Top Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.125rem' }}>🏥</span>
                  <strong style={{ fontSize: '0.9375rem', color: '#F8FAFC' }}>
                    {zone.zoneName}
                  </strong>
                  <Badge variant={isSurge ? 'danger' : 'success'}>
                    {zone.hospitalsCount} Hospitals
                  </Badge>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#94A3B8' }}>Occupancy:</span>
                    <strong style={{ color: barColor, fontSize: '0.9375rem' }}>
                      {occupancyRate}% ({zone.occupiedBeds.toLocaleString()} / {zone.totalBeds.toLocaleString()} Beds)
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#94A3B8' }}>Vacant ICU:</span>
                    <strong style={{ color: zone.vacantIcuBeds < 15 ? '#EF4444' : '#10B981', fontSize: '0.9375rem' }}>
                      {zone.vacantIcuBeds} Beds
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#94A3B8' }}>Ventilators:</span>
                    <strong style={{ color: '#38BDF8', fontSize: '0.9375rem' }}>
                      {zone.ventilatorsReady} Units
                    </strong>
                  </div>
                </div>
              </div>

              {/* Occupancy Progress Bar */}
              <div style={{ width: '100%', height: '10px', backgroundColor: '#1E293B', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${occupancyRate}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: '5px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>

              {/* Bottom Quick Action & Lead Hospital */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem' }}>
                <span style={{ color: '#94A3B8' }}>
                  Anchor Referral Center: <strong style={{ color: '#CBD5E1' }}>{zone.anchorHospital}</strong>
                </span>

                <Button
                  variant={isSurge ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => handleRoutePatient(zone)}
                  style={{
                    backgroundColor: isSurge ? '#EF4444' : '#06B6D4',
                    color: isSurge ? '#FFF' : '#070C16',
                    fontWeight: 800,
                    padding: '4px 10px',
                    fontSize: '0.75rem'
                  }}
                >
                  🚑 Route Patient to Vacant ICU ({zone.vacantIcuBeds} Ready)
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
