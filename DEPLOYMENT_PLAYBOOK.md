# 🏥 DOCSEARCH ENTERPRISE HEALTHCARE PLATFORM - PRODUCTION CLOUD DEPLOYMENT PLAYBOOK

This master operations manual details the exact end-to-end procedure for deploying the **DocSearch 9-Container Production Healthcare Suite** onto any Cloud VPS (AWS EC2, DigitalOcean, Hetzner, Google Cloud, Azure, or On-Premises Linux Server) with automated NGINX Ingress routing, Let's Encrypt SSL/TLS encryption, and GitHub Actions continuous deployment.

---

## 🏗️ 1. ARCHITECTURAL TOPOLOGY OVERVIEW

```mermaid
flowchart TD
    Internet(["🌐 Internet (Users, Modalities, Patients)"]) --> Ingress["🛡️ NGINX Ingress Reverse Proxy (Ports 80 & 443)<br/>SSL Termination, HTTP/2, WebSockets, Rate Limiting"]

    subgraph Internal_Docker_Network ["Docker Internal Network (Bridge / Overlay)"]
        Ingress -->|"/"| LandingPage["🌐 Landing Page (Port 80)<br/>Public Marketing & Discovery"]
        Ingress -->|"/partner/"| PartnerPlatform["🏥 Partner Platform (Port 80)<br/>Hospital ERP & Clinical EMR"]
        Ingress -->|"/patient/"| PatientApp["📱 Aarogya360 App (Port 80)<br/>Patient PWA & Health Locker"]
        Ingress -->|"/hq/"| CompanyPlatform["🏢 Company Platform (Port 80)<br/>SuperAdmin HQ Governance"]
        Ingress -->|"/api/"| ApiGateway["⚡ API Gateway (Port 4000)<br/>Fastify Core Microservices"]
        Ingress -->|"/pacs/"| PacsServer["🩻 Radiology PACS Server (Port 8042)<br/>DICOMweb WADO-RS / QIDO-RS"]

        ApiGateway --> Postgres[("🐘 PostgreSQL 16 (Port 5432)<br/>Row-Level Security, Encrypted DB")]
        ApiGateway --> Redis[("⚡ Redis 7 (Port 6379)<br/>Session Store & Distributed Locks")]
        PacsServer --> Storage[("💾 PACS Storage Vault<br/>DICOM Instances & Lossless PNGs")]
    end

    Modalities["🩻 CT / MRI / X-Ray Consoles"] -->|"DICOM Port 11112 (C-STORE / C-FIND)"| PacsServer
```

---

## 💻 2. SERVER SIZING & HARDWARE REQUIREMENTS

| Resource | Minimum (Small Clinic / Pilot) | Recommended (Multi-Specialty Hospital) | Enterprise Group (500+ Beds) |
|---|---|---|---|
| **CPU** | 2 vCPUs | 4 vCPUs | 8+ vCPUs |
| **RAM** | 4 GB | 8 GB | 16 GB - 32 GB |
| **Disk (NVMe SSD)** | 40 GB | 100 GB | 250 GB - 1 TB |
| **Operating System** | Ubuntu 22.04 / 24.04 LTS | Ubuntu 24.04 LTS (x86_64) | Debian 12 / Rocky Linux 9 |
| **Cloud Provider** | DigitalOcean ($24/mo) | AWS EC2 `t3.xlarge` / `c6i.xlarge` | Hetzner Cloud `CPX41` (€28/mo) |

---

## 🌐 3. DOMAIN & DNS CONFIGURATION

Configure the following **DNS `A` Records** pointing to your Cloud Server Public IPv4 address:

| Host Record | Type | Target | Purpose |
|---|---|---|---|
| `@` (`docsearch.in`) | `A` | `YOUR_SERVER_IP` | Public Marketing & Doctor Discovery |
| `partner` | `A` | `YOUR_SERVER_IP` | Hospital ERP & Doctor Chamber |
| `patient` | `A` | `YOUR_SERVER_IP` | Aarogya360 Mobile Web Application |
| `hq` | `A` | `YOUR_SERVER_IP` | SuperAdmin SaaS Governance Tower |
| `api` | `A` | `YOUR_SERVER_IP` | Backend REST & WebSocket Gateway |
| `pacs` | `A` | `YOUR_SERVER_IP` | Radiology DICOMweb Streaming Hub |

---

## 🚀 4. ONE-COMMAND DEPLOYMENT ON A NEW LINUX VPS

Connect to your Linux server via SSH as `root` (or sudo user):

```bash
ssh root@YOUR_SERVER_IP
```

### Step 4.1: Clone the Repository to `/opt/docsearch`
```bash
git clone https://github.com/ewanbabu36-cell/doc-search.git /opt/docsearch
cd /opt/docsearch
```

### Step 4.2: Configure Production Environment Variables
```bash
cp .env.production.example .env.production
nano .env.production
```
> [!TIP]
> Ensure you update `PRIMARY_DOMAIN=yourdomain.com` and generate cryptographically secure keys:
> - `openssl rand -hex 32` for `JWT_SECRET`
> - `openssl rand -hex 32` for `ENCRYPTION_KEY`

### Step 4.3: Execute the Automated Deployment Script
```bash
chmod +x deploy/*.sh
./deploy/deploy-production.sh
```
The script automatically:
1. Installs Docker and Docker Compose V2 if not present.
2. Tunes Linux kernel socket and memory parameters (`vm.max_map_count=262144`, `somaxconn=4096`).
3. Compiles all 9 production container images in parallel.
4. Performs a zero-downtime rolling restart.
5. Verifies healthcheck endpoints.

---

## 🔒 5. AUTOMATED SSL/TLS CERTIFICATE SETUP (LET'S ENCRYPT)

To issue free, trusted SSL/TLS certificates for all your subdomains with automated 90-day renewal:

```bash
sudo ./deploy/setup-ssl-letsencrypt.sh docsearch.in admin@docsearch.in
```
The installer provisions certificates, mounts them to NGINX, and registers a daily cron job at `/etc/cron.daily/certbot-renew-docsearch` with zero manual maintenance required.

---

## ⚙️ 6. SYSTEMD SERVICE CONFIGURATION (24/7 AUTO-RESTART)

To guarantee the entire 9-container stack starts automatically when the server boots or reboots:

```bash
sudo cp deploy/docsearch.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now docsearch.service
```

Verify service status:
```bash
sudo systemctl status docsearch.service
```

---

## 🤖 7. AUTOMATED GITHUB ACTIONS CI/CD SETUP

Every `git push` to `main` can automatically test and deploy to your cloud server without human intervention.

In your GitHub Repository $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**, add:

| Secret Name | Example Value | Description |
|---|---|---|
| `PROD_HOST` | `159.65.142.88` | Public IP address of your Cloud VPS |
| `PROD_USER` | `root` | SSH user |
| `PROD_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Private SSH key authorized in `/root/.ssh/authorized_keys` |
| `PROD_SSH_PORT` | `22` | SSH port (default 22) |

---

## 🛟 8. MONITORING, LOGS & DISASTER RECOVERY

### 📊 Real-Time Container Monitoring:
```bash
# Check running containers
docker compose ps

# Live resource utilization (CPU, RAM, Network I/O)
docker stats

# Live logs for API Gateway
docker logs -f docsearch-api-gateway

# Live logs for NGINX Ingress
docker logs -f docsearch-nginx-ingress
```

### 🔒 Encrypted Database Backups:
Local encrypted backups are created automatically every 6 hours under `/opt/docsearch/data/backups/encrypted/`.
To manually trigger a backup snapshot:
```bash
node scripts/automated-encrypted-backup-cron.mjs
```

### 🔄 One-Click Stack Rollback / Restart:
```bash
# Hot reload all containers
docker compose restart

# Full graceful restart
docker compose down && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
