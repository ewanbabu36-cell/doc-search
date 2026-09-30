import { companyAdminRepository } from '../../repositories/company/CompanyAdminRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';
import type {
  CreateInternalEmployeeRequest,
  CreateLegalEntityRequest,
  CreateDepartmentRequest,
  CreateDesignationRequest
} from '@docsearch/api-contracts';

export class CompanyAdminService {
  async getEmployees(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getEmployees(tx);
    });
  }

  async createEmployee(req: CreateInternalEmployeeRequest, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.createEmployee(req, tx);
    });
  }

  async updateEmployeeStatus(employeeId: string, status: string, reason: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.updateEmployeeStatus(employeeId, status, reason, tx);
    });
  }

  async deleteEmployee(employeeId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.deleteEmployee(employeeId, tx);
    });
  }

  async getLegalEntities(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getLegalEntities(tx);
    });
  }

  async createLegalEntity(req: CreateLegalEntityRequest, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.createLegalEntity(req, tx);
    });
  }

  async getDepartments(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getDepartments(tx);
    });
  }

  async createDepartment(req: CreateDepartmentRequest, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.createDepartment(req, tx);
    });
  }

  async getDesignations(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getDesignations(tx);
    });
  }

  async createDesignation(req: CreateDesignationRequest, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.createDesignation(req, tx);
    });
  }

  async getPolicies(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getPolicies(tx);
    });
  }

  async getComplianceOfficers(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getComplianceOfficers(tx);
    });
  }

  async getBoardMembers(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getBoardMembers(tx);
    });
  }

  async getGovernanceEvents(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getGovernanceEvents(tx);
    });
  }

  async getAuditTraces(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getAuditTraces(tx);
    });
  }
}

export const companyAdminService = new CompanyAdminService();
