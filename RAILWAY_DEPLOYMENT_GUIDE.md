# 🚀 DOC SEARCH — RAILWAY DEPLOYMENT GUIDE (STEP-BY-STEP)

This guide provides the complete, copy-paste instructions to deploy the entire **Doc Search Monorepo (PostgreSQL + API Gateway + Hospital Platform + Company SaaS HQ + Landing Page)** live on [Railway](https://railway.com).

---

## 🏗️ Architecture Overview on Railway

```text
                               ┌─────────────────────────────┐
                               │   Railway PostgreSQL DB     │
                               │   (1-Click Database Plugin) │
                               └──────────────┬──────────────┘
                                              │ (DATABASE_URL)
                                              ▼
                               ┌─────────────────────────────┐
                               │   API Gateway (Fastify)     │
                               │   https://api-gateway.up... │
                               └──────────────┬──────────────┘
                                              │
               ┌──────────────────────────────┼──────────────────────────────┐
               ▼                              ▼                              ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐
│  Hospital Partner Platform  │ │   Company SaaS HQ Platform  │ │   Public Marketing Page     │
│  (OPD / LIMS / HIS)         │ │   (Executive Portal)        │ │   (Main Landing Site)       │
│  https://partner.up.rail... │ │   https://company.up.rail...│ │   https://docsearch.up.rail.│
└─────────────────────────────┘ └─────────────────────────────┘ └─────────────────────────────┘
```

---

## 📋 Pre-Requisites
1. **GitHub Repository**: Ensure this codebase is pushed to your GitHub account.
2. **Railway Account**: Sign up / Log in at [https://railway.com](https://railway.com).

---

## 🛠️ Step 1: Create a New Railway Project & Database

1. Go to your [Railway Dashboard](https://railway.com/dashboard).
2. Click **`+ New Project`**.
3. Select **`Provision PostgreSQL`**.
   - Railway will provision a fully-managed PostgreSQL database in ~10 seconds.
   - It automatically generates a `DATABASE_URL` variable.

---

## 🛠️ Step 2: Deploy Backend API Gateway (`@docsearch/api-gateway`)

1. In your Railway Project canvas, click **`+ Create`** $\rightarrow$ **`GitHub Repo`**.
2. Select your `DOC SEARCH` repository.
3. Click on the newly created service card and navigate to **Settings**:
   - **Service Name**: `docsearch-api-gateway`
   - **Root Directory**: Leave as `/`
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm --filter @docsearch/api-gateway build
     ```
   - **Start Command**:
     ```bash
     pnpm --filter @docsearch/api-gateway start
     ```
4. Navigate to **Variables** tab and add:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` *(Click "Add Reference" and select Postgres)*
   - `NODE_ENV`: `production`
   - `PORT`: `4000` *(or leave blank so Railway injects dynamic `$PORT`)*
   - `HOST`: `0.0.0.0`
   - `JWT_SECRET`: `docsearch_super_production_secret_key_minimum_32_characters_long!`
   - `ENCRYPTION_KEY`: `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`
   - `CORS_ORIGIN`: `*` *(or comma-separated URLs of your deployed frontends)*
5. Navigate to **Networking** tab $\rightarrow$ Click **`Generate Domain`**.
   - Copy your generated API URL (e.g. `https://docsearch-api-gateway-production.up.railway.app`).

---

## 🛠️ Step 3: Deploy Hospital Partner Platform (`@docsearch/partner-platform`)

1. In the same project canvas, click **`+ Create`** $\rightarrow$ **`GitHub Repo`** $\rightarrow$ Select `DOC SEARCH` repo again.
2. Go to **Settings**:
   - **Service Name**: `docsearch-partner-platform`
   - **Root Directory**: `/`
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm --filter @docsearch/partner-platform build
     ```
   - **Start Command**:
     ```bash
     pnpm --filter @docsearch/partner-platform preview --port $PORT --host
     ```
3. Go to **Variables**:
   - `NODE_ENV`: `production`
   - `VITE_API_URL`: *(Your API Gateway URL from Step 2, e.g. `https://docsearch-api-gateway-production.up.railway.app`)*
4. Go to **Networking** $\rightarrow$ Click **`Generate Domain`**.

---

## 🛠️ Step 4: Deploy Company SaaS HQ Platform (`@docsearch/company-platform`)

1. In the same project canvas, click **`+ Create`** $\rightarrow$ **`GitHub Repo`** $\rightarrow$ Select `DOC SEARCH` repo.
2. Go to **Settings**:
   - **Service Name**: `docsearch-company-platform`
   - **Root Directory**: `/`
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm --filter @docsearch/company-platform build
     ```
   - **Start Command**:
     ```bash
     pnpm --filter @docsearch/company-platform preview --port $PORT --host
     ```
3. Go to **Variables**:
   - `NODE_ENV`: `production`
   - `VITE_API_URL`: *(Your API Gateway URL from Step 2)*
4. Go to **Networking** $\rightarrow$ Click **`Generate Domain`**.

---

## 🛠️ Step 5: Deploy Public Marketing Landing Page (`@docsearch/landing-page`)

1. Click **`+ Create`** $\rightarrow$ **`GitHub Repo`** $\rightarrow$ Select `DOC SEARCH` repo.
2. Go to **Settings**:
   - **Service Name**: `docsearch-landing-page`
   - **Root Directory**: `/`
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm --filter @docsearch/landing-page build
     ```
   - **Start Command**:
     ```bash
     pnpm --filter @docsearch/landing-page preview --port $PORT --host
     ```
3. Go to **Networking** $\rightarrow$ Click **`Generate Domain`**.

---

## 🗄️ Step 6: Run Database Schema Migrations & Seeding

To run your database tables migration on the live Railway PostgreSQL database:
1. In your local terminal (or Railway CLI / Deploy Command):
   ```bash
   # Set your Railway PostgreSQL DATABASE_URL
   DATABASE_URL="<your_railway_postgres_connection_string>" pnpm db:migrate
   DATABASE_URL="<your_railway_postgres_connection_string>" pnpm db:seed
   ```
2. Or in Railway API Gateway service settings, set **Pre-Deploy Command**:
   ```bash
   pnpm --filter @docsearch/database db:migrate
   ```

---

## 🌐 Summary of Deployed Live URLs
Once deployed, Railway will provide you 4 live HTTPS URLs:
- 🌐 **Landing Page**: `https://docsearch-landing-page-production.up.railway.app`
- 🏥 **Hospital Partner Platform**: `https://docsearch-partner-platform-production.up.railway.app`
- 🏢 **Company SaaS HQ**: `https://docsearch-company-platform-production.up.railway.app`
- ⚙️ **Backend API Gateway**: `https://docsearch-api-gateway-production.up.railway.app`
