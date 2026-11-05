# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Amazon EKS Multi-AZ Cluster & Managed Graviton Worker Node Groups
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. EKS Cluster IAM Role (Least Privilege)
# ------------------------------------------------------------------------------
resource "aws_iam_role" "eks_cluster" {
  name = "docsearch-${var.environment}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# ------------------------------------------------------------------------------
# 2. Amazon EKS Cluster Control Plane (Multi-AZ)
# ------------------------------------------------------------------------------
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  version  = var.kubernetes_version
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids              = aws_subnet.private_app[*].id
    security_group_ids      = [aws_security_group.eks_cluster.id]
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  # Envelope encryption for Kubernetes Secrets using dedicated KMS CMK
  encryption_config {
    provider {
      key_arn = aws_kms_key.eks_secrets.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]

  tags = {
    Name = var.cluster_name
  }
}

# ------------------------------------------------------------------------------
# 3. EKS Worker Nodes IAM Role
# ------------------------------------------------------------------------------
resource "aws_iam_role" "eks_nodes" {
  name = "docsearch-${var.environment}-eks-nodes-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "eks_ecr_read_only" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# ------------------------------------------------------------------------------
# 4. EC2 Launch Template (IMDSv2 & Encrypted Root Volume Hardening)
# ------------------------------------------------------------------------------
resource "aws_launch_template" "eks_nodes" {
  name_prefix   = "docsearch-${var.environment}-node-"
  description   = "Security hardened launch template for DocSearch EKS worker nodes"
  instance_type = var.eks_instance_types[0]

  # Enforce IMDSv2 to prevent SSRF credential theft
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 80
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
      encrypted             = true
      kms_key_id            = aws_kms_key.storage.arn
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name                                        = "docsearch-${var.environment}-worker"
      "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    }
  }
}

# ------------------------------------------------------------------------------
# 5. EKS Managed Node Group (Private Subnets Across AZs)
# ------------------------------------------------------------------------------
resource "aws_eks_node_group" "nodes" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "docsearch-${var.environment}-managed-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private_app[*].id

  scaling_config {
    min_size     = var.eks_node_min_size
    desired_size = var.eks_node_desired_size
    max_size     = var.eks_node_max_size
  }

  launch_template {
    id      = aws_launch_template.eks_nodes.id
    version = "$Latest"
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_ecr_read_only
  ]

  tags = {
    Name = "docsearch-${var.environment}-managed-nodes"
  }
}

# ------------------------------------------------------------------------------
# 6. IAM OIDC Identity Provider for IRSA (IAM Roles for Service Accounts)
# ------------------------------------------------------------------------------
resource "aws_iam_openid_connect_provider" "oidc" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"] # Standard AWS EKS root CA thumbprint
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
}
