import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';

export const CdsHooksRulesEngineView: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">HL7 CDS Hooks & SMART on FHIR Rules Engine</h2>
        <p className="text-xs text-gray-500">Real-time clinical event triggers and decision support card dispatch configurations</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center border-b pb-1">
            <span className="font-bold text-gray-900">Hook: medication-prescribe</span>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-gray-600">Evaluates drug-drug interactions, drug-allergy cross-reactivity, and renal dosage adjustments prior to order submission.</p>
        </Card>

        <Card className="p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center border-b pb-1">
            <span className="font-bold text-gray-900">Hook: patient-view</span>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-gray-600">Triggers Sepsis NEWS2 evaluation, immunization gaps, and overdue chronic care diabetes/hypertension screening alerts.</p>
        </Card>

        <Card className="p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center border-b pb-1">
            <span className="font-bold text-gray-900">Hook: order-select</span>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-gray-600">Recommends evidence-based clinical practice guidelines (CPG) order sets (STEMI, Acute Stroke, Sepsis bundle).</p>
        </Card>

        <Card className="p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center border-b pb-1">
            <span className="font-bold text-gray-900">Hook: order-sign</span>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-gray-600">Pre-claim medical necessity verification and duplicate laboratory test ordering prevention.</p>
        </Card>
      </div>
    </div>
  );
};
