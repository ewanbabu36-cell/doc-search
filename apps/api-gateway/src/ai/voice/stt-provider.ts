import { AppError, createLogger, type ClinicalSafetyReport } from '@docsearch/shared-core';
import { env } from '../../config/env.js';

const logger = createLogger('stt-provider');

export interface SttTranscriptionResult {
  transcript: string;
  confidence: number;
  durationSeconds: number;
  language?: string;
  provider: string;
  providerVersion: string;
  latencyMs: number;
  clinicalSafety?: ClinicalSafetyReport | undefined;
}

export interface SpeechToTextProvider {
  name: string;
  version: string;
  transcribe(audio: Buffer, mimeType: string, options?: { traceId?: string }): Promise<SttTranscriptionResult>;
}

/**
 * Deterministic Mock Speech-to-Text Provider for non-flaky test execution and offline environments.
 */
export class MockSpeechToTextProvider implements SpeechToTextProvider {
  name = 'mock-stt-provider';
  version = '1.0.0';

  private customTranscript: string | null = null;
  private shouldFail = false;
  private failureError: Error | null = null;
  private delayMs = 15;

  setCustomTranscript(transcript: string | null): void {
    this.customTranscript = transcript;
  }

  setSimulatedFailure(shouldFail: boolean, error?: Error): void {
    this.shouldFail = shouldFail;
    this.failureError = error || new Error('502 Bad Gateway from upstream STT cluster');
  }

  setDelayMs(delay: number): void {
    this.delayMs = delay;
  }

  async transcribe(
    audio: Buffer,
    _mimeType: string,
    options: { traceId?: string } = {}
  ): Promise<SttTranscriptionResult> {
    const startTime = Date.now();

    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.shouldFail) {
      logger.error('Mock STT provider simulated failure triggered', {
        traceId: options.traceId,
        error: this.failureError?.message
      });
      throw AppError.internal(this.failureError?.message || 'STT transcription service failed');
    }

    // Inspect if the audio buffer embeds a text string (e.g. from test cases)
    let transcriptText = this.customTranscript;
    if (!transcriptText) {
      const asciiSample = audio.subarray(0, 1024).toString('utf8');
      const marker = 'TRANSCRIPT_PAYLOAD:';
      const markerIdx = asciiSample.indexOf(marker);
      if (markerIdx !== -1) {
        const extracted = asciiSample.slice(markerIdx + marker.length).split('\0')[0]?.trim();
        if (extracted) {
          transcriptText = extracted;
        }
      }
    }

    if (!transcriptText) {
      transcriptText = 'Summarize clinical encounter notes';
    }

    const latencyMs = Date.now() - startTime;
    return {
      transcript: transcriptText,
      confidence: 0.98,
      durationSeconds: Math.max(1, Math.round(audio.length / 16000)),
      language: 'en-US',
      provider: this.name,
      providerVersion: this.version,
      latencyMs
    };
  }
}

/**
 * Cloud Speech-to-Text Provider Adapter (Google Cloud / Whisper / AWS).
 */
export class ExternalSpeechToTextProvider implements SpeechToTextProvider {
  name: string;
  version = '2.0.0';
  private apiKey: string;
  private endpointUrl: string;

  constructor(providerName: string, apiKey?: string, endpointUrl?: string) {
    this.name = providerName;
    this.apiKey = apiKey || '';
    this.endpointUrl = endpointUrl || '';
  }

  async transcribe(
    audio: Buffer,
    mimeType: string,
    options: { traceId?: string } = {}
  ): Promise<SttTranscriptionResult> {
    const startTime = Date.now();

    if (!this.apiKey && !this.endpointUrl) {
      if (process.env['ALLOW_MOCK_VOICE'] === 'true' || process.env['NODE_ENV'] === 'test') {
        logger.warn('External STT provider credentials missing; test/mock mode active');
        const fallback = new MockSpeechToTextProvider();
        return fallback.transcribe(audio, mimeType, options);
      }
      logger.error('External STT provider credentials missing in production mode');
      throw AppError.internal('External STT provider credentials missing. Live audio transcription requires a valid API key.');
    }

    try {
      const endpoint = this.endpointUrl || 'https://api.openai.com/v1/audio/transcriptions';
      const formData = new FormData();
      const blob = new Blob([audio], { type: mimeType || 'audio/wav' });
      formData.append('file', blob, 'audio.wav');
      formData.append('model', 'whisper-1');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`STT Provider HTTP ${response.status}: ${errText}`);
      }

      const json = (await response.json()) as { text?: string; language?: string };
      const transcript = json.text || 'Processed external speech transcription';
      const latencyMs = Date.now() - startTime;

      return {
        transcript,
        confidence: 0.96,
        durationSeconds: Math.max(1, Math.round(audio.length / 16000)),
        language: json.language || 'en-US',
        provider: this.name,
        providerVersion: this.version,
        latencyMs
      };
    } catch (err: any) {
      logger.error('External STT provider call failed', {
        provider: this.name,
        traceId: options.traceId,
        error: err.message
      });
      throw AppError.internal(`Speech-to-Text service failure: ${err.message}`);
    }
  }
}

export { WhisperSpeechToTextProvider } from './whisper-stt-provider.js';
import { WhisperSpeechToTextProvider } from './whisper-stt-provider.js';

// Global active STT provider
let customSttProvider: SpeechToTextProvider | null = null;
let defaultWhisperProvider: WhisperSpeechToTextProvider | null = null;

export function getSttProvider(): SpeechToTextProvider {
  if (customSttProvider) {
    return customSttProvider;
  }

  // Self-hosted OpenAI Whisper (Local)
  if (
    env.STT_PROVIDER === 'SELF_HOSTED_WHISPER' ||
    env.STT_PROVIDER === 'WHISPER_LOCAL' ||
    (!env.STT_PROVIDER && process.env['ALLOW_MOCK_VOICE'] !== 'true')
  ) {
    if (!defaultWhisperProvider) {
      defaultWhisperProvider = new WhisperSpeechToTextProvider();
    }
    return defaultWhisperProvider;
  }

  // External Cloud STT
  if (env.STT_PROVIDER === 'OPENAI_WHISPER' || env.STT_PROVIDER === 'GOOGLE_CLOUD_SPEECH' || env.STT_PROVIDER === 'AWS_TRANSCRIBE') {
    return new ExternalSpeechToTextProvider(env.STT_PROVIDER, env.STT_PROVIDER_API_KEY, env.STT_PROVIDER_URL);
  }

  // Deterministic Mock fallback for tests
  if (process.env['ALLOW_MOCK_VOICE'] === 'true' || process.env['NODE_ENV'] === 'test') {
    return new MockSpeechToTextProvider();
  }

  if (!defaultWhisperProvider) {
    defaultWhisperProvider = new WhisperSpeechToTextProvider();
  }
  return defaultWhisperProvider;
}

export function setSttProvider(provider: SpeechToTextProvider | null): void {
  customSttProvider = provider;
}

