export type RuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'IN'
  | 'NOT_IN'
  | 'CONTAINS'
  | 'BETWEEN'
  | 'REGEX'
  | 'IS_TRUE'
  | 'IS_FALSE';

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value?: any;
  secondValue?: any; // For BETWEEN
}

export interface RuleExpression {
  logicalOperator: 'AND' | 'OR';
  conditions: RuleCondition[];
  nestedExpressions?: RuleExpression[];
  description?: string;
}

// ==========================================
// 2. DYNAMIC WORKFLOW STRUCTURE
// ==========================================

export type WorkflowStageType =
  | 'INITIAL'
  | 'QUALIFICATION'
  | 'COMMERCIAL'
  | 'COMPLIANCE'
  | 'PROVISIONING'
  | 'ONBOARDING'
  | 'GO_LIVE_GATE'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'TERMINAL';

export type WorkflowRequirementType =
  | 'PAYMENT'
  | 'LICENCE'
  | 'DOCUMENT'
  | 'APPROVAL'
  | 'SUBSCRIPTION'
  | 'ADMIN_USER'
  | 'BRANCH'
  | 'MODULE'
  | 'TRAINING'
  | 'CONFIGURATION'
  | 'CUSTOM';

export type ActionType =
  | 'CREATE_CUSTOMER'
  | 'CREATE_SUBSCRIPTION'
  | 'GENERATE_INVOICE'
  | 'APPLY_OFFER'
  | 'VERIFY_DOCUMENT'
  | 'CREATE_TENANT'
  | 'CREATE_ADMIN'
  | 'ACTIVATE_MODULE'
  | 'SEND_NOTIFICATION'
  | 'CREATE_TASK'
  | 'CREATE_AUDIT_EVENT'
  | 'PROVISION_ABDM_HFR'
  | 'TRIGGER_WEBHOOK';

export interface ActionDefinitionDto {
  id: string;
  actionType: ActionType;
  name: string;
  configuration: Record<string, any>;
  executionOrder: number;
  continueOnError?: boolean;
}

export interface StageRequirementDto {
  id: string;
  stageId: string;
  requirementCode: string;
  name: string;
  description?: string;
  requirementType: WorkflowRequirementType;
  configuration: Record<string, any>;
  isRequired: boolean;
  validationRule?: RuleExpression;
  order: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface WorkflowTransitionDto {
  id: string;
  workflowId: string;
  fromStageId: string;
  toStageId: string;
  transitionCode: string;
  name: string;
  description?: string;
  conditions?: RuleExpression;
  requiredPermissions?: string[];
  approvalRequired?: boolean;
  requiredApprovalRoles?: string[];
  actions?: ActionDefinitionDto[];
  status: 'ACTIVE' | 'DEPRECATED';
}

export interface WorkflowStageDto {
  id: string;
  workflowId: string;
  code: string;
  name: string;
  description?: string;
  sequence: number;
  stageType: WorkflowStageType;
  isInitial: boolean;
  isTerminal: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  metadata?: Record<string, any>;
  requirements: StageRequirementDto[];
}

export interface WorkflowVersionDto {
  id: string;
  workflowId: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
  effectiveFrom: string;
  effectiveTo?: string;
  changeSummary?: string;
  stages: WorkflowStageDto[];
  transitions: WorkflowTransitionDto[];
  createdAt: string;
  createdBy: string;
}

export interface WorkflowDefinitionDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  entityType: string;
  organizationType: string;
  activeVersion: number;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  versions: WorkflowVersionDto[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. WORKFLOW INSTANCE & RUNTIME STATE
// ==========================================

export interface RequirementInstanceDto {
  id: string;
  instanceId: string;
  requirementId: string;
  requirementCode: string;
  name: string;
  requirementType: WorkflowRequirementType;
  isFulfilled: boolean;
  fulfilledAt?: string;
  fulfilledBy?: string;
  data?: Record<string, any>;
  evaluationResult?: {
    passed: boolean;
    reason?: string;
    evaluatedAt: string;
  };
}

export interface WorkflowApprovalDto {
  id: string;
  instanceId: string;
  transitionId: string;
  requiredRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

export interface WorkflowTransitionLogDto {
  id: string;
  instanceId: string;
  workflowId: string;
  version: number;
  fromStageCode: string;
  toStageCode: string;
  transitionCode: string;
  actorEmail: string;
  actorRole: string;
  rulesEvaluated: {
    ruleDescription?: string;
    passed: boolean;
    details?: any;
  }[];
  requirementsEvaluated: {
    requirementCode: string;
    name: string;
    passed: boolean;
  }[];
  actionsExecuted: {
    actionType: string;
    success: boolean;
    resultSummary?: string;
  }[];
  timestamp: string;
  reason?: string;
}

export interface BlockingReasonDto {
  code: string;
  category: 'REQUIREMENT' | 'RULE' | 'APPROVAL' | 'PERMISSION';
  message: string;
  details?: Record<string, any>;
}

export interface AllowedTransitionDto {
  transition: WorkflowTransitionDto;
  targetStage: WorkflowStageDto;
  isAllowed: boolean;
  blockingReasons: BlockingReasonDto[];
}

export interface WorkflowInstanceDto {
  id: string;
  workflowId: string;
  workflowCode: string;
  workflowVersion: number;
  organizationType: string;
  entityId: string;
  entityName: string;
  currentStageId: string;
  currentStageCode: string;
  currentStageName: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
  contextData: Record<string, any>;
  requirements: RequirementInstanceDto[];
  pendingApprovals: WorkflowApprovalDto[];
  allowedTransitions: AllowedTransitionDto[];
  goLiveGateEvaluation?: {
    canGoLive: boolean;
    passedCount: number;
    totalCount: number;
    blockingReasons: BlockingReasonDto[];
  };
  auditHistory: WorkflowTransitionLogDto[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. DYNAMIC PRICING & OFFER MODELS
// ==========================================

export interface DynamicOfferDto {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  eligibilityRule: RuleExpression;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  currentUsageCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
}

export interface DynamicPricingRequestDto {
  planCode: string;
  organizationType: string;
  doctorSeats?: number;
  branchCount?: number;
  billingFrequency: 'MONTHLY' | 'ANNUAL';
  selectedAddonCodes?: string[];
  couponOfferCode?: string;
  customerContext: Record<string, any>;
}

export interface PricingLineItemDto {
  code: string;
  name: string;
  type: 'BASE_PLAN' | 'SEAT_ADDON' | 'BRANCH_ADDON' | 'CLINICAL_ADDON' | 'DISCOUNT' | 'TAX';
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface DynamicPricingCalculationDto {
  id: string;
  calculatedAt: string;
  planCode: string;
  planVersion: number;
  currency: string;
  basePrice: number;
  addonsTotal: number;
  subtotal: number;
  appliedOffer?: {
    offerCode: string;
    offerName: string;
    discountAmount: number;
    ruleDescription: string;
  };
  discountTotal: number;
  taxableAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  finalGrandTotal: number;
  lineItems: PricingLineItemDto[];
  immutableSnapshotHash: string;
}

// ==========================================
// 5. DYNAMIC LICENCE RULE MODELS
// ==========================================

export interface DynamicLicenceRuleDto {
  id: string;
  organizationType: string;
  licenceTypeCode: string;
  licenceTypeName: string;
  issuingAuthority: string;
  isMandatory: boolean;
  verificationRequired: boolean;
  expiryCheckRequired: boolean;
  warningThresholdDays: number[]; // e.g. [90, 60, 30, 7] or [120, 60, 15]
  gracePeriodDays: number;
  renewalWindowDays: number;
  status: 'ACTIVE' | 'DEPRECATED';
}
