import React, { useState, useEffect } from 'react';
import type {
  PartnerProfileDto,
  PartnerTransitionHistoryDto,
  PartnerLifecycleStatus
} from '@docsearch/api-contracts';
import { partnerService } from '../../services/partner-service.js';
import { PartnerListView } from './PartnerListView.js';
import { PartnerProfileView } from './PartnerProfileView.js';
import { Spinner, ErrorState } from '@docsearch/ui-kit';

export const PartnerLifecycleManager: React.FC = () => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerProfileDto | null>(null);
  const [history, setHistory] = useState<PartnerTransitionHistoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPartnerDetails = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [partnerData, historyData] = await Promise.all([
        partnerService.getPartnerById(id),
        partnerService.getPartnerHistory(id)
      ]);
      if (!partnerData) {
        throw new Error(`Healthcare partner with ID ${id} was not found.`);
      }
      setPartner(partnerData);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partner details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPartnerId) {
      void loadPartnerDetails(selectedPartnerId);
    } else {
      setPartner(null);
      setHistory([]);
    }
  }, [selectedPartnerId]);

  const handleTransitionStatus = async (toStatus: PartnerLifecycleStatus, reason: string) => {
    if (!selectedPartnerId) return;
    const updated = await partnerService.transitionLifecycle(selectedPartnerId, {
      toStatus,
      reason
    });
    setPartner(updated);
    // Reload history after transition
    const updatedHistory = await partnerService.getPartnerHistory(selectedPartnerId);
    setHistory(updatedHistory);
  };

  if (selectedPartnerId) {
    if (isLoading) {
      return (
        <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Spinner size="lg" />
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Loading partner profile...
          </span>
        </div>
      );
    }

    if (error || !partner) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <ErrorState
            title="Partner Profile Error"
            message={error || 'Partner data unavailable'}
            onRetry={() => loadPartnerDetails(selectedPartnerId)}
          />
          <button
            type="button"
            onClick={() => setSelectedPartnerId(null)}
            style={{
              padding: '10px 18px',
              backgroundColor: '#06B6D4',
              color: '#070C16',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ← Back to Partner Directory
          </button>
        </div>
      );
    }

    return (
      <PartnerProfileView
        partner={partner}
        history={history}
        onBack={() => setSelectedPartnerId(null)}
        onTransitionStatus={handleTransitionStatus}
      />
    );
  }

  return <PartnerListView onSelectPartner={(id) => setSelectedPartnerId(id)} />;
};
