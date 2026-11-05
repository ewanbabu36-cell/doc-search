# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# CloudWatch Monitoring, Telemetry & SRE/DBRE Incident Alarms
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Centralized SNS Topic for SRE / DBRE Pager Alerts
# ------------------------------------------------------------------------------
resource "aws_sns_topic" "alerts" {
  name = "docsearch-${var.environment}-dbre-alerts"

  tags = {
    Name        = "docsearch-${var.environment}-dbre-alerts"
    Component   = "Observability"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 2. RDS PostgreSQL CloudWatch Alarms
# ------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "db_cpu_high" {
  alarm_name          = "docsearch-${var.environment}-db-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Primary database CPU utilization exceeds 80% for 2 consecutive periods"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "db_memory_low" {
  alarm_name          = "docsearch-${var.environment}-db-memory-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2147483648 # 2 GB in bytes
  alarm_description   = "Primary database freeable memory dropped below 2 GB"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "db_storage_low" {
  alarm_name          = "docsearch-${var.environment}-db-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 53687091200 # 50 GB in bytes
  alarm_description   = "Primary database free storage dropped below 50 GB"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "db_replica_lag" {
  alarm_name          = "docsearch-${var.environment}-db-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 60
  alarm_description   = "Multi-AZ replication lag exceeds 60 seconds (P1 RPO Risk)"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "db_connections_spike" {
  alarm_name          = "docsearch-${var.environment}-db-connections-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 120
  statistic           = "Average"
  threshold           = 800
  alarm_description   = "Database connection count exceeds 800 active sessions"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
}

# ------------------------------------------------------------------------------
# 3. ElastiCache Redis CloudWatch Alarms
# ------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "redis_cpu_high" {
  alarm_name          = "docsearch-${var.environment}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "EngineCPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "Redis Engine CPU utilization exceeds 75%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = "docsearch-${var.environment}-redis-001"
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_memory_high" {
  alarm_name          = "docsearch-${var.environment}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Redis memory usage exceeds 80% threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = "docsearch-${var.environment}-redis-001"
  }
}
