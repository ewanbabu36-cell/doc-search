-- =========================================================================
-- Migration 0073: High-Traffic Foreign Key Indexes (Sanitized: Schema DDL Only)
-- Safety Standard: Schema migrations must contain idempotent DDL, never unreviewed hardcoded DML.
-- =========================================================================

-- Clinical Encounters & Consultations
CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON clinical.encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_doctor_id ON clinical.encounters(doctor_id);
CREATE INDEX IF NOT EXISTS idx_encounters_tenant_id ON clinical.encounters(tenant_id);

CREATE INDEX IF NOT EXISTS idx_consultations_encounter_id ON clinical.consultations(encounter_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON clinical.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON clinical.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_tenant_id ON clinical.consultations(tenant_id);

-- Billing Invoices, Payments, and Refunds
CREATE INDEX IF NOT EXISTS idx_billing_invoices_patient_id ON clinical.billing_invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_encounter_id ON clinical.billing_invoices(encounter_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_tenant_id ON clinical.billing_invoices(tenant_id);

CREATE INDEX IF NOT EXISTS idx_billing_payments_invoice_id ON clinical.billing_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_patient_id ON clinical.billing_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_tenant_id ON clinical.billing_payments(tenant_id);

CREATE INDEX IF NOT EXISTS idx_billing_refunds_invoice_id ON clinical.billing_refunds(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_refunds_payment_id ON clinical.billing_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_billing_refunds_patient_id ON clinical.billing_refunds(patient_id);

-- Pharmacy Prescriptions & Batches
CREATE INDEX IF NOT EXISTS idx_pharmacy_prescriptions_patient_id ON clinical.pharmacy_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_prescriptions_consultation_id ON clinical.pharmacy_prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_prescriptions_tenant_id ON clinical.pharmacy_prescriptions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_pharmacy_batches_medication_id ON clinical.pharmacy_batches(medication_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_batches_tenant_id ON clinical.pharmacy_batches(tenant_id);

-- Customer Khata & Ledger
CREATE INDEX IF NOT EXISTS idx_pharmacy_customer_khata_tenant_id ON clinical.pharmacy_customer_khata(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_khata_ledger_account_id ON clinical.pharmacy_khata_ledger(account_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_khata_ledger_tenant_id ON clinical.pharmacy_khata_ledger(tenant_id);

-- LIMS Investigations & Radiology
CREATE INDEX IF NOT EXISTS idx_investigation_orders_patient_id ON clinical.investigation_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_investigation_orders_encounter_id ON clinical.investigation_orders(encounter_id);
CREATE INDEX IF NOT EXISTS idx_investigation_orders_tenant_id ON clinical.investigation_orders(tenant_id);

CREATE INDEX IF NOT EXISTS idx_investigation_specimens_order_id ON clinical.investigation_specimens(order_id);
CREATE INDEX IF NOT EXISTS idx_investigation_results_order_id ON clinical.investigation_results(order_id);

CREATE INDEX IF NOT EXISTS idx_radiology_orders_patient_id ON clinical.radiology_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_radiology_orders_encounter_id ON clinical.radiology_orders(encounter_id);
CREATE INDEX IF NOT EXISTS idx_radiology_orders_tenant_id ON clinical.radiology_orders(tenant_id);

CREATE INDEX IF NOT EXISTS idx_emergency_encounters_patient_id ON clinical.emergency_encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_inpatient_admissions_patient_id ON clinical.inpatient_admissions(patient_id);
