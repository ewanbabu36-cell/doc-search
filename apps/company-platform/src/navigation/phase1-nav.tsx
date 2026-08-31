import type { NavSection } from '@docsearch/ui-kit';

export interface Phase1Domain {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'core' | 'revenue' | 'operations' | 'technology' | 'governance';
  status: 'active' | 'upcoming';
}

export const PHASE_1_DOMAINS: Phase1Domain[] = [
  {
    id: 'growth-engine',
    title: '👑 Growth Engine & Monetization HQ',
    description: 'Care Pass pricing, commission margin splits, WhatsApp broadcasts, and partner settlements',
    icon: '👑',
    category: 'revenue',
    status: 'active'
  },
  // Core & Executive
  {
    id: 'executive-command-center',
    title: 'Executive & Command Center',
    description: 'Executive oversight, high-level KPIs, and system telemetry',
    icon: '⚡',
    category: 'core',
    status: 'active'
  },
  {
    id: 'crm-partner-lifecycle',
    title: 'CRM & Partner Lifecycle',
    description: 'Healthcare partner onboarding, tier management, and BAA lifecycle',
    icon: '🏢',
    category: 'revenue',
    status: 'active'
  },
  {
    id: 'product-plans-entitlements',
    title: 'Product / Plans / Entitlements',
    description: 'SaaS tier catalog, feature entitlements, and quota limits',
    icon: '📦',
    category: 'revenue',
    status: 'active'
  },
  {
    id: 'subscription-billing-finance',
    title: 'Subscription / Billing / Finance',
    description: 'Partner recurring invoicing, revenue realization, and payment gateways',
    icon: '💳',
    category: 'revenue',
    status: 'active'
  },
  {
    id: 'sales-marketing',
    title: 'Sales & Marketing',
    description: 'Enterprise pipeline, partner expansion, and marketing campaigns',
    icon: '📈',
    category: 'revenue',
    status: 'active'
  },
  {
    id: 'customer-success-support',
    title: 'Customer Success & Support',
    description: 'Enterprise SLA monitoring, ticket escalation, and partner health',
    icon: '🎧',
    category: 'operations',
    status: 'active'
  },
  {
    id: 'communication-content',
    title: 'Communication & Content',
    description: 'Platform announcements, release broadcasts, and email dispatch',
    icon: '📣',
    category: 'operations',
    status: 'active'
  },
  {
    id: 'analytics-bi-intelligence',
    title: 'Analytics / BI / Intelligence',
    description: 'Cross-tenant aggregation, usage trends, and business intelligence',
    icon: '📊',
    category: 'operations',
    status: 'active'
  },
  {
    id: 'ai-platform-governance',
    title: 'AI Platform & AI Governance',
    description: 'Clinical model registry, safety boundaries, and token usage oversight',
    icon: '🧠',
    category: 'technology',
    status: 'active'
  },
  {
    id: 'security-rbac-policy-audit',
    title: 'Security / RBAC / Policy / Audit',
    description: 'Multi-tenant RBAC policies, immutable audit logs, and access keys',
    icon: '🛡️',
    category: 'governance',
    status: 'active'
  },
  {
    id: 'compliance-data-governance',
    title: 'Compliance & Data Governance',
    description: 'HIPAA evidence, SOC 2 audit trails, data retention, and partner BAAs',
    icon: '⚖️',
    category: 'governance',
    status: 'active'
  },
  {
    id: 'api-integration-interoperability',
    title: 'API / Integration / Interoperability',
    description: 'Fastify Gateway routes, HL7/FHIR webhooks, and rate-limiting rules',
    icon: '🔌',
    category: 'technology',
    status: 'active'
  },
  {
    id: 'platform-engineering',
    title: 'Platform Engineering',
    description: 'Turborepo CI/CD pipelines, package management, and deployment states',
    icon: '⚙️',
    category: 'technology',
    status: 'active'
  },
  {
    id: 'infrastructure-monitoring-dr',
    title: 'Infrastructure / Monitoring / DR',
    description: 'Cluster health, latency metrics, failover drills, and database clusters',
    icon: '🖥️',
    category: 'technology',
    status: 'active'
  },
  {
    id: 'company-admin-governance',
    title: 'Company Admin & Governance',
    description: 'Internal employee access, company legal structure, and executive audit',
    icon: '🏛️',
    category: 'governance',
    status: 'active'
  }
];

export function buildPhase1NavSections(
  activeDomainId: string,
  onSelectDomain: (domainId: string) => void
): NavSection[] {
  const sections: { title: string; category: Phase1Domain['category'] }[] = [
    { title: 'Command & Overview', category: 'core' },
    { title: 'Growth & Revenue', category: 'revenue' },
    { title: 'Operations & BI', category: 'operations' },
    { title: 'Technology & Platform', category: 'technology' },
    { title: 'Governance & Security', category: 'governance' }
  ];

  return sections.map((sec) => ({
    title: sec.title,
    items: PHASE_1_DOMAINS.filter((d) => d.category === sec.category).map((domain) => {
      const isActive = domain.id === activeDomainId;
      const isUpcoming = domain.status === 'upcoming';

      return {
        id: domain.id,
        label: domain.title,
        icon: <span>{domain.icon}</span>,
        isActive,
        badge: isUpcoming ? (
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: 'var(--ds-color-surface-subtle)',
              color: 'var(--ds-color-text-muted)',
              border: '1px solid var(--ds-color-border-subtle)'
            }}
          >
            Future
          </span>
        ) : undefined,
        onClick: () => onSelectDomain(domain.id)
      };
    })
  }));
}
