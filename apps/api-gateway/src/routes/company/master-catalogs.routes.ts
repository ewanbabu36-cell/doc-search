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
  eq,
  desc
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
};
