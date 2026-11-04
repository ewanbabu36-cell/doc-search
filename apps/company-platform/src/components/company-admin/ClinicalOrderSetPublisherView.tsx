import React, { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

interface OrderItem {
  id: string;
  type: 'MEDICATION' | 'LAB_INVESTIGATION' | 'IMAGING_RADIOLOGY' | 'NURSING_CARE' | 'CLINICAL_MONITORING';
  title: string;
  dosageOrProtocol: string;
  route?: string;
  priority: 'STAT_EMERGENCY' | 'URGENT' | 'ROUTINE';
  clinicalRationale: string;
}

interface OrderSet {
  id: string;
  bundleCode: string;
  title: string;
  clinicalDomain: string;
  evidenceSource: string;
  version: string;
  status: 'DRAFT' | 'PEER_REVIEW' | 'SUPERINTENDENT_APPROVED' | 'PUBLISHED_BROADCASTED';
  leadAuthorDoctor: string;
  targetAcuity: string;
  subscribedHospitalCount: number;
  approvedBy?: string;
  signatureHash?: string;
  orders: OrderItem[];
}

const INITIAL_ORDER_SETS: OrderSet[] = [
  {
    id: 'SET-SEPSIS-01',
    bundleCode: 'ORD-SEPSIS-HOUR1',
    title: 'Sepsis Hour-1 Resuscitation Bundle',
    clinicalDomain: 'EMERGENCY & CRITICAL CARE',
    evidenceSource: 'Surviving Sepsis Campaign International Guidelines 2026',
    version: 'v3.2.0',
    status: 'PUBLISHED_BROADCASTED',
    leadAuthorDoctor: 'Dr. Rohan Sethi (MD, DM Cardiology)',
    targetAcuity: 'LEVEL 1 RESUSCITATION',
    subscribedHospitalCount: 48,
    approvedBy: 'Dr. B. K. Rao (Medical Superintendent)',
    signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    orders: [
      {
        id: 'SEP-01',
        type: 'LAB_INVESTIGATION',
        title: 'Serum Lactate Measurement & Arterial Blood Gas (ABG)',
        dosageOrProtocol: 'STAT ABG + Lactate. Repeat if initial lactate > 2 mmol/L',
        priority: 'STAT_EMERGENCY',
        clinicalRationale: 'Detects tissue hypoperfusion prior to refractory hypotension'
      },
      {
        id: 'SEP-02',
        type: 'LAB_INVESTIGATION',
        title: 'Blood Cultures (2 Sets: Peripheral + Central Line)',
        dosageOrProtocol: 'Obtain blood cultures BEFORE administering antimicrobial agents',
        priority: 'STAT_EMERGENCY',
        clinicalRationale: 'Essential for pathogen identification without sterile masking'
      },
      {
        id: 'SEP-03',
        type: 'MEDICATION',
        title: 'IV Broad-Spectrum Antimicrobial: Pip-Taz + Vancomycin',
        dosageOrProtocol: 'Pip-Taz 4.5g IV in 100ml NS over 30 mins + Vancomycin 15-20 mg/kg IV',
        route: 'IV INFUSION',
        priority: 'STAT_EMERGENCY',
        clinicalRationale: 'Administer within 1 hour of sepsis recognition'
      },
      {
        id: 'SEP-04',
        type: 'NURSING_CARE',
        title: 'Rapid Crystalloid Resuscitation: 30 mL/kg IV',
        dosageOrProtocol: 'Ringer Lactate 30 mL/kg within first 3 hours for MAP < 65 or Lactate >= 4',
        route: 'IV PRESSURE BAG',
        priority: 'STAT_EMERGENCY',
        clinicalRationale: 'Restores effective circulating intravascular volume'
      }
    ]
  },
  {
    id: 'SET-STEMI-02',
    bundleCode: 'ORD-STEMI-D2B',
    title: 'Acute STEMI Door-to-Balloon Protocol',
    clinicalDomain: 'CARDIOLOGY',
    evidenceSource: 'American College of Cardiology / AHA Guidelines for STEMI 2026',
    version: 'v2.8.0',
    status: 'PUBLISHED_BROADCASTED',
    leadAuthorDoctor: 'Dr. Rohan Sethi (MD, DM Cardiology)',
    targetAcuity: 'LEVEL 1 RESUSCITATION',
    subscribedHospitalCount: 42,
    approvedBy: 'Dr. B. K. Rao (Medical Superintendent)',
    signatureHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    orders: [
      {
        id: 'STM-01',
        type: 'LAB_INVESTIGATION',
        title: '12-Lead ECG Acquisition & AI Interpretation',
        dosageOrProtocol: 'Complete ECG within 10 minutes of ER arrival',
        priority: 'STAT_EMERGENCY',
        clinicalRationale: 'Identifies ST-segment elevation requiring emergent primary PCI'
      },
      {
        id: 'STM-02',
        type: 'MEDICATION',
        title: 'Dispersible Aspirin Loading Dose',
        dosageOrProtocol: 'Tab. Aspirin 325 mg chewed immediately',
        route: 'ORAL CHEWABLE',
        priority: 'STAT_EMERGENCY',
        clinicalRationale: 'Immediate platelet inhibition'
      },
      {
        id: 'STM-03',
        type: 'MEDICATION',
        title: 'P2Y12 Inhibitor Loading Dose: Tab. Ticagrelor 180 mg',
        dosageOrProtocol: 'Ticagrelor 180 mg oral loading dose',
        route: 'ORAL',
        priority: 'STAT_EMERGENCY',
        clinicalRationale: 'Dual antiplatelet therapy for coronary occlusion'
      },
      {
        id: 'STM-04',
        type: 'CLINICAL_MONITORING',
        title: 'Cath Lab Code STEMI Alert & Door-to-Balloon Timer',
        dosageOrProtocol: 'Activate interventional cardiology on-call team; target D2B < 60 mins',
        priority: 'STAT_EMERGENCY',
        clinicalRationale: 'Directly salvages ischemic myocardium'
      }
    ]
  },
  {
    id: 'SET-DENGUE-03',
    bundleCode: 'ORD-DENGUE-DSS',
    title: 'Dengue Shock Syndrome Critical Fluid Protocol',
    clinicalDomain: 'INFECTIOUS DISEASE',
    evidenceSource: 'National Vector Borne Disease Control Programme (NVBDCP) & WHO',
    version: 'v4.0.1',
    status: 'PUBLISHED_BROADCASTED',
    leadAuthorDoctor: 'Dr. Ananya Banerjee (MD Paediatrics)',
    targetAcuity: 'LEVEL 2 EMERGENT',
    subscribedHospitalCount: 52,
    approvedBy: 'Dr. B. K. Rao (Medical Superintendent)',
    signatureHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    orders: [
      {
        id: 'DNG-01',
        type: 'LAB_INVESTIGATION',
        title: 'Serial Hematocrit (HCT) & Platelet Count Q4H',
        dosageOrProtocol: 'Measure HCT and Platelet every 4 hours during critical defervescence phase',
        priority: 'URGENT',
        clinicalRationale: 'Tracks plasma leakage severity and occult internal hemorrhage'
      },
      {
        id: 'DNG-02',
        type: 'NURSING_CARE',
        title: 'Titrated Isotonic Crystalloid (Ringer Lactate) Regimen',
        dosageOrProtocol: '5-7 mL/kg/hr for 1-2 hours -> taper to 3-5 mL/kg/hr as MAP stabilizes',
        route: 'IV INFUSION',
        priority: 'URGENT',
        clinicalRationale: 'Counters microvascular leak while avoiding fluid overload pulmonary edema'
      }
    ]
  },
  {
    id: 'SET-SURG-04',
    bundleCode: 'ORD-SURG-PROPHYLAXIS',
    title: 'Post-Op Surgical Antimicrobial Prophylaxis',
    clinicalDomain: 'SURGERY',
    evidenceSource: 'CDC Surgical Site Infection Guidelines & WHO Global Surgery 2026',
    version: 'v1.5.0',
    status: 'PEER_REVIEW',
    leadAuthorDoctor: 'Dr. Priya Venkatraman (MS, MCh)',
    targetAcuity: 'LEVEL 3 URGENT',
    subscribedHospitalCount: 22,
    orders: [
      {
        id: 'SRG-01',
        type: 'MEDICATION',
        title: 'Inj. Cefazolin 2g IV Pre-Incision',
        dosageOrProtocol: 'Administer within 60 minutes prior to surgical knife-to-skin',
        route: 'IV SLOW BOLUS',
        priority: 'STAT_EMERGENCY',
        clinicalRationale: 'Ensures bactericidal tissue concentration before skin incisional breach'
      },
      {
        id: 'SRG-02',
        type: 'NURSING_CARE',
        title: 'Automatic Antibiotic Discontinuation at 24 Hours Post-Op',
        dosageOrProtocol: 'Stop prophylactic antibiotic within 24 hours unless active infection proven',
        priority: 'ROUTINE',
        clinicalRationale: 'Rigorous stewardship to prevent multi-drug resistant superbug selection'
      }
    ]
  }
];

export const ClinicalOrderSetPublisherView: React.FC = () => {
  const [orderSets, setOrderSets] = useState<OrderSet[]>(INITIAL_ORDER_SETS);
  const [selectedSetId, setSelectedSetId] = useState<string>('SET-SEPSIS-01');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedSet = orderSets.find((s) => s.id === selectedSetId) || orderSets[0]!;

  const handleSignoffAndPublish = (set: OrderSet) => {
    const updatedSets = orderSets.map((s) => {
      if (s.id === set.id) {
        return {
          ...s,
          status: 'PUBLISHED_BROADCASTED' as const,
          approvedBy: 'Dr. B. K. Rao (Medical Superintendent)',
          signatureHash: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e'
        };
      }
      return s;
    });
    setOrderSets(updatedSets);
    setToastMessage(`✍️ Order Set ${set.bundleCode} cryptographically signed by Medical Superintendent and approved for network broadcast!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleBroadcastToTenants = (set: OrderSet) => {
    const updatedSets = orderSets.map((s) => {
      if (s.id === set.id) {
        return {
          ...s,
          subscribedHospitalCount: s.subscribedHospitalCount + 6
        };
      }
      return s;
    });
    setOrderSets(updatedSets);
    setToastMessage(`🚀 Broadcasted ${set.title} to all ${set.subscribedHospitalCount + 6} network hospital EMR nodes! Synchronized live.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#059669',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0F172A',
          padding: '24px 28px',
          borderRadius: '12px',
          border: '1px solid #1E293B'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.4rem' }}>📋</span>
            <h2 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.35rem', fontWeight: 700 }}>
              Central Evidence-Based Clinical Order Set Publisher
            </h2>
            <Badge variant="primary">Epic Hyperspace Benchmark</Badge>
            <Badge variant="success">Evidence-Based Medicine</Badge>
          </div>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem' }}>
            Author, clinically peer-review, and digitally broadcast standardized emergency & critical care order sets to all network hospital EMR nodes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedSet.status !== 'PUBLISHED_BROADCASTED' ? (
            <Button variant="primary" onClick={() => handleSignoffAndPublish(selectedSet)}>
              ✍️ Medical Superintendent Sign-Off
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => handleBroadcastToTenants(selectedSet)}>
              📡 Broadcast to Network EMRs ({selectedSet.subscribedHospitalCount})
            </Button>
          )}
        </div>
      </div>

      {/* Order Sets Selector Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {orderSets.map((set) => {
          const isSelected = set.id === selectedSet.id;
          return (
            <div
              key={set.id}
              onClick={() => setSelectedSetId(set.id)}
              style={{
                backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.1)' : '#0F172A',
                border: isSelected ? '1.5px solid #38BDF8' : '1px solid #1E293B',
                borderRadius: '10px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8' }}>{set.bundleCode}</span>
                <Badge variant={set.status === 'PUBLISHED_BROADCASTED' ? 'success' : 'warning'}>
                  {set.status === 'PUBLISHED_BROADCASTED' ? 'PUBLISHED' : 'PEER REVIEW'}
                </Badge>
              </div>

              <div style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.98rem', marginBottom: '6px' }}>
                {set.title}
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '10px' }}>
                {set.clinicalDomain} • {set.version}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                <span>Subscribed: {set.subscribedHospitalCount} Hospitals</span>
                <span>{set.orders.length} Order Items</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Order Set Detail Workspace */}
      <Card style={{ padding: '24px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.2rem', fontWeight: 700 }}>
                {selectedSet.title} ({selectedSet.bundleCode})
              </h3>
              <Badge variant="primary">{selectedSet.targetAcuity}</Badge>
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              Evidence Source: <strong>{selectedSet.evidenceSource}</strong>
            </div>
            <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '4px' }}>
              Lead Author: {selectedSet.leadAuthorDoctor}
            </div>
          </div>

          {selectedSet.approvedBy && (
            <div
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #10B981',
                borderRadius: '8px',
                padding: '10px 14px',
                textAlign: 'right'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                ✓ CRYPTOGRAPHICALLY SIGNED
              </div>
              <div style={{ fontSize: '0.82rem', color: '#F8FAFC', fontWeight: 600 }}>
                {selectedSet.approvedBy}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                Hash: {selectedSet.signatureHash?.slice(0, 16)}...
              </div>
            </div>
          )}
        </div>

        {/* Clinical Orders Table */}
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Clinical Order Item</TableHead>
                <TableHead>Dosage / Execution Protocol</TableHead>
                <TableHead>Route / Method</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Evidence Rationale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedSet.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Badge variant={order.type === 'MEDICATION' ? 'primary' : order.type === 'LAB_INVESTIGATION' ? 'info' : 'neutral'}>
                      {order.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontWeight: 600, color: '#F8FAFC' }}>
                    {order.title}
                  </TableCell>
                  <TableCell style={{ color: '#CBD5E1', fontSize: '0.84rem' }}>
                    {order.dosageOrProtocol}
                  </TableCell>
                  <TableCell style={{ color: '#94A3B8', fontSize: '0.82rem' }}>
                    {order.route || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.priority === 'STAT_EMERGENCY' ? 'danger' : 'warning'}>
                      {order.priority.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8rem', color: '#6EE7B7', maxWidth: '240px' }}>
                    {order.clinicalRationale}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
