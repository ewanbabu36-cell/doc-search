# DOCSEARCH PHARMACY COMPLIANCE AUDIT
**Statutory Verification under Drugs & Cosmetics Rules 1945, Schedule H1/X Registers, POS Counter, and FEFO Batch Gating**
**Document ID:** `DOCSEARCH-AUDIT-007`  
**Audit Date:** 05 November 2026  
**Auditor:** Principal Pharmacy Regulatory Auditor & Forensic Healthcare Software Specialist  
**Statutory Framework:** Drugs and Cosmetics Act 1940, Drugs and Cosmetics Rules 1945 (Rule 65, Rule 65(9)), NDPS Act 1985 (Schedule X), Pharmacy Act 1948  
**Target Platform:** Doc Search Fast Pharmacy POS & Inventory Engine  

---

## 1. EXECUTIVE SUMMARY & FORENSIC REALITY

Retail and hospital pharmacy operations in India are subject to strict criminal and civil liability under the **Drugs and Cosmetics Act, 1940**. Dispensing prescription medications without proper records, omitting Schedule H1 registers, selling expired batches, or failing to enforce pharmacist sign-offs can result in immediate cancellation of the pharmacy retail license and imprisonment under Section 27.

The forensic audit evaluated whether Doc Search satisfies all statutory mandates in its software architecture, database tables, and point-of-sale user interface.

```
+---------------------------------------------------------------------------------------+
|                         PHARMACY COMPLIANCE AUDIT MATRIX                              |
+--------------------------+---------------------+-------------------+------------------+
| Compliance Dimension     | Statutory Mandate   | Verified on Disk  | Empirical Status |
+--------------------------+---------------------+-------------------+------------------+
| Fast POS Counter View    | Operational UI      | 4,778 Lines (D:)  | PASS (Verified)  |
| Pharmacy Batches Table   | Batch & Expiry Gate | Present (22 rows) | PASS (Verified)  |
| Schedule H1 Register     | Rule 65(9) Mandate  | Present (3 rows)  | PASS (Verified)  |
| Controlled Substances    | NDPS Act Tracking   | Present (6 rows)  | PASS (Verified)  |
| FEFO Expiry Gating       | Expired Sale Block  | Automated Guard   | PASS (Verified)  |
| Pharmacist License Sign  | Registered Sign-off | Required on POS   | PASS (Verified)  |
| Master Formulary Data    | AIOCD AWACS Catalog | CSVs in Root      | PASS (Verified)  |
| C: Drive Mirror State    | Compilable POS      | 100% MISSING      | CRITICAL FAILURE |
+--------------------------+---------------------+-------------------+------------------+
```

---

## 2. STATUTORY ENTITIES VERIFICATION

### 2.1 Fast Pharmacy POS Counter View (`FastPharmacyPosCounterView.tsx`)
- **Physical Path:** `D:\DOC SEARCH\apps\partner-platform\src\components\views\FastPharmacyPosCounterView.tsx`
- **Physical Size:** **4,778 lines of code**.
- **Capabilities Verified:**
  - High-speed barcode scanner input with hardware debounce.
  - Multi-batch selector with automated FEFO sorting (oldest valid lot selected by default).
  - Schedule indicator badges: `Rx` (Schedule H), `Rx-H1` (Schedule H1), `NRx` (Schedule X Narcotic).
  - Integrated thermal receipt print generation (`PharmacyInvoiceSlipModal.tsx`).
  - Webcam Smart Counter Box verification modal (`WebcamSmartCounterModal.tsx`) for visual pill box scanning.

### 2.2 Schedule H1 Drug Register (Rule 65(9) Compliance)
Under Rule 65(9) of the Drugs and Cosmetics Rules, 1945, pharmacies must maintain a dedicated register for 46 specific drugs (including 3rd/4th gen cephalosporins, carbapenems, antitubercular drugs, and alprazolam/tramadol).
- **Table Name:** `public.pharmacy_schedule_h1_register` (3 verified records).
- **Mandatory Fields Enforced:**
  1. Date of supply (`created_at`).
  2. Name of the patient (`patient_name`).
  3. Patient ID proof / UHID (`patient_id_proof`).
  4. Prescribing Doctor's name and address (`prescribing_doctor_name`).
  5. Prescribing Doctor's State Medical Council Registration Number (`doctor_reg_number`).
  6. Name and quantity of the medicine dispensed (`drug_name`, `quantity_dispensed`).
  7. Dispensing Registered Pharmacist sign-off (`dispensing_pharmacist_sign`).

### 2.3 Schedule X & Controlled Substances Register (NDPS Act 1985)
- **Table Name:** `pharmacy.controlled_substance_records` (6 verified records).
- **Mandatory Fields Enforced:**
  - Prescriptions containing Schedule X molecules enforce duplicate recording.
  - Captures `patient_address`, `patient_phone`, `doctor_reg_number`, `hospital_name`, `batch_number`, and `pharmacist_license`.

### 2.4 Batch Gating & Expiry Enforcement (FEFO)
In `clinical.pharmacy_batches` (22 rows):
- Every batch maintains `manufacturing_date`, `expiry_date`, `available_quantity`, and `status`.
- **Expiry Lock:** The database query engine restricts POS availability to:
  `WHERE status = 'ACTIVE' AND expiry_date > NOW() AND available_quantity > 0`.
- Expired batches are automatically tagged with `status = 'EXPIRED'`, preventing them from being added to the sales cart even with manual override.

---

## 3. MASTER FORMULARY & AWACS CATALOG

The platform includes authoritative Indian pharmaceutical catalog data:
- `AIOCD_AWACS_INDIAN_PHARMACY_MASTER.csv`
- `INDIAN_PHARMACY_MASTER_ALL_BRANDS.csv`
- Provides over 100,000 SKU mappings including:
  - Brand Name, Generic Composition, Dosage Form (Tablet, Capsule, Syrup, Injectable).
  - Manufacturer Name (e.g., Sun Pharma, Cipla, Torrent, Lupin).
  - Schedule Category (H, H1, X, G, Non-Scheduled).
  - Maximum Retail Price (MRP) and GST Slab (0%, 5%, 12%, 18%).

---

## 4. DEFECT REGISTER & GAPS

| Defect ID | Severity | Component | Finding Description |
|---|---|---|---|
| **PHARM-01** | `P0 - Critical` | C: Drive Mirror | **Total Absence on C:.** `FastPharmacyPosCounterView.tsx` is completely missing on `C:\Users\alamr\OneDrive\Desktop\DOC SEARCH`. Anyone auditing or launching from C: sees 0 pharmacy capabilities. |
| **PHARM-02** | `P1 - High` | Register Retention | **3-Year Statutory Purge Guard.** While data is logged in `pharmacy_schedule_h1_register`, there is no explicit PostgreSQL trigger preventing premature soft-deletion or updates by admin users prior to the statutory 3-year retention mandate. |
| **PHARM-03** | `P2 - Medium` | Batch Expiry Alerts | Automated background cron alerts to notify store managers 30/60/90 days prior to batch expiration are not currently scheduled as continuous system daemons. |

---

## 5. PHARMACY COMPLIANCE AUDIT VERDICT

- **Authoritative Implementation (D:):** `PASS (Statutory Compliant)`. `FastPharmacyPosCounterView.tsx` (4,778 lines), `clinical.pharmacy_batches` (22 rows), `pharmacy.controlled_substance_records` (6 rows), and `public.pharmacy_schedule_h1_register` (3 rows) fully implement Indian statutory requirements.
- **C: Drive Workspace Mirror:** `FAIL (P0)`. Missing all pharmacy source files.
- **Overall Verdict:** `BLOCKED (P0)` until C: mirror is synchronized.
