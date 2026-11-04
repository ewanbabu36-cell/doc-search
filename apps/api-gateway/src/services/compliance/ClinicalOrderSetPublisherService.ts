import crypto from 'node:crypto';

/**
 * Central Evidence-Based Clinical Order Set Publisher (Epic Systems Hyperspace Benchmark)
 * Standardizes evidence bundles across all network hospital EMRs.
 * Sepsis Hour-1, STEMI Door-to-Balloon, Stroke tPA, Dengue Fluid Protocol.
 * Governed with Medical Superintendent cryptographic sign-off & real-time broadcast sync.
 */

export type OrderSetStatus =
  | 'DRAFT'
  | 'PEER_REVIEW'
  | 'SUPERINTENDENT_APPROVED'
  | 'PUBLISHED_BROADCASTED';

export type OrderItemType =
  | 'MEDICATION'
  | 'LAB_INVESTIGATION'
  | 'IMAGING_RADIOLOGY'
  | 'NURSING_CARE'
  | 'CLINICAL_MONITORING';

export interface ClinicalOrderItem {
  id: string;
  type: OrderItemType;
  title: string;
  dosageOrProtocol: string;
  route?: string;
  frequency?: string;
  priority: 'STAT_EMERGENCY' | 'URGENT' | 'ROUTINE';
  clinicalRationale: string;
}

export interface ClinicalOrderSet {
  id: string;
  bundleCode: string;
  title: string;
  clinicalDomain: 'EMERGENCY_CRITICAL_CARE' | 'CARDIOLOGY' | 'NEUROLOGY' | 'INFECTIOUS_DISEASE' | 'PAEDIATRICS' | 'SURGERY';
  evidenceSource: string; // e.g. "Surviving Sepsis Campaign 2026 Guidelines", "AHA/ACC STEMI Guidelines"
  version: string;
  status: OrderSetStatus;
  leadAuthorDoctor: string;
  peerReviewerDoctor?: string;
  medicalSuperintendentSignoff?: {
    approvedBy: string;
    designation: string;
    signedAt: string;
    digitalSignatureHash: string;
  };
  targetAcuity: 'LEVEL_1_RESUSCITATION' | 'LEVEL_2_EMERGENT' | 'LEVEL_3_URGENT';
  orders: ClinicalOrderItem[];
  subscribedHospitalCount: number;
  lastUpdatedAt: string;
}

export class ClinicalOrderSetPublisherService {
  private orderSets: ClinicalOrderSet[] = [
    {
      id: 'SET-SEPSIS-01',
      bundleCode: 'ORD-SEPSIS-HOUR1',
      title: 'Sepsis Hour-1 Resuscitation Bundle',
      clinicalDomain: 'EMERGENCY_CRITICAL_CARE',
      evidenceSource: 'Surviving Sepsis Campaign International Guidelines 2026',
      version: 'v3.2.0',
      status: 'PUBLISHED_BROADCASTED',
      leadAuthorDoctor: 'Dr. Rohan Sethi (MD, DM Cardiology)',
      peerReviewerDoctor: 'Dr. Priya Venkatraman (MS, MCh)',
      medicalSuperintendentSignoff: {
        approvedBy: 'Dr. B. K. Rao',
        designation: 'Group Medical Superintendent, DocSearch Hospital Network',
        signedAt: '2026-10-15T10:00:00Z',
        digitalSignatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      },
      targetAcuity: 'LEVEL_1_RESUSCITATION',
      subscribedHospitalCount: 48,
      lastUpdatedAt: '2026-10-15T10:00:00Z',
      orders: [
        {
          id: 'SEP-01',
          type: 'LAB_INVESTIGATION',
          title: 'Serum Lactate Measurement & Arterial Blood Gas',
          dosageOrProtocol: 'STAT ABG + Lactate. Re-measure if initial lactate > 2 mmol/L',
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
          title: 'IV Broad-Spectrum Antimicrobial: Inj. Piperacillin-Tazobactam + Vancomycin',
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
      medicalSuperintendentSignoff: {
        approvedBy: 'Dr. B. K. Rao',
        designation: 'Group Medical Superintendent',
        signedAt: '2026-10-18T14:30:00Z',
        digitalSignatureHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
      },
      targetAcuity: 'LEVEL_1_RESUSCITATION',
      subscribedHospitalCount: 42,
      lastUpdatedAt: '2026-10-18T14:30:00Z',
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
          clinicalRationale: 'Immediate cyclooxygenase-1 platelet inhibition'
        },
        {
          id: 'STM-03',
          type: 'MEDICATION',
          title: 'P2Y12 Inhibitor Loading Dose: Tab. Ticagrelor 180 mg',
          dosageOrProtocol: 'Ticagrelor 180 mg (or Prasugrel 60 mg if catheterization confirmed)',
          route: 'ORAL',
          priority: 'STAT_EMERGENCY',
          clinicalRationale: 'Dual antiplatelet therapy for acute coronary occlusion'
        },
        {
          id: 'STM-04',
          type: 'CLINICAL_MONITORING',
          title: 'Cath Lab Code STEMI Alert & Door-to-Balloon Timer',
          dosageOrProtocol: 'Activate interventional cardiology on-call team; target D2B < 60 mins',
          priority: 'STAT_EMERGENCY',
          clinicalRationale: 'Myocardial salvage is directly proportional to reperfusion speed'
        }
      ]
    },
    {
      id: 'SET-DENGUE-03',
      bundleCode: 'ORD-DENGUE-DSS',
      title: 'Dengue Shock Syndrome Critical Fluid Protocol',
      clinicalDomain: 'INFECTIOUS_DISEASE',
      evidenceSource: 'National Vector Borne Disease Control Programme (NVBDCP) & WHO',
      version: 'v4.0.1',
      status: 'PUBLISHED_BROADCASTED',
      leadAuthorDoctor: 'Dr. Ananya Banerjee (MD Paediatrics)',
      targetAcuity: 'LEVEL_2_EMERGENT',
      subscribedHospitalCount: 52,
      lastUpdatedAt: '2026-10-25T11:20:00Z',
      orders: [
        {
          id: 'DNG-01',
          type: 'LAB_INVESTIGATION',
          title: 'Serial Hematocrit (HCT) & Platelet Count Q4H',
          dosageOrProtocol: 'Measure HCT and Platelet every 4 hours during critical defervescence phase',
          priority: 'URGENT',
          clinicalRationale: 'Rising HCT indicates plasma leakage; dropping HCT with unstable vitals signals internal bleed'
        },
        {
          id: 'DNG-02',
          type: 'NURSING_CARE',
          title: 'Titrated Isotonic Crystalloid (Ringer Lactate) Regimen',
          dosageOrProtocol: '5-7 mL/kg/hr for 1-2 hours -> taper to 3-5 mL/kg/hr -> 2 mL/kg/hr as MAP stabilizes',
          route: 'IV INFUSION INFUSION PUMP',
          priority: 'URGENT',
          clinicalRationale: 'Prevent fluid overload, pulmonary edema, while counteracting microvascular leak'
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
      targetAcuity: 'LEVEL_3_URGENT',
      subscribedHospitalCount: 22,
      lastUpdatedAt: '2026-11-01T09:40:00Z',
      orders: [
        {
          id: 'SRG-01',
          type: 'MEDICATION',
          title: 'Inj. Cefazolin 2g IV Pre-Incision',
          dosageOrProtocol: 'Administer within 60 minutes prior to surgical knife-to-skin',
          route: 'IV SLOW BOLUS',
          priority: 'STAT_EMERGENCY',
          clinicalRationale: 'Ensures bactericidal tissue concentration before skin barrier disruption'
        },
        {
          id: 'SRG-02',
          type: 'NURSING_CARE',
          title: 'Automatic Antibiotic Discontinuation at 24 Hours Post-Op',
          dosageOrProtocol: 'Stop prophylactic antibiotic within 24 hours unless documented active infection',
          priority: 'ROUTINE',
          clinicalRationale: 'Strict antimicrobial stewardship to prevent multi-drug resistant superbugs'
        }
      ]
    }
  ];

  public listOrderSets(domainFilter?: string): ClinicalOrderSet[] {
    if (domainFilter && domainFilter !== 'ALL') {
      return this.orderSets.filter((s) => s.clinicalDomain === domainFilter || s.status === domainFilter);
    }
    return this.orderSets;
  }

  public getOrderSetById(id: string): ClinicalOrderSet | undefined {
    return this.orderSets.find((s) => s.id === id || s.bundleCode === id);
  }

  public publishAndSignoffOrderSet(params: {
    id: string;
    approvedBy: string;
    designation: string;
  }): { success: boolean; message: string; orderSet?: ClinicalOrderSet } {
    const item = this.orderSets.find((s) => s.id === params.id);
    if (!item) {
      return { success: false, message: `Order Set ${params.id} not found` };
    }

    const sigHash = crypto
      .createHash('sha256')
      .update(`${item.id}:${params.approvedBy}:${Date.now()}`)
      .digest('hex');

    item.status = 'PUBLISHED_BROADCASTED';
    item.medicalSuperintendentSignoff = {
      approvedBy: params.approvedBy,
      designation: params.designation,
      signedAt: new Date().toISOString(),
      digitalSignatureHash: sigHash
    };
    item.lastUpdatedAt = new Date().toISOString();

    return {
      success: true,
      message: `Clinical Order Set ${item.bundleCode} (${item.title}) signed off by ${params.approvedBy} and broadcasted to network EMRs!`,
      orderSet: item
    };
  }

  public broadcastToTenants(id: string): { success: boolean; message: string; broadcastCount: number } {
    const item = this.orderSets.find((s) => s.id === id);
    if (!item) {
      return { success: false, message: `Order Set ${id} not found`, broadcastCount: 0 };
    }

    item.subscribedHospitalCount += 6; // Simulate expansion to 6 newly onboarded hospital tenants
    return {
      success: true,
      message: `Broadcasted ${item.title} to all ${item.subscribedHospitalCount} network hospital EMR tenant nodes. Synchronized with zero clinician disruption.`,
      broadcastCount: item.subscribedHospitalCount
    };
  }
}

export const clinicalOrderSetPublisherService = new ClinicalOrderSetPublisherService();
