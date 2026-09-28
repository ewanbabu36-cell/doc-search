import React, { useState } from 'react';
import type {
  OperationalStaffType,
  OperationalEmploymentType,
  CreateOperationalStaffRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import {
  type PartnerCategory,
  PARTNER_CATEGORIES,
  getRolesForCategory,
  getDefaultPermissionsForRole,
  AVAILABLE_MODULES,
  type StaffPermissions
} from '../../types/partner-staff-rbac.js';

export interface CreateStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  departments: { id: string; departmentName: string }[];
  workspace?: string | undefined;
  initialCategory?: PartnerCategory | undefined;
  isEnterpriseMode?: boolean | undefined;
  onCreateStaff: (req: CreateOperationalStaffRequest) => Promise<void>;
}

export const CreateStaffDialog: React.FC<CreateStaffDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  departments,
  workspace,
  initialCategory,
  isEnterpriseMode = false,
  onCreateStaff
}) => {
  // Determine initial category strictly scoped to active facility profile
  const deduceInitialCategory = (): PartnerCategory => {
    if (initialCategory) return initialCategory;
    const wsp = (workspace || '').toUpperCase();
    if (wsp.includes('PHARMAC')) return 'PHARMACY';
    if (wsp.includes('RADIOLOG') || wsp.includes('IMAGING') || wsp.includes('DIAGNOSTIC_CENTRE')) return 'DIAGNOSTIC_CENTRE';
    if (wsp.includes('PATHOLOG') || wsp.includes('LAB') || wsp.includes('DIAGNOSTIC')) return 'PATHOLOGY';
    if (wsp.includes('CLINIC')) return 'INDEPENDENT_CLINIC';
    if (wsp.includes('HOSPITAL')) return 'MULTI_SPECIALITY_HOSPITAL';
    return 'INDEPENDENT_CLINIC';
  };

  const [partnerCategory, setPartnerCategory] = useState<PartnerCategory>(deduceInitialCategory());

  const getDialogTitle = () => {
    switch (partnerCategory) {
      case 'PHARMACY':
        return '💊 Onboard Pharmacy Staff (Chemist / Cashier / Storekeeper)';
      case 'PATHOLOGY':
        return '🔬 Onboard Laboratory & Diagnostic Staff (Pathologist / Lab Tech / Phlebotomist)';
      case 'INDEPENDENT_CLINIC':
        return '🩺 Onboard Clinic Medical Care Team (Doctor / Nurse / Front Desk)';
      case 'MULTI_SPECIALITY_HOSPITAL':
        return '🏥 Onboard Hospital Department Staff (Surgeon / RMO / Nurse / OT Tech)';
      case 'DIAGNOSTIC_CENTRE':
        return '☢️ Onboard Radiology & Imaging Staff (Radiologist / Radiographer / Modality Lead)';
      default:
        return 'Onboard Healthcare Staff & Configure RBAC';
    }
  };

  const getAlertInfo = () => {
    switch (partnerCategory) {
      case 'PHARMACY':
        return {
          title: '💊 Pharmacy Facility Staff Registry',
          desc: 'Provisions registered pharmacists, chemists, and storekeepers with state drug council license numbers, restricted narcotics authorizations, and counter discount caps.'
        };
      case 'PATHOLOGY':
        return {
          title: '🔬 Diagnostic Pathology Staff Registry',
          desc: 'Registers laboratory personnel with workstation assignments, NABL digital signature verification, and phlebotomy credentials.'
        };
      case 'INDEPENDENT_CLINIC':
        return {
          title: '🩺 Independent Clinic Medical Registry',
          desc: 'Onboards OPD consulting physicians, triage nurses, and front desk appointment coordinators with chamber fee and NMC registration.'
        };
      case 'MULTI_SPECIALITY_HOSPITAL':
        return {
          title: '🏥 Multi-Speciality Hospital Workforce Registry',
          desc: 'Configures hospital medical officers, inpatient nurses, OT technicians, and TPA pre-auth insurance desk leads.'
        };
      case 'DIAGNOSTIC_CENTRE':
        return {
          title: '☢️ Radiology & Diagnostic Imaging Staff Registry',
          desc: 'Registers consultant radiologists, AERB-certified radiographers, and modality coordinators with PACS DICOM and contrast consent authorizations.'
        };
      default:
        return {
          title: 'Partner-Category Staff Registry',
          desc: 'Registers and provisions operational staff with industry-standard role templates, anti-theft safeguards, and granular module permissions.'
        };
    }
  };

  // Category roles
  const categoryRoles = getRolesForCategory(partnerCategory);
  const defaultRolePreset = categoryRoles[0]?.key || 'CLINIC_FRONT_DESK';

  const [staffCode, setStaffCode] = useState(`STF-${Math.floor(100 + Math.random() * 900)}`);
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [rolePresetKey, setRolePresetKey] = useState(defaultRolePreset);
  const [employmentType, setEmploymentType] = useState<OperationalEmploymentType>('FULL_TIME');

  // 4-Tier RBAC Dynamic Permissions State
  const [canExportPatientData, setCanExportPatientData] = useState(false);
  const [canViewFullPhoneNumber, setCanViewFullPhoneNumber] = useState(false);
  const [canGiveDiscounts, setCanGiveDiscounts] = useState(false);
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(0);
  const [canCancelOrRefundBills, setCanCancelOrRefundBills] = useState(false);
  const [canSignLabReports, setCanSignLabReports] = useState(false);
  const [canSignPrescriptions, setCanSignPrescriptions] = useState(false);
  const [canDispenseRestrictedDrugs, setCanDispenseRestrictedDrugs] = useState(false);
  const [canAccessAfterHours, setCanAccessAfterHours] = useState(false);
  const [accessibleModules, setAccessibleModules] = useState<string[]>([]);

  const syncPermissionsFromRole = (cat: PartnerCategory, roleKey: string) => {
    const defaults = getDefaultPermissionsForRole(cat, roleKey);
    setCanExportPatientData(defaults.canExportPatientData);
    setCanViewFullPhoneNumber(defaults.canViewFullPhoneNumber);
    setCanGiveDiscounts(defaults.canGiveDiscounts);
    setMaxDiscountPercent(defaults.maxDiscountPercent);
    setCanCancelOrRefundBills(defaults.canCancelOrRefundBills);
    setCanSignLabReports(defaults.canSignLabReports);
    setCanSignPrescriptions(defaults.canSignPrescriptions);
    setCanDispenseRestrictedDrugs(defaults.canDispenseRestrictedDrugs);
    setCanAccessAfterHours(defaults.canAccessAfterHours);
    setAccessibleModules(defaults.accessibleModules || []);
  };

  const availableDepartments = departments.length > 0 ? departments : [
    {
      id: 'default-ops-dept',
      departmentName: PARTNER_CATEGORIES[partnerCategory]?.defaultDepartment || 'General Operations'
    }
  ];
  const [departmentId, setDepartmentId] = useState(availableDepartments[0]?.id ?? 'default-ops-dept');

  // Generic & Category-Specific Fields
  const [councilRegNumber, setCouncilRegNumber] = useState('');
  // Clinic
  const [specialization, setSpecialization] = useState('General Medicine');
  const [roomNumber, setRoomNumber] = useState('Chamber 01');
  const [consultationFee, setConsultationFee] = useState('500');
  // Pathology
  const [labWorkstation, setLabWorkstation] = useState('Biochemistry & Hematology');
  const [isNablSignatory, setIsNablSignatory] = useState(false);
  const [isPhlebotomyCertified, setIsPhlebotomyCertified] = useState(false);
  // Pharmacy
  const [pharmacyCouncilReg, setPharmacyCouncilReg] = useState('');
  const [isNarcoticsAuthorized, setIsNarcoticsAuthorized] = useState(false);
  const [maxDiscount, setMaxDiscount] = useState('10');
  // Hospital
  const [wardAssignment, setWardAssignment] = useState('General Ward & OPD');
  const [hprId, setHprId] = useState('');
  const [isOtAuthorized, setIsOtAuthorized] = useState(false);
  const [isTpaSignatory, setIsTpaSignatory] = useState(false);
  // Diagnostic Centre / Radiology
  const [modalityWorkstation, setModalityWorkstation] = useState('MRI 3T / 128-Slice CT / USG');
  const [aerbRegNumber, setAerbRegNumber] = useState('');
  const [isContrastCertified, setIsContrastCertified] = useState(false);
  const [isPacsDicomAdmin, setIsPacsDicomAdmin] = useState(false);

  const [reason, setReason] = useState('Onboarding new healthcare staff member');
  const [initialPassword, setInitialPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentialSummary, setCreatedCredentialSummary] = useState<{
    fullName: string;
    workEmail: string;
    staffCode: string;
    password: string;
    roleName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateRandomPin = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pin = 'Doc#';
    for (let i = 0; i < 4; i++) {
      pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInitialPassword(pin);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When partner category changes, sync default role
  const handleCategoryChange = (newCat: PartnerCategory) => {
    setPartnerCategory(newCat);
    const newRoles = getRolesForCategory(newCat);
    if (newRoles.length > 0 && newRoles[0]) {
      setRolePresetKey(newRoles[0].key);
      syncPermissionsFromRole(newCat, newRoles[0].key);
    }
  };

  const handleRoleChange = (newRoleKey: string) => {
    setRolePresetKey(newRoleKey);
    syncPermissionsFromRole(partnerCategory, newRoleKey);
  };

  React.useEffect(() => {
    if (isOpen) {
      const cat = deduceInitialCategory();
      setPartnerCategory(cat);
      const newRoles = getRolesForCategory(cat);
      if (newRoles.length > 0 && newRoles[0]) {
        setRolePresetKey(newRoles[0].key);
        syncPermissionsFromRole(cat, newRoles[0].key);
      }
      setCreatedCredentialSummary(null);
      setCopied(false);
      setError(null);
    }
  }, [isOpen, initialCategory, workspace]);

  const currentRoleDef = categoryRoles.find((r) => r.key === rolePresetKey) || categoryRoles[0];
  const staffType: OperationalStaffType = currentRoleDef?.staffType || 'RECEPTIONIST';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!fullName || fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!workEmail || !workEmail.includes('@')) {
      setError('Valid work email is required.');
      return;
    }
    if (!departmentId) {
      setError('Department selection is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const permissions: StaffPermissions = {
        canExportPatientData,
        canViewFullPhoneNumber,
        canGiveDiscounts,
        maxDiscountPercent: Number(maxDiscountPercent),
        canCancelOrRefundBills,
        requiresShiftHandoverSignoff: currentRoleDef?.defaultPermissions.requiresShiftHandoverSignoff ?? false,
        canSignLabReports: partnerCategory === 'PATHOLOGY' && isNablSignatory ? true : canSignLabReports,
        canSignPrescriptions,
        canDispenseRestrictedDrugs: partnerCategory === 'PHARMACY' && isNarcoticsAuthorized ? true : canDispenseRestrictedDrugs,
        canAccessAfterHours,
        isAccessRevoked: false,
        accessibleModules
      };

      const finalPassword = initialPassword.trim() || '123456';
      const metadata: Record<string, any> = {
        partnerCategory,
        rolePresetKey,
        permissions,
        password: finalPassword,
        mustChangePassword: true
      };

      if (partnerCategory === 'PATHOLOGY') {
        metadata['labWorkstation'] = labWorkstation;
        metadata['isNablSignatory'] = isNablSignatory;
        metadata['isPhlebotomyCertified'] = isPhlebotomyCertified;
        if (councilRegNumber) metadata['councilRegNumber'] = councilRegNumber;
      } else if (partnerCategory === 'PHARMACY') {
        metadata['pharmacyCouncilReg'] = pharmacyCouncilReg || councilRegNumber;
        metadata['isNarcoticsAuthorized'] = isNarcoticsAuthorized;
        metadata['maxDiscount'] = Number(maxDiscount);
      } else if (partnerCategory === 'INDEPENDENT_CLINIC') {
        if (specialization.trim()) metadata['specialization'] = specialization.trim();
        if (roomNumber.trim()) {
          metadata['roomNumber'] = roomNumber.trim();
          metadata['opdChamber'] = roomNumber.trim();
        }
        if (consultationFee.trim()) metadata['consultationFee'] = Number(consultationFee.trim());
        if (councilRegNumber.trim()) metadata['licenseNumber'] = councilRegNumber.trim();
      } else if (partnerCategory === 'MULTI_SPECIALITY_HOSPITAL') {
        metadata['wardAssignment'] = wardAssignment;
        metadata['hprId'] = hprId;
        metadata['isOtAuthorized'] = isOtAuthorized;
        metadata['isTpaSignatory'] = isTpaSignatory;
        if (councilRegNumber.trim()) metadata['licenseNumber'] = councilRegNumber.trim();
      } else if (partnerCategory === 'DIAGNOSTIC_CENTRE') {
        metadata['modalityWorkstation'] = modalityWorkstation;
        if (aerbRegNumber.trim()) metadata['aerbRegNumber'] = aerbRegNumber.trim();
        metadata['isContrastCertified'] = isContrastCertified;
        metadata['isPacsDicomAdmin'] = isPacsDicomAdmin;
        if (councilRegNumber.trim()) metadata['licenseNumber'] = councilRegNumber.trim();
      }

      await onCreateStaff({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        staffCode,
        fullName,
        workEmail,
        workPhone: workPhone || undefined,
        staffType,
        primaryRole: rolePresetKey,
        employmentType,
        joiningDate: new Date().toISOString(),
        metadata,
        reason
      });

      setCreatedCredentialSummary({
        fullName,
        workEmail,
        staffCode,
        password: finalPassword,
        roleName: currentRoleDef?.title || rolePresetKey
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to onboard staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        setCreatedCredentialSummary(null);
        onClose();
      }}
      title={createdCredentialSummary ? '🎉 Staff Access Handover' : getDialogTitle()}
      maxWidth="md"
      footer={
        createdCredentialSummary ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const credText = `DocSearch Partner Portal Login Credentials\nStaff Name: ${createdCredentialSummary.fullName}\nRole: ${createdCredentialSummary.roleName}\nWork Email: ${createdCredentialSummary.workEmail}\nStaff ID: ${createdCredentialSummary.staffCode}\nInitial Password: ${createdCredentialSummary.password}\nPortal URL: ${window.location.origin}/partner`;
                navigator.clipboard.writeText(credText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              {copied ? '✓ Credentials Copied!' : '📋 Copy Login Credentials'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCreatedCredentialSummary(null);
                onClose();
              }}
            >
              Done & View in Directory
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="button" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
              Onboard & Grant Access
            </Button>
          </div>
        )
      }
    >
      {createdCredentialSummary ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
          <Alert type="success" title="Access Granted & Credential Provisioned">
            New staff member <strong>{createdCredentialSummary.fullName}</strong> has been successfully onboarded and can immediately log in to the partner platform.
          </Alert>

          <div style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                  {createdCredentialSummary.fullName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-primary, #0ea5e9)', fontWeight: 600 }}>
                  {createdCredentialSummary.roleName}
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontWeight: 600 }}>
                ACTIVE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>Login Email</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.875rem' }}>{createdCredentialSummary.workEmail}</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>Staff ID / Code</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.875rem' }}>{createdCredentialSummary.staffCode}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px dashed rgba(14, 165, 233, 0.4)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>Initial Login Password / PIN</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '1px', color: '#38bdf8' }}>
                  {createdCredentialSummary.password}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                  (Can be changed on first login)
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)', lineHeight: 1.5 }}>
              💡 <strong>Handover Note:</strong> Share these credentials with the staff member. They can log in at the partner portal using either their <strong>Work Email</strong> or <strong>Staff ID</strong> with this password.
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
        <Alert type="info" title={getAlertInfo().title}>
          {getAlertInfo().desc}
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        {/* Partner Facility Category Header */}
        {isEnterpriseMode ? (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px', color: 'var(--ds-color-text-primary)' }}>
              1. Select Partner Facility Category *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
              {(Object.keys(PARTNER_CATEGORIES) as PartnerCategory[]).map((catKey) => {
                const cat = PARTNER_CATEGORIES[catKey];
                const isSelected = partnerCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => handleCategoryChange(catKey)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: isSelected
                        ? '1.5px solid var(--ds-color-primary, #0284c7)'
                        : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
                      backgroundColor: isSelected
                        ? 'var(--ds-color-surface-selected, rgba(2, 132, 199, 0.15))'
                        : 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.04))',
                      color: isSelected
                        ? 'var(--ds-color-primary, #38bdf8)'
                        : 'var(--ds-color-text-secondary, #94a3b8)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 10px rgba(2, 132, 199, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                      <strong style={{ fontSize: '0.8125rem', color: isSelected ? 'var(--ds-color-primary, #38bdf8)' : 'var(--ds-color-text-primary, #f8fafc)' }}>
                        {cat.shortLabel}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted, #94a3b8)', marginTop: '2px' }}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.04))',
              border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>{PARTNER_CATEGORIES[partnerCategory].icon}</span>
              <div>
                <strong style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>
                  {PARTNER_CATEGORIES[partnerCategory].label}
                </strong>
                <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                  Dedicated Facility Profile • {PARTNER_CATEGORIES[partnerCategory].shortLabel} Personnel Only
                </span>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--ds-color-surface-selected, rgba(2, 132, 199, 0.15))',
                color: 'var(--ds-color-primary, #38bdf8)',
                border: '1px solid var(--ds-color-primary, #0284c7)',
                fontWeight: 700
              }}
            >
              🔒 Partner Scoped
            </span>
          </div>
        )}

        {/* 2. Staff Code & Full Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Staff Code *
            </label>
            <Input value={staffCode} onChange={(e) => setStaffCode(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Full Name *
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Aakash Sharma / Priya Nair"
              required
            />
          </div>
        </div>

        {/* 3. Category-Specific Role Preset */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Role Template ({PARTNER_CATEGORIES[partnerCategory].shortLabel}) *
            </label>
            <Select
              value={rolePresetKey}
              onChange={(e) => handleRoleChange(e.target.value)}
              options={categoryRoles.map((r) => ({
                value: r.key,
                label: `${r.title} (${r.staffType})`
              }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Assigned Department *
            </label>
            <Select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={availableDepartments.map((d) => ({
                value: d.id,
                label: d.departmentName
              }))}
            />
          </div>
        </div>

        {/* 4. Contact & Employment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Work Email (Used for Login) *
            </label>
            <Input
              type="email"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              placeholder={
                partnerCategory === 'PHARMACY'
                  ? 'chemist@pharmacy.docsearch.health'
                  : partnerCategory === 'PATHOLOGY'
                  ? 'technician@lab.docsearch.health'
                  : partnerCategory === 'INDEPENDENT_CLINIC'
                  ? 'doctor@clinic.docsearch.health'
                  : 'staff@hospital.docsearch.health'
              }
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Mobile Phone (10 Digits)
            </label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={workPhone}
              onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, '');
                if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                setWorkPhone(digits.slice(0, 10));
              }}
              placeholder="98765 43210"
              leftElement={<span style={{ fontWeight: 800, color: 'var(--ds-color-primary, #38BDF8)', fontSize: '0.75rem' }}>+91</span>}
              style={{ paddingLeft: '44px', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Employment Engagement Type *
          </label>
          <Select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as OperationalEmploymentType)}
            options={[
              { value: 'FULL_TIME', label: 'Full Time Permanent' },
              { value: 'PART_TIME', label: 'Part Time / Shift Roster' },
              { value: 'CONTRACTOR', label: 'Contractor / Visiting Specialist' },
              { value: 'VISITING_CONSULTANT', label: 'Visiting Consultant' },
              { value: 'INTERN', label: 'Intern / Clinical Resident' }
            ]}
          />
        </div>

        {/* 4.5. Login Credentials & Security Passcode */}
        <div style={{ padding: '12px', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-primary, #0ea5e9)' }}>
              🔐 Account Login & Password Setup
            </div>
            <button
              type="button"
              onClick={handleGenerateRandomPin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ds-color-primary, #0ea5e9)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              🎲 Auto-Generate PIN
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'flex-start' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                Initial Login Password / PIN *
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="e.g. 123456 or Doc#9X2K"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: 'var(--ds-color-text-muted)'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                Login Identifiers
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', lineHeight: 1.5, background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: '4px' }}>
                Staff can log in with <strong>{workEmail || 'Work Email'}</strong> OR <strong>{staffCode || 'Staff Code'}</strong> using this password.
              </div>
            </div>
          </div>
        </div>

        {/* 4.8. 4-Tier Dynamic RBAC Access Control & Security Template */}
        <div style={{
          border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.12))',
          borderRadius: '8px',
          padding: '12px 14px',
          backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.02))',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🛡️</span>
              <div>
                <strong style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>
                  4-Tier RBAC Access & Security Template ({currentRoleDef?.title || rolePresetKey})
                </strong>
                <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                  Auto-populated from pre-configured template. You can customize permissions for this staff member.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => syncPermissionsFromRole(partnerCategory, rolePresetKey)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ds-color-primary, #0ea5e9)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              🔄 Reset to Template Defaults
            </button>
          </div>

          {/* Tier 1 & Tier 2 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Tier 1: Anti-Theft & Data Privacy */}
            <div style={{ background: 'rgba(0,0,0,0.12)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🔒 Tier 1: Patient Data-Theft Protection
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={canViewFullPhoneNumber}
                    onChange={(e) => setCanViewFullPhoneNumber(e.target.checked)}
                    style={{ accentColor: '#0284c7' }}
                  />
                  <span>Show Full Patient Mobile Number</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={canExportPatientData}
                    onChange={(e) => setCanExportPatientData(e.target.checked)}
                    style={{ accentColor: '#f87171' }}
                  />
                  <span>Allow Exporting Patient Records (CSV/Excel)</span>
                </label>
              </div>
            </div>

            {/* Tier 2: Financial Governance */}
            <div style={{ background: 'rgba(0,0,0,0.12)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                💰 Tier 2: Financial & Discount Governance
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={canGiveDiscounts}
                      onChange={(e) => setCanGiveDiscounts(e.target.checked)}
                      style={{ accentColor: '#38bdf8' }}
                    />
                    <span>Allow Billing Discounts</span>
                  </label>
                  {canGiveDiscounts && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>Max:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={maxDiscountPercent}
                        onChange={(e) => setMaxDiscountPercent(Number(e.target.value))}
                        style={{
                          width: '50px',
                          padding: '2px 4px',
                          fontSize: '0.75rem',
                          borderRadius: '4px',
                          border: '1px solid var(--ds-color-border, rgba(255,255,255,0.2))',
                          background: 'rgba(0,0,0,0.2)',
                          color: 'var(--ds-color-text-primary)'
                        }}
                      />
                      <span>%</span>
                    </div>
                  )}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={canCancelOrRefundBills}
                    onChange={(e) => setCanCancelOrRefundBills(e.target.checked)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  <span>Allow Bill Cancellation & Refunds</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tier 3: Clinical & Legal Signatory Authority */}
          <div style={{ background: 'rgba(0,0,0,0.12)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚖️ Tier 3: Clinical & Regulatory Signatory Permissions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={canSignPrescriptions}
                  onChange={(e) => setCanSignPrescriptions(e.target.checked)}
                  style={{ accentColor: '#a855f7' }}
                />
                <span>Sign e-Prescriptions (Doctor)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={canSignLabReports}
                  onChange={(e) => setCanSignLabReports(e.target.checked)}
                  style={{ accentColor: '#a855f7' }}
                />
                <span>Sign Lab/Radiology Reports (NABL)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={canDispenseRestrictedDrugs}
                  onChange={(e) => setCanDispenseRestrictedDrugs(e.target.checked)}
                  style={{ accentColor: '#a855f7' }}
                />
                <span>Dispense Narcotics & Sch. H1</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={canAccessAfterHours}
                  onChange={(e) => setCanAccessAfterHours(e.target.checked)}
                  style={{ accentColor: '#a855f7' }}
                />
                <span>24/7 After-Hours Emergency Access</span>
              </label>
            </div>
          </div>

          {/* Tier 4: Accessible Module Slugs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-color-text-secondary)' }}>
                🖥️ Tier 4: Accessible Modules ({accessibleModules.length} selected)
              </span>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.6875rem' }}>
                <button
                  type="button"
                  onClick={() => setAccessibleModules(AVAILABLE_MODULES.map((m) => m.id))}
                  style={{ background: 'none', border: 'none', color: 'var(--ds-color-primary, #0ea5e9)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setAccessibleModules([])}
                  style={{ background: 'none', border: 'none', color: 'var(--ds-color-text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear All
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {AVAILABLE_MODULES.map((mod) => {
                const isSelected = accessibleModules.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setAccessibleModules(accessibleModules.filter((m) => m !== mod.id));
                      } else {
                        setAccessibleModules([...accessibleModules, mod.id]);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      border: isSelected ? '1px solid var(--ds-color-primary, #0284c7)' : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'rgba(2, 132, 199, 0.15)' : 'rgba(0,0,0,0.1)',
                      color: isSelected ? 'var(--ds-color-primary, #38bdf8)' : 'var(--ds-color-text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{mod.icon}</span>
                    <span>{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Dynamic Category-Specific Specialized Fields */}
        {partnerCategory === 'PATHOLOGY' && (
          <div style={{ padding: '12px', background: 'rgba(147, 51, 234, 0.05)', borderRadius: '8px', border: '1px solid rgba(147, 51, 234, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#7e22ce' }}>
              🔬 Pathology & Diagnostic Laboratory Parameters
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Laboratory Workstation
                </label>
                <Input
                  value={labWorkstation}
                  onChange={(e) => setLabWorkstation(e.target.value)}
                  placeholder="e.g. Hematology, Biochemistry, Sample Triage"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  State Lab / Medical Council Reg. No.
                </label>
                <Input
                  value={councilRegNumber}
                  onChange={(e) => setCouncilRegNumber(e.target.value)}
                  placeholder="e.g. MLT-2024-8891"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isNablSignatory}
                  onChange={(e) => setIsNablSignatory(e.target.checked)}
                />
                <strong>Authorized NABL Lab Report Signatory</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPhlebotomyCertified}
                  onChange={(e) => setIsPhlebotomyCertified(e.target.checked)}
                />
                <span>Phlebotomy Certified (Blood Draw)</span>
              </label>
            </div>
          </div>
        )}

        {partnerCategory === 'PHARMACY' && (
          <div style={{ padding: '12px', background: 'rgba(13, 148, 136, 0.05)', borderRadius: '8px', border: '1px solid rgba(13, 148, 136, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#0f766e' }}>
              💊 Pharmacy Compliance & Drug Dispensing Credentials
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  State Pharmacy Council Reg No.
                </label>
                <Input
                  value={pharmacyCouncilReg}
                  onChange={(e) => setPharmacyCouncilReg(e.target.value)}
                  placeholder="e.g. WBPC-67890 (D.Pharm / B.Pharm)"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Max Counter Discount (%)
                </label>
                <Input
                  type="number"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isNarcoticsAuthorized}
                onChange={(e) => setIsNarcoticsAuthorized(e.target.checked)}
              />
              <strong>Authorized to Dispense Schedule H & Controlled Narcotics</strong>
            </label>
          </div>
        )}

        {partnerCategory === 'INDEPENDENT_CLINIC' && (
          <div style={{ padding: '12px', background: 'rgba(2, 132, 199, 0.05)', borderRadius: '8px', border: '1px solid rgba(2, 132, 199, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#0369a1' }}>
              🩺 Clinic OPD Chamber & Practice Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Clinical Specialization
                </label>
                <Input
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. General Physician, Pediatrician, Orthopedic"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  OPD Chamber / Room No.
                </label>
                <Input
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Chamber 01 / Ground Floor"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Consultation Fee (₹)
                </label>
                <Input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  placeholder="500"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Medical Council (NMC) Reg. No.
                </label>
                <Input
                  value={councilRegNumber}
                  onChange={(e) => setCouncilRegNumber(e.target.value)}
                  placeholder="e.g. MCI-55421 / NMC-2023"
                />
              </div>
            </div>
          </div>
        )}

        {partnerCategory === 'MULTI_SPECIALITY_HOSPITAL' && (
          <div style={{ padding: '12px', background: 'rgba(234, 88, 12, 0.05)', borderRadius: '8px', border: '1px solid rgba(234, 88, 12, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#c2410c' }}>
              🏥 Multi-Speciality Inpatient & Ward Hierarchy
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Ward / Floor Assignment
                </label>
                <Input
                  value={wardAssignment}
                  onChange={(e) => setWardAssignment(e.target.value)}
                  placeholder="e.g. ICU 2nd Floor, Female Medical Ward"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  ABDM Healthcare Professional Registry (HPR) ID
                </label>
                <Input
                  value={hprId}
                  onChange={(e) => setHprId(e.target.value)}
                  placeholder="e.g. 12-3456-7890-1234"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isOtAuthorized}
                  onChange={(e) => setIsOtAuthorized(e.target.checked)}
                />
                <strong>OT & Critical Care Access Authorization</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isTpaSignatory}
                  onChange={(e) => setIsTpaSignatory(e.target.checked)}
                />
                <span>TPA / Cashless Claim Signatory</span>
              </label>
            </div>
          </div>
        )}

        {partnerCategory === 'DIAGNOSTIC_CENTRE' && (
          <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#0891b2' }}>
              ☢️ Radiology, Imaging & Modality Parameters
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Modality / Workstation Assignment
                </label>
                <Input
                  value={modalityWorkstation}
                  onChange={(e) => setModalityWorkstation(e.target.value)}
                  placeholder="e.g. MRI 3T, CT 128-Slice, Digital X-Ray, USG Chamber"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  AERB / RSO Registration Number
                </label>
                <Input
                  value={aerbRegNumber}
                  onChange={(e) => setAerbRegNumber(e.target.value)}
                  placeholder="e.g. AERB-RSO-2024-991"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isContrastCertified}
                  onChange={(e) => setIsContrastCertified(e.target.checked)}
                />
                <strong>IV Contrast Administration & Resuscitation Certified</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPacsDicomAdmin}
                  onChange={(e) => setIsPacsDicomAdmin(e.target.checked)}
                />
                <span>PACS DICOM Routing & Archive Administrator</span>
              </label>
            </div>
          </div>
        )}

        {/* 6. Reason & Security Note */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Onboarding Audit Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Newly hired clinical staff onboarded with verified credentials"
            required
          />
        </div>
      </form>
      )}
    </Dialog>
  );
};
