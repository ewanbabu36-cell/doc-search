import React, { useState } from 'react';
import type { SecurityRoleDto } from '@docsearch/api-contracts';

export interface RoleTemplatePreset {
  id: string;
  name: string;
  code: string;
  icon: string;
  scopeType: 'PARTNER' | 'PLATFORM' | 'COMPANY';
  description: string;
  perms: {
    readEmr: boolean;
    writeEmr: boolean;
    signPrescription: boolean;
    certifyNabl: boolean;
    manageBilling: boolean;
    refundPayments: boolean;
    exportAuditPhi: boolean;
    abdmSync: boolean;
    manageUsers: boolean;
    radiologyPacs?: boolean;
    emergencyBreakGlass?: boolean;
    pharmacyDispense?: boolean;
  };
}

export const ROLE_PRESET_TEMPLATES: RoleTemplatePreset[] = [
  {
    id: 'TPL-1',
    name: 'Senior Chief Medical Officer (CMO)',
    code: 'CHIEF_MEDICAL_OFFICER',
    icon: '🏥',
    scopeType: 'PARTNER',
    description: 'Executive clinical leadership with full EMR oversight, prescription authorization, and emergency break-glass approval.',
    perms: { readEmr: true, writeEmr: true, signPrescription: true, certifyNabl: true, manageBilling: false, refundPayments: false, exportAuditPhi: true, abdmSync: true, manageUsers: true, emergencyBreakGlass: true }
  },
  {
    id: 'TPL-2',
    name: 'Head Pathologist & NABL Director',
    code: 'HEAD_PATHOLOGIST_NABL',
    icon: '🧪',
    scopeType: 'PARTNER',
    description: 'Directs pathology operations, verifies blood/biochemistry parameters, and digitally approves NABL test reports.',
    perms: { readEmr: true, writeEmr: false, signPrescription: false, certifyNabl: true, manageBilling: false, refundPayments: false, exportAuditPhi: false, abdmSync: true, manageUsers: false }
  },
  {
    id: 'TPL-3',
    name: 'Attending Senior Consultant / Doctor',
    code: 'ATTENDING_CONSULTANT_DOCTOR',
    icon: '🩺',
    scopeType: 'PARTNER',
    description: 'Conducts OPD/IPD consultations, signs digital doctor prescriptions (Rx), and orders clinical investigations.',
    perms: { readEmr: true, writeEmr: true, signPrescription: true, certifyNabl: false, manageBilling: false, refundPayments: false, exportAuditPhi: false, abdmSync: true, manageUsers: false }
  },
  {
    id: 'TPL-4',
    name: 'Emergency ICU / Trauma Nurse Lead',
    code: 'EMERGENCY_ICU_NURSE',
    icon: '💉',
    scopeType: 'PARTNER',
    description: 'Monitors vital signs, triage scoring, medication administration logs, and rapid emergency EMR retrieval.',
    perms: { readEmr: true, writeEmr: true, signPrescription: false, certifyNabl: false, manageBilling: false, refundPayments: false, exportAuditPhi: false, abdmSync: false, manageUsers: false, emergencyBreakGlass: true }
  },
  {
    id: 'TPL-5',
    name: 'Chief Pharmacist & Drug Dispenser',
    code: 'CHIEF_PHARMACIST',
    icon: '💊',
    scopeType: 'PARTNER',
    description: 'Dispenses prescribed medications, verifies batch numbers, tracks narcotic schedules, and manages pharmacy bills.',
    perms: { readEmr: true, writeEmr: false, signPrescription: false, certifyNabl: false, manageBilling: true, refundPayments: false, exportAuditPhi: false, abdmSync: false, manageUsers: false, pharmacyDispense: true }
  },
  {
    id: 'TPL-6',
    name: 'Billing & TPA Insurance Executive',
    code: 'BILLING_TPA_EXECUTIVE',
    icon: '💵',
    scopeType: 'PARTNER',
    description: 'Generates 18% GST invoices, coordinates cashless insurance pre-authorizations, and records POS payments.',
    perms: { readEmr: false, writeEmr: false, signPrescription: false, certifyNabl: false, manageBilling: true, refundPayments: true, exportAuditPhi: false, abdmSync: false, manageUsers: false }
  },
  {
    id: 'TPL-7',
    name: 'Data Protection Officer & CISO Auditor',
    code: 'DPO_COMPLIANCE_AUDITOR',
    icon: '🛡️',
    scopeType: 'PLATFORM',
    description: 'Verifies SHA-256 Merkle audit chains, oversees patient consent compliance, and exports HIPAA/DISHA audit reports.',
    perms: { readEmr: false, writeEmr: false, signPrescription: false, certifyNabl: false, manageBilling: false, refundPayments: false, exportAuditPhi: true, abdmSync: true, manageUsers: false }
  },
  {
    id: 'TPL-8',
    name: 'Front-Desk Patient Desk Receptionist',
    code: 'FRONT_DESK_RECEPTIONIST',
    icon: '🏢',
    scopeType: 'PARTNER',
    description: 'Registers walk-in patients, creates ABHA health IDs, generates OPD queue tokens, and books appointments.',
    perms: { readEmr: false, writeEmr: false, signPrescription: false, certifyNabl: false, manageBilling: true, refundPayments: false, exportAuditPhi: false, abdmSync: true, manageUsers: false }
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateRole: (newRole: SecurityRoleDto) => void;
  onProvisionAllTemplates?: (templates: SecurityRoleDto[]) => void;
}

export const CustomRolePermissionBuilderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreateRole,
  onProvisionAllTemplates
}) => {
  // Mode: 'BLANK' (Brand New Custom Role) vs 'TEMPLATE' (Pick from 8 Pre-Built Templates)
  const [mode, setMode] = useState<'BLANK' | 'TEMPLATE'>('BLANK');

  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [description, setDescription] = useState('');
  const [scopeType, setScopeType] = useState<SecurityRoleDto['scopeType']>('PARTNER');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Granular Permission Checklist
  const [perms, setPerms] = useState<Record<string, boolean>>({
    readEmr: false,
    writeEmr: false,
    signPrescription: false,
    certifyNabl: false,
    radiologyPacs: false,
    manageBilling: false,
    refundPayments: false,
    pharmacyDispense: false,
    emergencyBreakGlass: false,
    exportAuditPhi: false,
    abdmSync: false,
    manageUsers: false
  });

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setRoleName(name);
    if (!roleCode || roleCode === roleName.toUpperCase().replace(/[^A-Z0-9]/g, '_')) {
      setRoleCode(name.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
    }
  };

  const handleSelectTemplate = (tpl: RoleTemplatePreset) => {
    setSelectedTemplateId(tpl.id);
    setRoleName(tpl.name);
    setRoleCode(tpl.code);
    setDescription(tpl.description);
    setScopeType(tpl.scopeType);
    setPerms({
      ...perms,
      ...tpl.perms
    });
  };

  const handleSelectAllPerms = () => {
    const updated: Record<string, boolean> = {};
    Object.keys(perms).forEach((k) => {
      updated[k] = true;
    });
    setPerms(updated);
  };

  const handleClearAllPerms = () => {
    const updated: Record<string, boolean> = {};
    Object.keys(perms).forEach((k) => {
      updated[k] = false;
    });
    setPerms(updated);
  };

  const handleProvisionAll = () => {
    if (!onProvisionAllTemplates) return;
    const allRoles: SecurityRoleDto[] = ROLE_PRESET_TEMPLATES.map((tpl) => ({
      id: `00000000-0000-0000-0000-${String(Math.floor(100000000000 + Math.random() * 900000000000))}`,
      roleCode: tpl.code,
      roleName: tpl.name,
      description: tpl.description,
      roleType: 'CUSTOM',
      scopeType: tpl.scopeType,
      status: 'ACTIVE',
      isSystemRole: false,
      userCount: 0,
      permissionCount: Object.values(tpl.perms).filter(Boolean).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    onProvisionAllTemplates(allRoles);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeCount = Object.values(perms).filter(Boolean).length;
    const finalRoleName = roleName.trim() || 'Custom Healthcare Staff Role';
    const finalRoleCode = (roleCode.trim() || finalRoleName).toUpperCase().replace(/[^A-Z0-9]/g, '_');

    const created: SecurityRoleDto = {
      id: `00000000-0000-0000-0000-${String(Math.floor(100000000000 + Math.random() * 900000000000))}`,
      roleCode: finalRoleCode,
      roleName: finalRoleName,
      description: description.trim() || 'Custom facility role with tailored clinical and administrative privileges.',
      roleType: 'CUSTOM',
      scopeType: scopeType,
      status: 'ACTIVE',
      isSystemRole: false,
      userCount: 0,
      permissionCount: activeCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onCreateRole(created);
    onClose();
  };

  const activePermsCount = Object.values(perms).filter(Boolean).length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.88)',
      backdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(6, 182, 212, 0.5)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '740px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '26px',
        boxShadow: '0 25px 75px rgba(0,0,0,0.95)'
      }}>
        {/* Modal Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8' }}>
              🛡️ RBAC Custom Role & Permission Builder
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Create a brand new custom role from scratch OR pick from standard healthcare templates
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Switch (Blank Custom vs Template) */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', backgroundColor: '#1E293B', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setMode('BLANK')}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: mode === 'BLANK' ? '#06B6D4' : 'transparent',
              color: mode === 'BLANK' ? '#070C16' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ✍️ Create Brand New Role (From Scratch)
          </button>

          <button
            type="button"
            onClick={() => setMode('TEMPLATE')}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: mode === 'TEMPLATE' ? '#06B6D4' : 'transparent',
              color: mode === 'TEMPLATE' ? '#070C16' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📋 Pick From 8 Ready-Made Templates
          </button>
        </div>

        {/* TEMPLATE MODE ACCORDION */}
        {mode === 'TEMPLATE' && (
          <div style={{ marginBottom: '16px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 800, textTransform: 'uppercase' }}>
                ⚡ Click Any Template to Auto-Fill Role Privileges:
              </span>
              {onProvisionAllTemplates && (
                <button
                  type="button"
                  onClick={handleProvisionAll}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#070C16',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🚀 Bulk Provision All 8 Templates
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
              {ROLE_PRESET_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.2)' : '#1E293B',
                      border: `1.5px solid ${isSelected ? '#06B6D4' : '#334155'}`,
                      borderRadius: '8px',
                      padding: '8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#FFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <div style={{ fontSize: '1rem' }}>{tpl.icon}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                      {tpl.name}
                    </span>
                    <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>
                      {Object.values(tpl.perms).filter(Boolean).length} permissions
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ROLE FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                ROLE DISPLAY NAME *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Radiologist & PACS Lead"
                value={roleName}
                onChange={(e) => handleNameChange(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                ROLE CODE / SLUG *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SENIOR_RADIOLOGIST"
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'))}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                DESCRIPTION & CLINICAL PURPOSE *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Reviews MRI/CT scans, writes radiological impressions, signs PACS reports."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                SCOPE BOUNDARY LEVEL
              </label>
              <select
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value as any)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              >
                <option value="PARTNER">Partner Facility Level (Hospitals & Labs)</option>
                <option value="BRANCH">Specific Branch / Department Only</option>
                <option value="PLATFORM">Platform-Wide Global Scope</option>
                <option value="COMPANY">Internal Company Scope</option>
              </select>
            </div>
          </div>

          {/* Granular Permissions Section */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                🔑 Granular Permissions Granted ({activePermsCount} Active):
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleSelectAllPerms}
                  style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#38BDF8', border: '1px solid #06B6D4', borderRadius: '4px', padding: '2px 8px', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✓ Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAllPerms}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.6875rem', cursor: 'pointer' }}
                >
                  ✗ Clear All
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
              {[
                { id: 'readEmr', label: '📖 Read Clinical EMR Records' },
                { id: 'writeEmr', label: '✍️ Create/Update Consultations' },
                { id: 'signPrescription', label: '🩺 Sign Digital Doctor Rx' },
                { id: 'certifyNabl', label: '🧪 Approve NABL Lab Reports' },
                { id: 'radiologyPacs', label: '🩻 View & Sign PACS Radiology' },
                { id: 'manageBilling', label: '💳 Generate GST Invoices & Bills' },
                { id: 'refundPayments', label: '💸 Process Billing Refunds' },
                { id: 'pharmacyDispense', label: '💊 Dispense Pharmacy Drugs' },
                { id: 'emergencyBreakGlass', label: '🚨 Emergency ICU Break-Glass' },
                { id: 'exportAuditPhi', label: '📑 Export PHI & Audit Logs' },
                { id: 'abdmSync', label: '⚡ Sync ABDM Care Contexts' },
                { id: 'manageUsers', label: '👥 Manage Staff & User Roles' }
              ].map((p) => {
                const isChecked = !!perms[p.id];
                return (
                  <div
                    key={p.id}
                    onClick={() => setPerms({ ...perms, [p.id]: !isChecked })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: isChecked ? 'rgba(6, 182, 212, 0.15)' : '#0F172A',
                      border: `1px solid ${isChecked ? '#06B6D4' : '#334155'}`,
                      borderRadius: '6px',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div
                      style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <label style={{ color: isChecked ? '#FFF' : '#CBD5E1', cursor: 'pointer', fontSize: '0.75rem', fontWeight: isChecked ? 700 : 400 }}>
                      {p.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: '#06B6D4',
                color: '#070C16',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 22px',
                fontWeight: 900,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)'
              }}
            >
              ✓ Create & Save Custom Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
