#!/usr/bin/env bash
set -euo pipefail

echo "==> Purging cached build artifacts from Git index..."
git rm -r --cached dist/ .turbo/ .vite/ dist/bundle/ scratch/ coverage/ 2>/dev/null || true
git add .gitignore
echo "==> Git cache cleaned."
