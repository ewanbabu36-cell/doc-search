# DOC SEARCH — Phase 2.18 Dietary Test Strategy

### 1. Test Automation Architecture
The Phase 2.18 Dietary automated test suite is implemented in `apps/api-gateway/test/wave5-dietary-domain.test.mjs` and executed directly in CI via Node.js Test Runner.

### 2. Verified Test Cases (15/15 PASS - 100%)
- **TEST 01**: `GET /api/v1/partner/dietary/overview` telemetry and live KPI aggregations.
- **TEST 02**: `POST /api/v1/partner/dietary/kitchens` production kitchen creation.
- **TEST 03**: `GET /api/v1/partner/dietary/diet-types` therapeutic diet listing.
- **TEST 04**: Patient assessment creation and dietitian finalization lifecycle.
- **TEST 05**: Diet order creation and approval state machine.
- **TEST 06**: **Clinical Allergen Safety Gate** (Rejection on allergen conflict).
- **TEST 07**: Production planning and floor release.
- **TEST 08**: **Quality Check Safety Gate** (Blocking on inspection failure).
- **TEST 09**: **NPO Safety Gate** (Blocking meal dispatch for NPO patients).
- **TEST 10**: Valid tray assembly, dispatch, and bedside delivery confirmation.
- **TEST 11**: Patient meal refusal tracking with clinical reason.
- **TEST 12**: Billing and procurement reference linkage.
- **TEST 13**: Cross-tenant isolation enforcement (403 Forbidden).
- **TEST 14**: Unauthenticated request protection (401 Unauthorized).
- **TEST 15**: Granular RBAC permission enforcement (403 Forbidden).
