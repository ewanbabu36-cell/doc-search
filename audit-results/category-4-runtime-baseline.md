# DOC SEARCH — CATEGORY 4: RUNTIME ERROR BASELINE AUDIT REPORT

**Date & Time:** 2026-09-28T16:44:13.833Z  
**Audit Category:** CATEGORY 4 — RUNTIME EXECUTION ERRORS  
**Execution Engine:** Native PostgreSQL 18.4 + Fastify API Gateway + Vite + Headless Google Chrome (CDP)  
**Execution Duration:** 20.00s  

---

## 1. EXECUTIVE SUMMARY

| Metric | Baseline Value |
|---|---|
| **Total Runtime Checks Executed** | **34** |
| **Checks Passed** | **34** |
| **Checks Failed** | **0** |
| **Runtime Errors Found (BASELINE)** | **0** |

---

## 2. TOPOLOGY & SERVICE HEALTH AUDIT

- **Native PostgreSQL 18.4 Engine:**
  - Status: **HEALTHY**
  - Database: `docsearch`
  - Encoding: `UTF8`
  - Live Tables: **496**
  - Socket: `127.0.0.1:5432`
- **API Gateway (Port 4000):** HTTP 200
- **Partner Platform (Port 5173):** HTTP 200
- **Company Platform (Port 5174):** HTTP 200
- **Landing Page (Port 5175):** HTTP 200
- **Unified Gateway (Port 3000):** HTTP 200

---

## 3. LIVE API DOMAIN RUNTIME AUDIT (LIVE NATIVE POSTGRESQL)

| Domain | Endpoint / Scenario | Status | HTTP | Details |
|---|---|---|---|---|
| AUTH | GET /api/v1/auth/registration-form-config | ✅ PASS | 200 | Verified with Native PostgreSQL |
| AUTH | GET /api/v1/auth/me (Doctor Profile Hydration) | ✅ PASS | 200 | Verified with Native PostgreSQL |
| CLINICAL | POST /api/v1/partner/clinical/patients (Create Patient) | ✅ PASS | 201 | Verified with Native PostgreSQL |
| CLINICAL | GET /api/v1/partner/clinical/patients (List Patients) | ✅ PASS | 200 | Verified with Native PostgreSQL |
| CLINICAL | GET /api/v1/partner/clinical/patients/:id (Retrieve Patient) | ✅ PASS | 200 | Verified with Native PostgreSQL |
| CLINICAL | POST /api/v1/partner/clinical/encounters (Start Encounter) | ✅ PASS | 201 | Verified with Native PostgreSQL |
| PATIENT_360 | GET /api/v1/partner/patient-360/:id (Longitudinal Record) | ✅ PASS | 200 | Verified with Native PostgreSQL |
| LAB_DIAGNOSTICS | GET /api/v1/partner/lab/orders (LIMS Order List) | ✅ PASS | 200 | Verified with Native PostgreSQL |
| RADIOLOGY | GET /api/v1/partner/radiology/orders (RIS Order List) | ✅ PASS | 200 | Verified with Native PostgreSQL |
| PHARMACY | GET /api/v1/partner/pharmacy/inventory (Drug Stock) | ✅ PASS | 200 | Verified with Native PostgreSQL |
| PHARMACY | GET /api/v1/partner/pharmacy/prescriptions (Prescriptions Queue) | ✅ PASS | 200 | Verified with Native PostgreSQL |
| BILLING | GET /api/v1/partner/billing/invoices (Invoices List) | ✅ PASS | 200 | Verified with Native PostgreSQL |
| COMPANY_HQ | GET /api/v1/auth/verification-queue (HQ Onboarding Queue) | ✅ PASS | 200 | Verified with Native PostgreSQL |
| COMPANY_HQ | GET /api/v1/company/licenses (Commercial Licenses List) | ✅ PASS | 200 | Verified with Native PostgreSQL |

---

## 4. DATABASE DIRECT ROW PERSISTENCE PROOF

- **Patient Record Created:** `eaa331fc-63b0-4e1b-9687-18ffb5f76d36`
- **PostgreSQL Direct Query Verification:** ✅ PROVEN IN POSTGRESQL DISK
- **Persisted Record:**
```json
{
  "id": "eaa331fc-63b0-4e1b-9687-18ffb5f76d36",
  "first_name": "Ananya",
  "last_name": "Deshmukh-1790613854608",
  "mrn": "MRN-RT-1790613854608",
  "tenant_id": "11111111-1111-4111-8111-111111111111",
  "date_of_birth": "1990-08-24",
  "gender": "FEMALE",
  "blood_group": "B_POSITIVE"
}
```

---

## 5. CROSS-SESSION INDEPENDENT PERSISTENCE AUDIT

- **Session A Patient ID:** `eaa331fc-63b0-4e1b-9687-18ffb5f76d36`
- **Session B Independent Read Status:** HTTP 200
- **Data Equality (Session A === Session B):** ✅ 100% IDENTICAL

---

## 6. REAL-BROWSER HEADLESS CHROME AUDIT (CDP)

- Google Chrome headless automated testing via Chrome DevTools Protocol (CDP port 9222).
- Zero White Screen of Death verified on Landing Page (5175), Company Platform (5174), and Partner Platform (5173).
- Authenticated state hydration and page reload verified on Partner Platform.
- Zero fatal React render crashes across browser execution.

---

## 7. FAILURE RESILIENCE & ERROR HANDLING

- **Reject Malformed JSON Body (HTTP 400, not 500):** ✅ PASS (Status: 400)
- **Reject Missing Token on Protected Route (HTTP 401, not 500):** ✅ PASS (Status: 401)
- **Reject Tampered Token Signature (HTTP 401, not 500):** ✅ PASS (Status: 401)
- **Graceful 404 for Non-Existent Patient UUID (HTTP 404, not 500):** ✅ PASS (Status: 404)
- **Prevent Cross-Tenant Patient Access (HTTP 403/404, not 500):** ✅ PASS (Status: 403)

---

## 8. BASELINE CONCLUSION

**RUNTIME_ERRORS_BASELINE = 0**
