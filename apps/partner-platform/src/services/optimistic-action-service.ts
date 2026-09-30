export interface OptimisticAction {
  id: string;
  title: string;
  category?: 'DISPENSE' | 'VITALS' | 'REGISTRATION' | 'INVOICE' | 'ORDER' | 'EMR_SCRIBE' | 'PHARMACY_DISPENSE' | 'NURSE_VITALS' | string;
  timestamp: number;
  timeoutMs: number;
  onCommit?: () => Promise<void> | void;
  onUndo?: () => Promise<void> | void;
  payload?: any;
}

type ActionSubscriber = (activeAction: OptimisticAction | null, undoMessage?: string | null) => void;

class OptimisticActionService {
  private activeAction: OptimisticAction | null = null;
  private actionTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribers: Set<ActionSubscriber> = new Set();
  private undoMessage: string | null = null;
  private undoTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Check for Ctrl+Z or Cmd+Z
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
      // Avoid intercepting text editing in active input fields
      const activeEl = document.activeElement;
      const isEditingText = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable
      );

      if (!isEditingText && this.activeAction) {
        e.preventDefault();
        e.stopPropagation();
        this.undo();
      }
    }
  };

  public dispatch(action: Omit<OptimisticAction, 'id' | 'timestamp' | 'timeoutMs'> & { timeoutMs?: number; countdownSeconds?: number; id?: string }): string {
    const id = action.id || `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timeoutMs = action.timeoutMs || (action.countdownSeconds ? action.countdownSeconds * 1000 : 5000);

    // If an existing action is running, commit it immediately before taking the new one
    if (this.activeAction) {
      this.commit();
    }

    const newAction: OptimisticAction = {
      ...action,
      id,
      timestamp: Date.now(),
      timeoutMs
    };

    this.activeAction = newAction;
    this.undoMessage = null;

    this.actionTimer = setTimeout(() => {
      this.commit();
    }, timeoutMs);

    this.notify();
    return id;
  }

  public undo(id?: string): boolean {
    if (!this.activeAction) return false;
    if (id && this.activeAction.id !== id) return false;

    if (this.actionTimer) {
      clearTimeout(this.actionTimer);
      this.actionTimer = null;
    }

    const actionToUndo = this.activeAction;
    this.activeAction = null;

    try {
      if (actionToUndo.onUndo) {
        void actionToUndo.onUndo();
      }
      this.undoMessage = `↩️ Reverted: ${actionToUndo.title}`;
    } catch (err) {
      console.error('[OptimisticAction] Failed to execute undo handler:', err);
      this.undoMessage = `⚠️ Undo failed for: ${actionToUndo.title}`;
    }

    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(() => {
      this.undoMessage = null;
      this.notify();
    }, 3500);

    this.notify();
    return true;
  }

  public commit(): void {
    if (!this.activeAction) return;

    if (this.actionTimer) {
      clearTimeout(this.actionTimer);
      this.actionTimer = null;
    }

    const actionToCommit = this.activeAction;
    this.activeAction = null;

    try {
      if (actionToCommit.onCommit) {
        void actionToCommit.onCommit();
      }
    } catch (err) {
      console.error('[OptimisticAction] Failed to execute commit handler:', err);
    }

    this.notify();
  }

  public getActiveAction(): OptimisticAction | null {
    return this.activeAction;
  }

  public getUndoMessage(): string | null {
    return this.undoMessage;
  }

  public subscribe(callback: ActionSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.activeAction, this.undoMessage);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(): void {
    this.subscribers.forEach((cb) => cb(this.activeAction, this.undoMessage));
  }
}

export const optimisticActionService = new OptimisticActionService();
