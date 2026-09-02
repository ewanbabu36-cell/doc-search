import type { DynamicLicenceRuleDto } from '@docsearch/api-contracts';

export interface LicenceEvaluationResult {
  licenceTypeCode: string;
  isMandatory: boolean;
  isCompliant: boolean;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_SUBMITTED';
  expiryDate?: string | undefined;
  daysUntilExpiry?: number | undefined;
  activeWarningThreshold?: number | undefined;
  isInGracePeriod: boolean;
  isInRenewalWindow: boolean;
  blockingReason?: string | undefined;
}

export class LicenceEngine {
  /**
   * Evaluates organization licence compliance against dynamic rules.
   */
  public static evaluateLicences(
    organizationType: string,
    rules: DynamicLicenceRuleDto[],
    submittedLicences: Record<string, { verificationStatus: string; expiryDate?: string; licenceNumber?: string }>
  ): {
    isFullyCompliant: boolean;
    evaluations: LicenceEvaluationResult[];
    blockingReasons: string[];
  } {
    const orgRules = rules.filter(
      (r: DynamicLicenceRuleDto) => r.organizationType.toUpperCase() === organizationType.toUpperCase() && r.status === 'ACTIVE'
    );

    const evaluations: LicenceEvaluationResult[] = [];
    const blockingReasons: string[] = [];
    const today = new Date();

    for (const rule of orgRules) {
      const submitted = submittedLicences[rule.licenceTypeCode];
      const isSubmitted = !!submitted && !!submitted.licenceNumber;
      const verificationStatus = (submitted?.verificationStatus as LicenceEvaluationResult['verificationStatus']) || 'NOT_SUBMITTED';

      let daysUntilExpiry: number | undefined;
      let isExpired = false;
      let isInGracePeriod = false;
      let isInRenewalWindow = false;
      let activeWarningThreshold: number | undefined;

      if (submitted?.expiryDate) {
        const expDate = new Date(submitted.expiryDate);
        const diffMs = expDate.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          const pastDays = Math.abs(daysUntilExpiry);
          if (pastDays <= rule.gracePeriodDays) {
            isInGracePeriod = true;
          } else {
            isExpired = true;
          }
        } else {
          if (daysUntilExpiry <= rule.renewalWindowDays) {
            isInRenewalWindow = true;
          }

          // Check configurable warning thresholds (e.g. 120, 60, 15 or 90, 60, 30, 7)
          const sortedThresholds = [...rule.warningThresholdDays].sort((a, b) => a - b);
          for (const threshold of sortedThresholds) {
            if (daysUntilExpiry <= threshold) {
              activeWarningThreshold = threshold;
              break;
            }
          }
        }
      }

      let isCompliant = true;
      let blockingReason: string | undefined;

      if (rule.isMandatory) {
        if (!isSubmitted) {
          isCompliant = false;
          blockingReason = `Mandatory licence "${rule.licenceTypeName}" has not been submitted.`;
        } else if (rule.verificationRequired && verificationStatus !== 'VERIFIED') {
          isCompliant = false;
          blockingReason = `Mandatory licence "${rule.licenceTypeName}" requires regulatory verification (current: ${verificationStatus}).`;
        } else if (rule.expiryCheckRequired && isExpired && !isInGracePeriod) {
          isCompliant = false;
          blockingReason = `Mandatory licence "${rule.licenceTypeName}" expired on ${submitted?.expiryDate} and grace period (${rule.gracePeriodDays} days) has ended.`;
        }
      }

      if (blockingReason) {
        blockingReasons.push(blockingReason);
      }

      evaluations.push({
        licenceTypeCode: rule.licenceTypeCode,
        isMandatory: rule.isMandatory,
        isCompliant,
        verificationStatus,
        expiryDate: submitted?.expiryDate,
        daysUntilExpiry,
        activeWarningThreshold,
        isInGracePeriod,
        isInRenewalWindow,
        blockingReason
      });
    }

    const isFullyCompliant = evaluations.every((e: LicenceEvaluationResult) => e.isCompliant);

    return {
      isFullyCompliant,
      evaluations,
      blockingReasons
    };
  }
}
