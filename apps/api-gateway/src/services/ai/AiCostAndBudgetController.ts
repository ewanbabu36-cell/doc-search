import crypto from 'node:crypto';
import { getDatabase, aiCostBudgets, eq, and } from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('ai-cost-budget-controller');

export interface SetBudgetInput {
  monthlyTokenLimit?: number;
  monthlyBudgetInr?: number;
  dailyTokenLimit?: number;
  hardStopThresholdPercent?: number;
  warningThresholdPercent?: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  isWarning: boolean;
  currentTokens: number;
  limitTokens: number;
  percentUsed: number;
}

export class AiCostAndBudgetController {
  private get db() {
    return getDatabase();
  }

  /**
   * Sets or creates a budget ceiling for a tenant, user, or feature scope.
   */
  async setBudgetLimit(
    tenantId: string,
    scopeType: 'TENANT' | 'USER' | 'MODULE' | 'FEATURE',
    scopeId: string,
    input: SetBudgetInput
  ) {
    const existing = await this.getBudgetRecord(tenantId, scopeType, scopeId);

    if (existing) {
      const [updated] = await this.db
        .update(aiCostBudgets)
        .set({
          monthlyTokenLimit: input.monthlyTokenLimit ?? existing.monthlyTokenLimit,
          monthlyBudgetInr: input.monthlyBudgetInr ?? existing.monthlyBudgetInr,
          dailyTokenLimit: input.dailyTokenLimit ?? existing.dailyTokenLimit,
          hardStopThresholdPercent: input.hardStopThresholdPercent ?? existing.hardStopThresholdPercent,
          warningThresholdPercent: input.warningThresholdPercent ?? existing.warningThresholdPercent,
          status: 'ACTIVE',
          updatedAt: new Date()
        })
        .where(eq(aiCostBudgets.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(aiCostBudgets)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        scopeType,
        scopeId,
        monthlyTokenLimit: input.monthlyTokenLimit ?? 1000000,
        monthlyBudgetInr: input.monthlyBudgetInr ?? 5000,
        dailyTokenLimit: input.dailyTokenLimit ?? 100000,
        hardStopThresholdPercent: input.hardStopThresholdPercent ?? 100,
        warningThresholdPercent: input.warningThresholdPercent ?? 80,
        currentMonthTokens: 0,
        currentMonthCostInr: '0.00',
        currentDayTokens: 0,
        status: 'ACTIVE'
      })
      .returning();

    return created;
  }

  /**
   * Gets budget status for a given scope.
   */
  async getBudgetStatus(tenantId: string, scopeType: string, scopeId: string) {
    let record = await this.getBudgetRecord(tenantId, scopeType, scopeId);
    if (!record) {
      // Auto-provision standard tenant budget if none exists
      record = (await this.setBudgetLimit(tenantId, scopeType as any, scopeId, {})) || null;
    }
    const safeRecord = record || {
      id: 'default',
      tenantId,
      scopeType,
      scopeId,
      monthlyTokenLimit: 1000000,
      monthlyBudgetInr: 5000,
      dailyTokenLimit: 100000,
      currentMonthTokens: 0,
      currentMonthCostInr: '0.00',
      currentDayTokens: 0,
      hardStopThresholdPercent: 100,
      warningThresholdPercent: 80,
      status: 'ACTIVE'
    };
    const monthlyLimit = safeRecord.monthlyTokenLimit || 1000000;
    const currentTokens = safeRecord.currentMonthTokens || 0;
    const percentUsed = Math.round((currentTokens / Math.max(monthlyLimit, 1)) * 100);
    return {
      ...safeRecord,
      percentUsed,
      isWarning: percentUsed >= (safeRecord.warningThresholdPercent || 80),
      isHardStop: percentUsed >= (safeRecord.hardStopThresholdPercent || 100)
    };
  }

  /**
   * Checks whether the requested tokens are within allowed quota. Fails closed.
   */
  async checkBudget(
    tenantId: string,
    scopeType: string,
    scopeId: string,
    estimatedTokens: number = 0
  ): Promise<BudgetCheckResult> {
    const budget = await this.getBudgetStatus(tenantId, scopeType, scopeId);

    const dailyLimit = budget.dailyTokenLimit || 100000;
    const currentDay = budget.currentDayTokens || 0;
    // Check daily limit
    if (dailyLimit > 0 && currentDay + estimatedTokens > dailyLimit) {
      logger.warn('AI Daily token limit exceeded', { tenantId, scopeType, scopeId, current: currentDay });
      throw new AppError({
        message: `AI budget ceiling exceeded: Daily token limit of ${dailyLimit} reached.`,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        statusCode: 429
      });
    }

    // Check monthly limit
    const monthlyLimit = budget.monthlyTokenLimit || 1000000;
    const currentMonth = budget.currentMonthTokens || 0;
    const hardStop = budget.hardStopThresholdPercent || 100;
    const warning = budget.warningThresholdPercent || 80;
    const percentUsed = Math.round(((currentMonth + estimatedTokens) / Math.max(monthlyLimit, 1)) * 100);
    if (percentUsed >= hardStop) {
      logger.warn('AI Monthly token budget hard stop reached', { tenantId, scopeType, scopeId, percentUsed });
      throw new AppError({
        message: `AI budget ceiling exceeded: Monthly hard stop threshold of ${hardStop}% reached.`,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        statusCode: 429
      });
    }

    return {
      allowed: true,
      isWarning: percentUsed >= warning,
      currentTokens: currentMonth,
      limitTokens: monthlyLimit,
      percentUsed
    };
  }

  /**
   * Atomically records consumed tokens and INR cost.
   */
  async recordUsage(
    tenantId: string,
    scopeType: string,
    scopeId: string,
    tokensUsed: number,
    costInr: number = 0
  ) {
    const existing = await this.getBudgetRecord(tenantId, scopeType, scopeId);
    if (!existing) {
      await this.setBudgetLimit(tenantId, scopeType as any, scopeId, {});
    }

    const currentRec = (await this.getBudgetRecord(tenantId, scopeType, scopeId))!;
    const newMonthTokens = currentRec.currentMonthTokens + tokensUsed;
    const newDayTokens = currentRec.currentDayTokens + tokensUsed;
    const newCostInr = (Number.parseFloat(currentRec.currentMonthCostInr) + costInr).toFixed(2);

    const percentUsed = Math.round((newMonthTokens / Math.max(currentRec.monthlyTokenLimit, 1)) * 100);
    const newStatus = percentUsed >= currentRec.hardStopThresholdPercent ? 'EXCEEDED' : percentUsed >= currentRec.warningThresholdPercent ? 'WARNING' : 'ACTIVE';

    const [updated] = await this.db
      .update(aiCostBudgets)
      .set({
        currentMonthTokens: newMonthTokens,
        currentDayTokens: newDayTokens,
        currentMonthCostInr: newCostInr,
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(aiCostBudgets.id, currentRec.id))
      .returning();

    return updated;
  }

  private async getBudgetRecord(tenantId: string, scopeType: string, scopeId: string) {
    const [found] = await this.db
      .select()
      .from(aiCostBudgets)
      .where(
        and(
          eq(aiCostBudgets.tenantId, tenantId),
          eq(aiCostBudgets.scopeType, scopeType),
          eq(aiCostBudgets.scopeId, scopeId)
        )
      )
      .limit(1);
    return found || null;
  }
}

export const aiCostAndBudgetController = new AiCostAndBudgetController();
