# DOC SEARCH — PHASE 0: REPOSITORY BASELINE & DISCOVERY
**Document ID:** `DOCSEARCH-PHASE0-BASELINE`  
**Execution Timestamp:** 2026-11-21T17:25:00+05:30  
**Audit Branch:** `audit/master-forensic-remediation`  
**Base Commit SHA:** `ce2fd64dea96828870a4404a864d654c0dced4e6`  
**Working Directory:** `d:\DOC SEARCH`  

---

## 1. Executive Forensic Summary

An exhaustive repository discovery and baseline inspection was performed across `d:\DOC SEARCH`. The project is a TypeScript/Node.js enterprise monorepo using PNPM workspaces, Vite frontends, Fastify backend API gateway, Drizzle ORM, and a native PostgreSQL 18.4 relational database cluster.

### 📌 Physical Codebase Inventory Metrics

| Component Group | Physical Folder | Source Files | Lines of Code (LOC) | Primary Technology |
|---|---|---:|---:|---|
| **Partner Platform** | `apps/partner-platform` | 1,051 | 363,110 | React 18, Vite, Lucide, Tailwind/CSS Variables, PWA |
| **API Gateway** | `apps/api-gateway` | 489 | 227,607 | Fastify 5, Drizzle ORM, Zod, JOSE JWT, Argon2/Scrypt |
| **Company Platform** | `apps/company-platform` | 398 | 131,666 | React 18, Vite, Recharts, Lucide, WebSockets |
| **Landing & Booking** | `apps/landing-page` | 20 | 14,896 | React 18, Vite, Framer Motion, Lucide |
| **Patient App** | `apps/patient-app` | 51 | 13,620 | React 18, Vite, Capacitor/PWA |
| **Shared Database Package** | `packages/database` | 155 | 1,766,362 | Drizzle ORM, PostgreSQL Driver, Zod Schemas |
| **Shared UI Kit** | `packages/ui-kit` | 86 | 21,268 | React 18, Design System Tokens, CSS |
| **API Contracts** | `packages/api-contracts` | 58 | 22,087 | TypeScript, Zod Schemas, DTO Interfaces |
| **Shared Core Utilities** | `packages/shared-core` | 38 | 7,976 | Pure TypeScript Business & Cryptographic Utilities |
| **Authentication Package** | `packages/auth` | 16 | 3,145 | JOSE, Scrypt Password Hashing, RBAC Middleware |
| **TOTAL PHYSICAL CODEBASE** | **ALL PACKAGES & APPS** | **2,362** | **2,571,737** | **TypeScript Monorepo (PNPM Workspaces)** |

---

## 2. Infrastructure & Runtime Topology

1. **Database Engine**: Native PostgreSQL 18.4 running on port `5432` (`data/db-native-utf8`).
   - 581 tables across 9 schemas.
   - `clinical` (346 tables), `company` (135 tables), `public` (65 tables), `core` (33 tables), `drizzle` (1 table), `pharmacy` (1 table).
   - Authoritative database encoding: `UTF-8`.
2. **API Gateway**: Fastify HTTP/2 capable daemon listening on port `4000`.
   - Comprehensive RBAC middleware with 442 RLS-enforced database tables.
   - Idempotency plugin (`apps/api-gateway/src/plugins/idempotency.ts`).
3. **Frontend Presentation**:
   - `apps/partner-platform` (Port 5173): Hospital, Clinic, OPD, Pharmacy POS, LIMS, RIS.
   - `apps/patient-app` (Port 5174): Patient mobile application.
   - `apps/landing-page` (Port 5175): Public discovery & slot booking.
   - `apps/company-platform` (Port 5177): Executive HQ and monetization portal.
4. **Master Unified Gateway Hub**: `scripts/unified-gateway.mjs` listening on port `3000` routing reverse-proxy traffic.
5. **Auxiliary Healthcare Agents**:
   - Local Hardware Agent (LHA): Port `18080` (thermal receipt printers, lab auto-analyzers).
   - DICOM PACS Orthanc Server: Port `8042` (DICOMweb & C-STORE).

---

## 3. Tooling & Workspace Configuration

- **Package Manager**: PNPM / NPM (`tooling/pnpm.cjs` bundled).
- **Workspace Manifest**: `pnpm-workspace.yaml` defining:
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
    - 'tooling/*'
  ```
- **Build Orchestration**: Root `package.json` with scripts for `dev:all`, `build`, `lint`, `typecheck`, and `test`.
- **TypeScript Configuration**: Strict compilation target `ES2022`, module resolution `NodeNext`.
