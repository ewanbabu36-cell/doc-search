import { eq, desc } from '@docsearch/database';
import { getDatabase, subscriptions, type Subscription } from '@docsearch/database';

const memorySubscriptions: Subscription[] = [
  {
    id: 'sub_001',
    partnerId: '11111111-1111-4111-8111-111111111111',
    productId: 'prod_001',
    planId: 'plan_001',
    planVersion: '1.0.0',
    status: 'ACTIVE',
    billingCycle: 'MONTHLY',
    startDate: new Date(),
    renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    endDate: null,
    cancellationDate: null,
    cancellationReason: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

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
}

export const subscriptionRepository = new SubscriptionRepository();
