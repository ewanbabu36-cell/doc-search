# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# AWS KMS Customer Managed Keys (CMKs) for Envelope Encryption at Rest
# ==============================================================================

# 1. KMS Key for RDS PostgreSQL Storage & Continuous WAL Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS CMK for DocSearch RDS PostgreSQL storage encryption (AES-256)"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name       = "docsearch-${var.environment}-rds-kms"
    Compliance = "HIPAA_DISHA_DPDP"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/docsearch-${var.environment}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# 2. KMS Key for EKS Kubernetes Secrets Envelope Encryption
resource "aws_kms_key" "eks_secrets" {
  description             = "KMS CMK for Amazon EKS Kubernetes secrets envelope encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name       = "docsearch-${var.environment}-eks-secrets-kms"
    Compliance = "HIPAA_DISHA_DPDP"
  }
}

resource "aws_kms_alias" "eks_secrets" {
  name          = "alias/docsearch-${var.environment}-eks-secrets"
  target_key_id = aws_kms_key.eks_secrets.key_id
}

# 3. KMS Key for EBS gp3 Persistent Volumes (PACS) & EFS Shared Storage
resource "aws_kms_key" "storage" {
  description             = "KMS CMK for EBS persistent volumes and AWS EFS file systems"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name       = "docsearch-${var.environment}-storage-kms"
    Compliance = "HIPAA_DISHA_DPDP"
  }
}

resource "aws_kms_alias" "storage" {
  name          = "alias/docsearch-${var.environment}-storage"
  target_key_id = aws_kms_key.storage.key_id
}

# 4. KMS Key for AWS Backup Vault & WORM Snapshots
resource "aws_kms_key" "backup" {
  description             = "KMS CMK for AWS Backup Vault immutable snapshot encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name       = "docsearch-${var.environment}-backup-kms"
    Compliance = "HIPAA_DISHA_DPDP"
  }
}

resource "aws_kms_alias" "backup" {
  name          = "alias/docsearch-${var.environment}-backup"
  target_key_id = aws_kms_key.backup.key_id
}
