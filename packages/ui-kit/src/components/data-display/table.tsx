import React, { createContext, useContext } from 'react';
import { Skeleton } from '../feedback/skeleton';

export type TableDensity = 'comfortable' | 'compact' | 'ultraDense';

interface TableContextValue {
  density: TableDensity;
  isStriped: boolean;
}

const TableContext = createContext<TableContextValue>({
  density: 'comfortable',
  isStriped: false
});

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  isStickyHeader?: boolean | undefined;
  isStriped?: boolean | undefined;
  isDense?: boolean | undefined;
  density?: TableDensity | undefined;
}

export const TableContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  style,
  ...props
}) => (
  <div
    className={`ds-table-container ${className}`}
    style={{
      width: '100%',
      maxWidth: '100%',
      overflowX: 'auto',
      overflowY: 'hidden',
      border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
      borderRadius: '8px',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

export const Table: React.FC<TableProps> = ({
  children,
  isStickyHeader = false,
  isStriped = false,
  isDense = false,
  density,
  className = '',
  style,
  ...props
}) => {
  const activeDensity: TableDensity = density || (isDense ? 'compact' : 'comfortable');

  return (
    <TableContext.Provider value={{ density: activeDensity, isStriped }}>
      <table
        className={`ds-table ds-table-${activeDensity} ${isStriped ? 'ds-table-striped' : ''} ${isStickyHeader ? 'ds-table-sticky' : ''} ${className}`}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: activeDensity === 'ultraDense' ? '0.75rem' : activeDensity === 'compact' ? '0.8125rem' : '0.875rem',
          color: 'var(--ds-color-text-primary)',
          ...style
        }}
        {...props}
      >
        {children}
      </table>
    </TableContext.Provider>
  );
};

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  isSticky?: boolean | undefined;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  isSticky = false,
  className = '',
  style,
  ...props
}) => (
  <thead
    className={`ds-table-header ${isSticky ? 'ds-table-sticky-header' : ''} ${className}`}
    style={{
      backgroundColor: 'var(--ds-color-surface-subtle, rgba(22, 27, 34, 0.95))',
      borderBottom: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
      position: isSticky ? 'sticky' : 'static',
      top: isSticky ? 0 : 'auto',
      zIndex: isSticky ? 10 : 'auto',
      backdropFilter: isSticky ? 'blur(12px)' : 'none',
      ...style
    }}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  style,
  ...props
}) => (
  <tbody className={`ds-table-body ${className}`} style={{ ...style }} {...props}>
    {children}
  </tbody>
);

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  isSelected?: boolean | undefined;
  isClickable?: boolean | undefined;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  isSelected = false,
  isClickable = false,
  className = '',
  style,
  ...props
}) => (
  <tr
    className={`ds-table-row ${isSelected ? 'ds-table-row-selected' : ''} ${isClickable ? 'ds-interactive ds-table-row-clickable' : ''} ${className}`}
    style={{
      borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.05))',
      borderLeft: isSelected ? '3px solid var(--ds-color-primary)' : '3px solid transparent',
      backgroundColor: isSelected ? 'var(--ds-color-surface-selected, rgba(2, 132, 199, 0.16))' : 'transparent',
      cursor: isClickable ? 'pointer' : 'default',
      transition: 'background-color 120ms cubic-bezier(0.1, 0.9, 0.2, 1), border-color 120ms cubic-bezier(0.1, 0.9, 0.2, 1)',
      ...style
    }}
    {...props}
  >
    {children}
  </tr>
);

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  isSortable?: boolean | undefined;
  sortDirection?: 'asc' | 'desc' | null | undefined;
  onSort?: (() => void) | undefined;
  density?: TableDensity | undefined;
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  isSortable = false,
  sortDirection,
  onSort,
  density: explicitDensity,
  className = '',
  style,
  ...props
}) => {
  const context = useContext(TableContext);
  const density = explicitDensity || context.density;

  const paddingMap: Record<TableDensity, string> = {
    comfortable: '12px 16px',
    compact: '6px 12px',
    ultraDense: '4px 10px'
  };

  return (
    <th
      className={`ds-table-head ${isSortable ? 'ds-interactive' : ''} ${className}`}
      onClick={isSortable ? onSort : undefined}
      style={{
        padding: paddingMap[density],
        fontWeight: '600',
        color: 'var(--ds-color-text-secondary)',
        whiteSpace: 'nowrap',
        cursor: isSortable ? 'pointer' : 'default',
        userSelect: isSortable ? 'none' : 'auto',
        ...style
      }}
      {...props}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span>{children}</span>
        {isSortable && (
          <span style={{ display: 'inline-flex', opacity: sortDirection ? 1 : 0.4, fontSize: '0.75rem' }}>
            {sortDirection === 'asc' ? '▲' : sortDirection === 'desc' ? '▼' : '⇅'}
          </span>
        )}
      </div>
    </th>
  );
};

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  density?: TableDensity | undefined;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  density: explicitDensity,
  className = '',
  style,
  ...props
}) => {
  const context = useContext(TableContext);
  const density = explicitDensity || context.density;

  const paddingMap: Record<TableDensity, string> = {
    comfortable: '12px 16px',
    compact: '6px 12px',
    ultraDense: '4px 10px'
  };

  return (
    <td
      className={`ds-table-cell ${className}`}
      style={{
        padding: paddingMap[density],
        verticalAlign: 'middle',
        ...style
      }}
      {...props}
    >
      {children}
    </td>
  );
};

export const TableEmptyState: React.FC<{ message?: string | undefined; colSpan: number }> = ({
  message = 'No records found',
  colSpan
}) => (
  <tr>
    <td
      colSpan={colSpan}
      style={{
        padding: '48px 16px',
        textAlign: 'center',
        color: 'var(--ds-color-text-muted)',
        fontSize: '0.875rem'
      }}
    >
      {message}
    </td>
  </tr>
);

export interface TableLoadingStateProps {
  colSpan: number;
  rowCount?: number;
  label?: string | undefined;
}

export const TableLoadingState: React.FC<TableLoadingStateProps> = ({
  colSpan,
  rowCount = 5,
  label: _label
}) => (
  <>
    {Array.from({ length: rowCount }).map((_, rIdx) => (
      <tr
        key={rIdx}
        className="ds-table-row"
        style={{
          borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.05))'
        }}
      >
        {Array.from({ length: colSpan }).map((_, cIdx) => (
          <td key={cIdx} style={{ padding: '14px 16px' }}>
            <Skeleton
              variant="rounded"
              height="16px"
              width={cIdx === 0 ? '70%' : cIdx === colSpan - 1 ? '40%' : `${45 + ((rIdx * 17 + cIdx * 23) % 45)}%`}
              animation="wave"
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);
