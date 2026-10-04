/**
 * DocSearch Dynamic Hospital Real-Time Event Bus
 * Enables reactive cross-module synchronization without page reloads or data loss.
 */

export type HospitalEventType =
  | 'PATIENT_SELECTED'
  | 'PATIENT_CLEARED'
  | 'PRESCRIPTION_DISPENSED'
  | 'PRESCRIPTION_ISSUED'
  | 'LAB_ORDER_CREATED'
  | 'LAB_REPORT_COMPLETED'
  | 'BED_STATUS_CHANGED'
  | 'EMERGENCY_TRIAGE_ALERT'
  | 'BILL_SETTLED'
  | 'BARCODE_SCANNED'
  | 'SYSTEM_TELEMETRY_PULSE'
  | 'RADIOLOGY_ORDER_CREATED'
  | 'IPD_ADMISSION_REQUESTED'
  | 'PARTNER_INVITATION_ACCEPTED'
  | 'PARTNER_INVITATION_DECLINED'
  | 'AMBIENT_VOICE_SCRIBE_AUTOFILL'
  | 'AMBIENT_VOICE_SCRIBE_UNDO'
  | 'OPTIMISTIC_ACTION_DISPATCHED'
  | 'OPTIMISTIC_ACTION_REVERTED'
  | 'CRITICAL_PANIC_ALERT'
  | 'ABDM_INBOUND_SCAN'
  | 'PATIENT_CALLED'
  | 'PATIENT_REGISTERED'
  | 'TOKEN_GENERATED'
  | 'ENCOUNTER_SENT_FOR_LABS'
  | 'DOCTOR_CHAMBER_STATUS_CHANGED'
  | 'IPD_ADMISSION_ORDERED'
  | 'REFERRAL_DISPATCHED'
  | 'PATIENT_CALLED_TO_CHAMBER'
  | 'OPD_PROCEDURE_ORDERED'
  | 'MLC_CASE_RECORDED'
  | 'TELE_TRIAGE_REPLY_SENT'
  | 'PATIENT_RECORDS_MERGED'
  | 'CHAMBER_PAYMENT_COLLECTED'
  | 'TRIAGE_VITALS_RECORDED'
  | 'LAB_RETURN_READY'
  | 'QUEUE_VELOCITY_UPDATED'
  | 'ASTM_RESULT_EMITTED'
  | 'CRITICAL_PANIC_ESCALATED'
  | 'MEDICATION_ORDERED_INPATIENT'
  | 'PHARMACY_DOSE_PACK_UPDATED'
  | 'SEPSIS_ALERT_TRIGGERED'
  | 'DISCHARGE_ORDERED_INPATIENT'
  | 'BED_SANITIZATION_REQUESTED'
  | 'PRE_HOSPITAL_AMBULANCE_STREAMED'
  | 'CATH_LAB_PRE_ACTIVATED'
  | 'POLICE_INTIMATION_DISPATCHED'
  | 'CRASH_CART_REPLENISH_TRIGGERED'
  | 'CSSD_TRAY_VERIFIED'
  | 'OT_SCHEDULE_OVERRUN_ADJUSTED'
  | 'NPO_SAFETY_BREACH_ALERT'
  | 'OT_DEPENDENCY_GATE_CLEARED'
  | 'GRN_INWARD_AUTO_PARSED'
  | 'DYNAMIC_REORDER_TRIGGERED'
  | 'WARD_MEDICATION_RETURN_RECONCILED'
  | 'BLOOD_CROSS_MATCH_VERIFIED'
  | 'TRANSFUSION_REACTION_ALERTED'
  | 'COLD_CHAIN_BREACH_ALERTED'
  | 'PLATELET_EXPIRY_WATERFALL_DISPATCHED'
  | 'RADIOLOGY_EMERGENCY_SLA_BREACH_ALERTED'
  | 'DICOM_SERIES_AUTO_BOUND'
  | 'MODALITY_WORKLIST_SYNCED'
  | 'BIOMEDICAL_BREAKDOWN_DISPATCHED'
  | 'PPM_QUARANTINE_ENFORCED'
  | 'EQUIPMENT_UPTIME_TELEMETRY_UPDATED'
  | 'HAI_DEVICE_DAY_ALERT_DISPATCHED'
  | 'HAI_MICROBIOLOGY_AUTOCORRELATED'
  | 'BMW_WEIGHT_RECONCILIATION_LOGGED'
  | 'PRE_AUTH_UTILIZATION_ALERTED'
  | 'TPA_ENHANCEMENT_TRIGGERED'
  | 'NON_MEDICAL_DEDUCTION_ESTIMATED'
  | 'CLINICAL_SERVICE_AUTO_CHARGED'
  | 'UNBILLED_LEAKAGE_DETECTED'
  | 'BLIND_CASH_COUNT_RECONCILED'
  | 'CASHIER_VARIANCE_OVERRIDDEN'
  | 'HOSPITAL_HEARTBEAT_PULSED'
  | 'PREDICTIVE_BED_VACATION_PROJECTED'
  | 'ICU_BED_CRISIS_RESOLVED'
  | 'EXECUTIVE_BOTTLENECK_DISPATCHED'
  | 'NEWS2_SCORE_CALCULATED'
  | 'RAPID_RESPONSE_SYSTEM_ACTIVATED'
  | 'PREDICTIVE_INVENTORY_PO_DRAFTED'
  | 'BREAK_GLASS_OVERRIDE_RECORDED'
  | 'DISCHARGE_VELOCITY_PARALLEL_SPAWNED'
  | 'FORENSIC_WATERMARK_EMBEDDED';

export interface ActivePatientSummary {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string | undefined;
  bloodGroup?: string | undefined;
  bedNumber?: string | undefined;
  wardName?: string | undefined;
  opdToken?: number | undefined;
  doctorName?: string | undefined;
  diagnosis?: string | undefined;
  allergies?: string[] | undefined;
  insuranceProvider?: string | undefined;
  lastUpdated?: string | undefined;
}

export interface HospitalEventPayload {
  type: HospitalEventType;
  timestamp: string;
  sourceModule: string;
  data: any;
  summaryText: string;
}

type EventCallback = (payload: HospitalEventPayload) => void;

class HospitalEventBus {
  private listeners: Map<HospitalEventType | '*', Set<EventCallback>> = new Map();
  private currentPatient: ActivePatientSummary | null = null;
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('docsearch_active_patient_context');
        if (cached) {
          this.currentPatient = JSON.parse(cached);
        }
      } catch {
        this.currentPatient = null;
      }

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.channel = new BroadcastChannel('docsearch_hospital_realtime_channel');
          this.channel.onmessage = (event) => {
            if (event && event.data) {
              this.dispatchLocal(event.data);
            }
          };
        } catch (e) {
          console.warn('[EventBus] BroadcastChannel initialization failed:', e);
        }
      }
    }
  }

  public subscribe(eventType: HospitalEventType | '*', callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  private dispatchLocal(payload: HospitalEventPayload): void {
    // Notify specific type listeners
    this.listeners.get(payload.type)?.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for ${payload.type}:`, err);
      }
    });

    // Notify wildcard listeners
    this.listeners.get('*')?.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error(`[EventBus] Error in wildcard listener:`, err);
      }
    });

    // Dispatch DOM CustomEvent for interoperability
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('docsearch:hospital-event', { detail: payload }));
    }
  }

  public publish(type: HospitalEventType, sourceModule: string, data: any, summaryText: string = ''): void {
    const payload: HospitalEventPayload = {
      type,
      timestamp: new Date().toLocaleTimeString(),
      sourceModule,
      data,
      summaryText: summaryText || `${type} from ${sourceModule}`
    };

    if (type === 'PATIENT_SELECTED') {
      this.currentPatient = data as ActivePatientSummary;
      if (typeof window !== 'undefined') {
        localStorage.setItem('docsearch_active_patient_context', JSON.stringify(data));
      }
    } else if (type === 'PATIENT_CLEARED') {
      this.currentPatient = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('docsearch_active_patient_context');
      }
    }

    // Dispatch to local subscribers
    this.dispatchLocal(payload);

    // Broadcast across browser tabs / windows in real-time
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (e) {
        console.warn('[EventBus] BroadcastChannel postMessage failed:', e);
      }
    }
  }

  public getActivePatient(): ActivePatientSummary | null {
    return this.currentPatient;
  }

  public setActivePatient(patient: ActivePatientSummary, sourceModule: string = 'global'): void {
    this.publish(
      'PATIENT_SELECTED',
      sourceModule,
      patient,
      `Selected ${patient.name} (${patient.uhid})`
    );
  }

  public clearActivePatient(sourceModule: string = 'global'): void {
    this.publish(
      'PATIENT_CLEARED',
      sourceModule,
      null,
      'Active patient context cleared'
    );
  }
}

export const hospitalEventBus = new HospitalEventBus();
