import { getDatabase, founderApprovalRequests, eq, desc, and } from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import crypto from 'node:crypto';

const logger = createLogger('founder-approval-repository');

export interface SubmitApprovalInput {
  entityType: string;
  taskTitle: string;
  submitterName: string;
  submitterEmail: string;
  submitterRole: string;
  payloadData: Record<string, unknown>;
  isFounder?: boolean;
}

export class FounderApprovalRepository {
  async getApprovals(status?: string, dbClient = getDatabase()) {
    try {
      const conditions = [];
      if (status) {
        conditions.push(eq(founderApprovalRequests.approvalStatus, status));
      }

      const rows = await dbClient
        .select()
        .from(founderApprovalRequests)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(founderApprovalRequests.createdAt));

      return rows.map((r: any) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        entityType: r.entityType,
        taskTitle: r.taskTitle,
        submitterName: r.submitterName,
        submitterEmail: r.submitterEmail,
        submitterRole: r.submitterRole,
        payloadData: (r.payloadData as Record<string, unknown>) || {},
        approvalStatus: r.approvalStatus,
        taskStatus: r.taskStatus,
        founderRemarks: r.founderRemarks || null,
        approvedByEmail: r.approvedByEmail || null,
        approvedAt: r.approvedAt instanceof Date ? r.approvedAt.toISOString() : (r.approvedAt ? String(r.approvedAt) : null),
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
      }));
    } catch (err) {
      logger.error('Failed to fetch founder approval requests', err);
      return [];
    }
  }

  async submitRequest(input: SubmitApprovalInput, dbClient = getDatabase()) {
    const isFounder = Boolean(input.isFounder);
    const reqNumber = `REQ-FND-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const approvalStatus = isFounder ? 'APPROVED_BY_FOUNDER' : 'PENDING_FOUNDER_APPROVAL';
    const taskStatus = isFounder ? 'COMPLETED' : 'AWAITING_FOUNDER_APPROVAL';

    const [created] = await dbClient
      .insert(founderApprovalRequests)
      .values({
        id: crypto.randomUUID(),
        requestNumber: reqNumber,
        entityType: input.entityType,
        taskTitle: input.taskTitle,
        submitterName: input.submitterName,
        submitterEmail: input.submitterEmail,
        submitterRole: input.submitterRole,
        payloadData: input.payloadData,
        approvalStatus,
        taskStatus,
        approvedByEmail: isFounder ? input.submitterEmail : null,
        approvedAt: isFounder ? new Date() : null,
        founderRemarks: isFounder ? 'Auto-approved by Founder Master Authority' : null
      })
      .returning();

    if (!created) {
      throw new AppError({
        message: 'Failed to create approval request in database',
        code: ErrorCode.DATABASE_ERROR,
        statusCode: 500
      });
    }

    return {
      id: created.id,
      requestNumber: created.requestNumber,
      entityType: created.entityType,
      taskTitle: created.taskTitle,
      submitterName: created.submitterName,
      submitterEmail: created.submitterEmail,
      submitterRole: created.submitterRole,
      payloadData: created.payloadData,
      approvalStatus: created.approvalStatus,
      taskStatus: created.taskStatus,
      isImmediateCompleted: isFounder,
      message: isFounder
        ? '✓ Task completed immediately under Founder Master Authority.'
        : '⏳ Form submitted! Task is PENDING FOUNDER APPROVAL. Task will only complete once approved by Founder MERAJ SHARIF.'
    };
  }

  async approveRequest(id: string, founderEmail: string, remarks?: string, dbClient = getDatabase()) {
    const [existing] = await dbClient
      .select()
      .from(founderApprovalRequests)
      .where(eq(founderApprovalRequests.id, id))
      .limit(1);

    if (!existing) {
      throw new AppError({
        message: `Approval request ${id} not found`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (existing.approvalStatus === 'APPROVED_BY_FOUNDER') {
      throw new AppError({
        message: 'Request is already approved by Founder',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const [updated] = await dbClient
      .update(founderApprovalRequests)
      .set({
        approvalStatus: 'APPROVED_BY_FOUNDER',
        taskStatus: 'COMPLETED',
        approvedByEmail: founderEmail,
        approvedAt: new Date(),
        founderRemarks: remarks || 'Approved by Founder MERAJ SHARIF',
        updatedAt: new Date()
      })
      .where(eq(founderApprovalRequests.id, id))
      .returning();

    return {
      success: true,
      data: updated,
      message: '✓ Approved by Founder MERAJ SHARIF. The requested task has been COMPLETED and changes activated.'
    };
  }

  async rejectRequest(id: string, founderEmail: string, remarks: string, dbClient = getDatabase()) {
    const [existing] = await dbClient
      .select()
      .from(founderApprovalRequests)
      .where(eq(founderApprovalRequests.id, id))
      .limit(1);

    if (!existing) {
      throw new AppError({
        message: `Approval request ${id} not found`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const [updated] = await dbClient
      .update(founderApprovalRequests)
      .set({
        approvalStatus: 'REJECTED_BY_FOUNDER',
        taskStatus: 'REJECTED',
        approvedByEmail: founderEmail,
        approvedAt: new Date(),
        founderRemarks: remarks || 'Rejected by Founder',
        updatedAt: new Date()
      })
      .where(eq(founderApprovalRequests.id, id))
      .returning();

    return {
      success: true,
      data: updated,
      message: '❌ Request rejected by Founder. The task will NOT be executed.'
    };
  }
}

export const founderApprovalRepository = new FounderApprovalRepository();
