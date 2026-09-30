import { useState, useEffect, useCallback } from 'react';
import { pwaCompanion, type PwaState } from '../services/pwa-companion.js';
import { universalOfflineOutbox } from '../services/universal-offline-outbox.js';

export function usePwa() {
  const [pwaState, setPwaState] = useState<PwaState>(pwaCompanion.getState());
  const [outboxCount, setOutboxCount] = useState<number>(0);
  const [isOutboxSyncing, setIsOutboxSyncing] = useState<boolean>(false);

  useEffect(() => {
    // 1. Subscribe to PWA status (installable, standalone, online, updates)
    const unsubPwa = pwaCompanion.subscribe((state) => {
      setPwaState(state);
    });

    // 2. Subscribe to universal offline outbox status
    const unsubOutbox = universalOfflineOutbox.subscribe((count, isSyncing) => {
      setOutboxCount(count);
      setIsOutboxSyncing(isSyncing);
    });

    return () => {
      unsubPwa();
      unsubOutbox();
    };
  }, []);

  const installApp = useCallback(async () => {
    return await pwaCompanion.promptInstall();
  }, []);

  const updateApp = useCallback(() => {
    pwaCompanion.updateApp();
  }, []);

  return {
    ...pwaState,
    outboxCount,
    isOutboxSyncing,
    installApp,
    updateApp
  };
}
