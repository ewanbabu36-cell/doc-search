import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deidentifyClinicalPayload,
  reidentifyClinicalResponse,
  isPayloadDeidentified,
  simulateLlmInferenceWithDeidentification,
  EphemeralTokenVaultManager
} from '../../../packages/shared-core/dist/security/phi-deidentifier.js';

test('🛡️ Pre-LLM PII/PHI De-Identification Pipeline (Zero Data Leakage to AI)', async (t) => {

  const sampleContext = {
    patientName: 'Ramesh Kumar',
    patientPhone: '+919876543210',
    uhid: 'UHID-2026-9041',
    mrn: 'MRN-CARD-881',
    doctorName: 'Dr. Rajesh Sharma, MD',
    hospitalName: 'Apex City Hospital',
    aadhaar: '542189028921',
    abha: 'ramesh.kumar@abdm'
  };

  const rawConsultationSpeech =
    'Doctor: Namaste Ramesh Kumar ji, main Dr. Rajesh Sharma, MD bol raha hoon.\n' +
    'Patient: Doctor sahab, mera UHID-2026-9041 hai aur phone number +919876543210 hai. Mere Aadhaar 542189028921 par ABHA ramesh.kumar@abdm link hai. Pincode 400001 Mumbai se aaya hoon.\n' +
    'Doctor: Theek hai Ramesh ji, aapko 3 din se tez bukhar aur gale me kharash hai. Paracetamol 650mg likh raha hoon.';

  await t.test('1. Pre-LLM Tokenizer replaces all sensitive PHI with surrogate tokens', () => {
    const result = deidentifyClinicalPayload(rawConsultationSpeech, sampleContext);

    // Assert that the raw text is modified
    assert.notEqual(result.deidentifiedText, rawConsultationSpeech);

    // Assert that NO raw PHI remains in the outgoing string
    assert.ok(!result.deidentifiedText.includes('Ramesh Kumar'), 'Patient name must not appear');
    assert.ok(!result.deidentifiedText.includes('+919876543210'), 'Phone number must not appear');
    assert.ok(!result.deidentifiedText.includes('UHID-2026-9041'), 'UHID must not appear');
    assert.ok(!result.deidentifiedText.includes('542189028921'), 'Plaintext Aadhaar must not appear');
    assert.ok(!result.deidentifiedText.includes('ramesh.kumar@abdm'), 'ABHA handle must not appear');
    assert.ok(!result.deidentifiedText.includes('Dr. Rajesh Sharma, MD'), 'Doctor name must not appear');

    // Assert that synthetic tokens ARE present
    assert.ok(result.deidentifiedText.includes('[PATIENT_PSEUDO_A7]'), 'Must have patient token');
    assert.ok(result.deidentifiedText.includes('[PHONE_REDACTED]'), 'Must have phone token');
    assert.ok(result.deidentifiedText.includes('[ID_TOKEN_9041]'), 'Must have UHID token');
    assert.ok(result.deidentifiedText.includes('[PHYSICIAN_TOKEN_01]'), 'Must have physician token');

    // Assert counts
    assert.ok(result.entitiesScrubbedCount >= 6, 'Should scrub at least 6 distinct PHI items');
    assert.equal(isPayloadDeidentified(result.deidentifiedText, sampleContext), true);
  });

  await t.test('2. Zero Data Retention Enterprise Headers are properly formed', () => {
    const result = deidentifyClinicalPayload(rawConsultationSpeech, sampleContext);
    const headers = result.zeroDataRetentionHeaders;

    assert.equal(headers['X-Zero-Data-Retention'], 'true');
    assert.equal(headers['X-Healthcare-Privacy-Enforced'], 'true');
    assert.equal(headers['X-Model-Training'], 'opt-out');
  });

  await t.test('3. On-Premise Inward Detokenizer losslessly restores patient identity in clinical response', () => {
    const deidentifiedResult = deidentifyClinicalPayload(rawConsultationSpeech, sampleContext);

    // Simulate Cloud LLM returning SOAP assessment referencing the tokens
    const simulatedLlmSoapResponse =
      'CLINICAL ASSESSMENT:\n' +
      'Patient [PATIENT_PSEUDO_A7] (ID: [ID_TOKEN_9041]) examined by [PHYSICIAN_TOKEN_01].\n' +
      'Diagnosis: Acute Upper Respiratory Infection (J06.9).\n' +
      'Plan: Rx Paracetamol 650mg TDS x 3 days. Send SMS advice to [PHONE_REDACTED].';

    // Detokenize locally on hospital premise
    const restoredSoap = reidentifyClinicalResponse(simulatedLlmSoapResponse, deidentifiedResult.tokenMap);

    assert.ok(restoredSoap.includes('Patient Ramesh Kumar'), 'Restored SOAP must contain real patient name');
    assert.ok(restoredSoap.includes('ID: UHID-2026-9041'), 'Restored SOAP must contain real UHID');
    assert.ok(restoredSoap.includes('examined by Dr. Rajesh Sharma, MD'), 'Restored SOAP must contain real doctor name');
    assert.ok(restoredSoap.includes('Send SMS advice to +919876543210'), 'Restored SOAP must contain real phone');

    // Assert that no synthetic tokens remain in final clinical EMR note
    assert.ok(!restoredSoap.includes('[PATIENT_PSEUDO_A7]'));
    assert.ok(!restoredSoap.includes('[ID_TOKEN_9041]'));
    assert.ok(!restoredSoap.includes('[PHONE_REDACTED]'));
  });

  await t.test('4. Automated pattern matching for unlisted phone numbers and pincodes', () => {
    const unlistedText = 'Patient sister call at 9844012345 in area 400076.';
    const result = deidentifyClinicalPayload(unlistedText);

    assert.ok(!result.deidentifiedText.includes('9844012345'), 'Unlisted phone must be tokenized');
    assert.ok(!result.deidentifiedText.includes('400076'), 'Pincode must be tokenized');
    assert.ok(result.deidentifiedText.includes('[PHONE_REDACTED]'));
    assert.ok(result.deidentifiedText.includes('[PINCODE_REDACTED]'));
  });

  await t.test('5. End-to-End simulateLlmInferenceWithDeidentification round-trip validates zero cloud leakage', () => {
    const roundTrip = simulateLlmInferenceWithDeidentification(rawConsultationSpeech, sampleContext);

    assert.equal(roundTrip.isZeroLeakageVerified, true, 'Zero leakage invariant must be strictly true');
    assert.equal(roundTrip.leakageBytes, 0, 'Zero raw PHI bytes leaked to AI');
    assert.ok(roundTrip.entitiesScrubbedCount >= 6, 'Must scrub multiple PHI categories');
    
    // Outbound wire string contains only surrogate tokens
    assert.ok(!roundTrip.deidentifiedPayload.includes('Ramesh Kumar'));
    assert.ok(!roundTrip.deidentifiedPayload.includes('+919876543210'));

    // Simulated LLM response from Cloud contains ONLY surrogate tokens
    assert.ok(roundTrip.simulatedCloudLlmResponse.includes('[PATIENT_PSEUDO_A7]'));
    assert.ok(!roundTrip.simulatedCloudLlmResponse.includes('Ramesh Kumar'));

    // Hospital Restored Note contains REAL name and real doctor
    assert.ok(roundTrip.restoredClinicalResponse.includes('Ramesh Kumar'));
    assert.ok(roundTrip.restoredClinicalResponse.includes('Dr. Rajesh Sharma, MD'));
    assert.ok(!roundTrip.restoredClinicalResponse.includes('[PATIENT_PSEUDO_A7]'));
  });

  await t.test('6. EphemeralTokenVaultManager enforces RAM-only lifespan and instant flush', () => {
    const vault = EphemeralTokenVaultManager.getInstance();
    vault.flushAll();
    assert.equal(vault.getActiveCount(), 0, 'Vault should be empty after flush');

    const testMap = {
      '[PATIENT_PSEUDO_A7]': 'Ramesh Kumar',
      '[PHONE_REDACTED]': '+919876543210',
      '[ID_TOKEN_9041]': 'UHID-2026-9041'
    };

    const registered = vault.registerTokens(testMap, 180);
    assert.equal(registered.length, 3);
    assert.equal(vault.getActiveCount(), 3);

    const tokenRec = vault.getTokenRecord('[PATIENT_PSEUDO_A7]');
    assert.ok(tokenRec);
    assert.equal(tokenRec.originalValue, 'Ramesh Kumar');
    assert.equal(tokenRec.category, 'PATIENT_NAME');
    assert.ok(tokenRec.saltedHash.startsWith('0x'));

    vault.flushAll();
    assert.equal(vault.getActiveCount(), 0, 'Vault must be completely expunged from memory on flush');
    assert.equal(vault.getTokenRecord('[PATIENT_PSEUDO_A7]'), undefined);
  });
});
