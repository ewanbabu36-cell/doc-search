import React, { useState } from 'react';
import type {
  ProductDto,
  PlanDto,
  PartnerProfileDto
} from '@docsearch/api-contracts';
import {
  Dialog,
  Button,
  FormField,
  Select,
  Alert
} from '@docsearch/ui-kit';

export interface AssignPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductDto[];
  plans: PlanDto[];
  partners: PartnerProfileDto[];
  onAssign: (partnerId: string, productId: string, planId: string, reason: string) => Promise<void>;
}

export const AssignPlanDialog: React.FC<AssignPlanDialogProps> = ({
  isOpen,
  onClose,
  products,
  plans,
  partners,
  onAssign
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState(partners[0]?.id ?? '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '');
  const [selectedPlanId, setSelectedPlanId] = useState(
    plans.find((p) => p.productId === (products[0]?.id ?? ''))?.id ?? (plans[0]?.id ?? '')
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availablePlans = plans.filter((p) => p.productId === selectedProductId);

  const handleProductChange = (newProductId: string) => {
    setSelectedProductId(newProductId);
    const firstPlan = plans.find((p) => p.productId === newProductId);
    if (firstPlan) {
      setSelectedPlanId(firstPlan.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A valid administrative reason is mandatory for partner plan entitlement assignments.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onAssign(selectedPartnerId, selectedProductId, selectedPlanId, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan assignment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Assign SaaS Plan & Entitlements to Partner"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirm Entitlement Assignment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="SaaS Entitlement Assignment">
          Assigning a plan activates the feature limits, quotas, and security boundaries for the selected partner organization. No billing/payment action is triggered.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <FormField label="Target Healthcare Partner Organization" required>
          <Select
            options={partners.map((p) => ({
              label: `${p.tradeName} (${p.tenantSlug})`,
              value: p.id
            }))}
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
          />
        </FormField>

        <FormField label="Product Line" required>
          <Select
            options={products.map((prod) => ({
              label: `${prod.name} (v${prod.version})`,
              value: prod.id
            }))}
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
          />
        </FormField>

        <FormField label="Target Plan & Entitlement Tier" required>
          <Select
            options={availablePlans.map((pl) => ({
              label: `${pl.name} (v${pl.version})`,
              value: pl.id
            }))}
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
          />
        </FormField>

        <FormField
          label="Assignment Justification & Audit Reason"
          required
          helperText="Record why this partner is receiving this entitlement configuration."
        >
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Enterprise Hospital Network contract execution; provisioned full multi-branch entitlement tier."
            className="ds-interactive"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              color: 'var(--ds-color-text-primary)',
              backgroundColor: 'var(--ds-color-surface)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: '6px',
              resize: 'vertical'
            }}
          />
        </FormField>
      </form>
    </Dialog>
  );
};
