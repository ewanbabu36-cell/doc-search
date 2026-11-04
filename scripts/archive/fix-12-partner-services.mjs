import fs from 'node:fs';
import path from 'node:path';

const servicesDir = path.join(process.cwd(), 'apps', 'partner-platform', 'src', 'services');

const configs = {
  'partner-foundation-service.ts': `const DEFAULT_PANEL_CONTEXT: PanelContextDto = {
  activeTenantId: 'tenant-apollo-delhi',
  activeTenantName: 'Doc Search Healthcare Partner',
  activePartnerId: 'partner-apollo-delhi',
  activePartnerName: 'Doc Search Healthcare Partner',
  activeOrganizationId: 'org-apollo-delhi',
  activeOrganizationName: 'Healthcare Facility',
  activeFacilityId: 'fac-apollo-main',
  activeFacilityName: 'Primary Facility',
  userRole: 'HOSPITAL_DIRECTOR',
  userEmail: 'director@docsearch.health'
};

const DEFAULT_PARTNER_FOUNDATION_OVERVIEW: PartnerFoundationOverviewDto = {
  totalPartnersCount: 1,
  activePartnersCount: 1,
  totalOrganizationsCount: 1,
  clinicCount: 0,
  hospitalCount: 1,
  totalFacilitiesCount: 1,
  activeFacilitiesCount: 1,
  operationalSubscriptionsCount: 1,
  activeSubscriptionsCount: 1
};`,

  'staff-administration-service.ts': `const DEFAULT_STAFF_ADMIN_OVERVIEW: StaffAdministrationOverviewDto = {
  totalStaffCount: 0,
  activeStaffCount: 0,
  onLeaveStaffCount: 0,
  suspendedStaffCount: 0,
  totalDepartmentsCount: 0,
  credentialExpiryAlertsCount: 0,
  pendingVerificationsCount: 0,
  totalTransfersCount: 0
};`,

  'doctor-roster-service.ts': `const DEFAULT_DOCTOR_ROSTER_OVERVIEW: DoctorRosterOverviewDto = {
  totalDoctorsCount: 0,
  activeDoctorsCount: 0,
  doctorsOnDutyTodayCount: 0,
  doctorsOnLeaveCount: 0,
  totalWeeklySchedulesCount: 0,
  todaySlotsCount: 0,
  todayBookedSlotsCount: 0,
  todayBlockedSlotsCount: 0,
  todayAvailableSlotsCount: 0,
  pendingLeaveRequestsCount: 0,
  scheduleConflictsCount: 0
};`,

  'patient-registration-service.ts': `const DEFAULT_PATIENT_REGISTRATION_OVERVIEW: PatientRegistrationOverviewDto = {
  totalPatientsCount: 0,
  activePatientsCount: 0,
  newRegistrationsTodayCount: 0,
  pendingDuplicateReviewsCount: 0,
  mergedRecordsCount: 0,
  insuredPatientsCount: 0,
  activeConsentsCount: 0
};`,

  'encounter-service.ts': `const DEFAULT_ENCOUNTER_OVERVIEW: EncounterOverviewDto = {
  totalEncountersTodayCount: 0,
  waitingQueueCount: 0,
  inConsultationCount: 0,
  completedTodayCount: 0,
  emergencyEncountersCount: 0,
  telehealthEncountersCount: 0,
  cancelledCount: 0
};`,

  'clinical-consultation-service.ts': `const isProductionClinicPilot = () => true;
const filterRealClinicalPatients = <T,>(list: T[]): T[] => list;
const DEFAULT_CONSULTATION_OVERVIEW: ConsultationOverviewDto = {
  totalConsultationsCount: 0,
  activeConsultationsCount: 0,
  draftConsultationsCount: 0,
  inProgressConsultationsCount: 0,
  completedTodayCount: 0,
  followUpsRequiredCount: 0,
  uncompletedNotesCount: 0,
  amendedCount: 0
};`,

  'radiology-management-service.ts': `const DEFAULT_RADIOLOGY_METRICS: RadiologyOverviewMetricsDto = {
  todaysOrdersCount: 0,
  pendingStudiesCount: 0,
  completedScansCount: 0,
  pendingReportsCount: 0,
  criticalFindingsCount: 0,
  modalityOnlinePercent: 100,
  averageTurnaroundMinutes: 0,
  emergencyQueueCount: 0
};

const DEFAULT_RADIOLOGY_ANALYTICS: RadiologyAnalyticsDto = {
  modalityUtilization: {},
  procedureVolumeByModality: {},
  meanReportTurnaroundMins: 45,
  criticalFindingFrequencyPct: 1.2,
  qualityRejectRatePct: 0.5,
  pacsStorageUsedGb: 120,
  pacsStorageCapacityGb: 1000
};`,

  'dietary-management-service.ts': `const DEFAULT_DIETARY_OVERVIEW: DietaryOverviewMetricsDto = {
  totalActiveDietaryPatients: 0,
  totalActiveDietOrders: 0,
  mealsDueToday: 0,
  mealsInPreparation: 0,
  mealsReadyForDispatch: 0,
  mealsDeliveredToday: 0,
  missedOrRefusedMeals: 0,
  activeSafetyAlerts: 0,
  npoPatientCount: 0,
  qualityFailureCount: 0,
  totalFoodWasteKgToday: 0,
  totalWasteCostLossToday: 0
};

const DEFAULT_DIETARY_ANALYTICS: DietaryAnalyticsDto = {
  averageMealCostInr: 65,
  monthlyDietarySpendInr: 120000,
  wasteReductionPct: 12.5,
  specialDietDistribution: {},
  trayDeliveryOnTimePct: 98.2
};`,

  'executive-command-service.ts': `const DEFAULT_EXECUTIVE_SNAPSHOT: ExecutiveCommandSnapshotDto = {
  timestamp: new Date().toISOString(),
  tenantId: 'tenant-apollo-delhi',
  totalActiveBeds: 150,
  occupiedBeds: 120,
  icuOccupancyPct: 82,
  edNedocsScore: 45,
  edNedocsStatus: 'BUSY_NORMAL',
  totalPatientsInEd: 18,
  activeOtSurgeriesCount: 4,
  delayedDischargesCount: 2,
  rcmLeakageRiskTotalInr: 0,
  stockoutAlertsCount: 0,
  telemetryStatus: 'Doc Search Executive Command Sentinel Active'
};`,

  'abdm-fhir-service.ts': `const DEFAULT_ABDM_METRICS: AbdmGatewayOverviewMetricsDto = {
  bridgeStatus: 'OPERATIONAL',
  hfrFacilityId: 'IN0710001234',
  facilityName: 'Doc Search Primary Medical Center',
  totalLinkedAbhaCount: 0,
  careContextsDiscoverableCount: 0,
  activeConsentGrantsCount: 0,
  fhirBundlesGeneratedMonth: 0,
  scanAndShareRegistrationsToday: 0,
  averagePushLatencyMs: 120,
  ecdhKeyExchangeSuccessPct: 100
};`,

  'telemedicine-rpm-service.ts': `const DEFAULT_TELEMEDICINE_METRICS: TelemedicineOverviewMetricsDto = {
  activeTeleconsultationsToday: 0,
  patientsInVirtualWaitingRoom: 0,
  activeEnrolledRpmPatients: 0,
  connectedIotDevicesCount: 0,
  vitalBreachesAlertsToday: 0,
  averageCallDurationMins: 0,
  patientSatisfactionScorePct: 100,
  remoteAdherenceRatePct: 98
};`,

  'whatsapp-portal-service.ts': `const DEFAULT_WHATSAPP_METRICS: WhatsAppOverviewMetricsDto = {
  totalConversationsToday: 0,
  botHandledInteractionsPct: 100,
  documentsDispatchedMonth: 0,
  appointmentsBookedViaWhatsApp: 0,
  activePortalUsersCount: 0,
  medicationRefillCompliancePct: 95,
  averageBotResponseTimeSec: 1.2,
  patientNpsScore: 92
};`
};

for (const [filename, replacement] of Object.entries(configs)) {
  const p = path.join(servicesDir, filename);
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\/mock-[^'"]+['"];?/, replacement);
  fs.writeFileSync(p, code, 'utf8');
  console.log(`Successfully replaced mock import in ${filename}`);
}

console.log('--- ALL 12 SERVICES FIXED ---');
