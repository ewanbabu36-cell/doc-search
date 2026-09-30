import React from 'react';
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
  // 1. Command & Overview (core)
  {
    id: 'medisphere-command-center',
    title: 'Command Center & Executive KPIs',
    description: 'Pan-India hospital operating system, cross-facility telemetry, live MRR & executive oversight',
    icon: '⚡',
    category: 'core',
    status: 'active'
  },
  {
    id: 'crm-partner-lifecycle',
    title: 'CRM & Healthcare Partner Lifecycle',
    description: 'Healthcare partner onboarding, tier management, and BAA lifecycle',
    icon: '🏥',
    category: 'core',
    status: 'active'
  },

  // 2. Growth & Revenue (revenue)
  {
    id: 'growth-engine',
    title: 'Growth Engine & Monetization HQ',
    description: 'Care Pass pricing, commission margin splits, WhatsApp broadcasts, and partner settlements',
    icon: '👑',
    category: 'revenue',
    status: 'active'
  },
  {
    id: 'subscription-billing-finance',
    title: 'Subscription / Billing / Finance',
    description: 'Partner recurring invoicing, 18% GST ledger, revenue realization, and payment gateways',
    icon: '💳',
    category: 'revenue',
    status: 'active'
  },
  {
    id: 'product-plans-entitlements',
    title: 'Product Plans, Tiers & Quotas',
    description: 'SaaS tier catalog, feature entitlements, and OPD quota limits',
    icon: '📦',
    category: 'revenue',
    status: 'active'
  },
  {
    id: 'sales-marketing',
    title: 'Partner Outreach & Lead Pipeline',
    description: 'Enterprise pipeline, clinic tie-ups, partner expansion, and sales campaigns',
    icon: '📈',
    category: 'revenue',
    status: 'active'
  },

  // 3. Operations & BI (operations)
  {
    id: 'customer-success-support',
    title: 'Customer Success & Hospital Support',
    description: 'Doctor and facility SLA monitoring, emergency ticket escalation, and partner health',
    icon: '🎧',
    category: 'operations',
    status: 'active'
  },
  {
    id: 'communication-content',
    title: 'Broadcast & WhatsApp Engagement Hub',
    description: 'Platform announcements, bulk notifications, SMS alerts, and release broadcasts',
    icon: '📣',
    category: 'operations',
    status: 'active'
  },
  {
    id: 'analytics-bi-intelligence',
    title: 'Analytics / BI / Intelligence',
    description: 'Cross-tenant aggregation, usage trends, and healthcare business intelligence',
    icon: '📊',
    category: 'operations',
    status: 'active'
  },

  // 4. Technology & Platform (technology)
  {
    id: 'ai-platform-governance',
    title: 'Clinical AI & Safety Governance',
    description: 'Clinical model registry, safety guardrails, CDSS engine, and token usage oversight',
    icon: '🧠',
    category: 'technology',
    status: 'active'
  },
  {
    id: 'api-integration-interoperability',
    title: 'Developer APIs & Cloud Gateways',
    description: 'Fastify Gateway routes, HL7/FHIR webhooks, and rate-limiting rules',
    icon: '🔌',
    category: 'technology',
    status: 'active'
  },
  {
    id: 'platform-engineering',
    title: 'Platform Engineering & CI/CD',
    description: 'Turborepo build pipelines, package management, and deployment states',
    icon: '⚙️',
    category: 'technology',
    status: 'active'
  },
  {
    id: 'infrastructure-monitoring-dr',
    title: 'Infrastructure / Monitoring / DR',
    description: 'Cluster health, latency metrics, cross-region replication, and failover drills',
    icon: '🖥️',
    category: 'technology',
    status: 'active'
  },

  // 5. Governance & Security (governance)
  {
    id: 'company-admin-governance',
    title: 'Founder Governance & Admin',
    description: 'Internal employee access, executive approvals, and company legal structure',
    icon: '🏛️',
    category: 'governance',
    status: 'active'
  },
  {
    id: 'compliance-data-governance',
    title: 'Regulatory Compliance & ABDM Hub',
    description: 'ABDM 2.0 milestones (M1/M2/M3), NABH clinical standards, and DPDP / HIPAA compliance',
    icon: '⚖️',
    category: 'governance',
    status: 'active'
  },
  {
    id: 'security-rbac-policy-audit',
    title: 'Security / Zero-Trust RBAC / Audit',
    description: 'Multi-tenant RBAC policies, immutable audit logs, and CloudHSM access keys',
    icon: '🛡️',
    category: 'governance',
    status: 'active'
  }
];

export {
  ROLE_DOMAIN_PERMISSIONS,
  normalizeDomainId,
  isDomainAllowedForRole
} from './rolePermissions.js';

export function buildPhase1NavSections(
  activeDomainId: string,
  onSelectDomain: (domainId: string) => void,
  _userRole?: string | undefined,
  pendingVerificationCount: number = 0
): NavSection[] {
  const sections: { title: string; category: Phase1Domain['category'] }[] = [
    { title: '1. Command & Overview', category: 'core' },
    { title: '2. Growth & Revenue', category: 'revenue' },
    { title: '3. Operations & BI', category: 'operations' },
    { title: '4. Technology & Platform', category: 'technology' },
    { title: '5. Governance & Security', category: 'governance' }
  ];

  return sections.map((sec) => {
    const items = PHASE_1_DOMAINS
      .filter((d) => d.category === sec.category)
      .map((domain) => {
        const isActive = domain.id === activeDomainId;
        const isUpcoming = domain.status === 'upcoming';

        let badgeElement: React.ReactNode = undefined;
        if (domain.id === 'medisphere-command-center') {
          badgeElement = (
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '6px',
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                color: '#38BDF8',
                border: '1px solid rgba(6, 182, 212, 0.5)',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
                lineHeight: 1.2
              }}
            >
              HQ
            </span>
          );
        } else if (domain.id === 'crm-partner-lifecycle' && pendingVerificationCount > 0) {
          badgeElement = (
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '10px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: '1px solid #DC2626',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
                lineHeight: 1.2
              }}
            >
              {pendingVerificationCount} Pending
            </span>
          );
        } else if (isUpcoming) {
          badgeElement = (
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
                border: '1px solid var(--ds-color-border-subtle)',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              Future
            </span>
          );
        }

        // Defensive sanitization: strip any leading emoji so label never has duplicate icons
        const cleanTitle = domain.title.replace(/^[\p{Emoji}\s]+/u, '').trim() || domain.title;

        return {
          id: domain.id,
          label: cleanTitle,
          icon: <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{domain.icon}</span>,
          isActive,
          badge: badgeElement,
          onClick: () => onSelectDomain(domain.id)
        };
      });

    return {
      title: sec.title,
      items
    };
  }).filter((sec) => sec.items.length > 0);
}
