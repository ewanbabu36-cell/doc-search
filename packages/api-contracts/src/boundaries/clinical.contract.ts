import { z } from 'zod';

/**
 * Phase 2: Partner / Clinical Platform Contract Boundaries
 * Only clinical, appointment, prescription, and patient telemetry summaries.
 */
export const ClinicalPatientLookupSchema = z.object({
  patientId: z.string().uuid().optional(),
  mrn: z.string().trim().optional(),
  nationalId: z.string().trim().optional(),
  branchId: z.string().uuid()
});

export type ClinicalPatientLookupInput = z.infer<typeof ClinicalPatientLookupSchema>;

export const ClinicalFacilityStatsSchema = z.object({
  branchId: z.string().uuid(),
  activeEncounters: z.number().int().min(0),
  waitingQueueCount: z.number().int().min(0),
  bedOccupancyRate: z.number().min(0).max(100),
  timestamp: z.string().datetime()
});

export type ClinicalFacilityStats = z.infer<typeof ClinicalFacilityStatsSchema>;
