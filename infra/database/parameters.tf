# ------------------------------------------------------------------------------
# PostgreSQL 16 Parameter Group: Strict TLS Enforcement & Auditing
# ------------------------------------------------------------------------------
resource "aws_db_parameter_group" "pg16" {
  name        = "docsearch-${var.environment}-pg16-params"
  family      = "postgres16"
  description = "Hardened security & performance parameters for DOC SEARCH PostgreSQL 16"

  # Enforce TLS 1.3 / 1.2 on all client connections (rejects plaintext)
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  # Connection Management & Slow Query Telemetry
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

  # Mitigate connection hoarding and abandoned transactions
  parameter {
    name  = "idle_in_transaction_session_timeout"
    value = "30000" # 30 seconds
  }

  parameter {
    name  = "statement_timeout"
    value = "60000" # 60 seconds max statement execution
  }

  tags = {
    Project     = "DOC_SEARCH"
    Environment = var.environment
  }
}
