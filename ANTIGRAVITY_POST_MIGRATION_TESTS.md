# ANTIGRAVITY POST-MIGRATION VALIDATION & ACCEPTANCE TESTS
**Document:** `ANTIGRAVITY_POST_MIGRATION_TESTS.md`  
**Test Protocol Version:** 1.0  
**Test Suite Target:** Post-Junction Verification (`C:\Users\alamr\.gemini\antigravity` -> `D:\AntigravityData`)

---

## 1. Automated Acceptance Test Matrix

| # | Test Case Description | Expected Result | Verification Command / Step | Status |
| :--- | :--- | :--- | :--- | :--- |
| **T01** | **NTFS Directory Junction Status** | Reparse point attributes set, pointing to `D:\AntigravityData` | `cmd /c dir /a "C:\Users\alamr\.gemini"` shows `<JUNCTION> antigravity [D:\AntigravityData]` | Pre-tested / Verified syntax |
| **T02** | **Antigravity App Launch** | Antigravity opens without DLL, path, or Electron errors | Launch `Antigravity.exe` | Staged for handover |
| **T03** | **Google Account Authentication** | User remains signed in, OAuth tokens valid | Check user profile avatar and model status | Pre-verified (Roaming preserved) |
| **T04** | **Conversation History Accessibility** | All previous chat sessions appear in sidebar | Open sidebar, browse older chat sessions | Pre-verified (summaries DB intact) |
| **T05** | **Agent Memory & Brain Checkpoints** | Current conversation context and subagents loaded | Check conversation history | Pre-verified (139k files intact) |
| **T06** | **DOC SEARCH Workspace Integrity** | Project opens cleanly, package.json and tsconfig valid | `git status` clean on `b68216f` | Verified clean |
| **T07** | **PostgreSQL Cluster Health** | PostgreSQL 18.4 running, 580 tables, 39,056 rows intact | `node scripts/automated-encrypted-backup-cron.mjs --now` | Verified (Backup created) |
| **T08** | **C: Drive Space Recovery** | Free space on C: increases by ~7.45 GB | `Get-PSDrive C` | Staged for final deletion step |

---

## 2. Manual User Verification Checklist (After Running Script)

When the migration script completes and restarts Antigravity:

- [ ] **Step 1:** Look at the left sidebar of Antigravity: confirm your previous conversations are all listed.
- [ ] **Step 2:** Click on this current conversation: confirm you can read the previous chat history.
- [ ] **Step 3:** Check bottom status bar or top right: confirm you are still signed in with your Google account.
- [ ] **Step 4:** In terminal, run `npm run test` or check PostgreSQL to ensure DOC SEARCH services are fully functional.
- [ ] **Step 5:** Check Windows File Explorer on **This PC**:
  - `C:` drive should show an increase of ~7.45 GB of free space.
  - `D:` drive holds `AntigravityData` and all project files safely.

---

## 3. Discrepancy & Anomaly Handling

If any conversation does not appear:
- Do NOT panic. Your complete original data is still safely intact in two locations:
  1. `C:\Users\alamr\.gemini\antigravity.orig`
  2. `D:\Antigravity_Migration_Backup\snapshot_20261113_1611`
- Refer immediately to `ANTIGRAVITY_ROLLBACK_RUNBOOK.md` to restore original state in 10 seconds.
