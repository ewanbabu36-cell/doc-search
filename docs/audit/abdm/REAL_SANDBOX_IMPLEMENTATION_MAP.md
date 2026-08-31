# ABDM Real Sandbox Implementation Map — Domain 3.2 (M1, M2, M3)

## 1. Architectural & Configuration Overview

| Configuration Parameter | Value in Current Codebase | Status / Gap Analysis |
| :--- | :--- | :--- |
| **NHA ABDM Sandbox Gateway URL** | `https://dev.abdm.gov.in/gateway` (Target) | **MISSING IN ENV** (`ABDM_BASE_URL` not configured) |
| **Client ID (Sandbox Client ID)** | `null` | **MISSING IN ENV** (`ABDM_CLIENT_ID` not configured) |
| **Client Secret (Sandbox Client Secret)** | `null` | **MISSING IN ENV** (`ABDM_CLIENT_SECRET` not configured) |
| **HIP ID (Facility Health Information Provider)** | `IN0710002981` (Hardcoded facility fallback) | **NEEDS ENV INJECTION** (`ABDM_HIP_ID`) |
| **HIU ID (Facility Health Information User)** | `HIU-001` (Hardcoded fallback) | **NEEDS ENV INJECTION** (`ABDM_HIU_ID`) |
| **Callback Inbound Webhook Base URL** | `/api/v1/abdm/callback/*` | **MOUNTED & ACTIVE** (Port 4000) |
| **Public Key Exchange Protocol** | `ECDH (prime256v1)` + `AES-GCM-256` | **IMPLEMENTED** in `AbdmGatewayService` |
| **FHIR Profile & Version** | NRCES India FHIR R4 (`https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle`) | **IMPLEMENTED & STRUCTURED** |
| **Cryptographic Audit Chaining** | SHA-256 hash linking (`previousHash::payload`) | **IMPLEMENTED & ACTIVE** |

---

## 2. Milestone API Endpoint Inventory

### Milestone 1 (M1): ABHA Creation & e-KYC
* **Internal Route**: `POST /api/v1/partner/abdm/m1/generate-aadhaar-otp`
  * **Target Sandbox API**: `POST https://dev.abdm.gov.in/gateway/v0.5/identity/aadhaar/generateOtp`
* **Internal Route**: `POST /api/v1/partner/abdm/m1/verify-aadhaar-otp`
  * **Target Sandbox API**: `POST https://dev.abdm.gov.in/gateway/v0.5/identity/aadhaar/verifyOTP`
* **Internal Route**: `POST /api/v1/partner/abdm/m1/search-by-health-id`
  * **Target Sandbox API**: `POST https://dev.abdm.gov.in/gateway/v0.5/patients/profile/share`

### Milestone 2 (M2): HIP Care Contexts & Scan and Share
* **Internal Route**: `POST /api/v1/partner/abdm/m2/care-contexts`
  * **Target Sandbox API**: `POST https://dev.abdm.gov.in/gateway/v0.5/links/link/add-contexts`
* **Internal Route**: `POST /api/v1/partner/abdm/m2/scan-and-share`
  * **Target Sandbox API**: `POST https://dev.abdm.gov.in/gateway/v1.0/patients/profile/share`
* **Public Callback**: `POST /api/v1/abdm/callback/v0.5/care-contexts/on-discover`
  * **Inbound From**: NHA Gateway Callback Dispatcher

### Milestone 3 (M3): HIU Consents & Encrypted FHIR R4 Transfer
* **Internal Route**: `POST /api/v1/partner/abdm/m3/consent-requests`
  * **Target Sandbox API**: `POST https://dev.abdm.gov.in/gateway/v0.5/consent-requests/init`
* **Internal Route**: `POST /api/v1/partner/abdm/m3/fhir-bundles/generate`
  * **FHIR Compiler**: NRCES FHIR R4 Bundle generator with digital signature
* **Internal Route**: `POST /api/v1/partner/abdm/m3/health-information/request`
  * **Target Sandbox API**: `POST https://dev.abdm.gov.in/gateway/v0.5/health-information/hip/request`
* **Public Callback**: `POST /api/v1/abdm/callback/v0.5/consents/on-notify`
  * **Inbound From**: NHA Gateway Consent Manager
