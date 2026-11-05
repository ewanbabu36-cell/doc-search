# DOCSEARCH — PHASE 7.2D
# CROSS-REGION DISASTER RECOVERY READINESS AUDIT

**Document Identifier:** `DOCSEARCH-P7.2D-DR-READINESS-001`  
**Git Baseline Commit:** `f60ac5cf164c104f3229b971656690631293e1f9`  
**Branch:** `main`  
**Execution Timestamp:** `2026-11-05T06:28:00Z` (Local: `2026-11-05T11:58:00+05:30`)  
**Scope:** Regional Disaster Recovery (`ap-south-1` Mumbai to `ap-south-2` Hyderabad), SPOF Audit, Drill Prerequisites  
**Status:** **AUTHORITATIVE DISASTER RECOVERY AUDIT**  

---

## 1. Regional Architecture & Disaster Recovery Targets

DocSearch is designed for enterprise healthcare availability across two geographic AWS regions in India:
- **Primary Operational Region:** `ap-south-1` (AWS Asia Pacific - Mumbai).
- **Secondary Disaster Recovery Region:** `ap-south-2` (AWS Asia Pacific - Hyderabad).

### Target Service Level Objectives (SLOs)
- **Recovery Point Objective (RPO):** Maximum **5 minutes** for clinical database transactions; maximum **24 hours** for off-peak snapshot backups.
- **Recovery Time Objective (RTO):** Maximum **15 minutes** for database failover within primary region; maximum **4 hours** for full secondary region reconstitution.

```
┌───────────────────────────────────────┐         ┌───────────────────────────────────────┐
│ PRIMARY REGION (ap-south-1 Mumbai)    │         │ SECONDARY REGION (ap-south-2 Hyderabad)│
├───────────────────────────────────────┤         ├───────────────────────────────────────┤
│ [Primary Workloads & VPC]             │         │ [Standby Disaster Recovery Vault]     │
│  - EKS Cluster docsearch-staging-eks  │         │  - aws_backup_vault.dr_vault          │
│  - Multi-AZ RDS PostgreSQL 16         │         │                                       │
│  - Multi-AZ ElastiCache Redis         │         │                                       │
│  - Amazon EFS PACS Storage            │         │                                       │
│  - Ingress Network Load Balancer      │         │                                       │
│                                       │         │                                       │
│ [Primary Backup Vault]                │         │                                       │
│  - aws_backup_vault.primary_vault     │─────────┼────────▶ Encrypted Snapshot Replicas  │
│  - Daily Backup Plan (18:00 UTC)      │ Copy    │          (35-day retention)           │
│  - Selection: RDS + EFS               │ Action  │                                       │
└───────────────────────────────────────┘         └───────────────────────────────────────┘
```

---

## 2. Forensic Inspection of Cross-Region Mechanisms

### 2.1 Cross-Region Snapshot Replication (`infra/backup.tf`)
- **Primary Vault:** Declared in `infra/backup.tf` (lines 9–18) in `ap-south-1` using CMK `aws_kms_key.backup.arn`.
- **Secondary DR Vault:** Declared in `infra/backup.tf` (lines 32–41) with explicit regional provider `provider = aws.dr` targeting `ap-south-2` (Hyderabad).
- **Cross-Region Copy Rule:** In `aws_backup_plan.daily_plan` (lines 58–64), the `copy_action` block automatically replicates every daily snapshot from Mumbai to the Hyderabad DR vault:
  ```hcl
  copy_action {
    destination_vault_arn = aws_backup_vault.dr_vault.arn
    lifecycle {
      delete_after = var.backup_retention_days # 35 days
    }
  }
  ```
- **Selected Protected Resources:**
  - `aws_db_instance.primary.arn`: Continuous WAL backups + daily snapshot of PostgreSQL.
  - `aws_efs_file_system.pacs.arn`: Daily snapshot of shared PACS radiology storage.

### 2.2 Financial Transaction Consistency & Double-Entry Ledger
- In `clinical.financial_ledgers`, all transactions use idempotent sequential entry IDs and ACID constraints.
- In the event of primary database corruption, point-in-time recovery (PITR) within `ap-south-1` allows restoration to any second within the 35-day window.
- In the event of a catastrophic total failure of `ap-south-1`, the secondary snapshot in `ap-south-2` can be restored into a new RDS instance, with maximum data loss bounded by the last successful snapshot.

---

## 3. Forensic Identification of Single Points of Failure (SPOFs)

> [!WARNING]
> **Forensic Audit Finding: Cross-Region Single Points of Failure**  
> While daily backup replication to Hyderabad is configured in code, the current staging architecture is an **Active-Passive Cold Standby (Backup-Only)** model, NOT an automated Active-Passive hot/warm standby. Four material architectural SPOFs exist:

| # | Single Point of Failure (SPOF) | Current Staging Configuration | Production Hardening Requirement |
|---|---|---|---|
| **SPOF-1** | **Route 53 DNS Failover** | `infra/route53.tf` defines Simple Alias records pointing strictly to Mumbai NLB (`aws_lb.nlb.dns_name`). | Implement Route 53 Failover Routing Policies with Route 53 Health Checks monitoring primary NLB, failing over to Hyderabad edge. |
| **SPOF-2** | **KMS Key Regional Isolation** | AWS KMS keys are strictly regional. `aws_kms_key.backup` exists only in `ap-south-1`. | Provision a multi-region KMS key (`multi_region = true`) or configure a replica KMS key in `ap-south-2` for vault decryption. |
| **SPOF-3** | **Secrets Manager Replication** | `infra/secrets_manager.tf` declares 4 secrets in `ap-south-1` with no `replica` blocks. | Add `replica { region = "ap-south-2" }` to replicate database, Redis, and JWT credentials cross-region. |
| **SPOF-4** | **Compute Infrastructure in DR** | No VPC, subnets, or EKS cluster are provisioned in `ap-south-2`. | Reconstituting services in Hyderabad requires executing Terraform to spin up VPC and EKS before workloads can run (estimated RTO: 2.5–4 hours). |

---

## 4. Strict Certification Boundary: Drill Requirement

> [!CAUTION]
> **Mandatory Certification Boundary:**  
> Under enterprise disaster recovery standards (ISO 22301 / HIPAA Contingency Planning 45 CFR § 164.308(a)(7)), **cross-region disaster recovery cannot be certified solely from Terraform configuration code.**  
> Cross-region DR certification is classified as **NOT VERIFIED / PENDING LIVE DRILL**.  
> Production deployment is hard-gated on executing a controlled, isolated recovery drill in `ap-south-2`:
> 1. Restoring a PostgreSQL database from the Hyderabad DR vault snapshot.
> 2. Verifying database table integrity and row counts (`clinical.radiology_studies`, `billing.ledgers`).
> 3. Restoring an EFS filesystem from the DR vault snapshot and verifying DICOM image headers.
> 4. Measuring exact achieved RTO and RPO against target SLOs.

---
*Cross-Region DR Audit Complete — Cold Standby Replicated; 4 SPOFs Documented; Live Drill Required Prior to Production.*
