# Production Traffic & Scalability Architecture Mapping

**Document ID:** ARCH-DOCSEARCH-PROD-001  
**Target Environment:** Enterprise Healthcare Cloud & On-Premises Topology  
**Validation Type:** Production Traffic & Scalability Gate Phase 1  
**Date:** September 2026  
**Status:** AUDITED & VALIDATED  

---

## 1. Executive Summary & Topology Map

DocSearch is a distributed multi-tenant healthcare SaaS and on-premises clinical operating system. The system encompasses 3 web applications, a high-throughput Fastify API gateway, Drizzle-ORM-backed PostgreSQL multi-tenant database clusters, and specialized clinical hardware and regulatory gateway integrations.

```
                                      ┌──────────────────────────────────────────────┐
                                      │             CLIENT LAYER (DNS / CDN)          │
                                      │  • Patient Landing & Teleconsult (Port 5175) │
                                      │  • Partner Clinical Platform (Port 5173)     │
                                      │  • Company HQ Executive Platform (Port 5174) │
                                      └──────────────────────┬───────────────────────┘
                                                             │ HTTPS (TLS 1.3) / WSS
                                                             ▼
                                      ┌──────────────────────────────────────────────┐
                                      │          EDGE REVERSE PROXY / NGINX          │
                                      │  • TLS Termination & Compression (Gzip)     │
                                      │  • Rate Limiting (DDoS & Brute Force Guard)  │
                                      │  • Static Asset Caching & Route Forwarding   │
                                      └──────────────────────┬───────────────────────┘
                                                             │
                                                             ▼
                                      ┌──────────────────────────────────────────────┐
                                      │            API GATEWAY (FASTIFY 5.2)         │
                                      │  • Port 4000 (Node.js 22 LTS)                │
                                      │  • Helmet (CSP, HSTS, X-Frame-Options)       │
                                      │  • Auth Guard (JWT Ed25519 / HMAC-SHA256)    │
                                      │  • Multi-Tenant RLS Session Context Binder   │
                                      │  • Structured JSON Logger & Correlation IDs  │
                                      └───────┬──────────────┬───────────────┬───────┘
                                              │              │               │
                     ┌────────────────────────┘              │               └────────────────────────┐
                     ▼                                       ▼                                        ▼
      ┌──────────────────────────────┐        ┌──────────────────────────────┐        ┌──────────────────────────────┐
      │     CORE & AUTH SERVICES     │        │   PARTNER CLINICAL SUITE     │        │   COMPANY FINANCIAL HQ       │
      │  • RealAuthService (Argon2id)│        │  • Clinical Workflow (EMR)   │        │  • Dynamic Pricing Matrix    │
      │  • Multi-Tenant Session Mgr  │        │  • Pharmacy (FEFO/Sched H1)  │        │  • Multi-Branch Inter-Co P&L │
      │  • RBAC Permission Matrix    │        │  • Lab & Molecular Pathology │        │  • GST NIC e-Invoicing (IRN) │
      │  • Audit Trail Vault         │        │  • Radiology (DICOM/Tele-Rad)│        │  • TPA Claims (NHCX / PMJAY) │
      │  • Document Verification     │        │  • Blood Bank, OT & Inpatient│        │  • 0% MDR Smart Router       │
      └──────────────┬───────────────┘        └──────────────┬───────────────┘        └──────────────┬───────────────┘
                     │                                       │                                       │
                     └───────────────────────────────┬───────┴───────────────────────────────────────┘
                                                     │
                                                     ▼
                                      ┌──────────────────────────────────────────────┐
                                      │        DATABASE & PERSISTENCE CLUSTER        │
                                      │  • PostgreSQL 16+ (Drizzle ORM Connection)   │
                                      │  • Row-Level Security (SET LOCAL session)    │
                                      │  • Schema Isolation: `core`, `clinical`,     │
                                      │    `company`, `workflow`                     │
                                      │  • High-Concurrency Pooled Connection (20+) │
                                      └──────────────────────┬───────────────────────┘
                                                             │
                                 ┌───────────────────────────┴───────────────────────────┐
                                 ▼                                                       ▼
                  ┌──────────────────────────────┐                        ┌──────────────────────────────┐
                  │    EXTERNAL GATEWAY HUBS     │                        │     ASYNC / HARDWARE HUBS    │
                  │  • ABDM / NHA Gateway (M1-M3)│                        │  • WebSockets Hardware Bridge│
                  │  • Razorpay / Stripe FX Hub  │                        │  • Zebra Thermal Printers    │
                  │  • NIC GSTR-1 e-Invoice IRP  │                        │  • Speech-to-Text Clinical AI│
                  └──────────────────────────────┘                        └──────────────────────────────┘
```

---

## 2. Component Inventory & Architecture Breakdown

### 2.1 Frontend Applications
1. **Patient Portal & 3D Anatomy Landing Page (`@docsearch/landing-page` - Port 5175):**
   - **Stack:** Vite 6, React 18, TypeScript, Aurora Glow Canvas Engine.
   - **Key Workflows:** 3D body symptom triage, real-time doctor availability check, floating `Cmd+K` AI spotlight, live WebRTC video consultation rooms.
   - **Load Profile:** High concurrency read-heavy with periodic burst traffic during epidemics or marketing campaigns.

2. **Hospital & Partner Platform (`@docsearch/partner-platform` - Port 5173):**
   - **Stack:** Vite 6, React 18, TypeScript, `@docsearch/ui-kit`.
   - **Key Workflows:** OPD Doctor EMR, prescription writing, barcode-driven FEFO pharmacy dispensing, LIS lab specimen tracking, PACS radiology viewer, ABDM consent gateway, IPD bed allocation.
   - **Load Profile:** Continuous transactional write-heavy workload with low latency requirements (< 200ms) for clinical safety.

3. **Company Platform Global HQ (`@docsearch/company-platform` - Port 5174):**
   - **Stack:** Vite 6, React 18, TypeScript, `@docsearch/ui-kit`.
   - **Key Workflows:** 15 enterprise domains (Executive, Financial Ledger, Dynamic Contract Matrix, Multi-Branch Consolidated Billing, AI Revenue Leakage Radar, Predictive Cash Flow Simulator, Compliance).
   - **Load Profile:** Complex analytical queries, multi-branch aggregations, bulk PDF/Excel exports, and financial reconciliations.

---

### 2.2 API Gateway (`@docsearch/api-gateway` - Port 4000)
- **Engine:** Fastify v5.2.1 running on Node.js v22 LTS with async I/O.
- **Security Middleware:**
  - `@fastify/helmet`: Automated CSP, HSTS, X-Content-Type-Options, X-Frame-Options.
  - `@fastify/cors`: Configurable allowed origins (`CORS_ORIGIN`) with credential isolation.
  - `@fastify/rate-limit`: Per-IP quota windowing (`RATE_LIMIT_MAX` / `RATE_LIMIT_TIME_WINDOW`).
- **Request Lifecycle:**
  1. Ingress Request $\rightarrow$ UUIDv4 `x-request-id` assigned.
  2. Security Header & CORS preflight validation.
  3. Rate limit token bucket validation.
  4. Auth Guard: Decodes JWT Bearer token, validates expiry, verifies role & tenant membership.
  5. SecurityContext Injection: Tenant ID, Branch ID, User ID passed to downstream service.
  6. Database Transaction: `withSecurityContext` executes `SET LOCAL app.current_tenant_id` before executing Drizzle ORM query.
  7. Response Sanitization & Error Handler: Mask 500 errors, return structured RFC 7807 payload.

---

### 2.3 Database & Multi-Tenant Data Architecture
- **Engine:** PostgreSQL 16+ with Drizzle ORM.
- **Partitioning & Schemas:**
  - `core`: `tenants`, `branches`, `users`, `credentials`, `memberships`, `roles`, `sessions`, `audit_events`.
  - `clinical`: `encounters`, `patients`, `pharmacy_prescriptions`, `pharmacy_inventory`, `pharmacy_batches`, `lab_orders`, `radiology_studies`, `inpatient_admissions`, `blood_bank_units`, `ot_bookings`.
  - `company`: `governance_committees`, `committee_memberships`, `subscriptions`, `invoices`, `payments`, `tax_ledgers`, `inter_branch_transfers`.
  - `workflow`: `dynamic_workflows`, `workflow_instances`, `workflow_transitions`.
- **Row-Level Security (RLS) Protocol:**
  - Multi-tenancy is enforced at the database kernel level via `withSecurityContext` and session local variables. Even in raw query injection scenarios, data from other tenants cannot be accessed without explicit `app.is_super_admin = true`.

---

### 2.4 External Integrations & Async Services
1. **ABDM National Health Gateway:** M1 (ABHA creation), M2 (HIP record linking), M3 (HIU health data consent exchange) via FHIR R4 JSON standards.
2. **Payment Gateway Router:** Multi-gateway router (Razorpay, Cashfree, Stripe) with 0% MDR priority for UPI/RuPay and zero-downtime auto-failover (< 800ms).
3. **Hardware Bridge WebSockets:** Direct low-latency hardware daemon bridging Zebra thermal printers, ESC/POS barcode scanners, and biomedical monitors.
4. **Speech-to-Text AI:** Cloud STT integration with fallback clinical terminology dictionaries.

---

## 3. Potential Bottlenecks & Vulnerability Matrix

| Component | Potential Bottleneck / Vulnerability | Root Cause & Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **API Gateway** | Rate limit throttling during legitimate high-concurrency traffic | Default `RATE_LIMIT_MAX=100` req/min throttles legitimate peak clinical traffic | Implement sliding-window distributed rate limiting with tiered quotas for authenticated clinical tokens. |
| **Database Connection Pool** | Connection pool exhaustion under 1,000+ concurrent users | Fixed `max: 20` pool limit causes connection queuing under concurrent spikes | Utilize PostgreSQL connection poolers (PgBouncer / Neon Serverless pooler) and tune `maxConnections: 100+`. |
| **Multi-Tenant Isolation** | Data leakage across tenant boundaries during pooled queries | Connection reuse might retain previous session variables | `withSecurityContext` executes within atomic `db.transaction()` and guarantees `SET LOCAL` rollback upon transaction completion. |
| **FEFO Batch Allocation** | Deadlocks during concurrent prescription dispensing of same medication batch | Concurrent updates to `pharmacy_batches.quantity` | Use `SELECT ... FOR UPDATE` row-locking during atomic stock reservation. |
| **Large Export Reports** | High memory usage / Node heap overflow during 50,000+ row exports | Loading entire datasets into memory before JSON serialization | Implement cursor-based pagination and streaming responses for large analytical reports. |
| **Payment Gateway Webhooks** | Duplicate invoice receipts during network retry storms | Network retries from Razorpay/Stripe | Implement strict idempotency keys (`idempotency_key` unique index) on all financial mutation routes. |

---

## 4. Phase 1 Architecture Discovery Verification Checklist

- [x] All 3 frontend web applications mapped (`landing-page:5175`, `partner-platform:5173`, `company-platform:5174`).
- [x] API Gateway routing and security pipeline mapped (`api-gateway:4000`).
- [x] All 4 database schemas (`core`, `clinical`, `company`, `workflow`) cataloged with RLS isolation protocol.
- [x] External integrations (ABDM, STT, Hardware Bridge, Payment Gateways) documented.
- [x] 6 key architectural bottlenecks identified with mitigation blueprints.
