import { GlobalCommandPalette } from './common/GlobalCommandPalette.js';
import React, { useState } from 'react';
import {
  AppShell,
  Header,
  Sidebar,
  ContentArea,
  Badge,
  Button,
  useTheme,
  themes
} from '@docsearch/ui-kit';
import { PartnerFoundationDomainManager } from './PartnerFoundationDomainManager.js';
import { StaffAdministrationDomainManager } from './StaffAdministrationDomainManager.js';
import { DoctorRosterDomainManager } from './DoctorRosterDomainManager.js';
import { PatientRegistrationDomainManager } from './PatientRegistrationDomainManager.js';
import { EncounterDomainManager } from './EncounterDomainManager.js';
import { ClinicalConsultationDomainManager } from './ClinicalConsultationDomainManager.js';
import { ClinicalInvestigationDomainManager } from './ClinicalInvestigationDomainManager.js';
import { PharmacyDomainManager } from './PharmacyDomainManager.js';
import { BillingDomainManager } from './BillingDomainManager.js';
import { InsuranceClaimsDomainManager } from './InsuranceClaimsDomainManager.js';
import { ProcurementDomainManager } from './ProcurementDomainManager.js';
import { InpatientDomainManager } from './InpatientDomainManager.js';
import { OTDomainManager } from './OTDomainManager.js';
import { EmergencyDomainManager } from './EmergencyDomainManager.js';
import { MRDDomainManager } from './MRDDomainManager.js';
import { BloodBankDomainManager } from './BloodBankDomainManager.js';
import { RadiologyDomainManager } from './RadiologyDomainManager.js';
import { DietaryDomainManager } from './DietaryDomainManager.js';
import { AssetBiomedicalDomainManager } from './AssetBiomedicalDomainManager.js';
import { QualityInfectionDomainManager } from './QualityInfectionDomainManager.js';
import { ExecutiveCommandDomainManager } from './ExecutiveCommandDomainManager.js';
import { AbdmFhirDomainManager } from './AbdmFhirDomainManager.js';
import { AiCdssDomainManager } from './AiCdssDomainManager.js';
import { TelemedicineRpmDomainManager } from './TelemedicineRpmDomainManager.js';
import { WhatsAppPortalDomainManager } from './WhatsAppPortalDomainManager.js';

export type OrganizationWorkspaceType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'PHARMACY'
  | 'PATHOLOGY'
  | 'DIAGNOSTIC_CENTRE'
  | 'ENTERPRISE_COMMAND';

export type PartnerModuleKey =
  | 'executive-command-center'
  | 'organization-foundation'
  | 'staff-administration'
  | 'doctor-management'
  | 'patient-registration'
  | 'encounters-visits'
  | 'clinical-consultation'
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
  | 'procurement-supply-chain';

import type { HospitalStaffUser } from './auth/HospitalStaffLogin.js';

export interface PartnerPlatformShellProps {
  currentUser?: HospitalStaffUser | undefined;
  onLogout?: (() => void) | undefined;
}

const getThemeLabel = (t: string) => {
  switch (t) {
    case themes.ADVANCE_PRO: return '✨ Advance Pro';
    case themes.NORDIC_PURE: return '🏥 Nordic Pure';
    case themes.OCEANIC_NAVY: return '🌊 Oceanic Navy';
    case themes.AYUR_WELLNESS: return '🌿 Ayur Wellness';
    case themes.CYBER_SURGEON: return '💜 Cyber Surgeon';
    case themes.ROSE_CARE: return '🌸 Rose Care';
    case themes.BLACK_WHITE: return '🏁 B&W';
    default: return '🎨 Switch Theme';
  }
};

export const PartnerPlatformShell: React.FC<PartnerPlatformShellProps> = ({ currentUser, onLogout }) => {
  const [workspace, setWorkspace] = useState<OrganizationWorkspaceType>(
    currentUser?.organizationType || 'ENTERPRISE_COMMAND'
  );
  const [activeModule, setActiveModule] = useState<PartnerModuleKey>(
    (currentUser?.defaultModule as PartnerModuleKey) || 'executive-command-center'
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const { theme, toggleTheme } = useTheme();

  // Dynamic Workspace definitions with specialized colors & tags
  const workspaceProfiles: Record<OrganizationWorkspaceType, { name: string; icon: string; badge: string; color: string; defaultModule: PartnerModuleKey }> = {
    ENTERPRISE_COMMAND: { name: 'ABC Healthcare Group (Enterprise Combined)', icon: '👑', badge: 'All-in-One Multi-Org Hub', color: '#8B5CF6', defaultModule: 'executive-command-center' },
    HOSPITAL: { name: 'Apex Metropolitan Hospital', icon: '🏥', badge: 'Inpatient & Tertiary Suite', color: '#3B82F6', defaultModule: 'inpatient-management' },
    CLINIC: { name: 'Apex Doctor Clinic & Polyclinic', icon: '🩺', badge: 'OPD & Scribe EMR', color: '#06B6D4', defaultModule: 'clinical-consultation' },
    PHARMACY: { name: 'MetroCare Chemist & Pharmacy POS', icon: '💊', badge: 'Retail POS & Inventory', color: '#10B981', defaultModule: 'pharmacy-medication' },
    PATHOLOGY: { name: 'BioCore Pathology & LIMS Lab', icon: '🧪', badge: 'Diagnostic LIS Hub', color: '#A855F7', defaultModule: 'clinical-investigation' },
    DIAGNOSTIC_CENTRE: { name: 'Apex Imaging & Radiology PACS', icon: '🔬', badge: 'DICOM & Modality Centre', color: '#F59E0B', defaultModule: 'radiology-imaging' }
  };

  const currentWsp = workspaceProfiles[workspace];

  const handleWorkspaceChange = (newWsp: OrganizationWorkspaceType) => {
    setWorkspace(newWsp);
    setActiveModule(workspaceProfiles[newWsp].defaultModule);
  };

  // Build dynamic navigation sections based on active workspace
  const getDynamicSections = () => {
    if (workspace === 'CLINIC') {
      return [
        {
          title: 'Doctor & Outpatient Care',
          items: [
            { id: 'clinical-consultation', label: 'Consultation & Specialty EMR', icon: <span>🩺</span>, isActive: activeModule === 'clinical-consultation', onClick: () => setActiveModule('clinical-consultation') },
            { id: 'patient-registration', label: 'Patient Registry & Tokens', icon: <span>📇</span>, isActive: activeModule === 'patient-registration', onClick: () => setActiveModule('patient-registration') },
            { id: 'encounters-visits', label: 'Queue & Waiting Room Triage', icon: <span>⏱️</span>, isActive: activeModule === 'encounters-visits', onClick: () => setActiveModule('encounters-visits') },
            { id: 'ai-clinical-cdss', label: 'AI Voice Scribe & CDSS', icon: <span>🎙️</span>, isActive: activeModule === 'ai-clinical-cdss', onClick: () => setActiveModule('ai-clinical-cdss') },
            { id: 'telemedicine-rpm', label: 'Telemedicine & Video OPD', icon: <span>📹</span>, isActive: activeModule === 'telemedicine-rpm', onClick: () => setActiveModule('telemedicine-rpm') }
          ]
        },
        {
          title: 'Billing & Digital Stack',
          items: [
            { id: 'billing-revenue-cycle', label: 'Clinic POS & Instant UPI Split', icon: <span>⚡</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') },
            { id: 'abdm-fhir-gateway', label: 'ABDM Scan & Share Kiosk', icon: <span>🇮🇳</span>, isActive: activeModule === 'abdm-fhir-gateway', onClick: () => setActiveModule('abdm-fhir-gateway') },
            { id: 'whatsapp-patient-portal', label: 'WhatsApp Digital Rx Dispatch', icon: <span>📲</span>, isActive: activeModule === 'whatsapp-patient-portal', onClick: () => setActiveModule('whatsapp-patient-portal') }
          ]
        }
      ];
    }

    if (workspace === 'PHARMACY') {
      return [
        {
          title: 'Pharmacy Operations & POS',
          items: [
            { id: 'pharmacy-medication', label: 'Pharmacy POS & Dispensing', icon: <span>💊</span>, isActive: activeModule === 'pharmacy-medication', onClick: () => setActiveModule('pharmacy-medication') },
            { id: 'procurement-supply-chain', label: 'Inventory, Batch & Expiry', icon: <span>📦</span>, isActive: activeModule === 'procurement-supply-chain', onClick: () => setActiveModule('procurement-supply-chain') },
            { id: 'billing-revenue-cycle', label: 'GST Tax Invoicing & Cashier', icon: <span>🧾</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') },
            { id: 'whatsapp-patient-portal', label: 'WhatsApp Digital Bill Pass', icon: <span>📲</span>, isActive: activeModule === 'whatsapp-patient-portal', onClick: () => setActiveModule('whatsapp-patient-portal') }
          ]
        }
      ];
    }

    if (workspace === 'PATHOLOGY') {
      return [
        {
          title: 'Laboratory Information System (LIS)',
          items: [
            { id: 'clinical-investigation', label: 'Pathology LIMS Workbench', icon: <span>🧪</span>, isActive: activeModule === 'clinical-investigation', onClick: () => setActiveModule('clinical-investigation') },
            { id: 'patient-registration', label: 'Phlebotomy Sample Barcodes', icon: <span>🏷️</span>, isActive: activeModule === 'patient-registration', onClick: () => setActiveModule('patient-registration') },
            { id: 'billing-revenue-cycle', label: 'Lab Cashier & B2B Referrals', icon: <span>💳</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') },
            { id: 'whatsapp-patient-portal', label: 'WhatsApp NABL Report Dispatch', icon: <span>📲</span>, isActive: activeModule === 'whatsapp-patient-portal', onClick: () => setActiveModule('whatsapp-patient-portal') }
          ]
        }
      ];
    }

    if (workspace === 'DIAGNOSTIC_CENTRE') {
      return [
        {
          title: 'Radiology & Imaging PACS',
          items: [
            { id: 'radiology-imaging', label: 'Web DICOM PACS & Modalities', icon: <span>🔬</span>, isActive: activeModule === 'radiology-imaging', onClick: () => setActiveModule('radiology-imaging') },
            { id: 'encounters-visits', label: 'Modality Scheduling (X-Ray/CT/MRI)', icon: <span>📅</span>, isActive: activeModule === 'encounters-visits', onClick: () => setActiveModule('encounters-visits') },
            { id: 'insurance-claims', label: 'Cashless TPA Pre-Auth', icon: <span>🩻</span>, isActive: activeModule === 'insurance-claims', onClick: () => setActiveModule('insurance-claims') },
            { id: 'billing-revenue-cycle', label: 'Diagnostic Billing & POS', icon: <span>🧾</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') }
          ]
        }
      ];
    }

    // Default / HOSPITAL / ENTERPRISE_COMMAND: Show comprehensive multi-specialty layout
    return [
      {
        title: 'Command & Intelligence',
        items: [
          { id: 'executive-command-center', label: 'Executive Command Center', icon: <span>📊</span>, isActive: activeModule === 'executive-command-center', onClick: () => setActiveModule('executive-command-center') }
        ]
      },
      {
        title: 'Clinical & Inpatient Hub',
        items: [
          { id: 'clinical-consultation', label: 'OPD Doctor Desk & EMR', icon: <span>🩺</span>, isActive: activeModule === 'clinical-consultation', onClick: () => setActiveModule('clinical-consultation') },
          { id: 'inpatient-management', label: 'IPD ADT Bed Matrix & Wards', icon: <span>🛏️</span>, isActive: activeModule === 'inpatient-management', onClick: () => setActiveModule('inpatient-management') },
          { id: 'emergency-trauma', label: 'Emergency & Triage (ER)', icon: <span>🚨</span>, isActive: activeModule === 'emergency-trauma', onClick: () => setActiveModule('emergency-trauma') },
          { id: 'operation-theatre-management', label: 'Operation Theatres (OT)', icon: <span>🔪</span>, isActive: activeModule === 'operation-theatre-management', onClick: () => setActiveModule('operation-theatre-management') },
          { id: 'blood-bank-transfusion', label: 'Blood Bank & Cross-Match', icon: <span>🩸</span>, isActive: activeModule === 'blood-bank-transfusion', onClick: () => setActiveModule('blood-bank-transfusion') }
        ]
      },
      {
        title: 'Diagnostics & Pharmacy',
        items: [
          { id: 'pharmacy-medication', label: 'Pharmacy & Drug Safety', icon: <span>💊</span>, isActive: activeModule === 'pharmacy-medication', onClick: () => setActiveModule('pharmacy-medication') },
          { id: 'clinical-investigation', label: 'Pathology Laboratory LIMS', icon: <span>🧪</span>, isActive: activeModule === 'clinical-investigation', onClick: () => setActiveModule('clinical-investigation') },
          { id: 'radiology-imaging', label: 'Radiology & DICOM PACS', icon: <span>🔬</span>, isActive: activeModule === 'radiology-imaging', onClick: () => setActiveModule('radiology-imaging') }
        ]
      },
      {
        title: 'Revenue, TPA & ABDM Gateway',
        items: [
          { id: 'billing-revenue-cycle', label: 'Billing POS & Multi-Party UPI', icon: <span>⚡</span>, isActive: activeModule === 'billing-revenue-cycle', onClick: () => setActiveModule('billing-revenue-cycle') },
          { id: 'insurance-claims', label: 'TPA Cashless Claims & NHCX', icon: <span>🩻</span>, isActive: activeModule === 'insurance-claims', onClick: () => setActiveModule('insurance-claims') },
          { id: 'abdm-fhir-gateway', label: 'ABDM 2.0 National Gateway', icon: <span>🇮🇳</span>, isActive: activeModule === 'abdm-fhir-gateway', onClick: () => setActiveModule('abdm-fhir-gateway') },
          { id: 'whatsapp-patient-portal', label: 'WhatsApp Patient Portal', icon: <span>📲</span>, isActive: activeModule === 'whatsapp-patient-portal', onClick: () => setActiveModule('whatsapp-patient-portal') }
        ]
      },
      {
        title: 'Hospital Administration',
        items: [
          { id: 'organization-foundation', label: 'Organization & Branches', icon: <span>🏢</span>, isActive: activeModule === 'organization-foundation', onClick: () => setActiveModule('organization-foundation') },
          { id: 'staff-administration', label: 'Staff Directory & Roles', icon: <span>👥</span>, isActive: activeModule === 'staff-administration', onClick: () => setActiveModule('staff-administration') },
          { id: 'patient-registration', label: 'Patient Master Index (MPI)', icon: <span>📇</span>, isActive: activeModule === 'patient-registration', onClick: () => setActiveModule('patient-registration') },
          { id: 'procurement-supply-chain', label: 'Procurement & Supply Chain', icon: <span>🚚</span>, isActive: activeModule === 'procurement-supply-chain', onClick: () => setActiveModule('procurement-supply-chain') },
          { id: 'asset-biomedical-maintenance', label: 'Biomedical Assets Maintenance', icon: <span>🔧</span>, isActive: activeModule === 'asset-biomedical-maintenance', onClick: () => setActiveModule('asset-biomedical-maintenance') },
          { id: 'quality-incident-infection-control', label: 'Quality & Infection Control', icon: <span>🛡️</span>, isActive: activeModule === 'quality-incident-infection-control', onClick: () => setActiveModule('quality-incident-infection-control') },
          { id: 'dietary-kitchen-management', label: 'Dietary & Inpatient Kitchen', icon: <span>🥗</span>, isActive: activeModule === 'dietary-kitchen-management', onClick: () => setActiveModule('dietary-kitchen-management') },
          { id: 'medical-records', label: 'MRD & ICD-10 Archive', icon: <span>📁</span>, isActive: activeModule === 'medical-records', onClick: () => setActiveModule('medical-records') },
          { id: 'ai-clinical-cdss', label: 'Ambient AI Voice Scribe', icon: <span>🎙️</span>, isActive: activeModule === 'ai-clinical-cdss', onClick: () => setActiveModule('ai-clinical-cdss') },
          { id: 'telemedicine-rpm', label: 'Telemedicine & Remote RPM', icon: <span>📹</span>, isActive: activeModule === 'telemedicine-rpm', onClick: () => setActiveModule('telemedicine-rpm') }
        ]
      }
    ];
  };

  return (
    <AppShell
      sidebar={
        <Sidebar
          brand={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: currentWsp.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.875rem'
                }}
              >
                {currentWsp.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '800', fontSize: '0.875rem', lineHeight: '1.2' }}>
                  DOC SEARCH
                </span>
                <span style={{ fontSize: '0.6875rem', color: currentWsp.color, fontWeight: 700 }}>
                  {workspace.replace('_', ' ')}
                </span>
              </div>
            </div>
          }
          isCollapsed={isSidebarCollapsed}
          sections={getDynamicSections()}
        />
      }
      header={
        <Header
          onMenuToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#94A3B8',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <span>🔍 Quick Launcher</span>
                <kbd style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#38BDF8', padding: '1px 5px', borderRadius: '4px', fontSize: '0.625rem', fontFamily: 'monospace' }}>Ctrl+K</kbd>
              </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>{currentWsp.icon}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 800 }}>{currentWsp.name}</span>
              <Badge variant="primary" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>{currentWsp.badge}</Badge>
            </div>
            </div>
          }
          organizationSlot={
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '3px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {((currentUser?.allowedWorkspaces && currentUser.allowedWorkspaces.length > 0)
    ? currentUser.allowedWorkspaces
    : (['ENTERPRISE_COMMAND', 'HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE'] as OrganizationWorkspaceType[])
  ).map((wKey) => (
                <button
                  key={wKey}
                  type="button"
                  onClick={() => handleWorkspaceChange(wKey)}
                  style={{
                    backgroundColor: workspace === wKey ? workspaceProfiles[wKey].color : 'transparent',
                    color: workspace === wKey ? '#070C16' : '#94A3B8',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.6875rem',
                    fontWeight: workspace === wKey ? 800 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {workspaceProfiles[wKey].icon} {wKey === 'ENTERPRISE_COMMAND' ? 'Combined' : wKey.split('_')[0]}
                </button>
              ))}
            </div>
          }
          themeSlot={
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              style={{ fontSize: '0.75rem', padding: '4px 8px', fontWeight: 600 }}
            >
              {getThemeLabel(theme)}
            </Button>
          }
          userSlot={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="success" style={{ fontSize: '0.6875rem' }}>● ONLINE (ABDM 2.0)</Badge>
              {currentUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{currentUser.name}</div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--ds-color-text-muted)' }}>{currentUser.role}</div>
                  </div>
                  {onLogout && (
                    <Button variant="outline" size="sm" onClick={onLogout} style={{ fontSize: '0.75rem', padding: '3px 6px' }}>
                      Logout
                    </Button>
                  )}
                </div>
              )}
            </div>
          }
        />
      }
    >
      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderBottom: '1.5px solid rgba(6, 182, 212, 0.3)', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem' }}>🎭</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>ACTIVE ROLE TESTER:</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC' }}>{currentUser?.name || 'Dr. Rajesh Sharma'}</span>
          <Badge variant="primary" style={{ fontSize: '0.625rem' }}>{currentUser?.role || 'CLINIC_DOCTOR'}</Badge>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>({currentUser?.department || 'Outpatient Clinic'})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#A7F3D0', fontWeight: 700 }}>✓ Permissions & Sidebar Dynamically Scoped</span>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🔄 Switch to Another Role
            </button>
          )}
        </div>
      </div>
      <ContentArea>
        {activeModule === 'executive-command-center' && (
          <ExecutiveCommandDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
        {activeModule === 'organization-foundation' && (
          <PartnerFoundationDomainManager />
        )}
        {activeModule === 'staff-administration' && (
          <StaffAdministrationDomainManager />
        )}
        {activeModule === 'doctor-management' && (
          <DoctorRosterDomainManager />
        )}
        {activeModule === 'patient-registration' && (
          <PatientRegistrationDomainManager />
        )}
        {activeModule === 'encounters-visits' && (
          <EncounterDomainManager />
        )}
        {activeModule === 'clinical-consultation' && (
          <ClinicalConsultationDomainManager />
        )}
        {activeModule === 'clinical-investigation' && (
          <ClinicalInvestigationDomainManager />
        )}
        {activeModule === 'pharmacy-medication' && (
          <PharmacyDomainManager />
        )}
        {activeModule === 'billing-revenue-cycle' && (
          <BillingDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
        {activeModule === 'insurance-claims' && (
          <InsuranceClaimsDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
        {activeModule === 'procurement-supply-chain' && (
          <ProcurementDomainManager />
        )}
        {activeModule === 'inpatient-management' && (
          <InpatientDomainManager />
        )}
        {activeModule === 'operation-theatre-management' && (
          <OTDomainManager />
        )}
        {activeModule === 'emergency-trauma' && (
          <EmergencyDomainManager />
        )}
        {activeModule === 'medical-records' && (
          <MRDDomainManager />
        )}
        {activeModule === 'blood-bank-transfusion' && (
          <BloodBankDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
        {activeModule === 'radiology-imaging' && (
          <RadiologyDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
        {activeModule === 'dietary-kitchen-management' && (
          <DietaryDomainManager />
        )}
        {activeModule === 'asset-biomedical-maintenance' && (
          <AssetBiomedicalDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
        {activeModule === 'quality-incident-infection-control' && (
          <QualityInfectionDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
        {activeModule === 'abdm-fhir-gateway' && (
          <AbdmFhirDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
        {activeModule === 'ai-clinical-cdss' && (
          <AiCdssDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
        {activeModule === 'telemedicine-rpm' && (
          <TelemedicineRpmDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
        {activeModule === 'whatsapp-patient-portal' && (
          <WhatsAppPortalDomainManager tenantId="11111111-1111-4111-8111-111111111111" />
        )}
      </ContentArea>
      <GlobalCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateModule={(mod) => setActiveModule(mod)}
        onSwitchWorkspace={(wsp) => handleWorkspaceChange(wsp)}
        onToggleTheme={toggleTheme}
      />
    </AppShell>
  );
};
