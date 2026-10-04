import type { FastifyPluginAsync } from 'fastify';
import { redisDistributedLockManager } from '@docsearch/auth';

export const distributedLockRoutes: FastifyPluginAsync = async (app) => {
  // 1. Generic Distributed Lock Acquisition
  app.post('/api/v1/locks/acquire', async (req, reply) => {
    const body = (req.body || {}) as { resource?: string; ttlSeconds?: number; lockOwner?: string };
    if (!body.resource) {
      return reply.code(400).send({ success: false, error: 'Resource identifier is required' });
    }

    const result = await redisDistributedLockManager.acquireLock(
      body.resource,
      body.ttlSeconds || 30,
      body.lockOwner
    );

    if (!result.acquired) {
      return reply.code(409).send({
        success: false,
        message: `Resource "${body.resource}" is currently held by another transaction or workstation`,
        lock: result
      });
    }

    return reply.code(200).send({
      success: true,
      lock: result
    });
  });

  // 2. Generic Distributed Lock Release
  app.post('/api/v1/locks/release', async (req, reply) => {
    const body = (req.body || {}) as { resource?: string; lockOwner?: string };
    if (!body.resource || !body.lockOwner) {
      return reply.code(400).send({ success: false, error: 'Resource and lockOwner are required' });
    }

    const released = await redisDistributedLockManager.releaseLock(body.resource, body.lockOwner);
    return reply.code(200).send({
      success: released,
      resource: body.resource
    });
  });

  // 3. Bed Reservation Mutex Lock
  app.post('/api/v1/locks/bed', async (req, reply) => {
    const body = (req.body || {}) as { tenantId?: string; wardId?: string; bedId?: string; ttlSeconds?: number };
    if (!body.tenantId || !body.wardId || !body.bedId) {
      return reply.code(400).send({ success: false, error: 'tenantId, wardId, and bedId are required' });
    }

    const lock = await redisDistributedLockManager.acquireBedLock(
      body.tenantId,
      body.wardId,
      body.bedId,
      body.ttlSeconds || 45
    );

    if (!lock.acquired) {
      return reply.code(409).send({
        success: false,
        message: 'This bed is currently undergoing allocation or transfer by another staff member.',
        lock
      });
    }

    return reply.code(200).send({ success: true, lock });
  });

  // 4. OPD Token Queue Mutex Lock
  app.post('/api/v1/locks/queue', async (req, reply) => {
    const body = (req.body || {}) as { tenantId?: string; department?: string; dateIso?: string; ttlSeconds?: number };
    if (!body.tenantId || !body.department) {
      return reply.code(400).send({ success: false, error: 'tenantId and department are required' });
    }

    const dateStr = body.dateIso || new Date().toISOString();
    const lock = await redisDistributedLockManager.acquireQueueLock(
      body.tenantId,
      body.department,
      dateStr,
      body.ttlSeconds || 15
    );

    if (!lock.acquired) {
      return reply.code(409).send({
        success: false,
        message: 'OPD Queue sequence allocation busy. Retrying in 50ms...',
        lock
      });
    }

    return reply.code(200).send({ success: true, lock });
  });

  // 5. Operating Theatre Room Schedule Mutex Lock
  app.post('/api/v1/locks/ot', async (req, reply) => {
    const body = (req.body || {}) as { tenantId?: string; otRoomId?: string; scheduledDate?: string; startTime?: string; ttlSeconds?: number };
    if (!body.tenantId || !body.otRoomId) {
      return reply.code(400).send({ success: false, error: 'tenantId and otRoomId are required' });
    }

    const dateStr = body.scheduledDate || new Date().toISOString().slice(0, 10);
    const timeStr = body.startTime || '08:00';
    const lock = await redisDistributedLockManager.acquireOtSlotLock(
      body.tenantId,
      body.otRoomId,
      dateStr,
      timeStr,
      body.ttlSeconds || 60
    );

    if (!lock.acquired) {
      return reply.code(409).send({
        success: false,
        message: 'OT Suite is currently being scheduled by another surgical team.',
        lock
      });
    }

    return reply.code(200).send({ success: true, lock });
  });

  // 6. Lock Telemetry Status
  app.get('/api/v1/locks/status', async (_req, reply) => {
    return reply.code(200).send({
      service: 'DocSearch High-Availability Distributed Lock & Concurrency Engine',
      status: 'ONLINE',
      supportedBackends: ['REDIS_CLUSTER', 'LOCAL_HYBRID_LOCK'],
      features: [
        'FENCING_TOKENS',
        'ATOMIC_LUA_RELEASE',
        'KEEP_ALIVE_HEARTBEAT',
        'AUTOMATIC_POSTGRES_FAILOVER'
      ],
      timestamp: new Date().toISOString()
    });
  });
};
