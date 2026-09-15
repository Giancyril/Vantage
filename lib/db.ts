import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const isRealDbUrl = (url?: string) =>
  Boolean(url && (url.startsWith("postgresql://") || url.startsWith("postgres://")) && !url.includes("[PASSWORD]") && !url.includes("[PROJECT]"));

const globalForDb = globalThis as unknown as { _pg?: ReturnType<typeof postgres> };

let client: ReturnType<typeof postgres> | undefined = globalForDb._pg;

if (!client && isRealDbUrl(process.env.DATABASE_URL)) {
  try {
    client = postgres(process.env.DATABASE_URL!, { max: 10 });
    if (process.env.NODE_ENV !== "production") globalForDb._pg = client;
  } catch (e) {
    console.warn("Could not connect to postgres:", e);
  }
}

export const db = client ? drizzle(client, { schema }) : ({} as any);
export const hasDatabase = Boolean(client);
