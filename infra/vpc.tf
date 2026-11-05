# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Multi-AZ VPC Architecture & Subnet Segmentation
# ==============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                        = "docsearch-${var.environment}-vpc"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# ------------------------------------------------------------------------------
# 1. Public Subnets (Ingress Load Balancers, NAT Gateways)
# ------------------------------------------------------------------------------
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 1)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                        = "docsearch-${var.environment}-public-${var.availability_zones[count.index]}"
    Tier                                        = "Public"
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# ------------------------------------------------------------------------------
# 2. Private Application / EKS Worker Subnets (Kubernetes Pods, EFS, Redis)
# ------------------------------------------------------------------------------
resource "aws_subnet" "private_app" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name                                        = "docsearch-${var.environment}-private-app-${var.availability_zones[count.index]}"
    Tier                                        = "PrivateApp"
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# ------------------------------------------------------------------------------
# 3. Private Isolated Database Subnets (RDS PostgreSQL Multi-AZ Cluster)
# Strictly air-gapped from direct internet routes
# ------------------------------------------------------------------------------
resource "aws_subnet" "private_db" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 100)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "docsearch-${var.environment}-private-db-${var.availability_zones[count.index]}"
    Tier = "PrivateDatabase"
  }
}

# ------------------------------------------------------------------------------
# Internet Gateway & NAT Gateways
# ------------------------------------------------------------------------------
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "docsearch-${var.environment}-igw"
  }
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway_per_az ? length(var.availability_zones) : 1
  domain = "vpc"

  tags = {
    Name = "docsearch-${var.environment}-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "nat" {
  count         = var.enable_nat_gateway_per_az ? length(var.availability_zones) : 1
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "docsearch-${var.environment}-nat-gw-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.igw]
}

# ------------------------------------------------------------------------------
# Route Tables & Routing
# ------------------------------------------------------------------------------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "docsearch-${var.environment}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private_app" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.enable_nat_gateway_per_az ? aws_nat_gateway.nat[count.index].id : aws_nat_gateway.nat[0].id
  }

  tags = {
    Name = "docsearch-${var.environment}-private-app-rt-${var.availability_zones[count.index]}"
  }
}

resource "aws_route_table_association" "private_app" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app[count.index].id
}

# Database route table has NO default 0.0.0.0/0 route (isolated)
resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "docsearch-${var.environment}-private-db-rt"
  }
}

resource "aws_route_table_association" "private_db" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private_db.id
}

# ------------------------------------------------------------------------------
# VPC Gateway Endpoint for Amazon S3 (Cost Optimization & Security)
# Eliminates NAT Gateway data transfer fees for DICOM / S3 backups
# ------------------------------------------------------------------------------
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    [aws_route_table.public.id, aws_route_table.private_db.id],
    aws_route_table.private_app[*].id
  )

  tags = {
    Name = "docsearch-${var.environment}-s3-gateway-endpoint"
  }
}
