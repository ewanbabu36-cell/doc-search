import { z } from 'zod';

export const PatientTimelineEventDtoSchema = z.object({
  id: z.string(),
  eventId: z.string().optional(),
  patientId: z.string(),
  timestamp: z.string(),
  category: z.string(),
  eventType: z.string(),
  summary: z.string(),
  title: z.string().optional(),
  details: z.string().optional(),
  status: z.string().optional(),
  department: z.string().optional(),
  actor: z.string().optional(),
  actorName: z.string().optional(),
  actorRole: z.string().optional(),
  sourceModule: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type PatientTimelineEventDto = z.infer<typeof PatientTimelineEventDtoSchema>;

export const Patient360DemographicsDtoSchema = z.object({
  patientId: z.string(),
  mrn: z.string(),
  patientCode: z.string(),
  legalName: z.string(),
  displayName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  sex: z.string(),
  status: z.string()
});

export type Patient360DemographicsDto = z.infer<typeof Patient360DemographicsDtoSchema>;

export const Patient360ContactDtoSchema = z.object({
  mobileNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  emergencyContact: z.any().optional()
});

export type Patient360ContactDto = z.infer<typeof Patient360ContactDtoSchema>;

export const Patient360PartnerLocationDtoSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  branchId: z.string(),
  locationId: z.string()
});

export type Patient360PartnerLocationDto = z.infer<typeof Patient360PartnerLocationDtoSchema>;

export const Patient360ReadModelDtoSchema = z.object({
  projectionVersion: z.number().default(1),
  generatedAt: z.string(),
  zeroState: z.boolean(),
  identity: z.record(z.unknown()),
  demographics: Patient360DemographicsDtoSchema,
  contact: Patient360ContactDtoSchema,
  partnerLocation: Patient360PartnerLocationDtoSchema,
  activeEncounters: z.array(z.record(z.unknown())).default([]),
  historicalEncounters: z.array(z.record(z.unknown())).default([]),
  appointments: z.array(z.record(z.unknown())).default([]),
  vitals: z.array(z.record(z.unknown())).default([]),
  clinicalNotes: z.array(z.record(z.unknown())).default([]),
  labOrdersResults: z.object({
    orders: z.array(z.record(z.unknown())).default([]),
    results: z.array(z.record(z.unknown())).default([])
  }).default({ orders: [], results: [] }),
  radiologyStudiesReports: z.object({
    orders: z.array(z.record(z.unknown())).default([]),
    reports: z.array(z.record(z.unknown())).default([])
  }).default({ orders: [], reports: [] }),
  prescriptions: z.array(z.record(z.unknown())).default([]),
  pharmacyEvents: z.array(z.record(z.unknown())).default([]),
  billingPaymentReferences: z.array(z.record(z.unknown())).default([]),
  workflowTasks: z.array(z.record(z.unknown())).default([])
});

export type Patient360ReadModelDto = z.infer<typeof Patient360ReadModelDtoSchema>;
