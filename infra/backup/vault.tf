# ------------------------------------------------------------------------------
# AWS Backup Vault: Immutable WORM Compliance Lock & Cross-Region Vault
# ------------------------------------------------------------------------------

resource "aws_backup_vault" "primary_vault" {
  name        = "docsearch-${var.environment}-backup-vault"
  kms_key_arn = aws_kms_key.rds.arn

  tags = {
    Project     = "DOC_SEARCH"
    Environment = var.environment
    Compliance  = "WORM_COMPLIANCE_MODE"
  }
}

# WORM Lock Configuration: Backups cannot be deleted by any user/attacker for 35 days
resource "aws_backup_vault_lock_configuration" "worm_lock" {
  count               = var.environment == "production" ? 1 : 0
  backup_vault_name   = aws_backup_vault.primary_vault.name
  min_retention_days  = 35
  max_retention_days  = 365
  changeable_for_days = 3 # 3-day grace period before lock becomes irrevocable
}

# AWS Backup Plan: Daily Snapshots with 35-Day Retention
resource "aws_backup_plan" "rds_backup_plan" {
  name = "docsearch-${var.environment}-daily-backup-plan"

  rule {
    rule_name         = "DailySnapshot35DayRetention"
    target_vault_name = aws_backup_vault.primary_vault.name
    schedule          = "cron(0 18 ? * * *)" # 18:00 UTC (23:30 IST)

    lifecycle {
      delete_after = 35 # 35 days minimum retention
    }

    # Cross-Region Copy Rule to ap-south-2 (Hyderabad) for Regional Disaster Recovery
    copy_action {
      destination_vault_arn = "arn:aws:backup:ap-south-2:${data.aws_caller_identity.current.account_id}:backup-vault:docsearch-${var.environment}-dr-vault"
      lifecycle {
        delete_after = 35
      }
    }
  }

  tags = {
    Project     = "DOC_SEARCH"
    Environment = var.environment
  }
}

data "aws_caller_identity" "current" {}

# IAM Role for AWS Backup Service
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

resource "aws_backup_selection" "rds_selection" {
  iam_role_arn = aws_iam_role.backup_service_role.arn
  name         = "docsearch-${var.environment}-rds-selection"
  plan_id      = aws_backup_plan.rds_backup_plan.id

  resources = [
    aws_db_instance.primary.arn
  ]
}
