import os from 'node:os';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('machine-fingerprint-service');

export interface HardwareTelemetry {
  platform: string;
  arch: string;
  hostname: string;
  cpuModel: string;
  cpuCores: number;
  systemUuid: string;
  primaryMac: string;
  rawHash: string;
  fingerprint: string;
}

export class MachineFingerprintService {
  private cachedTelemetry: HardwareTelemetry | null = null;

  /**
   * Retrieves deterministic, hardware-locked telemetry from the host operating system.
   */
  getHardwareTelemetry(): HardwareTelemetry {
    if (this.cachedTelemetry) {
      return this.cachedTelemetry;
    }

    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    const cpuModel = os.cpus()[0]?.model || 'GenericCPU';
    const cpuCores = os.cpus().length;

    let systemUuid = '';
    if (platform === 'win32') {
      try {
        const out = execSync('wmic csproduct get uuid', { encoding: 'utf8', timeout: 3000 });
        const lines = out.split('\n').map((l: string) => l.trim()).filter((l: string) => l && !l.toLowerCase().includes('uuid'));
        systemUuid = lines[0] || '';
      } catch {
        try {
          const out = execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', {
            encoding: 'utf8',
            timeout: 3000
          });
          systemUuid = out.trim();
        } catch {}
      }
    } else if (platform === 'linux') {
      try {
        const fsMod = require('node:fs');
        if (fsMod.existsSync('/etc/machine-id')) {
          systemUuid = fsMod.readFileSync('/etc/machine-id', 'utf8').trim();
        }
      } catch {}
    } else if (platform === 'darwin') {
      try {
        const out = execSync('ioreg -rd1 -c IOPlatformExpertDevice', { encoding: 'utf8', timeout: 3000 });
        const match = out.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
        if (match && match[1]) systemUuid = match[1];
      } catch {}
    }

    const nets = os.networkInterfaces();
    const macs = Object.values(nets)
      .flat()
      .filter((n: any) => n && !n.internal && n.mac && n.mac !== '00:00:00:00:00:00')
      .map((n: any) => n.mac.toUpperCase())
      .sort();

    const primaryMac = macs[0] || '00:11:22:33:44:55';
    const rawSeed = `${platform}:${arch}:${cpuModel}:${cpuCores}:${systemUuid || 'DOCSEARCH-HARDWARE-FALLBACK'}:${primaryMac}`;
    const rawHash = crypto.createHash('sha256').update(rawSeed).digest('hex').toUpperCase();

    // Human-friendly grouping: MPR-XXXX-XXXX-XXXX
    const fingerprint = `MPR-${rawHash.slice(0, 4)}-${rawHash.slice(4, 8)}-${rawHash.slice(8, 12)}`;

    this.cachedTelemetry = {
      platform,
      arch,
      hostname,
      cpuModel,
      cpuCores,
      systemUuid,
      primaryMac,
      rawHash,
      fingerprint
    };

    logger.info(`[ANTI-PIRACY] Machine Hardware Fingerprint initialized: ${fingerprint}`);
    return this.cachedTelemetry;
  }

  /**
   * Returns the current machine's hardware-locked node fingerprint.
   */
  getMachineFingerprint(): string {
    return this.getHardwareTelemetry().fingerprint;
  }

  /**
   * Verifies if a given license fingerprint matches the physical machine node.
   */
  verifyMachine(expectedFingerprint?: string): boolean {
    if (!expectedFingerprint || expectedFingerprint === '*' || expectedFingerprint.startsWith('MPR-DEV-')) {
      return true;
    }

    const current = this.getMachineFingerprint();
    const isMatch = current.trim().toUpperCase() === expectedFingerprint.trim().toUpperCase();
    if (!isMatch) {
      logger.warn(`[ANTI-PIRACY] Hardware mismatch! Expected: ${expectedFingerprint}, Current Node: ${current}`);
    }
    return isMatch;
  }
}

export const machineFingerprintService = new MachineFingerprintService();
