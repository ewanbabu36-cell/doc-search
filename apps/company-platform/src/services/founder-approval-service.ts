import { apiCall, apiRequest, isMockFallbackAllowed } from './api-client.js';

export interface FounderApprovalRequestDto {
  id: string;
  requestNumber: string;
  entityType: string;
  taskTitle: string;
  submitterName: string;
  submitterEmail: string;
  submitterRole: string;
  payloadData: Record<string, unknown>;
  approvalStatus: 'PENDING_FOUNDER_APPROVAL' | 'APPROVED_BY_FOUNDER' | 'REJECTED_BY_FOUNDER';
  taskStatus: 'AWAITING_FOUNDER_APPROVAL' | 'COMPLETED' | 'REJECTED';
  founderRemarks?: string | null;
  approvedByEmail?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitApprovalPayload {
  entityType: string;
  taskTitle: string;
  payloadData: Record<string, unknown>;
  submitterName?: string;
}

export interface ApprovalResultDto {
  id: string;
  requestNumber: string;
  entityType: string;
  taskTitle: string;
  approvalStatus: string;
  taskStatus: string;
  isImmediateCompleted: boolean;
  message: string;
}

const STORAGE_KEY = 'docsearch_founder_approvals';

export class FounderApprovalService {
  private getLocalStored(): FounderApprovalRequestDto[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setLocalStored(data: FounderApprovalRequestDto[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  async getApprovals(status?: string): Promise<FounderApprovalRequestDto[]> {
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const data = await apiCall<FounderApprovalRequestDto[]>(`/api/v1/company/approvals${query}`);
      this.setLocalStored(data);
      return data;
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      const local = this.getLocalStored();
      if (status) {
        return local.filter((r) => r.approvalStatus === status);
      }
      return local;
    }
  }

  async submitForm(payload: SubmitApprovalPayload, activeRole?: string, activeEmail?: string): Promise<ApprovalResultDto> {
    const normEmail = (activeEmail || '').toLowerCase();
    const isFounder =
      activeRole === 'SUPER_ADMIN_FOUNDER' ||
      activeRole === 'SUPER_ADMIN' ||
      activeRole === 'FOUNDER' ||
      normEmail === 'founder@docsearch.health' ||
      normEmail === 'meraj@docsearch.health';
    try {
      return await apiCall<ApprovalResultDto>('/api/v1/company/approvals/submit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;

      // Fallback in-memory tracking
      const id = crypto.randomUUID();
      const reqNumber = `REQ-FND-${Date.now().toString().slice(-6)}`;
      const approvalStatus = isFounder ? 'APPROVED_BY_FOUNDER' : 'PENDING_FOUNDER_APPROVAL';
      const taskStatus = isFounder ? 'COMPLETED' : 'AWAITING_FOUNDER_APPROVAL';

      const newItem: FounderApprovalRequestDto = {
        id,
        requestNumber: reqNumber,
        entityType: payload.entityType,
        taskTitle: payload.taskTitle,
        submitterName: payload.submitterName || (isFounder ? 'MERAJ SHARIF' : 'Enterprise Staff'),
        submitterEmail: activeEmail || (isFounder ? 'founder@docsearch.health' : 'sales@docsearch.health'),
        submitterRole: activeRole || (isFounder ? 'SUPER_ADMIN' : 'FIELD_SALES_REP'),
        payloadData: payload.payloadData,
        approvalStatus,
        taskStatus,
        founderRemarks: isFounder ? 'Auto-approved by Founder Master Authority' : null,
        approvedByEmail: isFounder ? 'founder@docsearch.health' : null,
        approvedAt: isFounder ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const current = this.getLocalStored();
      current.unshift(newItem);
      this.setLocalStored(current);

      return {
        id,
        requestNumber: reqNumber,
        entityType: payload.entityType,
        taskTitle: payload.taskTitle,
        approvalStatus,
        taskStatus,
        isImmediateCompleted: isFounder,
        message: isFounder
          ? '✓ Task completed immediately under Founder Master Authority.'
          : '⏳ Form submitted! Task is PENDING FOUNDER APPROVAL. Task will only complete once approved by Founder MERAJ SHARIF.'
      };
    }
  }

  async approveRequest(id: string, remarks?: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiRequest<{ success: boolean; message?: string; data?: any }>(`/api/v1/company/approvals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ remarks })
      });
      if (res.success) {
        return { success: true, message: (res as any).message || 'Approved successfully by Founder MERAJ SHARIF' };
      }
      throw new Error(res.error?.message || 'Approval failed');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;

      const current = this.getLocalStored();
      const target = current.find((r) => r.id === id);
      if (target) {
        target.approvalStatus = 'APPROVED_BY_FOUNDER';
        target.taskStatus = 'COMPLETED';
        target.approvedByEmail = 'founder@docsearch.health';
        target.approvedAt = new Date().toISOString();
        target.founderRemarks = remarks || 'Approved by Founder MERAJ SHARIF';
        target.updatedAt = new Date().toISOString();
        this.setLocalStored(current);
        return {
          success: true,
          message: `Request ${target.requestNumber} APPROVED by Founder MERAJ SHARIF. Task is now COMPLETED.`
        };
      }
      return { success: false, message: 'Approval request not found' };
    }
  }

  async rejectRequest(id: string, remarks: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiRequest<{ success: boolean; message?: string; data?: any }>(`/api/v1/company/approvals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ remarks })
      });
      if (res.success) {
        return { success: true, message: (res as any).message || 'Rejected by Founder MERAJ SHARIF' };
      }
      throw new Error(res.error?.message || 'Rejection failed');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;

      const current = this.getLocalStored();
      const target = current.find((r) => r.id === id);
      if (target) {
        target.approvalStatus = 'REJECTED_BY_FOUNDER';
        target.taskStatus = 'REJECTED';
        target.approvedByEmail = 'founder@docsearch.health';
        target.approvedAt = new Date().toISOString();
        target.founderRemarks = remarks || 'Rejected by Founder MERAJ SHARIF';
        target.updatedAt = new Date().toISOString();
        this.setLocalStored(current);
        return {
          success: true,
          message: `Request ${target.requestNumber} REJECTED by Founder MERAJ SHARIF.`
        };
      }
      return { success: false, message: 'Approval request not found' };
    }
  }
}

export const founderApprovalService = new FounderApprovalService();
