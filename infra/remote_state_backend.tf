# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Terraform Remote State Storage & DynamoDB Distributed Locking
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. S3 Bucket for Terraform Remote State with Versioning & KMS SSE
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "terraform_state" {
  bucket_prefix = "docsearch-${var.environment}-tfstate-"
  force_destroy = var.environment == "staging" ? true : false

  tags = {
    Name        = "docsearch-${var.environment}-tfstate-bucket"
    Component   = "TerraformBackend"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.backup.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ------------------------------------------------------------------------------
# 2. DynamoDB Table for Terraform Distributed State Locking
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "docsearch-${var.environment}-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.backup.arn
  }

  tags = {
    Name        = "docsearch-${var.environment}-terraform-locks"
    Component   = "TerraformBackend"
    Environment = var.environment
  }
}
