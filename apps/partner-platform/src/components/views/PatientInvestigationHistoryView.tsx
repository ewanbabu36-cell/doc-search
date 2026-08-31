import React, { useState } from 'react';
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

export interface PatientInvestigationHistoryViewProps {
  orders: InvestigationOrderDto[];
  onSelectOrder: (orderId: string) => void;
}

export const PatientInvestigationHistoryView: React.FC<PatientInvestigationHistoryViewProps> = ({
  orders,
  onSelectOrder
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    orders[0]?.patientId || '55555555-1111-4555-8555-111111111101'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Group unique patients
  const patientMap = new Map<string, { id: string; name: string; mrn: string; dob?: string | undefined }>();
  orders.forEach((o) => {
    if (!patientMap.has(o.patientId)) {
      patientMap.set(o.patientId, {
        id: o.patientId,
        name: o.patientName,
        mrn: o.patientMrn,
        dob: o.patientDob
      });
    }
  });
  const patients = Array.from(patientMap.values());

  const patientOrders = orders.filter((o) => o.patientId === selectedPatientId);
  const selectedPatient = patientMap.get(selectedPatientId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
          🕰️ Longitudinal Patient Diagnostic & Investigation History
        </h3>
        <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
          Historical laboratory and diagnostic timeline connecting previous encounters, historical analyte trends, and past pathology findings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px', alignItems: 'start' }}>
        {/* Left patient selector list */}
        <Card title={`Patients (${patients.length})`} padding="none">
          <div style={{ padding: '12px' }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient / MRN..."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {patients.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ds-color-border-subtle, #e2e8f0)',
                  cursor: 'pointer',
                  backgroundColor: p.id === selectedPatientId ? 'var(--ds-color-bg-subtle, #f1f5f9)' : 'transparent',
                  borderLeft: p.id === selectedPatientId ? '3px solid var(--ds-color-primary, #2563eb)' : '3px solid transparent'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                  MRN: {p.mrn}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right timeline and records */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedPatient && (
            <Card padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '1.125rem', fontWeight: 700 }}>
                    {selectedPatient.name}
                  </h4>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                    Master Patient Index (MRN): <strong>{selectedPatient.mrn}</strong> · DOB: {selectedPatient.dob || '1984-05-12'}
                  </div>
                </div>
                <Badge variant="primary">
                  {patientOrders.length} Diagnostic Orders On File
                </Badge>
              </div>
            </Card>
          )}

          <Card title={`Investigation History (${patientOrders.length})`} padding="none">
            <TableContainer style={{ border: 'none', borderRadius: '0' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Investigation / Test</TableHead>
                    <TableHead>Ordering Doctor</TableHead>
                    <TableHead>Results & Summary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ds-color-text-muted)' }}>
                        No historical investigation orders found for this patient.
                      </TableCell>
                    </TableRow>
                  ) : (
                    patientOrders.map((ord) => (
                      <TableRow key={ord.id}>
                        <TableCell style={{ fontSize: '0.8125rem' }}>
                          {new Date(ord.orderedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {ord.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 600 }}>{ord.investigationName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                            {ord.investigationCategory}
                          </div>
                        </TableCell>
                        <TableCell>{ord.orderingDoctorName}</TableCell>
                        <TableCell>
                          {ord.results.length > 0 ? (
                            <div style={{ fontSize: '0.8125rem', maxWidth: '240px' }}>
                              {ord.results.slice(0, 2).map((r) => `${r.parameterName}: ${r.resultValue}`).join(', ')}
                              {ord.results.length > 2 ? ` (+${ord.results.length - 2} more)` : ''}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                              Pending Result
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {ord.isCritical && <Badge variant="danger">🚨 CRITICAL</Badge>}
                          {!ord.isCritical && ord.isAbnormal && <Badge variant="warning">⚠️ Abnormal</Badge>}
                          {!ord.isCritical && !ord.isAbnormal && <Badge variant="success">{ord.status}</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => onSelectOrder(ord.id)}>
                            Inspect Record
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};
