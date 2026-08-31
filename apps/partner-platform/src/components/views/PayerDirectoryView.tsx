import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsurancePayerDto
} from '@docsearch/api-contracts';

export interface PayerDirectoryViewProps {
  payers: InsurancePayerDto[];
  onOpenCreatePayer: () => void;
  onSelectPayer?: (payerId: string) => void;
}

export const PayerDirectoryView: React.FC<PayerDirectoryViewProps> = ({
  payers,
  onOpenCreatePayer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filtered = payers.filter((p) => {
    const matchesSearch =
      p.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tpaName && p.tpaName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || p.payerType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Insurance Companies & TPA Directory
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Accredited commercial insurers, TPAs, government healthcare schemes, and electronic clearinghouse identifiers.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreatePayer}>
          + Onboard New Payer / TPA
        </Button>
      </div>

      {/* Filter Bar */}
      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Search by Payer Name, Code, or TPA
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. BlueShield, PAYER-APEXTPA"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Payer Classification
            </label>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Payer Classifications' },
                { value: 'COMMERCIAL_INSURANCE', label: 'Commercial Private Insurance' },
                { value: 'TPA', label: 'Third-Party Administrator (TPA)' },
                { value: 'GOVERNMENT_HEALTHCARE', label: 'Government / Public Healthcare' },
                { value: 'CORPORATE_DIRECT', label: 'Corporate Direct Contract' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Payers Directory Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((payer) => (
          <Card key={payer.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', letterSpacing: '0.05em' }}>
                  {payer.payerCode}
                </span>
                <Badge variant={payer.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {payer.status}
                </Badge>
              </div>

              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                {payer.payerName}
              </h3>

              {payer.tpaName && (
                <div style={{ fontSize: '0.8rem', color: '#7c3aed', marginBottom: '0.5rem', fontWeight: 500 }}>
                  🏢 TPA Network: {payer.tpaName}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: '#475569', margin: '0.75rem 0' }}>
                <div>
                  <strong>Mode:</strong> {payer.claimSubmissionMode}
                </div>
                <div>
                  <strong>Electronic EDI ID:</strong> {payer.electronicPayerId || 'N/A'}
                </div>
                <div>
                  <strong>Settlement SLA:</strong> {payer.settlementPeriodDays} days
                </div>
                {payer.contactEmail && (
                  <div>
                    <strong>Contact:</strong> {payer.contactEmail}
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
              <div>
                <span>{payer.activePlanCount} Plans</span> • <span>{payer.activePolicyCount} Policies</span>
              </div>
              <Badge variant="primary">
                {payer.payerType.replace(/_/g, ' ')}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
