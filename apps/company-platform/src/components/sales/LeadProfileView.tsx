import React, { useState } from 'react';
import type { LeadDto, LeadStatus } from '@docsearch/api-contracts';
import { Card, Button, Badge, FormField, Select } from '@docsearch/ui-kit';

export interface LeadProfileViewProps {
  lead: LeadDto;
  onBack: () => void;
  onTransitionLead: (toStatus: LeadStatus, reason: string) => Promise<void>;
}

const allLeadStatuses: LeadStatus[] = [
  'NEW',
  'QUALIFIED',
  'CONTACTED',
  'DISCOVERY',
  'CONVERTED',
  'DISQUALIFIED'
];

export const LeadProfileView: React.FC<LeadProfileViewProps> = ({
  lead,
  onBack,
  onTransitionLead
}) => {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(lead.status);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateStatus = async () => {
    if (!reason.trim()) {
      alert('Please provide a brief reason for changing the lead status.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onTransitionLead(selectedStatus, reason.trim());
      setReason('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Leads Directory
          </Button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {lead.organizationName}
            </h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Lead Source: {lead.source} | Assigned Owner: {lead.assignedOwnerEmail}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge
            variant={
              lead.status === 'CONVERTED'
                ? 'success'
                : lead.status === 'DISQUALIFIED'
                ? 'danger'
                : 'primary'
            }
          >
            Status: {lead.status}
          </Badge>
        </div>
      </div>

      {/* Two Column Grid: Contact & Organization Details, Status Transition */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Contact Information */}
        <Card title="Organization & Contact Details" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Key Contact:</span>
              <strong>{lead.contactName}</strong>
            </div>
            {lead.contactRoleTitle && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Role / Title:</span>
                <span>{lead.contactRoleTitle}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Email:</span>
              <a href={`mailto:${lead.contactEmail}`} style={{ color: 'var(--ds-color-primary)', textDecoration: 'none' }}>
                {lead.contactEmail}
              </a>
            </div>
            {lead.contactPhone && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Phone:</span>
                <span>{lead.contactPhone}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Discovery Follow-up:</span>
              <span>{lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : 'None Scheduled'}</span>
            </div>
          </div>
        </Card>

        {/* Lifecycle Status Controller */}
        <Card title="Lead Lifecycle State Controller" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <FormField label="Update Lead Status">
              <Select
                options={allLeadStatuses.map((s) => ({ label: s, value: s }))}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
              />
            </FormField>

            <FormField label="Change Reason / Activity Note" required>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Conducted discovery call; customer requested proposal."
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

            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateStatus}
              isLoading={isSubmitting}
              disabled={selectedStatus === lead.status}
            >
              Update Lead Status
            </Button>
          </div>
        </Card>
      </div>

      {/* Lead Discovery Notes */}
      {lead.notes && (
        <Card title="Discovery & Background Notes" padding="md">
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-primary)', lineHeight: '1.5' }}>
            {lead.notes}
          </p>
        </Card>
      )}
    </div>
  );
};
