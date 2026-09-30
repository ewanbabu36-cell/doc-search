import crypto from 'node:crypto';
import {
  getDatabase,
  auditEvents,
  auditLedgerVerifications,
  desc,
  asc,
  eq,
  and,
  gte,
  lte,
  type AuditEvent,
  type AuditLedgerVerification
} from '@docsearch/database';
import { computeAuditHash, computeLegacyAuditHash, type SessionContext, ScopeGuard } from '@docsearch/auth';
import { createLogger } from '@docsearch/shared-core';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

const logger = createLogger('audit-integrity-service');

export interface AuditVerificationResult {
  verificationCode: string;
  tenantId?: string | undefined;
  status: 'VALID' | 'TAMPER_DETECTED' | 'BROKEN_CHAIN' | 'NO_RECORDS';
  totalEventsScanned: number;
  chainedEventsVerified: number;
  lastVerifiedHash?: string | undefined;
  firstTamperedEventId?: string | undefined;
  tamperedDetails?: string | undefined;
  verifiedAt: Date;
  verifiedBy: string;
}

export interface AuditExportOptions {
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  limit?: number | undefined;
}

export interface TamperEvidentExport {
  tenantId: string;
  generatedAt: string;
  totalEvents: number;
  chainIntact: boolean;
  merkleRootHash: string;
  events: AuditEvent[];
  verificationSignature: string;
}

export class AuditIntegrityService {
  /**
   * Scans and cryptographically verifies the SHA-256 hash chain of the audit ledger.
   * Detects modified payloads, broken hashes, dropped records, or out-of-order sequencing.
   */
  async verifyAuditLedger(
    session: SessionContext,
    options: { tenantId?: string | undefined; startDate?: Date | undefined; endDate?: Date | undefined } = {},
    db = getDatabase()
  ): Promise<AuditVerificationResult> {
    const isSuperAdmin = Boolean(session.isSuperAdmin || (session.roles || []).includes('SUPER_ADMIN'));
    const targetTenantId = isSuperAdmin
      ? options.tenantId
      : ScopeGuard.resolveEffectiveQueryScope(session).tenantId;

    const conditions: any[] = [];
    if (targetTenantId) {
      conditions.push(eq(auditEvents.tenantId, targetTenantId));
    }
    if (options.startDate) {
      conditions.push(gte(auditEvents.timestamp, options.startDate));
    }
    if (options.endDate) {
      conditions.push(lte(auditEvents.timestamp, options.endDate));
    }

    const events = await db
      .select()
      .from(auditEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(auditEvents.timestamp), asc(auditEvents.id));

    const verificationCode = `VFY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const verifiedBy = session.actorEmail || session.userId || 'SECURITY_AUDITOR';
    const verifiedAt = new Date();

    if (events.length === 0) {
      const emptyResult: AuditVerificationResult = {
        verificationCode,
        tenantId: targetTenantId,
        status: 'NO_RECORDS',
        totalEventsScanned: 0,
        chainedEventsVerified: 0,
        verifiedAt,
        verifiedBy
      };

      await db.insert(auditLedgerVerifications).values({
        id: crypto.randomUUID(),
        verificationCode,
        tenantId: targetTenantId || null,
        startTimestamp: options.startDate || null,
        endTimestamp: options.endDate || null,
        totalEventsScanned: 0,
        chainedEventsVerified: 0,
        status: 'NO_RECORDS',
        verifiedBy,
        verifiedAt
      });

      return emptyResult;
    }

    let chainedEventsVerified = 0;
    let expectedPreviousHash: string | null = null;
    let tamperDetected = false;
    let brokenChain = false;
    let firstTamperedEventId: string | undefined;
    let tamperedDetails: string | undefined;
    let lastVerifiedHash: string | undefined;

    for (let i = 0; i < events.length; i++) {
      const event = events[i]!;

      // 1. Verify previousHash chaining
      if (i > 0 && expectedPreviousHash !== null) {
        if (event.previousHash !== expectedPreviousHash) {
          brokenChain = true;
          firstTamperedEventId = event.id;
          tamperedDetails = `Broken hash chain at event index ${i} (${event.id}): expected previous_hash '${expectedPreviousHash}', found '${event.previousHash}'`;
          logger.warn('Audit ledger chain broken', { eventId: event.id, details: tamperedDetails });
          break;
        }
      }

      // 2. Verify integrityHash computation against record payload
      const rawPayload = {
        tenantId: event.tenantId || undefined,
        branchId: event.branchId || undefined,
        actorId: event.actorId || undefined,
        eventType: event.eventType,
        resourceType: event.resourceType,
        resourceId: event.resourceId || undefined,
        correlationId: event.correlationId || undefined,
        ipAddress: event.ipAddress || undefined,
        userAgent: event.userAgent || undefined,
        metadata: (event.metadata as Record<string, unknown>) || {},
        previousHash: event.previousHash || undefined,
        timestamp: new Date(event.timestamp)
      };

      let computedHash = computeAuditHash(
        rawPayload,
        event.previousHash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000'
      );

      // Verify that stored integrityHash matches re-computed SHA-256 fingerprint.
      // Support backward-compatible verification for historical pre-normalization records.
      if (event.integrityHash && event.integrityHash !== computedHash) {
        const rawMeta = { ...((event.metadata as Record<string, unknown>) || {}) };
        delete rawMeta['preservedActorId'];
        delete rawMeta['preservedBranchId'];
        delete rawMeta['preservedTenantId'];

        const legacyReplacerHash = computeLegacyAuditHash(
          { ...rawPayload, metadata: rawMeta },
          event.previousHash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000'
        );
        const legacyDirectHash = computeAuditHash(
          { ...rawPayload, metadata: rawMeta },
          event.previousHash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000'
        );

        if (event.integrityHash === legacyReplacerHash) {
          computedHash = legacyReplacerHash;
        } else if (event.integrityHash === legacyDirectHash) {
          computedHash = legacyDirectHash;
        } else {
          tamperDetected = true;
          firstTamperedEventId = event.id;
          tamperedDetails = `Tampered payload detected at event ${event.id}: recorded hash '${event.integrityHash}' does not match re-computed hash '${computedHash}'`;
          logger.error('Audit ledger record tampering detected', { eventId: event.id, details: tamperedDetails });
          break;
        }
      }

      chainedEventsVerified++;
      expectedPreviousHash = event.integrityHash || computedHash;
      lastVerifiedHash = expectedPreviousHash;
    }

    const finalStatus: 'VALID' | 'TAMPER_DETECTED' | 'BROKEN_CHAIN' =
      tamperDetected ? 'TAMPER_DETECTED' : brokenChain ? 'BROKEN_CHAIN' : 'VALID';

    const result: AuditVerificationResult = {
      verificationCode,
      tenantId: targetTenantId,
      status: finalStatus,
      totalEventsScanned: events.length,
      chainedEventsVerified,
      lastVerifiedHash,
      firstTamperedEventId,
      tamperedDetails,
      verifiedAt,
      verifiedBy
    };

    await db.insert(auditLedgerVerifications).values({
      id: crypto.randomUUID(),
      verificationCode,
      tenantId: targetTenantId || null,
      startTimestamp: options.startDate || null,
      endTimestamp: options.endDate || null,
      totalEventsScanned: events.length,
      chainedEventsVerified,
      status: finalStatus,
      lastVerifiedHash: lastVerifiedHash || null,
      firstTamperedEventId: firstTamperedEventId || null,
      tamperedDetails: tamperedDetails || null,
      verifiedBy,
      verifiedAt,
      metadata: { options }
    });

    return result;
  }

  /**
   * Generates a cryptographically sealed and verified audit export with Merkle-like root signature.
   */
  async exportTamperEvidentLog(
    session: SessionContext,
    options: AuditExportOptions = {},
    db = getDatabase()
  ): Promise<TamperEvidentExport> {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;

    const conditions: any[] = [eq(auditEvents.tenantId, tenantId)];
    if (options.startDate) {
      conditions.push(gte(auditEvents.timestamp, options.startDate));
    }
    if (options.endDate) {
      conditions.push(lte(auditEvents.timestamp, options.endDate));
    }

    const limit = Math.min(options.limit || 500, 2000);

    const events = await db
      .select()
      .from(auditEvents)
      .where(and(...conditions))
      .orderBy(asc(auditEvents.timestamp), asc(auditEvents.id))
      .limit(limit);

    // Compute cryptographic Merkle root over all exported events
    const runningHash = crypto.createHash('sha256');
    for (const ev of events) {
      runningHash.update(`${ev.id}:${ev.integrityHash || ''}`);
    }
    const merkleRootHash = events.length > 0 ? runningHash.digest('hex') : 'EMPTY_MERKLE_ROOT_0000000000000000000000000000000000000000000000000000';

    // Verify verification state
    const verification = await this.verifyAuditLedger(
      session,
      {
        tenantId,
        startDate: options.startDate,
        endDate: options.endDate
      },
      db
    );

    const generatedAt = new Date().toISOString();
    const verificationSignature = crypto
      .createHmac('sha256', 'audit_export_verification_salt_2026')
      .update(`${tenantId}:${generatedAt}:${merkleRootHash}:${events.length}`)
      .digest('hex');

    await auditRepository.recordEvent({
      eventType: 'AUDIT_LEDGER_EXPORTED',
      resourceType: 'audit_ledger',
      resourceId: tenantId,
      tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        totalExported: events.length,
        merkleRoot: merkleRootHash,
        verificationStatus: verification.status
      }
    }, session, db);

    return {
      tenantId,
      generatedAt,
      totalEvents: events.length,
      chainIntact: verification.status === 'VALID' || verification.status === 'NO_RECORDS',
      merkleRootHash,
      events,
      verificationSignature
    };
  }

  /**
   * Retrieves audit ledger verification history for a tenant or HQ.
   */
  async getVerificationHistory(
    session: SessionContext,
    limit = 20,
    db = getDatabase()
  ): Promise<AuditLedgerVerification[]> {
    const isSuperAdmin = Boolean(session.isSuperAdmin || (session.roles || []).includes('SUPER_ADMIN'));
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    if (isSuperAdmin) {
      return db
        .select()
        .from(auditLedgerVerifications)
        .orderBy(desc(auditLedgerVerifications.verifiedAt))
        .limit(limit);
    }

    return db
      .select()
      .from(auditLedgerVerifications)
      .where(eq(auditLedgerVerifications.tenantId, scope.tenantId))
      .orderBy(desc(auditLedgerVerifications.verifiedAt))
      .limit(limit);
  }
}

export const auditIntegrityService = new AuditIntegrityService();
