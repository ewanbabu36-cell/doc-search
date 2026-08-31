import React, { useState } from 'react';
import type { LeadDto, LeadStatus } from '@docsearch/api-contracts';
import { CreateLeadModal } from './CreateLeadModal.js';
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

export interface LeadListViewProps {
  leads: LeadDto[];
  onSelectLead: (leadId: string) => void;
}

export const LeadListView: React.FC<LeadListViewProps> = ({
  leads,
  onSelectLead
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [localLeads, setLocalLeads] = useState<LeadDto[]>(leads);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = (localLeads.length > 0 ? localLeads : leads).filter((l) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !l.organizationName.toLowerCase().includes(q) &&
        !l.contactName.toLowerCase().includes(q) &&
        !l.contactEmail.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>Sales Pipeline & Prospects</h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{filtered.length} active leads tracked across all sales territories</span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
          ➕ Add New Doctor / Clinic Lead
        </Button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700 }}>
          ✓ {successMsg}
        </div>
      )}

      <CreateLeadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newLead) => {
          setLocalLeads((prev) => [newLead, ...(prev.length > 0 ? prev : leads)]);
          setSuccessMsg(`Lead "${newLead.organizationName}" created successfully!`);
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
      />

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Leads & Prospects
            </label>
            <Input
              placeholder="Search by hospital, contact, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Status
            </label>
            <Select
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'New', value: 'NEW' },
                { label: 'Qualified', value: 'QUALIFIED' },
                { label: 'Contacted', value: 'CONTACTED' },
                { label: 'Discovery', value: 'DISCOVERY' },
                { label: 'Converted', value: 'CONVERTED' },
                { label: 'Disqualified', value: 'DISQUALIFIED' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'ALL')}
            />
          </div>
        </div>
      </Card>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization / Facility</TableHead>
                <TableHead>Key Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Estimated Value</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No leads found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{l.organizationName}</strong>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{l.contactName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{l.contactEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{l.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.status === 'NEW' ? 'primary' : l.status === 'CONVERTED' ? 'success' : 'neutral'}>
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
                        Active Lead
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectLead(l.id)}>
                        View Profile
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
