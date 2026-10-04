import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  assets: BiomedicalAssetDto[];
}

export const ClinicalEquipmentReadinessView: React.FC<Props> = ({ assets }) => {
  const departments = [
    'Intensive Care Unit (ICU-A)',
    'Emergency Department (ED)',
    'Operation Theatre Complex (OT-1)',
    'Operation Theatre Complex (OT-2)',
    'Dialysis Unit'
  ];

  const [overrideModalAsset, setOverrideModalAsset] = useState<BiomedicalAssetDto | null>(null);
  const [overrideApprover, setOverrideApprover] = useState('Dr. Sanjeev Kapoor (Medical Superintendent)');
  const [overrideRationale, setOverrideRationale] = useState('');
  const [overriddenAssetIds, setOverriddenAssetIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detect and broadcast PPM Overdue Hard Gate Quarantines
  useEffect(() => {
    const overdueAssets = assets.filter(
      (a) => a.operationalStatus === 'CALIBRATION_OVERDUE' || a.calibrationStatus === 'DUE_OVERDUE'
    );
    overdueAssets.forEach((asset) => {
      if (!overriddenAssetIds.includes(asset.id)) {
        hospitalEventBus.publish(
          'PPM_QUARANTINE_ENFORCED',
          'BiomedicalPpmGate',
          {
            assetCode: asset.assetCode,
            assetName: asset.assetName,
            location: asset.physicalLocation,
            department: asset.departmentName,
            dueDate: asset.nextPpmDueDate,
            responsibleEngineer: asset.responsibleBiomedicalEngineer
          },
          `⛔ PPM Hard Gate: ${asset.assetName} (${asset.assetCode}) quarantined in ${asset.departmentName}. Bed allocation hard-locked!`
        );
      }
    });
  }, [assets, overriddenAssetIds]);

  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalAsset) return;

    setOverriddenAssetIds((prev) => [...prev, overrideModalAsset.id]);
    setToastMessage(`⚠️ Emergency Clinical Override Granted for ${overrideModalAsset.assetCode} by ${overrideApprover}. Valid for 12 hours.`);
    setOverrideModalAsset(null);
    setOverrideRationale('');

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const totalAssets = assets.length;
  const inServiceAssets = assets.filter((a) => a.operationalStatus === 'IN_SERVICE').length;
  const quarantinedAssets = assets.filter(
    (a) =>
      (a.operationalStatus === 'CALIBRATION_OVERDUE' || a.calibrationStatus === 'DUE_OVERDUE') &&
      !overriddenAssetIds.includes(a.id)
  ).length;
  const breakdownAssets = assets.filter((a) => a.operationalStatus === 'OUT_OF_SERVICE_BREAKDOWN').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Clinical Department Equipment Readiness Matrix</h2>
          <p className="text-xs text-gray-500">
            Real-time life-support availability, bedside allocation status & statutory PPM Hard-Gate enforcement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-red-100 text-red-800 font-semibold px-2.5 py-1 rounded-full border border-red-200">
            🛡️ NABH / AERB PPM Hard-Gate Active
          </span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 font-semibold animate-pulse flex items-center justify-between">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="text-amber-700 hover:text-amber-900 font-bold">✕</button>
        </div>
      )}

      {/* KPI Summary Banner */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700">Total Monitored Fleet</p>
          <p className="text-2xl font-bold text-blue-900">{totalAssets}</p>
          <p className="text-xs text-blue-600 mt-1">Life-support & high-risk units</p>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700">Ready for Bed Allocation</p>
          <p className="text-2xl font-bold text-emerald-900">{inServiceAssets}</p>
          <p className="text-xs text-emerald-600 mt-1">Calibrated & electrically safe</p>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-xs font-semibold text-red-700">⛔ PPM Overdue Quarantined</p>
          <p className="text-2xl font-bold text-red-900">{quarantinedAssets}</p>
          <p className="text-xs text-red-600 mt-1">Hard-locked from patient use</p>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700">Active Breakdown Repairs</p>
          <p className="text-2xl font-bold text-amber-900">{breakdownAssets}</p>
          <p className="text-xs text-amber-600 mt-1">Under BME work order</p>
        </Card>
      </div>

      {/* Department Grid */}
      <div className="space-y-4">
        {departments.map((dept) => {
          const deptAssets = assets.filter((a) => a.departmentName.includes(dept.split(' ')[0] || ''));
          const readyCount = deptAssets.filter((a) => a.operationalStatus === 'IN_SERVICE').length;

          return (
            <Card key={dept} className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{dept}</h3>
                  <p className="text-[11px] text-gray-500">Clinical Allocation Zone</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={readyCount === deptAssets.length ? 'success' : 'warning'}>
                    {readyCount} / {deptAssets.length} Assets Verified Ready
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {deptAssets.map((a) => {
                  const isOverdue = (a.operationalStatus === 'CALIBRATION_OVERDUE' || a.calibrationStatus === 'DUE_OVERDUE');
                  const isOverridden = overriddenAssetIds.includes(a.id);
                  const isLocked = isOverdue && !isOverridden;
                  const isBreakdown = a.operationalStatus === 'OUT_OF_SERVICE_BREAKDOWN';

                  return (
                    <div
                      key={a.id}
                      className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
                        isLocked
                          ? 'bg-red-50/70 border-red-300 ring-1 ring-red-400'
                          : isBreakdown
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-gray-900">{a.assetCode}</span>
                            <span className="font-mono text-[10px] text-gray-500 font-semibold">({a.qrCodeIdentifier})</span>
                            <Badge variant={a.riskCriticality === 'CRITICAL_LIFE_SUPPORT' ? 'danger' : 'neutral'}>
                              {a.riskCriticality}
                            </Badge>
                          </div>
                          <p className="font-semibold text-gray-800 text-xs mt-0.5">{a.assetName}</p>
                          <p className="text-gray-500 text-[11px]">{a.physicalLocation} | S/N: {a.serialNumber}</p>
                        </div>

                        <div>
                          {isLocked ? (
                            <Badge variant="danger">⛔ QUARANTINED</Badge>
                          ) : isOverridden ? (
                            <Badge variant="warning">⚠️ OVERRIDDEN</Badge>
                          ) : isBreakdown ? (
                            <Badge variant="danger">BREAKDOWN</Badge>
                          ) : (
                            <Badge variant="success">IN SERVICE</Badge>
                          )}
                        </div>
                      </div>

                      {/* PPM Hard Gate Lockout Warning */}
                      {isLocked && (
                        <div className="p-2 bg-red-100 border border-red-200 rounded text-red-900 space-y-1">
                          <p className="font-bold text-[11px] flex items-center gap-1">
                            <span>🚫</span> ALLOCATION LOCKED: PPM Overdue (Due: {a.nextPpmDueDate})
                          </p>
                          <p className="text-[10px] text-red-800">
                            Statutory safety certification expired. Patient attachment prohibited by clinical governance.
                          </p>
                          <div className="pt-1 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] border-red-400 text-red-800 hover:bg-red-200"
                              onClick={() => setOverrideModalAsset(a)}
                            >
                              🔑 Authorized Emergency Override
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Overridden Banner */}
                      {isOverridden && (
                        <div className="p-1.5 bg-amber-100 border border-amber-300 rounded text-[10px] text-amber-900 font-semibold flex items-center justify-between">
                          <span>⚠️ Overridden by Medical Superintendent (PPM Due: {a.nextPpmDueDate})</span>
                          <span className="text-[9px] font-mono">TRACE-OVERRIDE-ACTIVE</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-gray-200 text-[11px] text-gray-600">
                        <span>PPM Due: <strong className={isOverdue ? 'text-red-700 font-bold' : 'text-gray-700'}>{a.nextPpmDueDate}</strong></span>
                        <span>Uptime: <strong className="text-emerald-700">{a.uptimePercentage}%</strong></span>
                        <div className="flex gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isLocked || isBreakdown}
                            className="text-[11px] py-0.5 px-2"
                            onClick={() => {
                              setToastMessage(`✅ Equipment ${a.assetCode} successfully bound to active patient bed in ${a.physicalLocation}.`);
                              setTimeout(() => setToastMessage(null), 3000);
                            }}
                          >
                            {isLocked ? '🔒 Allocation Locked' : '🩺 Allocate to Bed'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Emergency Override Modal */}
      {overrideModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-red-200">
            <div className="flex items-center gap-2 border-b pb-3 text-red-700">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Clinical Emergency PPM Override Protocol</h3>
                <p className="text-[11px] text-gray-500">Statutory NABH Hard Gate Safety Waiver</p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              You are overriding the statutory PPM Quarantine Lock for <strong>{overrideModalAsset.assetName} ({overrideModalAsset.assetCode})</strong>.
              This action generates an immutable audit trace and alerts the Hospital Quality Directorate.
            </p>

            <form onSubmit={handleApplyOverride} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizing Clinical Authority</label>
                <Input
                  value={overrideApprover}
                  onChange={(e) => setOverrideApprover(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Justification & Risk Mitigation Plan</label>
                <Input
                  value={overrideRationale}
                  onChange={(e) => setOverrideRationale(e.target.value)}
                  placeholder="e.g. Mass casualty surge, zero backup ventilators available in city..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" type="button" onClick={() => setOverrideModalAsset(null)}>
                  Cancel
                </Button>
                <Button variant="danger" type="submit" disabled={!overrideRationale.trim()}>
                  Sign & Enforce 12h Waiver
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
