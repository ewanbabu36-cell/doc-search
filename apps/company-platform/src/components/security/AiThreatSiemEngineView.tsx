import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface SecurityThreat {
  id: string;
  threatType: 'IMPOSSIBLE_TRAVEL' | 'BULK_EMR_EXPORT' | 'BRUTE_FORCE_BURST' | 'ADVERSARIAL_INJECTION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  actorEmail: string;
  sourceIp: string;
  geoLocation: string;
  detectionDetails: string;
  mitigationStatus: 'ACTIVE_BLOCKED' | 'PENDING_REVIEW' | 'AUTO_CONTAINED';
}

const INITIAL_THREATS: SecurityThreat[] = [
  {
    id: 'THREAT-901',
    threatType: 'IMPOSSIBLE_TRAVEL',
    severity: 'CRITICAL',
    actorEmail: 'dr.anil.kapoor@apollo.com',
    sourceIp: '185.220.101.42',
    geoLocation: 'Frankfurt, Germany (2 min after Delhi login)',
    detectionDetails: 'Velocity anomaly: 6,800 km distance traversed in 118 seconds. Session immediately quarantined.',
    mitigationStatus: 'ACTIVE_BLOCKED'
  },
  {
    id: 'THREAT-902',
    threatType: 'BULK_EMR_EXPORT',
    severity: 'HIGH',
    actorEmail: 'nurse.reception@delhi-south.docsearch',
    sourceIp: '103.21.244.18',
    geoLocation: 'New Delhi, India',
    detectionDetails: 'Exceeded rate threshold: 1,420 patient records queried within 60 seconds (Standard quota: 25/min).',
    mitigationStatus: 'AUTO_CONTAINED'
  },
  {
    id: 'THREAT-903',
    threatType: 'BRUTE_FORCE_BURST',
    severity: 'HIGH',
    actorEmail: 'root@docsearch.internal (targeted)',
    sourceIp: '45.154.255.89',
    geoLocation: 'Bucharest, Romania',
    detectionDetails: 'Failed authentication burst: 450 attempts in 3 seconds. WAF Rate Limiter engaged.',
    mitigationStatus: 'ACTIVE_BLOCKED'
  }
];

export const AiThreatSiemEngineView: React.FC = () => {
  const [threats, setThreats] = useState<SecurityThreat[]>(INITIAL_THREATS);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleMitigate = (tId: string) => {
    setThreats((prev) =>
      prev.map((t) => (t.id === tId ? { ...t, mitigationStatus: 'ACTIVE_BLOCKED' } : t))
    );
    setActionNotice(`✓ Threat ${tId} mitigated: Source IP blacklisted on Cloudflare WAF and active sessions terminated.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🤖 AI Threat Detection & Behavioral SIEM Engine
          </h2>
          <Badge variant="danger">● Live Cyber Threat Stream Online</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Real-time user behavior analytics (UEBA), impossible travel velocity detection, and automated WAF threat mitigation
        </p>
      </div>

      {actionNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {actionNotice}
        </div>
      )}

      {/* SIEM Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #EF4444', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase' }}>BLOCKED CYBER ATTACKS (24H)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>14,920 Attacks</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>100% Automated containment</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>IMPOSSIBLE TRAVEL ALERTS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>1 Anomalous Logins</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Instant session lock engaged</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>MEAN TIME TO CONTAIN (MTTC)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>42 Milliseconds</div>
          <span style={{ fontSize: '0.75rem', color: '#A7F3D0', marginTop: '4px', display: 'block' }}>Zero human delay required</span>
        </div>
      </div>

      {/* Live Threat Table */}
      <Card title="📜 Live Security Incident & Behavioral Anomaly Stream" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Threat Classification</TableHead>
                <TableHead>Target Actor / Account</TableHead>
                <TableHead>Source IP & Geo-Location</TableHead>
                <TableHead>Behavioral Detection Telemetry</TableHead>
                <TableHead>Mitigation State</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Security Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {threats.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Badge variant={t.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                      {t.threatType.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <strong style={{ color: '#F8FAFC' }}>{t.actorEmail}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem' }}>
                    <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{t.sourceIp}</span>
                    <span style={{ display: 'block', color: '#94A3B8' }}>{t.geoLocation}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1', maxWidth: '300px', lineHeight: '1.4' }}>
                    {t.detectionDetails}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.mitigationStatus === 'ACTIVE_BLOCKED' ? 'danger' : 'success'}>
                      {t.mitigationStatus.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleMitigate(t.id)}
                      style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      🛡️ Enforce Block
                    </button>
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
