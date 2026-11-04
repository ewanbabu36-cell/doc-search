import fs from 'node:fs';
import path from 'node:path';

// 1. radiology-management-service.ts
{
  const p = path.join(process.cwd(), 'apps', 'partner-platform', 'src', 'services', 'radiology-management-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  const start = code.indexOf('import {\r\n  { id:');
  const altStart = start !== -1 ? start : code.indexOf('import {\n  { id:');
  const end = code.indexOf("from './mock-radiology-data.js';");
  if (altStart !== -1 && end !== -1) {
    const after = end + "from './mock-radiology-data.js';".length;
    code = code.slice(0, altStart) + `const DEFAULT_RADIOLOGY_METRICS: RadiologyOverviewMetricsDto = {
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
};` + code.slice(after);
    fs.writeFileSync(p, code, 'utf8');
    console.log('Fixed radiology-management-service.ts');
  }
}

// 2. whatsapp-portal-service.ts
{
  const p = path.join(process.cwd(), 'apps', 'partner-platform', 'src', 'services', 'whatsapp-portal-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  const start = code.indexOf('import {\r\n  DEFAULT_WHATSAPP_METRICS');
  const altStart = start !== -1 ? start : code.indexOf('import {\n  DEFAULT_WHATSAPP_METRICS');
  const end = code.indexOf("from './mock-whatsapp-portal-data.js';");
  if (altStart !== -1 && end !== -1) {
    const after = end + "from './mock-whatsapp-portal-data.js';".length;
    code = code.slice(0, altStart) + `const DEFAULT_WHATSAPP_METRICS: WhatsAppOverviewMetricsDto = {
  totalConversationsToday: 0,
  botHandledInteractionsPct: 100,
  documentsDispatchedMonth: 0,
  appointmentsBookedViaWhatsApp: 0,
  activePortalUsersCount: 0,
  medicationRefillCompliancePct: 95,
  averageBotResponseTimeSec: 1.2,
  patientNpsScore: 92
};` + code.slice(after);
    fs.writeFileSync(p, code, 'utf8');
    console.log('Fixed whatsapp-portal-service.ts');
  }
}
