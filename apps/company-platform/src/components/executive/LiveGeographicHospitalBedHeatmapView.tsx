import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface HospitalCityHub {
  id: string;
  cityName: string;
  region: 'INDIA' | 'GLOBAL';
  country: string;
  zoneType: 'GREEN_SMOOTH' | 'YELLOW_RUSH' | 'RED_SURGE';
  trafficLabel: string;
  hospitalNodes: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantIcuBeds: number;
  ventilatorAvailable: number;
  liveConsultsHr: number;
  emergencySirensToday: number;
  mapX: number; // Percent on map
  mapY: number; // Percent on map
  flag: string;
  leadHospital: string;
  surgeReason?: string;
}

const CITY_HUBS: HospitalCityHub[] = [
  // 🟢 Green Zones: Smooth Traffic
  {
    id: 'HUB-DEL',
    cityName: 'Delhi-NCR (AIIMS, Safdarjung, Max)',
    region: 'INDIA',
    country: 'India',
    zoneType: 'GREEN_SMOOTH',
    trafficLabel: '🟢 Smooth Traffic (Optimal)',
    hospitalNodes: 142,
    totalBeds: 4850,
    occupiedBeds: 3420,
    vacantIcuBeds: 58,
    ventilatorAvailable: 34,
    liveConsultsHr: 4280,
    emergencySirensToday: 28,
    mapX: 47,
    mapY: 34,
    flag: '🇮🇳',
    leadHospital: 'AIIMS New Delhi & Apollo Indraprastha'
  },
  {
    id: 'HUB-BLR',
    cityName: 'Bengaluru Cluster (Manipal, Narayana)',
    region: 'INDIA',
    country: 'India',
    zoneType: 'GREEN_SMOOTH',
    trafficLabel: '🟢 Smooth Traffic (Optimal)',
    hospitalNodes: 98,
    totalBeds: 3400,
    occupiedBeds: 2380,
    vacantIcuBeds: 62,
    ventilatorAvailable: 40,
    liveConsultsHr: 3120,
    emergencySirensToday: 18,
    mapX: 44,
    mapY: 72,
    flag: '🇮🇳',
    leadHospital: 'Manipal Hospital & Narayana Health'
  },
  {
    id: 'HUB-BOM',
    cityName: 'Mumbai MMR (Lilavati, Kokilaben)',
    region: 'INDIA',
    country: 'India',
    zoneType: 'GREEN_SMOOTH',
    trafficLabel: '🟢 Smooth Traffic (Optimal)',
    hospitalNodes: 118,
    totalBeds: 3920,
    occupiedBeds: 2840,
    vacantIcuBeds: 48,
    ventilatorAvailable: 26,
    liveConsultsHr: 3840,
    emergencySirensToday: 19,
    mapX: 38,
    mapY: 55,
    flag: '🇮🇳',
    leadHospital: 'Lilavati & Kokilaben Dhirubhai Ambani'
  },

  // 🟡 Yellow Zones: High OPD Rush
  {
    id: 'HUB-PUN',
    cityName: 'Pune & Western Hub (Ruby Hall, Deenanath)',
    region: 'INDIA',
    country: 'India',
    zoneType: 'YELLOW_RUSH',
    trafficLabel: '🟡 High OPD Rush (78% Capacity)',
    hospitalNodes: 54,
    totalBeds: 1850,
    occupiedBeds: 1440,
    vacantIcuBeds: 18,
    ventilatorAvailable: 10,
    liveConsultsHr: 2140,
    emergencySirensToday: 14,
    mapX: 41,
    mapY: 60,
    flag: '🇮🇳',
    leadHospital: 'Ruby Hall Clinic & Sahyadri Hospitals'
  },
  {
    id: 'HUB-HYD',
    cityName: 'Hyderabad Cyber Hub (Apollo, Yashoda)',
    region: 'INDIA',
    country: 'India',
    zoneType: 'YELLOW_RUSH',
    trafficLabel: '🟡 High OPD Rush (82% Capacity)',
    hospitalNodes: 76,
    totalBeds: 2600,
    occupiedBeds: 2130,
    vacantIcuBeds: 22,
    ventilatorAvailable: 14,
    liveConsultsHr: 2980,
    emergencySirensToday: 16,
    mapX: 49,
    mapY: 65,
    flag: '🇮🇳',
    leadHospital: 'Apollo Health City & Yashoda Hospitals'
  },

  // 🔴 Red Glowing Pulse: Hospital Surge / Epidemic Alert
  {
    id: 'HUB-CCU',
    cityName: 'Kolkata Metro Cluster (AMRI, Apollo)',
    region: 'INDIA',
    country: 'India',
    zoneType: 'RED_SURGE',
    trafficLabel: '🔴 Hospital Surge / Epidemic Alert (94% Occupied)',
    hospitalNodes: 62,
    totalBeds: 2150,
    occupiedBeds: 2020,
    vacantIcuBeds: 8,
    ventilatorAvailable: 4,
    liveConsultsHr: 1920,
    emergencySirensToday: 24,
    mapX: 68,
    mapY: 48,
    flag: '🇮🇳',
    leadHospital: 'AMRI Hospitals & Apollo Gleneagles',
    surgeReason: '⚠️ Seasonal Viral Fever & Dengue Case Load Surge (+38% vs normal)'
  },
  {
    id: 'HUB-GAU',
    cityName: 'Guwahati & North-East (GNRC, Downtown)',
    region: 'INDIA',
    country: 'India',
    zoneType: 'RED_SURGE',
    trafficLabel: '🔴 Hospital Surge / Epidemic Alert (91% Occupied)',
    hospitalNodes: 28,
    totalBeds: 980,
    occupiedBeds: 890,
    vacantIcuBeds: 4,
    ventilatorAvailable: 2,
    liveConsultsHr: 940,
    emergencySirensToday: 11,
    mapX: 79,
    mapY: 38,
    flag: '🇮🇳',
    leadHospital: 'GNRC Medical & Downtown Hospital',
    surgeReason: '⚠️ Flood Relief Patient Triage & Respiratory Infections Intake'
  },

  // Global Hubs
  {
    id: 'HUB-DXB',
    cityName: 'Dubai Healthcare City',
    region: 'GLOBAL',
    country: 'United Arab Emirates',
    zoneType: 'GREEN_SMOOTH',
    trafficLabel: '🟢 Smooth Traffic (Optimal)',
    hospitalNodes: 24,
    totalBeds: 1280,
    occupiedBeds: 840,
    vacantIcuBeds: 64,
    ventilatorAvailable: 40,
    liveConsultsHr: 820,
    emergencySirensToday: 4,
    mapX: 24,
    mapY: 42,
    flag: '🇦🇪',
    leadHospital: 'Mediclinic City Hospital & Aster DM'
  },
  {
    id: 'HUB-LON',
    cityName: 'London NHS & Private Partner Hub',
    region: 'GLOBAL',
    country: 'United Kingdom',
    zoneType: 'YELLOW_RUSH',
    trafficLabel: '🟡 High OPD Rush (84% Capacity)',
    hospitalNodes: 18,
    totalBeds: 1650,
    occupiedBeds: 1390,
    vacantIcuBeds: 26,
    ventilatorAvailable: 18,
    liveConsultsHr: 640,
    emergencySirensToday: 6,
    mapX: 14,
    mapY: 26,
    flag: '🇬🇧',
    leadHospital: 'King’s College Hospital & Bupa Cromwell'
  }
];

export const LiveGeographicHospitalBedHeatmapView: React.FC = () => {
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<'ALL' | 'GREEN' | 'YELLOW' | 'RED'>('ALL');
  const [activeHubId, setActiveHubId] = useState<string>('HUB-CCU');

  const filteredHubs = CITY_HUBS.filter((hub) => {
    if (selectedZoneFilter === 'GREEN') return hub.zoneType === 'GREEN_SMOOTH';
    if (selectedZoneFilter === 'YELLOW') return hub.zoneType === 'YELLOW_RUSH';
    if (selectedZoneFilter === 'RED') return hub.zoneType === 'RED_SURGE';
    return true;
  });

  const activeHub: HospitalCityHub = CITY_HUBS.find((h) => h.id === activeHubId) ?? CITY_HUBS[0]!;
  const occupancyPercent = Math.round((activeHub.occupiedBeds / activeHub.totalBeds) * 100);

  const getNodeColor = (zoneType: HospitalCityHub['zoneType']) => {
    switch (zoneType) {
      case 'GREEN_SMOOTH': return '#10B981';
      case 'YELLOW_RUSH': return '#F59E0B';
      case 'RED_SURGE': return '#EF4444';
      default: return '#06B6D4';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🗺️ Interactive Visual Geographic Heatmap & Radar Pulse
            </h2>
            <Badge variant="success">● Real-Time ICU Telemetry Stream</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Surveillance radar tracking 🟢 Smooth Traffic (Delhi, BLR, Mumbai), 🟡 High OPD Rush (Pune, HYD), and 🔴 Red Surge Alerts (Kolkata, Guwahati)
          </p>
        </div>

        {/* Zone Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#0F172A', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
          <button
            type="button"
            onClick={() => setSelectedZoneFilter('ALL')}
            style={{
              backgroundColor: selectedZoneFilter === 'ALL' ? '#06B6D4' : 'transparent',
              color: selectedZoneFilter === 'ALL' ? '#070C16' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            All Zones ({CITY_HUBS.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedZoneFilter('GREEN')}
            style={{
              backgroundColor: selectedZoneFilter === 'GREEN' ? '#10B981' : 'transparent',
              color: selectedZoneFilter === 'GREEN' ? '#070C16' : '#86EFAC',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🟢 Smooth (3)
          </button>
          <button
            type="button"
            onClick={() => setSelectedZoneFilter('YELLOW')}
            style={{
              backgroundColor: selectedZoneFilter === 'YELLOW' ? '#F59E0B' : 'transparent',
              color: selectedZoneFilter === 'YELLOW' ? '#070C16' : '#FCD34D',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🟡 High Rush (3)
          </button>
          <button
            type="button"
            onClick={() => setSelectedZoneFilter('RED')}
            style={{
              backgroundColor: selectedZoneFilter === 'RED' ? '#EF4444' : 'transparent',
              color: selectedZoneFilter === 'RED' ? '#FFF' : '#FCA5A5',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🔴 Red Surge (2)
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map Radar + Active Hub Telemetry Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Visual Map Radar Canvas */}
        <div
          style={{
            backgroundColor: '#090E1A',
            border: '1.5px solid #1E293B',
            borderRadius: '16px',
            padding: '20px',
            minHeight: '420px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Radar Background Grid & Concentric Rings */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.12) 0%, transparent 75%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '100% 100%, 30px 30px, 30px 30px',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#06B6D4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📡 LIVE HEALTHCARE FLEET RADAR & MAP
              </span>
              <Badge variant="primary">● Real-Time Pulsing</Badge>
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Click any hotspot to inspect telemetry</span>
          </div>

          {/* Interactive City Hotspots */}
          <div style={{ position: 'relative', flex: 1, minHeight: '300px', marginTop: '14px' }}>
            {filteredHubs.map((hub) => {
              const isSelected = hub.id === activeHubId;
              const nodeColor = getNodeColor(hub.zoneType);
              const isRed = hub.zoneType === 'RED_SURGE';

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
                    zIndex: isSelected ? 12 : isRed ? 8 : 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {/* Glowing Radar Concentric Rings for Red Surge */}
                  {isRed && (
                    <div
                      style={{
                        position: 'absolute',
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        border: '2px solid rgba(239, 68, 68, 0.6)',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        boxShadow: '0 0 25px rgba(239, 68, 68, 0.8)',
                        animation: 'pulse 1.5s infinite',
                        pointerEvents: 'none'
                      }}
                    />
                  )}

                  {/* Node Circle */}
                  <div
                    style={{
                      width: isSelected ? '30px' : '22px',
                      height: isSelected ? '30px' : '22px',
                      borderRadius: '50%',
                      backgroundColor: nodeColor,
                      border: isSelected ? '3px solid #FFF' : '2px solid #0F172A',
                      boxShadow: isRed
                        ? '0 0 20px #EF4444'
                        : isSelected
                        ? `0 0 20px ${nodeColor}`
                        : `0 0 10px ${nodeColor}88`,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isSelected ? '0.8125rem' : '0.6875rem'
                    }}
                  >
                    {hub.flag}
                  </div>

                  {/* Hotspot Label */}
                  <div
                    style={{
                      backgroundColor: isSelected ? nodeColor : '#0F172A',
                      color: isSelected ? '#070C16' : '#F8FAFC',
                      fontWeight: 800,
                      fontSize: '0.6875rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: isSelected ? 'none' : `1px solid ${nodeColor}66`,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{hub.cityName.split(' ')[0]}</span>
                    <span style={{ color: isSelected ? '#070C16' : nodeColor, fontWeight: 900 }}>
                      ({hub.vacantIcuBeds} ICU)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Color Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', zIndex: 2, fontSize: '0.6875rem', color: '#94A3B8', borderTop: '1px solid #1E293B', paddingTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              🟢 <strong>Smooth Traffic</strong> (Delhi, BLR, Mumbai)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              🟡 <strong>High OPD Rush</strong> (Pune, Hyderabad)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              🔴 <strong>Surge / Epidemic Alert</strong> (Kolkata, Guwahati)
            </div>
          </div>
        </div>

        {/* Selected Hub Detailed Telemetry Card */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: activeHub.zoneType === 'RED_SURGE'
              ? '2px solid #EF4444'
              : activeHub.zoneType === 'YELLOW_RUSH'
              ? '1.5px solid #F59E0B'
              : '1.5px solid #10B981',
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: activeHub.zoneType === 'RED_SURGE' ? '0 8px 30px rgba(239, 68, 68, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
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
              <Badge variant={activeHub.zoneType === 'RED_SURGE' ? 'danger' : activeHub.zoneType === 'YELLOW_RUSH' ? 'warning' : 'success'}>
                {activeHub.trafficLabel}
              </Badge>
            </div>

            {/* Epidemic Surge Warning Banner if Red */}
            {activeHub.surgeReason && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#FCA5A5',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  marginBottom: '14px'
                }}
              >
                {activeHub.surgeReason}
              </div>
            )}

            {/* Bed Occupancy Meter */}
            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ color: '#E2E8F0' }}>Hospital Cluster Bed Occupancy</span>
                <span style={{ color: occupancyPercent > 85 ? '#EF4444' : occupancyPercent > 75 ? '#F59E0B' : '#10B981' }}>
                  {occupancyPercent}% ({activeHub.occupiedBeds.toLocaleString()} / {activeHub.totalBeds.toLocaleString()} Beds)
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '10px', backgroundColor: '#334155', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${occupancyPercent}%`,
                    height: '100%',
                    backgroundColor: occupancyPercent > 85 ? '#EF4444' : occupancyPercent > 75 ? '#F59E0B' : '#10B981',
                    borderRadius: '5px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>

            {/* Critical ICU & Emergency Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '12px', borderLeft: `4px solid ${getNodeColor(activeHub.zoneType)}` }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>VACANT ICU BEDS</span>
                <div style={{ fontSize: '1.375rem', fontWeight: 900, color: activeHub.vacantIcuBeds < 10 ? '#EF4444' : '#10B981', marginTop: '2px' }}>
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
              variant={activeHub.zoneType === 'RED_SURGE' ? 'danger' : 'primary'}
              size="sm"
              style={{
                flex: 1,
                backgroundColor: activeHub.zoneType === 'RED_SURGE' ? '#EF4444' : '#06B6D4',
                color: activeHub.zoneType === 'RED_SURGE' ? '#FFF' : '#070C16',
                fontWeight: 900
              }}
              onClick={() => alert(`✓ Emergency Standby Alert & Surge Protocol successfully triggered for ${activeHub.cityName}!`)}
            >
              🚨 {activeHub.zoneType === 'RED_SURGE' ? 'Trigger Epidemic Surge Protocol' : `Alert ${activeHub.cityName.split(' ')[0]} ER Desk`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
