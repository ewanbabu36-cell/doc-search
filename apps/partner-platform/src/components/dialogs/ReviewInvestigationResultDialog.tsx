import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  InvestigationOrderDto,
  ReviewInvestigationResultRequest
} from '@docsearch/api-contracts';

export interface ReviewInvestigationResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ReviewInvestigationResultRequest) => Promise<void>;
  order: InvestigationOrderDto | null;
  tenantId: string;
}

export const ReviewInvestigationResultDialog: React.FC<ReviewInvestigationResultDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
  tenantId
}) => {
  const [reviewingDoctor, setReviewingDoctor] = useState(
    order?.orderingDoctorName || 'Dr. Sarah Jenkins, MD'
  );
  const [doctorReviewNotes, setDoctorReviewNotes] = useState('');
  const [justification, setJustification] = useState('Attending physician acknowledged and reviewed diagnostic findings.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorReviewNotes.trim()) {
      setError('Doctor clinical review notes and action plan are required.');
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
        reviewingDoctor,
        doctorReviewNotes,
        actorId: 'dr.sarah.jenkins@docsearch.docsearch.health',
        actorRole: 'ATTENDING_DOCTOR',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to record physician review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="👨‍⚕️ Attending Physician Investigation Review & Action"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Recording Review...' : 'Sign Off & Complete Review'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        {order.isCritical && (
          <Alert type="error" title="🚨 Critical Result Review Priority">
            This patient has critical laboratory abnormalities. Ensure treatment plan changes, patient telephonic notice, or emergency admission orders are documented below.
          </Alert>
        )}

        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(30, 41, 59, 0.85)', color: '#F8FAFC', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '6px', fontSize: '0.875rem' }}>
          <div><strong>Order:</strong> {order.orderNumber} — {order.investigationName}</div>
          <div><strong>Patient:</strong> {order.patientName} (MRN: {order.patientMrn})</div>
          <div><strong>Indication:</strong> {order.clinicalIndication}</div>
          {order.report && (
            <div style={{ marginTop: '6px', color: 'var(--ds-color-primary-text, #1e40af)' }}>
              <strong>Pathologist Impression:</strong> {order.report.impression}
            </div>
          )}
        </div>

        <div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Verified Findings ({order.results.length} parameters)
          </span>
          <TableContainer style={{ maxHeight: '180px', overflowY: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Result Value</TableHead>
                  <TableHead>Ref Range</TableHead>
                  <TableHead>Flag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell style={{ fontWeight: 600 }}>{r.parameterName}</TableCell>
                    <TableCell style={{ fontFamily: 'monospace' }}>
                      {r.resultValue} {r.unit ?? ''}
                    </TableCell>
                    <TableCell style={{ color: 'var(--ds-color-text-muted)' }}>{r.referenceRange || 'N/A'}</TableCell>
                    <TableCell>
                      {r.abnormalFlag === 'NORMAL' && <Badge variant="success">Normal</Badge>}
                      {r.abnormalFlag === 'HIGH' && <Badge variant="warning">High</Badge>}
                      {r.abnormalFlag === 'LOW' && <Badge variant="warning">Low</Badge>}
                      {r.abnormalFlag === 'ABNORMAL' && <Badge variant="warning">Abnormal</Badge>}
                      {(r.abnormalFlag === 'CRITICAL_HIGH' || r.abnormalFlag === 'CRITICAL_LOW') && (
                        <Badge variant="danger">🚨 {r.abnormalFlag}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Reviewing Physician *
          </label>
          <Input
            value={reviewingDoctor}
            onChange={(e) => setReviewingDoctor(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Clinical Action Notes & Patient Management Plan *
          </label>
          <Input
            value={doctorReviewNotes}
            onChange={(e) => setDoctorReviewNotes(e.target.value)}
            placeholder="e.g. Findings communicated to patient. Dose escalated to Atorvastatin 20mg daily. Repeat lipid panel in 8 weeks."
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
