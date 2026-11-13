# ANTIGRAVITY EMERGENCY ROLLBACK RUNBOOK
**Document:** `ANTIGRAVITY_ROLLBACK_RUNBOOK.md`  
**Rollback Automation Script:** `D:\DOC SEARCH\scripts\rollback_antigravity_migration.bat`  
**Safe Backup Vault:** `D:\Antigravity_Migration_Backup\snapshot_20261113_1611`  

---

## 1. Quick Reversion (Takes 10 Seconds)

If at any point after migration you wish to revert back to having files directly on `C:` (before `antigravity.orig` is permanently deleted):

### Step 1: Close Antigravity
Close all Antigravity windows and background processes.

### Step 2: Run the Automated Rollback Script
Open Command Prompt as Administrator and run:
```cmd
"D:\DOC SEARCH\scripts\rollback_antigravity_migration.bat"
```
Or manually execute these two commands:
```cmd
rmdir "C:\Users\alamr\.gemini\antigravity"
ren "C:\Users\alamr\.gemini\antigravity.orig" antigravity
```

> [!NOTE]
> In Windows NTFS, running `rmdir` on a directory junction removes **only the link pointer**. It does **NOT** delete the actual files inside `D:\AntigravityData`!

### Step 3: Re-launch Antigravity
Launch Antigravity normally. Your original state on `C:` is immediately active.

---

## 2. Full Disaster Recovery from Vault Backup

If both `C:\Users\alamr\.gemini\antigravity` and `D:\AntigravityData` were ever damaged:

The full, untouched snapshot from 2026-11-13 16:11 is preserved in:
`D:\Antigravity_Migration_Backup\snapshot_20261113_1611`

### Restoration Steps:
```cmd
:: 1. Remove broken junction or folder
rmdir /S /Q "C:\Users\alamr\.gemini\antigravity"

:: 2. Restore directly from snapshot vault
robocopy "D:\Antigravity_Migration_Backup\snapshot_20261113_1611\gemini_antigravity" "C:\Users\alamr\.gemini\antigravity" /E /COPYALL /R:1 /W:1
```

---

## 3. PostgreSQL Database Rollback

The live PostgreSQL database at `D:\DOC SEARCH\data\db-native-utf8` was **never touched** during this operation.

However, should you ever need to restore PostgreSQL from the encrypted snapshot created during Phase 2:
- Encrypted file: `D:\DOC SEARCH\data\backups\encrypted\docsearch-backup-2026-11-13T10-40-34-439Z.enc`
- Key file: Embedded in the secure key vault `D:\DOC SEARCH\data\backups\keys\backup-encryption.key`
- Decrypt & restore command:
  ```powershell
  node scripts/automated-encrypted-backup-cron.mjs --restore D:\DOC SEARCH\data\backups\encrypted\docsearch-backup-2026-11-13T10-40-34-439Z.enc
  ```
