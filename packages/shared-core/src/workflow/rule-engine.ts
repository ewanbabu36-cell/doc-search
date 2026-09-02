import type {
  RuleCondition,
  RuleExpression
} from '@docsearch/api-contracts';

export class RuleEngine {
  /**
   * Safely retrieves nested property value from object via dot-notation path (e.g. "customer.is_new", "licence.expiry_date")
   */
  public static getNestedValue(obj: Record<string, any>, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current: any = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  /**
   * Evaluates a single RuleCondition against a given context object.
   */
  public static evaluateCondition(condition: RuleCondition, context: Record<string, any>): boolean {
    const actualValue = this.getNestedValue(context, condition.field);
    const targetValue = condition.value;

    switch (condition.operator) {
      case 'EQUALS':
        return actualValue === targetValue;

      case 'NOT_EQUALS':
        return actualValue !== targetValue;

      case 'IS_TRUE':
        return actualValue === true || actualValue === 'true';

      case 'IS_FALSE':
        return actualValue === false || actualValue === 'false';

      case 'GREATER_THAN':
        return Number(actualValue) > Number(targetValue);

      case 'GREATER_THAN_OR_EQUAL':
        return Number(actualValue) >= Number(targetValue);

      case 'LESS_THAN':
        return Number(actualValue) < Number(targetValue);

      case 'LESS_THAN_OR_EQUAL':
        return Number(actualValue) <= Number(targetValue);

      case 'IN':
        if (Array.isArray(targetValue)) {
          return targetValue.includes(actualValue);
        }
        return false;

      case 'NOT_IN':
        if (Array.isArray(targetValue)) {
          return !targetValue.includes(actualValue);
        }
        return true;

      case 'CONTAINS':
        if (typeof actualValue === 'string' && typeof targetValue === 'string') {
          return actualValue.toLowerCase().includes(targetValue.toLowerCase());
        }
        if (Array.isArray(actualValue)) {
          return actualValue.includes(targetValue);
        }
        return false;

      case 'BETWEEN':
        if (condition.secondValue !== undefined) {
          const num = Number(actualValue);
          const min = Number(targetValue);
          const max = Number(condition.secondValue);
          return num >= min && num <= max;
        }
        return false;

      case 'REGEX':
        try {
          const reg = new RegExp(String(targetValue), 'i');
          return reg.test(String(actualValue ?? ''));
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Recursively evaluates a RuleExpression with AND / OR logic and nested sub-expressions.
   */
  public static evaluateExpression(expression?: RuleExpression | null, context: Record<string, any> = {}): boolean {
    if (!expression) return true; // Empty rule is considered satisfied
    if (!expression.conditions || expression.conditions.length === 0) {
      if (!expression.nestedExpressions || expression.nestedExpressions.length === 0) {
        return true;
      }
    }

    const conditionResults: boolean[] = (expression.conditions || []).map((cond: RuleCondition) =>
      this.evaluateCondition(cond, context)
    );

    const nestedResults: boolean[] = (expression.nestedExpressions || []).map((nested: RuleExpression) =>
      this.evaluateExpression(nested, context)
    );

    const allResults = [...conditionResults, ...nestedResults];
    if (allResults.length === 0) return true;

    if (expression.logicalOperator === 'OR') {
      return allResults.some((res) => res === true);
    }

    // Default: AND
    return allResults.every((res) => res === true);
  }
}
