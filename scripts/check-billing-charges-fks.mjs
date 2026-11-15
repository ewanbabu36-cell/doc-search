import pg from 'pg';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  const c = await client.query(`
    SELECT tc.table_schema, tc.table_name, kcu.column_name, 
           ccu.table_schema AS foreign_table_schema,
           ccu.table_name AS foreign_table_name,
           ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'billing_charges';
  `);
  console.log('billing_charges FKs:', c.rows);

  // Check rows in that foreign table
  if (c.rows.length > 0) {
    for (const row of c.rows) {
      const q = await client.query(`SELECT id FROM "${row.foreign_table_schema}"."${row.foreign_table_name}" LIMIT 3`);
      console.log(`Table ${row.foreign_table_schema}.${row.foreign_table_name} IDs:`, q.rows);
    }
  }

  await client.end();
}

main().catch(console.error);
