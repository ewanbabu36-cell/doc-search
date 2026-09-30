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
  onNavigateToRoleMatrix?: (() => void) | undefined;
  onDeleteEmployee?: ((employeeId: string) => void) | undefined;
}

export interface GeneratedCredentials {
  employeeCode: string;
  fullName: string;
  loginEmail: string;
  phone?: string | undefined;
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
  onAddEmployee,
  onNavigateToRoleMatrix,
  onDeleteEmployee
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<InternalEmployeeDto | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<GeneratedCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleDeleteEmployee = (emp: InternalEmployeeDto) => {
    if (!window.confirm(`Founder Master Action: Are you sure you want to permanently terminate and remove staff member "${emp.firstName} ${emp.lastName}" (${emp.employeeCode})?`)) {
      return;
    }
    if (onDeleteEmployee) {
      onDeleteEmployee(emp.id);
    }
    setSuccessBanner(`Staff member "${emp.firstName} ${emp.lastName}" (${emp.employeeCode}) terminated and purged from records.`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [designationTitle, setDesignationTitle] = useState('Clinical Operations Lead');
  const [departmentName, setDepartmentName] = useState('Clinical & Hospital Operations');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [managerName, setManagerName] = useState('MERAJ SHARIF (Founder & CEO)');

  // Auth & Credentials State
  const [rbacRole, setRbacRole] = useState('PLATFORM_COMPLIANCE');
  const [passwordOption, setPasswordOption] = useState<'AUTO_GENERATE' | 'EMAIL_INVITE' | 'MANUAL'>('AUTO_GENERATE');
  const [manualPassword, setManualPassword] = useState('');
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
      phone: workPhone || undefined,
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
    setWorkPhone('');
  };

  const handleCopyCredentials = () => {
    if (!generatedCreds) return;
    const text = `DOCSEARCH ENTERPRISE STAFF LOGIN CREDENTIALS
----------------------------------------
Staff Name   : ${generatedCreds.fullName} (${generatedCreds.employeeCode})
Portal URL   : ${generatedCreds.portalUrl}
Login Email  : ${generatedCreds.loginEmail}
${generatedCreds.phone ? `Phone / WA   : ${generatedCreds.phone}\n` : ''}Temp Password: ${generatedCreds.tempPassword}
Assigned Role: ${generatedCreds.roleCode} (${generatedCreds.roleTitle})
First Login  : Mandatory Password Change + 2FA Setup Enforced.
----------------------------------------`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setActionFeedback('Credentials copied to clipboard!');
    setTimeout(() => {
      setCopiedNotification(false);
      setActionFeedback(null);
    }, 3000);
  };

  const handleDownloadCredentials = () => {
    if (!generatedCreds) return;
    const text = `========================================================================
             DOCSEARCH ENTERPRISE - STAFF LOGIN CREDENTIALS
========================================================================
Staff Member  : ${generatedCreds.fullName} (${generatedCreds.employeeCode})
Portal URL    : ${generatedCreds.portalUrl}
Login Email   : ${generatedCreds.loginEmail}
${generatedCreds.phone ? `Phone / WA    : ${generatedCreds.phone}\n` : ''}Temp Password : ${generatedCreds.tempPassword}
Assigned Role : ${generatedCreds.roleCode} (${generatedCreds.roleTitle})
Generated On  : ${new Date().toLocaleString('en-IN', { timeZoneName: 'short' })}

SECURITY MANDATES:
1. Temporary password is valid for single-use initial sign-in.
2. Mandatory password reset is required on first login.
3. Two-Factor Authentication (2FA) setup is strictly enforced.
4. Do not share credentials over public or unencrypted channels.
========================================================================`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocSearch_Credentials_${generatedCreds.employeeCode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setActionFeedback('Credentials file downloaded successfully!');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const escapeHtml = (str: unknown): string => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const handlePrintCredentials = () => {
    if (!generatedCreds) return;
    const printWindow = window.open('', '_blank', 'width=750,height=650');
    if (!printWindow) return;
    const safeCode = escapeHtml(generatedCreds.employeeCode);
    const safeName = escapeHtml(generatedCreds.fullName);
    const safeEmail = escapeHtml(generatedCreds.loginEmail);
    const safePortalUrl = escapeHtml(generatedCreds.portalUrl);
    const safePhone = escapeHtml(generatedCreds.phone);
    const safePassword = escapeHtml(generatedCreds.tempPassword);
    const safeRoleCode = escapeHtml(generatedCreds.roleCode);
    const safeRoleTitle = escapeHtml(generatedCreds.roleTitle);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Staff Credential Slip - ${safeCode}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              padding: 40px;
              max-width: 680px;
              margin: 0 auto;
              background: #fff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #06b6d4;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .brand {
              font-size: 22px;
              font-weight: 900;
              color: #0891b2;
              letter-spacing: -0.5px;
            }
            .badge {
              display: inline-block;
              font-size: 11px;
              font-weight: 700;
              background: #e0f2fe;
              color: #0369a1;
              padding: 3px 8px;
              border-radius: 4px;
              margin-top: 4px;
            }
            .meta {
              text-align: right;
              font-size: 12px;
              color: #64748b;
              line-height: 1.5;
            }
            .card {
              background: #f8fafc;
              border: 1.5px solid #cbd5e1;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13.5px;
            }
            .row:last-child {
              border-bottom: none;
            }
            .label {
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 11.5px;
            }
            .val {
              font-weight: 700;
              color: #0f172a;
            }
            .mono {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }
            .password-box {
              background: #ecfdf5;
              border: 1.5px dashed #10b981;
              color: #047857;
              padding: 6px 14px;
              border-radius: 6px;
              font-size: 16px;
              font-weight: 900;
              letter-spacing: 1px;
            }
            .security {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 14px;
              font-size: 12px;
              color: #1e40af;
              line-height: 1.6;
              margin-bottom: 24px;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">DOCSEARCH TECHNOLOGIES</div>
              <span class="badge">CONFIDENTIAL ACCESS VOUCHER</span>
            </div>
            <div class="meta">
              <div>Ref Code: <strong>${safeCode}</strong></div>
              <div>Issue Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>

          <div class="card">
            <div class="row">
              <span class="label">Staff Member:</span>
              <span class="val">${safeName}</span>
            </div>
            <div class="row">
              <span class="label">Employee Code:</span>
              <span class="val mono">${safeCode}</span>
            </div>
            <div class="row">
              <span class="label">Login Portal:</span>
              <span class="val" style="color: #0284c7;">${safePortalUrl}</span>
            </div>
            <div class="row">
              <span class="label">User ID / Email:</span>
              <span class="val mono">${safeEmail}</span>
            </div>
            ${safePhone ? `
            <div class="row">
              <span class="label">Contact Phone:</span>
              <span class="val">${safePhone}</span>
            </div>` : ''}
            <div class="row">
              <span class="label">Temporary Password:</span>
              <span class="password-box mono">${safePassword}</span>
            </div>
            <div class="row">
              <span class="label">Assigned RBAC Role:</span>
              <span class="val">${safeRoleCode} (${safeRoleTitle})</span>
            </div>
          </div>

          <div class="security">
            <strong>🔒 MANDATORY SECURITY INSTRUCTIONS:</strong><br/>
            &bull; This temporary password is only valid for initial authentication.<br/>
            &bull; You will be prompted to choose a permanent secure password immediately upon first sign-in.<br/>
            &bull; Two-Factor Authentication (Google Authenticator / TOTP / FIDO2) enrollment is compulsory.<br/>
            &bull; For security and compliance, destroy or safely file this slip after logging in.
          </div>

          <div class="footer">
            DocSearch Enterprise HealthTech Platform &bull; Corporate Administration &bull; Strictly Confidential
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setActionFeedback('Print dialog launched!');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleSendWhatsApp = () => {
    if (!generatedCreds) return;
    const message = `*DOCSEARCH ENTERPRISE - STAFF LOGIN CREDENTIALS*

Hello *${generatedCreds.fullName}*,
Welcome to DocSearch Technologies! Your corporate staff account has been provisioned.

🌐 *Login Portal:* ${generatedCreds.portalUrl}
👤 *User ID / Email:* ${generatedCreds.loginEmail}
🔑 *Temporary Password:* ${generatedCreds.tempPassword}
🛡️ *Assigned Role:* ${generatedCreds.roleCode} (${generatedCreds.roleTitle})

🔒 *Security Mandatory:*
Upon your first login, you will be required to change your password and enroll in Two-Factor Authentication (Google Authenticator).

_DocSearch Corporate Administration_`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = generatedCreds.phone ? generatedCreds.phone.replace(/[^0-9]/g, '') : '';
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank');
    setActionFeedback('WhatsApp share opened!');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleSendEmail = () => {
    if (!generatedCreds) return;
    const subject = encodeURIComponent(`Your DocSearch Enterprise Login Credentials (${generatedCreds.employeeCode})`);
    const body = encodeURIComponent(`Dear ${generatedCreds.fullName},

Welcome to DocSearch Technologies! Your internal corporate staff profile has been set up.

Access Details:
----------------------------------------
Login Portal URL   : ${generatedCreds.portalUrl}
User ID / Email    : ${generatedCreds.loginEmail}
Temporary Password : ${generatedCreds.tempPassword}
Assigned Role      : ${generatedCreds.roleCode} (${generatedCreds.roleTitle})
Staff Code         : ${generatedCreds.employeeCode}
----------------------------------------

Security Policy Notice:
On your first sign-in, you will be required to:
1. Update your temporary password to a permanent secure password.
2. Enroll in Two-Factor Authentication (2FA) via Google Authenticator or FIDO2 Security Key.

If you have any questions, please contact the Platform Administration desk.

Warm regards,
DocSearch Corporate Administration
DocSearch Technologies India Pvt Ltd`);

    window.open(`mailto:${generatedCreds.loginEmail}?subject=${subject}&body=${body}`, '_blank');
    setActionFeedback('Email composer opened!');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const activeEmployees = employees.filter((e) => {
    const email = (e.workEmail || '').toLowerCase();
    const first = (e.firstName || '').toUpperCase();
    const last = (e.lastName || '').toUpperCase();
    return !(
      email.includes('alok.sharma') ||
      email.includes('shahalam') ||
      first.includes('ALOK') ||
      first.includes('SHAH') ||
      (last.includes('SHARMA') && first.includes('ALOK'))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '12px', padding: '16px 20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👥</span> Internal Staff & Corporate Employee Directory ({activeEmployees.length})
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '2px' }}>
            Corporate staff records, department affiliations, manager chains, and login credential provisioning
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onNavigateToRoleMatrix && (
            <button
              type="button"
              onClick={onNavigateToRoleMatrix}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid #0284C7',
                color: '#38BDF8',
                borderRadius: '8px',
                padding: '8px 14px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              title="Open Role Matrix & 7 Security Add-ons Studio"
            >
              <span>🛡️</span> Role Matrix Studio (7 Security Rules)
            </button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            ➕ Onboard / Add New Staff
          </Button>
        </div>
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
              {activeEmployees.map((emp) => {
                const isFounder =
                  (emp.firstName?.toUpperCase() === 'MERAJ' && emp.lastName?.toUpperCase() === 'SHARIF') ||
                  emp.workEmail?.toLowerCase() === 'founder@docsearch.health' ||
                  emp.workEmail?.toLowerCase() === 'meraj@docsearch.health' ||
                  Boolean((emp.metadata as any)?.isProtectedFounder);

                return (
                  <TableRow key={emp.id}>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.75rem', color: '#38BDF8' }}>
                      {emp.employeeCode}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                          {emp.firstName} {emp.lastName}
                        </strong>
                        {isFounder && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
                              color: '#38BDF8',
                              border: '1px solid #06B6D4',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)'
                            }}
                          >
                            🛡️ FOUNDER SHIELD (IMMUTABLE)
                          </span>
                        )}
                      </div>
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
                      {isFounder ? (
                        <span
                          title="Founder Profile Protected: Account is permanently locked and cannot be changed, updated, suspended, or removed."
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid #10B981',
                            color: '#6EE7B7',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'not-allowed'
                          }}
                        >
                          🔒 PROTECTED SHIELD
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEmployee(emp)}
                          >
                            Change Status
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(emp)}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid #EF4444',
                              color: '#FCA5A5',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Founder Master Action: Terminate & Purge Staff Record"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
                    PHONE / WHATSAPP NUMBER (10-DIGIT MOBILE)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '10px', color: '#38BDF8', fontWeight: 800, fontSize: '0.8125rem' }}>+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={workPhone}
                      onChange={(e) => {
                        let digits = e.target.value.replace(/\D/g, '');
                        if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                        else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                        setWorkPhone(digits.slice(0, 10));
                      }}
                      style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px 8px 44px', color: '#FFF', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>DEPARTMENT *</label>
                  <select
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  >
                    <option value="Human Resources & People Operations (HR)">Human Resources & People Operations (HR)</option>
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

              {generatedCreds.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                  <span style={{ color: '#94A3B8' }}>PHONE / WHATSAPP:</span>
                  <strong style={{ color: '#F8FAFC' }}>{generatedCreds.phone}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>ASSIGNED RBAC ROLE:</span>
                <Badge variant="primary">{generatedCreds.roleCode}</Badge>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid #06B6D4', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: '#A5F3FC', marginBottom: '14px' }}>
              🔒 <strong>SECURITY ENFORCEMENT:</strong> On first login, staff member will be required to change this temporary password and enroll their Google Authenticator or FIDO2 Security Key.
            </div>

            {/* Multi-Channel Distribution & Export Actions */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Quick Export & Delivery Options
                </span>
                {actionFeedback && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
                    ✓ {actionFeedback}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {/* 1. Save File */}
                <button
                  type="button"
                  onClick={handleDownloadCredentials}
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#38BDF8',
                    border: '1px solid #0284C7',
                    borderRadius: '8px',
                    padding: '8px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Download credentials receipt as a .txt file"
                >
                  <span style={{ fontSize: '1.1rem' }}>💾</span>
                  <span>Save File</span>
                </button>

                {/* 2. Print Slip */}
                <button
                  type="button"
                  onClick={handlePrintCredentials}
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#F1F5F9',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '8px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Print official confidential credential voucher slip"
                >
                  <span style={{ fontSize: '1.1rem' }}>🖨️</span>
                  <span>Print Slip</span>
                </button>

                {/* 3. WhatsApp */}
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#22C55E',
                    border: '1px solid #16A34A',
                    borderRadius: '8px',
                    padding: '8px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Share credentials directly via WhatsApp"
                >
                  <span style={{ fontSize: '1.1rem' }}>💬</span>
                  <span>WhatsApp</span>
                </button>

                {/* 4. Email */}
                <button
                  type="button"
                  onClick={handleSendEmail}
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#A855F7',
                    border: '1px solid #9333EA',
                    borderRadius: '8px',
                    padding: '8px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Send credential email notification via mail client"
                >
                  <span style={{ fontSize: '1.1rem' }}>✉️</span>
                  <span>Send Email</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '14px' }}>
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
