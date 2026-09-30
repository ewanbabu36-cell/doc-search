import { apiCall, apiRequest, isMockFallbackAllowed } from './api-client';

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
      const data = await apiCall<FounderApprovalRequestDto[]>(`/api/v1/partner/approvals${query}`);
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
      activeRole === 'FOUNDER' ||
      activeRole === 'SUPER_ADMIN' ||
      normEmail === 'founder@docsearch.health' ||
      normEmail === 'meraj@docsearch.health';
    try {
      return await apiCall<ApprovalResultDto>('/api/v1/partner/approvals/submit', {
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
        submitterName: payload.submitterName || (isFounder ? 'Compliance Directorate' : 'Healthcare Staff'),
        submitterEmail: activeEmail || (isFounder ? 'compliance@docsearch.health' : 'staff@docsearch.health'),
        submitterRole: activeRole || (isFounder ? 'SUPER_ADMIN_FOUNDER' : 'HEALTHCARE_STAFF'),
        payloadData: payload.payloadData,
        approvalStatus,
        taskStatus,
        founderRemarks: isFounder ? 'Auto-approved for Compliance' : null,
        approvedByEmail: isFounder ? 'compliance@docsearch.health' : null,
        approvedAt: isFounder ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existing = this.getLocalStored();
      this.setLocalStored([newItem, ...existing]);

      return {
        id,
        requestNumber: reqNumber,
        entityType: payload.entityType,
        taskTitle: payload.taskTitle,
        approvalStatus,
        taskStatus,
        isImmediateCompleted: isFounder,
        message: isFounder
          ? 'Task COMPLETED immediately by Authorized Compliance Authority.'
          : `Form update submitted: PENDING REGULATORY APPROVAL. Task status: AWAITING_REGULATORY_APPROVAL.`
      };
    }
  }

  async approveRequest(id: string, activeRole?: string, activeEmail?: string, remarks?: string): Promise<{ success: boolean; message: string }> {
    const normEmail = (activeEmail || '').toLowerCase();
    const isFounder =
      activeRole === 'SUPER_ADMIN_FOUNDER' ||
      activeRole === 'FOUNDER' ||
      activeRole === 'SUPER_ADMIN' ||
      normEmail === 'founder@docsearch.health' ||
      normEmail === 'meraj@docsearch.health';
    if (!isFounder) {
      throw new Error('Access Denied: Only Healthcare Compliance Directorate has the authority to approve form submissions and complete tasks.');
    }

    try {
      const res = await apiRequest<{ success: boolean; data: any; message?: string }>(`/api/v1/partner/approvals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ remarks: remarks || 'Approved by Healthcare Compliance Directorate' })
      });
      if (res.success) {
        return {
          success: true,
          message: (res as any).message || 'Approved successfully by Healthcare Compliance Directorate'
        };
      }
      throw new Error(res.error?.message || 'Approval failed');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;

      const existing = this.getLocalStored();
      const target = existing.find((r) => r.id === id);
      if (!target) {
        throw new Error('Approval request not found');
      }

      target.approvalStatus = 'APPROVED_BY_FOUNDER';
      target.taskStatus = 'COMPLETED';
      target.approvedByEmail = 'compliance@docsearch.health';
      target.approvedAt = new Date().toISOString();
      target.founderRemarks = remarks || 'Approved by Healthcare Compliance Directorate';
      target.updatedAt = new Date().toISOString();

      this.setLocalStored(existing);
      return {
        success: true,
        message: `Request ${target.requestNumber} APPROVED by Healthcare Compliance Directorate. Task status is now COMPLETED.`
      };
    }
  }

  async rejectRequest(id: string, activeRole?: string, activeEmail?: string, remarks?: string): Promise<{ success: boolean; message: string }> {
    const normEmail = (activeEmail || '').toLowerCase();
    const isFounder =
      activeRole === 'SUPER_ADMIN_FOUNDER' ||
      activeRole === 'FOUNDER' ||
      activeRole === 'SUPER_ADMIN' ||
      normEmail === 'founder@docsearch.health' ||
      normEmail === 'meraj@docsearch.health';
    if (!isFounder) {
      throw new Error('Access Denied: Only Healthcare Compliance Directorate has the authority to reject form submissions.');
    }

    try {
      const res = await apiRequest<{ success: boolean; data: any; message?: string }>(`/api/v1/partner/approvals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ remarks: remarks || 'Rejected by Healthcare Compliance Directorate' })
      });
      if (res.success) {
        return {
          success: true,
          message: (res as any).message || 'Rejected successfully by Healthcare Compliance Directorate'
        };
      }
      throw new Error(res.error?.message || 'Rejection failed');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;

      const existing = this.getLocalStored();
      const target = existing.find((r) => r.id === id);
      if (!target) {
        throw new Error('Approval request not found');
      }

      target.approvalStatus = 'REJECTED_BY_FOUNDER';
      target.taskStatus = 'REJECTED';
      target.approvedByEmail = 'compliance@docsearch.health';
      target.approvedAt = new Date().toISOString();
      target.founderRemarks = remarks || 'Rejected by Healthcare Compliance Directorate';
      target.updatedAt = new Date().toISOString();

      this.setLocalStored(existing);
      return {
        success: true,
        message: `Request ${target.requestNumber} REJECTED by Healthcare Compliance Directorate.`
      };
    }
  }
}

export const partnerFounderApprovalService = new FounderApprovalService();
