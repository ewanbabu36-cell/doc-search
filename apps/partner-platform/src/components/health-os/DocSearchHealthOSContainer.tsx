import React, { useState, useCallback, useEffect } from 'react';
import { type HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import {
  type HealthOSAppItem,
  type HealthOSModuleKey,
  type HealthOSRecentTask,
  type ActivePatientTab,
  type SlideOverTrayType,
} from './health-os-types.js';
import { HEALTH_OS_APPS } from './health-os-registry.js';
import { HealthOSTopSystemChrome } from './HealthOSTopSystemChrome.js';
import { HealthOSHomescreen } from './HealthOSHomescreen.js';
import { HealthOSAppDrawer } from './HealthOSAppDrawer.js';
import { HealthOSAppWindow } from './HealthOSAppWindow.js';
import { HealthOSRecentsDeck } from './HealthOSRecentsDeck.js';
import { HealthOSNavigationBar } from './HealthOSNavigationBar.js';
import { PersistentPatientStoryboard } from './PersistentPatientStoryboard.js';
import { HealthOSCommandPalette } from './HealthOSCommandPalette.js';
import { SlideOverActionTray } from './SlideOverActionTray.js';
import { DocSearch3DLogoLoader } from '@docsearch/ui-kit';
import { DomainErrorBoundary } from '../common/DomainErrorBoundary.js';
import './health-os.css';

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
const Aarogya360PatientPortalView = React.lazy(() => import('../views/Aarogya360PatientPortalView.js').then((m) => ({ default: m.Aarogya360PatientPortalView })));
const PartnerOffersRewardsHub = React.lazy(() => import('../offers/PartnerOffersRewardsHub.js').then((m) => ({ default: m.PartnerOffersRewardsHub })));

export interface DocSearchHealthOSContainerProps {
  currentUser: HospitalStaffUser;
  onLogout: () => void;
}

export const DocSearchHealthOSContainer: React.FC<DocSearchHealthOSContainerProps> = ({
  currentUser,
  onLogout,
}) => {
  // Resolve Role-Based Default Primary App
  const resolveRoleDefaultApp = useCallback((): HealthOSAppItem => {
    const roleUpper = (currentUser.role || '').toUpperCase();
    const deptUpper = (currentUser.department || '').toUpperCase();
    const orgType = currentUser.organizationType || 'HOSPITAL';

    if (roleUpper.includes('PATIENT')) {
      return HEALTH_OS_APPS.find((a) => a.id === 'patient-portal') || HEALTH_OS_APPS[0]!;
    }
    if (roleUpper.includes('RADIO') || deptUpper.includes('RADIO') || deptUpper.includes('IMAGING')) {
      return HEALTH_OS_APPS.find((a) => a.id === 'radiology-pacs') || HEALTH_OS_APPS[0]!;
    }
    if (roleUpper.includes('RECEPT') || roleUpper.includes('FRONT_DESK') || deptUpper.includes('RECEPTION') || deptUpper.includes('REGISTRATION')) {
      return HEALTH_OS_APPS.find((a) => a.id === 'patient-registration') || HEALTH_OS_APPS[0]!;
    }
    if (orgType === 'PHARMACY' || roleUpper.includes('PHARMAC') || deptUpper.includes('PHARMACY')) {
      return HEALTH_OS_APPS.find((a) => a.id === 'pharmacy-medication') || HEALTH_OS_APPS[0]!;
    }
    if (orgType === 'PATHOLOGY' || roleUpper.includes('LAB') || roleUpper.includes('PATHOLOG') || deptUpper.includes('PATHOLOGY')) {
      return HEALTH_OS_APPS.find((a) => a.id === 'clinical-investigation') || HEALTH_OS_APPS[0]!;
    }
    if (orgType === 'CLINIC') {
      return HEALTH_OS_APPS.find((a) => a.id === 'clinical-consultation') || HEALTH_OS_APPS[0]!;
    }
    if (roleUpper.includes('NURSE') || deptUpper.includes('INPATIENT') || deptUpper.includes('WARD')) {
      return HEALTH_OS_APPS.find((a) => a.id === 'inpatient-management') || HEALTH_OS_APPS[0]!;
    }
    if (roleUpper.includes('CASHIER') || deptUpper.includes('BILLING') || deptUpper.includes('ACCOUNTS') || deptUpper.includes('FINANCE')) {
      return HEALTH_OS_APPS.find((a) => a.id === 'billing-revenue-cycle') || HEALTH_OS_APPS[0]!;
    }
    if (roleUpper.includes('ADMIN') || roleUpper.includes('EXECUTIVE') || roleUpper.includes('DIRECTOR')) {
      return HEALTH_OS_APPS.find((a) => a.id === 'executive-command-center') || HEALTH_OS_APPS[0]!;
    }
    // Default Clinician Doctor Desk
    return HEALTH_OS_APPS.find((a) => a.id === 'clinical-consultation') || HEALTH_OS_APPS[0]!;
  }, [currentUser]);

  // Pre-seed default warm tasks
  const [recentTasks, setRecentTasks] = useState<HealthOSRecentTask[]>(() => {
    const initialApp = resolveRoleDefaultApp();
    const billingApp = HEALTH_OS_APPS.find((a) => a.id === 'billing-revenue-cycle') || HEALTH_OS_APPS[1]!;
    return [
      {
        id: initialApp.id,
        app: initialApp,
        lastActiveTime: 'Active now',
        timestamp: Date.now(),
      },
      {
        id: billingApp.id,
        app: billingApp,
        lastActiveTime: '10m ago',
        timestamp: Date.now() - 1000 * 60 * 10,
      },
    ];
  });

  // Start with Role-Based Active Workspace or Homescreen
  const [activeApp, setActiveApp] = useState<HealthOSAppItem | null>(() => {
    // Check if user came via a specific deep link route
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/billing')) return HEALTH_OS_APPS.find((a) => a.id === 'billing-revenue-cycle') || null;
      if (path.includes('/pharmacy')) return HEALTH_OS_APPS.find((a) => a.id === 'pharmacy-medication') || null;
      if (path.includes('/lab')) return HEALTH_OS_APPS.find((a) => a.id === 'clinical-investigation') || null;
      if (path.includes('/inpatient')) return HEALTH_OS_APPS.find((a) => a.id === 'inpatient-management') || null;
      if (path.includes('/consultations')) return HEALTH_OS_APPS.find((a) => a.id === 'clinical-consultation') || null;
      if (path.includes('/patient-portal')) return HEALTH_OS_APPS.find((a) => a.id === 'patient-portal') || null;
      if (path.includes('/encounters')) return HEALTH_OS_APPS.find((a) => a.id === 'encounters-visits') || null;
    }
    // Launch their role-tailored primary app
    return resolveRoleDefaultApp();
  });

  const [visitedModules, setVisitedModules] = useState<Set<HealthOSModuleKey>>(() => {
    const initial = new Set<HealthOSModuleKey>();
    const defApp = resolveRoleDefaultApp();
    initial.add(defApp.id);
    return initial;
  });

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

  // --- MULTI-PATIENT SESSION MEMORY & TABSTRIP STATE ---
  const [patientTabs, setPatientTabs] = useState<ActivePatientTab[]>([
    {
      encounterId: 'enc-2026-0001',
      patientId: 'pat-2026-0001',
      patientName: 'Aarav Sharma',
      mrn: 'MRN-2026-0001',
      acuity: 'ROUTINE',
      ageGender: '34y / Male',
      gender: 'MALE',
      age: 34,
      abhaId: '91-8842-1094-3321',
      bedNumber: 'OPD Token Q-001',
      allergies: ['Penicillin (Severe)', 'Amoxicillin'],
      chronicConditions: ['Type 2 Diabetes (E11.9)', 'Essential Hypertension (I10)'],
      department: 'General Medicine',
      attendingDoctor: 'Dr. Rajesh Sharma, MD',
      chiefComplaint: 'Severe headache, dizziness, BP 160/100 mmHg',
      vitals: {
        bp: '160/100',
        pulse: 88,
        spo2: 98,
        temp: 98.6,
        news2: 2,
      },
      activeSubModule: 'clinical-consultation',
    },
    {
      encounterId: 'enc-2026-0002',
      patientId: 'pat-2026-0002',
      patientName: 'Priya Patel',
      mrn: 'MRN-2026-0002',
      acuity: 'EMERGENCY',
      ageGender: '28y / Female',
      gender: 'FEMALE',
      age: 28,
      abhaId: '91-4412-9981-1122',
      bedNumber: 'ICU Bed 01',
      allergies: ['Sulfa Antibiotics', 'Aspirin'],
      chronicConditions: ['Acute Severe Sepsis', 'Severe Hyperkalemia (K+ 6.8 mEq/L)'],
      department: 'Critical Care / ICU',
      attendingDoctor: 'Dr. Alok Verma, MD (Crit Care)',
      chiefComplaint: 'Septic shock, high fever 102.8°F, dyspnea, oliguria',
      vitals: {
        bp: '85/55',
        pulse: 128,
        spo2: 91,
        temp: 102.8,
        news2: 9,
      },
      activeSubModule: 'inpatient-management',
    },
  ]);

  const [activePatientTabId, setActivePatientTabId] = useState<string | null>('enc-2026-0001');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [activeTrayType, setActiveTrayType] = useState<SlideOverTrayType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active patient object derived from active tab ID
  const activePatient = patientTabs.find((p) => p.encounterId === activePatientTabId) || patientTabs[0] || null;

  // Show auto-dismissing toast notification
  const handleShowToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Select patient tab
  const handleSelectPatientTab = useCallback((tabId: string) => {
    setActivePatientTabId(tabId);
    const target = patientTabs.find((p) => p.encounterId === tabId);
    if (target?.activeSubModule) {
      const matchingApp = HEALTH_OS_APPS.find((a) => a.id === target.activeSubModule);
      if (matchingApp) {
        handleLaunchApp(matchingApp);
      }
    }
  }, [patientTabs, handleLaunchApp]);

  // Close patient tab
  const handleClosePatientTab = useCallback((tabId: string) => {
    setPatientTabs((prev) => {
      const filtered = prev.filter((p) => p.encounterId !== tabId);
      if (activePatientTabId === tabId) {
        const nextActive = filtered[filtered.length - 1]?.encounterId || null;
        setActivePatientTabId(nextActive);
      }
      return filtered;
    });
  }, [activePatientTabId]);

  // Add or switch to patient from search/palette
  const handleAddOrSelectPatient = useCallback((patient: ActivePatientTab) => {
    setPatientTabs((prev) => {
      const exists = prev.find((p) => p.encounterId === patient.encounterId);
      if (exists) return prev;
      return [...prev, patient];
    });
    setActivePatientTabId(patient.encounterId);
    if (patient.activeSubModule) {
      const matchingApp = HEALTH_OS_APPS.find((a) => a.id === patient.activeSubModule);
      if (matchingApp) {
        handleLaunchApp(matchingApp);
      }
    }
  }, [handleLaunchApp]);

  // New patient tab triggered from '+' button in top chrome
  const handleNewPatientTab = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  // Ergonomic keyboard navigation: Ctrl+Tab (Cycle Patients), Alt+W/Ctrl+W (Close Tab), Ctrl+K (Command Palette)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Ctrl+Tab / Ctrl+Shift+Tab: Cycle Patients
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        if (patientTabs.length <= 1) return;
        const currentIndex = patientTabs.findIndex((p) => p.encounterId === activePatientTabId);
        if (e.shiftKey) {
          const prevIndex = (currentIndex - 1 + patientTabs.length) % patientTabs.length;
          handleSelectPatientTab(patientTabs[prevIndex]!.encounterId);
        } else {
          const nextIndex = (currentIndex + 1) % patientTabs.length;
          handleSelectPatientTab(patientTabs[nextIndex]!.encounterId);
        }
        return;
      }

      // Alt+W or Ctrl+W: Close Patient Chart
      if ((e.altKey && e.key.toLowerCase() === 'w') || (e.ctrlKey && e.key.toLowerCase() === 'w')) {
        if (activePatientTabId) {
          e.preventDefault();
          handleClosePatientTab(activePatientTabId);
          handleShowToast('Closed patient chart tab.');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [patientTabs, activePatientTabId, handleSelectPatientTab, handleClosePatientTab, handleShowToast]);

  // Listen to custom event dispatched by components: 'docsearch:open-command-palette'
  useEffect(() => {
    const handleCustomPaletteOpen = () => {
      setIsCommandPaletteOpen(true);
    };
    window.addEventListener('docsearch:open-command-palette', handleCustomPaletteOpen);
    return () => window.removeEventListener('docsearch:open-command-palette', handleCustomPaletteOpen);
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
    <div className="hos-master-container">
      {/* 1. Android Top System Chrome */}
      <HealthOSTopSystemChrome
        hospitalName={facilityBrand}
        currentUser={currentUser}
        onLogout={onLogout}
        activeModuleName={activeApp?.label}
        patientTabs={patientTabs}
        activePatientTabId={activePatientTabId}
        onSelectPatientTab={handleSelectPatientTab}
        onClosePatientTab={handleClosePatientTab}
        onNewPatientTab={handleNewPatientTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* 2. Main Content Canvas */}
      <main className="hos-main-canvas">
        {/* Android Hospital Homescreen (Visible when no app window is open and not in recents) */}
        {!activeApp && !isRecentsOpen && (
          <HealthOSHomescreen
            onLaunchApp={handleLaunchApp}
            onOpenAppDrawer={() => setIsAppDrawerOpen(true)}
            hospitalName={facilityBrand}
            profile={currentUser.organizationType || 'HOSPITAL'}
            currentUser={currentUser}
          />
        )}

        {/* Active Fullscreen Hospital Module Window Runner */}
        {activeApp && !isRecentsOpen && (
          <div className="hos-split-workspace">
            {/* STEP 2: Persistent Patient Storyboard (Left Telemetry Rail) */}
            <PersistentPatientStoryboard
              patient={activePatient}
              onOpenTray={(tray) => setActiveTrayType(tray)}
            />

            <div className="hos-workspace-main-panel">
              <HealthOSAppWindow
                app={activeApp}
                onClose={() => setActiveApp(null)}
                onMinimize={() => setActiveApp(null)}
              >
            <React.Suspense
              fallback={
                <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '1rem' }}>
                  <DocSearch3DLogoLoader mode="download" size="lg" />
                  <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#94a3b8' }}>
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
                    <EncounterDomainManager currentUserRole={currentUser.role} />
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

              {visitedModules.has('patient-portal') && (
                <div style={{ display: activeApp.id === 'patient-portal' ? 'block' : 'none', padding: '16px' }}>
                  <DomainErrorBoundary domainName="Patient Health 360 & ABHA Locker">
                    <Aarogya360PatientPortalView
                      profile={{
                        id: 'a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d',
                        patientMrn: 'MRN-2026-9021',
                        abhaNumber: '91-8842-1094-3321',
                        abhaAddress: `${(currentUser.name || 'patient').toLowerCase().replace(/[^a-z0-9]/g, '.')}@abdm`,
                        fullName: currentUser.name || 'Priya Sharma',
                        mobileNumber: '+91 98765 43210',
                        dateOfBirth: '1998-05-14',
                        gender: 'Female',
                        bloodGroup: 'B+',
                        activePrescriptionsCount: 3,
                        upcomingAppointmentsCount: 1,
                        totalHealthRecordsCount: 12,
                        portalRole: 'PATIENT_PRIMARY' as const
                      }}
                    />
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
            </div>
          </div>
        )}
      </main>

      {/* 3. Master App Drawer [ ::: ] */}
      <HealthOSAppDrawer
        isOpen={isAppDrawerOpen}
        onSelectApp={handleLaunchApp}
        onClose={() => setIsAppDrawerOpen(false)}
        profile={currentUser.organizationType || 'HOSPITAL'}
        currentUser={currentUser}
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

      {/* STEP 3: Global Omnipresent Command Palette (Ctrl + K) */}
      <HealthOSCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectPatient={(p) => {
          handleAddOrSelectPatient(p);
          setIsCommandPaletteOpen(false);
          handleShowToast(`Switched chart to ${p.patientName} (${p.mrn})`);
        }}
        onSelectApp={(appId) => {
          const target = HEALTH_OS_APPS.find((a) => a.id === appId);
          if (target) handleLaunchApp(target);
          setIsCommandPaletteOpen(false);
        }}
        onOpenTray={(tray) => {
          setActiveTrayType(tray);
          setIsCommandPaletteOpen(false);
        }}
      />

      {/* STEP 4: Slide-Over Quick Action Trays (Zero-Route Transitions) */}
      {activeTrayType && (
        <SlideOverActionTray
          trayType={activeTrayType}
          patient={activePatient}
          onClose={() => setActiveTrayType(null)}
          onSuccessAction={(msg) => handleShowToast(msg)}
        />
      )}

      {/* Universal Feedback Toast */}
      {toastMessage && (
        <div className="hos-global-toast" role="status" aria-live="polite">
          <span className="hos-toast-icon">✨</span>
          <span className="hos-toast-text">{toastMessage}</span>
          <button
            type="button"
            className="hos-toast-close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
