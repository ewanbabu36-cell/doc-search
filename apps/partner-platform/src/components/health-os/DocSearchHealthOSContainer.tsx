import React, { useState, useCallback, useEffect } from 'react';
import { type HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import { type HealthOSAppItem, type HealthOSModuleKey, type HealthOSRecentTask } from './health-os-types.js';
import { HEALTH_OS_APPS } from './health-os-registry.js';
import { HealthOSTopSystemChrome } from './HealthOSTopSystemChrome.js';
import { HealthOSHomescreen } from './HealthOSHomescreen.js';
import { HealthOSAppDrawer } from './HealthOSAppDrawer.js';
import { HealthOSAppWindow } from './HealthOSAppWindow.js';
import { HealthOSRecentsDeck } from './HealthOSRecentsDeck.js';
import { HealthOSNavigationBar } from './HealthOSNavigationBar.js';
import { DocSearch3DLogoLoader } from '@docsearch/ui-kit';
import { DomainErrorBoundary } from '../common/DomainErrorBoundary.js';

// Lazy-loaded Enterprise Hospital Domain Managers
const BillingDomainManager = React.lazy(() => import('../BillingDomainManager.js').then((m) => ({ default: m.BillingDomainManager })));
const ClinicalConsultationDomainManager = React.lazy(() => import('../ClinicalConsultationDomainManager.js').then((m) => ({ default: m.ClinicalConsultationDomainManager })));
const EncounterDomainManager = React.lazy(() => import('../EncounterDomainManager.js').then((m) => ({ default: m.EncounterDomainManager })));
const PharmacyDomainManager = React.lazy(() => import('../PharmacyDomainManager.js').then((m) => ({ default: m.PharmacyDomainManager })));
const ClinicalInvestigationDomainManager = React.lazy(() => import('../ClinicalInvestigationDomainManager.js').then((m) => ({ default: m.ClinicalInvestigationDomainManager })));
const InpatientDomainManager = React.lazy(() => import('../InpatientDomainManager.js').then((m) => ({ default: m.InpatientDomainManager })));
const StaffAdministrationDomainManager = React.lazy(() => import('../StaffAdministrationDomainManager.js').then((m) => ({ default: m.StaffAdministrationDomainManager })));
const EmergencyDomainManager = React.lazy(() => import('../EmergencyDomainManager.js').then((m) => ({ default: m.EmergencyDomainManager })));
const OTDomainManager = React.lazy(() => import('../OTDomainManager.js').then((m) => ({ default: m.OTDomainManager })));
const RadiologyDomainManager = React.lazy(() => import('../RadiologyDomainManager.js').then((m) => ({ default: m.RadiologyDomainManager })));
const BloodBankDomainManager = React.lazy(() => import('../BloodBankDomainManager.js').then((m) => ({ default: m.BloodBankDomainManager })));
const TelemedicineRpmDomainManager = React.lazy(() => import('../TelemedicineRpmDomainManager.js').then((m) => ({ default: m.TelemedicineRpmDomainManager })));
const WhatsAppPortalDomainManager = React.lazy(() => import('../WhatsAppPortalDomainManager.js').then((m) => ({ default: m.WhatsAppPortalDomainManager })));
const AbdmFhirDomainManager = React.lazy(() => import('../AbdmFhirDomainManager.js').then((m) => ({ default: m.AbdmFhirDomainManager })));
const AiCdssDomainManager = React.lazy(() => import('../AiCdssDomainManager.js').then((m) => ({ default: m.AiCdssDomainManager })));
const ExecutiveCommandDomainManager = React.lazy(() => import('../ExecutiveCommandDomainManager.js').then((m) => ({ default: m.ExecutiveCommandDomainManager })));
const PatientRegistrationDomainManager = React.lazy(() => import('../PatientRegistrationDomainManager.js').then((m) => ({ default: m.PatientRegistrationDomainManager })));
const PartnerOffersRewardsHub = React.lazy(() => import('../offers/PartnerOffersRewardsHub.js').then((m) => ({ default: m.PartnerOffersRewardsHub })));

export interface DocSearchHealthOSContainerProps {
  currentUser: HospitalStaffUser;
  onLogout: () => void;
}

export const DocSearchHealthOSContainer: React.FC<DocSearchHealthOSContainerProps> = ({
  currentUser,
  onLogout,
}) => {
  // Pre-seed default warm tasks based on user role
  const [recentTasks, setRecentTasks] = useState<HealthOSRecentTask[]>(() => {
    const defaultApp = HEALTH_OS_APPS.find((a) => a.id === 'clinical-consultation') || HEALTH_OS_APPS[0]!;
    const billingApp = HEALTH_OS_APPS.find((a) => a.id === 'billing-revenue-cycle') || HEALTH_OS_APPS[1]!;
    return [
      {
        id: defaultApp.id,
        app: defaultApp,
        lastActiveTime: '2m ago',
        timestamp: Date.now() - 1000 * 60 * 2,
      },
      {
        id: billingApp.id,
        app: billingApp,
        lastActiveTime: '10m ago',
        timestamp: Date.now() - 1000 * 60 * 10,
      },
    ];
  });

  const [activeApp, setActiveApp] = useState<HealthOSAppItem | null>(null);
  const [visitedModules, setVisitedModules] = useState<Set<HealthOSModuleKey>>(new Set());
  const [isRecentsOpen, setIsRecentsOpen] = useState<boolean>(false);
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState<boolean>(false);

  const resolvedTenantId = currentUser.tenantId || '11111111-1111-4111-8111-111111111111';
  const facilityBrand = currentUser.tenantName || 'DocSearch Apollo Multispecialty Hospital';

  // 1. Launch / Foreground App
  const handleLaunchApp = useCallback((app: HealthOSAppItem) => {
    setIsRecentsOpen(false);
    setIsAppDrawerOpen(false);
    setActiveApp(app);
    setVisitedModules((prev) => new Set(prev).add(app.id));

    setRecentTasks((prev) => {
      const filtered = prev.filter((t) => t.id !== app.id);
      const newTask: HealthOSRecentTask = {
        id: app.id,
        app,
        lastActiveTime: 'Active now',
        timestamp: Date.now(),
      };
      return [newTask, ...filtered];
    });

    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ path: app.route }, '', app.route);
      } catch {}
    }
  }, []);

  // 2. Navigation Bar: [ ||| ] Left Recents Switcher
  const handlePressRecent = useCallback(() => {
    setIsAppDrawerOpen(false);
    setIsRecentsOpen((prev) => !prev);
  }, []);

  // 3. Navigation Bar: [ ○ ] Center Home / Apps Menu
  const handlePressHome = useCallback(() => {
    setIsRecentsOpen(false);
    if (activeApp) {
      // Minimize current app to Homescreen
      setActiveApp(null);
      if (typeof window !== 'undefined') {
        try {
          window.history.pushState({}, '', '/');
        } catch {}
      }
    } else {
      // Already on homescreen: toggle Master App Drawer
      setIsAppDrawerOpen((prev) => !prev);
    }
  }, [activeApp]);

  // 4. Navigation Bar: [ ◂ ] Right Universal Back Key
  const handlePressBack = useCallback(() => {
    if (isAppDrawerOpen) {
      setIsAppDrawerOpen(false);
      return;
    }
    if (isRecentsOpen) {
      setIsRecentsOpen(false);
      return;
    }
    if (activeApp) {
      setActiveApp(null);
      if (typeof window !== 'undefined') {
        try {
          window.history.pushState({}, '', '/');
        } catch {}
      }
      return;
    }
  }, [isAppDrawerOpen, isRecentsOpen, activeApp]);

  // Close / Terminate Task from Recents
  const handleCloseTask = useCallback((taskId: string) => {
    setRecentTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeApp?.id === taskId) {
      setActiveApp(null);
    }
  }, [activeApp]);

  // Clear all background tasks
  const handleClearAllTasks = useCallback(() => {
    setRecentTasks([]);
    setActiveApp(null);
    setIsRecentsOpen(false);
  }, []);

  // Hardware keyboard back handling (Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handlePressBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePressBack]);

  return (
    <div className="relative min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1. Android Top System Chrome */}
      <HealthOSTopSystemChrome
        hospitalName={facilityBrand}
        currentUser={currentUser}
        onLogout={onLogout}
        activeModuleName={activeApp?.label}
      />

      {/* 2. Main Content Canvas */}
      <main className="relative z-10 flex-1 flex flex-col pt-13 pb-13">
        {/* Android Hospital Homescreen (Visible when no app window is open and not in recents) */}
        {!activeApp && !isRecentsOpen && (
          <HealthOSHomescreen
            onLaunchApp={handleLaunchApp}
            onOpenAppDrawer={() => setIsAppDrawerOpen(true)}
            hospitalName={facilityBrand}
          />
        )}

        {/* Active Fullscreen Hospital Module Window Runner */}
        {activeApp && !isRecentsOpen && (
          <HealthOSAppWindow
            app={activeApp}
            onClose={() => setActiveApp(null)}
            onMinimize={() => setActiveApp(null)}
          >
            <React.Suspense
              fallback={
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
                  <DocSearch3DLogoLoader mode="download" size="lg" />
                  <span className="text-xs font-mono text-slate-400 animate-pulse">
                    Loading {activeApp.label}...
                  </span>
                </div>
              }
            >
              {/* State-Preserved Domain Manager Mounting */}
              {visitedModules.has('billing-revenue-cycle') && (
                <div style={{ display: activeApp.id === 'billing-revenue-cycle' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Billing & Revenue Cycle">
                    <BillingDomainManager
                      tenantId={resolvedTenantId}
                      currentUserRole={currentUser.role}
                    />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('clinical-consultation') && (
                <div style={{ display: activeApp.id === 'clinical-consultation' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Clinical Consultation & Smart Rx">
                    <ClinicalConsultationDomainManager
                      currentUser={currentUser}
                      tenantId={resolvedTenantId}
                      facilityName={facilityBrand}
                    />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('encounters-visits') && (
                <div style={{ display: activeApp.id === 'encounters-visits' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Appointments & OPD Token Queue">
                    <EncounterDomainManager />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('pharmacy-medication') && (
                <div style={{ display: activeApp.id === 'pharmacy-medication' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Pharmacy & Medicine Stock">
                    <PharmacyDomainManager currentUser={currentUser} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('clinical-investigation') && (
                <div style={{ display: activeApp.id === 'clinical-investigation' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Diagnostics Pathology & Lab">
                    <ClinicalInvestigationDomainManager currentUserRole={currentUser.role} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('inpatient-management') && (
                <div style={{ display: activeApp.id === 'inpatient-management' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Inpatient Ward & Bed Census">
                    <InpatientDomainManager tenantId={resolvedTenantId} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('staff-administration') && (
                <div style={{ display: activeApp.id === 'staff-administration' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Hospital Settings & Staff Roster">
                    <StaffAdministrationDomainManager
                      tenantId={resolvedTenantId}
                      partnerType="HOSPITAL"
                    />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('patient-registration') && (
                <div style={{ display: activeApp.id === 'patient-registration' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Patient Registration & OPD Desk">
                    <PatientRegistrationDomainManager />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('emergency-trauma') && (
                <div style={{ display: activeApp.id === 'emergency-trauma' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Emergency & Manchester Triage">
                    <EmergencyDomainManager tenantId={resolvedTenantId} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('radiology-pacs') && (
                <div style={{ display: activeApp.id === 'radiology-pacs' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Radiology & DICOM PACS">
                    <RadiologyDomainManager tenantId={resolvedTenantId} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('ot-management') && (
                <div style={{ display: activeApp.id === 'ot-management' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Operation Theatre Suites">
                    <OTDomainManager tenantId={resolvedTenantId} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('blood-bank') && (
                <div style={{ display: activeApp.id === 'blood-bank' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Blood Bank & Transfusion">
                    <BloodBankDomainManager tenantId={resolvedTenantId} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('telemedicine-rpm') && (
                <div style={{ display: activeApp.id === 'telemedicine-rpm' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Telemedicine & Video Consult">
                    <TelemedicineRpmDomainManager tenantId={resolvedTenantId} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('abdm-fhir') && (
                <div style={{ display: activeApp.id === 'abdm-fhir' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="ABDM Ayushman Bharat & FHIR">
                    <AbdmFhirDomainManager tenantId={resolvedTenantId} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('ai-cdss') && (
                <div style={{ display: activeApp.id === 'ai-cdss' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="AI Clinical Decision Support">
                    <AiCdssDomainManager tenantId={resolvedTenantId} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('whatsapp-portal') && (
                <div style={{ display: activeApp.id === 'whatsapp-portal' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="WhatsApp Automated Dispatch">
                    <WhatsAppPortalDomainManager tenantId={resolvedTenantId} />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('executive-command-center') && (
                <div style={{ display: activeApp.id === 'executive-command-center' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Executive Command Center">
                    <ExecutiveCommandDomainManager
                      tenantId={resolvedTenantId}
                      currentUserRole={currentUser.role}
                    />
                  </DomainErrorBoundary>
                </div>
              )}

              {visitedModules.has('offers-rewards-hub') && (
                <div style={{ display: activeApp.id === 'offers-rewards-hub' ? 'block' : 'none' }}>
                  <DomainErrorBoundary domainName="Partner Rewards & Tier Benefits">
                    <PartnerOffersRewardsHub currentUser={currentUser} />
                  </DomainErrorBoundary>
                </div>
              )}
            </React.Suspense>
          </HealthOSAppWindow>
        )}
      </main>

      {/* 3. Master App Drawer [ ::: ] */}
      <HealthOSAppDrawer
        isOpen={isAppDrawerOpen}
        onSelectApp={handleLaunchApp}
        onClose={() => setIsAppDrawerOpen(false)}
      />

      {/* 4. Multitasking Recent Apps Switcher [ ||| ] */}
      <HealthOSRecentsDeck
        isOpen={isRecentsOpen}
        tasks={recentTasks}
        activeTaskId={activeApp?.id}
        onSelectTask={handleLaunchApp}
        onCloseTask={handleCloseTask}
        onClearAll={handleClearAllTasks}
        onClose={() => setIsRecentsOpen(false)}
      />

      {/* 5. Android 3-Button Navigation Bar [ ||| ] [ ○ ] [ ◂ ] */}
      <HealthOSNavigationBar
        onPressRecent={handlePressRecent}
        onPressHome={handlePressHome}
        onPressBack={handlePressBack}
        isRecentsOpen={isRecentsOpen}
        hasActiveApp={Boolean(activeApp)}
      />
    </div>
  );
};
