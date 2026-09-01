import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

interface HospitalCityHub {
  id: string;
  cityName: string;
  region: 'INDIA' | 'GLOBAL';
  country: string;
  hospitalNodes: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantIcuBeds: number;
  ventilatorAvailable: number;
  liveConsultsHr: number;
  emergencySirensToday: number;
  status: 'OPTIMAL' | 'MODERATE_DEMAND' | 'CRITICAL_SURGE';
  mapX: number; // Percent on map
  mapY: number; // Percent on map
  flag: string;
  leadHospital: string;
}

const CITY_HUBS: HospitalCityHub[] = [
  {
    id: 'HUB-DEL',
    cityName: 'Delhi-NCR Hub',
    region: 'INDIA',
    country: 'India',
    hospitalNodes: 142,
    totalBeds: 4850,
    occupiedBeds: 3980,
    vacantIcuBeds: 42,
    ventilatorAvailable: 28,
    liveConsultsHr: 4280,
    emergencySirensToday: 28,
    status: 'OPTIMAL',
    mapX: 48,
    mapY: 36,
    flag: '🇮🇳',
    leadHospital: 'AIIMS & Apollo Indraprastha'
  },
  {
    id: 'HUB-BOM',
    cityName: 'Mumbai MMR & Pune',
    region: 'INDIA',
    country: 'India',
    hospitalNodes: 118,
    totalBeds: 3920,
    occupiedBeds: 3240,
    vacantIcuBeds: 38,
    ventilatorAvailable: 22,
    liveConsultsHr: 3840,
    emergencySirensToday: 19,
    status: 'OPTIMAL',
    mapX: 42,
    mapY: 54,
    flag: '🇮🇳',
    leadHospital: 'Lilavati & Kokilaben Dhirubhai Ambani'
  },
  {
    id: 'HUB-BLR',
    cityName: 'Bengaluru & Hyderabad',
    region: 'INDIA',
    country: 'India',
    hospitalNodes: 164,
    totalBeds: 5400,
    occupiedBeds: 4120,
    vacantIcuBeds: 88,
    ventilatorAvailable: 54,
    liveConsultsHr: 5120,
    emergencySirensToday: 34,
    status: 'OPTIMAL',
    mapX: 46,
    mapY: 72,
    flag: '🇮🇳',
    leadHospital: 'Manipal Hospital & Apollo Health City'
  },
  {
    id: 'HUB-CCU',
    cityName: 'Kolkata & Guwahati',
    region: 'INDIA',
    country: 'India',
    hospitalNodes: 62,
    totalBeds: 2150,
    occupiedBeds: 1960,
    vacantIcuBeds: 12,
    ventilatorAvailable: 6,
    liveConsultsHr: 1920,
    emergencySirensToday: 8,
    status: 'CRITICAL_SURGE',
    mapX: 68,
    mapY: 45,
    flag: '🇮🇳',
    leadHospital: 'AMRI Hospitals & Apollo Gleneagles'
  },
  {
    id: 'HUB-DXB',
    cityName: 'Dubai Healthcare City',
    region: 'GLOBAL',
    country: 'United Arab Emirates',
    hospitalNodes: 24,
    totalBeds: 1280,
    occupiedBeds: 840,
    vacantIcuBeds: 64,
    ventilatorAvailable: 40,
    liveConsultsHr: 820,
    emergencySirensToday: 4,
    status: 'OPTIMAL',
    mapX: 30,
    mapY: 42,
    flag: '🇦🇪',
    leadHospital: 'Mediclinic City Hospital & Aster DM'
  },
  {
    id: 'HUB-LON',
    cityName: 'London NHS & Private Partner Hub',
    region: 'GLOBAL',
    country: 'United Kingdom',
    hospitalNodes: 18,
    totalBeds: 1650,
    occupiedBeds: 1390,
    vacantIcuBeds: 26,
    ventilatorAvailable: 18,
    liveConsultsHr: 640,
    emergencySirensToday: 6,
    status: 'MODERATE_DEMAND',
    mapX: 18,
    mapY: 28,
    flag: '🇬🇧',
    leadHospital: 'King’s College Hospital & Bupa Cromwell'
  }
];

export const LiveGeographicHospitalBedHeatmapView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'INDIA' | 'GLOBAL'>('ALL');
  const [activeHubId, setActiveHubId] = useState<string>('HUB-DEL');

  const filteredHubs = CITY_HUBS.filter((hub) =>
    selectedRegion === 'ALL' ? true : hub.region === selectedRegion
  );

  const activeHub: HospitalCityHub = CITY_HUBS.find((h) => h.id === activeHubId) ?? CITY_HUBS[0]!;
  const occupancyPercent = Math.round((activeHub.occupiedBeds / activeHub.totalBeds) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🗺️ Live Geographic Hospital Network & Bed Heatmap
            </h2>
            <Badge variant="success">● Real-Time ICU Telemetry Stream</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Pan-India & Global hub matrix monitoring ICU bed vacancies, ventilator availability, and emergency triage surges
          </p>
        </div>

        {/* Region Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#0F172A', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
          <button
            type="button"
            onClick={() => setSelectedRegion('ALL')}
            style={{
              backgroundColor: selectedRegion === 'ALL' ? '#06B6D4' : 'transparent',
              color: selectedRegion === 'ALL' ? '#070C16' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🌐 All Hubs ({CITY_HUBS.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRegion('INDIA')}
            style={{
              backgroundColor: selectedRegion === 'INDIA' ? '#06B6D4' : 'transparent',
              color: selectedRegion === 'INDIA' ? '#070C16' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🇮🇳 Pan-India Grid
          </button>
          <button
            type="button"
            onClick={() => setSelectedRegion('GLOBAL')}
            style={{
              backgroundColor: selectedRegion === 'GLOBAL' ? '#06B6D4' : 'transparent',
              color: selectedRegion === 'GLOBAL' ? '#070C16' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ✈️ Global Fleet (Dubai, London)
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map Radar + Active Hub Telemetry Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Visual Map Radar Canvas */}
        <div
          style={{
            backgroundColor: '#090E1A',
            border: '1.5px solid #1E293B',
            borderRadius: '16px',
            padding: '20px',
            minHeight: '380px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Radar Background Grid */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.08) 0%, transparent 70%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '100% 100%, 30px 30px, 30px 30px',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#06B6D4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📡 LIVE HOSPITAL FLEET RADAR
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Click any node to inspect ICU telemetry</span>
          </div>

          {/* Interactive City Nodes */}
          <div style={{ position: 'relative', flex: 1, minHeight: '260px', marginTop: '12px' }}>
            {filteredHubs.map((hub) => {
              const isSelected = hub.id === activeHubId;
              const isSurge = hub.status === 'CRITICAL_SURGE';

              return (
                <div
                  key={hub.id}
                  onClick={() => setActiveHubId(hub.id)}
                  style={{
                    position: 'absolute',
                    left: `${hub.mapX}%`,
                    top: `${hub.mapY}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: isSelected ? 10 : 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {/* Glowing Node Circle */}
                  <div
                    style={{
                      width: isSelected ? '28px' : '20px',
                      height: isSelected ? '28px' : '20px',
                      borderRadius: '50%',
                      backgroundColor: isSurge ? '#EF4444' : isSelected ? '#06B6D4' : '#10B981',
                      border: isSelected ? '3px solid #FFF' : '2px solid #0F172A',
                      boxShadow: isSurge
                        ? '0 0 20px #EF4444'
                        : isSelected
                        ? '0 0 20px #06B6D4'
                        : '0 0 10px rgba(16, 185, 129, 0.6)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isSelected ? '0.75rem' : '0.625rem'
                    }}
                  >
                    {hub.flag}
                  </div>

                  {/* City Label Badge */}
                  <div
                    style={{
                      backgroundColor: isSelected ? '#06B6D4' : '#0F172A',
                      color: isSelected ? '#070C16' : '#F8FAFC',
                      fontWeight: 800,
                      fontSize: '0.6875rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: isSelected ? 'none' : '1px solid #334155',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}
                  >
                    {hub.cityName.split(' ')[0]} ({hub.vacantIcuBeds} ICU)
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', zIndex: 2, fontSize: '0.6875rem', color: '#94A3B8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              Optimal Capacity (&lt;80%)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              Critical ICU Surge (&gt;85%)
            </div>
          </div>
        </div>

        {/* Selected Hub Detailed Telemetry Card */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: activeHub.status === 'CRITICAL_SURGE' ? '1.5px solid #EF4444' : '1.5px solid #06B6D4',
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{activeHub.flag}</span>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {activeHub.cityName}
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                  Anchor Fleet: {activeHub.leadHospital}
                </span>
              </div>
              <Badge variant={activeHub.status === 'CRITICAL_SURGE' ? 'danger' : 'success'}>
                {activeHub.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Bed Occupancy Meter */}
            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ color: '#E2E8F0' }}>Overall Bed Occupancy</span>
                <span style={{ color: occupancyPercent > 85 ? '#EF4444' : '#10B981' }}>
                  {occupancyPercent}% ({activeHub.occupiedBeds.toLocaleString()} / {activeHub.totalBeds.toLocaleString()} Beds)
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '10px', backgroundColor: '#334155', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${occupancyPercent}%`,
                    height: '100%',
                    backgroundColor: occupancyPercent > 85 ? '#EF4444' : '#06B6D4',
                    borderRadius: '5px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>

            {/* Critical ICU & Emergency Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '12px', borderLeft: '4px solid #10B981' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>VACANT ICU BEDS</span>
                <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                  {activeHub.vacantIcuBeds} Beds
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>Immediate intake ready</span>
              </div>

              <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '12px', borderLeft: '4px solid #38BDF8' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>VENTILATORS FREE</span>
                <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                  {activeHub.ventilatorAvailable} Units
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>Critical care standby</span>
              </div>

              <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '12px', borderLeft: '4px solid #FCD34D' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>LIVE CONSULTATIONS</span>
                <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>
                  {activeHub.liveConsultsHr.toLocaleString()} / hr
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>{activeHub.hospitalNodes} hospital nodes</span>
              </div>

              <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '12px', borderLeft: '4px solid #EF4444' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>108 ER DISPATCHES</span>
                <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>
                  {activeHub.emergencySirensToday} Today
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>100% triage mapped</span>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <Button
              variant="primary"
              size="sm"
              style={{
                flex: 1,
                backgroundColor: '#06B6D4',
                color: '#070C16',
                fontWeight: 800
              }}
              onClick={() => alert(`✓ Standby Alert sent to ${activeHub.cityName} Emergency Coordination Desk!`)}
            >
              🚨 Alert {activeHub.cityName.split(' ')[0]} ER Desk
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
