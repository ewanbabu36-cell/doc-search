import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  ProcurementVendorDto,
  UpdateVendorRequest,
  VendorCategory,
  VendorType,
  VendorRiskClassification
} from '@docsearch/api-contracts';

export interface EditVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: UpdateVendorRequest) => Promise<void>;
  vendor: ProcurementVendorDto | null;
  tenantId: string;
}

export const EditVendorDialog: React.FC<EditVendorDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendor,
  tenantId
}) => {
  const [legalName, setLegalName] = useState(vendor?.legalName || '');
  const [tradeName, setTradeName] = useState(vendor?.tradeName || '');
  const [vendorCategory, setVendorCategory] = useState<VendorCategory>(vendor?.vendorCategory || 'PHARMACEUTICALS');
  const [vendorType, setVendorType] = useState<VendorType>(vendor?.vendorType || 'DISTRIBUTOR');
  const [contactPerson, setContactPerson] = useState(vendor?.contactPerson || '');
  const [contactEmail, setContactEmail] = useState(vendor?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(vendor?.contactPhone || '');
  const [paymentTermsDays, setPaymentTermsDays] = useState(vendor?.paymentTermsDays.toString() || '30');
  const [riskClassification, setRiskClassification] = useState<VendorRiskClassification>(vendor?.riskClassification || 'LOW_RISK');
  const [justification, setJustification] = useState('Vendor details updated per annual vendor audit review.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!vendor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        vendorId: vendor.id,
        legalName: legalName.trim(),
        tradeName: tradeName.trim() || undefined,
        vendorCategory,
        vendorType,
        contactPerson: contactPerson.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        paymentTermsDays: parseInt(paymentTermsDays, 10) || 30,
        riskClassification,
        actorId: 'James Vance',
        actorRole: 'Procurement Officer',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Edit Vendor: ${vendor.vendorCode}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Legal Entity Name *
          </label>
          <Input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Trade / Operating Name
            </label>
            <Input
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Vendor Type
            </label>
            <Select
              value={vendorType}
              onChange={(e) => setVendorType(e.target.value as VendorType)}
              options={[
                { value: 'MANUFACTURER', label: 'Manufacturer' },
                { value: 'DISTRIBUTOR', label: 'Distributor' },
                { value: 'WHOLESALER', label: 'Wholesaler' },
                { value: 'SERVICE_PROVIDER', label: 'Service Provider' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Category
            </label>
            <Select
              value={vendorCategory}
              onChange={(e) => setVendorCategory(e.target.value as VendorCategory)}
              options={[
                { value: 'PHARMACEUTICALS', label: 'Pharmaceuticals' },
                { value: 'SURGICAL_DISPOSABLES', label: 'Surgical Disposables' },
                { value: 'LABORATORY_REAGENTS', label: 'Laboratory Reagents' },
                { value: 'MEDICAL_EQUIPMENT', label: 'Medical Equipment' },
                { value: 'PPE_SAFETY', label: 'PPE & Safety' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Risk Tier
            </label>
            <Select
              value={riskClassification}
              onChange={(e) => setRiskClassification(e.target.value as VendorRiskClassification)}
              options={[
                { value: 'LOW_RISK', label: 'Low Risk' },
                { value: 'MEDIUM_RISK', label: 'Medium Risk' },
                { value: 'HIGH_RISK', label: 'High Risk' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contact Person
            </label>
            <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contact Email
            </label>
            <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contact Phone
            </label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Payment SLA (Days)
            </label>
            <Input type="number" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Audit Justification *
            </label>
            <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
