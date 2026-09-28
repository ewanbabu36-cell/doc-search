import React, { useState, useEffect } from 'react';
import type {
  OperationalStaffDto,
  StaffRoleCode,
  StaffDataScope,
  AssignStaffRoleRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert, Badge } from '@docsearch/ui-kit';
import {
  getAllRoleTemplates,
  getRoleTemplate,
  ROLE_TEMPLATES_CHANGED_EVENT,
  type PartnerRoleTemplate
} from '../../utils/partnerRoleTemplates.js';
import { RoleTemplateModal } from './RoleTemplateModal.js';

export interface AssignRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: OperationalStaffDto;
  actorId: string;
  actorRole: string;
  onAssignRole: (req: AssignStaffRoleRequest) => Promise<void>;
}

export const AssignRoleDialog: React.FC<AssignRoleDialogProps> = ({
  isOpen,
  onClose,
  staff,
  actorId,
  actorRole,
  onAssignRole
}) => {
  const [templates, setTemplates] = useState<PartnerRoleTemplate[]>(() => getAllRoleTemplates());
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setTemplates(getAllRoleTemplates());
    };
    window.addEventListener(ROLE_TEMPLATES_CHANGED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(ROLE_TEMPLATES_CHANGED_EVENT, handleUpdate);
    };
  }, []);

  const initialTemplate = getRoleTemplate(staff.primaryRole || 'ATTENDING_DOCTOR') || templates[0];
  const [roleCode, setRoleCode] = useState<StaffRoleCode>((initialTemplate?.roleCode as StaffRoleCode) || 'ATTENDING_DOCTOR');
  const [dataScope, setDataScope] = useState<StaffDataScope>(initialTemplate?.defaultDataScope || 'DEPARTMENT');
  const [isPrimary, setIsPrimary] = useState(true);
  const [reason, setReason] = useState(initialTemplate?.defaultReason || 'Role and scope assignment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTemplate = getRoleTemplate(roleCode);

  const handleApplyTemplate = (tpl: PartnerRoleTemplate) => {
    setRoleCode(tpl.roleCode as StaffRoleCode);
    setDataScope(tpl.defaultDataScope);
    setReason(tpl.defaultReason);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAssignRole({
        actorId,
        actorRole,
        tenantId: staff.tenantId,
        partnerId: staff.partnerId,
        organizationId: staff.organizationId,
        branchId: staff.branchId,
        departmentId: staff.departmentId,
        staffId: staff.id,
        roleCode,
        dataScope,
        isPrimary,
        effectiveFrom: new Date().toISOString(),
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Operational Role & Scope: ${staff.fullName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
            Assign Role
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Role Template Engine Active">
          Role assignments bind access using standardized hospital templates. Selecting a template automatically configures the recommended data scope, allowed modules, and audit justification.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
              🎯 Quick Role Template Presets
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateTemplateOpen(true)}
            >
              + Create Template
            </Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto', padding: '4px', background: 'var(--ds-color-bg-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--ds-color-border, #e2e8f0)' }}>
            {templates.map((tpl) => {
              const isSelected = roleCode === tpl.roleCode;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    border: isSelected ? '2px solid #2563eb' : '1px solid var(--ds-color-border, #cbd5e1)',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    color: isSelected ? '#1d4ed8' : '#334155',
                    fontWeight: isSelected ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tpl.icon}</span>
                  <span>{(tpl.templateName || tpl.roleCode).split('/')[0]?.trim()}</span>
                  {tpl.isCustom && <span style={{ fontSize: '0.625rem', background: '#f3e8ff', color: '#7e22ce', padding: '1px 3px', borderRadius: '3px' }}>Custom</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Operational Role Code *
          </label>
          <Select
            value={roleCode}
            onChange={(e) => {
              const code = e.target.value as StaffRoleCode;
              const tpl = getRoleTemplate(code);
              if (tpl) {
                handleApplyTemplate(tpl);
              } else {
                setRoleCode(code);
              }
            }}
            options={templates.map((t) => ({
              value: t.roleCode,
              label: `${t.icon} ${t.templateName} (${t.roleCode})${t.isCustom ? ' [Custom]' : ''}`
            }))}
          />
        </div>

        {activeTemplate && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--ds-color-surface-subtle, #182234)',
              border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.12))',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>{activeTemplate.icon}</span>
                <strong style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-primary, #f8fafc)' }}>{activeTemplate.templateName}</strong>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Badge variant="primary">{activeTemplate.categoryLabel}</Badge>
                <Badge variant="success">Default Scope: {activeTemplate.defaultDataScope}</Badge>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ds-color-text-secondary, #cbd5e1)' }}>
              {activeTemplate.description}
            </p>

            <div>
              <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--ds-color-text-muted, #94a3b8)', marginBottom: '4px' }}>
                Included Allowed Modules ({(activeTemplate.allowedModules as any[]).includes('*') ? 'All 26 Modules' : activeTemplate.allowedModules.length}):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(activeTemplate.allowedModules as any[]).includes('*') ? (
                  <Badge variant="success">✨ All 26 Hospital Modules Unlocked</Badge>
                ) : (
                  activeTemplate.allowedModules.map((m) => (
                    <span
                      key={m}
                      style={{
                        fontSize: '0.6875rem',
                        padding: '2px 6px',
                        background: 'var(--ds-color-surface, #121826)',
                        color: 'var(--ds-color-accent, #38bdf8)',
                        border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}
                    >
                      {m}
                    </span>
                  ))
                )}
              </div>
            </div>

            {activeTemplate.accessibleFeatures.length > 0 && (
              <div style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-secondary, #cbd5e1)' }}>
                <strong style={{ display: 'block', color: 'var(--ds-color-text-primary, #f8fafc)', marginBottom: '2px' }}>Key Privileges:</strong>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  {activeTemplate.accessibleFeatures.slice(0, 3).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Data Scope Boundary *
          </label>
          <Select
            value={dataScope}
            onChange={(e) => setDataScope(e.target.value as StaffDataScope)}
            options={[
              { value: 'ORGANIZATION', label: 'ORGANIZATION (Entire Clinic/Hospital entity)' },
              { value: 'BRANCH', label: 'BRANCH (Physical facility location)' },
              { value: 'DEPARTMENT', label: 'DEPARTMENT (Assigned clinical department)' },
              { value: 'ASSIGNED', label: 'ASSIGNED (Directly assigned patients/cases only)' },
              { value: 'SELF', label: 'SELF (Self records only)' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Primary Assignment
          </label>
          <Select
            value={isPrimary ? 'TRUE' : 'FALSE'}
            onChange={(e) => setIsPrimary(e.target.value === 'TRUE')}
            options={[
              { value: 'TRUE', label: 'Primary Role (Default operational context)' },
              { value: 'FALSE', label: 'Secondary / Concurrent Role' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Authorized Department Head delegation for Cardiology"
            required
          />
        </div>
      </form>
    </Dialog>

    {isCreateTemplateOpen && (
      <RoleTemplateModal
        isOpen={isCreateTemplateOpen}
        onClose={() => setIsCreateTemplateOpen(false)}
        onSaved={(created) => {
          handleApplyTemplate(created);
          setIsCreateTemplateOpen(false);
        }}
      />
    )}
    </>
  );
};
