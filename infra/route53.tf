# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# Amazon Route 53 DNS Routing Architecture
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Primary Public Route 53 Hosted Zone
# ------------------------------------------------------------------------------
resource "aws_route53_zone" "primary" {
  name    = var.domain_name
  comment = "DocSearch authoritative public DNS hosted zone"

  tags = {
    Name        = "docsearch-${var.environment}-hosted-zone"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 2. Subdomain Definitions Mapped to Ingress NLB
# ------------------------------------------------------------------------------
locals {
  subdomains = [
    "",        # Apex: docsearch.health
    "api",     # API Gateway: api.docsearch.health
    "partner", # Partner Platform: partner.docsearch.health
    "patient", # Patient Platform: patient.docsearch.health
    "hq",      # Company HQ Platform: hq.docsearch.health
    "pacs"     # Radiology PACS: pacs.docsearch.health
  ]
}

resource "aws_route53_record" "services" {
  for_each = toset(local.subdomains)

  zone_id = aws_route53_zone.primary.zone_id
  name    = each.value == "" ? var.domain_name : "${each.value}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.nlb.dns_name
    zone_id                = aws_lb.nlb.zone_id
    evaluate_target_health = true
  }
}
