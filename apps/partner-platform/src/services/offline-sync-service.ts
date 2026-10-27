/**
 * DOCSEARCH OFFLINE-FIRST PWA CACHE & BATCH REPLAY SYNCHRONIZER
 * Epic Systems / District Hospital Standard: Uninterrupted OPD Token & Cashiering
 */

export interface OfflineTokenItem {
  id: string; // Client UUID
  idempotencyKey: string;
  patientName: string;
  patientPhone: string;
  departmentId: string;
  departmentName: string;
  doctorName: string;
  tokenNumber: string;
  consultationFee: number;
  paymentMode: 'CASH' | 'UPI_QR_OFFLINE';
  timestamp: string;
  syncStatus: 'QUEUED' | 'SYNCED' | 'FAILED';
}

export interface OfflineReceiptItem {
  id: string;
  idempotencyKey: string;
  receiptNumber: string;
  patientName: string;
  amount: number;
  cashierName: string;
  paymentMode: 'CASH';
  timestamp: string;
  syncStatus: 'QUEUED' | 'SYNCED' | 'FAILED';
}

export interface OfflineSyncState {
  isOnline: boolean;
  pendingTokensCount: number;
  pendingReceiptsCount: number;
  isSyncing: boolean;
  lastSyncTimestamp: string | undefined;
}

export type SyncStatusListener = (state: OfflineSyncState) => void;

class OfflineSyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private pendingTokens: OfflineTokenItem[] = [];
  private pendingReceipts: OfflineReceiptItem[] = [];
  private listeners: Set<SyncStatusListener> = new Set();
  private isSyncing = false;
  private lastSyncTimestamp: string | undefined = undefined;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromLocalStorage();

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
        void this.replayOfflineMutations();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  private loadFromLocalStorage() {
    try {
      const tokensRaw = localStorage.getItem('docsearch_offline_tokens');
      const receiptsRaw = localStorage.getItem('docsearch_offline_receipts');
      if (tokensRaw) this.pendingTokens = JSON.parse(tokensRaw);
      if (receiptsRaw) this.pendingReceipts = JSON.parse(receiptsRaw);
    } catch {
      // Graceful fallback
    }
  }

  private persistToLocalStorage() {
    try {
      localStorage.setItem('docsearch_offline_tokens', JSON.stringify(this.pendingTokens));
      localStorage.setItem('docsearch_offline_receipts', JSON.stringify(this.pendingReceipts));
    } catch {
      // Memory persistence fallback
    }
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public getState(): OfflineSyncState {
    return {
      isOnline: this.isOnline,
      pendingTokensCount: this.pendingTokens.filter(t => t.syncStatus === 'QUEUED').length,
      pendingReceiptsCount: this.pendingReceipts.filter(r => r.syncStatus === 'QUEUED').length,
      isSyncing: this.isSyncing,
      lastSyncTimestamp: this.lastSyncTimestamp
    };
  }

  public async issueOfflineToken(payload: {
    patientName: string;
    patientPhone: string;
    departmentName: string;
    doctorName: string;
    consultationFee?: number;
    paymentMode?: 'CASH' | 'UPI_QR_OFFLINE';
  }): Promise<OfflineTokenItem> {
    const tokenNum = `OFF-${Math.floor(100 + Math.random() * 900)}`;
    const item: OfflineTokenItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`,
      idempotencyKey: `IDEM-TOKEN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      patientName: payload.patientName,
      patientPhone: payload.patientPhone,
      departmentId: 'dept-gen-opd',
      departmentName: payload.departmentName,
      doctorName: payload.doctorName,
      tokenNumber: tokenNum,
      consultationFee: payload.consultationFee || 500,
      paymentMode: payload.paymentMode || 'CASH',
      timestamp: new Date().toISOString(),
      syncStatus: 'QUEUED'
    };

    this.pendingTokens.push(item);
    this.persistToLocalStorage();
    this.notifyListeners();

    if (this.isOnline) {
      void this.replayOfflineMutations();
    }

    return item;
  }

  public async issueOfflineReceipt(payload: {
    patientName: string;
    amount: number;
    cashierName: string;
  }): Promise<OfflineReceiptItem> {
    const receiptNum = `REC-OFF-${Date.now().toString(36).toUpperCase()}`;
    const item: OfflineReceiptItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`,
      idempotencyKey: `IDEM-REC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      receiptNumber: receiptNum,
      patientName: payload.patientName,
      amount: payload.amount,
      cashierName: payload.cashierName,
      paymentMode: 'CASH',
      timestamp: new Date().toISOString(),
      syncStatus: 'QUEUED'
    };

    this.pendingReceipts.push(item);
    this.persistToLocalStorage();
    this.notifyListeners();

    if (this.isOnline) {
      void this.replayOfflineMutations();
    }

    return item;
  }

  public async replayOfflineMutations(): Promise<{
    syncedTokens: number;
    syncedReceipts: number;
  }> {
    const queuedTokens = this.pendingTokens.filter(t => t.syncStatus === 'QUEUED');
    const queuedReceipts = this.pendingReceipts.filter(r => r.syncStatus === 'QUEUED');

    if (queuedTokens.length === 0 && queuedReceipts.length === 0) {
      return { syncedTokens: 0, syncedReceipts: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const response = await fetch('/api/v1/partner/offline-sync/batch-replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: queuedTokens,
          receipts: queuedReceipts
        })
      });

      if (response.ok) {
        queuedTokens.forEach(t => { t.syncStatus = 'SYNCED'; });
        queuedReceipts.forEach(r => { r.syncStatus = 'SYNCED'; });

        this.pendingTokens = this.pendingTokens.filter(t => t.syncStatus === 'QUEUED');
        this.pendingReceipts = this.pendingReceipts.filter(r => r.syncStatus === 'QUEUED');
        this.lastSyncTimestamp = new Date().toISOString();
        this.persistToLocalStorage();
      }
    } catch {
      // Remain queued if offline
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return {
      syncedTokens: queuedTokens.length,
      syncedReceipts: queuedReceipts.length
    };
  }
}

export const offlineSyncService = new OfflineSyncService();
