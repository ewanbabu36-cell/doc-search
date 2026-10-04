import fs from 'fs';
import crypto from 'node:crypto';
import pg from 'pg';
const { Client } = pg;

function deterministicUuid(namespace, code) {
  const hash = crypto.createHash('sha256').update(`${namespace}:${code}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function seedMasterCatalogs(targetTenantId = '11111111-1111-4111-8111-111111111111') {
  const client = new Client({
    connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
  });
  await client.connect();

  console.log(`Starting Master Catalog Seeding for Tenant: ${targetTenantId}...`);

  // 1. Resolve operational hierarchy
  const pRes = await client.query('SELECT id FROM clinical.operational_partners WHERE tenant_id = $1 LIMIT 1;', [targetTenantId]);
  const oRes = await client.query('SELECT id FROM clinical.operational_organizations WHERE tenant_id = $1 LIMIT 1;', [targetTenantId]);
  const fRes = await client.query('SELECT id FROM clinical.operational_facilities WHERE tenant_id = $1 LIMIT 1;', [targetTenantId]);

  if (pRes.rows.length === 0 || oRes.rows.length === 0) {
    throw new Error(`Operational partner or organization not found for tenant: ${targetTenantId}`);
  }

  const partnerId = pRes.rows[0].id;
  const organizationId = oRes.rows[0].id;
  const facilityId = fRes.rows.length > 0 ? fRes.rows[0].id : null;

  console.log(`Resolved hierarchy: partner=${partnerId}, org=${organizationId}, facility=${facilityId}`);

  // 2. Load medication source
  const medFile = 'apps/partner-platform/src/services/indian-pharmacy-formulary.json';
  const medSource = JSON.parse(fs.readFileSync(medFile, 'utf8'));
  console.log(`Loaded ${medSource.length} medications from ${medFile}`);

  let medInserted = 0;
  let medUpdated = 0;
  let medSkipped = 0;

  for (const m of medSource) {
    const medCode = (m.medicationCode || m.id || '').trim().toUpperCase();
    const id = deterministicUuid(`med:${targetTenantId}`, medCode);

    const genericName = (m.genericName || 'Generic Drug').trim();
    const brandName = (m.brandName || m.name || genericName).trim();
    const strength = (m.strength || '500 mg').trim();
    const dosageForm = (m.dosageForm || 'TABLET').trim().toUpperCase();
    const category = (m.category || 'GENERAL').trim().toUpperCase();
    const manufacturer = (m.manufacturer || 'Standard Pharmaceutical').trim();

    let route = 'ORAL';
    if (dosageForm === 'INJECTION') route = 'PARENTERAL';
    else if (dosageForm === 'DROPS') route = 'OPHTHALMIC';
    else if (dosageForm === 'OINTMENT') route = 'TOPICAL';
    else if (dosageForm === 'INHALER') route = 'INHALATION';

    const packSize = m.packUnits || 1;
    const unitOfMeasure = m.unitOfMeasure || dosageForm;

    const metadata = {
      sourceId: m.id,
      scheduleType: m.scheduleType,
      packConfiguration: m.packConfiguration,
      mrp: m.mrp,
      unitPrice: m.unitPrice,
      costPrice: m.costPrice,
      gstRate: m.gstRate,
      hsnCode: m.hsnCode,
      barcode: m.barcode,
      janAushadhiEquivalent: m.janAushadhiEquivalent
    };

    const query = `
      INSERT INTO clinical.medication_catalog (
        id, tenant_id, partner_id, organization_id, branch_id,
        medication_code, generic_name, brand_name, strength, dosage_form,
        route, pack_size, unit_of_measure, manufacturer, category,
        controlled_medication, prescription_required, status, metadata,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19,
        NOW(), NOW()
      )
      ON CONFLICT (tenant_id, medication_code) DO UPDATE SET
        generic_name = EXCLUDED.generic_name,
        brand_name = EXCLUDED.brand_name,
        strength = EXCLUDED.strength,
        dosage_form = EXCLUDED.dosage_form,
        route = EXCLUDED.route,
        manufacturer = EXCLUDED.manufacturer,
        category = EXCLUDED.category,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING (xmax = 0) AS inserted;
    `;

    const res = await client.query(query, [
      id, targetTenantId, partnerId, organizationId, facilityId,
      medCode, genericName, brandName, strength, dosageForm,
      route, packSize, unitOfMeasure, manufacturer, category,
      false, true, 'ACTIVE', JSON.stringify(metadata)
    ]);

    if (res.rows[0].inserted) {
      medInserted++;
    } else {
      medUpdated++;
    }
  }

  console.log(`Medication seeding complete: ${medInserted} inserted, ${medUpdated} updated.`);

  // 3. Load investigation source
  const labFile = 'apps/partner-platform/src/services/clinical-diagnostic-icd10-catalog.ts';
  const labRaw = fs.readFileSync(labFile, 'utf8');

  const regex = /\{\s*id:\s*'([^']+)',\s*testCode:\s*'([^']+)',\s*name:\s*'([^']+)',\s*shortName:\s*'([^']+)',\s*category:\s*'([^']+)',\s*categoryLabel:\s*'([^']+)',\s*specimen:\s*'([^']+)',\s*fasting:\s*(true|false),\s*tatHours:\s*(\d+)\s*\}/g;
  let labSource = [];
  let match;
  while ((match = regex.exec(labRaw)) !== null) {
    labSource.push({
      id: match[1],
      testCode: match[2],
      name: match[3],
      shortName: match[4],
      category: match[5],
      categoryLabel: match[6],
      specimen: match[7],
      fasting: match[8] === 'true',
      tatHours: Number(match[9])
    });
  }

  console.log(`Loaded ${labSource.length} investigations from ${labFile}`);

  let invInserted = 0;
  let invUpdated = 0;

  for (const l of labSource) {
    const testCode = l.testCode.trim().toUpperCase();
    const id = deterministicUuid(`inv:${targetTenantId}`, testCode);
    const testName = l.name.trim();
    const shortName = l.shortName.trim();
    const category = l.category.trim().toUpperCase();
    const specimenType = l.specimen.trim();
    const fasting = l.fasting;
    const tatHours = l.tatHours || 24;

    let department = 'Pathology';
    if (category === 'BIOCHEMISTRY' || category === 'ENDOCRINOLOGY') department = 'Biochemistry';
    else if (category === 'HEMATOLOGY') department = 'Hematology';
    else if (category === 'MICROBIOLOGY' || category === 'IMMUNOLOGY') department = 'Microbiology';
    else if (category === 'RADIOLOGY') department = 'Radiology';
    else if (category === 'CARDIOLOGY') department = 'Cardiology';

    const metadata = {
      sourceId: l.id,
      categoryLabel: l.categoryLabel,
      fasting: fasting,
      tatHours: tatHours
    };

    // We check if a test with (tenant_id, test_code) already exists
    const checkQuery = `
      SELECT id FROM clinical.investigation_catalog
      WHERE tenant_id = $1 AND UPPER(test_code) = $2;
    `;
    const existing = await client.query(checkQuery, [targetTenantId, testCode]);

    if (existing.rows.length === 0) {
      const insertQuery = `
        INSERT INTO clinical.investigation_catalog (
          id, tenant_id, partner_id, organization_id, branch_id,
          test_code, test_name, short_name, category, specimen_type,
          department, fasting_required, turnaround_target_hours, status,
          metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, 'ACTIVE',
          $14, NOW(), NOW()
        );
      `;
      await client.query(insertQuery, [
        id, targetTenantId, partnerId, organizationId, facilityId,
        testCode, testName, shortName, category, specimenType,
        department, fasting, tatHours, JSON.stringify(metadata)
      ]);
      invInserted++;
    } else {
      const updateQuery = `
        UPDATE clinical.investigation_catalog SET
          test_name = $1,
          short_name = $2,
          category = $3,
          specimen_type = $4,
          department = $5,
          fasting_required = $6,
          turnaround_target_hours = $7,
          metadata = $8,
          updated_at = NOW()
        WHERE id = $9;
      `;
      await client.query(updateQuery, [
        testName, shortName, category, specimenType, department,
        fasting, tatHours, JSON.stringify(metadata), existing.rows[0].id
      ]);
      invUpdated++;
    }
  }

  console.log(`Investigation seeding complete: ${invInserted} inserted, ${invUpdated} updated.`);

  await client.end();

  return {
    medications: { inserted: medInserted, updated: medUpdated, total: medSource.length },
    investigations: { inserted: invInserted, updated: invUpdated, total: labSource.length }
  };
}

if (process.argv[1]?.endsWith('seed-master-catalogs.mjs')) {
  seedMasterCatalogs().catch(err => {
    console.error('Master catalog seed error:', err);
    process.exit(1);
  });
}
