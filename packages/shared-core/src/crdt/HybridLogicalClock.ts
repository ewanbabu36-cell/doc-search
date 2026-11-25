/**
 * DocSearch Hybrid Logical Clock (HLC) & Per-Field LWW-Map CRDT Engine
 * ----------------------------------------------------------------------
 * Enables true >48-hour / multi-day rural blackout offline synchronization:
 * - Hybrid Logical Clock prevents multi-device clock-skew overwrites when
 *   clinic tablets, nurse phones, and desktop counters drift in local time.
 * - Deterministic total order comparison: physicalMs -> logicalCounter -> nodeId.
 * - Per-field Last-Write-Wins (LWW) conflict resolution with non-destructive
 *   semantic conflict flagging for critical safety fields (e.g., allergies).
 */

export interface HybridLogicalClock {
  physicalMs: number;
  logicalCounter: number;
  nodeId: string;
}

export interface CrdtFieldEntry<T = unknown> {
  value: T;
  clock: HybridLogicalClock;
  actorId?: string | undefined;
  actorRole?: string | undefined;
}

export interface SemanticConflictRecord {
  field: string;
  existingValue: unknown;
  incomingValue: unknown;
  existingClock: HybridLogicalClock;
  incomingClock: HybridLogicalClock;
  existingActorId?: string | undefined;
  incomingActorId?: string | undefined;
  detectedAt: string;
  resolution: 'KEEP_HIGHER_HLC' | 'MANUAL_REVIEW_FLAGGED';
}

export interface CrdtMergeOutcome {
  mergedState: Record<string, CrdtFieldEntry>;
  appliedFields: string[];
  skippedStaleFields: string[];
  semanticConflicts: SemanticConflictRecord[];
}

const SAFETY_SENSITIVE_FIELDS = new Set([
  'allergies',
  'bloodGroup',
  'clinicalAssessment',
  'assessmentNotes',
  'diagnoses',
  'criticalPanicAlert'
]);

/**
 * Encodes an HLC into a lexicographically sortable string: `<13-digit-ms>:<5-digit-counter>:<nodeId>`
 */
export function encodeHlc(clock: HybridLogicalClock): string {
  const ms = String(Math.max(0, Math.floor(clock.physicalMs))).padStart(13, '0');
  const cnt = String(Math.max(0, Math.floor(clock.logicalCounter))).padStart(5, '0');
  return `${ms}:${cnt}:${clock.nodeId}`;
}

/**
 * Decodes an HLC string or builds one from legacy numeric lamportClock + ISO timestamp
 */
export function parseHlc(
  hlcOrTimestamp: string | HybridLogicalClock | undefined,
  fallbackLamport = 0,
  fallbackNodeId = 'unknown-node'
): HybridLogicalClock {
  if (hlcOrTimestamp && typeof hlcOrTimestamp === 'object' && 'physicalMs' in hlcOrTimestamp) {
    return hlcOrTimestamp;
  }

  if (typeof hlcOrTimestamp === 'string') {
    const parts = hlcOrTimestamp.split(':');
    if (parts.length >= 3 && /^\d+$/.test(parts[0]!) && /^\d+$/.test(parts[1]!)) {
      return {
        physicalMs: parseInt(parts[0]!, 10),
        logicalCounter: parseInt(parts[1]!, 10),
        nodeId: parts.slice(2).join(':')
      };
    }

    const parsedMs = Date.parse(hlcOrTimestamp);
    if (!Number.isNaN(parsedMs)) {
      return {
        physicalMs: parsedMs,
        logicalCounter: fallbackLamport,
        nodeId: fallbackNodeId
      };
    }
  }

  return {
    physicalMs: Date.now(),
    logicalCounter: fallbackLamport,
    nodeId: fallbackNodeId
  };
}

/**
 * Generates next local HLC monotonic tick (Kulkarni et al. HLC algorithm)
 */
export function tickHlc(prev: HybridLogicalClock | null, nodeId: string, wallNowMs = Date.now()): HybridLogicalClock {
  if (!prev) {
    return { physicalMs: wallNowMs, logicalCounter: 0, nodeId };
  }
  const physicalMs = Math.max(prev.physicalMs, wallNowMs);
  const logicalCounter = physicalMs === prev.physicalMs ? prev.logicalCounter + 1 : 0;
  return { physicalMs, logicalCounter, nodeId };
}

/**
 * Advances local HLC upon receiving remote clock `remote`
 */
export function receiveHlc(local: HybridLogicalClock, remote: HybridLogicalClock, wallNowMs = Date.now()): HybridLogicalClock {
  const physicalMs = Math.max(local.physicalMs, remote.physicalMs, wallNowMs);
  let logicalCounter = 0;

  if (physicalMs === local.physicalMs && physicalMs === remote.physicalMs) {
    logicalCounter = Math.max(local.logicalCounter, remote.logicalCounter) + 1;
  } else if (physicalMs === local.physicalMs) {
    logicalCounter = local.logicalCounter + 1;
  } else if (physicalMs === remote.physicalMs) {
    logicalCounter = remote.logicalCounter + 1;
  }

  return { physicalMs, logicalCounter, nodeId: local.nodeId };
}

/**
 * Deterministic total order comparator: returns >0 if a > b, <0 if a < b, 0 if identical
 */
export function compareHlc(a: HybridLogicalClock, b: HybridLogicalClock): number {
  if (a.physicalMs !== b.physicalMs) {
    return a.physicalMs - b.physicalMs;
  }
  if (a.logicalCounter !== b.logicalCounter) {
    return a.logicalCounter - b.logicalCounter;
  }
  return a.nodeId.localeCompare(b.nodeId);
}

/**
 * Per-field Last-Write-Wins (LWW) CRDT merge with semantic safety conflict detection.
 * Two concurrent mutations on clinical safety fields from different nodes within 5 minutes
 * are flagged cleanly in semanticConflicts while deterministically converging on highest HLC.
 */
export function mergeFieldLevelCrdtMaps(
  currentMap: Record<string, CrdtFieldEntry>,
  incomingFields: Record<string, unknown>,
  incomingClock: HybridLogicalClock,
  actorMeta?: { actorId?: string; actorRole?: string }
): CrdtMergeOutcome {
  const mergedState: Record<string, CrdtFieldEntry> = { ...currentMap };
  const appliedFields: string[] = [];
  const skippedStaleFields: string[] = [];
  const semanticConflicts: SemanticConflictRecord[] = [];

  for (const [field, incomingValue] of Object.entries(incomingFields)) {
    if (incomingValue === undefined) continue;

    const existing = mergedState[field];
    if (!existing) {
      mergedState[field] = {
        value: incomingValue,
        clock: incomingClock,
        ...(actorMeta?.actorId ? { actorId: actorMeta.actorId } : {}),
        ...(actorMeta?.actorRole ? { actorRole: actorMeta.actorRole } : {})
      };
      appliedFields.push(field);
      continue;
    }

    const cmp = compareHlc(incomingClock, existing.clock);
    const sameValue = JSON.stringify(existing.value) === JSON.stringify(incomingValue);

    // Check if different nodes modified a clinically safety-sensitive field concurrently
    const timeDeltaMs = Math.abs(incomingClock.physicalMs - existing.clock.physicalMs);
    if (
      SAFETY_SENSITIVE_FIELDS.has(field) &&
      !sameValue &&
      existing.clock.nodeId !== incomingClock.nodeId &&
      timeDeltaMs <= 10 * 60 * 1000 // Concurrent 10-min rural blackout overlap window
    ) {
      semanticConflicts.push({
        field,
        existingValue: existing.value,
        incomingValue,
        existingClock: existing.clock,
        incomingClock,
        existingActorId: existing.actorId,
        incomingActorId: actorMeta?.actorId,
        detectedAt: new Date().toISOString(),
        resolution: cmp >= 0 ? 'KEEP_HIGHER_HLC' : 'MANUAL_REVIEW_FLAGGED'
      });
    }

    if (cmp > 0) {
      mergedState[field] = {
        value: incomingValue,
        clock: incomingClock,
        ...(actorMeta?.actorId ? { actorId: actorMeta.actorId } : {}),
        ...(actorMeta?.actorRole ? { actorRole: actorMeta.actorRole } : {})
      };
      appliedFields.push(field);
    } else {
      skippedStaleFields.push(field);
    }
  }

  return {
    mergedState,
    appliedFields,
    skippedStaleFields,
    semanticConflicts
  };
}
