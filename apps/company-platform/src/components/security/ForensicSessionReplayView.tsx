import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface ForensicAction {
  timestamp: string;
  httpMethod: string;
  endpoint: string;
  clientIp: string;
  geoCoords: string;
  sha256PayloadHash: string;
  securityVerdict: 'NORMAL' | 'SUSPICIOUS_EXFILTRATION' | 'UNAUTHORIZED_PROBE';
}

const FORENSIC_ACTIONS: ForensicAction[] = [
  {
    timestamp: '11:42:01 UTC',
    httpMethod: 'POST',
    endpoint: '/v1/auth/login (MFA Session Created)',
    clientIp: '185.220.101.42',
    geoCoords: '50.1109° N, 8.6821° E (Frankfurt)',
    sha256PayloadHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    securityVerdict: 'SUSPICIOUS_EXFILTRATION'
  },
  {
    timestamp: '11:42:15 UTC',
    httpMethod: 'GET',
    endpoint: '/v1/patients/search?bulk=true&limit=5000',
    clientIp: '185.220.101.42',
    geoCoords: '50.1109° N, 8.6821° E (Frankfurt)',
    sha256PayloadHash: 'ecc5368a514fa1d6159cfae4f8d48416dcd18bf147efb6d19453c2a1c0d4a974',
    securityVerdict: 'SUSPICIOUS_EXFILTRATION'
  },
  {
    timestamp: '11:42:18 UTC',
    httpMethod: 'POST',
    endpoint: '/v1/patients/export/pdf-dump',
    clientIp: '185.220.101.42',
    geoCoords: '50.1109° N, 8.6821° E (Frankfurt)',
    sha256PayloadHash: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
    securityVerdict: 'UNAUTHORIZED_PROBE'
  }
];

export const ForensicSessionReplayView: React.FC = () => {
  const [actions] = useState<ForensicAction[]>(FORENSIC_ACTIONS);
  const [sessionTarget] = useState('sess_89420_dr_kapoor_frankfurt');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🕵️ Forensic Incident Replay & User Action Timeline
          </h2>
          <Badge variant="warning">Investigating Session: {sessionTarget}</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Cryptographically signed forensic reconstruction of compromised sessions for legal compliance and CERT-In reporting
        </p>
      </div>

      {/* Forensic Timeline */}
      <Card title="📜 Step-by-Step Incident Action Waterfall" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time (UTC)</TableHead>
                <TableHead>HTTP Method & Endpoint</TableHead>
                <TableHead>Client IP & Coordinates</TableHead>
                <TableHead>Payload SHA-256 Digest</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Security Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((act, i) => (
                <TableRow key={i}>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8' }}>
                    {act.timestamp}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{act.httpMethod}</Badge>
                    <strong style={{ marginLeft: '8px', color: '#F8FAFC' }}>{act.endpoint}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem' }}>
                    <span style={{ fontFamily: 'monospace', color: '#EF4444' }}>{act.clientIp}</span>
                    <span style={{ display: 'block', color: '#94A3B8' }}>{act.geoCoords}</span>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: '#94A3B8', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {act.sha256PayloadHash}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="danger">🛑 {act.securityVerdict.replace(/_/g, ' ')}</Badge>
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
