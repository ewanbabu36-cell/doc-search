import { eq, desc, ensureDatabaseReady, getDatabaseStatus } from '@docsearch/database';
import { getDatabase, licenses, type License, type NewLicense } from '@docsearch/database';

const memoryLicenses = new Map<string, License>();

export class LicenseRepository {
  async findMany(dbClient = getDatabase()): Promise<License[]> {
    const memList = Array.from(memoryLicenses.values());
    if (dbClient) {
      try {
        const dbRows = await dbClient.select().from(licenses).orderBy(desc(licenses.createdAt));
        const map = new Map<string, License>();
        for (const r of dbRows) map.set(r.id, r);
        for (const m of memList) if (!map.has(m.id)) map.set(m.id, m);
        return Array.from(map.values());
      } catch {}
    }
    return memList;
  }

  async findById(licenseId: string, dbClient = getDatabase()): Promise<License | null> {
    if (dbClient) {
      try {
        const [lic] = await dbClient
          .select()
          .from(licenses)
          .where(eq(licenses.id, licenseId))
          .limit(1);
        if (lic) return lic;
      } catch {}
    }
    return memoryLicenses.get(licenseId) || null;
  }

  async findByKey(licenseKey: string, dbClient = getDatabase()): Promise<License | null> {
    if (dbClient) {
      try {
        const [lic] = await dbClient
          .select()
          .from(licenses)
          .where(eq(licenses.licenseKey, licenseKey))
          .limit(1);
        if (lic) return lic;
      } catch {}
    }
    for (const m of memoryLicenses.values()) {
      if (m.licenseKey === licenseKey) return m;
    }
    return null;
  }

  async findBySubscriptionId(subscriptionId: string, dbClient = getDatabase()): Promise<License | null> {
    if (dbClient) {
      try {
        const [lic] = await dbClient
          .select()
          .from(licenses)
          .where(eq(licenses.subscriptionId, subscriptionId))
          .orderBy(desc(licenses.createdAt))
          .limit(1);
        if (lic) return lic;
      } catch {}
    }
    for (const m of memoryLicenses.values()) {
      if (m.subscriptionId === subscriptionId) return m;
    }
    return null;
  }

  async findByPartnerId(partnerId: string, dbClient = getDatabase()): Promise<License[]> {
    const memMatches = Array.from(memoryLicenses.values()).filter((l) => l.partnerId === partnerId);
    if (dbClient) {
      try {
        const dbRows = await dbClient
          .select()
          .from(licenses)
          .where(eq(licenses.partnerId, partnerId))
          .orderBy(desc(licenses.createdAt));
        const map = new Map<string, License>();
        for (const r of dbRows) map.set(r.id, r);
        for (const m of memMatches) if (!map.has(m.id)) map.set(m.id, m);
        return Array.from(map.values());
      } catch {}
    }
    return memMatches;
  }

  async findByTenantId(tenantId: string, dbClient = getDatabase()): Promise<License[]> {
    const memMatches = Array.from(memoryLicenses.values()).filter((l) => l.tenantId === tenantId);
    let client = dbClient;
    if (!getDatabaseStatus().ready) {
      try {
        client = await ensureDatabaseReady();
      } catch {}
    }
    if (client) {
      try {
        const found = await client
          .select()
          .from(licenses)
          .where(eq(licenses.tenantId, tenantId))
          .orderBy(desc(licenses.createdAt));
        const map = new Map<string, License>();
        for (const r of found) map.set(r.id, r);
        for (const m of memMatches) if (!map.has(m.id)) map.set(m.id, m);
        return Array.from(map.values());
      } catch {}
    }
    return memMatches;
  }

  async create(data: NewLicense, dbClient = getDatabase()): Promise<License> {
    const now = new Date();
    const record: License = {
      ...(data as any),
      id: data.id || crypto.randomUUID(),
      createdAt: (data as any).createdAt || now,
      updatedAt: (data as any).updatedAt || now
    };
    memoryLicenses.set(record.id, record);

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(licenses).values(data).returning();
        if (created) {
          memoryLicenses.set(created.id, created);
          return created;
        }
      } catch {}
    }
    return record;
  }

  async update(licenseId: string, data: Partial<NewLicense>, dbClient = getDatabase()): Promise<License> {
    const mem = memoryLicenses.get(licenseId);
    if (mem) {
      Object.assign(mem, data, { updatedAt: new Date() });
    }
    if (dbClient) {
      try {
        const [updated] = await dbClient
          .update(licenses)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(licenses.id, licenseId))
          .returning();
        if (updated) {
          memoryLicenses.set(updated.id, updated);
          return updated;
        }
      } catch {}
    }
    if (mem) return mem;
    throw new Error(`License ${licenseId} could not be updated or database client unavailable`);
  }
}

export const licenseRepository = new LicenseRepository();

