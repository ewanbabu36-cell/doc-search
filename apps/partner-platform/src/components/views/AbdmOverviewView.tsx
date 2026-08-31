import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { AbdmGatewayOverviewMetricsDto } from '@docsearch/api-contracts';

interface Props {
  metrics: AbdmGatewayOverviewMetricsDto;
  onCreateAbha: () => void;
  onLinkCareContext: () => void;
  onGenerateFhir: () => void;
  onScanAndShare: () => void;
}

export const AbdmOverviewView: React.FC<Props> = ({
  metrics,
  onCreateAbha,
  onLinkCareContext,
  onGenerateFhir,
  onScanAndShare
}) => {
  return (
    <div className="space-y-6">
      {/* Top ABDM National Stack Bridge Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-xl shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🇮🇳</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Ayushman Bharat Digital Mission (ABDM) Gateway</h2>
              <Badge variant="success">Bridge: {metrics.bridgeStatus}</Badge>
            </div>
            <p className="text-xs text-slate-300">National Health Authority (NHA) M1 (ABHA), M2 (HIP/HIU Consent), M3 (FHIR R4 Bundles) & Scan-and-Share</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={onCreateAbha}>+ Create ABHA (M1)</Button>
          <Button variant="outline" onClick={onLinkCareContext}>🔗 Link Care-Context (M2)</Button>
          <Button variant="outline" onClick={onGenerateFhir}>📦 FHIR R4 Bundle (M3)</Button>
          <Button variant="outline" onClick={onScanAndShare}>📲 Scan & Share</Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <span className="text-xs font-semibold text-blue-700">Total Linked ABHA Accounts</span>
          <p className="text-2xl font-bold text-blue-900">{metrics.totalLinkedAbhaCount.toLocaleString()}</p>
          <p className="text-xs text-blue-600 mt-1">HFR: {metrics.hfrFacilityId}</p>
        </Card>

        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <span className="text-xs font-semibold text-emerald-700">Care Contexts Discoverable</span>
          <p className="text-2xl font-bold text-emerald-900">{metrics.careContextsDiscoverableCount.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 mt-1">HIP/HIU Registry Sync Active</p>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <span className="text-xs font-semibold text-purple-700">FHIR R4 Bundles Generated</span>
          <p className="text-2xl font-bold text-purple-900">{metrics.fhirBundlesGeneratedMonth.toLocaleString()}</p>
          <p className="text-xs text-purple-600 mt-1">100% NRCeS Schema Compliant</p>
        </Card>

        <Card className="p-4 bg-teal-50 border-teal-200">
          <span className="text-xs font-semibold text-teal-700">Scan & Share OPD Tokens</span>
          <p className="text-2xl font-bold text-teal-900">{metrics.scanAndShareRegistrationsToday}</p>
          <p className="text-xs text-teal-600 mt-1">Avg Push Latency: {metrics.averagePushLatencyMs}ms</p>
        </Card>
      </div>

      {/* ABDM Ecosystem Map */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-900 border-b pb-2">National Digital Health Ecosystem Integration Architecture</h3>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-lg border space-y-1">
            <span className="font-bold text-blue-900 block">Milestone 1 (M1): ABHA Integration</span>
            <p className="text-gray-600">Aadhaar & Mobile OTP authentication, 14-digit ABHA creation, biometric KYC matching, and counter QR scanning.</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border space-y-1">
            <span className="font-bold text-indigo-900 block">Milestone 2 (M2): HIP / HIU Gateway</span>
            <p className="text-gray-600">Care-context auto-discovery, patient consent requests, artefact authorization, and time-bound data sharing.</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border space-y-1">
            <span className="font-bold text-purple-900 block">Milestone 3 (M3): FHIR R4 Bundling</span>
            <p className="text-gray-600">Diagnostic reports, digital prescriptions, and discharge summaries formatted into encrypted HL7 FHIR bundles with SNOMED-CT.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
