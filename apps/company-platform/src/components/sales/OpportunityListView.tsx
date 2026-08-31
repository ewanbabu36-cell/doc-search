import React, { useState } from 'react';
import type { OpportunityDto, OpportunityStage } from '@docsearch/api-contracts';
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

export interface OpportunityListViewProps {
  opportunities: OpportunityDto[];
  onSelectOpportunity: (opportunityId: string) => void;
}

export const OpportunityListView: React.FC<OpportunityListViewProps> = ({
  opportunities,
  onSelectOpportunity
}) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<OpportunityStage | 'ALL'>('ALL');

  const filtered = opportunities.filter((o) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !o.name.toLowerCase().includes(q) &&
        !(o.partnerTradeName && o.partnerTradeName.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    if (stageFilter !== 'ALL' && o.stage !== stageFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Opportunities
            </label>
            <Input
              placeholder="Search opportunity name or partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Sales Stage
            </label>
            <Select
              options={[
                { label: 'All Stages', value: 'ALL' },
                { label: 'Qualification', value: 'QUALIFICATION' },
                { label: 'Discovery', value: 'DISCOVERY' },
                { label: 'Proposal', value: 'PROPOSAL' },
                { label: 'Negotiation', value: 'NEGOTIATION' },
                { label: 'Won', value: 'WON' },
                { label: 'Lost', value: 'LOST' }
              ]}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as OpportunityStage | 'ALL')}
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
                <TableHead>Opportunity Name</TableHead>
                <TableHead>Associated Account / Lead</TableHead>
                <TableHead>Target Plan Tier</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Sales Stage</TableHead>
                <TableHead>Expected Close</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No opportunities match the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{o.name}</strong>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {o.partnerTradeName ?? 'Enterprise Prospect'}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-primary)', fontSize: '0.8125rem' }}>
                        {o.targetPlanName ?? 'Enterprise Tier'}
                      </strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.priority === 'CRITICAL' || o.priority === 'HIGH' ? 'danger' : 'neutral'}>
                        {o.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.stage === 'WON'
                            ? 'success'
                            : o.stage === 'LOST'
                            ? 'danger'
                            : 'primary'
                        }
                      >
                        {o.stage}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {o.expectedCloseDate ? new Date(o.expectedCloseDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectOpportunity(o.id)}>
                        View Details
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
