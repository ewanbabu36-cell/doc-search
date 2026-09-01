import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface UserMfaRecord {
  id: string;
  userName: string;
  email: string;
  role: string;
  mfaMethod: 'FIDO2_HARDWARE_KEY' | 'TOTP_AUTHENTICATOR' | 'SMS_OTP' | 'DISABLED';
  mfaStatus: 'ENFORCED' | 'PENDING_SETUP' | 'EXEMPT';
  lastMfaAuth: string;
}

const INITIAL_USERS: UserMfaRecord[] = [
  { id: '1', userName: 'Dr. Vikram Seth', email: 'vikram.seth@docsearch.internal', role: 'SUPER_ADMIN', mfaMethod: 'FIDO2_HARDWARE_KEY', mfaStatus: 'ENFORCED', lastMfaAuth: 'Today 11:15 AM' },
  { id: '2', userName: 'Ananya Sharma', email: 'ananya.sharma@docsearch.internal', role: 'SECURITY_OFFICER', mfaMethod: 'TOTP_AUTHENTICATOR', mfaStatus: 'ENFORCED', lastMfaAuth: 'Today 10:40 AM' },
  { id: '3', userName: 'Dr. Suresh Mehta', email: 'suresh.mehta@apexhospital.in', role: 'HOSPITAL_ADMIN', mfaMethod: 'TOTP_AUTHENTICATOR', mfaStatus: 'ENFORCED', lastMfaAuth: 'Today 09:20 AM' },
  { id: '4', userName: 'Pooja Verma', email: 'pooja.verma@metropolis.in', role: 'CHIEF_PATHOLOGIST', mfaMethod: 'SMS_OTP', mfaStatus: 'PENDING_SETUP', lastMfaAuth: 'Yesterday 04:30 PM' },
  { id: '5', userName: 'Karan Mehra', email: 'karan.mehra@careplus.in', role: 'BILLING_CLERK', mfaMethod: 'TOTP_AUTHENTICATOR', mfaStatus: 'ENFORCED', lastMfaAuth: 'Today 08:50 AM' }
];

export const ZeroTrustMfaPolicyController: React.FC = () => {
  const [users, setUsers] = useState<UserMfaRecord[]>(INITIAL_USERS);
  const [enforceMfaAll, setEnforceMfaAll] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');
  const [allowFido2OnlySuperAdmin, setAllowFido2OnlySuperAdmin] = useState(true);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleResetMfa = (userName: string, email: string) => {
    setUsers(users.map((u) => (u.email === email ? { ...u, mfaStatus: 'PENDING_SETUP' } : u)));
    setSuccessBanner(`MFA token invalidated and setup link dispatched to ${userName} (${email})!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleForceGlobalMfaReset = () => {
    setSuccessBanner('Zero-Trust Policy Updated: All 42 partner administrators prompted for re-authentication on next action!');
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🔐 Zero-Trust Multi-Factor Authentication (MFA / 2FA) Controller
            </h2>
            <Badge variant="success">FIDO2 & TOTP Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Enforce mandatory hardware keys (YubiKey / Passkey), Google Authenticator, and biometric MFA for clinical accounts
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleForceGlobalMfaReset} style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
          ⚡ Force Global MFA Policy Sync
        </Button>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successBanner}
        </div>
      )}

      {/* Policy Configuration Controls */}
      <Card title="Zero-Trust Authentication Policy Rules" padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
            <input
              type="checkbox"
              id="enforce-mfa"
              checked={enforceMfaAll}
              onChange={(e) => setEnforceMfaAll(e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '2px' }}
            />
            <div>
              <label htmlFor="enforce-mfa" style={{ fontWeight: 800, color: '#F8FAFC', cursor: 'pointer', display: 'block' }}>
                Enforce Mandatory MFA for All Roles
              </label>
              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                Blocks login without TOTP authenticator or FIDO2 hardware token across doctors and billing desks.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
            <input
              type="checkbox"
              id="fido2-only"
              checked={allowFido2OnlySuperAdmin}
              onChange={(e) => setAllowFido2OnlySuperAdmin(e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '2px' }}
            />
            <div>
              <label htmlFor="fido2-only" style={{ fontWeight: 800, color: '#F8FAFC', cursor: 'pointer', display: 'block' }}>
                Require Hardware FIDO2 for Super Admins
              </label>
              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                Requires YubiKey or WebAuthn Passkeys for Company Board & Infrastructure engineering logins.
              </span>
            </div>
          </div>

          <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontWeight: 800, color: '#F8FAFC', marginBottom: '4px' }}>
              IDLE SESSION EXPIRY TIMEOUT
            </label>
            <select
              value={sessionTimeoutMinutes}
              onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 8px', color: '#FFF' }}
            >
              <option value="15">15 Minutes (Strict Clinical Ward)</option>
              <option value="30">30 Minutes (Standard Hospital)</option>
              <option value="60">60 Minutes (Administrative Desk)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* User 2FA Status Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User & Email</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Configured Method</TableHead>
                <TableHead>Policy Compliance</TableHead>
                <TableHead>Last MFA Verification</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Security Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{u.userName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{u.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.mfaMethod === 'FIDO2_HARDWARE_KEY' ? 'primary' : u.mfaMethod === 'TOTP_AUTHENTICATOR' ? 'success' : 'warning'}>
                      {u.mfaMethod.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.mfaStatus === 'ENFORCED' ? 'success' : 'warning'}>
                      ● {u.mfaStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{u.lastMfaAuth}</span>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Button variant="outline" size="sm" onClick={() => handleResetMfa(u.userName, u.email)}>
                      🔄 Force Reset MFA
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
