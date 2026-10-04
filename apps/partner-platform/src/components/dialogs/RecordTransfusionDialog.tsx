import React, { useState, useMemo } from 'react';
import { Button, Input, Badge } from '@docsearch/ui-kit';
import type { RecordTransfusionRequest, BloodComponentType, TransfusionBloodGroup } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RecordTransfusionRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

// ABO/Rh Compatibility Engine (PRBC Red Cell Recipient Rules)
function checkCompatibility(patientGroup: TransfusionBloodGroup, donorGroup: TransfusionBloodGroup, compType: BloodComponentType): { compatible: boolean; reason: string } {
  if (compType.includes('PLASMA')) {
    // For Plasma (FFP), AB is universal donor, O is universal recipient
    if (donorGroup.startsWith('AB')) return { compatible: true, reason: 'Universal Plasma Donor (AB)' };
    if (patientGroup === donorGroup) return { compatible: true, reason: 'Iso-group Plasma Match' };
    return { compatible: false, reason: `Plasma ABO incompatibility: Patient ${patientGroup} cannot receive ${donorGroup} plasma` };
  }

  // Red Blood Cells (PRBC) rules
  if (donorGroup === 'O_NEGATIVE') {
    return { compatible: true, reason: 'Universal PRBC Donor (O-Negative)' };
  }
  if (patientGroup === 'AB_POSITIVE') {
    return { compatible: true, reason: 'Universal PRBC Recipient (AB-Positive)' };
  }
  if (patientGroup === donorGroup) {
    return { compatible: true, reason: 'Exact Iso-group Match' };
  }

  const pBase = patientGroup.split('_')[0];
  const dBase = donorGroup.split('_')[0];
  const pRh = patientGroup.includes('POSITIVE') ? '+' : '-';
  const dRh = donorGroup.includes('POSITIVE') ? '+' : '-';

  // Rh factor: Rh- cannot receive Rh+
  if (pRh === '-' && dRh === '+') {
    return { compatible: false, reason: `FATAL Rh Mismatch: Rh-Negative patient cannot receive Rh-Positive blood!` };
  }

  // ABO base compatibility
  if (pBase === dBase) return { compatible: true, reason: `Rh-Compatible Sub-group Match (${pBase})` };
  if (dBase === 'O') return { compatible: true, reason: 'Compatible Donor (Type O)' };

  return {
    compatible: false,
    reason: `FATAL ABO Incompatibility: Recipient ${patientGroup.replace('_', ' ')} CANNOT receive ${donorGroup.replace('_', ' ')} PRBC!`
  };
}

export const RecordTransfusionDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patient] = useState('David K. Miller');
  const [mrn] = useState('MRN-772101');
  const [scannedMrn, setScannedMrn] = useState('MRN-772101');
  const [patientBloodGroup, setPatientBloodGroup] = useState<TransfusionBloodGroup>('O_NEGATIVE');

  const [compCode] = useState('PRBC-2026-08-001');
  const [scannedBagCode, setScannedBagCode] = useState('PRBC-2026-08-001');
  const [compType, setCompType] = useState<BloodComponentType>('PACKED_RED_BLOOD_CELLS_PRBC');
  const [donorBloodGroup, setDonorBloodGroup] = useState<TransfusionBloodGroup>('O_NEGATIVE');

  const [nurse1, setNurse1] = useState('Nurse Mark Hopkins, RN (Reg: RN-9821)');
  const [nurse2, setNurse2] = useState('Nurse Sunita James, RN (Reg: RN-4402)');
  const [doc, setDoc] = useState('Dr. Marcus Vance, MD');

  const [pulse, setPulse] = useState('114');
  const [bp, setBp] = useState('90/58');
  const [temp, setTemp] = useState('98.4');

  const [coldChainIssueMinutes, setColdChainIssueMinutes] = useState(14);
  const [isCrossMatchVerified, setIsCrossMatchVerified] = useState(true);
  const [loading, setLoading] = useState(false);

  // Check live compatibility
  const compatibility = useMemo(() => {
    return checkCompatibility(patientBloodGroup, donorBloodGroup, compType);
  }, [patientBloodGroup, donorBloodGroup, compType]);

  // Check 2-step barcode match
  const wristbandScanned = scannedMrn.trim() === mrn.trim();
  const bagBarcodeScanned = scannedBagCode.trim() === compCode.trim();
  const coldChainSafe = coldChainIssueMinutes <= 30;

  const canProceed = wristbandScanned && bagBarcodeScanned && compatibility.compatible && coldChainSafe;

  if (!isOpen) return null;

  const handleVerifyCrossMatch = () => {
    if (!compatibility.compatible) return;
    setIsCrossMatchVerified(true);

    hospitalEventBus.publish(
      'BLOOD_CROSS_MATCH_VERIFIED',
      'BEDSIDE_TRANSFUSION_GATE',
      {
        patientName: patient,
        patientMrn: mrn,
        componentCode: compCode,
        componentType: compType,
        patientBloodGroup,
        donorBloodGroup,
        administeringNurse: nurse1,
        verifyingNurse: nurse2,
        lockToken: `COMPAT-LOCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        verifiedAt: new Date().toISOString()
      },
      `Bedside 2-Step Cross-Match Verified: Patient ${patient} (${patientBloodGroup}) matches Unit ${compCode} (${donorBloodGroup}). Lock token generated.`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;

    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientName: patient,
        patientMrn: mrn,
        encounterId: 'ee-001',
        componentCode: compCode,
        componentType: compType,
        bloodGroup: donorBloodGroup,
        administeredByNurse: `${nurse1} [Dual-Verified: ${nurse2}]`,
        supervisingDoctorName: doc,
        startTime: new Date().toISOString(),
        preTransfusionPulse: parseInt(pulse) || 80,
        preTransfusionBp: bp,
        preTransfusionTempF: parseFloat(temp) || 98.6
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Bedside Blood Transfusion Administration Lockout</h2>
              <Badge variant="primary">NABH Standard</Badge>
            </div>
            <p className="text-xs text-gray-500">Dual-nurse identity verification, 2-step barcode cross-match & 30-minute cold-chain transit gate</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Bedside 2-Step Barcode Verification */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px]">1</span>
                2-Step Barcode Cross-Match & Identity Scan
              </span>
              {wristbandScanned && bagBarcodeScanned ? (
                <Badge variant="success">✓ Dual-Barcode Matched</Badge>
              ) : (
                <Badge variant="warning">Scan Required</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Step 1A: Patient Wristband Barcode (MRN / UHID)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={scannedMrn}
                    onChange={(e) => setScannedMrn(e.target.value)}
                    placeholder="Scan Patient Wristband"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScannedMrn(mrn)}
                  >
                    Simulate
                  </Button>
                </div>
                {wristbandScanned ? (
                  <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">✓ Wristband verified ({patient})</span>
                ) : (
                  <span className="text-[10px] text-red-600 font-bold mt-0.5 block">⚠️ Wristband does not match MRN {mrn}!</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Step 1B: Blood Bag DIN / Unit Barcode
                </label>
                <div className="flex gap-2">
                  <Input
                    value={scannedBagCode}
                    onChange={(e) => setScannedBagCode(e.target.value)}
                    placeholder="Scan Blood Bag Barcode"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScannedBagCode(compCode)}
                  >
                    Simulate
                  </Button>
                </div>
                {bagBarcodeScanned ? (
                  <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">✓ Blood Unit Barcode verified</span>
                ) : (
                  <span className="text-[10px] text-red-600 font-bold mt-0.5 block">⚠️ Blood Bag barcode mismatch!</span>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: ABO / Rh Compatibility Engine */}
          <div className={`p-3.5 rounded-lg border transition ${compatibility.compatible ? 'bg-emerald-50/50 border-emerald-300' : 'bg-red-50 border-red-400'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px]">2</span>
                ABO & Rh Compatibility Evaluation
              </span>
              <Badge variant={compatibility.compatible ? 'success' : 'danger'}>
                {compatibility.compatible ? 'COMPATIBLE' : 'FATAL MISMATCH'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
              <div>
                <span className="text-gray-500 block text-[10px]">Patient Blood Group:</span>
                <select
                  value={patientBloodGroup}
                  onChange={(e) => setPatientBloodGroup(e.target.value as TransfusionBloodGroup)}
                  className="w-full text-xs font-bold border border-gray-300 rounded p-1"
                >
                  <option value="O_NEGATIVE">O Negative</option>
                  <option value="O_POSITIVE">O Positive</option>
                  <option value="A_POSITIVE">A Positive</option>
                  <option value="A_NEGATIVE">A Negative</option>
                  <option value="B_POSITIVE">B Positive</option>
                  <option value="B_NEGATIVE">B Negative</option>
                  <option value="AB_POSITIVE">AB Positive</option>
                  <option value="AB_NEGATIVE">AB Negative</option>
                </select>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">Donor Unit Group:</span>
                <select
                  value={donorBloodGroup}
                  onChange={(e) => setDonorBloodGroup(e.target.value as TransfusionBloodGroup)}
                  className="w-full text-xs font-bold border border-gray-300 rounded p-1 text-red-700"
                >
                  <option value="O_NEGATIVE">O Negative</option>
                  <option value="O_POSITIVE">O Positive</option>
                  <option value="A_POSITIVE">A Positive</option>
                  <option value="A_NEGATIVE">A Negative</option>
                  <option value="B_POSITIVE">B Positive</option>
                  <option value="B_NEGATIVE">B Negative</option>
                  <option value="AB_POSITIVE">AB Positive</option>
                  <option value="AB_NEGATIVE">AB Negative</option>
                </select>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">Component:</span>
                <select
                  value={compType}
                  onChange={(e) => setCompType(e.target.value as BloodComponentType)}
                  className="w-full text-xs font-semibold border border-gray-300 rounded p-1"
                >
                  <option value="PACKED_RED_BLOOD_CELLS_PRBC">PRBC</option>
                  <option value="SINGLE_DONOR_PLATELETS_SDP">SDP Platelets</option>
                  <option value="RANDOM_DONOR_PLATELETS_RDP">RDP Platelets</option>
                  <option value="FRESH_FROZEN_PLASMA_FFP">FFP Plasma</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  size="sm"
                  variant={isCrossMatchVerified ? 'outline' : 'primary'}
                  onClick={handleVerifyCrossMatch}
                  disabled={!compatibility.compatible}
                  className="w-full text-xs"
                >
                  {isCrossMatchVerified ? '✓ Verified' : 'Verify Match'}
                </Button>
              </div>
            </div>

            <p className={`text-[11px] font-semibold ${compatibility.compatible ? 'text-emerald-700' : 'text-red-700 font-black animate-pulse'}`}>
              {compatibility.reason}
            </p>
          </div>

          {/* STEP 3: Cold-Chain 30-Minute Transit Window */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px]">3</span>
                Cold-Chain 30-Minute Bedside Hang Rule
              </span>
              <Badge variant={coldChainSafe ? 'success' : 'danger'}>
                {coldChainSafe ? `${coldChainIssueMinutes}m Elapsed (Safe)` : `${coldChainIssueMinutes}m Elapsed (BREACH)`}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <p className="text-[11px]">
                NABH Cold-Chain Standard: Blood unit must be initiated bedside within <strong>30 minutes</strong> of leaving the Blood Bank refrigerator (2°C–6°C).
              </p>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-gray-500 whitespace-nowrap">Transit Mins:</label>
                <input
                  type="number"
                  value={coldChainIssueMinutes}
                  onChange={(e) => setColdChainIssueMinutes(parseInt(e.target.value) || 0)}
                  className="w-14 text-xs font-bold border border-gray-300 rounded p-1 text-center"
                />
              </div>
            </div>
            {!coldChainSafe && (
              <p className="text-[10px] font-bold text-red-600 mt-1">
                ⚠️ COLD-CHAIN BREACH: Unit has been outside temperature control for &gt; 30 minutes! Return to blood bank for thermal assessment.
              </p>
            )}
          </div>

          {/* STEP 4: Dual-Nurse Safety Sign-Off & Baseline Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Administering Nurse (RN)</label>
              <Input value={nurse1} onChange={(e) => setNurse1(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Dual-Verifying Bedside Nurse (RN)</label>
              <Input value={nurse2} onChange={(e) => setNurse2(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Supervising MD</label>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pre-Pulse (bpm)</label>
              <Input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pre-BP (mmHg)</label>
              <Input value={bp} onChange={(e) => setBp(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pre-Temp (°F)</label>
              <Input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} required />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <span className="text-[11px] text-gray-500 font-mono">
              Encounter: ee-001 • Patient: {mrn}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant={canProceed ? 'primary' : 'outline'}
                type="submit"
                disabled={loading || !canProceed}
              >
                {loading ? 'Starting...' : canProceed ? 'Start Bedside Transfusion' : 'Locked (Check Safety Gates)'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

