import { partnerFoundationRepository, type CreatePartnerData } from '../../repositories/partner/PartnerFoundationRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import {
  withSecurityContext,
  getDatabase,
  branches,
  operationalStaff,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  operationalDepartments,
  eq,
  and,
  or
} from '@docsearch/database';

export interface DoctorChamberProfile {
  doctorName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  room?: string | undefined;
  mciRegistration?: string | undefined;
  fee?: number | undefined;
  department?: string | undefined;
  specialty?: string | undefined;
  branchName?: string | undefined;
  branchCode?: string | undefined;
}

export class PartnerFoundationService {
  async getOverview(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      // Auto-ensure doctor chamber profile in background if newly provisioned clinic
      try {
        await this.ensureDoctorChamberProfile(session);
      } catch {
        // Non-blocking in read paths
      }
      return partnerFoundationRepository.getOverview(session.tenantId, tx);
    });
  }

  async getPartners(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return partnerFoundationRepository.getPartners(session.tenantId, tx);
    });
  }

  async getOrganizations(session: SessionContext, partnerId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return partnerFoundationRepository.getOrganizations(session.tenantId, partnerId, tx);
    });
  }

  async getFacilities(session: SessionContext, partnerId?: string, organizationId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return partnerFoundationRepository.getFacilities(session.tenantId, partnerId, organizationId, tx);
    });
  }

  async createPartner(data: Omit<CreatePartnerData, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const created = await partnerFoundationRepository.createPartner({
        ...data,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'PARTNER_FOUNDATION_CREATED',
        resourceType: 'partner_profile',
        resourceId: created.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { tradeName: created.tradeName }
      }, session, tx);

      return created;
    });
  }

  /**
   * Ensure the logged-in doctor's chamber profile (Room, MCI Registration, Fee, Department)
   * dynamically seeds and persists to PostgreSQL 'core.branches' and 'clinical.operational_staff'.
   */
  async ensureDoctorChamberProfile(
    session: SessionContext,
    profile?: DoctorChamberProfile
  ): Promise<{
    branch: { id: string; name: string; code: string };
    staff: { id: string; staffCode: string; fullName: string; workEmail: string; metadata: any };
  }> {
    const db = getDatabase();
    return withSecurityContext(db, session, async (tx) => {
      const tenantId = session.tenantId;
      const room = profile?.room || 'Room 101';
      const mciReg = profile?.mciRegistration || 'NMC-2023-9042';
      const fee = profile?.fee ?? 500;
      const deptName = profile?.department || profile?.specialty || 'General Medicine';
      const doctorName = profile?.doctorName || 'Attending Physician';
      const email = (session.actorEmail || profile?.email || 'doctor@docsearch.local').toLowerCase().trim();
      const phone = profile?.phone || '+91 98765 43210';
      const branchName = profile?.branchName || 'Main OPD Care Center';
      const branchCode = profile?.branchCode || 'OPD-MAIN';

      // 1. Ensure core.branches record exists and contains chamber metadata
      let branchId = session.branchId;
      let existingBranch: any = null;

      if (branchId) {
        const [b] = await tx
          .select()
          .from(branches)
          .where(and(eq(branches.tenantId, tenantId), eq(branches.id, branchId)))
          .limit(1);
        existingBranch = b;
      }

      if (!existingBranch) {
        const [b] = await tx
          .select()
          .from(branches)
          .where(and(eq(branches.tenantId, tenantId), eq(branches.code, branchCode)))
          .limit(1);
        existingBranch = b;
      }

      if (existingBranch) {
        branchId = existingBranch.id;
        const currentMeta = (existingBranch.metadata as any) || {};
        await tx
          .update(branches)
          .set({
            metadata: {
              ...currentMeta,
              chamberRoom: room,
              defaultConsultationFee: fee,
              department: deptName,
              updatedAt: new Date().toISOString()
            },
            updatedAt: new Date()
          })
          .where(eq(branches.id, existingBranch.id));
      } else {
        const [insertedBranch] = await tx
          .insert(branches)
          .values({
            tenantId,
            name: branchName,
            code: branchCode,
            status: 'ACTIVE',
            timezone: 'Asia/Kolkata',
            metadata: {
              chamberRoom: room,
              defaultConsultationFee: fee,
              department: deptName
            }
          })
          .returning();
        branchId = insertedBranch!.id;
        existingBranch = insertedBranch!;
      }

      // 2. Ensure foundation partner & organization exist if needed for foreign keys in clinical.operational_staff
      let [partner] = await tx
        .select()
        .from(operationalPartners)
        .where(eq(operationalPartners.tenantId, tenantId))
        .limit(1);

      if (!partner) {
        const [p] = await tx
          .insert(operationalPartners)
          .values({
            tenantId,
            partnerCode: 'PRT-MAIN',
            legalBusinessName: 'Healthcare Care Network',
            contactEmail: email,
            status: 'ACTIVE'
          })
          .returning();
        partner = p!;
      }

      let [org] = await tx
        .select()
        .from(operationalOrganizations)
        .where(eq(operationalOrganizations.tenantId, tenantId))
        .limit(1);

      if (!org) {
        const [o] = await tx
          .insert(operationalOrganizations)
          .values({
            tenantId,
            partnerId: partner.id,
            organizationCode: 'ORG-MAIN',
            organizationName: 'DocSearch Hospital Clinics',
            contactEmail: email,
            status: 'ACTIVE'
          })
          .returning();
        org = o!;
      }

      let [fac] = await tx
        .select()
        .from(operationalFacilities)
        .where(eq(operationalFacilities.tenantId, tenantId))
        .limit(1);

      if (!fac) {
        const [f] = await tx
          .insert(operationalFacilities)
          .values({
            tenantId,
            partnerId: partner.id,
            organizationId: org.id,
            facilityCode: branchCode,
            facilityName: branchName,
            addressStreet: 'Main Clinic Boulevard',
            addressCity: 'New Delhi',
            addressState: 'Delhi',
            addressPostalCode: '110001',
            addressCountry: 'IN',
            contactEmail: email,
            contactPhone: phone,
            status: 'ACTIVE'
          })
          .returning();
        fac = f!;
      }

      let [dept] = await tx
        .select()
        .from(operationalDepartments)
        .where(
          and(
            eq(operationalDepartments.tenantId, tenantId),
            eq(operationalDepartments.departmentName, deptName)
          )
        )
        .limit(1);

      if (!dept) {
        const [d] = await tx
          .insert(operationalDepartments)
          .values({
            tenantId,
            partnerId: partner.id,
            organizationId: org.id,
            branchId: fac.id,
            departmentCode: `DEPT-${deptName.slice(0, 3).toUpperCase()}`,
            departmentName: deptName,
            status: 'ACTIVE'
          })
          .returning();
        dept = d!;
      }

      // 3. Ensure clinical.operational_staff record exists and persists doctor's chamber profile
      let [existingStaff] = await tx
        .select()
        .from(operationalStaff)
        .where(
          and(
            eq(operationalStaff.tenantId, tenantId),
            or(
              eq(operationalStaff.workEmail, email),
              eq(operationalStaff.fullName, doctorName)
            )
          )
        )
        .limit(1);

      const staffMetadata = {
        room,
        mciRegistration: mciReg,
        mciRegNo: mciReg,
        fee,
        consultationFee: fee,
        department: deptName,
        specialty: deptName,
        seededAt: new Date().toISOString()
      };

      if (existingStaff) {
        const currentMeta = (existingStaff.metadata as any) || {};
        const [updated] = await tx
          .update(operationalStaff)
          .set({
            fullName: doctorName,
            workPhone: phone,
            professionalProfileRef: mciReg,
            metadata: { ...currentMeta, ...staffMetadata },
            updatedAt: new Date()
          })
          .where(eq(operationalStaff.id, existingStaff.id))
          .returning();
        existingStaff = updated!;
      } else {
        const [insertedStaff] = await tx
          .insert(operationalStaff)
          .values({
            tenantId,
            partnerId: partner.id,
            organizationId: org.id,
            branchId: fac.id,
            departmentId: dept.id,
            staffCode: `DOC-${Date.now().toString().slice(-4)}`,
            fullName: doctorName,
            workEmail: email,
            workPhone: phone,
            staffType: 'DOCTOR',
            primaryRole: 'ATTENDING_PHYSICIAN',
            employmentType: 'FULL_TIME',
            employmentStatus: 'ACTIVE',
            joiningDate: new Date(),
            professionalProfileRef: mciReg,
            metadata: staffMetadata
          })
          .returning();
        existingStaff = insertedStaff!;
      }

      return {
        branch: {
          id: existingBranch!.id,
          name: existingBranch!.name,
          code: existingBranch!.code
        },
        staff: {
          id: existingStaff!.id,
          staffCode: existingStaff!.staffCode,
          fullName: existingStaff!.fullName,
          workEmail: existingStaff!.workEmail,
          metadata: existingStaff!.metadata
        }
      };
    });
  }
}

export const partnerFoundationService = new PartnerFoundationService();
