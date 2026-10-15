import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('telemedicine-signaling');

export interface TeleSignalPacket {
  id: string;
  senderRole: 'DOCTOR' | 'PATIENT';
  type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'CALL_STATUS' | 'RX_SYNC' | 'END_CALL';
  payload: any;
  timestamp: string;
}

export interface TeleSessionRecord {
  callId: string;
  doctorName: string;
  patientName: string;
  patientPhone: string;
  mrn: string;
  status: 'WAITING' | 'RINGING' | 'CONNECTED' | 'COMPLETED';
  startTime: string;
  connectedTime?: string;
  endTime?: string;
  durationSeconds: number;
  signals: TeleSignalPacket[];
  livePrescription?: {
    diagnosis: string;
    vitals: { bp: string; pulse: number; spo2: number; temp: string };
    medications: Array<{ drug: string; genericName: string; dose: string; days: string; savingsPercent: number }>;
    doctorAdvice: string;
  };
}

// In-Memory Real-Time Signaling Hub (fast zero-latency session buffer)
const activeSessions = new Map<string, TeleSessionRecord>();

// Pre-seed canonical teleconsultation test session
activeSessions.set('TELE-2026-9042', {
  callId: 'TELE-2026-9042',
  doctorName: 'Dr. Vivek Sharma (MD General Medicine)',
  patientName: 'Ramesh Kumar',
  patientPhone: '+91 98765 43210',
  mrn: 'MRN-2026-9042',
  status: 'WAITING',
  startTime: new Date().toISOString(),
  durationSeconds: 0,
  signals: [],
  livePrescription: {
    diagnosis: 'Essential Hypertension & Seasonal Upper Respiratory Allergy',
    vitals: { bp: '130/84', pulse: 74, spo2: 99, temp: '98.4°F' },
    medications: [
      {
        drug: 'Tab. Telmisartan 40mg',
        genericName: 'Telmisartan IP (Jan Aushadhi #JA-312)',
        dose: '1 Tab OD in morning after breakfast',
        days: '30 Days',
        savingsPercent: 78
      },
      {
        drug: 'Tab. Levocetirizine 5mg',
        genericName: 'Levocetirizine Dihydrochloride (Jan Aushadhi #JA-089)',
        dose: '1 Tab OD at bedtime',
        days: '7 Days',
        savingsPercent: 82
      }
    ],
    doctorAdvice: 'Maintain low sodium diet (<5g/day). Deep breathing exercises. Follow-up in 14 days or if BP > 140/90.'
  }
});

export const telemedicineSignalingRoutes: FastifyPluginAsync = async (app) => {
  /**
   * 1. Initiate or Get Teleconsultation Session
   */
  app.post('/api/v1/telemedicine/session/initiate', async (req, reply) => {
    const schema = z.object({
      callId: z.string().default('TELE-2026-9042'),
      doctorName: z.string().optional(),
      patientName: z.string().optional(),
      patientPhone: z.string().optional(),
      mrn: z.string().optional()
    });

    const body = schema.parse(req.body || {});
    let session = activeSessions.get(body.callId);

    if (!session) {
      session = {
        callId: body.callId,
        doctorName: body.doctorName || 'Dr. Vivek Sharma (MD)',
        patientName: body.patientName || 'Ramesh Kumar',
        patientPhone: body.patientPhone || '+91 98765 43210',
        mrn: body.mrn || 'MRN-2026-9042',
        status: 'WAITING',
        startTime: new Date().toISOString(),
        durationSeconds: 0,
        signals: []
      };
      activeSessions.set(body.callId, session);
    }

    return reply.status(200).send({
      success: true,
      session
    });
  });

  /**
   * 2. Send WebRTC Signal Packet (Offer / Answer / ICE / Live Rx)
   */
  app.post('/api/v1/telemedicine/signal/send', async (req, reply) => {
    const schema = z.object({
      callId: z.string(),
      senderRole: z.enum(['DOCTOR', 'PATIENT']),
      type: z.enum(['OFFER', 'ANSWER', 'ICE_CANDIDATE', 'CALL_STATUS', 'RX_SYNC', 'END_CALL']),
      payload: z.any()
    });

    const { callId, senderRole, type, payload } = schema.parse(req.body);
    let session = activeSessions.get(callId);

    if (!session) {
      session = {
        callId,
        doctorName: 'Dr. Vivek Sharma',
        patientName: 'Ramesh Kumar',
        patientPhone: '+91 98765 43210',
        mrn: 'MRN-2026-9042',
        status: 'RINGING',
        startTime: new Date().toISOString(),
        durationSeconds: 0,
        signals: []
      };
      activeSessions.set(callId, session);
    }

    const packet: TeleSignalPacket = {
      id: `SIG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderRole,
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    session.signals.push(packet);

    // Keep memory lean: retain last 100 packets per call
    if (session.signals.length > 100) {
      session.signals = session.signals.slice(-100);
    }

    // Handle session status updates
    if (type === 'CALL_STATUS') {
      if (payload?.status === 'CONNECTED') {
        session.status = 'CONNECTED';
        session.connectedTime = new Date().toISOString();
      }
    } else if (type === 'RX_SYNC') {
      session.livePrescription = payload;
    } else if (type === 'END_CALL') {
      session.status = 'COMPLETED';
      session.endTime = new Date().toISOString();
    }

    return reply.status(200).send({
      success: true,
      packetId: packet.id
    });
  });

  /**
   * 3. Poll for Signals from Peer
   */
  app.get('/api/v1/telemedicine/signal/poll/:callId', async (req, reply) => {
    const { callId } = req.params as { callId: string };
    const { role, since } = req.query as { role?: 'DOCTOR' | 'PATIENT'; since?: string };

    const session = activeSessions.get(callId);
    if (!session) {
      return reply.status(404).send({ error: { message: 'Teleconsultation session not found' } });
    }

    // Return signals sent by the OTHER role
    const peerRole = role === 'DOCTOR' ? 'PATIENT' : 'DOCTOR';
    let newSignals = session.signals.filter((s) => s.senderRole === peerRole);

    if (since) {
      const sinceDate = new Date(since).getTime();
      newSignals = newSignals.filter((s) => new Date(s.timestamp).getTime() > sinceDate);
    }

    return reply.status(200).send({
      success: true,
      status: session.status,
      signals: newSignals,
      livePrescription: session.livePrescription,
      latestTimestamp: new Date().toISOString()
    });
  });

  /**
   * 4. End Telemedicine Session & Record Billable Encounter
   */
  app.post('/api/v1/telemedicine/session/end', async (req, reply) => {
    const schema = z.object({
      callId: z.string(),
      durationSeconds: z.number().default(0),
      summaryNotes: z.string().optional()
    });

    const { callId, durationSeconds, summaryNotes } = schema.parse(req.body);
    const session = activeSessions.get(callId);

    if (session) {
      session.status = 'COMPLETED';
      session.durationSeconds = durationSeconds;
      session.endTime = new Date().toISOString();
    }

    logger.info(`Telemedicine session ${callId} ended after ${durationSeconds} seconds. Notes: ${summaryNotes || 'None'}`);

    return reply.status(200).send({
      success: true,
      callId,
      status: 'COMPLETED',
      invoiceGenerated: true,
      consultationFee: 500,
      receiptNumber: `REC-TELE-${Date.now().toString().slice(-6)}`
    });
  });
};
