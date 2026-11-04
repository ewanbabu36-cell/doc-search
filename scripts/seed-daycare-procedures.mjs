import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

const firstRow = (await client.query('SELECT tenant_id, partner_id, organization_id, branch_id FROM clinical.surgical_procedures LIMIT 1;')).rows[0];
console.log('firstRow:', firstRow);

const daycares = [
  { code: 'PROC-NEB-01', name: 'Nebulization (Duolin + Budecort)', spec: 'General Medicine', cat: 'NEBULIZATION', dur: 15, charge: '150.00', instr: 'Administer 1 ampoule Duolin + 0.5mg Budecort via oxygen nebulizer over 15 mins. Monitor post-neb SpO2.' },
  { code: 'PROC-TT-01', name: 'Tetanus Toxoid (TT 0.5ml IM)', spec: 'Emergency Medicine', cat: 'INJECTION', dur: 5, charge: '80.00', instr: 'Give 0.5ml deep intramuscular in Left Deltoid muscle with aseptic technique.' },
  { code: 'PROC-IV-01', name: 'IV Dextrose Normal Saline (DNS 500ml) + Inj Ondansetron 4mg', spec: 'Emergency Medicine', cat: 'IV_DRIP', dur: 60, charge: '350.00', instr: 'Cannulate with 20G/22G cannula. Infuse DNS 500ml over 60 mins. Inj Ondansetron 4mg IV slow push.' },
  { code: 'PROC-INJ-01', name: 'Inj Diclofenac Sodium 75mg IM (Dynapar)', spec: 'General Medicine', cat: 'INJECTION', dur: 5, charge: '120.00', instr: 'Deep gluteal intragluteal injection in upper outer quadrant. Check for NSAID hypersensitivity.' },
  { code: 'PROC-DRESS-01', name: 'Aseptic Wound Dressing / Suture Removal', spec: 'General Surgery', cat: 'DRESSING', dur: 20, charge: '250.00', instr: 'Clean with Betadine & Normal Saline. Apply sterile gauze dressing with micropore tape.' },
  { code: 'PROC-ECG-01', name: 'In-Chamber 12-Lead Electrocardiogram (ECG)', spec: 'Cardiology', cat: 'DIAGNOSTIC', dur: 10, charge: '200.00', instr: 'Perform standard 12-lead ECG immediately. Alert physician for ST elevation or acute arrhythmia.' },
  { code: 'PROC-CBG-01', name: 'Point-of-Care Capillary Blood Glucose (CBG Stix)', spec: 'General Medicine', cat: 'DIAGNOSTIC', dur: 5, charge: '60.00', instr: 'Perform capillary fingerstick blood glucose check. Record value immediately.' }
];

if (firstRow) {
  for (const d of daycares) {
    await client.query(`
      INSERT INTO clinical.surgical_procedures (
        tenant_id, partner_id, organization_id, branch_id,
        procedure_code, procedure_name, specialty, category,
        default_duration_minutes, base_procedure_charge, is_active, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
      ON CONFLICT (tenant_id, procedure_code) DO UPDATE
      SET procedure_name = EXCLUDED.procedure_name,
          base_procedure_charge = EXCLUDED.base_procedure_charge,
          metadata = EXCLUDED.metadata;
    `, [
      firstRow.tenant_id, firstRow.partner_id, firstRow.organization_id, firstRow.branch_id,
      d.code, d.name, d.spec, d.cat, d.dur, d.charge, JSON.stringify({ nursingInstructions: d.instr })
    ]);
  }
  console.log('Seeded daycare procedures successfully');
}

const totalProcs = await client.query('SELECT count(*) FROM clinical.surgical_procedures;');
console.log('Total surgical/daycare procedures in DB:', totalProcs.rows[0].count);

await client.end();
