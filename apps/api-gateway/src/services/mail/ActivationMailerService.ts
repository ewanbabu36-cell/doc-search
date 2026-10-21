/**
 * DOC SEARCH — Universal Multi-Industry Activation Mailer Service
 * 
 * Generates 24-hour cryptographic one-time activation tokens and dispatches
 * responsive HTML activation emails. Features a local file preview inbox
 * ('data/mail-inbox/') for zero-cost developer testing, with automatic SMTP failover.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { createLogger, resolveIndustryPreset } from '@docsearch/shared-core';

const logger = createLogger('activation-mailer');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../../..');
const MAIL_INBOX_DIR = path.join(ROOT_DIR, 'data/mail-inbox');

export interface ActivationEmailParams {
  tenantId: string;
  legalName: string;
  email: string;
  industryType?: string;
  portalUrl?: string;
  activationToken?: string;
}

export interface ActivationTokenPayload {
  tenantId: string;
  email: string;
  industryType: string;
  expiresAt: number;
}

export class ActivationMailerService {
  private secret: string;

  constructor() {
    this.secret = process.env['JWT_SECRET'] || 'docsearch_master_jwt_secret_dev_32char_key_only';
    this.ensureMailDirectory();
  }

  private ensureMailDirectory(): void {
    try {
      if (!fs.existsSync(MAIL_INBOX_DIR)) {
        fs.mkdirSync(MAIL_INBOX_DIR, { recursive: true });
      }
    } catch (err: any) {
      logger.warn('[MAIL] Failed to create mail inbox directory: ' + err?.message);
    }
  }

  /**
   * Generates a tamper-evident 24-hour activation token.
   */
  generateActivationToken(payload: { tenantId: string; email: string; industryType?: string }): string {
    const tokenData: ActivationTokenPayload = {
      tenantId: payload.tenantId,
      email: payload.email.toLowerCase().trim(),
      industryType: (payload.industryType || 'HEALTHCARE').toUpperCase(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    const serialized = Buffer.from(JSON.stringify(tokenData)).toString('base64url');
    const signature = crypto.createHmac('sha256', this.secret).update(serialized).digest('base64url');
    return `${serialized}.${signature}`;
  }

  /**
   * Verifies an activation token and returns the payload if valid.
   */
  verifyActivationToken(token: string): { valid: boolean; payload?: ActivationTokenPayload; error?: string } {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return { valid: false, error: 'Malformed activation token format' };
    }

    const [serialized, signature] = token.split('.');
    if (!serialized || !signature) {
      return { valid: false, error: 'Missing token segments' };
    }

    const expectedSignature = crypto.createHmac('sha256', this.secret).update(serialized).digest('base64url');
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false, error: 'Invalid activation token signature' };
    }

    try {
      const payload = JSON.parse(Buffer.from(serialized, 'base64url').toString('utf8')) as ActivationTokenPayload;
      if (Date.now() > payload.expiresAt) {
        return { valid: false, error: 'Activation token has expired (24h validity window)' };
      }
      return { valid: true, payload };
    } catch {
      return { valid: false, error: 'Failed to parse activation token payload' };
    }
  }

  /**
   * Builds an industry-branded responsive HTML email.
   */
  buildActivationEmailHtml(params: {
    legalName: string;
    tenantId: string;
    email: string;
    industryName: string;
    badgeIcon: string;
    accentColor: string;
    activationUrl: string;
  }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to DocSearch — Workspace Activated</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC; }
    .container { max-width: 600px; margin: 40px auto; background: #1E293B; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { padding: 32px 24px; background: linear-gradient(135deg, ${params.accentColor}22 0%, #0F172A 100%); text-align: center; border-bottom: 1px solid #334155; }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; background: ${params.accentColor}33; border: 1px solid ${params.accentColor}; color: #FFFFFF; font-size: 13px; font-weight: 700; margin-top: 12px; }
    .body-content { padding: 32px 28px; line-height: 1.6; }
    .h1 { font-size: 22px; font-weight: 700; color: #FFFFFF; margin-bottom: 12px; }
    .p { font-size: 15px; color: #94A3B8; margin-bottom: 20px; }
    .box { background: #0F172A; border-radius: 12px; padding: 18px; border: 1px solid #334155; margin-bottom: 24px; }
    .box-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .box-row:last-child { margin-bottom: 0; }
    .box-label { color: #64748B; font-weight: 600; }
    .box-val { color: #F1F5F9; font-weight: 700; font-family: monospace; }
    .cta-button { display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background: ${params.accentColor}; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 24px; border-radius: 10px; box-shadow: 0 4px 14px ${params.accentColor}66; margin: 12px 0 24px; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #334155; background: #0F172A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ DOC SEARCH ENTERPRISE ERP</div>
      <div class="badge">${params.badgeIcon} ${params.industryName} Workspace</div>
    </div>
    <div class="body-content">
      <div class="h1">Congratulations, ${params.legalName}!</div>
      <div class="p">Your multi-industry appointment & operations workspace has been reviewed and officially approved by the Platform Administrator.</div>
      
      <div class="box">
        <div class="box-row">
          <span class="box-label">Business Name:</span>
          <span class="box-val">${params.legalName}</span>
        </div>
        <div class="box-row">
          <span class="box-label">Tenant ID:</span>
          <span class="box-val">${params.tenantId}</span>
        </div>
        <div class="box-row">
          <span class="box-label">Registered Admin Email:</span>
          <span class="box-val">${params.email}</span>
        </div>
      </div>

      <a href="${params.activationUrl}" class="cta-button">🚀 Activate Account & Set Password</a>

      <div class="p" style="font-size: 13px; color: #64748B;">
        🔒 Security Note: This activation token is cryptographically signed and will expire in 24 hours. If you did not request this account, please ignore this email.
      </div>
    </div>
    <div class="footer">
      © 2026 DocSearch Systems Inc. All rights reserved. • Universal Appointment & Operations ERP Platform
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Dispatches activation email to the business owner.
   * If 'SMTP_HOST' is defined in environment, sends via live SMTP (nodemailer).
   * Automatically persists local preview in 'data/mail-inbox/' for dev testing & audit inspection.
   */
  async dispatchActivationEmail(params: ActivationEmailParams): Promise<{
    success: boolean;
    dispatchMode: 'SMTP' | 'LOCAL_PREVIEW';
    activationToken: string;
    activationUrl: string;
    previewPath?: string;
    messageId?: string;
  }> {
    const token = params.activationToken || this.generateActivationToken({
      tenantId: params.tenantId,
      email: params.email,
      ...(params.industryType ? { industryType: params.industryType } : {})
    });

    const preset = resolveIndustryPreset(params.industryType);
    const baseUrl = params.portalUrl || process.env['PARTNER_PORTAL_URL'] || 'http://localhost:5173';
    const activationUrl = `${baseUrl}/activate?token=${encodeURIComponent(token)}&tenant=${encodeURIComponent(params.tenantId)}`;

    const htmlContent = this.buildActivationEmailHtml({
      legalName: params.legalName,
      tenantId: params.tenantId,
      email: params.email,
      industryName: preset.name,
      badgeIcon: preset.badgeIcon,
      accentColor: preset.accentColor,
      activationUrl
    });

    // 1. Write to local mail preview inbox (100% reliable for dev & testing)
    this.ensureMailDirectory();
    const fileName = `activation-${params.tenantId}-${Date.now()}.html`;
    const filePath = path.join(MAIL_INBOX_DIR, fileName);

    try {
      fs.writeFileSync(filePath, htmlContent, 'utf8');
      logger.info(`[MAIL] Activation email generated for ${params.email}. Local preview saved at: ${filePath}`);
    } catch (err: any) {
      logger.warn('[MAIL] Could not persist local preview email: ' + err?.message);
    }

    // 2. Production SMTP Transport Dispatch
    const smtpHost = process.env['SMTP_HOST'];
    if (smtpHost && smtpHost.trim() !== '') {
      try {
        const smtpPort = Number(process.env['SMTP_PORT'] || 587);
        const isSecure = process.env['SMTP_SECURE'] === 'true' || smtpPort === 465;
        const smtpUser = process.env['SMTP_USER'];
        const smtpPass = process.env['SMTP_PASSWORD'];

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: isSecure,
          ...(smtpUser ? { auth: { user: smtpUser, pass: smtpPass || '' } } : {})
        });

        const fromAddress = process.env['SMTP_FROM'] || 'DocSearch ERP <activation@docsearch.health>';
        const subject = `${preset.badgeIcon} Welcome to DocSearch: Activate Your ${preset.name} Workspace`;

        const info = await transporter.sendMail({
          from: fromAddress,
          to: params.email,
          subject,
          html: htmlContent
        });

        logger.info(`[MAIL] Live SMTP activation email dispatched to ${params.email} (MessageId: ${info.messageId})`);

        return {
          success: true,
          dispatchMode: 'SMTP',
          activationToken: token,
          activationUrl,
          previewPath: filePath,
          messageId: info.messageId
        };
      } catch (smtpErr: any) {
        logger.warn(`[MAIL] Live SMTP transport failed (${smtpErr?.message}), safely falling back to local file inbox.`);
      }
    }

    return {
      success: true,
      dispatchMode: 'LOCAL_PREVIEW',
      activationToken: token,
      activationUrl,
      previewPath: filePath
    };
  }

  /**
   * Returns list of dispatched emails from local inbox.
   */
  getDispatchedEmails(): Array<{ fileName: string; filePath: string; createdAt: string }> {
    this.ensureMailDirectory();
    try {
      const files = fs.readdirSync(MAIL_INBOX_DIR);
      return files
        .filter((f) => f.endsWith('.html'))
        .map((f) => {
          const filePath = path.join(MAIL_INBOX_DIR, f);
          const stats = fs.statSync(filePath);
          return {
            fileName: f,
            filePath,
            createdAt: stats.birthtime.toISOString()
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }

  /**
   * Reads raw HTML content of an email from local mail inbox.
   */
  getEmailContent(fileName: string): string | null {
    this.ensureMailDirectory();
    try {
      const sanitized = path.basename(fileName);
      const targetPath = path.join(MAIL_INBOX_DIR, sanitized);
      if (fs.existsSync(targetPath)) {
        return fs.readFileSync(targetPath, 'utf8');
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Dispatches appointment/booking confirmation email with local inbox fallback & SMTP.
   */
  async dispatchBookingConfirmationEmail(params: {
    tenantName: string;
    email: string;
    customerName: string;
    providerName: string;
    slot: string;
    date: string;
    token: string;
    fee?: number;
    industryType?: string;
  }): Promise<{
    success: boolean;
    dispatchMode: 'SMTP' | 'LOCAL_PREVIEW';
    previewPath?: string;
  }> {
    const preset = resolveIndustryPreset(params.industryType);
    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Booking Confirmed — ${params.token}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px;">${preset.badgeIcon}</span>
      <h2 style="color: #38bdf8; margin: 8px 0 4px 0; font-size: 22px;">${params.tenantName}</h2>
      <p style="color: #94a3b8; margin: 0; font-size: 13px;">${preset.name} • ${preset.vocabulary.appointment.singular} Confirmed</p>
    </div>
    <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1.5px dashed ${preset.accentColor};">
      <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">YOUR BOOKING TOKEN</div>
      <div style="font-size: 32px; font-weight: 900; font-family: monospace; color: ${preset.accentColor};">${params.token}</div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
      <tr><td style="padding: 8px 0; color: #94a3b8;">Customer:</td><td style="padding: 8px 0; color: #f8fafc; font-weight: 600; text-align: right;">${params.customerName}</td></tr>
      <tr><td style="padding: 8px 0; color: #94a3b8;">Provider:</td><td style="padding: 8px 0; color: #f8fafc; font-weight: 600; text-align: right;">${params.providerName}</td></tr>
      <tr><td style="padding: 8px 0; color: #94a3b8;">Date & Slot:</td><td style="padding: 8px 0; color: #f8fafc; font-weight: 600; text-align: right;">${params.date} at ${params.slot}</td></tr>
      <tr><td style="padding: 8px 0; color: #94a3b8;">Estimated Fee:</td><td style="padding: 8px 0; color: #34d399; font-weight: 700; text-align: right;">₹${params.fee || 0}</td></tr>
    </table>
    <div style="border-top: 1px solid #334155; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b;">
      Please arrive 10 minutes prior to your scheduled slot. Show this confirmation token at the reception desk.
    </div>
  </div>
</body>
</html>
    `.trim();

    this.ensureMailDirectory();
    const fileName = `booking-${params.token}-${Date.now()}.html`;
    const filePath = path.join(MAIL_INBOX_DIR, fileName);

    try {
      fs.writeFileSync(filePath, htmlContent, 'utf8');
      logger.info(`[MAIL] Booking confirmation email generated for ${params.email}. Saved: ${filePath}`);
    } catch (err) {
      logger.warn('[MAIL] Failed to save local booking email preview', { error: String(err) });
    }

    if (process.env['SMTP_HOST']) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env['SMTP_HOST'],
          port: Number(process.env['SMTP_PORT'] || 587),
          secure: process.env['SMTP_SECURE'] === 'true',
          auth: process.env['SMTP_USER']
            ? { user: process.env['SMTP_USER'], pass: process.env['SMTP_PASSWORD'] || '' }
            : undefined
        });

        await transporter.sendMail({
          from: process.env['MAIL_FROM'] || `"Doc Search Universal" <notifications@docsearch.internal>`,
          to: params.email,
          subject: `${preset.badgeIcon} Booking Confirmed [${params.token}] — ${params.tenantName}`,
          html: htmlContent
        });

        return { success: true, dispatchMode: 'SMTP', previewPath: filePath };
      } catch (smtpErr) {
        logger.warn('[MAIL] Live SMTP failed, fell back to local inbox preview', { error: String(smtpErr) });
      }
    }

    return { success: true, dispatchMode: 'LOCAL_PREVIEW', previewPath: filePath };
  }
}

export const activationMailerService = new ActivationMailerService();
