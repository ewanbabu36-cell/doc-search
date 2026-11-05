# DOCSEARCH — PHASE 7.2D
# CLOUD STAGING INFRASTRUCTURE COST ESTIMATE

**Document Identifier:** `DOCSEARCH-P7.2D-COST-ESTIMATE-001`  
**Git Baseline Commit:** `f60ac5cf164c104f3229b971656690631293e1f9`  
**Branch:** `main`  
**Execution Timestamp:** `2026-11-05T06:30:00Z` (Local: `2026-11-05T12:00:00+05:30`)  
**Pricing Region Baseline:** AWS Asia Pacific - Mumbai (`ap-south-1`) & Hyderabad (`ap-south-2`)  
**Currency:** USD ($) & INR (₹ @ 83.10 INR/USD)  
**Status:** **AUTHORITATIVE FINANCIAL MODEL (Pre-Provisioning Forecast)**  

---

## 1. Cost Modeling Methodology & Assumptions

This estimate models the operational expenses of running the DocSearch staging infrastructure across three distinct operational profiles:
1. **Low Scenario (Cost-Optimized / Idle Staging):** Baseline idle staging running minimum node group size (2 nodes), moderate database workloads, and conservative data transfer.
2. **Expected Scenario (Production-Parity Staging):** Standard enterprise staging running 3 managed Graviton worker nodes across 3 AZs, Multi-AZ RDS PostgreSQL (`db.r6g.xlarge`), Multi-AZ Redis (`cache.r6g.large`), and active synthetic background testing.
3. **High Scenario (Stress Test / Active 72-Hour Burn-In):** Peak staging capacity under continuous synthetic load (5 worker nodes, high CloudWatch ingestion, continuous cross-region backup replication, and elevated data transfer).

### Key Architectural Assumptions
- Pricing is based on published AWS On-Demand rates for `ap-south-1` (Mumbai).
- Single NAT Gateway enabled for staging (`var.enable_nat_gateway_per_az = false`), saving ~$78/month compared to 3 NAT gateways.
- VPC S3 Gateway Endpoint provisioned, routing all S3 DICOM and backup traffic internally with zero NAT data transfer charges.
- AWS Backup retention configured to 35 days with daily snapshots copied to `ap-south-2` (Hyderabad).
- 730 operating hours per month.

---

## 2. Comprehensive Monthly Cost Breakdown by Subsystem

| Infrastructure Subsystem | Sizing & Configuration | Low Scenario (USD) | Expected Scenario (USD) | High Scenario (USD) |
|---|---|---|---|---|
| **Amazon EKS Control Plane** | 1 Managed Cluster (`docsearch-staging-eks`) | $73.00 | $73.00 | $73.00 |
| **EC2 Worker Nodes (Graviton2)** | Low: 2x `t4g.xlarge` / Exp: 3x `t4g.xlarge` / High: 5x `t4g.xlarge` | $196.22 | $294.34 | $490.56 |
| **Worker Node EBS Root Storage** | 80 GB gp3 per node ($0.096/GB-mo) | $15.36 | $23.04 | $38.40 |
| **RDS PostgreSQL (Multi-AZ)** | Low: `db.t4g.large` / Exp: `db.r6g.xlarge` / High: `db.r6g.2xlarge` | $145.00 | $411.72 | $823.44 |
| **RDS gp3 Storage & Backups** | 100 GB allocated ($0.138/GB Multi-AZ) + Backup storage | $32.60 | $42.60 | $68.00 |
| **ElastiCache Redis (Multi-AZ)** | Low: `cache.t4g.medium` (2 nodes) / Exp: `cache.r6g.large` (2 nodes) | $58.40 | $230.68 | $461.36 |
| **Amazon EFS PACS Storage** | Low: 50 GB / Exp: 250 GB / High: 1 TB ($0.33/GB-mo standard) | $16.50 | $82.50 | $330.00 |
| **AWS NAT Gateway** | 1 NAT Gateway ($0.054/hr) + Data processing ($0.054/GB) | $42.12 | $50.22 | $93.42 |
| **Network Load Balancer (NLB)** | 1 NLB across 3 AZs ($0.027/hr) + NLCU throughput | $24.71 | $29.71 | $49.71 |
| **Amazon CloudWatch & Logging** | Container Insights, EKS logs, RDS enhanced (30s), Alarms | $35.00 | $75.00 | $150.00 |
| **AWS KMS & Secrets Manager** | 4 Customer Managed Keys ($4/mo) + 4 Secrets ($1.60/mo) + APIs | $8.60 | $10.60 | $18.60 |
| **AWS Backup & DR Replication** | Primary vault storage + Hyderabad DR vault replication | $25.00 | $65.00 | $160.00 |
| **Route 53 & Inter-AZ Transfer** | 1 Hosted Zone ($0.50) + DNS queries + Inter-AZ VPC traffic | $12.00 | $25.00 | $65.00 |
| **Total Monthly Cost (USD)** | **Complete DocSearch Staging Infrastructure** | **$684.51** | **$1,313.41** | **$2,821.49** |
| **Total Monthly Cost (INR)** | **Conversion @ 83.10 INR / USD** | **₹56,883** | **₹1,09,144** | **₹2,34,466** |

---

## 3. Scenario Analysis & Financial Thresholds

### 3.1 Low Scenario: $684.51 / month (₹56,883 INR)
- **Profile:** Minimum-footprint staging environment.
- **Suitability:** Integration testing, intermittent CI/CD runs, pre-burn-in validation.
- **Cost Reduction Drivers:** 2 worker nodes, reduced RDS instance class (`db.t4g.large`), modest PACS storage (50 GB).

### 3.2 Expected Scenario: $1,313.41 / month (₹1,09,144 INR)
- **Profile:** Full production-parity staging environment.
- **Suitability:** 72-hour burn-in execution, multi-tenant load testing, clinical safety verification.
- **Cost Drivers:** Full Multi-AZ Graviton `db.r6g.xlarge` database ($411.72), 3 worker nodes across 3 AZs ($294.34), Multi-AZ Redis ($230.68), 250 GB clinical imaging storage ($82.50).

### 3.3 High Scenario: $2,821.49 / month (₹2,34,466 INR)
- **Profile:** Peak load stress testing and high-volume synthetic PACS ingest.
- **Suitability:** Soak testing, chaos engineering drills, high-concurrency patient query simulations.
- **Cost Drivers:** 5 worker nodes ($490.56), `db.r6g.2xlarge` ($823.44), 1 TB PACS storage ($330.00), heavy CloudWatch log ingestion ($150.00).

---

## 4. Cost Optimization Safeguards Implemented in Code

1. **VPC S3 Gateway Endpoint (`infra/vpc.tf#L163-L175`):**
   - Routes all S3 traffic over the internal AWS backbone at **$0.00 / GB**.
   - Avoids routing DICOM images and audit logs through the NAT Gateway, saving ~$54 per TB of transferred data.
2. **Single NAT Gateway in Staging (`infra/vpc.tf#L81-L98`):**
   - Configures `var.enable_nat_gateway_per_az = false` in staging, utilizing 1 NAT gateway instead of 3.
   - Saves **$78.84 / month** in idle hourly charges.
3. **EFS Lifecycle Transition to Infrequent Access (`infra/efs.tf#L16-L18`):**
   - `transition_to_ia = "AFTER_30_DAYS"` automatically migrates older radiology studies from $0.33/GB standard to $0.016/GB IA storage, yielding a **95% storage cost reduction** on aged studies.
4. **DynamoDB On-Demand Billing (`infra/remote_state_backend.tf#L52`):**
   - `billing_mode = "PAY_PER_REQUEST"` charges only for actual lock operations, costing less than $0.10/month.

---

## 5. Unverifiable Costs Prior to Live Cloud Execution

The following variables cannot be determined conclusively without live billing telemetry:
- **Inter-AZ Data Transfer:** Billed at $0.01/GB across availability zones. Actual cost depends on cross-AZ pod-to-database connection ratios.
- **CloudWatch Logs Ingestion:** Billed at $0.57/GB ingested. High-debug application logging during initial setup can increase observability expenses.
- **AWS KMS API Requests:** First 20,000 requests/mo are free; $0.03 per 10,000 requests thereafter. High Redis or Secret rotation frequency may generate minor incremental fees.

---
*Financial Cost Model Complete — Expected Staging Cost: ~$1,313 USD / month (₹1.09 Lakh INR).*
