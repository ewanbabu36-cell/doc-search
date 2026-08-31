import React, { useState } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right' | undefined;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-6px)' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%) translateY(6px)' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%) translateX(-6px)' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%) translateX(6px)' }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className="ds-interactive"
          style={{
            position: 'absolute',
            zIndex: 100,
            padding: '4px 8px',
            fontSize: '0.75rem',
            fontWeight: '500',
            backgroundColor: 'var(--ds-color-text-primary)',
            color: 'var(--ds-color-text-inverse)',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: 'var(--ds-shadow-md)',
            ...positionStyles[position]
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
