# DOC SEARCH — Monorepo Build Inventory & Workspace Matrix

| Workspace / Project | Type | Purpose | Dependencies | Build Command | Output Artifact | Status |
|---|---|---|---|---|---|---|
| `@docsearch/shared-core` | Package | Core utilities, error primitives, logging, and security validators | None | `tsc` | `packages/shared-core/dist/` | **VERIFIED** |
| `@docsearch/api-contracts` | Package | Zod DTO contracts and request/response schemas | `shared-core`, `zod` | `tsc` | `packages/api-contracts/dist/` | **VERIFIED** |
| `@docsearch/database` | Package | PostgreSQL schema, Drizzle ORM models, and RLS security context | `drizzle-orm`, `postgres` | `tsc` | `packages/database/dist/` | **VERIFIED** |
| `@docsearch/auth` | Package | JWT validation, RBAC evaluator, session management, and audit chaining | `shared-core`, `database` | `tsc` | `packages/auth/dist/` | **VERIFIED** |
| `@docsearch/ui-kit` | Package | Design system, tokens, and reusable healthcare UI components | `react`, `lucide-react` | `tsc` | `packages/ui-kit/dist/` | **VERIFIED** |
| `@docsearch/api-gateway` | Service | Fastify API Gateway with security plugins, RBAC guards, and domain routes | `auth`, `database`, `shared-core` | `tsc` | `apps/api-gateway/dist/` | **VERIFIED** |
| `@docsearch/company-platform` | Application | Multi-tenant SaaS Management & Administration Platform | `ui-kit`, `api-contracts`, `auth` | `tsc && vite build` | `apps/company-platform/dist/bundle/` | **VERIFIED** |
| `@docsearch/partner-platform` | Application | Hospital Management & Clinical Operation Portal | `ui-kit`, `api-contracts`, `auth` | `tsc && vite build` | `apps/partner-platform/dist/bundle/` | **VERIFIED** |
