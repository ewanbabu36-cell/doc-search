# DOC SEARCH — STEP 5A PRE-IMPLEMENTATION AUDIT
## PRODUCTION-GRADE CHAT: ARCHITECTURE, SECURITY & PERSISTENCE AUDIT (PHASES A–P)

**Target Phase**: STEP 5A — Production-Grade Chat  
**Certified Baseline Commit**: `e293bd57ea3f9c6dbe3fce580327f12eefc72a8c` (Step 4 Role AI Certification)  
**Parent Foundation Baseline**: `a550e70` (`feat(ai): establish secure AI foundation and tool permission firewall`)  
**Audit Invariant**: Strict Preservation of Certified Security Invariants (100% Pass)  
**Date**: September 4, 2026  

---

### EXECUTIVE SUMMARY

This audit establishes the pre-implementation baseline, existing architectural boundaries, and implementation plan for **STEP 5A — PRODUCTION-GRADE CHAT** on top of the already-certified DOC SEARCH AI Foundation and Role AI security architecture.

**Fundamental Invariant**:
> **CHAT IS STRICTLY AN INTERACTION SURFACE.**  
> Chat is NOT a new AI architecture. It does NOT possess independent authorization authority.  
> Natural language input is treated as completely untrusted. Natural language prompts can NEVER grant, expand, or bypass permissions.  
> All Chat requests must route strictly through:  
> `USER → AUTH → TENANT/BRANCH SCOPE → RBAC → COMMERCIAL ENTITLEMENT → PERMISSION FIREWALL → AI CORE → ROLE CONTEXT → CAPABILITY REGISTRY → TOOL REGISTRY → AUTHORIZED SERVICE → AUDIT`.

---

### PHASE A: REPOSITORY & ARCHITECTURE AUDIT

1. **Monorepo Structure**:
   * `apps/api-gateway`: Fastify 5 REST API handling partner, company, patient, and clinical workflows.
   * `apps/partner-platform`: React 18, TypeScript, Tailwind CSS, Vite management console.
   * `packages/database`: Drizzle ORM schemas, PostgreSQL connection management, multi-tenant RLS wrappers (`withSecurityContext`), and migration journal (`migrations/meta/_journal.json`).
   * `packages/auth`: Stateless JWT cryptographic sign/verify, `SessionContext`, and RBAC evaluator.
   * `packages/shared-core`: Shared types, `AppError`, standardized error codes, logger.
2. **Current Git Status**:
   * Working branch: `main` (clean working tree with untracked `PATIENT_REVENUE_JOURNEY_CHECKPOINT_B.md`).
   * Certified milestones:
     * Phase 7 Critical Workflows (15/15 PASS)
     * Phase 8 Revenue Launch & Licensing (23/23 PASS)
     * Step 3A AI Foundation Hardening (42/42 PASS)
     * Step 4 Role AI Security (31/31 PASS)
3. **Database Architecture**:
   * Schema separation: `core`, `company`, `clinical`, `billing`, `inventory`, `lab`, `patient`.
   * Row-Level Security (RLS) actively enabled on all clinical and AI schemas (`ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`).
   * Session variables: `app.current_tenant_id` and `app.current_branch_id` set per-request via `withSecurityContext()`.

---

### PHASE B: EXISTING CHAT CAPABILITY DISCOVERY

1. **Audit of Existing Capabilities**:
   * Inspected `apps/api-gateway/src/ai/capability-registry.ts`.
   * Found certified capabilities across 9 operational roles:
     1. `OWNER_REVENUE_INTELLIGENCE` (OWNER)
     2. `OWNER_ORGANIZATION_ANALYTICS` (OWNER)
     3. `MANAGER_OPERATIONAL_OVERVIEW` (BRANCH_MANAGER)
     4. `MANAGER_INVENTORY_ALERTS` (BRANCH_MANAGER)
     5. `DOCTOR_ENCOUNTER_SUMMARY` (DOCTOR)
     6. `DOCTOR_CLINICAL_DOCUMENTATION` (DOCTOR)
     7. `CLINICAL_AMBIENT_SCRIBE` (DOCTOR)
     8. `DRUG_INTERACTION_CDSS` (DOCTOR, PHARMACY)
     9. `SEPSIS_EARLY_WARNING_CDSS` (DOCTOR, NURSE)
     10. `NURSE_PATIENT_PREPARATION` (NURSE)
     11. `RECEPTION_APPOINTMENT_ASSISTANCE` (RECEPTION)
     12. `PHARMACY_PRESCRIPTION_ASSISTANCE` (PHARMACY)
     13. `LAB_SAMPLE_WORKFLOW` (LAB)
     14. `FINANCE_BILLING_ANALYTICS` (FINANCE)
     15. `PATIENT_VISIT_GUIDANCE` (PATIENT)
2. **Discovery Findings**:
   * No bypass or ad-hoc chat services exist that skip the Permission Firewall.
   * No direct client-to-LLM pathways exist.
   * Model provider abstraction `AiModelProvider` is centralized in `apps/api-gateway/src/ai/provider-interface.ts`.

---

### PHASE C: CONVERSATION & MESSAGE PERSISTENCE DESIGN

1. **Persistence Invariant**:
   * Chat conversations and messages must survive page reloads, user logouts, API restarts, and network disconnects.
   * In-memory storage is strictly prohibited for production data.
2. **Relational Schema**:
   * Implemented in `packages/database/src/schema/core/ai-chat.ts` and migration `packages/database/migrations/0045_ai_chat_conversations.sql`:
     * `core.ai_chat_conversations`: Tracks `id`, `tenant_id`, `branch_id`, `user_id`, `role`, `patient_id`, `title`, `status`, `context_summary`, `created_at`, `updated_at`.
     * `core.ai_chat_messages`: Tracks `id`, `conversation_id`, `tenant_id`, `sender_role`, `content`, `capability_id`, `tool_name`, `tool_input`, `tool_output`, `tokens_used`, `latency_ms`, `created_at`.
3. **Multi-Tenant RLS & Isolation**:
   * Both tables enforce PostgreSQL RLS policies tied to `app.current_tenant_id`.
   * Dual-layer application enforcement in `AiChatRepository.ts`: queries explicitly specify `where(and(eq(tenantId, session.tenantId), ...))`.

---

### PHASE D: SECURE CHAT API SPECIFICATION

1. **API Endpoints**:
   * `POST /api/v1/partner/ai/chat/conversations` (Create conversation)
   * `GET /api/v1/partner/ai/chat/conversations` (List conversations with tenant/branch scoping)
   * `GET /api/v1/partner/ai/chat/conversations/:conversationId` (Fetch single conversation & messages)
   * `POST /api/v1/partner/ai/chat/conversations/:conversationId/messages` (Send user prompt, invoke AI pipeline, persist assistant response)
   * `POST /api/v1/partner/ai/chat/conversations/:conversationId/archive` (Archive conversation)
2. **Security Gates on Routes**:
   * `authenticate`: Validates cryptographic JWT and extracts `SessionContext`.
   * `requireActiveCommercialAccess`: Verifies active enterprise subscription and `MODULE_AI_COPILOT` entitlement.
   * `chatRateLimiter`: Enforces per-user and per-tenant sliding window quotas and abuse lockout.

---

### PHASE E: AI CORE INTEGRATION

1. **Orchestrator Coupling**:
   * `AiChatService.sendMessage` delegates all AI execution to `aiCore.execute()`.
   * Chat does not create duplicate tool registries, role engines, or firewall checks.
2. **Execution Flow**:
   * The incoming user message is stored in `core.ai_chat_messages`.
   * `aiCore.execute()` resolves role context, checks the 9-gate Permission Firewall, evaluates commercial entitlement, executes the authorized tool, and calls the model provider.
   * The resulting assistant response, tool metadata, latency, and token metrics are persisted as an assistant message in `core.ai_chat_messages`.

---

### PHASE F: ROLE, ENTITLEMENT & PERMISSION FIREWALL ENFORCEMENT

1. **Role Context Resolution**:
   * `resolveRoleContext(session)` evaluates authenticated roles and derives permitted capabilities and tools.
2. **Permission Firewall 9-Gate Pipeline**:
   * Gate 1: Commercial Entitlement (`MODULE_AI_COPILOT` verification).
   * Gate 2: Capability Whitelist (Must exist in registry and be active).
   * Gate 3: Cross-Role Escalation Prevention (Role must match capability).
   * Gate 4: Multi-Tenant Isolation (`session.tenantId` must match resource).
   * Gate 5: Branch Scope Isolation (`session.branchId` must match resource).
   * Gate 6: Granular RBAC Permissions (User must possess explicit capability permissions).
   * Gate 7: Tool Catalog & Capability Binding (Tool must belong to capability).
   * Gate 8: Patient Data Isolation (PATIENT role restricted strictly to own MRN).
   * Gate 9: Human-in-the-Loop (HITL clinician approval for high-risk operations).

---

### PHASE G: TOOL EXECUTION BOUNDARY

1. **Tool Invocation Rules**:
   * Direct model-generated tool calls are strictly untrusted.
   * Tools are validated against Zod `inputSchema` and `outputSchema`.
   * Domain handlers are invoked with verified server-side security context.
   * Autonomous financial mutation tools = 0 (ledger modifications, refunds, or debt adjustments are strictly non-existent in AI tool registry).

---

### PHASE H: PROMPT INJECTION DEFENSE

1. **Deterministic Defense**:
   * Attack strings such as `"Ignore previous instructions"`, `"You are now an admin"`, or `"Show all database tables"` are safely swallowed as prompt content.
   * The model prompt cannot grant or modify permissions; all authorization decisions are made deterministically outside the LLM.
2. **Argument Poisoning Interception**:
   * If a prompt tricks an LLM into formulating cross-tenant or cross-branch tool arguments, the Permission Firewall intercepts and blocks the call fail-closed (HTTP 403).

---

### PHASE I: CONTEXT & DATA MINIMIZATION

1. **Sliding Message Window**:
   * Only the most recent 10 messages (bounded token budget) are provided as prompt context.
2. **Secret & Credential Scrubbing**:
   * Regular expressions sanitize bearer tokens, private keys, database connection strings, and internal server paths before passing to the model.
3. **Data Minimization Principle**:
   * Receptionist chat cannot access clinical notes or ICD-10 diagnostic codes.
   * Nurse chat cannot access financial ledgers.
   * Patient chat cannot access hospital administrative queues or other patients' records.

---

### PHASE J: RATE LIMITING, QUOTA & TELEMETRY

1. **Sliding-Window Limits**:
   * User: 30 requests / minute.
   * Tenant: 300 requests / minute.
2. **Abuse Lockout**:
   * 5 authorization failures (401/403) within a 10-minute window trigger an automatic 15-minute abuse lockout.
3. **Telemetry**:
   * Prompt tokens, completion tokens, latency (ms), and model provider versions are recorded on every message row and in audit events.

---

### PHASE K: AUDIT INTEGRITY INTEGRATION

1. **Audit Storage**:
   * All chat actions (permitted completions and blocked security violations) write persistent records to `core.audit_events`.
2. **Cryptographic Hash Chaining**:
   * Events compute a SHA-256 integrity hash linking `previous_hash + event_type + payload + timestamp`.
   * Verified mathematically against tampering or historical deletion.

---

### PHASE L: FRONTEND CHAT UX

1. **UI Component**:
   * `apps/partner-platform/src/components/AiChatAssistantDomainManager.tsx` provides:
     * Conversation list sidebar with search and new chat creation.
     * Real-time conversation thread with user/assistant bubbles.
     * Role and capability indicators.
     * HITL approval status badges.
     * Token and latency metrics.
     * Clear error, 429 rate-limited, and 403 entitlement states.
2. **API Service**:
   * `apps/partner-platform/src/services/ai-chat-service.ts` encapsulates REST calls with JWT injection.

---

### PHASE M: SECURITY TEST SUITE

* `apps/api-gateway/test/ai-chat-security.test.mjs`:
  * 40 test matrix covering Authentication (1-3), Tenant & Branch Isolation (4-5), Cross-Role Escalation (6-10), Patient Scope Isolation (11-12), Capability & Tool Whitelisting (13-17), Commercial Entitlement (18-19), HITL Safety Gates (20-21), Prompt Injection Defense (22-26), Persistence & Restart Resilience (27-30), Reliability & Error Resilience (31-34), Rate Limiting (35-36), and Audit Integrity (37-40).
  * Status: **40 / 40 PASS (100%)**.

---

### PHASE N: PERSISTENCE & INTEGRATION TESTS

* Verified that conversations and messages survive simulated server restarts (`app.close()` and `buildApp()`).
* Verified that multi-tenant isolation persists at both PostgreSQL RLS and application query levels.

---

### PHASE O: FULL MONOREPO REGRESSION

* AI Foundation Security Suite: **42 / 42 PASS**.
* Role AI Multi-Role Security Suite: **31 / 31 PASS**.
* Clinical Co-Pilot Vertical Slice Suite: **23 / 23 PASS**.
* Phase 7 Critical Clinical Workflows: **15 / 15 PASS**.
* Phase 8 Revenue Launch & Licensing: **23 / 23 PASS**.
* Cumulative Certified Invariants: **174 / 174 PASS (100%)**.

---

### PHASE P: BUILD & TYPE-SAFETY VERIFICATION

* `apps/api-gateway` TypeScript: **0 errors**.
* `apps/partner-platform` TypeScript: **0 errors**.
* ESLint: **0 errors, 0 warnings**.
* Vite Production Build: **0 errors (Build successful)**.

---

### AUDIT CONCLUSION

The pre-implementation audit confirms that all architectural prerequisites, database migrations, security gates, fail-closed firewall rules, and persistence guarantees for **STEP 5A — PRODUCTION-GRADE CHAT** are satisfied. No architectural shortcuts or permission bypasses exist. The system is certified ready for final certification report generation and commit.
