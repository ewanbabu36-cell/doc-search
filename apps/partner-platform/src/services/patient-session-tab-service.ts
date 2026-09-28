/**
 * DocSearch Multi-Patient & Multi-Task Session Tab Service
 * Enables browser-style tabs for simultaneous patient consultations, POS bills,
 * and lab investigations without data loss or modal disruption.
 */

export type SessionTabType = 'OPD' | 'POS' | 'LAB' | 'IPD' | 'TRIAGE' | 'GENERAL';

export interface PatientSessionTab {
  id: string;
  title: string;
  subtitle?: string | undefined;
  type: SessionTabType;
  icon?: string | undefined;
  module: string;
  subTab?: string | undefined;
  patientId?: string | undefined;
  patientName?: string | undefined;
  consultationId?: string | undefined;
  encounterId?: string | undefined;
  isDirty?: boolean | undefined;
  draftData?: any | undefined;
  createdAt: number;
}

type SessionTabSubscriber = (tabs: PatientSessionTab[], activeTabId: string | null) => void;

const STORAGE_KEY = 'docsearch_session_tabs';
const ACTIVE_TAB_KEY = 'docsearch_active_session_tab_id';

export function resolveClientSessionIdentity(
  explicit?: { tenantId?: string | undefined; userId?: string | undefined },
  fallback?: { tenantId?: string | undefined; userId?: string | undefined }
): {
  tenantId: string;
  userId: string;
  namespace: string;
} {
  let tenantId = explicit?.tenantId?.trim() || '';
  let userId = explicit?.userId?.trim() || '';

  if ((!tenantId || !userId) && typeof window !== 'undefined' && window.localStorage) {
    try {
      const rawSession =
        window.localStorage.getItem('docsearch_auth_session') ||
        window.localStorage.getItem('docsearch_partner_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        tenantId = tenantId || String(parsed?.tenantId || parsed?.organizationId || parsed?.partnerId || '').trim();
        userId = userId || String(parsed?.userId || parsed?.id || parsed?.sub || '').trim();
      }
    } catch {
      // ignore
    }

    if (!tenantId || !userId) {
      try {
        const token =
          window.localStorage.getItem('docsearch_auth_token') ||
          window.localStorage.getItem('auth_token') ||
          '';
        if (token && token.includes('.')) {
          const parts = token.split('.');
          if (parts.length === 3 && parts[1]) {
            const base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64Url));
            tenantId = tenantId || String(payload?.tenantId || payload?.organizationId || '').trim();
            userId = userId || String(payload?.userId || payload?.sub || '').trim();
          }
        }
      } catch {
        // ignore
      }
    }
  }

  const safeTenant = tenantId || fallback?.tenantId?.trim() || 'anonymous-tenant';
  const safeUser = userId || fallback?.userId?.trim() || 'anonymous-user';
  return {
    tenantId: safeTenant,
    userId: safeUser,
    namespace: `${safeTenant}:${safeUser}`
  };
}

export class PatientSessionTabService {
  private tabs: PatientSessionTab[] = [];
  private activeTabId: string | null = null;
  private subscribers: Set<SessionTabSubscriber> = new Set();
  private draftStore: Map<string, any> = new Map();
  private currentIdentity: { tenantId?: string | undefined; userId?: string | undefined } = {};
  private lastLoadedNamespace: string = '';

  constructor() {
    this.invalidateLegacyGlobalKeys();
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('docsearch:auth_logout', () => {
        this.purgeOnLogout();
      });
    }
  }

  private invalidateLegacyGlobalKeys(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_TAB_KEY);
    } catch {
      // ignore
    }
  }

  public resolveStorageNamespace(tenantId?: string, userId?: string): string {
    const resolved = resolveClientSessionIdentity(
      tenantId || userId ? { tenantId, userId } : undefined,
      this.currentIdentity
    );
    return resolved.namespace;
  }

  public getStorageKey(logicalKey: string = STORAGE_KEY): string {
    return `docsearch:${this.resolveStorageNamespace()}:${logicalKey}`;
  }

  public getActiveTabStorageKey(): string {
    return `docsearch:${this.resolveStorageNamespace()}:${ACTIVE_TAB_KEY}`;
  }

  public setSessionContext(tenantId: string, userId: string): void {
    this.currentIdentity = { tenantId: tenantId.trim(), userId: userId.trim() };
    this.tabs = [];
    this.activeTabId = null;
    this.draftStore.clear();
    this.loadFromStorage();
    this.notify();
  }

  private ensureNamespaceAligned(): void {
    const activeNs = this.resolveStorageNamespace();
    if (this.lastLoadedNamespace && this.lastLoadedNamespace !== activeNs) {
      this.tabs = [];
      this.activeTabId = null;
      this.draftStore.clear();
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      this.invalidateLegacyGlobalKeys();
      const ns = this.resolveStorageNamespace();
      this.lastLoadedNamespace = ns;
      const tabsKey = `docsearch:${ns}:${STORAGE_KEY}`;
      const activeKey = `docsearch:${ns}:${ACTIVE_TAB_KEY}`;
      const stored = window.localStorage.getItem(tabsKey);
      if (stored) {
        this.tabs = JSON.parse(stored);
      } else {
        this.tabs = [];
      }
      const activeId = window.localStorage.getItem(activeKey);
      if (activeId && this.tabs.some((t) => t.id === activeId)) {
        this.activeTabId = activeId;
      } else if (this.tabs.length > 0 && this.tabs[0]) {
        this.activeTabId = this.tabs[0].id;
      } else {
        this.activeTabId = null;
      }
    } catch {
      this.tabs = [];
      this.activeTabId = null;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const ns = this.resolveStorageNamespace();
      this.lastLoadedNamespace = ns;
      const tabsKey = `docsearch:${ns}:${STORAGE_KEY}`;
      const activeKey = `docsearch:${ns}:${ACTIVE_TAB_KEY}`;
      window.localStorage.setItem(tabsKey, JSON.stringify(this.tabs));
      if (this.activeTabId) {
        window.localStorage.setItem(activeKey, this.activeTabId);
      } else {
        window.localStorage.removeItem(activeKey);
      }
    } catch {
      // ignore
    }
  }

  public purgeOnLogout(tenantId?: string, userId?: string): void {
    const ns = this.resolveStorageNamespace(tenantId, userId);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(`docsearch:${ns}:${STORAGE_KEY}`);
        window.localStorage.removeItem(`docsearch:${ns}:${ACTIVE_TAB_KEY}`);
        this.invalidateLegacyGlobalKeys();
      } catch {
        // ignore
      }
    }
    this.tabs = [];
    this.activeTabId = null;
    this.draftStore.clear();
    this.currentIdentity = {};
    this.lastLoadedNamespace = '';
    this.notify();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl + Tab / Ctrl + PageDown: Next tab
    if (e.ctrlKey && !e.shiftKey && (e.key === 'Tab' || e.key === 'PageDown')) {
      e.preventDefault();
      this.nextTab();
      return;
    }
    // Ctrl + Shift + Tab / Ctrl + PageUp: Prev tab
    if (e.ctrlKey && e.shiftKey && (e.key === 'Tab' || e.key === 'PageUp')) {
      e.preventDefault();
      this.prevTab();
      return;
    }
    // Alt + W: Close current tab (Alt+W instead of Ctrl+W to prevent closing browser window)
    if (e.altKey && (e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
      if (this.activeTabId) {
        this.closeTab(this.activeTabId);
      }
    }
  };

  public getTabs(): PatientSessionTab[] {
    this.ensureNamespaceAligned();
    return [...this.tabs];
  }

  public getActiveTabId(): string | null {
    this.ensureNamespaceAligned();
    return this.activeTabId;
  }

  public getActiveTab(): PatientSessionTab | null {
    this.ensureNamespaceAligned();
    return this.tabs.find((t) => t.id === this.activeTabId) || null;
  }

  public openTab(tab: {
    id?: string | undefined;
    title: string;
    subtitle?: string | undefined;
    type?: SessionTabType | undefined;
    icon?: string | undefined;
    module?: string | undefined;
    subTab?: string | undefined;
    patientId?: string | undefined;
    patientName?: string | undefined;
    consultationId?: string | undefined;
    encounterId?: string | undefined;
    draftData?: any | undefined;
  }): PatientSessionTab {
    this.ensureNamespaceAligned();
    const type = tab.type || 'OPD';
    const module = tab.module || 'clinical-consultation';
    const icon = tab.icon || (type === 'POS' ? '💊' : type === 'LAB' ? '🔬' : type === 'IPD' ? '🛏️' : '👤');

    // 1. Check if matching tab already exists
    const existingIndex = this.tabs.findIndex((t) => {
      if (tab.id && t.id === tab.id) return true;
      if (tab.consultationId && t.consultationId === tab.consultationId) return true;
      if (tab.patientId && t.patientId === tab.patientId && t.type === type) return true;
      if (tab.encounterId && t.encounterId === tab.encounterId && t.type === type) return true;
      if (type === 'POS' && t.type === 'POS' && tab.subtitle && t.subtitle === tab.subtitle) return true;
      return false;
    });

    if (existingIndex >= 0 && this.tabs[existingIndex]) {
      const existing = this.tabs[existingIndex];
      // Update title/subtitle if changed
      existing.title = tab.title || existing.title;
      if (tab.subtitle) existing.subtitle = tab.subtitle;
      if (tab.subTab) existing.subTab = tab.subTab;
      this.activeTabId = existing.id;
      this.saveToStorage();
      this.notify();
      this.broadcastTabSwitch(existing);
      return existing;
    }

    // 2. Otherwise create new tab
    const id = tab.id || `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTab: PatientSessionTab = {
      id,
      title: tab.title,
      subtitle: tab.subtitle,
      type,
      icon,
      module,
      subTab: tab.subTab,
      patientId: tab.patientId,
      patientName: tab.patientName || tab.title,
      consultationId: tab.consultationId,
      encounterId: tab.encounterId,
      isDirty: false,
      draftData: tab.draftData,
      createdAt: Date.now()
    };

    // Cap at 12 active tabs to maintain UI performance
    if (this.tabs.length >= 12) {
      this.tabs.shift(); // Remove oldest inactive tab
    }

    this.tabs.push(newTab);
    this.activeTabId = id;
    this.saveToStorage();
    this.notify();
    this.broadcastTabSwitch(newTab);
    return newTab;
  }

  public switchTab(tabId: string): void {
    if (this.activeTabId === tabId) return;
    const target = this.tabs.find((t) => t.id === tabId);
    if (!target) return;

    this.activeTabId = tabId;
    this.saveToStorage();
    this.notify();
    this.broadcastTabSwitch(target);
  }

  public closeTab(tabId: string): void {
    const tabIndex = this.tabs.findIndex((t) => t.id === tabId);
    if (tabIndex < 0) return;

    const closingTab = this.tabs[tabIndex];

    // Clean cached draft
    this.draftStore.delete(tabId);

    // Remove tab
    this.tabs = this.tabs.filter((t) => t.id !== tabId);

    // If closing active tab, activate next or previous tab
    if (this.activeTabId === tabId) {
      if (this.tabs.length > 0) {
        const nextIndex = Math.min(tabIndex, this.tabs.length - 1);
        const nextActive = this.tabs[nextIndex];
        this.activeTabId = nextActive ? nextActive.id : null;
        if (nextActive) {
          this.broadcastTabSwitch(nextActive);
        }
      } else {
        this.activeTabId = null;
      }
    }

    this.saveToStorage();
    this.notify();

    if (typeof window !== 'undefined' && closingTab) {
      window.dispatchEvent(
        new CustomEvent('docsearch:session_tab_closed', {
          detail: closingTab
        })
      );
    }
  }

  public nextTab(): void {
    if (this.tabs.length <= 1 || !this.activeTabId) return;
    const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
    const nextIndex = (currentIndex + 1) % this.tabs.length;
    const target = this.tabs[nextIndex];
    if (target) {
      this.switchTab(target.id);
    }
  }

  public prevTab(): void {
    if (this.tabs.length <= 1 || !this.activeTabId) return;
    const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
    const prevIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    const target = this.tabs[prevIndex];
    if (target) {
      this.switchTab(target.id);
    }
  }

  public setTabDirty(tabId: string, isDirty: boolean): void {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (tab && tab.isDirty !== isDirty) {
      tab.isDirty = isDirty;
      this.saveToStorage();
      this.notify();
    }
  }

  public saveDraft(tabId: string, data: any): void {
    this.draftStore.set(tabId, data);
    const tab = this.tabs.find((t) => t.id === tabId);
    if (tab) {
      tab.draftData = data;
      tab.isDirty = true;
      this.saveToStorage();
      this.notify();
    }
  }

  public getDraft(tabId: string): any {
    if (this.draftStore.has(tabId)) {
      return this.draftStore.get(tabId);
    }
    const tab = this.tabs.find((t) => t.id === tabId);
    return tab?.draftData || null;
  }

  public clearAllTabs(): void {
    this.tabs = [];
    this.activeTabId = null;
    this.draftStore.clear();
    this.saveToStorage();
    this.notify();
  }

  private broadcastTabSwitch(tab: PatientSessionTab): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('docsearch:session_tab_switched', {
        detail: tab
      })
    );
  }

  public subscribe(callback: SessionTabSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getTabs(), this.activeTabId);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(): void {
    const list = this.getTabs();
    this.subscribers.forEach((cb) => cb(list, this.activeTabId));
  }
}

export const patientSessionTabService = new PatientSessionTabService();
