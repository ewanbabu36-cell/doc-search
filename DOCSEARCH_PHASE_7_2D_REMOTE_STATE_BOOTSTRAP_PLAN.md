# DOCSEARCH — PHASE 7.2D
# REMOTE TERRAFORM STATE BOOTSTRAP & MIGRATION PLAN

**Document Identifier:** `DOCSEARCH-P7.2D-TF-BOOTSTRAP-001`  
**Git Baseline Commit:** `f60ac5cf164c104f3229b971656690631293e1f9`  
**Branch:** `main`  
**Execution Timestamp:** `2026-11-05T06:24:00Z` (Local: `2026-11-05T11:54:00+05:30`)  
**Scope:** Remote Backend Configuration, S3/DynamoDB Security, State Migration & Rollback Procedures  
**Status:** **AUTHORITATIVE OPERATIONAL SPECIFICATION (Pre-Provisioning)**  

---

## 1. Remote State Architecture Overview

Terraform requires shared remote state storage with distributed mutual-exclusion locking to prevent race conditions, concurrent state modification, and data corruption in multi-engineer or CI/CD automated deployments.

In DocSearch, the proposed remote backend architecture comprises:
1. **Amazon S3 State Bucket:** Encrypted object store holding the gzipped JSON state file (`infrastructure/terraform.tfstate`).
2. **Amazon DynamoDB Lock Table:** High-speed key-value table acquiring distributed mutex locks via string hash key `LockID`.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Terraform CLI (Engineer Workstation / CI/CD Pipeline)                  │
└──────────────────┬───────────────────────────────────┬─────────────────┘
                   │ 1. Acquire Lock (LockID)          │ 3. Fetch/Commit
                   │    Conditional Check              │    Encrypted State
                   ▼                                   ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│ DynamoDB Lock Table                 │  │ S3 Remote State Bucket        │
│ docsearch-staging-terraform-locks   │  │ docsearch-staging-tfstate-*   │
│  - Partition Key: LockID (String)   │  │  - Object Versioning: ENABLED │
│  - PITR Recovery: ENABLED           │  │  - KMS SSE: CMK (AES-256)     │
│  - SSE: CMK (aws_kms_key.backup)    │  │  - Public Access: ALL BLOCKED │
└─────────────────────────────────────┘  └───────────────────────────────┘
```

---

## 2. Resource Forensic Inspection (`infra/remote_state_backend.tf`)

### 2.1 Amazon S3 Remote State Bucket
Declared in `infra/remote_state_backend.tf` (lines 9–46):
- **Bucket Naming:** `bucket_prefix = "docsearch-${var.environment}-tfstate-"` ensures globally unique bucket naming while preserving organizational taxonomy.
- **Object Versioning (`aws_s3_bucket_versioning`):** Set to `status = "Enabled"`. Every `terraform apply` state modification creates a new immutable version. Accidental state overwrite or corruption can be instantly rolled back to any prior version.
- **Server-Side Encryption (`aws_s3_bucket_server_side_encryption_configuration`):** Enforces `aws:kms` encryption using Customer Managed Key `aws_kms_key.backup.arn`. State files containing database hostnames, resource IDs, and generated hashes are encrypted at rest.
- **Public Access Block (`aws_s3_bucket_public_access_block`):** All 4 S3 public access block flags are set to `true`:
  - `block_public_acls = true`
  - `block_public_policy = true`
  - `ignore_public_acls = true`
  - `restrict_public_buckets = true`
- **Bucket Teardown Policy:** `force_destroy = var.environment == "staging" ? true : false`. Staging state buckets allow automated decommissioning upon authorized cleanup, whereas production state buckets strictly forbid deletion while objects exist.

### 2.2 Amazon DynamoDB Distributed Lock Table
Declared in `infra/remote_state_backend.tf` (lines 50–74):
- **Table Name:** `docsearch-${var.environment}-terraform-locks`.
- **Billing Mode:** `PAY_PER_REQUEST` (On-Demand capacity). Eliminates fixed hourly costs; charges occur only during active state read/write lock cycles.
- **Hash Key:** `LockID` (Type: `S` [String]). Required by HashiCorp Terraform S3 backend specification.
- **Point-In-Time Recovery (PITR):** `enabled = true`. Continuous table protection against accidental deletion or table corruption.
- **Server-Side Encryption:** `enabled = true` using Customer Managed Key `aws_kms_key.backup.arn`.

---

## 3. The Chicken-and-Egg Bootstrap Dependency Dilemma

In `infra/terraform.tf` (lines 24–34), the backend configuration block is currently commented out:
```hcl
  # backend "s3" {
  #   bucket         = "docsearch-terraform-state-ap-south-1"
  #   key            = "infrastructure/terraform.tfstate"
  #   region         = "ap-south-1"
  #   encrypt        = true
  #   kms_key_id     = "alias/docsearch-terraform-state-key"
  #   dynamodb_table = "docsearch-terraform-locks"
  # }
```

### The Problem
If an engineer uncomments this block prior to cloud provisioning, `terraform init` will fail with an error stating that the S3 bucket does not exist. Conversely, Terraform cannot create the S3 bucket under this backend configuration because it cannot initialize itself.

### The Standardized Resolution
A strict two-stage bootstrap protocol must be followed:
- **Stage 1 (Local State Bootstrap):** Terraform is initialized with local state (`backend "local"`), and targets ONLY the remote state backend resources and supporting KMS keys.
- **Stage 2 (State Migration):** Once the S3 bucket and DynamoDB table physically exist in AWS, the backend block is populated with the created bucket name, and `terraform init -migrate-state` is invoked to transfer the local state file into S3.

---

## 4. Step-by-Step Safe State Migration Procedure

> [!CAUTION]
> **Strict Operational Invariant:**  
> Never delete, overwrite, or mutate existing local Terraform state (`terraform.tfstate`) without creating an offline immutable timestamped backup.  
> Do not execute the migration procedure until explicit human change authorization is granted.

### Phase 1: Pre-Migration State Backup
Before any backend modification or cloud command:
```bash
# 1. Create offline immutable snapshot of existing state
cp infra/terraform.tfstate infra/terraform.tfstate.pre-migration.$(date +%Y%m%d%H%M%S).bak

# 2. Verify backup integrity
ls -l infra/terraform.tfstate*
```

### Phase 2: Target-Limited Cloud Bootstrap
Execute targeted creation of backend storage and KMS keys using authorized AWS credentials:
```bash
# Target only the remote backend resources and supporting KMS key
terraform -chdir=infra apply \
  -target=aws_kms_key.backup \
  -target=aws_kms_alias.backup \
  -target=aws_s3_bucket.terraform_state \
  -target=aws_s3_bucket_versioning.terraform_state \
  -target=aws_s3_bucket_server_side_encryption_configuration.terraform_state \
  -target=aws_s3_bucket_public_access_block.terraform_state \
  -target=aws_dynamodb_table.terraform_locks
```

### Phase 3: Obtain Exact Bucket Name & Configure Backend Block
Capture the dynamically generated S3 bucket name (from `bucket_prefix`):
```bash
# Retrieve exact bucket name
BUCKET_NAME=$(terraform -chdir=infra output -raw terraform_state_bucket_name 2>/dev/null || \
  aws s3api list-buckets --query "Buckets[?starts_with(Name, 'docsearch-staging-tfstate-')].Name | [0]" --output text)
```

Uncomment and configure the backend block in `infra/terraform.tf`:
```hcl
  backend "s3" {
    bucket         = "<ACTUAL_GENERATED_BUCKET_NAME>"
    key            = "staging/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    kms_key_id     = "alias/docsearch-staging-backup"
    dynamodb_table = "docsearch-staging-terraform-locks"
  }
```

### Phase 4: State Migration Execution
Run the automated migration command:
```bash
terraform -chdir=infra init -migrate-state
```
When prompted:
```
Do you want to copy existing state to the new backend?
  Enter "yes" to confirm and copy existing state.
```
Type `yes`. Terraform will:
1. Acquire a lock on DynamoDB table `docsearch-staging-terraform-locks`.
2. Upload the local `terraform.tfstate` to S3 under `staging/terraform.tfstate`.
3. Release the DynamoDB lock.
4. Rename local `terraform.tfstate` to `terraform.tfstate.backup`.

### Phase 5: Verification & Audit
Verify the state object exists in S3 and locking works:
```bash
# 1. Verify S3 object and KMS encryption
aws s3api head-object \
  --bucket "<ACTUAL_GENERATED_BUCKET_NAME>" \
  --key "staging/terraform.tfstate"

# 2. Run non-mutating plan to verify distributed state locking
terraform -chdir=infra plan -no-color
```

---

## 5. Emergency Rollback Procedure (If Migration Fails)

If network timeout, authentication error, or state mismatch occurs during migration:
1. Re-comment the `backend "s3"` block in `infra/terraform.tf`.
2. Restore local state from backup:
   ```bash
   cp infra/terraform.tfstate.pre-migration.*.bak infra/terraform.tfstate
   ```
3. Re-initialize local backend:
   ```bash
   terraform -chdir=infra init -reconfigure
   ```
4. Verify local state integrity:
   ```bash
   terraform -chdir=infra state list
   ```

---
*Remote State Bootstrap & Migration Plan Complete — Ready for Execution Post-Authorization.*
