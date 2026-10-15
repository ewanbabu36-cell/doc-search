import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Dialog,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import {
  b2bWholesaleSupplyService,
  type WholesaleCatalogItem,
  type SupplyCategory,
  type InboundPurchaseOrder,
  resolveNearestDepotByPincode
} from '../../services/b2b-wholesale-supply-service.js';
import { HighSpeedCameraBoxScannerModal, type ScannedCartonBatch } from '../dialogs/HighSpeedCameraBoxScannerModal.js';

export interface B2BWholesaleMarketplaceViewProps {
  hospitalName?: string;
  onAutoGrnCompleted?: (ingestedBatchCount: number) => void;
}

export const B2BWholesaleMarketplaceView: React.FC<B2BWholesaleMarketplaceViewProps> = ({
  hospitalName = 'City Hospital & Medical Institute',
  onAutoGrnCompleted
}) => {
  const [catalog, setCatalog] = useState<WholesaleCatalogItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<InboundPurchaseOrder[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SupplyCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityPincode, setFacilityPincode] = useState('110001');
  
  // Cart state: itemId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'MY_ORDERS'>('CATALOG');
  const [orderSuccessModal, setOrderSuccessModal] = useState<InboundPurchaseOrder | null>(null);
  const [autoGrnToast, setAutoGrnToast] = useState<string | null>(null);
  const [isBoxScannerOpen, setIsBoxScannerOpen] = useState(false);
  const [activeScanningPo, setActiveScanningPo] = useState<InboundPurchaseOrder | null>(null);

  const nearestDepot = useMemo(() => resolveNearestDepotByPincode(facilityPincode), [facilityPincode]);

  useEffect(() => {
    setCatalog(b2bWholesaleSupplyService.getCatalog());
    setPurchaseOrders(b2bWholesaleSupplyService.getPurchaseOrders());
  }, []);

  const refreshOrders = () => {
    setPurchaseOrders(b2bWholesaleSupplyService.getPurchaseOrders());
  };

  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.genericFormula.toLowerCase().includes(q) ||
        item.manufacturer.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [catalog, selectedCategory, searchQuery]);

  // Bulk Tier Price Calculator
  const getItemPrice = (item: WholesaleCatalogItem, qty: number): number => {
    const tier = [...item.bulkTiers].reverse().find(t => qty >= t.minQty);
    return tier ? tier.pricePerUnitInr : item.wholesalePriceInr;
  };

  // Cart Calculations
  const cartItemsDetailed = useMemo(() => {
    return Object.entries(cart)
      .map(([itemId, qty]) => {
        const item = catalog.find(c => c.id === itemId);
        if (!item || qty <= 0) return null;
        const unitPrice = getItemPrice(item, qty);
        const lineTotal = unitPrice * qty;
        const mrpTotal = item.mrpInr * qty;
        const lineSavings = mrpTotal - lineTotal;
        return { item, qty, unitPrice, lineTotal, mrpTotal, lineSavings };
      })
      .filter(Boolean) as {
        item: WholesaleCatalogItem;
        qty: number;
        unitPrice: number;
        lineTotal: number;
        mrpTotal: number;
        lineSavings: number;
      }[];
  }, [cart, catalog]);

  const cartTotalAmount = useMemo(() => {
    return cartItemsDetailed.reduce((sum, ci) => sum + ci.lineTotal, 0);
  }, [cartItemsDetailed]);

  const cartTotalSavings = useMemo(() => {
    return cartItemsDetailed.reduce((sum, ci) => sum + ci.lineSavings, 0);
  }, [cartItemsDetailed]);

  const cartItemCount = useMemo(() => {
    return Object.values(cart).reduce((sum, q) => sum + (q > 0 ? 1 : 0), 0);
  }, [cart]);

  const handleUpdateQty = (itemId: string, qty: number) => {
    setCart(prev => {
      const copy = { ...prev };
      if (qty <= 0) {
        delete copy[itemId];
      } else {
        copy[itemId] = qty;
      }
      return copy;
    });
  };

  const handleAddToCart = (item: WholesaleCatalogItem) => {
    const current = cart[item.id] || 0;
    const newQty = current === 0 ? item.moq : current + 1;
    handleUpdateQty(item.id, newQty);
  };

  // Smart 1-Click Auto-Replenishment: Aggregates critical hospital medicines and lab reagents
  const handleAutoLoadPredictiveCart = () => {
    const smartPicks: Record<string, number> = {
      'sku-pharma-001': 10, // Ceftriaxone 1g
      'sku-pharma-002': 10, // Paracetamol IV
      'sku-pharma-003': 20, // Normal Saline 500ml
      'sku-chem-001': 5,    // CBC Diluent 20L
      'sku-chem-004': 10,   // Dengue Rapid Card
      'sku-eq-001': 10,     // IV Cannula 20G
      'sku-eq-002': 15      // Syringe 5ml
    };
    setCart(smartPicks);
    setIsCartOpen(true);
  };

  // Dispatch Purchase Order to DocSearch Central Depot
  const handleDispatchOrder = () => {
    if (cartItemsDetailed.length === 0) return;

    const items = cartItemsDetailed.map(ci => ({
      itemId: ci.item.id,
      name: ci.item.name,
      sku: ci.item.sku,
      quantity: ci.qty,
      unitPriceInr: ci.unitPrice,
      totalInr: ci.lineTotal,
      mrpInr: ci.item.mrpInr,
      allocatedBatch: `BATCH-${ci.item.sku.split('-')[1] || 'DS'}-${Date.now().toString().slice(-4)}`,
      expiryDate: '2028-12'
    }));

    const gst = Math.round(cartTotalAmount * 0.12);
    const newPo = b2bWholesaleSupplyService.createPurchaseOrder({
      hospitalId: 'hosp-current',
      hospitalName,
      items,
      subtotalInr: cartTotalAmount,
      gstInr: gst,
      totalAmountInr: cartTotalAmount + gst,
      shippingPincode: facilityPincode,
      assignedDepot: nearestDepot.code,
      deliveryEta: `${nearestDepot.expressSlaHours}h Guaranteed (${nearestDepot.name})`,
      coldChainTelemetry: {
        targetRange: '2°C to 8°C (Refrigerated & Biologicals)',
        lastSensorReadingC: 4.2,
        sensorStatus: 'OPTIMAL',
        monitoredAt: 'Just now'
      }
    });

    setCart({});
    setIsCartOpen(false);
    refreshOrders();
    setOrderSuccessModal(newPo);
  };

  // Auto-GRN: Instant zero-typing ingestion into hospital batch ledger
  const handleTriggerAutoGrn = (po: InboundPurchaseOrder) => {
    try {
      // Ingest into local pharmacy storage if present
      const existingBatchesStr = localStorage.getItem('docsearch_pharmacy_batches');
      let batches: any[] = [];
      if (existingBatchesStr) {
        batches = JSON.parse(existingBatchesStr);
      }

      let count = 0;
      po.items.forEach(item => {
        const newBatch = {
          id: `batch-${Date.now()}-${count}`,
          batchNumber: item.allocatedBatch || `BATCH-B2B-${Date.now()}`,
          medicationCode: item.sku,
          brandName: item.name,
          currentStock: item.quantity,
          initialStock: item.quantity,
          expiryDate: item.expiryDate || '2028-12',
          mrp: item.mrpInr || item.unitPriceInr * 2.5,
          unitCost: item.unitPriceInr,
          status: 'ACTIVE',
          receivedDate: new Date().toISOString()
        };
        batches.unshift(newBatch);
        count++;
      });

      localStorage.setItem('docsearch_pharmacy_batches', JSON.stringify(batches));

      // Mark PO as Auto-GRN applied
      const updated = purchaseOrders.map(p => p.id === po.id ? { ...p, isAutoGrnApplied: true } : p);
      setPurchaseOrders(updated);
      b2bWholesaleSupplyService.savePurchaseOrders(updated);

      setAutoGrnToast(`✅ Auto-GRN Applied! ${count} items & batches automatically ingested into Hospital Pharmacy ledger without manual data entry.`);
      setTimeout(() => setAutoGrnToast(null), 5000);

      if (onAutoGrnCompleted) {
        onAutoGrnCompleted(count);
      }
    } catch (e) {
      console.error('Error applying Auto-GRN:', e);
    }
  };

  const handleOpenBoxScanner = (po?: InboundPurchaseOrder) => {
    setActiveScanningPo(po || (purchaseOrders[0] ?? null));
    setIsBoxScannerOpen(true);
  };

  const handleCameraAutoGrnCommitted = (reconciledCartons: ScannedCartonBatch[], totalUnits: number) => {
    if (activeScanningPo) {
      const updated = purchaseOrders.map((p) =>
        p.id === activeScanningPo.id ? { ...p, isAutoGrnApplied: true, status: 'DELIVERED' as const } : p
      );
      setPurchaseOrders(updated);
      b2bWholesaleSupplyService.savePurchaseOrders(updated);
    }
    setAutoGrnToast(
      `📹 Camera Auto-GRN Complete! ${reconciledCartons.length} Carton SKUs (${totalUnits} total units) successfully reconciled into hospital inventory.`
    );
    setTimeout(() => setAutoGrnToast(null), 6000);
    if (onAutoGrnCompleted) {
      onAutoGrnCompleted(totalUnits);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', color: '#F8FAFC' }}>
      {/* Top Banner: 100% Free ERP + B2B Wholesale Synergy */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(14, 165, 233, 0.12) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
            }}
          >
            🚚
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                DocSearch Direct Wholesale Depot & Auto-GRN Engine
              </h2>
              <Badge variant="success">100% Free ERP Partner Direct</Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#94A3B8' }}>
              Bulk Medicines, Lab Reagents & Surgical Equipment directly from manufacturers. Zero middleman margins + Zero-typing Auto-GRN.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={handleAutoLoadPredictiveCart}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚡</span> Smart Predictive Replenishment Cart
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsCartOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            <span>🛒</span> View Cart ({cartItemCount})
            {cartTotalAmount > 0 && <span>• ₹{cartTotalAmount.toLocaleString('en-IN')}</span>}
          </Button>
        </div>
      </div>

      {/* Regional Depot Geofencing SLA Bar */}
      <div
        style={{
          background: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📍</span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
              Fulfilling Depot: <span style={{ color: '#38BDF8' }}>{nearestDepot.name} ({nearestDepot.code})</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Hub: {nearestDepot.hubLocation} · Fleet: {nearestDepot.currentFleetCount} Units · Express SLA:{' '}
              <strong style={{ color: '#34D399' }}>{nearestDepot.expressSlaHours}h Delivery</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>Delivery Pincode:</label>
          <Input
            type="text"
            value={facilityPincode}
            onChange={(e) => setFacilityPincode(e.target.value)}
            placeholder="Pincode"
            style={{ width: '100px', fontWeight: 800, textAlign: 'center' }}
          />
          <Badge variant="success" size="sm">
            2°C - 8°C Cold Chain Active
          </Badge>
        </div>
      </div>

      {/* Auto-GRN Toast Notification */}
      {autoGrnToast && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1.5px solid #10B981',
            borderRadius: '12px',
            padding: '12px 18px',
            color: '#34D399',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <span>✨</span>
          <span>{autoGrnToast}</span>
        </div>
      )}

      {/* Navigation Tabs: Catalog vs My Orders */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E293B', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('CATALOG')}
            style={{
              background: activeTab === 'CATALOG' ? 'rgba(16, 185, 129, 0.18)' : '#1E293B',
              color: activeTab === 'CATALOG' ? '#34D399' : '#94A3B8',
              border: activeTab === 'CATALOG' ? '1px solid #10B981' : '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 18px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📦</span> Wholesale Catalog ({catalog.length} SKUs)
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('MY_ORDERS'); refreshOrders(); }}
            style={{
              background: activeTab === 'MY_ORDERS' ? 'rgba(56, 189, 248, 0.18)' : '#1E293B',
              color: activeTab === 'MY_ORDERS' ? '#38BDF8' : '#94A3B8',
              border: activeTab === 'MY_ORDERS' ? '1px solid #38BDF8' : '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 18px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🚚</span> Live Inbound Orders & Auto-GRN ({purchaseOrders.length})
          </button>
        </div>

        {activeTab === 'CATALOG' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Input
              type="text"
              placeholder="Search by drug name, chemical reagent, cannula, monitor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '340px' }}
            />
          </div>
        )}
      </div>

      {activeTab === 'CATALOG' ? (
        <>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Categories', icon: '🌐' },
              { id: 'PHARMACEUTICALS', label: 'Bulk Pharmaceuticals & IV Fluids', icon: '💊' },
              { id: 'LAB_CHEMICALS', label: 'Pathology Lab Reagents & Chemicals', icon: '🧪' },
              { id: 'EQUIPMENT_CONSUMABLES', label: 'Medical Consumables & Equipment', icon: '🩺' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                style={{
                  background: selectedCategory === cat.id ? 'rgba(56, 189, 248, 0.15)' : '#0F172A',
                  color: selectedCategory === cat.id ? '#38BDF8' : '#94A3B8',
                  border: selectedCategory === cat.id ? '1.5px solid #38BDF8' : '1px solid #1E293B',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Wholesale Items Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '16px'
            }}
          >
            {filteredCatalog.map(item => {
              const currentQty = cart[item.id] || 0;
              const effectivePrice = getItemPrice(item, currentQty > 0 ? currentQty : item.moq);
              const maxSavings = Math.max(...item.bulkTiers.map(t => t.savingsPercent));

              return (
                <Card key={item.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #1E293B', background: '#0B132B' }}>
                  <div>
                    {/* Header tags */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', background: '#1E293B', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {item.sku}
                        </span>
                        {item.badge && (
                          <span style={{ fontSize: '0.7rem', color: '#FCD34D', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '999px' }}>
                        Save up to {maxSavings}%
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px 0', lineHeight: 1.4 }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#38BDF8', margin: '0 0 8px 0', fontWeight: 600 }}>
                      {item.genericFormula}
                    </p>

                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span>Mfr: <strong style={{ color: '#E2E8F0' }}>{item.manufacturer}</strong></span>
                      <span>Pack: <strong style={{ color: '#E2E8F0' }}>{item.packSize}</strong></span>
                    </div>

                    {/* Cold Chain / Logistics alert */}
                    {item.temperatureControlled && (
                      <div style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid #06B6D4', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', color: '#67E8F9', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>❄️</span>
                        <span>{item.coldChainRange || 'Cold-Chain 2°C - 8°C Monitored Logistics'}</span>
                      </div>
                    )}

                    {/* Bulk Tier Badges */}
                    <div style={{ background: '#0F172A', borderRadius: '8px', padding: '8px 10px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Wholesale Bulk Volume Slabs (MOQ: {item.moq} packs):
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {item.bulkTiers.map((tier, tidx) => (
                          <div
                            key={tidx}
                            style={{
                              fontSize: '0.75rem',
                              background: '#1E293B',
                              border: '1px solid #334155',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: '#CBD5E1'
                            }}
                          >
                            <span style={{ color: '#94A3B8' }}>{tier.minQty}+: </span>
                            <strong style={{ color: '#34D399' }}>₹{tier.pricePerUnitInr}</strong>
                            <span style={{ color: '#10B981', fontSize: '0.7rem' }}> (-{tier.savingsPercent}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Add to Cart Action */}
                  <div style={{ borderTop: '1px solid #1E293B', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399' }}>
                          ₹{effectivePrice.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748B', textDecoration: 'line-through' }}>
                          MRP ₹{item.mrpInr}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        + {item.gstRate}% GST • Next-Day Dispatch
                      </div>
                    </div>

                    {currentQty > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1E293B', borderRadius: '8px', padding: '2px 6px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, currentQty - 1)}
                          style={{ background: 'transparent', border: 'none', color: '#F87171', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', padding: '2px 8px' }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#FFFFFF', minWidth: '24px', textAlign: 'center' }}>
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, currentQty + 1)}
                          style={{ background: 'transparent', border: 'none', color: '#34D399', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', padding: '2px 8px' }}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => handleAddToCart(item)}
                        style={{
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          padding: '6px 14px'
                        }}
                      >
                        + Add to PO
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        /* My Orders & Auto-GRN Desk */
        <Card title="Live Inbound Purchase Orders & Auto-GRN Desk">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0, maxWidth: '700px' }}>
              Track orders dispatched by DocSearch Central Depot. When an order arrives, use the <strong>High-Speed Camera Box Barcode Scanner</strong> to ingest carton barcodes simultaneously, or click <strong>"1-Click Auto-GRN"</strong>.
            </p>
            <Button
              variant="success"
              onClick={() => handleOpenBoxScanner()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              📹 Camera Box Auto-GRN Scanner
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number & Date</TableHead>
                  <TableHead>Items Summary</TableHead>
                  <TableHead>Order Total</TableHead>
                  <TableHead>Courier & AWB Tracking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auto-GRN Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <div style={{ fontWeight: 800, color: '#38BDF8' }}>{po.poNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{po.orderDate}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                        {po.items.length} Category Items
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {po.items.map(i => `${i.name.slice(0, 24)}... (x${i.quantity})`).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 800, color: '#34D399' }}>
                        ₹{po.totalAmountInr.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        Incl. GST ₹{po.gstInr.toLocaleString('en-IN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {po.transporterName ? (
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1' }}>{po.transporterName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#60A5FA', fontFamily: 'monospace' }}>AWB: {po.awbTrackingNumber}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Awaiting Dispatch</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          po.status === 'DELIVERED' ? 'success' :
                          po.status === 'DISPATCHED' ? 'primary' :
                          po.status === 'PROCESSING' ? 'warning' : 'neutral'
                        }
                      >
                        {po.status === 'DELIVERED' ? '🟢 DELIVERED' :
                         po.status === 'DISPATCHED' ? '🚚 IN TRANSIT' :
                         po.status === 'PROCESSING' ? '⚙️ PACKING' : '⏳ PENDING'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {po.isAutoGrnApplied ? (
                        <Badge variant="success">✅ GRN Ingested (0ms)</Badge>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <Button
                            variant="primary"
                            onClick={() => handleTriggerAutoGrn(po)}
                            style={{
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '4px 8px'
                            }}
                          >
                            ⚡ Auto-GRN
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleOpenBoxScanner(po)}
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '4px 8px',
                              backgroundColor: '#1E293B',
                              borderColor: '#38BDF8',
                              color: '#38BDF8'
                            }}
                          >
                            📹 Scan Box
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Cart Drawer / Modal */}
      <Dialog
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title="🛒 DocSearch Wholesale Requisition Cart"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#F8FAFC' }}>
          {cartItemsDetailed.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
              Your wholesale cart is empty. Browse the catalog or click "Smart Predictive Replenishment Cart".
            </div>
          ) : (
            <>
              <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cartItemsDetailed.map(({ item, qty, unitPrice, lineTotal, lineSavings }) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#0B132B',
                      border: '1px solid #1E293B',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#FFFFFF' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>{item.genericFormula} • {item.packSize}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                        Rate: <strong style={{ color: '#34D399' }}>₹{unitPrice}</strong> <span style={{ textDecoration: 'line-through' }}>MRP ₹{item.mrpInr}</span>
                        <span style={{ color: '#10B981', marginLeft: '6px' }}>(Saved ₹{lineSavings})</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1E293B', borderRadius: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, qty - 1)}
                          style={{ background: 'transparent', border: 'none', color: '#F87171', fontWeight: 800, padding: '2px 8px', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, qty + 1)}
                          style={{ background: 'transparent', border: 'none', color: '#34D399', fontWeight: 800, padding: '2px 8px', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '80px' }}>
                        <div style={{ fontWeight: 800, color: '#34D399' }}>₹{lineTotal.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Financials & Margins Summary */}
              <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '6px' }}>
                  <span>Subtotal:</span>
                  <span>₹{cartTotalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '6px' }}>
                  <span>GST (approx 12%):</span>
                  <span>₹{Math.round(cartTotalAmount * 0.12).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#10B981', fontWeight: 800, marginBottom: '8px' }}>
                  <span>Hospital Net Savings Against MRP:</span>
                  <span>₹{cartTotalSavings.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ borderTop: '1px solid #1E293B', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF' }}>
                  <span>Total Payable:</span>
                  <span style={{ color: '#38BDF8' }}>₹{(cartTotalAmount + Math.round(cartTotalAmount * 0.12)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button variant="secondary" onClick={() => setIsCartOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDispatchOrder}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    fontWeight: 800
                  }}
                >
                  🚀 Dispatch PO to DocSearch Depot
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Order Success Confirmation Modal */}
      {orderSuccessModal && (
        <Dialog
          isOpen={true}
          onClose={() => setOrderSuccessModal(null)}
          title="🎉 Wholesale Purchase Order Placed Successfully!"
        >
          <div style={{ textAlign: 'center', padding: '16px', color: '#F8FAFC' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🚚</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399', margin: '0 0 8px 0' }}>
              Order Number: {orderSuccessModal.poNumber}
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Your order for <strong>{orderSuccessModal.items.length} items</strong> (Total: ₹{orderSuccessModal.totalAmountInr.toLocaleString('en-IN')}) has been transmitted to <strong>DocSearch Central Fulfillment Depot</strong>.
            </p>
            <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '10px', padding: '12px', textAlign: 'left', fontSize: '0.8125rem', marginBottom: '20px' }}>
              <div>📦 <strong>Facility:</strong> {orderSuccessModal.hospitalName}</div>
              <div style={{ marginTop: '4px' }}>⚡ <strong>Fulfillment SLA:</strong> Same-day packing, Next-morning delivery</div>
              <div style={{ marginTop: '4px' }}>✨ <strong>Zero-Typing Auto-GRN:</strong> Upon delivery, batch numbers & MRP will automatically inject into your pharmacy.</div>
            </div>
            <Button
              variant="primary"
              onClick={() => { setOrderSuccessModal(null); setActiveTab('MY_ORDERS'); }}
              style={{ width: '100%', fontWeight: 800 }}
            >
              Track Order in Live Inbound Desk →
            </Button>
          </div>
        </Dialog>
      )}

      {/* High-Speed Camera Box Barcode Scanner Modal */}
      <HighSpeedCameraBoxScannerModal
        isOpen={isBoxScannerOpen}
        onClose={() => setIsBoxScannerOpen(false)}
        purchaseOrderId={activeScanningPo?.id}
        purchaseOrderNumber={activeScanningPo?.poNumber}
        supplierName={activeScanningPo?.assignedDepot ? `DocSearch Depot (${activeScanningPo.assignedDepot})` : undefined}
        expectedCartonCount={activeScanningPo ? activeScanningPo.items.length * 2 : 12}
        onAutoGrnCommitted={handleCameraAutoGrnCommitted}
      />
    </div>
  );
};
