import React from 'react';
import { Spinner } from '../primitives/spinner';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  isStickyHeader?: boolean | undefined;
  isStriped?: boolean | undefined;
  isDense?: boolean | undefined;
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
  className = '',
  style,
  ...props
}) => (
  <table
    className={`ds-table ${isStriped ? 'ds-table-striped' : ''} ${isStickyHeader ? 'ds-table-sticky' : ''} ${className}`}
    style={{
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
      fontSize: isDense ? '0.8125rem' : '0.875rem',
      color: 'var(--ds-color-text-primary)',
      ...style
    }}
    {...props}
  >
    {children}
  </table>
);

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
    className={`ds-table-header ${className}`}
    style={{
      backgroundColor: 'var(--ds-color-surface-subtle)',
      borderBottom: '1px solid var(--ds-color-border)',
      position: isSticky ? 'sticky' : 'static',
      top: isSticky ? 0 : 'auto',
      zIndex: isSticky ? 10 : 'auto',
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
    className={`ds-interactive ${className}`}
    style={{
      borderBottom: '1px solid var(--ds-color-border-subtle)',
      backgroundColor: isSelected ? 'var(--ds-color-surface-selected)' : 'transparent',
      cursor: isClickable ? 'pointer' : 'default',
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
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  isSortable = false,
  sortDirection,
  onSort,
  className = '',
  style,
  ...props
}) => (
  <th
    className={`ds-table-head ${isSortable ? 'ds-interactive' : ''} ${className}`}
    onClick={isSortable ? onSort : undefined}
    style={{
      padding: '12px 16px',
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
        <span style={{ display: 'inline-flex', opacity: sortDirection ? 1 : 0.4 }}>
          {sortDirection === 'asc' ? '▲' : sortDirection === 'desc' ? '▼' : '⇅'}
        </span>
      )}
    </div>
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  style,
  ...props
}) => (
  <td
    className={`ds-table-cell ${className}`}
    style={{
      padding: '12px 16px',
      verticalAlign: 'middle',
      ...style
    }}
    {...props}
  >
    {children}
  </td>
);

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

export const TableLoadingState: React.FC<{ colSpan: number; label?: string | undefined }> = ({
  colSpan,
  label = 'Loading data...'
}) => (
  <tr>
    <td
      colSpan={colSpan}
      style={{
        padding: '48px 16px',
        textAlign: 'center'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>{label}</span>
      </div>
    </td>
  </tr>
);
