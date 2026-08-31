import React, { useState } from 'react';
import {
  Card,
  Button,
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
  PharmacyReturnDto,
  PharmacyStockAdjustmentDto,
  PharmacySubstitutionRequestDto
} from '@docsearch/api-contracts';

export interface ReturnsAndAdjustmentsViewProps {
  returns: PharmacyReturnDto[];
  adjustments: PharmacyStockAdjustmentDto[];
  substitutions: PharmacySubstitutionRequestDto[];
  onOpenStockAdjustment: () => void;
  onApproveSubstitution: (sub: PharmacySubstitutionRequestDto) => void;
  onRejectSubstitution: (sub: PharmacySubstitutionRequestDto) => void;
}

export const ReturnsAndAdjustmentsView: React.FC<ReturnsAndAdjustmentsViewProps> = ({
  returns,
  adjustments,
  substitutions,
  onOpenStockAdjustment,
  onApproveSubstitution,
  onRejectSubstitution
}) => {
  const [activeSection, setActiveSection] = useState<'SUBSTITUTIONS' | 'RETURNS' | 'ADJUSTMENTS'>('SUBSTITUTIONS');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
            ⚖️ Exceptions, Substitutions & Managed Returns
          </h2>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Clinical substitution approval queues, patient returns workflow, and audited stock discrepancy adjustments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" onClick={onOpenStockAdjustment}>
            ➕ New Stock Adjustment
          </Button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <Button
          variant={activeSection === 'SUBSTITUTIONS' ? 'primary' : 'outline'}
          onClick={() => setActiveSection('SUBSTITUTIONS')}
        >
          🔄 Substitution Requests ({substitutions.filter((s) => s.status === 'PENDING_APPROVAL').length} Pending)
        </Button>
        <Button
          variant={activeSection === 'RETURNS' ? 'primary' : 'outline'}
          onClick={() => setActiveSection('RETURNS')}
        >
          📦 Patient Returns ({returns.length})
        </Button>
        <Button
          variant={activeSection === 'ADJUSTMENTS' ? 'primary' : 'outline'}
          onClick={() => setActiveSection('ADJUSTMENTS')}
        >
          ⚖️ Cycle Count Adjustments ({adjustments.length})
        </Button>
      </div>

      {/* SECTION 1: SUBSTITUTION REQUESTS */}
      {activeSection === 'SUBSTITUTIONS' && (
        <Card padding="lg">
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>
            Medication Substitution Approval Queue
          </h3>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prescription #</TableHead>
                  <TableHead>Original Prescribed</TableHead>
                  <TableHead>Proposed Alternative</TableHead>
                  <TableHead>Substitution Reason & Justification</TableHead>
                  <TableHead>Requesting Pharmacist</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Physician Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {substitutions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>{sub.prescriptionNumber}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{sub.originalMedicationName}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: '#0284c7' }}>{sub.requestedMedicationName}</div>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.85rem' }}>
                      <Badge variant="neutral">{sub.reason}</Badge>
                      <div style={{ marginTop: '4px', color: '#475569' }}>{sub.justification}</div>
                    </TableCell>
                    <TableCell>{sub.pharmacistName}</TableCell>
                    <TableCell>
                      <Badge variant={sub.status === 'APPROVED' ? 'success' : sub.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {sub.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      {sub.status === 'PENDING_APPROVAL' ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <Button variant="primary" onClick={() => onApproveSubstitution(sub)}>
                            Approve
                          </Button>
                          <Button variant="danger" onClick={() => onRejectSubstitution(sub)}>
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Actioned</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* SECTION 2: RETURNS */}
      {activeSection === 'RETURNS' && (
        <Card padding="lg">
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>
            Patient Returns & Restocking Log
          </h3>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medication & Batch</TableHead>
                  <TableHead>Qty Returned</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Disposition</TableHead>
                  <TableHead>Logged At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>{ret.returnNumber}</TableCell>
                    <TableCell>
                      <div>{ret.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ret.patientMrn}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{ret.medicationName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Batch: {ret.batchNumber}</div>
                    </TableCell>
                    <TableCell style={{ fontWeight: 700 }}>{ret.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={ret.condition === 'INTACT_SEALED' ? 'success' : 'danger'}>
                        {ret.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ret.disposition === 'RESTOCK' ? 'primary' : 'warning'}>
                        {ret.disposition}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.85rem' }}>{new Date(ret.occurredAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* SECTION 3: ADJUSTMENTS */}
      {activeSection === 'ADJUSTMENTS' && (
        <Card padding="lg">
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>
            Physical Cycle Count Adjustments
          </h3>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adjustment #</TableHead>
                  <TableHead>Medication & Batch</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Quantity Delta</TableHead>
                  <TableHead>Before → After</TableHead>
                  <TableHead>Justification</TableHead>
                  <TableHead>Adjusted At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>{adj.adjustmentNumber}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{adj.medicationName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Batch: {adj.batchNumber}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{adj.reason}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          fontWeight: 700,
                          color: adj.adjustmentQuantity > 0 ? '#16a34a' : '#dc2626'
                        }}
                      >
                        {adj.adjustmentQuantity > 0 ? `+${adj.adjustmentQuantity}` : adj.adjustmentQuantity}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.85rem' }}>
                      {adj.beforeQuantity} → <strong>{adj.afterQuantity}</strong>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.85rem' }}>{adj.justification}</TableCell>
                    <TableCell style={{ fontSize: '0.85rem' }}>{new Date(adj.occurredAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
