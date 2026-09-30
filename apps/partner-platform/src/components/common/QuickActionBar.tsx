import React from 'react';

export interface QuickActionBarProps {
  onOpenQuickRegister: () => void;
  onNavigateModule: (moduleKey: string) => void;
  onOpenCommandPalette: () => void;
  isSimpleMode: boolean;
  onToggleSimpleMode: () => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onOpenQuickRegister,
  onNavigateModule,
  onOpenCommandPalette,
  isSimpleMode,
  onToggleSimpleMode
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
      console.warn('[QuickActionBar] Fullscreen toggle failed:', err);
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '8px 16px',
        backgroundColor: '#0B1120',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        flexWrap: 'wrap'
      }}
    >
      {/* Left: 1-Click Fast Action Triggers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* + Quick Patient (Primary Highlight) */}
        <button
          type="button"
          onClick={onOpenQuickRegister}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#0284C7',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '0.8125rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0369A1')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0284C7')}
          title="Register new patient & generate OPD token in 30 seconds"
        >
          <span>⚡</span>
          <span>+ Quick Patient & Token</span>
        </button>

        {/* + Quick OPD Bill */}
        <button
          type="button"
          onClick={() => onNavigateModule('billing-revenue-cycle')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34D399',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)')}
          title="Instant Cashier / Billing Receipt"
        >
          <span>💳</span>
          <span>+ Quick POS Bill</span>
        </button>

        {/* + Doctor Consultation */}
        <button
          type="button"
          onClick={() => onNavigateModule('clinical-consultation')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            color: '#38BDF8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.22)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)')}
          title="Open Doctor Consultation & Prescription Pad"
        >
          <span>🩺</span>
          <span>Doctor OPD Desk</span>
        </button>

        {/* + Pharmacy Dispense */}
        <button
          type="button"
          onClick={() => onNavigateModule('pharmacy-medication')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(168, 85, 247, 0.12)',
            color: '#C084FC',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.22)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.12)')}
          title="Pharmacy Medicine Dispensation"
        >
          <span>💊</span>
          <span>Pharmacy POS</span>
        </button>
      </div>

      {/* Right: Quick Universal Search & Simple / Pro Mode Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Quick Search trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '5px 12px',
            color: '#94A3B8',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
          title="Search Patient by Name, Mobile or MRN (Ctrl+K)"
        >
          <span>🔍</span>
          <span>Search Patient / Bill...</span>
          <kbd
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#38BDF8',
              padding: '1px 5px',
              borderRadius: '4px',
              fontSize: '0.625rem',
              fontFamily: 'monospace'
            }}
          >
            Ctrl+K
          </kbd>
        </button>

        {/* Simple Mode / Pro Mode Switch */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '2px',
            gap: '2px'
          }}
        >
          <button
            type="button"
            onClick={() => !isSimpleMode && onToggleSimpleMode()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: isSimpleMode ? 800 : 500,
              backgroundColor: isSimpleMode ? '#0284C7' : 'transparent',
              color: isSimpleMode ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Clean, easy-to-use mode showing only essential daily tools"
          >
            <span>⚡ Simple</span>
          </button>
          <button
            type="button"
            onClick={() => isSimpleMode && onToggleSimpleMode()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: !isSimpleMode ? 800 : 500,
              backgroundColor: !isSimpleMode ? '#334155' : 'transparent',
              color: !isSimpleMode ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Full advanced view showing all 32 clinical & hospital modules"
          >
            <span>🛠️ Pro (30+)</span>
          </button>
        </div>

        {/* 1-Click Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: isFullscreen ? 'rgba(14, 165, 233, 0.2)' : '#0F172A',
            border: isFullscreen ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '5px 10px',
            color: isFullscreen ? '#38BDF8' : '#94A3B8',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isFullscreen ? '0 0 8px rgba(56, 189, 248, 0.25)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = isFullscreen ? 'rgba(56, 189, 248, 0.8)' : 'rgba(56, 189, 248, 0.4)';
            e.currentTarget.style.color = isFullscreen ? '#7DD3FC' : '#38BDF8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isFullscreen ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.color = isFullscreen ? '#38BDF8' : '#94A3B8';
          }}
          title={isFullscreen ? 'Exit Fullscreen Mode (Esc / F11 / Ctrl+Shift+F)' : 'Toggle Fullscreen Mode (F11 / Ctrl+Shift+F)'}
        >
          <span>{isFullscreen ? '↙' : '⛶'}</span>
          <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
        </button>
      </div>
    </div>
  );
};
