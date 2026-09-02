import { describe, it, expect } from 'vitest';
import {
  RuleEngine,
  PricingEngine,
  LicenceEngine,
  WorkflowEngine,
  type PlanConfig
} from '../packages/shared-core/src/index.js';
import {
  SEED_WORKFLOW_DEFINITIONS,
  SEED_DYNAMIC_OFFERS,
  SEED_LICENCE_RULES
} from '../packages/database/src/index.js';
import type {
  DynamicLicenceRuleDto,
  DynamicOfferDto,
  WorkflowInstanceDto,
  WorkflowVersionDto
} from '../packages/api-contracts/src/index.js';

describe('Dynamic Configuration-Driven Workflow & Rule Engine', () => {
  // =========================================================================
  // TEST 1: Generic Rules Engine Evaluation (AST Evaluator)
  // =========================================================================
  describe('RuleEngine', () => {
    it('evaluates simple equality, comparisons, and nested objects safely', () => {
      const context = {
        customer: { is_new: true, tier: 'ENTERPRISE', score: 85 },
        subscription: { payment_status: 'PAID', amount: 50000 },
        licence: { status: 'VERIFIED', expiry_days: 140 }
      };

      // Rule: customer.is_new == true AND subscription.payment_status == 'PAID'
      const rule1 = {
        logicalOperator: 'AND' as const,
        conditions: [
          { field: 'customer.is_new', operator: 'IS_TRUE' as const },
          { field: 'subscription.payment_status', operator: 'EQUALS' as const, value: 'PAID' },
          { field: 'subscription.amount', operator: 'GREATER_THAN_OR_EQUAL' as const, value: 50000 }
        ]
      };
      expect(RuleEngine.evaluateExpression(rule1, context)).toBe(true);

      // Rule: customer.tier IN ['STARTER', 'PRO'] (should fail since tier is ENTERPRISE)
      const rule2 = {
        logicalOperator: 'AND' as const,
        conditions: [
          { field: 'customer.tier', operator: 'IN' as const, value: ['STARTER', 'PRO'] }
        ]
      };
      expect(RuleEngine.evaluateExpression(rule2, context)).toBe(false);

      // Rule: BETWEEN operator (score between 80 and 90)
      const rule3 = {
        logicalOperator: 'AND' as const,
        conditions: [
          { field: 'customer.score', operator: 'BETWEEN' as const, value: 80, secondValue: 90 }
        ]
      };
      expect(RuleEngine.evaluateExpression(rule3, context)).toBe(true);
    });
  });

  // =========================================================================
  // TEST 2: Multi-Workflow Generic Execution (Hospital, Pathology, Pharmacy)
  // =========================================================================
  describe('Multi-Workflow Generic Execution', () => {
    it('executes 3 distinct workflows (Hospital, Pathology, Pharmacy) using the exact same generic engine', async () => {
      // 1. Hospital Workflow
      const hospDef = SEED_WORKFLOW_DEFINITIONS.find((d) => d.code === 'HOSPITAL_LIFECYCLE')!;
      const hospVer = hospDef.versions[0]!;

      let hospInst: WorkflowInstanceDto = {
        id: 'INST-HOSP-TEST',
        workflowId: hospDef.id,
        workflowCode: hospDef.code,
        workflowVersion: hospVer.version,
        organizationType: 'HOSPITAL',
        entityId: 'HOSP-001',
        entityName: 'Apollo Hospital',
        currentStageId: hospVer.stages[0]!.id,
        currentStageCode: hospVer.stages[0]!.code,
        currentStageName: hospVer.stages[0]!.name,
        status: 'IN_PROGRESS',
        contextData: {},
        requirements: [],
        pendingApprovals: [],
        allowedTransitions: [],
        auditHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Fulfill Stage 1 requirement
      hospInst = WorkflowEngine.fulfillRequirement(
        hospInst,
        hospVer,
        'ENTITY_REGISTRATION_DETAILS',
        'admin@apollo.org',
        { gstin: '07AAAAA0000A1Z5' }
      );

      const allowedHosp = WorkflowEngine.evaluateAllowedTransitions(hospInst, hospVer, 'SUPER_ADMIN');
      expect(allowedHosp.length).toBeGreaterThan(0);
      expect(allowedHosp[0]!.isAllowed).toBe(true);

      const transResult = await WorkflowEngine.executeTransition(
        hospInst,
        hospVer,
        'QUALIFY_LEAD_TO_COMMERCIAL',
        { email: 'admin@docsearch.internal', role: 'SUPER_ADMIN' }
      );
      expect(transResult.success).toBe(true);
      expect(transResult.updatedInstance.currentStageCode).toBe('COMMERCIAL_OFFER');

      // 2. Pathology Workflow
      const pathDef = SEED_WORKFLOW_DEFINITIONS.find((d) => d.code === 'PATHOLOGY_LIFECYCLE')!;
      const pathVer = pathDef.versions[0]!;

      let pathInst: WorkflowInstanceDto = {
        id: 'INST-PATH-TEST',
        workflowId: pathDef.id,
        workflowCode: pathDef.code,
        workflowVersion: pathVer.version,
        organizationType: 'PATHOLOGY',
        entityId: 'PATH-001',
        entityName: 'Tata Diagnostics',
        currentStageId: pathVer.stages[0]!.id,
        currentStageCode: pathVer.stages[0]!.code,
        currentStageName: pathVer.stages[0]!.name,
        status: 'IN_PROGRESS',
        contextData: {},
        requirements: [],
        pendingApprovals: [],
        allowedTransitions: [],
        auditHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      pathInst = WorkflowEngine.fulfillRequirement(
        pathInst,
        pathVer,
        'PATHOLOGY_PROFILE_DOC',
        'admin@tata.org'
      );

      const pathTrans = await WorkflowEngine.executeTransition(
        pathInst,
        pathVer,
        'LEAD_TO_COMMERCIAL_PATH',
        { email: 'admin@docsearch.internal', role: 'SUPER_ADMIN' }
      );
      expect(pathTrans.success).toBe(true);
      expect(pathTrans.updatedInstance.currentStageCode).toBe('COMMERCIAL_OFFER');

      // 3. Pharmacy Workflow
      const pharmDef = SEED_WORKFLOW_DEFINITIONS.find((d) => d.code === 'PHARMACY_LIFECYCLE')!;
      const pharmVer = pharmDef.versions[0]!;

      let pharmInst: WorkflowInstanceDto = {
        id: 'INST-PHARM-TEST',
        workflowId: pharmDef.id,
        workflowCode: pharmDef.code,
        workflowVersion: pharmVer.version,
        organizationType: 'PHARMACY',
        entityId: 'PHARM-001',
        entityName: 'Apollo Pharmacy Store #48',
        currentStageId: pharmVer.stages[0]!.id,
        currentStageCode: pharmVer.stages[0]!.code,
        currentStageName: pharmVer.stages[0]!.name,
        status: 'IN_PROGRESS',
        contextData: {},
        requirements: [],
        pendingApprovals: [],
        allowedTransitions: [],
        auditHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const pharmTrans = await WorkflowEngine.executeTransition(
        pharmInst,
        pharmVer,
        'LEAD_TO_DRUG_LICENCE_KYC',
        { email: 'admin@docsearch.internal', role: 'SUPER_ADMIN' }
      );
      expect(pharmTrans.success).toBe(true);
      expect(pharmTrans.updatedInstance.currentStageCode).toBe('REGULATORY_COMPLIANCE');
    });
  });

  // =========================================================================
  // TEST 3: Runtime Configuration Change Test (Requirement 22)
  // =========================================================================
  describe('Runtime Configuration Change Test', () => {
    it('dynamically blocks Go-Live when a new Compliance Approval is added to configuration and unblocks when removed', () => {
      const pathDef = SEED_WORKFLOW_DEFINITIONS.find((d) => d.code === 'PATHOLOGY_LIFECYCLE')!;
      const pathVerClone: WorkflowVersionDto = JSON.parse(JSON.stringify(pathDef.versions[0]!));

      // Locate Go-Live stage
      const goLiveStage = pathVerClone.stages.find((s) => s.code === 'GO_LIVE_GATE')!;

      let inst: WorkflowInstanceDto = {
        id: 'INST-DYNAMIC-CONFIG-TEST',
        workflowId: pathDef.id,
        workflowCode: pathDef.code,
        workflowVersion: 1,
        organizationType: 'PATHOLOGY',
        entityId: 'TEST-LAB',
        entityName: 'Test Pathology Lab',
        currentStageId: goLiveStage.id,
        currentStageCode: goLiveStage.code,
        currentStageName: goLiveStage.name,
        status: 'IN_PROGRESS',
        contextData: {},
        requirements: [
          {
            id: 'R1',
            instanceId: 'INST-DYNAMIC-CONFIG-TEST',
            requirementId: 'REQ-PATH-01-01',
            requirementCode: 'PATHOLOGY_PROFILE_DOC',
            name: 'Profile',
            requirementType: 'DOCUMENT',
            isFulfilled: true
          },
          {
            id: 'R2',
            instanceId: 'INST-DYNAMIC-CONFIG-TEST',
            requirementId: 'REQ-PATH-02-01',
            requirementCode: 'PATHOLOGY_PAYMENT_PROOF',
            name: 'Payment',
            requirementType: 'PAYMENT',
            isFulfilled: true
          },
          {
            id: 'R3',
            instanceId: 'INST-DYNAMIC-CONFIG-TEST',
            requirementId: 'REQ-PATH-03-01',
            requirementCode: 'NABL_ISO_LICENCE',
            name: 'NABL Licence',
            requirementType: 'LICENCE',
            isFulfilled: true
          },
          {
            id: 'R4',
            instanceId: 'INST-DYNAMIC-CONFIG-TEST',
            requirementId: 'REQ-PATH-03-02',
            requirementCode: 'CHIEF_PATHOLOGIST_NMC',
            name: 'Chief Pathologist',
            requirementType: 'DOCUMENT',
            isFulfilled: true
          }
        ],
        pendingApprovals: [],
        allowedTransitions: [],
        auditHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Initially, all standard requirements are satisfied $\rightarrow$ canGoLive is true
      let gateEval = WorkflowEngine.evaluateGoLiveGate(inst, pathVerClone);
      expect(gateEval.canGoLive).toBe(true);
      expect(gateEval.blockingReasons.length).toBe(0);

      // DYNAMIC CONFIG CHANGE: Add a new mandatory requirement "COMPLIANCE_HEAD_SIGN_OFF"
      const complianceStage = pathVerClone.stages.find((s) => s.code === 'REGULATORY_COMPLIANCE')!;
      complianceStage.requirements.push({
        id: 'REQ-NEW-COMPLIANCE-01',
        stageId: complianceStage.id,
        requirementCode: 'COMPLIANCE_HEAD_SIGN_OFF',
        name: 'National Compliance Officer Formal Sign-off',
        requirementType: 'APPROVAL',
        configuration: { role: 'COMPLIANCE_OFFICER' },
        isRequired: true,
        order: 3,
        status: 'ACTIVE'
      });

      // Without source code changes, evaluate again: Go-Live MUST now be BLOCKED!
      gateEval = WorkflowEngine.evaluateGoLiveGate(inst, pathVerClone);
      expect(gateEval.canGoLive).toBe(false);
      expect(gateEval.blockingReasons.some((b) => b.code.includes('COMPLIANCE_HEAD_SIGN_OFF'))).toBe(true);

      // Now fulfill the new requirement
      inst = WorkflowEngine.fulfillRequirement(inst, pathVerClone, 'COMPLIANCE_HEAD_SIGN_OFF', 'officer@docsearch.gov');
      gateEval = WorkflowEngine.evaluateGoLiveGate(inst, pathVerClone);
      expect(gateEval.canGoLive).toBe(true);
    });
  });

  // =========================================================================
  // TEST 4: Dynamic Offer & Server-Side Pricing Engine (Requirement 23)
  // =========================================================================
  describe('Dynamic Offer & Pricing Engine', () => {
    it('applies dynamic offers server-side based on configurable eligibility rules and creates immutable snapshot hash', () => {
      const planConfig: PlanConfig = {
        code: 'HOSPITAL_ENTERPRISE',
        name: 'Hospital Enterprise Shield Pass',
        version: 1,
        currency: 'INR',
        baseMonthlyPriceInr: 50000,
        baseAnnualPriceInr: 500000,
        includedDoctorSeats: 25,
        additionalSeatPriceInr: 500,
        includedBranches: 1,
        additionalBranchPriceInr: 10000,
        taxRatePercent: 18
      };

      const offers: DynamicOfferDto[] = JSON.parse(JSON.stringify(SEED_DYNAMIC_OFFERS));

      // 1. New Customer gets 20% discount on NEW_HOSPITAL_20
      const quoteNew = PricingEngine.calculatePrice(
        {
          planCode: 'HOSPITAL_ENTERPRISE',
          organizationType: 'HOSPITAL',
          doctorSeats: 30, // 5 extra seats = 5 * 500 = 2500
          branchCount: 2,  // 1 extra branch = 10000
          billingFrequency: 'MONTHLY',
          couponOfferCode: 'NEW_HOSPITAL_20',
          customerContext: { is_new: true }
        },
        planConfig,
        [],
        offers
      );

      expect(quoteNew.subtotal).toBe(50000 + 2500 + 10000); // 62500
      expect(quoteNew.discountTotal).toBe(12500); // 20% of 62500
      expect(quoteNew.taxableAmount).toBe(50000);
      expect(quoteNew.taxAmount).toBe(9000); // 18% of 50000
      expect(quoteNew.finalGrandTotal).toBe(59000);
      expect(quoteNew.appliedOffer?.offerCode).toBe('NEW_HOSPITAL_20');
      expect(quoteNew.immutableSnapshotHash).toBeDefined();

      // 2. Existing Customer (is_new: false) should NOT be eligible for NEW_HOSPITAL_20
      const quoteExisting = PricingEngine.calculatePrice(
        {
          planCode: 'HOSPITAL_ENTERPRISE',
          organizationType: 'HOSPITAL',
          doctorSeats: 25,
          branchCount: 1,
          billingFrequency: 'MONTHLY',
          couponOfferCode: 'NEW_HOSPITAL_20',
          customerContext: { is_new: false }
        },
        planConfig,
        [],
        offers
      );

      expect(quoteExisting.discountTotal).toBe(0);
      expect(quoteExisting.appliedOffer).toBeUndefined();
    });
  });

  // =========================================================================
  // TEST 5: Dynamic Licence Rule & Warning Thresholds (Requirement 24)
  // =========================================================================
  describe('Dynamic Licence Engine', () => {
    it('dynamically evaluates warning thresholds when configured from 90/60/30 to 120/60/15', () => {
      const rules: DynamicLicenceRuleDto[] = JSON.parse(JSON.stringify(SEED_LICENCE_RULES));
      const hospRule = rules.find((r) => r.organizationType === 'HOSPITAL' && r.licenceTypeCode === 'HOSPITAL_CEA')!;

      // Case A: Standard threshold [90, 60, 30, 7] with licence expiring in 110 days (No warning yet)
      const future110Days = new Date(Date.now() + 110 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      let evalA = LicenceEngine.evaluateLicences('HOSPITAL', rules, {
        HOSPITAL_CEA: {
          licenceNumber: 'CEA-DL-2026',
          verificationStatus: 'VERIFIED',
          expiryDate: future110Days
        }
      });
      expect(evalA.evaluations[0]!.activeWarningThreshold).toBeUndefined();

      // Case B: DYNAMIC CONFIG CHANGE: Change warning threshold to [120, 60, 15]
      hospRule.warningThresholdDays = [120, 60, 15];

      // Re-evaluate: Now 110 days is within the 120-day warning window!
      let evalB = LicenceEngine.evaluateLicences('HOSPITAL', rules, {
        HOSPITAL_CEA: {
          licenceNumber: 'CEA-DL-2026',
          verificationStatus: 'VERIFIED',
          expiryDate: future110Days
        }
      });
      expect(evalB.evaluations[0]!.activeWarningThreshold).toBe(120);
    });
  });
});
