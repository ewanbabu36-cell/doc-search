import type {
  DynamicLicenceRuleDto,
  DynamicOfferDto,
  WorkflowDefinitionDto
} from '@docsearch/api-contracts';

export const SEED_WORKFLOW_DEFINITIONS: WorkflowDefinitionDto[] = [
  // ============================================================
  // WORKFLOW 1: HOSPITAL LIFECYCLE (HOSPITAL_LIFECYCLE_V1)
  // ============================================================
  {
    id: 'WF-DEF-HOSPITAL-01',
    code: 'HOSPITAL_LIFECYCLE',
    name: 'Hospital Network & Surgical Enterprise Lifecycle',
    description: 'Dynamic end-to-end lifecycle for Multi-Speciality Hospitals and Medical Institutes.',
    entityType: 'PARTNER_ORGANIZATION',
    organizationType: 'HOSPITAL',
    activeVersion: 1,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    versions: [
      {
        id: 'WF-VER-HOSP-01-V1',
        workflowId: 'WF-DEF-HOSPITAL-01',
        version: 1,
        status: 'ACTIVE',
        effectiveFrom: '2026-01-01T00:00:00Z',
        changeSummary: 'Initial Hospital Lifecycle Workflow with NABH KYC and Commercial Approval',
        createdAt: '2026-01-01T00:00:00Z',
        createdBy: 'CHIEF_COMPLIANCE_OFFICER',
        stages: [
          {
            id: 'STG-HOSP-01',
            workflowId: 'WF-DEF-HOSPITAL-01',
            code: 'LEAD_INGESTION',
            name: '1. Lead Capture & Entity Verification',
            description: 'Capture institutional hospital lead and verify basic credentials.',
            sequence: 1,
            stageType: 'INITIAL',
            isInitial: true,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-HOSP-01-01',
                stageId: 'STG-HOSP-01',
                requirementCode: 'ENTITY_REGISTRATION_DETAILS',
                name: 'Hospital Entity & GST Registration',
                requirementType: 'DOCUMENT',
                configuration: { allowedTypes: ['PDF', 'IMAGE'] },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-HOSP-02',
            workflowId: 'WF-DEF-HOSPITAL-01',
            code: 'COMMERCIAL_OFFER',
            name: '2. Commercial Plan & Dynamic Quoting',
            description: 'Configure subscription tier, doctor seats, and apply eligible offers.',
            sequence: 2,
            stageType: 'COMMERCIAL',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-HOSP-02-01',
                stageId: 'STG-HOSP-02',
                requirementCode: 'COMMERCIAL_QUOTATION_ACCEPTED',
                name: 'Commercial Quotation Sign-off',
                requirementType: 'PAYMENT',
                configuration: { requiresAdvanceDeposit: true },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-HOSP-03',
            workflowId: 'WF-DEF-HOSPITAL-01',
            code: 'COMMERCIAL_APPROVAL',
            name: '3. Commercial & Finance Approval Gate',
            description: 'Requires sign-off from Commercial Finance Manager.',
            sequence: 3,
            stageType: 'COMMERCIAL',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-HOSP-03-01',
                stageId: 'STG-HOSP-03',
                requirementCode: 'FINANCE_MANAGER_APPROVAL',
                name: 'Finance & CFO Margin Approval',
                requirementType: 'APPROVAL',
                configuration: { role: 'FINANCE_MANAGER' },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-HOSP-04',
            workflowId: 'WF-DEF-HOSPITAL-01',
            code: 'REGULATORY_COMPLIANCE',
            name: '4. Regulatory KYC & Hospital Licencing',
            description: 'Verification of Clinical Establishment Act (CEA) and NABH certification.',
            sequence: 4,
            stageType: 'COMPLIANCE',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-HOSP-04-01',
                stageId: 'STG-HOSP-04',
                requirementCode: 'HOSPITAL_CEA_LICENCE',
                name: 'State Clinical Establishment Registration',
                requirementType: 'LICENCE',
                configuration: { licenceType: 'HOSPITAL_CEA', checkExpiry: true },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              },
              {
                id: 'REQ-HOSP-04-02',
                stageId: 'STG-HOSP-04',
                requirementCode: 'NABH_ACCREDITATION_DOC',
                name: 'NABH Accreditation Certificate',
                requirementType: 'DOCUMENT',
                configuration: { optionalForPrimaryCare: false },
                isRequired: true,
                order: 2,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-HOSP-05',
            workflowId: 'WF-DEF-HOSPITAL-01',
            code: 'TENANT_PROVISIONING',
            name: '5. Tenant & Cloud Infrastructure Provisioning',
            description: 'Automated database isolation, admin credentials, and ABDM HFR token generation.',
            sequence: 5,
            stageType: 'PROVISIONING',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-HOSP-05-01',
                stageId: 'STG-HOSP-05',
                requirementCode: 'ADMIN_CREDENTIALS_DISPATCHED',
                name: 'Hospital Medical Superintendent Admin Access',
                requirementType: 'ADMIN_USER',
                configuration: { sendSmsInvite: true },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-HOSP-06',
            workflowId: 'WF-DEF-HOSPITAL-01',
            code: 'HOSPITAL_ONBOARDING',
            name: '6. Hospital Onboarding & Department Setup',
            description: 'Branch configuration, department mapping (Cardiology, OPD, IPD), and doctor roster.',
            sequence: 6,
            stageType: 'ONBOARDING',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-HOSP-06-01',
                stageId: 'STG-HOSP-06',
                requirementCode: 'BRANCH_AND_DEPARTMENTS_MAPPED',
                name: 'Hospital Branches & Departments Configured',
                requirementType: 'BRANCH',
                configuration: { minBranches: 1, minDepartments: 2 },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-HOSP-07',
            workflowId: 'WF-DEF-HOSPITAL-01',
            code: 'GO_LIVE_GATE',
            name: '7. Go-Live Production Gate',
            description: 'Dynamic evaluation of all commercial, regulatory, and technical readiness conditions.',
            sequence: 7,
            stageType: 'GO_LIVE_GATE',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: []
          },
          {
            id: 'STG-HOSP-08',
            workflowId: 'WF-DEF-HOSPITAL-01',
            code: 'ACTIVE_CUSTOMER',
            name: '8. Active Production Customer',
            description: 'Hospital is 100% active, receiving appointments, and live on patient search.',
            sequence: 8,
            stageType: 'ACTIVE',
            isInitial: false,
            isTerminal: true,
            status: 'ACTIVE',
            requirements: []
          }
        ],
        transitions: [
          {
            id: 'TR-HOSP-01-02',
            workflowId: 'WF-DEF-HOSPITAL-01',
            fromStageId: 'STG-HOSP-01',
            toStageId: 'STG-HOSP-02',
            transitionCode: 'QUALIFY_LEAD_TO_COMMERCIAL',
            name: 'Qualify Hospital Lead',
            status: 'ACTIVE'
          },
          {
            id: 'TR-HOSP-02-03',
            workflowId: 'WF-DEF-HOSPITAL-01',
            fromStageId: 'STG-HOSP-02',
            toStageId: 'STG-HOSP-03',
            transitionCode: 'SUBMIT_FOR_FINANCE_APPROVAL',
            name: 'Submit Quote to Finance',
            approvalRequired: true,
            requiredApprovalRoles: ['FINANCE_MANAGER'],
            status: 'ACTIVE'
          },
          {
            id: 'TR-HOSP-03-04',
            workflowId: 'WF-DEF-HOSPITAL-01',
            fromStageId: 'STG-HOSP-03',
            toStageId: 'STG-HOSP-04',
            transitionCode: 'FINANCE_APPROVED_TO_COMPLIANCE',
            name: 'Finance Approved $\rightarrow$ Compliance KYC',
            status: 'ACTIVE'
          },
          {
            id: 'TR-HOSP-04-05',
            workflowId: 'WF-DEF-HOSPITAL-01',
            fromStageId: 'STG-HOSP-04',
            toStageId: 'STG-HOSP-05',
            transitionCode: 'COMPLIANCE_VERIFIED_TO_PROVISIONING',
            name: 'Verify KYC & Provision Tenant',
            actions: [
              {
                id: 'ACT-01',
                actionType: 'CREATE_TENANT',
                name: 'Create Hospital Tenant Cloud Partition',
                configuration: { region: 'ap-south-1' },
                executionOrder: 1
              },
              {
                id: 'ACT-02',
                actionType: 'PROVISION_ABDM_HFR',
                name: 'Provision National Health Facility Registry (HFR) Node',
                configuration: { autoRegisterHfr: true },
                executionOrder: 2
              }
            ],
            status: 'ACTIVE'
          },
          {
            id: 'TR-HOSP-05-06',
            workflowId: 'WF-DEF-HOSPITAL-01',
            fromStageId: 'STG-HOSP-05',
            toStageId: 'STG-HOSP-06',
            transitionCode: 'PROVISIONING_TO_ONBOARDING',
            name: 'Begin Department Setup',
            status: 'ACTIVE'
          },
          {
            id: 'TR-HOSP-06-07',
            workflowId: 'WF-DEF-HOSPITAL-01',
            fromStageId: 'STG-HOSP-06',
            toStageId: 'STG-HOSP-07',
            transitionCode: 'DEPARTMENTS_CONFIGURED_TO_GATE',
            name: 'Ready for Go-Live Gate',
            status: 'ACTIVE'
          },
          {
            id: 'TR-HOSP-07-08',
            workflowId: 'WF-DEF-HOSPITAL-01',
            fromStageId: 'STG-HOSP-07',
            toStageId: 'STG-HOSP-08',
            transitionCode: 'LAUNCH_HOSPITAL_LIVE',
            name: '🚀 Launch Hospital Go-Live',
            actions: [
              {
                id: 'ACT-03',
                actionType: 'ACTIVATE_MODULE',
                name: 'Activate Live Patient Booking & EMR',
                configuration: { modules: ['OPD', 'IPD', 'EMR', 'BILLING'] },
                executionOrder: 1
              },
              {
                id: 'ACT-04',
                actionType: 'SEND_NOTIFICATION',
                name: 'Notify Medical Superintendent & DocSearch HQ',
                configuration: { channel: 'WHATSAPP_AND_EMAIL' },
                executionOrder: 2
              }
            ],
            status: 'ACTIVE'
          }
        ]
      }
    ]
  },

  // ============================================================
  // WORKFLOW 2: PATHOLOGY LIFECYCLE (PATHOLOGY_LIFECYCLE_V1)
  // ============================================================
  {
    id: 'WF-DEF-PATHOLOGY-02',
    code: 'PATHOLOGY_LIFECYCLE',
    name: 'Diagnostic Pathology & Molecular Lab Lifecycle',
    description: 'Dynamic lifecycle for NABL Pathology Centers and Diagnostic Chains.',
    entityType: 'PARTNER_ORGANIZATION',
    organizationType: 'PATHOLOGY',
    activeVersion: 1,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    versions: [
      {
        id: 'WF-VER-PATH-02-V1',
        workflowId: 'WF-DEF-PATHOLOGY-02',
        version: 1,
        status: 'ACTIVE',
        effectiveFrom: '2026-01-01T00:00:00Z',
        changeSummary: 'Pathology Workflow with NABL ISO 15189 and Analyzer HL7 Bridge',
        createdAt: '2026-01-01T00:00:00Z',
        createdBy: 'CHIEF_LAB_OFFICER',
        stages: [
          {
            id: 'STG-PATH-01',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            code: 'LEAD_INGESTION',
            name: '1. Lab Inquiry & Lead Capture',
            description: 'Pathology diagnostic center onboarding inquiry.',
            sequence: 1,
            stageType: 'INITIAL',
            isInitial: true,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-PATH-01-01',
                stageId: 'STG-PATH-01',
                requirementCode: 'PATHOLOGY_PROFILE_DOC',
                name: 'Lab Profile & NABL Declaration',
                requirementType: 'DOCUMENT',
                configuration: { allowedTypes: ['PDF'] },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-PATH-02',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            code: 'COMMERCIAL_OFFER',
            name: '2. Diagnostic Plan & Offer Selection',
            description: 'Select Pathology LIMS plan and test menu addons.',
            sequence: 2,
            stageType: 'COMMERCIAL',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-PATH-02-01',
                stageId: 'STG-PATH-02',
                requirementCode: 'PATHOLOGY_PAYMENT_PROOF',
                name: 'Subscription Payment Confirmation',
                requirementType: 'PAYMENT',
                configuration: { gateway: 'RAZORPAY_UPI' },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-PATH-03',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            code: 'REGULATORY_COMPLIANCE',
            name: '3. NABL ISO 15189 & Pathologist Licence',
            description: 'Validation of NABL Accreditation and MD Pathologist registration.',
            sequence: 3,
            stageType: 'COMPLIANCE',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-PATH-03-01',
                stageId: 'STG-PATH-03',
                requirementCode: 'NABL_ISO_LICENCE',
                name: 'NABL ISO 15189 Lab Accreditation',
                requirementType: 'LICENCE',
                configuration: { licenceType: 'NABL_ISO_15189', checkExpiry: true },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              },
              {
                id: 'REQ-PATH-03-02',
                stageId: 'STG-PATH-03',
                requirementCode: 'CHIEF_PATHOLOGIST_NMC',
                name: 'Chief Pathologist Medical Council Reg',
                requirementType: 'DOCUMENT',
                configuration: { council: 'NMC' },
                isRequired: true,
                order: 2,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-PATH-04',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            code: 'LAB_PROVISIONING',
            name: '4. LIMS Tenant & Analyzer IoT Bridge',
            description: 'Provisioning LIMS and Roche/Beckman HL7 telemetry connection.',
            sequence: 4,
            stageType: 'PROVISIONING',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: []
          },
          {
            id: 'STG-PATH-05',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            code: 'GO_LIVE_GATE',
            name: '5. Lab Go-Live Readiness Gate',
            description: 'Verify sample barcodes, test templates, and panic sirens.',
            sequence: 5,
            stageType: 'GO_LIVE_GATE',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: []
          },
          {
            id: 'STG-PATH-06',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            code: 'ACTIVE_CUSTOMER',
            name: '6. Active Production Diagnostic Lab',
            description: 'Live pathology center booking home collections & generating PDF reports.',
            sequence: 6,
            stageType: 'ACTIVE',
            isInitial: false,
            isTerminal: true,
            status: 'ACTIVE',
            requirements: []
          }
        ],
        transitions: [
          {
            id: 'TR-PATH-01-02',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            fromStageId: 'STG-PATH-01',
            toStageId: 'STG-PATH-02',
            transitionCode: 'LEAD_TO_COMMERCIAL_PATH',
            name: 'Proceed to Lab Commercial Plan',
            status: 'ACTIVE'
          },
          {
            id: 'TR-PATH-02-03',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            fromStageId: 'STG-PATH-02',
            toStageId: 'STG-PATH-03',
            transitionCode: 'PAYMENT_TO_NABL_VERIF',
            name: 'Submit for NABL Compliance Verification',
            status: 'ACTIVE'
          },
          {
            id: 'TR-PATH-03-04',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            fromStageId: 'STG-PATH-03',
            toStageId: 'STG-PATH-04',
            transitionCode: 'NABL_VERIFIED_TO_LIMS_SETUP',
            name: 'NABL Approved $\rightarrow$ Provision LIMS Bridge',
            actions: [
              {
                id: 'ACT-PATH-01',
                actionType: 'CREATE_TENANT',
                name: 'Provision Diagnostic Lab LIMS Cloud',
                configuration: { type: 'PATHOLOGY' },
                executionOrder: 1
              }
            ],
            status: 'ACTIVE'
          },
          {
            id: 'TR-PATH-04-05',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            fromStageId: 'STG-PATH-04',
            toStageId: 'STG-PATH-05',
            transitionCode: 'LIMS_CONFIGURED_TO_GATE',
            name: 'Validate Lab Test Menu Gate',
            status: 'ACTIVE'
          },
          {
            id: 'TR-PATH-05-06',
            workflowId: 'WF-DEF-PATHOLOGY-02',
            fromStageId: 'STG-PATH-05',
            toStageId: 'STG-PATH-06',
            transitionCode: 'LAUNCH_PATHOLOGY_LIVE',
            name: '🚀 Launch Pathology Center Live',
            actions: [
              {
                id: 'ACT-PATH-02',
                actionType: 'ACTIVATE_MODULE',
                name: 'Activate Live Phlebotomy & Report Generation',
                configuration: { modules: ['PATHOLOGY_LIMS', 'HOME_COLLECTION'] },
                executionOrder: 1
              }
            ],
            status: 'ACTIVE'
          }
        ]
      }
    ]
  },

  // ============================================================
  // WORKFLOW 3: PHARMACY LIFECYCLE (PHARMACY_LIFECYCLE_V1)
  // ============================================================
  {
    id: 'WF-DEF-PHARMACY-03',
    code: 'PHARMACY_LIFECYCLE',
    name: 'Retail & Hospital Pharmacy Chain Lifecycle',
    description: 'Dynamic lifecycle for Pharmacy outlets and Wholesale Drug Distributors.',
    entityType: 'PARTNER_ORGANIZATION',
    organizationType: 'PHARMACY',
    activeVersion: 1,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    versions: [
      {
        id: 'WF-VER-PHARM-03-V1',
        workflowId: 'WF-DEF-PHARMACY-03',
        version: 1,
        status: 'ACTIVE',
        effectiveFrom: '2026-01-01T00:00:00Z',
        changeSummary: 'Pharmacy Lifecycle Workflow with Form 20/21 Drug Licence',
        createdAt: '2026-01-01T00:00:00Z',
        createdBy: 'DIRECTOR_PHARMA_SERVICES',
        stages: [
          {
            id: 'STG-PHARM-01',
            workflowId: 'WF-DEF-PHARMACY-03',
            code: 'LEAD_INGESTION',
            name: '1. Pharmacy Lead Registration',
            description: 'Capture pharmacy store location and primary contact.',
            sequence: 1,
            stageType: 'INITIAL',
            isInitial: true,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: []
          },
          {
            id: 'STG-PHARM-02',
            workflowId: 'WF-DEF-PHARMACY-03',
            code: 'REGULATORY_COMPLIANCE',
            name: '2. State Drug Licence Form 20/21 Verification',
            description: 'Validation of Retail Drug Sale Licence and Registered Pharmacist.',
            sequence: 2,
            stageType: 'COMPLIANCE',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-PHARM-02-01',
                stageId: 'STG-PHARM-02',
                requirementCode: 'DRUG_SALE_LICENCE_FORM20',
                name: 'State Drug Licence Form 20/21',
                requirementType: 'LICENCE',
                configuration: { licenceType: 'DRUG_LICENCE_20_21', checkExpiry: true },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              },
              {
                id: 'REQ-PHARM-02-02',
                stageId: 'STG-PHARM-02',
                requirementCode: 'REGISTERED_PHARMACIST_CERT',
                name: 'Registered Pharmacist State Council Certificate',
                requirementType: 'DOCUMENT',
                configuration: { checkRegistration: true },
                isRequired: true,
                order: 2,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-PHARM-03',
            workflowId: 'WF-DEF-PHARMACY-03',
            code: 'STORE_ONBOARDING',
            name: '3. Inventory & Medicine Master Configuration',
            description: 'Setup store inventory, batch barcode scanner, and POS billing.',
            sequence: 3,
            stageType: 'ONBOARDING',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: [
              {
                id: 'REQ-PHARM-03-01',
                stageId: 'STG-PHARM-03',
                requirementCode: 'MEDICINE_CATALOG_CONFIGURED',
                name: 'Pharmacy Medicine Catalog & GST Rates Mapped',
                requirementType: 'CONFIGURATION',
                configuration: { minStockItems: 10 },
                isRequired: true,
                order: 1,
                status: 'ACTIVE'
              }
            ]
          },
          {
            id: 'STG-PHARM-04',
            workflowId: 'WF-DEF-PHARMACY-03',
            code: 'GO_LIVE_GATE',
            name: '4. Pharmacy Go-Live Gate',
            description: 'Final readiness evaluation before taking prescription orders.',
            sequence: 4,
            stageType: 'GO_LIVE_GATE',
            isInitial: false,
            isTerminal: false,
            status: 'ACTIVE',
            requirements: []
          },
          {
            id: 'STG-PHARM-05',
            workflowId: 'WF-DEF-PHARMACY-03',
            code: 'ACTIVE_CUSTOMER',
            name: '5. Active Production Pharmacy Outlet',
            description: 'Live pharmacy accepting e-prescriptions and 30-minute home delivery.',
            sequence: 5,
            stageType: 'ACTIVE',
            isInitial: false,
            isTerminal: true,
            status: 'ACTIVE',
            requirements: []
          }
        ],
        transitions: [
          {
            id: 'TR-PHARM-01-02',
            workflowId: 'WF-DEF-PHARMACY-03',
            fromStageId: 'STG-PHARM-01',
            toStageId: 'STG-PHARM-02',
            transitionCode: 'LEAD_TO_DRUG_LICENCE_KYC',
            name: 'Submit for Drug Authority KYC',
            status: 'ACTIVE'
          },
          {
            id: 'TR-PHARM-02-03',
            workflowId: 'WF-DEF-PHARMACY-03',
            fromStageId: 'STG-PHARM-02',
            toStageId: 'STG-PHARM-03',
            transitionCode: 'DRUG_LICENCE_VERIFIED_TO_STORE',
            name: 'Licence Verified $\rightarrow$ Setup Inventory Store',
            actions: [
              {
                id: 'ACT-PHARM-01',
                actionType: 'CREATE_TENANT',
                name: 'Create Pharmacy POS Partition',
                configuration: { type: 'PHARMACY' },
                executionOrder: 1
              }
            ],
            status: 'ACTIVE'
          },
          {
            id: 'TR-PHARM-03-04',
            workflowId: 'WF-DEF-PHARMACY-03',
            fromStageId: 'STG-PHARM-03',
            toStageId: 'STG-PHARM-04',
            transitionCode: 'STORE_CONFIGURED_TO_GATE',
            name: 'Ready for Pharmacy Go-Live Gate',
            status: 'ACTIVE'
          },
          {
            id: 'TR-PHARM-04-05',
            workflowId: 'WF-DEF-PHARMACY-03',
            fromStageId: 'STG-PHARM-04',
            toStageId: 'STG-PHARM-05',
            transitionCode: 'LAUNCH_PHARMACY_LIVE',
            name: '🚀 Launch Pharmacy Store Live',
            actions: [
              {
                id: 'ACT-PHARM-02',
                actionType: 'ACTIVATE_MODULE',
                name: 'Enable WhatsApp Rx Fulfillments & Express Delivery',
                configuration: { modules: ['PHARMACY_POS', 'HOME_DELIVERY'] },
                executionOrder: 1
              }
            ],
            status: 'ACTIVE'
          }
        ]
      }
    ]
  }
];

// ============================================================
// DYNAMIC OFFERS SEEDS
// ============================================================
export const SEED_DYNAMIC_OFFERS: DynamicOfferDto[] = [
  {
    id: 'OFFER-01',
    code: 'NEW_HOSPITAL_20',
    name: 'New Multi-Speciality Hospital Onboarding Discount',
    description: '20% off for newly registered hospitals onboarding 5+ departments.',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    eligibilityRule: {
      logicalOperator: 'AND',
      conditions: [
        { field: 'customer.is_new', operator: 'IS_TRUE' },
        { field: 'organization.type', operator: 'EQUALS', value: 'HOSPITAL' }
      ]
    },
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    usageLimit: 500,
    currentUsageCount: 42,
    status: 'ACTIVE'
  },
  {
    id: 'OFFER-02',
    code: 'LAB_EQUIP_15',
    name: 'Pathology Center Equipment Booster',
    description: '15% off for diagnostic labs integrating 2+ auto-analyzers.',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    eligibilityRule: {
      logicalOperator: 'AND',
      conditions: [
        { field: 'organization.type', operator: 'EQUALS', value: 'PATHOLOGY' }
      ]
    },
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    usageLimit: 300,
    currentUsageCount: 18,
    status: 'ACTIVE'
  },
  {
    id: 'OFFER-03',
    code: 'EARLY_BIRD_10',
    name: 'Annual Subscription Early Bird 10%',
    description: '10% discount on all annual enterprise subscription tiers.',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    eligibilityRule: {
      logicalOperator: 'AND',
      conditions: [
        { field: 'plan.frequency', operator: 'EQUALS', value: 'ANNUAL' }
      ]
    },
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    usageLimit: 1000,
    currentUsageCount: 88,
    status: 'ACTIVE'
  }
];

// ============================================================
// DYNAMIC LICENCE RULES SEEDS
// ============================================================
export const SEED_LICENCE_RULES: DynamicLicenceRuleDto[] = [
  {
    id: 'LIC-RULE-01',
    organizationType: 'HOSPITAL',
    licenceTypeCode: 'HOSPITAL_CEA',
    licenceTypeName: 'State Clinical Establishment Act (CEA) Registration',
    issuingAuthority: 'State Directorate of Health Services',
    isMandatory: true,
    verificationRequired: true,
    expiryCheckRequired: true,
    warningThresholdDays: [90, 60, 30, 7],
    gracePeriodDays: 30,
    renewalWindowDays: 90,
    status: 'ACTIVE'
  },
  {
    id: 'LIC-RULE-02',
    organizationType: 'PATHOLOGY',
    licenceTypeCode: 'NABL_ISO_15189',
    licenceTypeName: 'NABL Accreditation ISO 15189:2022',
    issuingAuthority: 'National Accreditation Board for Testing and Calibration Laboratories',
    isMandatory: true,
    verificationRequired: true,
    expiryCheckRequired: true,
    warningThresholdDays: [90, 60, 30, 7],
    gracePeriodDays: 45,
    renewalWindowDays: 120,
    status: 'ACTIVE'
  },
  {
    id: 'LIC-RULE-03',
    organizationType: 'PHARMACY',
    licenceTypeCode: 'DRUG_LICENCE_20_21',
    licenceTypeName: 'Retail Drug Sale Licence Form 20/21',
    issuingAuthority: 'State Drugs Control Department (CDSCO)',
    isMandatory: true,
    verificationRequired: true,
    expiryCheckRequired: true,
    warningThresholdDays: [90, 60, 30, 7],
    gracePeriodDays: 15,
    renewalWindowDays: 60,
    status: 'ACTIVE'
  }
];
