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
    perms: { readEmr: true, writeEmr: true, signPrescription: true, certifyNabl: true, manageBilling: false, refundPayments: false, exportAuditPhi: true, abdmSync: true, manageUsers: true }
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
    perms: { readEmr: true, writeEmr: true, signPrescription: false, certifyNabl: false, manageBilling: false, refundPayments: false, exportAuditPhi: false, abdmSync: false, manageUsers: false }
  },
  {
    id: 'TPL-5',
    name: 'Chief Pharmacist & Drug Dispenser',
    code: 'CHIEF_PHARMACIST',
    icon: '💊',
    scopeType: 'PARTNER',
    description: 'Dispenses prescribed medications, verifies batch numbers, tracks narcotic schedules, and manages pharmacy bills.',
    perms: { readEmr: true, writeEmr: false, signPrescription: false, certifyNabl: false, manageBilling: true, refundPayments: false, exportAuditPhi: false, abdmSync: false, manageUsers: false }
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
  const defaultTpl = ROLE_PRESET_TEMPLATES[0]!;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTpl.id);
  const [roleName, setRoleName] = useState(defaultTpl.name);
  const [roleCode, setRoleCode] = useState(defaultTpl.code);
  const [description, setDescription] = useState(defaultTpl.description);
  const [scopeType, setScopeType] = useState<SecurityRoleDto['scopeType']>(defaultTpl.scopeType);
  
  // Granular Permission Checklist
  const [perms, setPerms] = useState(defaultTpl.perms);

  if (!isOpen) return null;

  const handleSelectTemplate = (tpl: RoleTemplatePreset) => {
    setSelectedTemplateId(tpl.id);
    setRoleName(tpl.name);
    setRoleCode(tpl.code);
    setDescription(tpl.description);
    setScopeType(tpl.scopeType);
    setPerms(tpl.perms);
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
    const created: SecurityRoleDto = {
      id: `00000000-0000-0000-0000-${String(Math.floor(100000000000 + Math.random() * 900000000000))}`,
      roleCode: roleCode.toUpperCase().replace(/\s+/g, '_'),
      roleName: roleName,
      description,
      roleType: 'CUSTOM',
      scopeType: scopeType,
      status: 'ACTIVE',
      isSystemRole: false,
      userCount: 0,
      permissionCount: Object.values(perms).filter(Boolean).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onCreateRole(created);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.85)',
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
        border: '1.5px solid rgba(6, 182, 212, 0.4)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 25px 70px rgba(0,0,0,0.95)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 800, color: '#38BDF8' }}>
              👥 Pre-Templated Healthcare Role & Permission Builder
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Pick a ready-made clinical/administrative role template or customize granular access
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.125rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* 1-Click Role Template Selector Grid */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 800, textTransform: 'uppercase' }}>
              ⚡ 1-Click Pre-Built Healthcare Role Templates (Click to apply):
            </label>
            {onProvisionAllTemplates && (
              <button
                type="button"
                onClick={handleProvisionAll}
                style={{
                  backgroundColor: '#10B981',
                  color: '#070C16',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                🚀 Provision All 8 Templates
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
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '1.1rem' }}>{tpl.icon}</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                    {tpl.name}
                  </span>
                  <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>
                    {Object.values(tpl.perms).filter(Boolean).length} perms granted
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customization Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>ROLE DISPLAY NAME *</label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>ROLE CODE / SLUG *</label>
              <input
                type="text"
                required
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>DESCRIPTION & CLINICAL SCOPE *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
            />
          </div>

          {/* Granular Permission Checklist */}
          <div>
            <span style={{ display: 'block', color: '#38BDF8', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
              Granular Role Privileges ({Object.values(perms).filter(Boolean).length} Granted):
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
              {[
                { id: 'readEmr', label: '📖 Read Clinical EMR Records' },
                { id: 'writeEmr', label: '✍️ Create/Update EMR Consultations' },
                { id: 'signPrescription', label: '🩺 Sign Digital Prescriptions (Rx)' },
                { id: 'certifyNabl', label: '🧪 Approve NABL Pathology Reports' },
                { id: 'manageBilling', label: '💳 Generate GST Invoices & Bills' },
                { id: 'refundPayments', label: '💸 Process Patient Billing Refunds' },
                { id: 'exportAuditPhi', label: '📑 Export PHI & Audit Logs' },
                { id: 'abdmSync', label: '⚡ Sync ABDM Care Contexts & ABHA' },
                { id: 'manageUsers', label: '👥 Manage Hospital Staff Accounts' }
              ].map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id={p.id}
                    checked={perms[p.id as keyof typeof perms]}
                    onChange={(e) => setPerms({ ...perms, [p.id]: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor={p.id} style={{ color: '#E2E8F0', cursor: 'pointer', fontSize: '0.75rem' }}>
                    {p.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 800, cursor: 'pointer' }}
            >
              ✓ Save & Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
