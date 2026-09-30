import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import type { SpeechToTextProvider, SttTranscriptionResult } from './stt-provider.js';
import { env } from '../../config/env.js';

const logger = createLogger('whisper-stt-provider');

export interface WhisperSttConfig {
  model?: string;
  device?: string;
  language?: string;
  timeoutSeconds?: number;
  maxConcurrency?: number;
  maxQueueDepth?: number;
  pythonPath?: string;
  ffmpegPath?: string;
  modelDir?: string;
}

interface QueuedTask<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  enqueuedAt: number;
}

/**
 * Production-ready Self-Hosted OpenAI Whisper Speech-to-Text Provider.
 * Features:
 * - Local Python subprocess execution with structured JSON protocol
 * - Concurrency gating and FIFO task queuing (prevents process/CPU exhaustion)
 * - Zero-retention audio lifecycle (unlinked immediately in finally blocks)
 * - Strict PHI privacy shielding (zero plaintext audio/transcript logging)
 * - Portable discovery of system FFmpeg, Python, and model directory
 */
export class WhisperSpeechToTextProvider implements SpeechToTextProvider {
  readonly name = 'self-hosted-whisper';
  readonly version = '1.0.0';

  private readonly model: string;
  private readonly device: string;
  private readonly language: string;
  private readonly timeoutSeconds: number;
  private readonly maxConcurrency: number;
  private readonly maxQueueDepth: number;
  private readonly pythonPath: string;
  private readonly ffmpegPath: string;
  private readonly modelDir?: string;
  private readonly scriptPath: string;

  private activeWorkers = 0;
  private taskQueue: QueuedTask<SttTranscriptionResult>[] = [];

  constructor(config: WhisperSttConfig = {}) {
    this.model = config.model || (env as any).WHISPER_MODEL || 'base';
    this.device = config.device || (env as any).WHISPER_DEVICE || 'auto';
    this.language = config.language || (env as any).WHISPER_LANGUAGE || 'auto';
    this.timeoutSeconds = config.timeoutSeconds || (env as any).WHISPER_TIMEOUT_SECONDS || 300;
    this.maxConcurrency = config.maxConcurrency || (env as any).WHISPER_MAX_CONCURRENCY || 1;
    this.maxQueueDepth = config.maxQueueDepth || 10;
    this.modelDir = config.modelDir || (env as any).WHISPER_MODEL_DIR;

    this.pythonPath = this.resolvePythonPath(config.pythonPath || (env as any).WHISPER_PYTHON_PATH);
    this.ffmpegPath = this.resolveFfmpegPath(config.ffmpegPath || (env as any).WHISPER_FFMPEG_PATH);
    this.scriptPath = this.resolveScriptPath();

    logger.info('Initialized self-hosted Whisper STT provider', {
      model: this.model,
      device: this.device,
      language: this.language,
      maxConcurrency: this.maxConcurrency,
      pythonPath: this.pythonPath,
      ffmpegConfigured: !!this.ffmpegPath,
      modelDirConfigured: !!this.modelDir
    });
  }

  private resolveScriptPath(): string {
    const candidates = [
      path.resolve(process.cwd(), 'scripts/whisper_transcribe.py'),
      path.resolve(process.cwd(), 'apps/api-gateway/scripts/whisper_transcribe.py')
    ];
    for (const c of candidates) {
      if (fsSync.existsSync(c)) {
        return c;
      }
    }
    return candidates[0]!;
  }

  private resolvePythonPath(configured?: string): string {
    if (configured && fsSync.existsSync(configured)) {
      return configured;
    }

    const envPython = process.env['WHISPER_PYTHON_PATH'] || process.env['PYTHON_PATH'];
    if (envPython && fsSync.existsSync(envPython)) {
      return envPython;
    }

    if (process.platform === 'win32') {
      const localAppData = process.env['LOCALAPPDATA'];
      const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
      const standardWinCandidates: string[] = [];

      if (localAppData) {
        const pyProgramsDir = path.join(localAppData, 'Programs', 'Python');
        if (fsSync.existsSync(pyProgramsDir)) {
          try {
            const versions = fsSync.readdirSync(pyProgramsDir);
            for (const v of versions) {
              standardWinCandidates.push(path.join(pyProgramsDir, v, 'python.exe'));
            }
          } catch {
            // Ignore directory read errors
          }
        }

        const pyCoreDir = path.join(localAppData, 'Python');
        if (fsSync.existsSync(pyCoreDir)) {
          try {
            const versions = fsSync.readdirSync(pyCoreDir);
            for (const v of versions) {
              standardWinCandidates.push(path.join(pyCoreDir, v, 'python.exe'));
            }
          } catch {
            // Ignore directory read errors
          }
        }
      }

      standardWinCandidates.push(
        path.join(programFiles, 'Python312', 'python.exe'),
        path.join(programFiles, 'Python311', 'python.exe'),
        path.join(programFiles, 'Python310', 'python.exe'),
        'C:\\Python312\\python.exe',
        'C:\\Python311\\python.exe'
      );

      for (const candidate of standardWinCandidates) {
        if (fsSync.existsSync(candidate)) {
          return candidate;
        }
      }
    } else {
      const posixCandidates = [
        '/usr/bin/python3',
        '/usr/local/bin/python3',
        '/opt/homebrew/bin/python3'
      ];
      for (const candidate of posixCandidates) {
        if (fsSync.existsSync(candidate)) {
          return candidate;
        }
      }
    }

    return process.platform === 'win32' ? 'python' : 'python3';
  }

  private resolveFfmpegPath(configured?: string): string {
    if (configured && fsSync.existsSync(configured)) {
      return configured;
    }

    const envFfmpeg = process.env['WHISPER_FFMPEG_PATH'] || process.env['FFMPEG_PATH'];
    if (envFfmpeg && fsSync.existsSync(envFfmpeg)) {
      return envFfmpeg;
    }

    if (process.platform === 'win32') {
      const localAppData = process.env['LOCALAPPDATA'];
      const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
      const standardWinCandidates: string[] = [
        path.join(programFiles, 'ffmpeg', 'bin'),
        'C:\\ffmpeg\\bin'
      ];

      if (localAppData) {
        const wingetDir = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
        if (fsSync.existsSync(wingetDir)) {
          try {
            const entries = fsSync.readdirSync(wingetDir);
            for (const entry of entries) {
              if (entry.toLowerCase().includes('ffmpeg')) {
                const fullPkg = path.join(wingetDir, entry);
                if (fsSync.existsSync(fullPkg)) {
                  const subEntries = fsSync.readdirSync(fullPkg);
                  for (const sub of subEntries) {
                    const candidateBin = path.join(fullPkg, sub, 'bin');
                    if (fsSync.existsSync(path.join(candidateBin, 'ffmpeg.exe'))) {
                      standardWinCandidates.unshift(candidateBin);
                    }
                  }
                }
              }
            }
          } catch {
            // Ignore directory read errors
          }
        }
      }

      for (const candidate of standardWinCandidates) {
        if (fsSync.existsSync(candidate)) {
          return candidate;
        }
      }
    } else {
      const posixCandidates = [
        '/usr/bin',
        '/usr/local/bin',
        '/opt/homebrew/bin'
      ];
      for (const candidate of posixCandidates) {
        if (fsSync.existsSync(path.join(candidate, 'ffmpeg'))) {
          return candidate;
        }
      }
    }

    return '';
  }

  /**
   * Main entry point conforming to SpeechToTextProvider interface.
   */
  async transcribe(
    audio: Buffer,
    mimeType: string,
    options: { traceId?: string } = {}
  ): Promise<SttTranscriptionResult> {
    if (!audio || audio.length === 0) {
      throw AppError.badRequest('Cannot transcribe empty audio buffer');
    }

    const traceId = options.traceId || crypto.randomUUID();

    // Check queue capacity to prevent memory blowup under heavy load
    if (this.taskQueue.length >= this.maxQueueDepth) {
      logger.warn('Transcription queue rejected request: queue capacity reached', {
        traceId,
        queueLength: this.taskQueue.length,
        maxQueueDepth: this.maxQueueDepth
      });
      throw AppError.rateLimit(
        'Speech transcription service is currently under peak load. Please try again shortly.'
      );
    }

    // Wrap execution in concurrency semaphore queue
    return new Promise<SttTranscriptionResult>((resolve, reject) => {
      this.taskQueue.push({
        id: traceId,
        execute: () => this.executeTranscription(audio, mimeType, traceId),
        resolve,
        reject,
        enqueuedAt: Date.now()
      });
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.activeWorkers >= this.maxConcurrency || this.taskQueue.length === 0) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) return;

    this.activeWorkers++;

    task
      .execute()
      .then((res) => task.resolve(res))
      .catch((err) => task.reject(err))
      .finally(() => {
        this.activeWorkers--;
        this.processQueue();
      });
  }

  /**
   * Isolated transcription execution with strict file lifecycle management.
   */
  private async executeTranscription(
    audio: Buffer,
    mimeType: string,
    traceId: string
  ): Promise<SttTranscriptionResult> {
    const startTime = Date.now();
    const extension = this.getExtensionForMimeType(mimeType);
    const tempFileName = `docsearch_stt_${crypto.randomUUID()}${extension}`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    try {
      // 1. Write audio payload to restricted temporary file
      await fs.writeFile(tempFilePath, audio, { mode: 0o600 });

      // 2. Spawn Python subprocess with controlled environment
      const args = [
        this.scriptPath,
        '--audio',
        tempFilePath,
        '--model',
        this.model,
        '--device',
        this.device
      ];

      if (this.modelDir) {
        args.push('--model-dir', this.modelDir);
      }

      if (this.language && this.language.toLowerCase() !== 'auto') {
        args.push('--language', this.language.toLowerCase());
      }

      const clinicalPrompt =
        'Clinical consultation in Hindi and Hinglish: bukhar, dard, saans, ulti, BP, SpO2, sugar, fasting, Dolo 650, Telmisartan 40 mg, Pantoprazole 40 mg, Augmentin 625 Duo, Azithromycin 500 mg, Glycomet 500 mg, Montair-LC, Pan 40, Calpol 650.';
      args.push('--prompt', clinicalPrompt);

      // Build process environment with FFmpeg in PATH
      const envPath = this.ffmpegPath
        ? `${this.ffmpegPath}${path.delimiter}${process.env['PATH'] || ''}`
        : process.env['PATH'] || '';

      const childEnv: NodeJS.ProcessEnv = {
        ...process.env,
        PATH: envPath,
        PYTHONIOENCODING: 'utf-8',
        WHISPER_MODEL: this.model,
        WHISPER_DEVICE: this.device,
        ...(this.modelDir ? { WHISPER_MODEL_DIR: this.modelDir } : {})
      };

      const result = await this.spawnSubprocess(this.pythonPath, args, childEnv, traceId);

      const latencyMs = Date.now() - startTime;

      // 3. Healthcare privacy check: Log metadata ONLY, never raw audio or transcript
      logger.info('Speech-to-Text transcription completed', {
        traceId,
        provider: this.name,
        model: result.model || this.model,
        device: result.device || this.device,
        detectedLanguage: result.language,
        durationSeconds: result.durationSeconds,
        confidence: result.confidence,
        latencyMs
      });

      return {
        transcript: result.transcript,
        confidence: result.confidence ?? 0.95,
        durationSeconds: result.durationSeconds || Math.max(1, Math.round(audio.length / 16000)),
        language: result.language || 'en',
        provider: this.name,
        providerVersion: this.version,
        latencyMs
      };
    } catch (err: any) {
      logger.error('Speech-to-Text transcription execution failed', {
        traceId,
        error: err?.message || String(err),
        stack: err?.stack
      });

      if (err instanceof AppError) {
        throw new AppError({
          message: this.sanitizeErrorMessage(err.message),
          code: err.code,
          statusCode: err.statusCode
        });
      }

      throw AppError.internal('Speech transcription service failed to process audio payload.');
    } finally {
      // 4. Guaranteed zero-retention temp file cleanup with retry
      try {
        if (fsSync.existsSync(tempFilePath)) {
          await fs.unlink(tempFilePath);
        }
      } catch (cleanupErr: any) {
        try {
          await new Promise((r) => setTimeout(r, 100));
          if (fsSync.existsSync(tempFilePath)) {
            await fs.unlink(tempFilePath);
          }
        } catch {
          logger.warn('Failed to unlink temporary STT audio file after retry', {
            traceId,
            error: cleanupErr.message
          });
        }
      }
    }
  }

  private spawnSubprocess(
    executable: string,
    args: string[],
    childEnv: NodeJS.ProcessEnv,
    traceId: string
  ): Promise<{
    transcript: string;
    language: string;
    durationSeconds: number;
    confidence: number;
    model: string;
    device: string;
  }> {
    return new Promise((resolve, reject) => {
      let stdoutData = '';
      let stderrData = '';
      let isSettled = false;

      const child = spawn(executable, args, {
        env: childEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      });

      // Strict execution timeout
      const timeoutMs = this.timeoutSeconds * 1000;
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            child.kill('SIGKILL');
          } catch {
            // Ignore kill errors if already terminated
          }
          reject(
            new AppError({
              message: `Whisper transcription worker exceeded maximum timeout of ${this.timeoutSeconds}s`,
              code: ErrorCode.GATEWAY_TIMEOUT,
              statusCode: 504
            })
          );
        }
      }, timeoutMs);

      child.stdout.setEncoding('utf-8');
      child.stdout.on('data', (chunk) => {
        stdoutData += chunk;
      });

      child.stderr.setEncoding('utf-8');
      child.stderr.on('data', (chunk) => {
        stderrData += chunk;
      });

      child.on('error', (err) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          logger.error('Failed to spawn Whisper worker process', {
            traceId,
            error: err.message
          });
          reject(
            new AppError({
              message: 'Failed to initiate speech transcription subprocess.',
              code: ErrorCode.INTERNAL_SERVER_ERROR,
              statusCode: 500
            })
          );
        }
      });

      child.on('close', (code) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);

        if (code !== 0) {
          logger.error('Whisper worker process exited with non-zero code', {
            traceId,
            exitCode: code,
            stderrSummary: stderrData.slice(-500)
          });
          return reject(
            new AppError({
              message: 'Speech transcription worker failed during audio processing.',
              code: ErrorCode.INTERNAL_SERVER_ERROR,
              statusCode: 500
            })
          );
        }

        try {
          // Parse stdout output. Locate last valid JSON string if extraneous logs exist
          const jsonStart = stdoutData.lastIndexOf('{');
          const jsonEnd = stdoutData.lastIndexOf('}');
          if (jsonStart === -1 || jsonEnd === -1) {
            logger.error('Whisper worker produced invalid non-JSON output format', {
              traceId,
              stdoutSummary: stdoutData.slice(0, 300)
            });
            return reject(
              new AppError({
                message: 'Speech transcription worker returned invalid response format.',
                code: ErrorCode.INTERNAL_SERVER_ERROR,
                statusCode: 500
              })
            );
          }

          const jsonPayload = stdoutData.slice(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(jsonPayload);

          if (!parsed.success) {
            logger.error('Whisper transcription worker returned error payload', {
              traceId,
              code: parsed.code,
              error: parsed.error
            });
            return reject(
              new AppError({
                message: 'Speech transcription processing failed.',
                code: ErrorCode.INTERNAL_SERVER_ERROR,
                statusCode: 500
              })
            );
          }

          resolve({
            transcript: (parsed.transcript || '').trim(),
            language: parsed.language || 'en',
            durationSeconds: parsed.durationSeconds || 0,
            confidence: parsed.confidence || 0.95,
            model: parsed.model || this.model,
            device: parsed.device || this.device
          });
        } catch (parseErr: any) {
          logger.error('Failed to parse Whisper response', {
            traceId,
            error: parseErr.message
          });
          reject(
            new AppError({
              message: 'Speech transcription response parsing failed.',
              code: ErrorCode.INTERNAL_SERVER_ERROR,
              statusCode: 500
            })
          );
        }
      });
    });
  }

  private sanitizeErrorMessage(msg: string): string {
    if (!msg) {
      return 'Speech transcription service encountered an error.';
    }
    if (
      msg.includes('\\') ||
      msg.includes('/') ||
      msg.toLowerCase().includes('traceback') ||
      msg.toLowerCase().includes('error:') ||
      msg.includes('.py') ||
      msg.includes('.exe') ||
      msg.toLowerCase().includes('users') ||
      msg.toLowerCase().includes('home')
    ) {
      return 'Speech transcription service failed to process audio payload.';
    }
    return msg;
  }

  private getExtensionForMimeType(mimeType: string): string {
    const lower = mimeType.toLowerCase();
    if (lower.includes('wav')) return '.wav';
    if (lower.includes('webm')) return '.webm';
    if (lower.includes('ogg')) return '.ogg';
    if (lower.includes('mp3') || lower.includes('mpeg')) return '.mp3';
    if (lower.includes('m4a') || lower.includes('mp4')) return '.m4a';
    if (lower.includes('aac')) return '.aac';
    return '.wav';
  }

  /**
   * Diagnostic check confirming worker script & Python runtime availability.
   */
  async checkHealth(): Promise<{ healthy: boolean; pythonFound: boolean; scriptFound: boolean; model: string }> {
    const pythonFound = fsSync.existsSync(this.pythonPath) || this.pythonPath === 'python' || this.pythonPath === 'python3';
    const scriptFound = fsSync.existsSync(this.scriptPath);
    return {
      healthy: pythonFound && scriptFound,
      pythonFound,
      scriptFound,
      model: this.model
    };
  }
}
