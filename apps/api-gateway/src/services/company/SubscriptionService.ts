import { subscriptionRepository } from '../../repositories/company/SubscriptionRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase, type Subscription } from '@docsearch/database';
import { AppError } from '@docsearch/shared-core';

export class SubscriptionService {
  async getSubscriptions(session: SessionContext): Promise<Subscription[]> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return subscriptionRepository.findMany(tx);
    });
  }

  async getSubscriptionById(id: string, session: SessionContext): Promise<Subscription> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const sub = await subscriptionRepository.findById(id, tx);
      if (!sub) {
        throw AppError.notFound(`Subscription ${id} not found`);
      }
      return sub;
    });
  }
}

export const subscriptionService = new SubscriptionService();
