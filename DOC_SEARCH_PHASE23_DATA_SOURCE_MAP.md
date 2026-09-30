# DOC SEARCH — PHASE 23 DATA SOURCE-OF-TRUTH MAP

**Document ID**: `DOC_SEARCH_PHASE23_DATA_SOURCE_MAP`  
**Phase**: Phase 23 — Command Center + BI  
**Author**: Phase 23 Principal Architect & Data Governance Lead  
**Date**: September 27, 2026  
**Git Commit**: `2576d660eb8dd3e580952615defd5d440a585126`  

---

## 1. Master Source-of-Truth Matrix

| KPI ID & Name | Source Domain | Authoritative Table | Owning Service | Calculation Formula | Tenant Scope | Required Role | Reconciliation Target |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **`METRIC-PT-001`** Registered Patients | Clinical Master | `clinical.patients` | `ClinicalWorkflowService` | $\text{COUNT}(id) \text{ WHERE tenant\_id} = T$ | Tenant | `HOSPITAL_ADMIN`, `RECEPTIONIST` | `clinical.patients` table count |
| **`METRIC-OPD-001`** Completed OPD | OPD Clinical | `clinical.appointments_partitioned` | `ClinicalWorkflowService` | $\text{COUNT}(id) \text{ WHERE status} = \text{'COMPLETED'}$ | Tenant | `DOCTOR`, `HOSPITAL_ADMIN` | `clinical.consultations` completed count |
| **`METRIC-IPD-001`** Bed Occupancy % | Inpatient / Bed | `clinical.inpatient_beds` | `InpatientManagementService` | $(\text{Occupied} / \text{Total}) \times 100$ | Tenant | `NURSING_SUPERVISOR`, `HOSPITAL_ADMIN` | Active `inpatient_admissions` rows |
| **`METRIC-LAB-001`** Pending Lab Orders | LIMS Pathology | `clinical.investigation_orders` | `LabDiagnosticsService` | $\text{COUNT}(id) \text{ WHERE status} = \text{'ORDERED'}$ | Tenant | `LAB_TECHNICIAN`, `PATHOLOGIST` | Phlebotomy worklist queue query |
| **`METRIC-LAB-002`** Panic Value Alerts | LIMS Critical | `clinical.critical_panic_value_alerts` | `LabDiagnosticsService` | $\text{COUNT}(id) \text{ in range}$ | Tenant | `PATHOLOGIST`, `DUTY_DOCTOR` | `critical_panic_value_alerts` count |
| **`METRIC-RAD-001`** Finalized Rad Reports | Radiology RIS | `clinical.radiology_orders` | `RadiologyService` | $\text{COUNT}(id) \text{ WHERE status} = \text{'FINALIZED'}$ | Tenant | `RADIOLOGIST`, `HOSPITAL_ADMIN` | Finalized `radiology_reports` count |
| **`METRIC-PHARM-001`** Dispensed Rx | Retail Pharmacy | `clinical.pharmacy_dispensing` | `PharmacyManagementService` | $\text{COUNT}(id) \text{ WHERE status} = \text{'DISPENSED'}$ | Tenant | `PHARMACIST`, `HOSPITAL_ADMIN` | Pharmacy dispensing ledger rows |
| **`METRIC-INV-001`** Inventory Valuation | Supply Chain | `clinical.supply_chain_batches` | `SupplyChainService` | $\sum (\text{qty} \times \text{unit\_cost})$ | Tenant | `PROCUREMENT_MANAGER`, `CFO` | Batch ledger multiplied by cost |
| **`METRIC-INV-002`** Expiring Batches (30d) | Supply Chain | `clinical.supply_chain_batches` | `SupplyChainService` | $\text{COUNT}(id) \text{ WHERE expiry} \le \text{NOW}() + 30\text{d}$ | Tenant | `PHARMACIST`, `PROCUREMENT_MANAGER` | Stock batch expiry audit |
| **`METRIC-FIN-001`** Gross Billed Revenue | Billing & RCM | `clinical.billing_invoices` | `BillingManagementService` | $\sum (\text{total\_amount})$ | Tenant | `FINANCE_SUPERVISOR`, `CFO` | Total generated invoices in period |
| **`METRIC-FIN-002`** Payments Collected | Cashier Treasury | `clinical.billing_payments` | `BillingManagementService` | $\sum (\text{amount})$ | Tenant | `FINANCE_SUPERVISOR`, `CFO` | `billing_payments` cash drawer sum |
| **`METRIC-FIN-003`** Outstanding AR | Billing Due | `clinical.billing_invoices` | `BillingManagementService` | $\sum (\text{due\_amount})$ | Tenant | `FINANCE_SUPERVISOR`, `CFO` | Unpaid balance on invoices |
| **`METRIC-HQ-001`** Active Partners | Partner Master | `company.partner_profiles` | `PartnerGovernanceService` | $\text{COUNT}(id) \text{ WHERE status} = \text{'ACTIVE'}$ | Cross-Tenant (HQ) | `COMPANY_ADMIN`, `SUPER_ADMIN` | `company.operational_partners` count |
| **`METRIC-HQ-002`** Expiring Licenses (30d) | Commercial | `company.licenses` | `LicenseService` | $\text{COUNT}(id) \text{ WHERE expiry} \le \text{NOW}() + 30\text{d}$ | Cross-Tenant (HQ) | `COMPANY_ADMIN`, `SALES_DIRECTOR` | Active licenses expiry query |
| **`METRIC-HQ-003`** Platform SaaS Revenue | HQ Commercial | `company.commercial_order_snapshots` | `CommercialFinanceService` | $\sum (\text{final\_amount\_inr}) \text{ WHERE status} = \text{'PAID'}$ | Cross-Tenant (HQ) | `COMPANY_ADMIN`, `CFO` | Paid commercial order snapshots |
| **`METRIC-HQ-004`** Security Telemetry | Security Audit | `core.audit_events` | `AuditRepository` | $\text{COUNT}(id) \text{ GROUP BY severity}$ | Cross-Tenant (HQ) | `COMPANY_ADMIN`, `CISO` | Immutable hash-chained audit rows |
| **`METRIC-AI-001`** AI Request Telemetry | AI Gateway | `core.ai_request_registry` | `AiGatewayService` | $\text{COUNT}(id), \text{AVG}(latency\_ms)$ | Tenant / HQ | `HOSPITAL_ADMIN`, `COMPANY_ADMIN` | `core.ai_request_registry` rows |

---

## 2. Unknown / Non-Implemented Metric Registry

In strict adherence to Phase 23 Section 6, the following metrics currently have **NO authoritative transactional source table** in PostgreSQL and are formally classified as **NOT IMPLEMENTED** (never fabricated):

1. **`METRIC-UNIMPL-01`: Speculative Patient No-Show Predictor**
   * *Status*: **NOT IMPLEMENTED**
   * *Rationale*: Predictive ML model for patient no-show probabilities is not backed by an active ML scoring pipeline.
2. **`METRIC-UNIMPL-02`: Real-Time Biomedical Equipment Power Draw / IoT Sensor Metrics**
   * *Status*: **NOT IMPLEMENTED**
   * *Rationale*: Physical IoT telemetry hardware is not provisioned; hardware power metrics are not stored in database.
3. **`METRIC-UNIMPL-03`: Predictive Churn Probability for SaaS Partners**
   * *Status*: **NOT IMPLEMENTED**
   * *Rationale*: AI churn predictions without historical churn datasets are speculative and prohibited by Section 16.
