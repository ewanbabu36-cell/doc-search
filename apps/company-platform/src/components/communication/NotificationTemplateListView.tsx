import React from 'react';
import type { NotificationTemplateDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface NotificationTemplateListViewProps {
  templates: NotificationTemplateDto[];
}

export const NotificationTemplateListView: React.FC<NotificationTemplateListViewProps> = ({
  templates
}) => {
  return (
    <Card
      title="Notification Templates Catalog"
      subtitle="Standardized message templates for in-app banners, email dispatches, and webhook payloads"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Code</TableHead>
              <TableHead>Template Name</TableHead>
              <TableHead>Dispatch Channel</TableHead>
              <TableHead>Subject Blueprint</TableHead>
              <TableHead>Configured Variables</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No notification templates configured.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {t.code}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{t.name}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{t.channel}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', maxWidth: '260px' }}>
                    {t.subjectTemplate}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                    {t.variables.join(', ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {t.status}
                    </Badge>
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
