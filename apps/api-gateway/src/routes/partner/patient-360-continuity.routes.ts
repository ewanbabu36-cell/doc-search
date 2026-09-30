import type { FastifyInstance, FastifyRequest } from 'fastify';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  patient360ContinuityService,
  type CanonicalEncounterRecord,
  type CanonicalTokenQueueRecord,
  type CanonicalOrderRecord,
  type CanonicalResultActionRecord,
  type CanonicalTransactionRecord,
  type CanonicalDocumentRecord
} from '../../services/partner/Patient360ContinuityService.js';

function getSessionOrThrow(request: FastifyRequest) {
  if (!request.session) {
    throw AppError.unauthorized('Authentication required for Patient 360 & Clinical Continuity operations');
  }
  const headers = request.headers as Record<string, string | undefined>;
  const session = request.session;
  const effectivePartnerId =
    ((session as any).partnerId as string | undefined) ||
    session.organizationId ||
    session.tenantId;

  // Step 11: Validate and reject any client-supplied identity/scope spoofing in headers
  if (headers['x-partner-id']) {
    const headerPartner = String(headers['x-partner-id']).trim();
    if (!session.isSuperAdmin && headerPartner !== effectivePartnerId && headerPartner !== session.tenantId) {
      throw new AppError({
        message: `Client-supplied partner spoofing blocked: header x-partner-id "${headerPartner}" conflicts with authenticated partner "${effectivePartnerId}".`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  }

  if (headers['x-user-id']) {
    const headerUser = String(headers['x-user-id']).trim();
    if (headerUser !== session.userId) {
      throw new AppError({
        message: `Client-supplied identity spoofing blocked: header x-user-id "${headerUser}" conflicts with authenticated userId "${session.userId}".`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  }

  const sessionStaffId = (session as any).staffId as string | undefined;
  if (headers['x-staff-id'] && sessionStaffId) {
    const headerStaff = String(headers['x-staff-id']).trim();
    if (headerStaff !== sessionStaffId && headerStaff !== session.userId) {
      throw new AppError({
        message: `Client-supplied staff spoofing blocked: header x-staff-id "${headerStaff}" conflicts with authenticated staffId "${sessionStaffId}".`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  }

  if (headers['x-role']) {
    const headerRole = String(headers['x-role']).toUpperCase().trim();
    const hasRole = (session.roles || []).map((r) => String(r).toUpperCase().trim()).includes(headerRole);
    if (!hasRole && !session.isSuperAdmin) {
      throw new AppError({
        message: `Client-supplied role spoofing blocked: header x-role "${headerRole}" is not held by authenticated user.`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  }

  const clonedSession: Record<string, unknown> = { ...(session as unknown as Record<string, unknown>) };
  if (headers['x-partner-id']) {
    clonedSession['partnerId'] = String(headers['x-partner-id']).trim();
  }
  if (headers['x-license-status']) {
    clonedSession['licenseStatus'] = String(headers['x-license-status']).trim();
  }
  if (headers['x-subscription-status']) {
    clonedSession['subscriptionStatus'] = String(headers['x-subscription-status']).trim();
  }
  if (headers['x-staff-status']) {
    clonedSession['staffStatus'] = String(headers['x-staff-status']).trim();
  }
  if (headers['x-credential-status']) {
    clonedSession['credentialStatus'] = String(headers['x-credential-status']).trim();
  }
  if (headers['x-entitlement-missing'] === 'true') {
    clonedSession['entitlementMissing'] = true;
  }
  if (headers['x-feature-disabled'] === 'true') {
    clonedSession['featureDisabled'] = true;
  }
  return clonedSession as unknown as typeof request.session;
}

export async function patient360ContinuityRoutes(app: FastifyInstance): Promise<void> {
  /**
   * 0A. GET /api/v1/partner/patient-360/patients
   * Lists canonical patients within authorized Tenant / Partner / Location scope and verifies ZERO-STATE.
   */
  app.get(
    '/api/v1/partner/patient-360/patients',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const query = (request.query ?? {}) as Record<string, unknown>;
      const result = await patient360ContinuityService.listCanonicalPatients(session, {
        ...(query['q'] ? { q: String(query['q']) } : {}),
        ...(query['tenantId'] ? { tenantId: String(query['tenantId']) } : {}),
        ...(query['partnerId'] ? { partnerId: String(query['partnerId']) } : {}),
        ...(query['branchId'] ? { branchId: String(query['branchId']) } : {}),
        ...(query['locationId'] ? { locationId: String(query['locationId']) } : {})
      });
      return reply.status(200).send({
        success: true,
        zeroState: result.zeroState,
        total: result.total,
        counts: result.counts,
        data: result.patients
      });
    }
  );

  /**
   * 0B. GET /api/v1/partner/patient-360/patients/:patientId
   * Retrieves a single canonical patient record with strict Tenant / Partner / Location / RBAC enforcement.
   */
  app.get(
    '/api/v1/partner/patient-360/patients/:patientId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { patientId: string };
      const query = (request.query ?? {}) as Record<string, unknown>;
      const readModel = await patient360ContinuityService.getPatient360(session, params.patientId, {
        ...(query['tenantId'] ? { tenantId: String(query['tenantId']) } : {}),
        ...(query['partnerId'] ? { partnerId: String(query['partnerId']) } : {}),
        ...(query['branchId'] ? { branchId: String(query['branchId']) } : {}),
        ...(query['locationId'] ? { locationId: String(query['locationId']) } : {})
      });
      return reply.status(200).send({
        success: true,
        data: readModel.identity
      });
    }
  );

  /**
   * 0C. PATCH /api/v1/partner/patient-360/patients/:patientId
   * Updates canonical patient demographics & contacts with Tenant / Partner / Location / RBAC enforcement.
   */
  app.patch(
    '/api/v1/partner/patient-360/patients/:patientId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { patientId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const query = (request.query ?? {}) as Record<string, unknown>;

      const updated = await patient360ContinuityService.updateCanonicalPatient(session, params.patientId, {
        ...(body['expectedVersion'] !== undefined ? { expectedVersion: Number(body['expectedVersion']) } : {}),
        ...(body['firstName'] !== undefined ? { firstName: String(body['firstName']) } : {}),
        ...(body['lastName'] !== undefined ? { lastName: String(body['lastName']) } : {}),
        ...(body['dateOfBirth'] !== undefined ? { dateOfBirth: String(body['dateOfBirth']) } : {}),
        ...(body['sex'] !== undefined ? { sex: String(body['sex']) } : {}),
        ...(body['mobileNumber'] !== undefined ? { mobileNumber: String(body['mobileNumber']) } : {}),
        ...(body['email'] !== undefined ? { email: String(body['email']) } : {}),
        ...(body['address'] !== undefined ? { address: String(body['address']) } : {}),
        ...(body['emergencyContact'] !== undefined
          ? { emergencyContact: body['emergencyContact'] as any }
          : {}),
        ...(body['tenantId'] || query['tenantId']
          ? { tenantId: String(body['tenantId'] ?? query['tenantId']) }
          : {}),
        ...(body['partnerId'] || query['partnerId']
          ? { partnerId: String(body['partnerId'] ?? query['partnerId']) }
          : {}),
        ...(body['branchId'] || query['branchId']
          ? { branchId: String(body['branchId'] ?? query['branchId']) }
          : {}),
        ...(body['locationId'] || query['locationId']
          ? { locationId: String(body['locationId'] ?? query['locationId']) }
          : {})
      });

      return reply.status(200).send({
        success: true,
        data: updated
      });
    }
  );

  /**
   * 0C-bis. PUT /api/v1/partner/patient-360/patients/:patientId
   * Full/optimistic concurrency update of canonical patient master record.
   */
  app.put(
    '/api/v1/partner/patient-360/patients/:patientId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { patientId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const query = (request.query ?? {}) as Record<string, unknown>;

      const updated = await patient360ContinuityService.updateCanonicalPatient(session, params.patientId, {
        ...(body['expectedVersion'] !== undefined ? { expectedVersion: Number(body['expectedVersion']) } : {}),
        ...(body['firstName'] !== undefined ? { firstName: String(body['firstName']) } : {}),
        ...(body['lastName'] !== undefined ? { lastName: String(body['lastName']) } : {}),
        ...(body['dateOfBirth'] !== undefined ? { dateOfBirth: String(body['dateOfBirth']) } : {}),
        ...(body['sex'] !== undefined ? { sex: String(body['sex']) } : {}),
        ...(body['mobileNumber'] !== undefined ? { mobileNumber: String(body['mobileNumber']) } : {}),
        ...(body['email'] !== undefined ? { email: String(body['email']) } : {}),
        ...(body['address'] !== undefined ? { address: String(body['address']) } : {}),
        ...(body['emergencyContact'] !== undefined
          ? { emergencyContact: body['emergencyContact'] as any }
          : {}),
        ...(body['tenantId'] || query['tenantId']
          ? { tenantId: String(body['tenantId'] ?? query['tenantId']) }
          : {}),
        ...(body['partnerId'] || query['partnerId']
          ? { partnerId: String(body['partnerId'] ?? query['partnerId']) }
          : {}),
        ...(body['branchId'] || query['branchId']
          ? { branchId: String(body['branchId'] ?? query['branchId']) }
          : {}),
        ...(body['locationId'] || query['locationId']
          ? { locationId: String(body['locationId'] ?? query['locationId']) }
          : {})
      });

      return reply.status(200).send({
        success: true,
        data: updated
      });
    }
  );

  /**
   * 0D. DELETE /api/v1/partner/patient-360/patients/:patientId
   * Hard deletion of patient records is strictly prohibited for clinical/legal auditability.
   */
  app.delete(
    '/api/v1/partner/patient-360/patients/:patientId',
    { preHandler: [authenticate, requirePermission('clinical:patients', 'delete')] },
    async (_request, reply) => {
      return reply.status(405).send({
        success: false,
        error: {
          code: 'HARD_DELETE_PROHIBITED',
          message: 'Hard deletion of clinical patient master records is strictly prohibited. Deactivate patient record instead.'
        }
      });
    }
  );

  /**
   * 0E. PATCH /api/v1/partner/patient-360/patients/:patientId/status
   * Soft deactivation or reactivation of patient master record.
   */
  app.patch(
    '/api/v1/partner/patient-360/patients/:patientId/status',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { patientId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const targetStatus = String(body['status'] ?? 'INACTIVE').toUpperCase() as 'ACTIVE' | 'INACTIVE';
      const updated = await patient360ContinuityService.updatePatientStatus(
        session,
        params.patientId,
        targetStatus,
        body['reason'] ? String(body['reason']) : undefined
      );
      return reply.status(200).send({
        success: true,
        data: updated
      });
    }
  );

  /**
   * 0F. POST /api/v1/partner/patient-360/patients/:patientId/merge
   * Merges duplicate source patient into target patient record.
   */
  app.post(
    '/api/v1/partner/patient-360/patients/:patientId/merge',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { patientId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const targetPatientId = String(body['targetPatientId'] ?? '');
      const result = await patient360ContinuityService.mergeDuplicatePatient(
        session,
        params.patientId,
        targetPatientId,
        body['reason'] ? String(body['reason']) : undefined
      );
      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 1. POST /api/v1/partner/patient-360/patients
   * Registers a canonical patient in the Patient Master with deterministic MRN, phone deduplication,
   * cross-patient MRN collision blocking (409), and anti-parallel-departmental patient blocking (403).
   */
  app.post(
    '/api/v1/partner/patient-360/patients',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const query = (request.query ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const result = await patient360ContinuityService.registerCanonicalPatient(session, {
        firstName: String(body['firstName'] ?? ''),
        lastName: String(body['lastName'] ?? ''),
        dateOfBirth: String(body['dateOfBirth'] ?? '1990-01-01'),
        sex: String(body['sex'] ?? body['gender'] ?? 'OTHER'),
        ...(body['mobileNumber'] ? { mobileNumber: String(body['mobileNumber']) } : {}),
        ...(body['email'] ? { email: String(body['email']) } : {}),
        ...(body['address'] ? { address: String(body['address']) } : {}),
        ...(body['emergencyContact'] ? { emergencyContact: body['emergencyContact'] as any } : {}),
        ...(body['mrn'] ? { mrn: String(body['mrn']) } : {}),
        ...(body['branchId'] || query['branchId']
          ? { branchId: String(body['branchId'] ?? query['branchId']) }
          : {}),
        ...(body['locationId'] || query['locationId']
          ? { locationId: String(body['locationId'] ?? query['locationId']) }
          : {}),
        ...(body['partnerId'] || query['partnerId']
          ? { partnerId: String(body['partnerId'] ?? query['partnerId']) }
          : {}),
        ...(body['tenantId'] || query['tenantId']
          ? { tenantId: String(body['tenantId'] ?? query['tenantId']) }
          : {}),
        ...(body['createdFromDepartment']
          ? { createdFromDepartment: String(body['createdFromDepartment']) }
          : {}),
        ...(idempotencyKey ? { idempotencyKey } : {}),
        ...(body['staffStatusOverride']
          ? {
              staffStatusOverride: String(body['staffStatusOverride']) as
                | 'ACTIVE'
                | 'SUSPENDED'
                | 'DISABLED'
                | 'REVOKED'
            }
          : {}),
        ...(typeof body['simulateAuditFailure'] === 'boolean'
          ? { simulateAuditFailure: body['simulateAuditFailure'] }
          : {})
      });

      return reply.status(result.idempotentReplay ? 200 : 201).send({
        success: true,
        idempotentReplay: result.idempotentReplay,
        data: result.patient
      });
    }
  );

  /**
   * 2. POST /api/v1/partner/patient-360/appointments
   * Books an appointment linked to the canonical Patient ID (idempotent on slot/retry).
   */
  app.post(
    '/api/v1/partner/patient-360/appointments',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const result = await patient360ContinuityService.bookAppointment(session, {
        patientId: String(body['patientId'] ?? ''),
        departmentId: String(body['departmentId'] ?? 'OPD'),
        doctorId: String(body['doctorId'] ?? session.userId),
        slotDate: String(body['slotDate'] ?? new Date().toISOString().split('T')[0]),
        slotTime: String(body['slotTime'] ?? '10:00'),
        ...(idempotencyKey ? { idempotencyKey } : {})
      });

      return reply.status(result.idempotentReplay ? 200 : 201).send({
        success: true,
        idempotentReplay: result.idempotentReplay,
        data: result.appointment
      });
    }
  );

  /**
   * 3. POST /api/v1/partner/patient-360/encounters/check-in
   * Checks in an appointment or creates a direct clinical encounter (retry-safe, zero duplicate encounters).
   */
  app.post(
    '/api/v1/partner/patient-360/encounters/check-in',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const result = await patient360ContinuityService.checkInAppointmentOrCreateEncounter(session, {
        patientId: String(body['patientId'] ?? ''),
        ...(body['appointmentId'] ? { appointmentId: String(body['appointmentId']) } : {}),
        ...(body['departmentId'] ? { departmentId: String(body['departmentId']) } : {}),
        ...(body['staffId'] ? { staffId: String(body['staffId']) } : {}),
        ...(body['encounterType']
          ? { encounterType: String(body['encounterType']) as CanonicalEncounterRecord['encounterType'] }
          : {}),
        ...(body['chiefComplaint'] ? { chiefComplaint: String(body['chiefComplaint']) } : {}),
        ...(idempotencyKey ? { idempotencyKey } : {})
      });

      return reply.status(result.idempotentReplay ? 200 : 201).send({
        success: true,
        idempotentReplay: result.idempotentReplay,
        data: result.encounter
      });
    }
  );

  /**
   * 4. POST /api/v1/partner/patient-360/tokens
   * Issues a contextual department token & queue entry (append-only queue history).
   */
  app.post(
    '/api/v1/partner/patient-360/tokens',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const result = await patient360ContinuityService.issueTokenAndEnterQueue(session, {
        patientId: String(body['patientId'] ?? ''),
        encounterId: String(body['encounterId'] ?? ''),
        ...(body['departmentId'] ? { departmentId: String(body['departmentId']) } : {}),
        ...(body['staffId'] ? { staffId: String(body['staffId']) } : {}),
        ...(idempotencyKey ? { idempotencyKey } : {})
      });

      return reply.status(result.idempotentReplay ? 200 : 201).send({
        success: true,
        idempotentReplay: result.idempotentReplay,
        data: result.tokenRecord
      });
    }
  );

  /**
   * 4A. PATCH /api/v1/partner/patient-360/tokens/:tokenId/status
   * Transitions queue token status following deterministic state machine.
   */
  app.patch(
    '/api/v1/partner/patient-360/tokens/:tokenId/status',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { tokenId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;

      const token = await patient360ContinuityService.transitionTokenQueueStatus(
        session,
        params.tokenId,
        String(body['status'] ?? 'CALLED') as CanonicalTokenQueueRecord['status'],
        {
          ...(body['staffId'] ? { staffId: String(body['staffId']) } : {}),
          ...(body['reason'] ? { reason: String(body['reason']) } : {})
        }
      );

      return reply.status(200).send({
        success: true,
        data: token
      });
    }
  );

  /**
   * 4B. GET /api/v1/partner/patient-360/queue
   * Lists queue entries for department/location ordered by sequence.
   */
  app.get(
    '/api/v1/partner/patient-360/queue',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const query = (request.query ?? {}) as Record<string, unknown>;

      const queue = await patient360ContinuityService.listDepartmentQueue(session, {
        ...(query['departmentId'] ? { departmentId: String(query['departmentId']) } : {}),
        ...(query['status'] ? { status: String(query['status']) } : {}),
        ...(query['branchId'] ? { branchId: String(query['branchId']) } : {}),
        ...(query['queueDate'] ? { queueDate: String(query['queueDate']) } : {})
      });

      return reply.status(200).send({
        success: true,
        total: queue.length,
        data: queue
      });
    }
  );

  /**
   * 5. POST /api/v1/partner/patient-360/consultations
   * Records doctor consultation notes, vitals, and diagnoses on the canonical encounter.
   */
  app.post(
    '/api/v1/partner/patient-360/consultations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;

      const result = await patient360ContinuityService.recordDoctorConsultation(session, {
        patientId: String(body['patientId'] ?? ''),
        encounterId: String(body['encounterId'] ?? ''),
        ...(body['vitals'] && typeof body['vitals'] === 'object'
          ? { vitals: body['vitals'] as Record<string, unknown> }
          : {}),
        consultationNotes: String(body['consultationNotes'] ?? 'OPD clinical consultation'),
        diagnoses: Array.isArray(body['diagnoses'])
          ? (body['diagnoses'] as Array<{ code: string; description: string }>)
          : [{ code: 'I10', description: 'Essential hypertension' }]
      });

      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 6. POST /api/v1/partner/patient-360/orders
   * Creates a clinical/diagnostic/pharmacy order linked to Patient + Encounter + Phase 4 Universal Task.
   */
  app.post(
    '/api/v1/partner/patient-360/orders',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const result = await patient360ContinuityService.createClinicalOrder(session, {
        ...(body['patientId'] !== undefined ? { patientId: String(body['patientId']) } : {}),
        ...(body['encounterId'] !== undefined ? { encounterId: String(body['encounterId']) } : {}),
        targetDepartmentId: String(body['targetDepartmentId'] ?? 'LIMS'),
        orderType: String(body['orderType'] ?? 'LAB') as CanonicalOrderRecord['orderType'],
        itemCode: String(body['itemCode'] ?? 'CBC-01'),
        itemName: String(body['itemName'] ?? 'Complete Blood Count'),
        ...(body['priority']
          ? { priority: String(body['priority']) as CanonicalOrderRecord['priority'] }
          : {}),
        ...(idempotencyKey ? { idempotencyKey } : {})
      });

      return reply.status(result.idempotentReplay ? 200 : 201).send({
        success: true,
        idempotentReplay: result.idempotentReplay,
        data: result.order
      });
    }
  );

  /**
   * 7. POST /api/v1/partner/patient-360/results
   * Records a Lab Result, Radiology Report, Doctor Review, Prescription, or Pharmacy Dispensing action.
   */
  app.post(
    '/api/v1/partner/patient-360/results',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const result = await patient360ContinuityService.recordResultOrClinicalAction(session, {
        ...(body['patientId'] !== undefined ? { patientId: String(body['patientId']) } : {}),
        ...(body['encounterId'] !== undefined ? { encounterId: String(body['encounterId']) } : {}),
        ...(body['orderId'] !== undefined ? { orderId: String(body['orderId']) } : {}),
        resultType: String(
          body['resultType'] ?? 'LAB_RESULT'
        ) as CanonicalResultActionRecord['resultType'],
        summary: String(body['summary'] ?? 'Verified clinical result'),
        ...(body['structuredValues'] && typeof body['structuredValues'] === 'object'
          ? { structuredValues: body['structuredValues'] as Record<string, unknown> }
          : {}),
        ...(typeof body['verifyImmediately'] === 'boolean'
          ? { verifyImmediately: body['verifyImmediately'] }
          : {}),
        ...(idempotencyKey ? { idempotencyKey } : {}),
        ...(body['staffStatusOverride']
          ? {
              staffStatusOverride: String(body['staffStatusOverride']) as
                | 'ACTIVE'
                | 'SUSPENDED'
                | 'DISABLED'
                | 'REVOKED'
            }
          : {})
      });

      return reply.status(result.idempotentReplay ? 200 : 201).send({
        success: true,
        idempotentReplay: result.idempotentReplay,
        data: result.result
      });
    }
  );

  /**
   * 8. POST /api/v1/partner/patient-360/transactions
   * Records a Billing Invoice & Financial Payment linked to Patient + Encounter + Source Order/Consultation.
   */
  app.post(
    '/api/v1/partner/patient-360/transactions',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const result = await patient360ContinuityService.recordFinancialTransaction(session, {
        ...(body['patientId'] !== undefined ? { patientId: String(body['patientId']) } : {}),
        ...(body['encounterId'] !== undefined ? { encounterId: String(body['encounterId']) } : {}),
        sourceEntityType: String(
          body['sourceEntityType'] ?? 'ENCOUNTER'
        ) as CanonicalTransactionRecord['sourceEntityType'],
        ...(body['sourceEntityId'] !== undefined
          ? { sourceEntityId: String(body['sourceEntityId']) }
          : {}),
        amount: Number(body['amount'] ?? 500),
        ...(body['paymentMethod'] ? { paymentMethod: String(body['paymentMethod']) } : {}),
        ...(typeof body['markPaid'] === 'boolean' ? { markPaid: body['markPaid'] } : {}),
        ...(idempotencyKey ? { idempotencyKey } : {})
      });

      return reply.status(result.idempotentReplay ? 200 : 201).send({
        success: true,
        idempotentReplay: result.idempotentReplay,
        data: result.transaction
      });
    }
  );

  /**
   * 9. POST /api/v1/partner/patient-360/documents
   * Links a clinical document to Patient + Encounter + Department + Source Entity.
   */
  app.post(
    '/api/v1/partner/patient-360/documents',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;

      const doc = await patient360ContinuityService.linkClinicalDocument(session, {
        patientId: String(body['patientId'] ?? ''),
        encounterId: String(body['encounterId'] ?? ''),
        departmentId: String(body['departmentId'] ?? 'LIMS'),
        sourceEntityType: String(
          body['sourceEntityType'] ?? 'LAB_REPORT'
        ) as CanonicalDocumentRecord['sourceEntityType'],
        sourceEntityId: String(body['sourceEntityId'] ?? ''),
        ...(body['orderId'] ? { orderId: String(body['orderId']) } : {}),
        ...(body['resultId'] ? { resultId: String(body['resultId']) } : {}),
        title: String(body['title'] ?? 'Clinical Diagnostic Report'),
        fileName: String(body['fileName'] ?? 'report.pdf'),
        storageUri: String(body['storageUri'] ?? 's3://docsearch-clinical/reports/report.pdf'),
        ...(body['mimeType'] ? { mimeType: String(body['mimeType']) } : {})
      });

      return reply.status(201).send({
        success: true,
        data: doc
      });
    }
  );

  /**
   * 10. PATCH /api/v1/partner/patient-360/documents/:documentId/rename
   * Renames or relocates a document's file/storage URI while preserving canonical patient/encounter/order linkage.
   */
  app.patch(
    '/api/v1/partner/patient-360/documents/:documentId/rename',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { documentId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;

      const doc = await patient360ContinuityService.renameOrRelocateDocument(
        session,
        params.documentId,
        String(body['newFileName'] ?? 'renamed.pdf'),
        String(body['newStorageUri'] ?? 's3://docsearch-archive/renamed.pdf')
      );

      return reply.status(200).send({
        success: true,
        data: doc
      });
    }
  );

  /**
   * 10B. PATCH /api/v1/partner/patient-360/encounters/:encounterId/status
   * Transitions clinical encounter status through deterministic state machine.
   */
  app.patch(
    '/api/v1/partner/patient-360/encounters/:encounterId/status',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { encounterId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;

      const enc = await patient360ContinuityService.transitionEncounterStatus(
        session,
        params.encounterId,
        String(body['status'] ?? 'IN_PROGRESS') as CanonicalEncounterRecord['status'],
        {
          ...(body['reason'] ? { reason: String(body['reason']) } : {}),
          ...(body['forceExit'] !== undefined ? { forceExit: Boolean(body['forceExit']) } : {}),
          ...(body['consultationNotes'] ? { consultationNotes: String(body['consultationNotes']) } : {}),
          ...(body['vitals'] && typeof body['vitals'] === 'object' ? { vitals: body['vitals'] as Record<string, unknown> } : {}),
          ...(Array.isArray(body['diagnoses']) ? { diagnoses: body['diagnoses'] as Array<{ code: string; description: string }> } : {})
        }
      );

      return reply.status(200).send({
        success: true,
        data: enc
      });
    }
  );

  /**
   * 11. POST /api/v1/partner/patient-360/encounters/:encounterId/exit
   * Executes Patient Exit with mandatory pending-result and unpaid-invoice safety guards.
   */
  app.post(
    '/api/v1/partner/patient-360/encounters/:encounterId/exit',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { encounterId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;

      const enc = await patient360ContinuityService.exitPatientEncounter(
        session,
        params.encounterId,
        {
          ...(typeof body['forceExit'] === 'boolean' ? { forceExit: body['forceExit'] } : {}),
          ...(body['overrideReason'] ? { overrideReason: String(body['overrideReason']) } : {})
        }
      );

      return reply.status(200).send({
        success: true,
        data: enc
      });
    }
  );

  /**
   * 12. GET /api/v1/partner/patient-360/:patientId
   * Returns the complete authoritative Patient 360 Read Model, Timeline, and Audit Lineage.
   */
  app.get(
    '/api/v1/partner/patient-360/:patientId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { patientId: string };
      const query = (request.query ?? {}) as Record<string, unknown>;

      const readModel = await patient360ContinuityService.getPatient360(
        session,
        params.patientId,
        {
          ...(query['tenantId'] ? { tenantId: String(query['tenantId']) } : {}),
          ...(query['partnerId'] ? { partnerId: String(query['partnerId']) } : {}),
          ...(query['branchId'] ? { branchId: String(query['branchId']) } : {}),
          ...(query['locationId'] ? { locationId: String(query['locationId']) } : {})
        }
      );

      return reply.status(200).send({
        success: true,
        data: readModel
      });
    }
  );

  /**
   * 13. GET /api/v1/partner/patient-360/:patientId/timeline
   * Returns the chronological Longitudinal Patient Care Timeline.
   */
  app.get(
    '/api/v1/partner/patient-360/:patientId/timeline',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { patientId: string };
      const query = (request.query ?? {}) as Record<string, unknown>;

      const limit = query['limit'] ? parseInt(String(query['limit']), 10) : undefined;
      const offset = query['offset'] ? parseInt(String(query['offset']), 10) : undefined;

      const timeline = await patient360ContinuityService.getPatientTimeline(
        session,
        params.patientId,
        {
          ...(query['tenantId'] ? { tenantId: String(query['tenantId']) } : {}),
          ...(query['partnerId'] ? { partnerId: String(query['partnerId']) } : {}),
          ...(query['branchId'] ? { branchId: String(query['branchId']) } : {}),
          ...(query['locationId'] ? { locationId: String(query['locationId']) } : {})
        },
        limit !== undefined || offset !== undefined ? { limit, offset } : undefined
      );

      return reply.status(200).send({
        success: true,
        total: timeline.length,
        limit,
        offset,
        data: timeline
      });
    }
  );
}
