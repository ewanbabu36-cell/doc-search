import React from 'react';

export interface AppShellProps {
  header?: React.ReactNode | undefined;
  sidebar?: React.ReactNode | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}

export const AppShell: React.FC<AppShellProps> = ({
  header,
  sidebar,
  children,
  className = ''
}) => {
  return (
    <div
      className={`ds-app-shell ${className}`}
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        backgroundColor: 'var(--ds-color-bg)'
      }}
    >
      {/* Desktop / Tablet Sidebar */}
      {sidebar && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 30
          }}
        >
          {sidebar}
        </div>
      )}

      {/* Main Workspace Column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 0%',
          minWidth: 0,
          minHeight: '100vh',
          width: '100%',
          overflowX: 'hidden'
        }}
      >
        {header}
        <div
          style={{
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            width: '100%',
            overflowX: 'hidden'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
