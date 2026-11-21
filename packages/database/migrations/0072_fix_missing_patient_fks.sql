-- Migration 0072: Fix missing patient FK constraints (Sanitized: Non-destructive referential integrity)
-- Safety Standard: Never destructively delete patient or clinical records during migration execution.
BEGIN;

-- Apply Foreign Key constraints to enforce referential integrity safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_radiology_orders_patient'
  ) THEN
    ALTER TABLE clinical.radiology_orders 
      ADD CONSTRAINT fk_radiology_orders_patient 
      FOREIGN KEY (patient_id) REFERENCES clinical.patients(id) 
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_emergency_encounters_patient'
  ) THEN
    ALTER TABLE clinical.emergency_encounters 
      ADD CONSTRAINT fk_emergency_encounters_patient 
      FOREIGN KEY (patient_id) REFERENCES clinical.patients(id) 
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_inpatient_admissions_patient'
  ) THEN
    ALTER TABLE clinical.inpatient_admissions 
      ADD CONSTRAINT fk_inpatient_admissions_patient 
      FOREIGN KEY (patient_id) REFERENCES clinical.patients(id) 
      ON DELETE RESTRICT;
  END IF;
END $$;

COMMIT;
