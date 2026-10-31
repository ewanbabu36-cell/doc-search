import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

export type DepartmentKey = 'ALL' | 'HEMATOLOGY' | 'BIOCHEMISTRY' | 'MICROBIOLOGY' | 'HISTOPATHOLOGY';
export type WorklistFilterKey = 'CRITICAL_FIRST' | 'ABNORMAL' | 'BIOPSY' | 'ROUTINE' | 'ALL';

export interface SpecimenParameter {
  name: string;
  value: string;
  unit: string;
  refRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL' | 'BIOPSY';
  machineFlag: string;
  serumIndices: string;
}

export interface DeltaVisit {
  visitLabel: string;
  date: string;
  value: number;
  displayValue: string;
  deltaPercent?: string;
}

export interface SpecimenAuditStep {
  time: string;
  action: string;
  actor: string;
  details: string;
}

export interface RichSpecimenRecord {
  id: string;
  orderNumber: string;
  accessionNumber: string;
  barcode: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientAge: string;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  department: 'HEMATOLOGY' | 'BIOCHEMISTRY' | 'MICROBIOLOGY' | 'HISTOPATHOLOGY';
  filterCategory: 'CRITICAL' | 'ABNORMAL' | 'BIOPSY' | 'ROUTINE';
  priority: 'STAT' | 'ROUTINE';
  isCritical: boolean;
  status: 'RESULT_READY' | 'PROCESSING' | 'SAMPLE_COLLECTED' | 'VERIFIED' | 'CANCELLED';
  statusLabel: string;
  orderingDoctorName: string;
  wardOrLocation: string;
  specimenType: string;
  tubeType: string;
  collectionTime: string;
  intakeTime: string;
  analyzerMachine: string;
  clinicalHistory: string;
  parameters: SpecimenParameter[];
  deltaCheck: {
    biomarker: string;
    unit: string;
    alertMessage: string;
    isViolation: boolean;
    visits: DeltaVisit[];
  };
  auditHistory: SpecimenAuditStep[];
  pathologistImpression: string;
  reflexOptions: string[];
}

export const TARGET_SPECIMENS: RichSpecimenRecord[] = [];

export interface PathologistTargetCockpitViewProps {
  specimens?: RichSpecimenRecord[];
  facilityName?: string;
  staffName?: string;
  qcApproved: boolean;
  onToggleQcApproved: () => void;
  onOpenQcModal: () => void;
  onOpenRejectModal: (order?: any) => void;
  onOpenPanicModal: (order?: any) => void;
  onOpenBatchDscModal: () => void;
  onOpenWsiModal: () => void;
  onOpenDeltaModal: (order?: any) => void;
  onNavigateModule: (moduleKey: any, subTab?: string) => void;
  triggerToast: (msg: string) => void;
  activeRolePerspective: 'PATHOLOGIST' | 'TECHNICIAN' | 'PHLEBOTOMIST';
  onChangeRolePerspective: (role: 'PATHOLOGIST' | 'TECHNICIAN' | 'PHLEBOTOMIST') => void;
}


const EMPTY_SPECIMEN: RichSpecimenRecord = {
  id: '',
  orderNumber: '',
  accessionNumber: 'NO SPECIMEN SELECTED',
  barcode: '',
  patientId: '',
  patientName: 'No Specimen Selected',
  patientMrn: '',
  patientAge: '',
  patientGender: 'OTHER',
  department: 'BIOCHEMISTRY',
  filterCategory: 'ROUTINE',
  priority: 'ROUTINE',
  isCritical: false,
  status: 'SAMPLE_COLLECTED',
  statusLabel: 'NO ACTIVE SPECIMENS',
  orderingDoctorName: '',
  wardOrLocation: '',
  specimenType: '',
  tubeType: '',
  collectionTime: '',
  intakeTime: '',
  analyzerMachine: '',
  clinicalHistory: '',
  parameters: [],
  deltaCheck: { biomarker: '', unit: '', alertMessage: '', isViolation: false, visits: [] },
  auditHistory: [],
  pathologistImpression: '',
  reflexOptions: []
};

export const PathologistTargetCockpitView: React.FC<PathologistTargetCockpitViewProps> = ({
  specimens,
  facilityName = 'Apex PathLabs & Molecular Diagnostics',
  staffName = 'Dr. Shahab (MD Pathologist, Lab Director)',
  qcApproved,
  onOpenQcModal,
  onOpenRejectModal,
  onOpenPanicModal,
  onOpenBatchDscModal,
  onOpenDeltaModal,
  onOpenWsiModal,
  triggerToast,
  activeRolePerspective,
  onChangeRolePerspective
}) => {
  // Navigation & Filtering State
  const [selectedDept, setSelectedDept] = useState<DepartmentKey>('ALL');
  const [worklistFilter, setWorklistFilter] = useState<WorklistFilterKey>('CRITICAL_FIRST');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>('');

  // Dynamic Specimens State from props or live Database API
  const [liveSpecimens, setLiveSpecimens] = useState<RichSpecimenRecord[]>(specimens || []);

  React.useEffect(() => {
    if (specimens && specimens.length > 0) {
      setLiveSpecimens(specimens);
    } else {
      fetch('/api/v1/laboratory/specimens/cockpit')
        .then((r) => r.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setLiveSpecimens(res.data);
            setSelectedSpecimenId(res.data[0].id);
          }
        })
        .catch((err) => console.warn('Failed to load cockpit specimens:', err));
    }
  }, [specimens]);


  // Modals for Bottom Action Bar
  const [isReflexModalOpen, setIsReflexModalOpen] = useState(false);
  const [selectedReflexTest, setSelectedReflexTest] = useState('');
  const [reflexJustification, setReflexJustification] = useState('');

  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [repeatProtocol, setRepeatProtocol] = useState<'1_TO_2_DILUTION' | '1_TO_10_DILUTION' | 'PLAIN_REPEAT' | 'REDRAW_REQUEST'>('1_TO_2_DILUTION');
  const [repeatNotes, setRepeatNotes] = useState('');

  // Pathologist Editable Impression Notes
  const [impressionNotes, setImpressionNotes] = useState<Record<string, string>>({});

  // Filtered Specimen Worklist
  const filteredWorklist = useMemo(() => {
    return liveSpecimens.filter((specimen) => {
      // Department Filter
      if (selectedDept !== 'ALL' && specimen.department !== selectedDept) {
        return false;
      }

      // Worklist Priority Filter
      if (worklistFilter === 'CRITICAL_FIRST' && !specimen.isCritical && specimen.filterCategory !== 'CRITICAL') {
        // In Critical First view, show criticals, or if none, fallback
      } else if (worklistFilter === 'ABNORMAL' && specimen.filterCategory !== 'ABNORMAL' && !specimen.isCritical) {
        return false;
      } else if (worklistFilter === 'BIOPSY' && specimen.filterCategory !== 'BIOPSY') {
        return false;
      } else if (worklistFilter === 'ROUTINE' && specimen.filterCategory !== 'ROUTINE') {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          specimen.accessionNumber.toLowerCase().includes(q) ||
          specimen.patientName.toLowerCase().includes(q) ||
          specimen.patientMrn.toLowerCase().includes(q) ||
          specimen.barcode.toLowerCase().includes(q) ||
          specimen.specimenType.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      // Always bubble Critical to the top
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return 0;
    });
  }, [selectedDept, worklistFilter, searchQuery]);

  // Active Selected Specimen
  const activeSpecimen: RichSpecimenRecord = useMemo(() => {
    const found = liveSpecimens.find((s) => s.id === selectedSpecimenId);
    if (found) return found;
    if (filteredWorklist[0]) return filteredWorklist[0];
    return liveSpecimens[0] || EMPTY_SPECIMEN;
  }, [selectedSpecimenId, filteredWorklist]);

  // Current Impression for Active Specimen
  const currentImpression = impressionNotes[activeSpecimen.id] !== undefined
    ? impressionNotes[activeSpecimen.id]
    : activeSpecimen.pathologistImpression;

  // Department counts
  const deptCounts = useMemo(() => {
    return {
      ALL: liveSpecimens.length,
      HEMATOLOGY: liveSpecimens.filter((s) => s.department === 'HEMATOLOGY').length,
      BIOCHEMISTRY: liveSpecimens.filter((s) => s.department === 'BIOCHEMISTRY').length,
      MICROBIOLOGY: liveSpecimens.filter((s) => s.department === 'MICROBIOLOGY').length,
      HISTOPATHOLOGY: liveSpecimens.filter((s) => s.department === 'HISTOPATHOLOGY').length
    };
  }, [liveSpecimens]);

  // Handlers for Bottom Action Bar
  const handleConfirmReflex = () => {
    if (!selectedReflexTest) {
      triggerToast('⚠️ Please choose a reflex test from the accredited catalog.');
      return;
    }
    triggerToast(`🧪 Reflex Test Ordered: "${selectedReflexTest}" added to accession ${activeSpecimen.accessionNumber}. Transmitted to analyzer rack.`);
    setIsReflexModalOpen(false);
    setSelectedReflexTest('');
    setReflexJustification('');
  };

  const handleConfirmRepeat = () => {
    const protocolLabel =
      repeatProtocol === '1_TO_2_DILUTION' ? '1:2 Automated Dilution' :
      repeatProtocol === '1_TO_10_DILUTION' ? '1:10 Linearity Dilution' :
      repeatProtocol === 'PLAIN_REPEAT' ? 'Plain Duplicate Run' : 'Phlebotomy Redraw Request';
    triggerToast(`🔁 ASTM Directive Sent: ${protocolLabel} queued on ${activeSpecimen.analyzerMachine}.`);
    setIsRepeatModalOpen(false);
    setRepeatNotes('');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        color: '#F8FAFC',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* =========================================================================
          TOP BAR: Lab Name | Department Filter | Analyzer Status | Pathologist Profile & DSC
          ========================================================================= */}
      <header
        className="ds-glass-panel"
        style={{
          borderRadius: '16px',
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.92) 100%)',
          border: '1.5px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        {/* Left: Lab Name & NABL Accreditation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
            }}
          >
            🔬
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                {facilityName}
              </span>
              <Badge variant="primary" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', borderColor: '#10B981', fontSize: '0.68rem', fontWeight: 700 }}>
                NABL ISO-15189
              </Badge>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
              Accredited Clinical Pathology &amp; Molecular Diagnostics Laboratory • Station #01
            </div>
          </div>
        </div>

        {/* Center: Department Filter Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {(
            [
              { key: 'ALL', label: 'All Depts', icon: '🌐' },
              { key: 'HEMATOLOGY', label: 'Hematology', icon: '🩸' },
              { key: 'BIOCHEMISTRY', label: 'Biochemistry', icon: '🧪' },
              { key: 'MICROBIOLOGY', label: 'Microbiology', icon: '🧫' },
              { key: 'HISTOPATHOLOGY', label: 'Histopath', icon: '🔬' }
            ] as const
          ).map((dept) => {
            const isSelected = selectedDept === dept.key;
            return (
              <button
                key={dept.key}
                type="button"
                onClick={() => {
                  setSelectedDept(dept.key);
                  triggerToast(`Filtered by ${dept.label} Department`);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: isSelected ? '1px solid #A855F7' : '1px solid transparent',
                  backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.28)' : 'transparent',
                  color: isSelected ? '#F8FAFC' : '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{dept.icon}</span>
                <span>{dept.label}</span>
                <span
                  style={{
                    backgroundColor: isSelected ? '#A855F7' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#FFF' : '#94A3B8',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    fontSize: '0.65rem',
                    fontWeight: 800
                  }}
                >
                  {deptCounts[dept.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Analyzer Status (ASTM) + Pathologist Profile & DSC Token */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Analyzer Status (ASTM Connected) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            <div style={{ fontSize: '0.72rem', color: '#6EE7B7', fontWeight: 800 }}>
              ASTM/HL7 CONNECTED
            </div>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>(3/3 Online)</span>
          </div>

          {/* Pathologist Profile & DSC Token Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 10px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(168, 85, 247, 0.25)',
                border: '1px solid #A855F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}
            >
              👨‍⚕️
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC' }}>
                {staffName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                <span style={{ fontSize: '0.68rem', color: '#C084FC', fontWeight: 700 }}>
                  🔑 DSC Token: ACTIVE
                </span>
                <span style={{ fontSize: '0.62rem', color: '#64748B' }}>• Class-3 USB PKI</span>
              </div>
            </div>
          </div>

          {/* Role Switcher Pill for Testing Cross-Role Navigation */}
          <div style={{ display: 'flex', gap: '2px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => onChangeRolePerspective('PATHOLOGIST')}
              title="Pathologist Cockpit View"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeRolePerspective === 'PATHOLOGIST' ? '#7C3AED' : 'transparent',
                color: '#FFF',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🔬 Cockpit
            </button>
            <button
              type="button"
              onClick={() => onChangeRolePerspective('TECHNICIAN')}
              title="Switch to Technician Workbench"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeRolePerspective === 'TECHNICIAN' ? '#0284C7' : 'transparent',
                color: '#94A3B8',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⚙️ Tech
            </button>
            <button
              type="button"
              onClick={() => onChangeRolePerspective('PHLEBOTOMIST')}
              title="Switch to Phlebotomy Desk"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeRolePerspective === 'PHLEBOTOMIST' ? '#D97706' : 'transparent',
                color: '#94A3B8',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🩸 Phleb
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          ROW 1 (Governance & Quality Status):
          Daily QC Status | Sample Rejection Rate | Critical Panic Calls Pending | Pending Pathologist Approval
          ========================================================================= */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '12px'
        }}
      >
        {/* 1. Daily QC Status (All instruments calibrated) */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{
            cursor: 'pointer',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)',
            transition: 'all 0.15s ease'
          }}
          onClick={onOpenQcModal}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#7DD3FC', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Daily QC Status
            </span>
            <span style={{ fontSize: '1.2rem' }}>📊</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: qcApproved ? '#34D399' : '#F59E0B', margin: '6px 0 2px' }}>
            {qcApproved ? 'PASS (±1.2 SD)' : 'QC PENDING'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>
            All instruments calibrated • Westgard 1-2s Clear
          </div>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Sysmex XN, Cobas 6000 Racks</span>
            <span style={{ fontSize: '0.68rem', color: '#38BDF8', fontWeight: 700 }}>Inspect QC ➔</span>
          </div>
        </Card>

        {/* 2. Sample Rejection Rate (< 1%) */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{
            cursor: 'pointer',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => onOpenRejectModal(activeSpecimen)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sample Rejection Rate
            </span>
            <span style={{ fontSize: '1.2rem' }}>🚫</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#F59E0B', margin: '6px 0 2px' }}>
            0.42% <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34D399' }}>(Target &lt; 1%)</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>
            Pre-analytic tube integrity: 3 rejected / 718 total
          </div>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Microclot &amp; Hemolysis log</span>
            <span style={{ fontSize: '0.68rem', color: '#FBBF24', fontWeight: 700 }}>View Rejections ➔</span>
          </div>
        </Card>

        {/* 3. Critical Panic Calls Pending (Urgent physician intimation) */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{
            cursor: 'pointer',
            border: '1.5px solid rgba(239, 68, 68, 0.45)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
            boxShadow: '0 4px 18px rgba(239, 68, 68, 0.2)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => onOpenPanicModal(activeSpecimen)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Critical Panic Calls Pending
            </span>
            <span style={{ fontSize: '1.2rem' }}>🚨</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#EF4444', margin: '6px 0 2px' }}>
            2 Urgent Intimations
          </div>
          <div style={{ fontSize: '0.72rem', color: '#FCA5A5', fontWeight: 600 }}>
            Mandatory read-back logged per NABL 5.8.2
          </div>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#CBD5E1' }}>Potassium &amp; Platelet Criticals</span>
            <span style={{ fontSize: '0.68rem', color: '#F87171', fontWeight: 800 }}>Open Call Desk ➔</span>
          </div>
        </Card>

        {/* 4. Pending Pathologist Approval (Waiting for MD sign-off) */}
        <Card
          padding="md"
          className="ds-glass-panel ds-interactive"
          style={{
            cursor: 'pointer',
            border: '1.5px solid rgba(168, 85, 247, 0.45)',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
            transition: 'all 0.15s ease'
          }}
          onClick={onOpenBatchDscModal}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#D8B4FE', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Pathologist Approval
            </span>
            <span style={{ fontSize: '1.2rem' }}>✍️</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#A855F7', margin: '6px 0 2px' }}>
            8 Reports Waiting
          </div>
          <div style={{ fontSize: '0.72rem', color: '#C4B5FD', fontWeight: 600 }}>
            Waiting for MD sign-off • DSC Token Ready
          </div>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Biochemistry, Heme, Biopsy</span>
            <span style={{ fontSize: '0.68rem', color: '#C084FC', fontWeight: 800 }}>Batch Sign-Off ➔</span>
          </div>
        </Card>
      </section>

      {/* =========================================================================
          ROW 2 (Main Operating Workspace):
          Left: Specimen Worklist | Center: Result Review Panel | Right: Delta Check & Audit History
          ========================================================================= */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1.15fr) minmax(440px, 1.95fr) minmax(320px, 1.35fr)',
          gap: '16px',
          alignItems: 'start'
        }}
      >
        {/* =====================================================================
            LEFT COLUMN: Specimen Worklist
            Filter by: Critical First, Abnormal, Biopsy, Routine
            ===================================================================== */}
        <section
          className="ds-glass-panel"
          style={{
            borderRadius: '16px',
            backgroundColor: 'rgba(18, 24, 38, 0.85)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: '740px'
          }}
        >
          {/* Worklist Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Specimen Worklist
                </span>
                <Badge variant="neutral" style={{ fontSize: '0.65rem' }}>
                  {filteredWorklist.length} Specimens
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenWsiModal}
                style={{ fontSize: '0.68rem', padding: '3px 8px', borderColor: '#A855F7', color: '#D8B4FE' }}
                title="Whole Slide Imaging & Peripheral Blood Smear Examination"
              >
                🔬 WSI Viewer
              </Button>
            </div>

            {/* Filter Pills: Critical First, Abnormal, Biopsy, Routine */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '10px', flexWrap: 'wrap' }}>
              {(
                [
                  { key: 'CRITICAL_FIRST', label: 'Critical First', icon: '🚨' },
                  { key: 'ABNORMAL', label: 'Abnormal', icon: '⚠️' },
                  { key: 'BIOPSY', label: 'Biopsy', icon: '🔬' },
                  { key: 'ROUTINE', label: 'Routine', icon: '📋' },
                  { key: 'ALL', label: 'All', icon: '🌐' }
                ] as const
              ).map((f) => {
                const isActive = worklistFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setWorklistFilter(f.key)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: isActive ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: isActive ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? '#F8FAFC' : '#94A3B8',
                      fontSize: '0.68rem',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <span>{f.icon} </span>
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{ marginTop: '10px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '0.75rem', color: '#64748B' }}>
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search barcode, accession, patient..."
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 28px',
                  borderRadius: '7px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Specimen Items List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredWorklist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B', fontSize: '0.78rem' }}>
                No specimens found matching the selected filter.
              </div>
            ) : (
              filteredWorklist.map((specimen) => {
                const isSelected = activeSpecimen.id === specimen.id;
                const isCrit = specimen.isCritical;
                const isBio = specimen.filterCategory === 'BIOPSY';
                const isAbn = specimen.filterCategory === 'ABNORMAL';

                return (
                  <div
                    key={specimen.id}
                    onClick={() => {
                      setSelectedSpecimenId(specimen.id);
                      triggerToast(`Selected: ${specimen.patientName} (${specimen.accessionNumber})`);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: isSelected
                        ? '1.5px solid #A855F7'
                        : isCrit
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      backgroundColor: isSelected
                        ? 'rgba(168, 85, 247, 0.22)'
                        : isCrit
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      boxShadow: isSelected ? '0 4px 16px rgba(168, 85, 247, 0.3)' : undefined,
                      transition: 'all 0.12s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Accession & Urgency Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8', fontSize: '0.76rem' }}>
                        {specimen.accessionNumber}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {specimen.priority === 'STAT' && (
                          <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.6rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                            STAT
                          </span>
                        )}
                        <Badge
                          variant={isCrit ? 'critical' : isBio ? 'primary' : isAbn ? 'warning' : 'neutral'}
                          style={{ fontSize: '0.62rem' }}
                        >
                          {specimen.department}
                        </Badge>
                      </div>
                    </div>

                    {/* Middle Row: Patient Name & Age/Gender */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                      <strong style={{ fontSize: '0.82rem', color: '#F8FAFC' }}>
                        {specimen.patientName}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {specimen.patientAge} • {specimen.patientGender === 'MALE' ? 'M' : 'F'}
                      </span>
                    </div>

                    {/* Subtitle: Test Parameter / Summary Value */}
                    <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {specimen.parameters[0]?.name}: <strong style={{ color: isCrit ? '#EF4444' : isAbn ? '#F59E0B' : '#34D399' }}>{specimen.parameters[0]?.value} {specimen.parameters[0]?.unit}</strong>
                    </div>

                    {/* Bottom Status Ribbon */}
                    <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                      <span style={{ color: isCrit ? '#FCA5A5' : '#94A3B8' }}>
                        {specimen.statusLabel}
                      </span>
                      <span style={{ color: '#64748B' }}>
                        {specimen.collectionTime}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* =====================================================================
            CENTER COLUMN: Result Review Panel
            Patient history + current test values + machine flags + reference range flags
            ===================================================================== */}
        <section
          className="ds-glass-panel"
          style={{
            borderRadius: '16px',
            backgroundColor: 'rgba(18, 24, 38, 0.85)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: '740px'
          }}
        >
          {/* Patient Demographic & Order Header Banner */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {activeSpecimen.patientName}
                  </h2>
                  <Badge variant="primary" style={{ fontSize: '0.68rem' }}>
                    {activeSpecimen.patientMrn}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    ({activeSpecimen.patientAge} • {activeSpecimen.patientGender})
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#CBD5E1', marginTop: '3px' }}>
                  Referring Doctor: <strong style={{ color: '#E2E8F0' }}>{activeSpecimen.orderingDoctorName}</strong> • {activeSpecimen.wardOrLocation}
                </div>
              </div>

              {/* Barcode & Specimen Info */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8', fontSize: '0.8rem' }}>
                  {activeSpecimen.barcode}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                  {activeSpecimen.specimenType} • {activeSpecimen.tubeType}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '1px' }}>
                  Analyzer: {activeSpecimen.analyzerMachine}
                </div>
              </div>
            </div>
          </div>

          {/* Clinical History & Indications Box */}
          <div
            style={{
              padding: '10px 18px',
              backgroundColor: 'rgba(56, 189, 248, 0.06)',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
              fontSize: '0.75rem',
              color: '#CBD5E1',
              lineHeight: '1.45'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8', fontWeight: 700, marginBottom: '2px' }}>
              <span>🩺</span>
              <span>PATIENT CLINICAL HISTORY &amp; TEST INDICATION:</span>
            </div>
            {activeSpecimen.clinicalHistory}
          </div>

          {/* Current Test Values Table with Machine Flags & Ref Ranges */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '12px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Observed Test Values &amp; Raw Machine Flags
              </span>
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                ASTM Protocol Query v4.2
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid rgba(255, 255, 255, 0.12)' }}>
                  <th style={{ padding: '8px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>TEST PARAMETER</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>OBSERVED RESULT</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>REFERENCE RANGE</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>ANALYZER FLAGS &amp; INDICES</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800, textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {activeSpecimen.parameters.map((param, idx) => {
                  const isParamCrit = param.flag === 'CRITICAL';
                  const isParamHigh = param.flag === 'HIGH';
                  const isParamLow = param.flag === 'LOW';
                  const isParamAbn = param.flag === 'ABNORMAL';

                  const resultColor =
                    isParamCrit ? '#EF4444' : isParamHigh || isParamLow ? '#F59E0B' : isParamAbn ? '#C084FC' : '#34D399';

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: isParamCrit ? 'rgba(239, 68, 68, 0.08)' : undefined
                      }}
                    >
                      {/* Parameter Name */}
                      <td style={{ padding: '10px', fontSize: '0.76rem', color: '#F8FAFC', fontWeight: 700 }}>
                        {param.name}
                      </td>

                      {/* Observed Result with Unit */}
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 900, color: resultColor }}>
                          {param.value}
                        </span>
                        {param.unit && (
                          <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginLeft: '4px' }}>
                            {param.unit}
                          </span>
                        )}
                      </td>

                      {/* Reference Interval */}
                      <td style={{ padding: '10px', fontSize: '0.72rem', color: '#CBD5E1' }}>
                        {param.refRange}
                      </td>

                      {/* Machine Flags & Serum Indices */}
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 700 }}>
                          {param.machineFlag}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                          {param.serumIndices}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <Badge
                          variant={
                            isParamCrit ? 'critical' : isParamHigh || isParamLow ? 'warning' : isParamAbn ? 'primary' : 'success'
                          }
                          style={{ fontSize: '0.65rem' }}
                        >
                          {param.flag}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pathologist Clinical Impression & Interpretive Comments */}
            <div
              style={{
                marginTop: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C084FC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✍️</span>
                  <span>PATHOLOGIST CLINICAL IMPRESSION &amp; INTERPRETIVE NOTES:</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                  Will be cryptographically embedded with Class-3 DSC
                </span>
              </div>
              <textarea
                value={currentImpression}
                onChange={(e) => {
                  setImpressionNotes((prev) => ({
                    ...prev,
                    [activeSpecimen.id]: e.target.value
                  }));
                }}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  lineHeight: '1.4',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </section>

        {/* =====================================================================
            RIGHT COLUMN: Delta Check & Audit History
            Pichle 3 visits ki test values ka comparison graph + Chain of custody
            ===================================================================== */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '740px',
            overflowY: 'auto'
          }}
        >
          {/* DELTA CHECK COMPARISON GRAPH (Pichle 3 visits ki test values ka comparison graph) */}
          <div
            className="ds-glass-panel"
            style={{
              borderRadius: '16px',
              backgroundColor: 'rgba(18, 24, 38, 0.85)',
              border: activeSpecimen.deltaCheck.isViolation
                ? '1.5px solid rgba(239, 68, 68, 0.45)'
                : '1.5px solid rgba(56, 189, 248, 0.35)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>📈</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Delta Check Comparison
                </span>
              </div>
              <Badge
                variant={activeSpecimen.deltaCheck.isViolation ? 'critical' : 'success'}
                style={{ fontSize: '0.62rem' }}
              >
                {activeSpecimen.deltaCheck.isViolation ? 'VIOLATION DETECTED' : 'DELTA CLEAR'}
              </Badge>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Biomarker: <strong style={{ color: '#38BDF8' }}>{activeSpecimen.deltaCheck.biomarker}</strong> across last 3 patient visits:
            </div>

            {/* Visual Trend Bars (Pichle 3 visits ki test values) */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '10px',
                padding: '12px 14px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {activeSpecimen.deltaCheck.visits.map((visit, i) => {
                  const isCurrent = i === activeSpecimen.deltaCheck.visits.length - 1;
                  return (
                    <div
                      key={i}
                      style={{
                        backgroundColor: isCurrent
                          ? activeSpecimen.deltaCheck.isViolation
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(56, 189, 248, 0.2)'
                          : 'rgba(255, 255, 255, 0.04)',
                        border: isCurrent
                          ? activeSpecimen.deltaCheck.isViolation
                            ? '1px solid #EF4444'
                            : '1px solid #38BDF8'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{visit.visitLabel}</div>
                      <div style={{ fontSize: '0.62rem', color: '#64748B', marginBottom: '4px' }}>{visit.date}</div>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 900,
                          color: isCurrent
                            ? activeSpecimen.deltaCheck.isViolation
                              ? '#EF4444'
                              : '#38BDF8'
                            : '#F8FAFC'
                        }}
                      >
                        {visit.displayValue}
                      </div>
                      {visit.deltaPercent && (
                        <div
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            color: activeSpecimen.deltaCheck.isViolation ? '#FCA5A5' : '#34D399',
                            marginTop: '2px'
                          }}
                        >
                          {visit.deltaPercent}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Graphical Delta Shift Bar */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', marginBottom: '3px' }}>
                  <span>Baseline</span>
                  <span>Shift Variance</span>
                  <span style={{ color: activeSpecimen.deltaCheck.isViolation ? '#EF4444' : '#34D399' }}>
                    Current Run
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      height: '100%',
                      width: activeSpecimen.deltaCheck.isViolation ? '85%' : '45%',
                      backgroundColor: activeSpecimen.deltaCheck.isViolation ? '#EF4444' : '#34D399',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              {/* Multi-Visit Slope Velocity & Telemetry Badges */}
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.65rem' }}>
                <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  📈 Slope Velocity: {activeSpecimen.deltaCheck.isViolation ? '+1.14 unit / week (Acute Surge)' : '+0.04 unit / week (Stable)'}
                </span>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  ⚡ Analyzer Rerun: Matched (Hemolysis / Pseudovariance Ruled Out)
                </span>
                {activeSpecimen.deltaCheck.isViolation && (
                  <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    ⚠️ Risk: KDIGO AKI / Arrhythmia Dynamic Threshold Breached
                  </span>
                )}
              </div>
            </div>

            {/* Delta Check Rule Explanation & Warning */}
            <div
              style={{
                backgroundColor: activeSpecimen.deltaCheck.isViolation
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(16, 185, 129, 0.08)',
                border: activeSpecimen.deltaCheck.isViolation
                  ? '1px solid rgba(239, 68, 68, 0.25)'
                  : '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '0.72rem',
                color: '#CBD5E1',
                lineHeight: '1.4'
              }}
            >
              {activeSpecimen.deltaCheck.alertMessage}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDeltaModal(activeSpecimen)}
              style={{
                fontSize: '0.72rem',
                borderColor: '#A855F7',
                color: '#D8B4FE',
                alignSelf: 'flex-start'
              }}
            >
              📈 Inspect Full Delta Log ➔
            </Button>
          </div>

          {/* AUDIT HISTORY & SPECIMEN CHAIN OF CUSTODY */}
          <div
            className="ds-glass-panel"
            style={{
              borderRadius: '16px',
              backgroundColor: 'rgba(18, 24, 38, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.08)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F8FAFC' }}>
                Chain of Custody &amp; Verification Log
              </span>
              <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 700 }}>● ISO-15189 Audit Trail</span>
            </div>

            {/* Stepper Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeSpecimen.auditHistory.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: idx === activeSpecimen.auditHistory.length - 1 ? '#A855F7' : '#10B981',
                      color: '#FFF',
                      fontSize: '0.62rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      marginTop: '2px',
                      flexShrink: 0
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '6px 8px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.72rem', color: '#F8FAFC' }}>{step.action}</strong>
                      <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{step.time}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#CBD5E1', marginTop: '2px' }}>
                      {step.details}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#64748B', marginTop: '1px' }}>
                      Actor: {step.actor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          BOTTOM ACTION BAR (Sticky Bar):
          [Reflex Test Order] | [Request Repeat/Dilution] | [Log Panic Call] | [Digitally Sign & Dispatch]
          ========================================================================= */}
      <footer
        className="ds-glass-panel"
        style={{
          position: 'sticky',
          bottom: '8px',
          zIndex: 900,
          borderRadius: '14px',
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 27, 75, 0.96) 100%)',
          border: '1.5px solid rgba(168, 85, 247, 0.45)',
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Selected Specimen Context Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Action Target:
          </div>
          <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>
            {activeSpecimen.patientName} ({activeSpecimen.accessionNumber})
          </strong>
          <Badge variant={activeSpecimen.isCritical ? 'critical' : 'primary'} style={{ fontSize: '0.65rem' }}>
            {activeSpecimen.department}
          </Badge>
        </div>

        {/* 4 Bottom Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* 1. Reflex Test Order */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReflexModalOpen(true)}
            style={{
              borderColor: 'rgba(56, 189, 248, 0.5)',
              color: '#38BDF8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🧪</span>
            <span>Reflex Test Order</span>
          </Button>

          {/* 2. Request Repeat / Dilution */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRepeatModalOpen(true)}
            style={{
              borderColor: 'rgba(245, 158, 11, 0.5)',
              color: '#FCD34D',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔁</span>
            <span>Request Repeat / Dilution</span>
          </Button>

          {/* 3. Log Panic Call (Read-Back Logged) */}
          <Button
            size="sm"
            onClick={() => onOpenPanicModal(activeSpecimen)}
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
            }}
          >
            <span>📞</span>
            <span>Log Panic Call</span>
          </Button>

          {/* 4. Digitally Sign & Dispatch */}
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenBatchDscModal}
            style={{
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.45)'
            }}
          >
            <span>✍️</span>
            <span>Digitally Sign &amp; Dispatch</span>
          </Button>
        </div>
      </footer>

      {/* =========================================================================
          INTERACTIVE MODAL: Reflex Test Order
          ========================================================================= */}
      {isReflexModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10006,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="ds-glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#0F172A',
              border: '2px solid #38BDF8',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 60px rgba(56, 189, 248, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>🧪</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#7DD3FC' }}>
                    ORDER REFLEX INVESTIGATION
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    Accredited Laboratory Automatic Reflex Testing Protocol
                  </div>
                </div>
              </div>
              <Badge variant="info">NABL Reflex Rules</Badge>
            </div>

            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                Patient: <strong style={{ color: '#F8FAFC' }}>{activeSpecimen.patientName}</strong> ({activeSpecimen.accessionNumber})
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                Department: {activeSpecimen.department} • Machine: {activeSpecimen.analyzerMachine}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                Select Accredited Reflex Test:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeSpecimen.reflexOptions.map((opt, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: selectedReflexTest === opt ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedReflexTest === opt ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="reflexTestChoice"
                      checked={selectedReflexTest === opt}
                      onChange={() => setSelectedReflexTest(opt)}
                    />
                    <span style={{ fontSize: '0.76rem', color: '#F8FAFC', fontWeight: selectedReflexTest === opt ? 700 : 500 }}>
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                Clinical Justification Notes:
              </label>
              <input
                type="text"
                value={reflexJustification}
                onChange={(e) => setReflexJustification(e.target.value)}
                placeholder="E.g., Reflex confirmation per KDIGO AKI or critical electrolyte algorithm"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsReflexModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReflex}
                style={{ backgroundColor: '#0284C7', color: '#FFF', fontWeight: 800 }}
              >
                Add Reflex Order &amp; Transmit ➔
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE MODAL: Request Repeat / Dilution
          ========================================================================= */}
      {isRepeatModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10006,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="ds-glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#0F172A',
              border: '2px solid #F59E0B',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 60px rgba(245, 158, 11, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>🔁</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FCD34D' }}>
                    REQUEST SPECIMEN RE-RUN / DILUTION
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    Automated ASTM Analyzer Re-Queue Directive
                  </div>
                </div>
              </div>
              <Badge variant="warning">Analytical Precision</Badge>
            </div>

            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                Specimen Accession: <strong style={{ color: '#F8FAFC' }}>{activeSpecimen.accessionNumber}</strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                Primary Analyzer: {activeSpecimen.analyzerMachine}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                Re-Run Protocol:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { key: '1_TO_2_DILUTION', label: '1:2 Automated Dilution (Roche / Sysmex)' },
                  { key: '1_TO_10_DILUTION', label: '1:10 Linearity Range Dilution' },
                  { key: 'PLAIN_REPEAT', label: 'Duplicate Plain Repeat (Precision verification)' },
                  { key: 'REDRAW_REQUEST', label: 'Phlebotomy Redraw Request (Artifact / Clot / Hemolysis)' }
                ].map((item) => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: repeatProtocol === item.key ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: repeatProtocol === item.key ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="repeatProtocolChoice"
                      checked={repeatProtocol === item.key}
                      onChange={() => setRepeatProtocol(item.key as any)}
                    />
                    <span style={{ fontSize: '0.76rem', color: '#F8FAFC', fontWeight: repeatProtocol === item.key ? 700 : 500 }}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                Internal Lab Log Note:
              </label>
              <input
                type="text"
                value={repeatNotes}
                onChange={(e) => setRepeatNotes(e.target.value)}
                placeholder="E.g., High parameter rerun to verify linearity before reporting"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsRepeatModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRepeat}
                style={{ backgroundColor: '#D97706', color: '#FFF', fontWeight: 800 }}
              >
                Transmit ASTM Re-run Directive ➔
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
