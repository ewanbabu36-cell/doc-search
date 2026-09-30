# ------------------------------------------------------------------------------
# CloudWatch Metrics & Alerting for DOC SEARCH PostgreSQL Infrastructure
# ------------------------------------------------------------------------------

resource "aws_sns_topic" "dbre_alerts" {
  name = "docsearch-${var.environment}-dbre-alerts"

  tags = {
    Project     = "DOC_SEARCH"
    Environment = var.environment
  }
}

# 1. High CPU Utilization Alarm (> 80% for 5 minutes)
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
  alarm_actions       = [aws_sns_topic.dbre_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
}

# 2. Low Freeable Memory Alarm (< 2 GB)
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
  alarm_actions       = [aws_sns_topic.dbre_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
}

# 3. Low Storage Space Alarm (< 50 GB / 10%)
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
  alarm_actions       = [aws_sns_topic.dbre_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
}

# 4. Multi-AZ Replication Lag Alarm (> 60s)
resource "aws_cloudwatch_metric_alarm" "db_replica_lag" {
  alarm_name          = "docsearch-${var.environment}-db-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 60 # 60 seconds
  alarm_description   = "Multi-AZ / Read replica replication lag exceeds 60 seconds (P1 RPO Risk)"
  alarm_actions       = [aws_sns_topic.dbre_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
}

# 5. Database Connection Spike / Exhaustion Alarm
resource "aws_cloudwatch_metric_alarm" "db_connections_spike" {
  alarm_name          = "docsearch-${var.environment}-db-connections-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 120
  statistic           = "Average"
  threshold           = 800 # 80% of max connections
  alarm_description   = "Database connection count exceeds 800 active sessions"
  alarm_actions       = [aws_sns_topic.dbre_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
}
