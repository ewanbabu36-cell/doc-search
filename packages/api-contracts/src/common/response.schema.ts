import { z } from 'zod';
import { PaginationMetaSchema } from './pagination.schema.js';

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: PaginationMetaSchema.optional(),
    timestamp: z.string().datetime()
  });

export const ApiErrorItemSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional()
});

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(ApiErrorItemSchema).default([]),
    requestId: z.string().optional()
  }),
  timestamp: z.string().datetime()
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
