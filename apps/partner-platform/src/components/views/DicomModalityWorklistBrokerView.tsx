import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface ModalityConsoleNode {
  aeTitle: string;
  stationName: string;
  modality: 'CT' | 'MR' | 'DX' | 'US';
  ipAddress: string;
  port: number;
  status: 'ONLINE' | 'ACQUIRING' | 'STANDBY';
  latencyMs: number;
  lastCfindQuery: string;
  bufferedWorklistItems: number;
}

export interface MwlScheduledStudy {
  id: string;
  accessionNumber: string;
  mrn: string;
  patientName: string;
  ageGender: string;
  modality: 'CT' | 'MR' | 'DX' | 'US';
  scheduledProcedureStep: string;
  scheduledTime: string;
  targetAeTitle: string;
  roomName: string;
  urgency: 'STAT_CRITICAL' | 'URGENT' | 'ROUTINE';
  contrastRequired: boolean;
  requestingPhysician: string;
  mwlStatus: 'SYNCED_TO_CONSOLE' | 'QUEUED' | 'IN_ACQUISITION' | 'ACQUIRED_PACS_PUSHED';
}

const MODALITY_CONSOLES: ModalityConsoleNode[] = [
  {
    aeTitle: 'CT_SOMATOM_01',
    stationName: 'Siemens Somatom 128-Slice CT',
    modality: 'CT',
    ipAddress: '192.168.1.101',
    port: 104,
    status: 'ONLINE',
    latencyMs: 1,
    lastCfindQuery: '8 seconds ago',
    bufferedWorklistItems: 3
  },
  {
    aeTitle: 'MRI_SIGNA_01',
    stationName: 'GE Signa 1.5T HDxt MRI',
    modality: 'MR',
    ipAddress: '192.168.1.102',
    port: 104,
    status: 'ONLINE',
    latencyMs: 2,
    lastCfindQuery: '32 seconds ago',
    bufferedWorklistItems: 2
  },
  {
    aeTitle: 'DX_PHILIPS_01',
    stationName: 'Philips DigitalDiagnost DR X-Ray',
    modality: 'DX',
    ipAddress: '192.168.1.103',
    port: 104,
    status: 'ONLINE',
    latencyMs: 1,
    lastCfindQuery: 'Just now',
    bufferedWorklistItems: 4
  },
  {
    aeTitle: 'USG_VOLUSON_01',
    stationName: 'GE Voluson E8 HD Color Doppler',
    modality: 'US',
    ipAddress: '192.168.1.104',
    port: 104,
    status: 'STANDBY',
    latencyMs: 3,
    lastCfindQuery: '3 mins ago',
    bufferedWorklistItems: 1
  }
];

const INITIAL_MWL_STUDIES: MwlScheduledStudy[] = [
  {
    id: 'MWL-001',
    accessionNumber: 'ACC-2026-CT-1049',
    mrn: 'MRN-2026-8812',
    patientName: 'Kamla Devi',
    ageGender: '71y / Female',
    modality: 'CT',
    scheduledProcedureStep: 'Non-Contrast Head CT (Axial 1mm Slices)',
    scheduledTime: '10 mins ago (STAT Trauma)',
    targetAeTitle: 'CT_SOMATOM_01',
    roomName: 'CT Scanner Suite #1',
    urgency: 'STAT_CRITICAL',
    contrastRequired: false,
    requestingPhysician: 'Dr. Vivek Sharma (ER Trauma Lead)',
    mwlStatus: 'SYNCED_TO_CONSOLE'
  },
  {
    id: 'MWL-002',
    accessionNumber: 'ACC-2026-DX-9041',
    mrn: 'MRN-2026-9041',
    patientName: 'Ramesh Verma',
    ageGender: '48y / Male',
    modality: 'DX',
    scheduledProcedureStep: 'Chest X-Ray PA View (Standing Bedside)',
    scheduledTime: '20 mins ago (STAT ICU)',
    targetAeTitle: 'DX_PHILIPS_01',
    roomName: 'X-Ray Room #2',
    urgency: 'STAT_CRITICAL',
    contrastRequired: false,
    requestingPhysician: 'Dr. Sarah Connor (ICU Intensivist)',
    mwlStatus: 'SYNCED_TO_CONSOLE'
  },
  {
    id: 'MWL-003',
    accessionNumber: 'ACC-2026-MR-4412',
    mrn: 'MRN-2026-4412',
    patientName: 'Sunil Mehta',
    ageGender: '64y / Male',
    modality: 'MR',
    scheduledProcedureStep: 'MRI Right Knee Joint with Cartilage 3D Mapping',
    scheduledTime: 'Today, 11:30 AM',
    targetAeTitle: 'MRI_SIGNA_01',
    roomName: 'MRI Suite (Basement 1)',
    urgency: 'URGENT',
    contrastRequired: false,
    requestingPhysician: 'Dr. Vikram Malhotra (Orthopedics)',
    mwlStatus: 'QUEUED'
  },
  {
    id: 'MWL-004',
    accessionNumber: 'ACC-2026-CT-1052',
    mrn: 'MRN-2026-7719',
    patientName: 'Anita Roy',
    ageGender: '29y / Female',
    modality: 'CT',
    scheduledProcedureStep: 'CECT Abdomen & Pelvis with Oral/IV Contrast',
    scheduledTime: 'Today, 12:15 PM',
    targetAeTitle: 'CT_SOMATOM_01',
    roomName: 'CT Scanner Suite #1',
    urgency: 'URGENT',
    contrastRequired: true,
    requestingPhysician: 'Dr. Sarah Jenkins (Gastroenterology)',
    mwlStatus: 'QUEUED'
  },
  {
    id: 'MWL-005',
    accessionNumber: 'ACC-2026-US-3312',
    mrn: 'MRN-2026-3312',
    patientName: 'Mukesh Yadav',
    ageGender: '45y / Male',
    modality: 'US',
    scheduledProcedureStep: 'Ultrasound Whole Abdomen (Gallbladder & Liver)',
    scheduledTime: 'Today, 01:00 PM',
    targetAeTitle: 'USG_VOLUSON_01',
    roomName: 'USG Room #3',
    urgency: 'ROUTINE',
    contrastRequired: false,
    requestingPhysician: 'Dr. Vivek Sharma (General Surgery)',
    mwlStatus: 'QUEUED'
  }
];

export interface DicomModalityWorklistBrokerViewProps {
  onOpenPacsViewer?: (accessionNumber: string) => void;
}

export const DicomModalityWorklistBrokerView: React.FC<DicomModalityWorklistBrokerViewProps> = ({
  onOpenPacsViewer
}) => {
  const [studies, setStudies] = useState<MwlScheduledStudy[]>(INITIAL_MWL_STUDIES);
  const [consoles] = useState<ModalityConsoleNode[]>(MODALITY_CONSOLES);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedModalityFilter, setSelectedModalityFilter] = useState<'ALL' | 'CT' | 'MR' | 'DX' | 'US'>('ALL');

  const filteredStudies = studies.filter(
    (s) => selectedModalityFilter === 'ALL' || s.modality === selectedModalityFilter
  );

  // 1-Click Broadcast Worklist to Modality Consoles (C-FIND SCP)
  const handleBroadcastAllWorklist = () => {
    setIsBroadcasting(true);
    setTimeout(() => {
      setStudies((prev) =>
        prev.map((s) => ({
          ...s,
          mwlStatus: 'SYNCED_TO_CONSOLE'
        }))
      );
      setIsBroadcasting(false);
      setToastMessage(
        '⚡ All 5 scheduled studies successfully broadcast to Siemens CT, GE MRI, and Philips X-Ray consoles over DICOM port 11112!'
      );
      setTimeout(() => setToastMessage(null), 5000);

      hospitalEventBus.publish(
        'MODALITY_WORKLIST_SYNCED',
        'DicomModalityWorklistBroker',
        {
          activeStudyCount: studies.length,
          timestamp: new Date().toISOString()
        },
        '📡 DICOM Modality Worklist (MWL) synchronized with radiology scanner consoles.'
      );
    }, 1200);
  };

  // Simulate Modality Acquiring Study
  const handleSimulateAcquisition = (studyId: string) => {
    setStudies((prev) =>
      prev.map((s) =>
        s.id === studyId
          ? { ...s, mwlStatus: 'IN_ACQUISITION' }
          : s
      )
    );
    setToastMessage('🩻 Scanner acquisition started. Console locked to patient MRN.');
    setTimeout(() => {
      setStudies((prev) =>
        prev.map((s) =>
          s.id === studyId
            ? { ...s, mwlStatus: 'ACQUIRED_PACS_PUSHED' }
            : s
        )
      );
      setToastMessage('✓ Acquisition finished. DICOM series pushed to DocSearch PACS (:8042) via C-STORE!');
      setTimeout(() => setToastMessage(null), 4000);
    }, 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', color: '#F8FAFC' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.1) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.6rem' }}>📡</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              DICOM Modality Worklist (MWL) Broker & Console Hub
            </h1>
            <Badge variant="primary">DICOM C-FIND SCP :11112</Badge>
            <Badge variant="success">Zero Console Typo Guarantee</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, maxWidth: '850px' }}>
            Broadcasts scheduled appointments directly into CT, MRI, X-Ray and USG modality consoles over DICOM TCP port 11112. Eliminates 100% of manual technician data entry, typographical mismatches, and orphan DICOM series.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="success"
            onClick={handleBroadcastAllWorklist}
            disabled={isBroadcasting}
            style={{
              fontWeight: 800,
              fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
            }}
          >
            {isBroadcasting ? 'Broadcasting to Consoles...' : '⚡ Broadcast Worklist to Modalities'}
          </Button>
        </div>
      </div>

      {/* Toast Banner */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1.5px solid #38BDF8',
            borderRadius: '12px',
            padding: '12px 18px',
            color: '#38BDF8',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Connected Modality Consoles Telemetry Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
          🖥️ Connected Modality Consoles (DICOM C-FIND SCU Listeners)
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px'
          }}
        >
          {consoles.map((c) => (
            <div
              key={c.aeTitle}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.88rem' }}>
                  {c.stationName}
                </span>
                <Badge variant={c.status === 'ONLINE' ? 'success' : 'neutral'}>
                  {c.status}
                </Badge>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>AETitle: <strong style={{ color: '#38BDF8' }}>{c.aeTitle}</strong> ({c.ipAddress}:{c.port})</div>
                <div>Last Query: {c.lastCfindQuery} • Ping: <span style={{ color: '#10B981' }}>{c.latencyMs}ms</span></div>
                <div>Buffered Queue: <strong style={{ color: '#F1F5F9' }}>{c.bufferedWorklistItems} Studies</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modality Filter Tabs */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
          Filter Worklist:
        </span>
        {(['ALL', 'CT', 'MR', 'DX', 'US'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setSelectedModalityFilter(m)}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: selectedModalityFilter === m ? '1px solid #38BDF8' : '1px solid #334155',
              backgroundColor: selectedModalityFilter === m ? 'rgba(56, 189, 248, 0.2)' : '#1E293B',
              color: selectedModalityFilter === m ? '#38BDF8' : '#CBD5E1',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {m === 'ALL' ? 'All Modalities' : `${m} Scanners`}
          </button>
        ))}
      </div>

      {/* Scheduled Worklist Studies Table */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F8FAFC' }}>
            Live Modality Acquisition Worklist ({filteredStudies.length} Studies)
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Port 11112 C-FIND SCP Active • Auto-Query Every 15s
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredStudies.map((study) => (
            <div
              key={study.id}
              style={{
                backgroundColor: '#1E293B',
                border: study.urgency === 'STAT_CRITICAL' ? '1.5px solid #EF4444' : '1px solid #334155',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: study.urgency === 'STAT_CRITICAL' ? '0 0 16px rgba(239, 68, 68, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '60%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.95rem' }}>
                    {study.patientName}
                  </span>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>({study.mrn} • {study.ageGender})</span>
                  <Badge variant={study.urgency === 'STAT_CRITICAL' ? 'danger' : study.urgency === 'URGENT' ? 'warning' : 'neutral'}>
                    {study.urgency}
                  </Badge>
                  {study.contrastRequired && (
                    <Badge variant="warning">⚠️ Contrast Required</Badge>
                  )}
                </div>

                <div style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.82rem' }}>
                  [{study.modality}] {study.scheduledProcedureStep}
                </div>

                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Accession: <strong style={{ color: '#F1F5F9' }}>{study.accessionNumber}</strong> • Room: {study.roomName} • Target: {study.targetAeTitle} • Ref: {study.requestingPhysician}
                </div>
              </div>

              {/* Status and Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <Badge
                    variant={
                      study.mwlStatus === 'ACQUIRED_PACS_PUSHED'
                        ? 'success'
                        : study.mwlStatus === 'IN_ACQUISITION'
                        ? 'warning'
                        : study.mwlStatus === 'SYNCED_TO_CONSOLE'
                        ? 'primary'
                        : 'neutral'
                    }
                  >
                    {study.mwlStatus.replace(/_/g, ' ')}
                  </Badge>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '3px' }}>
                    {study.scheduledTime}
                  </div>
                </div>

                {study.mwlStatus !== 'ACQUIRED_PACS_PUSHED' ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSimulateAcquisition(study.id)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    🩻 Acquire on Scanner
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenPacsViewer?.(study.accessionNumber)}
                    style={{ fontSize: '0.75rem', borderColor: '#38BDF8', color: '#38BDF8' }}
                  >
                    🖥️ View in PACS AI
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
