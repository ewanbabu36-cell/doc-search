import React, { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '@docsearch/ui-kit';
import type { TransfusionRecordDto, BloodIssueDto, BloodComponentDto, TransfusionBloodGroup } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  transfusions: TransfusionRecordDto[];
  issues?: BloodIssueDto[] | undefined;
  components?: BloodComponentDto[] | undefined;
  onOpenObservation: (t: TransfusionRecordDto) => void;
  onOpenReaction: (t: TransfusionRecordDto) => void;
  onOpenNewTransfusion: () => void;
}

// Red Blood Cell ABO/Rh Compatibility Matrix
const PRBC_COMPATIBILITY_MATRIX: Record<TransfusionBloodGroup, TransfusionBloodGroup[]> = {
  O_NEGATIVE: ['O_NEGATIVE'],
  O_POSITIVE: ['O_NEGATIVE', 'O_POSITIVE'],
  A_NEGATIVE: ['O_NEGATIVE', 'A_NEGATIVE'],
  A_POSITIVE: ['O_NEGATIVE', 'O_POSITIVE', 'A_NEGATIVE', 'A_POSITIVE'],
  B_NEGATIVE: ['O_NEGATIVE', 'B_NEGATIVE'],
  B_POSITIVE: ['O_NEGATIVE', 'O_POSITIVE', 'B_NEGATIVE', 'B_POSITIVE'],
  AB_NEGATIVE: ['O_NEGATIVE', 'A_NEGATIVE', 'B_NEGATIVE', 'AB_NEGATIVE'],
  AB_POSITIVE: [
    'O_NEGATIVE',
    'O_POSITIVE',
    'A_NEGATIVE',
    'A_POSITIVE',
    'B_NEGATIVE',
    'B_POSITIVE',
    'AB_NEGATIVE',
    'AB_POSITIVE'
  ]
};

export const TransfusionWorkbenchView: React.FC<Props> = ({
  transfusions,
  issues = [],
  components = [],
  onOpenObservation,
  onOpenReaction,
  onOpenNewTransfusion
}) => {
  // Bedside 2-Step Barcode Scanner State
  const [patientScan, setPatientScan] = useState('MRN-772101');
  const [patientName, setPatientName] = useState('David K. Miller');
  const [patientBloodGroup, setPatientBloodGroup] = useState<TransfusionBloodGroup>('O_NEGATIVE');

  const [unitScan, setUnitScan] = useState('PRBC-2026-08-001');
  const [unitBloodGroup, setUnitBloodGroup] = useState<TransfusionBloodGroup>('O_NEGATIVE');
  const [componentType, setComponentType] = useState('PACKED_RED_BLOOD_CELLS_PRBC');

  const [verifiedToken, setVerifiedToken] = useState<string | null>('COMPAT-LOCK-ABO-88219');
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Cold-chain transit telemetry simulated calculations
  const inTransitIssues = issues.map((iss) => {
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - new Date(iss.issuedAt).getTime()) / 60000));
    const isColdChainBreach = elapsedMinutes > 30;
    const isColdChainWarning = elapsedMinutes >= 20 && elapsedMinutes <= 30;
    return {
      ...iss,
      elapsedMinutes,
      isColdChainBreach,
      isColdChainWarning
    };
  });

  // Evaluate ABO compatibility for the scanner station
  const isCompatible = useMemo(() => {
    if (componentType.includes('PLASMA')) {
      // Plasma: AB is universal donor, O is universal recipient
      if (unitBloodGroup.startsWith('AB')) return true;
      return patientBloodGroup === unitBloodGroup;
    }
    const compatibleDonors = PRBC_COMPATIBILITY_MATRIX[patientBloodGroup] || [];
    return compatibleDonors.includes(unitBloodGroup);
  }, [patientBloodGroup, unitBloodGroup, componentType]);

  const handleVerifyBedsideCrossMatch = () => {
    if (!isCompatible) {
      setVerificationFeedback('FATAL ABO INCOMPATIBILITY! Transfusion strictly blocked by system safety gate.');
      setVerifiedToken(null);
      return;
    }

    const token = `COMPAT-LOCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setVerifiedToken(token);
    setVerificationFeedback(`Dual-scan cross-match PASSED. Lock token: ${token}`);

    hospitalEventBus.publish(
      'BLOOD_CROSS_MATCH_VERIFIED',
      'BEDSIDE_TRANSFUSION_WORKBENCH',
      {
        patientName,
        patientMrn: patientScan,
        unitScan,
        componentType,
        patientBloodGroup,
        unitBloodGroup,
        lockToken: token,
        timestamp: new Date().toISOString()
      },
      `Bedside 2-Step Barcode Cross-Match Verified: Patient ${patientName} (${patientBloodGroup}) matches Unit ${unitScan} (${unitBloodGroup}).`
    );
  };

  const handleBroadcastColdChainBreach = (iss: typeof inTransitIssues[0]) => {
    hospitalEventBus.publish(
      'COLD_CHAIN_BREACH_ALERTED',
      'COLD_CHAIN_TRANSIT_MONITOR',
      {
        issueCode: iss.issueCode,
        componentCode: iss.componentCode,
        patientName: iss.patientName,
        patientMrn: iss.patientMrn,
        elapsedMinutes: iss.elapsedMinutes,
        destinationDepartment: iss.destinationDepartment,
        timestamp: new Date().toISOString()
      },
      `COLD-CHAIN BREACH ALERT: Unit ${iss.componentCode} issued to ${iss.destinationDepartment} has exceeded 30-min window (${iss.elapsedMinutes}m elapsed). Administration blocked.`
    );
    alert(`Cold-Chain Breach reported for Unit ${iss.componentCode}. Blood Bank officer notified.`);
  };

  // Metrics
  const activeTransfusions = transfusions.filter((t) => t.status === 'IN_PROGRESS');
  const uneventfulTransfusions = transfusions.filter((t) => t.status === 'COMPLETED_UNEVENTFUL');
  const haltedTransfusions = transfusions.filter((t) => t.status === 'HALTED_DUE_TO_REACTION');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Bedside Blood Transfusion Administration Cockpit</h2>
            <Badge variant="primary">Dual-Scan Lockout Active</Badge>
          </div>
          <p className="text-xs text-gray-500">
            2-Step barcode cross-match verification, 30-minute cold-chain transit tracking & 1-tap adverse reaction emergency abort
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Bank Stock: {components.length} Units</Badge>
          <Button variant="primary" onClick={onOpenNewTransfusion}>
            + Initiate Bedside Transfusion
          </Button>
        </div>
      </div>

      {/* KPI Telemetry */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-blue-50/50 border-blue-200">
          <div className="text-xs font-semibold text-blue-700">Active Infusions</div>
          <div className="text-xl font-black text-blue-900 mt-1">{activeTransfusions.length} Running</div>
          <p className="text-[10px] text-blue-600 mt-0.5">Continuous bedside monitoring</p>
        </Card>
        <Card className="p-3 bg-emerald-50/50 border-emerald-200">
          <div className="text-xs font-semibold text-emerald-700">Uneventful Completions</div>
          <div className="text-xl font-black text-emerald-900 mt-1">{uneventfulTransfusions.length} Finished</div>
          <p className="text-[10px] text-emerald-600 mt-0.5">Post-vitals recorded</p>
        </Card>
        <Card className="p-3 bg-amber-50/50 border-amber-200">
          <div className="text-xs font-semibold text-amber-700">Cold-Box In-Transit</div>
          <div className="text-xl font-black text-amber-900 mt-1">{inTransitIssues.length} En Route</div>
          <p className="text-[10px] text-amber-600 mt-0.5">30-min window tracking</p>
        </Card>
        <Card className="p-3 bg-red-50/50 border-red-200">
          <div className="text-xs font-semibold text-red-700">Halted / Adverse Incidents</div>
          <div className="text-xl font-black text-red-900 mt-1">{haltedTransfusions.length} Alerted</div>
          <p className="text-[10px] text-red-600 mt-0.5">Quarantined for STAT DAT & culture</p>
        </Card>
      </div>

      {/* SECTION 1: BEDSIDE 2-STEP BARCODE CROSS-MATCH & COMPATIBILITY STATION */}
      <Card className="p-5 border-2 border-slate-300 shadow-sm bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">1</span>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Bedside 2-Step Barcode Cross-Match & ABO Compatibility Verification Station
            </h3>
          </div>
          {verifiedToken ? (
            <Badge variant="success">🛡️ Locked Token: {verifiedToken}</Badge>
          ) : isCompatible ? (
            <Badge variant="warning">Verification Pending</Badge>
          ) : (
            <Badge variant="danger">ABO MISMATCH DETECTED</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1A: Patient Wristband Barcode */}
          <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-800">
                Step 1: Patient Wristband Scan (UHID / MRN)
              </label>
              <span className="text-[10px] text-gray-500 font-mono">Wristband RFID / Code 128</span>
            </div>
            <Input
              value={patientScan}
              onChange={(e) => setPatientScan(e.target.value)}
              placeholder="Scan Patient Wristband"
            />
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="font-semibold text-gray-900 border-b border-gray-200 focus:outline-none text-xs"
                />
                <span className="text-[10px] text-gray-500 ml-2">MRN: {patientScan}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">Group:</span>
                <select
                  value={patientBloodGroup}
                  onChange={(e) => {
                    setPatientBloodGroup(e.target.value as TransfusionBloodGroup);
                    setVerifiedToken(null);
                  }}
                  className="text-xs font-bold rounded border border-gray-300 px-1 py-0.5"
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
            </div>
          </div>

          {/* Step 1B: Blood Bag Barcode */}
          <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-800">
                Step 2: Blood Bag DIN Barcode Scan
              </label>
              <span className="text-[10px] text-gray-500 font-mono">ISBT-128 Unit Barcode</span>
            </div>
            <Input
              value={unitScan}
              onChange={(e) => setUnitScan(e.target.value)}
              placeholder="Scan Blood Bag DIN Barcode"
            />
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-slate-800">{unitScan}</span>
                <select
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value)}
                  className="text-[10px] text-gray-600 border border-gray-200 rounded px-1 py-0.5"
                >
                  <option value="PACKED_RED_BLOOD_CELLS_PRBC">PRBC</option>
                  <option value="SINGLE_DONOR_PLATELETS_SDP">SDP</option>
                  <option value="RANDOM_DONOR_PLATELETS_RDP">RDP</option>
                  <option value="FRESH_FROZEN_PLASMA_FFP">FFP</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">Unit Group:</span>
                <select
                  value={unitBloodGroup}
                  onChange={(e) => {
                    setUnitBloodGroup(e.target.value as TransfusionBloodGroup);
                    setVerifiedToken(null);
                  }}
                  className="text-xs font-bold rounded border border-gray-300 px-1 py-0.5 text-red-700"
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
            </div>
          </div>
        </div>

        {/* Compatibility Verdict & Verification Action */}
        <div className="mt-3 p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black ${isCompatible ? 'text-emerald-700' : 'text-red-700'}`}>
                {isCompatible ? '✓ ABO/Rh SEROLOGIC COMPATIBILITY CONFIRMED' : '⛔ FATAL ABO/Rh INCOMPATIBILITY DETECTED!'}
              </span>
              <span className="text-[11px] text-gray-500">
                (Recipient: <strong>{patientBloodGroup.replace('_', ' ')}</strong> ↔ Donor Unit: <strong>{unitBloodGroup.replace('_', ' ')}</strong>)
              </span>
            </div>
            {verificationFeedback && (
              <p className="text-[11px] text-emerald-800 font-medium mt-0.5">{verificationFeedback}</p>
            )}
            {!isCompatible && (
              <p className="text-[11px] text-red-600 font-bold mt-0.5 animate-pulse">
                Patient cannot receive this blood unit! Administering this unit will induce an acute intravascular hemolytic reaction.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isCompatible ? 'primary' : 'outline'}
              size="sm"
              disabled={!isCompatible}
              onClick={handleVerifyBedsideCrossMatch}
            >
              {verifiedToken ? '✓ Re-Verify Dual Scan' : 'Confirm Bedside Cross-Match'}
            </Button>
          </div>
        </div>
      </Card>

      {/* SECTION 2: COLD-CHAIN & MONITORED COLD-BOX TRANSIT TELEMETRY */}
      {inTransitIssues.length > 0 && (
        <Card className="p-4 border-amber-300/80 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/40">
          <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                Cold-Box Transit Telemetry & 30-Minute Bedside Hang Rule
              </h3>
            </div>
            <span className="text-[11px] text-amber-800 font-medium">
              NABH Protocol: Hang within 30 min of refrigerator dispatch
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inTransitIssues.map((iss) => (
              <div
                key={iss.id}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  iss.isColdChainBreach
                    ? 'bg-red-50 border-red-400'
                    : iss.isColdChainWarning
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-emerald-50/50 border-emerald-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{iss.componentCode}</span>
                    <span className="text-[10px] font-semibold text-gray-600">→ {iss.destinationDepartment}</span>
                    <Badge variant={iss.isColdChainBreach ? 'danger' : iss.isColdChainWarning ? 'warning' : 'success'}>
                      {iss.elapsedMinutes}m elapsed
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-700 mt-1">
                    Patient: <strong>{iss.patientName}</strong> ({iss.patientMrn}) • Cold-Box Temp: {iss.transportBoxTemperatureC}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Issued: {new Date(iss.issuedAt).toLocaleTimeString()} by {iss.issuingTechnicianName}
                  </p>
                </div>
                <div>
                  {iss.isColdChainBreach ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleBroadcastColdChainBreach(iss)}
                    >
                      🚨 Report Breach
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700">
                      ✓ Safe ({30 - iss.elapsedMinutes}m left)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SECTION 3: ACTIVE BEDSIDE TRANSFUSIONS TABLE */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">3</span>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Bedside Transfusion Infusion Grid & Adverse Reaction Console
            </h3>
          </div>
          <span className="text-xs text-gray-500">Live bedside vital telemetry</span>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Transfusion ID</th>
              <th className="p-3">Patient Name / MRN</th>
              <th className="p-3">Component & Unit DIN</th>
              <th className="p-3">Administering Nurse</th>
              <th className="p-3">Pre-Transfusion Vitals</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Bedside Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transfusions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-mono font-bold text-slate-900">{t.transfusionCode}</td>
                <td className="p-3">
                  <div className="font-semibold text-gray-900">{t.patientName}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{t.patientMrn} • {t.bloodGroup.replace('_', ' ')}</div>
                </td>
                <td className="p-3 text-xs">
                  <div className="font-medium text-gray-800">{t.componentType.replace(/_/g, ' ')}</div>
                  <div className="font-mono text-slate-600 text-[11px]">{t.componentCode}</div>
                </td>
                <td className="p-3 text-xs text-gray-700">{t.administeredByNurse}</td>
                <td className="p-3 text-xs">
                  <span className="font-semibold text-gray-800">HR: {t.preTransfusionPulse} bpm</span> • BP: {t.preTransfusionBp} • Temp: {t.preTransfusionTempF}°F
                </td>
                <td className="p-3">
                  <Badge variant={t.status === 'COMPLETED_UNEVENTFUL' ? 'success' : t.status === 'IN_PROGRESS' ? 'primary' : 'danger'}>
                    {t.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    {t.status === 'IN_PROGRESS' && (
                      <Button variant="outline" size="sm" onClick={() => onOpenObservation(t)}>
                        Post-Vitals
                      </Button>
                    )}
                    <Button
                      variant={t.status === 'HALTED_DUE_TO_REACTION' ? 'outline' : 'danger'}
                      size="sm"
                      onClick={() => onOpenReaction(t)}
                    >
                      {t.status === 'HALTED_DUE_TO_REACTION' ? 'View Reaction' : '🚨 Abort & Report'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

