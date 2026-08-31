import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateInsurancePlanRequest,
  InsurancePayerDto,
  InsurancePlanType,
  NetworkTier
} from '@docsearch/api-contracts';

export interface CreateInsurancePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateInsurancePlanRequest) => Promise<void>;
  payers: InsurancePayerDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
}

export const CreateInsurancePlanDialog: React.FC<CreateInsurancePlanDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  payers,
  tenantId,
  partnerId,
  organizationId
}) => {
  const [payerId, setPayerId] = useState(payers[0]?.id || '');
  const [planCode, setPlanCode] = useState('');
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState<InsurancePlanType>('COMPREHENSIVE');
  const [networkType, setNetworkType] = useState<NetworkTier>('TIER_1_IN_NETWORK');
  const [copayPercentage, setCopayPercentage] = useState('10');
  const [standardDeductible, setStandardDeductible] = useState('100.00');
  const [preAuthThreshold, setPreAuthThreshold] = useState('500.00');
  const [justification, setJustification] = useState('New benefit schedule added to institutional tariff matrix.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerId || !planCode.trim() || !planName.trim()) {
      setError('Payer selection, plan code, and plan name are required.');
      return;
    }
    const copay = parseFloat(copayPercentage);
    const deductible = parseFloat(standardDeductible);
    const preAuth = parseFloat(preAuthThreshold);

    if (isNaN(copay) || copay < 0 || copay > 100) {
      setError('Copay percentage must be between 0 and 100.');
      return;
    }
    if (isNaN(deductible) || deductible < 0 || isNaN(preAuth) || preAuth < 0) {
      setError('Deductible and Pre-auth thresholds must be non-negative amounts.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        payerId,
        planCode: planCode.trim().toUpperCase(),
        planName: planName.trim(),
        planType,
        networkType,
        copayPercentage: copay,
        standardDeductible: deductible,
        preAuthThreshold: preAuth,
        actorId: 'Insurance Administrator Alice Wong',
        actorRole: 'Insurance Operations Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create insurance plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Insurance Benefit Plan"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Plan'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Associated Insurance Payer / TPA *
          </label>
          <Select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            options={payers.map((p) => ({ value: p.id, label: `${p.payerName} (${p.payerCode})` }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Plan Code *
            </label>
            <Input
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              placeholder="e.g. BS-PLATINUM-COMP"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Plan Type *
            </label>
            <Select
              value={planType}
              onChange={(e) => setPlanType(e.target.value as InsurancePlanType)}
              options={[
                { value: 'COMPREHENSIVE', label: 'Comprehensive (Inpatient & Outpatient)' },
                { value: 'OPD_ONLY', label: 'Outpatient (OPD) Primary Care' },
                { value: 'IPD_CATASTROPHIC', label: 'Inpatient (IPD) Catastrophic' },
                { value: 'DENTAL_VISION', label: 'Dental & Vision Supplemental' },
                { value: 'SENIOR_GOLD', label: 'Senior Citizen Gold Tier' },
                { value: 'CORPORATE_CUSTOM', label: 'Corporate Custom Executive Package' }
              ]}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Plan Display Name *
          </label>
          <Input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g. BlueShield Platinum Comprehensive Health"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Copay (%) *
            </label>
            <Input
              type="number"
              value={copayPercentage}
              onChange={(e) => setCopayPercentage(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Annual Deductible ($) *
            </label>
            <Input
              type="number"
              value={standardDeductible}
              onChange={(e) => setStandardDeductible(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Pre-Auth Limit ($) *
            </label>
            <Input
              type="number"
              value={preAuthThreshold}
              onChange={(e) => setPreAuthThreshold(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Network Tier *
          </label>
          <Select
            value={networkType}
            onChange={(e) => setNetworkType(e.target.value as NetworkTier)}
            options={[
              { value: 'TIER_1_IN_NETWORK', label: 'Tier 1 — Direct In-Network Facility' },
              { value: 'TIER_2_PREFERRED', label: 'Tier 2 — Preferred Network Partner' },
              { value: 'OUT_OF_NETWORK', label: 'Out of Network / Non-Participating' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Contract reference or schedule addendum"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
