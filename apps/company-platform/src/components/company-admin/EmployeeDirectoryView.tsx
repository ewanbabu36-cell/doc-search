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

export interface GeneratedCredentials {
  employeeCode: string;
  fullName: string;
  loginEmail: string;
  roleTitle: string;
  roleCode: string;
  tempPassword: string;
  portalUrl: string;
  forceResetFirstLogin: boolean;
  mfaEnforced: boolean;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({
  employees,
  onUpdateStatus,
  onAddEmployee
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<InternalEmployeeDto | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<GeneratedCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [designationTitle, setDesignationTitle] = useState('Clinical Operations Lead');
  const [departmentName, setDepartmentName] = useState('Clinical & Hospital Operations');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [managerName, setManagerName] = useState('Dr. Vikram Seth (CEO)');

  // Auth & Credentials State
  const [rbacRole, setRbacRole] = useState('PLATFORM_COMPLIANCE');
  const [passwordOption, setPasswordOption] = useState<'AUTO_GENERATE' | 'EMAIL_INVITE' | 'MANUAL'>('AUTO_GENERATE');
  const [manualPassword, setManualPassword] = useState('DocSearch@2026#Secure');
  const [forceResetFirstLogin, setForceResetFirstLogin] = useState(true);
  const [mfaEnforced, setMfaEnforced] = useState(true);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let result = 'Doc#';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const empCode = `EMP-2026-${String(employees.length + 1).padStart(4, '0')}`;
    const generatedPass = passwordOption === 'AUTO_GENERATE' ? generateRandomPassword() : manualPassword;

    const newEmp: InternalEmployeeDto = {
      id: `00000000-0000-0000-0000-${String(Math.floor(100000000000 + Math.random() * 900000000000))}`,
      employeeCode: empCode,
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
      metadata: {
        assignedRole: rbacRole,
        forceResetFirstLogin,
        mfaEnforced
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onAddEmployee) {
      onAddEmployee(newEmp);
    }

    // Set generated credentials for receipt modal
    setGeneratedCreds({
      employeeCode: empCode,
      fullName: `${firstName} ${lastName}`,
      loginEmail: workEmail,
      roleTitle: designationTitle,
      roleCode: rbacRole,
      tempPassword: generatedPass,
      portalUrl: 'http://localhost:5174',
      forceResetFirstLogin,
      mfaEnforced
    });

    setSuccessBanner(`Staff member "${firstName} ${lastName}" (${empCode}) onboarded and credentials generated!`);
    setTimeout(() => setSuccessBanner(null), 6000);

    setIsAddModalOpen(false);
    setFirstName('');
    setLastName('');
    setWorkEmail('');
  };

  const handleCopyCredentials = () => {
    if (!generatedCreds) return;
    const text = `DOCSEARCH ENTERPRISE STAFF LOGIN CREDENTIALS
----------------------------------------
Staff Name   : ${generatedCreds.fullName} (${generatedCreds.employeeCode})
Portal URL   : ${generatedCreds.portalUrl}
Login Email  : ${generatedCreds.loginEmail}
Temp Password: ${generatedCreds.tempPassword}
Assigned Role: ${generatedCreds.roleCode} (${generatedCreds.roleTitle})
First Login  : Mandatory Password Change + 2FA Setup Enforced.
----------------------------------------`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
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
            Corporate staff records, department affiliations, manager chains, and login credential provisioning
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
                <TableHead>Work Email & Login ID</TableHead>
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

      {/* Add New Staff & Password Generation Modal */}
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
            maxWidth: '640px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '26px',
            boxShadow: '0 25px 70px rgba(0,0,0,0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#38BDF8' }}>
                  ➕ Onboard Staff & Provision User ID / Password
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Create corporate employee profile and generate secure initial login credentials
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

            <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
              {/* Section 1: Staff Profile */}
              <div>
                <span style={{ display: 'block', color: '#06B6D4', fontWeight: 800, fontSize: '0.6875rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                  1. Staff Identity & Organization Info
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>FIRST NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rohit"
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
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                  OFFICIAL WORK EMAIL / USER ID *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rohit.verma@docsearch.internal"
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

              {/* Section 2: Security & Password Provisioning */}
              <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', marginTop: '4px' }}>
                <span style={{ display: 'block', color: '#38BDF8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '10px' }}>
                  2. RBAC Role Assignment & Initial Password Setup
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>ASSIGNED RBAC ROLE *</label>
                    <select
                      value={rbacRole}
                      onChange={(e) => setRbacRole(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                    >
                      <option value="PLATFORM_COMPLIANCE">Platform Compliance & Risk Officer</option>
                      <option value="PLATFORM_SUPER_ADMIN">Platform Super Administrator</option>
                      <option value="CLINICAL_OPERATIONS_LEAD">Clinical Operations Lead</option>
                      <option value="PARTNER_ONBOARDING_LEAD">Hospital Onboarding Specialist</option>
                      <option value="FINANCE_BILLING_LEAD">Finance & Billing Controller</option>
                      <option value="SECURITY_CISO_AUDITOR">DPO & Security Auditor</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PASSWORD METHOD</label>
                    <select
                      value={passwordOption}
                      onChange={(e) => setPasswordOption(e.target.value as any)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                    >
                      <option value="AUTO_GENERATE">⚡ Auto-Generate Temporary Password</option>
                      <option value="MANUAL">🔑 Manual Initial Password</option>
                      <option value="EMAIL_INVITE">✉️ Send 24h Email Activation Link</option>
                    </select>
                  </div>
                </div>

                {passwordOption === 'MANUAL' && (
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>SET INITIAL PASSWORD *</label>
                    <input
                      type="text"
                      required
                      value={manualPassword}
                      onChange={(e) => setManualPassword(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#10B981', fontFamily: 'monospace', fontWeight: 700 }}
                    />
                  </div>
                )}

                {/* Security Flags */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="force-reset"
                      checked={forceResetFirstLogin}
                      onChange={(e) => setForceResetFirstLogin(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <label htmlFor="force-reset" style={{ color: '#CBD5E1', cursor: 'pointer', fontSize: '0.75rem' }}>
                      Force Password Reset on 1st Login
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="mfa-enforce"
                      checked={mfaEnforced}
                      onChange={(e) => setMfaEnforced(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <label htmlFor="mfa-enforce" style={{ color: '#CBD5E1', cursor: 'pointer', fontSize: '0.75rem' }}>
                      Enforce Mandatory 2FA Setup
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 22px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)' }}
                >
                  ✓ Onboard & Generate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Credentials Receipt Modal */}
      {generatedCreds && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.9)',
          backdropFilter: 'blur(10px)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            border: '2px solid #10B981',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '540px',
            padding: '26px',
            boxShadow: '0 25px 80px rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                ✓
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 900, color: '#10B981' }}>
                  Staff Account & Login Credentials Provisioned!
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Share these temporary credentials securely with the employee.
                </span>
              </div>
            </div>

            {/* Credential Slip Card */}
            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155', padding: '16px', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>STAFF MEMBER:</span>
                <strong style={{ color: '#F8FAFC' }}>{generatedCreds.fullName} ({generatedCreds.employeeCode})</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>LOGIN PORTAL URL:</span>
                <a href={generatedCreds.portalUrl} target="_blank" rel="noreferrer" style={{ color: '#38BDF8', fontWeight: 700, textDecoration: 'none' }}>
                  {generatedCreds.portalUrl}
                </a>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>USER ID / LOGIN EMAIL:</span>
                <strong style={{ color: '#06B6D4', fontFamily: 'monospace' }}>{generatedCreds.loginEmail}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>TEMPORARY PASSWORD:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ color: '#10B981', fontFamily: 'monospace', fontSize: '0.9375rem' }}>
                    {showPassword ? generatedCreds.tempPassword : '••••••••••••'}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>ASSIGNED RBAC ROLE:</span>
                <Badge variant="primary">{generatedCreds.roleCode}</Badge>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid #06B6D4', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: '#A5F3FC', marginBottom: '16px' }}>
              🔒 <strong>SECURITY ENFORCEMENT:</strong> On first login, staff member will be required to change this temporary password and enroll their Google Authenticator or FIDO2 Security Key.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleCopyCredentials}
                style={{
                  backgroundColor: copiedNotification ? '#10B981' : '#06B6D4',
                  color: '#070C16',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: 900,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {copiedNotification ? '✓ Copied to Clipboard!' : '📋 Copy All Login Details'}
              </button>

              <button
                type="button"
                onClick={() => setGeneratedCreds(null)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Done
              </button>
            </div>
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
