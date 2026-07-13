import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

type PostgresClient = ReturnType<typeof postgres>;

const globalForPostgres = globalThis as typeof globalThis & {
  makersEyePostgresClient?: PostgresClient;
};

const client =
  globalForPostgres.makersEyePostgresClient ??
  postgres(process.env.DATABASE_URL!, { prepare: false });
globalForPostgres.makersEyePostgresClient = client;

export const db = drizzle({ client });
