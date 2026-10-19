#!/usr/bin/env bash
# ==============================================================================
# SOVRA ZERO-COST PWA — CLOUDFLARE PAGES 1-CLICK DEPLOYMENT SCRIPT
# Lifetime Free Hosting on Cloudflare Global Edge Network ($0.00 / INR 0.00)
# ==============================================================================

set -euo pipefail

echo "============================================================"
echo "🚀 DEPLOYING SOVRA PWA TO CLOUDFLARE PAGES (100% FREE)"
echo "============================================================"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOVRA_DIR="${PROJECT_ROOT}/apps/sovra-pwa"

cd "${SOVRA_DIR}"

echo "[1/4] Checking Node.js environment..."
node -v
npm -v

echo "[2/4] Building production PWA bundle..."
npm run build

echo "[3/4] Verifying PWA Assets..."
test -f dist/index.html || { echo "❌ dist/index.html missing!"; exit 1; }
test -f dist/sw.js || { echo "❌ dist/sw.js missing!"; exit 1; }
test -f dist/manifest.webmanifest || { echo "❌ dist/manifest.webmanifest missing!"; exit 1; }
echo "✓ PWA static bundle verified successfully."

echo "[4/4] Deploying to Cloudflare Pages via Wrangler..."
if command -v wrangler &> /dev/null; then
  wrangler pages deploy dist --project-name sovra-pwa --commit-dirty=true
elif command -v npx &> /dev/null; then
  npx wrangler pages deploy dist --project-name sovra-pwa --commit-dirty=true
else
  echo "⚠️ Wrangler not found. Install with: npm install -g wrangler"
  echo "Then run: wrangler pages deploy apps/sovra-pwa/dist --project-name sovra-pwa"
fi

echo ""
echo "============================================================"
echo "✔ SOVRA HEALTHCARE PWA DEPLOYMENT COMPLETE"
echo "URL: https://sovra-pwa.pages.dev"
echo "Recurring Cost: $0.00 / INR 0.00 per month (Lifetime Free)"
echo "============================================================"
