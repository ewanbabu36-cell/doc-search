import React from 'react';
import type { CampaignDto, MarketingActivityDto } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface CampaignProfileViewProps {
  campaign: CampaignDto;
  activities: MarketingActivityDto[];
  onBack: () => void;
}

export const CampaignProfileView: React.FC<CampaignProfileViewProps> = ({
  campaign,
  activities,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Campaigns Directory
          </Button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {campaign.name}
            </h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Campaign Type: {campaign.type} | Owner: {campaign.ownerEmail}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={campaign.status === 'ACTIVE' ? 'success' : 'neutral'}>
            Status: {campaign.status}
          </Badge>
        </div>
      </div>

      {/* Campaign Details */}
      <Card title="Campaign Overview & Targeting Strategy" padding="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', marginBottom: '2px' }}>Target Segment:</span>
            <strong style={{ color: 'var(--ds-color-text-primary)' }}>{campaign.targetSegment}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', marginBottom: '2px' }}>Strategic Scope:</span>
            <p style={{ margin: 0, color: 'var(--ds-color-text-primary)' }}>{campaign.description}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--ds-color-border-subtle)' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Start Horizon:</span>
              <div>{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>End Horizon:</span>
              <div>{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Linked Activities */}
      <Card
        title="Associated Marketing & Outreach Activities"
        subtitle="Chronological log of executive briefings, demonstrations, and partner discovery interactions"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No outreach activities logged for this campaign yet.
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell style={{ fontWeight: '600' }}>{a.title}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">{a.activityType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{a.description}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {a.recordedByEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(a.activityDate).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
