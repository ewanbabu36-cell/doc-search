/**
 * DocSearch Autonomous Clinical & Financial Web Worker
 * Offloads compute-intensive hospital tasks from the V8 main UI thread
 * to maintain buttery smooth 60-120 FPS render performance.
 */

export interface ComputeMessageRequest {
  id: string;
  type: 'CALCULATE_BATCH_NEWS2' | 'GENERATE_REPORT_CSV' | 'CALCULATE_DICOM_LUT';
  payload: any;
}

export interface ComputeMessageResponse {
  id: string;
  type: string;
  success: boolean;
  result?: any;
  error?: string;
  durationMs: number;
}

// 1. Heavy NEWS2 Score Engine
function computeNews2(v: {
  respRate: number;
  spo2: number;
  onOxygen: boolean;
  systolicBp: number;
  pulse: number;
  consciousness: 'A' | 'V' | 'P' | 'U';
  temp: number;
}): { score: number; risk: 'LOW' | 'MEDIUM' | 'HIGH'; qSofaAlert: boolean } {
  let score = 0;

  // Respiration rate
  if (v.respRate <= 8) score += 3;
  else if (v.respRate <= 11) score += 1;
  else if (v.respRate <= 20) score += 0;
  else if (v.respRate <= 24) score += 2;
  else score += 3;

  // SpO2
  if (v.spo2 <= 91) score += 3;
  else if (v.spo2 <= 93) score += 2;
  else if (v.spo2 <= 95) score += 1;

  // Oxygen
  if (v.onOxygen) score += 2;

  // Systolic BP
  if (v.systolicBp <= 90) score += 3;
  else if (v.systolicBp <= 100) score += 2;
  else if (v.systolicBp <= 110) score += 1;
  else if (v.systolicBp >= 220) score += 3;

  // Pulse
  if (v.pulse <= 40) score += 3;
  else if (v.pulse <= 50) score += 1;
  else if (v.pulse <= 90) score += 0;
  else if (v.pulse <= 110) score += 1;
  else if (v.pulse <= 130) score += 2;
  else score += 3;

  // Consciousness
  if (v.consciousness !== 'A') score += 3;

  // Temperature
  if (v.temp <= 35.0) score += 3;
  else if (v.temp <= 36.0) score += 1;
  else if (v.temp <= 38.0) score += 0;
  else if (v.temp <= 39.0) score += 1;
  else score += 2;

  const risk = score >= 7 ? 'HIGH' : score >= 5 ? 'MEDIUM' : 'LOW';
  const qSofaAlert = (v.respRate >= 22 ? 1 : 0) + (v.consciousness !== 'A' ? 1 : 0) + (v.systolicBp <= 100 ? 1 : 0) >= 2;

  return { score, risk, qSofaAlert };
}

// 2. High-speed CSV Serializer
function generateCsv(data: { headers: string[]; rows: (string | number)[][] }): string {
  const headerLine = data.headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');
  const rowLines = data.rows.map((row) =>
    row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  );
  return [headerLine, ...rowLines].join('\r\n');
}

// 3. DICOM Window Leveling LUT Generator
function calculateDicomLut(params: { windowCenter: number; windowWidth: number; bitDepth?: number }): Uint8ClampedArray {
  const { windowCenter, windowWidth, bitDepth = 12 } = params;
  const numEntries = Math.pow(2, bitDepth);
  const lut = new Uint8ClampedArray(numEntries);

  const lowerBound = windowCenter - 0.5 - (windowWidth - 1) / 2;
  const upperBound = windowCenter - 0.5 + (windowWidth - 1) / 2;

  for (let i = 0; i < numEntries; i++) {
    if (i <= lowerBound) {
      lut[i] = 0;
    } else if (i > upperBound) {
      lut[i] = 255;
    } else {
      lut[i] = Math.round(((i - (windowCenter - 0.5)) / (windowWidth - 1) + 0.5) * 255);
    }
  }

  return lut;
}

// Worker message listener
self.onmessage = (event: MessageEvent<ComputeMessageRequest>) => {
  const start = performance.now();
  const { id, type, payload } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'CALCULATE_BATCH_NEWS2': {
        const patients = Array.isArray(payload) ? payload : [payload];
        result = patients.map((p) => ({
          patientId: p.patientId,
          ...computeNews2(p.vitals)
        }));
        break;
      }

      case 'GENERATE_REPORT_CSV': {
        result = generateCsv(payload);
        break;
      }

      case 'CALCULATE_DICOM_LUT': {
        result = calculateDicomLut(payload);
        break;
      }

      default:
        throw new Error(`Unsupported compute message type: ${type}`);
    }

    const response: ComputeMessageResponse = {
      id,
      type,
      success: true,
      result,
      durationMs: performance.now() - start
    };

    self.postMessage(response);
  } catch (err: any) {
    const errorResponse: ComputeMessageResponse = {
      id,
      type,
      success: false,
      error: err?.message || 'Unknown worker error',
      durationMs: performance.now() - start
    };
    self.postMessage(errorResponse);
  }
};
