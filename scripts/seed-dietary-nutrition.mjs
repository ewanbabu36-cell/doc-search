import pg from 'pg';
import crypto from 'node:crypto';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const CANONICAL_BRANCH = '5a0cb96b-b80f-43db-aa18-1780ededd1b6';
const CANONICAL_PARTNER = '1c14ebdd-af6d-44df-afa3-fe1e91301d15';
const CANONICAL_ORG = '649e0fdb-af37-43c1-acea-23f35ffe4ad5';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  console.log('--- Fetching Patients for Dietary Orders ---');
  const patRes = await client.query(`
    SELECT id, first_name, last_name, mrn 
    FROM clinical.patients 
    WHERE tenant_id = $1 
    ORDER BY created_at ASC 
    LIMIT 3
  `, [CANONICAL_TENANT]);

  if (patRes.rows.length === 0) {
    console.warn('No canonical patients found. Fetching any patient.');
  }
  const patients = patRes.rows.length > 0 ? patRes.rows : [
    { id: '29bc38f8-32ef-427a-b16b-91f13792d427', first_name: 'Rajesh', last_name: 'Kumar', mrn: 'MRN-2026-0001' },
    { id: 'b621ccca-d7e0-4a71-bd6f-5bc05ce9cf1c', first_name: 'Sunita', last_name: 'Devi', mrn: 'MRN-2026-0002' },
    { id: 'd2a877d0-66c6-46fe-b7f4-e17d6520e563', first_name: 'Amit', last_name: 'Verma', mrn: 'MRN-596942' }
  ];

  console.log(`Using ${patients.length} patients for dietary seeding:`, patients.map(p => `${p.first_name} ${p.last_name}`));

  // 1. Kitchen
  console.log('--- Seeding dietary_kitchens ---');
  const kitchenId = '00000000-0000-4000-8000-000000000001';
  await client.query(`
    INSERT INTO clinical.dietary_kitchens (
      id, tenant_id, partner_id, organization_id, branch_id,
      kitchen_code, kitchen_name, kitchen_type, location,
      daily_capacity, operating_hours, responsible_manager,
      contact_phone, food_safety_status, status, created_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      'KTC-CENTRAL-01', 'Central Hospital Culinary & Nutrition Center', 'CENTRAL', 'Basement Wing B, Dietary Complex',
      1200, '05:00 - 22:30', 'Chef Anand Kulkarni / S. Mehra',
      '+91-9876543210', 'COMPLIANT_HACCP_ISO22000', 'ACTIVE', NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      branch_id = EXCLUDED.branch_id,
      kitchen_name = EXCLUDED.kitchen_name;
  `, [kitchenId, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH]);
  console.log('Seeded Central Kitchen.');

  // 2. Diet Types
  console.log('--- Seeding dietary_diet_types ---');
  const dietTypes = [
    {
      id: '10000000-0000-4000-8000-000000000001',
      code: 'DIET-DIABETIC',
      name: 'Diabetic Low-Glycemic Index Diet',
      category: 'THERAPEUTIC',
      purpose: 'Strict glycemic control and carbohydrate pacing for Type 1 & Type 2 Diabetes Mellitus',
      allowed: 'Whole grains (Ragi, Oats, Brown rice), high-fiber vegetables, lean proteins (Paneer, Tofu, Dal), nuts, seeds',
      restricted: 'Refined sugar, sweetened juices, high-GI desserts, white bread, fried snacks, potatoes',
      allergens: JSON.stringify(['GLUTEN']),
      calories: 1800,
      protein: 75.0,
      carbs: 210.0,
      fat: 45.0,
      sodium: 2000,
      fluid: 2500,
      texture: 'REGULAR',
      frequency: 5
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      code: 'DIET-RENAL-LOWSOD',
      name: 'Renal Low-Sodium & Controlled-Potassium Diet',
      category: 'RENAL',
      purpose: 'Kidney preservation and electrolyte balance for CKD Stage 3/4 and post-dialysis recovery',
      allowed: 'Leached vegetables, apple/papaya, white rice, low-protein flour, egg white, cow milk (measured)',
      restricted: 'High potassium fruits (Bananas, citrus), salt substitutes, excess lentils, spinach, tomatoes, pickles',
      allergens: JSON.stringify([]),
      calories: 1650,
      protein: 50.0,
      carbs: 230.0,
      fat: 40.0,
      sodium: 1200,
      fluid: 1200,
      texture: 'SOFT',
      frequency: 4
    },
    {
      id: '10000000-0000-4000-8000-000000000003',
      code: 'DIET-HIGH-PROTEIN',
      name: 'High-Protein Post-Surgical Recovery Diet',
      category: 'SURGICAL',
      purpose: 'Wound healing, nitrogen balance, and tissue repair following major surgical procedures',
      allowed: 'Sprouts, paneer, double-toned milk, Greek yogurt, boiled eggs, dal soup, whey protein fortifier',
      restricted: 'Excessive spicy curries, deep fried foods, gassy vegetables (cabbage, cauliflower)',
      allergens: JSON.stringify(['DAIRY', 'EGG']),
      calories: 2200,
      protein: 95.0,
      carbs: 240.0,
      fat: 55.0,
      sodium: 2300,
      fluid: 2800,
      texture: 'REGULAR',
      frequency: 4
    },
    {
      id: '10000000-0000-4000-8000-000000000004',
      code: 'DIET-BALANCED-NORM',
      name: 'Standard Hospital Balanced Nutrition Diet',
      category: 'GENERAL',
      purpose: 'General inpatient healthy maintenance with complete macro- and micronutrient RDA compliance',
      allowed: 'Chapati, seasonal subzi, dal, curd, salad, seasonal fruit, vegetable khichdi',
      restricted: 'Heavy unhygienic street food, ultra-processed packaged snacks',
      allergens: JSON.stringify([]),
      calories: 2000,
      protein: 70.0,
      carbs: 260.0,
      fat: 50.0,
      sodium: 2200,
      fluid: 3000,
      texture: 'REGULAR',
      frequency: 3
    },
    {
      id: '10000000-0000-4000-8000-000000000005',
      code: 'DIET-CLEAR-LIQUID',
      name: 'Clear Liquid & Pre-Procedure Hydration',
      category: 'LIQUID',
      purpose: 'Pre-operative bowel preparation and step-down transition from NPO status',
      allowed: 'Coconut water, strained barley water, clear vegetable broth, diluted electrolyte solution',
      restricted: 'Milk, solid particles, fiber, red-colored fruit juices, pulp',
      allergens: JSON.stringify([]),
      calories: 600,
      protein: 10.0,
      carbs: 130.0,
      fat: 2.0,
      sodium: 1500,
      fluid: 2000,
      texture: 'CLEAR_LIQUID',
      frequency: 6
    }
  ];

  for (const dt of dietTypes) {
    await client.query(`
      INSERT INTO clinical.dietary_diet_types (
        id, tenant_id, partner_id, organization_id, branch_id,
        diet_code, diet_name, category, clinical_purpose,
        allowed_foods, restricted_foods, allergens_to_avoid,
        target_calories, target_protein_grams, target_carbs_grams, target_fat_grams,
        sodium_restricted_mg, fluid_restricted_ml, texture, meal_frequency_per_day,
        is_active, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20,
        true, NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        branch_id = EXCLUDED.branch_id,
        diet_name = EXCLUDED.diet_name;
    `, [
      dt.id, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      dt.code, dt.name, dt.category, dt.purpose,
      dt.allowed, dt.restricted, dt.allergens,
      dt.calories, dt.protein, dt.carbs, dt.fat,
      dt.sodium, dt.fluid, dt.texture, dt.frequency
    ]);
  }
  console.log(`Seeded ${dietTypes.length} Diet Types.`);

  // 3. Food Items
  console.log('--- Seeding dietary_food_items ---');
  const foodItems = [
    { code: 'FD-ROTI-01', name: 'Fresh Multi-Grain Phulka (2 Pcs)', cat: 'BREAD', unit: 'PORTION', cal: 140, p: 4.5, c: 26, f: 1.5, cost: 25 },
    { code: 'FD-RICE-02', name: 'Steamed Basmati Rice (1 Cup)', cat: 'GRAINS', unit: 'BOWL', cal: 180, p: 3.5, c: 40, f: 0.5, cost: 30 },
    { code: 'FD-DAL-03', name: 'Yellow Moong Dal Tadka (Mild Cumin)', cat: 'PULSES', unit: 'BOWL', cal: 130, p: 7.0, c: 18, f: 3.0, cost: 35 },
    { code: 'FD-PANEER-04', name: 'Low-Fat Grilled Paneer Bhurji (100g)', cat: 'PROTEIN', unit: 'PORTION', cal: 210, p: 18.0, c: 4.0, f: 12.0, cost: 75 },
    { code: 'FD-SUBZI-05', name: 'Steamed Lauki & Methi Subzi', cat: 'VEGETABLES', unit: 'BOWL', cal: 85, p: 2.0, c: 12, f: 2.5, cost: 40 },
    { code: 'FD-CURD-06', name: 'Fresh Probiotic Set Curd (150g)', cat: 'DAIRY', unit: 'CUP', cal: 95, p: 5.5, c: 6.0, f: 4.0, cost: 25 },
    { code: 'FD-SOUP-07', name: 'Clear Vegetable Herb Consommé', cat: 'SOUP', unit: 'BOWL', cal: 45, p: 1.5, c: 8.0, f: 0.5, cost: 45 },
    { code: 'FD-KHICHDI-08', name: 'Digestive Moong-Dal Soft Khichdi', cat: 'THERAPEUTIC', unit: 'BOWL', cal: 220, p: 8.0, c: 38, f: 3.5, cost: 50 }
  ];

  for (const fi of foodItems) {
    const fiId = crypto.randomUUID();
    await client.query(`
      INSERT INTO clinical.dietary_food_items (
        id, tenant_id, partner_id, organization_id, branch_id,
        item_code, item_name, category, unit,
        calories_per_unit, protein_per_unit, carbs_per_unit, fat_per_unit,
        allergens, storage_type, estimated_unit_cost, is_active, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13,
        '[]'::jsonb, 'DRY_AND_CHILLED', $14, true, NOW()
      ) ON CONFLICT (tenant_id, item_code) DO NOTHING;
    `, [
      fiId, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      fi.code, fi.name, fi.cat, fi.unit,
      fi.cal, fi.p, fi.c, fi.f, fi.cost
    ]);
  }
  console.log(`Seeded ${foodItems.length} Food Items.`);

  // 4. Clinical Assessments
  console.log('--- Seeding dietary_assessments ---');
  const p1 = patients[0];
  const p2 = patients[1] || patients[0];

  const ass1Id = '20000000-0000-4000-8000-000000000001';
  await client.query(`
    INSERT INTO clinical.dietary_assessments (
      id, tenant_id, partner_id, organization_id, branch_id,
      assessment_number, patient_id, patient_name, patient_mrn, admission_id,
      ward_name, room_bed_number, attending_doctor, dietitian_name,
      assessment_date, weight_kg, height_cm, bmi, nutritional_risk_score,
      clinical_condition, food_allergies, food_intolerances, cultural_religious_preferences,
      swallowing_difficulty, feeding_route, fluid_restriction_ml, special_instructions,
      status, created_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      'ASS-2026-0001', $6, $7, $8, 'ADM-2026-901',
      'Male Medical Ward', 'Bed 104-A', 'Dr. Vivek Sharma (MD)', 'Dt. Sneha Kapoor, RD',
      '2026-11-15', 72.5, 172.0, 24.51, 'LOW_RISK',
      'Type 2 Diabetes Mellitus with post-prandial spikes', '[]'::jsonb, '[]'::jsonb, 'Vegetarian / No Onion Garlic',
      false, 'ORAL', 2500, 'Low GI snacks between meals; no simple sugars',
      'COMPLETED', NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      branch_id = EXCLUDED.branch_id;
  `, [
    ass1Id, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
    p1.id, `${p1.first_name} ${p1.last_name || ''}`.trim(), p1.mrn
  ]);

  const ass2Id = '20000000-0000-4000-8000-000000000002';
  await client.query(`
    INSERT INTO clinical.dietary_assessments (
      id, tenant_id, partner_id, organization_id, branch_id,
      assessment_number, patient_id, patient_name, patient_mrn, admission_id,
      ward_name, room_bed_number, attending_doctor, dietitian_name,
      assessment_date, weight_kg, height_cm, bmi, nutritional_risk_score,
      clinical_condition, food_allergies, food_intolerances, cultural_religious_preferences,
      swallowing_difficulty, feeding_route, fluid_restriction_ml, special_instructions,
      status, created_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      'ASS-2026-0002', $6, $7, $8, 'ADM-2026-902',
      'Surgical ICU / Step-Down', 'Bed SICU-03', 'Dr. Alok Verma, MS', 'Dt. Sneha Kapoor, RD',
      '2026-11-15', 58.0, 160.0, 22.66, 'MODERATE_RISK',
      'Post-Laparoscopic Cholecystectomy Post-Op Day 2', '["PEANUTS"]'::jsonb, '["LACTOSE"]'::jsonb, 'Non-Vegetarian',
      false, 'ORAL', 2000, 'Soft high-protein diet; monitor abdominal distension',
      'COMPLETED', NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      branch_id = EXCLUDED.branch_id;
  `, [
    ass2Id, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
    p2.id, `${p2.first_name} ${p2.last_name || ''}`.trim(), p2.mrn
  ]);
  console.log('Seeded 2 Nutritional Assessments.');

  // 5. Diet Orders
  console.log('--- Seeding dietary_orders ---');
  const order1Id = '30000000-0000-4000-8000-000000000001';
  await client.query(`
    INSERT INTO clinical.dietary_orders (
      id, tenant_id, partner_id, organization_id, branch_id,
      order_number, patient_id, patient_name, patient_mrn, admission_id,
      ward_name, room_bed_number, diet_type_id, diet_type_name, diet_category,
      meal_frequency, start_date, fluid_restriction_ml, texture, feeding_route,
      priority, is_npo, special_instructions, allergy_warnings, ordering_doctor,
      reviewed_by_dietitian, status, created_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      'DORD-2026-001', $6, $7, $8, 'ADM-2026-901',
      'Male Medical Ward', 'Bed 104-A', '10000000-0000-4000-8000-000000000001',
      'Diabetic Low-Glycemic Index Diet', 'THERAPEUTIC',
      '5 Meals / Day', '2026-11-15', 2500, 'REGULAR', 'ORAL',
      'ROUTINE', false, 'Sugar-free tea with snacks; serve warm', '[]'::jsonb, 'Dr. Vivek Sharma',
      'Dt. Sneha Kapoor', 'ACTIVE', NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      branch_id = EXCLUDED.branch_id;
  `, [
    order1Id, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
    p1.id, `${p1.first_name} ${p1.last_name || ''}`.trim(), p1.mrn
  ]);

  const order2Id = '30000000-0000-4000-8000-000000000002';
  await client.query(`
    INSERT INTO clinical.dietary_orders (
      id, tenant_id, partner_id, organization_id, branch_id,
      order_number, patient_id, patient_name, patient_mrn, admission_id,
      ward_name, room_bed_number, diet_type_id, diet_type_name, diet_category,
      meal_frequency, start_date, fluid_restriction_ml, texture, feeding_route,
      priority, is_npo, special_instructions, allergy_warnings, ordering_doctor,
      reviewed_by_dietitian, status, created_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      'DORD-2026-002', $6, $7, $8, 'ADM-2026-902',
      'Surgical ICU / Step-Down', 'Bed SICU-03', '10000000-0000-4000-8000-000000000003',
      'High-Protein Post-Surgical Recovery Diet', 'SURGICAL',
      '4 Meals / Day', '2026-11-15', 2000, 'SOFT', 'ORAL',
      'URGENT', false, 'Ensure protein powder fortified shake at 16:00', '["PEANUTS"]'::jsonb, 'Dr. Alok Verma',
      'Dt. Sneha Kapoor', 'ACTIVE', NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      branch_id = EXCLUDED.branch_id;
  `, [
    order2Id, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
    p2.id, `${p2.first_name} ${p2.last_name || ''}`.trim(), p2.mrn
  ]);
  console.log('Seeded 2 Active Diet Orders.');

  // 6. Diet Plans
  console.log('--- Seeding dietary_diet_plans ---');
  await client.query(`
    INSERT INTO clinical.dietary_diet_plans (
      id, tenant_id, partner_id, organization_id, branch_id,
      plan_code, order_id, patient_name, ward_bed, plan_date,
      diet_type_name, breakfast_items, mid_morning_items, lunch_items,
      evening_snack_items, dinner_items, bedtime_snack_items,
      total_estimated_calories, total_estimated_protein, special_prep_notes,
      status, created_at
    ) VALUES (
      '40000000-0000-4000-8000-000000000001', $1, $2, $3, $4,
      'DPLAN-2026-001', $5, $6, 'Bed 104-A (Male Medical)', '2026-11-15',
      'Diabetic Low-Glycemic Index Diet',
      '2 Multigrain Idlis, Mint Chutney, Sugarless Black Tea',
      'Handful of roasted chana & sprouts',
      '2 Phulkas, Steamed Brown Rice, Yellow Moong Dal, Lauki Sabzi, Cucumber Salad',
      'Roasted Makhana with Green Tea',
      '2 Phulkas, Paneer Bhurji (Low fat), Mixed Veg Soup',
      'Warm Skimmed Milk with pinch of Turmeric (No Sugar)',
      1820, 76.5, 'Strict low salt, separate cooking container for diabetic kitchen station',
      'ACTIVE', NOW()
    ) ON CONFLICT (id) DO NOTHING;
  `, [
    CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
    order1Id, `${p1.first_name} ${p1.last_name || ''}`.trim()
  ]);
  console.log('Seeded Diet Plan.');

  // 7. Meal Schedules
  console.log('--- Seeding dietary_meal_schedules ---');
  const mealSlots = [
    { code: 'SCH-BKF-01', slot: 'BREAKFAST', time: '08:00', items: '2 Multigrain Idlis + Mint Chutney + Sugarless Tea', status: 'DELIVERED' },
    { code: 'SCH-LUN-02', slot: 'LUNCH', time: '12:30', items: '2 Phulkas + Brown Rice + Moong Dal + Lauki Sabzi', status: 'DISPATCHED' },
    { code: 'SCH-DIN-03', slot: 'DINNER', time: '19:30', items: '2 Phulkas + Low Fat Paneer Bhurji + Veg Clear Soup', status: 'SCHEDULED' }
  ];

  for (const ms of mealSlots) {
    const msId = crypto.randomUUID();
    await client.query(`
      INSERT INTO clinical.dietary_meal_schedules (
        id, tenant_id, partner_id, organization_id, branch_id,
        schedule_code, order_id, patient_name, ward_name, room_bed_number,
        meal_date, meal_slot, diet_type_name, items_to_serve,
        scheduled_dispatch_time, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, 'Male Medical Ward', 'Bed 104-A',
        '2026-11-15', $9, 'Diabetic Low-GI Diet', $10,
        $11, $12, NOW()
      ) ON CONFLICT DO NOTHING;
    `, [
      msId, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      ms.code, order1Id, `${p1.first_name} ${p1.last_name || ''}`.trim(),
      ms.slot, ms.items, ms.time, ms.status
    ]);
  }
  console.log('Seeded 3 Meal Schedules.');

  // 8. Seed Sample Unbilled Charges into clinical.billing_charges and billing_charge_items
  console.log('--- Seeding unbilled charges in clinical.billing_charges ---');
  const chgId = '50000000-0000-4000-8000-000000000001';
  await client.query(`
    INSERT INTO clinical.billing_charges (
      id, tenant_id, partner_id, organization_id, branch_id,
      patient_id, charge_number, source_domain, status,
      subtotal, discount_total, tax_total, grand_total,
      captured_by, captured_at, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, 'CHG-OPD-9041', 'OUTPATIENT', 'PENDING',
      1250.00, 0.00, 0.00, 1250.00,
      'Dr. Vivek Sharma', NOW(), NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      branch_id = EXCLUDED.branch_id;
  `, [
    chgId, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
    p1.id
  ]);

  const chgItemId1 = '60000000-0000-4000-8000-000000000001';
  await client.query(`
    INSERT INTO clinical.billing_charge_items (
      id, tenant_id, charge_id, description, quantity,
      unit_price, gross_amount, discount_amount, tax_amount, net_amount,
      source_reference, created_at
    ) VALUES (
      $1, $2, $3, 'Senior Consultant OPD Consultation (General Medicine)',
      1, 800.00, 800.00, 0.00, 0.00, 800.00,
      'CONS-GEN-01', NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id;
  `, [chgItemId1, CANONICAL_TENANT, chgId]);

  const chgItemId2 = '60000000-0000-4000-8000-000000000002';
  await client.query(`
    INSERT INTO clinical.billing_charge_items (
      id, tenant_id, charge_id, description, quantity,
      unit_price, gross_amount, discount_amount, tax_amount, net_amount,
      source_reference, created_at
    ) VALUES (
      $1, $2, $3, '12-Lead Electrocardiogram (ECG) Recording & Interpretation',
      1, 450.00, 450.00, 0.00, 0.00, 450.00,
      'DIAG-ECG-01', NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id;
  `, [chgItemId2, CANONICAL_TENANT, chgId]);
  console.log('Seeded unbilled charges for Rajesh Kumar.');

  await client.end();
  console.log('Dietary & Billing Charges Seed Completed Successfully!');
}

main().catch(console.error);
