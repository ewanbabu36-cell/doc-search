import React, { useState, useEffect } from 'react';

export interface TemplateBlueprint {
  id: string;
  code: string;
  name: string;
  category: 'CLINIC' | 'HOSPITAL' | 'DIAGNOSTICS' | 'PHARMACY' | 'HEALTHCARE_GROUP' | 'SPECIALTY';
  description: string;
  currentVersion: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  versions?: TemplateVersionDto[];
}

export interface TemplateVersionDto {
  id: string;
  templateId: string;
  versionNumber: number;
  status: string;
  supportedProfiles: string[];
  capabilities: string[];
  departments: string[];
  defaultRoles: string[];
  permissionPacks: string[];
  changeSummary?: string;
  createdBy: string;
  createdAt: string;
}

export interface PartnerTemplateManagerProps {
  onClose: () => void;
  onApplyTemplateToPartner?: (templateId: string, partnerId: string) => void;
  selectedPartnerId?: string;
}

export const PartnerTemplateManager: React.FC<PartnerTemplateManagerProps> = ({
  onClose,
  onApplyTemplateToPartner,
  selectedPartnerId
}) => {
  const [templates, setTemplates] = useState<TemplateBlueprint[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateBlueprint | null>(null);
  const [versions, setVersions] = useState<TemplateVersionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [targetPartnerId, setTargetPartnerId] = useState<string>(selectedPartnerId || '');
  const [applying, setApplying] = useState<boolean>(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  const [newVersionSummary, setNewVersionSummary] = useState<string>('');
  const [creatingVersion, setCreatingVersion] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/company/templates');
      if (res.ok) {
        const json = await res.json();
        const list: TemplateBlueprint[] = json.data || [];
        setTemplates(list);
        if (list.length > 0 && !selectedTemplate) {
          setSelectedTemplate(list[0] || null);
        }
      }
    } catch (e) {
      console.error('Failed to load blueprints:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async (templateId: string) => {
    try {
      const res = await fetch(`/api/v1/company/templates/${templateId}/versions`);
      if (res.ok) {
        const json = await res.json();
        setVersions(json.data || []);
      }
    } catch (e) {
      console.error('Failed to load versions:', e);
    }
  };

  useEffect(() => {
    void fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      void fetchVersions(selectedTemplate.id);
    }
  }, [selectedTemplate]);

  const handleApply = async () => {
    if (!selectedTemplate || !targetPartnerId.trim()) return;
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await fetch(`/api/v1/company/templates/${selectedTemplate.id}/apply/${targetPartnerId.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionNumber: selectedTemplate.currentVersion })
      });
      const data = await res.json();
      if (res.ok) {
        setApplyResult(`Success: Applied ${selectedTemplate.name} (v${selectedTemplate.currentVersion}) to Partner ${targetPartnerId}.`);
        if (onApplyTemplateToPartner) {
          onApplyTemplateToPartner(selectedTemplate.id, targetPartnerId);
        }
      } else {
        setApplyResult(`Error: ${data.message || data.error?.message || 'Failed to apply template'}`);
      }
    } catch (e: any) {
      setApplyResult(`Error: ${e.message}`);
    } finally {
      setApplying(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedTemplate || !newVersionSummary.trim()) return;
    setCreatingVersion(true);
    try {
      const latestVer = versions[0];
      const res = await fetch(`/api/v1/company/templates/${selectedTemplate.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeSummary: newVersionSummary.trim(),
          capabilities: latestVer?.capabilities || [],
          departments: latestVer?.departments || [],
          defaultRoles: latestVer?.defaultRoles || [],
          permissionPacks: latestVer?.permissionPacks || []
        })
      });
      if (res.ok) {
        setNewVersionSummary('');
        await fetchVersions(selectedTemplate.id);
        await fetchTemplates();
      }
    } catch (e) {
      console.error('Failed to create version:', e);
    } finally {
      setCreatingVersion(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (categoryFilter === 'ALL') return true;
    return t.category === categoryFilter;
  });

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.75rem' }}>📋</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
                Master Blueprint Registry & Template Engine
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                Production-grade, immutable blueprint definitions with versioning, capability bundling, and 1-click partner rollout.
              </p>
            </div>
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

        {/* Body Container (2 Columns) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Column: Blueprint Selector & Filters */}
          <div style={{
            width: '380px',
            borderRight: '1px solid #1E293B',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0B1120'
          }}>
            {/* Category Filter */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E293B' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Filter By Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem'
                }}
              >
                <option value="ALL">All Categories ({templates.length})</option>
                <option value="CLINIC">Clinics</option>
                <option value="HOSPITAL">Hospitals</option>
                <option value="DIAGNOSTICS">Diagnostics & Pathology</option>
                <option value="PHARMACY">Pharmacies</option>
                <option value="HEALTHCARE_GROUP">Healthcare Groups</option>
                <option value="SPECIALTY">Specialty Centres</option>
              </select>
            </div>

            {/* Blueprint List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>Loading blueprints...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredTemplates.map((t) => {
                    const isSelected = selectedTemplate?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTemplate(t)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : '#0F172A',
                          border: `1px solid ${isSelected ? '#38BDF8' : '#1E293B'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: isSelected ? '#38BDF8' : '#F8FAFC', fontSize: '0.875rem' }}>
                            {t.name}
                          </span>
                          <span style={{
                            fontSize: '0.6875rem',
                            backgroundColor: '#1E293B',
                            color: '#38BDF8',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            v{t.currentVersion}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                          {t.code} • {t.category}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Blueprint Details, Versioning & Rollout */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px' }}>
            {selectedTemplate ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Blueprint Header */}
                <div style={{
                  backgroundColor: '#0B1120',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                          {selectedTemplate.name}
                        </h3>
                        <span style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#34D399',
                          border: '1px solid #10B981',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          {selectedTemplate.status}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: '#94A3B8' }}>
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Rollout to Partner Form */}
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F1F5F9' }}>
                      Apply Blueprint to Partner:
                    </span>
                    <input
                      type="text"
                      placeholder="Enter Partner ID (e.g. abc-multi-specialty)"
                      value={targetPartnerId}
                      onChange={(e) => setTargetPartnerId(e.target.value)}
                      style={{
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        width: '280px'
                      }}
                    />
                    <button
                      onClick={handleApply}
                      disabled={applying || !targetPartnerId.trim()}
                      style={{
                        backgroundColor: '#38BDF8',
                        color: '#070C16',
                        border: 'none',
                        padding: '7px 16px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        cursor: applying || !targetPartnerId.trim() ? 'not-allowed' : 'pointer',
                        opacity: applying || !targetPartnerId.trim() ? 0.6 : 1
                      }}
                    >
                      {applying ? 'Applying...' : '🚀 Apply Blueprint'}
                    </button>
                  </div>
                  {applyResult && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      backgroundColor: applyResult.startsWith('Success') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: applyResult.startsWith('Success') ? '#34D399' : '#F87171',
                      border: `1px solid ${applyResult.startsWith('Success') ? '#10B981' : '#EF4444'}`
                    }}>
                      {applyResult}
                    </div>
                  )}
                </div>

                {/* Latest Blueprint Composition Grid */}
                {versions[0] && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '14px'
                  }}>
                    {/* Capabilities Card */}
                    <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '8px' }}>
                        ⚡ Capabilities ({versions[0].capabilities?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {versions[0].capabilities?.map((c) => (
                          <span key={c} style={{ backgroundColor: '#1E293B', color: '#CBD5E1', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Operational Departments */}
                    <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginBottom: '8px' }}>
                        🏥 Departments ({versions[0].departments?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {versions[0].departments?.map((d) => (
                          <span key={d} style={{ backgroundColor: '#1E293B', color: '#CBD5E1', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Default Roles */}
                    <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', marginBottom: '8px' }}>
                        👤 Default Roles ({versions[0].defaultRoles?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {versions[0].defaultRoles?.map((r) => (
                          <span key={r} style={{ backgroundColor: '#1E293B', color: '#CBD5E1', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Permission Packs */}
                    <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#A855F7', textTransform: 'uppercase', marginBottom: '8px' }}>
                        📦 Permission Packs ({versions[0].permissionPacks?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {versions[0].permissionPacks?.map((p) => (
                          <span key={p} style={{ backgroundColor: '#1E293B', color: '#CBD5E1', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Version History & Immutable Snapshot Ledger */}
                <div style={{
                  backgroundColor: '#0B1120',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC' }}>
                      Immutable Version History ({versions.length} versions)
                    </h4>
                  </div>

                  {/* Create New Version Input */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Summary of changes for next blueprint version (e.g. Added Pediatric ICU & Enhanced Billing Pack)"
                      value={newVersionSummary}
                      onChange={(e) => setNewVersionSummary(e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8125rem'
                      }}
                    />
                    <button
                      onClick={handleCreateVersion}
                      disabled={creatingVersion || !newVersionSummary.trim()}
                      style={{
                        backgroundColor: '#10B981',
                        color: '#070C16',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        cursor: creatingVersion || !newVersionSummary.trim() ? 'not-allowed' : 'pointer',
                        opacity: creatingVersion || !newVersionSummary.trim() ? 0.6 : 1
                      }}
                    >
                      {creatingVersion ? 'Creating...' : '+ Release Version'}
                    </button>
                  </div>

                  {/* Version Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1E293B', textAlign: 'left', color: '#64748B' }}>
                          <th style={{ padding: '8px' }}>VER</th>
                          <th style={{ padding: '8px' }}>STATUS</th>
                          <th style={{ padding: '8px' }}>CHANGE SUMMARY</th>
                          <th style={{ padding: '8px' }}>CREATED BY</th>
                          <th style={{ padding: '8px' }}>TIMESTAMP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {versions.map((v) => (
                          <tr key={v.id} style={{ borderBottom: '1px solid #1E293B' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 800, color: '#38BDF8' }}>
                              v{v.versionNumber}
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{
                                backgroundColor: v.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                                color: v.status === 'PUBLISHED' ? '#34D399' : '#94A3B8',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.6875rem',
                                fontWeight: 700
                              }}>
                                {v.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px 8px', color: '#F1F5F9' }}>
                              {v.changeSummary || 'Baseline release'}
                            </td>
                            <td style={{ padding: '10px 8px', color: '#94A3B8' }}>
                              {v.createdBy}
                            </td>
                            <td style={{ padding: '10px 8px', color: '#64748B' }}>
                              {new Date(v.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                Select a blueprint to inspect details and version history.
              </div>
            )}
          </div>
        </div>
      </div>
  );
};
