# DOC SEARCH — PHASE 5 STAGE 2: COMPLETE SYSTEM & ARCHITECTURE INVENTORY

**Date:** 2026-11-21  
**Project:** DOC SEARCH Enterprise Healthcare ERP  
**Repository Branch:** `audit/master-forensic-remediation`  
**Commit:** `e83734c`  
**Auditor:** Principal Software Architect & DevSecOps Lead  
**Evaluation Standard:** Production Topology, Trust Boundaries & Monorepo Census  
**Status:** **VERIFIED COMPLETE**

---

## 1. MONOREPO SERVICE & APPLICATION INVENTORY

The DOC SEARCH platform is structured as an enterprise monorepo managed with pnpm workspaces and Turbo.

### 1.1 Applications (`apps/`)

| Application | Package Name | Runtime / Bundler | Port | Process / Executable | Operational Role |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **API Gateway** | `@docsearch/api-gateway` | Node.js (ESM), Fastify | `4000` | `dist/server.js` | Core backend REST API, RBAC guard, RLS context injection, FHIR R4 & ABDM connector |
| **Partner Platform** | `@docsearch/partner-platform` | React 18, Vite, TypeScript | `5173` | Vite Dev/Preview | Clinical ERP, OPD, IPD, EHR, Pharmacy POS, LIMS Pathology, Billing & Cashiering |
| **Patient Mobile App** | `@docsearch/patient-app` | React 18, Vite, Capacitor | `5174` | Vite / Android APK | Patient portal, appointment booking, lab results, prescriptions, ABHA integration |
| **Landing Page** | `@docsearch/landing-page` | React 18, Vite, Tailwind | `5175` | Vite Dev/Preview | Public hospital directory, SaaS marketing, partner onboarding registration |
| **Company Platform** | `@docsearch/company-platform` | React 18, Vite, TypeScript | `5177` | Vite Dev/Preview | SaaS HQ multi-tenant console, license billing, partner approvals, security monitoring |
| **Master Gateway Hub** | N/A (`scripts/unified-gateway.mjs`) | Node.js HTTP Proxy | `3000` | Node.js daemon | Unified reverse proxy routing traffic across frontend apps and API gateway |

### 1.2 Auxiliary Daemons & Integration Services (`scripts/`)

| Daemon / Service | Port | Protocol / Transport | Purpose | High Availability / Self-Healing |
| :--- | :---: | :--- | :--- | :--- |
| **PostgreSQL 18.4 Engine** | `5432` | PostgreSQL Native Wire | Primary relational database (581 tables, 9 schemas) | Managed by native postgres daemon |
| **Radiology PACS Server** | `8042` | DICOM C-STORE, DICOMweb, HTTP | Imaging ingest, DICOM modality worklist, WADO-RS viewer | Supervised daemon (`docsearch-pacs-server.mjs`) |
| **Local Hardware Agent (LHA)** | `18080` | HTTP, WebSocket | Direct USB thermal slip printer, barcode reader, smartcard interface | Supervised daemon (`docsearch-hardware-agent.mjs`) |
| **Clinical Sweepers Daemon** | `0` (Internal) | Node.js Timer Loop (60s) | Blood crossmatch expiry, unverified lab alert escalation, bed SLA tracking | Supervised daemon (`clinical-sweepers-daemon.mjs`) |
| **Encrypted Backup Cron** | N/A | AES-256-GCM Backup Daemon | Scheduled encrypted snapshot of all schemas every 6 hours | Supervised daemon (`automated-encrypted-backup-cron.mjs`) |

### 1.3 Core Shared Packages (`packages/`)

| Package Directory | Package Name | Module Type | Scope & Responsibility |
| :--- | :--- | :---: | :--- |
| `packages/database` | `@docsearch/database` | ESM (`module`) | Drizzle ORM schema (581 tables), connection pooling, migration runner, RLS helpers |
| `packages/auth` | `@docsearch/auth` | CommonJS | JWT minting, verification, PBKDF2 hashing, session tokens, permissions evaluator |
| `packages/shared-core` | `@docsearch/shared-core` | CommonJS | GST E-Invoicing (NIC IRN, Signed QR), ABDM / NHCX FHIR R4 bundles, financial calculations |
| `packages/api-contracts` | `@docsearch/api-contracts` | CommonJS | Shared TypeScript DTOs, request/response validation interfaces, domain enums |
| `packages/ui-kit` | `@docsearch/ui-kit` | ESM (`module`) | Shared design tokens, modal primitives, clinical tables, badge components |

---

## 2. ACTIVE RUNTIME PORT AUDIT & CONNECTIVITY

Direct TCP socket probing on `127.0.0.1` verified that all 9 configured network services are currently active, listening, and accepting connections:

```text
Port 3000  [Master Gateway Hub]:      ONLINE (ACTIVE)
Port 4000  [API Gateway]:             ONLINE (ACTIVE)
Port 5432  [PostgreSQL 18.4]:         ONLINE (ACTIVE)
Port 5173  [Partner Platform UI]:     ONLINE (ACTIVE)
Port 5174  [Patient Mobile App UI]:   ONLINE (ACTIVE)
Port 5175  [Landing Page UI]:         ONLINE (ACTIVE)
Port 5177  [Company Platform UI]:     ONLINE (ACTIVE)
Port 8042  [Radiology PACS Server]:   ONLINE (ACTIVE)
Port 18080 [Local Hardware Agent]:    ONLINE (ACTIVE)
```

---

## 3. ARCHITECTURAL TRUST BOUNDARIES & DATA FLOW

```mermaid
flowchart TD
    subgraph Public_Internet["Public / External Zone"]
        Browser["User Browser / Mobile Client"]
        Razorpay["Razorpay / Payment Gateway"]
        ABDM["ABDM / Ayushman Bharat Digital Mission"]
        NIC["NIC GST Portal"]
    end

    subgraph Edge_Zone["Edge & Reverse Proxy Zone"]
        MGW["Master Gateway Hub (:3000)"]
    end

    subgraph Application_Zone["Application Service Zone (Private VPC)"]
        Landing["Landing UI (:5175)"]
        Partner["Partner ERP UI (:5173)"]
        Patient["Patient App UI (:5174)"]
        Company["HQ Console UI (:5177)"]
        API["API Gateway (:4000)"]
    end

    subgraph Internal_Daemons["Internal Integration & Worker Zone"]
        PACS["PACS DICOM Server (:8042)"]
        LHA["Hardware Agent (:18080)"]
        Sweepers["Clinical Sweepers Daemon"]
        BackupCron["Encrypted Backup Cron"]
    end

    subgraph Data_Storage["Data Tier (Strict Zero-Trust)"]
        PG["PostgreSQL 18.4 (:5432)"]
        Vault["Encrypted Vault (AES-256-GCM)"]
    end

    Browser -->|TLS / HTTPS| MGW
    MGW --> Landing
    MGW --> Partner
    MGW --> Patient
    MGW --> Company
    MGW --> API

    API -->|JWT & Role Guard| API
    API -->|docsearch_app (Forced RLS)| PG
    Sweepers -->|Service Context| PG
    BackupCron -->|Snapshot & Encrypt| PG
    BackupCron --> Vault
    PACS -->|DICOM Ingest| PG
    LHA -->|Local Hardware RPC| API
    API -->|Webhooks / TLS| Razorpay
    API -->|M2M mTLS| ABDM
    API -->|Signed JSON| NIC
```

### Trust Boundary Analysis:
1. **Public Edge Boundary:** Traversed via `Master Gateway Hub (:3000)` or direct Vite endpoints. All unauthenticated requests are strictly constrained to public static bundles and public landing routes.
2. **API Authentication Boundary:** The API Gateway (`:4000`) acts as the policy enforcement point. Every partner/patient/company route requires an authenticated JWT bearer token verified with HMAC-SHA256.
3. **Multi-Tenant Database Boundary:** The connection from `api-gateway` to PostgreSQL 18.4 (`:5432`) is authenticated under `docsearch_app` (`rolsuper = false`, `rolbypassrls = false`). Row Level Security is enforced at the database kernel level for all 446 tenant-bearing tables via `core.get_current_tenant_id()`.
4. **Integration Boundary:** PACS and LHA operate on isolated ports and exchange structured DICOM/JSON payloads validated against clinical schemas.

---

## 4. CONCLUSION

The complete DOC SEARCH application topology has been inventoried, mapped, and verified online. Monorepo structure, package dependencies, network interfaces, and security trust boundaries are documented and ready for operational load and security audits.

**Verdict: VERIFIED COMPLETE**
