# Category 16: Application Security Baseline Audit Report
Generated: 2026-09-29T05:26:14.838Z

## Executive Summary
- **Total Backend Routes Scanned**: 768
- **Total Findings**: 35
  - **CRITICAL**: 2
  - **HIGH**: 33
  - **MEDIUM**: 0
  - **LOW**: 0
- **Plaintext Passwords in PostgreSQL (Port 5432)**: 0
- **Live API Gateway Security Response (Port 4000)**: ONLINE (Unauth 401: true)

## Security Baseline Findings
| ID | Severity | Category | Title | File | Threat |
|---|---|---|---|---|---|
| SEC-FIND-001 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/command-center/overview | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-002 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/command-center/partners | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-003 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/command-center/licenses | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-004 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/command-center/revenue | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-005 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/command-center/throughput | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-006 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/command-center/security | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-007 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/command-center/health | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-008 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/command-center/export | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-009 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/company/command-center/overview | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-010 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/company/command-center/partners | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-011 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/company/command-center/licenses | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-012 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/company/command-center/revenue | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-013 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/company/command-center/throughput | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-014 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/company/command-center/security | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-015 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/company/command-center/health | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-016 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/company/command-center/export | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-017 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/analytics/overview | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-018 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/analytics/partners | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-019 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/analytics/licenses | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-020 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/analytics/revenue | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-021 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/analytics/throughput | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-022 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/analytics/security | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-023 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/analytics/health | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-024 | **HIGH** | AUTHORIZATION_RBAC | Unauthenticated API Route: GET /api/v1/hq/analytics/export | `apps/api-gateway/src/routes/company/hq-command-center.routes.ts` | Unauthorized caller can invoke business logic without valid JWT or session. |
| SEC-FIND-025 | **CRITICAL** | SECRET_CREDENTIAL_EXPOSURE | Hardcoded Credential Pattern (DATABASE_PASSWORD) | `apps/api-gateway/src/config/env.ts:8` | Accidental leakage of production credentials or secrets. |
| SEC-FIND-026 | **CRITICAL** | SECRET_CREDENTIAL_EXPOSURE | Hardcoded Credential Pattern (DATABASE_PASSWORD) | `packages/database/drizzle.config.ts:8` | Accidental leakage of production credentials or secrets. |
| SEC-FIND-027 | **HIGH** | SQL_INJECTION | Dynamic SQL String Interpolation | `packages/database/src/client.ts:325` | Potential SQL injection if interpolated variable originates from untrusted user input. |
| SEC-FIND-028 | **HIGH** | SQL_INJECTION | Dynamic SQL String Interpolation | `packages/database/src/client.ts:327` | Potential SQL injection if interpolated variable originates from untrusted user input. |
| SEC-FIND-029 | **HIGH** | SQL_INJECTION | Dynamic SQL String Interpolation | `packages/database/src/security/engine-rls.ts:30` | Potential SQL injection if interpolated variable originates from untrusted user input. |
| SEC-FIND-030 | **HIGH** | SQL_INJECTION | Dynamic SQL String Interpolation | `packages/database/src/security/engine-rls.ts:32` | Potential SQL injection if interpolated variable originates from untrusted user input. |
| SEC-FIND-031 | **HIGH** | XSS | Unescaped HTML Rendering (dangerouslySetInnerHTML/eval) | `apps/company-platform/src/components/company-admin/EmployeeDirectoryView.tsx:203` | Cross-Site Scripting (XSS) if content contains user-supplied inputs. |
| SEC-FIND-032 | **HIGH** | XSS | Unescaped HTML Rendering (dangerouslySetInnerHTML/eval) | `apps/company-platform/src/utils/partnerWelcomeKitPdf.ts:631` | Cross-Site Scripting (XSS) if content contains user-supplied inputs. |
| SEC-FIND-033 | **HIGH** | XSS | Unescaped HTML Rendering (dangerouslySetInnerHTML/eval) | `apps/partner-platform/src/components/MRDDomainManager.tsx:514` | Cross-Site Scripting (XSS) if content contains user-supplied inputs. |
| SEC-FIND-034 | **HIGH** | XSS | Unescaped HTML Rendering (dangerouslySetInnerHTML/eval) | `apps/partner-platform/src/services/mrd-management-service.ts:78` | Cross-Site Scripting (XSS) if content contains user-supplied inputs. |
| SEC-FIND-035 | **HIGH** | XSS | Unescaped HTML Rendering (dangerouslySetInnerHTML/eval) | `apps/partner-platform/src/services/mrd-management-service.ts:394` | Cross-Site Scripting (XSS) if content contains user-supplied inputs. |

## Live Database & Gateway State
- **PostgreSQL 18.4**: 0 hashed passwords stored, 0 plaintext passwords found. Active RLS policies: 22.
- **API Gateway Headers**:
  - `x-content-type-options`: nosniff
  - `x-frame-options`: DENY
  - `x-powered-by`: None (Hidden)
