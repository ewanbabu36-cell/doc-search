import { eq, desc } from '@docsearch/database';
import { getDatabase, licenses, type License, type NewLicense } from '@docsearch/database';

const memoryLicenses: License[] = [];

export class LicenseRepository {
  async findMany(dbClient = getDatabase()): Promise<License[]> {
    if (dbClient) {
      try {
        return await dbClient.select().from(licenses).orderBy(desc(licenses.createdAt));
      } catch {}
    }
    return [...memoryLicenses];
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
    return memoryLicenses.find((l) => l.id === licenseId) || null;
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
    return memoryLicenses.find((l) => l.licenseKey === licenseKey) || null;
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
    return memoryLicenses.find((l) => l.subscriptionId === subscriptionId) || null;
  }

  async findByPartnerId(partnerId: string, dbClient = getDatabase()): Promise<License[]> {
    if (dbClient) {
      try {
        return await dbClient
          .select()
          .from(licenses)
          .where(eq(licenses.partnerId, partnerId))
          .orderBy(desc(licenses.createdAt));
      } catch {}
    }
    return memoryLicenses.filter((l) => l.partnerId === partnerId);
  }

  async findByTenantId(tenantId: string, dbClient = getDatabase()): Promise<License[]> {
    if (dbClient) {
      try {
        return await dbClient
          .select()
          .from(licenses)
          .where(eq(licenses.tenantId, tenantId))
          .orderBy(desc(licenses.createdAt));
      } catch {}
    }
    return memoryLicenses.filter((l) => l.tenantId === tenantId);
  }

  async create(data: NewLicense, dbClient = getDatabase()): Promise<License> {
    if (dbClient) {
      try {
        const [created] = await dbClient.insert(licenses).values(data).returning();
        if (created) return created;
      } catch (err) {
        throw err;
      }
    }

    const created: License = {
      id: data.id || crypto.randomUUID(),
      licenseKey: data.licenseKey,
      partnerId: data.partnerId,
      tenantId: data.tenantId,
      subscriptionId: data.subscriptionId,
      planId: data.planId,
      licenseType: data.licenseType ?? 'COMMERCIAL',
      status: data.status ?? 'ACTIVE',
      activationStatus: data.activationStatus ?? 'ACTIVATED',
      maxConcurrentUsers: data.maxConcurrentUsers ?? 50,
      maxDoctors: data.maxDoctors ?? 20,
      maxBranches: data.maxBranches ?? 5,
      issuedAt: data.issuedAt ? new Date(data.issuedAt) : new Date(),
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      expiryDate: new Date(data.expiryDate),
      gracePeriodEnd: data.gracePeriodEnd ? new Date(data.gracePeriodEnd) : null,
      signature: data.signature,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryLicenses.push(created);
    return created;
  }

  async update(licenseId: string, data: Partial<NewLicense>, dbClient = getDatabase()): Promise<License> {
    if (dbClient) {
      try {
        const [updated] = await dbClient
          .update(licenses)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(licenses.id, licenseId))
          .returning();
        if (updated) return updated;
      } catch (err) {
        throw err;
      }
    }

    const idx = memoryLicenses.findIndex((l) => l.id === licenseId);
    if (idx === -1) {
      throw new Error(`License ${licenseId} not found`);
    }
    const existing = memoryLicenses[idx]!;
    const updated: License = Object.assign({}, existing, data, {
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date()
    }) as License;
    memoryLicenses[idx] = updated;
    return updated;
  }
}

export const licenseRepository = new LicenseRepository();
