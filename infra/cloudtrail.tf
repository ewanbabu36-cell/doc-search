# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# AWS CloudTrail Multi-Region Audit Logging (DPDP Act & HIPAA Compliance)
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Encrypted S3 Bucket for Multi-Region CloudTrail Audit Logs
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "cloudtrail" {
  bucket_prefix = "docsearch-${var.environment}-cloudtrail-"
  force_destroy = var.environment == "staging" ? true : false

  tags = {
    Name        = "docsearch-${var.environment}-cloudtrail-logs"
    Compliance  = "HIPAA_DISHA_DPDP"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.backup.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/prefix/AWSLogs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# ------------------------------------------------------------------------------
# 2. Multi-Region AWS CloudTrail Trail
# ------------------------------------------------------------------------------
resource "aws_cloudtrail" "main" {
  name                          = "docsearch-${var.environment}-audit-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  s3_key_prefix                 = "prefix"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.backup.arn

  tags = {
    Name        = "docsearch-${var.environment}-audit-trail"
    Environment = var.environment
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}
