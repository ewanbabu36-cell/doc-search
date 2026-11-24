/**
 * DocSearch Omnichannel Communication Integrations Routes
 * --------------------------------------------------------
 * Unified API endpoints for:
 * 1. Gmail & Google Workspace Transactional Email (OTP, Appointments, Lab Reports, Panic Alerts)
 * 2. Firebase Cloud Messaging (FCM Push Notifications & Auth Token Verification)
 * 3. Telegram Healthcare Bot (Alerts, Code Blue, Inbound Bot Webhook)
 * 4. Multi-Channel Integration Health & Readiness Matrix
 */

import { type FastifyPluginAsync } from 'fastify';
import { gmailMailerService } from '../../services/communication/GmailMailerService.js';
import { firebaseIntegrationService } from '../../services/communication/FirebaseIntegrationService.js';
import { telegramBotService } from '../../services/communication/TelegramBotService.js';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('omnichannel-integrations-routes');

export const omnichannelIntegrationsRoutes: FastifyPluginAsync = async (fastify) => {
  // ==========================================
  // Unified Integration Status Matrix
  // ==========================================
  fastify.get('/api/v1/integrations/status', async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      integrations: {
        gmail: gmailMailerService.getStatus(),
        firebase: firebaseIntegrationService.getStatus(),
        telegram: telegramBotService.getStatus()
      }
    });
  });

  // ==========================================
  // 1. Gmail & Google Workspace Routes
  // ==========================================
  fastify.get('/api/v1/integrations/gmail/status', async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      data: gmailMailerService.getStatus()
    });
  });

  fastify.post('/api/v1/integrations/gmail/send-otp', async (request: any, reply) => {
    const { toEmail, otp, expiresMinutes } = request.body || {};
    if (!toEmail || !otp) {
      return reply.status(400).send({ success: false, error: 'toEmail and otp are required' });
    }

    const result = await gmailMailerService.sendOtpEmail(toEmail, otp, expiresMinutes || 10);
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/gmail/send-appointment', async (request: any, reply) => {
    const { toEmail, patientName, doctorName, hospitalName, tokenNumber, slotTime, date, trackUrl } = request.body || {};
    if (!toEmail || !patientName || !doctorName || !tokenNumber) {
      return reply.status(400).send({ success: false, error: 'Missing required appointment confirmation details' });
    }

    const result = await gmailMailerService.sendAppointmentConfirmation(toEmail, {
      patientName,
      doctorName,
      hospitalName: hospitalName || 'DocSearch Hospital Network',
      tokenNumber,
      slotTime: slotTime || '10:00 AM',
      date: date || new Date().toISOString().split('T')[0]!,
      trackUrl
    });
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/gmail/send-lab-report', async (request: any, reply) => {
    const { toEmail, patientName, testName, labName, reportId, downloadUrl } = request.body || {};
    if (!toEmail || !patientName || !testName || !reportId) {
      return reply.status(400).send({ success: false, error: 'Missing required lab report details' });
    }

    const result = await gmailMailerService.sendLabReportReady(toEmail, {
      patientName,
      testName,
      labName: labName || 'DocSearch NABL Diagnostic Hub',
      reportId,
      downloadUrl: downloadUrl || 'http://localhost:5174/lab-reports'
    });
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/gmail/send-critical-alert', async (request: any, reply) => {
    const { doctorEmail, patientName, patientUhId, parameterName, observedValue, normalRange, technicianName, urgentActionUrl } = request.body || {};
    if (!doctorEmail || !patientName || !parameterName || !observedValue) {
      return reply.status(400).send({ success: false, error: 'Missing required critical panic alert parameters' });
    }

    const result = await gmailMailerService.sendCriticalPanicAlert(doctorEmail, {
      patientName,
      patientUhId: patientUhId || 'UHID-PANIC',
      parameterName,
      observedValue,
      normalRange: normalRange || 'N/A',
      technicianName: technicianName || 'On-Duty Lab Tech',
      urgentActionUrl: urgentActionUrl || 'http://localhost:5173'
    });
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/gmail/send-custom', async (request: any, reply) => {
    const { to, subject, html, text, category } = request.body || {};
    if (!to || !subject || !html) {
      return reply.status(400).send({ success: false, error: 'to, subject, and html are required' });
    }

    const result = await gmailMailerService.send({ to, subject, html, text, category });
    return reply.status(200).send({ success: true, result });
  });

  // ==========================================
  // 2. Firebase FCM & Auth Routes
  // ==========================================
  fastify.get('/api/v1/integrations/firebase/status', async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      data: firebaseIntegrationService.getStatus()
    });
  });

  fastify.post('/api/v1/integrations/firebase/register-device', async (request: any, reply) => {
    const { userId, token, platform, tenantId, role } = request.body || {};
    if (!userId || !token || !platform) {
      return reply.status(400).send({ success: false, error: 'userId, token, and platform are required' });
    }

    const registered = firebaseIntegrationService.registerDeviceToken({
      userId,
      token,
      platform,
      tenantId,
      role
    });
    return reply.status(200).send({ success: true, data: registered });
  });

  fastify.post('/api/v1/integrations/firebase/send-push', async (request: any, reply) => {
    const { targetToken, topic, notification, tenantId, userId } = request.body || {};
    if ((!targetToken && !topic) || !notification?.title || !notification?.body) {
      return reply.status(400).send({ success: false, error: 'targetToken or topic, and notification {title, body} are required' });
    }

    const result = await firebaseIntegrationService.sendPushNotification({
      targetToken,
      topic,
      notification,
      tenantId,
      userId
    });
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/firebase/send-queue-turn', async (request: any, reply) => {
    const { deviceToken, tokenNumber, patientName, doctorName, cabinNumber } = request.body || {};
    if (!deviceToken || !tokenNumber || !patientName || !doctorName) {
      return reply.status(400).send({ success: false, error: 'deviceToken, tokenNumber, patientName, doctorName are required' });
    }

    const result = await firebaseIntegrationService.sendQueueTurnPush(deviceToken, {
      tokenNumber,
      patientName,
      doctorName,
      cabinNumber: cabinNumber || 1
    });
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/firebase/send-critical-lab-alert', async (request: any, reply) => {
    const { doctorDeviceToken, patientName, uhid, testName, panicValue } = request.body || {};
    if (!doctorDeviceToken || !patientName || !testName || !panicValue) {
      return reply.status(400).send({ success: false, error: 'doctorDeviceToken, patientName, testName, panicValue are required' });
    }

    const result = await firebaseIntegrationService.sendCriticalLabAlertPush(doctorDeviceToken, {
      patientName,
      uhid: uhid || 'UHID-CRITICAL',
      testName,
      panicValue
    });
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/firebase/broadcast-code-blue', async (request: any, reply) => {
    const { roomNumber, wing, floor } = request.body || {};
    if (!roomNumber) {
      return reply.status(400).send({ success: false, error: 'roomNumber is required' });
    }

    const result = await firebaseIntegrationService.broadcastCodeBlueEmergency({
      roomNumber,
      wing: wing || 'A',
      floor: floor || '1'
    });
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/firebase/verify-token', async (request: any, reply) => {
    const { idToken } = request.body || {};
    if (!idToken) {
      return reply.status(400).send({ success: false, error: 'idToken is required' });
    }

    try {
      const user = await firebaseIntegrationService.verifyFirebaseIdToken(idToken);
      return reply.status(200).send({ success: true, user });
    } catch (err: any) {
      return reply.status(401).send({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 3. Telegram Healthcare Bot Routes
  // ==========================================
  fastify.get('/api/v1/integrations/telegram/status', async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      data: telegramBotService.getStatus()
    });
  });

  fastify.post('/api/v1/integrations/telegram/webhook', async (request: any, reply) => {
    const update = request.body;
    logger.info('[TELEGRAM_WEBHOOK] Inbound update received', { updateId: update?.update_id });

    const botReply = telegramBotService.processWebhookUpdate(update);
    if (!botReply) {
      return reply.status(200).send({ ok: true, processed: false });
    }

    // Attempt to send back response to user
    await telegramBotService.sendMessage({
      chatId: botReply.chatId,
      text: botReply.text,
      parseMode: botReply.parseMode,
      replyMarkup: botReply.replyMarkup
    });

    return reply.status(200).send({
      ok: true,
      processed: true,
      replySentTo: botReply.chatId
    });
  });

  fastify.post('/api/v1/integrations/telegram/send-message', async (request: any, reply) => {
    const { chatId, text, parseMode, replyMarkup } = request.body || {};
    if (!chatId || !text) {
      return reply.status(400).send({ success: false, error: 'chatId and text are required' });
    }

    const result = await telegramBotService.sendMessage({ chatId, text, parseMode, replyMarkup });
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/telegram/send-panic-alert', async (request: any, reply) => {
    const { chatId, patientName, uhid, parameterName, observedValue, normalRange, technicianName } = request.body || {};
    if (!chatId || !patientName || !parameterName || !observedValue) {
      return reply.status(400).send({ success: false, error: 'chatId, patientName, parameterName, observedValue are required' });
    }

    const result = await telegramBotService.sendPanicLabAlert(chatId, {
      patientName,
      uhid: uhid || 'UHID-PANIC',
      parameterName,
      observedValue,
      normalRange: normalRange || 'N/A',
      technicianName: technicianName || 'On-Duty Lab Tech'
    });
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/telegram/send-queue-alert', async (request: any, reply) => {
    const { chatId, tokenNumber, patientName, doctorName, cabinNumber, hospitalName } = request.body || {};
    if (!chatId || !tokenNumber || !patientName || !doctorName) {
      return reply.status(400).send({ success: false, error: 'chatId, tokenNumber, patientName, doctorName are required' });
    }

    const result = await telegramBotService.sendQueueTokenAlert(chatId, {
      tokenNumber,
      patientName,
      doctorName,
      cabinNumber: cabinNumber || 1,
      hospitalName: hospitalName || 'DocSearch Hospital Network'
    });
    return reply.status(200).send({ success: true, result });
  });

  fastify.post('/api/v1/integrations/telegram/send-onboarding-alert', async (request: any, reply) => {
    const { chatId, legalName, vertical, city, tenantId, autoApproved } = request.body || {};
    if (!legalName || !vertical || !tenantId) {
      return reply.status(400).send({ success: false, error: 'legalName, vertical, tenantId are required' });
    }

    const result = await telegramBotService.sendPartnerOnboardingAlert(chatId || 'admin_channel', {
      legalName,
      vertical,
      city: city || 'Unknown City',
      tenantId,
      autoApproved: Boolean(autoApproved)
    });
    return reply.status(200).send({ success: true, result });
  });
};
