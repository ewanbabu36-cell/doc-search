import {
  desc,
  eq,
  getDatabase,
  legalEntities,
  departments,
  designations,
  internalEmployees,
  boardMembers,
  corporatePolicies,
  complianceOfficers,
  governanceEvents,
  companyAuditTraces
} from '@docsearch/database';
import type {
  InternalEmployeeDto,
  LegalEntityDto,
  DepartmentDto,
  DesignationDto,
  BoardMemberDto,
  ComplianceOfficerDto,
  CorporatePolicyDto,
  GovernanceEventDto,
  CompanyAuditTraceDto,
  CreateInternalEmployeeRequest,
  CreateLegalEntityRequest,
  CreateDepartmentRequest,
  CreateDesignationRequest
} from '@docsearch/api-contracts';
import crypto from 'node:crypto';

export class CompanyAdminRepository {
  private fallbackEmployees: InternalEmployeeDto[] = [
    {
      id: 'e4a11111-1111-4111-8111-111111111111',
      employeeCode: 'EMP-0001',
      firstName: 'MERAJ',
      lastName: 'SHARIF',
      workEmail: 'founder@docsearch.health',
      legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
      legalEntityName: 'Doc Search Global Inc.',
      departmentId: 'd1a11111-1111-4111-8111-111111111111',
      departmentName: 'Executive Office & Corporate Strategy',
      designationId: 'f1a11111-1111-4111-8111-111111111111',
      designationTitle: 'Founder & Chief Executive Officer',
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      startDate: '2025-01-01T00:00:00Z',
      metadata: {
        role: 'SUPER_ADMIN_FOUNDER',
        isProtectedFounder: true,
        immutableShield: true
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2026-09-09T00:00:00Z'
    }
  ];

  private async ensureDefaults(dbClient: any): Promise<{ legalEntityId: string; departmentId: string; designationId: string }> {
    // 1. Legal Entity
    let [defaultEntity] = await dbClient.select().from(legalEntities).limit(1);
    if (!defaultEntity) {
      const [inserted] = await dbClient
        .insert(legalEntities)
        .values({
          id: 'e1a11111-1111-4111-8111-111111111111',
          entityCode: 'DOCSEARCH-GLOBAL-INC',
          entityName: 'Doc Search Global Healthcare Technologies Inc.',
          entityType: 'C_CORP',
          jurisdiction: 'Delaware, USA',
          registrationNumber: 'DEL-882910',
          incorporationDate: new Date('2025-01-15T00:00:00Z'),
          taxIdentifierReference: 'EIN-XX-XXX8921',
          registeredAddress: '1209 North Orange Street, Wilmington, DE 19801, USA',
          status: 'ACTIVE',
          metadata: { filingAgent: 'Corporation Service Company (CSC)' }
        })
        .returning();
      defaultEntity = inserted;
    }

    // 2. Department
    let [defaultDept] = await dbClient.select().from(departments).limit(1);
    if (!defaultDept) {
      const [inserted] = await dbClient
        .insert(departments)
        .values({
          id: 'd1a22222-2222-4222-8222-222222222222',
          departmentCode: 'CLIN-OPS',
          departmentName: 'Clinical & Hospital Operations',
          description: 'Oversees partner clinical operations, hospital integrations, and diagnostics compliance',
          costCenterCode: 'CC-CLIN-8001',
          legalEntityId: defaultEntity.id,
          leadEmail: 'founder@docsearch.health',
          status: 'ACTIVE',
          metadata: {}
        })
        .returning();
      defaultDept = inserted;
    }

    // 3. Designation
    let [defaultDesig] = await dbClient.select().from(designations).limit(1);
    if (!defaultDesig) {
      const [inserted] = await dbClient
        .insert(designations)
        .values({
          id: 'f1a22222-2222-4222-8222-222222222222',
          designationCode: 'DES-CLIN-LEAD',
          title: 'Clinical Operations Lead',
          bandLevel: 'SENIOR',
          departmentId: defaultDept.id,
          jobFamily: 'CLINICAL_OPERATIONS',
          isExecutive: false,
          status: 'ACTIVE',
          metadata: {}
        })
        .returning();
      defaultDesig = inserted;
    }

    return {
      legalEntityId: defaultEntity.id,
      departmentId: defaultDept.id,
      designationId: defaultDesig.id
    };
  }

  // --- INTERNAL EMPLOYEES ---
  async getEmployees(dbClient = getDatabase()): Promise<InternalEmployeeDto[]> {
    if (dbClient) {
      try {
        await this.ensureDefaults(dbClient);
        const rows = await dbClient
          .select({
            id: internalEmployees.id,
            employeeCode: internalEmployees.employeeCode,
            userId: internalEmployees.userId,
            firstName: internalEmployees.firstName,
            lastName: internalEmployees.lastName,
            workEmail: internalEmployees.workEmail,
            legalEntityId: internalEmployees.legalEntityId,
            legalEntityName: legalEntities.entityName,
            departmentId: internalEmployees.departmentId,
            departmentName: departments.departmentName,
            designationId: internalEmployees.designationId,
            designationTitle: designations.title,
            managerEmployeeId: internalEmployees.managerEmployeeId,
            employmentType: internalEmployees.employmentType,
            employmentStatus: internalEmployees.employmentStatus,
            startDate: internalEmployees.startDate,
            metadata: internalEmployees.metadata,
            createdAt: internalEmployees.createdAt,
            updatedAt: internalEmployees.updatedAt
          })
          .from(internalEmployees)
          .leftJoin(legalEntities, eq(internalEmployees.legalEntityId, legalEntities.id))
          .leftJoin(departments, eq(internalEmployees.departmentId, departments.id))
          .leftJoin(designations, eq(internalEmployees.designationId, designations.id))
          .orderBy(desc(internalEmployees.createdAt));

        if (rows.length > 0) {
          const sanitizedRows = rows.filter((r: any) => {
            const email = (r.workEmail || '').toLowerCase();
            const first = (r.firstName || '').toUpperCase();
            return !(
              email.includes('alok.sharma') ||
              email.includes('shahalam') ||
              first.includes('ALOK') ||
              first.includes('SHAH')
            );
          });

          const hasFounder = sanitizedRows.some(
            (r: any) => (r.workEmail || '').toLowerCase() === 'founder@docsearch.health'
          );
          if (!hasFounder) {
            sanitizedRows.unshift(this.fallbackEmployees[0] as any);
          }

          return sanitizedRows.map((r: any) => ({
            id: r.id,
            employeeCode: r.employeeCode,
            userId: r.userId ?? undefined,
            firstName: r.firstName,
            lastName: r.lastName,
            workEmail: r.workEmail,
            legalEntityId: r.legalEntityId,
            legalEntityName: r.legalEntityName ?? 'Doc Search Global Inc.',
            departmentId: r.departmentId,
            departmentName: r.departmentName ?? 'Executive Office & Corporate Strategy',
            designationId: r.designationId,
            designationTitle: r.designationTitle ?? 'Founder & Chief Executive Officer',
            managerEmployeeId: r.managerEmployeeId ?? undefined,
            employmentType: r.employmentType,
            employmentStatus: r.employmentStatus,
            startDate: r.startDate instanceof Date ? r.startDate.toISOString() : String(r.startDate),
            metadata: r.metadata ?? {},
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
          }));
        }

        // If DB table is empty, seed defaults
        for (const emp of this.fallbackEmployees) {
          try {
            await dbClient.insert(internalEmployees).values({
              id: emp.id,
              employeeCode: emp.employeeCode,
              firstName: emp.firstName,
              lastName: emp.lastName,
              workEmail: emp.workEmail,
              legalEntityId: emp.legalEntityId,
              departmentId: emp.departmentId,
              designationId: emp.designationId,
              employmentType: emp.employmentType,
              employmentStatus: emp.employmentStatus,
              startDate: new Date(emp.startDate),
              metadata: emp.metadata ?? {}
            }).onConflictDoNothing();
          } catch {}
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] getEmployees DB error:', err);
      }
    }
    return [...this.fallbackEmployees];
  }

  async createEmployee(req: CreateInternalEmployeeRequest, dbClient = getDatabase()): Promise<InternalEmployeeDto> {
    const newId = crypto.randomUUID();
    let resolvedEntityId = req.legalEntityId;
    let resolvedDeptId = req.departmentId;
    let resolvedDesigId = req.designationId;

    if (dbClient) {
      try {
        const defaults = await this.ensureDefaults(dbClient);
        if (!resolvedEntityId) resolvedEntityId = defaults.legalEntityId;
        if (!resolvedDeptId) resolvedDeptId = defaults.departmentId;
        if (!resolvedDesigId) resolvedDesigId = defaults.designationId;

        const [created] = await dbClient
          .insert(internalEmployees)
          .values({
            id: newId,
            employeeCode: req.employeeCode,
            firstName: req.firstName,
            lastName: req.lastName,
            workEmail: req.workEmail,
            legalEntityId: resolvedEntityId,
            departmentId: resolvedDeptId,
            designationId: resolvedDesigId,
            managerEmployeeId: req.managerEmployeeId || null,
            employmentType: req.employmentType,
            employmentStatus: 'ACTIVE',
            startDate: new Date(req.startDate),
            metadata: {}
          })
          .returning();

        if (created) {
          const [dept] = await dbClient.select().from(departments).where(eq(departments.id, resolvedDeptId)).limit(1);
          const [desig] = await dbClient.select().from(designations).where(eq(designations.id, resolvedDesigId)).limit(1);
          const [entity] = await dbClient.select().from(legalEntities).where(eq(legalEntities.id, resolvedEntityId)).limit(1);

          const dto: InternalEmployeeDto = {
            id: created.id,
            employeeCode: created.employeeCode,
            firstName: created.firstName,
            lastName: created.lastName,
            workEmail: created.workEmail,
            legalEntityId: created.legalEntityId,
            legalEntityName: entity?.entityName ?? 'Doc Search Inc.',
            departmentId: created.departmentId,
            departmentName: dept?.departmentName ?? 'Clinical Operations',
            designationId: created.designationId,
            designationTitle: desig?.title ?? 'Staff Member',
            managerEmployeeId: created.managerEmployeeId ?? undefined,
            employmentType: created.employmentType as any,
            employmentStatus: created.employmentStatus as any,
            startDate: created.startDate instanceof Date ? created.startDate.toISOString() : String(created.startDate),
            metadata: (created.metadata as Record<string, unknown>) ?? {},
            createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
            updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt)
          };

          this.fallbackEmployees.unshift(dto);
          return dto;
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] createEmployee DB error:', err);
      }
    }

    const fallbackDto: InternalEmployeeDto = {
      id: newId,
      employeeCode: req.employeeCode,
      firstName: req.firstName,
      lastName: req.lastName,
      workEmail: req.workEmail,
      legalEntityId: resolvedEntityId || 'e1a11111-1111-4111-8111-111111111111',
      legalEntityName: 'Doc Search Inc.',
      departmentId: resolvedDeptId || 'd1a22222-2222-4222-8222-222222222222',
      departmentName: 'Clinical Operations',
      designationId: resolvedDesigId || 'f1a22222-2222-4222-8222-222222222222',
      designationTitle: 'Staff Member',
      managerEmployeeId: req.managerEmployeeId,
      employmentType: req.employmentType,
      employmentStatus: 'ACTIVE',
      startDate: req.startDate,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.fallbackEmployees.unshift(fallbackDto);
    return fallbackDto;
  }

  async updateEmployeeStatus(employeeId: string, status: string, _reason?: string, dbClient = getDatabase()): Promise<InternalEmployeeDto> {
    if (dbClient) {
      try {
        const [updated] = await dbClient
          .update(internalEmployees)
          .set({
            employmentStatus: status,
            updatedAt: new Date()
          })
          .where(eq(internalEmployees.id, employeeId))
          .returning();

        if (updated) {
          const [dept] = await dbClient.select().from(departments).where(eq(departments.id, updated.departmentId)).limit(1);
          const [desig] = await dbClient.select().from(designations).where(eq(designations.id, updated.designationId)).limit(1);
          const [entity] = await dbClient.select().from(legalEntities).where(eq(legalEntities.id, updated.legalEntityId)).limit(1);

          return {
            id: updated.id,
            employeeCode: updated.employeeCode,
            firstName: updated.firstName,
            lastName: updated.lastName,
            workEmail: updated.workEmail,
            legalEntityId: updated.legalEntityId,
            legalEntityName: entity?.entityName ?? 'Doc Search Inc.',
            departmentId: updated.departmentId,
            departmentName: dept?.departmentName ?? 'Clinical Operations',
            designationId: updated.designationId,
            designationTitle: desig?.title ?? 'Staff Member',
            managerEmployeeId: updated.managerEmployeeId ?? undefined,
            employmentType: updated.employmentType as any,
            employmentStatus: updated.employmentStatus as any,
            startDate: updated.startDate instanceof Date ? updated.startDate.toISOString() : String(updated.startDate),
            metadata: (updated.metadata as Record<string, unknown>) ?? {},
            createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
            updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt)
          };
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] updateEmployeeStatus DB error:', err);
      }
    }

    const emp = this.fallbackEmployees.find((e) => e.id === employeeId);
    if (!emp) throw new Error(`Employee not found: ${employeeId}`);
    emp.employmentStatus = status as any;
    emp.updatedAt = new Date().toISOString();
    return emp;
  }

  async deleteEmployee(employeeId: string, dbClient = getDatabase()): Promise<{ success: boolean }> {
    if (dbClient) {
      try {
        await dbClient.delete(internalEmployees).where(eq(internalEmployees.id, employeeId));
      } catch (err) {
        console.error('[CompanyAdminRepository] deleteEmployee DB error:', err);
      }
    }
    this.fallbackEmployees = this.fallbackEmployees.filter((e) => e.id !== employeeId);
    return { success: true };
  }

  // --- LEGAL ENTITIES ---
  async getLegalEntities(dbClient = getDatabase()): Promise<LegalEntityDto[]> {
    if (dbClient) {
      try {
        await this.ensureDefaults(dbClient);
        const rows = await dbClient.select().from(legalEntities).orderBy(desc(legalEntities.createdAt));
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            entityCode: r.entityCode,
            entityName: r.entityName,
            entityType: r.entityType,
            jurisdiction: r.jurisdiction,
            registrationNumber: r.registrationNumber,
            incorporationDate: r.incorporationDate instanceof Date ? r.incorporationDate.toISOString() : String(r.incorporationDate),
            taxIdentifierReference: r.taxIdentifierReference,
            registeredAddress: r.registeredAddress,
            status: r.status,
            parentEntityId: r.parentEntityId ?? undefined,
            metadata: r.metadata ?? {},
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
          }));
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] getLegalEntities DB error:', err);
      }
    }
    return [
      {
        id: 'e1a11111-1111-4111-8111-111111111111',
        entityCode: 'DOCSEARCH-GLOBAL-INC',
        entityName: 'Doc Search Global Healthcare Technologies Inc.',
        entityType: 'C_CORP',
        jurisdiction: 'Delaware, USA',
        registrationNumber: 'DEL-882910',
        incorporationDate: '2025-01-15T00:00:00Z',
        taxIdentifierReference: 'EIN-XX-XXX8921',
        registeredAddress: '1209 North Orange Street, Wilmington, DE 19801, USA',
        status: 'ACTIVE',
        metadata: { filingAgent: 'Corporation Service Company (CSC)' },
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      }
    ];
  }

  async createLegalEntity(req: CreateLegalEntityRequest, dbClient = getDatabase()): Promise<LegalEntityDto> {
    const newId = crypto.randomUUID();
    if (dbClient) {
      try {
        const [created] = await dbClient
          .insert(legalEntities)
          .values({
            id: newId,
            entityCode: req.entityCode,
            entityName: req.entityName,
            entityType: req.entityType,
            jurisdiction: req.jurisdiction,
            registrationNumber: req.registrationNumber,
            incorporationDate: new Date(req.incorporationDate),
            taxIdentifierReference: req.taxIdentifierReference,
            registeredAddress: req.registeredAddress,
            status: 'ACTIVE',
            parentEntityId: req.parentEntityId || null,
            metadata: {}
          })
          .returning();

        if (created) {
          return {
            id: created.id,
            entityCode: created.entityCode,
            entityName: created.entityName,
            entityType: created.entityType as any,
            jurisdiction: created.jurisdiction,
            registrationNumber: created.registrationNumber,
            incorporationDate: created.incorporationDate.toISOString(),
            taxIdentifierReference: created.taxIdentifierReference,
            registeredAddress: created.registeredAddress,
            status: created.status as any,
            parentEntityId: created.parentEntityId ?? undefined,
            metadata: (created.metadata as Record<string, unknown>) ?? {},
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString()
          };
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] createLegalEntity DB error:', err);
      }
    }
    return {
      id: newId,
      entityCode: req.entityCode,
      entityName: req.entityName,
      entityType: req.entityType,
      jurisdiction: req.jurisdiction,
      registrationNumber: req.registrationNumber,
      incorporationDate: req.incorporationDate,
      taxIdentifierReference: req.taxIdentifierReference,
      registeredAddress: req.registeredAddress,
      status: 'ACTIVE',
      parentEntityId: req.parentEntityId,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // --- DEPARTMENTS ---
  async getDepartments(dbClient = getDatabase()): Promise<DepartmentDto[]> {
    if (dbClient) {
      try {
        await this.ensureDefaults(dbClient);
        const rows = await dbClient
          .select({
            id: departments.id,
            departmentCode: departments.departmentCode,
            departmentName: departments.departmentName,
            description: departments.description,
            costCenterCode: departments.costCenterCode,
            legalEntityId: departments.legalEntityId,
            legalEntityName: legalEntities.entityName,
            parentDepartmentId: departments.parentDepartmentId,
            leadEmail: departments.leadEmail,
            status: departments.status,
            metadata: departments.metadata,
            createdAt: departments.createdAt,
            updatedAt: departments.updatedAt
          })
          .from(departments)
          .leftJoin(legalEntities, eq(departments.legalEntityId, legalEntities.id))
          .orderBy(desc(departments.createdAt));

        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            departmentCode: r.departmentCode,
            departmentName: r.departmentName,
            description: r.description,
            costCenterCode: r.costCenterCode,
            legalEntityId: r.legalEntityId,
            legalEntityName: r.legalEntityName ?? 'Doc Search Inc.',
            parentDepartmentId: r.parentDepartmentId ?? undefined,
            leadEmail: r.leadEmail ?? undefined,
            employeeCount: 0,
            status: r.status,
            metadata: r.metadata ?? {},
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
          }));
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] getDepartments DB error:', err);
      }
    }
    return [
      {
        id: 'd1a22222-2222-4222-8222-222222222222',
        departmentCode: 'CLIN-OPS',
        departmentName: 'Clinical & Hospital Operations',
        description: 'Oversees partner clinical operations, hospital integrations, and diagnostics compliance',
        costCenterCode: 'CC-CLIN-8001',
        legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
        legalEntityName: 'Doc Search Inc.',
        leadEmail: 'founder@docsearch.health',
        employeeCount: 12,
        status: 'ACTIVE',
        metadata: {},
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      }
    ];
  }

  async createDepartment(req: CreateDepartmentRequest, dbClient = getDatabase()): Promise<DepartmentDto> {
    const newId = crypto.randomUUID();
    let resolvedEntityId = req.legalEntityId;
    if (dbClient) {
      try {
        const defaults = await this.ensureDefaults(dbClient);
        if (!resolvedEntityId) resolvedEntityId = defaults.legalEntityId;

        const [created] = await dbClient
          .insert(departments)
          .values({
            id: newId,
            departmentCode: req.departmentCode,
            departmentName: req.departmentName,
            description: req.description,
            costCenterCode: req.costCenterCode,
            legalEntityId: resolvedEntityId,
            parentDepartmentId: req.parentDepartmentId || null,
            leadEmail: req.leadEmail || null,
            status: 'ACTIVE',
            metadata: {}
          })
          .returning();

        const [entity] = await dbClient.select().from(legalEntities).where(eq(legalEntities.id, resolvedEntityId)).limit(1);

        if (created) {
          return {
            id: created.id,
            departmentCode: created.departmentCode,
            departmentName: created.departmentName,
            description: created.description,
            costCenterCode: created.costCenterCode,
            legalEntityId: created.legalEntityId,
            legalEntityName: entity?.entityName ?? 'Doc Search Inc.',
            parentDepartmentId: created.parentDepartmentId ?? undefined,
            leadEmail: created.leadEmail ?? undefined,
            employeeCount: 0,
            status: created.status as any,
            metadata: (created.metadata as Record<string, unknown>) ?? {},
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString()
          };
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] createDepartment DB error:', err);
      }
    }
    return {
      id: newId,
      departmentCode: req.departmentCode,
      departmentName: req.departmentName,
      description: req.description,
      costCenterCode: req.costCenterCode,
      legalEntityId: resolvedEntityId,
      legalEntityName: 'Doc Search Inc.',
      parentDepartmentId: req.parentDepartmentId,
      leadEmail: req.leadEmail,
      employeeCount: 0,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // --- DESIGNATIONS ---
  async getDesignations(dbClient = getDatabase()): Promise<DesignationDto[]> {
    if (dbClient) {
      try {
        await this.ensureDefaults(dbClient);
        const rows = await dbClient
          .select({
            id: designations.id,
            designationCode: designations.designationCode,
            title: designations.title,
            bandLevel: designations.bandLevel,
            departmentId: designations.departmentId,
            departmentName: departments.departmentName,
            jobFamily: designations.jobFamily,
            isExecutive: designations.isExecutive,
            status: designations.status,
            metadata: designations.metadata,
            createdAt: designations.createdAt,
            updatedAt: designations.updatedAt
          })
          .from(designations)
          .leftJoin(departments, eq(designations.departmentId, departments.id))
          .orderBy(desc(designations.createdAt));

        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            designationCode: r.designationCode,
            title: r.title,
            bandLevel: r.bandLevel,
            departmentId: r.departmentId ?? undefined,
            departmentName: r.departmentName ?? undefined,
            jobFamily: r.jobFamily,
            isExecutive: r.isExecutive,
            status: r.status,
            metadata: r.metadata ?? {},
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
          }));
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] getDesignations DB error:', err);
      }
    }
    return [
      {
        id: 'f1a22222-2222-4222-8222-222222222222',
        designationCode: 'DES-CLIN-LEAD',
        title: 'Clinical Operations Lead',
        bandLevel: 'SENIOR',
        departmentId: 'd1a22222-2222-4222-8222-222222222222',
        departmentName: 'Clinical & Hospital Operations',
        jobFamily: 'CLINICAL_OPERATIONS',
        isExecutive: false,
        status: 'ACTIVE',
        metadata: {},
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      }
    ];
  }

  async createDesignation(req: CreateDesignationRequest, dbClient = getDatabase()): Promise<DesignationDto> {
    const newId = crypto.randomUUID();
    if (dbClient) {
      try {
        const [created] = await dbClient
          .insert(designations)
          .values({
            id: newId,
            designationCode: req.designationCode,
            title: req.title,
            bandLevel: req.bandLevel,
            departmentId: req.departmentId || null,
            jobFamily: req.jobFamily,
            isExecutive: req.isExecutive,
            status: 'ACTIVE',
            metadata: {}
          })
          .returning();

        let deptName: string | undefined;
        if (req.departmentId) {
          const [dept] = await dbClient.select().from(departments).where(eq(departments.id, req.departmentId)).limit(1);
          deptName = dept?.departmentName;
        }

        if (created) {
          return {
            id: created.id,
            designationCode: created.designationCode,
            title: created.title,
            bandLevel: created.bandLevel as any,
            departmentId: created.departmentId ?? undefined,
            departmentName: deptName,
            jobFamily: created.jobFamily,
            isExecutive: created.isExecutive,
            status: created.status as any,
            metadata: (created.metadata as Record<string, unknown>) ?? {},
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString()
          };
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] createDesignation DB error:', err);
      }
    }
    return {
      id: newId,
      designationCode: req.designationCode,
      title: req.title,
      bandLevel: req.bandLevel,
      departmentId: req.departmentId,
      jobFamily: req.jobFamily,
      isExecutive: req.isExecutive,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // --- CORPORATE POLICIES ---
  async getPolicies(dbClient = getDatabase()): Promise<CorporatePolicyDto[]> {
    if (dbClient) {
      try {
        const rows = await dbClient.select().from(corporatePolicies).orderBy(desc(corporatePolicies.createdAt));
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            policyCode: r.policyCode,
            title: r.title,
            category: r.category,
            versionReference: r.versionReference,
            legalEntityId: r.legalEntityId ?? undefined,
            legalEntityName: 'Doc Search Inc.',
            approvedByBoardAt: r.approvedByBoardAt instanceof Date ? r.approvedByBoardAt.toISOString() : undefined,
            reviewCycleMonths: r.reviewCycleMonths,
            nextReviewDue: r.nextReviewDue instanceof Date ? r.nextReviewDue.toISOString() : String(r.nextReviewDue),
            documentReference: r.documentReference,
            status: r.status,
            ownerEmail: r.ownerEmail,
            metadata: r.metadata ?? {},
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
          }));
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] getPolicies DB error:', err);
      }
    }
    return [
      {
        id: 'p1a11111-1111-4111-8111-111111111111',
        policyCode: 'POL-CORP-GOV-001',
        title: 'Global Corporate Governance & Board Code of Conduct',
        category: 'BYLAWS',
        versionReference: '2.1.0',
        legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
        legalEntityName: 'Doc Search Inc.',
        approvedByBoardAt: '2025-02-15T00:00:00Z',
        reviewCycleMonths: 12,
        nextReviewDue: '2026-02-15T00:00:00Z',
        documentReference: 'MCA-LEGAL-VAULT/GOV-001-v2.1.pdf',
        status: 'ACTIVE',
        ownerEmail: 'general.counsel@docsearch.internal',
        metadata: {},
        createdAt: '2025-02-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      }
    ];
  }

  // --- COMPLIANCE OFFICERS ---
  async getComplianceOfficers(dbClient = getDatabase()): Promise<ComplianceOfficerDto[]> {
    if (dbClient) {
      try {
        const rows = await dbClient.select().from(complianceOfficers).orderBy(desc(complianceOfficers.createdAt));
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            officerCode: r.officerCode,
            officerRole: r.officerRole,
            employeeId: r.employeeId ?? undefined,
            officerName: r.officerName,
            workEmail: r.workEmail,
            appointmentDate: r.appointmentDate instanceof Date ? r.appointmentDate.toISOString() : String(r.appointmentDate),
            regulatoryAuthorityReference: r.regulatoryAuthorityReference,
            status: r.status,
            metadata: r.metadata ?? {},
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
          }));
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] getComplianceOfficers DB error:', err);
      }
    }
    return [
      {
        id: 'co-001',
        officerCode: 'OFF-COMP-001',
        officerRole: 'CHIEF_COMPLIANCE_OFFICER',
        employeeId: 'e2a22222-2222-4222-8222-222222222222',
        officerName: 'MERAJ SHARIF',
        workEmail: 'founder@docsearch.health',
        appointmentDate: '2025-02-01T00:00:00Z',
        regulatoryAuthorityReference: 'MOHFW-NABH-CERT-8819',
        status: 'ACTIVE',
        metadata: {},
        createdAt: '2025-02-01T00:00:00Z',
        updatedAt: '2026-09-05T00:00:00Z'
      }
    ];
  }

  // --- BOARD MEMBERS ---
  async getBoardMembers(dbClient = getDatabase()): Promise<BoardMemberDto[]> {
    if (dbClient) {
      try {
        const rows = await dbClient.select().from(boardMembers).orderBy(desc(boardMembers.createdAt));
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            memberCode: r.memberCode,
            fullName: r.fullName,
            roleType: r.roleType,
            representingEntity: r.representingEntity,
            votingStatus: r.votingStatus,
            termStartDate: r.termStartDate instanceof Date ? r.termStartDate.toISOString() : String(r.termStartDate),
            termEndDate: r.termEndDate ? (r.termEndDate instanceof Date ? r.termEndDate.toISOString() : String(r.termEndDate)) : undefined,
            status: r.status,
            metadata: r.metadata ?? {},
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
          }));
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] getBoardMembers DB error:', err);
      }
    }
    return [
      {
        id: 'bm-001',
        memberCode: 'BM-2025-01',
        fullName: 'MERAJ SHARIF',
        roleType: 'EXECUTIVE_DIRECTOR',
        representingEntity: 'Doc Search Global Inc.',
        votingStatus: 'VOTING',
        termStartDate: '2025-01-01T00:00:00Z',
        status: 'ACTIVE',
        metadata: { title: 'Founder & CEO', isProtectedFounder: true, immutableShield: true },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-09-09T00:00:00Z'
      }
    ];
  }

  // --- GOVERNANCE EVENTS ---
  async getGovernanceEvents(dbClient = getDatabase()): Promise<GovernanceEventDto[]> {
    if (dbClient) {
      try {
        const rows = await dbClient.select().from(governanceEvents).orderBy(desc(governanceEvents.scheduledAt));
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            eventCode: r.eventCode,
            eventType: r.eventType,
            title: r.title,
            scheduledAt: r.scheduledAt instanceof Date ? r.scheduledAt.toISOString() : String(r.scheduledAt),
            completedAt: r.completedAt ? (r.completedAt instanceof Date ? r.completedAt.toISOString() : String(r.completedAt)) : undefined,
            organizerEmail: r.organizerEmail,
            minutesReference: r.minutesReference ?? undefined,
            resolutionReference: r.resolutionReference ?? undefined,
            status: r.status,
            metadata: r.metadata ?? {},
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
          }));
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] getGovernanceEvents DB error:', err);
      }
    }
    return [
      {
        id: 'ge-001',
        eventCode: 'GOV-EVT-2026-Q1',
        eventType: 'BOARD_MEETING',
        title: 'Q1 Comprehensive Clinical Governance & Safety Review',
        scheduledAt: '2026-03-31T10:00:00Z',
        organizerEmail: 'board.governance@docsearch.internal',
        status: 'SCHEDULED',
        metadata: {},
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      }
    ];
  }

  // --- AUDIT TRACES ---
  async getAuditTraces(dbClient = getDatabase()): Promise<CompanyAuditTraceDto[]> {
    if (dbClient) {
      try {
        const rows = await dbClient.select().from(companyAuditTraces).orderBy(desc(companyAuditTraces.occurredAt)).limit(50);
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            traceId: r.traceId,
            actorEmail: r.actorEmail,
            action: r.action,
            entityReference: r.entityReference,
            operationStatus: r.operationStatus as any,
            occurredAt: r.occurredAt instanceof Date ? r.occurredAt.toISOString() : String(r.occurredAt),
            reason: (r.metadata?.reason as string) || 'Governance audit event logged',
            metadata: (r.metadata as Record<string, unknown>) ?? {}
          }));
        }
      } catch (err) {
        console.error('[CompanyAdminRepository] getAuditTraces DB error:', err);
      }
    }
    return [
      {
        id: 'tr-001',
        traceId: 'tr-corp-1001',
        actorEmail: 'founder@docsearch.health',
        action: 'PLATFORM_BOOTSTRAP',
        entityReference: 'GLOBAL-SYSTEM',
        operationStatus: 'SUCCESS',
        occurredAt: new Date().toISOString(),
        reason: 'Initial platform bootstrap and entity initialization',
        metadata: {}
      }
    ];
  }
}

export const companyAdminRepository = new CompanyAdminRepository();
