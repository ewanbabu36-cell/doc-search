/**
 * DOC SEARCH Partner Platform - Granular Field-Level CRDT Delta Engine
 *
 * Implements Conflict-Free Replicated Data Type (CRDT) semantics for hospital workflows:
 * When Doctor, Nurse, and Reception edit the same patient or encounter while offline,
 * mutations are partitioned into granular field-level deltas rather than destructive
 * full-record overwrites.
 */

import { universalOfflineOutbox } from './universal-offline-outbox.js';
import { multiTabSyncCoordinator } from './multi-tab-sync-coordinator.js';

export type GranularDeltaType = 'DEMOGRAPHICS' | 'VITALS' | 'CLINICAL_NOTES' | 'PRESCRIPTIONS';

export interface GranularDeltaItem {
  deltaId: string;
  entityType: 'PATIENT' | 'ENCOUNTER' | 'CONSULTATION';
  entityId: string;
  patientId: string;
  encounterId?: string | undefined;
  deltaType: GranularDeltaType;
  clientTimestamp: string;
  lamportClock: number;
  actorId?: string | undefined;
  actorRole?: string | undefined;
  data: Record<string, any>;
}

class GranularCrdtSyncEngine {
  private lamportClock: number = 0;

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('docsearch_lamport_clock');
      if (stored) this.lamportClock = parseInt(stored, 10) || 0;
    }
  }

  private tickClock(): number {
    this.lamportClock += 1;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('docsearch_lamport_clock', String(this.lamportClock));
    }
    return this.lamportClock;
  }

  /**
   * Queue Demographics field updates (e.g. Reception changes phone or address)
   */
  public async queueDemographicsDelta(
    patientId: string,
    demographics: {
      mobileNumber?: string;
      address?: string;
      emergencyContact?: string;
      bloodGroup?: string;
      firstName?: string;
      lastName?: string;
    },
    actorId?: string
  ): Promise<GranularDeltaItem> {
    const delta: GranularDeltaItem = {
      deltaId: `delta-demo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entityType: 'PATIENT',
      entityId: patientId,
      patientId,
      deltaType: 'DEMOGRAPHICS',
      clientTimestamp: new Date().toISOString(),
      lamportClock: this.tickClock(),
      actorId,
      actorRole: 'RECEPTION',
      data: demographics
    };

    await this.dispatchDelta(delta);
    return delta;
  }

  /**
   * Queue Vitals field updates (e.g. Nurse records BP, pulse, temp at Triage)
   */
  public async queueVitalsDelta(
    encounterId: string,
    patientId: string,
    vitals: {
      systolicBp?: number;
      diastolicBp?: number;
      pulseBpm?: number;
      temperatureCelsius?: string;
      oxygenSaturationPercent?: number;
      respiratoryRateBpm?: number;
      weightKg?: string;
      heightCm?: string;
      clinicalNotes?: string;
    },
    recordedBy: string,
    actorId?: string
  ): Promise<GranularDeltaItem> {
    const delta: GranularDeltaItem = {
      deltaId: `delta-vitals-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entityType: 'ENCOUNTER',
      entityId: encounterId,
      patientId,
      encounterId,
      deltaType: 'VITALS',
      clientTimestamp: new Date().toISOString(),
      lamportClock: this.tickClock(),
      actorId: actorId || recordedBy,
      actorRole: 'NURSE',
      data: { ...vitals, recordedBy }
    };

    await this.dispatchDelta(delta);
    return delta;
  }

  /**
   * Queue Doctor Clinical Notes & Diagnoses updates (e.g. Doctor consultation cockpit)
   */
  public async queueClinicalNotesDelta(
    encounterId: string,
    patientId: string,
    notes: {
      chiefComplaint?: string;
      historyOfPresentIllness?: string;
      examinationNotes?: string;
      assessmentNotes?: string;
      planNotes?: string;
      diagnoses?: Array<{ code: string; name: string; isPrimary?: boolean }>;
    },
    doctorId: string
  ): Promise<GranularDeltaItem> {
    const delta: GranularDeltaItem = {
      deltaId: `delta-notes-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entityType: 'ENCOUNTER',
      entityId: encounterId,
      patientId,
      encounterId,
      deltaType: 'CLINICAL_NOTES',
      clientTimestamp: new Date().toISOString(),
      lamportClock: this.tickClock(),
      actorId: doctorId,
      actorRole: 'DOCTOR',
      data: notes
    };

    await this.dispatchDelta(delta);
    return delta;
  }

  /**
   * Queue Prescriptions additions (e.g. Doctor prescribing drugs)
   */
  public async queuePrescriptionDelta(
    encounterId: string,
    patientId: string,
    items: Array<{
      id: string; // Client UUID
      medicationId?: string;
      medicationName: string;
      dosage: string;
      frequency: string;
      duration: string | number;
      instructions?: string;
    }>,
    doctorId: string
  ): Promise<GranularDeltaItem> {
    const delta: GranularDeltaItem = {
      deltaId: `delta-rx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entityType: 'ENCOUNTER',
      entityId: encounterId,
      patientId,
      encounterId,
      deltaType: 'PRESCRIPTIONS',
      clientTimestamp: new Date().toISOString(),
      lamportClock: this.tickClock(),
      actorId: doctorId,
      actorRole: 'DOCTOR',
      data: { items }
    };

    await this.dispatchDelta(delta);
    return delta;
  }

  /**
   * Dispatch delta to universal offline outbox with target endpoint
   */
  private async dispatchDelta(delta: GranularDeltaItem): Promise<void> {
    // Enqueue in IndexedDB outbox
    await universalOfflineOutbox.enqueue(
      'CLINICAL_CONSULTATION', // Outbox category
      '/api/v1/partner/clinical/sync/granular-merge',
      'POST',
      { deltas: [delta] }
    );

    // Notify sibling tabs via broadcast channel
    multiTabSyncCoordinator.broadcast({
      type: 'RECORD_MERGED',
      tabId: multiTabSyncCoordinator.getTabId(),
      timestamp: delta.clientTimestamp,
      payload: {
        deltaType: delta.deltaType,
        patientId: delta.patientId,
        encounterId: delta.encounterId
      }
    });
  }
}

export const granularCrdtSyncEngine = new GranularCrdtSyncEngine();
