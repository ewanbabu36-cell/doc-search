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
  centralSupplyChainService,
  type CentralCatalogItem,
  type HospitalPurchaseOrder,
  type SupplyCategory
} from '../../services/central-supply-chain-service.js';

export const CentralSupplyChainDomainManager: React.FC = () => {
  const [catalog, setCatalog] = useState<CentralCatalogItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<HospitalPurchaseOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'INBOUND_POS' | 'CATALOG_MARGINS' | 'ANALYTICS'>('INBOUND_POS');
  const [statusFilter, setStatusFilter] = useState<HospitalPurchaseOrder['status'] | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [dispatchModalOrder, setDispatchModalOrder] = useState<HospitalPurchaseOrder | null>(null);
  const [transporterInput, setTransporterInput] = useState('Delhivery Healthcare Express Fleet');
  const [awbInput, setAwbInput] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<SupplyCategory>('PHARMACEUTICALS');
  const [newItemGeneric, setNewItemGeneric] = useState('');
  const [newItemMfr, setNewItemMfr] = useState('');
  const [newItemPack, setNewItemPack] = useState('');
  const [newItemMoq, setNewItemMoq] = useState(2);
  const [newItemMrp, setNewItemMrp] = useState(150);
  const [newItemWholesale, setNewItemWholesale] = useState(65);
  const [newItemCost, setNewItemCost] = useState(48);
  const [newItemGst, setNewItemGst] = useState(12);

  const loadData = () => {
    setCatalog(centralSupplyChainService.getCatalog());
    setPurchaseOrders(centralSupplyChainService.getPurchaseOrders());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Financial KPI Calculations
  const totalGmv = useMemo(() => {
    return purchaseOrders.reduce((sum, po) => sum + po.totalAmountInr, 0);
  }, [purchaseOrders]);

  const totalDeliveredOrders = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'DELIVERED').length;
  }, [purchaseOrders]);

  const pendingFulfillmentCount = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'PENDING_APPROVAL' || po.status === 'PROCESSING').length;
  }, [purchaseOrders]);

  const estimatedGrossProfit = useMemo(() => {
    // Approx 18.5% average gross margin across wholesale orders
    return Math.round(totalGmv * 0.185);
  }, [totalGmv]);

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchStatus = statusFilter === 'ALL' || po.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        po.poNumber.toLowerCase().includes(q) ||
        po.hospitalName.toLowerCase().includes(q) ||
        po.items.some(i => i.name.toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [purchaseOrders, statusFilter, searchQuery]);

  // Actions
  const handleApprovePo = (poId: string) => {
    centralSupplyChainService.updateOrderStatus(poId, 'PROCESSING');
    loadData();
    showToast('Order approved! Batch inventory allocated at Central Depot.');
  };

  const handleOpenDispatch = (po: HospitalPurchaseOrder) => {
    setDispatchModalOrder(po);
    setAwbInput(`AWB-DS-${Math.floor(100000 + Math.random() * 900000)}IN`);
  };

  const handleConfirmDispatch = () => {
    if (!dispatchModalOrder) return;
    centralSupplyChainService.updateOrderStatus(dispatchModalOrder.id, 'DISPATCHED', {
      transporterName: transporterInput,
      awbTrackingNumber: awbInput
    });
    loadData();
    setDispatchModalOrder(null);
    showToast(`Order ${dispatchModalOrder.poNumber} dispatched via ${transporterInput} (AWB: ${awbInput})`);
  };

  const handleMarkDelivered = (poId: string) => {
    centralSupplyChainService.updateOrderStatus(poId, 'DELIVERED');
    loadData();
    showToast('Order marked DELIVERED! Cross-platform Auto-GRN triggered for destination hospital.');
  };

  const handleCreateCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemSku) return;

    centralSupplyChainService.addItemToCatalog({
      name: newItemName,
      sku: newItemSku,
      category: newItemCategory,
      genericFormula: newItemGeneric || newItemName,
      manufacturer: newItemMfr || 'DocSearch Direct Sourcing',
      packSize: newItemPack || 'Pack of 10 Units',
      moq: Number(newItemMoq) || 1,
      mrpInr: Number(newItemMrp) || 100,
      wholesalePriceInr: Number(newItemWholesale) || 50,
      sourcingCostInr: Number(newItemCost) || 35,
      bulkTiers: [
        { minQty: Number(newItemMoq) || 1, pricePerUnitInr: Number(newItemWholesale), savingsPercent: Math.round(((newItemMrp - newItemWholesale) / newItemMrp) * 100) },
        { minQty: (Number(newItemMoq) || 1) * 5, pricePerUnitInr: Math.round(Number(newItemWholesale) * 0.9), savingsPercent: Math.round(((newItemMrp - (newItemWholesale * 0.9)) / newItemMrp) * 100) }
      ],
      temperatureControlled: false,
      inStockQuantity: 5000,
      estimatedDeliveryDays: 1,
      hsnCode: '30049099',
      gstRate: Number(newItemGst) || 12,
      badge: '✨ Newly Added'
    });

    loadData();
    setIsAddItemOpen(false);
    showToast(`Added ${newItemName} to wholesale master catalog!`);
    
    // Reset form
    setNewItemName('');
    setNewItemSku('');
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', color: '#F8FAFC' }}>
      {/* Top Header & Platform Mission */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(14, 165, 233, 0.15) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '16px',
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)'
            }}
          >
            🚚
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                Central B2B Medical & Chemical Supply Chain HQ
              </h1>
              <Badge variant="success">Monetization Engine</Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#94A3B8' }}>
              Powering the 100% Free Hospital ERP Model: Sourcing medicines, lab reagents, and medical equipment at manufacturer cost with automated hospital fulfillment.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={loadData}
            style={{ fontWeight: 700 }}
          >
            🔄 Refresh Live POs
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddItemOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            + Add Wholesale SKU
          </Button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1.5px solid #10B981',
            borderRadius: '12px',
            padding: '12px 18px',
            color: '#34D399',
            fontWeight: 800,
            fontSize: '0.9rem',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          ✨ {successToast}
        </div>
      )}

      {/* KPI Cards: The Financial Engine */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        <Card style={{ background: '#0F172A', border: '1px solid #1E293B', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
            Total Supply GMV (Wholesale Orders)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8', marginTop: '6px' }}>
            ₹{totalGmv.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, marginTop: '4px' }}>
            ↗ +34.2% Month-over-Month Growth
          </div>
        </Card>

        <Card style={{ background: '#0F172A', border: '1px solid #1E293B', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
            Realized Gross Profit (Platform Margin)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
            ₹{estimatedGrossProfit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6EE7B7', fontWeight: 700, marginTop: '4px' }}>
            💰 18.5% Net Supply Chain Margin
          </div>
        </Card>

        <Card style={{ background: '#0F172A', border: '1px solid #1E293B', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
            Pending POs for Fulfillment
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: pendingFulfillmentCount > 0 ? '#F59E0B' : '#94A3B8', marginTop: '6px' }}>
            {pendingFulfillmentCount} Orders
          </div>
          <div style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 700, marginTop: '4px' }}>
            ⚡ Same-Day Warehouse Dispatch SLA
          </div>
        </Card>

        <Card style={{ background: '#0F172A', border: '1px solid #1E293B', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
            Auto-GRN Synced Deliveries
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#A855F7', marginTop: '6px' }}>
            {totalDeliveredOrders} Orders (100%)
          </div>
          <div style={{ fontSize: '0.75rem', color: '#C084FC', fontWeight: 700, marginTop: '4px' }}>
            ✨ Zero manual data entry for hospitals
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #1E293B', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('INBOUND_POS')}
          style={{
            background: activeTab === 'INBOUND_POS' ? 'rgba(56, 189, 248, 0.18)' : '#0F172A',
            color: activeTab === 'INBOUND_POS' ? '#38BDF8' : '#94A3B8',
            border: activeTab === 'INBOUND_POS' ? '1px solid #38BDF8' : '1px solid #1E293B',
            borderRadius: '10px',
            padding: '8px 18px',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>📥</span> Inbound Hospital Purchase Orders ({purchaseOrders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CATALOG_MARGINS')}
          style={{
            background: activeTab === 'CATALOG_MARGINS' ? 'rgba(16, 185, 129, 0.18)' : '#0F172A',
            color: activeTab === 'CATALOG_MARGINS' ? '#34D399' : '#94A3B8',
            border: activeTab === 'CATALOG_MARGINS' ? '1px solid #10B981' : '1px solid #1E293B',
            borderRadius: '10px',
            padding: '8px 18px',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>🏷️</span> Master Wholesale Catalog & Margins ({catalog.length} SKUs)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ANALYTICS')}
          style={{
            background: activeTab === 'ANALYTICS' ? 'rgba(168, 85, 247, 0.18)' : '#0F172A',
            color: activeTab === 'ANALYTICS' ? '#C084FC' : '#94A3B8',
            border: activeTab === 'ANALYTICS' ? '1px solid #A855F7' : '1px solid #1E293B',
            borderRadius: '10px',
            padding: '8px 18px',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>📊</span> Financial & Consumption Analytics
        </button>
      </div>

      {activeTab === 'INBOUND_POS' && (
        <Card title="Live Inbound Purchase Orders Stream (Cross-Hospital)">
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['ALL', 'PENDING_APPROVAL', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    background: statusFilter === st ? '#1E293B' : '#0B1120',
                    color: statusFilter === st ? '#38BDF8' : '#64748B',
                    border: `1px solid ${statusFilter === st ? '#38BDF8' : '#1E293B'}`,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <Input
              type="text"
              placeholder="Filter by PO#, hospital name, medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '300px' }}
            />
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number & Date</TableHead>
                  <TableHead>Hospital / Client Name</TableHead>
                  <TableHead>Items & Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Logistics / Tracking</TableHead>
                  <TableHead>Fulfillment Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <div style={{ fontWeight: 800, color: '#38BDF8' }}>{po.poNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{po.orderDate}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{po.hospitalName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#10B981' }}>100% Free ERP Tier Partner</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 800, color: '#34D399' }}>₹{po.totalAmountInr.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{po.items.length} SKUs requested</div>
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
                      {po.transporterName ? (
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>{po.transporterName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#60A5FA', fontFamily: 'monospace' }}>AWB: {po.awbTrackingNumber}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Awaiting Allocation</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {po.status === 'PENDING_APPROVAL' && (
                          <Button
                            variant="primary"
                            onClick={() => handleApprovePo(po.id)}
                            style={{ fontSize: '0.75rem', padding: '4px 8px', fontWeight: 800 }}
                          >
                            ✓ Approve PO
                          </Button>
                        )}

                        {po.status === 'PROCESSING' && (
                          <Button
                            variant="primary"
                            onClick={() => handleOpenDispatch(po)}
                            style={{
                              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              fontWeight: 800
                            }}
                          >
                            🚚 Dispatch Order
                          </Button>
                        )}

                        {po.status === 'DISPATCHED' && (
                          <Button
                            variant="primary"
                            onClick={() => handleMarkDelivered(po.id)}
                            style={{
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              fontWeight: 800
                            }}
                          >
                            ✓ Mark Delivered (Auto-GRN)
                          </Button>
                        )}

                        {po.status === 'DELIVERED' && (
                          <Badge variant="success">✅ Completed & Auto-GRN Synced</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 'CATALOG_MARGINS' && (
        <Card title="Master Wholesale Catalog & Profit Margin Desk">
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0 0 16px 0' }}>
            Configure sourcing cost from pharmaceutical & reagent manufacturers vs wholesale price offered to free hospitals.
          </p>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU & Name</TableHead>
                  <TableHead>Category & Pack</TableHead>
                  <TableHead>Sourcing Cost (What You Pay)</TableHead>
                  <TableHead>Wholesale Rate (To Hospital)</TableHead>
                  <TableHead>Hospital MRP</TableHead>
                  <TableHead>Your Gross Margin</TableHead>
                  <TableHead>Depot Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.map(item => {
                  const unitMargin = item.wholesalePriceInr - item.sourcingCostInr;
                  const marginPct = Math.round((unitMargin / item.wholesalePriceInr) * 100);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>{item.sku} • {item.genericFormula}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{item.category}</Badge>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>{item.packSize}</div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 800, color: '#F87171' }}>₹{item.sourcingCostInr}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Direct Mfr Contract</div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 800, color: '#38BDF8' }}>₹{item.wholesalePriceInr}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>B2B Portal Price</div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 700, color: '#94A3B8' }}>₹{item.mrpInr}</div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 900, color: '#34D399' }}>
                          +₹{unitMargin} ({marginPct}%)
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 700, color: item.inStockQuantity > 500 ? '#34D399' : '#F59E0B' }}>
                          {item.inStockQuantity.toLocaleString('en-IN')} units
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 'ANALYTICS' && (
        <Card title="Supply Chain Margin Breakdown & Hospital Consumption Velocity">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#070C16', border: '1px solid #1E293B', borderRadius: '12px', padding: '18px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px 0' }}>
                💰 Margin by Product Category
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>💊 Bulk Pharmaceuticals & IV Fluids:</span>
                  <strong style={{ color: '#38BDF8' }}>22% - 28% Margin (High Velocity)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>🧪 Pathology Lab Reagents & Chemicals:</span>
                  <strong style={{ color: '#10B981' }}>35% - 48% Margin (High Value)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>🩺 Medical Equipment & Consumables:</span>
                  <strong style={{ color: '#A855F7' }}>25% - 38% Margin (Recurring)</strong>
                </div>
              </div>
            </div>

            <div style={{ background: '#070C16', border: '1px solid #1E293B', borderRadius: '12px', padding: '18px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px 0' }}>
                🏥 Top Consuming Free Hospital Partners
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Apollo Cradle & Children Hospital:</span>
                  <strong style={{ color: '#34D399' }}>₹14,50,000 / mo</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Metro Multispecialty & Trauma:</span>
                  <strong style={{ color: '#34D399' }}>₹11,80,000 / mo</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Narayana Super Diagnostics:</span>
                  <strong style={{ color: '#34D399' }}>₹8,25,000 / mo</strong>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Dispatch Modal */}
      {dispatchModalOrder && (
        <Dialog
          isOpen={true}
          onClose={() => setDispatchModalOrder(null)}
          title={`🚚 Dispatch Order: ${dispatchModalOrder.poNumber}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: '#F8FAFC' }}>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
              Hospital: <strong>{dispatchModalOrder.hospitalName}</strong> (Total: ₹{dispatchModalOrder.totalAmountInr.toLocaleString('en-IN')})
            </p>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>Assigned Transporter / Cold-Chain Fleet</label>
              <Input
                type="text"
                value={transporterInput}
                onChange={(e) => setTransporterInput(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>AWB / Courier Docket Number</label>
              <Input
                type="text"
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="secondary" onClick={() => setDispatchModalOrder(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmDispatch}
                style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', fontWeight: 800 }}
              >
                Confirm Dispatch & Notify Hospital
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Add Wholesale SKU Modal */}
      {isAddItemOpen && (
        <Dialog
          isOpen={true}
          onClose={() => setIsAddItemOpen(false)}
          title="+ Add New Wholesale Catalog SKU"
        >
          <form onSubmit={handleCreateCatalogItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#F8FAFC' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>Item Brand / Commercial Name</label>
              <Input
                type="text"
                placeholder="e.g. Meropenem 1g Injection IP"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>SKU Code</label>
                <Input
                  type="text"
                  placeholder="e.g. MED-MERO-1G"
                  value={newItemSku}
                  onChange={(e) => setNewItemSku(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as SupplyCategory)}
                  style={{ width: '100%', padding: '8px', background: '#0F172A', color: '#FFFFFF', border: '1px solid #1E293B', borderRadius: '8px' }}
                >
                  <option value="PHARMACEUTICALS">Bulk Pharmaceuticals & IV</option>
                  <option value="LAB_CHEMICALS">Lab Reagents & Chemicals</option>
                  <option value="EQUIPMENT_CONSUMABLES">Medical Consumables & Equipment</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>Active Molecule / Generic Formula</label>
              <Input
                type="text"
                placeholder="e.g. Meropenem Trihydrate 1000mg"
                value={newItemGeneric}
                onChange={(e) => setNewItemGeneric(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>Manufacturer</label>
                <Input
                  type="text"
                  placeholder="e.g. Cipla / Alkem / Transasia"
                  value={newItemMfr}
                  onChange={(e) => setNewItemMfr(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>Pack Size</label>
                <Input
                  type="text"
                  placeholder="e.g. Pack of 10 Vials / 5L Can"
                  value={newItemPack}
                  onChange={(e) => setNewItemPack(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>MOQ (Min Order Qty)</label>
                <Input
                  type="number"
                  value={newItemMoq}
                  onChange={(e) => setNewItemMoq(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>GST Rate (%)</label>
                <Input
                  type="number"
                  value={newItemGst}
                  onChange={(e) => setNewItemGst(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F87171' }}>Sourcing Cost (₹)</label>
                <Input
                  type="number"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(Number(e.target.value))}
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8' }}>Wholesale Price (₹)</label>
                <Input
                  type="number"
                  value={newItemWholesale}
                  onChange={(e) => setNewItemWholesale(Number(e.target.value))}
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>Hospital MRP (₹)</label>
                <Input
                  type="number"
                  value={newItemMrp}
                  onChange={(e) => setNewItemMrp(Number(e.target.value))}
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="secondary" onClick={() => setIsAddItemOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', fontWeight: 800 }}
              >
                Save to Master Catalog
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
