import { pgTable, text, timestamp, integer, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';

export const workflowDefinitions = pgTable('workflow_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  entityType: text('entity_type').notNull(),
  organizationType: text('organization_type').notNull(),
  activeVersion: integer('active_version').notNull().default(1),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, DRAFT, ARCHIVED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const workflowVersions = pgTable('workflow_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').references(() => workflowDefinitions.id).notNull(),
  version: integer('version').notNull(),
  status: text('status').notNull().default('ACTIVE'), // DRAFT, ACTIVE, SUPERSEDED, ARCHIVED
  effectiveFrom: timestamp('effective_from').defaultNow().notNull(),
  effectiveTo: timestamp('effective_to'),
  changeSummary: text('change_summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: text('created_by').notNull().default('SYSTEM')
});

export const workflowStages = pgTable('workflow_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').references(() => workflowDefinitions.id).notNull(),
  versionId: uuid('version_id').references(() => workflowVersions.id).notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  sequence: integer('sequence').notNull(),
  stageType: text('stage_type').notNull(),
  isInitial: boolean('is_initial').default(false).notNull(),
  isTerminal: boolean('is_terminal').default(false).notNull(),
  status: text('status').default('ACTIVE').notNull(),
  metadata: jsonb('metadata')
});

export const workflowTransitions = pgTable('workflow_transitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').references(() => workflowDefinitions.id).notNull(),
  versionId: uuid('version_id').references(() => workflowVersions.id).notNull(),
  fromStageId: uuid('from_stage_id').references(() => workflowStages.id).notNull(),
  toStageId: uuid('to_stage_id').references(() => workflowStages.id).notNull(),
  transitionCode: text('transition_code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  conditions: jsonb('conditions'),
  requiredPermissions: jsonb('required_permissions'),
  approvalRequired: boolean('approval_required').default(false).notNull(),
  requiredApprovalRoles: jsonb('required_approval_roles'),
  actions: jsonb('actions'),
  status: text('status').default('ACTIVE').notNull()
});

export const workflowRequirements = pgTable('workflow_requirements', {
  id: uuid('id').primaryKey().defaultRandom(),
  stageId: uuid('stage_id').references(() => workflowStages.id).notNull(),
  requirementCode: text('requirement_code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  requirementType: text('requirement_type').notNull(),
  configuration: jsonb('configuration').notNull(),
  isRequired: boolean('is_required').default(true).notNull(),
  validationRule: jsonb('validation_rule'),
  order: integer('order').notNull().default(1),
  status: text('status').default('ACTIVE').notNull()
});

export const workflowInstances = pgTable('workflow_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').references(() => workflowDefinitions.id).notNull(),
  workflowCode: text('workflow_code').notNull(),
  workflowVersion: integer('workflow_version').notNull(),
  organizationType: text('organization_type').notNull(),
  entityId: text('entity_id').notNull(),
  entityName: text('entity_name').notNull(),
  currentStageId: uuid('current_stage_id').references(() => workflowStages.id).notNull(),
  currentStageCode: text('current_stage_code').notNull(),
  currentStageName: text('current_stage_name').notNull(),
  status: text('status').notNull().default('IN_PROGRESS'),
  contextData: jsonb('context_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const workflowRequirementInstances = pgTable('workflow_requirement_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  instanceId: uuid('instance_id').references(() => workflowInstances.id).notNull(),
  requirementId: text('requirement_id').notNull(),
  requirementCode: text('requirement_code').notNull(),
  name: text('name').notNull(),
  requirementType: text('requirement_type').notNull(),
  isFulfilled: boolean('is_fulfilled').default(false).notNull(),
  fulfilledAt: timestamp('fulfilled_at'),
  fulfilledBy: text('fulfilled_by'),
  data: jsonb('data'),
  evaluationResult: jsonb('evaluation_result')
});

export const workflowApprovals = pgTable('workflow_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  instanceId: uuid('instance_id').references(() => workflowInstances.id).notNull(),
  transitionId: uuid('transition_id').references(() => workflowTransitions.id).notNull(),
  requiredRole: text('required_role').notNull(),
  status: text('status').notNull().default('PENDING'),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  comments: text('comments')
});

export const workflowTransitionLogs = pgTable('workflow_transition_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  instanceId: uuid('instance_id').references(() => workflowInstances.id).notNull(),
  workflowId: uuid('workflow_id').references(() => workflowDefinitions.id).notNull(),
  version: integer('version').notNull(),
  fromStageCode: text('from_stage_code').notNull(),
  toStageCode: text('to_stage_code').notNull(),
  transitionCode: text('transition_code').notNull(),
  actorEmail: text('actor_email').notNull(),
  actorRole: text('actor_role').notNull(),
  rulesEvaluated: jsonb('rules_evaluated').notNull(),
  requirementsEvaluated: jsonb('requirements_evaluated').notNull(),
  actionsExecuted: jsonb('actions_executed').notNull(),
  reason: text('reason'),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});
