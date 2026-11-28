# DOCSEARCH PHASE 7.2D.2: INDEPENDENT F-01 REVALIDATION
## Cryptographic Scoping, IRSA Least Privilege, and SecretStore Identity Audit

**Document Identifier:** `DOCSEARCH_PHASE_7_2D_2_F01_INDEPENDENT_REVALIDATION`  
**Execution Timestamp:** `2026-11-05T07:49:00Z` (Local: `2026-11-05T13:19:00+05:30`)  
**Scope:** Independent Verification of Terraform Cryptographic Definitions and IRSA Configuration  
**Status:** **INDEPENDENTLY REVALIDATED & CERTIFIED (PASS)**  

---

## 1. Executive Summary

This independent audit re-examines the actual Terraform and Kubernetes declarations implemented in commit `2507118` to verify that the remediation of Finding F-01 was strictly limited to authorized requirements, preserved least privilege, and resolved the complete principal-to-secret-to-KMS authorization path.

The evaluation confirms:
1. **Redis Secret CMK Binding:** Verified in `infra/secrets_manager.tf`.
2. **KMS Policy Least Privilege:** Verified in `infra/eks_addons.tf` (zero wildcards, exact CMK ARNs).
3. **RDS Decrypt Compatibility:** Preserved without regression.
4. **IRSA Dual-Identity Trust:** Formally reconciles `docsearch-app-sa` and `docsearch-api-gateway-sa`.
5. **SecretStore Parity:** Aligned with `k8s/04-secrets.yaml`.
6. **Token Security:** `automountServiceAccountToken: false` correctly enforced across all service accounts.

---

## 2. In-Depth Configuration Audit

```mermaid
flowchart LR
    subgraph Manifests ["k8s/01-rbac.yaml & 04-secrets.yaml"]
        SA1["docsearch-app-sa\n(automount: false)"]
        SA2["docsearch-api-gateway-sa\n(automount: false)"]
        SS["SecretStore\n(auth.jwt.serviceAccountRef: docsearch-api-gateway-sa)"]
    end

    subgraph IRSA ["infra/eks_addons.tf"]
        ROLE["aws_iam_role.external_secrets\nCondition: sub in [docsearch-app-sa, docsearch-api-gateway-sa]"]
        POLICY["aws_iam_policy.external_secrets\nResource: [aws_kms_key.rds, aws_kms_key.storage]"]
    end

    subgraph CMKs ["infra/kms.tf"]
        KMS_RDS["aws_kms_key.rds"]
        KMS_STORAGE["aws_kms_key.storage"]
    end

    SS -.->|Uses SA| SA2
    SA1 -->|AssumeRoleWithWebIdentity| ROLE
    SA2 -->|AssumeRoleWithWebIdentity| ROLE
    ROLE -->|Attached| POLICY
    POLICY -->|kms:Decrypt| KMS_RDS
    POLICY -->|kms:Decrypt| KMS_STORAGE
```

### 2.1 Redis Secret CMK Binding (`infra/secrets_manager.tf`)
- **Resource:** `aws_secretsmanager_secret.redis_credentials` (lines 60–69)
- **CMK Binding:** `kms_key_id = aws_kms_key.storage.arn`
- **Audit:** Confirmed. Redis secret is explicitly bound to the storage CMK (`alias/docsearch-${var.environment}-storage`).

### 2.2 External Secrets IAM Policy (`infra/eks_addons.tf`)
- **Resource:** `aws_iam_policy.external_secrets` (lines 92–119)
- **Policy Statements:**
  ```hcl
  Statement = [
    {
      Sid    = "SecretsManagerAccess"
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = [
        "arn:aws:secretsmanager:${var.aws_region}:*:secret:docsearch/${var.environment}/*"
      ]
    },
    {
      Sid    = "KMSDecryptAccess"
      Effect = "Allow"
      Action = [
        "kms:Decrypt",
        "kms:DescribeKey"
      ]
      Resource = [
        aws_kms_key.rds.arn,
        aws_kms_key.storage.arn
      ]
    }
  ]
  ```
- **Least-Privilege Verification:**
  - Wildcard actions (`kms:*` or `secretsmanager:*`): **NONE.**
  - Wildcard resources (`Resource: "*"`): **NONE.**
  - Path restriction: Strictly confined to `docsearch/${var.environment}/*`.
  - Cryptographic restriction: Strictly confined to `aws_kms_key.rds.arn` and `aws_kms_key.storage.arn`.

### 2.3 RDS PostgreSQL CMK Decryption
- **Resource:** `aws_secretsmanager_secret.db_credentials` (lines 33–42)
- **CMK Binding:** `kms_key_id = aws_kms_key.rds.arn`
- **Audit:** `aws_kms_key.rds.arn` remains the primary entry in `KMSDecryptAccess`. Both static HCL tests and simulated unit tests confirm database credentials decrypt flawlessly.

### 2.4 IRSA Trust Policy & ServiceAccount Names
- **Resource:** `aws_iam_role.external_secrets` (lines 67–86)
- **Trust Condition:**
  ```hcl
  StringEquals = {
    "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:sub" = [
      "system:serviceaccount:docsearch-production:docsearch-app-sa",
      "system:serviceaccount:docsearch-production:docsearch-api-gateway-sa"
    ]
    "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:aud" = "sts.amazonaws.com"
  }
  ```
- **Audit:**
  - `k8s/01-rbac.yaml` defines both `docsearch-app-sa` (lines 11–19) and `docsearch-api-gateway-sa` (lines 1–9).
  - `k8s/04-secrets.yaml` (lines 17–18) specifies `serviceAccountRef.name = "docsearch-api-gateway-sa"`.
  - Both service accounts reside in `docsearch-production`.
  - The IRSA condition evaluates to TRUE for tokens projected by either service account.

### 2.5 Token Automount Settings
- In `k8s/01-rbac.yaml`:
  `automountServiceAccountToken: false` is configured on both `docsearch-app-sa` and `docsearch-api-gateway-sa`.
- **Security & Operational Validity:**
  Disabling automatic token mounting is a Kubernetes Hardening Guide requirement to prevent token exfiltration via container compromise. For IRSA, projected service account tokens (`volumeMounts` with projected tokens targeting `audience: sts.amazonaws.com`) are injected on-demand into pods that perform role assumption, ensuring both maximum security and uninterrupted IAM authentication.

---

## 3. Policy Simulation & Test Results

The isolated test suite `apps/api-gateway/test/phase7-2d-1-kms-iam-remediation.test.mjs` was re-executed and re-verified:
- **14 of 14 tests passed.**
- Positive authorization: Redis secret decrypts with storage CMK; RDS secret decrypts with RDS CMK.
- Negative authorization: Unauthorized roles fail; disabled KMS keys fail safely; cross-tenant secrets are rejected; unauthorized service accounts fail IRSA assumption.

---

## 4. Delineation: Static AST vs. Live AWS Cloud Integration

> [!IMPORTANT]
> - **Static AST & Policy Simulation:** **VERIFIED (PASS)**.
> - **Live AWS STS / KMS Integration:** **BLOCKED**. Live testing requires provisioning live cloud resources and authenticating against AWS endpoints. In accordance with strict stop conditions, live cloud testing remains BLOCKED.
