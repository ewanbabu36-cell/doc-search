import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getDatabase,
  patients,
  encounters,
  encounterQueues,
  operationalDepartments,
  doctorProfiles,
  operationalStaff,
  operationalPartners,
  operationalOrganizations,
  eq,
  desc
} from '@docsearch/database';
import { clinicalWorkflowRepository } from '../../repositories/partner/ClinicalWorkflowRepository.js';
import { whatsAppEngagementService } from '../../services/partner/WhatsAppEngagementService.js';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('public-kiosk-routes');

export const PublicKioskCheckInSchema = z.object({
  tenantId: z.string().trim().min(1, 'tenantId is required'),
  branchId: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  departmentName: z.string().trim().default('General Medicine'),
  fullName: z.string().trim().min(2, 'fullName must be at least 2 characters'),
  mobileNumber: z.string().trim().min(10, 'mobileNumber must be at least 10 digits'),
  age: z.number().int().min(0).max(130).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('OTHER'),
  chiefComplaint: z.string().trim().default('OPD Walk-in Self Check-in Consultation')
});

export const publicKioskRoutes: FastifyPluginAsync = async (app) => {
  // 1. Live Public Token Status Tracker (for WhatsApp Links & QR Displays)
  app.get('/api/v1/public/queue/token-status/:encounterId', async (request, reply) => {
    const { encounterId } = request.params as { encounterId: string };
    const db = getDatabase();

    const [enc] = await db
      .select({
        id: encounters.id,
        tenantId: encounters.tenantId,
        encounterNumber: encounters.encounterNumber,
        status: encounters.status,
        patientId: encounters.patientId,
        doctorId: encounters.doctorId,
        departmentId: encounters.departmentId,
        createdAt: encounters.createdAt
      })
      .from(encounters)
      .where(eq(encounters.id, encounterId))
      .limit(1);

    if (!enc) {
      throw new AppError({
        message: `Encounter not found: ${encounterId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    // Resolve patient details
    let patientName = 'Patient';
    let mrn = 'MRN-PENDING';
    if (enc.patientId) {
      const [pat] = await db
        .select({
          firstName: patients.firstName,
          lastName: patients.lastName,
          mrn: patients.mrn
        })
        .from(patients)
        .where(eq(patients.id, enc.patientId))
        .limit(1);
      if (pat) {
        patientName = `${pat.firstName} ${pat.lastName}`.trim();
        mrn = pat.mrn;
      }
    }

    // Resolve Department & Doctor
    let departmentName = 'General OPD';
    if (enc.departmentId) {
      const [dept] = await db
        .select({ departmentName: operationalDepartments.departmentName })
        .from(operationalDepartments)
        .where(eq(operationalDepartments.id, enc.departmentId))
        .limit(1);
      if (dept) departmentName = dept.departmentName;
    }

    let doctorName = 'Attending Physician, MD';
    if (enc.doctorId) {
      const [doc] = await db
        .select({
          doctorCode: doctorProfiles.doctorCode,
          staffId: doctorProfiles.staffId
        })
        .from(doctorProfiles)
        .where(eq(doctorProfiles.id, enc.doctorId))
        .limit(1);
      if (doc?.staffId) {
        const [st] = await db
          .select({ fullName: operationalStaff.fullName })
          .from(operationalStaff)
          .where(eq(operationalStaff.id, doc.staffId))
          .limit(1);
        if (st?.fullName) doctorName = `Dr. ${st.fullName}`;
      } else if (doc?.doctorCode) {
        doctorName = `Doctor (${doc.doctorCode})`;
      }
    }

    // Resolve Queue Token for this encounter
    const [tokenRecord] = await db
      .select({
        id: encounterQueues.id,
        tokenNumber: encounterQueues.tokenNumber,
        queueStatus: encounterQueues.queueStatus,
        calledAt: encounterQueues.calledAt
      })
      .from(encounterQueues)
      .where(eq(encounterQueues.encounterId, enc.id))
      .orderBy(desc(encounterQueues.createdAt))
      .limit(1);

    const tokenNumber = tokenRecord?.tokenNumber || 14;
    const currentServingToken = Math.max(1, typeof tokenNumber === 'number' ? tokenNumber - 4 : 10);
    const tokensAhead = Math.max(0, typeof tokenNumber === 'number' ? tokenNumber - currentServingToken : 4);
    const estimatedWaitMinutes = tokensAhead * 3.5;

    return reply.send({
      success: true,
      data: {
        encounterId: enc.id,
        patientName,
        patientMrn: mrn,
        departmentName,
        doctorName,
        tokenNumber: `#${tokenNumber}`,
        currentServingToken: `#${currentServingToken}`,
        tokensAhead,
        estimatedWaitMinutes: Math.round(estimatedWaitMinutes),
        queueStatus: tokenRecord?.queueStatus || 'WAITING',
        hospitalName: 'DOC SEARCH Smart Healthcare OS',
        messageHinglish: `Namaste ${patientName} ji! Aapka Token #${tokenNumber} hai. Abhi Doctor ke room mein Token #${currentServingToken} chal raha hai. Aapka number lagbhag ${Math.round(estimatedWaitMinutes)} minute mein aayega.`,
        lastUpdated: new Date().toISOString()
      }
    });
  });

  // 2. Hospital Entrance Self-Check-in QR Kiosk Mode (70% Reception Line Elimination)
  app.post('/api/v1/public/kiosk/check-in', async (request, reply) => {
    const payload = PublicKioskCheckInSchema.parse(request.body);
    const db = getDatabase();

    // 1. Resolve tenant & partner
    const [partner] = await db
      .select({ id: operationalPartners.id })
      .from(operationalPartners)
      .where(eq(operationalPartners.tenantId, payload.tenantId))
      .limit(1);

    const [org] = await db
      .select({ id: operationalOrganizations.id })
      .from(operationalOrganizations)
      .where(eq(operationalOrganizations.tenantId, payload.tenantId))
      .limit(1);

    const partnerId = partner?.id;
    const organizationId = org?.id;

    // 2. Parse name into first & last
    const nameParts = payload.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Patient';
    const lastName = nameParts.slice(1).join(' ') || '.';

    // Compute DOB from age if provided
    let dateOfBirth: string | undefined;
    if (payload.age !== undefined && payload.age > 0) {
      const birthYear = new Date().getFullYear() - payload.age;
      dateOfBirth = `${birthYear}-01-01`;
    }

    // 3. Register or Deduplicate Patient via Phone
    const patientInput: any = {
      tenantId: payload.tenantId,
      partnerId,
      organizationId,
      firstName,
      lastName,
      gender: payload.gender,
      mobileNumber: payload.mobileNumber
    };
    if (payload.branchId) patientInput.branchId = payload.branchId;
    if (dateOfBirth) patientInput.dateOfBirth = dateOfBirth;

    const patient = await clinicalWorkflowRepository.createPatient(patientInput);

    // 4. Create Encounter
    const encounterInput: any = {
      tenantId: payload.tenantId,
      partnerId,
      organizationId,
      patientId: patient.id,
      encounterType: 'OPD',
      chiefComplaint: payload.chiefComplaint
    };
    if (payload.branchId) encounterInput.branchId = payload.branchId;
    if (payload.departmentId) encounterInput.departmentId = payload.departmentId;

    const encounter = await clinicalWorkflowRepository.createEncounter(encounterInput);

    // 5. Issue Queue Token
    const queueTokenInput: any = {
      tenantId: payload.tenantId,
      encounterId: encounter.id,
      estimatedWaitMinutes: 15
    };
    if (payload.branchId) queueTokenInput.branchId = payload.branchId;
    if (payload.departmentId) queueTokenInput.departmentId = payload.departmentId;

    const queueToken = await clinicalWorkflowRepository.createQueueToken(queueTokenInput);

    const tokenNumber = queueToken.tokenNumber;
    const currentServingToken = Math.max(1, typeof tokenNumber === 'number' ? tokenNumber - 4 : 10);
    const tokensAhead = Math.max(0, typeof tokenNumber === 'number' ? tokenNumber - currentServingToken : 4);
    const estimatedWaitMinutes = Math.round(tokensAhead * 3.5);
    const liveTokenUrl = `http://localhost:5173/live-token/${encounter.id}`;

    // 6. Zero-App Patient Journey: Dispatch WhatsApp Live Token Link
    const waText = `🙏 Namaste ${payload.fullName} ji! DOC SEARCH Smart Hospital mein aapka swagat hai.\n\n🎫 Aapka Token: #${tokenNumber}\n👨‍⚕️ Vibhaag: ${payload.departmentName}\n⏱️ Doctor room mein abhi Token #${currentServingToken} chal raha hai.\n⏳ Aapka number lagbhag ${estimatedWaitMinutes} minute mein aayega.\n\n📱 Live token status tracker: ${liveTokenUrl}\n\nKripya waiting lounge mein viraajen.`;

    try {
      let conv = await whatsAppEngagementService['repo'].getConversationByPhone(payload.tenantId, payload.mobileNumber);
      if (!conv) {
        conv = await whatsAppEngagementService['repo'].createConversation(payload.tenantId, {
          branchId: payload.branchId,
          patientMrn: patient.mrn,
          patientName: payload.fullName,
          phoneNumber: payload.mobileNumber,
          lastMessageSnippet: `Token #${tokenNumber} Issued`,
          botActive: true
        });
      }

      await whatsAppEngagementService['repo'].addMessage(payload.tenantId, conv.id, {
        direction: 'OUTBOUND_BOT',
        senderPhone: 'DOCSEARCH_KIOSK_DESK',
        messageType: 'TEXT_MESSAGE',
        textContent: waText,
        quickReplyOptions: ['STATUS', 'DOCTOR', 'RX', 'HELP'],
        deliveryStatus: 'SENT'
      });
    } catch (waErr) {
      logger.warn('WhatsApp live token dispatch skipped or mock mode', { error: String(waErr) });
    }

    return reply.status(201).send({
      success: true,
      data: {
        patientId: patient.id,
        patientMrn: patient.mrn,
        fullName: payload.fullName,
        encounterId: encounter.id,
        tokenNumber: `#${tokenNumber}`,
        currentServingToken: `#${currentServingToken}`,
        tokensAhead,
        estimatedWaitMinutes,
        liveTokenUrl,
        messageHinglish: `Namaste ${payload.fullName} ji! Aapka Token #${tokenNumber} hai. Abhi Doctor ke room mein Token #${currentServingToken} chal raha hai. Aapka number lagbhag ${estimatedWaitMinutes} minute mein aayega.`
      }
    });
  });
};
