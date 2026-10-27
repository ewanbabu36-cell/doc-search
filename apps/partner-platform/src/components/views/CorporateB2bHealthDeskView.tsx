import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

interface CorporateAccount {
  id: string;
  company_name: string;
  contract_code: string;
  total_enrolled_employees: number;
  monthly_allowance_per_emp: number;
  current_month_billed_amount: number;
  gstin: string;
  status: string;
}

const INITIAL_CLIENTS: CorporateAccount[] = [
  {
    id: '1',
    company_name: 'Tata Consultancy Services (TCS)',
    contract_code: 'CORP-TCS-2026',
    total_enrolled_employees: 1450,
    monthly_allowance_per_emp: 1500,
    current_month_billed_amount: 217500,
    gstin: '27AAACT2727Q1ZW',
    status: 'ACTIVE'
  },
  {
    id: '2',
    company_name: 'Infosys Technologies Ltd',
    contract_code: 'CORP-INFY-2026',
    total_enrolled_employees: 820,
    monthly_allowance_per_emp: 1500,
    current_month_billed_amount: 123000,
    gstin: '29AAACI4321A1ZK',
    status: 'ACTIVE'
  },
  {
    id: '3',
    company_name: 'Reliance Jio Infocomm',
    contract_code: 'CORP-JIO-2026',
    total_enrolled_employees: 2200,
    monthly_allowance_per_emp: 2000,
    current_month_billed_amount: 440000,
    gstin: '27AAACR1234D1ZP',
    status: 'ACTIVE'
  }
];

export const CorporateB2bHealthDeskView: React.FC = () => {
  const [clients, setClients] = useState<CorporateAccount[]>(INITIAL_CLIENTS);
  const [selectedClient, setSelectedClient] = useState<CorporateAccount>(INITIAL_CLIENTS[0]!);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceNotification, setInvoiceNotification] = useState<string | null>(null);

  // Bulk Enroll Simulation
  const handleBulkEnrollEmployees = async () => {
    setIsProcessing(true);
    try {
      const res = await apiRequest<{
        contractCode: string;
        enrolledCount: number;
      }>('/api/v1/partner/corporate-b2b/employees/bulk-enroll', {
        method: 'POST',
        body: JSON.stringify({
          contractCode: selectedClient.contract_code,
          employees: [
            { employeeId: 'EMP-9901', fullName: 'Amitabh Sen', email: 'a.sen@tcs.com', phone: '+91 98110 00111', department: 'Cloud & AI' },
            { employeeId: 'EMP-9902', fullName: 'Deepika Roy', email: 'd.roy@tcs.com', phone: '+91 98110 00222', department: 'Enterprise Systems' }
          ]
        })
      });

      if (res.data) {
        setClients((prev) =>
          prev.map((c) =>
            c.contract_code === selectedClient.contract_code
              ? { ...c, total_enrolled_employees: c.total_enrolled_employees + 2 }
              : c
          )
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Monthly Invoicing Release
  const handleGenerateMonthlyInvoice = async () => {
    setIsProcessing(true);
    try {
      const res = await apiRequest<{
        invoiceReference: string;
        grandTotalPayable: number;
        corporateClient: string;
      }>('/api/v1/partner/corporate-b2b/invoicing/generate-monthly-ledger', {
        method: 'POST',
        body: JSON.stringify({
          contractCode: selectedClient.contract_code,
          billingMonth: 'October 2026'
        })
      });

      if (res.data) {
        setInvoiceNotification(
          `Monthly Invoice ${res.data.invoiceReference} released to ${res.data.corporateClient}! Grand Total: ₹${res.data.grandTotalPayable.toLocaleString('en-IN')} (Cashless Billed)`
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Corporate Enterprise B2B Healthcare &amp; On-Site Dispensary SaaS
            </h1>
            <Badge variant="primary">Ekincare &amp; MediBuddy Benchmark</Badge>
            <Badge variant="success">Cashless Monthly Invoicing</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empower enterprise corporate accounts (TCS, Infosys, Reliance) with employee family health passes, on-premises corporate dispensary billing, and automated monthly consolidated GST invoicing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkEnrollEmployees}
            disabled={isProcessing}
          >
            {isProcessing ? 'Enrolling...' : '+ Quick Enroll Employees'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateMonthlyInvoice}
            disabled={isProcessing}
          >
            📄 Release Monthly Invoice
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      {invoiceNotification && (
        <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold">✔ INVOICE ISSUED:</span>
            <span>{invoiceNotification}</span>
          </div>
          <button onClick={() => setInvoiceNotification(null)} className="font-bold text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Total Enterprise Accounts</span>
          <span className="text-xl font-bold text-white mt-1 block">3 Active Corporates</span>
          <span className="text-[11px] text-slate-500">Tier-1 IT &amp; Telecom Conglomerates</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Covered Corporate Employees</span>
          <span className="text-xl font-bold text-teal-400 mt-1 block">4,470 Lives</span>
          <span className="text-[11px] text-emerald-400">100% Cashless Health Passes</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Monthly Contracted Retainer</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">₹7,80,500</span>
          <span className="text-[11px] text-slate-500">Zero Middleman Commission</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Dispensary Stock Turns</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">99.4% Fulfillment</span>
          <span className="text-[11px] text-slate-500">On-Site Company Medical Rooms</span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Left Column: Corporate Accounts Table (7 Cols) */}
        <div className="col-span-7 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-200">Corporate Enterprise Contracts</span>
            <span className="text-xs text-slate-500">{clients.length} Contracts</span>
          </div>

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Corporate Client</th>
                <th className="p-3">Contract Code</th>
                <th className="p-3">Employees</th>
                <th className="p-3">Monthly Pass</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clients.map((c) => {
                const isSelected = selectedClient.contract_code === c.contract_code;

                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedClient(c)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-900/90 font-bold' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="p-3">
                      <p className="font-bold text-white">{c.company_name}</p>
                      <p className="text-[11px] text-slate-500">GSTIN: {c.gstin}</p>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-teal-400">{c.contract_code}</td>
                    <td className="p-3 font-bold text-white">{c.total_enrolled_employees}</td>
                    <td className="p-3 text-emerald-400 font-bold">₹{c.monthly_allowance_per_emp}/emp</td>
                    <td className="p-3">
                      <Badge variant="success">{c.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column: Corporate Health Account Inspector (5 Cols) */}
        <div className="col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Corporate Contract Details
              </span>
              <Badge variant="primary">{selectedClient.contract_code}</Badge>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-base font-bold text-white">{selectedClient.company_name}</p>
              <p className="text-slate-400">
                Contracted Quota: <strong className="text-white">{selectedClient.total_enrolled_employees} Enrolled Employees</strong>
              </p>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Allowance Allocation:</span>
                  <strong className="text-white">₹{selectedClient.monthly_allowance_per_emp} / Employee</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Monthly Billing:</span>
                  <strong className="text-emerald-400">
                    ₹{(selectedClient.total_enrolled_employees * selectedClient.monthly_allowance_per_emp).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GST Status (18% Reverse Charge):</span>
                  <strong className="text-slate-300">GSTIN Verified</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Included Corporate Services
                </span>
                <p className="text-[11px] text-slate-300">✔ On-Premises Company Dispensary Stock Refill</p>
                <p className="text-[11px] text-slate-300">✔ Annual Executive Health Checkup Packages (42 Tests)</p>
                <p className="text-[11px] text-slate-300">✔ Priority OPD Chamber Access with Zero Wait-Time</p>
                <p className="text-[11px] text-slate-300">✔ 1-Click Cashless Hospital IPD Admission Clearance</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerateMonthlyInvoice}
              disabled={isProcessing}
              className="w-full"
            >
              📄 Generate Automated Monthly GST Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
