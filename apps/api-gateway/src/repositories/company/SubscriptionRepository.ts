import { eq, desc, or } from '@docsearch/database';
import { getDatabase, subscriptions, type Subscription, type NewSubscription } from '@docsearch/database';

const memorySubscriptions: Subscription[] = [];

export class SubscriptionRepository {
  async findMany(dbClient = getDatabase()): Promise<Subscription[]> {
    if (dbClient) {
      try {
        return await dbClient.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
      } catch {}
    }
    return [...memorySubscriptions];
  }

  async findById(subscriptionId: string, dbClient = getDatabase()): Promise<Subscription | null> {
    if (dbClient) {
      try {
        const [sub] = await dbClient
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.id, subscriptionId))
          .limit(1);
        if (sub) return sub;
      } catch {}
    }
    return memorySubscriptions.find((s) => s.id === subscriptionId) || null;
  }

  async findByPartnerId(partnerId: string, dbClient = getDatabase()): Promise<Subscription | null> {
    if (dbClient) {
      try {
        const [sub] = await dbClient
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.partnerId, partnerId))
          .orderBy(desc(subscriptions.createdAt))
          .limit(1);
        if (sub) return sub;
      } catch {}
    }
    return memorySubscriptions.filter((s) => s.partnerId === partnerId).pop() || null;
  }

  async findActiveOrTrial(dbClient = getDatabase()): Promise<Subscription[]> {
    if (dbClient) {
      try {
        return await dbClient
          .select()
          .from(subscriptions)
          .where(
            or(
              eq(subscriptions.status, 'ACTIVE'),
              eq(subscriptions.status, 'TRIAL'),
              eq(subscriptions.status, 'EXPIRING_SOON'),
              eq(subscriptions.status, 'GRACE_PERIOD')
            )
          );
      } catch {}
    }
    return memorySubscriptions.filter((s) => ['ACTIVE', 'TRIAL', 'EXPIRING_SOON', 'GRACE_PERIOD'].includes(s.status));
  }

  async create(data: NewSubscription, dbClient = getDatabase()): Promise<Subscription> {
    if (dbClient) {
      try {
        const [created] = await dbClient.insert(subscriptions).values(data).returning();
        if (created) return created;
      } catch (err) {
        throw err;
      }
    }

    const created: Subscription = {
      id: data.id || crypto.randomUUID(),
      partnerId: data.partnerId,
      productId: data.productId,
      planId: data.planId,
      planVersion: data.planVersion ?? '1.0.0',
      status: data.status ?? 'PENDING',
      billingCycle: data.billingCycle ?? 'MONTHLY',
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      cancellationDate: data.cancellationDate ? new Date(data.cancellationDate) : null,
      cancellationReason: data.cancellationReason ?? null,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memorySubscriptions.push(created);
    return created;
  }

  async update(subscriptionId: string, data: Partial<NewSubscription>, dbClient = getDatabase()): Promise<Subscription> {
    if (dbClient) {
      try {
        const [updated] = await dbClient
          .update(subscriptions)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(subscriptions.id, subscriptionId))
          .returning();
        if (updated) return updated;
      } catch (err) {
        throw err;
      }
    }

    const idx = memorySubscriptions.findIndex((s) => s.id === subscriptionId);
    if (idx === -1) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }
    const existing = memorySubscriptions[idx]!;
    const updated: Subscription = Object.assign({}, existing, data, {
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date()
    }) as Subscription;
    memorySubscriptions[idx] = updated;
    return updated;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
