import { getDb, initDatabaseSync } from '../lib/db';

async function main() {
  console.log('Initializing database tables and initial settings...');
  const db = getDb();
  await initDatabaseSync(db);
  console.log('✓ Database initialization complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

