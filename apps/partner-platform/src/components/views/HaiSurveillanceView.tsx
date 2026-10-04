import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { HaiSurveillanceDto, HaiDeviceDaysDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  surveillances: HaiSurveillanceDto[];
  deviceDays: HaiDeviceDaysDto;
  onLogHai: () => void;
}

interface MonitoredDevicePatient {
  id: string;
  mrn: string;
  patientName: string;
  department: string;
  bed: string;
  deviceType: 'FOLEY_CATHETER' | 'CENTRAL_VENOUS_LINE' | 'MECHANICAL_VENTILATOR';
  deviceName: string;
  insertionDate: string;
  deviceDays: number;
  thresholdDays: number;
  status: 'SAFE' | 'WARNING_REMOVAL_DUE' | 'HIGH_RISK_CULTURE_DUE';
  recommendedAction: string;
}

export const HaiSurveillanceView: React.FC<Props> = ({ surveillances, deviceDays, onLogHai }) => {
  const [activeTab, setActiveTab] = useState<'SURVEILLANCE' | 'DEVICE_DAYS_RADAR' | 'MICROBIOLOGY_CORRELATOR'>('DEVICE_DAYS_RADAR');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Device Inpatients for Automated Surveillance
  const [devicePatients] = useState<MonitoredDevicePatient[]>([
    {
      id: 'dev-pat-01',
      mrn: 'MRN-2026-9102',
      patientName: 'Mohd. Rafiq',
      department: 'Intensive Care Unit (ICU-A)',
      bed: 'ICU-A Bed 05',
      deviceType: 'FOLEY_CATHETER',
      deviceName: 'Foley Urinary Catheter 16 Fr',
      insertionDate: '2026-09-28',
      deviceDays: 6,
      thresholdDays: 5,
      status: 'HIGH_RISK_CULTURE_DUE',
      recommendedAction: 'Foley Line Removal / Urine Routine & Culture Due (>5 Days CAUTI Risk)'
    },
    {
      id: 'dev-pat-02',
      mrn: 'MRN-2026-4421',
      patientName: 'Anita Sharma',
      department: 'Intensive Care Unit (ICU-A)',
      bed: 'ICU-A Bed 02',
      deviceType: 'CENTRAL_VENOUS_LINE',
      deviceName: 'Triple Lumen CVC (Right IJV)',
      insertionDate: '2026-09-26',
      deviceDays: 8,
      thresholdDays: 7,
      status: 'HIGH_RISK_CULTURE_DUE',
      recommendedAction: 'CVC Line Removal / Daily Bundle Audit / Blood Culture Due (>7 Days CLABSI Risk)'
    },
    {
      id: 'dev-pat-03',
      mrn: 'MRN-2026-7812',
      patientName: 'Subhash Chandra',
      department: 'Intensive Care Unit (ICU-A)',
      bed: 'ICU-A Bed 07',
      deviceType: 'MECHANICAL_VENTILATOR',
      deviceName: 'ETT 8.0mm with Subglottic Suction',
      insertionDate: '2026-10-01',
      deviceDays: 3,
      thresholdDays: 3,
      status: 'WARNING_REMOVAL_DUE',
      recommendedAction: 'Daily Sedation Vacation & Spontaneous Breathing Trial Due (VAP Prevention)'
    },
    {
      id: 'dev-pat-04',
      mrn: 'MRN-2026-3391',
      patientName: 'Kavita Sundaram',
      department: 'Female Medical Ward (FMW)',
      bed: 'FMW Bed 12',
      deviceType: 'FOLEY_CATHETER',
      deviceName: 'Silicone Foley Catheter 14 Fr',
      insertionDate: '2026-10-03',
      deviceDays: 1,
      thresholdDays: 5,
      status: 'SAFE',
      recommendedAction: 'Routine catheter hygiene; maintain dependent drainage bag below bladder level'
    }
  ]);

  // Simulated Pending Microbiology Culture Reports for HICC Algorithm Engine
  const [pendingCultures, setPendingCultures] = useState([
    {
      id: 'CULT-2026-0981',
      mrn: 'MRN-2026-9102',
      patientName: 'Mohd. Rafiq',
      admissionDate: '2026-09-26T08:00:00Z',
      specimen: 'Urine Catheter Specimen',
      collectionDate: '2026-10-02T10:00:00Z',
      stayHoursAtCollection: 146,
      organism: 'Klebsiella pneumoniae (>10^5 CFU/mL)',
      antibiogram: 'ESBL Positive (Ceftriaxone-R, Cipro-R, Meropenem-S)',
      associatedDevice: 'Foley Urinary Catheter (In Situ 6 Days)',
      isEvaluated: false
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDispatchDeviceAlert = (patient: MonitoredDevicePatient) => {
    hospitalEventBus.publish(
      'HAI_DEVICE_DAY_ALERT_DISPATCHED',
      'HiccSurveillanceEngine',
      {
        mrn: patient.mrn,
        patientName: patient.patientName,
        department: patient.department,
        bed: patient.bed,
        deviceType: patient.deviceType,
        deviceDays: patient.deviceDays,
        action: patient.recommendedAction,
        dispatchedAt: new Date().toISOString()
      },
      `⚠️ HICC Device-Day Alert: ${patient.patientName} (${patient.mrn}) has had ${patient.deviceName} in situ for ${patient.deviceDays} days. Prompt sent to treating doctor.`
    );

    showToast(`🚨 Alert Dispatched: Treating Doctor & ICN notified for ${patient.patientName} (${patient.deviceName})!`);
  };

  const handleEvaluateCulture = (culture: typeof pendingCultures[0]) => {
    const isHai = culture.stayHoursAtCollection >= 48;

    hospitalEventBus.publish(
      'HAI_MICROBIOLOGY_AUTOCORRELATED',
      'HiccAlgorithmEngine',
      {
        cultureId: culture.id,
        mrn: culture.mrn,
        patientName: culture.patientName,
        specimen: culture.specimen,
        organism: culture.organism,
        stayHours: culture.stayHoursAtCollection,
        classification: isHai ? 'HEALTHCARE_ASSOCIATED_INFECTION' : 'COMMUNITY_ACQUIRED_INFECTION',
        haiType: culture.specimen.includes('Urine') ? 'CAUTI' : culture.specimen.includes('Blood') ? 'CLABSI' : 'VAP',
        timestamp: new Date().toISOString()
      },
      `🔬 HICC Auto-Correlator: Culture ${culture.id} (${culture.organism}) for ${culture.patientName} is >=48h after admission. AUTO-FLAGGED as HEALTHCARE_ASSOCIATED_INFECTION (CAUTI).`
    );

    setPendingCultures((prev) =>
      prev.map((c) => (c.id === culture.id ? { ...c, isEvaluated: true } : c))
    );

    showToast(`✓ HICC Auto-Classification Complete: Case flagged as HEALTHCARE_ASSOCIATED_INFECTION (CAUTI) and pushed to NABH registry!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Hospital-Acquired Infection (HICC) Surveillance & Device-Day Desk</h2>
          <p className="text-xs text-gray-500">
            Automated CAUTI, CLABSI, VAP detection, microbiology culture correlation & device-day alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={onLogHai}>+ Log Manual HAI Case</Button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-lg text-xs font-semibold animate-pulse flex items-center justify-between">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="font-bold text-red-700">✕</button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('DEVICE_DAYS_RADAR')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'DEVICE_DAYS_RADAR' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ⏱️ Automated Device-Day Radar (Foley / CVC / Vent)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MICROBIOLOGY_CORRELATOR')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'MICROBIOLOGY_CORRELATOR' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🔬 Microbiology 48h Culture Correlator
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SURVEILLANCE')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'SURVEILLANCE' ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📊 Active HAI Cases & Rates ({surveillances.length})
        </button>
      </div>

      {/* Device Days Benchmark Summary Banner */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3.5 bg-red-50 border-red-200">
          <p className="text-xs font-semibold text-red-700">CLABSI Rate</p>
          <p className="text-2xl font-bold text-red-900">{deviceDays.clabsiRatePer1000Days} / 1000</p>
          <p className="text-[11px] text-red-600 mt-1">{deviceDays.clabsiCount} cases ({deviceDays.centralLineDays} CVC-days)</p>
        </Card>
        <Card className="p-3.5 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700">CAUTI Rate</p>
          <p className="text-2xl font-bold text-amber-900">{deviceDays.cautiRatePer1000Days} / 1000</p>
          <p className="text-[11px] text-amber-600 mt-1">{deviceDays.cautiCount} cases ({deviceDays.urinaryCatheterDays} Catheter-days)</p>
        </Card>
        <Card className="p-3.5 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700">VAP Rate</p>
          <p className="text-2xl font-bold text-blue-900">{deviceDays.vapRatePer1000Days} / 1000</p>
          <p className="text-[11px] text-blue-600 mt-1">{deviceDays.vapCount} cases ({deviceDays.ventilatorDays} Vent-days)</p>
        </Card>
        <Card className="p-3.5 bg-purple-50 border-purple-200">
          <p className="text-xs font-semibold text-purple-700">SSI Rate</p>
          <p className="text-2xl font-bold text-purple-900">{deviceDays.ssiPercentage}%</p>
          <p className="text-[11px] text-purple-600 mt-1">{deviceDays.ssiCount} cases in {deviceDays.surgicalProceduresCount} surgeries</p>
        </Card>
      </div>

      {/* View 1: Automated Device-Day Radar */}
      {activeTab === 'DEVICE_DAYS_RADAR' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Invasive Device Duration Active Radar</h3>
              <p className="text-xs text-gray-500">
                Automatic daily tracking: Foley's Catheter (&gt;5 days), Central Venous Line (&gt;7 days), Ventilator (&gt;3 days)
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
              ⚡ Real-Time Clinical Surveillance Trigger
            </span>
          </div>

          <div className="space-y-3">
            {devicePatients.map((pat) => {
              const isBreached = pat.deviceDays >= pat.thresholdDays;
              return (
                <div
                  key={pat.id}
                  className={`p-3.5 rounded-lg border text-xs transition-all space-y-2 ${
                    isBreached ? 'bg-red-50/70 border-red-300 ring-1 ring-red-400' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{pat.patientName}</span>
                      <span className="text-gray-500 font-mono text-[11px]">({pat.mrn})</span>
                      <span className="text-gray-600 font-semibold">{pat.department} | {pat.bed}</span>
                    </div>
                    <div>
                      {isBreached ? (
                        <Badge variant="danger">⚠️ THRESHOLD BREACHED: {pat.deviceDays} DAYS</Badge>
                      ) : (
                        <Badge variant="success">SAFE: {pat.deviceDays} / {pat.thresholdDays} DAYS</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs bg-white p-2.5 rounded border border-gray-200">
                    <div>
                      <span className="text-gray-500 block">Invasive Device:</span>
                      <strong className="text-gray-800">{pat.deviceName}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Insertion Date:</span>
                      <strong className="text-gray-800">{pat.insertionDate} ({pat.deviceDays} Device-Days)</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Surveillance Target:</span>
                      <strong className="text-red-700">Max {pat.thresholdDays} Days Before Culture/Removal</strong>
                    </div>
                  </div>

                  {isBreached && (
                    <div className="p-2.5 bg-red-100 border border-red-200 rounded text-red-900 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs flex items-center gap-1">
                          <span>🔔</span> Clinical Intervention Required:
                        </p>
                        <p className="text-[11px] text-red-800">{pat.recommendedAction}</p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs shrink-0"
                        onClick={() => handleDispatchDeviceAlert(pat)}
                      >
                        🚨 Dispatch Alert to Treating Doctor
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* View 2: Microbiology 48h Culture Correlator */}
      {activeTab === 'MICROBIOLOGY_CORRELATOR' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Microbiology Culture & Inpatient Stay 48h Correlator</h3>
              <p className="text-xs text-gray-500">
                Automated HICC Algorithm: Culture positive &gt;48h post-admission with invasive device auto-classifies as Hospital-Acquired Infection
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-900 rounded-full border border-blue-300">
              🧬 CDC / NHSN Algorithmic Criteria
            </span>
          </div>

          <div className="space-y-3">
            {pendingCultures.map((cult) => (
              <div key={cult.id} className="p-4 bg-blue-50/50 border border-blue-300 rounded-lg space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{cult.id}</span>
                    <span className="font-semibold text-blue-900">{cult.patientName} ({cult.mrn})</span>
                    <Badge variant="warning">{cult.specimen}</Badge>
                  </div>
                  <Badge variant={cult.isEvaluated ? 'success' : 'danger'}>
                    {cult.isEvaluated ? '✓ AUTO-CLASSIFIED HAI' : 'PENDING CORRELATION'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded border border-blue-200">
                  <div>
                    <span className="text-gray-500 block">Isolated Pathogen:</span>
                    <strong className="text-red-700">{cult.organism}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Stay Duration at Sampling:</span>
                    <strong className="text-gray-900">{cult.stayHoursAtCollection} Hours (&gt;48h Hospital Stay)</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Associated Invasive Device:</span>
                    <strong className="text-gray-900">{cult.associatedDevice}</strong>
                  </div>
                </div>

                <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 text-[11px]">
                  <strong>Antibiogram Profile:</strong> {cult.antibiogram}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-blue-200">
                  <span className="text-[11px] text-gray-600">
                    Rule Evaluated: Sample collected at +{cult.stayHoursAtCollection}h with indwelling Foley catheter &gt;48h.
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={cult.isEvaluated}
                    onClick={() => handleEvaluateCulture(cult)}
                  >
                    {cult.isEvaluated ? '✓ Verified as CAUTI Case' : '⚡ Auto-Correlate & Flag HAI'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* View 3: Active HAI Cases */}
      {activeTab === 'SURVEILLANCE' && (
        <div className="space-y-3">
          {surveillances.map((hai) => (
            <Card key={hai.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">{hai.surveillanceCode}</span>
                  <Badge variant="danger">{hai.haiType}</Badge>
                  <span className="text-xs font-semibold text-gray-800">{hai.patientName} (MRN: {hai.patientMrn})</span>
                  <span className="text-xs text-gray-500 font-medium">| {hai.departmentName}</span>
                </div>
                <Badge variant={hai.outcomeStatus === 'RESOLVED' ? 'success' : 'warning'}>
                  {hai.outcomeStatus}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500">Pathogen Isolated</p>
                  <p className="font-bold text-red-900">{hai.pathogenIsolated}</p>
                  <p className="text-gray-500 mt-1 font-mono text-[11px]">Antibiogram: {hai.antibioticSensitivity}</p>
                </div>
                <div>
                  <p className="text-gray-500">Invasive Device & Day of Onset</p>
                  <p className="font-semibold text-gray-800">{hai.invasiveDeviceName} (Day {hai.deviceDaysAtInfection})</p>
                  <p className="text-gray-500 mt-1">Intervention: {hai.hicInterventionTaken}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
