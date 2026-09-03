import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';

interface IdempotentRecord {
  statusCode: number;
  payload: string;
  contentType?: string | undefined;
  createdAt: number;
}

// Transaction idempotency cache (TTL: 10 minutes)
const idempotencyStore = new Map<string, IdempotentRecord>();

export async function idempotencyPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.headers['x-idempotency-key'] as string | undefined;
    if (!key) return;

    const cached = idempotencyStore.get(key);
    if (cached) {
      if (Date.now() - cached.createdAt < 600000) {
        reply.header('x-cache', 'IDEMPOTENT_HIT');
        if (cached.contentType) {
          reply.type(cached.contentType);
        }
        return reply.status(cached.statusCode).send(cached.payload);
      } else {
        idempotencyStore.delete(key);
      }
    }
  });

  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
    const key = request.headers['x-idempotency-key'] as string | undefined;
    if (!key || reply.getHeader('x-cache') === 'IDEMPOTENT_HIT') return payload;

    if (reply.statusCode >= 200 && reply.statusCode < 400 && typeof payload === 'string') {
      const ctHeader = reply.getHeader('content-type');
      const contentType = typeof ctHeader === 'string' ? ctHeader : undefined;
      idempotencyStore.set(key, {
        statusCode: reply.statusCode,
        payload,
        contentType,
        createdAt: Date.now()
      });
    }

    return payload;
  });
}
