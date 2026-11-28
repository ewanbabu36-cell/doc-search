# DOC SEARCH — PHASE 5: DATA MIGRATION RISK REPORT (`DOC_SEARCH_PHASE_5_DATA_MIGRATION_RISK_REPORT.md`)

**Phase:** Phase 5 — Patient 360 + Universal IDs + Clinical Data Continuity
**Status:** `ZERO-DESTRUCTIVE MIGRATION VERIFIED`

---

## 1. Schema & Existing Data Compatibility Evaluation

1. **Existing Tables Preserved (`clinical.patients`, `clinical.patient_contacts`, `clinical.encounters`, `clinical.encounter_queues`, `clinical.consultations`, `clinical.lab_orders`, `clinical.pharmacy_prescriptions`, `clinical.billing_invoices`, `core.audit_events`)**:
   - All existing primary keys (`UUID`), foreign keys, and tenant indices (`uq_patients_tenant_mrn`, `idx_patient_contacts_tenant_primary_mobile_uidx`) are preserved without destructive DDL changes.
2. **Legacy MRN & Business Number Compatibility**:
   - Existing patients with `MRN-XXXXXX` or `MRN-YYYY-NNNNNN` remain 100% readable and valid. New registrations use deterministic `MRN-YYYY-NNNNNN` sequences per `(tenantId)`.
3. **Zero Silent Patient Merges or Reassignments**:
   - In accordance with Section 4 & Section 26 (`Never silently discard records. Never silently merge patients. Never silently reassign clinical records`), automated destructive patient merge is NOT performed; conflicting MRNs across distinct patient demographics fail closed with `409 Conflict (DUPLICATE_MRN_COLLISION)`.
4. **Rollback Strategy**:
   - Because Phase 5 reuses the existing PostgreSQL tables (`clinical.*` and `core.*`) and adds non-destructive continuity validation and read-projection services (`Patient360ContinuityService`), zero destructive schema rollback is required.
