import React, { useState, useEffect, useRef } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface ScannedCartonBatch {
  id: string;
  cartonBarcode: string;
  gtin: string;
  brandName: string;
  medicationCode: string;
  batchNumber: string;
  expiryDate: string;
  unitsPerCarton: number;
  cartonCount: number;
  totalUnits: number;
  mrpPerUnit: number;
  wholesaleCostPerUnit: number;
  scannedAt: string;
}

export interface HighSpeedCameraBoxScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId?: string | undefined;
  purchaseOrderNumber?: string | undefined;
  supplierName?: string | undefined;
  expectedCartonCount?: number | undefined;
  onAutoGrnCommitted: (reconciledCartons: ScannedCartonBatch[], totalUnits: number) => void;
}

const SAMPLE_DEPOT_CARTONS = [
  {
    gtin: '8901112004910',
    brandName: 'Ceftriaxone 1g Injection IP',
    medicationCode: 'sku-pharma-001',
    batchPrefix: 'CEF-26',
    unitsPerCarton: 50,
    mrp: 95,
    wholesaleCost: 32,
    expiry: '2028-06'
  },
  {
    gtin: '8902234001928',
    brandName: 'Paracetamol IV Infusion 100ml',
    medicationCode: 'sku-pharma-002',
    batchPrefix: 'PCM-26',
    unitsPerCarton: 40,
    mrp: 65,
    wholesaleCost: 19,
    expiry: '2027-11'
  },
  {
    gtin: '8903345009182',
    brandName: 'Normal Saline (0.9% NaCl) 500ml',
    medicationCode: 'sku-pharma-003',
    batchPrefix: 'NS-26',
    unitsPerCarton: 24,
    mrp: 45,
    wholesaleCost: 14,
    expiry: '2029-01'
  },
  {
    gtin: '8904456007721',
    brandName: 'CBC Hematology Diluent 20L Reagent',
    medicationCode: 'sku-chem-001',
    batchPrefix: 'DIL-26',
    unitsPerCarton: 2,
    mrp: 3800,
    wholesaleCost: 1450,
    expiry: '2027-04'
  },
  {
    gtin: '8905567003819',
    brandName: 'Dengue NS1 Antigen Rapid Card (Box of 25)',
    medicationCode: 'sku-chem-004',
    batchPrefix: 'DNG-26',
    unitsPerCarton: 25,
    mrp: 3500,
    wholesaleCost: 1250,
    expiry: '2027-08'
  },
  {
    gtin: '8906678002931',
    brandName: 'IV Cannula 20G with Injection Port',
    medicationCode: 'sku-eq-001',
    batchPrefix: 'CAN-26',
    unitsPerCarton: 100,
    mrp: 60,
    wholesaleCost: 18,
    expiry: '2028-10'
  }
];

export const HighSpeedCameraBoxScannerModal: React.FC<HighSpeedCameraBoxScannerModalProps> = ({
  isOpen,
  onClose,
  purchaseOrderId = 'PO-2026-B2B-8841',
  purchaseOrderNumber = 'PO-2026-B2B-8841',
  supplierName = 'DocSearch North C&F Super-Depot (Gurugram)',
  expectedCartonCount = 12,
  onAutoGrnCommitted
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedCartons, setScannedCartons] = useState<ScannedCartonBatch[]>([]);
  const [lastScannedItem, setLastScannedItem] = useState<ScannedCartonBatch | null>(null);
  const [isLaserSweeping, setIsLaserSweeping] = useState(false);
  const [isCommittingGrn, setIsCommittingGrn] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API for industrial scanner chime
  const playScannerBeep = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (audioCtxRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1450, audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.08);
      }
    } catch {}

    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([45]);
      } catch {}
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError('Camera API not accessible in this environment. Manual rapid-scanner simulator active.');
        setCameraActive(false);
      }
    } catch (err: any) {
      setCameraError('Camera access permission denied or unavailable. High-speed rapid simulator active.');
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Process barcode ingestion
  const handleIngestCarton = (cartonSample: typeof SAMPLE_DEPOT_CARTONS[0]) => {
    playScannerBeep();
    setIsLaserSweeping(true);
    setTimeout(() => setIsLaserSweeping(false), 500);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const batchNumber = `${cartonSample.batchPrefix}-${randomSuffix}`;
    const cartonBarcode = `(01)${cartonSample.gtin}(10)${batchNumber}(17)${cartonSample.expiry.replace('-', '')}(30)${cartonSample.unitsPerCarton}`;

    setScannedCartons((prev) => {
      // Check if carton for this item exists
      const existingIdx = prev.findIndex((p) => p.medicationCode === cartonSample.medicationCode);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx]!;
        const newCartonCount = existing.cartonCount + 1;
        const newTotalUnits = newCartonCount * existing.unitsPerCarton;
        const refreshed = {
          ...existing,
          cartonCount: newCartonCount,
          totalUnits: newTotalUnits,
          scannedAt: 'Just now'
        };
        updated[existingIdx] = refreshed;
        setLastScannedItem(refreshed);
        return updated;
      } else {
        const newEntry: ScannedCartonBatch = {
          id: `carton-${Date.now()}-${prev.length + 1}`,
          cartonBarcode,
          gtin: cartonSample.gtin,
          brandName: cartonSample.brandName,
          medicationCode: cartonSample.medicationCode,
          batchNumber,
          expiryDate: cartonSample.expiry,
          unitsPerCarton: cartonSample.unitsPerCarton,
          cartonCount: 1,
          totalUnits: cartonSample.unitsPerCarton,
          mrpPerUnit: cartonSample.mrp,
          wholesaleCostPerUnit: cartonSample.wholesaleCost,
          scannedAt: 'Just now'
        };
        setLastScannedItem(newEntry);
        return [newEntry, ...prev];
      }
    });

    setToastMessage(`Scanned: 1 Box of ${cartonSample.brandName} (${cartonSample.unitsPerCarton} units)`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Quick Rapid-Fire Scan All Remaining Cartons
  const handleRapidScanAll = () => {
    playScannerBeep();
    setIsLaserSweeping(true);
    setTimeout(() => setIsLaserSweeping(false), 600);

    SAMPLE_DEPOT_CARTONS.forEach((sample, i) => {
      setTimeout(() => {
        handleIngestCarton(sample);
      }, i * 150);
    });
  };

  // Remove Carton
  const handleRemoveCarton = (id: string) => {
    setScannedCartons((prev) => prev.filter((c) => c.id !== id));
  };

  // Calculations
  const totalCartonsCount = scannedCartons.reduce((sum, c) => sum + c.cartonCount, 0);
  const totalUnitsCount = scannedCartons.reduce((sum, c) => sum + c.totalUnits, 0);
  const totalWholesaleValueInr = scannedCartons.reduce((sum, c) => sum + c.totalUnits * c.wholesaleCostPerUnit, 0);
  const totalMrpValueInr = scannedCartons.reduce((sum, c) => sum + c.totalUnits * c.mrpPerUnit, 0);

  // Commit Auto-GRN directly to Pharmacy & Pathology Inventory
  const handleCommitAutoGrn = () => {
    if (scannedCartons.length === 0) return;
    setIsCommittingGrn(true);

    try {
      // Ingest into local pharmacy storage
      const existingBatchesStr = localStorage.getItem('docsearch_pharmacy_batches');
      let existingBatches: any[] = [];
      if (existingBatchesStr) {
        try {
          existingBatches = JSON.parse(existingBatchesStr);
        } catch {}
      }

      scannedCartons.forEach((carton) => {
        const newBatch = {
          id: `batch-${Date.now()}-${carton.id}`,
          batchNumber: carton.batchNumber,
          medicationCode: carton.medicationCode,
          brandName: carton.brandName,
          currentStock: carton.totalUnits,
          initialStock: carton.totalUnits,
          expiryDate: carton.expiryDate,
          mrp: carton.mrpPerUnit,
          unitCost: carton.wholesaleCostPerUnit,
          status: 'ACTIVE',
          receivedDate: new Date().toISOString(),
          poReference: purchaseOrderNumber,
          supplier: supplierName
        };
        existingBatches.unshift(newBatch);
      });

      localStorage.setItem('docsearch_pharmacy_batches', JSON.stringify(existingBatches));

      // Broadcast inventory update to all listening tabs & POS desks
      hospitalEventBus.publish(
        'DYNAMIC_REORDER_TRIGGERED',
        'HighSpeedCameraBoxScannerModal',
        {
          action: 'AUTO_GRN_CAMERA_INGESTION',
          poId: purchaseOrderId,
          poNumber: purchaseOrderNumber,
          cartonsScanned: totalCartonsCount,
          unitsIngested: totalUnitsCount,
          wholesaleValue: totalWholesaleValueInr
        },
        `📹 Camera Auto-GRN Reconciled: ${totalCartonsCount} cartons (${totalUnitsCount} units) for PO ${purchaseOrderNumber}`
      );

      onAutoGrnCommitted(scannedCartons, totalUnitsCount);

      setTimeout(() => {
        setIsCommittingGrn(false);
        onClose();
      }, 900);
    } catch (e) {
      setIsCommittingGrn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(2, 6, 23, 0.94)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '92vh',
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#1E293B',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}
            >
              📹
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                  High-Speed Camera Box Barcode Scanner (Auto-GRN)
                </h2>
                <Badge variant="success">GS1-128 / 2D DataMatrix</Badge>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                Point camera at wholesale cartons to ingest 50+ batch cartons into pharmacy/lab stock with 0 manual typing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body - 2 Column View */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1.3fr',
            flex: 1,
            overflow: 'hidden',
            minHeight: '480px'
          }}
        >
          {/* Left Column: Camera Viewfinder & Rapid Barcode Target */}
          <div
            style={{
              padding: '20px',
              borderRight: '1px solid #1E293B',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#090D16'
            }}
          >
            {/* Camera Viewfinder Box */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '280px',
                backgroundColor: '#020617',
                borderRadius: '12px',
                overflow: 'hidden',
                border: isLaserSweeping ? '2px solid #10B981' : '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isLaserSweeping ? '0 0 25px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: cameraActive ? 'block' : 'none'
                }}
              />

              {/* Laser Sweep Beam Animation */}
              {isLaserSweeping && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent 0%, #10B981 50%, transparent 100%)',
                    boxShadow: '0 0 15px 4px #10B981',
                    animation: 'sweepDown 0.5s ease-in-out infinite'
                  }}
                />
              )}

              {/* Viewfinder Bounding Box Reticle */}
              <div
                style={{
                  position: 'absolute',
                  inset: '24px',
                  border: '2px dashed rgba(56, 189, 248, 0.45)',
                  borderRadius: '10px',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {!cameraActive && (
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📦</div>
                    <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.9rem' }}>
                      Rapid Barcode Scanner Active
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '4px' }}>
                      {cameraError || 'Click any shipping carton barcode below for sub-second ingestion'}
                    </div>
                    {lastScannedItem && (
                      <div style={{ marginTop: '8px', color: '#10B981', fontSize: '0.72rem', fontWeight: 700 }}>
                        Last: {lastScannedItem.brandName} ({lastScannedItem.totalUnits} units)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* HUD Overlay Details */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Badge variant={cameraActive ? 'success' : 'primary'}>
                  {cameraActive ? '● LIVE CAMERA FEED' : '⚡ RAPID SCAN EMULATOR'}
                </Badge>
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                >
                  PO: {purchaseOrderNumber}
                </div>
              </div>

              {/* Scan Toast */}
              {toastMessage && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '16px',
                    right: '16px',
                    backgroundColor: 'rgba(16, 185, 129, 0.95)',
                    color: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }}
                >
                  ✓ {toastMessage}
                </div>
              )}
            </div>

            {/* Quick Multi-Carton Barcode Target Pad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Simulated Carton Barcodes (Click to Scan)
                </span>
                <Button size="sm" variant="primary" onClick={handleRapidScanAll}>
                  ⚡ Rapid Scan All Cartons
                </Button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  maxHeight: '160px',
                  overflowY: 'auto'
                }}
              >
                {SAMPLE_DEPOT_CARTONS.map((carton) => (
                  <button
                    key={carton.gtin}
                    onClick={() => handleIngestCarton(carton)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '8px 10px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#10B981';
                      e.currentTarget.style.backgroundColor = '#0F172A';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#334155';
                      e.currentTarget.style.backgroundColor = '#1E293B';
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                      {carton.brandName}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#10B981', fontFamily: 'monospace' }}>
                      Box of {carton.unitsPerCarton} | ₹{carton.wholesaleCost}/u
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Ingested Batch Ledger & GRN Summary */}
          <div
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#0F172A',
              overflowY: 'auto'
            }}
          >
            {/* Live Progress Ring & Counters */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '14px',
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Cartons Scanned
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>
                  {totalCartonsCount} <span style={{ fontSize: '0.8rem', color: '#64748B' }}>/ {expectedCartonCount}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Units Ingested
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8' }}>
                  {totalUnitsCount} <span style={{ fontSize: '0.8rem', color: '#64748B' }}>vials/tabs</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Wholesale Cost
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B' }}>
                  ₹{totalWholesaleValueInr.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Ingested Cartons Table */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9' }}>
                  Ingested Cartons Queue ({scannedCartons.length} Unique SKUs)
                </span>
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                  Retail Value: ₹{totalMrpValueInr.toLocaleString('en-IN')}
                </span>
              </div>

              {scannedCartons.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed #334155',
                    borderRadius: '10px',
                    padding: '30px',
                    color: '#64748B',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontWeight: 600, color: '#94A3B8' }}>No cartons scanned yet</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    Point camera at cartons or click the simulated barcodes on the left.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '230px',
                    overflowY: 'auto'
                  }}
                >
                  {scannedCartons.map((carton) => (
                    <div
                      key={carton.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '65%' }}>
                        <span style={{ fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {carton.brandName}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', color: '#94A3B8' }}>
                          <span>Batch: <strong style={{ color: '#38BDF8' }}>{carton.batchNumber}</strong></span>
                          <span>Exp: {carton.expiryDate}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: '#10B981' }}>
                            {carton.cartonCount} Box ({carton.totalUnits} Units)
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            ₹{(carton.totalUnits * carton.wholesaleCostPerUnit).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCarton(carton.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            padding: '4px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#1E293B',
            borderTop: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              Depot: <strong>{supplierName}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="success"
              disabled={scannedCartons.length === 0 || isCommittingGrn}
              onClick={handleCommitAutoGrn}
            >
              {isCommittingGrn
                ? 'Ingesting to Pharmacy Stock...'
                : `✓ Commit Auto-GRN (${totalUnitsCount} Units)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
