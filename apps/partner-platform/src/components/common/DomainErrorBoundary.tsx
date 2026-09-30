import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';

export interface DomainErrorBoundaryProps {
  domainName: string;
  children: React.ReactNode;
  onReset?: () => void;
}

interface DomainErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class DomainErrorBoundary extends React.Component<DomainErrorBoundaryProps, DomainErrorBoundaryState> {
  constructor(props: DomainErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<DomainErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[DOMAIN_ERROR_BOUNDARY] Error in domain "${this.props.domainName}":`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          <Card padding="lg" style={{ border: '1px solid rgba(239, 68, 68, 0.4)', backgroundColor: 'var(--ds-color-bg-card, #1e293b)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.75rem' }}>⚠️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--ds-color-text, #f8fafc)' }}>
                    {this.props.domainName} Module Notice
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--ds-color-text-muted, #94a3b8)' }}>
                    An isolated error occurred in this workspace domain. Other modules and navigation remain operational.
                  </p>
                </div>
              </div>
              <Badge variant="danger">Domain Fault Isolated</Badge>
            </div>

            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '18px'
            }}>
              <code style={{ fontSize: '0.85rem', color: '#fca5a5', display: 'block', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {this.state.error?.message || 'An unexpected rendering error occurred while loading this view.'}
              </code>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleRetry}
                style={{ fontWeight: 700 }}
              >
                🔄 Retry Loading {this.props.domainName}
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
