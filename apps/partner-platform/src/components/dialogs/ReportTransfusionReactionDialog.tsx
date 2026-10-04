import React, { useState } from 'react';
import { Button, Input, Badge } from '@docsearch/ui-kit';
import type { TransfusionRecordDto, ReportTransfusionReactionRequest, TransfusionReactionSeverity } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transfusion: TransfusionRecordDto | null;
  onSubmit: (req: ReportTransfusionReactionRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

const COMMON_SYMPTOMS = [
  'Rigors / Chills',
  'Temp Rise ≥ 2.0°F',
  'Tachycardia (>120 bpm)',
  'Hypotension (SBP drop >30)',
  'Acute Dyspnea / Wheeze',
  'Severe Flank / Back Pain',
  'Dark / Red Urine (Hemoglobinuria)',
  'Facial Angioedema & Urticaria'
];

export const ReportTransfusionReactionDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  transfusion,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [severity, setSeverity] = useState<TransfusionReactionSeverity>('HEMOLYTIC_TRANSFUSION_REACTION');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Rigors / Chills',
    'Temp Rise ≥ 2.0°F',
    'Tachycardia (>120 bpm)'
  ]);
  const [symptoms, setSymptoms] = useState('Severe rigors, shivering, sudden temperature spike of 2.4°F, pulse jumped to 132 bpm, SBP dropped to 82/50 mmHg.');
  const [interventions, setInterventions] = useState('Infusion clamped & stopped immediately; IV line flushed with normal saline; IV Diphenhydramine 50mg + IV Hydrocortisone 100mg given; Bag & line quarantined.');
  const [doc, setDoc] = useState('Dr. Marcus Vance, MD (Attending Physician)');
  const [clerical, setClerical] = useState(true);
  const [autoOrderStatLabs, setAutoOrderStatLabs] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !transfusion) return null;

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
      if (!symptoms.includes(sym)) {
        setSymptoms((prev) => (prev ? `${prev}; ${sym}` : sym));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        transfusionId: transfusion.id,
        patientName: transfusion.patientName,
        patientMrn: transfusion.patientMrn,
        componentCode: transfusion.componentCode,
        severity,
        symptomsObserved: symptoms,
        immediateInterventions: interventions,
        notifiedPhysicianName: doc,
        clericalCheckConfirmedMatching: clerical
      });

      // Emit high-priority audio-visual panic telemetry to Hematologist & Blood Bank
      hospitalEventBus.publish(
        'TRANSFUSION_REACTION_ALERTED',
        'BEDSIDE_TRANSFUSION_ALERT',
        {
          transfusionId: transfusion.id,
          patientName: transfusion.patientName,
          patientMrn: transfusion.patientMrn,
          componentCode: transfusion.componentCode,
          severity,
          symptoms: selectedSymptoms,
          statLabsOrdered: autoOrderStatLabs ? [
            'STAT Repeat ABO & Cross-Match',
            'Direct Antiglobulin Test (DAT / Coombs)',
            'Plasma & Urine Free Hemoglobin',
            'Blood Unit & Line Bacterial Culture'
          ] : [],
          notifiedPhysician: doc,
          timestamp: new Date().toISOString()
        },
        `PANIC ALERT: Transfusion reaction (${severity.replace(/_/g, ' ')}) in Patient ${transfusion.patientName} (${transfusion.patientMrn}). Unit ${transfusion.componentCode} halted & quarantined.`
      );

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl border-2 border-red-500 my-8">
        {/* Panic Header */}
        <div className="flex items-start justify-between border-b border-red-200 pb-3 mb-4 bg-red-50 -mx-6 -mt-6 p-6 rounded-t-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <h2 className="text-lg font-black text-red-950 uppercase tracking-wide">
                STAT Adverse Transfusion Reaction Emergency Abort
              </h2>
            </div>
            <p className="text-xs text-red-800 font-semibold mt-1">
              Transfusion: <span className="font-mono">{transfusion.transfusionCode}</span> • Patient: {transfusion.patientName} ({transfusion.patientMrn}) • Unit: {transfusion.componentCode}
            </p>
          </div>
          <Badge variant="danger">EMERGENCY</Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reaction Severity */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">
              Clinical Reaction Classification
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as TransfusionReactionSeverity)}
              className="w-full rounded-md border-2 border-red-400 bg-red-50/50 px-3 py-2 text-sm font-black text-red-950 focus:outline-none focus:border-red-600"
            >
              <option value="HEMOLYTIC_TRANSFUSION_REACTION">Acute Hemolytic Transfusion Reaction (AHTR) - Immediate Threat</option>
              <option value="SEVERE_LIFE_THREATENING_TRALI_TACO">Severe TRALI / TACO / Transfusion Sepsis</option>
              <option value="MODERATE_ANAPHYLACTIC">Moderate Anaphylactic / Bronchospastic Reaction</option>
              <option value="MILD_ALLERGIC_FEBRILE">Mild Febrile Non-Hemolytic Reaction (FNHTR)</option>
            </select>
          </div>

          {/* Quick Symptom Chips */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Rapid Symptom Checklist (1-Tap Selection)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected ? `✓ ${sym}` : `+ ${sym}`}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Symptoms & Clinical Presentation</label>
            <Input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Immediate Bedside Interventions</label>
            <Input value={interventions} onChange={(e) => setInterventions(e.target.value)} required />
          </div>

          {/* Automated STAT Labs Checklist */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <label className="flex items-center gap-2 text-xs font-bold text-red-950">
              <input
                type="checkbox"
                checked={autoOrderStatLabs}
                onChange={(e) => setAutoOrderStatLabs(e.target.checked)}
                className="rounded text-red-600"
              />
              Auto-Dispatch STAT Transfusion Reaction Investigation Panel
            </label>
            <p className="text-[11px] text-red-800/80 mt-1 pl-5">
              Instantly sends STAT orders to Blood Bank & Pathology: (1) Repeat ABO & DAT (Direct Coombs), (2) Plasma Free Hb & Urine Hb, (3) Bag & Tubing Sterility Culture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notified Attending Physician</label>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} required />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={clerical}
                  onChange={(e) => setClerical(e.target.checked)}
                  className="rounded text-red-600"
                />
                Bedside Clerical & Wristband Match Re-Checked
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <span className="text-[11px] text-red-600 font-semibold">
              ⚠️ Unit will be immediately flagged as QUARANTINED
            </span>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button variant="danger" type="submit" disabled={loading}>
                {loading ? 'Dispatched...' : '🚨 Confirm Abort & Alert Team'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

