import React from 'react';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | undefined;
  label?: string | undefined;
}

const sizeMap = {
  sm: '16px',
  md: '20px',
  lg: '28px'
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
  className = '',
  style,
  ...props
}) => {
  const pixelSize = sizeMap[size];

  return (
    <svg
      role="status"
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`ds-spinner ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        animation: 'ds-spin 0.75s linear infinite',
        ...style
      }}
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeOpacity="1" />
    </svg>
  );
};
