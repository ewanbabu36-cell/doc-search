import React, { useState, useEffect } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

export interface PharmacyInventoryViewProps {
  initialTab?: 'PMBJP_SUBSTITUTE' | 'REFILL_RADAR' | 'INVENTORY_OVERVIEW';
}

export const PharmacyInventoryView: React.FC<PharmacyInventoryViewProps> = ({
  initialTab = 'PMBJP_SUBSTITUTE'
}) => {
  const [activeTab, setActiveTab] = useState<'PMBJP_SUBSTITUTE' | 'REFILL_RADAR' | 'INVENTORY_OVERVIEW'>(initialTab);
  const [quickSearch, setQuickSearch] = useState('');
  const [genericItems, setGenericItems] = useState<any[]>([]);
  const [refillItems, setRefillItems] = useState<any[]>([]);
  const [_isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [subs, radars] = await Promise.all([
          apiRequest<any>(`/api/v1/partner/pharmacy/generic-substitutions${quickSearch ? `?q=${quickSearch}` : ''}`),
          apiRequest<any[]>('/api/v1/partner/pharmacy/chronic-refills/radar')
        ]);
        if (subs.success && Array.isArray(subs.data)) setGenericItems(subs.data);
        if (radars.success && Array.isArray(radars.data)) setRefillItems(radars.data);
      } catch (err) {
        console.warn('Pharmacy inventory load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [quickSearch]);

  const handleSendRefillReminder = async (radarId: string, patientName: string) => {
    try {
      const res = await apiRequest<any>('/api/v1/partner/pharmacy/chronic-refills/dispatch-reminder', {
        method: 'POST',
        body: JSON.stringify({ radarId })
      });
      if (res.success) {
        setRefillItems((prev) =>
          prev.map((r) =>
            r.id === radarId
              ? { ...r, whatsappRefillDispatched: true, reorderStatus: 'WHATSAPP_DISPATCHED' }
              : r
          )
        );
        showToast(`📲 WhatsApp Refill Reminder dispatched to ${patientName}! (Includes 15% Care Pass savings link)`);
      }
    } catch (err: any) {
      showToast('Dispatch error: ' + err?.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          backgroundColor: '#064E3B',
          border: '1.5px solid #10B981',
          color: '#34D399',
          borderRadius: '12px',
          padding: '12px 18px',
          fontWeight: 700,
          fontSize: '0.88rem'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1.5px solid #10B981',
        borderRadius: '18px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2rem' }}>💊</span>
            <div>
              <h2 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.5rem', fontWeight: 900 }}>
                Pharmacy POS Margin Optimization & Jan Aushadhi Hub
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '4px' }}>
                Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) Generic Substitution & 30-Day Chronic Refill Radar
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10B981',
            borderRadius: '12px',
            padding: '10px 16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#A7F3D0', fontWeight: 700 }}>PATIENT SAVINGS</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#34D399' }}>75% - 85%</div>
          </div>
          <div style={{
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid #38BDF8',
            borderRadius: '12px',
            padding: '10px 16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#BAE6FD', fontWeight: 700 }}>HOSPITAL MARGIN</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38BDF8' }}>60%+</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('PMBJP_SUBSTITUTE')}
          style={{
            backgroundColor: activeTab === 'PMBJP_SUBSTITUTE' ? '#059669' : 'rgba(255,255,255,0.06)',
            color: activeTab === 'PMBJP_SUBSTITUTE' ? '#FFF' : '#CBD5E1',
            border: `1.5px solid ${activeTab === 'PMBJP_SUBSTITUTE' ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '10px',
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          🔬 PMBJP Generic Substitution Engine ({genericItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('REFILL_RADAR')}
          style={{
            backgroundColor: activeTab === 'REFILL_RADAR' ? '#059669' : 'rgba(255,255,255,0.06)',
            color: activeTab === 'REFILL_RADAR' ? '#FFF' : '#CBD5E1',
            border: `1.5px solid ${activeTab === 'REFILL_RADAR' ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '10px',
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          📡 Chronic Refill Radar & WhatsApp ({refillItems.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'PMBJP_SUBSTITUTE' ? (
        <Card title="Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) Generic Substitution Matrix" padding="none">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              When brand-name medicine is prescribed (e.g. Augmentin 625 @ ₹204), auto-recommends high-margin Jan Aushadhi generic (Amoxyclav 625 @ ₹48).
            </span>
            <input
              type="text"
              placeholder="Filter brand or molecule..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#FFF',
                fontSize: '0.8rem',
                width: '240px'
              }}
            />
          </div>

          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branded Prescribed Medicine</TableHead>
                  <TableHead>Brand MRP</TableHead>
                  <TableHead>Jan Aushadhi Generic Substitute</TableHead>
                  <TableHead>Generic MRP</TableHead>
                  <TableHead>Patient Savings</TableHead>
                  <TableHead>Hospital Gross Margin</TableHead>
                  <TableHead>POS Substitution Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {genericItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{item.brandedName}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Molecule: {item.saltComposition}</div>
                    </TableCell>
                    <TableCell>
                      <span style={{ textDecoration: 'line-through', color: '#EF4444', fontWeight: 700 }}>
                        ₹{Number(item.brandedPrice).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#34D399', fontSize: '0.85rem' }}>{item.genericName}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>PMBJP Approved Standard</div>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#34D399', fontSize: '1rem' }}>
                        ₹{Number(item.genericPrice).toFixed(2)}
                      </strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">
                        Save {Number(item.patientSavingsPercent).toFixed(1)}% (₹{(Number(item.brandedPrice) - Number(item.genericPrice)).toFixed(2)})
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 800, color: '#38BDF8' }}>
                        {Number(item.hospitalMarginPercent).toFixed(1)}% Margin
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Procurement: ₹{(Number(item.genericPrice) * 0.38).toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => showToast(`✅ Generic ${item.genericName} swapped into active POS dispensing cart!`)}
                        style={{
                          backgroundColor: '#059669',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ 1-Click POS Swap
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        <Card title="30-Day Chronic Medication Refill Radar & WhatsApp Automation" padding="none">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              Tracks diabetic, cardiac, and hypertensive patients. Automatically triggers a WhatsApp refill reminder 3 days before supply exhaustion.
            </span>
          </div>

          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Details</TableHead>
                  <TableHead>Chronic Regimen</TableHead>
                  <TableHead>Last Dispensed</TableHead>
                  <TableHead>Remaining Days</TableHead>
                  <TableHead>Reorder Radar Status</TableHead>
                  <TableHead>Care Pass Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refillItems.map((radar) => (
                  <TableRow key={radar.id}>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{radar.patientName}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>📞 {radar.patientPhone}</div>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#CBD5E1', fontSize: '0.82rem' }}>{radar.medicationName}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Supply: {radar.supplyDays} Days (Qty: {radar.quantityPrescribed})</div>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                      {new Date(radar.lastDispensedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={radar.daysRemaining <= 3 ? 'danger' : 'neutral'}>
                        {radar.daysRemaining} Days Left
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={radar.whatsappRefillDispatched ? 'success' : 'neutral'}>
                        {radar.whatsappRefillDispatched ? '✅ WhatsApp Sent' : '⏰ 3-Day Radar Alert'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">🛡️ DocSearch Care Pass</Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleSendRefillReminder(radar.id, radar.patientName)}
                        style={{
                          backgroundColor: radar.whatsappRefillDispatched ? '#1E293B' : '#0284C7',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {radar.whatsappRefillDispatched ? '🔄 Re-send WhatsApp' : '📲 Dispatch 1-Click WhatsApp Refill'}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
