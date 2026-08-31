import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError, createLogger, ErrorCode } from '@docsearch/shared-core';

const logger = createLogger('api-gateway');

export function errorHandler(error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply): void {
  const requestId = request.id;

  if (error instanceof AppError) {
    logger.warn(`Operational AppError [${error.code}]: ${error.message}`, {
      requestId,
      statusCode: error.statusCode,
      details: error.details
    });

    reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId
      },
      timestamp: error.timestamp
    });
    return;
  }

  // Fastify Validation Errors
  if ('validation' in error && error.validation) {
    logger.warn(`Validation failure on ${request.method} ${request.url}`, {
      requestId,
      validation: error.validation
    });

    reply.status(400).send({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Request payload validation failed',
        details: error.validation.map((v) => ({
          field: (v.instancePath || v.params?.['missingProperty'] || 'unknown') as string,
          message: v.message || 'Invalid value'
        })),
        requestId
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Unhandled / Internal Server Errors
  logger.error(`Unhandled Exception on ${request.method} ${request.url}`, error, { requestId });

  reply.status(500).send({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected internal error occurred',
      details: [],
      requestId
    },
    timestamp: new Date().toISOString()
  });
}
