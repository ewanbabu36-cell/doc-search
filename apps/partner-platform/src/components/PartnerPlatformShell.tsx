import { GlobalCommandPalette } from './common/GlobalCommandPalette.js';
import { OptimisticSyncBadge } from './common/OptimisticSyncBadge.js';
import { PwaInstallButton } from './common/PwaInstallButton.js';
import { PwaInstallBanner } from './common/PwaInstallBanner.js';
import { DomainErrorBoundary } from './common/DomainErrorBoundary.js';
import { parseCurrentUrl, updateBrowserUrlWithoutReload } from '../utils/urlRouter.js';
import {
  normalizeFacilityProfile,
  isHospitalFreeTier,
  isHospitalModuleLocked
} from '@docsearch/shared-core';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { encounterService } from '../services/encounter-service.js';

// Lazy-loaded secondary modals & drawers for minimal initial partner platform shell bundle
const UniversalAccountSettingsModal = React.lazy(() => import('./common/UniversalAccountSettingsModal.js').then(m => ({ default: m.UniversalAccountSettingsModal })));
const PartnerAccountPlanModal = React.lazy(() => import('./common/PartnerAccountPlanModal.js').then(m => ({ default: m.PartnerAccountPlanModal })));
const ThemeStudioModal = React.lazy(() => import('./common/ThemeStudioModal.js').then(m => ({ default: m.ThemeStudioModal })));
const FastOpdRegistrationDrawer = React.lazy(() => import('./common/FastOpdRegistrationDrawer.js').then(m => ({ default: m.FastOpdRegistrationDrawer })));
const AllHospitalModulesDrawer = React.lazy(() => import('./common/AllHospitalModulesDrawer.js').then(m => ({ default: m.AllHospitalModulesDrawer })));
const HospitalPlanUpgradeModal = React.lazy(() => import('./common/HospitalPlanUpgradeModal.js').then(m => ({ default: m.HospitalPlanUpgradeModal })));
const HospitalFeatureUpgradeShowcase = React.lazy(() => import('./common/HospitalFeatureUpgradeShowcase.js').then(m => ({ default: m.HospitalFeatureUpgradeShowcase })));
const OfflineLicenseActivationModal = React.lazy(() => import('./dialogs/OfflineLicenseActivationModal.js').then(m => ({ default: m.OfflineLicenseActivationModal })));
const KeyboardShortcutsModal = React.lazy(() => import('./common/KeyboardShortcutsModal.js').then(m => ({ default: m.KeyboardShortcutsModal })));
import {
  AppShell,
  Header,
  Sidebar,
  ContentArea,
  useTheme,
  themes,
  AdaptiveBottomNav,
  AdaptiveProvider,
  EwanSystemTrainer,
  DocSearch3DLogoLoader,
  LiveSyncRefreshButton
} from '@docsearch/ui-kit';
import type { ActivePatientTab } from './PatientRegistrationDomainManager.js';
import type { ActivePharmacyTab } from './PharmacyDomainManager.js';
import type { InpatientTab } from './InpatientDomainManager.js';
import type { ActiveInvestigationTab } from './ClinicalInvestigationDomainManager.js';

// Lazy-loaded domain managers and activity hubs for instantaneous partner shell bundle boot
const PartnerFoundationDomainManager = React.lazy(() => import('./PartnerFoundationDomainManager.js').then(m => ({ default: m.PartnerFoundationDomainManager })));
const StaffAdministrationDomainManager = React.lazy(() => import('./StaffAdministrationDomainManager.js').then(m => ({ default: m.StaffAdministrationDomainManager })));
const DoctorRosterDomainManager = React.lazy(() => import('./DoctorRosterDomainManager.js').then(m => ({ default: m.DoctorRosterDomainManager })));
const PatientRegistrationDomainManager = React.lazy(() => import('./PatientRegistrationDomainManager.js').then(m => ({ default: m.PatientRegistrationDomainManager })));
const EncounterDomainManager = React.lazy(() => import('./EncounterDomainManager.js').then(m => ({ default: m.EncounterDomainManager })));
const ClinicalConsultationDomainManager = React.lazy(() => import('./ClinicalConsultationDomainManager.js').then(m => ({ default: m.ClinicalConsultationDomainManager })));
const NurseVitalsTriageStationView = React.lazy(() => import('./views/NurseVitalsTriageStationView.js').then(m => ({ default: m.NurseVitalsTriageStationView })));
const ClinicalInvestigationDomainManager = React.lazy(() => import('./ClinicalInvestigationDomainManager.js').then(m => ({ default: m.ClinicalInvestigationDomainManager })));
const PharmacyDomainManager = React.lazy(() => import('./PharmacyDomainManager.js').then(m => ({ default: m.PharmacyDomainManager })));
const BillingDomainManager = React.lazy(() => import('./BillingDomainManager.js').then(m => ({ default: m.BillingDomainManager })));
const InsuranceClaimsDomainManager = React.lazy(() => import('./InsuranceClaimsDomainManager.js').then(m => ({ default: m.InsuranceClaimsDomainManager })));
const ProcurementDomainManager = React.lazy(() => import('./ProcurementDomainManager.js').then(m => ({ default: m.ProcurementDomainManager })));
const InpatientDomainManager = React.lazy(() => import('./InpatientDomainManager.js').then(m => ({ default: m.InpatientDomainManager })));
const OTDomainManager = React.lazy(() => import('./OTDomainManager.js').then(m => ({ default: m.OTDomainManager })));
const EmergencyDomainManager = React.lazy(() => import('./EmergencyDomainManager.js').then(m => ({ default: m.EmergencyDomainManager })));
const MRDDomainManager = React.lazy(() => import('./MRDDomainManager.js').then(m => ({ default: m.MRDDomainManager })));
const BloodBankDomainManager = React.lazy(() => import('./BloodBankDomainManager.js').then(m => ({ default: m.BloodBankDomainManager })));
const RadiologyDomainManager = React.lazy(() => import('./RadiologyDomainManager.js').then(m => ({ default: m.RadiologyDomainManager })));
const DietaryDomainManager = React.lazy(() => import('./DietaryDomainManager.js').then(m => ({ default: m.DietaryDomainManager })));
const AssetBiomedicalDomainManager = React.lazy(() => import('./AssetBiomedicalDomainManager.js').then(m => ({ default: m.AssetBiomedicalDomainManager })));
const QualityInfectionDomainManager = React.lazy(() => import('./QualityInfectionDomainManager.js').then(m => ({ default: m.QualityInfectionDomainManager })));
const ExecutiveCommandDomainManager = React.lazy(() => import('./ExecutiveCommandDomainManager.js').then(m => ({ default: m.ExecutiveCommandDomainManager })));
const AbdmFhirDomainManager = React.lazy(() => import('./AbdmFhirDomainManager.js').then(m => ({ default: m.AbdmFhirDomainManager })));
const AiCdssDomainManager = React.lazy(() => import('./AiCdssDomainManager.js').then(m => ({ default: m.AiCdssDomainManager })));
const AiChatAssistantDomainManager = React.lazy(() => import('./AiChatAssistantDomainManager.js').then(m => ({ default: m.AiChatAssistantDomainManager })));
const TelemedicineRpmDomainManager = React.lazy(() => import('./TelemedicineRpmDomainManager.js').then(m => ({ default: m.TelemedicineRpmDomainManager })));
const WhatsAppPortalDomainManager = React.lazy(() => import('./WhatsAppPortalDomainManager.js').then(m => ({ default: m.WhatsAppPortalDomainManager })));
const PathologyHomeActivityHub = React.lazy(() => import('./PathologyHomeActivityHub.js').then(m => ({ default: m.PathologyHomeActivityHub })));
const ClinicHomeActivityHub = React.lazy(() => import('./ClinicHomeActivityHub.js').then(m => ({ default: m.ClinicHomeActivityHub })));
const PharmacyHomeActivityHub = React.lazy(() => import('./PharmacyHomeActivityHub.js').then(m => ({ default: m.PharmacyHomeActivityHub })));
const DiagnosticCentreHomeActivityHub = React.lazy(() => import('./DiagnosticCentreHomeActivityHub.js').then(m => ({ default: m.DiagnosticCentreHomeActivityHub })));
const HospitalHomeActivityHub = React.lazy(() => import('./HospitalHomeActivityHub.js').then(m => ({ default: m.HospitalHomeActivityHub })));
const EnterpriseCommandHomeActivityHub = React.lazy(() => import('./EnterpriseCommandHomeActivityHub.js').then(m => ({ default: m.EnterpriseCommandHomeActivityHub })));
const PartnerAccountPlanView = React.lazy(() => import('./views/PartnerAccountPlanView.js').then(m => ({ default: m.PartnerAccountPlanView })));
const OpdOneFlowExpressView = React.lazy(() => import('./views/OpdOneFlowExpressView.js').then(m => ({ default: m.OpdOneFlowExpressView })));
const CentralHelpDeskExitHubView = React.lazy(() => import('./views/CentralHelpDeskExitHubView.js').then(m => ({ default: m.CentralHelpDeskExitHubView })));
const PreferredPartnerNetworkView = React.lazy(() => import('./views/PreferredPartnerNetworkView.js').then(m => ({ default: m.PreferredPartnerNetworkView })));
const HospitalInHouseClosedLoopView = React.lazy(() => import('./views/HospitalInHouseClosedLoopView.js').then(m => ({ default: m.HospitalInHouseClosedLoopView })));
import { isPartnerModuleAllowed, isModuleAllowedForPartnerProfile, isWorkspaceAllowedForPartnerProfile, isDestructiveActionAllowed, isHospitalExecutive, getRoleDefaultPerspective, isVoiceScribeAllowed, isClinicianRole } from '../utils/partnerRolePermissions.js';
const FrontDeskWorkstationView = React.lazy(() => import('./views/FrontDeskWorkstationView.js').then(m => ({ default: m.FrontDeskWorkstationView })));
const StaffOperationalRoleDashboard = React.lazy(() => import('./dashboard/StaffOperationalRoleDashboard.js').then(m => ({ default: m.StaffOperationalRoleDashboard })));
const RoleTailoredSmartDeskView = React.lazy(() => import('./views/RoleTailoredSmartDeskView.js').then(m => ({ default: m.RoleTailoredSmartDeskView })));
const GlobalFounderApprovalsModal = React.lazy(() => import('./common/GlobalFounderApprovalsModal.js').then(m => ({ default: m.GlobalFounderApprovalsModal })));
import { useFounderApproval } from '../hooks/useFounderApproval.js';
import { ForensicWatermarkOverlay } from './security/ForensicWatermarkOverlay.js';
import { IdleScreenPrivacyShield } from './security/IdleScreenPrivacyShield.js';
const ForensicLeakInvestigatorModal = React.lazy(() => import('./security/ForensicLeakInvestigatorModal.js').then(m => ({ default: m.ForensicLeakInvestigatorModal })));
const BreakGlassEmergencyModal = React.lazy(() => import('./security/BreakGlassEmergencyModal.js').then(m => ({ default: m.BreakGlassEmergencyModal })));
const PreLlmPhiRedactorStudioModal = React.lazy(() => import('./security/PreLlmPhiRedactorStudioModal.js').then(m => ({ default: m.PreLlmPhiRedactorStudioModal })));
import { ActivePatientContextBar } from './common/ActivePatientContextBar.js';
import { RealTimeHospitalActivityDock } from './common/RealTimeHospitalActivityDock.js';
const ThermalPrintPreviewModal = React.lazy(() => import('./common/ThermalPrintPreviewModal.js').then(m => ({ default: m.ThermalPrintPreviewModal })));
import type { ThermalPrintType } from './common/ThermalPrintPreviewModal.js';
const ProfileUpdateRequiredAlertModal = React.lazy(() => import('./common/ProfileUpdateRequiredAlertModal.js').then(m => ({ default: m.ProfileUpdateRequiredAlertModal })));
import { checkPartnerProfileStatus, type MissingProfileField } from '../utils/partnerProfileGuard.js';
import { getUnifiedPartnerProfile } from '../utils/roleProfileResolver.js';
const OpdQueueTvDisplayModal = React.lazy(() => import('./common/OpdQueueTvDisplayModal.js').then(m => ({ default: m.OpdQueueTvDisplayModal })));
const News2ClinicalAlertModal = React.lazy(() => import('./common/News2ClinicalAlertModal.js').then(m => ({ default: m.News2ClinicalAlertModal })));
const ScheduleH1DrugRegisterModal = React.lazy(() => import('./common/ScheduleH1DrugRegisterModal.js').then(m => ({ default: m.ScheduleH1DrugRegisterModal })));
const AbdmScanAndShareModal = React.lazy(() => import('./common/AbdmScanAndShareModal.js').then(m => ({ default: m.AbdmScanAndShareModal })));
import { DocSearchResponsiveBrand } from './common/DocSearchResponsiveBrand.js';
import { OptimisticActionToast } from './common/OptimisticActionToast.js';
import { AmbientVoiceScribeCapsule } from './common/AmbientVoiceScribeCapsule.js';
import { PatientSessionTabBar } from './common/PatientSessionTabBar.js';
import { HardwareStatusPill } from './common/HardwareStatusPill.js';
import { BarcodeLaserSweepOverlay } from './common/BarcodeLaserSweepOverlay.js';
import { OwnerPulseCockpit } from './common/OwnerPulseCockpit.js';
const PartnerOffersRewardsHub = React.lazy(() => import('./offers/PartnerOffersRewardsHub.js').then(m => ({ default: m.PartnerOffersRewardsHub })));
import type { ActivePatientSummary } from '../services/hospital-event-bus.js';

export type OrganizationWorkspaceType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'PHARMACY'
  | 'PATHOLOGY'
  | 'DIAGNOSTIC_CENTRE'
  | 'ENTERPRISE_COMMAND';

export type PartnerModuleKey =
  | 'my-smart-desk'
  | 'pathology-home'
  | 'clinic-home'
  | 'pharmacy-home'
  | 'diagnostic-home'
  | 'hospital-home'
  | 'enterprise-home'
  | 'executive-command-center'
  | 'ai-chat-assistant'
  | 'organization-foundation'
  | 'staff-administration'
  | 'doctor-management'
  | 'patient-registration'
  | 'encounters-visits'
  | 'clinical-consultation'
  | 'nurse-triage-station'
  | 'clinical-investigation'
  | 'pharmacy-medication'
  | 'inpatient-management'
  | 'operation-theatre-management'
  | 'emergency-trauma'
  | 'medical-records'
  | 'blood-bank-transfusion'
  | 'radiology-imaging'
  | 'dietary-kitchen-management'
  | 'asset-biomedical-maintenance'
  | 'quality-incident-infection-control'
  | 'abdm-fhir-gateway'
  | 'ai-clinical-cdss'
  | 'telemedicine-rpm'
  | 'whatsapp-patient-portal'
  | 'billing-revenue-cycle'
  | 'insurance-claims'
  | 'procurement-supply-chain'
  | 'offers-rewards-hub'
  | 'account-plan-features'
  | 'opd-one-flow-express'
  | 'help-desk-exit-hub'
  | 'preferred-partner-network'
  | 'hospital-closed-loop';

export type RolePerspective = 'AUTO' | 'DOCTOR' | 'NURSE' | 'FRONT_DESK' | 'PHARMACY' | 'LAB' | 'BILLING' | 'ADMIN';

import type { HospitalStaffUser } from './auth/HospitalStaffLogin.js';

export interface PartnerPlatformShellProps {
  currentUser?: HospitalStaffUser | undefined;
  onLogout?: (() => void) | undefined;
}

export const MODULE_METADATA: Record<PartnerModuleKey, { title: string; icon: string }> = {
  'my-smart-desk': { title: 'My Smart Desk', icon: '⚡' },
  'hospital-closed-loop': { title: 'In-House Closed-Loop Pipeline', icon: '🔄' },
  'opd-one-flow-express': { title: 'OPD 1-Flow Express', icon: '⚡' },
  'help-desk-exit-hub': { title: 'Central Help Desk & Exit Hub', icon: '🖨️' },
  'preferred-partner-network': { title: 'Preferred Partner Network (Tie-Ups)', icon: '🤝' },
  'pathology-home': { title: 'Pathology Overview', icon: '🔬' },
  'clinic-home': { title: 'Clinic Overview', icon: '🏥' },
  'pharmacy-home': { title: 'Pharmacy Overview', icon: '💊' },
  'diagnostic-home': { title: 'Diagnostic Overview', icon: '🩻' },
  'hospital-home': { title: 'Hospital Overview', icon: '🏢' },
  'enterprise-home': { title: 'Enterprise Command Overview', icon: '🌐' },
  'executive-command-center': { title: 'Executive Command Center', icon: '🏛️' },
  'ai-chat-assistant': { title: 'AI Clinical Assistant', icon: '💬' },
  'organization-foundation': { title: 'Organization Foundation', icon: '🏛️' },
  'staff-administration': { title: 'Staff Administration', icon: '👥' },
  'doctor-management': { title: 'Doctor Management & Roster', icon: '👨‍⚕️' },
  'patient-registration': { title: 'OPD Reception & Tokens', icon: '📇' },
  'encounters-visits': { title: 'OPD Queue & Appointments', icon: '⏱️' },
  'clinical-consultation': { title: 'Doctor OPD Desk & EMR', icon: '🩺' },
  'nurse-triage-station': { title: 'Nurse Vitals & Triage', icon: '👩‍⚕️' },
  'clinical-investigation': { title: 'Pathology LIMS Workbench', icon: '🧪' },
  'pharmacy-medication': { title: 'Pharmacy POS & Dispense', icon: '💊' },
  'inpatient-management': { title: 'Inpatient Beds & ADT', icon: '🛏️' },
  'operation-theatre-management': { title: 'Operation Theatre (OT)', icon: '🔪' },
  'emergency-trauma': { title: 'Emergency & Trauma Bay', icon: '🚨' },
  'medical-records': { title: 'MRD & Medical Records', icon: '📂' },
  'blood-bank-transfusion': { title: 'Blood Bank & Transfusion', icon: '🩸' },
  'radiology-imaging': { title: 'Radiology & PACS Imaging', icon: '☢️' },
  'dietary-kitchen-management': { title: 'Dietary & Nutrition', icon: '🥗' },
  'asset-biomedical-maintenance': { title: 'Biomedical Assets & Engineering', icon: '🔧' },
  'quality-incident-infection-control': { title: 'Quality & Infection Control', icon: '🧼' },
  'abdm-fhir-gateway': { title: 'ABDM & Ayushman Bharat', icon: '🇮🇳' },
  'ai-clinical-cdss': { title: 'AI Clinical CDSS & Scribe', icon: '🎙️' },
  'telemedicine-rpm': { title: 'Telemedicine & Video OPD', icon: '📹' },
  'whatsapp-patient-portal': { title: 'Digital Rx & WhatsApp', icon: '📲' },
  'billing-revenue-cycle': { title: 'Cashier & Billing Desk', icon: '⚡' },
  'insurance-claims': { title: 'Insurance & TPA Claims', icon: '📑' },
  'procurement-supply-chain': { title: 'Procurement & Inventory', icon: '📦' },
  'offers-rewards-hub': { title: 'Partner Rewards & Grants', icon: '🎁' },
  'account-plan-features': { title: 'My Account / Plan & Features', icon: '💳' },
};

const getThemeLabel = (t: string) => {
  switch (t) {
    case themes.OBSIDIAN_TITANIUM: return '🌌 Obsidian';
    case themes.IMPERIAL_GOLD: return '👑 Imperial Gold';
    case themes.QUANTUM_BIOLUM: return '🧬 Biolum';
    case themes.TOKYO_CYBERPUNK: return '⚡ Cyberpunk';
    case themes.SOLAR_AMBER: return '🔥 Solar Amber';
    case themes.SWISS_CLINICAL: return '🇨🇭 Swiss Clinical';
    case themes.ADVANCE_PRO: return '✨ Advance Pro';
    case themes.AURORA_GLOW: return '🌈 Aurora Glow';
    case themes.NORDIC_PURE: return '🏥 Nordic Pure';
    case themes.OCEANIC_NAVY: return '🌊 Oceanic Navy';
    case themes.AYUR_WELLNESS: return '🌿 Ayur Wellness';
    case themes.CYBER_SURGEON: return '💜 Cyber Surgeon';
    case themes.ROSE_CARE: return '🌸 Rose Care';
    case themes.HEALTHCARE_LIGHT: return '🏥 Healthcare Light';
    case themes.BLACK_WHITE: return '🏁 B&W';
    default: return '🎨 Themes';
  }
};

const PartnerAccessDeniedShield: React.FC<{
  staffName?: string | undefined;
  role?: string | undefined;
  roleTitle?: string | undefined;
  department?: string | undefined;
  moduleKey: PartnerModuleKey;
  onReturn: () => void;
}> = ({ staffName, role, roleTitle, department, moduleKey, onReturn }) => (
  <div
    style={{
      padding: '48px 24px',
      maxWidth: '680px',
      margin: '40px auto',
      backgroundColor: 'var(--ds-color-surface, #0F172A)',
      border: '1.5px solid #EF4444',
      borderRadius: '16px',
      textAlign: 'center',
      boxShadow: '0 12px 48px rgba(0,0,0,0.6)'
    }}
  >
    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid #EF4444',
        color: '#FCA5A5',
        padding: '3px 12px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 800,
        marginBottom: '16px'
      }}
    >
      <span>DEPARTMENT CLEARANCE REQUIRED • ZERO ROLE LEAKAGE</span>
    </div>
    <h2 style={{ color: '#F87171', margin: '0 0 10px 0', fontSize: '1.35rem', fontWeight: 900 }}>
      Access Restricted: {moduleKey.replace(/-/g, ' ').toUpperCase()}
    </h2>
    <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: '1.6', margin: '0 auto 20px auto', maxWidth: '540px' }}>
      Staff member <strong style={{ color: '#F1F5F9' }}>{staffName || 'Healthcare Staff'}</strong> with role{' '}
      <strong style={{ color: '#38BDF8' }}>{roleTitle || role}</strong> ({department || 'Hospital Unit'}) does not have clinical or administrative clearance to access this department.
    </p>
    <div
      style={{
        backgroundColor: '#1E293B',
        borderRadius: '8px',
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '0.75rem',
        color: '#94A3B8',
        maxWidth: '540px',
        margin: '0 auto 24px auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      <div><strong style={{ color: '#CBD5E1' }}>Patient Safety & HIPAA Rule:</strong> Clinical records and medication orders are isolated per department credentials.</div>
      <div><strong style={{ color: '#CBD5E1' }}>Compliance Audit:</strong> Unauthorized access attempt logged with staff credential ID.</div>
      <div><strong style={{ color: '#CBD5E1' }}>Authorized Action:</strong> Return to your assigned department desk.</div>
    </div>
    <button
      type="button"
      onClick={onReturn}
      style={{
        backgroundColor: '#0284C7',
        border: 'none',
        color: '#FFF',
        padding: '10px 24px',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
      }}
    >
      Return to My Assigned Department ➔
    </button>
  </div>
);

const isClinicalModule = (modKey: PartnerModuleKey): boolean => {
  const clinicalModules: PartnerModuleKey[] = [
    'patient-registration',
    'encounters-visits',
    'clinical-consultation',
    'nurse-triage-station',
    'clinical-investigation',
    'pharmacy-medication',
    'billing-revenue-cycle',
    'inpatient-management',
    'emergency-trauma',
    'operation-theatre-management',
    'radiology-imaging',
    'blood-bank-transfusion',
    'dietary-kitchen-management',
    'ai-clinical-cdss',
    'telemedicine-rpm',
    'medical-records',
    'opd-one-flow-express',
    'help-desk-exit-hub',
    'hospital-closed-loop'
  ];
  return clinicalModules.includes(modKey);
};

export const PartnerPlatformShell: React.FC<PartnerPlatformShellProps> = ({ currentUser, onLogout }) => {
  const initialRoute = useMemo(() => {
    const normalizedProfile = normalizeFacilityProfile(currentUser?.organizationType);
    const defaultMod = (currentUser?.defaultModule as PartnerModuleKey) || (normalizedProfile.defaultModule as PartnerModuleKey);
    const parsed = parseCurrentUrl(
      normalizedProfile.workspace as OrganizationWorkspaceType,
      defaultMod,
      currentUser?.allowedWorkspaces && currentUser.allowedWorkspaces.length > 0 ? currentUser.allowedWorkspaces : (normalizedProfile.allowedWorkspaces as OrganizationWorkspaceType[])
    );
    const validWorkspace = isWorkspaceAllowedForPartnerProfile(
      parsed.workspace,
      currentUser?.organizationType,
      currentUser?.allowedWorkspaces
    )
      ? parsed.workspace
      : (normalizedProfile.workspace as OrganizationWorkspaceType);
    const validModule = isModuleAllowedForPartnerProfile(
      parsed.activeModule,
      currentUser?.organizationType || validWorkspace,
      currentUser?.role,
      currentUser?.permissions,
      currentUser?.accessibleFeatures
    )
      ? (validWorkspace === 'CLINIC' && (parsed.activeModule === 'my-smart-desk' || !parsed.activeModule) ? 'clinic-home' : parsed.activeModule)
      : (validWorkspace === 'CLINIC' ? 'clinic-home' : defaultMod);
    return {
      ...parsed,
      workspace: validWorkspace,
      activeModule: validModule
    };
  }, [currentUser]);

  const [workspace, setWorkspace] = useState<OrganizationWorkspaceType>(initialRoute.workspace);
  const [activeModule, setActiveModule] = useState<PartnerModuleKey>(initialRoute.activeModule);
  const effectiveWorkspace = useMemo(() => normalizeFacilityProfile(workspace).workspace, [workspace]);

  // Auto-redirect my-smart-desk to clinic-home for CLINIC workspace
  useEffect(() => {
    if (effectiveWorkspace === 'CLINIC' && activeModule === 'my-smart-desk') {
      setActiveModule('clinic-home');
    }
  }, [effectiveWorkspace, activeModule]);

  // Synchronize state whenever currentUser changes (e.g. instant staff switch or login)
  useEffect(() => {
    setWorkspace(initialRoute.workspace);
    setActiveModule(initialRoute.activeModule);
    if (initialRoute.subTab) {
      if (initialRoute.activeModule === 'pharmacy-medication') {
        setPharmacyTab(initialRoute.subTab as ActivePharmacyTab);
      } else if (initialRoute.activeModule === 'clinical-investigation') {
        setInvestigationTab(initialRoute.subTab as ActiveInvestigationTab);
      } else if (initialRoute.activeModule === 'radiology-imaging') {
        setRadiologyTab(initialRoute.subTab);
      } else if (initialRoute.activeModule === 'billing-revenue-cycle') {
        setBillingTab(initialRoute.subTab);
      }
    }
  }, [initialRoute]);
  const [pharmacyTab, setPharmacyTab] = useState<ActivePharmacyTab>(
    (initialRoute.subTab as ActivePharmacyTab) || 'pos'
  );
  const [patientRegistrationTab, setPatientRegistrationTab] = useState<ActivePatientTab>('directory');
  const [inpatientTab, setInpatientTab] = useState<InpatientTab>('bed-board');
  const [investigationTab, setInvestigationTab] = useState<ActiveInvestigationTab>('specimens');
  const [radiologyTab, setRadiologyTab] = useState<any>('overview');
  const [billingTab, setBillingTab] = useState<string>('invoices');

  // Navigation History and Keep-Alive Visited Modules
  const [navHistory, setNavHistory] = useState<PartnerModuleKey[]>([]);
  const [visitedModules, setVisitedModules] = useState<Set<PartnerModuleKey>>(() => new Set([initialRoute.activeModule]));
  const prevModuleRef = useRef<PartnerModuleKey>(activeModule);
  const isBackNavigationRef = useRef<boolean>(false);

  // Auto-track active module into keep-alive visited set and navigation history
  useEffect(() => {
    if (prevModuleRef.current !== activeModule) {
      if (!isBackNavigationRef.current) {
        setNavHistory((prev) => [...prev, prevModuleRef.current]);
      }
      isBackNavigationRef.current = false;
      prevModuleRef.current = activeModule;

      // Reset scroll to top instantly on module change
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }

      // Dispatch smart background re-sync event for target module
      window.dispatchEvent(
        new CustomEvent('docsearch:module_activated', {
          detail: { moduleKey: activeModule, timestamp: Date.now() }
        })
      );
    }

    setVisitedModules((prev) => {
      if (prev.has(activeModule)) return prev;
      const next = new Set(prev);
      next.add(activeModule);
      return next;
    });
  }, [activeModule]);

  const handleGoBack = () => {
    if (navHistory.length > 0) {
      const nextHist = [...navHistory];
      const prevMod = nextHist.pop()!;
      isBackNavigationRef.current = true;
      setNavHistory(nextHist);
      setActiveModule(prevMod);
    } else {
      const defaultMod = (currentUser?.defaultModule as PartnerModuleKey) || 'clinical-consultation';
      if (activeModule !== defaultMod) {
        setActiveModule(defaultMod);
      }
    }
  };

  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('docsearch_ui_mode') !== 'pro';
    }
    return true;
  });
  const [isFastOpdDrawerOpen, setIsFastOpdDrawerOpen] = useState(false);
  const [isAllModulesDrawerOpen, setIsAllModulesDrawerOpen] = useState(false);

  const toggleSimpleMode = () => {
    setIsSimpleMode((prev) => {
      const next = !prev;
      localStorage.setItem('docsearch_ui_mode', next ? 'simple' : 'pro');
      return next;
    });
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDoctorFocusMode, setIsDoctorFocusMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('docsearch_doctor_focus_mode') === 'true';
    }
    return false;
  });

  const toggleDoctorFocusMode = () => {
    setIsDoctorFocusMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('docsearch_doctor_focus_mode', next ? 'true' : 'false');
      }
      if (next) {
        setIsSidebarCollapsed(true);
        setActiveModule('clinical-consultation');
      } else {
        setIsSidebarCollapsed(false);
      }
      return next;
    });
  };

  const [rolePerspective, setRolePerspective] = useState<RolePerspective>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_role_perspective') as RolePerspective;
      if (stored) return stored;
    }
    return 'AUTO';
  });

  // Persona Gate: Automatically lock operational staff to their assigned station
  useEffect(() => {
    if (currentUser?.role) {
      if (!isHospitalExecutive(currentUser.role)) {
        const locked = getRoleDefaultPerspective(currentUser.role) as RolePerspective;
        setRolePerspective(locked);
        if (typeof window !== 'undefined') {
          localStorage.setItem('docsearch_role_perspective', locked);
        }
      }
    }
  }, [currentUser?.role]);

  const handleSetRolePerspective = (role: RolePerspective) => {
    if (currentUser?.role && !isHospitalExecutive(currentUser.role)) {
      // Non-executives are strictly prevented from desk hopping
      return;
    }
    setRolePerspective(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('docsearch_role_perspective', role);
    }
  };

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAccountPlanModalOpen, setIsAccountPlanModalOpen] = useState(false);
  const [isFounderApprovalsOpen, setIsFounderApprovalsOpen] = useState(false);
  const [isLeakInvestigatorOpen, setIsLeakInvestigatorOpen] = useState(false);
  const [isGlobalBreakGlassOpen, setIsGlobalBreakGlassOpen] = useState(false);
  const [isPreLlmModalOpen, setIsPreLlmModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalType, setPrintModalType] = useState<ThermalPrintType>('TOKEN');
  const [printTargetPatient, setPrintTargetPatient] = useState<ActivePatientSummary | null>(null);
  const [isProfileGuardAlertOpen, setIsProfileGuardAlertOpen] = useState(false);
  const [blockedPrintActionName, setBlockedPrintActionName] = useState('Bill Print / Report Generation');
  const [profileGuardMissingFields, setProfileGuardMissingFields] = useState<MissingProfileField[]>([]);

  const guardedOpenPrintModal = useCallback((type: ThermalPrintType, pat?: ActivePatientSummary | null) => {
    const status = checkPartnerProfileStatus(currentUser?.email);
    if (!status.isUpdated) {
      setBlockedPrintActionName(type === 'RECEIPT' ? 'Payment Receipt / Bill Print' : `${type} Slip Print`);
      setProfileGuardMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return;
    }
    setPrintModalType(type);
    setPrintTargetPatient(pat || null);
    setIsPrintModalOpen(true);
  }, [currentUser?.email]);

  useEffect(() => {
    const handleOpenSettingsEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) {
        setSettingsInitialTab(detail.tab);
      }
      setIsSettingsModalOpen(true);
    };
    window.addEventListener('docsearch:open_settings', handleOpenSettingsEvent);
    return () => {
      window.removeEventListener('docsearch:open_settings', handleOpenSettingsEvent);
    };
  }, []);
  const [isTvDisplayOpen, setIsTvDisplayOpen] = useState(false);
  const [isNews2ModalOpen, setIsNews2ModalOpen] = useState(false);
  const [isScheduleH1ModalOpen, setIsScheduleH1ModalOpen] = useState(false);
  const [isAbdmScanModalOpen, setIsAbdmScanModalOpen] = useState(false);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [isHospitalUpgradeModalOpen, setIsHospitalUpgradeModalOpen] = useState(false);
  const [isOfflineLicenseModalOpen, setIsOfflineLicenseModalOpen] = useState(false);
  const [upgradeModalTargetFeature, setUpgradeModalTargetFeature] = useState<string>('');
  const [currentPlanTier, setCurrentPlanTier] = useState<string>(currentUser?.planTier || '');
  const [licenseRevokedLockout, setLicenseRevokedLockout] = useState<string | null>(null);
  const [partnerAccountPlan, setPartnerAccountPlan] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/partner/account/plan-and-features')
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && json?.data) {
          setPartnerAccountPlan(json.data);
          if (json.data.currentPlan?.name) {
            setCurrentPlanTier(json.data.currentPlan.name);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser?.planTier) {
      setCurrentPlanTier(currentUser.planTier);
    }
  }, [currentUser?.planTier]);

  // Real-Time Cryptographic License Heartbeat & Kill-Switch Listener
  useEffect(() => {
    let isCancelled = false;

    const sendLicenseHeartbeat = async () => {
      try {
        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('docsearch_auth_token') || localStorage.getItem('docsearch_partner_token'))
          : null;

        const effectiveTenantId = currentUser?.tenantId || '11111111-1111-4111-8111-111111111111';
        const res = await fetch('/api/v1/license/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            clientTimestamp: Date.now(),
            tenantId: effectiveTenantId
          })
        });

        const json = await res.json().catch(() => null);
        if (isCancelled) return;

        if (json?.data?.isAccessAllowed || json?.data?.status === 'FREE_ACTIVE' || json?.data?.status === 'ACTIVE') {
          setLicenseRevokedLockout(null);
        } else if (
          json?.data?.status === 'REVOKED' ||
          json?.data?.status === 'SUSPENDED' ||
          json?.data?.status === 'LOCKED' ||
          json?.data?.status === 'EXPIRED'
        ) {
          // Do not lock out on harmless missing commercial license or pending registration states
          if (
            json?.data?.message?.includes('No active commercial license') ||
            json?.data?.message?.includes('No commercial license') ||
            json?.data?.message?.includes('Pending') ||
            json?.data?.status === 'PENDING' ||
            json?.data?.status === 'PLAN_PENDING'
          ) {
            setLicenseRevokedLockout(null);
          } else {
            setLicenseRevokedLockout(
              json?.data?.message ||
                'Account Locked: Your software subscription has expired and the 30-day grace period has ended. All clinical and billing records remain safely preserved. Please renew your license or talk to Ewan to restore operational access.'
            );
          }
        } else if (res.ok) {
          setLicenseRevokedLockout(null);
        }
      } catch {
        // Network resilience: do not lock out on transient network blip
      }
    };

    sendLicenseHeartbeat();
    const interval = setInterval(sendLicenseHeartbeat, 60000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?.tenantId]);

  const isFreeHospital = normalizeFacilityProfile(workspace).workspace === 'HOSPITAL' && isHospitalFreeTier(currentPlanTier || currentUser?.planTier);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const { pendingCount } = useFounderApproval(currentUser?.role, currentUser?.email);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'KYC' | 'BANK' | 'ADDRESS' | 'CERTIFICATES' | 'SECURITY_SEAL' | 'PASSWORD'>('KYC');

  // Retrieve dynamic registration details if partner self-registered
  const dynamicPartner = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const list = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
      return list.find((p: any) => p.email?.toLowerCase() === currentUser?.email?.toLowerCase());
    } catch {
      return null;
    }
  }, [currentUser?.email]);

  const isFounderUser = currentUser?.email?.toLowerCase() === 'founder@docsearch.health';
  const [liveKycStatus, setLiveKycStatus] = useState<string>(() => {
    return isFounderUser ? 'KYC_VERIFIED' : (dynamicPartner?.kycStatus || currentUser?.kycStatus || 'PENDING_ADMIN_VERIFICATION');
  });
  const [isCheckingKyc, setIsCheckingKyc] = useState<boolean>(false);

  // Dynamic Partner Profile & Vertical Adaptation
  const partnerVertical = (currentUser?.organizationType || workspace || 'HOSPITAL').toUpperCase();
  const isLabOrPathology = partnerVertical.includes('PATHOLOGY') || partnerVertical.includes('DIAGNOSTIC') || currentUser?.role === 'PATHOLOGIST' || currentUser?.role === 'LAB_TECHNICIAN';
  const isPharmacyVertical = partnerVertical.includes('PHARMACY') || currentUser?.role === 'PHARMACIST';
  const isClinicVertical = partnerVertical.includes('CLINIC') && !isLabOrPathology && !isPharmacyVertical;
  const resolvedVertical: 'HOSPITAL' | 'PATHOLOGY' | 'PHARMACY' | 'CLINIC' =
    isLabOrPathology ? 'PATHOLOGY' : isPharmacyVertical ? 'PHARMACY' : isClinicVertical ? 'CLINIC' : 'HOSPITAL';

  const drawerUpgradeSuiteTitle = isLabOrPathology
    ? '⭐ Upgrade Pathology LIMS Pro (₹10,000/yr)'
    : isPharmacyVertical
    ? '⭐ Upgrade Pharmacy Enterprise (₹10,000/yr)'
    : isClinicVertical
    ? '⭐ Upgrade Polyclinic Pro (₹20,000/yr)'
    : '⭐ Upgrade Hospital Enterprise (₹30,000/yr)';

  const drawerUpgradeTargetFeature = isLabOrPathology
    ? 'Pathology & LIMS Diagnostic Enterprise Suite'
    : isPharmacyVertical
    ? 'Pharmacy POS & Wholesale Enterprise Suite'
    : isClinicVertical
    ? 'Clinic & OPD Smart Practice Suite'
    : 'Hospital Complete Enterprise Suite';

  const drawerDirectoryTitle = isLabOrPathology
    ? 'All Pathology & LIMS Modules'
    : isPharmacyVertical
    ? 'All Pharmacy & POS Modules'
    : isClinicVertical
    ? 'All Clinic & OPD Modules'
    : 'All 38 Hospital Modules';

  const drawerDirectorySubtitle = isLabOrPathology
    ? 'Diagnostics'
    : isPharmacyVertical
    ? 'Inventory'
    : isClinicVertical
    ? 'Clinic OPD'
    : 'Directory';

  // Sync if dynamicPartner or currentUser kycStatus updates
  useEffect(() => {
    if (isFounderUser || dynamicPartner?.kycStatus === 'KYC_VERIFIED' || currentUser?.kycStatus === 'KYC_VERIFIED') {
      setLiveKycStatus('KYC_VERIFIED');
    }
  }, [isFounderUser, dynamicPartner?.kycStatus, currentUser?.kycStatus]);

  useEffect(() => {
    if (currentUser?.email || (currentUser as any)?.tenantId) {
      const activeTenant = (currentUser as any)?.tenantId || (currentUser as any)?.partnerId || '11111111-1111-4111-8111-111111111111';
      const activePartner = (currentUser as any)?.partnerId || activeTenant;
      const activeOrg = (currentUser as any)?.organizationId || '';
      const activeFacility = (currentUser as any)?.facilityId || (currentUser as any)?.branchId || '';

      import('../services/partner-foundation-service.js')
        .then(({ partnerFoundationService }) => {
          void partnerFoundationService.setPanelContext({
            userEmail: currentUser?.email || '',
            userRole: currentUser?.role || 'HOSPITAL_DIRECTOR',
            activeTenantName: currentUser?.tenantName || 'Healthcare Facility',
            activeTenantId: activeTenant,
            activePartnerId: activePartner,
            activeOrganizationId: activeOrg,
            activeFacilityId: activeFacility,
            activeOrganizationName: currentUser?.tenantName || 'Healthcare Facility',
            activeFacilityName: currentUser?.tenantName || 'Primary Facility'
          });
        })
        .catch(() => {});
    }
  }, [
    currentUser?.email,
    currentUser?.role,
    currentUser?.tenantName,
    (currentUser as any)?.tenantId,
    (currentUser as any)?.partnerId,
    (currentUser as any)?.organizationId,
    (currentUser as any)?.facilityId,
    (currentUser as any)?.branchId
  ]);

  const checkLiveApprovalStatus = useCallback(async () => {
    if (!currentUser?.email) return;
    setIsCheckingKyc(true);
    try {
      const email = encodeURIComponent(currentUser.email);
      const facilityName = encodeURIComponent(currentUser.tenantName || '');
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_auth_token') : null;
      const res = await fetch(`/api/v1/auth/partner-status?email=${email}&facilityName=${facilityName}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isApproved || data.kycStatus === 'KYC_VERIFIED') {
          setLiveKycStatus('KYC_VERIFIED');
          if (currentUser) {
            currentUser.kycStatus = 'KYC_VERIFIED';
            (currentUser as any).status = 'ACTIVE';
          }
          // Update local storage
          const storedAuth = localStorage.getItem('docsearch_partner_staff_auth');
          if (storedAuth) {
            try {
              const parsed = JSON.parse(storedAuth);
              parsed.kycStatus = 'KYC_VERIFIED';
              parsed.status = 'ACTIVE';
              localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(parsed));
            } catch (e) {}
          }
          try {
            if (currentUser?.email) {
              const currentEmail = currentUser.email.toLowerCase();
              const list = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
              const idx = list.findIndex((p: any) => p.email?.toLowerCase() === currentEmail);
              if (idx >= 0) {
                list[idx].kycStatus = 'KYC_VERIFIED';
                list[idx].status = 'APPROVED';
              } else {
                list.push({
                  email: currentUser.email,
                  kycStatus: 'KYC_VERIFIED',
                  status: 'APPROVED',
                  organizationName: currentUser.tenantName || 'Healthcare Partner'
                });
              }
              localStorage.setItem('docsearch_registered_partners', JSON.stringify(list));
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Unable to query partner approval status:', err);
    } finally {
      setIsCheckingKyc(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isFounderUser && liveKycStatus !== 'KYC_VERIFIED') {
      checkLiveApprovalStatus();
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          checkLiveApprovalStatus();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
    return () => {};
  }, [isFounderUser, liveKycStatus, checkLiveApprovalStatus]);

  const kycStatus = isFounderUser
    ? 'KYC_VERIFIED'
    : (liveKycStatus === 'KYC_VERIFIED' ? 'KYC_VERIFIED' : (dynamicPartner?.kycStatus || currentUser?.kycStatus || 'PENDING_ADMIN_VERIFICATION'));
  const resolvedTenantId = (currentUser as any)?.tenantId || '11111111-1111-4111-8111-111111111111';

  // Live waiting patient telemetry for sidebar Chamber action card
  const [liveWaitingCount, setLiveWaitingCount] = useState<number>(3);

  useEffect(() => {
    let isMounted = true;
    const fetchWaiting = async () => {
      try {
        const ov = await encounterService.getOverview(resolvedTenantId).catch(() => null);
        if (isMounted && ov && typeof ov.waitingQueueCount === 'number') {
          setLiveWaitingCount(ov.waitingQueueCount);
        }
      } catch {}
    };
    void fetchWaiting();
    const interval = setInterval(fetchWaiting, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [resolvedTenantId]);

  // Auto-open Password tab in Settings Modal on first-time login
  useEffect(() => {
    if (currentUser?.mustChangePassword) {
      setSettingsInitialTab('PASSWORD');
      setIsSettingsModalOpen(true);
    }
  }, [currentUser?.mustChangePassword]);

  // Synchronize browser address bar with active workspace and module
  useEffect(() => {
    updateBrowserUrlWithoutReload(workspace, activeModule, workspace === 'PHARMACY' ? pharmacyTab : undefined);
  }, [workspace, activeModule, pharmacyTab]);

  // Ensure PHARMACY workspace stays strictly on allowed modules
  useEffect(() => {
    const allowedPharmacyModules: PartnerModuleKey[] = [
      'pharmacy-home',
      'pharmacy-medication',
      'procurement-supply-chain',
      'patient-registration',
      'billing-revenue-cycle',
      'whatsapp-patient-portal',
      'staff-administration',
      'organization-foundation',
      'offers-rewards-hub',
      'account-plan-features',
      'my-smart-desk'
    ];
    if (workspace === 'PHARMACY' && !allowedPharmacyModules.includes(activeModule)) {
      setActiveModule('pharmacy-home');
    }
  }, [workspace, activeModule]);

  // Listen to browser Back and Forward navigation events
  useEffect(() => {
    const handlePopState = () => {
      const defaultMod = (currentUser?.defaultModule as PartnerModuleKey) || 'clinical-consultation';
      const parsed = parseCurrentUrl(
        currentUser?.organizationType || 'ENTERPRISE_COMMAND',
        defaultMod,
        currentUser?.allowedWorkspaces
      );
      const validWorkspace = (currentUser?.allowedWorkspaces && currentUser.allowedWorkspaces.length > 0 && currentUser.allowedWorkspaces.includes(parsed.workspace))
        ? parsed.workspace
        : (currentUser?.organizationType || 'HOSPITAL');
      const validModule = isPartnerModuleAllowed(parsed.activeModule, currentUser?.role, currentUser?.permissions)
        ? parsed.activeModule
        : defaultMod;

      isBackNavigationRef.current = true;
      setNavHistory((prev) => {
        if (prev.length > 0 && prev[prev.length - 1] === validModule) {
          return prev.slice(0, -1);
        }
        return prev;
      });

      setWorkspace(validWorkspace);
      setActiveModule(validModule);
      if (parsed.subTab) {
        setPharmacyTab(parsed.subTab as ActivePharmacyTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 0. Keyboard Shortcuts Cheat Sheet: Ctrl+/ or Cmd+/
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsKeyboardShortcutsOpen((prev) => !prev);
        return;
      }

      // 0.5. Hospital Standard Function Keys (F1, F2, F3, F4, F9)
      if (e.key === 'F1') {
        e.preventDefault();
        setIsFastOpdDrawerOpen(true);
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveModule('clinical-consultation');
        return;
      }
      if (e.key === 'F3') {
        e.preventDefault();
        setActiveModule('billing-revenue-cycle');
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setActiveModule('inpatient-management');
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        setActiveModule('emergency-trauma');
        return;
      }

      // 1. Universal Multi-Entity Search Palette: Ctrl+K / Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // 2. Escape: dismiss any open drawers or popovers
      if (e.key === 'Escape') {
        setIsFastOpdDrawerOpen(false);
        setIsUserMenuOpen(false);
        setIsQuickAddOpen(false);
        setIsWorkspaceMenuOpen(false);
        setIsCommandPaletteOpen(false);
        setIsKeyboardShortcutsOpen(false);
        return;
      }

      // 3. Ergonomic Clinical Operator Shortcuts (Alt + Key)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'n') {
          // Alt+N: Express OPD Registration Drawer
          e.preventDefault();
          setIsFastOpdDrawerOpen(true);
        } else if (key === 'b') {
          // Alt+B: Fast Pharmacy POS Billing
          e.preventDefault();
          setActiveModule('pharmacy-medication');
          setPharmacyTab('pos');
        } else if (key === 'p') {
          // Alt+P: Instant Print Prescription / Receipt
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('docsearch:instant_print'));
        } else if (key === 'c' || key === 'd') {
          // Alt+C / Alt+D: Doctor Consultation Desk
          e.preventDefault();
          setActiveModule('clinical-consultation');
        } else if (key === 'l') {
          // Alt+L: Pathology Laboratory LIMS
          e.preventDefault();
          setActiveModule('clinical-investigation');
        } else if (key === 'f') {
          // Alt+F: Doctor Focus Mode Toggle
          e.preventDefault();
          setIsDoctorFocusMode((prev) => {
            const next = !prev;
            localStorage.setItem('docsearch_doctor_focus_mode', String(next));
            if (next) {
              setActiveModule('clinical-consultation');
            }
            return next;
          });
        } else if (key === 'm') {
          // Alt+M: Ambient Voice & AI Clinical Scribe Floating HUD Toggle
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('docsearch:toggle_ambient_scribe'));
        }
      }

      // 4. Quick Save / Commit: Ctrl+Enter / Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('docsearch:quick_commit'));
      }
    };

    const handleToggleFocus = () => {
      setIsDoctorFocusMode((prev) => {
        const next = !prev;
        localStorage.setItem('docsearch_doctor_focus_mode', String(next));
        if (next) {
          setActiveModule('clinical-consultation');
        }
        return next;
      });
    };

    const handleOpenFastOpd = () => {
      setIsFastOpdDrawerOpen(true);
    };

    const handleExitCockpit = () => {
      setActiveModule('clinic-home');
      setIsDoctorFocusMode(false);
      setIsSidebarCollapsed(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('docsearch_doctor_focus_mode', 'false');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('docsearch:toggle_doctor_focus', handleToggleFocus);
    window.addEventListener('docsearch:open_fast_opd', handleOpenFastOpd);
    window.addEventListener('docsearch:exit_cockpit', handleExitCockpit);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('docsearch:toggle_doctor_focus', handleToggleFocus);
      window.removeEventListener('docsearch:open_fast_opd', handleOpenFastOpd);
      window.removeEventListener('docsearch:exit_cockpit', handleExitCockpit);
    };
  }, []);

  // Close user and workspace dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setIsQuickAddOpen(false);
      }
    };
    if (isUserMenuOpen || isWorkspaceMenuOpen || isQuickAddOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isWorkspaceMenuOpen, isQuickAddOpen]);

  const { theme, toggleTheme } = useTheme();

  const verifiedProfile = useMemo(() => getUnifiedPartnerProfile(currentUser), [currentUser]);

  const cleanFacilityBrand = useMemo(() => {
    if (verifiedProfile?.entityLegalName && !verifiedProfile.entityLegalName.toUpperCase().includes('INDEPENDENT_CLINIC')) {
      return verifiedProfile.entityLegalName;
    }
    const raw = currentUser?.tenantName || 'MediSphere Healthcare Clinic';
    if (raw && typeof raw === 'string' && raw.toUpperCase().includes('INDEPENDENT_CLINIC')) {
      const parts = raw.split(/[\s_]+/);
      const clean = parts[0] || 'Care';
      const capitalized = clean ? (clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()) : 'Care';
      return `Dr. ${capitalized} Care Clinic & Polyclinic`;
    }
    return raw;
  }, [verifiedProfile, currentUser?.tenantName]);

  // Dynamic Workspace definitions with specialized colors & tags
  const workspaceProfiles: Record<OrganizationWorkspaceType, { name: string; icon: string; badge: string; color: string; defaultModule: PartnerModuleKey }> = {
    ENTERPRISE_COMMAND: { name: currentUser?.tenantName || 'Healthcare Enterprise HQ', icon: '👑', badge: 'All-in-One Multi-Org Hub', color: '#8B5CF6', defaultModule: 'enterprise-home' },
    HOSPITAL: { name: cleanFacilityBrand || currentUser?.tenantName || 'Hospital & Trauma Care', icon: '🏥', badge: currentUser?.planTier || 'Inpatient & Tertiary Suite', color: '#3B82F6', defaultModule: 'hospital-home' },
    CLINIC: { name: cleanFacilityBrand, icon: '🩺', badge: currentUser?.planTier || 'OPD & Polyclinic', color: '#06B6D4', defaultModule: 'clinic-home' },
    PHARMACY: { name: currentUser?.tenantName || 'Pharmacy & Medical Store POS', icon: '💊', badge: currentUser?.planTier || 'Retail POS & Inventory', color: '#10B981', defaultModule: 'pharmacy-home' },
    PATHOLOGY: { name: currentUser?.tenantName || 'Pathology & Diagnostic LIS Hub', icon: '🧪', badge: currentUser?.planTier || 'Diagnostic LIS Hub', color: '#A855F7', defaultModule: 'pathology-home' },
    DIAGNOSTIC_CENTRE: { name: currentUser?.tenantName || 'Imaging & Radiology Centre', icon: '🔬', badge: currentUser?.planTier || 'DICOM & Modality Centre', color: '#F59E0B', defaultModule: 'diagnostic-home' }
  };

  const currentWsp = workspaceProfiles[workspace] || workspaceProfiles[normalizeFacilityProfile(workspace).workspace as OrganizationWorkspaceType] || {
    name: cleanFacilityBrand,
    icon: '🏥',
    badge: currentUser?.planTier || 'Healthcare Suite',
    color: '#3B82F6',
    defaultModule: 'hospital-home' as PartnerModuleKey
  };

  const currentModuleMeta = MODULE_METADATA[activeModule] || {
    title: activeModule.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: '📋'
  };

  const isHomeModule = [
    'pathology-home',
    'clinic-home',
    'pharmacy-home',
    'diagnostic-home',
    'hospital-home',
    'enterprise-home'
  ].includes(activeModule);

  // Across ALL partner profiles:
  // Fixed overview bars (facility sub-bar, metrics ticker, day-1 checklist, and floating activity dock)
  // ONLY show on that profile's Home page.
  // When navigating to any other workflow menu button, give 100% clean full-page workspace!
  const shouldShowFixedOverviewSections = isHomeModule;

  const handleWorkspaceChange = (newWsp: OrganizationWorkspaceType) => {
    const profileAnchor = currentUser?.organizationType || workspace;
    if (!isWorkspaceAllowedForPartnerProfile(newWsp, profileAnchor, currentUser?.allowedWorkspaces)) {
      return;
    }
    const defMod = workspaceProfiles[newWsp]?.defaultModule || 'clinical-consultation';
    const validMod = isModuleAllowedForPartnerProfile(
      defMod,
      profileAnchor,
      currentUser?.role,
      currentUser?.permissions,
      currentUser?.accessibleFeatures
    )
      ? defMod
      : ((currentUser?.defaultModule as PartnerModuleKey) || 'account-plan-features');
    setWorkspace(newWsp);
    setActiveModule(validMod);
  };

  // Build dynamic navigation sections based on active workspace, partner profile, and staff role
  const getDynamicSections = () => {
    const effectiveWorkspace = normalizeFacilityProfile(workspace).workspace;
    const isFreeHospital = effectiveWorkspace === 'HOSPITAL' && isHospitalFreeTier(currentPlanTier || currentUser?.planTier);
    const profileAnchor = currentUser?.organizationType || workspace;

    const filterSectionsByRole = (sections: Array<{ title?: string; items: Array<{ id: string; moduleId?: PartnerModuleKey; label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; badge?: React.ReactNode }> }>) => {
      const filtered = (sections || [])
        .map((sec) => ({
          ...sec,
          items: (sec?.items || [])
            .filter((item) =>
              isModuleAllowedForPartnerProfile(
                (item.moduleId || item.id) as PartnerModuleKey,
                profileAnchor,
                currentUser?.role,
                currentUser?.permissions,
                currentUser?.accessibleFeatures
              )
            )
            .map((item) => {
              // Defensive sanitization: strip any leading emoji from label so it never duplicates item.icon
              const cleanLabel = typeof item.label === 'string'
                ? item.label.replace(/^[\p{Emoji}\p{Emoji_Component}\p{Extended_Pictographic}\s]+/u, '').trim() || item.label
                : item.label;

              const isLocked = isFreeHospital && isHospitalModuleLocked(item.id, currentPlanTier || currentUser?.planTier);

              if (isLocked) {
                return {
                  ...item,
                  label: cleanLabel,
                  isActive: false,
                  badge: (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '1.5px 5.5px',
                        borderRadius: '4px',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 0 8px rgba(124, 58, 237, 0.4)',
                        letterSpacing: '0.04em'
                      }}
                    >
                      🔒 PRO
                    </span>
                  ),
                  onClick: () => {
                    setUpgradeModalTargetFeature(cleanLabel);
                    setIsHospitalUpgradeModalOpen(true);
                  }
                };
              }

              return {
                ...item,
                label: cleanLabel
              };
            })
        }))
        .filter((sec) => (sec?.items || []).length > 0);

      return filtered;
    };

    if (isDoctorFocusMode) {
      return filterSectionsByRole([
        {
          title: '🩺 Solo Doctor Cockpit',
          items: [
            {
              id: 'opd-one-flow-express',
              label: '⚡ 1-Flow OPD Express',
              icon: <span>⚡</span>,
              isActive: activeModule === 'opd-one-flow-express',
              onClick: () => setActiveModule('opd-one-flow-express')
            },
            {
              id: 'clinical-consultation',
              label: 'Doctor OPD Desk & EMR',
              icon: <span>🩺</span>,
              isActive: activeModule === 'clinical-consultation',
              onClick: () => setActiveModule('clinical-consultation')
            },
            {
              id: 'patient-registration',
              label: 'OPD Reception & Tokens',
              icon: <span>📇</span>,
              isActive: activeModule === 'patient-registration',
              onClick: () => setActiveModule('patient-registration')
            },
            {
              id: 'help-desk-exit-hub',
              label: 'Help Desk Exit & Print Hub',
              icon: <span>🖨️</span>,
              isActive: activeModule === 'help-desk-exit-hub',
              onClick: () => setActiveModule('help-desk-exit-hub')
            },
            {
              id: 'billing-revenue-cycle',
              label: 'Cashier & Instant UPI',
              icon: <span>⚡</span>,
              isActive: activeModule === 'billing-revenue-cycle',
              onClick: () => setActiveModule('billing-revenue-cycle')
            },
            {
              id: 'staff-administration',
              label: 'Clinic Staff Directory',
              icon: <span>👥</span>,
              isActive: activeModule === 'staff-administration',
              onClick: () => setActiveModule('staff-administration')
            },
            {
              id: 'preferred-partner-network',
              label: 'Exclusive Partner Tie-Ups',
              icon: <span>🤝</span>,
              isActive: activeModule === 'preferred-partner-network',
              onClick: () => setActiveModule('preferred-partner-network')
            }
          ]
        },
        {
          title: '🏢 Full Hospital Mode',
          items: [
            {
              id: 'exit-focus-mode',
              label: 'Switch to Full ERP Mode ➔',
              icon: <span>🏢</span>,
              isActive: false,
              onClick: () => toggleDoctorFocusMode()
            }
          ]
        }
      ]);
    }

    if ((isSimpleMode || !isHospitalExecutive(currentUser?.role)) && (effectiveWorkspace === 'HOSPITAL' || effectiveWorkspace === 'ENTERPRISE_COMMAND')) {
      const homeId: PartnerModuleKey = effectiveWorkspace === 'HOSPITAL' ? 'hospital-home' : 'enterprise-home';
      const roleUpper = rolePerspective !== 'AUTO'
        ? rolePerspective
        : String(currentUser?.role || '').toUpperCase();

      const isDoctorRole = rolePerspective === 'DOCTOR' || (rolePerspective === 'AUTO' && (roleUpper.includes('DOCTOR') || roleUpper.includes('SURGEON') || roleUpper.includes('PHYSICIAN') || roleUpper.includes('CARDIOLOGIST') || roleUpper.includes('PEDIATRICIAN') || roleUpper.includes('GYNECOLOGIST') || roleUpper.includes('ORTHOPEDIC') || roleUpper.includes('NEPHROLOGIST') || roleUpper.includes('ONCOLOGIST') || roleUpper.includes('NEUROLOGIST') || roleUpper.includes('OPHTHALMOLOGIST') || roleUpper.includes('DENTIST') || roleUpper.includes('VAIDYA') || roleUpper.includes('PULMONOLOGIST') || roleUpper.includes('PSYCHIATRIST') || roleUpper.includes('DERMATOLOGIST') || roleUpper.includes('CLINICIAN')));
      const isNurseRole = rolePerspective === 'NURSE' || (rolePerspective === 'AUTO' && roleUpper.includes('NURSE'));
      const isFrontDeskRole = rolePerspective === 'FRONT_DESK' || (rolePerspective === 'AUTO' && (roleUpper.includes('FRONT') || roleUpper.includes('DESK') || roleUpper.includes('RECEPT') || roleUpper.includes('REGISTR') || roleUpper.includes('TOKEN') || roleUpper.includes('CLERK')));
      const isPharmacistRole = rolePerspective === 'PHARMACY' || (rolePerspective === 'AUTO' && (roleUpper.includes('PHARMAC') || roleUpper.includes('AUSHADHI')));
      const isDiagnosticsRole = rolePerspective === 'LAB' || (rolePerspective === 'AUTO' && (roleUpper.includes('LAB') || roleUpper.includes('PATHO') || roleUpper.includes('RADIO') || roleUpper.includes('PHLEBOTOM')));
      const isBillingRole = rolePerspective === 'BILLING' || (rolePerspective === 'AUTO' && (roleUpper.includes('BILL') || roleUpper.includes('CASH') || roleUpper.includes('ACCOUNTS') || roleUpper.includes('FINANCE') || roleUpper.includes('CLAIM') || roleUpper.includes('INSURANCE')));

      let roleTitle = '📊 Director & Admin Suite';
      let roleTools: Array<{ id: PartnerModuleKey; label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = [];

      if (isDoctorRole) {
        roleTitle = '🩺 Doctor Desk';
        roleTools = [
          { id: 'opd-one-flow-express', label: '1-Flow OPD Express', icon: <span>⚡</span>, isActive: activeModule === 'opd-one-flow-express', onClick: () => setActiveModule('opd-one-flow-express') },
          { id: 'encounters-visits', label: 'Queue & Token Dispatch', icon: <span>⏱️</span>, isActive: activeModule === 'encounters-visits', onClick: () => setActiveModule('encounters-visits') },
          { id: 'inpatient-management', label: 'Inpatient Bed Rounds', icon: <span>🛏️</span>, isActive: activeModule === 'inpatient-management' && inpatientTab === 'patient-census', onClick: () => { setActiveModule('inpatient-management'); setInpatientTab('patient-census'); } },
          { id: 'telemedicine-rpm', label: 'Telehealth Video Consult', icon: <span>📹</span>, isActive: activeModule === 'telemedicine-rpm', onClick: () => setActiveModule('telemedicine-rpm') },
          ...(roleUpper.includes('CLINIC') || currentUser?.organizationType === 'CLINIC' ? [
            { id: 'staff-administration' as PartnerModuleKey, label: 'Staff & Team Directory', icon: <span>👥</span>, isActive: activeModule === 'staff-administration', onClick: () => setActiveModule('staff-administration') }
          ] : [])
        ];
      } else if (isNurseRole) {
        roleTitle = '👩‍⚕️ Nursing Station';
        roleTools = [
          { id: 'nurse-triage-station', label: 'Acuity Triage Station', icon: <span>🚨</span>, isActive: activeModule === 'nurse-triage-station', onClick: () => setActiveModule('nurse-triage-station') },
          { id: 'inpatient-management', label: 'Ward Bed Map Board', icon: <span>🛏️</span>, isActive: activeModule === 'inpatient-management' && inpatientTab === 'bed-board', onClick: () => { setActiveModule('inpatient-management'); setInpatientTab('bed-board'); } },
          { id: 'nurse-triage-station', label: 'Vitals & Early Warning', icon: <span>🫀</span>, isActive: activeModule === 'nurse-triage-station', onClick: () => setActiveModule('nurse-triage-station') },
          { id: 'inpatient-management', label: 'MAR Medication Care', icon: <span>💊</span>, isActive: activeModule === 'inpatient-management' && inpatientTab === 'nursing-care', onClick: () => { setActiveModule('inpatient-management'); setInpatientTab('nursing-care'); } }
        ];
      } else if (isFrontDeskRole) {
        roleTitle = '📇 Front Desk & Reception';
        roleTools = [
          { id: 'patient-registration', label: 'Express OPD Reg & ABHA', icon: <span>⚡</span>, isActive: activeModule === 'patient-registration' || isFastOpdDrawerOpen, onClick: () => { setActiveModule('patient-registration'); setIsFastOpdDrawerOpen(true); } },
          { id: 'encounters-visits', label: 'Tokens & Live Queue', icon: <span>⏱️</span>, isActive: activeModule === 'encounters-visits', onClick: () => setActiveModule('encounters-visits') },
          { id: 'billing-revenue-cycle', label: 'Cashier & UPI Receipt', icon: <span>🧾</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') },
          { id: 'doctor-management', label: 'Doctor OPD Rosters', icon: <span>📅</span>, isActive: activeModule === 'doctor-management', onClick: () => setActiveModule('doctor-management') }
        ];
      } else if (isPharmacistRole) {
        roleTitle = '💊 Pharmacy Counter';
        roleTools = [
          { id: 'pharmacy-medication', label: 'Fast POS Dispense Counter', icon: <span>🛒</span>, isActive: activeModule === 'pharmacy-medication' && pharmacyTab === 'pos', onClick: () => { setActiveModule('pharmacy-medication'); setPharmacyTab('pos'); } },
          { id: 'procurement-supply-chain', label: 'Stock Inward & Marg CSV', icon: <span>📦</span>, isActive: activeModule === 'procurement-supply-chain', onClick: () => setActiveModule('procurement-supply-chain') },
          { id: 'pharmacy-medication', label: 'Expiry Radar & Loss Alert', icon: <span>⏳</span>, isActive: activeModule === 'pharmacy-medication' && pharmacyTab === 'expiry', onClick: () => { setActiveModule('pharmacy-medication'); setPharmacyTab('expiry'); } },
          { id: 'pharmacy-medication', label: 'CDSCO H1 & Galla Ledger', icon: <span>📒</span>, isActive: activeModule === 'pharmacy-medication' && pharmacyTab === 'khata', onClick: () => { setActiveModule('pharmacy-medication'); setPharmacyTab('khata'); } }
        ];
      } else if (isDiagnosticsRole) {
        roleTitle = '🧪 Pathology Desk';
        roleTools = [
          { id: 'clinical-investigation', label: 'Phlebotomy Queue & Barcodes', icon: <span>🩸</span>, isActive: activeModule === 'clinical-investigation' && (investigationTab === 'specimens' || activeModule === 'clinical-investigation'), onClick: () => { setActiveModule('clinical-investigation'); setInvestigationTab('specimens'); } },
          { id: 'clinical-investigation', label: 'Analyzer Workbench', icon: <span>🧪</span>, isActive: activeModule === 'clinical-investigation' && investigationTab === 'processing', onClick: () => { setActiveModule('clinical-investigation'); setInvestigationTab('processing'); } },
          { id: 'clinical-investigation', label: 'NABL Sign-Off & Panic Center', icon: <span>🚨</span>, isActive: activeModule === 'clinical-investigation' && investigationTab === 'doctorReview', onClick: () => { setActiveModule('clinical-investigation'); setInvestigationTab('doctorReview'); } },
          { id: 'clinical-investigation', label: 'Report Dispatch & Billing', icon: <span>📲</span>, isActive: activeModule === 'clinical-investigation' && investigationTab === 'reports', onClick: () => { setActiveModule('clinical-investigation'); setInvestigationTab('reports'); } }
        ];
      } else if (isBillingRole) {
        roleTitle = '💳 Cashier & Revenue Cycle';
        roleTools = [
          { id: 'billing-revenue-cycle', label: 'Cashier POS & Claims', icon: <span>⚡</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') },
          { id: 'pharmacy-medication', label: 'Credit Khata Ledger', icon: <span>📒</span>, isActive: activeModule === 'pharmacy-medication' && pharmacyTab === 'khata', onClick: () => { setActiveModule('pharmacy-medication'); setPharmacyTab('khata'); } },
          { id: 'patient-registration', label: 'OPD Receipts', icon: <span>🧾</span>, isActive: activeModule === 'patient-registration', onClick: () => setActiveModule('patient-registration') },
          { id: 'inpatient-management', label: 'IPD Discharge Settlement', icon: <span>🛏️</span>, isActive: activeModule === 'inpatient-management' && inpatientTab === 'discharge-workbench', onClick: () => { setActiveModule('inpatient-management'); setInpatientTab('discharge-workbench'); } }
        ];
      } else {
        roleTitle = '📊 Director & Admin Suite';
        roleTools = [
          { id: 'executive-command-center', label: 'Executive Command', icon: <span>📊</span>, isActive: activeModule === 'executive-command-center', onClick: () => setActiveModule('executive-command-center') },
          { id: 'hospital-closed-loop', label: 'In-House Closed Loop', icon: <span>🔄</span>, isActive: activeModule === 'hospital-closed-loop', onClick: () => setActiveModule('hospital-closed-loop') },
          { id: 'staff-administration', label: 'Staff & Rosters', icon: <span>👥</span>, isActive: activeModule === 'staff-administration', onClick: () => setActiveModule('staff-administration') },
          { id: 'billing-revenue-cycle', label: 'Billing & Cashier', icon: <span>⚡</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') }
        ];
      }

      return filterSectionsByRole([
        {
          items: [
            {
              id: 'my-smart-desk',
              label: '⚡ My Smart Desk',
              icon: <span>⚡</span>,
              isActive: activeModule === 'my-smart-desk',
              onClick: () => setActiveModule('my-smart-desk')
            },
            {
              id: homeId,
              label: 'Dashboard Overview',
              icon: <span>🏠</span>,
              isActive: activeModule === homeId,
              onClick: () => setActiveModule(homeId)
            }
          ]
        },
        {
          title: roleTitle,
          items: roleTools
        },
        {
          title: 'Hospital Directory',
          items: [
            {
              id: 'staff-administration',
              label: '8. Staff & Care Team',
              icon: <span>👥</span>,
              isActive: activeModule === 'staff-administration',
              onClick: () => setActiveModule('staff-administration')
            },
            ...(isHospitalExecutive(currentUser?.role) ? [
              {
                id: 'all-modules-drawer-trigger' as PartnerModuleKey,
                moduleId: 'hospital-home' as PartnerModuleKey,
                label: '📁 View All 38 Modules Drawer',
                icon: <span>📁</span>,
                isActive: isAllModulesDrawerOpen,
                onClick: () => setIsAllModulesDrawerOpen(true)
              }
            ] : [])
          ]
        }
      ]);
    }

    if (effectiveWorkspace === 'CLINIC') {
      return filterSectionsByRole([
        {
          items: [
            {
              id: 'clinic-home',
              label: '🏠 Clinic Dashboard',
              icon: <span>🏠</span>,
              isActive: isHomeModule || activeModule === 'clinic-home' || activeModule === 'my-smart-desk',
              onClick: () => setActiveModule('clinic-home')
            },
            {
              id: 'clinical-consultation',
              label: '🩺 Doctor Chamber',
              icon: <span>🩺</span>,
              isActive: activeModule === 'clinical-consultation',
              onClick: () => setActiveModule('clinical-consultation')
            },
            {
              id: 'pharmacy-medication',
              label: '💊 Pharmacy & Dispensary',
              icon: <span>💊</span>,
              isActive: activeModule === 'pharmacy-medication',
              onClick: () => setActiveModule('pharmacy-medication')
            },
            {
              id: 'billing-revenue-cycle',
              label: '💰 Cashier & Daily Billing',
              icon: <span>⚡</span>,
              isActive: activeModule === 'billing-revenue-cycle',
              onClick: () => setActiveModule('billing-revenue-cycle')
            }
          ]
        },
        {
          title: 'Admin & Settings',
          items: [
            {
              id: 'staff-administration',
              label: '👥 Clinic Staff',
              icon: <span>👥</span>,
              isActive: activeModule === 'staff-administration',
              onClick: () => setActiveModule('staff-administration')
            },
            {
              id: 'chamber-settings-modal',
              moduleId: 'clinic-home',
              label: '⚙️ Chamber Settings',
              icon: <span>⚙️</span>,
              isActive: isSettingsModalOpen,
              onClick: () => setIsSettingsModalOpen(true)
            }
          ]
        }
      ]);
    }

    if (effectiveWorkspace === 'PHARMACY') {
      return filterSectionsByRole([
        {
          items: [
            { id: 'my-smart-desk', label: '⚡ My Smart Desk', icon: <span>⚡</span>, isActive: activeModule === 'my-smart-desk', onClick: () => setActiveModule('my-smart-desk') },
            { id: 'pharmacy-home', label: 'Home Overview', icon: <span>🏠</span>, isActive: activeModule === 'pharmacy-home', onClick: () => setActiveModule('pharmacy-home') }
          ]
        },
        {
          title: 'Prescriptions & Dispensing',
          items: [
            {
              id: 'pharmacy-prescriptions',
              moduleId: 'pharmacy-medication',
              label: '1. OPD Rx Queue',
              icon: <span>📋</span>,
              isActive: activeModule === 'pharmacy-medication' && pharmacyTab === 'prescriptions',
              onClick: () => {
                setActiveModule('pharmacy-medication');
                setPharmacyTab('prescriptions');
              }
            },
            {
              id: 'pharmacy-pos',
              moduleId: 'pharmacy-medication',
              label: '2. Pharmacy POS Counter',
              icon: <span>🛒</span>,
              isActive: activeModule === 'pharmacy-medication' && pharmacyTab === 'pos',
              onClick: () => {
                setActiveModule('pharmacy-medication');
                setPharmacyTab('pos');
              }
            },
            {
              id: 'pharmacy-revenue',
              moduleId: 'pharmacy-medication',
              label: '3. Revenue & Collections',
              icon: <span>💰</span>,
              isActive: activeModule === 'pharmacy-medication' && pharmacyTab === 'revenue',
              onClick: () => {
                setActiveModule('pharmacy-medication');
                setPharmacyTab('revenue');
              }
            },
            {
              id: 'pharmacy-invoicing',
              moduleId: 'pharmacy-medication',
              label: '4. GST Tax Invoices',
              icon: <span>🧾</span>,
              isActive: activeModule === 'pharmacy-medication' && pharmacyTab === 'compliance',
              onClick: () => {
                setActiveModule('pharmacy-medication');
                setPharmacyTab('compliance');
              }
            },
            {
              id: 'whatsapp-patient-portal',
              moduleId: 'whatsapp-patient-portal',
              label: '5. Digital Bill Pass',
              icon: <span>📲</span>,
              isActive: activeModule === 'whatsapp-patient-portal',
              onClick: () => setActiveModule('whatsapp-patient-portal')
            }
          ]
        },
        {
          title: 'Stock & Formulary',
          items: [
            {
              id: 'pharmacy-inventory',
              moduleId: 'pharmacy-medication',
              label: 'Stock & Batch Inward',
              icon: <span>📦</span>,
              isActive: activeModule === 'pharmacy-medication' && (pharmacyTab === 'inventory' || pharmacyTab === 'expiry'),
              onClick: () => {
                setActiveModule('pharmacy-medication');
                setPharmacyTab('inventory');
              }
            },
            {
              id: 'pharmacy-catalog',
              moduleId: 'pharmacy-medication',
              label: 'Drug Formulary Catalog',
              icon: <span>📚</span>,
              isActive: activeModule === 'pharmacy-medication' && pharmacyTab === 'catalog',
              onClick: () => {
                setActiveModule('pharmacy-medication');
                setPharmacyTab('catalog');
              }
            },
            {
              id: 'pharmacy-overview',
              moduleId: 'pharmacy-medication',
              label: 'Pharmacy Analytics',
              icon: <span>📊</span>,
              isActive: activeModule === 'pharmacy-medication' && pharmacyTab === 'overview',
              onClick: () => {
                setActiveModule('pharmacy-medication');
                setPharmacyTab('overview');
              }
            }
          ]
        },
        {
          title: 'Team & Operations',
          items: [
            {
              id: 'staff-administration',
              label: 'Chemist Staff & Cashiers',
              icon: <span>👥</span>,
              isActive: activeModule === 'staff-administration',
              onClick: () => setActiveModule('staff-administration')
            }
          ]
        }
      ]);
    }

    if (effectiveWorkspace === 'PATHOLOGY') {
      return filterSectionsByRole([
        {
          items: [
            {
              id: 'my-smart-desk',
              label: '⚡ My Smart Desk',
              icon: <span>⚡</span>,
              isActive: activeModule === 'my-smart-desk',
              onClick: () => setActiveModule('my-smart-desk')
            },
            {
              id: 'pathology-home',
              label: 'Home Overview',
              icon: <span>🏠</span>,
              isActive: activeModule === 'pathology-home',
              onClick: () => setActiveModule('pathology-home')
            }
          ]
        },
        {
          title: 'Laboratory Workflows',
          items: [
            {
              id: 'patient-registration',
              label: '1. Phlebotomy & Intake',
              icon: <span>🏷️</span>,
              isActive: activeModule === 'patient-registration',
              onClick: () => setActiveModule('patient-registration')
            },
            {
              id: 'clinical-investigation',
              label: '2. LIMS Testing Workbench',
              icon: <span>🧪</span>,
              isActive: activeModule === 'clinical-investigation',
              onClick: () => setActiveModule('clinical-investigation')
            },
            {
              id: 'billing-revenue-cycle',
              label: '3. Lab Cashier & Invoicing',
              icon: <span>💳</span>,
              isActive: activeModule === 'billing-revenue-cycle',
              onClick: () => setActiveModule('billing-revenue-cycle')
            },
            {
              id: 'whatsapp-patient-portal',
              label: '4. Report Dispatch & WhatsApp',
              icon: <span>📲</span>,
              isActive: activeModule === 'whatsapp-patient-portal',
              onClick: () => setActiveModule('whatsapp-patient-portal')
            }
          ]
        },
        {
          title: 'Lab Team & Governance',
          items: [
            {
              id: 'staff-administration',
              label: 'Lab Staff & Phlebotomists',
              icon: <span>👥</span>,
              isActive: activeModule === 'staff-administration',
              onClick: () => setActiveModule('staff-administration')
            }
          ]
        }
      ]);
    }

    if (effectiveWorkspace === 'DIAGNOSTIC_CENTRE') {
      return filterSectionsByRole([
        {
          items: [
            { id: 'my-smart-desk', label: '⚡ My Smart Desk', icon: <span>⚡</span>, isActive: activeModule === 'my-smart-desk', onClick: () => setActiveModule('my-smart-desk') },
            { id: 'diagnostic-home', label: 'Home Overview', icon: <span>🏠</span>, isActive: activeModule === 'diagnostic-home', onClick: () => setActiveModule('diagnostic-home') }
          ]
        },
        {
          title: 'Imaging & Modalities',
          items: [
            { id: 'radiology-imaging', label: 'Web DICOM PACS', icon: <span>🔬</span>, isActive: activeModule === 'radiology-imaging', onClick: () => setActiveModule('radiology-imaging') },
            { id: 'encounters-visits', label: 'Modality Scheduling', icon: <span>📅</span>, isActive: activeModule === 'encounters-visits', onClick: () => setActiveModule('encounters-visits') }
          ]
        },
        {
          title: 'Billing & Claims',
          items: [
            { id: 'insurance-claims', label: 'Cashless TPA Pre-Auth', icon: <span>🩻</span>, isActive: activeModule === 'insurance-claims', onClick: () => setActiveModule('insurance-claims') },
            { id: 'billing-revenue-cycle', label: 'Diagnostic Billing POS', icon: <span>🧾</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') }
          ]
        },
        {
          title: 'Operations & Team',
          items: [
            {
              id: 'staff-administration',
              label: 'Radiology & Centre Team',
              icon: <span>👥</span>,
              isActive: activeModule === 'staff-administration',
              onClick: () => setActiveModule('staff-administration')
            }
          ]
        }
      ]);
    }

    if (effectiveWorkspace === 'HOSPITAL') {
      return filterSectionsByRole([
        {
          items: [
            {
              id: 'my-smart-desk',
              label: '⚡ My Smart Desk',
              icon: <span>⚡</span>,
              isActive: activeModule === 'my-smart-desk',
              onClick: () => setActiveModule('my-smart-desk')
            },
            {
              id: 'switch-to-smart-sidebar',
              moduleId: 'hospital-home',
              label: '✨ Switch to Smart Role Sidebar ➔',
              icon: <span>⚡</span>,
              isActive: false,
              onClick: () => toggleSimpleMode()
            },
            { id: 'hospital-home', label: 'Home Overview', icon: <span>🏠</span>, isActive: activeModule === 'hospital-home', onClick: () => setActiveModule('hospital-home') },
            { id: 'hospital-closed-loop', label: 'In-House Closed Loop (OPD & IPD)', icon: <span>🔄</span>, isActive: activeModule === 'hospital-closed-loop', onClick: () => setActiveModule('hospital-closed-loop') }
          ]
        },
        {
          title: '1. Front Desk & Reception',
          items: [
            { id: 'patient-registration', label: 'OPD Tokens & Registry', icon: <span>📇</span>, isActive: activeModule === 'patient-registration', onClick: () => setActiveModule('patient-registration') },
            { id: 'nurse-triage-station', label: 'Nurse Vitals & Triage', icon: <span>👩‍⚕️</span>, isActive: activeModule === 'nurse-triage-station', onClick: () => setActiveModule('nurse-triage-station') },
            { id: 'encounters-visits', label: 'OPD Queue & Triage', icon: <span>⏱️</span>, isActive: activeModule === 'encounters-visits', onClick: () => setActiveModule('encounters-visits') }
          ]
        },
        {
          title: '2. Doctor OPD & Clinical Desk',
          items: [
            { id: 'clinical-consultation', label: 'Doctor Desk & EMR', icon: <span>🩺</span>, isActive: activeModule === 'clinical-consultation', onClick: () => setActiveModule('clinical-consultation') },
            { id: 'ai-clinical-cdss', label: 'AI Voice Scribe & CDSS', icon: <span>🎙️</span>, isActive: activeModule === 'ai-clinical-cdss', onClick: () => setActiveModule('ai-clinical-cdss') },
            { id: 'telemedicine-rpm', label: 'Telemedicine Video OPD', icon: <span>📹</span>, isActive: activeModule === 'telemedicine-rpm', onClick: () => setActiveModule('telemedicine-rpm') }
          ]
        },
        {
          title: '3. Diagnostics & Investigations',
          items: [
            { id: 'clinical-investigation', label: 'Pathology LIMS', icon: <span>🧪</span>, isActive: activeModule === 'clinical-investigation', onClick: () => setActiveModule('clinical-investigation') },
            { id: 'radiology-imaging', label: 'Radiology & DICOM PACS', icon: <span>🔬</span>, isActive: activeModule === 'radiology-imaging', onClick: () => setActiveModule('radiology-imaging') }
          ]
        },
        {
          title: '4. Pharmacy & Medication',
          items: [
            { id: 'pharmacy-medication', label: 'Hospital Pharmacy POS', icon: <span>💊</span>, isActive: activeModule === 'pharmacy-medication', onClick: () => setActiveModule('pharmacy-medication') }
          ]
        },
        {
          title: '5. Billing, Cashier & Portals',
          items: [
            { id: 'billing-revenue-cycle', label: 'Billing POS & IPD Ledger', icon: <span>⚡</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') },
            { id: 'insurance-claims', label: 'TPA Claims & NHCX', icon: <span>🩻</span>, isActive: activeModule === 'insurance-claims', onClick: () => setActiveModule('insurance-claims') },
            { id: 'abdm-fhir-gateway', label: 'ABDM 2.0 Gateway', icon: <span>🇮🇳</span>, isActive: activeModule === 'abdm-fhir-gateway', onClick: () => setActiveModule('abdm-fhir-gateway') },
            { id: 'whatsapp-patient-portal', label: 'WhatsApp Patient Portal', icon: <span>📲</span>, isActive: activeModule === 'whatsapp-patient-portal', onClick: () => setActiveModule('whatsapp-patient-portal') }
          ]
        },
        {
          title: '6. Inpatient, Critical Care & Surgery',
          items: [
            { id: 'inpatient-management', label: 'Inpatient ADT & Beds', icon: <span>🛏️</span>, isActive: activeModule === 'inpatient-management', onClick: () => setActiveModule('inpatient-management') },
            { id: 'emergency-trauma', label: 'Emergency & Triage (ER)', icon: <span>🚨</span>, isActive: activeModule === 'emergency-trauma', onClick: () => setActiveModule('emergency-trauma') },
            { id: 'operation-theatre-management', label: 'Operation Theatres (OT)', icon: <span>🔪</span>, isActive: activeModule === 'operation-theatre-management', onClick: () => setActiveModule('operation-theatre-management') },
            { id: 'blood-bank-transfusion', label: 'Blood Bank & Cross-Match', icon: <span>🩸</span>, isActive: activeModule === 'blood-bank-transfusion', onClick: () => setActiveModule('blood-bank-transfusion') }
          ]
        },
        {
          title: '7. Governance, Quality & Assets',
          items: [
            { id: 'executive-command-center', label: 'Executive Command Center', icon: <span>📊</span>, isActive: activeModule === 'executive-command-center', onClick: () => setActiveModule('executive-command-center') },
            { id: 'doctor-management', label: 'Doctor Rosters', icon: <span>👨‍⚕️</span>, isActive: activeModule === 'doctor-management', onClick: () => setActiveModule('doctor-management') },
            { id: 'staff-administration', label: 'Staff Directory & Roles', icon: <span>👥</span>, isActive: activeModule === 'staff-administration', onClick: () => setActiveModule('staff-administration') },
            { id: 'procurement-supply-chain', label: 'Procurement & Supply', icon: <span>🚚</span>, isActive: activeModule === 'procurement-supply-chain', onClick: () => setActiveModule('procurement-supply-chain') },
            { id: 'asset-biomedical-maintenance', label: 'Biomedical Maintenance', icon: <span>🔧</span>, isActive: activeModule === 'asset-biomedical-maintenance', onClick: () => setActiveModule('asset-biomedical-maintenance') },
            { id: 'quality-incident-infection-control', label: 'NABH Quality & Infection', icon: <span>🛡️</span>, isActive: activeModule === 'quality-incident-infection-control', onClick: () => setActiveModule('quality-incident-infection-control') },
            { id: 'dietary-kitchen-management', label: 'Dietary & Kitchen', icon: <span>🥗</span>, isActive: activeModule === 'dietary-kitchen-management', onClick: () => setActiveModule('dietary-kitchen-management') },
            { id: 'medical-records', label: 'MRD & ICD-10 Archive', icon: <span>📁</span>, isActive: activeModule === 'medical-records', onClick: () => setActiveModule('medical-records') },
            { id: 'organization-foundation', label: 'Organization & Branches', icon: <span>🏢</span>, isActive: activeModule === 'organization-foundation', onClick: () => setActiveModule('organization-foundation') },
            { id: 'ai-chat-assistant', label: 'AI Copilot Assistant', icon: <span>🤖</span>, isActive: activeModule === 'ai-chat-assistant', onClick: () => setActiveModule('ai-chat-assistant') }
          ]
        }
      ]);
    }

    // Default / ENTERPRISE_COMMAND: Clean consolidated layout
    return filterSectionsByRole([
      {
        items: [
          { id: 'enterprise-home', label: 'Home Overview', icon: <span>🏠</span>, isActive: activeModule === 'enterprise-home', onClick: () => setActiveModule('enterprise-home') }
        ]
      },
      {
        title: 'Front Desk & Triage',
        items: [
          { id: 'patient-registration', label: 'Patient Registration & MPI', icon: <span>📇</span>, isActive: activeModule === 'patient-registration', onClick: () => setActiveModule('patient-registration') },
          { id: 'nurse-triage-station', label: 'Nurse Vitals & Triage', icon: <span>👩‍⚕️</span>, isActive: activeModule === 'nurse-triage-station', onClick: () => setActiveModule('nurse-triage-station') },
          { id: 'encounters-visits', label: 'OPD Queue, Tokens & Triage', icon: <span>⏱️</span>, isActive: activeModule === 'encounters-visits', onClick: () => setActiveModule('encounters-visits') }
        ]
      },
      {
        title: 'Doctor OPD & Clinical Desk',
        items: [
          { id: 'clinical-consultation', label: 'OPD Doctor Desk & EMR', icon: <span>🩺</span>, isActive: activeModule === 'clinical-consultation', onClick: () => setActiveModule('clinical-consultation') },
          { id: 'ai-clinical-cdss', label: 'AI Voice Scribe & CDSS', icon: <span>🎙️</span>, isActive: activeModule === 'ai-clinical-cdss', onClick: () => setActiveModule('ai-clinical-cdss') },
          { id: 'telemedicine-rpm', label: 'Telemedicine Video OPD', icon: <span>📹</span>, isActive: activeModule === 'telemedicine-rpm', onClick: () => setActiveModule('telemedicine-rpm') }
        ]
      },
      {
        title: 'Diagnostics & Investigations',
        items: [
          { id: 'clinical-investigation', label: 'Pathology Laboratory LIMS', icon: <span>🧪</span>, isActive: activeModule === 'clinical-investigation', onClick: () => setActiveModule('clinical-investigation') },
          { id: 'radiology-imaging', label: 'Radiology & DICOM PACS', icon: <span>🔬</span>, isActive: activeModule === 'radiology-imaging', onClick: () => setActiveModule('radiology-imaging') }
        ]
      },
      {
        title: 'Pharmacy & Therapeutics',
        items: [
          { id: 'pharmacy-medication', label: 'Pharmacy POS & Formulary', icon: <span>💊</span>, isActive: activeModule === 'pharmacy-medication', onClick: () => setActiveModule('pharmacy-medication') }
        ]
      },
      {
        title: 'Cashier, Billing & Insurance',
        items: [
          { id: 'billing-revenue-cycle', label: 'Billing POS & Multi-Party UPI', icon: <span>⚡</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') },
          { id: 'insurance-claims', label: 'TPA Cashless Claims & NHCX', icon: <span>🩻</span>, isActive: activeModule === 'insurance-claims', onClick: () => setActiveModule('insurance-claims') },
          { id: 'abdm-fhir-gateway', label: 'ABDM 2.0 National Gateway', icon: <span>🇮🇳</span>, isActive: activeModule === 'abdm-fhir-gateway', onClick: () => setActiveModule('abdm-fhir-gateway') },
          { id: 'whatsapp-patient-portal', label: 'WhatsApp Patient Portal', icon: <span>📲</span>, isActive: activeModule === 'whatsapp-patient-portal', onClick: () => setActiveModule('whatsapp-patient-portal') }
        ]
      },
      {
        title: 'Inpatient, Critical Care & Surgery',
        items: [
          { id: 'inpatient-management', label: 'IPD Bed Matrix & Wards', icon: <span>🛏️</span>, isActive: activeModule === 'inpatient-management', onClick: () => setActiveModule('inpatient-management') },
          { id: 'emergency-trauma', label: 'Emergency & Triage (ER)', icon: <span>🚨</span>, isActive: activeModule === 'emergency-trauma', onClick: () => setActiveModule('emergency-trauma') },
          { id: 'operation-theatre-management', label: 'Operation Theatres (OT)', icon: <span>🔪</span>, isActive: activeModule === 'operation-theatre-management', onClick: () => setActiveModule('operation-theatre-management') },
          { id: 'blood-bank-transfusion', label: 'Blood Bank & Cross-Match', icon: <span>🩸</span>, isActive: activeModule === 'blood-bank-transfusion', onClick: () => setActiveModule('blood-bank-transfusion') }
        ]
      },
      {
        title: 'Administration, Governance & Command',
        items: [
          { id: 'executive-command-center', label: 'Executive Command Center & KPI', icon: <span>📊</span>, isActive: activeModule === 'executive-command-center', onClick: () => setActiveModule('executive-command-center') },
          { id: 'ai-chat-assistant', label: 'AI Copilot & Assistant', icon: <span>🤖</span>, isActive: activeModule === 'ai-chat-assistant', onClick: () => setActiveModule('ai-chat-assistant') },
          { id: 'organization-foundation', label: 'Organization & Branches', icon: <span>🏢</span>, isActive: activeModule === 'organization-foundation', onClick: () => setActiveModule('organization-foundation') },
          { id: 'staff-administration', label: 'Staff Directory & Roles', icon: <span>👥</span>, isActive: activeModule === 'staff-administration', onClick: () => setActiveModule('staff-administration') },
          { id: 'doctor-management', label: 'Doctor Profiles & OPD Rosters', icon: <span>👨‍⚕️</span>, isActive: activeModule === 'doctor-management', onClick: () => setActiveModule('doctor-management') },
          { id: 'procurement-supply-chain', label: 'Procurement & Wholesale Supply', icon: <span>🚚</span>, isActive: activeModule === 'procurement-supply-chain', onClick: () => setActiveModule('procurement-supply-chain') },
          { id: 'asset-biomedical-maintenance', label: 'Biomedical Assets Maintenance', icon: <span>🔧</span>, isActive: activeModule === 'asset-biomedical-maintenance', onClick: () => setActiveModule('asset-biomedical-maintenance') },
          { id: 'quality-incident-infection-control', label: 'NABH Quality & Infection Control', icon: <span>🛡️</span>, isActive: activeModule === 'quality-incident-infection-control', onClick: () => setActiveModule('quality-incident-infection-control') },
          { id: 'dietary-kitchen-management', label: 'Dietary & Inpatient Kitchen', icon: <span>🥗</span>, isActive: activeModule === 'dietary-kitchen-management', onClick: () => setActiveModule('dietary-kitchen-management') },
          { id: 'medical-records', label: 'MRD & ICD-10 Archive', icon: <span>📁</span>, isActive: activeModule === 'medical-records', onClick: () => setActiveModule('medical-records') }
        ]
      }
    ]);
  };

  // ZERO-TRUST COMPLIANCE GOVERNANCE GATE
  // Healthcare Compliance Directorate has root authority.
  // All other healthcare facilities/staff MUST be explicitly KYC_VERIFIED and approved.
  const isFounderApproved = isFounderUser || liveKycStatus === 'KYC_VERIFIED' || kycStatus === 'KYC_VERIFIED';

  if (!isFounderApproved) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#070C16',
          backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(239, 68, 68, 0.12), transparent 70%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          color: '#F8FAFC',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            width: '100%',
            backgroundColor: 'var(--ds-color-surface, #0F172A)',
            border: '1.5px solid #EF4444',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 25px 60px -15px rgba(239, 68, 68, 0.25)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              margin: '0 auto 20px'
            }}
          >
            🛑
          </div>

          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #EF4444',
              color: '#FCA5A5',
              fontSize: '0.75rem',
              fontWeight: 900,
              letterSpacing: '0.05em',
              padding: '4px 12px',
              borderRadius: '20px',
              marginBottom: '16px'
            }}
          >
            PARTNER PLATFORM ACCESS RESTRICTED • ZERO-TRUST LOCKOUT
          </span>

          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              color: '#FFFFFF',
              margin: '0 0 12px 0',
              lineHeight: 1.25
            }}
          >
            Awaiting Healthcare Compliance Approval
          </h1>

          <p
            style={{
              fontSize: '0.9375rem',
              color: '#94A3B8',
              lineHeight: 1.6,
              margin: '0 0 24px 0'
            }}
          >
            Facility <strong style={{ color: '#F1F5F9' }}>{currentUser?.tenantName || 'Your Healthcare Facility'}</strong> has been registered on DocSearch MediSphere OS, but operational and clinical modules are <strong style={{ color: '#EF4444' }}>STRICTLY LOCKED</strong>. 
            In accordance with DocSearch Healthcare Governance, no clinical, diagnostic, pharmacy, or patient records can be accessed without explicit authorization by the <strong style={{ color: '#38BDF8' }}>DocSearch Healthcare Compliance Directorate</strong> (<span style={{ color: '#06B6D4' }}>compliance@docsearch.health</span>).
          </p>

          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'left',
              fontSize: '0.8125rem',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
              <span style={{ color: '#94A3B8' }}>Facility / Organization:</span>
              <strong style={{ color: '#F8FAFC' }}>{currentUser?.tenantName || 'Pending Verification'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
              <span style={{ color: '#94A3B8' }}>Applicant / Doctor:</span>
              <span style={{ color: '#F8FAFC' }}>{currentUser?.name} ({currentUser?.email})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
              <span style={{ color: '#94A3B8' }}>KYC Review Status:</span>
              <span style={{ color: '#F59E0B', fontWeight: 800 }}>⏳ PENDING REGULATORY VERIFICATION</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94A3B8' }}>Authorizing Authority:</span>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>DocSearch Healthcare Compliance Directorate</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => checkLiveApprovalStatus()}
              disabled={isCheckingKyc}
              style={{
                backgroundColor: '#0284C7',
                color: '#FFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: isCheckingKyc ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isCheckingKyc ? '⏳ Checking Approval...' : '🔄 Check Approval Status'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingsInitialTab('ADDRESS');
                setIsSettingsModalOpen(true);
              }}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.16)',
                color: '#6EE7B7',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              🏥 Complete Facility Profile
            </button>
            <button
              type="button"
              onClick={() => setIsAccountPlanModalOpen(true)}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.16)',
                color: '#7DD3FC',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              💎 View Account & Plan
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('docsearch_partner_staff_auth');
                localStorage.removeItem('docsearch_auth_token');
                localStorage.setItem('docsearch_logged_out', 'true');
                if (onLogout) onLogout();
                else window.location.reload();
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
        <UniversalAccountSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentUser={currentUser as any}
          initialTab={settingsInitialTab}
        />
        <PartnerAccountPlanModal
          isOpen={isAccountPlanModalOpen}
          onClose={() => setIsAccountPlanModalOpen(false)}
          currentUser={currentUser as any}
        />
      </div>
    );
  }

  return (
    <AdaptiveProvider>
      <AppShell
        isMobileDrawerOpen={isMobileDrawerOpen}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        intensity={
          isClinicalModule(activeModule)
            ? 'operational'
            : (activeModule === 'executive-command-center' || workspace === 'ENTERPRISE_COMMAND')
            ? 'command'
            : 'management'
        }
        sidebar={
          isDoctorFocusMode || activeModule === 'clinical-consultation' ? null : (
            <Sidebar
              brand={
                <DocSearchResponsiveBrand
                  workspaceName={workspace.replace('_', ' ')}
                  workspaceColor={currentWsp.color}
                  workspaceIcon={currentWsp.icon}
                  isCompact={isSidebarCollapsed}
                />
              }
              headerSlot={
                isSidebarCollapsed ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', width: '100%' }}>
                    {!isHospitalExecutive(currentUser?.role) ? (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          border: '1.5px solid #10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          fontSize: '1.1rem',
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.25)'
                        }}
                        title={`Locked Assigned Station: ${rolePerspective}`}
                      >
                        {rolePerspective === 'DOCTOR' ? '🩺' : rolePerspective === 'NURSE' ? '👩‍⚕️' : rolePerspective === 'PHARMACY' ? '💊' : rolePerspective === 'LAB' ? '🧪' : rolePerspective === 'BILLING' ? '💳' : '📇'}
                      </div>
                    ) : (
                      [
                        { id: 'DOCTOR' as const, label: 'Doctor Desk', icon: '🩺' },
                        { id: 'NURSE' as const, label: 'Nursing Station', icon: '👩‍⚕️' },
                        { id: 'PHARMACY' as const, label: 'Pharmacy POS', icon: '💊' },
                        { id: 'LAB' as const, label: 'Pathology Lab', icon: '🧪' }
                      ].map((desk) => {
                        const isSelected = rolePerspective === desk.id;
                        return (
                          <button
                            key={desk.id}
                            type="button"
                            onClick={() => {
                              handleSetRolePerspective(desk.id);
                              setIsSimpleMode(true);
                              setActiveModule('my-smart-desk');
                              if (desk.id === 'PHARMACY') setPharmacyTab('pos');
                              if (desk.id === 'LAB') setInvestigationTab('processing');
                              if (desk.id === 'NURSE') setInpatientTab('bed-board');
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '8px',
                              border: isSelected ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                              backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 0 10px rgba(56, 189, 248, 0.35)' : 'none'
                            }}
                            title={`Switch to ${desk.label} (Smart Desk)`}
                          >
                            {desk.icon}
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    {!isHospitalExecutive(currentUser?.role) &&
                    effectiveWorkspace !== 'PATHOLOGY' &&
                    rolePerspective !== 'LAB' &&
                    currentUser?.role !== 'PATHOLOGIST' &&
                    currentUser?.role !== 'LAB_TECHNICIAN' &&
                    currentUser?.role !== 'PHLEBOTOMIST' ? (
                      /* ⚡ Live Interactive Chamber Action Card (OPD Clinician Only) */
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(6, 182, 212, 0.08) 100%)',
                          border: '1.5px solid rgba(16, 185, 129, 0.4)',
                          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                            CHAMBER 1 ({currentUser?.name ? currentUser.name.toUpperCase() : 'ATTENDING PHYSICIAN'})
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#FCD34D', fontWeight: 800, backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                            👥 {liveWaitingCount} Waiting
                          </span>
                        </div>

                        {/* Direct 1-Click Action Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (rolePerspective === 'DOCTOR' || effectiveWorkspace === 'CLINIC') {
                              setActiveModule('clinical-consultation');
                            } else if (rolePerspective === 'PHARMACY') {
                              setActiveModule('pharmacy-medication');
                            } else if (rolePerspective === 'BILLING') {
                              setActiveModule('billing-revenue-cycle');
                            } else {
                              setActiveModule('clinic-home');
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#0284C7',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 10px rgba(2, 132, 199, 0.45)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#0369A1';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#0284C7';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          title="Click to jump directly into consultation room"
                        >
                          <span>🩺</span>
                          <span>Open Chamber ➔</span>
                        </button>
                      </div>
                    ) : (effectiveWorkspace === 'PATHOLOGY' || rolePerspective === 'LAB' || currentUser?.role === 'PATHOLOGIST' || currentUser?.role === 'LAB_TECHNICIAN' || currentUser?.role === 'PHLEBOTOMIST') ? (
                      /* 🧪 Laboratory Status & LIMS Workbench Shortcut */
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(56, 189, 248, 0.08) 100%)',
                          border: '1.5px solid rgba(168, 85, 247, 0.4)',
                          boxShadow: '0 4px 16px rgba(168, 85, 247, 0.15)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#C084FC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#A855F7', boxShadow: '0 0 8px #A855F7' }} />
                            LIMS WORKBENCH ({currentUser?.name ? currentUser.name.toUpperCase() : 'PATHOLOGIST'})
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#38BDF8', fontWeight: 800, backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                            🧪 NABL / ISO-15189
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveModule('clinical-investigation');
                            setInvestigationTab('processing');
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#7C3AED',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 10px rgba(124, 58, 237, 0.45)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#6D28D9';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#7C3AED';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          title="Open LIMS Testing & Verification Workbench"
                        >
                          <span>🧪</span>
                          <span>Open LIMS Workbench ➔</span>
                        </button>
                      </div>
                    ) : (
                      /* Executive Multi-Desk Switcher for Hospital Directors / Leadership */
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveModule('my-smart-desk');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              color: activeModule === 'my-smart-desk' ? '#38BDF8' : '#94A3B8',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer'
                            }}
                            title="Open My Smart Desk Cockpit"
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38BDF8' }} />
                            My Smart Desk
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAllModulesDrawerOpen(true)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#38BDF8',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '0 2px'
                            }}
                            title="Open All 38 Hospital Modules Drawer"
                          >
                            All 38 ➔
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                          {[
                            { id: 'DOCTOR' as const, label: 'Doctor', icon: '🩺', allowedMod: 'clinical-consultation' as PartnerModuleKey },
                            { id: 'NURSE' as const, label: 'Nurse', icon: '👩‍⚕️', allowedMod: 'nurse-triage-station' as PartnerModuleKey },
                            { id: 'PHARMACY' as const, label: 'Rx POS', icon: '💊', allowedMod: 'pharmacy-medication' as PartnerModuleKey },
                            { id: 'LAB' as const, label: 'Lab', icon: '🧪', allowedMod: 'clinical-investigation' as PartnerModuleKey }
                          ]
                            .filter((desk) => isDestructiveActionAllowed(currentUser?.role) || isPartnerModuleAllowed(desk.allowedMod, currentUser?.role, currentUser?.permissions))
                            .map((desk) => {
                              const isSelected = rolePerspective === desk.id;
                              return (
                                <button
                                  key={desk.id}
                                  type="button"
                                  onClick={() => {
                                    handleSetRolePerspective(desk.id);
                                    setIsSimpleMode(true);
                                    setActiveModule('my-smart-desk');
                                    if (desk.id === 'PHARMACY') setPharmacyTab('pos');
                                    if (desk.id === 'LAB') setInvestigationTab('processing');
                                    if (desk.id === 'NURSE') setInpatientTab('bed-board');
                                  }}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '2px',
                                    padding: '6px 2px',
                                    borderRadius: '8px',
                                    border: isSelected ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                                    color: isSelected ? '#FFFFFF' : '#94A3B8',
                                    fontSize: '0.65rem',
                                    fontWeight: isSelected ? 800 : 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isSelected ? '0 0 8px rgba(56, 189, 248, 0.3)' : 'none'
                                  }}
                                  title={`Switch to ${desk.label} Smart Desk`}
                                >
                                  <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{desk.icon}</span>
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{desk.label}</span>
                                </button>
                              );
                            })}
                        </div>
                      </>
                    )}
                  </div>
                )
              }
              isCollapsed={isSidebarCollapsed}
              onItemClick={() => setIsMobileDrawerOpen(false)}
              sections={getDynamicSections()}
              footerSlot={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  {/* Executive-Only Docked All 38 Modules Drawer Button */}
                  {isHospitalExecutive(currentUser?.role) && (
                    isSidebarCollapsed ? (
                      <button
                        type="button"
                        onClick={() => setIsAllModulesDrawerOpen(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          padding: '8px 4px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          border: '1px dashed rgba(56, 189, 248, 0.35)',
                          color: '#38BDF8',
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="Open All 38 Hospital Modules Drawer (Searchable catalog & categories)"
                      >
                        📁
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAllModulesDrawerOpen(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(56, 189, 248, 0.08)',
                          border: '1px dashed rgba(56, 189, 248, 0.3)',
                          color: '#38BDF8',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.16)';
                          e.currentTarget.style.borderColor = '#38BDF8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                        }}
                        title="Open All 38 Hospital Modules Drawer (Searchable catalog & domain tabs)"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📁</span>
                          <span>All 38 Modules</span>
                        </div>
                        <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(56, 189, 248, 0.18)', color: '#38BDF8', padding: '1.5px 6px', borderRadius: '4px', fontWeight: 800 }}>
                          Drawer ➔
                        </span>
                      </button>
                    )
                  )}

                  {isSidebarCollapsed ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 4px',
                        backgroundColor: 'rgba(30, 41, 59, 0.4)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                      title="System Online • v2.6.4 • MediSphere Core"
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                          boxShadow: '0 0 8px #10B981'
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(30, 41, 59, 0.4)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                            boxShadow: '0 0 8px #10B981'
                          }}
                        />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8' }}>
                          System Online
                        </span>
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, fontFamily: 'monospace' }}>
                        v2.6.4
                      </span>
                    </div>
                  )}
                </div>
              }
            />
          )
        }
      header={
        activeModule === 'clinical-consultation' ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {isDoctorFocusMode ? (
            <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 20px',
              backgroundColor: 'var(--ds-color-surface, #0F172A)',
              borderBottom: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
              color: 'var(--ds-color-text-primary, #F8FAFC)',
              minHeight: '52px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>🩺</span>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                    {currentUser?.name || 'Doctor On Duty'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 600 }}>
                    Consulting Physician • OPD Desk (Room 101)
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(2, 132, 199, 0.2)',
                  border: '1px solid #0284C7',
                  color: '#38BDF8',
                  fontSize: '0.71875rem',
                  fontWeight: 800
                }}
              >
                <span>⚡ Solo Doctor Cockpit</span>
                <span style={{ opacity: 0.6 }}>|</span>
                <span>Zero Distractions</span>
                <span style={{ opacity: 0.6 }}>|</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>Pro Clinic (Active)</span>
                <span style={{ opacity: 0.6 }}>|</span>
                <span style={{ color: '#E0E7FF', fontSize: '0.6875rem' }}>ACTIVE ⇄ FULL ERP</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <OptimisticSyncBadge />

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('docsearch:toggle_ambient_scribe'))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#38BDF8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <span>🎙️</span>
                <span>Voice Scribe</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--ds-color-surface-subtle, rgba(255,255,255,0.06))',
                  border: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.12))',
                  color: 'var(--ds-color-text-primary, #F8FAFC)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>🔍</span>
                <span>Cmd+K</span>
              </button>

              <button
                type="button"
                onClick={() => toggleDoctorFocusMode()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#F87171',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Exit Solo Doctor Cockpit and restore standard navigation (Esc or Alt+F)"
              >
                <span>✕</span>
                <span>Exit Cockpit</span>
                <kbd style={{ fontSize: '0.625rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', marginLeft: '2px' }}>Alt+F</kbd>
              </button>
            </div>
          </div>
        ) : (
          <Header
            showFullscreenToggle={false}
            onMenuToggle={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setIsMobileDrawerOpen((prev) => !prev);
              } else {
                setIsSidebarCollapsed((prev) => !prev);
              }
            }}
            onBack={handleGoBack}
            canGoBack={!isClinicVertical && navHistory.length > 0}
          title={
            isClinicVertical ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#38BDF8',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{currentModuleMeta.icon}</span>
                  <span>{currentModuleMeta.title}</span>
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.22)',
                    color: '#38BDF8',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{currentWsp.icon}</span>
                  <span>{workspace.replace(/_/g, ' ')}</span>
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.85rem', userSelect: 'none' }}>›</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span style={{ fontSize: '0.95rem' }}>{currentModuleMeta.icon}</span>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#F8FAFC',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={currentModuleMeta.title}
                  >
                    {currentModuleMeta.title}
                  </span>
                </div>
              </div>
            )
          }
          organizationSlot={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '620px', minWidth: '160px' }}>
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94A3B8',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                  e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
                }}
                title="Universal Command Palette & Patient Search (Cmd+K / Ctrl+K)"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isLabOrPathology
                      ? 'Search specimens, test orders, patients...'
                      : isPharmacyVertical
                      ? 'Search medicines, barcode, batch, RX...'
                      : isClinicVertical
                      ? 'Search patients, appointments, UHID...'
                      : 'Search patients, records, modules...'}
                  </span>
                </div>
                <kbd
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#94A3B8',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    flexShrink: 0
                  }}
                >
                  {typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform) ? 'Cmd+K' : 'Ctrl+K'}
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => setIsKeyboardShortcutsOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94A3B8',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                  e.currentTarget.style.color = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#94A3B8';
                }}
                title="Keyboard Shortcuts Cheat Sheet (Ctrl + /)"
              >
                <span>⌨️</span>
                <kbd style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#38BDF8', backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 5px', borderRadius: '4px' }}>Ctrl+/</kbd>
              </button>
            </div>
          }
          userSlot={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {/* DocSearch Offline-First Background Sync Indicator */}
              <OptimisticSyncBadge />

              {/* PWA 1-Click Installation - tucked into profile on clinic */}
              {!isClinicVertical && <PwaInstallButton />}

              {/* Universal 1-Click Quick Add Menu */}
              <div ref={quickAddRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    backgroundColor: isQuickAddOpen ? '#0284C7' : 'rgba(2, 132, 199, 0.15)',
                    border: isQuickAddOpen ? '1.5px solid #38BDF8' : '1px solid rgba(56, 189, 248, 0.35)',
                    color: isQuickAddOpen ? '#FFFFFF' : '#38BDF8',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isQuickAddOpen ? '0 0 12px rgba(2, 132, 199, 0.4)' : 'none'
                  }}
                  title="Quick Add: Fast OPD Registration, 1-Flow Express, Consultation, Billing"
                >
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
                  <span className="ds-hide-on-compact">
                    {isLabOrPathology
                      ? 'New Specimen'
                      : isPharmacyVertical
                      ? 'New Rx Bill'
                      : isClinicVertical
                      ? 'New Token'
                      : 'Quick Add'}
                  </span>
                </button>

                {isQuickAddOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '240px',
                      backgroundColor: 'var(--ds-color-surface, #0F172A)',
                      border: '1px solid var(--ds-color-border, #334155)',
                      borderRadius: '12px',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                      zIndex: 9999,
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ padding: '6px 8px', fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {rolePerspective === 'FRONT_DESK' ? 'Front Desk Fast Actions' : 'Fast Clinical Actions'}
                    </div>

                    {rolePerspective === 'FRONT_DESK' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickAddOpen(false);
                            window.dispatchEvent(new CustomEvent('docsearch:open_frontdesk_walkin'));
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#F1F5F9',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🎫</span>
                            <span>+ New Walk-in / OPD Token</span>
                          </div>
                          <kbd style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)' }}>F2</kbd>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickAddOpen(false);
                            window.dispatchEvent(new CustomEvent('docsearch:open_frontdesk_book'));
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#F1F5F9',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📅</span>
                            <span>+ Book Future Slot</span>
                          </div>
                          <kbd style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)' }}>F3</kbd>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickAddOpen(false);
                            setIsFastOpdDrawerOpen(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#F1F5F9',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚡</span>
                            <span>Express OPD Registration</span>
                          </div>
                          <kbd style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.15)' }}>Alt+N</kbd>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickAddOpen(false);
                            setActiveModule('billing-revenue-cycle');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#F1F5F9',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <span>💳</span>
                          <span>Walk-In Bill & Receipt</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickAddOpen(false);
                            setIsFastOpdDrawerOpen(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#F1F5F9',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚡</span>
                            <span>Express OPD Registration</span>
                          </div>
                          <kbd style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.15)' }}>Alt+N</kbd>
                        </button>

                        {(rolePerspective === 'PHARMACY' || isHospitalExecutive(currentUser?.role)) && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsQuickAddOpen(false);
                              setActiveModule('pharmacy-medication');
                              setPharmacyTab('pos');
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: '#F1F5F9',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>💊</span>
                              <span>Fast Pharmacy POS Counter</span>
                            </div>
                            <kbd style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.15)' }}>Alt+B</kbd>
                          </button>
                        )}

                        {isVoiceScribeAllowed(currentUser?.role) && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsQuickAddOpen(false);
                              window.dispatchEvent(new CustomEvent('docsearch:toggle_ambient_scribe'));
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: '#F1F5F9',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🎙️</span>
                              <span>Ambient AI Voice Scribe</span>
                            </div>
                            <kbd style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.15)' }}>Alt+M</kbd>
                          </button>
                        )}

                        {isClinicianRole(currentUser?.role) && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsQuickAddOpen(false);
                              setActiveModule('clinical-consultation');
                              window.dispatchEvent(new CustomEvent('docsearch:switch_to_cockpit'));
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: '#F1F5F9',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🩺</span>
                              <span>Solo Doctor Cockpit (30/70)</span>
                            </div>
                            <kbd style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', border: '1px solid rgba(6, 182, 212, 0.3)' }}>Alt+C</kbd>
                          </button>
                        )}

                        {(workspace === 'CLINIC' || String(currentUser?.role || '').toUpperCase().includes('CLINIC') || rolePerspective === 'DOCTOR' || isHospitalExecutive(currentUser?.role)) && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsQuickAddOpen(false);
                              setActiveModule('staff-administration');
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('docsearch:open_create_staff'));
                              }, 120);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: '#F1F5F9',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>👥</span>
                              <span style={{ color: '#34D399' }}>+ Add Staff (Nurse / Reception)</span>
                            </div>
                            <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 800 }}>INVITE</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickAddOpen(false);
                            setActiveModule('billing-revenue-cycle');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#F1F5F9',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <span>💳</span>
                          <span>Walk-In Bill & Receipt</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Master User Profile Pill with Floating Dropdown */}
              {currentUser && (
                <div ref={userMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '3px 10px 3px 6px',
                      borderRadius: '10px',
                      backgroundColor: isUserMenuOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.85)',
                      border: isUserMenuOpen ? `1.5px solid ${currentWsp.color}` : '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      outline: 'none',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      if (!isUserMenuOpen) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isUserMenuOpen) e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
                    }}
                    title="Facility Cockpit & Account Menu"
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: currentWsp.color,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        flexShrink: 0,
                        boxShadow: `0 0 8px ${currentWsp.color}40`
                      }}
                    >
                      {(currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="ds-hide-on-compact" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2 }}>
                        {currentUser?.name || currentUser?.email || 'Healthcare Staff'}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: currentWsp.color, fontWeight: 600, lineHeight: 1.1 }}>
                        {currentUser?.role?.replace(/_/g, ' ') || 'Healthcare Staff'}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        color: '#94A3B8',
                        marginLeft: '2px',
                        transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Floating User Menu Dropdown (Structured 5-Card Cockpit) */}
                  {isUserMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '320px',
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        backgroundColor: 'var(--ds-color-surface, #0F172A)',
                        border: '1px solid var(--ds-color-border, #334155)',
                        borderRadius: '14px',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                        zIndex: 9999,
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {/* CARD 1: User & Facility Profile + LiveSync Telemetry */}
                      <div
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '10px 12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: currentWsp.color,
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              flexShrink: 0,
                              boxShadow: `0 0 10px ${currentWsp.color}50`
                            }}
                          >
                            {(currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {currentUser?.name || currentUser?.email || 'Healthcare Staff'}
                            </div>
                            {currentUser.email && (
                              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {currentUser.email}
                              </div>
                            )}
                            <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {currentUser.tenantName || 'Healthcare Facility'}
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: `${currentWsp.color}22`,
                              color: currentWsp.color,
                              border: `1px solid ${currentWsp.color}55`
                            }}
                          >
                            {currentUser.role?.replace(/_/g, ' ') || 'HEALTHCARE STAFF'}
                          </span>
                          <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                            Active Session
                          </span>
                        </div>
                        <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                          <LiveSyncRefreshButton compact={false} style={{ width: '100%', justifyContent: 'center' }} />
                        </div>
                      </div>

                      {/* CARD 2: Active SaaS Plan & Upgrade Suite (Restricted to Hospital Executives / Owners) */}
                      {isHospitalExecutive(currentUser?.role) && (
                        <div
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            padding: '10px 12px'
                          }}
                        >
                          {(() => {
                            const currentPlan = partnerAccountPlan?.currentPlan;
                            const subscription = partnerAccountPlan?.subscription;
                            const isPaidOrPro = currentPlanTier.toLowerCase().includes('pro') || currentPlanTier.toLowerCase().includes('annual') || (subscription && subscription.status === 'ACTIVE' && !subscription.isFirstYearFree);
                            const planDisplayName = currentPlan?.name || (isPaidOrPro ? (isLabOrPathology ? 'Pathology LIMS Enterprise Suite' : isPharmacyVertical ? 'Pharmacy Super-Billing Suite' : isClinicVertical ? 'Polyclinic Pro Suite' : 'Hospital Enterprise Pro Suite') : (isLabOrPathology ? 'Pathology Founding Partner (1st Year Free)' : isPharmacyVertical ? 'Pharmacy Founding Partner (1st Year Free)' : isClinicVertical ? 'Clinic Founding Partner (1st Year Free)' : 'Hospital Founding Partner (1st Year Free)'));
                            const daysLeft = subscription?.daysRemaining ?? 365;
                            const statusBadgeText = subscription?.status === 'EXPIRED' || subscription?.status === 'LOCKED'
                              ? '🔴 Locked'
                              : subscription?.isInGracePeriod
                              ? '🟠 Grace Period'
                              : subscription?.isExpiringSoon
                              ? '🟡 Expiring Soon'
                              : isPaidOrPro
                              ? '💎 Pro Suite'
                              : '🟢 1st Year Free';

                            return (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    SaaS License Tier
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.6875rem',
                                      fontWeight: 800,
                                      color: isPaidOrPro ? '#A78BFA' : '#10B981',
                                      backgroundColor: isPaidOrPro ? 'rgba(167, 139, 250, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                      border: `1px solid ${isPaidOrPro ? 'rgba(167, 139, 250, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {statusBadgeText}
                                  </span>
                                </div>

                                {/* Real Authoritative Plan & Countdown Box */}
                                <div
                                  style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '8px',
                                    padding: '8px 10px',
                                    marginBottom: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.06)'
                                  }}
                                >
                                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '4px', lineHeight: 1.3 }}>
                                    {planDisplayName}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8' }}>
                                    <span>⏳ {daysLeft} Days Left</span>
                                    <span style={{ color: '#38BDF8', fontWeight: 700 }}>✓ Node-Locked</span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setUpgradeModalTargetFeature(drawerUpgradeTargetFeature);
                              setIsHospitalUpgradeModalOpen(true);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                              border: '1px solid #A78BFA',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 10px rgba(124, 58, 237, 0.35)',
                              marginBottom: '6px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{drawerUpgradeSuiteTitle}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsOfflineLicenseModalOpen(true);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid #0284C7',
                              color: '#38BDF8',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              marginBottom: '6px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>🔑 Activate / Node-Lock License</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveModule('account-plan-features');
                              setIsUserMenuOpen(false);
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '4px 6px',
                              background: 'transparent',
                              border: 'none',
                              color: '#38BDF8',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <span>Manage Plan & Add-ons</span>
                            <span>➔</span>
                          </button>
                        </div>
                      )}

                      {/* CARD 3: Focus & Display Mode */}
                      <div
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                          {isLabOrPathology ? 'Pathology & Lab Focus' : isPharmacyVertical ? 'Pharmacy & POS Focus' : isClinicVertical ? 'Clinic Practice Focus' : 'Focus & Display Mode'}
                        </div>

                        {isLabOrPathology ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                setActiveModule('clinical-investigation');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: activeModule === 'clinical-investigation' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: activeModule === 'clinical-investigation' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.06)',
                                color: activeModule === 'clinical-investigation' ? '#38BDF8' : '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span>🔬</span>
                                <span>Pathologist Validation Desk</span>
                              </div>
                              <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                VERIFY & SIGN
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                setActiveModule('clinical-investigation');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                color: '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span>🧪</span>
                                <span>Specimen Accessioning Focus</span>
                              </div>
                              <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                BARCODE INGEST
                              </span>
                            </button>
                          </>
                        ) : isPharmacyVertical ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                setActiveModule('pharmacy-medication');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: activeModule === 'pharmacy-medication' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: activeModule === 'pharmacy-medication' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.06)',
                                color: activeModule === 'pharmacy-medication' ? '#38BDF8' : '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span>💊</span>
                                <span>Fast POS Dispensing</span>
                              </div>
                              <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                1-CLICK POS
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                setActiveModule('pharmacy-medication');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                color: '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span>📦</span>
                                <span>GRN Batch & Stock Entry</span>
                              </div>
                              <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                FEFO INVENTORY
                              </span>
                            </button>
                          </>
                        ) : rolePerspective === 'FRONT_DESK' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                setActiveModule(workspace === 'CLINIC' ? 'clinic-home' : 'hospital-home');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: (activeModule === 'clinic-home' || activeModule === 'hospital-home' || activeModule === 'my-smart-desk') ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: (activeModule === 'clinic-home' || activeModule === 'hospital-home' || activeModule === 'my-smart-desk') ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.06)',
                                color: (activeModule === 'clinic-home' || activeModule === 'hospital-home' || activeModule === 'my-smart-desk') ? '#38BDF8' : '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span>📇</span>
                                <span>Front Desk Workstation</span>
                              </div>
                              <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                ACTIVE DESK
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                window.dispatchEvent(new CustomEvent('docsearch:open_frontdesk_walkin'));
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                color: '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span>🎫</span>
                                <span>+ New Walk-in / OPD Token</span>
                              </div>
                              <kbd style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)' }}>F2</kbd>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                setActiveModule('encounters-visits');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: activeModule === 'encounters-visits' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: activeModule === 'encounters-visits' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.06)',
                                color: activeModule === 'encounters-visits' ? '#38BDF8' : '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span>⏱️</span>
                                <span>Live OPD Queue Board</span>
                              </div>
                              <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                REAL-TIME
                              </span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                toggleDoctorFocusMode();
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: isDoctorFocusMode ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: isDoctorFocusMode ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.06)',
                                color: isDoctorFocusMode ? '#38BDF8' : '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span>🩺</span>
                                <span>Solo Doctor Focus Mode</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <kbd style={{ fontSize: '0.6rem', color: '#64748B', fontFamily: 'monospace' }}>Alt+F</kbd>
                                <span style={{ fontSize: '0.625rem', backgroundColor: isDoctorFocusMode ? '#0284C7' : 'rgba(255, 255, 255, 0.1)', color: '#FFF', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                  {isDoctorFocusMode ? 'ACTIVE' : 'OFF'}
                                </span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                setActiveModule('opd-one-flow-express');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: activeModule === 'opd-one-flow-express' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: activeModule === 'opd-one-flow-express' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.06)',
                                color: activeModule === 'opd-one-flow-express' ? '#38BDF8' : '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span>⚡</span>
                                <span>OPD 1-Flow Express</span>
                              </div>
                              <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                0-TAB SPEED
                              </span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (!document.fullscreenElement) {
                              if (document.documentElement.requestFullscreen) {
                                document.documentElement.requestFullscreen().catch(() => {});
                              } else if ((document.documentElement as any).webkitRequestFullscreen) {
                                (document.documentElement as any).webkitRequestFullscreen();
                              }
                            } else {
                              if (document.exitFullscreen) {
                                document.exitFullscreen().catch(() => {});
                              } else if ((document as any).webkitExitFullscreen) {
                                (document as any).webkitExitFullscreen();
                              }
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            color: '#CBD5E1',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <span>⛶</span>
                            <span>Kiosk Fullscreen</span>
                          </div>
                          <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#94A3B8', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                            F11
                          </span>
                        </button>
                      </div>

                      {/* CARD 4: Role Perspective Switcher (Filters Sidebar Navigation) */}
                      <div
                        style={{
                          backgroundColor: 'var(--ds-color-surface-subtle, rgba(15, 23, 42, 0.75))',
                          border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                          borderRadius: '10px',
                          padding: '10px 12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Role Perspective
                          </div>
                          <span style={{ fontSize: '0.625rem', color: '#38BDF8', fontWeight: 600 }}>
                            {rolePerspective === 'AUTO' ? 'Auto Mode' : `${rolePerspective} Mode`}
                          </span>
                        </div>

                        {!isDestructiveActionAllowed(currentUser?.role) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <span style={{ fontSize: '1.1rem' }}>🔒</span>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.3 }}>
                              Assigned: <strong style={{ color: '#F8FAFC' }}>{currentUser?.role?.replace(/_/g, ' ') || 'HEALTHCARE STAFF'}</strong>
                              <div style={{ fontSize: '0.625rem', color: '#38BDF8', marginTop: '2px' }}>Locked per Contractual RBAC Policy</div>
                            </div>
                          </div>
                        ) : (
                          (() => {
                            const roleButtons = isLabOrPathology
                              ? [
                                  { id: 'AUTO', label: 'Auto', icon: '⚡' },
                                  { id: 'LAB', label: 'Lab Tech', icon: '🧪' },
                                  { id: 'DOCTOR', label: 'Pathologist', icon: '🔬' },
                                  { id: 'FRONT_DESK', label: 'Accession', icon: '📇' },
                                  { id: 'BILLING', label: 'Cashier', icon: '💳' },
                                  { id: 'ADMIN', label: 'Lab Admin', icon: '👑' }
                                ]
                              : isPharmacyVertical
                              ? [
                                  { id: 'AUTO', label: 'Auto', icon: '⚡' },
                                  { id: 'PHARMACY', label: 'Pharmacist', icon: '💊' },
                                  { id: 'BILLING', label: 'POS Cashier', icon: '💳' },
                                  { id: 'ADMIN', label: 'Store Admin', icon: '👑' }
                                ]
                              : isClinicVertical
                              ? [
                                  { id: 'AUTO', label: 'Auto', icon: '⚡' },
                                  { id: 'DOCTOR', label: 'Doctor', icon: '🩺' },
                                  { id: 'FRONT_DESK', label: 'Reception', icon: '📇' },
                                  { id: 'BILLING', label: 'Billing', icon: '💳' },
                                  { id: 'ADMIN', label: 'Clinic Admin', icon: '👑' }
                                ]
                              : [
                                  { id: 'AUTO', label: 'Auto', icon: '⚡' },
                                  { id: 'DOCTOR', label: 'Doctor', icon: '🩺' },
                                  { id: 'NURSE', label: 'Nurse', icon: '👩‍⚕️' },
                                  { id: 'FRONT_DESK', label: 'FrontDesk', icon: '📇' },
                                  { id: 'PHARMACY', label: 'Pharmacy', icon: '💊' },
                                  { id: 'LAB', label: 'Lab', icon: '🧪' },
                                  { id: 'BILLING', label: 'Billing', icon: '💳' },
                                  { id: 'ADMIN', label: 'Admin', icon: '👑' }
                                ];

                            return (
                              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${roleButtons.length <= 4 ? roleButtons.length : 4}, 1fr)`, gap: '5px' }}>
                                {roleButtons.map((r) => {
                                  const isSelected = rolePerspective === r.id;
                                  return (
                                    <button
                                      key={r.id}
                                      type="button"
                                      onClick={() => handleSetRolePerspective(r.id as RolePerspective)}
                                      style={{
                                        padding: '6px 4px',
                                        borderRadius: '6px',
                                        border: isSelected ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                        color: isSelected ? '#FFFFFF' : '#94A3B8',
                                        fontSize: '0.6875rem',
                                        fontWeight: isSelected ? 700 : 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '2px',
                                        transition: 'all 0.12s ease'
                                      }}
                                    >
                                      <span style={{ fontSize: '0.85rem' }}>{r.icon}</span>
                                      <span>{r.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()
                        )}
                      </div>

                      {/* CARD 5: Administrative, Security & Governance Controls */}
                      <div
                        style={{
                          backgroundColor: 'var(--ds-color-surface-subtle, rgba(15, 23, 42, 0.75))',
                          border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                          borderRadius: '10px',
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                      >
                        <div style={{ padding: '4px 6px', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Admin & Security Controls
                        </div>

                        {/* 1. Master Modules Directory */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAllModulesDrawerOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#CBD5E1',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title={`Open Slide-Over Directory of ${drawerDirectoryTitle}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📂</span>
                            <span>{drawerDirectoryTitle}</span>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#38BDF8', fontWeight: 600 }}>{drawerDirectorySubtitle}</span>
                        </button>

                        {/* Keyboard Shortcuts & Hotkeys Guide */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCommandPaletteOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#CBD5E1',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="Open Universal Multi-Entity Command Palette & Keyboard Shortcuts Reference"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⌨️</span>
                            <span>Keyboard Shortcuts</span>
                          </div>
                          <span style={{ fontSize: '0.625rem', color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                            ⌘K / Alt+N
                          </span>
                        </button>

                        {/* 2. Approvals & Alerts Hub */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsFounderApprovalsOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#CBD5E1',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>👑</span>
                            <span>Approvals & Alerts Hub</span>
                          </div>
                          {pendingCount > 0 && (
                            <span style={{ backgroundColor: '#EF4444', color: '#FFF', padding: '1px 6px', borderRadius: '8px', fontSize: '0.625rem', fontWeight: 700 }}>
                              {pendingCount}
                            </span>
                          )}
                        </button>

                        {/* 3, 4, 5: Executive-only Security & Emergency Overrides */}
                        {isHospitalExecutive(currentUser?.role) && (
                          <>
                            {/* 3. Break-Glass Emergency Override */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsGlobalBreakGlassOpen(true);
                                setIsUserMenuOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: 'transparent',
                                border: 'none',
                                color: '#FCA5A5',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              title="Break-Glass Emergency Protocol for Trauma & Life-Saving Interventions"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🚨</span>
                                <span>Break-Glass Emergency</span>
                              </div>
                              <span style={{ fontSize: '0.6rem', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>
                                OVERRIDE
                              </span>
                            </button>

                            {/* 4. Pre-LLM PHI Redactor Studio */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsPreLlmModalOpen(true);
                                setIsUserMenuOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: 'transparent',
                                border: 'none',
                                color: '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              title="HIPAA / DISHA Compliant Local Pre-LLM PHI Redaction"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🛡️</span>
                                <span>PHI Redactor Studio</span>
                              </div>
                              <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 600 }}>Zero-Leak</span>
                            </button>

                            {/* 5. Forensic Leak Investigator */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsLeakInvestigatorOpen(true);
                                setIsUserMenuOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: 'transparent',
                                border: 'none',
                                color: '#CBD5E1',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              title="Watermark & Forensic Cryptographic Audit Leak Investigator"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🔍</span>
                                <span>Forensic Leak Audit</span>
                              </div>
                              <span style={{ fontSize: '0.65rem', color: '#A78BFA', fontWeight: 600 }}>SHA-256</span>
                            </button>
                          </>
                        )}

                        {/* 6. Theme Studio */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsThemeStudioOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#CBD5E1',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🎨</span>
                            <span>Theme Studio (15 Themes)</span>
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                            {getThemeLabel(theme)}
                          </span>
                        </button>

                        {/* 7. Facility & Account Settings */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingsModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#CBD5E1',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <span>⚙️</span>
                          <span>Facility & Account Settings</span>
                        </button>

                        {/* 8. Change Password & Security Credentials */}
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsInitialTab('PASSWORD');
                            setIsSettingsModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#CBD5E1',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="Change Login Password & Security Credentials"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🔑</span>
                            <span>Change Password & Security</span>
                          </div>
                          <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 600 }}>Secured</span>
                        </button>

                        {/* 8. Partner Rewards & Grants */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModule('offers-rewards-hub');
                            window.dispatchEvent(new CustomEvent('docsearch_open_referral_showcase'));
                            setIsUserMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#94A3B8',
                            fontSize: '0.78rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <span>🎁</span>
                          <span>Partner Rewards & Grants</span>
                        </button>

                        <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                        {/* 9. Sign Out */}
                        {onLogout && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onLogout();
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 8px',
                              borderRadius: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: '#F87171',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                              e.currentTarget.style.color = '#EF4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#F87171';
                            }}
                          >
                            <span style={{ fontSize: '0.95rem' }}>🚪</span>
                            <span>Sign Out</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          }
        />
        )}
        {workspace !== 'CLINIC' && (
          <PatientSessionTabBar
            onNavigateModule={(modKey, subTab) => {
              setActiveModule(modKey as PartnerModuleKey);
              if (modKey === 'pharmacy-medication' && subTab) {
                setPharmacyTab(subTab as ActivePharmacyTab);
              }
              if (modKey === 'inpatient-management' && subTab) {
                setInpatientTab(subTab as InpatientTab);
              }
            }}
            onOpenFastRegistration={() => setIsFastOpdDrawerOpen(true)}
          />
        )}
      </div>
      )
    }
    >
      <ContentArea>
        {/* MOBILE OWNER PULSE COCKPIT (Visible on smartphone screens < 768px for real-time facility metrics) */}
        <OwnerPulseCockpit
          currentUser={currentUser as any}
          onNavigateModule={(modKey) => setActiveModule(modKey as PartnerModuleKey)}
          onOpenFastRegistration={() => setIsFastOpdDrawerOpen(true)}
        />

        {/* DYNAMIC CROSS-DEPARTMENT ACTIVE PATIENT CONTEXT HUD (Visible across Clinical, Pathology, Pharmacy, and Billing counters) */}
        {isClinicalModule(activeModule) && !isDoctorFocusMode && (
          <ActivePatientContextBar
            currentModule={activeModule}
            onNavigateModule={(modKey, subTab) => {
              setActiveModule(modKey);
              if (modKey === 'pharmacy-medication' && subTab) {
                setPharmacyTab(subTab as ActivePharmacyTab);
              }
              if (modKey === 'inpatient-management' && subTab) {
                setInpatientTab(subTab as InpatientTab);
              }
            }}
            onOpenPrintModal={(type, pat) => {
              guardedOpenPrintModal(type, pat);
            }}
          />
        )}

        {!isModuleAllowedForPartnerProfile(
          activeModule,
          currentUser?.organizationType || workspace,
          currentUser?.role,
          currentUser?.permissions,
          currentUser?.accessibleFeatures
        ) ? (
          <PartnerAccessDeniedShield
            staffName={currentUser?.name}
            role={currentUser?.role}
            roleTitle={currentUser?.roleTitle}
            department={currentUser?.department}
            moduleKey={activeModule}
            onReturn={() =>
              setActiveModule((currentUser?.defaultModule as PartnerModuleKey) || 'account-plan-features')
            }
          />
        ) : (isFreeHospital && isHospitalModuleLocked(activeModule, currentPlanTier || currentUser?.planTier)) ? (
          <React.Suspense fallback={null}>
            <HospitalFeatureUpgradeShowcase
              moduleKey={activeModule}
              onOpenUpgradeModal={(name) => {
                setUpgradeModalTargetFeature(name);
                setIsHospitalUpgradeModalOpen(true);
              }}
              onReturnHome={() => setActiveModule('hospital-home')}
            />
          </React.Suspense>
        ) : (
          <React.Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '440px',
                  width: '100%'
                }}
              >
                <DocSearch3DLogoLoader mode="download" size="md" />
              </div>
            }
          >
            {rolePerspective === 'FRONT_DESK' && (isHomeModule || activeModule === 'my-smart-desk') ? (
              <FrontDeskWorkstationView
                currentUser={currentUser}
                tenantId={resolvedTenantId}
                facilityName={cleanFacilityBrand}
                onNavigateModule={(modKey) => setActiveModule(modKey)}
              />
            ) : (
              <>
                {activeModule === 'my-smart-desk' && effectiveWorkspace !== 'CLINIC' && (
                  <RoleTailoredSmartDeskView
                    currentRole={rolePerspective}
                    onChangeRole={handleSetRolePerspective}
                    currentUser={currentUser}
                    onNavigateModule={(modKey, subTab) => {
                      if (modKey === 'pharmacy-medication' && subTab) {
                        setPharmacyTab(subTab as ActivePharmacyTab);
                      }
                      if (modKey === 'patient-registration' && subTab) {
                        setPatientRegistrationTab(subTab as ActivePatientTab);
                      }
                      if (modKey === 'inpatient-management' && subTab) {
                        setInpatientTab(subTab as InpatientTab);
                      }
                      if (modKey === 'clinical-investigation' && subTab) {
                        setInvestigationTab(subTab as ActiveInvestigationTab);
                      }
                      if (modKey === 'radiology-imaging' && subTab) {
                        setRadiologyTab(subTab);
                      }
                      if (modKey === 'billing-revenue-cycle' && subTab) {
                        setBillingTab(subTab);
                      }
                      setActiveModule(modKey);
                    }}
                    onOpenAllModulesDrawer={() => setIsAllModulesDrawerOpen(true)}
                    facilityName={cleanFacilityBrand || currentUser?.tenantName || currentWsp.name}
                  />
                )}
                {activeModule === 'my-smart-desk' && effectiveWorkspace !== 'CLINIC' && (
                  <StaffOperationalRoleDashboard
                    currentUser={currentUser}
                    onNavigateModule={(modKey, subTab) => {
                      if (modKey === 'pharmacy-medication' && subTab) {
                        setPharmacyTab(subTab as ActivePharmacyTab);
                      }
                      if (modKey === 'patient-registration' && subTab) {
                        setPatientRegistrationTab(subTab as ActivePatientTab);
                      }
                      if (modKey === 'inpatient-management' && subTab) {
                        setInpatientTab(subTab as InpatientTab);
                      }
                      if (modKey === 'clinical-investigation' && subTab) {
                        setInvestigationTab(subTab as ActiveInvestigationTab);
                      }
                      if (modKey === 'radiology-imaging' && subTab) {
                        setRadiologyTab(subTab);
                      }
                      if (modKey === 'billing-revenue-cycle' && subTab) {
                        setBillingTab(subTab);
                      }
                      setActiveModule(modKey);
                    }}
                    tenantId={resolvedTenantId}
                    facilityName={cleanFacilityBrand || currentUser?.tenantName || currentWsp.name}
                  />
                )}
                {activeModule === 'pathology-home' && (
                  <PathologyHomeActivityHub
                    tenantId={resolvedTenantId}
                    onNavigateModule={(modKey, subTab) => {
                      if (modKey === 'clinical-investigation' && subTab) {
                        setInvestigationTab(subTab as ActiveInvestigationTab);
                      }
                      setActiveModule(modKey);
                    }}
                    staffName={currentUser?.name}
                    facilityName={cleanFacilityBrand || currentUser?.tenantName || currentWsp.name}
                    role={currentUser?.role}
                  />
                )}
                {(activeModule === 'clinic-home' || (activeModule === 'my-smart-desk' && effectiveWorkspace === 'CLINIC')) && (
                  <ClinicHomeActivityHub
                    tenantId={resolvedTenantId}
                    onNavigateModule={(modKey, subTab) => {
                      if (modKey === 'pharmacy-medication' && subTab) {
                        setPharmacyTab(subTab as ActivePharmacyTab);
                      }
                      if (modKey === 'patient-registration' && subTab) {
                        setPatientRegistrationTab(subTab as ActivePatientTab);
                      }
                      if (modKey === 'inpatient-management' && subTab) {
                        setInpatientTab(subTab as InpatientTab);
                      }
                      setActiveModule(modKey);
                    }}
                    staffName={currentUser?.name}
                    facilityName={cleanFacilityBrand || currentUser?.tenantName || currentWsp.name}
                    role={currentUser?.role}
                  />
                )}
                {activeModule === 'pharmacy-home' && (
                  <PharmacyHomeActivityHub
                    tenantId={resolvedTenantId}
                    onNavigateModule={(modKey, subTab) => {
                      if (modKey === 'pharmacy-medication' && subTab) {
                        setPharmacyTab(subTab as ActivePharmacyTab);
                      }
                      setActiveModule(modKey);
                    }}
                    staffName={currentUser?.name}
                    facilityName={cleanFacilityBrand || currentUser?.tenantName || currentWsp.name}
                    role={currentUser?.role}
                  />
                )}
                {activeModule === 'diagnostic-home' && (
                  <DiagnosticCentreHomeActivityHub
                    tenantId={resolvedTenantId}
                    onNavigateModule={(modKey, subTab) => {
                      if (modKey === 'patient-registration' && subTab) {
                        setPatientRegistrationTab(subTab as ActivePatientTab);
                      }
                      if (modKey === 'radiology-imaging' && subTab) {
                        setRadiologyTab(subTab);
                      }
                      if (modKey === 'billing-revenue-cycle' && subTab) {
                        setBillingTab(subTab);
                      }
                      setActiveModule(modKey);
                    }}
                    staffName={currentUser?.name}
                    facilityName={cleanFacilityBrand || currentUser?.tenantName || currentWsp.name}
                    role={currentUser?.role}
                  />
                )}
                {activeModule === 'hospital-home' && (
                  <HospitalHomeActivityHub
                    tenantId={resolvedTenantId}
                    onNavigateModule={(modKey, subTab) => {
                      if (modKey === 'inpatient-management' && subTab) {
                        setInpatientTab(subTab as InpatientTab);
                      }
                      if (modKey === 'pharmacy-medication' && subTab) {
                        setPharmacyTab(subTab as ActivePharmacyTab);
                      }
                      if (modKey === 'patient-registration' && subTab) {
                        setPatientRegistrationTab(subTab as ActivePatientTab);
                      }
                      setActiveModule(modKey);
                    }}
                    staffName={currentUser?.name}
                    facilityName={cleanFacilityBrand || currentUser?.tenantName || currentWsp.name}
                    role={currentUser?.role}
                  />
                )}
              </>
            )}
            {activeModule === 'enterprise-home' && (
              <EnterpriseCommandHomeActivityHub
                tenantId={resolvedTenantId}
                onNavigateModule={(modKey, subTab) => {
                  if (modKey === 'pharmacy-medication' && subTab) {
                    setPharmacyTab(subTab as ActivePharmacyTab);
                  }
                  if (modKey === 'patient-registration' && subTab) {
                    setPatientRegistrationTab(subTab as ActivePatientTab);
                  }
                  if (modKey === 'inpatient-management' && subTab) {
                    setInpatientTab(subTab as InpatientTab);
                  }
                  setActiveModule(modKey);
                }}
                staffName={currentUser?.name}
                facilityName={currentUser?.tenantName || currentWsp.name}
                role={currentUser?.role}
                onOpenApprovalsModal={() => setIsFounderApprovalsOpen(true)}
              />
            )}
            {activeModule === 'executive-command-center' && (
              <ExecutiveCommandDomainManager
                tenantId={resolvedTenantId}
                onNavigateModule={(modKey) => setActiveModule(modKey)}
                currentUserRole={currentUser?.role}
              />
            )}
            {activeModule === 'ai-chat-assistant' && (
              <AiChatAssistantDomainManager tenantId={resolvedTenantId} role={currentUser?.role} />
            )}
            {activeModule === 'organization-foundation' && (
              <PartnerFoundationDomainManager />
            )}
            {activeModule === 'staff-administration' && (
              <StaffAdministrationDomainManager
                workspace={workspace}
                partnerType={currentUser?.organizationType || workspace}
                tenantId={resolvedTenantId}
                partnerId={(currentUser as any)?.partnerId || resolvedTenantId}
                organizationId={(currentUser as any)?.organizationId}
                facilityId={(currentUser as any)?.facilityId || (currentUser as any)?.branchId}
              />
            )}
            {activeModule === 'doctor-management' && (
              <DoctorRosterDomainManager />
            )}
            {/* Dedicated Partner Promotional Offers & Cash Rewards Hub */}
            {visitedModules.has('offers-rewards-hub') && (
              <div style={{ display: activeModule === 'offers-rewards-hub' ? 'block' : 'none' }}>
                <PartnerOffersRewardsHub
                  currentUser={currentUser}
                  onNavigateToModule={(modKey) => setActiveModule(modKey as any)}
                />
              </div>
            )}
            {visitedModules.has('billing-revenue-cycle') && (
              <div style={{ display: activeModule === 'billing-revenue-cycle' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Billing & Revenue Cycle">
                  <BillingDomainManager tenantId={resolvedTenantId} initialTab={billingTab} />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('pharmacy-medication') && (
              <div style={{ display: activeModule === 'pharmacy-medication' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Pharmacy & Medication">
                  <PharmacyDomainManager
                    currentUser={currentUser}
                    initialTab={pharmacyTab}
                    onTabChange={(tab) => setPharmacyTab(tab)}
                  />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('clinical-consultation') && (
              <div style={{ display: activeModule === 'clinical-consultation' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Clinical Consultation & EMR">
                  <ClinicalConsultationDomainManager
                    currentUser={currentUser}
                    tenantId={resolvedTenantId}
                    facilityName={cleanFacilityBrand || currentUser?.tenantName || currentWsp.name}
                  />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('opd-one-flow-express') && (
              <div style={{ display: activeModule === 'opd-one-flow-express' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="OPD 1-Flow Express">
                  <OpdOneFlowExpressView
                    tenantId={resolvedTenantId}
                    doctorName={currentUser?.name || 'Consultant Physician'}
                    doctorId={currentUser?.id}
                    onClose={() => setActiveModule('clinical-consultation')}
                  />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('help-desk-exit-hub') && (
              <div style={{ display: activeModule === 'help-desk-exit-hub' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Central Help Desk & Exit Hub">
                  <CentralHelpDeskExitHubView
                    tenantId={resolvedTenantId}
                  />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('preferred-partner-network') && (
              <div style={{ display: activeModule === 'preferred-partner-network' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Preferred Partner Network">
                  <PreferredPartnerNetworkView
                    tenantId={resolvedTenantId}
                    clinicId="default-clinic"
                    onNavigateToOpd={() => setActiveModule('opd-one-flow-express')}
                  />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('hospital-closed-loop') && (
              <div style={{ display: activeModule === 'hospital-closed-loop' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="In-House Closed-Loop Pipeline">
                  <HospitalInHouseClosedLoopView
                    tenantId={resolvedTenantId}
                    facilityName={getUnifiedPartnerProfile(currentUser).entityLegalName || 'Apex Multi-Speciality Hospital'}
                    onNavigateModule={(mod, tab) => {
                      setActiveModule(mod);
                      if (mod === 'pharmacy-medication' && tab) {
                        setPharmacyTab(tab as ActivePharmacyTab);
                      }
                    }}
                  />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('nurse-triage-station') && (
              <div style={{ display: activeModule === 'nurse-triage-station' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Nurse Vitals & Triage">
                  <NurseVitalsTriageStationView
                    tenantId={resolvedTenantId}
                    nurseName={currentUser?.name || 'Staff Nurse, RN'}
                    onPatientSentToDoctor={() => setActiveModule('clinical-consultation')}
                  />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('patient-registration') && (
              <div style={{ display: activeModule === 'patient-registration' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Patient Registration & OPD Reception">
                  <PatientRegistrationDomainManager initialTab={patientRegistrationTab} />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('encounters-visits') && (
              <div style={{ display: activeModule === 'encounters-visits' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Encounters & OPD Queue">
                  <EncounterDomainManager />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('clinical-investigation') && (
              <div style={{ display: activeModule === 'clinical-investigation' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Clinical Investigation & LIMS">
                  <ClinicalInvestigationDomainManager initialTab={investigationTab} />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('procurement-supply-chain') && (
              <div style={{ display: activeModule === 'procurement-supply-chain' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Procurement & Supply Chain">
                  <ProcurementDomainManager />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('inpatient-management') && (
              <div style={{ display: activeModule === 'inpatient-management' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Inpatient Beds & ADT">
                  <InpatientDomainManager
                    tenantId={resolvedTenantId}
                    initialTab={inpatientTab}
                  />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('insurance-claims') && (
              <div style={{ display: activeModule === 'insurance-claims' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Insurance & Claims">
                  <InsuranceClaimsDomainManager tenantId={resolvedTenantId} />
                </DomainErrorBoundary>
              </div>
            )}
            {visitedModules.has('emergency-trauma') && (
              <div style={{ display: activeModule === 'emergency-trauma' ? 'block' : 'none' }}>
                <DomainErrorBoundary domainName="Emergency & Trauma">
                  <EmergencyDomainManager tenantId={resolvedTenantId} />
                </DomainErrorBoundary>
              </div>
            )}
            {activeModule === 'operation-theatre-management' && (
              <OTDomainManager tenantId={resolvedTenantId} />
            )}
            {activeModule === 'medical-records' && (
              <MRDDomainManager tenantId={resolvedTenantId} />
            )}
            {activeModule === 'blood-bank-transfusion' && (
              <BloodBankDomainManager tenantId={resolvedTenantId} />
            )}
            {activeModule === 'radiology-imaging' && (
              <RadiologyDomainManager tenantId={resolvedTenantId} initialTab={radiologyTab} />
            )}
            {activeModule === 'dietary-kitchen-management' && (
              <DietaryDomainManager />
            )}
            {activeModule === 'asset-biomedical-maintenance' && (
              <AssetBiomedicalDomainManager tenantId={resolvedTenantId} />
            )}
            {activeModule === 'quality-incident-infection-control' && (
              <QualityInfectionDomainManager tenantId={resolvedTenantId} />
            )}
            {activeModule === 'abdm-fhir-gateway' && (
              <AbdmFhirDomainManager tenantId={resolvedTenantId} />
            )}
            {activeModule === 'ai-clinical-cdss' && (
              <AiCdssDomainManager tenantId={resolvedTenantId} />
            )}
            {activeModule === 'telemedicine-rpm' && (
              <TelemedicineRpmDomainManager tenantId={resolvedTenantId} />
            )}
            {activeModule === 'whatsapp-patient-portal' && (
              <WhatsAppPortalDomainManager tenantId={resolvedTenantId} />
            )}
            {activeModule === 'account-plan-features' && (
              <PartnerAccountPlanView
                currentUser={currentUser}
                onOpenQuickModal={() => setIsAccountPlanModalOpen(true)}
              />
            )}
          </React.Suspense>
        )}
      </ContentArea>
      <GlobalCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateModule={(mod) => {
          setActiveModule(mod);
          if (mod === 'pharmacy-medication') setPharmacyTab('pos');
        }}
        onSwitchWorkspace={(wsp) => handleWorkspaceChange(wsp)}
        onToggleTheme={toggleTheme}
        currentUserRole={currentUser?.role}
        allowedWorkspaces={currentUser?.allowedWorkspaces}
      />
      <React.Suspense fallback={null}>
        {isKeyboardShortcutsOpen && (
          <KeyboardShortcutsModal
            isOpen={isKeyboardShortcutsOpen}
            onClose={() => setIsKeyboardShortcutsOpen(false)}
            onNavigateModule={setActiveModule}
            onOpenFastOpd={() => setIsFastOpdDrawerOpen(true)}
          />
        )}
      </React.Suspense>
      <ProfileUpdateRequiredAlertModal
        isOpen={isProfileGuardAlertOpen}
        onClose={() => setIsProfileGuardAlertOpen(false)}
        blockedActionName={blockedPrintActionName}
        missingFields={profileGuardMissingFields}
        onOpenSettings={(tab) => {
          setSettingsInitialTab(tab || 'ADDRESS');
          setIsSettingsModalOpen(true);
        }}
      />
      <React.Suspense fallback={null}>
        {isSettingsModalOpen && (
          <UniversalAccountSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            currentUser={dynamicPartner ? { ...currentUser, ...dynamicPartner } : currentUser}
            initialTab={settingsInitialTab}
          />
        )}
        {isAccountPlanModalOpen && (
          <PartnerAccountPlanModal
            isOpen={isAccountPlanModalOpen}
            onClose={() => setIsAccountPlanModalOpen(false)}
            currentUser={dynamicPartner ? { ...currentUser, ...dynamicPartner } : currentUser}
          />
        )}
        {isHospitalUpgradeModalOpen && (
          <HospitalPlanUpgradeModal
            isOpen={isHospitalUpgradeModalOpen}
            onClose={() => setIsHospitalUpgradeModalOpen(false)}
            targetFeatureName={upgradeModalTargetFeature}
            currentUser={currentUser}
            partnerVertical={resolvedVertical}
            onUpgradeSuccess={(newPlanTier) => {
              setCurrentPlanTier(newPlanTier);
              if (currentUser) {
                currentUser.planTier = newPlanTier;
              }
              fetch('/api/v1/partner/account/plan-and-features')
                .then((r) => r.json())
                .then((json) => {
                  if (json?.success && json?.data) {
                    setPartnerAccountPlan(json.data);
                  }
                })
                .catch(() => {});
            }}
          />
        )}
        {isOfflineLicenseModalOpen && (
          <OfflineLicenseActivationModal
            isOpen={isOfflineLicenseModalOpen}
            onClose={() => setIsOfflineLicenseModalOpen(false)}
            onActivated={() => {
              setIsOfflineLicenseModalOpen(false);
              window.location.reload();
            }}
          />
        )}
        {licenseRevokedLockout && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              backgroundColor: 'rgba(15, 23, 42, 0.96)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                maxWidth: '520px',
                width: '100%',
                backgroundColor: '#1E293B',
                border: '2px solid #EF4444',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <span style={{ fontSize: '3rem' }}>🚫</span>
              <h2 style={{ color: '#F87171', margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>
                FACILITY ACCESS SUSPENDED BY HQ
              </h2>
              <p style={{ color: '#E2E8F0', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                {licenseRevokedLockout}
              </p>
              <div
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '8px',
                  color: '#94A3B8',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
              >
                EVENT: REMOTE_KILL_SWITCH_ACTIVE • TENANT: {currentUser?.tenantId || 'AUTHORIZED_PARTNER'}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsAccountPlanModalOpen(true)}
                  style={{
                    backgroundColor: '#10B981',
                    border: '1px solid #059669',
                    color: '#0F172A',
                    borderRadius: '6px',
                    padding: '9px 18px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  💳 Renew License
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('docsearch:open-ewan-recovery'));
                    }
                  }}
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                    border: '1px solid #06B6D4',
                    color: '#22D3EE',
                    borderRadius: '6px',
                    padding: '9px 18px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🤖 Talk to Ewan
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(true)}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38BDF8',
                    color: '#38BDF8',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🏢 View Facility Profile
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #64748B',
                    color: '#CBD5E1',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🔄 Re-Check License
                </button>
                <button
                  type="button"
                  onClick={() => setIsOfflineLicenseModalOpen(true)}
                  style={{
                    backgroundColor: '#0284C7',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: '#FFF',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🔑 Enter Renewal Key
                </button>
              </div>
            </div>
          </div>
        )}
        {isFounderApprovalsOpen && (
          <GlobalFounderApprovalsModal
            isOpen={isFounderApprovalsOpen}
            onClose={() => setIsFounderApprovalsOpen(false)}
            currentUserRole={currentUser?.role}
            currentUserName={currentUser?.name}
            currentUserEmail={currentUser?.email}
          />
        )}
        <ForensicWatermarkOverlay
          staffName={currentUser?.name || getUnifiedPartnerProfile(currentUser).doctorName || 'Authorized Clinician'}
          staffEmployeeCode={currentUser?.email ? `EMP-${currentUser.email.slice(0, 4).toUpperCase()}` : 'EMP-AUTH'}
          terminalIp="127.0.0.1"
          enabled={true}
        />
        <IdleScreenPrivacyShield
          idleTimeoutSeconds={300}
          staffName={currentUser?.name || getUnifiedPartnerProfile(currentUser).doctorName || 'Authorized Clinician'}
          enabled={true}
        />
        {isLeakInvestigatorOpen && (
          <ForensicLeakInvestigatorModal
            isOpen={isLeakInvestigatorOpen}
            onClose={() => setIsLeakInvestigatorOpen(false)}
            currentStaffName={currentUser?.name || getUnifiedPartnerProfile(currentUser).doctorName || 'Authorized Clinician'}
            currentStaffEmpCode={currentUser?.email ? `EMP-${currentUser.email.slice(0, 4).toUpperCase()}` : 'EMP-AUTH'}
            currentIp="127.0.0.1"
          />
        )}
        {isGlobalBreakGlassOpen && (
          <BreakGlassEmergencyModal
            isOpen={isGlobalBreakGlassOpen}
            onClose={() => setIsGlobalBreakGlassOpen(false)}
          />
        )}
        {isPreLlmModalOpen && (
          <PreLlmPhiRedactorStudioModal
            isOpen={isPreLlmModalOpen}
            onClose={() => setIsPreLlmModalOpen(false)}
          />
        )}

        {/* DYNAMIC REAL-TIME HOSPITAL EVENT STREAM DOCK */}
        {shouldShowFixedOverviewSections && <RealTimeHospitalActivityDock />}

        {/* SUB-10MS OPTIMISTIC UI + 5-SECOND UNDO (CTRL+Z) TOAST */}
        <OptimisticActionToast />

        {/* AMBIENT VOICE AI CLINICAL SCRIBE FLOATING HUD (ALT+M) - ONLY ACTIVE INSIDE CLINICAL CONSULTATION */}
        {isVoiceScribeAllowed(currentUser?.role, currentUser?.permissions) && activeModule === 'clinical-consultation' && (
          <AmbientVoiceScribeCapsule isConsultationMode={true} />
        )}

        {/* HARDWARE STATUS PILL - MOVED TO SETTINGS DRAWER, HIDDEN FROM MAIN CLINICAL DASHBOARD */}
        <HardwareStatusPill hidden={true} />

        {/* FULL-SCREEN BIOLUMINESCENT LASER BEAM SWEEP OVERLAY */}
        <BarcodeLaserSweepOverlay />

        {/* DYNAMIC HARDWARE PRINT & THERMAL SLIP STATION MODAL */}
        {isPrintModalOpen && (
          <ThermalPrintPreviewModal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
            initialType={printModalType}
            patient={printTargetPatient}
            hospitalName={getUnifiedPartnerProfile(currentUser).entityLegalName}
          />
        )}

        {/* 1. WAITING ROOM LIVE OPD TV TOKEN QUEUE SIGNAGE */}
        {isTvDisplayOpen && (
          <OpdQueueTvDisplayModal
            isOpen={isTvDisplayOpen}
            onClose={() => setIsTvDisplayOpen(false)}
            hospitalName={getUnifiedPartnerProfile(currentUser).entityLegalName}
          />
        )}

        {/* 2. AUTOMATED NEWS2 SEPSIS & CLINICAL DETERIORATION ENGINE */}
        {isNews2ModalOpen && (
          <News2ClinicalAlertModal
            isOpen={isNews2ModalOpen}
            onClose={() => setIsNews2ModalOpen(false)}
            patient={printTargetPatient}
          />
        )}

        {/* 3. CDSCO STATUTORY SCHEDULE H1 ANTIBIOTIC REGISTER */}
        {isScheduleH1ModalOpen && (
          <ScheduleH1DrugRegisterModal
            isOpen={isScheduleH1ModalOpen}
            onClose={() => setIsScheduleH1ModalOpen(false)}
          />
        )}

        {/* 4. ABDM 2.0 5-SECOND "SCAN & SHARE" QR COUNTER */}
        {isAbdmScanModalOpen && (
          <AbdmScanAndShareModal
            isOpen={isAbdmScanModalOpen}
            onClose={() => setIsAbdmScanModalOpen(false)}
            hospitalName={getUnifiedPartnerProfile(currentUser).entityLegalName}
          />
        )}

        {/* 5. ENTERPRISE THEME STUDIO (14 THEMES) */}
        {isThemeStudioOpen && (
          <ThemeStudioModal
            isOpen={isThemeStudioOpen}
            onClose={() => setIsThemeStudioOpen(false)}
          />
        )}

        {/* 6. FAST 1-SCREEN OPD REGISTRATION DRAWER */}
        {isFastOpdDrawerOpen && (
          <FastOpdRegistrationDrawer
            isOpen={isFastOpdDrawerOpen}
            onClose={() => setIsFastOpdDrawerOpen(false)}
            onSuccess={() => {
              setActiveModule('patient-registration');
            }}
          />
        )}

        {/* 7. ALL HOSPITAL MODULES SLIDE-OVER DRAWER */}
        {isAllModulesDrawerOpen && (
          <AllHospitalModulesDrawer
            isOpen={isAllModulesDrawerOpen}
            onClose={() => setIsAllModulesDrawerOpen(false)}
            activeModule={activeModule}
            onSelectModule={(mod) => {
              setActiveModule(mod);
              setIsAllModulesDrawerOpen(false);
            }}
            currentUserRole={currentUser?.role}
            currentUserPermissions={currentUser?.permissions}
            isFreeHospital={isFreeHospital}
            currentPlanTier={currentPlanTier || currentUser?.planTier}
            organizationType={currentUser?.organizationType || workspace}
            onOpenUpgradeModal={(name) => {
              setUpgradeModalTargetFeature(name);
              setIsHospitalUpgradeModalOpen(true);
            }}
            onTogglePersistentFullMode={() => {
              toggleSimpleMode();
            }}
          />
        )}
      </React.Suspense>

      {/* Material 3 / Android Adaptive Bottom Navigation for Mobile (<768px) */}
      {(() => {
        const role = String(currentUser?.role || '').toUpperCase();
        let destinations: Array<{ id: string; label: string; icon: React.ReactNode; onClick: () => void }> = [];
        let activeId = 'more';

        if (role.includes('NURSE')) {
          destinations = [
            {
              id: 'triage',
              label: 'Triage',
              icon: <span>👩‍⚕️</span>,
              onClick: () => setActiveModule('nurse-triage-station')
            },
            {
              id: 'beds',
              label: 'IPD Beds',
              icon: <span>🛏️</span>,
              onClick: () => setActiveModule('inpatient-management')
            },
            {
              id: 'emergency',
              label: 'Emergency',
              icon: <span>🚨</span>,
              onClick: () => setActiveModule('emergency-trauma')
            },
            {
              id: 'consult',
              label: 'Doctor Desk',
              icon: <span>🩺</span>,
              onClick: () => setActiveModule('clinical-consultation')
            },
            {
              id: 'more',
              label: 'Modules',
              icon: <span>☰</span>,
              onClick: () => setIsCommandPaletteOpen(true)
            }
          ];
          if (activeModule === 'nurse-triage-station') activeId = 'triage';
          else if (activeModule === 'inpatient-management') activeId = 'beds';
          else if (activeModule === 'emergency-trauma') activeId = 'emergency';
          else if (activeModule === 'clinical-consultation') activeId = 'consult';
          else activeId = 'more';
        } else if (role.includes('RECEPTIONIST') || role.includes('FRONT')) {
          destinations = [
            {
              id: 'opd',
              label: 'Tokens / Desk',
              icon: <span>📱</span>,
              onClick: () => setActiveModule('patient-registration')
            },
            {
              id: 'queue',
              label: 'Live Queue',
              icon: <span>⏱️</span>,
              onClick: () => setActiveModule('encounters-visits')
            },
            {
              id: 'doctors',
              label: 'Doctors',
              icon: <span>👨‍⚕️</span>,
              onClick: () => setActiveModule('doctor-management')
            },
            {
              id: 'billing',
              label: 'Billing',
              icon: <span>💳</span>,
              onClick: () => setActiveModule('billing-revenue-cycle')
            },
            {
              id: 'more',
              label: 'Modules',
              icon: <span>☰</span>,
              onClick: () => setIsCommandPaletteOpen(true)
            }
          ];
          if (activeModule === 'patient-registration') activeId = 'opd';
          else if (activeModule === 'encounters-visits') activeId = 'queue';
          else if (activeModule === 'doctor-management') activeId = 'doctors';
          else if (activeModule === 'billing-revenue-cycle') activeId = 'billing';
          else activeId = 'more';
        } else {
          destinations = [
            {
              id: 'opd',
              label: 'OPD / Reg',
              icon: <span>🏥</span>,
              onClick: () => setActiveModule('patient-registration')
            },
            {
              id: 'clinical',
              label: 'Consult',
              icon: <span>🩺</span>,
              onClick: () => setActiveModule('clinical-consultation')
            },
            {
              id: 'pharmacy',
              label: 'Pharmacy',
              icon: <span>💊</span>,
              onClick: () => setActiveModule('pharmacy-medication')
            },
            {
              id: 'billing',
              label: 'Billing',
              icon: <span>💳</span>,
              onClick: () => setActiveModule('billing-revenue-cycle')
            },
            {
              id: 'more',
              label: 'Modules',
              icon: <span>☰</span>,
              onClick: () => setIsCommandPaletteOpen(true)
            }
          ];
          if (['patient-registration', 'encounters-visits'].includes(activeModule)) activeId = 'opd';
          else if (['clinical-consultation', 'inpatient-management'].includes(activeModule)) activeId = 'clinical';
          else if (activeModule === 'pharmacy-medication') activeId = 'pharmacy';
          else if (activeModule === 'billing-revenue-cycle') activeId = 'billing';
          else activeId = 'more';
        }

        return (
          <AdaptiveBottomNav
            className="ds-show-on-mobile"
            activeId={activeId}
            destinations={destinations}
          />
        );
      })()}


      {/* UNIVERSAL MASTER BRAIN & AI SYSTEM TRAINER — EWAN */}
      <EwanSystemTrainer
        currentPlatform="PARTNER_PLATFORM"
        activeModule={activeModule}
        currentUser={currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          roleTitle: currentUser.roleTitle,
          department: currentUser.department,
          tenantName: currentUser.tenantName,
          tenantId: currentUser.tenantId,
          organizationType: currentUser.organizationType,
          accessibleFeatures: currentUser.accessibleFeatures,
          restrictedFeatures: currentUser.restrictedFeatures,
          permissions: currentUser.permissions as any
        } : undefined}
        onNavigate={(dest) => setActiveModule(dest as any)}
        onOpenQuickRegister={() => setIsFastOpdDrawerOpen(true)}
      />

      {/* PWA Floating Installation Banner */}
      <PwaInstallBanner />

    </AppShell>
    </AdaptiveProvider>
  );
};
