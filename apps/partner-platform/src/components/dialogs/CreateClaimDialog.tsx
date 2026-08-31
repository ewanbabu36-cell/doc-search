import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateClaimRequest,
  InsurancePatientPolicyDto,
  InsuranceAuthorizationDto,
  ClaimType,
  ClaimSubmissionMode
} from '@docsearch/api-contracts';

export interface CreateClaimDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateClaimRequest) => Promise<void>;
  policies: InsurancePatientPolicyDto[];
  authorizations: InsuranceAuthorizationDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  defaultPolicy?: InsurancePatientPolicyDto | null;
}

export const CreateClaimDialog: React.FC<CreateClaimDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  policies,
  authorizations,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  defaultPolicy
}) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState(defaultPolicy?.id || policies[0]?.id || '');
  const [claimType, setClaimType] = useState<ClaimType>('OUTPATIENT');
  const [submissionMode, setSubmissionMode] = useState<ClaimSubmissionMode>('EDI_ELECTRONIC');
  const [authorizationId, setAuthorizationId] = useState('');
  const [primaryDiagnosisCode, setPrimaryDiagnosisCode] = useState('I10');
  const [primaryDiagnosisDescription, setPrimaryDiagnosisDescription] = useState('Essential (primary) hypertension');
  const [attendingDoctorName, setAttendingDoctorName] = useState('Dr. Sarah Jenkins');
  const [serviceCode, setServiceCode] = useState('SRV-CONS-OPD');
  const [serviceDescription, setServiceDescription] = useState('Specialist Clinical Consultation');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('80.00');
  const [justification, setJustification] = useState('Commercial insurance claim generated from validated clinical encounter.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) || defaultPolicy || policies[0];
  const patientAuths = authorizations.filter((a) => selectedPolicy && a.patientId === selectedPolicy.patientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) {
      setError('Active insurance policy selection is required.');
      return;
    }
    const priceNum = parseFloat(unitPrice);
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(priceNum) || priceNum <= 0 || isNaN(qtyNum) || qtyNum <= 0) {
      setError('Service quantity and unit price must be valid positive numbers.');
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
        patientId: selectedPolicy.patientId,
        policyId: selectedPolicy.id,
        payerId: selectedPolicy.payerId,
        authorizationId: authorizationId || undefined,
        claimType,
        submissionMode,
        primaryDiagnosisCode: primaryDiagnosisCode.trim().toUpperCase(),
        primaryDiagnosisDescription: primaryDiagnosisDescription.trim(),
        attendingDoctorName: attendingDoctorName.trim(),
        items: [
          {
            serviceCode: serviceCode.trim().toUpperCase(),
            serviceDescription: serviceDescription.trim(),
            quantity: qtyNum,
            unitPrice: priceNum,
            billedAmount: qtyNum * priceNum
          }
        ],
        actorId: 'Bob Rivera (Insurance Coordinator)',
        actorRole: 'Insurance Operations Specialist',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Healthcare Insurance Claim"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Claim Dossier'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Patient Policy *
          </label>
          <Select
            value={selectedPolicyId}
            onChange={(e) => setSelectedPolicyId(e.target.value)}
            options={policies.map((p) => ({
              value: p.id,
              label: `${p.patientName} (${p.patientMrn}) — ${p.payerName} [${p.policyNumber}]`
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Claim Type *
            </label>
            <Select
              value={claimType}
              onChange={(e) => setClaimType(e.target.value as ClaimType)}
              options={[
                { value: 'OUTPATIENT', label: 'Outpatient (OPD)' },
                { value: 'INPATIENT', label: 'Inpatient (IPD)' },
                { value: 'EMERGENCY', label: 'Emergency Department' },
                { value: 'DAY_CARE', label: 'Day Care Procedure' },
                { value: 'PHARMACY_DIRECT', label: 'Direct Pharmacy Prescription' },
                { value: 'DIAGNOSTIC_DIRECT', label: 'Direct Lab/Radiology' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Submission Mode *
            </label>
            <Select
              value={submissionMode}
              onChange={(e) => setSubmissionMode(e.target.value as ClaimSubmissionMode)}
              options={[
                { value: 'EDI_ELECTRONIC', label: 'ANSI 837 Electronic EDI' },
                { value: 'PAYER_PORTAL', label: 'Direct Payer Web Portal' },
                { value: 'API_DIRECT', label: 'Direct FHIR/REST API' },
                { value: 'PHYSICAL_BATCH', label: 'Physical Form Submission' }
              ]}
            />
          </div>
        </div>

        {patientAuths.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Link Approved Pre-Authorization (Optional)
            </label>
            <Select
              value={authorizationId}
              onChange={(e) => setAuthorizationId(e.target.value)}
              options={[
                { value: '', label: '-- No Pre-Auth Link --' },
                ...patientAuths.map((a) => ({
                  value: a.id,
                  label: `${a.authorizationNumber} — ${a.requestedServices} ($${a.approvedAmount.toFixed(2)} Approved)`
                }))
              ]}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Primary ICD-10 *
            </label>
            <Input
              value={primaryDiagnosisCode}
              onChange={(e) => setPrimaryDiagnosisCode(e.target.value)}
              placeholder="e.g. I10"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Diagnosis Description *
            </label>
            <Input
              value={primaryDiagnosisDescription}
              onChange={(e) => setPrimaryDiagnosisDescription(e.target.value)}
              placeholder="e.g. Essential (primary) hypertension"
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Attending Clinician *
          </label>
          <Input
            value={attendingDoctorName}
            onChange={(e) => setAttendingDoctorName(e.target.value)}
            required
          />
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
          <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>Primary Billable Service Item</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Service Code</label>
              <Input
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Description</label>
              <Input
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Qty</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Price ($)</label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
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
            placeholder="Encounter checkout reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
