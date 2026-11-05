# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Terraform Configuration & Provider Definitions
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Remote state backend configuration for AWS S3 + DynamoDB locking
  # Uncomment in active cloud environment with provisioned state storage
  # backend "s3" {
  #   bucket         = "docsearch-terraform-state-ap-south-1"
  #   key            = "infrastructure/terraform.tfstate"
  #   region         = "ap-south-1"
  #   encrypt        = true
  #   kms_key_id     = "alias/docsearch-terraform-state-key"
  #   dynamodb_table = "docsearch-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  skip_credentials_validation = var.offline_validation
  skip_requesting_account_id  = var.offline_validation
  skip_metadata_api_check     = var.offline_validation
  access_key                  = var.offline_validation ? "mock_key" : null
  secret_key                  = var.offline_validation ? "mock_secret" : null

  default_tags {
    tags = {
      Project     = "DOC_SEARCH"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Compliance  = "HIPAA_DISHA_DPDP"
    }
  }
}

provider "aws" {
  alias  = "dr"
  region = var.dr_region

  skip_credentials_validation = var.offline_validation
  skip_requesting_account_id  = var.offline_validation
  skip_metadata_api_check     = var.offline_validation
  access_key                  = var.offline_validation ? "mock_key" : null
  secret_key                  = var.offline_validation ? "mock_secret" : null

  default_tags {
    tags = {
      Project     = "DOC_SEARCH"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Role        = "DisasterRecovery"
    }
  }
}
