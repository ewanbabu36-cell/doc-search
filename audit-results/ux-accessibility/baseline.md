# DOC SEARCH — UX / ACCESSIBILITY AUDIT BASELINE

- **Timestamp**: 2026-09-29T10:42:00Z (2026-09-29 16:12:00 IST)
- **Repository Location**: `D:\DOC SEARCH`
- **Git Branch**: `main`
- **Current Commit**: `2576d660eb8dd3e580952615defd5d440a585126`
- **Package Manager**: `pnpm` (via `.\pnpm.cmd`, Node `v24.20.0`)
- **Active Native Database**: Native PostgreSQL 18.4 on `127.0.0.1:5432` (`EXTERNAL_POSTGRES`, cluster at `data/db-native-utf8`, 442 tables active, zero in-memory/embedded fallback)

## Active Runtimes & Health Checks
- **API Gateway**: `http://localhost:4000` — `{"status":"healthy","service":"docsearch-api-gateway","database":{"ready":true,"mode":"EXTERNAL_POSTGRES","tables":442}}` (HTTP 200)
- **Partner Platform**: `http://localhost:5173` — HTTP 200 OK (Vite React Client)
- **Company Platform**: `http://localhost:5174` — HTTP 200 OK (Vite React Client)
- **Landing Page**: `http://localhost:5175` — HTTP 200 OK (Vite React Client)

## Available Browsers
- **Google Chrome**: `C:\Program Files\Google\Chrome\Application\chrome.exe` (Chromium DevTools Protocol available)
- **Microsoft Edge**: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` (Chromium DevTools Protocol available)

## Baseline Status
- **Syntax Check**: VERIFIED PASS (3,011 source files checked across `apps/` and `packages/`, 0 syntax errors)
- **Persistence Reality**: VERIFIED (PostgreSQL 18.4 authoritative, zero `localStorage` business truth)
- **Dirty State**: Verified isolated to audit scripts, comparison logs, and test reports. Source code base is clean.
