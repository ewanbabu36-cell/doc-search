@echo off
set ELECTRON_RUN_AS_NODE=1
node "%~dp0tooling\run-pnpm.js" %*
