import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  InvestigationCatalogDto,
  CreateInvestigationPanelRequest
} from '@docsearch/api-contracts';

export interface CreateInvestigationPanelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateInvestigationPanelRequest) => Promise<void>;
  catalog: InvestigationCatalogDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
}

export const CreateInvestigationPanelDialog: React.FC<CreateInvestigationPanelDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  catalog,
  tenantId,
  partnerId,
  organizationId
}) => {
  const [panelCode, setPanelCode] = useState('');
  const [panelName, setPanelName] = useState('');
  const [category, setCategory] = useState<
    'HEMATOLOGY' | 'BIOCHEMISTRY' | 'ENDOCRINOLOGY' | 'MICROBIOLOGY' | 'IMMUNOLOGY' | 'PATHOLOGY' | 'RADIOLOGY' | 'CARDIOLOGY' | 'GENERAL'
  >('GENERAL');
  const [description, setDescription] = useState('');
  const [selectedInvestigationIds, setSelectedInvestigationIds] = useState<string[]>([]);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInvestigation = (id: string) => {
    setSelectedInvestigationIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelCode.trim()) {
      setError('Panel code is required.');
      return;
    }
    if (!panelName.trim()) {
      setError('Panel name is required.');
      return;
    }
    if (selectedInvestigationIds.length === 0) {
      setError('Select at least one investigation item for this panel.');
      return;
    }
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        panelCode,
        panelName,
        category,
        description: description || undefined,
        investigationIds: selectedInvestigationIds,
        actorId: 'admin.clindirs@docsearch.docsearch.health',
        actorRole: 'CLINICAL_DIRECTOR',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create panel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="📑 Configure Diagnostic Investigation Panel"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating Panel...' : 'Create Panel'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Panel Code *
            </label>
            <Input
              value={panelCode}
              onChange={(e) => setPanelCode(e.target.value.toUpperCase())}
              placeholder="e.g. PANEL-RENAL-01"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Panel Category *
            </label>
            <Select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as
                    | 'HEMATOLOGY'
                    | 'BIOCHEMISTRY'
                    | 'ENDOCRINOLOGY'
                    | 'MICROBIOLOGY'
                    | 'IMMUNOLOGY'
                    | 'PATHOLOGY'
                    | 'RADIOLOGY'
                    | 'CARDIOLOGY'
                    | 'GENERAL'
                )
              }
              options={[
                { label: 'General / Routine Screening', value: 'GENERAL' },
                { label: 'Hematology', value: 'HEMATOLOGY' },
                { label: 'Biochemistry', value: 'BIOCHEMISTRY' },
                { label: 'Endocrinology', value: 'ENDOCRINOLOGY' },
                { label: 'Microbiology', value: 'MICROBIOLOGY' },
                { label: 'Immunology', value: 'IMMUNOLOGY' },
                { label: 'Pathology', value: 'PATHOLOGY' },
                { label: 'Radiology', value: 'RADIOLOGY' },
                { label: 'Cardiology', value: 'CARDIOLOGY' }
              ]}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Panel Display Name *
          </label>
          <Input
            value={panelName}
            onChange={(e) => setPanelName(e.target.value)}
            placeholder="e.g. Comprehensive Renal Function Panel"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Clinical Description
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Clinical indications and test coverage included in panel..."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Included Investigations ({selectedInvestigationIds.length} selected) *
          </label>
          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '1px solid var(--ds-color-border-subtle, #e2e8f0)',
              borderRadius: '6px',
              padding: '8px'
            }}
          >
            {catalog.map((inv) => (
              <label
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedInvestigationIds.includes(inv.id)}
                  onChange={() => toggleInvestigation(inv.id)}
                />
                <span>
                  <strong>[{inv.testCode}]</strong> {inv.testName} ({inv.category})
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Reason for creating or revising diagnostic panel..."
          />
        </div>
      </form>
    </Dialog>
  );
};
