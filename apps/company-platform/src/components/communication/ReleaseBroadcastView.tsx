import React from 'react';
import type { ContentItemDto } from '@docsearch/api-contracts';
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

export interface ReleaseBroadcastViewProps {
  items: ContentItemDto[];
  onSelectItem: (itemId: string) => void;
}

export const ReleaseBroadcastView: React.FC<ReleaseBroadcastViewProps> = ({
  items,
  onSelectItem
}) => {
  const releaseItems = items.filter((i) => i.type === 'RELEASE_BROADCAST');

  return (
    <Card
      title="Product Release Broadcasts & Feature Changelogs"
      subtitle="Versioned changelogs, API gateway enhancements, and enterprise feature deployments"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version Tag</TableHead>
              <TableHead>Release Title</TableHead>
              <TableHead>Target SaaS Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Release Date</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {releaseItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No release broadcasts registered.
                </TableCell>
              </TableRow>
            ) : (
              releaseItems.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant="primary">{r.versionTag ?? 'v1.0.0'}</Badge>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block', maxWidth: '300px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {r.summary}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>{r.targetAudience}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : 'Draft'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                    {r.authorEmail}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onSelectItem(r.id)}>
                      View Changelog
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
