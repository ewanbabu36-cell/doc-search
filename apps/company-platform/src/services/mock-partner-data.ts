import type {
  PartnerProfileDto,
  PartnerTransitionHistoryDto
} from '@docsearch/api-contracts';

/**
 * Day-0 Clean Slate: Zero fake partner profiles.
 * Pure Day-0 state awaiting genuine healthcare partner registrations.
 */
export const mockPartnerProfiles: PartnerProfileDto[] = [];

export const mockPartnerTransitionHistory: Record<string, PartnerTransitionHistoryDto[]> = {};
