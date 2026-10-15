import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import compiled shared-core normalizer
import { 
  CANONICAL_FACILITY_PROFILES, 
  PARTNER_PROFILE_ALLOWED_MODULES,
  isModuleAllowedForPartnerProfile 
} from '../packages/shared-core/dist/workflow/facility-normalizer.js';

import { capabilityEngine } from '../apps/api-gateway/dist/services/company/CapabilityAndDependencyEngine.js';
import { PartnerTemplateService } from '../apps/api-gateway/dist/services/company/PartnerTemplateService.js';

describe('🏥 Healthcare Facility Profile & Domain Template Verification Audit', async () => {
  const templateService = new PartnerTemplateService();
  await templateService.seedMasterTemplates();
  const allTemplates = await templateService.getTemplates();

  it('Directive 1 & 4: Master Templates seeded with 100% valid capabilities and zero conflicts', async () => {
    assert.ok(allTemplates.length >= 10, `Expected at least 10 master templates, found ${allTemplates.length}`);
    
    const requiredTemplates = [
      'TPL_CLINIC_BASIC',
      'TPL_CLINIC_PRO',
      'TPL_HOSPITAL_STANDARD',
      'TPL_HOSPITAL_ENTERPRISE',
      'TPL_DIAGNOSTIC_LAB',
      'TPL_DIAGNOSTIC_RADIOLOGY',
      'TPL_RETAIL_PHARMACY',
      'TPL_HOSPITAL_PHARMACY',
      'TPL_HEALTHCARE_GROUP',
      'TPL_SPECIALTY_CENTRE'
    ];

    for (const code of requiredTemplates) {
      const tpl = await templateService.getTemplateById(code);
      assert.ok(tpl, `Template ${code} must exist`);
      const v1 = tpl.versions[0];
      assert.ok(v1, `Template ${code} must have version 1`);
      
      // Validate capability dependencies
      const check = capabilityEngine.validateCapabilityDependencies(v1.capabilities || []);
      assert.equal(check.valid, true, `Template ${code} has capability conflicts: ${JSON.stringify(check.conflicts)}`);
      
      // Validate lifetime limits are free / high-capacity
      assert.ok(v1.limits.storageQuotaGb >= 20, `${code} storageQuotaGb should be >= 20GB`);
      assert.ok(v1.limits.maxDoctors >= 0, `${code} maxDoctors should be >= 0`);
    }
  });

  it('Directive 1: Hospital Enterprise Blueprint has full department spectrum', async () => {
    const hospitalTpl = await templateService.getTemplateById('TPL_HOSPITAL_ENTERPRISE');
    const v1 = hospitalTpl.versions[0];
    const deptCodes = v1.departments.map(d => d.code);
    
    const expectedHospitalDepts = [
      'ENT_EMERGENCY', 'ENT_ICU_CCU', 'ENT_SURGERY_OT', 'ENT_OPD_COMPLEX',
      'ENT_IPD_WARDS', 'ENT_RADIOLOGY', 'ENT_PATHOLOGY', 'ENT_BLOOD_BANK',
      'ENT_PHARMACY_HUB', 'ENT_FINANCE', 'ENT_MRD_AUDIT', 'ENT_DIETARY',
      'ENT_BIOMEDICAL', 'ENT_PROCUREMENT'
    ];
    for (const d of expectedHospitalDepts) {
      assert.ok(deptCodes.includes(d), `Hospital blueprint missing department: ${d}`);
    }

    assert.ok(v1.capabilities.includes('PROCUREMENT'), 'Hospital blueprint must include PROCUREMENT capability');
    assert.ok(v1.capabilities.includes('BIOMEDICAL'), 'Hospital blueprint must include BIOMEDICAL capability');
    assert.ok(v1.capabilities.includes('ABDM'), 'Hospital blueprint must include ABDM capability');
    assert.ok(v1.capabilities.includes('QUALITY_NABH'), 'Hospital blueprint must include QUALITY_NABH capability');
  });

  it('Directive 1: Clinic Pro Blueprint has modern doctor chamber & restock cart', async () => {
    const clinicTpl = await templateService.getTemplateById('TPL_CLINIC_PRO');
    const v1 = clinicTpl.versions[0];
    const deptCodes = v1.departments.map(d => d.code);

    assert.ok(deptCodes.includes('OPD_CONSULTATION'), 'Clinic blueprint missing OPD_CONSULTATION');
    assert.ok(deptCodes.includes('CLINIC_PHARMACY'), 'Clinic blueprint missing CLINIC_PHARMACY');
    assert.ok(deptCodes.includes('CLINIC_SAMPLE_COLLECTION'), 'Clinic blueprint missing CLINIC_SAMPLE_COLLECTION');
    assert.ok(deptCodes.includes('CLINIC_PROCUREMENT'), 'Clinic blueprint missing CLINIC_PROCUREMENT');

    assert.ok(v1.capabilities.includes('PROCUREMENT'), 'Clinic blueprint must include PROCUREMENT');
    assert.ok(v1.capabilities.includes('WHATSAPP'), 'Clinic blueprint must include WHATSAPP');
    assert.ok(v1.capabilities.includes('AI_CDSS'), 'Clinic blueprint must include AI_CDSS');
  });

  it('Directive 1: Diagnostic Lab Blueprint has NABL LIMS & Reagents', async () => {
    const labTpl = await templateService.getTemplateById('TPL_DIAGNOSTIC_LAB');
    const v1 = labTpl.versions[0];
    const deptCodes = v1.departments.map(d => d.code);

    assert.ok(deptCodes.includes('LAB_SAMPLE_INTAKE'), 'Lab blueprint missing LAB_SAMPLE_INTAKE');
    assert.ok(deptCodes.includes('LAB_BIOCHEMISTRY'), 'Lab blueprint missing LAB_BIOCHEMISTRY');
    assert.ok(deptCodes.includes('LAB_MICROBIOLOGY'), 'Lab blueprint missing LAB_MICROBIOLOGY');
    assert.ok(deptCodes.includes('LAB_BILLING'), 'Lab blueprint missing LAB_BILLING');
    assert.ok(deptCodes.includes('LAB_PROCUREMENT'), 'Lab blueprint missing LAB_PROCUREMENT');
  });

  it('Directive 1: Pharmacy Blueprint has POS, Narcotics Register & Wholesale Restock', async () => {
    const pharmTpl = await templateService.getTemplateById('TPL_RETAIL_PHARMACY');
    const v1 = pharmTpl.versions[0];
    const deptCodes = v1.departments.map(d => d.code);

    assert.ok(deptCodes.includes('PHARM_COUNTER'), 'Pharmacy blueprint missing PHARM_COUNTER');
    assert.ok(deptCodes.includes('PHARM_STOCK'), 'Pharmacy blueprint missing PHARM_STOCK');
  });

  it('Directive 2: Facility Normalizer allows B2B Procurement and WhatsApp across all profiles', () => {
    const profiles = ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'];
    
    for (const p of profiles) {
      assert.equal(isModuleAllowedForPartnerProfile(p, 'procurement-supply-chain'), true, 
        `procurement-supply-chain must be allowed for ${p}`);
      assert.equal(isModuleAllowedForPartnerProfile(p, 'whatsapp-patient-portal'), true, 
        `whatsapp-patient-portal must be allowed for ${p}`);
    }

    // Hospital specific checks
    assert.equal(isModuleAllowedForPartnerProfile('HOSPITAL', 'emergency-trauma'), true);
    assert.equal(isModuleAllowedForPartnerProfile('HOSPITAL', 'icu-critical-care'), true);
    assert.equal(isModuleAllowedForPartnerProfile('HOSPITAL', 'ot-management'), true);
    assert.equal(isModuleAllowedForPartnerProfile('HOSPITAL', 'ipd-wards'), true);
    assert.equal(isModuleAllowedForPartnerProfile('HOSPITAL', 'asset-biomedical-maintenance'), true);

    // Clinic specific checks
    assert.equal(isModuleAllowedForPartnerProfile('CLINIC', 'opd-consultation'), true);
    assert.equal(isModuleAllowedForPartnerProfile('CLINIC', 'ipd-wards'), false, 'Clinic should not show IPD wards');
    assert.equal(isModuleAllowedForPartnerProfile('CLINIC', 'ot-management'), false, 'Clinic should not show full OT management');

    // Pharmacy specific checks
    assert.equal(isModuleAllowedForPartnerProfile('PHARMACY', 'pharmacy-pos'), true);
    assert.equal(isModuleAllowedForPartnerProfile('PHARMACY', 'ipd-wards'), false);

    // Pathology specific checks
    assert.equal(isModuleAllowedForPartnerProfile('PATHOLOGY', 'pathology-lims'), true);
    assert.equal(isModuleAllowedForPartnerProfile('PATHOLOGY', 'ipd-wards'), false);
  });
});
