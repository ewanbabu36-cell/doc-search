# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Amazon EFS Shared Elastic Filesystem for Multi-Replica PACS Storage
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. AWS EFS Filesystem (KMS Encrypted, Elastic Throughput)
# ------------------------------------------------------------------------------
resource "aws_efs_file_system" "pacs" {
  creation_token   = "docsearch-${var.environment}-pacs-efs"
  performance_mode = "generalPurpose"
  throughput_mode  = "elastic"
  encrypted        = true
  kms_key_id       = aws_kms_key.storage.arn

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = {
    Name        = "docsearch-${var.environment}-pacs-efs"
    Component   = "RadiologyPACS"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 2. EFS Mount Targets Across All Private Application Subnets
# ------------------------------------------------------------------------------
resource "aws_efs_mount_target" "pacs" {
  count           = length(var.availability_zones)
  file_system_id  = aws_efs_file_system.pacs.id
  subnet_id       = aws_subnet.private_app[count.index].id
  security_groups = [aws_security_group.efs.id]
}

# ------------------------------------------------------------------------------
# 3. EFS Access Point with POSIX UID/GID 1001 (Non-Root Clinical App User)
# ------------------------------------------------------------------------------
resource "aws_efs_access_point" "pacs" {
  file_system_id = aws_efs_file_system.pacs.id

  posix_user {
    gid = 1001
    uid = 1001
  }

  root_directory {
    path = "/pacs-storage"

    creation_info {
      owner_gid   = 1001
      owner_uid   = 1001
      permissions = "0700"
    }
  }

  tags = {
    Name = "docsearch-${var.environment}-pacs-access-point"
  }
}
