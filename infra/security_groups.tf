# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Security Groups & Zero-Trust Tiered Access Control
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Network Load Balancer (NLB) Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "nlb" {
  name        = "docsearch-${var.environment}-nlb-sg"
  description = "Public ingress controls for DocSearch Ingress NLB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Public HTTPS ingress"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Public HTTP ingress (redirected to HTTPS / ACME challenges)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Forward to EKS worker nodes"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name = "docsearch-${var.environment}-nlb-sg"
  }
}

# ------------------------------------------------------------------------------
# 2. EKS Cluster Control Plane Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "eks_cluster" {
  name        = "docsearch-${var.environment}-eks-cluster-sg"
  description = "Communication between EKS control plane and worker nodes"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Outbound communication to nodes"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "docsearch-${var.environment}-eks-cluster-sg"
  }
}

# ------------------------------------------------------------------------------
# 3. EKS Worker Nodes Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "eks_nodes" {
  name        = "docsearch-${var.environment}-eks-nodes-sg"
  description = "Security group for all EKS managed worker nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow nodes to communicate with each other"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  ingress {
    description     = "Allow control plane to communicate with worker nodes"
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  ingress {
    description     = "Allow NLB forwarding to ingress-nginx HTTPS NodePort"
    from_port       = 30443
    to_port         = 30443
    protocol        = "tcp"
    security_groups = [aws_security_group.nlb.id]
  }

  ingress {
    description     = "Allow NLB forwarding to ingress-nginx HTTP NodePort"
    from_port       = 30080
    to_port         = 30080
    protocol        = "tcp"
    security_groups = [aws_security_group.nlb.id]
  }

  egress {
    description = "Allow worker nodes outbound internet access via NAT Gateway"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name                                        = "docsearch-${var.environment}-eks-nodes-sg"
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
  }
}

# Allow control plane to communicate with kubelet on nodes
resource "aws_security_group_rule" "cluster_to_node_kubelet" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.eks_nodes.id
  description              = "Allow pods to communicate with the cluster API Server"
}

# ------------------------------------------------------------------------------
# 4. RDS PostgreSQL Database Security Group (Private Tier)
# Ingress restricted strictly to EKS worker nodes on port 5432
# ------------------------------------------------------------------------------
resource "aws_security_group" "rds" {
  name        = "docsearch-${var.environment}-rds-sg"
  description = "Strict least-privilege ingress for PostgreSQL cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL TLS connections from EKS worker nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  egress {
    description = "No outbound internet access permitted"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "docsearch-${var.environment}-rds-sg"
  }
}

# ------------------------------------------------------------------------------
# 5. ElastiCache Redis Security Group (Private Tier)
# Ingress restricted strictly to EKS worker nodes on port 6379
# ------------------------------------------------------------------------------
resource "aws_security_group" "redis" {
  name        = "docsearch-${var.environment}-redis-sg"
  description = "Strict least-privilege ingress for Redis cache & queues"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis TLS connections from EKS worker nodes"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  egress {
    description = "No outbound internet access permitted"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "docsearch-${var.environment}-redis-sg"
  }
}

# ------------------------------------------------------------------------------
# 6. AWS EFS Security Group (Private Shared PACS Storage Tier)
# Ingress restricted strictly to EKS worker nodes on port 2049 (NFS)
# ------------------------------------------------------------------------------
resource "aws_security_group" "efs" {
  name        = "docsearch-${var.environment}-efs-sg"
  description = "Strict least-privilege ingress for EFS shared PACS storage"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "NFS connections from EKS worker nodes"
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  egress {
    description = "No outbound internet access permitted"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "docsearch-${var.environment}-efs-sg"
  }
}
