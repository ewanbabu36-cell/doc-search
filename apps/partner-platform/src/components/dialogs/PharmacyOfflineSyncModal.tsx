import React, { useState, useEffect } from 'react';
import {
  pharmacyOfflineStorageService,
  type OfflineInvoice
} from '../../services/pharmacy-offline-storage-service.js';
import {
  pharmacySyncEngine,
  type SyncEngineResult,
  type SyncEngineState
} from '../../services/pharmacy-sync-engine.js';
import { serviceWorkerCompanion } from '../../services/service-worker-companion.js';

export interface PharmacyOfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PharmacyOfflineSyncModal: React.FC<PharmacyOfflineSyncModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isOffline, setIsOffline] = useState(pharmacyOfflineStorageService.isOffline());
  const [isSimulated, setIsSimulated] = useState(pharmacyOfflineStorageService.isSimulatedOffline());
  const [syncState, setSyncState] = useState<SyncEngineState>(pharmacySyncEngine.getState());
  const [lastSyncResult, setLastSyncResult] = useState<SyncEngineResult | null>(pharmacySyncEngine.getLastResult());
  const [offlineInvoices, setOfflineInvoices] = useState<OfflineInvoice[]>([]);
  const [metaSummary, setMetaSummary] = useState<{
    lastSnapshotAt: string | null;
    medicationCount: number;
    batchCount: number;
    pendingQueueCount: number;
    totalOfflineInvoicesCount: number;
  }>({
    lastSnapshotAt: null,
    medicationCount: 0,
    batchCount: 0,
    pendingQueueCount: 0,
    totalOfflineInvoicesCount: 0
  });
  const [isSwRegistered, setIsSwRegistered] = useState(false);
  const [isBackgroundSyncReady, setIsBackgroundSyncReady] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);

  // Load summary and subscribe to events
  const refreshModalData = async () => {
    const summary = await pharmacyOfflineStorageService.getMetaSummary();
    const invoices = await pharmacyOfflineStorageService.getAllOfflineInvoices();
    setMetaSummary(summary);
    setOfflineInvoices(invoices);

    const swStatus = await serviceWorkerCompanion.getStatus();
    setIsSwRegistered(swStatus.isRegistered);
    setIsBackgroundSyncReady(swStatus.isBackgroundSyncSupported);
  };

  useEffect(() => {
    if (!isOpen) return;

    void refreshModalData();

    const unsubStatus = pharmacyOfflineStorageService.subscribeStatus((offline) => {
      setIsOffline(offline);
      setIsSimulated(pharmacyOfflineStorageService.isSimulatedOffline());
      void refreshModalData();
    });

    const unsubSync = pharmacySyncEngine.subscribe((state, res) => {
      setSyncState(state);
      setLastSyncResult(res);
      void refreshModalData();
    });

    return () => {
      unsubStatus();
      unsubSync();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSimulate = () => {
    const next = !isSimulated;
    pharmacyOfflineStorageService.setSimulatedOffline(next);
    setIsSimulated(next);
  };

  const handleForceSync = async () => {
    await pharmacySyncEngine.triggerSync();
    await refreshModalData();
  };

  const handleRefreshCache = async () => {
    setIsRefreshingCache(true);
    try {
      await pharmacySyncEngine.refreshInventorySnapshot();
      await refreshModalData();
    } finally {
      setIsRefreshingCache(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#F8FAFC',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid #1E293B',
            backgroundColor: '#1E293B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>📡</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Offline-First PWA & Background Sync Vault
                <span
                  style={{
                    backgroundColor: isOffline ? '#EF4444' : '#10B981',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 700
                  }}
                >
                  {isOffline ? '🔴 OFFLINE COUNTER' : '🟢 ONLINE / CLOUD CONNECTED'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Tier-2/3 Indian Chemist Counter Resilience — Zero-downtime IndexedDB billing & silent sync
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.3rem',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Ground Reality Alert Banner */}
          <div
            style={{
              backgroundColor: isOffline ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: `1px solid ${isOffline ? '#EF4444' : '#10B981'}`,
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: isOffline ? '#FCA5A5' : '#6EE7B7' }}>
                {isOffline
                  ? '⚡ Counter chal raha hai! Internet disconnected hai lekin bills IndexedDB me save ho rahe hain.'
                  : '✓ System cloud se synced hai. Net down hone par counter automatic offline mode me switch hoga.'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '3px' }}>
                Thermal print immediate chalega, batch stock local ghatega, aur internet aate hi Service Worker silently sync karega.
              </div>
            </div>

            {/* Offline Simulation Button */}
            <button
              onClick={handleToggleSimulate}
              style={{
                backgroundColor: isSimulated ? '#DC2626' : '#334155',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.15s'
              }}
            >
              {isSimulated ? 'Exit Offline Simulation' : '🧪 Simulate Internet Drop'}
            </button>
          </div>

          {/* KPI Dashboard Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Card 1: Cached Products */}
            <div style={{ backgroundColor: '#1E293B', padding: '14px 18px', borderRadius: '10px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Cached Formulary</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38BDF8', marginTop: '4px' }}>
                {metaSummary.medicationCount} Drugs
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                IndexedDB Store: inventory_medications
              </div>
            </div>

            {/* Card 2: Cached Batches */}
            <div style={{ backgroundColor: '#1E293B', padding: '14px 18px', borderRadius: '10px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Active FEFO Batches</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#A855F7', marginTop: '4px' }}>
                {metaSummary.batchCount} Batches
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                With stock, batch # & expiry dates
              </div>
            </div>

            {/* Card 3: Pending Queue */}
            <div style={{ backgroundColor: '#1E293B', padding: '14px 18px', borderRadius: '10px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Pending Sync Queue</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: metaSummary.pendingQueueCount > 0 ? '#F59E0B' : '#10B981', marginTop: '4px' }}>
                {metaSummary.pendingQueueCount} Bills
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                {metaSummary.pendingQueueCount > 0 ? 'Awaiting cloud sync' : 'All local bills synchronized'}
              </div>
            </div>

            {/* Card 4: PWA / Background Sync Status */}
            <div style={{ backgroundColor: '#1E293B', padding: '14px 18px', borderRadius: '10px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Service Worker</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isSwRegistered ? '#10B981' : '#F59E0B', marginTop: '6px' }}>
                {isSwRegistered ? '✓ Active & Ready' : 'Standby'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                SyncManager: {isBackgroundSyncReady ? 'Supported' : 'Online-Event Fallback'}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#1E293B',
              padding: '12px 18px',
              borderRadius: '10px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleForceSync}
                disabled={syncState === 'SYNCING' || isOffline || metaSummary.pendingQueueCount === 0}
                style={{
                  backgroundColor: syncState === 'SYNCING' ? '#64748B' : isOffline ? '#334155' : '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: syncState === 'SYNCING' || isOffline || metaSummary.pendingQueueCount === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {syncState === 'SYNCING' ? '🔄 Syncing With Fastify...' : '⚡ Force Sync Now'}
              </button>

              <button
                onClick={handleRefreshCache}
                disabled={isRefreshingCache || isOffline}
                style={{
                  backgroundColor: '#334155',
                  color: '#CBD5E1',
                  border: '1px solid #475569',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isRefreshingCache || isOffline ? 'not-allowed' : 'pointer'
                }}
              >
                {isRefreshingCache ? '⏳ Refreshing...' : '🔄 Refresh Drug Formulary Cache'}
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              Last Cloud Snapshot: {metaSummary.lastSnapshotAt ? new Date(metaSummary.lastSnapshotAt).toLocaleTimeString() : 'Never'}
            </div>
          </div>

          {/* Last Sync Result Toast */}
          {lastSyncResult && (
            <div
              style={{
                backgroundColor: lastSyncResult.failedCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${lastSyncResult.failedCount > 0 ? '#EF4444' : '#10B981'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <strong>Sync Report:</strong> {lastSyncResult.syncedCount} bills ingested, {lastSyncResult.duplicateCount} duplicate skips (idempotent), {lastSyncResult.failedCount} errors.
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {new Date(lastSyncResult.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Offline Invoices History & Queue Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#F1F5F9' }}>
                Locally Generated Offline Bills Register ({offlineInvoices.length})
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Stored locally in IndexedDB store: offline_invoices
              </div>
            </div>

            {offlineInvoices.length === 0 ? (
              <div
                style={{
                  padding: '36px',
                  textAlign: 'center',
                  backgroundColor: '#1E293B',
                  borderRadius: '10px',
                  color: '#64748B',
                  fontSize: '0.88rem'
                }}
              >
                No offline bills recorded yet. All counter transactions are currently routed online.
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#1E293B'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #334155', color: '#94A3B8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Bill #</th>
                      <th style={{ padding: '10px 14px' }}>Billed Time</th>
                      <th style={{ padding: '10px 14px' }}>Patient / Phone</th>
                      <th style={{ padding: '10px 14px' }}>Items</th>
                      <th style={{ padding: '10px 14px' }}>Amount</th>
                      <th style={{ padding: '10px 14px' }}>Payment</th>
                      <th style={{ padding: '10px 14px' }}>Sync Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offlineInvoices.map((inv) => (
                      <tr
                        key={inv.invoiceNumber}
                        style={{
                          borderBottom: '1px solid #334155',
                          transition: 'background-color 0.1s'
                        }}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#38BDF8' }}>
                          {inv.invoiceNumber}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#94A3B8' }}>
                          {new Date(inv.createdAt).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 500, color: '#F8FAFC' }}>{inv.patientName}</div>
                          {inv.patientPhone && <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{inv.patientPhone}</div>}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#E2E8F0' }}>
                          {inv.items.length} items ({inv.items.map((i) => i.drugName).join(', ').slice(0, 30)}...)
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#10B981' }}>
                          ₹{inv.grandTotal.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#CBD5E1' }}>
                          {inv.paymentMode}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor:
                                inv.syncStatus === 'SYNCED'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : inv.syncStatus === 'SYNCING'
                                  ? 'rgba(56, 189, 248, 0.2)'
                                  : inv.syncStatus === 'FAILED'
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : 'rgba(245, 158, 11, 0.2)',
                              color:
                                inv.syncStatus === 'SYNCED'
                                  ? '#34D399'
                                  : inv.syncStatus === 'SYNCING'
                                  ? '#38BDF8'
                                  : inv.syncStatus === 'FAILED'
                                  ? '#F87171'
                                  : '#FBBF24'
                            }}
                          >
                            {inv.syncStatus === 'SYNCED'
                              ? '✓ Cloud Synced'
                              : inv.syncStatus === 'SYNCING'
                              ? '🔄 Syncing'
                              : inv.syncStatus === 'FAILED'
                              ? '⚠️ Failed Retry'
                              : '⏳ Pending Sync'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #1E293B',
            backgroundColor: '#1E293B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Fastify Cloud Sync Endpoint: <code>POST /api/v1/partner/pharmacy/sync-offline-invoices</code>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
