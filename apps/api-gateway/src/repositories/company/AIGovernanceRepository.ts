import crypto from 'node:crypto';
import { desc, eq } from '@docsearch/database';
import {
  getDatabase,
  aiModels,
  aiGovernancePolicies,
  aiPromptTemplates,
  aiPromptVersions,
  aiUsageQuotas,
  aiUsageRecords,
  aiAuditTraces,
  aiSafetyEvents
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('ai-governance-repository');

export function toDeterministicUuid(seed: string): string {
  const hash = crypto.createHash('sha256').update(`GOV_${seed}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function ensureUuid(val?: string | null): string {
  if (!val) return crypto.randomUUID();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) return val;
  return toDeterministicUuid(val);
}

function handleDbError(operation: string, err: unknown): never {
  if (err instanceof AppError) throw err;
  logger.error(`AI Governance DB operation '${operation}' failed:`, err);
  throw new AppError({
    message: `Database operation failed for AI Governance '${operation}': ${(err as any)?.message || String(err)}`,
    code: ErrorCode.DATABASE_ERROR,
    statusCode: 500
  });
}

export const DEFAULT_AI_MODELS: any[] = [
  {
    id: ensureUuid('DS-MEDTEXT-EMBED-1'),
    provider: 'Platform Inference Engine (GCP Vertex / DeepMind)',
    modelCode: 'DS-MEDTEXT-EMBED-1',
    modelName: 'DocSearch MedText Embedding Engine v1',
    description: 'High-density vector embedding model optimized for medical terminology index lookup and semantic search reranking.',
    modelFamily: 'Embeddings / Transformer',
    lifecycleStatus: 'ACTIVE',
    deploymentStatus: 'PRODUCTION',
    capabilityClassification: 'TEXT_EMBEDDING',
    riskClassification: 'LOW_ADMINISTRATIVE',
    contextWindow: 8192,
    supportedModalities: ['TEXT'],
    approvedForProduction: true,
    approvedForClinicalContext: false,
    version: '1.2.0',
    releaseDate: new Date('2026-05-15T00:00:00.000Z'),
    metadata: { vectorDimensions: 1536 },
    createdAt: new Date('2026-05-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-15T12:00:00.000Z')
  },
  {
    id: ensureUuid('DS-CLINICAL-SUMMARIZER-V2'),
    provider: 'Fine-Tuned Specialized LLM Gateway',
    modelCode: 'DS-CLINICAL-SUMMARIZER-V2',
    modelName: 'DocSearch Assistive Clinical Summarizer v2',
    description: 'Assistive medical record synthesizer for summarizing lengthy multi-page physician discharge documentation. Strictly assistive.',
    modelFamily: 'Decoder-Only LLM',
    lifecycleStatus: 'ACTIVE',
    deploymentStatus: 'STAGING',
    capabilityClassification: 'SUMMARIZATION',
    riskClassification: 'HIGH_CLINICAL_CONTEXT',
    contextWindow: 32768,
    supportedModalities: ['TEXT'],
    approvedForProduction: false,
    approvedForClinicalContext: true,
    version: '2.0.0-rc3',
    releaseDate: new Date('2026-08-01T00:00:00.000Z'),
    metadata: { clinicalValidationStudyRef: 'GOV-EVAL-2026-08' },
    createdAt: new Date('2026-07-15T09:00:00.000Z'),
    updatedAt: new Date('2026-08-20T14:00:00.000Z')
  },
  {
    id: ensureUuid('DS-DOC-EXTRACT-OCR-1'),
    provider: 'OCR / Vision Inference Gateway',
    modelCode: 'DS-DOC-EXTRACT-OCR-1',
    modelName: 'DocSearch Structured Lab & PDF Document Extractor',
    description: 'Specialized document parser for converting scanned lab requisition PDFs into structured JSON key-value pairs.',
    modelFamily: 'Vision-Language Model',
    lifecycleStatus: 'ACTIVE',
    deploymentStatus: 'PRODUCTION',
    capabilityClassification: 'DOCUMENT_EXTRACTION',
    riskClassification: 'MODERATE_OPERATIONAL',
    contextWindow: 16384,
    supportedModalities: ['TEXT', 'IMAGE_PDF'],
    approvedForProduction: true,
    approvedForClinicalContext: false,
    version: '1.1.4',
    releaseDate: new Date('2026-06-10T00:00:00.000Z'),
    metadata: {},
    createdAt: new Date('2026-06-01T08:00:00.000Z'),
    updatedAt: new Date('2026-08-10T11:00:00.000Z')
  }
];

export const DEFAULT_AI_POLICIES: any[] = [
  {
    id: ensureUuid('POL-CLINICAL-SAFETY-001'),
    policyCode: 'POL-CLINICAL-SAFETY-001',
    name: 'Assistive-Only Clinical Boundary & Anti-Diagnosis Mandate',
    description: 'Establishes non-negotiable boundaries ensuring all AI outputs are strictly structured as assistive notes and never autonomous medical advice.',
    policyType: 'CLINICAL_SAFETY_BOUNDARY',
    riskLevel: 'HIGH_CLINICAL_CONTEXT',
    status: 'APPROVED',
    rules: [
      'Model outputs must include mandatory physician-in-the-loop review disclaimers.',
      'Deterministic safety filter blocks any autonomous treatment recommendation or medication dosing output.',
      'Zero autonomous message dispatch directly to patients.'
    ],
    prohibitedUseCases: [
      'Autonomous patient diagnosis without licensed practitioner review',
      'Automated prescription dispatch or clinical order signing',
      'Direct-to-patient triage without healthcare staff oversight'
    ],
    allowedUseCases: [
      'Semantic document search & indexing',
      'Assistive summarization of medical history for attending physician review',
      'Structured extraction of lab document metadata'
    ],
    humanOversightRequired: true,
    clinicalSafetyBoundary: 'AI governance configuration does not constitute clinical approval or autonomous medical decision-making. Outputs require mandatory human-in-the-loop validation.',
    approvalRequired: true,
    approvedById: null,
    approvedByEmail: 'cmo.safety@docsearch.internal',
    approvedAt: new Date('2026-06-01T12:00:00.000Z'),
    version: '1.0.0',
    effectiveDate: new Date('2026-06-01T00:00:00.000Z'),
    metadata: {},
    createdAt: new Date('2026-05-20T10:00:00.000Z'),
    updatedAt: new Date('2026-06-01T12:00:00.000Z')
  },
  {
    id: ensureUuid('POL-PHI-REDACTION-002'),
    policyCode: 'POL-PHI-REDACTION-002',
    name: 'Outbound Inference Zero-PHI Redaction Policy',
    description: 'Mandates cryptographic hashing and synthetic token masking for any prompt payload dispatched across model boundary layers.',
    policyType: 'DATA_PRIVACY_REDACTION',
    riskLevel: 'MODERATE_OPERATIONAL',
    status: 'APPROVED',
    rules: [
      'All direct patient identifiers (SSN, MRN, Patient Name) are replaced with synthetic GUIDs before inference.',
      'Zero model weight training on ingested tenant data.'
    ],
    prohibitedUseCases: [
      'Unmasked PHI ingestion into public LLM API endpoints',
      'Persisting raw prompt payload text in plain operational logs'
    ],
    allowedUseCases: [
      'Synthesized de-identified prompt execution within dedicated tenant VPC'
    ],
    humanOversightRequired: false,
    clinicalSafetyBoundary: 'Automated policy enforcement gate.',
    approvalRequired: true,
    approvedById: null,
    approvedByEmail: 'ciso.security@docsearch.internal',
    approvedAt: new Date('2026-06-05T14:00:00.000Z'),
    version: '1.0.0',
    effectiveDate: new Date('2026-06-05T00:00:00.000Z'),
    metadata: {},
    createdAt: new Date('2026-05-25T11:00:00.000Z'),
    updatedAt: new Date('2026-06-05T14:00:00.000Z')
  }
];

export const DEFAULT_PROMPT_TEMPLATES: any[] = [
  {
    id: ensureUuid('TMPL-SUMMARIZE-DISCHARGE'),
    code: 'TMPL-SUMMARIZE-DISCHARGE',
    name: 'Physician Discharge Summary Assistant',
    description: 'Formats patient stay observations and physician notes into an executive clinical summary for healthcare team review.',
    promptType: 'TASK',
    status: 'APPROVED_FOR_PRODUCTION',
    ownerEmail: 'clinical.ai@docsearch.internal',
    currentVersion: '1.0.0',
    variables: ['patientAgeGroup', 'admissionNotes', 'clinicalTimeline', 'dischargeVitals'],
    governancePolicyId: ensureUuid('POL-CLINICAL-SAFETY-001'),
    approvalStatus: 'APPROVED_FOR_PRODUCTION',
    metadata: {},
    createdAt: new Date('2026-06-10T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T12:00:00.000Z')
  },
  {
    id: ensureUuid('TMPL-SEARCH-SEMANTIC-RERANK'),
    code: 'TMPL-SEARCH-SEMANTIC-RERANK',
    name: 'Medical Search Query Semantic Expansion',
    description: 'Expands user search queries with MeSH and ICD-10 medical terminology synonyms for hybrid search reranking.',
    promptType: 'SYSTEM',
    status: 'APPROVED_FOR_PRODUCTION',
    ownerEmail: 'search.eng@docsearch.internal',
    currentVersion: '1.1.0',
    variables: ['rawQuery', 'medicalContextDomain'],
    governancePolicyId: ensureUuid('POL-CLINICAL-SAFETY-001'),
    approvalStatus: 'APPROVED_FOR_PRODUCTION',
    metadata: {},
    createdAt: new Date('2026-06-15T09:00:00.000Z'),
    updatedAt: new Date('2026-08-10T14:00:00.000Z')
  }
];

export const DEFAULT_PROMPT_VERSIONS: any[] = [
  {
    id: ensureUuid('PV-TMPL-SUMMARIZE-DISCHARGE-1.0.0'),
    promptTemplateId: ensureUuid('TMPL-SUMMARIZE-DISCHARGE'),
    version: '1.0.0',
    promptContent: 'You are an assistive healthcare documentation synthesis tool.\nSummarize the following clinical notes solely for attending physician review.\nDo NOT output definitive diagnoses, medical orders, or autonomous treatment plans.\nNotes: {{clinicalTimeline}}\nVitals: {{dischargeVitals}}',
    changeSummary: 'Initial production-approved prompt baseline with strict assistive boundary disclaimer.',
    createdByEmail: 'clinical.ai@docsearch.internal',
    approvalStatus: 'APPROVED_FOR_PRODUCTION',
    approvedByEmail: 'cmo.safety@docsearch.internal',
    approvedAt: new Date('2026-06-12T15:00:00.000Z'),
    effectiveAt: new Date('2026-06-12T15:00:00.000Z'),
    metadata: {},
    createdAt: new Date('2026-06-10T10:00:00.000Z')
  },
  {
    id: ensureUuid('PV-TMPL-SUMMARIZE-DISCHARGE-1.1.0-rc1'),
    promptTemplateId: ensureUuid('TMPL-SUMMARIZE-DISCHARGE'),
    version: '1.1.0-rc1',
    promptContent: 'You are an assistive healthcare documentation synthesis tool.\nEnhanced structured discharge sectioning.\nNotes: {{clinicalTimeline}}\nVitals: {{dischargeVitals}}',
    changeSummary: 'Added support for standardized SOAP section headers.',
    createdByEmail: 'clinical.ai@docsearch.internal',
    approvalStatus: 'PENDING_REVIEW',
    metadata: {},
    createdAt: new Date('2026-08-25T11:00:00.000Z')
  }
];

export const DEFAULT_USAGE_QUOTAS: any[] = [
  {
    id: ensureUuid('QUOTA-PLATFORM-GLOBAL'),
    scopeType: 'PLATFORM',
    scopeReference: 'DOC-SEARCH-GLOBAL-INFRA',
    quotaType: 'TOKENS',
    limitValue: 50000000,
    warningThreshold: 40000000,
    period: 'MONTHLY',
    status: 'ACTIVE',
    effectiveDate: new Date('2026-08-01T00:00:00.000Z'),
    metadata: {},
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z')
  }
];

export const DEFAULT_SAFETY_EVENTS: any[] = [
  {
    id: ensureUuid('EVT-SAFETY-2026-08-01'),
    eventCode: 'EVT-SAFETY-2026-08-01',
    severity: 'WARNING',
    category: 'PROHIBITED_USE_INTERCEPTION',
    description: 'Inference request attempted to elicit definitive diagnostic verdict; intercepted and blocked by POL-CLINICAL-SAFETY-001 safety boundary.',
    recommendedAction: 'Verify that calling workflow maintains physician-in-the-loop assist mode.',
    status: 'OPEN',
    requiresHumanReview: true,
    detectedAt: new Date('2026-08-29T12:10:00.000Z'),
    metadata: {},
    createdAt: new Date('2026-08-29T12:10:00.000Z'),
    updatedAt: new Date('2026-08-29T12:10:00.000Z')
  },
  {
    id: ensureUuid('EVT-SAFETY-2026-08-02'),
    eventCode: 'EVT-SAFETY-2026-08-02',
    severity: 'INFO',
    category: 'ROUTINE_PROMPT_DEPRECATION_WARNING',
    description: 'Prompt template TMPL-SEARCH-SEMANTIC-RERANK v1.0.0 scheduled for deprecation in favor of v1.1.0.',
    recommendedAction: 'Migrate active search connector routes to v1.1.0.',
    status: 'RESOLVED',
    requiresHumanReview: false,
    acknowledgedByEmail: 'search.lead@docsearch.internal',
    acknowledgedAt: new Date('2026-08-28T09:00:00.000Z'),
    detectedAt: new Date('2026-08-28T08:30:00.000Z'),
    metadata: {},
    createdAt: new Date('2026-08-28T08:30:00.000Z'),
    updatedAt: new Date('2026-08-28T09:00:00.000Z')
  }
];

export class AIGovernanceRepository {
  private seeded = false;

  private async ensureSeedData(dbClient: any): Promise<void> {
    if (this.seeded || !dbClient) return;
    try {
      for (const m of DEFAULT_AI_MODELS) {
        await dbClient.insert(aiModels).values(m).onConflictDoNothing();
      }
      for (const p of DEFAULT_AI_POLICIES) {
        await dbClient.insert(aiGovernancePolicies).values(p).onConflictDoNothing();
      }
      for (const t of DEFAULT_PROMPT_TEMPLATES) {
        await dbClient.insert(aiPromptTemplates).values(t).onConflictDoNothing();
      }
      for (const v of DEFAULT_PROMPT_VERSIONS) {
        await dbClient.insert(aiPromptVersions).values(v).onConflictDoNothing();
      }
      for (const q of DEFAULT_USAGE_QUOTAS) {
        await dbClient.insert(aiUsageQuotas).values(q).onConflictDoNothing();
      }
      for (const s of DEFAULT_SAFETY_EVENTS) {
        await dbClient.insert(aiSafetyEvents).values(s).onConflictDoNothing();
      }
      this.seeded = true;
    } catch (err) {
      logger.warn('AI Governance baseline seeding notice: ' + String(err));
    }
  }

  async getModels(dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getModels', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    try {
      return await dbClient.select().from(aiModels).orderBy(desc(aiModels.createdAt));
    } catch (err) {
      handleDbError('getModels', err);
    }
  }

  async getModelById(id: string, dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getModelById', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    const targetUuid = ensureUuid(id);
    try {
      const rows = await dbClient.select().from(aiModels).where(eq(aiModels.id, targetUuid));
      return rows[0] || null;
    } catch (err) {
      handleDbError('getModelById', err);
    }
  }

  async updateModel(id: string, data: any, dbClient = getDatabase()) {
    if (!dbClient) handleDbError('updateModel', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    const targetUuid = ensureUuid(id);
    try {
      const rows = await dbClient
        .update(aiModels)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(aiModels.id, targetUuid))
        .returning();
      return rows[0] || null;
    } catch (err) {
      handleDbError('updateModel', err);
    }
  }

  async getPolicies(dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getPolicies', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    try {
      return await dbClient.select().from(aiGovernancePolicies).orderBy(desc(aiGovernancePolicies.createdAt));
    } catch (err) {
      handleDbError('getPolicies', err);
    }
  }

  async getPolicyById(id: string, dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getPolicyById', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    const targetUuid = ensureUuid(id);
    try {
      const rows = await dbClient.select().from(aiGovernancePolicies).where(eq(aiGovernancePolicies.id, targetUuid));
      return rows[0] || null;
    } catch (err) {
      handleDbError('getPolicyById', err);
    }
  }

  async transitionPolicy(id: string, toStatus: string, _reason: string, actorEmail: string, dbClient = getDatabase()) {
    if (!dbClient) handleDbError('transitionPolicy', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    const targetUuid = ensureUuid(id);
    try {
      const rows = await dbClient
        .update(aiGovernancePolicies)
        .set({
          status: toStatus,
          approvedAt: toStatus === 'APPROVED' ? new Date() : undefined,
          approvedByEmail: toStatus === 'APPROVED' ? actorEmail : undefined,
          updatedAt: new Date()
        })
        .where(eq(aiGovernancePolicies.id, targetUuid))
        .returning();
      return rows[0] || null;
    } catch (err) {
      handleDbError('transitionPolicy', err);
    }
  }

  async getPromptTemplates(dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getPromptTemplates', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    try {
      return await dbClient.select().from(aiPromptTemplates).orderBy(desc(aiPromptTemplates.createdAt));
    } catch (err) {
      handleDbError('getPromptTemplates', err);
    }
  }

  async getPromptTemplateById(id: string, dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getPromptTemplateById', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    const targetUuid = ensureUuid(id);
    try {
      const rows = await dbClient.select().from(aiPromptTemplates).where(eq(aiPromptTemplates.id, targetUuid));
      return rows[0] || null;
    } catch (err) {
      handleDbError('getPromptTemplateById', err);
    }
  }

  async getPromptVersions(promptTemplateId: string, dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getPromptVersions', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    const targetUuid = ensureUuid(promptTemplateId);
    try {
      return await dbClient
        .select()
        .from(aiPromptVersions)
        .where(eq(aiPromptVersions.promptTemplateId, targetUuid))
        .orderBy(desc(aiPromptVersions.createdAt));
    } catch (err) {
      handleDbError('getPromptVersions', err);
    }
  }

  async approvePromptVersion(data: any, actorEmail: string, dbClient = getDatabase()) {
    if (!dbClient) handleDbError('approvePromptVersion', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    const targetUuid = ensureUuid(data.promptVersionId);
    try {
      const rows = await dbClient
        .update(aiPromptVersions)
        .set({
          approvalStatus: data.approvalStatus,
          approvedByEmail: data.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? actorEmail : undefined,
          approvedAt: data.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? new Date() : undefined,
          effectiveAt: data.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? new Date() : undefined
        })
        .where(eq(aiPromptVersions.id, targetUuid))
        .returning();
      return rows[0] || null;
    } catch (err) {
      handleDbError('approvePromptVersion', err);
    }
  }

  async getUsageQuotas(dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getUsageQuotas', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    try {
      return await dbClient.select().from(aiUsageQuotas).orderBy(desc(aiUsageQuotas.createdAt));
    } catch (err) {
      handleDbError('getUsageQuotas', err);
    }
  }

  async getUsageRecords(dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getUsageRecords', new Error('Database unavailable'));
    try {
      return await dbClient.select().from(aiUsageRecords).orderBy(desc(aiUsageRecords.recordedAt));
    } catch (err) {
      handleDbError('getUsageRecords', err);
    }
  }

  async getAuditTraces(dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getAuditTraces', new Error('Database unavailable'));
    try {
      return await dbClient.select().from(aiAuditTraces).limit(50);
    } catch (err) {
      handleDbError('getAuditTraces', err);
    }
  }

  async getSafetyEvents(dbClient = getDatabase()) {
    if (!dbClient) handleDbError('getSafetyEvents', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    try {
      return await dbClient.select().from(aiSafetyEvents).orderBy(desc(aiSafetyEvents.detectedAt));
    } catch (err) {
      handleDbError('getSafetyEvents', err);
    }
  }

  async acknowledgeSafetyEvent(eventId: string, _reason: string, actorEmail: string, dbClient = getDatabase()) {
    if (!dbClient) handleDbError('acknowledgeSafetyEvent', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    const targetUuid = ensureUuid(eventId);
    try {
      const rows = await dbClient
        .update(aiSafetyEvents)
        .set({
          status: 'ACKNOWLEDGED',
          acknowledgedByEmail: actorEmail,
          acknowledgedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(aiSafetyEvents.id, targetUuid))
        .returning();
      return rows[0] || null;
    } catch (err) {
      handleDbError('acknowledgeSafetyEvent', err);
    }
  }

  async resolveSafetyEvent(eventId: string, resolutionStatus: string, _notes: string, _actorEmail: string, dbClient = getDatabase()) {
    if (!dbClient) handleDbError('resolveSafetyEvent', new Error('Database unavailable'));
    await this.ensureSeedData(dbClient);
    const targetUuid = ensureUuid(eventId);
    try {
      const rows = await dbClient
        .update(aiSafetyEvents)
        .set({
          status: resolutionStatus,
          updatedAt: new Date()
        })
        .where(eq(aiSafetyEvents.id, targetUuid))
        .returning();
      return rows[0] || null;
    } catch (err) {
      handleDbError('resolveSafetyEvent', err);
    }
  }
}

export const aiGovernanceRepository = new AIGovernanceRepository();
