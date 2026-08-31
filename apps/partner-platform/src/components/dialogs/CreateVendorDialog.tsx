import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateVendorRequest,
  VendorCategory,
  VendorType,
  VendorRiskClassification
} from '@docsearch/api-contracts';

export interface CreateVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateVendorRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const CreateVendorDialog: React.FC<CreateVendorDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [vendorCode, setVendorCode] = useState('');
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [vendorCategory, setVendorCategory] = useState<VendorCategory>('PHARMACEUTICALS');
  const [vendorType, setVendorType] = useState<VendorType>('DISTRIBUTOR');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [leadTimeDays, setLeadTimeDays] = useState('3');
  const [minimumOrderValue, setMinimumOrderValue] = useState('500');
  const [deliverySlaHours, setDeliverySlaHours] = useState('24');
  const [riskClassification, setRiskClassification] = useState<VendorRiskClassification>('LOW_RISK');
  const [notes, setNotes] = useState('');
  const [justification, setJustification] = useState('Vendor accredited per clinical procurement compliance standards.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorCode.trim() || !legalName.trim()) {
      setError('Vendor Code and Legal Name are mandatory.');
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
        vendorCode: vendorCode.trim().toUpperCase(),
        legalName: legalName.trim(),
        tradeName: tradeName.trim() || undefined,
        vendorCategory,
        vendorType,
        contactPerson: contactPerson.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        address: address.trim() || undefined,
        taxId: taxId.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        panNumber: panNumber.trim() || undefined,
        paymentTermsDays: parseInt(paymentTermsDays, 10) || 30,
        leadTimeDays: parseInt(leadTimeDays, 10) || 3,
        minimumOrderValue: parseFloat(minimumOrderValue) || 0,
        deliverySlaHours: parseInt(deliverySlaHours, 10) || 24,
        riskClassification,
        notes: notes.trim() || undefined,
        actorId: 'James Vance',
        actorRole: 'Procurement Officer',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Register New Healthcare Vendor">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Vendor Code *
            </label>
            <Input
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value)}
              placeholder="e.g. VND-MEDPHARMA"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Legal Entity Name *
            </label>
            <Input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. MedPharma Global Distribution Corp"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Trade / Operating Name
            </label>
            <Input
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="e.g. MedPharma Rx Logistics"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Tax ID / EIN
            </label>
            <Input
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="e.g. US-EIN-94827101"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              GSTIN
            </label>
            <Input
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="e.g. GSTIN27AABCM9812Z1"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              PAN Number
            </label>
            <Input
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
              placeholder="e.g. AABCM9812Z"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Vendor Category *
            </label>
            <Select
              value={vendorCategory}
              onChange={(e) => setVendorCategory(e.target.value as VendorCategory)}
              options={[
                { value: 'PHARMACEUTICALS', label: 'Pharmaceuticals & Rx' },
                { value: 'SURGICAL_DISPOSABLES', label: 'Surgical Disposables' },
                { value: 'LABORATORY_REAGENTS', label: 'Laboratory Reagents' },
                { value: 'MEDICAL_EQUIPMENT', label: 'Medical Equipment & Devices' },
                { value: 'PPE_SAFETY', label: 'PPE & Safety Supplies' },
                { value: 'GENERAL_SUPPLIES', label: 'General Hospital Supplies' },
                { value: 'IT_BIOMEDICAL', label: 'IT & Biomedical Systems' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Vendor Type *
            </label>
            <Select
              value={vendorType}
              onChange={(e) => setVendorType(e.target.value as VendorType)}
              options={[
                { value: 'MANUFACTURER', label: 'Direct Manufacturer' },
                { value: 'DISTRIBUTOR', label: 'Authorized Distributor' },
                { value: 'WHOLESALER', label: 'Wholesale Stockist' },
                { value: 'DIRECT_IMPORTER', label: 'Direct Importer' },
                { value: 'LOCAL_SUPPLIER', label: 'Local Supplier' },
                { value: 'SERVICE_PROVIDER', label: 'Service & Maintenance Provider' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Risk Classification
            </label>
            <Select
              value={riskClassification}
              onChange={(e) => setRiskClassification(e.target.value as VendorRiskClassification)}
              options={[
                { value: 'LOW_RISK', label: 'Low Risk (Accredited Tier 1)' },
                { value: 'MEDIUM_RISK', label: 'Medium Risk' },
                { value: 'HIGH_RISK', label: 'High Risk' },
                { value: 'CRITICAL', label: 'Critical / Monitored' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contact Person
            </label>
            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. David Miller"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contact Email
            </label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="david@vendor.docsearch.health"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Contact Phone
            </label>
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1-800-555-0201"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Payment SLA (Days)
            </label>
            <Input
              type="number"
              value={paymentTermsDays}
              onChange={(e) => setPaymentTermsDays(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Lead Time (Days)
            </label>
            <Input
              type="number"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Min Order Value ($)
            </label>
            <Input
              type="number"
              value={minimumOrderValue}
              onChange={(e) => setMinimumOrderValue(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Delivery SLA (Hours)
            </label>
            <Input
              type="number"
              value={deliverySlaHours}
              onChange={(e) => setDeliverySlaHours(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Registered Physical / Warehouse Address
          </label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 400 BioTech Parkway, Suite 300, Healthcare City"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Special Notes & Certifications
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. WHO-GMP, ISO 13485 certified distributor"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register Vendor'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
