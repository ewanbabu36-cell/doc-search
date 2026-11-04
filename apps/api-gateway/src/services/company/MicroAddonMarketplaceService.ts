import { createLogger, AppError, ErrorCode } from '@docsearch/shared-core';

const logger = createLogger('micro-addon-marketplace');

export interface MicroAddonCatalogItem {
  id: string;
  featureKey: string;
  name: string;
  tagline: string;
  category: 'CLINICAL_AI' | 'COMMUNICATION' | 'HARDWARE_KIOSK' | 'INPATIENT_SURGICAL' | 'DIAGNOSTICS';
  monthlyPriceInr: number;
  yearlyPriceInr: number;
  marketCompetitorPriceMonthlyInr: number;
  icon: string;
  includedInFreeLaunch: boolean;
  activeSubscriberCount: number;
}

export interface PartnerAddonSubscription {
  partnerId: string;
  addonId: string;
  featureKey: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME_FREE';
  pricePaidInr: number;
  subscribedAt: string;
  renewedAt: string;
}

const DEFAULT_CATALOG: MicroAddonCatalogItem[] = [
  {
    id: 'ADDON-AI-SCRIBE',
    featureKey: 'FEAT_AI_SCRIBE',
    name: 'Ambient AI Clinical Scribe',
    tagline: 'Real-time multi-lingual doctor-patient consultation to structured E-Rx',
    category: 'CLINICAL_AI',
    monthlyPriceInr: 199,
    yearlyPriceInr: 1999,
    marketCompetitorPriceMonthlyInr: 2500,
    icon: '🎙️',
    includedInFreeLaunch: false,
    activeSubscriberCount: 142
  },
  {
    id: 'ADDON-WHATSAPP-BOT',
    featureKey: 'FEAT_WHATSAPP_BOT',
    name: 'Interactive WhatsApp Clinic Concierge',
    tagline: '2-way token confirmation, reschedule, and automated "Meri Parchi" PDF delivery',
    category: 'COMMUNICATION',
    monthlyPriceInr: 99,
    yearlyPriceInr: 999,
    marketCompetitorPriceMonthlyInr: 1500,
    icon: '💬',
    includedInFreeLaunch: false,
    activeSubscriberCount: 310
  },
  {
    id: 'ADDON-SMART-KIOSK',
    featureKey: 'FEAT_SMART_KIOSK',
    name: 'Waiting Room TV Kiosk & Voice Chime',
    tagline: 'Full-screen waiting room token calling with Web Speech audio announcements',
    category: 'HARDWARE_KIOSK',
    monthlyPriceInr: 99,
    yearlyPriceInr: 999,
    marketCompetitorPriceMonthlyInr: 1200,
    icon: '📺',
    includedInFreeLaunch: false,
    activeSubscriberCount: 88
  },
  {
    id: 'ADDON-OT-SURGERY',
    featureKey: 'FEAT_OT_SURGERY',
    name: 'Operation Theatre & Surgical Safety Suite',
    tagline: 'WHO safe surgery digital checklist, PAC clearance & surgeon scrub rosters',
    category: 'INPATIENT_SURGICAL',
    monthlyPriceInr: 499,
    yearlyPriceInr: 4999,
    marketCompetitorPriceMonthlyInr: 5000,
    icon: '🏥',
    includedInFreeLaunch: false,
    activeSubscriberCount: 34
  },
  {
    id: 'ADDON-BLOOD-BANK',
    featureKey: 'FEAT_BLOOD_BANK',
    name: 'Blood Bank Transfusion Safety Interlock',
    tagline: 'ABO/Rh compatibility engine, donor management & bedside anti-hemolytic barrier',
    category: 'INPATIENT_SURGICAL',
    monthlyPriceInr: 499,
    yearlyPriceInr: 4999,
    marketCompetitorPriceMonthlyInr: 5000,
    icon: '🩸',
    includedInFreeLaunch: false,
    activeSubscriberCount: 22
  },
  {
    id: 'ADDON-TELE-CONSULT',
    featureKey: 'FEAT_TELE_CONSULT',
    name: 'HD Encrypted Tele-Consultation Room',
    tagline: 'WebRTC video room with integrated bedside prescription scratchpad',
    category: 'CLINICAL_AI',
    monthlyPriceInr: 149,
    yearlyPriceInr: 1499,
    marketCompetitorPriceMonthlyInr: 1800,
    icon: '📹',
    includedInFreeLaunch: false,
    activeSubscriberCount: 95
  }
];

// In-memory partner addon subscriptions registry
const partnerAddons = new Map<string, PartnerAddonSubscription[]>();

export class MicroAddonMarketplaceService {
  private catalog: MicroAddonCatalogItem[] = [...DEFAULT_CATALOG];

  public getCatalog(): MicroAddonCatalogItem[] {
    return this.catalog;
  }

  public addCatalogItem(item: Omit<MicroAddonCatalogItem, 'activeSubscriberCount'>): MicroAddonCatalogItem {
    const newItem: MicroAddonCatalogItem = {
      ...item,
      activeSubscriberCount: 0
    };
    this.catalog.push(newItem);
    logger.info(`New micro-addon registered: ${newItem.name} (${newItem.featureKey})`);
    return newItem;
  }

  public getPartnerSubscriptions(partnerId: string): PartnerAddonSubscription[] {
    return partnerAddons.get(partnerId) || [];
  }

  public subscribeAddon(params: {
    partnerId: string;
    addonId: string;
    billingCycle?: 'MONTHLY' | 'YEARLY' | 'LIFETIME_FREE' | undefined;
    isFreeGrant?: boolean | undefined;
  }): PartnerAddonSubscription {
    const { partnerId, addonId, billingCycle = 'MONTHLY', isFreeGrant = false } = params;
    const addon = this.catalog.find((a) => a.id === addonId);
    if (!addon) {
      throw new AppError({
        message: `Addon ${addonId} not found in catalog.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const currentSubs = partnerAddons.get(partnerId) || [];
    const existingIndex = currentSubs.findIndex((s) => s.addonId === addonId);

    const price = isFreeGrant
      ? 0
      : billingCycle === 'YEARLY'
      ? addon.yearlyPriceInr
      : addon.monthlyPriceInr;

    const subRecord: PartnerAddonSubscription = {
      partnerId,
      addonId: addon.id,
      featureKey: addon.featureKey,
      status: 'ACTIVE',
      billingCycle: isFreeGrant ? 'LIFETIME_FREE' : billingCycle,
      pricePaidInr: price,
      subscribedAt: new Date().toISOString(),
      renewedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      currentSubs[existingIndex] = subRecord;
    } else {
      currentSubs.push(subRecord);
      addon.activeSubscriberCount += 1;
    }

    partnerAddons.set(partnerId, currentSubs);
    logger.info(`Partner ${partnerId} subscribed to addon ${addon.name} (${subRecord.billingCycle}) at ₹${price}`);
    return subRecord;
  }

  public toggleAddonStatus(partnerId: string, addonId: string, status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'): PartnerAddonSubscription {
    const currentSubs = partnerAddons.get(partnerId) || [];
    const target = currentSubs.find((s) => s.addonId === addonId);
    if (!target) {
      throw new AppError({
        message: `Subscription for addon ${addonId} not found for partner ${partnerId}.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    target.status = status;
    partnerAddons.set(partnerId, currentSubs);
    logger.info(`Partner ${partnerId} addon ${addonId} status toggled to ${status}`);
    return target;
  }
}

export const microAddonMarketplaceService = new MicroAddonMarketplaceService();
