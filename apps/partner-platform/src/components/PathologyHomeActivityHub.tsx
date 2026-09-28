import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Badge,
  Button,
  DataPulse,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableContainer
} from '@docsearch/ui-kit';
import { clinicalInvestigationService } from '../services/clinical-investigation-service.js';
import { partnerFoundationService, type ClinicInvitationDto } from '../services/partner-foundation-service.js';
import type {
  InvestigationOverviewDto,
  InvestigationOrderDto,
  InvestigationAuditTraceDto
} from '@docsearch/api-contracts';
import type { PartnerModuleKey } from './PartnerPlatformShell.js';
import { MicroscopeEyepieceScannerModal, type MicroscopeSmearReport } from './dialogs/MicroscopeEyepieceScannerModal.js';

export interface PathologyHomeActivityHubProps {
  tenantId?: string | undefined;
  onNavigateModule: (moduleKey: PartnerModuleKey, subTab?: string) => void;
  staffName?: string | undefined;
  facilityName?: string | undefined;
  role?: string | undefined;
}

export const PathologyHomeActivityHub: React.FC<PathologyHomeActivityHubProps> = ({
  tenantId = 'default',
  onNavigateModule,
  staffName = 'Lab Professional',
  facilityName = 'Pathology & Diagnostic LIS Hub',
  role = 'PATHOLOGIST'
}) => {
  const [overview, setOverview] = useState<InvestigationOverviewDto | null>(null);
  const [orders, setOrders] = useState<InvestigationOrderDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<InvestigationAuditTraceDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ANALYZING' | 'CRITICAL' | 'READY' | 'COMPLETED'>('ALL');
  const [isMicroscopeModalOpen, setIsMicroscopeModalOpen] = useState(false);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setQuickNotification(msg);
    setTimeout(() => setQuickNotification(null), 3500);
  };

  // 🤝 1-Click Clinic Partner Handshake
  const [incomingInvitations, setIncomingInvitations] = useState<ClinicInvitationDto[]>(() =>
    partnerFoundationService.getIncomingClinicInvitations('PATHOLOGY')
  );
  const [clinicCodeInput, setClinicCodeInput] = useState('');
  const [isLinkingCode, setIsLinkingCode] = useState(false);

  const refreshInvitations = useCallback(() => {
    setIncomingInvitations(partnerFoundationService.getIncomingClinicInvitations('PATHOLOGY'));
  }, []);

  useEffect(() => {
    window.addEventListener('docsearch_partner_links_updated', refreshInvitations);
    window.addEventListener('storage', refreshInvitations);
    return () => {
      window.removeEventListener('docsearch_partner_links_updated', refreshInvitations);
      window.removeEventListener('storage', refreshInvitations);
    };
  }, [refreshInvitations]);

  const handleAcceptTieUp = (invitationIdOrCode: string) => {
    const res = partnerFoundationService.acceptClinicInvitation(invitationIdOrCode, 'PATHOLOGY', {
      partnerId: 'lab-partner-01',
      partnerName: facilityName || 'Shree Ram Diagnostics & Pathology',
      partnerCode: 'LAB-SHREE-RAM-01',
      phone: '+91 98350 11223'
    });
    triggerToast(res.message);
    refreshInvitations();
  };

  const handleDeclineTieUp = (invitationIdOrCode: string) => {
    const res = partnerFoundationService.declineClinicInvitation(invitationIdOrCode, 'PATHOLOGY');
    triggerToast(res.message);
    refreshInvitations();
  };

  const handleManualCodeLink = () => {
    if (!clinicCodeInput.trim()) return;
    setIsLinkingCode(true);
    const res = partnerFoundationService.acceptClinicInvitation(clinicCodeInput.trim(), 'PATHOLOGY', {
      partnerId: 'lab-partner-01',
      partnerName: facilityName || 'Shree Ram Diagnostics & Pathology',
      partnerCode: 'LAB-SHREE-RAM-01',
      phone: '+91 98350 11223'
    });
    setIsLinkingCode(false);
    triggerToast(res.message);
    if (res.success) {
      setClinicCodeInput('');
    }
    refreshInvitations();
  };

  const handleTogglePause = (clinicId: string, currentPaused: boolean) => {
    partnerFoundationService.togglePartnerConnectionStatus(clinicId, 'PATHOLOGY', !currentPaused);
    triggerToast(!currentPaused ? '⏸️ Requisitions paused for this clinic' : '▶️ Requisitions resumed for this clinic');
    refreshInvitations();
  };

  const handleDisconnect = (clinicId: string) => {
    partnerFoundationService.disconnectClinic(clinicId, 'PATHOLOGY');
    triggerToast('Disconnected from clinic.');
    refreshInvitations();
  };

  const loadLabData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ovData, ordData, audData] = await Promise.all([
        clinicalInvestigationService.getOverview(tenantId),
        clinicalInvestigationService.searchOrders({ tenantId, pageIndex: 1, pageSize: 100 }),
        clinicalInvestigationService.getAuditTraces({ tenantId, pageIndex: 1, pageSize: 50 })
      ]);
      setOverview(ovData);
      setOrders(ordData);
      setAuditTraces(audData);
    } catch (err) {
      console.warn('Could not load Pathology Home live telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadLabData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void loadLabData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadLabData]);

  // Filtered orders list for today's active table
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchTerm.toLowerCase();
      const accNum = order.specimens?.[0]?.accessionNumber || '';
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        (order.patientName || '').toLowerCase().includes(q) ||
        (order.patientMrn || '').toLowerCase().includes(q) ||
        accNum.toLowerCase().includes(q) ||
        (order.specimenType || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'CRITICAL') return order.isCritical;
      if (statusFilter === 'PENDING') return order.status === 'SAMPLE_REQUIRED' || order.status === 'ORDERED';
      if (statusFilter === 'ANALYZING') return order.status === 'PROCESSING' || order.status === 'SAMPLE_COLLECTED';
      if (statusFilter === 'READY') return order.status === 'RESULT_READY';
      if (statusFilter === 'COMPLETED') return order.status === 'VERIFIED' || order.status === 'REVIEWED';
      return true;
    });
  }, [orders, searchTerm, statusFilter]);

  // Critical panic orders
  const criticalOrders = useMemo(() => {
    return orders.filter((o) => o.isCritical);
  }, [orders]);

  const handleCommitMicroscopeReport = (report: MicroscopeSmearReport) => {
    setIsMicroscopeModalOpen(false);
    triggerToast(`🔬 AI Smear Result Recorded: ${report.primaryDiagnosis} (${report.confidenceScore}% confidence)`);
    void loadLabData();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '16px 20px 48px',
        color: '#F8FAFC',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Quick Toast Alert */}
      {quickNotification && (
        <div
          className="ds-spring-press"
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 10003,
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#F8FAFC',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⚡</span>
          <span>{quickNotification}</span>
        </div>
      )}

      {/* 🤝 1-CLICK MUTUAL HANDSHAKE & CLINIC TIE-UP WIDGET */}
      {/* A. Pending Invitations Banner (High Visibility) */}
      {incomingInvitations.filter((inv) => inv.status === 'PENDING').map((inv) => (
        <div
          key={inv.invitationId}
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border: '1.5px solid #A855F7',
            borderRadius: '14px',
            padding: '16px 20px',
            boxShadow: '0 8px 24px rgba(168, 85, 247, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(168, 85, 247, 0.25)',
                border: '1.5px solid #A855F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}
            >
              🔔
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#E9D5FF' }}>
                  NEW CLINIC TIE-UP INVITATION
                </span>
                <Badge variant="warning">Code: {inv.clinicCode}</Badge>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>• Received {inv.sentAt}</span>
              </div>
              <div style={{ marginTop: '3px', fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
                🩺 {inv.clinicName} <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '0.875rem' }}>({inv.doctorName})</span>
              </div>
              <div style={{ marginTop: '2px', fontSize: '0.8125rem', color: '#CBD5E1' }}>
                📍 {inv.address} | 📞 {inv.phone}
              </div>
              <div style={{ marginTop: '4px', fontSize: '0.8125rem', color: '#C084FC', fontWeight: 600 }}>
                ✨ Wants to link with your LIS as their EXCLUSIVE PATHOLOGY PARTNER for digital lab requisitions.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button
              variant="success"
              onClick={() => handleAcceptTieUp(inv.invitationId)}
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontWeight: 700,
                padding: '10px 18px',
                fontSize: '0.875rem',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
            >
              ✓ Accept & Link Lab
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDeclineTieUp(inv.invitationId)}
              style={{
                borderColor: '#EF4444',
                color: '#EF4444',
                padding: '10px 14px',
                fontSize: '0.875rem',
                borderRadius: '8px'
              }}
            >
              ✕ Decline
            </Button>
          </div>
        </div>
      ))}

      {/* B. Active Connected Clinics Strip & Quick Code Linker */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '12px'
        }}
      >
        {/* Left: Connected Clinics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            🤝 Partner Network:
          </span>
          {incomingInvitations.filter((inv) => inv.status === 'ACCEPTED').length === 0 ? (
            <span style={{ fontSize: '0.8125rem', color: '#64748B', fontStyle: 'italic' }}>
              No clinics linked yet. Enter invite code below to link.
            </span>
          ) : (
            incomingInvitations
              .filter((inv) => inv.status === 'ACCEPTED')
              .map((inv) => (
                <div
                  key={inv.invitationId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px',
                    backgroundColor: inv.isPaused ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                    border: `1px solid ${inv.isPaused ? '#EF4444' : '#A855F7'}`,
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ fontSize: '0.75rem' }}>{inv.isPaused ? '⏸️' : '🟢'}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {inv.clinicName}
                  </span>
                  <Badge variant={inv.isPaused ? 'neutral' : 'success'}>
                    {inv.isPaused ? 'PAUSED' : 'AUTO-ROUTING ACTIVE'}
                  </Badge>
                  <button
                    onClick={() => handleTogglePause(inv.clinicId, !!inv.isPaused)}
                    title={inv.isPaused ? 'Resume orders' : 'Pause orders'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#C084FC',
                      padding: '2px 4px'
                    }}
                  >
                    {inv.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(inv.clinicId)}
                    title="Disconnect Clinic"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#EF4444',
                      padding: '2px 4px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
          )}
        </div>

        {/* Right: Quick Code Linker Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Have an invite code?</span>
          <input
            type="text"
            value={clinicCodeInput}
            onChange={(e) => setClinicCodeInput(e.target.value)}
            placeholder="e.g. CLINIC-SHARMA-2026"
            style={{
              padding: '6px 12px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.8125rem',
              width: '200px',
              textTransform: 'uppercase'
            }}
          />
          <Button
            variant="primary"
            disabled={isLinkingCode || !clinicCodeInput.trim()}
            onClick={handleManualCodeLink}
            style={{
              padding: '6px 12px',
              fontSize: '0.8125rem',
              borderRadius: '6px',
              fontWeight: 600
            }}
          >
            {isLinkingCode ? 'Linking...' : 'Link Now'}
          </Button>
        </div>
      </div>

      {/* Top Pathology Status & Shift Banner */}
      <div
        className="ds-glass-panel"
        style={{
          borderRadius: '16px',
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}
          >
            🧪
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Pathology Laboratory Home
              </h1>
              <Badge variant="primary" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#C084FC', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
                NABL & ISO-15189 Standard
              </Badge>
              <DataPulse status="online" label="LIMS CORE ACTIVE" size="sm" style={{ color: '#34D399', fontSize: '0.7rem' }} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
              {facilityName} • Logged in: <strong style={{ color: '#F1F5F9' }}>{staffName}</strong> ({role.replace(/_/g, ' ')})
            </p>
          </div>
        </div>

        {/* 1-Click Action Bar for Pathology */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMicroscopeModalOpen(true)}
            style={{
              borderColor: 'rgba(168, 85, 247, 0.5)',
              color: '#D8B4FE',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔬</span>
            <span>Microscope AI Scanner</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateModule('clinical-investigation', 'specimens')}
            style={{
              borderColor: 'rgba(56, 189, 248, 0.4)',
              color: '#38BDF8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🩸</span>
            <span>Phlebotomy Queue</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateModule('clinical-investigation')}
            style={{
              backgroundColor: '#9333EA',
              borderColor: '#A855F7',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(147, 51, 234, 0.4)'
            }}
          >
            <span>🧪</span>
            <span>Open LIMS Workbench</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateModule('staff-administration')}
            style={{
              borderColor: 'rgba(56, 189, 248, 0.4)',
              color: '#38BDF8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>👥</span>
            <span>Lab Staff Directory</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              triggerToast('↻ Synchronizing live sample telemetry...');
              void loadLabData();
            }}
            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
            title="Refresh Live Data"
          >
            <span>↻</span>
          </Button>
        </div>
      </div>

      {/* Critical Panic Value Alert Strip (High Priority Clinical Callout) */}
      {criticalOrders.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid #EF4444',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem', animation: 'pulse 1.2s infinite' }}>🚨</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FCA5A5' }}>
                CRITICAL PANIC VALUE ALERTS ({criticalOrders.length} Order{criticalOrders.length > 1 ? 's' : ''})
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px' }}>
                Life-threatening or panic-range test values detected. Mandatory telephonic intimation to ordering clinician required.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('CRITICAL')}
              style={{ borderColor: '#EF4444', color: '#FCA5A5', backgroundColor: 'rgba(239, 68, 68, 0.2)', fontSize: '0.75rem', fontWeight: 700 }}
            >
              Filter Panic Queue ({criticalOrders.length})
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateModule('clinical-investigation', 'critical')}
              style={{ backgroundColor: '#DC2626', color: '#FFF', fontSize: '0.75rem', fontWeight: 800 }}
            >
              Resolve in LIMS ➔
            </Button>
          </div>
        </div>
      )}

      {/* 6 Pathology Telemetry KPI Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '14px'
        }}
      >
        {/* 1. Today's Test Orders */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={() => {
            setStatusFilter('ALL');
            triggerToast('Displaying all diagnostic orders for today');
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              Today's Orders
            </span>
            <span style={{ fontSize: '1.1rem' }}>📋</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', margin: '6px 0 2px' }}>
            {overview?.todayOrdersCount ?? orders.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 600 }}>
            Active investigations logged
          </div>
        </Card>

        {/* 2. Pending Phlebotomy Collection */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={() => {
            setStatusFilter('PENDING');
            triggerToast('Filtered: Pending phlebotomy / sample intake');
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              Pending Collection
            </span>
            <span style={{ fontSize: '1.1rem' }}>🩸</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FBBF24', margin: '6px 0 2px' }}>
            {overview?.pendingCollectionsCount ?? orders.filter((o) => o.status === 'SAMPLE_REQUIRED' || o.status === 'ORDERED').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 600 }}>
            Phlebotomy queue & vacutainers
          </div>
        </Card>

        {/* 3. In-Analyzer Processing */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={() => {
            setStatusFilter('ANALYZING');
            triggerToast('Filtered: In-analyzer processing tests');
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              In Analyzer
            </span>
            <span style={{ fontSize: '1.1rem' }}>⚙️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60A5FA', margin: '6px 0 2px' }}>
            {overview?.processingCount ?? orders.filter((o) => o.status === 'PROCESSING' || o.status === 'SAMPLE_COLLECTED').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#93C5FD', fontWeight: 600 }}>
            Biochemistry & Hematology run
          </div>
        </Card>

        {/* 4. Critical Panic Results */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            borderColor: (overview?.criticalResultsCount ?? criticalOrders.length) > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined,
            backgroundColor: (overview?.criticalResultsCount ?? criticalOrders.length) > 0 ? 'rgba(239, 68, 68, 0.08)' : undefined
          }}
          onClick={() => {
            setStatusFilter('CRITICAL');
            triggerToast('Filtered: Critical panic result orders');
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 700, textTransform: 'uppercase' }}>
              Panic Results
            </span>
            <span style={{ fontSize: '1.1rem' }}>🚨</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#EF4444', margin: '6px 0 2px' }}>
            {overview?.criticalResultsCount ?? criticalOrders.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#FCA5A5', fontWeight: 600 }}>
            Mandatory doctor notification
          </div>
        </Card>

        {/* 5. Awaiting Pathologist Verification */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={() => {
            setStatusFilter('READY');
            triggerToast('Filtered: Awaiting pathologist verification');
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              Pending Sign-off
            </span>
            <span style={{ fontSize: '1.1rem' }}>📜</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#C084FC', margin: '6px 0 2px' }}>
            {overview?.awaitingVerificationCount ?? orders.filter((o) => o.status === 'RESULT_READY').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#D8B4FE', fontWeight: 600 }}>
            Digital signature needed
          </div>
        </Card>

        {/* 6. Reports Dispatched */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={() => {
            setStatusFilter('COMPLETED');
            triggerToast('Filtered: Completed and verified reports');
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              Reports Dispatched
            </span>
            <span style={{ fontSize: '1.1rem' }}>📲</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34D399', margin: '6px 0 2px' }}>
            {overview?.completedInvestigationsCount ?? orders.filter((o) => o.status === 'VERIFIED' || o.status === 'REVIEWED').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#6EE7B7', fontWeight: 600 }}>
            Sent via WhatsApp / Printed
          </div>
        </Card>
      </div>

      {/* Main Activity Workstation: Split Layout (Today's Specimen Queue + Recent Activity Feed) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Today's Specimen & Investigation Queue */}
        <div
          className="ds-glass-panel"
          style={{
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(18, 24, 38, 0.75)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Table Header & Search Filter Bar */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Today's Specimen & Investigation Queue
                </span>
                <Badge variant="neutral">{filteredOrders.length} items</Badge>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Live laboratory intake, barcode tracking, and testing status
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {(['ALL', 'PENDING', 'ANALYZING', 'CRITICAL', 'READY', 'COMPLETED'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setStatusFilter(filterKey)}
                  style={{
                    backgroundColor: statusFilter === filterKey ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: statusFilter === filterKey ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: statusFilter === filterKey ? '#D8B4FE' : '#94A3B8',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', backgroundColor: 'rgba(255, 255, 255, 0.015)' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <span style={{ position: 'absolute', left: '10px', top: '8px', fontSize: '0.8rem', color: '#64748B' }}>🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, accession number, barcode or specimen type..."
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '7px 10px 7px 32px',
                  color: '#F8FAFC',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Table Body */}
          <TableContainer style={{ maxHeight: '440px', overflowY: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ fontSize: '0.72rem', color: '#94A3B8' }}>ACCESSION # / BARCODE</TableHead>
                  <TableHead style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PATIENT</TableHead>
                  <TableHead style={{ fontSize: '0.72rem', color: '#94A3B8' }}>SPECIMEN / INVESTIGATION</TableHead>
                  <TableHead style={{ fontSize: '0.72rem', color: '#94A3B8' }}>STATUS</TableHead>
                  <TableHead style={{ fontSize: '0.72rem', color: '#94A3B8', textAlign: 'right' }}>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                      Loading live pathology telemetry...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                      No diagnostic orders matching the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const isCrit = order.isCritical;
                    const statusColor =
                      order.status === 'VERIFIED' || order.status === 'REVIEWED'
                        ? 'success'
                        : order.status === 'RESULT_READY'
                        ? 'primary'
                        : isCrit
                        ? 'critical'
                        : order.status === 'PROCESSING'
                        ? 'info'
                        : 'warning';

                    return (
                      <TableRow
                        key={order.id}
                        style={{
                          backgroundColor: isCrit ? 'rgba(239, 68, 68, 0.05)' : undefined,
                          transition: 'background-color 0.12s ease'
                        }}
                      >
                        <TableCell>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8', fontSize: '0.78rem' }}>
                            {order.specimens?.[0]?.accessionNumber || order.orderNumber}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                            {new Date(order.orderedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.8rem' }}>
                            {order.patientName || 'Anonymous Walk-In'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                            MRN: {order.patientMrn || 'N/A'} • {order.orderingDoctorName || 'OPD Doctor'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div style={{ fontWeight: 600, color: '#E2E8F0', fontSize: '0.78rem' }}>
                            {order.specimenType || 'Venous Blood'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#A855F7' }}>
                            {order.priority === 'STAT' ? '⚡ STAT / URGENT' : 'Routine'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={statusColor as any} style={{ fontSize: '0.68rem' }}>
                            {isCrit ? '🚨 CRITICAL PANIC' : order.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>

                        <TableCell style={{ textAlign: 'right' }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onNavigateModule('clinical-investigation');
                            }}
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderColor: 'rgba(168, 85, 247, 0.35)',
                              color: '#D8B4FE'
                            }}
                          >
                            Open in LIMS ➔
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Right Column: Recent Activity Feed & Analyzer Hardware Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Recent Lab Activities Feed */}
          <div
            className="ds-glass-panel"
            style={{
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(18, 24, 38, 0.75)',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Recent Lab Activities
                </span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Live Audit Trace</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
              {auditTraces.length > 0 ? (
                auditTraces.slice(0, 6).map((trace) => (
                  <div
                    key={trace.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#38BDF8' }}>{trace.action.replace(/_/g, ' ')}</span>
                      <span style={{ color: '#64748B', fontSize: '0.68rem' }}>
                        {new Date(trace.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ color: '#CBD5E1', fontSize: '0.72rem' }}>
                      {trace.justification || `Action performed on ${trace.targetEntity} (${trace.targetEntityId})`}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                      Actor: {trace.actorRole}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '0.75rem' }}>
                  No recent activity records found in this audit window.
                </div>
              )}
            </div>
          </div>

          {/* Analyzer Hardware Interface Status */}
          <div
            className="ds-glass-panel"
            style={{
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(18, 24, 38, 0.75)',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF' }}>
                Diagnostic Analyzers & Gateways
              </span>
              <Badge variant="neutral" style={{ fontSize: '0.65rem' }}>ASTM / HL7</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Sysmex XN-550', type: 'Hematology Cell Counter', status: 'ONLINE', latency: '4ms' },
                { name: 'Roche Cobas c311', type: 'Clinical Chemistry', status: 'ONLINE', latency: '12ms' },
                { name: 'Microscope AI Lens', type: 'Peripheral Smear Scribe', status: 'STANDBY', latency: 'Local' }
              ].map((hw) => (
                <div
                  key={hw.name}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.75rem' }}>{hw.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{hw.type}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: hw.status === 'ONLINE' ? '#34D399' : '#A855F7', fontWeight: 700 }}>
                      ● {hw.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.68rem', color: '#64748B', lineHeight: '1.4' }}>
              Hardware interface engine handles direct TCP/RS232 bidirectional query-broadcast with auto-accession matching.
            </div>
          </div>

        </div>
      </div>

      {/* Microscope AI Eyepiece Scanner Modal */}
      {isMicroscopeModalOpen && (
        <MicroscopeEyepieceScannerModal
          isOpen={isMicroscopeModalOpen}
          onClose={() => setIsMicroscopeModalOpen(false)}
          onCommitSmearResults={handleCommitMicroscopeReport}
          patientName="Walk-in Hematology Specimen"
          patientMrn="MRN-SMEAR-01"
          orderNumber="ORD-AI-9021"
        />
      )}
    </div>
  );
};
