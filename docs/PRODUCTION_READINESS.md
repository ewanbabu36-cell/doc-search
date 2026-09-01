# 📘 DOC SEARCH — PRODUCTION READINESS REPORT

**Document Version:** 3.0.0 (Hardened Production Truth Baseline)  
**System Classification:** Enterprise Multi-Tenant Hospital Information & Laboratory Operating System  
**Verified On:** September 1, 2026

---

## 1. 🏗️ ARCHITECTURE & DATA FLOW

DOC SEARCH is built as an enterprise monorepo with strict architectural boundaries:
```
[Client Applications]
  - Hospital & LIMS Partner Platform (Port 5173)
  - Global HQ Command Center (Port 5174)
  - Patient Web Portal (Port 5175)
       │
       ▼ (Authenticated HTTPS REST API + Bearer JWT + Tenant Header)
[Fastify API Gateway @ Port 4000]
  - Auth Guard (`authenticate`, `requirePermission`)
  - Request Validation & Correlation ID (`req.id`, `x-correlation-id`)
  - Structured Logging & Telemetry
       │
       ▼ (withSecurityContext + Session-Bound PostgreSQL RLS)
[PostgreSQL Database via Drizzle ORM]
  - `core` schema (tenants, branches, users, roles, sessions)
  - `clinical` schema (patients, encounters, investigations, specimens, results, reports, billing, pharmacy, IPD)
  - `company` schema (webhooks, exchange_rates, subscriptions, audit_logs)
```

---

## 2. 🛡️ AUTHENTICATION, RBAC & TENANT ISOLATION

* **Multi-Tenant Scoping:** Every clinical and transactional query enforces `tenantId` filtering and transaction-local session variables:
  - `app.current_tenant_id`
  - `app.current_branch_id`
  - `app.current_user_id`
* **RBAC Roles:** `HOSPITAL_ADMIN`, `CONSULTANT_PHYSICIAN`, `CONSULTANT_PATHOLOGIST`, `CHIEF_PHARMACIST`, `NURSE_IN_CHARGE`, `LAB_TECHNOLOGIST`, `FRONTDESK_CASHIER`.
* **Cross-Tenant Access Prevention:** Server-side denial with `403 Forbidden` response.

---

## 3. 🧪 LIMS LIFECYCLE STATE MACHINE

```
[ORDERED / SAMPLE_REQUIRED]
       │
       ▼ (Specimen Collection & Barcode Accessioning)
[SAMPLE_COLLECTED / ACCESSIONED]
       │
       ▼ (Analyzer Result Entry & Parameter Computation)
[PROCESSING / DRAFT_RESULTS]
       │
       ▼ (Pathologist Review & Digital Verification Seal)
[REPORT_FINALIZED / LOCKED]
       │
       ▼ (ISO 32000-1 Binary Stream Generation)
[OFFICIAL PDF DOWNLOAD & ABDM VERIFICATION]
```

* **Deterministic Reference Bounds:** Result values outside biological reference intervals are deterministically flagged (`HIGH`, `LOW`, `CRITICAL`).
* **Immutable Finalization:** Finalized reports cannot be overwritten without a formalized amendment workflow.

---

## 4. 💳 BILLING & FINANCIAL LEDGER

* **Decimal Currency Handling:** Calculations use integer subunit arithmetic (paise / cents) to prevent JavaScript floating-point drift.
* **Invoice Schema:** Line items, category subtotals, configurable GST/tax rates, discount controls, and immutability once settled.
* **Double-Click & Replay Protection:** Idempotency keys prevent duplicate invoice creation or double payments.

---

## 5. ⚡ OUTBOUND WEBHOOK DISPATCHER

* **Cryptographic HMAC:** Header `X-DocSearch-Signature` computed using Node `crypto.createHmac('sha256', secret)` over canonical JSON payloads.
* **Delivery Telemetry:** Real round-trip latency measured in milliseconds (`performance.now()`).
* **Retry & Status State Machine:** `QUEUED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SUCCESS` / `RETRYING` $\rightarrow$ `FAILED`.

---

## 6. 💱 TREASURY FOREX (FX) INGRESS

* **Endpoint:** `GET /api/v1/company/treasury/fx-rates`
* **Supported Currencies:** USD, EUR, AED, GBP, SAR, SGD.
* **Freshness Policy:** Rates are stamped with `retrievedAt` timestamp and labeled `LIVE / CACHED / STALE`.

---

## 7. 🔒 SECURITY CONTROLS & IMMUTABLE AUDIT TRAIL

* **Audit Traces:** Every sensitive write generates an immutable record in `clinical.audit_events` containing `actorId`, `actorRole`, `action`, `entityId`, `timestamp`, and state snapshot.
* **Zero Client-Side Trust:** Permissions, prices, reference intervals, and tenant scoping are strictly validated on the Fastify API Gateway.

---

## 8. 📊 TEST EVIDENCE

* ✅ `test-production-truth.js` (9/9 Steps Passing)
* ✅ `test-db-production-truth.js` (7/7 Steps Passing)
* ✅ Clean workspace build across all applications.
