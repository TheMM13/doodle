import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({ connectionString: env.databaseUrl });

// Managed Postgres providers (e.g. Neon) drop idle pooled connections; pg
// surfaces that as an 'error' event on the pool, which crashes the whole
// process if unhandled. The pool discards the broken client and opens a
// fresh one on the next query, so logging is all that's needed here.
pool.on("error", (err) => {
  console.error("Idle Postgres client error (pool will reconnect):", err.message);
});

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]) {
  return pool.query<T>(text, params);
}
