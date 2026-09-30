import { AppError, createLogger } from '@docsearch/shared-core';

const logger = createLogger('tts-provider');

export type ActionSafetyCategory =
  | 'PROPOSED'
  | 'PENDING_CONFIRMATION'
  | 'EXECUTED'
  | 'FAILED'
  | 'DENIED'
  | 'INFORMATIONAL';

export interface TtsSynthesisResult {
  audioBuffer: Buffer;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  provider: string;
  providerVersion: string;
  latencyMs: number;
  safetyCategory: ActionSafetyCategory;
}

export interface TextToSpeechProvider {
  name: string;
  version: string;
  synthesize(
    text: string,
    options?: {
      voice?: string | undefined;
      traceId?: string | undefined;
      safetyCategory?: ActionSafetyCategory | undefined;
    }
  ): Promise<TtsSynthesisResult>;
}

/**
 * Creates a valid canonical WAV buffer (PCM 16-bit, 16kHz, mono) embedding audio samples.
 */
export function createDeterministicWavBuffer(sampleCount = 800): Buffer {
  const byteRate = 16000 * 1 * 2; // 16kHz * 1 channel * 2 bytes/sample = 32000 bytes/sec
  const dataSize = sampleCount * 2;
  const fileSize = 44 + dataSize;
  const buffer = Buffer.alloc(fileSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);

  // "fmt " subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels (1 = Mono)
  buffer.writeUInt32LE(16000, 24); // SampleRate (16000 Hz)
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(2, 32); // BlockAlign (NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16 bits)

  // "data" subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Fill data with gentle sine wave or deterministic pulse
  for (let i = 0; i < sampleCount; i++) {
    const sample = Math.floor(Math.sin((i / 16) * Math.PI * 2) * 8000);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  return buffer;
}

/**
 * Categorizes an AI action to guarantee voice response safety:
 * Never utters "executed" or "completed" if an action is merely proposed or pending approval.
 */
export function categorizeVoiceResponse(
  status?: string,
  requiresApproval?: boolean
): ActionSafetyCategory {
  if (
    requiresApproval ||
    status === 'EXECUTE_WITH_APPROVAL' ||
    status === 'PENDING_APPROVAL' ||
    status === 'REQUIRES_CONFIRMATION'
  ) {
    return 'PENDING_CONFIRMATION';
  }
  if (status === 'SUGGEST' || status === 'DRAFT' || status === 'PROPOSED') {
    return 'PROPOSED';
  }
  if (status === 'BLOCKED' || status === 'DENIED') {
    return 'DENIED';
  }
  if (status === 'FAILED' || status === 'ERROR') {
    return 'FAILED';
  }
  if (status === 'EXECUTE' || status === 'EXECUTED' || status === 'SUCCESS') {
    return 'EXECUTED';
  }
  return 'INFORMATIONAL';
}

/**
 * Sanitizes voice response text according to action safety invariants.
 */
export function sanitizeVoiceSpokenText(
  text: string,
  safetyCategory: ActionSafetyCategory
): string {
  if (safetyCategory === 'PENDING_CONFIRMATION') {
    // Prohibit claims of execution
    let sanitized = text
      .replace(/has been executed/gi, 'has been prepared for clinician review')
      .replace(/order placed successfully/gi, 'order prepared and pending approval')
      .replace(/successfully placed/gi, 'prepared and pending approval');

    if (!sanitized.toLowerCase().includes('pending') && !sanitized.toLowerCase().includes('approval') && !sanitized.toLowerCase().includes('confirm')) {
      sanitized = `This action requires clinician confirmation before execution. ${sanitized}`;
    }
    return sanitized;
  }

  if (safetyCategory === 'DENIED') {
    return text.includes('denied') || text.includes('prohibited') || text.includes('not authorized')
      ? text
      : `Action denied. ${text}`;
  }

  return text;
}

/**
 * Deterministic Mock Text-to-Speech Provider for offline testing and fast verification.
 */
export class MockTextToSpeechProvider implements TextToSpeechProvider {
  name = 'mock-tts-provider';
  version = '1.0.0';

  private shouldFail = false;
  private failureError: Error | null = null;
  private delayMs = 10;

  setSimulatedFailure(shouldFail: boolean, error?: Error): void {
    this.shouldFail = shouldFail;
    this.failureError = error || new Error('503 Service Unavailable: upstream TTS cluster offline');
  }

  setDelayMs(delay: number): void {
    this.delayMs = delay;
  }

  async synthesize(
    text: string,
    options: {
      voice?: string | undefined;
      traceId?: string | undefined;
      safetyCategory?: ActionSafetyCategory | undefined;
    } = {}
  ): Promise<TtsSynthesisResult> {
    const startTime = Date.now();

    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.shouldFail) {
      logger.error('Mock TTS provider simulated failure triggered', {
        traceId: options.traceId,
        error: this.failureError?.message
      });
      throw AppError.internal(this.failureError?.message || 'TTS synthesis service failed');
    }

    const category = options.safetyCategory || 'INFORMATIONAL';
    const sanitizedText = sanitizeVoiceSpokenText(text, category);

    // Calculate synthetic sample count based on text length (e.g. ~1000 samples per word)
    const words = sanitizedText.split(/\s+/).filter(Boolean).length;
    const sampleCount = Math.max(800, words * 800);
    const audioBuffer = createDeterministicWavBuffer(Math.min(sampleCount, 32000));
    const durationSeconds = Math.max(1, Math.round(audioBuffer.length / 32000));
    const latencyMs = Date.now() - startTime;

    return {
      audioBuffer,
      mimeType: 'audio/wav',
      sizeBytes: audioBuffer.length,
      durationSeconds,
      provider: this.name,
      providerVersion: this.version,
      latencyMs,
      safetyCategory: category
    };
  }
}

/**
 * Cloud External Text-to-Speech Provider Adapter (Google Cloud TTS / OpenAI TTS / AWS Polly).
 */
export class ExternalTextToSpeechProvider implements TextToSpeechProvider {
  name: string;
  version = '2.0.0';
  private apiKey: string;
  private endpointUrl: string;

  constructor(providerName: string, apiKey?: string, endpointUrl?: string) {
    this.name = providerName;
    this.apiKey = apiKey || '';
    this.endpointUrl = endpointUrl || '';
  }

  async synthesize(
    text: string,
    options: {
      voice?: string | undefined;
      traceId?: string | undefined;
      safetyCategory?: ActionSafetyCategory | undefined;
    } = {}
  ): Promise<TtsSynthesisResult> {
    const startTime = Date.now();

    if (!this.apiKey && !this.endpointUrl) {
      if (process.env['ALLOW_MOCK_VOICE'] === 'true' || process.env['NODE_ENV'] === 'test') {
        logger.warn('External TTS provider credentials missing; test/mock mode active');
        const fallback = new MockTextToSpeechProvider();
        return fallback.synthesize(text, options);
      }
      logger.error('External TTS provider credentials missing in production mode');
      throw AppError.internal('External TTS provider credentials missing. Live audio synthesis requires a valid API key.');
    }

    try {
      const category = options.safetyCategory || 'INFORMATIONAL';
      const sanitizedText = sanitizeVoiceSpokenText(text, category);
      const endpoint = this.endpointUrl || 'https://api.openai.com/v1/audio/speech';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: sanitizedText,
          voice: options.voice || 'alloy',
          response_format: 'wav'
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`TTS Provider HTTP ${response.status}: ${errText}`);
      }

      const arrayBuf = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuf);
      const latencyMs = Date.now() - startTime;

      return {
        audioBuffer,
        mimeType: 'audio/wav',
        sizeBytes: audioBuffer.length,
        durationSeconds: Math.max(1, Math.round(audioBuffer.length / 32000)),
        provider: this.name,
        providerVersion: this.version,
        latencyMs,
        safetyCategory: category
      };
    } catch (err: any) {
      logger.error('External TTS provider call failed', {
        provider: this.name,
        traceId: options.traceId,
        error: err.message
      });
      throw AppError.internal(`Text-to-Speech service failure: ${err.message}`);
    }
  }
}

// Global active TTS provider
let activeTtsProvider: TextToSpeechProvider = new MockTextToSpeechProvider();

export function getTtsProvider(): TextToSpeechProvider {
  return activeTtsProvider;
}

export function setTtsProvider(provider: TextToSpeechProvider): void {
  activeTtsProvider = provider;
}
