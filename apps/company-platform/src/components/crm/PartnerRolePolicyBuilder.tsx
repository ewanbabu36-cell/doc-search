import React, { useState, useEffect } from 'react';

export interface PermissionPackDto {
  code: string;
  name: string;
  category: string;
  permissions: string[];
}

export interface AccessPolicyDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  effect: 'ALLOW' | 'DENY';
  priority: number;
  conditions: any[];
  actions: string[];
  timeWindow?: {
    startTime: string;
    endTime: string;
    daysOfWeek?: number[];
  };
  status: string;
}

export interface PartnerRolePolicyBuilderProps {
  partnerId: string;
  partnerName: string;
  onClose: () => void;
  onSaved?: () => void;
}

export const PartnerRolePolicyBuilder: React.FC<PartnerRolePolicyBuilderProps> = ({
  partnerId,
  partnerName,
  onClose,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState<'CUSTOM_ROLES' | 'PERMISSION_PACKS' | 'CONDITIONAL_POLICIES'>('CUSTOM_ROLES');
  const [packs, setPacks] = useState<PermissionPackDto[]>([]);
  const [policies, setPolicies] = useState<AccessPolicyDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // New Role Form State
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPackCodes, setSelectedPackCodes] = useState<Set<string>>(new Set());
  const [creatingRole, setCreatingRole] = useState(false);

  // New Policy Form State
  const [policyCode, setPolicyCode] = useState('');
  const [policyName, setPolicyName] = useState('');
  const [policyDescription, setPolicyDescription] = useState('');
  const [policyEffect, setPolicyEffect] = useState<'ALLOW' | 'DENY'>('DENY');
  const [policyPriority, setPolicyPriority] = useState<number>(150);
  const [policyActions, setPolicyActions] = useState<string>('clinical:record:edit');
  const [policyRoleCondition, setPolicyRoleCondition] = useState<string>('');
  const [policyDepartmentCondition, setPolicyDepartmentCondition] = useState<string>('');
  const [policyTimeStart, setPolicyTimeStart] = useState<string>('');
  const [policyTimeEnd, setPolicyTimeEnd] = useState<string>('');
  const [creatingPolicy, setCreatingPolicy] = useState(false);

  // Load Packs & Existing Policies
  const loadData = async () => {
    setLoading(true);
    try {
      const [packRes, polRes] = await Promise.all([
        fetch('/api/v1/company/permission-packs'),
        fetch(`/api/v1/company/partners/${partnerId}/policies`)
      ]);

      if (packRes.ok) {
        const pData = await packRes.json();
        setPacks(pData.data || []);
      }
      if (polRes.ok) {
        const polData = await polRes.json();
        setPolicies(polData.data || []);
      }
    } catch (e) {
      console.error('Failed to load role/policy data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [partnerId]);

  // Handle Custom Role Creation
  const handleCreateRole = async () => {
    if (!roleName.trim() || !roleCode.trim()) return;
    setCreatingRole(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/v1/company/partners/${partnerId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName.trim(),
          code: roleCode.trim().toUpperCase(),
          description: roleDescription.trim(),
          permissionPackCodes: Array.from(selectedPackCodes)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: data.message || `Role ${roleName} created successfully!` });
        setRoleName('');
        setRoleCode('');
        setRoleDescription('');
        setSelectedPackCodes(new Set());
        if (onSaved) onSaved();
      } else {
        setStatusMsg({ type: 'ERROR', text: data.message || data.error?.message || 'Failed to create custom role.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'ERROR', text: e.message });
    } finally {
      setCreatingRole(false);
    }
  };

  // Handle Conditional Policy Creation
  const handleCreatePolicy = async () => {
    if (!policyCode.trim() || !policyName.trim()) return;
    setCreatingPolicy(true);
    setStatusMsg(null);

    const conditions: any[] = [];
    if (policyRoleCondition.trim()) {
      conditions.push({
        field: 'role',
        operator: 'IN',
        value: policyRoleCondition.split(',').map((s) => s.trim().toUpperCase())
      });
    }
    if (policyDepartmentCondition.trim()) {
      conditions.push({
        field: 'department',
        operator: 'EQUALS',
        value: policyDepartmentCondition.trim()
      });
    }

    const timeWindow =
      policyTimeStart && policyTimeEnd
        ? {
            startTime: policyTimeStart,
            endTime: policyTimeEnd
          }
        : null;

    try {
      const res = await fetch(`/api/v1/company/partners/${partnerId}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: policyCode.trim().toUpperCase(),
          name: policyName.trim(),
          description: policyDescription.trim(),
          effect: policyEffect,
          priority: policyPriority,
          conditions,
          actions: policyActions.split(',').map((s) => s.trim()),
          timeWindow
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: `Conditional policy "${policyName}" published successfully.` });
        setPolicyCode('');
        setPolicyName('');
        setPolicyDescription('');
        setPolicyTimeStart('');
        setPolicyTimeEnd('');
        await loadData();
        if (onSaved) onSaved();
      } else {
        setStatusMsg({ type: 'ERROR', text: data.message || data.error?.message || 'Failed to create policy.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'ERROR', text: e.message });
    } finally {
      setCreatingPolicy(false);
    }
  };

  const togglePack = (code: string) => {
    const next = new Set(selectedPackCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedPackCodes(next);
  };

  return (
    <div style={{
      backgroundColor: '#0F172A',
      border: '1px solid #334155',
      borderRadius: '16px',
      width: '100%',
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden'
    }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#090D1A'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>🛡️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
                Role & Policy Engine: {partnerName}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Custom Roles, Reusable Permission Packs & Conditional Shift Policies with Deterministic Evaluation
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Tab Header */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 24px',
          borderBottom: '1px solid #1E293B',
          backgroundColor: '#0B1120'
        }}>
          {[
            { key: 'CUSTOM_ROLES', label: '👤 Custom Role Builder', icon: '👤' },
            { key: 'PERMISSION_PACKS', label: '📦 Permission Packs Catalog', icon: '📦' },
            { key: 'CONDITIONAL_POLICIES', label: '⏱️ Conditional Policies (Shift & Time)', icon: '⏱️' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                backgroundColor: activeTab === tab.key ? '#38BDF8' : 'transparent',
                color: activeTab === tab.key ? '#070C16' : '#94A3B8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div style={{
            margin: '14px 24px 0',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            backgroundColor: statusMsg.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: statusMsg.type === 'SUCCESS' ? '#34D399' : '#F87171',
            border: `1px solid ${statusMsg.type === 'SUCCESS' ? '#10B981' : '#EF4444'}`
          }}>
            {statusMsg.text}
          </div>
        )}

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>Loading security metadata...</div>
          ) : activeTab === 'CUSTOM_ROLES' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column: Role Details */}
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Create Custom Organization Role
                </h3>
                <p style={{ margin: '4px 0 16px', fontSize: '0.75rem', color: '#94A3B8' }}>
                  Define custom titles like &quot;Senior Reception Manager&quot; or &quot;Chief Pharmacist&quot;.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Role Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Reception Manager"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '4px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8125rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Role Code (Upper Snake Case)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SENIOR_RECEPTION_MANAGER"
                      value={roleCode}
                      onChange={(e) => setRoleCode(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '4px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8125rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Description
                    </label>
                    <textarea
                      placeholder="Operational responsibilities and scope..."
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        marginTop: '4px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8125rem'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleCreateRole}
                    disabled={creatingRole || !roleName.trim() || !roleCode.trim()}
                    style={{
                      backgroundColor: '#10B981',
                      color: '#070C16',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      cursor: creatingRole || !roleName.trim() || !roleCode.trim() ? 'not-allowed' : 'pointer',
                      opacity: creatingRole || !roleName.trim() || !roleCode.trim() ? 0.6 : 1,
                      marginTop: '8px'
                    }}
                  >
                    {creatingRole ? 'Provisioning...' : '💾 Save Custom Role'}
                  </button>
                </div>
              </div>

              {/* Right Column: Permission Packs Bundle Checklist */}
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Assign Permission Packs
                </h3>
                <p style={{ margin: '4px 0 16px', fontSize: '0.75rem', color: '#94A3B8' }}>
                  Check the bundles that this custom role inherits.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                  {packs.map((p) => {
                    const isChecked = selectedPackCodes.has(p.code);
                    return (
                      <div
                        key={p.code}
                        onClick={() => togglePack(p.code)}
                        style={{
                          backgroundColor: isChecked ? 'rgba(56, 189, 248, 0.12)' : '#0F172A',
                          border: `1px solid ${isChecked ? '#38BDF8' : '#1E293B'}`,
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: isChecked ? '#38BDF8' : '#F1F5F9', fontSize: '0.8125rem' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                            {p.code} • {p.permissions.length} actions
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'PERMISSION_PACKS' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '14px'
            }}>
              {packs.map((p) => (
                <div key={p.code} style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.875rem' }}>{p.name}</span>
                    <span style={{ backgroundColor: '#1E293B', color: '#38BDF8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
                      {p.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '10px' }}>CODE: {p.code}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {p.permissions.map((perm) => (
                      <span key={perm} style={{ backgroundColor: '#070C16', color: '#94A3B8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', fontFamily: 'monospace' }}>
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              {/* Left Column: Active Policies List */}
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '14px' }}>
                  Active Conditional Policies ({policies.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {policies.map((pol) => (
                    <div key={pol.id} style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: '#F1F5F9', fontSize: '0.875rem' }}>{pol.name}</span>
                        <span style={{
                          backgroundColor: pol.effect === 'ALLOW' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: pol.effect === 'ALLOW' ? '#34D399' : '#F87171',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: 800
                        }}>
                          {pol.effect} (Priority {pol.priority})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                        {pol.code} • Actions: {pol.actions.join(', ')}
                      </div>
                      {pol.timeWindow && (
                        <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '4px' }}>
                          Shift Window: {pol.timeWindow.startTime} to {pol.timeWindow.endTime}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: New Policy Form */}
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Add Shift or Access Policy
                </h3>
                <p style={{ margin: '4px 0 16px', fontSize: '0.75rem', color: '#94A3B8' }}>
                  Evaluated at Tier 10 with deterministic priority resolution.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>POLICY NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. Night Shift Doctor Policy"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>POLICY CODE</label>
                    <input
                      type="text"
                      placeholder="e.g. POL_NIGHT_SHIFT_DOCTOR"
                      value={policyCode}
                      onChange={(e) => setPolicyCode(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>EFFECT</label>
                      <select
                        value={policyEffect}
                        onChange={(e) => setPolicyEffect(e.target.value as any)}
                        style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                      >
                        <option value="ALLOW">ALLOW</option>
                        <option value="DENY">DENY</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>PRIORITY</label>
                      <input
                        type="number"
                        value={policyPriority}
                        onChange={(e) => setPolicyPriority(parseInt(e.target.value, 10))}
                        style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>START TIME (HH:MM)</label>
                      <input
                        type="text"
                        placeholder="20:00"
                        value={policyTimeStart}
                        onChange={(e) => setPolicyTimeStart(e.target.value)}
                        style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>END TIME (HH:MM)</label>
                      <input
                        type="text"
                        placeholder="08:00"
                        value={policyTimeEnd}
                        onChange={(e) => setPolicyTimeEnd(e.target.value)}
                        style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>TARGET ROLES (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="DOCTOR, SURGEON"
                      value={policyRoleCondition}
                      onChange={(e) => setPolicyRoleCondition(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>TARGET DEPARTMENT (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. EMERGENCY, ICU, RADIOLOGY"
                      value={policyDepartmentCondition}
                      onChange={(e) => setPolicyDepartmentCondition(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>ACTIONS (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="clinical:record:edit, clinical:vitals:record"
                      value={policyActions}
                      onChange={(e) => setPolicyActions(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <button
                    onClick={handleCreatePolicy}
                    disabled={creatingPolicy || !policyName.trim() || !policyCode.trim()}
                    style={{
                      backgroundColor: '#38BDF8',
                      color: '#070C16',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      cursor: creatingPolicy || !policyName.trim() || !policyCode.trim() ? 'not-allowed' : 'pointer',
                      opacity: creatingPolicy || !policyName.trim() || !policyCode.trim() ? 0.6 : 1,
                      marginTop: '8px'
                    }}
                  >
                    {creatingPolicy ? 'Publishing...' : '🚀 Publish Policy'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};
