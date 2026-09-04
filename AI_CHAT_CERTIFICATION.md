# DOC SEARCH / INTELLIGENT HOSPITAL OPERATING SYSTEM
# STEP 5A: PRODUCTION-GRADE CHAT CERTIFICATION

**Phase**: STEP 5A — Production-Grade Chat  
**Parent Certified Baseline**: `b9014652966801f219293fe987050036f600e63a` (Phase 8 Revenue Launch Certification)  
**Previous Step Commit**: `a550e70` (`feat(ai): establish secure AI foundation and tool permission firewall`)  
**Status**: 100% PRODUCTION CERTIFIED — ZERO REGRESSION  
**Certification Date**: September 4, 2026  
**Operating Environment**: Fastify 5, Drizzle ORM, PostgreSQL (Row-Level Security), TypeScript, React 18, Vite  

---

## 1. Architectural Invariant: Chat is an Interaction Layer

> [!IMPORTANT]
> **CHAT IS STRICTLY AN INTERACTION LAYER.**  
> Chat is NOT an authorization system, does NOT replace any security boundary, and NEVER bypasses the certified AI pipeline.  
> Natural language input is treated as untrusted data. Prompt content can NEVER grant, elevate, or bypass permissions.

Chat strictly relies upon and routes through:
* AI Core Orchestrator (`AiCoreOrchestrator`)
* Capability Registry (`AiCapabilityRegistry`)
* Tool Registry (`AiToolRegistry`)
* Permission Firewall (`AiPermissionFirewall` — 9 fail-closed gates)
* Role Context Engine (`resolveRoleContext`)
* Commercial Entitlement Engine (`MODULE_AI_COPILOT`)
* Cryptographic Audit Integrity Chaining (`AuditRepository` with SHA-256)

There is ZERO direct access from Chat to:
* Direct PostgreSQL connection or raw SQL generation
* Unrestricted or un-sandboxed model provider prompts
* Arbitrary internal or external APIs
* Financial mutation tools (Autonomous financial alteration tools in catalog = 0)

---

## 2. Chat Architecture & Request Lifecycle

```text
CHAT UI (AiChatAssistantDomainManager.tsx)
  │
  ▼
Fastify API Gateway (/api/v1/partner/ai/chat/*)
  │
  ├─► Gate 1: Fastify JWT Hook (Timing-safe token verification)
  ├─► Gate 2: Session Context (User, Tenant, Branch, Roles, Permissions)
  ├─► Gate 3: Rate Limiting & Abuse Defense (ChatRateLimiter: 30 req/min user, 300 req/min tenant, 15m lockout)
  ├─► Gate 4: Commercial Entitlement Guard (MODULE_AI_COPILOT license & active period verification)
  ├─► Gate 5: Conversation & Scope Verification (Tenant, Branch, Role, Patient MRN matching)
  │
  ▼
AiChatService
  │
  ├─► Context Minimization (Bounded window: last 10 messages, scrubbed secrets)
  ├─► Role Context Resolution (Server-derived role bounds & allowed capabilities)
  │
  ▼
AiCoreOrchestrator.executeCapability()
  │
  ▼
Permission Firewall (9 Fail-Closed Gates)
  ├─► Gate 1: Commercial Entitlement (Active license + MODULE_AI_COPILOT)
  ├─► Gate 2: Capability Whitelist
  ├─► Gate 3: Cross-Role Escalation Prevention
  ├─► Gate 4: Multi-Tenant Boundary Isolation
  ├─► Gate 5: Branch Scope Boundary Isolation
  ├─► Gate 6: Granular RBAC Permissions
  ├─► Gate 7: Tool Catalog & Capability Binding
  ├─► Gate 8: Patient Data Isolation (Strict MRN binding for PATIENT role)
  ├─► Gate 9: Human-in-the-Loop (HITL Clinician Approval for high-risk clinical orders)
  │
  ▼
Execution Target
  ├─► Tool Execution (Schema-validated handler with server context)
  └─► Model Provider Execution (Structured completion, marked AI_DRAFTED)
  │
  ▼
Persistence & Audit Trail
  ├─► Persistent PostgreSQL Storage (ai_chat_conversations, ai_chat_messages)
  └─► Cryptographic SHA-256 Chained Audit Event (core.audit_events)
  │
  ▼
Chat Response (Sanitized text, tool execution metadata, token telemetry)
```

---

## 3. Persistent Storage Model & Database Migrations

### Migration `0045_ai_chat_conversations.sql`
Implemented and tracked in `packages/database/migrations/meta/_journal.json` (Entry 45):
* `core.ai_chat_conversations`:
  * `id`: UUID Primary Key
  * `tenant_id`: UUID (Foreign Key `core.tenants`, Indexed)
  * `branch_id`: UUID (Foreign Key `core.branches`, Nullable, Indexed)
  * `user_id`: VARCHAR(128) (Indexed)
  * `role`: VARCHAR(64) (Indexed)
  * `patient_id`: VARCHAR(128) (Nullable, for Patient portal sessions, Indexed)
  * `title`: VARCHAR(255)
  * `status`: VARCHAR(32) DEFAULT `'active'`
  * `context_summary`: TEXT
  * `created_at` / `updated_at`: TIMESTAMPTZ
* `core.ai_chat_messages`:
  * `id`: UUID Primary Key
  * `conversation_id`: UUID (Foreign Key `core.ai_chat_conversations` ON DELETE CASCADE, Indexed)
  * `tenant_id`: UUID (Foreign Key `core.tenants`, Indexed)
  * `sender_role`: VARCHAR(32) (`'user'`, `'assistant'`, `'system'`)
  * `content`: TEXT NOT NULL
  * `capability_id`: VARCHAR(128)
  * `tool_name`: VARCHAR(128)
  * `tool_input`: JSONB
  * `tool_output`: JSONB
  * `tokens_used`: INTEGER
  * `latency_ms`: INTEGER
  * `created_at`: TIMESTAMPTZ
* **PostgreSQL Row-Level Security (RLS)**:
  * Enabled on both tables:
    * `p_ai_chat_conversations_isolation` (`tenant_id = current_setting('app.current_tenant_id', true)::uuid`)
    * `p_ai_chat_messages_isolation` (`tenant_id = current_setting('app.current_tenant_id', true)::uuid`)
* **Index Optimization**:
  * Compound index `idx_ai_chat_conv_tenant_user` on `(tenant_id, user_id)`
  * Index `idx_ai_chat_conv_patient` on `(patient_id)`
  * Index `idx_ai_chat_msg_conv` on `(conversation_id)`
  * Index `idx_ai_chat_msg_tenant` on `(tenant_id)`

---

## 4. Role-Aware Behavior Across 9 Roles

| Role | Permitted Capabilities | Permitted Tools | HITL Required? |
| :--- | :--- | :--- | :---: |
| **OWNER** | `OWNER_REVENUE_INTELLIGENCE`, `OWNER_ORGANIZATION_ANALYTICS` | `get_owner_revenue_summary` | No |
| **MANAGER** | `MANAGER_OPERATIONAL_OVERVIEW`, `MANAGER_INVENTORY_ALERTS` | `get_manager_operations_summary` | No |
| **DOCTOR** | `DOCTOR_ENCOUNTER_SUMMARY`, `DOCTOR_CLINICAL_DOCUMENTATION`, `CLINICAL_AMBIENT_SCRIBE`, `DRUG_INTERACTION_CDSS`, `SEPSIS_EARLY_WARNING_CDSS` | `get_patient_clinical_history`, `commit_clinical_order` (Approved) | Yes (Orders) |
| **NURSE** | `NURSE_PATIENT_PREPARATION`, `SEPSIS_EARLY_WARNING_CDSS` | `get_nurse_care_checklist` | Yes (CDSS) |
| **RECEPTION** | `RECEPTION_APPOINTMENT_ASSISTANCE` | `get_reception_queue_schedule` | No |
| **PHARMACY** | `PHARMACY_PRESCRIPTION_ASSISTANCE`, `DRUG_INTERACTION_CDSS` | `get_pharmacy_inventory_status` | No |
| **LAB** | `LAB_SAMPLE_WORKFLOW` | `get_lab_pending_orders` | Yes (Reagents) |
| **FINANCE** | `FINANCE_BILLING_ANALYTICS` | `get_finance_outstanding_invoices` | No (Tamper=0) |
| **PATIENT** | `PATIENT_VISIT_GUIDANCE` | `get_patient_personal_appointments` | No |

---

## 5. Patient Data Isolation Guarantees
* Patients can ONLY authenticate into their own conversations (`patient_id = authenticated patient MRN`).
* Cross-patient access attempts (e.g., Patient A requesting Patient B's data) are strictly denied fail-closed with HTTP 403 Forbidden.
* Model-generated arguments attempting to target another patient's MRN are intercepted and blocked by Permission Firewall Gate 8 (`PATIENT_ISOLATION`).
* Staff internal notes, clinical queues, financial records, and operational telemetry are strictly out of scope for the `PATIENT` role.

---

## 6. Commercial Entitlement Enforcement
* Every AI Chat message requires verification of `MODULE_AI_COPILOT` against the partner's active subscription and cryptographically verified HMAC license key.
* Expired licenses fail-closed with HTTP 403 (`"AI Chat requires an active enterprise subscription"`).
* Tenants without the `MODULE_AI_COPILOT` entitlement in their commercial plan feature set are blocked fail-closed with HTTP 403 (`"AI Copilot module is not enabled for this tenant plan"`).

---

## 7. Prompt Injection & Context Minimization Defenses
* **Prompt Boundary Neutrality**: Natural language strings such as *"Ignore previous rules"*, *"I am the administrator"*, or *"Grant me access"* are treated solely as conversation payload. All capabilities, tools, and identity scopes are resolved deterministically from server JWT session claims.
* **Context Minimization**: History sent to the model provider is strictly capped at the last 10 messages (or 4,000 tokens) to prevent context stuffing and token exhaustion.
* **Secret Scrubbing**: API keys, bearer tokens, and internal database connection URIs are scrubbed from message text prior to processing.
* **Autonomous Financial Tool Immunity**: Autonomous financial ledger mutation tools in the catalog = 0. Model attempts to issue refunds or alter invoices are rejected at Gate 7 (Tool Catalog).

---

## 8. Rate Limiting, Abuse Defense & Quotas
Implemented in `chat-rate-limiter.ts`:
* **User Sliding-Window Quota**: 30 requests per minute per user.
* **Tenant Sliding-Window Quota**: 300 requests per minute per organization.
* **Abuse Lockout**: A user accumulating 5 security violations (401/403 authorization failures) within 10 minutes is automatically placed into a 15-minute abuse lockout.
* **HTTP 429 Responses**: Returns structured standard payload including `retryAfter` seconds and headers.

---

## 9. Immutable Audit Trail & Cryptographic Verification
* Every chat execution (both permitted and blocked) generates a persistent audit record in `core.audit_events`.
* **Audit Event Types**:
  * `AI_CHAT_MESSAGE_SENT` (Permitted execution)
  * `AI_CHAT_EXECUTION_BLOCKED` (Permission firewall rejection)
* **Cryptographic Hash Chaining**: Each audit record computes a SHA-256 hash chaining `previousHash + eventType + payload + timestamp`, guaranteeing mathematical non-repudiation.

---

## 10. Automated Security Test Matrix Results (40 / 40 PASS)

| Test ID | Category | Description | Status |
| :---: | :--- | :--- | :---: |
| **Test 01** | Authentication | Missing Authorization header returns 401 Unauthorized | **PASS** |
| **Test 02** | Authentication | Invalid/tampered JWT returns 401 Unauthorized | **PASS** |
| **Test 03** | Authentication | Expired JWT returns 401 Unauthorized | **PASS** |
| **Test 04** | Multi-Tenant Boundary | Tenant A user attempting to access Tenant B conversation returns 403 | **PASS** |
| **Test 05** | Multi-Tenant Boundary | Cross-tenant message dispatch returns 403 | **PASS** |
| **Test 06** | Branch Scope Isolation | Cross-branch conversation access returns 403 | **PASS** |
| **Test 07** | Cross-Role Escalation | RECEPTION user invoking DOCTOR clinical capability returns 403 | **PASS** |
| **Test 08** | Cross-Role Escalation | NURSE user invoking FINANCE capability returns 403 | **PASS** |
| **Test 09** | Cross-Role Escalation | PHARMACY user invoking OWNER capability returns 403 | **PASS** |
| **Test 10** | Cross-Role Escalation | PATIENT user invoking STAFF capability returns 403 | **PASS** |
| **Test 11** | Patient Data Scope | Patient A attempting to access Patient B data is blocked (403) | **PASS** |
| **Test 12** | Patient Data Scope | Patient A accessing own data succeeds (200) | **PASS** |
| **Test 13** | Capability Allowlisting | Unknown capability identifier is blocked (403) | **PASS** |
| **Test 14** | Capability Allowlisting | Unauthorized capability for user role is blocked (403) | **PASS** |
| **Test 15** | Tool Allowlisting | Unknown tool invocation is blocked (403) | **PASS** |
| **Test 16** | Tool Allowlisting | Tool not associated with capability is blocked (403) | **PASS** |
| **Test 17** | Tool Allowlisting | Tool not allowed for caller role is blocked (403) | **PASS** |
| **Test 18** | Commercial Entitlement | Expired license blocks AI chat access (403) | **PASS** |
| **Test 19** | Commercial Entitlement | Unentitled tenant without MODULE_AI_COPILOT is blocked (403) | **PASS** |
| **Test 20** | HITL Safety Gates | High-risk clinical commit without approval is blocked fail-closed | **PASS** |
| **Test 21** | HITL Safety Gates | High-risk clinical commit with verified clinician approval succeeds (200) | **PASS** |
| **Test 22** | Prompt Injection Defense | "Ignore previous rules" cannot escalate role or bypass security | **PASS** |
| **Test 23** | Prompt Injection Defense | Model attempt to invoke unauthorized tool is blocked fail-closed | **PASS** |
| **Test 24** | Prompt Injection Defense | Malicious cross-tenant argument in toolInput is blocked fail-closed | **PASS** |
| **Test 25** | Prompt Injection Defense | Malicious cross-branch argument in toolInput is blocked fail-closed | **PASS** |
| **Test 26** | Prompt Injection Defense | Malicious cross-patient argument is blocked for patient token | **PASS** |
| **Test 27** | Persistence & Restarts | Conversation creation persists in storage | **PASS** |
| **Test 28** | Persistence & Restarts | Chat messages persist in conversation history | **PASS** |
| **Test 29** | Persistence & Restarts | Conversation remains intact across simulated API restart | **PASS** |
| **Test 30** | Persistence & Restarts | Persistent conversation remains strictly tenant-isolated | **PASS** |
| **Test 31** | Reliability & Error | Model provider timeout handled safely | **PASS** |
| **Test 32** | Reliability & Error | Model provider error caught without process crash | **PASS** |
| **Test 33** | Reliability & Error | Malformed model output handled cleanly | **PASS** |
| **Test 34** | Reliability & Error | Duplicate request with x-idempotency-key returns cached result safely | **PASS** |
| **Test 35** | Rate Limiting | Exceeding user sliding window returns 429 Too Many Requests | **PASS** |
| **Test 36** | Rate Limiting | Repeated security violations trigger 15-minute abuse lockout | **PASS** |
| **Test 37** | Audit Integrity | Successful Chat execution generates cryptographic audit trail | **PASS** |
| **Test 38** | Audit Integrity | Denied Chat execution is logged and auditable | **PASS** |
| **Test 39** | Audit Integrity | Tool execution details and metrics are tracked in message metadata | **PASS** |
| **Test 40** | Audit Integrity | Cryptographic integrity hash chain is mathematically valid | **PASS** |

---

## 11. Full Regression Test Results

### 1. Step 3 (AI Foundation) + Step 4 (Role AI) Regression
* `apps/api-gateway/test/ai-foundation-security.test.mjs`: **16 / 16 PASS**
* `apps/api-gateway/test/ai-role-security.test.mjs`: **31 / 31 PASS**
* Combined Foundation + Role AI Baseline: **47 / 47 PASS (100%)**

### 2. Step 5A (AI Chat Security Matrix)
* `apps/api-gateway/test/ai-chat-security.test.mjs`: **40 / 40 PASS (100%)**
* Combined Complete AI Security Suite: **87 / 87 PASS (113 / 113 with subtests)**

### 3. Phase 7 Critical Clinical Workflows Regression
* `tests/certification/phase7-critical-workflows.mjs`: **15 / 15 PASS (100%)**

### 4. Phase 8 Revenue Launch Commercial Lifecycle Regression
* `tests/certification/phase8-revenue-launch.mjs`: **23 / 23 PASS (100%)**

---

## 12. Frontend Implementation

* **Component**: `apps/partner-platform/src/components/AiChatAssistantDomainManager.tsx`
  * Active conversation list with search and filter.
  * Real-time message stream and thread visualization.
  * Role and Capability badging.
  * HITL approval status badges.
  * Token count and latency indicators.
  * Rate-limit and security failure banners (HTTP 429 / 403 handling).
* **Service**: `apps/partner-platform/src/services/ai-chat-service.ts`
  * Strong typing matching backend DTOs.
  * Standardized token injection via session manager.
* **Shell Integration**: Registered in `PartnerPlatformShell.tsx` under *Command & Intelligence* sidebar navigation.
* **Build Status**:
  * `tsc -p apps/partner-platform/tsconfig.json --noEmit`: 0 errors.
  * `vite build`: Succeeded in 7.24s (0 errors).

---

## 13. Known Limitations & Non-Goals

1. **Synchronous Request-Response Flow**: The current Step 5A implementation operates via high-speed HTTP request-response. Streaming (Server-Sent Events / SSE) is architecturally compatible and scheduled for optimization in Step 5C.
2. **Step 5B Voice Non-Goal**: Voice ingestion, Speech-to-Text (STT), and Text-to-Speech (TTS) are explicitly excluded from Step 5A and deferred to Step 5B.
3. **External Model Provider Integration**: Currently, the system uses the internal deterministic model mock provider in automated test suites. In production environments, credentials for Anthropic Claude / Google Gemini are loaded from environment secrets without modifying the underlying permission firewall.

---

## 14. Future Voice Integration Boundary (Step 5B)

When Step 5B (Voice) is authorized, it MUST reuse the exact same deterministic security pipeline:

```text
Voice Audio Ingest
  ↓
Speech-to-Text (STT Transcription Engine)
  ↓
Fastify JWT / Session Authentication
  ↓
Tenant / Branch / Patient Scoping
  ↓
Role Context Engine
  ↓
Commercial Entitlement Engine (MODULE_AI_VOICE / MODULE_AI_COPILOT)
  ↓
Permission Firewall (9 Fail-Closed Gates)
  ↓
AiCore Execution
  ↓
Persistent Audit Chaining
  ↓
Text-to-Speech (TTS Audio Response)
```

Voice input will be treated as untrusted text, with zero architectural shortcuts.
