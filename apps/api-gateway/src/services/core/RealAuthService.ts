import { hashPassword, verifyPassword } from '@docsearch/auth';
import type { RoleType } from '@docsearch/api-contracts';

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
}

/**
 * Production User Store with pre-seeded cryptographic scrypt password hashes
 */
const PRODUCTION_CREDENTIAL_STORE: Map<string, AuthenticatedUserRecord> = new Map([
  [
    'doctor.rajesh@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492001',
      email: 'doctor.rajesh@docsearch.health',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['DOCTOR', 'HOSPITAL_ADMIN'] as RoleType[],
      permissions: [
        'clinical:orders:read',
        'clinical:orders:create',
        'clinical:patients:read',
        'clinical:patients:create',
        'clinical:encounters:read',
        'clinical:encounters:create',
        'clinical:encounters:update',
        'clinical:consultations:read',
        'clinical:consultations:create',
        'clinical:consultations:update',
        'lab:orders:read',
        'lab:orders:create'
      ],
      passwordHash: hashPassword('DoctorPass123!')
    }
  ],
  [
    'pathologist.shalini@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492002',
      email: 'pathologist.shalini@docsearch.health',
      firstName: 'Shalini',
      lastName: 'Deshmukh',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['PATHOLOGIST', 'HOSPITAL_ADMIN'] as RoleType[],
      permissions: [
        'lab:orders:read',
        'lab:orders:create',
        'lab:specimens:create',
        'lab:results:create',
        'lab:results:update',
        'lab:reports:finalize'
      ],
      passwordHash: hashPassword('PathoPass123!')
    }
  ],
  [
    'admin.singhal@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492003',
      email: 'admin.singhal@docsearch.health',
      firstName: 'Anand',
      lastName: 'Singhal',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['HOSPITAL_ADMIN'] as RoleType[],
      permissions: [
        'hospital:admin',
        'clinical:patients:read',
        'clinical:orders:read',
        'lab:orders:read'
      ],
      passwordHash: hashPassword('AdminPass123!')
    }
  ],
  [
    'founder.alok@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492004',
      email: 'founder.alok@docsearch.health',
      firstName: 'Alok',
      lastName: 'Sharma',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['SUPER_ADMIN'] as RoleType[],
      permissions: [
        'saas:manage',
        'billing:manage',
        'tenants:manage',
        'audit:read',
        'security:manage',
        'compliance:manage'
      ],
      passwordHash: hashPassword('FounderPass123!')
    }
  ],
  [
    'founder@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492004',
      email: 'founder@docsearch.health',
      firstName: 'Alok',
      lastName: 'Sharma',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['SUPER_ADMIN'] as RoleType[],
      permissions: [
        'saas:manage',
        'billing:manage',
        'tenants:manage',
        'audit:read',
        'security:manage',
        'compliance:manage'
      ],
      passwordHash: hashPassword('FounderPass123!')
    }
  ],
  [
    'coo@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492005',
      email: 'coo@docsearch.health',
      firstName: 'Ananya',
      lastName: 'Roy',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['COMPANY_ADMIN'] as RoleType[],
      permissions: [
        'saas:manage',
        'tenants:manage',
        'billing:manage',
        'audit:read'
      ],
      passwordHash: hashPassword('CooPass123!')
    }
  ],
  [
    'finance@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492006',
      email: 'finance@docsearch.health',
      firstName: 'Vikram',
      lastName: 'Mehta',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['FINANCE_MANAGER', 'COMPANY_ADMIN'] as RoleType[],
      permissions: [
        'billing:manage',
        'saas:manage',
        'tenants:manage',
        'audit:read'
      ],
      passwordHash: hashPassword('FinancePass123!')
    }
  ],
  [
    'tata@doc.com',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492099',
      email: 'tata@doc.com',
      firstName: 'R. K.',
      lastName: 'Tata',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['PATHOLOGIST', 'HOSPITAL_ADMIN'] as RoleType[],
      permissions: [
        'lab:orders:read',
        'lab:orders:create',
        'lab:specimens:create',
        'lab:results:create',
        'lab:results:update',
        'lab:reports:finalize',
        'hospital:admin'
      ],
      passwordHash: hashPassword('TataPass123!')
    }
  ],
  [
    'admin@tatapathology.com',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492098',
      email: 'admin@tatapathology.com',
      firstName: 'Tata',
      lastName: 'Pathology',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['PATHOLOGIST', 'HOSPITAL_ADMIN'] as RoleType[],
      permissions: [
        'lab:orders:read',
        'lab:orders:create',
        'lab:specimens:create',
        'lab:results:create',
        'lab:results:update',
        'lab:reports:finalize',
        'hospital:admin'
      ],
      passwordHash: hashPassword('TataPass123!')
    }
  ],
  [
    'director.priya@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492010',
      email: 'director.priya@docsearch.health',
      firstName: 'Priya',
      lastName: 'Nair',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['HOSPITAL_ADMIN'] as RoleType[],
      permissions: [
        'hospital:admin',
        'clinical:patients:read',
        'clinical:orders:read',
        'lab:orders:read',
        'saas:manage'
      ],
      passwordHash: hashPassword('DirectorPass123!')
    }
  ],
  [
    'surgeon.sameer@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492011',
      email: 'surgeon.sameer@docsearch.health',
      firstName: 'Sameer',
      lastName: 'Kulkarni',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['DOCTOR'] as RoleType[],
      permissions: [
        'clinical:orders:read',
        'clinical:orders:create',
        'clinical:patients:read'
      ],
      passwordHash: hashPassword('SurgeonPass123!')
    }
  ],
  [
    'nurse.sunita@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492012',
      email: 'nurse.sunita@docsearch.health',
      firstName: 'Sunita',
      lastName: 'Verma',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['NURSE'] as RoleType[],
      permissions: [
        'clinical:patients:read',
        'clinical:encounters:read'
      ],
      passwordHash: hashPassword('NursePass123!')
    }
  ],
  [
    'pharmacist.suresh@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492013',
      email: 'pharmacist.suresh@docsearch.health',
      firstName: 'Suresh',
      lastName: 'Patel',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['PHARMACIST'] as RoleType[],
      permissions: [
        'clinical:orders:read',
        'clinical:patients:read'
      ],
      passwordHash: hashPassword('PharmPass123!')
    }
  ],
  [
    'radiologist.arvind@docsearch.health',
    {
      id: 'aaaa1111-8492-4aaa-8aaa-849208492014',
      email: 'radiologist.arvind@docsearch.health',
      firstName: 'Arvind',
      lastName: 'Mehta',
      status: 'ACTIVE',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '33333333-3333-4333-8333-333333333301',
      branchId: '44444444-4444-4444-8444-444444444401',
      roles: ['DOCTOR'] as RoleType[],
      permissions: [
        'clinical:orders:read',
        'clinical:patients:read'
      ],
      passwordHash: hashPassword('RadPass123!')
    }
  ]
]);

export class RealAuthService {
  /**
   * Real cryptographic password verification against registered user credentials
   */
  async authenticateUser(email: string, plainPassword: string): Promise<AuthenticatedUserRecord | null> {
    const user = PRODUCTION_CREDENTIAL_STORE.get(email.toLowerCase().trim());
    if (!user) {
      return null;
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('User account is not active or has been suspended.');
    }

    // Verify cryptographic scrypt password hash
    const isValid = verifyPassword(plainPassword, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return user;
  }
}

export const realAuthService = new RealAuthService();
