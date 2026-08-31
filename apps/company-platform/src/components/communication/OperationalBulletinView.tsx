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

export interface OperationalBulletinViewProps {
  items: ContentItemDto[];
  onSelectItem: (itemId: string) => void;
}

export const OperationalBulletinView: React.FC<OperationalBulletinViewProps> = ({
  items,
  onSelectItem
}) => {
  const bulletinItems = items.filter(
    (i) => i.type === 'OPERATIONAL_BULLETIN' || i.type === 'POLICY_UPDATE'
  );

  return (
    <Card
      title="Operational Bulletins & Security Advisories"
      subtitle="Critical infrastructure maintenance schedules, security patches, and platform policy amendments"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Advisory Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Target Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Publication Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bulletinItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No operational bulletins published.
                </TableCell>
              </TableRow>
            ) : (
              bulletinItems.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {b.pinned && <span>📌</span>}
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{b.title}</strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block', maxWidth: '320px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {b.summary}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.type === 'OPERATIONAL_BULLETIN' ? 'warning' : 'neutral'}>
                      {b.type}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>{b.targetAudience}</TableCell>
                  <TableCell>
                    <Badge variant={b.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : 'Draft'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onSelectItem(b.id)}>
                      Inspect Bulletin
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
