import React from 'react';
import type { QuickAction } from '../../types/executive.js';
import { Card, Button, Badge } from '@docsearch/ui-kit';

export interface QuickActionsProps {
  actions: QuickAction[];
  onActionClick?: ((action: QuickAction) => void) | undefined;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, onActionClick }) => {
  return (
    <Card
      title="Executive Quick Actions"
      subtitle="Administrative shortcuts across platform operational domains"
      padding="md"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}
      >
        {actions.map((act) => (
          <div
            key={act.id}
            style={{
              padding: '12px',
              border: '1px solid var(--ds-color-border-subtle)',
              borderRadius: '6px',
              backgroundColor: 'var(--ds-color-surface-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.25rem' }}>{act.icon}</span>
              <Badge variant="neutral">Domain: {act.domain}</Badge>
            </div>

            <div>
              <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--ds-color-text-primary)' }}>
                {act.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                {act.description}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={!act.isAvailable}
              onClick={() => onActionClick?.(act)}
            >
              {act.isAvailable ? 'Launch' : 'Inactive'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
