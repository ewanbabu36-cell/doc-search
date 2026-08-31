import crypto from 'crypto';
import {
  AssetBiomedicalRepository,
  type BiomedicalAssetRecord
} from '../../repositories/partner/AssetBiomedicalRepository.js';
import { AppError } from '@docsearch/shared-core';

export class AssetBiomedicalService {
  constructor(private readonly repo = new AssetBiomedicalRepository()) {}

  private computeHash(payload: Record<string, unknown>, previousHash?: string): string {
    const serialized = JSON.stringify(payload);
    return crypto.createHash('sha256').update(`${previousHash || 'GENESIS'}::${serialized}`).digest('hex');
  }

  async getOverviewMetrics(tenantId: string) {
    return await this.repo.getOverviewMetrics(tenantId);
  }

  async getDowntimeAnalytics(tenantId: string) {
    return await this.repo.getDowntimeAnalytics(tenantId);
  }

  // Assets
  async getAssets(tenantId: string) {
    return await this.repo.getAssets(tenantId);
  }

  async createAsset(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const assetTag = String(payload['assetTag'] || '');
    const assetName = String(payload['assetName'] || '');

    if (!assetTag || !assetName) {
      throw new AppError({ message: 'Asset tag and asset name are required', statusCode: 400 });
    }

    const asset = await this.repo.createAsset({
      ...payload,
      tenantId,
      branchId,
      assetName,
      assetTag,
      status: String(payload['status'] || 'OPERATIONAL')
    });

    const hash = this.computeHash({ event: 'ASSET_CREATED', assetId: asset.id, tag: assetTag });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'BIOMEDICAL_ASSET',
      entityId: asset.id as string,
      action: 'CREATE_ASSET',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Asset registered in hospital inventory',
      details: { assetTag, assetName }
    });

    return asset;
  }

  async updateAsset(tenantId: string, id: string, actorId: string, payload: Partial<BiomedicalAssetRecord>) {
    const existing = await this.repo.getAssetById(tenantId, id);
    if (!existing) {
      throw new AppError({ message: 'Asset not found', statusCode: 404 });
    }

    const updated = await this.repo.updateAsset(id, payload);
    const hash = this.computeHash({ event: 'ASSET_UPDATED', assetId: id, updates: payload });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: existing.branchId || 'default',
      entityType: 'BIOMEDICAL_ASSET',
      entityId: id,
      action: 'UPDATE_ASSET',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Asset updated',
      details: payload
    });

    return updated;
  }

  // Work Orders
  async getWorkOrders(tenantId: string) {
    return await this.repo.getWorkOrders(tenantId);
  }

  async createWorkOrder(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const assetId = String(payload['assetId'] || '');
    const issueDescription = String(payload['issueDescription'] || '');

    if (!assetId || !issueDescription) {
      throw new AppError({ message: 'Asset ID and issue description are required', statusCode: 400 });
    }

    const workOrderNumber = 'WO-BM-' + Date.now().toString().slice(-6);
    const workOrder = await this.repo.createWorkOrder({
      ...payload,
      tenantId,
      branchId,
      assetId,
      issueDescription,
      workOrderNumber,
      reportedBy: actorId,
      status: 'REPORTED'
    });

    // Mark asset as UNDER_MAINTENANCE / BREAKDOWN
    await this.repo.updateAsset(assetId, { status: 'BREAKDOWN' });

    const hash = this.computeHash({ event: 'WORK_ORDER_REPORTED', workOrderId: workOrder.id, number: workOrderNumber });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'WORK_ORDER',
      entityId: workOrder.id as string,
      action: 'CREATE_WORK_ORDER',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Breakdown reported',
      details: { workOrderNumber, priority: payload['priority'] }
    });

    return workOrder;
  }

  async assignWorkOrder(tenantId: string, workOrderId: string, actorId: string, payload: { assignedToEngineerId: string; priority?: string }) {
    const updated = await this.repo.updateWorkOrder(workOrderId, {
      assignedTo: payload.assignedToEngineerId,
      status: 'ASSIGNED',
      assignedAt: new Date()
    });

    if (!updated) throw new AppError({ message: 'Work order not found', statusCode: 404 });

    const hash = this.computeHash({ event: 'WORK_ORDER_ASSIGNED', workOrderId, engineer: payload.assignedToEngineerId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'WORK_ORDER',
      entityId: workOrderId,
      action: 'ASSIGN_WORK_ORDER',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Engineer assigned',
      details: payload
    });

    return updated;
  }

  async completeWorkOrder(tenantId: string, workOrderId: string, actorId: string, payload: { rootCause: string; correctiveAction: string; downtimeMinutes?: number }) {
    const updated = await this.repo.updateWorkOrder(workOrderId, {
      rootCause: payload.rootCause,
      correctiveAction: payload.correctiveAction,
      status: 'COMPLETED',
      completedAt: new Date(),
      downtimeMinutes: payload.downtimeMinutes || 60
    });

    if (!updated) throw new AppError({ message: 'Work order not found', statusCode: 404 });

    const hash = this.computeHash({ event: 'WORK_ORDER_COMPLETED', workOrderId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'WORK_ORDER',
      entityId: workOrderId,
      action: 'COMPLETE_WORK_ORDER',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Repair completed',
      details: payload
    });

    return updated;
  }

  async verifyWorkOrder(tenantId: string, workOrderId: string, actorId: string, payload: { verifiedBy: string; verificationNotes: string }) {
    const updated = await this.repo.updateWorkOrder(workOrderId, {
      verifiedBy: payload.verifiedBy,
      status: 'VERIFIED',
      verifiedAt: new Date()
    });

    if (!updated) throw new AppError({ message: 'Work order not found', statusCode: 404 });

    // Restore asset status to OPERATIONAL
    if (updated.assetId) {
      await this.repo.updateAsset(updated.assetId, { status: 'OPERATIONAL' });
    }

    const hash = this.computeHash({ event: 'WORK_ORDER_VERIFIED', workOrderId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'WORK_ORDER',
      entityId: workOrderId,
      action: 'VERIFY_WORK_ORDER',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Work order verified by clinician',
      details: payload
    });

    return updated;
  }

  // PPM Schedules
  async getPpmSchedules(tenantId: string) {
    return await this.repo.getPpmSchedules(tenantId);
  }

  async createPpmSchedule(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const assetId = String(payload['assetId'] || '');
    const schedule = await this.repo.createPpmSchedule({
      ...payload,
      tenantId,
      branchId,
      assetId,
      status: 'SCHEDULED'
    });

    const hash = this.computeHash({ event: 'PPM_SCHEDULED', scheduleId: schedule.id });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'PPM_SCHEDULE',
      entityId: schedule.id as string,
      action: 'CREATE_PPM_SCHEDULE',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'PPM scheduled',
      details: { assetId, scheduledDate: payload['scheduledDate'] }
    });

    return schedule;
  }

  async completePpmTask(tenantId: string, scheduleId: string, actorId: string, payload: { checklistResults: Record<string, boolean>; completedBy: string; remarks?: string }) {
    const updated = await this.repo.updatePpmSchedule(scheduleId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy: payload.completedBy,
      checklistResults: payload.checklistResults
    });

    if (!updated) throw new AppError({ message: 'PPM schedule not found', statusCode: 404 });

    const hash = this.computeHash({ event: 'PPM_COMPLETED', scheduleId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'PPM_SCHEDULE',
      entityId: scheduleId,
      action: 'COMPLETE_PPM',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'PPM completed',
      details: payload
    });

    return updated;
  }

  // Calibration Records
  async getCalibrationRecords(tenantId: string) {
    return await this.repo.getCalibrationRecords(tenantId);
  }

  async createCalibrationRecord(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const assetId = String(payload['assetId'] || '');
    const record = await this.repo.createCalibrationRecord({
      ...payload,
      tenantId,
      branchId,
      assetId,
      calibrationDate: (payload['calibrationDate'] as string | Date) || new Date()
    });

    const hash = this.computeHash({ event: 'CALIBRATION_LOGGED', recordId: record.id });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'CALIBRATION_RECORD',
      entityId: record.id as string,
      action: 'LOG_CALIBRATION',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Calibration certificate logged',
      details: { certificateNumber: payload['certificateNumber'], validityDate: payload['validityDate'] }
    });

    return record;
  }

  // Safety Test Records (IEC 62353)
  async getSafetyTestRecords(tenantId: string) {
    return await this.repo.getSafetyTestRecords(tenantId);
  }

  async createSafetyTestRecord(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const assetId = String(payload['assetId'] || '');
    const record = await this.repo.createSafetyTestRecord({
      ...payload,
      tenantId,
      branchId,
      assetId,
      testDate: (payload['testDate'] as string | Date) || new Date()
    });

    const hash = this.computeHash({ event: 'SAFETY_TEST_LOGGED', recordId: record.id });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'SAFETY_TEST',
      entityId: record.id as string,
      action: 'LOG_SAFETY_TEST',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Electrical safety test logged',
      details: { testType: payload['testType'], overallStatus: payload['overallStatus'] }
    });

    return record;
  }

  // Spare Parts
  async getSpareParts(tenantId: string) {
    return await this.repo.getSpareParts(tenantId);
  }

  async createSparePart(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const part = await this.repo.createSparePart({
      ...payload,
      tenantId,
      branchId
    });

    const hash = this.computeHash({ event: 'SPARE_PART_CREATED', partId: part.id });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'SPARE_PART',
      entityId: part.id as string,
      action: 'CREATE_SPARE_PART',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Spare part registered',
      details: { partNumber: payload['partNumber'], partName: payload['partName'] }
    });

    return part;
  }

  async consumeSparePart(tenantId: string, branchId: string, actorId: string, payload: { sparePartId: string; workOrderId?: string; quantityUsed: number; usedBy: string }) {
    const usage = await this.repo.recordSparePartUsage({
      ...payload,
      tenantId,
      branchId
    });

    const hash = this.computeHash({ event: 'SPARE_PART_CONSUMED', usageId: usage['id'], quantity: payload.quantityUsed });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'SPARE_PART_USAGE',
      entityId: usage['id'] as string,
      action: 'CONSUME_SPARE_PART',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Spare part consumed in work order',
      details: payload
    });

    return usage;
  }

  // Condemnations
  async getCondemnations(tenantId: string) {
    return await this.repo.getCondemnations(tenantId);
  }

  async createCondemnation(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const assetId = String(payload['assetId'] || '');
    const condemnation = await this.repo.createCondemnation({
      ...payload,
      tenantId,
      branchId,
      assetId,
      status: 'PENDING_COMMITTEE_REVIEW'
    });

    const hash = this.computeHash({ event: 'CONDEMNATION_PROPOSED', condemnationId: condemnation.id });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      entityType: 'CONDEMNATION',
      entityId: condemnation.id as string,
      action: 'PROPOSE_CONDEMNATION',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Condemnation proposal submitted',
      details: { assetId, reason: payload['reasonForCondemnation'] }
    });

    return condemnation;
  }

  async approveCondemnation(tenantId: string, condemnationId: string, actorId: string, payload: { approvedBy: string; committeeMeetingDate?: string; disposalMethod?: string }) {
    const updated = await this.repo.updateCondemnation(condemnationId, {
      status: 'APPROVED',
      approvedBy: payload.approvedBy,
      approvedAt: new Date(),
      disposalMethod: payload.disposalMethod || 'E_WASTE_RECYCLING'
    });

    if (!updated) throw new AppError({ message: 'Condemnation record not found', statusCode: 404 });

    // Mark asset as CONDEMNED
    if (updated.assetId) {
      await this.repo.updateAsset(updated.assetId, { status: 'CONDEMNED' });
    }

    const hash = this.computeHash({ event: 'CONDEMNATION_APPROVED', condemnationId });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId: updated.branchId || 'default',
      entityType: 'CONDEMNATION',
      entityId: condemnationId,
      action: 'APPROVE_CONDEMNATION',
      performedBy: actorId,
      integrityHash: hash,
      justification: 'Condemnation board approval',
      details: payload
    });

    return updated;
  }

  // Audit Traces
  async getAuditTraces(tenantId: string) {
    return await this.repo.getAuditTraces(tenantId);
  }
}
