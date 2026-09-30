import React, { useState, useEffect } from 'react';
import { Input } from '@docsearch/ui-kit';

export interface AuditJustificationFieldProps {
  value: string;
  onChange: (value: string) => void;
  defaultJustification: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

/**
 * Reusable Progressive Disclosure Field for Audit Justification & Regulatory Traces.
 * Pre-populates a sensible default to eliminate repetitive manual typing fatigue,
 * with an unobtrusive '+ Add Custom Audit Note' toggle for supervisor customization.
 */
export const AuditJustificationField: React.FC<AuditJustificationFieldProps> = ({
  value,
  onChange,
  defaultJustification,
  label = 'Audit Justification',
  placeholder,
  required = true,
  style
}) => {
  const [isCustomNoteOpen, setIsCustomNoteOpen] = useState(false);

  // Auto-seed with sensible default if empty
  useEffect(() => {
    if (!value && defaultJustification) {
      onChange(defaultJustification);
    }
  }, [value, defaultJustification, onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94A3B8' }}>
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
        <button
          type="button"
          onClick={() => {
            const nextState = !isCustomNoteOpen;
            setIsCustomNoteOpen(nextState);
            if (nextState && !value) {
              onChange(defaultJustification);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#38BDF8',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'underline'
          }}
        >
          {isCustomNoteOpen ? 'Hide Custom Note' : '+ Add Custom Audit Note'}
        </button>
      </div>

      {isCustomNoteOpen ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || defaultJustification}
          required={required}
          autoFocus
        />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#94A3B8',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '7px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            transition: 'all 0.12s ease'
          }}
          onClick={() => setIsCustomNoteOpen(true)}
          title="Click to edit custom audit reason"
        >
          <span style={{ color: '#10B981', fontWeight: 800, fontSize: '0.85rem' }}>✓</span>
          <span style={{ color: '#E2E8F0', fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value || defaultJustification}
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              color: '#64748B',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '1px 5px',
              borderRadius: '4px',
              flexShrink: 0
            }}
          >
            Auto Pre-filled
          </span>
        </div>
      )}
    </div>
  );
};
