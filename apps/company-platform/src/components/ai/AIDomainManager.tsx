import React, { useState, useEffect } from 'react';
import type {
  AIModelDto,
  AIGovernancePolicyDto,
  AIGovernancePolicyStatus,
  AIPromptTemplateDto,
  AIPromptVersionDto,
  AIPromptApprovalStatus,
  AIUsageQuotaDto,
  AIAuditTraceDto,
  AISafetyEventDto
} from '@docsearch/api-contracts';
import { aiService } from '../../services/ai-service.js';
import { AIOverviewView } from './AIOverviewView.js';
import { AIModelRegistryView } from './AIModelRegistryView.js';
import { AIModelProfileView } from './AIModelProfileView.js';
import { AIGovernanceView } from './AIGovernanceView.js';
import { PromptRegistryView } from './PromptRegistryView.js';
import { PromptVersionProfileView } from './PromptVersionProfileView.js';
import { AIUsageQuotaView } from './AIUsageQuotaView.js';
import { AIAuditTraceView } from './AIAuditTraceView.js';
import { AISafetyCenterView } from './AISafetyCenterView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'models'
  | 'governance'
  | 'prompts'
  | 'quotas'
  | 'audit'
  | 'safety';

export const AIDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [models, setModels] = useState<AIModelDto[]>([]);
  const [policies, setPolicies] = useState<AIGovernancePolicyDto[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<AIPromptTemplateDto[]>([]);
  const [promptVersions, setPromptVersions] = useState<AIPromptVersionDto[]>([]);
  const [quotas, setQuotas] = useState<AIUsageQuotaDto[]>([]);
  const [traces, setTraces] = useState<AIAuditTraceDto[]>([]);
  const [safetyEvents, setSafetyEvents] = useState<AISafetyEventDto[]>([]);

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [modelsRes, policiesRes, promptsRes, quotasRes, tracesRes, safetyRes] = await Promise.all([
        aiService.getModels(),
        aiService.getGovernancePolicies(),
        aiService.getPromptTemplates(),
        aiService.getUsageQuotas(),
        aiService.getAuditTraces(),
        aiService.getSafetyEvents()
      ]);
      setModels(modelsRes);
      setPolicies(policiesRes);
      setPromptTemplates(promptsRes);
      setQuotas(quotasRes);
      setTraces(tracesRes);
      setSafetyEvents(safetyRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI governance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // When selectedTemplateId changes, load its versions
  useEffect(() => {
    if (!selectedTemplateId) return;
    void aiService.getPromptVersions(selectedTemplateId).then((v) => setPromptVersions(v));
  }, [selectedTemplateId]);

  const handleTransitionPolicy = async (
    policyId: string,
    toStatus: AIGovernancePolicyStatus,
    reason: string
  ) => {
    const updated = await aiService.transitionGovernancePolicy(policyId, { toStatus, reason });
    setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleApprovePromptVersion = async (
    versionId: string,
    approvalStatus: AIPromptApprovalStatus,
    reason: string
  ) => {
    const updated = await aiService.approvePromptVersion({
      promptVersionId: versionId,
      approvalStatus,
      reason
    });
    setPromptVersions((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const handleAcknowledgeSafetyEvent = async (eventId: string, reason: string) => {
    const updated = await aiService.acknowledgeSafetyEvent({ eventId, reason });
    setSafetyEvents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleResolveSafetyEvent = async (eventId: string, resolutionNotes: string) => {
    const updated = await aiService.resolveSafetyEvent({
      eventId,
      resolutionStatus: 'RESOLVED',
      resolutionNotes
    });
    setSafetyEvents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  if (isLoading && models.length === 0) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading AI Platform & AI Governance control plane...
        </span>
      </div>
    );
  }

  if (error && models.length === 0) {
    return (
      <ErrorState title="AI Governance Workspace Unavailable" message={error} onRetry={loadData} />
    );
  }

  // Drilldown: Model Profile
  if (selectedModelId) {
    const model = models.find((m) => m.id === selectedModelId);
    if (model) {
      return (
        <AIModelProfileView
          model={model}
          onBack={() => setSelectedModelId(null)}
        />
      );
    }
  }

  // Drilldown: Prompt Version Profile
  if (selectedTemplateId) {
    const template = promptTemplates.find((t) => t.id === selectedTemplateId);
    if (template) {
      return (
        <PromptVersionProfileView
          template={template}
          versions={promptVersions}
          onBack={() => setSelectedTemplateId(null)}
          onApproveVersion={handleApprovePromptVersion}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              AI Platform & AI Governance
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Enterprise healthcare AI control plane, assistive model registry, prompt versioning, quota enforcement, and safety gate oversight
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 AI Overview'
          },
          {
            id: 'models',
            label: '🧠 Model Registry',
            badge: <Badge variant="neutral">{models.length}</Badge>
          },
          {
            id: 'governance',
            label: '⚖️ AI Governance',
            badge: <Badge variant="neutral">{policies.length}</Badge>
          },
          {
            id: 'prompts',
            label: '📝 Prompt Registry',
            badge: <Badge variant="neutral">{promptTemplates.length}</Badge>
          },
          {
            id: 'quotas',
            label: '⏱️ Usage & Quotas',
            badge: <Badge variant="neutral">{quotas.length}</Badge>
          },
          {
            id: 'audit',
            label: '🔍 AI Audit Trace',
            badge: <Badge variant="neutral">{traces.length}</Badge>
          },
          {
            id: 'safety',
            label: '🚨 AI Safety Center',
            badge: <Badge variant="danger">{safetyEvents.filter((s) => s.status === 'OPEN').length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <AIOverviewView
          models={models}
          policies={policies}
          promptTemplates={promptTemplates}
          quotas={quotas}
          safetyEvents={safetyEvents}
        />
      )}

      {activeTab === 'models' && (
        <AIModelRegistryView
          models={models}
          onSelectModel={(id) => setSelectedModelId(id)}
        />
      )}

      {activeTab === 'governance' && (
        <AIGovernanceView
          policies={policies}
          onTransitionPolicy={handleTransitionPolicy}
        />
      )}

      {activeTab === 'prompts' && (
        <PromptRegistryView
          templates={promptTemplates}
          onSelectTemplate={(id) => setSelectedTemplateId(id)}
        />
      )}

      {activeTab === 'quotas' && (
        <AIUsageQuotaView quotas={quotas} />
      )}

      {activeTab === 'audit' && (
        <AIAuditTraceView traces={traces} />
      )}

      {activeTab === 'safety' && (
        <AISafetyCenterView
          safetyEvents={safetyEvents}
          onAcknowledge={handleAcknowledgeSafetyEvent}
          onResolve={handleResolveSafetyEvent}
        />
      )}
    </div>
  );
};
