# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Infrastructure Outputs
# ==============================================================================

output "vpc_id" {
  description = "Identifier of the dedicated DocSearch VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Identifiers of public subnets across Availability Zones"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "Identifiers of private application subnets (EKS, Redis, EFS)"
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "Identifiers of isolated private database subnets (RDS)"
  value       = aws_subnet.private_db[*].id
}

output "eks_cluster_name" {
  description = "Name of the EKS Kubernetes cluster"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint URL for Amazon EKS control plane API"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_oidc_issuer_url" {
  description = "OpenID Connect issuer URL for IRSA identity federation"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "eks_oidc_provider_arn" {
  description = "ARN of the IAM OIDC Provider for ServiceAccount role binding"
  value       = aws_iam_openid_connect_provider.oidc.arn
}

output "rds_endpoint" {
  description = "Address endpoint for primary PostgreSQL Multi-AZ cluster"
  value       = aws_db_instance.primary.endpoint
}

output "rds_database_name" {
  description = "PostgreSQL primary database name"
  value       = aws_db_instance.primary.db_name
}

output "redis_primary_endpoint" {
  description = "Primary endpoint address for ElastiCache Redis replication group"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  description = "Port number for Redis connections"
  value       = aws_elasticache_replication_group.redis.port
}

output "efs_filesystem_id" {
  description = "Identifier of the AWS EFS filesystem for PACS storage"
  value       = aws_efs_file_system.pacs.id
}

output "efs_access_point_id" {
  description = "Identifier of the EFS Access Point for non-root clinical pods"
  value       = aws_efs_access_point.pacs.id
}

output "nlb_dns_name" {
  description = "Public DNS name of the Ingress Network Load Balancer"
  value       = aws_lb.nlb.dns_name
}

output "nlb_zone_id" {
  description = "Hosted zone ID of the Ingress Network Load Balancer"
  value       = aws_lb.nlb.zone_id
}

output "route53_zone_id" {
  description = "Route 53 hosted zone identifier for docsearch.health"
  value       = aws_route53_zone.primary.zone_id
}

output "secrets_manager_db_secret_arn" {
  description = "ARN of Secrets Manager secret for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "secrets_manager_redis_secret_arn" {
  description = "ARN of Secrets Manager secret for Redis credentials"
  value       = aws_secretsmanager_secret.redis_credentials.arn
}

output "secrets_manager_jwt_secret_arn" {
  description = "ARN of Secrets Manager secret for application JWT keys"
  value       = aws_secretsmanager_secret.app_jwt_secrets.arn
}

output "secrets_manager_payment_secret_arn" {
  description = "ARN of Secrets Manager secret for payment gateway credentials"
  value       = aws_secretsmanager_secret.payment_credentials.arn
}
