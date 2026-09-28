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

export const DEFAULT_AI_MODELS: any[] = [
  {
    id: 'aim-001-1111-4111-a111-111111111111',
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
    releaseDate: '2026-05-15T00:00:00.000Z',
    metadata: { vectorDimensions: 1536 },
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-08-15T12:00:00.000Z'
  },
  {
    id: 'aim-002-2222-4222-a222-222222222222',
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
    releaseDate: '2026-08-01T00:00:00.000Z',
    metadata: { clinicalValidationStudyRef: 'GOV-EVAL-2026-08' },
    createdAt: '2026-07-15T09:00:00.000Z',
    updatedAt: '2026-08-20T14:00:00.000Z'
  },
  {
    id: 'aim-003-3333-4333-a333-333333333333',
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
    releaseDate: '2026-06-10T00:00:00.000Z',
    metadata: {},
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-08-10T11:00:00.000Z'
  }
];

export const DEFAULT_AI_POLICIES: any[] = [
  {
    id: 'gov-pol-001',
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
    approvedById: '11111111-1111-4111-a111-111111111111',
    approvedByEmail: 'cmo.safety@docsearch.internal',
    approvedAt: '2026-06-01T12:00:00.000Z',
    version: '1.0.0',
    effectiveDate: '2026-06-01T00:00:00.000Z',
    metadata: {},
    createdAt: '2026-05-20T10:00:00.000Z',
    updatedAt: '2026-06-01T12:00:00.000Z'
  },
  {
    id: 'gov-pol-002',
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
    approvedById: '11111111-1111-4111-a111-111111111111',
    approvedByEmail: 'ciso.security@docsearch.internal',
    approvedAt: '2026-06-05T14:00:00.000Z',
    version: '1.0.0',
    effectiveDate: '2026-06-05T00:00:00.000Z',
    metadata: {},
    createdAt: '2026-05-25T11:00:00.000Z',
    updatedAt: '2026-06-05T14:00:00.000Z'
  }
];

export const DEFAULT_PROMPT_TEMPLATES: any[] = [
  {
    id: 'pt-001',
    code: 'TMPL-SUMMARIZE-DISCHARGE',
    name: 'Physician Discharge Summary Assistant',
    description: 'Formats patient stay observations and physician notes into an executive clinical summary for healthcare team review.',
    promptType: 'TASK',
    status: 'APPROVED_FOR_PRODUCTION',
    ownerEmail: 'clinical.ai@docsearch.internal',
    currentVersion: '1.0.0',
    variables: ['patientAgeGroup', 'admissionNotes', 'clinicalTimeline', 'dischargeVitals'],
    governancePolicyId: 'gov-pol-001',
    governancePolicyCode: 'POL-CLINICAL-SAFETY-001',
    approvalStatus: 'APPROVED_FOR_PRODUCTION',
    metadata: {},
    createdAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z'
  },
  {
    id: 'pt-002',
    code: 'TMPL-SEARCH-SEMANTIC-RERANK',
    name: 'Medical Search Query Semantic Expansion',
    description: 'Expands user search queries with MeSH and ICD-10 medical terminology synonyms for hybrid search reranking.',
    promptType: 'SYSTEM',
    status: 'APPROVED_FOR_PRODUCTION',
    ownerEmail: 'search.eng@docsearch.internal',
    currentVersion: '1.1.0',
    variables: ['rawQuery', 'medicalContextDomain'],
    governancePolicyId: 'gov-pol-001',
    governancePolicyCode: 'POL-CLINICAL-SAFETY-001',
    approvalStatus: 'APPROVED_FOR_PRODUCTION',
    metadata: {},
    createdAt: '2026-06-15T09:00:00.000Z',
    updatedAt: '2026-08-10T14:00:00.000Z'
  }
];

export const DEFAULT_PROMPT_VERSIONS: any[] = [
  {
    id: 'pv-001',
    promptTemplateId: 'pt-001',
    version: '1.0.0',
    promptContent: 'You are an assistive healthcare documentation synthesis tool.\nSummarize the following clinical notes solely for attending physician review.\nDo NOT output definitive diagnoses, medical orders, or autonomous treatment plans.\nNotes: {{clinicalTimeline}}\nVitals: {{dischargeVitals}}',
    changeSummary: 'Initial production-approved prompt baseline with strict assistive boundary disclaimer.',
    createdByEmail: 'clinical.ai@docsearch.internal',
    approvalStatus: 'APPROVED_FOR_PRODUCTION',
    approvedByEmail: 'cmo.safety@docsearch.internal',
    approvedAt: '2026-06-12T15:00:00.000Z',
    effectiveAt: '2026-06-12T15:00:00.000Z',
    metadata: {},
    createdAt: '2026-06-10T10:00:00.000Z'
  },
  {
    id: 'pv-002',
    promptTemplateId: 'pt-001',
    version: '1.1.0-rc1',
    promptContent: 'You are an assistive healthcare documentation synthesis tool.\nEnhanced structured discharge sectioning.\nNotes: {{clinicalTimeline}}\nVitals: {{dischargeVitals}}',
    changeSummary: 'Added support for standardized SOAP section headers.',
    createdByEmail: 'clinical.ai@docsearch.internal',
    approvalStatus: 'PENDING_REVIEW',
    metadata: {},
    createdAt: '2026-08-25T11:00:00.000Z'
  }
];

export const DEFAULT_USAGE_QUOTAS: any[] = [
  {
    id: 'quota-001',
    scopeType: 'PLATFORM',
    scopeReference: 'DOC-SEARCH-GLOBAL-INFRA',
    quotaType: 'TOKENS',
    limitValue: 50000000,
    warningThreshold: 40000000,
    period: 'MONTHLY',
    status: 'ACTIVE',
    effectiveDate: '2026-08-01T00:00:00.000Z',
    metadata: {},
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'quota-002',
    scopeType: 'PARTNER',
    scopeReference: 'Metro Health Alliance (Tier 1)',
    modelCode: 'DS-CLINICAL-SUMMARIZER-V2',
    quotaType: 'REQUESTS',
    limitValue: 10000,
    warningThreshold: 8000,
    period: 'DAILY',
    status: 'ACTIVE',
    effectiveDate: '2026-08-01T00:00:00.000Z',
    metadata: {},
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  }
];

export const DEFAULT_USAGE_RECORDS: any[] = [
  {
    id: 'rec-001',
    modelId: 'aim-001-1111-4111-a111-111111111111',
    modelCode: 'DS-MEDTEXT-EMBED-1',
    environment: 'PRODUCTION',
    requestCount: 14200,
    inputTokens: 185000,
    outputTokens: 0,
    totalTokens: 185000,
    recordedAt: '2026-08-29T10:00:00.000Z',
    sourceStatus: 'CONNECTED',
    metadata: {}
  }
];

export const DEFAULT_AUDIT_TRACES: any[] = [
  {
    id: 'trc-001',
    traceId: 'trc-20260829-001948',
    actorEmail: 'dr.smith@sample-metrohealth.org',
    partnerTradeName: 'Metro Health Alliance',
    modelId: 'aim-002-2222-4222-a222-222222222222',
    modelCode: 'DS-CLINICAL-SUMMARIZER-V2',
    modelVersion: '2.0.0-rc3',
    promptTemplateCode: 'TMPL-SUMMARIZE-DISCHARGE',
    promptVersion: '1.0.0',
    governancePolicyCode: 'POL-CLINICAL-SAFETY-001',
    safetyClassification: 'HIGH_CLINICAL_CONTEXT',
    requestStatus: 'COMPLETED',
    outcomeStatus: 'PASSED_SAFETY_GATE',
    humanReviewRequired: true,
    humanReviewStatus: 'APPROVED_BY_HUMAN',
    environment: 'STAGING',
    occurredAt: '2026-08-29T11:45:00.000Z',
    metadata: { executionLatencyMs: 342 }
  },
  {
    id: 'trc-002',
    traceId: 'trc-20260829-001949',
    actorEmail: 'resident.lee@sample-metrohealth.org',
    partnerTradeName: 'Metro Health Alliance',
    modelId: 'aim-002-2222-4222-a222-222222222222',
    modelCode: 'DS-CLINICAL-SUMMARIZER-V2',
    modelVersion: '2.0.0-rc3',
    promptTemplateCode: 'TMPL-SUMMARIZE-DISCHARGE',
    promptVersion: '1.0.0',
    governancePolicyCode: 'POL-CLINICAL-SAFETY-001',
    safetyClassification: 'HIGH_CLINICAL_CONTEXT',
    requestStatus: 'BLOCKED_BY_POLICY',
    outcomeStatus: 'FLAGGED_ANOMALY',
    humanReviewRequired: true,
    humanReviewStatus: 'PENDING_CLINICAL_LEAD',
    environment: 'STAGING',
    occurredAt: '2026-08-29T12:10:00.000Z',
    metadata: { blockReason: 'Prompt contained autonomous diagnosis trigger phrase; intercepted by safety filter' }
  }
];

export const DEFAULT_SAFETY_EVENTS: any[] = [
  {
    id: 'safe-001',
    eventCode: 'EVT-SAFETY-2026-08-01',
    severity: 'WARNING',
    category: 'PROHIBITED_USE_INTERCEPTION',
    modelCode: 'DS-CLINICAL-SUMMARIZER-V2',
    promptTemplateCode: 'TMPL-SUMMARIZE-DISCHARGE',
    governancePolicyCode: 'POL-CLINICAL-SAFETY-001',
    description: 'Inference request attempted to elicit definitive diagnostic verdict; intercepted and blocked by POL-CLINICAL-SAFETY-001 safety boundary.',
    recommendedAction: 'Verify that calling workflow maintains physician-in-the-loop assist mode.',
    status: 'OPEN',
    requiresHumanReview: true,
    detectedAt: '2026-08-29T12:10:00.000Z',
    metadata: {},
    createdAt: '2026-08-29T12:10:00.000Z',
    updatedAt: '2026-08-29T12:10:00.000Z'
  },
  {
    id: 'safe-002',
    eventCode: 'EVT-SAFETY-2026-08-02',
    severity: 'INFO',
    category: 'ROUTINE_PROMPT_DEPRECATION_WARNING',
    modelCode: 'DS-MEDTEXT-EMBED-1',
    description: 'Prompt template TMPL-SEARCH-SEMANTIC-RERANK v1.0.0 scheduled for deprecation in favor of v1.1.0.',
    recommendedAction: 'Migrate active search connector routes to v1.1.0.',
    status: 'RESOLVED',
    requiresHumanReview: false,
    acknowledgedByEmail: 'search.lead@docsearch.internal',
    acknowledgedAt: '2026-08-28T09:00:00.000Z',
    detectedAt: '2026-08-28T08:30:00.000Z',
    metadata: {},
    createdAt: '2026-08-28T08:30:00.000Z',
    updatedAt: '2026-08-28T09:00:00.000Z'
  }
];

export class AIGovernanceRepository {
  private inMemoryModels: any[] = [...DEFAULT_AI_MODELS];
  private inMemoryPolicies: any[] = [...DEFAULT_AI_POLICIES];
  private inMemoryPromptTemplates: any[] = [...DEFAULT_PROMPT_TEMPLATES];
  private inMemoryPromptVersions: any[] = [...DEFAULT_PROMPT_VERSIONS];
  private inMemoryQuotas: any[] = [...DEFAULT_USAGE_QUOTAS];
  private inMemoryRecords: any[] = [...DEFAULT_USAGE_RECORDS];
  private inMemoryTraces: any[] = [...DEFAULT_AUDIT_TRACES];
  private inMemorySafetyEvents: any[] = [...DEFAULT_SAFETY_EVENTS];

  async getModels(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient.select().from(aiModels).orderBy(desc(aiModels.createdAt));
        if (res && res.length > 0) return res;
      } catch {}
    }
    return [...this.inMemoryModels];
  }

  async getModelById(id: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient.select().from(aiModels).where(eq(aiModels.id, id as any));
        if (res && res.length > 0) return res[0];
      } catch {}
    }
    return this.inMemoryModels.find((m) => m.id === id) || null;
  }

  async updateModel(id: string, data: any, dbClient = getDatabase()) {
    const now = new Date().toISOString();
    if (dbClient) {
      try {
        const res = await dbClient.update(aiModels).set({ ...data, updatedAt: new Date() }).where(eq(aiModels.id, id as any)).returning();
        if (res && res.length > 0) return res[0];
      } catch {}
    }
    const idx = this.inMemoryModels.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.inMemoryModels[idx] = { ...this.inMemoryModels[idx], ...data, updatedAt: now };
      return this.inMemoryModels[idx];
    }
    return { id, ...data, updatedAt: now };
  }

  async getPolicies(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient.select().from(aiGovernancePolicies).orderBy(desc(aiGovernancePolicies.createdAt));
        if (res && res.length > 0) return res;
      } catch {}
    }
    return [...this.inMemoryPolicies];
  }

  async getPolicyById(id: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient.select().from(aiGovernancePolicies).where(eq(aiGovernancePolicies.id, id as any));
        if (res && res.length > 0) return res[0];
      } catch {}
    }
    return this.inMemoryPolicies.find((p) => p.id === id) || null;
  }

  async transitionPolicy(id: string, toStatus: string, _reason: string, actorEmail: string, dbClient = getDatabase()) {
    const now = new Date().toISOString();
    if (dbClient) {
      try {
        const res = await dbClient
          .update(aiGovernancePolicies)
          .set({
            status: toStatus,
            approvedAt: toStatus === 'APPROVED' ? new Date() : undefined,
            approvedByEmail: toStatus === 'APPROVED' ? actorEmail : undefined,
            updatedAt: new Date()
          })
          .where(eq(aiGovernancePolicies.id, id as any))
          .returning();
        if (res && res.length > 0) return res[0];
      } catch {}
    }
    const idx = this.inMemoryPolicies.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.inMemoryPolicies[idx] = {
        ...this.inMemoryPolicies[idx],
        status: toStatus,
        approvedAt: toStatus === 'APPROVED' ? now : this.inMemoryPolicies[idx]?.approvedAt,
        approvedByEmail: toStatus === 'APPROVED' ? actorEmail : this.inMemoryPolicies[idx]?.approvedByEmail,
        updatedAt: now
      };
      return this.inMemoryPolicies[idx];
    }
    return { id, status: toStatus, updatedAt: now };
  }

  async getPromptTemplates(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient.select().from(aiPromptTemplates).orderBy(desc(aiPromptTemplates.createdAt));
        if (res && res.length > 0) return res;
      } catch {}
    }
    return [...this.inMemoryPromptTemplates];
  }

  async getPromptTemplateById(id: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient.select().from(aiPromptTemplates).where(eq(aiPromptTemplates.id, id as any));
        if (res && res.length > 0) return res[0];
      } catch {}
    }
    return this.inMemoryPromptTemplates.find((t) => t.id === id) || null;
  }

  async getPromptVersions(promptTemplateId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient
          .select()
          .from(aiPromptVersions)
          .where(eq(aiPromptVersions.promptTemplateId, promptTemplateId as any))
          .orderBy(desc(aiPromptVersions.createdAt));
        if (res && res.length > 0) return res;
      } catch {}
    }
    return this.inMemoryPromptVersions.filter((v) => v.promptTemplateId === promptTemplateId);
  }

  async approvePromptVersion(data: any, actorEmail: string, dbClient = getDatabase()) {
    const now = new Date().toISOString();
    if (dbClient) {
      try {
        const res = await dbClient
          .update(aiPromptVersions)
          .set({
            approvalStatus: data.approvalStatus,
            approvedByEmail: data.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? actorEmail : undefined,
            approvedAt: data.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? new Date() : undefined,
            effectiveAt: data.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? new Date() : undefined
          })
          .where(eq(aiPromptVersions.id, data.promptVersionId as any))
          .returning();
        if (res && res.length > 0) return res[0];
      } catch {}
    }
    const idx = this.inMemoryPromptVersions.findIndex((v) => v.id === data.promptVersionId);
    if (idx !== -1) {
      this.inMemoryPromptVersions[idx] = {
        ...this.inMemoryPromptVersions[idx],
        approvalStatus: data.approvalStatus,
        approvedAt: data.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? now : undefined,
        approvedByEmail: data.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? actorEmail : undefined,
        effectiveAt: data.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? now : undefined
      };
      return this.inMemoryPromptVersions[idx];
    }
    return { id: data.promptVersionId, ...data };
  }

  async getUsageQuotas(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient.select().from(aiUsageQuotas).orderBy(desc(aiUsageQuotas.createdAt));
        if (res && res.length > 0) return res;
      } catch {}
    }
    return [...this.inMemoryQuotas];
  }

  async getUsageRecords(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient.select().from(aiUsageRecords).orderBy(desc(aiUsageRecords.recordedAt));
        if (res && res.length > 0) return res;
      } catch {}
    }
    return [...this.inMemoryRecords];
  }

  async getAuditTraces(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient.select().from(aiAuditTraces).limit(50);
        if (res && res.length > 0) return res;
      } catch {}
    }
    return [...this.inMemoryTraces];
  }

  async getSafetyEvents(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const res = await dbClient.select().from(aiSafetyEvents).orderBy(desc(aiSafetyEvents.detectedAt));
        if (res && res.length > 0) return res;
      } catch {}
    }
    return [...this.inMemorySafetyEvents];
  }

  async acknowledgeSafetyEvent(eventId: string, _reason: string, actorEmail: string, dbClient = getDatabase()) {
    const now = new Date().toISOString();
    if (dbClient) {
      try {
        const res = await dbClient
          .update(aiSafetyEvents)
          .set({
            status: 'ACKNOWLEDGED',
            acknowledgedByEmail: actorEmail,
            acknowledgedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(aiSafetyEvents.id, eventId as any))
          .returning();
        if (res && res.length > 0) return res[0];
      } catch {}
    }
    const idx = this.inMemorySafetyEvents.findIndex((s) => s.id === eventId);
    if (idx !== -1) {
      this.inMemorySafetyEvents[idx] = {
        ...this.inMemorySafetyEvents[idx],
        status: 'ACKNOWLEDGED',
        acknowledgedByEmail: actorEmail,
        acknowledgedAt: now,
        updatedAt: now
      };
      return this.inMemorySafetyEvents[idx];
    }
    return { id: eventId, status: 'ACKNOWLEDGED', acknowledgedAt: now };
  }

  async resolveSafetyEvent(eventId: string, resolutionStatus: string, _notes: string, _actorEmail: string, dbClient = getDatabase()) {
    const now = new Date().toISOString();
    if (dbClient) {
      try {
        const res = await dbClient
          .update(aiSafetyEvents)
          .set({
            status: resolutionStatus,
            updatedAt: new Date()
          })
          .where(eq(aiSafetyEvents.id, eventId as any))
          .returning();
        if (res && res.length > 0) return res[0];
      } catch {}
    }
    const idx = this.inMemorySafetyEvents.findIndex((s) => s.id === eventId);
    if (idx !== -1) {
      this.inMemorySafetyEvents[idx] = {
        ...this.inMemorySafetyEvents[idx],
        status: resolutionStatus,
        updatedAt: now
      };
      return this.inMemorySafetyEvents[idx];
    }
    return { id: eventId, status: resolutionStatus, updatedAt: now };
  }
}

export const aiGovernanceRepository = new AIGovernanceRepository();

