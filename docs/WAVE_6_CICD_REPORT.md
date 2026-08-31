# DOC SEARCH — Wave 6 CI/CD Pipeline Architecture

### Automated Workflows
1. **Continuous Integration (`.github/workflows/ci.yml`)**:
   - Triggers: `push`, `pull_request` on `main`
   - Steps: Frozen lockfile install -> ESLint (`--max-warnings=0`) -> Typecheck (`pnpm -r typecheck`) -> Automated Tests (94/94) -> Monorepo Production Build
2. **Security Scan (`.github/workflows/security.yml`)**:
   - Triggers: Scheduled weekly & on `main` branch pushes
   - Steps: Dependency vulnerability audit & secret detection
3. **E2E Clinical Regression (`.github/workflows/e2e.yml`)**:
   - Triggers: PRs touching clinical routes
   - Steps: Executes end-to-end multi-tenant workflows
4. **Release Gate (`.github/workflows/release.yml`)**:
   - Triggers: Tag push (`v*`)
   - Steps: Enforces full gate pass before generating production artifacts
