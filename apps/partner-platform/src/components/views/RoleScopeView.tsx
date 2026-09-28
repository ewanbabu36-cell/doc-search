import React, { useState, useEffect } from 'react';
import type { StaffRoleAssignmentDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Alert,
  Button,
  Dialog,
  Input,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import {
  getAllRoleTemplates,
  deleteRoleTemplate,
  resetToDefaultTemplates,
  ROLE_TEMPLATES_CHANGED_EVENT,
  type PartnerRoleTemplate,
  type RoleCategory,
  getUniqueCategories
} from '../../utils/partnerRoleTemplates.js';
import { RoleTemplateModal } from '../dialogs/RoleTemplateModal.js';
import { isDestructiveActionAllowed } from '../../utils/partnerRolePermissions.js';

export interface RoleScopeViewProps {
  roleAssignments: StaffRoleAssignmentDto[];
}

export const RoleScopeView: React.FC<RoleScopeViewProps> = ({ roleAssignments }) => {
  const [templates, setTemplates] = useState<PartnerRoleTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<PartnerRoleTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<PartnerRoleTemplate | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const loadTemplates = () => {
    setTemplates(getAllRoleTemplates());
  };

  useEffect(() => {
    loadTemplates();

    const handleChanged = () => {
      loadTemplates();
    };

    window.addEventListener(ROLE_TEMPLATES_CHANGED_EVENT, handleChanged);
    return () => {
      window.removeEventListener(ROLE_TEMPLATES_CHANGED_EVENT, handleChanged);
    };
  }, []);

  const categories = getUniqueCategories();

  const filteredTemplates = templates.filter((tpl) => {
    const matchesCategory = selectedCategory === 'ALL' || tpl.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = !q ||
      tpl.templateName.toLowerCase().includes(q) ||
      tpl.roleCode.toLowerCase().includes(q) ||
      tpl.description.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const handleOpenCreate = () => {
    setTemplateToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tpl: PartnerRoleTemplate) => {
    setTemplateToEdit(tpl);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      deleteRoleTemplate(templateToDelete.id);
      setTemplateToDelete(null);
      loadTemplates();
    }
  };

  const handleConfirmReset = () => {
    resetToDefaultTemplates();
    setShowResetConfirm(false);
    loadTemplates();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Alert type="info" title="Operational Role & Data Scope Hierarchy">
        Role assignments enforce data isolation across the hierarchy:
        <code>COMPANY → PARTNER → ORGANIZATION → BRANCH → DEPARTMENT → ASSIGNED → SELF</code>.
        Clinical prescriptions, chart edits, order sets, and patient queue management strictly obey these boundaries.
      </Alert>

      {/* 1. Active Staff Role & Scope Bindings */}
      <Card
        title="Active Staff Role & Scope Bindings"
        subtitle="Live role privileges and data scope isolation levels currently assigned across hospital staff"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Operational Role Code</TableHead>
                <TableHead>Data Scope Isolation</TableHead>
                <TableHead>Primary Status</TableHead>
                <TableHead>Effective Period</TableHead>
                <TableHead>Assigned By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No custom role assignments recorded. Staff use their default organizational profiles.
                  </TableCell>
                </TableRow>
              ) : (
                roleAssignments.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                        {r.staffName ?? 'Staff Member'}
                      </strong>
                    </TableCell>
                    <TableCell style={{ fontWeight: '600' }}>
                      {r.roleCode}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.dataScope === 'ORGANIZATION' ? 'primary' : r.dataScope === 'BRANCH' ? 'success' : 'neutral'}>
                        {r.dataScope}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.isPrimary ? (
                        <Badge variant="success">PRIMARY</Badge>
                      ) : (
                        <Badge variant="neutral">SECONDARY</Badge>
                      )}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {new Date(r.effectiveFrom).toLocaleDateString()}
                      {r.effectiveTo ? ` — ${new Date(r.effectiveTo).toLocaleDateString()}` : ' (Indefinite)'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      {r.assignedBy}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* 2. Dynamic Hospital Role Templates Catalog */}
      <Card
        title="Standard Hospital Role Templates Catalog"
        subtitle="Dynamically configure, create, edit, and manage standardized role templates with custom module permissions and data scope boundaries."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Bar: Search + Create + Reset */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'var(--ds-color-surface-subtle, #182234)', padding: '12px', borderRadius: '8px', border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))' }}>
            <div style={{ flex: '1 1 280px', minWidth: '240px' }}>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search templates by name, role code, or description..."
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                ✨ + Create New Template
              </Button>
              {isDestructiveActionAllowed() && (
                <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(true)}>
                  🔄 Reset to Standard
                </Button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: selectedCategory === 'ALL' ? '700' : '500',
                border: selectedCategory === 'ALL' ? '1px solid var(--ds-color-primary, #0284c7)' : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.12))',
                background: selectedCategory === 'ALL' ? 'var(--ds-color-primary, #0284c7)' : 'var(--ds-color-surface-subtle, #182234)',
                color: selectedCategory === 'ALL' ? '#ffffff' : 'var(--ds-color-text-secondary, #cbd5e1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All Templates ({templates.length})
            </button>
            {categories.map((c) => {
              const isSelected = selectedCategory === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedCategory(c.key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? '700' : '500',
                    border: isSelected ? '1px solid var(--ds-color-primary, #0284c7)' : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.12))',
                    background: isSelected ? 'var(--ds-color-primary, #0284c7)' : 'var(--ds-color-surface-subtle, #182234)',
                    color: isSelected ? '#ffffff' : 'var(--ds-color-text-secondary, #cbd5e1)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Template Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}
          >
            {filteredTemplates.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: 'var(--ds-color-text-muted, #94a3b8)', background: 'var(--ds-color-surface-subtle, #182234)', borderRadius: '8px', border: '1px dashed var(--ds-color-border, rgba(255, 255, 255, 0.15))' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔍</span>
                <strong>No role templates found matching your criteria.</strong>
                <p style={{ fontSize: '0.8125rem', margin: '4px 0 12px' }}>Try a different search query or create a new template.</p>
                <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                  Create Role Template
                </Button>
              </div>
            ) : (
              filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  style={{
                    border: tpl.isCustom ? '2px solid #a855f7' : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.12))',
                    borderRadius: '8px',
                    padding: '16px',
                    background: 'var(--ds-color-surface, #121826)',
                    color: 'var(--ds-color-text-primary, #f8fafc)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.75rem' }}>{tpl.icon}</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: 'var(--ds-color-text-primary, #f8fafc)' }}>
                          {tpl.templateName}
                        </h4>
                        <code style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted, #94a3b8)' }}>{tpl.roleCode}</code>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {tpl.isCustom && (
                        <Badge variant="warning">CUSTOM</Badge>
                      )}
                      <Badge variant="primary">{(tpl.categoryLabel || tpl.category || 'ROLE').split('&')[0]?.trim()}</Badge>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary, #cbd5e1)', lineHeight: '1.4' }}>
                    {tpl.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem' }}>
                    <div style={{ background: 'var(--ds-color-surface-subtle, #182234)', border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))', padding: '4px 8px', borderRadius: '4px', color: 'var(--ds-color-text-secondary, #cbd5e1)' }}>
                      <strong>Default Scope:</strong> <code style={{ color: 'var(--ds-color-accent, #38bdf8)' }}>{tpl.defaultDataScope}</code>
                    </div>
                    <div style={{ background: 'var(--ds-color-surface-subtle, #182234)', border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))', padding: '4px 8px', borderRadius: '4px', color: 'var(--ds-color-text-secondary, #cbd5e1)' }}>
                      <strong>Default Landing:</strong> <code style={{ color: 'var(--ds-color-accent, #38bdf8)' }}>{tpl.defaultModule}</code>
                    </div>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--ds-color-text-muted, #94a3b8)', marginBottom: '4px' }}>
                      Allowed Modules ({(tpl.allowedModules as any[]).includes('*') ? 'All 26' : tpl.allowedModules.length}):
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(tpl.allowedModules as any[]).includes('*') ? (
                        <Badge variant="success">✨ All 26 Modules</Badge>
                      ) : (
                        tpl.allowedModules.slice(0, 5).map((m) => (
                          <span
                            key={m}
                            style={{
                              fontSize: '0.6875rem',
                              padding: '2px 6px',
                              background: 'var(--ds-color-surface-subtle, #182234)',
                              color: 'var(--ds-color-accent, #38bdf8)',
                              border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                              borderRadius: '4px'
                            }}
                          >
                            {m}
                          </span>
                        ))
                      )}
                      {!(tpl.allowedModules as any[]).includes('*') && tpl.allowedModules.length > 5 && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted, #94a3b8)', alignSelf: 'center' }}>
                          +{tpl.allowedModules.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))', paddingTop: '8px', fontSize: '0.75rem' }}>
                    <strong style={{ display: 'block', color: 'var(--ds-color-success, #10b981)', marginBottom: '2px', fontSize: '0.6875rem' }}>
                      ✓ Key Permissions:
                    </strong>
                    <div style={{ color: 'var(--ds-color-text-secondary, #cbd5e1)', fontSize: '0.75rem', lineHeight: '1.3', marginBottom: '10px' }}>
                      {tpl.accessibleFeatures.slice(0, 2).join(' • ')}
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px dashed var(--ds-color-border, rgba(255, 255, 255, 0.12))', paddingTop: '8px' }}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(tpl)}
                      >
                        ✏️ Edit Template
                      </Button>
                      {isDestructiveActionAllowed() && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setTemplateToDelete(tpl)}
                        >
                          🗑️ Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Create / Edit Template Modal */}
      {isModalOpen && (
        <RoleTemplateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          templateToEdit={templateToEdit}
          onSaved={() => {
            loadTemplates();
            setIsModalOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {templateToDelete && (
        <Dialog
          isOpen={Boolean(templateToDelete)}
          onClose={() => setTemplateToDelete(null)}
          title="🗑️ Confirm Delete Role Template"
          maxWidth="sm"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => setTemplateToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
                Delete Template
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>
              Are you sure you want to delete the role template <strong>{templateToDelete.templateName}</strong> (<code>{templateToDelete.roleCode}</code>)?
            </p>
            <Alert type="warning" title="Impact Notice">
              Staff members currently assigned to this role will retain their active database bindings, but this template preset will no longer be available for quick one-click assignments.
            </Alert>
          </div>
        </Dialog>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <Dialog
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          title="🔄 Reset All Role Templates to Default Presets?"
          maxWidth="sm"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmReset}>
                Reset to Standard Defaults
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>
              This will reload the standard 18 hospital role templates (Front Desk Lead, Attending Doctor, Surgeon, Chief Pharmacist, Billing Manager, etc.).
            </p>
            <Alert type="info" title="Safe Reset">
              Standard factory templates will be restored while preserving all staff member records in the database.
            </Alert>
          </div>
        </Dialog>
      )}
    </div>
  );
};

