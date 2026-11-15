import { getDatabase, sql } from '../packages/database/dist/index.js';

async function main() {
  const db = getDatabase();
  const tables = (await db.execute(sql`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name LIKE '%bed%turnaround%' OR table_name LIKE '%blood_bank%';
  `)).rows;

  console.log('Tables:', tables);

  for (const t of tables) {
    const cols = (await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = ${t.table_schema} AND table_name = ${t.table_name};
    `)).rows;
    console.log(`\nColumns of ${t.table_schema}.${t.table_name}:`);
    console.log(cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }
}

main().catch(console.error).then(() => process.exit(0));
