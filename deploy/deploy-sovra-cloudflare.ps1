# ==============================================================================
# SOVRA ZERO-COST PWA — CLOUDFLARE PAGES 1-CLICK POWERSHELL DEPLOY SCRIPT
# Lifetime Free Hosting on Cloudflare Global Edge Network ($0.00 / INR 0.00)
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING SOVRA PWA TO CLOUDFLARE PAGES (100% FREE)" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$ScriptDir\.."
$SovraDir = "$ProjectRoot\apps\sovra-pwa"

Set-Location $SovraDir

Write-Host "[1/4] Checking Node.js environment..." -ForegroundColor Yellow
node -v
npm -v

Write-Host "[2/4] Building production PWA bundle..." -ForegroundColor Yellow
npm run build

Write-Host "[3/4] Verifying PWA Assets..." -ForegroundColor Yellow
if (-not (Test-Path "dist\index.html")) { throw "dist\index.html missing!" }
if (-not (Test-Path "dist\sw.js")) { throw "dist\sw.js missing!" }
if (-not (Test-Path "dist\manifest.webmanifest")) { throw "dist\manifest.webmanifest missing!" }
Write-Host "✔ PWA static bundle verified successfully." -ForegroundColor Green

Write-Host "[4/4] Deploying to Cloudflare Pages via Wrangler..." -ForegroundColor Yellow
try {
    npx wrangler pages deploy dist --project-name sovra-pwa --commit-dirty=true
} catch {
    Write-Host "⚠️ Cloudflare Wrangler deployment notification: $_" -ForegroundColor DarkYellow
    Write-Host "To link Cloudflare account, run: npx wrangler login" -ForegroundColor Yellow
    Write-Host "Direct static build is ready in $SovraDir\dist" -ForegroundColor Green
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "✔ SOVRA HEALTHCARE PWA DEPLOYMENT BUNDLE READY" -ForegroundColor Green
Write-Host "Target URL: https://sovra-pwa.pages.dev" -ForegroundColor Cyan
Write-Host "Recurring Cost: $0.00 / INR 0.00 per month (Lifetime Free)" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan
