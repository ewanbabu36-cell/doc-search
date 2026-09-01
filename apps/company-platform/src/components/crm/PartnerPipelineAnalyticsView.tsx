import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';

export const PartnerPipelineAnalyticsView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI Overview Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>TOTAL PARTNER PIPELINE</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>42 Accounts</div>
          <span style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700 }}>↑ +18% MoM Lead Inflow</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>ACTIVE PAYING TENANTS</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#06B6D4', marginTop: '4px' }}>28 Facilities</div>
          <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>66.7% Conversion Rate</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>MONTHLY RECURRING (MRR)</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>₹ 14,85,000</div>
          <span style={{ fontSize: '0.6875rem', color: '#A7F3D0', fontWeight: 700 }}>Avg ARR: ₹ 6.36L / Hospital</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>VERIFICATION BACKLOG</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>3 Pending</div>
          <span style={{ fontSize: '0.6875rem', color: '#FDE68A', fontWeight: 700 }}>NABL / CEA Document Review</span>
        </div>
      </div>

      {/* Funnel Stage Breakdown */}
      <Card title="Healthcare Partner Conversion Funnel" padding="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { stage: '1. Marketing & Direct Inbound Leads', count: 42, pct: 100, color: '#38BDF8', value: '₹ 28.5L Pipeline' },
            { stage: '2. Qualified Product Demos & Trial Accounts', count: 35, pct: 83, color: '#06B6D4', value: '₹ 24.2L Pipeline' },
            { stage: '3. Technical Integration & Onboarding', count: 31, pct: 74, color: '#0EA5E9', value: '₹ 21.0L Pipeline' },
            { stage: '4. Legal, NABL / CEA Compliance Verification', count: 29, pct: 69, color: '#F59E0B', value: '₹ 19.5L Pipeline' },
            { stage: '5. Active Subscribed Paying Customers', count: 28, pct: 66, color: '#10B981', value: '₹ 14.85L MRR Realized' }
          ].map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>{item.stage}</span>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>
                  <strong style={{ color: item.color }}>{item.count} Accounts</strong> ({item.pct}%) • {item.value}
                </span>
              </div>
              <div style={{ height: '10px', backgroundColor: '#1E293B', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${item.pct}%`,
                    height: '100%',
                    backgroundColor: item.color,
                    borderRadius: '5px',
                    transition: 'width 300ms ease'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Partner Classification & Geographic Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <Card title="Partner Classification Mix" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🏥 Hospital Networks (Multi-Specialty)</span>
              <Badge variant="primary">12 Networks (43%)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🧪 Diagnostic Pathology & Imaging Labs</span>
              <Badge variant="success">8 Labs (29%)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🩺 Polyclinic & Daycare Centers</span>
              <Badge variant="neutral">5 Clinics (18%)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>👨‍⚕️ Solo Practicing Specialists</span>
              <Badge variant="warning">3 Practices (10%)</Badge>
            </div>
          </div>
        </Card>

        <Card title="Compliance Health & Churn Risk Matrix" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🛡️ ABDM M1/M2/M3 Full Compliance</span>
              <span style={{ color: '#10B981', fontWeight: 800 }}>96.4% Healthy</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📑 Licenses Due for Renewal (30 Days)</span>
              <span style={{ color: '#F59E0B', fontWeight: 800 }}>2 Facilities</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚠️ Low Engagement / At Risk</span>
              <span style={{ color: '#EF4444', fontWeight: 800 }}>1 Account</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔄 Net Revenue Retention (NRR)</span>
              <span style={{ color: '#06B6D4', fontWeight: 800 }}>114.2%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
