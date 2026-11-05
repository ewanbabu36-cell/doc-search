# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# AWS Secrets Manager & Dynamic Credential Lifecycle (Zero Hardcoded Secrets)
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Random High-Entropy Password Generation
# ------------------------------------------------------------------------------
resource "random_password" "master_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "jwt_access_secret" {
  length  = 64
  special = false
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = false
}

resource "random_password" "session_encryption_key" {
  length  = 32
  special = false
}

# ------------------------------------------------------------------------------
# 2. Database Master Credentials Secret
# ------------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "docsearch/${var.environment}/database/credentials"
  kms_key_id              = aws_kms_key.rds.arn
  recovery_window_in_days = 7

  tags = {
    Name      = "docsearch-${var.environment}-db-credentials"
    Component = "Database"
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
    url      = "postgresql://docsearch_admin:${random_password.master_password.result}@${aws_db_instance.primary.address}:5432/docsearch?sslmode=require"
  })
}

# ------------------------------------------------------------------------------
# 3. Redis Connection & Auth Token Secret
# ------------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "redis_credentials" {
  name                    = "docsearch/${var.environment}/redis/credentials"
  kms_key_id              = aws_kms_key.storage.arn
  recovery_window_in_days = 7

  tags = {
    Name      = "docsearch-${var.environment}-redis-credentials"
    Component = "Redis"
  }
}

resource "aws_secretsmanager_secret_version" "redis_credentials" {
  secret_id = aws_secretsmanager_secret.redis_credentials.id
  secret_string = jsonencode({
    host       = aws_elasticache_replication_group.redis.primary_endpoint_address
    port       = 6379
    auth_token = random_password.redis_auth_token.result
    tls        = true
    url        = "rediss://:${random_password.redis_auth_token.result}@${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379"
  })
}

# ------------------------------------------------------------------------------
# 4. Application Cryptographic Keys Secret (JWT & Session Encryption)
# ------------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "app_jwt_secrets" {
  name                    = "docsearch/${var.environment}/app/jwt_secrets"
  kms_key_id              = aws_kms_key.rds.arn
  recovery_window_in_days = 7

  tags = {
    Name      = "docsearch-${var.environment}-app-jwt-secrets"
    Component = "ApplicationSecurity"
  }
}

resource "aws_secretsmanager_secret_version" "app_jwt_secrets" {
  secret_id = aws_secretsmanager_secret.app_jwt_secrets.id
  secret_string = jsonencode({
    JWT_ACCESS_SECRET      = random_password.jwt_access_secret.result
    JWT_REFRESH_SECRET     = random_password.jwt_refresh_secret.result
    SESSION_ENCRYPTION_KEY = random_password.session_encryption_key.result
  })
}

# ------------------------------------------------------------------------------
# 5. Payment Gateway Credentials Secret (Razorpay Sandbox/Production)
# ------------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "payment_credentials" {
  name                    = "docsearch/${var.environment}/payment/razorpay"
  kms_key_id              = aws_kms_key.rds.arn
  recovery_window_in_days = 7

  tags = {
    Name      = "docsearch-${var.environment}-payment-credentials"
    Component = "PaymentEscrow"
  }
}

resource "aws_secretsmanager_secret_version" "payment_credentials" {
  secret_id = aws_secretsmanager_secret.payment_credentials.id
  secret_string = jsonencode({
    RAZORPAY_KEY_ID         = "rzp_staging_placeholder"
    RAZORPAY_KEY_SECRET     = "rzp_secret_placeholder"
    RAZORPAY_WEBHOOK_SECRET = "whsec_staging_placeholder"
  })
}
