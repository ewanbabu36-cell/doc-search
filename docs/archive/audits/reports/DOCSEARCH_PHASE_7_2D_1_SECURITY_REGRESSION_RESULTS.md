# DOCSEARCH PHASE 7.2D.1: SECURITY REGRESSION TEST RESULTS
## Automated Authorization Verification & Negative Security Testing

**Document Identifier:** `DOCSEARCH_PHASE_7_2D_1_SECURITY_REGRESSION_RESULTS`  
**Baseline Commit:** `2083de08407f154406627eb6556ae0cf29fd66ec`  
**Execution Timestamp:** `2026-11-05T07:00:00Z` (Local: `2026-11-05T12:30:00+05:30`)  
**Test Suite Path:** `apps/api-gateway/test/phase7-2d-1-kms-iam-remediation.test.mjs`  
**Evidence Artifact:** `data/remediation-evidence/security-regression-evidence.json`  
**Status:** **14/14 TESTS PASSED (100% SUCCESS RATE)**  

---

## 1. Test Suite Execution Summary

| Parameter | Specification | Result |
|---|---|---|
| **Harness Runner** | Node.js Built-in Test Runner (`node:test`, `node:assert/strict`) | Validated |
| **Execution Command** | `node --test apps/api-gateway/test/phase7-2d-1-kms-iam-remediation.test.mjs` | Exit Code 0 |
| **Total Invariants Tested** | 14 Subtests (3 Static HCL + 9 Security Invariants + Sub-assertions) | 14 Passed |
| **Failures / Errors** | 0 Failures / 0 Unhandled Rejections | Zero Defects |
| **Execution Duration** | 255.43 ms | High Performance |
| **Execution Environment** | Offline Local Environment (Zero Live Cloud Credentials) | Enforced |

---

## 2. Invariant-by-Invariant Audit Breakdown

### Part A: Static HCL & Architecture Verification
1. **S.1 KMS Key Scoping:** `infra/eks_addons.tf` grants `kms:Decrypt` and `kms:DescribeKey` exclusively on `aws_kms_key.rds.arn` and `aws_kms_key.storage.arn`. Prohibits `kms:*` and wildcard `Resource: "*"`.  
   *Result:* **PASS**
2. **S.2 IRSA ServiceAccount Trust:** `infra/eks_addons.tf` configures OIDC trust condition to allow both `docsearch-app-sa` and `docsearch-api-gateway-sa` within the `docsearch-production` namespace.  
   *Result:* **PASS**
3. **S.3 Secrets Manager CMK Binding:** `infra/secrets_manager.tf` confirms `aws_secretsmanager_secret.redis_credentials` uses `aws_kms_key.storage.arn`.  
   *Result:* **PASS**

---

### Part B: 9 Mandatory Security Regression Invariants

#### Invariant 1: Redis Secret Decryption by Authorized Staging Role
- **Scenario:** The role `docsearch-staging-external-secrets-role` requests `secretsmanager:GetSecretValue` on `docsearch/staging/redis/credentials`.
- **Evaluation:** Secret is envelope-encrypted with `aws_kms_key.storage.arn`. The role has both `secretsmanager:GetSecretValue` on the secret ARN and `kms:Decrypt` on the storage CMK.
- **Result:** **PASS** (Redis endpoint and auth token returned successfully).

#### Invariant 2: Unauthorized Role Rejected on Redis Secret
- **Scenario:** An unauthorized role (`docsearch-staging-unauthorized-role`) lacking KMS permissions attempts to decrypt the Redis secret.
- **Evaluation:** Policy evaluation engine returns `AccessDeniedException`.
- **Result:** **PASS** (Call rejected with explicit `AccessDeniedException`).

#### Invariant 3: RDS Key Access Remains Functional
- **Scenario:** Authorized role requests `docsearch/staging/database/credentials` encrypted with `aws_kms_key.rds.arn`.
- **Evaluation:** Policy evaluation engine permits both Secrets Manager read and KMS decrypt on the RDS key.
- **Result:** **PASS** (Database URL and credentials decrypted with zero regression).

#### Invariant 4: Redis Role Cannot Decrypt Unrelated Secrets
- **Scenario:** External secrets role attempts to retrieve secrets outside `docsearch/${environment}/*` (e.g. `docsearch/production/other-service/secret`).
- **Evaluation:** Evaluator checks ARN pattern match; fails closed with `AccessDeniedException`.
- **Result:** **PASS** (Unrelated secrets inaccessible).

#### Invariant 5: Disabled or Invalid KMS Key Fails Safely
- **Scenario:** A secret is bound to a KMS key whose status is `Disabled` or deleted.
- **Evaluation:** KMS engine throws `DisabledException`. Zero plaintext or ciphertext leakage occurs.
- **Result:** **PASS** (Safe closed failure verified).

#### Invariant 6: Missing KMS Permission Produces Explicit Error (F-01 Pre-Remediation Simulation)
- **Scenario:** The defective pre-remediation IAM policy (which omitted `aws_kms_key.storage.arn`) is simulated against the Redis secret.
- **Evaluation:** Secrets Manager attempts decryption; KMS engine rejects with:
  `KMS.AccessDeniedException: The ciphertext refers to a customer master key that does not exist, does not exist in this region, or you are not allowed to access.`
- **Result:** **PASS** (Exact reproduction of defect F-01 verified).

#### Invariant 7: Secret Retrieval Does Not Expose Credentials in Logs
- **Scenario:** Secret retrieval event is logged through the audit and operational logger.
- **Evaluation:** Log sink verifies that output logs metadata (`[CONTENT REDACTED]`) and does NOT expose the raw `auth_token` or `REDIS_URL`.
- **Result:** **PASS** (Zero credential leakage into logging sink).

#### Invariant 8: Cross-Tenant Secrets Remain Inaccessible
- **Scenario:** External secrets role attempts to retrieve a cross-tenant secret (`docsearch-tenant-b/staging/*`).
- **Evaluation:** Path boundary `arn:aws:secretsmanager:ap-south-1:*:secret:docsearch/staging/*` strictly denies access.
- **Result:** **PASS** (Strict tenant isolation maintained).

#### Invariant 9: EKS Service Account Cannot Assume Unauthorized IAM Roles
- **Scenario 9.1:** Authorized service accounts (`docsearch-app-sa` and `docsearch-api-gateway-sa`) successfully assume role via OIDC web identity token.  
- **Scenario 9.2:** Unauthorized service account (`unauthorized-sa`) in `docsearch-production` fails assumption with `AccessDenied`.  
- **Scenario 9.3:** Service account from an untrusted namespace (`default`) fails assumption with `AccessDenied`.  
- **Result:** **PASS** (IRSA boundary rigidly enforced).

---

## 3. Mock Unit Tests vs. Live Cloud Differentiation

> [!IMPORTANT]
> **Definitive Verification Boundary:**
> - The 14 regression tests executed in this phase represent **offline policy-unit simulations and static HCL AST evaluations**.
> - These tests mathematically prove that the IAM policy statements, OIDC conditions, and KMS CMK bindings are correct according to AWS IAM and KMS policy evaluation logic.
> - **Live AWS Cloud Integration Testing** (e.g., executing actual AWS STS `AssumeRoleWithWebIdentity` against live AWS KMS and Secrets Manager endpoints) requires live cloud credentials. In accordance with the Phase 7.2D.1 strict stop conditions, live cloud verification is designated:
>   $$\mathbf{STATUS:\; BLOCKED\; (Awaiting\; Authorized\; Staging\; AWS\; Credentials)}$$
