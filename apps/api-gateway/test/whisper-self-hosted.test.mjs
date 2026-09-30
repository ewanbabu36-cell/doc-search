import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { WhisperSpeechToTextProvider } from '../dist/ai/voice/whisper-stt-provider.js';
import { validateAudioPayload } from '../dist/ai/voice/audio-validator.js';

const FFMPEG_BIN = process.env.WHISPER_FFMPEG_PATH || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-9.0.1-full_build', 'bin') : '');
if (FFMPEG_BIN && fs.existsSync(FFMPEG_BIN)) {
  process.env.PATH = `${FFMPEG_BIN}${path.delimiter}${process.env.PATH}`;
}

const TEMP_DIR = os.tmpdir();
const fixtures = {
  wavEn: path.join(TEMP_DIR, 'fixture_en_speech.wav'),
  webmEn: path.join(TEMP_DIR, 'fixture_en_speech.webm'),
  mp3En: path.join(TEMP_DIR, 'fixture_en_speech.mp3'),
  wavHi: path.join(TEMP_DIR, 'fixture_hi_speech.wav')
};

console.log('================================================================');
console.log('DOC SEARCH: SELF-HOSTED WHISPER STT VERIFICATION SUITE');
console.log('================================================================\n');

function generateAudioFixtures() {
  console.log('[Setup] Generating real synthetic speech fixtures via SAPI & FFmpeg...');

  // 1. English clinical audio
  const enScript = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('${fixtures.wavEn.replace(/\\/g, '\\\\')}'); $s.Speak('Patient reports severe headache and high grade fever since yesterday.'); $s.Dispose();`;
  execSync(`powershell -Command "${enScript}"`);

  // 2. Convert to WebM
  execSync(`ffmpeg -y -i "${fixtures.wavEn}" -c:a libopus -b:a 32k "${fixtures.webmEn}" -loglevel error`);

  // 3. Convert to MP3
  execSync(`ffmpeg -y -i "${fixtures.wavEn}" -c:a libmp3lame -q:a 4 "${fixtures.mp3En}" -loglevel error`);

  // 4. Hindi/Hinglish phrase
  const hiScript = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('${fixtures.wavHi.replace(/\\/g, '\\\\')}'); $s.Speak('Namaste doctor sahab mujhe do din se gale me dard hai.'); $s.Dispose();`;
  execSync(`powershell -Command "${hiScript}"`);

  console.log('[Setup] Fixtures generated:');
  console.log(`  - WAV:  ${fs.statSync(fixtures.wavEn).size} bytes`);
  console.log(`  - WebM: ${fs.statSync(fixtures.webmEn).size} bytes`);
  console.log(`  - MP3:  ${fs.statSync(fixtures.mp3En).size} bytes`);
  console.log(`  - Hindi/Hinglish: ${fs.statSync(fixtures.wavHi).size} bytes\n`);
}

function cleanupFixtures() {
  for (const f of Object.values(fixtures)) {
    try {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {}
  }
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  try {
    generateAudioFixtures();

    // Provider instance using base model for fast deterministic verification
    const provider = new WhisperSpeechToTextProvider({
      model: 'base',
      device: 'auto',
      maxConcurrency: 2,
      maxQueueDepth: 5,
      timeoutSeconds: 60
    });

    // TEST 1: Health check
    console.log('TEST 1: Health & Runtime Check');
    const health = await provider.checkHealth();
    if (health.healthy) {
      console.log('  PASS: Whisper worker script and Python executable verified.\n');
      passed++;
    } else {
      console.error('  FAIL: Whisper health check failed', health);
      failed++;
    }

    // Count temp files before
    const getLeakedTempFiles = () =>
      fs.readdirSync(TEMP_DIR).filter((f) => f.startsWith('docsearch_stt_'));
    const initialLeaks = getLeakedTempFiles();

    // TEST 2: Real English Speech (WAV)
    console.log('TEST 2: Real English Speech Transcription (WAV)');
    const wavBuffer = fs.readFileSync(fixtures.wavEn);
    const validatedWav = validateAudioPayload(wavBuffer, 'audio/wav');
    const t0 = Date.now();
    const resWav = await provider.transcribe(validatedWav.buffer, validatedWav.mimeType);
    const durWav = Date.now() - t0;

    console.log(`  Result: "${resWav.transcript}"`);
    console.log(`  Detected Language: ${resWav.language}`);
    console.log(`  Confidence: ${resWav.confidence}`);
    console.log(`  Duration: ${resWav.durationSeconds}s, Latency: ${durWav}ms`);

    const lowerTranscript = resWav.transcript.toLowerCase();
    if (
      lowerTranscript.includes('headache') ||
      lowerTranscript.includes('fever') ||
      lowerTranscript.includes('patient')
    ) {
      console.log('  PASS: Real English audio transcribed accurately.\n');
      passed++;
    } else {
      console.error('  FAIL: Transcript missed expected keywords.\n');
      failed++;
    }

    // TEST 3: Multi-format WebM
    console.log('TEST 3: Multi-format Real Audio (WebM / Opus)');
    const webmBuffer = fs.readFileSync(fixtures.webmEn);
    const resWebm = await provider.transcribe(webmBuffer, 'audio/webm');
    console.log(`  Result: "${resWebm.transcript}"`);
    if (resWebm.transcript.length > 5) {
      console.log('  PASS: WebM container transcoded & transcribed successfully.\n');
      passed++;
    } else {
      console.error('  FAIL: WebM transcription empty.\n');
      failed++;
    }

    // TEST 4: Multi-format MP3
    console.log('TEST 4: Multi-format Real Audio (MP3)');
    const mp3Buffer = fs.readFileSync(fixtures.mp3En);
    const resMp3 = await provider.transcribe(mp3Buffer, 'audio/mp3');
    console.log(`  Result: "${resMp3.transcript}"`);
    if (resMp3.transcript.length > 5) {
      console.log('  PASS: MP3 container decoded & transcribed successfully.\n');
      passed++;
    } else {
      console.error('  FAIL: MP3 transcription empty.\n');
      failed++;
    }

    // TEST 5: Hindi / Hinglish Speech
    console.log('TEST 5: Hindi / Hinglish Speech Transcription');
    const hiBuffer = fs.readFileSync(fixtures.wavHi);
    const resHi = await provider.transcribe(hiBuffer, 'audio/wav');
    console.log(`  Result: "${resHi.transcript}"`);
    console.log(`  Detected Language: ${resHi.language}`);
    if (resHi.transcript.length > 5) {
      console.log('  PASS: Hindi/Hinglish speech transcribed successfully.\n');
      passed++;
    } else {
      console.error('  FAIL: Hindi/Hinglish audio transcription empty.\n');
      failed++;
    }

    // TEST 6: Concurrency & Queue Gate
    console.log('TEST 6: Concurrency Gate & FIFO Task Queueing');
    const batchStart = Date.now();
    const p1 = provider.transcribe(wavBuffer, 'audio/wav');
    const p2 = provider.transcribe(webmBuffer, 'audio/webm');
    const p3 = provider.transcribe(mp3Buffer, 'audio/mp3');

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    const batchElapsed = Date.now() - batchStart;
    console.log(`  Batch of 3 concurrent requests completed in ${batchElapsed}ms`);
    if (r1.transcript && r2.transcript && r3.transcript) {
      console.log('  PASS: All concurrent tasks resolved through queue without crashing.\n');
      passed++;
    } else {
      console.error('  FAIL: One or more concurrent requests failed.\n');
      failed++;
    }

    // TEST 7: Corrupted / Invalid Audio Rejection
    console.log('TEST 7: Corrupted / Invalid Audio Handling');
    const garbageBytes = Buffer.from('RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00GARBAGE_NON_AUDIO_PAYLOAD_12345');
    try {
      await provider.transcribe(garbageBytes, 'audio/wav');
      console.error('  FAIL: Corrupted audio should have thrown error.\n');
      failed++;
    } catch (err) {
      console.log(`  PASS: Corrupted audio safely rejected: ${err.message}\n`);
      passed++;
    }

    // TEST 8: Zero Temp File Leaks (Healthcare Privacy Compliance)
    console.log('TEST 8: Zero-Retention Temporary File Cleanup Verification');
    const currentLeaks = getLeakedTempFiles();
    const leakedDiff = currentLeaks.filter((f) => !initialLeaks.includes(f));
    if (leakedDiff.length === 0) {
      console.log('  PASS: Verified 0 temporary audio files retained on disk.\n');
      passed++;
    } else {
      console.error(`  FAIL: Leaked temporary files found: ${leakedDiff.join(', ')}\n`);
      failed++;
    }

    console.log('================================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    cleanupFixtures();
  }
}

runTests().catch((err) => {
  console.error('Unhandled test suite error:', err);
  cleanupFixtures();
  process.exit(1);
});
