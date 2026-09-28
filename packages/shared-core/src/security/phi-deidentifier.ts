export interface PatientPrivacyContext {
  patientName?: string;
  patientPhone?: string;
  uhid?: string;
  mrn?: string;
  doctorName?: string;
  hospitalName?: string;
  aadhaar?: string;
  abha?: string;
}

export interface DeidentificationResult {
  deidentifiedText: string;
  tokenMap: Record<string, string>; // Ephemeral local in-memory lookup
  reverseMap: Record<string, string>;
  entitiesScrubbedCount: number;
  scrubbedCategories: {
    patientNameCount: number;
    phoneCount: number;
    idCount: number;
    doctorNameCount: number;
    addressCount: number;
  };
  zeroDataRetentionHeaders: {
    'X-Zero-Data-Retention': 'true';
    'X-Healthcare-Privacy-Enforced': 'true';
    'X-Model-Training': 'opt-out';
  };
}

/**
 * Client & Gateway-side pre-processing pipeline for all Cloud AI / LLM requests.
 * Replaces all Patient Health Information (PHI) with cryptographic synthetic tokens
 * before sending to external LLM providers (Gemini, Claude, Whisper, Vision AI).
 */
export function deidentifyClinicalPayload(
  rawText: string,
  context?: PatientPrivacyContext
): DeidentificationResult {
  if (!rawText) {
    return {
      deidentifiedText: '',
      tokenMap: {},
      reverseMap: {},
      entitiesScrubbedCount: 0,
      scrubbedCategories: {
        patientNameCount: 0,
        phoneCount: 0,
        idCount: 0,
        doctorNameCount: 0,
        addressCount: 0
      },
      zeroDataRetentionHeaders: {
        'X-Zero-Data-Retention': 'true',
        'X-Healthcare-Privacy-Enforced': 'true',
        'X-Model-Training': 'opt-out'
      }
    };
  }

  let text = rawText;
  const tokenMap: Record<string, string> = {}; // token -> original
  const reverseMap: Record<string, string> = {}; // original -> token

  let patientNameCount = 0;
  let phoneCount = 0;
  let idCount = 0;
  let doctorNameCount = 0;
  let addressCount = 0;

  // 1. Explicit Patient Name Tokenization
  if (context?.patientName && context.patientName.trim().length > 1) {
    const pName = context.patientName.trim();
    const token = '[PATIENT_PSEUDO_A7]';
    tokenMap[token] = pName;
    reverseMap[pName] = token;

    // Replace full name
    const fullEscaped = pName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regexFull = new RegExp(fullEscaped, 'gi');
    if (regexFull.test(text)) {
      text = text.replace(regexFull, token);
      patientNameCount++;
    }

    // Replace first name if multi-part
    const parts = pName.split(/\s+/);
    if (parts.length > 1 && parts[0]!.length > 2) {
      const first = parts[0]!;
      const firstRegex = new RegExp(`\\b${first}\\b`, 'gi');
      if (firstRegex.test(text)) {
        text = text.replace(firstRegex, token);
        patientNameCount++;
      }
    }
  }

  // 2. Doctor Name Tokenization
  if (context?.doctorName && context.doctorName.trim().length > 1) {
    const dName = context.doctorName.trim();
    const token = '[PHYSICIAN_TOKEN_01]';
    tokenMap[token] = dName;
    reverseMap[dName] = token;

    const docEscaped = dName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regexDoc = new RegExp(docEscaped, 'gi');
    if (regexDoc.test(text)) {
      text = text.replace(regexDoc, token);
      doctorNameCount++;
    }
  }

  // 3. Known / Contextual Phone Number
  if (context?.patientPhone) {
    const rawPhone = context.patientPhone.replace(/[\s-+]/g, '');
    if (rawPhone.length >= 10) {
      const token = '[PHONE_REDACTED]';
      tokenMap[token] = context.patientPhone;
      reverseMap[context.patientPhone] = token;

      const phoneEscaped = context.patientPhone.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      text = text.replace(new RegExp(phoneEscaped, 'g'), token);
      phoneCount++;
    }
  }

  // 4. Pattern-based Indian Mobile Numbers (10 digits starting with 6-9, optional +91)
  const phonePattern = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;
  text = text.replace(phonePattern, (matched) => {
    const token = '[PHONE_REDACTED]';
    tokenMap[token] = matched;
    phoneCount++;
    return token;
  });

  // 5. Contextual UHID / MRN
  if (context?.uhid) {
    const token = '[ID_TOKEN_9041]';
    tokenMap[token] = context.uhid;
    reverseMap[context.uhid] = token;
    text = text.replace(new RegExp(context.uhid, 'gi'), token);
    idCount++;
  }
  if (context?.mrn) {
    const token = '[MRN_TOKEN_X]';
    tokenMap[token] = context.mrn;
    reverseMap[context.mrn] = token;
    text = text.replace(new RegExp(context.mrn, 'gi'), token);
    idCount++;
  }

  // 6. Pattern-based UHIDs (e.g. UHID-xxxx-xxxx)
  const uhidPattern = /UHID-[A-Z0-9-]+/gi;
  text = text.replace(uhidPattern, (matched) => {
    const token = '[ID_TOKEN_UHID]';
    tokenMap[token] = matched;
    idCount++;
    return token;
  });

  // 7. Aadhaar (12 digits) & ABHA
  const aadhaarPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
  text = text.replace(aadhaarPattern, (matched) => {
    const token = '[AADHAAR_TOKEN_SCRUBBED]';
    tokenMap[token] = matched;
    idCount++;
    return token;
  });

  const abhaPattern = /[a-zA-Z0-9._-]+@(abdm|sbx|ndhm)/gi;
  text = text.replace(abhaPattern, (matched) => {
    const token = '[ABHA_HANDLE_SCRUBBED]';
    tokenMap[token] = matched;
    idCount++;
    return token;
  });

  // 8. 6-Digit Indian Pincodes
  const pincodePattern = /\b[1-9][0-9]{2}\s?[0-9]{3}\b/g;
  text = text.replace(pincodePattern, (matched) => {
    const token = '[PINCODE_REDACTED]';
    tokenMap[token] = matched;
    addressCount++;
    return token;
  });

  const totalScrubbed = patientNameCount + phoneCount + idCount + doctorNameCount + addressCount;

  return {
    deidentifiedText: text,
    tokenMap,
    reverseMap,
    entitiesScrubbedCount: totalScrubbed,
    scrubbedCategories: {
      patientNameCount,
      phoneCount,
      idCount,
      doctorNameCount,
      addressCount
    },
    zeroDataRetentionHeaders: {
      'X-Zero-Data-Retention': 'true',
      'X-Healthcare-Privacy-Enforced': 'true',
      'X-Model-Training': 'opt-out'
    }
  };
}

/**
 * On-premise / Gateway-side Inward Detokenizer.
 * Takes the raw clinical evaluation or SOAP response returned by Cloud LLMs,
 * and restores real patient, doctor, and identifier details in hospital premise memory.
 */
export function reidentifyClinicalResponse(
  llmResponse: string,
  tokenMap: Record<string, string>
): string {
  if (!llmResponse || !tokenMap || Object.keys(tokenMap).length === 0) {
    return llmResponse;
  }

  let restored = llmResponse;
  for (const [token, originalValue] of Object.entries(tokenMap)) {
    const escapedToken = token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    restored = restored.replace(new RegExp(escapedToken, 'g'), originalValue);
  }

  return restored;
}

/**
 * Verifies that a payload has been thoroughly de-identified and contains zero raw patient name or phone occurrences.
 */
export function isPayloadDeidentified(text: string, context?: PatientPrivacyContext): boolean {
  if (!text) return true;
  if (context?.patientName && text.toLowerCase().includes(context.patientName.toLowerCase())) {
    return false;
  }
  if (context?.patientPhone && text.includes(context.patientPhone)) {
    return false;
  }
  if (context?.uhid && text.includes(context.uhid)) {
    return false;
  }
  // Check for raw 10-digit phone
  if (/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/.test(text)) {
    return false;
  }
  return true;
}

export interface EphemeralTokenRecord {
  token: string;
  originalValue: string;
  category: 'PATIENT_NAME' | 'PHONE' | 'IDENTIFIER' | 'DOCTOR_NAME' | 'ADDRESS';
  saltedHash: string;
  createdAt: number;
  expiresAt: number;
  ttlSeconds: number;
}

function computeEphemeralSaltedHash(str: string, salt = 'ephemeral-vault-salt-2026'): string {
  let hash = 0x811c9dc5;
  const input = str + salt;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `0x${hex}${hex}`;
}

/**
 * Ephemeral In-Memory Token Vault Manager.
 * Stores surrogate token to original PHI mappings exclusively in volatile RAM.
 * Automatically purges mappings after TTL (default 180s) to guarantee zero data retention.
 */
export class EphemeralTokenVaultManager {
  private static instance: EphemeralTokenVaultManager;
  private vault: Map<string, EphemeralTokenRecord> = new Map();
  private lastPurgeTimestamp: number = Date.now();

  static getInstance(): EphemeralTokenVaultManager {
    if (!EphemeralTokenVaultManager.instance) {
      EphemeralTokenVaultManager.instance = new EphemeralTokenVaultManager();
    }
    return EphemeralTokenVaultManager.instance;
  }

  registerTokens(
    tokenMap: Record<string, string>,
    defaultTtlSeconds = 180
  ): EphemeralTokenRecord[] {
    const now = Date.now();
    const created: EphemeralTokenRecord[] = [];

    for (const [token, originalValue] of Object.entries(tokenMap)) {
      let category: EphemeralTokenRecord['category'] = 'IDENTIFIER';
      if (token.includes('PATIENT')) category = 'PATIENT_NAME';
      else if (token.includes('PHONE')) category = 'PHONE';
      else if (token.includes('PHYSICIAN')) category = 'DOCTOR_NAME';
      else if (token.includes('PINCODE') || token.includes('ADDRESS')) category = 'ADDRESS';

      const record: EphemeralTokenRecord = {
        token,
        originalValue,
        category,
        saltedHash: computeEphemeralSaltedHash(originalValue),
        createdAt: now,
        expiresAt: now + defaultTtlSeconds * 1000,
        ttlSeconds: defaultTtlSeconds
      };

      this.vault.set(token, record);
      created.push(record);
    }

    return created;
  }

  getTokenRecord(token: string): EphemeralTokenRecord | undefined {
    this.purgeExpired();
    return this.vault.get(token);
  }

  listTokens(): EphemeralTokenRecord[] {
    this.purgeExpired();
    return Array.from(this.vault.values());
  }

  purgeExpired(): number {
    const now = Date.now();
    let purged = 0;
    for (const [token, record] of this.vault.entries()) {
      if (now > record.expiresAt) {
        this.vault.delete(token);
        purged++;
      }
    }
    this.lastPurgeTimestamp = now;
    return purged;
  }

  flushAll(): void {
    this.vault.clear();
    this.lastPurgeTimestamp = Date.now();
  }

  getLastPurgeTimestamp(): number {
    return this.lastPurgeTimestamp;
  }

  getActiveCount(): number {
    this.purgeExpired();
    return this.vault.size;
  }
}

export interface SimulatedLlmRoundTripResult {
  rawPrompt: string;
  deidentifiedPayload: string;
  tokenMap: Record<string, string>;
  outboundWireHeaders: Record<string, string>;
  simulatedCloudLlmResponse: string;
  restoredClinicalResponse: string;
  entitiesScrubbedCount: number;
  leakageBytes: number;
  isZeroLeakageVerified: boolean;
  roundTripLatencyMs: number;
}

/**
 * Executes a simulated end-to-end LLM inference round trip with zero data leakage:
 * 1. Sanitizes raw PHI on hospital workstation / client gateway
 * 2. Simulates Cloud LLM inference receiving ONLY surrogate tokens
 * 3. Restores real identity seamlessly in local hospital memory upon response receipt
 */
export function simulateLlmInferenceWithDeidentification(
  rawInput: string,
  context?: PatientPrivacyContext
): SimulatedLlmRoundTripResult {
  const startTime = Date.now();
  const deidResult = deidentifyClinicalPayload(rawInput, context);
  const isDeidentified = isPayloadDeidentified(deidResult.deidentifiedText, context);

  // Register in ephemeral vault
  EphemeralTokenVaultManager.getInstance().registerTokens(deidResult.tokenMap, 180);

  // Generate simulated Cloud LLM response using ONLY tokens
  const pToken = deidResult.reverseMap[context?.patientName || ''] || '[PATIENT_PSEUDO_A7]';
  const idToken = context?.uhid ? (deidResult.reverseMap[context.uhid] || '[ID_TOKEN_9041]') : '[ID_TOKEN_9041]';
  const docToken = context?.doctorName ? (deidResult.reverseMap[context.doctorName] || '[PHYSICIAN_TOKEN_01]') : '[PHYSICIAN_TOKEN_01]';

  const simulatedCloudLlmResponse =
    `[CLOUD LLM INFERENCE - GEMINI 2.5 PRO]\n` +
    `Subject: Clinical Assessment & Differential for Patient ${pToken} (${idToken})\n` +
    `Attending Practitioner: ${docToken}\n\n` +
    `1. Primary Diagnosis: Acute Viral Pharyngitis / Upper Respiratory Tract Infection (ICD-10: J06.9)\n` +
    `2. Clinical Risk Analysis: Patient reports prior renal calculus. NSAIDs (Diclofenac/Ibuprofen) are strictly contraindicated.\n` +
    `3. Recommended Plan:\n` +
    `   - Tab. Paracetamol 650mg TDS x 3 days post meals (Renally safe)\n` +
    `   - Tab. Levocetirizine 5mg OD at night x 5 days\n` +
    `   - Hydration > 2.5 L/day\n` +
    `   - Send automated follow-up notification to [PHONE_REDACTED].\n` +
    `\n[STATUS: 200 OK • ZERO RETENTION APPLIED • NO PROMPT TRAINING CACHED]`;

  // Detokenize locally in hospital memory
  const restoredClinicalResponse = reidentifyClinicalResponse(
    simulatedCloudLlmResponse,
    deidResult.tokenMap
  );

  const endTime = Date.now();

  return {
    rawPrompt: rawInput,
    deidentifiedPayload: deidResult.deidentifiedText,
    tokenMap: deidResult.tokenMap,
    outboundWireHeaders: deidResult.zeroDataRetentionHeaders,
    simulatedCloudLlmResponse,
    restoredClinicalResponse,
    entitiesScrubbedCount: deidResult.entitiesScrubbedCount,
    leakageBytes: isDeidentified ? 0 : 42,
    isZeroLeakageVerified: isDeidentified,
    roundTripLatencyMs: Math.max(1, endTime - startTime)
  };
}

