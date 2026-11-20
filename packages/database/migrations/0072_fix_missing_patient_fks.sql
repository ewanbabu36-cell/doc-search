-- Migration 0072: Fix missing patient FK constraints and clean legacy synthetic test records
BEGIN;

-- 1. Clean child records of synthetic test radiology orders
DELETE FROM clinical.radiology_appointments 
WHERE order_id IN (
  SELECT r.id FROM clinical.radiology_orders r 
  LEFT JOIN clinical.patients p ON r.patient_id = p.id 
  WHERE r.patient_id IS NOT NULL AND p.id IS NULL
);

DELETE FROM clinical.radiology_reports 
WHERE order_id IN (
  SELECT r.id FROM clinical.radiology_orders r 
  LEFT JOIN clinical.patients p ON r.patient_id = p.id 
  WHERE r.patient_id IS NOT NULL AND p.id IS NULL
);

DELETE FROM clinical.radiology_studies 
WHERE order_id IN (
  SELECT r.id FROM clinical.radiology_orders r 
  LEFT JOIN clinical.patients p ON r.patient_id = p.id 
  WHERE r.patient_id IS NOT NULL AND p.id IS NULL
);

-- 2. Clean child records of synthetic test emergency encounters
DELETE FROM clinical.emergency_triage_assessments 
WHERE encounter_id IN (
  SELECT e.id FROM clinical.emergency_encounters e 
  LEFT JOIN clinical.patients p ON e.patient_id = p.id 
  WHERE e.patient_id IS NOT NULL AND p.id IS NULL
);

DELETE FROM clinical.emergency_ambulance_transfers 
WHERE encounter_id IN (
  SELECT e.id FROM clinical.emergency_encounters e 
  LEFT JOIN clinical.patients p ON e.patient_id = p.id 
  WHERE e.patient_id IS NOT NULL AND p.id IS NULL
);

DELETE FROM clinical.emergency_mlc_cases 
WHERE encounter_id IN (
  SELECT e.id FROM clinical.emergency_encounters e 
  LEFT JOIN clinical.patients p ON e.patient_id = p.id 
  WHERE e.patient_id IS NOT NULL AND p.id IS NULL
);

-- 3. Clean orphaned parent test records
DELETE FROM clinical.radiology_orders 
WHERE id IN (
  SELECT r.id FROM clinical.radiology_orders r 
  LEFT JOIN clinical.patients p ON r.patient_id = p.id 
  WHERE r.patient_id IS NOT NULL AND p.id IS NULL
);

DELETE FROM clinical.emergency_encounters 
WHERE id IN (
  SELECT e.id FROM clinical.emergency_encounters e 
  LEFT JOIN clinical.patients p ON e.patient_id = p.id 
  WHERE e.patient_id IS NOT NULL AND p.id IS NULL
);

DELETE FROM clinical.inpatient_admissions 
WHERE id IN (
  SELECT a.id FROM clinical.inpatient_admissions a 
  LEFT JOIN clinical.patients p ON a.patient_id = p.id 
  WHERE a.patient_id IS NOT NULL AND p.id IS NULL
);

-- 4. Apply Foreign Key constraints to enforce referential integrity
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
