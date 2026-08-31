import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

interface Props {
  onEnrollPatient: () => void;
}

export const RpmCareCohortManagementView: React.FC<Props> = ({ onEnrollPatient }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Chronic Disease RPM Care Cohort Programs</h2>
          <p className="text-xs text-gray-500">Disease-specific remote monitoring pathways with protocolized clinical threshold guards</p>
        </div>
        <Button variant="primary" onClick={onEnrollPatient}>🩺 Enroll New Patient</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <Card className="p-4 space-y-2 border-l-4 border-l-blue-600">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900 text-sm">Hypertension Remote Control Program</span>
            <Badge variant="primary">98 Patients Enrolled</Badge>
          </div>
          <p className="text-gray-600">Twice-daily Bluetooth BP cuffs sync with automated MAP calculation. Target: Systolic &lt; 130 mmHg.</p>
        </Card>

        <Card className="p-4 space-y-2 border-l-4 border-l-emerald-600">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900 text-sm">Type 2 Diabetes Intensive CGM Care</span>
            <Badge variant="success">84 Patients Enrolled</Badge>
          </div>
          <p className="text-gray-600">Continuous Glucose Monitor (CGM) streaming with Time-in-Range (TIR) metrics and hypoglycemia alerts.</p>
        </Card>

        <Card className="p-4 space-y-2 border-l-4 border-l-red-600">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900 text-sm">Heart Failure (CHF) Hemodynamics & Dry Weight</span>
            <Badge variant="danger">36 Patients Enrolled</Badge>
          </div>
          <p className="text-gray-600">Smart weight scale tracking for early fluid retention detection (&gt; 2kg in 48h) and remote diuretic adjustments.</p>
        </Card>

        <Card className="p-4 space-y-2 border-l-4 border-l-purple-600">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900 text-sm">COPD & Asthma Tele-Respiratory Care</span>
            <Badge variant="neutral">22 Patients Enrolled</Badge>
          </div>
          <p className="text-gray-600">Continuous pulse oximetry and digital spirometer PEFR/FEV1 tracking with air quality index (AQI) alerts.</p>
        </Card>
      </div>
    </div>
  );
};
