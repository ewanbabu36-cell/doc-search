import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../plugins/auth-guard.js';
import { horizontalSocketGateway } from '../../services/realtime/HorizontalSocketGateway.js';
import {
  getDatabase,
  prescriptionTemplates,
  vacutainerTubeCatalog,
  inpatientWards,
  diagnosticHealthPackages,
  medicationCatalog,
  investigationCatalog,
  insurancePayers,
  surgicalProcedures,
  corporateTpaClients,
  eq,
  desc,
  ilike,
  or,
  and
} from '@docsearch/database';

export const masterCatalogsRoutes: FastifyPluginAsync = async (fastify) => {
  // Guard all company master routes with authentication
  fastify.addHook('preHandler', authenticate);

  const notifyCatalogMutation = (entity: string) => {
    void horizontalSocketGateway.broadcast('*', 'PARTNER_CONFIG_MUTATED', {
      type: 'MASTER_CATALOG_MUTATED',
      entity,
      timestamp: new Date().toISOString()
    });
  };

  /**
   * 1. PRESCRIPTION TEMPLATES MASTER (CRUD)
   */
  fastify.get('/api/v1/company/masters/prescription-templates', async () => {
    const db = getDatabase();
    if (!db) return { success: true, data: [] };
    const items = await db
      .select()
      .from(prescriptionTemplates)
      .orderBy(desc(prescriptionTemplates.createdAt));
    return { success: true, data: items };
  });

  const CreateTemplateSchema = z.object({
    templateCode: z.string().min(2),
    name: z.string().min(2),
    icon: z.string().default('🩺'),
    category: z.string().default('GENERAL_MEDICINE'),
    chiefComplaint: z.string().optional(),
    diagnosis: z.string().min(2),
    icd10Code: z.string().optional(),
    treatmentPlan: z.string().optional(),
    medications: z.array(z.any()).default([]),
    labTests: z.array(z.any()).default([])
  });

  fastify.post('/api/v1/company/masters/prescription-templates', async (request, reply) => {
    const body = CreateTemplateSchema.parse(request.body);
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const tenantId = request.session?.tenantId || '00000000-0000-0000-0000-000000000000';
    const [created] = await db
      .insert(prescriptionTemplates)
      .values({
        tenantId,
        templateCode: body.templateCode,
        name: body.name,
        icon: body.icon,
        category: body.category,
        chiefComplaint: body.chiefComplaint,
        diagnosis: body.diagnosis,
        icd10Code: body.icd10Code,
        treatmentPlan: body.treatmentPlan,
        medications: body.medications,
        labTests: body.labTests,
        isActive: true
      })
      .returning();

    notifyCatalogMutation('PRESCRIPTION_TEMPLATE');
    notifyCatalogMutation('VACUTAINER_TUBE');
    notifyCatalogMutation('WARD_CLASS');
    notifyCatalogMutation('DIAGNOSTIC_PACKAGE');
    return reply.status(201).send({ success: true, data: created });
  });

  fastify.patch('/api/v1/company/masters/prescription-templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const [updated] = await db
      .update(prescriptionTemplates)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(prescriptionTemplates.id, id))
      .returning();

    notifyCatalogMutation('PRESCRIPTION_TEMPLATE');
    notifyCatalogMutation('VACUTAINER_TUBE');
    notifyCatalogMutation('WARD_CLASS');
    notifyCatalogMutation('DIAGNOSTIC_PACKAGE');
    return { success: true, data: updated };
  });

  fastify.delete('/api/v1/company/masters/prescription-templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    await db.delete(prescriptionTemplates).where(eq(prescriptionTemplates.id, id));
    notifyCatalogMutation('PRESCRIPTION_TEMPLATE');
    return { success: true, message: 'Prescription template deleted successfully' };
  });

  /**
   * 2. VACUTAINER TUBE MASTER (CRUD)
   */
  fastify.get('/api/v1/company/masters/vacutainer-tubes', async () => {
    const db = getDatabase();
    if (!db) return { success: true, data: [] };
    const items = await db
      .select()
      .from(vacutainerTubeCatalog)
      .orderBy(desc(vacutainerTubeCatalog.createdAt));
    return { success: true, data: items };
  });

  const CreateTubeSchema = z.object({
    tubeKey: z.string().min(2),
    name: z.string().min(2),
    additive: z.string().min(2),
    colorName: z.string().min(2),
    capHex: z.string().default('#8B5CF6'),
    glowHex: z.string().default('#A78BFA'),
    volume: z.string().default('3.0 mL'),
    inversions: z.string().default('8 - 10 times'),
    commonTests: z.array(z.any()).default([]),
    keywords: z.array(z.string()).default([])
  });

  fastify.post('/api/v1/company/masters/vacutainer-tubes', async (request, reply) => {
    const body = CreateTubeSchema.parse(request.body);
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const [created] = await db
      .insert(vacutainerTubeCatalog)
      .values({
        tubeKey: body.tubeKey,
        name: body.name,
        additive: body.additive,
        colorName: body.colorName,
        capHex: body.capHex,
        glowHex: body.glowHex,
        volume: body.volume,
        inversions: body.inversions,
        commonTests: body.commonTests,
        keywords: body.keywords,
        isActive: true
      })
      .returning();

    return reply.status(201).send({ success: true, data: created });
  });

  fastify.patch('/api/v1/company/masters/vacutainer-tubes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const [updated] = await db
      .update(vacutainerTubeCatalog)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(vacutainerTubeCatalog.id, id))
      .returning();

    return { success: true, data: updated };
  });

  fastify.delete('/api/v1/company/masters/vacutainer-tubes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    await db.delete(vacutainerTubeCatalog).where(eq(vacutainerTubeCatalog.id, id));
    notifyCatalogMutation('VACUTAINER_TUBE');
    return { success: true, message: 'Vacutainer tube deleted successfully' };
  });

  /**
   * 3. WARD & BED CLASS MASTER (CRUD)
   */
  fastify.get('/api/v1/company/masters/ward-classes', async () => {
    const db = getDatabase();
    if (!db) return { success: true, data: [] };
    const items = await db
      .select()
      .from(inpatientWards)
      .orderBy(desc(inpatientWards.createdAt));
    return { success: true, data: items };
  });

  fastify.post('/api/v1/company/masters/ward-classes', async (request, reply) => {
    const body = request.body as any;
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const tenantId = request.session?.tenantId || '1e72b864-920a-c07d-98c5-183d3eb50428';
    const branchId = (request.session as any)?.branchId || '2f91a36c-734d-4c67-91b0-231e4090c33d';
    const partnerId = (request.session as any)?.partnerId || tenantId;
    const organizationId = tenantId;
    const unitId = body.unitId || '27593a2b-9298-429a-b498-7d21327de198';

    const [created] = await db
      .insert(inpatientWards)
      .values({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        unitId,
        wardCode: body.wardCode || `WRD-${Date.now().toString().slice(-4)}`,
        wardName: body.wardName || 'Standard Ward',
        wardType: body.wardType || 'GENERAL',
        careLevel: 'TERTIARY_CARE',
        genderPolicy: 'ALL',
        building: body.building || 'Main Block',
        floor: body.floorNumber || body.floor || '1st Floor',
        wing: body.wingName || body.wing || 'Main Wing',
        nursingStationName: body.nursingStationName || 'Station 1',
        totalBeds: Number(body.totalBeds) || 10,
        activeBeds: Number(body.totalBeds) || 10,
        occupiedBeds: 0,
        blockedBeds: 0,
        cleaningBeds: 0,
        isActive: true,
        metadata: {
          baseDailyTariff: body.baseDailyTariff || 1500,
          nursingRatio: body.nursingRatio || '1:4',
          hasOxygenSupply: body.hasOxygenSupply ?? true,
          hasBipapVentilator: body.hasBipapVentilator ?? false
        }
      } as any)
      .returning();

    return reply.status(201).send({ success: true, data: created });
  });

  fastify.patch('/api/v1/company/masters/ward-classes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const [updated] = await db
      .update(inpatientWards)
      .set({
        wardName: body.wardName,
        wardType: body.wardType,
        totalBeds: body.totalBeds !== undefined ? Number(body.totalBeds) : undefined,
        metadata: body.metadata,
        updatedAt: new Date()
      })
      .where(eq(inpatientWards.id, id))
      .returning();

    return { success: true, data: updated };
  });

  fastify.delete('/api/v1/company/masters/ward-classes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    await db.delete(inpatientWards).where(eq(inpatientWards.id, id));
    notifyCatalogMutation('WARD_CLASS');
    return { success: true, message: 'Ward class archived successfully' };
  });

  /**
   * 4. DIAGNOSTIC HEALTH PACKAGES MASTER (CRUD)
   */
  fastify.get('/api/v1/company/masters/diagnostic-packages', async () => {
    const db = getDatabase();
    if (!db) return { success: true, data: [] };
    const items = await db
      .select()
      .from(diagnosticHealthPackages)
      .orderBy(desc(diagnosticHealthPackages.createdAt));
    return { success: true, data: items };
  });

  const CreatePackageSchema = z.object({
    packageCode: z.string().min(2),
    packageName: z.string().min(2),
    parametersCount: z.number().int().positive(),
    packageMrp: z.number().positive(),
    bundledTestNames: z.array(z.string()).default([]),
    fastingRequired: z.boolean().default(true),
    vialsRequired: z.array(z.string()).default([])
  });

  fastify.post('/api/v1/company/masters/diagnostic-packages', async (request, reply) => {
    const body = CreatePackageSchema.parse(request.body);
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const tenantId = request.session?.tenantId || '00000000-0000-0000-0000-000000000000';

    const [created] = await db
      .insert(diagnosticHealthPackages)
      .values({
        tenantId,
        packageCode: body.packageCode,
        packageName: body.packageName,
        parametersCount: body.parametersCount,
        packageMrp: body.packageMrp.toString(),
        bundledTestNames: body.bundledTestNames,
        fastingRequired: body.fastingRequired,
        vialsRequired: body.vialsRequired,
        isActive: true
      })
      .returning();

    return reply.status(201).send({ success: true, data: created });
  });

  fastify.patch('/api/v1/company/masters/diagnostic-packages/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const [updated] = await db
      .update(diagnosticHealthPackages)
      .set({
        packageName: body.packageName,
        parametersCount: body.parametersCount !== undefined ? Number(body.parametersCount) : undefined,
        packageMrp: body.packageMrp !== undefined ? body.packageMrp.toString() : undefined,
        bundledTestNames: body.bundledTestNames,
        fastingRequired: body.fastingRequired,
        vialsRequired: body.vialsRequired,
        isActive: body.isActive
      })
      .where(eq(diagnosticHealthPackages.id, id))
      .returning();

    return { success: true, data: updated };
  });

  fastify.delete('/api/v1/company/masters/diagnostic-packages/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    await db.delete(diagnosticHealthPackages).where(eq(diagnosticHealthPackages.id, id));
    notifyCatalogMutation('DIAGNOSTIC_PACKAGE');
    return { success: true, message: 'Diagnostic package deleted successfully' };
  });

  /**
   * 5. NATIONAL FORMULARY / MEDICATION CATALOG (CRUD + Search)
   */
  fastify.get('/api/v1/company/masters/medications', async (request) => {
    const db = getDatabase();
    if (!db) return { success: true, data: [], total: 0 };
    const { q, limit = '100', page = '1' } = (request.query as { q?: string; limit?: string; page?: string }) || {};
    const pageLimit = Math.min(Number(limit) || 100, 500);
    const offset = ((Number(page) || 1) - 1) * pageLimit;

    let query = db.select().from(medicationCatalog);
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      query = query.where(
        or(
          ilike(medicationCatalog.brandName, searchTerm),
          ilike(medicationCatalog.genericName, searchTerm),
          ilike(medicationCatalog.medicationCode, searchTerm),
          ilike(medicationCatalog.category, searchTerm)
        )
      ) as any;
    }

    const items = await query.orderBy(desc(medicationCatalog.createdAt)).limit(pageLimit).offset(offset);
    return { success: true, data: items, total: items.length };
  });

  const CreateMedicationSchema = z.object({
    medicationCode: z.string().min(2),
    brandName: z.string().min(2),
    genericName: z.string().min(2),
    strength: z.string().min(1),
    dosageForm: z.string().default('TABLET'),
    manufacturer: z.string().min(2),
    category: z.string().default('GENERAL'),
    route: z.string().default('ORAL'),
    controlledMedication: z.boolean().default(false),
    prescriptionRequired: z.boolean().default(true),
    metadata: z.record(z.any()).default({})
  });

  fastify.post('/api/v1/company/masters/medications', async (request, reply) => {
    const body = CreateMedicationSchema.parse(request.body);
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const tenantId = request.session?.tenantId || '1e72b864-920a-c07d-98c5-183d3eb50428';
    const partnerId = (request.session as any)?.partnerId || '6d29e8f7-ca9e-48a0-a1d0-4a8108e10c76';
    const organizationId = tenantId;

    const [created] = await db
      .insert(medicationCatalog)
      .values({
        tenantId,
        partnerId,
        organizationId,
        medicationCode: body.medicationCode,
        brandName: body.brandName,
        genericName: body.genericName,
        strength: body.strength,
        dosageForm: body.dosageForm,
        manufacturer: body.manufacturer,
        category: body.category,
        route: body.route,
        controlledMedication: body.controlledMedication,
        prescriptionRequired: body.prescriptionRequired,
        metadata: body.metadata,
        status: 'ACTIVE'
      })
      .returning();

    notifyCatalogMutation('MEDICATION');
    return reply.status(201).send({ success: true, data: created });
  });

  fastify.patch('/api/v1/company/masters/medications/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const [updated] = await db
      .update(medicationCatalog)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(medicationCatalog.id, id))
      .returning();

    notifyCatalogMutation('MEDICATION');
    return { success: true, data: updated };
  });

  fastify.delete('/api/v1/company/masters/medications/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    await db.delete(medicationCatalog).where(eq(medicationCatalog.id, id));
    notifyCatalogMutation('MEDICATION');
    return { success: true, message: 'Medication removed from national formulary' };
  });

  /**
   * 6. INVESTIGATION & PATHOLOGY CATALOG (CRUD + Search)
   */
  fastify.get('/api/v1/company/masters/investigations', async (request) => {
    const db = getDatabase();
    if (!db) return { success: true, data: [], total: 0 };
    const { q, department, limit = '200' } = (request.query as { q?: string; department?: string; limit?: string }) || {};
    const pageLimit = Math.min(Number(limit) || 200, 500);

    let query = db.select().from(investigationCatalog);
    const conditions = [];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(investigationCatalog.testName, searchTerm),
          ilike(investigationCatalog.testCode, searchTerm),
          ilike(investigationCatalog.shortName, searchTerm),
          ilike(investigationCatalog.department, searchTerm)
        )
      );
    }

    if (department && department !== 'ALL') {
      conditions.push(ilike(investigationCatalog.department, `%${department}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const items = await query.orderBy(desc(investigationCatalog.createdAt)).limit(pageLimit);
    return { success: true, data: items, total: items.length };
  });

  const CreateInvestigationSchema = z.object({
    testCode: z.string().min(2),
    testName: z.string().min(2),
    shortName: z.string().optional(),
    category: z.string().default('BIOCHEMISTRY'),
    department: z.string().default('Clinical Pathology'),
    specimenType: z.string().default('WHOLE_BLOOD'),
    clinicalDescription: z.string().optional(),
    fastingRequired: z.boolean().default(false),
    turnaroundTargetHours: z.number().default(24),
    metadata: z.record(z.any()).default({})
  });

  fastify.post('/api/v1/company/masters/investigations', async (request, reply) => {
    const body = CreateInvestigationSchema.parse(request.body);
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const tenantId = request.session?.tenantId || '1e72b864-920a-c07d-98c5-183d3eb50428';
    const partnerId = (request.session as any)?.partnerId || '6d29e8f7-ca9e-48a0-a1d0-4a8108e10c76';
    const organizationId = tenantId;

    const [created] = await db
      .insert(investigationCatalog)
      .values({
        tenantId,
        partnerId,
        organizationId,
        testCode: body.testCode,
        testName: body.testName,
        shortName: body.shortName,
        category: body.category,
        department: body.department,
        specimenType: body.specimenType,
        clinicalDescription: body.clinicalDescription,
        fastingRequired: body.fastingRequired,
        turnaroundTargetHours: body.turnaroundTargetHours,
        metadata: body.metadata,
        status: 'ACTIVE'
      })
      .returning();

    notifyCatalogMutation('INVESTIGATION');
    return reply.status(201).send({ success: true, data: created });
  });

  fastify.patch('/api/v1/company/masters/investigations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const [updated] = await db
      .update(investigationCatalog)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(investigationCatalog.id, id))
      .returning();

    notifyCatalogMutation('INVESTIGATION');
    return { success: true, data: updated };
  });

  fastify.delete('/api/v1/company/masters/investigations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    await db.delete(investigationCatalog).where(eq(investigationCatalog.id, id));
    notifyCatalogMutation('INVESTIGATION');
    return { success: true, message: 'Investigation removed from master catalog' };
  });

  /**
   * 7. INSURANCE PAYERS & AYUSHMAN PM-JAY TARIFFS (CRUD)
   */
  fastify.get('/api/v1/company/masters/insurance-payers', async () => {
    const db = getDatabase();
    if (!db) return { success: true, data: [] };
    const items = await db.select().from(insurancePayers).orderBy(desc(insurancePayers.createdAt));
    return { success: true, data: items };
  });

  const CreatePayerSchema = z.object({
    payerCode: z.string().min(2),
    payerName: z.string().min(2),
    payerType: z.string().default('COMMERCIAL_INSURANCE'),
    tpaName: z.string().optional(),
    electronicPayerId: z.string().optional(),
    contactPerson: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    metadata: z.record(z.any()).default({})
  });

  fastify.post('/api/v1/company/masters/insurance-payers', async (request, reply) => {
    const body = CreatePayerSchema.parse(request.body);
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const tenantId = request.session?.tenantId || '1e72b864-920a-c07d-98c5-183d3eb50428';
    const partnerId = (request.session as any)?.partnerId || '6d29e8f7-ca9e-48a0-a1d0-4a8108e10c76';
    const organizationId = tenantId;

    const [created] = await db
      .insert(insurancePayers)
      .values({
        tenantId,
        partnerId,
        organizationId,
        payerCode: body.payerCode,
        payerName: body.payerName,
        payerType: body.payerType,
        tpaName: body.tpaName,
        electronicPayerId: body.electronicPayerId,
        contactPerson: body.contactPerson,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        status: 'ACTIVE',
        metadata: body.metadata
      })
      .returning();

    notifyCatalogMutation('INSURANCE_PAYER');
    return reply.status(201).send({ success: true, data: created });
  });

  fastify.patch('/api/v1/company/masters/insurance-payers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const [updated] = await db
      .update(insurancePayers)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(insurancePayers.id, id))
      .returning();

    notifyCatalogMutation('INSURANCE_PAYER');
    return { success: true, data: updated };
  });

  fastify.delete('/api/v1/company/masters/insurance-payers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    await db.delete(insurancePayers).where(eq(insurancePayers.id, id));
    notifyCatalogMutation('INSURANCE_PAYER');
    return { success: true, message: 'Insurance payer deleted successfully' };
  });

  /**
   * 8. DAYCARE PROCEDURES & SURGICAL TARIFFS (CRUD)
   */
  fastify.get('/api/v1/company/masters/daycare-procedures', async () => {
    const db = getDatabase();
    if (!db) return { success: true, data: [] };
    const items = await db.select().from(surgicalProcedures).orderBy(desc(surgicalProcedures.createdAt));
    return { success: true, data: items };
  });

  const CreateProcedureSchema = z.object({
    procedureCode: z.string().min(2),
    procedureName: z.string().min(2),
    specialty: z.string().default('General Medicine'),
    category: z.string().default('DAYCARE'),
    defaultDurationMinutes: z.number().default(15),
    baseProcedureCharge: z.number().or(z.string()).default('150.00'),
    metadata: z.record(z.any()).default({})
  });

  fastify.post('/api/v1/company/masters/daycare-procedures', async (request, reply) => {
    const body = CreateProcedureSchema.parse(request.body);
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const tenantId = request.session?.tenantId || '1e72b864-920a-c07d-98c5-183d3eb50428';
    const partnerId = (request.session as any)?.partnerId || '6d29e8f7-ca9e-48a0-a1d0-4a8108e10c76';
    const organizationId = tenantId;
    const branchId = (request.session as any)?.branchId || '2f91a36c-734d-4c67-91b0-231e4090c33d';

    const [created] = await db
      .insert(surgicalProcedures)
      .values({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        procedureCode: body.procedureCode,
        procedureName: body.procedureName,
        specialty: body.specialty,
        category: body.category,
        defaultDurationMinutes: body.defaultDurationMinutes,
        baseProcedureCharge: body.baseProcedureCharge.toString(),
        isActive: true,
        metadata: body.metadata
      })
      .returning();

    notifyCatalogMutation('DAYCARE_PROCEDURE');
    return reply.status(201).send({ success: true, data: created });
  });

  fastify.patch('/api/v1/company/masters/daycare-procedures/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const [updated] = await db
      .update(surgicalProcedures)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(surgicalProcedures.id, id))
      .returning();

    notifyCatalogMutation('DAYCARE_PROCEDURE');
    return { success: true, data: updated };
  });

  fastify.delete('/api/v1/company/masters/daycare-procedures/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    await db.delete(surgicalProcedures).where(eq(surgicalProcedures.id, id));
    notifyCatalogMutation('DAYCARE_PROCEDURE');
    return { success: true, message: 'Daycare procedure deleted successfully' };
  });

  /**
   * 9. CORPORATE & TPA CLIENT ACCOUNTS MASTER (CRUD)
   */
  fastify.get('/api/v1/company/masters/corporate-clients', async () => {
    const db = getDatabase();
    if (!db) return { success: true, data: [] };
    const items = await db.select().from(corporateTpaClients).orderBy(desc(corporateTpaClients.createdAt));
    return { success: true, data: items };
  });

  const CreateCorporateSchema = z.object({
    clientCode: z.string().min(2),
    clientName: z.string().min(2),
    clientType: z.string().default('CORPORATE_TPA'),
    creditLimit: z.number().or(z.string()).default('1000000'),
    nhcxPayerCode: z.string().optional(),
    contractValidUntil: z.string().optional()
  });

  fastify.post('/api/v1/company/masters/corporate-clients', async (request, reply) => {
    const body = CreateCorporateSchema.parse(request.body);
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const tenantId = request.session?.tenantId || '1e72b864-920a-c07d-98c5-183d3eb50428';
    const contractDate = body.contractValidUntil ? new Date(body.contractValidUntil) : new Date(Date.now() + 365 * 24 * 3600 * 1000);

    const [created] = await db
      .insert(corporateTpaClients)
      .values({
        tenantId,
        clientCode: body.clientCode,
        clientName: body.clientName,
        clientType: body.clientType,
        creditLimit: body.creditLimit.toString(),
        nhcxPayerCode: body.nhcxPayerCode,
        contractValidUntil: contractDate
      })
      .returning();

    notifyCatalogMutation('CORPORATE_CLIENT');
    return reply.status(201).send({ success: true, data: created });
  });

  fastify.patch('/api/v1/company/masters/corporate-clients/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    const [updated] = await db
      .update(corporateTpaClients)
      .set({
        clientName: body.clientName,
        creditLimit: body.creditLimit ? body.creditLimit.toString() : undefined,
        outstandingReceivable: body.outstandingReceivable ? body.outstandingReceivable.toString() : undefined,
        nhcxPayerCode: body.nhcxPayerCode
      })
      .where(eq(corporateTpaClients.id, id))
      .returning();

    notifyCatalogMutation('CORPORATE_CLIENT');
    return { success: true, data: updated };
  });

  fastify.delete('/api/v1/company/masters/corporate-clients/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDatabase();
    if (!db) return reply.status(500).send({ success: false, error: 'Database unavailable' });

    await db.delete(corporateTpaClients).where(eq(corporateTpaClients.id, id));
    notifyCatalogMutation('CORPORATE_CLIENT');
    return { success: true, message: 'Corporate client removed successfully' };
  });
};
