# ==============================================================================
# DOC SEARCH AWS ENTERPRISE CLOUD INFRASTRUCTURE
# AWS Network Load Balancer (NLB) & Ingress Routing
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Multi-AZ Public Network Load Balancer (NLB)
# ------------------------------------------------------------------------------
resource "aws_lb" "nlb" {
  name                             = "docsearch-${var.environment}-nlb"
  internal                         = false
  load_balancer_type               = "network"
  subnets                          = aws_subnet.public[*].id
  enable_cross_zone_load_balancing = true
  security_groups                  = [aws_security_group.nlb.id]

  tags = {
    Name        = "docsearch-${var.environment}-nlb"
    Component   = "EdgeIngress"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 2. Target Group for HTTPS Traffic (Forwarding to ingress-nginx NodePort 30443)
# ------------------------------------------------------------------------------
resource "aws_lb_target_group" "https" {
  name        = "docsearch-${var.environment}-tg-443"
  port        = 30443
  protocol    = "TCP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    protocol            = "TCP"
    port                = "30443"
    interval            = 10
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "docsearch-${var.environment}-tg-443"
  }
}

# ------------------------------------------------------------------------------
# 3. Target Group for HTTP Traffic (Forwarding to ingress-nginx NodePort 30080)
# ------------------------------------------------------------------------------
resource "aws_lb_target_group" "http" {
  name        = "docsearch-${var.environment}-tg-80"
  port        = 30080
  protocol    = "TCP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    protocol            = "TCP"
    port                = "30080"
    interval            = 10
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "docsearch-${var.environment}-tg-80"
  }
}

# ------------------------------------------------------------------------------
# 4. Listeners for Port 443 and Port 80
# ------------------------------------------------------------------------------
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.nlb.arn
  port              = 443
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.https.arn
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.nlb.arn
  port              = 80
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.http.arn
  }
}
