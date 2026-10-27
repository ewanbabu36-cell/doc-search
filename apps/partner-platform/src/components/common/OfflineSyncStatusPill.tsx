import React, { useState, useEffect } from 'react';
import { Button } from '@docsearch/ui-kit';
import { offlineSyncService, type OfflineSyncState } from '../../services/offline-sync-service.js';

export const OfflineSyncStatusPill: React.FC = () => {
  const [syncState, setSyncState] = useState<OfflineSyncState>(offlineSyncService.getState());

  useEffect(() => {
    return offlineSyncService.subscribe((state) => {
      setSyncState(state);
    });
  }, []);

  const totalPending = syncState.pendingTokensCount + syncState.pendingReceiptsCount;

  const handleManualSync = () => {
    void offlineSyncService.replayOfflineMutations();
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        backgroundColor: syncState.isOnline
          ? totalPending > 0
            ? '#fffbeb'
            : '#f0fdf4'
          : '#fef2f2',
        border: `1px solid ${
          syncState.isOnline
            ? totalPending > 0
              ? '#fde68a'
              : '#bbf7d0'
            : '#fecaca'
        }`
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: syncState.isOnline ? (totalPending > 0 ? '#f59e0b' : '#10b981') : '#ef4444',
          display: 'inline-block'
        }}
      />
      <span style={{ fontWeight: 600, color: syncState.isOnline ? '#1e293b' : '#991b1b' }}>
        {syncState.isOnline ? (totalPending > 0 ? `Online (${totalPending} Buffered)` : 'Online • Synced') : `Offline (${totalPending} Cached)`}
      </span>

      {totalPending > 0 && syncState.isOnline && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualSync}
          disabled={syncState.isSyncing}
        >
          {syncState.isSyncing ? 'Replaying...' : '⚡ Sync'}
        </Button>
      )}
    </div>
  );
};
