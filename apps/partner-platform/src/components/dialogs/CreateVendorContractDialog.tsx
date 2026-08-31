import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateVendorContractRequest,
  ProcurementVendorDto
} from '@docsearch/api-contracts';

export interface CreateVendorContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateVendorContractRequest) => Promise<void>;
  vendors: ProcurementVendorDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const CreateVendorContractDialog: React.FC<CreateVendorContractDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendors,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [contractNumber, setContractNumber] = useState('');
  const [title, setTitle] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [slaDays, setSlaDays] = useState('2');
  const [totalAgreedValue, setTotalAgreedValue] = useState('100000');
  const [terms, setTerms] = useState('Standard hospital procurement terms with guaranteed price lock for 12 months.');
  const [justification, setJustification] = useState('Annual master supply agreement established with vendor.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNumber.trim() || !title.trim() || !vendorId) {
      setError('Vendor, Contract Number, and Title are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId: branchId || undefined,
        vendorId,
        contractNumber: contractNumber.trim().toUpperCase(),
        title: title.trim(),
        effectiveDate: new Date(effectiveDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
        slaDays: parseInt(slaDays, 10) || 2,
        totalAgreedValue: parseFloat(totalAgreedValue) || 0,
        terms: terms.trim() || undefined,
        items: [],
        actorId: 'James Vance',
        actorRole: 'Procurement Officer',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create Master Vendor Contract">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Accredited Vendor *
          </label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vendorCode} — {v.legalName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contract Number *
            </label>
            <Input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="e.g. CTR-2026-MEDPHARMA-01"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contract Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Pharmaceutical Supply Agreement"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Effective Date *
            </label>
            <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Expiry Date *
            </label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              SLA Delivery (Days)
            </label>
            <Input type="number" value={slaDays} onChange={(e) => setSlaDays(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Agreed Value ($)
            </label>
            <Input type="number" value={totalAgreedValue} onChange={(e) => setTotalAgreedValue(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Terms & Special Conditions
          </label>
          <Input value={terms} onChange={(e) => setTerms(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Contract'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
