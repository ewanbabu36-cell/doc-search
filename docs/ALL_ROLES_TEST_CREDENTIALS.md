# 🛡️ DocSearch Enterprise: Master Role Credentials & Testing Vault

This document contains the authoritative catalog of all **20 Industry-Standard Roles** across the DocSearch Enterprise HealthTech Platform, including their **User ID / Login Emails, Passwords, Clearance Levels, Data Scopes, Accessible Modules, and Restricted Boundaries**.

---

## 👑 Tier 1: SaaS Headquarters & Corporate Platform (Port 5174)

Login Portal: `http://localhost:5174`

| # | Role Code | Designation & Profile | Login Email / User ID | Password | Scope | Accessible Modules & Controls | Security Restrictions & Caps |
|---|---|---|---|---|---|---|---|
| **1** | **`SUPER_ADMIN_FOUNDER`** | **MERAJ SHARIF**<br>*(Founder & Chief Executive Officer)* | `founder@docsearch.health` | `FounderPass2026#Secure` | `GLOBAL` | **Supreme Founder Control:** All 16 Domains, MCA/ROC Board Vault, RLS Kernel Bypass, Executive Board Voting, Staff Fire/Hire, Emergency Kill-Switch. | **None** (Supreme Founder Master Authority) |
| **3** | **`COMPANY_ADMIN`** | **Ananya Roy**<br>*(Chief Operating Officer - COO)* | `coo@docsearch.health` | `CooPass123!` | `COMPANY` | Company Administration, Internal Staff Directory, Cost Centers & Departments, CRM Partner Lifecycle. | DB Kernel Direct Bypass, Production Server SSH. |
| **4** | **`FINANCE_CONTROLLER`** | **Vikram Mehta**<br>*(VP SaaS Finance & CFO)* | `finance@docsearch.health` | `FinancePass123!` | `FINANCIAL_ONLY` | Subscription & Billing Finance, Partner Settlement Gateway, 18% GST Invoicing, Revenue Realization. | Dual Auth at ₹50,000+; Patient EMR, AI Model Registry, Cloud Clusters blocked. |
| **5** | **`COMPLIANCE_OFFICER`** | **Dr. Sunita Iyer**<br>*(Chief Compliance & Legal DPO)* | `security@docsearch.health` | `SecurityPass123!` | `LOGS_ONLY` | SHA-256 Audit Vaults, HIPAA/DPDP Evidence, Security RBAC Policies, Session Revocation. | Payout Limit: ₹0; Cannot alter pricing tiers or financial wallets. |
| **6** | **`DEVOPS_LEAD`** | **Kabir Sengupta**<br>*(DevOps & Cloud Reliability Lead)* | `devops@docsearch.health` | `DevOpsPass123!` | `GLOBAL (Infra)` | Kubernetes Clusters, Fastify API Gateway Telemetry, Failover DR, Redis Telemetry. | Patient PII 100% masked; Billing & Payout Gateways locked. |
| **7** | **`CLINICAL_AI_SAFETY_LEAD`** | **Dr. Tanya Joseph**<br>*(Clinical AI Safety Director)* | `clinical.ai@docsearch.health` | `ClinicalAiPass123!` | `CLINICAL_AI` | AI Platform Governance, Voice Scribe Accuracy, CDSS Boundaries, Lethal DDI Safety Protocols. | Financial settlements and core cloud infrastructure blocked. |
| **8** | **`FIELD_SALES_REP`** | **Rohit Verma**<br>*(Enterprise Growth & Field Rep)* | `sales@docsearch.health` | `SalesPass123!` | `TERRITORY_OWN` | Growth Engine, Doctor Demo Studio, 2-Min Clinic Onboarding, Commission Wallet. | 15km Geo-fence, max ₹100 discount; Banking & Security Vaults blocked. |
| **9** | **`CUSTOMER_SUPPORT_LEAD`** | **Sneha Kulkarni**<br>*(Partner Support Desk Lead)* | `support.lead@docsearch.health` | `SupportPass123!` | `TICKETS_ONLY` | Customer Support Desk, Partner Lifecycle Status, Broadcast Announcements. | Bank settlement gateways, staff credential generation blocked. |

---

## 🏥 Tier 2: Partner Hospital & Clinic Network (Port 5173)

Login Portal: `http://localhost:5173`

| # | Role Code | Designation & Profile | Login Email / User ID | Password | Scope | Accessible Modules & Controls | Security Restrictions & Caps |
|---|---|---|---|---|---|---|---|
| **10** | **`HOSPITAL_DIRECTOR`** | **Dr. Priya Nair, MS**<br>*(Medical Superintendent)* | `director.priya@docsearch.health` | `DirectorPass123!` | `HOSPITAL` | 250-Bed Command Wall, OT Efficiency, Incident Control, Doctor Rostering, Bed Allocation. | Platform SaaS Settings & Core DB blocked. |
| **11** | **`CHIEF_MEDICAL_OFFICER`** | **Dr. Vikramaditya Rathore**<br>*(CMO & Clinical Auditor)* | `cmo.vikram@docsearch.health` | `CmoPass123!` | `HOSPITAL` | Clinical Governance, Mortality Audits, NABH Protocols, **Emergency Break-Glass** override. | Live cashier collections blocked. |
| **12** | **`SURGEON` / `DOCTOR`** | **Dr. Sameer Kulkarni**<br>*(Chief Laparoscopic Surgeon)* | `surgeon.sameer@docsearch.health` | `SurgeonPass123!` | `HOSPITAL` | OT Rostering, Pre-Anesthesia Check (PAC), Surgical Notes, OPD Consultations, Digital Rx. | Pharmacy inwarding and hospital financial billing blocked. |
| **13** | **`HEAD_PATHOLOGIST`** | **Dr. R. K. Tata, MD Path**<br>*(Tata Lab Director)* | `tata@doc.com` | `TataPass123!` | `PATHOLOGY` | Phlebotomy Barcode Intake, Result Verification, **Direct NABL Digital Sign-off**, WhatsApp PDF. | Hospital IPD Wards, OT Surgery Logs blocked. |
| **14** | **`LAB_TECHNICIAN`** | **Rohit Pathak**<br>*(Senior Phlebotomist)* | `labtech.rohit@docsearch.health` | `LabPass123!` | `BRANCH` | Blood sample barcoding, analyzer machine data entry, sample intake logging. | Cannot sign or approve final diagnostic reports. |
| **15** | **`EMERGENCY_ICU_NURSE`** | **Anjali Menon**<br>*(ICU Nurse Lead)* | `nurse.anjali@docsearch.health` | `NursePass123!` | `BRANCH` | Vital signs (BP/SpO2), Medication Administration Logs (MAR), Bedside Emergency Alerts. | Cannot modify doctor prescriptions or close billing invoices. |
| **16** | **`CHIEF_PHARMACIST`** | **Rahul Deshmukh**<br>*(Head Pharmacist)* | `pharma.rahul@docsearch.health` | `PharmaPass123!` | `BRANCH` | Medication dispensing, batch & expiry tracking, Schedule H1 / Narcotics register. | Unauthorized doctor prescription alteration strictly prohibited. |
| **17** | **`BILLING_TPA_EXECUTIVE`** | **Neha Agarwal**<br>*(Billing & TPA Controller)* | `billing.neha@docsearch.health` | `BillingPass123!` | `BRANCH` | 18% GST Invoicing, Cashless TPA insurance pre-auth, POS Cash/UPI payment receipts. | Zero clinical notes or lab results editing authority. |
| **18** | **`FRONT_DESK_RECEPTIONIST`**| **Pooja Sharma**<br>*(Front Desk Executive)* | `reception.pooja@docsearch.health` | `ReceptionPass123!` | `BRANCH` | Walk-in patient registration, ABHA health ID creation, OPD queue token allocation. | Medical EMR, diagnostic reports, and discharge summaries blocked. |

---

## 👥 Tier 3: Consumer & External Roles

| # | Role Code | Designation & Profile | Login Email / User ID | Password | Scope | Accessible Modules & Controls |
|---|---|---|---|---|---|---|
| **19** | **`PATIENT`** | **Aravind Kumar**<br>*(Patient / Consumer)* | `patient.aravind@docsearch.health` | `PatientPass123!` | `OWN` | Personal Health Records (PHR), prescriptions download, ABHA Consent management. |
| **20** | **`STATUTORY_AUDITOR`** | **K. K. Kapoor**<br>*(NABH Quality Inspector)* | `auditor.kapoor@docsearch.health` | `AuditorPass123!` | `JIT_24H` | **24-Hour Read-Only JIT Access:** Infection control rates, biomedical waste logs, and quality charts. |

---

## 🚀 How to Test Each Role Live

### Method 1: Using the Live "Role Testing Sandbox Dock"
1. Open `Company Platform` at `http://localhost:5174`.
2. Notice the top banner: **`🧪 ROLE TESTING SANDBOX`**.
3. Click **`🔄 Switch Test Role`** (blue button).
4. Click on any role card (e.g. `Vikram Mehta — VP SaaS Finance` or `Dr. Sunita Iyer — Compliance Lead`).
5. **Observe the Instant Transformation:**
   - The active user badge and designation update in real-time.
   - The left sidebar navigation automatically filters to display **only** the modules permitted for that role.
   - Unauthorized domains are automatically blocked with clear clearance notifications.
6. Click **`👑 Reset to Founder`** anytime to restore Shah Alam's unrestricted master access!

### Method 2: From the Login Screen
1. Open `http://localhost:5174`.
2. On the **Executive & Founder Authentication Portal**, click any role persona card.
3. The email, password, and clearance are auto-filled instantly.
4. Click **`🚀 Authenticate & Enter SaaS HQ`** to launch that role's dashboard.
