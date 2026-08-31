import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Badge
} from '@docsearch/ui-kit';
import type {
  InsurancePlanDto,
  InsurancePayerDto
} from '@docsearch/api-contracts';

export interface InsurancePlanCatalogViewProps {
  plans: InsurancePlanDto[];
  payers: InsurancePayerDto[];
  onOpenCreatePlan: () => void;
}

export const InsurancePlanCatalogView: React.FC<InsurancePlanCatalogViewProps> = ({
  plans,
  payers,
  onOpenCreatePlan
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayerId, setSelectedPayerId] = useState<string>('ALL');

  const filtered = plans.filter((pl) => {
    const matchesSearch =
      pl.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pl.planCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayer = selectedPayerId === 'ALL' || pl.payerId === selectedPayerId;
    return matchesSearch && matchesPayer;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Insurance Benefit Plans & Coverage Catalog
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Master schedule of benefit plans, copay percentage matrices, deductibles, and pre-authorization thresholds.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreatePlan}>
          + Create Benefit Plan
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Search by Plan Name or Code
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. BS-GOLD-COMP, Premier Corporate"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Filter by Payer
            </label>
            <Select
              value={selectedPayerId}
              onChange={(e) => setSelectedPayerId(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Insurance Payers' },
                ...payers.map((p) => ({ value: p.id, label: p.payerName }))
              ]}
            />
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((plan) => (
          <Card key={plan.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}>
                  {plan.planCode}
                </span>
                <Badge variant={plan.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {plan.status}
                </Badge>
              </div>

              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
                {plan.planName}
              </h3>

              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                {plan.payerName || 'Associated Payer'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', margin: '0.75rem 0' }}>
                <div>
                  <div style={{ color: '#64748b' }}>Copay</div>
                  <strong style={{ color: '#1e293b' }}>{plan.copayPercentage}%</strong>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>Deductible</div>
                  <strong style={{ color: '#1e293b' }}>${plan.standardDeductible.toFixed(2)}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>Pre-Auth</div>
                  <strong style={{ color: '#1e293b' }}>${plan.preAuthThreshold.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: '#475569' }}>Tier: {plan.networkType.replace(/_/g, ' ')}</span>
              <Badge variant="primary">{plan.planType}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
