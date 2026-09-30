import React, { useState, useRef, useEffect } from 'react';

export interface TabOverflowOption {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

export interface TabOverflowMenuProps {
  label?: string;
  options: TabOverflowOption[];
  activeId: string;
  onSelect: (id: string) => void;
  onReset?: () => void;
  accentColor?: string;
  activeBorderColor?: string;
}

export const TabOverflowMenu: React.FC<TabOverflowMenuProps> = ({
  label = 'More Modules',
  options = [],
  activeId,
  onSelect,
  onReset,
  accentColor = '#0284C7',
  activeBorderColor = '#38BDF8'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const safeOptions = Array.isArray(options) ? options : [];
  const activeOption = safeOptions.find((opt) => opt.id === activeId);
  const isSecondaryActive = !!activeOption;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        zIndex: isOpen ? 9999 : 30
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: isSecondaryActive ? '#FFFFFF' : '#CBD5E1',
          backgroundColor: isSecondaryActive ? accentColor : '#1E293B',
          borderRadius: '6px',
          border: isSecondaryActive ? `1px solid ${activeBorderColor}` : '1px solid #334155',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          boxShadow: isSecondaryActive ? `0 0 12px ${accentColor}50` : 'none',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => {
          if (!isSecondaryActive) {
            e.currentTarget.style.backgroundColor = '#334155';
            e.currentTarget.style.color = '#F8FAFC';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSecondaryActive) {
            e.currentTarget.style.backgroundColor = '#1E293B';
            e.currentTarget.style.color = '#CBD5E1';
          }
        }}
        title={isSecondaryActive ? `Active Module: ${activeOption?.label || ''}` : `${label} (${safeOptions.length})`}
      >
        <span>
          {isSecondaryActive ? (activeOption?.label || '') : `${label} (${safeOptions.length})`}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            opacity: 0.8,
            display: 'inline-block'
          }}
        >
          ▼
        </span>

        {isSecondaryActive && onReset && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onReset();
              setIsOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onReset();
                setIsOpen(false);
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: 800,
              marginLeft: '4px',
              cursor: 'pointer',
              lineHeight: 1
            }}
            title="Reset to main overview"
          >
            ✕
          </span>
        )}
      </button>

      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            minWidth: '240px',
            maxWidth: '360px',
            maxHeight: '380px',
            overflowY: 'auto',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '8px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            padding: '6px',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#64748B',
              borderBottom: '1px solid #1E293B',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{label} ({safeOptions.length})</span>
            {isSecondaryActive && onReset ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                  setIsOpen(false);
                }}
                style={{
                  fontSize: '0.62rem',
                  color: '#38BDF8',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  padding: '1px 4px',
                  borderRadius: '3px'
                }}
              >
                ✕ Reset Selection
              </button>
            ) : (
              <span style={{ fontSize: '0.62rem', color: '#475569', textTransform: 'none' }}>ESC to close</span>
            )}
          </div>

          {options.map((opt) => {
            const isSelected = opt.id === activeId;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(opt.id);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#FFFFFF' : '#CBD5E1',
                  backgroundColor: isSelected ? accentColor : 'transparent',
                  borderRadius: '6px',
                  border: isSelected ? `1px solid ${activeBorderColor}` : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#1E293B';
                    e.currentTarget.style.color = '#F8FAFC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#CBD5E1';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {opt.icon && <span>{opt.icon}</span>}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {opt.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isSelected && (
                    <span style={{ fontSize: '0.7rem', color: '#FFFFFF', fontWeight: 800 }}>✓</span>
                  )}
                  {opt.count !== undefined && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#334155',
                        color: isSelected ? '#FFFFFF' : '#94A3B8',
                        fontWeight: 700
                      }}
                    >
                      {opt.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
