# DOC SEARCH — PHASE 9.12 HOSPITAL INFRASTRUCTURE READINESS CHECKLIST

**Document ID:** DOCSEARCH-PHASE9-12-INFRA-001  
**Classification:** On-Premise Hospital Deployment Specification  
**Date:** November 22, 2026  
**Auditor:** Healthcare SRE & Infrastructure Security Auditor  
**Deployment Target:** 50-Bed Secondary Care Facility (Pilot Site Alpha)  
**Hardware Mode:** On-Premise Air-Gapped / Isolated VLAN Server  

---

## 1. INFRASTRUCTURE READINESS OVERVIEW

This checklist outlines the mandatory physical, network, system, and operational requirements for activating DOC SEARCH on-site at the pilot hospital facility. 

In strict adherence to Phase 9.12 Zero-Trust execution rules, items are categorized based on verifiable technical state:
- **`VERIFIED (SOFTWARE/SPEC)`**: Technical capability, configuration template, and software mechanism fully verified in engineering baseline.
- **`PENDING (ON-SITE PHYSICAL)`**: Physical hardware, network cabling, or facility installation awaiting on-site deployment team verification.
- **`BLOCKED`**: Hard impediment preventing deployment (None currently identified).
- **`NOT APPLICABLE`**: Features excluded from the 50-bed on-premise pilot scope.

---

## 2. COMPREHENSIVE INFRASTRUCTURE READINESS MATRIX

| Ref ID | Infrastructure Category | Technical Requirement & Specification | Verification Method | Current Status | Responsible Owner |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **INF-01** | **Dedicated Server Hardware** | Minimum 16 Cores, 64 GB ECC RAM, $2 \times 1\text{ TB}$ NVMe RAID 1 storage array for PostgreSQL 18.4 engine and application daemons. | BIOS / OS Hardware Spec Check | **PENDING (ON-SITE PHYSICAL)** | Hospital IT Lead & Vendor SRE |
| **INF-02** | **Uninterruptible Power (UPS)** | Dedicated 3 kVA online double-conversion UPS with $\ge 60\text{ minutes}$ runtime under full server load, plus DG backup switchover. | Load Bank Disconnect Test | **PENDING (ON-SITE PHYSICAL)** | Hospital Biomedical / Electrical Dept |
| **INF-03** | **Network Isolation (VLAN)** | Isolated `VLAN 40 (HIS-Secure)` with dual-NIC architecture: NIC 1 for internal clinical LAN, NIC 2 strictly for air-gapped backup transfer. | Managed Switch Port Audit & 802.1Q | **PENDING (ON-SITE PHYSICAL)** | Hospital Network Administrator |
| **INF-04** | **Firewall & Ingress Control** | Ingress restricted to ports `443` (HTTPS Partner Portal), `4000` (API Gateway internal), and `5432` (PostgreSQL localhost only). Port `22` / `3389` locked to admin bastion. | Nmap Port Scan & iptables inspection | **VERIFIED (SPEC) / PENDING ON-SITE** | Antigravity DevOps Auditor |
| **INF-05** | **TLS & Cryptographic Transport**| TLS 1.3 encryption with ECDHE-ECDSA-AES256-GCM cipher suite. Internal Enterprise CA certificate installed on hospital clinical workstations. | SSL Labs Local CLI & OpenSSL s_client | **VERIFIED (SOFTWARE) / PENDING CA** | Security Auditor |
| **INF-06** | **Secrets Management** | Production `.env` protected by OS-level file permissions (`0600` root:root). Database password, JWT master secrets, and AES-256 keys segregated. | Environment Security Audit (`p0-audit`)| **VERIFIED (SOFTWARE)** | Senior Backend Engineer |
| **INF-07** | **Operational Monitoring** | Prometheus metrics exporter on `/metrics` and lightweight health check on `/health` (Sub-10ms response). Log rotation via systemd journald. | Automated Health Poller (`start-all.js`)| **VERIFIED (SOFTWARE)** | Platform Architect |
| **INF-08** | **Incident Alerting & Escalation** | Real-time threshold alerts: Memory $> 85\%$, Disk $> 80\%$, API 5xx rate $> 1\%$. Local SMS / Pager gateway alert dispatch to SRE on-call. | Chaos Fault Injection (`phase6-load`)| **VERIFIED (SOFTWARE) / PENDING SMS**| SRE Lead |
| **INF-09** | **Independent Encrypted Backups**| Hourly WAL archiving and daily full snapshot stored on physical external encrypted SSD drive (AES-256-GCM) detached after rotation. | DR Verification Drill (`phase6-backup`)| **VERIFIED (LOCAL) / PENDING DRIVE** | Database Architect |
| **INF-10** | **Restore Rehearsal & Validation** | Scheduled weekly automated cold restore drill into `docsearch_dr_isolated` with automated row count and SHA-256 verification. | Empirical Drill (`phase9_12-dr-drill`)| **VERIFIED (SOFTWARE/DB)** | Database Architect |
| **INF-11** | **Clinical Paper Fallback** | Pre-printed triplicate OPD prescription pads, manual IPD bed boards, and manual lab requisition slips stationed in Emergency & OPD. | Physical Ward Inspection | **PENDING (ON-SITE CLINICAL)** | Hospital Nursing Superintendent |
| **INF-12** | **Rollback & Abort Procedure** | Documented step-by-step rollback protocol (`ANTIGRAVITY_ROLLBACK_RUNBOOK.md`) allowing reversion to paper in $\le 5\text{ minutes}$. | Rehearsal Simulation | **VERIFIED (RUNBOOK)** | Chief Medical Officer |

---

## 3. PHYSICAL DEPLOYMENT TOPOLOGY (ON-PREMISE 50-BED CLINICAL FACILITY)

```
                       ┌────────────────────────────────────────┐
                       │    HOSPITAL CLINICAL CLIENTS (LAN)    │
                       │   OPD / IPD / OT / Lab / Pharmacy      │
                       └───────────────────┬────────────────────┘
                                           │ HTTPS (Port 443 / VLAN 40)
                                           ▼
                       ┌────────────────────────────────────────┐
                       │      LOCAL REVERSE PROXY / NGINX       │
                       │    TLS 1.3 / Enterprise CA Cert        │
                       └───────────────────┬────────────────────┘
                                           │ Loopback (Port 4000)
                                           ▼
                       ┌────────────────────────────────────────┐
                       │      DOC SEARCH API GATEWAY            │
                       │    Fastify / Node.js 20 LTS Engine     │
                       └───────────────────┬────────────────────┘
                                           │ Unix Socket / 127.0.0.1:5432
                                           ▼
                       ┌────────────────────────────────────────┐
                       │      POSTGRESQL 18.4 DATABASE          │
                       │   581 Tables / RLS Enforced Engine     │
                       │   Data Dir: /data/db-native-utf8       │
                       └───────────────────┬────────────────────┘
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │     INDEPENDENT PHYSICAL BACKUP        │
                       │ Dual-Key Encrypted External Drive (USB)│
                       └────────────────────────────────────────┘
```

---

## 4. DEPLOYMENT & ROLLBACK PROTOCOL

### 4.1 Safe Deployment Sequence
1. **Pre-flight Check:** Verify hardware specs, UPS battery charge, and isolated VLAN connectivity.
2. **Cluster Initialization:** Unpack release tarball (`docsearch-v1.0.0-phase9.12.tar.gz`) onto `/opt/docsearch`.
3. **Database Population:** Restore certified baseline schema and synthetic catalogs (`pmjay`, `jan_aushadhi`).
4. **Service Launch:** Execute `node scripts/start-all.js` supervised by systemd.
5. **Readiness Probe:** Verify `curl -f http://127.0.0.1:4000/health` returns HTTP 200 within 500 ms.
6. **Workstation Testing:** Verify browser access from Doctor OPD Room 1 and Nursing Station Alpha.

### 4.2 Emergency Rollback / Paper Fallback Protocol
- **Trigger:** System failure lasting $> 15\text{ minutes}$ or unresolvable clinical data discrepancy.
- **Immediate Action:** Medical Director issues paper fallback declaration.
- **Clinical Transition:** Doctors switch immediately to physical pre-printed triplicate prescription pads.
- **Data Capture:** Nursing staff logs bed admissions on physical register.
- **Post-Recovery Ingestion:** When server is restored, paper records are back-entered into DOC SEARCH under "Retroactive Data Ingestion" workflow.

---

## 5. HARDWARE READINESS SIGN-OFF REQUIREMENT

> [!WARNING]
> Live patient consultation and admission must NOT commence until Hospital IT and the Antigravity Lead Engineer complete the physical on-site verification of items **INF-01**, **INF-02**, and **INF-03**.
