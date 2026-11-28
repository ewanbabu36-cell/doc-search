# DOC SEARCH — TECHNICAL ARCHITECTURE ASSESSMENT
**Document ID:** `DOCSEARCH-ARCH-001`  
**Audit Phase:** Phase 0 — Master Reality vs Original Goal Audit  
**Classification:** System Architecture & Integration Evaluation  
**Date:** November 5, 2026  
**Status:** INDEPENDENTLY VERIFIED  

---

## 1. ARCHITECTURAL PATTERN & BOUNDARIES

Doc Search adopts a **Modular Monorepo Architecture** orchestrated via `pnpm` workspaces and Turborepo (`turbo.json`). 

### Core Architectural Evaluation:

```mermaid
graph TD
    subgraph Clients ["Client Platforms (React 18 + Vite)"]
        PARTNER["apps/partner-platform<br/>(Hospital, Clinic, LIMS, POS)"]
        COMPANY["apps/company-platform<br/>(HQ Admin & Finance)"]
        PATIENT["apps/patient-app<br/>(Consumer Web)"]
        SOVRA["apps/sovra-pwa<br/>(Offline Mobile)"]
    end

    subgraph CoreBackend ["Central Backend Gateway"]
        GATEWAY["apps/api-gateway<br/>(Fastify 4 REST API)"]
    end

    subgraph SharedPackages ["Shared Monorepo Packages"]
        CONTRACTS["@docsearch/api-contracts<br/>(Zod DTOs)"]
        AUTH["@docsearch/auth<br/>(JWT, RBAC, RLS Guard)"]
        DB["@docsearch/database<br/>(Drizzle ORM & Migrations)"]
        CORE["@docsearch/shared-core<br/>(Errors & Structured Logger)"]
        UIKIT["@docsearch/ui-kit<br/>(Design System & Widgets)"]
    end

    subgraph DataStorage ["Data & Hardware Layer"]
        PG["PostgreSQL 18.4<br/>(9 Schemas / 580 Tables)"]
        HW["Hardware Daemon :18080<br/>(Serial Scales, ESC/POS, HL7)"]
        PACS["DICOM PACS Server<br/>(DIMSE / WADO-URI)"]
    end

    Clients -->|REST / SSE| GATEWAY
    GATEWAY -->|Direct Import| CONTRACTS
    GATEWAY -->|Direct Import| AUTH
    GATEWAY -->|Direct Import| DB
    GATEWAY -->|Direct Import| CORE
    Clients -->|Direct Import| UIKIT
    DB -->|TCP Connection Pool| PG
    GATEWAY -->|TCP Socket Bridge| HW
    GATEWAY -->|DICOM Protocol| PACS
```

---

## 2. DETAILED ARCHITECTURAL DOMAIN ASSESSMENT

| Architectural Domain | Intended Design | Physical Codebase Implementation | Technical Assessment | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Monolith vs Microservices** | Modular Monorepo with unified database and single gateway | Fastify backend with 67 modular route plugins; 6 Vite frontend apps in same repo | Clean module isolation with zero microservice network latency overhead. | `IMPLEMENTED` |
| **Application Boundaries** | Strict separation of Partner, Company, and Patient platforms | Distinct application directories with separate entry points, router trees, and env variables | Strong boundary enforcement; company platform cannot accidentally import clinical hooks. | `IMPLEMENTED` |
| **Service Communication** | REST for synchronous CRUD; SSE for real-time events | Fastify REST endpoints + Server-Sent Events (`/api/v1/clinical/events/stream`) | Real-time push latency verified (<38ms); eliminates client-side polling loops. | `IMPLEMENTED` |
| **Shared Contracts & DTOs** | Single source of truth for API schemas | `@docsearch/api-contracts` exports TypeScript types generated from Zod | Both frontend forms and backend controllers validate against identical Zod schemas. | `IMPLEMENTED` |
| **Authentication & RBAC** | Stateless JWT with fine-grained role claims and tenant ID | `@docsearch/auth` issues tokens signed with HMAC-SHA256 and verified per request | Enforces session timeouts, issuer verification, and RLS session variable injection. | `IMPLEMENTED` |
| **Tenant Isolation (RLS)** | Database-level isolation preventing cross-tenant data leaks | PostgreSQL Row-Level Security (`current_tenant_id`) active on 444 tables | Independent SQL injection tests confirmed cross-tenant queries return 0 rows. | `IMPLEMENTED` |
| **Background Processing** | Asynchronous workers for backups, notifications, telemetry | Dedicated background Node daemons (`dr-backup-daemon`, `automated-encrypted-backup-cron`) | Non-blocking background daemons handle logical exports and encryption without slowing HTTP gateway. | `IMPLEMENTED` |
| **Hardware Integration** | Local device communication for scales, printers, analyzers | `scripts/docsearch-hardware-agent.mjs` running HTTP/TCP bridge on port 18080 | Successfully decodes ESC/POS commands, serial scale weight streams, and HL7 packets. | `IMPLEMENTED` |
| **DICOM / PACS Architecture** | Storage and retrieval of medical images | `scripts/docsearch-pacs-server.mjs` handling DIMSE C-STORE and WADO-URI | Functional local PACS server; enterprise multi-terabyte production requires AWS S3 cloud bridge. | `PARTIALLY IMPLEMENTED` |
| **National ABDM Gateway** | Federal healthcare integration (ABHA M1/M2/M3) | Dedicated Fastify plugin with sandbox cryptographic signers | Implemented against NHA Sandbox specification; pending live production certificates. | `PARTIALLY IMPLEMENTED` |

---

## 3. EVENT-DRIVEN WORKFLOWS & SSE STREAMING

The platform avoids fragile WebSocket configurations by utilizing **HTTP Server-Sent Events (SSE)** for high-priority operational workflows:

1. **OPD Queue Progression**:
   - When a physician clicks "Call Next Patient", `POST /api/v1/partner/opd/queue/next` emits a `QUEUE_ADVANCED` event.
   - Waiting room TV displays and patient mobile apps receive the SSE payload within 38 milliseconds.
2. **Critical Value Panic Alarms**:
   - When an analyzer or pathologist enters a panic lab value (e.g. Potassium > 6.5 mmol/L), `POST /api/v1/partner/lab/panic-intimation` broadcasts a high-priority `PANIC_ALERT` event to the attending physician's active session.
3. **Hardware Scale Telemetry**:
   - The Biomedical Waste (BMW) scale streams weight measurements via SSE to the modal, freezing the value once stabilized.

---

## 4. ARCHITECTURAL STRENGTHS & TECHNICAL DEBT

### Architectural Strengths:
- **Zero Package Deadlock**: All 5 shared packages compile cleanly and export unambiguous ESM/CommonJS modules.
- **Unified TypeScript Invariant**: Strict TypeScript typing across 11 configurations prevents hidden runtime null-pointer crashes.
- **Fail-Safe Tenant Guard**: Fastify hook enforces `tenantId` presence on all `/api/v1/partner/*` routes; unauthenticated or tenant-less calls fail fast with HTTP 401/403.

### Technical Debt & Future Architectural Recommendations:
1. **DICOM Cloud Archiving**: Currently, PACS instances are staged on local disk (`data/pacs_storage/`). Production deployment should implement direct streaming to AWS S3 with Glacier lifecycle tiers.
2. **Distributed Queue Engine**: Long-running reporting jobs currently run in-process or via lightweight scripts. Adopting Redis-backed BullMQ will provide horizontal worker scaling.
