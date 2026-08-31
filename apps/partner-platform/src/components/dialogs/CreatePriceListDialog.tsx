import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreatePriceListRequest,
  BillingServiceCatalogDto
} from '@docsearch/api-contracts';

export interface CreatePriceListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreatePriceListRequest) => Promise<void>;
  services: BillingServiceCatalogDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
}

export const CreatePriceListDialog: React.FC<CreatePriceListDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  services,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [priceListCode, setPriceListCode] = useState('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [overridePrice, setOverridePrice] = useState('45.00');
  const [justification, setJustification] = useState('Corporate discounted tariff structure setup.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceListCode.trim() || !name.trim()) {
      setError('Price list code and name are required.');
      return;
    }
    const oPrice = parseFloat(overridePrice);
    if (isNaN(oPrice) || oPrice < 0) {
      setError('Override price must be a valid non-negative number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const items = selectedServiceId
        ? [
            {
              serviceCatalogId: selectedServiceId,
              unitPrice: oPrice,
              discountAllowed: true
            }
          ]
        : [];

      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId: branchId || undefined,
        priceListCode: priceListCode.trim().toUpperCase(),
        name: name.trim(),
        currency,
        items,
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create fee schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Institutional Fee Schedule / Price List"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Fee Schedule'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Schedule Code *
            </label>
            <Input
              value={priceListCode}
              onChange={(e) => setPriceListCode(e.target.value)}
              placeholder="e.g. PL-CORP-VIP"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Schedule Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Corporate Partner Discount Rate"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Currency
            </label>
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'INR', label: 'INR (₹)' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Effective Date *
            </label>
            <Input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600 }}>
            Initial Overridden Service Item
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Service Item
              </label>
              <Select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                options={services.map((s) => ({
                  value: s.id,
                  label: `${s.serviceCode} — ${s.serviceName} ($${s.basePrice.toFixed(2)})`
                }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Override Price ($)
              </label>
              <Input
                type="number"
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
                placeholder="45.00"
              />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Commercial justification for price schedule"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
