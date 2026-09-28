import React, { useState, useEffect, useRef } from 'react';
import {
  patientSessionTabService,
  type PatientSessionTab
} from '../../services/patient-session-tab-service.js';

export interface PatientSessionTabBarProps {
  onNavigateModule?: (moduleKey: string, subTab?: string) => void;
  onOpenFastRegistration?: () => void;
}

export const PatientSessionTabBar: React.FC<PatientSessionTabBarProps> = ({
  onNavigateModule,
  onOpenFastRegistration
}) => {
  const [tabs, setTabs] = useState<PatientSessionTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = patientSessionTabService.subscribe((currentTabs, currentActiveId) => {
      setTabs(currentTabs);
      setActiveTabId(currentActiveId);
    });
    return unsub;
  }, []);

  // Close new tab menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  // If no tabs are open, don't occupy screen space
  if (tabs.length === 0) {
    return null;
  }

  const handleTabClick = (tab: PatientSessionTab) => {
    patientSessionTabService.switchTab(tab.id);
    if (onNavigateModule && tab.module) {
      onNavigateModule(tab.module, tab.subTab);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tab: PatientSessionTab) => {
    e.stopPropagation();
    if (tab.isDirty) {
      const confirmClose = window.confirm(
        `Close "${tab.title}"? You have unsaved changes in this session that will be discarded.`
      );
      if (!confirmClose) return;
    }
    patientSessionTabService.closeTab(tab.id);
  };

  const handleCreateNewTab = (type: 'OPD' | 'POS' | 'LAB' | 'REGISTRATION') => {
    setIsNewMenuOpen(false);
    if (type === 'REGISTRATION') {
      if (onOpenFastRegistration) onOpenFastRegistration();
      return;
    }

    if (type === 'OPD') {
      const newTab = patientSessionTabService.openTab({
        title: 'New Consultation',
        subtitle: 'Walk-in',
        type: 'OPD',
        module: 'clinical-consultation',
        subTab: 'cockpit'
      });
      if (onNavigateModule) onNavigateModule(newTab.module, newTab.subTab);
    } else if (type === 'POS') {
      const billNum = Math.floor(1000 + Math.random() * 9000);
      const newTab = patientSessionTabService.openTab({
        title: `POS: Bill #${billNum}`,
        subtitle: 'Walk-in Chemist',
        type: 'POS',
        module: 'pharmacy-medication',
        subTab: 'pos'
      });
      if (onNavigateModule) onNavigateModule(newTab.module, newTab.subTab);
    } else if (type === 'LAB') {
      const newTab = patientSessionTabService.openTab({
        title: 'Lab: Direct Order',
        subtitle: 'Pathology',
        type: 'LAB',
        module: 'clinical-investigation'
      });
      if (onNavigateModule) onNavigateModule(newTab.module);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--ds-color-surface, #0F172A)',
        borderBottom: '1px solid var(--ds-color-border, rgba(255,255,255,0.08))',
        padding: '0 12px',
        minHeight: '38px',
        maxHeight: '38px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 40,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Scrollable Tabs Track */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '4px 0',
          flex: 1
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              title={`${tab.title} (${tab.subtitle || tab.type})`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                minWidth: '120px',
                maxWidth: '220px',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                userSelect: 'none',
                backgroundColor: isActive
                  ? 'var(--ds-color-bg, #0B111E)'
                  : 'rgba(255,255,255,0.03)',
                borderTop: isActive
                  ? '2px solid var(--ds-color-primary, #06B6D4)'
                  : '2px solid transparent',
                borderLeft: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.06))',
                borderRight: '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.06))',
                borderBottom: isActive
                  ? '1px solid var(--ds-color-bg, #0B111E)'
                  : '1px solid var(--ds-color-border-subtle, rgba(255,255,255,0.06))',
                color: isActive
                  ? 'var(--ds-color-text-primary, #F8FAFC)'
                  : 'var(--ds-color-text-muted, #94A3B8)',
                transition: 'all 0.12s ease',
                position: 'relative',
                boxShadow: isActive ? '0 -2px 8px rgba(0,0,0,0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
              }}
            >
              {/* Tab Icon */}
              <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>
                {tab.icon || '👤'}
              </span>

              {/* Title & Subtitle */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  lineHeight: 1.15,
                  flex: 1
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 800 : 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: isActive ? '#F8FAFC' : '#CBD5E1'
                  }}
                >
                  {tab.title}
                </div>
                {tab.subtitle && (
                  <div
                    style={{
                      fontSize: '0.625rem',
                      color: isActive ? '#38BDF8' : '#64748B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'monospace'
                    }}
                  >
                    {tab.subtitle}
                  </div>
                )}
              </div>

              {/* Unsaved Changes Indicator Dot */}
              {tab.isDirty && (
                <span
                  title="Unsaved changes in this session"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#F59E0B',
                    boxShadow: '0 0 6px #F59E0B',
                    flexShrink: 0
                  }}
                />
              )}

              {/* Close Tab Button */}
              <button
                type="button"
                onClick={(e) => handleCloseTab(e, tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-color-text-muted, #94A3B8)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                title="Close Tab (Alt+W)"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--ds-color-text-muted, #94A3B8)';
                }}
              >
                ✕
              </button>
            </div>
          );
        })}

        {/* + New Tab Dropdown Button */}
        <div ref={newMenuRef} style={{ position: 'relative', display: 'inline-block' }}>
          <button
            type="button"
            onClick={() => setIsNewMenuOpen((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--ds-color-text-secondary, #CBD5E1)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              height: '28px',
              transition: 'all 0.12s ease'
            }}
            title="Open New Clinical or Billing Session Tab"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)';
              e.currentTarget.style.color = '#38BDF8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'var(--ds-color-text-secondary, #CBD5E1)';
            }}
          >
            <span>+</span>
            <span>New Tab</span>
          </button>

          {/* New Tab Menu Popup */}
          {isNewMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '32px',
                left: 0,
                width: '180px',
                backgroundColor: 'var(--ds-color-surface, #0F172A)',
                border: '1px solid var(--ds-color-border, rgba(255,255,255,0.15))',
                borderRadius: '8px',
                boxShadow: '0 12px 28px rgba(0,0,0,0.85)',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 100,
                animation: 'fadeIn 0.15s ease-out'
              }}
            >
              <button
                type="button"
                onClick={() => handleCreateNewTab('OPD')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span>🩺</span>
                <span>New OPD Consult</span>
              </button>

              <button
                type="button"
                onClick={() => handleCreateNewTab('POS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span>💊</span>
                <span>New Pharmacy POS</span>
              </button>

              <button
                type="button"
                onClick={() => handleCreateNewTab('LAB')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span>🔬</span>
                <span>New Lab Order</span>
              </button>

              <button
                type="button"
                onClick={() => handleCreateNewTab('REGISTRATION')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span>⚡</span>
                <span>Fast Registration</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Legend & Shortcuts */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.625rem',
          color: 'var(--ds-color-text-muted, #64748B)',
          flexShrink: 0
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <kbd style={{ fontFamily: 'monospace', padding: '1px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>Ctrl+Tab</kbd>
          <span>cycle</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <kbd style={{ fontFamily: 'monospace', padding: '1px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>Alt+W</kbd>
          <span>close</span>
        </span>
      </div>
    </div>
  );
};
