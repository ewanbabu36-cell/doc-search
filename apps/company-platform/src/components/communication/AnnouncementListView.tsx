import React, { useState } from 'react';
import type {
  ContentItemDto,
  ContentStatus,
  TargetAudience
} from '@docsearch/api-contracts';
import {
  Card,
  Input,
  Select,
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

export interface AnnouncementListViewProps {
  items: ContentItemDto[];
  onSelectItem: (itemId: string) => void;
}

export const AnnouncementListView: React.FC<AnnouncementListViewProps> = ({
  items,
  onSelectItem
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'ALL'>('ALL');
  const [audienceFilter, setAudienceFilter] = useState<TargetAudience | 'ALL'>('ALL');

  const filtered = items.filter((i) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!i.title.toLowerCase().includes(q) && !i.summary.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    if (audienceFilter !== 'ALL' && i.targetAudience !== audienceFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Content
            </label>
            <Input
              placeholder="Search announcements and bulletins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Publication Status
            </label>
            <Select
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Published', value: 'PUBLISHED' },
                { label: 'Scheduled', value: 'SCHEDULED' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Archived', value: 'ARCHIVED' },
                { label: 'Retracted', value: 'RETRACTED' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContentStatus | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Target Audience
            </label>
            <Select
              options={[
                { label: 'All Audiences', value: 'ALL' },
                { label: 'All Partners', value: 'ALL_PARTNERS' },
                { label: 'Enterprise Tier Only', value: 'ENTERPRISE_TIER_ONLY' },
                { label: 'Clinic Tier Only', value: 'CLINIC_TIER_ONLY' },
                { label: 'System Admins Only', value: 'SYSTEM_ADMINS_ONLY' }
              ]}
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value as TargetAudience | 'ALL')}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title & Headline</TableHead>
                <TableHead>Category Type</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Published / Scheduled</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No announcements or content items found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {i.pinned && <span>📌</span>}
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{i.title}</strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block', maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {i.summary}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{i.type}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{i.targetAudience}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          i.status === 'PUBLISHED'
                            ? 'success'
                            : i.status === 'SCHEDULED'
                            ? 'primary'
                            : 'neutral'
                        }
                      >
                        {i.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {i.authorEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {i.publishedAt
                        ? new Date(i.publishedAt).toLocaleDateString()
                        : i.scheduledFor
                        ? `Sched: ${new Date(i.scheduledFor).toLocaleDateString()}`
                        : 'Unpublished'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectItem(i.id)}>
                        Read & Manage
                      </Button>
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
