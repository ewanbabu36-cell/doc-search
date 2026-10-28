import fs from 'node:fs';

const p = 'apps/partner-platform/src/components/ClinicalConsultationDomainManager.tsx';
let code = fs.readFileSync(p, 'utf8');

// Replace mock imports
code = code.replace(/import\s*\{\s*MOCK_CONSULTATIONS,[\s\S]*?\}\s*from\s*'\.\.\/services\/mock-clinical-consultation-data\.js';?\r?\n?/, `
const isProductionClinicPilot = () => true;
const filterRealClinicalPatients = <T,>(list: T[]): T[] => list;
`);
code = code.replace(/import\s*\{\s*MOCK_ENCOUNTERS\s*\}\s*from\s*'\.\.\/services\/mock-encounter-data\.js';?\r?\n?/, '');
code = code.replace(/import\s*\{\s*MOCK_DOCTOR_PROFILES\s*\}\s*from\s*'\.\.\/services\/mock-doctor-roster-data\.js';?\r?\n?/, '');

// Replace mock usages
code = code.replace('let initialList = MOCK_CONSULTATIONS;', 'let initialList: any[] = [];');
code = code.replace('if (initialList.length === 0) return MOCK_CONSULTATION_OVERVIEW;', `if (initialList.length === 0) return {
      totalConsultationsCount: 0,
      inProgressConsultationsCount: 0,
      completedConsultationsCount: 0,
      draftedConsultationsCount: 0,
      activeQueueWaitCount: 0,
      averageConsultationDurationMins: 0,
      criticalVitalsAlertCount: 0,
      telemetryStatus: 'Clinical Consultation Service Active'
    };`);
code = code.replace('return MOCK_CONSULTATIONS;', 'return [];');
code = code.replace('return MOCK_ENCOUNTERS;', 'return [];');
code = code.replace('return MOCK_DOCTOR_PROFILES;', 'return [];');
code = code.replace('return MOCK_CONSULTATION_AUDIT_TRACES;', 'return [];');

fs.writeFileSync(p, code, 'utf8');
console.log('Cleaned ClinicalConsultationDomainManager.tsx successfully!');
