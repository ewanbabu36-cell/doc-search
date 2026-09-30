export interface PolicyCondition {
  field: 'role' | 'department' | 'branch' | 'dataScope' | 'encounterStatus' | 'time';
  operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN';
  value: any;
}

export interface TimeWindowConfig {
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
  daysOfWeek?: number[] | undefined; // 0=Sunday, 1=Monday... 6=Saturday
  timezone?: string | undefined;
}

export interface AccessPolicyDto {
  id: string;
  tenantId?: string | null | undefined;
  partnerId?: string | null | undefined;
  code: string;
  name: string;
  description?: string | null | undefined;
  effect: 'ALLOW' | 'DENY';
  priority: number;
  conditions: PolicyCondition[];
  actions: string[]; // List of permission strings, e.g. ['clinical:record:edit', '*']
  timeWindow?: TimeWindowConfig | null | undefined;
  status: 'ACTIVE' | 'DISABLED';
  isSystem: boolean;
}

export interface PolicyEvaluationContext {
  role?: string | undefined;
  roles?: string[] | undefined;
  department?: string | undefined;
  branchId?: string | undefined;
  branchName?: string | undefined;
  dataScope?: string | undefined;
  encounterStatus?: string | undefined;
  action: string;
  timestamp?: Date | undefined;
}

export class ConditionalPolicyEngine {
  private inMemoryPolicies = new Map<string, AccessPolicyDto>();

  constructor() {
    this.seedDefaultPolicies();
  }

  private seedDefaultPolicies() {
    // Default emergency shift access policy
    const defaultShiftPolicy: AccessPolicyDto = {
      id: 'pol-emergency-shift-01',
      code: 'POL_EMERGENCY_DOCTOR_SHIFT',
      name: 'Emergency Doctor Active Shift Rule',
      description: 'Allows emergency doctors to edit active emergency records during assigned duty',
      effect: 'ALLOW',
      priority: 150,
      conditions: [
        { field: 'role', operator: 'IN', value: ['DOCTOR', 'EMERGENCY_PHYSICIAN', 'SURGEON'] },
        { field: 'encounterStatus', operator: 'EQUALS', value: 'ACTIVE' }
      ],
      actions: ['clinical:record:edit', 'clinical:vitals:record'],
      status: 'ACTIVE',
      isSystem: true
    };
    this.inMemoryPolicies.set(defaultShiftPolicy.code, defaultShiftPolicy);
  }

  /**
   * Evaluates if a given time falls within the allowed time window (handling overnight shifts)
   */
  private matchesTimeWindow(window: TimeWindowConfig, now: Date): boolean {
    if (window.daysOfWeek && window.daysOfWeek.length > 0) {
      const day = now.getDay();
      if (!window.daysOfWeek.includes(day)) return false;
    }

    if (!window.startTime || !window.endTime) return true;

    const [startH, startM] = window.startTime.split(':').map(Number);
    const [endH, endM] = window.endTime.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    if (startMinutes <= endMinutes) {
      // Normal daytime window (e.g. 09:00 - 17:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight shift window (e.g. 20:00 - 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  /**
   * Evaluates a single policy condition
   */
  private evaluateCondition(condition: PolicyCondition, context: PolicyEvaluationContext): boolean {
    let actualValue: any = undefined;

    switch (condition.field) {
      case 'role':
        actualValue = context.roles && context.roles.length > 0 ? context.roles : [context.role];
        break;
      case 'department':
        actualValue = context.department;
        break;
      case 'branch':
        actualValue = context.branchId || context.branchName;
        break;
      case 'dataScope':
        actualValue = context.dataScope;
        break;
      case 'encounterStatus':
        actualValue = context.encounterStatus;
        break;
      default:
        return false;
    }

    const expected = condition.value;

    switch (condition.operator) {
      case 'EQUALS':
        if (Array.isArray(actualValue)) {
          return actualValue.includes(expected);
        }
        return String(actualValue).toLowerCase() === String(expected).toLowerCase();

      case 'NOT_EQUALS':
        if (Array.isArray(actualValue)) {
          return !actualValue.includes(expected);
        }
        return String(actualValue).toLowerCase() !== String(expected).toLowerCase();

      case 'IN':
        const expectedArr = Array.isArray(expected) ? expected : [expected];
        const lowerExpected = expectedArr.map((v) => String(v).toLowerCase());
        if (Array.isArray(actualValue)) {
          return actualValue.some((v) => lowerExpected.includes(String(v).toLowerCase()));
        }
        return lowerExpected.includes(String(actualValue).toLowerCase());

      case 'NOT_IN':
        const notExpectedArr = Array.isArray(expected) ? expected : [expected];
        const lowerNotExpected = notExpectedArr.map((v) => String(v).toLowerCase());
        if (Array.isArray(actualValue)) {
          return !actualValue.some((v) => lowerNotExpected.includes(String(v).toLowerCase()));
        }
        return !lowerNotExpected.includes(String(actualValue).toLowerCase());

      default:
        return false;
    }
  }

  /**
   * Evaluates all applicable active policies for the request context in priority order.
   * Deterministic resolution:
   * Higher priority rules evaluate first.
   * If any matching DENY rule is triggered, the decision is strictly DENY.
   */
  evaluatePolicies(
    context: PolicyEvaluationContext,
    tenantPolicies: AccessPolicyDto[] = []
  ): {
    matched: boolean;
    effect?: 'ALLOW' | 'DENY';
    policyCode?: string;
    policyName?: string;
    reason?: string;
  } {
    const now = context.timestamp || new Date();
    const allPolicies = [...this.inMemoryPolicies.values(), ...tenantPolicies];

    // Sort descending by priority (higher priority first)
    allPolicies.sort((a, b) => b.priority - a.priority);

    for (const policy of allPolicies) {
      if (policy.status !== 'ACTIVE') continue;

      // Check if action matches policy scope
      const actionMatches =
        policy.actions.includes('*') ||
        policy.actions.includes(context.action) ||
        policy.actions.some((a) => context.action.startsWith(a.replace(':*', '')));

      if (!actionMatches) continue;

      // Check time window
      if (policy.timeWindow && !this.matchesTimeWindow(policy.timeWindow, now)) {
        continue;
      }

      // Check all conditions (AND logic across conditions)
      const allConditionsMet = policy.conditions.every((cond) => this.evaluateCondition(cond, context));

      if (allConditionsMet) {
        return {
          matched: true,
          effect: policy.effect,
          policyCode: policy.code,
          policyName: policy.name,
          reason: `Policy "${policy.name}" (${policy.code}) evaluated to ${policy.effect}`
        };
      }
    }

    return { matched: false };
  }
}

export const conditionalPolicyEngine = new ConditionalPolicyEngine();
