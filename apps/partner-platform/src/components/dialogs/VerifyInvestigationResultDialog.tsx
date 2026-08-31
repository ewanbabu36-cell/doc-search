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
  VerifyInvestigationResultRequest
} from '@docsearch/api-contracts';

export interface VerifyInvestigationResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: VerifyInvestigationResultRequest) => Promise<void>;
  order: InvestigationOrderDto | null;
  tenantId: string;
}

export const VerifyInvestigationResultDialog: React.FC<VerifyInvestigationResultDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
  tenantId
}) => {
  const [verifyingPathologist, setVerifyingPathologist] = useState('Dr. Marcus Vance, MD (Clinical Pathologist)');
  const [clinicalImpression, setClinicalImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [justification, setJustification] = useState('Pathologist diagnostic review and electronic verification.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingPathologist.trim()) {
      setError('Verifying pathologist / physician identity is required.');
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
        verifyingPathologist,
        clinicalImpression: clinicalImpression || undefined,
        recommendations: recommendations || undefined,
        actorId: 'dr.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PATHOLOGIST',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to verify investigation results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="✅ Pathologist Result Verification & Sign-Off"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Verifying Results...' : 'Verify & Electronically Sign'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        {order.isCritical && (
          <Alert type="error" title="🚨 CRITICAL VALUE ALERT">
            This investigation contains critical panic values requiring immediate clinical notification.
          </Alert>
        )}

        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(30, 41, 59, 0.85)', color: '#F8FAFC', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '6px', fontSize: '0.875rem' }}>
          <div><strong>Order #:</strong> {order.orderNumber} — {order.investigationName}</div>
          <div><strong>Patient:</strong> {order.patientName} (MRN: {order.patientMrn})</div>
          <div><strong>Clinical Indication:</strong> {order.clinicalIndication}</div>
        </div>

        <div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Results Awaiting Verification ({order.results.length} parameters)
          </span>
          <TableContainer style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Value</TableHead>
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
            Verifying Pathologist / Lab Director *
          </label>
          <Input
            value={verifyingPathologist}
            onChange={(e) => setVerifyingPathologist(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Pathological Impression & Clinical Commentary
          </label>
          <Input
            value={clinicalImpression}
            onChange={(e) => setClinicalImpression(e.target.value)}
            placeholder="e.g. Findings consistent with atherogenic dyslipidemia..."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Diagnostic Recommendations (Optional)
          </label>
          <Input
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            placeholder="e.g. Repeat in 8 weeks, evaluate HbA1c..."
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
