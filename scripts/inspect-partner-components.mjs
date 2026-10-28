import fs from 'node:fs';

const files = [
  'apps/partner-platform/src/components/ClinicalConsultationDomainManager.tsx',
  'apps/partner-platform/src/components/dialogs/AutoAnalyzerSyncModal.tsx',
  'apps/partner-platform/src/components/views/DischargeWorkbenchView.tsx',
  'apps/partner-platform/src/components/views/MLCWorkbenchView.tsx',
  'apps/partner-platform/src/components/views/StaffDutyRosterView.tsx'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]*mock-[^'"]*['"];?/g);
  console.log(`=== ${f} ===`);
  if (matches) {
    console.log(matches.join('\n'));
  }
}
