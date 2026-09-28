import React, { useState, useCallback } from 'react';
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
import {
  useHardwareBarcodeScanner,
  playScannerAudioChime,
  type ScannedBarcodePayload
} from '../../services/hardware-barcode-listener.js';

export interface SpecimenCollectionViewProps {
  orders: InvestigationOrderDto[];
  onCollectSpecimen: (order: InvestigationOrderDto) => void;
  onRejectSpecimen: (order: InvestigationOrderDto) => void;
  onPrintSticker?: (order: InvestigationOrderDto) => void;
}

export const SpecimenCollectionView: React.FC<SpecimenCollectionViewProps> = ({
  orders,
  onCollectSpecimen,
  onRejectSpecimen,
  onPrintSticker
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scanNotification, setScanNotification] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const collectionQueue = orders.filter(
    (o) => o.status === 'SAMPLE_REQUIRED' || o.status === 'ORDERED' || o.status === 'PROCESSING'
  );

  // Hardware Barcode Scanner Listener for instant vacutainer collection (DS-HW-902)
  const handleBarcodeScan = useCallback(
    (scan: ScannedBarcodePayload) => {
      const rawTarget = scan.raw.trim().toLowerCase();
      const accTarget = (scan.accessionNumber || scan.raw).trim().toLowerCase();
      const mrnTarget = (scan.mrnOrToken || scan.raw).trim().toLowerCase();

      // Find matching order in active collection queue
      const match = collectionQueue.find((ord) => {
        if (ord.orderNumber.toLowerCase() === rawTarget) return true;
        if (ord.id.toLowerCase() === rawTarget) return true;
        if (ord.patientMrn.toLowerCase() === mrnTarget) return true;
        if (
          ord.specimens.some(
            (s) =>
              s.accessionNumber.toLowerCase() === accTarget ||
              s.accessionNumber.toLowerCase() === rawTarget
          )
        ) {
          return true;
        }
        return false;
      });

      if (match) {
        const alreadyCollected =
          match.specimens.length > 0 && match.specimens.some((s) => !s.rejectionStatus);
        if (alreadyCollected) {
          setScanNotification({
            type: 'warning',
            message: `⚠️ Specimen for Order #${match.orderNumber} (${match.patientName}) is already marked COLLECTED.`
          });
          playScannerAudioChime('warning');
        } else {
          onCollectSpecimen(match);
          setScanNotification({
            type: 'success',
            message: `⚡ Hardware Scanned: Vacutainer marked COLLECTED for Order #${match.orderNumber} (${match.patientName} — ${match.investigationName})!`
          });
          playScannerAudioChime('success');
        }
      } else {
        setScanNotification({
          type: 'error',
          message: `⚠️ Barcode [${scan.raw}] not found in pending specimen queue.`
        });
        playScannerAudioChime('error');
      }

      setTimeout(() => setScanNotification(null), 4500);
    },
    [collectionQueue, onCollectSpecimen]
  );

  useHardwareBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: true
  });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
            🩸 Phlebotomy & Specimen Collection Station
          </h3>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Operational specimen draw queue, barcode accession generation, and pre-analytical rejection controls.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '6px 14px',
            color: '#34D399',
            fontSize: '0.8rem',
            fontWeight: 700,
            userSelect: 'none'
          }}
          title="Hardware Barcode scanner listener is active. Scanning vacutainer tube barcode automatically collects specimen."
        >
          <span>⚡</span>
          <span>Scanner Armed: Scan Vacutainer Barcode to Auto-Collect</span>
        </div>
      </div>

      {scanNotification && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor:
              scanNotification.type === 'success'
                ? 'rgba(16, 185, 129, 0.15)'
                : scanNotification.type === 'error'
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
            color:
              scanNotification.type === 'success'
                ? '#34D399'
                : scanNotification.type === 'error'
                ? '#F87171'
                : '#FBBF24',
            border:
              scanNotification.type === 'success'
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : scanNotification.type === 'error'
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : '1px solid rgba(245, 158, 11, 0.4)',
            fontSize: '0.875rem',
            fontWeight: 700
          }}
        >
          {scanNotification.message}
        </div>
      )}

      {/* Visual Vacuum Tube Color Reference Guide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
        <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', border: '1.5px solid #A855F7', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>💜</span>
          <div>
            <strong style={{ color: '#C084FC', fontSize: '0.8125rem', display: 'block' }}>Lavender (K2/K3 EDTA)</strong>
            <span style={{ fontSize: '0.6875rem', color: '#E9D5FF' }}>CBC, ESR, HbA1c, Blood Group</span>
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1.5px solid #EF4444', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🔴</span>
          <div>
            <strong style={{ color: '#F87171', fontSize: '0.8125rem', display: 'block' }}>Gold SST / Red (Serum)</strong>
            <span style={{ fontSize: '0.6875rem', color: '#FECACA' }}>LFT, KFT, Lipid, Thyroid, Serology</span>
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(148, 163, 184, 0.12)', border: '1.5px solid #94A3B8', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>⚪</span>
          <div>
            <strong style={{ color: '#CBD5E1', fontSize: '0.8125rem', display: 'block' }}>Grey (Sodium Fluoride)</strong>
            <span style={{ fontSize: '0.6875rem', color: '#E2E8F0' }}>Fasting Blood Sugar, PPBS, GTT</span>
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1.5px solid #38BDF8', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🔵</span>
          <div>
            <strong style={{ color: '#38BDF8', fontSize: '0.8125rem', display: 'block' }}>Light Blue (Citrate 3.2%)</strong>
            <span style={{ fontSize: '0.6875rem', color: '#BAE6FD' }}>PT/INR, APTT, D-Dimer, Coag</span>
          </div>
        </div>
      </div>

      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Filter collection queue by patient, accession #, MRN, or scan vacutainer barcode directly..."
      />

      <Card title={`Active Specimen Queue (${filtered.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Investigation / Test</TableHead>
                <TableHead>Required Specimen & Tube</TableHead>
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

                  const testLower = (ord.investigationName + ' ' + ord.specimenType).toLowerCase();
                  let tubeTag = <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700 }}>🔴 SST/Red (Serum)</span>;
                  if (testLower.includes('cbc') || testLower.includes('edta') || testLower.includes('hba1c') || testLower.includes('blood count')) {
                    tubeTag = <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', border: '1px solid #A855F7', color: '#D8B4FE', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700 }}>💜 EDTA (Lavender)</span>;
                  } else if (testLower.includes('glucose') || testLower.includes('sugar') || testLower.includes('ppbs') || testLower.includes('fluoride')) {
                    tubeTag = <span style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)', border: '1px solid #94A3B8', color: '#E2E8F0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700 }}>⚪ Fluoride (Grey)</span>;
                  } else if (testLower.includes('pt') || testLower.includes('inr') || testLower.includes('citrate') || testLower.includes('coag')) {
                    tubeTag = <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38BDF8', color: '#7DD3FC', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700 }}>🔵 Citrate (Blue)</span>;
                  }

                    const isDoctorOpd = Boolean((ord.metadata as any)?.isDoctorOpdOrder);

                    return (
                      <TableRow key={ord.id}>
                        <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          <div>{ord.orderNumber}</div>
                          {isDoctorOpd && (
                            <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', padding: '1px 6px', fontSize: '0.65rem', fontWeight: 800, display: 'inline-block', marginTop: '3px' }}>
                              🩺 OPD Rx ({ord.orderingDoctorName})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 600 }}>{ord.patientName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                            MRN: {ord.patientMrn} · DOB: {ord.patientDob || 'N/A'}
                          </div>
                          {(ord.metadata as any)?.patientPhone && (
                            <div style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 700 }}>
                              📱 {(ord.metadata as any).patientPhone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 600 }}>{ord.investigationName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                            {ord.investigationCategory}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <strong>{ord.specimenType}</strong>
                            {tubeTag}
                            {ord.fastingConfirmed && (
                              <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
                                ✓ Fasting Confirmed
                              </span>
                            )}
                          </div>
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
                                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '2px', color: '#38BDF8' }}>
                                  {activeSpecimen.accessionNumber}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="warning">Sample Required</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onPrintSticker?.(ord)}
                              style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38BDF8', fontWeight: 700, minHeight: '38px' }}
                              title="Print 50x25mm / 50x30mm thermal barcode sticker for vacutainer tube"
                            >
                              🖨️ Sticker
                            </Button>
                            {!hasCollectedSpecimen ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => onCollectSpecimen(ord)}
                                style={{ fontWeight: 800, minHeight: '38px', backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', color: '#FFFFFF' }}
                              >
                                🩸 Collect
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => onRejectSpecimen(ord)}
                                style={{ minHeight: '38px' }}
                              >
                                ⚠️ Reject
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
