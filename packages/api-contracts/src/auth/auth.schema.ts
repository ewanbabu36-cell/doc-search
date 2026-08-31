import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  tenantSlug: z.string().trim().min(2).max(64).optional()
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const MFAChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().length(6)
});

export type MFAChallenge = z.infer<typeof MFAChallengeSchema>;

export const TokenPayloadSchema = z.object({
  sub: z.string().uuid(), // user id
  email: z.string().email(),
  tenantId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  iat: z.number(),
  exp: z.number()
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

export const AuthSessionResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    tenantId: z.string().uuid(),
    branchId: z.string().uuid().optional(),
    roles: z.array(z.string())
  })
});

export type AuthSessionResponse = z.infer<typeof AuthSessionResponseSchema>;
