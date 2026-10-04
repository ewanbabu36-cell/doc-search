import React, { useEffect, useState, useRef } from 'react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode | undefined;
  children: React.ReactNode;
  footer?: React.ReactNode | undefined;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | undefined;
  closeOnBackdropClick?: boolean | undefined;
  isFullPage?: boolean | undefined;
  allowMinimize?: boolean | undefined;
  allowMaximize?: boolean | undefined;
  initialMaximized?: boolean | undefined;
  presentation?: 'modal' | 'drawer' | undefined;
}

const maxWidthMap = {
  sm: '400px',
  md: '560px',
  lg: '768px',
  xl: '1024px',
  full: '100vw'
};

let activeMinimizedStack: Array<{ id: string }> = [];
const stackListeners = new Set<() => void>();

function notifyStackChange() {
  stackListeners.forEach((fn) => fn());
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  closeOnBackdropClick = false,
  isFullPage = false,
  allowMinimize = true,
  allowMaximize = true,
  initialMaximized = false,
  presentation = 'modal'
}) => {
  const isDrawer = presentation === 'drawer';
  const dialogId = React.useId();
  const [isMaximized, setIsMaximized] = useState(initialMaximized);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dockIndex, setDockIndex] = useState(0);

  // Track vertical dock stack index when multiple modals are minimized
  useEffect(() => {
    const updateIndex = () => {
      const idx = activeMinimizedStack.findIndex((d) => d.id === dialogId);
      setDockIndex(idx >= 0 ? idx : 0);
    };

    if (isMinimized && isOpen) {
      activeMinimizedStack = [...activeMinimizedStack.filter((d) => d.id !== dialogId), { id: dialogId }];
      updateIndex();
      notifyStackChange();
      stackListeners.add(updateIndex);
    } else {
      activeMinimizedStack = activeMinimizedStack.filter((d) => d.id !== dialogId);
      notifyStackChange();
      stackListeners.delete(updateIndex);
    }

    return () => {
      activeMinimizedStack = activeMinimizedStack.filter((d) => d.id !== dialogId);
      stackListeners.delete(updateIndex);
      notifyStackChange();
    };
  }, [isMinimized, isOpen, dialogId]);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
      setIsMaximized(initialMaximized);
    }
  }, [isOpen, initialMaximized]);

  // Keep stable reference to onClose so child re-renders do not tear down effects
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const isPushedRef = useRef(false);
  const poppedByBrowserRef = useRef(false);

  // Handle ESC key and document body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isMinimized) {
        onCloseRef.current();
      }
    };
    if (isOpen && !isMinimized) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isMinimized]);

  // Mobile & Android Hardware Back Button Handling (Only active on mobile screens < 768px)
  useEffect(() => {
    if (!isOpen || isMinimized || typeof window === 'undefined') return undefined;
    // On desktop, hardware back buttons do not exist; keep browser history clean
    if (window.innerWidth >= 768) return undefined;

    isPushedRef.current = true;
    poppedByBrowserRef.current = false;

    // Use current URL rather than empty string '' so relative path resolution is never corrupted
    window.history.pushState({ docsearchDialogId: dialogId }, '', window.location.href);

    const handlePopState = () => {
      poppedByBrowserRef.current = true;
      isPushedRef.current = false;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Only pop browser history if closed programmatically, NOT if already popped by back button
      if (isPushedRef.current && !poppedByBrowserRef.current && window.history.state?.docsearchDialogId === dialogId) {
        isPushedRef.current = false;
        window.history.back();
      }
    };
  }, [isOpen, isMinimized, dialogId]);

  if (!isOpen) return null;

  const fullPageMode = isFullPage || maxWidth === 'full' || isMaximized;

  return (
    <>
      {/* Mobile Responsive Bottom Sheet & Touch Optimization Styles */}
      <style>{`
        @keyframes dsSlideUpSheet {
          from {
            transform: translateY(100%);
            opacity: 0.85;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @media (max-width: 767px) {
          .ds-modal-backdrop-responsive {
            position: fixed !important;
            inset: 0 !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
            align-items: flex-end !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
            background-color: rgba(11, 15, 23, 0.75) !important;
            backdrop-filter: blur(4px) !important;
            -webkit-backdrop-filter: blur(4px) !important;
          }
          .ds-modal-sheet-responsive {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: 92dvh !important;
            height: auto !important;
            margin: 0 !important;
            border-radius: 20px 20px 0 0 !important;
            border-bottom: none !important;
            border-left: none !important;
            border-right: none !important;
            border-top: 1px solid var(--ds-color-border-strong, rgba(255, 255, 255, 0.15)) !important;
            box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.85) !important;
            animation: dsSlideUpSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }
          .ds-modal-sheet-responsive.ds-fullpage-mode {
            max-height: 100dvh !important;
            height: 100dvh !important;
            border-radius: 0 !important;
          }
          .ds-dialog-mobile-pill {
            display: block !important;
          }
          .ds-dialog-mobile-hide {
            display: none !important;
          }
          .ds-dialog-header-responsive {
            padding: 10px 16px !important;
            border-bottom: 1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08)) !important;
            flex-shrink: 0 !important;
          }
          .ds-dialog-body-responsive {
            padding: 16px !important;
            overflow-y: auto !important;
            overscroll-behavior: contain !important;
            -webkit-overflow-scrolling: touch !important;
            flex: 1 1 auto !important;
          }
          .ds-dialog-footer-responsive {
            position: sticky !important;
            bottom: 0 !important;
            z-index: 20 !important;
            padding: 12px 16px max(14px, env(safe-area-inset-bottom)) !important;
            border-top: 1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.1)) !important;
            background-color: var(--ds-color-surface-subtle, #0F172A) !important;
            flex-shrink: 0 !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
            justify-content: stretch !important;
          }
          .ds-dialog-footer-responsive > * {
            flex: 1 1 auto !important;
            min-height: 46px !important;
          }
          .ds-modal-sheet-responsive input,
          .ds-modal-sheet-responsive select,
          .ds-modal-sheet-responsive textarea {
            font-size: 16px !important;
          }
          .ds-modal-sheet-responsive button:not(.ds-dialog-close-btn),
          .ds-modal-sheet-responsive .ds-touch-target {
            min-height: 44px !important;
          }
        }
        @media (min-width: 768px) {
          .ds-dialog-mobile-pill {
            display: none !important;
          }
        }
      `}</style>
      {/* 1. Sleek Floating Bottom Tray Dock Pill (Visible when minimized) */}
      {isMinimized && (
        <aside
          role="button"
          tabIndex={0}
          aria-label={`Restore minimized task: ${typeof title === 'string' ? title : 'Form'}`}
          onClick={() => setIsMinimized(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsMinimized(false);
            }
          }}
          className="ds-minimized-dock-pill ds-spring-press"
          title="Click to Restore form window"
          style={{
            position: 'fixed',
            bottom: `${24 + (dockIndex * 54)}px`,
            right: '24px',
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid #0284C7',
            borderRadius: '9999px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(2, 132, 199, 0.4)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            cursor: 'pointer',
            animation: 'dsPillSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            maxWidth: '480px',
            userSelect: 'none',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#38BDF8';
            e.currentTarget.style.boxShadow = '0 14px 42px rgba(0, 0, 0, 0.9), 0 0 28px rgba(56, 189, 248, 0.5)';
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#0284C7';
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(2, 132, 199, 0.4)';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          {/* Pin Icon */}
          <span
            style={{
              fontSize: '1.05rem',
              lineHeight: 1,
              filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))'
            }}
          >
            📌
          </span>

          {/* Form Title & Live Pulse */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#38BDF8',
                boxShadow: '0 0 10px #38BDF8',
                flexShrink: 0
              }}
            />
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#F8FAFC',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={typeof title === 'string' ? title : undefined}
            >
              {title || 'Active Form Window'}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#94A3B8',
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}
            >
              — Click to Restore
            </span>
          </div>

          {/* Paused Badge & Quick Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '4px' }}>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                letterSpacing: '0.04em'
              }}
            >
              PAUSED
            </span>
            <button
              type="button"
              aria-label="Close and discard dialog"
              title="Close and discard"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="ds-interactive"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94A3B8',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.color = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* 2. Dialog Modal Window (Preserved in DOM with display: none when minimized) */}
      <div
        className="ds-backdrop ds-modal-backdrop-responsive"
        onClick={(e) => {
          const canCloseBackdrop = isDrawer ? (closeOnBackdropClick !== false) : closeOnBackdropClick;
          if (canCloseBackdrop && e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal={!isMinimized}
        style={
          isMinimized
            ? { display: 'none' }
            : fullPageMode
              ? {
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'stretch',
                  zIndex: 1150,
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100vh'
                }
              : isDrawer
                ? {
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'stretch',
                    zIndex: 1150,
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(11, 15, 23, 0.45)',
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                    padding: 0,
                    margin: 0
                  }
                : {
                    display: 'flex',
                    zIndex: 1150
                  }
        }
      >
        <div
          className={`ds-modal-sheet-responsive ${isDrawer ? 'ds-drawer-sheet-responsive' : ''} ${fullPageMode ? 'ds-fullpage-mode' : ''}`}
          style={
            fullPageMode
              ? {
                  width: '100vw',
                  height: '100vh',
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  margin: 0,
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: 'var(--ds-surface-l4, #0B1120)',
                  color: 'var(--ds-color-text-primary)',
                  boxShadow: 'none',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }
              : isDrawer
                ? {
                    width: '100%',
                    maxWidth: maxWidthMap[maxWidth] || '760px',
                    height: '100vh',
                    maxHeight: '100vh',
                    margin: 0,
                    borderRadius: 0,
                    borderTopLeftRadius: '16px',
                    borderBottomLeftRadius: '16px',
                    borderLeft: '1px solid var(--ds-color-border-strong, var(--ds-color-border))',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    backgroundColor: 'var(--ds-surface-l4, var(--ds-color-surface))',
                    color: 'var(--ds-color-text-primary)',
                    boxShadow: 'var(--ds-shadow-xl, -16px 0 48px rgba(0, 0, 0, 0.6))',
                    backdropFilter: 'blur(28px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    animation: 'dsDrawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }
                : {
                    width: '100%',
                    maxWidth: maxWidthMap[maxWidth],
                    maxHeight: '90vh',
                    margin: '16px',
                    backgroundColor: 'var(--ds-surface-l4, var(--ds-color-surface))',
                    color: 'var(--ds-color-text-primary)',
                    border: '1px solid var(--ds-color-border-strong, var(--ds-color-border))',
                    borderRadius: '16px',
                    boxShadow: 'var(--ds-specular-edge, inset 0 1px 0 0 rgba(255, 255, 255, 0.12)), var(--ds-shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.5))',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'max-width 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }
          }
        >
          {/* Mobile Drag Pill Handle */}
          <div
            className="ds-dialog-mobile-pill"
            style={{
              width: '40px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.35)',
              borderRadius: '9999px',
              margin: '10px auto 4px auto',
              flexShrink: 0
            }}
          />

          {/* Header Bar with Full Window Controls */}
          {(Boolean(title) || allowMinimize || allowMaximize || Boolean(onClose)) && (
            <div
              className="ds-dialog-header-responsive"
              onDoubleClick={() => {
                if (allowMaximize && !isFullPage && maxWidth !== 'full') {
                  setIsMaximized((prev) => !prev);
                }
              }}
              title={allowMaximize ? 'Double-click to toggle Full-Screen / Restore' : undefined}
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--ds-color-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                userSelect: 'none',
                cursor: allowMaximize ? 'pointer' : 'default',
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {title || ''}
              </h2>

              {/* Desktop-grade Window Action Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                {allowMinimize && (
                  <button
                    type="button"
                    aria-label="Minimize dialog to dock tray"
                    title="Minimize to floating tray (—)"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(true);
                    }}
                    className="ds-interactive ds-dialog-mobile-hide"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      color: 'var(--ds-color-text-muted)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    —
                  </button>
                )}

                {allowMaximize && !isFullPage && maxWidth !== 'full' && (
                  <button
                    type="button"
                    aria-label={isMaximized ? 'Restore down' : 'Maximize full screen'}
                    title={isMaximized ? 'Restore down (🗗)' : 'Maximize full screen (⛶)'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMaximized((prev) => !prev);
                    }}
                    className="ds-interactive ds-dialog-mobile-hide"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: 'var(--ds-color-text-muted)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {isMaximized ? '🗗' : '⛶'}
                  </button>
                )}

                <button
                  type="button"
                  aria-label="Close dialog"
                  title="Close (Esc)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="ds-interactive ds-dialog-close-btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: 'var(--ds-color-text-muted)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    minWidth: '42px',
                    minHeight: '42px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#EF4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--ds-color-text-muted)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div
            className="ds-dialog-body-responsive"
            style={{
              padding: '20px',
              flex: '1 1 auto',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              color: 'var(--ds-color-text-primary)'
            }}
          >
            {children}
          </div>

          {footer && (
            <div
              className="ds-dialog-footer-responsive"
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--ds-color-border-subtle)',
                backgroundColor: 'var(--ds-color-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px'
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

