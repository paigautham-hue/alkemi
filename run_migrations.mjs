import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL not set');

const conn = await mysql.createConnection(dbUrl);

const migrations = [
  'drizzle/0001_agent_memory_tables.sql',
  'drizzle/0002_prediction_provenance.sql',
  'drizzle/0003_materials_v2.sql',
  'drizzle/0004_calibration_and_ingestion.sql'
];

for (const file of migrations) {
  console.log(`\n=== Running ${file} ===`);
  const sql = fs.readFileSync(path.join('/home/ubuntu/alkemi', file), 'utf8');
  // Split on --> statement-breakpoint or semicolon boundaries
  const statements = sql
    .split(/-->.*?statement-breakpoint/g)
    .flatMap(s => s.split(/;\s*\n/))
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0);
  
  for (const stmt of statements) {
    if (!stmt.trim()) continue;
    try {
      await conn.execute(stmt);
      console.log(`  ✓ ${stmt.substring(0, 60).replace(/\n/g, ' ')}...`);
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_TABLE_EXISTS_ERROR' || 
          err.message.includes('Duplicate column') || err.message.includes('already exists')) {
        console.log(`  ⚠ Already exists (skipping): ${err.message.substring(0, 80)}`);
      } else {
        console.error(`  ✗ Error: ${err.message}`);
        console.error(`  Statement: ${stmt.substring(0, 100)}`);
      }
    }
  }
  console.log(`  ✅ ${file} complete`);
}

await conn.end();
console.log('\n🎉 All migrations complete!');
