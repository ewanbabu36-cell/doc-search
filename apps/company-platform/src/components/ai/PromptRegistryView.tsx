import React, { useState } from 'react';
import type { AIPromptTemplateDto, AIPromptType } from '@docsearch/api-contracts';
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

export interface PromptRegistryViewProps {
  templates: AIPromptTemplateDto[];
  onSelectTemplate: (templateId: string) => void;
}

export const PromptRegistryView: React.FC<PromptRegistryViewProps> = ({
  templates,
  onSelectTemplate
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AIPromptType | 'ALL'>('ALL');

  const filtered = templates.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !t.code.toLowerCase().includes(q) &&
        !t.name.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (typeFilter !== 'ALL' && t.promptType !== typeFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Prompt Templates
            </label>
            <Input
              placeholder="Search by template code, name, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Prompt Type
            </label>
            <Select
              options={[
                { label: 'All Prompt Types', value: 'ALL' },
                { label: 'Task', value: 'TASK' },
                { label: 'System', value: 'SYSTEM' },
                { label: 'Developer', value: 'DEVELOPER' },
                { label: 'Safety Gate', value: 'SAFETY' },
                { label: 'Evaluation', value: 'EVALUATION' }
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as AIPromptType | 'ALL')}
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
                <TableHead>Template Code & Name</TableHead>
                <TableHead>Prompt Type</TableHead>
                <TableHead>Current Version</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead>Governance Policy</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No prompt templates match the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                          {t.code}
                        </span>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{t.name}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{t.promptType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">v{t.currentVersion}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? 'success' : 'neutral'}>
                        {t.approvalStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {t.governancePolicyCode ?? 'Standard Boundary'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {t.ownerEmail}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectTemplate(t.id)}>
                        Versions & Review
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
