/**
 * DocSearch Dynamic Hospital Real-Time Event Bus
 * Enables reactive cross-module synchronization, cross-tab BroadcastChannel,
 * and Server-Sent Events (SSE) gateway bridging across all clinic workstations.
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
  | 'SOUNDBOX_ALERT'
  | 'PAYMENT_RECEIVED'
  | 'PATIENT_CALLED'
  | 'PATIENT_REGISTERED'
  | 'TOKEN_GENERATED'
  | 'TOKEN_COMPLETED'
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
  | 'FORENSIC_WATERMARK_EMBEDDED'
  | 'EMAR_MEDICATION_ADMINISTERED_BILLED'
  | 'BCMA_MEDICATION_VERIFIED_ADMINISTERED'
  | 'BCMA_SAFETY_CLASH_PREVENTED'
  | 'TPA_CLAIM_SCRUBBER_AUDITED'
  | 'NURSE_CALL_REQUESTED'
  | (string & {});

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
  id?: string;
  type: HospitalEventType;
  timestamp: string;
  sourceModule: string;
  data: any;
  summaryText: string;
  tenantId?: string;
  senderId?: string;
}

type EventCallback = (payload: HospitalEventPayload) => void;

class HospitalEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private currentPatient: ActivePatientSummary | null = null;
  private channel: BroadcastChannel | null = null;
  private legacyChannel: BroadcastChannel | null = null;
  private sseSource: EventSource | null = null;
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private readonly baseReconnectDelayMs: number = 1000;
  private readonly maxReconnectDelayMs: number = 30000;
  private recentEventIds: Set<string> = new Set();
  private recentEventRing: string[] = [];
  public readonly tabId: string =
    typeof window !== 'undefined'
      ? `tab-${Math.random().toString(36).slice(2, 9)}-${Date.now()}`
      : 'tab-server';
  private apiBaseUrl: string = '';

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

      // 1. Native BroadcastChannel ('docsearch_hospital_events') for cross-tab mirroring on same machine
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.channel = new BroadcastChannel('docsearch_hospital_events');
          this.channel.onmessage = (event) => {
            if (event && event.data) {
              this.handleInboundBroadcast(event.data);
            }
          };
        } catch (e) {
          console.warn('[EventBus] BroadcastChannel (docsearch_hospital_events) initialization failed:', e);
        }

        // Secondary legacy channel for backwards-compatibility
        try {
          this.legacyChannel = new BroadcastChannel('docsearch_hospital_realtime_channel');
          this.legacyChannel.onmessage = (event) => {
            if (event && event.data) {
              this.handleInboundBroadcast(event.data);
            }
          };
        } catch {
          // ignore
        }
      }

      // 2. Initialize Server-Sent Events (SSE) bridge to API Gateway
      this.initSseBridge();
    }
  }

  /**
   * Initialize or reconnect to API Gateway Server-Sent Events (SSE) Stream
   * Enables cross-device real-time sync (Doctor PC <-> Reception Desk <-> Pharmacy <-> TV Display)
   * with automatic exponential backoff reconnection and Bearer token authentication.
   */
  public initSseBridge(tenantId?: string): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    if (this.sseSource && this.sseSource.readyState !== EventSource.CLOSED) {
      return;
    }

    try {
      const baseUrl =
        (window as any).__DOCSEARCH_API_BASE__ ||
        ((import.meta as any)?.env?.VITE_API_URL as string) ||
        '';
      this.apiBaseUrl = baseUrl;

      const params = new URLSearchParams();
      params.set('clientId', this.tabId);
      if (tenantId) params.set('tenantId', tenantId);

      // Bearer token authentication for EventSource
      try {
        const token =
          localStorage.getItem('docsearch_auth_token') ||
          localStorage.getItem('docsearch_partner_token') ||
          localStorage.getItem('auth_token') ||
          localStorage.getItem('token') ||
          '';
        if (token) {
          params.set('token', token);
          params.set('bearer', token);
        }
      } catch {}

      const sseUrl = `${baseUrl}/api/v1/partner/events/stream?${params.toString()}`;

      this.sseSource = new EventSource(sseUrl);

      this.sseSource.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      // Direct listeners for core clinic LAN events
      const coreEvents = [
        'TOKEN_GENERATED',
        'PRESCRIPTION_ISSUED',
        'PAYMENT_RECEIVED',
        'SOUNDBOX_ALERT',
        'LAB_RETURN_READY',
        'PATIENT_CALLED',
        'TOKEN_COMPLETED',
        'PATIENT_SELECTED',
        'PATIENT_CLEARED',
        'PATIENT_REGISTERED',
        'PRESCRIPTION_DISPENSED',
        'hospital-event'
      ];

      coreEvents.forEach((evtType) => {
        this.sseSource?.addEventListener(evtType, (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            this.handleInboundSse(payload);
          } catch (err) {
            console.warn(`[EventBus] Failed to parse inbound SSE event (${evtType}):`, err);
          }
        });
      });

      this.sseSource.onmessage = (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          this.handleInboundSse(payload);
        } catch {
          // heartbeat or unformatted data
        }
      };

      this.sseSource.onerror = (e) => {
        if (this.sseSource) {
          try {
            this.sseSource.close();
          } catch {}
          this.sseSource = null;
        }

        // Exponential backoff auto-reconnect (1s, 2s, 4s, 8s, up to 30s)
        if (!this.reconnectTimer) {
          const delay = Math.min(
            this.maxReconnectDelayMs,
            this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempts)
          );
          this.reconnectAttempts++;
          console.warn(`[EventBus] SSE connection error. Reconnecting with exponential backoff in ${delay}ms (attempt #${this.reconnectAttempts})...`, e);
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.initSseBridge(tenantId);
          }, delay);
        }
      };
    } catch (err) {
      console.warn('[EventBus] SSE stream connection failed, will retry:', err);
    }
  }

  private markEventSeen(id?: string): boolean {
    if (!id) return false;
    if (this.recentEventIds.has(id)) return true;
    this.recentEventIds.add(id);
    this.recentEventRing.push(id);
    if (this.recentEventRing.length > 250) {
      const oldest = this.recentEventRing.shift();
      if (oldest) this.recentEventIds.delete(oldest);
    }
    return false;
  }

  private handleInboundBroadcast(payload: HospitalEventPayload): void {
    if (!payload || !payload.type) return;
    if (payload.senderId && payload.senderId === this.tabId) return; // Prevent echo
    if (this.markEventSeen(payload.id)) return; // Deduplicate

    // Sync active patient context if applicable
    if (payload.type === 'PATIENT_SELECTED' && payload.data) {
      this.currentPatient = payload.data as ActivePatientSummary;
    } else if (payload.type === 'PATIENT_CLEARED') {
      this.currentPatient = null;
    }

    this.dispatchLocal(payload);
  }

  private handleInboundSse(payload: HospitalEventPayload): void {
    if (!payload || !payload.type) return;
    if (payload.senderId && payload.senderId === this.tabId) return; // Prevent echo
    if (this.markEventSeen(payload.id)) return; // Deduplicate

    // Sync active patient context if applicable
    if (payload.type === 'PATIENT_SELECTED' && payload.data) {
      this.currentPatient = payload.data as ActivePatientSummary;
    } else if (payload.type === 'PATIENT_CLEARED') {
      this.currentPatient = null;
    }

    // Dispatch to local in-memory listeners in this tab
    this.dispatchLocal(payload);

    // Also mirror to other tabs on this machine via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {}
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

    // Dispatch DOM CustomEvent for backward interoperability
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('docsearch:hospital-event', { detail: payload }));
      } catch {}
    }
  }

  public publish(type: HospitalEventType, sourceModule: string, data: any, summaryText: string = ''): void {
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload: HospitalEventPayload = {
      id: eventId,
      type,
      timestamp: new Date().toLocaleTimeString(),
      sourceModule,
      data,
      summaryText: summaryText || `${type} from ${sourceModule}`,
      senderId: this.tabId
    };

    // Mark as seen so this tab never re-processes its own event
    this.markEventSeen(eventId);

    if (type === 'PATIENT_SELECTED') {
      this.currentPatient = data as ActivePatientSummary;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('docsearch_active_patient_context', JSON.stringify(data));
        } catch {}
      }
    } else if (type === 'PATIENT_CLEARED') {
      this.currentPatient = null;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('docsearch_active_patient_context');
        } catch {}
      }
    }

    // 1. Dispatch to local subscribers in this tab (<1ms instant execution)
    this.dispatchLocal(payload);

    // 2. Broadcast across all browser tabs on the same machine via BroadcastChannel (<10ms)
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (e) {
        console.warn('[EventBus] BroadcastChannel postMessage failed:', e);
      }
    }
    if (this.legacyChannel) {
      try {
        this.legacyChannel.postMessage(payload);
      } catch {}
    }

    // 3. Mirror across physical devices on clinic LAN via API Gateway SSE stream
    if (typeof window !== 'undefined') {
      const baseUrl =
        this.apiBaseUrl ||
        (window as any).__DOCSEARCH_API_BASE__ ||
        ((import.meta as any)?.env?.VITE_API_URL as string) ||
        '';

      let token = '';
      try {
        token =
          localStorage.getItem('docsearch_auth_token') ||
          localStorage.getItem('docsearch_partner_token') ||
          localStorage.getItem('auth_token') ||
          localStorage.getItem('token') ||
          '';
      } catch {}

      fetch(`${baseUrl}/api/v1/partner/events/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Silent catch: network drop or offline mode does not impede local BroadcastChannel sync
      });
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
