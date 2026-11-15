/**
 * Universal Non-Blocking UI Feedback Utility for Landing Page
 * Eliminates native alert() dialogs to maintain smooth rendering and UX.
 */

export function showToast(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  durationMs = 4000
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let container = document.getElementById('landing-toast-enclave');
  if (!container) {
    container = document.createElement('div');
    container.id = 'landing-toast-enclave';
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
