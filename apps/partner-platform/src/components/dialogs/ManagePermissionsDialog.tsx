import React, { useState } from 'react';
import type { OperationalStaffDto } from '@docsearch/api-contracts';
import { Dialog, Button, Alert, Badge } from '@docsearch/ui-kit';
import {
  type PartnerCategory,
  type StaffPermissions,
  AVAILABLE_MODULES,
  PARTNER_CATEGORIES,
  getDefaultPermissionsForRole
} from '../../types/partner-staff-rbac.js';

export interface ManagePermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: OperationalStaffDto;
  onUpdatePermissions: (staffId: string, perms: Partial<StaffPermissions>) => Promise<void>;
}

export const ManagePermissionsDialog: React.FC<ManagePermissionsDialogProps> = ({
  isOpen,
  onClose,
  staff,
  onUpdatePermissions
}) => {
  const staffCategory: PartnerCategory =
    (staff as any).partnerCategory || staff.metadata?.['partnerCategory'] || 'INDEPENDENT_CLINIC';

  const categoryInfo = PARTNER_CATEGORIES[staffCategory] || PARTNER_CATEGORIES.INDEPENDENT_CLINIC;

  const currentPerms: StaffPermissions =
    (staff as any).permissions ||
    staff.metadata?.['permissions'] ||
    getDefaultPermissionsForRole(staffCategory, staff.primaryRole || 'CLINIC_FRONT_DESK');

  const [permissions, setPermissions] = useState<StaffPermissions>({ ...currentPerms });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetToPreset = () => {
    const defaults = getDefaultPermissionsForRole(staffCategory, staff.primaryRole || 'CLINIC_FRONT_DESK');
    setPermissions(defaults);
  };

  const handleToggleModule = (moduleId: string) => {
    const currentList = permissions.accessibleModules || [];
    const exists = currentList.includes(moduleId);
    const updated = exists
      ? currentList.filter((m) => m !== moduleId)
      : [...currentList, moduleId];
    setPermissions({ ...permissions, accessibleModules: updated });
  };

  const handleSelectAllModules = () => {
    setPermissions({
      ...permissions,
      accessibleModules: AVAILABLE_MODULES.map((m) => m.id)
    });
  };

  const handleDeselectAllModules = () => {
    setPermissions({
      ...permissions,
      accessibleModules: []
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onUpdatePermissions(staff.id, permissions);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Role-Based Access Control (RBAC) & Feature Permissions"
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Button variant="outline" size="sm" onClick={handleResetToPreset} disabled={isSubmitting}>
            🔄 Reset to Role Default
          </Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
              Save Permissions
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Staff Header Summary */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--ds-color-bg-subtle, #f8fafc)',
            border: '1px solid var(--ds-color-border, #e2e8f0)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--ds-color-text-primary, #0f172a)' }}>
                {staff.fullName}
              </strong>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                ({staff.staffCode})
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary, #475569)', marginTop: '2px' }}>
              Role: <strong>{staff.primaryRole}</strong> • Dept: {staff.departmentName || 'General Operations'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Badge variant="primary">
              {categoryInfo.icon} {categoryInfo.shortLabel}
            </Badge>
            <Badge variant="neutral">{staff.staffType}</Badge>
          </div>
        </div>

        {error && <Alert type="error" title="RBAC Update Error">{error}</Alert>}

        {/* Section 1: Anti-Theft & Data Protection */}
        <div style={{ border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))', borderRadius: '8px', padding: '14px', backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.03))' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171' }}>
            🛡️ 1. Patient Data Theft Protection (Healthcare Compliance)
          </h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
            Restrict sensitive patient exports and contact details to prevent unauthorized patient database duplication.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <input
                type="checkbox"
                checked={permissions.canExportPatientData}
                onChange={(e) => setPermissions({ ...permissions, canExportPatientData: e.target.checked })}
                style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#f87171' }}
              />
              <div>
                <strong>Allow Patient Data Export (CSV / Excel / PDF)</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#f87171' }}>
                  ⚠️ Highly Sensitive: Should remain disabled for general reception, lab tech, and nursing staff.
                </span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <input
                type="checkbox"
                checked={permissions.canViewFullPhoneNumber}
                onChange={(e) => setPermissions({ ...permissions, canViewFullPhoneNumber: e.target.checked })}
                style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#0284c7' }}
              />
              <div>
                <strong>Show Full Patient Mobile Phone Number</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                  When unchecked, patient phone numbers are partially masked (e.g. <code>98765*****</code>) to staff.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Financial & Anti-Fraud Controls */}
        <div style={{ border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))', borderRadius: '8px', padding: '14px', backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.03))' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#2dd4bf' }}>
            💰 2. Financial, Discounts & Cash Controls
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <input
                type="checkbox"
                checked={permissions.canGiveDiscounts}
                onChange={(e) => setPermissions({ ...permissions, canGiveDiscounts: e.target.checked })}
                style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#0d9488' }}
              />
              <div>
                <strong>Can Apply Invoice Discounts</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                  Permits cashier/staff to reduce billing items at counter.
                </span>
              </div>
            </label>

            {permissions.canGiveDiscounts && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-color-text-secondary, #94a3b8)' }}>
                  Max Discount Allowed (%)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={permissions.maxDiscountPercent}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        maxDiscountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0))
                      })
                    }
                    style={{
                      width: '80px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.15))',
                      backgroundColor: 'var(--ds-color-surface, rgba(255, 255, 255, 0.04))',
                      color: 'var(--ds-color-text-primary, #f8fafc)',
                      fontSize: '0.8125rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>% maximum per bill</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <input
                type="checkbox"
                checked={permissions.canCancelOrRefundBills}
                onChange={(e) => setPermissions({ ...permissions, canCancelOrRefundBills: e.target.checked })}
                style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#0d9488' }}
              />
              <div>
                <strong>Can Cancel or Refund Settled Invoices</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                  Prevents unauthorized billing reversals and counter cash leakage.
                </span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <input
                type="checkbox"
                checked={permissions.requiresShiftHandoverSignoff}
                onChange={(e) => setPermissions({ ...permissions, requiresShiftHandoverSignoff: e.target.checked })}
                style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#0d9488' }}
              />
              <div>
                <strong>Mandatory Shift Handover Sign-off</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                  Requires daily cash total reconciliation before shift logout.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Clinical & Legal Authorities */}
        <div style={{ border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))', borderRadius: '8px', padding: '14px', backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.03))' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8' }}>
            ⚖️ 3. Clinical & Legal Authorization
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {(staffCategory === 'PATHOLOGY' || staffCategory === 'MULTI_SPECIALITY_HOSPITAL' || staffCategory === 'DIAGNOSTIC_CENTRE') && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                <input
                  type="checkbox"
                  checked={permissions.canSignLabReports}
                  onChange={(e) => setPermissions({ ...permissions, canSignLabReports: e.target.checked })}
                  style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#4f46e5' }}
                />
                <div>
                  <strong>Sign Diagnostic Lab & Radiology Reports (NABL / AERB)</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                    Requires Pathologist MD / Radiologist MD Reg. No.
                  </span>
                </div>
              </label>
            )}

            {(staffCategory === 'INDEPENDENT_CLINIC' || staffCategory === 'MULTI_SPECIALITY_HOSPITAL') && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                <input
                  type="checkbox"
                  checked={permissions.canSignPrescriptions}
                  onChange={(e) => setPermissions({ ...permissions, canSignPrescriptions: e.target.checked })}
                  style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#4f46e5' }}
                />
                <div>
                  <strong>Issue & Sign Doctor Prescriptions (e-Rx)</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                    Requires NMC / State Medical Council Reg. No.
                  </span>
                </div>
              </label>
            )}

            {(staffCategory === 'PHARMACY' || staffCategory === 'MULTI_SPECIALITY_HOSPITAL') && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                <input
                  type="checkbox"
                  checked={permissions.canDispenseRestrictedDrugs}
                  onChange={(e) => setPermissions({ ...permissions, canDispenseRestrictedDrugs: e.target.checked })}
                  style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#4f46e5' }}
                />
                <div>
                  <strong>Dispense Schedule H / Narcotics</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                    Requires registered pharmacist supervision.
                  </span>
                </div>
              </label>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <input
                type="checkbox"
                checked={permissions.canAccessAfterHours}
                onChange={(e) => setPermissions({ ...permissions, canAccessAfterHours: e.target.checked })}
                style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#4f46e5' }}
              />
              <div>
                <strong>Allow After-Hours & Remote Login</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                  Permits login outside standard facility working shifts.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 4: Module Access Grid */}
        <div style={{ border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))', borderRadius: '8px', padding: '14px', backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.03))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ds-color-primary, #38bdf8)' }}>
              📱 4. Accessible System Modules ({permissions.accessibleModules?.length || 0} Enabled)
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSelectAllModules}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-color-primary, #38bdf8)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Select All
              </button>
              <span style={{ color: 'var(--ds-color-border, rgba(255, 255, 255, 0.2))' }}>|</span>
              <button
                type="button"
                onClick={handleDeselectAllModules}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-color-text-muted, #94a3b8)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Deselect All
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '8px'
            }}
          >
            {AVAILABLE_MODULES.map((m) => {
              const isChecked = (permissions.accessibleModules || []).includes(m.id);
              return (
                <label
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: isChecked
                      ? '1px solid var(--ds-color-primary, #0284c7)'
                      : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                    backgroundColor: isChecked
                      ? 'var(--ds-color-surface-selected, rgba(2, 132, 199, 0.15))'
                      : 'var(--ds-color-surface, rgba(255, 255, 255, 0.02))',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleModule(m.id)}
                    style={{ cursor: 'pointer', accentColor: '#0284c7' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>{m.icon}</span>
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ display: 'block', fontWeight: isChecked ? 600 : 500, color: isChecked ? 'var(--ds-color-text-primary, #f8fafc)' : 'var(--ds-color-text-secondary, #cbd5e1)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {m.label}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                      {m.category}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
