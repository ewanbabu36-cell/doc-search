import { apiRequest } from './api-client.js';

export interface VoiceTranscriptionDto {
  transcript: string;
  confidence: number;
  durationSeconds: number;
  language?: string;
  provider: string;
  latencyMs: number;
}

export interface VoiceExecutionResponseDto {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  transcript: string;
  content: string;
  safetyCategory: 'PROPOSED' | 'PENDING_CONFIRMATION' | 'EXECUTED' | 'FAILED' | 'DENIED' | 'INFORMATIONAL';
  audio?: string; // base64 encoded audio
  audioMimeType?: string;
  capabilityId: string;
  toolId?: string | null;
  role: string;
  dataScope: string;
  traceId: string;
  auditHash: string;
  cached?: boolean;
  usage: {
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    sttLatencyMs: number;
    ttsLatencyMs: number;
  };
}

export interface VoiceSynthesisDto {
  audio: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  safetyCategory: string;
  latencyMs: number;
}

export class AiVoiceClientService {
  /**
   * Transcribes recorded audio to text.
   */
  async transcribe(base64Audio: string, mimeType = 'audio/wav'): Promise<VoiceTranscriptionDto> {
    const res = await apiRequest<VoiceTranscriptionDto>('/api/v1/partner/ai/voice/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audio: base64Audio, mimeType })
    });

    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to transcribe audio');
    }
    return res.data;
  }

  /**
   * Sends audio through the complete Voice pipeline (STT -> AI Core -> DB Persist -> TTS).
   */
  async interact(
    base64Audio: string,
    options: {
      mimeType?: string | undefined;
      conversationId?: string | undefined;
      capabilityId?: string | undefined;
      toolId?: string | undefined;
      toolInput?: Record<string, unknown> | undefined;
      idempotencyKey?: string | undefined;
      synthesizeAudio?: boolean | undefined;
    } = {}
  ): Promise<VoiceExecutionResponseDto> {
    const headers: Record<string, string> = {};
    if (options.idempotencyKey) {
      headers['x-idempotency-key'] = options.idempotencyKey;
    }

    const res = await apiRequest<VoiceExecutionResponseDto>('/api/v1/partner/ai/voice/interact', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        audio: base64Audio,
        mimeType: options.mimeType || 'audio/wav',
        conversationId: options.conversationId,
        capabilityId: options.capabilityId,
        toolId: options.toolId,
        toolInput: options.toolInput,
        synthesizeAudio: options.synthesizeAudio !== false
      })
    });

    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Voice interaction failed');
    }
    return res.data;
  }

  /**
   * Synthesizes text into spoken audio.
   */
  async synthesize(text: string, voice?: string): Promise<VoiceSynthesisDto> {
    const res = await apiRequest<VoiceSynthesisDto>('/api/v1/partner/ai/voice/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text, voice })
    });

    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to synthesize speech');
    }
    return res.data;
  }
}

export const aiVoiceClientService = new AiVoiceClientService();
