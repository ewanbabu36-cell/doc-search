# DOC SEARCH — PHASE 9.12 STORAGE AUDIT & CLEANUP DRY-RUN REPORT

**Document ID:** DOCSEARCH-PHASE9-12-CLN-001  
**Classification:** Safe Storage Audit & Non-Destructive Cleanup Protocol  
**Date:** November 22, 2026  
**Auditor:** Infrastructure & Security Compliance Auditor  
**Audit Target:** `D:\DOC SEARCH` Monorepo Root  
**Execution Mode:** **DRY-RUN ONLY (ZERO DELETIONS EXECUTED)**  

---

## 1. REPRODUCIBLE STORAGE MEASUREMENT SUMMARY

A recursive filesystem inspection using Node.js filesystem APIs was executed across `D:\DOC SEARCH`:

$$\text{Total Directory Footprint} = 7,086.47\text{ MB (Uncompressed)} \quad | \quad \text{Total Discovered Items} = 317,729$$
$$\text{Windows File Explorer Properties Summary} = 1.18\text{ GB (1,270,982,483 bytes)} \quad | \quad 53,221\text{ Files}, 5,605\text{ Folders}$$

> [!NOTE]
> **Explaining the Explorer vs Script Variance:** Windows Explorer properties calculates disk space excluding pnpm virtual hardlink allocations, reporting 1.18 GB and 53k files. A recursive deep traversal traverses all hardlinks within `.pnpm`, measuring 7.08 GB. Both measurements reflect an enterprise monorepo in a healthy, compact operational state.

---

## 2. DETAILED DIRECTORY FOOTPRINT & INVENTORY BREAKDOWN

| Target Directory / Entity | Measured Size | Items / Files | Git Tracked? | In-Use by Running Process? | Retention Classification | Rationale |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **`node_modules` (Root & Apps)** | 4,006.60 MB | 208,217 | No | **YES (`node start-all.js`)** | **RETAIN_RUNTIME** | Essential for running Fastify API Gateway and React platforms. Deletion saves space but breaks running server. |
| **`data/db-native-utf8`** | **425.55 MB** | 15,012 | No | **YES (PostgreSQL 18.4 Engine)** | ⚠️ **DO NOT DELETE (CRITICAL)** | **PostgreSQL Cluster Data Directory.** Contains all 581 tables and live clinical data. Deletion destroys database. |
| **`data/backups`** | **15.67 MB** | 17 | Yes | No | ⚠️ **DO NOT DELETE (PERMANENT)** | Verified disaster recovery backups, WAL segments, and encrypted snapshot files. |
| **`.git`** | 89.27 MB | 8,898 | No | No | ⚠️ **DO NOT DELETE (PERMANENT)** | Complete Git history, certified tags, and audit commit log. |
| **`apps/` (Source Code)** | 64.40 MB | 3,827 | Yes | Yes (Source files) | ⚠️ **DO NOT DELETE (SOURCE)** | Primary healthcare frontend and backend application source code. |
| **`packages/` (Shared Libs)** | 28.50 MB | 1,245 | Yes | Yes (Database schema) | ⚠️ **DO NOT DELETE (SOURCE)** | Shared database schemas, auth modules, and API contracts. |
| **`apps/api-gateway/dist`** | 12.43 MB | 1,308 | No | **YES (API Gateway Daemon)** | **RETAIN_WHILE_PROCESS_RUNS** | Required by currently running Node process. Regenerable via `pnpm build`. |
| **`apps/partner-platform/dist`** | 8.58 MB | 159 | No | No | **SAFE_PURGE_REGENERABLE** | Static web bundle. Regenerable via `pnpm build`. |
| **`apps/partner-platform/dev-dist`**| 0.35 MB | 4 | No | No | **SAFE_PURGE_REGENERABLE** | Vite dev cache. Regenerable. |
| **`.turbo`** | 0.00 MB | 0 | No | No | **SAFE_PURGE_REGENERABLE** | Turborepo cache directory. |
| **`audit-results`** | 1.58 MB | 6 | Yes | No | **SAFE_PURGE_REGENERABLE** | Raw JSON test execution logs from earlier audit phases. |
| **`scratch`** | 1.33 MB | 286 | No | No | **ARCHIVE_OR_PURGE** | Temporary inspection scripts. |
| **`patient_app_*.png` (4 files)** | 0.42 MB | 4 | Yes | No | **QUARANTINE_TO_DOCS** | Loose UI test captures in repository root. Should be moved to `docs/images/`. |
| **`r.json...` / `r.text...` (3 files)**| 0.00 MB | 3 | Yes | No | **SAFE_DELETE_IMMEDIATE** | Accidental terminal redirection artifacts created during broken CLI commands. |

---

## 3. PROPOSED SAFE CLEANUP MANIFEST (DRY-RUN)

The following 12 items have been identified as completely safe for cleanup or relocation. **NO FILES HAVE BEEN DELETED DURING THIS AUDIT**:

| Cleanup Target Path | File / Folder Type | Size on Disk | Git Status | Reclaimable Space | Recommended Action |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `r.json()).then(console.log)` | File | 0 bytes | Tracked | 0 KB | `git rm` (Immediate deletion) |
| `r.json()).then(console.log).catch(console.error)` | File | 0 bytes | Tracked | 0 KB | `git rm` (Immediate deletion) |
| `r.text()).then(console.log).catch(console.error)` | File | 0 bytes | Tracked | 0 KB | `git rm` (Immediate deletion) |
| `patient_app_abha_card_modal.png` | File | 113.65 KB | Tracked | 114 KB | Move to `docs/assets/patient_app_abha_card_modal.png` |
| `patient_app_benchmark_home.png` | File | 93.59 KB | Tracked | 94 KB | Move to `docs/assets/patient_app_benchmark_home.png` |
| `patient_app_home_lab_modal.png` | File | 113.60 KB | Tracked | 114 KB | Move to `docs/assets/patient_app_home_lab_modal.png` |
| `patient_app_tata1mg_modal.png` | File | 112.63 KB | Tracked | 113 KB | Move to `docs/assets/patient_app_tata1mg_modal.png` |
| `apps/partner-platform/dist/` | Directory | 8.58 MB | Untracked | 8.58 MB | Remove (Regenerable via `pnpm build`) |
| `apps/partner-platform/dev-dist/` | Directory | 0.35 MB | Untracked | 350 KB | Remove (Regenerable) |
| `.turbo/` | Directory | 0 bytes | Untracked | 0 KB | Remove (Regenerable cache) |
| `audit-results/` | Directory | 1.58 MB | Tracked | 1.58 MB | Archive to `docs/archive/audit-results/` |
| `scratch/` | Directory | 1.33 MB | Untracked | 1.33 MB | Remove temporary audit scripts |
| **TOTAL RECLAIMABLE SPACE** | — | — | — | **~12.26 MB & Clean Root** | — |

---

## 4. STRICT SAFETY RULES FOR EXECUTION

1. **Explicit Approval Required:** In accordance with Task 5 Rule 7, no destructive cleanup command (`rm`, `git rm`, `rmdir`) will be executed until the user explicitly approves this manifest.
2. **Database Protection:** `data/db-native-utf8` must remain permanently excluded from all automated and manual cleanup scripts.
3. **Backup Protection:** `data/backups/` and encryption keys must never be moved, scrubbed, or purged.
4. **Quarantine Over Deletion:** Test screenshots (`patient_app_*.png`) and audit results (`audit-results/`) will be moved into `docs/` rather than permanently destroyed, preserving evidence auditability.
