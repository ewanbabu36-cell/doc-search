@echo off
setlocal enabledelayedexpansion
title ANTIGRAVITY SAFE ROLLBACK RUNBOOK
color 0C

echo ==============================================================================
echo                 ANTIGRAVITY EMERGENCY ROLLBACK PROCEDURE
echo ==============================================================================
echo.
echo This script removes the NTFS Directory Junction and restores Antigravity
echo to running directly off C: drive.
echo.
echo ==============================================================================

:: Check for Administrator Privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script requires Administrator privileges.
    echo Please right-click this script and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

:: Step 1: Ensure Antigravity is closed
:CHECK_PROCESS
tasklist /FI "IMAGENAME eq Antigravity.exe" 2>NUL | find /I /N "Antigravity.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [WAITING] Antigravity is currently RUNNING!
    echo Please close Antigravity before rolling back.
    echo.
    echo Press any key once Antigravity is closed...
    pause >nul
    goto CHECK_PROCESS
)

echo [OK] Antigravity is closed.
echo.

:: Step 2: Remove Junction
echo [STEP 1/3] Removing NTFS Junction C:\Users\alamr\.gemini\antigravity...
if exist "C:\Users\alamr\.gemini\antigravity" (
    rmdir "C:\Users\alamr\.gemini\antigravity"
    echo [OK] Junction removed. (Target data on D:\AntigravityData remains intact).
) else (
    echo [NOTICE] Junction does not exist.
)
echo.

:: Step 3: Restore Original Folder
echo [STEP 2/3] Restoring original C: folder...
if exist "C:\Users\alamr\.gemini\antigravity.orig" (
    ren "C:\Users\alamr\.gemini\antigravity.orig" "antigravity"
    echo [OK] Renamed antigravity.orig back to antigravity!
) else (
    echo [NOTICE] antigravity.orig not found. Restoring from D:\Antigravity_Migration_Backup vault...
    robocopy "D:\Antigravity_Migration_Backup\snapshot_20261113_1611\gemini_antigravity" "C:\Users\alamr\.gemini\antigravity" /E /R:1 /W:1 /NFL /NDL /NP /NJH /NJS
    echo [OK] Restored from backup vault.
)
echo.

:: Step 4: Verification
echo [STEP 3/3] Verifying restoration...
dir /a "C:\Users\alamr\.gemini" | findstr /I "antigravity"
echo.

echo ==============================================================================
echo                       ROLLBACK COMPLETED SUCCESSFULLY
echo ==============================================================================
echo Antigravity is now restored to its original state on C: drive.
pause
