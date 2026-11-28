# DOC SEARCH — PHASE 23 KPI CATALOG

**Document ID**: `DOC_SEARCH_PHASE23_KPI_CATALOG`  
**Phase**: Phase 23 — Command Center + BI  
**Author**: Phase 23 Data Governance Lead & ERP Analytics Auditor  
**Date**: September 27, 2026  
**Git Commit**: `2576d660eb8dd3e580952615defd5d440a585126`  
**Classification**: Enterprise BI & Analytics Metric Registry  

---

## 1. Governance Standard

Every operational metric in the DOC SEARCH platform is cataloged with strict deterministic definitions. No metric may be rendered on any dashboard without an entry in this catalog. All metrics must originate from authoritative PostgreSQL relational tables and enforce tenant isolation.

---

## 2. Partner Command Center KPIs

### 2.1 Patient & Clinical Operations

#### `METRIC-PT-001`: Total Registered Patients
* **metricId**: `METRIC-PT-001`
* **metricName**: Total Registered Patients
* **definition**: Cumulative count of unique patient master records registered under the tenant.
* **formula**: $\text{COUNT}(id) \text{ WHERE tenant\_id} = T \text{ AND deleted\_at IS NULL}$
* **sourceOfTruth**: PostgreSQL `clinical.patients`
* **tables**: `clinical.patients`
* **service**: `CommandCenterService.getPatientAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: All Tenant Branches
* **departmentScope**: Hospital-Wide
* **roles**: `HOSPITAL_ADMIN`, `CHIEF_MEDICAL_OFFICER`, `RECEPTIONIST`, `DOCTOR`
* **refreshPolicy**: On-Demand / Real-Time
* **timezone**: UTC Storage / Local Display (Asia/Kolkata)
* **dataFreshness**: Live (Query Time)
* **reconciliationRule**: Must match `SELECT COUNT(*) FROM clinical.patients WHERE tenant_id = T`
* **owner**: Head of Medical Records (MRD)
* **version**: `1.0.0`

#### `METRIC-OPD-001`: Completed OPD Consultations
* **metricId**: `METRIC-OPD-001`
* **metricName**: Completed OPD Consultations
* **definition**: Count of outpatients whose consultation was marked as completed within the selected time window.
* **formula**: $\text{COUNT}(id) \text{ WHERE tenant\_id} = T \text{ AND status} = \text{'COMPLETED'} \text{ AND created\_at} \in [\text{start}, \text{end}]$
* **sourceOfTruth**: PostgreSQL `clinical.appointments_partitioned` & `clinical.consultations`
* **tables**: `clinical.appointments_partitioned`, `clinical.consultations`
* **service**: `CommandCenterService.getOpdAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Branch-Specific
* **departmentScope**: Outpatient Departments
* **roles**: `HOSPITAL_ADMIN`, `CHIEF_MEDICAL_OFFICER`, `DOCTOR`, `OPD_NURSE`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Reconciles with `clinical.consultations` count for period.
* **owner**: OPD Clinical Director
* **version**: `1.0.0`

#### `METRIC-IPD-001`: Inpatient Bed Occupancy Rate
* **metricId**: `METRIC-IPD-001`
* **metricName**: Inpatient Bed Occupancy Percentage
* **definition**: Proportion of operational hospital beds currently occupied by active admitted patients.
* **formula**: $\left(\frac{\text{COUNT}(\text{beds WHERE status} = \text{'OCCUPIED'})}{\text{COUNT}(\text{total operational beds})}\right) \times 100$
* **sourceOfTruth**: PostgreSQL `clinical.inpatient_beds`
* **tables**: `clinical.inpatient_beds`, `clinical.inpatient_admissions`
* **service**: `CommandCenterService.getIpdAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Facility / Ward Specific
* **departmentScope**: Inpatient Wards, ICU, CCU
* **roles**: `HOSPITAL_ADMIN`, `NURSING_SUPERVISOR`, `CHIEF_MEDICAL_OFFICER`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Occupied bed count must equal count of active admissions where `status = 'ADMITTED'`.
* **owner**: Inpatient Nursing Directorate
* **version**: `1.0.0`

---

### 2.2 Diagnostic Operations (LIMS & RIS)

#### `METRIC-LAB-001`: Pending Specimen Collection Queue
* **metricId**: `METRIC-LAB-001`
* **metricName**: Pending Specimen Collection Queue
* **definition**: Count of active diagnostic test orders awaiting phlebotomy or specimen accessioning.
* **formula**: $\text{COUNT}(id) \text{ WHERE tenant\_id} = T \text{ AND status} \in [\text{'ORDERED'}] \text{ AND created\_at} \in [\text{start}, \text{end}]$
* **sourceOfTruth**: PostgreSQL `clinical.investigation_orders`
* **tables**: `clinical.investigation_orders`
* **service**: `CommandCenterService.getLabAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Diagnostic Lab Facility
* **departmentScope**: Pathology / LIMS
* **roles**: `LAB_TECHNICIAN`, `PATHOLOGIST`, `HOSPITAL_ADMIN`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Reconciles with active phlebotomy worklist queue.
* **owner**: Laboratory Director
* **version**: `1.0.0`

#### `METRIC-LAB-002`: Critical Panic Value Alert Count
* **metricId**: `METRIC-LAB-002`
* **metricName**: Critical Panic Value Alerts
* **definition**: Count of lab results exceeding physiological safety thresholds requiring immediate clinician notification.
* **formula**: $\text{COUNT}(id) \text{ WHERE tenant\_id} = T \text{ AND created\_at} \in [\text{start}, \text{end}]$
* **sourceOfTruth**: PostgreSQL `clinical.critical_panic_value_alerts`
* **tables**: `clinical.critical_panic_value_alerts`
* **service**: `CommandCenterService.getLabAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Facility-Specific
* **departmentScope**: Pathology / Emergency / ICU
* **roles**: `PATHOLOGIST`, `CHIEF_MEDICAL_OFFICER`, `DUTY_DOCTOR`
* **refreshPolicy**: Instant Push / Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Must match total entries in `clinical.critical_panic_value_alerts`.
* **owner**: Chief of Laboratory Medicine
* **version**: `1.0.0`

#### `METRIC-RAD-001`: Finalized Radiology Reports
* **metricId**: `METRIC-RAD-001`
* **metricName**: Finalized Radiology Reports
* **definition**: Count of imaging studies completed and digitally finalized by a qualified radiologist.
* **formula**: $\text{COUNT}(id) \text{ WHERE tenant\_id} = T \text{ AND status} \in [\text{'FINALIZED'}, \text{'REPORTED'}] \text{ AND ordered\_at} \in [\text{start}, \text{end}]$
* **sourceOfTruth**: PostgreSQL `clinical.radiology_orders`
* **tables**: `clinical.radiology_orders`, `clinical.radiology_reports`
* **service**: `CommandCenterService.getRadiologyAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Radiology Department / Imaging Center
* **departmentScope**: Radiology / RIS
* **roles**: `RADIOLOGIST`, `CHIEF_MEDICAL_OFFICER`, `HOSPITAL_ADMIN`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Reconciles with count of finalized radiology report rows.
* **owner**: Head of Radiology & Imaging
* **version**: `1.0.0`

---

### 2.3 Pharmacy & Supply Chain

#### `METRIC-PHARM-001`: Retail Prescriptions Dispensed
* **metricId**: `METRIC-PHARM-001`
* **metricName**: Retail Prescriptions Dispensed
* **definition**: Count of prescription dispensing orders fulfilled via FEFO batch allocation.
* **formula**: $\text{COUNT}(id) \text{ WHERE tenant\_id} = T \text{ AND dispensing\_status} \in [\text{'DISPENSED'}, \text{'COMPLETED'}] \text{ AND created\_at} \in [\text{start}, \text{end}]$
* **sourceOfTruth**: PostgreSQL `clinical.pharmacy_dispensing`
* **tables**: `clinical.pharmacy_dispensing`
* **service**: `CommandCenterService.getPharmacyAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Pharmacy Dispensary
* **departmentScope**: Retail Pharmacy
* **roles**: `PHARMACIST`, `HOSPITAL_ADMIN`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Reconciles with dispensing audit ledger records.
* **owner**: Chief Pharmacist
* **version**: `1.0.0`

#### `METRIC-INV-001`: Total Pharmacy Stock Valuation
* **metricId**: `METRIC-INV-001`
* **metricName**: Total Inventory Stock Valuation
* **definition**: Total monetary value (in INR) of all active unexpired inventory batches in warehouses.
* **formula**: $\sum (\text{current\_quantity} \times \text{unit\_cost}) \text{ WHERE tenant\_id} = T \text{ AND status} = \text{'ACTIVE'}$
* **sourceOfTruth**: PostgreSQL `clinical.supply_chain_batches`
* **tables**: `clinical.supply_chain_batches`, `clinical.supply_chain_inventory`
* **service**: `CommandCenterService.getInventoryAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Central Warehouse & Sub-Stores
* **departmentScope**: Supply Chain & Materials Management
* **roles**: `PROCUREMENT_MANAGER`, `CHIEF_FINANCIAL_OFFICER`, `HOSPITAL_ADMIN`
* **refreshPolicy**: Hourly / On-Demand
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Reconciles with batch ledger balance multiplied by unit cost.
* **owner**: Supply Chain Director
* **version**: `1.0.0`

#### `METRIC-INV-002`: Expiring Batch Radar (30 Days)
* **metricId**: `METRIC-INV-002`
* **metricName**: Batches Expiring in Next 30 Days
* **definition**: Count of active medication/consumable batches whose expiration date falls within 30 days.
* **formula**: $\text{COUNT}(id) \text{ WHERE tenant\_id} = T \text{ AND current\_quantity} > 0 \text{ AND expiry\_date} \le \text{NOW}() + 30\text{d}$
* **sourceOfTruth**: PostgreSQL `clinical.supply_chain_batches`
* **tables**: `clinical.supply_chain_batches`
* **service**: `CommandCenterService.getInventoryAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Warehouse / Dispensary
* **departmentScope**: Pharmacy / Supply Chain
* **roles**: `PHARMACIST`, `PROCUREMENT_MANAGER`
* **refreshPolicy**: Daily Batch / Real-Time Query
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Reconciles with batch expiration date audit.
* **owner**: Chief Pharmacist
* **version**: `1.0.0`

---

### 2.4 Financial & Revenue Management

#### `METRIC-FIN-001`: Gross Billed Revenue
* **metricId**: `METRIC-FIN-001`
* **metricName**: Gross Billed Revenue
* **definition**: Sum of all patient invoices generated before discounts and taxes.
* **formula**: $\sum (\text{total\_amount}) \text{ WHERE tenant\_id} = T \text{ AND created\_at} \in [\text{start}, \text{end}]$
* **sourceOfTruth**: PostgreSQL `clinical.billing_invoices`
* **tables**: `clinical.billing_invoices`
* **service**: `CommandCenterService.getRevenueAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Billing Counters / Cashiers
* **departmentScope**: Finance & Accounts
* **roles**: `BILLING_EXECUTIVE`, `FINANCE_SUPERVISOR`, `CHIEF_FINANCIAL_OFFICER`, `HOSPITAL_ADMIN`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Sum must equal `SUM(total_amount)` of all invoices in period.
* **owner**: CFO / Finance Director
* **version**: `1.0.0`

#### `METRIC-FIN-002`: Total Cash & Digital Collections
* **metricId**: `METRIC-FIN-002`
* **metricName**: Realized Payment Collections
* **definition**: Total currency actually collected via Cash, UPI, Card, Net Banking, or TPA.
* **formula**: $\sum (\text{amount}) \text{ WHERE tenant\_id} = T \text{ AND created\_at} \in [\text{start}, \text{end}]$
* **sourceOfTruth**: PostgreSQL `clinical.billing_payments`
* **tables**: `clinical.billing_payments`
* **service**: `CommandCenterService.getRevenueAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Cashier Desks
* **departmentScope**: Treasury & Billing
* **roles**: `FINANCE_SUPERVISOR`, `CHIEF_FINANCIAL_OFFICER`, `HOSPITAL_ADMIN`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Must match total payment records in `clinical.billing_payments`.
* **owner**: Finance Lead
* **version**: `1.0.0`

#### `METRIC-FIN-003`: Outstanding Accounts Receivable
* **metricId**: `METRIC-FIN-003`
* **metricName**: Outstanding Patient Due Balances
* **definition**: Uncollected balances on generated patient invoices.
* **formula**: $\sum (\text{due\_amount}) \text{ WHERE tenant\_id} = T \text{ AND created\_at} \in [\text{start}, \text{end}]$
* **sourceOfTruth**: PostgreSQL `clinical.billing_invoices`
* **tables**: `clinical.billing_invoices`
* **service**: `CommandCenterService.getRevenueAnalytics`
* **tenantScope**: Tenant-Specific
* **facilityScope**: Hospital-Wide
* **departmentScope**: Accounts Receivable / TPA
* **roles**: `FINANCE_SUPERVISOR`, `CHIEF_FINANCIAL_OFFICER`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: $\text{Gross Billed} - \text{Collections} - \text{Discounts} = \text{Receivables}$.
* **owner**: Revenue Cycle Director
* **version**: `1.0.0`

---

## 3. HQ Command Center KPIs

#### `METRIC-HQ-001`: Total Active Healthcare Partners
* **metricId**: `METRIC-HQ-001`
* **metricName**: Total Active Healthcare Partners
* **definition**: Count of verified, approved healthcare partner organizations actively operating on the platform.
* **formula**: $\text{COUNT}(id) \text{ WHERE lifecycle\_status} \in [\text{'ACTIVE'}, \text{'VERIFIED'}]$
* **sourceOfTruth**: PostgreSQL `company.partner_profiles` & `company.operational_partners`
* **tables**: `company.partner_profiles`, `company.operational_partners`
* **service**: `HqCommandCenterService.getPartnerLifecycleAnalytics`
* **tenantScope**: Cross-Tenant (HQ Governance Scope)
* **facilityScope**: Platform-Wide
* **departmentScope**: HQ Executive
* **roles**: `COMPANY_ADMIN`, `SUPER_ADMIN`, `FOUNDER`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Reconciles with active partners in `company.operational_partners`.
* **owner**: VP of Partner Growth
* **version**: `1.0.0`

#### `METRIC-HQ-002`: Expiring Commercial Licenses (30 Days)
* **metricId**: `METRIC-HQ-002`
* **metricName**: Licenses Expiring in 30 Days
* **definition**: Number of partner software licenses whose subscription term lapses within 30 calendar days.
* **formula**: $\text{COUNT}(id) \text{ WHERE status} = \text{'ACTIVE'} \text{ AND expiry\_date} \le \text{NOW}() + 30\text{d}$
* **sourceOfTruth**: PostgreSQL `company.licenses`
* **tables**: `company.licenses`
* **service**: `HqCommandCenterService.getLicensingSubscriptionAnalytics`
* **tenantScope**: Cross-Tenant (HQ)
* **facilityScope**: Platform-Wide
* **departmentScope**: Commercial Operations
* **roles**: `COMPANY_ADMIN`, `SUPER_ADMIN`, `SALES_DIRECTOR`
* **refreshPolicy**: Daily / Real-Time Query
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Reconciles with `LicenseService.getExpiringLicenses()`.
* **owner**: Head of Customer Success
* **version**: `1.0.0`

#### `METRIC-HQ-003`: Platform SaaS Revenue (ARR / MRR)
* **metricId**: `METRIC-HQ-003`
* **metricName**: Platform Subscription Revenue
* **definition**: Net revenue realized from partner subscription tier fees and add-on licenses.
* **formula**: $\sum (\text{final\_amount\_inr}) \text{ WHERE status} = \text{'PAID'} \text{ AND created\_at} \in [\text{start}, \text{end}]$
* **sourceOfTruth**: PostgreSQL `company.commercial_order_snapshots`
* **tables**: `company.commercial_order_snapshots`
* **service**: `HqCommandCenterService.getHqFinancialAnalytics`
* **tenantScope**: Cross-Tenant (HQ)
* **facilityScope**: Platform-Wide
* **departmentScope**: HQ Finance
* **roles**: `COMPANY_ADMIN`, `SUPER_ADMIN`, `FOUNDER`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Matches paid commercial snapshots in `company.commercial_order_snapshots`.
* **owner**: Chief Commercial Officer
* **version**: `1.0.0`

#### `METRIC-HQ-004`: Security & Audit Event Volume
* **metricId**: `METRIC-HQ-004`
* **metricName**: Security & Governance Telemetry Volume
* **definition**: Distribution of security log events categorised by severity level (`CRITICAL`, `ERROR`, `WARNING`, `INFO`).
* **formula**: $\text{COUNT}(id) \text{ GROUP BY severity WHERE timestamp} \in [\text{start}, \text{end}]$
* **sourceOfTruth**: PostgreSQL `core.audit_events`
* **tables**: `core.audit_events`
* **service**: `HqCommandCenterService.getSecurityGovernanceTelemetry`
* **tenantScope**: Cross-Tenant (HQ)
* **facilityScope**: Platform-Wide
* **departmentScope**: InfoSec & Compliance
* **roles**: `COMPANY_ADMIN`, `SUPER_ADMIN`, `CHIEF_INFORMATION_SECURITY_OFFICER`
* **refreshPolicy**: Real-Time
* **timezone**: UTC Storage / Local Display
* **dataFreshness**: Live
* **reconciliationRule**: Total matches sum of rows in `core.audit_events` for the specified time window.
* **owner**: Head of Information Security
* **version**: `1.0.0`
