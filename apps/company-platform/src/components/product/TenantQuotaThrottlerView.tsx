import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface TenantQuota {
  id: string;
  tenantName: string;
  planTier: string;
  smsQuotaUsage: string;
  aiInferenceUsage: string;
  pacsStorageUsage: string;
  throttlingState: 'NORMAL' | 'SOFT_WARNING_85%' | 'HARD_THROTTLED';
}

const INITIAL_QUOTAS: TenantQuota[] = [
  {
    id: 'QUOTA-01',
    tenantName: 'Apollo Hospitals (Delhi-NCR)',
    planTier: 'ENTERPRISE',
    smsQuotaUsage: '84,200 / 1,00,000 (84.2%)',
    aiInferenceUsage: '42,100 / 1,00,000 (42.1%)',
    pacsStorageUsage: '1.4 TB / 2.0 TB (70.0%)',
    throttlingState: 'NORMAL'
  },
  {
    id: 'QUOTA-02',
    tenantName: 'Max Super Speciality Hospital (Saket)',
    planTier: 'ENTERPRISE',
    smsQuotaUsage: '94,800 / 1,00,000 (94.8%)',
    aiInferenceUsage: '89,200 / 1,00,000 (89.2%)',
    pacsStorageUsage: '1.9 TB / 2.0 TB (95.0%)',
    throttlingState: 'SOFT_WARNING_85%'
  },
  {
    id: 'QUOTA-03',
    tenantName: 'Fortis Memorial Research Institute',
    planTier: 'GROWTH',
    smsQuotaUsage: '49,950 / 50,000 (99.9%)',
    aiInferenceUsage: '24,800 / 25,000 (99.2%)',
    pacsStorageUsage: '490 GB / 500 GB (98.0%)',
    throttlingState: 'HARD_THROTTLED'
  }
];

export const TenantQuotaThrottlerView: React.FC = () => {
  const [quotas, setQuotas] = useState<TenantQuota[]>(INITIAL_QUOTAS);
  const [boostNotice, setBoostNotice] = useState<string | null>(null);

  const handleIssueBoost = (tenantId: string) => {
    setQuotas((prev) =>
      prev.map((q) =>
        q.id === tenantId
          ? {
              ...q,
              throttlingState: 'NORMAL',
              smsQuotaUsage: q.smsQuotaUsage.replace(/\/ \d+,\d+/, '/ 1,50,000 (Boosted)')
            }
          : q
      )
    );
    setBoostNotice(`✓ Temporary +50,000 Quota Boost successfully applied to "${tenantId}"! Throttling released immediately.`);
    setTimeout(() => setBoostNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            ⚡ Real-Time Tenant Quota Throttler & Overrides
          </h2>
          <Badge variant="success">● Redis Token-Bucket Rate Limiter Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Monitor hospital consumption of WhatsApp SMS, AI Diagnostic Tokens, and PACS DICOM cloud storage with 1-click emergency boost overrides
        </p>
      </div>

      {boostNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {boostNotice}
        </div>
      )}

      {/* Quota Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>OVERALL PLATFORM INGESTION</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>12.4M Ops / day</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Zero pipeline congestion</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>NEAR CAPACITY HOSPITALS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>2 Partners</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Exceeded 85% soft warning limit</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>HARD-THROTTLED TENANTS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>1 Partner</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Requires immediate upgrade or boost</span>
        </div>
      </div>

      {/* Quotas Table */}
      <Card title="📜 Hospital Tenant Resource Consumption & Quotas" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital Partner</TableHead>
                <TableHead>Plan Tier</TableHead>
                <TableHead>WhatsApp SMS Usage</TableHead>
                <TableHead>AI Diagnostic Tokens</TableHead>
                <TableHead>PACS DICOM Storage</TableHead>
                <TableHead>Throttling State</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Emergency Override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotas.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{q.tenantName}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{q.id}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={q.planTier === 'ENTERPRISE' ? 'primary' : 'neutral'}>
                      {q.planTier}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                    {q.smsQuotaUsage}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                    {q.aiInferenceUsage}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#FCD34D' }}>
                    {q.pacsStorageUsage}
                  </TableCell>
                  <TableCell>
                    <Badge variant={q.throttlingState === 'NORMAL' ? 'success' : q.throttlingState === 'SOFT_WARNING_85%' ? 'warning' : 'danger'}>
                      {q.throttlingState.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleIssueBoost(q.id)}
                      style={{
                        backgroundColor: '#06B6D4',
                        color: '#070C16',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Boost +50k
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
