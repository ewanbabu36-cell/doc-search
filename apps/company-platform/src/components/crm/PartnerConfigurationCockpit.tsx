import React, { useState, useEffect } from 'react';

export interface CapabilityItem {
  code: string;
  name: string;
  category: string;
  description: string;
  dependencies: string[];
}

export interface ConfigurationVersionEntry {
  id: string;
  versionNumber: number;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
  appliedTemplateId?: string;
  appliedTemplateVersion?: number;
}

export interface PartnerConfigurationCockpitProps {
  partnerId: string;
  partnerName: string;
  onClose: () => void;
  onSaved?: () => void;
}

export const PartnerConfigurationCockpit: React.FC<PartnerConfigurationCockpitProps> = ({
  partnerId,
  partnerName,
  onClose,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState<'CAPABILITIES' | 'APPLY_BLUEPRINT' | 'SAVE_BLUEPRINT' | 'HISTORY_DIFF'>('CAPABILITIES');
  const [allCapabilities, setAllCapabilities] = useState<CapabilityItem[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<string>>(new Set());
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('');
  const [history, setHistory] = useState<ConfigurationVersionEntry[]>([]);
  const [v1, setV1] = useState<number>(1);
  const [v2, setV2] = useState<number>(1);
  const [diffResult, setDiffResult] = useState<any | null>(null);
  const [saveTemplateName, setSaveTemplateName] = useState<string>('');
  const [saveTemplateCode, setSaveTemplateCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // Load Capabilities and Blueprints
  useEffect(() => {
    const loadInitData = async () => {
      setLoading(true);
      try {
        const [capRes, tplRes, histRes] = await Promise.all([
          fetch('/api/v1/company/capabilities'),
          fetch('/api/v1/company/templates'),
          fetch(`/api/v1/company/partners/${partnerId}/configuration/history`)
        ]);

        if (capRes.ok) {
          const cData = await capRes.json();
          setAllCapabilities(cData.data || []);
        }

        if (tplRes.ok) {
          const tData = await tplRes.json();
          setBlueprints(tData.data || []);
          if (tData.data?.length > 0) {
            setSelectedBlueprintId(tData.data[0].id);
          }
        }

        if (histRes.ok) {
          const hData = await histRes.json();
          const list = hData.data || [];
          setHistory(list);
          if (list.length >= 2) {
            setV1(list[1].versionNumber);
            setV2(list[0].versionNumber);
          } else if (list.length === 1) {
            setV1(list[0].versionNumber);
            setV2(list[0].versionNumber);
          }
        }
      } catch (err: any) {
        console.error('Failed to load initial configuration data:', err);
      } finally {
        setLoading(false);
      }
    };

    void loadInitData();
  }, [partnerId]);

  // Toggle Capability selection
  const toggleCapability = (code: string) => {
    const next = new Set(selectedCapabilities);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedCapabilities(next);
  };

  // Synchronize Capabilities
  const handleSaveCapabilities = async () => {
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/v1/company/partners/${partnerId}/capabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeCapabilities: Array.from(selectedCapabilities),
          reason: 'Manual capability synchronization from Cockpit'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: data.message || 'Capabilities updated successfully.' });
        if (onSaved) onSaved();
      } else {
        setStatusMsg({ type: 'ERROR', text: data.message || data.error?.message || 'Conflict detected in capabilities.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'ERROR', text: e.message });
    }
  };

  // Apply Blueprint
  const handleApplyBlueprint = async () => {
    if (!selectedBlueprintId) return;
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/v1/company/templates/${selectedBlueprintId}/apply/${partnerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: data.message || 'Blueprint successfully applied!' });
        if (onSaved) onSaved();
      } else {
        setStatusMsg({ type: 'ERROR', text: data.message || data.error?.message || 'Failed to apply blueprint.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'ERROR', text: e.message });
    }
  };

  // Save as Blueprint
  const handleSaveAsBlueprint = async () => {
    if (!saveTemplateName || !saveTemplateCode) return;
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/v1/company/partners/${partnerId}/save-as-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: saveTemplateName.trim(),
          templateCode: saveTemplateCode.trim().toUpperCase()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: data.message || 'Saved as new Master Blueprint!' });
        setSaveTemplateName('');
        setSaveTemplateCode('');
      } else {
        setStatusMsg({ type: 'ERROR', text: data.message || data.error?.message || 'Failed to save blueprint.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'ERROR', text: e.message });
    }
  };

  // Fetch Diff
  const handleComputeDiff = async () => {
    try {
      const res = await fetch(`/api/v1/company/partners/${partnerId}/configuration/diff?v1=${v1}&v2=${v2}`);
      if (res.ok) {
        const data = await res.json();
        setDiffResult(data.data);
      }
    } catch (e) {
      console.error('Diff error:', e);
    }
  };

  // Rollback to version
  const handleRollback = async (targetVer: number) => {
    if (!window.confirm(`Are you sure you want to rollback ${partnerName} to configuration version v${targetVer}?`)) {
      return;
    }
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/v1/company/partners/${partnerId}/configuration/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion: targetVer })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: data.message || `Rollback to v${targetVer} complete!` });
        if (onSaved) onSaved();
      } else {
        setStatusMsg({ type: 'ERROR', text: data.message || data.error?.message || 'Rollback failed.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'ERROR', text: e.message });
    }
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
              <span style={{ fontSize: '1.5rem' }}>⚙️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
                Partner Configuration & Combo Engine: {partnerName}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Partner ID: {partnerId} • Realtime Capability Composition, Blueprint Rollout, Semantic Diff & Rollback
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

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 24px',
          borderBottom: '1px solid #1E293B',
          backgroundColor: '#0B1120'
        }}>
          {[
            { key: 'CAPABILITIES', label: '⚡ Capabilities (Combo Engine)', icon: '⚡' },
            { key: 'APPLY_BLUEPRINT', label: '📋 Apply Blueprint', icon: '📋' },
            { key: 'SAVE_BLUEPRINT', label: '💾 Save As Blueprint', icon: '💾' },
            { key: 'HISTORY_DIFF', label: '🕒 History, Diff & Rollback', icon: '🕒' }
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

        {/* Global Notification Banner */}
        {statusMsg && (
          <div style={{
            margin: '16px 24px 0',
            padding: '10px 16px',
            borderRadius: '8px',
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
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>Loading configuration cockpit...</div>
          ) : activeTab === 'CAPABILITIES' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>
                    Master Capability Catalog (21 Capabilities)
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                    Toggle capabilities to compose multi-specialty combo organizations (e.g. Hospital + Diagnostic Lab + Radiology + Pharmacy).
                  </p>
                </div>
                <button
                  onClick={handleSaveCapabilities}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#070C16',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  💾 Save Active Capabilities
                </button>
              </div>

              {/* 21 Capabilities Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '12px'
              }}>
                {allCapabilities.map((cap) => {
                  const isChecked = selectedCapabilities.has(cap.code);
                  return (
                    <div
                      key={cap.code}
                      onClick={() => toggleCapability(cap.code)}
                      style={{
                        backgroundColor: isChecked ? 'rgba(56, 189, 248, 0.1)' : '#0B1120',
                        border: `1px solid ${isChecked ? '#38BDF8' : '#1E293B'}`,
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: isChecked ? '#38BDF8' : '#F1F5F9', fontSize: '0.875rem' }}>
                            {cap.name}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                            CODE: {cap.code} • {cap.category}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8', lineHeight: '1.3' }}>
                        {cap.description}
                      </p>
                      {cap.dependencies.length > 0 && (
                        <div style={{ fontSize: '0.6875rem', color: '#F59E0B' }}>
                          Prerequisites: {cap.dependencies.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'APPLY_BLUEPRINT' ? (
            <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Apply Master Blueprint
                </h3>
                <p style={{ margin: '6px 0 16px', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Select one of the 10 production blueprints to instantly provision departments, capabilities, and roles.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Select Master Blueprint
                    </label>
                    <select
                      value={selectedBlueprintId}
                      onChange={(e) => setSelectedBlueprintId(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '6px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      {blueprints.map((bp) => (
                        <option key={bp.id} value={bp.id}>
                          {bp.name} ({bp.category}) — v{bp.currentVersion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleApplyBlueprint}
                    style={{
                      backgroundColor: '#38BDF8',
                      color: '#070C16',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      marginTop: '10px'
                    }}
                  >
                    🚀 Apply Blueprint To {partnerName}
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'SAVE_BLUEPRINT' ? (
            <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Save Current Partner Configuration As Master Blueprint
                </h3>
                <p style={{ margin: '6px 0 16px', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Clones {partnerName}&apos;s tailored capabilities, departments, roles, and permission packs into a reusable template.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Template Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Hospital Custom Multi-Specialty"
                      value={saveTemplateName}
                      onChange={(e) => setSaveTemplateName(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '6px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Template Code (Unique)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. APEX_HOSPITAL_TEMPLATE"
                      value={saveTemplateCode}
                      onChange={(e) => setSaveTemplateCode(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '6px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSaveAsBlueprint}
                    disabled={!saveTemplateName.trim() || !saveTemplateCode.trim()}
                    style={{
                      backgroundColor: '#10B981',
                      color: '#070C16',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      cursor: !saveTemplateName.trim() || !saveTemplateCode.trim() ? 'not-allowed' : 'pointer',
                      opacity: !saveTemplateName.trim() || !saveTemplateCode.trim() ? 0.6 : 1,
                      marginTop: '10px'
                    }}
                  >
                    💾 Save As Blueprint
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Diff Comparator Controls */}
              <div style={{
                backgroundColor: '#0B1120',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F1F5F9' }}>
                    Compare Configuration Versions:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>From Version:</span>
                    <input
                      type="number"
                      value={v1}
                      onChange={(e) => setV1(parseInt(e.target.value, 10))}
                      style={{
                        width: '60px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>To Version:</span>
                    <input
                      type="number"
                      value={v2}
                      onChange={(e) => setV2(parseInt(e.target.value, 10))}
                      style={{
                        width: '60px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  <button
                    onClick={handleComputeDiff}
                    style={{
                      backgroundColor: '#38BDF8',
                      color: '#070C16',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Compute Diff
                  </button>
                </div>
              </div>

              {/* Semantic Diff Result */}
              {diffResult && (
                <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px' }}>
                    Semantic Diff: v{diffResult.v1} vs v{diffResult.v2} (Identical: {String(diffResult.isIdentical)})
                  </h4>
                  <pre style={{
                    backgroundColor: '#070C16',
                    padding: '14px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#38BDF8',
                    overflowX: 'auto',
                    border: '1px solid #1E293B'
                  }}>
                    {JSON.stringify(diffResult.diff, null, 2)}
                  </pre>
                </div>
              )}

              {/* Version History Table with 1-Click Rollback */}
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '14px' }}>
                  Configuration Snapshot Ledger ({history.length} versions)
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1E293B', textAlign: 'left', color: '#64748B' }}>
                        <th style={{ padding: '8px' }}>VERSION</th>
                        <th style={{ padding: '8px' }}>CHANGE SUMMARY</th>
                        <th style={{ padding: '8px' }}>MODIFIED BY</th>
                        <th style={{ padding: '8px' }}>TIMESTAMP</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.id} style={{ borderBottom: '1px solid #1E293B' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 800, color: '#38BDF8' }}>
                            v{h.versionNumber}
                          </td>
                          <td style={{ padding: '10px 8px', color: '#F1F5F9' }}>
                            {h.changeSummary || 'Configuration snapshot'}
                          </td>
                          <td style={{ padding: '10px 8px', color: '#94A3B8' }}>
                            {h.createdBy}
                          </td>
                          <td style={{ padding: '10px 8px', color: '#64748B' }}>
                            {new Date(h.createdAt).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleRollback(h.versionNumber)}
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                color: '#FCD34D',
                                border: '1px solid #F59E0B',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              ⏪ Rollback to v{h.versionNumber}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};
