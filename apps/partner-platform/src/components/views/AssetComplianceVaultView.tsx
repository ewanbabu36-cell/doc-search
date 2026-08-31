import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';

export const AssetComplianceVaultView: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Regulatory Accreditation & Compliance Vault (NABH / JCI / AERB)</h2>
        <p className="text-xs text-gray-500">Statutory equipment certifications, radiation safety licenses & quality standards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900">NABH / JCI Facility & Safety Standards</h3>
            <Badge variant="success">100% Compliant</Badge>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-gray-50 rounded flex justify-between">
              <span>FMS.6 Equipment Maintenance Program</span>
              <span className="text-emerald-700 font-bold">Passed</span>
            </div>
            <div className="p-2 bg-gray-50 rounded flex justify-between">
              <span>FMS.7 Medical Equipment Testing & Calibration</span>
              <span className="text-emerald-700 font-bold">Passed</span>
            </div>
            <div className="p-2 bg-gray-50 rounded flex justify-between">
              <span>FMS.8 Medical Gas Pipeline Safety (MGPS)</span>
              <span className="text-emerald-700 font-bold">Passed</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900">AERB Radiation Equipment Licensure</h3>
            <Badge variant="success">Active eLORA License</Badge>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-gray-50 rounded flex justify-between">
              <span>Mobile C-Arm Fluoroscopy (Siemens Cios Alpha)</span>
              <span className="text-emerald-700 font-bold">Licensed until 2028</span>
            </div>
            <div className="p-2 bg-gray-50 rounded flex justify-between">
              <span>Radiation QA / Survey Reports</span>
              <span className="text-emerald-700 font-bold">Current</span>
            </div>
            <div className="p-2 bg-gray-50 rounded flex justify-between">
              <span>Lead Apron Integrity Tests (Annual)</span>
              <span className="text-emerald-700 font-bold">Zero Defects</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
