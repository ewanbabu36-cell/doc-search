import crypto from 'node:crypto';
import { hashPassword, hashPasswordAsync, verifyPassword, verifyPasswordAsync } from '@docsearch/auth';
import type { RoleType } from '@docsearch/api-contracts';
import { SYSTEM_STAFF_PRESETS } from './systemStaffCredentials.js';
import {
  getDatabase,
  users,
  userCredentials,
  operationalStaff,
  tenants,
  branches,
  eq,
  or
} from '@docsearch/database';
import { createLogger } from '@docsearch/shared-core';
import { sessionRevocationService } from './SessionRevocationService.js';

const logger = createLogger('real-auth-service');

export interface AuthenticatedUserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  tenantId: string;
  organizationId: string;
  branchId: string;
  roles: RoleType[];
  permissions: string[];
  passwordHash: string;
  tenantName?: string | undefined;
  organizationType?: string | undefined;
  planTier?: string | undefined;
  planExpiryDate?: string | undefined;
  accessibleFeatures?: string[] | undefined;
  phone?: string | undefined;
}

const ADMIN_GOVERNANCE_ROLES = new Set([
  'SUPER_ADMIN',
  'HOSPITAL_ADMIN',
  'HOSPITAL_DIRECTOR',
  'ORGANIZATION_ADMIN',
  'FOUNDER',
  'OWNER',
  'ADMINISTRATOR',
  'EXECUTIVE_ADMIN',
  'PARTNER_ADMIN',
  'FACILITY_ADMIN',
  'CENTRE_MANAGER',
  'PHARMACY_DIRECTOR'
]);

const ROLE_PERMISSION_PROFILES: Record<string, string[]> = {
  PHLEBOTOMIST: [
    'lab:orders:read',
    'lab:specimens:create',
    'patients:read',
    'clinical:patients:read'
  ],
  RECEPTIONIST: [
    'patients:read',
    'patients:write',
    'clinical:patients:read',
    'clinical:patients:create',
    'appointments:read',
    'appointments:write',
    'encounters:read',
    'encounters:write',
    'billing:invoices:read',
    'billing:invoices:create',
    'staff:read'
  ],
  FRONT_DESK_EXECUTIVE: [
    'patients:read',
    'patients:write',
    'clinical:patients:read',
    'clinical:patients:create',
    'appointments:read',
    'appointments:write',
    'encounters:read',
    'encounters:write',
    'billing:invoices:read',
    'billing:invoices:create',
    'staff:read'
  ],
  CLINIC_FRONT_DESK: [
    'patients:read',
    'patients:write',
    'clinical:patients:read',
    'clinical:patients:create',
    'appointments:read',
    'appointments:write',
    'encounters:read',
    'encounters:write',
    'billing:invoices:read',
    'billing:invoices:create',
    'staff:read'
  ],
  FRONT_DESK_LEAD: [
    'patients:read',
    'patients:write',
    'clinical:patients:read',
    'clinical:patients:create',
    'appointments:read',
    'appointments:write',
    'encounters:read',
    'encounters:write',
    'billing:invoices:read',
    'billing:invoices:create',
    'staff:read'
  ],
  DISPENSING_PHARMACIST: [
    'pharmacy:read',
    'pharmacy:write',
    'pharmacy:dispense',
    'pharmacy:medications:read',
    'pharmacy:orders:read',
    'pharmacy:inventory:read',
    'prescriptions:read'
  ],
  PHARMACIST: [
    'pharmacy:read',
    'pharmacy:write',
    'pharmacy:dispense',
    'pharmacy:medications:read',
    'pharmacy:orders:read',
    'pharmacy:inventory:read',
    'prescriptions:read',
    'inventory:read',
    'inventory:write'
  ],
  STAFF_NURSE: [
    'clinical:read',
    'patients:read',
    'clinical:patients:read',
    'encounters:read',
    'encounters:write',
    'inpatient:read',
    'staff:read'
  ],
  NURSE: [
    'clinical:read',
    'patients:read',
    'clinical:patients:read',
    'encounters:read',
    'encounters:write',
    'inpatient:read',
    'staff:read'
  ],
  LAB_TECHNICIAN: [
    'lab:orders:read',
    'lab:specimens:create',
    'lab:results:create',
    'lab:results:update',
    'patients:read'
  ],
  DOCTOR: [
    'clinical:read',
    'clinical:write',
    'patients:read',
    'patients:write',
    'appointments:read',
    'appointments:write',
    'encounters:read',
    'encounters:write',
    'prescriptions:read',
    'prescriptions:write',
    'lab:orders:read',
    'lab:orders:create',
    'radiology:read',
    'inpatient:read',
    'inpatient:write',
    'staff:read'
  ],
  CLINIC_DOCTOR: [
    'clinical:read',
    'clinical:write',
    'patients:read',
    'patients:write',
    'appointments:read',
    'appointments:write',
    'encounters:read',
    'encounters:write',
    'prescriptions:read',
    'prescriptions:write',
    'lab:orders:read',
    'lab:orders:create',
    'radiology:read',
    'billing:read',
    'billing:invoices:read',
    'billing:invoices:create',
    'staff:read',
    'staff:write',
    'staff:create',
    'staff:update',
    'partners:read',
    'partners:update',
    'partners:create'
  ],
  PATHOLOGIST: [
    'lab:orders:read',
    'lab:orders:create',
    'lab:specimens:create',
    'lab:results:create',
    'lab:results:update',
    'lab:reports:finalize',
    'patients:read',
    'billing:read'
  ],
  RADIOLOGIST: [
    'radiology:read',
    'radiology:write',
    'patients:read',
    'clinical:read'
  ],
  CASHIER_BILLING_OFFICER: [
    'billing:read',
    'billing:write',
    'billing:invoices:read',
    'billing:invoices:create',
    'patients:read'
  ]
};

export function resolveStrictPermissionsForRoles(roles: RoleType[]): string[] {
  const normRoles = (roles || []).map((r) => String(r).toUpperCase().trim());
  const isExecutiveOrAdmin = normRoles.some((r) => ADMIN_GOVERNANCE_ROLES.has(r));

  if (isExecutiveOrAdmin) {
    return [
      'partners:read',
      'partners:write',
      'partners:create',
      'clinical:read',
      'clinical:write',
      'patients:read',
      'patients:write',
      'appointments:read',
      'appointments:write',
      'encounters:read',
      'encounters:write',
      'prescriptions:read',
      'prescriptions:write',
      'lab:orders:read',
      'lab:orders:create',
      'lab:specimens:create',
      'lab:results:create',
      'lab:results:update',
      'lab:reports:finalize',
      'radiology:read',
      'radiology:write',
      'pharmacy:read',
      'pharmacy:write',
      'pharmacy:dispense',
      'inventory:read',
      'inventory:write',
      'inpatient:read',
      'inpatient:write',
      'billing:read',
      'billing:write',
      'billing:manage',
      'billing:invoices:read',
      'billing:invoices:create',
      'staff:read',
      'staff:write',
      'staff:create'
    ];
  }

  const perms = new Set<string>();
  for (const r of normRoles) {
    const mapped = ROLE_PERMISSION_PROFILES[r];
    if (mapped) {
      for (const p of mapped) perms.add(p);
    }
  }
  if (perms.size === 0) {
    perms.add('clinical:patients:read');
  }
  return Array.from(perms);
}

const DEV_TEST_USERS: Map<string, AuthenticatedUserRecord> =
  process.env['NODE_ENV'] === 'production'
    ? new Map()
    : new Map([
  [
    'founder@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492000',
      email: 'founder@docsearch.health',
      firstName: 'MERAJ',
      lastName: 'SHARIF',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: ['SUPER_ADMIN'] as RoleType[],
      permissions: [
        '*',
        'saas:manage',
        'billing:manage',
        'tenants:manage',
        'audit:read',
        'security:manage',
        'compliance:manage',
        'clinical:patients:read',
        'sales:read',
        'sales:create',
        'sales:update',
        'partners:read',
        'partners:create',
        'partners:update'
      ],
      passwordHash: hashPassword('FounderPass123!')
    }
  ],
  [
    'founder.alok@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492000',
      email: 'founder.alok@docsearch.health',
      firstName: 'Alok',
      lastName: 'Verma',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: ['SUPER_ADMIN', 'COMPLIANCE_OFFICER'] as RoleType[],
      permissions: ['*'],
      passwordHash: hashPassword('FounderPass123!')
    }
  ],
  [
    'doctor.rajesh@docsearch.health',
    {
      id: 'dddd4444-8492-4ddd-8ddd-849208492004',
      email: 'doctor.rajesh@docsearch.health',
      firstName: 'Dr. Rajesh',
      lastName: 'Sharma',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: ['DOCTOR', 'CLINIC_DOCTOR'] as RoleType[],
      permissions: ['*'],
      passwordHash: hashPassword('DoctorPass123!')
    }
  ],
  [
    'sunil.pharmacy@docsearch.health',
    {
      id: 'cccc3333-8492-4ccc-8ccc-849208492003',
      email: 'sunil.pharmacy@docsearch.health',
      firstName: 'Sunil',
      lastName: 'Kumar, B.Pharm',
      status: 'ACTIVE',
      tenantId: '33333333-3333-4333-8333-333333333333',
      organizationId: '77777777-7777-4777-8777-777777777701',
      branchId: '88888888-8888-4888-8888-888888888801',
      roles: ['PHARMACIST', 'HOSPITAL_ADMIN'] as RoleType[],
      permissions: [
        '*',
        'pharmacy:dispense',
        'pharmacy:inventory:read',
        'pharmacy:inventory:create',
        'pharmacy:inventory:update',
        'pharmacy:medications:read',
        'pharmacy:medications:create',
        'billing:invoices:read',
        'billing:invoices:create'
      ],
      tenantName: 'Apollo Lifecare Chemist & Druggist',
      organizationType: 'PHARMACY',
      planTier: 'Retail Pharmacy Pro POS',
      planExpiryDate: '365 Days Free (Founding Partner)',
      accessibleFeatures: [
        'High-Speed Barcode Billing & Thermal Receipt Print',
        'Automated Batch & Expiry Radar (30/60/90 Days Alerts)',
        'Jan Aushadhi & PMBJP Generic Alternate Recommender',
        'Schedule H & H1 Narcotics Digital Compliance Register',
        'WhatsApp Invoice PDF & Patient Medication Refill Reminders'
      ],
      phone: '+91 98321 54321',
      passwordHash: hashPassword('PharmaPass123!')
    }
  ],
  [
    'whitelabel.admin@docsearch.health',
    {
      id: 'bbbb2222-8492-4bbb-8bbb-849208492001',
      email: 'whitelabel.admin@docsearch.health',
      firstName: 'Dr. Rajesh',
      lastName: 'Verma',
      status: 'ACTIVE',
      tenantId: '22222222-2222-4222-8222-222222222222',
      organizationId: '55555555-5555-4555-8555-555555555501',
      branchId: '66666666-6666-4666-8666-666666666601',
      roles: ['HOSPITAL_ADMIN'] as RoleType[],
      permissions: [
        '*',
        'partners:read',
        'partners:create',
        'partners:update',
        'partners:delete',
        'partners:manage',
        'clinical:patients:read',
        'clinical:patients:create',
        'clinical:patients:write',
        'clinical:patients:update',
        'clinical:patients:delete',
        'clinical:encounters:read',
        'clinical:encounters:create',
        'clinical:encounters:update',
        'clinical:encounters:delete',
        'clinical:queues:read',
        'clinical:queues:create',
        'clinical:queues:update',
        'billing:manage',
        'billing:invoices:read',
        'billing:invoices:create',
        'billing:invoices:update',
        'hospital:manage',
        'opd:manage',
        'ipd:manage',
        'bed:manage'
      ],
      tenantName: 'Apollo Super-Speciality Hospital',
      organizationType: 'HOSPITAL',
      planTier: 'Enterprise Hospital Network',
      planExpiryDate: '365 Days Validity',
      accessibleFeatures: [
        'Hospital Core HIS & IPD Suite',
        'Bed Census & Admissions',
        'Emergency & Nurse Station',
        'OT & ICU Scheduling',
        'E-Prescriptions & Telehealth',
        'White-Label Hospital Studio'
      ],
      phone: '+91 98765 43210',
      passwordHash: hashPassword('Hospital@2026!')
    }
  ],
  [
    'doctor@docsearch.health',
    {
      id: 'dddd4444-8492-4ddd-8ddd-849208492004',
      email: 'doctor@docsearch.health',
      firstName: 'Dr. Alok',
      lastName: 'Sharma, MD',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: ['CLINIC_DOCTOR', 'DOCTOR'] as RoleType[],
      permissions: [
        'clinical:consultation:read',
        'clinical:consultation:create',
        'clinical:consultation:update',
        'clinical:consultation:author',
        'clinical:consultations:create',
        'clinical:patients:read',
        'clinical:patients:create',
        'clinical:patients:update',
        'clinical:encounters:read',
        'clinical:encounters:create',
        'clinical:prescriptions:create',
        'clinical:prescription:create',
        'clinical:prescription:sign',
        'clinical:prescription:read',
        'clinical:investigations:create',
        'clinical:investigations:read',
        'clinical:diagnosis:enter',
        'clinical:diagnosis:view',
        'clinical:vitals:record',
        'clinical:vitals:view',
        'patient:record:view',
        'patient:record:create',
        'patient:vitals:view',
        'patient:vitals:record',
        'telemedicine:access',
        'ai_copilot:soap:generate',
        'ai_copilot:soap:approve',
        'ai_copilot:sepsis:evaluate',
        'ai_copilot:ddi:evaluate',
        'ai_copilot:panic:read'
      ],
      tenantName: 'Dr. Sharma Heart & General OPD Clinic',
      organizationType: 'CLINIC',
      planTier: 'Doctor OPD Clinic Pro',
      planExpiryDate: '365 Days Validity',
      accessibleFeatures: [
        'High-Speed Doctor OPD Desk & EMR',
        'Ambient AI Voice Consultation Scribe',
        '1-Click Digital Rx with WhatsApp Dispatch',
        'Direct Chemist & Pathology Network Sync',
        'ABDM ABHA Patient Record Integration'
      ],
      phone: '+91 98111 22334',
      passwordHash: hashPassword('DoctorPass123!')
    }
  ],
  [
    'pathology@docsearch.health',
    {
      id: 'eeee5555-8492-4eee-8eee-849208492005',
      email: 'pathology@docsearch.health',
      firstName: 'Dr. Shalini',
      lastName: 'Deshmukh, MD (Pathology)',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '00000000-0000-4000-8000-000000000002',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: ['LAB_DIRECTOR', 'PATHOLOGIST', 'LAB_TECHNICIAN'] as any as RoleType[],
      permissions: [
        '*',
        'lab:orders',
        'lab:specimens',
        'lab:results',
        'clinical-investigation',
        'clinical:investigations:read',
        'clinical:investigations:create',
        'clinical:investigations:update',
        'clinical:investigations:verify',
        'clinical:investigations:report',
        'lab:billing',
        'lab:referrals'
      ],
      tenantName: 'Apex Central Pathology & Diagnostic Lab',
      organizationType: 'PATHOLOGY',
      planTier: 'Pathology Pioneer Lifetime Free',
      planExpiryDate: 'Lifetime Free Access (Pioneer Tier)',
      accessibleFeatures: [
        'NABL ISO 15189:2022 LIMS Workbench',
        'Vacutainer Thermal Barcode Sticker Generation',
        'Auto-Analyzer ASTM/HL7 Instrument Interface',
        'Instant WhatsApp NABL PDF Dispatch',
        'Referring Doctor B2B Commission Ledger',
        'Walk-In Front Desk POS Billing & Thermal Receipts',
        'Public Tamper-Proof QR Verification Portal'
      ],
      phone: '+91 98222 33445',
      passwordHash: hashPassword('PathologyPass123!')
    }
  ]
]);

let pendingDbWrites: Promise<unknown>[] = [];

function trackDbWrite(p: Promise<unknown>): void {
  pendingDbWrites.push(p);
  p.finally(() => {
    pendingDbWrites = pendingDbWrites.filter((item) => item !== p);
  });
}

export class RealAuthService {
  private userCache = new Map<string, AuthenticatedUserRecord>(
    process.env['NODE_ENV'] === 'production' ? [] : DEV_TEST_USERS
  );

  constructor() {
    // PostgreSQL is the single authoritative persistent source of truth.
    // Zero local JSON files (partner_credentials.json / approved_partners.json) are read on startup.
  }

  async flushPendingWrites(): Promise<void> {
    if (pendingDbWrites.length > 0) {
      await Promise.allSettled([...pendingDbWrites]);
    }
  }

  /**
   * Authoritative cryptographic password verification against PostgreSQL user credentials
   */
  async authenticateUser(email: string, plainPassword: string): Promise<AuthenticatedUserRecord | null> {
    await this.flushPendingWrites();
    const emailNorm = email.toLowerCase().trim();
    let user = this.userCache.get(emailNorm);

    // 1. Try querying PostgreSQL database
    const db = getDatabase();
    if (db) {
      try {
        const rows = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            status: users.status,
            metadata: users.metadata,
            passwordHash: userCredentials.passwordHash
          })
          .from(users)
          .innerJoin(userCredentials, eq(users.id, userCredentials.userId))
          .where(eq(users.email, emailNorm))
          .limit(1);

        if (rows && rows.length > 0 && rows[0]) {
          const row = rows[0];
          const meta = (row.metadata || {}) as Record<string, any>;

          user = {
            id: row.id,
            email: row.email,
            firstName: row.firstName,
            lastName: row.lastName,
            status: row.status,
            tenantId: meta['tenantId'] || '11111111-1111-4111-8111-111111111111',
            organizationId: meta['organizationId'] || '33333333-3333-4333-8333-333333333301',
            branchId: meta['branchId'] || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            roles: SYSTEM_STAFF_PRESETS.get(emailNorm)?.record?.roles || meta['roles'] || ['DOCTOR'],
            permissions: SYSTEM_STAFF_PRESETS.get(emailNorm)?.record?.permissions ||
              ((meta['roles'] || []).includes('HOSPITAL_DIRECTOR') || (meta['roles'] || []).includes('HOSPITAL_ADMIN') ? ['*'] : meta['permissions'] || ['clinical:patients:read']),
            passwordHash: row.passwordHash,
            tenantName: meta['tenantName'],
            organizationType: meta['organizationType'],
            planTier: meta['planTier'],
            planExpiryDate: meta['planExpiryDate'],
            accessibleFeatures: meta['accessibleFeatures'],
            phone: meta['phone']
          };
          this.userCache.set(emailNorm, user);
        }
      } catch (err) {
        logger.warn('Database lookup during auth failed, falling back to cache:', { error: String(err) });
      }
    }

    // 2. Support pre-configured system staff presets on-the-fly in dev/test
    if (!user && process.env['NODE_ENV'] !== 'production') {
      const preset = SYSTEM_STAFF_PRESETS.get(emailNorm);
      if (preset) {
        if (plainPassword === preset.password) {
          user = {
            ...preset.record,
            passwordHash: hashPassword(preset.password)
          };
          this.userCache.set(emailNorm, user);

          // Seed into PostgreSQL asynchronously so it persists
          trackDbWrite(this.persistPresetToDatabase(user).catch(() => {}));
        } else {
          return null;
        }
      }
    }

    // 2.7 Check operational_staff table for registered operational staff accounts (Email or Staff Code)
    if (db) {
      try {
        const staffRows = await db
          .select()
          .from(operationalStaff)
          .where(
            or(
              eq(operationalStaff.workEmail, emailNorm),
              eq(operationalStaff.staffCode, email.trim().toUpperCase())
            )
          )
          .limit(1);

        if (staffRows && staffRows.length > 0 && staffRows[0]) {
          const s = staffRows[0];
          const sMeta = (s.metadata || {}) as Record<string, any>;
          const sStatus = String(s.employmentStatus || 'ACTIVE').toUpperCase().trim();

          if (
            sStatus === 'SUSPENDED' ||
            sStatus === 'TERMINATED' ||
            sStatus === 'RESTRICTED' ||
            sStatus === 'REQUIRES_REASSIGNMENT' ||
            sMeta['isAccessRevoked']
          ) {
            throw new Error('User account is not active or has been suspended.');
          }

          const explicitRole = String(
            s.primaryRole ||
              sMeta['primaryRole'] ||
              (s.staffType === 'PHARMACIST'
                ? 'DISPENSING_PHARMACIST'
                : s.staffType === 'LAB_TECHNICIAN'
                ? 'LAB_TECHNICIAN'
                : s.staffType === 'DOCTOR'
                ? 'DOCTOR'
                : s.staffType === 'NURSE'
                ? 'STAFF_NURSE'
                : s.staffType === 'BILLING_OFFICER'
                ? 'CASHIER_BILLING_OFFICER'
                : 'RECEPTIONIST')
          )
            .toUpperCase()
            .trim() as RoleType;

          // CAP-02: If user already existed in cache/DB with an auto-injected HOSPITAL_ADMIN secondary role,
          // sanitize roles to strictly match explicit operational_staff assignment unless primaryRole IS HOSPITAL_ADMIN.
          if (user) {
            const explicitRoleStr = String(explicitRole);
            if (
              explicitRoleStr !== 'HOSPITAL_ADMIN' &&
              explicitRoleStr !== 'OWNER' &&
              explicitRoleStr !== 'SUPER_ADMIN'
            ) {
              const sanitizedRoles = (user.roles || []).filter(
                (r) => String(r) !== 'HOSPITAL_ADMIN'
              );
              user.roles = sanitizedRoles.length > 0 ? (sanitizedRoles as RoleType[]) : [explicitRole];
              user.permissions = resolveStrictPermissionsForRoles(user.roles);
            }
          } else {
            const provisionedStaffPassword =
              typeof sMeta['password'] === 'string' && sMeta['password'].trim().length >= 6
                ? sMeta['password'].trim()
                : null;
            const provisionedStaffHash =
              typeof sMeta['passwordHash'] === 'string' && sMeta['passwordHash'].trim().length > 20
                ? sMeta['passwordHash'].trim()
                : null;

            let isStaffPasswordValid = false;
            if (provisionedStaffHash) {
              isStaffPasswordValid = await verifyPasswordAsync(plainPassword, provisionedStaffHash);
            } else if (provisionedStaffPassword) {
              const computedHash = await hashPasswordAsync(provisionedStaffPassword);
              isStaffPasswordValid = await verifyPasswordAsync(plainPassword, computedHash);
            }

            if (isStaffPasswordValid) {
              const orgType = (sMeta['partnerCategory'] ||
                (s.staffType === 'PHARMACIST'
                  ? 'PHARMACY'
                  : s.staffType === 'LAB_TECHNICIAN'
                  ? 'PATHOLOGY'
                  : s.staffType === 'DOCTOR'
                  ? 'CLINIC'
                  : 'HOSPITAL')) as string;

              const nameParts = s.fullName.trim().split(/\s+/);
              const assignedRoles: RoleType[] = [explicitRole];
              user = this.registerPartnerUserCredential({
                email: s.workEmail,
                plainPassword,
                firstName: nameParts[0] || s.fullName,
                lastName: nameParts.slice(1).join(' ') || (s.primaryRole || 'Staff'),
                tenantName: sMeta['tenantName'] || 'Healthcare Facility',
                organizationType: orgType,
                planTier: 'Staff Operations Suite',
                tenantId: s.tenantId,
                organizationId: s.organizationId,
                branchId: s.branchId,
                roles: assignedRoles,
                permissions: resolveStrictPermissionsForRoles(assignedRoles),
                status: 'ACTIVE'
              });
            }
          }
        }
      } catch (err: any) {
        if (err?.message?.includes('not active') || err?.message?.includes('suspended')) {
          throw err;
        }
        logger.warn('Operational staff lookup during auth note:', { error: String(err) });
      }
    }

    if (!user) {
      return null;
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('User account is not active or has been suspended.');
    }

    // 3. Strict cryptographic scrypt password verification (non-blocking)
    const isValid = await verifyPasswordAsync(plainPassword, user.passwordHash);
    if (!isValid) {
      return null;
    }

    if (db && user.tenantId && user.branchId && user.branchId.length === 36 && user.tenantId.length === 36) {
      try {
        await db.insert(tenants).values({
          id: user.tenantId,
          name: user.tenantName || 'Healthcare Facility',
          slug: `tenant-${user.tenantId.slice(0, 8)}`,
          status: 'ACTIVE'
        }).onConflictDoNothing();

        await db.insert(branches).values({
          id: user.branchId,
          tenantId: user.tenantId,
          name: `${user.tenantName || 'Healthcare'} Main Branch`,
          code: `BR-${user.branchId.slice(0, 6).toUpperCase()}`,
          status: 'ACTIVE'
        }).onConflictDoNothing();
      } catch {}
    }

    return user;
  }

  /**
   * Register a newly onboarded live partner credential with cryptographic scrypt hash
   * Persists to PostgreSQL database as the single source of truth.
   */
  registerPartnerUserCredential(data: {
    email: string;
    plainPassword: string;
    firstName: string;
    lastName: string;
    tenantName: string;
    organizationType?: string | undefined;
    planTier?: string | undefined;
    planExpiryDate?: string | undefined;
    accessibleFeatures?: string[] | undefined;
    phone?: string | undefined;
    tenantId?: string | undefined;
    organizationId?: string | undefined;
    branchId?: string | undefined;
    roles?: RoleType[] | undefined;
    permissions?: string[] | undefined;
    status?: string | undefined;
  }): AuthenticatedUserRecord {
    const id = crypto.randomUUID();
    const emailNorm = data.email.toLowerCase().trim();
    const hash = hashPassword(data.plainPassword);

    const deterministicTenantId = crypto
      .createHash('sha256')
      .update(`tenant-${emailNorm}`)
      .digest('hex')
      .substring(0, 32)
      .replace(/^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/, '$1-$2-$3-$4-$5');

    const resolvedRoles: RoleType[] =
      data.roles && data.roles.length > 0
        ? data.roles
        : (['HOSPITAL_ADMIN', 'CLINIC_DOCTOR', 'PATHOLOGIST', 'PHARMACIST', 'RADIOLOGIST'] as RoleType[]);

    const record: AuthenticatedUserRecord = {
      id,
      email: emailNorm,
      firstName: data.firstName,
      lastName: data.lastName,
      status: data.status || 'ACTIVE',
      tenantId: data.tenantId || deterministicTenantId,
      organizationId: data.organizationId || crypto.randomUUID(),
      branchId: data.branchId || crypto.randomUUID(),
      roles: resolvedRoles,
      permissions: data.permissions || resolveStrictPermissionsForRoles(resolvedRoles),
      passwordHash: hash,
      tenantName: data.tenantName,
      organizationType: data.organizationType || 'PATHOLOGY',
      planTier: data.planTier || 'Pathology Pro & Barcode LIMS',
      planExpiryDate: data.planExpiryDate,
      accessibleFeatures: data.accessibleFeatures || ['LIMS Workbench', 'Barcodes', 'WhatsApp Reports'],
      phone: data.phone
    };

    this.userCache.set(emailNorm, record);

    // Persist to PostgreSQL database
    trackDbWrite(
      this.persistUserToDatabase(record).catch((err) => {
        logger.error('Failed to persist user to PostgreSQL:', { email: emailNorm, error: String(err) });
      })
    );

    return record;
  }

  /**
   * Reset a partner or user's password directly from HQ administration
   */
  resetPartnerPassword(email: string, newPlainPassword?: string): { email: string; newPassword: string; success: boolean } {
    const emailNorm = email.toLowerCase().trim();
    const newPassword = newPlainPassword && newPlainPassword.trim().length >= 6
      ? newPlainPassword.trim()
      : `DocSearch@${Math.floor(1000 + Math.random() * 9000)}!`;
    const newHash = hashPassword(newPassword);

    let user = this.getUserByEmail(emailNorm);

    if (user) {
      user.passwordHash = newHash;
      this.userCache.set(emailNorm, user);
      trackDbWrite(
        this.persistUserToDatabase(user).catch((err) => {
          logger.error('Failed to update reset password in DB:', { email: emailNorm, error: String(err) });
        })
      );
    } else {
      user = this.registerPartnerUserCredential({
        email: emailNorm,
        plainPassword: newPassword,
        firstName: 'Partner',
        lastName: 'In-Charge',
        tenantName: 'Healthcare Facility',
        organizationType: 'CLINIC',
        roles: ['CLINIC_DOCTOR'] as unknown as RoleType[],
        status: 'ACTIVE'
      });
    }

    const db = getDatabase();
    if (db && user) {
      trackDbWrite(
        db.update(userCredentials)
          .set({ passwordHash: newHash, updatedAt: new Date() })
          .where(eq(userCredentials.userId, user.id))
          .catch(() => {})
      );
    }

    return {
      email: emailNorm,
      newPassword,
      success: true
    };
  }

  private async persistUserToDatabase(record: AuthenticatedUserRecord): Promise<void> {
    const db = getDatabase();
    if (!db) return;

    try {
      const metadataPayload = {
        tenantId: record.tenantId,
        organizationId: record.organizationId,
        branchId: record.branchId,
        roles: record.roles,
        permissions: record.permissions,
        tenantName: record.tenantName,
        organizationType: record.organizationType,
        planTier: record.planTier,
        planExpiryDate: record.planExpiryDate,
        accessibleFeatures: record.accessibleFeatures,
        phone: record.phone
      };

      // 0. Ensure tenant and branch exist in database
      if (record.tenantId && record.tenantId.length === 36) {
        try {
          await db
            .insert(tenants)
            .values({
              id: record.tenantId,
              name: record.tenantName || 'Healthcare Facility',
              slug: `tenant-${record.tenantId.slice(0, 8)}`,
              status: 'ACTIVE'
            })
            .onConflictDoNothing();
        } catch {}

        if (record.branchId && record.branchId.length === 36) {
          try {
            await db
              .insert(branches)
              .values({
                id: record.branchId,
                tenantId: record.tenantId,
                name: `${record.tenantName || 'Healthcare'} Main Branch`,
                code: `BR-${record.branchId.slice(0, 6).toUpperCase()}`,
                status: 'ACTIVE'
              })
              .onConflictDoNothing();
          } catch {}
        }
      }

      // 1. Insert or update core.users
      const [u] = await db
        .insert(users)
        .values({
          id: record.id,
          email: record.email,
          firstName: record.firstName,
          lastName: record.lastName,
          status: record.status,
          isEmailVerified: true,
          metadata: metadataPayload
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            firstName: record.firstName,
            lastName: record.lastName,
            status: record.status,
            metadata: metadataPayload,
            updatedAt: new Date()
          }
        })
        .returning();

      const userId = u ? u.id : record.id;
      record.id = userId;

      // 2. Insert or update core.user_credentials
      await db
        .insert(userCredentials)
        .values({
          id: crypto.randomUUID(),
          userId,
          passwordHash: record.passwordHash
        })
        .onConflictDoUpdate({
          target: userCredentials.userId,
          set: {
            passwordHash: record.passwordHash,
            updatedAt: new Date()
          }
        });

      logger.info('User successfully persisted to PostgreSQL database:', { email: record.email, userId });
    } catch (err) {
      logger.warn('Failed to insert user into PostgreSQL tables:', { error: String(err) });
    }
  }

  private async persistPresetToDatabase(record: AuthenticatedUserRecord): Promise<void> {
    return this.persistUserToDatabase(record);
  }

  activatePartnerUserCredential(
    email: string,
    planTier?: string,
    normalizedRole?: RoleType,
    workspace?: string,
    accessibleFeatures?: string[]
  ): boolean {
    const emailNorm = email.toLowerCase().trim();
    const user = this.userCache.get(emailNorm) || this.getUserByEmail(emailNorm);
    if (user) {
      user.status = 'ACTIVE';
      if (planTier) {
        user.planTier = planTier;
      }
      if (workspace) {
        user.organizationType = workspace;
      }
      if (normalizedRole && !user.roles.includes(normalizedRole)) {
        user.roles = [normalizedRole, 'PARTNER_ADMIN' as RoleType, 'HOSPITAL_ADMIN' as RoleType];
      } else if (!user.roles.includes('PARTNER_ADMIN' as RoleType)) {
        user.roles = [...user.roles, 'PARTNER_ADMIN' as RoleType];
      }
      user.permissions = resolveStrictPermissionsForRoles(user.roles);
      if (accessibleFeatures && accessibleFeatures.length > 0) {
        user.accessibleFeatures = accessibleFeatures;
      }
      trackDbWrite(this.persistUserToDatabase(user).catch(() => {}));
      trackDbWrite(this.updateUserStatusInDb(user.id, 'ACTIVE', emailNorm).catch(() => {}));
      return true;
    }
    trackDbWrite(this.updateUserStatusInDb('', 'ACTIVE', emailNorm).catch(() => {}));
    return false;
  }

  upgradePartnerPlan(
    email: string,
    targetPlanTier: string,
    accessibleFeatures?: string[]
  ): AuthenticatedUserRecord | null {
    const emailNorm = email.toLowerCase().trim();
    const user = this.userCache.get(emailNorm) || this.getUserByEmail(emailNorm);
    if (user) {
      user.planTier = targetPlanTier;
      if (accessibleFeatures && accessibleFeatures.length > 0) {
        user.accessibleFeatures = accessibleFeatures;
      }
      this.userCache.set(emailNorm, user);
      trackDbWrite(this.persistUserToDatabase(user).catch(() => {}));
      return user;
    }
    return null;
  }

  setPartnerUserStatus(email: string, status: string): boolean {
    const emailNorm = email.toLowerCase().trim();
    const user = this.userCache.get(emailNorm);
    if (user) {
      user.status = status;
      trackDbWrite(this.updateUserStatusInDb(user.id, status, emailNorm).catch(() => {}));

      if (status === 'SUSPENDED' || status === 'INACTIVE') {
        sessionRevocationService.revokeUser(user.id, `User status changed to ${status}`, 'HQ Admin').catch(() => {});
      }
      return true;
    }
    trackDbWrite(this.updateUserStatusInDb('', status, emailNorm).catch(() => {}));
    return false;
  }

  private async updateUserStatusInDb(userId: string, status: string, email?: string): Promise<void> {
    const db = getDatabase();
    if (!db) return;
    try {
      if (userId && userId.length === 36) {
        await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId));
      }
      if (email) {
        await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.email, email.toLowerCase().trim()));
      }
    } catch {}
  }

  suspendPartnerUserCredential(email: string): boolean {
    return this.setPartnerUserStatus(email, 'SUSPENDED');
  }

  async getUserByEmailAsync(email: string): Promise<AuthenticatedUserRecord | undefined> {
    await this.flushPendingWrites();
    const emailNorm = email.toLowerCase().trim();
    const db = getDatabase();
    if (db) {
      try {
        const rows = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            status: users.status,
            metadata: users.metadata,
            passwordHash: userCredentials.passwordHash
          })
          .from(users)
          .innerJoin(userCredentials, eq(users.id, userCredentials.userId))
          .where(eq(users.email, emailNorm))
          .limit(1);

        if (rows && rows.length > 0 && rows[0]) {
          const row = rows[0];
          const meta = (row.metadata || {}) as Record<string, any>;
          const rec: AuthenticatedUserRecord = {
            id: row.id,
            email: row.email,
            firstName: row.firstName,
            lastName: row.lastName,
            status: row.status,
            tenantId: meta['tenantId'] || '11111111-1111-4111-8111-111111111111',
            organizationId: meta['organizationId'] || '33333333-3333-4333-8333-333333333301',
            branchId: meta['branchId'] || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            roles: SYSTEM_STAFF_PRESETS.get(emailNorm)?.record?.roles || meta['roles'] || ['DOCTOR'],
            permissions:
              SYSTEM_STAFF_PRESETS.get(emailNorm)?.record?.permissions ||
              ((meta['roles'] || []).includes('HOSPITAL_DIRECTOR') || (meta['roles'] || []).includes('HOSPITAL_ADMIN')
                ? ['*']
                : meta['permissions'] || ['clinical:patients:read']),
            passwordHash: row.passwordHash,
            tenantName: meta['tenantName'],
            organizationType: meta['organizationType'],
            planTier: meta['planTier'],
            planExpiryDate: meta['planExpiryDate'],
            accessibleFeatures: meta['accessibleFeatures'],
            phone: meta['phone']
          };
          this.userCache.set(emailNorm, rec);
          return rec;
        }
      } catch {}
    }
    return this.getUserByEmail(emailNorm);
  }

  getUserByEmail(email: string): AuthenticatedUserRecord | undefined {
    const emailNorm = email.toLowerCase().trim();
    let user = this.userCache.get(emailNorm);
    if (!user && process.env['NODE_ENV'] !== 'production') {
      const preset = SYSTEM_STAFF_PRESETS.get(emailNorm);
      if (preset) {
        user = {
          ...preset.record,
          passwordHash: hashPassword(preset.password)
        };
        this.userCache.set(emailNorm, user);
      }
    }
    return user;
  }

  async changePassword(email: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const emailNorm = email.toLowerCase().trim();
    const user = this.userCache.get(emailNorm);
    if (!user) {
      throw new Error('User not found');
    }
    const isOldValid = verifyPassword(oldPassword, user.passwordHash);
    if (!isOldValid) {
      throw new Error('Current password does not match');
    }
    user.passwordHash = hashPassword(newPassword);
    this.userCache.set(emailNorm, user);

    // Invalidate all existing sessions and tokens for this user immediately
    try {
      await sessionRevocationService.revokeUser(user.id, 'Password changed - all previous sessions invalidated', user.email);
      if (user.email && user.email !== user.id) {
        await sessionRevocationService.revokeUser(user.email, 'Password changed - all previous sessions invalidated', user.email);
      }
    } catch {}

    // Update DB
    const db = getDatabase();
    if (db && user.id.length === 36) {
      trackDbWrite(
        db.update(userCredentials)
          .set({ passwordHash: user.passwordHash, updatedAt: new Date() })
          .where(eq(userCredentials.userId, user.id))
          .catch(() => {})
      );
    }

    return true;
  }

  getAllLivePartnerUsers(): AuthenticatedUserRecord[] {
    const results: AuthenticatedUserRecord[] = [];
    for (const record of this.userCache.values()) {
      if (record.tenantName) {
        results.push(record);
      }
    }
    return results;
  }

  removePartnerUserCredential(email: string): boolean {
    const emailNorm = email.toLowerCase().trim();
    return this.userCache.delete(emailNorm);
  }

  removePartnerByIdOrTenant(needle: string): boolean {
    const n = needle.toLowerCase().trim();
    let removed = false;
    for (const [email, record] of this.userCache.entries()) {
      if (
        email.toLowerCase() === n ||
        (record.id && record.id.toLowerCase() === n) ||
        (record.tenantId && record.tenantId.toLowerCase() === n) ||
        (record.tenantName && record.tenantName.toLowerCase() === n)
      ) {
        this.userCache.delete(email);
        removed = true;
      }
    }
    return removed;
  }

  clearAllPartnerUserCredentials(): void {
    for (const [email] of this.userCache.entries()) {
      if (email !== 'founder@docsearch.health') {
        this.userCache.delete(email);
      }
    }
  }
}

export const realAuthService = new RealAuthService();
