import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import { generateAndDownloadCorporateInvoicePdf, CorporateInvoiceData } from '../../utils/clientCorporateInvoicePdf.js';

export interface CorporateContract {
  id: string;
  companyName: string;
  logo: string;
  gstin: string;
  corporateDomain: string;
  employeeHeadcount: number;
  planName: string;
  ratePerEmployeeInr: number;
  annualContractValueInr: number;
  contractStartDate: string;
  contractEndDate: string;
  status: 'ACTIVE_CONTRACT' | 'RENEWAL_PENDING' | 'DRAFT';
  addonsIncluded: string[];
}

const INITIAL_CONTRACTS: CorporateContract[] = [
  {
    id: 'CORP-TCS-01',
    companyName: 'Tata Consultancy Services (TCS)',
    logo: '🏢',
    gstin: '27AABCT2345M1Z2',
    corporateDomain: '@tcs.com',
    employeeHeadcount: 45000,
    planName: 'Enterprise Health Pass (Custom Shield)',
    ratePerEmployeeInr: 399,
    annualContractValueInr: 17955000, // ₹ 1.795 Cr
    contractStartDate: '01 Apr 2026',
    contractEndDate: '31 Mar 2027',
    status: 'ACTIVE_CONTRACT',
    addonsIncluded: ['Unlimited Tele-OPD', '20% Pharmacy', '108 Ambulance Dispatch']
  },
  {
    id: 'CORP-INFY-02',
    companyName: 'Infosys Limited',
    logo: '🏢',
    gstin: '29AABCI1234L1Z9',
    corporateDomain: '@infosys.com',
    employeeHeadcount: 32000,
    planName: 'Executive Wellness & Mental Health Pass',
    ratePerEmployeeInr: 449,
    annualContractValueInr: 14368000, // ₹ 1.436 Cr
    contractStartDate: '01 May 2026',
    contractEndDate: '30 Apr 2027',
    status: 'ACTIVE_CONTRACT',
    addonsIncluded: ['24/7 Mental Health', 'Annual Full Body Panel', 'Priority Chamber Access']
  },
  {
    id: 'CORP-WIPRO-03',
    companyName: 'Wipro Enterprises',
    logo: '🏢',
    gstin: '29AABCW9876K1Z1',
    corporateDomain: '@wipro.com',
    employeeHeadcount: 18500,
    planName: 'Comprehensive Family Health Shield',
    ratePerEmployeeInr: 499,
    annualContractValueInr: 9231500, // ₹ 92.31 Lakhs
    contractStartDate: '15 Jan 2026',
    contractEndDate: '14 Jan 2027',
    status: 'ACTIVE_CONTRACT',
    addonsIncluded: ['Family Tele-Pediatrics', '25% Lab Discount', 'Free Home Collection']
  }
];

export const B2bCorporateWellnessCustomizerView: React.FC = () => {
  const [contracts, setContracts] = useState<CorporateContract[]>(INITIAL_CONTRACTS);
  const [notice, setNotice] = useState<string | null>(null);

  // Interactive Bulk Calculator State
  const [clientName, setClientName] = useState('HCLTech Enterprises');
  const [clientGstin, setClientGstin] = useState('07AABCH4567N1Z8');
  const [clientDomain, setClientDomain] = useState('@hcltech.com');
  const [headcount, setHeadcount] = useState<number>(15000);
  const [baseTier, setBaseTier] = useState<'STANDARD' | 'EXECUTIVE' | 'VIP'>('EXECUTIVE');

  // Add-on switches
  const [includeMentalHealth, setIncludeMentalHealth] = useState(true); // +₹49
  const [includeExecutiveLab, setIncludeExecutiveLab] = useState(true); // +₹120
  const [includePediatricShield, setIncludePediatricShield] = useState(false); // +₹75

  // Tier Base Prices
  const basePriceMap = {
    STANDARD: 499,
    EXECUTIVE: 799,
    VIP: 1299
  };

  const basePrice = basePriceMap[baseTier];

  // Volume discount calculation
  let volumeDiscountPercent = 10;
  if (headcount > 50000) volumeDiscountPercent = 45;
  else if (headcount > 10000) volumeDiscountPercent = 35;
  else if (headcount > 2500) volumeDiscountPercent = 20;

  // Add-on calculation
  let addonCost = 0;
  if (includeMentalHealth) addonCost += 49;
  if (includeExecutiveLab) addonCost += 120;
  if (includePediatricShield) addonCost += 75;

  const discountedBasePrice = basePrice * (1 - volumeDiscountPercent / 100);
  const finalRatePerEmployee = Math.round(discountedBasePrice + addonCost);

  const calculatedSubtotal = finalRatePerEmployee * headcount;
  const calculatedGst = Math.round(calculatedSubtotal * 0.18); // 18% GST (SAC 999312)
  const calculatedGrandTotal = calculatedSubtotal + calculatedGst;

  const handleDownloadInvoice = (contract: CorporateContract) => {
    const subtotal = contract.annualContractValueInr;
    const gst = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + gst;

    const invoicePayload: CorporateInvoiceData = {
      invoiceNumber: `INV-${contract.id.replace('CORP-', '')}-${Date.now().toString().slice(-4)}`,
      corporateName: contract.companyName,
      corporateGstin: contract.gstin,
      planName: contract.planName,
      employeeHeadcount: contract.employeeHeadcount,
      ratePerEmployee: contract.ratePerEmployeeInr,
      totalSubtotalInr: subtotal,
      gstAmountInr: gst,
      totalGrandTotalInr: grandTotal,
      includedAddons: contract.addonsIncluded
    };

    generateAndDownloadCorporateInvoicePdf(invoicePayload);
    setNotice(`✓ GST Tax Invoice PDF generated and downloaded for "${contract.companyName}"!`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleGenerateQuoteAndDownloadInvoice = () => {
    const addonsList: string[] = [];
    if (includeMentalHealth) addonsList.push('24/7 Mental Health & Counseling');
    if (includeExecutiveLab) addonsList.push('Annual Executive Blood & Cardiac Panel');
    if (includePediatricShield) addonsList.push('Maternity & Pediatric Shield');

    const invoicePayload: CorporateInvoiceData = {
      invoiceNumber: `INV-B2B-PROFORMA-${Date.now().toString().slice(-5)}`,
      corporateName: clientName,
      corporateGstin: clientGstin,
      planName: `Enterprise Wellness Pass (${baseTier} Tier)`,
      employeeHeadcount: headcount,
      ratePerEmployee: finalRatePerEmployee,
      totalSubtotalInr: calculatedSubtotal,
      gstAmountInr: calculatedGst,
      totalGrandTotalInr: calculatedGrandTotal,
      includedAddons: addonsList
    };

    generateAndDownloadCorporateInvoicePdf(invoicePayload);
    setNotice(`✓ Pro-Forma GST Tax Invoice PDF generated and downloaded for "${clientName}"!`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleActivateNewContract = () => {
    const addonsList: string[] = [];
    if (includeMentalHealth) addonsList.push('24/7 Mental Health');
    if (includeExecutiveLab) addonsList.push('Executive Full Body Panel');
    if (includePediatricShield) addonsList.push('Pediatric Shield');

    const created: CorporateContract = {
      id: `CORP-${clientName.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-2)}`,
      companyName: clientName,
      logo: '🏢',
      gstin: clientGstin,
      corporateDomain: clientDomain,
      employeeHeadcount: headcount,
      planName: `Enterprise Wellness (${baseTier} Tier)`,
      ratePerEmployeeInr: finalRatePerEmployee,
      annualContractValueInr: calculatedSubtotal,
      contractStartDate: '01 Sep 2026',
      contractEndDate: '31 Aug 2027',
      status: 'ACTIVE_CONTRACT',
      addonsIncluded: addonsList
    };

    setContracts((prev) => [created, ...prev]);
    setNotice(`✓ Corporate Contract for "${clientName}" activated! Employee domain token access provisioned.`);
    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🏢</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              B2B Corporate Employee Wellness Bulk Customizer & Auto-Invoicing HQ
            </h2>
            <Badge variant="success">● 95,500 Active Corporate Lives</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Enterprise employee healthcare contracting for major IT & Corporate giants (TCS, Infosys, Wipro) with bulk headcount discounts and 1-click GST invoices.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleGenerateQuoteAndDownloadInvoice}
          style={{
            backgroundColor: '#10B981',
            color: '#070C16',
            fontWeight: 900,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}
        >
          📄 Generate & Download Pro-Forma Invoice PDF
        </Button>
      </div>

      {notice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {notice}
        </div>
      )}

      {/* Top 3 B2B Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            ANNUAL B2B CONTRACT VALUE (ACV)
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'monospace' }}>
            ₹ 4.15 Crore / yr
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            100% Guaranteed recurring corporate annual retainers
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            TOTAL COVERED EMPLOYEES
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>
            95,500 Lives
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Across TCS, Infosys, Wipro & Tech campuses
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            B2B SAAS GROSS MARGIN
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#FCD34D', margin: '4px 0', fontFamily: 'monospace' }}>
            82.4% Net Margin
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Low claim frequency with bulk corporate leverage
          </span>
        </div>
      </div>

      {/* Active Corporate Contracts Table */}
      <Card title="📜 Active Enterprise Corporate Client Contracts" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corporate Client</TableHead>
                <TableHead>Employee Headcount</TableHead>
                <TableHead>Rate / Employee</TableHead>
                <TableHead>Annual Contract Value (ACV)</TableHead>
                <TableHead>Contract Validity</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Invoice & Tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1.25rem' }}>{c.logo}</span>
                        <strong style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>{c.companyName}</strong>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                        Domain: <code style={{ color: '#38BDF8' }}>{c.corporateDomain}</code> • GSTIN: {c.gstin}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell style={{ fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                    {c.employeeHeadcount.toLocaleString('en-IN')} Employees
                  </TableCell>

                  <TableCell style={{ fontWeight: 800, color: '#FCD34D', fontFamily: 'monospace' }}>
                    ₹{c.ratePerEmployeeInr} / yr
                  </TableCell>

                  <TableCell style={{ fontWeight: 900, color: '#10B981', fontFamily: 'monospace', fontSize: '0.9375rem' }}>
                    ₹ {(c.annualContractValueInr / 100000).toFixed(2)} Lakhs
                  </TableCell>

                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                    {c.contractStartDate} — {c.contractEndDate}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(c)}
                      style={{
                        borderColor: '#10B981',
                        color: '#10B981',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        padding: '4px 8px'
                      }}
                    >
                      📄 GST Invoice PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Interactive Bulk Enterprise Pricing Calculator & Quote Generator */}
      <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #EAB308', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🧮</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                Interactive Bulk Corporate Pricing & Auto-Invoice Calculator
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Configure headcount, base wellness tiers, add-on clinical modules, and calculate custom enterprise rates
            </span>
          </div>

          <Badge variant="warning">{volumeDiscountPercent}% Bulk Volume Discount Applied</Badge>
        </div>

        {/* Input Form Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '4px' }}>PROSPECTIVE CORPORATE CLIENT</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '4px' }}>CORPORATE GSTIN</label>
            <input
              type="text"
              value={clientGstin}
              onChange={(e) => setClientGstin(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF', fontFamily: 'monospace' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '4px' }}>EMPLOYEE EMAIL DOMAIN</label>
            <input
              type="text"
              value={clientDomain}
              onChange={(e) => setClientDomain(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#38BDF8', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        {/* Headcount Slider & Base Tier */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', backgroundColor: '#1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 800 }}>👥 Employee Headcount:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
                {headcount.toLocaleString('en-IN')} Employees
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="100000"
              step="500"
              value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38BDF8', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94A3B8' }}>
              <span>500 (10% Off)</span>
              <span>10K (35% Off)</span>
              <span>50K+ (45% Off 🎯)</span>
            </div>
          </div>

          {/* Base Tier Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 800 }}>📦 Base Wellness Package Tier:</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {(['STANDARD', 'EXECUTIVE', 'VIP'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setBaseTier(tier)}
                  style={{
                    backgroundColor: baseTier === tier ? '#EAB308' : '#0F172A',
                    color: baseTier === tier ? '#000' : '#CBD5E1',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 4px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {tier} (₹{basePriceMap[tier]})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add-on Modules */}
        <div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            OPTIONAL CLINICAL ADD-ON MODULES:
          </span>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.8125rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F8FAFC', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeMentalHealth}
                onChange={(e) => setIncludeMentalHealth(e.target.checked)}
              />
              🧠 24/7 Mental Health & Therapy (+₹49/emp)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F8FAFC', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeExecutiveLab}
                onChange={(e) => setIncludeExecutiveLab(e.target.checked)}
              />
              🧪 Executive Full Body & Cardiac Blood Panel (+₹120/emp)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F8FAFC', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includePediatricShield}
                onChange={(e) => setIncludePediatricShield(e.target.checked)}
              />
              👶 Maternity & Pediatric Tele-Shield (+₹75/emp)
            </label>
          </div>
        </div>

        {/* Real-time Calculated Quote & Actions */}
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>
              CUSTOM ENTERPRISE RATE
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
              ₹ {finalRatePerEmployee} <span style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>/ employee / yr</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
              Subtotal: <strong>₹ {(calculatedSubtotal / 100000).toFixed(2)}L</strong> + 18% GST (SAC 999312): <strong>₹ {(calculatedGst / 100000).toFixed(2)}L</strong> = Total: <strong style={{ color: '#FCD34D' }}>₹ {(calculatedGrandTotal / 100000).toFixed(2)} Lakhs</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="md"
              onClick={handleGenerateQuoteAndDownloadInvoice}
              style={{
                borderColor: '#10B981',
                color: '#10B981',
                fontWeight: 800
              }}
            >
              📄 Download Pro-Forma Invoice PDF
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleActivateNewContract}
              style={{
                backgroundColor: '#EAB308',
                color: '#000',
                fontWeight: 900
              }}
            >
              🚀 Activate Corporate Contract
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
