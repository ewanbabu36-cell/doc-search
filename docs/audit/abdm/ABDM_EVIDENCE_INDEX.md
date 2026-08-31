# ABDM Evidence Index — Real Sandbox E2E Audit

| Evidence File | Domain Area | Target Protocol / Endpoint | Verification Scope | Status |
| :--- | :--- | :--- | :--- | :--- |
| [`01-authentication.json`](./evidence/01-authentication.json) | Authentication | `POST /v0.5/sessions` | NHA Gateway Bearer Token Flow | **BLOCKED (Missing Credentials)** |
| [`02-m1-abha.json`](./evidence/02-m1-abha.json) | M1 ABHA / e-KYC | `POST /v0.5/identity/aadhaar/*` | Aadhaar OTP Dispatch & ABHA Creation | **BLOCKED (Missing Credentials)** |
| [`03-m2-care-context.json`](./evidence/03-m2-care-context.json) | M2 Care Context | `POST /v0.5/links/link/add-contexts` | Care Context Registration & Linking | **BLOCKED (Missing Credentials)** |
| [`04-scan-share.json`](./evidence/04-scan-share.json) | Scan & Share | `POST /v1.0/patients/profile/share` | Counter QR Scan & Share Token Triage | **BLOCKED (Missing Credentials)** |
| [`05-consent.json`](./evidence/05-consent.json) | M3 Consent | `POST /v0.5/consent-requests/init` | Electronic Consent Artefact Lifecycle | **BLOCKED (Missing Credentials)** |
| [`06-health-information-transfer.json`](./evidence/06-health-information-transfer.json) | HI Transfer | `POST /v0.5/health-information/hip/request` | ECDH Key Exchange & Encrypted Stream | **BLOCKED (Missing Credentials)** |
| [`07-fhir-validation.json`](./evidence/07-fhir-validation.json) | FHIR R4 | NRCES FHIR R4 Bundle | Structure, Profiles & Digital Signatures | **PASS (Internal Engine Verified)** |
| [`08-callback-security.json`](./evidence/08-callback-security.json) | Callback Security | `POST /api/v1/abdm/callback/*` | Webhook Correlation, ACK & Failsafe | **PASS (Internal Gateway Verified)** |
| [`09-database-integrity.json`](./evidence/09-database-integrity.json) | Database Integrity | PostgreSQL 16 RLS | Multi-Tenant Data Store & Schema | **PASS (Internal Gateway Verified)** |
| [`10-cryptographic-audit.json`](./evidence/10-cryptographic-audit.json) | Cryptographic Audit | SHA-256 Audit Chain | Immutable Audit Hash Chain Verification | **PASS (Internal Gateway Verified)** |
| [`11-failure-retry-idempotency.json`](./evidence/11-failure-retry-idempotency.json) | Failure & Retry | Fastify HTTP Pipeline | 400/401 Failsafe & Idempotent Linking | **PASS (Internal Gateway Verified)** |
| [`12-tenant-isolation.json`](./evidence/12-tenant-isolation.json) | Tenant Isolation | Tenant Scope Guard | Cross-Tenant ABHA/Consent Denial | **PASS (Internal Gateway Verified)** |
| [`13-observability.json`](./evidence/13-observability.json) | Observability | Structured Logs | Telemetry, Metrics & Credential Masking | **PASS (Internal Gateway Verified)** |
