import React, { useState, useEffect, useMemo } from 'react';
import type { StaffDataScope } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { PartnerModuleKey } from '../PartnerPlatformShell.js';
import {
  type PartnerRoleTemplate,
  type RoleCategory,
  type ProfilePresetItem,
  getAllowedModulesForProfile,
  getProfileDisplayLabel,
  getProfilePresetRoleTemplates,
  createRoleTemplate,
  updateRoleTemplate
} from '../../utils/partnerRoleTemplates.js';

export interface RoleTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: PartnerRoleTemplate | null;
  onSaved: (template: PartnerRoleTemplate) => void;
  workspace?: string | undefined;
  partnerType?: string | undefined;
}

const EMOJI_PALETTE = [
  '🏢', '🩺', '👩‍⚕️', '💉', '🔬', '🧪', '☢️', '💊',
  '📦', '📊', '💵', '🛡️', '👑', '🏥', '👨‍💼', '🚨',
  '❤️', '🔪', '🛎️', '🩸', '🦷', '🌿', '⚡', '📋'
];

export const RoleTemplateModal: React.FC<RoleTemplateModalProps> = ({
  isOpen,
  onClose,
  templateToEdit,
  onSaved,
  workspace,
  partnerType
}) => {
  const isEditing = Boolean(templateToEdit);

  const availableModules = useMemo(
    () => getAllowedModulesForProfile(workspace, partnerType),
    [workspace, partnerType]
  );

  const profileLabel = useMemo(
    () => getProfileDisplayLabel(workspace, partnerType),
    [workspace, partnerType]
  );

  const presets = useMemo(
    () => getProfilePresetRoleTemplates(workspace, partnerType),
    [workspace, partnerType]
  );

  const [templateName, setTemplateName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [icon, setIcon] = useState('🩺');
  const [category, setCategory] = useState<RoleCategory>('CLINICAL');
  const [defaultDataScope, setDefaultDataScope] = useState<StaffDataScope>('DEPARTMENT');
  const [defaultModule, setDefaultModule] = useState<PartnerModuleKey>('clinical-consultation');
  const [allowedModules, setAllowedModules] = useState<PartnerModuleKey[]>(['clinical-consultation']);
  const [isAllModules, setIsAllModules] = useState(false);
  const [description, setDescription] = useState('');
  const [accessibleFeaturesText, setAccessibleFeaturesText] = useState('');
  const [restrictedFeaturesText, setRestrictedFeaturesText] = useState('');
  const [defaultReason, setDefaultReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (templateToEdit) {
      setTemplateName(templateToEdit.templateName);
      setRoleCode(templateToEdit.roleCode);
      setIcon(templateToEdit.icon);
      setCategory(templateToEdit.category);
      setDefaultDataScope(templateToEdit.defaultDataScope);
      setDefaultModule(templateToEdit.defaultModule);
      if ((templateToEdit.allowedModules as any[]).includes('*')) {
        setIsAllModules(true);
        setAllowedModules(availableModules.map((m) => m.key));
      } else {
        setIsAllModules(false);
        const validAllowed = (templateToEdit.allowedModules as PartnerModuleKey[]).filter((k) =>
          availableModules.some((m) => m.key === k)
        );
        setAllowedModules(validAllowed.length > 0 ? validAllowed : [availableModules[0]?.key || 'patient-registration']);
      }
      setDescription(templateToEdit.description);
      setAccessibleFeaturesText(templateToEdit.accessibleFeatures.join('\n'));
      setRestrictedFeaturesText(templateToEdit.restrictedFeatures.join('\n'));
      setDefaultReason(templateToEdit.defaultReason);
      setError(null);
    } else {
      // Defaults for brand new template scoped to partner profile
      setTemplateName('');
      setRoleCode('');
      setIcon(
        profileLabel === 'Pharmacy' ? '💊' :
        profileLabel === 'Pathology Lab' ? '🔬' :
        profileLabel === 'Diagnostic Centre' ? '☢️' : '🩺'
      );
      setCategory(
        profileLabel === 'Pharmacy' ? 'PHARMACY' :
        profileLabel === 'Pathology Lab' ? 'DIAGNOSTICS' :
        profileLabel === 'Diagnostic Centre' ? 'DIAGNOSTICS' : 'CLINICAL'
      );
      setDefaultDataScope(profileLabel === 'Clinic' ? 'ORGANIZATION' : 'DEPARTMENT');
      const initialLanding = availableModules[0]?.key || 'patient-registration';
      setDefaultModule(initialLanding);
      const initialAllowed = availableModules.slice(0, Math.min(3, availableModules.length)).map((m) => m.key);
      setAllowedModules(initialAllowed);
      setIsAllModules(false);
      setDescription(`Operational staff role template for ${profileLabel} operations.`);
      setAccessibleFeaturesText(
        profileLabel === 'Pharmacy'
          ? 'Counter POS Billing\nDispensing & Batch Verification\nStock Ledger View'
          : profileLabel === 'Pathology Lab'
          ? 'Patient Accessioning\nSample Barcode Scanning\nLab Test Result Entry'
          : 'OPD Patient Queue & Token Calling\nClinical EMR & SOAP Documentation\ne-Prescription Generation'
      );
      setRestrictedFeaturesText(
        profileLabel === 'Clinic'
          ? 'Pharmacy Wholesale Inwarding (Restricted to Pharmacy)\nInpatient Ward / Bed Management (Restricted to Hospitals)\nPathology Analyzer Hardware Interface'
          : profileLabel === 'Pathology Lab'
          ? 'Prescription Writing / Medical Advice\nPharmacy Counter Sales\nInpatient Bed Allocation'
          : 'Clinical SOAP Consultations\nRadiology PACS Imaging'
      );
      setDefaultReason(`${profileLabel} Operational Staff Assignment`);
      setError(null);
    }
  }, [templateToEdit, isOpen, availableModules, profileLabel]);

  // Auto-suggest roleCode from templateName when creating
  const handleNameChange = (val: string) => {
    setTemplateName(val);
    if (!isEditing) {
      const generated = val
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      setRoleCode(generated);
    }
  };

  const handleApplyPreset = (preset: ProfilePresetItem) => {
    setTemplateName(preset.templateName);
    setRoleCode(preset.roleCode);
    setIcon(preset.icon);
    setCategory(preset.category);
    setDefaultDataScope(preset.defaultDataScope);
    setDefaultModule(preset.defaultModule);
    setAllowedModules(preset.allowedModules as PartnerModuleKey[]);
    setIsAllModules(false);
    setDescription(preset.description);
    setAccessibleFeaturesText(preset.accessibleFeatures.join('\n'));
    setRestrictedFeaturesText(preset.restrictedFeatures.join('\n'));
    setDefaultReason(preset.defaultReason);
    setError(null);
  };

  const toggleModule = (modKey: PartnerModuleKey) => {
    if (isAllModules) {
      setIsAllModules(false);
    }
    setAllowedModules((prev) =>
      prev.includes(modKey) ? prev.filter((k) => k !== modKey) : [...prev, modKey]
    );
  };

  const handleSelectAllModules = () => {
    setIsAllModules(true);
    setAllowedModules(availableModules.map((m) => m.key));
  };

  const handleClearModules = () => {
    setIsAllModules(false);
    setAllowedModules([]);
  };

  const getCategoryLabel = (cat: RoleCategory): string => {
    switch (cat) {
      case 'FRONT_DESK': return 'Front Desk & Reception';
      case 'CLINICAL': return 'Clinical & Specialist Care';
      case 'NURSING': return 'Nursing & Ward Care';
      case 'DIAGNOSTICS': return 'Diagnostics & Laboratory';
      case 'PHARMACY': return 'Pharmacy & Supply Chain';
      case 'BILLING': return 'Billing & Revenue Cycle';
      case 'EXECUTIVE': return 'Executive Leadership';
      case 'QUALITY_FACILITY': return 'Quality & Biomedical Facilities';
      default: return 'Hospital Operations';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!templateName.trim()) {
      setError('Template name is required.');
      return;
    }
    if (!roleCode.trim()) {
      setError('Role code is required.');
      return;
    }
    if (!isAllModules && allowedModules.length === 0) {
      setError('At least one hospital module must be selected.');
      return;
    }

    const cleanCode = roleCode.trim().toUpperCase().replace(/[\s-]+/g, '_');
    const accessibleFeatures = accessibleFeaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const restrictedFeatures = restrictedFeaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      if (isEditing && templateToEdit) {
        const saved = updateRoleTemplate(templateToEdit.id, {
          templateName: templateName.trim(),
          roleCode: cleanCode,
          icon,
          category,
          categoryLabel: getCategoryLabel(category),
          defaultDataScope,
          defaultModule,
          allowedModules: isAllModules ? ['*'] : allowedModules,
          description: description.trim() || `${templateName} operational template.`,
          accessibleFeatures: accessibleFeatures.length > 0 ? accessibleFeatures : ['Standard operational access'],
          restrictedFeatures: restrictedFeatures.length > 0 ? restrictedFeatures : ['Restricted administrative console'],
          defaultReason: defaultReason.trim() || `Assigned ${templateName} privileges.`
        });
        onSaved(saved);
        onClose();
      } else {
        const saved = createRoleTemplate({
          templateName: templateName.trim(),
          roleCode: cleanCode,
          icon,
          category,
          categoryLabel: getCategoryLabel(category),
          defaultDataScope,
          defaultModule,
          allowedModules: isAllModules ? ['*'] : allowedModules,
          description: description.trim() || `${templateName} operational template.`,
          accessibleFeatures: accessibleFeatures.length > 0 ? accessibleFeatures : ['Standard operational access'],
          restrictedFeatures: restrictedFeatures.length > 0 ? restrictedFeatures : ['Restricted administrative console'],
          defaultReason: defaultReason.trim() || `Assigned ${templateName} privileges.`
        });
        onSaved(saved);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role template');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group modules by category for clean checklist display
  const moduleCategories = [
    'Desk & Intake',
    'Clinical & Wards',
    'Diagnostics & PACS',
    'Supply & Pharmacy',
    'Finance & Governance'
  ] as const;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `✏️ Edit ${profileLabel} Role Template: ${templateToEdit?.templateName}` : `✨ Create New ${profileLabel} Role Template`}
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
            {isEditing ? 'Save Template Changes' : 'Create Role Template'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        {/* 1-Click Profile Preset Quick Selector */}
        {presets.length > 0 && !isEditing && (
          <div
            style={{
              background: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--ds-color-primary, #0284c7)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ds-color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>⚡</span> 1-Click Ready Pre-Templates for {profileLabel}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                Select a standard role to auto-populate permissions
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {presets.map((preset) => {
                const isSelected = roleCode === preset.roleCode;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isSelected
                        ? '1.5px solid var(--ds-color-primary, #0284c7)'
                        : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.12))',
                      background: isSelected
                        ? 'var(--ds-color-primary, #0284c7)'
                        : 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.05))',
                      color: isSelected ? '#ffffff' : 'var(--ds-color-text-primary, #f1f5f9)',
                      boxShadow: isSelected ? '0 0 10px rgba(2, 132, 199, 0.3)' : 'none'
                    }}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.templateName}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
              💡 Auto-fills role code, permissions, landing module, and data scope. Partner admin retains full control to customize checkboxes below.
            </div>
          </div>
        )}

        {/* 1. Basic Info Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Template Display Name *
            </label>
            <Input
              value={templateName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Senior Clinic Physician"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Role Code (System Identifier) *
            </label>
            <Input
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              placeholder="e.g. CLINIC_PHYSICIAN"
              required
            />
          </div>
        </div>

        {/* 2. Emoji & Category Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Template Icon: <span style={{ fontSize: '1.25rem', verticalAlign: 'middle', marginLeft: '4px' }}>{icon}</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '6px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', maxHeight: '72px', overflowY: 'auto' }}>
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  style={{
                    border: icon === emoji ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: icon === emoji ? '#eff6ff' : '#ffffff',
                    borderRadius: '4px',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Operational Category *
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as RoleCategory)}
              options={[
                { value: 'FRONT_DESK', label: '🏢 Front Desk & Reception' },
                { value: 'CLINICAL', label: '🩺 Clinical & Specialist Care' },
                { value: 'NURSING', label: '👩‍⚕️ Nursing & Care' },
                { value: 'DIAGNOSTICS', label: '🔬 Diagnostics & Laboratory' },
                { value: 'PHARMACY', label: '💊 Pharmacy & Supply' },
                { value: 'BILLING', label: '📊 Billing & Revenue Cycle' },
                { value: 'EXECUTIVE', label: '👑 Executive Leadership' },
                { value: 'QUALITY_FACILITY', label: '🛡️ Quality & Facility' }
              ]}
            />
          </div>
        </div>

        {/* 3. Scope & Landing Module Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Recommended Data Scope *
            </label>
            <Select
              value={defaultDataScope}
              onChange={(e) => setDefaultDataScope(e.target.value as StaffDataScope)}
              options={[
                { value: 'ORGANIZATION', label: 'ORGANIZATION (Entire entity scope)' },
                { value: 'BRANCH', label: 'BRANCH (Physical location)' },
                { value: 'DEPARTMENT', label: 'DEPARTMENT (Assigned clinical department)' },
                { value: 'ASSIGNED', label: 'ASSIGNED (Directly assigned patients only)' },
                { value: 'SELF', label: 'SELF (Self records only)' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Default Landing Module *
            </label>
            <Select
              value={defaultModule}
              onChange={(e) => setDefaultModule(e.target.value as PartnerModuleKey)}
              options={availableModules.map((m) => ({
                value: m.key,
                label: `${m.label} (${m.category})`
              }))}
            />
          </div>
        </div>

        {/* 4. Description */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Template Operational Description *
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe the day-to-day responsibilities and scope of this template"
            required
          />
        </div>

        {/* 5. Allowed Modules Checklist */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                  Allowed {profileLabel} Modules ({isAllModules ? `All ${availableModules.length} Unlocked` : `${allowedModules.length} of ${availableModules.length} Selected`})
                </strong>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                  🔒 {profileLabel.toUpperCase()} SCOPE
                </span>
              </div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                Only authorized {profileLabel} modules are available. Cross-industry modules (e.g. Inpatient, OT, Blood Bank, Wholesale Pharmacy) are strictly filtered out.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button type="button" variant="outline" size="sm" onClick={handleSelectAllModules}>
                Select All ({availableModules.length})
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleClearModules}>
                Clear All
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
            {moduleCategories.map((catName) => {
              const catModules = availableModules.filter((m) => m.category === catName);
              if (catModules.length === 0) return null;
              return (
                <div key={catName} style={{ background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>
                    {catName} ({catModules.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                    {catModules.map((m) => {
                      const isChecked = isAllModules || allowedModules.includes(m.key);
                      return (
                        <label
                          key={m.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: isChecked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                            background: isChecked ? '#eff6ff' : '#fafafa',
                            color: isChecked ? '#1e40af' : '#334155',
                            fontWeight: isChecked ? '600' : '400',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleModule(m.key)}
                          />
                          <span>{m.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Key Privileges & Restrictions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', color: '#16a34a' }}>
              ✓ Key Permissions / Privileges (1 per line)
            </label>
            <textarea
              value={accessibleFeaturesText}
              onChange={(e) => setAccessibleFeaturesText(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
                fontFamily: 'inherit'
              }}
              placeholder="e.g. OPD Consultation EMR&#10;Digital e-Prescriptions&#10;Lab Result Approval"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', color: '#dc2626' }}>
              ✗ Explicit Restrictions (1 per line)
            </label>
            <textarea
              value={restrictedFeaturesText}
              onChange={(e) => setRestrictedFeaturesText(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
                fontFamily: 'inherit'
              }}
              placeholder="e.g. Financial Tariff Edits&#10;Direct Cash Collection"
            />
          </div>
        </div>

        {/* 7. Default Audit Justification */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Default Audit Justification Template
          </label>
          <Input
            value={defaultReason}
            onChange={(e) => setDefaultReason(e.target.value)}
            placeholder="e.g. Authorized Cath Lab specialist appointment for Cardiology"
          />
        </div>
      </form>
    </Dialog>
  );
};
