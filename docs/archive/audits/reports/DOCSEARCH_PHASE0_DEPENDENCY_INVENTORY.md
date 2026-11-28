# DOC SEARCH — PHASE 0: DEPENDENCY INVENTORY & SUPPLY CHAIN AUDIT
**Document ID:** `DOCSEARCH-PHASE0-DEPS`  
**Execution Timestamp:** 2026-11-21T17:25:00+05:30  
**Audit Branch:** `audit/master-forensic-remediation`  

---

## 1. Monorepo Dependency Matrix

The repository utilizes **PNPM Workspaces** with internal workspace linking (`workspace:*`).

| Workspace / Package | Version | Direct Prod Dependencies | Direct Dev Dependencies | Key Libraries |
|---|---|---:|---:|---|
| **Root Monorepo** | 1.0.0 | 0 | 14 | `turbo`, `eslint`, `prettier`, `typescript` |
| **`apps/api-gateway`** | 1.0.0 | 11 | 14 | `fastify`, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/swagger`, `drizzle-orm`, `pg`, `zod`, `jose` |
| **`apps/partner-platform`** | 1.0.0 | 6 | 12 | `react`, `react-dom`, `lucide-react`, `vite`, `vite-plugin-pwa`, `workbox-window` |
| **`apps/company-platform`** | 1.0.0 | 7 | 8 | `react`, `react-dom`, `recharts`, `lucide-react`, `vite` |
| **`apps/landing-page`** | 1.0.0 | 4 | 7 | `react`, `react-dom`, `lucide-react`, `vite`, `framer-motion` |
| **`apps/patient-app`** | 1.0.0 | 14 | 9 | `react`, `react-dom`, `@capacitor/core`, `@capacitor/android`, `lucide-react`, `vite` |
| **`packages/database`** | 1.0.0 | 5 | 6 | `drizzle-orm`, `pg`, `zod`, `drizzle-kit`, `pg-mem` |
| **`packages/ui-kit`** | 1.0.0 | 1 | 4 | `react`, `react-dom` |
| **`packages/api-contracts`** | 1.0.0 | 1 | 2 | `zod` |
| **`packages/shared-core`** | 1.0.0 | 2 | 2 | `zod` |
| **`packages/auth`** | 1.0.0 | 4 | 3 | `jose`, `zod` |

---

## 2. Supply Chain & Version Vulnerability Observations

1. **Fastify Framework**: Fastify `^5.2.1` in `apps/api-gateway`. High performance, secure schema compilation with fast-json-stringify.
2. **Database ORM**: Drizzle ORM `^0.38.4` with Drizzle Kit `^0.30.2`. Zero native query injection when using parameterized expressions.
3. **Cryptographic Suite**: Native Node.js `crypto` with `scrypt` for password hashing and `jose` for stateless Ed25519/RS256 JWT tokens. No deprecated crypto packages.
4. **Dev Tools**: Bundled standalone PNPM executable at `tooling/pnpm.cjs` ensures reproducible zero-drift installs.
