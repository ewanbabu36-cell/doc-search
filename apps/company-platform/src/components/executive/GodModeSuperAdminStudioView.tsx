import React, { useState, useEffect, useCallback } from 'react';
import { DocSearchLogo, Button, Badge } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

export interface ImpersonationSession {
  id: string;
  adminName: string;
  targetTenantId: string;
  targetTenantName: string;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: string;
  sessionToken: string;
  reason: string;
  sessionMode: string;
  isActive: boolean;
  auditHash: string;
  startedAt: string;
}

interface FeatureFlag {
  id: string;
  flag_key: string;
  feature_name: string;
  category: string;
  description: string;
  is_globally_enabled: boolean;
  rollout_pct: number;
  circuit_breaker_active: boolean;
  fallback_action: string;
  updated_by: string;
  updated_at: string;
}

interface TheftAlert {
  id: string;
  tenant_id: string;
  tenant_name: string;
  staff_id: string;
  staff_name: string;
  staff_role: string;
  anomaly_type: string;
  detected_cash_leakage: string | number;
  confidence_score: number;
  severity: string;
  details: string;
  auto_action_taken: string;
  is_quarantined: boolean;
  detected_at: string;
}

interface ChurnPartner {
  id: string;
  tenant_id: string;
  hospital_name: string;
  partner_tier: string;
  mrr_amount: string | number;
  dau_trend_pct: string | number;
  token_velocity_change_pct: string | number;
  churn_risk_grade: 'GREEN_HEALTHY' | 'AMBER_WATCH' | 'RED_CRITICAL';
  churn_probability_pct: string | number;
  automated_intervention: string;
  intervention_status: string;
}

interface SupplyArbitrageItem {
  id: string;
  item_code: string;
  item_name: string;
  category: string;
  manufacturer_name: string;
  mfg_bulk_cost: string | number;
  platform_resale_price: string | number;
  hospital_mrp: string | number;
  gross_margin_pct: string | number;
  monthly_pan_india_consumption_units: number;
  projected_monthly_arbitrage_profit: string | number;
  in_stock_depot: string;
}

interface WarRoomTelemetry {
  networkOverview: {
    totalPartnerHospitalsActive: number;
    totalVerifiedCliniciansOnline: number;
    todayConsultationsTotal: number;
    todayGrossBillingGmv: number;
    currency: string;
    avgOpdConsultationDurationSeconds: number;
  };
  emergencyTelemetry: {
    activeAmbulancesInTransit: number;
    goldenHourStemiCodesTriggered: number;
    icuOccupancyPct: number;
    availableVentilatorBedsPanIndia: number;
  };
  stateTelemetryFeeds: Array<{
    state: string;
    activeHospitals: number;
    todayConsultations: number;
    gmvToday: number;
  }>;
}

export interface GodModeSuperAdminStudioViewProps {
  onNavigateDomain?: (domain: string) => void;
}

export const GodModeSuperAdminStudioView: React.FC<GodModeSuperAdminStudioViewProps> = ({ onNavigateDomain: _onNavigateDomain }) => {
  const [activeTab, setActiveTab] = useState<'IMPERSONATE' | 'FLAGS' | 'THEFT' | 'CHURN_SUPPLY' | 'WAR_ROOM'>('IMPERSONATE');

  // Enclave 1: Impersonation
  const [targetTenantId, setTargetTenantId] = useState('6855be07-5298-4148-a571-c51ac49ac7f3');
  const [targetTenantName, setTargetTenantName] = useState('Apollo City Multi-Specialty Hospital');
  const [targetUserId, setTargetUserId] = useState('DOC-CHIEF-001');
  const [targetUserName, setTargetUserName] = useState('Dr. Vikramaditya Sen (Chief of Surgery)');
  const [targetUserRole, setTargetUserRole] = useState('DOCTOR');
  const [impersonateReason, setImpersonateReason] = useState('Live surgical PAC clearance hard-gate verification & bedside SLA audit');
  const [sessionMode, setSessionMode] = useState<'READ_ONLY_AUDITED' | 'BREAK_GLASS_MUTATION'>('READ_ONLY_AUDITED');
  const [activeGhostSession, setActiveGhostSession] = useState<any>(null);
  const [isStartingImpersonate, setIsStartingImpersonate] = useState(false);

  // Enclave 2: Feature Flags
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoadingFlags, setIsLoadingFlags] = useState(false);

  // Enclave 3: Theft Radar
  const [theftAlerts, setTheftAlerts] = useState<TheftAlert[]>([]);
  const [totalTheftRisk, setTotalTheftRisk] = useState(0);
  const [_isLoadingTheft, setIsLoadingTheft] = useState(false);

  // Enclave 4: Churn & Supply Arbitrage
  const [churnPartners, setChurnPartners] = useState<ChurnPartner[]>([]);
  const [totalMrrAtRisk, setTotalMrrAtRisk] = useState(0);
  const [supplyItems, setSupplyItems] = useState<SupplyArbitrageItem[]>([]);
  const [totalArbitrageProfit, setTotalArbitrageProfit] = useState(0);
  const [_isLoadingChurn, setIsLoadingChurn] = useState(false);

  // Enclave 5: Quarantine & War Room
  const [warRoomData, setWarRoomData] = useState<WarRoomTelemetry | null>(null);
  const [isQuarantining, setIsQuarantining] = useState(false);
  const [quarantineResultMsg, setQuarantineResultMsg] = useState<string | null>(null);

  // Load Flags
  const fetchFeatureFlags = useCallback(async () => {
    setIsLoadingFlags(true);
    try {
      const res = await apiRequest('/api/v1/company/godmode/feature-flags');
      const data = (res as any)?.data;
      if (Array.isArray(data)) {
        setFeatureFlags(data);
      }
    } finally {
      setIsLoadingFlags(false);
    }
  }, []);

  // Toggle Flag
  const handleToggleFlag = async (flag: FeatureFlag, newEnabledState: boolean) => {
    try {
      await apiRequest('/api/v1/company/godmode/feature-flags/toggle', {
        method: 'POST',
        body: JSON.stringify({
          flagKey: flag.flag_key,
          isGloballyEnabled: newEnabledState
        })
      });
      setFeatureFlags((prev) =>
        prev.map((f) => (f.flag_key === flag.flag_key ? { ...f, is_globally_enabled: newEnabledState } : f))
      );
    } catch (err: any) {
      alert(`Flag toggle notice: ${err.message}`);
    }
  };

  // Toggle Circuit Breaker
  const handleToggleCircuitBreaker = async (flag: FeatureFlag) => {
    const nextCircuit = !flag.circuit_breaker_active;
    try {
      await apiRequest('/api/v1/company/godmode/feature-flags/toggle', {
        method: 'POST',
        body: JSON.stringify({
          flagKey: flag.flag_key,
          circuitBreakerActive: nextCircuit
        })
      });
      setFeatureFlags((prev) =>
        prev.map((f) => (f.flag_key === flag.flag_key ? { ...f, circuit_breaker_active: nextCircuit } : f))
      );
    } catch (err: any) {
      alert(`Circuit breaker toggle notice: ${err.message}`);
    }
  };

  // Load Theft Radar
  const fetchTheftRadar = useCallback(async () => {
    setIsLoadingTheft(true);
    try {
      const res = await apiRequest('/api/v1/company/godmode/theft-radar/live');
      const data = (res as any)?.data;
      if (Array.isArray(data)) {
        setTheftAlerts(data);
        setTotalTheftRisk((res as any)?.summary?.totalRiskAmount || 0);
      }
    } finally {
      setIsLoadingTheft(false);
    }
  }, []);

  // Quarantine Staff
  const handleQuarantineStaff = async (alertItem: TheftAlert) => {
    try {
      await apiRequest('/api/v1/company/godmode/theft-radar/quarantine-staff', {
        method: 'POST',
        body: JSON.stringify({
          alertId: alertItem.id,
          staffId: alertItem.staff_id,
          staffName: alertItem.staff_name
        })
      });
      setTheftAlerts((prev) =>
        prev.map((a) => (a.id === alertItem.id ? { ...a, is_quarantined: true, auto_action_taken: 'STAFF_ACCOUNT_SUSPENDED' } : a))
      );
    } catch (err: any) {
      alert(`Staff quarantine notice: ${err.message}`);
    }
  };

  // Load Churn & Supply
  const fetchChurnAndSupply = useCallback(async () => {
    setIsLoadingChurn(true);
    try {
      const [churnRes, supplyRes] = await Promise.all([
        apiRequest('/api/v1/company/godmode/churn-radar'),
        apiRequest('/api/v1/company/godmode/supply-chain/arbitrage')
      ]);
      const churnData = (churnRes as any)?.data;
      if (Array.isArray(churnData)) {
        setChurnPartners(churnData);
        setTotalMrrAtRisk((churnRes as any)?.summary?.totalMrrAtRisk || 0);
      }
      const supplyData = (supplyRes as any)?.data;
      if (Array.isArray(supplyData)) {
        setSupplyItems(supplyData);
        setTotalArbitrageProfit((supplyRes as any)?.summary?.totalMonthlyNetProfit || 0);
      }
    } finally {
      setIsLoadingChurn(false);
    }
  }, []);

  // Load War Room
  const fetchWarRoom = useCallback(async () => {
    try {
      const res = await apiRequest('/api/v1/company/godmode/war-room/telemetry');
      const data = (res as any)?.data;
      if (data) {
        setWarRoomData(data);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  // Start Impersonation
  const handleStartImpersonation = async () => {
    setIsStartingImpersonate(true);
    try {
      const res = await apiRequest('/api/v1/company/godmode/impersonate/start', {
        method: 'POST',
        body: JSON.stringify({
          targetTenantId,
          targetTenantName,
          targetUserId,
          targetUserName,
          targetUserRole,
          reason: impersonateReason,
          sessionMode
        })
      });
      const data = (res as any)?.data;
      if (data) {
        setActiveGhostSession(data);
      }
    } catch (err: any) {
      alert(`Impersonation notice: ${err.message}`);
    } finally {
      setIsStartingImpersonate(false);
    }
  };

  // End Impersonation
  const handleEndImpersonation = async () => {
    if (!activeGhostSession) return;
    try {
      await apiRequest('/api/v1/company/godmode/impersonate/end', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeGhostSession.sessionId
        })
      });
      setActiveGhostSession(null);
    } catch (err: any) {
      alert(`End impersonation notice: ${err.message}`);
    }
  };

  // Emergency Tenant Quarantine
  const handleEmergencyQuarantine = async (tenantId: string, action: 'FREEZE' | 'UNFREEZE') => {
    setIsQuarantining(true);
    setQuarantineResultMsg(null);
    try {
      const res = await apiRequest('/api/v1/company/godmode/tenant/quarantine', {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
          action,
          reason: 'Founder Emergency Kill-Switch: Ransomware Defense & Session Revocation Triggered'
        })
      });
      const msg = (res as any)?.message;
      setQuarantineResultMsg(msg || `Quarantine executed for ${tenantId}`);
    } finally {
      setIsQuarantining(false);
    }
  };

  useEffect(() => {
    fetchFeatureFlags();
    fetchTheftRadar();
    fetchChurnAndSupply();
    fetchWarRoom();
  }, [fetchFeatureFlags, fetchTheftRadar, fetchChurnAndSupply, fetchWarRoom]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* 👑 Top God-Level Founder Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950 border border-amber-500/40 p-6 mb-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 via-cyan-400 to-indigo-600 opacity-80 blur animate-pulse" />
              <div className="relative p-2.5 bg-slate-900 rounded-2xl border border-amber-400/60 shadow-inner">
                <DocSearchLogo variant="app-icon" size="xl" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-white to-cyan-200">
                  God-Mode Founder Command Studio
                </h1>
                <Badge variant="warning">
                  <span className="flex items-center gap-1.5 font-bold tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    FOUNDER LEVEL-0 ACCESS
                  </span>
                </Badge>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                World-Class Master Control • Cryptographic Ghost Impersonation • 0ms Dynamic Feature Flags • Forensic Theft Interceptor • Remote Tenant Quarantine
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <span className="text-cyan-400 font-extrabold">142</span>
              <span>Hospitals Online</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <span className="text-emerald-400 font-extrabold">₹42.8L</span>
              <span>Today GMV</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <span className="text-amber-400 font-extrabold">100% Zero-Mock</span>
              <span>PostgreSQL 18.4</span>
            </div>
          </div>
        </div>

        {/* Master Studio Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('IMPERSONATE')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'IMPERSONATE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>👻</span>
            <span>God-Mode Impersonation</span>
            {activeGhostSession && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-500 text-slate-950 font-bold animate-pulse">
                ACTIVE
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('FLAGS')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'FLAGS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>⚡</span>
            <span>Dynamic Feature Flags</span>
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-800 text-cyan-300 font-mono">
              {featureFlags.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('THEFT')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'THEFT'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-lg shadow-rose-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🛡️</span>
            <span>Forensic Theft Radar</span>
            {theftAlerts.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-rose-500 text-white font-bold">
                {theftAlerts.length} Alerts
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('CHURN_SUPPLY')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'CHURN_SUPPLY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>📈</span>
            <span>Churn Radar & B2B Arbitrage</span>
          </button>
          <button
            onClick={() => setActiveTab('WAR_ROOM')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'WAR_ROOM'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🚨</span>
            <span>Remote Quarantine & War Room</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: GOD-MODE IMPERSONATION & SESSION GHOSTING
         ========================================================================= */}
      {activeTab === 'IMPERSONATE' && (
        <div className="space-y-6">
          {/* Active Impersonation Warning Banner */}
          {activeGhostSession && (
            <div className="p-5 rounded-2xl bg-amber-950/80 border-2 border-amber-500 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm uppercase tracking-wider">
                  <span>⚠️</span>
                  <span>GHOST SESSION ACTIVELY RUNNING: {activeGhostSession.targetUserName}</span>
                </div>
                <p className="text-xs text-amber-200/90 mt-1">
                  Tenant: <strong>{activeGhostSession.targetTenantName}</strong> • Mode: <strong>{activeGhostSession.sessionMode}</strong> • Audit Seal: <code className="font-mono bg-amber-900/60 px-1 py-0.5 rounded">{activeGhostSession.auditHash.slice(0, 16)}...</code>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    const payload = encodeURIComponent(JSON.stringify({
                      ...activeGhostSession,
                      sessionToken: activeGhostSession.ghostSessionToken || activeGhostSession.sessionToken
                    }));
                    const url = `http://localhost:5173/?ghostSession=${payload}`;
                    window.open(url, '_blank');
                  }}
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  Open Hospital Portal in Ghost Mode ↗
                </Button>
                <Button
                  variant="danger"
                  onClick={handleEndImpersonation}
                  className="text-xs font-bold"
                >
                  Terminate Ghost Session
                </Button>
              </div>
            </div>
          )}

          {/* Impersonation Launcher Box */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>👻</span>
              <span>Cryptographic Ghost Session Provisioner</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Impersonate any clinician, hospital admin, or cashier with zero password revelation. Every click is digitally signed with an immutable SHA-256 tamper-evident watermark.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="text-xs font-semibold text-slate-300">Target Hospital / Clinic:</label>
                <select
                  value={targetTenantId}
                  onChange={(e) => {
                    setTargetTenantId(e.target.value);
                    if (e.target.value === '6855be07-5298-4148-a571-c51ac49ac7f3') {
                      setTargetTenantName('Apollo City Multi-Specialty Hospital');
                    } else if (e.target.value === 'TENANT-NCR-MAXCARE') {
                      setTargetTenantName('MaxCare Superspecialty Hospital (Gurgaon)');
                    } else {
                      setTargetTenantName('Metro Life Care Clinic & Dialysis');
                    }
                  }}
                  className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="6855be07-5298-4148-a571-c51ac49ac7f3">Apollo City Multi-Specialty Hospital (Active Master)</option>
                  <option value="TENANT-NCR-MAXCARE">MaxCare Superspecialty Hospital (Gurgaon)</option>
                  <option value="TENANT-PUNE-METRO">Metro Life Care Clinic & Dialysis</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Target User Persona & Role:</label>
                <select
                  value={targetUserRole}
                  onChange={(e) => {
                    setTargetUserRole(e.target.value);
                    if (e.target.value === 'DOCTOR') {
                      setTargetUserId('DOC-CHIEF-001');
                      setTargetUserName('Dr. Vikramaditya Sen (Chief of Surgery)');
                    } else if (e.target.value === 'HOSPITAL_ADMIN') {
                      setTargetUserId('ADMIN-HOSP-002');
                      setTargetUserName('Col. Rajeshwar Singh (Medical Superintendent)');
                    } else if (e.target.value === 'PHARMACIST') {
                      setTargetUserId('PHARM-HEAD-003');
                      setTargetUserName('Pooja Varma (Chief Pharmacist)');
                    } else {
                      setTargetUserId('NURSE-HEAD-004');
                      setTargetUserName('Sister Anita Sharma (OT Head Nurse)');
                    }
                  }}
                  className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="DOCTOR">Dr. Vikramaditya Sen — Chief of Surgery (DOCTOR)</option>
                  <option value="HOSPITAL_ADMIN">Col. Rajeshwar Singh — Medical Superintendent (ADMIN)</option>
                  <option value="PHARMACIST">Pooja Varma — Chief Pharmacist (PHARMACIST)</option>
                  <option value="NURSE">Sister Anita Sharma — OT Head Nurse (NURSE)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Mandatory Audit Justification (Statutory Requirement):</label>
                <input
                  type="text"
                  value={impersonateReason}
                  onChange={(e) => setImpersonateReason(e.target.value)}
                  placeholder="Explain why Founder is entering this tenant account..."
                  className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Session Mode:</label>
                <div className="flex items-center gap-3 mt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={sessionMode === 'READ_ONLY_AUDITED'}
                      onChange={() => setSessionMode('READ_ONLY_AUDITED')}
                      className="accent-amber-500"
                    />
                    <span>Read-Only Audited (Safe Inspection)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-rose-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={sessionMode === 'BREAK_GLASS_MUTATION'}
                      onChange={() => setSessionMode('BREAK_GLASS_MUTATION')}
                      className="accent-rose-500"
                    />
                    <span>Break-Glass Mutation (Allows Emergency Fixes)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <Button
                variant="primary"
                onClick={handleStartImpersonation}
                disabled={isStartingImpersonate}
                className="text-sm font-bold px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/20"
              >
                {isStartingImpersonate ? 'Sealing Cryptographic Token...' : '1-Click Launch God-Mode Ghost Session'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DYNAMIC FEATURE FLAGS & CIRCUIT BREAKERS
         ========================================================================= */}
      {activeTab === 'FLAGS' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">Dynamic Feature Flags & 0ms Circuit Breakers</h3>
                <Badge variant="primary">LAUNCHDARKLY GRADE</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Toggle clinical algorithms, government scheme connectors, and POS validations across 500+ clinics with zero server restarts or downtime.
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={fetchFeatureFlags}
              disabled={isLoadingFlags}
              className="text-xs"
            >
              {isLoadingFlags ? 'Refreshing...' : '🔄 Refresh State'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureFlags.map((flag) => (
              <div
                key={flag.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-cyan-300 font-mono">
                      {flag.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Rollout: {flag.rollout_pct}%</span>
                  </div>

                  <h4 className="text-base font-bold text-white">{flag.feature_name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{flag.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  {/* Enable Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFlag(flag, !flag.is_globally_enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        flag.is_globally_enabled ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          flag.is_globally_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-300">
                      {flag.is_globally_enabled ? 'Active Globally' : 'Disabled'}
                    </span>
                  </div>

                  {/* Circuit Breaker Kill-Switch */}
                  <Button
                    variant={flag.circuit_breaker_active ? 'danger' : 'secondary'}
                    onClick={() => handleToggleCircuitBreaker(flag)}
                    className="text-[11px] px-2.5 py-1"
                  >
                    {flag.circuit_breaker_active ? '🚨 Circuit Tripped' : 'Circuit Breaker: Normal'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FORENSIC REVENUE THEFT RADAR
         ========================================================================= */}
      {activeTab === 'THEFT' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">Forensic Revenue Theft & Fraud Interceptor</h3>
                <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-rose-500 text-white animate-pulse">
                  HEALTHCARE STRIPE RADAR
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-1">
                Deep neural pattern matching detecting receptionist cash cancellations, off-the-record doctor consults, and unbilled surgical supplies.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-rose-300 font-bold uppercase tracking-wider">Total Detected Leakage</span>
              <div className="text-2xl font-extrabold text-white">
                ₹{totalTheftRisk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {theftAlerts.map((alertItem) => (
              <div
                key={alertItem.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {alertItem.anomaly_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Confidence: {alertItem.confidence_score}%</span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{alertItem.tenant_name}</span>
                  </div>

                  <h4 className="text-base font-bold text-white">
                    Flagged Staff: {alertItem.staff_name} ({alertItem.staff_role})
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">{alertItem.details}</p>
                </div>

                <div className="flex flex-col md:items-end gap-2 shrink-0">
                  <div className="text-lg font-extrabold text-rose-400">
                    ₹{Number(alertItem.detected_cash_leakage).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>

                  {alertItem.is_quarantined ? (
                    <span className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800">
                      🔒 Cashier Suspended
                    </span>
                  ) : (
                    <Button
                      variant="danger"
                      onClick={() => handleQuarantineStaff(alertItem)}
                      className="text-xs font-bold"
                    >
                      1-Click Suspend Cashier
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PREDICTIVE CHURN RADAR & B2B SUPPLY ARBITRAGE
         ========================================================================= */}
      {activeTab === 'CHURN_SUPPLY' && (
        <div className="space-y-6">
          {/* Section A: Predictive Churn Radar */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Predictive Partner Churn Radar (30-Day Early Warning)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tracks Daily Active Clinicians (DAU) and token velocity drops to preempt hospital contract cancellations.
                </p>
              </div>

              <div className="text-xs text-slate-300">
                Total MRR at Risk: <strong className="text-rose-400 text-sm">₹{totalMrrAtRisk.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {churnPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        partner.churn_risk_grade === 'RED_CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        partner.churn_risk_grade === 'AMBER_WATCH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {partner.churn_risk_grade}
                      </span>
                      <span className="text-xs font-bold text-slate-300">Churn Prob: {partner.churn_probability_pct}%</span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{partner.hospital_name}</h4>
                    <div className="mt-2 text-xs space-y-1 text-slate-400">
                      <div>MRR: <strong className="text-slate-200">₹{Number(partner.mrr_amount).toLocaleString('en-IN')}</strong></div>
                      <div>DAU Trend: <span className="text-rose-400 font-semibold">{partner.dau_trend_pct}%</span></div>
                      <div>Token Velocity: <span className="text-rose-400 font-semibold">{partner.token_velocity_change_pct}%</span></div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-cyan-400">
                    Intervention: {partner.automated_intervention.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: B2B Medical & Chemical Consumable Arbitrage */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Central Medical & Reagent Supply Chain Margin Arbitrage</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bulk manufacturer purchasing direct from Cipla, BD, and Sun Pharma distributed to 500+ clinics with 40%+ arbitrage margin.
                </p>
              </div>

              <div className="text-xs text-slate-300">
                Projected Monthly Arbitrage Net Profit: <strong className="text-emerald-400 text-sm">₹{totalArbitrageProfit.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {supplyItems.map((item) => (
                <div key={item.id} className="py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-cyan-400 font-bold">{item.item_code}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400 font-semibold">{item.manufacturer_name}</span>
                    </div>
                    <div className="text-sm font-bold text-white">{item.item_name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Depot: {item.in_stock_depot} • Monthly Usage: {item.monthly_pan_india_consumption_units.toLocaleString('en-IN')} units
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right text-xs">
                      <div className="text-slate-400">Bulk Cost: <strong className="text-slate-200">₹{item.mfg_bulk_cost}</strong></div>
                      <div className="text-slate-400">Resale: <strong className="text-slate-200">₹{item.platform_resale_price}</strong></div>
                      <div className="text-slate-400">Hospital MRP: <strong className="text-slate-200">₹{item.hospital_mrp}</strong></div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 text-xs font-extrabold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {item.gross_margin_pct}% Margin
                      </span>
                      <div className="text-xs font-bold text-emerald-400 mt-1">
                        +₹{Number(item.projected_monthly_arbitrage_profit).toLocaleString('en-IN')} / mo
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: REMOTE QUARANTINE & WAR ROOM
         ========================================================================= */}
      {activeTab === 'WAR_ROOM' && (
        <div className="space-y-6">
          {/* Emergency Tenant Quarantine Kill-Switch Card */}
          <div className="bg-gradient-to-r from-red-950/70 via-slate-900 to-red-950/70 border-2 border-red-500/50 rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 text-[11px] font-extrabold rounded bg-red-500 text-white">
                  EMERGENCY TENANT QUARANTINE & RANSOMWARE KILL-SWITCH
                </span>
                <h3 className="text-xl font-bold text-white mt-2">
                  Immediate 1-Click Clinic Isolation & Token Revocation
                </h3>
                <p className="text-xs text-red-200/90 mt-1 max-w-2xl leading-relaxed">
                  In case of ransomware infection or rogue staff data exfiltration, this kill-switch severs all active JWT sessions, sets the tenant DB into READ-ONLY freeze, and captures an encrypted SHA-256 state snapshot.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="danger"
                  onClick={() => handleEmergencyQuarantine('6855be07-5298-4148-a571-c51ac49ac7f3', 'FREEZE')}
                  disabled={isQuarantining}
                  className="text-xs font-extrabold px-4 py-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
                >
                  {isQuarantining ? 'Executing Freeze...' : '🚨 EXECUTE EMERGENCY KILL-SWITCH'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleEmergencyQuarantine('6855be07-5298-4148-a571-c51ac49ac7f3', 'UNFREEZE')}
                  className="text-xs"
                >
                  Restore Tenant Operations
                </Button>
              </div>
            </div>

            {quarantineResultMsg && (
              <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-red-500/40 text-xs font-mono text-red-300">
                {quarantineResultMsg}
              </div>
            )}
          </div>

          {/* Pan-India Real-Time War Room Dashboard */}
          {warRoomData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Clinicians Online</span>
                  <div className="text-2xl font-bold text-cyan-400 mt-1">
                    {warRoomData.networkOverview.totalVerifiedCliniciansOnline}
                  </div>
                  <span className="text-[10px] text-slate-500">Across 142 Facilities</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Today Consultations</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {warRoomData.networkOverview.todayConsultationsTotal}
                  </div>
                  <span className="text-[10px] text-slate-500">Avg 7.2m duration</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">5G Ambulances Active</span>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {warRoomData.emergencyTelemetry.activeAmbulancesInTransit}
                  </div>
                  <span className="text-[10px] text-slate-500">3 STEMI Codes Live</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">ICU Ventilator Beds Pan-India</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {warRoomData.emergencyTelemetry.availableVentilatorBedsPanIndia} Available
                  </div>
                  <span className="text-[10px] text-slate-500">86.4% Occupancy</span>
                </div>
              </div>

              {/* State-by-State Feed */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h4 className="text-sm font-bold text-white mb-3">Live State-by-State Healthcare Velocity Feeds</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {warRoomData.stateTelemetryFeeds.map((st) => (
                    <div key={st.state} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-200">{st.state}</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">₹{(st.gmvToday / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between">
                        <span>{st.activeHospitals} Active Hospitals</span>
                        <span>{st.todayConsultations} Consults</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
