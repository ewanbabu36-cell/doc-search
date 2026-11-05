# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# AWS Backup Vault: Immutable WORM Compliance Lock & Cross-Region Replication
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Primary AWS Backup Vault (Mumbai - ap-south-1)
# ------------------------------------------------------------------------------
resource "aws_backup_vault" "primary_vault" {
  name        = "docsearch-${var.environment}-backup-vault"
  kms_key_arn = aws_kms_key.backup.arn

  tags = {
    Name        = "docsearch-${var.environment}-backup-vault"
    Compliance  = "WORM_COMPLIANCE_MODE"
    Environment = var.environment
  }
}

# WORM Immutable Lock: Backups cannot be deleted or truncated during retention window
resource "aws_backup_vault_lock_configuration" "worm_lock" {
  count               = var.environment == "production" ? 1 : 0
  backup_vault_name   = aws_backup_vault.primary_vault.name
  min_retention_days  = 35
  max_retention_days  = 365
  changeable_for_days = 3 # 3-day grace period before lock becomes legally irrevocable
}

# ------------------------------------------------------------------------------
# 2. Secondary Disaster Recovery Backup Vault (Hyderabad - ap-south-2)
# ------------------------------------------------------------------------------
resource "aws_backup_vault" "dr_vault" {
  provider = aws.dr
  name     = "docsearch-${var.environment}-dr-vault"

  tags = {
    Name        = "docsearch-${var.environment}-dr-vault"
    Role        = "CrossRegionDisasterRecovery"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 3. AWS Backup Plan: Daily Snapshots with Cross-Region Copy Rule
# ------------------------------------------------------------------------------
resource "aws_backup_plan" "daily_plan" {
  name = "docsearch-${var.environment}-daily-backup-plan"

  rule {
    rule_name         = "DailySnapshot35DayRetention"
    target_vault_name = aws_backup_vault.primary_vault.name
    schedule          = "cron(0 18 ? * * *)" # 18:00 UTC (23:30 IST - off-peak window)

    lifecycle {
      delete_after = var.backup_retention_days
    }

    # Cross-Region Copy Rule to Hyderabad (ap-south-2) for National DR Compliance
    copy_action {
      destination_vault_arn = aws_backup_vault.dr_vault.arn
      lifecycle {
        delete_after = var.backup_retention_days
      }
    }
  }

  tags = {
    Name        = "docsearch-${var.environment}-daily-backup-plan"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 4. IAM Role for AWS Backup Service
# ------------------------------------------------------------------------------
resource "aws_iam_role" "backup_service_role" {
  name = "docsearch-${var.environment}-aws-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "backup.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup_service_role" {
  role       = aws_iam_role.backup_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# ------------------------------------------------------------------------------
# 5. Backup Selection: PostgreSQL Primary & EFS File System
# ------------------------------------------------------------------------------
resource "aws_backup_selection" "primary_selection" {
  iam_role_arn = aws_iam_role.backup_service_role.arn
  name         = "docsearch-${var.environment}-primary-selection"
  plan_id      = aws_backup_plan.daily_plan.id

  resources = [
    aws_db_instance.primary.arn,
    aws_efs_file_system.pacs.arn
  ]
}
