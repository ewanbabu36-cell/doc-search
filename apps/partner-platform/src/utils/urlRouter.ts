import type { OrganizationWorkspaceType, PartnerModuleKey } from '../components/PartnerPlatformShell.js';

export interface ParsedRoute {
  workspace: OrganizationWorkspaceType;
  activeModule: PartnerModuleKey;
  path: string;
  subTab?: string | undefined;
}

// Canonical sub-path mappings per workspace
const WORKSPACE_MODULE_ROUTES: Record<OrganizationWorkspaceType, Record<string, PartnerModuleKey>> = {
  HOSPITAL: {
    '': 'hospital-home',
    'home': 'hospital-home',
    'overview': 'hospital-home',
    'inpatient': 'inpatient-management',
    'ot': 'operation-theatre-management',
    'emergency': 'emergency-trauma',
    'blood-bank': 'blood-bank-transfusion',
    'billing': 'billing-revenue-cycle',
    'insurance': 'insurance-claims',
    'pharmacy': 'pharmacy-medication',
    'lab': 'clinical-investigation',
    'radiology': 'radiology-imaging',
    'opd': 'clinical-consultation',
    'staff': 'staff-administration',
    'staff-administration': 'staff-administration',
    'patients': 'patient-registration',
    'abdm': 'abdm-fhir-gateway',
    'whatsapp': 'whatsapp-patient-portal',
    'command': 'executive-command-center',
    'ai': 'ai-chat-assistant',
    'dietary': 'dietary-kitchen-management',
    'mrd': 'medical-records',
    'procurement': 'procurement-supply-chain',
    'account': 'account-plan-features',
    'plan': 'account-plan-features',
    'my-account': 'account-plan-features'
  },
  PHARMACY: {
    '': 'pharmacy-medication',
    'dispense': 'pharmacy-medication',
    'pos': 'pharmacy-medication',
    'prescriptions': 'pharmacy-medication',
    'inventory': 'pharmacy-medication',
    'expiry': 'pharmacy-medication',
    'batches': 'pharmacy-medication',
    'compliance': 'pharmacy-medication',
    'billing': 'pharmacy-medication',
    'invoicing': 'pharmacy-medication',
    'whatsapp': 'whatsapp-patient-portal',
    'catalog': 'pharmacy-medication',
    'overview': 'pharmacy-medication',
    'procurement': 'pharmacy-medication',
    'staff': 'staff-administration',
    'staff-administration': 'staff-administration',
    'account': 'account-plan-features',
    'plan': 'account-plan-features',
    'my-account': 'account-plan-features'
  },
  CLINIC: {
    '': 'clinical-consultation',
    'consultation': 'clinical-consultation',
    'emr': 'clinical-consultation',
    'patients': 'patient-registration',
    'queue': 'encounters-visits',
    'voice-scribe': 'ai-clinical-cdss',
    'telemedicine': 'telemedicine-rpm',
    'billing': 'billing-revenue-cycle',
    'abdm': 'abdm-fhir-gateway',
    'whatsapp': 'whatsapp-patient-portal',
    'staff': 'staff-administration',
    'staff-administration': 'staff-administration',
    'account': 'account-plan-features',
    'plan': 'account-plan-features',
    'my-account': 'account-plan-features'
  },
  PATHOLOGY: {
    '': 'clinical-investigation',
    'workbench': 'clinical-investigation',
    'lims': 'clinical-investigation',
    'barcodes': 'patient-registration',
    'billing': 'billing-revenue-cycle',
    'reports': 'whatsapp-patient-portal',
    'staff': 'staff-administration',
    'staff-administration': 'staff-administration',
    'account': 'account-plan-features',
    'plan': 'account-plan-features',
    'my-account': 'account-plan-features'
  },
  DIAGNOSTIC_CENTRE: {
    '': 'radiology-imaging',
    'pacs': 'radiology-imaging',
    'dicom': 'radiology-imaging',
    'scheduling': 'encounters-visits',
    'insurance': 'insurance-claims',
    'billing': 'billing-revenue-cycle',
    'staff': 'staff-administration',
    'staff-administration': 'staff-administration',
    'account': 'account-plan-features',
    'plan': 'account-plan-features',
    'my-account': 'account-plan-features'
  },
  ENTERPRISE_COMMAND: {
    '': 'executive-command-center',
    'command': 'executive-command-center',
    'ai': 'ai-chat-assistant',
    'inpatient': 'inpatient-management',
    'ot': 'operation-theatre-management',
    'pharmacy': 'pharmacy-medication',
    'lab': 'clinical-investigation',
    'radiology': 'radiology-imaging',
    'billing': 'billing-revenue-cycle',
    'staff': 'staff-administration',
    'staff-administration': 'staff-administration',
    'account': 'account-plan-features',
    'plan': 'account-plan-features',
    'my-account': 'account-plan-features'
  }
};

const WORKSPACE_PREFIXES: Record<string, OrganizationWorkspaceType> = {
  'hospital': 'HOSPITAL',
  'pharmacy': 'PHARMACY',
  'clinic': 'CLINIC',
  'clinic-group': 'CLINIC',
  'pathology': 'PATHOLOGY',
  'lab': 'PATHOLOGY',
  'lims': 'PATHOLOGY',
  'diagnostic-lab': 'PATHOLOGY',
  'radiology': 'DIAGNOSTIC_CENTRE',
  'diagnostic': 'DIAGNOSTIC_CENTRE',
  'blood-bank': 'HOSPITAL',
  'dialysis': 'HOSPITAL',
  'dental': 'CLINIC',
  'ayush': 'CLINIC',
  'eye-care': 'CLINIC',
  'physio': 'CLINIC',
  'command': 'ENTERPRISE_COMMAND',
  'enterprise': 'ENTERPRISE_COMMAND'
};

const WORKSPACE_CANONICAL_PREFIX: Record<OrganizationWorkspaceType, string> = {
  HOSPITAL: '/hospital',
  PHARMACY: '/pharmacy',
  CLINIC: '/clinic',
  PATHOLOGY: '/pathology',
  DIAGNOSTIC_CENTRE: '/radiology',
  ENTERPRISE_COMMAND: '/command'
};

// Reverse map: Module -> Sub-path
const MODULE_TO_SUBPATH: Record<OrganizationWorkspaceType, Partial<Record<PartnerModuleKey, string>>> = {
  HOSPITAL: {
    'hospital-home': 'home',
    'inpatient-management': 'inpatient',
    'operation-theatre-management': 'ot',
    'emergency-trauma': 'emergency',
    'blood-bank-transfusion': 'blood-bank',
    'billing-revenue-cycle': 'billing',
    'insurance-claims': 'insurance',
    'pharmacy-medication': 'pharmacy',
    'clinical-investigation': 'lab',
    'radiology-imaging': 'radiology',
    'clinical-consultation': 'opd',
    'staff-administration': 'staff-administration',
    'patient-registration': 'patients',
    'abdm-fhir-gateway': 'abdm',
    'whatsapp-patient-portal': 'whatsapp',
    'executive-command-center': 'command',
    'ai-chat-assistant': 'ai',
    'account-plan-features': 'account'
  },
  PHARMACY: {
    'pharmacy-medication': 'pos',
    'procurement-supply-chain': 'procurement',
    'billing-revenue-cycle': 'billing',
    'whatsapp-patient-portal': 'whatsapp',
    'staff-administration': 'staff-administration',
    'account-plan-features': 'account'
  },
  CLINIC: {
    'clinical-consultation': 'consultation',
    'patient-registration': 'patients',
    'encounters-visits': 'queue',
    'ai-clinical-cdss': 'voice-scribe',
    'telemedicine-rpm': 'telemedicine',
    'billing-revenue-cycle': 'billing',
    'abdm-fhir-gateway': 'abdm',
    'whatsapp-patient-portal': 'whatsapp',
    'staff-administration': 'staff-administration',
    'account-plan-features': 'account'
  },
  PATHOLOGY: {
    'clinical-investigation': 'workbench',
    'patient-registration': 'barcodes',
    'billing-revenue-cycle': 'billing',
    'whatsapp-patient-portal': 'reports',
    'staff-administration': 'staff-administration',
    'account-plan-features': 'account'
  },
  DIAGNOSTIC_CENTRE: {
    'radiology-imaging': 'pacs',
    'encounters-visits': 'scheduling',
    'insurance-claims': 'insurance',
    'billing-revenue-cycle': 'billing',
    'staff-administration': 'staff-administration',
    'account-plan-features': 'account'
  },
  ENTERPRISE_COMMAND: {
    'executive-command-center': 'command',
    'ai-chat-assistant': 'ai',
    'inpatient-management': 'inpatient',
    'operation-theatre-management': 'ot',
    'pharmacy-medication': 'pharmacy',
    'clinical-investigation': 'lab',
    'radiology-imaging': 'radiology',
    'billing-revenue-cycle': 'billing',
    'staff-administration': 'staff-administration',
    'account-plan-features': 'account'
  }
};

export const getCategoryBasePath = (category: string): string => {
  const norm = category.toUpperCase();
  if (norm === 'HOSPITAL') return '/hospital';
  if (norm === 'PHARMACY') return '/pharmacy';
  if (norm === 'CLINIC') return '/clinic';
  if (norm === 'PATHOLOGY') return '/pathology';
  if (norm === 'DIAGNOSTIC_CENTRE' || norm === 'RADIOLOGY') return '/radiology';
  if (norm === 'BLOOD_BANK') return '/hospital/blood-bank';
  if (norm === 'DENTAL_CLINIC') return '/clinic/consultation';
  if (norm === 'AYUSH_WELLNESS') return '/clinic/consultation';
  if (norm === 'DIALYSIS_CENTRE') return '/hospital/inpatient';
  if (norm === 'EYE_CARE') return '/clinic/consultation';
  if (norm === 'PHYSIOTHERAPY') return '/clinic/consultation';
  return '/hospital';
};

export const getUrlForModule = (
  workspace: OrganizationWorkspaceType,
  moduleKey: PartnerModuleKey,
  subTab?: string
): string => {
  const prefix = WORKSPACE_CANONICAL_PREFIX[workspace] || '/hospital';
  if (workspace === 'PHARMACY') {
    if (moduleKey === 'whatsapp-patient-portal') {
      return `${prefix}/whatsapp`;
    }
    if (subTab) {
      return `${prefix}/${subTab}`;
    }
    return `${prefix}/pos`;
  }
  const submap = MODULE_TO_SUBPATH[workspace] || {};
  const subpath = submap[moduleKey] || '';
  return subpath ? `${prefix}/${subpath}` : prefix;
};

export const parseCurrentUrl = (
  defaultWorkspace: OrganizationWorkspaceType = 'HOSPITAL',
  defaultModule: PartnerModuleKey = 'hospital-home',
  allowedWorkspaces?: OrganizationWorkspaceType[]
): ParsedRoute => {
  if (typeof window === 'undefined') {
    return {
      workspace: defaultWorkspace,
      activeModule: defaultModule,
      path: '/'
    };
  }

  const pathname = window.location.pathname.replace(/\/+$/, '') || '';
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return {
      workspace: defaultWorkspace,
      activeModule: defaultModule,
      path: pathname || '/'
    };
  }

  const firstSeg = segments[0]?.toLowerCase() || '';
  let candidateWorkspace = WORKSPACE_PREFIXES[firstSeg] || defaultWorkspace;

  // Strict RBAC Guard: If user has restricted allowedWorkspaces and candidate is not permitted, fallback to default
  if (allowedWorkspaces && allowedWorkspaces.length > 0 && !allowedWorkspaces.includes(candidateWorkspace)) {
    candidateWorkspace = defaultWorkspace;
  }

  const resolvedWorkspace = candidateWorkspace;

  let defaultForPrefix: PartnerModuleKey = defaultModule;
  if (firstSeg === 'blood-bank') defaultForPrefix = 'blood-bank-transfusion';
  else if (firstSeg === 'dialysis') defaultForPrefix = 'inpatient-management';
  else if (firstSeg === 'dental' || firstSeg === 'ayush' || firstSeg === 'eye-care' || firstSeg === 'physio') defaultForPrefix = 'clinical-consultation';

  const subSeg = segments[1]?.toLowerCase() || '';
  const moduleMap = WORKSPACE_MODULE_ROUTES[resolvedWorkspace] || {};
  const resolvedModule = moduleMap[subSeg] || (subSeg === '' ? defaultForPrefix : moduleMap[''] || defaultModule);

  let subTab: string | undefined = undefined;
  if (resolvedWorkspace === 'PHARMACY') {
    if (['inventory', 'expiry', 'batches'].includes(subSeg)) {
      subTab = 'inventory';
    } else if (['prescriptions', 'dispense'].includes(subSeg)) {
      subTab = 'prescriptions';
    } else if (['compliance', 'billing', 'invoicing'].includes(subSeg)) {
      subTab = 'compliance';
    } else if (subSeg === 'catalog') {
      subTab = 'catalog';
    } else if (subSeg === 'overview') {
      subTab = 'overview';
    } else {
      subTab = 'pos';
    }
  }

  return {
    workspace: resolvedWorkspace,
    activeModule: resolvedModule,
    path: pathname,
    subTab
  };
};

export const navigateTo = (path: string, replace = false): void => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path) return;

  if (replace) {
    window.history.replaceState({ path }, '', path);
  } else {
    window.history.pushState({ path }, '', path);
  }

  // Notify listeners
  window.dispatchEvent(new PopStateEvent('popstate', { state: { path } }));
};

export const updateBrowserUrlWithoutReload = (
  workspace: OrganizationWorkspaceType,
  moduleKey: PartnerModuleKey,
  subTab?: string
): void => {
  if (typeof window === 'undefined') return;
  const canonicalUrl = getUrlForModule(workspace, moduleKey, subTab);
  if (window.location.pathname !== canonicalUrl) {
    window.history.pushState({ path: canonicalUrl }, '', canonicalUrl);
  }
};
