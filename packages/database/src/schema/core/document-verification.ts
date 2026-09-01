import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
  numeric,
  bigint,
  index
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants.js';
import { users } from './users.js';

/**
 * 1. Document Types Master
 */
export const documentTypes = pgTable(
  'document_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 64 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    documentCategory: varchar('document_category', { length: 64 }).notNull(), // QUALIFICATION, REGISTRATION, LICENSE, EXPERIENCE, ACCREDITATION, IDENTITY, FACILITY, TRAINING, OTHER
    applicableEntityType: varchar('applicable_entity_type', { length: 64 }).notNull(), // FACILITY, PROFESSIONAL, STAFF, TENANT
    applicableRole: varchar('applicable_role', { length: 64 }), // DOCTOR, NURSE, LAB_TECHNICIAN, PHARMACIST, STAFF, RECEPTIONIST, etc.
    facilityType: varchar('facility_type', { length: 64 }), // HOSPITAL, CLINIC, LABORATORY, PHARMACY, DIAGNOSTIC_CENTRE
    isRequired: boolean('is_required').notNull().default(true),
    isConditional: boolean('is_conditional').notNull().default(false),
    conditionExpression: text('condition_expression'),
    allowedFileTypes: jsonb('allowed_file_types').default(['application/pdf', 'image/png', 'image/jpeg']),
    maxFileSizeBytes: bigint('max_file_size_bytes', { mode: 'number' }).notNull().default(10485760), // 10MB
    requiresExpiry: boolean('requires_expiry').notNull().default(false),
    requiresRegistrationNumber: boolean('requires_registration_number').notNull().default(false),
    requiresIssuingAuthority: boolean('requires_issuing_authority').notNull().default(false),
    requiresIssueDate: boolean('requires_issue_date').notNull().default(false),
    requiresVerification: boolean('requires_verification').notNull().default(true),
    active: boolean('active').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_document_types_code').on(table.code),
    index('idx_document_types_role').on(table.applicableRole),
    index('idx_document_types_facility').on(table.facilityType),
    index('idx_document_types_category').on(table.documentCategory)
  ]
);

/**
 * 2. Document Requirements Mapping Rules
 */
export const documentRequirements = pgTable(
  'document_requirements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentTypeId: uuid('document_type_id')
      .notNull()
      .references(() => documentTypes.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    role: varchar('role', { length: 64 }),
    facilityType: varchar('facility_type', { length: 64 }),
    professionalType: varchar('professional_type', { length: 64 }),
    isMandatory: boolean('is_mandatory').notNull().default(true),
    conditionRule: text('condition_rule'),
    instructions: text('instructions'),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_doc_requirements_type').on(table.documentTypeId),
    index('idx_doc_requirements_role').on(table.role),
    index('idx_doc_requirements_facility').on(table.facilityType)
  ]
);

/**
 * 3. Entity Documents (Uploaded Files, Metadata, SHA-256 Fingerprint, Versioning)
 */
export const entityDocuments = pgTable(
  'entity_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentTypeId: uuid('document_type_id')
      .notNull()
      .references(() => documentTypes.id),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    ownerEntityId: uuid('owner_entity_id').notNull(), // User ID or Tenant ID or Branch ID
    ownerEntityType: varchar('owner_entity_type', { length: 64 }).notNull(), // 'TENANT', 'BRANCH', 'USER', 'STAFF'
    role: varchar('role', { length: 64 }),
    facilityType: varchar('facility_type', { length: 64 }),
    documentNumber: varchar('document_number', { length: 128 }),
    issuingAuthority: varchar('issuing_authority', { length: 255 }),
    issueDate: date('issue_date'),
    expiryDate: date('expiry_date'),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    fileUrl: text('file_url').notNull(),
    mimeType: varchar('mime_type', { length: 128 }).notNull(),
    fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
    sha256Hash: varchar('sha256_hash', { length: 64 }).notNull(),
    aiMatchScore: numeric('ai_match_score', { precision: 5, scale: 2 }),
    aiExtractedText: text('ai_extracted_text'),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    verificationStatus: varchar('verification_status', { length: 64 }).notNull().default('PENDING_VERIFICATION'), // NOT_UPLOADED, PENDING_VERIFICATION, VERIFIED, REJECTED, EXPIRED, SUPERSEDED
    verifiedBy: uuid('verified_by').references(() => users.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    version: integer('version').notNull().default(1),
    isCurrent: boolean('is_current').notNull().default(true),
    supersededBy: uuid('superseded_by'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_entity_documents_tenant').on(table.tenantId),
    index('idx_entity_documents_owner').on(table.ownerEntityId),
    index('idx_entity_documents_type').on(table.documentTypeId),
    index('idx_entity_documents_status').on(table.verificationStatus),
    index('idx_entity_documents_current').on(table.isCurrent)
  ]
);

/**
 * 4. Document Verifications History
 */
export const documentVerifications = pgTable(
  'document_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => entityDocuments.id, { onDelete: 'cascade' }),
    verifierId: uuid('verifier_id')
      .notNull()
      .references(() => users.id),
    verifierEmail: varchar('verifier_email', { length: 255 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(), // VERIFY, REJECT, REQUEST_REUPLOAD
    previousStatus: varchar('previous_status', { length: 64 }).notNull(),
    newStatus: varchar('new_status', { length: 64 }).notNull(),
    reason: text('reason'),
    aiAuditScore: numeric('ai_audit_score', { precision: 5, scale: 2 }),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_doc_verifications_doc').on(table.documentId),
    index('idx_doc_verifications_time').on(table.timestamp)
  ]
);

/**
 * 5. Immutable Document Audit Logs
 */
export const documentAuditLogs = pgTable(
  'document_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id').notNull(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: varchar('actor_email', { length: 255 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(), // UPLOAD, REPLACE, SUBMIT, VERIFY, REJECT, SUPERSEDE, EXPIRE, DOWNLOAD
    oldStatus: varchar('old_status', { length: 64 }),
    newStatus: varchar('new_status', { length: 64 }),
    reason: text('reason'),
    metadata: jsonb('metadata').default({}),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_doc_audit_doc').on(table.documentId),
    index('idx_doc_audit_time').on(table.timestamp)
  ]
);

export type DocumentType = typeof documentTypes.$inferSelect;
export type NewDocumentType = typeof documentTypes.$inferInsert;

export type DocumentRequirement = typeof documentRequirements.$inferSelect;
export type NewDocumentRequirement = typeof documentRequirements.$inferInsert;

export type EntityDocument = typeof entityDocuments.$inferSelect;
export type NewEntityDocument = typeof entityDocuments.$inferInsert;

export type DocumentVerification = typeof documentVerifications.$inferSelect;
export type NewDocumentVerification = typeof documentVerifications.$inferInsert;

export type DocumentAuditLog = typeof documentAuditLogs.$inferSelect;
export type NewDocumentAuditLog = typeof documentAuditLogs.$inferInsert;
