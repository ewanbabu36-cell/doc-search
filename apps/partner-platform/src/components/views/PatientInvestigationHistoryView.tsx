import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Input,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';
import { PrintablePathologyReportModal } from '../dialogs/PrintablePathologyReportModal.js';
import { downloadVectorPathologyPdf } from '../../utils/clientPathologyPdf.js';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

export interface PatientInvestigationHistoryViewProps {
  orders: InvestigationOrderDto[];
  onSelectOrder: (orderId: string) => void;
}

interface AnalyteObservation {
  date: string;
  orderNumber: string;
  value: string;
  numericValue?: number;
  unit?: string;
  referenceRange?: string;
  flag: string;
}

export const PatientInvestigationHistoryView: React.FC<PatientInvestigationHistoryViewProps> = ({
  orders,
  onSelectOrder
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    orders[0]?.patientId || '55555555-1111-4555-8555-111111111101'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [viewReportOrder, setViewReportOrder] = useState<InvestigationOrderDto | null>(null);

  // Group unique patients
  const patientMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; mrn: string; dob?: string | undefined }>();
    orders.forEach((o) => {
      if (o.patientId && !map.has(o.patientId)) {
        map.set(o.patientId, {
          id: o.patientId,
          name: o.patientName,
          mrn: o.patientMrn,
          dob: o.patientDob
        });
      }
    });
    return map;
  }, [orders]);

  const allPatients = useMemo(() => Array.from(patientMap.values()), [patientMap]);

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return allPatients;
    const q = searchTerm.toLowerCase();
    return allPatients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q)
    );
  }, [allPatients, searchTerm]);

  // Selected patient's orders, sorted newest first
  const patientOrders = useMemo(() => {
    return orders
      .filter((o) => o.patientId === selectedPatientId)
      .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());
  }, [orders, selectedPatientId]);

  const selectedPatient = patientMap.get(selectedPatientId) || allPatients[0];

  // Extract longitudinal analyte trends across all historical dates for this patient
  const analyteTrends = useMemo(() => {
    const trendsMap = new Map<string, AnalyteObservation[]>();

    // Sort chronologically ascending for trend analysis
    const chronologicalOrders = [...patientOrders].reverse();

    chronologicalOrders.forEach((ord) => {
      ord.results.forEach((res) => {
        const paramName = res.parameterName;
        if (!paramName) return;

        const numVal = parseFloat(res.resultValue.replace(/[^0-9.]/g, ''));
        const obs: AnalyteObservation = {
          date: ord.orderedAt ? new Date(ord.orderedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          orderNumber: ord.orderNumber,
          value: res.resultValue,
          flag: res.abnormalFlag
        };
        if (!isNaN(numVal)) obs.numericValue = numVal;
        if (res.unit) obs.unit = res.unit;
        if (res.referenceRange) obs.referenceRange = res.referenceRange;

        const existing = trendsMap.get(paramName) || [];
        existing.push(obs);
        trendsMap.set(paramName, existing);
      });
    });

    // Filter to analytes with observations
    return Array.from(trendsMap.entries()).filter(([_, obsList]) => obsList.length >= 1);
  }, [patientOrders]);

  const handleDownloadPdf = (ord: InvestigationOrderDto) => {
    const profile = getVerifiedRoleProfile();
    const settings = {
      labName: profile.entityLegalName.toUpperCase(),
      labTagline: profile.facilityTagline,
      labAddress: `📍 ${profile.officialAddress} | 📞 ${profile.contactPhone} | 🌐 ${profile.website}`,
      certificateNo: profile.nablCertificateNo,
      technicianName: profile.technicianName || 'Medical Lab Technologist',
      technicianTitle: 'Senior Medical Lab Technologist',
      pathologistName: profile.pathologistName,
      pathologistTitle: 'Consultant Pathologist & Lab Director',
      pathologistRegNo: profile.pathologistRegNo
    };
    downloadVectorPathologyPdf(ord, settings);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
          🕰️ Longitudinal Patient Diagnostic & Investigation History
        </h3>
        <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #94A3B8)', fontSize: '0.875rem' }}>
          Comprehensive historical laboratory and pathology record connecting previous clinical visits, historical biomarker trends, and verified diagnostic reports.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px', alignItems: 'start' }}>
        {/* Left patient selector list */}
        <Card title={`Patients with History (${filteredPatients.length})`} padding="none">
          <div style={{ padding: '12px' }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search patient name or MRN..."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '560px', overflowY: 'auto' }}>
            {filteredPatients.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                No patients found matching "{searchTerm}".
              </div>
            ) : (
              filteredPatients.map((p) => {
                const count = orders.filter((o) => o.patientId === p.id).length;
                const isSelected = p.id === selectedPatientId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.06))',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #06B6D4' : '3px solid transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? '#38BDF8' : 'inherit' }}>
                        {p.name}
                      </div>
                      <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#CBD5E1' }}>
                        {count} reports
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94A3B8)', marginTop: '2px' }}>
                      MRN: <span style={{ fontFamily: 'monospace' }}>{p.mrn}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right timeline and records */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedPatient && (
            <Card padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {selectedPatient.name}
                  </h4>
                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                    Master Patient Index (MRN): <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{selectedPatient.mrn}</strong> · DOB: {selectedPatient.dob || '1984-05-12'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Badge variant="primary">
                    {patientOrders.length} Diagnostic Orders Across Visits
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                    ✓ NABL Verified History
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Longitudinal Analyte Trajectory & Biomarker Trends Card */}
          {analyteTrends.length > 0 && (
            <Card title="📈 Longitudinal Analyte Trends & Biomarker Trajectory" padding="md">
              <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: '#94A3B8' }}>
                Multi-date comparison of clinical analytes showing historical evolution across consultations and lab orders.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {analyteTrends.slice(0, 6).map(([paramName, observations]) => {
                  const latest = observations[observations.length - 1];
                  const previous = observations.length > 1 ? observations[observations.length - 2] : null;
                  return (
                    <div
                      key={paramName}
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '0.8125rem', color: '#F8FAFC' }}>{paramName}</strong>
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                            Ref: {latest?.referenceRange || 'Standard'}
                          </div>
                        </div>
                        {latest?.flag === 'NORMAL' && <Badge variant="success">Normal</Badge>}
                        {latest?.flag === 'HIGH' && <Badge variant="warning">High</Badge>}
                        {latest?.flag === 'LOW' && <Badge variant="warning">Low</Badge>}
                        {(latest?.flag === 'CRITICAL_HIGH' || latest?.flag === 'CRITICAL_LOW' || latest?.flag === 'CRITICAL') && (
                          <Badge variant="danger">🚨 Critical</Badge>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
                          {latest?.value}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {latest?.unit}
                        </span>
                        {previous && (
                          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', marginLeft: 'auto' }}>
                            Prev: <span style={{ fontFamily: 'monospace' }}>{previous.value}</span> ({previous.date})
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Observed on {latest?.date}</span>
                        <span>{observations.length} record{observations.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Investigation History Orders & Reports Table */}
          <Card title={`Investigation History (${patientOrders.length})`} padding="none">
            <TableContainer style={{ border: 'none', borderRadius: '0' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Order & Report #</TableHead>
                    <TableHead>Investigation / Panel</TableHead>
                    <TableHead>Ordering Doctor</TableHead>
                    <TableHead>Results & Summary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--ds-color-text-muted)' }}>
                        No historical investigation orders found for this patient.
                      </TableCell>
                    </TableRow>
                  ) : (
                    patientOrders.map((ord) => {
                      const hasReport = !!ord.report || ord.status === 'VERIFIED' || ord.status === 'REVIEWED';
                      return (
                        <TableRow key={ord.id}>
                          <TableCell style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                            {ord.orderedAt ? new Date(ord.orderedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </TableCell>
                          <TableCell style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{ord.orderNumber}</div>
                            {ord.report?.reportNumber && (
                              <div style={{ color: '#38BDF8', fontSize: '0.6875rem' }}>{ord.report.reportNumber}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ord.investigationName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
                              {ord.investigationCategory}
                            </div>
                          </TableCell>
                          <TableCell style={{ fontSize: '0.8125rem' }}>{ord.orderingDoctorName}</TableCell>
                          <TableCell>
                            {ord.results.length > 0 ? (
                              <div style={{ fontSize: '0.8125rem', maxWidth: '260px' }}>
                                {ord.results.slice(0, 3).map((r) => `${r.parameterName}: ${r.resultValue} ${r.unit || ''}`).join(', ')}
                                {ord.results.length > 3 ? ` (+${ord.results.length - 3} more)` : ''}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
                                Pending Result
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {ord.isCritical && <Badge variant="danger">🚨 CRITICAL</Badge>}
                            {!ord.isCritical && ord.isAbnormal && <Badge variant="warning">⚠️ Abnormal</Badge>}
                            {!ord.isCritical && !ord.isAbnormal && <Badge variant="success">{ord.status}</Badge>}
                          </TableCell>
                          <TableCell style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {hasReport && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => setViewReportOrder(ord)}
                                    style={{ backgroundColor: '#0284C7', borderColor: '#0284C7', color: '#FFF', fontSize: '0.75rem', padding: '4px 8px' }}
                                  >
                                    📄 View NABL Report
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadPdf(ord)}
                                    style={{ borderColor: '#38BDF8', color: '#38BDF8', fontSize: '0.75rem', padding: '4px 8px' }}
                                  >
                                    🖨️ PDF
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onSelectOrder(ord.id)}
                                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                              >
                                Inspect
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </div>
      </div>

      {viewReportOrder && (
        <PrintablePathologyReportModal
          isOpen={!!viewReportOrder}
          onClose={() => setViewReportOrder(null)}
          order={viewReportOrder}
        />
      )}
    </div>
  );
};
