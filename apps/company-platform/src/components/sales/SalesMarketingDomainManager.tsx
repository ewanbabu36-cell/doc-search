import React, { useState, useEffect } from 'react';
import type {
  LeadDto,
  LeadStatus,
  OpportunityDto,
  OpportunityStage,
  CampaignDto,
  MarketingActivityDto,
  SalesTaskDto,
  PartnerProfileDto
} from '@docsearch/api-contracts';
import { salesMarketingService } from '../../services/sales-marketing-service.js';
import { partnerService } from '../../services/partner-service.js';
import { SalesOverviewView } from './SalesOverviewView.js';
import { LeadListView } from './LeadListView.js';
import { LeadProfileView } from './LeadProfileView.js';
import { OpportunityListView } from './OpportunityListView.js';
import { OpportunityProfileView } from './OpportunityProfileView.js';
import { PartnerSalesView } from './PartnerSalesView.js';
import { CampaignListView } from './CampaignListView.js';
import { CampaignProfileView } from './CampaignProfileView.js';
import { MarketingActivityListView } from './MarketingActivityListView.js';
import { SalesTaskListView } from './SalesTaskListView.js';

// 3 New Enterprise Sales Advancements
import { HospitalLeadScoringRadarView } from './HospitalLeadScoringRadarView.js';
import { EnterpriseDealForecastMatrixView } from './EnterpriseDealForecastMatrixView.js';
import { FieldSalesVisitTrackerView } from './FieldSalesVisitTrackerView.js';

import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'ai-scoring'
  | 'deal-forecast'
  | 'field-visits'
  | 'leads'
  | 'opportunities'
  | 'partner-sales'
  | 'campaigns'
  | 'activities'
  | 'tasks';

export const SalesMarketingDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityDto[]>([]);
  const [partners, setPartners] = useState<PartnerProfileDto[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [activities, setActivities] = useState<MarketingActivityDto[]>([]);
  const [tasks, setTasks] = useState<SalesTaskDto[]>([]);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [selectedCampId, setSelectedCampId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leadsRes, oppsRes, partnersRes, campsRes, actsRes, tasksRes] = await Promise.all([
        salesMarketingService.getLeads(),
        salesMarketingService.getOpportunities(),
        partnerService.getPartners(),
        salesMarketingService.getCampaigns(),
        salesMarketingService.getMarketingActivities(),
        salesMarketingService.getSalesTasks()
      ]);
      setLeads(leadsRes);
      setOpportunities(oppsRes);
      setPartners(partnersRes.items);
      setCampaigns(campsRes);
      setActivities(actsRes);
      setTasks(tasksRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Sales & Marketing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleTransitionLead = async (toStatus: LeadStatus, reason: string) => {
    if (!selectedLeadId) return;
    const updated = await salesMarketingService.transitionLead(selectedLeadId, { toStatus, reason });
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleTransitionOpportunity = async (toStage: OpportunityStage, reason: string) => {
    if (!selectedOppId) return;
    const updated = await salesMarketingService.transitionOpportunity(selectedOppId, { toStage, reason });
    setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleCompleteTask = async (taskId: string) => {
    const updated = await salesMarketingService.completeSalesTask(taskId);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  if (isLoading && leads.length === 0) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Sales Pipeline & Marketing Hub...
        </span>
      </div>
    );
  }

  if (error && leads.length === 0) {
    return (
      <ErrorState title="Sales Telemetry Unavailable" message={error} onRetry={loadData} />
    );
  }

  // Drilldown: Lead Profile
  if (selectedLeadId) {
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (lead) {
      return (
        <LeadProfileView
          lead={lead}
          onBack={() => setSelectedLeadId(null)}
          onTransitionLead={handleTransitionLead}
        />
      );
    }
  }

  // Drilldown: Opportunity Profile
  if (selectedOppId) {
    const opp = opportunities.find((o) => o.id === selectedOppId);
    if (opp) {
      return (
        <OpportunityProfileView
          opportunity={opp}
          onBack={() => setSelectedOppId(null)}
          onTransitionStage={handleTransitionOpportunity}
        />
      );
    }
  }

  // Drilldown: Campaign Profile
  if (selectedCampId) {
    const camp = campaigns.find((c) => c.id === selectedCampId);
    if (camp) {
      const campActs = activities.filter((a) => a.campaignName === camp.name);
      return (
        <CampaignProfileView
          campaign={camp}
          activities={campActs}
          onBack={() => setSelectedCampId(null)}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              📈 Sales Pipeline, BDM Territories & Enterprise ARR HQ
            </h1>
            <Badge variant="success">● AI Lead Scorer & GPS Audit Active</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            Predictive hospital lead scoring (0-100), probability-weighted ARR forecasting, and on-ground field BDM GPS check-in logs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Sales Overview'
          },
          {
            id: 'ai-scoring',
            label: '🎯 AI Lead Scorer',
            badge: <Badge variant="success">90+ Score</Badge>
          },
          {
            id: 'deal-forecast',
            label: '📊 ARR Deal Forecast',
            badge: <Badge variant="primary">₹1.80 Cr ARR</Badge>
          },
          {
            id: 'field-visits',
            label: '📍 Field BDM GPS Check-In',
            badge: <Badge variant="neutral">148 Visits</Badge>
          },
          {
            id: 'leads',
            label: '👥 Leads & Prospects',
            badge: <Badge variant="neutral">{leads.length}</Badge>
          },
          {
            id: 'opportunities',
            label: '💼 Opportunities',
            badge: <Badge variant="neutral">{opportunities.length}</Badge>
          },
          {
            id: 'partner-sales',
            label: '🏢 Partner Sales View',
            badge: <Badge variant="neutral">{partners.length}</Badge>
          },
          {
            id: 'campaigns',
            label: '📣 Campaigns',
            badge: <Badge variant="neutral">{campaigns.length}</Badge>
          },
          {
            id: 'activities',
            label: '🎯 Marketing Activities',
            badge: <Badge variant="neutral">{activities.length}</Badge>
          },
          {
            id: 'tasks',
            label: '📝 Sales Tasks',
            badge: <Badge variant="neutral">{tasks.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <SalesOverviewView
          leads={leads}
          opportunities={opportunities}
          campaigns={campaigns}
          tasks={tasks}
        />
      )}

      {activeTab === 'ai-scoring' && (
        <HospitalLeadScoringRadarView />
      )}

      {activeTab === 'deal-forecast' && (
        <EnterpriseDealForecastMatrixView />
      )}

      {activeTab === 'field-visits' && (
        <FieldSalesVisitTrackerView />
      )}

      {activeTab === 'leads' && (
        <LeadListView
          leads={leads}
          onSelectLead={(id) => setSelectedLeadId(id)}
        />
      )}

      {activeTab === 'opportunities' && (
        <OpportunityListView
          opportunities={opportunities}
          onSelectOpportunity={(id) => setSelectedOppId(id)}
        />
      )}

      {activeTab === 'partner-sales' && (
        <PartnerSalesView
          partners={partners}
          opportunities={opportunities}
        />
      )}

      {activeTab === 'campaigns' && (
        <CampaignListView
          campaigns={campaigns}
          onSelectCampaign={(id) => setSelectedCampId(id)}
        />
      )}

      {activeTab === 'activities' && (
        <MarketingActivityListView activities={activities} />
      )}

      {activeTab === 'tasks' && (
        <SalesTaskListView
          tasks={tasks}
          onCompleteTask={handleCompleteTask}
        />
      )}
    </div>
  );
};
