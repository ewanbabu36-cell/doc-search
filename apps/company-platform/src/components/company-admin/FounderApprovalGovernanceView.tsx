import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import { founderApprovalService, type FounderApprovalRequestDto } from '../../services/founder-approval-service.js';

interface Props {
  currentRoleCode?: string | undefined;
  currentUserEmail?: string | undefined;
}

export const FounderApprovalGovernanceView: React.FC<Props> = ({
  currentRoleCode = 'SUPER_ADMIN',
  currentUserEmail = 'founder@docsearch.health'
}) => {
  const [approvals, setApprovals] = useState<FounderApprovalRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const normEmail = (currentUserEmail || '').toLowerCase();
  const isFounder =
    currentRoleCode === 'SUPER_ADMIN_FOUNDER' ||
    currentRoleCode === 'SUPER_ADMIN' ||
    currentRoleCode === 'FOUNDER' ||
    normEmail === 'founder@docsearch.health' ||
    normEmail === 'meraj@docsearch.health';

  const loadData = async () => {
    setLoading(true);
    const data = await founderApprovalService.getApprovals();
    setApprovals(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    if (!isFounder) {
      alert('Access Denied: Only Founder MERAJ SHARIF has the authority to approve form submissions and complete tasks.');
      return;
    }
    await founderApprovalService.approveRequest(id, 'Approved by Founder MERAJ SHARIF. Task Completed.');
    setActionMessage('✓ Approved by Founder MERAJ SHARIF! Task is now officially COMPLETED and active in database.');
    await loadData();
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleReject = async (id: string) => {
    if (!isFounder) {
      alert('Access Denied: Only Founder MERAJ SHARIF has the authority to reject form submissions.');
      return;
    }
    const remarks = window.prompt('Enter rejection remarks / reason:');
    if (!remarks) return;
    await founderApprovalService.rejectRequest(id, remarks);
    setActionMessage('❌ Request rejected by Founder. Task has been marked REJECTED.');
    await loadData();
    setTimeout(() => setActionMessage(null), 5000);
  };

  const pendingCount = approvals.filter((a) => a.approvalStatus === 'PENDING_FOUNDER_APPROVAL').length;
  const approvedCount = approvals.filter((a) => a.approvalStatus === 'APPROVED_BY_FOUNDER').length;
  const rejectedCount = approvals.filter((a) => a.approvalStatus === 'REJECTED_BY_FOUNDER').length;

  const filtered = approvals.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.approvalStatus === filterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Governance Rule Authority Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          borderRadius: '12px',
          padding: '24px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>👑</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#FCD34D' }}>
                Founder Master Approval Governance Center
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#E0E7FF' }}>
                Authoritative Rule: Any form update must be approved by Founder (MERAJ SHARIF). Other roles can only fill forms; the task completes ONLY upon Founder approval.
              </p>
            </div>
          </div>
          <Badge variant={isFounder ? 'success' : 'warning'}>
            {isFounder ? '👑 Active As: Founder (MERAJ SHARIF)' : `👤 Active As: ${currentRoleCode} (Submitter Only)`}
          </Badge>
        </div>

        {/* Real-time Counts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#C7D2FE', textTransform: 'uppercase' }}>Total Submissions</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>{approvals.length}</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#FDE68A', textTransform: 'uppercase' }}>⏳ Pending Founder Sign-off</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#FBBF24' }}>{pendingCount}</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#A7F3D0', textTransform: 'uppercase' }}>✅ Approved & Completed</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399' }}>{approvedCount}</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#FECACA', textTransform: 'uppercase' }}>❌ Rejected Submissions</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#F87171' }}>{rejectedCount}</div>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            background: actionMessage.includes('Approved') || actionMessage.includes('✓') ? '#ECFDF5' : '#EFF6FF',
            border: `1px solid ${actionMessage.includes('Approved') || actionMessage.includes('✓') ? '#10B981' : '#3B82F6'}`,
            color: actionMessage.includes('Approved') || actionMessage.includes('✓') ? '#065F46' : '#1E40AF',
            padding: '12px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          {actionMessage}
        </div>
      )}



      {/* 3. Founder Approval Queue Table */}
      <Card
        title="📋 Founder Master Approval Queue"
        subtitle={loading ? 'Refreshing live approval database records...' : 'Review and sign-off on form submissions from Sales, Operations, Finance, and Support'}
        padding="none"
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '8px' }}>
          <Button
            variant={filterStatus === 'ALL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('ALL')}
          >
            All Requests ({approvals.length})
          </Button>
          <Button
            variant={filterStatus === 'PENDING_FOUNDER_APPROVAL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('PENDING_FOUNDER_APPROVAL')}
          >
            ⏳ Pending Sign-off ({pendingCount})
          </Button>
          <Button
            variant={filterStatus === 'APPROVED_BY_FOUNDER' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('APPROVED_BY_FOUNDER')}
          >
            ✅ Completed / Approved ({approvedCount})
          </Button>
          <Button
            variant={filterStatus === 'REJECTED_BY_FOUNDER' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('REJECTED_BY_FOUNDER')}
          >
            ❌ Rejected ({rejectedCount})
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
            No approval requests found for this filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}>
                  <th style={{ padding: '12px 16px' }}>Request ID</th>
                  <th style={{ padding: '12px 16px' }}>Task & Form Type</th>
                  <th style={{ padding: '12px 16px' }}>Submitter Profile</th>
                  <th style={{ padding: '12px 16px' }}>Submitted Data Payload</th>
                  <th style={{ padding: '12px 16px' }}>Approval & Task State</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Founder Sign-off Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isPending = r.approvalStatus === 'PENDING_FOUNDER_APPROVAL';
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1F2937' }}>
                        {r.requestNumber}
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          {new Date(r.createdAt).toLocaleTimeString()}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{r.taskTitle}</div>
                        <Badge variant="neutral">{r.entityType}</Badge>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1F2937' }}>{r.submitterName}</div>
                        <div style={{ fontSize: '12px', color: '#4F46E5' }}>{r.submitterRole}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>{r.submitterEmail}</div>
                      </td>

                      <td style={{ padding: '12px 16px', minWidth: '320px', maxWidth: '420px' }}>
                        {r.entityType === 'PARTNER_PROFILE_AMENDMENT' && r.payloadData ? (() => {
                          const pData = (r.payloadData || {}) as any;
                          return (
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #CBD5E1', paddingBottom: '4px' }}>
                                <span style={{ color: '#64748B' }}>Facility Name:</span>
                                <span>
                                  <span style={{ color: '#94A3B8', textDecoration: 'line-through' }}>{String(pData['currentFacilityName'] || '')}</span>
                                  {' ➔ '}
                                  <strong style={{ color: '#059669' }}>{String(pData['proposedFacilityName'] || '')}</strong>
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #CBD5E1', paddingBottom: '4px' }}>
                                <span style={{ color: '#64748B' }}>Owner / Doctor:</span>
                                <span>
                                  <span style={{ color: '#94A3B8', textDecoration: 'line-through' }}>{String(pData['currentOwnerName'] || '')}</span>
                                  {' ➔ '}
                                  <strong style={{ color: '#059669' }}>{String(pData['proposedOwnerName'] || '')}</strong>
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748B' }}>Proposed Aadhaar:</span>
                                <strong style={{ color: '#2563EB' }}>
                                  XXXX XXXX {String(pData['proposedAadhaarNumber'] || '').slice(-4)}
                                </strong>
                              </div>
                              {Boolean(pData['proposedDocFileName']) && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EFF6FF', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                                  <span style={{ color: '#1E40AF' }}>📄 {String(pData['proposedDocFileName'])}</span>
                                  {Boolean(pData['proposedDocDataUrl']) && (
                                    <a
                                      href={String(pData['proposedDocDataUrl'])}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'underline' }}
                                    >
                                      View Proof
                                    </a>
                                  )}
                                </div>
                              )}
                              {Boolean(pData['reasonForChange']) && (
                                <div style={{ color: '#475569', fontSize: '11px', fontStyle: 'italic', background: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>
                                  Reason: "{String(pData['reasonForChange'])}"
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          <div
                            style={{
                              background: '#F3F4F6',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={JSON.stringify(r.payloadData, null, 2)}
                          >
                            {JSON.stringify(r.payloadData)}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={isPending ? 'warning' : r.approvalStatus === 'APPROVED_BY_FOUNDER' ? 'success' : 'danger'}>
                          {isPending ? '⏳ PENDING FOUNDER SIGN-OFF' : r.approvalStatus}
                        </Badge>
                        <div style={{ fontSize: '11px', marginTop: '4px', color: isPending ? '#D97706' : '#059669', fontWeight: 600 }}>
                          Task: {r.taskStatus}
                        </div>
                        {r.founderRemarks && (
                          <div style={{ fontSize: '11px', color: '#4B5563', fontStyle: 'italic', marginTop: '2px' }}>
                            Remarks: "{r.founderRemarks}"
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {isPending ? (
                          isFounder ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <Button variant="primary" size="sm" onClick={() => handleApprove(r.id)}>
                                ✅ Approve & Complete
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleReject(r.id)}>
                                ❌ Reject
                              </Button>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: '12px',
                                color: '#9CA3AF',
                                background: '#F3F4F6',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              🔒 Founder Sign-off Required
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                            ✓ Closed by Founder
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
