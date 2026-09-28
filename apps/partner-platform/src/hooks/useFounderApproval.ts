import { useState, useEffect, useCallback } from 'react';
import {
  partnerFounderApprovalService,
  type FounderApprovalRequestDto,
  type SubmitApprovalPayload,
  type ApprovalResultDto
} from '../services/founder-approval-service.js';

export function useFounderApproval(activeRole?: string, activeEmail?: string) {
  const normEmail = (activeEmail || '').toLowerCase();
  const isFounder =
    activeRole === 'SUPER_ADMIN_FOUNDER' ||
    activeRole === 'FOUNDER' ||
    activeRole === 'SUPER_ADMIN' ||
    normEmail === 'founder@docsearch.health' ||
    normEmail === 'meraj@docsearch.health';

  const [requests, setRequests] = useState<FounderApprovalRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSubmissionNotice, setLastSubmissionNotice] = useState<string | null>(null);

  const fetchApprovals = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const data = await partnerFounderApprovalService.getApprovals(status);
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
    const res = await partnerFounderApprovalService.submitForm(payload, activeRole, activeEmail);
    if (!res.isImmediateCompleted) {
      setLastSubmissionNotice(
        `Form update submitted: PENDING COMPLIANCE APPROVAL. Task is incomplete until approved.`
      );
    } else {
      setLastSubmissionNotice('Task COMPLETED immediately by Authorized Compliance Authority.');
    }
    await fetchApprovals();
    return res;
  };

  const approveRequest = async (id: string, remarks?: string) => {
    const res = await partnerFounderApprovalService.approveRequest(id, activeRole, activeEmail, remarks);
    await fetchApprovals();
    return res;
  };

  const rejectRequest = async (id: string, remarks?: string) => {
    const res = await partnerFounderApprovalService.rejectRequest(id, activeRole, activeEmail, remarks);
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
