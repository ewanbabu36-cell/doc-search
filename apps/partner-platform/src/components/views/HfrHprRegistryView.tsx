import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';

export const HfrHprRegistryView: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Health Facility (HFR) & Healthcare Professional (HPR) Registry</h2>
        <p className="text-xs text-gray-500">Government of India National Registries integration and digital signature credentials</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-sm font-bold text-blue-900">Health Facility Registry (HFR)</h3>
            <Badge variant="success">HFR Verified</Badge>
          </div>
          <div className="text-xs space-y-2 text-gray-700">
            <p>Facility ID: <strong className="font-mono text-gray-900">IN-MH-HFR-90812</strong></p>
            <p>Facility Name: <strong>Apex Multi-Specialty Hospital & Research Institute</strong></p>
            <p>Bridge Node: <strong className="text-emerald-700">docsearch-abdm-bridge.prod.gov.in</strong></p>
            <p>Services Enabled: <strong>HIP (Discovery/Link), HIU (Consent), M1, M2, M3</strong></p>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-sm font-bold text-purple-900">Healthcare Professional Registry (HPR)</h3>
            <Badge variant="success">HPR Active</Badge>
          </div>
          <div className="text-xs space-y-2 text-gray-700">
            <p>Active Registered Doctors: <strong className="text-gray-900">148 Doctors</strong></p>
            <p>Active Registered Nurses: <strong className="text-gray-900">320 Nurses</strong></p>
            <p>e-Sign DSC Provider: <strong>eMudhra Class-3 Paperless Signing Gateway</strong></p>
            <p>FHIR R4 Author Stamp: <strong className="text-emerald-700">Auto-appended on Rx/Discharge</strong></p>
          </div>
        </Card>
      </div>
    </div>
  );
};
