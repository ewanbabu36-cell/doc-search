import pg from 'pg';

const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

const tables = [
  'dietary_kitchens',
  'dietary_diet_types',
  'dietary_food_items',
  'dietary_meal_schedules',
  'dietary_orders'
];

for (const t of tables) {
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'clinical' AND table_name = '${t}'
    ORDER BY ordinal_position
  `);
  console.log(`\nTable: clinical.${t} (${res.rows.length} columns)`);
  console.log(res.rows.map(r => `${r.column_name} (${r.data_type}${r.is_nullable === 'NO' ? ' NOT NULL' : ''})`).join(', '));
}

await client.end();
