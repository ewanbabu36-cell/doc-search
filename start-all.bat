@echo off
TITLE Doc Search — Healthcare SaaS Suite Launcher
COLOR 0A
echo ======================================================================
echo    DOC SEARCH — HEALTHCARE SAAS PLATFORM (ENTERPRISE SUITE)
echo ======================================================================
echo.
echo Starting all 4 services in independent background processes...
echo.

:: 1. API Gateway (Port 4000)
echo [1/4] Starting Fastify API Gateway on http://localhost:4000 ...
start "DocSearch - API Gateway (Port 4000)" cmd.exe /k "cd /d "%~dp0" && pnpm --filter @docsearch/api-gateway start"

:: 2. Partner Platform (Port 5173)
echo [2/4] Starting Partner Platform on http://localhost:5173 ...
start "DocSearch - Partner Platform (Port 5173)" cmd.exe /k "cd /d "%~dp0" && pnpm --filter @docsearch/partner-platform dev --port 5173 --host"

:: 3. Company Platform (Port 5174)
echo [3/4] Starting Company SaaS HQ Platform on http://localhost:5174 ...
start "DocSearch - Company HQ (Port 5174)" cmd.exe /k "cd /d "%~dp0" && pnpm --filter @docsearch/company-platform dev --port 5174 --host"

:: 4. Landing Page (Port 5175)
echo [4/4] Starting Marketing Landing Page on http://localhost:5175 ...
start "DocSearch - Landing Page (Port 5175)" cmd.exe /k "cd /d "%~dp0" && pnpm --filter @docsearch/landing-page dev --port 5175 --host"

echo.
echo ======================================================================
echo    ALL 4 PLATFORMS LAUNCHED SUCCESSFULLY!
echo ======================================================================
echo    - Partner Platform:  http://localhost:5173
echo    - Company SaaS HQ:   http://localhost:5174
echo    - Public Landing:    http://localhost:5175
echo    - API Gateway:       http://localhost:4000/health
echo ======================================================================
echo You can keep this window open or close it. The servers will continue running!
pause
