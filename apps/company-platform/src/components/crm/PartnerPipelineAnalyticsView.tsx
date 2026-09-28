import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner } from '@docsearch/ui-kit';
import { partnerService, type PartnerAnalyticsSummary } from '../../services/partner-service.js';

export const PartnerPipelineAnalyticsView: React.FC = () => {
  const [data, setData] = useState<PartnerAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await partnerService.getPartnerAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load partner pipeline analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Computing real-time pipeline analytics from PostgreSQL tables...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
        <h3 style={{ color: '#F87171', margin: '0 0 8px 0' }}>Unable to compute analytics</h3>
        <p style={{ color: '#94A3B8', margin: '0 0 16px 0', fontSize: '0.875rem' }}>{error || 'No data returned from backend'}</p>
        <button
          type="button"
          onClick={fetchAnalytics}
          style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}
        >
          Retry Analytics Query
        </button>
      </div>
    );
  }

  const { partnerOverview, funnel, kycAnalytics, leadAnalytics, bottlenecks, reviewerWorkload, trends } = data;

  const funnelStages = [
    { label: funnel.registration.label, count: funnel.registration.count, pct: 100, color: '#38BDF8' },
    { label: funnel.lead.label, count: funnel.lead.count, pct: funnel.lead.conversionPercent, color: '#06B6D4' },
    { label: funnel.partner.label, count: funnel.partner.count, pct: funnel.partner.conversionPercent, color: '#0EA5E9' },
    { label: funnel.kycUnderReview.label, count: funnel.kycUnderReview.count, pct: funnel.kycUnderReview.conversionPercent, color: '#F59E0B' },
    { label: funnel.kycApproved.label, count: funnel.kycApproved.count, pct: funnel.kycApproved.conversionPercent, color: '#10B981' },
    { label: funnel.onboarding.label, count: funnel.onboarding.count, pct: funnel.onboarding.conversionPercent, color: '#8B5CF6' },
    { label: funnel.active.label, count: funnel.active.count, pct: funnel.active.conversionPercent, color: '#059669' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
              Partner Conversion Funnel & SLA Operations Intelligence
            </h2>
            <Badge variant="success">Zero Mock · Real Database</Badge>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Computed live from PostgreSQL across staged registrations, leads, partner profiles & audit trails
          </span>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          style={{ backgroundColor: '#1E293B', border: '1px solid #334155', color: '#94A3B8', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
        >
          🔄 Refresh Metrics
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>TOTAL PARTNERS</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>
            {partnerOverview.totalPartners}
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
            {partnerOverview.selfRegistered} self-registered
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>ACTIVE PAYING TENANTS</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            {partnerOverview.active}
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
            {funnel.overallConversionRate}% Overall Conversion
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>KYC SLA COMPLIANCE</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
            {kycAnalytics.slaComplianceRate}%
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#38BDF8' }}>
            {kycAnalytics.averageReviewTurnaroundHours}h avg turnaround
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>CASES REQUIRING ATTENTION</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: bottlenecks.highestBacklogCount > 0 ? '#F59E0B' : '#10B981', marginTop: '4px' }}>
            {kycAnalytics.overdueCases + kycAnalytics.actionRequiredCount}
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#F59E0B' }}>
            {kycAnalytics.overdueCases} overdue · {kycAnalytics.actionRequiredCount} info requested
          </span>
        </div>
      </div>

      {/* 7-Stage Funnel Breakdown */}
      <Card title="7-Stage Healthcare Conversion Funnel (Real Database)" padding="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {funnelStages.map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: '#F8FAFC' }}>
                  {idx + 1}. {item.label}
                </span>
                <span style={{ color: '#94A3B8' }}>
                  <strong style={{ color: item.color }}>{item.count} Accounts</strong> ({item.pct}%)
                </span>
              </div>
              <div style={{ height: '10px', backgroundColor: '#1E293B', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(item.pct, 100)}%`,
                    height: '100%',
                    backgroundColor: item.color,
                    borderRadius: '5px',
                    transition: 'width 400ms ease'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottleneck Analysis & Reviewer Workload */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Bottleneck Panel */}
        <Card title="Bottleneck & SLA Detection" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94A3B8' }}>Highest Aging Stage:</span>
              <Badge variant="warning">
                {bottlenecks.stageWithHighestAging} ({bottlenecks.highestAgingHours}h)
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94A3B8' }}>Highest Backlog Stage:</span>
              <span style={{ color: '#F8FAFC', fontWeight: 700 }}>
                {bottlenecks.stageWithHighestBacklog} ({bottlenecks.highestBacklogCount} items)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94A3B8' }}>Most Backlogged Reviewer:</span>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                {bottlenecks.mostBackloggedReviewer || 'None (Workload Balanced)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94A3B8' }}>SLA Compliance Rate:</span>
              <span style={{ color: '#10B981', fontWeight: 800 }}>
                {kycAnalytics.slaComplianceRate}%
              </span>
            </div>
          </div>
        </Card>

        {/* Lead Analytics Panel */}
        <Card title="Sales Lead Conversion & Inflow" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94A3B8' }}>Total Sales Leads:</span>
              <span style={{ color: '#F8FAFC', fontWeight: 800 }}>{leadAnalytics.totalLeads}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94A3B8' }}>Qualified Leads:</span>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>{leadAnalytics.qualifiedLeads}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94A3B8' }}>Converted to Partners:</span>
              <span style={{ color: '#10B981', fontWeight: 800 }}>
                {leadAnalytics.convertedLeads} ({leadAnalytics.conversionRate}%)
              </span>
            </div>
            {Object.keys(leadAnalytics.bySource).length > 0 && (
              <div style={{ paddingTop: '8px', borderTop: '1px solid #1E293B', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.entries(leadAnalytics.bySource).map(([src, count]) => (
                  <span key={src} style={{ backgroundColor: '#1E293B', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', color: '#94A3B8' }}>
                    {src}: <strong style={{ color: '#F8FAFC' }}>{count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Reviewer Workload Table */}
      {reviewerWorkload.length > 0 && (
        <Card title="Compliance Reviewer Workload & Capacity" padding="md">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94A3B8' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Reviewer Name</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', color: '#F59E0B' }}>Active Cases</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', color: '#10B981' }}>Completed</th>
                </tr>
              </thead>
              <tbody>
                {reviewerWorkload.map((rw) => (
                  <tr key={rw.reviewerId || rw.email} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '8px 10px', color: '#F8FAFC', fontWeight: 700 }}>{rw.name}</td>
                    <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{rw.email}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: rw.activeCases > 0 ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: rw.activeCases > 0 ? '#F59E0B' : '#64748B', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                        {rw.activeCases}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#10B981', fontWeight: 700 }}>
                      {rw.completedCases}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 7-Day Inflow Trends Strip */}
      {trends && trends.dailyRegistrations && trends.dailyRegistrations.length > 0 && (
        <Card title="7-Day Registrations & Approvals Velocity" padding="md">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {trends.dailyRegistrations.map((tr) => (
              <div key={tr.date} style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '8px 12px', minWidth: '90px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>{tr.date.slice(5)}</span>
                <strong style={{ fontSize: '1.1rem', color: '#38BDF8' }}>+{tr.count}</strong>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8', display: 'block' }}>registered</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
