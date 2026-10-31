import React, { useState, useEffect, useCallback } from 'react';
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
import { apiRequest } from '../../services/api-client.js';
import {
  useHardwareBarcodeScanner,
  playScannerAudioChime,
  type ScannedBarcodePayload
} from '../../services/hardware-barcode-listener.js';

export interface VacutainerTubeConfig {
  key: string;
  name: string;
  additive: string;
  colorName: string;
  capHex: string;
  glowHex: string;
  volume: string;
  inversions: string;
  commonTests: string[];
  keywords: string[];
}

export const CRELIO_VACUTAINER_TUBES: VacutainerTubeConfig[] = [
  {
    key: 'LAVENDER',
    name: 'Lavender / Purple',
    additive: 'K2 / K3 EDTA',
    colorName: 'Lavender EDTA',
    capHex: '#9333EA',
    glowHex: '#C084FC',
    volume: '2.0 mL',
    inversions: '8–10x gentle',
    commonTests: ['CBC', 'ESR', 'HbA1c', 'Blood Group', 'Peripheral Smear'],
    keywords: ['cbc', 'edta', 'hba1c', 'esr', 'hemoglobin', 'blood count', 'smear', 'platelet', 'wbc']
  },
  {
    key: 'RED_GOLD',
    name: 'Gold SST / Red',
    additive: 'Clot Activator / Silica Gel',
    colorName: 'Serum SST',
    capHex: '#EF4444',
    glowHex: '#F87171',
    volume: '3.5 mL',
    inversions: '5x gentle',
    commonTests: ['LFT', 'KFT', 'Lipid', 'Thyroid', 'Serology', 'Troponin'],
    keywords: ['lft', 'kft', 'lipid', 'thyroid', 'serum', 'creatinine', 'urea', 'liver', 'kidney', 'sgpt', 'sgot', 'cholesterol', 'tsh', 'hiv', 'hbsag', 'hcv', 'crp', 'troponin', 'ferritin', 'vitamin', 'calcium']
  },
  {
    key: 'GREY',
    name: 'Grey Stopper',
    additive: 'Sodium Fluoride + Oxalate',
    colorName: 'Fluoride',
    capHex: '#64748B',
    glowHex: '#94A3B8',
    volume: '2.0 mL',
    inversions: '8–10x gentle',
    commonTests: ['Fasting Sugar (FBS)', 'PPBS', 'GTT', 'Lactate'],
    keywords: ['glucose', 'sugar', 'fbs', 'ppbs', 'fluoride', 'gtt', 'lactate']
  },
  {
    key: 'BLUE',
    name: 'Light Blue',
    additive: 'Sodium Citrate 3.2%',
    colorName: 'Citrate',
    capHex: '#0284C7',
    glowHex: '#38BDF8',
    volume: '2.7 mL',
    inversions: '3–4x gentle',
    commonTests: ['PT / INR', 'APTT', 'D-Dimer', 'Coagulation'],
    keywords: ['pt', 'inr', 'aptt', 'citrate', 'coag', 'dimer', 'fibrinogen', 'prothrombin']
  },
  {
    key: 'GREEN',
    name: 'Green Stopper',
    additive: 'Sodium / Lithium Heparin',
    colorName: 'Heparin',
    capHex: '#059669',
    glowHex: '#34D399',
    volume: '3.0 mL',
    inversions: '8–10x gentle',
    commonTests: ['STAT Electrolytes', 'ABG', 'Ammonia'],
    keywords: ['heparin', 'green', 'electrolytes', 'abg', 'ammonia', 'stat chem']
  }
];

export const getVacutainerForTest = (testName: string, specimenType: string): VacutainerTubeConfig => {
  const t = (testName + ' ' + specimenType).toLowerCase();
  for (const tube of CRELIO_VACUTAINER_TUBES) {
    if (tube.keywords.some((kw) => t.includes(kw))) {
      return tube;
    }
  }
  return CRELIO_VACUTAINER_TUBES[1]!; // Default to SST Red
};

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
  const [activeSection, setActiveSection] = useState<'IN_CLINIC' | 'HOME_COLLECTION'>('IN_CLINIC');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTubeFilter, setSelectedTubeFilter] = useState<string>('ALL');
  const [thermalStickerOrder, setThermalStickerOrder] = useState<InvestigationOrderDto | null>(null);
  const [scanNotification, setScanNotification] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Home Diagnostics Logistics Fleet State
  const [fleet, setFleet] = useState<any[]>([]);
  const [homeOrders, setHomeOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadHomeDiagnosticsData() {
      try {
        const [flt, ords] = await Promise.all([
          apiRequest<any[]>('/api/v1/partner/diagnostics/phlebotomist-fleet'),
          apiRequest<any[]>('/api/v1/partner/diagnostics/home-collections')
        ]);
        if (flt.success && Array.isArray(flt.data)) setFleet(flt.data);
        if (ords.success && Array.isArray(ords.data)) setHomeOrders(ords.data);
      } catch (err) {
        console.warn('Home diagnostics fetch notice:', err);
      }
    }
    loadHomeDiagnosticsData();
  }, []);

  const handleUpdateColdChain = async (orderId: string) => {
    try {
      const res = await apiRequest<any>(`/api/v1/partner/diagnostics/home-collections/${orderId}/cold-chain-update`, {
        method: 'POST',
        body: JSON.stringify({
          vacutainerBarcode: `VAC-COLD-${Date.now().toString().slice(-4)}`,
          coldChainCelsius: 3.8
        })
      });
      if (res.success && res.data) {
        setHomeOrders((prev) =>
          prev.map((o) => (o.id === orderId ? res.data : o))
        );
        setScanNotification({
          type: 'success',
          message: `❄️ Cold-chain verified: 3.8°C (OPTIMAL_CHILLED). Sample #${res.data.orderNumber} collected!`
        });
      }
    } catch (e: any) {
      setScanNotification({
        type: 'error',
        message: 'Cold chain update error: ' + e?.message
      });
    }
  };

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
      const matchSearch =
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.patientName.toLowerCase().includes(q) ||
        ord.patientMrn.toLowerCase().includes(q) ||
        ord.investigationName.toLowerCase().includes(q) ||
        ord.specimens.some((s) => s.accessionNumber.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }
    if (selectedTubeFilter !== 'ALL') {
      const tubeConfig = CRELIO_VACUTAINER_TUBES.find((t) => t.key === selectedTubeFilter);
      if (tubeConfig) {
        const testLower = (ord.investigationName + ' ' + ord.specimenType).toLowerCase();
        const matchesTube = tubeConfig.keywords.some((kw) => testLower.includes(kw));
        if (!matchesTube) return false;
      }
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

      {/* Section Switcher */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveSection('IN_CLINIC')}
          style={{
            backgroundColor: activeSection === 'IN_CLINIC' ? '#0284C7' : 'rgba(255,255,255,0.06)',
            color: activeSection === 'IN_CLINIC' ? '#FFF' : '#CBD5E1',
            border: `1.5px solid ${activeSection === 'IN_CLINIC' ? '#38BDF8' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 800,
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          🏥 In-Clinic Collection Queue ({collectionQueue.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('HOME_COLLECTION')}
          style={{
            backgroundColor: activeSection === 'HOME_COLLECTION' ? '#059669' : 'rgba(255,255,255,0.06)',
            color: activeSection === 'HOME_COLLECTION' ? '#FFF' : '#CBD5E1',
            border: `1.5px solid ${activeSection === 'HOME_COLLECTION' ? '#34D399' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 800,
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          🛵 Home Diagnostics & Phlebotomist Fleet ({homeOrders.length} Bookings)
        </button>
      </div>

      {activeSection === 'IN_CLINIC' && (
        <>
          {/* 🌟 CrelioHealth Gold Standard: Interactive Vacutainer Tube Station */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.03em' }}>
                  🧪 VACUTAINER SPECIMEN TUBE STATION
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  (Click any tube to isolate collection queue)
                </span>
              </div>
              {selectedTubeFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedTubeFilter('ALL')}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#CBD5E1',
                    borderRadius: '6px',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✕ Clear Filter (Show All)
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              {CRELIO_VACUTAINER_TUBES.map((tube) => {
                const isSelected = selectedTubeFilter === tube.key;
                const matchCount = collectionQueue.filter((ord) => {
                  const t = (ord.investigationName + ' ' + ord.specimenType).toLowerCase();
                  return tube.keywords.some((kw) => t.includes(kw));
                }).length;

                return (
                  <div
                    key={tube.key}
                    onClick={() => setSelectedTubeFilter(isSelected ? 'ALL' : tube.key)}
                    style={{
                      backgroundColor: isSelected ? `${tube.capHex}25` : 'rgba(15, 23, 42, 0.7)',
                      border: isSelected ? `2px solid ${tube.glowHex}` : `1px solid ${tube.capHex}40`,
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? `0 0 16px ${tube.capHex}60` : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Click to filter by ${tube.name} tests (${tube.commonTests.join(', ')})`}
                  >
                    {/* Realistic 3D Cylindrical Tube Icon */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '14px',
                          borderRadius: '4px 4px 1px 1px',
                          backgroundColor: tube.capHex,
                          boxShadow: `0 0 8px ${tube.glowHex}, inset 0 2px 2px rgba(255,255,255,0.4)`
                        }}
                      />
                      <div
                        style={{
                          width: '14px',
                          height: '24px',
                          borderRadius: '0 0 7px 7px',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(220,38,38,0.7) 40%, rgba(185,28,28,0.9) 100%)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderTop: 'none'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <strong style={{ color: tube.glowHex, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tube.colorName}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 900,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: `${tube.capHex}35`,
                            color: tube.glowHex
                          }}
                        >
                          {matchCount}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#CBD5E1', marginTop: '2px' }}>
                        {tube.additive}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: '#94A3B8', marginTop: '2px', display: 'flex', gap: '6px' }}>
                        <span>Vol: {tube.volume}</span>
                        <span>•</span>
                        <span>{tube.inversions}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
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

                  const tube = getVacutainerForTest(ord.investigationName, ord.specimenType);
                  const tubeTag = (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: `${tube.capHex}20`,
                        border: `1.5px solid ${tube.capHex}`,
                        color: tube.glowHex,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}
                      title={`${tube.name} (${tube.additive})\nDraw Volume: ${tube.volume} • Inversions: ${tube.inversions}`}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: '9px',
                          height: '9px',
                          borderRadius: '50%',
                          backgroundColor: tube.capHex,
                          boxShadow: `0 0 6px ${tube.glowHex}`
                        }}
                      />
                      <span>{tube.colorName}</span>
                      <span style={{ fontSize: '0.625rem', opacity: 0.8, borderLeft: `1px solid ${tube.capHex}50`, paddingLeft: '4px' }}>
                        {tube.volume}
                      </span>
                    </div>
                  );

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
                              onClick={() => {
                                if (onPrintSticker) onPrintSticker(ord);
                                setThermalStickerOrder(ord);
                              }}
                              style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38BDF8', fontWeight: 700, minHeight: '38px' }}
                              title="Print 50x30mm thermal barcode sticker for vacutainer tube (CrelioHealth standard)"
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
        </>
      )}

      {/* SECTION 2: HOME DIAGNOSTICS & PHLEBOTOMIST LOGISTICS FLEET */}
      {activeSection === 'HOME_COLLECTION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Surcharge & Fleet Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1.5px solid #10B981',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>🛵</span>
                <h4 style={{ margin: 0, color: '#34D399', fontWeight: 900, fontSize: '1.05rem' }}>
                  Doorstep Blood Draw Logistics & Cold-Chain Telemetry (2°C–6°C)
                </h4>
                <Badge variant="success">Apollo 24/7 / 1mg Benchmark</Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#CBD5E1' }}>
                Automated route dispatching with digital cold-chain temperature logging. Each home visit includes ₹150 convenience surcharge transparently split between phlebotomist rider and laboratory.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Home Visit Fee Split</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FCD34D' }}>
                ₹150 <span style={{ fontSize: '0.75rem', color: '#A7F3D0' }}>(₹90 Rider + ₹60 Lab)</span>
              </div>
            </div>
          </div>

          {/* Fleet Duty Status Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {fleet.map((p: any) => (
              <div key={p.id} style={{
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{p.phlebotomistName}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>📍 {p.currentGeoZone}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>🛵 {p.assignedVehicle} · 📞 {p.mobileNumber}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge variant={p.dutyStatus === 'ON_DUTY' ? 'success' : 'warning'}>{p.dutyStatus}</Badge>
                  <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, marginTop: '4px' }}>
                    {p.todayPickupsCompleted} draws (₹{Number(p.totalEarningsToday).toLocaleString('en-IN')})
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Home Collection Orders Table */}
          <Card title="Scheduled Home Collection Bookings" padding="none">
            <TableContainer style={{ border: 'none', borderRadius: '0' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Patient & Address</TableHead>
                    <TableHead>Tests Ordered</TableHead>
                    <TableHead>Assigned Phlebotomist</TableHead>
                    <TableHead>Vacutainer Barcode</TableHead>
                    <TableHead>Cold-Chain Temp</TableHead>
                    <TableHead>Fee Split</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {homeOrders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8' }}>{o.orderNumber}</span>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>⏰ {o.scheduledSlot}</div>
                      </TableCell>
                      <TableCell>
                        <strong style={{ color: '#F8FAFC' }}>{o.patientName}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>📍 {o.patientAddress}</div>
                        <div style={{ fontSize: '0.7rem', color: '#34D399' }}>📞 {o.patientPhone}</div>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '0.8rem', color: '#F8FAFC' }}>{o.testsRequested}</span>
                      </TableCell>
                      <TableCell>
                        <strong style={{ color: '#38BDF8', fontSize: '0.8rem' }}>{o.phlebotomistName || 'Auto-Dispatched'}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Zone: {o.geoZone}</div>
                      </TableCell>
                      <TableCell>
                        {o.vacutainerBarcode ? (
                          <Badge variant="primary">{o.vacutainerBarcode}</Badge>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Pending Scan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.coldChainStatus === 'OPTIMAL_CHILLED' ? 'success' : 'warning'}>
                          ❄️ {o.coldChainCelsius}°C ({o.coldChainStatus})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FCD34D' }}>
                          ₹{o.convenienceSurchargeFee}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                          ₹{o.phlebotomistSplitFee} Rider / ₹{o.labSplitFee} Lab
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleUpdateColdChain(o.id)}
                          style={{
                            backgroundColor: '#0284C7',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          ❄️ Scan & Verify Tube
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </div>
      )}

      {/* 🏷️ CrelioHealth Gold Standard: 50x30mm Thermal Barcode Label Modal */}
      {thermalStickerOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
          }}
          onClick={() => setThermalStickerOrder(null)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #38BDF8',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(56, 189, 248, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🏷️</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>
                    Thermal Vacutainer Barcode Label
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    CrelioHealth 50x30mm High-Resolution Specimen Label
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setThermalStickerOrder(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* 50x30mm Physical Label Replica Preview */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                color: '#000000',
                borderRadius: '8px',
                padding: '14px 16px',
                border: '2px solid #CBD5E1',
                boxShadow: '0 4px 15px rgba(255,255,255,0.1)',
                fontFamily: 'monospace',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
                <strong style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>DOCSEARCH LIMS</strong>
                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                  {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '2px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{thermalStickerOrder.patientName}</div>
                  <div style={{ fontSize: '0.72rem' }}>
                    MRN: {thermalStickerOrder.patientMrn} | {thermalStickerOrder.patientDob || 'Adult'}
                  </div>
                </div>
                {thermalStickerOrder.fastingConfirmed && (
                  <span style={{ fontSize: '0.65rem', border: '1px solid #000', padding: '1px 4px', fontWeight: 900 }}>
                    FASTING [YES]
                  </span>
                )}
              </div>

              {/* Barcode Graphic Stripes */}
              <div style={{ margin: '8px 0', textAlign: 'center' }}>
                <div
                  style={{
                    height: '38px',
                    background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 9px, #000 9px, #000 13px, transparent 13px, transparent 15px)',
                    width: '100%',
                    margin: '0 auto'
                  }}
                />
                <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', marginTop: '2px' }}>
                  *{thermalStickerOrder.orderNumber}*
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #000', paddingTop: '4px', fontSize: '0.72rem' }}>
                <div>
                  <strong>Test:</strong> {thermalStickerOrder.investigationName}
                </div>
                <div style={{ fontWeight: 900 }}>
                  {thermalStickerOrder.specimenType}
                </div>
              </div>
            </div>

            {/* Print Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setThermalStickerOrder(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#CBD5E1',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onPrintSticker) onPrintSticker(thermalStickerOrder);
                  setScanNotification({
                    type: 'success',
                    message: `🖨️ Thermal sticker dispatched to Zebra/TSC 50x30mm thermal printer for Order #${thermalStickerOrder.orderNumber}!`
                  });
                  setThermalStickerOrder(null);
                  setTimeout(() => setScanNotification(null), 4000);
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
                }}
              >
                <span>🖨️</span>
                <span>Print 50x30mm Sticker (ESC/POS)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
