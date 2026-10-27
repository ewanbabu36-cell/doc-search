import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

interface IcuBedTelemetry {
  bedNumber: string;
  patientUhId: string;
  patientName: string;
  heartRate: number;
  systolicBp: number;
  respiratoryRate: number;
  spo2: number;
  temperature: number;
  avpu: string;
  news2Score: number;
  deteriorationRisk: string;
  rrtDispatched?: boolean;
}

const INITIAL_ICU_BEDS: IcuBedTelemetry[] = [
  {
    bedNumber: 'ICU-BED-01',
    patientUhId: 'UHID-2026-8801',
    patientName: 'Kailash Mehra (64M)',
    heartRate: 118,
    systolicBp: 86,
    respiratoryRate: 26,
    spo2: 91,
    temperature: 39.2,
    avpu: 'VOICE',
    news2Score: 9,
    deteriorationRisk: 'CRITICAL_HIGH_RISK'
  },
  {
    bedNumber: 'ICU-BED-02',
    patientUhId: 'UHID-2026-8802',
    patientName: 'Gurdeep Singh (52M)',
    heartRate: 94,
    systolicBp: 114,
    respiratoryRate: 20,
    spo2: 96,
    temperature: 37.4,
    avpu: 'ALERT',
    news2Score: 2,
    deteriorationRisk: 'LOW_MONITOR'
  },
  {
    bedNumber: 'ICU-BED-03',
    patientUhId: 'UHID-2026-8803',
    patientName: 'Sunita Joshi (68F)',
    heartRate: 104,
    systolicBp: 98,
    respiratoryRate: 22,
    spo2: 93,
    temperature: 38.4,
    avpu: 'ALERT',
    news2Score: 6,
    deteriorationRisk: 'MEDIUM_ELEVATED_RISK'
  }
];

export const SmartIcuDeteriorationRadarView: React.FC = () => {
  const [beds, setBeds] = useState<IcuBedTelemetry[]>(INITIAL_ICU_BEDS);
  const [selectedBed, setSelectedBed] = useState<IcuBedTelemetry>(INITIAL_ICU_BEDS[0]!);
  const [isSimulating, setIsSimulating] = useState(false);
  const [dispatchAlert, setDispatchAlert] = useState<string | null>(null);

  // Ingest Live Telemetry Simulation
  const handleSimulateVitalsUpdate = async () => {
    setIsSimulating(true);
    try {
      const res = await apiRequest<{
        bedNumber: string;
        news2Score: number;
        deteriorationRisk: string;
        requiresRapidResponseTeam: boolean;
      }>('/api/v1/partner/smart-icu/telemetry/ingest', {
        method: 'POST',
        body: JSON.stringify({
          bedNumber: 'ICU-BED-04',
          patientUhId: 'UHID-2026-8804',
          patientName: 'Maheshwari Devi (71F)',
          heartRate: 124,
          systolicBp: 82,
          respiratoryRate: 28,
          spo2: 89,
          temperature: 39.4,
          avpu: 'PAIN'
        })
      });

      if (res.data) {
        const newBed: IcuBedTelemetry = {
          bedNumber: 'ICU-BED-04',
          patientUhId: 'UHID-2026-8804',
          patientName: 'Maheshwari Devi (71F)',
          heartRate: 124,
          systolicBp: 82,
          respiratoryRate: 28,
          spo2: 89,
          temperature: 39.4,
          avpu: 'PAIN',
          news2Score: res.data.news2Score,
          deteriorationRisk: res.data.deteriorationRisk
        };
        setBeds([newBed, ...beds]);
        setSelectedBed(newBed);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // Dispatch Rapid Response Team (RRT)
  const handleDispatchRrt = async (bedNum: string) => {
    try {
      const res = await apiRequest<{
        dispatchReference: string;
        assignedLead: string;
      }>('/api/v1/partner/smart-icu/rrt/dispatch-code', {
        method: 'POST',
        body: JSON.stringify({
          bedNumber: bedNum,
          codeType: 'CODE_RAPID_RESPONSE_SEPSIS',
          leadIntensivist: 'Dr. Ananya Ray (MD Critical Care)'
        })
      });

      if (res.data) {
        setDispatchAlert(
          `Rapid Response Team (${res.data.dispatchReference}) dispatched to ${bedNum}! Lead: ${res.data.assignedLead}`
        );
        setBeds((prev) =>
          prev.map((b) => (b.bedNumber === bedNum ? { ...b, rrtDispatched: true } : b))
        );
      }
    } catch {}
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Smart ICU &amp; Ward Deterioration Early Warning Sentinel
            </h1>
            <Badge variant="primary">Apollo Smart ICU Benchmark</Badge>
            <Badge variant="danger">NEWS2 &gt;= 7 Sepsis Alert</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Continuous multi-parameter monitor telemetry ingestion predicting clinical deterioration 4 hours before cardiac arrest or septic shock.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSimulateVitalsUpdate}
          disabled={isSimulating}
        >
          {isSimulating ? 'Ingesting Telemetry...' : '+ Ingest Critical Vital Event'}
        </Button>
      </div>

      {/* Alert Banner */}
      {dispatchAlert && (
        <div className="mt-4 p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="animate-ping h-2 w-2 rounded-full bg-red-500 inline-block" />
            <span className="font-bold">RRT ACTIVATED:</span>
            <span>{dispatchAlert}</span>
          </div>
          <button onClick={() => setDispatchAlert(null)} className="font-bold text-red-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Multi-Bed Grid Layout */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Left Column: Bed Radar Cards (8 Cols) */}
        <div className="col-span-8 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {beds.map((b) => {
              const isSelected = selectedBed.bedNumber === b.bedNumber;
              const isCritical = b.news2Score >= 7;

              return (
                <div
                  key={b.bedNumber}
                  onClick={() => setSelectedBed(b)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-slate-950 shadow-lg ring-1 ring-teal-500'
                      : isCritical
                      ? 'border-red-800 bg-red-950/20 hover:border-red-600'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{b.bedNumber}</span>
                    <Badge variant={isCritical ? 'danger' : b.news2Score >= 5 ? 'warning' : 'success'}>
                      NEWS2: {b.news2Score}
                    </Badge>
                  </div>

                  <p className="font-bold text-slate-200 text-sm mt-2">{b.patientName}</p>
                  <p className="text-[11px] text-slate-500">{b.patientUhId}</p>

                  {/* Micro Vitals Grid */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3 text-center text-[10px]">
                    <div className="bg-slate-900 p-1 rounded border border-slate-800">
                      <span className="text-slate-500 block">HR</span>
                      <span className={`font-bold ${b.heartRate > 100 ? 'text-red-400' : 'text-slate-300'}`}>
                        {b.heartRate}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-1 rounded border border-slate-800">
                      <span className="text-slate-500 block">SpO2</span>
                      <span className={`font-bold ${b.spo2 < 92 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {b.spo2}%
                      </span>
                    </div>
                    <div className="bg-slate-900 p-1 rounded border border-slate-800">
                      <span className="text-slate-500 block">BP</span>
                      <span className="font-bold text-slate-300">{b.systolicBp}s</span>
                    </div>
                  </div>

                  {isCritical && (
                    <div className="mt-3 pt-2 border-t border-red-900/60 flex items-center justify-between text-[10px] text-red-400 font-bold">
                      <span>🚨 Sepsis Deterioration</span>
                      {b.rrtDispatched && <span className="text-emerald-400">RRT Sent</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Bed Inspector & 1-Click Code Blue / RRT (4 Cols) */}
        <div className="col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {selectedBed.bedNumber} Telemetry
                </span>
                <span className="text-[11px] text-slate-400">{selectedBed.patientName}</span>
              </div>
              <Badge variant={selectedBed.news2Score >= 7 ? 'danger' : 'neutral'}>
                NEWS2: {selectedBed.news2Score}
              </Badge>
            </div>

            {/* Vital Signs Full Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400">Pulse / Heart Rate:</span>
                <strong className={selectedBed.heartRate > 100 ? 'text-red-400' : 'text-white'}>
                  {selectedBed.heartRate} bpm
                </strong>
              </div>
              <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400">Systolic Blood Pressure:</span>
                <strong className={selectedBed.systolicBp < 90 ? 'text-red-400' : 'text-white'}>
                  {selectedBed.systolicBp} mmHg
                </strong>
              </div>
              <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400">Respiratory Rate:</span>
                <strong className={selectedBed.respiratoryRate > 24 ? 'text-red-400' : 'text-white'}>
                  {selectedBed.respiratoryRate} /min
                </strong>
              </div>
              <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400">Oxygen Saturation (SpO2):</span>
                <strong className={selectedBed.spo2 < 92 ? 'text-red-400' : 'text-emerald-400'}>
                  {selectedBed.spo2}%
                </strong>
              </div>
              <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400">Core Body Temperature:</span>
                <strong className="text-amber-400">{selectedBed.temperature} °C</strong>
              </div>
              <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400">AVPU Consciousness:</span>
                <strong className="text-white">{selectedBed.avpu}</strong>
              </div>
            </div>

            {/* Deterioration Risk Summary */}
            <div className={`p-3 rounded-xl border ${selectedBed.news2Score >= 7 ? 'bg-red-950/40 border-red-800' : 'bg-slate-900 border-slate-800'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">
                Clinical Intervention Protocol
              </span>
              <p className="text-xs text-slate-200 font-medium mt-1">
                {selectedBed.news2Score >= 7
                  ? 'Urgent Rapid Response Team bedside review required within 15 minutes. High suspicion of septic shock. Prepare arterial line, IV fluid bolus, and blood cultures.'
                  : 'Vital parameters within acceptable ward limits. Scheduled observation frequency: every 4 hours.'}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800">
            <Button
              variant={selectedBed.news2Score >= 7 ? 'danger' : 'outline'}
              size="md"
              onClick={() => handleDispatchRrt(selectedBed.bedNumber)}
              disabled={selectedBed.rrtDispatched}
              className="w-full"
            >
              {selectedBed.rrtDispatched
                ? '✔ Rapid Response Team Active'
                : '🚨 Dispatch Rapid Response Team (RRT)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
