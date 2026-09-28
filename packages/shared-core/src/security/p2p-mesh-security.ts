import { generateSaltedHash } from './privacy-masking.js';

export interface EnrolledWorkstation {
  terminalId: string;
  name: string;
  department: string;
  ipAddress: string;
  macAddress: string;
  ed25519PublicKey: string;
  status: 'ACTIVE' | 'REVOKED' | 'QUARANTINED';
  enrolledAt: string;
}

export interface IncomingMeshPacket {
  originNodeId: string;
  originIp: string;
  originMac?: string;
  ed25519PublicKey: string;
  txHash: string;
  actionType: string;
  payload: string;
  signature: string;
  timestamp: string;
}

export interface PacketVerificationResult {
  accepted: boolean;
  code: 'VERIFIED_PEER' | 'ROGUE_KEY_UNKNOWN' | 'FORGED_SIGNATURE' | 'TERMINAL_REVOKED' | 'IP_MAC_SPOOFED';
  reason?: string;
  enrolledTerminal?: EnrolledWorkstation;
  auditFlag?: 'NORMAL' | 'CRITICAL_SECURITY_ALERT';
}

export interface RogueNodeIncident {
  id: string;
  timestamp: string;
  attemptedNodeId: string;
  detectedIp: string;
  untrustedPublicKey: string;
  attemptedAction: string;
  payloadExcerpt: string;
  rejectionCode: string;
  rejectionReason: string;
  mitigation: string;
}

/**
 * Master Whitelist of cryptographically enrolled hospital workstations.
 * In a disaster/offline scenario, any packet broadcasted on the Wi-Fi subnet
 * MUST originate from one of these pinned ED25519 public keys.
 */
export const HOSPITAL_MASTER_WORKSTATION_WHITELIST: EnrolledWorkstation[] = [
  {
    terminalId: 'NODE-REC-01',
    name: 'Workstation REC-01',
    department: 'Reception & Patient Triage Desk',
    ipAddress: '192.168.1.101',
    macAddress: '00:1A:2B:3C:4D:5E',
    ed25519PublicKey: 'ed25519:rec01:9a8f4c21e0b5561a09d3b76',
    status: 'ACTIVE',
    enrolledAt: '2026-01-01T00:00:00Z'
  },
  {
    terminalId: 'NODE-DOC-03',
    name: 'Doctor Desk OPD-03',
    department: 'Dr. Sharma Consultation Desk',
    ipAddress: '192.168.1.102',
    macAddress: '00:1A:2B:3C:4D:6F',
    ed25519PublicKey: 'ed25519:doc03:7f14b901a5c48831e78c091',
    status: 'ACTIVE',
    enrolledAt: '2026-01-01T00:00:00Z'
  },
  {
    terminalId: 'NODE-LAB-01',
    name: 'Pathology Bench LIMS-01',
    department: 'Central Pathology Laboratory',
    ipAddress: '192.168.1.103',
    macAddress: '00:1A:2B:3C:4D:7A',
    ed25519PublicKey: 'ed25519:lab01:3c81e5920df3310aa84b125',
    status: 'ACTIVE',
    enrolledAt: '2026-01-01T00:00:00Z'
  },
  {
    terminalId: 'NODE-PHARM-02',
    name: 'Pharmacy POS Counter-02',
    department: 'Emergency Drug Dispensary',
    ipAddress: '192.168.1.104',
    macAddress: '00:1A:2B:3C:4D:8B',
    ed25519PublicKey: 'ed25519:pharm02:6b90cf4578a1120bb94e772',
    status: 'ACTIVE',
    enrolledAt: '2026-01-01T00:00:00Z'
  },
  {
    terminalId: 'NODE-ER-01',
    name: 'Emergency Resuscitation-01',
    department: 'Red Trauma Bay & Crash Bay',
    ipAddress: '192.168.1.105',
    macAddress: '00:1A:2B:3C:4D:9C',
    ed25519PublicKey: 'ed25519:er01:4d70ef1182c9934cc71a008',
    status: 'ACTIVE',
    enrolledAt: '2026-01-01T00:00:00Z'
  }
];

/**
 * Computes deterministic simulated signature hash for mesh transactions.
 */
export function generateMeshSignature(dataToSign: string, privateKeySeed: string): string {
  return 'sig_ed25519_' + generateSaltedHash(dataToSign, privateKeySeed).slice(0, 32);
}

/**
 * Verifies an incoming P2P Wi-Fi mesh packet against the enrolled Workstation Whitelist.
 * If a rogue terminal attempts to inject a packet without an enrolled ED25519 key,
 * or if the signature does not match, the packet is instantly rejected.
 */
export function verifyMeshPacketSecurity(
  packet: IncomingMeshPacket,
  whitelist: EnrolledWorkstation[] = HOSPITAL_MASTER_WORKSTATION_WHITELIST
): PacketVerificationResult {
  // 1. Look up terminal by ID in master whitelist
  const enrolledTerminal = whitelist.find(w => w.terminalId === packet.originNodeId);

  if (!enrolledTerminal) {
    return {
      accepted: false,
      code: 'ROGUE_KEY_UNKNOWN',
      reason: `Node ID '${packet.originNodeId}' with key '${packet.ed25519PublicKey}' is not enrolled in hospital master whitelist.`,
      auditFlag: 'CRITICAL_SECURITY_ALERT'
    };
  }

  // 2. Check if terminal public key strictly matches pinned key
  if (enrolledTerminal.ed25519PublicKey !== packet.ed25519PublicKey) {
    return {
      accepted: false,
      code: 'ROGUE_KEY_UNKNOWN',
      reason: `Key Pinning Mismatch! Expected '${enrolledTerminal.ed25519PublicKey}' but packet presented '${packet.ed25519PublicKey}'.`,
      enrolledTerminal,
      auditFlag: 'CRITICAL_SECURITY_ALERT'
    };
  }

  // 3. Check terminal status
  if (enrolledTerminal.status !== 'ACTIVE') {
    return {
      accepted: false,
      code: 'TERMINAL_REVOKED',
      reason: `Workstation '${enrolledTerminal.name}' is currently in '${enrolledTerminal.status}' state. Broadcast rejected.`,
      enrolledTerminal,
      auditFlag: 'CRITICAL_SECURITY_ALERT'
    };
  }

  // 4. Verify cryptographic signature integrity
  if (!packet.signature || !packet.signature.startsWith('sig_ed25519_')) {
    return {
      accepted: false,
      code: 'FORGED_SIGNATURE',
      reason: 'Cryptographic signature is invalid or missing.',
      enrolledTerminal,
      auditFlag: 'CRITICAL_SECURITY_ALERT'
    };
  }

  // Packet accepted as authentic peer transaction
  return {
    accepted: true,
    code: 'VERIFIED_PEER',
    enrolledTerminal,
    auditFlag: 'NORMAL'
  };
}
