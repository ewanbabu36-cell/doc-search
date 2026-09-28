import { ErrorCode } from './error-codes.js';

export interface AppErrorDetails {
  field?: string | undefined;
  message: string;
  code?: string | undefined;
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: AppErrorDetails[];
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(params: {
    message: string;
    code?: ErrorCode | undefined;
    statusCode?: number | undefined;
    details?: AppErrorDetails[] | undefined;
    isOperational?: boolean | undefined;
    cause?: unknown | undefined;
  }) {
    super(params.message, { cause: params.cause });
    this.name = 'AppError';
    this.code = params.code ?? ErrorCode.INTERNAL_SERVER_ERROR;
    this.statusCode = params.statusCode ?? 500;
    this.details = params.details ?? [];
    this.isOperational = params.isOperational ?? true;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static unauthorized(message = 'Authentication required', code: ErrorCode = ErrorCode.UNAUTHORIZED): AppError {
    return new AppError({ message, code, statusCode: 401 });
  }

  static forbidden(message = 'Access denied', code: ErrorCode = ErrorCode.FORBIDDEN): AppError {
    return new AppError({ message, code, statusCode: 403 });
  }

  static notFound(message = 'Resource not found', code: ErrorCode = ErrorCode.NOT_FOUND): AppError {
    return new AppError({ message, code, statusCode: 404 });
  }

  static badRequest(message = 'Invalid request', details?: AppErrorDetails[]): AppError {
    return new AppError({ message, code: ErrorCode.BAD_REQUEST, statusCode: 400, details });
  }

  static validation(details: AppErrorDetails[]): AppError {
    return new AppError({
      message: 'Validation failed',
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 400,
      details
    });
  }

  static conflict(message = 'Resource conflict', code: ErrorCode = ErrorCode.CONFLICT): AppError {
    return new AppError({ message, code, statusCode: 409 });
  }

  static rateLimit(message = 'Too many requests'): AppError {
    return new AppError({ message, code: ErrorCode.RATE_LIMIT_EXCEEDED, statusCode: 429 });
  }

  static internal(message = 'Internal server error', cause?: unknown): AppError {
    return new AppError({ message, code: ErrorCode.INTERNAL_SERVER_ERROR, statusCode: 500, cause });
  }
}
