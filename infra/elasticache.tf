# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Amazon ElastiCache Redis 7.2 Multi-AZ Replication Group
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. ElastiCache Subnet Group (Private Application Subnets Across 3 AZs)
# ------------------------------------------------------------------------------
resource "aws_elasticache_subnet_group" "redis" {
  name        = "docsearch-${var.environment}-redis-subnet-group"
  description = "Private application subnets for Multi-AZ Redis replication group"
  subnet_ids  = aws_subnet.private_app[*].id

  tags = {
    Name = "docsearch-${var.environment}-redis-subnet-group"
  }
}

# ------------------------------------------------------------------------------
# 2. Redis 7 Parameter Group: Eviction Policy Safeguards
# ------------------------------------------------------------------------------
resource "aws_elasticache_parameter_group" "redis7" {
  name        = "docsearch-${var.environment}-redis7-params"
  family      = "redis7"
  description = "Hardened parameter group for DocSearch Redis 7 cluster"

  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru" # Protect persistent keys, evict expired TTL items
  }

  tags = {
    Name = "docsearch-${var.environment}-redis7-params"
  }
}

# ------------------------------------------------------------------------------
# 3. Secure Auth Token Generation (Zero Hardcoded Secrets)
# ------------------------------------------------------------------------------
resource "random_password" "redis_auth_token" {
  length  = 32
  special = false
}

# ------------------------------------------------------------------------------
# 4. Multi-AZ Redis Replication Group with Automatic Failover & In-Transit TLS
# ------------------------------------------------------------------------------
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "docsearch-${var.environment}-redis"
  description          = "DocSearch Multi-AZ Redis cluster for caching, rate limiting & queues"
  node_type            = var.redis_node_type
  engine               = "redis"
  engine_version       = "7.1"
  port                 = 6379

  parameter_group_name = aws_elasticache_parameter_group.redis7.name
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]

  # High Availability across AZs
  automatic_failover_enabled = true
  multi_az_enabled           = true
  num_cache_clusters         = 2 # 1 Primary + 1 Replica

  # Encryption In-Transit & At-Rest
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result
  at_rest_encryption_enabled = true
  kms_key_id                 = aws_kms_key.storage.arn

  # Backup & Maintenance Windows
  snapshot_retention_limit = 7
  snapshot_window          = "19:30-20:30"
  maintenance_window       = "sun:21:00-sun:22:00"

  tags = {
    Name        = "docsearch-${var.environment}-redis"
    Component   = "CacheAndQueue"
    Environment = var.environment
  }
}
