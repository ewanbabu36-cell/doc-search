# DOCSEARCH PHASE 7.2D.1: INFRASTRUCTURE RISK REGISTER
## Independent Pre-Provisioning Risk Assessment & Finding Tracking

**Document Identifier:** `DOCSEARCH_PHASE_7_2D_1_INFRASTRUCTURE_RISK_REGISTER`  
**Baseline Commit:** `2083de08407f154406627eb6556ae0cf29fd66ec`  
**Execution Timestamp:** `2026-11-05T07:02:00Z` (Local: `2026-11-05T12:32:00+05:30`)  
**Scope:** Revalidation of All Infrastructure Security, High-Availability, Networking, and Cryptographic Findings  
**Status:** **AUTHORITATIVE RISK REGISTER UPDATED**  

---

## 1. Risk Register Summary Matrix

| Finding ID | Domain | Severity | Pre-Provisioning Blocker? | Remediation Status | Verification Method |
|---|---|---|---|---|---|
| **F-01** | KMS / Secrets Manager | **MEDIUM** | **YES (Remediated)** | **RESOLVED / PASS** | Automated Regression Suite (14/14 tests) |
| **F-02** | Route 53 DNS Failover | **LOW** | NO (Staging OK) | **OPEN (Documented)** | Architectural Review (Manual DR Cutover) |
| **F-03** | Regional KMS CMK Scope | **MEDIUM** | NO (Staging OK) | **OPEN (Documented)** | Single-region CMKs; AWS Backup re-encrypts |
| **F-04** | Secrets Manager DR Replication | **LOW** | NO (Staging OK) | **OPEN (Documented)** | Replicate secrets to `ap-south-2` for Hot DR |
| **F-05** | DR Cold Standby RTO/RPO | **LOW** | NO (Staging OK) | **OPEN (Documented)** | RTO 4–8h, RPO 24h accepted for staging cost |
| **F-06** | Public NLB Edge Exposure | **MEDIUM** | NO (Staging OK) | **OPEN (Documented)** | Ingress NGINX hardened; AWS WAF recommended |
| **F-07** | NAT Gateway Transfer Costs | **LOW** | NO (Staging OK) | **OPEN (Documented)** | S3 Gateway Endpoint active; monitor API calls |
| **F-08** | Statutory Compliance Claims | **HIGH** | NO (Staging OK) | **POLICY ENFORCED** | External audit required prior to production |

---

## 2. In-Depth Finding Analysis

### 2.1 Finding F-01: External Secrets KMS Decrypt Permission Omission (REMEDIATED)
- **Description:** `aws_iam_policy.external_secrets` in `infra/eks_addons.tf` previously omitted `aws_kms_key.storage.arn`, preventing the External Secrets Operator from decrypting `docsearch/${var.environment}/redis/credentials`.
- **Pre-Provisioning Impact:** Critical staging startup failure for all Redis-dependent services.
- **Resolution:** Added `aws_kms_key.storage.arn` to the policy Resource list and reconciled IRSA trust condition for `docsearch-app-sa` and `docsearch-api-gateway-sa`.
- **Status:** **PASS (Closed).**

### 2.2 Finding F-02: Route 53 Active-Passive Cold Standby DNS Model
- **Description:** In `infra/route53.tf`, Route 53 alias records point directly to the Mumbai NLB. There is no automated Route 53 health-check failover to Hyderabad (`ap-south-2`).
- **Impact:** During an `ap-south-1` regional outage, traffic cutover to `ap-south-2` requires manual DNS record updating or secondary terraform execution.
- **Pre-Production Roadmap:** For production, implement Route 53 Failover Routing Policies with CloudWatch Health Checks or AWS Route 53 Application Recovery Controller (ARC).
- **Status:** **ACCEPTED FOR STAGING.**

### 2.3 Finding F-03: Regional KMS CMK Isolation in ap-south-1
- **Description:** KMS Customer Managed Keys (`rds`, `storage`, `eks_secrets`, `backup`) are regional CMKs in Mumbai (`ap-south-1`). They are not configured with `multi_region = true`.
- **Impact:** Snapshots replicated to Hyderabad (`ap-south-2`) via AWS Backup are encrypted using the Hyderabad vault key. Restoring EBS volumes or RDS instances in Hyderabad requires new CMKs or importing keys in `ap-south-2`.
- **Pre-Production Roadmap:** Retain single-region keys for staging cost isolation; evaluate multi-region KMS CMKs (`aws_kms_key` `multi_region = true`) for active-active production topologies.
- **Status:** **ACCEPTED FOR STAGING.**

### 2.4 Finding F-04: Secrets Manager Regional Replication
- **Description:** Secrets created in `infra/secrets_manager.tf` are local to `ap-south-1` without `replica` configuration blocks.
- **Impact:** If disaster strikes `ap-south-1`, application workloads brought up in Hyderabad will lack database and Redis credentials unless secrets are re-created via Terraform or synchronized via cross-region replication.
- **Pre-Production Roadmap:** Add `replica { region = "ap-south-2" }` in production Terraform definitions.
- **Status:** **ACCEPTED FOR STAGING.**

### 2.5 Finding F-05: Hyderabad Cold Standby RTO / RPO Governance
- **Description:** Hyderabad (`ap-south-2`) is configured purely as a cold standby destination for AWS Backup snapshots. EKS control plane and worker nodes are not kept running in `ap-south-2`.
- **Impact:** Recovery Point Objective (RPO) is bounded by the daily backup schedule (up to 24 hours). Recovery Time Objective (RTO) requires provisioning a new EKS cluster and restoring RDS snapshots (estimated 4 to 8 hours).
- **Financial Rationale:** Keeping an idle EKS cluster in `ap-south-2` would add $500–$1,000/month in idle cloud spend. For staging, a cold standby design is the correct financial and architectural choice.
- **Status:** **ACCEPTED FOR STAGING.**

### 2.6 Finding F-06: Public NLB Edge Exposure & Ingress Protection
- **Description:** The Network Load Balancer in `infra/load_balancer.tf` is internet-facing, routing public TCP traffic on ports 80 and 443 directly to ingress-nginx on worker nodes.
- **Impact:** The NLB provides layer-4 load balancing without Layer-7 Web Application Firewall (WAF) inspection.
- **Mitigation:** Ingress-nginx enforces rate limiting, TLS 1.2/1.3 cipher restrictions, and strict HSTS headers. For production, AWS WAF should be associated with the ingress layer or an Application Load Balancer (ALB) tier.
- **Status:** **ACCEPTED FOR STAGING.**

### 2.7 Finding F-07: NAT Gateway Outbound Data Transfer Costs
- **Description:** Outbound traffic from private subnets passes through dedicated NAT Gateways in each public subnet.
- **Cost Safeguard:** S3 traffic is routed directly through the free S3 VPC Gateway Endpoint (`infra/vpc.tf`), bypassing NAT Gateways. Only outbound internet calls (ABDM, Razorpay sandbox, package downloads) incur NAT data processing fees ($0.045/GB).
- **Status:** **MONITORED & CONTROLLED.**

### 2.8 Finding F-08: Statutory Compliance Governance (HIPAA / DPDP / DISHA)
- **Description:** Architecture enforces technical security safeguards (AES-256 KMS envelope encryption at rest, TLS 1.2+ in transit, audit logging via CloudTrail, IAM least privilege, zero default public access).
- **Policy Enforcement:** Formal legal and statutory compliance (HIPAA, India Digital Personal Data Protection Act 2023, DISHA) **CANNOT** be claimed based solely on static code analysis. A formal compliance assertion requires an external certified auditor review, penetration testing, and execution of the AWS Business Associate Agreement (BAA).
- **Status:** **ARCHITECTURALLY PREPARED; FORMAL AUDIT MANDATED PRIOR TO PRODUCTION.**

---

## 3. Pre-Provisioning Readiness Summary

With Finding **F-01 fully remediated**, there are **ZERO remaining blocker-severity defects** in the Terraform code. All remaining open findings represent pre-production enhancements or deliberate cost-saving architectural choices appropriate for a staging cloud environment.
