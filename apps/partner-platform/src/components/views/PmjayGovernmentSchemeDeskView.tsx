import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

interface HbpPackage {
  package_code: string;
  package_name: string;
  specialty: string;
  package_tariff: number;
  preauth_required: boolean;
  standard_alos_days: number;
}

export const PmjayGovernmentSchemeDeskView: React.FC = () => {
  const [goldenCardId, setGoldenCardId] = useState('PMJAY-DEL-992144');
  const [rationCardNumber, setRationCardNumber] = useState('NFSA-07-291882');
  const [beneficiaryName, setBeneficiaryName] = useState('Chhote Lal (52M)');
  const [annualBalance, setAnnualBalance] = useState(500000.00);

  const [selectedPackage] = useState<HbpPackage>({
    package_code: 'SU004',
    package_name: 'Laparoscopic Cholecystectomy with Cholangiogram',
    specialty: 'General Surgery',
    package_tariff: 32000.00,
    preauth_required: true,
    standard_alos_days: 3
  });

  const [preauthApproved, setPreauthApproved] = useState(false);
  const [claimAdjudicated, setClaimAdjudicated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyBeneficiary = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/api/v1/partner/pmjay/beneficiary/verify', {
        method: 'POST',
        body: JSON.stringify({ goldenCardId, rationCardNumber })
      });
      if (res.data) {
        setBeneficiaryName(res.data.beneficiaryName);
        setAnnualBalance(res.data.annualEntitlementRemaining);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiatePreauth = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest('/api/v1/partner/pmjay/pre-auth/initiate', {
        method: 'POST',
        body: JSON.stringify({
          beneficiaryName,
          goldenCardId,
          rationCardNumber,
          packageCode: selectedPackage.package_code,
          uploadedDocTypes: ['Ultrasound Abdomen', 'LFT Report', 'Clinical History', 'PMJAY Golden Card']
        })
      });
      setPreauthApproved(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjudicateZeroBalanceClaim = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest('/api/v1/partner/pmjay/claims/adjudicate-package', {
        method: 'POST',
        body: JSON.stringify({
          caseRef: 'PMJAY-CASE-DEMO',
          packageCode: selectedPackage.package_code,
          totalHospitalExpense: 36400,
          otConsumablesCost: 4500,
          implantCost: 0
        })
      });
      setClaimAdjudicated(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Ayushman Bharat PM-JAY & State Scheme Desk</h1>
            <Badge variant="success">NHA HBP 2.2 Standard • Zero-Balance Billing</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Standard government packages • Mandatory documentation checklist • 100% cashless SHA reimbursement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">TMS Portal: CONNECTED</Badge>
          <Badge variant="success">Scheme: PM-JAY / Swasthya Sathi</Badge>
        </div>
      </div>

      {/* Grid: Beneficiary Card & Package Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Beneficiary KYC & TMS Wallet */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-amber-600">🪪</span> Beneficiary Verification
            </h2>
            <Badge variant="success">ELIGIBLE</Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-gray-500 block">PM-JAY Golden Card ID</label>
              <input
                type="text"
                className="w-full text-sm font-mono border rounded p-1.5 mt-1"
                value={goldenCardId}
                onChange={(e) => setGoldenCardId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block">Ration Card / NFSA ID</label>
              <input
                type="text"
                className="w-full text-sm font-mono border rounded p-1.5 mt-1"
                value={rationCardNumber}
                onChange={(e) => setRationCardNumber(e.target.value)}
              />
            </div>
            <div className="pt-1">
              <Button
                variant="secondary"
                className="w-full"
                disabled={isSubmitting}
                onClick={handleVerifyBeneficiary}
              >
                Verify on NHA Registry
              </Button>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-xs space-y-1">
            <div className="flex justify-between font-medium text-emerald-900">
              <span>Beneficiary:</span>
              <span>{beneficiaryName}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-800">
              <span>Annual Entitlement Balance:</span>
              <span>₹{annualBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* HBP 2.2 Package Selection & Mandatory Checklist */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">📦</span> Selected HBP 2.2 Package: {selectedPackage.package_code}
            </h2>
            <Badge variant="info">Tariff: ₹{selectedPackage.package_tariff.toLocaleString()}</Badge>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border text-sm">
              <span className="font-bold text-gray-900 block">{selectedPackage.package_name}</span>
              <div className="flex gap-4 text-xs text-gray-600 mt-1">
                <span>Specialty: <strong>{selectedPackage.specialty}</strong></span>
                <span>Standard ALOS: <strong>{selectedPackage.standard_alos_days} Days</strong></span>
                <span>Pre-Auth Required: <strong>YES</strong></span>
              </div>
            </div>

            {/* Mandatory Documentation Checklist Gate */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-700 block">
                NHA Mandatory Document Upload Checklist (All 4 Required for Pre-Auth):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>PM-JAY Golden Card Photocopy</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Pre-Op Ultrasound Abdomen Report</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Liver Function Tests (LFT)</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Clinical Admission Sheet with Photos</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Badge variant={preauthApproved ? 'success' : 'warning'}>
                {preauthApproved ? 'PRE-AUTH APPROVED BY SHA ✓' : 'AWAITING PRE-AUTH SUBMISSION'}
              </Badge>
              <Button
                variant="primary"
                disabled={isSubmitting || preauthApproved}
                onClick={handleInitiatePreauth}
              >
                {preauthApproved ? 'Pre-Auth Granted ✓' : 'Submit Pre-Auth to State Health Agency'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Zero-Balance Billing Claim Adjudication */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-purple-600">⚖️</span> Zero-Balance Billing Adjudication & Settlement
            </h2>
            <p className="text-xs text-gray-500">
              Under PM-JAY regulations, hospitals cannot balance bill beneficiaries. All OT, consumables & medicines are bundled into the package rate.
            </p>
          </div>
          <Badge variant="success">PATIENT BALANCE BILLING: ₹0.00 (STRICT)</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-gray-50 p-3 rounded border">
            <span className="text-gray-400 block">Approved HBP Tariff</span>
            <span className="font-bold text-gray-900 text-sm">₹{selectedPackage.package_tariff.toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded border">
            <span className="text-gray-400 block">SHA Government Payable</span>
            <span className="font-bold text-emerald-700 text-sm">₹{selectedPackage.package_tariff.toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded border">
            <span className="text-gray-400 block">Beneficiary Out-of-Pocket</span>
            <span className="font-bold text-emerald-600 text-sm">₹0.00 (100% Cashless)</span>
          </div>
          <div className="bg-gray-50 p-3 rounded border">
            <span className="text-gray-400 block">Disbursement Channel</span>
            <span className="font-bold text-blue-600 text-sm">PFMS Treasury Direct</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            disabled={isSubmitting || !preauthApproved || claimAdjudicated}
            onClick={handleAdjudicateZeroBalanceClaim}
          >
            {claimAdjudicated ? 'Discharge Claim Adjudicated & Submitted to SHA ✓' : 'Adjudicate Zero-Balance Discharge Claim'}
          </Button>
        </div>
      </div>
    </div>
  );
};
