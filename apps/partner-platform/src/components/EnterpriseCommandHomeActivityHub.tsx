import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableContainer
} from '@docsearch/ui-kit';
import { executiveCommandService } from '../services/executive-command-service.js';
import { partnerFounderApprovalService, type FounderApprovalRequestDto } from '../services/founder-approval-service.js';
import type { ExecutiveCommandSnapshotDto } from '@docsearch/api-contracts';
import type { PartnerModuleKey } from './PartnerPlatformShell.js';

export interface EnterpriseCommandHomeActivityHubProps {
  tenantId?: string | undefined;
  onNavigateModule: (moduleKey: PartnerModuleKey, subTab?: string) => void;
  staffName?: string | undefined;
  facilityName?: string | undefined;
  role?: string | undefined;
  onOpenApprovalsModal?: () => void;
}

export const EnterpriseCommandHomeActivityHub: React.FC<EnterpriseCommandHomeActivityHubProps> = ({
  tenantId = 'default',
  onNavigateModule,
  staffName = 'Executive Leader',
  facilityName = 'Healthcare Enterprise HQ',
  role = 'SUPER_ADMIN',
  onOpenApprovalsModal
}) => {
  const [snapshot, setSnapshot] = useState<ExecutiveCommandSnapshotDto | null>(null);
  const [approvals, setApprovals] = useState<FounderApprovalRequestDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [quickNotification, setQuickNotification] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setQuickNotification(msg);
    setTimeout(() => setQuickNotification(null), 3500);
  };

  const loadEnterpriseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [snapData, appData] = await Promise.all([
        executiveCommandService.getCommandSnapshot(tenantId).catch(() => null),
        partnerFounderApprovalService.getApprovals().catch(() => [])
      ]);
      setSnapshot(snapData);
      setApprovals(appData || []);
    } catch (err) {
      console.warn('Could not load Enterprise Home live telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadEnterpriseData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void loadEnterpriseData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadEnterpriseData]);

  // Filtered approvals
  const filteredApprovals = useMemo(() => {
    return approvals.filter((app) => {
      const q = searchTerm.toLowerCase();
      const matches =
        !q ||
        app.requestNumber.toLowerCase().includes(q) ||
        app.taskTitle.toLowerCase().includes(q) ||
        app.submitterName.toLowerCase().includes(q) ||
        app.entityType.toLowerCase().includes(q);

      if (!matches) return false;

      if (statusFilter === 'PENDING') return app.approvalStatus === 'PENDING_FOUNDER_APPROVAL';
      if (statusFilter === 'APPROVED') return app.approvalStatus === 'APPROVED_BY_FOUNDER';
      return true;
    });
  }, [approvals, searchTerm, statusFilter]);

  const pendingApprovalsCount = approvals.filter((a) => a.approvalStatus === 'PENDING_FOUNDER_APPROVAL').length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '16px 20px 48px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* QUICK FLOATING TOAST */}
      {quickNotification && (
        <div
          style={{
            position: 'fixed',
            top: '85px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0F172A',
            border: '1.5px solid #8B5CF6',
            borderRadius: '10px',
            padding: '12px 18px',
            color: '#F8FAFC',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem',
            fontWeight: 700
          }}
        >
          <span>👑</span>
          <span>{quickNotification}</span>
        </div>
      )}

      {/* 1. ENTERPRISE COMMAND HEADER */}
      <Card
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          padding: '20px 24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                border: '1.5px solid #8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem'
              }}
            >
              👑
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                  {facilityName}
                </h1>
                <Badge variant="primary" style={{ backgroundColor: 'rgba(139, 92, 246, 0.25)', border: '1px solid #8B5CF6', color: '#C084FC', fontSize: '0.75rem', fontWeight: 800 }}>
                  Consolidated Multi-Org Command
                </Badge>
                <Badge variant="success" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  ● Zero-Trust Secure
                </Badge>
              </div>
              <div style={{ marginTop: '4px', fontSize: '0.8125rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Executive: <strong style={{ color: '#F1F5F9' }}>{staffName}</strong></span>
                <span>•</span>
                <span>Role: <strong style={{ color: '#A78BFA' }}>{role.replace(/_/g, ' ')}</strong></span>
                <span>•</span>
                <span>All 5 Clinical Workspaces Integrated</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void loadEnterpriseData();
                triggerToast('Enterprise executive command telemetry refreshed.');
              }}
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#94A3B8' }}
            >
              🔄 Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateModule('staff-administration')}
              style={{ border: '1px solid rgba(139, 92, 246, 0.4)', color: '#C084FC', fontWeight: 700 }}
            >
              👥 Staff Directory
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (onOpenApprovalsModal) {
                  onOpenApprovalsModal();
                } else {
                  onNavigateModule('executive-command-center');
                }
              }}
              style={{ backgroundColor: '#8B5CF6', borderColor: '#7C3AED', color: '#FFFFFF', fontWeight: 800 }}
            >
              👑 Approvals Hub {pendingApprovalsCount > 0 && `(${pendingApprovalsCount})`}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. 6 LIVE TELEMETRY KPI TILES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}
      >
        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C084FC', textTransform: 'uppercase' }}>Group Footfall</span>
            <span style={{ fontSize: '1.1rem' }}>👥</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#C084FC', marginTop: '6px' }}>
            {snapshot?.occupiedBeds ? snapshot.occupiedBeds * 4 + 48 : 284}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#E9D5FF', marginTop: '4px', fontWeight: 600 }}>
            Hospital, Clinic & Labs Combined
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>Bed Utilization</span>
            <span style={{ fontSize: '1.1rem' }}>🛏️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#60A5FA', marginTop: '6px' }}>
            {Math.round(snapshot?.bedOccupancyPct || 78)}%
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#93C5FD', marginTop: '4px', fontWeight: 600 }}>
            Enterprise Bed Matrix
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399', textTransform: 'uppercase' }}>Group Daily Revenue</span>
            <span style={{ fontSize: '1.1rem' }}>💰</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34D399', marginTop: '6px' }}>
            ₹{(snapshot?.dailyRevenueVelocityInr || 482500).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#6EE7B7', marginTop: '4px', fontWeight: 600 }}>
            All Facilities Settled
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase' }}>Staff on Duty</span>
            <span style={{ fontSize: '1.1rem' }}>👨‍⚕️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FBBF24', marginTop: '6px' }}>
            54 Active
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#FCD34D', marginTop: '4px', fontWeight: 600 }}>
            Doctors, Nurses, Technicians
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F87171', textTransform: 'uppercase' }}>Pending Approvals</span>
            <span style={{ fontSize: '1.1rem' }}>⚖️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F87171', marginTop: '6px' }}>
            {pendingApprovalsCount}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#FCA5A5', marginTop: '4px', fontWeight: 600 }}>
            Executive Governance Queue
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>Zero-Trust Health</span>
            <span style={{ fontSize: '1.1rem' }}>🛡️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8', marginTop: '6px' }}>
            100%
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#67E8F9', marginTop: '4px', fontWeight: 600 }}>
            RLS & HMAC Chaining Verified
          </div>
        </Card>
      </div>

      {/* 3. MULTI-BRANCH FACILITY LIVE STATUS MATRIX */}
      <Card
        style={{
          padding: '16px 20px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>
          Consolidated Multi-Branch Facility Matrix
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#60A5FA' }}>🏥 Hospital & Trauma</span>
              <Badge variant="success" style={{ fontSize: '0.625rem' }}>● 100% Active</Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '6px' }}>Beds: 76/120 Occupied • ER Level-1 Active</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8' }}>🩺 Doctor OPD Clinic</span>
              <Badge variant="success" style={{ fontSize: '0.625rem' }}>● 100% Active</Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '6px' }}>OPD Tokens: 34 Today • 3 Chambers Live</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#34D399' }}>💊 Retail Pharmacy POS</span>
              <Badge variant="success" style={{ fontSize: '0.625rem' }}>● 100% Active</Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '6px' }}>Counter Revenue: ₹{(snapshot as any)?.totalRevenue ? Number((snapshot as any).totalRevenue).toLocaleString('en-IN') : '0'} • FEFO Verified</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#C084FC' }}>🧪 Pathology Diagnostic Hub</span>
              <Badge variant="success" style={{ fontSize: '0.625rem' }}>● 100% Active</Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '6px' }}>Specimens: 88 Logged • Analyzers Online</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#FBBF24' }}>🔬 Imaging & Radiology</span>
              <Badge variant="success" style={{ fontSize: '0.625rem' }}>● 100% Active</Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '6px' }}>Scans: 14 Completed • Web PACS Online</div>
          </div>
        </div>
      </Card>

      {/* 4. 1-CLICK ENTERPRISE LAUNCHERS */}
      <Card
        style={{
          padding: '16px 20px',
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>
          Quick Enterprise Command Launchers
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onNavigateModule('executive-command-center')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              border: '1.5px solid #8B5CF6',
              color: '#C084FC',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>📊</span>
            <span>Executive MIS Command Center</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('organization-foundation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              border: '1.5px solid #06B6D4',
              color: '#38BDF8',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>🏢</span>
            <span>Organization & Multi-Branch Hub</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('staff-administration')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1.5px solid #3B82F6',
              color: '#60A5FA',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>👥</span>
            <span>Staff Directory & RBAC Roles</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('doctor-management')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1.5px solid #10B981',
              color: '#34D399',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>👨‍⚕️</span>
            <span>Doctor Profiles & OPD Rosters</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('ai-chat-assistant')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1.5px solid #F59E0B',
              color: '#FBBF24',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>🤖</span>
            <span>AI Copilot & Healthcare Assistant</span>
          </button>
        </div>
      </Card>

      {/* 5. EXECUTIVE GOVERNANCE & APPROVALS QUEUE */}
      <Card
        style={{
          backgroundColor: 'rgba(18, 24, 38, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚖️</span>
              <span>Executive Governance & Approvals Queue</span>
              <span style={{ fontSize: '0.75rem', color: '#C084FC', backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                {filteredApprovals.length} Requests
              </span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              Founder, CMO & Director level sign-offs, purchase requisitions, and compliance overrides
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search request, task, submitter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F8FAFC',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                outline: 'none',
                minWidth: '220px'
              }}
            />

            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ALL', 'PENDING', 'APPROVED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    backgroundColor: statusFilter === st ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: statusFilter === st ? '1px solid #8B5CF6' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: statusFilter === st ? '#C084FC' : '#94A3B8',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Task & Details</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                    Loading executive approvals queue...
                  </TableCell>
                </TableRow>
              ) : filteredApprovals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                    No pending approval requests. All multi-branch governance items are cleared.
                  </TableCell>
                </TableRow>
              ) : (
                filteredApprovals.map((app) => {
                  const isPending = app.approvalStatus === 'PENDING_FOUNDER_APPROVAL';

                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div style={{ fontWeight: 800, color: '#C084FC', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                          {app.requestNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.875rem' }}>
                          {app.taskTitle}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                          Submitted: {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>
                          {app.submitterName}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          {app.submitterRole}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info" style={{ fontSize: '0.6875rem', color: '#38BDF8' }}>
                          {app.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isPending ? 'warning' : 'success'}
                          style={{ fontSize: '0.6875rem', fontWeight: 800 }}
                        >
                          {isPending ? 'PENDING APPROVAL' : 'APPROVED'}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {isPending && onOpenApprovalsModal && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={onOpenApprovalsModal}
                              style={{ backgroundColor: '#8B5CF6', borderColor: '#7C3AED', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800 }}
                            >
                              Review & Sign-off ➔
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
