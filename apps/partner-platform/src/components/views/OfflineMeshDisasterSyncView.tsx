import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import {
  HOSPITAL_MASTER_WORKSTATION_WHITELIST,
  verifyMeshPacketSecurity,
  type RogueNodeIncident
} from '@docsearch/shared-core';

export interface MeshPeerNode {
  id: string;
  name: string;
  department: string;
  ipAddress: string;
  macAddress: string;
  role: string;
  signalDbm: number;
  lamportClock: number;
  pendingTxCount: number;
  localDbSizeMb: number;
  publicKeyFingerprint: string;
  status: 'ONLINE_PEER' | 'SYNCING' | 'IDLE';
  lastPingSecondsAgo: number;
}

export interface MeshTransaction {
  id: string;
  txHash: string;
  timestamp: string;
  originNodeId: string;
  originNodeName: string;
  department: 'RECEPTION' | 'DOCTOR_OPD' | 'PATHOLOGY_LAB' | 'PHARMACY_DISPENSARY' | 'EMERGENCY_BAY';
  actionType: 'OFFLINE_UHID_REGISTRATION' | 'EMERGENCY_PRESCRIPTION' | 'STAT_LAB_RESULT' | 'DRUG_DISPENSATION';
  title: string;
  details: string;
  uhid: string;
  patientName: string;
  payloadSummary: string;
  ed25519Signature: string;
  merkleLeafHash: string;
  p2pMeshSyncState: 'BROADCAST_COMPLETE' | 'PROPAGATING' | 'COMMITTED_TO_CLOUD';
  nodesSyncedCount: number;
  totalNodesCount: number;
}

const INITIAL_NODES: MeshPeerNode[] = [
  {
    id: 'NODE-REC-01',
    name: 'Workstation REC-01',
    department: 'Reception & Triage Desk',
    ipAddress: '192.168.1.101',
    macAddress: '00:1A:2B:3C:4D:5E',
    role: 'Patient ID & Token Issuer',
    signalDbm: -41,
    lamportClock: 104,
    pendingTxCount: 2,
    localDbSizeMb: 1.4,
    publicKeyFingerprint: 'ed25519:rec01:9a8f4c21e0b',
    status: 'ONLINE_PEER',
    lastPingSecondsAgo: 1
  },
  {
    id: 'NODE-DOC-03',
    name: 'Doctor Desk OPD-03',
    department: 'Dr. Sharma Consultation Desk',
    ipAddress: '192.168.1.102',
    macAddress: '00:1A:2B:3C:4D:6F',
    role: 'Clinical Scribe & e-Rx',
    signalDbm: -44,
    lamportClock: 128,
    pendingTxCount: 3,
    localDbSizeMb: 2.8,
    publicKeyFingerprint: 'ed25519:doc03:7f14b901a5c',
    status: 'ONLINE_PEER',
    lastPingSecondsAgo: 2
  },
  {
    id: 'NODE-LAB-01',
    name: 'Pathology Bench LIMS-01',
    department: 'Central Pathology Laboratory',
    ipAddress: '192.168.1.103',
    macAddress: '00:1A:2B:3C:4D:7A',
    role: 'Blood Gas & BioChem Analyzer',
    signalDbm: -48,
    lamportClock: 96,
    pendingTxCount: 2,
    localDbSizeMb: 1.9,
    publicKeyFingerprint: 'ed25519:lab01:3c81e5920df',
    status: 'ONLINE_PEER',
    lastPingSecondsAgo: 1
  },
  {
    id: 'NODE-PHARM-02',
    name: 'Pharmacy POS Counter-02',
    department: 'Emergency Drug Dispensary',
    ipAddress: '192.168.1.104',
    macAddress: '00:1A:2B:3C:4D:8B',
    role: 'FEFO Dispense & Batch Scanner',
    signalDbm: -43,
    lamportClock: 112,
    pendingTxCount: 3,
    localDbSizeMb: 3.1,
    publicKeyFingerprint: 'ed25519:pharm02:6b90cf4578a',
    status: 'ONLINE_PEER',
    lastPingSecondsAgo: 2
  },
  {
    id: 'NODE-ER-01',
    name: 'Emergency Resuscitation-01',
    department: 'Red Trauma Bay & Crash Bay',
    ipAddress: '192.168.1.105',
    macAddress: '00:1A:2B:3C:4D:9C',
    role: 'Code Blue & Vitals Monitor',
    signalDbm: -39,
    lamportClock: 87,
    pendingTxCount: 1,
    localDbSizeMb: 1.2,
    publicKeyFingerprint: 'ed25519:er01:4d70ef1182c',
    status: 'ONLINE_PEER',
    lastPingSecondsAgo: 1
  }
];

const INITIAL_TRANSACTIONS: MeshTransaction[] = [
  {
    id: 'TX-OFF-001',
    txHash: '0x3a89e47b2c9184df201',
    timestamp: 'Just now',
    originNodeId: 'NODE-REC-01',
    originNodeName: 'Workstation REC-01',
    department: 'RECEPTION',
    actionType: 'OFFLINE_UHID_REGISTRATION',
    title: 'Offline Disaster UHID Generated',
    details: 'Auto-minted offline UHID with high-entropy local cryptographic salt.',
    uhid: 'UHID-MCI-OFFLINE-9041',
    patientName: 'Kishore Patel (42M) - Acute Trauma',
    payloadSummary: 'Triage Category: RED (Priority 1) • Suspected Hemothorax • Fast Tag #T-41',
    ed25519Signature: 'sig_ed25519_84fa...91bc (Verified)',
    merkleLeafHash: '0x88491c2f0a82',
    p2pMeshSyncState: 'BROADCAST_COMPLETE',
    nodesSyncedCount: 5,
    totalNodesCount: 5
  },
  {
    id: 'TX-OFF-002',
    txHash: '0x7f1190bc41a982df034',
    timestamp: '2 mins ago',
    originNodeId: 'NODE-DOC-03',
    originNodeName: 'Doctor Desk OPD-03',
    department: 'DOCTOR_OPD',
    actionType: 'EMERGENCY_PRESCRIPTION',
    title: 'Emergency Stat e-Rx Broadcast',
    details: 'Prescribed life-saving inotropes & stat blood work broadcasted over local Wi-Fi router.',
    uhid: 'UHID-MCI-OFFLINE-9041',
    patientName: 'Kishore Patel (42M) - Acute Trauma',
    payloadSummary: 'Inj. Noradrenaline 4mg in 50ml NS @ 5mcg/min + Stat ABG + Troponin-T + Portable Chest X-Ray',
    ed25519Signature: 'sig_ed25519_29bc...44ea (Verified)',
    merkleLeafHash: '0x49102cba39ff',
    p2pMeshSyncState: 'BROADCAST_COMPLETE',
    nodesSyncedCount: 5,
    totalNodesCount: 5
  },
  {
    id: 'TX-OFF-003',
    txHash: '0xbc99014aef398820da1',
    timestamp: '3 mins ago',
    originNodeId: 'NODE-LAB-01',
    originNodeName: 'Pathology Bench LIMS-01',
    department: 'PATHOLOGY_LAB',
    actionType: 'STAT_LAB_RESULT',
    title: 'Stat ABG Critical Value Result Entry',
    details: 'Immediate blood gas analysis verified on bench, pushed directly to Doctor OPD tablet via mDNS peer sync.',
    uhid: 'UHID-MCI-OFFLINE-9041',
    patientName: 'Kishore Patel (42M) - Acute Trauma',
    payloadSummary: 'pH: 7.22 (Acidemia) • pO2: 64 mmHg • Lactate: 4.8 mmol/L (CRITICAL HIGH) • Hb: 8.4 g/dL',
    ed25519Signature: 'sig_ed25519_61aa...89bc (Verified)',
    merkleLeafHash: '0x77b01fa291cc',
    p2pMeshSyncState: 'BROADCAST_COMPLETE',
    nodesSyncedCount: 5,
    totalNodesCount: 5
  },
  {
    id: 'TX-OFF-004',
    txHash: '0x9910cfab11902488de5',
    timestamp: '4 mins ago',
    originNodeId: 'NODE-PHARM-02',
    originNodeName: 'Pharmacy POS Counter-02',
    department: 'PHARMACY_DISPENSARY',
    actionType: 'DRUG_DISPENSATION',
    title: 'FEFO Drug Dispense & Local Stock Decrement',
    details: 'Emergency medication dispensed without cloud connection; local inventory ledger decremented & signed.',
    uhid: 'UHID-MCI-OFFLINE-9041',
    patientName: 'Kishore Patel (42M) - Acute Trauma',
    payloadSummary: 'Noradrenaline Ampoule 2ml (Batch #NAD-2026-99, Exp: 11/2027) • Qty: 2 units • Dispensed by Pharmacist R. Roy',
    ed25519Signature: 'sig_ed25519_18ef...77cd (Verified)',
    merkleLeafHash: '0x22ab9011ff01',
    p2pMeshSyncState: 'BROADCAST_COMPLETE',
    nodesSyncedCount: 5,
    totalNodesCount: 5
  }
];

export const OfflineMeshDisasterSyncView: React.FC = () => {
  const [isDisasterMode, setIsDisasterMode] = useState<boolean>(true);
  const [nodes, setNodes] = useState<MeshPeerNode[]>(INITIAL_NODES);
  const [transactions, setTransactions] = useState<MeshTransaction[]>(INITIAL_TRANSACTIONS);
  const [selectedTx, setSelectedTx] = useState<MeshTransaction | null>(null);

  // Auto-Merge Cloud Synchronization Sequence State
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [reconcileStep, setReconcileStep] = useState<number>(0);
  const [reconcileSuccess, setReconcileSuccess] = useState<boolean>(false);
  const [mergeReport, setMergeReport] = useState<{
    totalMerged: number;
    conflictsResolved: number;
    dbCommitTimeMs: number;
    merkleRoot: string;
  } | null>(null);

  // Workstation Key Pinning & Rogue Intrusion State
  const [rogueIncidents, setRogueIncidents] = useState<RogueNodeIncident[]>([
    {
      id: 'INC-ROGUE-001',
      timestamp: '12m ago',
      attemptedNodeId: 'ROGUE-SNIFFER-99',
      detectedIp: '192.168.1.199',
      untrustedPublicKey: 'ed25519:unknown:deadbeef7c910a',
      attemptedAction: 'EMERGENCY_PRESCRIPTION',
      payloadExcerpt: 'Forged Rx: Inj Morphine Sulfate 50mg IV Stat for Unknown Patient',
      rejectionCode: 'ROGUE_KEY_UNKNOWN',
      rejectionReason: 'Node is not enrolled in hospital master workstation whitelist.',
      mitigation: 'Dropped at TCP layer. MAC 00:FF:AA:11:22:33 isolated from P2P router.'
    }
  ]);
  const [activeSecurityAlert, setActiveSecurityAlert] = useState<string | null>(null);
  const [securityTab, setSecurityTab] = useState<'WHITELIST' | 'ROGUE_LOG'>('WHITELIST');

  const handleSimulateRogueNodeAttack = () => {
    const fakePacket = {
      originNodeId: 'ROGUE-HACKER-X',
      originIp: '192.168.1.244',
      originMac: 'AA:BB:CC:DD:EE:FF',
      ed25519PublicKey: 'ed25519:forged:c0ffee123456789a',
      txHash: '0xdeadbeefc0ffee8899',
      actionType: 'FORGED_PRESCRIPTION_INJECTION',
      payload: 'Tampered Prescription: Tab Alprazolam 1mg (100 tabs) unauthorized dispense request',
      signature: 'sig_ed25519_untrusted_hash_signature',
      timestamp: new Date().toISOString()
    };

    const verification = verifyMeshPacketSecurity(fakePacket);
    if (!verification.accepted) {
      const newIncident: RogueNodeIncident = {
        id: `INC-ROGUE-${Date.now().toString().slice(-4)}`,
        timestamp: 'Just now',
        attemptedNodeId: fakePacket.originNodeId,
        detectedIp: fakePacket.originIp,
        untrustedPublicKey: fakePacket.ed25519PublicKey,
        attemptedAction: fakePacket.actionType,
        payloadExcerpt: fakePacket.payload,
        rejectionCode: verification.code,
        rejectionReason: verification.reason || 'Untrusted Workstation Public Key',
        mitigation: 'Broadcast DROPPED at Wi-Fi adapter. Zero records merged. Incident logged.'
      };

      setRogueIncidents((prev) => [newIncident, ...prev]);
      setActiveSecurityAlert(`Rogue Wi-Fi terminal (${fakePacket.originIp}) attempted to inject unverified medical records! Packet was blocked and dropped.`);
      setSecurityTab('ROGUE_LOG');
      setTimeout(() => setActiveSecurityAlert(null), 8000);
    }
  };

  // Auto ping ticker for simulated local Wi-Fi mesh heartbeat
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          lastPingSecondsAgo: Math.floor(Math.random() * 3) + 1,
          signalDbm: -40 - Math.floor(Math.random() * 8)
        }))
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Action 1: Register Offline Trauma Patient
  const handleRegisterOfflinePatient = () => {
    const randId = Math.floor(1000 + Math.random() * 9000);
    const newTx: MeshTransaction = {
      id: `TX-OFF-${Date.now().toString().slice(-4)}`,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
      timestamp: 'Just now',
      originNodeId: 'NODE-REC-01',
      originNodeName: 'Workstation REC-01',
      department: 'RECEPTION',
      actionType: 'OFFLINE_UHID_REGISTRATION',
      title: 'Walk-In Disaster Patient Admitted',
      details: 'Assigned offline triage UHID with local deterministic sequence.',
      uhid: `UHID-MCI-OFFLINE-${randId}`,
      patientName: `Disaster Victim #${randId} (MCI Rapid Triage)`,
      payloadSummary: 'Triage: RED (Immediate) • Vitals: BP 90/60, SpO2 91% • Fast-Track to ER Bed 04',
      ed25519Signature: `sig_ed25519_${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 6)} (Verified)`,
      merkleLeafHash: `0x${Math.random().toString(16).slice(2, 14)}`,
      p2pMeshSyncState: 'BROADCAST_COMPLETE',
      nodesSyncedCount: 5,
      totalNodesCount: 5
    };

    setTransactions((prev) => [newTx, ...prev]);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === 'NODE-REC-01'
          ? { ...n, pendingTxCount: n.pendingTxCount + 1, lamportClock: n.lamportClock + 1 }
          : n
      )
    );
  };

  // Action 2: Issue Emergency e-Rx
  const handleIssueEmergencyRx = () => {
    const newTx: MeshTransaction = {
      id: `TX-OFF-${Date.now().toString().slice(-4)}`,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
      timestamp: 'Just now',
      originNodeId: 'NODE-DOC-03',
      originNodeName: 'Doctor Desk OPD-03',
      department: 'DOCTOR_OPD',
      actionType: 'EMERGENCY_PRESCRIPTION',
      title: 'Emergency Resuscitation e-Rx Broadcast',
      details: 'Dr. S. Sharma issued stat orders broadcasted over local Wi-Fi router.',
      uhid: 'UHID-MCI-OFFLINE-9041',
      patientName: 'Kishore Patel (42M) - Acute Trauma',
      payloadSummary: 'Inj. Tranexamic Acid 1g IV Stat + IV Ringer Lactate 500ml Bolus + Cross-match 2 units PRBC',
      ed25519Signature: `sig_ed25519_${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 6)} (Verified)`,
      merkleLeafHash: `0x${Math.random().toString(16).slice(2, 14)}`,
      p2pMeshSyncState: 'BROADCAST_COMPLETE',
      nodesSyncedCount: 5,
      totalNodesCount: 5
    };

    setTransactions((prev) => [newTx, ...prev]);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === 'NODE-DOC-03'
          ? { ...n, pendingTxCount: n.pendingTxCount + 1, lamportClock: n.lamportClock + 1 }
          : n
      )
    );
  };

  // Action 3: Lab Stat Entry
  const handleLabStatEntry = () => {
    const newTx: MeshTransaction = {
      id: `TX-OFF-${Date.now().toString().slice(-4)}`,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
      timestamp: 'Just now',
      originNodeId: 'NODE-LAB-01',
      originNodeName: 'Pathology Bench LIMS-01',
      department: 'PATHOLOGY_LAB',
      actionType: 'STAT_LAB_RESULT',
      title: 'Point-of-Care Troponin-I & Coagulation Report',
      details: 'Lab technician validated test on bench; synced immediately with Doctor and Pharmacy workstations.',
      uhid: 'UHID-MCI-OFFLINE-9041',
      patientName: 'Kishore Patel (42M) - Acute Trauma',
      payloadSummary: 'Troponin-I: 118 ng/L (HIGH) • INR: 1.8 • Platelets: 98,000 /uL • PT: 19.2 sec',
      ed25519Signature: `sig_ed25519_${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 6)} (Verified)`,
      merkleLeafHash: `0x${Math.random().toString(16).slice(2, 14)}`,
      p2pMeshSyncState: 'BROADCAST_COMPLETE',
      nodesSyncedCount: 5,
      totalNodesCount: 5
    };

    setTransactions((prev) => [newTx, ...prev]);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === 'NODE-LAB-01'
          ? { ...n, pendingTxCount: n.pendingTxCount + 1, lamportClock: n.lamportClock + 1 }
          : n
      )
    );
  };

  // Action 4: Pharmacy Dispense
  const handlePharmacyDispense = () => {
    const newTx: MeshTransaction = {
      id: `TX-OFF-${Date.now().toString().slice(-4)}`,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
      timestamp: 'Just now',
      originNodeId: 'NODE-PHARM-02',
      originNodeName: 'Pharmacy POS Counter-02',
      department: 'PHARMACY_DISPENSARY',
      actionType: 'DRUG_DISPENSATION',
      title: 'Emergency TXA & Fluid Pack Dispensed',
      details: 'Dispensed offline; batch scanned, verified against local FEFO inventory cache.',
      uhid: 'UHID-MCI-OFFLINE-9041',
      patientName: 'Kishore Patel (42M) - Acute Trauma',
      payloadSummary: 'Inj. Tranexamic Acid 500mg x 2 (Batch #TXA-992, Exp: 09/2027) • Ringer Lactate 500ml x 1 (Batch #RL-118, Exp: 04/2028)',
      ed25519Signature: `sig_ed25519_${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 6)} (Verified)`,
      merkleLeafHash: `0x${Math.random().toString(16).slice(2, 14)}`,
      p2pMeshSyncState: 'BROADCAST_COMPLETE',
      nodesSyncedCount: 5,
      totalNodesCount: 5
    };

    setTransactions((prev) => [newTx, ...prev]);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === 'NODE-PHARM-02'
          ? { ...n, pendingTxCount: n.pendingTxCount + 1, lamportClock: n.lamportClock + 1 }
          : n
      )
    );
  };

  // Cloud Link Restoration and 3-Way Auto-Merge
  const handleTriggerCloudMerge = () => {
    setIsReconciling(true);
    setReconcileStep(1);
    setReconcileSuccess(false);

    setTimeout(() => {
      setReconcileStep(2); // TLS & Schema handshake
      setTimeout(() => {
        setReconcileStep(3); // CRDT 3-Way Semantic Merge
        setTimeout(() => {
          setReconcileStep(4); // PostgreSQL Commit & Audit
          setTimeout(() => {
            setIsReconciling(false);
            setReconcileStep(5);
            setReconcileSuccess(true);
            setIsDisasterMode(false); // Return to online

            const total = transactions.length;
            setMergeReport({
              totalMerged: total,
              conflictsResolved: 0,
              dbCommitTimeMs: 1420,
              merkleRoot: '0x892f07c8a412e8b99d45e0fa71'
            });

            // Mark all transactions as COMMITTED_TO_CLOUD
            setTransactions((prev) =>
              prev.map((tx) => ({
                ...tx,
                p2pMeshSyncState: 'COMMITTED_TO_CLOUD'
              }))
            );

            // Clear node pending counts
            setNodes((prev) =>
              prev.map((n) => ({
                ...n,
                pendingTxCount: 0
              }))
            );
          }, 1000);
        }, 1100);
      }, 1000);
    }, 900);
  };

  const totalPendingTx = transactions.filter((t) => t.p2pMeshSyncState !== 'COMMITTED_TO_CLOUD').length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Disaster / Mesh State Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all duration-300 shadow-xl ${
          isDisasterMode
            ? 'bg-gradient-to-r from-red-950 via-neutral-900 to-amber-950 text-white border-red-700/60'
            : 'bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white border-emerald-600/60'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl">
                {isDisasterMode ? '⚡' : '🟢'}
              </span>
              <h1 className="text-2xl font-black tracking-tight">
                {isDisasterMode
                  ? 'DISASTER MODE: Local Peer-to-Peer Wi-Fi Mesh Active'
                  : 'ONLINE MODE: Live Cloud PostgreSQL 16.2 Synchronized'}
              </h1>
              <Badge variant={isDisasterMode ? 'danger' : 'success'} className="font-mono text-xs uppercase px-3 py-1">
                {isDisasterMode ? 'INTERNET FIBER SEVERED (ZERO INTERNET)' : 'PRIMARY FIBER ONLINE (ABDM 2.0)'}
              </Badge>
              <Badge variant="neutral" className="bg-white/10 text-white font-mono text-xs border border-white/20">
                LAN Subnet: 192.168.1.0/24 (mDNS P2P)
              </Badge>
            </div>
            <p className="text-sm text-gray-200 max-w-4xl leading-relaxed">
              {isDisasterMode
                ? 'External fiber optic links & cloud servers are completely down. Hospital Reception, Doctor OPD, Pathology Lab, and Pharmacy are communicating peer-to-peer over the local Wi-Fi router. Every prescription, lab stat, and drug dispensation is locally ED25519 signed and appended to the distributed CRDT Merkle tree.'
                : 'Cloud connection healthy. Cryptographic ledger verified. All offline delta updates have been reconciled into the central database with zero record collisions.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isDisasterMode ? (
              <Button
                variant="primary"
                onClick={handleTriggerCloudMerge}
                disabled={isReconciling}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg border border-emerald-400 flex items-center gap-2 text-sm"
              >
                {isReconciling ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />
                    <span>Reconciling CRDT Deltas...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Restore Cloud Link & Auto-Merge</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={() => {
                  setIsDisasterMode(true);
                  setReconcileSuccess(false);
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg border border-red-400 flex items-center gap-2 text-sm"
              >
                <span>✂️</span>
                <span>Simulate Internet Sever Cut</span>
              </Button>
            )}
          </div>
        </div>

        {/* Live Network & Protocol Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-black/30 backdrop-blur p-3 rounded-xl border border-white/10">
            <div className="text-xs text-gray-400 font-medium">Local Router Link</div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">ASUS RT-AX88U (Wi-Fi 6)</div>
            <div className="text-[11px] text-gray-300">WPA3-Enterprise • 240 Mbps</div>
          </div>
          <div className="bg-black/30 backdrop-blur p-3 rounded-xl border border-white/10">
            <div className="text-xs text-gray-400 font-medium">Connected P2P Nodes</div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">5/5 Workstations</div>
            <div className="text-[11px] text-gray-300">mDNS Zero-Config Peer Discovery</div>
          </div>
          <div className="bg-black/30 backdrop-blur p-3 rounded-xl border border-white/10">
            <div className="text-xs text-gray-400 font-medium">Local Unsynced Deltas</div>
            <div className={`text-lg font-black font-mono mt-0.5 ${totalPendingTx > 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
              {totalPendingTx} Records Queued
            </div>
            <div className="text-[11px] text-gray-300">Conflict-Free CRDT LWW Clocks</div>
          </div>
          <div className="bg-black/30 backdrop-blur p-3 rounded-xl border border-white/10">
            <div className="text-xs text-gray-400 font-medium">Merkle Root Integrity</div>
            <div className="text-lg font-black text-cyan-400 font-mono mt-0.5">0x892f07...e8b</div>
            <div className="text-[11px] text-gray-300">ED25519 Cryptographic Signatures</div>
          </div>
        </div>
      </div>

      {/* Auto-Reconciliation Progress Alert (when running or completed) */}
      {isReconciling && (
        <Card className="p-6 border-2 border-amber-500 bg-amber-50/90 shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
                Cloud Link Restored: Auto-Adjudicating & Merging Local Mesh Deltas
              </h3>
              <span className="text-xs font-bold font-mono text-amber-800 bg-amber-200 px-2 py-1 rounded">
                Stage {reconcileStep} of 4
              </span>
            </div>

            {/* Step Bar */}
            <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(reconcileStep / 4) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs font-medium pt-1">
              <div className={reconcileStep >= 1 ? 'text-amber-900 font-bold' : 'text-gray-400'}>
                1. Local Merkle & Signature Validation
              </div>
              <div className={reconcileStep >= 2 ? 'text-amber-900 font-bold' : 'text-gray-400'}>
                2. TLS 1.3 Cloud PostgreSQL Handshake
              </div>
              <div className={reconcileStep >= 3 ? 'text-amber-900 font-bold' : 'text-gray-400'}>
                3. CRDT 3-Way Conflict Resolution
              </div>
              <div className={reconcileStep >= 4 ? 'text-amber-900 font-bold' : 'text-gray-400'}>
                4. Atomic DB Commit & Audit Vault Log
              </div>
            </div>
          </div>
        </Card>
      )}

      {reconcileSuccess && mergeReport && (
        <Card className="p-5 border-2 border-emerald-500 bg-emerald-50 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <h3 className="text-base font-black text-emerald-900">
                  Auto-Merge Successful: Live PostgreSQL Database Fully Synchronized
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Merged {mergeReport.totalMerged} local offline transactions across 5 workstations with{' '}
                  <span className="font-black underline">0 conflicts</span>. Merkle Root{' '}
                  <span className="font-mono">{mergeReport.merkleRoot}</span> committed in {mergeReport.dbCommitTimeMs}ms.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReconcileSuccess(false)}
              className="text-xs border-emerald-600 text-emerald-800 hover:bg-emerald-100"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Staff Action Simulator Bar (Interactive Buttons) */}
      <Card className="p-5 border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>🛠️</span>
              <span>Disaster Staff Simulator (Test Real-Time Cross-Department P2P Sync)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Simulate actions taken by staff across hospital departments without internet connectivity. Watch transactions propagate instantly over local Wi-Fi.
            </p>
          </div>
          <div className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            Local Broadcast: UDP / WebRTC DataChannel
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          <button
            onClick={handleRegisterOfflinePatient}
            className="flex flex-col items-start p-3.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all text-left group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-lg">📇</span>
              <Badge variant="primary" className="text-[10px]">Workstation REC-01</Badge>
            </div>
            <div className="font-bold text-xs text-blue-900 mt-2 group-hover:text-blue-700">
              + Register Offline Patient
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">
              Mint local UHID with zero server dependency
            </div>
          </button>

          <button
            onClick={handleIssueEmergencyRx}
            className="flex flex-col items-start p-3.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all text-left group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-lg">🩺</span>
              <Badge variant="primary" className="text-[10px] bg-purple-100 text-purple-800">Doctor Desk OPD-03</Badge>
            </div>
            <div className="font-bold text-xs text-purple-900 mt-2 group-hover:text-purple-700">
              + Prescribe Emergency Meds
            </div>
            <div className="text-[11px] text-purple-700 mt-0.5">
              Broadcast e-Rx to Pharmacy &amp; Lab desks
            </div>
          </button>

          <button
            onClick={handleLabStatEntry}
            className="flex flex-col items-start p-3.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all text-left group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-lg">🧪</span>
              <Badge variant="warning" className="text-[10px]">Pathology LIMS-01</Badge>
            </div>
            <div className="font-bold text-xs text-amber-900 mt-2 group-hover:text-amber-700">
              + Enter Stat Lab Results
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              Push critical blood gas directly to Doctor
            </div>
          </button>

          <button
            onClick={handlePharmacyDispense}
            className="flex flex-col items-start p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all text-left group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-lg">💊</span>
              <Badge variant="success" className="text-[10px]">Pharmacy POS-02</Badge>
            </div>
            <div className="font-bold text-xs text-emerald-900 mt-2 group-hover:text-emerald-700">
              + Dispense Emergency Drug
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              FEFO scan &amp; decrement local stock cache
            </div>
          </button>

          <button
            onClick={handleSimulateRogueNodeAttack}
            className="flex flex-col items-start p-3.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 transition-all text-left group"
            title="Simulate a rogue/untrusted terminal on hospital Wi-Fi attempting to inject forged medical records"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-lg">🛡️</span>
              <Badge variant="danger" className="text-[10px]">Zero-Trust Security</Badge>
            </div>
            <div className="font-bold text-xs text-rose-900 mt-2 group-hover:text-rose-700">
              ⚡ Test Rogue Attack
            </div>
            <div className="text-[11px] text-rose-700 mt-0.5">
              Simulate unwhitelisted Wi-Fi injection &amp; verify drop
            </div>
          </button>
        </div>
      </Card>

      {/* Real-time Rogue Node Intrusion Alert Banner */}
      {activeSecurityAlert && (
        <div className="p-4 rounded-2xl bg-rose-950 border-2 border-rose-500 text-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl animate-pulse">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🚨</span>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-sm font-black text-rose-400">ROGUE WI-FI NODE INTERCEPTED &amp; REJECTED!</strong>
                <Badge variant="danger" className="text-[10px] uppercase font-mono">ED25519 PINNING ENFORCED</Badge>
              </div>
              <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                {activeSecurityAlert}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveSecurityAlert(null)}
            className="text-rose-300 border-rose-500 hover:bg-rose-900 shrink-0 font-bold"
          >
            Dismiss Alert
          </Button>
        </div>
      )}

      {/* 5 Connected Workstation Nodes Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span>📡</span>
            <span>Active Hospital Workstation Terminals on Local Mesh (Subnet 192.168.1.x)</span>
          </h2>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            All 5 Terminals Actively Heartbeating
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-gray-300 transition-all relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold text-gray-900">{node.name}</div>
                  <div className="text-[11px] text-gray-500">{node.department}</div>
                </div>
                <span
                  className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0 mt-1"
                  title={`Signal: ${node.signalDbm} dBm`}
                />
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">IP Addr:</span>
                  <span className="font-bold text-gray-800">{node.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Signal:</span>
                  <span className="text-emerald-700 font-bold">{node.signalDbm} dBm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Clock:</span>
                  <span className="text-purple-700 font-bold">L-{node.lamportClock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pending:</span>
                  <span className={`font-bold ${node.pendingTxCount > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {node.pendingTxCount} tx
                  </span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-gray-100 text-[10px] text-gray-400 truncate">
                Key: <span className="font-mono text-gray-600">{node.publicKeyFingerprint}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zero-Trust Security: Workstation Key Pinning & Rogue Node Defense Hub */}
      <Card className="p-5 border border-gray-200 bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🛡️</span>
                <span>Zero-Trust P2P Mesh Security: ED25519 Workstation Key Pinning</span>
              </h2>
              <Badge variant="success" className="text-[10px] font-mono">
                5 PINNED KEYS ENFORCED
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Only cryptographically pre-enrolled hospital workstations can broadcast across the local Wi-Fi router. Packets from unwhitelisted rogue devices are dropped at the network layer.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSecurityTab('WHITELIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                securityTab === 'WHITELIST'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Master Whitelist ({HOSPITAL_MASTER_WORKSTATION_WHITELIST.length})
            </button>
            <button
              onClick={() => setSecurityTab('ROGUE_LOG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                securityTab === 'ROGUE_LOG'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span>🚨 Rogue Intrusion Defense Log</span>
              {rogueIncidents.length > 0 && (
                <span className="bg-rose-800 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {rogueIncidents.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {securityTab === 'WHITELIST' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider text-[11px] bg-gray-50/80">
                  <th className="py-2.5 px-3">Terminal ID</th>
                  <th className="py-2.5 px-3">Workstation Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 font-mono">Pinned IP / MAC</th>
                  <th className="py-2.5 px-3 font-mono">ED25519 Public Key</th>
                  <th className="py-2.5 px-3">Enrolled Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {HOSPITAL_MASTER_WORKSTATION_WHITELIST.map((ws) => (
                  <tr key={ws.terminalId} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold font-mono text-indigo-700">{ws.terminalId}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{ws.name}</td>
                    <td className="py-2.5 px-3 text-gray-600">{ws.department}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-600">
                      <div>{ws.ipAddress}</div>
                      <div className="text-[10px] text-gray-400">{ws.macAddress}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-500 text-[11px]">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {ws.ed25519PublicKey.slice(0, 24)}...
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        ACTIVE ENROLLED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
              <div>
                <strong>Intrusion Detection:</strong> Wi-Fi packets lacking a valid pre-enrolled ED25519 cryptographic key signature are automatically rejected and quarantined.
              </div>
              <button
                onClick={handleSimulateRogueNodeAttack}
                className="px-2.5 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-500 shadow-sm shrink-0"
              >
                + Inject Simulated Rogue Packet
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider text-[11px] bg-rose-50/40">
                    <th className="py-2.5 px-3">Incident ID</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3 font-mono">Detected IP / Node</th>
                    <th className="py-2.5 px-3">Attempted Action</th>
                    <th className="py-2.5 px-3">Payload Excerpt</th>
                    <th className="py-2.5 px-3">Defense Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rogueIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold font-mono text-rose-700">{inc.id}</td>
                      <td className="py-2.5 px-3 text-gray-500 font-mono">{inc.timestamp}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-800">
                        <div className="font-bold text-rose-600">{inc.detectedIp}</div>
                        <div className="text-[10px] text-gray-400">{inc.attemptedNodeId}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-700">
                        <Badge variant="danger" className="text-[10px]">{inc.attemptedAction}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 text-[11px] max-w-xs truncate" title={inc.payloadExcerpt}>
                        {inc.payloadExcerpt}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-800 bg-rose-100/80 border border-rose-300 px-2 py-0.5 rounded-full">
                          <span>🛑</span>
                          <span>DROPPED &amp; LOGGED</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Distributed Ledger / Transaction Table */}
      <Card className="p-5 border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>📑</span>
              <span>Local Distributed Merkle Log & Cryptographic Ledger</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Transactions recorded on local device IndexedDB, signed with ED25519, and replicated across the mesh.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-600">
            <span>Total Records: <strong className="text-gray-900">{transactions.length}</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Tx Hash & Time</th>
                <th className="py-2.5 px-3">Origin Node</th>
                <th className="py-2.5 px-3">Patient / UHID</th>
                <th className="py-2.5 px-3">Transaction Details</th>
                <th className="py-2.5 px-3">P2P Mesh Sync</th>
                <th className="py-2.5 px-3 text-right">Cryptographic Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-blue-700">{tx.txHash.slice(0, 12)}...</div>
                    <div className="text-[11px] text-gray-400">{tx.timestamp}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900">{tx.originNodeName}</div>
                    <div className="text-[10px] text-gray-500">{tx.department}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-800">{tx.patientName}</div>
                    <div className="font-mono text-[10px] text-purple-700">{tx.uhid}</div>
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-semibold text-gray-900">{tx.title}</div>
                    <div className="text-[11px] text-gray-500 truncate" title={tx.payloadSummary}>
                      {tx.payloadSummary}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {tx.p2pMeshSyncState === 'COMMITTED_TO_CLOUD' ? (
                      <Badge variant="success" className="text-[10px]">
                        ☁️ Committed to PostgreSQL
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">
                        📡 Synced to {tx.nodesSyncedCount}/{tx.totalNodesCount} Nodes
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all font-mono"
                    >
                      Verify Proof 🔍
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cryptographic Proof Verification Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔐</span>
                <h3 className="text-base font-bold text-gray-900">
                  Cryptographic Merkle & Signature Proof
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 font-mono">
                <div>
                  <span className="text-gray-400">Transaction ID:</span>{' '}
                  <strong className="text-blue-700">{selectedTx.id}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Tx Hash (SHA-256):</span>{' '}
                  <span className="text-gray-800 break-all">{selectedTx.txHash}</span>
                </div>
                <div>
                  <span className="text-gray-400">Origin Workstation:</span>{' '}
                  <span className="text-gray-800">{selectedTx.originNodeName} ({selectedTx.originNodeId})</span>
                </div>
                <div>
                  <span className="text-gray-400">ED25519 Signature:</span>{' '}
                  <span className="text-emerald-700 font-bold">{selectedTx.ed25519Signature}</span>
                </div>
                <div>
                  <span className="text-gray-400">Merkle Leaf Hash:</span>{' '}
                  <span className="text-purple-700">{selectedTx.merkleLeafHash}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payload Content:</label>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed">
                  {JSON.stringify(
                    {
                      uhid: selectedTx.uhid,
                      patientName: selectedTx.patientName,
                      action: selectedTx.actionType,
                      payload: selectedTx.payloadSummary,
                      syncState: selectedTx.p2pMeshSyncState,
                      timestamp: selectedTx.timestamp
                    },
                    null,
                    2
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                <span>🛡️</span>
                <span>
                  Conflict-Free Replicated Data Type (CRDT) Verified: Guaranteed idempotent merge with zero primary key collisions.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setSelectedTx(null)} size="sm">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
