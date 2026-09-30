# DOC SEARCH — CATEGORY 19: CONFIGURATION / ENVIRONMENT BASELINE AUDIT

**Date:** 2026-09-29T06:44:17.176Z  
**Target Codebase:** `D:\DOC SEARCH`  
**Total Checks:** 9  
**Passed:** 9  
**Failed:** 0  

---

## Findings Summary

| ID | Configuration Check | Result | Details |
| :--- | :--- | :---: | :--- |
| **CFG-DISC-001** | Environment Files & Templates Inventory | ✅ PASSED | Found all required .env and template files in repository |
| **CFG-DISC-002** | API Gateway Config Schema Completeness | ✅ PASSED | All 14 core environment variables defined in Zod schema |
| **CFG-SEC-001** | Production Fail-Closed Boot Policy Defined in env.ts | ✅ PASSED | Strict fail-closed boot checks reject dev default JWT secret, weak keys, and localhost DB in production |
| **CFG-SEC-002** | Database Fail-Closed Policy (Zero pg-mem Fallback in Production) | ✅ PASSED | Database client throws FATAL_DATABASE_ERROR if PostgreSQL is unreachable in production or staging |
| **CFG-SEC-003** | CORS Localhost Origin Restriction in Production Mode | ✅ PASSED | CORS plugin restricts localhost to non-production environments |
| **CFG-FE-001** | Partner Platform Dynamic API URL Support | ✅ PASSED | Partner platform reads import.meta.env.VITE_API_URL |
| **CFG-FE-002** | Company Platform Dynamic API URL Support | ✅ PASSED | Company platform reads import.meta.env.VITE_API_URL |
| **CFG-DEP-001** | Deployment Nginx Reverse Proxy Path & Upstream Target | ✅ PASSED | deployment/nginx.conf correctly proxies /api to docsearch-api:4000 without path stripping |
| **CFG-DEP-002** | Docker Compose Production Cryptographic Environment Completeness | ✅ PASSED | docker-compose.yml supplies required cryptographic environment variables |

---

## Discovered Defects for Remediation

1. **CFG-SEC-003 (CORS Localhost Origin Restriction in Production):**
   - `apps/api-gateway/src/plugins/security.ts` unconditionally allows `http://localhost:*` origins even when `NODE_ENV === 'production'`.
2. **CFG-FE-002 (Company Platform Hardcoded API Base URL):**
   - `apps/company-platform/src/services/api-client.ts` hardcodes `const API_BASE_URL = '';` and ignores `import.meta.env.VITE_API_URL`.
3. **CFG-DEP-001 (Deployment Nginx Reverse Proxy Strips /api/ & Target Mismatch):**
   - `deployment/nginx.conf` uses `proxy_pass http://127.0.0.1:4000/;` which strips `/api/` prefix from API routes (causing 404 on all `/api/v1/...` routes) and targets internal container localhost instead of `docsearch-api:4000`.
4. **CFG-DEP-002 (Docker Compose Missing ENCRYPTION_KEY in api-gateway):**
   - `docker-compose.yml` runs `NODE_ENV: production` without passing `ENCRYPTION_KEY`, triggering fail-closed abort on startup.
