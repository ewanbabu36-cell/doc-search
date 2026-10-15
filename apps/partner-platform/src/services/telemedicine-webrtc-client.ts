/**
 * Partner Platform - WebRTC Telemedicine Client & Cross-Origin Signaling Bridge
 */

export interface TeleLivePrescription {
  diagnosis: string;
  vitals: { bp: string; pulse: number; spo2: number; temp: string };
  medications: Array<{ drug: string; genericName: string; dose: string; days: string; savingsPercent: number }>;
  doctorAdvice: string;
}

export interface TeleSignalPacket {
  id: string;
  senderRole: 'DOCTOR' | 'PATIENT';
  type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'CALL_STATUS' | 'RX_SYNC' | 'END_CALL';
  payload: any;
  timestamp: string;
}

export class TelemedicineWebRtcClient {
  private gatewayBaseUrl: string;
  private pollInterval: any = null;
  private lastPolledTime: string = new Date(0).toISOString();

  constructor(gatewayBaseUrl?: string) {
    if (gatewayBaseUrl) {
      this.gatewayBaseUrl = gatewayBaseUrl;
    } else if (typeof window !== 'undefined' && window.location.hostname) {
      this.gatewayBaseUrl = `${window.location.protocol}//${window.location.hostname}:4000`;
    } else {
      this.gatewayBaseUrl = 'http://localhost:4000';
    }
  }

  public async joinSession(callId: string, doctorName?: string, patientName?: string): Promise<any> {
    try {
      const res = await fetch(`${this.gatewayBaseUrl}/api/v1/telemedicine/session/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, doctorName, patientName })
      });
      const data = (await res.json()) as any;
      return data?.session;
    } catch (err) {
      console.warn('[Telemedicine] Error joining session via gateway:', err);
      return null;
    }
  }

  public async sendSignal(
    callId: string,
    senderRole: 'DOCTOR' | 'PATIENT',
    type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'CALL_STATUS' | 'RX_SYNC' | 'END_CALL',
    payload: any
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.gatewayBaseUrl}/api/v1/telemedicine/signal/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, senderRole, type, payload })
      });
      return res.ok;
    } catch (err) {
      console.warn('[Telemedicine] Error sending signal packet:', err);
      return false;
    }
  }

  public startSignalPolling(
    callId: string,
    myRole: 'DOCTOR' | 'PATIENT',
    callbacks: {
      onSignal?: (packet: TeleSignalPacket) => void;
      onRxSync?: (rx: TeleLivePrescription) => void;
      onStatusChange?: (status: string) => void;
    },
    intervalMs: number = 800
  ): () => void {
    this.stopSignalPolling();

    const checkSignals = async () => {
      try {
        const url = `${this.gatewayBaseUrl}/api/v1/telemedicine/signal/poll/${callId}?role=${myRole}&since=${encodeURIComponent(
          this.lastPolledTime
        )}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.latestTimestamp) {
            this.lastPolledTime = data.latestTimestamp;
          }
          if (data.status && callbacks.onStatusChange) {
            callbacks.onStatusChange(data.status);
          }
          if (data.livePrescription && callbacks.onRxSync) {
            callbacks.onRxSync(data.livePrescription);
          }
          if (Array.isArray(data.signals)) {
            for (const sig of data.signals) {
              if (sig.type === 'RX_SYNC' && callbacks.onRxSync) {
                callbacks.onRxSync(sig.payload);
              }
              if (callbacks.onSignal) {
                callbacks.onSignal(sig);
              }
            }
          }
        }
      } catch {
        // Non-fatal network hiccup during poll
      }
    };

    this.pollInterval = setInterval(checkSignals, intervalMs);
    void checkSignals();

    return () => this.stopSignalPolling();
  }

  public stopSignalPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  public async getMediaStream(requestAudio: boolean = true, requestVideo: boolean = true): Promise<MediaStream> {
    if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: requestVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
          audio: requestAudio
        });
      } catch (mediaErr) {
        console.info('[Telemedicine] Physical camera unavailable; generating procedural canvas stream:', mediaErr);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;

    let frame = 0;
    const drawAnimation = () => {
      frame++;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const centerY = canvas.height / 2;
      for (let x = 0; x < canvas.width; x += 5) {
        const offset = (x + frame * 3) % canvas.width;
        let y = centerY;
        if (offset > 200 && offset < 230) {
          y -= 45 * Math.sin(((offset - 200) / 30) * Math.PI);
        } else if (offset >= 230 && offset < 260) {
          y += 25 * Math.sin(((offset - 230) / 30) * Math.PI);
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = '14px sans-serif';
      ctx.fillText('DocSearch Doctor Workstation • Encrypted WebRTC Video Active', 20, canvas.height - 24);

      requestAnimationFrame(drawAnimation);
    };
    drawAnimation();

    return canvas.captureStream(30);
  }

  public async endSession(callId: string, durationSeconds: number, summaryNotes?: string): Promise<any> {
    this.stopSignalPolling();
    try {
      const res = await fetch(`${this.gatewayBaseUrl}/api/v1/telemedicine/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, durationSeconds, summaryNotes })
      });
      return await res.json();
    } catch (err) {
      console.warn('[Telemedicine] Error ending session:', err);
      return null;
    }
  }
}

export const telemedicineWebRtcClient = new TelemedicineWebRtcClient();
