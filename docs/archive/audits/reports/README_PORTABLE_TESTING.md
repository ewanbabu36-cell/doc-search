# DOC SEARCH — Portable Full-Stack Testing & Debugging Kit
**Created:** 11/21/2026, 3:52:18 PM
**Target:** Independent Testing, Debugging, and Offline Staging

---

## 🌟 What is Included in this Package?
1. **Full Monorepo Source Code**:
   - `apps/partner-platform` (Enterprise Hospital Operating System)
   - `apps/api-gateway` (Fastify Enterprise API Gateway with RBAC)
   - `apps/company-platform` (Executive & Company Admin Platform)
   - `apps/landing-page` (Public Booking & Landing Portal)
   - `apps/patient-app` (Patient Mobile Portal)
   - `packages/*` (api-contracts, auth, database, shared-core, ui-kit)
2. **Complete Native PostgreSQL 18.4 Database Cluster (`data/db-native-utf8`)**:
   - 580 production tables across 9 clinical schemas.
   - 39,000+ verified clinical records, medicine catalog, ICD-10 codes, and test fixtures.
   - Pre-configured roles and credentials: `postgres` / `password` on port `5432`.

---

## 🚀 How to Run in 3 Steps

### Step 1: Install Dependencies
Open terminal in this extracted folder and run:
```bash
npm install
```
*(Or using bundled pnpm: `node tooling/pnpm.cjs install`)*

### Step 2: Build API Gateway & Packages
```bash
node tooling/pnpm.cjs build
```

### Step 3: Launch Local Stack Supervisor
```bash
node scripts/start-all.js
```

---

## 🌐 Active Endpoints
Once running:
- **Master Unified Gateway Hub**: `http://localhost:3000`
- **Partner Platform (Hospital/Pharmacy ERP)**: `http://localhost:5173`
- **API Gateway Health Check**: `http://localhost:4000/api/v1/health`
- **Company Platform**: `http://localhost:5177`
- **Landing & Patient Booking**: `http://localhost:5175`
