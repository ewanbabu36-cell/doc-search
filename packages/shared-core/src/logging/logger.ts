import { redactSensitiveData } from './redactor.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  tenantId?: string | undefined;
  branchId?: string | undefined;
  userId?: string | undefined;
  requestId?: string | undefined;
  service?: string | undefined;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext | undefined): void;
  info(message: string, context?: LogContext | undefined): void;
  warn(message: string, context?: LogContext | undefined): void;
  error(message: string, error?: unknown, context?: LogContext | undefined): void;
  child(defaultContext: LogContext): Logger;
}

class StructuredLogger implements Logger {
  private defaultContext: LogContext;
  private serviceName: string;

  constructor(serviceName: string, defaultContext: LogContext = {}) {
    this.serviceName = serviceName;
    this.defaultContext = defaultContext;
  }

  private format(level: LogLevel, message: string, extra?: Record<string, unknown>): string {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      context: redactSensitiveData({ ...this.defaultContext, ...extra })
    };
    return JSON.stringify(entry);
  }

  debug(message: string, context?: LogContext | undefined): void {
    if (process.env['NODE_ENV'] !== 'production') {
      console.debug(this.format('debug', message, context));
    }
  }

  info(message: string, context?: LogContext | undefined): void {
    console.info(this.format('info', message, context));
  }

  warn(message: string, context?: LogContext | undefined): void {
    console.warn(this.format('warn', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext | undefined): void {
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        : { rawError: String(error) };

    console.error(this.format('error', message, { ...context, error: errorDetails }));
  }

  child(childContext: LogContext): Logger {
    return new StructuredLogger(this.serviceName, { ...this.defaultContext, ...childContext });
  }
}

export function createLogger(serviceName: string, defaultContext?: LogContext | undefined): Logger {
  return new StructuredLogger(serviceName, defaultContext);
}
