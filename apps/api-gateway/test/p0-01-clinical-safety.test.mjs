import { ClinicalSafetyService } from '@docsearch/shared-core';
import { aiVoiceService } from '../dist/services/partner/AiVoiceService.js';
import { MockSpeechToTextProvider, setSttProvider } from '../dist/ai/voice/stt-provider.js';

console.log('================================================================');
console.log('DOC SEARCH: P0-01 CLINICAL SAFETY VERIFICATION SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

// ============================================================================
// SUITE A: MEDICINE RECOGNITION (20+ CASES)
// ============================================================================
console.log('[SUITE A] Medicine Recognition & Formulary Safety Validation');

const medicineCases = [
  // Exact matches
  { text: 'Prescribe Dolo 650 one tablet', expectedDrug: 'Dolo 650', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Give Calpol 650 twice daily', expectedDrug: 'Calpol 650', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Start Augmentin 625 Duo twice daily', expectedDrug: 'Augmentin 625 Duo', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'SCHEDULE_H1' },
  { text: 'Administer Pantoprazole 40 mg before breakfast', expectedDrug: 'Pantoprazole', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Patient is on Telmisartan 40 mg OD', expectedDrug: 'Telma 40', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Start Azithromycin 500 mg once daily for 3 days', expectedDrug: 'Azithral 500', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'SCHEDULE_H1' },
  { text: 'Prescribed Glycomet 500 after meals', expectedDrug: 'Glycomet 500', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Continue Amlodipine 5 mg OD', expectedDrug: 'Amlong 5', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Advise Cetirizine 10 mg at bedtime', expectedDrug: 'Cetzine 10', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Start Montair 10 once daily', expectedDrug: 'Montair 10', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Give Taxim-O 200 twice daily', expectedDrug: 'Taxim-O 200', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'SCHEDULE_H1' },
  { text: 'Start Ciplox 500 twice daily for 5 days', expectedDrug: 'Ciplox 500', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'SCHEDULE_H1' },
  { text: 'Add Metronidazole 400 mg TDS', expectedDrug: 'Flagyl 400', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Prescribe Brufen 400 SOS for joint pain', expectedDrug: 'Brufen 400', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Take Pan 40 empty stomach', expectedDrug: 'Pan 40', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Start Omez 20 once daily before breakfast', expectedDrug: 'Omez 20', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Take Shelcal 500 once daily with milk', expectedDrug: 'Shelcal 500', expectedStatus: 'VALID', type: 'EXACT' },
  { text: 'Chew Limcee 500 once daily', expectedDrug: 'Limcee 500', expectedStatus: 'VALID', type: 'EXACT' },

  // Intentionally corrupted / misspelled medicine names (Whisper speech corruption)
  { text: 'Patient was given pantoprasil 40 mg', rawExpected: 'pantoprasil', candidateMatch: 'Pantoprazole', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'FUZZY' },
  { text: 'Doctor prescribed augmintin 625', rawExpected: 'augmintin', candidateMatch: 'Augmentin', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'FUZZY' },
  { text: 'Patient started azithromicin 500', rawExpected: 'azithromicin', candidateMatch: 'Azithral', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'FUZZY' },
  { text: 'Blood pressure medicine telmisartin 40', rawExpected: 'telmisartin', candidateMatch: 'Telma', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'FUZZY' },
  { text: 'Diabetic patient taking metforminil 500', rawExpected: 'metforminil', candidateMatch: 'Glycomet', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'FUZZY' },

  // High-risk controlled Schedule H1 narcotics
  { text: 'Administer Tramadol 50 mg injection', expectedDrug: 'Tramazac 50', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'SCHEDULE_H1' },
  { text: 'Give Alprazolam 0.25 mg at bedtime', expectedDrug: 'Alprax 0.25', expectedStatus: 'REQUIRES_CONFIRMATION', type: 'SCHEDULE_H1' }
];

for (const c of medicineCases) {
  const report = ClinicalSafetyService.validateSpeechTranscript(c.text);
  const medEntities = report.entities.filter((e) => e.type === 'MEDICATION');

  assert(medEntities.length > 0, `Detected medication entity in: "${c.text}"`);
  if (medEntities.length > 0) {
    const med = medEntities[0];
    if (c.type === 'FUZZY') {
      // Invariant: NEVER silently overwrite raw text!
      assert(
        med.rawText.toLowerCase() === c.rawExpected.toLowerCase(),
        `Preserved raw corrupted token "${med.rawText}" without silent mutation`
      );
      assert(
        med.status === 'REQUIRES_CONFIRMATION',
        `Corrupted medicine marked REQUIRES_CONFIRMATION (Got: ${med.status})`
      );
      assert(
        med.flags.includes('FUZZY_MEDICINE_MATCH'),
        `Flagged as FUZZY_MEDICINE_MATCH: candidate "${med.candidateMatch}"`
      );
    } else if (c.type === 'SCHEDULE_H1') {
      assert(
        med.status === 'REQUIRES_CONFIRMATION',
        `Schedule H1 controlled drug requires confirmation (Got: ${med.status})`
      );
      assert(
        med.flags.includes('HIGH_RISK_SCHEDULE_H1'),
        `Flagged as HIGH_RISK_SCHEDULE_H1 (${med.rawText})`
      );
    } else {
      assert(
        med.status === 'VALID',
        `Formulary exact match verified as VALID: "${med.rawText}"`
      );
    }
  }
}

// ============================================================================
// SUITE B: NUMERIC & VITAL SAFETY (10+ INVALID / IMPOSSIBLE CASES)
// ============================================================================
console.log('\n[SUITE B] Numeric & Vital Safety Guarding (Anti-Hallucination Bounds)');

// 1. Mandatory Anchor Test: SpO2 296 percent
{
  console.log('  Testing Mandatory Anchor Case: "SpO2 296 percent"');
  const anchorReport = ClinicalSafetyService.validateSpeechTranscript('Patient SpO2 296 percent in room air');
  const spo2Entity = anchorReport.entities.find((e) => e.normalizedValue?.parameter === 'SpO2');

  assert(anchorReport.status === 'REJECTED', `Overall status is REJECTED (Got: ${anchorReport.status})`);
  assert(anchorReport.requiresConfirmation === true, 'Requires confirmation flag is TRUE');
  assert(anchorReport.suggestedAction === 'REJECT_INVALID_DATA', `Suggested action is REJECT_INVALID_DATA (Got: ${anchorReport.suggestedAction})`);
  assert(anchorReport.safetyFlags.includes('INVALID_VITAL_VALUE'), 'Contains INVALID_VITAL_VALUE flag');
  assert(anchorReport.safetyFlags.includes('SPO2_OUT_OF_PHYSIOLOGICAL_RANGE'), 'Contains SPO2_OUT_OF_PHYSIOLOGICAL_RANGE flag');

  assert(spo2Entity !== undefined, 'SpO2 entity was extracted');
  if (spo2Entity) {
    assert(spo2Entity.rawText.includes('296'), `Raw text preserved exact string: "${spo2Entity.rawText}"`);
    // CRITICAL: NEVER silently clamp 296 to 100!
    assert(spo2Entity.normalizedValue?.rawValue === 296, `Raw value preserved as 296 (NOT clamped to 100, got: ${spo2Entity.normalizedValue?.rawValue})`);
    assert(spo2Entity.status === 'REJECTED', 'SpO2 entity status is REJECTED');
  }
}

// 2. Additional Invalid Numeric Test Cases
const invalidNumericCases = [
  { text: 'SpO2 0 percent', expectedFlag: 'INVALID_VITAL_VALUE', param: 'SpO2', reason: 'Zero SpO2' },
  { text: 'oxygen saturation -15 percent', expectedFlag: 'INVALID_VITAL_VALUE', param: 'SpO2', reason: 'Negative SpO2' },
  { text: 'Patient BP is 80 over 120 mmHg', expectedFlag: 'INVERTED_BLOOD_PRESSURE', param: 'BLOOD_PRESSURE', reason: 'Inverted BP (Systolic < Diastolic)' },
  { text: 'blood pressure 350 over 220', expectedFlag: 'INVALID_BLOOD_PRESSURE', param: 'BLOOD_PRESSURE', reason: 'Extreme BP exceeding survivable limit' },
  { text: 'Patient heart rate is 500 bpm', expectedFlag: 'INVALID_HEART_RATE', param: 'HEART_RATE', reason: 'Extreme HR 500 bpm' },
  { text: 'pulse rate -20', expectedFlag: 'INVALID_HEART_RATE', param: 'HEART_RATE', reason: 'Negative pulse rate' },
  { text: 'temperature 150 degrees Fahrenheit', expectedFlag: 'INVALID_TEMPERATURE', param: 'TEMPERATURE', reason: 'Extreme Temperature 150 F' },
  { text: 'temp 60 C', expectedFlag: 'INVALID_TEMPERATURE', param: 'TEMPERATURE', reason: 'Extreme Temperature 60 C' },
  { text: 'respiratory rate 140 breaths per minute', expectedFlag: 'INVALID_RESPIRATORY_RATE', param: 'RESPIRATORY_RATE', reason: 'Extreme RR 140/min' },
  { text: 'respiratory rate -8', expectedFlag: 'INVALID_RESPIRATORY_RATE', param: 'RESPIRATORY_RATE', reason: 'Negative RR' },
  { text: 'random blood sugar is 2500 mg/dl', expectedFlag: 'INVALID_GLUCOSE_VALUE', param: 'BLOOD_GLUCOSE', reason: 'Extreme Blood Glucose 2500 mg/dL' },
  { text: 'Give Paracetamol 50000 mg stat', expectedFlag: 'UNUSUAL_DOSAGE', param: 'DOSAGE', reason: 'Lethal massive dosage (50,000 mg)' }
];

for (const c of invalidNumericCases) {
  const report = ClinicalSafetyService.validateSpeechTranscript(c.text);
  assert(report.status === 'REJECTED', `Report rejected invalid case: "${c.text}" (Got: ${report.status})`);
  assert(report.safetyFlags.includes(c.expectedFlag), `Flagged with ${c.expectedFlag} for ${c.reason}`);
}

// ============================================================================
// SUITE C: VALID CLINICAL VALUES
// ============================================================================
console.log('\n[SUITE C] Physiological Valid Clinical Vitals & Lab Verification');

const validCases = [
  { text: 'SpO2 98 percent', param: 'SpO2', expectedVal: 98 },
  { text: 'Patient blood pressure is 120 over 80 mmHg', param: 'BLOOD_PRESSURE', expectedSys: 120, expectedDia: 80 },
  { text: 'pulse rate is 72 bpm', param: 'HEART_RATE', expectedVal: 72 },
  { text: 'temperature 98.6 F', param: 'TEMPERATURE', expectedVal: 98.6 },
  { text: 'respiratory rate 16 per minute', param: 'RESPIRATORY_RATE', expectedVal: 16 },
  { text: 'random blood sugar 110 mg/dL', param: 'BLOOD_GLUCOSE', expectedVal: 110 }
];

for (const c of validCases) {
  const report = ClinicalSafetyService.validateSpeechTranscript(c.text);
  assert(report.status === 'VALID', `Valid clinical value accepted: "${c.text}" (Status: ${report.status})`);
  assert(report.requiresConfirmation === false, `requiresConfirmation is FALSE for "${c.text}"`);
  assert(report.suggestedAction === 'PROCEED', `Suggested action is PROCEED for "${c.text}"`);
}

// ============================================================================
// SUITE D: SAFETY STATES COVERAGE (VALID, UNCERTAIN, REQUIRES_CONFIRMATION, REJECTED)
// ============================================================================
console.log('\n[SUITE D] Explicit Safety States Verification');

// 1. VALID
const validReport = ClinicalSafetyService.validateSpeechTranscript('Patient BP 120/80 and heart rate 75 bpm');
assert(validReport.status === 'VALID', `State VALID confirmed (Got: ${validReport.status})`);

// 2. REQUIRES_CONFIRMATION
const confirmReport = ClinicalSafetyService.validateSpeechTranscript('Patient was prescribed pantoprasil 40 mg OD');
assert(confirmReport.status === 'REQUIRES_CONFIRMATION', `State REQUIRES_CONFIRMATION confirmed (Got: ${confirmReport.status})`);

// 3. REJECTED
const rejectedReport = ClinicalSafetyService.validateSpeechTranscript('SpO2 296 percent and BP 80 over 120');
assert(rejectedReport.status === 'REJECTED', `State REJECTED confirmed (Got: ${rejectedReport.status})`);

// 4. UNCERTAIN
const uncertainReport = ClinicalSafetyService.validateSpeechTranscript('cefi');
assert(
  uncertainReport.status === 'REQUIRES_CONFIRMATION' || uncertainReport.status === 'UNCERTAIN',
  `Ambiguous/uncertain token flagged safely (Got: ${uncertainReport.status})`
);

// ============================================================================
// SUITE E: VOICE SERVICE INTEGRATION & PERSISTENCE SAFETY
// ============================================================================
console.log('\n[SUITE E] AiVoiceService Integration & Persistence Audit');

await (async () => {
  const mockSession = {
    userId: 'doc-user-123',
    tenantId: 'tenant-city-hospital',
    branchId: 'branch-main',
    role: 'SUPER_ADMIN',
    isSuperAdmin: true,
    permissions: ['*']
  };

  const mockStt = new MockSpeechToTextProvider();
  setSttProvider(mockStt);

  try {
    // 1. Verify transcribeAudio attaches clinicalSafety report
    mockStt.setCustomTranscript('Prescribe Dolo 650 one tablet');
    const dummyAudio = Buffer.from('RIFF....test....');
    const transcribeResult = await aiVoiceService.transcribeAudio(mockSession, dummyAudio, 'audio/wav');
    assert(transcribeResult.clinicalSafety !== undefined, 'transcribeAudio() returns clinicalSafety report');
    assert(transcribeResult.clinicalSafety?.status === 'VALID', `transcribeAudio() status is VALID (Got: ${transcribeResult.clinicalSafety?.status})`);

    // 2. Verify processVoiceInteraction blocks REJECTED clinical vitals
    mockStt.setCustomTranscript('Doctor reports SpO2 296 percent for patient in ward 3');
    const safetyCheck = ClinicalSafetyService.validateSpeechTranscript('Doctor reports SpO2 296 percent for patient in ward 3');
    assert(safetyCheck.status === 'REJECTED', 'Safety check correctly identifies SpO2 296% as REJECTED');
    assert(safetyCheck.suggestedAction === 'REJECT_INVALID_DATA', 'Suggested action is REJECT_INVALID_DATA');

    // Live endpoint execution with SpO2 296%
    aiVoiceService.resetCache();
    const blockedResponse = await aiVoiceService.processVoiceInteraction(mockSession, {
      audio: dummyAudio,
      mimeType: 'audio/wav',
      synthesizeAudio: false
    });

    assert(blockedResponse.transcript.includes('296 percent'), 'Raw untrusted transcript is preserved intact');
    assert(blockedResponse.clinicalSafety !== undefined, 'VoiceExecutionResponse includes clinicalSafety metadata');
    assert(blockedResponse.clinicalSafety?.status === 'REJECTED', `Voice interaction blocked execution for invalid vital (Status: ${blockedResponse.clinicalSafety?.status})`);
    assert(blockedResponse.content.includes('Clinical Safety Rejection'), 'Voice execution returned clinical safety rejection notification');

    // 3. Verify processVoiceInteraction permits VALID clinical vitals
    mockStt.setCustomTranscript('Patient blood pressure is 120 over 80 mmHg');
    aiVoiceService.resetCache();
    const validResponse = await aiVoiceService.processVoiceInteraction(mockSession, {
      audio: dummyAudio,
      mimeType: 'audio/wav',
      synthesizeAudio: false
    });

    assert(validResponse.clinicalSafety?.status === 'VALID', `Voice execution permitted valid vitals (Status: ${validResponse.clinicalSafety?.status})`);
  } finally {
    setSttProvider(null);
  }
})();

console.log('\n================================================================');
console.log(`P0-01 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
