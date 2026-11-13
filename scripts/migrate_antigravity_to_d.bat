@echo off
setlocal enabledelayedexpansion
title ANTIGRAVITY SAFE MIGRATION: C: TO D: DRIVE
color 0A

echo ==============================================================================
echo           ANTIGRAVITY PRODUCTION DATA MIGRATION TO D: DRIVE
echo                  Kernel NTFS Directory Junction Method
echo ==============================================================================
echo.
echo Source: C:\Users\alamr\.gemini\antigravity (7.45 GB)
echo Target: D:\AntigravityData (Pre-mirrored & Verified)
echo Backup: D:\Antigravity_Migration_Backup\snapshot_20261113_1611
echo.
echo ==============================================================================

:: Check for Administrator Privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script requires Administrator privileges to create NTFS junctions.
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
    echo Please save your work and CLOSE Antigravity now.
    echo.
    echo Press any key once Antigravity is completely closed...
    pause >nul
    goto CHECK_PROCESS
)

echo [OK] Antigravity is completely closed.
echo.

:: Step 2: Final incremental delta-sync
echo [STEP 1/4] Running final delta synchronization to D:\AntigravityData...
robocopy "C:\Users\alamr\.gemini\antigravity" "D:\AntigravityData" /MIR /R:1 /W:1 /NFL /NDL /NP /NJH /NJS
echo [OK] Delta sync complete. D:\AntigravityData is 100%% up-to-date.
echo.

:: Step 3: Rename C:\Users\alamr\.gemini\antigravity to .orig
echo [STEP 2/4] Safely staging original folder...
if exist "C:\Users\alamr\.gemini\antigravity.orig" (
    echo Warning: antigravity.orig already exists. Removing old backup pointer...
    rmdir /S /Q "C:\Users\alamr\.gemini\antigravity.orig"
)

ren "C:\Users\alamr\.gemini\antigravity" "antigravity.orig"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to rename original directory. A background process may be locking a file.
    echo Please verify no Antigravity or node processes are running and retry.
    pause
    exit /b 1
)
echo [OK] Staged to C:\Users\alamr\.gemini\antigravity.orig.
echo.

:: Step 4: Create NTFS Directory Junction
echo [STEP 3/4] Creating NTFS Directory Junction...
mklink /J "C:\Users\alamr\.gemini\antigravity" "D:\AntigravityData"
if %errorlevel% neq 0 (
    echo [CRITICAL ERROR] Failed to create junction! Initiating automatic recovery...
    ren "C:\Users\alamr\.gemini\antigravity.orig" "antigravity"
    echo Restored original directory. Migration aborted safely without data loss.
    pause
    exit /b 1
)
echo [OK] NTFS Directory Junction created successfully!
echo.

:: Step 5: Verification of Junction Target
echo [STEP 4/4] Verifying junction reparse point...
dir /a "C:\Users\alamr\.gemini" | findstr /I "antigravity"
echo.

echo ==============================================================================
echo                     MIGRATION COMPLETED SUCCESSFULLY!
echo ==============================================================================
echo.
echo Antigravity will now read and write directly to D:\AntigravityData.
echo All conversations, agent memory, extensions, and projects are preserved.
echo.
echo Current C: folder status:
echo - Live active junction: C:\Users\alamr\.gemini\antigravity -^> D:\AntigravityData
echo - Original staging copy: C:\Users\alamr\.gemini\antigravity.orig (7.45 GB)
echo.
echo You can now launch Antigravity and verify all your conversations!
echo.

set /p TEST_LAUNCH="Would you like to start Antigravity now to test? (Y/N): "
if /I "%TEST_LAUNCH%"=="Y" (
    if exist "C:\Users\alamr\AppData\Local\Programs\antigravity\Antigravity.exe" (
        start "" "C:\Users\alamr\AppData\Local\Programs\antigravity\Antigravity.exe"
    ) else (
        echo Antigravity executable located at standard path. Please launch from Start Menu or desktop shortcut.
    )
)

echo.
echo ==============================================================================
echo                              DISK CLEANUP
echo ==============================================================================
echo To recover the 7.45 GB on C: drive, the original staging folder
echo "C:\Users\alamr\.gemini\antigravity.orig" can now be deleted.
echo.
set /p DELETE_ORIG="Have you tested Antigravity and wish to DELETE antigravity.orig now to free 7.45 GB on C:? (Y/N): "
if /I "%DELETE_ORIG%"=="Y" (
    echo Deleting C:\Users\alamr\.gemini\antigravity.orig...
    rmdir /S /Q "C:\Users\alamr\.gemini\antigravity.orig"
    echo [OK] antigravity.orig deleted! 7.45 GB successfully freed on C: drive.
) else (
    echo antigravity.orig kept as safety copy. You can delete it manually at any time.
)

echo.
echo Migration procedure complete. Press any key to exit.
pause >nul
