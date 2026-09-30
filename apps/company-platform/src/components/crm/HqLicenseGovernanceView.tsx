import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import { HqLicenseKeyGeneratorModal } from './HqLicenseKeyGeneratorModal.js';

export interface BoundNodeSeat {
  nodeId: string;
  deviceName: string;
  machineFingerprint: string;
  platform?: string;
  hostname?: string;
  primaryMac?: string;
  boundAt: string;
  lastHeartbeatAt: string;
  status: 'ACTIVE' | 'BOUND' | 'SUSPENDED' | 'REVOKED';
}

export interface LicenseItem {
  id: string;
  licenseKey: string;
  tenantId: string;
  partnerId: string;
  subscriptionId?: string;
  planId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'GRACE_PERIOD';
  licenseType: string;
  maxDoctors?: number;
  maxBranches?: number;
  maxConcurrentUsers?: number;
  startDate?: string;
  expiryDate?: string;
  gracePeriodEnd?: string;
  signature?: string;
  metadata?: {
    machineFingerprint?: string;
    tenantName?: string;
    planTier?: string;
    features?: string[];
    maxSeats?: number;
    boundNodes?: BoundNodeSeat[];
    auditTrail?: Array<{ action: string; target?: string; reason?: string; timestamp: string }>;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const HqLicenseGovernanceView: React.FC = () => {
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState<boolean>(false);
  const [selectedLicenseForSeats, setSelectedLicenseForSeats] = useState<LicenseItem | null>(null);

  // New seat binding form state
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceFp, setNewDeviceFp] = useState('');
  const [isBindingSeat, setIsBindingSeat] = useState(false);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch('/api/v1/company/licenses', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLicenses(json.data);
          // Update selected license if seat modal is open
          if (selectedLicenseForSeats) {
            const updated = json.data.find((l: LicenseItem) => l.id === selectedLicenseForSeats.id);
            if (updated) setSelectedLicenseForSeats(updated);
          }
        }
      } else {
        setActionMessage({ type: 'error', text: 'Failed to fetch licenses from API Gateway.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Network error fetching licenses.' });
    } finally {
      setLoading(false);
    }
  }, [selectedLicenseForSeats]);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleRenew = async (id: string, extensionDays = 365) => {
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/company/licenses/${id}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ extensionDays })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage({ type: 'success', text: `License extended by ${extensionDays} days and HMAC re-signed successfully!` });
        await fetchLicenses();
      } else {
        setActionMessage({ type: 'error', text: json?.error?.message || 'Failed to renew license.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error renewing license.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevoke = async (id: string) => {
    const reason = window.prompt(
      'Are you sure you want to engage the REMOTE KILL-SWITCH for this partner?\nEnter revocation reason:',
      'License suspended by DOC SEARCH HQ Command'
    );
    if (reason === null) return;

    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/company/licenses/${id}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage({ type: 'success', text: 'REMOTE KILL-SWITCH EXECUTED: License status set to REVOKED and all active tenant sessions invalidated!' });
        await fetchLicenses();
      } else {
        setActionMessage({ type: 'error', text: json?.error?.message || 'Failed to revoke license.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error executing kill-switch.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/company/licenses/${id}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage({ type: 'success', text: 'License reactivated successfully with renewed HMAC signature.' });
        await fetchLicenses();
      } else {
        setActionMessage({ type: 'error', text: json?.error?.message || 'Failed to reactivate license.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error reactivating license.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVerify = async (id: string) => {
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/company/licenses/${id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const sigValid = json.data?.isSignatureValid;
        const evalStatus = json.data?.evaluation?.status;
        setActionMessage({
          type: sigValid ? 'success' : 'error',
          text: `Cryptographic Signature: ${sigValid ? '✓ AUTHENTIC & TAMPER-PROOF' : '⚠️ SIGNATURE MISMATCH'} • Status: ${evalStatus}`
        });
      } else {
        setActionMessage({ type: 'error', text: json?.error?.message || 'Failed to verify signature.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error verifying license signature.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExportLicFile = async (lic: LicenseItem) => {
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/company/licenses/${lic.id}/export-file`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        setActionMessage({ type: 'error', text: 'Failed to download air-gapped license package.' });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `docsearch-license-${lic.licenseKey}.lic`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setActionMessage({ type: 'success', text: `Downloaded air-gapped package: docsearch-license-${lic.licenseKey}.lic` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error downloading license file.' });
    }
  };

  const handleBindSeat = async () => {
    if (!selectedLicenseForSeats || !newDeviceFp.trim()) return;
    setIsBindingSeat(true);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/company/licenses/${selectedLicenseForSeats.id}/nodes/bind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          deviceName: newDeviceName.trim() || 'Workstation Terminal',
          machineFingerprint: newDeviceFp.trim().toUpperCase()
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setNewDeviceName('');
        setNewDeviceFp('');
        setActionMessage({ type: 'success', text: json.message || 'Seat bound successfully!' });
        await fetchLicenses();
      } else {
        setActionMessage({ type: 'error', text: json?.error?.message || json?.message || 'Failed to bind seat.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error binding seat.' });
    } finally {
      setIsBindingSeat(false);
    }
  };

  const handleUnbindSeat = async (nodeIdOrFp: string) => {
    if (!selectedLicenseForSeats) return;
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/company/licenses/${selectedLicenseForSeats.id}/nodes/unbind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ nodeIdOrFp })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage({ type: 'success', text: `Seat ${nodeIdOrFp} successfully released.` });
        await fetchLicenses();
      } else {
        setActionMessage({ type: 'error', text: json?.error?.message || 'Failed to unbind seat.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error unbinding seat.' });
    }
  };

  const handleRevokeSeat = async (nodeId: string) => {
    if (!selectedLicenseForSeats) return;
    if (!window.confirm(`Are you sure you want to REVOKE terminal seat ${nodeId}?`)) return;
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/company/licenses/${selectedLicenseForSeats.id}/nodes/${nodeId}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason: 'Revoked by HQ Command' })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage({ type: 'success', text: `Seat ${nodeId} REVOKED.` });
        await fetchLicenses();
      } else {
        setActionMessage({ type: 'error', text: json?.error?.message || 'Failed to revoke seat.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error revoking seat.' });
    }
  };

  const calculateDaysRemaining = (expiryDate?: string) => {
    if (!expiryDate) return { text: 'Perpetual', isNear: false, isExpired: false };
    const diff = new Date(expiryDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: `Expired (${Math.abs(days)}d ago)`, isNear: false, isExpired: true };
    if (days <= 15) return { text: `${days} days (Grace/Urgent)`, isNear: true, isExpired: false };
    return { text: `${days} days remaining`, isNear: false, isExpired: false };
  };

  const filteredLicenses = licenses.filter((lic) => {
    if (statusFilter !== 'ALL' && lic.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const name = lic.metadata?.tenantName?.toLowerCase() || '';
      const key = lic.licenseKey?.toLowerCase() || '';
      const plan = lic.metadata?.planTier?.toLowerCase() || lic.planId?.toLowerCase() || '';
      const fp = lic.metadata?.machineFingerprint?.toLowerCase() || '';
      const nodes = lic.metadata?.boundNodes?.map(n => `${n.deviceName} ${n.machineFingerprint}`).join(' ').toLowerCase() || '';
      return name.includes(q) || key.includes(q) || plan.includes(q) || fp.includes(q) || nodes.includes(q);
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">ACTIVE</Badge>;
      case 'GRACE_PERIOD':
        return <Badge variant="warning">GRACE PERIOD</Badge>;
      case 'SUSPENDED':
        return <Badge variant="warning">SUSPENDED</Badge>;
      case 'REVOKED':
        return <Badge variant="danger">REVOKED</Badge>;
      case 'EXPIRED':
        return <Badge variant="danger">EXPIRED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // KPI calculations
  const totalIssued = licenses.length;
  const activeCount = licenses.filter(l => l.status === 'ACTIVE').length;
  const graceCount = licenses.filter(l => l.status === 'GRACE_PERIOD').length;
  const revokedCount = licenses.filter(l => l.status === 'REVOKED' || l.status === 'EXPIRED').length;
  const totalSeatsBound = licenses.reduce((sum, l) => sum + (l.metadata?.boundNodes?.filter(n => n.status === 'ACTIVE').length || 1), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>🔐</span>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>
              Partner License & Cryptographic Node-Lock HQ Command
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '0.875rem' }}>
            Central authority for multi-device terminal allocation, HMAC verification, air-gapped packages, and remote kill-switch execution.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" size="sm" onClick={fetchLicenses} disabled={loading}>
            🔄 Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsGeneratorModalOpen(true)}>
            ➕ Issue / Node-Lock New License
          </Button>
        </div>
      </div>

      {/* 5-Stage Serial Pipeline Stepper Visualizer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '14px'
        }}
      >
        <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 800 }}>STAGE 1 • DISCOVERY</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>🖥️ Hardware Fingerprint</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>OS UUID + CPU + Primary MAC</div>
        </div>

        <div style={{ padding: '10px', background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.7rem', color: '#818CF8', fontWeight: 800 }}>STAGE 2 • PROVISIONING</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>🏢 Multi-Seat Allocation</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>Seat Quotas, Doctors & Branches</div>
        </div>

        <div style={{ padding: '10px', background: 'rgba(192, 132, 252, 0.08)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.7rem', color: '#C084FC', fontWeight: 800 }}>STAGE 3 • ISSUANCE</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>🔒 Digital Signature</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>HMAC Token & Air-Gapped .lic</div>
        </div>

        <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 800 }}>STAGE 4 • TELEMETRY</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>⏱️ Dynamic Heartbeat</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>Anti-Rollback Monotonic Defense</div>
        </div>

        <div style={{ padding: '10px', background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.7rem', color: '#F87171', fontWeight: 800 }}>STAGE 5 • CONTROL</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>🚫 Remote Kill-Switch</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>Instant Revoke & 1-Click Renew</div>
        </div>
      </div>

      {/* Action Notification Strip */}
      {actionMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            backgroundColor: actionMessage.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${actionMessage.type === 'success' ? '#22C55E' : '#EF4444'}`,
            color: actionMessage.type === 'success' ? '#86EFAC' : '#FCA5A5'
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <Card>
          <div style={{ padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Total Issued</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px' }}>{totalIssued}</div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#22C55E', textTransform: 'uppercase', fontWeight: 700 }}>Active Licenses</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22C55E', marginTop: '4px' }}>{activeCount}</div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#38BDF8', textTransform: 'uppercase', fontWeight: 700 }}>Active Terminals</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>{totalSeatsBound} Seats</div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#F59E0B', textTransform: 'uppercase', fontWeight: 700 }}>In Grace Period</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>{graceCount}</div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#EF4444', textTransform: 'uppercase', fontWeight: 700 }}>Revoked / Killed</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>{revokedCount}</div>
          </div>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <Card>
        <div style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <Input
              placeholder="Search by Partner, License Key, Plan Tier, Device Seat, or Fingerprint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ width: '180px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active Only' },
                { value: 'GRACE_PERIOD', label: 'Grace Period' },
                { value: 'REVOKED', label: 'Revoked' },
                { value: 'EXPIRED', label: 'Expired' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Licenses Matrix Table */}
      <Card>
        <div style={{ padding: '16px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              Loading cryptographic license ledger...
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              No commercial licenses found matching filter criteria.
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner & Facility</TableHead>
                    <TableHead>License Key & Seats</TableHead>
                    <TableHead>Plan & Entitlements</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry & Countdown</TableHead>
                    <TableHead>HQ Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicenses.map((lic) => {
                    const days = calculateDaysRemaining(lic.expiryDate);
                    const isBusy = actionLoadingId === lic.id;
                    const maxSeats = lic.metadata?.maxSeats || 5;
                    const boundNodes = lic.metadata?.boundNodes || [];
                    const activeSeats = boundNodes.filter(n => n.status === 'ACTIVE').length;

                    return (
                      <TableRow key={lic.id}>
                        <TableCell>
                          <div style={{ fontWeight: 700, color: '#F8FAFC' }}>
                            {lic.metadata?.tenantName || 'Authorized Partner Clinic'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>
                            Tenant: {lic.tenantId?.slice(0, 13)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8' }}>
                            {lic.licenseKey}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '3px' }}>
                            <span style={{ color: activeSeats > 0 ? '#34D399' : '#FCD34D', fontWeight: 700 }}>
                              💻 {activeSeats} / {maxSeats} Seats Bound
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 600, color: '#E2E8F0' }}>
                            {lic.metadata?.planTier || lic.planId}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            Doctors: <strong>{lic.maxDoctors ?? 5}</strong> • Branches: <strong>{lic.maxBranches ?? 1}</strong>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(lic.status)}</TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 600, color: days.isExpired ? '#EF4444' : (days.isNear ? '#F59E0B' : '#F8FAFC') }}>
                            {days.text}
                          </div>
                          {lic.expiryDate && (
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              Expires: {new Date(lic.expiryDate).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleVerify(lic.id)}
                              title="Verify Cryptographic HMAC Signature"
                            >
                              🔍 Verify
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLicenseForSeats(lic)}
                              title="Manage hardware seats & bound terminals"
                              style={{ borderColor: '#38BDF8', color: '#38BDF8' }}
                            >
                              💻 Seats ({activeSeats}/{maxSeats})
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleExportLicFile(lic)}
                              title="Download air-gapped .lic package file"
                            >
                              📥 .lic File
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleRenew(lic.id, 365)}
                              title="Extend license validity by 365 days"
                            >
                              🔄 Renew (+1y)
                            </Button>

                            {lic.status === 'ACTIVE' ? (
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleRevoke(lic.id)}
                                title="Execute remote kill-switch immediately"
                              >
                                🚫 Kill-Switch
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleReactivate(lic.id)}
                                title="Reactivate license"
                              >
                                ✅ Reactivate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </Card>

      {/* Multi-Seat Device Allocation Modal */}
      {selectedLicenseForSeats && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1.5px solid #334155',
              borderRadius: '16px',
              maxWidth: '750px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                  💻 Device Seats & Hardware Terminals Governance
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  Partner: <strong style={{ color: '#38BDF8' }}>{selectedLicenseForSeats.metadata?.tenantName}</strong> • License: <code style={{ color: '#A7F3D0' }}>{selectedLicenseForSeats.licenseKey}</code>
                </p>
              </div>
              <button
                onClick={() => setSelectedLicenseForSeats(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', color: '#94A3B8', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              {/* Seat Quota Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F172A', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Authorized Terminal Capacity:</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {(selectedLicenseForSeats.metadata?.boundNodes || []).filter(n => n.status === 'ACTIVE').length} / {selectedLicenseForSeats.metadata?.maxSeats || 5} Seats Bound
                  </div>
                </div>
                <Badge variant={selectedLicenseForSeats.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {selectedLicenseForSeats.status}
                </Badge>
              </div>

              {/* Bound Terminals List */}
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 700 }}>
                  Bound Physical Terminals
                </h4>
                {(!selectedLicenseForSeats.metadata?.boundNodes || selectedLicenseForSeats.metadata.boundNodes.length === 0) ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', background: '#0F172A', borderRadius: '8px' }}>
                    No hardware terminals bound yet. Add a workstation seat below or activate locally.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedLicenseForSeats.metadata.boundNodes.map((node) => (
                      <div
                        key={node.nodeId || node.machineFingerprint}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: node.status === 'REVOKED' ? 'rgba(239, 68, 68, 0.1)' : '#0F172A',
                          border: `1px solid ${node.status === 'REVOKED' ? '#EF4444' : '#334155'}`
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.85rem' }}>
                            {node.deviceName || 'Terminal Desk'}
                            {node.hostname && <span style={{ color: '#94A3B8', fontWeight: 400, marginLeft: '6px' }}>({node.hostname})</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontFamily: 'monospace', marginTop: '2px' }}>
                            Node ID: {node.machineFingerprint}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                            Last Heartbeat: {node.lastHeartbeatAt ? new Date(node.lastHeartbeatAt).toLocaleTimeString() : 'Pending'} • Bound: {new Date(node.boundAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Badge variant={node.status === 'ACTIVE' ? 'success' : 'danger'}>
                            {node.status}
                          </Badge>
                          {node.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleRevokeSeat(node.nodeId || node.machineFingerprint)}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid #EF4444',
                                color: '#FCA5A5',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              🚫 Revoke Seat
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUnbindSeat(node.nodeId || node.machineFingerprint)}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #475569',
                              color: '#94A3B8',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                          >
                            Release
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add / Bind Device Seat Form */}
              <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#38BDF8', fontWeight: 700 }}>
                  ➕ Bind New Physical Hardware Seat
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>
                      Device Label (e.g. OPD Desk 2)
                    </label>
                    <input
                      type="text"
                      placeholder="Doctor Consultation Desk 1"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>
                      Terminal Node ID (MPR-XXXX-XXXX-XXXX) *
                    </label>
                    <input
                      type="text"
                      placeholder="MPR-XXXX-XXXX-XXXX"
                      value={newDeviceFp}
                      onChange={(e) => setNewDeviceFp(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', backgroundColor: '#0F172A', border: '1px solid #38BDF8', color: '#38BDF8', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isBindingSeat || !newDeviceFp.trim()}
                    onClick={handleBindSeat}
                    style={{ height: '36px' }}
                  >
                    {isBindingSeat ? 'Binding...' : 'Bind Seat'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="sm" variant="outline" onClick={() => setSelectedLicenseForSeats(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Generator Modal */}
      {isGeneratorModalOpen && (
        <HqLicenseKeyGeneratorModal
          isOpen={isGeneratorModalOpen}
          onClose={() => {
            setIsGeneratorModalOpen(false);
            fetchLicenses();
          }}
        />
      )}
    </div>
  );
};
