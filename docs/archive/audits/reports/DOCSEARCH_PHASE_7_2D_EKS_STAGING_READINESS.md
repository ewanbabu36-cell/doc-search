# DOCSEARCH — PHASE 7.2D
# EKS KUBERNETES STAGING READINESS AUDIT

**Document Identifier:** `DOCSEARCH-P7.2D-EKS-READINESS-001`  
**Git Baseline Commit:** `f60ac5cf164c104f3229b971656690631293e1f9`  
**Branch:** `main`  
**Execution Timestamp:** `2026-11-05T06:26:00Z` (Local: `2026-11-05T11:56:00+05:30`)  
**Scope:** EKS Cluster Architecture, AL2023 / cgroup v2, Storage Classes, IRSA, Manifest vs. Runtime Differentiation  
**Status:** **AUTHORITATIVE EKS READINESS AUDIT**  

---

## 1. Executive Summary

This readiness audit independently validates the Kubernetes orchestration layer designed for the DocSearch enterprise cloud platform. The audit evaluates cluster security configurations in Terraform (`infra/eks.tf`, `infra/eks_addons.tf`), CSI storage architectures (`infra/efs.tf`, `k8s/05-storage.yaml`), ingress and TLS policies (`k8s/20-ingress.yaml`, `k8s/06-cert-manager.yaml`), and application manifests (`k8s/*.yaml`).

### Critical Architectural Distinction
> [!IMPORTANT]
> **Static Manifest Validation vs. Live Cluster Runtime Verification:**  
> - **Static Manifest Validation: 100% VERIFIED.** All Kubernetes manifests comply with modern GA API versions (`apps/v1`, `networking.k8s.io/v1`, `storage.k8s.io/v1`, `cert-manager.io/v1`). Zero deprecated API groups exist.  
> - **Live Cluster Verification: NOT VERIFIED.** Live multi-node pod scheduling, container networking via AWS VPC CNI, live EBS CSI volume mounting, and cgroup v2 runtime resource throttling cannot be verified until the staging EKS cluster is provisioned on AWS.

---

## 2. EKS Control Plane & Worker Node Configuration

### 2.1 EKS Cluster Control Plane (`infra/eks.tf`)
- **Kubernetes Version:** Defaults to `1.31` (parameterized in `infra/variables.tf`), placing DocSearch firmly in AWS Standard Support.
- **Control Plane Endpoint Security:**
  - `endpoint_private_access = true`: Worker nodes, internal pods, and Bastion/VPN endpoints communicate with the Kubernetes API server privately inside the VPC.
  - `endpoint_public_access = true` with `public_access_cidrs = var.eks_public_access_cidrs`: Parameterized IP whitelisting restricts administrative access.
- **Envelope Encryption for Secrets:** The EKS cluster natively integrates with AWS KMS via `aws_kms_key.eks_secrets.arn`. All Kubernetes Secrets stored in etcd are transparently envelope-encrypted using an isolated Customer Managed Key (AES-256).
- **Control Plane Observability:** All 5 control plane log streams (`api`, `audit`, `authenticator`, `controllerManager`, `scheduler`) are continuously exported to CloudWatch Logs.

### 2.2 Worker Nodes & Launch Template Hardening
- **Operating System AMI:** `AL2023_x86_64_STANDARD` (Amazon Linux 2023).
- **Control Group Driver:** Enforces native Linux `cgroup v2`, eliminating legacy cgroup v1 deprecation risks.
- **IMDSv2 Enforcement:** Launch template enforces `http_tokens = "required"` and `http_put_response_hop_limit = 1`, blocking pod-level SSRF credential exfiltration.
- **Node Storage:** 80 GB gp3 root volumes encrypted with KMS CMK `aws_kms_key.storage.arn`.
- **Scaling & Subnet Allocation:** Min 2, Desired 3, Max 5 instances distributed across 3 private application subnets (`ap-south-1a`, `ap-south-1b`, `ap-south-1c`). Nodes possess zero public IP addresses.

---

## 3. Kubernetes Storage Architecture (EBS gp3 & EFS RWX)

DocSearch implements a dual-tier storage architecture addressing clinical persistence requirements:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Kubernetes Workloads (Namespace: docsearch-production)                 │
└──────────────────┬───────────────────────────────────┬─────────────────┘
                   │ RWO (Single-Writer)               │ RWX (Multi-Reader/Writer)
                   ▼                                   ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│ EBS gp3 PersistentVolumeClaim       │  │ EFS Shared Access Point       │
│ pacs-ebs-pvc (StorageClass: ebs-gp3)│  │ pacs-efs-pvc (StorageClass:   │
│  - Active-Passive Recreate Mode     │  │   efs-sc)                     │
│  - Single Replica Controller        │  │  - POSIX UID/GID: 1001:1001   │
│  - KMS CMK Storage Encryption       │  │  - Multi-Replica Clinical Sync│
└─────────────────────────────────────┘  └───────────────────────────────┘
```

### 3.1 EBS gp3 StorageClass (`ebs-gp3`)
- **Provisioner:** `ebs.csi.aws.com`.
- **Volume Binding Mode:** `WaitForFirstConsumer`. Ensures EBS volumes are provisioned in the specific Availability Zone where the scheduled pod is placed.
- **Volume Attributes:** gp3, 3000 IOPS, 125 MB/s throughput, encrypted via `aws_kms_key.storage.arn`.
- **PACS Deployment Safety:** In `k8s/11-pacs-server.yaml`, the PACS server deployment specifies `replicas: 1` and `strategy.type: Recreate`. This guarantees that old pods are terminated and the ReadWriteOnce (RWO) EBS volume is cleanly unmounted before a replacement pod is scheduled, preventing volume multi-attachment errors.

### 3.2 EFS Shared StorageClass (`efs-sc`)
- **Provisioner:** `efs.csi.aws.com`.
- **Access Mode:** `ReadWriteMany` (RWX).
- **Access Point Enforcement:** Tied to `aws_efs_access_point.pacs` in `infra/efs.tf` with POSIX UID/GID 1001 and `0700` directory permissions, preventing unauthorized cross-tenant filesystem access.

---

## 4. Ingress, TLS Termination & Edge Security

### 4.1 Ingress-NGINX & NLB Integration
- **Edge Routing:** AWS Network Load Balancer (NLB) terminates TCP connections on port 80 and 443 and forwards directly to Ingress-NGINX worker NodePorts (30080 and 30443).
- **Protocol Enforcements (`k8s/20-ingress.yaml`):**
  - Modern TLS only: `ssl-protocols: "TLSv1.2 TLSv1.3"`.
  - HTTP-to-HTTPS redirect: `ssl-redirect: "true"` and `force-ssl-redirect: "true"`.
  - HTTP Strict Transport Security: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2-year HSTS).

### 4.2 Automated Certificate Lifecycle (`cert-manager`)
- **CRD Version:** `cert-manager.io/v1`.
- **Issuer:** Let's Encrypt ACME HTTP-01 solver.
- **Key Cryptography:** Enforces ECDSA with P-256 curve (`algorithm: ECDSA`, `size: 256`), providing superior cryptographic strength and TLS handshake performance compared to legacy RSA-2048.

---

## 5. Pod Security, Probes & Reliability Governance

### 5.1 Service Mesh & Application Probes
Every application workload (`10-api-gateway.yaml`, `11-pacs-server.yaml`) implements three-tier Kubernetes probes:
1. **Startup Probe:** `/health` with generous failure threshold (30 attempts @ 5s = 150s) to allow slow database connection pool warmups.
2. **Liveness Probe:** `/health` every 10s to detect container deadlocks and trigger automatic pod replacement.
3. **Readiness Probe:** `/health` every 5s to gate traffic routing until the service is fully operational.

### 5.2 Disruption & Rollback Governance
- **Pod Disruption Budgets (PDB):** Enforces `minAvailable: 1` on critical multi-replica services, preventing cluster auto-scaler or node drain events from causing service outages.
- **Horizontal Pod Autoscaling (HPA):** Configured on API Gateway with CPU and Memory target thresholds (70% utilization), scaling between 2 and 10 pods.
- **Deployment Rollback Strategy:** Rolling update with `maxSurge: 25%` and `maxUnavailable: 0` ensures zero-downtime upgrades.

---
*EKS Staging Readiness Audit Complete — Manifest Layer 100% Compliant; Runtime Verification Requires Cloud Provisioning.*
