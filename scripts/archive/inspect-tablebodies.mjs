import fs from 'node:fs';

const files = [
  'apps/company-platform/src/components/executive/AbdmNationalHealthStackConsoleView.tsx',
  'apps/company-platform/src/components/executive/AiOutbreakBillingAnomalyCenterView.tsx',
  'apps/company-platform/src/components/executive/LimsHl7AstmIotDeviceHubView.tsx',
  'apps/company-platform/src/components/executive/MultiCloudDisasterRecoveryDrillView.tsx',
  'apps/company-platform/src/components/infrastructure/OpenTelemetryApmRadarView.tsx',
  'apps/company-platform/src/components/infrastructure/PitrRansomwareSnapshotView.tsx',
  'apps/company-platform/src/components/integration/CustomWebhookIngressBuilderView.tsx',
  'apps/company-platform/src/components/integration/DicomPacsGatewayView.tsx',
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

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n=== ${file.split('/').pop()} ===`);
  const lines = content.split('\n');
  let inTableBody = false;
  let tbLines = [];
  lines.forEach((l, idx) => {
    if (l.includes('<TableBody>') || l.includes('<TableBody ')) {
      inTableBody = true;
    }
    if (inTableBody && tbLines.length < 10) {
      tbLines.push(`  L${idx+1}: ${l}`);
    }
    if (l.includes('</TableBody>')) {
      inTableBody = false;
    }
  });
  if (tbLines.length > 0) {
    console.log(tbLines.join('\n'));
  } else {
    // maybe card list
    lines.forEach((l, idx) => {
      if (l.includes('.map(')) {
        console.log(`  Map at L${idx+1}: ${l.trim()}`);
      }
    });
  }
}
