import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface PartnerHealthRisk {
  id: string;
  partnerName: string;
  partnerType: 'HOSPITAL_NETWORK' | 'CLINIC' | 'DIAGNOSTIC_LAB' | 'PHARMACY';
  cityState: string;
  monthlyConsults: number;
  consultDeltaPercent: number; // e.g. -42%
  churnRiskScore: number; // 0 to 100
  riskTier: 'HIGH_CHURN_RISK' | 'MODERATE_NURTURE' | 'HEALTHY_CHAMPION';
  primaryIssue: string;
  recommendedAction: string;
  status: 'OUTREACH_PENDING' | 'RETAINED_RESOLVED';
}

const INITIAL_HEALTH_RECORDS: PartnerHealthRisk[] = [
  {
    id: 'HLTH-HOSP-01',
    partnerName: 'Medanta Care Center (Gurugram)',
    partnerType: 'HOSPITAL_NETWORK',
    cityState: 'Gurugram, Haryana',
    monthlyConsults: 410,
    consultDeltaPercent: -44.5,
    churnRiskScore: 88,
    riskTier: 'HIGH_CHURN_RISK',
    primaryIssue: 'OPD doctor queue delay causing 28% patient cancellation rate in past 14 days.',
    recommendedAction: 'Deploy AI Token Queue Dispatcher & schedule immediate VP Clinical Outreach.',
    status: 'OUTREACH_PENDING'
  },
  {
    id: 'HLTH-LAB-02',
    partnerName: 'Care Diagnostic Labs (Indiranagar)',
    partnerType: 'DIAGNOSTIC_LAB',
    cityState: 'Bengaluru, Karnataka',
    monthlyConsults: 620,
    consultDeltaPercent: -18.2,
    churnRiskScore: 54,
    riskTier: 'MODERATE_NURTURE',
    primaryIssue: 'Home sample phlebotomist collection delay (avg 42 mins vs 25 mins SLA).',
    recommendedAction: 'Optimize hyperlocal delivery dispatch radius and auto-incentivize field riders.',
    status: 'OUTREACH_PENDING'
  },
  {
    id: 'HLTH-DOC-03',
    partnerName: 'Apollo Cradle & Children Clinic',
    partnerType: 'CLINIC',
    cityState: 'South Extension, Delhi',
    monthlyConsults: 1840,
    consultDeltaPercent: +28.4,
    churnRiskScore: 12,
    riskTier: 'HEALTHY_CHAMPION',
    primaryIssue: 'None — High patient satisfaction (4.9/5) and 96% repeat retention.',
    recommendedAction: 'Upsell to Platinum Care Pass network partnership & sponsor CME events.',
    status: 'RETAINED_RESOLVED'
  }
];

export const PartnerHealthChurnRadarView: React.FC = () => {
  const [records, setRecords] = useState<PartnerHealthRisk[]>(INITIAL_HEALTH_RECORDS);
  const [notice, setNotice] = useState<string | null>(null);

  const handleTriggerRetention = (id: string, name: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'RETAINED_RESOLVED' } : r))
    );
    setNotice(`✓ High-Priority Retention Intervention Task assigned to VP Partner Success for "${name}"! Priority WhatsApp escalation sent.`);
    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>📈</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              AI Partner Health & Churn Risk Predictive Radar
            </h2>
            <Badge variant="warning">Automated Churn Defense Engine</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Machine learning surveillance tracking consultation velocity drops, doctor queue latency, and partner sentiment to prevent contract churn.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="danger">● 1 Critical At-Risk Partner</Badge>
          <Badge variant="success">● 98.2% Annual Partner Retention</Badge>
        </div>
      </div>

      {notice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {notice}
        </div>
      )}

      {/* Top 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            TOTAL ACTIVE NETWORK PARTNERS
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'monospace' }}>
            486 Facilities
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            142 Hospitals • 180 Clinics • 164 Labs
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            PARTNER NET RETENTION RATE (NDR)
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>
            118.4% NDR
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Net positive expansion revenue
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            PREDICTED SAVED REVENUE
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#FCD34D', margin: '4px 0', fontFamily: 'monospace' }}>
            ₹ 34.8 Lakhs / mo
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Retained through proactive early warning alerts
          </span>
        </div>
      </div>

      {/* Churn Risk Table */}
      <Card title="📜 Partner Health Surveillance Matrix" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Entity & Location</TableHead>
                <TableHead>Volume Velocity (30D)</TableHead>
                <TableHead>Churn Risk Score</TableHead>
                <TableHead>Root Cause Analysis</TableHead>
                <TableHead>Recommended Action</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Retention Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => {
                const isHighRisk = r.riskTier === 'HIGH_CHURN_RISK';
                const isChampion = r.riskTier === 'HEALTHY_CHAMPION';

                return (
                  <TableRow key={r.id} style={{ backgroundColor: isHighRisk ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <TableCell>
                      <div>
                        <strong style={{ color: '#F8FAFC' }}>{r.partnerName}</strong>
                        <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>
                          {r.cityState} • {r.partnerType}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div style={{ fontWeight: 800, color: r.consultDeltaPercent < 0 ? '#EF4444' : '#10B981' }}>
                        {r.consultDeltaPercent > 0 ? `+${r.consultDeltaPercent}%` : `${r.consultDeltaPercent}%`}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>
                        {r.monthlyConsults} monthly consults
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge variant={isHighRisk ? 'danger' : isChampion ? 'success' : 'warning'}>
                        {r.churnRiskScore}/100 ({r.riskTier.replace(/_/g, ' ')})
                      </Badge>
                    </TableCell>

                    <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1', maxWidth: '240px' }}>
                      {r.primaryIssue}
                    </TableCell>

                    <TableCell style={{ fontSize: '0.8125rem', color: '#38BDF8', maxWidth: '220px' }}>
                      {r.recommendedAction}
                    </TableCell>

                    <TableCell style={{ textAlign: 'right' }}>
                      {r.status === 'OUTREACH_PENDING' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleTriggerRetention(r.id, r.partnerName)}
                          style={{
                            backgroundColor: '#EF4444',
                            color: '#FFF',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            padding: '4px 10px'
                          }}
                        >
                          ⚡ Schedule VIP Outreach
                        </Button>
                      ) : (
                        <Badge variant="success">✓ Retained & Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
