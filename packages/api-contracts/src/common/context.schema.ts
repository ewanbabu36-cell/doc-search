import { z } from 'zod';

export const RequestContextSchema = z.object({
  requestId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  actorEmail: z.string().email().optional(),
  actorRoles: z.array(z.string()).default([]),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

export type RequestContext = z.infer<typeof RequestContextSchema>;

export const AuditContextSchema = z.object({
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  tenantId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  actorId: z.string().uuid(),
  timestamp: z.string().datetime(),
  ipAddress: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type AuditContext = z.infer<typeof AuditContextSchema>;
