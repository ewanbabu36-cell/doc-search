import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import { LiveGeographicHospitalBedHeatmapView } from './LiveGeographicHospitalBedHeatmapView.js';
import { RegionalLiveBedIcuMeterView } from './RegionalLiveBedIcuMeterView.js';

interface RegionalWarRoomState {
  id: string;
  stateZone: string;
  activeHospitals: number;
  baseConsultationsHr: number;
  erAmbulanceDispatches: number;
  avgOpdWaitMinutes: number;
  systemLoadStatus: 'OPTIMAL' | 'HIGH_DEMAND_SURGE';
  isBroadcastActive?: boolean;
}

const REGIONS: RegionalWarRoomState[] = [
  {
    id: 'ZONE-DEL',
    stateZone: 'Delhi-NCR (AIIMS, Safdarjung, Apollo, Max)',
    activeHospitals: 142,
    baseConsultationsHr: 4280,
    erAmbulanceDispatches: 28,
    avgOpdWaitMinutes: 12,
    systemLoadStatus: 'OPTIMAL',
    isBroadcastActive: false
  },
  {
    id: 'ZONE-MAHA',
    stateZone: 'Maharashtra (Mumbai MMR, Pune, Nagpur)',
    activeHospitals: 118,
    baseConsultationsHr: 3840,
    erAmbulanceDispatches: 19,
    avgOpdWaitMinutes: 14,
    systemLoadStatus: 'OPTIMAL',
    isBroadcastActive: false
  },
  {
    id: 'ZONE-SOUTH',
    stateZone: 'Karnataka & South (Bengaluru, Hyderabad, Chennai)',
    activeHospitals: 164,
    baseConsultationsHr: 5120,
    erAmbulanceDispatches: 34,
    avgOpdWaitMinutes: 9,
    systemLoadStatus: 'OPTIMAL',
    isBroadcastActive: false
  },
  {
    id: 'ZONE-EAST',
    stateZone: 'East Zone (Kolkata, Bhubaneswar, Guwahati)',
    activeHospitals: 62,
    baseConsultationsHr: 1920,
    erAmbulanceDispatches: 8,
    avgOpdWaitMinutes: 18,
    systemLoadStatus: 'HIGH_DEMAND_SURGE',
    isBroadcastActive: true
  }
];

export const NationalHealthcareWarRoomView: React.FC = () => {
  const [regions, setRegions] = useState<RegionalWarRoomState[]>(REGIONS);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedSurgeZone, setSelectedSurgeZone] = useState<RegionalWarRoomState | null>(
    REGIONS.find((r) => r.systemLoadStatus === 'HIGH_DEMAND_SURGE') || null
  );

  // Real-Time Live Data Stream Ticker State (Auto-Pulsing)
  const [isStreamActive, setIsStreamActive] = useState<boolean>(true);
  const [streamTick, setStreamTick] = useState<number>(0);
  const [panIndiaTraffic, setPanIndiaTraffic] = useState<number>(15160);
  const [erDispatches, setErDispatches] = useState<number>(89);
  const [avgWaitTime, setAvgWaitTime] = useState<number>(11.8);
  const [pulseGlow, setPulseGlow] = useState<boolean>(false);

  // Auto-Pulsing Stream Hook (Every 8 seconds)
  useEffect(() => {
    if (!isStreamActive) return;

    const interval = setInterval(() => {
      setStreamTick((prev) => prev + 1);
      setPulseGlow(true);

      // Fluctuate pan-India live traffic: 15,160 -> 15,185 -> 15,220 -> 15,245
      const jitterTraffic = Math.floor(Math.random() * 45) - 15; // -15 to +30
      setPanIndiaTraffic((prev) => Math.max(15100, Math.min(15350, prev + jitterTraffic)));

      // Gradually increase dispatches or minor jitter
      if (Math.random() > 0.6) {
        setErDispatches((prev) => prev + 1);
      }

      // Micro-jitter avg wait time
      const jitterWait = (Math.random() * 0.4 - 0.2);
      setAvgWaitTime((prev) => +(Math.max(10.5, Math.min(13.5, prev + jitterWait)).toFixed(1)));

      // Reset pulse glow after 1.2 seconds
      setTimeout(() => setPulseGlow(false), 1200);
    }, 8000);

    return () => clearInterval(interval);
  }, [isStreamActive]);

  const handleTriggerBroadcast = (zoneId: string, zoneName: string) => {
    setRegions((prev) =>
      prev.map((r) => (r.id === zoneId ? { ...r, isBroadcastActive: true } : r))
    );
    setBroadcastNotice(
      `🚨 EMERGENCY PROTOCOL BROADCASTED: 485 on-call doctors (180), triage nurses (270), and pathologists (35) mobilized across ${zoneName}!`
    );
    setIsBroadcastModalOpen(false);
    setTimeout(() => setBroadcastNotice(null), 7000);
  };

  const surgeZones = regions.filter((r) => r.systemLoadStatus === 'HIGH_DEMAND_SURGE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Live Stream Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              ⚡ National Healthcare War-Room & Live Consultation Heatmap
            </h2>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                borderRadius: '12px',
                padding: '3px 10px',
                color: '#86EFAC',
                fontSize: '0.75rem',
                fontWeight: 800,
                boxShadow: pulseGlow ? '0 0 15px rgba(16, 185, 129, 0.8)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  animation: 'pulse 1.5s infinite'
                }}
              />
              ● LIVE NETWORK STREAM ({isStreamActive ? `Tick #${streamTick + 1} • Auto-Pulsing` : 'Paused'})
            </div>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Real-time telemetry stream auto-pulsing every 8s across Pan-India hospital nodes, ER triage units, and ambulance dispatches
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsStreamActive(!isStreamActive)}
            style={{ fontWeight: 800 }}
          >
            {isStreamActive ? '⏸️ Pause Live Stream' : '▶️ Resume Live Stream'}
          </Button>

          {surgeZones.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setSelectedSurgeZone(surgeZones[0]!);
                setIsBroadcastModalOpen(true);
              }}
              style={{
                backgroundColor: '#EF4444',
                color: '#FFF',
                fontWeight: 900,
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
                animation: 'pulse 1.5s infinite'
              }}
            >
              🚨 1-Click Broadcast Standby Protocol ({surgeZones.length} Surge Zone)
            </Button>
          )}
        </div>
      </div>

      {broadcastNotice && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '2px solid #EF4444',
            borderRadius: '12px',
            padding: '14px 18px',
            color: '#FCA5A5',
            fontSize: '0.875rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)'
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>📢</span>
          <div>
            <div style={{ color: '#FFF', fontSize: '0.9375rem' }}>{broadcastNotice}</div>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 500 }}>
              SMS, WhatsApp Dispatch & VoIP Sirens triggered with priority 1 routing.
            </span>
          </div>
        </div>
      )}

      {/* War Room KPI Cards (Auto-Pulsing Live Data Stream) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div
          style={{
            backgroundColor: '#0F172A',
            border: pulseGlow ? '1.5px solid #10B981' : '1px solid #334155',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: pulseGlow ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
              PAN-INDIA LIVE TRAFFIC
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>● Streaming</span>
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {panIndiaTraffic.toLocaleString()} / hr
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            Real-time doctor consultations • Auto-updates every 8s
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '16px',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
              EMERGENCY 108 DISPATCHES
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#EF4444', fontWeight: 700 }}>● Active ER</span>
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>
            {erDispatches} Today
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            100% Hospital ER pre-arrival triage
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '16px',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
              NATIONAL AVG OPD WAIT TIME
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>● AI Queue</span>
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
            {avgWaitTime} Minutes
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            Reduced from 75 mins industry average
          </span>
        </div>
      </div>

      {/* Live Geographic Map & ICU Bed Heatmap */}
      <LiveGeographicHospitalBedHeatmapView />

      {/* Regional Live ICU & Ventilator Bed Availability Meter */}
      <RegionalLiveBedIcuMeterView />

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
                <TableHead>Grid Load State</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Surge Action Protocol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((r) => {
                const isSurge = r.systemLoadStatus === 'HIGH_DEMAND_SURGE';
                // Dynamic regional jitter based on stream tick
                const regionalJitter = Math.floor(Math.sin(streamTick + r.baseConsultationsHr) * 20);
                const currentConsultRate = r.baseConsultationsHr + regionalJitter;

                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.stateZone}</strong>
                    </TableCell>
                    <TableCell style={{ fontWeight: 700 }}>
                      {r.activeHospitals} Hospital Nodes
                    </TableCell>
                    <TableCell style={{ fontWeight: 800, color: '#10B981' }}>
                      {currentConsultRate.toLocaleString()} consults / hr
                    </TableCell>
                    <TableCell style={{ color: '#FCD34D', fontWeight: 700 }}>
                      {r.erAmbulanceDispatches} Dispatches
                    </TableCell>
                    <TableCell style={{ color: isSurge ? '#EF4444' : '#38BDF8', fontWeight: isSurge ? 800 : 500 }}>
                      ~ {r.avgOpdWaitMinutes} mins
                    </TableCell>
                    <TableCell>
                      <Badge variant={isSurge ? 'danger' : 'success'}>
                        {r.systemLoadStatus.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      {isSurge ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedSurgeZone(r);
                            setIsBroadcastModalOpen(true);
                          }}
                          style={{
                            backgroundColor: r.isBroadcastActive ? '#10B981' : '#EF4444',
                            color: '#FFF',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            padding: '4px 10px'
                          }}
                        >
                          {r.isBroadcastActive ? '✓ Protocol Active' : '🚨 Broadcast Standby'}
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          ● Normal Monitoring
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Broadcast Standby Protocol Modal */}
      {isBroadcastModalOpen && selectedSurgeZone && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setIsBroadcastModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #EF4444',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(239, 68, 68, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🚨</span>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#EF4444' }}>
                    Emergency Surge Protocol Broadcast
                  </h3>
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                  Target Zone: <strong style={{ color: '#F8FAFC' }}>{selectedSurgeZone.stateZone}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
              <span style={{ color: '#FCA5A5', fontWeight: 700 }}>
                ⚠️ High Surge Telemetry:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>• Current Traffic: <strong>{selectedSurgeZone.baseConsultationsHr} consults/hr</strong></div>
                <div>• Connected Nodes: <strong>{selectedSurgeZone.activeHospitals} Hospitals</strong></div>
                <div>• Avg OPD Wait: <strong>{selectedSurgeZone.avgOpdWaitMinutes} mins</strong></div>
                <div>• ER Dispatches: <strong>{selectedSurgeZone.erAmbulanceDispatches} Today</strong></div>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: '1.5' }}>
              Executing this broadcast will instantly send <strong>High-Priority Standby Push Alerts, WhatsApp Triage Rosters, and Automated IVR Calls</strong> to:
              <ul style={{ margin: '8px 0 0 20px', padding: 0, color: '#A5F3FC' }}>
                <li>🩺 <strong>180+ On-Call Critical Care Intensivists & Physicians</strong></li>
                <li>👩‍⚕️ <strong>270+ Emergency Room (ER) & Triage Nurses</strong></li>
                <li>🧪 <strong>35+ LIMS Pathologists for rapid test turnarounds</strong></li>
                <li>🚑 <strong>108 Regional Ambulance Dispatch Control Desks</strong></li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsBroadcastModalOpen(false)}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => handleTriggerBroadcast(selectedSurgeZone.id, selectedSurgeZone.stateZone)}
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFF',
                  fontWeight: 900,
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                🚨 Confirm & Broadcast Standby Protocol
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
