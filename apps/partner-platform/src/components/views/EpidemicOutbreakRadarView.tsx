import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';

export interface OutbreakCluster {
  id: string;
  pinCode: string;
  locality: string;
  city: string;
  primaryDiagnosis: string;
  totalReportedCases: number;
  baselineHistoricalCases: number;
  growthVelocityPercent: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  detectedTime: string;
  contributingDepts: string[];
}

export interface PredictiveDepletionItem {
  id: string;
  medicationName: string;
  genericName: string;
  dosageForm: string;
  currentWarehouseStock: number;
  stockUnit: string;
  baselineDailyUsage: number;
  outbreakSurgeUsage: number;
  daysRemaining: number;
  predictedDepletionHours: number;
  severity: 'CRITICAL_SHORTAGE' | 'WARNING' | 'NORMAL';
  suggestedPoQuantity: number;
  ptrRate: number;
  mrpRate: number;
  hsnCode: string;
  gstRate: number;
}

export interface EpidemicOutbreakRadarViewProps {
  onInwardGeneratedPo?: (poData: unknown) => void;
}

export const EpidemicOutbreakRadarView: React.FC<EpidemicOutbreakRadarViewProps> = ({
  onInwardGeneratedPo
}) => {
  const [selectedClusterId, setSelectedClusterId] = useState<string>('CLUSTER-DENGUE-400076');
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(2.5);
  const [isDispatchedWhatsApp, setIsDispatchedWhatsApp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Active Outbreak Clusters from OPD Triage & Labs
  const clusters: OutbreakCluster[] = [
    {
      id: 'CLUSTER-DENGUE-400076',
      pinCode: '400076',
      locality: 'Powai & Chandivali Lake Belt',
      city: 'Mumbai Suburban',
      primaryDiagnosis: 'Dengue NS1 Antigen + Acute Febrile Illness',
      totalReportedCases: 42,
      baselineHistoricalCases: 10,
      growthVelocityPercent: 320,
      severity: 'CRITICAL',
      detectedTime: '18 mins ago (Continuous Triage Stream)',
      contributingDepts: ['OPD Triage Desk #1', 'Emergency ER', 'Pathology Lab LIMS']
    },
    {
      id: 'CLUSTER-TYPHOID-110029',
      pinCode: '110029',
      locality: 'Safdarjung Enclave & Green Park',
      city: 'New Delhi',
      primaryDiagnosis: 'Acute Gastroenteritis & Typhoid (Widal +)',
      totalReportedCases: 29,
      baselineHistoricalCases: 9,
      growthVelocityPercent: 222,
      severity: 'HIGH',
      detectedTime: '1 hour ago',
      contributingDepts: ['OPD Pediatric Desk', 'Gastroenterology OPD', 'Inpatient Ward B']
    },
    {
      id: 'CLUSTER-H1N1-560034',
      pinCode: '560034',
      locality: 'Koramangala 4th Block',
      city: 'Bengaluru',
      primaryDiagnosis: 'Viral Influenza & Upper Respiratory Bronchitis',
      totalReportedCases: 19,
      baselineHistoricalCases: 8,
      growthVelocityPercent: 137,
      severity: 'MODERATE',
      detectedTime: '3 hours ago',
      contributingDepts: ['Pulmonology OPD', 'Fever Triage']
    }
  ];

  const activeCluster = useMemo(
    () => clusters.find((c) => c.id === selectedClusterId) || clusters[0]!,
    [selectedClusterId]
  );

  // Predictive Depletion Items based on active cluster
  const baseDepletionItems: PredictiveDepletionItem[] = useMemo(() => {
    if (selectedClusterId === 'CLUSTER-DENGUE-400076') {
      return [
        {
          id: 'dep-dolo-650',
          medicationName: 'Dolo 650mg (Paracetamol)',
          genericName: 'Paracetamol 650mg Tablets',
          dosageForm: 'TABLET',
          currentWarehouseStock: 140,
          stockUnit: 'Strips (15 tabs)',
          baselineDailyUsage: 25,
          outbreakSurgeUsage: 98,
          daysRemaining: 1.4,
          predictedDepletionHours: 34,
          severity: 'CRITICAL_SHORTAGE',
          suggestedPoQuantity: 240,
          ptrRate: 22.40,
          mrpRate: 34.15,
          hsnCode: '30049060',
          gstRate: 12
        },
        {
          id: 'dep-rl-500',
          medicationName: 'Ringer Lactate (RL) 500ml IV',
          genericName: 'Compound Sodium Lactate Injection',
          dosageForm: 'IV_INFUSION',
          currentWarehouseStock: 45,
          stockUnit: 'Bottles (500ml)',
          baselineDailyUsage: 10,
          outbreakSurgeUsage: 38,
          daysRemaining: 1.2,
          predictedDepletionHours: 28,
          severity: 'CRITICAL_SHORTAGE',
          suggestedPoQuantity: 120,
          ptrRate: 48.00,
          mrpRate: 72.00,
          hsnCode: '30049090',
          gstRate: 12
        },
        {
          id: 'dep-dns-500',
          medicationName: 'Dextrose Normal Saline (DNS 5%) 500ml',
          genericName: 'Dextrose 5% + Sodium Chloride 0.9%',
          dosageForm: 'IV_INFUSION',
          currentWarehouseStock: 52,
          stockUnit: 'Bottles (500ml)',
          baselineDailyUsage: 12,
          outbreakSurgeUsage: 40,
          daysRemaining: 1.3,
          predictedDepletionHours: 31,
          severity: 'CRITICAL_SHORTAGE',
          suggestedPoQuantity: 100,
          ptrRate: 48.00,
          mrpRate: 72.00,
          hsnCode: '30049090',
          gstRate: 12
        },
        {
          id: 'dep-electral-ors',
          medicationName: 'Electral ORS 21.8g Sachet',
          genericName: 'WHO Oral Rehydration Salts Formula',
          dosageForm: 'SACHET',
          currentWarehouseStock: 80,
          stockUnit: 'Sachets',
          baselineDailyUsage: 20,
          outbreakSurgeUsage: 65,
          daysRemaining: 1.2,
          predictedDepletionHours: 29,
          severity: 'CRITICAL_SHORTAGE',
          suggestedPoQuantity: 200,
          ptrRate: 16.50,
          mrpRate: 24.50,
          hsnCode: '30049090',
          gstRate: 12
        }
      ];
    } else if (selectedClusterId === 'CLUSTER-TYPHOID-110029') {
      return [
        {
          id: 'dep-cefixime-200',
          medicationName: 'Taxim-O 200mg (Cefixime)',
          genericName: 'Cefixime 200mg Tablets',
          dosageForm: 'TABLET',
          currentWarehouseStock: 60,
          stockUnit: 'Strips (10 tabs)',
          baselineDailyUsage: 14,
          outbreakSurgeUsage: 42,
          daysRemaining: 1.4,
          predictedDepletionHours: 34,
          severity: 'CRITICAL_SHORTAGE',
          suggestedPoQuantity: 150,
          ptrRate: 78.00,
          mrpRate: 115.00,
          hsnCode: '30049060',
          gstRate: 12
        },
        {
          id: 'dep-o2-tab',
          medicationName: 'O2 Tablets (Ofloxacin + Ornidazole)',
          genericName: 'Ofloxacin 200mg + Ornidazole 500mg',
          dosageForm: 'TABLET',
          currentWarehouseStock: 75,
          stockUnit: 'Strips (10 tabs)',
          baselineDailyUsage: 18,
          outbreakSurgeUsage: 50,
          daysRemaining: 1.5,
          predictedDepletionHours: 36,
          severity: 'CRITICAL_SHORTAGE',
          suggestedPoQuantity: 180,
          ptrRate: 85.00,
          mrpRate: 130.00,
          hsnCode: '30049060',
          gstRate: 12
        },
        {
          id: 'dep-ns-500',
          medicationName: 'Normal Saline (NS 0.9%) 500ml',
          genericName: 'Sodium Chloride 0.9% IV Infusion',
          dosageForm: 'IV_INFUSION',
          currentWarehouseStock: 50,
          stockUnit: 'Bottles (500ml)',
          baselineDailyUsage: 15,
          outbreakSurgeUsage: 40,
          daysRemaining: 1.25,
          predictedDepletionHours: 30,
          severity: 'CRITICAL_SHORTAGE',
          suggestedPoQuantity: 120,
          ptrRate: 45.00,
          mrpRate: 68.00,
          hsnCode: '30049090',
          gstRate: 12
        }
      ];
    } else {
      return [
        {
          id: 'dep-azithral-500',
          medicationName: 'Azithral 500mg (Azithromycin)',
          genericName: 'Azithromycin 500mg Tablets',
          dosageForm: 'TABLET',
          currentWarehouseStock: 90,
          stockUnit: 'Strips (5 tabs)',
          baselineDailyUsage: 18,
          outbreakSurgeUsage: 45,
          daysRemaining: 2.0,
          predictedDepletionHours: 48,
          severity: 'WARNING',
          suggestedPoQuantity: 100,
          ptrRate: 88.00,
          mrpRate: 132.00,
          hsnCode: '30049060',
          gstRate: 12
        },
        {
          id: 'dep-levocet-5',
          medicationName: 'Levocetirizine 5mg',
          genericName: 'Levocetirizine Dihydrochloride 5mg',
          dosageForm: 'TABLET',
          currentWarehouseStock: 110,
          stockUnit: 'Strips (10 tabs)',
          baselineDailyUsage: 22,
          outbreakSurgeUsage: 55,
          daysRemaining: 2.0,
          predictedDepletionHours: 48,
          severity: 'WARNING',
          suggestedPoQuantity: 120,
          ptrRate: 28.00,
          mrpRate: 45.00,
          hsnCode: '30049060',
          gstRate: 12
        }
      ];
    }
  }, [selectedClusterId]);

  // Scaled PO Quantities based on buffer multiplier
  const calculatedPoItems = useMemo(() => {
    return baseDepletionItems.map((item) => {
      const scaledQty = Math.round(item.suggestedPoQuantity * surgeMultiplier);
      const taxable = Math.round(scaledQty * item.ptrRate * 100) / 100;
      const gst = Math.round(taxable * (item.gstRate / 100) * 100) / 100;
      const net = Math.round((taxable + gst) * 100) / 100;
      return {
        ...item,
        poQuantity: scaledQty,
        taxableAmount: taxable,
        gstAmount: gst,
        netAmount: net
      };
    });
  }, [baseDepletionItems, surgeMultiplier]);

  const poTotals = useMemo(() => {
    let subtotal = 0;
    let gst = 0;
    for (const item of calculatedPoItems) {
      subtotal += item.taxableAmount;
      gst += item.gstAmount;
    }
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      grandTotal: Math.round((subtotal + gst) * 100) / 100
    };
  }, [calculatedPoItems]);

  const poNumber = `PO-OUTBREAK-${activeCluster.pinCode}-${new Date().getFullYear()}`;

  // Export Marg ERP XML/CSV
  const handleExportMarg = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'PO_NUMBER,DATE,VENDOR_CODE,ITEM_NAME,HSN,QTY,PTR,GST_PCT,AMOUNT\n' +
      calculatedPoItems
        .map(
          (i) =>
            `${poNumber},${new Date().toISOString().split('T')[0]},VND-MARG-9021,"${i.medicationName}",${i.hsnCode},${i.poQuantity},${i.ptrRate},${i.gstRate},${i.netAmount}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MARG_PO_${poNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Marg ERP Purchase Order (${poNumber}.csv) downloaded successfully!`);
  };

  // Export Vyapar JSON
  const handleExportVyapar = () => {
    const vyaparData = {
      purchaseOrderNumber: poNumber,
      orderDate: new Date().toISOString(),
      distributor: {
        name: 'Metro Healthcare Wholesale Distributors Pvt Ltd',
        gstin: '27AAACD8892F1Z5',
        phone: '+91 98201 55432'
      },
      epidemicTrigger: {
        clusterPinCode: activeCluster.pinCode,
        diagnosis: activeCluster.primaryDiagnosis,
        surgeCases: activeCluster.totalReportedCases
      },
      items: calculatedPoItems.map((i) => ({
        itemName: i.medicationName,
        generic: i.genericName,
        hsn: i.hsnCode,
        quantity: i.poQuantity,
        unit: i.stockUnit,
        ptr: i.ptrRate,
        mrp: i.mrpRate,
        gstRate: i.gstRate,
        netTotal: i.netAmount
      })),
      totals: poTotals
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vyaparData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `VYAPAR_PO_${poNumber}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Vyapar Purchase Order JSON (${poNumber}.json) exported!`);
  };

  // 1-Click WhatsApp PO Dispatch to Stockist
  const handleDispatchWhatsApp = () => {
    setIsDispatchedWhatsApp(true);
    showToast(`✓ Wholesale PO dispatched to Metro Distributors (+91 98201 55432) via WhatsApp!`);
    if (onInwardGeneratedPo) {
      onInwardGeneratedPo({
        poNumber,
        items: calculatedPoItems,
        totals: poTotals
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#064E3B',
            border: '1.5px solid #10B981',
            color: '#ECFDF5',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>📦</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #F59E0B',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 24px rgba(245, 158, 11, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1.5px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}
          >
            📡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                Epidemic & Local Outbreak Radar
              </h2>
              <span
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#FCA5A5',
                  border: '1px solid #EF4444',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '10px'
                }}
              >
                LIVE OPD TRIAGE SURVEILLANCE
              </span>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '0.8125rem', margin: '4px 0 0 0' }}>
              Correlates sudden fever & diagnostic spikes across PIN codes. Automatically generates wholesale POs in Marg/Vyapar format 3 days before pharmacy stockouts.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Active Surge Multiplier:</span>
          {[1.5, 2.0, 2.5, 3.0].map((mult) => (
            <button
              key={mult}
              type="button"
              onClick={() => setSurgeMultiplier(mult)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: surgeMultiplier === mult ? '#F59E0B' : 'rgba(255, 255, 255, 0.05)',
                color: surgeMultiplier === mult ? '#070C16' : '#CBD5E1',
                border: surgeMultiplier === mult ? '1.5px solid #FCD34D' : '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.75rem',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              {mult}x Buffer
            </button>
          ))}
        </div>
      </div>

      {/* Cluster Anomaly Cards (OPD Triage & Labs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {clusters.map((c) => {
          const isSelected = c.id === selectedClusterId;
          const isCrit = c.severity === 'CRITICAL';
          return (
            <div
              key={c.id}
              onClick={() => {
                setSelectedClusterId(c.id);
                setIsDispatchedWhatsApp(false);
              }}
              style={{
                backgroundColor: isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.65)',
                border: isSelected
                  ? isCrit ? '2px solid #EF4444' : '2px solid #F59E0B'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                boxShadow: isSelected
                  ? isCrit ? '0 0 20px rgba(239, 68, 68, 0.25)' : '0 0 20px rgba(245, 158, 11, 0.25)'
                  : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    backgroundColor: isCrit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: isCrit ? '#FCA5A5' : '#FCD34D',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  PIN {c.pinCode} • {c.locality}
                </span>
                <Badge variant={isCrit ? 'danger' : 'warning'}>{c.severity}</Badge>
              </div>

              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '4px' }}>
                {c.primaryDiagnosis}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '10px' }}>
                {c.city} • Detected: {c.detectedTime}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>
                <div>
                  <span style={{ color: '#94A3B8' }}>Reported Cases: </span>
                  <strong style={{ color: '#F8FAFC' }}>{c.totalReportedCases}</strong>
                </div>
                <div style={{ color: '#EF4444', fontWeight: 800 }}>
                  +{c.growthVelocityPercent}% Surge
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column: Predictive Stock Depletion (Left) & Auto-Generated Wholesale PO (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Left: Predictive Depletion Engine */}
        <Card padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⏱️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Predictive Stockout Depletion Engine
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                  Forecast based on active outbreak surge in PIN {activeCluster.pinCode}
                </span>
              </div>
            </div>
            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
              Shortage in &lt; 3 Days
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {baseDepletionItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{item.medicationName}</strong>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{item.genericName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#EF4444', fontWeight: 900, fontSize: '0.9rem' }}>
                      {item.daysRemaining} Days
                    </span>
                    <div style={{ fontSize: '0.65rem', color: '#FCA5A5' }}>
                      ~{item.predictedDepletionHours}h to Zero Stock
                    </div>
                  </div>
                </div>

                {/* Depletion Progress Bar */}
                <div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(15, (item.currentWarehouseStock / (item.outbreakSurgeUsage * 3)) * 100))}%`,
                        height: '100%',
                        backgroundColor: '#EF4444'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#CBD5E1', marginTop: '4px' }}>
                    <span>Stock: <strong>{item.currentWarehouseStock} {item.stockUnit}</strong></span>
                    <span>Outbreak Run-Rate: <strong>{item.outbreakSurgeUsage}/day</strong> (Baseline: {item.baselineDailyUsage})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.75rem',
              color: '#FDE68A',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>💡</span>
            <span>
              Autonomous PO trigger generates wholesale restocking order <strong>3 days prior to stock exhaustion</strong> to prevent ER & ICU supply collapse.
            </span>
          </div>
        </Card>

        {/* Right: Auto-Generated Wholesale PO (Marg ERP & Vyapar Formats) */}
        <Card
          padding="md"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            border: '1.5px solid #10B981',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📑</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                    Auto-Generated Wholesale PO
                  </h3>
                  <Badge variant="success">MARG / VYAPAR FORMAT</Badge>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#A7F3D0' }}>
                  {poNumber} • Metro Healthcare Distributors (VND-MARG-9021)
                </span>
              </div>
            </div>
            {isDispatchedWhatsApp ? (
              <span style={{ backgroundColor: 'rgba(37, 211, 102, 0.2)', border: '1px solid #25D366', color: '#25D366', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                ✓ DISPATCHED TO STOCKIST
              </span>
            ) : (
              <Badge variant="neutral">Ready to Dispatch</Badge>
            )}
          </div>

          {/* Line Items Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8', textAlign: 'left' }}>
                  <th style={{ padding: '6px 4px' }}>Item Name</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>PO Qty</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>PTR (₹)</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>GST</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {calculatedPoItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 4px' }}>
                      <strong style={{ color: '#F8FAFC' }}>{item.medicationName}</strong>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>HSN: {item.hsnCode}</div>
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 800, color: '#38BDF8' }}>
                      {item.poQuantity} {item.stockUnit.split(' ')[0]}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                      ₹{item.ptrRate.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', color: '#94A3B8' }}>
                      {item.gstRate}%
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 800, color: '#10B981' }}>
                      ₹{item.netAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
              <span>Taxable PTR Base:</span>
              <span>₹{poTotals.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
              <span>Estimated GST (12%):</span>
              <span>₹{poTotals.gst.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34D399', fontWeight: 900, fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px' }}>
              <span>Total Wholesale PO Value:</span>
              <span>₹{poTotals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Export & 1-Click Dispatch Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={handleExportMarg}
                style={{
                  backgroundColor: '#0F766E',
                  border: '1px solid #14B8A6',
                  color: '#CCFBF1',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>📥 Marg ERP (CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleExportVyapar}
                style={{
                  backgroundColor: '#0369A1',
                  border: '1px solid #38BDF8',
                  color: '#E0F2FE',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>📥 Vyapar (JSON)</span>
              </button>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleDispatchWhatsApp}
              style={{
                width: '100%',
                fontWeight: 900,
                backgroundColor: '#25D366',
                borderColor: '#25D366',
                color: '#070C16',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
              }}
            >
              📲 1-Click WhatsApp PO Dispatch to Stockist (+91 98201 55432)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
