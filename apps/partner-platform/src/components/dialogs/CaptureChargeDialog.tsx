import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CaptureChargeRequest,
  ChargeSourceDomain,
  BillingServiceCatalogDto
} from '@docsearch/api-contracts';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';
import { AuditJustificationField } from '../common/AuditJustificationField.js';

export interface CaptureChargeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CaptureChargeRequest) => Promise<void>;
  services: BillingServiceCatalogDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CaptureChargeDialog: React.FC<CaptureChargeDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  services,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [sourceDomain, setSourceDomain] = useState<ChargeSourceDomain>('CLINICAL_CONSULTATION');
  const [patientId] = useState(() => `pat-${Date.now().toString(36)}`);
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('75.00');
  const [justification, setJustification] = useState('Point-of-care clinical service charge captured.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const handleServiceChange = (srvId: string) => {
    setSelectedServiceId(srvId);
    const found = services.find((s) => s.id === srvId);
    if (found) {
      setUnitPrice(found.basePrice.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim() || !patientName.trim()) {
      setError('Patient information is required.');
      return;
    }
    const priceNum = parseFloat(unitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Unit price must be a valid non-negative number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        sourceDomain,
        patientId: patientId.trim(),
        patientName: patientName.trim(),
        patientMrn: patientMrn.trim(),
        items: [
          {
            serviceCatalogId: selectedService?.id,
            serviceCode: selectedService?.serviceCode || 'SRV-GEN',
            description: selectedService?.serviceName || 'General Clinical Service',
            quantity,
            unitPrice: priceNum,
            discountAmount: 0,
            taxAmount: 0
          }
        ],
        actorId: getUnifiedPartnerProfile().supportEmail || getUnifiedPartnerProfile().doctorName || 'Authorized Clinician',
        actorRole: 'Attending Practitioner',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to capture charge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Capture Point-of-Care Clinical Charge"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Capturing...' : 'Capture Charge'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Source Clinical Domain *
          </label>
          <Select
            value={sourceDomain}
            onChange={(e) => setSourceDomain(e.target.value as ChargeSourceDomain)}
            options={[
              { value: 'CLINICAL_CONSULTATION', label: 'Consultation & Examination (2.6)' },
              { value: 'CLINICAL_INVESTIGATION', label: 'Investigation & Diagnostics (2.7)' },
              { value: 'PHARMACY', label: 'Pharmacy & Dispensing (2.8)' },
              { value: 'PROCEDURE', label: 'Minor / Major Procedure' },
              { value: 'EMERGENCY', label: 'Emergency Room Triage' }
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Patient Full Name *
            </label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Eleanor Vance or Rajesh Kumar"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Patient MRN *
            </label>
            <Input
              value={patientMrn}
              onChange={(e) => setPatientMrn(e.target.value)}
              placeholder="e.g. MRN-2026-00891"
              required
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600 }}>
            Billable Service Line Item
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Service Item *
              </label>
              <Select
                value={selectedServiceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                options={services.map((s) => ({
                  value: s.id,
                  label: `${s.serviceCode} — ${s.serviceName}`
                }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Quantity
              </label>
              <Input
                type="number"
                value={quantity.toString()}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                min="1"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Unit Price ($)
              </label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="75.00"
                required
              />
            </div>
          </div>
        </div>

        <AuditJustificationField
          value={justification}
          onChange={setJustification}
          defaultJustification="Standard clinical charge capture per hospital fee schedule"
          placeholder="Clinical reason for charge entry..."
        />
      </form>
    </Dialog>
  );
};
