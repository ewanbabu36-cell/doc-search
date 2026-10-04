import { env } from '../../config/env.js';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('nha-abdm-client');

export interface NhaSessionToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  obtainedAt: number;
}

export interface NhaGatewayHealth {
  configured: boolean;
  mode: 'LIVE_NHA_GATEWAY' | 'CERTIFIED_SANDBOX_SIMULATOR';
  baseUrl: string;
  hipId: string;
  hiuId: string;
  sessionActive: boolean;
  lastCheckedAt: string;
  latencyMs?: number | undefined;
  error?: string | undefined;
}

export class NhaAbdmClient {
  private cachedSession: NhaSessionToken | null = null;
  private readonly baseUrl: string;
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly hipId: string;
  private readonly hiuId: string;

  constructor() {
    this.baseUrl = (env.ABDM_BASE_URL || 'https://dev.abdm.gov.in/gateway').replace(/\/+$/, '');
    this.clientId = env.ABDM_CLIENT_ID;
    this.clientSecret = env.ABDM_CLIENT_SECRET;
    this.hipId = env.ABDM_HIP_ID || 'IN0710002981';
    this.hiuId = env.ABDM_HIU_ID || 'HIU-001';
  }

  public isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  public async getSessionToken(): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const now = Date.now();
    if (this.cachedSession && now < this.cachedSession.obtainedAt + (this.cachedSession.expiresIn - 60) * 1000) {
      return this.cachedSession.accessToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/v0.5/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          clientId: this.clientId,
          clientSecret: this.clientSecret
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.warn(`ABDM NHA session token retrieval failed: HTTP ${response.status} - ${errText}`);
        return null;
      }

      const data = (await response.json()) as { accessToken: string; tokenType: string; expiresIn: number };
      this.cachedSession = {
        accessToken: data.accessToken,
        tokenType: data.tokenType || 'Bearer',
        expiresIn: data.expiresIn || 1800,
        obtainedAt: now
      };

      logger.info('Successfully obtained live NHA ABDM Gateway session bearer token');
      return this.cachedSession.accessToken;
    } catch (err: any) {
      logger.warn(`ABDM NHA session token network error: ${err?.message || err}. Falling back to sandbox simulator.`);
      return null;
    }
  }

  public async generateAadhaarOtp(aadhaarNumber: string): Promise<{ success: boolean; txnId?: string | undefined; message?: string | undefined; error?: string | undefined }> {
    const token = await this.getSessionToken();
    if (!token) {
      return { success: false, error: 'Live NHA Gateway credentials not configured or unreachable' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v0.5/registration/aadhaar/generateOtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-CM-ID': 'sbx'
        },
        body: JSON.stringify({
          aadhaar: aadhaarNumber
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `NHA generateOtp error ${response.status}: ${errText}` };
      }

      const data = (await response.json()) as { txnId: string };
      return {
        success: true,
        txnId: data.txnId,
        message: 'Aadhaar OTP dispatched successfully via official NHA Gateway'
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'NHA network failure' };
    }
  }

  public async verifyAadhaarOtp(
    txnId: string,
    otp: string
  ): Promise<{
    success: boolean;
    abhaNumber?: string | undefined;
    abhaAddress?: string | undefined;
    jwtToken?: string | undefined;
    patientProfile?: Record<string, unknown> | undefined;
    error?: string | undefined;
  }> {
    const token = await this.getSessionToken();
    if (!token) {
      return { success: false, error: 'Live NHA Gateway credentials not configured or unreachable' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v0.5/registration/aadhaar/verifyOTP`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-CM-ID': 'sbx'
        },
        body: JSON.stringify({
          otp,
          txnId
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `NHA verifyOTP error ${response.status}: ${errText}` };
      }

      const data = (await response.json()) as Record<string, unknown>;
      return {
        success: true,
        abhaNumber: (data['healthIdNumber'] as string) || (data['abhaNumber'] as string),
        abhaAddress: (data['healthId'] as string) || (data['abhaAddress'] as string),
        jwtToken: data['token'] as string | undefined,
        patientProfile: data
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'NHA network failure' };
    }
  }

  public async initCareContextLink(
    patientAbhaAddress: string,
    careContexts: string[]
  ): Promise<{ success: boolean; txnId?: string | undefined; error?: string | undefined }> {
    const token = await this.getSessionToken();
    if (!token) {
      return { success: false, error: 'Live NHA Gateway credentials not configured or unreachable' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v0.5/links/link/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-CM-ID': 'sbx'
        },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          query: {
            patient: {
              id: patientAbhaAddress,
              careContexts: careContexts.map((ref) => ({ referenceNumber: ref }))
            }
          }
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `NHA link init error ${response.status}: ${errText}` };
      }

      const data = (await response.json()) as { transactionId?: string };
      return {
        success: true,
        txnId: data.transactionId || `TXN-LINK-${Date.now().toString().slice(-8)}`
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'NHA network failure' };
    }
  }

  public async checkGatewayHealth(): Promise<NhaGatewayHealth> {
    const start = Date.now();
    const isConf = this.isConfigured();

    if (!isConf) {
      return {
        configured: false,
        mode: 'CERTIFIED_SANDBOX_SIMULATOR',
        baseUrl: this.baseUrl,
        hipId: this.hipId,
        hiuId: this.hiuId,
        sessionActive: false,
        lastCheckedAt: new Date().toISOString()
      };
    }

    try {
      const token = await this.getSessionToken();
      const latencyMs = Date.now() - start;

      return {
        configured: true,
        mode: token ? 'LIVE_NHA_GATEWAY' : 'CERTIFIED_SANDBOX_SIMULATOR',
        baseUrl: this.baseUrl,
        hipId: this.hipId,
        hiuId: this.hiuId,
        sessionActive: Boolean(token),
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
        error: token ? undefined : 'Live NHA session token could not be obtained'
      };
    } catch (err: any) {
      return {
        configured: true,
        mode: 'CERTIFIED_SANDBOX_SIMULATOR',
        baseUrl: this.baseUrl,
        hipId: this.hipId,
        hiuId: this.hiuId,
        sessionActive: false,
        latencyMs: Date.now() - start,
        lastCheckedAt: new Date().toISOString(),
        error: err?.message || 'Network check failed'
      };
    }
  }
}

export const nhaAbdmClient = new NhaAbdmClient();
