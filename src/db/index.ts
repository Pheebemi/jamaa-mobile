import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './migrations/migrations';
import * as schema from './schema';

export const expoDb = openDatabaseSync('jamaa.db');

export const db = drizzle(expoDb, { schema });

export async function runMigrations() {
  await migrate(db, migrations);
}
