import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'wave',
  className = '',
  style,
  ...props
}) => {
  const getDefaultHeight = () => {
    switch (variant) {
      case 'text': return '1rem';
      case 'circular': return width || '40px';
      case 'rectangular': return '120px';
      case 'rounded': return '40px';
    }
  };

  const getBorderRadius = () => {
    switch (variant) {
      case 'text': return '4px';
      case 'circular': return '50%';
      case 'rectangular': return '0px';
      case 'rounded': return '8px';
    }
  };

  const resolvedWidth = width ?? (variant === 'text' ? '100%' : '100%');
  const resolvedHeight = height ?? getDefaultHeight();

  return (
    <div
      role="status"
      aria-label="Loading..."
      aria-busy="true"
      className={`ds-skeleton ds-skeleton-${variant} ds-skeleton-${animation} ${className}`}
      style={{
        display: 'block',
        width: typeof resolvedWidth === 'number' ? `${resolvedWidth}px` : resolvedWidth,
        height: typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight,
        borderRadius: getBorderRadius(),
        backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.06))',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      {...props}
    />
  );
};

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  showHeader?: boolean;
  lines?: number;
  hasAction?: boolean;
  padding?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showHeader = true,
  lines = 3,
  hasAction = true,
  padding = '20px',
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`ds-skeleton-card ${className}`}
      style={{
        backgroundColor: 'var(--ds-color-surface)',
        border: '1px solid var(--ds-color-border-subtle)',
        borderRadius: '16px',
        padding,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--ds-shadow-sm)',
        overflow: 'hidden',
        ...style
      }}
      {...props}
    >
      {showHeader && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <Skeleton variant="rounded" width="40px" height="40px" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <Skeleton variant="rounded" width="55%" height="16px" />
              <Skeleton variant="text" width="35%" height="12px" />
            </div>
          </div>
          <Skeleton variant="rounded" width="60px" height="24px" />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: lines }).map((_, idx) => (
          <Skeleton
            key={idx}
            variant="text"
            height="14px"
            width={idx === lines - 1 ? '55%' : `${85 + ((idx * 23) % 15)}%`}
          />
        ))}
      </div>

      {hasAction && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
          <Skeleton variant="rounded" width="80px" height="32px" />
          <Skeleton variant="rounded" width="100px" height="32px" />
        </div>
      )}
    </div>
  );
};

export interface SkeletonMetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  showSparkline?: boolean;
}

export const SkeletonMetricCard: React.FC<SkeletonMetricCardProps> = ({
  showSparkline = true,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`ds-skeleton-metric-card ${className}`}
      style={{
        backgroundColor: 'var(--ds-color-surface)',
        border: '1px solid var(--ds-color-border-subtle)',
        borderRadius: '16px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'var(--ds-shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton variant="rounded" width="34px" height="34px" />
        <Skeleton variant="rounded" width="58px" height="20px" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Skeleton variant="rounded" width="45%" height="28px" />
        <Skeleton variant="text" width="65%" height="13px" />
      </div>

      {showSparkline && (
        <div style={{ marginTop: '4px' }}>
          <Skeleton variant="rounded" width="100%" height="32px" />
        </div>
      )}
    </div>
  );
};

export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  columns = 5,
  rows = 5,
  showHeader = true,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`ds-skeleton-table-wrapper ${className}`}
      style={{
        width: '100%',
        backgroundColor: 'var(--ds-color-surface)',
        border: '1px solid var(--ds-color-border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--ds-shadow-sm)',
        ...style
      }}
      {...props}
    >
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          {showHeader && (
            <thead>
              <tr style={{ backgroundColor: 'var(--ds-color-surface-subtle)', borderBottom: '1px solid var(--ds-color-border)' }}>
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <th key={cIdx} style={{ padding: '14px 16px' }}>
                    <Skeleton
                      variant="rounded"
                      height="15px"
                      width={cIdx === 0 ? '60%' : cIdx === columns - 1 ? '40%' : `${50 + ((cIdx * 19) % 35)}%`}
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid var(--ds-color-border-subtle)' }}>
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <td key={cIdx} style={{ padding: '14px 16px' }}>
                    <Skeleton
                      variant="rounded"
                      height="16px"
                      width={cIdx === 0 ? '75%' : cIdx === columns - 1 ? '45%' : `${40 + ((rIdx * 13 + cIdx * 29) % 45)}%`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number;
  hasAvatar?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 4,
  hasAvatar = true,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`ds-skeleton-list ${className}`}
      style={{
        backgroundColor: 'var(--ds-color-surface)',
        border: '1px solid var(--ds-color-border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
      {...props}
    >
      {Array.from({ length: items }).map((_, idx) => (
        <div
          key={idx}
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: idx === items - 1 ? 'none' : '1px solid var(--ds-color-border-subtle)',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {hasAvatar && <Skeleton variant="circular" width="36px" height="36px" />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <Skeleton variant="rounded" width="50%" height="16px" />
              <Skeleton variant="text" width="35%" height="12px" />
            </div>
          </div>
          <Skeleton variant="rounded" width="70px" height="24px" />
        </div>
      ))}
    </div>
  );
};

export interface SkeletonPageProps extends React.HTMLAttributes<HTMLDivElement> {
  metricCount?: number;
  layout?: 'table' | 'cards';
  cardCount?: number;
}

export const SkeletonPage: React.FC<SkeletonPageProps> = ({
  metricCount = 4,
  layout = 'table',
  cardCount = 3,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`ds-skeleton-page ${className}`}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px',
        fontFamily: 'inherit',
        ...style
      }}
      {...props}
    >
      {/* Top Header Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton variant="rounded" width="220px" height="26px" />
          <Skeleton variant="text" width="140px" height="13px" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Skeleton variant="rounded" width="90px" height="36px" />
          <Skeleton variant="rounded" width="120px" height="36px" />
        </div>
      </div>

      {/* 4-Card Bento Metric Grid */}
      {metricCount > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
            gap: '14px'
          }}
        >
          {Array.from({ length: metricCount }).map((_, idx) => (
            <SkeletonMetricCard key={idx} />
          ))}
        </div>
      )}

      {/* Filter / Tabs Ribbon Shimmer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px' }}>
        <Skeleton variant="rounded" width="70px" height="32px" />
        <Skeleton variant="rounded" width="90px" height="32px" />
        <Skeleton variant="rounded" width="110px" height="32px" />
        <Skeleton variant="rounded" width="80px" height="32px" />
      </div>

      {/* Main Content Area */}
      {layout === 'table' ? (
        <SkeletonTable columns={6} rows={6} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}
        >
          {Array.from({ length: cardCount }).map((_, idx) => (
            <SkeletonCard key={idx} lines={3} />
          ))}
        </div>
      )}
    </div>
  );
};

export interface TableRowSkeletonProps {
  columns?: number;
  rows?: number;
  cellHeight?: string | number;
  showActionsCol?: boolean;
}

export const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({
  columns = 5,
  rows = 5,
  cellHeight = '16px',
  showActionsCol = true
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr
          key={rIdx}
          className="ds-skeleton-tr"
          style={{
            borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.06))',
            height: '52px'
          }}
        >
          {Array.from({ length: columns }).map((_, cIdx) => {
            const isLast = cIdx === columns - 1;
            const isFirst = cIdx === 0;
            return (
              <td
                key={cIdx}
                style={{
                  padding: '12px 16px',
                  verticalAlign: 'middle'
                }}
              >
                {isLast && showActionsCol ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    <Skeleton variant="rounded" width="28px" height="28px" />
                    <Skeleton variant="rounded" width="56px" height="28px" />
                  </div>
                ) : (
                  <Skeleton
                    variant="rounded"
                    height={cellHeight}
                    width={isFirst ? '70%' : `${40 + ((rIdx * 17 + cIdx * 31) % 45)}%`}
                  />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
};

export interface PrescriptionPadSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  medicationRows?: number;
}

export const PrescriptionPadSkeleton: React.FC<PrescriptionPadSkeletonProps> = ({
  medicationRows = 4,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`ds-prescription-pad-skeleton ${className}`}
      style={{
        backgroundColor: 'var(--ds-color-surface, #ffffff)',
        border: '1px solid var(--ds-color-border, #e2e8f0)',
        borderRadius: '16px',
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: 'var(--ds-shadow-md)',
        minHeight: '680px',
        maxWidth: '100%',
        margin: '0 auto',
        ...style
      }}
      {...props}
    >
      {/* 1. Header Banner: Doctor & Clinic Branding */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid var(--ds-color-border-subtle, #f1f5f9)',
          paddingBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Skeleton variant="circular" width="52px" height="52px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton variant="rounded" width="240px" height="22px" />
            <Skeleton variant="text" width="180px" height="14px" />
            <Skeleton variant="text" width="140px" height="12px" />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton variant="rounded" width="90px" height="24px" />
            <Skeleton variant="rounded" width="110px" height="24px" />
          </div>
          <Skeleton variant="text" width="130px" height="13px" />
          <Skeleton variant="rounded" width="80px" height="20px" />
        </div>
      </div>

      {/* 2. Patient Demographics & Clinical Vitals Strip */}
      <div
        style={{
          backgroundColor: 'var(--ds-color-surface-subtle, #f8fafc)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '16px',
          border: '1px solid var(--ds-color-border-subtle, #e2e8f0)'
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton variant="text" width="45px" height="11px" />
            <Skeleton variant="rounded" width="80%" height="16px" />
          </div>
        ))}
      </div>

      {/* 3. Chief Complaints & Clinical Notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Skeleton variant="rounded" width="140px" height="18px" />
          <Skeleton variant="rounded" width="70px" height="20px" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton variant="text" width="95%" height="14px" />
          <Skeleton variant="text" width="82%" height="14px" />
        </div>
      </div>

      {/* 4. ICD-10 Provisional Diagnosis Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <Skeleton variant="rounded" width="110px" height="18px" />
        <Skeleton variant="rounded" width="180px" height="28px" />
        <Skeleton variant="rounded" width="220px" height="28px" />
      </div>

      {/* 5. Rx Medication Table Grid */}
      <div
        style={{
          border: '1px solid var(--ds-color-border, #e2e8f0)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}
      >
        {/* Table Header */}
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface-subtle, #f8fafc)',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr',
            gap: '12px',
            borderBottom: '1px solid var(--ds-color-border, #e2e8f0)'
          }}
        >
          {['Medicine Name', 'Strength', 'Dosage', 'Duration', 'Instructions'].map((_, idx) => (
            <Skeleton key={idx} variant="rounded" width="75%" height="14px" />
          ))}
        </div>
        {/* Table Rows */}
        {Array.from({ length: medicationRows }).map((_, rIdx) => (
          <div
            key={rIdx}
            style={{
              padding: '14px 16px',
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr',
              gap: '12px',
              alignItems: 'center',
              borderBottom: rIdx === medicationRows - 1 ? 'none' : '1px solid var(--ds-color-border-subtle, #f1f5f9)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Skeleton variant="rounded" width="80%" height="16px" />
              <Skeleton variant="text" width="50%" height="11px" />
            </div>
            <Skeleton variant="rounded" width="60%" height="15px" />
            <Skeleton variant="rounded" width="70%" height="15px" />
            <Skeleton variant="rounded" width="50%" height="15px" />
            <Skeleton variant="rounded" width="85%" height="15px" />
          </div>
        ))}
      </div>

      {/* 6. Investigations & Lifestyle Advice */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface-subtle, #f8fafc)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <Skeleton variant="rounded" width="130px" height="16px" />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Skeleton variant="rounded" width="100px" height="24px" />
            <Skeleton variant="rounded" width="120px" height="24px" />
            <Skeleton variant="rounded" width="85px" height="24px" />
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface-subtle, #f8fafc)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <Skeleton variant="rounded" width="110px" height="16px" />
          <Skeleton variant="text" width="90%" height="13px" />
          <Skeleton variant="text" width="75%" height="13px" />
        </div>
      </div>

      {/* 7. Footer: Doctor Digital Signature & Verification QR */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '20px',
          borderTop: '1px dashed var(--ds-color-border, #cbd5e1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Skeleton variant="rounded" width="56px" height="56px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton variant="rounded" width="160px" height="14px" />
            <Skeleton variant="text" width="110px" height="11px" />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <Skeleton variant="rounded" width="140px" height="32px" />
          <Skeleton variant="text" width="160px" height="12px" />
        </div>
      </div>
    </div>
  );
};

