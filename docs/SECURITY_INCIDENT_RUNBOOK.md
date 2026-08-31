# DOC SEARCH — Security Incident Response Runbook

### 1. Token / Key Compromise Protocol
1. Rotate `JWT_SECRET` immediately in Secret Manager.
2. Invalidate all active refresh token families via `SessionService.revokeAllSessions()`.
3. Restart API Gateway instances to load new signing key.

### 2. Isolation / Access Breach Protocol
1. Audit `core.audit_events` using SHA-256 chain verification query to identify compromised tenant/patient records.
2. Lock compromised partner / tenant status to `SUSPENDED`.
3. Notify compliance and clinical safety officers.
