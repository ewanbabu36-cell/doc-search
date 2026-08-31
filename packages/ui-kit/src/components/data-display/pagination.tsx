import React from 'react';
import { Button } from '../primitives/button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number | undefined;
  pageSize?: number | undefined;
  onPageChange: (page: number) => void;
  onPageSizeChange?: ((pageSize: number) => void) | undefined;
  className?: string | undefined;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = ''
}) => {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div
      className={`ds-pagination ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid var(--ds-color-border-subtle)',
        fontSize: '0.875rem',
        color: 'var(--ds-color-text-secondary)'
      }}
    >
      <div>
        {totalItems !== undefined && (
          <span>
            Total: <strong>{totalItems}</strong> records
            {pageSize && <span style={{ color: 'var(--ds-color-text-muted)' }}> ({pageSize} per page)</span>}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          Previous
        </Button>

        <span style={{ padding: '0 8px', fontWeight: '500' }}>
          Page {currentPage} of {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
