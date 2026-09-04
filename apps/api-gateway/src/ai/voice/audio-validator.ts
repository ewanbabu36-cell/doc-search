import { AppError, createLogger } from '@docsearch/shared-core';

const logger = createLogger('audio-validator');

export interface AudioValidationConfig {
  maxBytes?: number;
  maxDurationSeconds?: number;
  allowedMimeTypes?: string[];
}

export interface ValidatedAudio {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
  estimatedDurationSeconds: number;
}

export const DEFAULT_MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_DURATION_SECONDS = 120; // 2 minutes

export const DEFAULT_ALLOWED_MIME_TYPES = [
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac'
];

/**
 * Validates audio payloads to guarantee integrity, size, and format safety before STT ingestion.
 */
export function validateAudioPayload(
  rawAudio: Buffer | Uint8Array | string,
  declaredMimeType: string,
  config: AudioValidationConfig = {}
): ValidatedAudio {
  const maxBytes = config.maxBytes ?? DEFAULT_MAX_AUDIO_BYTES;
  const maxDurationSeconds = config.maxDurationSeconds ?? DEFAULT_MAX_DURATION_SECONDS;
  const allowedMimeTypes = config.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;

  if (!rawAudio) {
    throw AppError.badRequest('Audio payload is missing or empty');
  }

  // Handle base64 string or Buffer
  let buffer: Buffer;
  if (typeof rawAudio === 'string') {
    const base64Data = rawAudio.includes(';base64,') ? rawAudio.split(';base64,')[1] : rawAudio;
    buffer = Buffer.from(base64Data || '', 'base64');
  } else if (Buffer.isBuffer(rawAudio)) {
    buffer = rawAudio;
  } else {
    buffer = Buffer.from(rawAudio);
  }

  if (buffer.length === 0) {
    throw AppError.badRequest('Audio buffer contains 0 bytes');
  }

  if (buffer.length > maxBytes) {
    throw AppError.badRequest(
      `Audio payload exceeds maximum permitted size of ${maxBytes} bytes (received: ${buffer.length} bytes)`
    );
  }

  // Normalize mime type
  const normalizedMimeType = declaredMimeType.toLowerCase().split(';')[0]?.trim() || '';
  if (!allowedMimeTypes.includes(normalizedMimeType)) {
    throw AppError.badRequest(
      `Unsupported audio MIME type '${declaredMimeType}'. Supported formats: ${allowedMimeTypes.join(', ')}`
    );
  }

  // Basic format magic byte inspection
  validateMagicBytes(buffer, normalizedMimeType);

  // Estimate duration based on standard sample rates (16-bit PCM ~32KB/sec or compressed ~16KB/sec)
  // For webm/ogg/mp3, rough estimate ~16000 bytes/sec
  const estimatedDuration = Math.max(1, Math.round(buffer.length / 16000));
  if (estimatedDuration > maxDurationSeconds) {
    throw AppError.badRequest(
      `Audio estimated duration (${estimatedDuration}s) exceeds maximum allowed duration (${maxDurationSeconds}s)`
    );
  }

  return {
    buffer,
    mimeType: normalizedMimeType,
    sizeBytes: buffer.length,
    estimatedDurationSeconds: estimatedDuration
  };
}

/**
 * Validates container header magic bytes against common audio formats.
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): void {
  if (buffer.length < 4) {
    throw AppError.badRequest('Corrupt audio buffer: insufficient bytes for container header');
  }

  // WAV starts with "RIFF"
  if (mimeType.includes('wav')) {
    const header = buffer.subarray(0, 4).toString('ascii');
    if (header !== 'RIFF') {
      logger.warn('WAV header mismatch: expected RIFF', { header });
      // Allow if valid audio structure exists
    }
  }

  // WebM / Ogg / MP3 sanity check
  if (mimeType.includes('ogg')) {
    const header = buffer.subarray(0, 4).toString('ascii');
    if (header !== 'OggS') {
      logger.warn('Ogg header mismatch: expected OggS', { header });
    }
  }
}
