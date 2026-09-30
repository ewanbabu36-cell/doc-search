import { type FastifyPluginAsync } from 'fastify';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';
import type {
  DoctorScheduleDto,
  DoctorLeaveDto,
  OpdSlotDto,
  ConsultationFeeMatrixDto,
  CreateDoctorScheduleRequest,
  UpdateDoctorScheduleRequest,
  AddDoctorLeaveRequest,
  ApproveDoctorLeaveRequest,
  BlockOpdSlotRequest,
  CreateConsultationFeeRequest,
  UpdateConsultationFeeRequest
} from '@docsearch/api-contracts';

// In-memory persistent store for roster elements when DB table not yet migrated
const memorySchedules: DoctorScheduleDto[] = [];
const memoryLeaves: DoctorLeaveDto[] = [];
const memorySlots: OpdSlotDto[] = [];
const memoryFees: ConsultationFeeMatrixDto[] = [];

export const rosterRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireModuleCommercialAccess('OPERATIONS'));

  // 1. Schedules
  fastify.get(
    '/api/v1/partner/roster/schedules',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const q = request.query as { doctorId?: string; branchId?: string; dayOfWeek?: string };
      let list = memorySchedules.filter((s) => s.tenantId === request.session.tenantId);
      if (q.doctorId) list = list.filter((s) => s.doctorId === q.doctorId);
      if (q.branchId) list = list.filter((s) => s.branchId === q.branchId);
      if (q.dayOfWeek) list = list.filter((s) => s.dayOfWeek === q.dayOfWeek);
      return { success: true, data: list };
    }
  );

  fastify.post(
    '/api/v1/partner/roster/schedules',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const req = request.body as CreateDoctorScheduleRequest;
      const now = new Date().toISOString();
      const schedule: DoctorScheduleDto = {
        id: crypto.randomUUID(),
        tenantId: request.session.tenantId,
        partnerId: req.partnerId || '22222222-2222-4222-8222-222222222201',
        organizationId: req.organizationId || request.session.organizationId || '44444444-4444-4444-8444-444444444401',
        branchId: req.branchId || request.session.branchId || '88888888-1111-4888-8888-111111111101',
        doctorId: req.doctorId,
        doctorName: 'Dr. Assigned',
        dayOfWeek: req.dayOfWeek,
        shiftName: req.shiftName,
        startTime: req.startTime,
        endTime: req.endTime,
        slotDurationMinutes: req.slotDurationMinutes ?? 15,
        maxPatientsPerSlot: req.maxPatientsPerSlot ?? 1,
        bufferTimeMinutes: req.bufferTimeMinutes ?? 0,
        consultationMode: req.consultationMode ?? 'IN_PERSON',
        roomNumber: req.roomNumber,
        isActive: true,
        breaks: [],
        metadata: {},
        createdAt: now,
        updatedAt: now
      };
      memorySchedules.unshift(schedule);
      reply.status(201);
      return { success: true, data: schedule };
    }
  );

  fastify.put(
    '/api/v1/partner/roster/schedules/:id',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const req = request.body as UpdateDoctorScheduleRequest;
      const schedule = memorySchedules.find((s) => s.id === id && s.tenantId === request.session.tenantId);
      if (!schedule) {
        reply.status(404);
        return { success: false, error: { code: 'SCHEDULE_NOT_FOUND', message: 'Schedule not found' } };
      }
      if (req.startTime) schedule.startTime = req.startTime;
      if (req.endTime) schedule.endTime = req.endTime;
      if (req.slotDurationMinutes !== undefined) schedule.slotDurationMinutes = req.slotDurationMinutes;
      if (req.maxPatientsPerSlot !== undefined) schedule.maxPatientsPerSlot = req.maxPatientsPerSlot;
      if (req.roomNumber !== undefined) schedule.roomNumber = req.roomNumber;
      if (req.isActive !== undefined) schedule.isActive = req.isActive;
      schedule.updatedAt = new Date().toISOString();
      return { success: true, data: schedule };
    }
  );

  // 2. Leaves
  fastify.get(
    '/api/v1/partner/roster/leaves',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const q = request.query as { doctorId?: string };
      let list = memoryLeaves.filter((l) => l.tenantId === request.session.tenantId);
      if (q.doctorId) list = list.filter((l) => l.doctorId === q.doctorId);
      return { success: true, data: list };
    }
  );

  fastify.post(
    '/api/v1/partner/roster/leaves',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const req = request.body as AddDoctorLeaveRequest;
      const now = new Date().toISOString();
      const leave: DoctorLeaveDto = {
        id: crypto.randomUUID(),
        tenantId: request.session.tenantId,
        partnerId: req.partnerId || '22222222-2222-4222-8222-222222222201',
        organizationId: req.organizationId || request.session.organizationId || '44444444-4444-4444-8444-444444444401',
        branchId: req.branchId || request.session.branchId,
        doctorId: req.doctorId,
        doctorName: 'Dr. Physician',
        leaveType: req.leaveType,
        startDate: req.startDate,
        endDate: req.endDate,
        reason: req.reason,
        approvalStatus: 'APPROVED',
        approvedBy: req.actorId,
        affectedSlotsCount: 0,
        metadata: {},
        createdAt: now,
        updatedAt: now
      };
      memoryLeaves.unshift(leave);
      reply.status(201);
      return { success: true, data: leave };
    }
  );

  fastify.patch(
    '/api/v1/partner/roster/leaves/:id/approve',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const req = request.body as ApproveDoctorLeaveRequest;
      const leave = memoryLeaves.find((l) => l.id === id && l.tenantId === request.session.tenantId);
      if (!leave) {
        reply.status(404);
        return { success: false, error: { code: 'LEAVE_NOT_FOUND', message: 'Leave record not found' } };
      }
      leave.approvalStatus = req.approvalStatus;
      leave.approvedBy = req.actorId;
      leave.updatedAt = new Date().toISOString();
      return { success: true, data: leave };
    }
  );

  // 3. OPD Slots
  fastify.get(
    '/api/v1/partner/roster/slots',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const q = request.query as { doctorId?: string; branchId?: string; slotDate?: string };
      let list = memorySlots.filter((s) => s.tenantId === request.session.tenantId);
      if (q.doctorId) list = list.filter((s) => s.doctorId === q.doctorId);
      if (q.branchId) list = list.filter((s) => s.branchId === q.branchId);
      if (q.slotDate) list = list.filter((s) => s.slotDate === q.slotDate);
      return { success: true, data: list };
    }
  );

  fastify.patch(
    '/api/v1/partner/roster/slots/:id/block',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const req = request.body as BlockOpdSlotRequest;
      let slot = memorySlots.find((s) => s.id === id && s.tenantId === request.session.tenantId);
      if (!slot) {
        // Create if dynamically referenced
        slot = {
          id,
          tenantId: request.session.tenantId,
          partnerId: req.partnerId || '22222222-2222-4222-8222-222222222201',
          organizationId: req.organizationId || request.session.organizationId || '44444444-4444-4444-8444-444444444401',
          branchId: request.session.branchId || '88888888-1111-4888-8888-111111111101',
          scheduleId: crypto.randomUUID(),
          doctorId: 'default-doc',
          doctorName: 'Dr. Physician',
          slotDate: new Date().toISOString().split('T')[0] ?? '2026-03-02',
          startTime: '09:00',
          endTime: '09:15',
          consultationMode: 'IN_PERSON',
          bookingStatus: 'BLOCKED',
          blockReason: req.blockReason,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        memorySlots.push(slot);
      } else {
        slot.bookingStatus = 'BLOCKED';
        slot.blockReason = req.blockReason;
        slot.updatedAt = new Date().toISOString();
      }
      return { success: true, data: slot };
    }
  );

  fastify.patch(
    '/api/v1/partner/roster/slots/:id/unblock',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const slot = memorySlots.find((s) => s.id === id && s.tenantId === request.session.tenantId);
      if (!slot) {
        reply.status(404);
        return { success: false, error: { code: 'SLOT_NOT_FOUND', message: 'Slot not found' } };
      }
      slot.bookingStatus = 'AVAILABLE';
      slot.blockReason = undefined;
      slot.updatedAt = new Date().toISOString();
      return { success: true, data: slot };
    }
  );

  // 4. Consultation Fees
  fastify.get(
    '/api/v1/partner/roster/fees',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const q = request.query as { organizationId?: string; branchId?: string; specialtyCode?: string; doctorId?: string };
      let list = memoryFees.filter((f) => f.tenantId === request.session.tenantId);
      if (q.organizationId) list = list.filter((f) => f.organizationId === q.organizationId);
      if (q.branchId) list = list.filter((f) => f.branchId === q.branchId);
      if (q.specialtyCode) list = list.filter((f) => f.specialtyCode === q.specialtyCode);
      if (q.doctorId) list = list.filter((f) => f.doctorId === q.doctorId);
      return { success: true, data: list };
    }
  );

  fastify.post(
    '/api/v1/partner/roster/fees',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const req = request.body as CreateConsultationFeeRequest;
      const now = new Date().toISOString();
      const fee: ConsultationFeeMatrixDto = {
        id: crypto.randomUUID(),
        tenantId: request.session.tenantId,
        partnerId: req.partnerId || '22222222-2222-4222-8222-222222222201',
        organizationId: req.organizationId || request.session.organizationId || '44444444-4444-4444-8444-444444444401',
        branchId: req.branchId || request.session.branchId,
        specialtyCode: req.specialtyCode,
        doctorId: req.doctorId,
        doctorName: req.doctorId ? 'Consultant' : undefined,
        consultationType: req.consultationType,
        currency: req.currency || 'INR',
        baseFeeAmount: req.baseFeeAmount,
        followUpValidityDays: req.followUpValidityDays ?? 14,
        effectiveDate: req.effectiveDate || now,
        expiryDate: req.expiryDate,
        status: 'ACTIVE',
        metadata: {},
        createdAt: now,
        updatedAt: now
      };
      memoryFees.unshift(fee);
      reply.status(201);
      return { success: true, data: fee };
    }
  );

  fastify.put(
    '/api/v1/partner/roster/fees/:id',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const req = request.body as UpdateConsultationFeeRequest;
      const fee = memoryFees.find((f) => f.id === id && f.tenantId === request.session.tenantId);
      if (!fee) {
        reply.status(404);
        return { success: false, error: { code: 'FEE_NOT_FOUND', message: 'Consultation fee entry not found' } };
      }
      if (req.baseFeeAmount !== undefined) fee.baseFeeAmount = req.baseFeeAmount;
      if (req.followUpValidityDays !== undefined) fee.followUpValidityDays = req.followUpValidityDays;
      if (req.status) fee.status = req.status;
      fee.updatedAt = new Date().toISOString();
      return { success: true, data: fee };
    }
  );
};
