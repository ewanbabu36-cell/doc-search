import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { WhisperSpeechToTextProvider } from '../dist/ai/voice/whisper-stt-provider.js';

// Resolve portable runtime paths for test execution
const FFMPEG_BIN = process.env.WHISPER_FFMPEG_PATH || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-9.0.1-full_build', 'bin') : '');
if (FFMPEG_BIN && fs.existsSync(FFMPEG_BIN)) {
  process.env.PATH = `${FFMPEG_BIN}${path.delimiter}${process.env.PATH}`;
}

const PYTHON_BIN = process.env.WHISPER_PYTHON_PATH || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Python', 'pythoncore-3.14-64', 'python.exe') : '');

console.log('================================================================');
console.log('DOC SEARCH: P0-04 PORTABILITY & SECURITY HARDENING TEST SUITE');
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

// Generate minimal WAV file
function generateSampleWav(filepath, text = 'P0-04 Portability verification speech sample.') {
  const ps = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('${filepath.replace(/\\/g, '\\\\')}'); $s.Speak('${text}'); $s.Dispose();`;
  execSync(`powershell -Command "${ps}"`);
}

// TEST 1: Scan codebase for hardcoded machine paths
console.log('[TEST-P0-04-A] Hardcoded Developer Path Scan');
{
  const targetDirs = [
    path.resolve(process.cwd(), 'apps/api-gateway/src'),
    path.resolve(process.cwd(), 'apps/api-gateway/scripts'),
    path.resolve(process.cwd(), 'apps/api-gateway/dist')
  ];

  let machinePathMatches = [];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.py'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.toLowerCase().includes('alamr') || content.includes('C:\\Users\\')) {
          machinePathMatches.push({ file: fullPath, match: 'Developer path detected' });
        }
      }
    }
  }

  for (const dir of targetDirs) {
    scanDir(dir);
  }

  assert(machinePathMatches.length === 0, `Zero hardcoded developer machine paths in production & worker files (Found: ${machinePathMatches.length})`);
  if (machinePathMatches.length > 0) {
    console.error('  Leaked paths in:', machinePathMatches);
  }
}

// TEST 2: Subprocess Error Sanitization (CWE-209 Path Exposure Prevention)
console.log('\n[TEST-P0-04-B] API Error Path Sanitization (Information Disclosure Shield)');
await (async () => {
  // Instantiate provider pointing to a non-existent Python executable or failing script
  const failingProvider = new WhisperSpeechToTextProvider({
    pythonPath: 'invalid_python_binary_does_not_exist_xyz'
  });

  const dummyAudio = Buffer.from('RIFF....dummy....');
  let thrownError = null;

  try {
    await failingProvider.transcribe(dummyAudio, 'audio/wav', { traceId: 'test-trace-err' });
  } catch (err) {
    thrownError = err;
  }

  assert(thrownError !== null, 'Provider throws error on subprocess failure');
  if (thrownError) {
    const msg = thrownError.message || '';
    const hasPathIndicator = msg.includes('\\') || msg.includes('/') || msg.includes('.py') || msg.includes('.exe') || msg.toLowerCase().includes('traceback');
    assert(!hasPathIndicator, `Error message is sanitized and contains zero server paths or traceback info (Message: "${msg}")`);
    assert(thrownError.statusCode === 500, `Error returns appropriate HTTP 500 status (Got: ${thrownError.statusCode})`);
  }
})();

// TEST 3: Temporary Audio File Lifecycle & Guaranteed Cleanup
console.log('\n[TEST-P0-04-C] Guaranteed Zero-Retention Temporary File Cleanup');
await (async () => {
  const tmpDir = os.tmpdir();
  const sampleWavPath = path.join(tmpDir, 'p0_04_test_sample.wav');
  generateSampleWav(sampleWavPath, 'Testing temporary audio cleanup.');
  const audioBuffer = fs.readFileSync(sampleWavPath);

  const provider = new WhisperSpeechToTextProvider({
    pythonPath: PYTHON_BIN,
    ffmpegPath: FFMPEG_BIN,
    model: 'base'
  });

  // Check existing tmp files matching docsearch pattern
  const getLingeringTmpFiles = () => {
    return fs.readdirSync(tmpDir).filter(f => f.startsWith('docsearch_stt_'));
  };

  const beforeTmpCount = getLingeringTmpFiles().length;

  // 1. Success path
  try {
    const res = await provider.transcribe(audioBuffer, 'audio/wav', { traceId: 'test-trace-clean-ok' });
    assert(res && res.transcript.length > 0, `Transcription completed: "${res.transcript}"`);
  } catch (e) {
    console.error('  Transcription error on success test:', e);
  }

  const afterSuccessTmpCount = getLingeringTmpFiles().length;
  assert(afterSuccessTmpCount === beforeTmpCount, `Zero temporary audio files lingering after SUCCESS execution (Delta: ${afterSuccessTmpCount - beforeTmpCount})`);

  // 2. Failure path (corrupted audio payload that fails during conversion)
  let failed = false;
  try {
    const corruptBuffer = Buffer.from('NOT_A_VALID_AUDIO_PAYLOAD_AT_ALL_CORRUPT_BYTES');
    await provider.transcribe(corruptBuffer, 'audio/wav', { traceId: 'test-trace-clean-fail' });
  } catch {
    failed = true;
  }

  assert(failed, 'Corrupt audio transcription appropriately failed');
  const afterFailureTmpCount = getLingeringTmpFiles().length;
  assert(afterFailureTmpCount === beforeTmpCount, `Zero temporary audio files lingering after FAILURE execution (Delta: ${afterFailureTmpCount - beforeTmpCount})`);

  // Cleanup fixture
  try { fs.unlinkSync(sampleWavPath); } catch {}
})();

// TEST 4: Portable Configuration & Model Directory Override
console.log('\n[TEST-P0-04-D] Portable Configuration & Model Directory Override');
await (async () => {
  const customModelDir = path.join(os.tmpdir(), 'custom_whisper_cache');
  if (!fs.existsSync(customModelDir)) {
    fs.mkdirSync(customModelDir, { recursive: true });
  }

  const configuredProvider = new WhisperSpeechToTextProvider({
    pythonPath: PYTHON_BIN,
    ffmpegPath: FFMPEG_BIN,
    modelDir: customModelDir,
    model: 'base'
  });

  const health = await configuredProvider.checkHealth();
  assert(health.healthy === true, `Healthcheck reports provider is healthy with configured paths (pythonFound: ${health.pythonFound}, scriptFound: ${health.scriptFound})`);
  assert(health.model === 'base', `Configured model matches: ${health.model}`);

  try { fs.rmdirSync(customModelDir); } catch {}
})();

console.log('\n================================================================');
console.log(`P0-04 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
