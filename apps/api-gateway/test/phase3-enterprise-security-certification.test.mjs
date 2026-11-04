process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { realAuthService } from '../dist/services/core/RealAuthService.js';
import { founderApprovalRepository } from '../dist/repositories/company/FounderApprovalRepository.js';
import { sessionRevocationService } from '../dist/services/core/SessionRevocationService.js';

describe('Phase 3 Enterprise Security Certification Suite', () => {

  describe('P0: Critical Authentication Hardening & Lifecycle', () => {
    test('1. Weak Alternate Founder Passwords are strictly eliminated', async () => {
      const bannedPasswords = [
        'DocSearch@2026!',
        'DocSearch2026!',
        'admin123',
        '123456',
        'password',
        'admin',
        'root'
      ];

      for (const pass of bannedPasswords) {
        const result = await realAuthService.authenticateUser('founder@docsearch.health', pass);
        assert.equal(result, null, `Banned password '${pass}' must return null and be strictly rejected`);
      }
    });

    test('2. Password Recovery Flow: Token generation, expiration & one-time consumption', async () => {
      const email = 'doctor@docsearch.health';
      
      // Step A: Request password reset
      const resetResult = await realAuthService.requestPasswordReset(email);
      assert.ok(resetResult.dispatched, 'Password reset request must dispatch for valid user');
      assert.ok(resetResult.token, 'A 32-byte (64 hex char) reset token must be generated');
      assert.equal(resetResult.token.length, 64, 'Token must be 64 characters long');

      // Step B: Weak new password rejected
      await assert.rejects(
        async () => {
          await realAuthService.resetPasswordWithToken(resetResult.token, 'weak');
        },
        /at least 8 characters/,
        'Passwords under 8 characters must be rejected'
      );

      // Step C: Invalid token rejected
      await assert.rejects(
        async () => {
          await realAuthService.resetPasswordWithToken('invalid-fake-token-00000000000000000000000000000000', 'ValidNewPass2026!');
        },
        /Invalid or expired/,
        'Tampered or invalid token must be rejected'
      );

      // Step D: Valid password reset
      const resetSuccess = await realAuthService.resetPasswordWithToken(resetResult.token, 'DoctorSecureNewPass2026!');
      assert.equal(resetSuccess, true, 'Valid token and password must succeed');

      // Step E: One-time use enforcement: Reusing same token must fail
      await assert.rejects(
        async () => {
          await realAuthService.resetPasswordWithToken(resetResult.token, 'AnotherNewPass2026!');
        },
        /Invalid or expired/,
        'Reused reset token must fail (single-use guarantee)'
      );

      // Step F: Verify authentication with new password succeeds and old password fails
      const oldAuth = await realAuthService.authenticateUser(email, 'DoctorPass123!');
      assert.equal(oldAuth, null, 'Previous password must no longer authenticate');

      const newAuth = await realAuthService.authenticateUser(email, 'DoctorSecureNewPass2026!');
      assert.ok(newAuth, 'New password must authenticate successfully');
      assert.equal(newAuth.email, email);

      // Restore original password for ongoing test suite parity
      await realAuthService.changePassword(email, 'DoctorSecureNewPass2026!', 'DoctorPass123!');
    });

    test('3. Universal Session Revocation Across Devices', async () => {
      // Invalidate sessions for doctor
      const doctorId = 'aaaa1111-8492-4aaa-8aaa-849208492001';
      await sessionRevocationService.revokeUserSessions(doctorId);
      
      const isRevoked = await sessionRevocationService.isUserRevoked(doctorId);
      assert.equal(isRevoked, true, 'User sessions must be marked as revoked');
    });
  });

  describe('P2: Dual-Control Maker-Checker Institutional Governance', () => {
    test('4. Maker-Checker Segregation of Duties: Submitter cannot self-approve financial action', async () => {
      const makerEmail = 'founder@docsearch.health';
      
      // Submit a sensitive financial request
      const request = await founderApprovalRepository.submitRequest({
        entityType: 'BANKING_CHANGE',
        taskTitle: 'Institutional Escrow Disbursal Account Update',
        submitterName: 'Meraj Sharif',
        submitterEmail: makerEmail,
        submitterRole: 'FOUNDER',
        payloadData: {
          accountNumber: '9988776655443322',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank Ltd'
        },
        isFounder: true
      });

      assert.ok(request, 'Request must be recorded in database');
      assert.equal(request.approvalStatus, 'PENDING_FOUNDER_APPROVAL', 'Financial action must NOT auto-approve even if submitted by founder');

      // Attempt self-approval (Maker == Checker)
      await assert.rejects(
        async () => {
          await founderApprovalRepository.approveRequest(request.id, makerEmail, 'Self-approving my own bank account change');
        },
        (err) => {
          assert.equal(err.statusCode, 403, 'Must return 403 Forbidden on self-approval');
          assert.match(err.message, /Maker-Checker dual authorization policy violation/, 'Must identify Maker-Checker violation');
          return true;
        },
        'Maker attempting to self-approve financial request must be rejected'
      );

      // Distinct Checker approves
      const distinctCheckerEmail = 'compliance-officer@docsearch.health';
      const approved = await founderApprovalRepository.approveRequest(
        request.id,
        distinctCheckerEmail,
        'Verified corporate board resolution and IFSC documentation'
      );

      assert.ok(approved.success, 'Distinct checker must successfully approve request');
      assert.equal(approved.data.approvalStatus, 'APPROVED_BY_FOUNDER');
      assert.equal(approved.data.approvedByEmail, distinctCheckerEmail);
    });
  });
});
