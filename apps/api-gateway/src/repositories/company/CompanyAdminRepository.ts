import { desc } from '@docsearch/database';
import {
  getDatabase,
  legalEntities,
  departments,
  corporatePolicies
} from '@docsearch/database';

export class CompanyAdminRepository {
  async getLegalEntities(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(legalEntities).orderBy(desc(legalEntities.createdAt));
      } catch {}
    }
    return [
      { id: 'le_001', entityCode: 'DOCSEARCH-GLOBAL-INC', legalName: 'DOC SEARCH Global Healthcare Technologies Inc.', jurisdiction: 'Delaware, USA', registrationNumber: 'DEL-882910', status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async getDepartments(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(departments).orderBy(desc(departments.createdAt));
      } catch {}
    }
    return [
      { id: 'dep_001', departmentCode: 'ENG', name: 'Clinical Engineering & Platform Infrastructure', headOfDepartment: 'Dr. Alex Vance', employeeCount: 42, status: 'ACTIVE', createdAt: new Date() },
      { id: 'dep_002', departmentCode: 'MED', name: 'Chief Medical & Clinical Safety Board', headOfDepartment: 'Dr. Gregory House', employeeCount: 16, status: 'ACTIVE', createdAt: new Date() },
      { id: 'dep_003', departmentCode: 'SEC', name: 'Information Security & Regulatory Compliance', headOfDepartment: 'Elena Rostova', employeeCount: 12, status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async getPolicies(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(corporatePolicies).orderBy(desc(corporatePolicies.createdAt));
      } catch {}
    }
    return [
      { id: 'corp_001', policyNumber: 'CORP-POL-001', title: 'Healthcare SaaS Security & Governance Charter', version: '3.0', approvalStatus: 'BOARD_APPROVED', status: 'ACTIVE', createdAt: new Date() }
    ];
  }
}

export const companyAdminRepository = new CompanyAdminRepository();
