import React, { useState } from 'react';

export interface B2BWholesaleInvoiceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated?: (itemsCount: number) => void;
}

interface ParsedInvoiceItem {
  id: string;
  brandName: string;
  molecule: string;
  batchNo: string;
  expiry: string;
  hsnCode: string;
  mrp: number;
  purchaseRate: number;
  qty: number;
  freeQty: number;
  gstPercent: number;
}

export const B2BWholesaleInvoiceSyncModal: React.FC<B2BWholesaleInvoiceSyncModalProps> = ({
  isOpen,
  onClose,
  onStockUpdated
}) => {
  const [distributorName, setDistributorName] = useState('Vikas Pharma Wholesale Agencies (Agra / Varanasi)');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2024-VP-9941');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [syncCount, setSyncCount] = useState(0);

  const [parsedItems, setParsedItems] = useState<ParsedInvoiceItem[]>([
    {
      id: 'ITM-1',
      brandName: 'Augmentin 625 Duo Tablet',
      molecule: 'Amoxicillin + Clavulanic Acid (500mg/125mg)',
      batchNo: 'AG8924',
      expiry: '11/2026',
      hsnCode: '300410',
      mrp: 220.0,
      purchaseRate: 154.0,
      qty: 100,
      freeQty: 10,
      gstPercent: 12
    },
    {
      id: 'ITM-2',
      brandName: 'Telma 40 Tablet',
      molecule: 'Telmisartan 40mg',
      batchNo: 'TL4401',
      expiry: '09/2026',
      hsnCode: '300490',
      mrp: 142.5,
      purchaseRate: 98.2,
      qty: 80,
      freeQty: 8,
      gstPercent: 12
    },
    {
      id: 'ITM-3',
      brandName: 'Pan-D Capsule',
      molecule: 'Pantoprazole (40mg) + Domperidone (30mg)',
      batchNo: 'PD9012',
      expiry: '04/2027',
      hsnCode: '300490',
      mrp: 198.0,
      purchaseRate: 135.0,
      qty: 150,
      freeQty: 15,
      gstPercent: 12
    },
    {
      id: 'ITM-4',
      brandName: 'Dolo 650 Tablet',
      molecule: 'Paracetamol 650mg Fast-Release',
      batchNo: 'DL7103',
      expiry: '01/2027',
      hsnCode: '300490',
      mrp: 34.0,
      purchaseRate: 22.5,
      qty: 300,
      freeQty: 30,
      gstPercent: 12
    },
    {
      id: 'ITM-5',
      brandName: 'Ascoril LS Syrup (100ml)',
      molecule: 'Levosalbutamol + Ambroxol + Guaifenesin',
      batchNo: 'AS3319',
      expiry: '07/2026',
      hsnCode: '300490',
      mrp: 118.0,
      purchaseRate: 79.0,
      qty: 60,
      freeQty: 6,
      gstPercent: 12
    }
  ]);

  if (!isOpen) return null;

  const totalValue = parsedItems.reduce((acc, it) => acc + it.purchaseRate * it.qty, 0);
  const totalItemsCount = parsedItems.reduce((acc, it) => acc + it.qty + it.freeQty, 0);

  const handleApplyToStock = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSynced(true);
      setSyncCount(totalItemsCount);
      if (onStockUpdated) onStockUpdated(totalItemsCount);
    }, 1200);
  };

  const handleSimulateNewDistributor = () => {
    setDistributorName('Kalyan Medico Super-Stockist (Lucknow / Delhi)');
    setInvoiceNumber(`INV-2024-KM-${Math.floor(Math.random() * 9000 + 1000)}`);
    setParsedItems([
      {
        id: 'ITM-NEW-1',
        brandName: 'Montair-LC Tablet',
        molecule: 'Montelukast (10mg) + Levocetirizine (5mg)',
        batchNo: 'ML9840',
        expiry: '12/2026',
        hsnCode: '300490',
        mrp: 310.0,
        purchaseRate: 215.0,
        qty: 120,
        freeQty: 12,
        gstPercent: 12
      },
      {
        id: 'ITM-NEW-2',
        brandName: 'Azithral 500 Tablet',
        molecule: 'Azithromycin 500mg',
        batchNo: 'AZ1102',
        expiry: '05/2026',
        hsnCode: '300420',
        mrp: 135.0,
        purchaseRate: 92.0,
        qty: 90,
        freeQty: 9,
        gstPercent: 12
      },
      {
        id: 'ITM-NEW-3',
        brandName: 'Shelcal 500 Tablet',
        molecule: 'Calcium 500mg + Vitamin D3 250 IU',
        batchNo: 'SH7781',
        expiry: '10/2027',
        hsnCode: '300450',
        mrp: 145.0,
        purchaseRate: 101.5,
        qty: 200,
        freeQty: 20,
        gstPercent: 12
      }
    ]);
    setIsSynced(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 14, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #F59E0B',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>📦</span>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
                B2B Pharma Distributor Wholesale Invoice Auto-Sync
                <span style={{ backgroundColor: '#F59E0B', color: '#78350F', fontSize: '0.6875rem', fontWeight: 900, padding: '2px 8px', borderRadius: '12px' }}>
                  Marg ERP Killer
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#FDE68A' }}>
                होलसेलर के इनवॉयस से 1-क्लिक में 100+ दवाइयों का बैच, एक्सपायरी, GST व स्टॉक ऑटो-इम्पोर्ट करें
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Invoice Summary Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '12px', backgroundColor: '#1E293B', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>होलसेल डिस्ट्रीब्यूटर (Wholesaler):</span>
              <div style={{ fontSize: '0.875rem', color: '#F8FAFC', fontWeight: 800 }}>{distributorName}</div>
              <span style={{ fontSize: '0.6875rem', color: '#F59E0B' }}>Bill No: {invoiceNumber}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>कुल दवाइयां (Total Units):</span>
              <div style={{ fontSize: '1.1rem', color: '#38BDF8', fontWeight: 900 }}>
                {totalItemsCount} स्ट्रिप्स
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{parsedItems.length} यूनिक ब्रांड्स + स्कीम फ्री</span>
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>खरीद मूल्य (Purchase Net):</span>
              <div style={{ fontSize: '1.1rem', color: '#10B981', fontWeight: 900 }}>
                ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>+ GST 12% ITC Input</span>
            </div>
          </div>

          {/* Quick Upload / Switcher Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSimulateNewDistributor}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px dashed rgba(255, 255, 255, 0.25)',
                color: '#F8FAFC',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📂</span>
              <span>अन्य डिस्ट्रीब्यूटर इनवॉयस लोड करें (EDI / Marg / Excel)</span>
            </button>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              ✓ AI Parser ने बैच, एक्सपायरी और स्कीम की ऑटो-मैपिंग कर ली है
            </span>
          </div>

          {/* Parsed Items Table */}
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#1E293B', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px' }}>दवा व फॉर्मूलेशन (Brand & Molecule)</th>
                  <th style={{ padding: '8px 10px' }}>बैच नंबर</th>
                  <th style={{ padding: '8px 10px' }}>एक्सपायरी</th>
                  <th style={{ padding: '8px 10px' }}>मात्रा + फ्री</th>
                  <th style={{ padding: '8px 10px' }}>खरीद भाव</th>
                  <th style={{ padding: '8px 10px' }}>MRP</th>
                  <th style={{ padding: '8px 10px' }}>GST %</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#0F172A' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{item.brandName}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{item.molecule}</div>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#F59E0B', fontWeight: 800, fontFamily: 'monospace' }}>
                      {item.batchNo}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#38BDF8', fontWeight: 700 }}>
                      {item.expiry}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#F8FAFC', fontWeight: 800 }}>
                      {item.qty} <span style={{ color: '#10B981', fontSize: '0.6875rem' }}>+{item.freeQty} Free</span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#10B981', fontWeight: 800 }}>
                      ₹{item.purchaseRate.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#CBD5E1', fontWeight: 700 }}>
                      ₹{item.mrp.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#94A3B8' }}>
                      {item.gstPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isSynced && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399', padding: '12px 16px', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 800, textAlign: 'center' }}>
              🎉 सफलता! {syncCount} दवाइयां आपकी फार्मेसी इन्वेंटरी में बैच और एक्सपायरी के साथ लाइव हो गई हैं। कोई मैनुअल टाइपिंग की आवश्यकता नहीं पड़ी!
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#1E293B',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            ✓ Marg EDI, Excel, CSV और PDF इनवॉयस ऑटो-सिंक इनेबल्ड
          </div>

          <button
            type="button"
            onClick={handleApplyToStock}
            disabled={isProcessing || isSynced}
            style={{
              backgroundColor: isSynced ? '#10B981' : '#F59E0B',
              color: '#0F172A',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '10px',
              fontWeight: 900,
              fontSize: '0.875rem',
              cursor: isSynced ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
            }}
          >
            <span>{isSynced ? '✓' : '📥'}</span>
            <span>
              {isProcessing
                ? 'स्टॉक अपडेट हो रहा है...'
                : isSynced
                ? 'स्टॉक में सफलतापूर्वक जुड़ा (Synced)'
                : 'फार्मेसी स्टॉक में 1-क्लिक में जोड़ें (Import to POS)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
