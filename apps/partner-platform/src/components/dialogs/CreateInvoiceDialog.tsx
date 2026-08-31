import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateInvoiceRequest,
  BillingChargeDto
} from '@docsearch/api-contracts';

export interface CreateInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateInvoiceRequest) => Promise<void>;
  pendingCharges: BillingChargeDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  pendingCharges,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patientName, setPatientName] = useState('Eleanor Vance');
  const [patientMrn, setPatientMrn] = useState('MRN-2026-00891');
  const [patientId, setPatientId] = useState('55555555-5555-4555-8555-555555555501');
  const [invoiceType, setInvoiceType] = useState<'OPD' | 'IPD' | 'DIAGNOSTICS' | 'PHARMACY' | 'EMERGENCY'>('OPD');
  const [selectedChargeId, setSelectedChargeId] = useState<string>(pendingCharges[0]?.id || '');
  const [dueDays, setDueDays] = useState('30');
  const [justification, setJustification] = useState('Commercial invoice generated for clinical encounter settlement.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCharge = pendingCharges.find((c) => c.id === selectedChargeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientMrn.trim()) {
      setError('Patient name and MRN are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const items = selectedCharge
        ? selectedCharge.items.map((it) => ({
            chargeId: selectedCharge.id,
            chargeItemId: it.id,
            serviceCatalogId: it.serviceCatalogId || undefined,
            serviceCode: it.serviceCode || 'SRV-GEN',
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountAmount: it.discountAmount,
            taxAmount: it.taxAmount
          }))
        : [
            {
              serviceCode: 'SRV-CONS-OPD',
              description: 'General OPD Consultation Fee',
              quantity: 1,
              unitPrice: 65.00,
              discountAmount: 0,
              taxAmount: 0
            }
          ];

      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId: selectedCharge ? selectedCharge.patientId : patientId,
        patientName: selectedCharge ? selectedCharge.patientName : patientName.trim(),
        patientMrn: selectedCharge ? selectedCharge.patientMrn : patientMrn.trim(),
        invoiceType,
        chargeIds: selectedCharge ? [selectedCharge.id] : [],
        items,
        dueDays: parseInt(dueDays, 10) || 30,
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Commercial Invoice"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        {pendingCharges.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Import from Captured Clinical Charge
            </label>
            <Select
              value={selectedChargeId}
              onChange={(e) => {
                setSelectedChargeId(e.target.value);
                const ch = pendingCharges.find((c) => c.id === e.target.value);
                if (ch) {
                  setPatientName(ch.patientName);
                  setPatientMrn(ch.patientMrn);
                  setPatientId(ch.patientId);
                }
              }}
              options={[
                { value: '', label: '— Manual Line Items Entry —' },
                ...pendingCharges.map((ch) => ({
                  value: ch.id,
                  label: `${ch.chargeNumber} — ${ch.patientName} ($${ch.grandTotal.toFixed(2)} [${ch.sourceDomain}])`
                }))
              ]}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Patient Full Name *
            </label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Eleanor Vance"
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
              placeholder="MRN-2026-00891"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Invoice Classification *
            </label>
            <Select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as 'OPD' | 'IPD' | 'DIAGNOSTICS' | 'PHARMACY' | 'EMERGENCY')}
              options={[
                { value: 'OPD', label: 'Outpatient (OPD)' },
                { value: 'IPD', label: 'Inpatient (IPD)' },
                { value: 'DIAGNOSTICS', label: 'Diagnostics' },
                { value: 'PHARMACY', label: 'Pharmacy' },
                { value: 'EMERGENCY', label: 'Emergency' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Payment Terms (Due Days)
            </label>
            <Input
              type="number"
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              placeholder="30"
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Reason for invoice creation"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
