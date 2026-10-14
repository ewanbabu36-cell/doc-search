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
  campaignId: 'lifetime-free-initiative-2026',
  title: "DocSearch 100% Free Lifetime Healthcare Initiative",
  subtitle: "World's First 100% Free Hospital ERP & EMR — Zero Software Fees Forever!",
  badgeText: '100% FREE FOREVER',
  targetSeats: 1000,
  claimedBaseline: 342,
  offerEndDate: '2030-12-31T23:59:59',
  planName: 'Lifetime Free Enterprise License',
  planTier: 'Lifetime Enterprise Suite (₹0 Forever)',
  originalPriceInr: 120000,
  discountedPriceInr: 0,
  durationMonths: 120,
  promoCode: 'FREEFOREVER',
  status: 'ACTIVE',
  allowedFacilityTypes: ['HOSPITAL', 'CLINIC', 'PATHOLOGY', 'PHARMACY'],
  autoLockOnTargetReached: false,
  highlightFeatures: [
    '₹0 Software & Setup Fee Lifetime (Worth ₹1,20,000/yr)',
    '100% Free HIS, OPD/IPD Bed Matrix, OT, LIMS, PACS & Voice EMR',
    'Powered by DocSearch Direct B2B Wholesale Medical & Chemical Sourcing',
    'Zero-Typing Automated Goods Receipt Note (Auto-GRN) Synchronization'
  ],
  updatedAt: '2026-10-14T10:00:00Z',
  updatedBy: 'DocSearch Platform HQ'
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
