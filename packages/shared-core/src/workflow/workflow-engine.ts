import type {
  ActionDefinitionDto,
  AllowedTransitionDto,
  BlockingReasonDto,
  RequirementInstanceDto,
  StageRequirementDto,
  WorkflowApprovalDto,
  WorkflowInstanceDto,
  WorkflowStageDto,
  WorkflowTransitionDto,
  WorkflowTransitionLogDto,
  WorkflowVersionDto
} from '@docsearch/api-contracts';
import { RuleEngine } from './rule-engine.js';

export type ActionHandler = (
  action: ActionDefinitionDto,
  instance: WorkflowInstanceDto,
  context: Record<string, any>
) => Promise<{ success: boolean; summary?: string }>;

export class WorkflowEngine {
  /**
   * Evaluates all possible transitions from the current stage and checks whether they are allowed.
   */
  public static evaluateAllowedTransitions(
    instance: WorkflowInstanceDto,
    version: WorkflowVersionDto,
    actorRole?: string
  ): AllowedTransitionDto[] {
    const currentStage = version.stages.find((s: WorkflowStageDto) => s.id === instance.currentStageId || s.code === instance.currentStageCode);
    if (!currentStage) return [];

    const outgoingTransitions = version.transitions.filter(
      (t: WorkflowTransitionDto) => t.fromStageId === currentStage.id && t.status === 'ACTIVE'
    );

    const results: AllowedTransitionDto[] = [];

    for (const transition of outgoingTransitions) {
      const targetStage = version.stages.find((s: WorkflowStageDto) => s.id === transition.toStageId);
      if (!targetStage) continue;

      const blockingReasons: BlockingReasonDto[] = [];

      // 1. Check Permissions
      if (transition.requiredPermissions && transition.requiredPermissions.length > 0 && actorRole) {
        const hasPermission = transition.requiredPermissions.includes(actorRole) || actorRole === 'SUPER_ADMIN';
        if (!hasPermission) {
          blockingReasons.push({
            code: 'PERMISSION_DENIED',
            category: 'PERMISSION',
            message: `Actor role "${actorRole}" lacks required permission for transition "${transition.name}". Required: [${transition.requiredPermissions.join(', ')}]`
          });
        }
      }

      // 2. Check Pending Approvals
      if (transition.approvalRequired && transition.requiredApprovalRoles) {
        for (const role of transition.requiredApprovalRoles) {
          const approval = instance.pendingApprovals.find(
            (a: WorkflowApprovalDto) => a.transitionId === transition.id && a.requiredRole === role
          );
          if (!approval || approval.status !== 'APPROVED') {
            blockingReasons.push({
              code: 'APPROVAL_REQUIRED',
              category: 'APPROVAL',
              message: `Approval by "${role}" is required for transition "${transition.name}" (Status: ${approval?.status || 'NOT_SUBMITTED'}).`
            });
          }
        }
      }

      // 3. Check Current Stage Mandatory Requirements
      const currentRequirements = currentStage.requirements.filter((r: StageRequirementDto) => r.isRequired && r.status === 'ACTIVE');
      for (const req of currentRequirements) {
        const reqInstance = instance.requirements.find(
          (ri: RequirementInstanceDto) => ri.requirementId === req.id || ri.requirementCode === req.requirementCode
        );

        if (!reqInstance || !reqInstance.isFulfilled) {
          blockingReasons.push({
            code: `REQ_UNFULFILLED_${req.requirementCode}`,
            category: 'REQUIREMENT',
            message: `Mandatory requirement "${req.name}" has not been fulfilled.`
          });
        } else if (req.validationRule) {
          // Evaluate dynamic rule on requirement data
          const evalContext = {
            ...instance.contextData,
            requirement: reqInstance.data || {}
          };
          const isRuleValid = RuleEngine.evaluateExpression(req.validationRule, evalContext);
          if (!isRuleValid) {
            blockingReasons.push({
              code: `REQ_RULE_FAILED_${req.requirementCode}`,
              category: 'RULE',
              message: `Validation rule failed for requirement "${req.name}".`
            });
          }
        }
      }

      // 4. Check Transition Conditions Rule
      if (transition.conditions) {
        const isConditionValid = RuleEngine.evaluateExpression(transition.conditions, instance.contextData);
        if (!isConditionValid) {
          blockingReasons.push({
            code: 'TRANSITION_RULE_FAILED',
            category: 'RULE',
            message: `Transition rule expression evaluation failed for "${transition.name}".`
          });
        }
      }

      results.push({
        transition,
        targetStage,
        isAllowed: blockingReasons.length === 0,
        blockingReasons
      });
    }

    return results;
  }

  /**
   * Evaluates the dynamic Go-Live Gate for a workflow instance.
   */
  public static evaluateGoLiveGate(
    instance: WorkflowInstanceDto,
    version: WorkflowVersionDto
  ): {
    canGoLive: boolean;
    passedCount: number;
    totalCount: number;
    blockingReasons: BlockingReasonDto[];
  } {
    const blockingReasons: BlockingReasonDto[] = [];
    let passedCount = 0;
    let totalCount = 0;

    // Check all mandatory requirements across completed and current stages
    const currentStage = version.stages.find((s: WorkflowStageDto) => s.id === instance.currentStageId || s.code === instance.currentStageCode);
    const activeStages = version.stages.filter((s: WorkflowStageDto) => s.sequence <= (currentStage?.sequence || 99));

    for (const stage of activeStages) {
      for (const req of stage.requirements.filter((r: StageRequirementDto) => r.isRequired && r.status === 'ACTIVE')) {
        totalCount++;
        const reqInstance = instance.requirements.find(
          (ri: RequirementInstanceDto) => ri.requirementId === req.id || ri.requirementCode === req.requirementCode
        );

        if (reqInstance && reqInstance.isFulfilled) {
          passedCount++;
        } else {
          blockingReasons.push({
            code: `GO_LIVE_REQ_${req.requirementCode}`,
            category: 'REQUIREMENT',
            message: `Go-Live Gate: Stage "${stage.name}" requires "${req.name}".`
          });
        }
      }
    }

    return {
      canGoLive: blockingReasons.length === 0 && (currentStage?.stageType === 'GO_LIVE_GATE' || currentStage?.stageType === 'ACTIVE'),
      passedCount,
      totalCount,
      blockingReasons
    };
  }

  /**
   * Executes a state transition, evaluating rules, actions, and producing an audit log.
   */
  public static async executeTransition(
    instance: WorkflowInstanceDto,
    version: WorkflowVersionDto,
    transitionCode: string,
    actor: { email: string; role: string },
    inputData: Record<string, any> = {},
    actionDispatcher?: ActionHandler
  ): Promise<{
    success: boolean;
    updatedInstance: WorkflowInstanceDto;
    auditLog: WorkflowTransitionLogDto;
    error?: string;
  }> {
    const allowedTransitions = this.evaluateAllowedTransitions(instance, version, actor.role);
    const targetTransitionItem = allowedTransitions.find(
      (at) => at.transition.transitionCode === transitionCode
    );

    if (!targetTransitionItem) {
      throw new Error(`Transition "${transitionCode}" is not a valid transition from stage "${instance.currentStageCode}".`);
    }

    if (!targetTransitionItem.isAllowed) {
      const errorMsg = targetTransitionItem.blockingReasons.map((b: BlockingReasonDto) => b.message).join(' | ');
      throw new Error(`Cannot execute transition "${transitionCode}": ${errorMsg}`);
    }

    const { transition, targetStage } = targetTransitionItem;

    // Merge context data
    const updatedContextData = {
      ...instance.contextData,
      ...inputData
    };

    // Execute configured actions
    const actionsExecuted: WorkflowTransitionLogDto['actionsExecuted'] = [];
    if (transition.actions && transition.actions.length > 0 && actionDispatcher) {
      const sortedActions = [...transition.actions].sort((a, b) => a.executionOrder - b.executionOrder);
      for (const action of sortedActions) {
        try {
          const res = await actionDispatcher(action, instance, updatedContextData);
          actionsExecuted.push({
            actionType: action.actionType,
            success: res.success,
            resultSummary: res.summary
          });
          if (!res.success && !action.continueOnError) {
            throw new Error(`Action "${action.name}" failed: ${res.summary}`);
          }
        } catch (actErr: any) {
          actionsExecuted.push({
            actionType: action.actionType,
            success: false,
            resultSummary: actErr.message
          });
          if (!action.continueOnError) {
            throw actErr;
          }
        }
      }
    }

    const fromStageCode = instance.currentStageCode;
    const toStageCode = targetStage.code;

    // Build Audit Log
    const auditLog: WorkflowTransitionLogDto = {
      id: `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      instanceId: instance.id,
      workflowId: instance.workflowId,
      version: instance.workflowVersion,
      fromStageCode,
      toStageCode,
      transitionCode: transition.transitionCode,
      actorEmail: actor.email,
      actorRole: actor.role,
      rulesEvaluated: [
        {
          ruleDescription: transition.conditions?.description || `Transition ${transition.name} condition rules`,
          passed: true
        }
      ],
      requirementsEvaluated: targetStage.requirements.map((r: StageRequirementDto) => ({
        requirementCode: r.requirementCode,
        name: r.name,
        passed: true
      })),
      actionsExecuted,
      timestamp: new Date().toISOString(),
      reason: inputData['reason'] || `Transitioned from ${fromStageCode} to ${toStageCode} by ${actor.email}`
    };

    // Update instance
    const updatedInstance: WorkflowInstanceDto = {
      ...instance,
      currentStageId: targetStage.id,
      currentStageCode: targetStage.code,
      currentStageName: targetStage.name,
      status: targetStage.isTerminal ? 'COMPLETED' : 'IN_PROGRESS',
      contextData: updatedContextData,
      auditHistory: [auditLog, ...instance.auditHistory],
      updatedAt: new Date().toISOString()
    };

    // Recalculate allowed transitions & Go-Live Gate
    updatedInstance.allowedTransitions = this.evaluateAllowedTransitions(updatedInstance, version, actor.role);
    updatedInstance.goLiveGateEvaluation = this.evaluateGoLiveGate(updatedInstance, version);

    return {
      success: true,
      updatedInstance,
      auditLog
    };
  }

  /**
   * Fulfills or uploads data for a specific stage requirement.
   */
  public static fulfillRequirement(
    instance: WorkflowInstanceDto,
    version: WorkflowVersionDto,
    requirementCode: string,
    actorEmail: string,
    data: Record<string, any> = {}
  ): WorkflowInstanceDto {
    const existingReq = instance.requirements.find((r: RequirementInstanceDto) => r.requirementCode === requirementCode);

    let updatedReqs: RequirementInstanceDto[];
    if (existingReq) {
      updatedReqs = instance.requirements.map((r: RequirementInstanceDto) =>
        r.requirementCode === requirementCode
          ? {
              ...r,
              isFulfilled: true,
              fulfilledAt: new Date().toISOString(),
              fulfilledBy: actorEmail,
              data: { ...r.data, ...data },
              evaluationResult: { passed: true, evaluatedAt: new Date().toISOString() }
            }
          : r
      );
    } else {
      updatedReqs = [
        ...instance.requirements,
        {
          id: `RI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          instanceId: instance.id,
          requirementId: `REQ-${requirementCode}`,
          requirementCode,
          name: requirementCode,
          requirementType: 'CUSTOM',
          isFulfilled: true,
          fulfilledAt: new Date().toISOString(),
          fulfilledBy: actorEmail,
          data,
          evaluationResult: { passed: true, evaluatedAt: new Date().toISOString() }
        }
      ];
    }

    const updatedInstance: WorkflowInstanceDto = {
      ...instance,
      requirements: updatedReqs,
      contextData: {
        ...instance.contextData,
        [`req_${requirementCode}`]: data
      },
      updatedAt: new Date().toISOString()
    };

    updatedInstance.allowedTransitions = this.evaluateAllowedTransitions(updatedInstance, version);
    updatedInstance.goLiveGateEvaluation = this.evaluateGoLiveGate(updatedInstance, version);

    return updatedInstance;
  }
}
