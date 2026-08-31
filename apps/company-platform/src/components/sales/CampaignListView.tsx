import React, { useState } from 'react';
import type { CampaignDto, CampaignStatus } from '@docsearch/api-contracts';
import { LaunchCampaignModal } from './LaunchCampaignModal.js';
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

export interface CampaignListViewProps {
  campaigns: CampaignDto[];
  onSelectCampaign: (campaignId: string) => void;
}

export const CampaignListView: React.FC<CampaignListViewProps> = ({
  campaigns,
  onSelectCampaign
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');
  const [localCampaigns, setLocalCampaigns] = useState<CampaignDto[]>(campaigns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<CampaignDto | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = (localCampaigns.length > 0 ? localCampaigns : campaigns).filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.targetSegment.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>Healthcare Marketing & Outreach Campaigns</h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{filtered.length} active growth and doctor acquisition campaigns</span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingCamp(null);
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}
        >
          🚀 Launch New Marketing Campaign
        </Button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700 }}>
          ✓ {successMsg}
        </div>
      )}

      <LaunchCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCampaign={editingCamp}
        onSuccess={(saved) => {
          setLocalCampaigns((prev) => {
            const list = prev.length > 0 ? prev : campaigns;
            const exists = list.some((c) => c.id === saved.id);
            return exists ? list.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...list];
          });
          setSuccessMsg(`Campaign "${saved.name}" launched successfully!`);
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
      />

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>Search Campaigns</label>
            <Input placeholder="Search campaign name or segment..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>Campaign Status</label>
            <Select
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Scheduled', value: 'SCHEDULED' },
                { label: 'Paused', value: 'PAUSED' },
                { label: 'Completed', value: 'COMPLETED' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'ALL')}
            />
          </div>
        </div>
      </Card>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target Healthcare Segment</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Horizon</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No campaigns match the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.name}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{c.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem' }}>{c.targetSegment}</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{c.ownerEmail}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                        {c.startDate ? new Date(c.startDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCamp(c);
                            setIsModalOpen(true);
                          }}
                          style={{ borderColor: '#06B6D4', color: '#06B6D4', fontWeight: 700 }}
                        >
                          ✏️ Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onSelectCampaign(c.id)}>
                          View Details
                        </Button>
                      </div>
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
