/**
 * Universal Non-Blocking UI Feedback & Confirmation Utility
 * Replaces blocking native alert() and window.confirm() dialogs,
 * preventing V8 event loop freezes and WebRTC packet drops during telemedicine.
 */

export function showToast(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  durationMs = 4000
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let container = document.getElementById('docsearch-toast-enclave');
  if (!container) {
    container = document.createElement('div');
    container.id = 'docsearch-toast-enclave';
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '99999',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    });
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const colors = {
    info: { bg: '#0F172A', border: '#38BDF8', text: '#F8FAFC', icon: 'ℹ️' },
    success: { bg: '#064E3B', border: '#34D399', text: '#ECFDF5', icon: '✅' },
    warning: { bg: '#78350F', border: '#FBBF24', text: '#FFFBEB', icon: '⚠️' },
    error: { bg: '#7F1D1D', border: '#F87171', text: '#FEF2F2', icon: '❌' }
  };
  const cfg = colors[type];

  Object.assign(toast.style, {
    backgroundColor: cfg.bg,
    border: `1px solid ${cfg.border}`,
    color: cfg.text,
    padding: '12px 18px',
    borderRadius: '10px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '0.875rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    maxWidth: '420px',
    pointerEvents: 'auto',
    opacity: '0',
    transform: 'translateY(12px)',
    transition: 'all 0.25s ease'
  });

  toast.innerHTML = `<span>${cfg.icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 250);
  }, durationMs);
}

export function showConfirm(message: string, title = 'Confirmation Required'): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
      position: 'fixed',
      inset: '0',
      backgroundColor: 'rgba(7, 11, 20, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999999',
      padding: '16px'
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      backgroundColor: '#0F172A',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '14px',
      padding: '24px',
      maxWidth: '460px',
      width: '100%',
      boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#F8FAFC'
    });

    card.innerHTML = `
      <h3 style="margin: 0 0 8px 0; font-size: 1.125rem; font-weight: 700; color: #38BDF8;">${title}</h3>
      <p style="margin: 0 0 20px 0; font-size: 0.875rem; color: #CBD5E1; line-height: 1.5;">${message}</p>
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="ds-confirm-cancel" style="padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: #E2E8F0; font-weight: 600; cursor: pointer;">Cancel</button>
        <button id="ds-confirm-ok" style="padding: 8px 18px; border-radius: 8px; border: none; background: #0284C7; color: white; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);">Confirm</button>
      </div>
    `;

    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    const cleanup = (val: boolean) => {
      backdrop.remove();
      resolve(val);
    };

    card.querySelector('#ds-confirm-cancel')?.addEventListener('click', () => cleanup(false));
    card.querySelector('#ds-confirm-ok')?.addEventListener('click', () => cleanup(true));
  });
}
