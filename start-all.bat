@echo off
TITLE Doc Search — Healthcare Platform Suite
COLOR 0A
cd /d "%~dp0"

echo ======================================================================
echo    DOC SEARCH — ENTERPRISE HEALTHCARE SUITE (ALL-IN-ONE RUNNER)
echo ======================================================================
echo.
echo Launching all 4 platforms simultaneously:
echo   - 🏥 Partner Platform:   http://localhost:5173
echo   - 🏢 Company SaaS HQ:    http://localhost:5174
echo   - 🌟 Marketing Landing:  http://localhost:5175
echo   - ⚡ Fastify API Gateway: http://localhost:4000/health
echo.
echo ======================================================================
echo.

node scripts/start-all.js

pause
