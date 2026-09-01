import React, { useState } from 'react';
import type { DepartmentDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface DepartmentHierarchyViewProps {
  departments: DepartmentDto[];
  onAddDepartment?: (newDept: DepartmentDto) => void;
}

export const DepartmentHierarchyView: React.FC<DepartmentHierarchyViewProps> = ({
  departments,
  onAddDepartment
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form State
  const [deptName, setDeptName] = useState('Human Resources & People Operations (HR)');
  const [deptCode, setDeptCode] = useState('dept-hr');
  const [costCenter, setCostCenter] = useState('CC-5000');
  const [leadEmail, setLeadEmail] = useState('head.hr@docsearch.internal');
  const [description, setDescription] = useState('Talent acquisition, doctor & clinical recruitment, payroll, leaves, and staff performance');
  const [employeeCount, setEmployeeCount] = useState('8');

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const created: DepartmentDto = {
      id: `00000000-0000-0000-0000-${String(Math.floor(100000000000 + Math.random() * 900000000000))}`,
      departmentCode: deptCode.trim() || 'dept-custom',
      departmentName: deptName.trim(),
      description: description.trim(),
      costCenterCode: costCenter.trim() || 'CC-9000',
      legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
      legalEntityName: 'Doc Search Inc.',
      leadEmail: leadEmail.trim() || 'unassigned@docsearch.internal',
      employeeCount: parseInt(employeeCount, 10) || 1,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onAddDepartment) {
      onAddDepartment(created);
    }
    setIsAddModalOpen(false);
    setSuccessBanner(`Department "${created.departmentName}" created and added to corporate hierarchy!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '12px', padding: '16px 20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏢</span> Organizational Departments & Cost Center Hierarchy ({departments.length})
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '2px' }}>
            Corporate departments, cost centers, leadership allocations, and operational headcount governance
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          style={{
            backgroundColor: '#06B6D4',
            color: '#070C16',
            fontWeight: 800,
            padding: '8px 20px',
            fontSize: '0.875rem'
          }}
        >
          ➕ Add New Department
        </Button>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successBanner}
        </div>
      )}

      {/* Departments Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dept Code</TableHead>
                <TableHead>Department Name & Scope</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Legal Entity</TableHead>
                <TableHead>Department Lead Email</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.75rem', color: '#38BDF8' }}>
                    {d.departmentCode}
                  </TableCell>
                  <TableCell style={{ maxWidth: '280px' }}>
                    <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '2px' }}>
                      {d.departmentName}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', lineHeight: '1.4', display: 'block' }}>
                      {d.description}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    <Badge variant="neutral">{d.costCenterCode}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.legalEntityName ?? 'DocSearch India Pvt Ltd'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <span style={{ color: '#06B6D4' }}>{d.leadEmail ?? 'Unassigned'}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    <strong style={{ color: '#10B981' }}>{d.employeeCount}</strong> staff
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant={d.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      ● {d.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Department Modal */}
      {isAddModalOpen && (
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
            border: '1.5px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            padding: '24px',
            boxShadow: '0 25px 70px rgba(0,0,0,0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 800, color: '#38BDF8' }}>
                  🏢 Add New Organizational Department
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Create cost center, designate HOD email, and allocate staff headcount
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                  DEPARTMENT NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Human Resources & People Operations (HR)"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                    DEPARTMENT CODE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dept-hr"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                    COST CENTER CODE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CC-5000"
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                    HOD / LEAD EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. head.hr@docsearch.internal"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                    ALLOCATED HEADCOUNT *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                  DESCRIPTION & SCOPE OF WORK *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)' }}
                >
                  ✓ Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
