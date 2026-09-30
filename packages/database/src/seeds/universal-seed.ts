import crypto from 'node:crypto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema/index.js';
import { seedWorkflowDatabase } from './workflow-seeds.js';

export const UNIVERSAL_SEED_IDS = {
  TENANT_ID: '11111111-1111-4111-8111-111111111111',
  TENANT_B_ID: '22222222-2222-4222-8222-222222222222',
  PARTNER_ID: '00000000-0000-4000-8000-000000000001',
  ORG_ID: '00000000-0000-4000-8000-000000000002',
  BRANCH_ID: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  FACILITY_ID: '00000000-0000-4000-8000-000000000003',
  LEGAL_ENTITY_ID: 'e1a22222-2222-4222-8222-222222222222',
  DEPT_CLIN_OPS_ID: 'd1a22222-2222-4222-8222-222222222222',
  DESIG_LEAD_ID: 'f1a22222-2222-4222-8222-222222222222',
  UNIT_ID: '55555555-5555-4555-8555-555555555501',
  WARD_GEN_ID: '66666666-6666-4666-8666-666666666601',
  WARD_ICU_ID: '66666666-6666-4666-8666-666666666602',
  ROOM_GEN_ID: '77777777-7777-4777-8777-777777777711',
  ROOM_ICU_ID: '77777777-7777-4777-8777-777777777712',
  PARTNER_PROFILE_A_ID: '22222222-2222-4222-8222-222222222201',
  PARTNER_PROFILE_B_ID: '22222222-2222-4222-8222-222222222202',
  PARTNER_PROFILE_RK_ID: 'cb51bf34-a820-48b6-bb62-faffcbd1cf9a',
  PRODUCT_CORE_ID: '44444444-4444-4444-8444-444444444401',
  PLAN_ENTERPRISE_ID: '66666666-6666-4666-8666-666666666601',
  SUBSCRIPTION_A_ID: '55555555-5555-4555-8555-555555555501',
  SUBSCRIPTION_B_ID: '55555555-5555-4555-8555-555555555502',
  LICENSE_A_ID: '33333333-3333-4333-8333-333333333301',
  LICENSE_B_ID: '33333333-3333-4333-8333-333333333302'
};

/**
 * Universal Database Seed Script
 * Pre-populates all foundation, staff, hospital, inpatient, pharmacy, and diagnostic
 * tables with authoritative baseline rows so that the entire platform is 100% database-driven.
 *
 * Implements strict environment gating:
 * - System Masters (Product, Plans, Core Legal Entity, Workflows) are ALWAYS seeded.
 * - Demo Fixtures (Doc Search Healthcare Network, Apex Hospitals Group, fake beds, test patients)
 *   are SKIPPED in production (NODE_ENV=production) unless explicitly enabled via SEED_DEMO_FIXTURES=true.
 */
export async function seedUniversalDatabase(db: NodePgDatabase<typeof schema>): Promise<void> {
  const allowDemo = process.env['SEED_DEMO_FIXTURES'] === 'true' || process.env['FORCE_DEMO_SEEDS'] === 'true';

  const {
    TENANT_ID,
    PARTNER_ID,
    ORG_ID,
    BRANCH_ID,
    FACILITY_ID,
    LEGAL_ENTITY_ID,
    DEPT_CLIN_OPS_ID,
    DESIG_LEAD_ID,
    UNIT_ID,
    WARD_GEN_ID,
    WARD_ICU_ID,
    ROOM_GEN_ID,
    ROOM_ICU_ID
  } = UNIVERSAL_SEED_IDS;

  // ============================================================================
  // SYSTEM MASTER DATA (ALWAYS SEEDED IN ALL ENVIRONMENTS INCLUDING PRODUCTION)
  // ============================================================================

  // Master 0. Core Platform System Tenant & Platform Core Branch
  try {
    await db
      .insert(schema.tenants)
      .values({
        id: TENANT_ID,
        name: 'Doc Search Healthcare Platform',
        slug: 'docsearch-platform',
        status: 'ACTIVE'
      })
      .onConflictDoNothing();

    await db
      .insert(schema.branches)
      .values({
        id: BRANCH_ID,
        tenantId: TENANT_ID,
        name: 'Doc Search Platform Core Facility Branch',
        code: 'BR-CORE-01',
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  // Master 1. Core Platform Product
  try {
    await db
      .insert(schema.products)
      .values({
        id: UNIVERSAL_SEED_IDS.PRODUCT_CORE_ID,
        code: 'PROD_HEALTHCARE_SUITE',
        name: 'DOC SEARCH Healthcare Platform',
        description: 'Complete Hospital, Clinic, Pharmacy and Diagnostic Suite',
        category: 'CORE_PLATFORM',
        status: 'ACTIVE',
        version: '1.0.0'
      })
      .onConflictDoNothing();
  } catch {}

  // Master 2. Commercial Plans (Authoritative 4 Partner Types)
  const standardPlans = [
    {
      id: '11111111-1111-4111-8111-111111111101',
      code: 'PLAN_PATHOLOGY_ANNUAL',
      name: 'Pathology Diagnostic Lab Annual Plan',
      description: 'Authoritative LIMS & Pathology Suite',
      basePrice: 6000,
      currency: 'INR',
      billingInterval: 'ANNUAL'
    },
    {
      id: '11111111-1111-4111-8111-111111111102',
      code: 'PLAN_PHARMACY_ANNUAL',
      name: 'Pharmacy Retail & Wholesale Annual Plan',
      description: 'Authoritative Pharmacy POS & Inventory Suite',
      basePrice: 6000,
      currency: 'INR',
      billingInterval: 'ANNUAL'
    },
    {
      id: '11111111-1111-4111-8111-111111111103',
      code: 'PLAN_SOLO_CLINIC_ANNUAL',
      name: 'Solo Doctor / OPD Clinic Annual Plan',
      description: 'Authoritative Doctor OPD & Clinical EMR Suite',
      basePrice: 6000,
      currency: 'INR',
      billingInterval: 'ANNUAL'
    },
    {
      id: '11111111-1111-4111-8111-111111111104',
      code: 'PLAN_HOSPITAL_ANNUAL',
      name: 'Multi-Speciality Hospital Enterprise Annual Plan',
      description: 'Comprehensive Hospital OS (OPD, IPD, Emergency, OT, LIMS, Pharmacy, Billing)',
      basePrice: 20000,
      currency: 'INR',
      billingInterval: 'ANNUAL'
    },
    {
      id: UNIVERSAL_SEED_IDS.PLAN_ENTERPRISE_ID,
      code: 'PLAN_ENTERPRISE_NETWORK',
      name: 'Enterprise Healthcare Network',
      description: 'Multi-facility hospital & diagnostic network',
      basePrice: 20000,
      currency: 'INR',
      billingInterval: 'ANNUAL'
    }
  ];

  for (const p of standardPlans) {
    try {
      await db
        .insert(schema.plans)
        .values({
          id: p.id,
          productId: UNIVERSAL_SEED_IDS.PRODUCT_CORE_ID,
          code: p.code,
          name: p.name,
          description: p.description,
          status: 'ACTIVE',
          version: '1.0.0',
          basePrice: p.basePrice,
          currency: p.currency,
          billingInterval: p.billingInterval
        })
        .onConflictDoNothing();

      // Seed initial v1.0 Price Version
      await db
        .insert(schema.priceVersions)
        .values({
          id: crypto.randomUUID(),
          planId: p.id,
          versionNumber: 'v1.0',
          annualBasePriceInr: p.basePrice,
          gstRatePercent: 18,
          sacCode: '998313',
          isActive: true
        })
        .onConflictDoNothing();
    } catch {}
  }

  // Master 3. Platform Company HQ Legal Entity
  try {
    await db
      .insert(schema.legalEntities)
      .values({
        id: LEGAL_ENTITY_ID,
        entityCode: 'LE-IND-DOC',
        entityName: 'Doc Search Health Technologies Pvt Ltd',
        entityType: 'C_CORP',
        jurisdiction: 'IN',
        registrationNumber: 'U72900DL2026PTC123456',
        incorporationDate: new Date('2026-01-01T00:00:00Z'),
        taxIdentifierReference: 'GSTIN29AAAAA0000A1Z5',
        registeredAddress: '7th Floor, Cyber Heights, Sector 62, Gurugram, India',
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  // Master 4. Platform Company Core Departments
  try {
    await db
      .insert(schema.departments)
      .values({
        id: DEPT_CLIN_OPS_ID,
        departmentCode: 'CLIN-OPS',
        departmentName: 'Clinical & Hospital Operations',
        description: 'Oversees partner clinical operations, hospital integrations, and diagnostics compliance',
        costCenterCode: 'CC-CLIN-8001',
        legalEntityId: LEGAL_ENTITY_ID,
        leadEmail: 'founder@docsearch.health',
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  // Master 5. Platform Core Designations
  try {
    await db
      .insert(schema.designations)
      .values({
        id: DESIG_LEAD_ID,
        designationCode: 'DES-EXEC-LEAD',
        title: 'Executive Founder & SuperAdmin',
        bandLevel: 'EXECUTIVE',
        departmentId: DEPT_CLIN_OPS_ID,
        jobFamily: 'EXECUTIVE_LEADERSHIP',
        isExecutive: true,
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  // Master 6. Workflow Definitions, Versions, Stages & Requirements
  try {
    await seedWorkflowDatabase(db);
  } catch {}

  // ============================================================================
  // PRODUCTION ENVIRONMENT SAFETY GATE:
  // Skip demo hospital fixtures (Doc Search Healthcare Network, Apex Hospitals
  // Group, fake beds, test patients, dummy staff) unless explicitly requested.
  // ============================================================================
  if (!allowDemo) {
    return;
  }

  // 1. Core Tenants
  try {
    await db
      .insert(schema.tenants)
      .values({
        id: TENANT_ID,
        name: 'Doc Search Healthcare Network',
        slug: 'docsearch-health',
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  // 2. Operational Partners & Organizations
  try {
    await db
      .insert(schema.operationalPartners)
      .values({
        id: PARTNER_ID,
        tenantId: TENANT_ID,
        partnerCode: 'PRT-APEX',
        legalBusinessName: 'Apex Healthcare Systems Pvt Ltd',
        partnerType: 'HOSPITAL_SYSTEM',
        contactEmail: 'contact@apexhealth.in',
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  try {
    await db
      .insert(schema.operationalOrganizations)
      .values({
        id: ORG_ID,
        tenantId: TENANT_ID,
        partnerId: PARTNER_ID,
        organizationCode: 'ORG-APEX-MAIN',
        organizationName: 'Apex Multi-Specialty Clinics',
        organizationType: 'HOSPITAL',
        contactEmail: 'contact@apexhealth.in',
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  // 3. Branches & Facilities
  try {
    await db
      .insert(schema.branches)
      .values([
        {
          id: BRANCH_ID,
          tenantId: TENANT_ID,
          name: 'Apex Downtown Main Care Center',
          code: 'BR-DOWNTOWN-01',
          status: 'ACTIVE'
        },
        {
          id: FACILITY_ID,
          tenantId: TENANT_ID,
          name: 'Apex Downtown Main Facility Branch',
          code: 'FAC-01',
          status: 'ACTIVE'
        }
      ])
      .onConflictDoNothing();
  } catch {}

  try {
    await db
      .insert(schema.operationalFacilities)
      .values({
        id: FACILITY_ID,
        tenantId: TENANT_ID,
        partnerId: PARTNER_ID,
        organizationId: ORG_ID,
        facilityCode: 'FAC-DOWNTOWN',
        facilityName: 'Apex Downtown Main Center',
        facilityType: 'INPATIENT_HOSPITAL',
        addressStreet: '100 Medical Blvd, Sector 4',
        addressCity: 'Bangalore',
        addressState: 'Karnataka',
        addressPostalCode: '560001',
        addressCountry: 'IN',
        contactEmail: 'downtown@apexhealth.in',
        contactPhone: '+91-80-23456789',
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  // 4. Company HQ: Legal Entities, Departments, Designations, Internal Employees
  try {
    await db
      .insert(schema.legalEntities)
      .values({
        id: LEGAL_ENTITY_ID,
        entityCode: 'LE-IND-DOC',
        entityName: 'Doc Search Health Technologies Pvt Ltd',
        entityType: 'C_CORP',
        jurisdiction: 'IN',
        registrationNumber: 'U72900DL2026PTC123456',
        incorporationDate: new Date('2026-01-01T00:00:00Z'),
        taxIdentifierReference: 'GSTIN29AAAAA0000A1Z5',
        registeredAddress: '7th Floor, Cyber Heights, Sector 62, Gurugram, India',
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  try {
    await db
      .insert(schema.departments)
      .values({
        id: DEPT_CLIN_OPS_ID,
        departmentCode: 'CLIN-OPS',
        departmentName: 'Clinical & Hospital Operations',
        description: 'Oversees partner clinical operations, hospital integrations, and diagnostics compliance',
        costCenterCode: 'CC-CLIN-8001',
        legalEntityId: LEGAL_ENTITY_ID,
        leadEmail: 'founder@docsearch.health',
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  try {
    await db
      .insert(schema.designations)
      .values({
        id: DESIG_LEAD_ID,
        designationCode: 'DES-EXEC-FOUNDER',
        title: 'Founder & Chief Executive Officer',
        bandLevel: 'EXECUTIVE',
        departmentId: DEPT_CLIN_OPS_ID,
        jobFamily: 'EXECUTIVE_LEADERSHIP',
        isExecutive: true,
        status: 'ACTIVE'
      })
      .onConflictDoNothing();
  } catch {}

  try {
    await db
      .insert(schema.internalEmployees)
      .values([
        {
          id: 'e0000000-0000-4000-8000-000000000001',
          employeeCode: 'EMP-0001',
          firstName: 'MERAJ',
          lastName: 'SHARIF',
          workEmail: 'founder@docsearch.health',
          legalEntityId: LEGAL_ENTITY_ID,
          departmentId: DEPT_CLIN_OPS_ID,
          designationId: DESIG_LEAD_ID,
          employmentType: 'FULL_TIME',
          employmentStatus: 'ACTIVE',
          startDate: new Date('2025-01-01T00:00:00Z'),
          metadata: { role: 'SUPER_ADMIN_FOUNDER', isProtectedFounder: true, immutableShield: true }
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 5. Operational Clinical Departments
  const deptGenMedId = 'd0000000-0000-4000-8000-000000000001';
  const deptCardioId = 'd0000000-0000-4000-8000-000000000002';
  const deptLabId = 'd0000000-0000-4000-8000-000000000003';
  const deptPharmId = 'd0000000-0000-4000-8000-000000000004';
  const deptIpdId = 'd0000000-0000-4000-8000-000000000005';

  try {
    await db
      .insert(schema.operationalDepartments)
      .values([
        {
          id: deptGenMedId,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentCode: 'DEP-GEN-MED',
          departmentName: 'General Outpatient Medicine',
          costCenterCode: 'CC-OPD-101',
          status: 'ACTIVE'
        },
        {
          id: deptCardioId,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentCode: 'DEP-CARDIO',
          departmentName: 'Cardiology & Vascular Medicine',
          costCenterCode: 'CC-CARDIO-201',
          status: 'ACTIVE'
        },
        {
          id: deptLabId,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentCode: 'DEP-LAB',
          departmentName: 'Pathology & Diagnostic Laboratory',
          costCenterCode: 'CC-LAB-301',
          status: 'ACTIVE'
        },
        {
          id: deptPharmId,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentCode: 'DEP-PHARM',
          departmentName: 'Clinical Pharmacy & Dispensing',
          costCenterCode: 'CC-PHARM-401',
          status: 'ACTIVE'
        },
        {
          id: deptIpdId,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentCode: 'DEP-IPD',
          departmentName: 'Inpatient Wards & Critical Care',
          costCenterCode: 'CC-IPD-501',
          status: 'ACTIVE'
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 6. Operational Clinical Staff & Verified Doctors
  const staffDoc1 = 'ea000000-0000-4000-8000-000000000001';
  const staffDoc2 = 'ea000000-0000-4000-8000-000000000002';
  const staffDoc3 = 'ea000000-0000-4000-8000-000000000003';
  try {
    await db
      .insert(schema.operationalStaff)
      .values([
        {
          id: staffDoc1,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptCardioId,
          staffCode: 'STF-DOC-101',
          fullName: 'Dr. Rajesh Khanna',
          workEmail: 'dr.khanna@apexhealth.in',
          workPhone: '+91-9811001122',
          staffType: 'DOCTOR',
          primaryRole: 'CONSULTANT',
          employmentType: 'FULL_TIME',
          employmentStatus: 'ACTIVE',
          joiningDate: new Date('2024-01-15T00:00:00Z')
        },
        {
          id: staffDoc2,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptGenMedId,
          staffCode: 'STF-DOC-102',
          fullName: 'Dr. Sneha Kulkarni',
          workEmail: 'dr.kulkarni@apexhealth.in',
          workPhone: '+91-9811001133',
          staffType: 'DOCTOR',
          primaryRole: 'SPECIALIST',
          employmentType: 'FULL_TIME',
          employmentStatus: 'ACTIVE',
          joiningDate: new Date('2024-03-01T00:00:00Z')
        },
        {
          id: staffDoc3,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptGenMedId,
          staffCode: 'STF-DOC-103',
          fullName: 'Dr. Tariq Ahmad',
          workEmail: 'dr.ahmad@apexhealth.in',
          workPhone: '+91-9811001144',
          staffType: 'DOCTOR',
          primaryRole: 'CONSULTANT',
          employmentType: 'VISITING',
          employmentStatus: 'ACTIVE',
          joiningDate: new Date('2024-06-10T00:00:00Z')
        }
      ])
      .onConflictDoNothing();
  } catch {}

  const docProfile1 = 'da000000-0000-4000-8000-000000000001';
  const docProfile2 = 'da000000-0000-4000-8000-000000000002';
  const docProfile3 = 'da000000-0000-4000-8000-000000000003';
  try {
    await db
      .insert(schema.doctorProfiles)
      .values([
        {
          id: docProfile1,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptCardioId,
          staffId: staffDoc1,
          doctorCode: 'DOC-101',
          medicalLicenseNumber: 'NMC-84920',
          qualification: 'MBBS, MD, DM (Cardiology)',
          experienceYears: 16,
          primarySpecialty: 'Cardiology',
          availabilityStatus: 'AVAILABLE',
          status: 'VERIFIED'
        },
        {
          id: docProfile2,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptGenMedId,
          staffId: staffDoc2,
          doctorCode: 'DOC-102',
          medicalLicenseNumber: 'NMC-71934',
          qualification: 'MBBS, DCH, MD (Pediatrics)',
          experienceYears: 9,
          primarySpecialty: 'Pediatrics',
          availabilityStatus: 'IN_CONSULTATION',
          status: 'PENDING_VERIFICATION'
        },
        {
          id: docProfile3,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptGenMedId,
          staffId: staffDoc3,
          doctorCode: 'DOC-103',
          medicalLicenseNumber: 'NMC-33921',
          qualification: 'MBBS, DM (Neurology)',
          experienceYears: 12,
          primarySpecialty: 'Neurology',
          availabilityStatus: 'AVAILABLE',
          status: 'PENDING_VERIFICATION'
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 7. Inpatient Unit, Wards, Rooms, Beds
  try {
    await db
      .insert(schema.inpatientUnits)
      .values({
        id: UNIT_ID,
        tenantId: TENANT_ID,
        partnerId: PARTNER_ID,
        organizationId: ORG_ID,
        branchId: BRANCH_ID,
        unitCode: 'UNIT-MED-SURG',
        unitName: 'Medical-Surgical Inpatient Pavilion',
        unitType: 'GENERAL_MEDICINE',
        specialty: 'MULTI_SPECIALTY',
        building: 'Main Hospital Tower',
        floor: 'Level 3',
        isActive: true
      })
      .onConflictDoNothing();
  } catch {}

  try {
    await db
      .insert(schema.inpatientWards)
      .values([
        {
          id: WARD_GEN_ID,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: BRANCH_ID,
          unitId: UNIT_ID,
          wardCode: 'WARD-GEN-A',
          wardName: 'General Medical Ward A',
          wardType: 'GENERAL',
          careLevel: 'TERTIARY_CARE',
          genderPolicy: 'ALL',
          building: 'Main Tower',
          floor: '3rd Floor',
          wing: 'East Wing',
          nursingStationName: 'Station 3E',
          totalBeds: 8,
          activeBeds: 8,
          occupiedBeds: 0,
          isolationCapable: false,
          ventilatorCapable: false,
          isActive: true
        },
        {
          id: WARD_ICU_ID,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: BRANCH_ID,
          unitId: UNIT_ID,
          wardCode: 'WARD-ICU-1',
          wardName: 'Intensive Critical Care Unit (ICU-1)',
          wardType: 'ICU',
          careLevel: 'LEVEL_3_ICU',
          genderPolicy: 'ALL',
          building: 'Main Tower',
          floor: '2nd Floor',
          wing: 'Critical Care Wing',
          nursingStationName: 'ICU Central Command',
          totalBeds: 4,
          activeBeds: 4,
          occupiedBeds: 0,
          isolationCapable: true,
          ventilatorCapable: true,
          isActive: true
        }
      ])
      .onConflictDoNothing();
  } catch {}

  try {
    await db
      .insert(schema.inpatientRooms)
      .values([
        {
          id: ROOM_GEN_ID,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: BRANCH_ID,
          wardId: WARD_GEN_ID,
          roomNumber: 'ROOM-301',
          roomClass: 'STANDARD',
          bedCount: 4,
          isNegativePressure: false,
          hasMedicalGas: false,
          isActive: true
        },
        {
          id: ROOM_ICU_ID,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: BRANCH_ID,
          wardId: WARD_ICU_ID,
          roomNumber: 'ICU-BAY-01',
          roomClass: 'ICU_BAY',
          bedCount: 4,
          isNegativePressure: true,
          hasMedicalGas: true,
          isActive: true
        }
      ])
      .onConflictDoNothing();
  } catch {}

  try {
    await db
      .insert(schema.inpatientBeds)
      .values([
        {
          id: 'b0000000-0000-4000-8000-000000000101',
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: BRANCH_ID,
          wardId: WARD_GEN_ID,
          roomId: ROOM_GEN_ID,
          bedCode: 'BED-101',
          bedNumber: 'BED-101',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'GENERAL',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: false,
          dailyChargeRate: '150.00',
          isActive: true
        },
        {
          id: 'b0000000-0000-4000-8000-000000000102',
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: BRANCH_ID,
          wardId: WARD_GEN_ID,
          roomId: ROOM_GEN_ID,
          bedCode: 'BED-102',
          bedNumber: 'BED-102',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'GENERAL',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: false,
          dailyChargeRate: '150.00',
          isActive: true
        },
        {
          id: 'b0000000-0000-4000-8000-000000000103',
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: BRANCH_ID,
          wardId: WARD_GEN_ID,
          roomId: ROOM_GEN_ID,
          bedCode: 'BED-103',
          bedNumber: 'BED-103',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'GENERAL',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: false,
          dailyChargeRate: '150.00',
          isActive: true
        },
        {
          id: 'b0000000-0000-4000-8000-000000000201',
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: BRANCH_ID,
          wardId: WARD_ICU_ID,
          roomId: ROOM_ICU_ID,
          bedCode: 'ICU-BED-01',
          bedNumber: 'ICU-BED-01',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'ICU',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: true,
          hasCardiacMonitor: true,
          dailyChargeRate: '500.00',
          isActive: true
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 8. Medication Catalog & Inventory
  const med1 = 'cd000000-0000-4000-8000-000000000001';
  const med2 = 'cd000000-0000-4000-8000-000000000002';
  const med3 = 'cd000000-0000-4000-8000-000000000003';
  try {
    await db
      .insert(schema.medicationCatalog)
      .values([
        {
          id: med1,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          medicationCode: 'MED-AMOX-500',
          genericName: 'Amoxicillin Trihydrate',
          brandName: 'Amoxil 500mg',
          strength: '500 mg',
          dosageForm: 'CAPSULE',
          route: 'ORAL',
          packSize: 10,
          unitOfMeasure: 'CAPSULE',
          manufacturer: 'GlaxoSmithKline',
          category: 'ANTIBIOTIC',
          controlledMedication: false,
          prescriptionRequired: true,
          status: 'ACTIVE',
          therapeuticClass: 'ANTIBACTERIAL'
        },
        {
          id: med2,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          medicationCode: 'MED-PARA-650',
          genericName: 'Paracetamol',
          brandName: 'Dolo 650mg',
          strength: '650 mg',
          dosageForm: 'TABLET',
          route: 'ORAL',
          packSize: 15,
          unitOfMeasure: 'TABLET',
          manufacturer: 'Micro Labs',
          category: 'ANALGESIC',
          controlledMedication: false,
          prescriptionRequired: false,
          status: 'ACTIVE',
          therapeuticClass: 'ANALGESIC_ANTIPYRETIC'
        },
        {
          id: med3,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          medicationCode: 'MED-MET-500',
          genericName: 'Metformin Hydrochloride',
          brandName: 'Glucophage 500mg',
          strength: '500 mg',
          dosageForm: 'TABLET',
          route: 'ORAL',
          packSize: 20,
          unitOfMeasure: 'TABLET',
          manufacturer: 'Merck',
          category: 'ANTIDIABETIC',
          controlledMedication: false,
          prescriptionRequired: true,
          status: 'ACTIVE',
          therapeuticClass: 'BIGUANIDE'
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 9. Lab Diagnostics Catalog
  const inv1 = 'ce000000-0000-4000-8000-000000000001';
  const inv2 = 'ce000000-0000-4000-8000-000000000002';
  const inv3 = 'ce000000-0000-4000-8000-000000000003';
  try {
    await db
      .insert(schema.investigationCatalog)
      .values([
        {
          id: inv1,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          testCode: 'LAB-HEM-CBC',
          testName: 'Complete Blood Count (CBC) with Differential',
          category: 'HEMATOLOGY',
          specimenType: 'WHOLE_BLOOD',
          department: 'PATHOLOGY',
          status: 'ACTIVE'
        },
        {
          id: inv2,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          testCode: 'LAB-BIO-LIPID',
          testName: 'Lipid Profile Comprehensive Panel',
          category: 'BIOCHEMISTRY',
          specimenType: 'SERUM',
          department: 'BIOCHEMISTRY',
          status: 'ACTIVE'
        },
        {
          id: inv3,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          testCode: 'LAB-DIA-HBA1C',
          testName: 'Glycated Hemoglobin (HbA1c)',
          category: 'ENDOCRINOLOGY',
          specimenType: 'WHOLE_BLOOD',
          department: 'BIOCHEMISTRY',
          status: 'ACTIVE'
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 10. Partner Network Profiles: Clean Day-0 State (Only dynamically registered partners)


  // 11. Platform Admin & Facility User Branches
  const superAdminUserId = 'e0000000-0000-4000-8000-000000000001';
  try {
    await db
      .insert(schema.users)
      .values({
        id: superAdminUserId,
        email: 'founder@docsearch.health',
        firstName: 'Meraj',
        lastName: 'Sharif',
        status: 'ACTIVE',
        isEmailVerified: true
      })
      .onConflictDoNothing();

    await db
      .insert(schema.userBranches)
      .values([
        {
          id: 'ca000000-0000-4000-8000-000000000001',
          userId: superAdminUserId,
          branchId: BRANCH_ID,
          tenantId: TENANT_ID,
          isHomeBranch: true
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 12. Clinical Patients Registry
  const pat1 = 'ca000000-0000-4000-8000-000000000001';
  const pat2 = 'ca000000-0000-4000-8000-000000000002';
  const pat3 = 'ca000000-0000-4000-8000-000000000003';
  try {
    await db
      .insert(schema.patients)
      .values([
        {
          id: pat1,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          mrn: 'UHID-4401',
          patientCode: 'PAT-4401',
          firstName: 'Aarav',
          lastName: 'Sharma',
          gender: 'MALE',
          bloodGroup: 'O_POSITIVE',
          dateOfBirth: '1982-05-12',
          status: 'ACTIVE'
        },
        {
          id: pat2,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          mrn: 'UHID-2914',
          patientCode: 'PAT-2914',
          firstName: 'Meena',
          lastName: 'Patel',
          gender: 'FEMALE',
          bloodGroup: 'B_POSITIVE',
          dateOfBirth: '1988-11-23',
          status: 'ACTIVE'
        },
        {
          id: pat3,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          mrn: 'UHID-1108',
          patientCode: 'PAT-1108',
          firstName: 'Rajiv',
          lastName: 'Malhotra',
          gender: 'MALE',
          bloodGroup: 'A_POSITIVE',
          dateOfBirth: '1966-03-19',
          status: 'ACTIVE'
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 13. Encounters & Live OPD Queue
  const enc1 = 'ec000000-0000-4000-8000-000000000001';
  const enc2 = 'ec000000-0000-4000-8000-000000000002';
  const enc3 = 'ec000000-0000-4000-8000-000000000003';
  try {
    await db
      .insert(schema.encounters)
      .values([
        {
          id: enc1,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptCardioId,
          patientId: pat1,
          doctorId: docProfile1,
          encounterNumber: 'ENC-OPD-1001',
          encounterType: 'OPD_CONSULTATION',
          status: 'IN_CONSULTATION',
          priority: 'ROUTINE',
          chiefComplaint: 'Cardiology post-procedure assessment',
          registeredAt: new Date()
        },
        {
          id: enc2,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptGenMedId,
          patientId: pat2,
          doctorId: docProfile2,
          encounterNumber: 'ENC-OPD-1002',
          encounterType: 'OPD_CONSULTATION',
          status: 'CHECKED_IN',
          priority: 'ROUTINE',
          chiefComplaint: 'Seasonal viral symptoms & fever',
          registeredAt: new Date()
        },
        {
          id: enc3,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptCardioId,
          patientId: pat3,
          doctorId: docProfile1,
          encounterNumber: 'ENC-OPD-1003',
          encounterType: 'OPD_CONSULTATION',
          status: 'COMPLETED',
          priority: 'ROUTINE',
          chiefComplaint: 'Hypertension routine titration review',
          registeredAt: new Date()
        }
      ])
      .onConflictDoNothing();

    await db
      .insert(schema.encounterQueues)
      .values([
        {
          id: 'ea000000-0000-4000-8000-000000000011',
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptCardioId,
          doctorId: docProfile1,
          encounterId: enc1,
          tokenNumber: '42',
          queueDate: '2026-09-10',
          queueStatus: 'SERVING',
          estimatedWaitMinutes: 0
        },
        {
          id: 'ea000000-0000-4000-8000-000000000012',
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          departmentId: deptGenMedId,
          doctorId: docProfile2,
          encounterId: enc2,
          tokenNumber: '29',
          queueDate: '2026-09-10',
          queueStatus: 'WAITING',
          estimatedWaitMinutes: 14
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 14. Emergency Encounters
  const emg1 = 'ee000000-0000-4000-8000-000000000001';
  const emg2 = 'ee000000-0000-4000-8000-000000000002';
  try {
    await db
      .insert(schema.emergencyEncounters)
      .values([
        {
          id: emg1,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          encounterNumber: 'EMR-2026-0042',
          patientId: pat1,
          patientName: 'Aarav Sharma',
          patientMrn: 'UHID-4401',
          patientAge: 42,
          patientGender: 'MALE',
          arrivalMode: 'AMBULANCE',
          broughtBy: 'EMS Paramedic',
          chiefComplaint: 'Acute chest pain radiating to left jaw (Suspected STEMI)',
          arrivalTimestamp: new Date(Date.now() - 4 * 60 * 1000),
          currentStatus: 'TRIAGED',
          currentZoneName: 'Resuscitation Bay 1',
          currentBedNumber: 'ER-BAY-01',
          triageEsiLevel: 'LEVEL_1_RESUSCITATION',
          isTraumaAlert: true
        },
        {
          id: emg2,
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          encounterNumber: 'EMR-2026-0043',
          patientId: pat3,
          patientName: 'Rajiv Malhotra',
          patientMrn: 'UHID-1108',
          patientAge: 58,
          patientGender: 'MALE',
          arrivalMode: 'WALK_IN',
          broughtBy: 'Self / Family',
          chiefComplaint: 'Acute respiratory distress with SpO2 88%',
          arrivalTimestamp: new Date(Date.now() - 19 * 60 * 1000),
          currentStatus: 'UNDER_TREATMENT',
          currentZoneName: 'High Dependency Bay 2',
          currentBedNumber: 'ER-BAY-04',
          triageEsiLevel: 'LEVEL_2_EMERGENT',
          isTraumaAlert: false
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 15. Investigation Orders
  try {
    await db
      .insert(schema.investigationOrders)
      .values([
        {
          id: 'fa000000-0000-4000-8000-000000000001',
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          orderNumber: 'LAB-8910',
          patientId: pat1,
          encounterId: enc1,
          orderingDoctorId: docProfile1,
          investigationId: inv1,
          priority: 'URGENT',
          status: 'SAMPLE_COLLECTED',
          specimenType: 'WHOLE_BLOOD',
          clinicalIndication: 'Acute chest pain evaluation',
          orderedAt: new Date(Date.now() - 35 * 60 * 1000),
          metadata: { testName: 'Complete Blood Count (CBC) + Lipid Profile', labCenter: 'Central Pathology Laboratory' }
        },
        {
          id: 'fa000000-0000-4000-8000-000000000002',
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          orderNumber: 'LAB-8911',
          patientId: pat2,
          encounterId: enc2,
          orderingDoctorId: docProfile2,
          investigationId: inv2,
          priority: 'ROUTINE',
          status: 'PROCESSING',
          specimenType: 'SERUM',
          clinicalIndication: 'Persistent neurological headache evaluation',
          orderedAt: new Date(Date.now() - 60 * 60 * 1000),
          metadata: { testName: 'MRI Brain with Contrast (1.5 Tesla)', labCenter: 'Metropolis Diagnostics Wing' }
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 16. Pharmacy Prescriptions
  try {
    await db
      .insert(schema.pharmacyPrescriptions)
      .values([
        {
          id: 'fb000000-0000-4000-8000-000000000001',
          tenantId: TENANT_ID,
          partnerId: PARTNER_ID,
          organizationId: ORG_ID,
          branchId: FACILITY_ID,
          prescriptionNumber: 'RX-4412',
          patientId: pat3,
          encounterId: enc3,
          prescribingDoctorId: docProfile1,
          priority: 'URGENT',
          status: 'DISPENSED',
          prescriptionType: 'OUTPATIENT',
          prescribedAt: new Date(Date.now() - 45 * 60 * 1000),
          notes: 'Cardio Rx (Atorvastatin + Metoprolol)'
        }
      ])
      .onConflictDoNothing();
  } catch {}

  // 17. Subscriptions, Commercial Billing & Invoices
  try {
    const [existingProduct] = await db.select().from(schema.products);
    const existingPlans = await db.select().from(schema.plans);
    const activeProductId = existingProduct?.id || UNIVERSAL_SEED_IDS.PRODUCT_CORE_ID;
    const activePlanId = existingPlans[2]?.id || existingPlans[0]?.id || UNIVERSAL_SEED_IDS.PLAN_ENTERPRISE_ID;

    await db
      .insert(schema.partnerProfiles)
      .values([
        {
          id: UNIVERSAL_SEED_IDS.PARTNER_PROFILE_A_ID,
          tenantId: TENANT_ID,
          partnerType: 'HOSPITAL_NETWORK',
          lifecycleStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          onboardingStep: 'COMPLETED',
          onboardingProgressPercent: 100,
          legalName: 'Apex Healthcare Systems Pvt Ltd',
          tradeName: 'Apex Multi-Specialty Hospital',
          primaryContactName: 'Dr. Test Admin',
          primaryContactEmail: 'contact@apexhealth.in'
        }
      ])
      .onConflictDoNothing();

    await db
      .insert(schema.subscriptions)
      .values([
        {
          id: 'fc000000-0000-4000-8000-000000000001',
          partnerId: UNIVERSAL_SEED_IDS.PARTNER_PROFILE_A_ID,
          productId: activeProductId,
          planId: activePlanId,
          planVersion: '1.0.0',
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          startDate: new Date('2026-01-01T00:00:00Z'),
          renewalDate: new Date('2026-12-31T23:59:59Z')
        }
      ])
      .onConflictDoNothing();

    await db
      .insert(schema.licenses)
      .values([
        {
          id: UNIVERSAL_SEED_IDS.LICENSE_A_ID,
          licenseKey: 'LIC-DOCSEARCH-PRO-001',
          partnerId: UNIVERSAL_SEED_IDS.PARTNER_PROFILE_A_ID,
          tenantId: TENANT_ID,
          subscriptionId: 'fc000000-0000-4000-8000-000000000001',
          planId: activePlanId,
          licenseType: 'COMMERCIAL',
          status: 'ACTIVE',
          activationStatus: 'ACTIVATED',
          maxConcurrentUsers: 100,
          maxDoctors: 50,
          maxBranches: 10,
          issuedAt: new Date('2026-01-01T00:00:00Z'),
          startDate: new Date('2026-01-01T00:00:00Z'),
          expiryDate: new Date('2027-12-31T23:59:59Z'),
          gracePeriodEnd: new Date('2028-01-15T23:59:59Z'),
          signature: crypto
            .createHmac(
              'sha256',
              process.env['LICENSE_HMAC_SECRET'] ||
                process.env['JWT_SECRET'] ||
                'docsearch_master_jwt_secret_dev_32char_key_only'
            )
            .update(
              `LIC-DOCSEARCH-PRO-001:${UNIVERSAL_SEED_IDS.PARTNER_PROFILE_A_ID}:${TENANT_ID}:fc000000-0000-4000-8000-000000000001:${activePlanId}`
            )
            .digest('hex')
        }
      ])
      .onConflictDoNothing();

    await db
      .insert(schema.billingAccounts)
      .values([
        {
          id: 'fc000000-0000-4000-8000-000000000002',
          partnerId: UNIVERSAL_SEED_IDS.PARTNER_PROFILE_A_ID,
          billingContactName: 'Finance Director',
          billingEmail: 'billing@apexhealth.in',
          taxIdReference: 'GSTIN29AAAAA1111A1Z5',
          currency: 'INR',
          billingCycle: 'MONTHLY',
          status: 'ACTIVE'
        }
      ])
      .onConflictDoNothing();

    await db
      .insert(schema.invoices)
      .values([
        {
          id: 'fd000000-0000-4000-8000-000000000001',
          billingAccountId: 'fc000000-0000-4000-8000-000000000002',
          subscriptionId: 'fc000000-0000-4000-8000-000000000001',
          invoiceNumber: 'INV-2026-0841',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 86400000),
          currency: 'INR',
          subtotal: '240000.00',
          taxAmount: '43200.00',
          totalAmount: '283200.00',
          status: 'PAID'
        }
      ])
      .onConflictDoNothing();
  } catch {}
}
