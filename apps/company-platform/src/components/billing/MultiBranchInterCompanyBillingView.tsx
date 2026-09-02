import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface HospitalBranchNode {
  branchId: string;
  branchName: string;
  city: string;
  zone: 'NORTH' | 'SOUTH' | 'WEST' | 'EAST';
  gstin: string;
  bedCapacity: number;
  monthlyRevenueInr: number;
  doctorPayoutsInr: number;
  operationalExpensesInr: number;
  centralSharedServicesCostInr: number; // Inter-branch debit
  platformSubscriptionShareInr: number;
  netProfitInr: number;
  profitMarginPercent: number;
  status: 'PROFITABLE' | 'OPTIMAL' | 'UNDER_REVIEW';
}

export interface InterBranchJournalEntry {
  entryId: string;
  timestamp: string;
  debtorBranch: string; // Branch requesting service (Debit Expense)
  creditorBranch: string; // Central Hub providing service (Credit Revenue)
  serviceCategory: 'CENTRAL_MOLECULAR_GENOMICS' | 'SUPER_SPECIALITY_TELE_RADIOLOGY' | 'CENTRAL_BLOOD_BANK_TRANSFUSION' | 'CENTRAL_PHARMACY_DEPOT';
  unitsConsumed: number;
  transferPriceInr: number;
  gstStatus: 'INTRA_COMPANY_EXEMPT' | 'INTER_STATE_IGST_18';
  settlementStatus: 'AUTO_SETTLED_LEDGER' | 'PENDING_RECONCILIATION';
}

export const MultiBranchInterCompanyBillingView: React.FC = () => {
  const [selectedParentCorp, setSelectedParentCorp] = useState('Apollo Hospitals Enterprise Limited (AHEL)');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'BRANCH_PNL' | 'INTER_BRANCH_LEDGER' | 'CONSOLIDATED_MASTER_INVOICE'>('BRANCH_PNL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Hospital Branch Nodes List
  const [branches, setBranches] = useState<HospitalBranchNode[]>([
    {
      branchId: 'BR-APO-DEL-01',
      branchName: 'Apollo Main Super Speciality Hospital',
      city: 'New Delhi (Sarita Vihar)',
      zone: 'NORTH',
      gstin: '07AAACA1234F1Z1',
      bedCapacity: 750,
      monthlyRevenueInr: 48500000,
      doctorPayoutsInr: 19400000,
      operationalExpensesInr: 14550000,
      centralSharedServicesCostInr: 1200000,
      platformSubscriptionShareInr: 250000,
      netProfitInr: 13100000,
      profitMarginPercent: 27.0,
      status: 'PROFITABLE'
    },
    {
      branchId: 'BR-APO-BLR-02',
      branchName: 'Apollo Specialty Hospital Jayanagar',
      city: 'Bangalore',
      zone: 'SOUTH',
      gstin: '29AAACA1234F1Z8',
      bedCapacity: 350,
      monthlyRevenueInr: 26800000,
      doctorPayoutsInr: 10720000,
      operationalExpensesInr: 8840000,
      centralSharedServicesCostInr: 850000,
      platformSubscriptionShareInr: 150000,
      netProfitInr: 6240000,
      profitMarginPercent: 23.3,
      status: 'PROFITABLE'
    },
    {
      branchId: 'BR-APO-HYD-03',
      branchName: 'Apollo Health City Jubilee Hills',
      city: 'Hyderabad',
      zone: 'SOUTH',
      gstin: '36AAACA1234F1Z2',
      bedCapacity: 500,
      monthlyRevenueInr: 39200000,
      doctorPayoutsInr: 15680000,
      operationalExpensesInr: 12150000,
      centralSharedServicesCostInr: 1100000,
      platformSubscriptionShareInr: 200000,
      netProfitInr: 10070000,
      profitMarginPercent: 25.7,
      status: 'PROFITABLE'
    },
    {
      branchId: 'BR-APO-MUM-04',
      branchName: 'Apollo Hospital Navi Mumbai',
      city: 'Navi Mumbai',
      zone: 'WEST',
      gstin: '27AAACA1234F1Z5',
      bedCapacity: 450,
      monthlyRevenueInr: 34100000,
      doctorPayoutsInr: 13640000,
      operationalExpensesInr: 11200000,
      centralSharedServicesCostInr: 950000,
      platformSubscriptionShareInr: 180000,
      netProfitInr: 8130000,
      profitMarginPercent: 23.8,
      status: 'PROFITABLE'
    },
    {
      branchId: 'BR-APO-CCU-05',
      branchName: 'Apollo Gleneagles Hospital',
      city: 'Kolkata',
      zone: 'EAST',
      gstin: '19AAACA1234F1Z3',
      bedCapacity: 300,
      monthlyRevenueInr: 21500000,
      doctorPayoutsInr: 9240000,
      operationalExpensesInr: 7950000,
      centralSharedServicesCostInr: 720000,
      platformSubscriptionShareInr: 140000,
      netProfitInr: 3450000,
      profitMarginPercent: 16.0,
      status: 'OPTIMAL'
    }
  ]);

  // Inter-Branch Cost Allocation Journal Entries
  const [journalEntries, setJournalEntries] = useState<InterBranchJournalEntry[]>([
    {
      entryId: 'JRN-INT-901',
      timestamp: '2026-09-02 05:40 AM',
      debtorBranch: 'Apollo Specialty Hospital Jayanagar (Bangalore)',
      creditorBranch: 'Apollo Main Super Speciality Hospital (Delhi Central Genomics Hub)',
      serviceCategory: 'CENTRAL_MOLECULAR_GENOMICS',
      unitsConsumed: 24, // 24 Oncogenomics sequencing samples
      transferPriceInr: 360000,
      gstStatus: 'INTER_STATE_IGST_18',
      settlementStatus: 'AUTO_SETTLED_LEDGER'
    },
    {
      entryId: 'JRN-INT-902',
      timestamp: '2026-09-02 04:15 AM',
      debtorBranch: 'Apollo Hospital Navi Mumbai',
      creditorBranch: 'Apollo Health City Jubilee Hills (Hyderabad Central AI Radiology)',
      serviceCategory: 'SUPER_SPECIALITY_TELE_RADIOLOGY',
      unitsConsumed: 68, // 68 AI Neuro MRI Over-reads
      transferPriceInr: 136000,
      gstStatus: 'INTER_STATE_IGST_18',
      settlementStatus: 'AUTO_SETTLED_LEDGER'
    },
    {
      entryId: 'JRN-INT-903',
      timestamp: '2026-09-01 11:30 PM',
      debtorBranch: 'Apollo Gleneagles Hospital (Kolkata)',
      creditorBranch: 'Apollo Main Super Speciality Hospital (Delhi)',
      serviceCategory: 'CENTRAL_BLOOD_BANK_TRANSFUSION',
      unitsConsumed: 12, // 12 Rare Bombay Blood Group Units
      transferPriceInr: 72000,
      gstStatus: 'INTER_STATE_IGST_18',
      settlementStatus: 'AUTO_SETTLED_LEDGER'
    },
    {
      entryId: 'JRN-INT-904',
      timestamp: '2026-09-01 08:20 PM',
      debtorBranch: 'Apollo Specialty Hospital Jayanagar',
      creditorBranch: 'Apollo Central Warehouse Depot',
      serviceCategory: 'CENTRAL_PHARMACY_DEPOT',
      unitsConsumed: 450, // Critical ICU Biologics Vials
      transferPriceInr: 280000,
      gstStatus: 'INTRA_COMPANY_EXEMPT',
      settlementStatus: 'AUTO_SETTLED_LEDGER'
    }
  ]);

  // Calculations
  const filteredBranches = branches.filter((b) => {
    if (selectedZone === 'ALL') return true;
    return b.zone === selectedZone;
  });

  const totalConsolidatedRevenue = branches.reduce((acc, curr) => acc + curr.monthlyRevenueInr, 0);
  const totalConsolidatedDoctorPayouts = branches.reduce((acc, curr) => acc + curr.doctorPayoutsInr, 0);
  const totalConsolidatedOpEx = branches.reduce((acc, curr) => acc + curr.operationalExpensesInr, 0);
  const totalConsolidatedNetProfit = branches.reduce((acc, curr) => acc + curr.netProfitInr, 0);
  const overallProfitMargin = Number(((totalConsolidatedNetProfit / totalConsolidatedRevenue) * 100).toFixed(1));
  const totalInterBranchVolume = journalEntries.reduce((acc, curr) => acc + curr.transferPriceInr, 0);

  const handleGenerateConsolidatedInvoice = () => {
    setActionNotice('📄 Consolidated Master Enterprise Tax Invoice #INV-AHEL-CORP-2026-09 generated successfully for ₹17,01,00,000 across 5 active hospital branches. IRN hash registered with GST e-Invoicing portal.');
  };

  const handleCreateInterBranchAllocation = () => {
    const newEntry: InterBranchJournalEntry = {
      entryId: `JRN-INT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString(),
      debtorBranch: 'Apollo Gleneagles Hospital (Kolkata)',
      creditorBranch: 'Apollo Health City Jubilee Hills (Hyderabad)',
      serviceCategory: 'SUPER_SPECIALITY_TELE_RADIOLOGY',
      unitsConsumed: 15,
      transferPriceInr: 45000,
      gstStatus: 'INTER_STATE_IGST_18',
      settlementStatus: 'AUTO_SETTLED_LEDGER'
    };
    setJournalEntries([newEntry, ...journalEntries]);
    setActionNotice(`⚡ New Inter-Branch Shared Cost Allocation [${newEntry.entryId}] posted: ₹45,000 debited from Kolkata Branch and credited to Hyderabad Central Hub.`);
  };

  const handleAddNewBranch = () => {
    const newBranch: HospitalBranchNode = {
      branchId: `BR-APO-PUN-0${branches.length + 1}`,
      branchName: 'Apollo Cradle & Children Hospital Pune',
      city: 'Pune',
      zone: 'WEST',
      gstin: '27AAACA1234F1Z9',
      bedCapacity: 180,
      monthlyRevenueInr: 14500000,
      doctorPayoutsInr: 5800000,
      operationalExpensesInr: 4900000,
      centralSharedServicesCostInr: 420000,
      platformSubscriptionShareInr: 95000,
      netProfitInr: 3285000,
      profitMarginPercent: 22.6,
      status: 'PROFITABLE'
    };
    setBranches([...branches, newBranch]);
    setActionNotice(`🏢 New Hospital Branch [${newBranch.branchName}] provisioned under ${selectedParentCorp} master ledger!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(16, 185, 129, 0.15) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>🏢</span>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Multi-Branch & Multi-Entity Inter-Company Consolidated Billing
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Active Master Entity:</span>
                <select
                  value={selectedParentCorp}
                  onChange={(e) => {
                    setSelectedParentCorp(e.target.value);
                    setActionNotice(`Switched Active Corporate Master Entity to: ${e.target.value}`);
                  }}
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    color: '#38BDF8',
                    fontSize: '0.8125rem',
                    fontWeight: 700
                  }}
                >
                  <option value="Apollo Hospitals Enterprise Limited (AHEL)">Apollo Hospitals Enterprise Limited (AHEL)</option>
                  <option value="Max Healthcare Institute Limited (MHIL)">Max Healthcare Institute Limited (MHIL)</option>
                  <option value="Fortis Healthcare Group Trust">Fortis Healthcare Group Trust</option>
                  <option value="Manipal Health Enterprises Private Limited">Manipal Health Enterprises Private Limited</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={handleAddNewBranch}>
            ➕ Add Branch Node
          </Button>
          <Button variant="secondary" onClick={handleCreateInterBranchAllocation}>
            🔄 Post Inter-Branch Cost Entry
          </Button>
          <Button variant="primary" onClick={handleGenerateConsolidatedInvoice}>
            📑 1-Click Master Invoice
          </Button>
        </div>
      </div>

      {actionNotice && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1.5px solid #10B981',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#6EE7B7',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Consolidated Master Entity Radar Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#93C5FD', fontWeight: 800, textTransform: 'uppercase' }}>
            CONSOLIDATED NETWORK REVENUE
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
            ₹{(totalConsolidatedRevenue / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
            Across 5 Active Hospital Hubs ({branches.reduce((a, c) => a + c.bedCapacity, 0)} Beds)
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1.5px solid #10B981', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            NETWORK NET PROFIT (EBITDA)
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            ₹{(totalConsolidatedNetProfit / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '2px', fontWeight: 700 }}>
            {overallProfitMargin}% Consolidated Margin
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
            INTER-BRANCH SHARED SERVICES
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            ₹{(totalInterBranchVolume / 100000).toFixed(2)} Lakh
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
            {journalEntries.length} Auto-Reconciled Inter-Unit Debits
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>
            DOCTOR & OPERATIONAL EXPENSES
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
            ₹{((totalConsolidatedDoctorPayouts + totalConsolidatedOpEx) / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
            Doctor Payouts: ₹{(totalConsolidatedDoctorPayouts / 10000000).toFixed(2)} Cr
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'BRANCH_PNL' as const, label: '📊 Branch-Level P&L Radar' },
            { id: 'INTER_BRANCH_LEDGER' as const, label: '🔄 Inter-Branch Shared Cost Ledger' },
            { id: 'CONSOLIDATED_MASTER_INVOICE' as const, label: '📑 Consolidated Master Billing' }
          ].map((tab) => {
            const isSelected = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                  border: isSelected ? '1.5px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#FFFFFF' : '#94A3B8',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeSubTab === 'BRANCH_PNL' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Filter Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#FFF',
                fontSize: '0.8125rem'
              }}
            >
              <option value="ALL">All Zones (National)</option>
              <option value="NORTH">North Zone</option>
              <option value="SOUTH">South Zone</option>
              <option value="WEST">West Zone</option>
              <option value="EAST">East Zone</option>
            </select>
          </div>
        )}
      </div>

      {/* 4. Tab Contents */}

      {/* SUB-TAB 1: Branch-Level P&L Radar */}
      {activeSubTab === 'BRANCH_PNL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredBranches.map((branch) => (
            <div
              key={branch.branchId}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
              }}
            >
              {/* Branch Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#FFFFFF' }}>{branch.branchName}</span>
                    <Badge variant="primary">{branch.zone} ZONE</Badge>
                    <Badge variant="success">GSTIN: {branch.gstin}</Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                    Branch ID: <strong style={{ color: '#E2E8F0' }}>{branch.branchId}</strong> • Location: <strong style={{ color: '#38BDF8' }}>{branch.city}</strong> • Bed Capacity: <strong>{branch.bedCapacity} Beds</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
                    ₹{(branch.netProfitInr / 100000).toFixed(2)} Lakh Net Profit
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>
                    {branch.profitMarginPercent}% EBITDA Margin
                  </div>
                </div>
              </div>

              {/* Financial Metrics Strip */}
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '12px',
                fontSize: '0.8125rem'
              }}>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Gross Revenue:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 700 }}>₹{(branch.monthlyRevenueInr / 100000).toFixed(2)} Lakh</span>
                </div>

                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Doctor Payouts (Direct):</span>
                  <span style={{ color: '#FCD34D', fontWeight: 700 }}>-₹{(branch.doctorPayoutsInr / 100000).toFixed(2)} Lakh</span>
                </div>

                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Hospital Operational Expenses:</span>
                  <span style={{ color: '#F87171', fontWeight: 700 }}>-₹{(branch.operationalExpensesInr / 100000).toFixed(2)} Lakh</span>
                </div>

                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Inter-Branch Shared Services (Debit):</span>
                  <span style={{ color: '#C084FC', fontWeight: 700 }}>-₹{(branch.centralSharedServicesCostInr / 100000).toFixed(2)} Lakh</span>
                </div>

                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>DocSearch SaaS Share:</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>-₹{(branch.platformSubscriptionShareInr / 1000).toFixed(0)} K</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 2: Inter-Branch Shared Cost Ledger */}
      {activeSubTab === 'INTER_BRANCH_LEDGER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '18px'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '8px', textTransform: 'uppercase' }}>
              🔄 Central Diagnostic & Radiology Internal Transfer Pricing (ITP) Rules
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
              Central hubs (Genomics sequencing, AI Over-read MRI, Rare Blood Units) automatically debit the requesting branch cost center and credit the central performing facility at audited Transfer Pricing rates with automated IGST / Intra-company tax classification.
            </p>
          </div>

          {journalEntries.map((jrn) => (
            <div
              key={jrn.entryId}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9375rem' }}>{jrn.serviceCategory.replace(/_/g, ' ')}</span>
                    <Badge variant="neutral">{jrn.gstStatus}</Badge>
                    <Badge variant="success">AUTO SETTLED</Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                    Entry ID: <strong style={{ color: '#E2E8F0' }}>{jrn.entryId}</strong> • Timestamp: {jrn.timestamp}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399' }}>
                    ₹{jrn.transferPriceInr.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                    {jrn.unitsConsumed} Units Consumed
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '0.8125rem'
              }}>
                <div>
                  <span style={{ color: '#F87171', fontWeight: 700 }}>🔴 DEBIT COST CENTER (Requesting Branch):</span>
                  <div style={{ color: '#E2E8F0', marginTop: '2px' }}>{jrn.debtorBranch}</div>
                </div>
                <div>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>🟢 CREDIT REVENUE (Performing Central Hub):</span>
                  <div style={{ color: '#E2E8F0', marginTop: '2px' }}>{jrn.creditorBranch}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: Consolidated Master Billing */}
      {activeSubTab === 'CONSOLIDATED_MASTER_INVOICE' && (
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1.5px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>
                CORPORATE ENTERPRISE MASTER TAX INVOICE
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                {selectedParentCorp}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                Corporate Master Account #C-AHEL-9901 • GSTIN: 07AAACA1234F1Z1 • Billing Period: September 2026
              </div>
            </div>
            <Badge variant="primary">CONSOLIDATED B2B</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
              BRANCH-WISE CHARGE ALLOCATION BREAKDOWN:
            </div>
            {branches.map((b) => (
              <div key={b.branchId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '8px 12px', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '6px' }}>
                <span style={{ color: '#E2E8F0' }}>{b.branchName} ({b.city})</span>
                <span style={{ fontWeight: 700, color: '#38BDF8' }}>₹{b.platformSubscriptionShareInr.toLocaleString('en-IN')}</span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, marginTop: '8px', borderTop: '1px dashed rgba(255, 255, 255, 0.2)', paddingTop: '10px' }}>
              <span style={{ color: '#FFFFFF' }}>Total Consolidated SaaS Subscription:</span>
              <span style={{ color: '#34D399' }}>₹{branches.reduce((a, c) => a + c.platformSubscriptionShareInr, 0).toLocaleString('en-IN')}/mo</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <Button variant="primary" onClick={handleGenerateConsolidatedInvoice}>
              🚀 Issue Master Invoice with NIC IRN QR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
