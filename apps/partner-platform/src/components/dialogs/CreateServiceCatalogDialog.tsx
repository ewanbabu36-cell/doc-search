import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateServiceCatalogRequest,
  ServiceCategory
} from '@docsearch/api-contracts';

export interface CreateServiceCatalogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateServiceCatalogRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
}

export const CreateServiceCatalogDialog: React.FC<CreateServiceCatalogDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [serviceCode, setServiceCode] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('CONSULTATION');
  const [department, setDepartment] = useState('General Medicine');
  const [basePrice, setBasePrice] = useState('50.00');
  const [description, setDescription] = useState('');
  const [taxable, setTaxable] = useState(false);
  const [taxRate, setTaxRate] = useState('0.00');
  const [justification, setJustification] = useState('Master billable catalog addition according to tariff update.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceCode.trim() || !serviceName.trim()) {
      setError('Service code and name are required.');
      return;
    }
    const price = parseFloat(basePrice);
    if (isNaN(price) || price < 0) {
      setError('Base price must be a valid non-negative number.');
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
        serviceCode: serviceCode.trim().toUpperCase(),
        serviceName: serviceName.trim(),
        category,
        department: department.trim() || undefined,
        serviceType: 'STANDARD',
        unit: 'SERVICE',
        basePrice: price,
        description: description.trim() || undefined,
        taxable,
        taxCode: taxable ? 'TAX-5PCT' : undefined,
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Billable Service to Catalog"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Service'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Service Code *
            </label>
            <Input
              value={serviceCode}
              onChange={(e) => setServiceCode(e.target.value)}
              placeholder="e.g. SRV-CONS-SPEC"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Service Name *
            </label>
            <Input
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. Specialist Clinical Consultation"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Category *
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              options={[
                { value: 'CONSULTATION', label: 'Consultation' },
                { value: 'INVESTIGATION', label: 'Investigation / Lab' },
                { value: 'PHARMACY', label: 'Pharmacy' },
                { value: 'PROCEDURE', label: 'Procedure' },
                { value: 'EMERGENCY', label: 'Emergency' },
                { value: 'BED_CHARGES', label: 'Bed / Room Charges' },
                { value: 'EQUIPMENT', label: 'Equipment' },
                { value: 'MISCELLANEOUS', label: 'Miscellaneous' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Department
            </label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Cardiology"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Base Tariff Price ($) *
            </label>
            <Input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="50.00"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Tax Status
            </label>
            <Select
              value={taxable ? 'YES' : 'NO'}
              onChange={(e) => setTaxable(e.target.value === 'YES')}
              options={[
                { value: 'NO', label: 'Tax Exempt (0%)' },
                { value: 'YES', label: 'Taxable Service' }
              ]}
            />
          </div>
        </div>

        {taxable && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Tax Rate (%) *
            </label>
            <Input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="5.00"
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Description
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Clinical description or protocol code"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Auditable reason for catalog modification"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
