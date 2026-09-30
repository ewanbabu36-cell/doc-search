import type {
  OperationalDepartmentDto,
  OperationalStaffDto,
  StaffRoleAssignmentDto,
  StaffCredentialDto,
  StaffTransferDto,
  OperationalStaffAuditTraceDto,
  StaffAdministrationOverviewDto
} from '@docsearch/api-contracts';

export const MOCK_OPERATIONAL_DEPARTMENTS: OperationalDepartmentDto[] = [];
export const MOCK_OPERATIONAL_STAFF: OperationalStaffDto[] = [];
export const MOCK_STAFF_ROLE_ASSIGNMENTS: StaffRoleAssignmentDto[] = [];
export const MOCK_STAFF_CREDENTIALS: StaffCredentialDto[] = [];
export const MOCK_STAFF_TRANSFERS: StaffTransferDto[] = [];
export const MOCK_OPERATIONAL_STAFF_AUDIT_TRACES: OperationalStaffAuditTraceDto[] = [];

export const MOCK_STAFF_ADMIN_OVERVIEW: StaffAdministrationOverviewDto = {
  totalStaffCount: 0,
  activeStaffCount: 0,
  onLeaveStaffCount: 0,
  suspendedStaffCount: 0,
  totalDepartmentsCount: 0,
  credentialExpiryAlertsCount: 0,
  pendingVerificationsCount: 0,
  totalTransfersCount: 0
};
