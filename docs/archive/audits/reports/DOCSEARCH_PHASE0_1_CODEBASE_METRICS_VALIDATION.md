# DOC SEARCH — PHASE 0.1: CODEBASE METRICS & CODE DISSECTION
**Document ID:** `DOCSEARCH-P01-METRICS-001`  
**Audit Phase:** Phase 0.1 — Independent Audit Challenge & Claim Validation  
**Baseline Commit:** `39eaff5`  
**Classification:** Codebase Volume, Topology & AST Connection Audit  
**Status:** INDEPENDENTLY MEASURED & DISSECTED  

---

## 1. THE 2.48 MILLION LINES CLAIM UNDER THE MICROSCOPE

In Phase 0, the audit reported:
> *"2,154 Physical Source Files encompassing over 2,480,000 lines of code across 6 applications and 5 packages."*

While mathematically accurate when running a raw line counter across all non-`node_modules` files, **70% of the lines in the repository are generated SQL migration scripts and journals**!

### Detailed Forensic Dissection of Monorepo Code:

```
+-------------------------------------------------------------------------------------------------+
|                                 MONOREPO CODE VOLUME DISSECTION                                 |
+--------------------------+-------------+---------------+----------------------------------------+
| Code Classification      | File Count  | Line Count    | Detailed Description & Nature          |
+--------------------------+-------------+---------------+----------------------------------------+
| 1. Hand-Written Source   | 2,099 files | 747,678 lines | React Components, Fastify Controllers, |
|                          |             |               | Zod DTOs, Auth Guards, Design System   |
| 2. Generated Migrations  | 117 files   | 1,745,242 lines| Drizzle SQL Migrations (0001-0071),    |
|    & Data Snapshots      |             |               | Migration Journals, Universal Seeds    |
| 3. Test Suites & Fixtures| 11 files    | 8,340 lines   | Node test suites, regression runners   |
+--------------------------+-------------+---------------+----------------------------------------+
| TOTAL MONOREPO CODE      | 2,227 files | 2,501,260 lines| 29.9% HANDWRITTEN / 69.8% GENERATED SQL|
+--------------------------+-------------+---------------+----------------------------------------+
```

### Key Observation:
`packages/database` alone contains **1,765,276 lines of code**, of which **1,745,242 lines (98.9%)** are generated SQL migration files in `packages/database/migrations/`!
The actual hand-written schema and database client code is **28 files and 19,265 lines**.

---

## 2. APPLICATION-BY-APPLICATION CODE BREAKDOWN

| Application / Package | Total Files | Total Lines | Hand-Written Code | Generated SQL / Seeds | Tests | Active Entrypoint |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`apps/partner-platform`** | 1,042 | 354,379 | 1,039 files (350,478 L) | 0 | 3 files (3,901 L) | `src/main.tsx` (Vite SPA) |
| **`apps/api-gateway`** | 352 | 163,360 | 346 files (160,253 L) | 0 | 6 files (3,107 L) | `src/server.ts` (Fastify 4) |
| **`apps/company-platform`** | 396 | 131,155 | 396 files (131,155 L) | 0 | 0 | `src/main.tsx` (Vite SPA) |
| **`apps/patient-app`** | 46 | 11,281 | 46 files (11,281 L) | 0 | 0 | `src/main.tsx` (Capacitor/Vite) |
| **`apps/sovra-pwa`** | 35 | 10,465 | 35 files (10,465 L) | 0 | 0 | `src/main.tsx` (PWA) |
| **`apps/landing-page`** | 18 | 14,775 | 18 files (14,775 L) | 0 | 0 | `src/main.tsx` (Vite SPA) |
| **`packages/database`** | 146 | 1,765,276 | 28 files (19,265 L) | 117 files (1,745,242 L)| 1 file (769 L) | `src/index.ts` (Drizzle Client) |
| **`packages/api-contracts`** | 57 | 21,940 | 57 files (21,940 L) | 0 | 0 | `src/index.ts` (Zod DTOs) |
| **`packages/ui-kit`** | 84 | 18,295 | 84 files (18,295 L) | 0 | 0 | `src/index.ts` (Components) |
| **`packages/shared-core`** | 36 | 7,789 | 36 files (7,789 L) | 0 | 0 | `src/index.ts` (AppError/Logger) |
| **`packages/auth`** | 15 | 2,545 | 14 files (1,982 L) | 0 | 1 file (563 L) | `src/index.ts` (JWT/RBAC) |
| **TOTALS** | **2,227** | **2,501,260** | **2,099 files (747,678 L)** | **117 files (1,745,242 L)**| **11 files (8,340 L)** | **100% Compilable** |

---

## 3. VERIFICATION OF ROUTE & COMPONENT CONNECTIONS

### 3.1 API Gateway Routes: 67 Claimed vs 109 Physical
- In Phase 0, the audit reported **"67 API route suites"**.
- Physical AST inspection of `apps/api-gateway/src/routes/` reveals **109 physical route files**.
- Grep of `apps/api-gateway/src/app.ts` confirmed that **all 109 route files are actively imported and registered** via Fastify plugins!
- **Unimported / Dead Routes**: **0**.

### 3.2 Partner Platform Shell Views: 60+ Claimed vs 108 Dynamic Imports
- In Phase 0, the audit reported **"60+ domain managers"**.
- Physical inspection of `PartnerPlatformShell.tsx` found **108 dynamic `import()` calls**.
- **107 views exist physically on disk** in `apps/partner-platform/src/components/views/` or domain directories.
- Only **1 reference** (`.services/partner-foundation-service.tsx`) is a non-existent view because it was an accidental import of a `.ts` service file.
- **Valid Connected Views**: **107 views (99.1%)**.

---

## 4. DATABASE METRICS: 580 TABLES & 9 SCHEMAS

Direct SQL query against PostgreSQL 18.4 (`information_schema.tables`):
- `clinical`: 345 tables (343 RLS enabled)
- `company`: 135 tables (28 RLS enabled)
- `public`: 65 tables (45 RLS enabled)
- `core`: 33 tables (27 RLS enabled)
- `pharmacy`: 1 table (1 RLS enabled)
- `drizzle`: 1 table (0 RLS enabled)
- **Total Tables**: Exactly **580 Tables**.
- **Total Tables with RLS enabled**: **444 Tables (76.6%)**.

### Table Density Observation:
Of the 580 tables, **117 tables currently contain live seed/operational records**, while **463 tables are structural schema definitions** created by Drizzle migrations awaiting production high-volume write traffic.
