import React, { useState } from 'react';
import type { InternalEmployeeDto, EmploymentStatus, EmploymentType } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { EmployeeStatusDialog } from './EmployeeStatusDialog.js';

export interface EmployeeDirectoryViewProps {
  employees: InternalEmployeeDto[];
  onUpdateStatus: (employeeId: string, status: EmploymentStatus, reason: string) => Promise<void>;
  onAddEmployee?: (newEmployee: InternalEmployeeDto) => void;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({
  employees,
  onUpdateStatus,
  onAddEmployee
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<InternalEmployeeDto | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [designationTitle, setDesignationTitle] = useState('Senior Clinical Operations Manager');
  const [departmentName, setDepartmentName] = useState('Clinical & Hospital Operations');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [managerName, setManagerName] = useState('Dr. Vikram Seth (CEO)');

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: InternalEmployeeDto = {
      id: `00000000-0000-0000-0000-${String(Math.floor(100000000000 + Math.random() * 900000000000))}`,
      employeeCode: `EMP-2026-${String(employees.length + 1).padStart(4, '0')}`,
      firstName,
      lastName,
      workEmail,
      legalEntityId: '00000000-0000-0000-0000-000000000001',
      legalEntityName: 'DocSearch Technologies India Pvt Ltd',
      departmentId: '00000000-0000-0000-0000-000000000002',
      departmentName,
      designationId: '00000000-0000-0000-0000-000000000003',
      designationTitle,
      managerName,
      employmentType,
      employmentStatus: 'ACTIVE',
      startDate: new Date().toISOString().slice(0, 10),
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onAddEmployee) {
      onAddEmployee(newEmp);
    }
    setIsAddModalOpen(false);
    setFirstName('');
    setLastName('');
    setWorkEmail('');
    setSuccessBanner(`Staff member "${firstName} ${lastName}" (${newEmp.employeeCode}) onboarded successfully!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '12px', padding: '16px 20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👥</span> Internal Staff & Corporate Employee Directory ({employees.length})
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '2px' }}>
            Corporate staff records, department affiliations, reporting manager chains, and employment lifecycles
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
          ➕ Onboard / Add New Staff
        </Button>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successBanner}
        </div>
      )}

      {/* Directory Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Code</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead>Work Email</TableHead>
                <TableHead>Designation & Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.75rem', color: '#38BDF8' }}>
                    {emp.employeeCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                      {emp.firstName} {emp.lastName}
                    </strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {emp.workEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {emp.designationTitle ?? 'Staff'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {emp.departmentName ?? 'General'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{emp.employmentType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {emp.managerName ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        emp.employmentStatus === 'ACTIVE'
                          ? 'success'
                          : emp.employmentStatus === 'ON_LEAVE'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {emp.employmentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      Change Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add New Employee Modal */}
      {isAddModalOpen && (
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
            maxWidth: '580px',
            padding: '24px',
            boxShadow: '0 25px 70px rgba(0,0,0,0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 800, color: '#38BDF8' }}>
                  ➕ Onboard New Internal Staff / Employee
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Create corporate account profile and provision company platform access
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.125rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>FIRST NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>LAST NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Verma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>OFFICIAL WORK EMAIL *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.verma@docsearch.internal"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>DEPARTMENT *</label>
                  <select
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  >
                    <option value="Clinical & Hospital Operations">Clinical & Hospital Operations</option>
                    <option value="Platform & Cloud Engineering">Platform & Cloud Engineering</option>
                    <option value="Legal, Risk & Compliance">Legal, Risk & Compliance</option>
                    <option value="Customer Success & Partner Support">Customer Success & Partner Support</option>
                    <option value="Finance & Invoicing">Finance & Invoicing</option>
                    <option value="Enterprise Sales & Growth">Enterprise Sales & Growth</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>DESIGNATION TITLE *</label>
                  <input
                    type="text"
                    required
                    value={designationTitle}
                    onChange={(e) => setDesignationTitle(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>EMPLOYMENT TYPE</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="CONTRACT">Contract / Consultant</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>REPORTING MANAGER</label>
                  <input
                    type="text"
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
                >
                  ✓ Onboard Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <EmployeeStatusDialog
          employee={selectedEmployee}
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
};
