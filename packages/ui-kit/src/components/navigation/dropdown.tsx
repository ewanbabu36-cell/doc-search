import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode | undefined;
  onClick?: (() => void) | undefined;
  isDanger?: boolean | undefined;
  disabled?: boolean | undefined;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: (DropdownItem | 'divider')[];
  align?: 'left' | 'right' | undefined;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ cursor: 'pointer', display: 'inline-flex' }}
        role="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          className="ds-interactive"
          style={{
            position: 'absolute',
            top: '100%',
            marginTop: '4px',
            [align]: 0,
            zIndex: 50,
            minWidth: '180px',
            backgroundColor: 'var(--ds-color-surface)',
            border: '1px solid var(--ds-color-border)',
            borderRadius: '6px',
            boxShadow: 'var(--ds-shadow-lg)',
            padding: '4px 0',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {items.map((item, idx) => {
            if (item === 'divider') {
              return (
                <div
                  key={idx}
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--ds-color-border-subtle)',
                    margin: '4px 0'
                  }}
                />
              );
            }

            return (
              <button
                key={item.id}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setIsOpen(false);
                  }
                }}
                className="ds-interactive"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 14px',
                  fontSize: '0.875rem',
                  color: item.isDanger ? 'var(--ds-color-danger)' : 'var(--ds-color-text-primary)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.5 : 1
                }}
              >
                {item.icon && <span style={{ display: 'inline-flex' }}>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
