import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const isRealDbUrl = (url?: string) =>
  Boolean(
    url &&
    (url.startsWith("postgresql://") || url.startsWith("postgres://")) &&
    !url.includes("[PASSWORD]") &&
    !url.includes("[PROJECT]")
  );

type GlobalWithDb = typeof globalThis & { _pg?: ReturnType<typeof postgres> };
const g = globalThis as GlobalWithDb;

let client: ReturnType<typeof postgres> | undefined = g._pg;

if (!client && isRealDbUrl(process.env.DATABASE_URL)) {
  try {
    client = postgres(process.env.DATABASE_URL!, { max: 10 });
    if (process.env.NODE_ENV !== "production") g._pg = client;
  } catch (e) {
    console.warn("Could not connect to postgres:", e);
  }
}

// When DATABASE_URL is not configured we export an empty stub so that
// build-time imports don't crash. All callers guard with `hasDatabase`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = client ? drizzle(client, { schema }) : ({} as any);
export const hasDatabase = Boolean(client);
