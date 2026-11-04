import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

const firstPayer = (await client.query('SELECT tenant_id, partner_id, organization_id, branch_id FROM clinical.insurance_payers LIMIT 1;')).rows[0];

const pmjayPackages = [
  { code: 'MG001A', name: 'Laparoscopic / Open Appendectomy', specialty: 'General Surgery', standardRate: 24000, implantCovered: false },
  { code: 'CG004B', name: 'Caesarean Delivery (LSCS) with Critical Care', specialty: 'Obstetrics & Gynaecology', standardRate: 28500, implantCovered: false },
  { code: 'OR012C', name: 'Total Knee Arthroplasty (TKR) Unilateral with US FDA Implant', specialty: 'Orthopaedics', standardRate: 85000, implantCovered: true },
  { code: 'MD003A', name: 'Severe Dengue / Febrile Sepsis HDU Management (4-Day Stay)', specialty: 'Internal Medicine', standardRate: 18500, implantCovered: false },
  { code: 'CA001A', name: 'Percutaneous Coronary Angioplasty (PTCA) with Drug Eluting Stent', specialty: 'Cardiology', standardRate: 65000, implantCovered: true },
  { code: 'NE005A', name: 'Maintenance Hemodialysis (Single Session Pack)', specialty: 'Nephrology', standardRate: 3500, implantCovered: false }
];

await client.query(`
  UPDATE clinical.insurance_payers
  SET metadata = $1, electronic_payer_id = 'NHCX_PMJAY_GOV'
  WHERE payer_code = 'PAY-PMJAY-004';
`, [JSON.stringify({ ayushmanPackages: pmjayPackages, portalUrl: 'https://pmjay.gov.in/hospital-claims', nhcxCode: 'PMJAY_GOV_01' })]);

await client.query(`
  UPDATE clinical.insurance_payers
  SET metadata = $1, electronic_payer_id = 'STAR_HLTH_01'
  WHERE payer_code = 'PAY-STAR-001';
`, [JSON.stringify({ nhcxCode: 'STAR_HLTH_01', portalUrl: 'https://cashless.starhealth.in' })]);

await client.query(`
  UPDATE clinical.insurance_payers
  SET metadata = $1, electronic_payer_id = 'ICICI_LOMB_04'
  WHERE payer_code = 'PAY-ICICI-002';
`, [JSON.stringify({ nhcxCode: 'ICICI_LOMB_04', portalUrl: 'https://ilcashless.icicilombard.com' })]);

await client.query(`
  UPDATE clinical.insurance_payers
  SET metadata = $1, electronic_payer_id = 'NIVA_BUPA_05'
  WHERE payer_code = 'PAY-NIVA-003';
`, [JSON.stringify({ nhcxCode: 'NIVA_BUPA_05', portalUrl: 'https://provider.nivabupa.com' })]);

const extraInsurers = [
  { code: 'PAY-CARE-005', name: 'Care Health Insurance (Religare)', tpa: 'Care In-House Claims', nhcx: 'CARE_HLTH_02', portal: 'https://careinsurance.com/claims' },
  { code: 'PAY-HDFC-006', name: 'HDFC ERGO General Insurance', tpa: 'HDFC ERGO Health TPA', nhcx: 'HDFC_ERGO_03', portal: 'https://hdfcergo.com/health-claims' },
  { code: 'PAY-MEDI-007', name: 'Medi Assist TPA India Ltd.', tpa: 'Medi Assist Corporate TPA', nhcx: 'MEDI_ASST_06', portal: 'https://medibuddy.in/hospital-portal' },
  { code: 'PAY-PARA-008', name: 'Paramount Health Services & Insurance TPA', tpa: 'Paramount TPA', nhcx: 'PARAMOUNT_07', portal: 'https://paramounttpa.com' }
];

if (firstPayer) {
  for (const ins of extraInsurers) {
    await client.query(`
      INSERT INTO clinical.insurance_payers (
        tenant_id, partner_id, organization_id, branch_id,
        payer_code, payer_name, payer_type, tpa_name,
        electronic_payer_id, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, 'COMMERCIAL_INSURANCE', $7, $8, 'ACTIVE', $9)
      ON CONFLICT DO NOTHING;
    `, [
      firstPayer.tenant_id, firstPayer.partner_id, firstPayer.organization_id, firstPayer.branch_id,
      ins.code, ins.name, ins.tpa, ins.nhcx, JSON.stringify({ nhcxCode: ins.nhcx, portalUrl: ins.portal })
    ]);
  }
}

const totalInsurers = await client.query('SELECT count(*) FROM clinical.insurance_payers;');
console.log('Total insurers in DB:', totalInsurers.rows[0].count);

await client.end();
