import { useState, useEffect, useCallback } from 'react';
import {
  FounderApprovalService,
  type FounderApprovalRequestDto,
  type SubmitApprovalPayload,
  type ApprovalResultDto
} from '../services/founder-approval-service.js';

const approvalService = new FounderApprovalService();

export function useFounderApproval(activeRole?: string, activeEmail?: string) {
  const normEmail = (activeEmail || '').toLowerCase();
  const isFounder =
    activeRole === 'SUPER_ADMIN_FOUNDER' ||
    activeRole === 'SUPER_ADMIN' ||
    activeRole === 'FOUNDER' ||
    normEmail === 'founder@docsearch.health' ||
    normEmail === 'meraj@docsearch.health';

  const [requests, setRequests] = useState<FounderApprovalRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSubmissionNotice, setLastSubmissionNotice] = useState<string | null>(null);

  const fetchApprovals = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const data = await approvalService.getApprovals(status);
      setRequests(data);
    } catch {
      // fallback handled inside service
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchApprovals();
  }, [fetchApprovals]);

  const submitFormWithApproval = async (payload: SubmitApprovalPayload): Promise<ApprovalResultDto> => {
    const res = await approvalService.submitForm(payload, activeRole, activeEmail);
    if (!res.isImmediateCompleted) {
      setLastSubmissionNotice(
        `Form update submitted: PENDING FOUNDER APPROVAL (MERAJ SHARIF). Task is incomplete until approved.`
      );
    } else {
      setLastSubmissionNotice('Task COMPLETED immediately by Founder MERAJ SHARIF.');
    }
    await fetchApprovals();
    return res;
  };

  const approveRequest = async (id: string, remarks?: string) => {
    const res = await approvalService.approveRequest(id, remarks);
    await fetchApprovals();
    return res;
  };

  const rejectRequest = async (id: string, remarks?: string) => {
    const res = await approvalService.rejectRequest(id, remarks || 'Rejected by Founder MERAJ SHARIF');
    await fetchApprovals();
    return res;
  };

  const pendingCount = requests.filter((r) => r.approvalStatus === 'PENDING_FOUNDER_APPROVAL').length;

  return {
    isFounder,
    requests,
    loading,
    pendingCount,
    lastSubmissionNotice,
    clearNotice: () => setLastSubmissionNotice(null),
    fetchApprovals,
    submitFormWithApproval,
    approveRequest,
    rejectRequest
  };
}
