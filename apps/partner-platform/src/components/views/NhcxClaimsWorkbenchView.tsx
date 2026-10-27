import React, { useState, useEffect } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

interface NhcxClaim {
  id: string;
  patientUhId: string;
  patientName: string;
  ipdAdmissionId: string;
  payerName: string;
  policyNumber: string;
  requestedAmount: number;
  approvedAmount: number;
  status: 'PRE_AUTH_APPROVED' | 'DISCHARGE_SUBMITTED' | 'SETTLED' | 'QUERIED';
  nhcxTransactionRef: string;
  adjudicationLatencyMs: number;
  patientPayableCopay: number;
}

const INITIAL_CLAIMS: NhcxClaim[] = [
  {
    id: 'NHCX-CLAIM-101',
    patientUhId: 'UHID-2026-901',
    patientName: 'Rajiv Malhotra (54M)',
    ipdAdmissionId: 'IPD-ADM-8812',
    payerName: 'Star Health & Allied Insurance',
    policyNumber: 'POL-STAR-992182',
    requestedAmount: 65000,
    approvedAmount: 59800,
    status: 'PRE_AUTH_APPROVED',
    nhcxTransactionRef: 'NHCX-PA-8821901',
    adjudicationLatencyMs: 4200,
    patientPayableCopay: 5200
  },
  {
    id: 'NHCX-CLAIM-102',
    patientUhId: 'UHID-2026-904',
    patientName: 'Meenakshi Sundaram (48F)',
    ipdAdmissionId: 'IPD-ADM-8815',
    payerName: 'HDFC ERGO Health Insurance',
    policyNumber: 'POL-HDFC-334190',
    requestedAmount: 110000,
    approvedAmount: 104500,
    status: 'SETTLED',
    nhcxTransactionRef: 'NHCX-SETTLE-331209',
    adjudicationLatencyMs: 3800,
    patientPayableCopay: 5500
  }
];

export const NhcxClaimsWorkbenchView: React.FC = () => {
  const [claims, setClaims] = useState<NhcxClaim[]>(INITIAL_CLAIMS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [activeDischargeAlert, setActiveDischargeAlert] = useState<string | null>(null);

  // Instant Pre-Auth Trigger
  const handleInitiatePreAuth = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest<{
        nhcxTransactionRef: string;
        status: string;
        approvedLimit: number;
        requestedAmount: number;
      }>('/api/v1/partner/insurance/nhcx/pre-auth/initiate', {
        method: 'POST',
        body: JSON.stringify({
          patientUhId: 'UHID-2026-909',
          patientName: 'Sanjay Deshmukh (51M)',
          ipdAdmissionId: 'IPD-ADM-8820',
          payerName: 'Niva Bupa Health Insurance',
          policyNumber: 'POL-NB-778812',
          primaryDiagnosisCode: 'K80.0 (Calculus of gallbladder)',
          procedurePlanned: 'Laparoscopic Cholecystectomy',
          estimatedAmount: 70000
        })
      });

      if (res.data) {
        const data = res.data;
        const newClaim: NhcxClaim = {
          id: `NHCX-${Date.now().toString().slice(-4)}`,
          patientUhId: 'UHID-2026-909',
          patientName: 'Sanjay Deshmukh (51M)',
          ipdAdmissionId: 'IPD-ADM-8820',
          payerName: 'Niva Bupa Health Insurance',
          policyNumber: 'POL-NB-778812',
          requestedAmount: data.requestedAmount,
          approvedAmount: data.approvedLimit,
          status: 'PRE_AUTH_APPROVED',
          nhcxTransactionRef: data.nhcxTransactionRef,
          adjudicationLatencyMs: 3900,
          patientPayableCopay: data.requestedAmount - data.approvedLimit
        };
        setClaims([newClaim, ...claims]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 180-Second Discharge Adjudication Trigger
  const handleSubmitDischargeClaim = async (claimRef: string) => {
    setIsSubmitting(true);
    setCountdownSeconds(180);
    try {
      const res = await apiRequest<{
        settlementTransactionRef: string;
        insurerApprovedPayout: number;
        patientPayableCopay: number;
      }>('/api/v1/partner/insurance/nhcx/claim/submit-discharge-bundle', {
        method: 'POST',
        body: JSON.stringify({
          preAuthTransactionRef: claimRef,
          patientUhId: 'UHID-2026-901',
          patientName: 'Rajiv Malhotra',
          payerName: 'Star Health & Allied Insurance',
          policyNumber: 'POL-STAR-992182',
          totalInvoiceAmount: 68500,
          finalDiagnosisIcd10: 'K80.0'
        })
      });

      if (res.data) {
        const settleData = res.data;
        setActiveDischargeAlert(
          `Discharge Claim ${settleData.settlementTransactionRef} settled! Insurer Payout: ₹${settleData.insurerApprovedPayout}, Patient Co-pay: ₹${settleData.patientPayableCopay}`
        );
        setClaims((prev) =>
          prev.map((c) =>
            c.nhcxTransactionRef === claimRef
              ? {
                  ...c,
                  status: 'SETTLED',
                  approvedAmount: settleData.insurerApprovedPayout,
                  patientPayableCopay: settleData.patientPayableCopay
                }
              : c
          )
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!countdownSeconds || countdownSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setCountdownSeconds((sec) => (sec && sec > 1 ? sec - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSeconds]);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Top Banner & Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold tracking-tight text-white">
              NHCX Instant Cashless Claim Adjudication Desk
            </h1>
            <Badge variant="primary">IRDAI / NHA Gateway Active</Badge>
            <Badge variant="success">3-Min SLA Guaranteed</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Replaces legacy 4–6 hour paper discharge waits with automated FHIR Claim bundle adjudication on the National Health Claims Exchange.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleInitiatePreAuth}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing NHCX...' : '+ Instant Pre-Auth Test'}
          </Button>
        </div>
      </div>

      {/* Discharge Alert Banner */}
      {activeDischargeAlert && (
        <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold">✔ SETTLED:</span>
            <span>{activeDischargeAlert}</span>
          </div>
          <button
            onClick={() => setActiveDischargeAlert(null)}
            className="text-emerald-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Countdown Timer Strip if Active */}
      {countdownSeconds !== null && countdownSeconds > 0 && (
        <div className="mt-4 p-4 bg-teal-950/60 border border-teal-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-3 w-3 rounded-full bg-teal-400 animate-ping" />
            <div>
              <p className="font-bold text-sm text-teal-300">
                NHCX Real-Time Adjudication Engine Processing
              </p>
              <p className="text-xs text-slate-400">
                Parsing clinical MAR records, surgical billing items, and insurer policy matrices...
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-mono font-bold text-teal-400">
              {countdownSeconds}s
            </span>
            <span className="text-[10px] text-slate-400 block">SLA Ceiling: 180s</span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Avg NHCX Adjudication Time</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">42.4 Seconds</span>
          <span className="text-[11px] text-slate-500">vs 4.8 Hours Industry Avg (Practo/TPA)</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Instant Pre-Auth Approval Rate</span>
          <span className="text-xl font-bold text-white mt-1 block">96.8%</span>
          <span className="text-[11px] text-emerald-400">IRDAI Clean-Claim Pass</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">TPA Deduction Arbitrage Saved</span>
          <span className="text-xl font-bold text-teal-400 mt-1 block">₹4,82,400</span>
          <span className="text-[11px] text-slate-500">Zero Unjustified Deductions</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Connected Insurers & TPAs</span>
          <span className="text-xl font-bold text-white mt-1 block">28 Payers</span>
          <span className="text-[11px] text-slate-500">Star, HDFC, Care, Niva, Medi Assist</span>
        </div>
      </div>

      {/* Claims List Table */}
      <div className="mt-6 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-200">
            Active Hospital Cashless Claims (NHCX Monitored)
          </span>
          <span className="text-xs text-slate-500">{claims.length} Records</span>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3">Patient & UHID</th>
              <th className="p-3">Insurer / TPA</th>
              <th className="p-3">Policy No</th>
              <th className="p-3">Claim Request</th>
              <th className="p-3">Approved Limit</th>
              <th className="p-3">Status</th>
              <th className="p-3">Latency</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {claims.map((c) => (
              <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="p-3">
                  <p className="font-bold text-white">{c.patientName}</p>
                  <p className="text-[11px] text-slate-500">{c.patientUhId} • {c.ipdAdmissionId}</p>
                </td>
                <td className="p-3 font-medium text-slate-300">{c.payerName}</td>
                <td className="p-3 font-mono text-[11px] text-slate-400">{c.policyNumber}</td>
                <td className="p-3 font-bold text-white">₹{c.requestedAmount.toLocaleString()}</td>
                <td className="p-3 font-bold text-emerald-400">₹{c.approvedAmount.toLocaleString()}</td>
                <td className="p-3">
                  <Badge
                    variant={
                      c.status === 'SETTLED'
                        ? 'success'
                        : c.status === 'PRE_AUTH_APPROVED'
                        ? 'primary'
                        : 'warning'
                    }
                  >
                    {c.status}
                  </Badge>
                </td>
                <td className="p-3 text-slate-400 font-mono">{(c.adjudicationLatencyMs / 1000).toFixed(1)}s</td>
                <td className="p-3 text-right">
                  {c.status === 'PRE_AUTH_APPROVED' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSubmitDischargeClaim(c.nhcxTransactionRef)}
                      disabled={isSubmitting}
                    >
                      ⚡ Settle Discharge (&lt;180s)
                    </Button>
                  ) : (
                    <span className="text-emerald-400 font-semibold text-xs">✔ Settled to Bank</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
