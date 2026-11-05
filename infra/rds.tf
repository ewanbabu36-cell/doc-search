# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Amazon RDS PostgreSQL 16 Multi-AZ Architecture
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. DB Subnet Group (Private Isolated Database Subnets Across 3 AZs)
# ------------------------------------------------------------------------------
resource "aws_db_subnet_group" "rds" {
  name        = "docsearch-${var.environment}-db-subnets"
  description = "Private database subnets for Multi-AZ DocSearch PostgreSQL cluster"
  subnet_ids  = aws_subnet.private_db[*].id

  tags = {
    Name = "docsearch-${var.environment}-db-subnets"
  }
}

# ------------------------------------------------------------------------------
# 2. PostgreSQL 16 Parameter Group: Strict TLS & Diagnostic Telemetry
# ------------------------------------------------------------------------------
resource "aws_db_parameter_group" "pg16" {
  name        = "docsearch-${var.environment}-pg16-params"
  family      = "postgres16"
  description = "Hardened security and performance parameters for DocSearch PostgreSQL 16"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "250" # Log queries taking > 250ms for performance audits
  }

  parameter {
    name  = "log_line_prefix"
    value = "%m [%p] %q%u@%d: "
  }

  parameter {
    name  = "idle_in_transaction_session_timeout"
    value = "30000" # 30 seconds
  }

  parameter {
    name  = "statement_timeout"
    value = "60000" # 60 seconds max statement execution
  }

  tags = {
    Name = "docsearch-${var.environment}-pg16-params"
  }
}

# ------------------------------------------------------------------------------
# 3. IAM Role for RDS Enhanced Monitoring
# ------------------------------------------------------------------------------
resource "aws_iam_role" "rds_monitoring" {
  name = "docsearch-${var.environment}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ------------------------------------------------------------------------------
# 4. AWS RDS PostgreSQL Primary Multi-AZ Instance
# ------------------------------------------------------------------------------
resource "aws_db_instance" "primary" {
  identifier = "docsearch-${var.environment}-primary"

  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  iops                  = 3000
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = "docsearch"
  username = "docsearch_admin"
  password = random_password.master_password.result
  port     = 5432

  # High Availability & Disaster Recovery
  multi_az            = true
  publicly_accessible = false

  # Continuous WAL Archiving & Backup Retention
  backup_retention_period   = var.backup_retention_days
  backup_window             = "18:30-19:30" # 00:00 - 01:00 IST (Off-peak)
  maintenance_window        = "Sun:20:00-Sun:21:00"
  copy_tags_to_snapshot     = true
  deletion_protection       = var.environment == "production" ? true : false
  skip_final_snapshot       = var.environment == "production" ? false : true
  final_snapshot_identifier = "docsearch-${var.environment}-final-snapshot"

  # Network & Configuration Associations
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.pg16.name

  # Monitoring & Diagnostic Telemetry
  monitoring_interval = 30
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  enabled_cloudwatch_logs_exports = [
    "postgresql",
    "upgrade"
  ]

  auto_minor_version_upgrade = false

  tags = {
    Name       = "docsearch-${var.environment}-primary-db"
    Component  = "PrimaryDatabase"
    RPO_Target = "5m"
    RTO_Target = "15m"
  }

  lifecycle {
    ignore_changes = [
      final_snapshot_identifier,
      password
    ]
  }
}
