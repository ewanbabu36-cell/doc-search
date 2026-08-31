import React from 'react';
import { Card, Button } from '@docsearch/ui-kit';
import type { WhatIfScenarioResultDto } from '@docsearch/api-contracts';

interface Props {
  simulations: WhatIfScenarioResultDto[];
  onRunSimulation: () => void;
}

export const WhatIfSimulationSandboxView: React.FC<Props> = ({ simulations, onRunSimulation }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Executive What-If Scenario Modeling & Crisis Sandbox</h2>
          <p className="text-xs text-gray-500">Simulate mass-casualty surges, epidemic viral waves, and OT complex downtimes</p>
        </div>
        <Button variant="primary" onClick={onRunSimulation}>🤖 Run New AI Simulation</Button>
      </div>

      <div className="space-y-4">
        {simulations.map((sim) => (
          <Card key={sim.scenarioId} className="p-4 space-y-3">
            <div className="border-b pb-2 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">{sim.scenarioName}</h3>
              <span className="text-xs text-gray-500">Generated: {sim.generatedAt.replace('T', ' ').substring(0, 16)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-red-50 rounded font-bold text-red-900">Peak Occupancy: {sim.simulatedOccupancyPeakPct}%</div>
              <div className="p-2 bg-amber-50 rounded font-bold text-amber-900">ICU Deficit: -{sim.simulatedIcuDeficitBeds} Beds</div>
              <div className="p-2 bg-blue-50 rounded font-bold text-blue-900">Vent Shortage: -{sim.simulatedVentilatorShortageCount} Units</div>
              <div className="p-2 bg-purple-50 rounded font-bold text-purple-900">ED Wait Peak: {sim.simulatedEdWaitTimePeakMins}m</div>
            </div>
            <div className="p-3 bg-gray-50 rounded text-xs space-y-1">
              <p className="font-bold text-gray-800">AI Strategic Recommendations:</p>
              <ul className="list-disc pl-4 text-gray-700 space-y-0.5">
                {sim.aiRecommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
