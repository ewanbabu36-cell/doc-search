import { z } from 'zod';
import type { AiToolDefinition } from './types.js';

export class AiToolRegistry {
  private tools: Map<string, AiToolDefinition<unknown, unknown>> = new Map();

  constructor() {
    this.registerBaselineTools();
  }

  private registerBaselineTools(): void {
    // -------------------------------------------------------------------------
    // 1. Foundation Tools
    // -------------------------------------------------------------------------
    const getPatientVitalsTool: AiToolDefinition<
      { patientMrn: string },
      {
        patientMrn: string;
        respiratoryRate: number;
        spO2Pct: number;
        systolicBp: number;
        pulseRate: number;
        temperatureCelsius: number;
        consciousnessLevel: string;
      }
    > = {
      id: 'get_patient_vitals',
      name: 'Get Patient Vitals',
      description: 'Fetches physiological vital signs for a given patient MRN within caller branch',
      actionClassification: 'READ',
      inputSchema: z.object({
        patientMrn: z.string().min(1)
      }),
      outputSchema: z.object({
        patientMrn: z.string(),
        respiratoryRate: z.number(),
        spO2Pct: z.number(),
        systolicBp: z.number(),
        pulseRate: z.number(),
        temperatureCelsius: z.number(),
        consciousnessLevel: z.string()
      }),
      requiredPermission: 'ai_copilot:sepsis:evaluate',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['SEPSIS_EARLY_WARNING_CDSS', 'CLINICAL_AMBIENT_SCRIBE', 'NURSE_PATIENT_PREPARATION'],
      humanApprovalRequired: false,
      auditRequired: false,
      handler: async (_context, input) => {
        return {
          patientMrn: input.patientMrn,
          respiratoryRate: 24,
          spO2Pct: 91,
          systolicBp: 88,
          pulseRate: 118,
          temperatureCelsius: 38.9,
          consciousnessLevel: 'VOICE'
        };
      }
    };

    const lookupDrugInteractionsTool: AiToolDefinition<
      { patientMrn: string; activeMedications: string[]; newMedication: string },
      {
        severityLevel: string;
        clinicalConsequence: string;
        mechanism: string;
        recommendedManagement: string;
        evidenceReference: string;
      }
    > = {
      id: 'lookup_drug_interactions',
      name: 'Lookup Drug Interactions',
      description: 'Checks interaction severity between active patient medications and candidate medication',
      actionClassification: 'SUGGEST',
      inputSchema: z.object({
        patientMrn: z.string().min(1),
        activeMedications: z.array(z.string()),
        newMedication: z.string().min(1)
      }),
      outputSchema: z.object({
        severityLevel: z.string(),
        clinicalConsequence: z.string(),
        mechanism: z.string(),
        recommendedManagement: z.string(),
        evidenceReference: z.string()
      }),
      requiredPermission: 'ai_copilot:ddi:evaluate',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['DRUG_INTERACTION_CDSS', 'PHARMACY_PRESCRIPTION_ASSISTANCE'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, input) => {
        const hasWarfarin = input.activeMedications.some((m) =>
          m.toLowerCase().includes('warfarin')
        );
        const isClarithro = input.newMedication.toLowerCase().includes('clarithromycin');

        if (hasWarfarin && isClarithro) {
          return {
            severityLevel: 'CONTRAINDICATED_FATAL',
            clinicalConsequence: 'Severe risk of upper GI hemorrhage and INR elevation (>8.0)',
            mechanism: 'Potent CYP3A4 and CYP2C9 inhibition reduces Warfarin clearance significantly',
            recommendedManagement: 'Strictly avoid combination. Prescribe alternative macrolide (Azithromycin)',
            evidenceReference: 'CDSS Formulary Monograph v4.2'
          };
        }

        return {
          severityLevel: 'MINOR_CAUTION',
          clinicalConsequence: 'No major adverse pharmacodynamic interaction identified',
          mechanism: 'Standard metabolic pathway clearance',
          recommendedManagement: 'Routine monitoring advised',
          evidenceReference: 'CDSS Formulary Monograph v4.2'
        };
      }
    };

    const getClinicalTranscriptTool: AiToolDefinition<
      { encounterId: string; patientMrn: string },
      { encounterId: string; patientMrn: string; transcriptText: string; durationSeconds: number }
    > = {
      id: 'get_clinical_transcript',
      name: 'Get Clinical Transcript',
      description: 'Fetches ambient recorded audio transcript snippet for encounter analysis',
      actionClassification: 'READ',
      inputSchema: z.object({
        encounterId: z.string().min(1),
        patientMrn: z.string().min(1)
      }),
      outputSchema: z.object({
        encounterId: z.string(),
        patientMrn: z.string(),
        transcriptText: z.string(),
        durationSeconds: z.number()
      }),
      requiredPermission: 'ai_copilot:soap:generate',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['CLINICAL_AMBIENT_SCRIBE', 'DOCTOR_CLINICAL_DOCUMENTATION'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, input) => {
        return {
          encounterId: input.encounterId,
          patientMrn: input.patientMrn,
          transcriptText:
            'Doctor: Hello patient, what brings you in today? Patient: Shortness of breath and ankle swelling for 3 weeks.',
          durationSeconds: 180
        };
      }
    };

    const lookupCriticalLabValuesTool: AiToolDefinition<
      { patientMrn: string },
      {
        patientMrn: string;
        alerts: Array<{
          testName: string;
          measuredValue: string;
          panicThreshold: string;
          urgencyLevel: string;
        }>;
      }
    > = {
      id: 'lookup_critical_lab_values',
      name: 'Lookup Critical Lab Values',
      description: 'Retrieves emergency STAT diagnostic panic lab thresholds',
      actionClassification: 'READ',
      inputSchema: z.object({
        patientMrn: z.string().min(1)
      }),
      outputSchema: z.object({
        patientMrn: z.string(),
        alerts: z.array(
          z.object({
            testName: z.string(),
            measuredValue: z.string(),
            panicThreshold: z.string(),
            urgencyLevel: z.string()
          })
        )
      }),
      requiredPermission: 'ai_copilot:panic:read',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['DIAGNOSTIC_PANIC_ALERT'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, input) => {
        return {
          patientMrn: input.patientMrn,
          alerts: [
            {
              testName: 'High Sensitivity Cardiac Troponin I (hs-cTnI)',
              measuredValue: '1840 ng/L',
              panicThreshold: '> 100 ng/L',
              urgencyLevel: 'CRITICAL_LIFE_THREAT'
            }
          ]
        };
      }
    };

    // -------------------------------------------------------------------------
    // 2. Role-Specific Tools (Owner -> Patient)
    // -------------------------------------------------------------------------

    // ROLE-1: OWNER TOOL
    const getOwnerRevenueSummaryTool: AiToolDefinition<
      { period?: string | undefined },
      { totalRevenueGross: number; totalCollections: number; pendingClaimsAmount: number; activePatientsCount: number }
    > = {
      id: 'get_owner_revenue_summary',
      name: 'Get Owner Revenue Summary',
      description: 'Returns executive-level aggregated monthly revenue, collections, and financial KPIs',
      actionClassification: 'READ',
      inputSchema: z.object({
        period: z.string().optional()
      }),
      outputSchema: z.object({
        totalRevenueGross: z.number(),
        totalCollections: z.number(),
        pendingClaimsAmount: z.number(),
        activePatientsCount: z.number()
      }),
      requiredPermission: 'billing:invoices:read',
      tenantScoped: true,
      branchScoped: false,
      allowedCapabilities: ['OWNER_REVENUE_INTELLIGENCE', 'OWNER_ORGANIZATION_ANALYTICS'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, _input) => {
        return {
          totalRevenueGross: 4850000,
          totalCollections: 4120000,
          pendingClaimsAmount: 730000,
          activePatientsCount: 1420
        };
      }
    };

    // ROLE-2: MANAGER TOOL
    const getManagerOperationsSummaryTool: AiToolDefinition<
      { branchId?: string | undefined },
      { scheduledAppointmentsCount: number; currentBedOccupancyPct: number; emergencyTriageQueueLength: number; averageWaitTimeMinutes: number }
    > = {
      id: 'get_manager_operations_summary',
      name: 'Get Manager Operations Summary',
      description: 'Returns daily operational volume, bed occupancy rates, and facility queue status',
      actionClassification: 'READ',
      inputSchema: z.object({
        branchId: z.string().optional()
      }),
      outputSchema: z.object({
        scheduledAppointmentsCount: z.number(),
        currentBedOccupancyPct: z.number(),
        emergencyTriageQueueLength: z.number(),
        averageWaitTimeMinutes: z.number()
      }),
      requiredPermission: 'clinical:encounters:read',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['MANAGER_OPERATIONAL_OVERVIEW', 'MANAGER_INVENTORY_ALERTS'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, _input) => {
        return {
          scheduledAppointmentsCount: 84,
          currentBedOccupancyPct: 78.5,
          emergencyTriageQueueLength: 4,
          averageWaitTimeMinutes: 14.2
        };
      }
    };

    // ROLE-3: DOCTOR TOOL
    const getPatientClinicalHistoryTool: AiToolDefinition<
      { patientMrn: string },
      { patientMrn: string; chronicConditions: string[]; recentConsultations: Array<{ encounterDate: string; diagnosis: string; attendingDoctor: string }> }
    > = {
      id: 'get_patient_clinical_history',
      name: 'Get Patient Clinical History',
      description: 'Returns longitudinal consultation records, past medical conditions, and diagnosis timeline',
      actionClassification: 'READ',
      inputSchema: z.object({
        patientMrn: z.string().min(1)
      }),
      outputSchema: z.object({
        patientMrn: z.string(),
        chronicConditions: z.array(z.string()),
        recentConsultations: z.array(
          z.object({
            encounterDate: z.string(),
            diagnosis: z.string(),
            attendingDoctor: z.string()
          })
        )
      }),
      requiredPermission: 'clinical:consultations:read',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['DOCTOR_ENCOUNTER_SUMMARY', 'DOCTOR_CLINICAL_DOCUMENTATION'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, input) => {
        return {
          patientMrn: input.patientMrn,
          chronicConditions: ['Essential Hypertension (I10)', 'Type 2 Diabetes Mellitus (E11.9)'],
          recentConsultations: [
            {
              encounterDate: '2026-08-14',
              diagnosis: 'Hypertensive Heart Disease with early diastolic dysfunction',
              attendingDoctor: 'Dr. Amit Sen, MD'
            }
          ]
        };
      }
    };

    // ROLE-4: NURSE TOOL
    const getNurseCareChecklistTool: AiToolDefinition<
      { patientMrn: string },
      { patientMrn: string; bedNumber: string; vitalsDue: boolean; careTasks: string[] }
    > = {
      id: 'get_nurse_care_checklist',
      name: 'Get Nurse Care Checklist',
      description: 'Returns inpatient care bundle tasks, upcoming vitals schedule, and nursing checklist',
      actionClassification: 'READ',
      inputSchema: z.object({
        patientMrn: z.string().min(1)
      }),
      outputSchema: z.object({
        patientMrn: z.string(),
        bedNumber: z.string(),
        vitalsDue: z.boolean(),
        careTasks: z.array(z.string())
      }),
      requiredPermission: 'clinical:vitals:read',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['NURSE_PATIENT_PREPARATION'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, input) => {
        return {
          patientMrn: input.patientMrn,
          bedNumber: 'ICU-Bed-04',
          vitalsDue: true,
          careTasks: ['Measure q4h Vitals', 'Administer 09:00 IV Ceftriaxone', 'Check Blood Glucose']
        };
      }
    };

    // ROLE-5: RECEPTION TOOL
    const getReceptionQueueScheduleTool: AiToolDefinition<
      { department?: string | undefined },
      { availableSlots: Array<{ doctorName: string; timeSlot: string }>; activeQueueWaitingCount: number }
    > = {
      id: 'get_reception_queue_schedule',
      name: 'Get Reception Queue & Doctor Schedules',
      description: 'Returns available doctor appointment slots and waiting room queue length',
      actionClassification: 'READ',
      inputSchema: z.object({
        department: z.string().optional()
      }),
      outputSchema: z.object({
        availableSlots: z.array(
          z.object({
            doctorName: z.string(),
            timeSlot: z.string()
          })
        ),
        activeQueueWaitingCount: z.number()
      }),
      requiredPermission: 'appointments:read',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['RECEPTION_APPOINTMENT_ASSISTANCE', 'RECEPTION_PATIENT_REGISTRATION'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, _input) => {
        return {
          availableSlots: [
            { doctorName: 'Dr. Amit Sen (Cardiology)', timeSlot: '11:30 AM' },
            { doctorName: 'Dr. Priya Sharma (Internal Medicine)', timeSlot: '12:15 PM' }
          ],
          activeQueueWaitingCount: 6
        };
      }
    };

    // ROLE-6: PHARMACY TOOL
    const getPharmacyInventoryStatusTool: AiToolDefinition<
      { drugName?: string | undefined },
      { items: Array<{ drugName: string; availableStock: number; batchNumber: string; isNearExpiry: boolean }> }
    > = {
      id: 'get_pharmacy_inventory_status',
      name: 'Get Pharmacy Inventory Status',
      description: 'Returns pharmacy formulary stock quantities, batch numbers, and expiry alerts',
      actionClassification: 'READ',
      inputSchema: z.object({
        drugName: z.string().optional()
      }),
      outputSchema: z.object({
        items: z.array(
          z.object({
            drugName: z.string(),
            availableStock: z.number(),
            batchNumber: z.string(),
            isNearExpiry: z.boolean()
          })
        )
      }),
      requiredPermission: 'pharmacy:inventory:read',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['PHARMACY_PRESCRIPTION_ASSISTANCE', 'PHARMACY_INVENTORY_ALERTS'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, input) => {
        return {
          items: [
            {
              drugName: input.drugName || 'Torsemide 10mg Tablet',
              availableStock: 340,
              batchNumber: 'BATCH-2026-TORS-01',
              isNearExpiry: false
            },
            {
              drugName: 'Telmisartan 80mg Tablet',
              availableStock: 120,
              batchNumber: 'BATCH-2026-TELM-04',
              isNearExpiry: false
            }
          ]
        };
      }
    };

    // ROLE-7: LAB TOOL
    const getLabPendingOrdersTool: AiToolDefinition<
      { statusFilter?: string | undefined },
      { pendingOrders: Array<{ orderId: string; testName: string; urgency: string; sampleCollected: boolean }> }
    > = {
      id: 'get_lab_pending_orders',
      name: 'Get Lab Pending Orders',
      description: 'Returns specimen accession queues and pending lab investigation orders',
      actionClassification: 'READ',
      inputSchema: z.object({
        statusFilter: z.string().optional()
      }),
      outputSchema: z.object({
        pendingOrders: z.array(
          z.object({
            orderId: z.string(),
            testName: z.string(),
            urgency: z.string(),
            sampleCollected: z.boolean()
          })
        )
      }),
      requiredPermission: 'lab:orders:read',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['LAB_SAMPLE_WORKFLOW'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, _input) => {
        return {
          pendingOrders: [
            {
              orderId: 'LAB-ORD-9021',
              testName: 'Complete Blood Count (CBC) with Automated Differential',
              urgency: 'ROUTINE',
              sampleCollected: true
            },
            {
              orderId: 'LAB-ORD-9022',
              testName: 'High Sensitivity Cardiac Troponin I (hs-cTnI)',
              urgency: 'STAT_EMERGENCY',
              sampleCollected: true
            }
          ]
        };
      }
    };

    // ROLE-8: FINANCE TOOL
    const getFinanceOutstandingInvoicesTool: AiToolDefinition<
      { agingDaysMin?: number | undefined },
      { totalUnpaidInvoices: number; outstandingReceivables: number; claimAdjudicationPendingCount: number }
    > = {
      id: 'get_finance_outstanding_invoices',
      name: 'Get Finance Outstanding Invoices',
      description: 'Returns outstanding patient ledger balances, pending receivables, and unsettled TPA claims',
      actionClassification: 'READ',
      inputSchema: z.object({
        agingDaysMin: z.number().optional()
      }),
      outputSchema: z.object({
        totalUnpaidInvoices: z.number(),
        outstandingReceivables: z.number(),
        claimAdjudicationPendingCount: z.number()
      }),
      requiredPermission: 'billing:invoices:read',
      tenantScoped: true,
      branchScoped: false,
      allowedCapabilities: ['FINANCE_BILLING_ANALYTICS'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, _input) => {
        return {
          totalUnpaidInvoices: 38,
          outstandingReceivables: 428000,
          claimAdjudicationPendingCount: 12
        };
      }
    };

    // ROLE-9: PATIENT TOOL
    const getPatientPersonalAppointmentsTool: AiToolDefinition<
      { patientMrn: string },
      { patientMrn: string; upcomingAppointments: Array<{ appointmentDate: string; doctorName: string; department: string }> }
    > = {
      id: 'get_patient_personal_appointments',
      name: 'Get Patient Personal Appointments',
      description: 'Returns scheduled clinic appointments strictly for the authenticated patient',
      actionClassification: 'READ',
      inputSchema: z.object({
        patientMrn: z.string().min(1)
      }),
      outputSchema: z.object({
        patientMrn: z.string(),
        upcomingAppointments: z.array(
          z.object({
            appointmentDate: z.string(),
            doctorName: z.string(),
            department: z.string()
          })
        )
      }),
      requiredPermission: 'patient:portal:read',
      tenantScoped: true,
      branchScoped: false,
      allowedCapabilities: ['PATIENT_VISIT_GUIDANCE'],
      humanApprovalRequired: false,
      auditRequired: true,
      handler: async (_context, input) => {
        return {
          patientMrn: input.patientMrn,
          upcomingAppointments: [
            {
              appointmentDate: '2026-09-12 10:30 AM',
              doctorName: 'Dr. Amit Sen, MD',
              department: 'Cardiology OPD'
            }
          ]
        };
      }
    };

    // Register all tools
    this.registerTool(getPatientVitalsTool);
    this.registerTool(lookupDrugInteractionsTool);
    this.registerTool(getClinicalTranscriptTool);
    this.registerTool(lookupCriticalLabValuesTool);

    this.registerTool(getOwnerRevenueSummaryTool);
    this.registerTool(getManagerOperationsSummaryTool);
    this.registerTool(getPatientClinicalHistoryTool);
    this.registerTool(getNurseCareChecklistTool);
    this.registerTool(getReceptionQueueScheduleTool);
    this.registerTool(getPharmacyInventoryStatusTool);
    this.registerTool(getLabPendingOrdersTool);
    this.registerTool(getFinanceOutstandingInvoicesTool);
    this.registerTool(getPatientPersonalAppointmentsTool);
  }

  public registerTool<TIn = unknown, TOut = unknown>(tool: AiToolDefinition<TIn, TOut>): void {
    this.tools.set(tool.id, tool as unknown as AiToolDefinition<unknown, unknown>);
  }

  public getTool(id: string): AiToolDefinition<unknown, unknown> | undefined {
    return this.tools.get(id);
  }

  public listTools(): AiToolDefinition<unknown, unknown>[] {
    return Array.from(this.tools.values());
  }

  public listToolsForCapability(capabilityId: string): AiToolDefinition<unknown, unknown>[] {
    return this.listTools().filter((t) => t.allowedCapabilities.includes(capabilityId));
  }
}

export const toolRegistry = new AiToolRegistry();
