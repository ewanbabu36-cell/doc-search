import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDatabase,
  getReadDatabase,
  getWriteDatabase,
  getDatabasePoolMetrics,
  getDatabaseStatus,
  closeDatabase
} from '../dist/index.js';

test('Database: Read/Write pool resolution and metrics', async () => {
  const writeDb = getWriteDatabase();
  assert.ok(writeDb, 'Write DB instance must be available');

  // When no replica URL is configured, read DB resolves to primary
  const readDb = getReadDatabase();
  assert.ok(readDb, 'Read DB instance must be available');

  const metrics = getDatabasePoolMetrics();
  assert.ok('primary' in metrics);
  assert.equal(typeof metrics.primary.total, 'number');

  await closeDatabase();
});
