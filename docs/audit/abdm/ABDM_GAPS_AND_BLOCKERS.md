# ABDM Real Sandbox Gaps and Blockers Audit

## Executive Blocker Notice
> [!IMPORTANT]
> In accordance with Rule 11 and Rule 12 ("If sandbox credentials/configuration are missing, report BLOCKED — do not simulate success. Never convert BLOCKED into PASS."), the live external sandbox HTTP calls to the National Health Authority (NHA) Gateway cannot be completed in this environment due to missing live NHA sandbox API credentials.

---

## 1. Critical Environmental Blockers

| Blocker ID | Parameter Name | Description | Severity | Remediation Required |
| :--- | :--- | :--- | :--- | :--- |
| **BLK-ABDM-01** | `ABDM_CLIENT_ID` | NHA Sandbox Developer Portal Client ID | **CRITICAL (P0)** | Register on `https://sandbox.abdm.gov.in` and inject valid Client ID into environment variables. |
| **BLK-ABDM-02** | `ABDM_CLIENT_SECRET` | NHA Sandbox Developer Portal Client Secret | **CRITICAL (P0)** | Retrieve Client Secret from ABDM Sandbox Console and inject into environment. |
| **BLK-ABDM-03** | `ABDM_BASE_URL` | NHA ABDM Gateway URL | **HIGH (P1)** | Set to `https://dev.abdm.gov.in/gateway` or equivalent NHA sandbox gateway URL. |
| **BLK-ABDM-04** | `ABDM_HIP_ID` / `ABDM_HIU_ID` | Bridge / Facility Bridge Identifiers | **HIGH (P1)** | Configure registered Facility HFR / Bridge IDs in `apps/api-gateway/src/config/env.ts`. |
| **BLK-ABDM-05** | Public Callback FQDN | Public TLS Webhook Endpoint for NHA Callbacks | **HIGH (P1)** | Requires public reverse proxy / tunneling (e.g. NGINX with public static IP or ngrok) for NHA to deliver `/v0.5/care-contexts/on-discover` callbacks. |

---

## 2. Internal Readiness vs External Sandbox Connectivity

* **Internal Architecture Readiness**: **100% READY**
  * All internal Fastify REST endpoints, repository tables, cryptographic audit hashing, NRCES FHIR R4 compilers, and ECDH Diffie-Hellman cryptographic routines are fully built and verified (15/15 vertical slice tests pass).
* **External Sandbox Connectivity**: **BLOCKED**
  * External network calls to `dev.abdm.gov.in` cannot authenticate without NHA client credentials.
