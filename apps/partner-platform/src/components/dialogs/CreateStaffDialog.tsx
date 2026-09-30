import React, { useState, useEffect } from 'react';
import type {
  OperationalStaffType,
  OperationalEmploymentType,
  CreateOperationalStaffRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert, Badge } from '@docsearch/ui-kit';
import {
  type PartnerCategory,
  PARTNER_CATEGORIES,
  getRolesForCategory,
  getDefaultPermissionsForRole,
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
  isEnterpriseMode: _isEnterpriseMode = false,
  onCreateStaff
}) => {
  // Wizard Step: 1 = Details, 2 = Role & Security, 3 = Account Ready
  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  // Step 1: Staff Details State
  const [fullName, setFullName] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [designationTitle, setDesignationTitle] = useState('');
  const [staffCode, setStaffCode] = useState(`STF-${Math.floor(100 + Math.random() * 900)}`);
  const [employmentType, setEmploymentType] = useState<OperationalEmploymentType>('FULL_TIME');
  const [professionalRegNumber, setProfessionalRegNumber] = useState('');

  const availableDepartments = departments.length > 0 ? departments : [
    {
      id: 'default-ops-dept',
      departmentName: PARTNER_CATEGORIES[partnerCategory]?.defaultDepartment || 'General Operations'
    }
  ];
  const [departmentId, setDepartmentId] = useState(availableDepartments[0]?.id ?? 'default-ops-dept');

  // Step 2: Role Pre-Template State
  const categoryRoles = getRolesForCategory(partnerCategory);
  const defaultRolePreset = categoryRoles[0]?.key || 'CLINIC_FRONT_DESK';
  const [rolePresetKey, setRolePresetKey] = useState(defaultRolePreset);

  // Permissions
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
  const [showAdvancedPerms, setShowAdvancedPerms] = useState(false);

  // PIN / Password
  const [initialPassword, setInitialPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  // Step 3: Success Summary
  const [createdCredentialSummary, setCreatedCredentialSummary] = useState<{
    fullName: string;
    workEmail: string;
    staffCode: string;
    password: string;
    roleName: string;
    phone: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleGenerateRandomPin = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setInitialPassword(String(num));
  };

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      const cat = deduceInitialCategory();
      setPartnerCategory(cat);
      const roles = getRolesForCategory(cat);
      const initialRole = roles[0]?.key || 'CLINIC_FRONT_DESK';
      setRolePresetKey(initialRole);
      syncPermissionsFromRole(cat, initialRole);

      setStep(1);
      setFullName('');
      setWorkPhone('');
      setWorkEmail('');
      setDesignationTitle('');
      setProfessionalRegNumber('');
      setStaffCode(`STF-${Math.floor(100 + Math.random() * 900)}`);
      setInitialPassword('123456');
      setCreatedCredentialSummary(null);
      setCopied(false);
      setError(null);
      setShowAdvancedPerms(false);
    }
  }, [isOpen, initialCategory, workspace]);

  const handleRoleSelect = (roleKey: string) => {
    setRolePresetKey(roleKey);
    syncPermissionsFromRole(partnerCategory, roleKey);
    const selectedDef = categoryRoles.find((r) => r.key === roleKey);
    if (selectedDef && !designationTitle) {
      setDesignationTitle(selectedDef.title);
    }
  };

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedToStep2 = () => {
    setError(null);
    if (!fullName || fullName.trim().length < 2) {
      setError('Staff full name is required (minimum 2 characters).');
      return;
    }
    const cleanDigits = workPhone.replace(/\D/g, '');
    if (workPhone && cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!workEmail || !workEmail.includes('@')) {
      setError('A valid work email is required for login access.');
      return;
    }
    setStep(2);
  };

  // Step 2 Submission -> Call API & Move to Step 3
  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const currentRoleDef = categoryRoles.find((r) => r.key === rolePresetKey) || categoryRoles[0];
      const staffType: OperationalStaffType = currentRoleDef?.staffType || 'RECEPTIONIST';

      const permissions: StaffPermissions = {
        canExportPatientData,
        canViewFullPhoneNumber,
        canGiveDiscounts,
        maxDiscountPercent: Number(maxDiscountPercent),
        canCancelOrRefundBills,
        requiresShiftHandoverSignoff: currentRoleDef?.defaultPermissions.requiresShiftHandoverSignoff ?? false,
        canSignLabReports: partnerCategory === 'PATHOLOGY' ? true : canSignLabReports,
        canSignPrescriptions,
        canDispenseRestrictedDrugs,
        canAccessAfterHours,
        isAccessRevoked: false,
        accessibleModules
      };

      const finalPassword = initialPassword.trim() || '123456';
      const metadata: Record<string, any> = {
        partnerCategory,
        rolePresetKey,
        designationTitle: designationTitle || currentRoleDef?.title,
        permissions,
        password: finalPassword,
        mustChangePassword: true
      };

      if (professionalRegNumber.trim()) {
        metadata['councilRegNumber'] = professionalRegNumber.trim();
        metadata['licenseNumber'] = professionalRegNumber.trim();
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
        fullName: fullName.trim(),
        workEmail: workEmail.trim().toLowerCase(),
        workPhone: workPhone.trim() || undefined,
        staffType,
        primaryRole: rolePresetKey,
        employmentType,
        joiningDate: new Date().toISOString(),
        metadata,
        reason: `Onboarded ${fullName.trim()} as ${currentRoleDef?.title || rolePresetKey}`
      });

      setCreatedCredentialSummary({
        fullName: fullName.trim(),
        workEmail: workEmail.trim().toLowerCase(),
        staffCode,
        password: finalPassword,
        roleName: currentRoleDef?.title || rolePresetKey,
        phone: workPhone.trim()
      });

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to onboard staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click WhatsApp Dispatch
  const handleSendWhatsApp = () => {
    if (!createdCredentialSummary) return;
    const rawDigits = createdCredentialSummary.phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const portalUrl = `${window.location.origin}/partner`;

    const message =
      `🏥 *DocSearch Partner Portal - Staff Login Access*\n\n` +
      `Hello *${createdCredentialSummary.fullName}*,\n` +
      `Your staff account has been activated for operational access.\n\n` +
      `👤 *Role:* ${createdCredentialSummary.roleName}\n` +
      `🆔 *Staff ID / Code:* ${createdCredentialSummary.staffCode}\n` +
      `📧 *Login Email:* ${createdCredentialSummary.workEmail}\n` +
      `🔑 *Initial PIN:* ${createdCredentialSummary.password}\n` +
      `🌐 *Portal Login:* ${portalUrl}\n\n` +
      `⚠️ *Note:* Please log in and change your PIN upon first sign-in.`;

    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(targetUrl, '_blank');
  };

  // 1-Click Print Voucher Slip
  const handlePrintSlip = () => {
    if (!createdCredentialSummary) return;
    const printWindow = window.open('', '_blank', 'width=640,height=720');
    if (!printWindow) {
      window.print();
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Staff Credential Handover - ${createdCredentialSummary.fullName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 36px; color: #1e293b; background: #fff; }
            .card { border: 2px solid #0284c7; border-radius: 12px; padding: 24px; max-width: 520px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
            .header h1 { font-size: 20px; color: #0369a1; margin: 0 0 6px 0; }
            .header p { font-size: 13px; color: #64748b; margin: 0; }
            .field { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .label { font-weight: 600; color: #475569; }
            .val { font-weight: 700; color: #0f172a; font-family: monospace; }
            .pin-box { background: #f0fdf4; border: 1.5px solid #86efac; padding: 14px; border-radius: 8px; margin: 18px 0; text-align: center; }
            .pin-box .pin { font-size: 24px; font-weight: 800; color: #15803d; letter-spacing: 2px; }
            .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>🏥 DocSearch Healthcare Partner Platform</h1>
              <p>Confidential Employee Login Credential Handover</p>
            </div>
            <div class="field"><span class="label">Staff Full Name:</span><span class="val">${createdCredentialSummary.fullName}</span></div>
            <div class="field"><span class="label">Operational Role:</span><span class="val">${createdCredentialSummary.roleName}</span></div>
            <div class="field"><span class="label">Staff ID / Code:</span><span class="val">${createdCredentialSummary.staffCode}</span></div>
            <div class="field"><span class="label">Login Email:</span><span class="val">${createdCredentialSummary.workEmail}</span></div>
            <div class="pin-box">
              <div style="font-size: 12px; color: #166534; margin-bottom: 4px; font-weight: 600;">TEMPORARY LOGIN PIN</div>
              <div class="pin">${createdCredentialSummary.password}</div>
              <div style="font-size: 11px; color: #166534; margin-top: 4px;">Update this PIN upon first login</div>
            </div>
            <div class="field"><span class="label">Portal Web Address:</span><span class="val">${window.location.origin}/partner</span></div>
            <div class="footer">
              Generated securely on ${new Date().toLocaleString()} by Partner Administrator.<br/>
              Authorized internal access only.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const categoryInfo = PARTNER_CATEGORIES[partnerCategory] || PARTNER_CATEGORIES.INDEPENDENT_CLINIC;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        setCreatedCredentialSummary(null);
        setStep(1);
        onClose();
      }}
      title={
        step === 3
          ? '🎉 Staff Account Ready & Handover'
          : `➕ Onboard New Staff Member (${categoryInfo.shortLabel})`
      }
      maxWidth="md"
      footer={
        step === 1 ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleProceedToStep2}>
              Next: Select Role →
            </Button>
          </div>
        ) : step === 2 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <Button variant="outline" size="sm" onClick={() => setStep(1)} disabled={isSubmitting}>
              ← Back to Details
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleFinalSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              style={{ backgroundColor: '#10b981', borderColor: '#059669', fontWeight: 700 }}
            >
              🚀 Create Staff Account & Generate Login
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!createdCredentialSummary) return;
                  const credText =
                    `DocSearch Partner Portal Credentials\n` +
                    `Staff: ${createdCredentialSummary.fullName}\n` +
                    `Role: ${createdCredentialSummary.roleName}\n` +
                    `Staff ID: ${createdCredentialSummary.staffCode}\n` +
                    `Login Email: ${createdCredentialSummary.workEmail}\n` +
                    `PIN: ${createdCredentialSummary.password}\n` +
                    `URL: ${window.location.origin}/partner`;
                  navigator.clipboard.writeText(credText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
              >
                {copied ? '✓ Credentials Copied!' : '📋 Copy Details'}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintSlip}>
                🖨️ Print Slip
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendWhatsApp}
                style={{ backgroundColor: '#16a34a', borderColor: '#15803d', color: '#fff', fontWeight: 600 }}
              >
                📱 Send via WhatsApp
              </Button>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCreatedCredentialSummary(null);
                setStep(1);
                onClose();
              }}
            >
              ✅ Done & Return to Directory
            </Button>
          </div>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 3-Step Wizard Stepper Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--ds-color-border, rgba(255,255,255,0.1))',
            paddingBottom: '12px'
          }}
        >
          {/* Step 1 Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: step === 1 ? 1 : 0.65 }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: step === 1 ? 'var(--ds-color-primary, #0284c7)' : step > 1 ? '#10b981' : 'var(--ds-color-surface-subtle, #334155)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            >
              {step > 1 ? '✓' : '1'}
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>Staff Details</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>Name & Contact</div>
            </div>
          </div>

          <div style={{ height: '1px', flex: 1, background: 'var(--ds-color-border, rgba(255,255,255,0.1))', margin: '0 10px' }} />

          {/* Step 2 Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: step === 2 ? 1 : 0.65 }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: step === 2 ? 'var(--ds-color-primary, #0284c7)' : step > 2 ? '#10b981' : 'var(--ds-color-surface-subtle, #334155)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            >
              {step > 2 ? '✓' : '2'}
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>Role & Permissions</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>1-Click Pre-Templates</div>
            </div>
          </div>

          <div style={{ height: '1px', flex: 1, background: 'var(--ds-color-border, rgba(255,255,255,0.1))', margin: '0 10px' }} />

          {/* Step 3 Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: step === 3 ? 1 : 0.65 }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: step === 3 ? '#10b981' : 'var(--ds-color-surface-subtle, #334155)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            >
              {step === 3 ? '✓' : '3'}
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>Account Ready</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>Credentials & WhatsApp</div>
            </div>
          </div>
        </div>

        {error && <Alert type="error" title="Validation Notice">{error}</Alert>}

        {/* ======================================================== */}
        {/* STEP 1: STAFF DETAILS                                    */}
        {/* ======================================================== */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.04))', borderRadius: '6px', border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ds-color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{categoryInfo.icon}</span> Onboarding for {categoryInfo.label}
              </span>
              <Badge variant="primary">{categoryInfo.shortLabel}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Staff Full Name *
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar / Pooja Sharma"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Mobile Number (Used for WhatsApp Login Delivery) *
                </label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={workPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setWorkPhone(digits.slice(0, 10));
                  }}
                  placeholder="98765 43210"
                  leftElement={<span style={{ fontWeight: 700, color: 'var(--ds-color-primary, #0ea5e9)', fontSize: '0.75rem' }}>+91</span>}
                  style={{ paddingLeft: '44px', fontFamily: 'monospace' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Work Email (Login ID) *
                </label>
                <Input
                  type="email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  placeholder="staff@facility.docsearch.health"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Designation / Professional Title
                </label>
                <Input
                  value={designationTitle}
                  onChange={(e) => setDesignationTitle(e.target.value)}
                  placeholder="e.g. Senior Consultant / Front Desk Executive"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Operational Department *
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Engagement Type
                </label>
                <Select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as OperationalEmploymentType)}
                  options={[
                    { value: 'FULL_TIME', label: 'Full Time Permanent' },
                    { value: 'PART_TIME', label: 'Part Time / Shift' },
                    { value: 'VISITING_CONSULTANT', label: 'Visiting Consultant' },
                    { value: 'CONTRACTOR', label: 'Contractor' }
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  System Staff Code (Auto-Generated)
                </label>
                <Input
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
                  style={{ fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                Professional Registration No. (Optional: NMC / Pharmacy Council / NABL)
              </label>
              <Input
                value={professionalRegNumber}
                onChange={(e) => setProfessionalRegNumber(e.target.value)}
                placeholder="e.g. MCI-2018-94812 / PH-98213"
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: ROLE PRE-TEMPLATES & PERMISSIONS                 */}
        {/* ======================================================== */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ds-color-text-primary)' }}>
                Select Role Pre-Template for {categoryInfo.label} *
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '10px' }}>
                Permissions, module access, and data scopes auto-populate instantly based on industry standards.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {categoryRoles.map((role) => {
                  const isSelected = rolePresetKey === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => handleRoleSelect(role.key)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: isSelected
                          ? '2px solid var(--ds-color-primary, #0284c7)'
                          : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
                        background: isSelected
                          ? 'var(--ds-color-surface-selected, rgba(2, 132, 199, 0.12))'
                          : 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.03))',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 10px rgba(2, 132, 199, 0.25)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.875rem', color: isSelected ? 'var(--ds-color-primary, #38bdf8)' : 'var(--ds-color-text-primary)' }}>
                          {role.title}
                        </strong>
                        {isSelected && <span style={{ color: '#0ea5e9', fontWeight: 800 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', lineHeight: 1.4 }}>
                        {role.description}
                      </span>
                      <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                        <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--ds-color-text-secondary)' }}>
                          {role.staffType}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Login PIN Configuration */}
            <div
              style={{
                background: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.03))',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ds-color-text-primary)' }}>
                  🔑 Initial Login PIN / Password
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                  Staff member uses this PIN to log in. They will be asked to set a new password on first sign-in.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  style={{ width: '130px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '2px', textAlign: 'center' }}
                />
                <Button variant="outline" size="sm" onClick={() => setShowPassword((p) => !p)}>
                  {showPassword ? '👁️' : '🔒'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateRandomPin}>
                  🎲 Randomize
                </Button>
              </div>
            </div>

            {/* Optional Collapsible: Advanced Permissions */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedPerms((p) => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-color-primary, #0ea5e9)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 0
                }}
              >
                <span>{showAdvancedPerms ? '▼' : '▶'}</span>
                <span>⚙️ Advanced Security Controls & Permissions (Optional)</span>
              </button>

              {showAdvancedPerms && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.02))',
                    border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={canExportPatientData}
                      onChange={(e) => setCanExportPatientData(e.target.checked)}
                    />
                    <span>Tier 1: Allow Exporting Personnel or Patient Data</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={canViewFullPhoneNumber}
                      onChange={(e) => setCanViewFullPhoneNumber(e.target.checked)}
                    />
                    <span>Tier 1: Allow Viewing Unmasked Patient Phone Numbers</span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={canGiveDiscounts}
                        onChange={(e) => setCanGiveDiscounts(e.target.checked)}
                      />
                      <span>Tier 2: Allow Counter Discounts (Max %)</span>
                    </label>
                    {canGiveDiscounts && (
                      <Input
                        type="number"
                        value={String(maxDiscountPercent)}
                        onChange={(e) => setMaxDiscountPercent(Number(e.target.value))}
                        style={{ width: '80px' }}
                      />
                    )}
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={canCancelOrRefundBills}
                      onChange={(e) => setCanCancelOrRefundBills(e.target.checked)}
                    />
                    <span>Tier 2: Allow Bill Cancellation & Cash Refunds</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={canSignLabReports}
                      onChange={(e) => setCanSignLabReports(e.target.checked)}
                    />
                    <span>Tier 3: Digital Signatory for Diagnostic Lab Reports</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={canSignPrescriptions}
                      onChange={(e) => setCanSignPrescriptions(e.target.checked)}
                    />
                    <span>Tier 3: Authorized to Prescribe & Sign Digital Rx</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={canAccessAfterHours}
                      onChange={(e) => setCanAccessAfterHours(e.target.checked)}
                    />
                    <span>Tier 4: 24/7 After-Hours Remote Access</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: ACCOUNT READY & INSTANT CREDENTIAL HANDOVER     */}
        {/* ======================================================== */}
        {step === 3 && createdCredentialSummary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert type="success" title="🎉 Staff Account Provisioned Successfully!">
              New staff member <strong>{createdCredentialSummary.fullName}</strong> is now registered. Login credentials have been generated and are ready for handover.
            </Alert>

            {/* Official Credentials Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: '1.5px solid var(--ds-color-primary, #0ea5e9)',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                    {createdCredentialSummary.fullName}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-primary, #0ea5e9)', fontWeight: 600 }}>
                    {createdCredentialSummary.roleName}
                  </div>
                </div>
                <Badge variant="success">ACTIVE NOW</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.18)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '2px' }}>Staff ID / Code</div>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>
                    {createdCredentialSummary.staffCode}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.18)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '2px' }}>Login Email</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>
                    {createdCredentialSummary.workEmail}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '12px 14px', borderRadius: '6px', border: '1px dashed #10b981' }}>
                <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, marginBottom: '2px' }}>
                  TEMPORARY LOGIN PIN
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '2px', color: '#10b981' }}>
                    {createdCredentialSummary.password}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    (Change on first login)
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)', lineHeight: 1.5 }}>
                💡 <strong>Handover Instructions:</strong> Share these credentials via WhatsApp or print the slip. Staff can log in at <code>{window.location.origin}/partner</code> using their Staff ID or Email with this initial PIN.
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
