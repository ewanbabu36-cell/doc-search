import { z } from 'zod';

export const RoleTypeSchema = z.enum([
  // Platform Level Roles (Phase 1)
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'COMPLIANCE_OFFICER',
  'SUPPORT_LEAD',
  'FINANCE_MANAGER',

  // Partner / Clinical Level Roles (Phase 2)
  'HOSPITAL_ADMIN',
  'CLINIC_ADMIN',
  'BRANCH_MANAGER',
  'CHIEF_MEDICAL_OFFICER',
  'DOCTOR',
  'NURSE',
  'RECEPTIONIST',
  'PHARMACIST',
  'LAB_TECHNICIAN',
  'BILLING_CLERK',
  'PATIENT'
]);

export type RoleType = z.infer<typeof RoleTypeSchema>;

export const PermissionActionSchema = z.enum(['create', 'read', 'update', 'delete', 'manage', 'execute', 'audit']);
export type PermissionAction = z.infer<typeof PermissionActionSchema>;

export const PermissionScopeSchema = z.enum(['global', 'tenant', 'branch', 'department', 'own']);
export type PermissionScope = z.infer<typeof PermissionScopeSchema>;

export const PermissionDefinitionSchema = z.object({
  resource: z.string(),
  action: PermissionActionSchema,
  scope: PermissionScopeSchema
});

export type PermissionDefinition = z.infer<typeof PermissionDefinitionSchema>;
