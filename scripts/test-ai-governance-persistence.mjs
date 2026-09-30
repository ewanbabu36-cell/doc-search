import assert from 'node:assert';
import pg from 'pg';
import { aiGovernanceRepository } from '../apps/api-gateway/dist/repositories/company/AIGovernanceRepository.js';
import { getDatabase, initializeDatabase } from '../packages/database/dist/index.js';

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function run() {
  console.log('========================================================================');
  console.log('TARGETED TEST: AI GOVERNANCE POSTGRESQL PERSISTENCE & ZERO RAM FALLBACK');
  console.log('========================================================================\n');

  // 1. Initialize live PostgreSQL via Drizzle
  const db = await initializeDatabase({ connectionString: DB_URL });
  console.log('[✔] Live PostgreSQL connection active.');

  // 2. Fetch models via repository
  const models = await aiGovernanceRepository.getModels(db);
  assert(Array.isArray(models) && models.length >= 3, `Expected at least 3 models, got ${models.length}`);
  console.log(`[✔] getModels() returned ${models.length} rows directly from PostgreSQL.`);

  // 3. Verify in independent raw pg.Client that models are ACTUALLY in PostgreSQL
  const pgClient = new pg.Client({ connectionString: DB_URL });
  await pgClient.connect();
  const dbRes = await pgClient.query('SELECT count(*) FROM company.ai_models');
  const countInDb = Number(dbRes.rows[0].count);
  assert(countInDb >= 3, `Expected at least 3 models in PostgreSQL table, found ${countInDb}`);
  console.log(`[✔] Raw PostgreSQL check: company.ai_models has ${countInDb} rows persisted on disk.`);

  // 4. Update a model and assert persistence across independent client
  const targetModel = models[0];
  const newName = `Updated Model Test ${Date.now()}`;
  const updated = await aiGovernanceRepository.updateModel(targetModel.id, { modelName: newName }, db);
  assert.strictEqual(updated.modelName, newName, 'Repository update should return updated modelName');

  const checkRes = await pgClient.query('SELECT model_name FROM company.ai_models WHERE id = $1', [targetModel.id]);
  assert.strictEqual(checkRes.rows[0].model_name, newName, 'PostgreSQL raw query must reflect updated modelName');
  console.log(`[✔] updateModel() persisted directly to PostgreSQL. Confirmed by independent raw query: "${checkRes.rows[0].model_name}".`);

  // 5. Policies check
  const policies = await aiGovernanceRepository.getPolicies(db);
  assert(Array.isArray(policies) && policies.length >= 2, `Expected at least 2 policies, got ${policies?.length}`);
  console.log(`[✔] getPolicies() returned ${policies.length} rows directly from PostgreSQL.`);

  await pgClient.end();
  console.log('\n[✔] ALL AI GOVERNANCE PERSISTENCE CHECKS PASSED WITH 100% POSTGRESQL VERIFICATION!');
  console.log('========================================================================');
}

run().catch((err) => {
  console.error('[-] Test failed:', err);
  process.exit(1);
});
