# Doc Search — Security Architecture & Guidelines

## 1. Security-by-Design Principles
* **Zero-Trust Backend Enforcement:** Frontend UI state does not constitute authorization. Every API handler verifies token validity, tenant membership, branch scope, and resource permissions.
* **Tenant & Branch Isolation:** Every query and operation is scoped to `tenant_id` and optional `branch_id`.
* **No Plaintext Secrets:** Environment variables are strictly validated at boot via Zod.
* **Auditability:** All mutation actions generate structured, immutable audit log events.
* **PHI/PII Redaction:** Structured loggers sanitize protected health information, credentials, and access tokens before output.

## 2. Authentication & Authorization Flow
* **Token Model:** Short-lived access tokens with rotating secure refresh tokens.
* **RBAC + ABAC:** Roles define broad privileges; branch context and data scopes constrain exact data access.
* **MFA-Ready Architecture:** Multi-factor authentication challenges can be required per role or per sensitivity level.

## 3. Database Security
* Schemas are logically isolated: `core.*`, `company.*`, `clinical.*`.
* Row-Level Security (RLS) policies driven by session configuration (`SET LOCAL app.current_tenant_id`).
