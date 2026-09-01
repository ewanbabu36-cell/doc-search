import React from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface PartnerAbdmMetric {
  partnerId: string;
  partnerName: string;
  facilityType: string;
  abhaCreatedToday: number;
  careContextsLinked: number;
  fhirBundlesPushed: number;
  avgLatencyMs: number;
  uptimePct: number;
  gatewayMode: 'PRODUCTION' | 'SANDBOX';
  syncStatus: 'HEALTHY' | 'SYNCING' | 'ERROR_SPIKE';
}

const ABDM_TELEMETRY_DATA: PartnerAbdmMetric[] = [
  {
    partnerId: 'P-101',
    partnerName: 'Apex Multi-Specialty Hospital',
    facilityType: 'HOSPITAL_NETWORK',
    abhaCreatedToday: 142,
    careContextsLinked: 388,
    fhirBundlesPushed: 364,
    avgLatencyMs: 142,
    uptimePct: 99.98,
    gatewayMode: 'PRODUCTION',
    syncStatus: 'HEALTHY'
  },
  {
    partnerId: 'P-102',
    partnerName: 'Metropolis Bio-Pathology Diagnostics',
    facilityType: 'DIAGNOSTIC_LAB',
    abhaCreatedToday: 89,
    careContextsLinked: 245,
    fhirBundlesPushed: 240,
    avgLatencyMs: 98,
    uptimePct: 100.0,
    gatewayMode: 'PRODUCTION',
    syncStatus: 'HEALTHY'
  },
  {
    partnerId: 'P-103',
    partnerName: 'CarePlus Daycare & Surgery Center',
    facilityType: 'SURGICAL_CENTER',
    abhaCreatedToday: 34,
    careContextsLinked: 92,
    fhirBundlesPushed: 88,
    avgLatencyMs: 165,
    uptimePct: 99.92,
    gatewayMode: 'PRODUCTION',
    syncStatus: 'SYNCING'
  },
  {
    partnerId: 'P-104',
    partnerName: 'Apollo Cradle Maternal Health',
    facilityType: 'CLINIC_GROUP',
    abhaCreatedToday: 56,
    careContextsLinked: 130,
    fhirBundlesPushed: 126,
    avgLatencyMs: 110,
    uptimePct: 99.95,
    gatewayMode: 'PRODUCTION',
    syncStatus: 'HEALTHY'
  }
];

export const PartnerAbdmTelemetryView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              ⚡ Real-Time ABDM 2.0 National Health Exchange Telemetry
            </h2>
            <Badge variant="success">Milestone 1, 2 & 3 Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Monitor live ABHA seedings, Care Context discovery, HL7 FHIR bundle sync speeds, and NHA Gateway health
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          🔄 Refresh Live Telemetry (1s)
        </Button>
      </div>

      {/* Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ABHA ACCOUNTS CREATED TODAY</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#06B6D4', marginTop: '2px' }}>
            {ABDM_TELEMETRY_DATA.reduce((s, d) => s + d.abhaCreatedToday, 0)} ABHAs
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>CARE CONTEXTS LINKED</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {ABDM_TELEMETRY_DATA.reduce((s, d) => s + d.careContextsLinked, 0)} Linked
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>FHIR BUNDLE EXCHANGES</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
            {ABDM_TELEMETRY_DATA.reduce((s, d) => s + d.fhirBundlesPushed, 0)} Records
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>NHA GATEWAY LATENCY</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>128 ms (Optimal)</div>
        </div>
      </div>

      {/* Live Partners ABDM Status Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Hospital / Lab</TableHead>
                <TableHead>ABHA Created (24h)</TableHead>
                <TableHead>Care Contexts</TableHead>
                <TableHead>FHIR Diagnostic Pushes</TableHead>
                <TableHead>Avg API Latency</TableHead>
                <TableHead>NHA Gateway Uptime</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Sync Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ABDM_TELEMETRY_DATA.map((t) => (
                <TableRow key={t.partnerId}>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{t.partnerName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{t.facilityType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: '#06B6D4' }}>{t.abhaCreatedToday}</strong>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: '#10B981' }}>{t.careContextsLinked}</strong>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontWeight: 600 }}>{t.fhirBundlesPushed} Bundles</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: 'monospace', color: t.avgLatencyMs < 150 ? '#34D399' : '#F59E0B' }}>
                      {t.avgLatencyMs} ms
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{t.uptimePct}%</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{t.gatewayMode}</Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant={t.syncStatus === 'HEALTHY' ? 'success' : 'warning'}>
                      ● {t.syncStatus}
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
