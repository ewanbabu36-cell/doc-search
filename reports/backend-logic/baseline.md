# DOC SEARCH — CATEGORY 7: BACKEND LOGIC BASELINE AUDIT REPORT

**Audit Date**: 2026-09-28T23:47:48.889Z  
**Environment**: Native PostgreSQL 18.4 (Port 5432), Fastify API Gateway (Port 4000)  
**Standard**: Zero-Trust / Production-Grade / Scope-Frozen / Native PostgreSQL 18.4

---

## 1. Monorepo Backend Inventory

| Component Layer | Scanned Files | Discovered Entities |
|---|---|---|
| **API Gateway Routes** | 64 files | 1004 registered endpoints |
| **Backend Services** | 100 files | 100 service classes/instances |
| **Backend Repositories** | 47 files | 47 repository modules |
| **Database Schema** | 20 files | 499 PostgreSQL tables |
| **Total Backend Source Files** | 271 files | Full execution graph covered |

---

## 2. Route Security & Guard Summary
- Total Endpoints: 1004
- Endpoints with Explicit Authenticate Hook: 919
- Endpoints with Permission Authorization Guard: 459
- Endpoints with Commercial Module Access Guard: 523
- Endpoints with Idempotency Middleware: 0

---

## 3. Discovered Logic Smells & Suspicious Patterns (Taxonomy A - O)
Total Suspicious Touchpoints: **643**

| Category | Smell Description | Location | Code Snippet |
|---|---|---|---|
| D. Incorrect database logic | In-memory Map used for operational state instead of PostgreSQL | `apps/api-gateway/src/ai/chat-rate-limiter.ts:20` | `private userWindows = new Map<string, WindowRecord>();` |
| D. Incorrect database logic | In-memory Map used for operational state instead of PostgreSQL | `apps/api-gateway/src/ai/chat-rate-limiter.ts:21` | `private tenantWindows = new Map<string, WindowRecord>();` |
| D. Incorrect database logic | In-memory Map used for operational state instead of PostgreSQL | `apps/api-gateway/src/ai/voice/voice-rate-limiter.ts:31` | `private userBuckets = new Map<string, RateLimitBucket>();` |
| D. Incorrect database logic | In-memory Map used for operational state instead of PostgreSQL | `apps/api-gateway/src/ai/voice/voice-rate-limiter.ts:32` | `private tenantBuckets = new Map<string, RateLimitBucket>();` |
| D. Incorrect database logic | In-memory Map used for operational state instead of PostgreSQL | `apps/api-gateway/src/ai/voice/voice-rate-limiter.ts:33` | `private abuseTrackers = new Map<string, AbuseTracker>();` |
| D. Incorrect database logic | In-memory Map used for operational state instead of PostgreSQL | `apps/api-gateway/src/plugins/idempotency.ts:23` | `const l1IdempotencyCache = new Map<string, IdempotentRecord>();` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:80` | `tenantId = '00000000-0000-4000-8000-000000000000';` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:84` | `tenantId = arg1 // '00000000-0000-4000-8000-000000000000';` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:104` | `const dbTenantId = isUuid ? tenantId : '00000000-0000-4000-8000-000000000000';` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:187` | `const dbTenantId = isUuid ? tenantId : '00000000-0000-4000-8000-000000000000';` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/plugins/idempotency.ts:204` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/plugins/idempotency.ts:253` | `} catch {}` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:276` | `tenantId = arg1 // '00000000-0000-4000-8000-000000000000';` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:285` | `tenantId = '00000000-0000-4000-8000-000000000000';` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:308` | `const dbTenantId = isUuid ? tenantId : '00000000-0000-4000-8000-000000000000';` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:348` | `tenantId = '00000000-0000-4000-8000-000000000000';` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:352` | `tenantId = arg1 // '00000000-0000-4000-8000-000000000000';` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:363` | `const dbTenantId = isUuid ? tenantId : '00000000-0000-4000-8000-000000000000';` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/plugins/idempotency.ts:374` | `} catch {}` |
| H. Incorrect tenant isolation | Hardcoded UUID / seed facility alias in production code | `apps/api-gateway/src/plugins/idempotency.ts:398` | `const tenantId = (request as any).session?.tenantId // (request.headers['x-tenant-id'] as string) // '00000000-0000-4000-8000-000000000000';` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:357` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:367` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:378` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:393` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:403` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:423` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:444` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:454` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:468` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:488` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:509` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:519` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:529` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:539` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:559` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts:588` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AnalyticsRepository.ts:16` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AnalyticsRepository.ts:25` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AnalyticsRepository.ts:43` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/AnalyticsRepository.ts:59` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/CommunicationRepository.ts:36` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/CommunicationRepository.ts:48` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/CommunicationRepository.ts:63` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/CommunicationRepository.ts:82` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/CommunicationRepository.ts:104` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/CommunicationRepository.ts:144` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/CompanyAdminRepository.ts:221` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/ComplianceRepository.ts:13` | `} catch {}` |
| N. Incorrect error-path logic | Silent catch block swallowing exceptions | `apps/api-gateway/src/repositories/company/ComplianceRepository.ts:22` | `} catch {}` |
| D. Incorrect database logic | In-memory Map used for operational state instead of PostgreSQL | `apps/api-gateway/src/repositories/company/HqCommandCenterRepository.ts:118` | `const partnerMap = new Map<string, any>();` |

*(Showing first 50 logic smells out of 643. Full list available in reports/backend-logic/baseline.json)*
