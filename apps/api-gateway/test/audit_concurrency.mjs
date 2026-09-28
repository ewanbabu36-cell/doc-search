import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { WhisperSpeechToTextProvider } from '../dist/ai/voice/whisper-stt-provider.js';

const FFMPEG_BIN = process.env.WHISPER_FFMPEG_PATH || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-9.0.1-full_build', 'bin') : '');
if (FFMPEG_BIN && fs.existsSync(FFMPEG_BIN)) {
  process.env.PATH = `${FFMPEG_BIN}${path.delimiter}${process.env.PATH}`;
}

const TEMP_DIR = path.join(os.tmpdir(), 'docsearch_concurrency_audit');
fs.mkdirSync(TEMP_DIR, { recursive: true });

const fixtureWav = path.join(TEMP_DIR, 'bench_sample.wav');
const speechScript = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('${fixtureWav.replace(/\\/g, '\\\\')}'); $s.Speak('Patient vitals normal.'); $s.Dispose();`;
execSync(`powershell -Command "${speechScript}"`);
const audioBuffer = fs.readFileSync(fixtureWav);

console.log('================================================================');
console.log('AUDIT SECTION 9: CONCURRENCY, QUEUE & LOAD CAPACITY AUDIT');
console.log('================================================================\n');

async function testConcurrencyTier(name, count, provider) {
  console.log(`--- Testing Tier: ${name} (${count} concurrent requests) ---`);
  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < count; i++) {
    const reqId = `req_${i + 1}`;
    const p = (async () => {
      const t0 = Date.now();
      try {
        const res = await provider.transcribe(audioBuffer, 'audio/wav', { traceId: reqId });
        const latency = Date.now() - t0;
        return { id: reqId, status: 'SUCCESS', latencyMs: latency, transcript: res.transcript };
      } catch (err) {
        const latency = Date.now() - t0;
        return { id: reqId, status: 'REJECTED_OR_FAILED', latencyMs: latency, error: err.message, code: err.code || err.statusCode };
      }
    })();
    promises.push(p);
  }

  const results = await Promise.all(promises);
  const totalElapsed = Date.now() - startTime;
  const successes = results.filter(r => r.status === 'SUCCESS');
  const failures = results.filter(r => r.status !== 'SUCCESS');
  const avgLatency = successes.length ? Math.round(successes.reduce((a, b) => a + b.latencyMs, 0) / successes.length) : 0;

  console.log(`  Total Batch Duration: ${totalElapsed}ms`);
  console.log(`  Successful: ${successes.length}/${count}, Rejected/Failed: ${failures.length}/${count}`);
  console.log(`  Average Request Latency: ${avgLatency}ms`);
  if (failures.length > 0) {
    console.log(`  Failure Sample: [${failures[0].code}] ${failures[0].error}`);
  }
  console.log('');
  return { tier: name, count, totalElapsed, successes: successes.length, failures: failures.length, avgLatency };
}

async function main() {
  // Provider with maxConcurrency = 1, maxQueueDepth = 4
  const provider = new WhisperSpeechToTextProvider({
    model: 'base',
    device: 'cpu',
    maxConcurrency: 1,
    maxQueueDepth: 4
  });

  // 1. Single request baseline
  await testConcurrencyTier('Baseline Single Request', 1, provider);

  // 2. 3 concurrent requests (within queue limit)
  await testConcurrencyTier('3 Concurrent Requests', 3, provider);

  // 3. 5 concurrent requests (1 active + 4 in queue = at limit)
  await testConcurrencyTier('5 Concurrent Requests (At Queue Limit)', 5, provider);

  // 4. 8 concurrent requests (exceeds queue limit of 4, should trigger 429 rate limit)
  await testConcurrencyTier('8 Concurrent Requests (Overload 429 Test)', 8, provider);

  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch {}

  console.log('================================================================');
  console.log('CONCURRENCY AUDIT COMPLETE');
  console.log('================================================================\n');
}

main().catch(console.error);
