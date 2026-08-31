import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface RoleAddonConfig {
  jitAccessEnabled: boolean;
  jitDurationHours: number;
  geoFencingEnabled: boolean;
  assignedTerritoryZone: string;
  allowedRadiusKm: number;
  maxDiscountAllowedInr: number;
  maxPayoutApprovalLimitInr: number;
  shiftWindowEnabled: boolean;
  allowedShiftHours: string;
  piiMaskingLevel: 'FULL_MASKED' | 'PARTIAL_MASKED' | 'UNMASKED_AUTHORIZED';
  deviceBindingRequired: boolean;
  biometricMfaRequired: boolean;
  dualAuthRequired: boolean;
  dualAuthThresholdInr: number;
}

export interface CompanyRoleTemplate {
  id: string;
  roleCode: string;
  roleTitle: string;
  department: 'EXECUTIVE' | 'SALES' | 'FINANCE' | 'SUPPORT' | 'CLINICAL_AI' | 'ENGINEERING' | 'SECURITY';
  badge: string;
  icon: string;
  summary: string;
  accessibleModules: string[];
  restrictedModules: string[];
  dataScope: 'GLOBAL' | 'TERRITORY_OWN' | 'FINANCIAL_ONLY' | 'TICKETS_ONLY' | 'LOGS_ONLY';
  activeEmployeesCount: number;
  sampleEmployee: string;
  addons: RoleAddonConfig;
}

export const ALL_SYSTEM_MODULES = [
  '👑 Growth Engine & Plan Customizer',
  '📍 Today Route & Clinic Visit Planner',
  '🎬 1-Click Interactive Doctor Demo Studio',
  '✍️ 2-Minute Instant Doctor Onboarding Form',
  '💰 Doctor Income & ROI Calculator',
  '🏆 Own Earned Incentive & Target Wallet',
  '📈 Enterprise Sales Pipeline & CRM',
  '🏢 Partner Healthcare Onboarding',
  '💳 Subscription & Billing Finance',
  '💸 Doctor / Lab / Pharma Settlement Gateway',
  '🧾 GST Tax Invoicing & Ledger',
  '🎧 Partner Support Desk & Ticket Escalations',
  '📊 Hospital Platform Telemetry & Health',
  '🤖 AI Model Registry & Clinical CDSS',
  '🎙️ Voice Scribe Accuracy & Prompt Safety',
  '🛡️ Medical Safety & Lethal DDI Policies',
  '☁️ Kubernetes Infrastructure & Clusters',
  '⚡ API Gateway Telemetry & WebSockets',
  '🔐 Security Audit Vaults & SHA-256 Trails',
  '👥 Employee RBAC Roles & Session Revocation'
];

export const CompanyRoleAccessMatrixTemplate: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const [roles, setRoles] = useState<CompanyRoleTemplate[]>([
    {
      id: 'ROLE-01',
      roleCode: 'SUPER_ADMIN_FOUNDER',
      roleTitle: 'Founder & SuperAdmin (CEO / CTO)',
      department: 'EXECUTIVE',
      badge: 'Unrestricted Master Access',
      icon: '👑',
      summary: 'Full global governance across SaaS pricing, financial settlements, city broadcasts, security vaults, and multi-tenant architectures.',
      accessibleModules: [
        '👑 Growth Engine & Plan Customizer',
        '💳 Subscription & Billing Finance',
        '💸 Doctor / Lab / Pharma Settlement Gateway',
        '📈 Enterprise Sales Pipeline & CRM',
        '🤖 AI Model Registry & Clinical CDSS',
        '☁️ Kubernetes Infrastructure & Clusters',
        '🔐 Security Audit Vaults & SHA-256 Trails'
      ],
      restrictedModules: ['None (Global Master Privileges)'],
      dataScope: 'GLOBAL',
      activeEmployeesCount: 2,
      sampleEmployee: 'Dr. Alok Sharma (Founder & CEO)',
      addons: {
        jitAccessEnabled: false,
        jitDurationHours: 0,
        geoFencingEnabled: false,
        assignedTerritoryZone: 'Global All Territories',
        allowedRadiusKm: 0,
        maxDiscountAllowedInr: 999999,
        maxPayoutApprovalLimitInr: 10000000,
        shiftWindowEnabled: false,
        allowedShiftHours: '24x7 Global Access',
        piiMaskingLevel: 'UNMASKED_AUTHORIZED',
        deviceBindingRequired: true,
        biometricMfaRequired: true,
        dualAuthRequired: false,
        dualAuthThresholdInr: 500000
      }
    },
    {
      id: 'ROLE-02',
      roleCode: 'FIELD_SALES_REP',
      roleTitle: 'Field Sales Representative (e.g. Motu)',
      department: 'SALES',
      badge: 'Mobile & Doctor Demo Mode',
      icon: '📱',
      summary: 'Optimized for mobile field visits. Includes Clinic Route Planner, Interactive Voice Scribe Doctor Demo Sandbox, 2-Min Doctor Onboarding, and personal commission tracking.',
      accessibleModules: [
        '📍 Today Route & Clinic Visit Planner',
        '🎬 1-Click Interactive Doctor Demo Studio',
        '✍️ 2-Minute Instant Doctor Onboarding Form',
        '💰 Doctor Income & ROI Calculator',
        '🏆 Own Earned Incentive & Target Wallet'
      ],
      restrictedModules: [
        '💳 Subscription & Billing Finance',
        '💸 Doctor / Lab / Pharma Settlement Gateway',
        '☁️ Kubernetes Infrastructure & Clusters',
        '🔐 Security Audit Vaults & SHA-256 Trails'
      ],
      dataScope: 'TERRITORY_OWN',
      activeEmployeesCount: 18,
      sampleEmployee: 'Motu Sharma (South Delhi & Noida Territory)',
      addons: {
        jitAccessEnabled: true,
        jitDurationHours: 4,
        geoFencingEnabled: true,
        assignedTerritoryZone: 'South Delhi & Noida (15km Radius)',
        allowedRadiusKm: 15,
        maxDiscountAllowedInr: 100,
        maxPayoutApprovalLimitInr: 0,
        shiftWindowEnabled: true,
        allowedShiftHours: '08:00 AM - 08:00 PM (Mon-Sat)',
        piiMaskingLevel: 'PARTIAL_MASKED',
        deviceBindingRequired: true,
        biometricMfaRequired: true,
        dualAuthRequired: false,
        dualAuthThresholdInr: 0
      }
    },
    {
      id: 'ROLE-03',
      roleCode: 'FINANCE_CONTROLLER',
      roleTitle: 'Finance & Accounts Controller (CFO/Billing)',
      department: 'FINANCE',
      badge: 'Settlements & Invoicing',
      icon: '💰',
      summary: 'Manages hospital subscription invoices, partner Doctor & Lab claim settlements, GST/TDS tax records, and payment gateway reconciliation.',
      accessibleModules: [
        '💳 Subscription & Billing Finance',
        '💸 Doctor / Lab / Pharma Settlement Gateway',
        '🧾 GST Tax Invoicing & Ledger'
      ],
      restrictedModules: [
        '🤖 AI Model Registry & Clinical CDSS',
        '☁️ Kubernetes Infrastructure & Clusters'
      ],
      dataScope: 'FINANCIAL_ONLY',
      activeEmployeesCount: 3,
      sampleEmployee: 'Ananya Singhania (Head of Finance)',
      addons: {
        jitAccessEnabled: false,
        jitDurationHours: 0,
        geoFencingEnabled: true,
        assignedTerritoryZone: 'Corporate Headquarters Office IP',
        allowedRadiusKm: 1,
        maxDiscountAllowedInr: 500,
        maxPayoutApprovalLimitInr: 50000,
        shiftWindowEnabled: true,
        allowedShiftHours: '09:00 AM - 07:00 PM (Mon-Fri)',
        piiMaskingLevel: 'PARTIAL_MASKED',
        deviceBindingRequired: true,
        biometricMfaRequired: true,
        dualAuthRequired: true,
        dualAuthThresholdInr: 50000
      }
    }
  ]);

  const [selectedRoleId, setSelectedRoleId] = useState<string>('ROLE-02');
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0]!;

  const [editingRole, setEditingRole] = useState<CompanyRoleTemplate | null>(null);
  const [isPublishSuccess, setIsPublishSuccess] = useState(false);

  const filteredRoles = selectedDept === 'ALL'
    ? roles
    : roles.filter((r) => r.department === selectedDept);

  const handleOpenEdit = (role: CompanyRoleTemplate) => {
    setEditingRole({
      ...role,
      accessibleModules: [...role.accessibleModules],
      addons: { ...role.addons }
    });
  };

  const handleToggleModuleInEdit = (mod: string) => {
    if (!editingRole) return;
    const exists = editingRole.accessibleModules.includes(mod);
    const updatedModules = exists
      ? editingRole.accessibleModules.filter((m) => m !== mod)
      : [...editingRole.accessibleModules, mod];

    const updatedRestricted = ALL_SYSTEM_MODULES.filter((m) => !updatedModules.includes(m));
    setEditingRole({
      ...editingRole,
      accessibleModules: updatedModules,
      restrictedModules: updatedRestricted
    });
  };

  const handleSaveEdit = () => {
    if (!editingRole) return;
    setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? editingRole : r)));
    setEditingRole(null);
    setIsPublishSuccess(true);
    setTimeout(() => setIsPublishSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.75rem' }}>🛡️</span>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              Company Role & 7 Advanced Security Add-ons Studio
            </h2>
            <Badge variant="primary">Enterprise RBAC 3.0</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
            Centrally manage the 7 Advanced Governance Add-ons: JIT Access, Geo-Fencing, Spending Limits, Shift Windows, PII Masking, Device Binding & Multi-Sig Sign-off.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => handleOpenEdit(selectedRole)}
          style={{ fontWeight: 800, backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16' }}
        >
          ⚙️ Customize Add-ons for {selectedRole.roleTitle.split('(')[0]}
        </Button>
      </div>

      {/* Live Sync Banner */}
      {isPublishSuccess && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✓</span> All 7 Security Add-on policies updated & enforced live across all employee session tokens!
        </div>
      )}

      {/* Department Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'ALL', label: `All ${roles.length} Roles` },
          { id: 'SALES', label: '💼 Sales & Field Reps (Motu)' },
          { id: 'EXECUTIVE', label: '👑 Founders & Leadership' },
          { id: 'FINANCE', label: '💰 Finance & Accounts' },
          { id: 'SUPPORT', label: '🎧 Customer Support' },
          { id: 'CLINICAL_AI', label: '🤖 AI & Clinical Safety' },
          { id: 'ENGINEERING', label: '⚙️ Platform & DevOps' },
          { id: 'SECURITY', label: '🛡️ Security & DPO' }
        ].map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDept(d.id)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: selectedDept === d.id ? '#06B6D4' : 'rgba(30, 41, 59, 0.6)',
              color: selectedDept === d.id ? '#070C16' : '#CBD5E1',
              fontSize: '0.8125rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Left: Role Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredRoles.map((r) => {
            const isSelected = selectedRole.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                style={{
                  backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.75)',
                  border: isSelected ? '2px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 10px 30px rgba(6, 182, 212, 0.2)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{r.icon}</span>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                      {r.roleTitle}
                    </span>
                  </div>
                  <Badge variant={isSelected ? 'primary' : 'neutral'}>{r.badge}</Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: '1.4', marginBottom: '8px' }}>
                  {r.summary}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.625rem', backgroundColor: r.addons.geoFencingEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: r.addons.geoFencingEnabled ? '#34D399' : '#64748B', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    📍 Geo-Fence: {r.addons.geoFencingEnabled ? 'ON' : 'OFF'}
                  </span>
                  <span style={{ fontSize: '0.625rem', backgroundColor: r.addons.shiftWindowEnabled ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)', color: r.addons.shiftWindowEnabled ? '#38BDF8' : '#64748B', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    🕒 Shift Lock: {r.addons.shiftWindowEnabled ? 'ON' : 'OFF'}
                  </span>
                  <span style={{ fontSize: '0.625rem', backgroundColor: r.addons.dualAuthRequired ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.05)', color: r.addons.dualAuthRequired ? '#FCD34D' : '#64748B', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    👥 Multi-Sig: {r.addons.dualAuthRequired ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed 7 Add-ons Configuration HUD */}
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>{selectedRole.icon}</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                  {selectedRole.roleTitle}
                </h3>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, marginTop: '2px' }}>
                Assigned: {selectedRole.sampleEmployee}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(selectedRole)}
              style={{ fontWeight: 700, borderColor: '#38BDF8', color: '#38BDF8' }}
            >
              ✏️ Edit All 7 Add-ons
            </Button>
          </div>

          {/* 7 Add-ons Active Rules HUD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#FCD34D', textTransform: 'uppercase' }}>
              🛡️ Active Security Add-on Rules:
            </span>

            {/* 1. JIT Access */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>⏱️ 1. Temporary JIT Access</strong>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Time-bound auto-expiring emergency permissions</div>
              </div>
              <Badge variant={selectedRole.addons.jitAccessEnabled ? 'warning' : 'neutral'}>
                {selectedRole.addons.jitAccessEnabled ? `${selectedRole.addons.jitDurationHours}h Auto-Expire` : 'Disabled'}
              </Badge>
            </div>

            {/* 2. Geo-Fencing */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>📍 2. Geo-Fencing & GPS Lock</strong>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{selectedRole.addons.assignedTerritoryZone}</div>
              </div>
              <Badge variant={selectedRole.addons.geoFencingEnabled ? 'success' : 'neutral'}>
                {selectedRole.addons.geoFencingEnabled ? `Locked (${selectedRole.addons.allowedRadiusKm}km)` : 'Any Location'}
              </Badge>
            </div>

            {/* 3. Financial Limits */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>💰 3. Financial Approval Limits</strong>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Max Discount: ₹{selectedRole.addons.maxDiscountAllowedInr} • Max Payout: ₹{selectedRole.addons.maxPayoutApprovalLimitInr.toLocaleString('en-IN')}</div>
              </div>
              <span style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 800, fontFamily: 'monospace' }}>
                ₹{selectedRole.addons.maxDiscountAllowedInr} Limit
              </span>
            </div>

            {/* 4. Shift Access */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>🕒 4. Working Hours Shift Window</strong>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{selectedRole.addons.allowedShiftHours}</div>
              </div>
              <Badge variant={selectedRole.addons.shiftWindowEnabled ? 'primary' : 'neutral'}>
                {selectedRole.addons.shiftWindowEnabled ? 'Enforced' : '24x7'}
              </Badge>
            </div>

            {/* 5. PII Masking */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>👁️ 5. PII Data Masking Level</strong>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Redacts Doctor Bank Accounts & PAN cards</div>
              </div>
              <Badge variant={selectedRole.addons.piiMaskingLevel === 'PARTIAL_MASKED' ? 'warning' : 'success'}>
                {selectedRole.addons.piiMaskingLevel}
              </Badge>
            </div>

            {/* 6. Device Binding */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>📱 6. Device Binding & Biometric MFA</strong>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Requires registered tablet & Fingerprint scan</div>
              </div>
              <Badge variant={selectedRole.addons.deviceBindingRequired ? 'success' : 'neutral'}>
                {selectedRole.addons.deviceBindingRequired ? 'Device Locked' : 'Any Device'}
              </Badge>
            </div>

            {/* 7. Dual Authorization */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>👥 7. Dual-Authorization (Four-Eyes)</strong>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Requires 2 officers to approve actions above ₹{selectedRole.addons.dualAuthThresholdInr.toLocaleString('en-IN')}</div>
              </div>
              <Badge variant={selectedRole.addons.dualAuthRequired ? 'warning' : 'neutral'}>
                {selectedRole.addons.dualAuthRequired ? 'Multi-Sig Required' : 'Single Sign'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Role & 7 Add-ons Modal */}
      {editingRole && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '2px solid #06B6D4',
            borderRadius: '20px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                ⚙️ Configure 7 Security Add-ons: {editingRole.roleTitle}
              </h2>
              <button
                onClick={() => setEditingRole(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Form Fields for 7 Add-ons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.8125rem' }}>
              {/* 1. JIT */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#FCD34D' }}>
                  <input
                    type="checkbox"
                    checked={editingRole.addons.jitAccessEnabled}
                    onChange={(e) => setEditingRole({
                      ...editingRole,
                      addons: { ...editingRole.addons, jitAccessEnabled: e.target.checked }
                    })}
                  />
                  ⏱️ 1. Temporary JIT Access
                </label>
                <div style={{ marginTop: '6px' }}>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>AUTO-EXPIRE AFTER (HOURS):</label>
                  <input
                    type="number"
                    value={editingRole.addons.jitDurationHours}
                    onChange={(e) => setEditingRole({
                      ...editingRole,
                      addons: { ...editingRole.addons, jitDurationHours: Number(e.target.value) }
                    })}
                    style={{ width: '100%', padding: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#FFF' }}
                  />
                </div>
              </div>

              {/* 2. Geo-Fence */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#34D399' }}>
                  <input
                    type="checkbox"
                    checked={editingRole.addons.geoFencingEnabled}
                    onChange={(e) => setEditingRole({
                      ...editingRole,
                      addons: { ...editingRole.addons, geoFencingEnabled: e.target.checked }
                    })}
                  />
                  📍 2. Geo-Fencing GPS Lock
                </label>
                <div style={{ marginTop: '6px' }}>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>ALLOWED RADIUS (KM):</label>
                  <input
                    type="number"
                    value={editingRole.addons.allowedRadiusKm}
                    onChange={(e) => setEditingRole({
                      ...editingRole,
                      addons: { ...editingRole.addons, allowedRadiusKm: Number(e.target.value) }
                    })}
                    style={{ width: '100%', padding: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#FFF' }}
                  />
                </div>
              </div>

              {/* 3. Financial Limit */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px' }}>
                <strong style={{ color: '#38BDF8' }}>💰 3. Financial Discount Limit</strong>
                <div style={{ marginTop: '6px' }}>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>MAX DISCOUNT ON PASS (₹):</label>
                  <input
                    type="number"
                    value={editingRole.addons.maxDiscountAllowedInr}
                    onChange={(e) => setEditingRole({
                      ...editingRole,
                      addons: { ...editingRole.addons, maxDiscountAllowedInr: Number(e.target.value) }
                    })}
                    style={{ width: '100%', padding: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#FFF' }}
                  />
                </div>
              </div>

              {/* 4. Shift Window */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#C084FC' }}>
                  <input
                    type="checkbox"
                    checked={editingRole.addons.shiftWindowEnabled}
                    onChange={(e) => setEditingRole({
                      ...editingRole,
                      addons: { ...editingRole.addons, shiftWindowEnabled: e.target.checked }
                    })}
                  />
                  🕒 4. Shift Working Hours Lock
                </label>
                <div style={{ marginTop: '6px' }}>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>ALLOWED SHIFT WINDOW:</label>
                  <input
                    type="text"
                    value={editingRole.addons.allowedShiftHours}
                    onChange={(e) => setEditingRole({
                      ...editingRole,
                      addons: { ...editingRole.addons, allowedShiftHours: e.target.value }
                    })}
                    style={{ width: '100%', padding: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#FFF' }}
                  />
                </div>
              </div>
            </div>

            {/* Granular Module Checkboxes */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Toggle Module Permissions (Check to Enable):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '160px', overflowY: 'auto', paddingRight: '8px' }}>
                {ALL_SYSTEM_MODULES.map((mod) => {
                  const isChecked = editingRole.accessibleModules.includes(mod);
                  return (
                    <label
                      key={mod}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                        border: isChecked ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.06)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                        color: isChecked ? '#FFF' : '#94A3B8'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleModuleInEdit(mod)}
                      />
                      <span>{mod}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Checkbox Toggles for 5, 6, 7 */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#CBD5E1', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingRole.addons.deviceBindingRequired}
                  onChange={(e) => setEditingRole({
                    ...editingRole,
                    addons: { ...editingRole.addons, deviceBindingRequired: e.target.checked }
                  })}
                />
                📱 6. Lock to Single Registered Tablet
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingRole.addons.biometricMfaRequired}
                  onChange={(e) => setEditingRole({
                    ...editingRole,
                    addons: { ...editingRole.addons, biometricMfaRequired: e.target.checked }
                  })}
                />
                🔐 Mandatory Biometric Fingerprint MFA
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingRole.addons.dualAuthRequired}
                  onChange={(e) => setEditingRole({
                    ...editingRole,
                    addons: { ...editingRole.addons, dualAuthRequired: e.target.checked }
                  })}
                />
                👥 7. Dual Multi-Sig Sign-off Required
              </label>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
              <Button variant="outline" size="md" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveEdit}
                style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}
              >
                💾 Save & Apply 7 Security Add-ons
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};