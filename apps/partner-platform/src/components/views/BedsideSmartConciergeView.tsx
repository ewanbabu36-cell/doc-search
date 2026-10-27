import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

export const BedsideSmartConciergeView: React.FC = () => {
  const [bedNumber] = useState('BED-304');
  const [patientName] = useState('Harish Chandra (62M)');
  const [dietCategory] = useState('DIABETIC_LOW_SALT');

  // Call bell state
  const [callActive, setCallActive] = useState(false);
  const [slaCountdown, setSlaCountdown] = useState(180);
  const [escalationTier, setEscalationTier] = useState(0);

  // IV Telemetry state
  const [fluidLevel, setFluidLevel] = useState(45); // ml - triggers preemptive alert!
  const [flowRate] = useState(125); // ml/hr
  const [isIvAlertActive, setIsIvAlertActive] = useState(true);

  // Dietary state
  const [selectedMeal, setSelectedMeal] = useState('LUNCH');
  const [dietOrdered, setDietOrdered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTriggerCallBell = async () => {
    setCallActive(true);
    setSlaCountdown(180);
    setEscalationTier(0);
    try {
      await apiRequest('/api/v1/partner/bedside/call-bell/trigger', {
        method: 'POST',
        body: JSON.stringify({
          bedNumber,
          wardName: 'Floor 3 General Ward',
          patientUhId: 'UHID-2026-6601',
          patientName,
          callType: 'EMERGENCY_ASSIST'
        })
      });
    } catch {
      // Handled
    }
  };

  const handleNurseAcknowledge = async () => {
    try {
      await apiRequest('/api/v1/partner/bedside/call-bell/acknowledge', {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'BELL-DEMO',
          nurseName: 'Sister Mary (Floor 3 RN)',
          nfcTagScanned: 'NFC-BED-304-VERIFIED'
        })
      });
      setCallActive(false);
    } catch {
      // Handled
    }
  };

  const handleSimulateEscalation = () => {
    setEscalationTier(1);
    setSlaCountdown(0);
  };

  const handleReplaceIvBottle = async () => {
    setFluidLevel(500);
    setIsIvAlertActive(false);
    try {
      await apiRequest('/api/v1/partner/bedside/iv-telemetry/ingest', {
        method: 'POST',
        body: JSON.stringify({
          bedNumber,
          ivBottleType: '0.9% Normal Saline 500ml',
          currentFluidMl: 500,
          flowRateMlHr: flowRate
        })
      });
    } catch {
      // Handled
    }
  };

  const handleOrderDiet = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest('/api/v1/partner/bedside/dietary/order', {
        method: 'POST',
        body: JSON.stringify({
          bedNumber,
          patientUhId: 'UHID-2026-6601',
          patientName,
          mealType: selectedMeal,
          dietCategory,
          items: ['Steamed Brown Rice', 'Moong Dal (Salt-Restricted)', 'Boiled French Beans & Carrots']
        })
      });
      setDietOrdered(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Bedside Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Inpatient Bedside Concierge & IoT Telemetry Hub</h1>
            <Badge variant="info">Bed: {bedNumber}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Patient: {patientName} • Prescribed Diet: <span className="font-semibold text-emerald-700">{dietCategory}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={callActive ? 'danger' : 'success'}>
            {callActive ? '🚨 NURSE CALL ACTIVE' : 'CALL BELL READY'}
          </Badge>
          <Badge variant={isIvAlertActive ? 'warning' : 'success'}>
            {isIvAlertActive ? '⚠️ IV DRIP LOW (<50ml)' : 'IV INFUSION NORMAL'}
          </Badge>
        </div>
      </div>

      {/* Grid: Call Bell & IV Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nurse Call Bell Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-rose-600">🔔</span> Smart Nurse Call Bell & SLA Escalation
            </h2>
            <span className="text-xs text-gray-500">NABH Nursing 3-Min SLA</span>
          </div>

          <div className="text-center py-6 space-y-4 bg-slate-50 rounded-xl border border-slate-200">
            {!callActive ? (
              <Button
                variant="danger"
                className="w-48 h-20 text-lg font-bold shadow-lg"
                onClick={handleTriggerCallBell}
              >
                CALL NURSE
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="text-4xl font-extrabold font-mono text-rose-600 animate-pulse">
                  {slaCountdown > 0 ? `00:${String(slaCountdown).padStart(2, '0')}` : 'SLA BREACHED!'}
                </div>
                <p className="text-sm font-medium text-gray-800">
                  {escalationTier === 0
                    ? 'Nurse station notified. Awaiting bedside NFC tag acknowledgment.'
                    : '🚨 Escalated to Ward Sister Incharge (WhatsApp & SMS Dispatched)'}
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <Button variant="success" onClick={handleNurseAcknowledge}>
                    Nurse Tap NFC Bedside Tag
                  </Button>
                  {escalationTier === 0 && (
                    <Button variant="secondary" onClick={handleSimulateEscalation}>
                      Simulate 3-Min SLA Expiry
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-2 rounded border ${callActive && escalationTier === 0 ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold' : 'bg-gray-50 text-gray-500'}`}>
              Tier 0: Bedside RN
            </div>
            <div className={`p-2 rounded border ${escalationTier >= 1 ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold' : 'bg-gray-50 text-gray-500'}`}>
              Tier 1: Ward Sister (3m)
            </div>
            <div className="p-2 rounded border bg-gray-50 text-gray-500">
              Tier 2: Superintendent (5m)
            </div>
          </div>
        </div>

        {/* IoT IV Infusion Telemetry Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-cyan-600">💧</span> IoT IV Infusion Level Telemetry
            </h2>
            <Badge variant={fluidLevel < 50 ? 'danger' : 'success'}>
              {fluidLevel} ml remaining
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1 font-medium">
                <span>0.9% Normal Saline (500ml Bottle)</span>
                <span>{fluidLevel} / 500 ml</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    fluidLevel < 50 ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${(fluidLevel / 500) * 100}%` }}
                />
              </div>
            </div>

            {fluidLevel < 50 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  ⚠️ PREEMPTIVE AIR EMBOLISM PREVENTION ALERT
                </span>
                <p>
                  Fluid dropped below critical 50ml threshold at flow rate {flowRate} ml/hr. Nurse station alerted to replace bottle before cannula runs dry.
                </p>
                <div className="pt-2">
                  <Button variant="primary" onClick={handleReplaceIvBottle}>
                    Replace with Fresh 500ml Bottle
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 bg-slate-50 p-3 rounded-lg border">
              <div>
                <span className="text-gray-400 block">Infusion Flow Rate</span>
                <span className="font-bold text-gray-900">{flowRate} ml/hr</span>
              </div>
              <div>
                <span className="text-gray-400 block">Estimated Time Remaining</span>
                <span className="font-bold text-gray-900">
                  {fluidLevel < 50 ? '< 20 Minutes' : '3.5 Hours'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bedside Dietary Ordering Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">🥗</span> Bedside Nutritionist Diet Ordering
            </h2>
            <p className="text-xs text-gray-500">
              Validated against physician diet chart to prevent diabetic hyperglycaemia or renal overload.
            </p>
          </div>
          <Badge variant="success">Diet Chart: {dietCategory}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-3 bg-slate-50 space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">Select Meal</span>
            <div className="flex gap-2">
              {['BREAKFAST', 'LUNCH', 'DINNER'].map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMeal(m)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                    selectedMeal === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-3 bg-slate-50 space-y-1 md:col-span-2">
            <span className="text-xs font-semibold text-gray-500 block">Approved Nutrition Items</span>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-medium">Steamed Brown Rice (1 Cup)</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-medium">Yellow Moong Dal (Salt-Restricted)</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-medium">Boiled French Beans & Carrots</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-medium">Curd (Unsweetened 100g)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            {dietOrdered ? '✓ Meal request dispatched to Hospital Central Kitchen (ETA: 25 Mins)' : 'Ready to dispatch to kitchen.'}
          </span>
          <Button
            variant="primary"
            disabled={isSubmitting || dietOrdered}
            onClick={handleOrderDiet}
          >
            {dietOrdered ? 'Order Dispatched ✓' : 'Dispatch Order to Hospital Kitchen'}
          </Button>
        </div>
      </div>
    </div>
  );
};
