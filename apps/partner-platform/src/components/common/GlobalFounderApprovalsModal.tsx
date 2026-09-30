import React, { useState } from 'react';
import { useFounderApproval } from '../../hooks/useFounderApproval.js';
import type { FounderApprovalRequestDto } from '../../services/founder-approval-service.js';

export interface GlobalFounderApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: string | undefined;
  currentUserName?: string | undefined;
  currentUserEmail?: string | undefined;
}

export const GlobalFounderApprovalsModal: React.FC<GlobalFounderApprovalsModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  currentUserName: _currentUserName,
  currentUserEmail
}) => {
  const {
    isFounder,
    requests,
    loading,
    pendingCount,
    approveRequest,
    rejectRequest
  } = useFounderApproval(currentUserRole, currentUserEmail);

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  if (!isOpen) return null;

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'PENDING') return r.approvalStatus === 'PENDING_FOUNDER_APPROVAL';
    if (activeTab === 'APPROVED') return r.approvalStatus === 'APPROVED_BY_FOUNDER';
    if (activeTab === 'REJECTED') return r.approvalStatus === 'REJECTED_BY_FOUNDER';
    return true;
  });

  const handleApprove = async (req: FounderApprovalRequestDto) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await approveRequest(req.id, `Verified and approved by Healthcare Compliance Directorate`);
      setActionSuccess(res.message);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await rejectRequest(id, rejectRemarks || 'Rejected by Healthcare Compliance Directorate');
      setActionSuccess(res.message);
      setRejectingId(null);
      setRejectRemarks('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          backgroundColor: '#0F172A',
          border: '1.5px solid #06B6D4',
          borderRadius: '18px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 35px rgba(6, 182, 212, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0B132B',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>👑</span>
              <h2 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 900 }}>
                Universal Founder Approvals Hub • Executive Governance
              </h2>
              {pendingCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFF',
                    fontSize: '0.6875rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  {pendingCount} PENDING
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '0.75rem' }}>
              System Rule: Any form update requires Healthcare Compliance Directorate approval. Tasks complete ONLY upon Compliance sign-off.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Status Messages */}
        {actionSuccess && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', borderBottom: '1px solid #10B981', color: '#6EE7B7', padding: '10px 24px', fontSize: '0.8125rem', fontWeight: 700 }}>
            ✓ {actionSuccess}
          </div>
        )}
        {actionError && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderBottom: '1px solid #EF4444', color: '#FCA5A5', padding: '10px 24px', fontSize: '0.8125rem', fontWeight: 700 }}>
            ✕ {actionError}
          </div>
        )}

        {/* Tabs Bar */}
        <div
          style={{
            backgroundColor: '#0F172A',
            padding: '10px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '8px'
          }}
        >
          {[
            { id: 'PENDING', label: `Pending Founder Review (${pendingCount})` },
            { id: 'APPROVED', label: 'Approved & Completed' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'ALL', label: `All Requests (${requests.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                backgroundColor: activeTab === tab.id ? '#06B6D4' : 'rgba(30, 41, 59, 0.7)',
                color: activeTab === tab.id ? '#070C16' : '#94A3B8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading && <div style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>Loading governance requests...</div>}

          {!loading && filteredRequests.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📋</div>
              <strong>No requests in this view</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem' }}>
                All form updates requiring review appear here for Compliance Directorate sign-off.
              </p>
            </div>
          )}

          {filteredRequests.map((req) => {
            const isPending = req.approvalStatus === 'PENDING_FOUNDER_APPROVAL';
            return (
              <div
                key={req.id}
                style={{
                  backgroundColor: '#0B132B',
                  border: isPending ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>
                        {req.requestNumber}
                      </span>
                      <span
                        style={{
                          backgroundColor: 'rgba(6, 182, 212, 0.15)',
                          color: '#38BDF8',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: 700
                        }}
                      >
                        {req.entityType}
                      </span>
                      <span
                        style={{
                          backgroundColor: isPending
                            ? 'rgba(245, 158, 11, 0.15)'
                            : req.approvalStatus === 'APPROVED_BY_FOUNDER'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          color: isPending
                            ? '#FBBF24'
                            : req.approvalStatus === 'APPROVED_BY_FOUNDER'
                            ? '#34D399'
                            : '#FCA5A5',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: 800
                        }}
                      >
                        ● {req.approvalStatus}
                      </span>
                    </div>
                    <h4 style={{ margin: '6px 0 2px 0', color: '#F8FAFC', fontSize: '0.9375rem', fontWeight: 800 }}>
                      {req.taskTitle}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Submitted by: <strong style={{ color: '#E2E8F0' }}>{req.submitterName}</strong> (Role: <code style={{ color: '#38BDF8' }}>{req.submitterRole}</code>) • {req.submitterEmail} • {new Date(req.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        color: req.taskStatus === 'COMPLETED' ? '#10B981' : '#F59E0B'
                      }}
                    >
                      TASK STATUS: {req.taskStatus}
                    </div>
                  </div>
                </div>

                {/* Payload Preview */}
                <div
                  style={{
                    backgroundColor: '#070C16',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.75rem',
                    color: '#CBD5E1',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    fontFamily: 'monospace'
                  }}
                >
                  <pre style={{ margin: 0 }}>{JSON.stringify(req.payloadData, null, 2)}</pre>
                </div>

                {/* Remarks if approved/rejected */}
                {req.founderRemarks && (
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', borderLeft: '2px solid #06B6D4', paddingLeft: '8px' }}>
                    Founder Remarks: <em style={{ color: '#F8FAFC' }}>{req.founderRemarks}</em> ({req.approvedByEmail})
                  </div>
                )}

                {/* Action Row */}
                {isPending && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    {isFounder ? (
                      <>
                        {rejectingId === req.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                            <input
                              type="text"
                              placeholder="Enter rejection reason..."
                              value={rejectRemarks}
                              onChange={(e) => setRejectRemarks(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#1E293B',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#FFF',
                                fontSize: '0.75rem'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleReject(req.id)}
                              style={{
                                backgroundColor: '#EF4444',
                                color: '#FFF',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Confirm Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingId(null)}
                              style={{
                                backgroundColor: 'transparent',
                                color: '#94A3B8',
                                border: 'none',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setRejectingId(req.id)}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid #EF4444',
                                color: '#FCA5A5',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              ✕ Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(req)}
                              style={{
                                backgroundColor: '#10B981',
                                border: 'none',
                                color: '#064E3B',
                                padding: '6px 16px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                              }}
                            >
                              ✓ Approve & Complete Task ➔
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 700 }}>
                        🔒 Awaiting Healthcare Compliance Sign-off (Non-administrative roles cannot self-approve)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
