import React from 'react';

export interface ContentAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | undefined;
  padding?: 'none' | 'sm' | 'md' | 'lg' | undefined;
}

const maxWidthMap = {
  sm: '640px',
  md: '896px',
  lg: '1152px',
  xl: '1440px',
  full: '100%'
};

const paddingMap = {
  none: '0',
  sm: '12px',
  md: '20px',
  lg: '32px'
};

export const ContentArea: React.FC<ContentAreaProps> = ({
  children,
  maxWidth = 'full',
  padding = 'md',
  className = '',
  style,
  ...props
}) => {
  return (
    <main
      className={`ds-content-area ${className}`}
      style={{
        flex: '1 1 auto',
        width: '100%',
        maxWidth: maxWidthMap[maxWidth],
        margin: '0 auto',
        padding: paddingMap[padding],
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        ...style
      }}
      {...props}
    >
      {children}
    </main>
  );
};
