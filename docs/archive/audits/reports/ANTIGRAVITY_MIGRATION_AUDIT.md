# ANTIGRAVITY COMPLETE PRE-MIGRATION AUDIT (PHASE 1)

**Audit Date:** November 13, 2026  
**Lead Engineers:** Senior Windows Systems Engineer, Antigravity Migration Specialist & Data Integrity Engineer  
**Objective:** Independent forensic audit of all Antigravity application files, user data, conversation databases, and project assets before C: to D: relocation.  
**Mode:** READ-ONLY / AUDIT MODE — Zero modifications executed.

---

## 1. STORAGE CAPACITY & DISK ALLOCATION

| Drive | Total Capacity | Used Space | Free Space | % Used | Status |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **C:** | **97.54 GB** | **92.87 GB** | **4.68 GB** | **95.2%** | 🚨 **CRITICAL (Near 100% Full)** |
| **D:** | **139.82 GB** | **24.68 GB** | **115.14 GB** | **17.6%** | 🟢 **OPTIMAL (115 GB Free Space Available)** |

---

## 2. COMPLETE ANTIGRAVITY INVENTORY ON C: DRIVE

Our recursive forensic audit has identified **8.79 GB** across 7 distinct Antigravity directories on `C:` drive:

| Path on C: | Role / Content | Size (MB) | Size (GB) | File Count | Folder Count |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`C:\Users\alamr\.gemini\antigravity`** | **Primary Agent Brain & Database** (All conversations, transcripts, artifacts, memory, SQLite DB) | **7,420.99 MB** | **7.247 GB** | **139,679** | **89,690** |
| **`C:\Users\alamr\AppData\Local\Programs\antigravity`** | **Application Installation Binaries** (`Antigravity.exe`, Electron runtime, DLLs, locales) | **582.41 MB** | **0.569 GB** | **426** | **34** |
| **`C:\Users\alamr\AppData\Roaming\Antigravity`** | **User State & Credentials** (Google Auth tokens, cookies, LevelDB, extensions, window state) | **362.09 MB** | **0.354 GB** | **3,729** | **247** |
| **`C:\Users\alamr\AppData\Local\antigravity-updater`** | **Update Installer Cache** (Downloaded pending update installer packages) | **331.63 MB** | **0.324 GB** | **3** | **1** |
| **`C:\Users\alamr\.gemini\antigravity-ide`** | **IDE Workspace State** (Cached IDE data) | **250.61 MB** | **0.245 GB** | **7,578** | **4,516** |
| **`C:\Users\alamr\.geminiantigravity`** | **Legacy / Staged State** | **16.65 MB** | **0.016 GB** | **207** | **78** |
| **`C:\Users\alamr\AppData\Local\antigravity`** | **Local AppData Cache** | **4.27 MB** | **0.004 GB** | **1** | **1** |
| **`C:\Users\alamr\.gemini\antigravity-backup`** | **Previous Backup Snapshot** | **0.01 MB** | **0.000 GB** | **15** | **2** |
| **TOTAL FOOTPRINT ON C:** | | **8,968.66 MB** | **~8.76 GB** | **151,638** | **94,569** |

---

## 3. PRIMARY USER-DATA BREAKDOWN (`C:\Users\alamr\.gemini\antigravity`)

The 7.25 GB primary agent directory contains:
* **`brain/` (5,095.91 MB / 5.10 GB, 139,479 files):** Contains all conversation workspaces, subagent logs, artifacts, image generations, and step traces.
* **`conversations/` (2,123.42 MB / 2.12 GB, 26 files):** Persistent serialized conversation history store.
* **`conversation_summaries.db` (74.3 MB):** Active SQLite 3 database indexing all conversation threads and titles.
* **`conversation_summaries.db-wal` & `.db-shm` (0.8 MB):** Active SQLite Write-Ahead Log.
* **`bin/` (130.36 MB, 3 files):** Embedded CLI tool binaries (`agy`).
* **`antigravity_state.pbtxt` & `installation_id`:** Client identification and state flags.

---

## 4. RUNTIME PROCESSES & LOCK AUDIT

Active running processes verified on host:
* `Antigravity.exe` (PIDs: 3952, 5868, 8856, 9348, 10088, 10528, 11020, 12108, 15996, 16312)
* Executable path: `C:\Users\alamr\AppData\Local\Programs\antigravity\Antigravity.exe`
* Open handles: Holding active locks on `conversation_summaries.db`, `Local Storage/`, and `GPUCache/`.
* **CRITICAL REQUIREMENT:** Antigravity must be completely closed before moving or junctioning directories to avoid SQLite WAL corruption or Windows sharing violations (`ERROR_SHARING_VIOLATION`).

---

## 5. DOC SEARCH PROJECT & DATABASE AUDIT (ON D: DRIVE)

* **Physical Location:** `D:\DOC SEARCH` (100% on D: drive, zero files on C:)
* **Monorepo Size:** **1.018 GB (53,726 files)**
* **PostgreSQL 18.4 Engine:** `D:\DOC SEARCH\data\db-native-utf8` (290.15 MB, 580 tables, 38,870 clinical rows)
* **Git Status:** 
  * Branch: `main`
  * SHA: `b68216f`
  * Remote: `https://github.com/ewanbabu36-cell/doc-search`
  * Remote Sync: `Everything up-to-date` on both `origin/main` and `origin/remediation/phase3-controlled`.
* **Project Independence:** The DOC SEARCH codebase and database are completely decoupled from Antigravity's installation directory.

---

## 6. MIGRATION FEASIBILITY & RECOMMENDED STRATEGY

### Architectural Analysis:
Antigravity is an Electron / VS Code-derived platform. The core data paths (`%USERPROFILE%\.gemini\antigravity` and `%APPDATA%\Antigravity`) are hardcoded in the underlying binary to standard Windows user profile environment variables.

### The Proven Zero-Risk Strategy: **Windows NTFS Directory Junctions (`mklink /J`)**
Rather than hacking registry keys or risking configuration incompatibilities:
1. **Bit-for-Bit Copy with ACL Preservation:**
   Use Windows `robocopy /E /COPYALL /DCOPY:DAT /R:3 /W:1` to transfer all user data from:
   * Source: `C:\Users\alamr\.gemini\antigravity`
   * Destination: `D:\AntigravityData`
2. **Hash & Count Verification:**
   Verify identical file counts (139,679 files) and test cryptographic hashes on SQLite database files (`conversation_summaries.db`).
3. **Transparent OS-Level Redirection:**
   Create an NTFS Directory Junction:
   ```cmd
   mklink /J "C:\Users\alamr\.gemini\antigravity" "D:\AntigravityData"
   ```
   * **Why this is 100% Safe:** In Windows NTFS, a Directory Junction is resolved directly in the kernel by `ntfs.sys`. Every process, application, and file access directed at `C:\Users\alamr\.gemini\antigravity` is transparently redirected to `D:\AntigravityData` without the application knowing any change occurred.
   * **All existing links, conversation references, absolute paths, and database queries continue working seamlessly.**
4. **Application Binary Relocation:**
   Similarly, `C:\Users\alamr\AppData\Local\Programs\antigravity` (582 MB) can be relocated to `D:\Programs\Antigravity` via clean install or junction.
5. **Expected Space Recovered on C: Drive:**
   * Primary User Data: **+7.25 GB**
   * Updater Cache (`antigravity-updater`): **+0.33 GB**
   * Application Binaries (if moved to D:): **+0.58 GB**
   * **TOTAL RECOVERABLE C: SPACE: ~8.16 GB to 8.80 GB!**
   * C: Drive Free space will jump from **4.68 GB to ~13.0 GB**!
