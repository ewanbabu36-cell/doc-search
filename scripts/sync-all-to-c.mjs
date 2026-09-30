import fs from 'node:fs';
import path from 'node:path';

const srcDir = 'D:\\DOC SEARCH';
const destDir = 'C:\\Users\\alamr\\OneDrive\\Desktop\\DOC SEARCH';

const files = [
  'apps/partner-platform/src/workers/catalog-search.worker.ts',
  'apps/partner-platform/src/workers/catalog-search.worker.js',
  'apps/partner-platform/src/workers/voice-scribe.worker.ts',
  'apps/partner-platform/src/workers/voice-scribe.worker.js',
  'apps/partner-platform/src/workers/ocr.worker.ts',
  'apps/partner-platform/src/workers/ocr.worker.js',
  'apps/partner-platform/src/workers/wholesale-inventory.worker.ts',
  'apps/partner-platform/src/workers/wholesale-inventory.worker.js',
  'apps/partner-platform/src/services/catalog-search-service.ts',
  'apps/partner-platform/src/services/voice-scribe-service.ts',
  'apps/partner-platform/src/services/local-catalog-cache.ts',
  'apps/partner-platform/src/services/wholesale-inventory-processor.ts',
  'apps/partner-platform/src/components/views/DoctorExpressConsultationDesk.tsx',
  'apps/api-gateway/src/services/partner/CatalogSyncService.ts',
  'apps/api-gateway/src/routes/partner/catalog-sync.routes.ts',
  'apps/api-gateway/src/routes/partner/public-kiosk.routes.ts',
  'apps/api-gateway/src/routes/partner/clinical-workflow.routes.ts',
  'apps/api-gateway/src/services/partner/ClinicalSafetyService.ts',
  'apps/api-gateway/src/services/partner/ClinicalWorkflowService.ts',
  'apps/api-gateway/src/services/partner/LabDiagnosticsService.ts',
  'apps/api-gateway/src/repositories/partner/LabDiagnosticsRepository.ts',
  'apps/api-gateway/src/app.ts',
  'packages/ui-kit/src/styles/base.css',
  'packages/ui-kit/src/components/layout/app-shell.tsx',
  'apps/partner-platform/src/components/PartnerPlatformShell.tsx',
  'apps/partner-platform/src/components/common/HardwareStatusPill.tsx',
  'apps/partner-platform/src/components/common/RealTimeHospitalActivityDock.tsx',
  'apps/partner-platform/src/components/common/AmbientVoiceScribeCapsule.tsx',
  'apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx',
  'apps/partner-platform/src/components/common/OwnerPulseCockpit.tsx',
  'apps/partner-platform/src/utils/roleProfileResolver.ts',
  'apps/api-gateway/src/services/partner/PartnerAccountService.ts',
  'apps/partner-platform/src/components/views/PartnerAccountPlanView.tsx',
  'apps/partner-platform/src/components/dialogs/PrintableDoctorPrescriptionModal.tsx',
  'apps/partner-platform/src/components/dialogs/PrintablePathologyReportModal.tsx',
  'apps/partner-platform/src/services/bed-profile-synchronizer.ts',
  'apps/partner-platform/src/services/inpatient-management-service.ts',
  'apps/partner-platform/src/components/views/BedManagementView.tsx',
  'apps/api-gateway/src/config/env.ts',
  'apps/api-gateway/src/plugins/security.ts',
  'packages/ui-kit/dist/index.js',
  'scripts/benchmark-doctor-speed.mjs',
  'scripts/test-clinical-safety-cdss.mjs',
  'apps/api-gateway/src/services/company/CompanyFinancialService.ts',
  'apps/api-gateway/src/routes/company/commercial.routes.ts',
  'apps/api-gateway/data/company_financial_config.json',
  'apps/api-gateway/data/partner_subscription_payments.json',
  'apps/company-platform/src/components/billing/CompanyCorporateBankSettingsView.tsx',
  'apps/company-platform/src/components/billing/FinanceDomainManager.tsx',
  'apps/company-platform/src/components/common/UniversalAccountSettingsModal.tsx',
  'apps/partner-platform/src/components/common/HospitalPlanUpgradeModal.tsx',
  'apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx',
  'apps/partner-platform/src/components/dialogs/CommercialRenewalModal.tsx',
  'apps/api-gateway/test/company-bank-and-revenue-separation.test.mjs'
];

let count = 0;
for (const rel of files) {
  const s = path.join(srcDir, rel);
  const d = path.join(destDir, rel);
  if (fs.existsSync(s)) {
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.copyFileSync(s, d);
    count++;
    console.log('[SYNC] Copied to C:', rel);
  } else {
    console.log('[SYNC] Missing in D:', rel);
  }
}
console.log(`Successfully mirrored ${count}/${files.length} files to C: drive.`);
