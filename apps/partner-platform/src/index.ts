/**
 * Phase 2: Partner / Clinic / Hospital Platform
 *
 * Scope: Clinical & Healthcare Operations:
 * - Hospital / Clinic Management
 * - Organization / Branch Setup
 * - Doctors, Reception, Nurses, Staff
 * - Patients, Appointments, Queue
 * - Consultation, Digital Prescription, EMR / EHR
 * - Laboratory, Pharmacy, Hospital Billing
 * - Reports, Hospital Analytics, Staff Permissions
 *
 * Boundary Notice: This application NEVER imports company-platform internal governance code.
 */

import { createLogger } from '@docsearch/shared-core';

export const partnerPlatformLogger = createLogger('partner-platform');

export const PHASE_2_CLINICAL_DOMAINS = [
  'HOSPITAL_CLINIC_MANAGEMENT',
  'ORGANIZATION_BRANCH',
  'DOCTORS_AND_STAFF',
  'RECEPTION_AND_QUEUE',
  'PATIENT_RECORDS',
  'APPOINTMENTS',
  'CONSULTATION_AND_RX',
  'EMR_EHR',
  'LABORATORY',
  'PHARMACY',
  'HOSPITAL_BILLING',
  'FACILITY_ANALYTICS',
  'STAFF_PERMISSIONS'
] as const;

export type Phase2ClinicalDomain = (typeof PHASE_2_CLINICAL_DOMAINS)[number];

export function getClinicalDomainInfo(): {
  platform: string;
  domainCount: number;
  domains: readonly Phase2ClinicalDomain[];
} {
  return {
    platform: 'Doc Search - Partner / Hospital Platform',
    domainCount: PHASE_2_CLINICAL_DOMAINS.length,
    domains: PHASE_2_CLINICAL_DOMAINS
  };
}

// Phase 2.1: Partner & Organization Foundation Exports
export * from './services/mock-partner-foundation-data.js';
export * from './services/partner-foundation-service.js';
export * from './components/common/PanelContextSwitcher.js';
export * from './components/dialogs/PartnerCreateDialog.js';
export * from './components/dialogs/PartnerStatusDialog.js';
export * from './components/dialogs/OrganizationCreateDialog.js';
export * from './components/dialogs/FacilityCreateDialog.js';
export * from './components/views/PartnerOverviewView.js';
export * from './components/views/PartnerDirectoryView.js';
export * from './components/views/OrganizationOverviewView.js';
export * from './components/views/OrganizationDirectoryView.js';
export * from './components/views/FacilityOverviewView.js';
export * from './components/views/FacilityDirectoryView.js';
export * from './components/views/SubscriptionEntitlementView.js';
export * from './components/views/OperationalAuditTraceView.js';
export * from './components/PartnerFoundationDomainManager.js';
export * from './components/PartnerPlatformShell.js';

// Phase 2.2: Staff Administration & Department Hierarchy Exports
export * from './services/mock-staff-administration-data.js';
export * from './services/staff-administration-service.js';
export * from './components/dialogs/CreateDepartmentDialog.js';
export * from './components/dialogs/EditDepartmentDialog.js';
export * from './components/dialogs/CreateStaffDialog.js';
export * from './components/dialogs/EditStaffDialog.js';
export * from './components/dialogs/ChangeStaffStatusDialog.js';
export * from './components/dialogs/AssignRoleDialog.js';
export * from './components/dialogs/AddCredentialDialog.js';
export * from './components/dialogs/VerifyCredentialDialog.js';
export * from './components/dialogs/TransferStaffDialog.js';
export * from './components/views/StaffOverviewView.js';
export * from './components/views/StaffDirectoryView.js';
export * from './components/views/StaffProfileView.js';
export * from './components/views/DepartmentHierarchyView.js';
export * from './components/views/RoleScopeView.js';
export * from './components/views/CredentialCenterView.js';
export * from './components/views/StaffTransfersView.js';
export * from './components/views/StaffAuditVaultView.js';
export * from './components/StaffAdministrationDomainManager.js';

// Phase 2.3: Doctor & OPD Roster Management Exports
export * from './services/mock-doctor-roster-data.js';
export * from './services/doctor-roster-service.js';
export * from './components/dialogs/CreateDoctorProfileDialog.js';
export * from './components/dialogs/EditDoctorProfileDialog.js';
export * from './components/dialogs/AddSpecializationDialog.js';
export * from './components/dialogs/CreateScheduleDialog.js';
export * from './components/dialogs/AddDoctorLeaveDialog.js';
export * from './components/dialogs/BlockSlotDialog.js';
export * from './components/dialogs/ConfigureFeeDialog.js';
export * from './components/dialogs/AssignDoctorLocationDialog.js';
export * from './components/views/DoctorOverviewView.js';
export * from './components/views/DoctorDirectoryView.js';
export * from './components/views/DoctorProfileView.js';
export * from './components/views/OpdRosterView.js';
export * from './components/views/ScheduleManagerView.js';
export * from './components/views/LeaveCalendarView.js';
export * from './components/views/OpdSlotManagerView.js';
export * from './components/views/ConsultationFeeMatrixView.js';
export * from './components/views/DoctorAuditVaultView.js';
export * from './components/DoctorRosterDomainManager.js';

// Phase 2.4: Patient Registration & Master Patient Index (MPI) Exports
export * from './services/mock-patient-registration-data.js';
export * from './services/patient-registration-service.js';
export * from './components/dialogs/CreatePatientDialog.js';
export * from './components/dialogs/EditPatientDialog.js';
export * from './components/dialogs/AddIdentifierDialog.js';
export * from './components/dialogs/AddEmergencyContactDialog.js';
export * from './components/dialogs/AddConsentDialog.js';
export * from './components/dialogs/AddInsuranceDialog.js';
export * from './components/dialogs/DuplicateReviewDialog.js';
export * from './components/dialogs/MergePatientDialog.js';
export * from './components/views/PatientOverviewView.js';
export * from './components/views/PatientDirectoryView.js';
export * from './components/views/PatientSearchView.js';
export * from './components/views/PatientProfileView.js';
export * from './components/views/PatientIdentifierCenterView.js';
export * from './components/views/EmergencyContactCenterView.js';
export * from './components/views/ConsentCenterView.js';
export * from './components/views/InsuranceCenterView.js';
export * from './components/views/DuplicateReviewCenterView.js';
export * from './components/views/PatientMergeHistoryView.js';
export * from './components/views/PatientAuditVaultView.js';
export * from './components/PatientRegistrationDomainManager.js';

// Phase 2.5: Encounter & Visit Management Exports
export * from './services/mock-encounter-data.js';
export * from './services/encounter-service.js';
export * from './components/dialogs/CreateEncounterDialog.js';
export * from './components/dialogs/CheckInEncounterDialog.js';
export * from './components/dialogs/AssignDoctorDialog.js';
export * from './components/dialogs/ChangeEncounterStatusDialog.js';
export * from './components/dialogs/CancelEncounterDialog.js';
export * from './components/dialogs/ReferEncounterDialog.js';
export * from './components/dialogs/ReassignEncounterDialog.js';
export * from './components/views/EncounterOverviewView.js';
export * from './components/views/EncounterDirectoryView.js';
export * from './components/views/ReceptionCheckInView.js';
export * from './components/views/OpdQueueView.js';
export * from './components/views/EncounterProfileView.js';
export * from './components/views/DoctorWorklistView.js';
export * from './components/views/EncounterHistoryView.js';
export * from './components/views/ReferralCenterView.js';
export * from './components/views/EncounterAuditVaultView.js';
// Phase 2.6: Clinical Consultation & Medical Documentation (EMR) Exports
export * from './services/mock-clinical-consultation-data.js';
export * from './services/clinical-consultation-service.js';
export * from './components/dialogs/StartConsultationDialog.js';
export * from './components/dialogs/SaveConsultationDraftDialog.js';
export * from './components/dialogs/AddVitalsDialog.js';
export * from './components/dialogs/AddDiagnosisDialog.js';
export * from './components/dialogs/AddMedicationDialog.js';
export * from './components/dialogs/EditMedicationDialog.js';
export * from './components/dialogs/AddInstructionDialog.js';
export * from './components/dialogs/CreateFollowUpPlanDialog.js';
export * from './components/dialogs/CompleteConsultationDialog.js';
export * from './components/dialogs/AmendConsultationDialog.js';
export * from './components/views/ConsultationOverviewView.js';
export * from './components/views/ConsultationDoctorWorklistView.js';
export * from './components/views/ClinicalConsultationView.js';
export * from './components/views/PatientClinicalTimelineView.js';
export * from './components/views/DiagnosisCenterView.js';
export * from './components/views/PrescriptionCenterView.js';
export * from './components/views/FollowUpPlanView.js';
export * from './components/views/ConsultationAuditVaultView.js';
export * from './components/ClinicalConsultationDomainManager.js';

// Phase 2.7: Clinical Orders, Laboratory & Diagnostic Investigation Management Exports
export * from './services/mock-clinical-investigation-data.js';
export * from './services/clinical-investigation-service.js';
export * from './components/dialogs/CreateInvestigationOrderDialog.js';
export * from './components/dialogs/SelectInvestigationDialog.js';
export * from './components/dialogs/CreateInvestigationPanelDialog.js';
export * from './components/dialogs/CollectSpecimenDialog.js';
export * from './components/dialogs/RejectSpecimenDialog.js';
export * from './components/dialogs/EnterInvestigationResultDialog.js';
export * from './components/dialogs/VerifyInvestigationResultDialog.js';
export * from './components/dialogs/FinalizeInvestigationReportDialog.js';
export * from './components/dialogs/ReviewInvestigationResultDialog.js';
export * from './components/dialogs/AmendInvestigationResultDialog.js';
export * from './components/dialogs/CancelInvestigationOrderDialog.js';
export * from './components/views/InvestigationOverviewView.js';
export * from './components/views/InvestigationCatalogView.js';
export * from './components/views/InvestigationOrderDirectoryView.js';
export * from './components/views/SpecimenCollectionView.js';
export * from './components/views/InvestigationProcessingView.js';
export * from './components/views/InvestigationResultView.js';
export * from './components/views/InvestigationReportView.js';
export * from './components/views/PhysicianInvestigationReviewView.js';
export * from './components/views/PatientInvestigationHistoryView.js';
export * from './components/views/CriticalResultCenterView.js';
export * from './components/views/InvestigationAuditVaultView.js';
export * from './components/ClinicalInvestigationDomainManager.js';

// Phase 2.8: Pharmacy, Medication Dispensing & Inventory Management Exports
export * from './services/mock-pharmacy-data.js';
export * from './services/pharmacy-management-service.js';
export * from './components/dialogs/CreateMedicationDialog.js';
export * from './components/dialogs/ReceiveStockDialog.js';
export * from './components/dialogs/VerifyPrescriptionDialog.js';
export * from './components/dialogs/ReserveStockDialog.js';
export * from './components/dialogs/DispenseMedicationDialog.js';
export * from './components/dialogs/PartialDispenseDialog.js';
export * from './components/dialogs/SubstituteMedicationDialog.js';
export * from './components/dialogs/ApproveSubstitutionDialog.js';
export * from './components/dialogs/ReturnMedicationDialog.js';
export * from './components/dialogs/StockAdjustmentDialog.js';
export * from './components/dialogs/TransferStockDialog.js';
export * from './components/dialogs/BlockBatchDialog.js';
export * from './components/dialogs/UnblockBatchDialog.js';
export * from './components/dialogs/ReverseDispensingDialog.js';
export * from './components/dialogs/CancelPrescriptionDialog.js';
export * from './components/views/PharmacyOverviewView.js';
export * from './components/views/MedicationCatalogView.js';
export * from './components/views/PharmacyPrescriptionQueueView.js';
export * from './components/views/PrescriptionVerificationView.js';
export * from './components/views/DispensingWorkbenchView.js';
export * from './components/views/InventoryManagementView.js';
export * from './components/views/BatchExpiryView.js';
export * from './components/views/StockMovementLedgerView.js';
export * from './components/views/ReturnsAndAdjustmentsView.js';
export * from './components/views/PatientMedicationHistoryView.js';
export * from './components/views/PharmacyReportsView.js';
export * from './components/views/PharmacyAuditVaultView.js';
export * from './components/PharmacyDomainManager.js';

// Phase 2.9: Billing, Charges, Payments & Revenue Cycle Management (RCM) Exports
export * from './services/mock-billing-data.js';
export * from './services/billing-management-service.js';
export * from './components/dialogs/CreateServiceCatalogDialog.js';
export * from './components/dialogs/CreatePriceListDialog.js';
export * from './components/dialogs/CaptureChargeDialog.js';
export * from './components/dialogs/CreateInvoiceDialog.js';
export * from './components/dialogs/FinalizeInvoiceDialog.js';
export * from './components/dialogs/ApplyDiscountDialog.js';
export * from './components/dialogs/RecordPaymentDialog.js';
export * from './components/dialogs/AllocatePaymentDialog.js';
export * from './components/dialogs/IssueReceiptDialog.js';
export * from './components/dialogs/RequestRefundDialog.js';
export * from './components/dialogs/ApproveRefundDialog.js';
export * from './components/dialogs/ProcessRefundDialog.js';
export * from './components/dialogs/CreateCreditNoteDialog.js';
export * from './components/dialogs/CreateDebitAdjustmentDialog.js';
export * from './components/dialogs/OpenCashierSessionDialog.js';
export * from './components/dialogs/CloseCashierSessionDialog.js';
export * from './components/dialogs/ReconcileCashierSessionDialog.js';
export * from './components/dialogs/CancelInvoiceDialog.js';
export * from './components/views/BillingOverviewView.js';
export * from './components/views/BillingChargeDirectoryView.js';
export * from './components/views/InvoiceDirectoryView.js';
export * from './components/views/InvoiceDetailView.js';
export * from './components/views/PaymentCollectionView.js';
export * from './components/views/OutstandingReceivablesView.js';
export * from './components/views/RefundManagementView.js';
export * from './components/views/CashierSessionView.js';
export * from './components/views/PricingCatalogView.js';
export * from './components/views/RevenueAnalyticsView.js';
export * from './components/views/PatientBillingHistoryView.js';
export * from './components/views/BillingAuditVaultView.js';
export * from './components/BillingDomainManager.js';

// Phase 2.10: Insurance, TPA, Claims & Third-Party Payer Management Exports
export * from './services/mock-insurance-claims-data.js';
export * from './services/insurance-claims-management-service.js';
export * from './components/dialogs/CreatePayerDialog.js';
export * from './components/dialogs/CreateInsurancePlanDialog.js';
export * from './components/dialogs/RegisterPatientPolicyDialog.js';
export * from './components/dialogs/VerifyEligibilityDialog.js';
export * from './components/dialogs/CreateAuthorizationDialog.js';
export * from './components/dialogs/SubmitAuthorizationDialog.js';
export * from './components/dialogs/ApproveAuthorizationDialog.js';
export * from './components/dialogs/DenyAuthorizationDialog.js';
export * from './components/dialogs/CreateClaimDialog.js';
export * from './components/dialogs/ValidateClaimDialog.js';
export * from './components/dialogs/SubmitClaimDialog.js';
export * from './components/dialogs/AdjudicateClaimDialog.js';
export * from './components/dialogs/RecordClaimDenialDialog.js';
export * from './components/dialogs/CreateClaimAppealDialog.js';
export * from './components/dialogs/ResolveClaimAppealDialog.js';
export * from './components/dialogs/RecordSettlementDialog.js';
export * from './components/dialogs/ReconcileSettlementDialog.js';
export * from './components/dialogs/AmendClaimDialog.js';
export * from './components/dialogs/CancelClaimDialog.js';
export * from './components/views/InsuranceOverviewView.js';
export * from './components/views/PayerDirectoryView.js';
export * from './components/views/InsurancePlanCatalogView.js';
export * from './components/views/PatientInsuranceView.js';
export * from './components/views/EligibilityWorkbenchView.js';
export * from './components/views/AuthorizationWorkbenchView.js';
export * from './components/views/ClaimDirectoryView.js';
export * from './components/views/ClaimDetailView.js';
export * from './components/views/ClaimSubmissionWorkbenchView.js';
export * from './components/views/ClaimAdjudicationView.js';
export * from './components/views/ClaimDenialManagementView.js';
export * from './components/views/ClaimAppealsView.js';
export * from './components/views/SettlementManagementView.js';
export * from './components/views/InsuranceReconciliationView.js';
export * from './components/views/InsuranceReportsView.js';
export * from './components/views/InsuranceAuditVaultView.js';
export * from './components/views/PatientInsuranceHistoryView.js';
export * from './components/views/RevenueCycleInsuranceView.js';
export * from './components/InsuranceClaimsDomainManager.js';

// Phase 2.11: Procurement, Supply Chain & Vendor Management Exports
export * from './services/mock-procurement-data.js';
export * from './services/procurement-management-service.js';
export * from './components/dialogs/CreateVendorDialog.js';
export * from './components/dialogs/EditVendorDialog.js';
export * from './components/dialogs/SuspendVendorDialog.js';
export * from './components/dialogs/CreateVendorContractDialog.js';
export * from './components/dialogs/CreateProcurementItemDialog.js';
export * from './components/dialogs/CreatePurchaseRequisitionDialog.js';
export * from './components/dialogs/ApprovePurchaseRequisitionDialog.js';
export * from './components/dialogs/RejectPurchaseRequisitionDialog.js';
export * from './components/dialogs/CreatePurchaseOrderDialog.js';
export * from './components/dialogs/ApprovePurchaseOrderDialog.js';
export * from './components/dialogs/SendPurchaseOrderDialog.js';
export * from './components/dialogs/CancelPurchaseOrderDialog.js';
export * from './components/dialogs/CreateGoodsReceiptDialog.js';
export * from './components/dialogs/InspectGoodsReceiptDialog.js';
export * from './components/dialogs/CreateVendorReturnDialog.js';
export * from './components/dialogs/ApproveVendorReturnDialog.js';
export * from './components/dialogs/CreatePurchaseInvoiceDialog.js';
export * from './components/dialogs/MatchPurchaseInvoiceDialog.js';
export * from './components/dialogs/ResolveProcurementExceptionDialog.js';
export * from './components/dialogs/CreateEmergencyPurchaseDialog.js';
export * from './components/views/ProcurementOverviewView.js';
export * from './components/views/VendorDirectoryView.js';
export * from './components/views/VendorDetailView.js';
export * from './components/views/VendorContractsView.js';
export * from './components/views/ProcurementCatalogView.js';
export * from './components/views/PurchaseRequisitionView.js';
export * from './components/views/ProcurementApprovalWorkbenchView.js';
export * from './components/views/PurchaseOrderDirectoryView.js';
export * from './components/views/PurchaseOrderDetailView.js';
export * from './components/views/GoodsReceiptView.js';
export * from './components/views/QualityInspectionView.js';
export * from './components/views/VendorReturnsView.js';
export * from './components/views/PurchaseInvoiceMatchingView.js';
export * from './components/views/ProcurementExceptionsView.js';
export * from './components/views/ProcurementPlanningView.js';
export * from './components/views/VendorPerformanceView.js';
export * from './components/views/ProcurementReportsView.js';
export * from './components/views/ProcurementAuditVaultView.js';
export * from './components/views/SpendAnalyticsView.js';
export * from './components/views/ProcurementControlCenterView.js';
export * from './components/ProcurementDomainManager.js';

// Phase 2.12: Inpatient (IPD), Ward & Bed Management (ADT) Exports
export * from './services/mock-inpatient-data.js';
export * from './services/inpatient-management-service.js';
export * from './components/dialogs/CreateWardDialog.js';
export * from './components/dialogs/EditWardDialog.js';
export * from './components/dialogs/CreateBedDialog.js';
export * from './components/dialogs/EditBedDialog.js';
export * from './components/dialogs/BlockBedDialog.js';
export * from './components/dialogs/CreateBedReservationDialog.js';
export * from './components/dialogs/CancelBedReservationDialog.js';
export * from './components/dialogs/CreateAdmissionRequestDialog.js';
export * from './components/dialogs/ApproveAdmissionDialog.js';
export * from './components/dialogs/RejectAdmissionDialog.js';
export * from './components/dialogs/CancelAdmissionDialog.js';
export * from './components/dialogs/AllocateBedDialog.js';
export * from './components/dialogs/CreateTransferDialog.js';
export * from './components/dialogs/ApproveTransferDialog.js';
export * from './components/dialogs/CompleteTransferDialog.js';
export * from './components/dialogs/NursingAssessmentDialog.js';
export * from './components/dialogs/NursingNoteDialog.js';
export * from './components/dialogs/CarePlanDialog.js';
export * from './components/dialogs/RecordVitalDialog.js';
export * from './components/dialogs/DoctorRoundDialog.js';
export * from './components/dialogs/CreateDischargePlanDialog.js';
export * from './components/dialogs/RequestDischargeDialog.js';
export * from './components/dialogs/ApproveDischargeDialog.js';
export * from './components/dialogs/CompleteDischargeDialog.js';
export * from './components/dialogs/FinalizeDischargeSummaryDialog.js';
export * from './components/dialogs/ReleaseBedDialog.js';
export * from './components/dialogs/CompleteCleaningDialog.js';
export * from './components/views/InpatientOverviewView.js';
export * from './components/views/ADTControlCenterView.js';
export * from './components/views/AdmissionRequestView.js';
export * from './components/views/AdmissionDetailView.js';
export * from './components/views/BedManagementView.js';
export * from './components/views/BedAvailabilityView.js';
export * from './components/views/WardDirectoryView.js';
export * from './components/views/WardDetailView.js';
export * from './components/views/BedDetailView.js';
export * from './components/views/NursingStationView.js';
export * from './components/views/PatientCensusView.js';
export * from './components/views/PatientLocationView.js';
export * from './components/views/TransferManagementView.js';
export * from './components/views/TransferDetailView.js';
export * from './components/views/NursingCareView.js';
export * from './components/views/VitalObservationView.js';
export * from './components/views/DoctorRoundsView.js';
export * from './components/views/DischargePlanningView.js';
export * from './components/views/DischargeWorkbenchView.js';
export * from './components/views/DischargeSummaryView.js';
export * from './components/views/BedTurnaroundView.js';
export * from './components/views/BedBlockManagementView.js';
export * from './components/views/IPDAnalyticsView.js';
export * from './components/views/IPDReportsView.js';
export * from './components/views/IPDAuditVaultView.js';
export * from './components/views/BedOccupancyAnalyticsView.js';
export * from './components/InpatientDomainManager.js';

// Phase 2.13: Operation Theatre (OT) & Surgery Management Exports
export * from './services/mock-operation-theatre-data.js';
export * from './services/operation-theatre-management-service.js';
export * from './components/dialogs/CreateOperationTheatreDialog.js';
export * from './components/dialogs/EditOperationTheatreDialog.js';
export * from './components/dialogs/CreateOTRoomDialog.js';
export * from './components/dialogs/CreateSurgicalProcedureDialog.js';
export * from './components/dialogs/CreateSurgeryRequestDialog.js';
export * from './components/dialogs/ApproveSurgeryRequestDialog.js';
export * from './components/dialogs/RejectSurgeryRequestDialog.js';
export * from './components/dialogs/CreatePreOperativeAssessmentDialog.js';
export * from './components/dialogs/CreateSurgicalConsentDialog.js';
export * from './components/dialogs/CreateOTScheduleDialog.js';
export * from './components/dialogs/RescheduleOTDialog.js';
export * from './components/dialogs/AssignSurgicalTeamDialog.js';
export * from './components/dialogs/CompletePreOpChecklistDialog.js';
export * from './components/dialogs/CompleteSafetyChecklistDialog.js';
export * from './components/dialogs/CreateOTTransferDialog.js';
export * from './components/dialogs/CreateAnaesthesiaRecordDialog.js';
export * from './components/dialogs/StartSurgeryDialog.js';
export * from './components/dialogs/CompleteSurgeryDialog.js';
export * from './components/dialogs/CreateOperativeNoteDialog.js';
export * from './components/dialogs/FinalizeOperativeNoteDialog.js';
export * from './components/dialogs/CreateSpecimenDialog.js';
export * from './components/dialogs/CreateImplantRecordDialog.js';
export * from './components/dialogs/RecordConsumableUsageDialog.js';
export * from './components/dialogs/CreatePACURecordDialog.js';
export * from './components/dialogs/CreatePostoperativeTransferDialog.js';
export * from './components/dialogs/CancelSurgeryDialog.js';
export * from './components/dialogs/CreateEmergencySurgeryDialog.js';
export * from './components/dialogs/OverrideOTConflictDialog.js';
export * from './components/views/OTOverviewView.js';
export * from './components/views/OTCommandCenterView.js';
export * from './components/views/OTDirectoryView.js';
export * from './components/views/OTRoomDirectoryView.js';
export * from './components/views/OTRoomDetailView.js';
export * from './components/views/SurgeryRequestView.js';
export * from './components/views/SurgeryRequestDetailView.js';
export * from './components/views/PreOperativeWorkbenchView.js';
export * from './components/views/SurgicalConsentView.js';
export * from './components/views/OTScheduleView.js';
export * from './components/views/SurgicalTeamView.js';
export * from './components/views/PreOpChecklistView.js';
export * from './components/views/SurgicalSafetyChecklistView.js';
export * from './components/views/OTTransferView.js';
export * from './components/views/AnaesthesiaWorkbenchView.js';
export * from './components/views/IntraoperativeWorkbenchView.js';
export * from './components/views/OperativeNotesView.js';
export * from './components/views/SpecimenManagementView.js';
export * from './components/views/ImplantManagementView.js';
export * from './components/views/SurgicalConsumablesView.js';
export * from './components/views/PACURecoveryView.js';
export * from './components/views/PostoperativeTransferView.js';
export * from './components/views/SurgeryCancellationView.js';
export * from './components/views/EmergencyOTView.js';
export * from './components/views/OTUtilizationView.js';
export * from './components/views/SurgicalAnalyticsView.js';
export * from './components/views/OTReportsView.js';
export * from './components/views/OTAuditVaultView.js';
export * from './components/OTDomainManager.js';

// Phase 2.14: Emergency Department (ED) & Trauma Care Exports
export * from './services/mock-emergency-data.js';
export * from './services/emergency-management-service.js';
export * from './components/dialogs/RegisterEmergencyPatientDialog.js';
export * from './components/dialogs/CreateTriageAssessmentDialog.js';
export * from './components/dialogs/ReassessTriageDialog.js';
export * from './components/dialogs/AssignEmergencyPatientDialog.js';
export * from './components/dialogs/CreateResuscitationEventDialog.js';
export * from './components/dialogs/RecordResuscitationActionDialog.js';
export * from './components/dialogs/CreateTraumaActivationDialog.js';
export * from './components/dialogs/RecordTraumaAssessmentDialog.js';
export * from './components/dialogs/CreateEmergencyProcedureDialog.js';
export * from './components/dialogs/CreateObservationCaseDialog.js';
export * from './components/dialogs/CreateMLCCaseDialog.js';
export * from './components/dialogs/CreateAmbulanceTransferDialog.js';
export * from './components/dialogs/CreateDispositionDialog.js';
export * from './components/dialogs/CreateEmergencyDeathDialog.js';
export * from './components/dialogs/ActivateDisasterModeDialog.js';
export * from './components/dialogs/RegisterDisasterPatientDialog.js';
export * from './components/dialogs/CheckCrashCartDialog.js';
export * from './components/dialogs/CloseEmergencyEncounterDialog.js';
export * from './components/views/EmergencyCommandCenterView.js';
export * from './components/views/EmergencyDashboardView.js';
export * from './components/views/EmergencyQueueView.js';
export * from './components/views/EmergencyPatientView.js';
export * from './components/views/EmergencyTriageView.js';
export * from './components/views/ResuscitationView.js';
export * from './components/views/TraumaCommandView.js';
export * from './components/views/TraumaPatientView.js';
export * from './components/views/EmergencyObservationView.js';
export * from './components/views/EmergencyProcedureView.js';
export * from './components/views/MLCWorkbenchView.js';
export * from './components/views/AmbulanceTransferView.js';
export * from './components/views/CrashCartView.js';
export * from './components/views/EmergencyDispositionView.js';
export * from './components/views/EmergencyDeathView.js';
export * from './components/views/DisasterManagementView.js';
export * from './components/views/EmergencyStaffView.js';
export * from './components/views/EmergencyAnalyticsView.js';
export * from './components/views/EmergencyAuditVaultView.js';
export * from './components/views/EmergencyControlCenterView.js';
export * from './components/EmergencyDomainManager.js';

// Phase 2.15: Medical Records Department (MRD), HIM & ICD-10 Coding Exports
export * from './services/mock-mrd-data.js';
export * from './services/mrd-management-service.js';
export * from './components/dialogs/CreateRecordCompletionDialog.js';
export * from './components/dialogs/AssignDiagnosisCodeDialog.js';
export * from './components/dialogs/EditDiagnosisCodeDialog.js';
export * from './components/dialogs/SubmitCodingReviewDialog.js';
export * from './components/dialogs/CreateClinicalQueryDialog.js';
export * from './components/dialogs/ResolveClinicalQueryDialog.js';
export * from './components/dialogs/RetrieveMedicalRecordDialog.js';
export * from './components/dialogs/CreateROIRequestDialog.js';
export * from './components/dialogs/ApproveROIRequestDialog.js';
export * from './components/dialogs/ReleaseMedicalRecordDialog.js';
export * from './components/dialogs/CreateLegalRequestDialog.js';
export * from './components/dialogs/CreateLegalHoldDialog.js';
export * from './components/dialogs/RegisterBirthRecordDialog.js';
export * from './components/dialogs/RegisterDeathRecordDialog.js';
export * from './components/views/MRDCommandCenterView.js';
export * from './components/views/MedicalRecordDirectoryView.js';
export * from './components/views/MedicalRecordDetailView.js';
export * from './components/views/RecordCompletionWorkbenchView.js';
export * from './components/views/ICD10CodingWorkbenchView.js';
export * from './components/views/CodingReviewView.js';
export * from './components/views/ClinicalQueryWorkbenchView.js';
export * from './components/views/MedicalRecordArchiveView.js';
export * from './components/views/RecordRetrievalView.js';
export * from './components/views/ROIWorkbenchView.js';
export * from './components/views/LegalRequestView.js';
export * from './components/views/BirthRegistryView.js';
export * from './components/views/DeathRegistryView.js';
export * from './components/views/MRDAnalyticsView.js';
export * from './components/views/MRDAuditVaultView.js';
export * from './components/views/MRDControlCenterView.js';
export * from './components/MRDDomainManager.js';

// Phase 2.16: Blood Bank & Transfusion Medicine Exports
export * from './services/mock-blood-bank-data.js';
export * from './services/blood-bank-management-service.js';
export * from './components/dialogs/CreateDonorDialog.js';
export * from './components/dialogs/ScreenDonorDialog.js';
export * from './components/dialogs/CreateDonationDialog.js';
export * from './components/dialogs/RecordBloodTestDialog.js';
export * from './components/dialogs/ReleaseBloodUnitDialog.js';
export * from './components/dialogs/CreateBloodComponentDialog.js';
export * from './components/dialogs/CreateBloodRequestDialog.js';
export * from './components/dialogs/CreateCrossmatchDialog.js';
export * from './components/dialogs/ReserveBloodUnitDialog.js';
export * from './components/dialogs/IssueBloodUnitDialog.js';
export * from './components/dialogs/RecordTransfusionDialog.js';
export * from './components/dialogs/RecordTransfusionObservationDialog.js';
export * from './components/dialogs/ReportTransfusionReactionDialog.js';
export * from './components/dialogs/ReturnBloodUnitDialog.js';
export * from './components/dialogs/DiscardBloodUnitDialog.js';
export * from './components/dialogs/CreateQualityCheckDialog.js';
export * from './components/dialogs/RecordTemperatureDialog.js';
export * from './components/dialogs/ResolveStorageExcursionDialog.js';
export * from './components/views/BloodBankCommandCenterView.js';
export * from './components/views/DonorDirectoryView.js';
export * from './components/views/DonorDetailView.js';
export * from './components/views/DonationCollectionView.js';
export * from './components/views/BloodTestingView.js';
export * from './components/views/ComponentPreparationView.js';
export * from './components/views/BloodInventoryView.js';
export * from './components/views/BloodRequestWorkbenchView.js';
export * from './components/views/CrossmatchWorkbenchView.js';
export * from './components/views/BloodReservationView.js';
export * from './components/views/BloodIssueView.js';
export * from './components/views/TransfusionWorkbenchView.js';
export * from './components/views/TransfusionReactionView.js';
export * from './components/views/BloodReturnView.js';
export * from './components/views/BloodDiscardView.js';
export * from './components/views/BloodQualityControlView.js';
export * from './components/views/TemperatureMonitoringView.js';
export * from './components/views/BloodBankAnalyticsView.js';
export * from './components/views/BloodBankAuditVaultView.js';
export * from './components/views/BloodBankControlCenterView.js';
export * from './components/BloodBankDomainManager.js';

// Phase 2.17: Radiology, Imaging & PACS / RIS Exports
export * from './services/mock-radiology-data.js';
export * from './services/radiology-management-service.js';
export * from './components/dialogs/CreateRadiologyOrderDialog.js';
export * from './components/dialogs/ScheduleRadiologyDialog.js';
export * from './components/dialogs/RescheduleRadiologyDialog.js';
export * from './components/dialogs/CancelRadiologyDialog.js';
export * from './components/dialogs/StartProcedureDialog.js';
export * from './components/dialogs/CompleteProcedureDialog.js';
export * from './components/dialogs/PreparationChecklistDialog.js';
export * from './components/dialogs/CreateRadiologyReportDialog.js';
export * from './components/dialogs/FinalizeRadiologyReportDialog.js';
export * from './components/dialogs/AmendRadiologyReportDialog.js';
export * from './components/dialogs/CriticalFindingDialog.js';
export * from './components/dialogs/AcknowledgeCriticalFindingDialog.js';
export * from './components/dialogs/PacsReferenceDialog.js';
export * from './components/views/RadiologyOverviewView.js';
export * from './components/views/RadiologyControlCenterView.js';
export * from './components/views/RadiologyOrderDirectoryView.js';
export * from './components/views/RadiologyOrderDetailView.js';
export * from './components/views/RadiologySchedulingView.js';
export * from './components/views/RadiologyModalityBoardView.js';
export * from './components/views/RadiologyTechnologistWorklistView.js';
export * from './components/views/RadiologyPreparationView.js';
export * from './components/views/RadiologyStudyWorklistView.js';
export * from './components/views/RadiologistWorkbenchView.js';
export * from './components/views/RadiologyReportingView.js';
export * from './components/views/RadiologyCriticalFindingsView.js';
export * from './components/views/RadiologyPacsView.js';
export * from './components/views/RadiologyProcedureCatalogView.js';
export * from './components/views/RadiologyQualityView.js';
export * from './components/views/RadiologyAnalyticsView.js';
export * from './components/views/RadiologyAuditVaultView.js';
export * from './components/RadiologyDomainManager.js';

// Phase 2.18: Dietary & Kitchen Management Exports
export * from './services/mock-dietary-data.js';
export * from './services/dietary-management-service.js';
export * from './components/dialogs/CreateKitchenDialog.js';
export * from './components/dialogs/EditKitchenDialog.js';
export * from './components/dialogs/CreateDietTypeDialog.js';
export * from './components/dialogs/CreateFoodItemDialog.js';
export * from './components/dialogs/CreateDietAssessmentDialog.js';
export * from './components/dialogs/CreateDietOrderDialog.js';
export * from './components/dialogs/ApproveDietOrderDialog.js';
export * from './components/dialogs/ModifyDietOrderDialog.js';
export * from './components/dialogs/CreateDietPlanDialog.js';
export * from './components/dialogs/CreateMenuTemplateDialog.js';
export * from './components/dialogs/CreateMealScheduleDialog.js';
export * from './components/dialogs/CreateProductionPlanDialog.js';
export * from './components/dialogs/ReleaseProductionPlanDialog.js';
export * from './components/dialogs/RecordMealPreparationDialog.js';
export * from './components/dialogs/QualityCheckDialog.js';
export * from './components/dialogs/CreateTrayAssemblyDialog.js';
export * from './components/dialogs/DispatchMealDialog.js';
export * from './components/dialogs/ConfirmMealDeliveryDialog.js';
export * from './components/dialogs/RefuseMealDialog.js';
export * from './components/dialogs/RecordMissedMealDialog.js';
export * from './components/dialogs/CreateDietChangeDialog.js';
export * from './components/dialogs/CreateNPOOrderDialog.js';
export * from './components/dialogs/ResolveDietarySafetyAlertDialog.js';
export * from './components/dialogs/RecordFoodWasteDialog.js';
export * from './components/dialogs/CreateProcurementReferenceDialog.js';
export * from './components/dialogs/CreateBillingReferenceDialog.js';
export * from './components/views/DietaryOverviewView.js';
export * from './components/views/DietaryControlCenterView.js';
export * from './components/views/KitchenDirectoryView.js';
export * from './components/views/KitchenDetailView.js';
export * from './components/views/DietTypeDirectoryView.js';
export * from './components/views/FoodIngredientCatalogView.js';
export * from './components/views/DietAssessmentView.js';
export * from './components/views/DietOrderDirectoryView.js';
export * from './components/views/DietOrderDetailView.js';
export * from './components/views/DietitianWorkbenchView.js';
export * from './components/views/PatientDietTimelineView.js';
export * from './components/views/DailyMealPlanningView.js';
export * from './components/views/MenuManagementView.js';
export * from './components/views/KitchenProductionView.js';
export * from './components/views/MealPreparationView.js';
export * from './components/views/TrayAssemblyView.js';
export * from './components/views/MealDispatchView.js';
export * from './components/views/MealDeliveryView.js';
export * from './components/views/DietarySafetyView.js';
export * from './components/views/DietaryWasteView.js';
export * from './components/views/DietaryProcurementView.js';
export * from './components/views/DietaryCostingView.js';
export * from './components/views/DietaryBillingView.js';
export * from './components/views/DietaryAnalyticsView.js';
export * from './components/views/DietaryAuditVaultView.js';
export * from './components/DietaryDomainManager.js';

// Phase 2.19: Hospital Asset & Biomedical Equipment Maintenance (HTM) Exports
export * from './services/mock-asset-biomedical-data.js';
export * from './services/asset-biomedical-service.js';
export * from './components/dialogs/RegisterAssetDialog.js';
export * from './components/dialogs/EditAssetDialog.js';
export * from './components/dialogs/TransferAssetDialog.js';
export * from './components/dialogs/CreatePpmScheduleDialog.js';
export * from './components/dialogs/CompletePpmTaskDialog.js';
export * from './components/dialogs/ReportBreakdownDialog.js';
export * from './components/dialogs/AssignWorkOrderDialog.js';
export * from './components/dialogs/CompleteWorkOrderDialog.js';
export * from './components/dialogs/VerifyWorkOrderDialog.js';
export * from './components/dialogs/RecordCalibrationDialog.js';
export * from './components/dialogs/RecordSafetyTestDialog.js';
export * from './components/dialogs/RegisterSparePartDialog.js';
export * from './components/dialogs/ConsumeSparePartDialog.js';
export * from './components/dialogs/LogVendorVisitDialog.js';
export * from './components/dialogs/ProposeCondemnationDialog.js';
export * from './components/dialogs/ApproveCondemnationDialog.js';
export * from './components/dialogs/ReportBiomedicalIncidentDialog.js';
export * from './components/dialogs/ResolveBiomedicalIncidentDialog.js';
export * from './components/views/AssetOverviewView.js';
export * from './components/views/AssetControlCenterView.js';
export * from './components/views/AssetInventoryDirectoryView.js';
export * from './components/views/AssetDetailView.js';
export * from './components/views/PpmScheduleBoardView.js';
export * from './components/views/BreakdownWorkOrdersView.js';
export * from './components/views/WorkOrderDetailView.js';
export * from './components/views/BiomedicalCalibrationView.js';
export * from './components/views/ElectricalSafetyTestingView.js';
export * from './components/views/SparePartsInventoryView.js';
export * from './components/views/VendorOemManagementView.js';
export * from './components/views/CondemnationDisposalView.js';
export * from './components/views/BiomedicalIncidentsView.js';
export * from './components/views/ClinicalEquipmentReadinessView.js';
export * from './components/views/AssetFinancialsView.js';
export * from './components/views/AssetDowntimeAnalyticsView.js';
export * from './components/views/AssetComplianceVaultView.js';
export * from './components/views/AssetAuditVaultView.js';
export * from './components/AssetBiomedicalDomainManager.js';

// Phase 2.20: Hospital Quality, Incident & Infection Control (NABH / JCI) Exports
export * from './services/mock-quality-infection-data.js';
export * from './services/quality-infection-service.js';
export * from './components/dialogs/ReportIncidentDialog.js';
export * from './components/dialogs/TriageIncidentDialog.js';
export * from './components/dialogs/CreateRcaInvestigationDialog.js';
export * from './components/dialogs/CreateCapaActionDialog.js';
export * from './components/dialogs/VerifyCapaActionDialog.js';
export * from './components/dialogs/LogHaiCaseDialog.js';
export * from './components/dialogs/AssignPatientIsolationDialog.js';
export * from './components/dialogs/RecordHandHygieneAuditDialog.js';
export * from './components/dialogs/RecordEnvironmentalSwabDialog.js';
export * from './components/dialogs/RecordNeedleStickLogDialog.js';
export * from './components/dialogs/RecordBmwLogDialog.js';
export * from './components/views/QualityOverviewView.js';
export * from './components/views/QualityCommandCenterView.js';
export * from './components/views/IncidentManagementView.js';
export * from './components/views/IncidentDetailView.js';
export * from './components/views/RcaFishboneView.js';
export * from './components/views/CapaEngineView.js';
export * from './components/views/HaiSurveillanceView.js';
export * from './components/views/PatientIsolationView.js';
export * from './components/views/HandHygieneComplianceView.js';
export * from './components/views/EnvironmentalMicrobiologyView.js';
export * from './components/views/NeedleStickPepView.js';
export * from './components/views/NabhCoreIndicatorsView.js';
export * from './components/views/InternalAuditsView.js';
export * from './components/views/ClinicalPathwaysView.js';
export * from './components/views/QualityCommitteeView.js';
export * from './components/views/BiomedicalWasteView.js';
export * from './components/views/NabhChapterComplianceView.js';
export * from './components/views/QualityAuditVaultView.js';
export * from './components/QualityInfectionDomainManager.js';

// Phase 3.1: Hospital Executive Command Center & AI Predictive Operations Exports
export * from './services/mock-executive-command-data.js';
export * from './services/executive-command-service.js';
export * from './components/dialogs/DeclareSurgeEventDialog.js';
export * from './components/dialogs/ResolveSurgeEventDialog.js';
export * from './components/dialogs/RunWhatIfSimulationDialog.js';
export * from './components/dialogs/OverrideBedAllocationDialog.js';
export * from './components/views/ExecutiveCommandCenterOverviewView.js';
export * from './components/views/RealtimeHospitalCommandWallView.js';
export * from './components/views/BedCapacityForecastView.js';
export * from './components/views/EdNedocsSurgeRadarView.js';
export * from './components/views/OtEfficiencyHeatmapView.js';
export * from './components/views/ClinicalAcuityRiskHeatmapView.js';
export * from './components/views/RcmLeakageDenialRiskView.js';
export * from './components/views/CriticalConsumableRunoutView.js';
export * from './components/views/WhatIfSimulationSandboxView.js';
export * from './components/views/ExecutiveAuditVaultView.js';
export * from './components/ExecutiveCommandDomainManager.js';

// Phase 3.2: ABDM (Ayushman Bharat Digital Mission) & FHIR R4 National Gateway Exports
export * from './services/mock-abdm-fhir-data.js';
export * from './services/abdm-fhir-service.js';
export * from './components/dialogs/CreateAbhaNumberDialog.js';
export * from './components/dialogs/LinkCareContextDialog.js';
export * from './components/dialogs/CreateConsentRequestDialog.js';
export * from './components/dialogs/GenerateFhirBundleDialog.js';
export * from './components/dialogs/ProcessScanAndShareDialog.js';
export * from './components/views/AbdmOverviewView.js';
export * from './components/views/AbhaManagementView.js';
export * from './components/views/CareContextLinkageView.js';
export * from './components/views/ConsentManagerView.js';
export * from './components/views/FhirR4BundleViewer.js';
export * from './components/views/ScanAndShareCounterView.js';
export * from './components/views/HfrHprRegistryView.js';
export * from './components/views/AbdmGatewayAuditVaultView.js';
export * from './components/AbdmFhirDomainManager.js';

// Phase 3.3: AI Clinical Co-Pilot, Sepsis & Drug Interaction CDSS Engine Exports
export * from './services/mock-ai-cdss-data.js';
export * from './services/ai-cdss-service.js';
export * from './components/dialogs/AcknowledgeSepsisAlertDialog.js';
export * from './components/dialogs/EvaluateDdiInteractionsDialog.js';
export * from './components/dialogs/OverrideDdiWarningDialog.js';
export * from './components/dialogs/GenerateAmbientSoapDialog.js';
export * from './components/dialogs/AcknowledgePanicValueDialog.js';
export * from './components/views/AiCdssOverviewView.js';
export * from './components/views/SepsisEarlyWarningView.js';
export * from './components/views/DrugInteractionGuardView.js';
export * from './components/views/AmbientAiScribeView.js';
export * from './components/views/DiagnosticPanicValuesView.js';
export * from './components/views/RenalDosageCalculatorView.js';
export * from './components/views/CdsHooksRulesEngineView.js';
export * from './components/views/CdssAuditVaultView.js';
export * from './components/AiCdssDomainManager.js';

// Phase 3.4: Telemedicine & RPM Exports
export * from './services/mock-telemedicine-rpm-data.js';
export * from './services/telemedicine-rpm-service.js';
export * from './components/dialogs/ScheduleTeleconsultationDialog.js';
export * from './components/dialogs/RegisterIotDeviceDialog.js';
export * from './components/dialogs/EnrollRpmPatientDialog.js';
export * from './components/dialogs/AcknowledgeVitalBreachDialog.js';
export * from './components/views/TelemedicineOverviewView.js';
export * from './components/views/VirtualConsultationRoomView.js';
export * from './components/views/VirtualWaitingRoomView.js';
export * from './components/views/IotDeviceTelemetryView.js';
export * from './components/views/RpmCareCohortManagementView.js';
export * from './components/views/VitalBreachEscalationView.js';
export * from './components/views/TelehealthAuditVaultView.js';
export * from './components/TelemedicineRpmDomainManager.js';

// Phase 3.5: WhatsApp Bot & Patient Self-Service Portal Exports
export * from './services/mock-whatsapp-portal-data.js';
export * from './services/whatsapp-portal-service.js';
export * from './components/dialogs/SendWhatsAppTemplateDialog.js';
export * from './components/dialogs/DispatchHealthDocumentDialog.js';
export * from './components/dialogs/SendMedicationReminderDialog.js';
export * from './components/views/WhatsAppOverviewView.js';
export * from './components/views/WhatsAppLiveChatDeskView.js';
export * from './components/views/Aarogya360PatientPortalView.js';
export * from './components/views/AutomatedDocumentDeliveryView.js';
export * from './components/views/LiveQueueTokenTrackerView.js';
export * from './components/views/WhatsAppAuditVaultView.js';
export * from './components/WhatsAppPortalDomainManager.js';
