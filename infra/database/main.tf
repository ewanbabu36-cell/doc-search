terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region for health data residency (DPDP Act compliance)"
  type        = string
  default     = "ap-south-1" # Mumbai
}

variable "environment" {
  description = "Target deployment environment (production or staging)"
  type        = string
  default     = "production"
}

variable "vpc_id" {
  description = "VPC ID where the database cluster will reside"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs across minimum 2 AZs for Multi-AZ deployment"
  type        = list(string)
}

variable "api_gateway_security_group_id" {
  description = "Security group ID of API Gateway instances allowed to connect to RDS"
  type        = string
}

# ------------------------------------------------------------------------------
# KMS Customer Managed Key (CMK) for Storage Encryption at Rest
# ------------------------------------------------------------------------------
resource "aws_kms_key" "rds" {
  description             = "KMS key for DOC SEARCH RDS storage encryption (AES-256)"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Project     = "DOC_SEARCH"
    Environment = var.environment
    Compliance  = "HIPAA_DISHA_DPDP"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/docsearch-${var.environment}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# ------------------------------------------------------------------------------
# DB Subnet Group (Private Isolated Subnets Across AZs)
# ------------------------------------------------------------------------------
resource "aws_db_subnet_group" "rds" {
  name        = "docsearch-${var.environment}-db-subnets"
  description = "Private database subnets for Multi-AZ DOC SEARCH cluster"
  subnet_ids  = var.private_subnet_ids

  tags = {
    Project     = "DOC_SEARCH"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# Security Group (Least-Privilege Ingress: Port 5432 from API Gateway Only)
# ------------------------------------------------------------------------------
resource "aws_security_group" "rds" {
  name        = "docsearch-${var.environment}-rds-sg"
  description = "Ingress control for DOC SEARCH PostgreSQL cluster"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL TLS connections from API Gateway"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.api_gateway_security_group_id]
  }

  egress {
    description = "No outbound internet access required"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Project     = "DOC_SEARCH"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# AWS Secrets Manager: Dynamic Master Credential Management (Zero Hardcoded PWs)
# ------------------------------------------------------------------------------
resource "random_password" "master_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "docsearch/${var.environment}/database/credentials"
  kms_key_id              = aws_kms_key.rds.arn
  recovery_window_in_days = 7

  tags = {
    Project     = "DOC_SEARCH"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    engine   = "postgres"
    host     = aws_db_instance.primary.address
    port     = 5432
    username = "docsearch_admin"
    password = random_password.master_password.result
    database = "docsearch"
  })
}

# ------------------------------------------------------------------------------
# AWS RDS PostgreSQL Instance (Multi-AZ, 35-Day Retention, Continuous WAL/PITR)
# ------------------------------------------------------------------------------
resource "aws_db_instance" "primary" {
  identifier = "docsearch-${var.environment}-primary"

  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.environment == "production" ? "db.r6g.2xlarge" : "db.t4g.xlarge"

  allocated_storage     = 500
  max_allocated_storage = 3000
  storage_type          = "io2"
  iops                  = 15000
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
  backup_retention_period   = 35 # Minimum 35 continuous days
  backup_window             = "18:30-19:30" # 00:00 - 01:00 IST (Low-traffic window)
  maintenance_window        = "Sun:20:00-Sun:21:00"
  copy_tags_to_snapshot     = true
  deletion_protection       = var.environment == "production" ? true : false
  skip_final_snapshot       = false
  final_snapshot_identifier = "docsearch-${var.environment}-final-snapshot-${formatdate("YYYYMMDDhhmmss", timestamp())}"

  # Network & Configuration Associations
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.pg16.name

  # Monitoring & APM
  monitoring_interval = 30 # Enhanced Monitoring every 30 seconds
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  enabled_cloudwatch_logs_exports = [
    "postgresql",
    "upgrade"
  ]

  auto_minor_version_upgrade = false

  tags = {
    Project     = "DOC_SEARCH"
    Environment = var.environment
    Component   = "PrimaryDatabase"
    RPO_Target  = "5m"
    RTO_Target  = "15m"
  }

  lifecycle {
    ignore_changes = [
      final_snapshot_identifier,
      password
    ]
  }
}

# ------------------------------------------------------------------------------
# IAM Role for Enhanced Monitoring
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

output "db_endpoint" {
  description = "Active cluster endpoint for API Gateway connection pool"
  value       = aws_db_instance.primary.endpoint
}

output "db_arn" {
  description = "ARN of the primary database instance"
  value       = aws_db_instance.primary.arn
}
