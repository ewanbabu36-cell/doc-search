import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  InvestigationOrderDto,
  FinalizeInvestigationReportRequest
} from '@docsearch/api-contracts';

export interface FinalizeInvestigationReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: FinalizeInvestigationReportRequest) => Promise<void>;
  order: InvestigationOrderDto | null;
  tenantId: string;
}

export const FinalizeInvestigationReportDialog: React.FC<FinalizeInvestigationReportDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
  tenantId
}) => {
  const [reportTitle, setReportTitle] = useState(
    order ? `Diagnostic Report: ${order.investigationName}` : ''
  );
  const [clinicalFindings, setClinicalFindings] = useState(
    order?.results.map((r) => `${r.parameterName}: ${r.resultValue} ${r.unit ?? ''}`).join('\n') || ''
  );
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [reportingClinician, setReportingClinician] = useState('Dr. Marcus Vance, MD (Clinical Pathologist)');
  const [justification, setJustification] = useState('Final diagnostic laboratory report generation.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) {
      setError('Report title is required.');
      return;
    }
    if (!impression.trim()) {
      setError('Clinical impression is required.');
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
        orderId: order.id,
        reportTitle,
        clinicalFindings: clinicalFindings || undefined,
        impression,
        recommendations: recommendations || undefined,
        reportingClinician,
        actorId: 'dr.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PATHOLOGIST',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to finalize diagnostic report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="📄 Finalize Diagnostic Laboratory Report"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Finalizing Report...' : 'Finalize & Publish Report'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(30, 41, 59, 0.85)', color: '#F8FAFC', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '6px', fontSize: '0.875rem' }}>
          <div><strong>Order:</strong> {order.orderNumber} — {order.investigationName}</div>
          <div><strong>Patient:</strong> {order.patientName} (MRN: {order.patientMrn})</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Report Title *
          </label>
          <Input
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Clinical Findings Summary
          </label>
          <Input
            value={clinicalFindings}
            onChange={(e) => setClinicalFindings(e.target.value)}
            placeholder="Document observed findings..."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Diagnostic Impression *
          </label>
          <Input
            value={impression}
            onChange={(e) => setImpression(e.target.value)}
            placeholder="Clinical diagnosis or diagnostic conclusion..."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Clinical Recommendations
          </label>
          <Input
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            placeholder="Follow-up, referral, or medication suggestions..."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Reporting Clinician *
          </label>
          <Input
            value={reportingClinician}
            onChange={(e) => setReportingClinician(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
        </div>
      </form>
    </Dialog>
  );
};
