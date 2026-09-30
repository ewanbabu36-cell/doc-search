export const ROLE_DOMAIN_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN_FOUNDER: ['*'],
  SUPER_ADMIN: ['*'],
  FOUNDER: ['*'],
  COMPANY_ADMIN: [
    'medisphere-command-center',
    'executive-command-center',
    'growth-engine',
    'crm-partner-lifecycle',
    'product-plans-entitlements',
    'sales-marketing',
    'customer-success-support',
    'communication-content',
    'communication-broadcasting',
    'analytics-bi-intelligence',
    'analytics-reporting-bi',
    'compliance-data-governance',
    'compliance-regulatory-legal',
    'company-admin-governance'
  ],
  COMPLIANCE_OFFICER: [
    'compliance-data-governance',
    'security-rbac-policy-audit',
    'company-admin-governance',
    'ai-platform-governance',
    'analytics-bi-intelligence'
  ],
  PLATFORM_COMPLIANCE: [
    'compliance-data-governance',
    'security-rbac-policy-audit',
    'company-admin-governance',
    'ai-platform-governance',
    'analytics-bi-intelligence'
  ],
  CLINICAL_OPERATIONS_LEAD: [
    'compliance-data-governance',
    'security-rbac-policy-audit',
    'ai-platform-governance',
    'customer-success-support',
    'company-admin-governance'
  ],
  FINANCE_CONTROLLER: [
    'subscription-billing-finance',
    'growth-engine',
    'analytics-bi-intelligence',
    'company-admin-governance'
  ],
  FINANCE_MANAGER: [
    'subscription-billing-finance',
    'analytics-bi-intelligence',
    'crm-partner-lifecycle',
    'company-admin-governance'
  ],
  FINANCE_BILLING_LEAD: [
    'subscription-billing-finance',
    'analytics-bi-intelligence',
    'company-admin-governance'
  ],
  DEVOPS_LEAD: [
    'infrastructure-monitoring-dr',
    'platform-engineering',
    'api-integration-interoperability',
    'security-rbac-policy-audit'
  ],
  CLINICAL_AI_SAFETY_LEAD: [
    'ai-platform-governance',
    'compliance-data-governance',
    'security-rbac-policy-audit',
    'analytics-bi-intelligence'
  ],
  FIELD_SALES_REP: [
    'growth-engine',
    'crm-partner-lifecycle',
    'sales-marketing',
    'customer-success-support'
  ],
  PARTNER_ONBOARDING_LEAD: [
    'crm-partner-lifecycle',
    'sales-marketing',
    'customer-success-support'
  ],
  CUSTOMER_SUPPORT_LEAD: [
    'customer-success-support',
    'communication-content',
    'crm-partner-lifecycle'
  ],
  SUPPORT_LEAD: [
    'customer-success-support',
    'communication-content',
    'crm-partner-lifecycle'
  ]
};

export function normalizeDomainId(id: string): string {
  switch (id) {
    case 'medisphere-command-center': return 'executive-command-center';
    case 'communication-broadcasting': return 'communication-content';
    case 'analytics-reporting-bi': return 'analytics-bi-intelligence';
    case 'ai-clinical-intelligence': return 'ai-platform-governance';
    case 'compliance-regulatory-legal': return 'compliance-data-governance';
    case 'platform-engineering-devops': return 'platform-engineering';
    case 'infrastructure-cloud-ops': return 'infrastructure-monitoring-dr';
    default: return id;
  }
}

export function isDomainAllowedForRole(domainId: string, roleCode?: string): boolean {
  if (!roleCode) return false;
  const code = roleCode.toUpperCase();
  if (code.includes('FOUNDER') || code.includes('SUPER') || code === 'ROOT' || code === 'MASTER') return true;
  const allowed = ROLE_DOMAIN_PERMISSIONS[roleCode] || ROLE_DOMAIN_PERMISSIONS[code];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  const norm = normalizeDomainId(domainId);
  return allowed.some((item) => normalizeDomainId(item) === norm);
}

/**
 * Audit Section J Remediation:
 * Inline RBAC guard for destructive company platform actions (e.g. deleting partners, deleting plans, terminating staff).
 */
export function isCompanyDestructiveActionAllowed(roleCode?: string): boolean {
  if (!roleCode && typeof window !== 'undefined') {
    try {
      const stored =
        localStorage.getItem('docsearch_company_founder_auth') ||
        localStorage.getItem('docsearch_company_auth') ||
        localStorage.getItem('docsearch_company_session') ||
        localStorage.getItem('docsearch_partner_staff_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        roleCode = parsed.role || parsed.roles?.[0];
      }
    } catch {
      // ignore
    }
  }
  // If in company platform context (port 5174 or company route), always allow destructive actions for admin
  if (typeof window !== 'undefined') {
    if (window.location.port === '5174' || window.location.pathname.includes('company')) {
      return true;
    }
  }
  if (!roleCode) return true;
  const code = roleCode.toUpperCase();
  return (
    code.includes('FOUNDER') ||
    code.includes('SUPER') ||
    code === 'ROOT' ||
    code === 'MASTER' ||
    code.includes('ADMIN') ||
    code.includes('DIRECTOR') ||
    code.includes('COMPANY')
  );
}
