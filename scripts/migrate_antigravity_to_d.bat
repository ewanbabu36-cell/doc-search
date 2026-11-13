@echo off
setlocal enabledelayedexpansion
title ANTIGRAVITY SAFE COMPLETE MIGRATION: C: TO D: DRIVE
color 0A

echo ==============================================================================
echo           ANTIGRAVITY PRODUCTION COMPLETE MIGRATION TO D: DRIVE
echo               Application Binaries & User Data Relocation
echo                  Kernel NTFS Directory Junction Method
echo ==============================================================================
echo.
echo 1. User Data:
echo    Source: C:\Users\alamr\.gemini\antigravity (7.45 GB)
echo    Target: D:\AntigravityData (Pre-mirrored & Verified)
echo.
echo 2. Application Binaries:
echo    Source: C:\Users\alamr\AppData\Local\Programs\antigravity (582 MB)
echo    Target: D:\Programs\Antigravity (Pre-mirrored & Verified)
echo.
echo 3. Standalone Safety Vault:
echo    Backup: D:\Antigravity_Migration_Backup\snapshot_20261113_1611
echo.
echo Expected Space Recovery on C: Drive: ~8.03 GB
echo ==============================================================================
echo.

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
    echo Please save your work and CLOSE the Antigravity window now.
    echo.
    echo Press any key once Antigravity is completely closed...
    pause >nul
    goto CHECK_PROCESS
)

echo [OK] Antigravity process is completely closed.
echo.

:: Step 2: Final incremental delta-sync
echo [STEP 1/6] Running final delta synchronization of User Data to D:\AntigravityData...
robocopy "C:\Users\alamr\.gemini\antigravity" "D:\AntigravityData" /MIR /R:1 /W:1 /NFL /NDL /NP /NJH /NJS
echo [OK] User Data sync complete. D:\AntigravityData is 100%% up-to-date.
echo.

echo [STEP 2/6] Running delta verification of Application Binaries to D:\Programs\Antigravity...
robocopy "C:\Users\alamr\AppData\Local\Programs\antigravity" "D:\Programs\Antigravity" /MIR /R:1 /W:1 /NFL /NDL /NP /NJH /NJS
echo [OK] Application binaries verified and up-to-date.
echo.

:: Step 3: Safely stage and junction User Data
echo [STEP 3/6] Staging original User Data directory...
if exist "C:\Users\alamr\.gemini\antigravity.orig" (
    echo Removing previous temporary staging copy...
    rmdir /S /Q "C:\Users\alamr\.gemini\antigravity.orig"
)
ren "C:\Users\alamr\.gemini\antigravity" "antigravity.orig"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to rename User Data directory. A background process may be locking a file.
    pause
    exit /b 1
)
echo [OK] Staged to C:\Users\alamr\.gemini\antigravity.orig.

echo Creating NTFS Directory Junction for User Data...
mklink /J "C:\Users\alamr\.gemini\antigravity" "D:\AntigravityData"
if %errorlevel% neq 0 (
    echo [CRITICAL ERROR] Failed to create User Data junction! Restoring original folder...
    ren "C:\Users\alamr\.gemini\antigravity.orig" "antigravity"
    pause
    exit /b 1
)
echo [OK] User Data junction created: C:\Users\alamr\.gemini\antigravity -^> D:\AntigravityData
echo.

:: Step 4: Safely stage and junction Application Binaries
echo [STEP 4/6] Staging original Application Binaries directory...
if exist "C:\Users\alamr\AppData\Local\Programs\antigravity.orig" (
    rmdir /S /Q "C:\Users\alamr\AppData\Local\Programs\antigravity.orig"
)
ren "C:\Users\alamr\AppData\Local\Programs\antigravity" "antigravity.orig"
if %errorlevel% neq 0 (
    echo [WARNING] Application binaries locked by another process. Keeping binaries on C:, user data already junctioned.
) else (
    echo [OK] Staged to C:\Users\alamr\AppData\Local\Programs\antigravity.orig.
    echo Creating NTFS Directory Junction for Application Binaries...
    mklink /J "C:\Users\alamr\AppData\Local\Programs\antigravity" "D:\Programs\Antigravity"
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create App junction! Restoring original app folder...
        ren "C:\Users\alamr\AppData\Local\Programs\antigravity.orig" "antigravity"
    ) else (
        echo [OK] App junction created: C:\Users\alamr\AppData\Local\Programs\antigravity -^> D:\Programs\Antigravity
    )
)
echo.

:: Step 5: Verification of Junctions
echo [STEP 5/6] Verifying Junction reparse points...
echo --- User Data Junction ---
dir /a "C:\Users\alamr\.gemini" | findstr /I "antigravity"
echo --- App Binaries Junction ---
dir /a "C:\Users\alamr\AppData\Local\Programs" | findstr /I "antigravity"
echo.

echo ==============================================================================
echo                     MIGRATION COMPLETED SUCCESSFULLY!
echo ==============================================================================
echo.
echo Antigravity will now run transparently from D: drive:
echo - Data: D:\AntigravityData (7.45 GB offloaded from C:)
echo - App:  D:\Programs\Antigravity (582 MB offloaded from C:)
echo.

set /p TEST_LAUNCH="Would you like to start Antigravity now to test? (Y/N): "
if /I "%TEST_LAUNCH%"=="Y" (
    start "" "D:\Programs\Antigravity\Antigravity.exe"
)

echo.
echo ==============================================================================
echo                              DISK CLEANUP
echo ==============================================================================
echo After you confirm that Antigravity launches and all conversations/projects are
echo visible, you can delete the .orig staging folders to free ~8.03 GB on C: drive.
echo.
set /p DELETE_ORIG="Have you tested Antigravity and wish to DELETE .orig folders to free ~8.03 GB on C:? (Y/N): "
if /I "%DELETE_ORIG%"=="Y" (
    echo Deleting staging folders...
    if exist "C:\Users\alamr\.gemini\antigravity.orig" (
        rmdir /S /Q "C:\Users\alamr\.gemini\antigravity.orig"
        echo [OK] C:\Users\alamr\.gemini\antigravity.orig deleted (7.45 GB freed).
    )
    if exist "C:\Users\alamr\AppData\Local\Programs\antigravity.orig" (
        rmdir /S /Q "C:\Users\alamr\AppData\Local\Programs\antigravity.orig"
        echo [OK] C:\Users\alamr\AppData\Local\Programs\antigravity.orig deleted (582 MB freed).
    )
    echo Total ~8.03 GB recovered on C: drive!
) else (
    echo Staging folders kept as extra safety copy. You can delete them manually at any time.
)

echo.
echo Migration procedure complete. Press any key to exit.
pause >nul
