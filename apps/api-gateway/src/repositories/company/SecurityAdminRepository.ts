import { desc } from '@docsearch/database';
import {
  getDatabase,
  securityRoles,
  securityPermissions,
  securityPolicies
} from '@docsearch/database';

export class SecurityAdminRepository {
  async getRoles(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(securityRoles).orderBy(desc(securityRoles.createdAt));
      } catch {}
    }
    return [
      { id: 'role_001', code: 'SUPER_ADMIN', name: 'Global Platform Administrator', roleType: 'SYSTEM', isCustom: false, isProtected: true, status: 'ACTIVE', createdAt: new Date() },
      { id: 'role_002', code: 'HOSPITAL_ADMIN', name: 'Hospital Facility Administrator', roleType: 'PARTNER', isCustom: false, isProtected: false, status: 'ACTIVE', createdAt: new Date() },
      { id: 'role_003', code: 'RADIOLOGIST', name: 'Clinical Radiologist', roleType: 'CLINICAL', isCustom: false, isProtected: false, status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async getPermissions(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(securityPermissions).orderBy(desc(securityPermissions.createdAt));
      } catch {}
    }
    return [
      { id: 'perm_001', code: 'clinical:radiology:view', name: 'View Radiology Orders and Reports', category: 'CLINICAL', action: 'read', status: 'ACTIVE', createdAt: new Date() },
      { id: 'perm_002', code: 'clinical:radiology:order', name: 'Order Radiology Studies', category: 'CLINICAL', action: 'create', status: 'ACTIVE', createdAt: new Date() },
      { id: 'perm_003', code: 'partners:manage', name: 'Manage Hospital Partner Accounts', category: 'CRM', action: 'manage', status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async getPolicies(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(securityPolicies).orderBy(desc(securityPolicies.createdAt));
      } catch {}
    }
    return [
      { id: 'pol_001', code: 'SEC-POL-MFA', name: 'Mandatory Multi-Factor Authentication', category: 'AUTHENTICATION', status: 'ACTIVE', enforcementLevel: 'MANDATORY', createdAt: new Date() }
    ];
  }
}

export const securityAdminRepository = new SecurityAdminRepository();
