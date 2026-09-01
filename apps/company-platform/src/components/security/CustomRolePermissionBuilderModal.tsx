import React, { useState } from 'react';
import type { SecurityRoleDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateRole: (newRole: SecurityRoleDto) => void;
}

export const CustomRolePermissionBuilderModal: React.FC<Props> = ({ isOpen, onClose, onCreateRole }) => {
  const [roleName, setRoleName] = useState('Chief Medical Officer & Compliance Lead');
  const [roleCode, setRoleCode] = useState('CHIEF_MEDICAL_OFFICER');
  const [description, setDescription] = useState('Executive clinical director with full EMR oversight and prescription sign-off.');
  
  // Granular Permission Checklist
  const [perms, setPerms] = useState({
    readEmr: true,
    writeEmr: true,
    signPrescription: true,
    certifyNabl: true,
    manageBilling: false,
    refundPayments: false,
    exportAuditPhi: true,
    abdmSync: true,
    manageUsers: true
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: SecurityRoleDto = {
      id: `00000000-0000-0000-0000-${String(Math.floor(100000000000 + Math.random() * 900000000000))}`,
      roleCode: roleCode.toUpperCase().replace(/\s+/g, '_'),
      roleName: roleName,
      description,
      roleType: 'CUSTOM',
      scopeType: 'PARTNER',
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
        maxWidth: '620px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 25px 70px rgba(0,0,0,0.95)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8' }}>
            👥 Custom Hospital Role & Granular Permission Builder
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.125rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>DESCRIPTION & SCOPE *</label>
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
            <span style={{ display: 'block', color: '#38BDF8', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}>
              Select Granted Permissions ({Object.values(perms).filter(Boolean).length} Active):
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#1E293B', padding: '14px', borderRadius: '8px' }}>
              {[
                { id: 'readEmr', label: '📖 Read Clinical EMR Records' },
                { id: 'writeEmr', label: '✍️ Create/Update EMR Consultations' },
                { id: 'signPrescription', label: '🩺 Sign Digital Doctor Prescriptions (Rx)' },
                { id: 'certifyNabl', label: '🧪 Approve NABL Pathology Reports' },
                { id: 'manageBilling', label: '💳 Generate GST Invoices & Bills' },
                { id: 'refundPayments', label: '💸 Process Patient Billing Refunds' },
                { id: 'exportAuditPhi', label: '📑 Export PHI & Compliance Audit Logs' },
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
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
              ✓ Create Custom Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
