import { env } from '../../config/env.js';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('meta-whatsapp-client');

export interface MetaWhatsAppDeliveryResult {
  success: boolean;
  messageId?: string | undefined;
  mode: 'LIVE_META_CLOUD_API_V18' | 'LOCAL_SANDBOX_SIMULATOR';
  error?: string | undefined;
}

export interface MetaWhatsAppGatewayStatus {
  configured: boolean;
  mode: 'LIVE_META_CLOUD_API_V18' | 'LOCAL_SANDBOX_SIMULATOR';
  apiUrl: string;
  phoneNumberId: string;
  businessAccountId?: string | undefined;
  lastCheckedAt: string;
}

export class MetaWhatsAppClient {
  private readonly apiUrl: string;
  private readonly accessToken: string | undefined;
  private readonly phoneNumberId: string | undefined;
  private readonly businessAccountId: string | undefined;

  constructor() {
    this.apiUrl = (env.META_WA_API_URL || 'https://graph.facebook.com/v18.0').replace(/\/+$/, '');
    this.accessToken = env.META_WA_ACCESS_TOKEN;
    this.phoneNumberId = env.META_WA_PHONE_NUMBER_ID;
    this.businessAccountId = env.META_WA_BUSINESS_ACCOUNT_ID;
  }

  public isConfigured(): boolean {
    return Boolean(this.accessToken && this.phoneNumberId);
  }

  private sanitizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^\d]/g, '');
    // Default to Indian country code 91 if 10 digits provided
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    return cleaned;
  }

  private async postToGraphApi(endpoint: string, payload: Record<string, unknown>): Promise<MetaWhatsAppDeliveryResult> {
    if (!this.isConfigured()) {
      return {
        success: true,
        messageId: `wamid.HBgL${Date.now().toString(36)}SIMULATED`,
        mode: 'LOCAL_SANDBOX_SIMULATOR'
      };
    }

    const url = `${this.apiUrl}/${this.phoneNumberId}/${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errBody = await response.text();
        logger.warn(`Meta WhatsApp Graph API error ${response.status}: ${errBody}`);
        return {
          success: false,
          mode: 'LIVE_META_CLOUD_API_V18',
          error: `Meta API HTTP ${response.status}: ${errBody}`
        };
      }

      const data = (await response.json()) as { messages?: Array<{ id: string }> };
      const messageId = data.messages?.[0]?.id || `wamid.${Date.now()}`;
      logger.info(`Successfully dispatched Meta WhatsApp message (ID: ${messageId})`);

      return {
        success: true,
        messageId,
        mode: 'LIVE_META_CLOUD_API_V18'
      };
    } catch (err: any) {
      logger.warn(`Meta WhatsApp network error: ${err?.message || err}. Reverting to local simulator.`);
      return {
        success: false,
        mode: 'LIVE_META_CLOUD_API_V18',
        error: err?.message || 'Network request failed'
      };
    }
  }

  public async sendTextMessage(toPhone: string, text: string): Promise<MetaWhatsAppDeliveryResult> {
    const cleanPhone = this.sanitizePhoneNumber(toPhone);
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: true,
        body: text
      }
    };

    return await this.postToGraphApi('messages', payload);
  }

  public async sendDocumentMessage(
    toPhone: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<MetaWhatsAppDeliveryResult> {
    const cleanPhone = this.sanitizePhoneNumber(toPhone);
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption: caption || filename
      }
    };

    return await this.postToGraphApi('messages', payload);
  }

  public async sendInteractiveButtons(
    toPhone: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<MetaWhatsAppDeliveryResult> {
    const cleanPhone = this.sanitizePhoneNumber(toPhone);
    const formattedButtons = buttons.slice(0, 3).map((btn) => ({
      type: 'reply',
      reply: {
        id: btn.id,
        title: btn.title.slice(0, 20)
      }
    }));

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons: formattedButtons }
      }
    };

    return await this.postToGraphApi('messages', payload);
  }

  public getGatewayStatus(): MetaWhatsAppGatewayStatus {
    const configured = this.isConfigured();
    return {
      configured,
      mode: configured ? 'LIVE_META_CLOUD_API_V18' : 'LOCAL_SANDBOX_SIMULATOR',
      apiUrl: this.apiUrl,
      phoneNumberId: this.phoneNumberId || 'NOT_CONFIGURED',
      businessAccountId: this.businessAccountId,
      lastCheckedAt: new Date().toISOString()
    };
  }
}

export const metaWhatsAppClient = new MetaWhatsAppClient();
