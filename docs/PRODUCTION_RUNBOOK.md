# DOC SEARCH — Production Operational Runbook

### 1. Service Startup & Environment
```bash
# Validate environment
export NODE_ENV=production
export JWT_SECRET="<32-character-high-entropy-secret>"
export DATABASE_URL="postgresql://user:pass@host:5432/docsearch?sslmode=require"

# Start API Gateway
node apps/api-gateway/dist/index.js
```

### 2. Health & Readiness Verification
- Health: `curl -f http://localhost:4000/health` -> `{"status":"healthy"}`
- Readiness: `curl -f http://localhost:4000/ready` -> `{"status":"ready"}`

### 3. Log Inspection & Correlation
All application logs are formatted as structured JSON with `requestId`, `timestamp`, and `eventType`. PHI and credentials are sanitized at the logger boundary.
