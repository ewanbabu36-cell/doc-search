import React from 'react';

export interface HeaderProps {
  title?: React.ReactNode | undefined;
  organizationSlot?: React.ReactNode | undefined;
  userSlot?: React.ReactNode | undefined;
  themeSlot?: React.ReactNode | undefined;
  showFullscreenToggle?: boolean | undefined;
  onMenuToggle?: (() => void) | undefined;
  onBack?: (() => void) | undefined;
  canGoBack?: boolean | undefined;
  className?: string | undefined;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  organizationSlot,
  userSlot,
  themeSlot,
  showFullscreenToggle = true,
  onMenuToggle,
  onBack,
  canGoBack = true,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return Boolean(document.fullscreenElement);
    }
    return false;
  });

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = React.useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('[Header] Fullscreen toggle failed:', err);
    }
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key === 'ArrowLeft') || e.key === 'BrowserBack') {
        if (onBack && canGoBack) {
          e.preventDefault();
          onBack();
        }
      }

      // Universal Fullscreen Shortcut:
      // 1. F11 (Standard browser key)
      // 2. Ctrl + Shift + F or Cmd + Shift + F (Laptop-friendly shortcut without needing Fn key)
      const isFullscreenShortcut =
        e.key === 'F11' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f'));

      if (isFullscreenShortcut && showFullscreenToggle) {
        e.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, canGoBack, showFullscreenToggle, toggleFullscreen]);

  return (
    <header
      className={`ds-header ${className}`}
      style={{
        minHeight: '62px',
        backgroundColor: 'var(--ds-surface-l2, var(--ds-color-surface))',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.12), inset 0 -0.5px 0 0 rgba(255, 255, 255, 0.06)',
        flexShrink: 0,
        gap: '10px',
        overflow: 'visible',
        zIndex: 1000
      }}
    >
      {/* Left Slot: Menu Toggle + Back Button + Title / Launcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
        {onMenuToggle && (
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={onMenuToggle}
            className="ds-interactive"
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid var(--ds-color-border-subtle)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ds-color-text-primary)',
              flexShrink: 0
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {onBack && canGoBack && (
          <button
            type="button"
            aria-label="Go back to previous screen (Alt + ←)"
            onClick={onBack}
            className="ds-interactive ds-spring-press"
            title="Go back (Alt + ←)"
            style={{
              padding: '5px 10px',
              borderRadius: '7px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: '#94A3B8',
              fontSize: '0.78rem',
              fontWeight: 600,
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.color = '#F1F5F9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>←</span>
            <span>Back</span>
          </button>
        )}
        {title && (
          <div
            className="ds-header-title"
            style={{
              fontWeight: '700',
              fontSize: '1rem',
              color: 'var(--ds-color-text-primary)',
              minWidth: 0
            }}
          >
            {title}
          </div>
        )}
      </div>

      {/* Center Slot: Organization / Universal Search / Command Bar */}
      {organizationSlot && (
        <div
          style={{
            flex: '1 1 auto',
            maxWidth: '560px',
            minWidth: 0,
            display: 'flex',
            justifyContent: 'center',
            overflow: 'visible',
            padding: '0 8px'
          }}
        >
          {organizationSlot}
        </div>
      )}

      {/* Right Slot: Fullscreen, Theme & User Account (ALWAYS PINNED ON RIGHT EDGE) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
          marginLeft: 'auto'
        }}
      >
        {showFullscreenToggle && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            title={isFullscreen ? 'Exit Fullscreen (Esc / F11 / Ctrl+Shift+F)' : 'Full Screen Mode (F11 / Ctrl+Shift+F)'}
            className="ds-interactive ds-spring-press"
            style={{
              padding: '5px 10px',
              borderRadius: '7px',
              border: isFullscreen ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: isFullscreen ? 'rgba(14, 165, 233, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: isFullscreen ? '#38BDF8' : '#94A3B8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              flexShrink: 0,
              transition: 'all 0.15s ease',
              boxShadow: isFullscreen ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isFullscreen ? 'rgba(14, 165, 233, 0.28)' : 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = isFullscreen ? 'rgba(56, 189, 248, 0.7)' : 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.color = isFullscreen ? '#7DD3FC' : '#F1F5F9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isFullscreen ? 'rgba(14, 165, 233, 0.18)' : 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = isFullscreen ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = isFullscreen ? '#38BDF8' : '#94A3B8';
            }}
          >
            {isFullscreen ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                <span>Exit Full</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                <span>Fullscreen</span>
              </>
            )}
          </button>
        )}
        {themeSlot && <div style={{ flexShrink: 0 }}>{themeSlot}</div>}
        {userSlot && <div style={{ flexShrink: 0 }}>{userSlot}</div>}
      </div>
    </header>
  );
};
