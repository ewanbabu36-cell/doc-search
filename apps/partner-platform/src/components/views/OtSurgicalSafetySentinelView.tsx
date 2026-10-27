import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

interface PacData {
  caseId: string;
  pacStatus: string;
  asaScore: number;
  mallampatiScore: string;
  theatreStatus: string;
}

interface CountItem {
  name: string;
  initial: number;
  added: number;
  final: number;
}

export const OtSurgicalSafetySentinelView: React.FC = () => {
  const [caseId] = useState('OT-CASE-2026-9901');
  const [pacData] = useState<PacData | null>({
    caseId: 'OT-CASE-2026-9901',
    pacStatus: 'PAC_CLEARED_FIT_FOR_GA',
    asaScore: 2,
    mallampatiScore: 'Class II',
    theatreStatus: 'THEATRE_ENTRY_UNLOCKED'
  });

  const [phaseCompleted, setPhaseCompleted] = useState<Record<string, boolean>>({
    SIGN_IN: true,
    TIME_OUT: false,
    SIGN_OUT: false
  });

  const [counts, setCounts] = useState<CountItem[]>([
    { name: 'Laparotomy Sponges (with X-Ray Marker)', initial: 10, added: 5, final: 15 },
    { name: 'Surgical Needles (Atraumatic)', initial: 12, added: 0, final: 12 },
    { name: 'Gauze Swabs (10x10cm)', initial: 20, added: 10, final: 30 },
    { name: 'Mosquito Artery Forceps', initial: 8, added: 0, final: 8 }
  ]);

  const [reconciliationStatus, setReconciliationStatus] = useState<'BALANCED' | 'DISCREPANCY'>('BALANCED');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompletePhase = async (phase: 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT') => {
    setIsSubmitting(true);
    try {
      await apiRequest('/api/v1/partner/ot-safety/checklist/phase', {
        method: 'POST',
        body: JSON.stringify({
          caseId,
          phase,
          verifiedItems: ['Patient Identity Verified', 'Surgical Site Marked', 'Anaesthesia Machine & Medication Check Complete', 'Pulse Oximeter On & Functioning'],
          verifiedBy: 'Senior Scrub RN Anita Sharma'
        })
      });
      setPhaseCompleted((prev) => ({ ...prev, [phase]: true }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateDiscrepancy = () => {
    setCounts((prev) =>
      prev.map((it, idx) => (idx === 0 ? { ...it, final: 14 } : it)) // 1 sponge missing!
    );
    setReconciliationStatus('DISCREPANCY');
  };

  const handleResolveCount = () => {
    setCounts((prev) =>
      prev.map((it, idx) => (idx === 0 ? { ...it, final: 15 } : it))
    );
    setReconciliationStatus('BALANCED');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">OT Surgical Safety & Sponge Count Sentinel</h1>
            <Badge variant="success">NABH / WHO Safe Surgery Standard</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Zero Retained Foreign Objects (RFO) • Anaesthesia Pre-Op Clearance (PAC) • CSSD Autoclave Integrity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">Case: {caseId}</Badge>
          <Badge variant={pacData?.theatreStatus === 'THEATRE_ENTRY_UNLOCKED' ? 'success' : 'danger'}>
            {pacData?.theatreStatus || 'PAC_PENDING'}
          </Badge>
        </div>
      </div>

      {/* Grid: PAC Clearance & WHO Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PAC Clearance Gate Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">🩺</span> Anaesthesia PAC Clearance
            </h2>
            <Badge variant="success">FIT FOR GA</Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Patient UHID</span>
              <span className="font-medium text-gray-900">UHID-2026-7701 (Rajeev Sharma, 44M)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Procedure</span>
              <span className="font-medium text-gray-900">Laparoscopic Cholecystectomy</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">ASA Physical Status</span>
              <span className="font-medium text-emerald-700">ASA Class II (Mild HTN)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Airway Assessment</span>
              <span className="font-medium text-gray-900">Mallampati Class II (Direct Laryngoscopy OK)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">NPO Fasting Status</span>
              <span className="font-medium text-emerald-700">8.5 Hours (Clear Fluids & Solids Withheld)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Anaesthetist Sign-Off</span>
              <span className="font-medium text-gray-900">Dr. Priyadarshini Rao (MD)</span>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
            <span>🛡️</span>
            <span>PAC Hard-Gate Active: Surgical Theatre Doors Unlocked. Zero NPO violations.</span>
          </div>
        </div>

        {/* WHO 3-Phase Safe Surgery Checklist */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-indigo-600">📋</span> WHO Safe Surgery 3-Phase Checklist
            </h2>
            <div className="flex gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${phaseCompleted['SIGN_IN'] ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                1. Sign-In {phaseCompleted['SIGN_IN'] ? '✓' : ''}
              </span>
              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${phaseCompleted['TIME_OUT'] ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                2. Time-Out {phaseCompleted['TIME_OUT'] ? '✓' : '• ACTIVE'}
              </span>
              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${phaseCompleted['SIGN_OUT'] ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                3. Sign-Out {phaseCompleted['SIGN_OUT'] ? '✓' : ''}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm text-slate-900 flex items-center gap-2">
              <span className="text-amber-600 font-bold">Phase 2: TIME-OUT</span> (Mandatory Verification Before Surgical Incision)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
              <label className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>All team members introduced by name & role</span>
              </label>
              <label className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>Surgeon, Anaesthetist & Nurse verbally confirm patient name & site</span>
              </label>
              <label className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>Antibiotic prophylaxis given within past 60 mins (Ceftriaxone 1g IV)</span>
              </label>
              <label className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>Anticipated blood loss & critical operative steps reviewed</span>
              </label>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                disabled={isSubmitting || phaseCompleted['TIME_OUT']}
                onClick={() => handleCompletePhase('TIME_OUT')}
              >
                {phaseCompleted['TIME_OUT'] ? 'Time-Out Completed ✓' : 'Confirm Time-Out & Permit Incision'}
              </Button>
            </div>
          </div>

          {/* CSSD Sterility Verification */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-gray-800">CSSD Sterile Batch: </span>
              <span className="text-gray-600">Major Laparotomy Instrument Set #04 (Batch: CSSD-BATCH-2026-901)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-medium">Biological Spore Test: NEGATIVE_PASS</span>
              <Badge variant="success">STERILE ACTIVE (Expires in 29 Days)</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Dual-Nurse Surgical Count Reconciliation Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-purple-600">🔢</span> Dual-Nurse Surgical Count Reconciliation
            </h2>
            <p className="text-xs text-gray-500">
              Scrub RN & Circulating RN must co-sign before peritoneal or deep anatomical cavity closure.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleSimulateDiscrepancy}>
              Simulate Missing Sponge Discrepancy
            </Button>
            <Button variant="primary" onClick={handleResolveCount}>
              Resolve & Balance Count
            </Button>
          </div>
        </div>

        {reconciliationStatus === 'DISCREPANCY' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-red-900 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold flex items-center gap-2 text-base text-red-800">
                🚨 CRITICAL HALT: COUNT DISCREPANCY DETECTED!
              </h3>
              <p className="text-sm">
                1 Laparotomy Sponge is unaccounted for! Cavity closure is strictly frozen.
              </p>
              <p className="text-xs text-red-700">
                Action: Search surgical field, check drapes, inspect kick-buckets. Mandatory portable C-Arm X-ray requisitioned.
              </p>
            </div>
            <Badge variant="danger">PORTABLE X-RAY DISPATCHED</Badge>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-600 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-4 text-center">Initial Count</th>
                <th className="py-3 px-4 text-center">Intra-Op Added</th>
                <th className="py-3 px-4 text-center">Total Expected</th>
                <th className="py-3 px-4 text-center">Closing Count</th>
                <th className="py-3 px-4 text-center">Discrepancy</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {counts.map((item, idx) => {
                const totalExpected = item.initial + item.added;
                const diff = totalExpected - item.final;
                const isItemBalanced = diff === 0;

                return (
                  <tr key={idx} className={isItemBalanced ? 'hover:bg-gray-50' : 'bg-red-50/50'}>
                    <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-center font-mono">{item.initial}</td>
                    <td className="py-3 px-4 text-center font-mono text-blue-600">+{item.added}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold">{totalExpected}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-gray-900">{item.final}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {diff === 0 ? (
                        <span className="text-emerald-600">0</span>
                      ) : (
                        <span className="text-red-600">-{diff} MISSING</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={isItemBalanced ? 'success' : 'danger'}>
                        {isItemBalanced ? 'BALANCED' : 'MISMATCH'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Dual Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t text-xs text-gray-600">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div>
              <span className="font-semibold block text-gray-900">Scrub Nurse Verification</span>
              <span>Anita Sharma (RN, OT Reg: 44102)</span>
            </div>
            <span className="text-emerald-700 font-bold">SIGNED ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div>
              <span className="font-semibold block text-gray-900">Circulating Nurse Verification</span>
              <span>Preeti Varghese (RN, OT Reg: 39108)</span>
            </div>
            <span className="text-emerald-700 font-bold">SIGNED ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
};
