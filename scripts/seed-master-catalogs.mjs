import pg from 'pg';

async function main() {
  const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
  await client.connect();

  const TENANT_ID = '11111111-1111-4000-8000-000000000001';

  console.log('Seeding vacutainer_tube_catalog...');
  const tubes = [
    {
      tube_key: 'LAVENDER',
      name: 'Lavender / Purple',
      additive: 'K2 / K3 EDTA',
      color_name: 'Lavender EDTA',
      cap_hex: '#9333EA',
      glow_hex: '#C084FC',
      volume: '2.0 mL',
      inversions: '8-10x gentle',
      common_tests: JSON.stringify(['CBC', 'ESR', 'HbA1c', 'Blood Group', 'Peripheral Smear']),
      keywords: JSON.stringify(['cbc', 'edta', 'hba1c', 'esr', 'hemoglobin', 'blood count', 'smear', 'platelet', 'wbc'])
    },
    {
      tube_key: 'RED_GOLD',
      name: 'Gold SST / Red',
      additive: 'Clot Activator / Silica Gel',
      color_name: 'Serum SST',
      cap_hex: '#EF4444',
      glow_hex: '#F87171',
      volume: '3.5 mL',
      inversions: '5x gentle',
      common_tests: JSON.stringify(['LFT', 'KFT', 'Lipid', 'Thyroid', 'Serology', 'Troponin']),
      keywords: JSON.stringify(['lft', 'kft', 'lipid', 'thyroid', 'serum', 'creatinine', 'urea', 'liver', 'kidney', 'sgpt', 'sgot', 'cholesterol', 'tsh', 'hiv', 'hbsag', 'hcv', 'crp', 'troponin', 'ferritin', 'vitamin', 'calcium'])
    },
    {
      tube_key: 'LIGHT_BLUE',
      name: 'Light Blue',
      additive: 'Sodium Citrate 3.2%',
      color_name: 'Coagulation Citrate',
      cap_hex: '#0EA5E9',
      glow_hex: '#38BDF8',
      volume: '2.7 mL',
      inversions: '3-4x gentle',
      common_tests: JSON.stringify(['PT/INR', 'APTT', 'D-Dimer', 'Fibrinogen']),
      keywords: JSON.stringify(['pt', 'inr', 'aptt', 'citrate', 'd-dimer', 'coagulation', 'clotting'])
    },
    {
      tube_key: 'GREY',
      name: 'Grey',
      additive: 'Sodium Fluoride / Potassium Oxalate',
      color_name: 'Glucose Fluoride',
      cap_hex: '#64748B',
      glow_hex: '#94A3B8',
      volume: '2.0 mL',
      inversions: '8-10x gentle',
      common_tests: JSON.stringify(['Fasting Blood Sugar', 'PP Blood Sugar', 'OGTT']),
      keywords: JSON.stringify(['glucose', 'sugar', 'fluoride', 'fasting', 'pp', 'ogtt', 'gtt'])
    },
    {
      tube_key: 'GREEN',
      name: 'Green',
      additive: 'Lithium Heparin',
      color_name: 'Heparin Plasma',
      cap_hex: '#10B981',
      glow_hex: '#34D399',
      volume: '3.0 mL',
      inversions: '8-10x gentle',
      common_tests: JSON.stringify(['Electrolytes', 'Blood Gas', 'Ammonia', 'HLA B27']),
      keywords: JSON.stringify(['heparin', 'electrolyte', 'sodium', 'potassium', 'ammonia', 'gas', 'abg'])
    },
    {
      tube_key: 'BLACK',
      name: 'Black',
      additive: 'Sodium Citrate 4:1 (Westergren)',
      color_name: 'ESR Citrate',
      cap_hex: '#1E293B',
      glow_hex: '#475569',
      volume: '1.6 mL',
      inversions: '8-10x gentle',
      common_tests: JSON.stringify(['Automated Westergren ESR']),
      keywords: JSON.stringify(['black', 'westergren', 'sedimentation'])
    }
  ];

  for (const t of tubes) {
    await client.query(`
      INSERT INTO clinical.vacutainer_tube_catalog 
        (tube_key, name, additive, color_name, cap_hex, glow_hex, volume, inversions, common_tests, keywords, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
      ON CONFLICT (tube_key) DO UPDATE SET
        name = EXCLUDED.name,
        additive = EXCLUDED.additive,
        color_name = EXCLUDED.color_name,
        cap_hex = EXCLUDED.cap_hex,
        glow_hex = EXCLUDED.glow_hex,
        volume = EXCLUDED.volume,
        inversions = EXCLUDED.inversions,
        common_tests = EXCLUDED.common_tests,
        keywords = EXCLUDED.keywords,
        updated_at = NOW();
    `, [t.tube_key, t.name, t.additive, t.color_name, t.cap_hex, t.glow_hex, t.volume, t.inversions, t.common_tests, t.keywords]);
  }

  console.log('Seeding prescription_templates...');
  const templates = [
    {
      template_code: 'viral-fever-uri',
      name: 'Viral Fever & URI Kit',
      icon: '🌡️',
      category: 'General Medicine',
      chief_complaint: 'High grade fever for 3 days with chills, runny nose, sore throat and generalized myalgia.',
      diagnosis: 'Acute Viral Upper Respiratory Infection with Pyrexia',
      icd10_code: 'J06.9',
      treatment_plan: '• Steam inhalation twice daily for 5 days\n• Plentiful warm oral fluids (>2.5L/day)\n• Avoid cold beverages, oily foods\n• Review after 3 days if fever >101°F persists',
      medications: JSON.stringify([
        {
          id: 'tmpl-pcm',
          medicationName: 'Tab Paracetamol',
          strength: '650mg',
          dosage: '1 Tab',
          frequency: '1 - 0 - 1',
          duration: 3,
          durationUnit: 'DAYS',
          beforeAfterFood: 'AFTER_FOOD',
          instructions: 'After meals if temperature > 100°F',
          genericSubstitute: { name: 'Jan Aushadhi Paracetamol 650mg', janAushadhiPrice: 12, brandPrice: 45 }
        },
        {
          id: 'tmpl-levo',
          medicationName: 'Tab Levocetirizine',
          strength: '5mg',
          dosage: '1 Tab',
          frequency: '0 - 0 - 1',
          duration: 5,
          durationUnit: 'DAYS',
          beforeAfterFood: 'BEDTIME',
          instructions: 'At bedtime with warm water',
          genericSubstitute: { name: 'Jan Aushadhi Levocetirizine 5mg', janAushadhiPrice: 8, brandPrice: 52 }
        },
        {
          id: 'tmpl-panto',
          medicationName: 'Tab Pantoprazole',
          strength: '40mg',
          dosage: '1 Tab',
          frequency: '1 - 0 - 0',
          duration: 5,
          durationUnit: 'DAYS',
          beforeAfterFood: 'BEFORE_FOOD',
          instructions: 'Morning empty stomach 30 mins before breakfast',
          genericSubstitute: { name: 'Jan Aushadhi Pantoprazole 40mg', janAushadhiPrice: 15, brandPrice: 110 }
        }
      ]),
      lab_tests: JSON.stringify(['CBC (Complete Blood Count)'])
    },
    {
      template_code: 'hypertension-starter',
      name: 'Hypertension Starter',
      icon: '❤️',
      category: 'Cardiology / Medicine',
      chief_complaint: 'Occipital morning headache, dizziness, recorded BP 148/92 mmHg on two visits.',
      diagnosis: 'Essential Primary Hypertension (Stage 1)',
      icd10_code: 'I10',
      treatment_plan: '• Dietary Sodium restriction (<5g salt/day)\n• Brisk morning walk 35-40 mins daily\n• Maintain daily home BP monitoring chart\n• Avoid NSAIDs and decongestants',
      medications: JSON.stringify([
        {
          id: 'tmpl-telmi',
          medicationName: 'Tab Telmisartan',
          strength: '40mg',
          dosage: '1 Tab',
          frequency: '1 - 0 - 0',
          duration: 30,
          durationUnit: 'DAYS',
          beforeAfterFood: 'AFTER_FOOD',
          instructions: 'Every morning at fixed time after breakfast',
          genericSubstitute: { name: 'Jan Aushadhi Telmisartan 40mg', janAushadhiPrice: 22, brandPrice: 135 }
        }
      ]),
      lab_tests: JSON.stringify(['Serum Creatinine & Electrolytes', 'Lipid Profile', 'ECG (12-Lead)'])
    },
    {
      template_code: 'type-2-diabetes',
      name: 'Type 2 Diabetes Starter',
      icon: '🩸',
      category: 'Endocrinology / Medicine',
      chief_complaint: 'Polyuria, polydipsia, lethargy x 3 weeks. Fasting blood sugar 168 mg/dL.',
      diagnosis: 'Type 2 Diabetes Mellitus without Complications',
      icd10_code: 'E11.9',
      treatment_plan: '• Low glycemic index diabetic diet\n• 45 mins brisk cardio daily\n• Self-monitoring of fasting and 2hr PP glucose twice weekly\n• Annual dilated fundus and foot check',
      medications: JSON.stringify([
        {
          id: 'tmpl-met',
          medicationName: 'Tab Metformin SR',
          strength: '500mg',
          dosage: '1 Tab',
          frequency: '1 - 0 - 1',
          duration: 30,
          durationUnit: 'DAYS',
          beforeAfterFood: 'AFTER_FOOD',
          instructions: 'Immediately with or after principal meals',
          genericSubstitute: { name: 'Jan Aushadhi Metformin 500mg SR', janAushadhiPrice: 18, brandPrice: 78 }
        }
      ]),
      lab_tests: JSON.stringify(['HbA1c', 'Lipid Profile', 'Urine Microalbumin/Creatinine Ratio'])
    },
    {
      template_code: 'acute-gastroenteritis',
      name: 'Acute Gastroenteritis Kit',
      icon: '💧',
      category: 'Gastroenterology',
      chief_complaint: 'Watery stools 5-6 times since yesterday with abdominal cramping and nausea.',
      diagnosis: 'Acute Infective Gastroenteritis without Dehydration',
      icd10_code: 'A09',
      treatment_plan: '• WHO-ORS 1 packet in 1L boiled and cooled water, sip throughout the day\n• BRAT diet (Banana, Rice, Applesauce, Toast)\n• Strict avoidance of dairy, spicy and outside food',
      medications: JSON.stringify([
        {
          id: 'tmpl-ors',
          medicationName: 'Sachet WHO Oral Rehydration Salts',
          strength: '20.5g',
          dosage: '1 Sachet',
          frequency: 'As needed',
          duration: 3,
          durationUnit: 'DAYS',
          beforeAfterFood: 'AFTER_FOOD',
          instructions: 'Dissolve fully in 1 liter clean water. Discard unused solution after 24h.'
        },
        {
          id: 'tmpl-rce',
          medicationName: 'Cap Racecadotril',
          strength: '100mg',
          dosage: '1 Cap',
          frequency: '1 - 1 - 1',
          duration: 3,
          durationUnit: 'DAYS',
          beforeAfterFood: 'BEFORE_FOOD',
          instructions: 'Before meals until diarrhoea stops'
        }
      ]),
      lab_tests: JSON.stringify(['Stool Routine & Microscopy', 'Serum Electrolytes'])
    }
  ];

  for (const t of templates) {
    await client.query(`
      INSERT INTO clinical.prescription_templates
        (tenant_id, template_code, name, icon, category, chief_complaint, diagnosis, icd10_code, treatment_plan, medications, lab_tests, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
      ON CONFLICT (template_code) DO UPDATE SET
        name = EXCLUDED.name,
        icon = EXCLUDED.icon,
        category = EXCLUDED.category,
        chief_complaint = EXCLUDED.chief_complaint,
        diagnosis = EXCLUDED.diagnosis,
        icd10_code = EXCLUDED.icd10_code,
        treatment_plan = EXCLUDED.treatment_plan,
        medications = EXCLUDED.medications,
        lab_tests = EXCLUDED.lab_tests,
        updated_at = NOW();
    `, [TENANT_ID, t.template_code, t.name, t.icon, t.category, t.chief_complaint, t.diagnosis, t.icd10_code, t.treatment_plan, t.medications, t.lab_tests]);
  }

  console.log('Seeding diagnostic_health_packages...');
  const packages = [
    {
      package_code: 'PKG-FULLBODY-64',
      package_name: 'Comprehensive Full Body Health Checkup (64 Parameters)',
      parameters_count: 64,
      package_mrp: '1800.00',
      bundled_test_names: JSON.stringify(['CBC (24 Parameters)', 'Lipid Profile (7 Tests)', 'Liver Function Test (LFT - 11 Tests)', 'Kidney Function (KFT - 8 Tests)', 'Fasting Blood Sugar', 'HbA1c', 'Thyroid Profile (T3, T4, TSH)']),
      fasting_required: true,
      vials_required: JSON.stringify(['LAVENDER', 'RED_GOLD', 'GREY'])
    },
    {
      package_code: 'PKG-CARDIAC-48',
      package_name: 'Executive Cardiac & Diabetic Risk Wellness (48 Parameters)',
      parameters_count: 48,
      package_mrp: '2400.00',
      bundled_test_names: JSON.stringify(['High-Sensitivity CRP (hs-CRP)', 'Lipid Profile Extended', 'HbA1c Glycated Hemoglobin', 'Serum Homocysteine', 'Apo-A1 / Apo-B Ratio', 'Kidney Function Panel']),
      fasting_required: true,
      vials_required: JSON.stringify(['LAVENDER', 'RED_GOLD'])
    },
    {
      package_code: 'PKG-SENIOR-72',
      package_name: 'Senior Citizen Comprehensive Care (72 Parameters)',
      parameters_count: 72,
      package_mrp: '3200.00',
      bundled_test_names: JSON.stringify(['CBC with ESR', 'Comprehensive Metabolic Panel', 'Vitamin D3 & Vitamin B12', 'PSA Total (Prostate)', 'Serum Calcium & Phosphorus', 'Thyroid Profile', 'Urine Microalbumin']),
      fasting_required: true,
      vials_required: JSON.stringify(['LAVENDER', 'RED_GOLD', 'GREY'])
    },
    {
      package_code: 'PKG-WOMEN-36',
      package_name: "Women's Hormonal & Bone Health Profile (36 Parameters)",
      parameters_count: 36,
      package_mrp: '2100.00',
      bundled_test_names: JSON.stringify(['Complete Hemogram (Anemia Panel)', 'Serum Ferritin', 'TSH Ultrasensitive', 'Vitamin D3 (25-OH)', 'Serum Calcium', 'Fasting Blood Glucose']),
      fasting_required: true,
      vials_required: JSON.stringify(['LAVENDER', 'RED_GOLD'])
    }
  ];

  for (const p of packages) {
    await client.query(`
      INSERT INTO clinical.diagnostic_health_packages
        (tenant_id, package_code, package_name, parameters_count, package_mrp, bundled_test_names, fasting_required, vials_required, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      ON CONFLICT (package_code) DO UPDATE SET
        package_name = EXCLUDED.package_name,
        parameters_count = EXCLUDED.parameters_count,
        package_mrp = EXCLUDED.package_mrp,
        bundled_test_names = EXCLUDED.bundled_test_names,
        fasting_required = EXCLUDED.fasting_required,
        vials_required = EXCLUDED.vials_required;
    `, [TENANT_ID, p.package_code, p.package_name, p.parameters_count, p.package_mrp, p.bundled_test_names, p.fasting_required, p.vials_required]);
  }

  console.log('Master catalogs seeded successfully.');
  await client.end();
}

main().catch(console.error);
