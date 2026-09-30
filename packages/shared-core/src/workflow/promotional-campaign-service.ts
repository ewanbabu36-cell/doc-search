export interface PromotionalCampaignConfig {
  campaignId: string;
  title: string;
  subtitle: string;
  badgeText: string;
  targetSeats: number;
  claimedBaseline: number;
  offerEndDate: string; // ISO string format e.g. "2026-09-30T23:59:59"
  planName: string;
  planTier: string;
  originalPriceInr: number;
  discountedPriceInr: number;
  durationMonths: number;
  promoCode: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  allowedFacilityTypes: ('HOSPITAL' | 'CLINIC' | 'PATHOLOGY' | 'PHARMACY')[];
  autoLockOnTargetReached: boolean;
  highlightFeatures: string[];
  updatedAt: string;
  updatedBy: string;
}

export interface CampaignCalculatedMetrics {
  totalTarget: number;
  totalClaimed: number;
  claimedCount: number;
  remainingSeats: number;
  percentClaimed: number;
  percentageClaimed: number;
  isLocked: boolean;
  isExpired: boolean;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  formattedTimeLeft: string;
}

export const PROMOTIONAL_CAMPAIGN_STORAGE_KEY = 'docsearch_launch_promotional_campaign';
export const PROMOTIONAL_CAMPAIGN_EVENT = 'docsearch:promotional_campaign_update';

export const DEFAULT_PROMOTIONAL_CAMPAIGN: PromotionalCampaignConfig = {
  campaignId: 'early-bird-launch-2026',
  title: "Founder's 100 Early-Bird Launch Initiative",
  subtitle: 'First 100 Healthcare Facilities Get 1-Year Free Enterprise Suite!',
  badgeText: 'LIMITED LAUNCH OFFER',
  targetSeats: 100,
  claimedBaseline: 68,
  offerEndDate: '2026-09-30T23:59:59',
  planName: 'Early-Bird Launch Partner License',
  planTier: 'Enterprise Suite (Early-Bird Launch Partner)',
  originalPriceInr: 59999,
  discountedPriceInr: 0,
  durationMonths: 12,
  promoCode: 'LAUNCH100',
  status: 'ACTIVE',
  allowedFacilityTypes: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY'],
  autoLockOnTargetReached: true,
  highlightFeatures: [
    '₹0 Platform & Setup Fee for Full Year 1 (Worth ₹59,999)',
    '100% ABDM M1/M2/M3 National Health Gateway Certified',
    'AI Ambient Voice Scribe 3.0 & E-Prescriptions Included',
    'Full Multi-Department Clinical Operations & LIS/RIS/POS'
  ],
  updatedAt: '2026-09-11T04:00:00Z',
  updatedBy: 'Founder (MERAJ SHARIF)'
};

function getGlobalStorage(): any {
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
  } catch {}
  return null;
}

function dispatchBrowserEvent(eventName: string, detail: any): void {
  try {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).dispatchEvent === 'function') {
      const CustomEventCtor = (globalThis as any).CustomEvent;
      if (CustomEventCtor) {
        (globalThis as any).dispatchEvent(new CustomEventCtor(eventName, { detail }));
      }
    }
  } catch {}
}

/**
 * Retrieve active campaign configuration with fail-safe fallback to defaults
 */
export function getPromotionalCampaign(): PromotionalCampaignConfig {
  const storage = getGlobalStorage();
  if (!storage) {
    return DEFAULT_PROMOTIONAL_CAMPAIGN;
  }
  try {
    const raw = storage.getItem(PROMOTIONAL_CAMPAIGN_STORAGE_KEY);
    if (!raw) return DEFAULT_PROMOTIONAL_CAMPAIGN;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROMOTIONAL_CAMPAIGN,
      ...parsed
    };
  } catch {
    return DEFAULT_PROMOTIONAL_CAMPAIGN;
  }
}

/**
 * Asynchronously fetch promotional campaign from backend API with localStorage sync
 */
export async function fetchPromotionalCampaignRemote(): Promise<PromotionalCampaignConfig> {
  try {
    const res = await fetch('/api/v1/auth/launch-offer');
    if (res.ok) {
      const json = (await res.json()) as any;
      if (json && json.success && json.data) {
        const payload: PromotionalCampaignConfig = {
          ...DEFAULT_PROMOTIONAL_CAMPAIGN,
          ...json.data
        };
        const storage = getGlobalStorage();
        if (storage) {
          storage.setItem(PROMOTIONAL_CAMPAIGN_STORAGE_KEY, JSON.stringify(payload));
        }
        dispatchBrowserEvent(PROMOTIONAL_CAMPAIGN_EVENT, payload);
        return payload;
      }
    }
  } catch {
    // network or node fallback
  }
  return getPromotionalCampaign();
}

/**
 * Save updated campaign configuration to storage, broadcast event, and sync to backend API
 */
export function savePromotionalCampaign(config: PromotionalCampaignConfig): void {
  const payload = {
    ...config,
    updatedAt: new Date().toISOString()
  };

  const storage = getGlobalStorage();
  if (storage) {
    try {
      storage.setItem(PROMOTIONAL_CAMPAIGN_STORAGE_KEY, JSON.stringify(payload));
      dispatchBrowserEvent(PROMOTIONAL_CAMPAIGN_EVENT, payload);
    } catch (err) {
      console.warn('Failed to save promotional campaign to storage:', err);
    }
  }

  // Also push to backend API asynchronously for cross-port / cross-origin synchronization
  if (typeof fetch !== 'undefined') {
    fetch('/api/v1/auth/launch-offer', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }
}

/**
 * Compute real-time seats progress, countdown clock, and lock status
 */
export function calculateCampaignMetrics(
  config: PromotionalCampaignConfig,
  realRegisteredCount?: number
): CampaignCalculatedMetrics {
  let regCount = realRegisteredCount;
  if (typeof regCount !== 'number') {
    try {
      const storage = getGlobalStorage();
      if (storage) {
        const stored = storage.getItem('docsearch_registered_partners');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) regCount = list.length;
        }
      }
    } catch {
      // ignore
    }
  }

  const totalTarget = Math.max(1, config.targetSeats || 100);
  const baseline = Math.max(0, config.claimedBaseline || 0);
  const totalClaimed = Math.min(totalTarget, baseline + Math.max(0, regCount || 0));
  const remainingSeats = Math.max(0, totalTarget - totalClaimed);
  const percentClaimed = Math.min(100, Math.round((totalClaimed / totalTarget) * 100));

  // Time calculations
  const now = Date.now();
  const end = new Date(config.offerEndDate).getTime();
  const diffMs = Math.max(0, end - now);

  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutesLeft = Math.floor((diffMs / (1000 * 60)) % 60);
  const secondsLeft = Math.floor((diffMs / 1000) % 60);

  const isExpired = config.status === 'EXPIRED' || diffMs <= 0;
  const isLocked =
    config.status === 'PAUSED' ||
    isExpired ||
    (config.autoLockOnTargetReached && remainingSeats <= 0);

  const formattedTimeLeft = `${String(daysLeft).padStart(2, '0')}d : ${String(hoursLeft).padStart(2, '0')}h : ${String(minutesLeft).padStart(2, '0')}m : ${String(secondsLeft).padStart(2, '0')}s`;

  return {
    totalTarget,
    totalClaimed,
    claimedCount: totalClaimed,
    remainingSeats,
    percentClaimed,
    percentageClaimed: percentClaimed,
    isLocked,
    isExpired,
    daysLeft,
    hoursLeft,
    minutesLeft,
    secondsLeft,
    formattedTimeLeft
  };
}
