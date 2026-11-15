import { useEffect } from 'react';

/**
 * Universal Client-Side Data Refresh Bus
 * Dispatches and listens for domain-specific entity mutations (e.g. schedules, price lists, beds)
 * ensuring parent tables auto-refetch immediately on modal save or dialog close without manual F5.
 */

export interface DataRefreshDetail {
  domain: string;
  action?: string | undefined;
  entityId?: string | undefined;
  timestamp: number;
  metadata?: Record<string, unknown> | undefined;
}

const EVENT_NAME = 'docsearch:refresh-data';

export function triggerDataRefresh(domain: string, detail?: Partial<DataRefreshDetail>): void {
  if (typeof window === 'undefined') return;

  const eventDetail: DataRefreshDetail = {
    domain,
    timestamp: Date.now(),
    ...detail
  };

  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: eventDetail }));
  } catch (err) {
    console.warn('[DataRefreshBus] Failed to dispatch refresh event:', err);
  }
}

export function useDataRefreshListener(
  targetDomains: string | string[],
  onRefresh: (detail: DataRefreshDetail) => void | Promise<void>
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const domains = Array.isArray(targetDomains) ? targetDomains : [targetDomains];

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<DataRefreshDetail>;
      const detail = customEvent.detail;
      if (!detail) return;

      if (domains.includes('*') || domains.includes('all') || domains.includes(detail.domain)) {
        try {
          void onRefresh(detail);
        } catch (err) {
          console.error(`[DataRefreshBus] Error in refresh handler for ${detail.domain}:`, err);
        }
      }
    };

    window.addEventListener(EVENT_NAME, handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }, [targetDomains, onRefresh]);
}
