import { createClient, Client } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

let client: Client | null = null;
let database: LibSQLDatabase<typeof schema> | null = null;

function getClient(): Client {
  if (!client) {
    if (!process.env.TURSO_DATABASE_URL) {
      throw new Error("TURSO_DATABASE_URL is not defined");
    }
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export function getDb(): LibSQLDatabase<typeof schema> {
  if (!database) {
    database = drizzle(getClient(), { schema });
  }
  return database;
}

// For backwards compatibility
export const db = {
  get instance() {
    return getDb();
  },
  insert: (...args: Parameters<LibSQLDatabase<typeof schema>["insert"]>) =>
    getDb().insert(...args),
  update: (...args: Parameters<LibSQLDatabase<typeof schema>["update"]>) =>
    getDb().update(...args),
  select: (...args: Parameters<LibSQLDatabase<typeof schema>["select"]>) =>
    getDb().select(...args),
  delete: (...args: Parameters<LibSQLDatabase<typeof schema>["delete"]>) =>
    getDb().delete(...args),
};

// Helper to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}
