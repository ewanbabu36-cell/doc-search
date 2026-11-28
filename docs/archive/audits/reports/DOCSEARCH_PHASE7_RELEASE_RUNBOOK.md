# DOC SEARCH — PHASE 7.9 CONTROLLED PRODUCTION PILOT RELEASE RUNBOOK
## Operational Deployment, Pre-Flight Verification, Service Bringup, Smoke Testing & Rollback Protocols

**Repository:** `DOC SEARCH`  
**Branch:** `audit/master-forensic-remediation`  
**Certified Baseline:** `e2b0d4d`  
**Date:** November 2026  
**Auditor / Agent:** Antigravity (Google DeepMind)  
**Standard:** ITIL v4 Release Management & SRE Operational Playbooks  

---

## 1. PRE-FLIGHT VERIFICATION (T-60 MINUTES)

Before initiating pilot traffic routing, the deployment engineer must verify all pre-requisites:

### 1.1 Environment Variables & Cryptographic Secrets
Verify that production environment variables are configured and meet minimum entropy standards:
```bash
# Verify environment validator passes with production flags
NODE_ENV=production node -e "import('@docsearch/shared-core').then(m => m.validateProductionEnv())"
```
Mandatory non-default secrets:
- `JWT_SECRET`: Minimum 32 characters, high entropy.
- `LICENSE_HMAC_SECRET`: Minimum 32 characters.
- `ENCRYPTION_KEY`: Minimum 32 characters for AES-256-GCM.
- `DATABASE_URL`: Authenticated connection string targeting `docsearch_app` user (NOBYPASSRLS).

### 1.2 PostgreSQL 18.4 Database State & RLS Verification
```bash
# 1. Verify PostgreSQL is listening on port 5432
node -e "import('pg').then(async ({ Pool }) => { const p = new Pool(); const r = await p.query('SELECT version(), current_user;'); console.log(r.rows[0]); await p.end(); })"

# 2. Verify migration journal status
node scripts/verify-migration-journal.mjs

# 3. Verify RLS is enabled across core tables
node -e "import('pg').then(async ({ Pool }) => { const p = new Pool(); const r = await p.query('SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname IN (\'clinical\', \'core\');'); console.log('RLS Enabled tables:', r.rows.filter(x => x.rowsecurity).length); await p.end(); })"
```

---

## 2. PILOT TENANT PROVISIONING (T-30 MINUTES)

Ensure that all three pilot cohort organizations are provisioned in PostgreSQL:

```bash
# Seed or verify pilot cohort operational hierarchy
node scripts/seed-pilot-cohorts.mjs
```
Verified Pilot Seeds:
- **Partner Alpha (Clinic):** `00000000-0000-4000-8000-000000000001` (Plan: Solo Clinic Annual)
- **Partner Beta (Lab):** `00000000-0000-4000-8000-000000000002` (Plan: Pathology Annual)
- **Partner Gamma (Hospital):** `00000000-0000-4000-8000-000000000003` (Plan: Hospital Enterprise)

---

## 3. SERVICE DAEMON BRINGUP (T-15 MINUTES)

Bring up all services across ports:

| Service | Port | Process Command | Healthcheck URL |
| :--- | :---: | :--- | :--- |
| **Fastify API Gateway** | `4000` | `node apps/api-gateway/dist/server.js` | `http://localhost:4000/api/v1/health` |
| **Orthanc PACS Server** | `8042` | Docker / Binary daemon | `http://localhost:8042/system` |
| **Local Health Agent** | `18080` | `node packages/local-health-agent/dist/index.js` | `http://localhost:18080/health` |
| **Partner Platform SPA** | `5173` | `npx vite preview --port 5173` | `http://localhost:5173/` |
| **Patient Mobile App** | `5174` | `npx vite preview --port 5174` | `http://localhost:5174/` |
| **Landing Page** | `5175` | `npx vite preview --port 5175` | `http://localhost:5175/` |
| **Company Executive UI**| `5177` | `npx vite preview --port 5177` | `http://localhost:5177/` |

```bash
# Execute master bringup supervisor
node scripts/start-all.js
```

---

## 4. POST-DEPLOYMENT SMOKE VERIFICATION (T-0)

Immediately execute the automated verification test harness:

```bash
# 1. Execute P0 Production Security Audit
node tests/security/p0-production-security-audit.mjs

# 2. Execute Negative Security Test Suite
node tests/security/phase1-remediation-negative-tests.test.mjs

# 3. Execute Master Critical Healthcare Workflows
node tests/certification/phase7-critical-workflows.mjs

# 4. Execute Real-Browser Headless Chrome CDP Verification
node tests/frontend/phase7-frontend-cdp-certification.mjs
```

### Passing Criteria for Traffic Routing
- All 4 test scripts must exit with **Code 0 (100% Pass)**.
- Chrome CDP test must report **0 white screens and 0 fatal uncaught exceptions**.

---

## 5. EMERGENCY ROLLBACK RUNBOOK

If any critical failure or data integrity defect is detected during pilot operations:

### Trigger Condition
- Any cross-tenant data bleed.
- Any unhandled financial calculation discrepancy $> ₹0.00$.
- Any crash of the Fastify API Gateway resulting in continuous HTTP 5xx responses.

### Rollback Execution Steps
1. **Isolate Ingress Traffic:**
   ```bash
   node scripts/emergency-production-freeze.mjs --enable --reason="Severity 1 Rollback"
   ```
2. **Execute Database Point-in-Time Restore:**
   ```bash
   node scripts/dr-backup-engine.mjs --restore --snapshot=LATEST
   ```
3. **Re-verify Relational Parity:**
   ```bash
   node tests/reliability/phase6-backup-restore.mjs
   ```
4. **Notify Clinical Pilot Coordinator:**
   - Transmit incident summary to on-site hospital coordinators at Partners Alpha, Beta, and Gamma.
   - Switch operational desk to dual-record shadow mode.
