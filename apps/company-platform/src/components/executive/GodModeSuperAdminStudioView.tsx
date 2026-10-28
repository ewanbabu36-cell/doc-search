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

export interface PhiSnoopAlert {
  id: string;
  tenant_id: string;
  tenant_name: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  patient_id: string;
  patient_name: string;
  patient_vip_level: string;
  read_anomaly_score: number;
  reason: string;
  is_locked: boolean;
  audit_hash: string;
  created_at: string;
}

export interface WiretapPacket {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  responseTimeMs: number;
  tenantId?: string;
  userId?: string;
  userRole?: string;
  patientId?: string;
  ipAddress?: string;
  isPhiAccess?: boolean;
}

export interface TimeTravelEvent {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  snapshot_before: any;
  snapshot_after: any;
  reconstructed_delta: any;
  audit_hash: string;
  created_at: string;
}

export interface DoctorCollusionRecord {
  id: string;
  tenant_id: string;
  hospital_name: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  pharma_company_name: string;
  branded_molecule_name: string;
  generic_alternative_name: string;
  monthly_branded_scripts_count: number;
  generic_substitution_rate_pct: string | number;
  collusion_risk_score: number;
  estimated_patient_markup_pct: string | number;
  monthly_kickback_leakage_inr: string | number;
  investigation_status: string;
  mandate_generic_substitution: boolean;
  created_at: string;
}

export interface DunningPartner {
  id: string;
  tenant_id: string;
  hospital_name: string;
  partner_tier: string;
  contract_arr_inr: string | number;
  total_overdue_amount_inr: string | number;
  days_overdue: number;
  current_friction_tier: 'NONE' | 'TIER_1_WATERMARK' | 'TIER_2_THROTTLING' | 'TIER_3_EXPORT_FREEZE' | 'TIER_4_TOTAL_GATEWAY_SUSPENSION';
  is_grace_period_extended: boolean;
  rehabilitation_emi_active: boolean;
  last_friction_applied_at?: string;
}

export interface VaultChallenge {
  challengeId: string;
  challengeCode: string;
  actionType: string;
  targetScope: string;
  blastRadiusAssessment: string;
  justification: string;
  requestedByAdminId: string;
  requestedByAdminName: string;
  status: string;
  expiresAt: string;
}

export interface NabhAuditBinder {
  id: string;
  tenant_id: string;
  hospital_name: string;
  audit_cycle: string;
  nabh_compliance_score: number;
  statutory_status: string;
  chapters: {
    autoclaveSterilizationVerification: any;
    needleStickRegisterAudit: any;
    biomedicalWasteManifest: any;
    biomedicalEquipmentCalibration: any;
  };
  immutable_seal_hash: string;
  compiled_at: string;
}

export interface GodModeSuperAdminStudioViewProps {
  onNavigateDomain?: (domain: string) => void;
}

export interface StegoPattern {
  fingerprintHash: string;
  actorId: string;
  actorName: string;
  clientIp: string;
  stegoSalt: string;
  cssMicroPattern: string;
  matrix: any;
  timestamp: string;
}

export interface DecodedStegoEvidence {
  decodedActorId: string;
  decodedActorName: string;
  workstationIp: string;
  tenantId: string;
  sessionHash: string;
  leakedTimestamp: string;
  confidenceScorePct: number;
  targetPatientChartId: string;
  stegoModulationDetected: string;
  recommendedAction: string;
}

export interface HoneytokenTrap {
  id: string;
  tenant_id: string;
  token_type: string;
  decoy_entity_id: string;
  decoy_payload: any;
  trip_count: number;
  status: string;
  created_at: string;
}

export interface HoneytokenIncident {
  id: string;
  trap_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  client_ip: string;
  query_context: string;
  captured_session_evidence: any;
  is_isolated: boolean;
  trip_timestamp: string;
}

export interface TpaClaim {
  id: string;
  claim_id: string;
  tenant_id: string;
  hospital_name: string;
  insurer_name: string;
  patient_id: string;
  claim_amount_inr: string | number;
  pre_audit_risk_score: number;
  flagged_icd10_mismatches: any;
  potential_clawback_inr: string | number;
  audit_status: string;
  created_at: string;
}

export interface TpaRebuttal {
  id: string;
  claim_id: string;
  tenant_id: string;
  insurer_id: string;
  irda_circular_reference: string;
  clinical_justification: string;
  generated_legal_notice: string;
  sha256_seal: string;
  status: string;
  created_at: string;
}

export interface CartelRecord {
  id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  hospital_id: string;
  hospital_name: string;
  opd_consult_count: number;
  internal_diagnostic_conversion_pct: string | number;
  benchmark_dept_conversion_pct: string | number;
  external_leakage_risk_score: number;
  suspected_destination_entity: string;
  estimated_monthly_poaching_loss_inr: string | number;
  status: string;
  created_at: string;
}

export interface FinReconCounter {
  id: string;
  tenant_id: string;
  hospital_name: string;
  counter_id: string;
  cashier_id: string;
  cashier_name: string;
  shift_start: string;
  shift_end?: string;
  physical_cash_reported_inr: string | number;
  pos_terminal_settled_inr: string | number;
  online_gateway_settled_inr: string | number;
  system_billed_total_inr: string | number;
  variance_inr: string | number;
  reconciliation_status: string;
  auto_healed_at?: string;
  created_at: string;
}

export interface GeospatialNode {
  id: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  hospitalName: string;
  activeBeds: number;
  icuOccupancyPct: number;
  oxygenBurnRateLpm: number;
  active5gAmbulances: number;
  gmvTodayInr: number;
  status: string;
}

export const GodModeSuperAdminStudioView: React.FC<GodModeSuperAdminStudioViewProps> = ({ onNavigateDomain: _onNavigateDomain }) => {
  const [activeTab, setActiveTab] = useState<
    | 'IMPERSONATE'
    | 'FLAGS'
    | 'THEFT'
    | 'CHURN_SUPPLY'
    | 'WAR_ROOM'
    | 'WIRETAP'
    | 'TIME_TRAVEL'
    | 'COLLUSION'
    | 'DUNNING'
    | 'VAULT'
    | 'NABH'
    | 'STEGO_DECODER'
    | 'HONEYTOKENS'
    | 'TPA_SHIELD'
    | 'CARTEL_RADAR'
    | 'FIN_RECON'
    | 'WAR_MAP'
  >('IMPERSONATE');

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

  // Omnipotent Matrix State
  // 1. Wiretap & VIP PHI
  const [snoopAlerts, setSnoopAlerts] = useState<PhiSnoopAlert[]>([]);
  const [wiretapPackets, setWiretapPackets] = useState<WiretapPacket[]>([]);
  const [_isLoadingWiretap, setIsLoadingWiretap] = useState(false);

  // 2. Time Travel
  const [timeTravelEvents, setTimeTravelEvents] = useState<TimeTravelEvent[]>([]);
  const [selectedTimeTravel, setSelectedTimeTravel] = useState<TimeTravelEvent | null>(null);
  const [_isLoadingTimeTravel, setIsLoadingTimeTravel] = useState(false);

  // 3. Collusion
  const [collusionRecords, setCollusionRecords] = useState<DoctorCollusionRecord[]>([]);
  const [totalCollusionLeakage, setTotalCollusionLeakage] = useState(0);
  const [_isLoadingCollusion, setIsLoadingCollusion] = useState(false);

  // 4. Dunning
  const [dunningPartners, setDunningPartners] = useState<DunningPartner[]>([]);
  const [totalOverdueArr, setTotalOverdueArr] = useState(0);
  const [_isLoadingDunning, setIsLoadingDunning] = useState(false);

  // 5. Vault
  const [vaultActionType, setVaultActionType] = useState('MASS_EMR_ENCRYPTION_KEY_ROTATION');
  const [vaultTargetScope, setVaultTargetScope] = useState('PAN_INDIA_142_HOSPITALS');
  const [vaultJustification, setVaultJustification] = useState('Quarterly quantum-resistant HSM root key re-sealing per statutory mandate');
  const [vaultChallenge, setVaultChallenge] = useState<VaultChallenge | null>(null);
  const [vaultSecondSignerId, setVaultSecondSignerId] = useState('EXEC-SEC-002');
  const [vaultSecondSignerName, setVaultSecondSignerName] = useState('Anya Sharma (Co-Founder & VP SecOps)');
  const [vaultTotp, setVaultTotp] = useState('849201');
  const [vaultAuthResult, setVaultAuthResult] = useState<any>(null);
  const [isRequestingVault, setIsRequestingVault] = useState(false);
  const [isAuthorizingVault, setIsAuthorizingVault] = useState(false);

  // 6. NABH
  const [nabhTenantId, setNabhTenantId] = useState('6855be07-5298-4148-a571-c51ac49ac7f3');
  const [nabhHospitalName, setNabhHospitalName] = useState('Apollo City Multi-Specialty Hospital');
  const [nabhAuditCycle, setNabhAuditCycle] = useState('2026-H1-STATUTORY-REACCREDITATION');
  const [nabhInspectorName, setNabhInspectorName] = useState('Dr. Arvind Mehra (NABH Lead Assessor)');
  const [nabhBinder, setNabhBinder] = useState<NabhAuditBinder | null>(null);
  const [isCompilingNabh, setIsCompilingNabh] = useState(false);

  // Omniscient Matrix State: Enclaves 12-17
  // 12. Steganography
  const [stegoPattern, setStegoPattern] = useState<StegoPattern | null>(null);
  const [decodedEvidence, setDecodedEvidence] = useState<DecodedStegoEvidence | null>(null);
  const [isDecodingStego, setIsDecodingStego] = useState(false);

  // 13. Honeytokens
  const [honeytokenTraps, setHoneytokenTraps] = useState<HoneytokenTrap[]>([]);
  const [honeytokenIncidents, setHoneytokenIncidents] = useState<HoneytokenIncident[]>([]);
  const [isInjectingTrap, setIsInjectingTrap] = useState(false);

  // 14. TPA Shield
  const [tpaClaims, setTpaClaims] = useState<TpaClaim[]>([]);
  const [tpaRebuttals, setTpaRebuttals] = useState<TpaRebuttal[]>([]);
  const [totalPotentialClawback, setTotalPotentialClawback] = useState(0);
  const [isGeneratingRebuttal, setIsGeneratingRebuttal] = useState(false);

  // 15. Cartel Radar
  const [cartelRecords, setCartelRecords] = useState<CartelRecord[]>([]);
  const [totalPoachingLoss, setTotalPoachingLoss] = useState(0);

  // 16. Financial Recon
  const [reconCounters, setReconCounters] = useState<FinReconCounter[]>([]);
  const [totalVariance, setTotalVariance] = useState(0);
  const [isAutoHealing, setIsAutoHealing] = useState(false);

  // 17. Geospatial War Map
  const [geoNodes, setGeoNodes] = useState<GeospatialNode[]>([]);
  const [selectedGeoNode, setSelectedGeoNode] = useState<GeospatialNode | null>(null);

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

  // Omnipotent Matrix Callbacks
  // 1. Wiretap
  const fetchWiretap = useCallback(async () => {
    setIsLoadingWiretap(true);
    try {
      const res = await apiRequest('/api/v1/company/godmode/wiretap/live');
      const data = (res as any)?.data;
      if (data) {
        if (Array.isArray(data.snoopAlerts)) setSnoopAlerts(data.snoopAlerts);
        if (Array.isArray(data.livePacketStream)) setWiretapPackets(data.livePacketStream);
      }
    } finally {
      setIsLoadingWiretap(false);
    }
  }, []);

  const handleLockSnooper = async (alertItem: PhiSnoopAlert) => {
    try {
      await apiRequest('/api/v1/company/godmode/wiretap/lock-actor', {
        method: 'POST',
        body: JSON.stringify({
          alertId: alertItem.id,
          actorId: alertItem.actor_id,
          reason: 'Founder Remote Revocation: VIP PHI Snooping Hard Intercept'
        })
      });
      setSnoopAlerts((prev) => prev.map((a) => (a.id === alertItem.id ? { ...a, is_locked: true } : a)));
      alert(`Staff ${alertItem.actor_name} biometric and credential access revoked immediately.`);
    } catch (err: any) {
      alert(`Staff lock notice: ${err.message}`);
    }
  };

  // 2. Time Travel
  const fetchTimeTravel = useCallback(async () => {
    setIsLoadingTimeTravel(true);
    try {
      const res = await apiRequest('/api/v1/company/godmode/time-travel/replay');
      const data = (res as any)?.data;
      if (Array.isArray(data)) {
        setTimeTravelEvents(data);
        if (data.length > 0 && !selectedTimeTravel) {
          setSelectedTimeTravel(data[0]);
        }
      }
    } finally {
      setIsLoadingTimeTravel(false);
    }
  }, [selectedTimeTravel]);

  // 3. Collusion
  const fetchCollusion = useCallback(async () => {
    setIsLoadingCollusion(true);
    try {
      const res = await apiRequest('/api/v1/company/godmode/collusion/radar');
      const data = (res as any)?.data;
      if (Array.isArray(data)) {
        setCollusionRecords(data);
        setTotalCollusionLeakage((res as any)?.summary?.totalCollusionLeakageInr || 0);
      }
    } finally {
      setIsLoadingCollusion(false);
    }
  }, []);

  const handleRestrictPrescription = async (record: DoctorCollusionRecord) => {
    try {
      await apiRequest('/api/v1/company/godmode/collusion/restrict-prescription', {
        method: 'POST',
        body: JSON.stringify({
          recordId: record.id,
          doctorId: record.doctor_id,
          mandateGenericSubstitution: true,
          reason: 'Founder Anti-Collusion Safeguard: Auto-Generic Substitution Mandated'
        })
      });
      setCollusionRecords((prev) =>
        prev.map((r) => (r.id === record.id ? { ...r, mandate_generic_substitution: true } : r))
      );
      alert(`Doctor ${record.doctor_name} prescription system locked to generic molecule (${record.generic_alternative_name}).`);
    } catch (err: any) {
      alert(`Generic mandate notice: ${err.message}`);
    }
  };

  // 4. Dunning
  const fetchDunning = useCallback(async () => {
    setIsLoadingDunning(true);
    try {
      const res = await apiRequest('/api/v1/company/godmode/dunning/pipeline');
      const data = (res as any)?.data;
      if (Array.isArray(data)) {
        setDunningPartners(data);
        setTotalOverdueArr((res as any)?.summary?.totalOverdueArrInr || 0);
      }
    } finally {
      setIsLoadingDunning(false);
    }
  }, []);

  const handleApplyDunningFriction = async (partner: DunningPartner, tier: DunningPartner['current_friction_tier']) => {
    try {
      await apiRequest('/api/v1/company/godmode/dunning/apply-friction', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: partner.id,
          tenantId: partner.tenant_id,
          frictionTier: tier,
          rehabilitationEmiActive: tier !== 'NONE'
        })
      });
      setDunningPartners((prev) =>
        prev.map((p) =>
          p.id === partner.id
            ? { ...p, current_friction_tier: tier, rehabilitation_emi_active: tier !== 'NONE' }
            : p
        )
      );
      alert(`Friction tier ${tier} applied to ${partner.hospital_name}.`);
    } catch (err: any) {
      alert(`Dunning notice: ${err.message}`);
    }
  };

  // 5. Vault
  const handleRequestVaultAction = async () => {
    setIsRequestingVault(true);
    setVaultAuthResult(null);
    try {
      const res = await apiRequest('/api/v1/company/godmode/vault/request-destructive-action', {
        method: 'POST',
        body: JSON.stringify({
          actionType: vaultActionType,
          targetScope: vaultTargetScope,
          blastRadiusAssessment: 'High-Impact Network-Wide Statutory & Cryptographic Re-keying',
          justification: vaultJustification,
          requestedByAdminId: 'FOUNDER-001',
          requestedByAdminName: 'Founder Chief Executive'
        })
      });
      const data = (res as any)?.data;
      if (data) {
        setVaultChallenge(data);
      }
    } catch (err: any) {
      alert(`Vault request notice: ${err.message}`);
    } finally {
      setIsRequestingVault(false);
    }
  };

  const handleAuthorizeVault = async () => {
    if (!vaultChallenge) return;
    setIsAuthorizingVault(true);
    try {
      const res = await apiRequest('/api/v1/company/godmode/vault/authorize', {
        method: 'POST',
        body: JSON.stringify({
          challengeId: vaultChallenge.challengeId,
          challengeCode: vaultChallenge.challengeCode,
          secondSignerAdminId: vaultSecondSignerId,
          secondSignerAdminName: vaultSecondSignerName,
          totpToken: vaultTotp
        })
      });
      const data = (res as any)?.data;
      if (data) {
        setVaultAuthResult(data);
        setVaultChallenge(null);
      }
    } catch (err: any) {
      alert(`Vault authorize notice: ${err.message}`);
    } finally {
      setIsAuthorizingVault(false);
    }
  };

  // 6. NABH
  const handleCompileNabhBinder = async () => {
    setIsCompilingNabh(true);
    try {
      const res = await apiRequest('/api/v1/company/godmode/audit/nabh-binder/compile', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: nabhTenantId,
          hospitalName: nabhHospitalName,
          auditCycle: nabhAuditCycle,
          inspectorName: nabhInspectorName
        })
      });
      const data = (res as any)?.data;
      if (data) {
        setNabhBinder(data);
      }
    } catch (err: any) {
      alert(`NABH compilation notice: ${err.message}`);
    } finally {
      setIsCompilingNabh(false);
    }
  };

  // 12. Stego callbacks
  const fetchStegoPattern = useCallback(async () => {
    try {
      const res = await apiRequest('/api/v1/company/godmode/steganography/pattern');
      const data = (res as any)?.pattern;
      if (data) setStegoPattern(data);
    } catch {
      // Graceful
    }
  }, []);

  const handleDecodeStegoImage = async () => {
    setIsDecodingStego(true);
    try {
      const res = await apiRequest('/api/v1/company/godmode/steganography/decode-image', {
        method: 'POST',
        body: JSON.stringify({
          sampleHash: 'SAMPLE-LEAK-EVIDENCE-SHA256'
        })
      });
      const data = (res as any)?.evidence;
      if (data) setDecodedEvidence(data);
    } catch (err: any) {
      alert(`Stego decode notice: ${err.message}`);
    } finally {
      setIsDecodingStego(false);
    }
  };

  // 13. Honeytoken callbacks
  const fetchHoneytokens = useCallback(async () => {
    try {
      const res = await apiRequest('/api/v1/company/godmode/honeytokens/grid');
      const data = (res as any);
      if (Array.isArray(data?.traps)) setHoneytokenTraps(data.traps);
      if (Array.isArray(data?.incidents)) setHoneytokenIncidents(data.incidents);
    } catch {
      // Graceful
    }
  }, []);

  const handleInjectCanaryTrap = async () => {
    setIsInjectingTrap(true);
    try {
      await apiRequest('/api/v1/company/godmode/honeytokens/inject', {
        method: 'POST',
        body: JSON.stringify({
          tokenType: 'PATIENT_CHART',
          decoyEntityId: `CANARY-VIP-${Date.now().toString(36).toUpperCase()}`,
          decoyPayload: {
            decoyName: 'Hon. Justice High Court (Canary Decoy)',
            room: 'Special VIP Ward 101',
            status: 'ARMED'
          }
        })
      });
      await fetchHoneytokens();
      alert('Canary decoy trap injected into patient database.');
    } catch (err: any) {
      alert(`Canary inject notice: ${err.message}`);
    } finally {
      setIsInjectingTrap(false);
    }
  };

  const handleIsolateIntruder = async (actorId: string) => {
    try {
      await apiRequest('/api/v1/company/godmode/honeytokens/isolate-intruder', {
        method: 'POST',
        body: JSON.stringify({ actorId, reason: 'Canary tripwire violation' })
      });
      setHoneytokenIncidents((prev) =>
        prev.map((i) => (i.actor_id === actorId ? { ...i, is_isolated: true } : i))
      );
      alert(`Intruder ${actorId} isolated: credentials revoked & biometric locked.`);
    } catch (err: any) {
      alert(`Isolate notice: ${err.message}`);
    }
  };

  // 14. TPA callbacks
  const fetchTpaStream = useCallback(async () => {
    try {
      const res = await apiRequest('/api/v1/company/godmode/tpa/audit-stream');
      const data = (res as any);
      if (Array.isArray(data?.claims)) setTpaClaims(data.claims);
      if (Array.isArray(data?.rebuttals)) setTpaRebuttals(data.rebuttals);
      setTotalPotentialClawback(data?.summary?.totalPotentialClawbackInr || 0);
    } catch {
      // Graceful
    }
  }, []);

  const handleGenerateTpaRebuttal = async (claim: TpaClaim) => {
    setIsGeneratingRebuttal(true);
    try {
      await apiRequest('/api/v1/company/godmode/tpa/generate-rebuttal', {
        method: 'POST',
        body: JSON.stringify({
          claimId: claim.claim_id,
          insurerId: claim.insurer_name,
          clinicalJustification:
            'Operative notes, pre-auth approval, and cardiac enzyme curves authenticated per IRDAI Chapter IV regulations.'
        })
      });
      await fetchTpaStream();
      alert(`Statutory IRDAI Rebuttal notice dispatched for Claim ${claim.claim_id}.`);
    } catch (err: any) {
      alert(`Rebuttal notice: ${err.message}`);
    } finally {
      setIsGeneratingRebuttal(false);
    }
  };

  // 15. Cartel callbacks
  const fetchCartelRadar = useCallback(async () => {
    try {
      const res = await apiRequest('/api/v1/company/godmode/cartel/radar');
      const data = (res as any);
      if (Array.isArray(data?.cartelRecords)) setCartelRecords(data.cartelRecords);
      setTotalPoachingLoss(data?.summary?.totalEstimatedMonthlyPoachingLossInr || 0);
    } catch {
      // Graceful
    }
  }, []);

  const handleFlagCartelDoctor = async (record: CartelRecord) => {
    try {
      await apiRequest('/api/v1/company/godmode/cartel/flag-investigation', {
        method: 'POST',
        body: JSON.stringify({ doctorId: record.doctor_id, reason: 'High diagnostic conversion drop-off' })
      });
      setCartelRecords((prev) =>
        prev.map((r) => (r.doctor_id === record.doctor_id ? { ...r, status: 'UNDER_FORENSIC_INVESTIGATION' } : r))
      );
      alert(`Doctor ${record.doctor_name} placed under discrete clinical audit.`);
    } catch (err: any) {
      alert(`Cartel flag notice: ${err.message}`);
    }
  };

  // 16. Fin Recon callbacks
  const fetchFinRecon = useCallback(async () => {
    try {
      const res = await apiRequest('/api/v1/company/godmode/financial-recon/live');
      const data = (res as any);
      if (Array.isArray(data?.counters)) setReconCounters(data.counters);
      setTotalVariance(data?.summary?.netLedgerVarianceInr || 0);
    } catch {
      // Graceful
    }
  }, []);

  const handleAutoHealRecon = async () => {
    setIsAutoHealing(true);
    try {
      await apiRequest('/api/v1/company/godmode/financial-recon/auto-heal', {
        method: 'POST',
        body: JSON.stringify({ healAction: 'RECONCILE_ALL_DISCREPANCIES' })
      });
      await fetchFinRecon();
      alert('Split-brain ledgers reconciled. Orphan webhooks matched to cash receipts.');
    } catch (err: any) {
      alert(`Auto-heal notice: ${err.message}`);
    } finally {
      setIsAutoHealing(false);
    }
  };

  // 17. Geospatial callbacks
  const fetchGeoNodes = useCallback(async () => {
    try {
      const res = await apiRequest('/api/v1/company/godmode/geospatial/nodes');
      const data = (res as any)?.nodes;
      if (Array.isArray(data)) {
        setGeoNodes(data);
        if (data.length > 0 && !selectedGeoNode) setSelectedGeoNode(data[0]);
      }
    } catch {
      // Graceful
    }
  }, [selectedGeoNode]);

  useEffect(() => {
    fetchFeatureFlags();
    fetchTheftRadar();
    fetchChurnAndSupply();
    fetchWarRoom();
    fetchWiretap();
    fetchTimeTravel();
    fetchCollusion();
    fetchDunning();
    fetchStegoPattern();
    fetchHoneytokens();
    fetchTpaStream();
    fetchCartelRadar();
    fetchFinRecon();
    fetchGeoNodes();
  }, [
    fetchFeatureFlags,
    fetchTheftRadar,
    fetchChurnAndSupply,
    fetchWarRoom,
    fetchWiretap,
    fetchTimeTravel,
    fetchCollusion,
    fetchDunning,
    fetchStegoPattern,
    fetchHoneytokens,
    fetchTpaStream,
    fetchCartelRadar,
    fetchFinRecon,
    fetchGeoNodes
  ]);

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
          <button
            onClick={() => setActiveTab('WIRETAP')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'WIRETAP'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>👁️</span>
            <span>VIP PHI Wiretap</span>
            {snoopAlerts.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-cyan-500 text-slate-950 font-bold">
                {snoopAlerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('TIME_TRAVEL')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'TIME_TRAVEL'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-lg shadow-purple-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>⏳</span>
            <span>Time-Travel DB Replay</span>
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-800 text-purple-300 font-mono">
              {timeTravelEvents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('COLLUSION')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'COLLUSION'
                ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-lg shadow-red-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>💊</span>
            <span>Doctor Collusion Radar</span>
            {collusionRecords.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white font-bold">
                ₹{(totalCollusionLeakage / 1000).toFixed(0)}k
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('DUNNING')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'DUNNING'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50 shadow-lg shadow-orange-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>⚖️</span>
            <span>Dunning Friction Grid</span>
            {dunningPartners.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-500 text-slate-950 font-bold">
                {dunningPartners.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('VAULT')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'VAULT'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🔐</span>
            <span>Dual-Key Nuclear Vault</span>
          </button>
          <button
            onClick={() => setActiveTab('NABH')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'NABH'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-lg shadow-teal-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>📜</span>
            <span>NABH 5th Ed. Binder</span>
            {nabhBinder && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-teal-400 text-slate-950 font-bold">
                PASS
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('STEGO_DECODER')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'STEGO_DECODER'
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🕵️</span>
            <span>Forensic Stego Decoder</span>
            {decodedEvidence && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-fuchsia-500 text-white font-bold">
                LEAK MATCHED
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('HONEYTOKENS')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'HONEYTOKENS'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 shadow-lg shadow-yellow-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🪤</span>
            <span>Canary Deception Grid</span>
            {honeytokenIncidents.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-yellow-500 text-slate-950 font-bold">
                {honeytokenIncidents.length} Trips
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('TPA_SHIELD')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'TPA_SHIELD'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🛡️</span>
            <span>TPA Clawback Shield</span>
            {totalPotentialClawback > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-500 text-white font-bold">
                ₹{(totalPotentialClawback / 1000).toFixed(0)}k Risk
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('CARTEL_RADAR')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'CARTEL_RADAR'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-lg shadow-rose-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🩺</span>
            <span>Dark Cartel & Poaching</span>
            {cartelRecords.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-rose-500 text-white font-bold">
                {cartelRecords.length} Flagged
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('FIN_RECON')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'FIN_RECON'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>⚡</span>
            <span>Financial Self-Heal</span>
            {totalVariance !== 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-rose-500 text-white font-bold animate-pulse">
                ₹{Math.abs(totalVariance).toLocaleString()} Variance
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('WAR_MAP')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'WAR_MAP'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-lg shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🗺️</span>
            <span>3D Geospatial War Map</span>
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-sky-950 text-sky-300 font-mono">
              {geoNodes.length} Hubs
            </span>
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

      {/* =========================================================================
          TAB 6: OMNIPRESENT REAL-TIME WIRETAP & VIP PHI SENTINEL
         ========================================================================= */}
      {activeTab === 'WIRETAP' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">👁️</span>
                <h3 className="text-lg font-bold text-cyan-200">Omnipresent Real-Time Wiretap & VIP PHI Sentinel</h3>
                <Badge variant="warning">ZERO-LATENCY RING BUFFER</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time non-blocking packet wiretap across 142 partner hospitals. Instantly intercepts unauthorized chart views of VIPs and dignitaries.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={fetchWiretap} className="text-xs">
                Refresh Wiretap Feed
              </Button>
              <span className="px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
                Buffer: {wiretapPackets.length}/200 Pkts
              </span>
            </div>
          </div>

          {/* VIP Snoop Alerts Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🚨</span> VIP PHI Snooping Intercepts
                </h4>
                <p className="text-xs text-slate-400">Unauthorized chart lookups detected without active appointment tokens</p>
              </div>
              <Badge variant="danger">
                {snoopAlerts.filter(a => !a.is_locked).length} Active Violations
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Staff Actor</th>
                    <th className="py-2.5 px-3">Target VIP Patient</th>
                    <th className="py-2.5 px-3">Violation Reason</th>
                    <th className="py-2.5 px-3">Anomaly Score</th>
                    <th className="py-2.5 px-3">Biometric Access</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {snoopAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{alert.actor_name}</div>
                        <div className="text-[10px] text-slate-400">{alert.actor_role} • {alert.actor_id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-amber-300">{alert.patient_name}</div>
                        <div className="text-[10px] text-amber-500 font-mono">{alert.patient_vip_level}</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs text-slate-300">{alert.reason}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-800">
                          {alert.read_anomaly_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {alert.is_locked ? (
                          <Badge variant="danger">REVOKED (LOCKED)</Badge>
                        ) : (
                          <Badge variant="warning">ACTIVE UNRESTRICTED</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {!alert.is_locked ? (
                          <Button
                            variant="danger"
                            onClick={() => handleLockSnooper(alert)}
                            className="text-[10px] py-1 px-2.5 font-bold"
                          >
                            Revoke Biometrics
                          </Button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">ENFORCED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {snoopAlerts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-500">
                        No VIP PHI snooping incidents detected in the live packet window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Packet Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📡</span> Live Packet Stream (Fastify Non-Blocking Interceptor)
            </h4>
            <div className="bg-slate-950 rounded-xl p-3 max-h-60 overflow-y-auto font-mono text-[11px] space-y-1.5 border border-slate-800">
              {wiretapPackets.map((pkt) => (
                <div key={pkt.id} className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/60 hover:bg-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{new Date(pkt.timestamp).toLocaleTimeString()}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      pkt.method === 'GET' ? 'bg-blue-900/60 text-blue-300' :
                      pkt.method === 'POST' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-purple-900/60 text-purple-300'
                    }`}>
                      {pkt.method}
                    </span>
                    <span className="text-slate-200">{pkt.url}</span>
                    {pkt.isPhiAccess && (
                      <span className="px-1.5 py-0.2 text-[9px] rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        PHI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className={pkt.statusCode < 400 ? 'text-emerald-400' : 'text-rose-400'}>{pkt.statusCode}</span>
                    <span>{pkt.responseTimeMs}ms</span>
                  </div>
                </div>
              ))}
              {wiretapPackets.length === 0 && (
                <div className="text-center py-4 text-slate-600">Awaiting live incoming packets...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: TIME-TRAVEL DATABASE REWIND & VISUAL DELTA REPLAY ENGINE
         ========================================================================= */}
      {activeTab === 'TIME_TRAVEL' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⏳</span>
                <h3 className="text-lg font-bold text-purple-200">Time-Travel Database Rewind & Visual Delta Replay</h3>
                <Badge variant="neutral">POSTGRESQL 18.4 TEMPORAL TRACE</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Forensic time-travel replay inspecting point-in-time database mutations, line-item adjustments, and unapproved billing discounts.
              </p>
            </div>
            <Button variant="secondary" onClick={fetchTimeTravel} className="text-xs">
              Reload Timeline
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline selector */}
            <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white">Historical Mutation Events</h4>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {timeTravelEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedTimeTravel(evt)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all text-xs ${
                      selectedTimeTravel?.id === evt.id
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
                      <span>{evt.entity_type}</span>
                      <span>{new Date(evt.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="font-semibold text-slate-100">{evt.event_type.replace(/_/g, ' ')}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Actor: {evt.actor_name} ({evt.actor_role})</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Delta Inspector */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              {selectedTimeTravel ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                    <div>
                      <h4 className="text-base font-bold text-white">{selectedTimeTravel.event_type}</h4>
                      <p className="text-xs text-slate-400">
                        Entity: <span className="font-mono text-cyan-300">{selectedTimeTravel.entity_type} #{selectedTimeTravel.entity_id}</span> • Actor: <span className="text-amber-300">{selectedTimeTravel.actor_name}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Cryptographic Seal</div>
                      <div className="text-[11px] font-mono text-emerald-400">{selectedTimeTravel.audit_hash.slice(0, 20)}...</div>
                    </div>
                  </div>

                  {/* Before vs After Snapshots */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                        <span>BEFORE SNAPSHOT</span>
                        <span className="text-[10px] text-slate-500">Immutable Original</span>
                      </div>
                      <pre className="p-3 bg-slate-950 border border-rose-900/40 rounded-xl text-[11px] font-mono text-rose-200 max-h-72 overflow-y-auto">
                        {JSON.stringify(selectedTimeTravel.snapshot_before, null, 2)}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                        <span>AFTER SNAPSHOT</span>
                        <span className="text-[10px] text-slate-500">Mutated State</span>
                      </div>
                      <pre className="p-3 bg-slate-950 border border-emerald-900/40 rounded-xl text-[11px] font-mono text-emerald-200 max-h-72 overflow-y-auto">
                        {JSON.stringify(selectedTimeTravel.snapshot_after, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Reconstructed Delta */}
                  {selectedTimeTravel.reconstructed_delta && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-800/40 space-y-1">
                      <div className="text-xs font-bold text-purple-300">Reconstructed Forensic Delta</div>
                      <pre className="text-[11px] font-mono text-slate-300">
                        {JSON.stringify(selectedTimeTravel.reconstructed_delta, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 text-slate-500">Select a mutation event from the left panel to replay.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: DOCTOR-PHARMA COLLUSION & PHANTOM BILLING GRAPH RADAR
         ========================================================================= */}
      {activeTab === 'COLLUSION' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">💊</span>
                <h3 className="text-lg font-bold text-red-200">Doctor-Pharma Collusion & Phantom Billing Graph Radar</h3>
                <Badge variant="danger">ANTI-KICKBACK SENTINEL</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitors prescription volume against pharmaceutical sponsorship graphs. Automatically enforces generic molecule substitutions when collusion risk exceeds threshold.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={fetchCollusion} className="text-xs">
                Refresh Radar
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">High-Risk Clinicians</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {collusionRecords.length}
              </div>
              <span className="text-[10px] text-slate-500">Flagged by Bayesian Kickback Graph</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Monthly Out-of-Pocket Leakage</span>
              <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                ₹{totalCollusionLeakage.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Excess cost imposed on patients</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Statutory Standard</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                NMC Ethics 6.8
              </div>
              <span className="text-[10px] text-slate-500">Mandatory Generic Prescription Policy</span>
            </div>
          </div>

          {/* Collusion Records Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white">Clinician Kickback & Phantom Molecule Prescriptions</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Clinician & Specialty</th>
                    <th className="py-2.5 px-3">Partner Facility</th>
                    <th className="py-2.5 px-3">Branded vs Generic Molecule</th>
                    <th className="py-2.5 px-3">Scripts / Month</th>
                    <th className="py-2.5 px-3">Risk Score</th>
                    <th className="py-2.5 px-3">Monthly Leakage</th>
                    <th className="py-2.5 px-3">Founder Safeguard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {collusionRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{rec.doctor_name}</div>
                        <div className="text-[10px] text-slate-400">{rec.specialty}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{rec.hospital_name}</td>
                      <td className="py-3 px-3">
                        <div className="text-rose-400 font-semibold">{rec.branded_molecule_name}</div>
                        <div className="text-[10px] text-emerald-400">Alt: {rec.generic_alternative_name}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200">{rec.monthly_branded_scripts_count} scripts</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-800">
                          {rec.collusion_risk_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-300">
                        ₹{Number(rec.monthly_kickback_leakage_inr).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        {rec.mandate_generic_substitution ? (
                          <Badge variant="success">GENERIC ENFORCED</Badge>
                        ) : (
                          <Button
                            variant="primary"
                            onClick={() => handleRestrictPrescription(rec)}
                            className="text-[10px] py-1 px-2.5 bg-red-600 hover:bg-red-700 text-white font-bold"
                          >
                            Mandate Generic Substitution
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 9: PROGRESSIVE DUNNING FRICTION & REVENUE RECOVERY GRID
         ========================================================================= */}
      {activeTab === 'DUNNING' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-orange-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚖️</span>
                <h3 className="text-lg font-bold text-orange-200">Progressive Dunning Friction & Revenue Recovery Grid</h3>
                <Badge variant="warning">ZERO HARD CUTOFF REVENUE GUARD</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Progressive friction ladder ensuring B2B subscription debt recovery without catastrophic hospital operational shutdowns.
              </p>
            </div>
            <Button variant="secondary" onClick={fetchDunning} className="text-xs">
              Refresh Dunning Pipeline
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Overdue ARR at Risk</span>
              <div className="text-2xl font-bold text-orange-400 mt-1 font-mono">
                ₹{totalOverdueArr.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Across delinquent partner facilities</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Delinquent Facilities</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {dunningPartners.length}
              </div>
              <span className="text-[10px] text-slate-500">Enrolled in progressive friction tiers</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Emergency Exemption</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                100% Protected
              </div>
              <span className="text-[10px] text-slate-500">ER and Trauma bypass all dunning gates</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white">Delinquent Hospital Partners & Dynamic Friction Ladder</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Partner Facility</th>
                    <th className="py-2.5 px-3">Tier</th>
                    <th className="py-2.5 px-3">Overdue Amount</th>
                    <th className="py-2.5 px-3">Days Overdue</th>
                    <th className="py-2.5 px-3">Current Friction Tier</th>
                    <th className="py-2.5 px-3">1-Click EMI Rehabilitation</th>
                    <th className="py-2.5 px-3">Apply Friction Step</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {dunningPartners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-semibold text-slate-200">{partner.hospital_name}</td>
                      <td className="py-3 px-3 text-slate-400">{partner.partner_tier}</td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-300">
                        ₹{Number(partner.total_overdue_amount_inr).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-300">{partner.days_overdue} days</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          partner.current_friction_tier === 'NONE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          partner.current_friction_tier === 'TIER_1_WATERMARK' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          partner.current_friction_tier === 'TIER_2_THROTTLING' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {partner.current_friction_tier}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {partner.rehabilitation_emi_active ? (
                          <Badge variant="success">EMI ACTIVE</Badge>
                        ) : (
                          <span className="text-[10px] text-slate-500">Standard Dunning</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApplyDunningFriction(partner, 'TIER_1_WATERMARK')}
                            className="px-2 py-1 text-[10px] rounded bg-amber-900/40 hover:bg-amber-900/80 text-amber-200 border border-amber-700/60"
                          >
                            T1 Watermark
                          </button>
                          <button
                            onClick={() => handleApplyDunningFriction(partner, 'TIER_2_THROTTLING')}
                            className="px-2 py-1 text-[10px] rounded bg-orange-900/40 hover:bg-orange-900/80 text-orange-200 border border-orange-700/60"
                          >
                            T2 Throttle
                          </button>
                          <button
                            onClick={() => handleApplyDunningFriction(partner, 'TIER_3_EXPORT_FREEZE')}
                            className="px-2 py-1 text-[10px] rounded bg-rose-900/40 hover:bg-rose-900/80 text-rose-200 border border-rose-700/60"
                          >
                            T3 Freeze
                          </button>
                          <button
                            onClick={() => handleApplyDunningFriction(partner, 'NONE')}
                            className="px-2 py-1 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            Clear
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 10: ZERO-TRUST DUAL-KEY NUCLEAR LAUNCH VAULT
         ========================================================================= */}
      {activeTab === 'VAULT' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔐</span>
                <h3 className="text-lg font-bold text-amber-200">Zero-Trust Dual-Key Nuclear Launch Vault</h3>
                <Badge variant="warning">MULTI-PARTY PHYSICAL CONSENSUS</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                High-blast-radius actions (mass cryptographic re-keying, audit purging, catastrophic shutdowns) require two independent cryptographic signers and hardware TOTP consensus.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 1: Request Destructive Action */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>1️⃣</span> Primary Signer Action Initiation
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Action Type</label>
                  <select
                    value={vaultActionType}
                    onChange={(e) => setVaultActionType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="MASS_EMR_ENCRYPTION_KEY_ROTATION">MASS_EMR_ENCRYPTION_KEY_ROTATION</option>
                    <option value="PURGE_ALL_AUDIT_LOGS">PURGE_ALL_AUDIT_LOGS</option>
                    <option value="GLOBAL_TENANT_SHUTDOWN">GLOBAL_TENANT_SHUTDOWN</option>
                    <option value="EMERGENCY_DATA_EXFILTRATION_KILL">EMERGENCY_DATA_EXFILTRATION_KILL</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Target Blast Scope</label>
                  <input
                    type="text"
                    value={vaultTargetScope}
                    onChange={(e) => setVaultTargetScope(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Statutory & Operational Justification</label>
                  <textarea
                    rows={3}
                    value={vaultJustification}
                    onChange={(e) => setVaultJustification(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  />
                </div>

                <Button
                  variant="primary"
                  onClick={handleRequestVaultAction}
                  disabled={isRequestingVault}
                  className="w-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
                >
                  {isRequestingVault ? 'Issuing Vault Challenge...' : 'Generate Dual-Key Cryptographic Challenge'}
                </Button>
              </div>
            </div>

            {/* Step 2: Co-Signer Dual Key Consensus */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>2️⃣</span> Secondary Signer Consensus Chamber
              </h4>

              {vaultChallenge ? (
                <div className="space-y-4 p-4 rounded-xl bg-amber-950/40 border border-amber-500/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">ACTIVE CHALLENGE PENDING</span>
                    <span className="text-[10px] font-mono text-amber-400">{vaultChallenge.challengeId.slice(0, 16)}...</span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-300 font-semibold">{vaultChallenge.actionType}</div>
                    <div className="text-[11px] text-slate-400">Scope: {vaultChallenge.targetScope}</div>
                    <div className="text-[11px] font-mono text-amber-300 bg-slate-950 p-2 rounded border border-slate-800">
                      Challenge Code: {vaultChallenge.challengeCode}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-amber-900/60">
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold">Secondary Co-Signer Admin ID</label>
                      <input
                        type="text"
                        value={vaultSecondSignerId}
                        onChange={(e) => setVaultSecondSignerId(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold">Secondary Co-Signer Name</label>
                      <input
                        type="text"
                        value={vaultSecondSignerName}
                        onChange={(e) => setVaultSecondSignerName(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold">Hardware TOTP Token (6 Digits)</label>
                      <input
                        type="text"
                        value={vaultTotp}
                        onChange={(e) => setVaultTotp(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 font-mono text-amber-400 text-xs font-bold"
                      />
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleAuthorizeVault}
                      disabled={isAuthorizingVault}
                      className="w-full text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                    >
                      {isAuthorizingVault ? 'Authorizing Dual Key...' : 'Co-Authorize & Execute Dual-Key Payload'}
                    </Button>
                  </div>
                </div>
              ) : vaultAuthResult ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <span>✅</span>
                    <span>DUAL-KEY EXECUTION AUTHORIZED</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Action: <span className="font-semibold text-white">{vaultAuthResult.actionType}</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 bg-slate-950 p-2.5 rounded border border-slate-800 break-all">
                    Auth Token: {vaultAuthResult.executionAuthToken}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Timestamp: {new Date(vaultAuthResult.authorizedAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 text-xs">
                  No pending vault challenge. Initiate an action from the primary signer form to begin.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 11: 1-CLICK AUTONOMOUS NABH 5TH EDITION STATUTORY BINDER
         ========================================================================= */}
      {activeTab === 'NABH' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <h3 className="text-lg font-bold text-teal-200">1-Click Autonomous NABH 5th Edition Statutory Binder Generator</h3>
                <Badge variant="success">NABH AUDIT READY</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Aggregates real-time autoclave spore validation logs, needle-stick registers, bio-medical waste barcoding manifests, and biomedical calibration certificates into an immutable inspection binder.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compiler Parameters */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white">Inspection Audit Parameters</h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300">Tenant ID</label>
                  <input
                    type="text"
                    value={nabhTenantId}
                    onChange={(e) => setNabhTenantId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300">Hospital Facility</label>
                  <input
                    type="text"
                    value={nabhHospitalName}
                    onChange={(e) => setNabhHospitalName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300">Audit Cycle</label>
                  <input
                    type="text"
                    value={nabhAuditCycle}
                    onChange={(e) => setNabhAuditCycle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300">NABH Lead Assessor</label>
                  <input
                    type="text"
                    value={nabhInspectorName}
                    onChange={(e) => setNabhInspectorName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                  />
                </div>

                <Button
                  variant="primary"
                  onClick={handleCompileNabhBinder}
                  disabled={isCompilingNabh}
                  className="w-full text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 mt-2"
                >
                  {isCompilingNabh ? 'Compiling Live Statutory Evidence...' : 'Compile Full Statutory Binder (1-Click)'}
                </Button>
              </div>
            </div>

            {/* Compiled Binder Display */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              {nabhBinder ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success">NABH 5TH EDITION PASS</Badge>
                        <span className="text-xs font-mono font-bold text-teal-300">Score: {nabhBinder.nabh_compliance_score}%</span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">{nabhBinder.hospital_name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Cryptographic Immutable Seal</div>
                      <div className="text-[11px] font-mono text-teal-400">{nabhBinder.immutable_seal_hash.slice(0, 24)}...</div>
                    </div>
                  </div>

                  {/* 4 Statutory Chapters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-slate-200 flex items-center justify-between">
                        <span>Chapter 1: Sterilization & Autoclave</span>
                        <span className="text-[10px] text-emerald-400 font-mono">100% PASS</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Biological indicator <strong className="text-slate-200">Geobacillus stearothermophilus</strong> verified sterile at 134°C / 30 psi.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-slate-200 flex items-center justify-between">
                        <span>Chapter 2: Needle-Stick Register</span>
                        <span className="text-[10px] text-emerald-400 font-mono">PEP PROTOCOL</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        100% adherence to post-exposure prophylaxis initiation &lt; 2 hours with Anti-HBs titer tracking.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-slate-200 flex items-center justify-between">
                        <span>Chapter 3: BMW Manifests</span>
                        <span className="text-[10px] text-emerald-400 font-mono">CPCB SYNCED</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Barcoded weight reconciliation across Yellow, Red, Blue, and White puncture-proof bins.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-slate-200 flex items-center justify-between">
                        <span>Chapter 4: Equipment Calibration</span>
                        <span className="text-[10px] text-emerald-400 font-mono">NABL TRACEABLE</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Defibrillators, ventilators, autoclaves certified with valid calibration stamps. 0 expired assets.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs">
                  Click &quot;Compile Full Statutory Binder (1-Click)&quot; to aggregate live cross-departmental evidence.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 12: FORENSIC STEGANOGRAPHY & INVISIBLE SCREEN-LEAK DECODER
         ========================================================================= */}
      {activeTab === 'STEGO_DECODER' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-fuchsia-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🕵️</span>
                <h3 className="text-lg font-bold text-fuchsia-200">Forensic Steganography & Invisible Screen-Leak Trap</h3>
                <Badge variant="warning">SUB-PERCEPTUAL MICRO-DOT ENCODING</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Sub-perceptually encodes staff credentials, IP, and session hashes into every confidential screen. Unmask mobile phone camera photos leaked to social media or competitors.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={fetchStegoPattern} className="text-xs">
                Regenerate Pattern
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Steganographic Pattern Canvas */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🛡️</span> Active Steganographic Screen Watermark
              </h4>
              <p className="text-xs text-slate-400">
                This watermark is embedded invisibly across all patient records and EMR billing charts.
              </p>

              {stegoPattern && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Target Session Actor:</span>
                      <span className="text-fuchsia-300 font-bold">{stegoPattern.actorName} ({stegoPattern.actorId})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Workstation IP:</span>
                      <span className="font-mono text-cyan-300">{stegoPattern.clientIp}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Steganographic Salt:</span>
                      <span className="font-mono text-amber-300">{stegoPattern.stegoSalt}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono break-all pt-1 border-t border-slate-800">
                      Hash: {stegoPattern.fingerprintHash}
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-slate-950 border border-fuchsia-900/40 relative overflow-hidden flex items-center justify-center min-h-[140px]">
                    <div
                      className="absolute inset-0 pointer-events-none opacity-40"
                      style={{ backgroundImage: stegoPattern.cssMicroPattern }}
                    />
                    <div className="relative z-10 text-center">
                      <div className="text-xs text-slate-300 font-semibold">CONFIDENTIAL EMR PATIENT RECORD CANVAS</div>
                      <div className="text-[11px] text-fuchsia-400 mt-1">Sub-perceptual micro-dot matrix active (0.015 alpha)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drag & Drop Forensic Decoder */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔍</span> Leaked Photo / Screenshot Forensic Decoder
              </h4>
              <p className="text-xs text-slate-400">
                Upload a mobile camera photo of an EMR screen leaked on social media to decode the culprit.
              </p>

              <div className="border-2 border-dashed border-slate-700 hover:border-fuchsia-500/60 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-950/60">
                <div className="text-3xl mb-2">📸</div>
                <div className="text-xs font-semibold text-slate-200">Drag & Drop Leaked Screenshot / Photo</div>
                <div className="text-[10px] text-slate-500 mt-1">Extracts micro-modulations & kerning shifts</div>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    onClick={handleDecodeStegoImage}
                    disabled={isDecodingStego}
                    className="text-xs bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold"
                  >
                    {isDecodingStego ? 'Extracting Micro-Modulations...' : 'Audit Sample Leaked Photo'}
                  </Button>
                </div>
              </div>

              {decodedEvidence && (
                <div className="p-4 rounded-xl bg-fuchsia-950/40 border border-fuchsia-500/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fuchsia-300 flex items-center gap-1.5">
                      <span>🎯</span> LEAKER IDENTIFIED WITH 99.85% CONFIDENCE
                    </span>
                    <Badge variant="danger">CONFIRMED BREACH</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-fuchsia-900/40">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Culprit Staff Name:</span>
                      <strong className="text-slate-100">{decodedEvidence.decodedActorName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Staff Employee ID:</span>
                      <strong className="text-amber-400 font-mono">{decodedEvidence.decodedActorId}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Workstation IP:</span>
                      <strong className="text-cyan-300 font-mono">{decodedEvidence.workstationIp}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Leaked Patient Chart:</span>
                      <strong className="text-rose-400 font-mono">{decodedEvidence.targetPatientChartId}</strong>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="danger"
                      onClick={() => alert(`Staff ${decodedEvidence.decodedActorName} suspended. Forensic evidence file generated for Cyber Police.`)}
                      className="w-full text-xs font-bold py-1.5"
                    >
                      Instant Biometric Revocation & File Cyber Docket
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 13: ACTIVE CANARY / HONEYTOKEN DECEPTION GRID
         ========================================================================= */}
      {activeTab === 'HONEYTOKENS' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-yellow-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🪤</span>
                <h3 className="text-lg font-bold text-yellow-200">Active Canary / Honeytoken Deception Grid</h3>
                <Badge variant="warning">INSIDER SABOTAGE TRIPWIRE</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Decoy VIP patient records and database credentials planted across hospital databases. When rogue internal actors query them, silent sirens lock access.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleInjectCanaryTrap}
              disabled={isInjectingTrap}
              className="text-xs bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold"
            >
              {isInjectingTrap ? 'Deploying Decoy...' : '+ Deploy Canary Decoy Trap'}
            </Button>
          </div>

          {/* Active Traps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Active Canary Decoys Planted</span>
                <span className="text-xs text-yellow-400 font-mono">{honeytokenTraps.length} Deployed</span>
              </h4>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {honeytokenTraps.map((trap) => (
                  <div key={trap.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-yellow-300 font-semibold">{trap.decoy_entity_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950 text-yellow-300 border border-yellow-700">
                        {trap.status}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px]">Type: {trap.token_type}</div>
                    <div className="text-slate-500 text-[10px]">Tripped: {trap.trip_count} times</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tripped Incidents Log */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Tripped Intrusion Incidents</span>
                <Badge variant="danger">{honeytokenIncidents.length} Captured</Badge>
              </h4>

              <div className="space-y-3 max-h-72 overflow-y-auto">
                {honeytokenIncidents.map((inc) => (
                  <div key={inc.id} className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/60 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300">{inc.actor_name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{inc.client_ip}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                      {inc.query_context}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        {new Date(inc.trip_timestamp).toLocaleTimeString()}
                      </span>
                      {inc.is_isolated ? (
                        <Badge variant="danger">ISOLATED & LOCKED</Badge>
                      ) : (
                        <Button
                          variant="danger"
                          onClick={() => handleIsolateIntruder(inc.actor_id)}
                          className="text-[10px] py-1 px-2.5 font-bold"
                        >
                          Isolate & Revoke Access
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {honeytokenIncidents.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No canary tripwire breaches detected. All decoy tokens secure.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 14: AUTONOMOUS TPA INSURANCE CLAWBACK SHIELD
         ========================================================================= */}
      {activeTab === 'TPA_SHIELD' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h3 className="text-lg font-bold text-blue-200">Autonomous TPA Insurance Clawback Shield</h3>
                <Badge variant="success">IRDAI 2024 COMPLIANT</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Audits insurance claims pre-submission against 5,000+ insurer rejection patterns. Auto-drafts statutory legal rebuttals to defeat post-facto deductions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={fetchTpaStream} className="text-xs">
                Refresh Claims Stream
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Pre-Audit Claims Monitored</span>
              <div className="text-2xl font-bold text-blue-400 mt-1">{tpaClaims.length}</div>
              <span className="text-[10px] text-slate-500">Star Health, HDFC ERGO, Care</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Potential Clawback Risk</span>
              <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                ₹{totalPotentialClawback.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Flagged before submission</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Statutory Rebuttals</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{tpaRebuttals.length} Dispatched</div>
              <span className="text-[10px] text-slate-500">IRDAI Section 23 Legal Notices</span>
            </div>
          </div>

          {/* Pre-Audit Claims Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white">Pre-Submission TPA Risk & ICD-10 Discrepancy Audits</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Claim & Insurer</th>
                    <th className="py-2.5 px-3">Patient ID</th>
                    <th className="py-2.5 px-3">Claim Amount</th>
                    <th className="py-2.5 px-3">Clawback Risk</th>
                    <th className="py-2.5 px-3">ICD-10 Discrepancy</th>
                    <th className="py-2.5 px-3">Statutory Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tpaClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{claim.claim_id}</div>
                        <div className="text-[10px] text-blue-400">{claim.insurer_name}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{claim.patient_id}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-200">
                        ₹{Number(claim.claim_amount_inr).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-rose-400">
                          ₹{Number(claim.potential_clawback_inr).toLocaleString()}
                        </span>
                        <div className="text-[10px] text-slate-400">Risk Score: {claim.pre_audit_risk_score}/100</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs text-slate-300 text-[11px]">
                        {claim.flagged_icd10_mismatches?.discrepancy || 'Clinical procedure documentation audit pending'}
                      </td>
                      <td className="py-3 px-3">
                        <Button
                          variant="primary"
                          onClick={() => handleGenerateTpaRebuttal(claim)}
                          disabled={isGeneratingRebuttal}
                          className="text-[10px] py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                          Generate IRDAI Rebuttal
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 15: SECRET DOCTOR REFERRAL CARTEL & DARK POACHING RADAR
         ========================================================================= */}
      {activeTab === 'CARTEL_RADAR' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🩺</span>
                <h3 className="text-lg font-bold text-rose-200">Secret Doctor Referral Cartel & Dark Poaching Radar</h3>
                <Badge variant="danger">PATIENT CONVERSION ANOMALY SENTINEL</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitors clinicians with abnormal drop-offs between OPD consultations and internal diagnostics/surgeries, uncovering secret patient diversion to external competitor clinics.
              </p>
            </div>
            <Button variant="secondary" onClick={fetchCartelRadar} className="text-xs">
              Refresh Cartel Graph
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Clinicians Under Investigation</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">{cartelRecords.length}</div>
              <span className="text-[10px] text-slate-500">Neurosurgery, Gastroenterology</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Monthly Estimated Poaching Loss</span>
              <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                ₹{totalPoachingLoss.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Diverted to outside labs & clinics</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Statutory Governance</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">100% Tracked</div>
              <span className="text-[10px] text-slate-500">NMC Non-Compete & Referral Compliance</span>
            </div>
          </div>

          {/* Cartel Records Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white">Suspected Referral Diversions to Rival Private Facilities</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Clinician & Specialty</th>
                    <th className="py-2.5 px-3">OPD Consults</th>
                    <th className="py-2.5 px-3">Internal Conversion %</th>
                    <th className="py-2.5 px-3">Dept Benchmark %</th>
                    <th className="py-2.5 px-3">Suspected Destination Entity</th>
                    <th className="py-2.5 px-3">Monthly Loss</th>
                    <th className="py-2.5 px-3">Governance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cartelRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{rec.doctor_name}</div>
                        <div className="text-[10px] text-slate-400">{rec.specialty}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200">{rec.opd_consult_count} patients</td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-400">
                        {rec.internal_diagnostic_conversion_pct}%
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{rec.benchmark_dept_conversion_pct}%</td>
                      <td className="py-3 px-3 text-slate-300 text-[11px]">{rec.suspected_destination_entity}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-300">
                        ₹{Number(rec.estimated_monthly_poaching_loss_inr).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        {rec.status === 'UNDER_FORENSIC_INVESTIGATION' ? (
                          <Badge variant="danger">UNDER AUDIT</Badge>
                        ) : (
                          <Button
                            variant="danger"
                            onClick={() => handleFlagCartelDoctor(rec)}
                            className="text-[10px] py-1 px-2.5 font-bold"
                          >
                            Flag for Audit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 16: ZERO-ERROR FINANCIAL SELF-HEALING & SPLIT-BRAIN LEDGER RECONCILER
         ========================================================================= */}
      {activeTab === 'FIN_RECON' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="text-lg font-bold text-emerald-200">Zero-Error Financial Self-Healing & Split-Brain Reconciler</h3>
                <Badge variant="success">60-SECOND INVARIANT AUDIT</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Continuous double-entry ledger reconciliation between cash counters, POS card terminals, and online gateway webhooks. Automatically heals split-brain state discrepancies.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={handleAutoHealRecon}
                disabled={isAutoHealing}
                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
              >
                {isAutoHealing ? 'Reconciling Webhooks...' : '⚡ Auto-Heal All Split-Brain Ledgers'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Counters Audited</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{reconCounters.length}</div>
              <span className="text-[10px] text-slate-500">OPD & Emergency Billing Shifts</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Net Ledger Variance</span>
              <div className={`text-2xl font-bold mt-1 font-mono ${totalVariance === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{totalVariance.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">{totalVariance === 0 ? 'All Counters Balanced' : 'Unreconciled Shift Difference'}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Reconciliation Daemon</span>
              <div className="text-2xl font-bold text-cyan-400 mt-1">ACTIVE (60s)</div>
              <span className="text-[10px] text-slate-500">Double-entry accounting invariant enforced</span>
            </div>
          </div>

          {/* Counter Ledgers Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white">Shift Settlement Ledgers & Cash Drawer Variance</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Counter & Cashier</th>
                    <th className="py-2.5 px-3">Physical Cash</th>
                    <th className="py-2.5 px-3">POS Swipes</th>
                    <th className="py-2.5 px-3">Online Gateway</th>
                    <th className="py-2.5 px-3">System Billed</th>
                    <th className="py-2.5 px-3">Variance</th>
                    <th className="py-2.5 px-3">Reconciliation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reconCounters.map((counter) => (
                    <tr key={counter.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{counter.counter_id}</div>
                        <div className="text-[10px] text-slate-400">{counter.cashier_name}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200">
                        ₹{Number(counter.physical_cash_reported_inr).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200">
                        ₹{Number(counter.pos_terminal_settled_inr).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200">
                        ₹{Number(counter.online_gateway_settled_inr).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        ₹{Number(counter.system_billed_total_inr).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={Number(counter.variance_inr) === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          ₹{Number(counter.variance_inr).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          counter.reconciliation_status === 'BALANCED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          counter.reconciliation_status === 'AUTO_HEALED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {counter.reconciliation_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 17: TACTICAL GEOSPATIAL HEALTHCARE NORAD WAR ROOM (3D MATRIX)
         ========================================================================= */}
      {activeTab === 'WAR_MAP' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-sky-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <h3 className="text-lg font-bold text-sky-200">Tactical Geospatial Healthcare NORAD War Room</h3>
                <Badge variant="warning">BLOOMBERG-GRADE 3D TELEMETRY</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pan-India geospatial command matrix tracking clinical capacity, ICU oxygen burn rates, 5G ambulances in transit, and per-second revenue velocity across national hospital hubs.
              </p>
            </div>
            <Button variant="secondary" onClick={fetchGeoNodes} className="text-xs">
              Refresh Sat-Telemetry
            </Button>
          </div>

          {/* Interactive Geospatial Hub Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geoNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => setSelectedGeoNode(node)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedGeoNode?.id === node.id
                    ? 'bg-sky-950/60 border-sky-500 shadow-xl shadow-sky-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white text-sm">{node.city}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{node.state}</span>
                </div>

                <div className="text-xs text-slate-300 font-semibold mb-3">{node.hospitalName}</div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Active Beds:</span>
                    <strong className="text-cyan-300 font-mono">{node.activeBeds} Beds</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ICU Occupancy:</span>
                    <strong className={node.icuOccupancyPct > 90 ? 'text-rose-400 font-mono' : 'text-amber-400 font-mono'}>
                      {node.icuOccupancyPct}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Oxygen Burn Rate:</span>
                    <strong className="text-emerald-400 font-mono">{node.oxygenBurnRateLpm} LPM</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Today GMV:</span>
                    <strong className="text-slate-100 font-mono">₹{(node.gmvTodayInr / 100000).toFixed(1)}L</strong>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">5G Ambulances Active:</span>
                  <span className="font-mono font-bold text-amber-400">{node.active5gAmbulances} in transit</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tactical Hub Detail Card */}
          {selectedGeoNode && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-sky-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📡</span> Tactical Telemetry Terminal: {selectedGeoNode.hospitalName} ({selectedGeoNode.city})
                  </h4>
                  <p className="text-xs text-slate-400">
                    GPS Coordinates: {selectedGeoNode.lat}° N, {selectedGeoNode.lng}° E • Satellite uplink active
                  </p>
                </div>
                <Badge variant={selectedGeoNode.status === 'NORMAL' ? 'success' : 'danger'}>
                  {selectedGeoNode.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Bed Utilization</span>
                  <div className="text-xl font-bold text-cyan-300 mt-1">{selectedGeoNode.activeBeds} Beds</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Emergency surge capacity: +40 beds</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Liquid Oxygen Tank</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">94.2% Level</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{selectedGeoNode.oxygenBurnRateLpm} LPM continuous burn</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">5G STEMI Fleet</span>
                  <div className="text-xl font-bold text-amber-400 mt-1">{selectedGeoNode.active5gAmbulances} In Transit</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Golden-hour triage linked</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Billing Velocity</span>
                  <div className="text-xl font-bold text-white mt-1">₹{(selectedGeoNode.gmvTodayInr / 100000).toFixed(1)}L</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Real-time GMV per second</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
