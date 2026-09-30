import { getDatabase, capabilities, featureDependencies } from '@docsearch/database';
import { createLogger, AppError } from '@docsearch/shared-core';

const logger = createLogger('capability-dependency-engine');

export interface CapabilityDefinition {
  code: string;
  name: string;
  category: 'CLINICAL' | 'OPERATIONS' | 'DIAGNOSTICS' | 'INTEGRATION' | 'ADMIN';
  description: string;
  dependencies: string[];
  entitlementRequired?: string;
  status: 'ACTIVE' | 'DISABLED';
  expiresAt?: string | null;
  version?: string;
}

export interface DependencyRule {
  sourceCode: string;
  dependsOnCode: string;
  dependencyType: 'CAPABILITY' | 'FEATURE' | 'PERMISSION';
  errorMessage: string;
  status?: 'ACTIVE' | 'DISABLED';
  expiresAt?: string | null;
}

export type DependencyFailureType =
  | 'MISSING_DEPENDENCY'
  | 'CIRCULAR_DEPENDENCY'
  | 'INVALID_DEPENDENCY'
  | 'INACTIVE_DEPENDENCY'
  | 'EXPIRED_DEPENDENCY';

export interface DependencyEvaluationConflict {
  capabilityOrFeatureCode: string;
  capabilityCode: string;
  missingPrerequisite: string;
  failureType: DependencyFailureType;
  message: string;
}

export const MASTER_CAPABILITIES: CapabilityDefinition[] = [
  {
    code: 'PATIENT_REGISTRATION',
    name: 'Patient Registration & UHID Intake',
    category: 'OPERATIONS',
    description: 'Patient demographic registration, UHID creation, and identity verification.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'APPOINTMENT',
    name: 'Appointment Scheduling & Slot Management',
    category: 'OPERATIONS',
    description: 'Doctor appointment scheduling, slot locking, and token issuance.',
    dependencies: ['PATIENT_REGISTRATION'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'OPD',
    name: 'Outpatient Department & Appointments',
    category: 'OPERATIONS',
    description: 'OPD token queue, patient visits, doctor schedules and clinic intake.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'IPD',
    name: 'Inpatient Department & Bed Orchestration',
    category: 'OPERATIONS',
    description: 'Inpatient admissions, bed tracking, ward management and discharge planning.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'EMERGENCY',
    name: 'Emergency & Trauma Care',
    category: 'CLINICAL',
    description: 'Emergency triaging, red/amber alerts, crash cart and rapid stabilization.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'ICU',
    name: 'Intensive Critical Care Units',
    category: 'CLINICAL',
    description: 'High-dependency ICU monitoring, ventilators and multi-parameter telemetry.',
    dependencies: ['IPD'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'OT',
    name: 'Operation Theatre & Surgical Suite',
    category: 'OPERATIONS',
    description: 'Surgical scheduling, pre-op checklists, anesthesia notes and recovery bays.',
    dependencies: ['IPD'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'LABORATORY',
    name: 'General Clinical Laboratory & LIMS',
    category: 'DIAGNOSTICS',
    description: 'Sample collection, barcode accessioning, lab test orders and result entry.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'LAB_ORDERING',
    name: 'Diagnostic Laboratory Ordering',
    category: 'DIAGNOSTICS',
    description: 'Clinical test ordering, requisition tracking, and specimen barcode generation.',
    dependencies: ['LABORATORY'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'LAB_PROCESSING',
    name: 'Specimen Accessioning & Analyzer Processing',
    category: 'DIAGNOSTICS',
    description: 'Phlebotomy collection, specimen accessioning, and analyzer worksheet entry.',
    dependencies: ['LABORATORY', 'LAB_ORDERING'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'LAB_REPORT_VALIDATION',
    name: 'Pathologist Diagnostic Report Validation',
    category: 'DIAGNOSTICS',
    description: 'Authorized pathologist result review, critical value verification, and digital sign-off.',
    dependencies: ['LABORATORY', 'LAB_PROCESSING'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'PATHOLOGY',
    name: 'Pathology & Histopathology Laboratory',
    category: 'DIAGNOSTICS',
    description: 'Biopsy analysis, slide scanning, cytology and critical pathologist sign-off.',
    dependencies: ['LABORATORY'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'RADIOLOGY',
    name: 'Radiology & PACS Imaging Suite',
    category: 'DIAGNOSTICS',
    description: 'X-Ray, CT, MRI scans, DICOM viewer, PACS integration and radiologist reports.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'PHARMACY',
    name: 'Pharmacy Core & Formulary Management',
    category: 'OPERATIONS',
    description: 'Drug formulary, batch inventory, stock movements, and regulatory compliance.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'PHARMACY_RETAIL',
    name: 'Retail Pharmacy POS & Prescription Dispensing',
    category: 'OPERATIONS',
    description: 'B2C retail prescription dispensing, FEFO batch deduction, and Schedule H1 register.',
    dependencies: ['PHARMACY'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'PHARMACY_WHOLESALE',
    name: 'Wholesale Pharmaceutical B2B Distribution',
    category: 'OPERATIONS',
    description: 'B2B Drug License Form 20B/21B verification, bulk GST invoicing, and credit ledger.',
    dependencies: ['PHARMACY'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'INVENTORY',
    name: 'Inventory, GRN & Batch Stock Control',
    category: 'OPERATIONS',
    description: 'Purchase orders, GRN inward stock, batch expiry alerts, and stock movement ledgers.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'REPORTING',
    name: 'Operational & Compliance Reporting',
    category: 'ADMIN',
    description: 'Statutory registers, daily collection summaries, and departmental turnaround reports.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'BLOOD_BANK',
    name: 'Blood Bank & Transfusion Medicine',
    category: 'CLINICAL',
    description: 'Donor registration, blood grouping, cross-matching and transfusion audit records.',
    dependencies: ['LABORATORY'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'MRD',
    name: 'Medical Records Department & Coding',
    category: 'ADMIN',
    description: 'ICD-10 clinical coding, archival, medico-legal dossiers and chart completion.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'DIETARY',
    name: 'Dietary & Clinical Nutrition',
    category: 'OPERATIONS',
    description: 'Meal planning, diabetic/renal diet regimes and nutritional assessments.',
    dependencies: ['IPD'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'BILLING',
    name: 'Billing, Cashier & Financial Invoicing',
    category: 'ADMIN',
    description: 'OPD/IPD invoices, tariff schedules, GST calculation, payments and receipt vouchers.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'FINANCE',
    name: 'Corporate Finance & General Ledger',
    category: 'ADMIN',
    description: 'Accounts receivable, balance sheets, revenue reconciliation and refund processing.',
    dependencies: ['BILLING'],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'HR',
    name: 'Human Resources & Staff Administration',
    category: 'ADMIN',
    description: 'Doctor credentials, duty rosters, nursing shifts and staff onboarding.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'CRM',
    name: 'Partner & Patient Relationship Management',
    category: 'ADMIN',
    description: 'Lead tracking, partner communications, lifecycle management and campaigns.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'ANALYTICS',
    name: 'Executive Analytics & BI Insights',
    category: 'ADMIN',
    description: 'Revenue trends, bed occupancy, mortality rates, turnaround time and compliance KPIs.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'SUPPORT',
    name: 'Helpdesk & Ticket Resolution',
    category: 'ADMIN',
    description: 'Internal issues, equipment breakdown tickets and escalation matrix.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'COMMUNICATION',
    name: 'Omnichannel Communication (WhatsApp & SMS)',
    category: 'INTEGRATION',
    description: 'Automated appointment reminders, lab report PDFs on WhatsApp and SMS OTPs.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'AI',
    name: 'AI Clinical Co-Pilot & Voice Scribe',
    category: 'CLINICAL',
    description: 'Ambient consultation voice listening, automated SOAP generation and CDSS alerts.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  },
  {
    code: 'INTEGRATION',
    name: 'ABDM National Gateway & Health Interoperability',
    category: 'INTEGRATION',
    description: 'ABHA creation, Scan & Share tokens, Consent Manager and FHIR bundle transfer.',
    dependencies: [],
    status: 'ACTIVE',
    version: '1.0.0'
  }
];

export const MASTER_FEATURE_DEPENDENCIES: DependencyRule[] = [
  {
    sourceCode: 'radiology.reporting',
    dependsOnCode: 'RADIOLOGY',
    dependencyType: 'CAPABILITY',
    errorMessage: 'Radiology Reporting cannot be accessed because the RADIOLOGY capability is disabled.'
  },
  {
    sourceCode: 'radiology.reporting',
    dependsOnCode: 'radiology.pacs',
    dependencyType: 'FEATURE',
    errorMessage: 'Radiology Reporting requires feature "radiology.pacs" to be active.'
  },
  {
    sourceCode: 'lab.result.validate',
    dependsOnCode: 'LABORATORY',
    dependencyType: 'CAPABILITY',
    errorMessage: 'Lab Result Validation cannot be performed because the LABORATORY capability is disabled.'
  },
  {
    sourceCode: 'lab.result.validate',
    dependsOnCode: 'LAB_PROCESSING',
    dependencyType: 'CAPABILITY',
    errorMessage: 'Lab Result Validation requires LAB_PROCESSING capability to be active.'
  },
  {
    sourceCode: 'lab.result.validate',
    dependsOnCode: 'lab.processing',
    dependencyType: 'FEATURE',
    errorMessage: 'Lab Result Validation requires feature "lab.processing" to be active.'
  },
  {
    sourceCode: 'lab.result.validate',
    dependsOnCode: 'lab:VALIDATE',
    dependencyType: 'PERMISSION',
    errorMessage: 'Lab Result Validation requires explicit "lab:VALIDATE" permission.'
  },
  {
    sourceCode: 'pharmacy.dispense',
    dependsOnCode: 'PHARMACY',
    dependencyType: 'CAPABILITY',
    errorMessage: 'Pharmacy Dispensing cannot proceed because the PHARMACY capability is disabled.'
  },
  {
    sourceCode: 'pharmacy.dispense',
    dependsOnCode: 'PHARMACY_RETAIL',
    dependencyType: 'CAPABILITY',
    errorMessage: 'Retail Pharmacy Dispensing requires PHARMACY_RETAIL capability.'
  },
  {
    sourceCode: 'pharmacy.dispense',
    dependsOnCode: 'pharmacy.pos',
    dependencyType: 'FEATURE',
    errorMessage: 'Pharmacy Dispensing requires feature "pharmacy.pos" to be active.'
  },
  {
    sourceCode: 'pharmacy.wholesale',
    dependsOnCode: 'PHARMACY_WHOLESALE',
    dependencyType: 'CAPABILITY',
    errorMessage: 'Wholesale Pharmacy Invoicing requires PHARMACY_WHOLESALE capability.'
  },
  {
    sourceCode: 'blood_bank.transfuse',
    dependsOnCode: 'BLOOD_BANK',
    dependencyType: 'CAPABILITY',
    errorMessage: 'Blood Bank Transfusion is unavailable because the BLOOD_BANK capability is disabled.'
  },
  {
    sourceCode: 'clinical.icu.admit',
    dependsOnCode: 'ICU',
    dependencyType: 'CAPABILITY',
    errorMessage: 'ICU Admission requires active ICU capability.'
  },
  {
    sourceCode: 'clinical.ot.schedule',
    dependsOnCode: 'OT',
    dependencyType: 'CAPABILITY',
    errorMessage: 'Operation Theatre Scheduling requires active OT capability.'
  },
  {
    sourceCode: 'finance.refund.process',
    dependsOnCode: 'FINANCE',
    dependencyType: 'CAPABILITY',
    errorMessage: 'Refund processing requires active FINANCE capability.'
  }
];

export class CapabilityAndDependencyEngine {
  private capabilitiesCache = new Map<string, CapabilityDefinition>();
  private dependenciesCache = new Map<string, DependencyRule[]>();

  constructor() {
    this.resetToMasterCatalog();
  }

  public resetToMasterCatalog(): void {
    this.capabilitiesCache.clear();
    this.dependenciesCache.clear();
    for (const c of MASTER_CAPABILITIES) {
      this.capabilitiesCache.set(c.code.toUpperCase(), { ...c, dependencies: [...c.dependencies] });
    }
    for (const d of MASTER_FEATURE_DEPENDENCIES) {
      const src = d.sourceCode.toLowerCase();
      const existing = this.dependenciesCache.get(src) || [];
      existing.push({ ...d });
      this.dependenciesCache.set(src, existing);
    }
  }

  /**
   * Registers or updates a capability definition in the central registry.
   * Rejects registration if it introduces a circular dependency cycle.
   */
  public registerCapability(def: CapabilityDefinition): { valid: boolean; reason?: string } {
    const code = def.code.toUpperCase().trim();
    const previous = this.capabilitiesCache.get(code);
    this.capabilitiesCache.set(code, {
      ...def,
      code,
      dependencies: (def.dependencies || []).map((d) => d.toUpperCase().trim())
    });

    const cycleCheck = this.detectCircularCapabilityGraph();
    if (cycleCheck.hasCycle) {
      if (previous) {
        this.capabilitiesCache.set(code, previous);
      } else {
        this.capabilitiesCache.delete(code);
      }
      const msg = `CIRCULAR_DEPENDENCY: Cycle detected in capability dependency graph: ${cycleCheck.cyclePath.join(' -> ')}`;
      throw new AppError({ message: msg, statusCode: 400 });
    }
    return { valid: true };
  }

  /**
   * Registers a feature/capability dependency rule and verifies no circular dependency is formed.
   */
  public registerDependencyRule(rule: DependencyRule): { valid: boolean; reason?: string } {
    const src = rule.sourceCode.toLowerCase().trim();
    const dep = rule.dependsOnCode.toLowerCase().trim();
    if (src === dep) {
      const msg = `CIRCULAR_DEPENDENCY: Self-dependency detected on "${rule.sourceCode}".`;
      throw new AppError({ message: msg, statusCode: 400 });
    }

    const existing = this.dependenciesCache.get(src) || [];
    existing.push({ ...rule });
    this.dependenciesCache.set(src, existing);

    const cycleCheck = this.detectCircularFeatureGraph(src);
    if (cycleCheck.hasCycle) {
      existing.pop();
      if (existing.length === 0) {
        this.dependenciesCache.delete(src);
      }
      const msg = `CIRCULAR_DEPENDENCY: Circular feature dependency detected: ${cycleCheck.cyclePath.join(' -> ')}`;
      throw new AppError({ message: msg, statusCode: 400 });
    }

    return { valid: true };
  }

  /**
   * Detects circular dependencies across the Capability dependency graph using DFS 3-color marking.
   */
  public detectCircularCapabilityGraph(): { hasCycle: boolean; cyclePath: string[] } {
    const state = new Map<string, 'UNVISITED' | 'VISITING' | 'VISITED'>();
    const path: string[] = [];

    const dfs = (node: string): string[] | null => {
      state.set(node, 'VISITING');
      path.push(node);

      const cap = this.capabilitiesCache.get(node);
      const deps = cap?.dependencies || [];
      for (const rawDep of deps) {
        const dep = rawDep.toUpperCase().trim();
        const depState = state.get(dep) || 'UNVISITED';
        if (depState === 'VISITING') {
          const cycleStart = path.indexOf(dep);
          return [...path.slice(cycleStart), dep];
        }
        if (depState === 'UNVISITED') {
          const found = dfs(dep);
          if (found) return found;
        }
      }

      path.pop();
      state.set(node, 'VISITED');
      return null;
    };

    for (const code of this.capabilitiesCache.keys()) {
      if ((state.get(code) || 'UNVISITED') === 'UNVISITED') {
        const cycle = dfs(code);
        if (cycle) {
          return { hasCycle: true, cyclePath: cycle };
        }
      }
    }

    return { hasCycle: false, cyclePath: [] };
  }

  /**
   * Detects circular dependencies across feature dependency rules using DFS.
   */
  public detectCircularFeatureGraph(startCode?: string): { hasCycle: boolean; cyclePath: string[] } {
    const state = new Map<string, 'UNVISITED' | 'VISITING' | 'VISITED'>();
    const path: string[] = [];

    const dfs = (node: string): string[] | null => {
      state.set(node, 'VISITING');
      path.push(node);

      const rules = this.dependenciesCache.get(node) || [];
      for (const r of rules) {
        const dep = r.dependsOnCode.toLowerCase().trim();
        const depState = state.get(dep) || 'UNVISITED';
        if (depState === 'VISITING') {
          const cycleStart = path.indexOf(dep);
          return [...path.slice(cycleStart), dep];
        }
        if (depState === 'UNVISITED' && this.dependenciesCache.has(dep)) {
          const found = dfs(dep);
          if (found) return found;
        }
      }

      path.pop();
      state.set(node, 'VISITED');
      return null;
    };

    const keys = startCode ? [startCode.toLowerCase().trim()] : Array.from(this.dependenciesCache.keys());
    for (const k of keys) {
      if ((state.get(k) || 'UNVISITED') === 'UNVISITED') {
        const cycle = dfs(k);
        if (cycle) {
          return { hasCycle: true, cyclePath: cycle };
        }
      }
    }
    return { hasCycle: false, cyclePath: [] };
  }

  /**
   * Auto-seeds master capabilities and dependencies in database
   */
  async seedMasterCatalog(): Promise<void> {
    const db = getDatabase();
    if (!db) return;

    try {
      for (const cap of MASTER_CAPABILITIES) {
        await db
          .insert(capabilities)
          .values({
            id: crypto.randomUUID(),
            code: cap.code,
            name: cap.name,
            category: cap.category,
            description: cap.description,
            dependencies: cap.dependencies,
            entitlementRequired: cap.entitlementRequired || null,
            status: cap.status
          })
          .onConflictDoNothing({ target: capabilities.code });
      }

      for (const rule of MASTER_FEATURE_DEPENDENCIES) {
        await db
          .insert(featureDependencies)
          .values({
            id: crypto.randomUUID(),
            sourceCode: rule.sourceCode,
            dependsOnCode: rule.dependsOnCode,
            dependencyType: rule.dependencyType,
            errorMessage: rule.errorMessage
          })
          .onConflictDoNothing();
      }

      logger.info('Master capabilities and feature dependencies seeded successfully.');
    } catch (err) {
      logger.warn('Seed warning in CapabilityAndDependencyEngine: ' + String(err));
    }
  }

  getAllCapabilities(): CapabilityDefinition[] {
    return Array.from(this.capabilitiesCache.values());
  }

  getCapability(code: string): CapabilityDefinition | undefined {
    return this.capabilitiesCache.get(code.toUpperCase());
  }

  /**
   * Validates whether a list of requested capabilities satisfies inter-capability dependencies,
   * checking for:
   * - Circular dependencies (CIRCULAR_DEPENDENCY)
   * - Unknown / invalid capability definitions (INVALID_DEPENDENCY)
   * - Inactive / disabled capabilities (INACTIVE_DEPENDENCY)
   * - Expired capabilities (EXPIRED_DEPENDENCY)
   * - Missing prerequisite capabilities (MISSING_DEPENDENCY)
   */
  validateCapabilityDependencies(
    activeCodes: string[],
    options?: {
      asOf?: Date | undefined;
      capabilityExpiryMap?: Record<string, string | Date | null | undefined> | undefined;
      capabilityStatusMap?: Record<string, 'ACTIVE' | 'DISABLED' | string> | undefined;
    }
  ): {
    valid: boolean;
    conflicts: DependencyEvaluationConflict[];
  } {
    const now = options?.asOf || new Date();
    const activeSet = new Set(activeCodes.map((c) => c.toUpperCase().trim()));
    const conflicts: DependencyEvaluationConflict[] = [];

    // 1. Cycle detection
    const cycleCheck = this.detectCircularCapabilityGraph();
    if (cycleCheck.hasCycle) {
      conflicts.push({
        capabilityOrFeatureCode: cycleCheck.cyclePath[0] || 'UNKNOWN',
        capabilityCode: cycleCheck.cyclePath[0] || 'UNKNOWN',
        missingPrerequisite: cycleCheck.cyclePath.join(' -> '),
        failureType: 'CIRCULAR_DEPENDENCY',
        message: `Circular dependency detected in capability graph: ${cycleCheck.cyclePath.join(' -> ')}`
      });
      return { valid: false, conflicts };
    }

    const verifyCapabilityRecursive = (code: string, visited = new Set<string>()) => {
      if (visited.has(code)) {
        conflicts.push({
          capabilityOrFeatureCode: code,
          capabilityCode: code,
          missingPrerequisite: code,
          failureType: 'CIRCULAR_DEPENDENCY',
          message: `Circular dependency detected involving capability "${code}".`
        });
        return;
      }
      visited.add(code);

      const def = this.capabilitiesCache.get(code);
      if (!def) {
        conflicts.push({
          capabilityOrFeatureCode: code,
          capabilityCode: code,
          missingPrerequisite: code,
          failureType: 'INVALID_DEPENDENCY',
          message: `Capability "${code}" is unknown or invalid in the Master Capability Catalog.`
        });
        return;
      }

      const effectiveStatus = options?.capabilityStatusMap?.[code] || def.status;
      if (String(effectiveStatus).toUpperCase() !== 'ACTIVE') {
        conflicts.push({
          capabilityOrFeatureCode: code,
          capabilityCode: code,
          missingPrerequisite: code,
          failureType: 'INACTIVE_DEPENDENCY',
          message: `Capability "${def.name}" (${code}) is currently ${effectiveStatus}.`
        });
      }

      const expVal = options?.capabilityExpiryMap?.[code] ?? def.expiresAt;
      if (expVal && new Date(expVal).getTime() < now.getTime()) {
        conflicts.push({
          capabilityOrFeatureCode: code,
          capabilityCode: code,
          missingPrerequisite: code,
          failureType: 'EXPIRED_DEPENDENCY',
          message: `Capability "${def.name}" (${code}) expired at ${new Date(expVal).toISOString()}.`
        });
      }

      for (const reqRaw of def.dependencies) {
        const req = reqRaw.toUpperCase().trim();
        const reqDef = this.capabilitiesCache.get(req);
        if (!reqDef) {
          conflicts.push({
            capabilityOrFeatureCode: code,
            capabilityCode: code,
            missingPrerequisite: req,
            failureType: 'INVALID_DEPENDENCY',
            message: `Capability "${code}" depends on unknown capability "${req}".`
          });
          continue;
        }

        if (!activeSet.has(req)) {
          conflicts.push({
            capabilityOrFeatureCode: code,
            capabilityCode: code,
            missingPrerequisite: req,
            failureType: 'MISSING_DEPENDENCY',
            message: `Capability "${def.name}" (${code}) cannot be active because required prerequisite capability "${req}" is disabled.`
          });
          continue;
        }

        const reqStatus = options?.capabilityStatusMap?.[req] || reqDef.status;
        if (String(reqStatus).toUpperCase() !== 'ACTIVE') {
          conflicts.push({
            capabilityOrFeatureCode: code,
            capabilityCode: code,
            missingPrerequisite: req,
            failureType: 'INACTIVE_DEPENDENCY',
            message: `Capability "${code}" requires prerequisite "${req}", which is ${reqStatus}.`
          });
          continue;
        }

        const reqExp = options?.capabilityExpiryMap?.[req] ?? reqDef.expiresAt;
        if (reqExp && new Date(reqExp).getTime() < now.getTime()) {
          conflicts.push({
            capabilityOrFeatureCode: code,
            capabilityCode: code,
            missingPrerequisite: req,
            failureType: 'EXPIRED_DEPENDENCY',
            message: `Capability "${code}" requires prerequisite "${req}", which has expired.`
          });
          continue;
        }

        verifyCapabilityRecursive(req, new Set(visited));
      }
    };

    for (const code of activeSet) {
      verifyCapabilityRecursive(code);
    }

    return {
      valid: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Validates if a specific action/feature can execute given active capabilities, features, and permissions.
   * Detects missing, circular, invalid, inactive, and expired dependencies (Fail-Closed).
   */
  validateFeatureDependencies(
    featureCode: string,
    activeCapabilities: string[],
    options?: {
      activeFeatures?: string[];
      grantedPermissions?: string[];
      capabilityExpiryMap?: Record<string, string | Date | null | undefined>;
      capabilityStatusMap?: Record<string, 'ACTIVE' | 'DISABLED' | string>;
      asOf?: Date;
    }
  ): {
    allowed: boolean;
    failureType?: DependencyFailureType;
    missingDependency?: string;
    reason?: string;
  } {
    const now = options?.asOf || new Date();
    const normFeature = featureCode.toLowerCase().trim();

    // 1. Check circular feature graph
    const featCycle = this.detectCircularFeatureGraph(normFeature);
    if (featCycle.hasCycle) {
      return {
        allowed: false,
        failureType: 'CIRCULAR_DEPENDENCY',
        missingDependency: featCycle.cyclePath.join(' -> '),
        reason: `CIRCULAR_DEPENDENCY: Circular dependency detected for "${featureCode}": ${featCycle.cyclePath.join(' -> ')}`
      };
    }

    // 2. Check capability graph for activeCapabilities
    const capGraphEval = this.validateCapabilityDependencies(activeCapabilities, {
      asOf: now,
      capabilityExpiryMap: options?.capabilityExpiryMap,
      capabilityStatusMap: options?.capabilityStatusMap
    });
    if (!capGraphEval.valid && capGraphEval.conflicts[0]) {
      const firstConflict = capGraphEval.conflicts[0];
      return {
        allowed: false,
        failureType: firstConflict.failureType,
        missingDependency: firstConflict.missingPrerequisite,
        reason: firstConflict.message
      };
    }

    const activeCapSet = new Set(activeCapabilities.map((c) => c.toUpperCase().trim()));
    const activeFeatSet = options?.activeFeatures
      ? new Set(options.activeFeatures.map((f) => f.toLowerCase().trim()))
      : null;
    const permSet = options?.grantedPermissions
      ? new Set(options.grantedPermissions.map((p) => p.toLowerCase().replace(/:/g, '.').trim()))
      : null;

    const rules = this.dependenciesCache.get(normFeature) || [];

    for (const rule of rules) {
      if (rule.status && rule.status !== 'ACTIVE') {
        return {
          allowed: false,
          failureType: 'INACTIVE_DEPENDENCY',
          missingDependency: rule.dependsOnCode,
          reason: `INACTIVE_DEPENDENCY: Dependency rule "${rule.dependsOnCode}" is disabled.`
        };
      }

      if (rule.expiresAt && new Date(rule.expiresAt).getTime() < now.getTime()) {
        return {
          allowed: false,
          failureType: 'EXPIRED_DEPENDENCY',
          missingDependency: rule.dependsOnCode,
          reason: `EXPIRED_DEPENDENCY: Dependency "${rule.dependsOnCode}" expired at ${new Date(rule.expiresAt).toISOString()}.`
        };
      }

      if (rule.dependencyType === 'CAPABILITY') {
        const depCapCode = rule.dependsOnCode.toUpperCase().trim();
        const capDef = this.capabilitiesCache.get(depCapCode);
        if (!capDef) {
          return {
            allowed: false,
            failureType: 'INVALID_DEPENDENCY',
            missingDependency: depCapCode,
            reason: `INVALID_DEPENDENCY: Required capability "${depCapCode}" does not exist in Master Catalog.`
          };
        }
        const statusOverride = options?.capabilityStatusMap?.[depCapCode] || capDef.status;
        if (String(statusOverride).toUpperCase() !== 'ACTIVE') {
          return {
            allowed: false,
            failureType: 'INACTIVE_DEPENDENCY',
            missingDependency: depCapCode,
            reason: `INACTIVE_DEPENDENCY: Required capability "${depCapCode}" is ${statusOverride}.`
          };
        }
        const expOverride = options?.capabilityExpiryMap?.[depCapCode] ?? capDef.expiresAt;
        if (expOverride && new Date(expOverride).getTime() < now.getTime()) {
          return {
            allowed: false,
            failureType: 'EXPIRED_DEPENDENCY',
            missingDependency: depCapCode,
            reason: `EXPIRED_DEPENDENCY: Required capability "${depCapCode}" has expired.`
          };
        }
        if (!activeCapSet.has(depCapCode)) {
          return {
            allowed: false,
            failureType: 'MISSING_DEPENDENCY',
            missingDependency: depCapCode,
            reason: rule.errorMessage
          };
        }
      } else if (rule.dependencyType === 'FEATURE' && activeFeatSet) {
        const depFeatCode = rule.dependsOnCode.toLowerCase().trim();
        if (!activeFeatSet.has(depFeatCode)) {
          return {
            allowed: false,
            failureType: 'MISSING_DEPENDENCY',
            missingDependency: rule.dependsOnCode,
            reason: rule.errorMessage
          };
        }
        // Transitive feature dependency check
        const nestedCheck = this.validateFeatureDependencies(depFeatCode, activeCapabilities, options);
        if (!nestedCheck.allowed) {
          return nestedCheck;
        }
      } else if (rule.dependencyType === 'PERMISSION' && permSet) {
        const hasWildcard = permSet.has('*') || permSet.has('*.*') || permSet.has('all');
        const reqPermNorm = rule.dependsOnCode.toLowerCase().replace(/:/g, '.').trim();
        const hasExactOrEquiv =
          hasWildcard ||
          permSet.has(reqPermNorm) ||
          (reqPermNorm === 'lab.validate' && permSet.has('lab.result.validate')) ||
          (reqPermNorm === 'radiology.validate' && permSet.has('radiology.report.sign')) ||
          (reqPermNorm === 'prescription.approve' && permSet.has('clinical.prescription.sign')) ||
          (reqPermNorm === 'pharmacy.dispense' && permSet.has('pharmacy.dispense.create'));
        if (!hasExactOrEquiv) {
          return {
            allowed: false,
            failureType: 'MISSING_DEPENDENCY',
            missingDependency: rule.dependsOnCode,
            reason: rule.errorMessage
          };
        }
      }
    }

    return { allowed: true };
  }
}

export const capabilityEngine = new CapabilityAndDependencyEngine();
