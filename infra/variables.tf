# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Input Variables
# ==============================================================================

variable "offline_validation" {
  description = "Flag enabling mock provider settings for offline validation and planning without AWS credentials"
  type        = bool
  default     = true
}

variable "aws_region" {
  description = "Primary AWS region for health data residency under India DPDP Act and DISHA"
  type        = string
  default     = "ap-south-1" # Mumbai
}

variable "dr_region" {
  description = "Disaster recovery secondary AWS region for cross-region immutable backups"
  type        = string
  default     = "ap-south-2" # Hyderabad
}

variable "environment" {
  description = "Deployment environment profile (staging or production)"
  type        = string
  default     = "staging"
}

variable "vpc_cidr" {
  description = "IPv4 CIDR block for the dedicated DocSearch VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Target AWS Availability Zones for Multi-AZ resilience"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}

variable "cluster_name" {
  description = "Identifier for the Amazon EKS managed Kubernetes cluster"
  type        = string
  default     = "docsearch-staging-eks"
}

variable "kubernetes_version" {
  description = "Target Kubernetes minor version conforming to validated manifest schemas"
  type        = string
  default     = "1.30"
}

variable "domain_name" {
  description = "Primary apex domain for DocSearch platform routing"
  type        = string
  default     = "docsearch.health"
}

variable "enable_nat_gateway_per_az" {
  description = "Whether to provision a NAT Gateway per AZ (true for production, false for staging cost optimization)"
  type        = bool
  default     = false
}

variable "eks_instance_types" {
  description = "EC2 instance types for EKS managed node group (Graviton3 ARM for optimal price-performance)"
  type        = list(string)
  default     = ["t4g.xlarge"]
}

variable "eks_node_min_size" {
  description = "Minimum node count for EKS managed worker group"
  type        = number
  default     = 3
}

variable "eks_node_desired_size" {
  description = "Desired baseline node count across Availability Zones"
  type        = number
  default     = 3
}

variable "eks_node_max_size" {
  description = "Maximum burst node capacity for HPA cluster autoscaler"
  type        = number
  default     = 10
}

variable "db_instance_class" {
  description = "RDS PostgreSQL compute class (Graviton ARM db.t4g.xlarge for staging, db.r6g.2xlarge for prod)"
  type        = string
  default     = "db.t4g.xlarge"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage in GiB for PostgreSQL"
  type        = number
  default     = 500
}

variable "db_max_allocated_storage" {
  description = "Autoscaling storage threshold in GiB for PostgreSQL"
  type        = number
  default     = 3000
}

variable "redis_node_type" {
  description = "ElastiCache Redis node class (cache.t4g.medium for staging, cache.r6g.large for prod)"
  type        = string
  default     = "cache.t4g.medium"
}

variable "backup_retention_days" {
  description = "Continuous WAL and immutable backup retention period in days (statutory minimum 35 days)"
  type        = number
  default     = 35
}
