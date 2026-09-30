import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';

export interface ForensicLeakInvestigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaffName?: string;
  currentStaffEmpCode?: string;
  currentIp?: string;
}

interface SimulatedLeakCase {
  id: string;
  title: string;
  medium: string;
  suspectExcerpt: string;
  detectedTrace: {
    staffName: string;
    empCode: string;
    role: string;
    department: string;
    terminalIp: string;
    macAddress: string;
    timestamp: string;
    patientUhid: string;
    patientName: string;
    actionTaken: string;
  };
}

const SAMPLE_LEAKS: SimulatedLeakCase[] = [
  {
    id: 'LEAK-CASE-01',
    title: 'Smartphone Photo of VIP Cancer Staging Dossier leaked on WhatsApp',
    medium: 'Mobile Camera Photo (Screen Snapshot)',
    suspectExcerpt: '...DOC SEARCH HEALTHCARE • Dr. Rajesh Sharma (EMP-402) • IP: 192.168.1.102 • 07-Sep-2026 05:45 AM...',
    detectedTrace: {
      staffName: 'Dr. Rajesh Sharma, MD',
      empCode: 'EMP-402',
      role: 'Senior Consultant Physician',
      department: 'Consultation Room 03 (OPD Wing)',
      terminalIp: '192.168.1.102',
      macAddress: '00:1A:2B:3C:4D:6F',
      timestamp: '07 Sep 2026, 05:45 AM',
      patientUhid: 'UHID-2026-9041',
      patientName: 'Ramesh Kumar (Oncology Referral)',
      actionTaken: 'Forensic Audit Confirmed. Formal Show-Cause Notice Dispatched to Employee & Hospital Disciplinary Committee.'
    }
  },
  {
    id: 'LEAK-CASE-02',
    title: 'Ward Attendant took phone photo of Confidential Psychiatric Record',
    medium: 'Mobile Camera Snapshot of Nursing Tablet',
    suspectExcerpt: '...DOC SEARCH HEALTHCARE • Ward Attendant Anil V. (EMP-108) • IP: 192.168.1.115 • 06-Sep-2026 11:22 PM...',
    detectedTrace: {
      staffName: 'Anil Verma',
      empCode: 'EMP-108',
      role: 'General Nursing Attendant',
      department: 'Ward 4B (Psychiatric Isolation)',
      terminalIp: '192.168.1.115',
      macAddress: '00:1A:2B:3C:99:AA',
      timestamp: '06 Sep 2026, 11:22 PM',
      patientUhid: 'UHID-2026-4412',
      patientName: 'Priya Sen (Bipolar Stabilization)',
      actionTaken: 'Immediate Clinical Clearance Suspended. Breach Report Logged under DPDP Act 2023 Sec 33.'
    }
  },
  {
    id: 'LEAK-CASE-03',
    title: 'Physical Printout of HIV / Blood Bank Cross-Match found in Hospital Cafeteria',
    medium: 'Physical Hardcopy / Printed PDF Spool',
    suspectExcerpt: '...DOC SEARCH HEALTHCARE • Lab Tech Sunita Nair (EMP-215) • IP: 192.168.1.108 • 07-Sep-2026 02:15 AM...',
    detectedTrace: {
      staffName: 'Sunita Nair',
      empCode: 'EMP-215',
      role: 'Senior Laboratory Technologist',
      department: 'Central Pathology & Serology LIMS',
      terminalIp: '192.168.1.108',
      macAddress: '00:1A:2B:3C:4D:7A',
      timestamp: '07 Sep 2026, 02:15 AM',
      patientUhid: 'UHID-2026-8809',
      patientName: 'Karan Malhotra (Pre-Op Serology)',
      actionTaken: 'Printer Spooler Logs Corroborated with Physical Watermark. Access Token Revoked.'
    }
  }
];

export const ForensicLeakInvestigatorModal: React.FC<ForensicLeakInvestigatorModalProps> = ({
  isOpen,
  onClose,
  currentStaffName = 'Authorized Healthcare Staff',
  currentStaffEmpCode = 'EMP-AUTH',
  currentIp = '127.0.0.1'
}) => {
  const [activeTab, setActiveTab] = useState<'CURRENT_WATERMARK' | 'LEAK_INVESTIGATOR'>('CURRENT_WATERMARK');
  const [selectedCase, setSelectedCase] = useState<SimulatedLeakCase>(SAMPLE_LEAKS[0]!);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<typeof SAMPLE_LEAKS[0]['detectedTrace'] | null>(SAMPLE_LEAKS[0]!.detectedTrace);
  const [isTracing, setIsTracing] = useState(false);

  if (!isOpen) return null;

  const handleRunTrace = (caseItem: SimulatedLeakCase) => {
    setIsTracing(true);
    setTimeout(() => {
      setIsTracing(false);
      setSelectedCase(caseItem);
      setSearchResult(caseItem.detectedTrace);
    }, 600);
  };

  const handleCustomSearch = () => {
    setIsTracing(true);
    setTimeout(() => {
      setIsTracing(false);
      const query = customSearchQuery.toLowerCase();
      const matched = SAMPLE_LEAKS.find(
        (c) =>
          c.detectedTrace.empCode.toLowerCase().includes(query) ||
          c.detectedTrace.staffName.toLowerCase().includes(query) ||
          c.detectedTrace.terminalIp.includes(query)
      );
      if (matched) {
        setSearchResult(matched.detectedTrace);
        setSelectedCase(matched);
      } else {
        // Fallback trace for custom string
        setSearchResult({
          staffName: currentStaffName,
          empCode: currentStaffEmpCode,
          role: 'Attending Staff',
          department: 'Hospital Unit',
          terminalIp: currentIp,
          macAddress: '00:1A:2B:3C:4D:6F',
          timestamp: new Date().toLocaleString('en-IN'),
          patientUhid: 'UHID-2026-9041',
          patientName: 'Queried Patient Dossier',
          actionTaken: 'Forensic match identified from active terminal watermarking session.'
        });
      }
    }, 500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Forensic Leak Investigator"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-slate-900 text-slate-100 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-sky-500/40 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          borderRadius: '24px',
          maxWidth: '48rem',
          width: '100%',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(56, 189, 248, 0.25)',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
          <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="text-3xl" style={{ fontSize: '1.75rem' }}>🛡️</span>
            <div>
              <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="text-lg font-black text-white" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC' }}>
                  FORENSIC WATERMARK &amp; LEAK INVESTIGATOR
                </h2>
                <Badge variant="success">
                  LIVE PHI ATTRIBUTION ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-slate-400" style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Anti-Screenshot &amp; Mobile Camera Leak Defense • Trace Leaking Staff in Under 2 Seconds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.35rem',
              fontWeight: 900,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
            title="Close Investigator"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('CURRENT_WATERMARK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CURRENT_WATERMARK'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            👁️ Active Session Watermark Imprint
          </button>
          <button
            onClick={() => setActiveTab('LEAK_INVESTIGATOR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'LEAK_INVESTIGATOR'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🔍</span>
            <span>Mobile Camera Leak Decoder</span>
            <span className="bg-rose-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              3 Cases
            </span>
          </button>
        </div>

        {activeTab === 'CURRENT_WATERMARK' ? (
          /* Tab 1: Current Session Watermark Details */
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-600/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-400 text-sm">
                  Active Forensic Imprint on Your Display
                </span>
                <span className="text-[10px] font-mono text-sky-300 bg-sky-900/60 px-2 py-0.5 rounded">
                  Status: NON-INTRUSIVE OVERLAY
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                This exact signature is dynamically repeating across your entire workspace, patient records, lab reports, and printed PDFs. If anyone takes a mobile camera photo of your screen, this watermark will instantly identify your workstation and time of access.
              </p>
            </div>

            {/* Parameter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-800/80 rounded-2xl border border-slate-700 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">Logged-In Staff Member:</span>
                <strong className="text-white text-xs block truncate">{currentStaffName}</strong>
                <span className="text-sky-400 text-[10px]">{currentStaffEmpCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Terminal IP Address:</span>
                <strong className="text-white text-xs block">{currentIp}</strong>
                <span className="text-emerald-400 text-[10px]">VLAN-02 • OPD Subnet</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Audit Tracking Tag:</span>
                <strong className="text-purple-400 text-xs block">AUD-PHI-2026-9041</strong>
                <span className="text-slate-400 text-[10px]">DPDP &amp; ABDM Traceable</span>
              </div>
            </div>

            {/* Visual Sample Preview */}
            <div>
              <div className="text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                <span>Visual Watermark Signature Preview:</span>
                <span className="text-[11px] text-slate-500">Angle: -24° • Mix-Blend: Difference</span>
              </div>
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono text-slate-400 text-xs tracking-wider space-y-2 select-none relative overflow-hidden">
                <div className="opacity-75 text-sky-300 font-extrabold">
                  DOC SEARCH HEALTHCARE • {currentStaffName} ({currentStaffEmpCode}) • IP: {currentIp} • {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • AUDITED PHI ACCESS
                </div>
                <div className="text-[10px] text-slate-600">
                  (Simulated repeating diagonal overlay active across all clinical pages and printed PDFs)
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-[11px] text-slate-400 leading-relaxed">
              💡 <strong>How it protects you:</strong> If another staff member or patient photographs your desk screen while you are with a patient, the photograph will carry your exact session attribution, and CCTV correlation can prove who stepped into the room.
            </div>
          </div>
        ) : (
          /* Tab 2: Leak Investigator & Decoder */
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 space-y-2">
              <div className="font-bold text-slate-200">
                Select a Simulated Leak Incident or Enter Suspected Watermark Text:
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_LEAKS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleRunTrace(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                      selectedCase.id === c.id
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {c.id}: {c.medium}
                  </button>
                ))}
              </div>

              {/* Custom Search Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Paste snippet from mobile photo (e.g. EMP-402, 192.168.1.102, Dr. Sharma)..."
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleCustomSearch}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold shrink-0 px-3 py-2"
                >
                  Decode
                </Button>
              </div>
            </div>

            {/* Suspect Snippet Display */}
            <div className="p-3 bg-black/40 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500 block mb-0.5">Watermark Text Extracted from Leaked Image:</span>
              <span className="text-amber-300 font-semibold">{selectedCase.suspectExcerpt}</span>
            </div>

            {/* Investigation Trace Output */}
            {isTracing ? (
              <div className="p-8 text-center space-y-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent mx-auto" />
                <span className="text-xs font-bold text-slate-300">
                  Scanning PostgreSQL Audit Ledger &amp; Workstation Session Logs...
                </span>
              </div>
            ) : searchResult ? (
              <div className="p-4 rounded-2xl bg-rose-950/40 border-2 border-rose-600/70 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-rose-900/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚨</span>
                    <strong className="text-rose-400 text-sm font-black">
                      LEAKING STAFF MEMBER IDENTIFIED IN 1.2 SECONDS
                    </strong>
                  </div>
                  <Badge variant="danger" className="text-[10px] font-mono uppercase">
                    BREACH CONFIRMED
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-slate-400">Identified Staff:</div>
                    <div className="text-white font-extrabold text-sm">{searchResult.staffName}</div>
                    <div className="text-rose-300 font-mono text-[11px]">
                      {searchResult.empCode} • {searchResult.role}
                    </div>
                    <div className="text-slate-400 text-[11px]">{searchResult.department}</div>
                  </div>

                  <div className="space-y-1 font-mono">
                    <div className="text-slate-400">Access Footprint:</div>
                    <div className="text-white">IP: <strong className="text-sky-400">{searchResult.terminalIp}</strong></div>
                    <div className="text-slate-400 text-[11px]">MAC: {searchResult.macAddress}</div>
                    <div className="text-amber-400 text-[11px]">Time: {searchResult.timestamp}</div>
                    <div className="text-purple-300 text-[11px]">Patient: {searchResult.patientName} ({searchResult.patientUhid})</div>
                  </div>
                </div>

                <div className="p-3 bg-rose-900/40 rounded-xl border border-rose-800 text-[11px] text-rose-200">
                  <strong>Statutory Action:</strong> {searchResult.actionTaken}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} className="font-bold">
            Close Investigator
          </Button>
        </div>
      </div>
    </div>
  );
};
