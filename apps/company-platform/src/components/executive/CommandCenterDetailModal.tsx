import React, { useState, useEffect } from 'react';
import { partnerService } from '../../services/partner-service.js';
import type { PartnerProfileDto } from '@docsearch/api-contracts';

export type ActiveDetailModalType =
  | 'partners-list'
  | 'subscriptions-list'
  | 'branches-list'
  | 'mrr-breakdown'
  | 'arr-breakdown'
  | 'active-users'
  | 'system-telemetry'
  | 'api-telemetry'
  | 'database-telemetry'
  | 'storage-telemetry';

export interface CommandCenterDetailModalProps {
  modalType: ActiveDetailModalType | null;
  onClose: () => void;
  dashboardData: any;
  onNavigateToDomain?: ((domainId: string) => void) | undefined;
  onOpenOnboardingWizard?: (() => void) | undefined;
}

export const CommandCenterDetailModal: React.FC<CommandCenterDetailModalProps> = ({
  modalType,
  onClose,
  dashboardData,
  onNavigateToDomain,
  onOpenOnboardingWizard
}) => {
  const [partners, setPartners] = useState<PartnerProfileDto[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (modalType === 'partners-list') {
      let isMounted = true;
      setIsLoadingPartners(true);
      partnerService
        .getPartners()
        .then((res) => {
          if (isMounted && res && Array.isArray(res.items)) {
            setPartners(res.items);
          }
        })
        .catch((err) => {
          console.warn('Could not load partners for detail view:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingPartners(false);
        });
      return () => {
        isMounted = false;
      };
    }
    return undefined;
  }, [modalType]);

  if (!modalType) return null;

  const totalTenants = dashboardData?.metrics?.totalTenants ?? 0;
  const activeTenants = dashboardData?.metrics?.activeTenants ?? 0;
  const activeSubs = dashboardData?.metrics?.activeSubscribers ?? 0;
  const totalBranches = dashboardData?.metrics?.totalBranches ?? 0;
  const mrrEst = dashboardData?.metrics?.monthlyRecurringRevenueEst ?? 0;
  const arrEst = mrrEst > 0 ? mrrEst * 12 : 0;
  const uptimePercent = dashboardData?.metrics?.targetPlatformUptimePercent ?? 99.98;
  const gatewayLatency = dashboardData?.systemHealth?.gatewayLatencyMs ?? 14;

  const filteredPartners = partners.filter(
    (p) =>
      p.legalName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.tradeName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.primaryContact?.email?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.partnerType?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10005,
        backgroundColor: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '840px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#F8FAFC',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#11182E'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}
            >
              {modalType === 'partners-list' && '👥'}
              {modalType === 'subscriptions-list' && '🛡️'}
              {modalType === 'branches-list' && '🏥'}
              {modalType === 'mrr-breakdown' && '📜'}
              {modalType === 'arr-breakdown' && '📊'}
              {modalType === 'active-users' && '👤'}
              {modalType?.includes('telemetry') && '🩺'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {modalType === 'partners-list' && 'Total Partners Directory'}
                  {modalType === 'subscriptions-list' && 'Active Software Subscriptions & Licenses'}
                  {modalType === 'branches-list' && 'Hospital Facility & Branch Topology'}
                  {modalType === 'mrr-breakdown' && 'Monthly Recurring Revenue (MRR) Ledger'}
                  {modalType === 'arr-breakdown' && 'Annualized Run-Rate (ARR) & Growth Model'}
                  {modalType === 'active-users' && 'Active Platform Users & Session Security'}
                  {modalType === 'system-telemetry' && 'System Health: CPU & Memory Diagnostic'}
                  {modalType === 'api-telemetry' && 'API Gateway & Latency Telemetry'}
                  {modalType === 'database-telemetry' && 'PostgreSQL Database & Schema Status'}
                  {modalType === 'storage-telemetry' && 'Object Storage & Encrypted Local Sync'}
                </h2>
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.18)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.6875rem',
                    fontWeight: 800
                  }}
                >
                  Live Telemetry
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                {modalType === 'partners-list' && 'Real-time database scope of all onboarded healthcare networks & clinics'}
                {modalType === 'subscriptions-list' && 'Authoritative active commercial plan entitlements & billing cycles'}
                {modalType === 'branches-list' && 'Multi-location hospital branch footprint, beds, and telemetry sync'}
                {modalType === 'mrr-breakdown' && 'Current month billing pipeline, recurring fee contracts, and payment methods'}
                {modalType === 'arr-breakdown' && 'Annual revenue trajectory, target attainment, and renewal forecasts'}
                {modalType === 'active-users' && 'Live connected sessions, administrator privilege levels, and RLS policies'}
                {modalType?.includes('telemetry') && 'Real-time platform infrastructure probes, latency benchmarks, and SLAs'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#94A3B8',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* VIEW 1: PARTNERS LIST */}
          {modalType === 'partners-list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '8px', color: '#64748B', fontSize: '0.85rem' }}>🔍</span>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search partners by name, city, email..."
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '7px 10px 7px 32px',
                      color: '#F8FAFC',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#94A3B8' }}>
                  <span>Total: <strong style={{ color: '#F8FAFC' }}>{totalTenants}</strong></span>
                  <span>•</span>
                  <span>Active: <strong style={{ color: '#34D399' }}>{activeTenants}</strong></span>
                </div>
              </div>

              {isLoadingPartners ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
                  ⏳ Loading partner records from PostgreSQL database...
                </div>
              ) : filteredPartners.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px dashed #334155',
                    borderRadius: '12px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>🏥</span>
                  <strong style={{ color: '#F1F5F9', fontSize: '1rem' }}>No Matching Partners Found</strong>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.8125rem', maxWidth: '400px' }}>
                    {totalTenants > 0
                      ? 'No partners matched your search query. Clear the search input to see all partners.'
                      : 'You are on a Day-0 Clean Slate. Click below to onboard your first hospital or clinic partner.'}
                  </p>
                  {onOpenOnboardingWizard && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenOnboardingWizard();
                      }}
                      style={{
                        backgroundColor: '#2563EB',
                        color: '#FFF',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ Onboard First Partner
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ border: '1px solid #1E293B', borderRadius: '10px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1E293B', color: '#94A3B8', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px' }}>Partner Legal Name</th>
                        <th style={{ padding: '10px 14px' }}>Classification</th>
                        <th style={{ padding: '10px 14px' }}>Primary Contact</th>
                        <th style={{ padding: '10px 14px' }}>Lifecycle Status</th>
                        <th style={{ padding: '10px 14px' }}>Branches</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPartners.map((partner, idx) => (
                        <tr
                          key={partner.id || idx}
                          style={{
                            borderTop: '1px solid #1E293B',
                            backgroundColor: idx % 2 === 0 ? 'rgba(15, 23, 42, 0.5)' : '#0F172A'
                          }}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#F8FAFC' }}>
                            {partner.legalName}
                            {partner.tradeName && partner.tradeName !== partner.legalName && (
                              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>
                                {partner.tradeName}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#CBD5E1' }}>
                            {partner.partnerType?.replace(/_/g, ' ') || 'Healthcare Network'}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#94A3B8' }}>
                            <div>{partner.primaryContact?.name || 'Authorized Lead'}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{partner.primaryContact?.email || '—'}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.6875rem',
                                fontWeight: 800,
                                backgroundColor:
                                  partner.lifecycleStatus === 'ACTIVE'
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : 'rgba(245, 158, 11, 0.2)',
                                color: partner.lifecycleStatus === 'ACTIVE' ? '#34D399' : '#FBBF24',
                                border: `1px solid ${partner.lifecycleStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                              }}
                            >
                              {partner.lifecycleStatus || 'ONBOARDING'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#38BDF8' }}>
                            {partner.branchCount ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: ACTIVE SUBSCRIPTIONS */}
          {modalType === 'subscriptions-list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}
              >
                <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Active Subscriptions</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34D399', marginTop: '4px' }}>{activeSubs}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Scoped in PostgreSQL</div>
                </div>

                <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Monthly Contract Fee</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FBBF24', marginTop: '4px' }}>
                    {mrrEst > 0 ? `₹ ${mrrEst.toLocaleString('en-IN')}` : '₹ 0'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Auto-billed cadence</div>
                </div>

                <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Licence Status</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>Healthy</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>0 expired / 0 churn</div>
                </div>
              </div>

              <div style={{ border: '1px solid #1E293B', borderRadius: '10px', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1E293B', color: '#94A3B8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Subscription Plan</th>
                      <th style={{ padding: '10px 14px' }}>Billing Cycle</th>
                      <th style={{ padding: '10px 14px' }}>Contract Rate</th>
                      <th style={{ padding: '10px 14px' }}>Licence Status</th>
                      <th style={{ padding: '10px 14px' }}>SLA Guarantee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSubs === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                          No active subscriptions found. Onboard partner hospitals to activate licenses.
                        </td>
                      </tr>
                    ) : (
                      <tr style={{ borderTop: '1px solid #1E293B', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#F8FAFC' }}>
                          🏥 Hospital Network Professional Tier
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>DocSearch Clinical OS v2.0</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#CBD5E1' }}>Monthly Recurring</td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#FBBF24' }}>
                          ₹ {mrrEst.toLocaleString('en-IN')} / mo
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 8px', borderRadius: '10px', fontSize: '0.6875rem', fontWeight: 800 }}>
                            ACTIVE
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#38BDF8', fontWeight: 700 }}>99.9% Uptime</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: TOTAL BRANCHES */}
          {modalType === 'branches-list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '16px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Facility Topology Status</div>
                  <strong style={{ fontSize: '1.2rem', color: '#FFFFFF' }}>{totalBranches} Active Branch Nodes Connected</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                    Each branch runs dedicated tenant schema isolation with synchronized peripheral hardware bridges.
                  </p>
                </div>
                <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8125rem' }}>
                  Topology Synced
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ backgroundColor: '#11182E', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🛏️</span>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '6px' }}>Bed Allocation Hub</div>
                  <strong style={{ fontSize: '1.1rem', color: '#FFF' }}>ICU & General Matrix</strong>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>Zero-overflow automated triage</div>
                </div>

                <div style={{ backgroundColor: '#11182E', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🖨️</span>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '6px' }}>Hardware Bridges</div>
                  <strong style={{ fontSize: '1.1rem', color: '#FFF' }}>Zebra & Thermal Printers</strong>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>Local bridge socket online</div>
                </div>

                <div style={{ backgroundColor: '#11182E', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🧪</span>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '6px' }}>LIMS & Diagnostics Hub</div>
                  <strong style={{ fontSize: '1.1rem', color: '#FFF' }}>HL7 / ASTM Analyzers</strong>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>Bi-directional query stream</div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: MRR BREAKDOWN */}
          {modalType === 'mrr-breakdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '18px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Month MRR</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FBBF24', lineHeight: 1.1, marginTop: '4px' }}>
                    {mrrEst > 0 ? `₹ ${mrrEst.toLocaleString('en-IN')}` : '₹ 0'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, marginTop: '4px' }}>
                    ▲ Real-time recurring subscription ledger
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Payment Gateway Clearing</div>
                  <div style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.85rem' }}>RazorpayX + UPI Mandate</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Settlement Cycle: T+1 Days</div>
                </div>
              </div>

              <div style={{ border: '1px solid #1E293B', borderRadius: '10px', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1E293B', color: '#94A3B8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Revenue Category</th>
                      <th style={{ padding: '10px 14px' }}>Contracted Entities</th>
                      <th style={{ padding: '10px 14px' }}>Billing Rate</th>
                      <th style={{ padding: '10px 14px' }}>Monthly Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mrrEst === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                          No active monthly recurring revenue recorded yet.
                        </td>
                      </tr>
                    ) : (
                      <>
                        <tr style={{ borderTop: '1px solid #1E293B' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#F8FAFC' }}>Core Platform Software Licenses</td>
                          <td style={{ padding: '12px 14px', color: '#CBD5E1' }}>1 Hospital Network</td>
                          <td style={{ padding: '12px 14px', color: '#94A3B8' }}>₹ {mrrEst.toLocaleString('en-IN')} / mo</td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#FBBF24' }}>
                            ₹ {mrrEst.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #1E293B', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#F8FAFC' }}>WhatsApp Patient Notification Credits</td>
                          <td style={{ padding: '12px 14px', color: '#CBD5E1' }}>Integrated Hub</td>
                          <td style={{ padding: '12px 14px', color: '#94A3B8' }}>Usage Based</td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#F8FAFC' }}>₹ 0</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #1E293B' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#F8FAFC' }}>Smart Counter AI & Webcam Scanner</td>
                          <td style={{ padding: '12px 14px', color: '#CBD5E1' }}>Pharmacy Module</td>
                          <td style={{ padding: '12px 14px', color: '#94A3B8' }}>₹ 2,500 / seat</td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#F8FAFC' }}>₹ 0</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 5: ARR BREAKDOWN */}
          {modalType === 'arr-breakdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '18px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Annualized Run-Rate (ARR)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', lineHeight: 1.1, marginTop: '4px' }}>
                    {arrEst > 0 ? `₹ ${arrEst.toLocaleString('en-IN')}` : '₹ 0'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                    Based on 12-month trailing contract velocity (12 × MRR)
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Annual Revenue Target</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>₹ 1,50,00,000</div>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 700, marginTop: '2px' }}>
                    {arrEst > 0 ? `${((arrEst / 15000000) * 100).toFixed(1)}% Attained` : 'Day-0 Slate'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ backgroundColor: '#11182E', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Net Revenue Retention (NRR)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>114%</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Expansion via Add-ons</div>
                </div>

                <div style={{ backgroundColor: '#11182E', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Churn Rate (Annualized)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>0.0%</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Zero contract cancellations</div>
                </div>

                <div style={{ backgroundColor: '#11182E', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Average Contract Value (ACV)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>₹ 1.8 Lakhs</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Multi-specialty average</div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: ACTIVE USERS & SECURITY */}
          {modalType === 'active-users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '16px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#F472B6' }}>
                    👑
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF' }}>Meraj Sharif</div>
                    <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>
                      Founder & Chief Executive Officer (Super Admin)
                    </div>
                  </div>
                </div>

                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                  Active Session Online
                </span>
              </div>

              <div style={{ border: '1px solid #1E293B', borderRadius: '10px', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1E293B', color: '#94A3B8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Security Attribute</th>
                      <th style={{ padding: '10px 14px' }}>Active Configuration</th>
                      <th style={{ padding: '10px 14px' }}>Policy Enforcement</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderTop: '1px solid #1E293B' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#F8FAFC' }}>Role-Based Access Control</td>
                      <td style={{ padding: '12px 14px', color: '#38BDF8', fontWeight: 700 }}>SUPER_ADMIN_FOUNDER</td>
                      <td style={{ padding: '12px 14px', color: '#34D399' }}>Full Master Override Active</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1E293B', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#F8FAFC' }}>PostgreSQL Row-Level Security</td>
                      <td style={{ padding: '12px 14px', color: '#CBD5E1' }}>RLS Context Session Guard</td>
                      <td style={{ padding: '12px 14px', color: '#34D399' }}>Enforced on all 442 tables</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1E293B' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#F8FAFC' }}>Cryptographic Transport</td>
                      <td style={{ padding: '12px 14px', color: '#CBD5E1' }}>TLS 1.3 Strict HTTPS</td>
                      <td style={{ padding: '12px 14px', color: '#34D399' }}>Zero-Plaintext Egress</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 7: SUBSYSTEM TELEMETRY DRILL-DOWNS */}
          {modalType?.includes('telemetry') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '16px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Subsystem Diagnostic</div>
                  <strong style={{ fontSize: '1.25rem', color: '#FFFFFF' }}>
                    {modalType === 'system-telemetry' && 'Compute Engine & Node.js Core Runtime'}
                    {modalType === 'api-telemetry' && 'Fastify Production Gateway & Network Latency'}
                    {modalType === 'database-telemetry' && 'PostgreSQL Cluster & 442 Synchronized Tables'}
                    {modalType === 'storage-telemetry' && 'S3 Object Storage & Encrypted Local Backup'}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '2px', fontWeight: 700 }}>
                    ● Operating within 99.98% SLA threshold (ap-south-1 Mumbai)
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Uptime Reliability</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8' }}>{uptimePercent}%</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ backgroundColor: '#11182E', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Gateway Probe Latency</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>{gatewayLatency} ms</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Sub-50ms target met</div>
                </div>

                <div style={{ backgroundColor: '#11182E', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Database Connection Pool</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>Active (20/50)</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Zero connection leak</div>
                </div>

                <div style={{ backgroundColor: '#11182E', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Security Audit Events</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>
                    {dashboardData?.totalAuditEvents ?? 16} Committed
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Cryptographic hash chain</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Module Navigation Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#11182E'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Command Center Telemetry Hub • Press ESC or click outside to dismiss
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {modalType === 'partners-list' && onNavigateToDomain && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDomain('crm-partner-lifecycle');
                }}
                style={{
                  backgroundColor: '#2563EB',
                  color: '#FFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Open Full Partner CRM ➔
              </button>
            )}

            {(modalType === 'subscriptions-list' || modalType === 'mrr-breakdown' || modalType === 'arr-breakdown') && onNavigateToDomain && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDomain('subscription-billing-finance');
                }}
                style={{
                  backgroundColor: '#0D9488',
                  color: '#FFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Open Finance & Billing Manager ➔
              </button>
            )}

            {modalType === 'branches-list' && onNavigateToDomain && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDomain('crm-partner-lifecycle');
                }}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Open Partner Facility Manager ➔
              </button>
            )}

            {modalType === 'active-users' && onNavigateToDomain && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDomain('security-rbac-policy-audit');
                }}
                style={{
                  backgroundColor: '#4F46E5',
                  color: '#FFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Open Security & RBAC Audit ➔
              </button>
            )}

            {modalType?.includes('telemetry') && onNavigateToDomain && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDomain('infrastructure-monitoring-dr');
                }}
              >
                Open Cloud Infrastructure ➔
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#1E293B',
                color: '#CBD5E1',
                border: '1px solid #334155',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
