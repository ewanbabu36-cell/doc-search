import React, { useState } from 'react';
import type {
  OperationalStaffDto,
  OperationalDepartmentDto,
  CreateOperationalStaffRequest,
  UpdateOperationalStaffRequest,
  ChangeStaffStatusRequest,
  AssignStaffRoleRequest,
  AddStaffCredentialRequest,
  CreateStaffTransferRequest
} from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dropdown
} from '@docsearch/ui-kit';
import { CreateStaffDialog } from '../dialogs/CreateStaffDialog.js';
import { EditStaffDialog } from '../dialogs/EditStaffDialog.js';
import { ChangeStaffStatusDialog } from '../dialogs/ChangeStaffStatusDialog.js';
import { AssignRoleDialog } from '../dialogs/AssignRoleDialog.js';
import { AddCredentialDialog } from '../dialogs/AddCredentialDialog.js';
import { TransferStaffDialog } from '../dialogs/TransferStaffDialog.js';
import { ManagePermissionsDialog } from '../dialogs/ManagePermissionsDialog.js';
import { RevokeStaffDialog } from '../dialogs/RevokeStaffDialog.js';
import { DeleteStaffDialog } from '../dialogs/DeleteStaffDialog.js';
import {
  type PartnerCategory,
  type StaffPermissions,
  PARTNER_CATEGORIES,
  getPartnerCategoryForWorkspace,
  getDefaultPermissionsForRole
} from '../../types/partner-staff-rbac.js';
import { isDestructiveActionAllowed } from '../../utils/partnerRolePermissions.js';

const maskPhone = (phone?: string) => {
  if (!phone) return '';
  const clean = phone.trim();
  if (clean.length <= 5) return '*****';
  return clean.slice(0, 5) + ' *****';
};

export interface StaffDirectoryViewProps {
  staffList: OperationalStaffDto[];
  departments: OperationalDepartmentDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  organizations: { id: string; organizationName: string }[];
  facilities: { id: string; facilityName: string; organizationId: string }[];
  workspace?: string | undefined;
  partnerType?: string | undefined;
  onSelectStaff: (staffId: string) => void;
  onCreateStaff: (req: CreateOperationalStaffRequest) => Promise<void>;
  onUpdateStaff: (req: UpdateOperationalStaffRequest) => Promise<void>;
  onChangeStatus: (req: ChangeStaffStatusRequest) => Promise<void>;
  onAssignRole: (req: AssignStaffRoleRequest) => Promise<void>;
  onAddCredential: (req: AddStaffCredentialRequest) => Promise<void>;
  onTransferStaff: (req: CreateStaffTransferRequest) => Promise<void>;
  onDeleteStaff?: (staffId: string, reason: string) => Promise<void>;
  onRevokeStaff?: (staffId: string, reason: string) => Promise<void>;
  onRestoreStaff?: (staffId: string) => Promise<void>;
  onUpdatePermissions?: (staffId: string, perms: Partial<StaffPermissions>) => Promise<void>;
}

export const StaffDirectoryView: React.FC<StaffDirectoryViewProps> = ({
  staffList,
  departments,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  organizations,
  facilities,
  workspace,
  partnerType,
  onSelectStaff,
  onCreateStaff,
  onUpdateStaff,
  onChangeStatus,
  onAssignRole,
  onAddCredential,
  onTransferStaff,
  onDeleteStaff,
  onRevokeStaff,
  onRestoreStaff,
  onUpdatePermissions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const dedicatedCategory: PartnerCategory | null = getPartnerCategoryForWorkspace(workspace, partnerType);
  const isEnterpriseMode = !dedicatedCategory;
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | PartnerCategory>(
    dedicatedCategory || 'ALL'
  );

  React.useEffect(() => {
    if (dedicatedCategory) {
      setCategoryFilter(dedicatedCategory);
    }
  }, [dedicatedCategory]);

  const isSuperOrAdmin =
    isDestructiveActionAllowed(actorRole) ||
    (workspace === 'CLINIC' && (actorRole?.toUpperCase().includes('DOCTOR') || actorRole?.toUpperCase().includes('OWNER')));

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<OperationalStaffDto | null>(null);
  const [statusStaff, setStatusStaff] = useState<OperationalStaffDto | null>(null);
  const [roleStaff, setRoleStaff] = useState<OperationalStaffDto | null>(null);
  const [credentialStaff, setCredentialStaff] = useState<OperationalStaffDto | null>(null);
  const [transferStaff, setTransferStaff] = useState<OperationalStaffDto | null>(null);
  const [permissionsStaff, setPermissionsStaff] = useState<OperationalStaffDto | null>(null);
  const [revokeStaff, setRevokeStaff] = useState<OperationalStaffDto | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<OperationalStaffDto | null>(null);

  const handleRestoreAccess = async (staff: OperationalStaffDto) => {
    if (onRestoreStaff) {
      await onRestoreStaff(staff.id);
    }
  };

  const handleLoginAsStaff = (staff: OperationalStaffDto) => {
    const staffCategory: PartnerCategory =
      (staff as any).partnerCategory || staff.metadata?.['partnerCategory'] || 'INDEPENDENT_CLINIC';
    const roleName = staff.primaryRole || staff.staffType || 'RECEPTIONIST';
    const perms: StaffPermissions =
      (staff as any).permissions || staff.metadata?.['permissions'] || getDefaultPermissionsForRole(staffCategory, roleName);

    let orgType: 'HOSPITAL' | 'CLINIC' | 'PHARMACY' | 'PATHOLOGY' | 'DIAGNOSTIC_CENTRE' = 'CLINIC';
    if (staffCategory === 'PHARMACY' || staff.staffType === 'PHARMACIST') orgType = 'PHARMACY';
    else if (staffCategory === 'PATHOLOGY' || staff.staffType === 'LAB_TECHNICIAN') orgType = 'PATHOLOGY';
    else if (staffCategory === 'DIAGNOSTIC_CENTRE') orgType = 'DIAGNOSTIC_CENTRE';
    else if (staffCategory === 'MULTI_SPECIALITY_HOSPITAL') orgType = 'HOSPITAL';

    let defaultModule = 'patient-registration';
    if (perms?.accessibleModules && perms.accessibleModules.length > 0) {
      defaultModule = perms.accessibleModules[0] || 'patient-registration';
    } else if (orgType === 'PHARMACY') {
      defaultModule = 'pharmacy-medication';
    } else if (orgType === 'PATHOLOGY') {
      defaultModule = 'clinical-investigation';
    } else if (orgType === 'DIAGNOSTIC_CENTRE') {
      defaultModule = 'radiology-imaging';
    } else if (staff.staffType === 'DOCTOR') {
      defaultModule = 'clinical-consultation';
    } else if (staff.staffType === 'NURSE') {
      defaultModule = 'nurse-triage-station';
    } else if (staff.staffType === 'BILLING_OFFICER') {
      defaultModule = 'hospital-billing';
    } else if (staff.staffType === 'RECEPTIONIST') {
      defaultModule = 'patient-registration';
    }

    const staffUser = {
      id: staff.id,
      category: 'HEALTHCARE' as const,
      name: staff.fullName,
      email: staff.workEmail,
      role: roleName,
      roleTitle: `${staff.fullName} (${roleName.replace(/_/g, ' ')})`,
      department: staff.departmentName || 'Front Desk & Patient Registration',
      tenantName: (staff as any).tenantName || (staff as any).organizationName || 'Healthcare Facility',
      organizationType: orgType,
      allowedWorkspaces: [orgType],
      defaultModule,
      planTier: 'Staff Operations Suite',
      accessibleFeatures: [
        'Patient Intake & Demographics',
        'OPD Token & Queue Dispatch',
        'Doctor OPD Schedule View',
        'Front Desk Registration',
        'ABHA Address Verification'
      ],
      restrictedFeatures: ['Hospital Director Executive Console'],
      permissions: perms
    };

    localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(staffUser));
    localStorage.removeItem('docsearch_logged_out');

    try {
      fetch('/api/v1/auth/quick-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: staffUser.email || staff.workEmail,
          role: staffUser.role,
          tenantId: (staff as any).tenantId || '11111111-1111-4111-8111-111111111111',
          name: staffUser.name
        })
      })
        .then((r) => r.json())
        .then((j) => {
          if (j?.data?.accessToken) {
            localStorage.setItem('docsearch_auth_token', j.data.accessToken);
          }
        })
        .catch(() => {});
    } catch {}

    window.dispatchEvent(new CustomEvent('docsearch:switch-staff-user', { detail: staffUser }));
  };

  const deduplicatedStaffList = React.useMemo(() => {
    const seen = new Set<string>();
    return staffList.filter((s) => {
      const codeKey = (s.staffCode || '').trim().toUpperCase();
      const emailKey = (s.workEmail || '').trim().toLowerCase();
      const idKey = (s.id || '').trim();
      const primaryKey = codeKey || emailKey || idKey;
      if (!primaryKey) return true;
      if (seen.has(primaryKey) || (codeKey && seen.has(codeKey)) || (emailKey && seen.has(emailKey))) {
        return false;
      }
      if (codeKey) seen.add(codeKey);
      if (emailKey) seen.add(emailKey);
      if (idKey) seen.add(idKey);
      return true;
    });
  }, [staffList]);

  const filteredStaff = deduplicatedStaffList.filter((s) => {
    const staffCat: PartnerCategory =
      (s as any).partnerCategory || s.metadata?.['partnerCategory'] || 'INDEPENDENT_CLINIC';

    // Strict partner isolation: Pharmacy only sees Pharmacy staff, Clinic only Clinic staff, etc.
    if (dedicatedCategory) {
      if (staffCat !== dedicatedCategory) return false;
    } else if (categoryFilter !== 'ALL') {
      if (staffCat !== categoryFilter) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match =
        s.fullName.toLowerCase().includes(term) ||
        s.staffCode.toLowerCase().includes(term) ||
        s.workEmail.toLowerCase().includes(term);
      if (!match) return false;
    }
    if (typeFilter !== 'ALL' && s.staffType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && s.employmentStatus !== statusFilter) return false;
    if (deptFilter !== 'ALL' && s.departmentId !== deptFilter) return false;
    return true;
  });

  const getHeaderInfo = () => {
    switch (workspace) {
      case 'PHARMACY':
        return {
          title: '💊 Pharmacy Team & Dispensing Staff Directory',
          subtitle: 'Licensed pharmacists, assistant dispensers, cashiers, and inventory storekeepers',
          buttonLabel: '➕ Add Chemist / Cashier'
        };
      case 'PATHOLOGY':
        return {
          title: '🧪 Pathology Diagnostic Team & Phlebotomists',
          subtitle: 'Authorized signatory pathologists, senior lab technicians, phlebotomists, and dispatch staff',
          buttonLabel: '➕ Add Laboratory Staff'
        };
      case 'CLINIC':
        return {
          title: '🩺 Clinic Care Team & Medical Staff Directory',
          subtitle: 'Consulting physicians, visiting specialists, clinic nurses, compounders, and frontdesk tokens',
          buttonLabel: '➕ Add Clinic Staff Member'
        };
      case 'DIAGNOSTIC_CENTRE':
        return {
          title: '🔬 Radiology & Diagnostic Centre Team',
          subtitle: 'Consultant radiologists, CT/MRI radiographers, and modality scheduling coordinators',
          buttonLabel: '➕ Add Diagnostic Specialist'
        };
      default:
        return {
          title: '🏥 Operational Healthcare Staff Directory',
          subtitle: 'Credentialed doctors, clinical nurses, receptionists, lab technicians, pharmacists, and billing personnel',
          buttonLabel: '🩺 Onboard New Staff Member'
        };
    }
  };

  const getClassificationOptions = () => {
    const cat = dedicatedCategory || (categoryFilter !== 'ALL' ? categoryFilter : null);
    if (cat === 'PHARMACY') {
      return [
        { value: 'ALL', label: 'All Chemist Roles' },
        { value: 'PHARMACIST', label: 'Registered Pharmacists (Licensee)' },
        { value: 'BILLING_OFFICER', label: 'Billing Cashiers' },
        { value: 'OPERATIONAL_SUPPORT', label: 'Storekeepers & Inventory' }
      ];
    }
    if (cat === 'PATHOLOGY') {
      return [
        { value: 'ALL', label: 'All Diagnostic Roles' },
        { value: 'DOCTOR', label: 'Pathologists / Signatories' },
        { value: 'LAB_TECHNICIAN', label: 'Lab Technicians' },
        { value: 'OPERATIONAL_SUPPORT', label: 'Phlebotomists' },
        { value: 'RECEPTIONIST', label: 'Lab Reception & Dispatch' }
      ];
    }
    if (cat === 'INDEPENDENT_CLINIC') {
      return [
        { value: 'ALL', label: 'All Clinic Roles' },
        { value: 'DOCTOR', label: 'Consulting Doctors' },
        { value: 'NURSE', label: 'Clinic Nurses / Compounders' },
        { value: 'RECEPTIONIST', label: 'Reception & Appointments' },
        { value: 'BILLING_OFFICER', label: 'Cashiers & Accounts' }
      ];
    }
    if (cat === 'MULTI_SPECIALITY_HOSPITAL') {
      return [
        { value: 'ALL', label: 'All Hospital Roles' },
        { value: 'DOCTOR', label: 'Attending Doctors & Surgeons' },
        { value: 'NURSE', label: 'Inpatient Ward Nurses' },
        { value: 'OPERATIONAL_SUPPORT', label: 'OT Technicians' },
        { value: 'ADMINISTRATIVE', label: 'TPA & Corporate Desk' },
        { value: 'BILLING_OFFICER', label: 'Hospital Central Billing' }
      ];
    }
    if (cat === 'DIAGNOSTIC_CENTRE') {
      return [
        { value: 'ALL', label: 'All Radiology Roles' },
        { value: 'DOCTOR', label: 'Radiologists (MD / DNB)' },
        { value: 'LAB_TECHNICIAN', label: 'CT / MRI / X-Ray Radiographers' },
        { value: 'OPERATIONAL_SUPPORT', label: 'Modality Coordinators' },
        { value: 'RECEPTIONIST', label: 'Imaging Reception & PACS Tokens' }
      ];
    }
    return [
      { value: 'ALL', label: 'All Classifications' },
      { value: 'DOCTOR', label: 'Doctors / Physicians' },
      { value: 'NURSE', label: 'Nurses' },
      { value: 'RECEPTIONIST', label: 'Receptionists' },
      { value: 'LAB_TECHNICIAN', label: 'Lab Technicians' },
      { value: 'PHARMACIST', label: 'Pharmacists' },
      { value: 'BILLING_OFFICER', label: 'Billing Officers' },
      { value: 'ADMINISTRATIVE', label: 'Administrative Staff' }
    ];
  };

  const headerInfo = getHeaderInfo();
  const [exportWarning, setExportWarning] = useState<string | null>(null);

  const handleExportCSV = () => {
    let currentUserPerms: StaffPermissions | null = null;
    try {
      const storedAuth = localStorage.getItem('docsearch_partner_staff_auth');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        currentUserPerms = parsed.permissions || null;
      }
    } catch {}

    // Tier 1 Data-Theft Protection: block export if permission is explicitly false
    if (currentUserPerms && currentUserPerms.canExportPatientData === false) {
      setExportWarning('⛔ Export Blocked by Tier 1 Data-Theft Protection: Your staff role is restricted from exporting personnel or patient records.');
      setTimeout(() => setExportWarning(null), 6000);
      return;
    }

    const headers = ['Staff Code', 'Full Name', 'Category', 'Role', 'Department', 'Email', 'Phone', 'Status', 'Data Export Allowed', 'Max Discount', 'Lab Signatory'];
    const rows = filteredStaff.map((s) => {
      const p: StaffPermissions = (s as any).permissions || s.metadata?.['permissions'] || {};
      const cat: PartnerCategory = (s as any).partnerCategory || s.metadata?.['partnerCategory'] || 'INDEPENDENT_CLINIC';
      const phoneVal = (currentUserPerms?.canViewFullPhoneNumber !== false) ? (s.workPhone || '') : maskPhone(s.workPhone);
      return [
        `"${s.staffCode}"`,
        `"${s.fullName}"`,
        `"${cat}"`,
        `"${s.primaryRole}"`,
        `"${s.departmentName || ''}"`,
        `"${s.workEmail}"`,
        `"${phoneVal}"`,
        `"${s.employmentStatus}"`,
        `"${p.canExportPatientData ? 'YES' : 'NO'}"`,
        `"${p.canGiveDiscounts ? p.maxDiscountPercent + '%' : '0%'}"`,
        `"${p.canSignLabReports ? 'YES' : 'NO'}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staff_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {exportWarning && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{exportWarning}</span>
          <button type="button" onClick={() => setExportWarning(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {headerInfo.title}
            </h2>
            {dedicatedCategory && (
              <Badge variant="primary">
                {PARTNER_CATEGORIES[dedicatedCategory].icon} {PARTNER_CATEGORIES[dedicatedCategory].shortLabel} Profile
              </Badge>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            {headerInfo.subtitle}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isSuperOrAdmin && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              📥 Export CSV
            </Button>
          )}
          {isSuperOrAdmin && (
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              {headerInfo.buttonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* 5-Partner Category Switcher / Filter Tabs - ONLY visible in Multi-Facility Enterprise Command Mode */}
      {isEnterpriseMode && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            borderBottom: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))'
          }}
        >
          {[
            { id: 'ALL' as const, label: 'All Partners (5 Categories)', icon: '🌐', count: deduplicatedStaffList.length },
            { id: 'INDEPENDENT_CLINIC' as const, label: 'Clinics', icon: '🩺', count: deduplicatedStaffList.filter((s) => ((s as any).partnerCategory || s.metadata?.['partnerCategory']) === 'INDEPENDENT_CLINIC').length },
            { id: 'PHARMACY' as const, label: 'Pharmacies', icon: '💊', count: deduplicatedStaffList.filter((s) => ((s as any).partnerCategory || s.metadata?.['partnerCategory']) === 'PHARMACY').length },
            { id: 'PATHOLOGY' as const, label: 'Pathology Labs', icon: '🔬', count: deduplicatedStaffList.filter((s) => ((s as any).partnerCategory || s.metadata?.['partnerCategory']) === 'PATHOLOGY').length },
            { id: 'MULTI_SPECIALITY_HOSPITAL' as const, label: 'Hospitals', icon: '🏥', count: deduplicatedStaffList.filter((s) => ((s as any).partnerCategory || s.metadata?.['partnerCategory']) === 'MULTI_SPECIALITY_HOSPITAL').length },
            { id: 'DIAGNOSTIC_CENTRE' as const, label: 'Radiology & Imaging', icon: '☢️', count: deduplicatedStaffList.filter((s) => ((s as any).partnerCategory || s.metadata?.['partnerCategory']) === 'DIAGNOSTIC_CENTRE').length }
          ].map((tab) => {
            const isSelected = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isSelected
                    ? '1.5px solid var(--ds-color-primary, #0284c7)'
                    : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
                  backgroundColor: isSelected
                    ? 'var(--ds-color-surface-selected, rgba(2, 132, 199, 0.15))'
                    : 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.04))',
                  color: isSelected
                    ? 'var(--ds-color-primary, #38bdf8)'
                    : 'var(--ds-color-text-secondary, #94a3b8)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 12px rgba(2, 132, 199, 0.2)' : 'none'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    backgroundColor: isSelected
                      ? 'var(--ds-color-primary, #0284c7)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected
                      ? 'var(--ds-color-text-inverse, #ffffff)'
                      : 'var(--ds-color-text-muted, #94a3b8)'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Search Personnel
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, code, or email..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Staff Classification
            </label>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={getClassificationOptions()}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Department
            </label>
            <Select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Departments' },
                ...departments.map((d) => ({
                  value: d.id,
                  label: d.departmentName
                }))
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Lifecycle Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'ON_LEAVE', label: 'On Leave' },
                { value: 'SUSPENDED', label: 'Suspended' },
                { value: 'TERMINATED', label: 'Terminated' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Staff Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Full Name & Contact</TableHead>
                <TableHead>Category & Type</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Primary Role & RBAC Security</TableHead>
                <TableHead>Credential</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Operational Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero staff members found matching filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((s) => {
                  const staffCategory: PartnerCategory =
                    (s as any).partnerCategory || s.metadata?.['partnerCategory'] || 'INDEPENDENT_CLINIC';
                  const categoryInfo = PARTNER_CATEGORIES[staffCategory] || PARTNER_CATEGORIES.INDEPENDENT_CLINIC;
                  const isRevoked = Boolean((s as any).isAccessRevoked || s.employmentStatus === 'SUSPENDED');
                  const perms = (s as any).permissions || s.metadata?.['permissions'];

                  return (
                    <TableRow key={s.id} style={{ backgroundColor: isRevoked ? 'rgba(239, 68, 68, 0.12)' : undefined }}>
                      <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                        {s.staffCode}
                      </TableCell>
                      <TableCell>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.fullName}</strong>
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                          {s.workEmail}
                        </span>
                        {s.workPhone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                            <span>📞</span>
                            <span>{perms?.canViewFullPhoneNumber ? s.workPhone : maskPhone(s.workPhone)}</span>
                            {!perms?.canViewFullPhoneNumber && (
                              <span style={{ fontSize: '0.6rem', color: '#f87171', padding: '1px 4px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.1)' }}>
                                Masked
                              </span>
                            )}
                          </span>
                        )}
                        {isRevoked ? (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', fontSize: '0.6875rem', color: '#f87171', fontWeight: 700 }}>
                              ⛔ ACCESS REVOKED
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '2px 8px', backgroundColor: 'rgba(13, 148, 136, 0.12)', border: '1px solid rgba(13, 148, 136, 0.3)', borderRadius: '4px', fontSize: '0.6875rem' }}>
                            <span style={{ color: '#2dd4bf', fontWeight: 700 }}>🔑 Login:</span>
                            <span style={{ color: '#5eead4', fontWeight: 600 }}>{s.staffCode}</span>
                            <span style={{ color: 'var(--ds-color-text-muted)' }}>| PIN: {String(s.metadata?.['password'] || '123456')}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <Badge variant="primary">
                            {categoryInfo.icon} {categoryInfo.shortLabel}
                          </Badge>
                          <Badge variant="neutral">{s.staffType}</Badge>
                        </div>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.8125rem' }}>
                        {s.departmentName ?? 'Department'}
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>{s.primaryRole}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {/* Tier 1 Badges */}
                          {perms?.canExportPatientData ? (
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.35)' }} title="Tier 1: Patient Data Export Allowed">
                              ⚠️ Export Allowed
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }} title="Tier 1: Patient Data Export Blocked">
                              🛡️ Export Blocked
                            </span>
                          )}

                          {/* Tier 2 Badges */}
                          {perms?.canGiveDiscounts && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.35)' }} title={`Tier 2: Max Discount ${perms.maxDiscountPercent}%`}>
                              💰 Disc: {perms.maxDiscountPercent}%
                            </span>
                          )}
                          {perms?.canCancelOrRefundBills && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.35)' }} title="Tier 2: Bill Cancellation and Refunds Permitted">
                              🔄 Refund Auth
                            </span>
                          )}

                          {/* Tier 3 Badges */}
                          {perms?.canSignLabReports && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.35)' }} title="Tier 3: NABL/AERB Diagnostic Signatory Authority">
                              ✍️ Lab/Rad e-Sign
                            </span>
                          )}
                          {perms?.canSignPrescriptions && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.35)' }} title="Tier 3: Doctor Clinical Prescription Signatory">
                              🩺 Rx Sign
                            </span>
                          )}
                          {perms?.canDispenseRestrictedDrugs && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.35)' }} title="Tier 3: Schedule H & Narcotics Dispensing Authority">
                              💊 Narcotic Disp
                            </span>
                          )}
                          {perms?.canAccessAfterHours && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)' }} title="Tier 3: 24/7 Emergency Remote & After-Hours Access">
                              🚨 24/7 Access
                            </span>
                          )}

                          {/* Tier 4 Badges */}
                          {perms?.accessibleModules && perms.accessibleModules.length > 0 && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }} title={`Tier 4: ${perms.accessibleModules.length} Modules Accessible`}>
                              🖥️ {perms.accessibleModules.length} Mod
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.credentialStatus === 'VERIFIED' ? 'success' : s.credentialStatus === 'PENDING' ? 'warning' : 'danger'}>
                          {s.credentialStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isRevoked ? 'danger' : s.employmentStatus === 'ACTIVE' ? 'success' : s.employmentStatus === 'ON_LEAVE' ? 'primary' : 'warning'}>
                          {isRevoked ? 'SUSPENDED' : s.employmentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dropdown
                          align="right"
                          trigger={
                            <Button variant="outline" size="sm" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              ⋮ Actions
                            </Button>
                          }
                          items={
                            isSuperOrAdmin
                              ? [
                                  { id: 'profile', label: 'View Staff Profile', icon: '👤', onClick: () => onSelectStaff(s.id) },
                                  { id: 'permissions', label: '🛡️ Manage Permissions & Features (RBAC)', icon: '🛡️', onClick: () => setPermissionsStaff(s) },
                                  { id: 'edit', label: 'Edit Profile & Details', icon: '✏️', onClick: () => setEditStaff(s) },
                                  'divider',
                                  isRevoked
                                    ? { id: 'restore', label: '🔄 Restore Facility Access', icon: '🔄', onClick: () => handleRestoreAccess(s) }
                                    : { id: 'revoke', label: '⚡ Revoke Access (Instant Kill Switch)', icon: '⚡', onClick: () => setRevokeStaff(s) },
                                  'divider',
                                  { id: 'status', label: 'Change Employment Status', icon: '🔄', onClick: () => setStatusStaff(s) },
                                  { id: 'role', label: 'Assign Primary & Scoped Role', icon: '🛡️', onClick: () => setRoleStaff(s) },
                                  { id: 'credential', label: 'Manage Professional License', icon: '📜', onClick: () => setCredentialStaff(s) },
                                  { id: 'transfer', label: 'Transfer Facility / Branch', icon: '⇄', onClick: () => setTransferStaff(s) },
                                  'divider',
                                  { id: 'delete', label: '🗑️ Delete Staff Member', icon: '🗑️', onClick: () => setDeleteStaff(s) },
                                  'divider',
                                  { id: 'loginAs', label: `Switch Session to ${s.fullName}`, icon: '🔑', onClick: () => handleLoginAsStaff(s) }
                                ]
                              : [
                                  { id: 'profile', label: 'View Staff Profile', icon: '👤', onClick: () => onSelectStaff(s.id) }
                                ]
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog Modals */}
      {isCreateOpen && (
        <CreateStaffDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={tenantId}
          partnerId={partnerId}
          organizationId={organizationId}
          branchId={branchId}
          actorId={actorId}
          actorRole={actorRole}
          departments={departments}
          workspace={workspace}
          initialCategory={dedicatedCategory || (categoryFilter !== 'ALL' ? categoryFilter : undefined)}
          isEnterpriseMode={isEnterpriseMode}
          onCreateStaff={onCreateStaff}
        />
      )}

      {permissionsStaff && onUpdatePermissions && (
        <ManagePermissionsDialog
          isOpen={Boolean(permissionsStaff)}
          onClose={() => setPermissionsStaff(null)}
          staff={permissionsStaff}
          onUpdatePermissions={async (id, perms) => {
            await onUpdatePermissions(id, perms);
            setPermissionsStaff(null);
          }}
        />
      )}

      {revokeStaff && onRevokeStaff && (
        <RevokeStaffDialog
          isOpen={Boolean(revokeStaff)}
          onClose={() => setRevokeStaff(null)}
          staff={revokeStaff}
          onRevokeStaff={async (id, reason) => {
            await onRevokeStaff(id, reason);
            setRevokeStaff(null);
          }}
        />
      )}

      {deleteStaff && onDeleteStaff && (
        <DeleteStaffDialog
          isOpen={Boolean(deleteStaff)}
          onClose={() => setDeleteStaff(null)}
          staff={deleteStaff}
          onDeleteStaff={async (id, reason) => {
            await onDeleteStaff(id, reason);
            setDeleteStaff(null);
          }}
        />
      )}

      {editStaff && (
        <EditStaffDialog
          isOpen={Boolean(editStaff)}
          onClose={() => setEditStaff(null)}
          staff={editStaff}
          actorId={actorId}
          actorRole={actorRole}
          onUpdateStaff={onUpdateStaff}
        />
      )}

      {statusStaff && (
        <ChangeStaffStatusDialog
          isOpen={Boolean(statusStaff)}
          onClose={() => setStatusStaff(null)}
          staff={statusStaff}
          actorId={actorId}
          actorRole={actorRole}
          onChangeStatus={onChangeStatus}
        />
      )}

      {roleStaff && (
        <AssignRoleDialog
          isOpen={Boolean(roleStaff)}
          onClose={() => setRoleStaff(null)}
          staff={roleStaff}
          actorId={actorId}
          actorRole={actorRole}
          onAssignRole={onAssignRole}
        />
      )}

      {credentialStaff && (
        <AddCredentialDialog
          isOpen={Boolean(credentialStaff)}
          onClose={() => setCredentialStaff(null)}
          staff={credentialStaff}
          actorId={actorId}
          actorRole={actorRole}
          onAddCredential={onAddCredential}
        />
      )}

      {transferStaff && (
        <TransferStaffDialog
          isOpen={Boolean(transferStaff)}
          onClose={() => setTransferStaff(null)}
          staff={transferStaff}
          actorId={actorId}
          actorRole={actorRole}
          organizations={organizations}
          facilities={facilities}
          departments={departments}
          onTransferStaff={onTransferStaff}
        />
      )}
    </div>
  );
};
