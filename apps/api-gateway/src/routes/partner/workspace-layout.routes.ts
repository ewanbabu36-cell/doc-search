import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase, userWorkspaceLayouts, eq, and } from '@docsearch/database';

export const WorkspaceLayoutUpdateSchema = z.object({
  activePresetId: z.string().trim().optional().default('CLINICAL_DEFAULT'),
  dockSlots: z.array(z.any()).optional().default([]),
  headerSlots: z.array(z.any()).optional().default([]),
  customFolders: z.array(z.any()).optional().default([]),
  drawerPinnedIds: z.array(z.string()).optional().default([]),
  themeVariant: z.string().trim().optional().default('LIQUID_GLASS_DARK'),
});

const DEFAULT_CLINICAL_DOCK_SLOTS = [
  { id: 'opd_queue', label: 'OPD Queue', icon: 'Stethoscope', jewelColor: 'sapphire', route: '/partner/clinical/consultations', badgeTelemetryKey: 'waiting_patients' },
  { id: 'emergency_er', label: 'Emergency ER', icon: 'HeartPulse', jewelColor: 'ruby', route: '/partner/emergency', badgeTelemetryKey: 'critical_triage' },
  { id: 'pharmacy_pos', label: 'Pharmacy POS', icon: 'Pill', jewelColor: 'emerald', route: '/partner/pharmacy', badgeTelemetryKey: 'schedule_h1' },
  { id: 'cashier_desk', label: 'Cashier Desk', icon: 'CreditCard', jewelColor: 'amber', route: '/partner/billing', badgeTelemetryKey: 'shift_collection' },
];

export const workspaceLayoutRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/partner/workspace/layout', async (request, reply) => {
    try {
      const session = (request as any).session;
      const tenantId = (request.headers['x-tenant-id'] as string) || session?.tenantId || '00000000-0000-0000-0000-000000000001';
      const userId = (request.headers['x-user-id'] as string) || session?.userId || session?.actorId || '00000000-0000-0000-0000-000000000002';

      const db = getDatabase();
      const existing = await db
        .select()
        .from(userWorkspaceLayouts)
        .where(
          and(
            eq(userWorkspaceLayouts.tenantId, tenantId),
            eq(userWorkspaceLayouts.userId, userId)
          )
        )
        .limit(1);

      if (existing && existing.length > 0 && existing[0]) {
        return {
          success: true,
          data: existing[0],
        };
      }

      // Return role-tailored default layout
      const defaultLayout = {
        tenantId,
        userId,
        activePresetId: 'CLINICAL_DEFAULT',
        dockSlots: DEFAULT_CLINICAL_DOCK_SLOTS,
        headerSlots: [
          { id: 'global_search', label: 'Global Patient Search', icon: 'Search' },
          { id: 'emergency_broadcast', label: 'Code Red Broadcast', icon: 'AlertTriangle' }
        ],
        customFolders: [],
        drawerPinnedIds: ['opd_queue', 'emergency_er', 'pharmacy_pos', 'cashier_desk'],
        themeVariant: 'LIQUID_GLASS_DARK',
      };

      return {
        success: true,
        data: defaultLayout,
      };
    } catch (err: any) {
      fastify.log.error(err, 'Failed to fetch workspace layout');
      return reply.status(500).send({
        success: false,
        error: { code: 'LAYOUT_FETCH_FAILED', message: err.message },
      });
    }
  });

  fastify.put('/api/v1/partner/workspace/layout', async (request, reply) => {
    try {
      const session = (request as any).session;
      const tenantId = (request.headers['x-tenant-id'] as string) || session?.tenantId || '00000000-0000-0000-0000-000000000001';
      const userId = (request.headers['x-user-id'] as string) || session?.userId || session?.actorId || '00000000-0000-0000-0000-000000000002';

      const body = WorkspaceLayoutUpdateSchema.parse(request.body || {});

      const db = getDatabase();
      const existing = await db
        .select()
        .from(userWorkspaceLayouts)
        .where(
          and(
            eq(userWorkspaceLayouts.tenantId, tenantId),
            eq(userWorkspaceLayouts.userId, userId)
          )
        )
        .limit(1);

      let savedRecord;
      const current = existing && existing.length > 0 ? existing[0] : undefined;
      if (current) {
        const updated = await db
          .update(userWorkspaceLayouts)
          .set({
            activePresetId: body.activePresetId,
            dockSlots: body.dockSlots,
            headerSlots: body.headerSlots,
            customFolders: body.customFolders,
            drawerPinnedIds: body.drawerPinnedIds,
            themeVariant: body.themeVariant,
            updatedAt: new Date(),
          })
          .where(eq(userWorkspaceLayouts.id, current.id))
          .returning();
        savedRecord = updated[0];
      } else {
        const inserted = await db
          .insert(userWorkspaceLayouts)
          .values({
            tenantId,
            userId,
            activePresetId: body.activePresetId,
            dockSlots: body.dockSlots,
            headerSlots: body.headerSlots,
            customFolders: body.customFolders,
            drawerPinnedIds: body.drawerPinnedIds,
            themeVariant: body.themeVariant,
          })
          .returning();
        savedRecord = inserted[0];
      }

      return {
        success: true,
        data: savedRecord,
      };
    } catch (err: any) {
      fastify.log.error(err, 'Failed to save workspace layout');
      return reply.status(400).send({
        success: false,
        error: { code: 'LAYOUT_SAVE_FAILED', message: err.message },
      });
    }
  });
};
