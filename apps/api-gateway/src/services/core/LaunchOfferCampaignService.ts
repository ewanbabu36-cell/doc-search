import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LAUNCH_OFFER_CONFIG_FILE = path.resolve(__dirname, '../../../data/launch_offer_config.json');

export interface PromotionalCampaignConfig {
  campaignId: string;
  title: string;
  subtitle: string;
  badgeText: string;
  targetSeats: number;
  claimedBaseline: number;
  offerEndDate: string;
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
  updatedAt: new Date().toISOString(),
  updatedBy: 'Founder (MERAJ SHARIF)'
};

export class LaunchOfferCampaignService {
  private inMemoryCampaign: PromotionalCampaignConfig;

  constructor() {
    this.inMemoryCampaign = this.loadFromDisk();
  }

  private loadFromDisk(): PromotionalCampaignConfig {
    try {
      if (fs.existsSync(LAUNCH_OFFER_CONFIG_FILE)) {
        const raw = fs.readFileSync(LAUNCH_OFFER_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_PROMOTIONAL_CAMPAIGN,
          ...parsed
        };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_PROMOTIONAL_CAMPAIGN };
  }

  private async saveToDisk(campaign: PromotionalCampaignConfig): Promise<void> {
    try {
      const dir = path.dirname(LAUNCH_OFFER_CONFIG_FILE);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(LAUNCH_OFFER_CONFIG_FILE, JSON.stringify(campaign, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[LaunchOfferCampaignService] Disk write warning:', err);
    }
  }

  public getCampaign(): PromotionalCampaignConfig {
    return { ...this.inMemoryCampaign };
  }

  public updateCampaign(
    updates: Partial<PromotionalCampaignConfig>,
    updatedBy = 'DocSearch Founder Command'
  ): PromotionalCampaignConfig {
    const current = this.getCampaign();
    const updated: PromotionalCampaignConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    this.inMemoryCampaign = updated;
    this.saveToDisk(updated);
    return updated;
  }

  public resetToDefaults(updatedBy = 'DocSearch Founder Command'): PromotionalCampaignConfig {
    const updated = {
      ...DEFAULT_PROMOTIONAL_CAMPAIGN,
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    this.inMemoryCampaign = updated;
    this.saveToDisk(updated);
    return updated;
  }
}

export const launchOfferCampaignService = new LaunchOfferCampaignService();
