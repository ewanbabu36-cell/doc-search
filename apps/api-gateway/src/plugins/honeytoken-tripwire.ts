import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import crypto from 'node:crypto';
import { getDatabase, sql } from '@docsearch/database';

export interface HoneytokenIncidentEvent {
  id: string;
  trapId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  clientIp: string;
  queryContext: string;
  capturedEvidence: any;
  tripTimestamp: string;
}

export const honeytokenRingBuffer: HoneytokenIncidentEvent[] = [];

export function pushHoneytokenIncident(incident: HoneytokenIncidentEvent) {
  honeytokenRingBuffer.unshift(incident);
  if (honeytokenRingBuffer.length > 50) {
    honeytokenRingBuffer.pop();
  }
}

export const honeytokenTripwirePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    try {
      const url = request.url;
      const body = request.body as any;
      const bodyStr = body ? JSON.stringify(body) : '';
      const fullContext = `${request.method} ${url} ${bodyStr}`;

      // Check if request matches any known honeytoken canary signatures
      const canaryKeywords = ['CANARY-VIP', 'CANARY-ROOT', 'CANARY-SURCHARGE', 'VIP-CANARY-JUSTICE-901'];
      const matchedKeyword = canaryKeywords.find(kw => fullContext.includes(kw));

      if (matchedKeyword) {
        const session = (request as any).session;
        const tenantId = session?.tenantId || (request.headers['x-tenant-id'] as string) || '6855be07-5298-4148-a571-c51ac49ac7f3';
        const actorId = session?.userId || 'INSIDER-UNKNOWN';
        const actorName = session?.name || 'Rogue Staff / DB Scraper';
        const actorRole = session?.roles?.[0] || 'UNAUTHORIZED_SNOOPER';
        const clientIp = request.ip || '127.0.0.1';

        // Silently record incident into database
        const incidentId = crypto.randomUUID();
        const evidence = {
          matchedKeyword,
          method: request.method,
          url,
          userAgent: request.headers['user-agent'] || 'Unknown Agent',
          capturedAt: new Date().toISOString()
        };

        // Query active trap id
        const db = getDatabase();
        const trapRows = await db.execute(sql`
          SELECT id FROM company_honeytoken_traps 
          WHERE decoy_entity_id LIKE ${`%${matchedKeyword}%`} OR tenant_id = ${tenantId}
          LIMIT 1
        `);

        const trapId = (trapRows.rows?.[0] as any)?.id || crypto.randomUUID();

        // Increment trip count
        await db.execute(sql`
          UPDATE company_honeytoken_traps 
          SET trip_count = trip_count + 1 
          WHERE id = ${trapId}
        `);

        // Insert incident record
        await db.execute(sql`
          INSERT INTO company_honeytoken_incidents (
            id, trap_id, actor_id, actor_name, actor_role, client_ip, query_context, captured_session_evidence, is_isolated
          ) VALUES (
            ${incidentId}, ${trapId}, ${actorId}, ${actorName}, ${actorRole}, ${clientIp}, ${fullContext}, ${evidence}::jsonb, FALSE
          )
        `);

        pushHoneytokenIncident({
          id: incidentId,
          trapId: String(trapId),
          actorId,
          actorName,
          actorRole,
          clientIp,
          queryContext: fullContext,
          capturedEvidence: evidence,
          tripTimestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      // Non-blocking silent catch so attacker doesn't know they triggered a tripwire
      fastify.log.warn({ err }, 'Honeytoken tripwire evaluation notice');
    }
  });
};
