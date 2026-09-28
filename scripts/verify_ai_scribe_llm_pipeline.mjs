import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/alamr/OneDrive/Desktop/DOC SEARCH';

console.log('=== VERIFYING AI SCRIBE LLM EXTRACTION PIPELINE ===\n');

let passed = true;

// 1. Test Extraction Logic Directly
console.log('1. Testing Clinical Extraction Engine:');

const { AiScribeExtractionService } = await import(
  '../apps/api-gateway/dist/services/partner/AiScribeExtractionService.js'
);

const service = new AiScribeExtractionService();

// Scenario 1: Hindi/Hinglish Viral Fever + Renal Stone
const dialogue1 =
  'Doctor: Namaste Ramesh ji. Kya takleef ho rahi hai?\n' +
  'Patient: Doctor sahab 3 din se bahut tez bukhar hai aur khansi hai, gale me kharash hai. Pichle saal mujhe kidney me stone hua tha to aisi dawa mat dijiyega.\n' +
  'Doctor: Bilkul Ramesh ji, nephrotoxic NSAIDs avoid karenge. BP 128/82 mmHg hai. Paracetamol 650 safe dose aur Cetirizine likh raha hoon, CBC aur KFT test karwayenge.';

const res1 = service.extractWithDeterministicParser(dialogue1, {
  patientName: 'Ramesh Kumar',
  age: 45,
  gender: 'MALE',
  pastHistory: ['Nephrolithiasis']
});

console.log('  [Scenario 1: Viral Fever + Kidney History]');
console.log(`    Chief Complaint: "${res1.chiefComplaint}"`);
console.log(`    Assessment: "${res1.clinicalAssessment}"`);
console.log(`    Diagnoses count: ${res1.diagnoses.length}`);
console.log(`    Medications count: ${res1.medications.length}`);
console.log(`    Lab Tests: ${res1.recommendedLabTests.join(', ')}`);
console.log(`    Critical Alerts: ${res1.criticalAlerts.join('; ')}`);

if (
  res1.chiefComplaint.toLowerCase().includes('fever') &&
  res1.diagnoses.some((d) => d.code === 'J06.9' || d.code === 'J20.9') &&
  res1.diagnoses.some((d) => d.code === 'N20.0') &&
  res1.medications.some((m) => m.medicationName.toLowerCase().includes('paracetamol')) &&
  res1.recommendedLabTests.includes('CBC (Complete Blood Count)') &&
  res1.recommendedLabTests.includes('KFT / Serum Creatinine & Urea') &&
  res1.criticalAlerts.some((a) => a.toLowerCase().includes('renal'))
) {
  console.log('    ✓ Scenario 1 PASSED: All clinical entities, ICD-10, renal safety, and tests accurately extracted.');
} else {
  console.error('    ✗ Scenario 1 FAILED assertions!');
  passed = false;
}

// Scenario 2: Hypertension + Diabetes + Penicillin Allergy
console.log('\n  [Scenario 2: HTN + Diabetes + Penicillin Allergy]');
const dialogue2 =
  'Uncle ji aapka BP 148/92 mmHg aaya hai. Fasting sugar bhi 140 aaya tha. Telmisartan aur Metformin continue karenge aur HbA1c test karwana hai. Aur haan, mujhe Penicillin se severe allergy hai.';

const res2 = service.extractWithDeterministicParser(dialogue2, {
  patientName: 'Suresh Verma',
  age: 62,
  gender: 'MALE'
});

console.log(`    Assessment: "${res2.clinicalAssessment}"`);
console.log(`    Meds: ${res2.medications.map((m) => m.medicationName).join(', ')}`);
console.log(`    Lab Tests: ${res2.recommendedLabTests.join(', ')}`);
console.log(`    Critical Alerts: ${res2.criticalAlerts.join('; ')}`);

if (
  res2.diagnoses.some((d) => d.code === 'I10') &&
  res2.diagnoses.some((d) => d.code === 'E11.9') &&
  res2.diagnoses.some((d) => d.code === 'Z88.0') &&
  res2.medications.some((m) => m.medicationName.toLowerCase().includes('telmisartan')) &&
  res2.medications.some((m) => m.medicationName.toLowerCase().includes('metformin')) &&
  res2.recommendedLabTests.includes('HbA1c (Glycated Hemoglobin)') &&
  res2.criticalAlerts.some((a) => a.toLowerCase().includes('penicillin'))
) {
  console.log('    ✓ Scenario 2 PASSED: HTN, Diabetes, Penicillin allergy alert, and HbA1c tests accurately extracted.');
} else {
  console.error('    ✗ Scenario 2 FAILED assertions!');
  passed = false;
}

// 2. Verify Backend Route & Controller
console.log('\n2. Checking Backend Route Registration:');
const routesPath = path.join(baseDir, 'apps/api-gateway/src/routes/partner/ai-voice.routes.ts');
const routesContent = fs.readFileSync(routesPath, 'utf-8');

if (
  routesContent.includes('/api/v1/partner/ai/voice/extract-soap') &&
  routesContent.includes('aiScribeExtractionService.extractSoapFromTranscript')
) {
  console.log('  ✓ POST /api/v1/partner/ai/voice/extract-soap is registered with AiScribeExtractionService');
} else {
  console.error('  ✗ extract-soap route missing in ai-voice.routes.ts!');
  passed = false;
}

// 3. Verify Frontend Client Service
console.log('\n3. Checking Frontend Client Service:');
const clientServicePath = path.join(baseDir, 'apps/partner-platform/src/services/ai-voice-service.ts');
const clientServiceContent = fs.readFileSync(clientServicePath, 'utf-8');

if (clientServiceContent.includes('extractSoapNotes')) {
  console.log('  ✓ aiVoiceService.extractSoapNotes client method is available');
} else {
  console.error('  ✗ extractSoapNotes missing in ai-voice-service.ts!');
  passed = false;
}

// 4. Verify AmbientAiScribeView Integration
console.log('\n4. Checking AmbientAiScribeView UI Integration:');
const scribeViewPath = path.join(baseDir, 'apps/partner-platform/src/components/views/AmbientAiScribeView.tsx');
const scribeViewContent = fs.readFileSync(scribeViewPath, 'utf-8');

if (
  scribeViewContent.includes('handleExtractSoapFromTranscript') &&
  scribeViewContent.includes('AI Extract SOAP & Rx') &&
  scribeViewContent.includes('onGenerateSoap(extractedSoap)')
) {
  console.log('  ✓ AmbientAiScribeView has handleExtractSoapFromTranscript, AI Extract button, and passes dynamic extractedSoap to onGenerateSoap');
} else {
  console.error('  ✗ AmbientAiScribeView missing required dynamic extraction bindings!');
  passed = false;
}

// 5. Verify ConsultationDomainManager Handoff
console.log('\n5. Checking ClinicalConsultationDomainManager Handoff:');
const managerPath = path.join(baseDir, 'apps/partner-platform/src/components/ClinicalConsultationDomainManager.tsx');
const managerContent = fs.readFileSync(managerPath, 'utf-8');

if (
  managerContent.includes('onGenerateSoap={async (extractedData?: any)') &&
  managerContent.includes('extractedData?.chiefComplaint') &&
  managerContent.includes('extractedData?.rx') &&
  managerContent.includes('extractedData?.icd10')
) {
  console.log('  ✓ ClinicalConsultationDomainManager receives extracted data and dynamically maps complaint, meds, and diagnoses into consultation desk');
} else {
  console.error('  ✗ ClinicalConsultationDomainManager missing dynamic mapping for extractedData!');
  passed = false;
}

console.log('\n===============================================================');
if (passed) {
  console.log('🎉 ALL AI SCRIBE LLM PIPELINE CHECKS PASSED SUCCESSFULLY!');
} else {
  console.error('❌ SOME CHECKS FAILED!');
  process.exit(1);
}
