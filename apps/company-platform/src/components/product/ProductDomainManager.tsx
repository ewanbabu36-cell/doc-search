import React, { useState, useEffect } from 'react';
import type {
  ProductDto,
  PlanDto,
  FeatureDto,
  PlanEntitlementDto,
  PartnerPlanAssignmentDto,
  PartnerProfileDto
} from '@docsearch/api-contracts';
import { productService } from '../../services/product-service.js';
import { partnerService } from '../../services/partner-service.js';
import { ProductListView } from './ProductListView.js';
import { ProductProfileView } from './ProductProfileView.js';
import { PlanListView } from './PlanListView.js';
import { PlanProfileView } from './PlanProfileView.js';
import { FeatureCatalogView } from './FeatureCatalogView.js';
import { PartnerAssignmentView } from './PartnerAssignmentView.js';
import { AssignPlanDialog } from './AssignPlanDialog.js';

// 3 New Product & Entitlement Advancements
import { FeatureFlagsCanaryView } from './FeatureFlagsCanaryView.js';
import { TenantQuotaThrottlerView } from './TenantQuotaThrottlerView.js';
import { ClinicalAddonMarketplaceView } from './ClinicalAddonMarketplaceView.js';

import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'products'
  | 'flags'
  | 'quotas'
  | 'marketplace'
  | 'plans'
  | 'features'
  | 'assignments';

export const ProductDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [features, setFeatures] = useState<FeatureDto[]>([]);
  const [assignments, setAssignments] = useState<PartnerPlanAssignmentDto[]>([]);
  const [partners, setPartners] = useState<PartnerProfileDto[]>([]);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planEntitlements, setPlanEntitlements] = useState<PlanEntitlementDto[]>([]);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDomainData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, planRes, featRes, assignRes, partnerRes] = await Promise.all([
        productService.getProducts(),
        productService.getPlans(),
        productService.getFeatures(),
        productService.getPartnerAssignments(),
        partnerService.getPartners()
      ]);
      setProducts(prodRes);
      setPlans(planRes);
      setFeatures(featRes);
      setAssignments(assignRes);
      setPartners(partnerRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product domain data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDomainData();
  }, []);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    setSelectedPlanId(null);
  };

  const handleSelectPlan = async (id: string) => {
    setIsLoading(true);
    try {
      const ents = await productService.getPlanEntitlements(id);
      setPlanEntitlements(ents);
      setSelectedPlanId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan entitlements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignPlan = async (partnerId: string, productId: string, planId: string, reason: string) => {
    const targetPartner = partners.find((p) => p.id === partnerId);
    const assigned = await productService.assignPlanToPartner(
      { partnerId, productId, planId, reason },
      targetPartner?.tradeName,
      targetPartner?.tenantSlug
    );
    setAssignments((prev) => [assigned, ...prev.filter((a) => a.id !== assigned.id)]);
  };

  if (isLoading && products.length === 0) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Product & Entitlement catalog...
        </span>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <ErrorState title="Product Catalog Unavailable" message={error} onRetry={loadDomainData} />
    );
  }

  // Drilldown: Plan Profile View
  if (selectedPlanId) {
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    if (selectedPlan) {
      return (
        <PlanProfileView
          plan={selectedPlan}
          entitlements={planEntitlements}
          onBack={() => setSelectedPlanId(null)}
        />
      );
    }
  }

  // Drilldown: Product Profile View
  if (selectedProductId) {
    const selectedProd = products.find((p) => p.id === selectedProductId);
    if (selectedProd) {
      return (
        <ProductProfileView
          product={selectedProd}
          plans={plans}
          onBack={() => setSelectedProductId(null)}
          onSelectPlan={handleSelectPlan}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              📦 Product, Plans, Entitlements & Add-Ons HQ
            </h1>
            <Badge variant="success">● Feature Flags & Token Quotas Active</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            0-Downtime canary feature rollouts, hospital tenant API quota throttler overrides, and clinical department add-on modules
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'products',
            label: '📦 Product Catalog',
            badge: <Badge variant="neutral">{products.length}</Badge>
          },
          {
            id: 'flags',
            label: '🚩 Feature Flags & Canary',
            badge: <Badge variant="success">0-Downtime</Badge>
          },
          {
            id: 'quotas',
            label: '⚡ Tenant Quota Throttler',
            badge: <Badge variant="primary">Redis Limit</Badge>
          },
          {
            id: 'marketplace',
            label: '🧩 Clinical Add-On Marketplace',
            badge: <Badge variant="warning">4 Add-Ons</Badge>
          },
          {
            id: 'plans',
            label: '📋 Plans & Tiers',
            badge: <Badge variant="neutral">{plans.length}</Badge>
          },
          {
            id: 'features',
            label: '🧩 Features & Capabilities',
            badge: <Badge variant="neutral">{features.length}</Badge>
          },
          {
            id: 'assignments',
            label: '🏢 Partner Plan Assignments',
            badge: <Badge variant="neutral">{assignments.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId: string) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Content Area */}
      {activeTab === 'products' && (
        <ProductListView
          products={products}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {activeTab === 'flags' && (
        <FeatureFlagsCanaryView />
      )}

      {activeTab === 'quotas' && (
        <TenantQuotaThrottlerView />
      )}

      {activeTab === 'marketplace' && (
        <ClinicalAddonMarketplaceView />
      )}

      {activeTab === 'plans' && (
        <PlanListView
          plans={plans}
          products={products}
          onSelectPlan={handleSelectPlan}
        />
      )}

      {activeTab === 'features' && (
        <FeatureCatalogView features={features} />
      )}

      {activeTab === 'assignments' && (
        <PartnerAssignmentView
          assignments={assignments}
          onOpenAssignDialog={() => setIsAssignDialogOpen(true)}
        />
      )}

      {/* Assign Plan Dialog */}
      {isAssignDialogOpen && (
        <AssignPlanDialog
          isOpen={isAssignDialogOpen}
          onClose={() => setIsAssignDialogOpen(false)}
          products={products}
          plans={plans}
          partners={partners}
          onAssign={handleAssignPlan}
        />
      )}
    </div>
  );
};
