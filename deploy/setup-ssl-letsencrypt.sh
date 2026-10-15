#!/usr/bin/env bash
# ==============================================================================
# DocSearch Production SSL/TLS Provisioning with Let's Encrypt & Certbot
# Provisions wildcard or multi-domain certificates and configures automated renewal
# ==============================================================================

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${BLUE}🔒 DOCSEARCH AUTOMATED LET'S ENCRYPT SSL/TLS CERTIFICATE INSTALLER${NC}"
echo -e "${BLUE}======================================================================${NC}\n"

if [[ $EUID -ne 0 ]]; then
  echo -e "${RED}[✘] Error: This script must be run as root (sudo ./setup-ssl-letsencrypt.sh)${NC}"
  exit 1
fi

DOMAIN="${1:-docsearch.in}"
EMAIL="${2:-admin@docsearch.in}"

echo -e "${BLUE}[+] Target Primary Domain: ${GREEN}${DOMAIN}${NC}"
echo -e "${BLUE}[+] Notification Email:    ${GREEN}${EMAIL}${NC}"

# Check Certbot
if ! command -v certbot &> /dev/null; then
  echo -e "${YELLOW}[*] Installing Certbot via snap or apt...${NC}"
  if command -v apt-get &> /dev/null; then
    apt-get update -qq && apt-get install -y -qq certbot
  elif command -v dnf &> /dev/null; then
    dnf install -y certbot
  fi
fi

SSL_CERT_DIR="/opt/docsearch/docker/nginx/ssl"
mkdir -p "${SSL_CERT_DIR}"

echo -e "${BLUE}[+] Requesting certificate from Let's Encrypt via standalone authenticator...${NC}"

# Temporarily stop nginx-ingress container if running to free port 80
docker stop docsearch-nginx-ingress 2>/dev/null || true

certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}" \
  -d "${DOMAIN}" \
  -d "partner.${DOMAIN}" \
  -d "patient.${DOMAIN}" \
  -d "hq.${DOMAIN}" \
  -d "api.${DOMAIN}" \
  -d "pacs.${DOMAIN}" \
  --preferred-challenges http

# Link certificates into nginx mount directory
LIVE_DIR="/etc/letsencrypt/live/${DOMAIN}"
if [[ -d "${LIVE_DIR}" ]]; then
  cp -L "${LIVE_DIR}/fullchain.pem" "${SSL_CERT_DIR}/fullchain.pem"
  cp -L "${LIVE_DIR}/privkey.pem" "${SSL_CERT_DIR}/privkey.pem"
  chmod 600 "${SSL_CERT_DIR}/privkey.pem"
  echo -e "${GREEN}[✔] SSL certificates successfully copied to ${SSL_CERT_DIR}.${NC}"
fi

# Restart nginx ingress
docker start docsearch-nginx-ingress 2>/dev/null || true

# Setup automated renewal cron job
RENEW_CRON="/etc/cron.daily/certbot-renew-docsearch"
cat << 'EOF' > "${RENEW_CRON}"
#!/bin/bash
certbot renew --quiet --deploy-hook "docker exec docsearch-nginx-ingress nginx -s reload"
EOF
chmod +x "${RENEW_CRON}"

echo -e "${GREEN}[✔] Automated daily renewal cron job installed at ${RENEW_CRON}.${NC}"
echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}✅ SSL/TLS ENCRYPTION ACTIVATED FOR ${DOMAIN}!${NC}"
echo -e "${GREEN}======================================================================${NC}\n"
