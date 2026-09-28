/**
 * DOC SEARCH - P0-02 Benchmark Runner
 * Measures empirical WER, CER, entity accuracy, numeric accuracy, and latency
 * across Baseline and Candidate models on the same representative clinical corpus.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  P0_02_CORPUS_ITEMS,
  generateCorpusAudio,
  computeWER,
  computeCER,
  normalizeTokens
} from './p0-02-clinical-corpus.mjs';

const PYTHON_BIN = 'C:\\Users\\alamr\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe';
const SCRIPT_PATH = path.resolve('apps/api-gateway/scripts/whisper_transcribe.py');
const AUDIO_DIR = path.join(os.tmpdir(), 'docsearch_p0_02_corpus');

// Auto-inject known FFmpeg binary
const FFMPEG_BIN = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-9.0.1-full_build', 'bin')
  : '';
if (FFMPEG_BIN && fs.existsSync(FFMPEG_BIN)) {
  process.env.PATH = `${FFMPEG_BIN}${path.delimiter}${process.env.PATH}`;
}

console.log('================================================================');
console.log('DOC SEARCH: P0-02 HINDI / HINGLISH STT BENCHMARK SUITE');
console.log('================================================================\n');

// 1. Generate audio corpus fixtures
console.log('[1/4] Preparing synthetic clinical audio corpus (31 items)...');
generateCorpusAudio(AUDIO_DIR);
console.log(`  Audio fixtures ready in: ${AUDIO_DIR}\n`);

// Helper to run transcription via python subprocess worker
function runWhisperWorker(audioPath, options = {}) {
  const args = [
    SCRIPT_PATH,
    '--audio', audioPath,
    '--model', options.model || 'base',
    '--device', options.device || 'cpu',
    '--language', options.language || 'auto',
    '--temperature', '0.0'
  ];

  if (options.prompt) {
    args.push('--prompt', options.prompt);
  }

  const startTime = Date.now();
  const res = spawnSync(PYTHON_BIN, args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, WHISPER_FFMPEG_PATH: FFMPEG_BIN }
  });
  const wallLatencyMs = Date.now() - startTime;

  if (res.status !== 0) {
    throw new Error(`Worker exited with status ${res.status}: ${res.stderr || res.stdout}`);
  }

  try {
    const parsed = JSON.parse(res.stdout);
    return {
      ...parsed,
      wallLatencyMs
    };
  } catch (err) {
    throw new Error(`Failed to parse worker output: ${res.stdout}`);
  }
}

// Evaluation engine
export async function evaluateConfiguration(configName, options = {}) {
  console.log(`----------------------------------------------------------------`);
  console.log(`BENCHMARK RUN: [${configName}]`);
  console.log(`Options: model=${options.model || 'base'}, lang=${options.language || 'auto'}, prompted=${Boolean(options.prompt)}`);
  console.log(`----------------------------------------------------------------`);

  const results = [];
  let totalLatencyMs = 0;

  for (let i = 0; i < P0_02_CORPUS_ITEMS.length; i++) {
    const item = P0_02_CORPUS_ITEMS[i];
    const audioPath = item.audioPath || path.join(AUDIO_DIR, `${item.id}.wav`);

    const sttResult = runWhisperWorker(audioPath, options);
    const transcript = sttResult.transcript || '';
    const detectedLang = sttResult.language || 'unknown';
    const latency = sttResult.wallLatencyMs || 0;
    totalLatencyMs += latency;

    const wer = computeWER(item.groundTruth, transcript);
    const cer = computeCER(item.groundTruth, transcript);

    // Evaluate expected medicine preservation
    let medPreserved = 0;
    for (const med of item.expectedMedicines) {
      if (transcript.toLowerCase().includes(med.toLowerCase())) {
        medPreserved++;
      }
    }
    const medAcc = item.expectedMedicines.length === 0 ? 1.0 : medPreserved / item.expectedMedicines.length;

    // Evaluate numeric preservation
    let numPreserved = 0;
    const hypTokens = normalizeTokens(transcript);
    for (const num of item.expectedNumerics) {
      if (hypTokens.includes(num.toLowerCase()) || transcript.includes(num)) {
        numPreserved++;
      }
    }
    const numAcc = item.expectedNumerics.length === 0 ? 1.0 : numPreserved / item.expectedNumerics.length;

    // Evaluate critical clinical terms preservation
    let termsPreserved = 0;
    for (const term of item.criticalTerms) {
      // Check if term words appear in transcript
      const words = term.toLowerCase().split(/\s+/);
      const allFound = words.every((w) => transcript.toLowerCase().includes(w));
      if (allFound) {
        termsPreserved++;
      }
    }
    const termAcc = item.criticalTerms.length === 0 ? 1.0 : termsPreserved / item.criticalTerms.length;

    results.push({
      item,
      transcript,
      detectedLang,
      latency,
      wer,
      cer,
      medAcc,
      numAcc,
      termAcc
    });

    const mark = wer < 0.20 ? '[OK]' : '[ERR]';
    console.log(`  ${mark} ${item.id} (${item.language}): WER=${(wer * 100).toFixed(1)}% | CER=${(cer * 100).toFixed(1)}% | Latency=${latency}ms | Lang=${detectedLang}`);
    console.log(`     REF: "${item.groundTruth}"`);
    console.log(`     HYP: "${transcript}"\n`);
  }

  // Aggregate metrics by language
  const filterByLang = (lang) => results.filter((r) => r.item.language === lang);
  const avg = (arr, key) => (arr.length === 0 ? 0 : arr.reduce((acc, x) => acc + x[key], 0) / arr.length);

  const hiResults = filterByLang('HINDI');
  const hinglishResults = filterByLang('HINGLISH');
  const enResults = filterByLang('ENGLISH');

  const report = {
    configName,
    options,
    itemCount: results.length,
    hindiWER: avg(hiResults, 'wer'),
    hindiCER: avg(hiResults, 'cer'),
    hinglishWER: avg(hinglishResults, 'wer'),
    hinglishCER: avg(hinglishResults, 'cer'),
    englishWER: avg(enResults, 'wer'),
    englishCER: avg(enResults, 'cer'),
    medicineAccuracy: avg(results, 'medAcc'),
    numericAccuracy: avg(results, 'numAcc'),
    clinicalTermAccuracy: avg(results, 'termAcc'),
    avgLatencyMs: Math.round(totalLatencyMs / results.length),
    results
  };

  console.log(`================================================================`);
  console.log(`SUMMARY FOR [${configName}]:`);
  console.log(`  Hindi WER:               ${(report.hindiWER * 100).toFixed(2)}%`);
  console.log(`  Hindi CER:               ${(report.hindiCER * 100).toFixed(2)}%`);
  console.log(`  Hinglish WER:            ${(report.hinglishWER * 100).toFixed(2)}%`);
  console.log(`  Hinglish CER:            ${(report.hinglishCER * 100).toFixed(2)}%`);
  console.log(`  English Regression WER:  ${(report.englishWER * 100).toFixed(2)}%`);
  console.log(`  Medicine Entity Acc:     ${(report.medicineAccuracy * 100).toFixed(2)}%`);
  console.log(`  Numeric Accuracy:        ${(report.numericAccuracy * 100).toFixed(2)}%`);
  console.log(`  Clinical Term Acc:       ${(report.clinicalTermAccuracy * 100).toFixed(2)}%`);
  console.log(`  Average Latency:         ${report.avgLatencyMs}ms`);
  console.log(`================================================================\n`);

  return report;
}

// Run benchmarks
const mode = process.argv[2] || 'ALL';

async function main() {
  const reports = {};

  if (mode === 'ALL' || mode === 'BASELINE') {
    // 1. Current Baseline: base model, auto language, unprompted
    reports.baseline = await evaluateConfiguration('CURRENT_BASELINE_WHISPER_BASE_UNPROMPTED', {
      model: 'base',
      language: 'auto',
      prompt: ''
    });
  }

  if (mode === 'ALL' || mode === 'PROMPTED_BASE') {
    // 2. Candidate A: base model with Indian clinical vocabulary prompt
    reports.promptedBase = await evaluateConfiguration('CANDIDATE_A_WHISPER_BASE_CLINICAL_PROMPTED', {
      model: 'base',
      language: 'auto',
      prompt: 'Clinical consultation in Hindi and Hinglish: bukhar, dard, saans, ulti, BP, SpO2, sugar, fasting, Dolo 650, Telmisartan 40 mg, Pantoprazole 40 mg, Augmentin 625 Duo, Azithromycin 500 mg, Glycomet 500 mg, Montair-LC, Pan 40, Calpol 650.'
    });
  }

  if (mode === 'ALL' || mode === 'TURBO_PROMPTED') {
    // 3. Candidate B: large-v3-turbo with Indian clinical vocabulary prompt
    reports.turboPrompted = await evaluateConfiguration('CANDIDATE_B_WHISPER_LARGE_V3_TURBO_PROMPTED', {
      model: 'large-v3-turbo',
      language: 'auto',
      prompt: 'Clinical medical dictation in Hindi and Hinglish: bukhar, dard, saans lene me dikkat, BP 140/90, SpO2 96%, sugar fasting 126, Dolo 650, Telmisartan 40 mg, Pantoprazole 40 mg, Augmentin 625 Duo, Azithromycin 500 mg, Glycomet 500 mg, Montair-LC, Pan 40, Calpol 650.'
    });
  }

  // Save full raw benchmark report JSON
  const benchmarkOutputPath = path.join(os.tmpdir(), 'p0_02_benchmark_results.json');
  fs.writeFileSync(benchmarkOutputPath, JSON.stringify(reports, null, 2), 'utf8');
  console.log(`Complete empirical benchmark results saved to: ${benchmarkOutputPath}`);
}

main().catch((err) => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});
