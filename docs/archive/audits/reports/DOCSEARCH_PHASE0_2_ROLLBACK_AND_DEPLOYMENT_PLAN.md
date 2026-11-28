# DOC SEARCH — PHASE 0.2: ZERO-TRUST ROLLBACK & PRODUCTION DEPLOYMENT PLAN
**Execution Date:** 2026-11-06T09:35:00+05:30  
**Target Release:** Multi-Tenant PostgreSQL RLS Hardening (`docsearch_app` Least-Privilege Activation)  
**Standard:** ISO 27001 / HIPAA / NABH Disaster Resilience & Zero-Downtime Migration  
**Status:** VALIDATED & APPROVED FOR STAGING RELEASE  

---

## 1. Pre-Deployment Safety Principles

1. **Strict Staging-First Gate:** No code or configuration changes may be deployed directly to production. All changes must be verified first in an isolated staging environment matching production topology.
2. **Configuration Preservation for Instant Rollback:** The previous administrative connection configuration is encrypted and preserved in a secure vault (`.vault-master.key`) to enable single-command rollback within <60 seconds if anomalies arise.
3. **Zero Weakening of RLS:** Under no circumstances may RLS policies or `FORCE ROW LEVEL SECURITY` be relaxed, bypassed, or disabled to resolve edge cases.
4. **Data Masking Mandate:** Zero real patient names, ABHA numbers, phone numbers, or clinical histories may ever appear in log files, stdout, or deployment artifacts.

---

## 2. Step-by-Step Staged Deployment Runbook

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STAGED DEPLOYMENT SEQUENCE                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: PRE-FLIGHT VERIFICATION & SNAPSHOT                                  │
│ - Run schema validation: verify 444 tables have relrowsecurity = true.      │
│ - Take full binary pg_dump snapshot using migration role.                   │
│ - Store snapshot in encrypted vault: backups/pre_deployment_snapshot.enc    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: LEAST-PRIVILEGE ROLE PROVISIONING                                   │
│ - Execute Migration 0070 as migration admin:                                │
│   CREATE ROLE docsearch_app WITH LOGIN PASSWORD '***' NOSUPERUSER           │
│   NOBYPASSRLS NOCREATEDB NOCREATEROLE;                                      │
│ - Grant USAGE on schemas: public, core, clinical, company, pharmacy.        │
│ - Grant DML (SELECT, INSERT, UPDATE, DELETE) on all application tables.     │
│ - Grant USAGE on all sequences.                                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: RUNTIME CONFIGURATION SWITCH                                        │
│ - Update Kubernetes Secret / .env.production:                               │
│   DATABASE_URL=postgresql://docsearch_app:***@db-primary:5432/docsearch     │
│ - Update PgBouncer userlist.txt mapping for docsearch_app.                  │
│ - Migration scripts retain separate admin credentials (POSTGRES_ADMIN_URL). │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: ROLLING POD RESTART & SMOKE TESTING                                 │
│ - Perform rolling restart of API Gateway pods (maxSurge: 25%, maxUnavail: 0)│
│ - Run health check: GET /api/v1/health -> HTTP 200 OK                       │
│ - Execute live adversarial smoke test (scripts/test-adversarial-rls.mjs)    │
│ - Monitor Prometheus/Grafana: 0 cross-tenant errors, 0 connection drops.    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Rollback Runbook (RTO < 60 Seconds)

If any production alert triggers (e.g. elevated 500 error rates, authentication stalls, or unexpected RLS permission errors):

### Rollback Trigger Criteria:
- API Gateway error rate exceeds 0.5% over a 3-minute window.
- Any legitimate doctor or pharmacist request receives unexpected `42501 (insufficient_privilege)`.
- Database connection pool checkout latency exceeds 500ms.

### Immediate Rollback Procedure:
1. **Revert Environment Secret:**
   Execute emergency Kubernetes secret update to restore the previous administrative connection URL:
   ```bash
   kubectl set env deployment/api-gateway \
     DATABASE_URL="postgresql://docsearch_prod_admin:${VAULT_BACKUP_PASS}@db-primary:5432/docsearch" \
     -n docsearch-production
   ```
2. **Trigger Rapid Deployment Rollout:**
   ```bash
   kubectl rollout restart deployment/api-gateway -n docsearch-production
   ```
3. **Verify Service Health:**
   ```bash
   curl -f http://127.0.0.1:4000/api/v1/health || exit 1
   ```
4. **Log Incident & Isolate Forensic Traces:**
   Preserve application logs in `audit-results/rollback-incident.log` for post-mortem analysis.

---

## 4. Disaster Recovery & Migration Separation

| Operation Type | Designated Role | Authentication Source | Privilege Level | RLS Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Application Runtime** | `docsearch_app` | Environment Variable / K8s Secret | `NOSUPERUSER, NOBYPASSRLS` | **Strictly Enforced** |
| **Schema Migrations** | `postgres` | CI/CD Pipeline Secret Vault | `SUPERUSER` | Bypassed (DDL only) |
| **Cluster Backups** | `docsearch_backup` | Encrypted Keyfile / IAM Role | Read-Only | Bypassed for full cluster dump |
| **Disaster Recovery Restore**| `postgres` | Cold-Storage Physical Key | `SUPERUSER` | Cluster Rehydration |

### Guarantee:
Migrations and cluster administration remain 100% operational through dedicated credentials and are completely decoupled from runtime application traffic.
