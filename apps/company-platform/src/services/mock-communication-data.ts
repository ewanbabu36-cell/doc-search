import type {
  ContentItemDto,
  NotificationTemplateDto,
  DispatchRecordDto
} from '@docsearch/api-contracts';

export const mockContentItems: ContentItemDto[] = [];

export const mockNotificationTemplates: NotificationTemplateDto[] = [
  {
    id: 'tmpl-001',
    code: 'PARTNER_ONBOARDING_INVITATION',
    name: 'Healthcare Partner Onboarding Invitation',
    channel: 'EMAIL_NOTIFICATION',
    subjectTemplate: 'Welcome to Doc Search — Complete Onboarding for {{partnerName}}',
    bodyTemplate: 'Dear {{primaryContactName}}, please complete your registration at {{onboardingLink}}.',
    variables: ['partnerName', 'primaryContactName', 'onboardingLink'],
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const mockDispatchRecords: DispatchRecordDto[] = [];
