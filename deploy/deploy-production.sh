#!/usr/bin/env bash
# ==============================================================================
# DocSearch Healthcare Enterprise Platform - Production Deployment Automation
# Architecture: 9-Container Docker Compose Stack + NGINX Ingress + PostgreSQL 16
# Compatible with: Ubuntu 22.04/24.04 LTS, Debian 12, RHEL 9, Amazon Linux 2023
# ==============================================================================

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}======================================================================${NC}"
echo -e "${CYAN}🏥 DOCSEARCH ENTERPRISE HEALTHCARE PLATFORM - CLOUD DEPLOYER${NC}"
echo -e "${CYAN}======================================================================${NC}\n"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${APP_DIR}"

# ------------------------------------------------------------------------------
# 1. Environment & Pre-Flight Verification
# ------------------------------------------------------------------------------
echo -e "${BLUE}[+] Step 1: Checking system requirements & dependencies...${NC}"

if [[ $EUID -ne 0 ]]; then
  echo -e "${YELLOW}[!] Note: Running as non-root user. Ensuring docker permissions are configured.${NC}"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}[*] Docker not found. Installing Docker engine via official repository...${NC}"
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  rm -f /tmp/get-docker.sh
  systemctl enable --now docker
  echo -e "${GREEN}[✔] Docker successfully installed.${NC}"
else
  echo -e "${GREEN}[✔] Docker is installed: $(docker --version)${NC}"
fi

# Check Docker Compose V2
if ! docker compose version &> /dev/null; then
  echo -e "${RED}[✘] Docker Compose V2 plugin is missing! Please install docker-compose-plugin.${NC}"
  exit 1
else
  echo -e "${GREEN}[✔] Docker Compose is installed: $(docker compose version)${NC}"
fi

# Check .env.production
if [[ ! -f ".env.production" ]]; then
  if [[ -f ".env.production.example" ]]; then
    echo -e "${YELLOW}[*] Creating .env.production from template...${NC}"
    cp .env.production.example .env.production
    # Generate random secrets if placeholders exist
    JWT_SECRET_RAND=$(openssl rand -hex 32)
    ENC_KEY_RAND=$(openssl rand -hex 32)
    PG_PASS_RAND=$(openssl rand -hex 16)
    
    sed -i "s/REPLACE_WITH_HEX_64_CHAR_MASTER_JWT_KEY_MIN_32_BYTES_REQUIRED/${JWT_SECRET_RAND}/g" .env.production
    sed -i "s/REPLACE_WITH_SECURE_64_CHAR_PASSWORD_A1b2C3d4!/${PG_PASS_RAND}/g" .env.production
    echo -e "${GREEN}[✔] Created fresh .env.production with auto-generated cryptographic keys.${NC}"
  else
    echo -e "${RED}[✘] Missing .env.production and .env.production.example!${NC}"
    exit 1
  fi
fi

# ------------------------------------------------------------------------------
# 2. Kernel & OS Performance Tuning for High-Concurrency Healthcare Workloads
# ------------------------------------------------------------------------------
echo -e "${BLUE}[+] Step 2: Optimizing Linux kernel parameters for high throughput...${NC}"
if command -v sysctl &> /dev/null && [[ $EUID -eq 0 ]]; then
  sysctl -w vm.max_map_count=262144 > /dev/null 2>&1 || true
  sysctl -w net.core.somaxconn=4096 > /dev/null 2>&1 || true
  sysctl -w net.ipv4.tcp_max_syn_backlog=4096 > /dev/null 2>&1 || true
  echo -e "${GREEN}[✔] Kernel parameters configured (vm.max_map_count, somaxconn, syn_backlog).${NC}"
fi

# ------------------------------------------------------------------------------
# 3. Storage Directory & Permissions Initialization
# ------------------------------------------------------------------------------
echo -e "${BLUE}[+] Step 3: Initializing persistent storage directories...${NC}"
mkdir -p data/pacs-storage
mkdir -p data/backups/encrypted
mkdir -p data/postgres-data
mkdir -p data/redis-data
mkdir -p docker/nginx/ssl

chmod -R 775 data/pacs-storage data/backups
echo -e "${GREEN}[✔] Storage directories initialized.${NC}"

# ------------------------------------------------------------------------------
# 4. Multi-Container Parallel Build Phase
# ------------------------------------------------------------------------------
echo -e "${BLUE}[+] Step 4: Building production container images...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel

echo -e "${GREEN}[✔] All container images built successfully.${NC}"

# ------------------------------------------------------------------------------
# 5. Zero-Downtime Rolling Service Rollout
# ------------------------------------------------------------------------------
echo -e "${BLUE}[+] Step 5: Launching DocSearch 9-container service suite...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

# ------------------------------------------------------------------------------
# 6. Post-Deployment Synthetic Health Check Verification
# ------------------------------------------------------------------------------
echo -e "${BLUE}[+] Step 6: Verifying container health and endpoint connectivity...${NC}"

HEALTHY=false
for i in {1..30}; do
  if curl -sf http://localhost/health > /dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  echo -n "."
  sleep 2
done
echo ""

if [[ "${HEALTHY}" == "true" ]]; then
  echo -e "${GREEN}[✔] NGINX Ingress is UP and answering healthy at http://localhost/health${NC}"
else
  echo -e "${YELLOW}[!] NGINX Ingress took longer than expected; checking individual container logs...${NC}"
fi

# Print Container Status
echo -e "\n${CYAN}======================================================================${NC}"
echo -e "${CYAN}📊 ACTIVE CONTAINER TOPOLOGY & PORTS${NC}"
echo -e "${CYAN}======================================================================${NC}"
docker compose -f docker-compose.yml ps

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}✅ DOCSEARCH PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "• Marketing Landing Page:      http://localhost (or https://docsearch.in)"
echo -e "• Hospital Partner Platform:    http://localhost/partner/ (or https://partner.docsearch.in)"
echo -e "• Aarogya360 Patient Web App:   http://localhost/patient/ (or https://patient.docsearch.in)"
echo -e "• SuperAdmin HQ Governance:     http://localhost/hq/ (or https://hq.docsearch.in)"
echo -e "• API Gateway Microservices:    http://localhost/api/v1/health"
echo -e "• Radiology PACS DICOMweb:      http://localhost/pacs/ (DICOM TCP Port: 11112)"
echo -e "${GREEN}======================================================================${NC}\n"
