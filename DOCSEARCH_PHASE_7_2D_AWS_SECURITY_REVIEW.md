# DOCSEARCH — PHASE 7.2D
# AWS CLOUD INFRASTRUCTURE SECURITY REVIEW

**Document Identifier:** `DOCSEARCH-P7.2D-SEC-REVIEW-001`  
**Git Baseline Commit:** `f60ac5cf164c104f3229b971656690631293e1f9`  
**Branch:** `main`  
**Execution Timestamp:** `2026-11-05T06:22:00Z` (Local: `2026-11-05T11:52:00+05:30`)  
**Scope:** Threat Modeling, Network Segmentation, IAM Least Privilege, KMS Cryptography, Secrets Governance  
**Status:** **AUTHORITATIVE SECURITY REVIEW**  

---

## 1. Security Architecture & Threat Model Overview

DocSearch enforces an enterprise Zero-Trust defense-in-depth security model across all cloud infrastructure tiers in AWS. The architecture is engineered to satisfy Indian healthcare data protection regulations (DISHA guidelines, Digital Personal Data Protection Act 2023) and global standards (HIPAA Security Rule 45 CFR Part 160/164).

```
[ Public Internet ]
        │
        ▼ (Port 80 / 443 TCP Only)
┌───────────────────────────────────────────────────────────────────┐
│ Public Ingress Tier (Subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)│
│  - AWS Network Load Balancer (NLB)                                 │
│  - NAT Gateway (10.0.1.x) with Elastic IP                         │
│  - Public Route 53 Aliases (*.docsearch.health)                   │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ (Forward to NodePort 30443 / 30080)
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│ Private Compute Tier (Subnets: 10.0.10.0/24, 11.0/24, 12.0/24)     │
│  - EKS Managed Worker Nodes (AL2023, cgroup v2, IMDSv2)           │
│  - Ingress-NGINX (TLS 1.2 / 1.3 Termination, cert-manager ECDSA)  │
│  - API Gateway, PACS Server, Core Microservices                   │
│  - EFS Mount Targets (Port 2049) & ElastiCache Redis (Port 6379)  │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ (TLS Port 5432 Only)
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│ Isolated Database Tier (Subnets: 10.0.100.0/24, 101.0/24, 102.0/24)│
│  - RDS PostgreSQL 16 Multi-AZ Cluster (db.r6g.xlarge)             │
│  - NO Internet Route (Zero 0.0.0.0/0 route in route table)        │
│  - KMS Encrypted Storage & Continuous WAL Encryption (AES-256)     │
│  - Enforced SSL (`rds.force_ssl = 1`)                              │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Network Perimeter & Ingress/Egress Controls

### 2.1 Perimeter Exposure Assessment
- **Internet-Facing Gateways:** Exactly ONE public gateway exists: `aws_lb.nlb` (`internal = false`).
- **Public Subnets:** Subnets `10.0.1.0/24`, `10.0.2.0/24`, `10.0.3.0/24` host only the NLB elastic network interfaces and the NAT Gateway. No application servers, compute instances, or database instances reside in public subnets.
- **Air-Gapped Database Subnets:** Subnets `10.0.100.0/24`, `10.0.101.0/24`, `10.0.102.0/24` are bound to `aws_route_table.private_db`, which contains **NO default route (`0.0.0.0/0`)**. Even if a malicious binary gained code execution on the RDS host, it has no route to initiate outbound internet traffic.

### 2.2 Security Group Matrix & Rule Verification
| Security Group | Ingress Source | Allowed Ports / Protocols | Egress Destination | Risk Rating |
|---|---|---|---|---|
| **`aws_security_group.nlb`** | `0.0.0.0/0` | TCP 443 (HTTPS), TCP 80 (HTTP) | `var.vpc_cidr` (Nodes) | **LOW** (Standard edge entrypoint) |
| **`aws_security_group.eks_cluster`** | `aws_security_group.eks_nodes` | TCP 443 (Kubelet API) | `0.0.0.0/0` (AWS Managed) | **LOW** (Standard EKS control plane) |
| **`aws_security_group.eks_nodes`** | Self, Cluster SG, NLB SG | Node-to-node (-1), 1025-65535, NodePort 30443, 30080 | `0.0.0.0/0` (via NAT GW) | **LOW** (No direct public ingress) |
| **`aws_security_group.rds`** | `aws_security_group.eks_nodes` | TCP 5432 (PostgreSQL TLS) | **NONE (`cidr_blocks = []`)** | **VERY LOW** (Fully isolated) |
| **`aws_security_group.redis`** | `aws_security_group.eks_nodes` | TCP 6379 (Redis TLS) | **NONE (`cidr_blocks = []`)** | **VERY LOW** (Fully isolated) |
| **`aws_security_group.efs`** | `aws_security_group.eks_nodes` | TCP 2049 (NFS) | **NONE (`cidr_blocks = []`)** | **VERY LOW** (Fully isolated) |

---

## 3. Identity & Access Management (IAM) Analysis

### 3.1 IAM Roles for Service Accounts (IRSA)
DocSearch eliminates node-level IAM credentials by leveraging IAM Roles for Service Accounts (IRSA) via the OIDC provider:
1. **EBS CSI Controller:** Bound to `system:serviceaccount:kube-system:ebs-csi-controller-sa` with `AmazonEBSCSIDriverPolicy`.
2. **EFS CSI Controller:** Bound to `system:serviceaccount:kube-system:efs-csi-controller-sa` with `AmazonEFSCSIDriverPolicy`.
3. **External Secrets Operator:** Bound to `system:serviceaccount:docsearch-production:docsearch-app-sa` with custom least-privilege policy `docsearch-${var.environment}-external-secrets-policy`.

### 3.2 Finding F-01: External Secrets KMS Decrypt Permission Omission
> [!WARNING]
> **Defect Finding F-01 (Severity: MEDIUM / Pre-Provisioning Blocker):**  
> In `infra/eks_addons.tf` (lines 107–116), the `external_secrets` IAM policy defines:
> ```hcl
> Sid    = "KMSDecryptAccess"
> Effect = "Allow"
> Action = ["kms:Decrypt", "kms:DescribeKey"]
> Resource = [aws_kms_key.rds.arn]
> ```
> However, in `infra/secrets_manager.tf` (lines 60–63), `aws_secretsmanager_secret.redis_credentials` is encrypted with `aws_kms_key.storage.arn`:
> ```hcl
> resource "aws_secretsmanager_secret" "redis_credentials" {
>   name       = "docsearch/${var.environment}/redis/credentials"
>   kms_key_id = aws_kms_key.storage.arn
>   ...
> }
> ```
> **Impact:** When the External Secrets Operator attempts to synchronize the Redis auth secret into the Kubernetes cluster, AWS KMS will reject the request with `AccessDeniedException` because `aws_kms_key.storage.arn` is missing from the IAM policy.  
> **Remediation:** Update `Resource` in `KMSDecryptAccess` to include both `aws_kms_key.rds.arn` and `aws_kms_key.storage.arn` (or standardize all secrets under a single dedicated secrets KMS key).

---

## 4. Compute Hardening & EKS Host Security

### 4.1 Instance Metadata Service Version 2 (IMDSv2)
In `infra/eks.tf` (lines 111–117), the EC2 launch template enforces IMDSv2:
```hcl
metadata_options {
  http_endpoint               = "enabled"
  http_tokens                 = "required"
  http_put_response_hop_limit = 1
  instance_metadata_tags      = "enabled"
}
```
- `http_tokens = "required"` blocks legacy IMDSv1 tokenless requests.
- `http_put_response_hop_limit = 1` prevents containerized pods from stealing node-level IAM credentials via Server-Side Request Forgery (SSRF) vulnerabilities, as packets cannot cross the container network boundary.

### 4.2 Operating System & Runtime Environment
- **Node AMI:** `AL2023_x86_64_STANDARD` (Amazon Linux 2023).
- **Control Group Driver:** Native Linux `cgroup v2` enabled by default in AL2023, eliminating cgroup v1 deprecation risks.
- **Node Storage:** 80 GB gp3 root volumes encrypted with Customer Managed Key `aws_kms_key.storage.arn`.

---

## 5. Cryptography & Data Protection at Rest and In Transit

### 5.1 Customer Managed Keys (KMS CMKs)
DocSearch segregates cryptographic boundaries across four independent Customer Managed Keys:
1. `alias/docsearch-${var.environment}-rds`: Encrypts PostgreSQL database storage, WAL logs, and database secrets.
2. `alias/docsearch-${var.environment}-eks-secrets`: Encrypts Kubernetes Secrets at the etcd envelope layer.
3. `alias/docsearch-${var.environment}-storage`: Encrypts EC2 worker node root volumes, EFS filesystem, and Redis cache storage.
4. `alias/docsearch-${var.environment}-backup`: Encrypts AWS Backup Vault snapshots, CloudTrail audit logs, and Terraform remote state.

All four keys enforce:
- **Annual Automatic Key Rotation:** `enable_key_rotation = true`.
- **Accidental Deletion Protection:** `deletion_window_in_days = 30`.

### 5.2 Transport Layer Security (In Transit)
- **Edge Ingress:** Port 443 terminated at Ingress-NGINX enforcing `TLSv1.2` and `TLSv1.3` with ECDSA 256-bit certificates and 2-year HSTS (`Strict-Transport-Security: max-age=63072000`).
- **PostgreSQL Database:** In `infra/rds.tf`, `rds.force_ssl = 1` rejects all non-TLS client connections.
- **ElastiCache Redis:** In `infra/elasticache.tf`, `transit_encryption_enabled = true` and `auth_token` mandate encrypted TLS connections over port 6379.

---

## 6. Audit Logging & Governance

### 6.1 Multi-Region AWS CloudTrail
- Multi-Region Trail enabled (`is_multi_region_trail = true`).
- Cryptographic Log File Validation enabled (`enable_log_file_validation = true`), preventing undetectable tampering with audit logs.
- Dedicated S3 Audit Bucket (`docsearch-${var.environment}-cloudtrail-`) with:
  - Object Versioning enabled.
  - S3 Public Access Block fully enabled (all 4 flags true).
  - Default KMS SSE encryption with `aws_kms_key.backup.arn`.
  - Bucket policy restricting access strictly to `cloudtrail.amazonaws.com`.

### 6.2 CloudWatch Alarms & SRE Notification
- 7 automated alarms monitor RDS and Redis thresholds.
- P1 Multi-AZ replication lag alarm triggers if replica lag exceeds 60 seconds.
- Alerts route to dedicated SNS topic `docsearch-${var.environment}-dbre-alerts`.

---
*Security Review Complete — Finding F-01 Documented for Pre-Provisioning Remediation.*
