import {
  bloodBankManagementRepository,
  type RegisterDonorInput,
  type CollectDonationInput,
  type SeparateComponentsInput,
  type RecordBloodTestInput,
  type CreateBloodRequestInput,
  type PerformCrossmatchInput,
  type IssueBloodUnitInput,
  type RecordTransfusionInput
} from '../../repositories/partner/BloodBankManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class BloodBankManagementService {
  async getInventory(session: SessionContext, bloodGroup?: string, componentType?: string, status?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return bloodBankManagementRepository.getInventory(session.tenantId, bloodGroup, componentType, status, tx);
    });
  }

  async registerDonor(input: Omit<RegisterDonorInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const donor = await bloodBankManagementRepository.registerDonor({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'DONOR_REGISTERED',
        resourceType: 'blood_donor',
        resourceId: donor.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { donorNumber: donor.donorNumber, fullName: donor.fullName, bloodGroup: donor.bloodGroup }
      }, session, tx);

      return donor;
    });
  }

  async collectDonation(input: Omit<CollectDonationInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const donation = await bloodBankManagementRepository.collectDonation({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'BLOOD_COLLECTED',
        resourceType: 'blood_donation',
        resourceId: donation.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { donationNumber: donation.donationNumber, bagBarcode: donation.bagBarcode, bloodGroup: donation.bloodGroup }
      }, session, tx);

      return donation;
    });
  }

  async separateComponents(input: Omit<SeparateComponentsInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const components = await bloodBankManagementRepository.separateComponents({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'COMPONENTS_SEPARATED',
        resourceType: 'blood_donation',
        resourceId: input.donationId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { parentBarcode: input.parentBagBarcode, componentsCount: components.length }
      }, session, tx);

      return components;
    });
  }

  async recordBloodTest(input: Omit<RecordBloodTestInput, 'tenantId' | 'testedBy'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await bloodBankManagementRepository.recordBloodTest({
        ...input,
        tenantId: session.tenantId,
        testedBy: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'BLOOD_TESTED',
        resourceType: 'blood_test',
        resourceId: result.testId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { donationId: input.donationId, overallStatus: input.overallStatus }
      }, session, tx);

      return result;
    });
  }

  async createBloodRequest(input: Omit<CreateBloodRequestInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const request = await bloodBankManagementRepository.createBloodRequest({
        ...input,
        tenantId: session.tenantId,
        doctorId: input.doctorId || session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'BLOOD_REQUESTED',
        resourceType: 'blood_request',
        resourceId: request.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { requestNumber: request.requestNumber, patientId: request.patientId, component: request.componentType }
      }, session, tx);

      return request;
    });
  }

  async performCrossmatch(input: Omit<PerformCrossmatchInput, 'tenantId' | 'technicianId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const request = await bloodBankManagementRepository.performCrossmatch({
        ...input,
        tenantId: session.tenantId,
        technicianId: session.userId
      }, tx);

      if (request) {
        await auditRepository.recordEvent({
          eventType: 'CROSSMATCH_COMPLETED',
          resourceType: 'blood_crossmatch',
          resourceId: request.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { requestNumber: request.requestNumber, compatibility: input.compatibilityResult }
        }, session, tx);
      }

      return request;
    });
  }

  async issueBloodUnit(input: Omit<IssueBloodUnitInput, 'tenantId' | 'issuedBy'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const request = await bloodBankManagementRepository.issueBloodUnit({
        ...input,
        tenantId: session.tenantId,
        issuedBy: session.userId
      }, tx);

      if (request) {
        await auditRepository.recordEvent({
          eventType: 'BLOOD_ISSUED',
          resourceType: 'blood_issue',
          resourceId: request.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { requestNumber: request.requestNumber, componentId: input.componentId, issuedToStaff: input.issuedToStaff }
        }, session, tx);
      }

      return request;
    });
  }

  async recordTransfusion(input: Omit<RecordTransfusionInput, 'tenantId' | 'transfusedByNurse'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const request = await bloodBankManagementRepository.recordTransfusion({
        ...input,
        tenantId: session.tenantId,
        transfusedByNurse: session.userId
      }, tx);

      if (request) {
        await auditRepository.recordEvent({
          eventType: 'TRANSFUSION_RECORDED',
          resourceType: 'transfusion_record',
          resourceId: request.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { requestNumber: request.requestNumber, reactionObserved: input.transfusionReactionObserved }
        }, session, tx);
      }

      return request;
    });
  }

  async getPatientTransfusionHistory(session: SessionContext, patientId: string) {
    return withSecurityContext(getDatabase(), session, async () => {
      return bloodBankManagementRepository.getPatientTransfusionHistory(session.tenantId, patientId);
    });
  }
}

export const bloodBankManagementService = new BloodBankManagementService();
