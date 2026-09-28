import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger } from '@docsearch/shared-core';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PURGED_PARTNERS_FILE = path.resolve(__dirname, '../../../data/purged_partners.json');
const logger = createLogger('partner-tombstone-service');

export interface PurgedPartnerTombstone {
  primaryId: string;
  ids: string[];
  emails: string[];
  names: string[];
  tenantIds: string[];
  stagedIds: string[];
  purgedAt: string;
  reason?: string;
}

export const PROTECTED_SYSTEM_TENANTS = new Set([
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '00000000-0000-4000-8000-000000000000'
]);

export class PartnerTombstoneService {
  private purgedTokens = new Set<string>();
  private tombstones: PurgedPartnerTombstone[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private normalize(val?: string | null): string {
    if (!val) return '';
    return String(val).trim().toLowerCase();
  }

  loadFromDisk(): void {
    try {
      if (fs.existsSync(PURGED_PARTNERS_FILE)) {
        const raw = fs.readFileSync(PURGED_PARTNERS_FILE, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.tombstones = list;
          this.purgedTokens.clear();
          for (const item of list) {
            this.indexTombstone(item);
          }
          logger.info(`Loaded ${this.tombstones.length} purged partner tombstone(s) from disk.`);
          return;
        }
      }
    } catch (err) {
      logger.warn('Failed to load purged partner tombstones from disk: ' + String(err));
    }
    this.tombstones = [];
    this.purgedTokens.clear();
  }

  clearAllTombstones(): void {
    this.tombstones = [];
    this.purgedTokens.clear();
    this.saveToDisk();
    logger.info('Cleared all purged partner tombstones from disk and memory cache.');
  }

  private indexTombstone(item: PurgedPartnerTombstone): void {
    if (item.primaryId) {
      this.addToken(item.primaryId);
    }
    if (Array.isArray(item.ids)) {
      for (const id of item.ids) this.addToken(id);
    }
    if (Array.isArray(item.emails)) {
      for (const email of item.emails) this.addToken(email);
    }
    if (Array.isArray(item.names)) {
      for (const name of item.names) this.addToken(name);
    }
    if (Array.isArray(item.tenantIds)) {
      for (const tid of item.tenantIds) this.addToken(tid);
    }
    if (Array.isArray(item.stagedIds)) {
      for (const sid of item.stagedIds) this.addToken(sid);
    }
  }

  private addToken(token?: string | null): void {
    const norm = this.normalize(token);
    if (!norm) return;
    if (PROTECTED_SYSTEM_TENANTS.has(norm)) return;
    this.purgedTokens.add(norm);

    try {
      const hashed = toDeterministicUuid(norm).toLowerCase();
      if (hashed && hashed !== norm && !PROTECTED_SYSTEM_TENANTS.has(hashed)) {
        this.purgedTokens.add(hashed);
      }
    } catch {}
  }

  private async saveToDisk(): Promise<void> {
    try {
      const dir = path.dirname(PURGED_PARTNERS_FILE);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(PURGED_PARTNERS_FILE, JSON.stringify(this.tombstones, null, 2), 'utf-8');
    } catch (err) {
      logger.error('Failed to save purged partner tombstones to disk: ' + String(err));
    }
  }

  /**
   * Check if any identifier (ID, UUID, email, name, tenantId) is tombstoned / purged.
   */
  isPurged(identifier?: string | null): boolean {
    if (!identifier) return false;
    const norm = this.normalize(identifier);
    if (!norm) return false;
    if (PROTECTED_SYSTEM_TENANTS.has(norm)) return false;

    if (this.purgedTokens.has(norm)) {
      return true;
    }

    try {
      const hashed = toDeterministicUuid(norm).toLowerCase();
      if (hashed && !PROTECTED_SYSTEM_TENANTS.has(hashed) && this.purgedTokens.has(hashed)) {
        return true;
      }
    } catch {}

    // Check against individual tombstone fields for names or emails
    for (const t of this.tombstones) {
      if (t.emails && t.emails.some((e) => this.normalize(e) === norm)) {
        return true;
      }
      if (t.ids && t.ids.some((i) => this.normalize(i) === norm)) {
        return true;
      }
      if (t.tenantIds && t.tenantIds.some((tid) => {
        const nTid = this.normalize(tid);
        return !PROTECTED_SYSTEM_TENANTS.has(nTid) && nTid === norm;
      })) {
        return true;
      }
      if (t.stagedIds && t.stagedIds.some((sid) => this.normalize(sid) === norm)) {
        return true;
      }
      if (t.names && t.names.some((n) => this.normalize(n) === norm)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Record an authoritative deletion tombstone.
   */
  recordPurge(params: {
    primaryId: string;
    ids?: string[];
    emails?: string[];
    names?: string[];
    tenantIds?: string[];
    stagedIds?: string[];
    reason?: string;
  }): void {
    const primaryId = this.normalize(params.primaryId);
    const uniqueIds = Array.from(new Set([primaryId, ...(params.ids || []).map((i) => this.normalize(i)).filter(Boolean)]));
    const uniqueEmails = Array.from(new Set((params.emails || []).map((e) => this.normalize(e)).filter(Boolean)));
    const uniqueNames = Array.from(new Set((params.names || []).map((n) => this.normalize(n)).filter(Boolean)));
    const uniqueTenantIds = Array.from(new Set((params.tenantIds || []).map((t) => this.normalize(t)).filter(Boolean)));
    const uniqueStagedIds = Array.from(new Set((params.stagedIds || []).map((s) => this.normalize(s)).filter(Boolean)));

    // Check if an existing tombstone matches any of these tokens
    const existingIdx = this.tombstones.findIndex((t) =>
      uniqueIds.includes(t.primaryId) ||
      t.ids.some((id) => uniqueIds.includes(id)) ||
      t.emails.some((e) => uniqueEmails.includes(e))
    );

    const tombstone: PurgedPartnerTombstone = {
      primaryId,
      ids: uniqueIds,
      emails: uniqueEmails,
      names: uniqueNames,
      tenantIds: uniqueTenantIds,
      stagedIds: uniqueStagedIds,
      purgedAt: new Date().toISOString(),
      reason: params.reason || 'PERMANENT_CASCADE_PURGE'
    };

    if (existingIdx >= 0) {
      const merged = this.tombstones[existingIdx]!;
      tombstone.ids = Array.from(new Set([...merged.ids, ...tombstone.ids]));
      tombstone.emails = Array.from(new Set([...merged.emails, ...tombstone.emails]));
      tombstone.names = Array.from(new Set([...merged.names, ...tombstone.names]));
      tombstone.tenantIds = Array.from(new Set([...merged.tenantIds, ...tombstone.tenantIds]));
      tombstone.stagedIds = Array.from(new Set([...merged.stagedIds, ...tombstone.stagedIds]));
      this.tombstones[existingIdx] = tombstone;
    } else {
      this.tombstones.push(tombstone);
    }

    this.indexTombstone(tombstone);
    this.saveToDisk();

    logger.info(`Recorded tombstone for purged partner: "${primaryId}" (${uniqueEmails.join(', ')})`);
  }

  /**
   * Clear tombstone if a partner is explicitly re-created with new credentials.
   */
  clearTombstone(identifier: string): void {
    const norm = this.normalize(identifier);
    if (!norm) return;

    this.tombstones = this.tombstones.filter((t) => {
      const match =
        t.primaryId === norm ||
        t.ids.includes(norm) ||
        t.emails.includes(norm) ||
        t.tenantIds.includes(norm);
      return !match;
    });

    this.purgedTokens.clear();
    for (const item of this.tombstones) {
      this.indexTombstone(item);
    }
    this.saveToDisk();
  }

  getAllTombstones(): PurgedPartnerTombstone[] {
    return [...this.tombstones];
  }
}

export const partnerTombstoneService = new PartnerTombstoneService();
