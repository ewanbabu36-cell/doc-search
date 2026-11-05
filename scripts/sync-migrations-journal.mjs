import fs from 'fs';
import path from 'path';

const migrationsDir = path.resolve('packages/database/migrations');
const journalPath = path.resolve(migrationsDir, 'meta/_journal.json');
const rollbacksDir = path.resolve(migrationsDir, 'rollbacks');

if (!fs.existsSync(rollbacksDir)) {
  fs.mkdirSync(rollbacksDir, { recursive: true });
}

// 1. Move rollback
const oldRollback = path.join(migrationsDir, '0070_rollback_rls_hardening.sql');
const newRollback = path.join(rollbacksDir, '0069_rollback_rls_hardening.sql');
if (fs.existsSync(oldRollback)) {
  fs.renameSync(oldRollback, newRollback);
  console.log('Moved rollback to:', newRollback);
}

// 2. Rename 0070 to 0069
const old0070 = path.join(migrationsDir, '0070_comprehensive_tenant_rls_hardening.sql');
const new0069 = path.join(migrationsDir, '0069_comprehensive_tenant_rls_hardening.sql');
if (fs.existsSync(old0070)) {
  fs.renameSync(old0070, new0069);
  console.log('Renamed 0070 to:', new0069);
}

// 3. Rename 0071 to 0070
const old0071 = path.join(migrationsDir, '0071_create_least_privilege_app_role.sql');
const new0070 = path.join(migrationsDir, '0070_create_least_privilege_app_role.sql');
if (fs.existsSync(old0071)) {
  fs.renameSync(old0071, new0070);
  console.log('Renamed 0071 to:', new0070);
}

// 4. Update _journal.json
const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));

// Check if tags already exist
const existingTags = new Set(journal.entries.map(e => e.tag));

if (!existingTags.has('0069_comprehensive_tenant_rls_hardening')) {
  journal.entries.push({
    idx: 69,
    version: "7",
    when: 1788550000000,
    tag: "0069_comprehensive_tenant_rls_hardening",
    breakpoints: true
  });
}

if (!existingTags.has('0070_create_least_privilege_app_role')) {
  journal.entries.push({
    idx: 70,
    version: "7",
    when: 1788551000000,
    tag: "0070_create_least_privilege_app_role",
    breakpoints: true
  });
}

fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2), 'utf8');
console.log('Updated _journal.json with entries 69 and 70.');
