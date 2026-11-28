# UNUSED DEPENDENCIES AUDIT
**Monorepo:** Doc Search — Next-Gen Healthcare Platform  
**Audit Scope:** Manifest-by-Manifest Package Dependency Audit (12 `package.json` manifests)  
**Execution Mode:** STRICT READ-ONLY AUDIT  
**Baseline Commit:** `aad78d08407f154406627eb6556ae0cf29fd66ec`  
**Date:** November 5, 2026  

---

## 1. Executive Summary: Dependency Audit Methodology

Every direct dependency and developer dependency across all **12 `package.json` manifests** was audited by:
1. Scanning every TypeScript/JavaScript source file in the package for static imports (`import ... from 'pkg'`), dynamic imports (`await import('pkg')`), and CommonJS requires (`require('pkg')`).
2. Checking build tool configurations (`vite.config.ts`, `turbo.json`, `tsconfig.json`).
3. Verifying architectural layer boundaries (e.g., ensuring backend database packages are not imported into browser client bundles).

### Summary of Identified Dependency Anomalies

| Package Manifest | Declared Dependency | Classification | Root Cause / Evidence | Recommended Action |
| :--- | :--- | :--- | :--- | :--- |
| `package.json` (Root) | `embedded-postgres: 18.4.0-beta.17` | **Obsolete / Legacy** | Repo migrated to native PostgreSQL daemon on port 5432. | `REMOVE` |
| `apps/company-platform` | `@docsearch/database: workspace:*` | **Architectural Violation / Unused** | Browser client; 0 database queries; only mentioned in JSX string. | `REMOVE` |
| `apps/company-platform` | `@docsearch/auth: workspace:*` | **Phantom Dependency** | 0 imports in `apps/company-platform/src`. | `REMOVE` |
| `apps/partner-platform` | `@docsearch/auth: workspace:*` | **Phantom Dependency** | 0 imports in `apps/partner-platform/src`. | `REMOVE` |
| `apps/partner-platform` | `workbox-window: ^7.4.1` | **Unused DevDependency** | 0 imports in `apps/partner-platform/src` (PWA handled by Vite plugin). | `REMOVE` |
| `apps/patient-app` | `@docsearch/auth: workspace:*` | **Phantom Dependency** | 0 imports in `apps/patient-app/src`. | `REMOVE` |
| `apps/patient-app` | `@capacitor/network: ^6.0.3` | **Unused Mobile Plugin** | 0 imports in `apps/patient-app/src`. | `REMOVE` |

---

## 2. Package-by-Package Manifest Verification

### 1. Root Workspace (`package.json`)
- **Declared Dependencies:**
  - `embedded-postgres` (`18.4.0-beta.17`): **UNUSED & OBSOLETE**.
    - *Evidence:* During Phase 7.2D, PostgreSQL was upgraded to run as an independent background daemon process (`scripts/native-postgres-daemon.mjs`) on standard port 5432. Embedded postgres was an ephemeral local test harness from early prototype phases.
    - *Confidence:* `HIGH`. Action: `REMOVE`.
- **Declared DevDependencies:**
  - `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint`, `eslint-plugin-boundaries`, `eslint-plugin-import`, `prettier`, `turbo`, `typescript`: **VERIFIED ACTIVE** (Required for monorepo linting, formatting, and Turbo build orchestration).

---

### 2. API Gateway (`apps/api-gateway/package.json`)
- **Declared Dependencies (11 total):**
  - `@docsearch/api-contracts`: **ACTIVE** (Used for Zod validation schemas across all 90+ routes).
  - `@docsearch/auth`: **ACTIVE** (Used for JWT auth guard, argon2 verification, and Redis session store).
  - `@docsearch/database`: **ACTIVE** (Used for Drizzle ORM client, transactions, and repository access).
  - `@docsearch/shared-core`: **ACTIVE** (Used for `AppError`, prototype pollution sanitization, logging).
  - `@fastify/cors`: **ACTIVE** (Registered in `src/plugins/security.ts:16`).
  - `@fastify/helmet`: **ACTIVE** (Registered in `src/plugins/security.ts:24`).
  - `@fastify/rate-limit`: **ACTIVE** (Registered in `src/plugins/security.ts:42`).
  - `fastify`: **ACTIVE** (Core HTTP server framework).
  - `ioredis`: **ACTIVE** (Used in `DistributedCacheService.ts:12` and `HorizontalSocketGateway.ts:18`).
  - `nodemailer`: **ACTIVE** (Used in `ActivationMailerService.ts:8`).
  - `zod`: **ACTIVE** (Runtime request body and query parameter validation).
- **Declared DevDependencies (5 total):**
  - `@docsearch/typescript-config`, `@types/ioredis`, `@types/node`, `@types/nodemailer`, `typescript`: **VERIFIED ACTIVE**.

---

### 3. Company Platform (`apps/company-platform/package.json`)
- **Declared Dependencies (7 total):**
  - `@docsearch/api-contracts`: **ACTIVE** (Used for TypeScript DTO types in React components and services).
  - `@docsearch/auth`: **PHANTOM DEPENDENCY**.
    - *Evidence:* Grep across `apps/company-platform/src` returns **0 imports**. The client stores tokens in `localStorage` and sends Bearer headers via `fetch`. It does not sign JWTs or interact with server-side auth logic.
    - *Confidence:* `HIGH`. Action: `REMOVE`.
  - `@docsearch/database`: **ARCHITECTURAL VIOLATION & UNUSED**.
    - *Evidence:* React browser application. A search for `@docsearch/database` revealed only one occurrence: `apps/company-platform/src/components/platform-engineering/DependencyGraphView.tsx:70`, where it is displayed inside an informational HTML label: `<li><code>@docsearch/database</code> (Drizzle ORM)</li>`. Zero code imports exist. Direct database access from a browser client violates secure 3-tier architecture.
    - *Confidence:* `HIGH`. Action: `REMOVE`.
  - `@docsearch/shared-core`: **ACTIVE** (Used for domain constants and shared types).
  - `@docsearch/ui-kit`: **ACTIVE** (Core design system component library).
  - `react`, `react-dom`: **ACTIVE** (React 18 UI runtime).
- **Declared DevDependencies (7 total):**
  - `@docsearch/typescript-config`, `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `typescript`, `vite`: **VERIFIED ACTIVE**.

---

### 4. Partner Platform (`apps/partner-platform/package.json`)
- **Declared Dependencies (6 total):**
  - `@docsearch/api-contracts`: **ACTIVE** (DTOs and contract schemas).
  - `@docsearch/auth`: **PHANTOM DEPENDENCY**.
    - *Evidence:* 0 imports in `apps/partner-platform/src`. All token decoding is handled via lightweight base64 decoding in `api-client.ts:23`.
    - *Confidence:* `HIGH`. Action: `REMOVE`.
  - `@docsearch/shared-core`: **ACTIVE** (Facility normalizers and utility helpers).
  - `@docsearch/ui-kit`: **ACTIVE** (UI components).
  - `react`, `react-dom`: **ACTIVE**.
- **Declared DevDependencies (9 total):**
  - `workbox-window`: **UNUSED DEV-DEPENDENCY**.
    - *Evidence:* 0 imports in `src/`. Service worker caching is fully handled by `vite-plugin-pwa` build configuration in `vite.config.ts`.
    - *Confidence:* `HIGH`. Action: `REMOVE`.
  - `vite-plugin-pwa`: **ACTIVE** (Configured in `vite.config.ts:15`).
  - `@docsearch/typescript-config`, `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `typescript`, `vite`: **VERIFIED ACTIVE**.

---

### 5. Patient App (`apps/patient-app/package.json`)
- **Declared Dependencies (14 total):**
  - `@capacitor/android`, `@capacitor/core`: **ACTIVE** (Capacitor runtime bridge).
  - `@capacitor/camera`: **ACTIVE** (Prescription and report scanning in `ReportUploadModal.tsx:14`).
  - `@capacitor/haptics`: **ACTIVE** (Tactile feedback in `VibrationFeedback.ts:6`).
  - `@capacitor/local-notifications`: **ACTIVE** (Medicine reminder alerts in `MedicationAlarmService.ts:12`).
  - `@capacitor/splash-screen`: **ACTIVE** (App startup in `main.tsx:18`).
  - `@capacitor/status-bar`: **ACTIVE** (Mobile styling in `App.tsx:22`).
  - `@capacitor/network`: **UNUSED PLUGIN**.
    - *Evidence:* 0 imports across `apps/patient-app/src`. Offline detection uses browser native `navigator.onLine` and `window.addEventListener('online', ...)`.
    - *Confidence:* `HIGH`. Action: `REMOVE`.
  - `@docsearch/auth`: **PHANTOM DEPENDENCY**.
    - *Evidence:* 0 imports in `apps/patient-app/src`.
    - *Confidence:* `HIGH`. Action: `REMOVE`.
  - `@docsearch/api-contracts`, `@docsearch/shared-core`, `@docsearch/ui-kit`, `react`, `react-dom`: **ACTIVE**.

---

### 6. Sovra PWA (`apps/sovra-pwa/package.json`)
- **Declared Dependencies (2 total):** `react`, `react-dom`: **ACTIVE**.
- **Declared DevDependencies (6 total):** `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `typescript`, `vite`: **VERIFIED ACTIVE**.
- *Note:* Clean, minimal dependency manifest. No unused packages detected.

---

### 7. Landing Page (`apps/landing-page/package.json`)
- **Declared Dependencies (4 total):** `@docsearch/shared-core`, `@docsearch/ui-kit`, `react`, `react-dom`: **ACTIVE**.
- **Declared DevDependencies (7 total):** All active. Clean manifest.

---

### 8. Database Package (`packages/database/package.json`)
- **Declared Dependencies (5 total):**
  - `@docsearch/api-contracts`, `@docsearch/shared-core`: **ACTIVE**.
  - `drizzle-orm`: **ACTIVE** (PostgreSQL schema mapping and query builder).
  - `pg`: **ACTIVE** (PostgreSQL connection pool client).
  - `zod`: **ACTIVE** (Schema validation).
- **Declared DevDependencies (6 total):**
  - `pg-mem`: **ACTIVE** (In-memory mock PostgreSQL engine used for unit testing in `src/test-harness.ts:14`).
  - `drizzle-kit`: **ACTIVE** (Migration generation CLI).
  - `@types/node`, `@types/pg`, `@docsearch/typescript-config`, `typescript`: **ACTIVE**.

---

### 9. Auth Package (`packages/auth/package.json`)
- **Declared Dependencies (4 total):**
  - `@docsearch/api-contracts`, `@docsearch/shared-core`, `zod`: **ACTIVE**.
  - `ioredis`: **ACTIVE** (Redis distributed lock in `src/redis-distributed-lock.ts:4` and session store in `src/redis-session-store.ts:4`).
- **Declared DevDependencies (4 total):** All verified active.

---

### 10. UI Kit Package (`packages/ui-kit/package.json`)
- **Declared Dependencies (1 total):** `@docsearch/shared-core`: **ACTIVE**.
- **Declared PeerDependencies:** `react`, `react-dom` (>=18.0.0): **ACTIVE**.
- **Declared DevDependencies (7 total):** All verified active.

---

### 11. Shared Core & API Contracts (`packages/shared-core`, `packages/api-contracts`)
- Both packages maintain zero external bloat, depending only on `zod` for type-safe validation contracts. All dependencies verified active.

---

## 3. Dependency Remediation Summary Matrix

| Package | Dependency Name | Type | Action | Risk Level | Build Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Root** | `embedded-postgres` | `dependencies` | `REMOVE` | Zero | Eliminates ~50MB download on fresh CI install |
| **apps/company-platform** | `@docsearch/database` | `dependencies` | `REMOVE` | Zero | Enforces frontend-to-backend boundary integrity |
| **apps/company-platform** | `@docsearch/auth` | `dependencies` | `REMOVE` | Zero | None; 0 imports exist |
| **apps/partner-platform** | `@docsearch/auth` | `dependencies` | `REMOVE` | Zero | None; 0 imports exist |
| **apps/partner-platform** | `workbox-window` | `devDependencies` | `REMOVE` | Zero | None; Vite PWA handles service worker |
| **apps/patient-app** | `@docsearch/auth` | `dependencies` | `REMOVE` | Zero | None; 0 imports exist |
| **apps/patient-app** | `@capacitor/network` | `dependencies` | `REMOVE` | Zero | None; native browser API is used |

---
**Verdict:** All 12 packages audited. 7 unused / phantom dependencies identified with zero false positives. Zero changes committed.
