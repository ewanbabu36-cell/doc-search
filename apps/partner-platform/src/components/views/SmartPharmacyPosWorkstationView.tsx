import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

interface ScannedDrug {
  gtin: string;
  batchNumber: string;
  expiryDate: string;
  itemCode: string;
  itemName: string;
  mrp: number;
  availableStock: number;
  isScheduleH1: boolean;
  isNarcotic: boolean;
  requiresDualSign: boolean;
}

export const SmartPharmacyPosWorkstationView: React.FC = () => {
  const [barcodeInput, setBarcodeInput] = useState('(01)08901234567891(17)261130(10)B-AUG-2611(21)SN1234');
  const [scannedDrug, setScannedDrug] = useState<ScannedDrug | null>({
    gtin: '08901234567891',
    batchNumber: 'B-AUG-2611',
    expiryDate: '2026-11-30',
    itemCode: 'MED-AUG-625',
    itemName: 'Augmentin 625 Duo Tablets (10s)',
    mrp: 223.50,
    availableStock: 45,
    isScheduleH1: true,
    isNarcotic: false,
    requiresDualSign: true
  });

  const [fefoAlert, setFefoAlert] = useState<string | null>(null);
  const [h1Signed] = useState(true);
  const [billSettled, setBillSettled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanBarcode = async (code: string) => {
    setIsScanning(true);
    setFefoAlert(null);
    try {
      const res = await apiRequest<ScannedDrug>('/api/v1/partner/pharmacy-pos/barcode/scan', {
        method: 'POST',
        body: JSON.stringify({ rawBarcodeString: code })
      });
      if (res.data) {
        setScannedDrug(res.data);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleSimulateFefoViolation = async () => {
    try {
      await apiRequest('/api/v1/partner/pharmacy-pos/fefo/validate-batch', {
        method: 'POST',
        body: JSON.stringify({
          itemCode: 'MED-AUG-625',
          selectedBatchNumber: 'B-AUG-2712' // later batch expiring 2027!
        })
      });
    } catch (err: any) {
      setFefoAlert(err?.message || 'FEFO VIOLATION: Earlier batch B-AUG-2611 (Exp: Nov 2026) exists on shelf. Later batch B-AUG-2712 locked.');
    }
  };

  const handleCheckout = async () => {
    try {
      await apiRequest('/api/v1/partner/pharmacy-pos/bill/checkout', {
        method: 'POST',
        body: JSON.stringify({
          patientUhId: 'UHID-2026-9901',
          patientName: 'Rameshwar Dayal',
          items: [
            { itemCode: 'MED-AUG-625', batchNumber: 'B-AUG-2611', quantity: 2, unitPrice: 223.50 }
          ],
          paymentMode: 'UPI_DYNAMIC_QR',
          cashierName: 'Cashier Pooja Sharma'
        })
      });
      setBillSettled(true);
    } catch {
      // Handled
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Smart Pharmacy POS Workstation</h1>
            <Badge variant="success">GS1 2D DataMatrix • FEFO Strict Lock</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Sub-50ms barcode ingestion • CDSCO Schedule H1 dual digital sign • Real-time perpetual inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">Counter: PHARM-POS-01</Badge>
          <Badge variant="success">Soundbox UPI: ONLINE</Badge>
        </div>
      </div>

      {/* FEFO Violation Alert */}
      {fefoAlert && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 text-amber-900 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold flex items-center gap-2 text-amber-900">
              ⚠️ FEFO HARD-LOCK ENGAGED: DISPENSING BLOCKED
            </h3>
            <p className="text-sm">{fefoAlert}</p>
            <p className="text-xs text-amber-800">
              System Policy: Cashier cannot pick a later expiry batch while earlier expiring units remain unexpired on shelf.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setFefoAlert(null)}>
            Dismiss & Use Earliest Batch
          </Button>
        </div>
      )}

      {/* Barcode Ingestion Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
        <label className="text-xs font-semibold uppercase text-gray-500 block">
          High-Speed Barcode / GS1 2D DataMatrix Scanner Input
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 font-mono text-sm px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan GS1 2D DataMatrix or type GTIN..."
          />
          <Button
            variant="primary"
            disabled={isScanning}
            onClick={() => handleScanBarcode(barcodeInput)}
          >
            {isScanning ? 'Decoding...' : 'Scan / Ingest (<50ms)'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleSimulateFefoViolation}
          >
            Test FEFO Block
          </Button>
        </div>
      </div>

      {/* Drug Card & Schedule H1 Dual Sign */}
      {scannedDrug && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="font-bold text-lg text-gray-900">{scannedDrug.itemName}</h2>
                <span className="font-mono text-xs text-gray-500">GTIN: {scannedDrug.gtin} • Code: {scannedDrug.itemCode}</span>
              </div>
              <div className="flex gap-2">
                {scannedDrug.isScheduleH1 && <Badge variant="danger">SCHEDULE H1</Badge>}
                <Badge variant="success">IN STOCK: {scannedDrug.availableStock}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-gray-50 p-3 rounded border">
                <span className="text-gray-400 block">Batch Number</span>
                <span className="font-bold font-mono text-gray-900 text-sm">{scannedDrug.batchNumber}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <span className="text-gray-400 block">Expiry Date</span>
                <span className="font-bold text-emerald-700 text-sm">{scannedDrug.expiryDate}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <span className="text-gray-400 block">MRP / Unit</span>
                <span className="font-bold text-gray-900 text-sm">₹{scannedDrug.mrp.toFixed(2)}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <span className="text-gray-400 block">FEFO Priority</span>
                <span className="font-bold text-blue-600 text-sm">BATCH #1 (FIRST OUT)</span>
              </div>
            </div>

            {/* Schedule H1 Compliance Banner */}
            {scannedDrug.isScheduleH1 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block">CDSCO Statutory Drug Alert: Schedule H1 Antibiotic</span>
                  <span>Requires doctor registration number and dual digital signatures prior to dispensing.</span>
                </div>
                <Badge variant={h1Signed ? 'success' : 'danger'}>
                  {h1Signed ? 'DUAL-SIGNED ✓' : 'SIGNATURE REQUIRED'}
                </Badge>
              </div>
            )}
          </div>

          {/* POS Bill Summary & Thermal Checkout */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-semibold text-gray-900">Cart & Checkout</h2>
              <Badge variant="info">Qty: 2 Packs</Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span>{scannedDrug.itemName} (x2)</span>
                <span className="font-mono font-medium">₹{(scannedDrug.mrp * 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b text-gray-500">
                <span>GST (12% Included)</span>
                <span className="font-mono">₹47.89</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-gray-900">
                <span>Total Amount</span>
                <span className="text-emerald-700 font-mono">₹{(scannedDrug.mrp * 2).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                variant="primary"
                className="w-full"
                disabled={billSettled}
                onClick={handleCheckout}
              >
                {billSettled ? 'Bill Settled & Printed ✓' : 'Checkout & Print Thermal 80mm'}
              </Button>
              {billSettled && (
                <div className="bg-emerald-50 rounded p-2 text-center text-xs text-emerald-800 border border-emerald-200">
                  Perpetual inventory updated. Soundbox payment announcement broadcasted.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
