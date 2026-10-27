import React, { useState, useEffect } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

export const JanAushadhiGenericSubstitutionView: React.FC = () => {
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [refillRadars, setRefillRadars] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PMBJP_SUBSTITUTE' | 'REFILL_RADAR'>('PMBJP_SUBSTITUTE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [subs, radars] = await Promise.all([
          apiRequest<any>(`/api/v1/partner/pharmacy/generic-substitutions${searchQuery ? `?q=${searchQuery}` : ''}`),
          apiRequest<any[]>('/api/v1/partner/pharmacy/chronic-refills/radar')
        ]);
        if (subs.success && Array.isArray(subs.data)) setSubstitutions(subs.data);
        if (radars.success && Array.isArray(radars.data)) setRefillRadars(radars.data);
      } catch (err) {
        console.warn('Pharmacy generic load notice:', err);
      }
    }
    loadData();
  }, [searchQuery]);

  const handleDispatchWhatsApp = async (radarId: string, patientName: string) => {
    try {
      const res = await apiRequest<any>('/api/v1/partner/pharmacy/chronic-refills/dispatch-reminder', {
        method: 'POST',
        body: JSON.stringify({ radarId })
      });
      if (res.success) {
        setRefillRadars((prev) =>
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
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          backgroundColor: '#064E3B',
          border: '1.5px solid #10B981',
          color: '#A7F3D0',
          padding: '12px 18px',
          borderRadius: '10px',
          fontWeight: 700,
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Header Banner - PMBJP & Refill Radar */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1.5px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '18px',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>💊</span>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
              Jan Aushadhi (PMBJP) Generic Substitution & Margin Optimizer
            </h2>
            <Badge variant="success">Tata 1mg / PharmEasy Benchmark</Badge>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#CBD5E1' }}>
            Patients save <strong>75%–84%</strong> on essential medications while hospital pharmacy retains <strong>60%+ gross margins</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('PMBJP_SUBSTITUTE')}
            style={{
              backgroundColor: activeTab === 'PMBJP_SUBSTITUTE' ? '#0284C7' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'PMBJP_SUBSTITUTE' ? '#FFF' : '#CBD5E1',
              border: `1.5px solid ${activeTab === 'PMBJP_SUBSTITUTE' ? '#38BDF8' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            🔄 Jan Aushadhi Substitutions ({substitutions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REFILL_RADAR')}
            style={{
              backgroundColor: activeTab === 'REFILL_RADAR' ? '#F59E0B' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'REFILL_RADAR' ? '#000' : '#CBD5E1',
              border: `1.5px solid ${activeTab === 'REFILL_RADAR' ? '#FCD34D' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            🎯 Chronic Refill Radar ({refillRadars.length} Due)
          </button>
        </div>
      </div>

      {/* TAB 1: GENERIC SUBSTITUTION CATALOG */}
      {activeTab === 'PMBJP_SUBSTITUTE' && (
        <Card title="Pradhan Mantri Jan Aushadhi Pariyojana (PMBJP) Generic Formulary Mapping" padding="none">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              type="text"
              placeholder="🔍 Search Brand (e.g. Augmentin, Pan D, Glycomet, Telma) or Salt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '450px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFF',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prescribed Brand Medicine</TableHead>
                  <TableHead>Brand MRP</TableHead>
                  <TableHead>Jan Aushadhi Generic Substitute</TableHead>
                  <TableHead>Generic MRP</TableHead>
                  <TableHead>Patient Savings</TableHead>
                  <TableHead>Hospital Gross Margin</TableHead>
                  <TableHead>Formulary Batches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {substitutions.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>{sub.brandMedicationName}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{sub.brandComposition}</div>
                    </TableCell>
                    <TableCell>
                      <span style={{ textDecoration: 'line-through', color: '#F87171', fontWeight: 700 }}>
                        ₹{Number(sub.brandMrp).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#34D399', fontWeight: 800 }}>{sub.pmbjpGenericName}</span>
                        <Badge variant="primary">{sub.pmbjpGenericCode}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#34D399', fontSize: '1.05rem' }}>
                        ₹{Number(sub.pmbjpMrp).toFixed(2)}
                      </strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Save {sub.patientSavingsPct}%</Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: '#FBBF24', fontWeight: 800 }}>{sub.hospitalMarginPct}% Margin</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>{sub.inStockBatchesCount} batches in stock</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 2: CHRONIC REFILL RADAR */}
      {activeTab === 'REFILL_RADAR' && (
        <Card title="Automated Chronic Patient 30-Day Medication Exhaustion Radar" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Details</TableHead>
                  <TableHead>Chronic Medication</TableHead>
                  <TableHead>Dosage Schedule</TableHead>
                  <TableHead>Dispensed Date</TableHead>
                  <TableHead>Exhaustion Due Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead>Status & 1-Click WhatsApp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refillRadars.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC' }}>{r.patientName}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>📞 {r.patientPhone}</div>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: '#38BDF8', fontWeight: 700 }}>{r.medicationName}</span>
                    </TableCell>
                    <TableCell>
                      <span>{r.dailyDosagePills} pill/day ({r.daysSupplied} days pack)</span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                      {new Date(r.dispensedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                      {new Date(r.exhaustionDueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.daysRemaining <= 2 ? 'danger' : 'warning'}>
                        ⚠️ {r.daysRemaining} days left
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.whatsappRefillDispatched ? (
                        <Badge variant="success">✓ WhatsApp Alert Dispatched</Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDispatchWhatsApp(r.id, r.patientName)}
                          style={{
                            backgroundColor: '#25D366',
                            color: '#000',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          📲 Send 1-Click WhatsApp Refill
                        </button>
                      )}
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
