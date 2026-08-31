import { z } from 'zod';

export const FhirResourceSchema = z.object({
  resourceType: z.enum([
    'Patient',
    'Observation',
    'DiagnosticReport',
    'ServiceRequest',
    'MedicationRequest',
    'Encounter'
  ]),
  id: z.string().min(1),
  meta: z.object({
    versionId: z.string().optional(),
    lastUpdated: z.string().optional()
  }).optional(),
  identifier: z.array(
    z.object({
      system: z.string().optional(),
      value: z.string().min(1)
    })
  ).optional()
}).passthrough();

export const FhirBundleSchema = z.object({
  resourceType: z.literal('Bundle'),
  type: z.enum(['transaction', 'batch', 'collection', 'document', 'message']),
  entry: z.array(
    z.object({
      fullUrl: z.string().optional(),
      resource: FhirResourceSchema
    })
  ).min(1)
});

export type FhirResourceDto = z.infer<typeof FhirResourceSchema>;
export type FhirBundleDto = z.infer<typeof FhirBundleSchema>;
