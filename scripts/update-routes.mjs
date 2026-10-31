import fs from 'node:fs';

const filePath = 'apps/api-gateway/src/routes/partner/clinical-workflow.routes.ts';
let content = fs.readFileSync(filePath, 'utf8');

const addition = `
  // ==========================================
  // 17. OPD CORE: CLINICAL COCKPIT PRESCRIPTION TEMPLATES
  // ==========================================

  const listTemplatesHandler = async (_request: any) => {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(prescriptionTemplates)
      .where(eq(prescriptionTemplates.isActive, true))
      .orderBy(desc(prescriptionTemplates.createdAt));

    return {
      success: true,
      data: rows.map((r: any) => ({
        id: r.templateCode || r.id,
        dbId: r.id,
        name: r.name,
        icon: r.icon || '🩺',
        category: r.category,
        chiefComplaint: r.chiefComplaint || '',
        diagnosis: r.diagnosis,
        icd10Code: r.icd10Code || '',
        treatmentPlan: r.treatmentPlan || '',
        medications: Array.isArray(r.medications) ? r.medications : [],
        labTests: Array.isArray(r.labTests) ? r.labTests : []
      }))
    };
  };

  fastify.get('/api/v1/partner/clinical/prescription-templates', listTemplatesHandler);
  fastify.get('/api/v1/clinical/prescription-templates', listTemplatesHandler);

  fastify.post(
    '/api/v1/partner/clinical/prescription-templates',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'create')]
    },
    async (request, reply) => {
      const db = getDatabase();
      const body = request.body as any;
      const tenantId = request.session?.tenantId || '11111111-1111-4000-8000-000000000001';
      const doctorId = request.session?.userId;

      const templateCode = body.templateCode || \`tmpl-\${Date.now().toString(36)}\`;
      const [newTmpl] = await db
        .insert(prescriptionTemplates)
        .values({
          tenantId,
          doctorId,
          templateCode,
          name: body.name,
          icon: body.icon || '🩺',
          category: body.category || 'General Medicine',
          chiefComplaint: body.chiefComplaint || '',
          diagnosis: body.diagnosis,
          icd10Code: body.icd10Code || '',
          treatmentPlan: body.treatmentPlan || '',
          medications: body.medications || [],
          labTests: body.labTests || [],
          isActive: true
        })
        .returning();

      reply.status(201);
      return { success: true, data: newTmpl };
    }
  );

  fastify.delete(
    '/api/v1/partner/clinical/prescription-templates/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:consultations', 'delete')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const db = getDatabase();
      await db
        .update(prescriptionTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(prescriptionTemplates.id, id));

      return { success: true, message: 'Prescription template deactivated successfully.' };
    }
  );
};
`;

const lastClosing = content.lastIndexOf('};');
if (lastClosing !== -1) {
  content = content.slice(0, lastClosing) + addition;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated clinical-workflow.routes.ts');
} else {
  console.error('Could not find closing brace');
}
