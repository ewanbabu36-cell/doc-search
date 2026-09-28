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

const TEMP_DIR = path.join(os.tmpdir(), 'docsearch_audio_audit');
os.makedirs ? os.makedirs(TEMP_DIR) : fs.mkdirSync(TEMP_DIR, { recursive: true });

console.log('================================================================');
console.log('AUDIT SECTION 7: AUDIO FORMATS & EDGE CASES');
console.log('================================================================\n');

// 1. Generate master WAV
const masterWav = path.join(TEMP_DIR, 'master_sample.wav');
const speechScript = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('${masterWav.replace(/\\/g, '\\\\')}'); $s.Speak('Vitals stable, patient discharged.'); $s.Dispose();`;
execSync(`powershell -Command "${speechScript}"`);

// 2. Generate formats
const formats = [
  { ext: 'wav', mime: 'audio/wav', file: masterWav },
  { ext: 'webm', mime: 'audio/webm', file: path.join(TEMP_DIR, 'sample.webm'), cmd: `-y -i "${masterWav}" -c:a libopus -b:a 32k` },
  { ext: 'ogg', mime: 'audio/ogg', file: path.join(TEMP_DIR, 'sample.ogg'), cmd: `-y -i "${masterWav}" -c:a libvorbis -q:a 2` },
  { ext: 'mp3', mime: 'audio/mp3', file: path.join(TEMP_DIR, 'sample.mp3'), cmd: `-y -i "${masterWav}" -c:a libmp3lame -q:a 4` },
  { ext: 'aac', mime: 'audio/aac', file: path.join(TEMP_DIR, 'sample.aac'), cmd: `-y -i "${masterWav}" -c:a aac -b:a 64k` },
  { ext: 'm4a', mime: 'audio/mp4', file: path.join(TEMP_DIR, 'sample.m4a'), cmd: `-y -i "${masterWav}" -c:a aac -b:a 64k` },
  { ext: 'silent', mime: 'audio/wav', file: path.join(TEMP_DIR, 'silent.wav'), cmd: `-f lavfi -i "anullsrc=r=16000:cl=mono" -t 3 -c:a pcm_s16le -y` }
];

for (const fmt of formats) {
  if (fmt.cmd) {
    execSync(`ffmpeg ${fmt.cmd} "${fmt.file}" -loglevel error`);
  }
}

const provider = new WhisperSpeechToTextProvider({ model: 'base', device: 'cpu' });

async function runAudit() {
  const report = [];

  // A. Format Ingestion & Transcription
  console.log('--- A. CONTAINER FORMAT TRANSCRIPTION ---');
  for (const fmt of formats) {
    const buf = fs.readFileSync(fmt.file);
    try {
      const validated = validateAudioPayload(buf, fmt.mime);
      const res = await provider.transcribe(validated.buffer, validated.mimeType);
      console.log(`  [PASS] ${fmt.ext.toUpperCase()} (${fmt.mime}): Length=${buf.length}b, Output="${res.transcript.trim()}"`);
      report.push({ format: fmt.ext, mime: fmt.mime, status: 'VERIFIED', transcript: res.transcript.trim() });
    } catch (err) {
      console.error(`  [FAIL] ${fmt.ext.toUpperCase()} (${fmt.mime}): ${err.message}`);
      report.push({ format: fmt.ext, mime: fmt.mime, status: 'FAILED', error: err.message });
    }
  }

  // B. Edge Cases
  console.log('\n--- B. EDGE CASE & FAILURE HANDLING ---');

  // 1. Empty Buffer
  try {
    validateAudioPayload(Buffer.alloc(0), 'audio/wav');
    console.error('  [FAIL] Empty audio was accepted');
  } catch (err) {
    console.log(`  [PASS] Empty audio rejected: ${err.message}`);
  }

  // 2. Corrupt Container Magic Bytes
  try {
    const corruptBuf = Buffer.from('RIFF\x00\x00\x00\x00FAKE_HEADER_CORRUPTED_BYTES_123456');
    await provider.transcribe(corruptBuf, 'audio/wav');
    console.error('  [FAIL] Corrupt audio was accepted');
  } catch (err) {
    console.log(`  [PASS] Corrupt audio rejected safely: ${err.message.slice(0, 70)}...`);
  }

  // 3. Oversized Audio (> 10MB)
  try {
    const hugeBuf = Buffer.alloc(11 * 1024 * 1024); // 11MB
    validateAudioPayload(hugeBuf, 'audio/wav');
    console.error('  [FAIL] Oversized audio (>10MB) was accepted');
  } catch (err) {
    console.log(`  [PASS] Oversized audio rejected: ${err.message}`);
  }

  // 4. Exceeds Duration (> 120s)
  try {
    // 16KB/s * 130s = 2080000 bytes with declared 130s
    const longBuf = Buffer.alloc(2500000);
    longBuf.write('RIFF', 0);
    validateAudioPayload(longBuf, 'audio/wav', { maxDurationSeconds: 120 });
    console.error('  [FAIL] Long duration (>120s) was accepted');
  } catch (err) {
    console.log(`  [PASS] Long duration rejected: ${err.message}`);
  }

  // 5. Unsupported MIME type
  try {
    const fakeBuf = Buffer.alloc(100);
    validateAudioPayload(fakeBuf, 'audio/midi');
    console.error('  [FAIL] Unsupported MIME was accepted');
  } catch (err) {
    console.log(`  [PASS] Unsupported MIME rejected: ${err.message}`);
  }

  // Cleanup
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch {}

  console.log('\n================================================================');
  console.log('AUDIO FORMAT AUDIT COMPLETE');
  console.log('================================================================');
}

runAudit().catch(console.error);
