import { PrintablePathologyReportModal } from '../dialogs/PrintablePathologyReportModal.js';
import React, { useState } from 'react';
import {
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';

export interface InvestigationReportViewProps {
  orders: InvestigationOrderDto[];
  onFinalizeReport: (order: InvestigationOrderDto) => void;
}

export const InvestigationReportView: React.FC<InvestigationReportViewProps> = ({
  orders,
  onFinalizeReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders.find((o) => o.report)?.id || orders[0]?.id || ''
  );

  const ordersWithReports = orders.filter((o) => o.report || o.status === 'VERIFIED' || o.status === 'REVIEWED');

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || ordersWithReports[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
          📄 Diagnostic Reports & Document Management
        </h3>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem' }}>
          Official signed pathology and diagnostic investigation reports ready for EMR clinical integration and distribution.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
        {/* Left list of diagnostic reports */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.875rem', color: '#F8FAFC' }}>Published Reports ({ordersWithReports.length})</strong>
          </div>
          <div style={{ padding: '12px' }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search reports..."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '520px', overflowY: 'auto' }}>
            {ordersWithReports.map((ord) => {
              const isSelected = ord.id === selectedOrderId;
              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #06B6D4' : '3px solid transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                      {ord.investigationName}
                    </span>
                    <Badge variant={ord.report ? 'success' : 'warning'}>
                      {ord.report ? 'Final Report' : 'Draft'}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                    Patient: <strong style={{ color: '#F8FAFC' }}>{ord.patientName}</strong> · MRN: {ord.patientMrn}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                    {ord.report?.reportNumber || ord.orderNumber}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right report detail document sheet */}
        {selectedOrder ? (
          <div style={{ backgroundColor: '#0B132B', border: '1.5px solid rgba(6, 182, 212, 0.3)', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  APEX MULTI-SPECIALTY CLINICS · DEPARTMENT OF LABORATORY MEDICINE
                </div>
                <h3 style={{ margin: '4px 0 2px', fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                  {selectedOrder.report?.reportTitle || `Diagnostic Report: ${selectedOrder.investigationName}`}
                </h3>
                <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Report #: {selectedOrder.report?.reportNumber || 'DRAFT-IN-PROGRESS'} · Version {selectedOrder.report?.reportVersion || 1}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {!selectedOrder.report && (
                  <Button size="sm" variant="primary" onClick={() => onFinalizeReport(selectedOrder)}>
                    📄 Generate Final Report
                  </Button>
                )}
                <Button size="sm" variant="primary" onClick={() => setIsPrintModalOpen(true)} style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 900 }}>
                  🖨️ Print NABL Report / WhatsApp PDF
                </Button>
              </div>
            </div>

            {/* Patient & Order Demographics Box (Dark Card with High Contrast) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '0.8125rem',
              color: '#F8FAFC'
            }}>
              <div>
                <div><span style={{ color: '#94A3B8' }}>Patient:</span> <strong style={{ color: '#F8FAFC' }}>{selectedOrder.patientName}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>MRN:</span> <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{selectedOrder.patientMrn}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>DOB/Gender:</span> <strong style={{ color: '#F8FAFC' }}>{selectedOrder.patientDob || '1984-05-12'} ({selectedOrder.patientGender || 'FEMALE'})</strong></div>
              </div>
              <div>
                <div><span style={{ color: '#94A3B8' }}>Order #:</span> <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>{selectedOrder.orderNumber}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>Encounter #:</span> <strong style={{ color: '#F8FAFC' }}>{selectedOrder.encounterNumber}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>Ordering Doctor:</span> <strong style={{ color: '#A7F3D0' }}>{selectedOrder.orderingDoctorName}</strong></div>
              </div>
              <div>
                <div><span style={{ color: '#94A3B8' }}>Specimen Matrix:</span> <strong style={{ color: '#F8FAFC' }}>{selectedOrder.specimenType}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>Ordered At:</span> <strong style={{ color: '#CBD5E1' }}>{new Date(selectedOrder.orderedAt).toLocaleDateString()}</strong></div>
                <div style={{ marginTop: '2px' }}><span style={{ color: '#94A3B8' }}>Finalized At:</span> <strong style={{ color: '#38BDF8' }}>{selectedOrder.report?.finalizedAt ? new Date(selectedOrder.report.finalizedAt).toLocaleString() : 'Pending'}</strong></div>
              </div>
            </div>

            {/* Results Table */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC' }}>
                Analytic Assay Findings
              </h4>
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', color: '#CBD5E1' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 14px' }}>Analyte</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px' }}>Observed Result</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px' }}>Reference Range</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px' }}>Clinical Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.results.map((r) => (
                      <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#F8FAFC' }}>{r.parameterName}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8', fontSize: '0.875rem' }}>
                          {r.resultValue} {r.unit ?? ''}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{r.referenceRange || 'N/A'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {r.abnormalFlag === 'NORMAL' && <Badge variant="success">Normal</Badge>}
                          {r.abnormalFlag === 'HIGH' && <Badge variant="warning">High</Badge>}
                          {r.abnormalFlag === 'LOW' && <Badge variant="warning">Low</Badge>}
                          {r.abnormalFlag === 'ABNORMAL' && <Badge variant="warning">Abnormal</Badge>}
                          {(r.abnormalFlag === 'CRITICAL_HIGH' || r.abnormalFlag === 'CRITICAL_LOW') && (
                            <Badge variant="danger">🚨 {r.abnormalFlag}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pathologist Impression & Clinical Recommendations (High Contrast Dark Box) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '14px 16px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Pathological Impression & Interpretation
                </div>
                <div style={{ fontSize: '0.875rem', color: '#F8FAFC', lineHeight: 1.4 }}>
                  {selectedOrder.report?.impression || 'Awaiting formal diagnostic impression from verifying pathologist.'}
                </div>
              </div>

              {selectedOrder.report?.recommendations && (
                <div style={{ padding: '14px 16px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Recommendations & Follow-up Guidance
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#F8FAFC', lineHeight: 1.4 }}>
                    {selectedOrder.report.recommendations}
                  </div>
                </div>
              )}
            </div>

            {/* Electronic Signatures Footer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ color: '#94A3B8' }}>Verifying Pathologist / Lab Director:</div>
                <div style={{ fontWeight: 800, color: '#10B981', marginTop: '3px' }}>
                  ✓ {selectedOrder.report?.verifyingPathologist || 'Dr. Marcus Vance, MD'}
                </div>
              </div>
              <div>
                <div style={{ color: '#94A3B8' }}>Attending Physician Review:</div>
                <div style={{ fontWeight: 700, marginTop: '3px' }}>
                  {selectedOrder.report?.reviewedByDoctorAt ? (
                    <span style={{ color: '#38BDF8' }}>
                      ✓ Reviewed by {selectedOrder.report.reviewingDoctor}
                    </span>
                  ) : (
                    <span style={{ color: '#F59E0B' }}>
                      Pending Attending Physician Review
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
            Select a diagnostic report from the left panel to inspect the document dossier.
          </div>
        )}
      </div>

      {selectedOrder && (
        <PrintablePathologyReportModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          order={selectedOrder}
        />
      )}
    </div>
  );
};
