# DOC SEARCH — Production Disaster Recovery (DR) Runbook

## Document Metadata & Scope
* **Selected Cloud Provider**: Amazon Web Services (AWS)
* **Managed Database Service**: AWS RDS for PostgreSQL 16 (Multi-AZ)
* **Primary Cloud Region**: `ap-south-1` (Mumbai, India — DPDP Act & Data Localization Compliant)
* **Secondary Disaster Recovery Region**: `ap-south-2` (Hyderabad, India — Encrypted Backup Vault)
* **Target Recovery Objectives**:
  * **Target RPO (Recovery Point Objective)**: ≤ 5 minutes (Continuous WAL streaming to Amazon S3)
  * **Target RTO (Recovery Time Objective)**: < 15 minutes (Automated Multi-AZ Standby Promotion)
* **Infrastructure Identifiers**:
  * **Production Primary Instance**: `docsearch-prod-primary` (Multi-AZ in `ap-south-1a` / `ap-south-1b`)
  * **Staging Verification Instance**: `docsearch-staging-primary` (Multi-AZ in `ap-south-1a` / `ap-south-1b`)
  * **Recovery Target Template**: `docsearch-prod-recovery-YYYYMMDD-HHMMSS`
* **Security Notice**: NEVER commit database passwords, AWS IAM access keys, or production tokens to this document or Git repository. Credentials must be resolved strictly via AWS Secrets Manager.

---

## Escalation & Incident Contacts
* **Incident Commander (IC)**: VP Engineering / Head of Infrastructure
* **Database Reliability Engineer (DBRE)**: On-Call DBRE (PagerDuty: `svc-docsearch-dbre`)
* **Security & Compliance Officer**: Chief Information Security Officer (CISO)
* **Incident Response Channel**: Slack `#incident-p1-database-dr` / Bridge: `https://meet.docsearch.health/incident-war-room`

---

## Phase 1: Detect Incident
* **Automated Alert Triggers**:
  * CloudWatch Metric Alarm: `docsearch-production-db-cpu-high` (CPU > 80% for 5 min)
  * CloudWatch Metric Alarm: `docsearch-production-db-storage-low` (Free storage < 50 GB)
  * CloudWatch Metric Alarm: `docsearch-production-db-replication-lag` (ReplicaLag > 60s)
  * Gateway Liveness/Readiness: `GET /ready` returning `HTTP 503` with:
    ```json
    { "status": "not_ready", "database": "disconnected" }
    ```
* **Immediate Triage Commands (AWS CLI)**:
  ```bash
  # 1. Query live status of production primary instance
  aws rds describe-db-instances \
    --db-instance-identifier docsearch-prod-primary \
    --region ap-south-1 \
    --query 'DBInstances[0].[DBInstanceStatus,MultiAZ,SecondaryAvailabilityZone,LatestRestorableTime]' \
    --output table

  # 2. Query application gateway readiness endpoint
  curl -s -i https://api.docsearch.health/ready
  ```

---

## Phase 2: Declare Database Incident
* **Severity Levels**:
  * **SEV-1 (Critical)**: Primary database host unresponsive, corruption detected, or Multi-AZ failure.
  * **SEV-2 (Degraded)**: Replication lag > 60s or single read-replica offline.
* **Declaration Actions**:
  1. Incident Commander declares SEV-1 in `#incident-p1-database-dr`.
  2. Page DBRE and lead systems architect via PagerDuty.
  3. Update public Statuspage to: **Investigating: Database Connectivity Degradation**.

---

## Phase 3: Assess Primary Database
1. Determine if underlying AWS hardware crashed or if database process is hung.
2. Check PostgreSQL connection responsiveness from inside the private VPC bastion:
   ```bash
   pg_isready -h docsearch-prod-primary.internal.docsearch.health -p 5432
   ```
3. Inspect CloudWatch logs for panic or out-of-memory errors:
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/rds/instance/docsearch-prod-primary/postgresql \
     --filter-pattern "PANIC" \
     --region ap-south-1
   ```
4. Check Split-Brain Prevention: Verify that the secondary AZ has not already been promoted automatically by RDS.

---

## Phase 4: Decide Failover vs. PITR
Apply the decision matrix:

| Scenario | Root Cause | Selected Procedure | Expected RTO | Expected RPO |
| :--- | :--- | :--- | :--- | :--- |
| **Zone Hardware Loss / Network Cut** | AWS AZ interruption | **Automated Multi-AZ Standby Promotion (Phase 5A)** | < 4 minutes | 0 seconds (Synchronous standby) |
| **Primary Process Deadlock / Crash** | Kernel or memory panic | **Forced Multi-AZ Failover (Phase 5A)** | < 5 minutes | 0 seconds |
| **Accidental Table Truncation / Bad SQL** | Human or bad script execution | **Point-in-Time Recovery (PITR) (Phase 5B)** | < 20 minutes | Point-in-time immediately prior to errant query |
| **Ransomware / Cryptographic Tampering** | Intrusion or block corruption | **PITR from WORM Locked Backup Vault (Phase 5B)** | < 30 minutes | Timestamp before intrusion vector |

---

## Phase 5: Execution Procedures

### Procedure 5A: Multi-AZ Standby Promotion / Controlled Failover
Used when the primary node crashes or must be failed over to the standby AZ (`ap-south-1b`):

```bash
# 1. Execute Multi-AZ Reboot with Force Failover
aws rds reboot-db-instance \
  --db-instance-identifier docsearch-prod-primary \
  --force-failover \
  --region ap-south-1

# 2. Wait for RDS cluster to promote standby and return to 'available' status
aws rds wait db-instance-available \
  --db-instance-identifier docsearch-prod-primary \
  --region ap-south-1

# 3. Confirm new Availability Zone assignment
aws rds describe-db-instances \
  --db-instance-identifier docsearch-prod-primary \
  --region ap-south-1 \
  --query 'DBInstances[0].[AvailabilityZone,SecondaryAvailabilityZone,DBInstanceStatus]' \
  --output table
```

### Procedure 5B: Point-in-Time Recovery (PITR) to New Target Instance
Used when data corruption or truncation requires restoring to a historical timestamp:

```bash
# 1. Determine Target Restore Timestamp (UTC ISO 8601, e.g. 1 minute before incident)
RECOVERY_TARGET_TIMESTAMP="2026-09-08T08:00:00.000Z"
RECOVERY_INSTANCE_ID="docsearch-prod-recovery-$(date +%Y%m%d%H%M%S)"

# 2. Restore continuous WAL stream to a new recovery instance
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier docsearch-prod-primary \
  --target-db-instance-identifier "${RECOVERY_INSTANCE_ID}" \
  --restore-time "${RECOVERY_TARGET_TIMESTAMP}" \
  --db-instance-class db.r6g.2xlarge \
  --multi-az \
  --publicly-accessible false \
  --db-subnet-group-name docsearch-production-db-subnets \
  --vpc-security-group-ids sg-docsearch-prod-rds \
  --region ap-south-1

# 3. Monitor restoration progress until 'available'
echo "Awaiting instance creation for ${RECOVERY_INSTANCE_ID}..."
aws rds wait db-instance-available \
  --db-instance-identifier "${RECOVERY_INSTANCE_ID}" \
  --region ap-south-1
```

---

## Phase 6: Verify Database Health
Execute low-level validation on the recovered instance:
```bash
# 1. Verify instance is ready to accept queries
pg_isready -h ${RECOVERY_ENDPOINT} -p 5432 -U docsearch_admin

# 2. Connect via secure psql session and verify write capability
psql "sslmode=require host=${RECOVERY_ENDPOINT} dbname=docsearch user=docsearch_admin" -c "
  SELECT 1 AS health_ping;
  SELECT pg_is_in_recovery() AS is_read_only_standby;
"
# pg_is_in_recovery() MUST return false (Writer Mode active)
```

---

## Phase 7: Verify Migrations & Schema
Confirm that the restored database contains the complete schema and all 51 migrations:
```bash
# 1. Run migration verification from bastion
pnpm --filter @docsearch/database migrate

# 2. Verify table schema count (Expect 442+ tables across core, company, clinical schemas)
psql "sslmode=require host=${RECOVERY_ENDPOINT} dbname=docsearch user=docsearch_admin" -c "
  SELECT table_schema, count(*) 
  FROM information_schema.tables 
  WHERE table_schema IN ('core', 'company', 'clinical') 
  GROUP BY table_schema;
"

# 3. Verify critical table existence
psql "sslmode=require host=${RECOVERY_ENDPOINT} dbname=docsearch user=docsearch_admin" -c "
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_schema = 'company' 
    AND table_name = 'partner_onboarding_staged_registrations';
"
```

---

## Phase 8: Verify Row-Level Security (RLS)
Ensure multi-tenant isolation policies remained active and enforced through recovery:
```sql
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE schemaname IN ('core', 'company', 'clinical')
  AND tablename IN (
    'tenants', 
    'audit_events', 
    'partner_onboarding_staged_registrations', 
    'prescriptions', 
    'invoices'
  );

-- STRICT ASSERTION:
-- rowsecurity MUST be true
-- forcerowsecurity MUST be true
```

---

## Phase 9: Application Connectivity & Endpoint Switch
1. Update database connection secret in AWS Secrets Manager:
   ```bash
   aws secretsmanager update-secret \
     --secret-id "docsearch/production/database/credentials" \
     --secret-string "{\"host\":\"${RECOVERY_ENDPOINT}\",\"port\":5432,\"database\":\"docsearch\",\"username\":\"docsearch_admin\",\"engine\":\"postgres\"}" \
     --region ap-south-1
   ```
2. Trigger rolling restart of API Gateway container tasks:
   ```bash
   aws ecs update-service \
     --cluster docsearch-prod-ecs \
     --service docsearch-api-gateway \
     --force-new-deployment \
     --region ap-south-1
   ```
3. Probe `/ready` endpoint until all instances report 200 OK:
   ```bash
   curl -s -f https://api.docsearch.health/ready
   # Expected Response:
   # {"status":"ready","database":"connected","mode":"EXTERNAL_POSTGRES"}
   ```

---

## Phase 10: Verify Revenue Transactions & Clinical Queues
1. Verify invoice ledger consistency:
   ```sql
   SELECT count(*) AS invalid_invoices 
   FROM company.invoices 
   WHERE status = 'PAID' AND total_amount <= 0;
   -- Must return 0
   ```
2. Verify inventory batches:
   ```sql
   SELECT count(*) AS negative_inventory 
   FROM clinical.inventory_batches 
   WHERE available_quantity < 0;
   -- Must return 0
   ```

---

## Phase 11: Verify Audit Integrity
Ensure SHA-256 hash chains in `core.audit_events` have continuous integrity:
```sql
SELECT id, event_type, created_at, integrity_hash 
FROM core.audit_events 
ORDER BY created_at DESC 
LIMIT 10;
-- Every record must have a 64-character hex string
```

---

## Phase 12: Traffic Resumption
1. Enable canary routing (10% traffic) via CloudFront / ALB target group.
2. Monitor 5xx error rate and p95 latency for 5 minutes.
3. Open 100% traffic.
4. Update Statuspage to: **All Systems Operational**.

---

## Phase 13: Rollback Procedure
If the restored instance exhibits latent corruption or application incompatibilities:
1. Immediately re-route traffic back to primary cluster or previous stable recovery instance:
   ```bash
   aws secretsmanager update-secret \
     --secret-id "docsearch/production/database/credentials" \
     --secret-string "{\"host\":\"docsearch-prod-primary.internal.docsearch.health\",\"port\":5432,\"database\":\"docsearch\",\"username\":\"docsearch_admin\",\"engine\":\"postgres\"}" \
     --region ap-south-1
   aws ecs update-service --cluster docsearch-prod-ecs --service docsearch-api-gateway --force-new-deployment --region ap-south-1
   ```
2. Quarantined analysis: Retain failed instance with tag `Quarantine=Investigation` for forensic inspection.

---

## Phase 14: Post-Incident Audit & Root Cause Analysis (RCA)
Within 48 hours:
* Calculate exact **Measured RPO** (Time between last committed transaction and recovery point).
* Calculate exact **Measured RTO** (Time elapsed from SEV-1 declaration to 100% traffic resumption).
* Complete Post-Mortem document and submit to compliance audit board.
