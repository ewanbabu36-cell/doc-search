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

export interface SpecimenCollectionViewProps {
  orders: InvestigationOrderDto[];
  onCollectSpecimen: (order: InvestigationOrderDto) => void;
  onRejectSpecimen: (order: InvestigationOrderDto) => void;
}

export const SpecimenCollectionView: React.FC<SpecimenCollectionViewProps> = ({
  orders,
  onCollectSpecimen,
  onRejectSpecimen
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const collectionQueue = orders.filter(
    (o) => o.status === 'SAMPLE_REQUIRED' || o.status === 'ORDERED' || o.status === 'PROCESSING'
  );

  const filtered = collectionQueue.filter((ord) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.patientName.toLowerCase().includes(q) ||
        ord.patientMrn.toLowerCase().includes(q) ||
        ord.investigationName.toLowerCase().includes(q) ||
        ord.specimens.some((s) => s.accessionNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
            🩸 Phlebotomy & Specimen Collection Station
          </h3>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Operational specimen draw queue, barcode accession generation, and pre-analytical rejection controls.
          </p>
        </div>
      </div>

      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Filter collection queue by patient, accession #, MRN, or test..."
      />

      <Card title={`Active Specimen Queue (${filtered.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Investigation / Test</TableHead>
                <TableHead>Required Specimen</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Collection Status</TableHead>
                <TableHead>Phlebotomy Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ds-color-text-muted)' }}>
                    No pending specimen collections in queue.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ord) => {
                  const hasCollectedSpecimen = ord.specimens.length > 0 && ord.specimens.some((s) => !s.rejectionStatus);
                  const activeSpecimen = ord.specimens[0];

                  return (
                    <TableRow key={ord.id}>
                      <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ord.orderNumber}</TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600 }}>{ord.patientName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                          MRN: {ord.patientMrn} · DOB: {ord.patientDob || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600 }}>{ord.investigationName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                          {ord.investigationCategory}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div><strong>{ord.specimenType}</strong></div>
                        {ord.fastingConfirmed && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-success-text, #16a34a)' }}>
                            ✓ Fasting Confirmed
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {ord.priority === 'STAT' || ord.priority === 'EMERGENCY' ? (
                          <Badge variant="danger">🚨 {ord.priority}</Badge>
                        ) : (
                          <Badge variant="neutral">{ord.priority}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasCollectedSpecimen ? (
                          <div>
                            <Badge variant="success">Collected & Accessioned</Badge>
                            {activeSpecimen && (
                              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '2px' }}>
                                {activeSpecimen.accessionNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="warning">Sample Required</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!hasCollectedSpecimen ? (
                            <Button size="sm" variant="primary" onClick={() => onCollectSpecimen(ord)}>
                              🩸 Collect Specimen
                            </Button>
                          ) : (
                            <Button size="sm" variant="danger" onClick={() => onRejectSpecimen(ord)}>
                              ⚠️ Reject Specimen
                            </Button>
                          )}
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
  );
};
