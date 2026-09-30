import fs from 'fs';
import path from 'path';

const dir = 'apps/partner-platform/src/components/views';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let totalReplacements = 0;
const affectedFiles = [];

for (const f of files) {
  if (f.includes('Print') || f.includes('Receipt') || f.includes('Thermal')) continue;

  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Toast backgroundColor: '#0f172a'
  if (f === 'CentralHelpDeskExitHubView.tsx' || f === 'OpdOneFlowExpressView.tsx' || f === 'PreferredPartnerNetworkView.tsx') {
    content = content.replace(/backgroundColor:\s*'#0f172a'/g, "backgroundColor: 'var(--ds-color-surface, #0f172a)'");
  }

  // 2. CreateInvoiceView header bar
  if (f === 'CreateInvoiceView.tsx') {
    content = content.replace(/backgroundColor:\s*'#0f172a'/g, "backgroundColor: 'var(--ds-color-surface, #0f172a)'");
    content = content.replace(/border:\s*'1px solid #1e293b'/g, "border: '1px solid var(--ds-color-border, #1e293b)'");
    content = content.replace(/backgroundColor:\s*'#1e293b'/g, "backgroundColor: 'var(--ds-color-surface-subtle, #1e293b)'");
    content = content.replace(/border:\s*'1px solid #334155'/g, "border: '1px solid var(--ds-color-border, #334155)'");
  }

  // 3. FastPharmacyPosCounterView quantity chip text
  if (f === 'FastPharmacyPosCounterView.tsx') {
    content = content.replace(
      "color: item.quantity === q ? '#0f172a' : 'var(--ds-color-text-secondary)'",
      "color: item.quantity === q ? 'var(--ds-color-primary-contrast, #0f172a)' : 'var(--ds-color-text-secondary)'"
    );
  }

  // 4. InstantBillSettlementView border / bg
  if (f === 'InstantBillSettlementView.tsx') {
    content = content.replace(
      "border: `1.5px solid ${isSel ? '#38BDF8' : '#334155'}`",
      "border: `1.5px solid ${isSel ? '#38BDF8' : 'var(--ds-color-border, #334155)'}`"
    );
    content = content.replace(
      "backgroundColor: '#334155'",
      "backgroundColor: 'var(--ds-color-surface-subtle, #334155)'"
    );
  }

  // 5. MedicationCatalogView bg
  if (f === 'MedicationCatalogView.tsx') {
    content = content.replace(
      "backgroundColor: '#334155'",
      "backgroundColor: 'var(--ds-color-surface-subtle, #334155)'"
    );
  }

  // 6. PharmacyCustomerKhataDeskView border
  if (f === 'PharmacyCustomerKhataDeskView.tsx') {
    content = content.replace(
      "border: `1px solid ${acc.currentBalance > 0 ? '#10B981' : '#334155'}`",
      "border: `1px solid ${acc.currentBalance > 0 ? '#10B981' : 'var(--ds-color-border, #334155)'}`"
    );
  }

  // 7. PatientDigitalTwinLongevityView divider lines & progress tracks
  if (f === 'PatientDigitalTwinLongevityView.tsx') {
    content = content.replace(/backgroundColor:\s*'#334155'/g, "backgroundColor: 'var(--ds-color-surface-subtle, #334155)'");
  }

  // 8. InpatientOverviewView consultant name
  if (f === 'InpatientOverviewView.tsx') {
    content = content.replace("color: '#334155'", "color: 'var(--ds-color-text-secondary, #94a3b8)'");
  }

  // 9. AdmissionDetailView summary
  if (f === 'AdmissionDetailView.tsx') {
    content = content.replace("color: '#334155'", "color: 'var(--ds-color-text-secondary, #94a3b8)'");
  }

  // 10. PatientMedicationHistoryView
  if (f === 'PatientMedicationHistoryView.tsx') {
    content = content.replace("color: '#334155'", "color: 'var(--ds-color-text-secondary, #94a3b8)'");
  }

  // 11. DynamicUpiInvoiceView note text
  if (f === 'DynamicUpiInvoiceView.tsx') {
    content = content.replace("color: '#334155'", "color: 'var(--ds-color-text-secondary, #94a3b8)'");
  }

  // 12. RoleScopeView descriptions
  if (f === 'RoleScopeView.tsx') {
    content = content.replace(/color:\s*'#334155'/g, "color: 'var(--ds-color-text-secondary, #94a3b8)'");
  }

  // 13. HospitalInHouseClosedLoopView
  if (f === 'HospitalInHouseClosedLoopView.tsx') {
    content = content.replace(
      "color: isActive ? '#0369A1' : isCompleted ? '#065F46' : '#334155'",
      "color: isActive ? '#0369A1' : isCompleted ? '#065F46' : 'var(--ds-color-text-secondary, #94a3b8)'"
    );
  }

  // Now, general text colors in all files (except QR code SVG in FrontDeskMobileWorkstationView)
  const lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // SKIP QR Code rect fills in FrontDeskMobileWorkstationView
    if (f === 'FrontDeskMobileWorkstationView.tsx' && line.includes('<rect') && line.includes('fill="#0f172a"')) {
      continue;
    }

    // SKIP kbd in FastPharmacyPosCounterView
    if (f === 'FastPharmacyPosCounterView.tsx' && line.includes('<kbd')) {
      continue;
    }

    // Replace color: '#0f172a' or color: "#0f172a"
    if (line.includes("color: '#0f172a'") || line.includes('color: "#0f172a"')) {
      lines[i] = line
        .replace(/color:\s*'#0f172a'/g, "color: 'var(--ds-color-text-primary, #f8fafc)'")
        .replace(/color:\s*"#0f172a"/g, 'color: "var(--ds-color-text-primary, #f8fafc)"');
      changed = true;
      totalReplacements++;
    }

    // Replace color: '#1e293b' or color: "#1e293b"
    if (line.includes("color: '#1e293b'") || line.includes('color: "#1e293b"')) {
      lines[i] = line
        .replace(/color:\s*'#1e293b'/g, "color: 'var(--ds-color-text-primary, #f8fafc)'")
        .replace(/color:\s*"#1e293b"/g, 'color: "var(--ds-color-text-primary, #f8fafc)"');
      changed = true;
      totalReplacements++;
    }
  }

  content = lines.join('\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    affectedFiles.push(f);
  }
}

console.log(`Remediation complete! Affected files: ${affectedFiles.length}, text replacements: ${totalReplacements}`);
