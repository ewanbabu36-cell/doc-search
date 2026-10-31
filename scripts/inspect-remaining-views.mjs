import fs from 'node:fs';

const remaining = [
  'apps/company-platform/src/components/executive/AbdmNationalHealthStackConsoleView.tsx',
  'apps/company-platform/src/components/executive/AiOutbreakBillingAnomalyCenterView.tsx',
  'apps/company-platform/src/components/executive/LimsHl7AstmIotDeviceHubView.tsx',
  'apps/company-platform/src/components/executive/MultiCloudDisasterRecoveryDrillView.tsx',
  'apps/company-platform/src/components/growth/B2bCorporateWellnessCustomizerView.tsx',
  'apps/company-platform/src/components/growth/DoctorAffiliateReferralEngineView.tsx',
  'apps/company-platform/src/components/growth/HyperlocalClinicSeoRankView.tsx',
  'apps/company-platform/src/components/growth/PlanAbTestingEngineView.tsx',
  'apps/company-platform/src/components/infrastructure/OpenTelemetryApmRadarView.tsx',
  'apps/company-platform/src/components/infrastructure/PitrRansomwareSnapshotView.tsx',
  'apps/company-platform/src/components/integration/CustomWebhookIngressBuilderView.tsx',
  'apps/company-platform/src/components/integration/DicomPacsGatewayView.tsx',
  'apps/company-platform/src/components/integration/FhirBundleValidatorModal.tsx',
  'apps/company-platform/src/components/integration/LimsAnalyzerSimulatorView.tsx',
  'apps/company-platform/src/components/platform-engineering/KubernetesPodMeshRadarView.tsx',
  'apps/company-platform/src/components/product/ClinicalAddonMarketplaceView.tsx',
  'apps/company-platform/src/components/product/FeatureFlagsCanaryView.tsx',
  'apps/company-platform/src/components/product/TenantQuotaThrottlerView.tsx',
  'apps/company-platform/src/components/sales/FieldSalesVisitTrackerView.tsx',
  'apps/company-platform/src/components/sales/HospitalLeadScoringRadarView.tsx',
  'apps/company-platform/src/components/security/AiThreatSiemEngineView.tsx',
  'apps/company-platform/src/components/security/EmergencyBreakGlassProtocolView.tsx',
  'apps/company-platform/src/components/security/HsmKeyManagementView.tsx',
  'apps/company-platform/src/components/security/IpWhitelistingFirewallView.tsx',
  'apps/company-platform/src/components/security/ZeroTrustMfaPolicyController.tsx',
  'apps/company-platform/src/components/support/AiClinicalTriageSafetyEscalationView.tsx',
  'apps/company-platform/src/components/support/AutomatedPatientRefundArbiterView.tsx'
];

for (const file of remaining) {
  const content = fs.readFileSync(file, 'utf8');
  const constMatch = content.match(/const\s+((?:INITIAL|SAMPLE|MOCK)_[A-Za-z0-9_]+)[^=]*=\s*(\[[\s\S]*?\n\];)/);
  if (constMatch) {
    console.log(`FOUND: ${file} -> ${constMatch[1]} (${constMatch[2].split('\n').length} lines)`);
  } else {
    console.log(`NOT MATCHED: ${file}`);
  }
}
