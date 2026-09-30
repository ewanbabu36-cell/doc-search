import type {
  SupportTicketDto,
  TicketCommentDto,
  PartnerHealthDto,
  SuccessCheckinDto
} from '@docsearch/api-contracts';

/**
 * Day-0 Clean Slate: Zero fake support tickets or partner checkins.
 */
export const mockSupportTickets: SupportTicketDto[] = [];
export const mockTicketComments: TicketCommentDto[] = [];
export const mockPartnerHealth: PartnerHealthDto[] = [];
export const mockSuccessCheckins: SuccessCheckinDto[] = [];
