import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  pg: ReturnType<typeof postgres> | undefined;
};

// postgres.js is lazy — no TCP connection until the first query.
// At build time DATABASE_URL is absent; the placeholder lets the module
// evaluate so DrizzleAdapter can type-check the schema.  Any actual
// query without a real URL will fail with a connection error.
const connectionString =
  process.env.DATABASE_URL ?? 'postgres://build:build@localhost:5432/build';

const client =
  globalForDb.pg ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pg = client;
}

export const db = drizzle(client, { schema });
export { schema };
