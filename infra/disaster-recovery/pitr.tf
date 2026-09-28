# ------------------------------------------------------------------------------
# Disaster Recovery & Point-in-Time Recovery IAM Automation Policies
# ------------------------------------------------------------------------------

resource "aws_iam_policy" "dr_automation_policy" {
  name        = "docsearch-${var.environment}-dr-automation-policy"
  description = "Permissions for automated point-in-time recovery and failover verification"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RdsDrillPermissions"
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots",
          "rds:DescribeDBLogFiles",
          "rds:RebootDBInstance",
          "rds:RestoreDBInstanceToPointInTime",
          "rds:RestoreDBInstanceFromDBSnapshot",
          "rds:ModifyDBInstance"
        ]
        Resource = [
          "arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.current.account_id}:db:docsearch-${var.environment}-*",
          "arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.current.account_id}:subgrp:docsearch-${var.environment}-*",
          "arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.current.account_id}:pg:docsearch-${var.environment}-*"
        ]
      },
      {
        Sid    = "KmsDrillPermissions"
        Effect = "Allow"
        Action = [
          "kms:DescribeKey",
          "kms:GenerateDataKey*",
          "kms:Encrypt",
          "kms:Decrypt"
        ]
        Resource = [aws_kms_key.rds.arn]
      },
      {
        Sid    = "SecretsManagerRead"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [aws_secretsmanager_secret.db_credentials.arn]
      }
    ]
  })
}
