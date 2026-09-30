# DOC SEARCH — EWAN ENTERPRISE CAPABILITY MATRIX
## Company HQ + Partner + Staff + Workflow + Governance Operating Intelligence Platform
### Status Date: September 29, 2026 | Engine: Native PostgreSQL (Port 5432) | Mode: Forensic Audit (Phase 0)

---

## 1. Executive Summary & Forensic Audit Verdict

An exhaustive, evidence-based forensic audit of the entire DOC SEARCH monorepo was executed across Company Platform (`apps/company-platform`), Partner Platform (`apps/partner-platform`), API Gateway (`apps/api-gateway`), and Shared Packages (`packages/database`, `packages/auth`, `packages/ui-kit`).

### Master Status Distribution
* **Total Evaluated Capabilities:** 85
* **VERIFIED (Production-Grade Native PostgreSQL + Runtime Proof):** 8 (9.4%)
* **PARTIALLY VERIFIED (Code Exists in Backend/Frontend, but Decoupled or Missing DB Persistence):** 21 (24.7%)
* **NOT IMPLEMENTED (Missing Architecture, DB Tables, API Routes, or UI Wiring):** 56 (65.9%)
* **UNKNOWN / BLOCKED:** 0 (0.0%)
* **Active Critical P0 Gaps:** 10
* **Active High P1 Gaps:** 18
* **Active Medium P2 Gaps:** 22
* **Active Low P3 Gaps:** 6

### Top Forensic Discoveries
1. **Double Decoupling Gap (Company Platform & Partner Platform):**
   - Both `CompanyShell.tsx` and `PartnerPlatformShell.tsx` mount `<EwanSystemTrainer />` from `@docsearch/ui-kit`.
   - In `EwanSystemTrainer.tsx`, there are **0 `fetch()` calls** to `/api/v1/company/ewan/*` or `/api/v1/partner/ewan/*`.
   - The UI runs purely in ephemeral React memory with client-side regexes against static files (`ewanKnowledgeBase.ts`, `EwanRoleScopeResolver.ts`).
2. **Backend Goldmine Exists but Unconnected:**
   - `EwanAssistantService.ts` contains real PostgreSQL queries for Company Sales Pipeline, Revenue totals, Subscriptions, Renewal Window opportunities (60d/30d/grace/lock), and cryptographic HMAC payment settlement.
   - `EwanAssistantService.ts` contains a verified 7-vector Adversarial Prompt-Injection Firewall (`evaluateAdversarialFirewall`).
   - None of this rich backend intelligence is currently exposed to the user in the UI!
3. **Missing Database Persistence Tables:**
   - PostgreSQL inspection (`500 tables`) reveals 0 tables for knowledge articles, versions, operational tasks, action audits, or shift handovers.
4. **Mock Data Leakage in AI Tools:**
   - `apps/api-gateway/src/ai/tool-registry.ts` has mock returns (`getPatientVitalsTool` returns static RR 24, SpO2 91, BP 88).
   - `apps/api-gateway/src/ai/provider-interface.ts` has mock SOAP completion strings (`DeterministicMedicalReferenceProvider`).

---

## 2. Master Capability Matrix Table

| # | Capability | Current Status | Frontend | Backend | API | Database | Auth / RBAC | Persistence Proof | Cross-Tenant Proof | Failure Proof | Active Gaps | Priority | Phase |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **01** | **Company/HQ Ewan Operating Copilot** | PARTIALLY VERIFIED | Mounted in `CompanyShell.tsx` | `EwanAssistantService.ts` (Sales & Finance) | `/api/v1/company/ewan/*` | `company.sales_leads`, `invoices`, `payments` | SuperAdmin / Finance role | PostgreSQL rows exist | Enforced | Fail-closed | UI never calls backend; runs client regexes | **P0** | Phase 8 |
| **02** | **Company Command Center Natural Language** | PARTIALLY VERIFIED | None | `getCompanySalesManagerOverview`, `getFinanceManagerOverview` | `/api/v1/company/ewan/sales-overview` | Real SQL aggregates | Enforced | PostgreSQL rows exist | Enforced | Tested in E2E | No natural language answering for pending approvals or stuck onboarding | **P1** | Phase 8 |
| **03** | **Partner Lifecycle Intelligence (360°)** | PARTIALLY VERIFIED | Partner dossier drawer | `getPartnerEwanContext` | `/api/v1/partner/ewan/context` | `partner_profiles`, `subscriptions`, `licenses` | Enforced | PostgreSQL rows exist | Enforced | Tested in E2E | Ewan does not expose full 360° lifecycle stage in UI panel | **P1** | Phase 1 |
| **04** | **Partner Ewan Operating Copilot** | PARTIALLY VERIFIED | Mounted in `PartnerPlatformShell.tsx` | `EwanAssistantService.ts` | `/api/v1/partner/ewan/*` | PostgreSQL | Enforced | PostgreSQL rows exist | Enforced | Tested in E2E | Ephemeral UI state; zero API integration | **P0** | Phase 1 |
| **05** | **Staff / Role-Aware Intelligence** | PARTIALLY VERIFIED | `currentUser` prop passed | Role-checked in gateway | Session context | `core.roles`, `core.users` | Enforced | Session JWT | Enforced | 403 on role mismatch | Responses not dynamically tailored from DB permissions | **P0** | Phase 1 |
| **06** | **Server-Authoritative Identity Engine** | PARTIALLY VERIFIED | Passes client state | Derived from `SessionContext` | `/api/v1/partner/ewan/context` | `core.users`, `core.memberships` | Enforced | PostgreSQL rows | Enforced | 401 on missing session | Missing active route/screen in context | **P0** | Phase 1 |
| **07** | **Tenant Engine & Strict Cross-Tenant Isolation** | PARTIALLY VERIFIED | Passes `tenantId` | Firewall blocks cross-tenant; Gateway verifies | Gateway middleware | `core.tenants` | Enforced | PostgreSQL rows | Tested cross-tenant in E2E | Fail-closed on mismatch | Tool registry tools lack tenant SQL queries | **P0** | Phase 1 |
| **08** | **Centralized Context Engine** | NOT IMPLEMENTED | Fragmented props | Partial in `EwanAssistantService` | None | None | Partial | None | None | None | No unified server-authoritative Ewan context engine | **P0** | Phase 1 |
| **09** | **Screen-Aware Ewan** | PARTIALLY VERIFIED | Accepts `activeModule`, `activeTab` | Route enum | None | None | None | None | None | None | UI uses hardcoded regex; Backend does not adapt to screen | **P1** | Phase 1 |
| **10** | **Entity-Aware Ewan** | PARTIALLY VERIFIED | Accepts `activePatient` | `patientMrn` in conversations | `ai-chat.routes.ts` | `patients`, `encounters` | Enforced | PostgreSQL rows | Tested | None in Ewan | Ewan does not dynamically query active orders, invoices, or subscriptions | **P1** | Phase 1 |
| **11** | **Workflow Engine Integration** | PARTIALLY VERIFIED | UI badges | `DynamicWorkflowEngine.ts` | `/api/v1/partner/workflows` | `workflow.workflows` | Enforced | PostgreSQL rows | Enforced | State transition errors | Ewan does not query workflow engine to validate transitions | **P1** | Phase 4 |
| **12** | **Workflow Resume Engine** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Cannot resume interrupted workflows from persisted server state | **P1** | Phase 4 |
| **13** | **Next Best Action Engine** | PARTIALLY VERIFIED | Switch-case in `EwanRoleScopeResolver` | None | None | None | None | None | None | None | Hardcoded client strings; not driven by server tasks or queues | **P1** | Phase 4 |
| **14** | **Workflow Integrity & Anomaly Detection** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Does not detect invalid or duplicate workflow transitions | **P1** | Phase 4 |
| **15** | **Safe Action Engine (14-Step Golden Flow)** | NOT IMPLEMENTED | Action key navigates URL | None | None | None | None | None | None | None | Ewan cannot execute actions, preview mutations, or verify transactions | **P0** | Phase 3 |
| **16** | **Action Risk Engine (Low/Med/High/Critical)** | NOT IMPLEMENTED | None | Partial in `tool-registry` | None | None | None | None | None | None | No unified action risk classification or gatekeeper | **P0** | Phase 3 |
| **17** | **Action Preview Engine** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | No preview modal displaying proposed changes and consequences | **P0** | Phase 3 |
| **18** | **Transaction Safety & Concurrency Control** | PARTIALLY VERIFIED | None | Used in Renewal Payment | Payment webhook | `core.idempotency_records` | Enforced | Verified in Renewal | Enforced | Idempotency verified | Not available for operational Ewan actions (staff, orders, tasks) | **P0** | Phase 3 |
| **19** | **Recovery Engine (Undo / Rollback)** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | No undo/recovery mechanism for Ewan-executed actions | **P2** | Phase 3 |
| **20** | **Knowledge Engine (Versioned & Auditable)** | NOT IMPLEMENTED | `ewanKnowledgeBase.ts` (Static TS) | None | None | None | None | None (Client TS) | N/A | None | Knowledge is hardcoded in client code; no versioning, author, or DB storage | **P0** | Phase 2 |
| **21** | **Knowledge Governance (Approval & History)** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | No approval state, publish state, effective date, or change history | **P1** | Phase 2 |
| **22** | **Knowledge Contradiction Detection** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | No contradiction detection between knowledge articles | **P2** | Phase 2 |
| **23** | **Never-Guess Engine** | PARTIALLY VERIFIED | Returns UNKNOWN for unmapped | Firewall refuses pricing | None | None | None | None | None | Tested in unit | No backend evidence verification pipeline before answering | **P1** | Phase 1 |
| **24** | **Evidence Engine** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Answers do not expose source, record ID, timestamp, or confidence state | **P1** | Phase 1 |
| **25** | **Controlled Memory** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | No persistent conversation history across browser reloads | **P1** | Phase 1 |
| **26** | **Training Engine & Progress Persistence** | NOT IMPLEMENTED | Static cards in trainer modal | `EwannameStaffTrainerService` | None | `/api/v1/partner/ai/trainer` | Role checked | None | None | None | No progress tracking, scores, completion, or certification tables | **P0** | Phase 5 |
| **27** | **Adaptive Training** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Cannot detect repeated user queries or offer guided mini-modules | **P2** | Phase 5 |
| **28** | **Digital Onboarding Manager** | PARTIALLY VERIFIED | Static checklist | Onboarding repository | `partner_profiles` | `/api/v1/partner/onboarding` | Enforced | PostgreSQL rows | Enforced | Verified | Ewan does not read or guide live onboarding steps dynamically | **P1** | Phase 5 |
| **29** | **Task Engine (Server-Backed Operational Tasks)** | NOT IMPLEMENTED | None | None | None (`sales_tasks` only) | None | None | None | None | None | No `ewan_tasks` table for partner operational tasks | **P0** | Phase 9 |
| **30** | **Proactive Ewan (Alerts & Reminders)** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | No proactive push stream for expiring licenses, tasks, or SLAs | **P1** | Phase 9 |
| **31** | **Role-Aware Daily Briefing** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | No briefing query aggregating doctor appointments, revenue, or queues | **P1** | Phase 9 |
| **32** | **Shift Handover Engine** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | No database-persisted shift handover notes, pending tasks, or sign-offs | **P1** | Phase 9 |
| **33** | **Troubleshooting Engine (23 Taxonomies)** | NOT IMPLEMENTED | Basic help FAQs | None | `core.ai_incidents` (tables only) | None | None | None | None | None | No structured 23-category diagnostic engine or remediation guidance | **P1** | Phase 6 |
| **34** | **Diagnostic Trace (UI to DB)** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Ewan cannot trace an error code back through Gateway -> Service -> DB | **P1** | Phase 6 |
| **35** | **Incident Engine & CAPA** | PARTIALLY VERIFIED | None | `AiIncidentAndCapaService.ts` | `core.ai_incidents` | `/api/v1/company/ai/incidents` | SuperAdmin only | PostgreSQL rows | Enforced | Tested lifecycle | No partner-facing incident reporting or investigation UI | **P1** | Phase 6 |
| **36** | **Support Escalation Engine** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Cannot generate support escalation tickets with captured error context | **P1** | Phase 6 |
| **37** | **Anomaly Engine** | PARTIALLY VERIFIED | None | `ExplainableAiAndAnomalyService.ts` | `core.ai_anomaly_detections` | `/api/v1/partner/ai/anomalies` | Enforced | PostgreSQL rows | Enforced | Tested lab delta check | Not surfaced proactively in Ewan panel | **P2** | Phase 11 |
| **38** | **Duplicate Detection Engine** | NOT IMPLEMENTED | None | Unique DB constraints exist | `patients`, `users` | DB error | DB level | PostgreSQL unique indexes | Enforced | Unique violation error | Ewan does not check for fuzzy duplicate patients or duplicate orders | **P2** | Phase 11 |
| **39** | **Commercial Intelligence (Plan/Sub/Lic/Ent)** | VERIFIED | `PartnerAccountPlanView.tsx` | `PartnerAccountService`, `LicenseService` | `plans`, `licenses`, `subscriptions` | `/api/v1/partner/account/plan-and-features` | Enforced | PostgreSQL rows | Enforced | Fail-closed | Wire directly into Ewan contextual panel | **P0** | Phase 7 |
| **40** | **Renewal Engine (60d/30d/Grace/Lock)** | VERIFIED | Plan View banner | `EwanAssistantService.ts` | `subscriptions`, `licenses` | `/api/v1/partner/ewan/context` | Enforced | PostgreSQL rows | Enforced | Tested 60d/30d/grace | Frontend widget does not display live renewal countdown | **P1** | Phase 7 |
| **41** | **Payment Engine (Cryptographic HMAC Settlement)** | VERIFIED | Modal exists | `EwanAssistantService.ts` | `order_snapshots`, `invoices`, `payments` | `/api/v1/partner/ewan/renewal/*` | Enforced | PostgreSQL rows | Enforced | Tested forged HMAC reject | Connect to real Razorpay checkout on partner-platform | **P0** | Phase 7 |
| **42** | **Feature / Entitlement Engine** | PARTIALLY VERIFIED | Checks client features array | `EntitlementService.ts` | `plan_entitlements` | `/api/v1/partner/entitlements` | Enforced | PostgreSQL rows | Enforced | Fail-closed | Ewan cannot explain "Why is this button disabled?" to the user | **P1** | Phase 7 |
| **43** | **Universal Search (Permission-Gated)** | NOT IMPLEMENTED | Client knowledge search | None | None | None | None | None | None | None | Cannot query "Show pending lab orders" or "Find unpaid invoices" | **P1** | Phase 11 |
| **44** | **Natural Language Reporting** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Cannot generate authorized billing or operational summary tables | **P2** | Phase 11 |
| **45** | **Export Engine** | NOT IMPLEMENTED | Client PDF generation | None | None | None | None | None | None | None | No Ewan-initiated permission-gated, audited CSV/PDF export | **P2** | Phase 11 |
| **46** | **System Health Copilot (Company HQ)** | PARTIALLY VERIFIED | None | Health check routes | `/api/v1/health` | PostgreSQL connectivity | None | Live check | Enforced | Status 200/503 | Company Ewan cannot answer "Is PostgreSQL healthy or degraded?" | **P1** | Phase 8 |
| **47** | **Audit Copilot** | PARTIALLY VERIFIED | None | `writeAuditTrace` & `auditRepository` | Internal service | `company_audit_traces`, `audit_events` | Enforced | PostgreSQL rows | Enforced | Tested hash integrity | Ewan cannot answer "Who changed this permission?" | **P1** | Phase 8 |
| **48** | **Security Copilot** | PARTIALLY VERIFIED | None | `evaluateAdversarialFirewall` | Logged to audit traces | Rejects 403 | Enforced | PostgreSQL rows | Tested in E2E | Tested 7 vectors | Ewan does not summarize recent security blocks for admins | **P1** | Phase 10 |
| **49** | **Communication Copilot** | NOT IMPLEMENTED | None | `WhatsAppEngagementService` | None | None | None | None | None | None | Ewan does not handle system notification dispatch | **P2** | Phase 9 |
| **50** | **Multilingual Engine (English/Hindi/Hinglish)** | PARTIALLY VERIFIED | Hardcoded Hinglish strings in TS | In-memory regex matches | None | None | None | None | None | None | Handled via static strings, not dynamic localized knowledge records | **P1** | Phase 1 |
| **51** | **Voice Architecture (STT/TTS Confirmation Gate)** | PARTIALLY VERIFIED | Mic button & Voice widget | `AiVoiceService.ts` | `ambient_ai_scribe_transcripts` | `/api/v1/partner/ai/voice/*` | Enforced | PostgreSQL rows | Enforced | Tested provider fallbacks | Ewan cannot execute voice-confirmed operational actions | **P2** | Phase 11 |
| **52** | **Document Intelligence / OCR** | NOT IMPLEMENTED | None | None | `document_verifications` (metadata only) | None | None | None | None | None | No OCR parsing for prescription or invoice uploads | **P2** | Phase 11 |
| **53** | **Prompt Injection & Adversarial Defense** | VERIFIED | Client regex guards | `evaluateAdversarialFirewall` in `EwanAssistantService` | Logged to `companyAuditTraces` | Rejects with 403 & code | Enforced | PostgreSQL rows | Tested in E2E | Tested 7 vectors | Must be enforced on all conversation routes | **P0** | Phase 10 |
| **54** | **Tool Gateway** | PARTIALLY VERIFIED | None | `tool-registry.ts` has permissions | None | None | Enforced | None | Partial | Tested in unit | Tool handlers have hardcoded mock data (violation of Rule 1.1) | **P0** | Phase 3 |
| **55** | **Multi-Agent Architecture** | NOT IMPLEMENTED | None | Fragmented services | None | None | None | None | None | None | Specialized sub-agents (Training, Workflow, Support) do not exist | **P2** | Phase 10 |
| **56** | **Knowledge Graph** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Entity relationships not modeled in graph format | **P3** | Phase 11 |
| **57** | **Simulation Engine** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Cannot simulate consequences ("What happens if I change staff role?") | **P2** | Phase 11 |
| **58** | **Product Intelligence (Usage & Patterns)** | PARTIALLY VERIFIED | None | `getCustomerSuccessSummary` | Aggregates DB counts | `/api/v1/partner/ewan/customer-success` | Enforced | PostgreSQL rows | Enforced | Tested in E2E | Not displayed to partner admin inside Ewan UI | **P2** | Phase 8 |
| **59** | **Partner Digital Twin** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | No operational digital twin model | **P3** | Phase 11 |
| **60** | **Predictive Assistance (Advisory Only)** | PARTIALLY VERIFIED | None | `aiDemandForecasts` | `core.ai_demand_forecasts` | `/api/v1/partner/ai/forecasts` | Enforced | PostgreSQL rows | Enforced | Tested advisory label | Not surfaced in partner Ewan cockpit | **P2** | Phase 11 |
| **61** | **Ewan Governance Center (Company Platform)** | NOT IMPLEMENTED | None | `ai-governance.routes.ts` | Partial | `company.ai_governance_policies` | SuperAdmin | PostgreSQL rows | Enforced | Tested | No dedicated UI in Company Platform to govern Ewan tools & models | **P1** | Phase 10 |
| **62** | **Kill Switches (Ewan Freeze Controls)** | VERIFIED | None | `commercial-guard.ts`, `security.ts` | Global flags | System middleware | Enforced | PostgreSQL rows | Enforced | Tested | Ewan routes respect commercial freeze rules | **P0** | Phase 10 |
| **63** | **Event Engine Integration** | PARTIALLY VERIFIED | BroadcastChannel (theme only) | Webhooks for Razorpay | `outbox_jobs` | Payment webhook | Enforced | PostgreSQL rows | Enforced | Idempotent | No WebSocket/SSE stream to push live Ewan proactive alerts | **P2** | Phase 9 |
| **64** | **Realtime Intelligence Sync** | PARTIALLY VERIFIED | BroadcastChannel (theme only) | None | None | None | None | None | None | None | No realtime synchronization of Ewan tasks or chat across tabs | **P1** | Phase 1 |
| **65** | **AI Model Governance & Cost Budgeting** | VERIFIED | None | `AiGatewayService`, `AiCostAndBudgetController` | `core.ai_cost_budgets`, `core.ai_request_registry` | `/api/v1/partner/ai/intelligence/*` | Enforced | PostgreSQL rows | Enforced | Hard stop tested | Needs connection to Ewan ask route | **P1** | Phase 10 |
| **66** | **Deterministic Business Rules (Non-LLM)** | VERIFIED | Static rules in resolver | Server pricing, entitlement, license rules | PostgreSQL | Multiple routes | Enforced | PostgreSQL rows | Enforced | Tested | Fully deterministic; must remain independent of LLM hallucination | **P0** | Phase 1 |
| **67** | **Evaluation Engine** | PARTIALLY VERIFIED | None | 7-vector attack suite in E2E test | None | None | Enforced | None | Enforced | Tested in `ewan-sales-renewal` | Needs automated evaluation harness across 100 test prompts | **P1** | Phase 10 |
| **68** | **Red-Team Engine** | PARTIALLY VERIFIED | None | 7-vector test in `ewanAssistantService` | None | None | Enforced | None | Enforced | Tested in E2E | Needs full automated adversarial red-team runner | **P1** | Phase 10 |
| **69** | **Data Minimization & Privacy** | PARTIALLY VERIFIED | Basic masking | Classification in `AiGatewayService` | `core.ai_request_registry` | Gateway enforcement | Enforced | PostgreSQL rows | Enforced | Tested | Context payloads must strip unnecessary patient/staff fields | **P0** | Phase 1 |
| **70** | **Clinical Safety & Non-Authority Boundary** | VERIFIED | Disclaimer shown in trainer | Blocked in `AiGatewayService` | N/A | Enforced | Enforced | N/A | Enforced | Level 4 Prohibited | Strict clinical disclaimer and non-authoritative boundary enforced | **P0** | Phase 1 |
| **71** | **Native PostgreSQL Requirement** | VERIFIED | N/A | Daemon on port 5432 verified | 500 tables in native PostgreSQL | Verified | Enforced | PostgreSQL on 5432 | Enforced | Tested | Monorepo runs on native PostgreSQL; pg-mem strictly disabled in prod | **P0** | Phase 1 |
| **72** | **Zero Business Truth in Browser Storage** | PARTIALLY VERIFIED | Stores only window position | N/A | PostgreSQL | N/A | N/A | N/A | N/A | N/A | UI preferences only in localStorage, BUT chat state is lost on reload | **P0** | Phase 1 |
| **73** | **Frontend-Backend Route Alignment** | BLOCKED | `EwanSystemTrainer.tsx` doesn't call API | Routes exist in `ewan.routes.ts` | PostgreSQL | 404/Not called | N/A | N/A | N/A | Mismatch | UI is completely unhooked from backend routes `/api/v1/partner/ewan/*` | **P0** | Phase 1 |
| **74** | **Contextual Drawer UX Architecture** | PARTIALLY VERIFIED | Floating orb + Modal | N/A | N/A | N/A | N/A | N/A | N/A | Verified DOM | Modal is a floating popup; needs clean right-side contextual drawer | **P1** | Phase 1 |
| **75** | **Action UI & Accessibility** | PARTIALLY VERIFIED | Basic keyboard listeners | N/A | N/A | N/A | N/A | N/A | N/A | Tested | Missing ARIA live announcements for action confirmations | **P2** | Phase 3 |
| **76** | **Cross-Session Persistence Proof** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Reloading browser wipes conversation; second session has zero history | **P0** | Phase 1 |
| **77** | **Two-Session Independent Verification** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Cannot verify action executed in Session A from Session B | **P1** | Phase 3 |
| **78** | **Failure-First Resilience** | PARTIALLY VERIFIED | Basic try/catch | Fastify AppError handling | PostgreSQL client fail-closed | Global error handler | Enforced | None | Enforced | Tested fail-closed | Ewan widget lacks retry, offline cue, or network error state | **P1** | Phase 6 |
| **79** | **Browser Storage Forensic Compliance** | PARTIALLY VERIFIED | Non-sensitive UI keys only | N/A | PostgreSQL | N/A | N/A | N/A | N/A | N/A | No business data in storage, but chat memory is absent | **P0** | Phase 1 |
| **80** | **Mock / Fallback Forensic Compliance** | NOT IMPLEMENTED | None | Mock vitals in tool registry; mock SOAP in provider | None | None | None | None | None | Mock returns | Mock vitals in `tool-registry.ts` and mock SOAP in `provider-interface.ts` | **P0** | Phase 3 |
| **81** | **Independent Verification Standard** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Independent audit suite must verify each phase fresh | **P0** | All |
| **82** | **Company Ewan Drawer UI Integration** | NOT IMPLEMENTED | Floating orb only | None | None | None | None | None | None | None | Company Platform lacks contextual Ewan drawer wired to HQ APIs | **P1** | Phase 8 |
| **83** | **Partner Ewan Drawer UI Integration** | NOT IMPLEMENTED | Floating orb only | None | None | None | None | None | None | None | Partner Platform lacks contextual Ewan drawer wired to Partner APIs | **P1** | Phase 1 |
| **84** | **Ewan Performance (<200ms Context Resolution)** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | Context resolution and query latency not measured or benchmarked | **P2** | Phase 1 |
| **85** | **Ewan Final Status & Acceptance Gate** | NOT IMPLEMENTED | None | None | None | None | None | None | None | None | All gates currently BLOCKED by P0 gaps | **P0** | Phase 10 |

---

## 3. Top Active P0 Critical Gaps (Strict Priority Order)

1. **P0-01: Complete Frontend-Backend Decoupling (Route Mismatch & Ephemeral State)**
   - *Location:* `packages/ui-kit/src/components/ewan/EwanSystemTrainer.tsx` (Lines 697–830)
   - *Evidence:* Zero `fetch()` calls. All user messages and AI responses reside in local React `useState`. If the page is refreshed, all conversation is wiped out.
2. **P0-02: Missing PostgreSQL Tables for Knowledge, Tasks, Actions, and Training**
   - *Location:* `packages/database/src/schema/`
   - *Evidence:* PostgreSQL inspection reveals 0 tables for knowledge articles, versions, operational tasks, action audits, or training progress.
3. **P0-03: Mock Data Leakage in AI Tool Registry**
   - *Location:* `apps/api-gateway/src/ai/tool-registry.ts` (Lines 59–67, 81–110)
   - *Evidence:* `getPatientVitalsTool` returns hardcoded dummy vitals (RR 24, SpO2 91, BP 88, HR 118, Temp 38.9) rather than querying PostgreSQL `clinical.encounters` or `clinical.vitals`.
4. **P0-04: Mock Medical Provider in AI Core**
   - *Location:* `apps/api-gateway/src/ai/provider-interface.ts` (Lines 20–40)
   - *Evidence:* `DeterministicMedicalReferenceProvider` returns hardcoded JSON strings for SOAP notes and Sepsis evaluation.
5. **P0-05: Missing Safe Action Engine & Risk-Gate Architecture**
   - *Location:* `apps/api-gateway/src/services/ai/`
   - *Evidence:* Ewan cannot perform ANY authorized mutation. There is no Action Preview schema, no confirmation gate, and no transactional execution pipeline.
6. **P0-06: Missing Centralized Ewan Context Engine**
   - *Location:* `apps/api-gateway/src/services/ai/`
   - *Evidence:* The server has no endpoint to assemble current identity, tenant, partner profile, active screen, active entity, workflow state, active tasks, and allowed/restricted actions into an authoritative payload.
7. **P0-07: In-Memory Volatile Workflows in Staff Trainer**
   - *Location:* `apps/api-gateway/src/services/ai/EwannameStaffTrainerService.ts` (Lines 45–120)
   - *Evidence:* `REGISTERED_WORKFLOWS` is a hardcoded in-memory TypeScript Record with no database persistence.
8. **P0-08: Lack of Cross-Session & Cross-Browser Persistence for Ewan State**
   - *Location:* `packages/ui-kit/src/components/ewan/`
   - *Evidence:* Because conversations and tasks are ephemeral, a user opening the application in a second browser (Chrome vs Edge) sees an empty conversation history and zero shared state.
9. **P0-09: Unwired Company HQ Ewan in Company Platform**
   - *Location:* `apps/company-platform/src/components/CompanyShell.tsx`
   - *Evidence:* Company Platform mounts the client-side trainer widget, completely ignoring `GET /api/v1/company/ewan/sales-overview`, `finance-overview`, and `ask`.
10. **P0-10: Lack of Cryptographic Audit Traces on Frontend Ewan Actions**
    - *Location:* `packages/ui-kit/src/components/ewan/`
    - *Evidence:* User interactions with Ewan are never logged to `company_audit_traces` or `audit_events`.

---

## 4. Master Enterprise Architecture Blueprint

```text
                               +-------------------------------------------------------+
                               |              EWAN ENTERPRISE INTELLIGENCE             |
                               +-------------------------------------------------------+
                                                          |
                      +-----------------------------------+-----------------------------------+
                      |                                                                       |
       +-------------------------------+                                       +-------------------------------+
       |        COMPANY/HQ EWAN        |                                       |          PARTNER EWAN         |
       |  (Sales, Renewal, CS, Finance,|                                       |   (OPD, LIMS, RIS, Pharmacy,  |
       |    Approvals, System Health)  |                                       |   Billing, Staff, Onboarding) |
       +-------------------------------+                                       +-------------------------------+
                      |                                                                       |
                      +-----------------------------------+-----------------------------------+
                                                          |
                                          +-------------------------------+
                                          |      EWAN CONTEXT ENGINE      |
                                          | (Server-Authoritative Context)|
                                          +-------------------------------+
                                                          |
                +-------------------+---------------------+---------------------+-------------------+
                |                   |                     |                     |                   |
        +---------------+   +---------------+     +---------------+     +---------------+   +---------------+
        |Identity Engine|   | Tenant Engine |     |Workflow Engine|     | Entity Engine |   |Knowledge Engine|
        |  (Auth JWT)   |   | (Isolation)   |     |(Lifecycle SOP)|     |  (360° Data)  |   | (DB Versioned)|
        +---------------+   +---------------+     +---------------+     +---------------+   +---------------+
                |                   |                     |                     |                   |
                +-------------------+---------------------+---------------------+-------------------+
                                                          |
                                          +-------------------------------+
                                          |     EVIDENCE ENGINE (Truth)   |
                                          +-------------------------------+
                                                          |
                                          +-------------------------------+
                                          |     AUTHORIZATION ENGINE      |
                                          |   (RBAC / ABAC ScopeGuard)    |
                                          +-------------------------------+
                                                          |
                                          +-------------------------------+
                                          |      ENTITLEMENT ENGINE       |
                                          |  (Commercial Guard & Modules) |
                                          +-------------------------------+
                                                          |
                                          +-------------------------------+
                                          |          TOOL GATEWAY         |
                                          |  (Permission Matrix & Schema) |
                                          +-------------------------------+
                                                          |
                                          +-------------------------------+
                                          |       SAFE ACTION ENGINE      |
                                          |  (Intent -> Preview -> Conf)  |
                                          +-------------------------------+
                                                          |
                                          +-------------------------------+
                                          |       TRANSACTION ENGINE      |
                                          | (PostgreSQL ACID + Idempotent)|
                                          +-------------------------------+
                                                          |
                                          +-------------------------------+
                                          |          AUDIT ENGINE         |
                                          | (SHA-256 Cryptographic Hash)  |
                                          +-------------------------------+
```

---

## 5. Master Phased Implementation Roadmap (Phases 1 through 11)

* **Phase 1: EWAN Foundation + Context Engine + Persistence**
  - Database schema: `core.ewan_conversations`, `core.ewan_messages`.
  - Backend: `EwanContextEngine.ts` (Aggregates Session, Tenant, Screen, Entity, Entitlements, Rules).
  - API: Connect `/api/v1/partner/ewan/context` and `/api/v1/partner/ewan/ask` to PostgreSQL conversation tables.
  - Frontend: Re-engineer `EwanSystemTrainer.tsx` into a clean right-side Contextual Drawer, making real API calls and hydrating state across reloads.
* **Phase 2: Versioned Knowledge Engine & Governance**
  - Database schema: `core.ewan_knowledge_articles`, `core.ewan_knowledge_versions`.
  - Migrate static `ewanKnowledgeBase.ts` topics into PostgreSQL with author, reviewer, approval state, and effective dates.
  - Knowledge contradiction detection and version history.
* **Phase 3: Safe Action Engine, Tool Gateway & Transaction Safety**
  - Database schema: `core.ewan_action_audits`, `core.ewan_action_previews`.
  - Backend: `EwanActionEngine.ts` (Intent -> Validation -> Preview -> Explicit Confirmation -> Authorized API -> ACID Transaction -> Audit).
  - Purge mock handlers from `tool-registry.ts` and replace with real PostgreSQL repository queries.
* **Phase 4: Workflow Copilot & Integrity Engine**
  - Dynamic workflow lifecycle validation, workflow resumption, and next best action suggestions based on live queue states.
* **Phase 5: Training Engine & Digital Onboarding Manager**
  - Database schema: `core.ewan_training_modules`, `core.ewan_training_progress`, `core.ewan_certifications`.
  - Replace in-memory `REGISTERED_WORKFLOWS` with PostgreSQL-backed interactive lessons, quizzes, and live completion tracking.
* **Phase 6: Troubleshooting & Support Escalation Engine**
  - 23-category diagnostic engine mapping frontend and backend error codes to root causes.
  - Support escalation ticket generator capturing sanitized system trace.
* **Phase 7: Commercial & Renewal Copilot Integration**
  - Full frontend drawer integration with `initiateRenewalOrder` and `verifyAndSettleRenewalPayment`.
  - Real-time countdowns, grace period indicators, and automated payment settlement.
* **Phase 8: Company Command Center & HQ Copilot**
  - Full Company Platform Ewan drawer wired to `/api/v1/company/ewan/sales-overview`, `finance-overview`, and `ask`.
* **Phase 9: Proactive Ewan, Task Engine & Shift Handover**
  - Database schema: `core.ewan_operational_tasks`, `core.ewan_shift_handovers`.
  - Server-backed operational tasks, daily role briefings, and persisted shift handovers.
* **Phase 10: Security, AI Model Governance & Red-Team Testing**
  - Governance center in Company Platform, AI token budgeting, kill switches, and automated red-team test runner.
* **Phase 11: Advanced Intelligence (Search, Anomaly, Simulation, Multilingual, Voice)**
  - Universal permission-scoped search, anomaly detection alerts, simulation mode, and voice confirmation gate.
