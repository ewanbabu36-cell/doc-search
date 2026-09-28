import React from 'react';

export interface CommandBarAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'subtle' | 'danger';
  disabled?: boolean;
  active?: boolean;
}

export interface CommandBarGroup {
  id: string;
  actions: CommandBarAction[];
}

export interface WorkstationCommandBarProps {
  groups?: CommandBarGroup[];
  primaryActions?: CommandBarAction[];
  secondaryActions?: CommandBarAction[];
  searchSlot?: React.ReactNode;
  statusSlot?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const WorkstationCommandBar: React.FC<WorkstationCommandBarProps> = ({
  groups,
  primaryActions,
  secondaryActions,
  searchSlot,
  statusSlot,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`ds-command-bar ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '8px 14px',
        backgroundColor: 'var(--ds-surface-l2, rgba(22, 27, 34, 0.9))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
        borderRadius: '10px',
        boxShadow: 'var(--ds-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.2))',
        fontSize: '0.8125rem',
        ...style
      }}
    >
      {/* Left Cluster: Command Groups or Primary Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {groups && groups.length > 0 ? (
          groups.map((group, gIdx) => (
            <React.Fragment key={group.id}>
              {gIdx > 0 && (
                <div
                  style={{
                    width: '1px',
                    height: '18px',
                    backgroundColor: 'var(--ds-color-border-subtle, rgba(255, 255, 255, 0.1))',
                    margin: '0 4px'
                  }}
                />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {group.actions.map((action) => (
                  <CommandButton key={action.id} action={action} />
                ))}
              </div>
            </React.Fragment>
          ))
        ) : (
          primaryActions?.map((action) => <CommandButton key={action.id} action={action} />)
        )}
      </div>

      {/* Right Cluster: Search, Secondary Actions & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {searchSlot && <div style={{ flexShrink: 0 }}>{searchSlot}</div>}

        {secondaryActions && secondaryActions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {secondaryActions.map((action) => (
              <CommandButton key={action.id} action={action} />
            ))}
          </div>
        )}

        {statusSlot && (
          <>
            <div
              style={{
                width: '1px',
                height: '18px',
                backgroundColor: 'var(--ds-color-border-subtle, rgba(255, 255, 255, 0.1))'
              }}
            />
            <div style={{ flexShrink: 0 }}>{statusSlot}</div>
          </>
        )}
      </div>
    </div>
  );
};

const CommandButton: React.FC<{ action: CommandBarAction }> = ({ action }) => {
  const isPrimary = action.variant === 'primary';
  const isDanger = action.variant === 'danger';
  const isActive = action.active;

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className="ds-interactive ds-spring-press"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        borderRadius: '6px',
        border: isPrimary
          ? '1px solid #0078D4'
          : isDanger
          ? '1px solid rgba(239, 68, 68, 0.4)'
          : isActive
          ? '1px solid rgba(0, 120, 212, 0.4)'
          : '1px solid transparent',
        backgroundColor: isPrimary
          ? '#0078D4'
          : isDanger
          ? 'rgba(239, 68, 68, 0.15)'
          : isActive
          ? 'rgba(0, 120, 212, 0.15)'
          : 'transparent',
        color: isPrimary
          ? '#FFFFFF'
          : isDanger
          ? '#FCA5A5'
          : isActive
          ? '#38BDF8'
          : 'var(--ds-color-text-primary, #F1F5F9)',
        fontSize: '0.8125rem',
        fontWeight: isPrimary || isActive ? 600 : 500,
        cursor: action.disabled ? 'not-allowed' : 'pointer',
        opacity: action.disabled ? 0.5 : 1,
        transition: 'all 120ms cubic-bezier(0.1, 0.9, 0.2, 1)',
        whiteSpace: 'nowrap'
      }}
      title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
    >
      {action.icon && <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{action.icon}</span>}
      <span>{action.label}</span>
      {action.shortcut && (
        <kbd
          style={{
            fontSize: '0.625rem',
            padding: '1px 5px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--ds-color-text-muted, #94A3B8)',
            fontFamily: 'monospace'
          }}
        >
          {action.shortcut}
        </kbd>
      )}
    </button>
  );
};
