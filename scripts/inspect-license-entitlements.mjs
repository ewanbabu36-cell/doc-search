import { getDatabase, licenses, planEntitlements, plans, features } from '../packages/database/dist/index.js';

async function run() {
  const db = getDatabase();
  console.log('[*] Querying licenses in live database...');
  const lics = await db.select().from(licenses);
  console.log('Licenses found:', lics.length);
  lics.forEach(l => {
    console.log(`- License ID: ${l.id}, Tenant: ${l.tenantId}, Plan: ${l.planId}, Status: ${l.status}`);
  });

  const pls = await db.select().from(plans);
  console.log('\nPlans found:', pls.length);
  pls.forEach(p => console.log(`- Plan ID: ${p.id}, Code: ${p.code}, Name: ${p.name}`));

  const ents = await db.select().from(planEntitlements);
  console.log('\nPlan Entitlements found in DB:', ents.length);
  ents.forEach(e => console.log(`- PlanID: ${e.planId}, FeatureID: ${e.featureId}, Type: ${e.entitlementType}`));

  const feats = await db.select().from(features);
  console.log('\nFeatures found in DB:', feats.length);
  feats.forEach(f => console.log(`- Feature ID: ${f.id}, Code: ${f.code}, Name: ${f.name}`));
}

run().catch(console.error);
