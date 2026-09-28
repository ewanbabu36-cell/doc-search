import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const BASE_URL = 'http://localhost:4000';
const TEMP_DIR = os.tmpdir();
const wavFixture = path.join(TEMP_DIR, 'live_api_test.wav');

console.log('================================================================');
console.log('LIVE API GATEWAY WHISPER STT VERIFICATION');
console.log('================================================================\n');

async function main() {
  // 1. Generate real audio fixture
  console.log('[1/4] Generating real audio speech fixture...');
  const script = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('${wavFixture.replace(/\\/g, '\\\\')}'); $s.Speak('Doctor, the patient blood pressure is one twenty over eighty.'); $s.Dispose();`;
  execSync(`powershell -Command "${script}"`);

  const audioBuffer = fs.readFileSync(wavFixture);
  const base64Audio = audioBuffer.toString('base64');
  console.log(`Generated audio size: ${audioBuffer.length} bytes (base64: ${base64Audio.length} chars)\n`);

  // 2. Login to obtain session token
  console.log('[2/4] Logging in as Admin to obtain session token...');
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'founder@docsearch.health',
      password: 'FounderPass123!'
    })
  });

  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  if (!loginRes.ok || !token) {
    console.error('Login failed:', loginData);
    process.exit(1);
  }
  console.log('  Login successful. Token acquired.\n');

  // 3. Test POST /api/v1/partner/ai/voice/transcribe
  console.log('[3/4] Invoking live POST /api/v1/partner/ai/voice/transcribe...');
  const transcribeStart = Date.now();
  const transcribeRes = await fetch(`${BASE_URL}/api/v1/partner/ai/voice/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      audio: base64Audio,
      mimeType: 'audio/wav'
    })
  });

  const transcribeData = await transcribeRes.json();
  const transcribeLatency = Date.now() - transcribeStart;
  console.log('  Status:', transcribeRes.status);
  console.log('  Response:', JSON.stringify(transcribeData, null, 2));
  console.log(`  Round-trip latency: ${transcribeLatency}ms\n`);

  if (!transcribeRes.ok || !transcribeData.success) {
    console.error('Transcribe endpoint failed!');
    process.exit(1);
  }

  const transcript = transcribeData.data?.transcript || '';
  if (
    transcript.toLowerCase().includes('patient') ||
    transcript.toLowerCase().includes('blood pressure') ||
    transcript.toLowerCase().includes('doctor')
  ) {
    console.log('  PASS: Live transcription returned accurate speech text!\n');
  } else {
    console.error('  FAIL: Live transcription text did not match expected keywords.\n');
    process.exit(1);
  }

  // 4. Test POST /api/v1/partner/ai/voice/interact (Full Voice Pipeline: STT -> AI Core -> Persist -> TTS)
  console.log('[4/4] Invoking live POST /api/v1/partner/ai/voice/interact...');
  const interactStart = Date.now();
  const interactRes = await fetch(`${BASE_URL}/api/v1/partner/ai/voice/interact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      audio: base64Audio,
      mimeType: 'audio/wav',
      synthesizeAudio: false
    })
  });

  const interactData = await interactRes.json();
  const interactLatency = Date.now() - interactStart;
  console.log('  Status:', interactRes.status);
  console.log('  Response Data:', {
    conversationId: interactData.data?.conversationId,
    transcript: interactData.data?.transcript,
    contentSnippet: interactData.data?.content?.slice(0, 80),
    safetyCategory: interactData.data?.safetyCategory,
    usage: interactData.data?.usage
  });
  console.log(`  Round-trip latency: ${interactLatency}ms\n`);

  if (!interactRes.ok || !interactData.success) {
    console.error('Interact endpoint failed!');
    process.exit(1);
  }

  console.log('================================================================');
  console.log('LIVE ENDPOINT VERIFICATION COMPLETE: ALL CHECKS PASSED');
  console.log('================================================================\n');

  try {
    fs.unlinkSync(wavFixture);
  } catch {}
}

main().catch((err) => {
  console.error('Test error:', err);
  try {
    fs.unlinkSync(wavFixture);
  } catch {}
  process.exit(1);
});
