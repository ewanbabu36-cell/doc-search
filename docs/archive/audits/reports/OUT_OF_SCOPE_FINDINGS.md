# OUT OF SCOPE FINDINGS
**DOC SEARCH Repository Investigation**
**Date:** September 8, 2026

During the deep audit of the KYC Pending workflow, the following adjacent observations were recorded. None of these block or directly affect the KYC verification workflow and are preserved here for future operational backlog:

1. **Static Mock Fallbacks in Client UI Components**:
   - Some legacy components (such as `mockPartnerProfiles` in `partner-service.ts`) contain static mock data used as offline fallbacks when no backend connection is present. While functional in offline mode, standardizing all UI components to strictly read from live PostgreSQL through the API Gateway is recommended in a future refactor.

2. **Aadhaar Vault Integration**:
   - In accordance with UIDAI compliance guidelines, Aadhaar numbers are currently masked with `XXXX-XXXX-1234` and raw document blobs are sanitized. Full integration with a certified external Aadhaar Vault / DigiLocker API is an enterprise roadmap milestone separate from the core operational KYC workflow.

3. **Multi-Factor Auth (MFA) for Company Console Super Admins**:
   - Company Console currently relies on JWT authentication with role-based guard. Adding mandatory TOTP/WebAuthn hardware key support for Super Admins performing KYC approvals can be scheduled in the next security hardening sprint.
