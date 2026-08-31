import React, { useState } from 'react';
import type {
  SupportTicketDto,
  TicketCommentDto,
  TicketStatus
} from '@docsearch/api-contracts';
import { Card, Button, Badge, FormField } from '@docsearch/ui-kit';
import { TicketTransitionDialog } from './TicketTransitionDialog.js';

export interface TicketProfileViewProps {
  ticket: SupportTicketDto;
  comments: TicketCommentDto[];
  onBack: () => void;
  onTransitionTicket: (toStatus: TicketStatus, reason: string, resolutionNotes?: string) => Promise<void>;
  onAddComment: (content: string, isInternalOnly: boolean) => Promise<void>;
}

export const TicketProfileView: React.FC<TicketProfileViewProps> = ({
  ticket,
  comments,
  onBack,
  onTransitionTicket,
  onAddComment
}) => {
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternalOnly, setIsInternalOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim(), isInternalOnly);
      setNewComment('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Tickets Directory
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.875rem', fontWeight: '700' }}>
                {ticket.ticketNumber}
              </span>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {ticket.title}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Partner: {ticket.partnerTradeName} | Category: {ticket.category}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={ticket.priority === 'CRITICAL_SLA' || ticket.priority === 'HIGH' ? 'danger' : 'neutral'}>
            Priority: {ticket.priority}
          </Badge>
          <Badge
            variant={
              ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                ? 'success'
                : ticket.status === 'IN_PROGRESS'
                ? 'primary'
                : 'neutral'
            }
          >
            Status: {ticket.status}
          </Badge>
          <Badge variant={ticket.slaStatus === 'WITHIN_SLA' ? 'success' : 'danger'}>
            SLA: {ticket.slaStatus}
          </Badge>
          <Button variant="primary" size="sm" onClick={() => setIsTransitionOpen(true)}>
            Update Status
          </Button>
        </div>
      </div>

      {/* Two Column Grid: Ticket Metadata & Description */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Ticket Metadata */}
        <Card title="Case Information & SLA Targets" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Healthcare Partner:</span>
              <strong>{ticket.partnerTradeName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Submitted By:</span>
              <span>{ticket.submittedByName} ({ticket.submittedByEmail})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Assigned Agent:</span>
              <span style={{ color: 'var(--ds-color-primary)', fontWeight: '500' }}>{ticket.assignedAgentEmail}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Created At:</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            {ticket.slaResolutionDue && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Resolution Target:</span>
                <span>{new Date(ticket.slaResolutionDue).toLocaleString()}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Case Narrative */}
        <Card title="Incident Details & Context" padding="md">
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--ds-color-text-primary)' }}>
            {ticket.description}
          </p>
          {ticket.resolutionNotes && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--ds-color-border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--ds-color-success)', display: 'block', marginBottom: '4px' }}>
                RESOLUTION SUMMARY:
              </span>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>
                {ticket.resolutionNotes}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Investigation Timeline & Comments */}
      <Card title="Investigation Log & Partner Communications" subtitle="Chronological case timeline and internal notes" padding="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Comments List */}
          {comments.length === 0 ? (
            <div style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '16px' }}>
              No comments logged yet.
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: c.isInternalOnly ? 'var(--ds-color-surface-subtle)' : 'var(--ds-color-surface)',
                  border: c.isInternalOnly ? '1px dashed var(--ds-color-warning)' : '1px solid var(--ds-color-border)',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{c.authorName}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      ({c.authorEmail})
                    </span>
                    {c.isInternalOnly && <Badge variant="warning">Internal Note</Badge>}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--ds-color-text-primary)', lineHeight: '1.5' }}>
                  {c.content}
                </p>
              </div>
            ))
          )}

          {/* Add Comment Form */}
          <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--ds-color-border-subtle)' }}>
            <FormField label="Add Investigation Log / Response">
              <textarea
                required
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your response or technical investigation notes here..."
                className="ds-interactive"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  color: 'var(--ds-color-text-primary)',
                  backgroundColor: 'var(--ds-color-surface)',
                  border: '1px solid var(--ds-color-border)',
                  borderRadius: '6px',
                  resize: 'vertical'
                }}
              />
            </FormField>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isInternalOnly}
                  onChange={(e) => setIsInternalOnly(e.target.checked)}
                />
                Mark as Internal Team Note (Hidden from Partner)
              </label>

              <Button variant="primary" size="sm" onClick={handlePostComment} isLoading={isSubmitting}>
                Post Note
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* State Transition Dialog */}
      {isTransitionOpen && (
        <TicketTransitionDialog
          isOpen={isTransitionOpen}
          onClose={() => setIsTransitionOpen(false)}
          ticket={ticket}
          onTransition={onTransitionTicket}
        />
      )}
    </div>
  );
};
