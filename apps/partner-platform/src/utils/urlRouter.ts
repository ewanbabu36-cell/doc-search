import type { OrganizationWorkspaceType, PartnerModuleKey } from '../components/PartnerPlatformShell.js';

export interface ParsedRoute {
  workspace: OrganizationWorkspaceType;
  activeModule: PartnerModuleKey;
  path: string;
}

// Canonical sub-path mappings per workspace
const WORKSPACE_MODULE_ROUTES: Record<OrganizationWorkspaceType, Record<string, PartnerModuleKey>> = {
  HOSPITAL: {
    '': 'inpatient-management',
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
    'patients': 'patient-registration',
    'abdm': 'abdm-fhir-gateway',
    'whatsapp': 'whatsapp-patient-portal',
    'command': 'executive-command-center',
    'ai': 'ai-chat-assistant',
    'dietary': 'dietary-kitchen-management',
    'mrd': 'medical-records',
    'procurement': 'procurement-supply-chain'
  },
  PHARMACY: {
    '': 'pharmacy-medication',
    'dispense': 'pharmacy-medication',
    'pos': 'pharmacy-medication',
    'inventory': 'procurement-supply-chain',
    'billing': 'billing-revenue-cycle',
    'whatsapp': 'whatsapp-patient-portal'
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
    'whatsapp': 'whatsapp-patient-portal'
  },
  PATHOLOGY: {
    '': 'clinical-investigation',
    'workbench': 'clinical-investigation',
    'lims': 'clinical-investigation',
    'barcodes': 'patient-registration',
    'billing': 'billing-revenue-cycle',
    'reports': 'whatsapp-patient-portal'
  },
  DIAGNOSTIC_CENTRE: {
    '': 'radiology-imaging',
    'pacs': 'radiology-imaging',
    'dicom': 'radiology-imaging',
    'scheduling': 'encounters-visits',
    'insurance': 'insurance-claims',
    'billing': 'billing-revenue-cycle'
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
    'billing': 'billing-revenue-cycle'
  }
};

// Workspace base path mapping
const WORKSPACE_PREFIXES: Record<string, OrganizationWorkspaceType> = {
  'hospital': 'HOSPITAL',
  'pharmacy': 'PHARMACY',
  'clinic': 'CLINIC',
  'pathology': 'PATHOLOGY',
  'radiology': 'DIAGNOSTIC_CENTRE',
  'diagnostic': 'DIAGNOSTIC_CENTRE',
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
    'staff-administration': 'staff',
    'patient-registration': 'patients',
    'abdm-fhir-gateway': 'abdm',
    'whatsapp-patient-portal': 'whatsapp',
    'executive-command-center': 'command',
    'ai-chat-assistant': 'ai'
  },
  PHARMACY: {
    'pharmacy-medication': 'dispense',
    'procurement-supply-chain': 'inventory',
    'billing-revenue-cycle': 'billing',
    'whatsapp-patient-portal': 'whatsapp'
  },
  CLINIC: {
    'clinical-consultation': 'consultation',
    'patient-registration': 'patients',
    'encounters-visits': 'queue',
    'ai-clinical-cdss': 'voice-scribe',
    'telemedicine-rpm': 'telemedicine',
    'billing-revenue-cycle': 'billing',
    'abdm-fhir-gateway': 'abdm',
    'whatsapp-patient-portal': 'whatsapp'
  },
  PATHOLOGY: {
    'clinical-investigation': 'workbench',
    'patient-registration': 'barcodes',
    'billing-revenue-cycle': 'billing',
    'whatsapp-patient-portal': 'reports'
  },
  DIAGNOSTIC_CENTRE: {
    'radiology-imaging': 'pacs',
    'encounters-visits': 'scheduling',
    'insurance-claims': 'insurance',
    'billing-revenue-cycle': 'billing'
  },
  ENTERPRISE_COMMAND: {
    'executive-command-center': 'command',
    'ai-chat-assistant': 'ai',
    'inpatient-management': 'inpatient',
    'operation-theatre-management': 'ot',
    'pharmacy-medication': 'pharmacy',
    'clinical-investigation': 'lab',
    'radiology-imaging': 'radiology',
    'billing-revenue-cycle': 'billing'
  }
};

export const getCategoryBasePath = (category: string): string => {
  const norm = category.toUpperCase();
  if (norm === 'HOSPITAL') return '/hospital';
  if (norm === 'PHARMACY') return '/pharmacy';
  if (norm === 'CLINIC') return '/clinic';
  if (norm === 'PATHOLOGY') return '/pathology';
  if (norm === 'DIAGNOSTIC_CENTRE' || norm === 'RADIOLOGY') return '/radiology';
  return '/hospital';
};

export const getUrlForModule = (workspace: OrganizationWorkspaceType, moduleKey: PartnerModuleKey): string => {
  const prefix = WORKSPACE_CANONICAL_PREFIX[workspace] || '/hospital';
  const submap = MODULE_TO_SUBPATH[workspace] || {};
  const subpath = submap[moduleKey] || '';
  return subpath ? `${prefix}/${subpath}` : prefix;
};

export const parseCurrentUrl = (
  defaultWorkspace: OrganizationWorkspaceType = 'HOSPITAL',
  defaultModule: PartnerModuleKey = 'inpatient-management'
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
      path: '/'
    };
  }

  const firstSeg = segments[0]?.toLowerCase() || '';
  const resolvedWorkspace = WORKSPACE_PREFIXES[firstSeg] || defaultWorkspace;

  const subSeg = segments[1]?.toLowerCase() || '';
  const moduleMap = WORKSPACE_MODULE_ROUTES[resolvedWorkspace] || {};
  const resolvedModule = moduleMap[subSeg] || moduleMap[''] || defaultModule;

  return {
    workspace: resolvedWorkspace,
    activeModule: resolvedModule,
    path: pathname
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
  moduleKey: PartnerModuleKey
): void => {
  if (typeof window === 'undefined') return;
  const canonicalUrl = getUrlForModule(workspace, moduleKey);
  if (window.location.pathname !== canonicalUrl) {
    window.history.pushState({ path: canonicalUrl }, '', canonicalUrl);
  }
};
