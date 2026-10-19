// Sovra Zero-Cost Healthcare PWA Messenger Gateway & Webhook Routes
// Connects DocSearch Partner Platform (:5173), Patient App (:5174), and API Gateway (:4000)
// With ZERO recurring cost (no Meta WhatsApp API fees, no SMS gateway charges).

import type { FastifyPluginAsync } from 'fastify';

interface SovraDispatchPayload {
  recipientPhone: string;
  patientUhid: string;
  patientName: string;
  documentType: 'PRESCRIPTION' | 'LAB_REPORT' | 'OPD_PAYMENT' | 'GENERAL_NOTICE';
  documentNumber: string;
  doctorName?: string;
  clinicOrHospitalName?: string;
  payload: Record<string, unknown>;
}

const sovraAuditLog: Array<{
  id: string;
  timestamp: string;
  recipientPhone: string;
  patientUhid: string;
  documentType: string;
  documentNumber: string;
  costIncurred: number;
}> = [];

export const sovraWebhookRoutes: FastifyPluginAsync = async (app) => {
  // 1. Gateway Status & Cost Metrics
  app.get('/api/v1/sovra/status', async (_request, reply) => {
    return reply.send({
      success: true,
      service: 'Sovra Zero-Cost Healthcare PWA Messenger Engine',
      version: '1.0.0',
      status: 'OPERATIONAL',
      costMetrics: {
        costPerMessage: 'INR 0.00',
        costPerRx: 'INR 0.00',
        costPerLabReport: 'INR 0.00',
        serverStorageCost: 'INR 0.00 (Local-First Client IndexedDB)',
        monthlyRecurringExpense: 'INR 0.00'
      },
      pwaFeatures: {
        offlineStorage: 'IndexedDB Vault (sovra_local_vault_v1)',
        meshSync: 'Native BroadcastChannel + Web-Push VAPID',
        pwaPort: 5176,
        themeColor: '#0F766E'
      },
      dispatchesProcessed: sovraAuditLog.length
    });
  });

  // 2. Webhook Dispatch from Partner Platform (e-Rx, Lab Report, OPD Fee Bill)
  app.post<{ Body: SovraDispatchPayload }>('/api/v1/sovra/dispatch', async (request, reply) => {
    const body = request.body || ({} as SovraDispatchPayload);

    if (!body.recipientPhone && !body.patientUhid) {
      return reply.status(400).send({
        success: false,
        error: 'Either recipientPhone or patientUhid must be provided for Sovra dispatch'
      });
    }

    const dispatchRecord = {
      id: `SOVRA-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      recipientPhone: body.recipientPhone || 'N/A',
      patientUhid: body.patientUhid || 'N/A',
      documentType: body.documentType || 'GENERAL_NOTICE',
      documentNumber: body.documentNumber || `DOC-${Date.now()}`,
      costIncurred: 0.00
    };

    sovraAuditLog.push(dispatchRecord);

    // Keep log bounded
    if (sovraAuditLog.length > 500) {
      sovraAuditLog.shift();
    }

    return reply.status(201).send({
      success: true,
      data: {
        dispatchId: dispatchRecord.id,
        deliveryChannel: 'SOVRA_PWA_LOCAL_FIRST',
        status: 'DISPATCHED_TO_SOVRA_MESH',
        costIncurred: 'INR 0.00',
        patientName: body.patientName,
        documentType: body.documentType,
        documentNumber: dispatchRecord.documentNumber,
        timestamp: dispatchRecord.timestamp
      }
    });
  });

  // 3. Query Dispatches Audit Log
  app.get('/api/v1/sovra/audit-dispatches', async (_request, reply) => {
    return reply.send({
      success: true,
      count: sovraAuditLog.length,
      data: [...sovraAuditLog].reverse()
    });
  });

  // 4. Ephemeral Async Store & Forward Mailbox (Zero-Cost Self-Destructing Queue)
  const ephemeralMailbox: Map<string, Array<{
    id: string;
    recipientPhone: string;
    senderPhone: string;
    ivHex: string;
    cipherTextBase64: string;
    depositedAt: string;
    expiresAt: number;
  }>> = new Map();

  // Deposit encrypted message into ephemeral mailbox
  app.post('/api/v1/sovra/mailbox/deposit', async (request, reply) => {
    const body = request.body as any;
    if (!body || !body.recipientPhone || !body.cipherTextBase64) {
      return reply.status(400).send({ success: false, error: 'Invalid envelope payload' });
    }

    const cleanPhone = String(body.recipientPhone).replace(/[\s\+]/g, '');
    const envelope = {
      id: body.id || `ENV-${Date.now()}`,
      recipientPhone: cleanPhone,
      senderPhone: String(body.senderPhone || 'active_user').replace(/[\s\+]/g, ''),
      ivHex: String(body.ivHex || ''),
      cipherTextBase64: String(body.cipherTextBase64),
      depositedAt: body.depositedAt || new Date().toISOString(),
      expiresAt: Date.now() + (body.ttlSeconds ? body.ttlSeconds * 1000 : 7 * 86400 * 1000)
    };

    if (!ephemeralMailbox.has(cleanPhone)) {
      ephemeralMailbox.set(cleanPhone, []);
    }
    const queue = ephemeralMailbox.get(cleanPhone)!;
    queue.push(envelope);

    // Limit queue per recipient to prevent memory abuse
    if (queue.length > 50) {
      queue.shift();
    }

    return reply.status(201).send({
      success: true,
      data: {
        envelopeId: envelope.id,
        status: 'QUEUED_IN_EPHEMERAL_MAILBOX',
        ttlDays: 7,
        storageCost: 'INR 0.00'
      }
    });
  });

  // Drain and Self-Destruct offline envelopes upon recipient reconnect
  app.get('/api/v1/sovra/mailbox/drain', async (request, reply) => {
    const query = request.query as { recipientPhone?: string };
    if (!query.recipientPhone) {
      return reply.status(400).send({ success: false, error: 'recipientPhone query parameter required' });
    }

    const cleanPhone = query.recipientPhone.replace(/[\s\+]/g, '');
    const envelopes = ephemeralMailbox.get(cleanPhone) || [];

    // Filter out expired items (> 7 days)
    const now = Date.now();
    const validEnvelopes = envelopes.filter((e) => e.expiresAt > now);

    // Self-destruct: Immediately clear the mailbox on read
    ephemeralMailbox.delete(cleanPhone);

    return reply.send({
      success: true,
      drainedCount: validEnvelopes.length,
      data: validEnvelopes,
      purgedFromServerMemory: true
    });
  });
};
